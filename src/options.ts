import { Options as BaseOptions } from './panelcfg.gen';

export enum XYZoomMode {
  Box = 'box',
  X = 'x',
}

export interface XYZoomOptions {
  mode?: XYZoomMode;
  xMinVariable?: string;
  xMaxVariable?: string;
}

export interface Options extends BaseOptions {
  zoom?: XYZoomOptions;
}

export const defaultZoomOptions: Required<XYZoomOptions> = {
  mode: XYZoomMode.Box,
  xMinVariable: 'x_min',
  xMaxVariable: 'x_max',
};
