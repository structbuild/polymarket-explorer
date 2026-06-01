import { AnalyticsSection } from "@/components/analytics/analytics-section";
import { PerformanceSummary } from "@/components/trader/performance-summary";
import { PnlCalendar } from "@/components/trader/pnl-calendar";
import { PnlCard } from "@/components/trader/pnl-card";
import { TraderDnaCard } from "@/components/trader/trader-dna-card";
import { TraderTabPanel, TraderTabPanelFallback, loadTraderTabPanelData } from "@/components/trader/trader-tab-panel";
import { TraderHeader } from "@/components/trader/trader-header";
import {
	computeStreaks,
	getPnlChartAnnotations,
	getTraderChartExits,
	getTraderCumulativePnlUsd,
	getTraderDailyPnl,
	getTraderPnlCandles,
	getTraderPnlPeriods,
	getTraderPnlRisk,
	type DailyPnlEntry,
	type PnlChartAnnotation,
	type PnlChartExit,
	type PnlDataPoint,
	type PnlPeriods,
	type PnlStreaks,
} from "@/lib/struct/pnl";
import { PNL_RISK_TIMEFRAMES } from "@/lib/struct/pnl-timeframes";
import { resolvePnlRange, type ResolvedPnlRange } from "@/lib/struct/pnl-range";
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
import { getServerTimezone } from "@/lib/timezone.server";
import { getTraderAnalyticsChanges, getTraderAnalyticsDeltas, getTraderAnalyticsTimeseries } from "@/lib/struct/analytics-queries";
import { parseAnalyticsParams, SCOPED_VOLUME_COMPONENTS } from "@/lib/struct/analytics-shared";
import { getTraderCategoryPnlV3, getTraderPnlSummary, getTraderPnlV3Changes, getTraderProfile } from "@/lib/struct/queries";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPageMetadata } from "@/lib/site-metadata";
import { getTraderDisplayName, normalizeWalletAddress } from "@/lib/utils";
import type { PnlV3ChangesResponse, PnlV3RiskResponse, GlobalEntry, UserProfile } from "@structbuild/sdk";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

type Props = {
	params: Promise<{ address: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type TraderInsightsData = {
	pnlCandles: PnlDataPoint[];
	dailyPnl: DailyPnlEntry[];
	streaks: PnlStreaks;
	periods: PnlPeriods;
	chartAnnotations: PnlChartAnnotation[];
	chartExits: PnlChartExit[];
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { address: rawAddress } = await params;
	const address = normalizeWalletAddress(rawAddress);

	if (!address) {
		notFound();
	}

	const [{ displayName }, pnlSummary, cumulativePnlUsd] = await Promise.all([
		loadTraderOpenGraphIdentity(address),
		getTraderPnlSummary(address),
		getTraderCumulativePnlUsd(address),
	]);
	const description = getTraderPageDescription(displayName, address, cumulativePnlUsd, pnlSummary);
	const socialTitle = getTraderSocialTitle(displayName, cumulativePnlUsd);
	const ogImage = getTraderOgImageUrl(address);
	const ogAlt = getTraderOgImageAlt(displayName);

	return buildPageMetadata({
		title: getTraderPageTitle(displayName, cumulativePnlUsd),
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

function loadTraderInsights(address: string, range: ResolvedPnlRange, fillGaps: boolean): Promise<TraderInsightsData> {
	const pnlCandlesPromise = getTraderPnlCandles(address, range.apiTimeframe, range.resolution, {
		from: range.from,
		to: range.to,
		fillGaps,
	});
	const dailyPnlPromise = getTraderDailyPnl(address);
	const periodsPromise = getTraderPnlPeriods(address);
	const chartExitsPromise = getTraderChartExits(address, { from: range.from, to: range.to });

	return Promise.all([pnlCandlesPromise, dailyPnlPromise, periodsPromise, chartExitsPromise]).then(
		([pnlCandles, dailyPnl, periods, chartExits]) => {
			const streaks = computeStreaks(dailyPnl);
			const showAnnotations = range.mode === "preset" && range.timeframe === "all";
			const chartAnnotations = showAnnotations ? getPnlChartAnnotations(pnlCandles, periods) : [];

			return {
				pnlCandles,
				dailyPnl,
				streaks,
				periods,
				chartAnnotations,
				chartExits,
			};
		},
	);
}

async function TraderInsightsSection({
	address,
	displayName,
	profileImage,
	pnlRange,
	pnlFillGaps,
	firstTradeAt,
	insightsPromise,
}: {
	address: string;
	displayName: string;
	profileImage?: string | null;
	pnlRange: ResolvedPnlRange;
	pnlFillGaps: boolean;
	firstTradeAt?: number;
	insightsPromise: Promise<TraderInsightsData>;
}) {
	const { pnlCandles, dailyPnl, periods, chartAnnotations, chartExits } = await insightsPromise;

	return (
		<>
			<PnlCard
				address={address}
				data={pnlCandles}
				displayName={displayName}
				profileImage={profileImage}
				annotations={chartAnnotations}
				exits={chartExits}
				pnlRange={pnlRange}
				pnlFillGaps={pnlFillGaps}
				firstTradeAt={firstTradeAt}
			/>
			<div className="rounded-lg bg-card p-4 sm:p-6">
				<PnlCalendar data={dailyPnl} periods={periods} />
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
				<div className="h-[320px] animate-pulse rounded-md bg-muted sm:h-[420px]" />
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

async function TraderPerformanceSummarySection({
	pnlSummary,
	insightsPromise,
	pnlRiskPromise,
	pnlChangesPromise,
}: {
	pnlSummary: GlobalEntry | null;
	insightsPromise: Promise<TraderInsightsData>;
	pnlRiskPromise: Promise<PnlV3RiskResponse | null>;
	pnlChangesPromise: Promise<PnlV3ChangesResponse | null>;
}) {
	const [{ streaks, periods }, pnlRisk, pnlChanges] = await Promise.all([
		insightsPromise,
		pnlRiskPromise,
		pnlChangesPromise,
	]);

	return (
		<PerformanceSummary
			pnlSummary={pnlSummary}
			pnlRisk={pnlRisk}
			pnlChanges={pnlChanges}
			streaks={streaks}
			periods={periods}
		/>
	);
}

function TraderPerformanceSummaryFallback() {
	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<div className="mb-4 h-5 w-40 animate-pulse rounded bg-muted" />
			<div className="space-y-3">
				{Array.from({ length: 10 }, (_, index) => (
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
	pnlRange,
	pnlFillGaps,
	profilePromise,
	pnlSummaryPromise,
	insightsPromise,
	cumulativePnlUsdPromise,
}: {
	address: string;
	pnlRange: ResolvedPnlRange;
	pnlFillGaps: boolean;
	profilePromise: Promise<UserProfile | null>;
	pnlSummaryPromise: Promise<GlobalEntry | null>;
	insightsPromise: Promise<TraderInsightsData>;
	cumulativePnlUsdPromise: Promise<number>;
}) {
	const [profile, pnlSummary] = await Promise.all([profilePromise, pnlSummaryPromise]);
	const pnlRiskPromise = getTraderPnlRisk(address, PNL_RISK_TIMEFRAMES[pnlRange.timeframe]);
	const pnlChangesPromise = getTraderPnlV3Changes(address);

	const displayName = getTraderDisplayName({
		address,
		name: profile?.name,
		pseudonym: profile?.pseudonym,
	});

	const firstTradeIso =
		pnlSummary?.first_trade_at && Number.isFinite(pnlSummary.first_trade_at)
			? new Date(pnlSummary.first_trade_at * 1000).toISOString()
			: undefined;
	const lastTradeIso =
		pnlSummary?.last_trade_at && Number.isFinite(pnlSummary.last_trade_at)
			? new Date(pnlSummary.last_trade_at * 1000).toISOString()
			: undefined;

	const profileJsonLd = {
		"@context": "https://schema.org",
		"@type": "ProfilePage",
		...(firstTradeIso && { datePublished: firstTradeIso }),
		...(lastTradeIso && { dateModified: lastTradeIso }),
		mainEntity: {
			"@type": "Person",
			name: displayName,
			identifier: address,
			...(profile?.bio ? { description: profile.bio } : {}),
			...(profile?.profile_image ? { image: profile.profile_image } : {}),
		},
	};

	return (
		<div className="space-y-6">
			<JsonLd data={profileJsonLd} />
			<TraderHeader
				address={address}
				displayName={displayName}
				profileImage={profile?.profile_image}
				pnlSummary={pnlSummary}
			/>
			<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
				<div className="min-w-0 space-y-6 lg:w-2/3">
					<Suspense fallback={<TraderInsightsFallback />}>
						<TraderInsightsSection
							address={address}
							displayName={displayName}
							profileImage={profile?.profile_image}
							pnlRange={pnlRange}
							pnlFillGaps={pnlFillGaps}
							firstTradeAt={pnlSummary?.first_trade_at ?? undefined}
							insightsPromise={insightsPromise}
						/>
					</Suspense>
					{/* <TraderInfo address={address} profile={profile} /> */}
				</div>

				<div className="min-w-0 space-y-6 lg:w-1/3">
					<Suspense fallback={<TraderPerformanceSummaryFallback />}>
						<TraderPerformanceSummarySection
							pnlSummary={pnlSummary}
							insightsPromise={insightsPromise}
							pnlRiskPromise={pnlRiskPromise}
							pnlChangesPromise={pnlChangesPromise}
						/>
					</Suspense>
					<Suspense fallback={<TraderDnaFallback />}>
						<TraderDnaSection
							pnlSummaryPromise={pnlSummaryPromise}
							cumulativePnlUsdPromise={cumulativePnlUsdPromise}
							address={address}
							displayName={displayName}
							profileImage={profile?.profile_image}
						/>
					</Suspense>
				</div>
			</div>
		</div>
	);
}

async function TraderDnaSection({
	pnlSummaryPromise,
	cumulativePnlUsdPromise,
	address,
	displayName,
	profileImage,
}: {
	pnlSummaryPromise: Promise<GlobalEntry | null>;
	cumulativePnlUsdPromise: Promise<number>;
	address: string;
	displayName: string;
	profileImage?: string | null;
}) {
	const [pnlSummary, cumulativePnlUsd, categoryPage] = await Promise.all([
		pnlSummaryPromise,
		cumulativePnlUsdPromise,
		getTraderCategoryPnlV3(address, { limit: 50, sort_by: "total_volume_usd", sort_direction: "desc" }),
	]);
	const categoryVolumes = categoryPage.data.map((entry) => entry.total_volume_usd ?? 0);
	return (
		<TraderDnaCard
			pnlSummary={pnlSummary}
			cumulativePnlUsd={cumulativePnlUsd}
			categoryVolumes={categoryVolumes}
			address={address}
			displayName={displayName}
			profileImage={profileImage}
		/>
	);
}

function TraderDnaFallback() {
	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<div className="mb-3 flex items-center justify-between gap-2">
				<div className="h-4 w-24 animate-pulse rounded bg-muted" />
				<div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
			</div>
			<div className="aspect-12/10 w-full animate-pulse rounded-md bg-muted" />
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
					<TraderDnaFallback />
				</div>
			</div>
		</div>
	);
}

export default function TraderPage({ params, searchParams }: Props) {
	return (
		<div className="flex w-full justify-center">
			<div className="flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 sm:gap-8 sm:px-6 sm:pb-12">
				<Suspense fallback={<TraderPageFallback />}>
					<TraderPageContent
						params={params}
						searchParams={searchParams}
					/>
				</Suspense>
			</div>
		</div>
	);
}

async function TraderPageContent({
	params,
	searchParams,
}: {
	params: Props["params"];
	searchParams: Props["searchParams"];
}) {
	await connection();

	const { address: rawAddress } = await params;
	const address = normalizeWalletAddress(rawAddress);

	if (!address) {
		notFound();
	}

	const [profile, pnlSummary] = await Promise.all([
		getTraderProfile(address),
		getTraderPnlSummary(address),
	]);

	if (!profile && !pnlSummary) {
		notFound();
	}

	const [
		{
			tab,
			openPage,
			closedPage,
			activityPage,
			categoriesPage,
			marketsPage,
			winsPage,
			lossesPage,
			pnlTimeframe,
			pnlAnchor,
			pnlFrom,
			pnlTo,
			pnlFillGaps,
			openSortBy,
			openSortDirection,
			closedSortBy,
			closedSortDirection,
			positionsCategory,
		},
		resolvedSearchParams,
		serverTimezone,
	] = await Promise.all([loadTraderSearchParams(searchParams), searchParams, getServerTimezone()]);
	const { view, range, resolution, defaultResolution, defaultRange } = parseAnalyticsParams(resolvedSearchParams, "scoped", "30d");

	const pnlRange = resolvePnlRange({
		timeframe: pnlTimeframe,
		anchor: pnlAnchor,
		from: pnlFrom,
		to: pnlTo,
		tz: serverTimezone,
	});

	const profilePromise = Promise.resolve(profile);
	const pnlSummaryPromise = Promise.resolve(pnlSummary);
	const insightsPromise = loadTraderInsights(address, pnlRange, pnlFillGaps);
	const cumulativePnlUsdPromise = getTraderCumulativePnlUsd(address);
	const tabDataPromise = loadTraderTabPanelData({
		address,
		currentTab: tab,
		openPage,
		closedPage,
		activityPage,
		categoriesPage,
		marketsPage,
		winsPage,
		lossesPage,
		openSortBy,
		openSortDirection,
		closedSortBy,
		closedSortDirection,
		category: positionsCategory ?? undefined,
	});

	const displayName = getTraderDisplayName({
		address,
		name: profile?.name,
		pseudonym: profile?.pseudonym,
	});

	return (
		<>
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
					pnlRange={pnlRange}
					pnlFillGaps={pnlFillGaps}
					profilePromise={profilePromise}
					pnlSummaryPromise={pnlSummaryPromise}
					insightsPromise={insightsPromise}
					cumulativePnlUsdPromise={cumulativePnlUsdPromise}
				/>
			</Suspense>

			<div>
				<Suspense fallback={<TraderTabPanelFallback currentTab={tab} />}>
					<TraderTabPanel tabDataPromise={tabDataPromise} />
				</Suspense>
			</div>

			<div className="mt-8">
				<AnalyticsSection
					title="Analytics"
					range={range}
					view={view}
					resolution={resolution}
					defaultResolution={defaultResolution}
					defaultRange={defaultRange}
					excludeMetrics={["uniqueTraders", "makersTakers"]}
					appendMetrics={["fees", "tradeTypes"]}
					allowedComponents={SCOPED_VOLUME_COMPONENTS}
					pathname={`/traders/${address}`}
					fetchers={{
						deltas: () => getTraderAnalyticsDeltas(address, range, resolution),
						timeseries: () => getTraderAnalyticsTimeseries(address, range, resolution),
						changes: () => getTraderAnalyticsChanges(address, range),
					}}
				/>
			</div>
		</>
	);
}

function TraderPageFallback() {
	return (
		<>
			<div className="h-4 w-48 animate-pulse rounded bg-muted" />
			<TraderOverviewFallback />
			<div className="h-64 rounded-lg bg-card" />
		</>
	);
}
