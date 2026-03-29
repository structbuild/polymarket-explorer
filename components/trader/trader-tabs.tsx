"use client"

import type { components } from "@structbuild/sdk"
import { useCallback, useState, useTransition } from "react"
import { useQueryStates } from "nuqs"

import { traderSearchParamParsers } from "@/lib/trader-search-params"
import { maxTraderPageNumber, type TraderTab } from "@/lib/trader-search-params-shared"
import type { PaginatedResource } from "@/lib/struct/types"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import TraderActivity from "./activity"
import TraderPositions from "./positions"

type Trade = components["schemas"]["PredictionTradeResponse"]
type TraderOutcomePnlEntry = components["schemas"]["TraderOutcomePnlEntry"]

type Props = {
	openPage: number
	closedPage: number
	activityPage: number
	openPositions: PaginatedResource<TraderOutcomePnlEntry, number>
	closedPositions: PaginatedResource<TraderOutcomePnlEntry, number>
	trades: PaginatedResource<Trade, number>
}

export function TraderTabs({
	openPage,
	closedPage,
	activityPage,
	openPositions,
	closedPositions,
	trades,
}: Props) {
	const [toolbarEl, setToolbarEl] = useState<HTMLDivElement | null>(null)
	const [isPending, startTransition] = useTransition()
	const toolbarRef = useCallback((node: HTMLDivElement | null) => setToolbarEl(node), [])
	const [{ tab: currentTab }, setSearchParams] = useQueryStates(traderSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: false,
		startTransition,
	})

	const setTab = useCallback((nextTab: TraderTab) => {
		if (nextTab === currentTab) {
			return
		}

		void setSearchParams({ tab: nextTab }, { shallow: true })
	}, [currentTab, setSearchParams])

	const setPage = useCallback((key: "openPage" | "closedPage" | "activityPage", nextPage: number) => {
		void setSearchParams({ [key]: Math.min(Math.max(nextPage, 1), maxTraderPageNumber) })
	}, [setSearchParams])

	return (
		<Tabs value={currentTab} onValueChange={(value) => setTab(value as TraderTab)}>
			<div className="mb-1 flex items-center gap-5">
				<TabsList
					variant="text"
					className="flex w-full justify-start gap-5 overflow-x-auto pb-2 whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				>
					<TabsTrigger className="text-base! sm:text-xl!" value="active">
						Open
					</TabsTrigger>
					<TabsTrigger className="text-base! sm:text-xl!" value="closed">
						Closed
					</TabsTrigger>
					<TabsTrigger className="text-base! sm:text-xl!" value="activity">
						Activity
					</TabsTrigger>
				</TabsList>
				<div ref={toolbarRef} className="shrink-0 pb-2" />
			</div>
			{currentTab === "active" ? (
				<TabsContent value="active">
					<TraderPositions
						page={openPositions}
						pageNumber={openPage}
						status="open"
						toolbarPortal={toolbarEl}
						isLoading={isPending}
						onNextPage={() => setPage("openPage", openPage + 1)}
						onPreviousPage={() => setPage("openPage", openPage - 1)}
					/>
				</TabsContent>
			) : null}
			{currentTab === "closed" ? (
				<TabsContent value="closed">
					<TraderPositions
						page={closedPositions}
						pageNumber={closedPage}
						status="closed"
						toolbarPortal={toolbarEl}
						isLoading={isPending}
						onNextPage={() => setPage("closedPage", closedPage + 1)}
						onPreviousPage={() => setPage("closedPage", closedPage - 1)}
					/>
				</TabsContent>
			) : null}
			{currentTab === "activity" ? (
				<TabsContent value="activity">
					<TraderActivity
						page={trades}
						pageNumber={activityPage}
						toolbarPortal={toolbarEl}
						isLoading={isPending}
						onNextPage={() => setPage("activityPage", activityPage + 1)}
						onPreviousPage={() => setPage("activityPage", activityPage - 1)}
					/>
				</TabsContent>
			) : null}
		</Tabs>
	)
}
