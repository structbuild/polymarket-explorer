import type { Metadata } from "next";
import type { SortDirection } from "@structbuild/sdk";
import { connection } from "next/server";
import { Suspense } from "react";

import {
	ComboAnalyticsChartsSection,
	ComboAnalyticsChartsSectionFallback,
	ComboAnalyticsControls,
	ComboAnalyticsControlsFallback,
	ComboAnalyticsKpiSection,
	ComboAnalyticsKpiSectionFallback,
	ComboAnalyticsTotalsSection,
	ComboAnalyticsTotalsSectionFallback,
} from "@/components/combos/combo-analytics-section";
import { ComboMarketsListing } from "@/components/combos/combos-listing";
import { AnchorSectionNav } from "@/components/layout/anchor-section-nav";
import { SectionAnchor } from "@/components/layout/section-anchor";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { DataTableSkeleton, type DataTableSkeletonColumn } from "@/components/ui/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import {
	isComboMarketSortBy,
	isComboMarketStatusFilter,
	isComboMarketTimeframe,
} from "@/lib/combo";
import { COMBO_TABLE_COLUMN_SIZES, comboMarketToRow } from "@/lib/combo-market-table-map";
import { getSiteUrl } from "@/lib/env";
import { buildPageMetadata, SITE_NAME } from "@/lib/site-metadata";
import { parseAnalyticsParams } from "@/lib/struct/analytics-shared";
import { getComboMarkets } from "@/lib/struct/queries/combos";

export const metadata: Metadata = buildPageMetadata({
	title: "Polymarket Combos · Parlay Odds & Volume",
	description:
		"Every Polymarket combo and parlay, sorted by volume. Track combined odds, leg outcomes, and trader activity across multi-market bets.",
	canonical: "/combos",
});

const COMBOS_NAV_ITEMS = [
	{ id: "combos-analytics", label: "Analytics" },
	{ id: "combos-markets", label: "Markets" },
	{ id: "combos-totals", label: "Totals" },
];

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined): string | undefined {
	return Array.isArray(value) ? value[0] : value;
}

export default function CombosPage({ searchParams }: Props) {
	return (
		<>
			<AnchorSectionNav items={COMBOS_NAV_ITEMS} />
			<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
				<Suspense fallback={<ComboMarketsPageFallback />}>
					<ComboMarketsContent searchParams={searchParams} />
				</Suspense>
			</div>
		</>
	);
}

async function ComboMarketsContent({ searchParams }: Props) {
	await connection();

	const params = await searchParams;
	const statusParam = readParam(params.status);
	const timeframeParam = readParam(params.timeframe);
	const sortByParam = readParam(params.sort_by);
	const sortDirParam = readParam(params.sort_dir);
	const cursorParam = readParam(params.cursor);

	const status = isComboMarketStatusFilter(statusParam) ? statusParam : null;
	const timeframe = isComboMarketTimeframe(timeframeParam) ? timeframeParam : "lifetime";
	const sortBy = isComboMarketSortBy(sortByParam) ? sortByParam : "usd_volume";
	const sortDirection: SortDirection = sortDirParam === "asc" ? "asc" : "desc";
	const cursor = cursorParam || null;

	const analytics = parseAnalyticsParams(params, "global");

	const { data, hasMore, nextCursor } = await getComboMarkets({
		timeframe,
		sortBy,
		sortDir: sortDirection,
		status,
		cursor,
	});
	const rows = data.map(comboMarketToRow);
	const siteUrl = getSiteUrl();

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `Combos — ${SITE_NAME}`,
		description: `Browse Polymarket combos and parlays sorted by volume on ${SITE_NAME}.`,
		url: new URL("/combos", siteUrl).toString(),
		mainEntity: {
			"@type": "ItemList",
			numberOfItems: rows.length,
			itemListElement: rows.map((row, index) => ({
				"@type": "ListItem",
				position: index + 1,
				name: row.title,
				url: new URL(`/combos/${row.conditionId}`, siteUrl).toString(),
			})),
		},
	};

	const analyticsKey = `${analytics.view}|${analytics.range}|${analytics.resolution}`;

	return (
		<>
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Combos", href: "/combos" },
				]}
			/>
			<JsonLd data={jsonLd} />

			<div className="mt-6 space-y-8">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="text-xl font-medium tracking-tight">Combos</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Browse Polymarket combos and parlays across multiple markets.
						</p>
					</div>
					<ComboAnalyticsControls
						view={analytics.view}
						range={analytics.range}
						resolution={analytics.resolution}
					/>
				</div>

				<SectionAnchor id="combos-analytics" className="space-y-6">
					<Suspense key={analyticsKey} fallback={<ComboAnalyticsKpiSectionFallback />}>
						<ComboAnalyticsKpiSection
							view={analytics.view}
							range={analytics.range}
							resolution={analytics.resolution}
						/>
					</Suspense>
					<Suspense
						key={`${analyticsKey}|charts`}
						fallback={<ComboAnalyticsChartsSectionFallback />}
					>
						<ComboAnalyticsChartsSection
							view={analytics.view}
							range={analytics.range}
							resolution={analytics.resolution}
						/>
					</Suspense>
				</SectionAnchor>

				<SectionAnchor id="combos-markets" className="space-y-4">
					<ComboMarketsListing
						initialRows={rows}
						initialStatus={status}
						initialTimeframe={timeframe}
						initialSortBy={sortBy}
						initialSortDirection={sortDirection}
						initialCursor={cursor}
						initialHasMore={hasMore}
						initialNextCursor={nextCursor}
					/>
				</SectionAnchor>

				<SectionAnchor id="combos-totals">
					<Suspense
						key={`${analyticsKey}|totals`}
						fallback={<ComboAnalyticsTotalsSectionFallback />}
					>
						<ComboAnalyticsTotalsSection
							view={analytics.view}
							range={analytics.range}
							resolution={analytics.resolution}
						/>
					</Suspense>
				</SectionAnchor>
			</div>
		</>
	);
}

const COMBO_SKELETON_COLUMNS: readonly DataTableSkeletonColumn[] = [
	{
		id: "combo",
		size: COMBO_TABLE_COLUMN_SIZES.combo,
		headerClassName: "w-16",
		cell: (
			<div className="flex min-w-0 items-center gap-3">
				<div className="flex shrink-0 items-center">
					<Skeleton className="size-10 shrink-0 rounded-md" />
					<Skeleton className="-ml-3 size-10 shrink-0 rounded-md ring-2 ring-card" />
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<div className="space-y-1">
						<Skeleton className="h-5 w-full" />
						<Skeleton className="h-5 w-2/3" />
					</div>
					<div className="flex items-center gap-1.5">
						<Skeleton className="h-5 w-16" />
						<Skeleton className="h-5 w-14" />
					</div>
				</div>
			</div>
		),
	},
	{
		id: "volume",
		size: COMBO_TABLE_COLUMN_SIZES.volume,
		headerClassName: "w-14",
		cell: <Skeleton className="h-5 w-12" />,
	},
	{
		id: "trades",
		size: COMBO_TABLE_COLUMN_SIZES.trades,
		headerClassName: "w-12",
		cell: <Skeleton className="h-5 w-10" />,
	},
	{
		id: "traders",
		size: COMBO_TABLE_COLUMN_SIZES.traders,
		headerClassName: "w-14",
		cell: <Skeleton className="h-5 w-10" />,
	},
	{
		id: "fees",
		size: COMBO_TABLE_COLUMN_SIZES.fees,
		headerClassName: "w-12",
		cell: <Skeleton className="h-5 w-12" />,
	},
	{
		id: "created",
		size: COMBO_TABLE_COLUMN_SIZES.created,
		headerClassName: "w-14",
		cell: <Skeleton className="h-5 w-14" />,
	},
];

function ComboMarketsPageFallback() {
	return (
		<>
			<Skeleton className="h-5 w-32" />
			<div className="mt-6 space-y-8">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<Skeleton className="h-7 w-28" />
						<Skeleton className="mt-1 h-5 w-80 max-w-full" />
					</div>
					<ComboAnalyticsControlsFallback />
				</div>
				<div className="space-y-6">
					<ComboAnalyticsKpiSectionFallback />
					<ComboAnalyticsChartsSectionFallback />
				</div>
				<div className="space-y-4">
					<DataTableSkeleton
						columns={COMBO_SKELETON_COLUMNS}
						rowCount={24}
						toolbarLeft={
							<div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex items-center gap-5">
									<Skeleton className="h-6 w-10 sm:h-7" />
									<Skeleton className="h-6 w-14 sm:h-7" />
									<Skeleton className="h-6 w-24 sm:h-7" />
								</div>
								<Skeleton className="h-8 w-52" />
							</div>
						}
					/>
				</div>
				<ComboAnalyticsTotalsSectionFallback />
			</div>
			<nav
				aria-hidden="true"
				className="mt-8 flex items-center justify-center gap-3"
			>
				<Skeleton className="h-9 w-28" />
				<Skeleton className="h-9 w-28" />
			</nav>
		</>
	);
}
