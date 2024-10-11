import { size } from 'es-toolkit/compat'

import { is } from '../aliases'

export default value => {
  if (is.number(value)) return value

  return size(value)
}
