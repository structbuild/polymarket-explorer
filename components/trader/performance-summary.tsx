import Image from "next/image";
import { InfoRow } from "@/components/trader/info-row";
import { Separator } from "@/components/ui/separator";
import type { PnlPeriodRecord, PnlPeriodWindow, PnlPeriods, PnlStreaks } from "@/lib/struct/pnl";
import { formatDateCompact, formatDuration, formatNumber } from "@/lib/format";
import type { MarketResponse, PnlV3RiskResponse, TraderPnlSummary } from "@structbuild/sdk";

type PerformanceSummaryProps = {
	pnlSummary: TraderPnlSummary | null;
	bestTradeMarket?: MarketResponse | null;
	pnlRisk?: PnlV3RiskResponse | null;
	streaks: PnlStreaks;
	periods: PnlPeriods;
};

const periodWindowLabels = {
	day: "D",
	week: "W",
	month: "M",
} satisfies Record<PnlPeriodWindow, string>;

function formatPeriodRange(period: PnlPeriodRecord, window: PnlPeriodWindow) {
	if (window === "day") return formatDateCompact(period.from);

	const start = formatDateCompact(period.from);
	const end = formatDateCompact(period.to);
	return start === end ? start : `${start}-${end}`;
}

function PeriodInlineValue({ period, window, tone }: { period: PnlPeriodRecord | null; window: PnlPeriodWindow; tone: "positive" | "negative" }) {
	const isEmpty = !period || (tone === "positive" ? period.change <= 0 : period.change >= 0);
	const colorClassName = tone === "positive" ? "text-emerald-500" : "text-red-500";

	return (
		<span className="min-w-0 whitespace-nowrap">
			<span className="text-muted-foreground">{periodWindowLabels[window]} </span>
			{isEmpty ? (
				<span className="text-muted-foreground">—</span>
			) : (
				<>
					<span className={colorClassName}>{formatNumber(period.change, { currency: true, compact: true })}</span>
					<span className="font-normal text-muted-foreground">, {formatPeriodRange(period, window)}</span>
				</>
			)}
		</span>
	);
}

function RiskValue({
	value,
	pct,
	tone,
	invert = false,
}: {
	value: number | null | undefined;
	pct?: number | null;
	tone: "positive" | "negative";
	invert?: boolean;
}) {
	if (value == null) return <span className="text-muted-foreground">—</span>;

	const signedValue = invert && value !== 0 ? -Math.abs(value) : value;
	const signedPct = pct == null ? null : invert && pct !== 0 ? -Math.abs(pct) : pct;
	const colorClassName = tone === "positive" ? "text-emerald-500" : "text-red-500";

	return (
		<>
			<span className={colorClassName}>{formatNumber(signedValue, { currency: true, compact: true })}</span>
			{signedPct != null && <span className="font-normal text-muted-foreground"> ({formatNumber(signedPct, { percent: true })})</span>}
		</>
	);
}

function PeriodRows({ periods }: { periods: PnlPeriods }) {
	const windowValues: PnlPeriodWindow[] = ["day", "week", "month"];

	return (
		<div>
			<div className="space-y-2">
				<div>
					<p className="text-sm text-foreground/90 sm:text-base">Best Period</p>
					<div className="mt-1 grid grid-cols-3 gap-2 text-sm font-medium">
						{windowValues.map((window) => (
							<PeriodInlineValue key={window} period={periods.totalPnl[window].best} window={window} tone="positive" />
						))}
					</div>
				</div>
				<div>
					<p className="text-sm text-foreground/90 sm:text-base">Worst Period</p>
					<div className="mt-1 grid grid-cols-3 gap-2 text-sm font-medium">
						{windowValues.map((window) => (
							<PeriodInlineValue key={window} period={periods.totalPnl[window].worst} window={window} tone="negative" />
						))}
					</div>
				</div>
			</div>
			<Separator className="my-2 sm:my-3" />
		</div>
	);
}

function TradingStatsGrid({ pnlSummary }: { pnlSummary: TraderPnlSummary | null }) {
	const stats = [
		{ label: "Events", value: pnlSummary?.events_traded ?? 0 },
		{ label: "Markets", value: pnlSummary?.markets_traded ?? 0 },
		{ label: "Won", value: pnlSummary?.markets_won ?? 0, className: "text-emerald-500" },
		{ label: "Lost", value: pnlSummary?.markets_lost ?? 0, className: "text-red-500" },
	];

	return (
		<div>
			<div className="grid grid-cols-4 gap-2">
				{stats.map((stat) => (
					<div key={stat.label} className="min-w-0">
						<p className="truncate text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
						<p className={`mt-0.5 truncate text-sm font-medium tabular-nums sm:text-base ${stat.className ?? "text-foreground"}`}>
							{stat.value}
						</p>
					</div>
				))}
			</div>
			<Separator className="my-2 sm:my-3" />
		</div>
	);
}

export function PerformanceSummary({ pnlSummary, bestTradeMarket, pnlRisk, streaks, periods }: PerformanceSummaryProps) {
	const totalPnlRisk = pnlRisk?.total_pnl ?? null;

	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<p className="text-sm text-foreground sm:text-base">Performance Summary</p>
			<Separator className="my-2" />
			<TradingStatsGrid pnlSummary={pnlSummary} />
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
			<PeriodRows periods={periods} />
			<InfoRow label="Longest Win Streak" value={`${streaks.longestWin}d`} />
			<InfoRow label="Longest Loss Streak" value={`${streaks.longestLoss}d`} />
			<InfoRow
				label="Max Drawdown"
				value={
					<RiskValue
						value={totalPnlRisk?.max_drawdown}
						pct={totalPnlRisk?.max_drawdown_pct}
						tone="negative"
						invert
					/>
				}
			/>
			<InfoRow
				label="Current Drawdown"
				value={
					<RiskValue
						value={totalPnlRisk?.current_drawdown}
						pct={totalPnlRisk?.current_drawdown_pct}
						tone="negative"
						invert
					/>
				}
			/>
			<InfoRow
				label="Max Runup"
				value={
					<RiskValue
						value={totalPnlRisk?.max_runup}
						pct={totalPnlRisk?.max_runup_pct}
						tone="positive"
					/>
				}
			/>
			<InfoRow
				label="Current Streak"
				value={`${Math.abs(streaks.current)}d ${streaks.current > 0 ? "W" : streaks.current < 0 ? "L" : ""}`}
				separator={false}
			/>
		</div>
	);
}
