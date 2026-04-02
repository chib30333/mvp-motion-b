import {
    FALLBACK_CATEGORY_BY_EMOTION,
    JOY_MAP_DEFAULT_DAYS,
} from "./joyMap.constants.ts";
import type {
    JoyMapGenerationContext,
    ParsedJoyMapPlan,
} from "./joyMap.types.ts";

export class JoyMapFallbackService {
    build(context: JoyMapGenerationContext): ParsedJoyMapPlan {
        const topEmotions = context.topEmotionPreferences.length
            ? context.topEmotionPreferences.map((p) => p.emotion)
            : ["BALANCE", "CALM", "JOY"];

        const allowedSlugs = new Set(context.allowedCategories.map((c) => c.slug));

        const items = JOY_MAP_DEFAULT_DAYS.map((dayOfWeek, index) => {
            const emotion = topEmotions[index % topEmotions.length] ?? "BALANCE";
            const candidateCategories = FALLBACK_CATEGORY_BY_EMOTION[emotion] ?? ["yoga"];

            const matchedSlug =
                candidateCategories.find((slug) => allowedSlugs.has(slug)) ??
                context.allowedCategories[0]?.slug ??
                "yoga";

            return {
                dayOfWeek,
                emotionTag: emotion,
                categorySlug: matchedSlug,
                title: this.buildTitle(matchedSlug, dayOfWeek),
                reason: this.buildReason(emotion),
            };
        });

        return {
            summary: "This week focuses on balance, supportive movement, and emotional reset.",
            items,
        };
    }

    private buildTitle(categorySlug: string, dayOfWeek: number) {
        const dayNames: Record<number, string> = {
            1: "Monday",
            3: "Wednesday",
            5: "Friday",
            7: "Sunday",
        };

        const label = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
        return `${label} for a better ${dayNames[dayOfWeek] ?? "day"}`;
    }

    private buildReason(emotion: string) {
        switch (emotion) {
            case "CALM":
                return "A gentler session may help create steadiness and reduce stress.";
            case "JOY":
                return "A more uplifting activity can support a lighter, brighter mood.";
            case "RECOVERY":
                return "A recovery-focused choice may help restore energy after a busy stretch.";
            case "ENERGY":
                return "A more active session can help bring movement and momentum into the week.";
            default:
                return "This activity may support a healthier emotional balance during the week.";
        }
    }
}