import "server-only";

import { cache } from "react";

import { formatDateShort } from "@/lib/format";
import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import type { StructPnlCandleResolution, StructPnlCandleTimeframe, StructPnlPeriodTimeframe } from "@/lib/struct/pnl-timeframes";
import type { PaginatedResource } from "@/lib/struct/types";
import type { TraderExitMode } from "@/lib/trader-search-params-shared";
import { normalizeWalletAddress } from "@/lib/utils";
import type { PnlV3ExitMarker, PnlV3ExitReason, PnlV3RiskResponse } from "@structbuild/sdk";

export type PnlDataPoint = {
	t: number;
	open: number;
	high: number;
	low: number;
	close: number;
	p: number;
	portfolioOpen: number;
	portfolioHigh: number;
	portfolioLow: number;
	portfolioClose: number;
	numOpenPositions: number;
	usdBalance: number;
};

export type DailyPnlEntry = {
	t: number;
	pnl: number;
	open: number;
	high: number;
	low: number;
	close: number;
	numOpenPositions: number;
	usdBalance: number;
};

const defaultPnlTimeframe: StructPnlCandleTimeframe = "lifetime";
const defaultPnlResolution: StructPnlCandleResolution = "1h";
const defaultPnlPeriodsTimeframe: StructPnlPeriodTimeframe = "lifetime";
const defaultPnlRiskTimeframe: StructPnlPeriodTimeframe = "lifetime";

type TraderPnlCandlesOptions = {
	fillGaps?: boolean;
	from?: number;
	to?: number;
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
				...(options.from === undefined ? {} : { from: options.from }),
				...(options.to === undefined ? {} : { to: options.to }),
			});

			return response.data
				.map((candle) => {
					const portfolioClose = candle.pc ?? candle.ub + candle.pb;
					const portfolioOpen = candle.po ?? portfolioClose;
					const portfolioHigh = candle.ph ?? Math.max(portfolioOpen, portfolioClose);
					const portfolioLow = candle.pl ?? Math.min(portfolioOpen, portfolioClose);
					const close = candle.c ?? candle.rp + candle.up;
					const open = candle.o ?? close;
					const high = candle.h ?? Math.max(open, close);
					const low = candle.l ?? Math.min(open, close);

					return {
						t: candle.t,
						open,
						high,
						low,
						close,
						p: close,
						portfolioOpen,
						portfolioHigh,
						portfolioLow,
						portfolioClose,
						numOpenPositions: candle.nop,
						usdBalance: candle.ub + candle.pb,
					};
				})
				.sort((a, b) => a.t - b.t);
		} catch (error) {
			if (readStatus(error) === 404) {
				return [];
			}

			const rangeKey = `${options.from ?? ""}:${options.to ?? ""}`;
			logStructError(`getTraderPnlV3Candles:${address}:${timeframe}:${resolution}:${rangeKey}`, error);
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

export const defaultTraderExitsPageSize = 25;

function emptyExitsPage(limit: number): PaginatedResource<PnlV3ExitMarker, number> {
	return { data: [], hasMore: false, nextCursor: null, pageSize: limit };
}

const getTraderExitsPageCached = cache(
	async (
		address: string,
		mode: TraderExitMode,
		offset: number,
		limit: number,
	): Promise<PaginatedResource<PnlV3ExitMarker, number>> => {
		const client = getStructClient();

		if (!client) {
			return emptyExitsPage(limit);
		}

		try {
			const response = await client.trader.getTraderPnlV3Exits({
				address,
				sort_by: "pnl_usd",
				sort_direction: mode === "wins" ? "desc" : "asc",
				...(mode === "wins" ? { min_pnl_usd: 0 } : { max_pnl_usd: 0 }),
				offset,
				limit: limit + 1,
			});
			const all = response.data ?? [];
			const data = all.slice(0, limit);
			const hasMore = all.length > limit;

			return {
				data,
				hasMore,
				nextCursor: hasMore ? offset + data.length : null,
				pageSize: limit,
			};
		} catch (error) {
			if (readStatus(error) === 404) {
				return emptyExitsPage(limit);
			}

			logStructError(`getTraderPnlV3Exits:${address}:${mode}:${offset}`, error);
			return emptyExitsPage(limit);
		}
	},
);

export async function getTraderExitsPage(
	address: string,
	mode: TraderExitMode,
	options: { offset?: number; limit?: number } = {},
): Promise<PaginatedResource<PnlV3ExitMarker, number>> {
	const limit = options.limit ?? defaultTraderExitsPageSize;
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) return emptyExitsPage(limit);

	return getTraderExitsPageCached(normalizedAddress, mode, options.offset ?? 0, limit);
}

export type PnlChartExit = {
	t: number;
	pnlUsd: number;
	pnlPct: number | null;
	costBasisUsd: number;
	question: string;
	outcome: string | null;
	outcomeIndex: number | null;
	imageUrl: string | null;
	marketSlug: string | null;
	reason: PnlV3ExitReason;
};

function toChartExit(exit: PnlV3ExitMarker): PnlChartExit {
	return {
		t: exit.t,
		pnlUsd: exit.pnl_usd ?? 0,
		pnlPct: exit.pnl_pct ?? null,
		costBasisUsd: exit.cost_basis_usd ?? 0,
		question: exit.question || exit.title || "Unknown market",
		outcome: exit.outcome ?? null,
		outcomeIndex: exit.outcome_index ?? null,
		imageUrl: exit.image_url ?? null,
		marketSlug: exit.market_slug ?? null,
		reason: exit.reason,
	};
}

export async function getTraderChartExits(address: string, perSide = 8): Promise<PnlChartExit[]> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) return [];

	const [wins, losses] = await Promise.all([
		getTraderExitsPage(normalizedAddress, "wins", { limit: perSide }),
		getTraderExitsPage(normalizedAddress, "losses", { limit: perSide }),
	]);

	return [...wins.data, ...losses.data].map(toChartExit);
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
	window: PnlPeriodWindow;
	date: string;
	change: number;
	from: number;
	to: number;
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
	if (candles.length === 0) return [];

	const sortedCandles = [...candles].sort((a, b) => a.t - b.t);

	function findCumulativePnlAt(timestamp: number): number | null {
		let candidate: PnlDataPoint | null = null;
		for (const candle of sortedCandles) {
			if (candle.t > timestamp) break;
			candidate = candle;
		}
		return candidate?.p ?? null;
	}

	const annotations: PnlChartAnnotation[] = [];
	const windows: PnlPeriodWindow[] = ["day", "week", "month"];

	for (const window of windows) {
		const extremes = periods.totalPnl[window];
		for (const kind of ["best", "worst"] as const) {
			const period = extremes[kind];
			if (!period) continue;
			if (kind === "best" && period.change <= 0) continue;
			if (kind === "worst" && period.change >= 0) continue;

			const cumulativePnl = findCumulativePnlAt(period.from);
			if (cumulativePnl === null) continue;

			annotations.push({
				kind,
				window,
				date: period.date,
				change: period.change,
				from: period.from,
				to: period.to,
				p: cumulativePnl,
			});
		}
	}

	annotations.sort((a, b) => a.from - b.from);
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
		numOpenPositions: point.numOpenPositions,
		usdBalance: point.usdBalance,
	}));
}
