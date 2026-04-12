import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { MarketCard } from "@/components/market/market-card";
import { formatNumber, formatDateShort } from "@/lib/format";
import { getSiteUrl } from "@/lib/env";
import { getEventBySlug } from "@/lib/struct/market-queries";

export const revalidate = 300;

type Props = {
	params: Promise<{ slug: string }>;
};

function truncate(text: string, maxLength: number) {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength).trimEnd() + "…";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const event = await getEventBySlug(slug);

	if (!event) {
		notFound();
	}

	const title = `${event.title} - Prediction Market Odds`;
	const description = `Follow ${event.title} on Polymarket. ${event.market_count} markets with real-money predictions. Track probabilities, volume, and trader activity.`;
	const ogImage = event.image_url ?? `/event/${slug}/opengraph-image`;

	return {
		title,
		description,
		alternates: {
			canonical: `/event/${slug}`,
		},
		openGraph: {
			type: "article",
			title,
			description,
			images: [{ url: ogImage }],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [ogImage],
		},
	};
}

export default async function EventPage({ params }: Props) {
	const { slug } = await params;
	const event = await getEventBySlug(slug);

	if (!event) {
		notFound();
	}

	const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
	const firstTag = event.tags[0];
	const volume24h = event.metrics?.["24h"]?.volume ?? null;

	const breadcrumbItems = [
		{ label: "Home", href: "/" },
		{
			label: firstTag?.label ?? "Events",
			href: firstTag ? `/tags/${firstTag.slug}` : "/",
		},
		{
			label: truncate(event.title ?? "Untitled Event", 60),
			href: `/event/${slug}`,
		},
	];

	const jsonLdData: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: event.title,
		description: event.description,
		mainEntity: {
			"@type": "ItemList",
			numberOfItems: event.market_count,
			itemListElement: event.markets.map((m, i) => ({
				"@type": "ListItem",
				position: i + 1,
				name: m.question,
				url: `${siteUrl}/market/${m.market_slug}`,
			})),
		},
	};

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Breadcrumbs items={breadcrumbItems} />
			<JsonLd data={jsonLdData} />

			<div className="mt-6 space-y-6">
				<div className="flex gap-5">
					{event.image_url && (
						<Image
							src={event.image_url}
							alt=""
							width={96}
							height={96}
							className="size-24 shrink-0 rounded-lg object-cover"
						/>
					)}
					<div className="min-w-0 flex-1">
						<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
							{event.title}
						</h1>
						{event.description && (
							<p className="mt-2 text-muted-foreground">
								{event.description}
							</p>
						)}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
					<span>{event.market_count} {event.market_count === 1 ? "market" : "markets"}</span>
					{volume24h !== null && (
						<span>24h Vol {formatNumber(volume24h, { compact: true, currency: true })}</span>
					)}
					{event.status && (
						<Badge variant={event.status === "open" ? "positive" : event.status === "closed" ? "negative" : "secondary"}>
							{event.status}
						</Badge>
					)}
					{event.end_time && (
						<span>Ends {formatDateShort(event.end_time)}</span>
					)}
				</div>

				{event.tags.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{event.tags.map((tag) => (
							<Link key={tag.id} href={`/tags/${tag.slug}` as Route}>
								<Badge variant="outline">{tag.label}</Badge>
							</Link>
						))}
					</div>
				)}

				{event.series && (
					<p className="text-sm text-muted-foreground">
						Part of series: {event.series.title}
					</p>
				)}

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{event.markets.map((market) => (
						<MarketCard
							key={market.condition_id}
							slug={market.market_slug ?? null}
							question={market.question ?? null}
							imageUrl={market.image_url ?? null}
							outcomes={
								market.outcomes?.map((o) => ({
									label: o.name,
									probability: o.price ?? null,
								})) ?? []
							}
							volumeUsd={null}
							liquidityUsd={null}
							status={market.status}
							endTime={null}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
