import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/site-metadata";
import { TagGridPage } from "@/components/tags/tag-grid-page";

export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
	title: "Prediction Market Tags",
	description: "Browse Polymarket tags and topics, including politics, crypto, sports, and more.",
	canonical: "/tags",
});

export default function TagIndexPage() {
	return <TagGridPage page={1} />;
}
