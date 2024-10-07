import { useDeepCompareEffect, useRafState } from 'ahooks'
import { tail } from 'es-toolkit'
import MotionNumber from 'motion-number/lazy'

import { HoverCard, locale, number, pluralize } from '../aliases'

const separator = ' '

export default ({ value, word }) => {
  const [state, setState] = useRafState(0)
  const tooltip = pluralize(state, word, false)

  useDeepCompareEffect(() => setState(number(value)), [value])

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
