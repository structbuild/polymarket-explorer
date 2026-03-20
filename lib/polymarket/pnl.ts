import "server-only";

import { cache } from "react";

export type PnlDataPoint = {
	t: number;
	p: number;
};

export type DailyPnlEntry = {
	t: number;
	pnl: number;
};

const BASE_URL = "https://user-pnl-api.polymarket.com/user-pnl";

async function fetchPnl(address: string, fidelity: string): Promise<PnlDataPoint[]> {
	const url = `${BASE_URL}?user_address=${address}&interval=all&fidelity=${fidelity}`;
	const res = await fetch(url, { next: { revalidate: 300 } });

	if (!res.ok) {
		console.error(`Polymarket PnL API failed: ${res.status} ${res.statusText}`);
		return [];
	}

	return res.json();
}

export const getTraderPnlCandles = cache(async (address: string): Promise<PnlDataPoint[]> => {
	if (!address.trim()) return [];
	return fetchPnl(address, "1h");
});

export const getTraderDailyPnl = cache(async (address: string): Promise<DailyPnlEntry[]> => {
	if (!address.trim()) return [];
	const data = await fetchPnl(address, "1d");
	return toDailyPnl(data);
});

export type DayRecord = {
	pnl: number;
	date: string;
};

export type PnlStreaks = {
	longestWin: number;
	longestLoss: number;
	current: number;
	bestDay: DayRecord;
	worstDay: DayRecord;
};

export function computeStreaks(data: DailyPnlEntry[]): PnlStreaks {
	let longestWin = 0;
	let longestLoss = 0;
	let currentStreak = 0;
	let bestDay: DayRecord = { pnl: 0, date: "" };
	let worstDay: DayRecord = { pnl: 0, date: "" };

	for (const entry of data) {
		if (entry.pnl > bestDay.pnl) {
			bestDay = { pnl: entry.pnl, date: formatDayDate(entry.t) };
		}
		if (entry.pnl < worstDay.pnl) {
			worstDay = { pnl: entry.pnl, date: formatDayDate(entry.t) };
		}

		if (entry.pnl === 0) continue;

		if (entry.pnl > 0) {
			currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
			longestWin = Math.max(longestWin, currentStreak);
		} else {
			currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
			longestLoss = Math.max(longestLoss, Math.abs(currentStreak));
		}
	}

	return { longestWin, longestLoss, current: currentStreak, bestDay, worstDay };
}

function formatDayDate(t: number): string {
	return new Date(t * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toDailyPnl(data: PnlDataPoint[]): DailyPnlEntry[] {
	if (data.length === 0) return [];

	const byDay = new Map<string, { t: number; p: number }>();
	for (const point of data) {
		const date = new Date(point.t * 1000);
		const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
		byDay.set(key, point);
	}

	const sorted = [...byDay.values()].sort((a, b) => a.t - b.t);
	const result: DailyPnlEntry[] = [];

	for (let i = 0; i < sorted.length; i++) {
		const dailyPnl = i === 0 ? 0 : sorted[i].p - sorted[i - 1].p;
		result.push({ t: sorted[i].t, pnl: dailyPnl });
	}

	return result;
}
