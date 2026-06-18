export const MAX_COMPARE_BUILDERS = 4;

export function normalizeCompareCodes(values: readonly string[]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const value of values) {
		const code = value.trim().toLowerCase();
		if (!code || seen.has(code)) continue;
		seen.add(code);
		result.push(code);
		if (result.length >= MAX_COMPARE_BUILDERS) break;
	}
	return result;
}

export function serializeCompareCodes(codes: readonly string[]): string {
	return normalizeCompareCodes(codes).join(",");
}

export const compareCodesParserDef = {
	parse(value: string): string[] {
		return normalizeCompareCodes(value.split(","));
	},
	serialize(value: string[]): string {
		return serializeCompareCodes(value);
	},
};
