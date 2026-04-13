"use client";

import type { GlobalPnlTrader } from "@structbuild/sdk";
import type { ColumnDef } from "@tanstack/react-table";
import { Facehash } from "facehash";
import type { Route } from "next";
import Link from "next/link";
import { useMemo } from "react";

import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { facehashColorClasses } from "@/lib/facehash";
import { formatNumber, pnlColorClass } from "@/lib/format";
import { cn, getTraderDisplayName, normalizeWalletAddress, truncateAddress } from "@/lib/utils";

function buildColumns(rankOffset: number): ColumnDef<GlobalPnlTrader, unknown>[] {
	return [
	{
		id: "rank",
		meta: { title: "Rank" },
		header: "#",
		size: 64,
		enableHiding: false,
		cell: ({ row }) => <p className="text-muted-foreground tabular-nums">{rankOffset + row.index + 1}</p>,
	},
	{
		id: "trader",
		meta: {
			title: "Trader",
			cellClassName: "whitespace-normal align-top",
		},
		header: "Trader",
		size: 360,
		enableHiding: false,
		cell: ({ row }) => {
			const entry = row.original;
			const address = normalizeWalletAddress(entry.trader.address) ?? entry.trader.address;
			const displayName = getTraderDisplayName(entry.trader);

			return (
				<div className="flex min-w-0 items-center gap-3">
					{entry.trader.profile_image ? (
						<Avatar size="lg">
							<AvatarImage className="rounded-sm" src={entry.trader.profile_image} alt="" />
							<AvatarFallback className="rounded-sm">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
						</Avatar>
					) : (
						<Facehash
							className="size-10 shrink-0 overflow-hidden rounded-sm border"
							colorClasses={facehashColorClasses}
							name={address}
						/>
					)}
					<div className="min-w-0 flex-1 space-y-0.5">
						<Link
							href={`/traders/${address}` as Route}
							className="block truncate text-left text-base font-medium text-foreground underline-offset-4 hover:underline"
						>
							{displayName}
						</Link>
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
		size: 120,
		enableHiding: false,
		cell: ({ row }) => {
			const pnl = row.original.realized_pnl_usd ?? 0;

			return (
				<p className={cn("tabular-nums font-medium", pnlColorClass(pnl))}>
					{formatNumber(pnl, { compact: true, currency: true })}
				</p>
			);
		},
	},
	{
		id: "volume",
		meta: { title: "Volume" },
		header: "Volume",
		size: 120,
		cell: ({ row }) => (
			<p className="text-foreground/90 tabular-nums">
				{row.original.total_volume_usd != null
					? formatNumber(row.original.total_volume_usd, { compact: true, currency: true })
					: "—"}
			</p>
		),
	},
	{
		id: "markets",
		meta: { title: "Markets" },
		header: "Markets",
		size: 96,
		cell: ({ row }) => (
			<p className="text-foreground/90 tabular-nums">
				{row.original.markets_traded != null
					? formatNumber(row.original.markets_traded, { decimals: 0 })
					: "—"}
			</p>
		),
	},
	{
		id: "winRate",
		meta: { title: "Win Rate" },
		header: "Win Rate",
		size: 112,
		cell: ({ row }) => (
			<p className="text-foreground/90 tabular-nums">
				{row.original.market_win_rate_pct != null
					? formatNumber(row.original.market_win_rate_pct, { percent: true })
					: "—"}
			</p>
		),
	},
];
}

type TradersTableProps = {
	traders: GlobalPnlTrader[];
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
	const columns = useMemo(() => buildColumns(rankOffset), [rankOffset]);

	return (
		<DataTable
			paginationMode="none"
			columns={columns}
			data={traders}
			storageKey="traders-table"
			emptyMessage="No traders found for this timeframe."
			columnLayout="fixed"
			toolbarLeft={toolbarLeft}
			toolbarRight={toolbarRight}
		/>
	);
}
