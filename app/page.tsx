import { BeamsBackground } from "@/components/beams-background";
import { SearchInput } from "@/components/search-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getLeaderboard, searchTraders } from "@/lib/struct/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Markets",
	description: "Browse SEO-rendered Polymarket markets powered by server-side Struct SDK requests.",
};

function truncateAddress(address: string) {
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getTraderDisplayName(trader: { address: string; name?: string | null; pseudonym?: string | null }) {
	return trader.name ?? trader.pseudonym ?? truncateAddress(trader.address);
}

type Props = {
	searchParams: Promise<{ q?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
	const { q } = await searchParams;
	const hasQuery = q != null && q.trim().length >= 2;

	const [leaderboard, searchResults] = await Promise.all([
		hasQuery ? Promise.resolve([]) : getLeaderboard(),
		hasQuery ? searchTraders(q) : Promise.resolve([]),
	]);

	return (
		<div className="flex items-center justify-center flex-col gap-4 h-full w-full">
			<BeamsBackground />
			<div className="max-w-lg w-full relative mb-16">
				<div className="text-center mb-8 space-y-2">
					<h1 className="text-4xl font-medium">Analyze any trader</h1>
					<p className="text-base text-muted-foreground">Enter a trader&apos;s address or username to get started</p>
				</div>
				<SearchInput />
				<div className="mt-3 absolute left-1/2 -translate-x-1/2 flex justify-center items-start content-start flex-wrap gap-1.5 max-w-lg w-full">
					{hasQuery
						? searchResults.slice(0, 10).map((trader) => (
								<Button key={trader.address} size="sm" variant="outline" className="backdrop-blur-sm opacity-80 text-foreground/80 hover:opacity-100">
									<Avatar size="xs">
										{trader.profile_image && <AvatarImage src={trader.profile_image} />}
										<AvatarFallback>{getTraderDisplayName(trader).slice(0, 2).toUpperCase()}</AvatarFallback>
									</Avatar>
									<span>{getTraderDisplayName(trader)}</span>
								</Button>
							))
						: leaderboard.slice(0, 10).map((entry) => (
								<Button key={entry.trader.address} size="sm" variant="outline" className="backdrop-blur-sm opacity-80 text-foreground/80 hover:opacity-100">
									<Avatar size="xs">
										{entry.trader.profile_image && <AvatarImage src={entry.trader.profile_image} />}
										<AvatarFallback>{getTraderDisplayName(entry.trader).slice(0, 2).toUpperCase()}</AvatarFallback>
									</Avatar>
									<span>{getTraderDisplayName(entry.trader)}</span>
								</Button>
							))}
					{hasQuery && searchResults.length === 0 && (
						<p className="text-sm text-muted-foreground">No traders found for &ldquo;{q}&rdquo;</p>
					)}
				</div>
			</div>
		</div>
	);
}
