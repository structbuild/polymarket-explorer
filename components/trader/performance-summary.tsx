import Image from "next/image";
import { InfoRow } from "@/components/trader/info-row";
import { Separator } from "@/components/ui/separator";
import type { PnlStreaks } from "@/lib/struct/pnl";
import { formatDuration, formatNumber } from "@/lib/format";
import type { MarketResponse, TraderPnlSummary } from "@structbuild/sdk";

type PerformanceSummaryProps = {
	pnlSummary: TraderPnlSummary | null;
	bestTradeMarket?: MarketResponse | null;
	streaks: PnlStreaks;
};

export function PerformanceSummary({ pnlSummary, bestTradeMarket, streaks }: PerformanceSummaryProps) {
	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<p className="text-sm text-foreground sm:text-base">Performance Summary</p>
			<Separator className="my-2" />
			<InfoRow label="Events Traded" value={pnlSummary?.events_traded ?? 0} />
			<InfoRow label="Markets Traded" value={pnlSummary?.markets_traded ?? 0} />
			<InfoRow label="Markets Won" value={<span className="text-emerald-500">{pnlSummary?.markets_won ?? 0}</span>} />
			<InfoRow label="Markets Lost" value={<span className="text-red-500">{pnlSummary?.markets_lost ?? 0}</span>} />
			<InfoRow label="Avg. Hold Time" value={formatDuration(pnlSummary?.avg_hold_time_seconds ?? 0)} />
			<div>
				<div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
					<p className="text-sm text-foreground/90 sm:text-base">Best Win</p>
					{(pnlSummary?.best_trade_pnl_usd ?? 0) <= 0 ? (
						<span className="text-sm font-medium text-muted-foreground sm:text-base">—</span>
					) : (
						<div className="flex min-w-0 items-center gap-1.5 sm:justify-end">
							{bestTradeMarket?.image_url && (
								<Image
									src={bestTradeMarket.image_url}
									alt={bestTradeMarket.question ?? ""}
									width={16}
									height={16}
									className="size-4 rounded-sm object-cover"
								/>
							)}
							<p className="text-sm font-medium text-emerald-500 sm:text-base">
								{formatNumber(pnlSummary?.best_trade_pnl_usd ?? 0, { currency: true, compact: true })}
							</p>
						</div>
					)}
				</div>
				{(pnlSummary?.best_trade_pnl_usd ?? 0) > 0 && bestTradeMarket && <p className="mt-1 text-sm text-muted-foreground break-words sm:truncate">{bestTradeMarket.question}</p>}
				<Separator className="my-2" />
			</div>
			<InfoRow
				label="Best Day"
				value={
					streaks.bestDay.pnl <= 0 ? (
						<span className="text-muted-foreground">—</span>
					) : (
						<>
							<span className="text-emerald-500">{formatNumber(streaks.bestDay.pnl, { currency: true, compact: true })}</span>
							{streaks.bestDay.date && <span className="font-normal text-muted-foreground">, {streaks.bestDay.date}</span>}
						</>
					)
				}
			/>
			<InfoRow
				label="Worst Day"
				value={
					streaks.worstDay.pnl === 0 ? (
						<span className="text-muted-foreground">—</span>
					) : (
						<>
							<span className="text-red-500">{formatNumber(streaks.worstDay.pnl, { currency: true, compact: true })}</span>
							{streaks.worstDay.date && <span className="font-normal text-muted-foreground">, {streaks.worstDay.date}</span>}
						</>
					)
				}
			/>
			<InfoRow label="Longest Win Streak" value={`${streaks.longestWin}d`} />
			<InfoRow label="Longest Loss Streak" value={`${streaks.longestLoss}d`} />
			<InfoRow
				label="Current Streak"
				value={`${Math.abs(streaks.current)}d ${streaks.current > 0 ? "W" : streaks.current < 0 ? "L" : ""}`}
				separator={false}
			/>
		</div>
	);
}
