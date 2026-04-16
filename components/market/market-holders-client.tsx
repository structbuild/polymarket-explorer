"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { ColumnDef } from "@tanstack/react-table";
import type { Holder, OutcomeHolders } from "@structbuild/sdk";

import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TraderAvatar } from "@/components/trader/trader-avatar";
import { formatNumber, formatPriceCents } from "@/lib/format";
import { TimeAgo } from "@/components/ui/time-ago";
import { cn, getTraderDisplayName } from "@/lib/utils";

type HolderRow = Holder & { rank: number };

function toNumber(value: string | number | null | undefined): number | null {
	if (value == null) return null;
	const n = typeof value === "string" ? Number(value) : value;
	return Number.isFinite(n) ? n : null;
}

const columns: ColumnDef<HolderRow, unknown>[] = [
	{
		id: "rank",
		header: "#",
		size: 56,
		cell: ({ row }) => (
			<span className="text-sm tabular-nums text-muted-foreground">{row.original.rank}</span>
		),
	},
	{
		id: "trader",
		header: "Trader",
		size: 240,
		cell: ({ row }) => {
			const name = getTraderDisplayName(row.original.trader);
			return (
				<Link
					href={`/traders/${row.original.trader.address}` as Route}
					className="max-w-48 flex min-w-0 items-center gap-2.5 hover:underline"
				>
					<TraderAvatar
						displayName={name}
						profileImage={row.original.trader.profile_image}
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
		id: "shares",
		header: "Shares",
		size: 110,
		cell: ({ row }) => (
			<span className="tabular-nums">
				{formatNumber(toNumber(row.original.shares), { compact: true, decimals: 2 })}
			</span>
		),
	},
	{
		id: "value",
		header: "Value",
		size: 110,
		cell: ({ row }) => (
			<span className="tabular-nums">
				{formatNumber(toNumber(row.original.shares_usd), { currency: true, compact: true })}
			</span>
		),
	},
	{
		id: "avg_entry",
		header: "Avg Entry",
		size: 110,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatPriceCents(row.original.pnl?.avg_entry_price ?? null)}
			</span>
		),
	},
	{
		id: "realized_pnl",
		header: "Realized PnL",
		size: 140,
		cell: ({ row }) => {
			const pnl = toNumber(row.original.pnl?.realized_sell_pnl_usd);
			if (pnl == null) return <span className="text-muted-foreground">—</span>;
			return (
				<span
					className={cn(
						"tabular-nums",
						pnl > 0 ? "text-emerald-500" : pnl < 0 ? "text-red-500" : "text-muted-foreground",
					)}
				>
					{pnl > 0 ? "+" : ""}
					{formatNumber(pnl, { currency: true, compact: true })}
				</span>
			);
		},
	},
	{
		id: "trades",
		header: "Trades",
		size: 90,
		cell: ({ row }) => {
			const buys = row.original.pnl?.total_buys ?? 0;
			const sells = row.original.pnl?.total_sells ?? 0;
			const total = buys + sells;
			return <span className="tabular-nums text-foreground/80">{formatNumber(total, { decimals: 0 })}</span>;
		},
	},
	{
		id: "fees",
		header: "Fees",
		size: 90,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatNumber(row.original.pnl?.total_fees ?? null, { currency: true, compact: true })}
			</span>
		),
	},
	{
		id: "first_trade",
		header: "First Bought",
		size: 110,
		cell: ({ row }) => {
			const t = row.original.pnl?.first_trade_at;
			return t != null ? (
				<TimeAgo timestamp={t} className="tabular-nums text-foreground/80" />
			) : (
				<span className="tabular-nums text-foreground/80">—</span>
			);
		},
	},
	{
		id: "last_trade",
		header: "Last Trade",
		size: 110,
		cell: ({ row }) => {
			const t = row.original.pnl?.last_trade_at;
			return t != null ? (
				<TimeAgo timestamp={t} className="tabular-nums text-foreground/80" />
			) : (
				<span className="tabular-nums text-foreground/80">—</span>
			);
		},
	},
];

const defaultColumnVisibility = {
	realized_pnl: false,
	fees: false,
};

export function MarketHoldersClient({ outcomes }: { outcomes: OutcomeHolders[] }) {
	const defaultValue = outcomes[0]?.position_id ?? "0";
	const [activeOutcomeId, setActiveOutcomeId] = useState(defaultValue);

	const activeOutcome = useMemo(
		() => outcomes.find((o) => o.position_id === activeOutcomeId) ?? outcomes[0],
		[outcomes, activeOutcomeId],
	);

	const rows: HolderRow[] = useMemo(
		() => activeOutcome?.holders.map((h, index) => ({ ...h, rank: index + 1 })) ?? [],
		[activeOutcome],
	);

	const outcomePicker = (
		<Tabs value={activeOutcomeId} onValueChange={(value) => setActiveOutcomeId(String(value))}>
			<TabsList>
				{outcomes.map((outcome) => (
					<TabsTrigger key={outcome.position_id} value={outcome.position_id}>
						<span className="flex items-center gap-2">
							<span>{outcome.outcome_name}</span>
							<span className="text-xs text-muted-foreground">
								{formatNumber(outcome.total_holders, { decimals: 0 })}
							</span>
						</span>
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);

	return (
		<DataTable
			columns={columns}
			data={rows}
			storageKey="market-holders-table"
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage="No holders for this outcome."
			columnLayout="fixed"
			paginationMode="none"
			toolbarLeft={outcomePicker}
		/>
	);
}
