import "server-only";

import { cache } from "react";

import { formatDateShort } from "@/lib/format";
import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import type { StructPnlCandleResolution, StructPnlCandleTimeframe, StructPnlPeriodTimeframe } from "@/lib/struct/pnl-timeframes";
import { normalizeWalletAddress } from "@/lib/utils";
import type { PnlV3RiskResponse } from "@structbuild/sdk";

export type PnlDataPoint = {
	t: number;
	open: number;
	high: number;
	low: number;
	close: number;
	p: number;
};

export type DailyPnlEntry = {
	t: number;
	pnl: number;
	open: number;
	high: number;
	low: number;
	close: number;
};

const defaultPnlTimeframe: StructPnlCandleTimeframe = "lifetime";
const defaultPnlResolution: StructPnlCandleResolution = "1h";
const defaultPnlPeriodsTimeframe: StructPnlPeriodTimeframe = "lifetime";
const defaultPnlRiskTimeframe: StructPnlPeriodTimeframe = "lifetime";

type TraderPnlCandlesOptions = {
	fillGaps?: boolean;
};

const getTraderPnlCandlesCached = cache(
	async (
		address: string,
		timeframe: StructPnlCandleTimeframe = defaultPnlTimeframe,
		resolution: StructPnlCandleResolution = defaultPnlResolution,
		options: TraderPnlCandlesOptions = {},
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
				...(options.fillGaps === undefined ? {} : { fill_gaps: options.fillGaps }),
			});

			return response.data
				.map((candle) => ({
					t: candle.t,
					open: candle.open,
					high: candle.high,
					low: candle.low,
					close: candle.close,
					p: candle.close,
				}))
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
	options: TraderPnlCandlesOptions = {},
): Promise<PnlDataPoint[]> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) return [];

	return getTraderPnlCandlesCached(normalizedAddress, timeframe, resolution, options);
}

export async function getTraderCumulativePnlUsd(address: string): Promise<number> {
	const points = await getTraderPnlCandles(address, "lifetime", "1d");
	if (points.length === 0) return 0;
	const latest = points.reduce((max, point) => (point.t > max.t ? point : max), points[0]);
	return latest.p;
}

const getTraderPnlRiskCached = cache(
	async (address: string, timeframe: StructPnlPeriodTimeframe = defaultPnlRiskTimeframe): Promise<PnlV3RiskResponse | null> => {
		const client = getStructClient();

		if (!client) {
			return null;
		}

		try {
			const response = await client.trader.getTraderPnlV3Risk({ address, timeframe });
			return response.data ?? null;
		} catch (error) {
			if (readStatus(error) === 404) {
				return null;
			}

			logStructError(`getTraderPnlV3Risk:${address}:${timeframe}`, error);
			return null;
		}
	},
);

export async function getTraderPnlRisk(address: string, timeframe: StructPnlPeriodTimeframe = defaultPnlRiskTimeframe): Promise<PnlV3RiskResponse | null> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) return null;

	return getTraderPnlRiskCached(normalizedAddress, timeframe);
}

const getTraderDailyPnlCached = cache(async (address: string): Promise<DailyPnlEntry[]> => {
	const data = await getTraderPnlCandlesCached(address, "lifetime", "1d", { fillGaps: false });
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
};

export type PnlPeriodWindow = "day" | "week" | "month";
export type PnlPeriodBasis = "totalPnl" | "portfolio";

export type PnlPeriodRecord = {
	from: number;
	to: number;
	change: number;
	changePct: number | null;
	date: string;
};

export type PnlPeriodExtremes = {
	best: PnlPeriodRecord | null;
	worst: PnlPeriodRecord | null;
};

export type PnlPeriods = Record<PnlPeriodBasis, Record<PnlPeriodWindow, PnlPeriodExtremes>>;

export const emptyPnlPeriods: PnlPeriods = {
	totalPnl: {
		day: { best: null, worst: null },
		week: { best: null, worst: null },
		month: { best: null, worst: null },
	},
	portfolio: {
		day: { best: null, worst: null },
		week: { best: null, worst: null },
		month: { best: null, worst: null },
	},
};

export type PnlChartAnnotation = {
	kind: "best" | "worst";
	date: string;
	dailyPnl: number;
	t: number;
	p: number;
};

function formatPeriodDate(from: number, to: number, window: PnlPeriodWindow): string {
	if (window === "day") return formatDateShort(from);

	const start = formatDateShort(from);
	const end = formatDateShort(to);
	return start === end ? start : `${start} - ${end}`;
}

function normalizePeriodMetric(
	metric: { from: number; to: number; change: number; change_pct?: number | null } | null | undefined,
	window: PnlPeriodWindow,
): PnlPeriodRecord | null {
	if (!metric || !Number.isFinite(metric.change)) return null;

	return {
		from: metric.from,
		to: metric.to,
		change: metric.change,
		changePct: metric.change_pct ?? null,
		date: formatPeriodDate(metric.from, metric.to, window),
	};
}

function normalizePeriodExtremes(
	extremes: { best?: { from: number; to: number; change: number; change_pct?: number | null } | null; worst?: { from: number; to: number; change: number; change_pct?: number | null } | null } | null | undefined,
	window: PnlPeriodWindow,
): PnlPeriodExtremes {
	return {
		best: normalizePeriodMetric(extremes?.best, window),
		worst: normalizePeriodMetric(extremes?.worst, window),
	};
}

const getTraderPnlPeriodsCached = cache(
	async (address: string, timeframe: StructPnlPeriodTimeframe = defaultPnlPeriodsTimeframe): Promise<PnlPeriods> => {
		const client = getStructClient();

		if (!client) {
			return emptyPnlPeriods;
		}

		try {
			const response = await client.trader.getTraderPnlV3Periods({ address, timeframe });
			const periods = response.data;

			return {
				totalPnl: {
					day: normalizePeriodExtremes(periods.total_pnl_day, "day"),
					week: normalizePeriodExtremes(periods.total_pnl_week, "week"),
					month: normalizePeriodExtremes(periods.total_pnl_month, "month"),
				},
				portfolio: {
					day: normalizePeriodExtremes(periods.portfolio_day, "day"),
					week: normalizePeriodExtremes(periods.portfolio_week, "week"),
					month: normalizePeriodExtremes(periods.portfolio_month, "month"),
				},
			};
		} catch (error) {
			if (readStatus(error) === 404) {
				return emptyPnlPeriods;
			}

			logStructError(`getTraderPnlV3Periods:${address}:${timeframe}`, error);
			return emptyPnlPeriods;
		}
	},
);

export async function getTraderPnlPeriods(address: string, timeframe: StructPnlPeriodTimeframe = defaultPnlPeriodsTimeframe): Promise<PnlPeriods> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) return emptyPnlPeriods;

	return getTraderPnlPeriodsCached(normalizedAddress, timeframe);
}

export function computeStreaks(data: DailyPnlEntry[]): PnlStreaks {
	let longestWin = 0;
	let longestLoss = 0;
	let currentStreak = 0;

	for (const entry of data) {
		if (entry.pnl === 0) continue;

		if (entry.pnl > 0) {
			currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
			longestWin = Math.max(longestWin, currentStreak);
		} else {
			currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
			longestLoss = Math.max(longestLoss, Math.abs(currentStreak));
		}
	}

	return { longestWin, longestLoss, current: currentStreak };
}

export function getPnlChartAnnotations(candles: PnlDataPoint[], periods: PnlPeriods): PnlChartAnnotation[] {
	const pnlByTimestamp = new Map<number, number>();
	for (const candle of candles) {
		pnlByTimestamp.set(candle.t, candle.p);
	}

	const annotations: PnlChartAnnotation[] = [];
	const dayRecords = [
		{ kind: "best" as const, day: periods.totalPnl.day.best },
		{ kind: "worst" as const, day: periods.totalPnl.day.worst },
	];

	for (const { kind, day } of dayRecords) {
		if (!day) continue;
		if (kind === "best" && day.change <= 0) continue;
		if (kind === "worst" && day.change >= 0) continue;

		const cumulativePnl = pnlByTimestamp.get(day.from);
		if (cumulativePnl === undefined) continue;

		annotations.push({
			kind,
			date: day.date,
			dailyPnl: day.change,
			t: day.from,
			p: cumulativePnl,
		});
	}

	annotations.sort((a, b) => a.t - b.t);
	return annotations;
}

function toDailyPnl(data: PnlDataPoint[]): DailyPnlEntry[] {
	return data.map((point) => ({
		t: point.t,
		pnl: point.close - point.open,
		open: point.open,
		high: point.high,
		low: point.low,
		close: point.close,
	}));
}
