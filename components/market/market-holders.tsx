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
	return (
		<div className="space-y-3">
			<div className="flex gap-4">
				<div className="h-6 w-24 animate-pulse rounded bg-muted/60" />
				<div className="h-6 w-24 animate-pulse rounded bg-muted/60" />
			</div>
			<div className="rounded-lg bg-card p-4 sm:p-6">
				<div className="space-y-2">
					{Array.from({ length: 8 }, (_, i) => (
						<div key={i} className="flex items-center gap-3">
							<div className="size-8 animate-pulse rounded-md bg-muted/60" />
							<div className="h-3 flex-1 animate-pulse rounded bg-muted/60" />
							<div className="h-3 w-16 animate-pulse rounded bg-muted/60" />
							<div className="h-3 w-16 animate-pulse rounded bg-muted/60" />
							<div className="h-3 w-16 animate-pulse rounded bg-muted/60" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
