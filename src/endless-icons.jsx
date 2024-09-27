import { useSetState } from 'ahooks'
import { range, sampleSize } from 'es-toolkit'
import { useSingleEffect } from 'react-haiku'

import { getAtom } from './get-atom'
import { Grid } from './grid'
import { IconButton } from './icon-button'
import pluralize from './pluralize'

const size = 100
const sizes = range(size, size + 1_000, size)

export const EndlessIcons = () => {
  const atom = getAtom()
  const [state, setState] = useSetState({ icons: [], size })

  const endReached = () =>
    setState(state => ({ icons: [...state.icons, ...sampleSize(atom.allIcons, state.size)] }))

  useSingleEffect(endReached)

  return (
    <Grid
      endReached={endReached}
      footerRight={
        <IconButton
          icon='line-md:arrow-align-right'
          listbox={{
            [pluralize(sizes, 'size')]: sizes.map(size => ({
              description: 'icons',
              isActive: size === state.size,
              onPress: () => setState({ size }),
              title: size
            }))
          }}
        />
      }
      icons={state.icons}
    />
  )
}
