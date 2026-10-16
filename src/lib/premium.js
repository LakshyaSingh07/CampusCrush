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
  { icon: "undo", title: "Undo your last swipe", text: "Bring back someone you passed on by accident." },
];

// Headline shown on the Premium screen depending on what sent the user there
export const PAYWALL_REASONS = {
  likes: "See everyone who likes you",
  swipes: "You've used all 20 swipes for today",
  matches: "You've reached 5 active matches",
  undo: "Undo is a Premium feature",
};

// Error messages raised by the database functions for free-tier limits
export const LIMIT_ERRORS = {
  swipe_limit_reached: "swipes",
  match_limit_reached: "matches",
  premium_required: "likes",
};
