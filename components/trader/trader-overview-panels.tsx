"use client";

import type { TraderPnl } from "@structbuild/sdk";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { getTraderOverviewDetailsAction } from "@/app/actions";
import { PnlCalendar } from "@/components/trader/pnl-calendar";
import { PnlCard } from "@/components/trader/pnl-card";
import {
	TraderPerformanceSummaryLive,
	TraderPnlProvider,
	useTraderPnlView,
} from "@/components/trader/trader-pnl-provider";
import { TraderDnaCard } from "@/components/trader/trader-dna-card";
import { getPnlChartAnnotations } from "@/lib/pnl-chart-annotations";
import type { PnlChartAnnotation, PnlChartExit, PnlPeriods, PnlStreaks } from "@/lib/struct/pnl";
import type { ResolvedPnlRange } from "@/lib/struct/pnl-range";
import {
	expandPnlDataPointsFromWire,
	type WirePnlPoint,
} from "@/lib/struct/pnl-wire";

const EMPTY_PERIODS: PnlPeriods = {
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

const EMPTY_STREAKS: PnlStreaks = { longestWin: 0, longestLoss: 0, current: 0 };
const EMPTY_ANNOTATIONS: PnlChartAnnotation[] = [];
const EMPTY_EXITS: PnlChartExit[] = [];

type TraderOverviewDetails = Awaited<ReturnType<typeof getTraderOverviewDetailsAction>>;

type TraderOverviewPanelsProps = {
	address: string;
	displayName: string;
	profileImage?: string | null;
	pnlSummary: TraderPnl | null;
	cumulativePnlUsd: number;
	initialRange: ResolvedPnlRange;
	initialFillGaps: boolean;
	initialCandles: WirePnlPoint[];
};

function CalendarFallback() {
	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<div className="mb-4 h-5 w-28 animate-pulse rounded bg-muted" />
			<div className="aspect-7/6 animate-pulse rounded-md bg-muted" />
		</div>
	);
}

function TraderOverviewPanelsContent({
	address,
	displayName,
	profileImage,
	pnlSummary,
	cumulativePnlUsd,
	initialRange,
	initialCandles,
}: Omit<TraderOverviewPanelsProps, "initialFillGaps">) {
	const requestKeyRef = useRef<string | null>(null);
	const [details, setDetails] = useState<TraderOverviewDetails | null>(null);
	const [isPending, startTransition] = useTransition();
	const { hydrateSupplemental } = useTraderPnlView();
	const requestKey = `${address}:${initialRange.timeframe}:${initialRange.from ?? ""}:${initialRange.to ?? ""}`;

	const loadDetails = useCallback(() => {
		if (requestKeyRef.current === requestKey) return;
		requestKeyRef.current = requestKey;

		startTransition(async () => {
			try {
				const result = await getTraderOverviewDetailsAction({
					address,
					timeframe: initialRange.timeframe,
					from: initialRange.from ?? null,
					to: initialRange.to ?? null,
				});
				if (requestKeyRef.current !== requestKey) return;
				const annotations = initialRange.mode === "preset" && initialRange.timeframe === "all"
					? getPnlChartAnnotations(expandPnlDataPointsFromWire(initialCandles), result.periods)
					: [];
				hydrateSupplemental({
					annotations,
					exits: result.exits,
					risk: result.risk,
					periods: result.periods,
				});
				setDetails(result);
			} catch (error) {
				if (requestKeyRef.current === requestKey) requestKeyRef.current = null;
				console.error("Failed to load supplemental trader overview data", error);
			}
		});
	}, [address, hydrateSupplemental, initialCandles, initialRange.from, initialRange.mode, initialRange.timeframe, initialRange.to, requestKey]);

	useEffect(() => {
		if (navigator.userActivation.hasBeenActive) {
			loadDetails();
			return;
		}

		const options = { once: true, passive: true } as const;
		window.addEventListener("scroll", loadDetails, options);
		window.addEventListener("pointerdown", loadDetails, options);
		window.addEventListener("pointermove", loadDetails, options);
		window.addEventListener("keydown", loadDetails, { once: true });
		return () => {
			window.removeEventListener("scroll", loadDetails);
			window.removeEventListener("pointerdown", loadDetails);
			window.removeEventListener("pointermove", loadDetails);
			window.removeEventListener("keydown", loadDetails);
		};
	}, [loadDetails]);

	return (
		<div
			className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6"
			aria-busy={isPending}
			onPointerEnter={loadDetails}
			onFocusCapture={loadDetails}
		>
			<div className="min-w-0 space-y-6 lg:w-2/3">
				<PnlCard
					address={address}
					displayName={displayName}
					profileImage={profileImage}
					firstTradeAt={pnlSummary?.first_trade_at ?? undefined}
					availableCategories={details?.availableCategories ?? []}
				/>
				{details ? (
					<div className="rounded-lg bg-card p-4 sm:p-6">
						<PnlCalendar data={details.dailyPnl} periods={details.periods} />
					</div>
				) : (
					<CalendarFallback />
				)}
			</div>

			<div className="min-w-0 space-y-6 lg:w-1/3">
				<TraderPerformanceSummaryLive
					pnlSummary={pnlSummary}
					pnlChanges={details?.changes ?? null}
					streaks={details?.streaks ?? EMPTY_STREAKS}
					periods={details?.periods ?? EMPTY_PERIODS}
				/>
				<TraderDnaCard
					pnlSummary={pnlSummary}
					cumulativePnlUsd={cumulativePnlUsd}
					categoryVolumes={details?.categoryVolumes ?? []}
					address={address}
					displayName={displayName}
					profileImage={profileImage}
				/>
			</div>
		</div>
	);
}

export function TraderOverviewPanels(props: TraderOverviewPanelsProps) {
	return (
		<TraderPnlProvider
			address={props.address}
			initialRange={props.initialRange}
			initialFillGaps={props.initialFillGaps}
			initialCandles={props.initialCandles}
			initialAnnotations={EMPTY_ANNOTATIONS}
			initialExits={EMPTY_EXITS}
			initialRisk={null}
			periods={EMPTY_PERIODS}
			firstTradeAt={props.pnlSummary?.first_trade_at ?? null}
		>
			<TraderOverviewPanelsContent
				address={props.address}
				displayName={props.displayName}
				profileImage={props.profileImage}
				pnlSummary={props.pnlSummary}
				cumulativePnlUsd={props.cumulativePnlUsd}
				initialRange={props.initialRange}
				initialCandles={props.initialCandles}
			/>
		</TraderPnlProvider>
	);
}
