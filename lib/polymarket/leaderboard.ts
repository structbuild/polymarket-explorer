import "server-only";

import { cache } from "react";

export type LeaderboardEntry = {
	trader: {
		address: string;
		name: string | null;
		profile_image: string | null;
	};
	pnl: number;
	volume: number;
};

const LEADERBOARD_URL = "https://data-api.polymarket.com/v1/leaderboard";

export const getLeaderboard = cache(async (): Promise<LeaderboardEntry[]> => {
	const url = `${LEADERBOARD_URL}?timePeriod=week&orderBy=PNL&limit=20&offset=0&category=overall`;
	const res = await fetch(url, { cache: "no-store" });

	if (!res.ok) {
		console.error(`Polymarket Leaderboard API failed: ${res.status} ${res.statusText}`);
		return [];
	}

	const data: RawLeaderboardEntry[] = await res.json();

	return data
		.filter((entry) => entry.userName && !/^0x[0-9a-fA-F]{6,}/.test(entry.userName))
		.map(toLeaderboardEntry);
});

type RawLeaderboardEntry = {
	rank: string;
	proxyWallet: string;
	userName: string;
	profileImage: string;
	pnl: number;
	vol: number;
};

function toLeaderboardEntry(raw: RawLeaderboardEntry): LeaderboardEntry {
	return {
		trader: {
			address: raw.proxyWallet,
			name: raw.userName || null,
			profile_image: raw.profileImage || null,
		},
		pnl: raw.pnl,
		volume: raw.vol,
	};
}
