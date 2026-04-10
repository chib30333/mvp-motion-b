import { EmotionTag, PaymentProvider } from "@prisma/client";

export const DEFAULT_CURRENCY = "EUR";

export const referenceCities = [
  { name: "Berlin", slug: "berlin", countryCode: "DE", isActive: true },
  { name: "Munich", slug: "munich", countryCode: "DE", isActive: true },
  { name: "Hamburg", slug: "hamburg", countryCode: "DE", isActive: true },
  { name: "Vienna", slug: "vienna", countryCode: "AT", isActive: true },
  { name: "Prague", slug: "prague", countryCode: "CZ", isActive: true },
  { name: "Warsaw", slug: "warsaw", countryCode: "PL", isActive: true },
] as const;

export const referenceCategories = [
  {
    name: "Yoga",
    slug: "yoga",
    description: "Grounding movement sessions for calm, flexibility, and emotional reset.",
    isActive: true,
  },
  {
    name: "Dance",
    slug: "dance",
    description: "Joyful movement classes that support energy, confidence, and release.",
    isActive: true,
  },
  {
    name: "SPA",
    slug: "spa",
    description: "Premium restorative treatments for recovery, deep rest, and balance.",
    isActive: true,
  },
  {
    name: "Workshops",
    slug: "workshops",
    description: "Guided group sessions focused on reflection, growth, and connection.",
    isActive: true,
  },
  {
    name: "Mindfulness",
    slug: "mindfulness",
    description: "Meditation, presence, and breathing practices for everyday steadiness.",
    isActive: true,
  },
  {
    name: "Recovery",
    slug: "recovery",
    description: "Body and nervous-system support through stretching, massage, and reset rituals.",
    isActive: true,
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
