import "server-only";

import type { TraderPnl } from "@structbuild/sdk";

import { formatNumber } from "@/lib/format";
import { buildEntityPageTitle } from "@/lib/site-metadata";
import { truncateAddress } from "@/lib/utils";

export function getTraderPageTitle(displayName: string, cumulativePnlUsd: number) {
	if (Number.isFinite(cumulativePnlUsd) && Math.abs(cumulativePnlUsd) >= 1000) {
		const pnlText = formatNumber(cumulativePnlUsd, { compact: true, currency: true });
		const prefix = cumulativePnlUsd >= 0 ? "+" : "";
		return buildEntityPageTitle(displayName, `${prefix}${pnlText} PnL · Polymarket`);
	}
	return buildEntityPageTitle(displayName, "Polymarket Trader");
}

export function getTraderSocialTitle(displayName: string, cumulativePnlUsd: number) {
	return getTraderPageTitle(displayName, cumulativePnlUsd);
}

export function getTraderPageDescription(
	displayName: string,
	address: string,
	cumulativePnlUsd: number,
	pnlSummary?: TraderPnl | null,
) {
	const volume = pnlSummary?.total_volume_usd;
	const winRate = pnlSummary?.market_win_rate_pct;
	const marketsTraded = pnlSummary?.markets_traded;

	const stats: string[] = [];
	if (Number.isFinite(cumulativePnlUsd)) {
		const prefix = cumulativePnlUsd >= 0 ? "+" : "";
		stats.push(`${prefix}${formatNumber(cumulativePnlUsd, { compact: true, currency: true })} PnL`);
	}
	if (typeof volume === "number" && volume > 0) {
		stats.push(`${formatNumber(volume, { compact: true, currency: true })} volume`);
	}
	if (typeof marketsTraded === "number" && marketsTraded > 0) {
		stats.push(`${formatNumber(marketsTraded, { decimals: 0 })} markets`);
	}
	if (typeof winRate === "number" && Number.isFinite(winRate)) {
		stats.push(`${winRate.toFixed(0)}% win rate`);
	}

	const displayIsAddress = displayName === truncateAddress(address) || displayName === address;
	const lead = displayIsAddress ? address : `${displayName} (${address})`;

	if (stats.length === 0) {
		return `${lead} on Polymarket. View live positions, PnL chart, trade history, and analytics.`;
	}

	return `${lead} on Polymarket: ${stats.join(", ")}. View live positions, PnL chart, trade history, and analytics.`;
}
