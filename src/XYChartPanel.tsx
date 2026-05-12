import { css } from '@emotion/css';
import React, { useCallback, useMemo } from 'react';

import { colorManipulator, FALLBACK_COLOR, Field, FieldType, LinkModel, PanelProps } from '@grafana/data';
import { config, locationService } from '@grafana/runtime';
import {
  TooltipDisplayMode,
  TooltipPlugin2,
  UPlotChart,
  VizLayout,
  VizLegend,
  VizLegendItem,
  useStyles2,
  useTheme2,
} from '@grafana/ui';

import { getDisplayValuesForCalcs } from './compat/displayCalcs';
import { TooltipHoverMode } from './compat/uPlotTooltip';
import { defaultZoomOptions, Options, XYZoomMode } from './options';
import { XYChartTooltip } from './XYChartTooltip';
import { prepConfig } from './scatter';
import { prepSeries } from './utils';
import { getSharedXRangeQuery, getTimeRange } from './zoom';

type Props2 = PanelProps<Options>;

export const XYChartPanel2 = (props: Props2) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  let { mapping, series: mappedSeries } = props.options;
  const { onChangeTimeRange } = props;
  const zoom = props.options.zoom ?? defaultZoomOptions;
  const zoomMode = zoom.mode ?? defaultZoomOptions.mode;
  const tooltipMode = props.options.tooltip.mode;
  const tooltipEnabled = tooltipMode !== TooltipDisplayMode.None;

  // regenerate series schema when mappings or data changes
  let series = useMemo(
    () => prepSeries(mapping, mappedSeries, props.data.series, props.fieldConfig),
    [mapping, mappedSeries, props.data.series, props.fieldConfig]
  );

  // if series changed due to mappings or data structure, re-init config & renderers
  let { builder, prepData } = useMemo(
    () => prepConfig(series, config.theme2, tooltipMode, zoomMode),
    [series, tooltipMode, zoomMode]
  );

  // generate data struct for uPlot mode: 2
  let data = useMemo(
    () => prepData(series),
    [prepData, series]
  );
  const isTimeXAxis = series[0]?.x.field.type === FieldType.time;

  // todo: handle errors
  let error = builder == null || data.length === 0 ? 'Err' : '';

  const onXRangeZoom = useCallback(
    (range: { from: number; to: number }) => {
      if (isTimeXAxis) {
        const timeRange = getTimeRange(range);

        if (timeRange != null) {
          onChangeTimeRange(timeRange);
        }

        return;
      }

      const query = getSharedXRangeQuery(range, zoom);

      if (query != null) {
        locationService.partial(query);
      }
    },
    [isTimeXAxis, onChangeTimeRange, zoom]
  );

  // TODO: React.memo()
  const renderLegend = () => {
    if (!props.options.legend.showLegend) {
      return null;
    }

    const items: VizLegendItem[] = [];

    series.forEach((s, idx) => {
      let yField = s.y.field;
      let config = yField.config;
      let custom = config.custom;

      if (!custom.hideFrom?.legend) {
        items.push({
          yAxis: 1, // TODO: pull from y field
          label: s.name.value,
          color: colorManipulator.alpha(s.color.fixed ?? FALLBACK_COLOR, 1),
          getItemKey: () => `${idx}-${s.name.value}`,
          fieldName: yField.state?.displayName ?? yField.name,
          disabled: yField.state?.hideFrom?.viz ?? false,
          getDisplayValues: () => getDisplayValuesForCalcs(props.options.legend.calcs, yField, theme),
        });
      }
    });

    const { placement, displayMode, width, sortBy, sortDesc } = props.options.legend;

    return (
      <VizLayout.Legend placement={placement} width={width}>
        <VizLegend
          className={styles.legend}
          placement={placement}
          items={items}
          displayMode={displayMode}
          sortBy={sortBy}
          sortDesc={sortDesc}
          isSortable={true}
        />
      </VizLayout.Legend>
    );
  };

  if (error) {
    return (
      <div className="panel-empty">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <VizLayout width={props.width} height={props.height} legend={renderLegend()}>
      {(vizWidth: number, vizHeight: number) => (
        <UPlotChart config={builder!} data={data} width={vizWidth} height={vizHeight}>
          {(tooltipEnabled || zoomMode === XYZoomMode.X) && (
            <TooltipPlugin2
              config={builder!}
              hoverMode={
                (tooltipMode === TooltipDisplayMode.Multi
                  ? TooltipHoverMode.xAll
                  : TooltipHoverMode.xyOne) as unknown as React.ComponentProps<typeof TooltipPlugin2>['hoverMode']
              }
              queryZoom={zoomMode === XYZoomMode.X ? onXRangeZoom : undefined}
              getDataLinks={(seriesIdx, dataIdx) => {
                const xySeries = series[seriesIdx - 1];
                return getDataLinks(xySeries.y.field, dataIdx);
              }}
              render={(u, dataIdxs, seriesIdx, isPinned, dismiss, timeRange2, viaSync, dataLinks) => {
                if (!tooltipEnabled) {
                  return null;
                }

                return (
                  <XYChartTooltip
                    dataIdxs={dataIdxs}
                    xySeries={series}
                    isPinned={isPinned}
                    seriesIdx={seriesIdx!}
                    dataLinks={dataLinks}
                    mode={tooltipMode}
                    sortOrder={props.options.tooltip.sort}
                    hideZeros={props.options.tooltip.hideZeros}
                    maxHeight={props.options.tooltip.maxHeight}
                  />
                );
              }}
              maxWidth={props.options.tooltip.maxWidth}
            />
          )}
        </UPlotChart>
      )}
    </VizLayout>
  );
};

const getStyles = () => ({
  legend: css({
    div: {
      justifyContent: 'flex-start',
    },
  }),
});

function getDataLinks(field: Field, rowIndex: number | null | undefined): Array<LinkModel<Field>> {
  if (rowIndex == null) {
    return [];
  }

  return field.getLinks?.({ valueRowIndex: rowIndex }) ?? [];
}
