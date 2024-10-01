// Code refactoring

// han che dung es-toolkit (con loi nhieu)
// kt keyword thua thieu (new, async/await,...)
// cac dieu kien them khi xu ly icons (0 icons, 1 icon, 2 icons)

// du lieu ko co thi ko can cap nhat lai state
// vd: clear fn (get-bookmark-icons.js)

// can tach bien neu co the
// https://eslint-react.xyz/docs/rules/no-unstable-context-value
// https://eslint-react.xyz/docs/rules/no-unstable-default-props
// https://ahooks.js.org/hooks/use-creation/ (neu nhu tach bien ko dc)

// neu ham goi di goi lai
// thi viet ra 1 bien duy nhat

// cap nhat state
// setState(state => state), luc nay state luon la gia tri moi
// https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state

// quy uoc dat ten tham so
// icon => currentIcon => currentIcon.name === icon.name

// han che dung (destructuring assignment)
// vi (icon.name) de nhin hon (name)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment

// tim hieu them
// https://github.com/sindresorhus/promise-fun

import { cn, Spinner } from '@nextui-org/react'
import { useRafState } from 'ahooks'
import { sort } from 'fast-sort'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useLockBodyScroll } from 'react-use'

import {
  asyncValue,
  bytes,
  EndlessIcons,
  FilterIcons,
  getAll,
  getBookmarkIcons,
  getRecentlyViewedIcons,
  Grid,
  is,
  Listbox,
  mapObject,
  number,
  Page,
  pluralize,
  RecentlyViewedIcons,
  relativeTime,
  SearchIcons,
  sortKeys,
  Theme
} from '../aliases'
import './index.css'
import app from './index.js'

export const App = () => {
  const bookmarkIcons = getBookmarkIcons()
  const recentlyViewedIcons = getRecentlyViewedIcons()
  const [state, setState] = useRafState(0)
  const all = getAll()

  app.load()
  useLockBodyScroll(true)

  return (
    <Page>
      {all.state ? (
        <PanelGroup
          className='card !~w-[50rem]/[66rem] lg:~lg:!~h-[50rem]/[38rem]'
          direction='horizontal'>
          <Panel className='py-1' defaultSize={25} maxSize={25}>
            <Theme
              render={({ resolvedTheme, setTheme }) => (
                <Listbox
                  sections={{
                    [asyncValue(app.version.current)]: [
                      [pluralize(all.iconSets, 'icon set'), all.icons],
                      ['Endless scrolling', 'Hehe'],
                      ['Bookmarks', bookmarkIcons.current],
                      ['Recently viewed', recentlyViewedIcons]
                    ].map(([title, description], index) => ({
                      description: is.string(description)
                        ? description
                        : pluralize(description, 'icon', true),
                      isSelected: state === index,
                      onPress: () => setState(index),
                      title
                    })),
                    ...sortKeys(
                      mapObject(
                        Object.groupBy(Object.values(all.iconSets), ({ category }) => category),
                        (category, iconSets) => [
                          `${category} (${number(iconSets)})`,
                          sort(iconSets)
                            .asc('name')
                            .map(iconSet => ({
                              descriptions: [
                                iconSet.author,
                                iconSet.license,
                                pluralize(iconSet.icons, 'icon', true),
                                relativeTime(iconSet.lastModified)
                              ],
                              isSelected: state === iconSet.prefix,
                              onPress: () => setState(iconSet.prefix),
                              title: (
                                <div className={cn({ 'italic underline': iconSet.palette })}>
                                  {iconSet.name}
                                </div>
                              )
                            }))
                        ]
                      )
                    ),
                    Settings: [
                      {
                        description: 'Toggle theme',
                        onPress: () => setTheme({ dark: 'light', light: 'dark' }[resolvedTheme]),
                        title: { dark: 'Dark', light: 'Light' }[resolvedTheme]
                      },
                      {
                        description: 'View source code',
                        href: 'https://github.com/phatdev-hehe/icon-sets',
                        target: 'blank',
                        title: 'GitHub'
                      },
                      {
                        color: 'warning',
                        description: bytes(asyncValue(() => navigator.storage.estimate()).usage),
                        isSelected: true,
                        onPress: app.clear,
                        title: 'Clear cache'
                      }
                    ]
                  }}
                />
              )}
            />
          </Panel>
          <PanelResizeHandle />
          <Panel>
            <PanelGroup direction='vertical'>
              <Panel>
                {state === 0 && <Grid icons={all.icons} />}
                {state === 1 && <EndlessIcons />}
                {state === 2 && <Grid icons={bookmarkIcons.current} />}
                {state === 3 && <RecentlyViewedIcons />}
                {is.string(state) && <FilterIcons {...all.iconSets[state]} />}
              </Panel>
              <PanelResizeHandle />
              <Panel>
                <SearchIcons />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      ) : (
        <Spinner label='Loading…' />
      )}
    </Page>
  )
}
