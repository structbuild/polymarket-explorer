import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import { ChevronDownIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChangelogTag } from "@/lib/changelog";
import type { ChangelogIllustrationId } from "@/lib/changelog-illustration-ids";

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

const STRUCT_MARKET_IMAGE_BASE = "https://struct-images.fra1.digitaloceanspaces.com/polymarket/markets";

function structMarketImage(conditionId: string) {
	return `${STRUCT_MARKET_IMAGE_BASE}/${conditionId}.webp`;
}

const MARKET_IMAGES = {
	alvarez: structMarketImage("0x76360929e8928bfd0d2b9cbed66187f70b91940ce5dc872f2b4fb6215c478280"),
	atp: structMarketImage("0x092ed5b1fa0f8c26ec0fa838f427d5649c35a89da580654465858edc5fd53574"),
	bellingham: structMarketImage("0xccf3bbf592a14e9f552972e8e91f287165db152a03b898f14f27bf016f48a66b"),
	chiefsTexans: "/changelog/markets/chiefs-texans.webp",
	haaland: structMarketImage("0x3f656230866732b8d6f7ecb64313786ae988a21c416960bfceac00f693637f9f"),
	jdVance: "/changelog/markets/jd-vance.webp",
	kane: structMarketImage("0x3cfbee413cd85add8ad7051d8ba72f5d7a1f127e119fe9619511fdc66874fad9"),
	lakersTimberwolves: "/changelog/markets/lakers-timberwolves.webp",
	mbappe: structMarketImage("0x6681aa4796da536f4cd229bf25da9d71616ada63ce3f0cffcd06ab933fc8e95c"),
	rahimi: structMarketImage("0xcc4e5d1e2c6ab9c6f357ff46922e8007203937696e310711e407cc6c17d6c265"),
	wta: structMarketImage("0x3b93cab6f49e9ee365d87fba1b8f49d7a62bbcfc0038d5d7a355389cfdd9cf15"),
	zverevAlcaraz: "/changelog/markets/zverev-alcaraz.webp",
} as const;

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
		{ img: MARKET_IMAGES.zverevAlcaraz, label: "Zverev vs Alcaraz", pnl: "$243K" },
		{ img: MARKET_IMAGES.lakersTimberwolves, label: "Lakers vs Timberwolves", pnl: "$129K" },
		{ img: MARKET_IMAGES.chiefsTexans, label: "Chiefs vs Texans", pnl: "$129K" },
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
					<MarketIcon src={MARKET_IMAGES.jdVance} round />
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

function BuilderCompareArt() {
	const rows: { label: string; a: string; b: string; win: "a" | "b" }[] = [
		{ label: "Volume", a: "$5.5M", b: "$229M", win: "b" },
		{ label: "Builder fees", a: "$211K", b: "$0", win: "a" },
		{ label: "Traders", a: "6.7K", b: "1.0K", win: "a" },
		{ label: "Trades", a: "65.8K", b: "463K", win: "b" },
	];
	const valueClass = (active: boolean) =>
		cn(
			"justify-self-end rounded px-1 text-[10px] tabular-nums",
			active ? "bg-foreground font-semibold text-background" : "text-foreground/70",
		);
	return (
		<Stage tag="new">
			<Card>
				<div className="grid grid-cols-[1.2fr_1fr_1fr] items-center gap-x-2 gap-y-2">
					<span />
					<div className="flex min-w-0 items-center justify-end gap-1">
						<span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
						<span className="truncate text-[10px] font-medium text-foreground">MetaMask</span>
					</div>
					<div className="flex min-w-0 items-center justify-end gap-1">
						<span className="size-1.5 shrink-0 rounded-full bg-violet-400" />
						<span className="truncate text-[10px] font-medium text-foreground">Betmoar</span>
					</div>
					{rows.map((row) => (
						<Fragment key={row.label}>
							<span className="truncate text-[10px] text-muted-foreground">{row.label}</span>
							<span className={valueClass(row.win === "a")}>{row.a}</span>
							<span className={valueClass(row.win === "b")}>{row.b}</span>
						</Fragment>
					))}
				</div>
			</Card>
		</Stage>
	);
}

function LegStack({ images }: { images: string[] }) {
	return (
		<span className="flex shrink-0 -space-x-1.5">
			{images.map((src) => (
				<span key={src} className="rounded-md ring-2 ring-card">
					<MarketIcon src={src} />
				</span>
			))}
		</span>
	);
}

function CombosHubArt() {
	const rows = [
		{ title: "Álvarez + Kane +2", images: [MARKET_IMAGES.alvarez, MARKET_IMAGES.kane], volume: "$411K" },
		{ title: "Bellingham + Haaland +2", images: [MARKET_IMAGES.bellingham, MARKET_IMAGES.haaland], volume: "$282K" },
		{ title: "Rahimi + Mbappé +2", images: [MARKET_IMAGES.rahimi, MARKET_IMAGES.mbappe], volume: "$199K" },
		{ title: "Rinderknech + Pegula", images: [MARKET_IMAGES.atp, MARKET_IMAGES.wta], volume: "$66.7K" },
	];
	return (
		<Stage tag="new">
			<Card>
				<div className="mb-2 flex items-center gap-1 overflow-hidden mask-r-from-70%">
					<Pill active>All</Pill>
					<Pill>Open</Pill>
					<Pill>Won</Pill>
					<Pill>Lost</Pill>
					<Pill>Redeemable</Pill>
				</div>
				<div className="mask-b-from-80% space-y-2">
					{rows.map((row) => (
						<div key={row.title} className="flex items-center gap-2">
							<LegStack images={row.images} />
							<span className="min-w-0 flex-1 truncate text-[10px] font-medium text-foreground">{row.title}</span>
							<span className="text-[10px] font-semibold tabular-nums text-foreground">{row.volume}</span>
						</div>
					))}
				</div>
			</Card>
		</Stage>
	);
}

const COMBO_LEG_LINES = [
	{
		label: "Rinderknech",
		img: MARKET_IMAGES.atp,
		d: "M0 29 Q14 30 26 28 Q40 26 52 27 Q66 28 78 24 Q92 20 104 21 Q118 22 132 17 Q146 12 160 10 Q178 6 200 4",
	},
	{
		label: "Pegula",
		img: MARKET_IMAGES.wta,
		d: "M0 25 Q16 27 30 26 Q44 25 56 23 Q70 21 82 22 Q96 23 110 19 Q126 15 140 13 Q158 9 176 6 Q190 4 200 4",
	},
];

const COMBO_PRICE_LINE =
	"M0 41 Q14 42 26 40 Q38 38 48 39 Q60 40 70 36 Q84 31 96 32 Q110 33 122 27 Q136 21 150 18 Q166 14 178 9 Q190 5 200 4";

function ComboDetailArt() {
	return (
		<Stage tag="new">
			<Card>
				<div className="mb-1.5 flex items-center gap-2">
					<span className="min-w-0 flex-1 truncate text-[10px] font-medium text-foreground">Rinderknech + Pegula</span>
					<span className="shrink-0 text-[9px] text-muted-foreground">2 legs</span>
				</div>
				<div className="mb-2 flex items-baseline gap-1.5">
					<span className="text-base font-semibold tabular-nums text-emerald-500">100.0%</span>
					<span className="text-[9px] text-muted-foreground">implied Yes</span>
				</div>
				<div className="h-14 w-full">
					<svg viewBox="0 0 200 64" preserveAspectRatio="none" className="h-full w-full">
						<defs>
							<linearGradient id="changelog-combo" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="var(--color-emerald-500)" stopOpacity="0.18" />
								<stop offset="100%" stopColor="var(--color-emerald-500)" stopOpacity="0" />
							</linearGradient>
						</defs>
						{COMBO_LEG_LINES.map((leg) => (
							<path
								key={leg.label}
								d={leg.d}
								fill="none"
								stroke="currentColor"
								strokeWidth="1"
								strokeDasharray="3 2"
								strokeLinecap="round"
								className="text-foreground/25"
								vectorEffect="non-scaling-stroke"
							/>
						))}
						<path d={`${COMBO_PRICE_LINE} L200 64 L0 64 Z`} fill="url(#changelog-combo)" />
						<path
							d={COMBO_PRICE_LINE}
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinejoin="round"
							strokeLinecap="round"
							className="text-emerald-500"
							vectorEffect="non-scaling-stroke"
						/>
					</svg>
				</div>
				<div className="mt-2 flex items-center gap-2 text-[9px] text-muted-foreground">
					<span className="flex shrink-0 items-center gap-1">
						<span className="size-1.5 rounded-full bg-emerald-500" />Combo
					</span>
					{COMBO_LEG_LINES.map((leg) => (
						<span key={leg.label} className="flex min-w-0 items-center gap-1">
							<MarketIcon src={leg.img} />
							<span className="truncate">{leg.label}</span>
						</span>
					))}
				</div>
			</Card>
		</Stage>
	);
}

function ComboAnalyticsArt() {
	const bars = [
		{ label: "2 legs", value: "$58.9M", width: 100, accent: true },
		{ label: "3 legs", value: "$39.5M", width: 67 },
		{ label: "4 legs", value: "$25.4M", width: 43 },
		{ label: "5+ legs", value: "$37.1M", width: 63 },
	];
	return (
		<Stage tag="new">
			<Card>
				<div className="flex items-center justify-between">
					<span className="text-[10px] font-medium text-muted-foreground">Volume by leg count</span>
					<span className="text-[9px] text-muted-foreground">Lifetime</span>
				</div>
				<p className="mt-0.5 mb-2.5 text-lg leading-none font-semibold tabular-nums text-foreground">$160.9M</p>
				<div className="space-y-2">
					{bars.map((bar) => (
						<div key={bar.label} className="flex items-center gap-2">
							<span className="w-10 shrink-0 text-[9px] text-muted-foreground">{bar.label}</span>
							<span className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/5">
								<span
									className={cn("block h-full rounded-full", bar.accent ? "bg-emerald-500" : "bg-foreground/20")}
									style={{ width: `${bar.width}%` }}
								/>
							</span>
							<span className="w-12 shrink-0 text-right text-[10px] font-medium tabular-nums text-foreground">
								{bar.value}
							</span>
						</div>
					))}
				</div>
			</Card>
		</Stage>
	);
}

function TraderCombosArt() {
	const legs = [
		{ name: "Bellingham 1+ goals", img: MARKET_IMAGES.bellingham, status: "Won" },
		{ name: "Kane 1+ goals", img: MARKET_IMAGES.kane, status: "Won" },
		{ name: "Haaland 1+ goals", img: MARKET_IMAGES.haaland, status: "Pending" },
	];
	return (
		<Stage tag="new">
			<Card>
				<div className="mb-2 flex items-center gap-2">
					<Tab>Positions</Tab>
					<Tab>Activity</Tab>
					<Tab active>Combos</Tab>
				</div>
				<div className="flex items-center gap-2">
					<span className="min-w-0 flex-1 truncate text-[10px] font-medium text-foreground">
						Bellingham + Kane +2
					</span>
					<span className="text-[10px] font-semibold tabular-nums text-emerald-500">+$1,240</span>
				</div>
				<div className="mt-2 ml-1 space-y-1.5 border-l border-border pl-2.5">
					{legs.map((leg) => (
						<div key={leg.name} className="flex items-center gap-2">
							<MarketIcon src={leg.img} />
							<span className="min-w-0 flex-1 truncate text-[10px] text-foreground/80">{leg.name}</span>
							<span className="shrink-0 text-[9px] text-muted-foreground">{leg.status}</span>
						</div>
					))}
				</div>
			</Card>
		</Stage>
	);
}

const CATEGORY_PNL_LINE =
	"M0 52 Q14 50 26 51 Q38 52 48 47 Q60 41 72 43 Q84 45 94 38 Q106 30 118 32 Q130 34 142 27 Q156 19 168 21 Q182 23 200 12";

function PnlCategoryArt() {
	const categories = ["All categories", "Sports", "Politics"];
	return (
		<Stage tag="improved">
			<Card>
				<div className="mb-2 flex items-center justify-between">
					<span className="flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[9px] font-medium text-foreground/80">
						Sports
						<ChevronDownIcon className="size-2.5 text-muted-foreground" />
					</span>
					<span className="text-base font-semibold tabular-nums text-emerald-500">+$1.24M</span>
				</div>
				<div className="relative h-16 w-full">
					<svg viewBox="0 0 200 64" preserveAspectRatio="none" className="h-full w-full text-emerald-500">
						<defs>
							<linearGradient id="changelog-category-pnl" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
								<stop offset="100%" stopColor="currentColor" stopOpacity="0" />
							</linearGradient>
						</defs>
						<path d={`${CATEGORY_PNL_LINE} L200 64 L0 64 Z`} fill="url(#changelog-category-pnl)" />
						<path
							d={CATEGORY_PNL_LINE}
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinejoin="round"
							strokeLinecap="round"
							vectorEffect="non-scaling-stroke"
						/>
					</svg>
					<span className="absolute top-3 right-0 size-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-emerald-500 ring-2 ring-card" />
					<div className="absolute top-0 left-0 w-24 rounded-lg bg-popover p-1 shadow-md shadow-black/10 ring-1 ring-border">
						{categories.map((category) => (
							<p
								key={category}
								className={cn(
									"truncate rounded px-1.5 py-0.5 text-[9px]",
									category === "Sports" ? "bg-foreground/5 font-medium text-foreground" : "text-muted-foreground",
								)}
							>
								{category}
							</p>
						))}
					</div>
				</div>
			</Card>
		</Stage>
	);
}

const CHANGELOG_ILLUSTRATIONS: Record<ChangelogIllustrationId, () => ReactNode> = {
	"combos-hub": CombosHubArt,
	"combo-detail": ComboDetailArt,
	"combo-analytics": ComboAnalyticsArt,
	"trader-combos": TraderCombosArt,
	"trader-pnl-by-category": PnlCategoryArt,
	"builder-compare": BuilderCompareArt,
	"trader-category-leaderboards": TraderLeaderboardsArt,
	"trader-pnl-chart-updates": TraderPnlChartArt,
	"trader-best-worst-trades": BestWorstTradesArt,
	"trader-performance-summary": PerformanceSummaryArt,
	"market-top-traders": MarketTopTradersArt,
	"analytics-rewards-incentives": RewardsIncentivesArt,
};

export default function ChangelogIllustration({ id }: { id: ChangelogIllustrationId }) {
	const Art = CHANGELOG_ILLUSTRATIONS[id];
	return Art ? <Art /> : null;
}
