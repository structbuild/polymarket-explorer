"use client"
/* eslint-disable @next/next/no-img-element */

import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import type { components } from "@structbuild/sdk"
import { useMemo } from "react"

import type { PaginatedResource } from "@/lib/struct/types"

import { Badge } from "../ui/badge"
import { DataTable } from "../ui/data-table"
import { cn, formatNumber } from "@/lib/utils"

type TraderOutcomePnlEntry = components["schemas"]["TraderOutcomePnlEntry"]

function formatPriceCents(price: number | null | undefined) {
	if (price == null || Number.isNaN(price)) {
		return "—"
	}
	return `${(price * 100).toFixed(1)}¢`
}

function formatSharesLine(row: TraderOutcomePnlEntry) {
	const bought = row.total_shares_bought ?? 0
	const sold = row.total_shares_sold ?? 0
	const net = bought - sold

	if (bought === 0 && sold === 0) {
		return null
	}

	if (Math.abs(net) < 1e-9) {
		return `${formatNumber(sold, { decimals: 2 })} shares traded`
	}

	return `${formatNumber(net, { decimals: 2 })} net shares`
}

const defaultColumnVisibility: VisibilityState = {
	total_shares_bought: false,
	total_shares_sold: false,
	total_buy_usd: false,
	total_sell_usd: false,
	total_fees: false,
	redemption_usd: false,
}

function buildColumns(status: "open" | "closed"): ColumnDef<TraderOutcomePnlEntry, unknown>[] {
	return [
		{
			id: "market",
			header: "Market",
			size: 520,
			cell: ({ row }) => {
				const entry = row.original
				const title = entry.title ?? "Unknown Market"
				const sharesLine = formatSharesLine(entry)
				return (
					<div className="flex items-center gap-3">
						{entry.image_url ? (
							<img className="size-10 rounded-md object-cover" alt="" src={entry.image_url} />
						) : (
							<div className="size-10 shrink-0 rounded-md bg-muted" />
						)}
						<div className="min-w-0 flex-1 space-y-0.5">
							<p className="truncate text-base font-medium" title={title}>
								{title}
							</p>
							<div className="flex flex-wrap items-center gap-1.5">
								{entry.outcome ? <Badge variant="secondary">{entry.outcome}</Badge> : null}
								{sharesLine ? (
									<p className="truncate text-sm text-muted-foreground" title={sharesLine}>
										{sharesLine}
									</p>
								) : null}
							</div>
						</div>
					</div>
				)
			},
		},
		{
			id: "entry_current",
			header: "Entry / Current",
			size: 140,
			cell: ({ row }) => {
				const entry = row.original
				return (
					<p>
						{formatPriceCents(entry.avg_entry_price)}{" "}
						<span className="text-muted-foreground">/</span>{" "}
						{formatPriceCents(entry.current_price ?? entry.avg_exit_price)}
					</p>
				)
			},
		},
		{
			id: "realized_pnl",
			header: "Realized PnL",
			size: 180,
			cell: ({ row }) => {
				const entry = row.original
				const pnl = entry.realized_pnl_usd ?? 0
				const pnlPositive = pnl >= 0
				return (
					<p className={cn(pnlPositive ? "text-emerald-500" : "text-red-500")}>
						{formatNumber(pnl, { currency: true, compact: true })}
						{entry.realized_pnl_pct != null ? (
							<span className="text-muted-foreground">
								{" "}
								({formatNumber(entry.realized_pnl_pct, { percent: true })})
							</span>
						) : null}
					</p>
				)
			},
		},
		...(status === "open"
			? [
					{
						id: "current_value",
						header: "Current Value",
						size: 160,
						cell: ({ row }) => {
							const entry = row.original
							const currentVal = entry.current_value
							const shares = entry.current_shares_balance

							if (currentVal === 0) {
								return (
									<div>
										<p>{formatNumber(0, { currency: true })}</p>
										<p className="text-sm text-muted-foreground">
											{formatNumber(shares ?? 0, { decimals: 2 })} shares
										</p>
									</div>
								)
							}

							const showSharesLine = shares != null && shares > 0

							return (
								<div>
									<p>
										{currentVal != null && currentVal > 0
											? formatNumber(currentVal, { currency: true, compact: true })
											: "—"}
									</p>
									{showSharesLine ? (
										<p className="text-sm text-muted-foreground">
											{formatNumber(shares, { decimals: 2 })} shares
										</p>
									) : null}
								</div>
							)
						},
					} satisfies ColumnDef<TraderOutcomePnlEntry, unknown>,
				]
			: []),
		{
			id: "total_shares_bought",
			header: "Bought",
			size: 120,
			cell: ({ row }) => (
				<p>{formatNumber(row.original.total_shares_bought ?? 0, { decimals: 2 })}</p>
			),
		},
		{
			id: "total_shares_sold",
			header: "Sold",
			size: 120,
			cell: ({ row }) => (
				<p>{formatNumber(row.original.total_shares_sold ?? 0, { decimals: 2 })}</p>
			),
		},
		{
			id: "total_buy_usd",
			header: "Buy Vol",
			size: 130,
			cell: ({ row }) => (
				<p>{formatNumber(row.original.total_buy_usd ?? 0, { currency: true, compact: true })}</p>
			),
		},
		{
			id: "total_sell_usd",
			header: "Sell Vol",
			size: 130,
			cell: ({ row }) => (
				<p>{formatNumber(row.original.total_sell_usd ?? 0, { currency: true, compact: true })}</p>
			),
		},
		{
			id: "total_fees",
			header: "Fees",
			size: 110,
			cell: ({ row }) => (
				<p>{formatNumber(row.original.total_fees ?? 0, { currency: true })}</p>
			),
		},
		{
			id: "redemption_usd",
			header: "Redemption",
			size: 130,
			cell: ({ row }) => {
				const val = row.original.redemption_usd
				return <p>{val != null && val > 0 ? formatNumber(val, { currency: true, compact: true }) : "—"}</p>
			},
		},
	]
}

type Props = {
	page: PaginatedResource<TraderOutcomePnlEntry, number>
	pageNumber: number
	status: "open" | "closed"
	toolbarPortal?: HTMLDivElement | null
	isLoading?: boolean
	onNextPage: () => void
	onPreviousPage: () => void
}

export default function TraderPositions({
	page,
	pageNumber,
	status,
	toolbarPortal,
	isLoading,
	onNextPage,
	onPreviousPage,
}: Props) {
	const columns = useMemo(() => buildColumns(status), [status])

	return (
		<DataTable
			columns={columns}
			data={page.data}
			storageKey="positions-table"
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage="No positions to show."
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
