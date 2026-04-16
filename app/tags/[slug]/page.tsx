import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PaginationNav } from "@/components/seo/pagination-nav";
import { MarketsTable } from "@/components/market/markets-table";
import { marketResponseToRow } from "@/lib/market-table-map";
import { getSiteUrl } from "@/lib/env";
import { formatCapitalizeWords } from "@/lib/format";
import {
	buildEntityPageTitle,
	buildPageMetadata,
	SITE_NAME,
} from "@/lib/site-metadata";
import { getTagBySlug, getMarketsByTag } from "@/lib/struct/market-queries";

export const revalidate = 300;

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug: rawSlug } = await params;
	const slug = decodeURIComponent(rawSlug);
	const tag = await getTagBySlug(slug);

	if (!tag) {
		return {};
	}

	const canonicalSlug = tag.slug ?? slug;
	const tagTitle = formatCapitalizeWords(tag.label);
	return buildPageMetadata({
		title: buildEntityPageTitle(tagTitle, "Prediction Markets"),
		description: `Browse ${tagTitle} prediction markets on Polymarket. Track live odds, trading volume, and recent market activity.`,
		canonical: `/tags/${canonicalSlug}`,
	});
}

export default async function TagPage({ params, searchParams }: Props) {
	const { slug: rawSlug } = await params;
	const slug = decodeURIComponent(rawSlug);
	const tag = await getTagBySlug(slug);

	if (!tag) {
		notFound();
	}

	const resolvedSearchParams = await searchParams;
	const cursor = typeof resolvedSearchParams.cursor === "string" ? resolvedSearchParams.cursor : undefined;
	const canonicalSlug = tag.slug ?? slug;
	const { data: markets, hasMore, nextCursor } = await getMarketsByTag(tag.label, 24, cursor);
	const siteUrl = getSiteUrl();
	const tagDisplay = formatCapitalizeWords(tag.label);

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `${tagDisplay} — ${SITE_NAME}`,
		description: `Prediction markets tagged ${tagDisplay} on ${SITE_NAME}.`,
		url: new URL(`/tags/${canonicalSlug}`, siteUrl).toString(),
		mainEntity: {
			"@type": "ItemList",
			numberOfItems: markets.length,
			itemListElement: markets.map((market, index) => ({
				"@type": "ListItem",
				position: index + 1,
				name: market.question ?? "Untitled Market",
				url: market.market_slug
					? new URL(`/markets/${market.market_slug}`, siteUrl).toString()
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
					{ label: tagDisplay, href: `/tags/${canonicalSlug}` },
				]}
			/>
			<JsonLd data={jsonLd} />

			<div className="mt-6">
				{markets.length > 0 ? (
					<MarketsTable
						markets={markets.map(marketResponseToRow)}
						paginationMode="none"
						sortingMode="client"
						toolbarLeft={
							<div className="mb-3">
								<h1 className="text-xl font-medium tracking-tight">{tagDisplay} Markets</h1>
								<p className="mt-1 text-sm text-muted-foreground">
									Explore prediction markets related to tag: {tagDisplay}.
								</p>
							</div>
						}
					/>
				) : (
					<>
						<div className="mb-6">
							<h1 className="text-xl font-medium tracking-tight">{tagDisplay} Markets</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								Explore prediction markets related to tag: {tagDisplay}.
							</p>
						</div>
						<p className="rounded-lg bg-card px-4 py-12 text-center text-muted-foreground">
							No markets found for this tag.
						</p>
					</>
				)}
			</div>
			<PaginationNav
				basePath={`/tags/${canonicalSlug}`}
				cursor={cursor ?? null}
				nextCursor={nextCursor}
				hasMore={hasMore}
			/>
		</div>
	);
}
