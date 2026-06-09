"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import posthog from "posthog-js";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { authClient } from "@/lib/auth-client";
import { SignInDialog } from "./sign-in-dialog";

function getInitial(value: string) {
	const trimmed = value.trim();
	return trimmed ? trimmed[0].toUpperCase() : "?";
}

export function UserMenu() {
	const { data: session, isPending } = authClient.useSession();
	const [signInOpen, setSignInOpen] = useState(false);
	const [signingOut, setSigningOut] = useState(false);
	const router = useRouter();

	async function handleSignOut() {
		posthog.capture("auth_signed_out", {});
		setSigningOut(true);
		await authClient.signOut();
		setSigningOut(false);
		router.refresh();
	}

	if (isPending) {
		return <div aria-hidden className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />;
	}

	if (!session?.user) {
		return (
			<>
				<Button
					onClick={() => {
						posthog.capture("sign_in_dialog_opened", { trigger: "header" });
						setSignInOpen(true);
					}}
					className="h-8 px-3 sm:h-9"
				>
					Sign in
				</Button>
				<SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
			</>
		);
	}

	const user = session.user;
	const label = user.email ?? user.name ?? "Account";

	return (
		<Popover>
			<PopoverTrigger
				aria-label="Account menu"
				className="inline-flex shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
			>
				<Avatar size="default">
					{user.image ? <AvatarImage src={user.image} alt={label} /> : null}
					<AvatarFallback>{getInitial(label)}</AvatarFallback>
				</Avatar>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-56 gap-2 p-2.5">
				<div className="flex items-center gap-2 px-1">
					<Avatar size="sm">
						{user.image ? <AvatarImage src={user.image} alt={label} /> : null}
						<AvatarFallback>{getInitial(label)}</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<p className="truncate text-sm font-medium text-foreground">{user.name ?? "Signed in"}</p>
						<p className="truncate text-xs text-muted-foreground">{user.email}</p>
					</div>
				</div>
				<div className="-mx-2.5 border-t" />
				<Button
					variant="ghost"
					size="sm"
					className="w-full justify-start"
					disabled={signingOut}
					onClick={handleSignOut}
				>
					<LogOutIcon className="size-4" />
					{signingOut ? "Signing out..." : "Sign out"}
				</Button>
			</PopoverContent>
		</Popover>
	);
}
