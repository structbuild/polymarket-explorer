import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

import { getSiteUrl } from "@/lib/env";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Polymarket Explorer",
    template: "%s | Polymarket Explorer",
  },
  description:
    "SEO-first Polymarket market explorer powered by server-side Struct SDK calls.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Polymarket Explorer",
    description:
      "Explore live Polymarket markets through a server-rendered Next.js application.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Polymarket Explorer",
    description:
      "SEO-first Polymarket market explorer powered by server-side Struct SDK calls.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <div className="page-shell">
          <header className="site-header">
            <Link className="site-brand" href="/">
              <span aria-hidden className="brand-mark">
                P
              </span>
              <span className="brand-copy">
                <span className="brand-title">Polymarket Explorer</span>
                <span className="brand-subtitle">
                  Struct-backed, SEO-ready market discovery
                </span>
              </span>
            </Link>
            <nav aria-label="Primary" className="site-nav">
              <Link href="/">Markets</Link>
              <a href="https://api.struct.to" rel="noreferrer" target="_blank">
                Struct API
              </a>
            </nav>
          </header>
          <main className="site-main">{children}</main>
          <footer className="site-footer">
            Server-rendered market pages keep `STRUCTBUILD_API_KEY` on the
            server boundary.
          </footer>
        </div>
      </body>
    </html>
  );
}

