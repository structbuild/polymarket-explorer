import type { Metadata, Route } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { getAllTags } from "@/lib/struct/market-queries";

export const revalidate = 3600;

export const metadata: Metadata = {
	title: "Prediction Market Tags",
	description:
		"Browse all prediction market tags on Polymarket. Find markets by topic including politics, crypto, sports, and more.",
	alternates: {
		canonical: "/tags",
	},
};

export default async function TagIndexPage() {
	const tags = await getAllTags();
	const tagsWithSlug = tags.filter((tag) => tag.slug);

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Tags", href: "/tags" },
				]}
			/>

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
						className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
					>
						<span className="font-medium">{tag.label}</span>
					</Link>
				))}
			</div>
		</div>
	);
}
