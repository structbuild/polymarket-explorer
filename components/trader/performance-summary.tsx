/* eslint-disable @next/next/no-img-element */
import { InfoRow } from "@/components/trader/info-row";
import { Separator } from "@/components/ui/separator";
import { formatDuration, formatNumber } from "@/lib/utils";
import type { GlobalPnlTrader, MarketMetadata } from "@structbuild/sdk";

type PerformanceSummaryProps = {
	pnlSummary: GlobalPnlTrader | null;
	bestTradeMarket?: MarketMetadata | null;
};

export function PerformanceSummary({ pnlSummary, bestTradeMarket }: PerformanceSummaryProps) {
	return (
		<div className="p-6 rounded-lg bg-card">
			<p className="text-base text-foreground">Performance Summary</p>
			<Separator className="my-2" />
			<InfoRow label="Traded" value={pnlSummary?.markets_traded ?? 0} />
			<InfoRow label="Wins" value={pnlSummary?.markets_won ?? 0} />
			<InfoRow label="Avg. Hold Time" value={formatDuration(pnlSummary?.avg_hold_time_seconds ?? 0)} />
			<InfoRow label="Realized PnL" value={formatNumber(pnlSummary?.pnl_usd ?? 0, { currency: true, compact: true })} />
			<div>
				<div className="flex items-center gap-2 justify-between">
					<p className="text-base text-foreground/90">Best Win</p>
					<div className="flex items-center gap-1.5">
						{bestTradeMarket && (
							<img src={bestTradeMarket.image_url ?? ""} alt={bestTradeMarket.question ?? ""} className="size-4 rounded-sm" />
						)}
						<p className="text-base font-medium">
							{formatNumber(pnlSummary?.best_trade_pnl_usd ?? 0, { currency: true, compact: true })}
						</p>
					</div>
				</div>
				{bestTradeMarket && <p className="text-sm text-muted-foreground truncate">{bestTradeMarket.question}</p>}
				<Separator className="my-2" />
			</div>
		</div>
	);
}
