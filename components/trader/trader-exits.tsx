"use client"
/* eslint-disable @next/next/no-img-element */

import type { ColumnDef } from "@tanstack/react-table"
import type { PnlV3ExitMarker, PnlV3ExitReason } from "@structbuild/sdk"
import type { Route } from "next"
import Link from "next/link"
import { ExternalLinkIcon, RefreshCwIcon } from "lucide-react"
import { type ReactNode, useState, useTransition } from "react"
import { useQueryStates } from "nuqs"

import { getTraderExitsPageAction } from "@/app/actions"
import type { PaginatedResource } from "@/lib/struct/types"
import type { TraderExitMode } from "@/lib/trader-search-params-shared"
import { traderSearchParamParsers } from "@/lib/trader-search-params"
import { maxTraderPageNumber } from "@/lib/trader-search-params-shared"

import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { DataTable } from "../ui/data-table"
import { TooltipWrapper } from "../ui/tooltip"
import { TraderTabs } from "./trader-tabs"
import { formatDateShort, formatNumber, formatTime, pnlColorClass } from "@/lib/format"
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url"
import { cn } from "@/lib/utils"

function exitCloseLabel(reason: PnlV3ExitReason): string {
	return reason === "resolved_win" || reason === "resolved_loss" ? "Resolved" : "Sold"
}

const columns: ColumnDef<PnlV3ExitMarker, unknown>[] = [
	{
		id: "market",
		meta: { title: "Market" },
		header: () => <span>Market</span>,
		size: 460,
		cell: ({ row }) => {
			const exit = row.original
			const question = exit.question || exit.title || "Unknown Market"
			const href = exit.market_slug ? (`/markets/${exit.market_slug}` as Route) : null
			const image = exit.image_url ? normalizePolymarketS3ImageUrl(exit.image_url) : null
			return (
				<div className="flex items-center gap-3">
					{image ? (
						<img className="size-10 shrink-0 rounded-md object-cover" alt={question} src={image} />
					) : (
						<div className="size-10 shrink-0 rounded-md bg-muted" />
					)}
					<div className="min-w-0 flex-1 space-y-0.5">
						{href ? (
							<Link
								href={href}
								prefetch={false}
								className="block truncate text-base font-medium text-foreground underline-offset-4 hover:underline"
								title={question}
							>
								{question}
							</Link>
						) : (
							<p className="truncate text-base font-medium" title={question}>
								{question}
							</p>
						)}
						<div className="flex flex-wrap items-center gap-1.5">
							{exit.outcome ? (
								<Badge
									variant={
										exit.outcome_index === 0
											? "positive"
											: exit.outcome_index === 1
												? "negative"
												: "secondary"
									}
								>
									{exit.outcome}
								</Badge>
							) : null}
							<Badge variant="outline">{exitCloseLabel(exit.reason)}</Badge>
						</div>
					</div>
				</div>
			)
		},
	},
	{
		id: "cost_basis",
		meta: { title: "Invested" },
		header: () => <span>Invested</span>,
		size: 140,
		cell: ({ row }) => (
			<p className="tabular-nums">
				{formatNumber(row.original.cost_basis_usd ?? 0, { currency: true, compact: true })}
			</p>
		),
	},
	{
		id: "pnl",
		meta: { title: "PnL" },
		header: () => <span>PnL</span>,
		size: 160,
		cell: ({ row }) => {
			const pnl = row.original.pnl_usd ?? 0
			return (
				<p className={cn("tabular-nums", pnlColorClass(pnl))}>
					{formatNumber(pnl, { currency: true, compact: true })}
					{row.original.pnl_pct != null ? (
						<span className="text-muted-foreground">
							{" "}
							({formatNumber(row.original.pnl_pct, { percent: true })})
						</span>
					) : null}
				</p>
			)
		},
	},
	{
		id: "exited",
		meta: { title: "Exited" },
		header: () => <span>Exited</span>,
		size: 150,
		cell: ({ row }) => {
			const seconds = row.original.t
			const time = formatTime(seconds)
			return (
				<div title={seconds ? new Date(seconds * 1000).toLocaleString("en-US") : undefined}>
					<p>{formatDateShort(seconds)}</p>
					{time ? <p className="text-sm text-muted-foreground">{time}</p> : null}
				</div>
			)
		},
	},
	{
		id: "link",
		header: "",
		size: 64,
		enableHiding: false,
		cell: ({ row }) => {
			const slug = row.original.market_slug
			if (!slug) return null
			return (
				<div className="flex justify-end">
					<TooltipWrapper content="View on Polymarket">
						<a href={`https://polymarket.com/market/${slug}`} target="_blank" rel="noopener noreferrer">
							<Button variant="ghost" size="icon" aria-label="View on Polymarket">
								<ExternalLinkIcon className="size-4" />
							</Button>
						</a>
					</TooltipWrapper>
				</div>
			)
		},
	},
]

type Props = {
	address: string
	mode: TraderExitMode
	page: PaginatedResource<PnlV3ExitMarker, number>
	pageNumber: number
	tabs?: ReactNode
	onRefresh?: () => Promise<void>
}

export default function TraderExits({ address, mode, page, pageNumber, tabs, onRefresh }: Props) {
	const [isPending, startTransition] = useTransition()
	const [pageState, setPageState] = useState(() => ({
		sourcePage: page,
		sourcePageNumber: pageNumber,
		page,
		pageNumber,
	}))
	const [, setSearchParams] = useQueryStates(traderSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: true,
		startTransition,
	})

	const hasLocalPage =
		pageState.sourcePage === page && pageState.sourcePageNumber === pageNumber
	const currentPage = hasLocalPage ? pageState.page : page
	const currentPageNumber = hasLocalPage ? pageState.pageNumber : pageNumber

	const emptyMessage = mode === "wins" ? "No winning exits to show." : "No losing exits to show."

	return (
		<DataTable
			toolbarLeft={tabs ?? <TraderTabs />}
			toolbarRight={
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						if (!onRefresh) return
						startTransition(async () => {
							await onRefresh()
						})
					}}
					disabled={isPending || !onRefresh}
				>
					<RefreshCwIcon data-icon="inline-start" />
					Refresh
				</Button>
			}
			columns={columns}
			data={currentPage.data}
			storageKey="exits-table"
			emptyMessage={emptyMessage}
			emptyClassName="py-24"
			columnLayout="fixed"
			paginationMode="server"
			pageIndex={currentPageNumber - 1}
			pageSize={currentPage.pageSize}
			hasNextPage={currentPage.hasMore}
			isLoading={isPending}
			onPageIndexChange={(nextPageIndex) => {
				const nextPageNumber = Math.min(Math.max(nextPageIndex + 1, 1), maxTraderPageNumber)

				if (nextPageNumber === currentPageNumber) {
					return
				}

				startTransition(async () => {
					void setSearchParams(
						mode === "wins" ? { winsPage: nextPageNumber } : { lossesPage: nextPageNumber },
					)

					const result = await getTraderExitsPageAction({
						address,
						mode,
						pageNumber: nextPageNumber,
					})

					setPageState({
						sourcePage: page,
						sourcePageNumber: pageNumber,
						page: result.page,
						pageNumber: result.pageNumber,
					})
				})
			}}
		/>
	)
}
