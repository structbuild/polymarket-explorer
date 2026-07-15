"use client"
/* eslint-disable @next/next/no-img-element */

import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import type { PolymarketCategory, PositionEntry } from "@structbuild/sdk"
import type { Route } from "next"
import Link from "next/link"
import { ArrowDownIcon, ArrowUpIcon, ExternalLinkIcon, RefreshCwIcon } from "lucide-react"
import { type ReactNode, useCallback, useMemo, useState, useTransition } from "react"
import { useQueryStates } from "nuqs"
import posthog from "posthog-js"

import { getTraderPositionsPageAction, getTraderRankedPositionsPageAction } from "@/app/actions"
import type {
	TraderComboFilter,
	TraderExitMode,
	TraderPositionSortBy,
	TraderSortDirection,
} from "@/lib/trader-search-params-shared"
import type { PaginatedResource } from "@/lib/struct/types"
import { traderSearchParamParsers } from "@/lib/trader-search-params"
import { maxTraderPageNumber } from "@/lib/trader-search-params-shared"
import { POLYMARKET_CATEGORIES } from "@/lib/tag-category"

import { Badge } from "../ui/badge"
import { TraderComboLegs } from "./trader-combo-legs"
import { rowComboType } from "@/lib/combo"
import { DataTable } from "../ui/data-table"
import { SortableHeader } from "../ui/sortable-header"
import { TooltipWrapper } from "../ui/tooltip"
import { Button } from "../ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select"
import { ShowUnknownMarketsToggle } from "../ui/show-unknown-markets-toggle"
import { ExternalLink } from "../ui/external-link"
import { TraderTabs } from "./trader-tabs"
import { formatNumber, formatPriceCents, formatDateShort, formatTime, pnlColorClass, readTotalPnlUsd, readTotalPnlPct } from "@/lib/format"
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url"
import { cn, truncateMarketTitle } from "@/lib/utils"

const defaultColumnVisibility: VisibilityState = {
	current_value: false,
	total_fees: false,
	redemption_usd: false,
	convert: false,
}

const baseSortOptions: { value: TraderPositionSortBy; label: string }[] = [
	{ value: "total_pnl_usd", label: "PnL ($)" },
	{ value: "total_pnl_pct", label: "PnL (%)" },
	{ value: "current_value", label: "Current Value" },
	{ value: "current_price", label: "Current Price" },
	{ value: "current_shares_balance", label: "Shares Held" },
	{ value: "end_date", label: "Market End Date" },
	{ value: "redeemable", label: "Redeemable" },
	{ value: "mergeable", label: "Mergeable" },
	{ value: "merge_count", label: "Merges" },
	{ value: "split_count", label: "Splits" },
	{ value: "last_trade_at", label: "Last Active" },
	{ value: "first_trade_at", label: "First Trade" },
]

const openOnlySortKeys: ReadonlySet<TraderPositionSortBy> = new Set([
	"current_price",
	"mergeable",
])

const closedOnlySortKeys: ReadonlySet<TraderPositionSortBy> = new Set([
	"redeemable",
])

function getSortOptions(status: "open" | "closed") {
	const excluded = status === "open" ? closedOnlySortKeys : openOnlySortKeys
	return baseSortOptions.filter((option) => !excluded.has(option.value))
}

function buildColumns(
	address: string,
	status: "open" | "closed",
	currentSortBy: TraderPositionSortBy,
	currentSortDirection: TraderSortDirection,
	onSortChange: (sortBy: TraderPositionSortBy) => void,
	sortable: boolean,
): ColumnDef<PositionEntry, unknown>[] {
	const entryCurrentSortBy = status === "closed" ? "avg_exit_price" : "avg_entry_price"

	const columnHeader = (sortBy: TraderPositionSortBy, label: string) =>
		sortable
			? () => (
					<SortableHeader
						table="trader_positions"
						sortBy={sortBy}
						currentSortBy={currentSortBy}
						currentSortDirection={currentSortDirection}
						onSortChange={onSortChange}
					>
						{label}
					</SortableHeader>
				)
			: () => <span>{label}</span>

	return [
		{
			id: "market",
			meta: { title: "Market" },
			header: columnHeader("title", "Market"),
			size: 520,
			cell: ({ row }) => {
				const entry = row.original
				const isUnknownMarket = !entry.question
				const question = entry.question || "Unknown Market"
				const displayTitle = truncateMarketTitle(question)
				const isCombo = rowComboType(entry) != null && entry.condition_id != null
					const href = isCombo
						? (`/combos/${entry.condition_id}` as Route)
						: entry.market_slug
							? (`/markets/${entry.market_slug}` as Route)
							: null
				return (
					<div className="flex items-center gap-3">
						{entry.image_url ? (
							<img
								className="size-10 rounded-md object-cover"
								alt={question}
								src={normalizePolymarketS3ImageUrl(entry.image_url) ?? ""}
							/>
						) : (
							<div className="size-10 shrink-0 rounded-md bg-muted" />
						)}
						<div className="min-w-0 flex-1 space-y-0.5">
							{isUnknownMarket ? (
								<p className="truncate text-base font-medium" title={question}>
									<TooltipWrapper content="Polymarket Gamma has no data on this market/position">
										<span className="cursor-help border-b border-dotted border-muted-foreground/50">
											{displayTitle}
										</span>
									</TooltipWrapper>
								</p>
							) : href ? (
								<Link
									href={href}
									prefetch={false}
									className="block truncate text-base font-medium text-foreground underline-offset-4 hover:underline"
									title={question}
								>
									{displayTitle}
								</Link>
							) : (
								<p className="truncate text-base font-medium" title={question}>
									{displayTitle}
								</p>
							)}
							<div className="flex flex-wrap items-center gap-1.5">
								{rowComboType(entry) ? (
									<TraderComboLegs
										address={address}
										positionId={entry.position_id}
										conditionId={entry.condition_id}
										comboType={rowComboType(entry)}
									/>
								) : null}
								{status === "closed" && entry.won != null ? (
									<Badge variant={entry.won ? "positive" : "negative"}>
										{entry.won ? "Won" : "Lost"}
									</Badge>
								) : null}
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
								{entry.category ? (
									<Badge variant="secondary">{entry.category}</Badge>
								) : null}
								{entry.redeemable ? (
									<Badge variant="redeemable">Redeemable</Badge>
								) : null}
								{status === "open" && entry.current_shares_balance ? (
									<p className="text-muted-foreground">{formatNumber(entry.current_shares_balance, { decimals: 2 })} shares</p>
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
			header: columnHeader(entryCurrentSortBy, "Entry / Current"),
			size: 140,
			cell: ({ row }) => {
				const entry = row.original
				const isEntryUnknown = entry.avg_entry_price == null

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
						{formatPriceCents(entry.current_price ?? entry.avg_exit_price ?? 0)}
					</p>
				)
			},
		},
		{
			id: "realized_pnl",
			meta: { title: "PnL" },
			header: columnHeader("total_pnl_usd", "PnL"),
			size: 150,
			cell: ({ row }) => {
				const entry = row.original
				const pnl = readTotalPnlUsd(entry)
				const pnlPct = readTotalPnlPct(entry)
				return (
					<p className={cn(pnlColorClass(pnl))}>
						{formatNumber(pnl, { currency: true, compact: true })}
						{pnlPct != null ? (
							<span className="text-muted-foreground">
								{" "}
								({formatNumber(pnlPct, { percent: true })})
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
						header: columnHeader("current_value", "Current Value"),
						size: 160,
						cell: ({ row }) => {
							const entry = row.original
							return (
								<div>
									<p>{formatNumber(entry.current_value ?? 0, { currency: true, compact: true })}</p>
									<p className="text-sm text-muted-foreground">
										{formatNumber(entry.current_shares_balance ?? 0, { decimals: 2 })} shares
									</p>
								</div>
							)
						},
					} satisfies ColumnDef<PositionEntry, unknown>,
				]
			: []),
		{
			id: "buys",
			meta: { title: "Buys" },
			header: columnHeader("total_buy_usd", "Buys"),
			size: 160,
			cell: ({ row }) => {
				const usd = row.original.total_buy_usd ?? 0
				const count = row.original.total_buys ?? 0
				return (
					<p className="tabular-nums">
						<span>{formatNumber(usd, { currency: true, compact: true })}</span>
						{count > 0 ? (
							<span className="text-muted-foreground"> · {formatNumber(count, { decimals: 0 })}</span>
						) : null}
					</p>
				)
			},
		},
		{
			id: "sells",
			meta: { title: "Sells" },
			header: columnHeader("total_sell_usd", "Sells"),
			size: 160,
			cell: ({ row }) => {
				const usd = row.original.total_sell_usd ?? 0
				const count = row.original.total_sells ?? 0
				return (
					<p className="tabular-nums">
						<span>{formatNumber(usd, { currency: true, compact: true })}</span>
						{count > 0 ? (
							<span className="text-muted-foreground"> · {formatNumber(count, { decimals: 0 })}</span>
						) : null}
					</p>
				)
			},
		},
		{
			id: "merge_usd",
			meta: { title: "Merge" },
			header: () => <span>Merge</span>,
			size: 130,
			cell: ({ row }) => {
				const val = row.original.merge_usd ?? 0
				return <p>{formatNumber(val, { currency: true, compact: true })}</p>
			},
		},
		{
			id: "convert",
			meta: { title: "Convert" },
			header: () => <span>Convert</span>,
			size: 140,
			cell: ({ row }) => {
				const count = row.original.converted_count ?? 0
				const gained = row.original.converted_shares_gained ?? 0
				const lost = row.original.converted_shares_lost ?? 0
				const net = gained - lost
				return (
					<p className="tabular-nums">
						<span>{formatNumber(count, { decimals: 0 })}</span>
						{count > 0 ? (
							<span className="text-muted-foreground">
								{" "}· {net >= 0 ? "+" : ""}{formatNumber(net, { decimals: 2 })} sh
							</span>
						) : null}
					</p>
				)
			},
		},
		{
			id: "total_fees",
			meta: { title: "Fees" },
			header: columnHeader("total_fees", "Fees"),
			size: 110,
			cell: ({ row }) => (
				<p>{formatNumber(row.original.total_fees ?? 0, { currency: true })}</p>
			),
		},
		...(status === "closed"
			? [
					{
						id: "redemption_usd",
						meta: { title: "Redemption" },
						header: columnHeader("redemption_usd", "Redemption"),
						size: 130,
						cell: ({ row }) => {
							const val = row.original.redemption_usd ?? 0
							return <p>{formatNumber(val, { currency: true, compact: true })}</p>
						},
					} satisfies ColumnDef<PositionEntry, unknown>,
				]
			: []),
		{
			id: "last_trade_at",
			meta: { title: "Last Active" },
			header: columnHeader("last_trade_at", "Last Active"),
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
				const entry = row.original
				const slug = entry.market_slug
				if (!slug || rowComboType(entry) != null) return null
				return (
					<div className="flex justify-end">
						<TooltipWrapper content="View on Polymarket">
							<ExternalLink
								href={`https://polymarket.com/market/${slug}`}
								linkType="polymarket_market"
							>
								<Button variant="ghost" size="icon" aria-label="View on Polymarket">
									<ExternalLinkIcon className="size-4" />
								</Button>
							</ExternalLink>
						</TooltipWrapper>
					</div>
				)
			},
		},
	]
}

type Props = {
	address: string
	page: PaginatedResource<PositionEntry, number>
	pageNumber: number
	status: "open" | "closed"
	sortBy: TraderPositionSortBy
	sortDirection: TraderSortDirection
	category?: PolymarketCategory
	combo?: TraderComboFilter
	ranked?: TraderExitMode
	tabs?: ReactNode
	onRefresh?: () => Promise<void>
}

const ALL_CATEGORIES_VALUE = "__all__"

const comboFilterOptions: { value: TraderComboFilter; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "combos", label: "Combos" },
	{ value: "standard", label: "Standard" },
]

export default function TraderPositions({
	address,
	page,
	pageNumber,
	status,
	sortBy,
	sortDirection,
	category,
	combo = "all",
	ranked,
	tabs,
	onRefresh,
}: Props) {
	const [isPending, startTransition] = useTransition()
	const [tableState, setTableState] = useState(() => ({
		sourcePage: page,
		sourcePageNumber: pageNumber,
		sourceSortBy: sortBy,
		sourceSortDirection: sortDirection,
		sourceCategory: category,
		sourceCombo: combo,
		page,
		pageNumber,
		sortBy,
		sortDirection,
		category,
		combo,
	}))
	const [, setSearchParams] = useQueryStates(traderSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: true,
		startTransition,
	})

	const [showUnknown, setShowUnknown] = useState(false)

	const hasLocalTableState =
		tableState.sourcePage === page &&
		tableState.sourcePageNumber === pageNumber &&
		tableState.sourceSortBy === sortBy &&
		tableState.sourceSortDirection === sortDirection &&
		tableState.sourceCategory === category &&
		tableState.sourceCombo === combo
	const currentPage = hasLocalTableState ? tableState.page : page
	const currentPageNumber = hasLocalTableState ? tableState.pageNumber : pageNumber
	const currentSortBy = hasLocalTableState ? tableState.sortBy : sortBy
	const currentSortDirection = hasLocalTableState ? tableState.sortDirection : sortDirection
	const currentCategory = hasLocalTableState ? tableState.category : category
	const currentCombo = hasLocalTableState ? tableState.combo : combo

	const hasUnknownMarkets = currentPage.data.some((entry) => !entry.question)

	const loadPage = useCallback((nextPageNumber: number, nextSortBy: TraderPositionSortBy, nextSortDirection: TraderSortDirection, nextCategory: PolymarketCategory | undefined, nextCombo: TraderComboFilter) => {
		startTransition(async () => {
			if (ranked) {
				void setSearchParams(
					ranked === "wins" ? { winsPage: nextPageNumber } : { lossesPage: nextPageNumber },
				)

				const result = await getTraderRankedPositionsPageAction({
					address,
					mode: ranked,
					pageNumber: nextPageNumber,
				})

				setTableState({
					sourcePage: page,
					sourcePageNumber: pageNumber,
					sourceSortBy: sortBy,
					sourceSortDirection: sortDirection,
					sourceCategory: category,
					sourceCombo: combo,
					page: result.page,
					pageNumber: result.pageNumber,
					sortBy,
					sortDirection,
					category,
					combo,
				})
				return
			}

			if (status === "open") {
				void setSearchParams({
					openSortBy: nextSortBy,
					openSortDirection: nextSortDirection,
					openPage: nextPageNumber,
					positionsCategory: nextCategory ?? null,
					positionsCombo: nextCombo,
				})
			} else {
				void setSearchParams({
					closedSortBy: nextSortBy,
					closedSortDirection: nextSortDirection,
					closedPage: nextPageNumber,
					positionsCategory: nextCategory ?? null,
					positionsCombo: nextCombo,
				})
			}

			const result = await getTraderPositionsPageAction({
				address,
				status,
				pageNumber: nextPageNumber,
				sortBy: nextSortBy,
				sortDirection: nextSortDirection,
				category: nextCategory,
				combo: nextCombo,
			})

			setTableState({
				sourcePage: page,
				sourcePageNumber: pageNumber,
				sourceSortBy: sortBy,
				sourceSortDirection: sortDirection,
				sourceCategory: category,
				sourceCombo: combo,
				page: result.page,
				pageNumber: result.pageNumber,
				sortBy: nextSortBy,
				sortDirection: nextSortDirection,
				category: nextCategory,
				combo: nextCombo,
			})
		})
	}, [address, category, combo, page, pageNumber, ranked, setSearchParams, sortBy, sortDirection, startTransition, status])

	const handleSortChange = useCallback((nextSortBy: TraderPositionSortBy) => {
		const nextSortDirection: TraderSortDirection =
			nextSortBy === currentSortBy && currentSortDirection === "desc" ? "asc" : "desc"

		loadPage(1, nextSortBy, nextSortDirection, currentCategory, currentCombo)
	}, [currentCategory, currentCombo, currentSortBy, currentSortDirection, loadPage])

	const handleSelectSortChange = useCallback((nextSortBy: TraderPositionSortBy) => {
		if (nextSortBy === currentSortBy) return
		posthog.capture("trader_positions_sorted", {
			sort_by: nextSortBy,
			sort_direction: "desc",
			status,
		})
		loadPage(1, nextSortBy, "desc", currentCategory, currentCombo)
	}, [currentCategory, currentCombo, currentSortBy, loadPage, status])

	const handleDirectionToggle = useCallback(() => {
		const nextDirection: TraderSortDirection = currentSortDirection === "desc" ? "asc" : "desc"
		posthog.capture("trader_positions_sorted", {
			sort_by: currentSortBy,
			sort_direction: nextDirection,
			status,
		})
		loadPage(1, currentSortBy, nextDirection, currentCategory, currentCombo)
	}, [currentCategory, currentCombo, currentSortBy, currentSortDirection, loadPage, status])

	const handleCategoryChange = useCallback((value: string | null) => {
		const nextCategory = !value || value === ALL_CATEGORIES_VALUE
			? undefined
			: (POLYMARKET_CATEGORIES.find((option) => option === value) ?? undefined)
		if (nextCategory === currentCategory) return
		posthog.capture("trader_positions_category_filtered", {
			category: nextCategory ?? "all",
			status,
		})
		loadPage(1, currentSortBy, currentSortDirection, nextCategory, currentCombo)
	}, [currentCategory, currentCombo, currentSortBy, currentSortDirection, loadPage, status])

	const handleComboChange = useCallback((value: string | null) => {
		const nextCombo = comboFilterOptions.find((option) => option.value === value)?.value ?? "all"
		if (nextCombo === currentCombo) return
		posthog.capture("trader_positions_combo_filtered", {
			combo: nextCombo,
			status,
		})
		loadPage(1, currentSortBy, currentSortDirection, currentCategory, nextCombo)
	}, [currentCategory, currentCombo, currentSortBy, currentSortDirection, loadPage, status])

	const sortOptions = useMemo(() => getSortOptions(status), [status])
	const sortOptionValues = useMemo(
		() => new Set<TraderPositionSortBy>(sortOptions.map((o) => o.value)),
		[sortOptions],
	)

	const selectSortValue: TraderPositionSortBy | null = sortOptionValues.has(currentSortBy)
		? currentSortBy
		: null

	const columns = useMemo(
		() => buildColumns(address, status, currentSortBy, currentSortDirection, handleSortChange, !ranked),
		[address, handleSortChange, currentSortBy, currentSortDirection, status, ranked],
	)

	const data = useMemo(() => {
		if (showUnknown) {
			return currentPage.data
		}
		return currentPage.data.filter((entry) => entry.question)
	}, [currentPage.data, showUnknown])

	const toolbarRight = (
		<div className="flex items-center gap-3">
			{hasUnknownMarkets ? (
				<ShowUnknownMarketsToggle show={showUnknown} onToggle={setShowUnknown} />
			) : null}
			{!ranked ? (
				<Select
					value={currentCategory ?? ALL_CATEGORIES_VALUE}
					onValueChange={handleCategoryChange}
				>
					<SelectTrigger size="sm" aria-label="Filter by category">
						<span className="text-muted-foreground">Category:</span>
						<SelectValue placeholder="All">
							{(value) => (value && value !== ALL_CATEGORIES_VALUE ? value : "All")}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_CATEGORIES_VALUE}>All</SelectItem>
						{POLYMARKET_CATEGORIES.map((option) => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			) : null}
			{!ranked ? (
				<Select value={currentCombo} onValueChange={handleComboChange}>
					<SelectTrigger size="sm" aria-label="Filter by market type">
						<span className="text-muted-foreground">Type:</span>
						<SelectValue placeholder="All">
							{(value) => comboFilterOptions.find((option) => option.value === value)?.label ?? "All"}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{comboFilterOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			) : null}
			{!ranked ? (
				<div className="flex items-center gap-1">
					<Select
						value={selectSortValue}
						onValueChange={(value) => {
							if (value) handleSelectSortChange(value as TraderPositionSortBy)
						}}
					>
						<SelectTrigger size="sm" aria-label="Sort by">
							<span className="text-muted-foreground">Sort:</span>
							<SelectValue placeholder="Custom">
								{(value) => sortOptions.find((option) => option.value === value)?.label ?? "Custom"}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{sortOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<TooltipWrapper content={currentSortDirection === "desc" ? "Sorted descending" : "Sorted ascending"}>
						<Button
							variant="outline"
							size="icon"
							className="size-7"
							onClick={handleDirectionToggle}
							aria-label={`Toggle sort direction (currently ${currentSortDirection})`}
						>
							{currentSortDirection === "desc" ? (
								<ArrowDownIcon className="size-4" />
							) : (
								<ArrowUpIcon className="size-4" />
							)}
						</Button>
					</TooltipWrapper>
				</div>
			) : null}
			{onRefresh ? (
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						startTransition(async () => {
							await onRefresh()
						})
					}}
					disabled={isPending}
				>
					<RefreshCwIcon data-icon="inline-start" />
					Refresh
				</Button>
			) : null}
		</div>
	)

	return (
		<DataTable
			tableName="trader_positions"
			toolbarLeft={tabs ?? <TraderTabs />}
			toolbarRight={toolbarRight}
			columns={columns}
			data={data}
			storageKey="positions-table"
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage={
				ranked === "wins"
					? "No winning positions to show."
					: ranked === "losses"
						? "No losing positions to show."
						: "No positions to show."
			}
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

				loadPage(nextPageNumber, currentSortBy, currentSortDirection, currentCategory, currentCombo)
			}}
		/>
	)
}
