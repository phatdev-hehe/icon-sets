import { formatNumber } from 'intl-number-helper'
import pluralize from 'pluralize'

import { locale, number } from '../aliases'

export default (count, word, shouldFormat = true) => {
  count = number(count)
  word = pluralize(word, count, !shouldFormat)
  count = shouldFormat ? `${formatNumber(count, locale, 's')} ` : ''

  return `${count}${word}`
}
