import { useRafInterval, useUpdate } from 'ahooks'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import ms from 'ms'

dayjs.extend(relativeTime)

export const getRelativeTime = t => {
  useRafInterval(useUpdate(), ms('1m'))

  return dayjs.unix(t).fromNow()
}
