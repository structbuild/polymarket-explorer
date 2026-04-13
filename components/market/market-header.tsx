import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

import { CopyLink } from "@/components/trader/copy-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateShort, formatNumber } from "@/lib/format";
import type { MarketResponse } from "@structbuild/sdk";

function StatusBadge({ status }: { status: string }) {
	const variant =
		status === "open"
			? "positive"
			: status === "closed"
				? "secondary"
				: "outline";

	return (
		<Badge variant={variant} className="text-xs">
			{status.charAt(0).toUpperCase() + status.slice(1)}
		</Badge>
	);
}

function StatItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="min-w-0 space-y-1">
			<p className="text-xs leading-4 text-muted-foreground sm:text-sm">{label}</p>
			<p className="text-base font-medium font-mono tabular-nums sm:text-lg">{value}</p>
		</div>
	);
}

type MarketHeaderProps = {
	market: MarketResponse;
	slug: string;
};

export function MarketHeader({ market, slug }: MarketHeaderProps) {
	const polymarketSlug = market.market_slug ?? slug;
	const polymarketUrl = `https://polymarket.com/event/${polymarketSlug}`;

	return (
		<div className="flex min-w-0 flex-col gap-4 overflow-hidden rounded-lg bg-card p-4 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
			<div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
				{market.image_url && (
					<Image
						src={market.image_url}
						alt={market.question ?? market.title ?? ""}
						width={80}
						height={80}
						className="size-16 shrink-0 rounded-xl object-cover sm:size-20"
					/>
				)}
				<div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden">
					<div className="space-y-2">
						<h1 className="min-w-0 text-2xl font-medium tracking-tight sm:text-3xl">
							{market.question ?? market.title ?? slug.replace(/-/g, " ")}
						</h1>
						{market.description && (
							<p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
								{market.description}
							</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-4">
						<StatItem
							label="Volume"
							value={formatNumber(market.volume_usd ?? 0, {
								compact: true,
								currency: true,
							})}
						/>
						<StatItem
							label="Liquidity"
							value={formatNumber(market.liquidity_usd ?? 0, {
								compact: true,
								currency: true,
							})}
						/>
						<StatItem
							label="Holders"
							value={formatNumber(market.total_holders ?? 0, { decimals: 0 })}
						/>
						<div className="min-w-0 space-y-1">
							<p className="text-xs leading-4 text-muted-foreground sm:text-sm">Status</p>
							<StatusBadge status={market.status ?? "unknown"} />
						</div>
						<StatItem
							label="End Date"
							value={formatDateShort(market.end_time)}
						/>
					</div>

					{(market.tags?.length ?? 0) > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{market.tags!.map((tag) => (
								<Link key={tag} href={`/tags/${tag}` as Route}>
									<Badge variant="secondary">{tag}</Badge>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 lg:flex lg:w-auto lg:justify-end">
				<CopyLink />
				<Button
					className="w-full lg:w-fit"
					size="lg"
					nativeButton={false}
					render={<a href={polymarketUrl} rel="noreferrer" target="_blank" />}
				>
					View Market
					<ExternalLinkIcon />
				</Button>
			</div>
		</div>
	);
}

export function MarketHeaderFallback() {
	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
					<div className="size-16 animate-pulse rounded-xl bg-muted sm:size-20" />
					<div className="min-w-0 flex-1 space-y-4">
						<div className="space-y-2">
							<div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
							<div className="h-4 w-full animate-pulse rounded bg-muted" />
							<div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
						</div>
						<div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-4">
							{Array.from({ length: 5 }, (_, i) => (
								<div key={i} className="space-y-2">
									<div className="h-3 w-14 animate-pulse rounded bg-muted" />
									<div className="h-5 w-20 animate-pulse rounded bg-muted" />
								</div>
							))}
						</div>
					</div>
				</div>
				<div className="h-10 w-full animate-pulse rounded-md bg-muted sm:w-36" />
			</div>
		</div>
	);
}
