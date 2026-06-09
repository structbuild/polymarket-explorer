"use client";

import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { captureOutbound } from "@/components/ui/external-link";
import { cn } from "@/lib/utils";

type ViewOnPolymarketButtonProps = {
	href: string;
	label: string;
	className?: string;
};

export function ViewOnPolymarketButton({ href, label, className }: ViewOnPolymarketButtonProps) {
	return (
		<Button
			className={cn(className)}
			size="lg"
			nativeButton={false}
			onClick={() => captureOutbound(href, { link_type: "polymarket" })}
			render={<a href={href} rel="noreferrer" target="_blank" />}
		>
			{label}
			<ExternalLinkIcon />
		</Button>
	);
}
