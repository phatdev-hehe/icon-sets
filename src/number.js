import is from '@sindresorhus/is'
import { size } from 'es-toolkit/compat'

export const number = value => {
  if (is.number(value)) return value

  return size(value)
}
