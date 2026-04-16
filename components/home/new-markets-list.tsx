import { HomeTabsBar } from "@/components/home/home-activity-tabs";
import { HomeRefreshButton } from "@/components/home/home-refresh-button";
import { MarketsTable } from "@/components/market/markets-table";
import { marketResponseToRow } from "@/lib/market-table-map";
import { getHomeTopMarkets } from "@/lib/struct/market-queries";

const MARKET_FETCH_COUNT = 12;

export async function NewMarketsList() {
	const result = await getHomeTopMarkets(MARKET_FETCH_COUNT, "all", undefined, "created_time", "desc", "24h", "Hide from New");
	const rows = result.data.map(marketResponseToRow);

	return (
		<MarketsTable
			markets={rows}
			storageKey="home-new-markets"
			paginationMode="none"
			toolbarLeft={<HomeTabsBar />}
			toolbarRight={<HomeRefreshButton kind="markets" />}
		/>
	);
}

export function NewMarketsListFallback() {
	return (
		<div className="space-y-3">
			<div className="flex items-end justify-between gap-3">
				<HomeTabsBar />
				<div className="flex items-center gap-3">
					<div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
					<div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
				</div>
			</div>
			<div className="overflow-hidden rounded-lg bg-card">
				{Array.from({ length: MARKET_FETCH_COUNT }, (_, i) => (
					<div key={i} className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0">
						<div className="size-10 shrink-0 animate-pulse rounded-md bg-muted" />
						<div className="min-w-0 flex-1 space-y-1.5">
							<div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
							<div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
