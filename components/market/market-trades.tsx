import { MarketTabs } from "@/components/market/market-tabs";
import { MarketTradesTable } from "@/components/market/market-trades-table";
import { defaultMarketTradesPageSize, getMarketTradesPage } from "@/lib/struct/market-queries";

export async function MarketTrades({
	conditionId,
	pageNumber,
}: {
	conditionId: string;
	pageNumber: number;
}) {
	const page = await getMarketTradesPage(conditionId, {
		limit: defaultMarketTradesPageSize,
		offset: (pageNumber - 1) * defaultMarketTradesPageSize,
	});

	return <MarketTradesTable page={page} pageNumber={pageNumber} />;
}

export function MarketTradesFallback() {
	return (
		<div className="space-y-3">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div className="min-w-0 flex-1">
					<MarketTabs prefetchEnabled={false} />
				</div>
			</div>
			<div className="overflow-hidden rounded-lg bg-card">
				<div className="space-y-2 p-4">
					{Array.from({ length: 8 }, (_, i) => (
						<div key={i} className="h-12 animate-pulse rounded bg-muted/60" />
					))}
				</div>
			</div>
		</div>
	);
}
