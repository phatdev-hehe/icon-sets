// han che dung es-toolkit (con loi nhieu)
// kt keyword thua thieu (new, async/await,...)
// cac dieu kien them khi xu ly icons (0 icons, 1 icon, 2 icons)

// khi goi setState() thi
// setState(state => state), luc nay state luon la gia tri moi
// https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state

// quy uoc dat ten tham so
// icon => currentIcon => currentIcon.name === icon.name

// tim hieu them
// https://eslint-react.xyz/docs/rules/no-unstable-context-value
// https://eslint-react.xyz/docs/rules/no-unstable-default-props
// https://github.com/sindresorhus/promise-fun
// https://www.npmjs.com/package/async

import { cn, Spinner } from '@nextui-org/react'
import { useRafState } from 'ahooks'
import { sentenceCase } from 'change-case'
import { sort } from 'fast-sort'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useLockBodyScroll } from 'react-use'

import {
  asyncContent,
  bytes,
  EndlessIcons,
  FilterIcons,
  getAll,
  getBookmarkIcons,
  getRecentlyViewedIcons,
  Grid,
  IconGroups,
  is,
  Listbox,
  mapObject,
  Page,
  pluralize,
  RecentlyViewedIcons,
  relativeTime,
  SearchIcons,
  sortKeys,
  Theme,
  title
} from '../aliases'
import app from './index.js'
import './tailwind.css'

export const App = () => {
  const [state, setState] = useRafState(0)
  const all = getAll()
  const bookmarkIcons = getBookmarkIcons()
  const recentlyViewedIcons = getRecentlyViewedIcons()

  app.load()
  useLockBodyScroll(true)

  if (!all.hasData)
    return (
      <Page>
        <Spinner label='Loading…' />
      </Page>
    )

  return (
    <Page>
      <PanelGroup
        className='card !~w-[50rem]/[66rem] lg:~lg:!~h-[50rem]/[38rem]'
        direction='horizontal'>
        <Panel className='py-1' defaultSize={25} maxSize={25}>
          <Theme
            render={({ resolvedTheme, setTheme }) => (
              <Listbox
                sections={{
                  [asyncContent(app.version.current)]: [
                    [pluralize(all.iconSets, 'icon set'), all.icons],
                    ['Endless scrolling'],
                    ['Bookmarks', bookmarkIcons.current],
                    ['Recently viewed', recentlyViewedIcons]
                  ].map(([title, description = 'No description'], index) => ({
                    description: is.string(description)
                      ? description
                      : pluralize(description, 'icon'),
                    isSelected: index === state,
                    onPress: () => setState(index),
                    title
                  })),
                  ...sortKeys(
                    mapObject(
                      Object.groupBy(Object.values(all.iconSets), iconSet => iconSet.category),
                      (iconSetCategory, iconSets) => [
                        title(iconSetCategory, iconSets),
                        sort(iconSets)
                          .asc('name')
                          .map(iconSet => ({
                            descriptions: [
                              iconSet.author,
                              iconSet.license,
                              pluralize(iconSet.icons, 'icon'),
                              relativeTime(iconSet.lastModified, true)
                            ],
                            isSelected: iconSet.prefix === state,
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
                      title: sentenceCase(resolvedTheme)
                    },
                    {
                      description: 'View source code',
                      href: 'https://github.com/phatdev-hehe/icon-sets',
                      target: 'blank',
                      title: 'GitHub'
                    },
                    {
                      color: 'warning',
                      description: bytes(asyncContent(() => navigator.storage.estimate()).usage),
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
              {state === 0 && <IconGroups />}
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
    </Page>
  )
}
