import bytes from 'bytes'

import { is } from '../aliases'

export default value => {
  if (is.blob(value)) value = value.size

  return bytes(value, { decimalPlaces: 1, unitSeparator: ' ' })
}
