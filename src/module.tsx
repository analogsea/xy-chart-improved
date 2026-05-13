import { PanelPlugin } from '@grafana/data';
import { t } from '@grafana/i18n';
import { SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { commonOptionsBuilder } from '@grafana/ui';

import { SeriesEditor } from './SeriesEditor';
import { XYChartPanel2 } from './XYChartPanel';
import { getScatterFieldConfig } from './config';
import { xyChartMigrationHandler } from './migrations';
import { defaultZoomOptions, Options, XYRelativeTimeUnit, XYZoomMode } from './options';
import { FieldConfig, defaultFieldConfig } from './panelcfg.gen';
import { xychartSuggestionsSupplier } from './suggestions';

export const plugin = new PanelPlugin<Options, FieldConfig>(XYChartPanel2)
  // .setPanelChangeHandler(xyChartChangeHandler)
  .setMigrationHandler(xyChartMigrationHandler)
  .useFieldConfig(getScatterFieldConfig(defaultFieldConfig))
  .setPanelOptions((builder) => {
    const category = [t('xychart.category-xychart', 'XY Chart')];
    const zoomCategory = [t('xychart.category-zoom', 'Zoom')];
    builder
      .addRadio({
        path: 'mapping',
        name: t('xychart.name-series-mapping', 'Series mapping'),
        category,
        defaultValue: 'auto',
        settings: {
          options: [
            { value: 'auto', label: t('xychart.series-mapping-options.label-auto', 'Auto') },
            { value: 'manual', label: t('xychart.series-mapping-options.label-manual', 'Manual') },
          ],
        },
      })
      .addCustomEditor({
        id: 'series',
        path: 'series',
        name: '',
        category,
        editor: SeriesEditor,
        defaultValue: [{}],
      });

    builder
      .addRadio({
        path: 'zoom.mode',
        name: t('xychart.name-zoom-mode', 'Zoom mode'),
        category: zoomCategory,
        defaultValue: defaultZoomOptions.mode,
        settings: {
          options: [
            { value: XYZoomMode.Box, label: t('xychart.zoom-mode-options.label-box', 'Box') },
            { value: XYZoomMode.X, label: t('xychart.zoom-mode-options.label-x-axis', 'X-axis') },
          ],
        },
      })
      .addTextInput({
        path: 'zoom.xModeVariable',
        name: t('xychart.name-x-mode-variable', 'X mode variable'),
        description: t(
          'xychart.description-x-mode-variable',
          'Dashboard variable that selects whether X values are steps or elapsed relative time.'
        ),
        category: zoomCategory,
        defaultValue: defaultZoomOptions.xModeVariable,
        showIf: (options) => options.zoom?.mode === XYZoomMode.X,
      })
      .addTextInput({
        path: 'zoom.stepXMinVariable',
        name: t('xychart.name-step-x-min-variable', 'Step min variable'),
        description: t(
          'xychart.description-step-x-min-variable',
          'Dashboard variable updated when X-axis zoom selects a lower step bound.'
        ),
        category: zoomCategory,
        defaultValue: defaultZoomOptions.stepXMinVariable,
        showIf: (options) => options.zoom?.mode === XYZoomMode.X,
      })
      .addTextInput({
        path: 'zoom.stepXMaxVariable',
        name: t('xychart.name-step-x-max-variable', 'Step max variable'),
        description: t(
          'xychart.description-step-x-max-variable',
          'Dashboard variable updated when X-axis zoom selects an upper step bound.'
        ),
        category: zoomCategory,
        defaultValue: defaultZoomOptions.stepXMaxVariable,
        showIf: (options) => options.zoom?.mode === XYZoomMode.X,
      })
      .addTextInput({
        path: 'zoom.relativeTimeXMinVariable',
        name: t('xychart.name-relative-time-x-min-variable', 'Relative time min variable'),
        description: t(
          'xychart.description-relative-time-x-min-variable',
          'Dashboard variable updated when X-axis zoom selects a lower elapsed-time bound.'
        ),
        category: zoomCategory,
        defaultValue: defaultZoomOptions.relativeTimeXMinVariable,
        showIf: (options) => options.zoom?.mode === XYZoomMode.X,
      })
      .addTextInput({
        path: 'zoom.relativeTimeXMaxVariable',
        name: t('xychart.name-relative-time-x-max-variable', 'Relative time max variable'),
        description: t(
          'xychart.description-relative-time-x-max-variable',
          'Dashboard variable updated when X-axis zoom selects an upper elapsed-time bound.'
        ),
        category: zoomCategory,
        defaultValue: defaultZoomOptions.relativeTimeXMaxVariable,
        showIf: (options) => options.zoom?.mode === XYZoomMode.X,
      })
      .addRadio({
        path: 'zoom.relativeTimeUnit',
        name: t('xychart.name-relative-time-unit', 'Relative time unit'),
        category: zoomCategory,
        defaultValue: defaultZoomOptions.relativeTimeUnit,
        settings: {
          options: [
            {
              value: XYRelativeTimeUnit.ElapsedSeconds,
              label: t('xychart.relative-time-unit-options.label-elapsed-seconds', 'Elapsed seconds'),
            },
          ],
        },
        showIf: (options) => options.zoom?.mode === XYZoomMode.X,
      });

    commonOptionsBuilder.addTooltipOptions(builder, false, false, {
      tooltip: {
        mode: TooltipDisplayMode.Single,
        sort: SortOrder.None,
        hideZeros: false,
      },
    });
    commonOptionsBuilder.addLegendOptions(builder);
  })
  .setSuggestionsSupplier(xychartSuggestionsSupplier);
