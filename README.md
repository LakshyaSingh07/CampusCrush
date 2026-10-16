# CampusCrush

A dating app for verified Galgotias University students. Built with Expo (React Native) and Supabase.

- Product requirements: [docs/PRD.md](docs/PRD.md)
- Architecture and data model: [docs/TECHNICAL_DESIGN.md](docs/TECHNICAL_DESIGN.md)
- Status and roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)

## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root (it's git-ignored):

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```

   Only `EXPO_PUBLIC_*` variables are bundled into the app. Never put the service role key or Cloudinary API secret in an `EXPO_PUBLIC_` variable.

3. Start the app

   ```bash
   npx expo start
   ```

## Supabase

The schema lives in [supabase/migrations/](supabase/migrations/). To apply it to the linked project:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Deploy the edge functions and set their secrets:

```bash
npx supabase secrets set CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=...
npx supabase functions deploy sign-upload     # signs photo uploads
npx supabase functions deploy delete-photos   # removes photos taken off a profile
npx supabase functions deploy delete-user     # account deletion
```

Once `sign-upload` is deployed, delete the old unsigned upload preset
(`campus_crush_unsigned`) in Cloudinary → Settings → Upload. The app no longer uses it.

### Builds

The EAS project is already linked (`extra.eas.projectId` in `app.json`). `.env` isn't uploaded to EAS, so `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are stored as EAS environment variables (`eas env:list`).

```bash
npm install -g eas-cli
eas build --platform android --profile preview   # installable APK for testers
```

### Push notifications

Notifications are sent from the database (`pg_net`) to Expo's push service. Expo Go on Android can't receive them, so use an EAS build. Android also needs Firebase Cloud Messaging credentials uploaded to EAS: see https://docs.expo.dev/push-notifications/fcm-credentials/.

### Premium (testing)

Payments aren't live yet. To give a tester Premium, run this in the Supabase SQL editor:

```sql
select public.grant_premium('student@galgotiasuniversity.ac.in', 'week');  -- 'day' | 'week' | 'month'
```

Free accounts get 20 swipes a day (India time), up to 5 active matches, and only the count on Liked You. Premium removes those limits and adds undo. The limits are enforced in the database (`swipe()`, `get_liked_me()`, `undo_last_swipe()`).

### Moderation

- Reports: open the `admin_reports` view in the Supabase table editor.
- Anyone reported by 3+ different people is hidden from Discover until their open reports are marked `reviewed`, `actioned` or `dismissed` in the `reports` table.
- To ban someone, set `banned_at = now()` (and optionally `ban_reason`) on their `profiles` row. They'll see a "suspended" screen and disappear from everyone's Discover, Liked You and Chats.

## Project layout

```
src/app/            expo-router routes
  _layout.js        root stack + auth/onboarding route guard
  index.js          welcome screen
  (auth)/           email OTP sign-in
  onboarding/       5-step profile setup
  (tabs)/           main app (home, liked you, chats, profile)
src/context/        AuthProvider (session + profile)
src/lib/            supabase client, onboarding helpers
src/components/     shared UI
supabase/           migrations and edge functions
```
