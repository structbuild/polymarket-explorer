import { connection } from "next/server";

import { HomeRefreshButton } from "@/components/home/home-refresh-button";
import { RecentTradesTable } from "@/components/home/recent-trades-table";
import { getRecentTrades } from "@/lib/struct/market-queries";

export async function RecentTradesList() {
	await connection();

	const trades = await getRecentTrades(15);

	return <RecentTradesTable trades={trades} homeToolbarGrid toolbarAfterTimeframe={<HomeRefreshButton />} />;
}

export function RecentTradesListFallback() {
	return (
		<div className="space-y-3">
			<div className="overflow-hidden rounded-lg bg-card">
				{Array.from({ length: 15 }, (_, i) => (
					<div key={i} className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0">
						<div className="size-6 shrink-0 animate-pulse rounded-full bg-muted" />
						<div className="min-w-0 flex-1 space-y-1.5">
							<div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
							<div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
