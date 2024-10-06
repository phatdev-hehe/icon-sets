import { useRafState } from 'ahooks'
import { mergeWith, union } from 'es-toolkit'
import { sort } from 'fast-sort'

import {
  buildIcons,
  createMemo,
  getAll,
  Grid,
  has,
  Icon,
  is,
  mapObject,
  pluralize
} from '../aliases'

export default () => {
  const [state, setState] = useRafState()
  const all = getAll()

  const createGroup = key =>
    createMemo(() =>
      mapObject(
        Object.groupBy(Object.values(all.iconSets), iconSet => iconSet[key]),
        (key, iconSets) => [key, iconSets.flatMap(iconSet => iconSet.icons)]
      )
    )

  const createListboxSection = (title, groupedIcons) => ({
    [pluralize(groupedIcons, title)]: sort(
      Object.keys(groupedIcons).map(title => {
        const isSelected = title === state

        return { isSelected, onPress: () => setState(!isSelected && title), title }
      })
    ).asc('title')
  })

  const groupedByLicense = createGroup('license')
  const groupedByAuthor = createGroup('author')

  const groupedByCategory = createMemo(() =>
    Object.values(all.iconSets)
      .map(iconSet => iconSet.categories)
      .reduce((categories, currentCategories) => {
        if (!currentCategories) return categories
        if (Object.keys(currentCategories).some(is.emptyString)) return categories

        return mergeWith(categories, currentCategories, (arr1, arr2) => {
          if (arr1) return union(arr1, arr2)
        })
      }, {})
  )

  const icons = buildIcons(
    groupedByCategory[state]
      ? all.icons.filter(icon => groupedByCategory[state].includes(icon.name))
      : groupedByLicense[state] || groupedByAuthor[state] || []
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
            ...createListboxSection('author', groupedByAuthor),
            ...createListboxSection('license', groupedByLicense),
            ...createListboxSection('category', groupedByCategory)
          }}
          name='folder-zip'
        />
      }
      icons={icons.current}
    />
  )
}
