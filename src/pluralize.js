import { formatNumber } from 'intl-number-helper'
import pluralize from 'pluralize'

import { locale, toNumber } from '../aliases'

export default (target, word, format) => {
  target = toNumber(target)

  if (format === 'default') return pluralize(word, target)

  return `${format ? `${formatNumber(target, locale, 's')} ` : ''}${pluralize(word, target, !format)}`
}
