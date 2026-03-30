// src/core/utils/slug.ts

/**
 * Converts arbitrary text into a URL-friendly slug.
 *
 * Examples:
 *  "Joy Yoga" -> "joy-yoga"
 *  "SPA & Recovery Session!" -> "spa-recovery-session"
 *  "  Dance   Therapy  " -> "dance-therapy"
 */
export function slugify(input: string): string {
    if (!input || typeof input !== "string") {
        return "item";
    }

    const slug = input
        .normalize("NFKD") // split accented characters
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .toLowerCase()
        .trim()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric groups with hyphen
        .replace(/^-+|-+$/g, "") // trim hyphens from both ends
        .replace(/-{2,}/g, "-"); // collapse duplicate hyphens

    return slug || "item";
}

/**
 * Builds a unique slug candidate with numeric suffix.
 *
 * Examples:
 *  buildSlugWithSuffix("joy-yoga", 1) -> "joy-yoga"
 *  buildSlugWithSuffix("joy-yoga", 2) -> "joy-yoga-2"
 *  buildSlugWithSuffix("joy-yoga", 5) -> "joy-yoga-5"
 */
export function buildSlugWithSuffix(baseSlug: string, suffix: number): string {
    const safeBase = slugify(baseSlug);

    if (suffix <= 1) {
        return safeBase;
    }

    return `${safeBase}-${suffix}`;
}