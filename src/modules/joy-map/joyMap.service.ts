import { PrismaClient, SubscriptionStatus } from "@prisma/client";
import { JOY_MAP_PROMPT_VERSION } from "./joyMap.constants.ts";
import type {
    GenerateJoyMapRequestDto,
    JoyMapGenerationContext,
} from "./joyMap.types.ts";
import { JoyMapRepository } from "./joyMap.repository.ts";
import { JoyMapPromptService } from "./joyMapPrompt.service.ts";
import { JoyMapParserService } from "./joyMapParser.service.ts";
import { JoyMapMatcherService } from "./joyMapMatcher.service.ts";
import { JoyMapFallbackService } from "./joyMapFallback.service.ts";
import { JoyMapMapper } from "./joyMap.mapper.ts";

type OpenAiClient = {
    generateStructuredJoyMap(input: {
        systemPrompt: string;
        userPrompt: string;
    }): Promise<string>;
};

export class JoyMapService {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly repository: JoyMapRepository,
        private readonly promptService: JoyMapPromptService,
        private readonly parserService: JoyMapParserService,
        private readonly matcherService: JoyMapMatcherService,
        private readonly fallbackService: JoyMapFallbackService,
        private readonly mapper: JoyMapMapper,
        private readonly openAiClient: OpenAiClient
    ) { }

    async generateCurrentWeek(
        userId: string,
        input: GenerateJoyMapRequestDto
    ) {
        const weekStart = this.getWeekStart(new Date());

        const existing = await this.repository.findCurrentWeekActiveByUserId(
            userId,
            weekStart
        );

        if (existing && !input.forceRegenerate) {
            return this.mapper.toResponse(existing);
        }

        await this.assertActiveSubscription(userId);

        const context = await this.buildGenerationContext(userId, weekStart);

        let rawAiResponse: string | null = null;
        let promptText: string | null = null;
        let parsedPlan;

        try {
            const prompts = this.promptService.build(context);
            promptText = `${prompts.systemPrompt}\n\n${prompts.userPrompt}`;
            rawAiResponse = await this.openAiClient.generateStructuredJoyMap(prompts);

            parsedPlan = this.parserService.parse(
                rawAiResponse,
                context.allowedCategories.map((c) => c.slug)
            );
        } catch {
            parsedPlan = this.fallbackService.build(context);
        }

        const enrichedPlan = await this.matcherService.attachSuggestedServices(
            context,
            parsedPlan
        );

        const saved = await this.repository.createJoyMapWithItems({
            userId,
            weekStart,
            version: JOY_MAP_PROMPT_VERSION,
            inputSummary: parsedPlan.summary,
            promptText,
            rawAiResponse,
            summary: parsedPlan.summary,
            items: enrichedPlan.items,
        });

        return this.mapper.toResponse(saved);
    }

    async getCurrentWeek(userId: string) {
        const weekStart = this.getWeekStart(new Date());
        const current = await this.repository.findCurrentWeekActiveByUserId(
            userId,
            weekStart
        );

        if (!current) {
            return null;
        }

        return this.mapper.toResponse(current);
    }

    async getHistory(userId: string, limit = 8) {
        const history = await this.repository.findHistoryByUserId(userId, limit);
        return history.map((item) => this.mapper.toResponse(item));
    }

    private async assertActiveSubscription(userId: string) {
        const subscription = await this.prisma.subscription.findFirst({
            where: {
                userId,
                status: SubscriptionStatus.ACTIVE,
                OR: [
                    { currentPeriodEnd: null },
                    { currentPeriodEnd: { gt: new Date() } },
                ],
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
            },
        });

        if (!subscription) {
            throw new Error("Active subscription required to generate Joy Map");
        }
    }

    private async buildGenerationContext(
        userId: string,
        weekStart: Date
    ): Promise<JoyMapGenerationContext> {
        const profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
            include: {
                city: true,
                preferences: true,
            },
        });

        if (!profile) {
            throw new Error("Customer profile not found");
        }

        if (!profile.onboardingDone) {
            throw new Error("Complete onboarding before generating Joy Map");
        }

        const allowedCategories = await this.prisma.category.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                slug: true,
            },
        });

        if (!allowedCategories.length) {
            throw new Error("No active categories configured");
        }

        const topEmotionPreferences = [...profile.preferences]
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((p) => ({
                emotion: p.emotion,
                score: p.score,
            }));

        if (!topEmotionPreferences.length) {
            throw new Error("No emotion preferences found");
        }

        return {
            userId,
            weekStartIso: weekStart.toISOString(),
            age: profile.age ?? null,
            city: profile.city
                ? {
                    id: profile.city.id,
                    name: profile.city.name,
                    slug: profile.city.slug,
                }
                : null,
            moodNotes: profile.moodNotes ?? null,
            topEmotionPreferences,
            allowedCategories,
        };
    }

    private getWeekStart(date: Date) {
        const d = new Date(date);
        const day = d.getUTCDay();
        const diff = day === 0 ? -6 : 1 - day;
        d.setUTCDate(d.getUTCDate() + diff);
        d.setUTCHours(0, 0, 0, 0);
        return d;
    }
}