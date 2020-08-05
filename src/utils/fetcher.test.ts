import fetcher, { reduceHeaders } from './fetcher';

describe('reduceHeaders', () => {
  test('when empty should return an object', () => {
    expect(reduceHeaders([])).toEqual({});
  });

  test('should convert array into an object', () => {
    expect(
      reduceHeaders([
        { name: 'a', value: '1' },
        { name: 'b', value: '2' },
      ])
    ).toEqual({ a: '1', b: '2' });
  });
});

describe('fetcher', () => {
  test('when url is undefined, it should reject it', () => {
    expect(fetcher('')({})).rejects.toBeUndefined();
  });
});
