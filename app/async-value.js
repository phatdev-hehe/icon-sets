import { useAsync } from 'react-use'

export default fn => {
  const { error, loading, value } = useAsync(fn)

  if (loading) return 'Loading…'
  if (error) return 'Loading error'

  return value
}
