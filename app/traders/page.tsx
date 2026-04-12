import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PaginationNav } from "@/components/seo/pagination-nav";
import { getSiteUrl } from "@/lib/env";
import { formatNumber, pnlColorClass } from "@/lib/format";
import { getGlobalLeaderboard } from "@/lib/struct/market-queries";
import { getTraderDisplayName, normalizeWalletAddress, cn } from "@/lib/utils";

export const revalidate = 300;

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const VALID_TIMEFRAMES = ["1d", "7d", "30d", "lifetime"] as const;
type Timeframe = (typeof VALID_TIMEFRAMES)[number];

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
	"1d": "24h",
	"7d": "7d",
	"30d": "30d",
	lifetime: "All Time",
};

function parseTimeframe(value: string | string[] | undefined): Timeframe {
	const raw = Array.isArray(value) ? value[0] : value;
	if (raw && (VALID_TIMEFRAMES as readonly string[]).includes(raw)) {
		return raw as Timeframe;
	}
	return "lifetime";
}

export const metadata: Metadata = {
	title: "Polymarket Traders - Top Traders by PnL",
	description:
		"See the top Polymarket traders ranked by profit. Track the best prediction market traders by PnL, volume, win rate, and more.",
	alternates: {
		canonical: "/traders",
	},
};

export default async function TradersPage({ searchParams }: Props) {
	const resolvedSearchParams = await searchParams;
	const timeframe = parseTimeframe(resolvedSearchParams.timeframe);
	const cursor = typeof resolvedSearchParams.cursor === "string" ? resolvedSearchParams.cursor : undefined;
	const { data: traders, hasMore, nextCursor } = await getGlobalLeaderboard(timeframe, 100, cursor);
	const siteUrl = getSiteUrl();

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: "Polymarket Traders",
		description: "Top Polymarket traders ranked by realized profit.",
		url: new URL("/traders", siteUrl).toString(),
		numberOfItems: traders.length,
		itemListElement: traders.map((entry, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: getTraderDisplayName(entry.trader),
			url: new URL(
				`/trader/${normalizeWalletAddress(entry.trader.address) ?? entry.trader.address}`,
				siteUrl,
			).toString(),
		})),
	};

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Traders", href: "/traders" },
				]}
			/>
			<JsonLd data={jsonLd} />

			<div className="mt-6">
				<h1 className="text-xl font-medium tracking-tight">Traders</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Top Polymarket traders ranked by realized profit.
				</p>
			</div>

			<div className="mt-6 flex flex-wrap gap-2">
				{VALID_TIMEFRAMES.map((tf) => (
					<Link
						key={tf}
						href={`/traders?timeframe=${tf}` as Route}
						className={cn(
							"rounded-md border px-3 py-1.5 text-sm transition-colors",
							tf === timeframe
								? "border-primary bg-primary text-primary-foreground"
								: "hover:bg-accent/50",
						)}
					>
						{TIMEFRAME_LABELS[tf]}
					</Link>
				))}
			</div>

			<div className="mt-6 overflow-x-auto rounded-lg border">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="px-4 py-3 text-left font-medium">#</th>
							<th className="px-4 py-3 text-left font-medium">Trader</th>
							<th className="px-4 py-3 text-right font-medium">PnL</th>
							<th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Volume</th>
							<th className="hidden px-4 py-3 text-right font-medium md:table-cell">Markets</th>
							<th className="hidden px-4 py-3 text-right font-medium md:table-cell">Win Rate</th>
						</tr>
					</thead>
					<tbody>
						{traders.map((entry, index) => {
							const address = normalizeWalletAddress(entry.trader.address) ?? entry.trader.address;
							const displayName = getTraderDisplayName(entry.trader);
							const pnl = entry.realized_pnl_usd ?? 0;

							return (
								<tr key={address} className="border-b last:border-b-0 transition-colors hover:bg-accent/50">
									<td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
									<td className="px-4 py-3">
										<Link
											href={`/trader/${address}` as Route}
											className="flex items-center gap-2 hover:underline"
										>
											{entry.trader.profile_image ? (
												<Image
													src={entry.trader.profile_image}
													alt=""
													width={24}
													height={24}
													className="size-6 shrink-0 rounded-full object-cover"
												/>
											) : (
												<div className="size-6 shrink-0 rounded-full bg-muted" />
											)}
											<span className="max-w-[12rem] truncate font-medium sm:max-w-[16rem]">
												{displayName}
											</span>
										</Link>
									</td>
									<td className={cn("px-4 py-3 text-right font-medium", pnlColorClass(pnl))}>
										{formatNumber(pnl, { compact: true, currency: true })}
									</td>
									<td className="hidden px-4 py-3 text-right text-muted-foreground sm:table-cell">
										{entry.total_volume_usd != null
											? formatNumber(entry.total_volume_usd, { compact: true, currency: true })
											: "—"}
									</td>
									<td className="hidden px-4 py-3 text-right text-muted-foreground md:table-cell">
										{entry.markets_traded ?? "—"}
									</td>
									<td className="hidden px-4 py-3 text-right text-muted-foreground md:table-cell">
										{entry.market_win_rate_pct != null
											? formatNumber(entry.market_win_rate_pct, { percent: true })
											: "—"}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
				{traders.length === 0 && (
					<p className="px-4 py-12 text-center text-muted-foreground">
						No traders found for this timeframe.
					</p>
				)}
			</div>
			<PaginationNav
				basePath="/traders"
				baseParams={{ timeframe }}
				cursor={cursor ?? null}
				nextCursor={nextCursor}
				hasMore={hasMore}
			/>
		</div>
	);
}
