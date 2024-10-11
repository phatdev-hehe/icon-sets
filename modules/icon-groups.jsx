import { useRafState } from 'ahooks'
import { groupBy, uniq } from 'es-toolkit'
import { sort } from 'fast-sort'

import {
  buildIcons,
  createMemo,
  getAll,
  Grid,
  has,
  Icon,
  mapObject,
  pluralize,
  relativeTime,
  sortKeys
} from '../aliases'

export default () => {
  const [state, setState] = useRafState()
  const all = getAll()

  const createGroup = key =>
    createMemo(() =>
      mapObject(
        groupBy(Object.values(all.iconSets), iconSet => {
          if (key === 'lastModified') return relativeTime(iconSet[key])

          return iconSet[key]
        }),
        (key, iconSets) => [key, iconSets.flatMap(iconSet => iconSet.icons)]
      )
    )

  const createListboxSection = (title, groupedIcons, shouldSort = true) => {
    let arrayToSort = Object.entries(groupedIcons).map(([title, icons]) => {
      const isSelected = title === state

      return {
        description: pluralize(icons, 'icon'),
        isSelected,
        onPress: () => setState(!isSelected && title),
        title
      }
    })

    if (shouldSort) arrayToSort = sort(arrayToSort).asc('title')

    return { [pluralize(groupedIcons, title)]: arrayToSort }
  }

  const groupedByCategory = createGroup('category')
  const groupedByLicense = createGroup('license')
  const groupedByAuthor = createGroup('author')

  const groupedByFirstLetter = createMemo(() =>
    groupBy(all.icons, icon => icon.name[0].toUpperCase())
  )

  const updates = uniq(
    sort(Object.values(all.iconSets).map(iconSet => iconSet.lastModified))
      .desc()
      .map(relativeTime)
  )

  const groupedByUpdate = sortKeys(createGroup('lastModified'), {
    compare: (a, b) => updates.indexOf(a) - updates.indexOf(b)
  })

  const icons = buildIcons(
    groupedByAuthor[state] ??
      groupedByFirstLetter[state] ??
      groupedByLicense[state] ??
      groupedByUpdate[state] ??
      groupedByCategory[state] ??
      all.icons
  )

  return (
    <Grid
      footerRight={
        <Icon
          listbox={{
            Download: [
              {
                isDisabled: !has(icons.current),
                onPress: icons.download.fn,
                title: icons.download.filename
              }
            ],
            ...createListboxSection('update', groupedByUpdate, false),
            ...createListboxSection('license', groupedByLicense),
            ...createListboxSection('category', groupedByCategory),
            ...createListboxSection('author', groupedByAuthor),
            ...createListboxSection('first letter', groupedByFirstLetter)
          }}
          name='folder-zip'
        />
      }
      icons={icons.current}
    />
  )
}
