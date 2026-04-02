import { DAY_LABELS } from "./joyMap.constants.ts";
import type { JoyMapResponseDto } from "./joyMap.types.ts";

export class JoyMapMapper {
    toResponse(entity: any): JoyMapResponseDto {
        return {
            id: entity.id,
            weekStart: entity.weekStart.toISOString(),
            summary: this.buildSummary(entity),
            status: entity.status,
            version: entity.version,
            items: entity.items.map((item: any) => ({
                id: item.id,
                dayOfWeek: item.dayOfWeek,
                dayLabel: DAY_LABELS[item.dayOfWeek] ?? `Day ${item.dayOfWeek}`,
                emotionTag: item.emotionTag,
                category: {
                    id: item.category?.id ?? null,
                    name: item.category?.name ?? null,
                    slug: item.category?.slug ?? null,
                },
                title: item.title,
                reason: item.reason,
                suggestedService: item.suggestedService
                    ? {
                        id: item.suggestedService.id,
                        title: item.suggestedService.title,
                        slug: item.suggestedService.slug,
                        priceAmount: item.suggestedService.priceAmount,
                        currency: item.suggestedService.currency,
                        coverImageUrl: item.suggestedService.coverImageUrl,
                        ratingAverage: Number(item.suggestedService.ratingAverage),
                        providerName: item.suggestedService.provider.brandName,
                        cityName: item.suggestedService.city.name,
                    }
                    : null,
            })),
        };
    }

    private buildSummary(entity: any) {
        if (entity.inputSummary) return entity.inputSummary;
        return "Your personalized Joy Map for the week.";
    }
}