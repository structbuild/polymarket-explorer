import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { RoutePaginationNav } from "@/components/seo/route-pagination-nav";
import { getSiteUrl } from "@/lib/env";
import { TAGS_PAGE_SIZE, getPageCount } from "@/lib/pagination";
import { SITE_NAME } from "@/lib/site-metadata";
import { getTagsPaginated, getTagCount } from "@/lib/struct/market-queries";

type TagGridPageProps = {
	page: number;
};

export async function TagGridPage({ page }: TagGridPageProps) {
	const [{ data: tags }, totalTags] = await Promise.all([
		getTagsPaginated(TAGS_PAGE_SIZE, (page - 1) * TAGS_PAGE_SIZE),
		getTagCount(),
	]);

	const totalPages = getPageCount(totalTags, TAGS_PAGE_SIZE);

	if (page > totalPages && page !== 1) {
		notFound();
	}

	const tagsWithSlug = tags.filter((tag) => tag.slug);

	const breadcrumbs = [
		{ label: "Home", href: "/" },
		{ label: "Tags", href: "/tags" },
		...(page > 1 ? [{ label: `Page ${page}`, href: `/tags/page/${page}` }] : []),
	];

	const siteUrl = getSiteUrl();
	const canonicalPath = page > 1 ? `/tags/page/${page}` : "/tags";
	const positionOffset = (page - 1) * TAGS_PAGE_SIZE;
	const pageSuffix = page > 1 ? ` — Page ${page}` : "";

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `Prediction Market Tags${pageSuffix} — ${SITE_NAME}`,
		description: `Browse prediction market tags${pageSuffix ? ` (page ${page})` : ""} on ${SITE_NAME}.`,
		url: new URL(canonicalPath, siteUrl).toString(),
		mainEntity: {
			"@type": "ItemList",
			numberOfItems: tagsWithSlug.length,
			itemListElement: tagsWithSlug.map((tag, index) => ({
				"@type": "ListItem",
				position: positionOffset + index + 1,
				name: tag.label,
				url: new URL(`/tags/${tag.slug}`, siteUrl).toString(),
			})),
		},
	};

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Breadcrumbs items={breadcrumbs} />
			<JsonLd data={jsonLd} />

			<div className="mt-6">
				<h1 className="text-xl font-medium tracking-tight">Tags</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Browse prediction markets by topic.
				</p>
			</div>

			<div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{tagsWithSlug.map((tag) => (
					<Link
						key={tag.id}
						href={`/tags/${tag.slug}` as Route}
						className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
					>
						<span className="font-medium capitalize">{tag.label}</span>
					</Link>
				))}
			</div>

			<RoutePaginationNav basePath="/tags" currentPage={page} totalPages={totalPages} />
		</div>
	);
}
