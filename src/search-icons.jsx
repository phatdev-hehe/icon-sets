import useUrlState from '@ahooksjs/use-url-state'
import { Input } from '@nextui-org/react'
import { useDebounceEffect, useSetState } from 'ahooks'
import { kebabCase } from 'change-case'
import Fuse from 'fuse.js'
import mapObject from 'map-obj'
import isEqual from 'react-fast-compare'
import sortKeys from 'sort-keys'

import { createMemo, getAll, Grid, Icon, MotionPluralize, number, wrapIcons } from '../aliases'

export default () => {
  const placeholder = 'Search'
  const initialValue = { current: [], download: {} }
  const all = getAll()
  const fuse = createMemo(() => new Fuse(all.icons, { keys: ['name'], threshold: 0 }))
  const [state, setState] = useSetState({ filteredIcons: initialValue, icons: initialValue })

  const [{ search: searchPattern }, setSearchPattern] = useUrlState(
    { search: placeholder },
    { navigateMode: 'replace' }
  )

  const listbox = createMemo(() => {
    const listbox = mapObject(all.iconSets, (key, iconSet) => [
      iconSet.name,
      state.icons.current.filter(icon => icon.prefix === iconSet.prefix)
    ])

    return sortKeys(listbox, { compare: (a, b) => number(listbox[b]) - number(listbox[a]) })
  }, [state.icons])

  useDebounceEffect(
    () => {
      const icons = wrapIcons(fuse.search(kebabCase(searchPattern)).map(({ item }) => item))

      setState({ filteredIcons: icons, icons })
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
                [`All results (${state.icons.count})`]: [
                  {
                    isDisabled: isEqual(...Object.values(state)),
                    onPress: () => setState(state => ({ filteredIcons: state.icons })),
                    title: 'View'
                  },
                  {
                    isDisabled: !state.icons.count,
                    onPress: state.icons.download.fn,
                    title: 'Download'
                  }
                ],
                ...mapObject(listbox, (iconSetName, icons) => {
                  icons = wrapIcons(icons)

                  return [
                    `${iconSetName} (${icons.count})`,
                    [
                      {
                        isDisabled:
                          isEqual(icons.current, state.filteredIcons.current) || !icons.count,
                        onPress: () => setState({ filteredIcons: icons }),
                        title: 'View'
                      },
                      { isDisabled: !icons.count, onPress: icons.download.fn, title: 'Download' }
                    ]
                  ]
                })
              }}
              name='watch'
            />
          }
          label={<MotionPluralize value={state.filteredIcons.count} word='icon' />}
          onValueChange={search => setSearchPattern({ search })}
          placeholder={placeholder}
          startContent={<Icon className='size-5' name='search' />}
          value={searchPattern}
          variant='bordered'
        />
      }
      icons={state.filteredIcons.current}
    />
  )
}
