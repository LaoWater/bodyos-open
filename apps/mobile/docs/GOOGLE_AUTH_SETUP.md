# Google Sign-In Setup Guide

Steps to enable "Continue with Google" in BodyOS.

## 1. Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services > OAuth consent screen**
   - Choose **External** user type
   - Fill in app name ("BodyOS"), support email, developer contact
   - Add scopes: `email`, `profile`, `openid`
   - Publish when ready (or leave in test mode and add test users)

## 2. Create OAuth Credentials

Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**

### iOS Client
- Application type: **iOS**
- Bundle ID: `com.neo.reconnect` (must match `app.json`)
- Save the generated **iOS Client ID**

### Android Client
- Application type: **Android**
- Package name: `com.neo.reconnect`
- SHA-1 fingerprint: run `cd android && ./gradlew signingReport` (or use `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android`)
- Save the generated **Android Client ID**

### Web Client (for Supabase)
- Application type: **Web application**
- Authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
- Save **Client ID** and **Client Secret**

## 3. Configure Supabase

1. Go to your Supabase dashboard > **Authentication > Providers**
2. Enable **Google**
3. Paste the **Web Client ID** and **Client Secret** from step 2
4. The redirect URL is pre-filled by Supabase — make sure it matches the one you added in Google Cloud

## 4. Install Expo Libraries

```bash
npx expo install expo-auth-session expo-crypto expo-web-browser
```

## 5. Update `app.json`

Add the scheme for OAuth redirect:

```json
{
  "expo": {
    "scheme": "bodyos",
    "plugins": [
      // ... existing plugins
    ]
  }
}
```

## 6. Implement in AuthContext

Use `expo-auth-session` with Supabase's Google provider:

```typescript
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri({ scheme: 'bodyos' });

// In your signInWithGoogle function:
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: redirectUri,
    skipBrowserRedirect: true,
  },
});

// Open the OAuth URL in a browser session
if (data?.url) {
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
  if (result.type === 'success') {
    const url = new URL(result.url);
    const access_token = url.hash  // parse tokens from fragment
    // ... set session with supabase.auth.setSession()
  }
}
```

## Summary of Values Needed

| Value | Where to get it |
|---|---|
| iOS Client ID | Google Cloud Console > Credentials |
| Android Client ID | Google Cloud Console > Credentials |
| Web Client ID | Google Cloud Console > Credentials |
| Web Client Secret | Google Cloud Console > Credentials |
| SHA-1 fingerprint | `./gradlew signingReport` |
| Supabase redirect URL | Supabase dashboard > Auth > Providers > Google |
