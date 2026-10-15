export const MIN_PHOTOS_REQUIRED = 3;
export const MAX_PHOTOS = 6;
export const MIN_AGE = 18;
export const ONBOARDING_STEPS = 5;

export const GENDER_OPTIONS = ["Woman", "Man", "Nonbinary"];

// Who the user wants to see in discovery, stored as an array of genders
export const INTEREST_OPTIONS = [
  { label: "Women", value: ["Woman"] },
  { label: "Men", value: ["Man"] },
  { label: "Everyone", value: GENDER_OPTIONS },
];

export const interestLabelFor = (interestedIn) =>
  INTEREST_OPTIONS.find(
    (opt) =>
      interestedIn?.length === opt.value.length &&
      opt.value.every((g) => interestedIn.includes(g))
  )?.label ?? "";

export const DEPARTMENT_OPTIONS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Business Administration",
  "Law",
  "Pharmacy",
  "Hotel Management",
  "Other",
];

export const getGraduationYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 9 }, (_, i) => String(currentYear + i));
};

export const ALLOWED_EMAIL_DOMAINS = [
  "galgotiasuniversity.ac.in",
  "galgotiasuniversity.edu.in",
];

export const normalizeEmail = (email) => email.trim().toLowerCase();

export const isAllowedEmail = (email) => {
  const domain = normalizeEmail(email).split("@")[1];
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

// Returns the first onboarding step the profile hasn't completed, or null
// when onboarding is done. Mirrors the `onboarding_done` generated column in
// supabase/migrations — keep the two in sync.
export const getNextOnboardingRoute = (profile) => {
  if (!profile?.accepted_terms_at) return "/onboarding/rules";
  if (!profile.full_name || !profile.birthday) return "/onboarding/step1";
  if (!profile.department || !profile.grad_year) return "/onboarding/step2";
  if (!profile.gender || !profile.interested_in?.length) {
    return "/onboarding/step3";
  }
  if (!profile.height_cm) return "/onboarding/step4";
  if ((profile.profile_image_urls?.length ?? 0) < MIN_PHOTOS_REQUIRED) {
    return "/onboarding/step5";
  }
  return null;
};

// Parses day/month/year strings into a "YYYY-MM-DD" birthday.
// Returns { birthday } or { error } with a user-facing message.
export const parseBirthday = (day, month, year) => {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  const date = new Date(y, m - 1, d);

  const isRealDate =
    Number.isInteger(d) &&
    Number.isInteger(m) &&
    Number.isInteger(y) &&
    y >= 1900 &&
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d;

  if (!isRealDate) {
    return { error: "Please enter a valid date of birth." };
  }

  const today = new Date();
  let age = today.getFullYear() - y;
  if (
    today.getMonth() < m - 1 ||
    (today.getMonth() === m - 1 && today.getDate() < d)
  ) {
    age -= 1;
  }

  if (age < MIN_AGE) {
    return { error: `You must be at least ${MIN_AGE} to use CampusCrush.` };
  }
  if (age > 100) {
    return { error: "Please enter a valid date of birth." };
  }

  const pad = (n) => String(n).padStart(2, "0");
  return { birthday: `${y}-${pad(m)}-${pad(d)}` };
};
