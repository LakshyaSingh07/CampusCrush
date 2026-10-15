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

Deploy the account-deletion edge function and set its secrets:

```bash
npx supabase functions deploy delete-user
npx supabase secrets set CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=...
```

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
