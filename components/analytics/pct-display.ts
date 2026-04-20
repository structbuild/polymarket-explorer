export function formatPctChange(value: number | null | undefined): string | null {
	if (value === null || value === undefined || !Number.isFinite(value)) return null;
	const pct = value * 100;
	const sign = pct > 0 ? "+" : "";
	return `${sign}${pct.toFixed(1)}%`;
}

export function pctToneClass(value: number | null | undefined): string {
	if (value === null || value === undefined || !Number.isFinite(value) || value === 0) {
		return "text-muted-foreground";
	}
	return value > 0
		? "text-emerald-600 dark:text-emerald-500"
		: "text-red-600 dark:text-red-500";
}
