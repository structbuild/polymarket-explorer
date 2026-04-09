import { Suspense } from "react";
import type { Metadata } from "next";

import { RewardsTable } from "@/components/rewards/rewards-table";
import { getRewardsMarkets } from "@/lib/struct/queries";

export const metadata: Metadata = {
	title: "Markets with Liquidity Rewards",
	description: "Browse all Polymarket markets with active liquidity rewards. Filter and explore reward rates, liquidity, and more.",
	alternates: {
		canonical: "/rewards",
	},
};

async function RewardsContent() {
	const markets = await getRewardsMarkets();
	return <RewardsTable markets={markets} />;
}

function RewardsFallback() {
	return <div className="overflow-hidden rounded-lg bg-card px-4 py-12 text-center text-muted-foreground sm:px-6">Loading reward markets…</div>;
}

export default function RewardsPage() {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<div className="mb-6">
				<h1 className="text-xl font-medium tracking-tight">Markets with Rewards</h1>
				<p className="mt-1 text-sm text-muted-foreground">View markets with active reward programs by providing liquidity.</p>
			</div>
			<Suspense fallback={<RewardsFallback />}>
				<RewardsContent />
			</Suspense>
		</div>
	);
}
