"use client";

import { useMemo, useState } from "react";
import posthog from "posthog-js";
import Link from "next/link";
import type { Route } from "next";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TraderAvatar } from "@/components/trader/trader-avatar";
import { formatNumber, formatPriceCents, toSeconds } from "@/lib/format";
import { TimeAgo } from "@/components/ui/time-ago";
import { cn } from "@/lib/utils";

export type HolderRow = {
	rank: number;
	address: string;
	displayName: string;
	profileImage?: string | null;
	shares: number | null;
	valueUsd: number | null;
	avgEntryPrice: number | null;
	realizedPnlUsd: number | null;
	unrealizedPnlUsd: number | null;
	totalPnlUsd: number | null;
	trades: number | null;
	feesUsd: number | null;
	firstTradeAt: number | null;
	lastTradeAt: number | null;
};

export type HolderSide = {
	positionId: string;
	outcomeName: string;
	totalHolders: number;
	holders: HolderRow[];
};

export type HolderColumnId =
	| "rank"
	| "trader"
	| "shares"
	| "value"
	| "avg_entry"
	| "realized_pnl"
	| "unrealized_pnl"
	| "total_pnl"
	| "trades"
	| "fees"
	| "first_trade"
	| "last_trade";

function PnlCell({ value }: { value: number | null }) {
	if (value == null) {
		return <span className="text-muted-foreground">—</span>;
	}

	return (
		<span
			className={cn(
				"tabular-nums",
				value > 0 ? "text-emerald-500" : value < 0 ? "text-red-500" : "text-muted-foreground",
			)}
		>
			{value > 0 ? "+" : ""}
			{formatNumber(value, { currency: true, compact: true })}
		</span>
	);
}

function TimestampCell({ value }: { value: number | null }) {
	const seconds = toSeconds(value);
	return seconds != null ? (
		<TimeAgo timestamp={seconds} className="tabular-nums text-foreground/80" />
	) : (
		<span className="tabular-nums text-foreground/80">—</span>
	);
}

const holderColumns: Record<HolderColumnId, ColumnDef<HolderRow, unknown>> = {
	rank: {
		id: "rank",
		header: "#",
		size: 56,
		cell: ({ row }) => <span className="text-sm tabular-nums text-muted-foreground">{row.original.rank}</span>,
	},
	trader: {
		id: "trader",
		header: "Trader",
		size: 240,
		cell: ({ row }) => (
			<Link
				href={`/traders/${row.original.address}` as Route}
				prefetch={false}
				className="max-w-48 flex min-w-0 items-center gap-2.5 hover:underline"
			>
				<TraderAvatar
					displayName={row.original.displayName}
					profileImage={row.original.profileImage}
					rounded="md"
					className="size-8!"
				/>
				<span className="min-w-0 flex-1 truncate text-sm" title={row.original.displayName}>
					{row.original.displayName}
				</span>
			</Link>
		),
	},
	shares: {
		id: "shares",
		header: "Shares",
		size: 110,
		cell: ({ row }) => (
			<span className="tabular-nums">
				{formatNumber(row.original.shares, { compact: true, decimals: 2 })}
			</span>
		),
	},
	value: {
		id: "value",
		header: "Value",
		size: 110,
		cell: ({ row }) => (
			<span className="tabular-nums">
				{formatNumber(row.original.valueUsd, { currency: true, compact: true })}
			</span>
		),
	},
	avg_entry: {
		id: "avg_entry",
		header: "Avg Entry",
		size: 110,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">{formatPriceCents(row.original.avgEntryPrice)}</span>
		),
	},
	realized_pnl: {
		id: "realized_pnl",
		header: "Realized PnL",
		size: 140,
		cell: ({ row }) => <PnlCell value={row.original.realizedPnlUsd} />,
	},
	unrealized_pnl: {
		id: "unrealized_pnl",
		header: "Unrealized PnL",
		size: 140,
		cell: ({ row }) => <PnlCell value={row.original.unrealizedPnlUsd} />,
	},
	total_pnl: {
		id: "total_pnl",
		header: "PnL",
		size: 120,
		cell: ({ row }) => <PnlCell value={row.original.totalPnlUsd} />,
	},
	trades: {
		id: "trades",
		header: "Trades",
		size: 90,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatNumber(row.original.trades ?? 0, { decimals: 0 })}
			</span>
		),
	},
	fees: {
		id: "fees",
		header: "Fees",
		size: 90,
		cell: ({ row }) => (
			<span className="tabular-nums text-foreground/80">
				{formatNumber(row.original.feesUsd, { currency: true, compact: true })}
			</span>
		),
	},
	first_trade: {
		id: "first_trade",
		header: "First Bought",
		size: 110,
		cell: ({ row }) => <TimestampCell value={row.original.firstTradeAt} />,
	},
	last_trade: {
		id: "last_trade",
		header: "Last Trade",
		size: 110,
		cell: ({ row }) => <TimestampCell value={row.original.lastTradeAt} />,
	},
};

type HoldersTableProps = {
	sides: HolderSide[];
	columnIds: readonly HolderColumnId[];
	storageKey: string;
	tableName: string;
	outcomeChangeEvent: string;
	defaultColumnVisibility?: VisibilityState;
	emptyMessage?: string;
};

export function HoldersTable({
	sides,
	columnIds,
	storageKey,
	tableName,
	outcomeChangeEvent,
	defaultColumnVisibility,
	emptyMessage = "No holders for this outcome.",
}: HoldersTableProps) {
	const [activeSideId, setActiveSideId] = useState(sides[0]?.positionId ?? "0");

	const columns = useMemo(() => columnIds.map((id) => holderColumns[id]), [columnIds]);

	const activeSide = useMemo(
		() => sides.find((side) => side.positionId === activeSideId) ?? sides[0],
		[sides, activeSideId],
	);

	const sidePicker = (
		<Tabs
			value={activeSideId}
			onValueChange={(value) => {
				const next = String(value);
				if (next !== activeSideId) {
					const picked = sides.find((side) => side.positionId === next);
					posthog.capture(outcomeChangeEvent, { outcome_name: picked?.outcomeName });
				}
				setActiveSideId(next);
			}}
		>
			<TabsList>
				{sides.map((side) => (
					<TabsTrigger key={side.positionId} value={side.positionId}>
						<span className="flex items-center gap-2">
							<span>{side.outcomeName}</span>
							<span className="text-xs text-muted-foreground">
								{formatNumber(side.totalHolders, { decimals: 0 })}
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
			data={activeSide?.holders ?? []}
			getRowHref={(row) => `/traders/${row.address}`}
			storageKey={storageKey}
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage={emptyMessage}
			columnLayout="fixed"
			paginationMode="none"
			tableName={tableName}
			toolbarLeft={sidePicker}
		/>
	);
}

export function HoldersTableFallback() {
	return (
		<div className="space-y-3">
			<div className="flex gap-4">
				<div className="h-6 w-24 animate-pulse rounded bg-muted/60" />
				<div className="h-6 w-24 animate-pulse rounded bg-muted/60" />
			</div>
			<div className="rounded-lg bg-card p-4 sm:p-6">
				<div className="space-y-2">
					{Array.from({ length: 8 }, (_, i) => (
						<div key={i} className="flex items-center gap-3">
							<div className="size-8 animate-pulse rounded-md bg-muted/60" />
							<div className="h-3 flex-1 animate-pulse rounded bg-muted/60" />
							<div className="h-3 w-16 animate-pulse rounded bg-muted/60" />
							<div className="h-3 w-16 animate-pulse rounded bg-muted/60" />
							<div className="h-3 w-16 animate-pulse rounded bg-muted/60" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
