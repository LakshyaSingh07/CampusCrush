export const getAge = (birthday) => {
  if (!birthday) return null;
  const [y, m, d] = birthday.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (
    today.getMonth() + 1 < m ||
    (today.getMonth() + 1 === m && today.getDate() < d)
  ) {
    age -= 1;
  }
  return age;
};

// Converts the signed-in user's own `profiles` row into the same shape the
// discovery/match RPCs return, so ProfileCard can render either.
export const toPublicProfile = (profile) => ({
  user_id: profile.user_id,
  first_name: profile.full_name?.trim().split(/\s+/)[0] ?? "",
  age: getAge(profile.birthday),
  department: profile.department,
  grad_year: profile.grad_year,
  gender: profile.gender,
  height_cm: profile.height_cm,
  bio: profile.bio,
  photos: profile.profile_image_urls ?? [],
  relationship_goal: profile.relationship_goal,
  interests: profile.interests ?? [],
  drinking: profile.drinker_status,
  smoking: profile.smoker_status,
  exercise: profile.exercise_status,
  religion: profile.religion,
  hometown: profile.hometown,
  prompts: profile.prompt_answers ?? [],
});

export const REPORT_REASONS = [
  { value: "fake_profile", label: "Fake profile" },
  { value: "inappropriate_photos", label: "Inappropriate photos" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "spam", label: "Spam or scam" },
  { value: "underage", label: "Appears to be under 18" },
  { value: "other", label: "Something else" },
];
