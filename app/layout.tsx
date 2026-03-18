import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";

import { getSiteUrl } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Polymarket Explorer",
    template: "%s | Polymarket Explorer",
  },
  description: "SEO-first Polymarket market explorer powered by server-side Struct SDK calls.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Polymarket Explorer",
    description: "Explore live Polymarket markets through a server-rendered Next.js application.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Polymarket Explorer",
    description: "SEO-first Polymarket market explorer powered by server-side Struct SDK calls.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${GeistSans.variable} ${GeistMono.variable} h-full min-h-svh antialiased font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="h-full min-h-svh">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
