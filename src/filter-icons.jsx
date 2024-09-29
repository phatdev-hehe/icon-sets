import { useDeepCompareEffect, useSetState } from 'ahooks'

import { clone, equal, Grid, has, Icon, is, pluralize, wrapIcons } from '../aliases'

export default iconSet => {
  const initialState = { category: null, variant: null }
  const [state, setState] = useSetState(initialState)

  iconSet = clone(iconSet)
  iconSet.variants = iconSet.prefixes ?? iconSet.suffixes ?? {}
  iconSet.has = { categories: has(iconSet.categories), variants: has(iconSet.variants) }

  iconSet.icons = wrapIcons(
    iconSet.icons.filter(icon => {
      const matchesVariant = (variant = state.variant) =>
        icon.name[iconSet.prefixes ? 'startsWith' : 'endsWith'](
          iconSet.prefixes ? `${variant}-` : `-${variant}`
        )

      return (
        (!is.string(state.category) || iconSet.categories?.[state.category]?.includes(icon.name)) &&
        (!is.string(state.variant) ||
          (state.variant === ''
            ? !Object.keys(iconSet.variants).some(matchesVariant)
            : matchesVariant()))
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
                  ([variant, title, isActive = state.variant === variant]) => ({
                    isActive,
                    onPress: () => setState({ variant: !isActive && variant }),
                    title
                  })
                )
              }),
              ...(iconSet.has.categories && {
                [pluralize(iconSet.categories, 'category')]: Object.keys(iconSet.categories).map(
                  category => {
                    const isActive = state.category === category

                    return {
                      isActive,
                      onPress: () => setState({ category: !isActive && category }),
                      title: category
                    }
                  }
                )
              }),
              Download: [
                {
                  isDisabled: !iconSet.icons.count,
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
