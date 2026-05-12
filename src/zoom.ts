import { defaultZoomOptions, XYZoomOptions } from './options';

interface ZoomRange {
  from: number;
  to: number;
}

export function getSharedXRangeQuery(range: ZoomRange, options?: XYZoomOptions): Record<string, string> | null {
  const minKey = getVariableQueryKey(options?.xMinVariable ?? defaultZoomOptions.xMinVariable);
  const maxKey = getVariableQueryKey(options?.xMaxVariable ?? defaultZoomOptions.xMaxVariable);

  if (minKey == null || maxKey == null || !Number.isFinite(range.from) || !Number.isFinite(range.to)) {
    return null;
  }

  const from = Math.min(range.from, range.to);
  const to = Math.max(range.from, range.to);

  return {
    [minKey]: formatRangeValue(from),
    [maxKey]: formatRangeValue(to),
  };
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
