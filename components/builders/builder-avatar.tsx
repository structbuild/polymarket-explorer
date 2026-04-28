"use client";

import { Facehash } from "facehash";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { facehashColorClasses } from "@/lib/facehash";
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";

type BuilderAvatarProps = {
	builderCode: string;
	iconUrl?: string | null;
	alt?: string;
	className?: string;
	useFacehash?: boolean;
};

export function BuilderAvatar({
	builderCode,
	iconUrl,
	alt,
	className,
	useFacehash = true,
}: BuilderAvatarProps) {
	const normalized =
		iconUrl != null ? normalizePolymarketS3ImageUrl(iconUrl.trim()) ?? iconUrl.trim() : null;

	if (normalized) {
		return (
			<Avatar className={cn("shrink-0 overflow-hidden rounded-md after:rounded-md", className)}>
				<AvatarImage src={normalized} alt={alt ?? ""} className="rounded-md object-cover" />
				<AvatarFallback className="overflow-hidden rounded-md p-0">
					{useFacehash ? (
						<Facehash
							className="size-full border-0 rounded-md"
							colorClasses={facehashColorClasses}
							name={builderCode}
						/>
					) : (
						<span className="flex size-full items-center justify-center rounded-md bg-muted text-sm font-medium text-muted-foreground">
							?
						</span>
					)}
				</AvatarFallback>
			</Avatar>
		);
	}

	if (!useFacehash) {
		return (
			<div
				className={cn(
					"flex shrink-0 items-center justify-center rounded-md border border-border bg-muted text-sm font-medium text-muted-foreground",
					className,
				)}
				aria-hidden
			>
				?
			</div>
		);
	}

	return (
		<Facehash
			className={cn("shrink-0 overflow-hidden rounded-md border", className)}
			colorClasses={facehashColorClasses}
			name={builderCode}
		/>
	);
}
