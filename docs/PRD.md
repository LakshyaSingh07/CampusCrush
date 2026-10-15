# CampusCrush — Product Requirements Document

| | |
|---|---|
| **Product** | CampusCrush (repo: `galgotias-dating-app`) |
| **Platform** | iOS + Android (Expo / React Native), web secondary |
| **Status** | MVP features built; pending migration rollout and device testing |
| **Last updated** | 2026-10-16 |

---

## 1. Summary

CampusCrush is a dating and social-discovery app open only to verified Galgotias University students. Because sign-up needs a university email (`@galgotiasuniversity.ac.in` / `@galgotiasuniversity.edu.in`), everyone on the app is a real, verified student. Users build a short profile, browse other students one profile at a time, like or pass, and can chat once both people have liked each other.

## 2. Problem

- Mainstream apps (Tinder, Bumble, Hinge) are full of fake profiles, catfishing and people outside your context. They have no "verified student at my campus" filter.
- Meeting people on a big campus outside your own department and year is hard.
- Students care about safety and want some assurance about who they are talking to.

## 3. Goals and non-goals

### Goals (MVP)
1. Only verified Galgotias students can create an account.
2. Onboarding takes under 3 minutes and ends with a complete, attractive profile.
3. Users can discover other students, like or pass, and get matched when the like is mutual.
4. Matched users can chat in real time.
5. Users can block, report, and delete their account with all their data.

### Non-goals (for now)
- Opening to other universities. The data model should allow it later.
- Paid features, subscriptions, boosts.
- Video or voice calls.
- Web as a first-class client.

## 4. Target users

| Persona | Description | Needs |
|---|---|---|
| **The fresher** | 1st-year, new to campus, knows few people | Make friends and connections quickly and safely |
| **The busy senior** | 3rd/4th-year, small circle of friends | Meet people outside their department |
| **The cautious user** | Has had bad experiences on public apps | Verified users, easy block and report, control over who sees them |

## 5. Success metrics

| Metric | MVP target |
|---|---|
| Sign-up → onboarding complete | ≥ 70% |
| Weekly active users / registered | ≥ 40% |
| Users with at least 1 match in their first week | ≥ 50% |
| Matches that send at least 1 message | ≥ 35% |
| Reports per 1,000 DAU | Tracked; every report reviewed within 24h |
| D7 retention | ≥ 30% |

## 6. User flows

```
Welcome ─► Email entry ─► OTP verify ─┬─► (new user) Onboarding 1–5 ─► Home
                                       └─► (returning, complete) ─────► Home

Home (Discover) ─ like ─► [mutual?] ─► Match ─► Chat
Liked You ─► like back ─► Match ─► Chat
Profile ─► edit / settings / logout / delete account
```

## 7. Functional requirements

Status: ✅ done · 🟡 partial · ⬜ not started

### 7.1 Authentication
| ID | Requirement | Status |
|---|---|---|
| AUTH-1 | Sign in with university email via 6-digit email OTP (passwordless) | ✅ |
| AUTH-2 | Reject non-university email domains, **enforced on the server** and not only in the client | ✅ |
| AUTH-3 | Resend OTP with a 60-second cooldown | ✅ |
| AUTH-4 | Session persists across app restarts | ✅ |
| AUTH-5 | Logout | ✅ |
| AUTH-6 | Optional password login (empty `create-password.js` / `password-login.js` stubs exist) | Dropped (OTP-only for now) |

### 7.2 Onboarding
| ID | Requirement | Status |
|---|---|---|
| ONB-1 | First name + birthday | ✅ |
| ONB-2 | **Must be 18+**, worked out from the birthday; block under-18 users | ✅ (client + DB constraint) |
| ONB-3 | Department + graduation year | ✅ |
| ONB-4 | Gender (Woman / Man / Nonbinary) | ✅ |
| ONB-5 | **Interested in** (who the user wants to see) | ✅ |
| ONB-6 | Height | ✅ |
| ONB-7 | 3–6 photos | ✅ |
| ONB-8 | Short bio + optional prompts / interests | 🟡 bio in Edit Profile; no prompts |
| ONB-9 | Resume onboarding at the first unfinished step after an app restart | ✅ |
| ONB-10 | Accept community guidelines + privacy policy | ✅ (text is a draft, needs review) |

### 7.3 Discovery (Home tab)
| ID | Requirement | Status |
|---|---|---|
| DSC-1 | Card stack of other users' profiles (photos, name, age, department, year, bio) | ✅ |
| DSC-2 | Like / Pass with swipe gestures and buttons | ✅ |
| DSC-3 | Filter by the user's "interested in" preference, plus optional age/year filters | 🟡 interested-in only; no age/year filters |
| DSC-4 | Never show yourself, blocked users, or profiles you already swiped on | ✅ |
| DSC-5 | Empty state when nobody is left | ✅ |

### 7.4 Likes and matches
| ID | Requirement | Status |
|---|---|---|
| MAT-1 | A mutual like creates a match (atomically, on the server) | ✅ |
| MAT-2 | "It's a match!" screen | ✅ |
| MAT-3 | Liked You tab lists people who liked me, with like-back / pass | ✅ |
| MAT-4 | Unmatch | ✅ |

### 7.5 Chat
| ID | Requirement | Status |
|---|---|---|
| CHT-1 | List of matches and conversations, sorted by latest message | ✅ |
| CHT-2 | Real-time 1:1 text messaging between matched users only | ✅ |
| CHT-3 | Unread indicators | ✅ |
| CHT-4 | Push notifications for new match and new message | ✅ (needs `eas init` + dev build) |

### 7.6 Profile and settings
| ID | Requirement | Status |
|---|---|---|
| PRF-1 | View my profile as others see it | ✅ |
| PRF-2 | Edit all profile fields and reorder/replace photos | 🟡 add/remove/replace; no drag reorder |
| PRF-3 | Pause profile (hide from discovery) | ✅ |
| PRF-4 | Delete account and all data (DB row, photos, auth user) | ✅ (edge function) |

### 7.7 Trust and safety
| ID | Requirement | Status |
|---|---|---|
| SAF-1 | Block a user (hides both ways, ends the match) | ✅ |
| SAF-2 | Report a user with a reason; admin review queue | ✅ `admin_reports` view, bans, auto-hide at 3+ reporters |
| SAF-3 | Row-Level Security so users can only read public profile fields and only write their own data | ✅ |
| SAF-4 | Basic photo moderation (e.g. Cloudinary moderation add-on, or manual review) | ⬜ |
| SAF-5 | Rate-limit likes and messages | ✅ 1,000 swipes/day, 20 messages/min |

## 8. Non-functional requirements

- **Privacy:** Never expose email, exact birthday or user IDs to other users. Show age, not date of birth. Remove debug logs that print PII.
- **Performance:** Discovery cards load in under 1 second on 4G; images are resized by the CDN.
- **Reliability:** No partial writes. For example, onboarding must not move on if a save failed.
- **Compliance:** India DPDP Act 2023 (consent, data deletion), App Store / Play Store dating-app policies (18+, report/block, privacy policy URL).
- **Accessibility:** Labelled buttons, enough contrast, works with system font scaling.

## 9. Release plan

| Phase | Scope |
|---|---|
| **M0 — Stabilise** | Fix the onboarding/auth bugs, add the schema and RLS to the repo, 18+ check, server-side domain check |
| **M1 — MVP** | Discovery, likes/matches, Liked You, chat, profile view/edit, block/report |
| **M2 — Closed beta** | 50–100 students, push notifications, analytics, feedback loop |
| **M3 — Campus launch** | Store release, moderation tooling, marketing |

See [ROADMAP.md](ROADMAP.md) for the task breakdown.

## 10. Open questions

1. Is this an official or university-endorsed project? This affects branding and how we use the domain.
2. Do we keep a password login option, or stay OTP-only? (The stub files suggest it was planned.)
3. Do we also offer a "friends" mode, or keep it dating-only?
4. Should alumni keep access after their graduation year?
5. Who moderates reports, and what is the escalation path?
