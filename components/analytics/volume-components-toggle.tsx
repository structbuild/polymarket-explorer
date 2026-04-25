"use client";

import { Settings2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	DEFAULT_VOLUME_COMPONENTS,
	VOLUME_COMPONENT_IDS,
	VOLUME_COMPONENT_LABELS,
	isDefaultVolumeComponents,
	type VolumeComponentId,
} from "@/lib/struct/analytics-shared";

export function VolumeComponentsToggle({
	components,
	onChange,
	label = "Include in volume",
	buttonSize = "icon-xs",
	buttonClassName = "-mr-1 -mt-1 self-start text-muted-foreground hover:text-foreground",
}: {
	components: readonly VolumeComponentId[];
	onChange: (next: readonly VolumeComponentId[]) => void;
	label?: string;
	buttonSize?: "icon-xs" | "icon-sm";
	buttonClassName?: string;
}) {
	const selected = new Set(components);
	const isDefault = isDefaultVolumeComponents(components);

	function toggle(id: VolumeComponentId, pressed: boolean) {
		const nextSet = new Set(selected);
		if (pressed) {
			nextSet.add(id);
		} else {
			if (selected.size <= 1) return;
			nextSet.delete(id);
		}
		onChange(VOLUME_COMPONENT_IDS.filter((i) => nextSet.has(i)));
	}

	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button
						variant="ghost"
						size={buttonSize}
						aria-label="Configure volume components"
						className={buttonClassName}
					>
						<Settings2Icon />
					</Button>
				}
			/>
			<PopoverContent align="end" className="w-56 p-2">
				<div className="flex flex-col">
					<div className="px-2 pb-1 pt-0.5 text-xs text-muted-foreground">{label}</div>
					{VOLUME_COMPONENT_IDS.map((id) => (
						<label
							key={id}
							className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
						>
							<Checkbox
								checked={selected.has(id)}
								onCheckedChange={(val) => toggle(id, !!val)}
							/>
							{VOLUME_COMPONENT_LABELS[id]}
						</label>
					))}
					<button
						type="button"
						onClick={() => onChange(DEFAULT_VOLUME_COMPONENTS)}
						disabled={isDefault}
						className="mt-1 rounded-sm px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
					>
						Reset to all
					</button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
