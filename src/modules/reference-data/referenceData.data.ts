import { EmotionTag, PaymentProvider } from "@prisma/client";

export const DEFAULT_CURRENCY = "EUR";
export const PROVIDER_COMMISSION_PERCENT = 15;

export const referenceCities = [
  { name: "Berlin", slug: "berlin", countryCode: "DE", isActive: true },
  { name: "Munich", slug: "munich", countryCode: "DE", isActive: true },
  { name: "Hamburg", slug: "hamburg", countryCode: "DE", isActive: true },
  { name: "Vienna", slug: "vienna", countryCode: "AT", isActive: true },
  { name: "Prague", slug: "prague", countryCode: "CZ", isActive: true },
  { name: "Warsaw", slug: "warsaw", countryCode: "PL", isActive: true },
] as const;

type SmartFacetKey =
  | "emotionMood"
  | "socialContext"
  | "activityStyle"
  | "personalGrowth"
  | "useCase"
  | "pricingStyle";

type TaxonomyOption = {
  name: string;
  slug: string;
  description: string;
};

type TaxonomyGroup = {
  key: SmartFacetKey;
  label: string;
  emoji?: string;
  description: string;
  options: TaxonomyOption[];
};

export const referenceCategoryTaxonomy: TaxonomyGroup[] = [
  {
    key: "emotionMood",
    label: "Emotional / Mood-Based",
    emoji: "❤️",
    description:
      "High-intent feeling states that help users discover experiences by the mood they want to create.",
    options: [
      {
        name: "Romantic",
        slug: "romantic",
        description: "Intimate experiences designed for warmth, closeness, and memorable shared moments.",
      },
      {
        name: "Relaxing",
        slug: "relaxing",
        description: "Low-pressure experiences that help people unwind, recharge, and slow down.",
      },
      {
        name: "Fun & Entertaining",
        slug: "fun-entertaining",
        description: "Playful, upbeat activities built around joy, laughter, and light energy.",
      },
      {
        name: "Adventurous",
        slug: "adventurous",
        description: "Discovery-led experiences that feel bold, active, and a little outside the routine.",
      },
      {
        name: "Exciting / Adrenaline",
        slug: "exciting-adrenaline",
        description: "Fast-paced experiences for thrill, anticipation, and elevated energy.",
      },
      {
        name: "Inspiring",
        slug: "inspiring",
        description: "Experiences that feel uplifting, expansive, and creatively energizing.",
      },
      {
        name: "Luxurious",
        slug: "luxurious",
        description: "Premium experiences centered on comfort, indulgence, and elevated service.",
      },
      {
        name: "Mindful & Spiritual",
        slug: "mindful-spiritual",
        description: "Grounding experiences focused on presence, reflection, ritual, and inner calm.",
      },
      {
        name: "Creative",
        slug: "creative",
        description: "Hands-on experiences that help people express, make, explore, and imagine.",
      },
      {
        name: "Social & Connecting",
        slug: "social-connecting",
        description: "Shared experiences that encourage conversation, chemistry, and togetherness.",
      },
    ],
  },
  {
    key: "socialContext",
    label: "Social Context",
    emoji: "👥",
    description:
      "Context tags that help the system understand who the experience is for.",
    options: [
      {
        name: "For Two (Couples)",
        slug: "for-two-couples",
        description: "Pair-focused experiences tailored for couples or two-person plans.",
      },
      {
        name: "Solo Experiences",
        slug: "solo-experiences",
        description: "Experiences that work especially well for one person exploring alone.",
      },
      {
        name: "With Friends",
        slug: "with-friends",
        description: "Shared activities designed for social groups and friend energy.",
      },
      {
        name: "Family-Friendly",
        slug: "family-friendly",
        description: "Options that are accessible, comfortable, and enjoyable for families.",
      },
      {
        name: "Group Activities",
        slug: "group-activities",
        description: "Experiences suited to several people booking together.",
      },
      {
        name: "Team Building / Corporate",
        slug: "team-building-corporate",
        description: "Formats built for teams, offsites, workplace wellness, or company events.",
      },
    ],
  },
  {
    key: "activityStyle",
    label: "Activity Style",
    emoji: "⚡️",
    description:
      "Delivery and format tags that describe how the experience actually feels on the ground.",
    options: [
      {
        name: "Extreme / Adrenaline",
        slug: "extreme-adrenaline",
        description: "High-thrill formats for people actively seeking intensity and rush.",
      },
      {
        name: "Outdoor Activities",
        slug: "outdoor-activities",
        description: "Experiences shaped by fresh air, scenery, and outdoor movement.",
      },
      {
        name: "Indoor Activities",
        slug: "indoor-activities",
        description: "Weather-proof experiences hosted inside studios, venues, or curated spaces.",
      },
      {
        name: "Water-Based Experiences",
        slug: "water-based-experiences",
        description: "Experiences that happen on, in, or around water.",
      },
      {
        name: "Night Experiences",
        slug: "night-experiences",
        description: "Evening-led options for after-dark energy, ambiance, and nightlife rhythm.",
      },
      {
        name: "Cultural Experiences",
        slug: "cultural-experiences",
        description: "Discovery rooted in local art, heritage, museums, craft, or tradition.",
      },
      {
        name: "Entertainment & Shows",
        slug: "entertainment-shows",
        description: "Performance-based options like live shows, events, and on-stage entertainment.",
      },
      {
        name: "Food & Drink Experiences",
        slug: "food-drink-experiences",
        description: "Culinary formats built around tasting, cooking, pairing, or hospitality.",
      },
    ],
  },
  {
    key: "personalGrowth",
    label: "Personal Growth",
    emoji: "🧠",
    description:
      "Learning-oriented tags for users who want a meaningful outcome beyond entertainment.",
    options: [
      {
        name: "Learning & Education",
        slug: "learning-education",
        description: "Experiences centered on discovery, skill-building, or knowledge.",
      },
      {
        name: "Workshops & Masterclasses",
        slug: "workshops-masterclasses",
        description: "Structured expert-led sessions with active participation.",
      },
      {
        name: "Wellness & Health",
        slug: "wellness-health",
        description: "Experiences supporting mental, emotional, or physical wellbeing.",
      },
      {
        name: "Fitness & Sports",
        slug: "fitness-sports",
        description: "Movement-based formats that emphasize athletic energy or training.",
      },
      {
        name: "Personal Development",
        slug: "personal-development",
        description: "Experiences focused on growth, confidence, self-awareness, and mindset.",
      },
    ],
  },
  {
    key: "useCase",
    label: "Use-Case Driven",
    emoji: "🗓️",
    description:
      "Planning shortcuts for common real-life scenarios and decision moments.",
    options: [
      {
        name: "Date Ideas",
        slug: "date-ideas",
        description: "Experiences optimized for chemistry, conversation, and memorable shared plans.",
      },
      {
        name: "Weekend Plans",
        slug: "weekend-plans",
        description: "Flexible discovery for free-time planning across Saturday and Sunday.",
      },
      {
        name: "Birthday Experiences",
        slug: "birthday-experiences",
        description: "Celebration-ready experiences that feel occasion-worthy.",
      },
      {
        name: "Special Occasions",
        slug: "special-occasions",
        description: "High-signal experiences for anniversaries, proposals, milestones, or gifts.",
      },
      {
        name: "Quick Activities (1–2 hours)",
        slug: "quick-activities",
        description: "Short-format options for users who want something meaningful without a full-day commitment.",
      },
      {
        name: "Full-Day Experiences",
        slug: "full-day-experiences",
        description: "Longer immersion formats that justify travel, planning, or a bigger time block.",
      },
      {
        name: "Unique / Hidden Gems",
        slug: "unique-hidden-gems",
        description: "Less-obvious options that feel special, local, or hard to find elsewhere.",
      },
    ],
  },
  {
    key: "pricingStyle",
    label: "Pricing Style",
    description:
      "Optional commercial tags for matching examples like budget-friendly versus premium plans.",
    options: [
      {
        name: "Budget-friendly",
        slug: "budget-friendly",
        description: "Lower-cost options that still feel rewarding and discovery-worthy.",
      },
      {
        name: "Mid-range",
        slug: "mid-range",
        description: "Balanced experiences with moderate spend and strong value.",
      },
      {
        name: "Premium",
        slug: "premium",
        description: "Higher-end options with elevated service, location, or production value.",
      },
    ],
  },
] as const;

export const referenceCategories = referenceCategoryTaxonomy.flatMap((group) =>
  group.key === "pricingStyle"
    ? []
    : group.options.map((option) => ({
        name: option.name,
        slug: option.slug,
        description: option.description,
        isActive: true,
      }))
);

export const referenceSmartFilterCombos = [
  {
    slug: "romantic-outdoor-evening",
    label: "Romantic + Outdoor + Evening",
    tags: ["romantic", "outdoor-activities", "night-experiences"],
    description:
      "Good for date-night discovery with atmosphere, open air, and a stronger sense of occasion.",
  },
  {
    slug: "adrenaline-group-weekend",
    label: "Adrenaline + Group + Weekend",
    tags: ["exciting-adrenaline", "group-activities", "weekend-plans"],
    description:
      "Best for high-energy group booking intent when people want something active and memorable.",
  },
  {
    slug: "relaxing-solo-budget-friendly",
    label: "Relaxing + Solo + Budget-friendly",
    tags: ["relaxing", "solo-experiences", "budget-friendly"],
    description:
      "A practical recovery-minded route for users who want a calming plan without a premium spend.",
  },
  {
    slug: "luxurious-for-two-special-occasion",
    label: "Luxurious + For Two + Special Occasion",
    tags: ["luxurious", "for-two-couples", "special-occasions"],
    description:
      "Designed for high-intent premium bookings around celebrations, gifting, or romantic milestones.",
  },
  {
    slug: "creative-with-friends-night",
    label: "Creative + With Friends + Night",
    tags: ["creative", "with-friends", "night-experiences"],
    description:
      "Ideal for social plans where the group wants interaction, expression, and an evening vibe.",
  },
  {
    slug: "mindful-solo-quick",
    label: "Mindful + Solo + Quick Activity",
    tags: ["mindful-spiritual", "solo-experiences", "quick-activities"],
    description:
      "Useful for low-friction wellness discovery when a user needs a short reset, not a big outing.",
  },
] as const;

export const referenceSubscriptionPlans = [
  {
    code: "joy-map-monthly",
    name: "Joy Map Monthly",
    description: "Weekly AI Joy Maps, tailored recommendations, and subscription perks.",
    priceAmount: 2900,
    currency: DEFAULT_CURRENCY,
    intervalMonths: 1,
    isActive: true,
    paymentProviders: [PaymentProvider.STRIPE, PaymentProvider.YOOKASSA],
  },
] as const;

export const referenceWalletTopUpMethods = [
  {
    code: "CARD",
    label: "Cards",
    description: "Standard card top-up flow for customer wallets and checkout.",
    enabled: true,
  },
  {
    code: "SBER",
    label: "Sber",
    description: "Reserved for Sber-based top-ups when local payment support is enabled.",
    enabled: false,
  },
  {
    code: "WILDBERRIES_PAY",
    label: "Wildberries Pay",
    description: "Reserved for future Wildberries Pay wallet top-ups.",
    enabled: false,
  },
] as const;

export const referenceNotificationChannels = {
  push: ["Telegram", "App"],
  inApp: ["In-app messages"],
} as const;

export const referenceDashboardBlueprints = {
  customer: {
    web: [
      "Profile",
      "Bookings Dashboard",
      "Wallet & Payments",
      "Notifications",
    ],
  },
  provider: {
    webPanel: [
      "Business Profile",
      "Orders & Bookings",
      "Analytics Dashboard",
      "Payouts",
      "Marketing",
    ],
  },
  admin: {
    adminPanel: [
      "Dashboard Overview",
      "Providers Management",
      "Customers Management",
      "Financials",
      "Content Moderation",
      "Marketing Tools",
    ],
  },
} as const;

export const emotionMetadata = [
  {
    value: EmotionTag.CALM,
    label: "Calm",
    description: "Slow down and create space to breathe.",
    colorToken: "sage",
  },
  {
    value: EmotionTag.JOY,
    label: "Joy",
    description: "Lift mood and reconnect with delight.",
    colorToken: "coral",
  },
  {
    value: EmotionTag.ENERGY,
    label: "Energy",
    description: "Build momentum and feel activated.",
    colorToken: "sun",
  },
  {
    value: EmotionTag.RECOVERY,
    label: "Recovery",
    description: "Support rest, repair, and nervous-system reset.",
    colorToken: "stone",
  },
  {
    value: EmotionTag.FOCUS,
    label: "Focus",
    description: "Reduce noise and strengthen mental clarity.",
    colorToken: "teal",
  },
  {
    value: EmotionTag.BALANCE,
    label: "Balance",
    description: "Find steadiness across body, mind, and schedule.",
    colorToken: "sand",
  },
  {
    value: EmotionTag.CONFIDENCE,
    label: "Confidence",
    description: "Feel more expressive, capable, and self-assured.",
    colorToken: "rose",
  },
  {
    value: EmotionTag.RELAX,
    label: "Relax",
    description: "Release tension and unwind intentionally.",
    colorToken: "lavender",
  },
  {
    value: EmotionTag.SOCIAL,
    label: "Social",
    description: "Connect through shared experiences and group energy.",
    colorToken: "sky",
  },
  {
    value: EmotionTag.MINDFULNESS,
    label: "Mindfulness",
    description: "Return attention to the present with gentle rituals.",
    colorToken: "forest",
  },
] as const;
