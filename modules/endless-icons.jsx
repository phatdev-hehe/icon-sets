import { useSetState } from 'ahooks'
import { range, sampleSize } from 'es-toolkit'
import { useSingleEffect } from 'react-haiku'

import { createCountLabel, getAll, Icon, IconGrid } from '../aliases'

const size = 100
const sizes = range(size, size + 1000, size)

export default () => {
  const all = getAll()
  const [state, setState] = useSetState({ icons: [], size })

  const effect = () =>
    setState(state => ({ icons: [...state.icons, ...sampleSize(all.icons, state.size)] }))

  useSingleEffect(effect)

  return (
    <IconGrid
      endReached={effect}
      footerRight={
        <Icon
          listbox={{
            [createCountLabel(sizes, 'size')]: sizes.map(size => ({
              description: 'icons',
              isSelected: size === state.size,
              onPress: () => setState({ size }),
              title: size
            }))
          }}
          name='double-arrow-horizontal'
        />
      }
      icons={state.icons}
    />
  )
}
