# Google OAuth Setup Guide

This guide will help you configure Google OAuth authentication for your recruiting platform.

## Prerequisites

- A Supabase project (already connected)
- A Google Cloud Platform (GCP) account

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure the consent screen if prompted:
   - Choose **External** user type
   - Fill in the required application information
   - Add your email to test users
6. Select **Web application** as the application type
7. Add the following to **Authorized redirect URIs**:
   \`\`\`
   https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   \`\`\`
   Replace `[YOUR-SUPABASE-PROJECT-REF]` with your actual Supabase project reference

8. Click **Create** and save your:
   - Client ID
   - Client Secret

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and click to expand
5. Enable the Google provider
6. Enter your Google OAuth credentials:
   - **Client ID**: Paste from Step 1
   - **Client Secret**: Paste from Step 1
7. Click **Save**

## Step 3: Update Redirect URLs in Google Console (Production)

When deploying to production, add your production URL to Google Cloud Console:

1. Go back to Google Cloud Console
2. Navigate to your OAuth 2.0 Client ID
3. Add your production callback URL:
   \`\`\`
   https://yourdomain.com/auth/callback
   https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   \`\`\`

## Step 4: Test Authentication

1. Navigate to `/auth/login` or `/auth/sign-up`
2. Click the **Sign in with Google** button
3. You should be redirected to Google's consent screen
4. After authorizing, you'll be redirected back to `/dashboard`

## Troubleshooting

### Common Issues:

**Error: "redirect_uri_mismatch"**
- Ensure the redirect URI in Google Console exactly matches your Supabase callback URL
- Check for trailing slashes or http vs https

**Error: "Access blocked: This app's request is invalid"**
- Verify your OAuth consent screen is properly configured
- Add your email to test users if the app is in testing mode

**Error: "User does not exist"**
- The user profile might not be created automatically
- Check the `001_create_profiles.sql` script is executed
- Verify RLS policies allow user creation

**Authentication works but redirects to error page**
- Check browser console for detailed error messages
- Verify the callback route (`/auth/callback/route.ts`) is working
- Check that the proxy middleware is properly configured

### Debug Mode

The authentication pages now include error handling that will show:
- Specific error messages from Supabase
- OAuth error descriptions
- Common troubleshooting tips

If you see an error page, check the error details and compare with the common issues above.

## Security Notes

- Never commit your Google Client Secret to version control
- Use environment variables for sensitive data
- Regularly rotate your OAuth credentials
- Monitor your Google Cloud Console for suspicious activity
- Enable 2FA on your Google Cloud account

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Auth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
