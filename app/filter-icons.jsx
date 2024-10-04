import { useDeepCompareEffect, useSetState } from 'ahooks'

import { buildIcons, clone, equal, Grid, has, Icon, is, pluralize } from '../aliases'

const initialState = { category: null, variant: null }

export default iconSet => {
  const [state, setState] = useSetState(initialState)
  const isDefaultState = equal(state, initialState)

  const createListboxItem = (key, value, title = value) => {
    const isSelected = state[key] === value

    return {
      isSelected,
      onPress: () => setState({ [key]: isSelected ? initialState[key] : value }),
      title
    }
  }

  iconSet = clone(iconSet)
  iconSet.variants = iconSet.prefixes ?? iconSet.suffixes ?? {}

  iconSet.has = {
    categories: has(iconSet.categories),
    prefixes: has(iconSet.prefixes),
    variants: has(iconSet.variants)
  }

  iconSet.icons = buildIcons(
    iconSet.icons.filter(icon => {
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
  )

  useDeepCompareEffect(() => {
    if (isDefaultState) return

    setState(initialState)
  }, [iconSet.prefix])

  return (
    <Grid
      footerRight={
        (iconSet.has.variants || iconSet.has.categories || null) && (
          <Icon
            listbox={{
              ...(iconSet.has.variants && {
                [pluralize(iconSet.variants, 'variant')]: Object.entries(iconSet.variants).map(
                  value => createListboxItem('variant', ...value)
                )
              }),
              ...(iconSet.has.categories && {
                [pluralize(iconSet.categories, 'category')]: Object.keys(iconSet.categories).map(
                  category => createListboxItem('category', category)
                )
              }),
              Download: [
                {
                  isDisabled: !has(iconSet.icons.current),
                  onPress: iconSet.icons.download.fn,
                  title: iconSet.icons.download.filename
                }
              ]
            }}
            name={isDefaultState ? 'filter' : 'filter-filled'}
          />
        )
      }
      icons={iconSet.icons.current}
    />
  )
}
