import { bytes, is, number, pluralize } from '../aliases'

export default (count, label, usePluralize = true) => {
  if (usePluralize) return pluralize(count, label)
  if (is.blob(count)) return `${label} (${bytes(count)})`

  return `${label} (${number(count)})`
}
