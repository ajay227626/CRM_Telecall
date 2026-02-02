# Meta Lead Ads Integration - CRM Admin User Guide

## Overview

This guide is for **CRM administrators** who want to connect their Facebook/Instagram pages to automatically import leads into the CRM. This guide assumes the Meta App has already been configured by your technical team (see Platform Admin Setup Guide).

> **Audience**: Business users with Admin/SuperAdmin role in the CRM and admin access to Facebook pages.

---

## Prerequisites

✅ Admin or SuperAdmin role in the CRM  
✅ Admin access to the Facebook page you want to connect  
✅ Active Lead Ads forms on your Facebook page  
✅ Meta App configured by platform admin (App ID and webhooks)

---

## Step 1: Access Meta Integrations

### 1.1 Navigate to Settings

1. Log in to your CRM
2. Click on your **profile icon** in the top right
3. Select **"Moderation"** from the dropdown
4. Click on **"Settings"** tab
5. Navigate to **"Meta Integrations"** section

### 1.2 Verify Access

- Only users with **Admin**, **SuperAdmin**, or **Moderator** roles can see this section
- If you don't see "Meta Integrations", contact your system administrator

---

## Step 2: Add Meta Account

### 2.1 Initiate Connection

1. In the **Meta Integrations** section, click **"+ Add Meta Account"**
2. The "Connect Meta Account" modal will open

### 2.2 Configure Account Details

Fill in the form:

**Account Name** _(required)_

- A friendly name to identify this connection
- Example: "Main Business Page" or "Product Launch Campaign"

**Account Description** _(optional)_

- Additional notes about this integration
- Example: "Leads from Q1 2024 campaign"

**Lead Assignment Strategy** _(required)_

- Choose how imported leads should be assigned:
  - **Unassigned**: Leads won't be assigned to any user (manual assignment later)
  - **Assign to Specific User**: All leads go to one designated user
  - **Round Robin**: Leads are distributed equally among team members

**Assign To** _(conditional)_

- Appears if you selected "Assign to Specific User"
- Select the user who will receive all leads from this integration

### 2.3 Click "Connect with Facebook"

- You'll be redirected to Facebook's OAuth authorization page

---

## Step 3: Facebook OAuth Authorization

### 3.1 Login to Facebook

- If not already logged in, enter your Facebook credentials
- Use the account that has **admin access** to the pages you want to connect

### 3.2 Grant Permissions

Review and approve the following permissions:

- ✅ **Manage your Pages**: Access to your Facebook pages
- ✅ **Access Lead Ads forms**: Retrieve lead form data
- ✅ **Read engagement on your Pages**: Access to page insights

Click **"Continue"** to grant permissions

### 3.3 Select Pages

- You'll see a list of all Facebook pages where you have admin access
- **Select** the pages you want to connect to the CRM
- You can select multiple pages if needed
- Click **"Next"**

### 3.4 Confirm Selection

- Review your selected pages and permissions
- Click **"Done"** to complete the authorization

---

## Step 4: Verify Integration

### 4.1 Return to CRM

- You'll be automatically redirected back to the CRM
- The new Meta account will appear in your integrations list

### 4.2 Check Integration Status

Each integration card shows:

- **Account Name**: Your custom name
- **Connected Pages**: Number of pages connected
- **Status**: ✅ Active or ⚠️ Error
- **Last Sync**: Timestamp of last successful sync

### 4.3 View Connected Pages

Click **"View Details"** to see:

- List of all connected Facebook pages
- Number of leads imported from each page
- Last sync time for each page

---

## Step 5: Managing Integrations

### 5.1 Edit Integration

1. Click the **"⋮" menu** on an integration card
2. Select **"Edit"**
3. Update account name, description, or assignment strategy
4. Click **"Save Changes"**

> **Note**: Editing assignment strategy only affects **future** leads, not existing ones.

### 5.2 Manual Sync

1. Click the **"⋮" menu** on an integration card
2. Select **"Sync Now"**
3. The CRM will fetch any new leads from Facebook immediately

**When to use manual sync:**

- Testing the integration after initial setup
- Suspect leads are missing
- After creating new lead forms on Facebook

### 5.3 Reconnect Account

If authorization expires or you need to add/remove pages:

1. Click the **"⋮" menu** on an integration card
2. Select **"Reconnect"**
3. Follow the OAuth flow again (Steps 3.1-3.4)

### 5.4 Delete Integration

1. Click the **"⋮" menu** on an integration card
2. Select **"Delete"**
3. Confirm deletion in the popup

> **⚠️ Warning**: Deleting an integration will:
>
> - Stop importing new leads from Facebook
> - **NOT** delete existing leads that were already imported
> - Remove the connection between your CRM and Facebook pages

---

## Step 6: Viewing Imported Leads

### 6.1 Access Leads Page

1. Navigate to **"Leads"** from the main menu
2. Imported leads will appear in your leads list

### 6.2 Identify Meta Leads

Meta-imported leads have:

- **Source**: "Meta" (visible in lead details)
- **Tags**: "Facebook Lead Ad" or "Instagram Lead Ad"
- **Lead Details**: Contains form responses from Facebook

### 6.3 Filter Meta Leads

1. In the Leads page, click **"Filter"**
2. Select **"Source"** filter
3. Choose **"Meta"**
4. Click **"Apply"**

---

## Lead Assignment Strategies Explained

### Unassigned

```
Facebook Lead → CRM (Unassigned) → Manual Assignment
```

**Best for:**

- Small teams that manually distribute leads
- Testing the integration
- Custom assignment workflows

### Assign to Specific User

```
Facebook Lead → CRM → Always assigned to: John Doe
```

**Best for:**

- Single sales representative
- Department lead who distributes leads manually
- Dedicated campaign manager

### Round Robin

```
Lead #1 → User A
Lead #2 → User B
Lead #3 → User C
Lead #4 → User A (cycle repeats)
```

**Best for:**

- Fair distribution among team members
- Large sales teams
- Ensuring balanced workload

> **🔄 Pro Tip**: Round Robin only distributes among **active** users with **Lead Management** permissions.

---

## Troubleshooting

### I don't see "Meta Integrations" in Settings

**Solution**:

- Verify you have Admin, SuperAdmin, or Moderator role
- Contact your system administrator to upgrade your role

### OAuth authorization fails

**Solutions**:

- Ensure you're logged into Facebook with the right account
- Verify you have admin access to the pages
- Clear browser cache and try again
- Try a different browser

### No leads are being imported

**Checklist**:

1. ✅ Integration status shows "Active"
2. ✅ Facebook page is correctly connected
3. ✅ Lead form exists on the Facebook page
4. ✅ Lead form has received submissions
5. ✅ Webhook is active (ask platform admin to verify)

**Actions**:

- Click "Sync Now" to manually trigger import
- Wait 5-10 minutes for webhook delivery
- Check with platform admin for webhook errors

### Leads imported but not assigned

**Check**:

- Your assignment strategy setting (might be "Unassigned")
- Target user is active and has Lead Management permissions
- Round Robin pool has active users

### Want to import historical leads

**Note**: The integration only imports **new** leads submitted after setup.

**Option**: Manual import via Facebook Business Manager:

1. Go to Facebook Business Manager → Lead Ads Forms
2. Download lead CSV
3. Import to CRM via "Import Leads" feature (if available)

---

## Best Practices

### 1. Test Before Going Live

- Create a test lead form on Facebook
- Submit a test lead using your own details
- Verify it appears in CRM within 2 minutes
- Check assignment is working as expected

### 2. Monitor Regularly

- Check integration status weekly
- Verify lead volumes match Facebook analytics
- Watch for authorization expiration warnings

### 3. Update Assignment Strategy

- Adjust as team size changes
- Remove inactive users from Round Robin pool
- Route new campaigns to specific team members

### 4. Maintain Page Access

- Don't remove CRM app from Facebook page settings
- Keep at least one admin with CRM access
- Communicate page ownership changes to platform admin

### 5. Custom Lead Forms

- Use clear field names in Facebook forms
- Match field names to CRM lead fields when possible
- Test form submission before launching campaigns

---

## Feature Comparison

| Feature                    | Available | Notes                                  |
| -------------------------- | --------- | -------------------------------------- |
| Real-time lead import      | ✅        | Via webhooks (typically < 2 min)       |
| Historical lead import     | ❌        | Only new leads after setup             |
| Multiple page connection   | ✅        | Unlimited pages per integration        |
| Lead assignment automation | ✅        | Unassigned, Specific User, Round Robin |
| Lead deduplication         | ✅        | Based on email address                 |
| Form field mapping         | ⚡        | Automatic for standard fields          |
| Instagram Lead Ads         | ✅        | Supported alongside Facebook           |
| WhatsApp Ads               | ❌        | Not currently supported                |

---

## FAQ

**Q: How long does it take for leads to appear in the CRM?**  
A: Typically 1-5 minutes. Facebook sends webhook notifications in near real-time.

**Q: Can I connect multiple Facebook pages?**  
A: Yes! You can select multiple pages during the OAuth flow, or create separate integrations for each page.

**Q: What happens if I lose Facebook page access?**  
A: The integration will stop working. You'll need to reconnect with an account that has page access.

**Q: Can I change lead assignment after import?**  
A: Yes, you can manually reassign leads in the Leads page. Changing the assignment strategy only affects future leads.

**Q: Are there any costs associated with this integration?**  
A: The CRM integration is free. You'll still pay Facebook for ad campaigns as usual.

**Q: Can I see which Facebook form a lead came from?**  
A: Yes, lead details include the form name and page name.

---

## Support

For technical issues:

- Contact your **platform administrator** for webhook or app configuration issues
- Contact your **CRM administrator** for access and permissions issues
- Check CRM documentation for general lead management questions

---

**Last Updated**: February 2026  
**Version**: 1.0
