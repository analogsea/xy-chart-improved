import { css } from '@emotion/css';
import React, { useCallback, useMemo } from 'react';

import { colorManipulator, FALLBACK_COLOR, Field, FieldType, GrafanaTheme2, LinkModel, PanelProps } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config, locationService } from '@grafana/runtime';
import {
  IconButton,
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
import { getSharedXRangeQuery, getSharedXRangeResetQuery, getTimeRange, getXAxisModeForPanel } from './zoom';

type Props2 = PanelProps<Options>;

export const XYChartPanel2 = (props: Props2) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  let { mapping, series: mappedSeries } = props.options;
  const { onChangeTimeRange } = props;
  const zoom = props.options.zoom;
  const zoomMode = zoom?.mode ?? defaultZoomOptions.mode;
  const xAxisMode = getXAxisModeForPanel(props.replaceVariables, zoom);
  const relativeTimeUnit = zoom?.relativeTimeUnit ?? defaultZoomOptions.relativeTimeUnit;
  const tooltipMode = props.options.tooltip.mode;
  const tooltipEnabled = tooltipMode !== TooltipDisplayMode.None;

  // regenerate series schema when mappings or data changes
  let series = useMemo(
    () => prepSeries(mapping, mappedSeries, props.data.series, props.fieldConfig),
    [mapping, mappedSeries, props.data.series, props.fieldConfig]
  );

  // if series changed due to mappings or data structure, re-init config & renderers
  let { builder, prepData } = useMemo(
    () => prepConfig(series, config.theme2, tooltipMode, zoomMode, { mode: xAxisMode, relativeTimeUnit }),
    [series, tooltipMode, zoomMode, xAxisMode, relativeTimeUnit]
  );

  // generate data struct for uPlot mode: 2
  let data = useMemo(
    () => prepData(series),
    [prepData, series]
  );
  const isTimeXAxis = series[0]?.x.field.type === FieldType.time;
  const resetZoomQuery = useMemo(() => getSharedXRangeResetQuery(zoom), [zoom]);
  const showXRangeResetButton = zoomMode === XYZoomMode.X && !isTimeXAxis && resetZoomQuery != null;

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

      const query = getSharedXRangeQuery(range, zoom, xAxisMode);

      if (query != null) {
        locationService.partial(query);
      }
    },
    [isTimeXAxis, onChangeTimeRange, zoom, xAxisMode]
  );

  const onResetXRangeZoom = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      if (resetZoomQuery != null) {
        locationService.partial(resetZoomQuery);
      }
    },
    [resetZoomQuery]
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
        <div className={styles.chart} style={{ width: vizWidth, height: vizHeight }}>
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
                      xAxisMode={xAxisMode}
                      relativeTimeUnit={relativeTimeUnit}
                    />
                  );
                }}
                maxWidth={props.options.tooltip.maxWidth}
              />
            )}
          </UPlotChart>
          {showXRangeResetButton && (
            <IconButton
              className={styles.resetZoomButton}
              name="sync"
              onClick={onResetXRangeZoom}
              tooltip={t('xychart.zoom-reset.tooltip', 'Reset X-axis zoom')}
              tooltipPlacement="left"
              variant="secondary"
            />
          )}
        </div>
      )}
    </VizLayout>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  chart: css({
    height: '100%',
    position: 'relative',
    width: '100%',
  }),
  legend: css({
    div: {
      justifyContent: 'flex-start',
    },
  }),
  resetZoomButton: css({
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    position: 'absolute',
    right: theme.spacing(0.5),
    top: theme.spacing(0.5),
    zIndex: 1,
  }),
});

function getDataLinks(field: Field, rowIndex: number | null | undefined): Array<LinkModel<Field>> {
  if (rowIndex == null) {
    return [];
  }

  return field.getLinks?.({ valueRowIndex: rowIndex }) ?? [];
}
