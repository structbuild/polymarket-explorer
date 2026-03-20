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
		<div className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
			<BeamsBackground />
			<div className="w-full max-w-xl">
				<div className="mb-8 space-y-2 text-center sm:mb-10">
					<h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Analyze any trader</h1>
					<p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
						Enter a trader&apos;s address or username to get started
					</p>
				</div>
				<SearchInput />
				<div className="mt-4 flex w-full flex-col items-center">
					{!hasQuery && <p className="mb-2 text-center text-xs font-medium text-muted-foreground/80">Top Traders (24hr)</p>}
					<div className="flex w-full flex-wrap justify-center gap-2">
						{traders.map((trader) => (
							<Link
								key={trader.address}
								href={`/trader/${trader.address}`}
								className="inline-flex h-9 max-w-full items-center gap-2 rounded-md border px-3 text-sm text-foreground/80 opacity-80 backdrop-blur-sm transition-colors hover:bg-accent hover:opacity-100"
							>
								<Avatar size="xs">
									{trader.profile_image && <AvatarImage src={trader.profile_image} />}
									<AvatarFallback>{getTraderDisplayName(trader).slice(0, 2).toUpperCase()}</AvatarFallback>
								</Avatar>
								<span className="max-w-[11rem] truncate sm:max-w-[16rem]">{getTraderDisplayName(trader)}</span>
							</Link>
						))}
						{hasQuery && traders.length === 0 && (
							<p className="text-center text-sm text-muted-foreground">No traders found for &ldquo;{q}&rdquo;</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
