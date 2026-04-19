import { AnalyticsSection } from "@/components/analytics/analytics-section";
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
import {
	getTraderOgImageAlt,
	getTraderOgImageUrl,
	getTraderPageDescription,
	getTraderPageTitle,
	getTraderSocialTitle,
	loadTraderOpenGraphIdentity,
	traderOgImageSize,
} from "@/lib/trader-open-graph";
import { loadTraderSearchParams } from "@/lib/trader-search-params.server";
import {
	getTraderAnalyticsChanges,
	getTraderAnalyticsDeltas,
	getTraderAnalyticsTimeseries,
} from "@/lib/struct/analytics-queries";
import {
	parseAnalyticsRange,
	parseAnalyticsView,
} from "@/lib/struct/analytics-shared";
import {
	getMarketsByConditionIds,
	getTraderPnlSummary,
	getTraderProfile,
} from "@/lib/struct/queries";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPageMetadata } from "@/lib/site-metadata";
import { getTraderDisplayName, normalizeWalletAddress } from "@/lib/utils";
import type {
	MarketResponse,
	TraderPnlSummary,
	UserProfile,
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
	const { address: rawAddress } = await params;
	const address = normalizeWalletAddress(rawAddress);

	if (!address) {
		notFound();
	}

	const { displayName } = await loadTraderOpenGraphIdentity(address);
	const description = getTraderPageDescription(displayName);
	const socialTitle = getTraderSocialTitle(displayName);
	const ogImage = getTraderOgImageUrl(address);
	const ogAlt = getTraderOgImageAlt(displayName);

	return buildPageMetadata({
		title: getTraderPageTitle(displayName),
		description,
		canonical: `/traders/${address}`,
		openGraph: {
			title: socialTitle,
			type: "profile",
			images: [
				{
					url: ogImage,
					width: traderOgImageSize.width,
					height: traderOgImageSize.height,
					alt: ogAlt,
				},
			],
		},
		twitter: {
			title: socialTitle,
			images: [ogImage],
		},
	});
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
): Promise<MarketResponse | null> {
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
				<div className="aspect-7/6 animate-pulse rounded-md bg-muted" />
			</div>
		</>
	);
}

function TraderHeaderFallback() {
	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
					<div className="size-16 animate-pulse rounded-full bg-muted sm:size-20" />
					<div className="min-w-0 flex-1 space-y-4">
						<div className="space-y-2">
							<div className="h-8 w-48 animate-pulse rounded bg-muted" />
							<div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
						</div>
						<div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-4">
							{Array.from({ length: 8 }, (_, index) => (
								<div key={index} className="space-y-2">
									<div className="h-3 w-16 animate-pulse rounded bg-muted" />
									<div className="h-5 w-20 animate-pulse rounded bg-muted" />
								</div>
							))}
						</div>
					</div>
				</div>
				<div className="h-10 w-full animate-pulse rounded-md bg-muted sm:w-36" />
			</div>
		</div>
	);
}

function TraderInfoFallback() {
	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<div className="h-5 w-36 animate-pulse rounded bg-muted" />
			<div className="my-2 h-px bg-border" />
			<div className="space-y-3">
				{Array.from({ length: 6 }, (_, index) => (
					<div key={index} className="flex items-center justify-between gap-4">
						<div className="h-4 w-20 animate-pulse rounded bg-muted" />
						<div className="h-4 w-24 animate-pulse rounded bg-muted" />
					</div>
				))}
				<div className="space-y-2 pt-1">
					<div className="h-4 w-12 animate-pulse rounded bg-muted" />
					<div className="h-4 w-full animate-pulse rounded bg-muted" />
					<div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
				</div>
			</div>
			<div className="my-2 h-px bg-border" />
		</div>
	);
}

async function TraderPerformanceSummarySection({
	pnlSummary,
	insightsPromise,
	bestTradeMarketPromise,
}: {
	pnlSummary: TraderPnlSummary | null;
	insightsPromise: Promise<TraderInsightsData>;
	bestTradeMarketPromise: Promise<MarketResponse | null>;
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

async function TraderOverviewSection({
	address,
	timeframe,
	profilePromise,
	pnlSummaryPromise,
	insightsPromise,
	bestTradeMarketPromise,
}: {
	address: string;
	timeframe: PnlTimeframe;
	profilePromise: Promise<UserProfile | null>;
	pnlSummaryPromise: Promise<TraderPnlSummary | null>;
	insightsPromise: Promise<TraderInsightsData>;
	bestTradeMarketPromise: Promise<MarketResponse | null>;
}) {
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

	const profileJsonLd = {
		"@context": "https://schema.org",
		"@type": "ProfilePage",
		mainEntity: {
			"@type": "Person",
			name: displayName,
			identifier: address,
			...(profile?.bio ? { description: profile.bio } : {}),
			...(profile?.profile_image ? { image: profile.profile_image } : {}),
		},
	};

	return (
		<div className="space-y-4">
			<JsonLd data={profileJsonLd} />
			<TraderHeader
				address={address}
				displayName={displayName}
				profileImage={profile?.profile_image}
				firstTradeAt={pnlSummary?.first_trade_at}
				lastTradeAt={pnlSummary?.last_trade_at}
				totalBuys={pnlSummary?.total_buys}
				totalSells={pnlSummary?.total_sells}
				totalRedemptions={pnlSummary?.total_redemptions}
				totalMerges={pnlSummary?.total_merges}
				totalVolumeUsd={pnlSummary?.total_volume_usd}
				totalFees={pnlSummary?.total_fees}
			/>
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
				<div className="min-w-0 space-y-4 lg:w-2/3">
					<Suspense fallback={<TraderInsightsFallback />}>
						<TraderInsightsSection
							address={address}
							displayName={displayName}
							timeframe={timeframe}
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
		</div>
	);
}

function TraderOverviewFallback() {
	return (
		<div className="space-y-4">
			<TraderHeaderFallback />
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
				<div className="min-w-0 space-y-4 lg:w-2/3">
					<TraderInsightsFallback />
				</div>
				<div className="min-w-0 space-y-4 lg:w-1/3">
					<TraderPerformanceSummaryFallback />
					<TraderInfoFallback />
				</div>
			</div>
		</div>
	);
}

export default async function TraderPage({ params, searchParams }: Props) {
	const { address: rawAddress } = await params;
	const address = normalizeWalletAddress(rawAddress);

	if (!address) {
		notFound();
	}

	const [
		{
			tab,
			openPage,
			closedPage,
			activityPage,
			pnlTimeframe,
			openSortBy,
			openSortDirection,
			closedSortBy,
			closedSortDirection,
		},
		resolvedSearchParams,
	] = await Promise.all([loadTraderSearchParams(searchParams), searchParams]);
	const view = parseAnalyticsView(resolvedSearchParams.view);
	const range =
		view === "cumulative" ? "all" : parseAnalyticsRange(resolvedSearchParams.range);

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
		openSortBy,
		openSortDirection,
		closedSortBy,
		closedSortDirection,
	});

	const { displayName } = await loadTraderOpenGraphIdentity(address);

	return (
		<div className="flex w-full justify-center">
			<div className="flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 sm:gap-8 sm:px-6 sm:pb-12">
				<Breadcrumbs
					items={[
						{ label: "Home", href: "/" },
						{ label: "Traders", href: "/traders" },
						{ label: displayName, href: `/traders/${address}` },
					]}
				/>
				<Suspense fallback={<TraderOverviewFallback />}>
					<TraderOverviewSection
						address={address}
						timeframe={pnlTimeframe}
						profilePromise={profilePromise}
						pnlSummaryPromise={pnlSummaryPromise}
						insightsPromise={insightsPromise}
						bestTradeMarketPromise={bestTradeMarketPromise}
					/>
				</Suspense>

				<div>
					<Suspense fallback={<TraderTabPanelFallback currentTab={tab} />}>
						<TraderTabPanel tabDataPromise={tabDataPromise} />
					</Suspense>
				</div>

				<AnalyticsSection
					title="Analytics"
					range={range}
					view={view}
					excludeMetrics={["uniqueTraders"]}
					appendMetrics={["fees"]}
					pathname={`/traders/${address}`}
					fetchers={{
						deltas: () => getTraderAnalyticsDeltas(address, range),
						timeseries: () => getTraderAnalyticsTimeseries(address, range),
						changes: () => getTraderAnalyticsChanges(address, range),
					}}
				/>
			</div>
		</div>
	);
}
