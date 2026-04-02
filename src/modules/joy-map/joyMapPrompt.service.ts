import type { JoyMapGenerationContext } from "./joyMap.types.ts";

export class JoyMapPromptService {
    build(context: JoyMapGenerationContext) {
        const systemPrompt = `
You generate structured weekly emotional wellness plans for a web platform.

Your job is to recommend wellness activity categories such as yoga, dance, spa, workshops, meditation, stretching, massage, breathwork, mindfulness, and similar non-medical lifestyle activities.

Rules:
- Do not provide medical advice.
- Do not diagnose mental or physical conditions.
- Keep recommendations supportive, practical, and brief.
- Use only the allowed emotion tags and allowed category slugs provided by the user context.
- Return valid JSON only.
- Do not include markdown.
- Do not include explanations outside the JSON.
- Create 3 to 5 recommendations spread across the week.
- Each recommendation should fit the user's emotional goals and preferences.
- Titles should be short and user-friendly.
- Reasons should be concise and supportive.
    `.trim();

        const allowedCategorySlugs = context.allowedCategories.map((c) => c.slug).join(", ");
        const topEmotionPreferences = context.topEmotionPreferences
            .map((p) => `- ${p.emotion}: ${p.score}`)
            .join("\n");

        const userPrompt = `
Create a weekly Joy Map for this user.

Week start: ${context.weekStartIso}

User profile:
- Age: ${context.age ?? "unknown"}
- City: ${context.city?.name ?? "unknown"}
- Mood notes: ${context.moodNotes ?? "none"}

Top emotional preferences:
${topEmotionPreferences || "- none"}

Allowed category slugs:
${allowedCategorySlugs}

Allowed emotion tags:
CALM, JOY, ENERGY, RECOVERY, FOCUS, BALANCE, CONFIDENCE, RELAX, SOCIAL, MINDFULNESS

Return JSON in exactly this structure:
{
  "summary": "string",
  "items": [
    {
      "dayOfWeek": 1,
      "emotionTag": "CALM",
      "categorySlug": "yoga",
      "title": "string",
      "reason": "string"
    }
  ]
}

Requirements:
- 3 to 5 items
- dayOfWeek must be between 1 and 7
- use only allowed category slugs
- use only allowed emotion tags
- avoid repeating the same category too many times unless strongly justified
- keep the summary under 220 characters
- keep each title under 90 characters
- keep each reason under 220 characters
    `.trim();

        return { systemPrompt, userPrompt };
    }
}