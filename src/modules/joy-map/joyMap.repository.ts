import { PrismaClient } from "@prisma/client";
import type { EnrichedJoyMapItem } from "./joyMap.types.ts";

type CreateJoyMapWithItemsInput = {
    userId: string;
    weekStart: Date;
    version: number;
    inputSummary: string | null;
    promptText: string | null;
    rawAiResponse: string | null;
    summary: string;
    items: EnrichedJoyMapItem[];
};

export class JoyMapRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findCurrentWeekActiveByUserId(userId: string, weekStart: Date) {
        return this.prisma.joyMap.findFirst({
            where: {
                userId,
                weekStart,
                status: "ACTIVE",
            },
            include: {
                items: {
                    include: {
                        category: true,
                        suggestedService: {
                            include: {
                                provider: true,
                                city: true,
                            },
                        },
                    },
                    orderBy: {
                        dayOfWeek: "asc",
                    },
                },
            },
        });
    }

    async findHistoryByUserId(userId: string, limit = 8) {
        return this.prisma.joyMap.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        category: true,
                        suggestedService: {
                            include: {
                                provider: true,
                                city: true,
                            },
                        },
                    },
                    orderBy: {
                        dayOfWeek: "asc",
                    },
                },
            },
            orderBy: {
                weekStart: "desc",
            },
            take: limit,
        });
    }

    async archiveCurrentWeekMaps(userId: string, weekStart: Date) {
        await this.prisma.joyMap.updateMany({
            where: {
                userId,
                weekStart,
                status: "ACTIVE",
            },
            data: {
                status: "ARCHIVED",
            },
        });
    }

    async createJoyMapWithItems(input: CreateJoyMapWithItemsInput) {
        await this.archiveCurrentWeekMaps(input.userId, input.weekStart);

        return this.prisma.joyMap.create({
            data: {
                userId: input.userId,
                status: "ACTIVE",
                weekStart: input.weekStart,
                inputSummary: input.inputSummary,
                promptText: input.promptText,
                rawAiResponse: input.rawAiResponse,
                version: input.version,
                items: {
                    create: input.items.map((item, index) => ({
                        dayOfWeek: item.dayOfWeek,
                        title: item.title,
                        reason: item.reason,
                        emotionTag: item.emotionTag as any,
                        categoryId: item.categoryId,
                        suggestedServiceId: item.suggestedServiceId,
                        sortOrder: index,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        category: true,
                        suggestedService: {
                            include: {
                                provider: true,
                                city: true,
                            },
                        },
                    },
                    orderBy: {
                        dayOfWeek: "asc",
                    },
                },
            },
        });
    }
}