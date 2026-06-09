"use client"

import type { PositionEntry } from "@structbuild/sdk"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useQueryStates } from "nuqs"
import posthog from "posthog-js"

import { getTraderRankedPositionsPageAction } from "@/app/actions"
import { useTabBridge } from "@/components/layout/tab-bridge"
import { traderSearchParamParsers } from "@/lib/trader-search-params"
import {
	rankedPositionSortBy,
	rankedPositionSortDirection,
	traderExitModeValues,
	type TraderExitMode,
} from "@/lib/trader-search-params-shared"
import type { PaginatedResource } from "@/lib/struct/types"
import { cn } from "@/lib/utils"

import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import TraderPositions from "./positions"

const modeLabels: Record<TraderExitMode, string> = {
	wins: "Best Wins",
	losses: "Worst Losses",
}

export function TraderHighlightsClient({
	address,
	initialMode,
	initialPage,
	initialPageNumber,
}: {
	address: string
	initialMode: TraderExitMode
	initialPage: PaginatedResource<PositionEntry, number>
	initialPageNumber: number
}) {
	const [isPending, startTransition] = useTransition()
	const requestIdRef = useRef(0)
	const bridge = useTabBridge()
	const [state, setState] = useState(() => ({
		sourceMode: initialMode,
		sourcePage: initialPage,
		sourcePageNumber: initialPageNumber,
		mode: initialMode,
		page: initialPage,
		pageNumber: initialPageNumber,
	}))
	const [, setSearchParams] = useQueryStates(traderSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: true,
		startTransition,
	})

	const usingLocal =
		state.sourceMode === initialMode &&
		state.sourcePage === initialPage &&
		state.sourcePageNumber === initialPageNumber
	const mode = usingLocal ? state.mode : initialMode
	const page = usingLocal ? state.page : initialPage
	const pageNumber = usingLocal ? state.pageNumber : initialPageNumber

	const handleModeChange = useCallback(
		(nextMode: TraderExitMode) => {
			if (nextMode === mode) {
				return
			}

			posthog.capture("trader_highlights_mode_changed", { mode: nextMode })

			const requestId = requestIdRef.current + 1
			requestIdRef.current = requestId
			void setSearchParams({ highlights: nextMode })

			startTransition(async () => {
				const result = await getTraderRankedPositionsPageAction({
					address,
					mode: nextMode,
					pageNumber: 1,
				})

				if (requestIdRef.current === requestId) {
					setState({
						sourceMode: initialMode,
						sourcePage: initialPage,
						sourcePageNumber: initialPageNumber,
						mode: nextMode,
						page: result.page,
						pageNumber: result.pageNumber,
					})
				}
			})
		},
		[address, initialMode, initialPage, initialPageNumber, mode, setSearchParams],
	)

	useEffect(() => {
		bridge?.registerHandler("trader-highlights", handleModeChange as (value: string) => void)
	}, [bridge, handleModeChange])

	useEffect(() => {
		bridge?.reportActive("trader-highlights", mode)
	}, [bridge, mode])

	const toggle = (
		<Tabs value={mode} onValueChange={(value) => handleModeChange(value as TraderExitMode)}>
			<TabsList
				variant="text"
				aria-busy={isPending}
				className={cn(
					"flex w-full justify-start gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					isPending && "opacity-70",
				)}
			>
				{traderExitModeValues.map((value) => (
					<TabsTrigger key={value} className="text-base! sm:text-xl!" value={value}>
						{modeLabels[value]}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	)

	return (
		<TraderPositions
			address={address}
			page={page}
			pageNumber={pageNumber}
			status="closed"
			sortBy={rankedPositionSortBy}
			sortDirection={rankedPositionSortDirection[mode]}
			ranked={mode}
			tabs={toggle}
		/>
	)
}
