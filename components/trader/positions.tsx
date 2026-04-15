"use client"
/* eslint-disable @next/next/no-img-element */

import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import type { components } from "@structbuild/sdk"
import type { Route } from "next"
import Link from "next/link"
import { ExternalLinkIcon, InfoIcon, RefreshCwIcon } from "lucide-react"
import { useCallback, useMemo, useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useQueryStates } from "nuqs"

import { refreshTraderTabAction } from "@/app/actions"
import type {
	TraderPositionSortBy,
	TraderSortDirection,
} from "@/lib/trader-search-params-shared"
import type { PaginatedResource } from "@/lib/struct/types"
import { traderSearchParamParsers } from "@/lib/trader-search-params"
import { maxTraderPageNumber } from "@/lib/trader-search-params-shared"

import { Badge } from "../ui/badge"
import { Checkbox } from "../ui/checkbox"
import { DataTable } from "../ui/data-table"
import { SortableHeader } from "../ui/sortable-header"
import { TooltipWrapper } from "../ui/tooltip"
import { Button } from "../ui/button"
import { TraderTabs } from "./trader-tabs"
import { formatNumber, formatPriceCents, formatDateShort, formatTime, pnlColorClass } from "@/lib/format"
import { cn } from "@/lib/utils"

type TraderOutcomePnlEntry = components["schemas"]["TraderOutcomePnlEntry"]

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

function buildColumns(
	status: "open" | "closed",
	currentSortBy: TraderPositionSortBy,
	currentSortDirection: TraderSortDirection,
	onSortChange: (sortBy: TraderPositionSortBy) => void,
): ColumnDef<TraderOutcomePnlEntry, unknown>[] {
	// The backend has no current_price sort key, so this composite column uses the closest
	// server-supported price field for each tab.
	const entryCurrentSortBy = status === "closed" ? "avg_exit_price" : "avg_entry_price"

	return [
		{
			id: "market",
			meta: { title: "Market" },
			header: () => (
				<SortableHeader
					sortBy="title"
					currentSortBy={currentSortBy}
					currentSortDirection={currentSortDirection}
					onSortChange={onSortChange}
				>
					Market
				</SortableHeader>
			),
			size: 520,
			cell: ({ row }) => {
				const entry = row.original
				const isUnknownMarket = !entry.title
				const title = entry.title || "Unknown Market"
				const sharesLine = formatSharesLine(entry)
				const href = entry.market_slug ? (`/markets/${entry.market_slug}` as Route) : null
				return (
					<div className="flex items-center gap-3">
						{entry.image_url ? (
							<img className="size-10 rounded-md object-cover" alt="" src={entry.image_url} />
						) : (
							<div className="size-10 shrink-0 rounded-md bg-muted" />
						)}
						<div className="min-w-0 flex-1 space-y-0.5">
							{isUnknownMarket ? (
								<p className="truncate text-base font-medium" title={title}>
									<TooltipWrapper content="Polymarket Gamma has no data on this market/position">
										<span className="cursor-help border-b border-dotted border-muted-foreground/50">
											{title}
										</span>
									</TooltipWrapper>
								</p>
							) : href ? (
								<Link
									href={href}
									className="block truncate text-base font-medium text-foreground underline-offset-4 hover:underline"
									title={title}
								>
									{title}
								</Link>
							) : (
								<p className="truncate text-base font-medium" title={title}>
									{title}
								</p>
							)}
							<div className="flex flex-wrap items-center gap-1.5">
								{entry.outcome ? (
									<Badge
										variant={
											entry.outcome_index === 0
												? "positive"
												: entry.outcome_index === 1
													? "negative"
													: "secondary"
										}
									>
										{entry.outcome}
									</Badge>
								) : null}
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
			meta: { title: "Entry / Current" },
			header: () => (
				<SortableHeader
					sortBy={entryCurrentSortBy}
					currentSortBy={currentSortBy}
					currentSortDirection={currentSortDirection}
					onSortChange={onSortChange}
				>
					Entry / Current
				</SortableHeader>
			),
			size: 140,
			cell: ({ row }) => {
				const entry = row.original
				const isEntryUnknown = entry.avg_entry_price === 0 || entry.avg_entry_price == null

				return (
					<p>
						{isEntryUnknown ? (
							<TooltipWrapper content="This position may be split/merged/transferred hence the entry is unknown">
								<span className="cursor-help border-b border-dotted border-muted-foreground/50">—</span>
							</TooltipWrapper>
						) : (
							formatPriceCents(entry.avg_entry_price)
						)}{" "}
						<span className="text-muted-foreground">/</span>{" "}
						{formatPriceCents(entry.current_price ?? entry.avg_exit_price)}
					</p>
				)
			},
		},
		{
			id: "realized_pnl",
			meta: { title: "Realized PnL" },
			header: () => (
				<SortableHeader
					sortBy="realized_pnl_usd"
					currentSortBy={currentSortBy}
					currentSortDirection={currentSortDirection}
					onSortChange={onSortChange}
				>
					<span className="flex items-center gap-1.5">
						Realized PnL
						<TooltipWrapper content="Realized PnL is calculated based on shares bought, sold, and redeemed. If you haven't sold or redeemed any shares, your realized PnL will be negative.">
							<InfoIcon className="size-4 text-muted-foreground" />
						</TooltipWrapper>
					</span>
				</SortableHeader>
			),
			size: 180,
			cell: ({ row }) => {
				const entry = row.original
				const pnl = entry.realized_pnl_usd ?? 0
				return (
					<p className={cn(pnlColorClass(pnl))}>
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
						meta: { title: "Current Value" },
						header: () => (
							<SortableHeader
								sortBy="current_value"
								currentSortBy={currentSortBy}
								currentSortDirection={currentSortDirection}
								onSortChange={onSortChange}
							>
								Current Value
							</SortableHeader>
						),
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
			meta: { title: "Bought" },
			header: () => (
				<SortableHeader
					sortBy="total_shares_bought"
					currentSortBy={currentSortBy}
					currentSortDirection={currentSortDirection}
					onSortChange={onSortChange}
				>
					Bought
				</SortableHeader>
			),
			size: 120,
			cell: ({ row }) => (
				<p>{formatNumber(row.original.total_shares_bought ?? 0, { decimals: 2 })}</p>
			),
		},
		{
			id: "total_shares_sold",
			meta: { title: "Sold" },
			header: () => (
				<SortableHeader
					sortBy="total_shares_sold"
					currentSortBy={currentSortBy}
					currentSortDirection={currentSortDirection}
					onSortChange={onSortChange}
				>
					Sold
				</SortableHeader>
			),
			size: 120,
			cell: ({ row }) => (
				<p>{formatNumber(row.original.total_shares_sold ?? 0, { decimals: 2 })}</p>
			),
		},
		{
			id: "total_buy_usd",
			meta: { title: "Buy Vol" },
			header: () => (
				<SortableHeader
					sortBy="total_buy_usd"
					currentSortBy={currentSortBy}
					currentSortDirection={currentSortDirection}
					onSortChange={onSortChange}
				>
					Buy Vol
				</SortableHeader>
			),
			size: 130,
			cell: ({ row }) => (
				<p>{formatNumber(row.original.total_buy_usd ?? 0, { currency: true, compact: true })}</p>
			),
		},
		{
			id: "total_sell_usd",
			meta: { title: "Sell Vol" },
			header: () => (
				<SortableHeader
					sortBy="total_sell_usd"
					currentSortBy={currentSortBy}
					currentSortDirection={currentSortDirection}
					onSortChange={onSortChange}
				>
					Sell Vol
				</SortableHeader>
			),
			size: 130,
			cell: ({ row }) => (
				<p>{formatNumber(row.original.total_sell_usd ?? 0, { currency: true, compact: true })}</p>
			),
		},
		{
			id: "total_fees",
			meta: { title: "Fees" },
			header: () => (
				<SortableHeader
					sortBy="total_fees"
					currentSortBy={currentSortBy}
					currentSortDirection={currentSortDirection}
					onSortChange={onSortChange}
				>
					Fees
				</SortableHeader>
			),
			size: 110,
			cell: ({ row }) => (
				<p>{formatNumber(row.original.total_fees ?? 0, { currency: true })}</p>
			),
		},
		{
			id: "redemption_usd",
			meta: { title: "Redemption" },
			header: () => (
				<SortableHeader
					sortBy="redemption_usd"
					currentSortBy={currentSortBy}
					currentSortDirection={currentSortDirection}
					onSortChange={onSortChange}
				>
					Redemption
				</SortableHeader>
			),
			size: 130,
			cell: ({ row }) => {
				const val = row.original.redemption_usd
				return <p>{val != null && val > 0 ? formatNumber(val, { currency: true, compact: true }) : "—"}</p>
			},
		},
		{
			id: "last_trade_at",
			meta: { title: "Last Active" },
			header: () => (
				<SortableHeader
					sortBy="last_trade_at"
					currentSortBy={currentSortBy}
					currentSortDirection={currentSortDirection}
					onSortChange={onSortChange}
				>
					Last Active
				</SortableHeader>
			),
			size: 150,
			cell: ({ row }) => {
				const lastTradeAtMs = row.original.last_trade_at
				const lastTradeAtSec = lastTradeAtMs ? lastTradeAtMs / 1000 : null
				const time = formatTime(lastTradeAtSec)

				return (
					<div title={lastTradeAtMs ? new Date(lastTradeAtMs).toLocaleString("en-US") : undefined}>
						<p>{formatDateShort(lastTradeAtSec)}</p>
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
							<a
								href={`https://polymarket.com/market/${slug}`}
								target="_blank"
								rel="noopener noreferrer"
							>
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
}

type Props = {
	page: PaginatedResource<TraderOutcomePnlEntry, number>
	pageNumber: number
	status: "open" | "closed"
	sortBy: TraderPositionSortBy
	sortDirection: TraderSortDirection
}

export default function TraderPositions({
	page,
	pageNumber,
	status,
	sortBy,
	sortDirection,
}: Props) {
	const pathname = usePathname()
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [, setSearchParams] = useQueryStates(traderSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: false,
		startTransition,
	})
	const pageKey = status === "open" ? "openPage" : "closedPage"

	const [hideUnknown, setHideUnknown] = useState(false)

	const hasUnknownMarkets = page.data.some((entry) => !entry.title)

	const handleSortChange = useCallback((nextSortBy: TraderPositionSortBy) => {
		const nextSortDirection: TraderSortDirection =
			nextSortBy === sortBy && sortDirection === "desc" ? "asc" : "desc"

		if (status === "open") {
			void setSearchParams({
				openSortBy: nextSortBy,
				openSortDirection: nextSortDirection,
				openPage: 1,
			})
			return
		}

		void setSearchParams({
			closedSortBy: nextSortBy,
			closedSortDirection: nextSortDirection,
			closedPage: 1,
		})
	}, [setSearchParams, sortBy, sortDirection, status])

	const columns = useMemo(
		() => buildColumns(status, sortBy, sortDirection, handleSortChange),
		[handleSortChange, sortBy, sortDirection, status],
	)

	const data = useMemo(() => {
		if (hideUnknown) {
			return page.data.filter((entry) => entry.title)
		}
		return page.data
	}, [page.data, hideUnknown])

	const toolbarRight = (
		<div className="flex items-center gap-3">
			{hasUnknownMarkets || hideUnknown ? (
				<label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
					<Checkbox
						checked={hideUnknown}
						onCheckedChange={(val) => setHideUnknown(!!val)}
					/>
					Hide unknown markets
				</label>
			) : null}
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						startTransition(async () => {
							await refreshTraderTabAction(pathname, "positions")
							router.refresh()
						})
					}}
					disabled={isPending}
				>
				<RefreshCwIcon data-icon="inline-start" />
				Refresh
			</Button>
		</div>
	)

	return (
		<DataTable
			toolbarLeft={<TraderTabs />}
			toolbarRight={toolbarRight}
			columns={columns}
			data={data}
			storageKey="positions-table"
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage="No positions to show."
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

				void setSearchParams({ [pageKey]: nextPageNumber })
			}}
		/>
	)
}
