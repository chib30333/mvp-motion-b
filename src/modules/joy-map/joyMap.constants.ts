export const JOY_MAP_PROMPT_VERSION = 1;
export const JOY_MAP_MIN_ITEMS = 3;
export const JOY_MAP_MAX_ITEMS = 5;
export const JOY_MAP_DEFAULT_DAYS = [1, 3, 5, 7] as const;

export const DAY_LABELS: Record<number, string> = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
    7: "Sunday",
};

export const FALLBACK_CATEGORY_BY_EMOTION: Record<string, string[]> = {
    CALM: ["yoga", "meditation", "stretching"],
    JOY: ["dance", "workshops"],
    ENERGY: ["dance", "stretching", "breathwork"],
    RECOVERY: ["spa", "massage"],
    FOCUS: ["mindfulness", "breathwork"],
    BALANCE: ["yoga", "mindfulness", "stretching"],
    CONFIDENCE: ["workshops", "dance"],
    RELAX: ["spa", "massage", "meditation"],
    SOCIAL: ["dance", "workshops"],
    MINDFULNESS: ["mindfulness", "meditation", "breathwork"],
};