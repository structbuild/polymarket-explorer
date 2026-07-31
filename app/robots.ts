import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/env";

const DISALLOWED_BOTS = [
	"GPTBot",
	"ChatGPT-User",
	"ClaudeBot",
	"anthropic-ai",
	"Google-Extended",
	"Applebot-Extended",
	"Bytespider",
	"Amazonbot",
	"CCBot",
	"Diffbot",
	"meta-externalagent",
	"FacebookBot",
	"PerplexityBot",
	"YouBot",
	"cohere-ai",
	"AhrefsBot",
	"SemrushBot",
	"DotBot",
	"MJ12bot",
	"DataForSeoBot",
	"BLEXBot",
	"PetalBot",
	"ImagesiftBot",
	"Omgilibot",
	"Scrapy",
	"magpie-crawler",
];

export default function robots(): MetadataRoute.Robots {
	const siteUrl = getSiteUrl();

	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/api/", "/actions/"],
			},
			{
				userAgent: DISALLOWED_BOTS,
				disallow: "/",
			},
		],
		sitemap: `${siteUrl.origin}/sitemap.xml`,
		host: siteUrl.origin,
	};
}
