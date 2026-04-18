import type { Tag } from "@structbuild/sdk";

import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

type Stat = {
	label: string;
	value: number;
	currency: boolean;
};

function buildStats(tag: Tag): Stat[] {
	return [
		{ label: "volume", value: tag.volume_usd ?? 0, currency: true },
		{ label: "traders", value: tag.unique_traders ?? 0, currency: false },
		{ label: "trades", value: tag.txn_count ?? 0, currency: false },
		{ label: "fees", value: tag.fees_usd ?? 0, currency: true },
	];
}

function formatStatValue(value: number, currency: boolean): string {
	if (value <= 0) return "—";
	return formatNumber(value, { compact: true, currency }) as string;
}

export function TagStatsRow({ tag, className }: { tag: Tag; className?: string }) {
	const stats = buildStats(tag);
	return (
		<p
			className={cn(
				"text-sm text-muted-foreground flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5",
				className,
			)}
		>
			{stats.map((stat, index) => (
				<span key={stat.label} className="inline-flex items-baseline gap-1">
					{index > 0 && <span className="text-muted-foreground/50">·</span>}
					<span className="text-foreground font-medium tabular-nums">
						{formatStatValue(stat.value, stat.currency)}
					</span>
					<span>{stat.label}</span>
				</span>
			))}
		</p>
	);
}
