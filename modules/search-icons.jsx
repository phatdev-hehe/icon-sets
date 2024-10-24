import { Input } from '@nextui-org/react'
import { useDebounceEffect, useSetState } from 'ahooks'
import { kebabCase } from 'change-case'
import { useQueryState } from 'nuqs'

import {
  createCountLabel,
  createListboxSectionDownload,
  createMemo,
  equal,
  Fuse,
  getAll,
  has,
  Icon,
  IconGrid,
  mapObject,
  MotionPluralize,
  number,
  sortKeys
} from '../aliases'

const placeholder = 'Search'
const defaultState = []

export const useSearchPattern = () => {
  const [searchPattern, setSearchPattern] = useQueryState('search', { defaultValue: placeholder })

  return { searchPattern, setSearchPattern }
}

export default () => {
  const all = getAll()
  const fuse = createMemo(() => new Fuse(all.icons, { keys: ['name'], threshold: 0.2 }))
  const [state, setState] = useSetState({ displayedIcons: defaultState, icons: defaultState })
  const { searchPattern, setSearchPattern } = useSearchPattern()

  useDebounceEffect(
    () => {
      const icons = fuse.search(kebabCase(searchPattern)).map(fuseResult => fuseResult.item)

      setState({ displayedIcons: icons, icons })
    },
    [searchPattern],
    { wait: 300 }
  )

  return (
    <IconGrid
      footer={
        <Input
          autoFocus
          classNames={{ inputWrapper: 'border-none', label: '!text-foreground-500' }}
          endContent={
            <Icon
              listbox={{
                [createCountLabel(state.icons, 'All results', false)]: [
                  {
                    isDisabled: !has(state.icons),
                    isSelected: equal(...Object.values(state)),
                    onPress: () => setState(state => ({ displayedIcons: state.icons })),
                    title: 'View'
                  },
                  { ...createListboxSectionDownload(state.icons, true), title: 'Download' }
                ],
                ...mapObject(
                  createMemo(() => {
                    const iconSets = mapObject(all.iconSets, (key, iconSet) => [
                      iconSet.name,
                      state.icons.filter(icon => icon.prefix === iconSet.prefix)
                    ])

                    return sortKeys(iconSets, {
                      compare: (a, b) => number(iconSets[b]) - number(iconSets[a])
                    })
                  }, [state.icons]),
                  (iconSetName, icons) => {
                    const isDisabled = !has(icons) || equal(icons, state.icons)

                    icons = isDisabled ? defaultState : icons

                    return [
                      createCountLabel(icons, iconSetName, false),
                      [
                        {
                          isDisabled,
                          isSelected: equal(icons, state.displayedIcons),
                          onPress: () => setState({ displayedIcons: icons }),
                          title: 'View'
                        },
                        {
                          ...createListboxSectionDownload(icons, true),
                          isDisabled,
                          title: 'Download'
                        }
                      ]
                    ]
                  }
                )
              }}
              name='round-ramp-left'
            />
          }
          label={<MotionPluralize count={state.displayedIcons} word='icon' />}
          onValueChange={setSearchPattern}
          placeholder={placeholder}
          startContent={<Icon className='size-5' name='search' />}
          value={searchPattern}
          variant='bordered'
        />
      }
      icons={state.displayedIcons}
    />
  )
}
