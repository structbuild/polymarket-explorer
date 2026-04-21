"use client";

import type { LeaderboardEntry } from "@structbuild/sdk";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { Facehash } from "facehash";
import type { Route } from "next";
import Link from "next/link";
import { useMemo } from "react";

import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { dateCol, durationCol, numericCol } from "@/components/ui/table-columns";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { facehashColorClasses } from "@/lib/facehash";
import { formatNumber, pnlColorClass } from "@/lib/format";
import { cn, getTraderDisplayName, normalizeWalletAddress, truncateAddress } from "@/lib/utils";

type NumericField = Extract<
	keyof LeaderboardEntry,
	| "pnl"
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
	| "avg_pnl_per_market"
	| "avg_pnl_per_trade"
	| "avg_hold_time_seconds"
	| "best_trade_pnl_usd"
>;

type LeaderboardNumericOptions = {
	id: string;
	title: string;
	field: NumericField;
	size?: number;
	format?: Parameters<typeof formatNumber>[1];
	colorizePnl?: boolean;
};

function leaderboardNumeric(options: LeaderboardNumericOptions): ColumnDef<LeaderboardEntry, unknown> {
	return numericCol<LeaderboardEntry>({
		id: options.id,
		title: options.title,
		size: options.size,
		format: options.format,
		colorizePnl: options.colorizePnl,
		accessor: (row) => row[options.field] as number | null | undefined,
	});
}

function buildColumns(rankOffset: number): ColumnDef<LeaderboardEntry, unknown>[] {
	return [
		{
			id: "rank",
			meta: { title: "Rank" },
			header: "#",
			size: 64,
			enableHiding: false,
			cell: ({ row }) => (
				<p className="text-muted-foreground tabular-nums">
					{row.original.rank ?? rankOffset + row.index + 1}
				</p>
			),
		},
		{
			id: "trader",
			meta: {
				title: "Trader",
				cellClassName: "whitespace-normal align-top",
			},
			header: "Trader",
			size: 176,
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
			header: "Realized PnL",
			size: 128,
			enableHiding: false,
			cell: ({ row }) => {
				const pnl = row.original.pnl ?? 0;
				return (
					<p className={cn("tabular-nums font-medium", pnlColorClass(pnl))}>
						{formatNumber(pnl, { compact: true, currency: true })}
					</p>
				);
			},
		},
		leaderboardNumeric({ id: "volume", title: "Volume", field: "total_volume_usd", size: 120, format: { compact: true, currency: true } }),
		leaderboardNumeric({ id: "markets", title: "Markets", field: "markets_traded", size: 96, format: { decimals: 0 } }),
		leaderboardNumeric({ id: "winRate", title: "Win Rate", field: "market_win_rate_pct", size: 112, format: { percent: true } }),
		leaderboardNumeric({ id: "events", title: "Events", field: "events_traded", size: 96, format: { decimals: 0 } }),
		leaderboardNumeric({ id: "marketsWon", title: "Won", field: "markets_won", size: 88, format: { decimals: 0 } }),
		leaderboardNumeric({ id: "marketsLost", title: "Lost", field: "markets_lost", size: 88, format: { decimals: 0 } }),
		leaderboardNumeric({ id: "trades", title: "Trades", field: "total_trades", size: 104, format: { decimals: 0, compact: true } }),
		leaderboardNumeric({ id: "buys", title: "Buys", field: "total_buys", size: 96, format: { decimals: 0, compact: true } }),
		leaderboardNumeric({ id: "sells", title: "Sells", field: "total_sells", size: 96, format: { decimals: 0, compact: true } }),
		leaderboardNumeric({ id: "redemptions", title: "Redemptions", field: "total_redemptions", size: 128, format: { decimals: 0, compact: true } }),
		leaderboardNumeric({ id: "merges", title: "Merges", field: "total_merges", size: 104, format: { decimals: 0, compact: true } }),
		leaderboardNumeric({ id: "buyVolume", title: "Buy Vol", field: "buy_volume_usd", size: 120, format: { compact: true, currency: true } }),
		leaderboardNumeric({ id: "sellVolume", title: "Sell Vol", field: "sell_volume_usd", size: 120, format: { compact: true, currency: true } }),
		leaderboardNumeric({ id: "redemptionVolume", title: "Redemption Vol", field: "redemption_volume_usd", size: 144, format: { compact: true, currency: true } }),
		leaderboardNumeric({ id: "mergeVolume", title: "Merge Vol", field: "merge_volume_usd", size: 128, format: { compact: true, currency: true } }),
		leaderboardNumeric({ id: "fees", title: "Fees", field: "total_fees", size: 112, format: { compact: true, currency: true } }),
		leaderboardNumeric({ id: "bestTradePnl", title: "Best Trade", field: "best_trade_pnl_usd", size: 128, format: { compact: true, currency: true }, colorizePnl: true }),
		durationCol<LeaderboardEntry>({
			id: "avgHoldTime",
			title: "Avg Hold",
			accessor: (row) => row.avg_hold_time_seconds,
		}),
		dateCol<LeaderboardEntry>({ id: "firstTradeAt", title: "First Trade", accessor: (row) => row.first_trade_at }),
		dateCol<LeaderboardEntry>({ id: "lastTradeAt", title: "Last Trade", accessor: (row) => row.last_trade_at }),
	];
}

const DEFAULT_VISIBLE_COLUMN_IDS = [
	"rank",
	"trader",
	"pnl",
	"volume",
	"markets",
	"winRate",
	"trades",
	"bestTradePnl",
	"avgHoldTime",
	"lastTradeAt",
] as const;

const DEFAULT_VISIBLE_COLUMN_ORDER = new Map(
	DEFAULT_VISIBLE_COLUMN_IDS.map((id, index) => [id as string, index]),
);

function orderColumnsByDefault(
	columns: ColumnDef<LeaderboardEntry, unknown>[],
): ColumnDef<LeaderboardEntry, unknown>[] {
	return [...columns].sort((a, b) => {
		const aOrder = DEFAULT_VISIBLE_COLUMN_ORDER.get(a.id ?? "") ?? Number.POSITIVE_INFINITY;
		const bOrder = DEFAULT_VISIBLE_COLUMN_ORDER.get(b.id ?? "") ?? Number.POSITIVE_INFINITY;
		return aOrder - bOrder;
	});
}

function buildDefaultColumnVisibility(columns: ColumnDef<LeaderboardEntry, unknown>[]): VisibilityState {
	const visibility: VisibilityState = {};
	for (const column of columns) {
		if (!column.id) continue;
		visibility[column.id] = DEFAULT_VISIBLE_COLUMN_ORDER.has(column.id);
	}
	return visibility;
}

type TradersTableProps = {
	traders: LeaderboardEntry[];
	rankOffset?: number;
	toolbarLeft?: React.ReactNode;
	toolbarRight?: React.ReactNode;
};

export function TradersTable({
	traders,
	rankOffset = 0,
	toolbarLeft,
	toolbarRight,
}: TradersTableProps) {
	const columns = useMemo(() => orderColumnsByDefault(buildColumns(rankOffset)), [rankOffset]);
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
