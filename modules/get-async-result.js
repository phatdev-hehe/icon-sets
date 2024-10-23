import { useAsync } from 'react-use'

export default fn => useAsync(fn, []).value
