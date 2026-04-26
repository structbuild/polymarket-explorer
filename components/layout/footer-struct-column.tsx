import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

const STRUCT_PRODUCTS = [
	{
		href: "https://www.struct.to/rest-api",
		label: "REST API",
		description: "Markets, traders, trades, leaderboards.",
	},
	{
		href: "https://www.struct.to/webhooks",
		label: "Webhooks",
		description: "Real-time event delivery to your endpoint.",
	},
	{
		href: "https://www.struct.to/websockets",
		label: "WebSockets",
		description: "Live streams for prices, orders, fills.",
	},
	{
		href: "https://docs.struct.to/",
		label: "Documentation",
		description: "Reference, guides, and SDK examples.",
	},
] as const;

export function FooterStructCta() {
	return (
		<section className="rounded-xl bg-card p-6 sm:p-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="max-w-xl">
					<h3 className="text-lg font-medium tracking-tight">Build with Struct</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						The Polymarket data API powering this explorer. Plug into markets, traders, and trades in minutes.
					</p>
				</div>
				<Link
					href="https://www.struct.to"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-foreground/90 underline-offset-4 transition-colors hover:text-primary hover:underline sm:self-auto"
				>
					struct.to
					<ArrowUpRightIcon className="size-4" />
				</Link>
			</div>
			<ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{STRUCT_PRODUCTS.map((product) => (
					<li key={product.href}>
						<Link
							href={product.href}
							target="_blank"
							rel="noopener noreferrer"
							className="group flex h-full flex-col gap-1 rounded-lg bg-muted/60 px-4 py-3 transition-colors hover:bg-muted"
						>
							<span className="flex items-center justify-between gap-2 text-sm font-medium text-foreground/90 group-hover:text-foreground">
								{product.label}
								<ArrowUpRightIcon className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
							</span>
							<span className="text-xs text-muted-foreground">{product.description}</span>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}
