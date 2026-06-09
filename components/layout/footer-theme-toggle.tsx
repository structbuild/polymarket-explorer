"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import posthog from "posthog-js";

import { Button } from "@/components/ui/button";
import { TooltipWrapper } from "@/components/ui/tooltip";

export function FooterThemeToggle() {
	const { setTheme } = useTheme();

	return (
		<TooltipWrapper content="Toggle theme">
			<Button
				type="button"
				variant="ghost"
				size="icon"
				aria-label="Toggle theme"
				onClick={() => {
					const nextTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
					posthog.capture("theme_toggled", { theme: nextTheme });
					setTheme(nextTheme);
				}}
				className="size-8 text-muted-foreground hover:text-primary"
			>
				<MoonIcon className="size-5 dark:hidden" />
				<SunIcon className="hidden size-5 dark:block" />
			</Button>
		</TooltipWrapper>
	);
}
