import "server-only";

import { cache } from "react";

import { formatDateShort } from "@/lib/format";
import { normalizeWalletAddress } from "@/lib/utils";

export type PnlDataPoint = {
	t: number;
	p: number;
};

export type DailyPnlEntry = {
	t: number;
	pnl: number;
};

const BASE_URL = "https://user-pnl-api.polymarket.com/user-pnl";

async function fetchPnl(address: string, interval: string, fidelity: string): Promise<PnlDataPoint[]> {
	const url = `${BASE_URL}?user_address=${address}&interval=${interval}&fidelity=${fidelity}`;
	const res = await fetch(url, { cache: "no-store" });

	if (!res.ok) {
		console.error(`Polymarket PnL API failed: ${res.status} ${res.statusText}`);
		return [];
	}

	return res.json();
}

const getTraderPnlCandlesCached = cache(async (address: string, interval = "all", fidelity = "1h"): Promise<PnlDataPoint[]> => {
	return fetchPnl(address, interval, fidelity);
});

export async function getTraderPnlCandles(address: string, interval = "all", fidelity = "1h"): Promise<PnlDataPoint[]> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) return [];

	return getTraderPnlCandlesCached(normalizedAddress, interval, fidelity);
}

export async function getTraderCumulativePnlUsd(address: string): Promise<number> {
	const points = await getTraderPnlCandles(address, "all", "1d");
	if (points.length === 0) return 0;
	const latest = points.reduce((max, point) => (point.t > max.t ? point : max), points[0]);
	return latest.p;
}

const getTraderDailyPnlCached = cache(async (address: string): Promise<DailyPnlEntry[]> => {
	const data = await fetchPnl(address, "all", "1d");
	return toDailyPnl(data);
});

export async function getTraderDailyPnl(address: string): Promise<DailyPnlEntry[]> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) return [];

	return getTraderDailyPnlCached(normalizedAddress);
}

export type DayRecord = {
	pnl: number;
	date: string;
	t: number | null;
};

export type PnlStreaks = {
	longestWin: number;
	longestLoss: number;
	current: number;
	bestDay: DayRecord;
	worstDay: DayRecord;
};

export type PnlChartAnnotation = {
	kind: "best" | "worst";
	date: string;
	dailyPnl: number;
	t: number;
	p: number;
};

export function computeStreaks(data: DailyPnlEntry[]): PnlStreaks {
	let longestWin = 0;
	let longestLoss = 0;
	let currentStreak = 0;
	let bestDay: DayRecord = { pnl: 0, date: "", t: null };
	let worstDay: DayRecord = { pnl: 0, date: "", t: null };

	for (const entry of data) {
		if (entry.pnl > bestDay.pnl) {
			bestDay = { pnl: entry.pnl, date: formatDateShort(entry.t), t: entry.t };
		}
		if (entry.pnl < worstDay.pnl) {
			worstDay = { pnl: entry.pnl, date: formatDateShort(entry.t), t: entry.t };
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

export function getPnlChartAnnotations(candles: PnlDataPoint[], streaks: PnlStreaks): PnlChartAnnotation[] {
	const pnlByTimestamp = new Map<number, number>();
	for (const candle of candles) {
		pnlByTimestamp.set(candle.t, candle.p);
	}

	const annotations: PnlChartAnnotation[] = [];
	const dayRecords = [
		{ kind: "best" as const, day: streaks.bestDay },
		{ kind: "worst" as const, day: streaks.worstDay },
	];

	for (const { kind, day } of dayRecords) {
		if (day.t === null) continue;
		if (kind === "best" && day.pnl <= 0) continue;
		if (kind === "worst" && day.pnl >= 0) continue;

		const cumulativePnl = pnlByTimestamp.get(day.t);
		if (cumulativePnl === undefined) continue;

		annotations.push({
			kind,
			date: day.date,
			dailyPnl: day.pnl,
			t: day.t,
			p: cumulativePnl,
		});
	}

	annotations.sort((a, b) => a.t - b.t);
	return annotations;
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
