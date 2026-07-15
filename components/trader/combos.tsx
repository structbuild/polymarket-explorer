"use client"
/* eslint-disable @next/next/no-img-element */

import type { ColumnDef, Row, VisibilityState } from "@tanstack/react-table"
import { flexRender } from "@tanstack/react-table"
import type { Route } from "next"
import Link from "next/link"
import {
	ArrowDownIcon,
	ArrowUpIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	RefreshCwIcon,
} from "lucide-react"
import { Fragment, type ReactNode, useCallback, useMemo, useState, useTransition } from "react"
import { useQueryStates } from "nuqs"
import posthog from "posthog-js"

import { getTraderCombosPageAction } from "@/app/actions"
import {
	normalizeComboLegs,
	rowComboType,
} from "@/lib/combo"
import {
	formatDateShort,
	formatNumber,
	formatPriceCents,
	formatTime,
	pnlColorClass,
	readTotalPnlPct,
	readTotalPnlUsd,
} from "@/lib/format"
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url"
import type { TraderComboEntry } from "@/lib/struct/queries/combos"
import type { PaginatedResource } from "@/lib/struct/types"
import { traderSearchParamParsers } from "@/lib/trader-search-params"
import {
	defaultTraderComboSortBy,
	maxTraderPageNumber,
	type TraderComboSortBy,
	type TraderComboStatusFilter,
	type TraderSortDirection,
} from "@/lib/trader-search-params-shared"
import { cn, truncateMarketTitle } from "@/lib/utils"

import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { ComboLegsList, ComboStatusBadge, ComboTypeBadge } from "../ui/combo"
import { DataTable } from "../ui/data-table"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select"
import { SortableHeader } from "../ui/sortable-header"
import { TableCell, TableRow } from "../ui/table"
import { TooltipWrapper } from "../ui/tooltip"
import { TraderTabs } from "./trader-tabs"

const defaultColumnVisibility: VisibilityState = {
	buys: false,
	fees: false,
	implied: false,
}

const sortOptions: { value: TraderComboSortBy; label: string }[] = [
	{ value: "total_pnl_usd", label: "PnL ($)" },
	{ value: "realized_pnl_usd", label: "Realized PnL" },
	{ value: "unrealized_pnl_usd", label: "Unrealized PnL" },
	{ value: "total_buy_usd", label: "Buys" },
	{ value: "last_trade_at", label: "Last Active" },
	{ value: "first_trade_at", label: "First Trade" },
	{ value: "title", label: "Title" },
	{ value: "end_date", label: "End Date" },
	{ value: "redeemable", label: "Redeemable" },
]

const statusFilterOptions: { value: TraderComboStatusFilter; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "open", label: "Open" },
	{ value: "closed", label: "Closed" },
	{ value: "resolved_win", label: "Won" },
	{ value: "resolved_loss", label: "Lost" },
	{ value: "redeemable", label: "Redeemable" },
	{ value: "redeemed", label: "Redeemed" },
]

function buildColumns(
	currentSortBy: TraderComboSortBy,
	currentSortDirection: TraderSortDirection,
	onSortChange: (sortBy: TraderComboSortBy) => void,
	expandedIds: ReadonlySet<string>,
	onToggleExpand: (conditionId: string) => void,
): ColumnDef<TraderComboEntry, unknown>[] {
	const columnHeader = (sortBy: TraderComboSortBy, label: string) => {
		function ComboSortableHeader() {
			return (
				<SortableHeader
					table="trader_combos"
					sortBy={sortBy}
					currentSortBy={currentSortBy}
					currentSortDirection={currentSortDirection}
					onSortChange={onSortChange}
				>
					{label}
				</SortableHeader>
			)
		}
		return ComboSortableHeader
	}

	return [
		{
			id: "expand",
			header: "",
			size: 44,
			enableHiding: false,
			cell: ({ row }) => {
				const conditionId = row.original.condition_id
				const isExpanded = expandedIds.has(conditionId)
				return (
					<Button
						variant="ghost"
						size="icon"
						className="size-7"
						aria-expanded={isExpanded}
						aria-label={isExpanded ? "Collapse combo details" : "Expand combo details"}
						onClick={(event) => {
							event.preventDefault()
							event.stopPropagation()
							onToggleExpand(conditionId)
						}}
					>
						{isExpanded ? (
							<ChevronDownIcon className="size-4" />
						) : (
							<ChevronRightIcon className="size-4" />
						)}
					</Button>
				)
			},
		},
		{
			id: "market",
			meta: { title: "Combo", cellClassName: "max-w-0 overflow-hidden" },
			header: columnHeader("title", "Combo"),
			size: 480,
			cell: ({ row }) => {
				const combo = row.original
				const position = combo.position
				const question = position?.question || position?.title || "Unknown Combo"
				const displayTitle = truncateMarketTitle(question)
				const href = (`/combos/${combo.condition_id}` as Route)
				const comboType = rowComboType(position)
				return (
					<div className="flex min-w-0 items-center gap-3">
						{position?.image_url ? (
							<img
								className="size-10 shrink-0 rounded-md object-cover"
								alt={question}
								src={normalizePolymarketS3ImageUrl(position.image_url) ?? ""}
							/>
						) : (
							<div className="size-10 shrink-0 rounded-md bg-muted" />
						)}
						<div className="min-w-0 flex-1 space-y-0.5">
							<Link
								href={href}
								prefetch={false}
								className="block truncate text-base font-medium text-foreground underline-offset-4 hover:underline"
								title={question}
							>
								{displayTitle}
							</Link>
							<div className="flex flex-wrap items-center gap-1.5">
								{comboType ? <ComboTypeBadge comboType={comboType} /> : null}
								<ComboStatusBadge status={combo.status} />
								<Badge variant="secondary">
									{combo.leg_count} {combo.leg_count === 1 ? "leg" : "legs"}
								</Badge>
								{combo.legs_won > 0 ? (
									<Badge variant="positive">{combo.legs_won} won</Badge>
								) : null}
								{combo.legs_lost > 0 ? (
									<Badge variant="negative">{combo.legs_lost} lost</Badge>
								) : null}
								{combo.legs_pending > 0 ? (
									<Badge variant="secondary">{combo.legs_pending} pending</Badge>
								) : null}
								{position?.outcome ? (
									<Badge
										variant={
											position.outcome_index === 0
												? "positive"
												: position.outcome_index === 1
													? "negative"
													: "secondary"
										}
									>
										{position.outcome}
									</Badge>
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
			header: () => <span>Entry / Current</span>,
			size: 140,
			cell: ({ row }) => {
				const position = row.original.position
				const isEntryUnknown = position?.avg_entry_price == null
				return (
					<p>
						{isEntryUnknown ? (
							<span className="text-muted-foreground">—</span>
						) : (
							formatPriceCents(position.avg_entry_price)
						)}{" "}
						<span className="text-muted-foreground">/</span>{" "}
						{formatPriceCents(position?.current_price ?? position?.avg_exit_price ?? 0)}
					</p>
				)
			},
		},
		{
			id: "pnl",
			meta: { title: "PnL" },
			header: columnHeader("total_pnl_usd", "PnL"),
			size: 150,
			cell: ({ row }) => {
				const position = row.original.position
				const pnl = readTotalPnlUsd(position)
				const pnlPct = readTotalPnlPct(position)
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
		{
			id: "implied",
			meta: { title: "Implied" },
			header: () => <span>Implied</span>,
			size: 110,
			cell: ({ row }) => {
				const implied = row.original.implied_probability
				if (implied == null) return <p className="text-muted-foreground">—</p>
				return (
					<p className="tabular-nums">
						{formatNumber(implied * 100, { decimals: 1 })}%
					</p>
				)
			},
		},
		{
			id: "payout",
			meta: { title: "Payout" },
			header: () => <span>Payout if won</span>,
			size: 130,
			cell: ({ row }) => {
				const payout = row.original.potential_payout
				if (payout == null) return <p className="text-muted-foreground">—</p>
				return (
					<p className="tabular-nums">
						{formatNumber(payout, { currency: true, compact: true })}
					</p>
				)
			},
		},
		{
			id: "buys",
			meta: { title: "Buys" },
			header: columnHeader("total_buy_usd", "Buys"),
			size: 140,
			cell: ({ row }) => {
				const usd = row.original.position?.total_buy_usd ?? 0
				const count = row.original.position?.total_buys ?? 0
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
			id: "fees",
			meta: { title: "Fees" },
			header: () => <span>Fees</span>,
			size: 110,
			cell: ({ row }) => (
				<p>{formatNumber(row.original.position?.total_fees ?? 0, { currency: true })}</p>
			),
		},
		{
			id: "last_trade_at",
			meta: { title: "Last Active" },
			header: columnHeader("last_trade_at", "Last Active"),
			size: 150,
			cell: ({ row }) => {
				const lastTradeAtMs = row.original.position?.last_trade_at
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
	]
}

type Props = {
	address: string
	page: PaginatedResource<TraderComboEntry, number>
	pageNumber: number
	sortBy: TraderComboSortBy
	sortDirection: TraderSortDirection
	status: TraderComboStatusFilter
	tabs?: ReactNode
	onRefresh?: () => Promise<void>
}

export default function TraderCombos({
	address,
	page,
	pageNumber,
	sortBy,
	sortDirection,
	status,
	tabs,
	onRefresh,
}: Props) {
	const [isPending, startTransition] = useTransition()
	const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
	const [tableState, setTableState] = useState(() => ({
		sourcePage: page,
		sourcePageNumber: pageNumber,
		sourceSortBy: sortBy,
		sourceSortDirection: sortDirection,
		sourceStatus: status,
		page,
		pageNumber,
		sortBy,
		sortDirection,
		status,
	}))
	const [, setSearchParams] = useQueryStates(traderSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: true,
		startTransition,
	})

	const hasLocalTableState =
		tableState.sourcePage === page &&
		tableState.sourcePageNumber === pageNumber &&
		tableState.sourceSortBy === sortBy &&
		tableState.sourceSortDirection === sortDirection &&
		tableState.sourceStatus === status
	const currentPage = hasLocalTableState ? tableState.page : page
	const currentPageNumber = hasLocalTableState ? tableState.pageNumber : pageNumber
	const currentSortBy = hasLocalTableState ? tableState.sortBy : sortBy
	const currentSortDirection = hasLocalTableState ? tableState.sortDirection : sortDirection
	const currentStatus = hasLocalTableState ? tableState.status : status

	const loadPage = useCallback(
		(
			nextPageNumber: number,
			nextSortBy: TraderComboSortBy,
			nextSortDirection: TraderSortDirection,
			nextStatus: TraderComboStatusFilter,
		) => {
			startTransition(async () => {
				void setSearchParams({
					combosSortBy: nextSortBy,
					combosSortDirection: nextSortDirection,
					combosPage: nextPageNumber,
					combosStatus: nextStatus,
				})

				const result = await getTraderCombosPageAction({
					address,
					pageNumber: nextPageNumber,
					sortBy: nextSortBy,
					sortDirection: nextSortDirection,
					status: nextStatus,
				})

				setExpandedIds(new Set())
				setTableState({
					sourcePage: page,
					sourcePageNumber: pageNumber,
					sourceSortBy: sortBy,
					sourceSortDirection: sortDirection,
					sourceStatus: status,
					page: result.page,
					pageNumber: result.pageNumber,
					sortBy: nextSortBy,
					sortDirection: nextSortDirection,
					status: nextStatus,
				})
			})
		},
		[address, page, pageNumber, setSearchParams, sortBy, sortDirection, startTransition, status],
	)

	const handleSortChange = useCallback(
		(nextSortBy: TraderComboSortBy) => {
			const nextSortDirection: TraderSortDirection =
				nextSortBy === currentSortBy && currentSortDirection === "desc" ? "asc" : "desc"
			loadPage(1, nextSortBy, nextSortDirection, currentStatus)
		},
		[currentSortBy, currentSortDirection, currentStatus, loadPage],
	)

	const handleSelectSortChange = useCallback(
		(nextSortBy: TraderComboSortBy) => {
			if (nextSortBy === currentSortBy) return
			posthog.capture("trader_combos_sorted", {
				sort_by: nextSortBy,
				sort_direction: "desc",
			})
			loadPage(1, nextSortBy, "desc", currentStatus)
		},
		[currentSortBy, currentStatus, loadPage],
	)

	const handleDirectionToggle = useCallback(() => {
		const nextDirection: TraderSortDirection = currentSortDirection === "desc" ? "asc" : "desc"
		posthog.capture("trader_combos_sorted", {
			sort_by: currentSortBy,
			sort_direction: nextDirection,
		})
		loadPage(1, currentSortBy, nextDirection, currentStatus)
	}, [currentSortBy, currentSortDirection, currentStatus, loadPage])

	const handleStatusChange = useCallback(
		(value: string | null) => {
			const nextStatus =
				statusFilterOptions.find((option) => option.value === value)?.value ?? "all"
			if (nextStatus === currentStatus) return
			posthog.capture("trader_combos_status_filtered", { status: nextStatus })
			loadPage(1, currentSortBy, currentSortDirection, nextStatus)
		},
		[currentSortBy, currentSortDirection, currentStatus, loadPage],
	)

	const handleToggleExpand = useCallback((conditionId: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev)
			if (next.has(conditionId)) {
				next.delete(conditionId)
			} else {
				next.add(conditionId)
			}
			return next
		})
	}, [])

	const columns = useMemo(
		() =>
			buildColumns(
				currentSortBy,
				currentSortDirection,
				handleSortChange,
				expandedIds,
				handleToggleExpand,
			),
		[currentSortBy, currentSortDirection, expandedIds, handleSortChange, handleToggleExpand],
	)

	const renderRow = useCallback(
		(row: Row<TraderComboEntry>, columnCount: number): ReactNode => {
			const isExpanded = expandedIds.has(row.original.condition_id)
			const visibleCells = row.getVisibleCells()
			return (
				<Fragment>
					<TableRow className="bg-card text-foreground/90 hover:bg-card">
						{visibleCells.map((cell) => (
							<TableCell
								key={cell.id}
								className={cn(
									(cell.column.columnDef.meta as { cellClassName?: string } | undefined)
										?.cellClassName,
								)}
							>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</TableCell>
						))}
					</TableRow>
					{isExpanded ? (
						<TableRow className="bg-muted/20 hover:bg-muted/20">
							<TableCell colSpan={columnCount} className="px-4 py-4">
								<ComboExpandedDetails combo={row.original} />
							</TableCell>
						</TableRow>
					) : null}
				</Fragment>
			)
		},
		[expandedIds],
	)

	const selectSortValue: TraderComboSortBy | null =
		sortOptions.some((option) => option.value === currentSortBy)
			? currentSortBy
			: defaultTraderComboSortBy

	const toolbarRight = (
		<div className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto">
			<Select value={currentStatus} onValueChange={handleStatusChange}>
				<SelectTrigger size="sm" aria-label="Filter by combo status">
					<span className="text-muted-foreground">Status:</span>
					<SelectValue placeholder="All">
						{(value) =>
							statusFilterOptions.find((option) => option.value === value)?.label ?? "All"
						}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{statusFilterOptions.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<div className="flex items-center gap-1">
				<Select
					value={selectSortValue}
					onValueChange={(value) => {
						if (value) handleSelectSortChange(value as TraderComboSortBy)
					}}
				>
					<SelectTrigger size="sm" aria-label="Sort by">
						<span className="text-muted-foreground">Sort:</span>
						<SelectValue placeholder="Custom">
							{(value) =>
								sortOptions.find((option) => option.value === value)?.label ?? "Custom"
							}
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
				<TooltipWrapper
					content={
						currentSortDirection === "desc" ? "Sorted descending" : "Sorted ascending"
					}
				>
					<Button
						variant="outline"
						size="icon"
						className="size-7 shrink-0"
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
			{onRefresh ? (
				<Button
					variant="outline"
					size="sm"
					className="shrink-0"
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
			tableName="trader_combos"
			toolbarLeft={tabs ?? <TraderTabs />}
			toolbarRight={toolbarRight}
			columns={columns}
			data={currentPage.data}
			renderRow={renderRow}
			storageKey="trader-combos-table"
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage="No combos to show."
			emptyClassName="py-24"
			columnLayout="fixed"
			paginationMode="server"
			pageIndex={currentPageNumber - 1}
			pageSize={currentPage.pageSize}
			hasNextPage={currentPage.hasMore}
			isLoading={isPending}
			onPageIndexChange={(nextPageIndex) => {
				const nextPageNumber = Math.min(Math.max(nextPageIndex + 1, 1), maxTraderPageNumber)
				if (nextPageNumber === currentPageNumber) return
				loadPage(nextPageNumber, currentSortBy, currentSortDirection, currentStatus)
			}}
		/>
	)
}

function ComboExpandedDetails({ combo }: { combo: TraderComboEntry }) {
	const legs = normalizeComboLegs(combo.legs)
	const position = combo.position

	return (
		<div className="flex flex-col gap-4 pl-8 sm:pl-12">
			<div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
				{combo.implied_probability != null ? (
					<span>
						Implied odds{" "}
						<span className="font-medium text-foreground tabular-nums">
							{formatNumber(combo.implied_probability * 100, { decimals: 1 })}%
						</span>
					</span>
				) : null}
				{combo.potential_payout != null ? (
					<span>
						Payout if won{" "}
						<span className="font-medium text-foreground tabular-nums">
							{formatNumber(combo.potential_payout, { currency: true, compact: true })}
						</span>
					</span>
				) : null}
				{position?.current_shares_balance != null ? (
					<span>
						Shares{" "}
						<span className="font-medium text-foreground tabular-nums">
							{formatNumber(position.current_shares_balance, { decimals: 2 })}
						</span>
					</span>
				) : null}
				{position?.current_value != null ? (
					<span>
						Value{" "}
						<span className="font-medium text-foreground tabular-nums">
							{formatNumber(position.current_value, { currency: true, compact: true })}
						</span>
					</span>
				) : null}
			</div>
			<div className="max-w-xl">
				<p className="mb-2 text-sm font-medium text-foreground">Legs</p>
				{legs.length > 0 ? (
					<ComboLegsList legs={legs} />
				) : (
					<p className="text-sm text-muted-foreground">No leg breakdown available.</p>
				)}
			</div>
		</div>
	)
}
