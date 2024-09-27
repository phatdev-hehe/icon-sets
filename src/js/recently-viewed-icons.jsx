import { useCreation, useRafState, useUpdate } from 'ahooks'
import { useSingleEffect } from 'react-haiku'

import { cache } from './cache'
import { Grid } from './grid'
import { IconButton } from './icon-button'

export const RecentlyViewedIcons = () => {
  const [state, setState] = useRafState()
  const icons = useCreation(getRecentlyViewedIcons, [state])

  useSingleEffect(useUpdate())

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
