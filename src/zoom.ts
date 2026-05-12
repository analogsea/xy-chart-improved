import { defaultZoomOptions, XYZoomOptions } from './options';

export interface ZoomRange {
  from: number;
  to: number;
}

export function getSharedXRangeQuery(range: ZoomRange, options?: XYZoomOptions): Record<string, string> | null {
  const normalized = getNormalizedZoomRange(range);
  const minKey = getVariableQueryKey(options?.xMinVariable ?? defaultZoomOptions.xMinVariable);
  const maxKey = getVariableQueryKey(options?.xMaxVariable ?? defaultZoomOptions.xMaxVariable);

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

export function getVariableQueryKey(name: string): string | null {
  const trimmed = name.trim();

  if (trimmed === '') {
    return null;
  }

  return trimmed.startsWith('var-') ? trimmed : `var-${trimmed}`;
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
