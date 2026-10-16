// Options for the profile fields added in the Bumble-style onboarding.
// Stored values must match the constraints in
// supabase/migrations/20261018000000_premium_profiles_first_move.sql.

export const RELATIONSHIP_GOALS = [
  { value: "relationship", label: "A relationship", emoji: "💘" },
  { value: "casual", label: "Something casual", emoji: "😉" },
  { value: "friends", label: "New friends", emoji: "👋" },
  { value: "not_sure", label: "Not sure yet", emoji: "🤔" },
];

export const goalFor = (value) => RELATIONSHIP_GOALS.find((g) => g.value === value);

export const MIN_INTERESTS = 3;
export const MAX_INTERESTS = 5;

export const INTEREST_TAGS = [
  "🎵 Music", "🎬 Movies", "🎮 Gaming", "🏏 Cricket", "⚽ Football",
  "🏀 Basketball", "🏸 Badminton", "💪 Gym", "🧘 Yoga", "💃 Dance",
  "🎤 Singing", "✈️ Travel", "🍕 Foodie", "☕ Coffee", "🍳 Cooking",
  "📸 Photography", "📚 Reading", "✍️ Poetry", "🎨 Art", "👗 Fashion",
  "💻 Coding", "🚀 Startups", "🎌 Anime", "📺 K-drama", "🍿 Netflix",
  "😂 Memes", "🎭 Stand-up", "🐶 Pets", "🥾 Hiking", "🤝 Volunteering",
];

export const LIFESTYLE_FIELDS = [
  {
    key: "drinker_status",
    cardKey: "drinking",
    label: "Do you drink?",
    icon: "glass-cheers",
    options: ["Never", "Socially", "Often", "Prefer not to say"],
  },
  {
    key: "smoker_status",
    cardKey: "smoking",
    label: "Do you smoke?",
    icon: "smoking",
    options: ["Never", "Socially", "Regularly", "Prefer not to say"],
  },
  {
    key: "exercise_status",
    cardKey: "exercise",
    label: "How often do you work out?",
    icon: "dumbbell",
    options: ["Never", "Sometimes", "Often", "Every day"],
  },
  {
    key: "religion",
    cardKey: "religion",
    label: "Religion",
    icon: "praying-hands",
    options: [
      "Hindu", "Muslim", "Sikh", "Christian", "Jain", "Buddhist",
      "Spiritual", "Atheist", "Agnostic", "Other", "Prefer not to say",
    ],
  },
];

export const MAX_PROMPTS = 3;
export const PROMPT_ANSWER_MAX = 150;

export const PROMPTS = [
  "My ideal campus date is…",
  "The way to win me over is…",
  "My go-to canteen order…",
  "I'm overly competitive about…",
  "Two truths and a lie…",
  "A random fact I love…",
  "My simple pleasures…",
  "A typical Sunday for me…",
  "Green flags I look for…",
  "I'll fall for you if…",
  "I'm looking for someone who…",
  "The best spot on campus is…",
];
