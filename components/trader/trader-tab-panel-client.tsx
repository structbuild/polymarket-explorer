"use client"

import type { CategoryEntry, MarketEntry, PolymarketCategory, PositionEntry } from "@structbuild/sdk"
import type { ReactNode } from "react"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"

import { getTraderTabPageAction } from "@/app/actions"
import { useTabBridge } from "@/components/layout/tab-bridge"
import type {
	TraderCategorySortBy,
	TraderComboFilter,
	TraderComboSortBy,
	TraderComboStatusFilter,
	TraderMarketSortBy,
	TraderPositionSortBy,
	TraderSortDirection,
	TraderTab,
} from "@/lib/trader-search-params-shared"
import type { TraderComboEntry } from "@/lib/struct/queries/combos"
import type { PaginatedResource } from "@/lib/struct/types"
import type { TradeRow } from "./types"
import TraderActivity from "./activity"
import TraderCategories from "./categories"
import TraderCombos from "./combos"
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
			combo?: TraderComboFilter
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
			sortBy: TraderCategorySortBy
			sortDirection: TraderSortDirection
			page: PaginatedResource<CategoryEntry, number>
	  }
	| {
			kind: "markets"
			address: string
			pageNumber: number
			sortBy: TraderMarketSortBy
			sortDirection: TraderSortDirection
			page: PaginatedResource<MarketEntry, number>
	  }
	| {
			kind: "combos"
			address: string
			pageNumber: number
			sortBy: TraderComboSortBy
			sortDirection: TraderSortDirection
			status: TraderComboStatusFilter
			page: PaginatedResource<TraderComboEntry, number>
	  }

function tabForPanelData(props: TraderTabPanelClientProps): TraderTab {
	if (props.kind === "activity") return "activity"
	if (props.kind === "categories") return "categories"
	if (props.kind === "markets") return "markets"
	if (props.kind === "combos") return "combos"

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
	const bridge = useTabBridge()
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

	useEffect(() => {
		if (!bridge) return
		return bridge.registerHandler("trader-positions", handleTabChange as (tab: string) => void)
	}, [bridge, handleTabChange])

	useEffect(() => {
		bridge?.reportActive("trader-positions", currentTab)
	}, [bridge, currentTab])

	const tabs = (
		<TraderTabs
			value={currentTab}
			onValueChange={handleTabChange}
			pending={isPending}
		/>
	)

	let content: ReactNode

	if (currentData.kind === "activity") {
		content = (
			<TraderActivity
				address={currentData.address}
				page={currentData.page}
				pageNumber={currentData.pageNumber}
				tabs={tabs}
				onRefresh={handleRefresh}
			/>
		)
	} else if (currentData.kind === "categories") {
		content = (
			<TraderCategories
				address={currentData.address}
				page={currentData.page}
				pageNumber={currentData.pageNumber}
				sortBy={currentData.sortBy}
				sortDirection={currentData.sortDirection}
				tabs={tabs}
				onRefresh={handleRefresh}
			/>
		)
	} else if (currentData.kind === "markets") {
		content = (
			<TraderMarkets
				address={currentData.address}
				page={currentData.page}
				pageNumber={currentData.pageNumber}
				sortBy={currentData.sortBy}
				sortDirection={currentData.sortDirection}
				tabs={tabs}
				onRefresh={handleRefresh}
			/>
		)
	} else if (currentData.kind === "combos") {
		content = (
			<TraderCombos
				address={currentData.address}
				page={currentData.page}
				pageNumber={currentData.pageNumber}
				sortBy={currentData.sortBy}
				sortDirection={currentData.sortDirection}
				status={currentData.status}
				tabs={tabs}
				onRefresh={handleRefresh}
			/>
		)
	} else {
		content = (
			<TraderPositions
				address={currentData.address}
				page={currentData.page}
				pageNumber={currentData.pageNumber}
				status={currentData.status}
				sortBy={currentData.sortBy}
				sortDirection={currentData.sortDirection}
				category={currentData.category}
				combo={currentData.combo}
				tabs={tabs}
				onRefresh={handleRefresh}
			/>
		)
	}

	return content
}
