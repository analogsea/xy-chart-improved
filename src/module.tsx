import { PanelPlugin } from '@grafana/data';
import { t } from '@grafana/i18n';
import { SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { commonOptionsBuilder } from '@grafana/ui';

import { SeriesEditor } from './SeriesEditor';
import { XYChartPanel2 } from './XYChartPanel';
import { getScatterFieldConfig } from './config';
import { xyChartMigrationHandler } from './migrations';
import { defaultZoomOptions, Options, XYZoomMode } from './options';
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
        path: 'zoom.xMinVariable',
        name: t('xychart.name-x-min-variable', 'X min variable'),
        description: t(
          'xychart.description-x-min-variable',
          'Dashboard variable updated when X-axis zoom selects a lower bound.'
        ),
        category: zoomCategory,
        defaultValue: defaultZoomOptions.xMinVariable,
        showIf: (options) => options.zoom?.mode === XYZoomMode.X,
      })
      .addTextInput({
        path: 'zoom.xMaxVariable',
        name: t('xychart.name-x-max-variable', 'X max variable'),
        description: t(
          'xychart.description-x-max-variable',
          'Dashboard variable updated when X-axis zoom selects an upper bound.'
        ),
        category: zoomCategory,
        defaultValue: defaultZoomOptions.xMaxVariable,
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
