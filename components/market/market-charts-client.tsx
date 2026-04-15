"use client";

import { useState } from "react";
import type { PositionChartOutcome } from "@structbuild/sdk";

import { MarketProbabilityChartClient } from "@/components/market/market-probability-chart-client";
import {
	MarketVolumeChartClient,
	type VolumeOutcome,
} from "@/components/market/market-volume-chart-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
	outcomes: PositionChartOutcome[] | null;
	volume: VolumeOutcome[] | null;
};

export function MarketChartsClient({ outcomes, volume }: Props) {
	const defaultTab = outcomes ? "price" : "volume";
	const [tab, setTab] = useState(defaultTab);

	const title = tab === "price" ? "Price Chart" : "Volume Chart";

	return (
		<section className="bg-card rounded-lg p-4 sm:p-6">
			<Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
				<div className="mb-4 flex items-center justify-between gap-3">
					<h2 className="text-base font-medium text-foreground">{title}</h2>
					<TabsList>
						{outcomes && <TabsTrigger value="price">Price</TabsTrigger>}
						{volume && <TabsTrigger value="volume">Volume</TabsTrigger>}
					</TabsList>
				</div>
				{outcomes && (
					<TabsContent value="price">
						<MarketProbabilityChartClient outcomes={outcomes} />
					</TabsContent>
				)}
				{volume && (
					<TabsContent value="volume">
						<MarketVolumeChartClient outcomes={volume} />
					</TabsContent>
				)}
			</Tabs>
		</section>
	);
}
