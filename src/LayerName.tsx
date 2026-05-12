import React from 'react';

import { Input } from '@grafana/ui';

interface Props {
  name: string;
  onChange: (name: string) => void;
}

export const LayerName = ({ name, onChange }: Props) => {
  return (
    <Input
      value={name}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
};
