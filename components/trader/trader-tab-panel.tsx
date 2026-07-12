import type { PolymarketCategory } from "@structbuild/sdk"

import type {
	TraderCategorySortBy,
	TraderComboFilter,
	TraderMarketSortBy,
	TraderPositionSortBy,
	TraderSortDirection,
	TraderTab,
} from "@/lib/trader-search-params-shared"
import { comboFilterToParam } from "@/lib/trader-search-params-shared"
import {
	defaultTraderTablePageSize,
	getTraderCategoriesPage,
	getTraderMarketsPage,
	getTraderPositionsPage,
	getTraderTradesPage,
} from "@/lib/struct/queries"

import { TraderTabPanelClient } from "./trader-tab-panel-client"
import { TraderTabs } from "./trader-tabs"

type TraderTabPanelData =
	| {
			kind: "positions"
			address: string
			status: "open" | "closed"
			pageNumber: number
			sortBy: TraderPositionSortBy
			sortDirection: TraderSortDirection
			category?: PolymarketCategory
			combo?: TraderComboFilter
			page: Awaited<ReturnType<typeof getTraderPositionsPage>>
	  }
	| {
			kind: "activity"
			address: string
			pageNumber: number
			page: Awaited<ReturnType<typeof getTraderTradesPage>>
	  }
	| {
			kind: "categories"
			address: string
			pageNumber: number
			sortBy: TraderCategorySortBy
			sortDirection: TraderSortDirection
			page: Awaited<ReturnType<typeof getTraderCategoriesPage>>
	  }
	| {
			kind: "markets"
			address: string
			pageNumber: number
			sortBy: TraderMarketSortBy
			sortDirection: TraderSortDirection
			page: Awaited<ReturnType<typeof getTraderMarketsPage>>
	  }

type LoadTraderTabPanelDataProps = {
	address: string
	currentTab: TraderTab
	openPage: number
	closedPage: number
	activityPage: number
	categoriesPage: number
	marketsPage: number
	openSortBy: TraderPositionSortBy
	openSortDirection: TraderSortDirection
	closedSortBy: TraderPositionSortBy
	closedSortDirection: TraderSortDirection
	categoriesSortBy: TraderCategorySortBy
	categoriesSortDirection: TraderSortDirection
	marketsSortBy: TraderMarketSortBy
	marketsSortDirection: TraderSortDirection
	category?: PolymarketCategory
	combo?: TraderComboFilter
}

export function loadTraderTabPanelData({
	address,
	currentTab,
	openPage,
	closedPage,
	activityPage,
	categoriesPage,
	marketsPage,
	openSortBy,
	openSortDirection,
	closedSortBy,
	closedSortDirection,
	categoriesSortBy,
	categoriesSortDirection,
	marketsSortBy,
	marketsSortDirection,
	category,
	combo,
}: LoadTraderTabPanelDataProps): Promise<TraderTabPanelData> {
	const pageSize = defaultTraderTablePageSize
	const categoryOption = category ? { category } : {}
	const comboParam = comboFilterToParam(combo)
	const comboOption = comboParam !== undefined ? { combo: comboParam } : {}

	switch (currentTab) {
		case "closed":
			return getTraderPositionsPage(address, "closed", {
				limit: pageSize,
				offset: (closedPage - 1) * pageSize,
				sort_by: closedSortBy,
				sort_direction: closedSortDirection,
				...categoryOption,
				...comboOption,
			}).then((page) => ({
				kind: "positions" as const,
				address,
				status: "closed" as const,
				pageNumber: closedPage,
				sortBy: closedSortBy,
				sortDirection: closedSortDirection,
				category,
				combo,
				page,
			}))
		case "activity":
			return getTraderTradesPage(address, {
				limit: pageSize,
				offset: (activityPage - 1) * pageSize,
				sort_desc: true,
			}).then((page) => ({
				kind: "activity" as const,
				address,
				pageNumber: activityPage,
				page,
			}))
		case "categories":
			return getTraderCategoriesPage(address, {
				limit: pageSize,
				offset: (categoriesPage - 1) * pageSize,
				sort_by: categoriesSortBy,
				sort_direction: categoriesSortDirection,
			}).then((page) => ({
				kind: "categories" as const,
				address,
				pageNumber: categoriesPage,
				sortBy: categoriesSortBy,
				sortDirection: categoriesSortDirection,
				page,
			}))
		case "markets":
			return getTraderMarketsPage(address, {
				limit: pageSize,
				offset: (marketsPage - 1) * pageSize,
				sort_by: marketsSortBy,
				sort_direction: marketsSortDirection,
			}).then((page) => ({
				kind: "markets" as const,
				address,
				pageNumber: marketsPage,
				sortBy: marketsSortBy,
				sortDirection: marketsSortDirection,
				page,
			}))
		case "active":
		default:
			return getTraderPositionsPage(address, "open", {
				limit: pageSize,
				offset: (openPage - 1) * pageSize,
				sort_by: openSortBy,
				sort_direction: openSortDirection,
				...categoryOption,
				...comboOption,
			}).then((page) => ({
				kind: "positions" as const,
				address,
				status: "open" as const,
				pageNumber: openPage,
				sortBy: openSortBy,
				sortDirection: openSortDirection,
				category,
				combo,
				page,
			}))
	}
}

export async function TraderTabPanel({
	tabDataPromise,
}: {
	tabDataPromise: Promise<TraderTabPanelData>
}) {
	const tabData = await tabDataPromise
	return <TraderTabPanelClient {...tabData} />
}

export function TraderTabPanelFallback({
	currentTab,
}: {
	currentTab: TraderTab
}) {
	const label =
		currentTab === "activity"
			? "Loading activity"
			: currentTab === "categories"
				? "Loading categories"
				: currentTab === "markets"
					? "Loading markets"
					: currentTab === "closed"
						? "Loading closed positions"
						: "Loading open positions"

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-4">
				<div className="min-w-0 flex-1">
					<TraderTabs />
				</div>
				<div className="shrink-0">
					<div className="h-7 w-24 animate-pulse rounded-sm bg-muted" />
				</div>
			</div>
			<div className="overflow-hidden rounded-lg bg-card">
				<div className="grid gap-px bg-border">
					{Array.from({ length: 6 }, (_, index) => (
						<div
							key={index}
							className="flex items-center gap-4 bg-card px-4 py-3"
						>
							<div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
							<div className="min-w-0 flex-1 space-y-2">
								<div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
								<div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
							</div>
							<div className="h-4 w-24 animate-pulse rounded bg-muted" />
							<div className="hidden h-4 w-16 animate-pulse rounded bg-muted md:block" />
						</div>
					))}
				</div>
			</div>
			<p className="px-1 text-sm text-muted-foreground">{label}...</p>
		</div>
	)
}
