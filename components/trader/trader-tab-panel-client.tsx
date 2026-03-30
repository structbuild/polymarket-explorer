"use client"

import type { components } from "@structbuild/sdk"
import dynamic from "next/dynamic"

import type { PaginatedResource } from "@/lib/struct/types"
import {
	loadTraderActivity,
	loadTraderPositions,
} from "./trader-tab-panel-loaders"

const TraderActivity = dynamic(loadTraderActivity)
const TraderPositions = dynamic(loadTraderPositions)

type Trade = components["schemas"]["PredictionTradeResponse"]
type TraderOutcomePnlEntry = components["schemas"]["TraderOutcomePnlEntry"]

type TraderTabPanelClientProps =
	| {
			kind: "positions"
			status: "open" | "closed"
			pageNumber: number
			page: PaginatedResource<TraderOutcomePnlEntry, number>
	  }
	| {
			kind: "activity"
			pageNumber: number
			page: PaginatedResource<Trade, number>
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
		/>
	)
}
