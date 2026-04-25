const NEAR_ZERO_PCT_EPSILON = 0.0005;

export function formatPctChange(value: number | null | undefined): string | null {
	if (value === null || value === undefined || !Number.isFinite(value)) return null;
	const pct = value * 100;
	const normalizedPct = Math.abs(pct) < 0.05 ? 0 : pct;
	const sign = normalizedPct > 0 ? "+" : "";
	return `${sign}${normalizedPct.toFixed(1)}%`;
}

export function pctToneClass(value: number | null | undefined): string {
	if (
		value === null ||
		value === undefined ||
		!Number.isFinite(value) ||
		Math.abs(value) < NEAR_ZERO_PCT_EPSILON
	) {
		return "text-muted-foreground";
	}
	return value > 0
		? "text-emerald-600 dark:text-emerald-500"
		: "text-red-600 dark:text-red-500";
}
