"use client"
/* eslint-disable @next/next/no-img-element */

import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import type { components } from "@structbuild/sdk"
import { useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useQueryStates } from "nuqs"

import { refreshTraderTabAction } from "@/app/actions"
import type { PaginatedResource } from "@/lib/struct/types"
import { traderSearchParamParsers } from "@/lib/trader-search-params"
import { maxTraderPageNumber } from "@/lib/trader-search-params-shared"
import { ExternalLinkIcon, RefreshCwIcon } from "lucide-react"

import { Button } from "../ui/button"
import { DataTable } from "../ui/data-table"
import { TooltipWrapper } from "../ui/tooltip"
import { TraderTabs } from "./trader-tabs"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { formatTimeAgo, formatPriceCents } from "@/lib/format"
import { isOrderFilledTrade, isBuyTrade, getActivityLabel } from "@/lib/trade-utils"

type Trade = components["schemas"]["PredictionTradeResponse"]

const defaultColumnVisibility: VisibilityState = {
	fee: false,
}

const columns: ColumnDef<Trade, unknown>[] = [
	{
		id: "age",
		header: "Age",
		size: 80,
		cell: ({ row }) => (
			<p className="text-sm text-muted-foreground">{formatTimeAgo(row.original.confirmed_at)}</p>
		),
	},
	{
		id: "market",
		header: "Market",
		size: 480,
		cell: ({ row }) => {
			const trade = row.original
			return (
				<div className="flex items-center gap-3">
					{trade.image_url ? (
						<img className="size-10 rounded-md object-cover" alt="" src={trade.image_url} />
					) : (
						<div className="size-10 shrink-0 rounded-md bg-muted" />
					)}
					<p className="min-w-0 flex-1 truncate text-base font-medium" title={trade.question ?? "Unknown Market"}>
						{trade.question ?? "Unknown Market"}
					</p>
				</div>
			)
		},
	},
	{
		id: "outcome",
		header: "Outcome",
		size: 180,
		cell: ({ row }) => {
			const trade = row.original
			const isOrderFilled = isOrderFilledTrade(trade)
			const label = isOrderFilled
				? `${trade.outcome ?? "—"} / ${formatPriceCents(trade.price)}`
				: getActivityLabel(trade)
			return isOrderFilled ? (
				<p className="truncate" title={label}>
					{trade.outcome ?? "—"} <span className="text-muted-foreground">/</span>{" "}
					{formatPriceCents(trade.price)}
				</p>
			) : (
				<p className="truncate text-foreground/80" title={label}>
					{label}
				</p>
			)
		},
	},
	{
		id: "shares",
		header: "Shares",
		size: 110,
		cell: ({ row }) => {
			const trade = row.original
			const isOrderFilled = isOrderFilledTrade(trade)
			const isBuy = isBuyTrade(trade)
			return isOrderFilled ? (
				<p className={cn(isBuy ? "text-emerald-500" : "text-red-500")}>
					{isBuy ? "+" : "-"}
					{formatNumber(trade.shares_amount, { decimals: 2 })}
				</p>
			) : (
				<p className="text-foreground/80">
					{formatNumber(trade.shares_amount, { decimals: 2 })}
				</p>
			)
		},
	},
	{
		id: "value",
		header: "Value",
		size: 120,
		cell: ({ row }) => {
			const trade = row.original
			const isOrderFilled = isOrderFilledTrade(trade)
			return isOrderFilled ? (
				<p>{formatNumber(trade.usd_amount, { currency: true, compact: true })}</p>
			) : (
				<p className={cn(trade.usd_amount > 0 ? "text-emerald-500" : trade.usd_amount < 0 ? "text-red-500" : "")}>
					{trade.usd_amount > 0 ? "+" : ""}
					{formatNumber(trade.usd_amount, { currency: true, compact: true })}
				</p>
			)
		},
	},
	{
		id: "fee",
		header: "Fee",
		size: 110,
		cell: ({ row }) => (
			<p>{formatNumber(row.original.fee, { currency: true })}</p>
		),
	},
	{
		id: "link",
		header: "",
		size: 64,
		enableHiding: false,
		cell: ({ row }) => (
			<div className="flex justify-end">
				<TooltipWrapper content="View on Polygonscan">
					<a
						href={`https://polygonscan.com/tx/${row.original.hash}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Button variant="ghost" size="icon" aria-label="View on Polygonscan">
							<ExternalLinkIcon className="size-4" />
						</Button>
					</a>
				</TooltipWrapper>
			</div>
		),
	},
]

type Props = {
	page: PaginatedResource<Trade, number>
	pageNumber: number
}

export default function TraderActivity({ page, pageNumber }: Props) {
	const pathname = usePathname()
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [, setSearchParams] = useQueryStates(traderSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: false,
		startTransition,
	})

	return (
		<DataTable
			toolbarLeft={<TraderTabs />}
			toolbarRight={
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							startTransition(async () => {
								await refreshTraderTabAction(pathname, "activity")
								router.refresh()
							})
						}}
					disabled={isPending}
				>
					<RefreshCwIcon data-icon="inline-start" />
					Refresh
				</Button>
			}
			columns={columns}
			data={page.data}
			storageKey="activity-table"
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage="No trades to show."
			columnLayout="fixed"
			paginationMode="server"
			pageIndex={pageNumber - 1}
			pageSize={page.pageSize}
			hasNextPage={page.hasMore}
			isLoading={isPending}
			onPageIndexChange={(nextPageIndex) => {
				const nextPageNumber = Math.min(Math.max(nextPageIndex + 1, 1), maxTraderPageNumber)

				if (nextPageNumber === pageNumber) {
					return
				}

				void setSearchParams({ activityPage: nextPageNumber })
			}}
		/>
	)
}
