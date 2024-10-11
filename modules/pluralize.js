import { formatNumber } from 'intl-number-helper'
import pluralize from 'pluralize'

import { locale, number } from '../aliases'

export default (value, word, format = true) => {
  value = number(value)

  return `${format ? `${formatNumber(value, locale, 's')} ` : ''}${pluralize(word, value, !format)}`
}
