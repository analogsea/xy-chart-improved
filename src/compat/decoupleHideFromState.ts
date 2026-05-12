import { DataFrame, FieldConfigSource, getFieldMatcher } from '@grafana/data';

export function decoupleHideFromState(frames: DataFrame[], fieldConfig: FieldConfigSource) {
  frames.forEach((frame) => {
    frame.fields.forEach((field) => {
      const hideFrom = {
        legend: false,
        tooltip: false,
        viz: false,
        ...fieldConfig.defaults.custom?.hideFrom,
      };

      const hideFromState = field.config.custom?.hideFrom;

      fieldConfig.overrides.forEach((override) => {
        if ('__systemRef' in override) {
          return;
        }

        const matcher = getFieldMatcher(override.matcher);

        if (matcher(field, frame, frames)) {
          for (const property of override.properties) {
            if (property.id === 'custom.hideFrom') {
              Object.assign(hideFrom, property.value);
            }
          }
        }
      });

      field.state = {
        ...field.state,
        hideFrom: {
          ...hideFromState,
        },
      };

      field.config.custom = field.config.custom ?? {};
      field.config.custom.hideFrom = hideFrom;
    });
  });
}
