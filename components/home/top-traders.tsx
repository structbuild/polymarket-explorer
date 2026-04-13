import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getLeaderboard } from "@/lib/polymarket/leaderboard";
import { formatNumber } from "@/lib/format";
import { getTraderDisplayName, normalizeWalletAddress } from "@/lib/utils";
import type { Route } from "next";
import Link from "next/link";

export async function TopTraders() {
	const leaderboard = await getLeaderboard();
	const traders = leaderboard.slice(0, 10).map((entry) => ({ ...entry.trader, pnl: entry.pnl }));

	return (
		<>
			<p className="mb-2 text-center text-xs font-medium text-muted-foreground/80">Top Traders (Weekly)</p>
			<div className="flex w-full flex-wrap justify-center gap-2">
				{traders.map((trader) => (
					<Link
						key={trader.address}
						href={`/traders/${normalizeWalletAddress(trader.address) ?? trader.address}` as Route}
						className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border px-2 text-xs text-foreground/90 opacity-80 backdrop-blur-sm transition-colors hover:bg-accent hover:opacity-100 sm:h-9 sm:gap-2 sm:px-3 sm:text-sm"
					>
						{trader.profile_image && (
							<Avatar size="xs">
								<AvatarImage src={trader.profile_image} />
								<AvatarFallback>{getTraderDisplayName(trader).slice(0, 2).toUpperCase()}</AvatarFallback>
							</Avatar>
						)}
						<span className="max-w-44 truncate sm:max-w-[16rem]">{getTraderDisplayName(trader)}</span>
						<span className="text-emerald-500">+{formatNumber(trader.pnl, { compact: true, currency: true })}</span>
					</Link>
				))}
			</div>
		</>
	);
}

export function TopTradersFallback() {
	return (
		<>
			<p className="mb-2 text-center text-xs font-medium text-muted-foreground/80">Top Traders (Weekly)</p>
			<div className="flex w-full flex-wrap justify-center gap-2">
				{Array.from({ length: 8 }, (_, index) => (
					<div
						key={index}
						className="h-7 w-28 animate-pulse rounded-md border bg-card/70 sm:h-9 sm:w-36"
					/>
				))}
			</div>
		</>
	);
}
