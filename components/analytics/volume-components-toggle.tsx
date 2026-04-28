"use client";

import { Settings2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	VOLUME_COMPONENT_IDS,
	VOLUME_COMPONENT_LABELS,
	isDefaultVolumeComponents,
	type VolumeComponentId,
} from "@/lib/struct/analytics-shared";

export function VolumeComponentsToggle({
	components,
	onChange,
	allowedComponents = VOLUME_COMPONENT_IDS,
	label = "Include in volume",
	buttonSize = "icon-xs",
	buttonClassName = "-mr-1 -mt-1 self-start text-muted-foreground hover:text-foreground",
}: {
	components: readonly VolumeComponentId[];
	onChange: (next: readonly VolumeComponentId[]) => void;
	allowedComponents?: readonly VolumeComponentId[];
	label?: string;
	buttonSize?: "icon-xs" | "icon-sm";
	buttonClassName?: string;
}) {
	const allowed = VOLUME_COMPONENT_IDS.filter((id) => allowedComponents.includes(id));
	const selected = new Set(components);
	const visibleSelected = new Set(allowed.filter((id) => selected.has(id)));
	const isDefault =
		allowed.length === VOLUME_COMPONENT_IDS.length
			? isDefaultVolumeComponents(components)
			: visibleSelected.size === allowed.length;

	function toggle(id: VolumeComponentId, pressed: boolean) {
		const nextSet = new Set(allowed.filter((component) => selected.has(component)));
		if (pressed) {
			nextSet.add(id);
		} else {
			if (nextSet.size <= 1) return;
			nextSet.delete(id);
		}
		onChange(allowed.filter((i) => nextSet.has(i)));
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
					{allowed.map((id) => (
						<label
							key={id}
							className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
						>
							<Checkbox
								checked={visibleSelected.has(id)}
								onCheckedChange={(val) => toggle(id, !!val)}
							/>
							{VOLUME_COMPONENT_LABELS[id]}
						</label>
					))}
					<button
						type="button"
						onClick={() => onChange(allowed)}
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
