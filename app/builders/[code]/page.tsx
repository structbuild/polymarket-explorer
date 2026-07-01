import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import type { BuilderTimeframe } from "@structbuild/sdk";

import { AnalyticsSection } from "@/components/analytics/analytics-section";
import { BuilderConcentrationCard } from "@/components/builders/builder-concentration-card";
import { BuilderFeeHistory } from "@/components/builders/builder-fee-history";
import {
	BuilderRecentTrades,
	BuilderRecentTradesFallback,
} from "@/components/builders/builder-recent-trades";
import { BuilderRetentionHeatmap } from "@/components/builders/builder-retention-heatmap";
import { BuilderStatsRow } from "@/components/builders/builder-stats-row";
import { BuilderTagBreakdown } from "@/components/builders/builder-tag-breakdown";
import { BuilderPageHeader } from "@/components/builders/builder-page-header";
import { BuilderTopTraders } from "@/components/builders/builder-top-traders";
import { AnchorSectionNav } from "@/components/layout/anchor-section-nav";
import { SectionAnchor } from "@/components/layout/section-anchor";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import {
	builderOgImageSize,
	getBuilderOgImageAlt,
	getBuilderOgImageUrl,
	getBuilderPageDescription,
	getBuilderPageTitle,
	getBuilderSocialTitle,
} from "@/lib/builder-open-graph";
import { getBuilderDisplayName } from "@/lib/builder-display-name";
import { loadBuilderSearchParams } from "@/lib/builder-search-params.server";
import { getSiteUrl } from "@/lib/env";
import { buildPageMetadata, SITE_NAME } from "@/lib/site-metadata";
import { formatBuilderCodeDisplay } from "@/lib/utils";
import {
	type AnalyticsRange,
	parseAnalyticsParams,
} from "@/lib/struct/analytics-shared";
import {
	getBuilderByCode,
	getBuilderConcentration,
	getBuilderFees,
	getBuilderFeesHistory,
	getBuilderRetention,
	getBuilderTags,
	getBuilderTopTraders,
} from "@/lib/struct/builder-queries";

const BUILDER_ANALYTICS_APPEND_METRICS = ["builderFees", "newUsers"] as const;
const BUILDER_ANALYTICS_METRIC_PLACEMENTS = [
	{ metric: "builderFees", after: "volume" },
	{ metric: "newUsers", after: "builderFees" },
	{ metric: "uniqueTraders", after: "newUsers" },
	{ metric: "tradeTypes", after: "uniqueTraders" },
	{ metric: "avgTradeSize", after: "tradeTypes" },
	{ metric: "fees", after: "avgTradeSize" },
	{ metric: "yesNo", after: "fees" },
	{ metric: "yesNoCount", after: "yesNo" },
	{ metric: "shares", after: "yesNoCount" },
	{ metric: "buyDistribution", after: "shares" },
] as const;

const BUILDER_NAV_ITEMS = [
	{ id: "builder-overview", label: "Overview" },
	{ id: "builder-analytics", label: "Analytics" },
	{ id: "builder-breakdown", label: "Breakdown" },
	{ id: "builder-top-traders", label: "Top Traders" },
	{ id: "builder-history", label: "History" },
	{ id: "builder-trades", label: "Trades" },
];

type Props = {
	params: Promise<{ code: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function rangeToBuilderTimeframe(range: AnalyticsRange): BuilderTimeframe {
	return range === "all" ? "lifetime" : range;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { code } = await params;
	const builder = await getBuilderByCode(code);

	if (!builder) {
		return {};
	}

	const isEmpty = builder.volume_usd === 0 && builder.txn_count === 0;
	const builderCode = builder.builder_code?.trim() || code;
	const codeLabel = formatBuilderCodeDisplay(builderCode);
	const displayName = getBuilderDisplayName(builderCode, builder.metadata);
	const title = getBuilderPageTitle(displayName, builder);
	const socialTitle = getBuilderSocialTitle(displayName, builder);
	const description = getBuilderPageDescription(displayName, codeLabel, builder);
	const ogImage = getBuilderOgImageUrl(code);
	const ogAlt = getBuilderOgImageAlt(displayName);

	return buildPageMetadata({
		title,
		description,
		canonical: `/builders/${encodeURIComponent(code)}`,
		openGraph: {
			title: socialTitle,
			type: "profile",
			images: [
				{
					url: ogImage,
					width: builderOgImageSize.width,
					height: builderOgImageSize.height,
					alt: ogAlt,
				},
			],
		},
		twitter: {
			title: socialTitle,
			images: [ogImage],
		},
		...(isEmpty && { robots: { index: false, follow: true } }),
	});
}

export default function BuilderPage({ params, searchParams }: Props) {
	return (
		<>
			<AnchorSectionNav items={BUILDER_NAV_ITEMS} />
			<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
				<Suspense fallback={<BuilderPageFallback />}>
					<BuilderPageContent params={params} searchParams={searchParams} />
				</Suspense>
			</div>
		</>
	);
}

async function BuilderPageContent({
	params,
	searchParams,
}: {
	params: Props["params"];
	searchParams: Props["searchParams"];
}) {
	await connection();

	const [{ code }, { tradesPage }, resolvedSearchParams] = await Promise.all([
		params,
		loadBuilderSearchParams(searchParams),
		searchParams,
	]);
	const analyticsParams = parseAnalyticsParams(resolvedSearchParams, "scoped", "30d");
	const { view, range, resolution, defaultResolution, defaultRange } = analyticsParams;
	const builderTimeframe = rangeToBuilderTimeframe(range);
	const builder = await getBuilderByCode(code, builderTimeframe);

	if (!builder) {
		notFound();
	}

	const [fees, concentration, retention, topTraders, tagBreakdown, feeHistory] =
		await Promise.all([
			getBuilderFees(code),
			getBuilderConcentration(code, builderTimeframe),
			getBuilderRetention(code),
			getBuilderTopTraders(code, "volume", builderTimeframe, 25),
			getBuilderTags(code, "volume", builderTimeframe, 12),
			getBuilderFeesHistory(code, 25),
		]);

	const siteUrl = getSiteUrl();
	const builderCode = builder.builder_code?.trim() || code;
	const codeLabel = formatBuilderCodeDisplay(builderCode);
	const pageHeaderMetadata = builder.metadata
		? { builder_code: builderCode, ...builder.metadata }
		: null;
	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "Thing",
		name: `${codeLabel} — ${SITE_NAME}`,
		description: `Polymarket builder ${codeLabel} routing stats and analytics.`,
		url: new URL(`/builders/${encodeURIComponent(builderCode)}`, siteUrl).toString(),
	};

	return (
		<>
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Builders", href: "/builders" },
					{ label: codeLabel, href: `/builders/${encodeURIComponent(builderCode)}` },
				]}
			/>
			<JsonLd data={jsonLd} />

			<div className="mt-6 space-y-6">
				<SectionAnchor id="builder-overview">
					<div className="flex flex-col gap-6 mb-10">
						<BuilderPageHeader builderCode={builderCode} metadata={pageHeaderMetadata} />
					</div>
				</SectionAnchor>

				<BuilderStatsRow row={builder} fees={fees} />
				<SectionAnchor id="builder-analytics">
					<AnalyticsSection
						title="Analytics"
						range={range}
						view={view}
						resolution={resolution}
						defaultResolution={defaultResolution}
						defaultRange={defaultRange}
						pathname={`/builders/${encodeURIComponent(builderCode)}`}
						allowedComponents={["buy", "sell"]}
						showKpis={false}
						source={{ kind: "builder", code: builderCode }}
						subject={{
							type: "Builder",
							label: getBuilderDisplayName(builderCode, builder.metadata),
							image: builder.metadata?.icon_url ?? null,
						}}
						appendMetrics={BUILDER_ANALYTICS_APPEND_METRICS}
						metricPlacements={BUILDER_ANALYTICS_METRIC_PLACEMENTS}
					/>
				</SectionAnchor>

				<SectionAnchor id="builder-breakdown">
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<BuilderConcentrationCard data={concentration} />
						<BuilderTagBreakdown rows={tagBreakdown} builderCode={builderCode} />
					</div>
				</SectionAnchor>

				<SectionAnchor id="builder-top-traders">
					<BuilderTopTraders rows={topTraders} />
				</SectionAnchor>

				<SectionAnchor id="builder-history">
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<BuilderRetentionHeatmap rows={retention} />
						<BuilderFeeHistory entries={feeHistory} />
					</div>
				</SectionAnchor>

				<SectionAnchor id="builder-trades">
					<Suspense fallback={<BuilderRecentTradesFallback />}>
						<BuilderRecentTrades builderCode={builderCode} pageNumber={tradesPage} />
					</Suspense>
				</SectionAnchor>
			</div>
		</>
	);
}

function BuilderPageBreadcrumbsSkeleton() {
	return (
		<nav
			aria-hidden
			className="-mx-4 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
		>
			<ol className="flex w-max min-w-0 flex-nowrap items-center gap-1.5 text-sm">
				<li className="h-4 w-10 animate-pulse rounded bg-muted" />
				<li className="text-muted-foreground/50" aria-hidden>
					/
				</li>
				<li className="h-4 w-16 animate-pulse rounded bg-muted" />
				<li className="text-muted-foreground/50" aria-hidden>
					/
				</li>
				<li className="h-4 w-24 animate-pulse rounded bg-muted" />
			</ol>
		</nav>
	);
}

function BuilderPageFallback() {
	return (
		<>
			<BuilderPageBreadcrumbsSkeleton />
			<div className="mt-6 space-y-6">
				<div className="flex flex-col gap-6 mb-10">
					<div className="flex min-w-0 w-full flex-col gap-4 overflow-hidden lg:flex-row lg:items-center lg:justify-between">
						<div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
							<div className="size-16 shrink-0 animate-pulse rounded-md bg-muted sm:size-24" />
							<div className="min-w-0 flex-1 space-y-3">
								<div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
									<div className="h-8 w-48 max-w-full animate-pulse rounded bg-muted" />
									<div className="h-8 w-28 max-w-full animate-pulse rounded-md bg-muted" />
								</div>
								<div className="h-4 w-full max-w-2xl animate-pulse rounded bg-muted" />
								<div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted opacity-80" />
							</div>
						</div>
						<div className="h-10 w-full animate-pulse rounded-md bg-muted sm:w-36 sm:shrink-0 lg:ml-4" />
					</div>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div className="h-7 w-28 animate-pulse rounded bg-muted" />
					<div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
						<div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
						<div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
						<div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{Array.from({ length: 8 }, (_, index) => (
						<div key={index} className="space-y-2 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
							<div className="h-3 w-14 animate-pulse rounded bg-muted" />
							<div className="h-6 w-20 animate-pulse rounded bg-muted" />
						</div>
					))}
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<div className="lg:col-span-2 rounded-lg bg-card p-4 ring-1 ring-foreground/10 sm:p-6">
						<div className="mb-4 h-4 w-36 animate-pulse rounded bg-muted" />
						<div className="h-[240px] animate-pulse rounded-md bg-muted/60 sm:h-[300px]" />
					</div>
					{Array.from({ length: 3 }, (_, index) => (
						<div
							key={index}
							className="rounded-lg bg-card p-4 ring-1 ring-foreground/10 sm:p-6"
						>
							<div className="mb-4 h-4 w-32 animate-pulse rounded bg-muted" />
							<div className="h-[240px] animate-pulse rounded-md bg-muted/60 sm:h-[260px]" />
						</div>
					))}
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					{Array.from({ length: 2 }, (_, index) => (
						<div
							key={index}
							className="min-h-48 rounded-lg bg-card p-4 ring-1 ring-foreground/10 sm:p-6"
						>
							<div className="mb-4 h-4 w-40 animate-pulse rounded bg-muted" />
							<div className="h-32 animate-pulse rounded-md bg-muted/60" />
						</div>
					))}
				</div>

				<div className="rounded-lg bg-card p-4 ring-1 ring-foreground/10 sm:p-6">
					<div className="mb-4 h-4 w-28 animate-pulse rounded bg-muted" />
					<div className="space-y-2">
						<div className="h-4 w-full animate-pulse rounded bg-muted/80" />
						{Array.from({ length: 6 }, (_, index) => (
							<div key={index} className="h-10 animate-pulse rounded-md bg-muted/50" />
						))}
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					{Array.from({ length: 2 }, (_, index) => (
						<div
							key={index}
							className="min-h-56 rounded-lg bg-card p-4 ring-1 ring-foreground/10 sm:p-6"
						>
							<div className="mb-4 h-4 w-32 animate-pulse rounded bg-muted" />
							<div className="h-40 animate-pulse rounded-md bg-muted/60 sm:h-44" />
						</div>
					))}
				</div>

				<BuilderRecentTradesFallback />
			</div>
		</>
	);
}
