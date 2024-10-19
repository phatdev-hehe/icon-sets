import { useRafInterval } from 'ahooks'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { ms, rerender } from '../aliases'

dayjs.extend(relativeTime)

export default (timestamp, autoRefresh) => {
  if (autoRefresh) useRafInterval(rerender(), ms('1m'))

  return dayjs.unix(timestamp).fromNow()
}
