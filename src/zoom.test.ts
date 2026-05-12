import { getSharedXRangeQuery, getTimeRange, getVariableQueryKey } from './zoom';

describe('zoom helpers', () => {
  it('formats dashboard variable query keys', () => {
    expect(getVariableQueryKey('x_min')).toBe('var-x_min');
    expect(getVariableQueryKey('var-step_max')).toBe('var-step_max');
    expect(getVariableQueryKey('   ')).toBeNull();
  });

  it('builds a normalized shared x range query', () => {
    expect(getSharedXRangeQuery({ from: 10, to: 2 })).toEqual({
      'var-x_min': '2',
      'var-x_max': '10',
    });
  });

  it('uses custom variable names', () => {
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
});
