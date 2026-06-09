import Image from "next/image";

import type { ReactNode } from "react";

import { MarketDescription } from "@/components/market/market-description";
import { MarketTags } from "@/components/market/market-tags";
import { ViewOnPolymarketButton } from "@/components/market/view-on-polymarket-button";
import { CopyLink } from "@/components/trader/copy-link";
import { Badge } from "@/components/ui/badge";
import { Volume } from "@/components/ui/volume";
import { formatDateShort, formatNumber } from "@/lib/format";
import type { MarketResponse } from "@structbuild/sdk";

function StatusBadge({ status }: { status: string }) {
	const isOpen = status === "active";
	const label = isOpen ? "Active" : status.charAt(0).toUpperCase() + status.slice(1);
	const variant = isOpen ? "positive" : status === "closed" || status === "resolved" ? "destructive" : "secondary";

	return (
		<Badge variant={variant} className="h-6 px-2.5 text-xs">
			{label}
		</Badge>
	);
}

function StatCard({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="min-w-[140px] flex-1 rounded-lg bg-secondary px-4 py-3 sm:min-w-[160px] sm:flex-none">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-1 text-lg font-medium tabular-nums">{value}</p>
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
	const title = market.question ?? market.title ?? slug.replace(/-/g, " ");

	const tags = market.tags ?? [];

	return (
		<div className="bg-card rounded-lg p-6 flex min-w-0 flex-col gap-5">
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col sm:flex-row min-w-0 flex-1 items-start gap-3 sm:gap-4">
					{market.image_url && (
						<Image
							src={market.image_url}
							alt={title}
							width={72}
							height={72}
							className="size-12 shrink-0 rounded-full object-cover sm:size-[72px]"
						/>
					)}
					<div className="min-w-0 flex-1 space-y-1">
						<h1 className="text-2xl font-medium tracking-tight">{title}</h1>
						<StatusBadge status={market.status ?? "unknown"} />
					</div>
				</div>

				<div className="hidden shrink-0 items-center gap-2 lg:flex">
					<CopyLink />
					<ViewOnPolymarketButton href={polymarketUrl} label="View Market" />
				</div>
			</div>

			<div className="flex flex-wrap gap-2 sm:gap-3">
				<StatCard
					label="Volume"
					value={
						<Volume
							usd={market.metrics?.["lifetime"]?.volume ?? market.volume_usd ?? 0}
							shares={market.metrics?.["lifetime"]?.shares_volume ?? null}
							compact
							decimals={0}
						/>
					}
				/>
				<StatCard label="Txns" value={formatNumber(market.metrics?.["lifetime"]?.txns ?? 0, { decimals: 0 })} />
				<StatCard label="Traders" value={formatNumber(market.metrics?.["lifetime"]?.unique_traders ?? 0, { decimals: 0 })} />
				<StatCard label="Fees" value={formatNumber(market.metrics?.["lifetime"]?.fees ?? 0, { currency: true, decimals: 0 })} />
				{market.status === "active" && <StatCard label="Liquidity" value={formatNumber(market.liquidity_usd ?? 0, { currency: true, decimals: 0 })} />}
				<StatCard label="Ends" value={formatDateShort(market.end_time)} />
			</div>

			{tags.length > 0 && <MarketTags tags={tags} />}

			{market.description && <MarketDescription text={market.description} />}

			<div className="flex flex-col gap-2 sm:flex-row lg:hidden">
				<CopyLink />
				<ViewOnPolymarketButton className="w-full" href={polymarketUrl} label="View Market" />
			</div>
		</div>
	);
}

export function MarketHeaderFallback() {
	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-start gap-3 sm:gap-4">
				<div className="size-12 shrink-0 animate-pulse rounded-full bg-muted sm:size-[72px]" />
				<div className="flex-1 space-y-3">
					<div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
					<div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
				</div>
			</div>
			<div className="flex flex-wrap gap-2 sm:gap-3">
				{Array.from({ length: 3 }, (_, i) => (
					<div key={i} className="min-w-[140px] flex-1 rounded-xl bg-card px-4 py-3 sm:min-w-[160px] sm:flex-none">
						<div className="h-3 w-14 animate-pulse rounded bg-muted" />
						<div className="mt-2 h-5 w-24 animate-pulse rounded bg-muted" />
					</div>
				))}
			</div>
			<div className="flex flex-wrap gap-1.5">
				{Array.from({ length: 4 }, (_, i) => (
					<div key={i} className="h-7 w-20 animate-pulse rounded-full bg-muted" />
				))}
			</div>
		</div>
	);
}
