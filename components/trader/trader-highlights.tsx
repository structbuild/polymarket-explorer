import {
	defaultTraderTablePageSize,
	getTraderPositionsPage,
} from "@/lib/struct/queries"
import {
	rankedPositionsQuery,
	type TraderExitMode,
} from "@/lib/trader-search-params-shared"

import { TraderHighlightsClient } from "./trader-highlights-client"

export function loadTraderHighlightsData({
	address,
	mode,
	pageNumber,
}: {
	address: string
	mode: TraderExitMode
	pageNumber: number
}) {
	return getTraderPositionsPage(
		address,
		"closed",
		rankedPositionsQuery(mode, pageNumber, defaultTraderTablePageSize),
	)
}

export async function TraderHighlightsSection({
	address,
	mode,
	pageNumber,
	dataPromise,
}: {
	address: string
	mode: TraderExitMode
	pageNumber: number
	dataPromise: ReturnType<typeof loadTraderHighlightsData>
}) {
	const page = await dataPromise
	return (
		<TraderHighlightsClient
			address={address}
			initialMode={mode}
			initialPage={page}
			initialPageNumber={pageNumber}
		/>
	)
}

export function TraderHighlightsFallback() {
	return (
		<div className="space-y-3">
			<div className="h-7 w-48 animate-pulse rounded-sm bg-muted" />
			<div className="overflow-hidden rounded-lg bg-card">
				<div className="grid gap-px bg-border">
					{Array.from({ length: 6 }, (_, index) => (
						<div key={index} className="flex items-center gap-4 bg-card px-4 py-3">
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
		</div>
	)
}
