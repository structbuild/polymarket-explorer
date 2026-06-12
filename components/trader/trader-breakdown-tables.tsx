import type {
	CategoryEntry,
	MarketEntry,
} from "@structbuild/sdk";
import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Volume } from "@/components/ui/volume";
import { formatNumber, pnlColorClass, readTotalPnlUsd } from "@/lib/format";
import type { CursorPage } from "@/lib/struct/queries";
import { cn } from "@/lib/utils";

type BreakdownTableProps<Row> = {
	rows: Row[];
	emptyMessage: string;
	identityHeader: string;
	identityCell: (row: Row) => ReactNode;
	pnl: (row: Row) => number;
	volume: (row: Row) => number | null;
	rightHeader?: string;
	rightCell?: (row: Row) => ReactNode;
};

function BreakdownTable<Row>({
	rows,
	emptyMessage,
	identityHeader,
	identityCell,
	pnl,
	volume,
	rightHeader,
	rightCell,
}: BreakdownTableProps<Row>) {
	return (
		<div className="overflow-hidden rounded-lg border bg-card">
			{rows.length === 0 ? (
				<p className="px-4 py-12 text-center text-sm text-muted-foreground sm:px-6">
					{emptyMessage}
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12">#</TableHead>
							<TableHead>{identityHeader}</TableHead>
							<TableHead className="text-right">PnL</TableHead>
							<TableHead className="text-right">Volume</TableHead>
							{rightHeader ? <TableHead className="text-right">{rightHeader}</TableHead> : null}
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row, index) => {
							const pnlValue = pnl(row);
							const volumeUsd = volume(row);
							return (
								<TableRow key={index}>
									<TableCell className="text-muted-foreground tabular-nums">{index + 1}</TableCell>
									<TableCell>{identityCell(row)}</TableCell>
									<TableCell className={cn("text-right font-medium tabular-nums", pnlColorClass(pnlValue))}>
										{formatNumber(pnlValue, { currency: true, compact: true })}
									</TableCell>
									<TableCell className="text-right">
										<Volume usd={volumeUsd} shares={null} className="tabular-nums" />
									</TableCell>
									{rightCell ? <TableCell className="text-right tabular-nums">{rightCell(row)}</TableCell> : null}
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}
		</div>
	);
}

function buildHref(basePath: string, baseParams: Record<string, string>, pageKey: string, pageNumber: number | null): Route {
	const params = new URLSearchParams(baseParams);
	if (pageNumber != null && pageNumber > 1) {
		params.set(pageKey, String(pageNumber));
	}
	const qs = params.toString();
	return (qs ? `${basePath}?${qs}` : basePath) as Route;
}

function BreakdownPagination({ basePath, baseParams, pageNumber, hasMore, pageKey }: {
	basePath: string;
	baseParams: Record<string, string>;
	pageNumber: number;
	hasMore: boolean;
	pageKey: string;
}) {
	const showPrev = pageNumber > 1;
	const showNext = hasMore;

	if (!showPrev && !showNext) return null;

	const linkClass = "inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent";
	const disabledClass = "inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50";

	return (
		<nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
			{showPrev ? (
				<Link href={buildHref(basePath, baseParams, pageKey, pageNumber - 1)} prefetch={false} className={linkClass}>
					Previous
				</Link>
			) : (
				<span className={disabledClass}>Previous</span>
			)}
			{showNext ? (
				<Link href={buildHref(basePath, baseParams, pageKey, pageNumber + 1)} prefetch={false} className={linkClass}>
					Next
				</Link>
			) : (
				<span className={disabledClass}>Next</span>
			)}
		</nav>
	);
}

export function TraderMarketsTable({
	page,
	pageNumber,
	basePath,
	baseParams,
}: {
	page: CursorPage<MarketEntry>;
	pageNumber: number;
	basePath: string;
	baseParams: Record<string, string>;
}) {
	return (
		<div className="space-y-4">
			<BreakdownTable<MarketEntry>
				rows={page.data}
				emptyMessage="No market PnL yet."
				identityHeader="Market"
				identityCell={(row) => {
					const label = row.event_slug ?? row.condition_id ?? null;
					if (!label) return <span className="text-muted-foreground">—</span>;
					if (row.event_slug) {
						return (
							<Link
								href={`/events/${row.event_slug}` as Route}
								prefetch={false}
								className="block max-w-[28rem] truncate font-medium text-foreground underline-offset-4 hover:underline"
							>
								{label}
							</Link>
						);
					}
					return <span className="block max-w-[28rem] truncate font-medium text-foreground">{label}</span>;
				}}
				pnl={(row) => readTotalPnlUsd(row)}
				volume={(row) => row.total_volume_usd ?? null}
				rightHeader="Trades"
				rightCell={(row) => formatNumber((row.total_buys ?? 0) + (row.total_sells ?? 0), { decimals: 0 })}
			/>
			<BreakdownPagination
				basePath={basePath}
				baseParams={baseParams}
				pageNumber={pageNumber}
				hasMore={page.hasMore}
				pageKey="marketsPage"
			/>
		</div>
	);
}

export function TraderCategoriesTable({
	page,
	pageNumber,
	basePath,
	baseParams,
}: {
	page: CursorPage<CategoryEntry>;
	pageNumber: number;
	basePath: string;
	baseParams: Record<string, string>;
}) {
	return (
		<div className="space-y-4">
			<BreakdownTable<CategoryEntry>
				rows={page.data}
				emptyMessage="No category PnL yet."
				identityHeader="Category"
				identityCell={(row) => (
					row.category ? (
						<span className="block max-w-[28rem] truncate font-medium text-foreground">{row.category}</span>
					) : (
						<span className="text-muted-foreground">—</span>
					)
				)}
				pnl={(row) => readTotalPnlUsd(row)}
				volume={(row) => row.total_volume_usd ?? null}
				rightHeader="Markets"
				rightCell={(row) => formatNumber(row.markets_traded ?? 0, { decimals: 0 })}
			/>
			<BreakdownPagination
				basePath={basePath}
				baseParams={baseParams}
				pageNumber={pageNumber}
				hasMore={page.hasMore}
				pageKey="categoriesPage"
			/>
		</div>
	);
}
