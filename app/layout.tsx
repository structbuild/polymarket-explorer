import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";

import { getSiteUrl } from "@/lib/env";
import { Header } from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
	metadataBase: getSiteUrl(),
	title: {
		default: "Polymarket Explorer — Trader Analytics & PnL Tracking",
		template: "%s | Polymarket Explorer",
	},
	description:
		"Analyze any Polymarket trader's performance, PnL history, and trading activity. Built with Struct and Polymarket APIs.",
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: "Polymarket Explorer — Trader Analytics & PnL Tracking",
		description: "Analyze any Polymarket trader's performance, PnL history, and trading activity. Powered by Struct.",
		type: "website",
		siteName: "Polymarket Explorer",
	},
	twitter: {
		card: "summary_large_image",
		title: "Polymarket Explorer — Trader Analytics",
		description: "Analyze any Polymarket trader's performance, PnL history, and trading activity. Powered by Struct.",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const siteUrl = getSiteUrl().origin;

	const websiteJsonLd = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: "Polymarket Explorer",
		url: siteUrl,
		description: "Analyze any Polymarket trader's performance, PnL history, and trading activity.",
		potentialAction: {
			"@type": "SearchAction",
			target: `${siteUrl}/?q={search_term_string}`,
			"query-input": "required name=search_term_string",
		},
	};

	return (
		<html lang="en" suppressHydrationWarning className="h-full">
			<body className={`${GeistSans.variable} ${GeistMono.variable} min-h-svh overflow-x-hidden antialiased font-sans`}>
				<Analytics />
				<JsonLd data={websiteJsonLd} />
				<NuqsAdapter>
					<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
						<TooltipProvider>
							<div className="flex min-h-svh flex-col">
								<Header />
								<main className="flex min-h-0 flex-1 flex-col">{children}</main>
								<Footer />
							</div>
						</TooltipProvider>
					</ThemeProvider>
				</NuqsAdapter>
			</body>
		</html>
	);
}
