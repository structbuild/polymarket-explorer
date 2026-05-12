"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, type ReactNode } from "react";

type HomeActivityTab = "trades" | "trending" | "markets";

export function HomeTabsBar() {
	return (
		<TabsList
			variant="text"
			className="flex w-full max-w-full min-w-0 justify-start gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		>
			<TabsTrigger className="text-lg! sm:text-xl!" value="trades">
				Recent Trades
			</TabsTrigger>
			<TabsTrigger className="text-lg! sm:text-xl!" value="trending">
				Trending Markets
			</TabsTrigger>
			<TabsTrigger className="text-lg! sm:text-xl!" value="markets">
				New Markets
			</TabsTrigger>
		</TabsList>
	);
}

export function HomeActivityTabs({
	trades,
	trending,
	markets,
}: {
	trades: ReactNode;
	trending: ReactNode;
	markets: ReactNode;
}) {
	const [tab, setTab] = useState<HomeActivityTab>("trades");

	return (
		<Tabs value={tab} onValueChange={(value) => setTab(value as HomeActivityTab)} className="gap-3">
			<div className="grid gap-x-4 gap-y-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
				<div className="min-w-0">
					<HomeTabsBar />
				</div>
				<TabsContent value="markets" keepMounted className="contents min-w-0 text-sm outline-none">
					{markets}
				</TabsContent>
				<TabsContent value="trending" keepMounted className="contents min-w-0 text-sm outline-none">
					{trending}
				</TabsContent>
				<TabsContent value="trades" keepMounted className="contents min-w-0 text-sm outline-none">
					{trades}
				</TabsContent>
			</div>
		</Tabs>
	);
}
