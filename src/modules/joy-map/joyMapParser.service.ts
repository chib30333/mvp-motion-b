import { joyMapAiResponseSchema } from "./joyMap.schema.ts";
import type { ParsedJoyMapPlan } from "./joyMap.types.ts";

export class JoyMapParserService {
    parse(rawText: string, allowedCategorySlugs: string[]): ParsedJoyMapPlan {
        const parsedJson = JSON.parse(rawText);

        const normalized = {
            summary: parsedJson.summary,
            items: Array.isArray(parsedJson.items)
                ? parsedJson.items.map((item: any) => ({
                    dayOfWeek: item.dayOfWeek,
                    emotionTag: String(item.emotionTag ?? "").trim().toUpperCase(),
                    categorySlug:
                        item.categorySlug == null
                            ? null
                            : String(item.categorySlug).trim().toLowerCase(),
                    title: String(item.title ?? "").trim(),
                    reason: String(item.reason ?? "").trim(),
                }))
                : [],
        };

        const validated = joyMapAiResponseSchema.parse(normalized);

        const allowedSet = new Set(allowedCategorySlugs.map((x) => x.toLowerCase()));
        const seenDays = new Set<number>();

        const filteredItems = validated.items
            .filter((item) => {
                if (item.categorySlug && !allowedSet.has(item.categorySlug)) return false;
                if (seenDays.has(item.dayOfWeek)) return false;
                seenDays.add(item.dayOfWeek);
                return true;
            })
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

        if (filteredItems.length < 3) {
            throw new Error("Parsed Joy Map has too few valid items");
        }

        return {
            summary: validated.summary.trim(),
            items: filteredItems.map((item) => ({
                ...item,
                categorySlug: item.categorySlug ?? null
            })),
        };
    }
}