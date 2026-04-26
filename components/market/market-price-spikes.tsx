import { MarketPriceSpikesTable } from "@/components/market/market-price-spikes-table";
import { getMarketPriceJumps } from "@/lib/struct/market-queries";

export async function MarketPriceSpikes({ conditionId }: { conditionId: string }) {
	const jumps = await getMarketPriceJumps(conditionId);
	const spikes = (jumps ?? []).slice().sort((a, b) => b.from - a.from);

	return <MarketPriceSpikesTable spikes={spikes} />;
}

export function MarketPriceSpikesFallback() {
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
