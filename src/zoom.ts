import { defaultZoomOptions, XYXAxisMode, XYZoomOptions } from './options';

export interface ZoomRange {
  from: number;
  to: number;
}

export type ReplaceVariables = (value: string) => string;

export function getSharedXRangeQuery(
  range: ZoomRange,
  options?: XYZoomOptions,
  xAxisMode = XYXAxisMode.Step
): Record<string, string> | null {
  const normalized = getNormalizedZoomRange(range);
  const { min, max } = getXRangeVariableNames(options, xAxisMode);
  const minKey = getVariableQueryKey(min);
  const maxKey = getVariableQueryKey(max);

  if (normalized == null || minKey == null || maxKey == null) {
    return null;
  }

  return {
    [minKey]: formatRangeValue(normalized.from),
    [maxKey]: formatRangeValue(normalized.to),
  };
}

export function getTimeRange(range: ZoomRange): ZoomRange | null {
  return getNormalizedZoomRange(range);
}

export function getXAxisModeForPanel(replaceVariables: ReplaceVariables, options?: XYZoomOptions): XYXAxisMode {
  const variableName = getVariableInterpolationName(options?.xModeVariable ?? defaultZoomOptions.xModeVariable);

  if (variableName == null) {
    return XYXAxisMode.Step;
  }

  return getXAxisModeFromValue(replaceVariables(`\${${variableName}:raw}`));
}

export function getXAxisModeFromValue(value: string | null | undefined): XYXAxisMode {
  return value?.trim().toLowerCase() === XYXAxisMode.RelativeTime ? XYXAxisMode.RelativeTime : XYXAxisMode.Step;
}

export function getVariableQueryKey(name: string): string | null {
  const trimmed = name.trim();

  if (trimmed === '') {
    return null;
  }

  return trimmed.startsWith('var-') ? trimmed : `var-${trimmed}`;
}

function getXRangeVariableNames(
  options: XYZoomOptions | undefined,
  xAxisMode: XYXAxisMode
): { min: string; max: string } {
  if (xAxisMode === XYXAxisMode.RelativeTime) {
    return {
      min: options?.relativeTimeXMinVariable ?? defaultZoomOptions.relativeTimeXMinVariable,
      max: options?.relativeTimeXMaxVariable ?? defaultZoomOptions.relativeTimeXMaxVariable,
    };
  }

  if (options?.stepXMinVariable != null || options?.stepXMaxVariable != null) {
    return {
      min: options.stepXMinVariable ?? defaultZoomOptions.stepXMinVariable,
      max: options.stepXMaxVariable ?? defaultZoomOptions.stepXMaxVariable,
    };
  }

  if (options?.xMinVariable != null || options?.xMaxVariable != null) {
    return {
      min: options.xMinVariable ?? defaultZoomOptions.xMinVariable,
      max: options.xMaxVariable ?? defaultZoomOptions.xMaxVariable,
    };
  }

  return {
    min: defaultZoomOptions.stepXMinVariable,
    max: defaultZoomOptions.stepXMaxVariable,
  };
}

function getVariableInterpolationName(name: string): string | null {
  const trimmed = name.trim();

  if (trimmed === '') {
    return null;
  }

  return trimmed.startsWith('var-') ? trimmed.slice(4) : trimmed;
}

function formatRangeValue(value: number): string {
  return Number(value.toPrecision(15)).toString();
}

function getNormalizedZoomRange(range: ZoomRange): ZoomRange | null {
  if (!Number.isFinite(range.from) || !Number.isFinite(range.to)) {
    return null;
  }

  return {
    from: Math.min(range.from, range.to),
    to: Math.max(range.from, range.to),
  };
}
