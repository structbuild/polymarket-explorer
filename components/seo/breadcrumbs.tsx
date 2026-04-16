import type { Route } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl } from "@/lib/env";

type BreadcrumbItem = {
	label: string;
	href: string;
};

type BreadcrumbsProps = {
	items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
	const siteUrl = getSiteUrl();

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.label,
			item: new URL(item.href, siteUrl).toString(),
		})),
	};

	return (
		<>
			<JsonLd data={jsonLd} />
			<nav
				aria-label="Breadcrumb"
				className="-mx-4 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
			>
				<ol className="flex w-max min-w-0 flex-nowrap items-center gap-1.5 text-sm text-muted-foreground">
					{items.map((item, index) => {
						const isLast = index === items.length - 1;

						return (
							<li key={item.href} className="flex shrink-0 items-center gap-1.5">
								{index > 0 && (
									<span aria-hidden="true" className="shrink-0">
										/
									</span>
								)}
								{isLast ? (
									<span className="whitespace-nowrap text-foreground">{item.label}</span>
								) : (
									<Link
										href={item.href as Route}
										className="whitespace-nowrap transition-colors hover:text-foreground"
									>
										{item.label}
									</Link>
								)}
							</li>
						);
					})}
				</ol>
			</nav>
		</>
	);
}
