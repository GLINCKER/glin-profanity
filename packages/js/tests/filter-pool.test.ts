import { clearFilterPool, getPooledFilter } from '../src/core/filterPool';

describe('filterPool', () => {
  afterEach(() => {
    clearFilterPool();
  });

  test('reuses the same Filter instance for identical config', () => {
    const config = { languages: ['english'] as ('english')[] };
    const first = getPooledFilter(config);
    const second = getPooledFilter(config);
    expect(second).toBe(first);
  });

  test('creates separate instances for different configs', () => {
    const english = getPooledFilter({ languages: ['english'] });
    const spanish = getPooledFilter({ languages: ['spanish'] });
    expect(spanish).not.toBe(english);
  });
});
