import type { EventEntry, TraderInfo } from "@structbuild/sdk";

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
import { getEventTopTradersV3 } from "@/lib/struct/queries";
import { cn, normalizeWalletAddress } from "@/lib/utils";

const TOP_TRADERS_LIMIT = 10;

type EventTopTraderRow = EventEntry & {
	trader: TraderInfo;
};

export async function EventTopTraders({ eventSlug }: { eventSlug: string }) {
	const { data } = await getEventTopTradersV3(eventSlug, { limit: TOP_TRADERS_LIMIT });
	const rows = data as unknown as EventTopTraderRow[];

	if (rows.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-medium tracking-tight">Top traders across this event</h2>
			<div className="overflow-hidden rounded-lg border bg-card">
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
			</div>
		</div>
	);
}

export function EventTopTradersFallback() {
	return (
		<div className="space-y-4">
			<div className="h-6 w-64 animate-pulse rounded bg-muted" />
			<div className="overflow-hidden rounded-lg border bg-card">
				<div className="space-y-2 p-4">
					{Array.from({ length: TOP_TRADERS_LIMIT }, (_, i) => (
						<div key={i} className="h-12 animate-pulse rounded bg-muted/60" />
					))}
				</div>
			</div>
		</div>
	);
}
