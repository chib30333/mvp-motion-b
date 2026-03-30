type CustomerProfileEntity = {
    id: string;
    userId: string;
    age: number | null;
    city: { id: string; name: string; slug: string } | null;
    moodNotes: string | null;
    preferredRadiusKm: number | null;
    onboardingDone: boolean;
    preferences: {
        emotion: string;
        score: number;
    }[];
};

export const mapCustomerProfile = (profile: CustomerProfileEntity) => {
    return {
        id: profile.id,
        userId: profile.userId,
        age: profile.age,
        city: profile.city
            ? {
                id: profile.city.id,
                name: profile.city.name,
                slug: profile.city.slug,
            }
            : null,
        moodNotes: profile.moodNotes,
        preferredRadiusKm: profile.preferredRadiusKm,
        onboardingDone: profile.onboardingDone,
        emotionPreferences: profile.preferences.map((item) => ({
            emotion: item.emotion,
            score: item.score,
        })),
    };
};