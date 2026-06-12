import type { CategoryEntry, PolymarketCategory, TraderInfo } from "@structbuild/sdk";

import { PaginationNav } from "@/components/seo/pagination-nav";
import { TraderTableCell } from "@/components/trader/trader-table-cell";
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
import { getCategoryTopTraders } from "@/lib/struct/queries";
import { cn, normalizeWalletAddress } from "@/lib/utils";

const PAGE_SIZE = 25;

type CategoryRow = CategoryEntry & { trader: TraderInfo };

export async function TagTopTradersListing({
	category,
	basePath,
	baseParams,
	cursor,
}: {
	category: PolymarketCategory;
	basePath: string;
	baseParams: Record<string, string>;
	cursor: string | null;
}) {
	const { data, hasMore, nextCursor } = await getCategoryTopTraders(category, {
		limit: PAGE_SIZE,
		sort_by: "realized_pnl_usd",
		sort_direction: "desc",
		...(cursor ? { pagination_key: cursor } : {}),
	});
	const rows = data as unknown as CategoryRow[];

	return (
		<div className="space-y-4">
			<div className="overflow-hidden rounded-lg border bg-card">
				{rows.length === 0 ? (
					<p className="px-4 py-12 text-center text-sm text-muted-foreground sm:px-6">
						No top traders for this category yet.
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-12">#</TableHead>
								<TableHead>Trader</TableHead>
								<TableHead className="text-right">PnL</TableHead>
								<TableHead className="text-right">Markets</TableHead>
								<TableHead className="text-right">Volume</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row, index) => {
								const address = normalizeWalletAddress(row.trader.address) ?? row.trader.address;
								const pnl = readTotalPnlUsd(row);

								return (
									<TableRow key={`${address}-${index}`}>
										<TableCell className="text-muted-foreground tabular-nums">{index + 1}</TableCell>
										<TableCell>
											<TraderTableCell trader={row.trader} />
										</TableCell>
										<TableCell className={cn("text-right font-medium tabular-nums", pnlColorClass(pnl))}>
											{formatNumber(pnl, { currency: true, compact: true })}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{formatNumber(row.markets_traded ?? 0, { decimals: 0 })}
										</TableCell>
										<TableCell className="text-right">
											<Volume usd={row.total_volume_usd ?? null} shares={null} className="tabular-nums" />
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</div>
			<PaginationNav
				basePath={basePath}
				baseParams={baseParams}
				cursor={cursor}
				nextCursor={nextCursor}
				hasMore={hasMore}
			/>
		</div>
	);
}
