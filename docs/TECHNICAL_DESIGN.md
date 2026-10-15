# CampusCrush — Technical Design

## 1. Stack

| Layer | Choice |
|---|---|
| Client | Expo (React Native 0.79, React 19), JavaScript, `expo-router` file-based routing |
| Backend | Supabase: Postgres, Auth (email OTP), Edge Functions (Deno), Realtime (planned) |
| Image storage | Cloudinary (unsigned upload preset from the client) |
| Session storage | AsyncStorage via `supabase-js` |

Environment variables (in `.env`, git-ignored):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Edge function secrets (set with `supabase secrets set`):
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically

## 2. Project structure

```
src/
  app/                        # expo-router routes
    _layout.js                # Root Stack, wrapped in <AuthProvider>
    index.js                  # Welcome screen + routing gate (which onboarding step / home)
    (auth)/
      sign-in.js              # Email entry, domain check, signInWithOtp
      verify-otp.js           # 6-digit OTP entry, resend timer, verifyOtp
      create-password.js      # EMPTY stub
      password-login.js       # EMPTY stub
    onboarding/
      step1.js                # full_name, birthday
      step2.js                # department, grad_year
      step3.js                # gender
      step4.js                # height_cm (wheel picker)
      step5.js                # 3–6 photos → Cloudinary → profile_image_urls
    (tabs)/
      home.js                 # placeholder
      liked-you.js            # placeholder
      chats.js                # placeholder
      profile.js              # Logout + Delete account (debug UI)
  components/CustomAlert.js   # Modal alert used across screens
  context/AuthProvider.js     # session, profile, loading, updateProfile()
  lib/supabase.js             # Supabase client
  assets/                     # images
supabase/
  config.toml
  functions/delete-user/      # Deletes Cloudinary images, profile row, auth user
  functions/_shared/cors.ts
```

## 3. Auth and routing

1. `sign-in.js` checks the email domain on the client, then calls `supabase.auth.signInWithOtp({ email })`.
2. `verify-otp.js` calls `verifyOtp({ type: "email" })`. It then reads `profiles` and routes to `/onboarding/step1` or `/(tabs)/home`.
3. `AuthProvider` checks the session against the server on start (`getUser()`), loads `profiles`, and listens to `onAuthStateChange`.
4. `index.js` is the gate. Based on which profile fields are filled in, it sends the user to the first incomplete onboarding step or to home.

**Assumption:** a `profiles` row is created automatically when a user signs up, presumably by a Postgres trigger on `auth.users`. The client only ever runs `update` on it, never `insert`. This trigger is **not in the repo** and must be added as a migration.

## 4. Data model

### 4.1 Current (inferred from the code)

```sql
profiles (
  user_id             uuid primary key references auth.users on delete cascade,
  full_name           text,
  birthday            date,
  department          text,
  grad_year           int,
  gender              text,          -- 'Woman' | 'Man' | 'Nonbinary'
  height_cm           int,
  profile_image_urls  text[]
)
```

### 4.2 Proposed for MVP

```sql
-- profiles: add
  interested_in    text[]   not null default '{}',   -- genders to show
  bio              text     check (char_length(bio) <= 500),
  is_paused        boolean  not null default false,
  onboarding_done  boolean  not null default false,  -- one clear flag instead of guessing from fields
  last_active_at   timestamptz,
  created_at       timestamptz not null default now()
  -- constraint: birthday <= current_date - interval '18 years'

swipes (
  swiper_id   uuid references profiles(user_id) on delete cascade,
  swipee_id   uuid references profiles(user_id) on delete cascade,
  direction   text check (direction in ('like','pass')),
  created_at  timestamptz default now(),
  primary key (swiper_id, swipee_id)
)

matches (
  id          uuid primary key default gen_random_uuid(),
  user_a      uuid references profiles(user_id) on delete cascade,
  user_b      uuid references profiles(user_id) on delete cascade,
  created_at  timestamptz default now(),
  unmatched_at timestamptz,
  check (user_a < user_b),
  unique (user_a, user_b)
)

messages (
  id          bigint generated always as identity primary key,
  match_id    uuid references matches(id) on delete cascade,
  sender_id   uuid references profiles(user_id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz default now(),
  read_at     timestamptz
)

blocks  (blocker_id uuid, blocked_id uuid, created_at timestamptz, primary key (blocker_id, blocked_id))
reports (id, reporter_id, reported_id, reason text, details text, status text default 'open', created_at)
push_tokens (user_id uuid, token text, platform text, primary key (user_id, token))
```

### 4.3 Server-side logic (Postgres functions / triggers)

| Function | Purpose |
|---|---|
| `handle_new_user()` trigger on `auth.users` | Create the `profiles` row. **Reject emails outside the allowed domains** |
| `get_discovery_feed(limit int)` RPC | Returns candidates: not me, not paused, onboarding done, matches my `interested_in` (and theirs includes my gender), not swiped yet, not blocked either way. Returns age, **not** birthday |
| `swipe(target uuid, direction text)` RPC | Inserts the swipe. If it is a like and a like back exists, inserts into `matches` in the same transaction. Returns `{ matched: bool, match_id }` |
| `get_liked_me()` RPC | People who liked me that I haven't swiped on yet |
| Trigger on `messages` insert | Check the sender belongs to the match and the match is active. Queue a push notification |

### 4.4 Row-Level Security (required before beta)

- `profiles`: SELECT for authenticated users only through a `public_profiles` view or RPC that hides `birthday` and email. UPDATE only where `user_id = auth.uid()`.
- `swipes`: INSERT only through the RPC, no direct SELECT of other users' swipes.
- `matches`: SELECT where `auth.uid() in (user_a, user_b)`.
- `messages`: SELECT/INSERT where the caller belongs to the match.
- `blocks`, `reports`: INSERT own rows only.

### 4.5 Realtime
Subscribe to `messages` filtered by `match_id` for open chats, and to `matches` for "new match" toasts.

## 5. Images

Photos are stored in Cloudinary. The decision was to keep Cloudinary (face-aware resizing via `resizedImageUrl`, and an optional moderation add-on) and secure it:

1. The app calls the `sign-upload` edge function, which returns a signature for `folder=users/<user id>`.
2. The app uploads directly to Cloudinary with that signature. The API secret never ships in the app.
3. When photos are removed in Edit Profile, the app calls `delete-photos`. It only deletes files in the caller's own folder that are no longer on their profile.
4. `delete-user` deletes all of a user's photos. `public_id`s are parsed from the URL by `extractPublicId` in `supabase/functions/_shared/cloudinary.ts`.

Photos uploaded before signed uploads (outside a `users/` folder) can't be cleaned up by `delete-photos`. `delete-user` still removes them.

Still to do: photo moderation.

## 6. Push notifications
- The app registers its Expo push token with `register_push_token()` once onboarding is complete. On logout it calls `unregister_push_token()`.
- Triggers on `matches` and `messages` call `send_push()`, which posts to `https://exp.host/--/api/v2/push/send` with `pg_net`. Failures are logged and never block the insert.
- Match notifications only go to the person who didn't make the final swipe, because that person already sees the in-app match screen.
- Tapping a notification opens the chat (`useLastNotificationResponse` in the root layout). Message banners are hidden while that chat is open.
- Requires an EAS `projectId` (`npx eas init`) and a development build. Expo Go on Android can't receive remote notifications.

## 6a. Moderation
- `profiles.banned_at` / `ban_reason` are admin-only. A trigger rejects changes from the `authenticated` role.
- Banned users see `/suspended`, can't swipe or send messages, and disappear from other users' feeds and match lists.
- `is_under_review()` hides anyone with open reports from 3+ distinct reporters.
- Rate limits: `swipe()` allows 1,000 swipes per day; a trigger on `messages` allows 20 per minute.
- `admin_reports` (security-invoker view, no client access) lists reports with names, the reported user's email and reporter counts.

## 7. Environments and tooling (to add)

- `supabase/migrations/*.sql` holds the schema and is version-controlled. Use `supabase db diff` to capture what currently exists in the dashboard.
- Separate dev and prod Supabase projects.
- EAS Build for store binaries, EAS Update for OTA updates.
- ESLint already configured. Add Prettier and a CI job (lint + `expo-doctor`).
- Tests: Jest + React Native Testing Library for the onboarding gate logic, and pgTAP or SQL tests for the RPCs and RLS.
