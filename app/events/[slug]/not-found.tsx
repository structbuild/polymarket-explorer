import type { Metadata } from "next";

import { EntityNotFound } from "@/components/seo/entity-not-found";

export const metadata: Metadata = {
	title: "Event not found",
	robots: { index: false, follow: true },
};

export default function EventNotFound() {
	return (
		<EntityNotFound
			title="Event not found"
			description="This Polymarket event doesn't exist, was renamed, or has been removed. Browse open events to find what you're looking for."
			breadcrumbs={[
				{ label: "Home", href: "/" },
				{ label: "Events", href: "/events" },
				{ label: "Not found", href: "/events" },
			]}
			backHref="/events"
			backLabel="Browse events"
		/>
	);
}
