import type { Metadata } from "next";

import { EntityNotFound } from "@/components/seo/entity-not-found";

export const metadata: Metadata = {
	title: "Builder not found",
	robots: { index: false, follow: true },
};

export default function BuilderNotFound() {
	return (
		<EntityNotFound
			title="Builder not found"
			description="This builder code isn't registered on Polymarket. Browse the full builder directory to explore apps and integrators."
			breadcrumbs={[
				{ label: "Home", href: "/" },
				{ label: "Builders", href: "/builders" },
				{ label: "Not found", href: "/builders" },
			]}
			backHref="/builders"
			backLabel="Browse builders"
		/>
	);
}
