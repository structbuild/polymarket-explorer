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
		<div className="overflow-hidden rounded-lg bg-card">
			<div className="space-y-2 p-4">
				{Array.from({ length: 8 }, (_, i) => (
					<div key={i} className="h-12 animate-pulse rounded bg-muted/60" />
				))}
			</div>
		</div>
	);
}
