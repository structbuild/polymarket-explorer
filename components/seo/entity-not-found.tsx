import type { Route } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { buttonVariants } from "@/components/ui/button-variants";

type BreadcrumbItem = {
	label: string;
	href: string;
};

type EntityNotFoundProps = {
	title: string;
	description: string;
	breadcrumbs: BreadcrumbItem[];
	backHref: string;
	backLabel: string;
};

export function EntityNotFound({ title, description, breadcrumbs, backHref, backLabel }: EntityNotFoundProps) {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Breadcrumbs items={breadcrumbs} />

			<div className="mt-12 flex flex-col items-start gap-4 rounded-lg bg-card p-6 sm:p-10">
				<p className="text-sm font-medium text-muted-foreground">404 — Not found</p>
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
				<p className="max-w-prose text-sm text-muted-foreground sm:text-base">{description}</p>
				<div className="mt-2 flex flex-wrap gap-2">
					<Link href={backHref as Route} className={buttonVariants({ variant: "default", size: "lg" })}>
						{backLabel}
					</Link>
					<Link href={"/" as Route} className={buttonVariants({ variant: "outline", size: "lg" })}>
						Back to home
					</Link>
				</div>
			</div>
		</div>
	);
}
