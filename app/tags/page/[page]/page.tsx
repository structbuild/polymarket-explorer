import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { buildPageMetadata } from "@/lib/site-metadata";
import { parsePageParam } from "@/lib/pagination";
import { TagGridPage } from "@/components/tags/tag-grid-page";

export const revalidate = 3600;

type Props = {
	params: Promise<{ page: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { page: raw } = await params;
	const page = parsePageParam(raw);

	if (!page || page === 1) return {};

	return buildPageMetadata({
		title: `Prediction Market Tags - Page ${page}`,
		description: `Browse Polymarket tags and topics on page ${page}, including politics, crypto, sports, and more.`,
		canonical: `/tags/page/${page}`,
	});
}

export default async function TagPaginatedPage({ params }: Props) {
	const { page: raw } = await params;
	const page = parsePageParam(raw);

	if (!page) notFound();
	if (page === 1) redirect("/tags");

	return <TagGridPage page={page} />;
}
