"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { MarketEntry, PositionEntry, TraderInfo } from "@structbuild/sdk";
import Link from "next/link";
import type { Route } from "next";
import { useCallback, useMemo, useState, useTransition } from "react";

import { getMarketPositionTopTradersAction } from "@/app/actions";
import { TraderAvatar } from "@/components/trader/trader-avatar";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeAgo } from "@/components/ui/time-ago";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { formatNumber, formatPriceCents, pnlColorClass, toSeconds } from "@/lib/format";
import { cn, getTraderDisplayName, normalizeWalletAddress } from "@/lib/utils";

type OutcomeOption = { position_id: string; name: string };

type RawTrader = string | (Partial<TraderInfo> & { address?: string | null }) | null | undefined;

type RawRow = (MarketEntry | PositionEntry) & {
	trader?: RawTrader;
};

type TraderRow = {
	rank: number;
	trader: TraderInfo;
	total_pnl_usd: number | null;
	realized_pnl_usd: number | null;
	volume_usd: number | null;
	buy_usd: number | null;
	sell_usd: number | null;
	total_shares_bought: number | null;
	total_shares_sold: number | null;
	current_shares_balance: number | null;
	current_value: number | null;
	total_buys: number | null;
	total_sells: number | null;
	total_fees: number | null;
	avg_entry_price: number | null;
	avg_exit_price: number | null;
	outcomes_traded: number | null;
	won: boolean | null | undefined;
	first_trade_at: number | null;
	last_trade_at: number | null;
};

const ALL_VALUE = "__all__";

function resolveTrader(raw: RawTrader): TraderInfo | null {
	if (!raw) return null;
	if (typeof raw === "string") {
		const address = normalizeWalletAddress(raw) ?? raw;
		return address ? { address, verified_badge: false } : null;
	}
	if (!raw.address) return null;
	return {
		address: raw.address,
		name: raw.name ?? null,
		pseudonym: raw.pseudonym ?? null,
		profile_image: raw.profile_image ?? null,
		x_username: raw.x_username ?? null,
		verified_badge: raw.verified_badge ?? false,
	};
}

function readNumber(row: RawRow, key: string): number | null {
	const value = (row as unknown as Record<string, unknown>)[key];
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function buildRows(rows: RawRow[]): TraderRow[] {
	return rows.flatMap((row, index) => {
		const trader = resolveTrader(row.trader);
		if (!trader) return [];
		const buyUsd =
			readNumber(row, "total_buy_usd") ?? readNumber(row, "buy_volume_usd") ?? readNumber(row, "buy_usd");
		const sellUsd =
			readNumber(row, "total_sell_usd") ?? readNumber(row, "sell_volume_usd") ?? readNumber(row, "sell_usd");
		const volumeUsd =
			readNumber(row, "total_volume_usd") ??
			(buyUsd != null || sellUsd != null ? (buyUsd ?? 0) + (sellUsd ?? 0) : null);
		return [
			{
				rank: index + 1,
				trader,
				total_pnl_usd: readNumber(row, "total_pnl_usd"),
				realized_pnl_usd: readNumber(row, "realized_pnl_usd"),
				volume_usd: volumeUsd,
				buy_usd: buyUsd,
				sell_usd: sellUsd,
				total_shares_bought: readNumber(row, "total_shares_bought"),
				total_shares_sold: readNumber(row, "total_shares_sold"),
				current_shares_balance: readNumber(row, "current_shares_balance"),
				current_value: readNumber(row, "current_value") ?? readNumber(row, "open_positions_value"),
				total_buys: readNumber(row, "total_buys") ?? readNumber(row, "buy_count"),
				total_sells: readNumber(row, "total_sells") ?? readNumber(row, "sell_count"),
				total_fees: readNumber(row, "total_fees"),
				avg_entry_price: readNumber(row, "avg_entry_price"),
				avg_exit_price: readNumber(row, "avg_exit_price"),
				outcomes_traded: readNumber(row, "outcomes_traded"),
				won: (row as { won?: boolean | null }).won,
				first_trade_at: toSeconds(readNumber(row, "first_trade_at")),
				last_trade_at: toSeconds(readNumber(row, "last_trade_at")),
			},
		];
	});
}

const columns: ColumnDef<TraderRow, unknown>[] = [
	{
		id: "rank",
		header: "#",
		size: 56,
		enableHiding: false,
		cell: ({ row }) => (
			<span className="text-sm tabular-nums text-muted-foreground">{row.original.rank}</span>
		),
	},
	{
		id: "trader",
		header: "Trader",
		size: 240,
		enableHiding: false,
		cell: ({ row }) => {
			const trader = row.original.trader;
			const address = normalizeWalletAddress(trader.address) ?? trader.address;
			const name = getTraderDisplayName(trader);
			return (
				<Link
					href={`/traders/${address}` as Route}
					prefetch={false}
					className="flex min-w-0 max-w-48 items-center gap-2.5 hover:underline"
				>
					<TraderAvatar
						displayName={name}
						profileImage={trader.profile_image}
						rounded="md"
						className="size-8!"
					/>
					<span className="min-w-0 flex-1 truncate text-sm" title={name}>
						{name}
					</span>
				</Link>
			);
		},
	},
	{
		id: "realized_pnl_usd",
		header: "PnL",
		size: 140,
		cell: ({ row }) => {
			const pnl = row.original.total_pnl_usd ?? row.original.realized_pnl_usd;
			if (pnl == null) return <span className="text-muted-foreground">—</span>;
			return (
				<span className={cn("tabular-nums", pnlColorClass(pnl))}>
					{pnl > 0 ? "+" : ""}
					{formatNumber(pnl, { currency: true, compact: true })}
				</span>
			);
		},
	},
	{
		id: "volume_usd",
		header: "Volume",
		size: 110,
		cell: ({ row }) => (
			<span className="tabular-nums">
				{formatNumber(row.original.volume_usd ?? 0, { currency: true, compact: true })}
			</span>
		),
	},
	{
		id: "buy_usd",
		header: "Buy Volume",
		size: 110,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatNumber(row.original.buy_usd ?? 0, { currency: true, compact: true })}
			</span>
		),
	},
	{
		id: "sell_usd",
		header: "Sell Volume",
		size: 110,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatNumber(row.original.sell_usd ?? 0, { currency: true, compact: true })}
			</span>
		),
	},
	{
		id: "shares_traded",
		header: "Shares Traded",
		size: 120,
		cell: ({ row }) => {
			const total = (row.original.total_shares_bought ?? 0) + (row.original.total_shares_sold ?? 0);
			return (
				<span className="tabular-nums">
					{formatNumber(total, { compact: true, decimals: 2 })}
				</span>
			);
		},
	},
	{
		id: "total_shares_bought",
		header: "Shares Bought",
		size: 120,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatNumber(row.original.total_shares_bought ?? 0, { compact: true, decimals: 2 })}
			</span>
		),
	},
	{
		id: "total_shares_sold",
		header: "Shares Sold",
		size: 120,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatNumber(row.original.total_shares_sold ?? 0, { compact: true, decimals: 2 })}
			</span>
		),
	},
	{
		id: "current_shares_balance",
		header: "Open Shares",
		size: 110,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatNumber(row.original.current_shares_balance ?? 0, { compact: true, decimals: 2 })}
			</span>
		),
	},
	{
		id: "current_value",
		header: "Open Value",
		size: 110,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatNumber(row.original.current_value ?? 0, { currency: true, compact: true })}
			</span>
		),
	},
	{
		id: "avg_entry_price",
		header: "Avg Entry",
		size: 100,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatPriceCents(row.original.avg_entry_price)}
			</span>
		),
	},
	{
		id: "avg_exit_price",
		header: "Avg Exit",
		size: 100,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatPriceCents(row.original.avg_exit_price)}
			</span>
		),
	},
	{
		id: "total_buys",
		header: "Buys",
		size: 80,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatNumber(row.original.total_buys ?? 0, { decimals: 0 })}
			</span>
		),
	},
	{
		id: "total_sells",
		header: "Sells",
		size: 80,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatNumber(row.original.total_sells ?? 0, { decimals: 0 })}
			</span>
		),
	},
	{
		id: "total_fees",
		header: "Fees",
		size: 90,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatNumber(row.original.total_fees ?? 0, { currency: true, compact: true })}
			</span>
		),
	},
	{
		id: "outcomes_traded",
		header: "Outcomes",
		size: 100,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatNumber(row.original.outcomes_traded ?? 0, { decimals: 0 })}
			</span>
		),
	},
	{
		id: "won",
		header: () => (
			<TooltipWrapper content="Whether the trader held a winning share at resolution. Empty if they exited before resolution.">
				<span className="cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-4">
					Won
				</span>
			</TooltipWrapper>
		),
		size: 80,
		meta: { title: "Won" },
		cell: ({ row }) => {
			const won = row.original.won;
			if (won == null) {
				return (
					<TooltipWrapper content="Exited before resolution.">
						<span className="cursor-help text-muted-foreground">—</span>
					</TooltipWrapper>
				);
			}
			return (
				<span className={cn("text-sm", won ? "text-emerald-500" : "text-red-500")}>
					{won ? "Won" : "Lost"}
				</span>
			);
		},
	},
	{
		id: "first_trade_at",
		header: "First Trade",
		size: 110,
		cell: ({ row }) => {
			const t = row.original.first_trade_at;
			return t != null ? (
				<TimeAgo timestamp={t} className="tabular-nums text-foreground/80" />
			) : (
				<span className="tabular-nums text-foreground/80">—</span>
			);
		},
	},
	{
		id: "last_trade_at",
		header: "Last Trade",
		size: 110,
		cell: ({ row }) => {
			const t = row.original.last_trade_at;
			return t != null ? (
				<TimeAgo timestamp={t} className="tabular-nums text-foreground/80" />
			) : (
				<span className="tabular-nums text-foreground/80">—</span>
			);
		},
	},
];

const defaultColumnVisibility = {
	buy_usd: false,
	sell_usd: false,
	total_shares_bought: false,
	total_shares_sold: false,
	current_shares_balance: false,
	current_value: false,
	total_buys: false,
	total_sells: false,
	total_fees: false,
	outcomes_traded: false,
	won: false,
	first_trade_at: false,
};

export function MarketTopTradersClient({
	outcomes,
	initialTraders,
}: {
	outcomes: OutcomeOption[];
	initialTraders: MarketEntry[];
}) {
	const [activeValue, setActiveValue] = useState<string>(ALL_VALUE);
	const [rawRows, setRawRows] = useState<RawRow[]>(initialTraders as unknown as RawRow[]);
	const [isPending, startTransition] = useTransition();

	const handleChange = useCallback(
		(next: string) => {
			if (next === activeValue) return;
			setActiveValue(next);

			if (next === ALL_VALUE) {
				setRawRows(initialTraders as unknown as RawRow[]);
				return;
			}

			startTransition(async () => {
				const result = await getMarketPositionTopTradersAction({ positionId: next });
				setRawRows(result.traders as unknown as RawRow[]);
			});
		},
		[activeValue, initialTraders],
	);

	const rows = useMemo(() => buildRows(rawRows), [rawRows]);
	const isPositionView = activeValue !== ALL_VALUE;
	const visibleColumns = useMemo(
		() => (isPositionView ? columns.filter((col) => col.id !== "outcomes_traded") : columns),
		[isPositionView],
	);

	const outcomePicker =
		outcomes.length > 0 ? (
			<Tabs value={activeValue} onValueChange={(value) => handleChange(String(value))}>
				<TabsList>
					<TabsTrigger value={ALL_VALUE}>All</TabsTrigger>
					{outcomes.map((o) => (
						<TabsTrigger key={o.position_id} value={o.position_id}>
							{o.name}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
		) : null;

	return (
		<div className={cn(isPending && "opacity-70")} aria-busy={isPending}>
			<DataTable
				columns={visibleColumns}
				data={rows}
				tableName="market_top_traders"
				storageKey="market-top-traders-table"
				defaultColumnVisibility={defaultColumnVisibility}
				emptyMessage="No traders yet for this outcome."
				columnLayout="fixed"
				paginationMode="none"
				toolbarLeft={outcomePicker}
			/>
		</div>
	);
}
