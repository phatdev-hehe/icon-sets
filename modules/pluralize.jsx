import { useDeepCompareEffect, useRafState } from 'ahooks'
import { tail } from 'es-toolkit'
import { formatNumber } from 'intl-number-helper'
import pluralize from 'pluralize'

import { HoverCard, locale, MotionNumber, number } from '../aliases'

const separator = ' '

export default (count, word) => {
  count = number(count)
  word = pluralize(word, count)
  count = formatNumber(count, locale, 's')

  return `${count} ${word}`
}

export const MotionPluralize = ({ count, word }) => {
  const [state, setState] = useRafState(0)
  const tooltip = pluralize(word, state, true)

  useDeepCompareEffect(() => setState(number(count)), [count])

  return (
    <HoverCard tooltip={tooltip}>
      <span>
        <MotionNumber
          format={{ compactDisplay: 'short', notation: 'compact' }}
          locales={locale}
          value={state}
        />
        {` ${tail(tooltip.split(separator)).join(separator)}`}
      </span>
    </HoverCard>
  )
}
