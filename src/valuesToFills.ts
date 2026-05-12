export const valuesToFills = (values: number[], palette: string[], minValue: number, maxValue: number): number[] => {
  const range = maxValue - minValue || 1;
  const paletteSize = palette.length;
  const indexedFills = Array(values.length);

  for (let i = 0; i < values.length; i++) {
    indexedFills[i] =
      values[i] < minValue
        ? 0
        : values[i] > maxValue
          ? paletteSize - 1
          : Math.min(paletteSize - 1, Math.floor((paletteSize * (values[i] - minValue)) / range));
  }

  return indexedFills;
};
