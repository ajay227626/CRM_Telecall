# Meta Lead Ads Integration - Platform Admin Setup Guide

## Overview

This guide is for **platform administrators** who need to set up the Meta (Facebook/Instagram) Lead Ads integration at the infrastructure level. This includes creating the Meta App, configuring webhooks, and obtaining the necessary credentials.

> **Audience**: Technical administrators with access to Meta Developer Portal and server configuration.

## Prerequisites

- Meta Developer Account (create at [developers.facebook.com](https://developers.facebook.com))
- Facebook Business Page
- Server with HTTPS endpoint for webhooks
- Admin access to the CRM backend environment variables

---

## Step 1: Create a Meta App

### 1.1 Access Meta Developer Portal

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Sign in with your Facebook account
3. Click **"My Apps"** in the top navigation
4. Click **"Create App"**

### 1.2 Configure App Settings

1. Select app type: **"Business"**
2. Fill in app details:
   - **App Name**: `[YourCompany] CRM Integration`
   - **App Contact Email**: Your support email
   - **Business Account**: Select your Facebook Business Manager
3. Click **"Create App"**

### 1.3 Note Your App Credentials

After creation, go to **Settings → Basic**:

- **App ID**: Copy this value (needed for `META_APP_ID`)
- **App Secret**: Click "Show" and copy (needed for `META_APP_SECRET`)

---

## Step 2: Add Lead Ads Product

### 2.1 Add Product

1. In your Meta App dashboard, click **"Add Product"**
2. Find **"Lead Ads"** and click **"Set Up"**

### 2.2 Configure Permissions

1. Go to **App Review → Permissions and Features**
2. Request the following permissions:
   - `leads_retrieval` - Required to access lead form data
   - `pages_manage_ads` - Required to access page ads
   - `pages_show_list` - Required to list pages
   - `pages_read_engagement` - Required to read engagement data

> **Note**: Some permissions require app review. Submit for review once testing is complete.

---

## Step 3: Configure Webhooks

### 3.1 Generate Verify Token

1. Generate a random, secure string for webhook verification
2. Example: `meta_webhook_verify_2024_abc123xyz`
3. Save this as `META_VERIFY_TOKEN` in your environment variables

### 3.2 Set Up Webhook Endpoint

1. Go to **Products → Webhooks → Page**
2. Click **"Configure Webhooks"**
3. Enter webhook details:
   - **Callback URL**: `https://your-crm-domain.com/api/webhooks/meta`
   - **Verify Token**: The token you generated in step 3.1
4. Click **"Verify and Save"**

### 3.3 Subscribe to Lead Events

1. In the webhooks configuration, find the **"leadgen"** field
2. Click **"Subscribe"** to enable lead generation events
3. Your webhook status should show **"Active"**

> **Important**: Your server must be running and accessible via HTTPS for webhook verification to succeed.

---

## Step 4: Backend Environment Configuration

### 4.1 Update .env File

Add the following variables to your backend `.env` file:

```bash
# Meta App Credentials
META_APP_ID=your_app_id_from_step_1.3
META_APP_SECRET=your_app_secret_from_step_1.3

# Webhook Configuration
META_VERIFY_TOKEN=your_verify_token_from_step_3.1
WEBHOOK_BASE_URL=https://your-crm-domain.com

# Optional: Enable debug logging
META_DEBUG=true
```

### 4.2 Restart Backend Server

```bash
cd backend
npm restart
```

---

## Step 5: Test Webhook Integration

### 5.1 Send Test Event

1. Go to Meta App Dashboard → **Products → Webhooks**
2. Find the **leadgen** subscription
3. Click **"Test"** button
4. Select **"leadgen"** test event
5. Click **"Send to My Server"**

### 5.2 Verify Backend Logs

Check your backend logs for:

```
✅ Meta webhook verified successfully
✅ Received Meta webhook: leadgen
```

### 5.3 Common Issues

| Issue                       | Solution                                                         |
| --------------------------- | ---------------------------------------------------------------- |
| Webhook verification failed | Check `META_VERIFY_TOKEN` matches in both Meta portal and `.env` |
| 404 error on callback URL   | Ensure `/api/webhooks/meta` route is configured in backend       |
| SSL certificate error       | Use valid HTTPS certificate on production domain                 |

---

## Step 6: App Review (Production Only)

### 6.1 Development vs Production

- **Development Mode**: App can only be used by app admins/developers
- **Live Mode**: Requires Meta app review approval

### 6.2 Submit for Review

1. Go to **App Review → Permissions and Features**
2. Request review for:
   - `leads_retrieval`
   - `pages_manage_ads`
   - `pages_show_list`
   - `pages_read_engagement`
3. Provide use case description:
   ```
   Our CRM integrates with Facebook Lead Ads to automatically import leads
   from our Facebook pages into our business management system. This allows
   our sales team to follow up with leads quickly and efficiently.
   ```
4. Add demo video showing the integration workflow
5. Submit for review (typically takes 1-3 business days)

---

## Step 7: Security Best Practices

### 7.1 Rotate App Secret

- Rotate `META_APP_SECRET` every 90 days
- Meta allows two active secrets simultaneously for zero-downtime rotation

### 7.2 Monitor Webhook Activity

- Regularly check webhook logs for unauthorized access attempts
- Set up alerts for webhook failures

### 7.3 Access Token Security

- Never expose access tokens in frontend code
- Store all tokens server-side only
- Implement token refresh logic for long-lived tokens

---

## Troubleshooting

### Webhook Not Receiving Events

1. **Check subscription status**: Ensure "leadgen" is subscribed in Meta portal
2. **Verify callback URL**: Must be publicly accessible via HTTPS
3. **Check backend logs**: Look for webhook verification errors
4. **Test token**: Ensure `META_VERIFY_TOKEN` matches exactly

### Access Token Errors

1. **Token expired**: Implement token refresh logic
2. **Permissions denied**: Re-authenticate with required permissions
3. **App not live**: Switch app to Live mode after app review approval

### Lead Data Not Syncing

1. **Check page permissions**: User must have admin access to the page
2. **Verify form subscription**: Forms must be explicitly subscribed
3. **Check CRM logs**: Look for lead import errors in backend

---

## Next Steps

After completing this platform setup:

1. **Share credentials** with CRM administrators (securely)
2. **Train CRM admins** on how to connect their Facebook pages (see CRM Admin User Guide)
3. **Monitor webhook activity** regularly
4. **Set up alerts** for integration failures

---

## Support Resources

- [Meta Lead Ads Documentation](https://developers.facebook.com/docs/marketing-api/guides/lead-ads)
- [Webhooks Documentation](https://developers.facebook.com/docs/graph-api/webhooks)
- [App Review Guidelines](https://developers.facebook.com/docs/app-review)

---

## Appendix: Environment Variables Reference

| Variable            | Description                         | Example                   |
| ------------------- | ----------------------------------- | ------------------------- |
| `META_APP_ID`       | Meta App ID from App Dashboard      | `1234567890123456`        |
| `META_APP_SECRET`   | Meta App Secret (keep confidential) | `abc123...`               |
| `META_VERIFY_TOKEN` | Webhook verification token          | `meta_verify_token_xyz`   |
| `WEBHOOK_BASE_URL`  | Public URL of your CRM backend      | `https://crm.example.com` |
| `META_DEBUG`        | Enable debug logging (optional)     | `true`                    |

---

**Last Updated**: February 2026  
**Version**: 1.0
