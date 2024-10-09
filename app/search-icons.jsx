import { Input } from '@nextui-org/react'
import { useDebounceEffect, useSetState } from 'ahooks'
import { kebabCase } from 'change-case'

import {
  buildIcons,
  createMemo,
  equal,
  Fuse,
  getAll,
  Grid,
  has,
  Icon,
  mapObject,
  MotionPluralize,
  number,
  sortKeys,
  title,
  useUrlState
} from '../aliases'

const placeholder = 'Search'
const defaultState = { current: [], download: {} }

export default () => {
  const all = getAll()
  const fuse = createMemo(() => new Fuse(all.icons, { keys: ['name'], threshold: 0.2 }))
  const [state, setState] = useSetState({ displayedIcons: defaultState, icons: defaultState })

  const [{ search: searchPattern }, setSearchPattern] = useUrlState(
    { search: placeholder },
    { navigateMode: 'replace' }
  )

  useDebounceEffect(
    () => {
      const icons = buildIcons(fuse.search(kebabCase(searchPattern)).map(({ item }) => item))

      setState({ displayedIcons: icons, icons })
    },
    [searchPattern],
    { wait: 300 }
  )

  return (
    <Grid
      footer={
        <Input
          autoFocus
          classNames={{ inputWrapper: 'border-none', label: '!text-foreground-500' }}
          endContent={
            <Icon
              listbox={{
                [title('All results', state.icons.current)]: [
                  {
                    isDisabled: !has(state.icons.current),
                    isSelected: equal(...Object.values(state)),
                    onPress: () => setState(state => ({ displayedIcons: state.icons })),
                    title: 'View'
                  },
                  {
                    isDisabled: !has(state.icons.current),
                    onPress: state.icons.download.fn,
                    title: 'Download'
                  }
                ],
                ...mapObject(
                  createMemo(() => {
                    const iconSets = mapObject(all.iconSets, (key, iconSet) => [
                      iconSet.name,
                      state.icons.current.filter(icon => icon.prefix === iconSet.prefix)
                    ])

                    return sortKeys(iconSets, {
                      compare: (a, b) => number(iconSets[b]) - number(iconSets[a])
                    })
                  }, [state.icons]),
                  (iconSetName, icons) => {
                    const isDisabled = !has(icons) || equal(icons, state.icons.current)

                    icons = isDisabled ? defaultState : buildIcons(icons)

                    return [
                      title(iconSetName, icons.current),
                      [
                        {
                          isDisabled,
                          isSelected: equal(icons.current, state.displayedIcons.current),
                          onPress: () => setState({ displayedIcons: icons }),
                          title: 'View'
                        },
                        { isDisabled, onPress: icons.download.fn, title: 'Download' }
                      ]
                    ]
                  }
                )
              }}
              name='watch'
            />
          }
          label={<MotionPluralize value={state.displayedIcons.current} word='icon' />}
          onValueChange={search => setSearchPattern({ search })}
          placeholder={placeholder}
          startContent={<Icon className='size-5' name='search' />}
          value={searchPattern}
          variant='bordered'
        />
      }
      icons={state.displayedIcons.current}
    />
  )
}
