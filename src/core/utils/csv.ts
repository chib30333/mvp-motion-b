export function escapeCsvValue(value: unknown): string {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);

    if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
    ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

export function buildCsv<T extends Record<string, unknown>>(rows: T[]): string {
    const firstRow = rows[0];
    if (!firstRow) return "";

    const headers = Object.keys(firstRow) as Array<keyof T>;
    const headerLine = headers.map((header) => escapeCsvValue(header)).join(",");

    const dataLines = rows.map((row) =>
        headers.map((header) => escapeCsvValue(row[header])).join(",")
    );

    return [headerLine, ...dataLines].join("\n");
}