import { PerformanceSummary } from "@/components/trader/performance-summary";
import { PnlCalendar } from "@/components/trader/pnl-calendar";
import { PnlCard } from "@/components/trader/pnl-card";
import {
	TraderTabPanel,
	TraderTabPanelFallback,
	loadTraderTabPanelData,
} from "@/components/trader/trader-tab-panel";
import { TraderHeader } from "@/components/trader/trader-header";
import { TraderInfo } from "@/components/trader/trader-info";
import {
	computeStreaks,
	getPnlChartAnnotations,
	getTraderDailyPnl,
	getTraderPnlCandles,
	type DailyPnlEntry,
	type PnlChartAnnotation,
	type PnlDataPoint,
	type PnlStreaks,
} from "@/lib/polymarket/pnl";
import {
	PNL_TIMEFRAMES,
	type PnlTimeframe,
} from "@/lib/polymarket/pnl-timeframes";
import { loadTraderSearchParams } from "@/lib/trader-search-params.server";
import {
	getMarketsByConditionIds,
	getTraderPnlSummary,
	getTraderProfile,
} from "@/lib/struct/queries";
import { getTraderDisplayName } from "@/lib/utils";
import type {
	MarketMetadata,
	TraderPnlSummary,
} from "@structbuild/sdk";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const revalidate = 300;

type Props = {
	params: Promise<{ address: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type TraderInsightsData = {
	pnlCandles: PnlDataPoint[];
	dailyPnl: DailyPnlEntry[];
	streaks: PnlStreaks;
	chartAnnotations: PnlChartAnnotation[];
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { address } = await params;
	const profile = await getTraderProfile(address);
	const displayName = profile ? getTraderDisplayName({ address, name: profile.name, pseudonym: profile.pseudonym }) : address;
	const description = `Analyze ${displayName}'s Polymarket trading performance - PnL history, win rate, volume, and recent trades. Powered by Struct.`;

	return {
		title: `${displayName} - Trader Profile`,
		description,
		alternates: {
			canonical: `/trader/${address}`,
		},
		openGraph: {
			title: `${displayName} - Polymarket Trader`,
			description,
			type: "profile",
		},
		twitter: {
			card: "summary",
			title: `${displayName} - Polymarket Trader`,
			description,
		},
	};
}

function loadTraderInsights(address: string, timeframe: PnlTimeframe): Promise<TraderInsightsData> {
	const { interval, fidelity } = PNL_TIMEFRAMES[timeframe];
	const pnlCandlesPromise = getTraderPnlCandles(address, interval, fidelity);
	const dailyPnlPromise = getTraderDailyPnl(address);

	return Promise.all([pnlCandlesPromise, dailyPnlPromise]).then(([pnlCandles, dailyPnl]) => {
		const streaks = computeStreaks(dailyPnl);
		const chartAnnotations = timeframe === "all" ? getPnlChartAnnotations(pnlCandles, streaks) : [];

		return {
			pnlCandles,
			dailyPnl,
			streaks,
			chartAnnotations,
		};
	});
}

function loadBestTradeMarket(
	pnlSummaryPromise: Promise<TraderPnlSummary | null>,
): Promise<MarketMetadata | null> {
	return pnlSummaryPromise.then(async (pnlSummary) => {
		const bestTradeConditionId = pnlSummary?.best_trade_condition_id;

		if (!bestTradeConditionId) {
			return null;
		}

		const markets = await getMarketsByConditionIds([bestTradeConditionId]);
		return markets?.find((market) => market.condition_id === bestTradeConditionId) ?? null;
	});
}

async function TraderInsightsSection({
	address,
	displayName,
	timeframe,
	insightsPromise,
}: {
	address: string;
	displayName: string;
	timeframe: PnlTimeframe;
	insightsPromise: Promise<TraderInsightsData>;
}) {
	const { pnlCandles, dailyPnl, chartAnnotations } = await insightsPromise;

	return (
		<>
			<PnlCard
				address={address}
				data={pnlCandles}
				displayName={displayName}
				annotations={chartAnnotations}
				timeframe={timeframe}
			/>
			<div className="rounded-lg bg-card p-4 sm:p-6">
				<PnlCalendar data={dailyPnl} />
			</div>
		</>
	);
}

function TraderInsightsFallback() {
	return (
		<>
			<div className="rounded-lg bg-card p-4 sm:p-6">
				<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="space-y-2">
						<div className="h-4 w-28 animate-pulse rounded bg-muted" />
						<div className="h-8 w-40 animate-pulse rounded bg-muted" />
					</div>
					<div className="flex w-full flex-wrap gap-2 sm:w-auto">
						<div className="h-6 w-20 animate-pulse rounded-md bg-muted" />
						<div className="h-6 w-28 animate-pulse rounded-md bg-muted" />
						<div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
					</div>
				</div>
				<div className="h-[220px] animate-pulse rounded-md bg-muted sm:h-[280px]" />
			</div>
			<div className="rounded-lg bg-card p-4 sm:p-6">
				<div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted" />
				<div className="aspect-[7/6] animate-pulse rounded-md bg-muted" />
			</div>
		</>
	);
}

async function TraderPerformanceSummarySection({
	pnlSummary,
	insightsPromise,
	bestTradeMarketPromise,
}: {
	pnlSummary: TraderPnlSummary | null;
	insightsPromise: Promise<TraderInsightsData>;
	bestTradeMarketPromise: Promise<MarketMetadata | null>;
}) {
	const [{ streaks }, bestTradeMarket] = await Promise.all([
		insightsPromise,
		bestTradeMarketPromise,
	]);

	return (
		<PerformanceSummary
			pnlSummary={pnlSummary}
			bestTradeMarket={bestTradeMarket}
			streaks={streaks}
		/>
	);
}

function TraderPerformanceSummaryFallback() {
	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<div className="mb-4 h-5 w-40 animate-pulse rounded bg-muted" />
			<div className="space-y-3">
				{Array.from({ length: 7 }, (_, index) => (
					<div key={index} className="flex items-center justify-between gap-4">
						<div className="h-4 w-28 animate-pulse rounded bg-muted" />
						<div className="h-4 w-20 animate-pulse rounded bg-muted" />
					</div>
				))}
			</div>
		</div>
	);
}

export default async function TraderPage({ params, searchParams }: Props) {
	const { address } = await params;
	const { tab, openPage, closedPage, activityPage, pnlTimeframe } = await loadTraderSearchParams(searchParams);

	const profilePromise = getTraderProfile(address);
	const pnlSummaryPromise = getTraderPnlSummary(address);
	const insightsPromise = loadTraderInsights(address, pnlTimeframe);
	const bestTradeMarketPromise = loadBestTradeMarket(pnlSummaryPromise);
	const tabDataPromise = loadTraderTabPanelData({
		address,
		currentTab: tab,
		openPage,
		closedPage,
		activityPage,
	});

	const [profile, pnlSummary] = await Promise.all([
		profilePromise,
		pnlSummaryPromise,
	]);

	if (!profile && !pnlSummary) {
		notFound();
	}

	const displayName = getTraderDisplayName({
		address,
		name: profile?.name,
		pseudonym: profile?.pseudonym,
	});

	return (
		<div className="flex w-full justify-center">
			<div className="flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 sm:gap-8 sm:px-6 sm:pb-12">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
					<div className="min-w-0 space-y-4 lg:w-2/3">
						<TraderHeader
							address={address}
							displayName={displayName}
							profileImage={profile?.profile_image}
							firstTradeAt={pnlSummary?.first_trade_at}
							totalBuys={pnlSummary?.total_buys}
							totalSells={pnlSummary?.total_sells}
							totalRedemptions={pnlSummary?.total_redemptions}
							totalVolumeUsd={pnlSummary?.total_volume_usd}
						/>
						<Suspense fallback={<TraderInsightsFallback />}>
							<TraderInsightsSection
								address={address}
								displayName={displayName}
								timeframe={pnlTimeframe}
								insightsPromise={insightsPromise}
							/>
						</Suspense>
					</div>

					<div className="min-w-0 space-y-4 lg:w-1/3">
						<Suspense fallback={<TraderPerformanceSummaryFallback />}>
							<TraderPerformanceSummarySection
								pnlSummary={pnlSummary}
								insightsPromise={insightsPromise}
								bestTradeMarketPromise={bestTradeMarketPromise}
							/>
						</Suspense>
						<TraderInfo address={address} profile={profile} />
					</div>
				</div>

				<div>
					<Suspense fallback={<TraderTabPanelFallback currentTab={tab} />}>
						<TraderTabPanel tabDataPromise={tabDataPromise} />
					</Suspense>
				</div>
			</div>
		</div>
	);
}
