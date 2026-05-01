"use client";

import { Facehash } from "facehash";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { facehashColorClasses } from "@/lib/facehash";
import { cn } from "@/lib/utils";

type TraderAvatarProps = {
	displayName: string;
	profileImage?: string | null;
	className?: string;
	rounded?: "md" | "lg";
};

function TraderAvatarFacehash({
	className,
	displayName,
	rounded,
}: {
	className?: string;
	displayName: string;
	rounded: "md" | "lg";
}) {
	const roundedClass = rounded === "md" ? "rounded-md" : "rounded-lg";

	return (
		<div className={cn("relative flex size-10 shrink-0 overflow-hidden border", roundedClass, className)}>
			<Facehash
				className={roundedClass}
				colorClasses={facehashColorClasses}
				name={displayName}
				size="100%"
			/>
		</div>
	);
}

export function TraderAvatar({
	displayName,
	profileImage,
	className,
	rounded = "lg",
}: TraderAvatarProps) {
	const roundedClass = rounded === "md" ? "rounded-md after:rounded-md" : "rounded-lg after:rounded-lg";
	const imageRoundedClass = rounded === "md" ? "rounded-md" : "rounded-lg";

	if (profileImage) {
		return (
			<Avatar className={cn(roundedClass, className)}>
				<AvatarImage src={profileImage} alt={`${displayName} avatar`} className={imageRoundedClass} />
				<span
					aria-hidden="true"
					className={cn("hidden size-full", imageRoundedClass)}
					data-share-avatar-fallback="true"
				>
					<TraderAvatarFacehash
						className="size-full border-0"
						displayName={displayName}
						rounded={rounded}
					/>
				</span>
				<AvatarFallback className={cn(imageRoundedClass, "overflow-hidden p-0")}>
					<TraderAvatarFacehash
						className="size-full border-0"
						displayName={displayName}
						rounded={rounded}
					/>
				</AvatarFallback>
			</Avatar>
		);
	}

	return (
		<TraderAvatarFacehash
			className={className}
			displayName={displayName}
			rounded={rounded}
		/>
	);
}
