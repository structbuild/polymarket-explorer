"use server";

import { revalidatePath, updateTag } from "next/cache";

import {
	searchTraders,
	structTraderPositionsCacheTag,
	structTraderTradesCacheTag,
} from "@/lib/struct/queries";

export async function searchTradersAction(query: string) {
	const results = await searchTraders(query);
	return results.map((t) => ({
		address: t.address,
		name: t.name ?? null,
		pseudonym: t.pseudonym ?? null,
		profile_image: t.profile_image ?? null,
	}));
}

export async function refreshTraderTabAction(pathname: string, kind: "positions" | "activity") {
	if (!pathname.startsWith("/trader/")) {
		throw new Error("Invalid trader pathname");
	}

	updateTag(kind === "positions" ? structTraderPositionsCacheTag : structTraderTradesCacheTag);
	revalidatePath(pathname);
}
