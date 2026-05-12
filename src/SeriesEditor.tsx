import { css, cx } from '@emotion/css';
import React, { Fragment, useId, useState } from 'react';
import { usePrevious } from 'react-use';

import {
  Field as DataField,
  getFrameDisplayName,
  StandardEditorProps,
  // getFieldDisplayName,
  FrameMatcherID,
  FieldMatcherID,
  FieldNamePickerBaseNameMode,
  FieldType,
  GrafanaTheme2,
} from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Button, Field, IconButton, Select, useStyles2 } from '@grafana/ui';

import { FieldNamePicker } from './FieldNamePicker';
import { LayerName } from './LayerName';
import { Options, SeriesMapping, XYSeriesConfig } from './panelcfg.gen';

export const SeriesEditor = ({
  value: seriesCfg,
  onChange,
  context,
}: StandardEditorProps<XYSeriesConfig[], unknown, Options>) => {
  const style = useStyles2(getStyles);

  // reset opts when mapping changes (no way to do this in panel opts builder?)
  const mapping = context.options?.mapping;
  const prevMapping = usePrevious(mapping);
  const mappingChanged = prevMapping != null && mapping !== prevMapping;

  const defaultFrame = { frame: { matcher: { id: FrameMatcherID.byIndex, options: 0 } } };
  const [selectedIdx, setSelectedIdx] = useState(0);
  const effectiveSeriesCfg = mappingChanged || seriesCfg == null ? [{ ...defaultFrame }] : seriesCfg;

  if (mappingChanged || seriesCfg == null) {
    onChange([...effectiveSeriesCfg]);

    if (selectedIdx > 0) {
      setSelectedIdx(0);
    }
  }

  const addSeries = () => {
    const nextSeriesCfg = effectiveSeriesCfg.concat({ ...defaultFrame });
    setSelectedIdx(nextSeriesCfg.length - 1);
    onChange(nextSeriesCfg);
  };

  const deleteSeries = (index: number) => {
    const nextSeriesCfg = effectiveSeriesCfg.filter((s, i) => i !== index);
    setSelectedIdx(0);
    onChange(nextSeriesCfg);
  };

  const updateSeries = (index: number, nextSeries: XYSeriesConfig) => {
    onChange(effectiveSeriesCfg.map((series, seriesIndex) => (seriesIndex === index ? nextSeries : series)));
  };

  const updateSelectedSeries = (nextSeries: XYSeriesConfig) => updateSeries(selectedIdx, nextSeries);

  const series = effectiveSeriesCfg[selectedIdx];
  const formKey = `${mapping}${selectedIdx}`;

  const baseNameMode =
    mapping === SeriesMapping.Manual
      ? FieldNamePickerBaseNameMode.ExcludeBaseNames
      : context.data.length === 1
        ? FieldNamePickerBaseNameMode.IncludeAll
        : FieldNamePickerBaseNameMode.OnlyBaseNames;

  context.data.forEach((frame, frameIndex) => {
    frame.fields.forEach((field, fieldIndex) => {
      field.state = {
        ...field.state,
        origin: {
          frameIndex,
          fieldIndex,
        },
      };
    });
  });

  const frameInputId = useId();
  const xFieldInputId = useId();
  const yFieldInputId = useId();
  const sizeFieldInputId = useId();
  const colorFieldInputId = useId();

  return (
    <>
      {mapping === SeriesMapping.Manual && (
        <>
          <Button icon="plus" size="sm" variant="secondary" onClick={addSeries} className={style.marginBot}>
            <Trans i18nKey="xychart.series-editor.add-series">Add series</Trans>
          </Button>

          <div className={style.marginBot}>
            {effectiveSeriesCfg.map((series, index) => {
              return (
                <div
                  key={`series/${index}`}
                  className={index === selectedIdx ? `${style.row} ${style.sel}` : style.row}
                  onClick={() => setSelectedIdx(index)}
                  role="button"
                  aria-label={t('xychart.series-editor.aria-label-select-series', 'Select series {{seriesNum}}', {
                    seriesNum: index + 1,
                  })}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSelectedIdx(index);
                    }
                  }}
                >
                  <LayerName
                    name={series.name?.fixed ?? `Series ${index + 1}`}
                    onChange={(v: string) => {
                      updateSeries(index, {
                        ...series,
                        name: {
                          fixed: v === '' || v === `Series ${index + 1}` ? undefined : v,
                        },
                      });
                    }}
                  />
                  <IconButton
                    name="trash-alt"
                    className={cx(style.actionIcon)}
                    onClick={() => deleteSeries(index)}
                    tooltip={t('xychart.series-editor.tooltip-delete-series', 'Delete series')}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedIdx >= 0 && series != null && (
        <Fragment key={formKey}>
          <Field label={t('xychart.series-editor.label-frame', 'Frame')}>
            <Select
              inputId={frameInputId}
              placeholder={
                mapping === SeriesMapping.Auto
                  ? t('xychart.series-editor.placeholder-all-frames', 'All frames')
                  : t('xychart.series-editor.placeholder-select-frame', 'Select frame')
              }
              isClearable={true}
              options={context.data.map((frame, index) => ({
                value: index,
                label: `${getFrameDisplayName(frame, index)} (index: ${index}, rows: ${frame.length})`,
              }))}
              value={series.frame?.matcher.options}
              onChange={(opt) => {
                const nextSeries = { ...series };

                if (opt == null) {
                  delete nextSeries.frame;
                } else {
                  nextSeries.frame = {
                    matcher: {
                      id: FrameMatcherID.byIndex,
                      options: Number(opt.value),
                    },
                  };
                }

                updateSelectedSeries(nextSeries);
              }}
            />
          </Field>
          <Field label={t('xychart.series-editor.label-x-field', 'X field')}>
            <FieldNamePicker
              id={xFieldInputId}
              value={series.x?.matcher.options as string}
              context={context}
              onChange={(fieldName?: string) => {
                const nextSeries = { ...series };

                if (fieldName == null) {
                  delete nextSeries.x;
                } else {
                  // TODO: reset any other dim that was set to fieldName
                  nextSeries.x = {
                    matcher: {
                      id: FieldMatcherID.byName,
                      options: fieldName,
                    },
                  };
                }

                updateSelectedSeries(nextSeries);
              }}
              item={{
                id: 'x',
                name: 'x',
                settings: {
                  filter: (field: DataField) =>
                    (mapping === SeriesMapping.Auto ||
                      field.state?.origin?.frameIndex === series.frame?.matcher.options) &&
                    (field.type === FieldType.number || field.type === FieldType.time) &&
                    !field.config.custom?.hideFrom?.viz,
                  baseNameMode,
                  placeholderText:
                    mapping === SeriesMapping.Auto
                      ? t('xychart.series-editor.placeholder-x-field', 'First number or time field in each frame')
                      : undefined,
                },
              }}
            />
          </Field>
          <Field label={t('xychart.series-editor.label-y-field', 'Y field')}>
            <FieldNamePicker
              id={yFieldInputId}
              value={series.y?.matcher?.options as string}
              context={context}
              onChange={(fieldName?: string) => {
                const nextSeries = { ...series };

                if (fieldName == null) {
                  delete nextSeries.y;
                } else {
                  // TODO: reset any other dim that was set to fieldName
                  nextSeries.y = {
                    matcher: {
                      id: FieldMatcherID.byName,
                      options: fieldName,
                    },
                  };
                }

                updateSelectedSeries(nextSeries);
              }}
              item={{
                id: 'y',
                name: 'y',
                settings: {
                  // TODO: filter out series.y?.exclude.options, series.size.matcher.options, series.color.matcher.options
                  filter: (field: DataField) =>
                    (mapping === SeriesMapping.Auto ||
                      field.state?.origin?.frameIndex === series.frame?.matcher.options) &&
                    field.type === FieldType.number &&
                    !field.config.custom?.hideFrom?.viz,
                  baseNameMode,
                  placeholderText:
                    mapping === SeriesMapping.Auto
                      ? t('xychart.series-editor.placeholder-y-field', 'Remaining number fields in each frame')
                      : undefined,
                },
              }}
            />
          </Field>
          <Field label={t('xychart.series-editor.label-size-field', 'Size field')}>
            <FieldNamePicker
              id={sizeFieldInputId}
              value={series.size?.matcher?.options as string}
              context={context}
              onChange={(fieldName?: string) => {
                const nextSeries = { ...series };

                if (fieldName == null) {
                  delete nextSeries.size;
                } else {
                  // TODO: reset any other dim that was set to fieldName
                  nextSeries.size = {
                    matcher: {
                      id: FieldMatcherID.byName,
                      options: fieldName,
                    },
                  };
                }

                updateSelectedSeries(nextSeries);
              }}
              item={{
                id: 'size',
                name: 'size',
                settings: {
                  // TODO: filter out series.y?.exclude.options, series.size.matcher.options, series.color.matcher.options
                  filter: (field: DataField) =>
                    (mapping === SeriesMapping.Auto ||
                      field.state?.origin?.frameIndex === series.frame?.matcher.options) &&
                    field.type === FieldType.number &&
                    !field.config.custom?.hideFrom?.viz,
                  baseNameMode,
                  placeholderText: '',
                },
              }}
            />
          </Field>
          <Field label={t('xychart.series-editor.label-color-field', 'Color field')}>
            <FieldNamePicker
              id={colorFieldInputId}
              value={series.color?.matcher?.options as string}
              context={context}
              onChange={(fieldName?: string) => {
                const nextSeries = { ...series };

                if (fieldName == null) {
                  delete nextSeries.color;
                } else {
                  // TODO: reset any other dim that was set to fieldName
                  nextSeries.color = {
                    matcher: {
                      id: FieldMatcherID.byName,
                      options: fieldName,
                    },
                  };
                }

                updateSelectedSeries(nextSeries);
              }}
              item={{
                id: 'color',
                name: 'color',
                settings: {
                  // TODO: filter out series.y?.exclude.options, series.size.matcher.options, series.color.matcher.options
                  filter: (field: DataField) =>
                    (mapping === SeriesMapping.Auto ||
                      field.state?.origin?.frameIndex === series.frame?.matcher.options) &&
                    field.type === FieldType.number &&
                    !field.config.custom?.hideFrom?.viz,
                  baseNameMode,
                  placeholderText: '',
                },
              }}
            />
          </Field>
        </Fragment>
      )}
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  marginBot: css({
    marginBottom: '20px',
  }),
  row: css({
    padding: `${theme.spacing(0.5, 1)}`,
    borderRadius: `${theme.shape.radius.default}`,
    background: `${theme.colors.background.secondary}`,
    minHeight: `${theme.spacing(4)}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '3px',
    cursor: 'pointer',

    border: `1px solid ${theme.components.input.borderColor}`,
    '&:hover': {
      border: `1px solid ${theme.components.input.borderHover}`,
    },
  }),
  sel: css({
    border: `1px solid ${theme.colors.primary.border}`,
    '&:hover': {
      border: `1px solid ${theme.colors.primary.border}`,
    },
  }),
  actionIcon: css({
    color: `${theme.colors.text.secondary}`,
    '&:hover': {
      color: `${theme.colors.text}`,
    },
  }),
});
