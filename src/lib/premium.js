// Premium plans. Prices are shown in the app; the actual charge will come from
// the payment provider (see docs/ROADMAP.md, "Payments").
export const PLANS = [
  { id: "day", title: "1 day", price: 9, note: "24-hour pass, doesn't renew" },
  { id: "week", title: "1 week", price: 49, note: "₹7/day" },
  { id: "month", title: "1 month", price: 99, note: "₹3.3/day · best value", highlight: true },
];

export const PREMIUM_BENEFITS = [
  { icon: "heart", title: "See who likes you", text: "Match instantly with people who already liked you." },
  { icon: "infinity", title: "Unlimited swipes", text: "No daily limit of 20 swipes." },
  { icon: "users", title: "Unlimited matches", text: "Free accounts can have 5 active matches at a time." },
  { icon: "star", title: "5 SuperSwipes a day", text: "Stand out and go first in their Discover. Free accounts get 1." },
  { icon: "sliders-h", title: "Advanced filters", text: "Filter by department, year, what they're looking for and verified profiles." },
  { icon: "undo", title: "Undo your last swipe", text: "Bring back someone you passed on by accident." },
];

// Headline shown on the Premium screen depending on what sent the user there
export const PAYWALL_REASONS = {
  likes: "See everyone who likes you",
  swipes: "You've used all 20 swipes for today",
  matches: "You've reached 5 active matches",
  undo: "Undo is a Premium feature",
  superlikes: "Get 5 SuperSwipes every day",
  filters: "Unlock advanced filters",
};

// Error messages raised by the database functions for free-tier limits
export const LIMIT_ERRORS = {
  swipe_limit_reached: "swipes",
  match_limit_reached: "matches",
  premium_required: "likes",
  superlike_limit_reached: "superlikes",
};

// Keys of profiles.discovery_filters that only apply for Premium (the
// server ignores them for free accounts)
export const PREMIUM_FILTER_KEYS = ["departments", "grad_years", "goals", "verified_only"];

export const hasActiveFilters = (filters = {}) =>
  (filters.age_min != null && filters.age_min > 18) ||
  (filters.age_max != null && filters.age_max < 60) ||
  PREMIUM_FILTER_KEYS.some((k) => (Array.isArray(filters[k]) ? filters[k].length > 0 : !!filters[k]));
