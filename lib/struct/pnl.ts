import "server-only";

import { cache } from "react";

import { formatDateShort } from "@/lib/format";
import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import type { StructPnlCandleResolution, StructPnlCandleTimeframe } from "@/lib/struct/pnl-timeframes";
import { normalizeWalletAddress } from "@/lib/utils";

export type PnlDataPoint = {
	t: number;
	p: number;
};

export type DailyPnlEntry = {
	t: number;
	pnl: number;
};

const defaultPnlTimeframe: StructPnlCandleTimeframe = "lifetime";
const defaultPnlResolution: StructPnlCandleResolution = "1h";

const getTraderPnlCandlesCached = cache(
	async (
		address: string,
		timeframe: StructPnlCandleTimeframe = defaultPnlTimeframe,
		resolution: StructPnlCandleResolution = defaultPnlResolution,
	): Promise<PnlDataPoint[]> => {
		const client = getStructClient();

		if (!client) {
			return [];
		}

		try {
			const response = await client.trader.getTraderPnlV3Candles({
				address,
				timeframe,
				resolution,
			});

			return response.data
				.map((candle) => ({ t: candle.t, p: candle.close }))
				.sort((a, b) => a.t - b.t);
		} catch (error) {
			if (readStatus(error) === 404) {
				return [];
			}

			logStructError(`getTraderPnlV3Candles:${address}:${timeframe}:${resolution}`, error);
			return [];
		}
	},
);

export async function getTraderPnlCandles(
	address: string,
	timeframe: StructPnlCandleTimeframe = defaultPnlTimeframe,
	resolution: StructPnlCandleResolution = defaultPnlResolution,
): Promise<PnlDataPoint[]> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) return [];

	return getTraderPnlCandlesCached(normalizedAddress, timeframe, resolution);
}

export async function getTraderCumulativePnlUsd(address: string): Promise<number> {
	const points = await getTraderPnlCandles(address, "lifetime", "1d");
	if (points.length === 0) return 0;
	const latest = points.reduce((max, point) => (point.t > max.t ? point : max), points[0]);
	return latest.p;
}

const getTraderDailyPnlCached = cache(async (address: string): Promise<DailyPnlEntry[]> => {
	const data = await getTraderPnlCandlesCached(address, "lifetime", "1d");
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
