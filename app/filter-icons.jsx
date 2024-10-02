import { useDeepCompareEffect, useSetState } from 'ahooks'

import { clone, equal, Grid, has, Icon, is, pluralize, wrapIcons } from '../aliases'

const initialState = { category: null, variant: null }

export default iconSet => {
  const [state, setState] = useSetState(initialState)

  iconSet = clone(iconSet)
  iconSet.variants = iconSet.prefixes ?? iconSet.suffixes ?? {}

  iconSet.has = {
    categories: has(iconSet.categories),
    prefixes: has(iconSet.prefixes),
    variants: has(iconSet.variants)
  }

  iconSet.icons = wrapIcons(
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

  useDeepCompareEffect(
    () => setState(initialState),
    [iconSet.categories, iconSet.prefixes, iconSet.suffixes]
  )

  return (
    <Grid
      footerRight={
        (iconSet.has.variants || iconSet.has.categories || null) && (
          <Icon
            listbox={{
              ...(iconSet.has.variants && {
                [pluralize(iconSet.variants, 'variant')]: Object.entries(iconSet.variants).map(
                  ([variant, title, isSelected = state.variant === variant]) => ({
                    isSelected,
                    onPress: () => setState({ variant: !isSelected && variant }),
                    title
                  })
                )
              }),
              ...(iconSet.has.categories && {
                [pluralize(iconSet.categories, 'category')]: Object.keys(iconSet.categories).map(
                  category => {
                    const isSelected = state.category === category

                    return {
                      isSelected,
                      onPress: () => setState({ category: !isSelected && category }),
                      title: category
                    }
                  }
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
            name={equal(state, initialState) ? 'filter' : 'filter-filled'}
          />
        )
      }
      icons={iconSet.icons.current}
    />
  )
}
