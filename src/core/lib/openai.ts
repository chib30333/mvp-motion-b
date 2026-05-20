import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

function getClient(): OpenAI {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not configured");
    }
    if (!cachedClient) {
        cachedClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return cachedClient;
}

export const openAiClient = {
    async generateStructuredJoyMap(input: {
        systemPrompt: string;
        userPrompt: string;
    }): Promise<string> {
        const response = await getClient().chat.completions.create({
            model: "gpt-4.1-mini",
            temperature: 0.7,
            messages: [
                { role: "system", content: input.systemPrompt },
                { role: "user", content: input.userPrompt },
            ],
        });

        const text = response.choices[0]?.message?.content?.trim();

        if (!text) {
            throw new Error("OpenAI returned empty response");
        }

        return text;
    },
};
