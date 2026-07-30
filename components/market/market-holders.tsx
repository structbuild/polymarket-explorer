import { HoldersTableFallback } from "@/components/holders/holders-table";
import { MarketHoldersClient } from "@/components/market/market-holders-client";
import { getMarketHolders } from "@/lib/struct/market-queries";

export async function MarketHolders({ slug }: { slug: string }) {
	const data = await getMarketHolders(slug, 25);

	if (!data?.outcomes?.length) {
		return (
			<div className="rounded-lg bg-card px-4 py-12 text-center text-sm text-muted-foreground sm:px-6">
				No holders yet
			</div>
		);
	}

	return <MarketHoldersClient outcomes={data.outcomes} />;
}

export function MarketHoldersFallback() {
	return <HoldersTableFallback />;
}
