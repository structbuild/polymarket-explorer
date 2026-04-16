import type { Metadata } from "next";

import { EntityNotFound } from "@/components/seo/entity-not-found";

export const metadata: Metadata = {
	title: "Market not found",
	robots: { index: false, follow: true },
};

export default function MarketNotFound() {
	return (
		<EntityNotFound
			title="Market not found"
			description="This prediction market doesn't exist, was renamed, or has been removed. Browse open markets to find what you're looking for."
			breadcrumbs={[
				{ label: "Home", href: "/" },
				{ label: "Markets", href: "/markets" },
				{ label: "Not found", href: "/markets" },
			]}
			backHref="/markets"
			backLabel="Browse markets"
		/>
	);
}
