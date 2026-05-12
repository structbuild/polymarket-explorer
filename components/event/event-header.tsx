import Image from "next/image";
import { ExternalLinkIcon } from "lucide-react";

import type { ReactNode } from "react";
import type { Event, EventMetricsResponse } from "@structbuild/sdk";

import { MarketDescription } from "@/components/market/market-description";
import { MarketTags } from "@/components/market/market-tags";
import { CopyLink } from "@/components/trader/copy-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume } from "@/components/ui/volume";
import { formatDateShort, formatNumber } from "@/lib/format";

function StatusBadge({ status }: { status: string }) {
	const lowered = status.toLowerCase();
	const isOpen = lowered === "open" || lowered === "active";
	const label = isOpen ? "Open" : status.charAt(0).toUpperCase() + status.slice(1);
	const variant = isOpen ? "positive" : lowered === "closed" || lowered === "resolved" ? "destructive" : "secondary";

	return (
		<Badge variant={variant} className="h-6 px-2.5 text-xs">
			{label}
		</Badge>
	);
}

function StatCard({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="min-w-[120px] flex-1 rounded-lg bg-secondary px-4 py-3 sm:min-w-[140px] sm:flex-none">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-1 text-lg font-medium tabular-nums">{value}</p>
		</div>
	);
}

type EventHeaderProps = {
	event: Event;
	slug: string;
	metrics: EventMetricsResponse | null;
};

export function EventHeader({ event, slug, metrics }: EventHeaderProps) {
	const polymarketSlug = event.event_slug ?? slug;
	const polymarketUrl = `https://polymarket.com/event/${polymarketSlug}`;
	const title = event.title ?? slug.replace(/-/g, " ");
	const tags = (event.tags ?? []).map((t) => t.label).filter((l): l is string => typeof l === "string" && l.length > 0);

	const lifetimeMetrics = event.metrics?.lifetime;
	const volumeUsd = metrics?.volume_usd ?? lifetimeMetrics?.volume ?? null;
	const sharesVolume = metrics?.shares_volume ?? lifetimeMetrics?.shares_volume ?? null;
	const txns = metrics?.txns ?? lifetimeMetrics?.txns ?? null;
	const traders = metrics?.unique_traders ?? lifetimeMetrics?.unique_traders ?? null;
	const fees = metrics?.fees ?? lifetimeMetrics?.fees ?? null;

	return (
		<div className="bg-card rounded-lg p-6 flex min-w-0 flex-col gap-5">
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col sm:flex-row min-w-0 flex-1 items-start gap-3 sm:gap-4">
					{event.image_url && (
						<Image
							src={event.image_url}
							alt={title}
							width={72}
							height={72}
							className="size-12 shrink-0 rounded-full object-cover sm:size-[72px]"
						/>
					)}
					<div className="min-w-0 flex-1 space-y-1.5">
						<h1 className="text-2xl font-medium tracking-tight">{title}</h1>
						<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
							<StatusBadge status={event.status ?? "unknown"} />
							<span className="text-foreground/70">
								{formatNumber(event.market_count ?? event.markets?.length ?? 0, { decimals: 0 })}{" "}
								{(event.market_count ?? event.markets?.length ?? 0) === 1 ? "market" : "markets"}
							</span>
							{event.end_time != null && (
								<>
									<span className="text-muted-foreground/40">·</span>
									<span>Ends {formatDateShort(event.end_time)}</span>
								</>
							)}
						</div>
					</div>
				</div>

				<div className="hidden shrink-0 items-center gap-2 lg:flex">
					<CopyLink />
					<Button size="lg" nativeButton={false} render={<a href={polymarketUrl} rel="noreferrer" target="_blank" />}>
						View on Polymarket
						<ExternalLinkIcon />
					</Button>
				</div>
			</div>

			<div className="flex flex-wrap gap-2 sm:gap-3">
				<StatCard
					label="Volume"
					value={
						<Volume
							usd={volumeUsd ?? 0}
							shares={sharesVolume}
							compact
							decimals={0}
						/>
					}
				/>
				{txns != null && (
					<StatCard label="Txns" value={formatNumber(txns, { decimals: 0 })} />
				)}
				{traders != null && (
					<StatCard label="Traders" value={formatNumber(traders, { decimals: 0 })} />
				)}
				{fees != null && (
					<StatCard label="Fees" value={formatNumber(fees, { currency: true, decimals: 0 })} />
				)}
			</div>

			{tags.length > 0 && <MarketTags tags={tags} />}

			{event.description && <MarketDescription text={event.description} />}

			<div className="flex flex-col gap-2 sm:flex-row lg:hidden">
				<CopyLink />
				<Button className="w-full" size="lg" nativeButton={false} render={<a href={polymarketUrl} rel="noreferrer" target="_blank" />}>
					View on Polymarket
					<ExternalLinkIcon />
				</Button>
			</div>
		</div>
	);
}

export function EventHeaderFallback() {
	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-start gap-3 sm:gap-4">
				<div className="size-12 shrink-0 animate-pulse rounded-full bg-muted sm:size-[72px]" />
				<div className="flex-1 space-y-3">
					<div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
					<div className="h-6 w-32 animate-pulse rounded-full bg-muted" />
				</div>
			</div>
			<div className="flex flex-wrap gap-2 sm:gap-3">
				{Array.from({ length: 3 }, (_, i) => (
					<div key={i} className="min-w-[120px] flex-1 rounded-xl bg-card px-4 py-3 sm:min-w-[140px] sm:flex-none">
						<div className="h-3 w-14 animate-pulse rounded bg-muted" />
						<div className="mt-2 h-5 w-24 animate-pulse rounded bg-muted" />
					</div>
				))}
			</div>
		</div>
	);
}
