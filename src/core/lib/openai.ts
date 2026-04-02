import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const openAiClient = {
    async generateStructuredJoyMap(input: {
        systemPrompt: string;
        userPrompt: string;
    }): Promise<string> {
        const response = await client.chat.completions.create({
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