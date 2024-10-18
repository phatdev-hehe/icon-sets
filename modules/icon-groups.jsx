import { useRafState } from 'ahooks'
import { groupBy, uniq } from 'es-toolkit'
import { sort } from 'fast-sort'

import {
  buildIcons,
  createMemo,
  getAll,
  Grid,
  Icon,
  mapObject,
  pluralize,
  relativeTime,
  sortKeys
} from '../aliases'

export default () => {
  const [state, setState] = useRafState()
  const all = getAll()

  const createGroupBy = key =>
    createMemo(() =>
      mapObject(
        groupBy(Object.values(all.iconSets), iconSet => {
          if (key === 'lastModified') return relativeTime(iconSet[key])

          return iconSet[key]
        }),
        (key, iconSets) => [key, iconSets.flatMap(iconSet => iconSet.icons)]
      )
    )

  const createListboxSection = (title, iconGroups, shouldSort = true) => {
    let arrayToSort = Object.entries(iconGroups).map(([title, icons]) => {
      const isSelected = title === state

      return {
        description: pluralize(icons, 'icon'),
        isSelected,
        onPress: () => setState(!isSelected && title),
        title
      }
    })

    if (shouldSort) arrayToSort = sort(arrayToSort).asc('title')

    return { [pluralize(iconGroups, title)]: arrayToSort }
  }

  const groupedByCategory = createGroupBy('category')
  const groupedByLicense = createGroupBy('license')
  const groupedByAuthor = createGroupBy('author')

  const groupedByFirstLetter = createMemo(() =>
    groupBy(all.icons, icon => icon.name[0].toUpperCase())
  )

  const modifiedDates = uniq(
    sort(Object.values(all.iconSets).map(iconSet => iconSet.lastModified))
      .desc()
      .map(relativeTime)
  )

  const groupedByModifiedDate = sortKeys(createGroupBy('lastModified'), {
    compare: (a, b) => modifiedDates.indexOf(a) - modifiedDates.indexOf(b)
  })

  const icons = buildIcons(
    groupedByCategory[state] ??
      groupedByFirstLetter[state] ??
      groupedByLicense[state] ??
      groupedByModifiedDate[state] ??
      groupedByAuthor[state] ??
      all.icons
  )

  return (
    <Grid
      footerRight={
        <Icon
          listbox={{
            ...createListboxSection('date', groupedByModifiedDate, false),
            ...createListboxSection('license', groupedByLicense),
            ...createListboxSection('category', groupedByCategory),
            ...createListboxSection('author', groupedByAuthor),
            ...createListboxSection('first letter', groupedByFirstLetter),
            ...icons.download.createListboxSection()
          }}
          name='turn-slight-right'
        />
      }
      icons={icons.current}
    />
  )
}
