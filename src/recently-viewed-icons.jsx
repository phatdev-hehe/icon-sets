import { useRafState } from 'ahooks'
import { useSingleEffect } from 'react-haiku'

import { cache, createMemo, Grid, IconButton, rerender } from '../aliases'

export const RecentlyViewedIcons = () => {
  const [state, setState] = useRafState()
  const icons = createMemo(getRecentlyViewedIcons, [state])

  useSingleEffect(rerender())

  return (
    <Grid
      footerRight={
        <IconButton
          icon='line-md:round-360'
          onPress={() => setState(state => !state)}
          tooltip='Reload'
        />
      }
      icons={icons}
    />
  )
}

export const getRecentlyViewedIcons = () => [...cache.values()]
