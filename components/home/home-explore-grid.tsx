import type { Route } from "next";
import Link from "next/link";
import {
	ArrowUpRightIcon,
	BarChart3Icon,
	CoinsIcon,
	CpuIcon,
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
		description: "Browse active or closed markets.",
		Icon: BarChart3Icon,
	},
	{
		href: "/traders" as Route,
		label: "Traders",
		description: "Top traders by PnL or volume.",
		Icon: TrophyIcon,
	},
	{
		href: "/tags" as Route,
		label: "Categories",
		description: "Browse markets by category.",
		Icon: HashIcon,
	},
	{
		href: "/analytics" as Route,
		label: "Analytics",
		description: "Historical analytics data.",
		Icon: LineChartIcon,
	},
	{
		href: "/rewards" as Route,
		label: "Rewards",
		description: "Markets with active liquidity rewards.",
		Icon: CoinsIcon,
	},
	{
		href: "https://www.struct.to/rest-api" as Route,
		label: "API Access",
		description: "The API powering this platform.",
		Icon: CpuIcon,
	},
];

export function HomeExploreGrid() {
	return (
		<section aria-label="Explore the platform" className="space-y-4">
			<h2 className="text-xl font-medium text-foreground">Explore the platform</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:grid-cols-3">
			{ITEMS.map(({ href, label, description, Icon }, index) => {
				const isOrphan = index === ITEMS.length - 1 && ITEMS.length % 2 === 1;
				return (
					<Link
						key={href}
						href={href}
						className={cn(
							"group relative flex flex-col justify-between gap-4 overflow-hidden rounded-lg bg-card p-4 md:p-5 ring-1 ring-foreground/10 transition-colors hover:bg-accent",
							isOrphan && "col-span-2 md:col-span-1",
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
