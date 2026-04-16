import { MarketPriceSpikesTable } from "@/components/market/market-price-spikes-table";
import { MarketTabs } from "@/components/market/market-tabs";
import { getMarketPriceJumps } from "@/lib/struct/market-queries";

export async function MarketPriceSpikes({ conditionId }: { conditionId: string }) {
	const jumps = await getMarketPriceJumps(conditionId);
	const spikes = (jumps ?? []).slice().sort((a, b) => b.from - a.from);

	return <MarketPriceSpikesTable spikes={spikes} />;
}

export function MarketPriceSpikesFallback() {
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
