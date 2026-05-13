"use client";

import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { Facehash } from "facehash";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SortableHeader } from "@/components/ui/sortable-header";
import { dateCol, durationCol, numericCol } from "@/components/ui/table-columns";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { Volume } from "@/components/ui/volume";
import { facehashColorClasses } from "@/lib/facehash";
import { formatNumber, pnlColorClass } from "@/lib/format";
import type { TraderLeaderboardEntry } from "@/lib/struct/trader-leaderboard";
import {
	DEFAULT_TRADER_LEADERBOARD_SORT,
	DEFAULT_TRADER_LEADERBOARD_SORT_DIRECTION,
	isLeaderboardSortSupported,
	type LeaderboardScope,
	type TraderLeaderboardSortDirection,
	type TraderLeaderboardSortKey,
} from "@/lib/trader-leaderboard-sort";
import { cn, getTraderDisplayName, normalizeWalletAddress, truncateAddress } from "@/lib/utils";
import { TRADER_TABLE_COLUMN_SIZES } from "./traders-table-columns";

type NumericField = Extract<
	keyof TraderLeaderboardEntry,
	| "realized_pnl_usd"
	| "open_positions_value"
	| "open_position_count"
	| "events_traded"
	| "markets_traded"
	| "markets_won"
	| "markets_lost"
	| "market_win_rate_pct"
	| "total_volume_usd"
	| "buy_volume_usd"
	| "sell_volume_usd"
	| "redemption_volume_usd"
	| "merge_volume_usd"
	| "total_buys"
	| "total_sells"
	| "total_redemptions"
	| "total_merges"
	| "total_trades"
	| "total_fees"
	| "avg_win_usd"
	| "avg_loss_usd"
	| "profit_factor"
	| "total_wins_usd"
	| "total_losses_usd"
	| "avg_hold_time_seconds"
	| "best_trade_pnl_usd"
	| "worst_trade_pnl_usd"
	| "maker_rebate_count"
	| "maker_rebate_usd"
	| "reward_count"
	| "reward_usd"
	| "yield_count"
	| "yield_usd"
>;

export type TradersTableScope = LeaderboardScope;

type SortContext = {
	sort: TraderLeaderboardSortKey;
	direction: TraderLeaderboardSortDirection;
	scope: TradersTableScope;
	onSortChange: (key: TraderLeaderboardSortKey) => void;
};

type NumericColumnSpec = {
	id: string;
	title: string;
	field: NumericField;
	sortKey?: TraderLeaderboardSortKey;
	size: number;
	format: Parameters<typeof formatNumber>[1];
	colorizePnl?: boolean;
};

type VolumeColumnSpec = {
	id: string;
	title: string;
	field: NumericField;
	sortKey?: TraderLeaderboardSortKey;
	size: number;
};

type DateColumnSpec = {
	id: string;
	title: string;
	field: Extract<keyof TraderLeaderboardEntry, "first_trade_at" | "last_trade_at">;
	sortKey?: TraderLeaderboardSortKey;
	size: number;
};

type DurationColumnSpec = {
	id: string;
	title: string;
	field: "avg_hold_time_seconds";
	sortKey?: TraderLeaderboardSortKey;
	size: number;
};

function renderSortableHeader(
	title: string,
	sortKey: TraderLeaderboardSortKey | undefined,
	sortCtx: SortContext,
): React.ReactNode {
	if (!sortKey || !isLeaderboardSortSupported(sortKey, sortCtx.scope)) {
		return title;
	}
	return (
		<SortableHeader<TraderLeaderboardSortKey>
			sortBy={sortKey}
			currentSortBy={sortCtx.sort}
			currentSortDirection={sortCtx.direction}
			onSortChange={sortCtx.onSortChange}
		>
			{title}
		</SortableHeader>
	);
}

function numericColumn(spec: NumericColumnSpec, sortCtx: SortContext): ColumnDef<TraderLeaderboardEntry, unknown> {
	return numericCol<TraderLeaderboardEntry>({
		id: spec.id,
		title: spec.title,
		size: spec.size,
		format: spec.format,
		colorizePnl: spec.colorizePnl,
		accessor: (row) => row[spec.field] as number | null | undefined,
		header: () => renderSortableHeader(spec.title, spec.sortKey, sortCtx),
	});
}

function volumeColumn(spec: VolumeColumnSpec, sortCtx: SortContext): ColumnDef<TraderLeaderboardEntry, unknown> {
	return {
		id: spec.id,
		meta: { title: spec.title },
		header: () => renderSortableHeader(spec.title, spec.sortKey, sortCtx),
		size: spec.size,
		cell: ({ row }) => (
			<Volume
				usd={(row.original[spec.field] as number | null | undefined) ?? null}
				shares={null}
				className="text-foreground/90 tabular-nums"
			/>
		),
	};
}

function dateColumn(spec: DateColumnSpec, sortCtx: SortContext): ColumnDef<TraderLeaderboardEntry, unknown> {
	return dateCol<TraderLeaderboardEntry>({
		id: spec.id,
		title: spec.title,
		size: spec.size,
		accessor: (row) => row[spec.field],
		header: () => renderSortableHeader(spec.title, spec.sortKey, sortCtx),
	});
}

function durationColumn(
	spec: DurationColumnSpec,
	sortCtx: SortContext,
): ColumnDef<TraderLeaderboardEntry, unknown> {
	return durationCol<TraderLeaderboardEntry>({
		id: spec.id,
		title: spec.title,
		size: spec.size,
		accessor: (row) => row[spec.field],
		header: () => renderSortableHeader(spec.title, spec.sortKey, sortCtx),
	});
}

type UsdWithCountColumnSpec = {
	id: string;
	title: string;
	usdField: NumericField;
	countField: NumericField;
	sortKey?: TraderLeaderboardSortKey;
	size: number;
};

function usdWithCountColumn(
	spec: UsdWithCountColumnSpec,
	sortCtx: SortContext,
): ColumnDef<TraderLeaderboardEntry, unknown> {
	return {
		id: spec.id,
		meta: { title: spec.title },
		header: () => renderSortableHeader(spec.title, spec.sortKey, sortCtx),
		size: spec.size,
		cell: ({ row }) => {
			const usd = (row.original[spec.usdField] as number | null | undefined) ?? null;
			const count = (row.original[spec.countField] as number | null | undefined) ?? null;
			const usdLabel = usd != null ? formatNumber(usd, { compact: true, currency: true }) : "—";
			const countLabel = count != null ? formatNumber(count, { decimals: 0, compact: true }) : null;
			return (
				<p className="tabular-nums text-foreground/90">
					<span>{usdLabel}</span>
					{countLabel ? (
						<span className="text-muted-foreground"> · {countLabel}</span>
					) : null}
				</p>
			);
		},
	};
}

function buildColumns(
	rankOffset: number,
	sortCtx: SortContext,
): ColumnDef<TraderLeaderboardEntry, unknown>[] {
	const numericFormat = {
		count: { decimals: 0, compact: true } as Parameters<typeof formatNumber>[1],
		integer: { decimals: 0 } as Parameters<typeof formatNumber>[1],
		currency: { compact: true, currency: true } as Parameters<typeof formatNumber>[1],
		percent: { percent: true } as Parameters<typeof formatNumber>[1],
		factor: { decimals: 2 } as Parameters<typeof formatNumber>[1],
	};

	return [
		{
			id: "rank",
			meta: { title: "Rank" },
			header: "#",
			size: TRADER_TABLE_COLUMN_SIZES.rank,
			enableHiding: false,
			cell: ({ row }) => (
				<p className="text-muted-foreground tabular-nums">{rankOffset + row.index + 1}</p>
			),
		},
		{
			id: "trader",
			meta: {
				title: "Trader",
				cellClassName: "whitespace-normal align-top",
			},
			header: "Trader",
			size: TRADER_TABLE_COLUMN_SIZES.trader,
			enableHiding: false,
			cell: ({ row }) => {
				const entry = row.original;
				const address = normalizeWalletAddress(entry.trader.address) ?? entry.trader.address;
				const displayName = getTraderDisplayName(entry.trader);

				return (
					<div className="flex w-full min-w-0 items-center gap-3">
						{entry.trader.profile_image ? (
							<Avatar size="lg">
								<AvatarImage className="rounded-sm" src={entry.trader.profile_image} alt={`${displayName} avatar`} />
								<AvatarFallback className="rounded-sm">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
							</Avatar>
						) : (
							<Facehash
								className="size-10 shrink-0 overflow-hidden rounded-sm border"
								colorClasses={facehashColorClasses}
								name={address}
							/>
						)}
						<div className="max-w-48 pr-6 min-w-0 flex-1 space-y-0.5">
							<div className="max-w-full truncate">
								<TooltipWrapper content={displayName}>
									<Link
										href={`/traders/${address}` as Route}
										prefetch={false}
										className="font-medium text-foreground underline-offset-4 hover:underline"
									>
										{displayName}
									</Link>
								</TooltipWrapper>
							</div>
							<p className="truncate text-sm text-muted-foreground">{truncateAddress(address)}</p>
						</div>
					</div>
				);
			},
		},
		{
			id: "pnl",
			meta: { title: "Realized PnL" },
			header: () => renderSortableHeader("Realized PnL", "realized_pnl_usd", sortCtx),
			size: TRADER_TABLE_COLUMN_SIZES.pnl,
			enableHiding: false,
			cell: ({ row }) => {
				const pnl = row.original.realized_pnl_usd ?? 0;
				return (
					<p className={cn("tabular-nums font-medium", pnlColorClass(pnl))}>
						{formatNumber(pnl, numericFormat.currency)}
					</p>
				);
			},
		},
		{
			id: "openPositions",
			meta: { title: "Open Positions" },
			header: () => renderSortableHeader("Open Positions", "unrealized_pnl", sortCtx),
			size: TRADER_TABLE_COLUMN_SIZES.openPositions,
			cell: ({ row }) => {
				const value = row.original.open_positions_value;
				const count = row.original.open_position_count;
				if (value == null && count == null) {
					return <p className="tabular-nums text-muted-foreground">—</p>;
				}
				const isDust = value != null && value !== 0 && Math.abs(value) < 0.01;
				const isMuted = value == null || value === 0 || isDust;
				const valueLabel = value == null || value === 0
					? "$0.00"
					: isDust
						? "<$0.01"
						: formatNumber(value, numericFormat.currency);
				const countLabel = count != null
					? formatNumber(count, { decimals: 0, compact: true })
					: null;
				return (
					<p className="tabular-nums">
						<span className={isMuted ? "text-muted-foreground" : "text-foreground/90"}>
							{valueLabel}
						</span>
						{countLabel ? (
							<span className="text-muted-foreground"> · {countLabel}</span>
						) : null}
					</p>
				);
			},
		},
		volumeColumn({ id: "volume", title: "Volume", field: "total_volume_usd", sortKey: "total_volume_usd", size: TRADER_TABLE_COLUMN_SIZES.volume }, sortCtx),
		numericColumn({ id: "markets", title: "Markets", field: "markets_traded", sortKey: "markets_traded", size: TRADER_TABLE_COLUMN_SIZES.markets, format: numericFormat.integer }, sortCtx),
		numericColumn({ id: "events", title: "Events", field: "events_traded", sortKey: "events_traded", size: 96, format: numericFormat.integer }, sortCtx),
		numericColumn({ id: "marketsWon", title: "Won", field: "markets_won", sortKey: "markets_won", size: 88, format: numericFormat.integer }, sortCtx),
		numericColumn({ id: "marketsLost", title: "Lost", field: "markets_lost", sortKey: "markets_lost", size: 88, format: numericFormat.integer }, sortCtx),
		numericColumn({ id: "winRate", title: "Win Rate", field: "market_win_rate_pct", sortKey: "market_win_rate_pct", size: TRADER_TABLE_COLUMN_SIZES.winRate, format: numericFormat.percent }, sortCtx),
		numericColumn({ id: "avgWin", title: "Avg Win", field: "avg_win_usd", sortKey: "avg_win_usd", size: 112, format: numericFormat.currency, colorizePnl: true }, sortCtx),
		numericColumn({ id: "avgLoss", title: "Avg Loss", field: "avg_loss_usd", sortKey: "avg_loss_usd", size: 112, format: numericFormat.currency, colorizePnl: true }, sortCtx),
		numericColumn({ id: "totalWins", title: "Total Wins", field: "total_wins_usd", sortKey: "total_wins_usd", size: 120, format: numericFormat.currency, colorizePnl: true }, sortCtx),
		numericColumn({ id: "totalLosses", title: "Total Losses", field: "total_losses_usd", sortKey: "total_losses_usd", size: 120, format: numericFormat.currency, colorizePnl: true }, sortCtx),
		numericColumn({ id: "profitFactor", title: "Profit Factor", field: "profit_factor", sortKey: "profit_factor", size: 120, format: numericFormat.factor }, sortCtx),
		numericColumn({ id: "trades", title: "Trades", field: "total_trades", size: TRADER_TABLE_COLUMN_SIZES.trades, format: numericFormat.count }, sortCtx),
		usdWithCountColumn({ id: "buys", title: "Buys", usdField: "buy_volume_usd", countField: "total_buys", sortKey: "buy_volume_usd", size: 144 }, sortCtx),
		usdWithCountColumn({ id: "sells", title: "Sells", usdField: "sell_volume_usd", countField: "total_sells", sortKey: "sell_volume_usd", size: 144 }, sortCtx),
		usdWithCountColumn({ id: "redemptions", title: "Redemptions", usdField: "redemption_volume_usd", countField: "total_redemptions", sortKey: "redemption_volume_usd", size: 160 }, sortCtx),
		usdWithCountColumn({ id: "merges", title: "Merges", usdField: "merge_volume_usd", countField: "total_merges", sortKey: "merge_volume_usd", size: 144 }, sortCtx),
		numericColumn({ id: "fees", title: "Fees", field: "total_fees", sortKey: "total_fees", size: 112, format: numericFormat.currency }, sortCtx),
		numericColumn({ id: "bestTradePnl", title: "Best Win", field: "best_trade_pnl_usd", sortKey: "best_win", size: TRADER_TABLE_COLUMN_SIZES.bestTradePnl, format: numericFormat.currency, colorizePnl: true }, sortCtx),
		numericColumn({ id: "worstLoss", title: "Worst Loss", field: "worst_trade_pnl_usd", sortKey: "worst_loss", size: 128, format: numericFormat.currency, colorizePnl: true }, sortCtx),
		usdWithCountColumn({ id: "makerRebates", title: "Maker Rebates", usdField: "maker_rebate_usd", countField: "maker_rebate_count", sortKey: "maker_rebate_usd", size: 160 }, sortCtx),
		usdWithCountColumn({ id: "rewards", title: "Rewards", usdField: "reward_usd", countField: "reward_count", sortKey: "reward_usd", size: 144 }, sortCtx),
		usdWithCountColumn({ id: "yields", title: "Yields", usdField: "yield_usd", countField: "yield_count", sortKey: "yield_usd", size: 144 }, sortCtx),
		durationColumn({ id: "avgHoldTime", title: "Avg Hold", field: "avg_hold_time_seconds", sortKey: "avg_hold_time_seconds", size: TRADER_TABLE_COLUMN_SIZES.avgHoldTime }, sortCtx),
		dateColumn({ id: "firstTradeAt", title: "First Trade", field: "first_trade_at", sortKey: "first_trade_at", size: 128 }, sortCtx),
		dateColumn({ id: "lastTradeAt", title: "Last Trade", field: "last_trade_at", sortKey: "last_trade_at", size: TRADER_TABLE_COLUMN_SIZES.lastTradeAt }, sortCtx),
	];
}

const CATEGORY_UNAVAILABLE_COLUMN_IDS = new Set([
	"events",
	"makerRebates",
	"rewards",
	"yields",
]);

const DEFAULT_VISIBLE_COLUMN_IDS = [
	"rank",
	"trader",
	"pnl",
	"openPositions",
	"volume",
	"winRate",
	"markets",
	"trades",
	"bestTradePnl",
	"profitFactor",
	"lastTradeAt",
] as const;

const DEFAULT_VISIBLE_COLUMN_ORDER = new Map(
	DEFAULT_VISIBLE_COLUMN_IDS.map((id, index) => [id as string, index]),
);

function orderColumnsByDefault(
	columns: ColumnDef<TraderLeaderboardEntry, unknown>[],
): ColumnDef<TraderLeaderboardEntry, unknown>[] {
	return [...columns].sort((a, b) => {
		const aOrder = DEFAULT_VISIBLE_COLUMN_ORDER.get(a.id ?? "") ?? Number.POSITIVE_INFINITY;
		const bOrder = DEFAULT_VISIBLE_COLUMN_ORDER.get(b.id ?? "") ?? Number.POSITIVE_INFINITY;
		return aOrder - bOrder;
	});
}

function buildDefaultColumnVisibility(columns: ColumnDef<TraderLeaderboardEntry, unknown>[]): VisibilityState {
	const visibility: VisibilityState = {};
	for (const column of columns) {
		if (!column.id) continue;
		visibility[column.id] = DEFAULT_VISIBLE_COLUMN_ORDER.has(column.id);
	}
	return visibility;
}

type TradersTableProps = {
	traders: TraderLeaderboardEntry[];
	rankOffset?: number;
	scope?: TradersTableScope;
	sort?: TraderLeaderboardSortKey;
	direction?: TraderLeaderboardSortDirection;
	toolbarLeft?: React.ReactNode;
	toolbarRight?: React.ReactNode;
};

export function TradersTable({
	traders,
	rankOffset = 0,
	scope = "global",
	sort = DEFAULT_TRADER_LEADERBOARD_SORT,
	direction = DEFAULT_TRADER_LEADERBOARD_SORT_DIRECTION,
	toolbarLeft,
	toolbarRight,
}: TradersTableProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();

	const onSortChange = useCallback(
		(nextKey: TraderLeaderboardSortKey) => {
			const params = new URLSearchParams(searchParams.toString());
			let nextDirection: TraderLeaderboardSortDirection;
			if (nextKey === sort) {
				nextDirection = direction === "desc" ? "asc" : "desc";
			} else {
				nextDirection = "desc";
			}

			if (nextKey === DEFAULT_TRADER_LEADERBOARD_SORT) {
				params.delete("sort");
			} else {
				params.set("sort", nextKey);
			}
			if (nextDirection === DEFAULT_TRADER_LEADERBOARD_SORT_DIRECTION) {
				params.delete("dir");
			} else {
				params.set("dir", nextDirection);
			}
			params.delete("cursor");
			params.delete("page");

			const qs = params.toString();
			const href = (qs ? `${pathname}?${qs}` : pathname) as Route;
			startTransition(() => {
				router.replace(href, { scroll: false });
			});
		},
		[direction, pathname, router, searchParams, sort],
	);

	const columns = useMemo(
		() => {
			const all = buildColumns(rankOffset, { sort, direction, scope, onSortChange });
			const filtered = scope === "category"
				? all.filter((col) => !col.id || !CATEGORY_UNAVAILABLE_COLUMN_IDS.has(col.id))
				: all;
			return orderColumnsByDefault(filtered);
		},
		[direction, onSortChange, rankOffset, scope, sort],
	);
	const defaultColumnVisibility = useMemo(() => buildDefaultColumnVisibility(columns), [columns]);

	return (
		<DataTable
			paginationMode="none"
			columns={columns}
			data={traders}
			storageKey="traders-table"
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage="No traders found for this timeframe."
			columnLayout="fixed"
			toolbarLeft={toolbarLeft}
			toolbarRight={toolbarRight}
		/>
	);
}
