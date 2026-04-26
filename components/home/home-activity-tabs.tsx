"use client";

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
		<Tabs value={tab} onValueChange={(value) => setTab(value as HomeActivityTab)}>
			<TabsContent value="markets" keepMounted>
				{markets}
			</TabsContent>
			<TabsContent value="trades" keepMounted>
				{trades}
			</TabsContent>
		</Tabs>
	);
}
