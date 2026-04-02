import { PrismaClient } from "@prisma/client";
import type {
    EnrichedJoyMapItem,
    JoyMapGenerationContext,
    ParsedJoyMapPlan,
} from "./joyMap.types.ts";

export class JoyMapMatcherService {
    constructor(private readonly prisma: PrismaClient) { }

    async attachSuggestedServices(
        context: JoyMapGenerationContext,
        plan: ParsedJoyMapPlan
    ): Promise<{ summary: string; items: EnrichedJoyMapItem[] }> {
        const items: EnrichedJoyMapItem[] = [];

        for (const item of plan.items) {
            const category = context.allowedCategories.find(
                (c) => c.slug === item.categorySlug
            );

            let suggestedServiceId: string | null = null;

            if (context.city?.id && category?.id) {
                const service = await this.prisma.service.findFirst({
                    where: {
                        cityId: context.city.id,
                        categoryId: category.id,
                        status: "ACTIVE",
                        provider: {
                            approvalStatus: "APPROVED",
                        },
                    },
                    orderBy: [
                        { isFeatured: "desc" },
                        { ratingAverage: "desc" },
                        { ratingCount: "desc" },
                        { createdAt: "desc" },
                    ],
                    select: {
                        id: true,
                    },
                });

                suggestedServiceId = service?.id ?? null;
            }

            items.push({
                dayOfWeek: item.dayOfWeek,
                emotionTag: item.emotionTag,
                categoryId: category?.id ?? null,
                categorySlug: category?.slug ?? item.categorySlug ?? null,
                title: item.title,
                reason: item.reason,
                suggestedServiceId,
            });
        }

        return {
            summary: plan.summary,
            items,
        };
    }
}