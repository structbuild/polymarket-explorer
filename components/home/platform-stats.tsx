import type { GlobalCountsResponse } from "@structbuild/sdk";

import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { getPlatformCounts } from "@/lib/struct/market-queries";

type StatSpec = {
	key: keyof GlobalCountsResponse;
	label: string;
	currency?: boolean;
	compact?: boolean;
};

const stats: StatSpec[] = [
	{ key: "volume_usd", label: "Volume", currency: true, compact: true },
	{ key: "txn_count", label: "Trades", compact: true },
	{ key: "markets", label: "Markets" },
	{ key: "events", label: "Events" },
	{ key: "unique_traders", label: "Traders" },
	{ key: "unique_makers", label: "Makers" },
	{ key: "unique_takers", label: "Takers" },
	{ key: "positions", label: "Positions" },
];

const GRID_CLASS = "grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4";

export async function PlatformStats() {
	const counts = await getPlatformCounts();

	if (!counts) {
		return null;
	}

	return (
		<div className={GRID_CLASS}>
			{stats.map(({ key, label, currency, compact }) => (
				<Card key={key} size="sm" className="px-2 rounded-lg ring-0 ">
					<CardContent className="flex flex-col gap-0.5">
							<p className="text-sm text-muted-foreground">{label}</p>
							<p className="text-xl font-medium tabular-nums">
								{formatNumber(Number(counts[key] ?? 0), { compact, currency })}
							</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function PlatformStatsFallback() {
	return (
		<div className={GRID_CLASS}>
			{Array.from({ length: stats.length }, (_, i) => (
				<Card key={i} size="sm" className="px-2 rounded-lg ring-0 ">
					<CardContent className="flex flex-col gap-0.5">
						<div className="h-5 w-16 animate-pulse rounded bg-muted" />
						<div className="h-7 w-20 animate-pulse rounded bg-muted" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}
