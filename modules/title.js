import { bytes, is, number } from '../aliases'

export default (title, description) => {
  if (is.blob(description)) description = bytes(description)
  if (is.object(description)) description = number(description)

  return `${title} (${description})`
}
