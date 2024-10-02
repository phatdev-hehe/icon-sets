import { useAsync } from 'react-use'

export default fn => {
  const state = useAsync(fn)

  if (state.loading) return 'Loading…'
  if (state.error) return 'Loading error'

  return state.value
}
