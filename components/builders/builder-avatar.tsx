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

function BuilderAvatarFacehash({
	builderCode,
	className,
}: {
	builderCode: string;
	className?: string;
}) {
	return (
		<div className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-md border", className)}>
			<Facehash
				className="rounded-md"
				colorClasses={facehashColorClasses}
				name={builderCode}
				size="100%"
			/>
		</div>
	);
}

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
			<Avatar
				className={cn(
					"shrink-0 overflow-hidden rounded-md after:rounded-md after:border-0",
					className,
				)}
			>
				<AvatarImage src={normalized} alt={alt ?? ""} className="rounded-md object-cover" />
				<AvatarFallback className="overflow-hidden rounded-md p-0">
					{useFacehash ? (
						<BuilderAvatarFacehash builderCode={builderCode} className="size-full border-0" />
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
		<BuilderAvatarFacehash builderCode={builderCode} className={className} />
	);
}
