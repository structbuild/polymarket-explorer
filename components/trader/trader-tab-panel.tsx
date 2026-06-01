import type { PolymarketCategory } from "@structbuild/sdk"

import type {
	TraderExitMode,
	TraderPositionSortBy,
	TraderSortDirection,
	TraderTab,
} from "@/lib/trader-search-params-shared"
import {
	exitModeForTab,
	rankedPositionSortBy,
	rankedPositionSortDirection,
} from "@/lib/trader-search-params-shared"
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
			page: Awaited<ReturnType<typeof getTraderCategoriesPage>>
	  }
	| {
			kind: "markets"
			address: string
			pageNumber: number
			page: Awaited<ReturnType<typeof getTraderMarketsPage>>
	  }
	| {
			kind: "ranked-positions"
			address: string
			mode: TraderExitMode
			pageNumber: number
			page: Awaited<ReturnType<typeof getTraderPositionsPage>>
	  }

type LoadTraderTabPanelDataProps = {
	address: string
	currentTab: TraderTab
	openPage: number
	closedPage: number
	activityPage: number
	categoriesPage: number
	marketsPage: number
	winsPage: number
	lossesPage: number
	openSortBy: TraderPositionSortBy
	openSortDirection: TraderSortDirection
	closedSortBy: TraderPositionSortBy
	closedSortDirection: TraderSortDirection
	category?: PolymarketCategory
}

export function loadTraderTabPanelData({
	address,
	currentTab,
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
	category,
}: LoadTraderTabPanelDataProps): Promise<TraderTabPanelData> {
	const pageSize = defaultTraderTablePageSize
	const categoryOption = category ? { category } : {}

	const rankedMode = exitModeForTab(currentTab)
	if (rankedMode) {
		const rankedPageNumber = rankedMode === "wins" ? winsPage : lossesPage
		return getTraderPositionsPage(address, "closed", {
			limit: pageSize,
			offset: (rankedPageNumber - 1) * pageSize,
			sort_by: rankedPositionSortBy,
			sort_direction: rankedPositionSortDirection[rankedMode],
		}).then((page) => ({
			kind: "ranked-positions" as const,
			address,
			mode: rankedMode,
			pageNumber: rankedPageNumber,
			page,
		}))
	}

	switch (currentTab) {
		case "closed":
			return getTraderPositionsPage(address, "closed", {
				limit: pageSize,
				offset: (closedPage - 1) * pageSize,
				sort_by: closedSortBy,
				sort_direction: closedSortDirection,
				...categoryOption,
			}).then((page) => ({
				kind: "positions" as const,
				address,
				status: "closed" as const,
				pageNumber: closedPage,
				sortBy: closedSortBy,
				sortDirection: closedSortDirection,
				category,
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
			}).then((page) => ({
				kind: "categories" as const,
				address,
				pageNumber: categoriesPage,
				page,
			}))
		case "markets":
			return getTraderMarketsPage(address, {
				limit: pageSize,
				offset: (marketsPage - 1) * pageSize,
			}).then((page) => ({
				kind: "markets" as const,
				address,
				pageNumber: marketsPage,
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
			}).then((page) => ({
				kind: "positions" as const,
				address,
				status: "open" as const,
				pageNumber: openPage,
				sortBy: openSortBy,
				sortDirection: openSortDirection,
				category,
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
					: currentTab === "wins"
				? "Loading best wins"
				: currentTab === "losses"
					? "Loading worst losses"
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
