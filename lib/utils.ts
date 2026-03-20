import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string, length: number = 6) {
	return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function getTraderDisplayName(trader: { address: string; name?: string | null; pseudonym?: string | null }) {
	return trader.name ?? trader.pseudonym ?? truncateAddress(trader.address);
}

export function isWalletAddress(value: string) {
	return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
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

export function formatNumber(value: number, options: FormatNumberOptions = {}) {
	const { compact = false, decimals, currency = false, percent = false } = options;

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