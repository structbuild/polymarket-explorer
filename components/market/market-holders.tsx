import type { Route } from "next";
import Link from "next/link";

import { cn, getTraderDisplayName } from "@/lib/utils";
import { formatNumber, pnlColorClass } from "@/lib/format";
import { getMarketHolders } from "@/lib/struct/market-queries";

export async function MarketHolders({ slug }: { slug: string }) {
	const holders = await getMarketHolders(slug, 10);

	if (!holders?.outcomes?.length) return null;

	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<h2 className="mb-4 text-sm font-medium text-muted-foreground">
				Top Holders
			</h2>
			<div className="space-y-5">
				{holders.outcomes.map((outcomeGroup) => (
					<div key={outcomeGroup.outcome_index} className="space-y-2">
						<h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
							{outcomeGroup.outcome_name}
						</h3>
						<div className="space-y-1">
							{outcomeGroup.holders.slice(0, 5).map((holder, idx) => {
								const displayName = getTraderDisplayName(holder.trader);
								const traderHref = `/traders/${holder.trader.address}` as Route;

								return (
									<div
										key={holder.trader.address}
										className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
									>
										<span className="w-5 shrink-0 text-center font-mono text-xs tabular-nums text-muted-foreground/50">
											{idx + 1}
										</span>
										<Link
											href={traderHref}
											className="min-w-0 flex-1 truncate text-sm text-foreground transition-colors group-hover:text-primary"
										>
											{displayName}
										</Link>
										<div className="flex shrink-0 items-center gap-3 text-xs">
											<span className="font-mono tabular-nums text-muted-foreground">
												{holder.shares_usd
													? formatNumber(Number(holder.shares_usd), {
															compact: true,
															currency: true,
														})
													: `${formatNumber(Number(holder.shares), { compact: true })} shares`}
											</span>
											{holder.pnl?.unrealized_pnl_usd != null && (
												<span
													className={cn(
														"font-mono font-medium tabular-nums",
														pnlColorClass(Number(holder.pnl.unrealized_pnl_usd)),
													)}
												>
													{formatNumber(Number(holder.pnl.unrealized_pnl_usd), {
														compact: true,
														currency: true,
													})}
												</span>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export function MarketHoldersFallback() {
	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted" />
			<div className="space-y-5">
				{Array.from({ length: 2 }, (_, groupIdx) => (
					<div key={groupIdx} className="space-y-2">
						<div className="h-3 w-12 animate-pulse rounded bg-muted" />
						<div className="space-y-1">
							{Array.from({ length: 5 }, (_, idx) => (
								<div
									key={idx}
									className="flex items-center gap-2 px-2 py-1.5"
								>
									<div className="h-4 w-5 animate-pulse rounded bg-muted" />
									<div className="h-4 w-24 animate-pulse rounded bg-muted" />
									<div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted" />
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
