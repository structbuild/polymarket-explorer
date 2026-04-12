import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventCard } from "@/components/event/event-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PaginationNav } from "@/components/seo/pagination-nav";
import { MarketCard } from "@/components/market/market-card";
import { getSiteUrl } from "@/lib/env";
import {
	getTagBySlug,
	getMarketsByTag,
	getEventsByTag,
} from "@/lib/struct/market-queries";

export const revalidate = 300;

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const tag = await getTagBySlug(slug);

	if (!tag) {
		return {};
	}

	return {
		title: `${tag.label} Prediction Markets`,
		description: `Explore ${tag.label} prediction markets on Polymarket. Real-money odds, probabilities, and trading volume for ${tag.label} questions.`,
		alternates: {
			canonical: `/tags/${slug}`,
		},
	};
}

export default async function TagPage({ params, searchParams }: Props) {
	const { slug } = await params;
	const resolvedSearchParams = await searchParams;
	const cursor = typeof resolvedSearchParams.cursor === "string" ? resolvedSearchParams.cursor : undefined;
	const tag = await getTagBySlug(slug);

	if (!tag) {
		notFound();
	}

	const [marketsResult, events] = await Promise.all([
		getMarketsByTag(slug, 24, cursor),
		cursor ? Promise.resolve([]) : getEventsByTag(slug),
	]);

	const { data: markets, hasMore, nextCursor } = marketsResult;
	const siteUrl = getSiteUrl();

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `${tag.label} Prediction Markets`,
		description: `Explore prediction markets and events related to ${tag.label}.`,
		url: new URL(`/tags/${slug}`, siteUrl).toString(),
		mainEntity: {
			"@type": "ItemList",
			numberOfItems: markets.length,
			itemListElement: markets.map((market, index) => ({
				"@type": "ListItem",
				position: index + 1,
				name: market.question ?? "Untitled Market",
				url: market.market_slug
					? new URL(`/market/${market.market_slug}`, siteUrl).toString()
					: undefined,
			})),
		},
	};

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Tags", href: "/tags" },
					{ label: tag.label, href: `/tags/${slug}` },
				]}
			/>
			<JsonLd data={jsonLd} />

			<div className="mt-6">
				<h1 className="text-xl font-medium tracking-tight">{tag.label} Markets</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Explore prediction markets and events related to {tag.label}.
				</p>
			</div>

			{events.length > 0 && (
				<section className="mt-8">
					<h2 className="mb-4 text-lg font-medium">Events</h2>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{events.map((event) => (
							<EventCard
								key={event.id}
								slug={event.event_slug ?? null}
								title={event.title ?? null}
								imageUrl={event.image_url ?? null}
								marketCount={event.market_count}
								volume24hUsd={event.metrics?.["24h"]?.volume ?? null}
								status={event.status}
								endTime={event.end_time ?? null}
							/>
						))}
					</div>
				</section>
			)}

			<section className="mt-8">
				<div className="grid gap-4 sm:grid-cols-2">
					{markets.map((market) => (
						<MarketCard
							key={market.condition_id}
							slug={market.market_slug ?? null}
							question={market.question ?? null}
							imageUrl={market.image_url ?? null}
							outcomes={
								market.outcomes?.map((o) => ({
									label: o.name,
									probability: o.price,
								})) ?? []
							}
							volumeUsd={market.volume_usd ?? null}
							liquidityUsd={market.liquidity_usd ?? null}
							status={market.status}
							endTime={market.end_time ?? null}
						/>
					))}
				</div>
				{markets.length === 0 && (
					<p className="rounded-lg bg-card px-4 py-12 text-center text-muted-foreground">
						No markets found for this tag.
					</p>
				)}
				<PaginationNav
					basePath={`/tags/${slug}`}
					cursor={cursor ?? null}
					nextCursor={nextCursor}
					hasMore={hasMore}
				/>
			</section>
		</div>
	);
}
