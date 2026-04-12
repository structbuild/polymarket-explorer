"use client"

import type { TraderOutcomePnlEntry, components } from "@structbuild/sdk"
import dynamic from "next/dynamic"

import type {
	TraderPositionSortBy,
	TraderSortDirection,
} from "@/lib/trader-search-params-shared"
import type { PaginatedResource } from "@/lib/struct/types"
import {
	loadTraderActivity,
	loadTraderPositions,
} from "./trader-tab-panel-loaders"

const TraderActivity = dynamic(loadTraderActivity)
const TraderPositions = dynamic(loadTraderPositions)

type TradeEvent = components["schemas"]["TradeEvent"]
type TradeRow = TradeEvent & {
	image_url?: string | null;
	question?: string | null;
	outcome?: string | null;
	price?: number | null;
	shares_amount?: number | null;
	usd_amount?: number | null;
	fee?: number | null;
	slug?: string | null;
	side?: string | null;
}

type TraderTabPanelClientProps =
	| {
			kind: "positions"
			status: "open" | "closed"
			pageNumber: number
			sortBy: TraderPositionSortBy
			sortDirection: TraderSortDirection
			page: PaginatedResource<TraderOutcomePnlEntry, number>
	  }
	| {
			kind: "activity"
			pageNumber: number
			page: PaginatedResource<TradeRow, number>
	  }

export function TraderTabPanelClient(props: TraderTabPanelClientProps) {
	if (props.kind === "activity") {
		return <TraderActivity page={props.page} pageNumber={props.pageNumber} />
	}

	return (
		<TraderPositions
			page={props.page}
			pageNumber={props.pageNumber}
			status={props.status}
			sortBy={props.sortBy}
			sortDirection={props.sortDirection}
		/>
	)
}
