// DRAFT: have these reviewed before the public launch (see docs/ROADMAP.md).
// Bump LEGAL_LAST_UPDATED whenever the text changes.

export const LEGAL_LAST_UPDATED = "16 October 2026";

export const HOUSE_RULES = [
  {
    icon: "user-check",
    title: "Be yourself",
    text: "Use your own photos and real details. No fake profiles or pretending to be someone else.",
  },
  {
    icon: "hand-holding-heart",
    title: "Be kind and respectful",
    text: "Treat people the way you'd want to be treated. No harassment, hate speech or bullying.",
  },
  {
    icon: "shield-alt",
    title: "Stay safe",
    text: "Meet in public places on campus first, and never share passwords or money.",
  },
  {
    icon: "flag",
    title: "Speak up",
    text: "If someone makes you uncomfortable, block or report them. Reports are anonymous.",
  },
];

export const LEGAL_DOCS = {
  guidelines: {
    title: "Community Guidelines",
    sections: [
      {
        heading: "Who can use CampusCrush",
        body: "CampusCrush is only for current Galgotias University students who are 18 or older. You need a valid university email address to sign up. One account per person.",
      },
      {
        heading: "Be authentic",
        body: "Your photos must clearly show you. Don't use photos of other people, celebrities or AI-generated images, and don't lie about your age, department or year.",
      },
      {
        heading: "Respect others",
        body: "Harassment, threats, bullying, hate speech, and discrimination based on gender, religion, caste, region, sexuality or disability are not allowed. If someone isn't interested, respect that and move on.",
      },
      {
        heading: "Keep it appropriate",
        body: "No nudity or sexually explicit photos. Don't send sexual messages to anyone who hasn't clearly welcomed them.",
      },
      {
        heading: "No spam or selling",
        body: "Don't use CampusCrush to advertise, sell anything, promote other platforms, or ask people for money.",
      },
      {
        heading: "Safety",
        body: "Take your time getting to know someone. Meet in a public place for the first time and tell a friend where you're going. Never share your password, OTP or bank details.",
      },
      {
        heading: "What happens if you break the rules",
        body: "Profiles that get several reports are hidden while we review them. We may remove content or permanently suspend accounts that break these guidelines. Serious cases, such as threats or underage users, may be reported to the university or the police.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "What we collect",
        body: "Your university email; the profile details you add (first name, birthday, department, graduation year, gender, who you'd like to see, height, bio and photos); your likes, passes, matches and messages; reports and blocks you make; and a push notification token if you allow notifications.",
      },
      {
        heading: "What other students see",
        body: "Other users see your first name, age, department, graduation year, height, bio and photos. They never see your email address or your full date of birth. Only your matches can message you, and only the two of you can read your conversation.",
      },
      {
        heading: "How we use your data",
        body: "To verify you're a student, show you to people you might like, create matches, deliver messages and notifications, and keep the community safe (including reviewing reports). We don't sell your data or use it for advertising.",
      },
      {
        heading: "Who processes it",
        body: "Supabase (database, login and messaging), Cloudinary (photo storage) and Expo (push notifications) process data for us to run the app.",
      },
      {
        heading: "How long we keep it",
        body: "We keep your data while your account exists. When you delete your account in the app, your profile, photos, likes, matches, messages and notification tokens are deleted. Reports you made about others may be kept for safety reasons.",
      },
      {
        heading: "Your rights",
        body: "Under India's Digital Personal Data Protection Act, 2023, you can access, correct and delete your data. You can edit your profile and delete your account at any time from the Profile tab. You can pause your profile to stop appearing in Discover.",
      },
      {
        heading: "Contact",
        body: "For privacy questions or to raise a grievance, contact the CampusCrush team.",
      },
    ],
  },
};
