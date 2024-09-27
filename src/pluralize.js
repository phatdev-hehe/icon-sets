import { formatNumber } from 'intl-number-helper'
import pluralize from 'pluralize'

import { locale } from './locale'
import { number } from './number'

export default (target, word, format) => {
  target = number(target)

  if (format === 'default') return pluralize(word, target)

  return `${format ? `${formatNumber(target, locale, 's')} ` : ''}${pluralize(word, target, !format)}`
}
