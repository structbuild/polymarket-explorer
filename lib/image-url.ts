const POLYMARKET_UPLOAD_HOST = "polymarket-upload.s3.us-east-2.amazonaws.com";

export function normalizePolymarketS3ImageUrl(url: string | null | undefined): string | null | undefined {
	if (url == null || url === "") {
		return url;
	}

	try {
		const parsed = new URL(url);
		if (parsed.hostname !== POLYMARKET_UPLOAD_HOST) {
			return url;
		}
		if (!parsed.pathname.includes("%2B")) {
			return url;
		}
		parsed.pathname = parsed.pathname.replace(/%2B/g, "+");
		return parsed.href;
	} catch {
		return url;
	}
}

export function normalizeMarketResponseImages<T extends { image_url?: string | null }>(market: T): T {
	const next = normalizePolymarketS3ImageUrl(market.image_url);
	if (next === market.image_url) {
		return market;
	}
	return { ...market, image_url: next ?? null };
}
