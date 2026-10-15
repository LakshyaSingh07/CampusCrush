# CampusCrush — Current State Audit and Roadmap

## 1. What exists today (updated 2026-10-16)

- ✅ Email OTP sign-in restricted to Galgotias domains (client and server)
- ✅ 5-step onboarding with 18+ check and a "Show me" preference
- ✅ Discover: swipe cards (drag or buttons), "It's a match!" screen
- ✅ Liked You: grid of people who liked you, like back / pass
- ✅ Chats: new matches row, conversation list with unread counts, real-time 1:1 chat
- ✅ Profile: preview, edit photos/bio/details, pause profile, logout, delete account
- ✅ Safety: unmatch, block, report (reporting also blocks)
- ✅ Database schema, RLS and server functions in `supabase/migrations/`, tested against Postgres 15
- ⏳ Migrations not yet applied to the Supabase project; app not yet tested on a device

## 2. Original audit: bugs and gaps found (fixed in M0 unless noted)

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
- [x] Bug #11: Expo SDK 54 packages aligned (`expo-doctor` 18/18, Android bundle builds)
- [ ] **Apply the migrations** (`supabase db push`) and check for an older profile-creating trigger (see note below)
- [ ] Test the full flow on a device: new user, returning user, user who stopped mid-onboarding, logout, delete account

> **Before running the migrations:** look in the Supabase dashboard (Database → Triggers on `auth.users`) for any existing trigger that inserts into `profiles`. If one exists under a name other than `on_auth_user_created`, drop it. Otherwise both triggers insert a row and sign-up fails with a duplicate-key error.

### M1 — Core MVP
1. [x] **Profile tab:** preview, edit photos/bio/details, pause, logout, delete
2. [x] **Discovery:** `get_discovery_feed()` + swipe cards
3. [x] **Swipes and matches:** `swipe()` with atomic match creation, "It's a match" modal
4. [x] **Liked You:** `get_liked_me()` grid, like back
5. [x] **Chat:** `get_my_matches()`, `messages` with Supabase Realtime, read receipts
6. [x] **Safety:** block, report, unmatch
7. [ ] Community guidelines + privacy policy screens, accepted during onboarding (needed for store review)
8. [ ] Move images to signed uploads or Supabase Storage. Photos removed in Edit Profile currently stay in Cloudinary until the account is deleted
9. [ ] Two-device test of matching and chat (needs two university email accounts)

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

Apply the migrations and test on two devices (M0 and M1 item 9). Then add the guidelines/privacy screens and push notifications, so the app is ready for the closed beta (M2).
