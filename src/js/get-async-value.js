import { useAsync } from 'react-use'

export const getAsyncValue = fn => {
  const state = useAsync(fn)

  return state.loading ? 'Loading…' : state.error ? 'Loading error' : state.value
}
