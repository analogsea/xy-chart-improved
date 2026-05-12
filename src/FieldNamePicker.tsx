import React, { useMemo } from 'react';

import {
  Field,
  FieldNamePickerBaseNameMode,
  SelectableValue,
  StandardEditorContext,
  FieldNamePickerConfigSettings,
} from '@grafana/data';
import { Select } from '@grafana/ui';

interface Props<TOptions = unknown> {
  id?: string;
  value?: string;
  context: StandardEditorContext<TOptions>;
  onChange: (fieldName?: string) => void;
  item: {
    id?: string;
    name?: string;
    settings?: FieldNamePickerConfigSettings;
  };
}

export const FieldNamePicker = ({ id, value, context, onChange, item }: Props) => {
  const settings = item.settings;

  const options = useMemo(() => {
    const byValue = new Map<string, SelectableValue<string>>();

    context.data.forEach((frame, frameIndex) => {
      frame.fields.forEach((field, fieldIndex) => {
        if (settings?.filter != null && !settings.filter(field)) {
          return;
        }

        const displayName = field.state?.displayName ?? field.name;
        const optionValue = getOptionValue(field, settings?.baseNameMode);
        const optionLabel =
          context.data.length > 1 && settings?.baseNameMode !== FieldNamePickerBaseNameMode.OnlyBaseNames
            ? `${displayName} (${frame.name ?? `Frame ${frameIndex}`})`
            : displayName;

        if (!byValue.has(optionValue)) {
          byValue.set(optionValue, {
            label: optionLabel,
            value: optionValue,
            description: `field ${fieldIndex}`,
          });
        }
      });
    });

    return Array.from(byValue.values());
  }, [context.data, settings]);

  return (
    <Select
      inputId={id}
      isClearable={settings?.isClearable !== false}
      placeholder={settings?.placeholderText}
      noOptionsMessage={settings?.noFieldsMessage}
      options={options}
      value={value}
      width={settings?.width}
      onChange={(option) => onChange(option?.value)}
    />
  );
};

function getOptionValue(field: Field, baseNameMode?: FieldNamePickerBaseNameMode): string {
  if (baseNameMode === FieldNamePickerBaseNameMode.OnlyBaseNames && field.name.includes('.')) {
    return field.name.slice(field.name.lastIndexOf('.') + 1);
  }

  return field.name;
}
