import { useDeepCompareEffect, useSetState } from 'ahooks'

import {
  clone,
  createCountLabel,
  createListboxSectionDownload,
  equal,
  has,
  Icon,
  IconGrid,
  is
} from '../aliases'

const initialState = { category: undefined, variant: undefined }

export default iconSet => {
  const [state, setState] = useSetState(initialState)

  iconSet = clone(iconSet)
  iconSet.variants = iconSet.prefixes ?? iconSet.suffixes ?? {}

  iconSet.has = {
    categories: has(iconSet.categories),
    prefixes: has(iconSet.prefixes),
    variants: has(iconSet.variants)
  }

  iconSet.icons = iconSet.icons.filter(icon => {
    const matchesVariant = variant =>
      icon.name[iconSet.has.prefixes ? 'startsWith' : 'endsWith'](
        iconSet.has.prefixes ? `${variant}-` : `-${variant}`
      )

    return (
      (!is.string(state.category) || iconSet.categories?.[state.category]?.includes(icon.name)) &&
      (!is.string(state.variant) ||
        (is.emptyString(state.variant)
          ? !Object.keys(iconSet.variants).some(matchesVariant)
          : matchesVariant(state.variant)))
    )
  })

  const createListboxSection = key => {
    if (!iconSet.has[key]) return

    const KEY = { categories: 'category', variants: 'variant' }[key]

    return {
      [createCountLabel(iconSet[key], key)]: Object.entries(iconSet[key]).map(([key, value]) => {
        const isSelected = key === state[KEY]

        return {
          isSelected,
          onPress: () => setState({ [KEY]: isSelected ? initialState[KEY] : key }),
          title: KEY === 'category' ? key : value
        }
      })
    }
  }

  useDeepCompareEffect(() => {
    if (equal(state, initialState)) return

    setState(initialState)
  }, [iconSet.prefix])

  return (
    <IconGrid
      footerRight={
        (iconSet.has.variants || iconSet.has.categories || undefined) && (
          <Icon
            listbox={{
              ...createListboxSection('variants'),
              ...createListboxSection('categories'),
              ...createListboxSectionDownload(iconSet.icons)
            }}
            name='filter'
          />
        )
      }
      icons={iconSet.icons}
    />
  )
}
