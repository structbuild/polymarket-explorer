import "server-only";

import type { TraderPnlSummary, UserProfile } from "@structbuild/sdk";
import { cache } from "react";

import {
	computeStreaks,
	getTraderDailyPnl,
	getTraderPnlCandles,
	type PnlDataPoint,
	type PnlStreaks,
} from "@/lib/polymarket/pnl";
import { getTraderPnlSummary, getTraderProfile } from "@/lib/struct/queries";
import { getTraderDisplayName, normalizeWalletAddress } from "@/lib/utils";
import { getSiteUrl } from "@/lib/env";

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

export function getTraderPageTitle(displayName: string) {
	return `${displayName} - Trader Profile`;
}

export function getTraderSocialTitle(displayName: string) {
	return `${displayName} - Polymarket Trader`;
}

export function getTraderPageDescription(displayName: string) {
	return `Analyze ${displayName}'s lifetime Polymarket trading performance - PnL history, win rate, volume, and recent trades. Powered by Struct.`;
}

export function getTraderOgImageAlt(displayName: string) {
	return `${displayName} lifetime trading summary on Polymarket Explorer`;
}

export function getTraderOgImageUrl(address: string) {
	const normalizedAddress = normalizeWalletAddress(address) ?? address.trim();
	return new URL(`/trader/${normalizedAddress}/opengraph-image`, getSiteUrl());
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
		getTraderPnlCandles(address, "all", "1h"),
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
