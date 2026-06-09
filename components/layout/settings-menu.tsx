"use client";

import { SettingsIcon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import posthog from "posthog-js";
import { useTransition } from "react";

import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { CHANGELOG_SEEN_STORAGE_KEY, getRecentChangelogIds } from "@/lib/changelog";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { useTimezone } from "@/lib/hooks/use-timezone";
import {
	VOLUME_MODE_EXPLAINER,
	VOLUME_MODE_LABELS,
	VOLUME_MODES,
	useVolumeMode,
	type VolumeMode,
} from "@/lib/hooks/use-volume-mode";

export function SettingsMenu() {
	const { mode, setMode } = useVolumeMode();
	const { theme, setTheme } = useTheme();
	const { timezone, setTimezone } = useTimezone();
	const [, setChangelogSeen] = useLocalStorage<string[]>(CHANGELOG_SEEN_STORAGE_KEY, []);
	const router = useRouter();
	const [, startTransition] = useTransition();

	function handleTimezoneChange(next: string) {
		if (next === timezone) return;
		posthog.capture("timezone_changed", { timezone: next });
		setTimezone(next);
		startTransition(() => router.refresh());
	}

	function handleReopenUpdates() {
		const recentIds = new Set(getRecentChangelogIds(Date.now()));
		setChangelogSeen((prev) => prev.filter((id) => !recentIds.has(id)));
		posthog.capture("changelog_reopened");
	}

	return (
		<Popover>
			<TooltipWrapper content="Settings">
				<PopoverTrigger
					aria-label="Open settings"
					className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border bg-card/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
				>
					<SettingsIcon className="size-4" />
				</PopoverTrigger>
			</TooltipWrapper>
			<PopoverContent align="end" className="w-64 gap-1.5 p-2.5">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-1.5">
						<p className="text-[11px] font-medium text-foreground">{VOLUME_MODE_EXPLAINER.heading}</p>
						<InfoTooltip
							content={`USD: ${VOLUME_MODE_EXPLAINER.usd} Notional: ${VOLUME_MODE_EXPLAINER.notional} ${VOLUME_MODE_EXPLAINER.footnote}`}
						/>
					</div>
					<ToggleGroup
						aria-label="Volume display mode"
						value={[mode]}
						onValueChange={(next) => {
							const picked = next[0] as VolumeMode | undefined;
							if (picked && picked !== mode) {
								posthog.capture("volume_mode_changed", {
									mode: picked,
									previous_mode: mode,
								});
								setMode(picked);
							}
						}}
						variant="outline"
						size="sm"
					>
						{VOLUME_MODES.map((option) => (
							<ToggleGroupItem
								key={option}
								value={option}
								aria-label={VOLUME_MODE_LABELS[option]}
								className="h-6 min-w-0 px-2 text-[11px]"
							>
								{VOLUME_MODE_LABELS[option]}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
				</div>
				<div className="-mx-2.5 border-t" />
				<div className="flex items-center justify-between gap-2">
					<p className="text-[11px] font-medium text-foreground">Timezone</p>
					<TimezoneSelect
						value={timezone}
						onChange={handleTimezoneChange}
						size="sm"
						className="h-6 min-w-[11rem] py-0 text-[11px]"
						contentClassName="max-h-72 min-w-[12rem]"
						aria-label="Timezone"
					/>
				</div>
				<div className="-mx-2.5 border-t" />
				<div className="flex items-center justify-between gap-2">
					<p className="text-[11px] font-medium text-foreground">Theme</p>
					<ToggleGroup
						aria-label="Theme"
						value={theme === "dark" ? ["dark"] : ["light"]}
						onValueChange={(next) => {
							const picked = next[0];
							if (picked && picked !== theme) {
								setTheme(picked);
							}
						}}
						variant="outline"
						size="sm"
					>
						<ToggleGroupItem value="light" aria-label="Light theme" className="h-6 min-w-0 px-2 text-[11px]">Light</ToggleGroupItem>
						<ToggleGroupItem value="dark" aria-label="Dark theme" className="h-6 min-w-0 px-2 text-[11px]">Dark</ToggleGroupItem>
					</ToggleGroup>
				</div>
				<div className="-mx-2.5 border-t" />
				<div className="flex items-center justify-between gap-2">
					<p className="text-[11px] font-medium text-foreground">What&apos;s new</p>
					<button
						type="button"
						onClick={handleReopenUpdates}
						className="inline-flex h-6 font-medium items-center gap-1 rounded-md border px-2 text-[11px] text-foreground/75 transition-colors hover:bg-accent hover:text-foreground"
					>
						Show updates
					</button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
