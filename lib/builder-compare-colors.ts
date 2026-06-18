export const COMPARE_PALETTE = [
	"#10b981",
	"#8b5cf6",
	"#f59e0b",
	"#06b6d4",
	"#ef4444",
	"#ec4899",
	"#84cc16",
	"#3b82f6",
] as const;

export function colorForCompareIndex(index: number): string {
	return COMPARE_PALETTE[index % COMPARE_PALETTE.length];
}

export function buildBuilderColorMap(codes: readonly string[]): Record<string, string> {
	const map: Record<string, string> = {};
	codes.forEach((code, index) => {
		if (!(code in map)) {
			map[code] = colorForCompareIndex(index);
		}
	});
	return map;
}
