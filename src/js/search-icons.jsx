import useUrlState from '@ahooksjs/use-url-state'
import { Icon } from '@iconify/react'
import { Input } from '@nextui-org/react'
import { useCreation, useDebounceEffect, useSetState } from 'ahooks'
import { kebabCase } from 'change-case'
import Fuse from 'fuse.js'
import mapObject from 'map-obj'
import isEqual from 'react-fast-compare'
import sortKeys from 'sort-keys'

import { getAtom } from './get-atom'
import { Grid } from './grid'
import { IconButton } from './icon-button'
import { MotionPluralize } from './motion-pluralize'
import { number } from './number'
import { wrapIcons } from './wrap-icons'

export const SearchIcons = () => {
  const placeholder = 'Search'
  const initialValue = { current: [], download: {} }
  const atom = getAtom()
  const fuse = useCreation(() => new Fuse(atom.allIcons, { keys: ['name'], threshold: 0 }))
  const [state, setState] = useSetState({ filteredIcons: initialValue, icons: initialValue })

  const [{ search: searchPattern }, setSearchPattern] = useUrlState(
    { search: placeholder },
    { navigateMode: 'replace' }
  )

  const listbox = useCreation(() => {
    const listbox = mapObject(atom.allIconSets, (key, iconSet) => [
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
            <IconButton
              icon='line-md:watch'
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
            />
          }
          label={<MotionPluralize value={state.filteredIcons.count} word='icon' />}
          onValueChange={search => setSearchPattern({ search })}
          placeholder={placeholder}
          startContent={<Icon className='size-5' icon='line-md:search' />}
          value={searchPattern}
          variant='bordered'
        />
      }
      icons={state.filteredIcons.current}
    />
  )
}
