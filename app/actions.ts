"use server";

import { searchTraders } from "@/lib/struct/queries";

export async function searchTradersAction(query: string) {
	const results = await searchTraders(query);
	return results.map((t) => ({
		address: t.address,
		name: t.name ?? null,
		pseudonym: t.pseudonym ?? null,
		profile_image: t.profile_image ?? null,
	}));
}
