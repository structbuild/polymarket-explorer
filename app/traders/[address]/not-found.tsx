import type { Metadata } from "next";

import { EntityNotFound } from "@/components/seo/entity-not-found";

export const metadata: Metadata = {
	title: "Trader not found",
	robots: { index: false, follow: true },
};

export default function TraderNotFound() {
	return (
		<EntityNotFound
			title="Trader not found"
			description="No trader profile matches that wallet address. Check the address or browse the leaderboard for top Polymarket traders."
			breadcrumbs={[
				{ label: "Home", href: "/" },
				{ label: "Traders", href: "/traders" },
				{ label: "Not found", href: "/traders" },
			]}
			backHref="/traders"
			backLabel="Browse traders"
		/>
	);
}
