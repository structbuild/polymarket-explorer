"use client";

import { HomeRefreshButton } from "@/components/home/home-refresh-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, type ReactNode } from "react";

type HomeActivityTab = "markets" | "trades";

export function HomeTabsBar() {
	return (
		<TabsList
			variant="text"
			className="flex min-w-0 justify-start gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		>
			<TabsTrigger className="text-lg! sm:text-xl!" value="markets">
				New Markets
			</TabsTrigger>
			<TabsTrigger className="text-lg! sm:text-xl!" value="trades">
				Recent Trades
			</TabsTrigger>
		</TabsList>
	);
}

export function HomeActivityTabs({
	markets,
	trades,
}: {
	markets: ReactNode;
	trades: ReactNode;
}) {
	const [tab, setTab] = useState<HomeActivityTab>("markets");

	return (
		<Tabs value={tab} onValueChange={(value) => setTab(value as HomeActivityTab)} className="gap-3">
			<div className="flex flex-col gap-3 sm:min-h-8 sm:flex-row sm:items-end sm:justify-between">
				<div className="min-w-0 flex-1">
					<HomeTabsBar />
				</div>
				<div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:items-end sm:justify-end">
					<HomeRefreshButton />
				</div>
			</div>
			<TabsContent value="markets" keepMounted>
				{markets}
			</TabsContent>
			<TabsContent value="trades" keepMounted>
				{trades}
			</TabsContent>
		</Tabs>
	);
}
