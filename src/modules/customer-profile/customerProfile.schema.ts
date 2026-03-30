import { EmotionTag } from "@prisma/client";
import { z } from "zod";

const emotionPreferenceSchema = z.object({
    emotion: z.nativeEnum(EmotionTag),
    score: z.number().int().min(1).max(5),
});

const uniqueEmotionPreferences = (items: { emotion: EmotionTag }[]) => {
    const emotions = items.map((item) => item.emotion);
    return new Set(emotions).size === emotions.length;
};

export const updateCustomerProfileSchema = z.object({
    age: z.number().int().min(13).max(120).optional(),
    cityId: z.string().cuid().optional(),
    moodNotes: z.string().trim().max(1000).optional(),
    preferredRadiusKm: z.number().int().min(1).max(100).optional(),
});

export const onboardingCustomerSchema = z
    .object({
        age: z.number().int().min(13).max(120),
        cityId: z.string().cuid(),
        moodNotes: z.string().trim().max(1000).optional(),
        preferredRadiusKm: z.number().int().min(1).max(100).optional(),
        emotionPreferences: z.array(emotionPreferenceSchema).min(1).max(10),
    })
    .refine((data) => uniqueEmotionPreferences(data.emotionPreferences), {
        message: "Emotion preferences must not contain duplicate emotions",
        path: ["emotionPreferences"],
    });