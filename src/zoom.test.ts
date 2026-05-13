import { formatDurationSeconds } from './duration';
import { XYXAxisMode } from './options';
import { getSharedXRangeQuery, getTimeRange, getVariableQueryKey, getXAxisModeForPanel, getXAxisModeFromValue } from './zoom';

describe('zoom helpers', () => {
  it('formats dashboard variable query keys', () => {
    expect(getVariableQueryKey('x_min')).toBe('var-x_min');
    expect(getVariableQueryKey('var-step_max')).toBe('var-step_max');
    expect(getVariableQueryKey('   ')).toBeNull();
  });

  it('builds a normalized shared x range query', () => {
    expect(getSharedXRangeQuery({ from: 10, to: 2 })).toEqual({
      'var-step_min': '2',
      'var-step_max': '10',
    });
  });

  it('uses legacy custom variable names when dashboard-driven step variables are not set', () => {
    expect(
      getSharedXRangeQuery(
        { from: 1.5, to: 2.25 },
        {
          xMinVariable: 'step_start',
          xMaxVariable: 'step_end',
        }
      )
    ).toEqual({
      'var-step_start': '1.5',
      'var-step_end': '2.25',
    });
  });

  it('uses dashboard-driven step variable names', () => {
    expect(
      getSharedXRangeQuery(
        { from: 100, to: 250 },
        {
          stepXMinVariable: 'step_start',
          stepXMaxVariable: 'step_end',
        },
        XYXAxisMode.Step
      )
    ).toEqual({
      'var-step_start': '100',
      'var-step_end': '250',
    });
  });

  it('uses dashboard-driven relative-time variable names', () => {
    expect(
      getSharedXRangeQuery(
        { from: 30, to: 180 },
        {
          relativeTimeXMinVariable: 'rel_start',
          relativeTimeXMaxVariable: 'rel_end',
        },
        XYXAxisMode.RelativeTime
      )
    ).toEqual({
      'var-rel_start': '30',
      'var-rel_end': '180',
    });
  });

  it('resolves x axis mode from dashboard variables', () => {
    expect(getXAxisModeFromValue('relative_time')).toBe(XYXAxisMode.RelativeTime);
    expect(getXAxisModeFromValue('step')).toBe(XYXAxisMode.Step);
    expect(getXAxisModeFromValue('${x_axis:raw}')).toBe(XYXAxisMode.Step);
    expect(getXAxisModeForPanel(() => 'relative_time')).toBe(XYXAxisMode.RelativeTime);
  });

  it('ignores invalid ranges', () => {
    expect(getSharedXRangeQuery({ from: Number.NaN, to: 1 })).toBeNull();
    expect(getTimeRange({ from: Number.NaN, to: 1 })).toBeNull();
  });

  it('builds a normalized time range', () => {
    expect(getTimeRange({ from: 1710000001000, to: 1710000000000 })).toEqual({
      from: 1710000000000,
      to: 1710000001000,
    });
  });

  it('formats elapsed-second labels by range', () => {
    expect(formatDurationSeconds(42, { rangeSeconds: 50 })).toBe('42s');
    expect(formatDurationSeconds(90, { rangeSeconds: 1800 })).toBe('1m 30s');
    expect(formatDurationSeconds(5400, { rangeSeconds: 7200 })).toBe('1h 30m');
    expect(formatDurationSeconds(183600, { rangeSeconds: 259200 })).toBe('2d 3h');
  });
});
