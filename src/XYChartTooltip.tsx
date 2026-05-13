import { css } from '@emotion/css';
import React, { ReactNode } from 'react';

import { colorManipulator, Field, FieldType, GrafanaTheme2, LinkModel } from '@grafana/data';
import { SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { DataLinkButton, SeriesTable, SeriesTableRowProps, useStyles2 } from '@grafana/ui';

import { formatDurationSeconds } from './duration';
import { defaultZoomOptions, XYRelativeTimeUnit, XYXAxisMode } from './options';
import { XYSeries } from './types2';
import { fmt } from './utils';

export interface Props {
  dataIdxs: Array<number | null>;
  seriesIdx: number | null | undefined;
  isPinned: boolean;
  xySeries: XYSeries[];
  dataLinks: Array<LinkModel<Field>>;
  mode?: TooltipDisplayMode;
  sortOrder?: SortOrder;
  hideZeros?: boolean;
  maxHeight?: number;
  xAxisMode?: XYXAxisMode;
  relativeTimeUnit?: XYRelativeTimeUnit;
}

interface MultiRow extends SeriesTableRowProps {
  numeric?: number;
}

function stripSeriesName(fieldName: string, seriesName: string) {
  if (fieldName !== seriesName && fieldName.includes(' ')) {
    fieldName = fieldName.replace(seriesName, '').trim();
  }

  return fieldName;
}

function hideFromTooltip(field: Field) {
  return field.config.custom?.hideFrom?.tooltip ?? false;
}

function getFieldName(field: Field) {
  return field.state?.displayName ?? field.name;
}

export const XYChartTooltip = ({
  dataIdxs,
  seriesIdx,
  xySeries,
  dataLinks,
  isPinned,
  mode,
  sortOrder,
  hideZeros,
  maxHeight,
  xAxisMode = XYXAxisMode.Step,
  relativeTimeUnit = defaultZoomOptions.relativeTimeUnit,
}: Props) => {
  const styles = useStyles2(getStyles);

  if (mode === TooltipDisplayMode.Multi) {
    return (
      <TooltipFrame footer={renderFooter(dataLinks, isPinned, styles)}>
        <div className={styles.content} style={maxHeight != null ? { maxHeight } : undefined}>
          <SeriesTable
            timestamp={getMultiHeader(dataIdxs, xySeries, xAxisMode, relativeTimeUnit)}
            series={getMultiRows(dataIdxs, xySeries, seriesIdx, sortOrder, hideZeros)}
          />
        </div>
      </TooltipFrame>
    );
  }

  const activeSeriesIdx = getActiveSeriesIdx(dataIdxs, seriesIdx);

  if (activeSeriesIdx == null) {
    return null;
  }

  const rowIndex = dataIdxs[activeSeriesIdx];
  const series = xySeries[activeSeriesIdx - 1];

  if (rowIndex == null || series == null) {
    return null;
  }

  const label = series.name.value;
  const seriesColor = getSeriesColor(series, rowIndex);
  const contentItems = getSingleRows(series, rowIndex, xAxisMode, relativeTimeUnit);

  return (
    <TooltipFrame footer={renderFooter(dataLinks, isPinned, styles)}>
      <div className={styles.header}>
        <span className={styles.marker} style={{ background: seriesColor }} />
        <span>{label}</span>
      </div>
      <div className={styles.content} style={maxHeight != null ? { maxHeight } : undefined}>
        <div className={styles.table}>
          {contentItems.map((item, index) => (
            <React.Fragment key={`${item.label}-${index}`}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.value}>{item.value}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </TooltipFrame>
  );
};

interface TooltipFrameProps {
  children: ReactNode;
  footer?: ReactNode;
}

const TooltipFrame = ({ children, footer }: TooltipFrameProps) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.wrapper}>
      {children}
      {footer}
    </div>
  );
};

function getActiveSeriesIdx(dataIdxs: Array<number | null>, seriesIdx: number | null | undefined) {
  if (seriesIdx != null && dataIdxs[seriesIdx] != null) {
    return seriesIdx;
  }

  const firstIdx = dataIdxs.findIndex((idx, idxSeries) => idxSeries > 0 && idx != null);

  return firstIdx > 0 ? firstIdx : null;
}

function getSingleRows(
  series: XYSeries,
  rowIndex: number,
  xAxisMode: XYXAxisMode,
  relativeTimeUnit: XYRelativeTimeUnit
) {
  const xField = series.x.field;
  const yField = series.y.field;
  const sizeField = series.size.field;
  const colorField = series.color.field;
  const label = series.name.value;
  const contentItems: Array<{ label: string; value: string }> = [];
  const addedFields = new Set<Field>();

  if (!hideFromTooltip(xField)) {
    contentItems.push({
      label: stripSeriesName(getFieldName(xField), label),
      value: formatXValue(xField, xField.values[rowIndex], xAxisMode, relativeTimeUnit),
    });
    addedFields.add(xField);
  }

  if (!hideFromTooltip(yField)) {
    contentItems.push({
      label: stripSeriesName(getFieldName(yField), label),
      value: fmt(yField, yField.values[rowIndex]),
    });
    addedFields.add(yField);
  }

  if (sizeField != null && !addedFields.has(sizeField) && !hideFromTooltip(sizeField)) {
    contentItems.push({
      label: stripSeriesName(getFieldName(sizeField), label),
      value: fmt(sizeField, sizeField.values[rowIndex]),
    });
    addedFields.add(sizeField);
  }

  if (colorField != null && !addedFields.has(colorField) && !hideFromTooltip(colorField)) {
    contentItems.push({
      label: stripSeriesName(getFieldName(colorField), label),
      value: fmt(colorField, colorField.values[rowIndex]),
    });
    addedFields.add(colorField);
  }

  series._rest.forEach((field) => {
    if (!hideFromTooltip(field)) {
      contentItems.push({
        label: stripSeriesName(field.state?.displayName ?? field.name, label),
        value: fmt(field, field.values[rowIndex]),
      });
    }
  });

  return contentItems;
}

function getMultiHeader(
  dataIdxs: Array<number | null>,
  xySeries: XYSeries[],
  xAxisMode: XYXAxisMode,
  relativeTimeUnit: XYRelativeTimeUnit
): string | undefined {
  for (let i = 0; i < xySeries.length; i++) {
    const rowIndex = dataIdxs[i + 1];

    if (rowIndex != null) {
      const xField = xySeries[i].x.field;
      return formatXValue(xField, xField.values[rowIndex], xAxisMode, relativeTimeUnit);
    }
  }

  return undefined;
}

function formatXValue(
  field: Field,
  value: unknown,
  xAxisMode: XYXAxisMode,
  relativeTimeUnit: XYRelativeTimeUnit
): string {
  const numeric = typeof value === 'number' ? value : Number(value);

  if (
    field.type === FieldType.number &&
    xAxisMode === XYXAxisMode.RelativeTime &&
    relativeTimeUnit === XYRelativeTimeUnit.ElapsedSeconds &&
    Number.isFinite(numeric)
  ) {
    return formatDurationSeconds(numeric);
  }

  return fmt(field, value);
}

function getMultiRows(
  dataIdxs: Array<number | null>,
  xySeries: XYSeries[],
  seriesIdx: number | null | undefined,
  sortOrder?: SortOrder,
  hideZeros?: boolean
): MultiRow[] {
  const rows: MultiRow[] = [];

  xySeries.forEach((series, index) => {
    const rowIndex = dataIdxs[index + 1];
    const yField = series.y.field;

    if (rowIndex == null || hideFromTooltip(yField)) {
      return;
    }

    const value = yField.values[rowIndex];
    const numeric = getNumericValue(value);

    if (hideZeros && numeric === 0) {
      return;
    }

    rows.push({
      label: series.name.value,
      value: fmt(yField, value),
      color: getSeriesColor(series, rowIndex),
      isActive: seriesIdx === index + 1,
      numeric,
    });
  });

  return sortRows(rows, sortOrder);
}

function getNumericValue(value: unknown): number | undefined {
  const numeric = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(numeric) ? numeric : undefined;
}

function sortRows(rows: MultiRow[], sortOrder?: SortOrder): MultiRow[] {
  if (sortOrder == null || sortOrder === SortOrder.None) {
    return rows;
  }

  return [...rows].sort((a, b) => {
    if (a.numeric == null && b.numeric == null) {
      return 0;
    }

    if (a.numeric == null) {
      return 1;
    }

    if (b.numeric == null) {
      return -1;
    }

    const delta = a.numeric - b.numeric;

    return sortOrder === SortOrder.Ascending ? delta : -delta;
  });
}

function getSeriesColor(series: XYSeries, rowIndex: number) {
  const colorField = series.color.field;
  let seriesColor = colorField?.display?.(colorField.values[rowIndex]).color ?? series.color.fixed ?? '#fff';
  const fillOpacity = colorField?.config.custom?.fillOpacity;

  if (fillOpacity != null) {
    seriesColor = colorManipulator.alpha(seriesColor, fillOpacity / 100);
  }

  return seriesColor;
}

function renderFooter(dataLinks: Array<LinkModel<Field>>, isPinned: boolean, styles: ReturnType<typeof getStyles>) {
  const oneClickLink = dataLinks?.find((dataLink) => dataLink.oneClick === true);

  if (dataLinks.length === 0 || (!isPinned && oneClickLink == null)) {
    return null;
  }

  if (oneClickLink != null) {
    return <div className={styles.footer}>Click to open {oneClickLink.title}</div>;
  }

  return (
    <div className={styles.footer}>
      {dataLinks.map((link, index) => (
        <DataLinkButton key={`${link.href}-${index}`} link={link} buttonProps={{ className: styles.linkButton, fill: 'text' }} />
      ))}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexDirection: 'column',
    fontSize: theme.typography.bodySmall.fontSize,
    minWidth: 140,
  }),
  header: css({
    alignItems: 'center',
    display: 'flex',
    fontWeight: theme.typography.fontWeightBold,
    gap: theme.spacing(1),
    padding: theme.spacing(1, 1, 0.5),
  }),
  marker: css({
    borderRadius: '50%',
    flex: '0 0 auto',
    height: 8,
    width: 8,
  }),
  content: css({
    overflowY: 'auto',
    padding: theme.spacing(0.5, 1, 1),
  }),
  table: css({
    columnGap: theme.spacing(2),
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    rowGap: theme.spacing(0.5),
  }),
  label: css({
    color: theme.colors.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  value: css({
    textAlign: 'right',
  }),
  footer: css({
    borderTop: `1px solid ${theme.colors.border.medium}`,
    color: theme.colors.text.secondary,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1),
  }),
  linkButton: css({
    cursor: 'pointer',
    height: 'auto',
    padding: 0,
    textAlign: 'left',
    '&:hover': {
      background: 'none',
      textDecoration: 'underline',
    },
    '& span': {
      whiteSpace: 'normal',
    },
  }),
});
