import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { getPlatformCounts } from "@/lib/struct/market-queries";

const stats = [
	{ key: "markets" as const, label: "Markets" },
	{ key: "events" as const, label: "Events" },
	{ key: "traders" as const, label: "Traders" },
	{ key: "positions" as const, label: "Positions" },
	{ key: "tags" as const, label: "Tags" },
];

export async function PlatformStats() {
	const counts = await getPlatformCounts();

	if (!counts) {
		return null;
	}

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
			{stats.map(({ key, label }) => (
				<Card key={key} size="sm" className="px-2 rounded-lg ring-0 ">
					<CardContent className="flex flex-col gap-0.5">
							<p className="text-sm text-muted-foreground">{label}</p>
							<p className="text-xl font-medium tabular-nums">
								{formatNumber(counts[key], { compact: false })}
							</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function PlatformStatsFallback() {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
			{Array.from({ length: 5 }, (_, i) => (
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
