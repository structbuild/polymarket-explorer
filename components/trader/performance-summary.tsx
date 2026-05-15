import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { InfoRow } from "@/components/trader/info-row";
import { PeriodRows } from "@/components/trader/period-rows";
import { Separator } from "@/components/ui/separator";
import type { PnlPeriods, PnlStreaks } from "@/lib/struct/pnl";
import { formatDuration, formatNumber } from "@/lib/format";
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";
import type { PnlV3ChangesResponse, PnlV3RiskResponse, GlobalEntry } from "@structbuild/sdk";

type PerformanceSummaryProps = {
	pnlSummary: GlobalEntry | null;
	pnlRisk?: PnlV3RiskResponse | null;
	pnlChanges?: PnlV3ChangesResponse | null;
	streaks: PnlStreaks;
	periods: PnlPeriods;
};

const PNL_CHANGE_WINDOWS = ["1d", "7d", "30d"] as const;

function PnlChangeBadges({ changes }: { changes: PnlV3ChangesResponse["changes"] | undefined }) {
	const byTimeframe = new Map(changes?.map((window) => [window.timeframe, window]) ?? []);

	return (
		<div className="grid grid-cols-3 gap-2 text-sm font-medium">
			{PNL_CHANGE_WINDOWS.map((window) => {
				const entry = byTimeframe.get(window);
				const change = entry?.total_pnl_change ?? null;
				const colorClass = change == null
					? "text-muted-foreground"
					: change > 0
						? "text-emerald-500"
						: change < 0
							? "text-red-500"
							: "text-foreground";

				return (
					<span key={window} className="min-w-0 whitespace-nowrap">
						<span className="text-muted-foreground">{window.toUpperCase()} </span>
						{change == null ? (
							<span className="text-muted-foreground">—</span>
						) : (
							<span className={cn(colorClass, "tabular-nums")}>
								{formatNumber(change, { currency: true, compact: true })}
							</span>
						)}
					</span>
				);
			})}
		</div>
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

function TradingStatsGrid({ pnlSummary }: { pnlSummary: GlobalEntry | null }) {
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

type TradeHighlight = NonNullable<GlobalEntry["best_trade_metadata"]>;

function TradeHighlightRow({
	label,
	pnl,
	metadata,
	tone,
}: {
	label: string;
	pnl: number | null | undefined;
	metadata: TradeHighlight | null | undefined;
	tone: "positive" | "negative";
}) {
	const hasTrade = tone === "positive" ? (pnl ?? 0) > 0 : (pnl ?? 0) < 0;
	const valueColor = tone === "positive" ? "text-emerald-500" : "text-red-500";
	const imageUrl = normalizePolymarketS3ImageUrl(metadata?.image_url);
	const href = hasTrade && metadata?.market_slug ? (`/markets/${metadata.market_slug}` as Route) : null;

	const tradeDetails = hasTrade ? (
		<div className="flex min-w-0 items-center gap-1.5 sm:justify-end">
			{imageUrl && (
				<Image
					src={imageUrl}
					alt={metadata?.question ?? metadata?.title ?? ""}
					width={16}
					height={16}
					className="size-4 rounded-sm object-cover"
				/>
			)}
			<p className={cn("text-sm font-medium sm:text-base", valueColor)}>
				{formatNumber(pnl ?? 0, { currency: true, compact: true })}
			</p>
		</div>
	) : null;

	const questionText = hasTrade && (metadata?.question || metadata?.title)
		? (metadata?.question ?? metadata?.title)
		: null;

	return (
		<div>
			<div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
				<p className="text-sm text-foreground/90 sm:text-base">{label}</p>
				{!hasTrade ? (
					<span className="text-sm font-medium text-muted-foreground sm:text-base">—</span>
				) : href ? (
					<Link href={href} className="min-w-0 hover:opacity-80 sm:justify-end">
						{tradeDetails}
					</Link>
				) : (
					tradeDetails
				)}
			</div>
			{questionText && (
				href ? (
					<Link
						href={href}
						className="mt-1 block text-sm text-muted-foreground break-words hover:text-foreground hover:underline sm:truncate"
					>
						{questionText}
					</Link>
				) : (
					<p className="mt-1 text-sm text-muted-foreground break-words sm:truncate">{questionText}</p>
				)
			)}
			<Separator className="my-2" />
		</div>
	);
}

function PnlStatsGrid({ pnlSummary }: { pnlSummary: GlobalEntry | null }) {
	const winRate = pnlSummary?.market_win_rate_pct ?? null;
	const profitFactor = pnlSummary?.profit_factor ?? null;
	const avgWin = pnlSummary?.avg_win_usd ?? null;
	const avgLoss = pnlSummary?.avg_loss_usd ?? null;
	const totalWins = pnlSummary?.total_wins_usd ?? null;
	const totalLosses = pnlSummary?.total_losses_usd ?? null;

	const stats: { label: string; node: React.ReactNode }[] = [
		{
			label: "Win Rate",
			node: winRate == null
				? <span className="text-muted-foreground">—</span>
				: <span className="tabular-nums">{formatNumber(winRate, { percent: true })}</span>,
		},
		{
			label: "Profit Factor",
			node: profitFactor == null || !Number.isFinite(profitFactor)
				? <span className="text-muted-foreground">—</span>
				: <span className="tabular-nums">{formatNumber(profitFactor, { decimals: 2 })}x</span>,
		},
		{
			label: "Avg Win",
			node: avgWin == null
				? <span className="text-muted-foreground">—</span>
				: <span className="text-emerald-500 tabular-nums">{formatNumber(avgWin, { currency: true, compact: true })}</span>,
		},
		{
			label: "Avg Loss",
			node: avgLoss == null
				? <span className="text-muted-foreground">—</span>
				: <span className="text-red-500 tabular-nums">{formatNumber(-Math.abs(avgLoss), { currency: true, compact: true })}</span>,
		},
		{
			label: "Total Wins",
			node: totalWins == null
				? <span className="text-muted-foreground">—</span>
				: <span className="text-emerald-500 tabular-nums">{formatNumber(totalWins, { currency: true, compact: true })}</span>,
		},
		{
			label: "Total Losses",
			node: totalLosses == null
				? <span className="text-muted-foreground">—</span>
				: <span className="text-red-500 tabular-nums">{formatNumber(-Math.abs(totalLosses), { currency: true, compact: true })}</span>,
		},
	];

	return (
		<div>
			<div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:gap-y-3">
				{stats.map((stat) => (
					<div key={stat.label} className="flex min-w-0 items-baseline justify-between gap-2">
						<p className="text-sm text-foreground/90 sm:text-base">{stat.label}</p>
						<p className="min-w-0 truncate text-sm font-medium sm:text-base">{stat.node}</p>
					</div>
				))}
			</div>
			<Separator className="my-2 sm:my-3" />
		</div>
	);
}

function MetricCell({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="min-w-0">
			<p className="truncate text-xs text-muted-foreground sm:text-sm">{label}</p>
			<div className="mt-0.5 min-w-0 truncate text-sm font-medium tabular-nums sm:text-base">{children}</div>
		</div>
	);
}

function StreakRow({ streaks }: { streaks: PnlStreaks }) {
	const current = streaks.current;
	const currentColor = current > 0 ? "text-emerald-500" : current < 0 ? "text-red-500" : "text-muted-foreground";
	const currentSuffix = current > 0 ? "W" : current < 0 ? "L" : "";

	return (
		<>
			<div className="grid grid-cols-2 gap-2">
				<MetricCell label="Longest Streak">
					<span className="text-emerald-500">{streaks.longestWin}d W</span>
					<span className="text-muted-foreground"> / </span>
					<span className="text-red-500">{streaks.longestLoss}d L</span>
				</MetricCell>
				<MetricCell label="Current Streak">
					<span className={currentColor}>
						{Math.abs(current)}d{currentSuffix && ` ${currentSuffix}`}
					</span>
				</MetricCell>
			</div>
			<Separator className="my-2 sm:my-3" />
		</>
	);
}

function RiskGrid({ totalPnlRisk }: { totalPnlRisk: PnlV3RiskResponse["total_pnl"] | null }) {
	return (
		<>
			<div className="grid grid-cols-3 gap-2">
				<MetricCell label="Max Drawdown">
					<RiskValue value={totalPnlRisk?.max_drawdown} pct={totalPnlRisk?.max_drawdown_pct} tone="negative" invert />
				</MetricCell>
				<MetricCell label="Current DD">
					<RiskValue value={totalPnlRisk?.current_drawdown} pct={totalPnlRisk?.current_drawdown_pct} tone="negative" invert />
				</MetricCell>
				<MetricCell label="Max Runup">
					<RiskValue value={totalPnlRisk?.max_runup} pct={totalPnlRisk?.max_runup_pct} tone="positive" />
				</MetricCell>
			</div>
			<Separator className="my-2 sm:my-3" />
		</>
	);
}

function EarningsGrid({ pnlSummary }: { pnlSummary: GlobalEntry | null }) {
	const entries = [
		{ label: "Rebates", usd: pnlSummary?.maker_rebate_usd, count: pnlSummary?.maker_rebate_count },
		{ label: "Rewards", usd: pnlSummary?.reward_usd, count: pnlSummary?.reward_count },
		{ label: "Yield", usd: pnlSummary?.yield_usd, count: pnlSummary?.yield_count },
	];

	return (
		<div className="grid grid-cols-3 gap-2">
			{entries.map((entry) => {
				const hasValue = entry.usd != null || (entry.count != null && entry.count > 0);
				const tone = (entry.usd ?? 0) > 0 ? "text-emerald-500" : "text-foreground";

				return (
					<MetricCell key={entry.label} label={entry.label}>
						{!hasValue ? (
							<span className="text-muted-foreground">—</span>
						) : (
							<>
								<span className={tone}>{formatNumber(entry.usd ?? 0, { currency: true, compact: true })}</span>
								{entry.count != null && entry.count > 0 && (
									<span className="ml-1 text-xs font-normal text-muted-foreground sm:text-sm">
										({formatNumber(entry.count, { decimals: 0 })})
									</span>
								)}
							</>
						)}
					</MetricCell>
				);
			})}
		</div>
	);
}

export function PerformanceSummary({ pnlSummary, pnlRisk, pnlChanges, streaks, periods }: PerformanceSummaryProps) {
	const totalPnlRisk = pnlRisk?.total_pnl ?? null;

	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<p className="text-sm text-foreground sm:text-base">Performance Summary</p>
			<Separator className="my-2" />
			<div>
				<p className="text-sm text-foreground/90 sm:text-base">PnL Change</p>
				<div className="mt-1">
					<PnlChangeBadges changes={pnlChanges?.changes} />
				</div>
				<Separator className="my-2 sm:my-3" />
			</div>
			<TradingStatsGrid pnlSummary={pnlSummary} />
			<PnlStatsGrid pnlSummary={pnlSummary} />
			<InfoRow label="Avg. Hold Time" value={formatDuration(pnlSummary?.avg_hold_time_seconds ?? 0)} />
			<TradeHighlightRow
				label="Best Win"
				pnl={pnlSummary?.best_trade_pnl_usd}
				metadata={pnlSummary?.best_trade_metadata}
				tone="positive"
			/>
			<TradeHighlightRow
				label="Worst Loss"
				pnl={pnlSummary?.worst_trade_pnl_usd}
				metadata={pnlSummary?.worst_trade_metadata}
				tone="negative"
			/>
			<PeriodRows periods={periods} />
			<Separator className="my-2 sm:my-3" />
			<StreakRow streaks={streaks} />
			<RiskGrid totalPnlRisk={totalPnlRisk} />
			<EarningsGrid pnlSummary={pnlSummary} />
		</div>
	);
}
