import { useBoolean } from 'ahooks'
import { sort } from 'fast-sort'

import { cache, createMemo, Icon, IconGrid } from '../aliases'

export const getRecentlyViewedIcons = () => sort([...cache.values()]).asc('id')

export const RecentlyViewedIcons = () => {
  const [state, { toggle }] = useBoolean()

  return (
    <IconGrid
      footerRight={<Icon name='round-360' onPress={toggle} tooltip='Reload' />}
      icons={createMemo(getRecentlyViewedIcons, [state])}
    />
  )
}
