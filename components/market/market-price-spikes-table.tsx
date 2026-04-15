"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { PriceJump } from "@structbuild/sdk";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";

import { MarketTabs } from "@/components/market/market-tabs";
import { DataTable } from "@/components/ui/data-table";
import { formatNumber, formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type SpikeRow = PriceJump;

const columns: ColumnDef<SpikeRow, unknown>[] = [
	{
		id: "age",
		header: "Age",
		size: 100,
		cell: ({ row }) => {
			const fromSec = Math.floor(row.original.from / 1000);
			return <p className="text-sm text-muted-foreground">{formatTimeAgo(fromSec)}</p>;
		},
	},
	{
		id: "direction",
		header: "Direction",
		size: 120,
		cell: ({ row }) => {
			const up = row.original.direction.toLowerCase() === "up";
			return (
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"flex size-6 shrink-0 items-center justify-center rounded-full",
							up ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500",
						)}
					>
						{up ? <ArrowUpRightIcon className="size-3.5" /> : <ArrowDownRightIcon className="size-3.5" />}
					</span>
					<span className={cn("text-sm", up ? "text-emerald-500" : "text-red-500")}>
						{up ? "Up" : "Down"}
					</span>
				</div>
			);
		},
	},
	{
		id: "change",
		header: "Change",
		size: 110,
		cell: ({ row }) => {
			const up = row.original.direction.toLowerCase() === "up";
			return (
				<p className={cn("tabular-nums", up ? "text-emerald-500" : "text-red-500")}>
					{up ? "+" : "-"}
					{Math.abs(row.original.change_pct).toFixed(1)}%
				</p>
			);
		},
	},
	{
		id: "price",
		header: "Price",
		size: 160,
		cell: ({ row }) => (
			<p className="font-mono text-sm tabular-nums text-foreground/80">
				{(row.original.price_before * 100).toFixed(1)}% → {(row.original.price_after * 100).toFixed(1)}%
			</p>
		),
	},
	{
		id: "trades",
		header: "Trades",
		size: 90,
		cell: ({ row }) => (
			<p className="tabular-nums">{formatNumber(row.original.trades_count, { decimals: 0 })}</p>
		),
	},
	{
		id: "volume",
		header: "Volume",
		size: 120,
		cell: ({ row }) => (
			<p className="tabular-nums">{formatNumber(row.original.volume, { currency: true, compact: true })}</p>
		),
	},
];

export function MarketPriceSpikesTable({ spikes }: { spikes: SpikeRow[] }) {
	return (
		<DataTable
			toolbarLeft={<MarketTabs />}
			columns={columns}
			data={spikes}
			storageKey="market-price-spikes-table"
			emptyMessage="No significant price moves."
			columnLayout="fixed"
		/>
	);
}
