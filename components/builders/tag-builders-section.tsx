import type { Route } from "next";
import Link from "next/link";

import { getTagBuilders } from "@/lib/struct/builder-queries";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { formatNumber } from "@/lib/format";
import { cn, formatBuilderCodeDisplay } from "@/lib/utils";

type TagBuildersSectionProps = {
	tagLabel: string;
	limit?: number;
};

export async function TagBuildersSection({ tagLabel, limit = 8 }: TagBuildersSectionProps) {
	const rows = await getTagBuilders(tagLabel, "volume", "lifetime", limit);

	if (rows.length === 0) return null;

	const totalVolume = rows.reduce((sum, row) => sum + (row.volume_usd ?? 0), 0);
	const topVolume = rows[0]?.volume_usd ?? 0;

	return (
		<Card variant="analytics">
			<CardContent className="space-y-4">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex items-center gap-1.5">
						<h2 className="text-sm font-medium text-muted-foreground">Top builders</h2>
						<InfoTooltip content="Apps and integrators routing the most volume into this tag. Bars are scaled against the top builder in this list." />
					</div>
					<p className="text-sm tabular-nums text-muted-foreground">
						{rows.length} builders routed{" "}
						<span className="font-medium text-foreground">
							{formatNumber(totalVolume, { compact: true, currency: true })}
						</span>
					</p>
				</div>

				<div className="space-y-1.5">
					<div className="hidden grid-cols-[2.5rem_minmax(8rem,1fr)_minmax(9rem,1.6fr)_5rem_5rem_5rem] items-center gap-3 px-2 text-xs text-muted-foreground sm:grid">
						<span>#</span>
						<span>Builder</span>
						<span>Relative volume</span>
						<span className="text-right">Volume</span>
						<span className="text-right">Traders</span>
						<span className="text-right">Trades</span>
					</div>
					{rows.map((row, index) => {
						const volume = row.volume_usd ?? 0;
						const share = totalVolume > 0 ? volume / totalVolume : 0;
						const relativeVolume = topVolume > 0 ? volume / topVolume : 0;
						const isLeader = index === 0;

						return (
							<div
								key={row.builder_code}
								className={cn(
									"rounded-md px-2 py-2",
									isLeader ? "bg-muted/45" : "hover:bg-muted/30",
								)}
							>
								<div className="grid gap-2 sm:grid-cols-[2.5rem_minmax(8rem,1fr)_minmax(9rem,1.6fr)_5rem_5rem_5rem] sm:items-center sm:gap-3">
									<div className="flex min-w-0 items-center justify-between gap-3 sm:contents">
										<span
											className={cn(
												"text-sm tabular-nums",
												isLeader ? "font-medium text-foreground" : "text-muted-foreground",
											)}
										>
											{index + 1}
										</span>
										<Link
											href={`/builders/${encodeURIComponent(row.builder_code)}` as Route}
											prefetch={false}
											title={row.builder_code}
											className="min-w-0 truncate font-mono text-sm font-medium text-foreground underline-offset-4 hover:underline sm:font-normal"
										>
											{formatBuilderCodeDisplay(row.builder_code)}
										</Link>
										<div className="flex shrink-0 items-baseline gap-2 sm:hidden">
											<span className="text-sm font-medium tabular-nums text-foreground">
												{formatNumber(volume, { compact: true, currency: true })}
											</span>
											<span className="text-xs tabular-nums text-muted-foreground">
												{formatNumber(share * 100, { decimals: 1, percent: true })}
											</span>
										</div>
									</div>

									<div className="min-w-0">
										<div className="relative h-2.5 overflow-hidden rounded bg-muted">
											<div
												className={cn("h-full rounded", isLeader ? "bg-primary" : "bg-primary/70")}
												style={{ width: `${Math.max(relativeVolume * 100, 2).toFixed(2)}%` }}
											/>
										</div>
										<p className="mt-1 text-xs tabular-nums text-muted-foreground sm:hidden">
											{formatNumber(row.unique_traders, { compact: true })} traders,{" "}
											{formatNumber(row.txn_count, { compact: true })} trades, share of top list
										</p>
									</div>

									<span className="hidden text-right text-sm tabular-nums text-foreground sm:block">
										{formatNumber(volume, { compact: true, currency: true })}
										<span className="ml-1.5 text-xs text-muted-foreground">
											{formatNumber(share * 100, { decimals: 1, percent: true })}
										</span>
									</span>
									<span className="hidden text-right text-sm tabular-nums text-foreground/80 sm:block">
										{formatNumber(row.unique_traders, { compact: true })}
									</span>
									<span className="hidden text-right text-sm tabular-nums text-foreground/80 sm:block">
										{formatNumber(row.txn_count, { compact: true })}
									</span>
								</div>
							</div>
						);
					})}
				</div>

				<div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
					<span>Share is calculated across the displayed builders.</span>
					<Link href="/builders" prefetch={false} className="font-medium text-foreground underline-offset-4 hover:underline">
						View all builders
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
