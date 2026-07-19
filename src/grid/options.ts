import type { CrochetWeaverSettings } from '../settings-data';
import type { GridConfig, GridShape, ResolvedGridOptions } from '../types';

export function resolveGridOptions(
	config: GridConfig,
	settings: CrochetWeaverSettings,
): ResolvedGridOptions {
	const shape = config.shape?.toLowerCase();
	return {
		shape: isGridShape(shape) ? shape : settings.gridDefaultShape,
		rounds: positiveInt(config.rounds) ?? settings.gridDefaultRounds,
		columns: positiveInt(config.columns) ?? settings.gridDefaultColumns,
		rows: positiveInt(config.rows) ?? settings.gridDefaultRows,
		scale: positiveFloat(config.scale) ?? settings.scale,
		strokeWidth: positiveFloat(config.stroke) ?? settings.strokeWidth,
		ringSpacing: positiveFloat(config.spacing) ?? settings.ringSpacing,
	};
}

function isGridShape(value: string | undefined): value is GridShape {
	return value === 'polar' || value === 'rect';
}

function positiveInt(value: string | undefined): number | undefined {
	if (value === undefined) return undefined;
	const numberValue = Number(value);
	return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function positiveFloat(value: string | undefined): number | undefined {
	if (value === undefined) return undefined;
	const numberValue = Number(value);
	return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}
