import { formatNumber } from 'intl-number-helper'
import pluralize from 'pluralize'

import { locale, number } from '../aliases'

export default (target, word, format) => {
  target = number(target)

  return `${format ? `${formatNumber(target, locale, 's')} ` : ''}${pluralize(word, target, !format)}`
}
