import { useRafInterval } from 'ahooks'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { ms, rerender } from '../aliases'

dayjs.extend(relativeTime)

export default (t, shouldUpdate) => {
  if (shouldUpdate) useRafInterval(rerender(), ms('1m'))

  return dayjs.unix(t).fromNow()
}
