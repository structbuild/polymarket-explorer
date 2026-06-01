"use client"

import type { CategoryEntry, MarketEntry, PolymarketCategory, PositionEntry } from "@structbuild/sdk"
import { useCallback, useRef, useState, useTransition } from "react"

import { getTraderTabPageAction } from "@/app/actions"
import type {
	TraderExitMode,
	TraderPositionSortBy,
	TraderSortDirection,
	TraderTab,
} from "@/lib/trader-search-params-shared"
import {
	rankedPositionSortBy,
	rankedPositionSortDirection,
} from "@/lib/trader-search-params-shared"
import type { PaginatedResource } from "@/lib/struct/types"
import type { TradeRow } from "./types"
import TraderActivity from "./activity"
import TraderCategories from "./categories"
import TraderMarkets from "./markets"
import TraderPositions from "./positions"
import { TraderTabs } from "./trader-tabs"

type TraderTabPanelClientProps =
	| {
			kind: "positions"
			address: string
			status: "open" | "closed"
			pageNumber: number
			sortBy: TraderPositionSortBy
			sortDirection: TraderSortDirection
			category?: PolymarketCategory
			page: PaginatedResource<PositionEntry, number>
	  }
	| {
			kind: "activity"
			address: string
			pageNumber: number
			page: PaginatedResource<TradeRow, number>
	  }
	| {
			kind: "categories"
			address: string
			pageNumber: number
			page: PaginatedResource<CategoryEntry, number>
	  }
	| {
			kind: "markets"
			address: string
			pageNumber: number
			page: PaginatedResource<MarketEntry, number>
	  }
	| {
			kind: "ranked-positions"
			address: string
			mode: TraderExitMode
			pageNumber: number
			page: PaginatedResource<PositionEntry, number>
	  }

function tabForPanelData(props: TraderTabPanelClientProps): TraderTab {
	if (props.kind === "activity") return "activity"
	if (props.kind === "categories") return "categories"
	if (props.kind === "markets") return "markets"
	if (props.kind === "ranked-positions") return props.mode

	return props.status === "closed" ? "closed" : "active"
}

function replaceTraderTabUrl(tab: TraderTab) {
	const params = new URLSearchParams(window.location.search)

	if (tab === "active") {
		params.delete("tab")
	} else {
		params.set("tab", tab)
	}

	const search = params.toString()
	const href = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`
	window.history.pushState(window.history.state, "", href)

	return search
}

export function TraderTabPanelClient(props: TraderTabPanelClientProps) {
	const [isPending, startTransition] = useTransition()
	const requestIdRef = useRef(0)
	const [panelState, setPanelState] = useState(() => ({
		sourceProps: props,
		data: props,
	}))
	const currentData = panelState.sourceProps === props ? panelState.data : props
	const currentTab = tabForPanelData(currentData)

	const handleTabChange = useCallback((nextTab: TraderTab) => {
		if (nextTab === currentTab) {
			return
		}

		const requestId = requestIdRef.current + 1
		requestIdRef.current = requestId
		const search = replaceTraderTabUrl(nextTab)

		startTransition(async () => {
			const data = await getTraderTabPageAction({
				address: currentData.address,
				tab: nextTab,
				search,
			})

			if (requestIdRef.current === requestId) {
				setPanelState({
					sourceProps: props,
					data,
				})
			}
		})
	}, [currentData.address, currentTab, props])

	const handleRefresh = useCallback(async () => {
		const requestId = requestIdRef.current + 1
		requestIdRef.current = requestId

		const data = await getTraderTabPageAction({
			address: currentData.address,
			tab: currentTab,
			search: window.location.search,
		})

		if (requestIdRef.current === requestId) {
			setPanelState({
				sourceProps: props,
				data,
			})
		}
	}, [currentData.address, currentTab, props])

	const tabs = (
		<TraderTabs
			value={currentTab}
			onValueChange={handleTabChange}
			pending={isPending}
		/>
	)

	if (currentData.kind === "activity") {
		return (
			<TraderActivity
				address={currentData.address}
				page={currentData.page}
				pageNumber={currentData.pageNumber}
				tabs={tabs}
				onRefresh={handleRefresh}
			/>
		)
	}

	if (currentData.kind === "categories") {
		return (
			<TraderCategories
				address={currentData.address}
				page={currentData.page}
				pageNumber={currentData.pageNumber}
				tabs={tabs}
				onRefresh={handleRefresh}
			/>
		)
	}

	if (currentData.kind === "markets") {
		return (
			<TraderMarkets
				address={currentData.address}
				page={currentData.page}
				pageNumber={currentData.pageNumber}
				tabs={tabs}
				onRefresh={handleRefresh}
			/>
		)
	}

	if (currentData.kind === "ranked-positions") {
		return (
			<TraderPositions
				address={currentData.address}
				page={currentData.page}
				pageNumber={currentData.pageNumber}
				status="closed"
				sortBy={rankedPositionSortBy}
				sortDirection={rankedPositionSortDirection[currentData.mode]}
				ranked={currentData.mode}
				tabs={tabs}
				onRefresh={handleRefresh}
			/>
		)
	}

	return (
		<TraderPositions
			address={currentData.address}
			page={currentData.page}
			pageNumber={currentData.pageNumber}
			status={currentData.status}
			sortBy={currentData.sortBy}
			sortDirection={currentData.sortDirection}
			category={currentData.category}
			tabs={tabs}
			onRefresh={handleRefresh}
		/>
	)
}
