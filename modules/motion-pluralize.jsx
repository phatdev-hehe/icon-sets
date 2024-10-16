import { useDeepCompareEffect, useRafState } from 'ahooks'
import { tail } from 'es-toolkit'

import { HoverCard, locale, MotionNumber, number, pluralize } from '../aliases'

const separator = ' '

export default ({ count, word }) => {
  const [state, setState] = useRafState(0)
  const tooltip = pluralize(state, word, false)

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
