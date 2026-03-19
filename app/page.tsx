import { BeamsBackground } from "@/components/background/beams-background";
import { SearchInput } from "@/components/search/search-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getLeaderboard, searchTraders } from "@/lib/struct/queries";
import { getTraderDisplayName, isWalletAddress } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Polymarket Explorer — Analyze Any Trader",
	description:
		"Search and analyze any Polymarket trader by username or wallet address. View PnL charts, trading history, and performance metrics for top prediction market traders.",
	alternates: {
		canonical: "/",
	},
};

type Props = {
	searchParams: Promise<{ q?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
	const { q } = await searchParams;

	if (q && isWalletAddress(q)) {
		redirect(`/trader/${q.trim()}`);
	}

	const hasQuery = q != null && q.trim().length >= 2;

	const [leaderboard, searchResults] = await Promise.all([
		hasQuery ? Promise.resolve([]) : getLeaderboard(),
		hasQuery ? searchTraders(q) : Promise.resolve([]),
	]);

	const traders = hasQuery
		? searchResults.slice(0, 10)
		: leaderboard.slice(0, 10).map((entry) => entry.trader);

	return (
		<div className="-mt-16 flex items-center justify-center flex-col gap-4 flex-1 w-full">
			<BeamsBackground />
			<div className="max-w-lg w-full relative mb-24">
				<div className="text-center mb-8 space-y-2">
					<h1 className="text-4xl font-medium">Analyze any trader</h1>
					<p className="text-base text-muted-foreground">Enter a trader&apos;s address or username to get started</p>
				</div>
				<SearchInput />
				<div className="mt-3 absolute left-1/2 -translate-x-1/2 flex flex-col items-center max-w-lg w-full">
					{!hasQuery && <p className="text-xs font-medium text-muted-foreground/80 mb-2">Top Traders (24hr)</p>}
					<div className="flex justify-center items-start content-start flex-wrap gap-1.5 w-full">
						{traders.map((trader) => (
							<Link
								key={trader.address}
								href={`/trader/${trader.address}`}
								className="inline-flex items-center gap-2 rounded-md border px-3 h-8 text-sm backdrop-blur-sm opacity-80 text-foreground/80 hover:opacity-100 hover:bg-accent transition-colors"
							>
								<Avatar size="xs">
									{trader.profile_image && <AvatarImage src={trader.profile_image} />}
									<AvatarFallback>{getTraderDisplayName(trader).slice(0, 2).toUpperCase()}</AvatarFallback>
								</Avatar>
								<span>{getTraderDisplayName(trader)}</span>
							</Link>
						))}
						{hasQuery && traders.length === 0 && <p className="text-sm text-muted-foreground">No traders found for &ldquo;{q}&rdquo;</p>}
					</div>
				</div>
			</div>
		</div>
	);
}
