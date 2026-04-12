"use client";

import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import type { SimpleTimeframeMetrics } from "@structbuild/sdk";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { ExternalLinkIcon } from "lucide-react";

import type { MarketTableRow, TimeframeMetrics } from "@/lib/market-table-map";
import { DataTable, useDataTableTimeframe } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { formatNumber, formatDateShort } from "@/lib/format";
import { METRICS_TIMEFRAMES, type MetricsTimeframeChoice } from "@/lib/timeframes";

export type { MarketTableRow } from "@/lib/market-table-map";

const TABLE_TIMEFRAMES: readonly MetricsTimeframeChoice[] = METRICS_TIMEFRAMES;
const DEFAULT_TIMEFRAME: MetricsTimeframeChoice = "24h";

type ColumnFlags = {
	anyMetrics: boolean;
	anyLiquidity: boolean;
	anyHolders: boolean;
	anyEnd: boolean;
};

const defaultColumnVisibility: VisibilityState = {
	fees: false,
};

type MetricField = keyof Pick<SimpleTimeframeMetrics, "volume" | "txns" | "unique_traders" | "fees">;

type MetricCellProps = {
	metrics: TimeframeMetrics;
	field: MetricField;
	format: "currency" | "integer";
};

function readMetric(metrics: TimeframeMetrics, timeframe: MetricsTimeframeChoice, field: MetricField) {
	return metrics[timeframe]?.[field] ?? null;
}

function MetricCell({ metrics, field, format }: MetricCellProps) {
	const timeframe = useDataTableTimeframe() ?? DEFAULT_TIMEFRAME;
	const value = readMetric(metrics, timeframe, field);

	if (value === null || value === undefined) {
		return <p className="text-muted-foreground tabular-nums">—</p>;
	}

	if (format === "currency") {
		return (
			<p className="text-foreground/90 tabular-nums">
				{formatNumber(value, { compact: true, currency: true })}
			</p>
		);
	}

	return (
		<p className="text-foreground/90 tabular-nums">
			{formatNumber(value, { decimals: 0 })}
		</p>
	);
}

function buildColumns(flags: ColumnFlags): ColumnDef<MarketTableRow, unknown>[] {
	const cols: ColumnDef<MarketTableRow, unknown>[] = [
		{
			id: "market",
			meta: {
				title: "Market",
				cellClassName: "whitespace-normal align-top",
			},
			header: "Market",
			size: 600,
			cell: ({ row }) => {
				const m = row.original;
				const title = m.question ?? "Untitled Market";
				const href = m.slug != null ? (`/market/${m.slug}` as Route) : null;
				return (
					<div className="flex min-w-0 items-center gap-3">
						{m.imageUrl ? (
							<Image
								src={m.imageUrl}
								alt=""
								width={40}
								height={40}
								className="size-10 shrink-0 rounded-md object-cover"
							/>
						) : (
							<div className="size-10 shrink-0 rounded-md bg-muted" />
						)}
						<div className="min-w-0 flex-1 space-y-0.5">
							{href ? (
								<Link
									href={href}
									className="line-clamp-2 text-left text-base font-medium text-foreground underline-offset-4 hover:underline"
								>
									{title}
								</Link>
							) : (
								<p className="line-clamp-2 text-base font-medium">{title}</p>
							)}
						</div>
					</div>
				);
			},
		},
		{
			id: "probability",
			meta: {
				title: "Probability",
				cellClassName: "whitespace-normal align-middle",
			},
			header: "Probability",
			size: 112,
			cell: ({ row }) => (
				<p className="text-foreground/90 whitespace-normal">
					{formatNumber((row.original.outcomes?.[0]?.probability ?? 0) * 100, { percent: true })}
				</p>
			),
		},
	];

	if (flags.anyMetrics) {
		cols.push(
			{
				id: "volume",
				meta: { title: "Volume" },
				header: "Volume",
				size: 112,
				cell: ({ row }) => (
					<MetricCell metrics={row.original.metrics} field="volume" format="currency" />
				),
			},
			{
				id: "trades",
				meta: { title: "Trades" },
				header: "Trades",
				size: 96,
				cell: ({ row }) => (
					<MetricCell metrics={row.original.metrics} field="txns" format="integer" />
				),
			},
			{
				id: "traders",
				meta: { title: "Traders" },
				header: "Traders",
				size: 96,
				cell: ({ row }) => (
					<MetricCell metrics={row.original.metrics} field="unique_traders" format="integer" />
				),
			},
			{
				id: "fees",
				meta: { title: "Fees" },
				header: "Fees",
				size: 96,
				cell: ({ row }) => (
					<MetricCell metrics={row.original.metrics} field="fees" format="currency" />
				),
			},
		);
	}

	if (flags.anyLiquidity) {
		cols.push({
			id: "liquidity",
			meta: { title: "Liquidity" },
			header: "Liquidity",
			size: 112,
			cell: ({ row }) => (
				<p className="text-foreground/90 tabular-nums">
					{row.original.liquidityUsd !== null
						? formatNumber(row.original.liquidityUsd, {
								compact: true,
								currency: true,
							})
						: "—"}
				</p>
			),
		});
	}

	if (flags.anyHolders) {
		cols.push({
			id: "holders",
			meta: { title: "Holders" },
			header: "Holders",
			size: 88,
			cell: ({ row }) => (
				<p className="text-foreground/90 tabular-nums">
					{row.original.totalHolders !== null
						? formatNumber(row.original.totalHolders, { decimals: 0 })
						: "—"}
				</p>
			),
		});
	}

	if (flags.anyEnd) {
		cols.push({
			id: "ends",
			meta: { title: "Ends" },
			header: "Ends",
			size: 120,
			cell: ({ row }) => (
				<p className="text-muted-foreground">
					{row.original.endTime !== null
						? formatDateShort(row.original.endTime)
						: "—"}
				</p>
			),
		});
	}

	cols.push({
		id: "link",
		header: "",
		size: 96,
		enableHiding: false,
		cell: ({ row }) => {
			const slug = row.original.slug;
			if (!slug) return null;
			return (
				<div className="flex justify-end gap-1">
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
			);
		},
	});

	return cols;
}

function buildColumnFlags(markets: MarketTableRow[]): ColumnFlags {
	return {
		anyMetrics: markets.some((m) => Object.keys(m.metrics).length > 0),
		anyLiquidity: markets.some((m) => m.liquidityUsd !== null),
		anyHolders: markets.some((m) => m.totalHolders !== null),
		anyEnd: markets.some((m) => m.endTime !== null),
	};
}

type MarketsTableProps = {
	markets: MarketTableRow[];
	storageKey?: string;
	toolbarLeft?: React.ReactNode;
	paginationMode?: "client" | "none";
};

export function MarketsTable({
	markets,
	storageKey = "markets-table",
	toolbarLeft,
	paginationMode = "client",
}: MarketsTableProps) {
	const flags = useMemo(() => buildColumnFlags(markets), [markets]);

	const columns = useMemo(() => buildColumns(flags), [flags]);

	return (
		<DataTable
			paginationMode={paginationMode}
			columns={columns}
			data={markets}
			storageKey={storageKey}
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage="No markets to show."
			columnLayout="fixed"
			defaultPageSize={25}
			timeframes={TABLE_TIMEFRAMES}
			defaultTimeframe={DEFAULT_TIMEFRAME}
			toolbarLeft={toolbarLeft}
		/>
	);
}
