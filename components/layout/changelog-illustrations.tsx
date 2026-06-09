import type { ReactNode } from "react";
import Image from "next/image";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChangelogTag } from "@/lib/changelog";

function meshBackground(color: string) {
	return [
		`radial-gradient(110% 110% at 12% 0%, color-mix(in oklab, ${color} 26%, transparent), transparent 62%)`,
		`radial-gradient(130% 120% at 88% 115%, color-mix(in oklab, ${color} 16%, transparent), transparent 66%)`,
		"var(--background)",
	].join(", ");
}

const MESH: Record<ChangelogTag, string> = {
	new: meshBackground("var(--color-emerald-400)"),
	improved: meshBackground("var(--color-violet-400)"),
	fixed: meshBackground("var(--color-amber-400)"),
};

function Stage({ tag, children }: { tag: ChangelogTag; children: ReactNode }) {
	return (
		<div aria-hidden className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ background: MESH[tag] }}>
			{children}
		</div>
	);
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
	return (
		<div className={cn("relative w-64 rounded-xl bg-card p-3 shadow-lg shadow-black/10 ring-1 ring-border", className)}>{children}</div>
	);
}

function Pill({ active, children }: { active?: boolean; children: ReactNode }) {
	return (
		<span
			className={cn(
				"shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
				active ? "bg-foreground text-background" : "bg-foreground/5 text-muted-foreground",
			)}
		>
			{children}
		</span>
	);
}

function Tab({ active, children }: { active?: boolean; children: ReactNode }) {
	return (
		<span
			className={cn(
				"border-b-2 pb-0.5 text-[10px]",
				active ? "border-foreground font-semibold text-foreground" : "border-transparent text-muted-foreground",
			)}
		>
			{children}
		</span>
	);
}

function Delta({ tone, children }: { tone: "up" | "down"; children: ReactNode }) {
	const up = tone === "up";
	const Icon = up ? TrendingUpIcon : TrendingDownIcon;
	return (
		<span className="flex items-center gap-1">
			<span className={cn("flex size-3 items-center justify-center rounded-sm", up ? "bg-emerald-600" : "bg-rose-600")}>
				<Icon className="size-2 text-white" />
			</span>
			<span className={cn("text-[11px] font-medium tabular-nums", up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
				{children}
			</span>
		</span>
	);
}

function Avatar({ tone }: { tone: string }) {
	return <span className={cn("size-4 shrink-0 rounded-full ring-1 ring-inset ring-black/10", tone)} />;
}

function MarketIcon({ src, round }: { src: string; round?: boolean }) {
	return (
		<Image
			src={src}
			alt=""
			width={16}
			height={16}
			className={cn("size-4 shrink-0 object-cover ring-1 ring-inset ring-black/10", round ? "rounded-full" : "rounded-md")}
		/>
	);
}

function RankedRow({ rank, avatar, name, value, valueClass }: { rank: number; avatar: string; name: string; value: string; valueClass?: string }) {
	return (
		<div className="flex items-center gap-2">
			<span className="w-2.5 text-[9px] tabular-nums text-muted-foreground">{rank}</span>
			<Avatar tone={avatar} />
			<span className="min-w-0 flex-1 truncate text-[10px] font-medium text-foreground">{name}</span>
			<span className={cn("text-[10px] font-semibold tabular-nums", valueClass ?? "text-emerald-500")}>{value}</span>
		</div>
	);
}

function TraderLeaderboardsArt() {
	const rows = [
		{ rank: 1, name: "Theo4", avatar: "bg-neutral-400", pnl: "$22M" },
		{ rank: 2, name: "Fredi9999", avatar: "bg-sky-400", pnl: "$16.6M" },
		{ rank: 3, name: "kch123", avatar: "bg-violet-400", pnl: "$11.8M" },
		{ rank: 4, name: "0xWhale", avatar: "bg-amber-400", pnl: "$9.2M" },
	];
	return (
		<Stage tag="new">
			<Card>
				<div className="mb-2 flex items-center gap-1 overflow-hidden mask-r-from-70%">
					<Pill active>Global</Pill>
					<Pill>Politics</Pill>
					<Pill>Sports</Pill>
					<Pill>Crypto</Pill>
					<Pill>Economy</Pill>
					<Pill>Tech</Pill>
				</div>
				<div className="mask-b-from-75% space-y-2">
					{rows.map((row) => (
						<RankedRow key={row.rank} rank={row.rank} avatar={row.avatar} name={row.name} value={row.pnl} />
					))}
				</div>
			</Card>
		</Stage>
	);
}

const PNL_LINE =
	"M0 56 Q12 54 25 53 Q40 52 50 50 Q62 48 70 49 Q80 44 90 36 Q100 32 110 31 Q124 28 135 23 Q150 19 160 18 Q185 14 200 12";

const PNL_EXITS: { x: number; y: number; tone: "win" | "loss" }[] = [
	{ x: 70, y: 49, tone: "loss" },
	{ x: 90, y: 36, tone: "win" },
	{ x: 135, y: 23, tone: "win" },
];

function ExitDot({ x, y, tone }: { x: number; y: number; tone: "win" | "loss" }) {
	return (
		<span
			className={cn(
				"absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card",
				tone === "win" ? "bg-emerald-500" : "bg-rose-500",
			)}
			style={{ left: `${(x / 200) * 100}%`, top: `${y}px` }}
		/>
	);
}

function TraderPnlChartArt() {
	return (
		<Stage tag="improved">
			<Card>
				<div className="mb-2 flex items-center justify-between">
					<span className="text-base font-semibold tabular-nums text-emerald-500">+$7.08M</span>
					<div className="flex items-center gap-1">
						<span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] font-medium text-foreground/80">Custom</span>
						<div className="flex overflow-hidden rounded-md ring-1 ring-border">
							<span className="flex size-4 items-center justify-center bg-foreground/5">
								<svg viewBox="0 0 12 12" className="size-2.5 text-emerald-500">
									<path d="M1 8 L4 5 L7 7 L11 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</span>
							<span className="flex size-4 items-center justify-center text-muted-foreground">
								<svg viewBox="0 0 12 12" className="size-2.5">
									<rect x="3" y="3" width="2" height="6" rx="0.5" fill="currentColor" />
									<rect x="7" y="4" width="2" height="5" rx="0.5" fill="currentColor" />
								</svg>
							</span>
						</div>
					</div>
				</div>
				<div className="relative h-16 w-full">
					<svg viewBox="0 0 200 64" preserveAspectRatio="none" className="h-full w-full text-emerald-500">
						<defs>
							<linearGradient id="changelog-pnl" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
								<stop offset="100%" stopColor="currentColor" stopOpacity="0" />
							</linearGradient>
						</defs>
						<path d={`${PNL_LINE} L200 64 L0 64 Z`} fill="url(#changelog-pnl)" />
						<path
							d={PNL_LINE}
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinejoin="round"
							strokeLinecap="round"
							vectorEffect="non-scaling-stroke"
						/>
					</svg>
					{PNL_EXITS.map((exit) => (
						<ExitDot key={exit.x} {...exit} />
					))}
					<span className="absolute right-0 top-3 size-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-emerald-500 ring-2 ring-card" />
				</div>
				<div className="mt-2 flex justify-between px-1 text-[9px] text-muted-foreground">
					<span>1D</span>
					<span>1W</span>
					<span className="font-medium text-foreground">1M</span>
					<span>6M</span>
					<span>All</span>
				</div>
			</Card>
		</Stage>
	);
}

function BestWorstTradesArt() {
	const rows = [
		{ img: "/changelog/markets/zverev-alcaraz.webp", label: "Zverev vs Alcaraz", pnl: "$243K" },
		{ img: "/changelog/markets/lakers-timberwolves.webp", label: "Lakers vs Timberwolves", pnl: "$129K" },
		{ img: "/changelog/markets/chiefs-texans.webp", label: "Chiefs vs Texans", pnl: "$129K" },
	];
	return (
		<Stage tag="new">
			<Card>
				<div className="mb-2 flex items-center gap-2">
					<Tab active>Best Wins</Tab>
					<Tab>Worst Losses</Tab>
				</div>
				<div className="space-y-2">
					{rows.map((row) => (
						<div key={row.label} className="flex items-center gap-2">
							<MarketIcon src={row.img} />
							<span className="min-w-0 flex-1 truncate text-[10px] font-medium text-foreground">{row.label}</span>
							<span className="text-[10px] font-semibold tabular-nums text-emerald-500">{row.pnl}</span>
						</div>
					))}
				</div>
			</Card>
		</Stage>
	);
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
	return (
		<div className="rounded-md bg-foreground/5 px-2 py-1.5">
			<div className="truncate text-[9px] text-muted-foreground">{label}</div>
			<div
				className={cn(
					"text-[11px] font-semibold tabular-nums",
					tone === "positive" ? "text-emerald-500" : tone === "negative" ? "text-rose-500" : "text-foreground",
				)}
			>
				{value}
			</div>
		</div>
	);
}

function PerformanceSummaryArt() {
	return (
		<Stage tag="improved">
			<Card>
				<div className="mb-2 flex items-center justify-between">
					<span className="text-[10px] font-medium text-muted-foreground">Performance Summary</span>
					<Delta tone="up">30D +$1.74M</Delta>
				</div>
				<div className="grid grid-cols-2 gap-1.5">
					<SummaryStat label="Win Rate" value="74.4%" />
					<SummaryStat label="Profit Factor" value="3.57x" />
					<SummaryStat label="Avg Win" value="$889" tone="positive" />
					<SummaryStat label="Max Drawdown" value="-4.7%" tone="negative" />
				</div>
			</Card>
		</Stage>
	);
}

function MarketTopTradersArt() {
	const rows = [
		{ rank: 1, name: "LesterDiamond", pnl: "+$105K", up: true, avatar: "bg-rose-400" },
		{ rank: 2, name: "GingerMcKenna", pnl: "+$64K", up: true, avatar: "bg-neutral-400" },
		{ rank: 3, name: "ScottyNooo", pnl: "-$3.7K", up: false, avatar: "bg-emerald-400" },
	];
	return (
		<Stage tag="new">
			<Card>
				<div className="mb-2 flex items-center gap-1.5">
					<MarketIcon src="/changelog/markets/jd-vance.webp" round />
					<span className="truncate text-[10px] font-medium text-foreground/80">JD Vance · 2028 President</span>
				</div>
				<div className="mb-2 flex items-center gap-2">
					<Tab>Holders</Tab>
					<Tab active>Top Traders</Tab>
					<Tab>Price Spikes</Tab>
				</div>
				<div className="space-y-2">
					{rows.map((row) => (
						<RankedRow
							key={row.name}
							rank={row.rank}
							avatar={row.avatar}
							name={row.name}
							value={row.pnl}
							valueClass={row.up ? "text-emerald-500" : "text-rose-500"}
						/>
					))}
				</div>
			</Card>
		</Stage>
	);
}

function RewardsIncentivesArt() {
	const bars = [
		{ h: 8, liq: 0 },
		{ h: 12, liq: 0 },
		{ h: 10, liq: 0 },
		{ h: 19, liq: 12 },
		{ h: 31, liq: 16 },
		{ h: 53, liq: 26 },
		{ h: 94, liq: 32 },
		{ h: 73, liq: 28 },
		{ h: 81, liq: 22 },
		{ h: 63, liq: 18 },
	];
	return (
		<Stage tag="new">
			<Card>
				<div className="mb-2 flex items-center justify-between">
					<span className="text-[10px] font-medium text-muted-foreground">Rewards &amp; incentives</span>
					<span className="text-[10px] font-semibold tabular-nums text-foreground">$14M</span>
				</div>
				<div className="flex h-16 items-end gap-1 border-b border-border pb-px">
					{bars.map((bar, index) => (
						<div key={index} className="flex flex-1 flex-col overflow-hidden rounded-t-[3px]" style={{ height: `${bar.h}%` }}>
							{bar.liq > 0 ? <div className="w-full bg-teal-400" style={{ flex: bar.liq }} /> : null}
							<div className="w-full bg-amber-500/85" style={{ flex: 100 - bar.liq }} />
						</div>
					))}
				</div>
				<div className="mt-2 flex items-center gap-2.5 text-[9px] text-muted-foreground">
					<span className="flex items-center gap-1">
						<span className="size-1.5 rounded-full bg-amber-500/85" />Maker rewards
					</span>
					<span className="flex items-center gap-1">
						<span className="size-1.5 rounded-full bg-teal-400" />Liquidity
					</span>
				</div>
			</Card>
		</Stage>
	);
}

export const CHANGELOG_ILLUSTRATIONS: Record<string, () => ReactNode> = {
	"trader-category-leaderboards": TraderLeaderboardsArt,
	"trader-pnl-chart-updates": TraderPnlChartArt,
	"trader-best-worst-trades": BestWorstTradesArt,
	"trader-performance-summary": PerformanceSummaryArt,
	"market-top-traders": MarketTopTradersArt,
	"analytics-rewards-incentives": RewardsIncentivesArt,
};
