import { useRafState } from 'ahooks'
import { sort } from 'fast-sort'
import { useSingleEffect } from 'react-haiku'

import { cache, createMemo, Grid, Icon, rerender } from '../aliases'

export const getRecentlyViewedIcons = () => sort([...cache.values()]).asc('id')

export const RecentlyViewedIcons = () => {
  const [state, setState] = useRafState()

  useSingleEffect(rerender())

  return (
    <Grid
      footerRight={
        <Icon name='round-360' onPress={() => setState(state => !state)} tooltip='Reload' />
      }
      icons={createMemo(getRecentlyViewedIcons, [state])}
    />
  )
}
