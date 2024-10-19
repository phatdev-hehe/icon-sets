import { formatNumber } from 'intl-number-helper'
import pluralize from 'pluralize'

import { locale, number } from '../aliases'

export default (count, word, shouldFormatCount = true) => {
  count = number(count)
  word = pluralize(word, count, !shouldFormatCount)
  count = shouldFormatCount ? `${formatNumber(count, locale, 's')} ` : ''

  return `${count}${word}`
}
