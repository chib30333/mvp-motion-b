export type GenerateJoyMapRequestDto = {
    forceRegenerate?: boolean;
};

export type JoyMapGenerationContext = {
    userId: string;
    weekStartIso: string;
    age: number | null;
    city: {
        id: string;
        name: string;
        slug: string;
    } | null;
    moodNotes: string | null;
    topEmotionPreferences: Array<{
        emotion: string;
        score: number;
    }>;
    allowedCategories: Array<{
        id: string;
        name: string;
        slug: string;
    }>;
};

export type ParsedJoyMapItem = {
    dayOfWeek: number;
    emotionTag: string;
    categorySlug: string | null;
    title: string;
    reason: string;
};

export type ParsedJoyMapPlan = {
    summary: string;
    items: ParsedJoyMapItem[];
};

export type EnrichedJoyMapItem = {
    dayOfWeek: number;
    emotionTag: string;
    categoryId: string | null;
    categorySlug: string | null;
    title: string;
    reason: string;
    suggestedServiceId: string | null;
};

export type JoyMapResponseDto = {
    id: string;
    weekStart: string;
    summary: string;
    status: string;
    version: number;
    items: Array<{
        id: string;
        dayOfWeek: number;
        dayLabel: string;
        emotionTag: string;
        category: {
            id: string | null;
            name: string | null;
            slug: string | null;
        };
        title: string;
        reason: string;
        suggestedService: {
            id: string;
            title: string;
            slug: string;
            priceAmount: number;
            currency: string;
            coverImageUrl: string | null;
            ratingAverage: number;
            providerName: string;
            cityName: string;
        } | null;
    }>;
};