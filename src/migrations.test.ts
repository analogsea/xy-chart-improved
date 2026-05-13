import { FieldMatcherID } from '@grafana/data';

import { xyChartMigrationHandler } from './migrations';
import { SeriesMapping } from './panelcfg.gen';

describe('xy chart migrations', () => {
  it('leaves current plugin options unchanged across plugin version bumps', () => {
    const options = {
      mapping: SeriesMapping.Auto,
      series: [
        {
          x: {
            matcher: {
              id: FieldMatcherID.byName,
              options: 'x',
            },
          },
          y: {
            matcher: {
              id: FieldMatcherID.byName,
              options: 'y',
            },
          },
        },
      ],
    };

    expect(
      xyChartMigrationHandler({
        options,
        pluginVersion: '1.3.0',
      } as any)
    ).toBe(options);
  });

  it('still migrates old XY chart options', () => {
    const migrated = xyChartMigrationHandler({
      fieldConfig: {
        defaults: {
          custom: {},
        },
        overrides: [],
      },
      options: {
        dims: {
          frame: 0,
          x: 'step',
        },
        series: [],
        seriesMapping: 'auto',
      },
      pluginVersion: '',
    } as any);

    expect(migrated.mapping).toBe(SeriesMapping.Auto);
    expect(migrated.series[0].x?.matcher).toEqual({
      id: FieldMatcherID.byName,
      options: 'step',
    });
  });
});
