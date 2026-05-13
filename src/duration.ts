export interface DurationFormatOptions {
  rangeSeconds?: number;
}

export function formatDurationSeconds(value: number, options: DurationFormatOptions = {}): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  const sign = value < 0 ? '-' : '';
  const absValue = Math.abs(value);
  const rangeSeconds = Math.abs(options.rangeSeconds ?? absValue);

  if (rangeSeconds < 10 && !Number.isInteger(absValue)) {
    return `${sign}${trimTrailingZero(absValue.toFixed(1))}s`;
  }

  const totalSeconds = Math.round(absValue);

  if (rangeSeconds < 60) {
    return `${sign}${totalSeconds}s`;
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (rangeSeconds >= 86400) {
    return formatDurationParts(sign, [
      [days, 'd'],
      [hours, 'h'],
    ]);
  }

  if (rangeSeconds >= 3600) {
    return formatDurationParts(sign, [
      [hours, 'h'],
      [minutes, 'm'],
    ]);
  }

  return formatDurationParts(sign, [
    [minutes, 'm'],
    [seconds, 's'],
  ]);
}

function formatDurationParts(sign: string, parts: Array<[number, string]>): string {
  const nonZeroParts = parts.filter(([value]) => value !== 0);

  if (nonZeroParts.length === 0) {
    return '0s';
  }

  return `${sign}${nonZeroParts.map(([value, unit]) => `${value}${unit}`).join(' ')}`;
}

function trimTrailingZero(value: string): string {
  return value.replace(/\.0$/, '');
}
