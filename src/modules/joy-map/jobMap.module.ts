import { PrismaClient } from "@prisma/client";
import { JoyMapRepository } from "./joyMap.repository.ts";
import { JoyMapPromptService } from "./joyMapPrompt.service.ts";
import { JoyMapParserService } from "./joyMapParser.service.ts";
import { JoyMapMatcherService } from "./joyMapMatcher.service.ts";
import { JoyMapFallbackService } from "./joyMapFallback.service.ts";
import { JoyMapMapper } from "./joyMap.mapper.ts";
import { JoyMapService } from "./joyMap.service.ts";
import { JoyMapController } from "./joyMap.controller.ts";
import { buildJoyMapRoutes } from "./joyMap.routes.ts";
import { openAiClient } from "../../core/lib/openai.ts";

export const createJoyMapModule = (prisma: PrismaClient) => {
    const repository = new JoyMapRepository(prisma);
    const promptService = new JoyMapPromptService();
    const parserService = new JoyMapParserService();
    const matcherService = new JoyMapMatcherService(prisma);
    const fallbackService = new JoyMapFallbackService();
    const mapper = new JoyMapMapper();

    const service = new JoyMapService(
        prisma,
        repository,
        promptService,
        parserService,
        matcherService,
        fallbackService,
        mapper,
        openAiClient
    );

    const controller = new JoyMapController(service);
    const routes = buildJoyMapRoutes(controller);

    return {
        service,
        controller,
        routes,
    };
};