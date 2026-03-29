import type { TraderTab } from "@/lib/trader-search-params-shared"
import {
	defaultTraderTablePageSize,
	getTraderPositionsPage,
	getTraderTradesPage,
} from "@/lib/struct/queries"

import { TraderTabPanelClient } from "./trader-tab-panel-client"
import { TraderTabs } from "./trader-tabs"

type TraderTabPanelData =
	| {
			kind: "positions"
			status: "open" | "closed"
			pageNumber: number
			page: Awaited<ReturnType<typeof getTraderPositionsPage>>
	  }
	| {
			kind: "activity"
			pageNumber: number
			page: Awaited<ReturnType<typeof getTraderTradesPage>>
	  }

type LoadTraderTabPanelDataProps = {
	address: string
	currentTab: TraderTab
	openPage: number
	closedPage: number
	activityPage: number
}

export function loadTraderTabPanelData({
	address,
	currentTab,
	openPage,
	closedPage,
	activityPage,
}: LoadTraderTabPanelDataProps): Promise<TraderTabPanelData> {
	const pageSize = defaultTraderTablePageSize

	switch (currentTab) {
		case "closed":
			return getTraderPositionsPage(address, "closed", {
				limit: pageSize,
				offset: (closedPage - 1) * pageSize,
			}).then((page) => ({
				kind: "positions" as const,
				status: "closed" as const,
				pageNumber: closedPage,
				page,
			}))
		case "activity":
			return getTraderTradesPage(address, {
				limit: pageSize,
				offset: (activityPage - 1) * pageSize,
				sort_desc: true,
			}).then((page) => ({
				kind: "activity" as const,
				pageNumber: activityPage,
				page,
			}))
		case "active":
		default:
			return getTraderPositionsPage(address, "open", {
				limit: pageSize,
				offset: (openPage - 1) * pageSize,
			}).then((page) => ({
				kind: "positions" as const,
				status: "open" as const,
				pageNumber: openPage,
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
