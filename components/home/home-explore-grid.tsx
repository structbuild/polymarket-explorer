"use client";

import type { Route } from "next";
import Link from "next/link";
import posthog from "posthog-js";
import {
	ArrowUpRightIcon,
	BarChart3Icon,
	CalendarIcon,
	CoinsIcon,
	CpuIcon,
	HammerIcon,
	HashIcon,
	LineChartIcon,
	TrophyIcon,
	type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ExploreItem = {
	href: Route;
	label: string;
	description: string;
	Icon: LucideIcon;
};

const ITEMS: ExploreItem[] = [
	{
		href: "/markets" as Route,
		label: "Markets",
		description: "Browse every market with volume, liquidity, and price history.",
		Icon: BarChart3Icon,
	},
	{
		href: "/events" as Route,
		label: "Events",
		description: "Explore events grouping related markets into a single outcome set.",
		Icon: CalendarIcon,
	},
	{
		href: "/traders" as Route,
		label: "Traders",
		description: "Rank traders by PnL, volume, and activity across the platform.",
		Icon: TrophyIcon,
	},
	{
		href: "/builders" as Route,
		label: "Builders",
		description: "Apps and integrators routing flow into Polymarket markets.",
		Icon: HammerIcon,
	},
	{
		href: "/tags" as Route,
		label: "Categories",
		description: "Browse markets grouped by topic, theme, and category tags.",
		Icon: HashIcon,
	},
	{
		href: "/analytics" as Route,
		label: "Analytics",
		description: "Historical analytics on volume, trades, and platform growth.",
		Icon: LineChartIcon,
	},
	{
		href: "/rewards" as Route,
		label: "Rewards",
		description: "Markets paying active liquidity rewards to qualifying makers.",
		Icon: CoinsIcon,
	},
	{
		href: "https://www.struct.to/rest-api" as Route,
		label: "API Access",
		description: "The Struct REST API powering every page in this explorer.",
		Icon: CpuIcon,
	},
];

export function HomeExploreGrid() {
	return (
		<section aria-label="Explore the platform" className="space-y-4">
			<h2 className="text-xl font-medium text-foreground">Explore the platform</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:grid-cols-4">
			{ITEMS.map(({ href, label, description, Icon }) => {
				return (
					<Link
						key={href}
						href={href}
						prefetch={false}
						onClick={() => posthog.capture("home_explore_card_clicked", { section: label })}
						className={cn(
							"group relative flex flex-col justify-between gap-4 overflow-hidden rounded-lg bg-card p-4 md:p-5 ring-1 ring-foreground/10 transition-colors hover:bg-accent",
						)}
					>
						<div className="flex items-center justify-between">
							<span className="inline-flex size-8 items-center justify-center rounded-lg bg-muted text-foreground/80 transition-colors group-hover:bg-primary">
								<Icon className="size-4" />
							</span>
							<ArrowUpRightIcon className="size-4 text-muted-foreground/60 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
						</div>
						<div className="space-y-0.5">
							<p className="text-lg font-medium text-foreground">{label}</p>
							<p className="text-base text-muted-foreground">{description}</p>
						</div>
					</Link>
				);
			})}
			</div>
		</section>
	);
}
