const express = require('express');
const axios = require('axios');
const router = express.Router();

const APP_HUB_CATALOG_URL = 'https://apps.ajaywebservices.in/api/ecosystem/apps';

// In-memory catalog cache (5 minute TTL)
let cache = {
  data: null,
  fetchedAt: 0,
  ttl: 5 * 60 * 1000
};

// Fallback applications if App Hub is offline
const FALLBACK_CATALOG = {
  success: true,
  applications: [
    {
      key: 'workflow-management-system',
      productKey: 'workflow-management-system',
      name: 'Workflow & Facility Management (FMS)',
      description: 'End-to-end facility orchestration, task automation, equipment tracking, and real-time operational workflows.',
      status: 'live',
      ecosystem: {
        category: 'Operations',
        homeUrl: 'https://workflow.ajaywebservices.in',
        launchUrl: 'https://workflow.ajaywebservices.in/settings'
      }
    },
    {
      key: 'dynamic-portfolio-toolkit',
      productKey: 'dynamic-portfolio-toolkit',
      name: 'Dynamic Portfolio Toolkit',
      description: 'Interactive portfolio creation and showcase platform with developer controls and multi-tenant profiles.',
      status: 'live',
      ecosystem: {
        category: 'Developer Tools',
        homeUrl: 'https://portfolio.ajaywebservices.in',
        launchUrl: 'https://portfolio.ajaywebservices.in/settings'
      }
    },
    {
      key: 'app-hub',
      productKey: 'app-hub',
      name: 'Central App Hub & SSO Authority',
      description: 'Single Sign-On & Ecosystem App Launcher with license provisioning and cross-application permissions.',
      status: 'live',
      ecosystem: {
        category: 'Platform Core',
        homeUrl: 'https://apps.ajaywebservices.in',
        launchUrl: 'https://apps.ajaywebservices.in/apps'
      }
    }
  ],
  count: 3,
  isPublicCatalog: true
};

router.get('/apps', async (req, res) => {
  const now = Date.now();
  if (cache.data && (now - cache.fetchedAt) < cache.ttl) {
    return res.json(cache.data);
  }

  try {
    const response = await axios.get(APP_HUB_CATALOG_URL, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        ...(req.headers.cookie ? { 'Cookie': req.headers.cookie } : {})
      }
    });

    if (response.data && response.data.success && Array.isArray(response.data.applications)) {
      cache = {
        data: response.data,
        fetchedAt: now,
        ttl: 5 * 60 * 1000
      };
      return res.json(response.data);
    }
  } catch (err) {
    console.warn('[Ecosystem Proxy Warning]:', err.message);
  }

  if (cache.data) {
    return res.json(cache.data);
  }

  return res.json(FALLBACK_CATALOG);
});

module.exports = router;
