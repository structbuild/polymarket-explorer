"use client"

import type { TraderOutcomePnlEntry } from "@structbuild/sdk"

import type {
	TraderPositionSortBy,
	TraderSortDirection,
} from "@/lib/trader-search-params-shared"
import type { PaginatedResource } from "@/lib/struct/types"
import type { TradeRow } from "./types"
import TraderActivity from "./activity"
import TraderPositions from "./positions"

type TraderTabPanelClientProps =
	| {
			kind: "positions"
			address: string
			status: "open" | "closed"
			pageNumber: number
			sortBy: TraderPositionSortBy
			sortDirection: TraderSortDirection
			page: PaginatedResource<TraderOutcomePnlEntry, number>
	  }
	| {
			kind: "activity"
			address: string
			pageNumber: number
			page: PaginatedResource<TradeRow, number>
	  }

export function TraderTabPanelClient(props: TraderTabPanelClientProps) {
	if (props.kind === "activity") {
		return <TraderActivity address={props.address} page={props.page} pageNumber={props.pageNumber} />
	}

	return (
		<TraderPositions
			address={props.address}
			page={props.page}
			pageNumber={props.pageNumber}
			status={props.status}
			sortBy={props.sortBy}
			sortDirection={props.sortDirection}
		/>
	)
}
