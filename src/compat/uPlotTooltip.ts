export enum TooltipHoverMode {
  xOne = 0,
  xAll = 1,
  xyOne = 2,
}

export type FacetSeries = [number[], number[], number[], string[]];
export type FacetedData = [null, ...FacetSeries[]];
