"use client";

import type { GlobalEntry, PnlChangesResponse, PnlRiskResponse } from "@structbuild/sdk";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
	type ReactNode,
} from "react";

import { getTraderPnlViewAction } from "@/app/actions";
import { PerformanceSummary } from "@/components/trader/performance-summary";
import { getPnlChartAnnotations } from "@/lib/pnl-chart-annotations";
import { expandPnlDataPointsFromWire, type WirePnlPoint } from "@/lib/struct/pnl-wire";
import type {
	PnlChartAnnotation,
	PnlChartExit,
	PnlDataPoint,
	PnlPeriods,
	PnlStreaks,
} from "@/lib/struct/pnl";
import type { ResolvedPnlRange } from "@/lib/struct/pnl-range";
import {
	pnlAnchorValues,
	pnlTimeframeValues,
	type PnlAnchor,
	type PnlTimeframe,
} from "@/lib/struct/pnl-timeframes";

type TraderPnlQuery = {
	timeframe: PnlTimeframe;
	anchor: PnlAnchor | null;
	from: number | null;
	to: number | null;
	fillGaps: boolean;
	timezone: string;
};

type TraderPnlView = {
	range: ResolvedPnlRange;
	fillGaps: boolean;
	candles: PnlDataPoint[];
	annotations: PnlChartAnnotation[];
	exits: PnlChartExit[];
	risk: PnlRiskResponse | null;
	isPending: boolean;
	update: (patch: Partial<TraderPnlQuery>) => void;
};

const TraderPnlContext = createContext<TraderPnlView | null>(null);

function parseOptionalSeconds(value: string | null): number | null {
	if (!value) return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

export function TraderPnlProvider({
	address,
	initialRange,
	initialFillGaps,
	initialCandles,
	initialAnnotations,
	initialExits,
	initialRisk,
	periods,
	children,
}: {
	address: string;
	initialRange: ResolvedPnlRange;
	initialFillGaps: boolean;
	initialCandles: WirePnlPoint[];
	initialAnnotations: PnlChartAnnotation[];
	initialExits: PnlChartExit[];
	initialRisk: PnlRiskResponse | null;
	periods: PnlPeriods;
	children: ReactNode;
}) {
	const [isPending, startTransition] = useTransition();
	const requestIdRef = useRef(0);
	const queryRef = useRef<TraderPnlQuery>({
		timeframe: initialRange.timeframe,
		anchor: initialRange.anchor,
		from: initialRange.from ?? null,
		to: initialRange.to ?? null,
		fillGaps: initialFillGaps,
		timezone: initialRange.timezone,
	});
	const [state, setState] = useState({
		range: initialRange,
		fillGaps: initialFillGaps,
		candles: expandPnlDataPointsFromWire(initialCandles),
		annotations: initialAnnotations,
		exits: initialExits,
		risk: initialRisk,
	});

	const update = useCallback((patch: Partial<TraderPnlQuery>) => {
		const nextQuery = { ...queryRef.current, ...patch };
		const requestId = requestIdRef.current + 1;
		requestIdRef.current = requestId;

		startTransition(async () => {
			try {
				const result = await getTraderPnlViewAction({ address, ...nextQuery });
				if (requestIdRef.current !== requestId) return;
				queryRef.current = nextQuery;
				setState({
					range: result.range,
					fillGaps: result.fillGaps,
					candles: result.candles,
					annotations:
						result.range.mode === "preset" && result.range.timeframe === "all"
							? getPnlChartAnnotations(result.candles, periods)
							: [],
					exits: result.exits,
					risk: result.risk,
				});
			} catch (error) {
				if (requestIdRef.current !== requestId) return;
				console.error("Failed to load trader PnL data", error);
			}
		});
	}, [address, periods]);

	useEffect(() => {
		function handlePopState() {
			const params = new URLSearchParams(window.location.search);
			const rawTimeframe = params.get("pnlTimeframe");
			const rawAnchor = params.get("pnlAnchor");
			update({
				timeframe: pnlTimeframeValues.includes(rawTimeframe as PnlTimeframe)
					? (rawTimeframe as PnlTimeframe)
					: "all",
				anchor: pnlAnchorValues.includes(rawAnchor as PnlAnchor)
					? (rawAnchor as PnlAnchor)
					: null,
				from: parseOptionalSeconds(params.get("pnlFrom")),
				to: parseOptionalSeconds(params.get("pnlTo")),
				fillGaps: params.get("pnlFillGaps") === "true",
			});
		}

		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [update]);

	const value = useMemo<TraderPnlView>(
		() => ({ ...state, isPending, update }),
		[isPending, state, update],
	);

	return <TraderPnlContext value={value}>{children}</TraderPnlContext>;
}

export function useTraderPnlView() {
	const value = useContext(TraderPnlContext);
	if (!value) throw new Error("useTraderPnlView must be used within TraderPnlProvider");
	return value;
}

export function TraderPerformanceSummaryLive({
	pnlSummary,
	pnlChanges,
	streaks,
	periods,
}: {
	pnlSummary: GlobalEntry | null;
	pnlChanges: PnlChangesResponse | null;
	streaks: PnlStreaks;
	periods: PnlPeriods;
}) {
	const { risk } = useTraderPnlView();
	return (
		<PerformanceSummary
			pnlSummary={pnlSummary}
			pnlRisk={risk}
			pnlChanges={pnlChanges}
			streaks={streaks}
			periods={periods}
		/>
	);
}
