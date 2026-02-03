# Gmail OAuth2 Troubleshooting Guide

## Problem: OTP Email Sending Fails (500 Error)

If you're experiencing 500 errors when trying to send OTP emails, the issue is likely with Gmail OAuth2 configuration.

## Quick Diagnosis

Visit this endpoint to check your configuration:
```
GET https://crm-telecall-backend.onrender.com/api/auth/gmail-config-check
```

This will show which environment variables are set/missing.

## Common Issues & Solutions

### 1. Missing Environment Variables on Render

**Problem:** The `.env` file is only for local development. Render needs environment variables set in its dashboard.

**Solution:**
1. Go to your Render Dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add these environment variables:
   - `GMAIL_OAUTH_CLIENT_ID`
   - `GMAIL_OAUTH_CLIENT_SECRET`
   - `GMAIL_OAUTH_REFRESH_TOKEN`
   - `GMAIL_APP_EMAIL`

Copy the values from your local `.env` file.

### 2. Expired OAuth2 Refresh Token

**Problem:** Gmail OAuth2 refresh tokens can expire if:
- Not used for 6 months
- User revoked access
- Security policy changes

**Solution:** Regenerate the refresh token:

1. Go to [Google OAuth2 Playground](https://developers.google.com/oauthplayground/)

2. Click the gear icon (⚙️) in top right

3. Check "Use your own OAuth credentials"

4. Enter your OAuth Client ID and Secret from Google Cloud Console

5. In Step 1, scroll down and select:
   - `https://mail.google.com/`
   
6. Click "Authorize APIs"

7. Sign in with the Gmail account you want to use for sending emails

8. In Step 2, click "Exchange authorization code for tokens"

9. Copy the **Refresh Token** from the response

10. Update `GMAIL_OAUTH_REFRESH_TOKEN` in Render environment variables

11. Redeploy or restart the service

### 3. Invalid OAuth2 Credentials

**Problem:** Client ID or Client Secret is incorrect or the OAuth app is disabled.

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Credentials"
4. Verify your OAuth 2.0 Client ID
5. Make sure the credentials are correct in Render environment variables

### 4. Incorrect Gmail App Email

**Problem:** The email address specified doesn't match the OAuth account.

**Solution:**
Ensure `GMAIL_APP_EMAIL` matches the Google account used to generate the OAuth credentials.

## Testing Locally

To test if the email sending works locally:

1. Make sure all Gmail OAuth2 variables are set in your `.env` file
2. Run the backend: `npm run dev`
3. Try sending an OTP from the login page
4. Check the console logs for detailed error messages

## Environment Variables Reference

Required variables for Gmail OAuth2:

```env
GMAIL_OAUTH_CLIENT_ID=your_client_id_here
GMAIL_OAUTH_CLIENT_SECRET=your_client_secret_here
GMAIL_OAUTH_REFRESH_TOKEN=your_refresh_token_here
GMAIL_APP_EMAIL=your_email@gmail.com
```

## Alternative: Using Gmail App Password (Not Recommended for Production)

If OAuth2 continues to fail, you can temporarily use Gmail App Password:

1. Enable 2-Step Verification on your Google Account
2. Generate an App Password
3. Update the `createTransporter` function in `authController.js` to use:

```javascript
return nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_APP_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});
```

**Note:** This is less secure and may not work on some hosting platforms.

## Getting Help

If none of these solutions work:
1. Check the backend logs on Render for specific error messages
2. Verify the Gmail OAuth2 credentials are correctly configured
3. Try regenerating all OAuth2 credentials from scratch
4. Contact the development team with the error logs
