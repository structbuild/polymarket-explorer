import type { Metadata } from "next";

import { EntityNotFound } from "@/components/seo/entity-not-found";

export const metadata: Metadata = {
	title: "Tag not found",
	robots: { index: false, follow: true },
};

export default function TagNotFound() {
	return (
		<EntityNotFound
			title="Tag not found"
			description="This tag doesn't exist on Polymarket. Browse the full tag directory to explore prediction markets by topic."
			breadcrumbs={[
				{ label: "Home", href: "/" },
				{ label: "Tags", href: "/tags" },
				{ label: "Not found", href: "/tags" },
			]}
			backHref="/tags"
			backLabel="Browse tags"
		/>
	);
}
