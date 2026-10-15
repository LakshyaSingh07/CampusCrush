# CampusCrush — Current State Audit and Roadmap

## 1. What exists today

- ✅ Welcome screen, email OTP sign-in restricted to Galgotias domains (client-side check), OTP verify with resend timer
- ✅ 5-step onboarding: name/birthday → department/year → gender → height → 3–6 photos (Cloudinary)
- ✅ Auth context with session validation and a profile cache
- ✅ `delete-user` edge function (Cloudinary images → profile row → auth user)
- 🟡 Tab shell (Home, Liked You, Chats, Profile). Every tab is a placeholder except Profile, which only has debug Logout/Delete buttons
- ❌ No discovery, swipes, matches, chat, profile editing, or safety features
- ❌ No DB schema, triggers or RLS in the repo

## 2. Bugs and gaps found (fix in M0)

### High priority
| # | Where | Issue |
|---|---|---|
| 1 | `step1.js` | **No 18+ check** and no date validation (e.g. 31/02, year 3000). Needed for store approval and legally |
| 2 | `sign-in.js` | Domain check is **client-only**, and it is case- and whitespace-sensitive (`" Me@GalgotiasUniversity.ac.in"` fails). Anyone can call Supabase Auth directly with the anon key. Enforce it in a DB trigger or auth hook, and lower-case + trim the input |
| 3 | `step5.js:114` | The result of `updateProfile` is ignored. If the save fails, the user is still sent to Home with no photos saved |
| 4 | `verify-otp.js:186` | It only checks step 1 fields before sending the user to Home, so a user who stopped at step 2–5 skips the rest of onboarding. Route to `/` and let the gate in `index.js` decide |
| 5 | `index.js:33` | `Boolean(profile_image_urls)` is `true` for an empty array `[]`. Check `length >= 3` |
| 6 | Repo | `profiles` schema, the new-user trigger and RLS policies aren't version-controlled. Without RLS, any user can read or update every profile |
| 7 | `step5.js` | Unsigned Cloudinary preset hardcoded in the client (see TECHNICAL_DESIGN §5) |

### Medium priority
| # | Where | Issue |
|---|---|---|
| 8 | `step2.js`, `step3.js` | Write to Supabase directly instead of using `updateProfile`, so the cached `profile` in context goes stale |
| 9 | `step4.js` | `CustomAlert` is never rendered (errors aren't shown), there is no loading state, and nothing stops a double tap |
| 10 | `app.json` | Icon and splash paths (`./assets/images/*`) don't exist, so native builds will fail. Point them to `src/assets` or add the files |
| 11 | `package.json` | `expo ^54` is mixed with SDK 53 package versions (expo-router 5, RN 0.79). Run `npx expo install --fix` and `npx expo-doctor` |
| 12 | `(auth)/create-password.js`, `password-login.js` | Empty files. expo-router warns about routes with no default export. Delete them or implement them |
| 13 | `AuthProvider.js` | Lots of `console.log` output with user IDs and names. The profile is re-fetched on every auth event (including `TOKEN_REFRESHED`), and the initial fetch and the listener can race |
| 14 | Onboarding UI | Progress bars don't match: 4 segments for 5 steps, and step 4 uses a different style. `ImagePicker.MediaTypeOptions` is deprecated (use `['images']`) |
| 15 | `step5.js` | MIME type guessed from the file extension (`image/jpg` is invalid), uploads run one after another (slow), and the photo slot `height: 90` conflicts with `aspectRatio` |

### Low priority
- `README.md` is still the Expo boilerplate, and the `reset-project` script it mentions doesn't exist.
- The "Liked You" tab uses the `comments` icon.
- Make sure `.env` was never committed (`git log --all -- .env`). If it was, rotate the anon key. The anon key is meant to be public, but check it is the anon key and not the service key.
- Git reports "dubious ownership" on this folder. Run `git config --global --add safe.directory D:/Projects/galgotias-dating/galgotias-dating-app`.

## 3. Milestones

### M0 — Stabilise (≈1 week)
- [x] Baseline migration `supabase/migrations/20261015000000_profiles_baseline.sql` (profiles columns, constraints, new-user trigger)
- [x] Server-side email domain check in the new-user trigger
- [x] RLS on `profiles` (own row only)
- [x] Fix bugs #1–#5, #8–#10, #12, #14, #15 (and #13 partly: debug logs removed, auth race fixed)
- [x] `onboarding_done` generated column + a single route guard in `src/app/_layout.js`
- [x] "Show me" (`interested_in`) question added to onboarding step 3
- [x] Replace the README with real setup instructions
- [ ] **Apply the migration** (`supabase db push`) and check for an older profile-creating trigger (see note below)
- [ ] Bug #11: align Expo SDK packages (`npx expo install --fix`, then `npx expo-doctor`) and test on a device
- [ ] Test the full flow on a device: new user, returning user, user who stopped mid-onboarding, logout, delete account

> **Before running the migration:** look in the Supabase dashboard (Database → Triggers on `auth.users`) for any existing trigger that inserts into `profiles`. If one exists under a name other than `on_auth_user_created`, drop it. Otherwise both triggers insert a row and sign-up fails with a duplicate-key error.

### M1 — Core MVP (≈3–4 weeks)
1. **Profile tab:** view own profile, edit fields and photos, logout, delete (proper UI)
2. **Discovery:** `get_discovery_feed` RPC + swipe card UI (`react-native-gesture-handler` + `reanimated`, both already installed)
3. **Swipes and matches:** `swipe()` RPC with atomic match creation, "It's a match" modal
4. **Liked You:** `get_liked_me()` list/grid, like back
5. **Chat:** `matches` list + `messages` with Supabase Realtime
6. **Safety:** block, report, unmatch. Community guidelines and privacy policy screens
7. Move images to signed uploads or Supabase Storage

### M2 — Closed beta (≈2 weeks)
- Push notifications (`expo-notifications`)
- Analytics for the funnel metrics in the PRD (PostHog / Amplitude)
- Crash reporting (Sentry)
- EAS Build internal distribution to 50–100 students
- Admin view for reports (Supabase dashboard or a small Retool/Next.js page)

### M3 — Launch
- Store listings, privacy policy URL, App Store / Play dating-app compliance review
- Photo moderation
- Rate limiting, abuse monitoring
- Prod Supabase project with backups

## 4. Suggested next step

Start with **M0**. Discovery, matching and chat all depend on a version-controlled schema with RLS and a reliable onboarding flag. If those features are built on the current unprotected `profiles` table, the work will need redoing.
