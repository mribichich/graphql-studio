import { reduce } from 'ramda';

type Header = { name: string; value: string };

export const reduceHeaders = (headers: Header[]) => reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {}, headers);

const fetcher = (url: string, token: string | undefined = undefined, headers: Header[] = []) => async (params: Object) => {
  if (!url) return Promise.reject();

  const auth = token ? { authorization: `Bearer ${token}` } : undefined;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...auth,
      ...reduceHeaders(headers),
    },
    body: JSON.stringify(params),
  });

  return response.json();
};

export default fetcher;
