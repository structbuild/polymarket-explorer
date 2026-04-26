import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";

import {
	FooterColumn,
	FooterColumnFallback,
	FooterColumnLink,
} from "@/components/layout/footer-column";
import { getFooterData } from "@/components/layout/footer-data";
import { FooterStructCta } from "@/components/layout/footer-struct-column";
import { Github } from "@/components/ui/svgs/github";
import { StructLogo } from "@/components/ui/svgs/struct-logo";
import { formatCapitalizeWords } from "@/lib/format";
import { normalizeWalletAddress, truncateAddress } from "@/lib/utils";
import { XLogoIcon } from "../ui/svgs/xtwitter";

export default function Footer() {
	return (
		<footer className="relative z-10 m-1 mt-12 rounded-3xl border bg-muted/20">
			<div className="mx-auto w-full max-w-7xl space-y-12 px-5 py-12 sm:space-y-16 sm:px-8 sm:py-16">
				<div className="flex flex-wrap items-center justify-between gap-4 border-b pb-8">
					<Link
						href="/"
						prefetch={false}
						aria-label="Struct Polymarket Explorer home"
						className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80"
					>
						<StructLogo className="h-5 text-foreground" />
						<span className="text-sm text-muted-foreground">Polymarket Explorer</span>
					</Link>
					<div className="flex items-center gap-5">
					<Link
							href="https://x.com/structbuild"
							prefetch={false}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Struct on X"
							className="block text-muted-foreground transition-colors hover:text-primary"
						>
							<XLogoIcon className="size-4.5" />
						</Link>
						<Link
							href="https://github.com/structbuild/polymarket-explorer"
							prefetch={false}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="GitHub repository"
							className="block text-muted-foreground transition-colors hover:text-primary"
						>
							<Github className="size-5" />
						</Link>
					</div>
				</div>

				<Suspense fallback={<FooterColumnsFallback />}>
					<FooterColumns />
				</Suspense>

				<FooterStructCta />
			</div>
		</footer>
	);
}

async function FooterColumns() {
	const { topMarkets, topTags, topTraders, rewardsMarkets } = await getFooterData();

	return (
		<div className="grid grid-cols-2 gap-8 sm:grid-cols-[1.4fr_0.6fr_0.6fr_1.4fr]">
			<FooterColumn title="Top Markets" viewAllHref={"/markets" as Route}>
				{topMarkets.map((market) => (
					<FooterColumnLink
						key={market.market_slug ?? market.condition_id}
						href={market.market_slug ? (`/markets/${market.market_slug}` as Route) : "/markets"}
						title={market.question ?? undefined}
					>
						{market.question ?? "Untitled market"}
					</FooterColumnLink>
				))}
			</FooterColumn>
			<FooterColumn title="Top Categories" viewAllHref={"/tags" as Route}>
				{topTags.map((tag) => (
					<FooterColumnLink key={tag.slug} href={`/tags/${tag.slug}` as Route} title={tag.label}>
						{formatCapitalizeWords(tag.label)}
					</FooterColumnLink>
				))}
			</FooterColumn>
			<FooterColumn title="Top Traders" viewAllHref={"/traders" as Route}>
				{topTraders.map((entry) => {
					const address = normalizeWalletAddress(entry.trader.address) ?? entry.trader.address;
					const name = entry.trader.name?.trim();
					const isAddressLike = name ? /^0x[0-9a-fA-F]{40}\b/.test(name) : false;
					const displayName = name && !isAddressLike ? name : truncateAddress(entry.trader.address);
					return (
						<FooterColumnLink key={entry.trader.address} href={`/traders/${address}` as Route} title={displayName}>
							{displayName}
						</FooterColumnLink>
					);
				})}
			</FooterColumn>
			<FooterColumn title="Rewards Markets" viewAllHref={"/rewards" as Route}>
				{rewardsMarkets.map((market) => (
					<FooterColumnLink
						key={market.market_slug ?? market.condition_id}
						href={market.market_slug ? (`/markets/${market.market_slug}` as Route) : "/rewards"}
						title={market.question ?? undefined}
					>
						{market.question ?? "Untitled market"}
					</FooterColumnLink>
				))}
			</FooterColumn>
		</div>
	);
}

function FooterColumnsFallback() {
	return (
		<div className="grid grid-cols-2 gap-8 sm:grid-cols-[1.4fr_0.6fr_0.6fr_1.4fr]">
			<FooterColumnFallback title="Top Markets" />
			<FooterColumnFallback title="Top Categories" />
			<FooterColumnFallback title="Top Traders" />
			<FooterColumnFallback title="Rewards Markets" />
		</div>
	);
}
