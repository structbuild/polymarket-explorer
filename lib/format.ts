export function formatPriceCents(price: number | null | undefined): string {
	if (price == null || Number.isNaN(price)) return "—"
	return `${(price * 100).toFixed(1)}¢`
}

export function formatDateShort(seconds: number | null | undefined): string {
	if (!seconds) return "—"
	return new Date(seconds * 1000).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	})
}

export function formatDateCompact(seconds: number): string {
	return new Date(seconds * 1000).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	})
}

export function formatDateFull(seconds: number): string {
	return new Date(seconds * 1000).toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	})
}

export function formatTime(seconds: number | null | undefined): string | null {
	if (!seconds) return null
	return new Date(seconds * 1000).toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	})
}

export function formatTimeAgo(timestampSeconds: number): string {
	const now = Date.now()
	const diffMs = now - timestampSeconds * 1000
	const diffSeconds = Math.floor(diffMs / 1000)

	if (diffSeconds < 60) return `${diffSeconds}s`
	const diffMinutes = Math.floor(diffSeconds / 60)
	if (diffMinutes < 60) return `${diffMinutes}m`
	const diffHours = Math.floor(diffMinutes / 60)
	if (diffHours < 24) return `${diffHours}h`
	const diffDays = Math.floor(diffHours / 24)
	if (diffDays < 30) return `${diffDays}d`
	const diffMonths = Math.floor(diffDays / 30)
	if (diffMonths < 12) return `${diffMonths}mo`
	return `${Math.floor(diffDays / 365)}y`
}

export function pnlColorClass(value: number): string {
	return value >= 0 ? "text-emerald-500" : "text-red-500"
}

export function formatDuration(seconds: number): string {
	if (!seconds || seconds < 0) return "0s";
	const d = Math.floor(seconds / 86400);
	const h = Math.floor((seconds % 86400) / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	const parts: string[] = [];
	if (d > 0) parts.push(`${d}d`);
	if (h > 0) parts.push(`${h}h`);
	if (m > 0) parts.push(`${m}m`);
	if (s > 0 || parts.length === 0) parts.push(`${s}s`);
	return parts.join(" ");
}

type FormatNumberOptions = {
	compact?: boolean;
	decimals?: number;
	currency?: boolean;
	percent?: boolean;
};

export function formatNumber(value: number | null | undefined, options: FormatNumberOptions = {}) {
	const { compact = false, decimals, currency = false, percent = false } = options;

	if (value == null || Number.isNaN(value)) return "—";

	if (percent) {
		const fixed = decimals ?? 1;
		return `${value.toFixed(fixed)}%`;
	}

	if (compact) {
		const tiers = [
			{ threshold: 1e12, suffix: "T" },
			{ threshold: 1e9, suffix: "B" },
			{ threshold: 1e6, suffix: "M" },
			{ threshold: 1e3, suffix: "K" },
		];

		const absValue = Math.abs(value);
		const tier = tiers.find((t) => absValue >= t.threshold);

		if (tier) {
			const scaled = value / tier.threshold;
			const fixed = decimals ?? (Math.abs(scaled) >= 100 ? 0 : Math.abs(scaled) >= 10 ? 1 : 2);
			const formatted = Math.abs(scaled).toFixed(fixed);
			const sign = value < 0 ? "-" : "";
			return `${sign}${currency ? "$" : ""}${formatted}${tier.suffix}`;
		}

		const fixed = decimals ?? (absValue >= 100 ? 0 : absValue >= 10 ? 1 : 2);
		const sign = value < 0 ? "-" : "";
		return `${sign}${currency ? "$" : ""}${absValue.toFixed(fixed)}`;
	}

	if (currency) {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: decimals ?? 2,
			maximumFractionDigits: decimals ?? 2,
		}).format(value);
	}

	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: decimals ?? 0,
		maximumFractionDigits: decimals ?? 2,
	}).format(value);
}
