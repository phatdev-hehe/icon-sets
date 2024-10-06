import { useRafState } from 'ahooks'
import { sort } from 'fast-sort'

import { buildIcons, createMemo, getAll, Grid, has, Icon, mapObject, pluralize } from '../aliases'

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
      Object.entries(groupedIcons).map(([title, icons]) => {
        const isSelected = title === state

        return {
          description: pluralize(icons, 'icon'),
          isSelected,
          onPress: () => setState(!isSelected && title),
          title
        }
      })
    ).asc('title')
  })

  const groupedByCategory = createGroup('category')
  const groupedByLicense = createGroup('license')
  const groupedByAuthor = createGroup('author')

  const icons = buildIcons(
    groupedByCategory[state] ?? groupedByLicense[state] ?? groupedByAuthor[state] ?? []
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
            ...createListboxSection('category', groupedByCategory),
            ...createListboxSection('license', groupedByLicense),
            ...createListboxSection('author', groupedByAuthor)
          }}
          name='folder-zip'
        />
      }
      icons={icons.current}
    />
  )
}
