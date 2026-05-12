import {
  DisplayValue,
  Field,
  GrafanaTheme2,
  getDisplayProcessor,
  reduceField,
  ReducerID,
  fieldReducers,
} from '@grafana/data';

export const getDisplayValuesForCalcs = (calcs: string[], field: Field, theme: GrafanaTheme2): DisplayValue[] => {
  if (!calcs?.length) {
    return [];
  }

  const defaultFormatter = (v: number | null) => ({
    text: v == null ? '-' : v.toFixed(1),
    numeric: v ?? Number.NaN,
  });
  const fmt = field.display ?? defaultFormatter;
  let countFormatter: typeof fmt | null = null;

  const fieldCalcs = reduceField({
    field,
    reducers: calcs,
  });

  return calcs.map((reducerId) => {
    const fieldReducer = fieldReducers.get(reducerId);
    let formatter = fmt;

    if (fieldReducer.id === ReducerID.diffperc) {
      formatter = getDisplayProcessor({
        field: {
          ...field,
          config: {
            ...field.config,
            unit: 'percent',
          },
        },
        theme,
      });
    }

    if (
      fieldReducer.id === ReducerID.count ||
      fieldReducer.id === ReducerID.changeCount ||
      fieldReducer.id === ReducerID.distinctCount
    ) {
      countFormatter ??= getDisplayProcessor({
        field: {
          ...field,
          config: {
            ...field.config,
            unit: 'none',
          },
        },
        theme,
      });

      formatter = countFormatter;
    }

    return {
      ...formatter(fieldCalcs[reducerId]),
      title: fieldReducer.name,
      description: fieldReducer.description,
    };
  });
};
