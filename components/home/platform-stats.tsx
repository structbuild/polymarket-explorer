import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { getPlatformCounts } from "@/lib/struct/market-queries";
import { TagIcon, CalendarIcon, BarChart3Icon, LayersIcon, UsersIcon } from "lucide-react";

const stats = [
	{ key: "markets" as const, label: "Markets", icon: BarChart3Icon },
	{ key: "events" as const, label: "Events", icon: CalendarIcon },
	{ key: "traders" as const, label: "Traders", icon: UsersIcon },
	{ key: "positions" as const, label: "Positions", icon: LayersIcon },
	{ key: "tags" as const, label: "Tags", icon: TagIcon },
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
				<Card key={i} size="sm">
					<CardContent className="flex items-center gap-3">
						<div className="size-9 shrink-0 animate-pulse rounded-lg bg-muted" />
						<div className="min-w-0 space-y-1.5">
							<div className="h-5 w-16 animate-pulse rounded bg-muted" />
							<div className="h-3 w-12 animate-pulse rounded bg-muted" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
