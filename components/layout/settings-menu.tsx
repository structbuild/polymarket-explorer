"use client";

import { SettingsIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TooltipWrapper } from "@/components/ui/tooltip";
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
			</PopoverContent>
		</Popover>
	);
}
