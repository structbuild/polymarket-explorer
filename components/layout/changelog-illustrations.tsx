import type { ReactNode } from "react";
import Image from "next/image";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function meshBackground(c1: string, c2: string, c3: string) {
	return [
		`radial-gradient(90% 90% at 10% 5%, color-mix(in oklab, ${c1} 38%, transparent), transparent 60%)`,
		`radial-gradient(85% 85% at 95% 0%, color-mix(in oklab, ${c2} 32%, transparent), transparent 58%)`,
		`radial-gradient(120% 100% at 60% 120%, color-mix(in oklab, ${c3} 30%, transparent), transparent 62%)`,
		"var(--background)",
	].join(", ");
}

const MESH = {
	leaderboards: meshBackground("var(--color-sky-400)", "var(--color-indigo-400)", "var(--color-emerald-400)"),
	pnl: meshBackground("var(--color-emerald-400)", "var(--color-teal-400)", "var(--color-lime-400)"),
	bestWorst: meshBackground("var(--color-teal-400)", "var(--color-cyan-400)", "var(--color-blue-400)"),
	performance: meshBackground("var(--color-violet-400)", "var(--color-fuchsia-400)", "var(--color-indigo-400)"),
	topTraders: meshBackground("var(--color-indigo-400)", "var(--color-blue-400)", "var(--color-sky-400)"),
	rewards: meshBackground("var(--color-amber-400)", "var(--color-orange-400)", "var(--color-pink-400)"),
};

function Stage({ mesh, children }: { mesh: string; children: ReactNode }) {
	return (
		<div aria-hidden className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ background: mesh }}>
			{children}
		</div>
	);
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
	return (
		<div className={cn("relative rounded-xl bg-card p-3 shadow-lg shadow-black/10 ring-1 ring-border", className)}>{children}</div>
	);
}

function Pill({ active, children }: { active?: boolean; children: ReactNode }) {
	return (
		<span
			className={cn(
				"rounded-full px-1.5 py-0.5 text-[9px] font-medium",
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
			<span className={cn("text-[10px] font-medium tabular-nums", up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
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

function TraderLeaderboardsArt() {
	const rows = [
		{ rank: 1, name: "Theo4", addr: "0x56…839", avatar: "bg-neutral-400", wr: "85.7%", pnl: "$22M" },
		{ rank: 2, name: "Fredi9999", addr: "0x1f…0cf", avatar: "bg-sky-400", wr: "78.0%", pnl: "$16.6M" },
		{ rank: 3, name: "kch123", addr: "0x6a…3ee", avatar: "bg-violet-400", wr: "68.1%", pnl: "$11.8M" },
		{ rank: 4, name: "0xWhale", addr: "0x9d…b21", avatar: "bg-amber-400", wr: "64.5%", pnl: "$9.2M" },
	];
	return (
		<Stage mesh={MESH.leaderboards}>
			<Card className="w-64">
				<div className="mb-2 flex items-center gap-1">
					<Pill active>Global</Pill>
					<Pill>Politics</Pill>
					<Pill>Sports</Pill>
				</div>
				<div className="mask-b-from-80% space-y-1.5">
					{rows.map((row) => (
						<div key={row.rank} className="flex items-center gap-2">
							<span className="w-2 text-[9px] tabular-nums text-muted-foreground">{row.rank}</span>
							<Avatar tone={row.avatar} />
							<div className="min-w-0 flex-1 leading-none">
								<div className="truncate text-[9px] font-medium text-foreground">{row.name}</div>
								<div className="mt-0.5 truncate font-mono text-[7px] text-muted-foreground">{row.addr}</div>
							</div>
							<span className="text-[8px] tabular-nums text-muted-foreground">{row.wr}</span>
							<span className="w-9 text-right text-[9px] font-semibold tabular-nums text-emerald-500">{row.pnl}</span>
						</div>
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
		<Stage mesh={MESH.pnl}>
			<Card className="w-64">
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
				<div className="mt-2 flex justify-between px-1 text-[8px] text-foreground/45">
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
		{ img: "/changelog/markets/zverev-alcaraz.webp", label: "Zverev vs Alcaraz", pnl: "$243K", pct: "172.8%" },
		{ img: "/changelog/markets/lakers-timberwolves.webp", label: "Lakers vs Timberwolves", pnl: "$129K", pct: "213.0%" },
		{ img: "/changelog/markets/chiefs-texans.webp", label: "Chiefs vs Texans", pnl: "$129K", pct: "316.8%" },
	];
	return (
		<Stage mesh={MESH.bestWorst}>
			<Card className="w-64">
				<div className="mb-2 flex items-center gap-2">
					<Tab active>Best Wins</Tab>
					<Tab>Worst Losses</Tab>
				</div>
				<div className="space-y-1.5">
					{rows.map((row) => (
						<div key={row.label} className="flex items-center gap-2">
							<MarketIcon src={row.img} />
							<div className="min-w-0 flex-1 truncate text-[9px] font-medium text-foreground">{row.label}</div>
							<span className="rounded bg-emerald-500/15 px-1 py-0.5 text-[7px] font-medium text-emerald-500">Won</span>
							<div className="w-12 text-right leading-none">
								<div className="text-[9px] font-semibold tabular-nums text-emerald-500">{row.pnl}</div>
								<div className="mt-0.5 text-[7px] tabular-nums text-emerald-500/70">{row.pct}</div>
							</div>
						</div>
					))}
				</div>
			</Card>
		</Stage>
	);
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
	return (
		<div className="rounded-md bg-foreground/5 px-1.5 py-1">
			<div className="truncate text-[7px] text-muted-foreground">{label}</div>
			<div
				className={cn(
					"text-[10px] font-semibold tabular-nums",
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
		<Stage mesh={MESH.performance}>
			<Card className="w-64">
				<div className="mb-1.5 flex items-center justify-between">
					<span className="text-[10px] font-medium text-muted-foreground">Performance Summary</span>
					<Delta tone="up">30D +$1.74M</Delta>
				</div>
				<div className="grid grid-cols-3 gap-1">
					<SummaryStat label="Win Rate" value="74.4%" />
					<SummaryStat label="Profit Factor" value="3.57x" />
					<SummaryStat label="Avg Win" value="$889" tone="positive" />
					<SummaryStat label="Avg Loss" value="-$724" tone="negative" />
					<SummaryStat label="Best Win" value="$91K" tone="positive" />
					<SummaryStat label="Max DD" value="-4.7%" tone="negative" />
				</div>
				<div className="mt-1.5 flex items-center gap-1 text-[7px] text-muted-foreground">
					<span className="rounded bg-foreground/5 px-1 py-0.5">Avg hold 21d 12h</span>
					<span className="rounded bg-foreground/5 px-1 py-0.5">Streak 21d W</span>
				</div>
			</Card>
		</Stage>
	);
}

function MarketTopTradersArt() {
	const rows = [
		{ name: "LesterDiamond", vol: "$105K", pnl: "+$105K", up: true, avatar: "bg-rose-400" },
		{ name: "GingerMcKenna", vol: "$64K", pnl: "+$64K", up: true, avatar: "bg-neutral-400" },
		{ name: "ScottyNooo", vol: "$546K", pnl: "-$3.7K", up: false, avatar: "bg-emerald-400" },
	];
	return (
		<Stage mesh={MESH.topTraders}>
			<Card className="w-64">
				<div className="mb-1.5 flex items-center gap-1.5">
					<MarketIcon src="/changelog/markets/jd-vance.webp" round />
					<span className="truncate text-[9px] font-medium text-foreground/80">JD Vance · 2028 President</span>
				</div>
				<div className="mb-2 flex items-center gap-2">
					<Tab>Holders</Tab>
					<Tab active>Top Traders</Tab>
					<Tab>Price Spikes</Tab>
				</div>
				<div className="space-y-1.5">
					{rows.map((row, index) => (
						<div key={row.name} className="flex items-center gap-2">
							<span className="w-2 text-[9px] tabular-nums text-muted-foreground">{index + 1}</span>
							<Avatar tone={row.avatar} />
							<div className="min-w-0 flex-1 truncate text-[9px] font-medium text-foreground">{row.name}</div>
							<span className="text-[8px] tabular-nums text-muted-foreground">{row.vol}</span>
							<span
								className={cn(
									"w-11 text-right text-[9px] font-semibold tabular-nums",
									row.up ? "text-emerald-500" : "text-rose-500",
								)}
							>
								{row.pnl}
							</span>
						</div>
					))}
				</div>
			</Card>
		</Stage>
	);
}

function RewardsIncentivesArt() {
	const bars = [
		{ h: 8, o: 60, v: 40, teal: false },
		{ h: 12, o: 55, v: 45, teal: false },
		{ h: 10, o: 66, v: 34, teal: false },
		{ h: 19, o: 60, v: 40, teal: false },
		{ h: 31, o: 62, v: 38, teal: false },
		{ h: 53, o: 66, v: 34, teal: true },
		{ h: 94, o: 64, v: 30, teal: true },
		{ h: 73, o: 68, v: 28, teal: true },
		{ h: 81, o: 62, v: 34, teal: false },
		{ h: 63, o: 64, v: 36, teal: false },
	];
	return (
		<Stage mesh={MESH.rewards}>
			<Card className="w-64">
				<div className="mb-2 flex items-center justify-between">
					<span className="text-[10px] font-medium text-muted-foreground">Rewards &amp; incentives</span>
					<span className="text-[8px] tabular-nums text-muted-foreground">$14M</span>
				</div>
				<div className="flex h-16 items-end gap-1 border-b border-border pb-px">
					{bars.map((bar, index) => (
						<div key={index} className="flex flex-1 flex-col overflow-hidden rounded-t-[3px]" style={{ height: `${bar.h}%` }}>
							{bar.teal ? <div className="w-full bg-teal-400" style={{ flex: 8 }} /> : null}
							<div className="w-full bg-amber-500/85" style={{ flex: bar.o }} />
							<div className="w-full bg-violet-500/70" style={{ flex: bar.v }} />
						</div>
					))}
				</div>
				<div className="mt-1.5 flex items-center gap-2 text-[7px] text-muted-foreground">
					<span className="flex items-center gap-1">
						<span className="size-1.5 rounded-full bg-amber-500/85" />Maker
					</span>
					<span className="flex items-center gap-1">
						<span className="size-1.5 rounded-full bg-violet-500/70" />Taker
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
