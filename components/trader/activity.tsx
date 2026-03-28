"use client"
/* eslint-disable @next/next/no-img-element */

import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import type { components } from "@structbuild/sdk"

import type { PaginatedResource } from "@/lib/struct/types"
import { ExternalLinkIcon } from "lucide-react"

import { Button } from "../ui/button"
import { DataTable } from "../ui/data-table"
import { TooltipWrapper } from "../ui/tooltip"
import { cn, formatNumber } from "@/lib/utils"

type Trade = components["schemas"]["PredictionTradeResponse"]

function formatTimeAgo(timestampSeconds: number) {
	const now = Date.now()
	const diffMs = now - timestampSeconds * 1000
	const diffSeconds = Math.floor(diffMs / 1000)

	if (diffSeconds < 60) return `${diffSeconds}s`
	const diffMinutes = Math.floor(diffSeconds / 60)
	if (diffMinutes < 60) return `${diffMinutes}m`
	const diffHours = Math.floor(diffMinutes / 60)
	if (diffHours < 24) return `${diffHours}h`
	const diffDays = Math.floor(diffHours / 24)
	if (diffDays < 30) return `${diffDays}d`
	const diffMonths = Math.floor(diffDays / 30)
	if (diffMonths < 12) return `${diffMonths}mo`
	return `${Math.floor(diffDays / 365)}y`
}

function formatPriceCents(price: number) {
	return `${(price * 100).toFixed(1)}¢`
}

function normalizeTradeType(value: string | null | undefined) {
	return value?.trim().toLowerCase().replace(/[^a-z0-9]/g, "") ?? ""
}

function isOrderFilledTrade(trade: Trade) {
	const tradeType = normalizeTradeType(trade.trade_type)
	return tradeType === "orderfilled" || tradeType === "ordersmatched" || tradeType === "0"
}

function normalizeTradeSide(value: string | null | undefined) {
	return value?.trim().toLowerCase().replace(/[^a-z0-9]/g, "") ?? ""
}

function isBuyTrade(trade: Trade) {
	const side = normalizeTradeSide(trade.side)
	return side === "buy" || side === "0"
}

function getActivityLabel(trade: Trade) {
	const tradeType = normalizeTradeType(trade.trade_type)

	if (tradeType === "redemption" || tradeType === "1") {
		return "Redeemed"
	}

	if (tradeType === "merge" || tradeType === "2") {
		return "Merged"
	}

	if (!trade.trade_type) {
		return "Activity"
	}

	if (/^\d+$/.test(trade.trade_type)) {
		return `Type ${trade.trade_type}`
	}

	return trade.trade_type.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2")
}

function getCashflowClassName(amount: number) {
	if (amount > 0) {
		return "text-emerald-500"
	}

	if (amount < 0) {
		return "text-red-500"
	}

	return ""
}

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
				<p className={cn(getCashflowClassName(trade.usd_amount))}>
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
	toolbarPortal?: HTMLDivElement | null
	isLoading?: boolean
	onNextPage: () => void
	onPreviousPage: () => void
}

export default function TraderActivity({ page, pageNumber, toolbarPortal, isLoading, onNextPage, onPreviousPage }: Props) {
	return (
		<DataTable
			columns={columns}
			data={page.data}
			storageKey="activity-table"
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage="No trades to show."
			toolbarPortal={toolbarPortal}
			columnLayout="fixed"
			paginationMode="server"
			pageIndex={pageNumber - 1}
			pageSize={page.pageSize}
			hasNextPage={page.hasMore}
			isLoading={isLoading}
			onPageIndexChange={(nextPageIndex) => {
				if (nextPageIndex > pageNumber - 1) {
					onNextPage()
					return
				}

				onPreviousPage()
			}}
		/>
	)
}
