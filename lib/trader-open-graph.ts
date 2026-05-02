import "server-only";

import type { TraderPnlSummary, UserProfile } from "@structbuild/sdk";
import { cache } from "react";

import {
	computeStreaks,
	getTraderDailyPnl,
	getTraderPnlCandles,
	type PnlDataPoint,
	type PnlStreaks,
} from "@/lib/struct/pnl";
import { getSiteUrl } from "@/lib/env";
import { formatNumber } from "@/lib/format";
import { buildEntityPageTitle } from "@/lib/site-metadata";
import { getTraderPnlSummary, getTraderProfile } from "@/lib/struct/queries";
import { getTraderDisplayName, normalizeWalletAddress, truncateAddress } from "@/lib/utils";

export const traderOgImageSize = {
	width: 1200,
	height: 630,
} as const;

export type TraderOpenGraphData = {
	address: string;
	displayName: string;
	profile: UserProfile | null;
	pnlSummary: TraderPnlSummary | null;
	pnlCandles: PnlDataPoint[];
	streaks: PnlStreaks;
};

export type TraderOpenGraphIdentity = {
	address: string;
	displayName: string;
	profile: UserProfile | null;
};

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
	pnlSummary?: TraderPnlSummary | null,
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

export function getTraderOgImageAlt(displayName: string) {
	return `${displayName} lifetime trading summary on Polymarket Explorer`;
}

export function getTraderOgImageUrl(address: string) {
	const normalizedAddress = normalizeWalletAddress(address) ?? address.trim();
	return new URL(`/traders/${normalizedAddress}/opengraph-image`, getSiteUrl());
}

const loadTraderOpenGraphIdentityCached = cache(async (address: string): Promise<TraderOpenGraphIdentity> => {
	const profile = await getTraderProfile(address);

	return {
		address,
		displayName: getTraderDisplayName({
			address,
			name: profile?.name,
			pseudonym: profile?.pseudonym,
		}),
		profile,
	};
});

export async function loadTraderOpenGraphIdentity(address: string): Promise<TraderOpenGraphIdentity> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) {
		const fallbackAddress = address.trim();
		return {
			address: fallbackAddress,
			displayName: fallbackAddress || "Unknown Trader",
			profile: null,
		};
	}

	return loadTraderOpenGraphIdentityCached(normalizedAddress);
}

const loadTraderOpenGraphDataCached = cache(async (address: string): Promise<TraderOpenGraphData> => {
	const [identity, pnlSummary, pnlCandles, dailyPnl] = await Promise.all([
		loadTraderOpenGraphIdentityCached(address),
		getTraderPnlSummary(address),
		getTraderPnlCandles(address, "lifetime", "1h"),
		getTraderDailyPnl(address),
	]);

	return {
		address: identity.address,
		displayName: identity.displayName,
		profile: identity.profile,
		pnlSummary,
		pnlCandles,
		streaks: computeStreaks(dailyPnl),
	};
});

export async function loadTraderOpenGraphData(address: string): Promise<TraderOpenGraphData> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) {
		const fallbackAddress = address.trim();
		return {
			address: fallbackAddress,
			displayName: fallbackAddress || "Unknown Trader",
			profile: null,
			pnlSummary: null,
			pnlCandles: [],
			streaks: computeStreaks([]),
		};
	}

	return loadTraderOpenGraphDataCached(normalizedAddress);
}
