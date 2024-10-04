import { useSetState } from 'ahooks'
import { range, sampleSize } from 'es-toolkit'
import { useSingleEffect } from 'react-haiku'

import { getAll, Grid, Icon, pluralize } from '../aliases'

const size = 100
const sizes = range(size, size + 1_000, size)

export default () => {
  const all = getAll()
  const [state, setState] = useSetState({ icons: [], size })

  const effect = () =>
    setState(state => ({ icons: [...state.icons, ...sampleSize(all.icons, state.size)] }))

  useSingleEffect(effect)

  return (
    <Grid
      endReached={effect}
      footerRight={
        <Icon
          listbox={{
            [pluralize(sizes, 'size')]: sizes.map(size => ({
              description: 'icons',
              isSelected: size === state.size,
              onPress: () => setState({ size }),
              title: size
            }))
          }}
          name='chevron-small-triple-right'
        />
      }
      icons={state.icons}
    />
  )
}
