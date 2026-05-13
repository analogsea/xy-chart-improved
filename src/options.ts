import { Options as BaseOptions } from './panelcfg.gen';

export enum XYZoomMode {
  Box = 'box',
  X = 'x',
}

export enum XYXAxisMode {
  Step = 'step',
  RelativeTime = 'relative_time',
}

export enum XYRelativeTimeUnit {
  ElapsedSeconds = 'elapsed_seconds',
}

export interface XYZoomOptions {
  mode?: XYZoomMode;
  xModeVariable?: string;
  stepXMinVariable?: string;
  stepXMaxVariable?: string;
  relativeTimeXMinVariable?: string;
  relativeTimeXMaxVariable?: string;
  relativeTimeUnit?: XYRelativeTimeUnit;
  xMinVariable?: string;
  xMaxVariable?: string;
}

export interface Options extends BaseOptions {
  zoom?: XYZoomOptions;
}

export const defaultZoomOptions: Required<XYZoomOptions> = {
  mode: XYZoomMode.Box,
  xModeVariable: 'x_axis',
  stepXMinVariable: 'step_min',
  stepXMaxVariable: 'step_max',
  relativeTimeXMinVariable: 'rel_time_min',
  relativeTimeXMaxVariable: 'rel_time_max',
  relativeTimeUnit: XYRelativeTimeUnit.ElapsedSeconds,
  xMinVariable: 'x_min',
  xMaxVariable: 'x_max',
};
