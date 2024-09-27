import { useDeepCompareEffect, useRafState } from 'ahooks'
import MotionNumber from 'motion-number/lazy'

import HoverCard from './hover-card'
import { locale } from './locale'
import { number } from './number'
import pluralize from './pluralize'

export const MotionPluralize = ({ value, word }) => {
  const [state, setState] = useRafState(0)

  useDeepCompareEffect(() => setState(number(value)), [value])

  return (
    <HoverCard tooltip={pluralize(state, word)}>
      <span>
        <MotionNumber
          format={{ compactDisplay: 'short', notation: 'compact' }}
          locales={locale}
          value={state}
        />
        {` ${pluralize(state, word, 'default')}`}
      </span>
    </HoverCard>
  )
}
