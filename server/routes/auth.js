const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const jwksClient = require('jwks-rsa');
const User = require('../models/User');
const Session = require('../models/Session');
const { connectDB } = require('../config/db');

// ==========================================
// Central SLM Identity Provider (OIDC + PKCE S256)
// ==========================================
const slmBaseUrl = process.env.SLM_BASE_URL || process.env.SLM_ISSUER || 'https://app.ajaywebservices.in';
const defaultClientId = process.env.SLM_OIDC_CLIENT_ID || process.env.SLM_CLIENT_ID || 'client_telecall_crm';

// Setup JWKS client pointing to Central SLM
const jwks = jwksClient({
  jwksUri: `${slmBaseUrl}/api/v1/oauth/jwks`,
  cache: true,
  rateLimit: true,
  cacheMaxAge: 24 * 60 * 60 * 1000 // 24 hours
});

function getKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey ? key.getPublicKey() : key.rsaPublicKey;
    callback(null, signingKey);
  });
}

async function saveCrmSession(sessionToken, data) {
  try {
    return await Session.create({
      sessionToken,
      userId: data.userId,
      email: data.email,
      role: data.role,
      organisationId: data.organisationId,
      entitlements: data.entitlements || [],
      slmSub: data.slmSub,
      sid: data.sid || null,
      expiresAt: data.expiresAt
    });
  } catch (err) {
    console.error('[Session Save Error]:', err.message);
  }
}

async function upsertCrmUserFromClaims(claims) {
  const email = (claims.email || '').toLowerCase().trim();
  const slmSub = claims.sub;
  const name = claims.name || (email ? email.split('@')[0] : 'SLM User');
  const avatar = claims.picture || claims.avatar || null;
  const entitlements = claims.entitlements || [];
  const organisationId = claims.organisation_id || null;

  const isSuperAdmin =
    email === 'ajay22071997barman@gmail.com' ||
    email === 'ajay@ceoitbox.in' ||
    claims.is_superadmin === true ||
    claims.system_role?.toLowerCase() === 'superadmin' ||
    (Array.isArray(claims.roles) && claims.roles.some(r => typeof r === 'string' && r.toLowerCase() === 'superadmin')) ||
    (Array.isArray(claims.entitlements) && claims.entitlements.includes('*'));

  const isOrgAdmin = isSuperAdmin ||
    claims.organisation_role === 'Owner' ||
    claims.organisation_role === 'Admin' ||
    (Array.isArray(claims.roles) && claims.roles.some(r => typeof r === 'string' && r.toLowerCase() === 'admin'));

  const assignedRole = isSuperAdmin ? 'SuperAdmin' : (isOrgAdmin ? 'Admin' : 'Guest');

  let user = await User.findOne({
    $or: [
      { slmSub: slmSub },
      { email: email }
    ]
  });

  if (user) {
    user.slmSub = slmSub;
    if (!user.name && name) user.name = name;
    if (avatar && (!user.avatar || !user.isCustomAvatar)) user.avatar = avatar;
    if (entitlements && entitlements.length) user.entitlements = entitlements;
    if (organisationId) user.currentOrganisationId = organisationId;
    if (isSuperAdmin) {
      user.systemRole = 'SuperAdmin';
      user.permissions = ['ALL'];
    } else if (isOrgAdmin && user.systemRole === 'Guest') {
      user.systemRole = 'Admin';
    }
    user.lastLogin = new Date();
    await user.save();
  } else {
    user = await User.create({
      name,
      email,
      slmSub,
      avatar,
      entitlements,
      currentOrganisationId: organisationId,
      systemRole: assignedRole,
      status: 'Active',
      permissions: isSuperAdmin ? ['ALL'] : [],
      lastLogin: new Date()
    });
  }
  return user;
}

function getCookieDomain(req) {
  const host = (req.get('x-forwarded-host') || req.get('host') || '').split(':')[0].toLowerCase();
  if (host.endsWith('ajaywebservices.in')) {
    return '.ajaywebservices.in';
  }
  return undefined;
}

function getRedirectUri(req) {
  const forwardedHost = req.get('x-forwarded-host');
  const rawHost = (forwardedHost || req.get('host') || '').split(':')[0].toLowerCase();
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';

  // 1. Local development
  if (rawHost.includes('localhost') || rawHost.includes('127.0.0.1')) {
    const port = (req.get('host') || '').split(':')[1] || '8000';
    return `${protocol}://${rawHost}:${port}/api/auth/oidc/callback`;
  }

  // 2. Custom domain on ajaywebservices.in
  if (rawHost.endsWith('ajaywebservices.in')) {
    return 'https://crm.ajaywebservices.in/api/auth/oidc/callback';
  }

  // 3. Vercel deployment (preview or *.vercel.app)
  if (rawHost.endsWith('vercel.app')) {
    return `https://${rawHost}/api/auth/oidc/callback`;
  }

  // 4. Fallback to env or canonical domain
  if (process.env.SLM_OIDC_REDIRECT_URI) return process.env.SLM_OIDC_REDIRECT_URI;
  if (process.env.SLM_REDIRECT_URI) return process.env.SLM_REDIRECT_URI;
  return 'https://crm.ajaywebservices.in/api/auth/oidc/callback';
}

// Handler: Initiate OIDC Login
const handleOidcLogin = (req, res) => {
  try {
    const state = crypto.randomBytes(24).toString('hex');
    const nonce = crypto.randomBytes(24).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    const redirectUri = getRedirectUri(req);
    const returnUrl = req.query.returnUrl && req.query.returnUrl.startsWith('/') && !req.query.returnUrl.startsWith('//')
      ? req.query.returnUrl
      : '/';

    const isProduction = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true';
    const cookieDomain = getCookieDomain(req);
    const cookieOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000, // 10 minutes
      ...(cookieDomain ? { domain: cookieDomain } : {})
    };

    res.cookie('oidc_state', state, cookieOpts);
    res.cookie('oidc_nonce', nonce, cookieOpts);
    res.cookie('oidc_verifier', codeVerifier, cookieOpts);
    res.cookie('oidc_return', returnUrl, cookieOpts);

    const clientId = process.env.SLM_OIDC_CLIENT_ID || defaultClientId;
    const authUrl = new URL(`${slmBaseUrl}/api/v1/oauth/authorize`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'openid profile email organisation entitlements');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    if (req.query.organisation_id) {
      authUrl.searchParams.set('organisation_id', req.query.organisation_id);
    }
    if (req.query.prompt) {
      authUrl.searchParams.set('prompt', req.query.prompt);
    }

    return res.redirect(authUrl.toString());
  } catch (err) {
    console.error('[OIDC Login Error]:', err);
    res.status(500).json({ error: 'Failed to initiate OIDC authorization' });
  }
};

// Handler: OIDC Callback
const handleOidcCallback = async (req, res) => {
  try {
    // Ensure DB is connected (critical for Vercel serverless cold starts)
    await connectDB();

    const { code, state, error, error_description } = req.query;

    if (error) {
      return res.redirect(`/login?auth_error=${encodeURIComponent(error_description || error)}`);
    }

    const expectedState = req.cookies?.oidc_state || req.cookies?.slm_oauth_state;
    if (!expectedState || state !== expectedState) {
      return res.redirect('/login?auth_error=' + encodeURIComponent('Invalid or expired OIDC state parameter. Please try again.'));
    }

    const expectedNonce = req.cookies?.oidc_nonce || req.cookies?.slm_nonce;
    const codeVerifier = req.cookies?.oidc_verifier || req.cookies?.slm_code_verifier;
    const returnUrl = req.cookies?.oidc_return || '/';

    const isProduction = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true';
    const cookieDomain = getCookieDomain(req);
    const clearOpts = {
      path: '/',
      ...(cookieDomain ? { domain: cookieDomain } : {})
    };
    res.clearCookie('oidc_state', clearOpts);
    res.clearCookie('oidc_nonce', clearOpts);
    res.clearCookie('oidc_verifier', clearOpts);
    res.clearCookie('oidc_return', clearOpts);
    res.clearCookie('slm_oauth_state', clearOpts);
    res.clearCookie('slm_nonce', clearOpts);
    res.clearCookie('slm_code_verifier', clearOpts);
    if (cookieDomain) {
      res.clearCookie('oidc_state', { path: '/' });
      res.clearCookie('oidc_nonce', { path: '/' });
      res.clearCookie('oidc_verifier', { path: '/' });
      res.clearCookie('oidc_return', { path: '/' });
    }

    if (!code || !codeVerifier) {
      return res.redirect('/login?auth_error=' + encodeURIComponent('Missing authorization code or PKCE verifier.'));
    }

    const redirectUri = getRedirectUri(req);
    const clientId = process.env.SLM_OIDC_CLIENT_ID || defaultClientId;

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier
    });
    if (process.env.SLM_OIDC_CLIENT_SECRET) {
      tokenParams.append('client_secret', process.env.SLM_OIDC_CLIENT_SECRET);
    }

    const tokenRes = await axios.post(`${slmBaseUrl}/api/v1/oauth/token`, tokenParams.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      timeout: 10000
    });

    const tokenData = tokenRes.data;
    if (!tokenData.id_token) {
      throw new Error('No id_token received from SLM');
    }

    const claims = await new Promise((resolve, reject) => {
      jwt.verify(
        tokenData.id_token,
        getKey,
        {
          algorithms: ['RS256'],
          issuer: slmBaseUrl,
          audience: clientId
        },
        (err, decoded) => {
          if (err) return reject(err);
          if (expectedNonce && decoded.nonce !== expectedNonce) {
            return reject(new Error('Nonce mismatch in ID token'));
          }
          resolve(decoded);
        }
      );
    });

    const user = await upsertCrmUserFromClaims(claims);

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const orgId = claims.organisation_id || user.currentOrganisationId || `org_personal_${user._id}`;
    const userEntitlements = claims.entitlements || claims.products || user.entitlements || [];
    await saveCrmSession(sessionToken, {
      userId: user._id,
      email: claims.email,
      role: user.role || user.systemRole,
      organisationId: orgId,
      entitlements: userEntitlements,
      slmSub: claims.sub,
      sid: claims.sid || null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    res.cookie('crm_session', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
      ...(cookieDomain ? { domain: cookieDomain } : {})
    });

    res.redirect(returnUrl);
  } catch (err) {
    console.error('[OIDC Callback Error]:', err);
    res.redirect(`/login?auth_error=${encodeURIComponent('Authentication failed: ' + err.message)}`);
  }
};

// Initiate OIDC Login endpoints (standard + alias)
router.get('/oidc/login', handleOidcLogin);
router.get('/slm/login', handleOidcLogin);

// OIDC Callback endpoints (standard + alias)
router.get('/oidc/callback', handleOidcCallback);
router.get('/slm/callback', handleOidcCallback);

// Handler: OIDC Back-Channel Logout (OpenID Connect Back-Channel Logout 1.0)
const handleBackchannelLogout = async (req, res) => {
  try {
    await connectDB();

    const logoutToken = req.body?.logout_token || req.query?.logout_token;

    if (!logoutToken) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'Missing logout_token parameter' });
    }

    // 1. Verify RS256 signature using Central SLM JWKS
    const clientId = process.env.SLM_OIDC_CLIENT_ID || defaultClientId;
    const claims = await new Promise((resolve, reject) => {
      jwt.verify(
        logoutToken,
        getKey,
        {
          algorithms: ['RS256'],
          issuer: slmBaseUrl,
          audience: clientId
        },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded);
        }
      );
    });

    // 2. Validate OIDC Backchannel Logout Claims
    // - Must have events claim with 'http://schemas.openid.net/event/backchannel-logout'
    if (!claims.events || !claims.events['http://schemas.openid.net/event/backchannel-logout']) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'Missing backchannel logout event claim' });
    }

    // - Must NOT contain a nonce (spec requirement)
    if (claims.nonce) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'Logout token must not contain a nonce claim' });
    }

    // - Must contain either sub or sid
    if (!claims.sub && !claims.sid) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'Logout token must contain sub or sid' });
    }

    // 3. Invalidate matching sessions in database
    const conditions = [];
    if (claims.sid) {
      conditions.push({ sid: claims.sid });
      conditions.push({ sessionToken: claims.sid });
    }
    if (claims.sub) {
      conditions.push({ slmSub: claims.sub });
    }

    const deleteResult = await Session.deleteMany({ $or: conditions });
    console.log(`[Backchannel Logout] Revoked ${deleteResult.deletedCount} session(s) for sub=${claims.sub}, sid=${claims.sid}`);

    // 4. Return HTTP 200 with Cache-Control: no-store
    return res.set({
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache'
    }).status(200).send();
  } catch (err) {
    console.error('[Backchannel Logout Error]:', err.message);
    return res.status(400).json({ error: 'invalid_request', error_description: err.message });
  }
};

router.post('/oidc/backchannel-logout', handleBackchannelLogout);
router.post('/slm/backchannel-logout', handleBackchannelLogout);

// GET /api/auth/me: Session & Current User
router.get('/me', async (req, res) => {
  try {
    await connectDB();

    const sessionToken = req.cookies?.crm_session || req.header('Authorization')?.replace('Bearer ', '');
    if (!sessionToken) {
      return res.status(401).json({ authenticated: false, user: null });
    }

    let session = await Session.findOne({ sessionToken });
    let user = null;

    if (session && new Date() < new Date(session.expiresAt)) {
      user = await User.findById(session.userId).select('-password');
    } else {
      try {
        const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET || 'crm_telecaller_session_secret_key_2024_secure_random_string');
        user = await User.findById(decoded.userId).select('-password');
      } catch (_) {}
    }

    if (!user) {
      return res.status(401).json({ authenticated: false, user: null });
    }

    const activeOrgId = session?.organisationId || user.currentOrganisationId || `org_personal_${user._id}`;
    const isPersonal = !activeOrgId || activeOrgId.startsWith('org_personal_');
    const orgType = isPersonal ? 'Personal' : 'Business';
    const orgName = isPersonal ? `${user.name || 'Personal'}'s Workspace` : (user.organisationName || activeOrgId);
    const activeEntitlements = session?.entitlements?.length ? session.entitlements : (user.entitlements || []);

    res.json({
      authenticated: true,
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.systemRole || user.role || 'User',
        systemRole: user.systemRole,
        customRole: user.customRole,
        permissions: user.permissions || [],
        avatar: user.avatar,
        organisationId: activeOrgId,
        organisationType: orgType,
        organisationName: orgName,
        entitlements: activeEntitlements
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout: Centralized Logout
router.post('/logout', async (req, res) => {
  try {
    await connectDB();

    const sessionToken = req.cookies?.crm_session;
    if (sessionToken) {
      await Session.deleteOne({ sessionToken });
    }

    const cookieDomain = getCookieDomain(req);
    res.clearCookie('crm_session', { path: '/' });
    if (cookieDomain) {
      res.clearCookie('crm_session', { domain: cookieDomain, path: '/' });
    }

    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      res.clearCookie('atlas_session', { domain: '.ajaywebservices.in', path: '/' });
      res.clearCookie('apphub_session', { domain: '.ajaywebservices.in', path: '/' });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint for Gmail OAuth2 configuration
router.get('/gmail-config-check', (req, res) => {
    const config = {
        hasClientId: !!process.env.GMAIL_OAUTH_CLIENT_ID,
        hasClientSecret: !!process.env.GMAIL_OAUTH_CLIENT_SECRET,
        hasRefreshToken: !!process.env.GMAIL_OAUTH_REFRESH_TOKEN,
        hasEmail: !!process.env.GMAIL_APP_EMAIL,
        email: process.env.GMAIL_APP_EMAIL ? process.env.GMAIL_APP_EMAIL.substring(0, 3) + '***' : 'not set'
    };
    
    const allConfigured = config.hasClientId && config.hasClientSecret && config.hasRefreshToken && config.hasEmail;
    
    res.json({
        status: allConfigured ? 'configured' : 'missing_config',
        config,
        message: allConfigured 
            ? 'Gmail OAuth2 appears to be configured' 
            : 'Missing required Gmail OAuth2 environment variables'
    });
});

// Avatar upload routes
const upload = require('../middleware/uploadMiddleware');
const auth = require('../middleware/auth');

router.post('/upload-avatar',
    auth,
    upload.single('avatar'),
    authController.uploadAvatar
);

router.post('/select-avatar',
    auth,
    authController.selectAvatar
);

module.exports = router;
