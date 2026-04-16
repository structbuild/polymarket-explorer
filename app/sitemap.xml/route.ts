import { getSiteUrl } from "@/lib/env";

export const revalidate = 3600;

const SHARD_IDS = [0, 1, 2];

export function GET() {
	const siteUrl = getSiteUrl().origin;
	const lastmod = new Date().toISOString();

	const entries = SHARD_IDS.map(
		(id) =>
			`  <sitemap><loc>${siteUrl}/sitemap/${id}.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`,
	).join("\n");

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

	return new Response(body, {
		headers: {
			"Content-Type": "application/xml",
			"Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
		},
	});
}
