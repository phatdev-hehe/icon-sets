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

import { parseIconSet, quicklyValidateIconSet } from '@iconify/utils'
import { cn, Spinner } from '@nextui-org/react'
import { useAsyncEffect, useRafState } from 'ahooks'
import { sentenceCase } from 'change-case'
import { difference, groupBy } from 'es-toolkit'
import { sort } from 'fast-sort'
import {
  browserName,
  browserVersion,
  engineName,
  engineVersion,
  isBrowser,
  isDesktop,
  osName,
  osVersion
} from 'react-device-detect'
import { useWindowSize } from 'react-haiku'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useLockBodyScroll } from 'react-use'

import {
  asyncContent,
  bytes,
  collections,
  delay,
  EndlessIcons,
  FilterIcons,
  getAll,
  getBookmarkIcons,
  getRecentlyViewedIcons,
  Grid,
  has,
  IconGroups,
  idb,
  is,
  JSZip,
  Listbox,
  mapObject,
  mapObjectSkip,
  Page,
  pkg,
  pluralize,
  RecentlyViewedIcons,
  relativeTime,
  SearchIcons,
  semver,
  sortKeys,
  Theme,
  title,
  toast,
  useIsFirstRender
} from '../aliases'
import './app.css'

let content = <Spinner label='Loading…' />

const app = {
  clear: async (shouldClear = true) => {
    if (shouldClear) await idb.clear()

    toast('The page will be reloaded in 5 seconds')
    await delay('5s')
    location.reload()
  },
  load() {
    const [state, setState] = useRafState(true)
    const all = getAll()
    const createAsyncEffect = fn => (all.hasData ? () => fn : fn)
    const isFirstRender = useIsFirstRender()
    const windowSize = useWindowSize()

    useAsyncEffect(
      createAsyncEffect(async () => {
        if ([isFirstRender, isBrowser, isDesktop, ...Object.values(JSZip.support)].some(is.falsy)) {
          const createListboxSection = (title, items) => ({
            [title]: items.map(([title, isSupported]) => ({
              description: isSupported ? 'Yes' : 'No',
              isDisabled: !isSupported,
              title
            }))
          })

          return toast('Your browser is not supported', {
            duration: Number.POSITIVE_INFINITY,
            listbox: {
              Info: [
                { description: osVersion, title: osName },
                { description: browserVersion, title: browserName },
                { description: engineVersion, title: engineName },
                { description: `${windowSize.width} x ${windowSize.height}`, title: 'Size' }
              ],
              ...createListboxSection('Default', [
                ['First render', isFirstRender],
                ['Browser', isBrowser],
                ['Desktop', isDesktop]
              ]),
              ...createListboxSection(`JSZip ${JSZip.version}`, Object.entries(JSZip.support))
            }
          })
        }

        if ((await this.version.current()) === 'not_found') return await this.version.check()

        if (await this.version.isValid()) {
          if (await this.version.isOutdated()) await this.version.check()

          return setState()
        }

        const currentToast = toast('Working on updates', {
          description: pluralize(collections, 'icon set'),
          duration: Number.POSITIVE_INFINITY,
          listbox: {
            '': Object.values(collections).map(iconSet => ({
              description: iconSet.author.name,
              title: iconSet.name
            }))
          }
        })

        await idb.clear()
        await idb.set(this.version.key, 'not_found')

        try {
          await Promise.all(
            Object.entries(import.meta.glob('/node_modules/@iconify/json/json/*')).map(
              async ([iconSet, getIconSet]) => {
                if (!(iconSet.slice(33, -5) in collections)) return

                iconSet = quicklyValidateIconSet(await getIconSet())

                if (!iconSet) throw error

                parseIconSet(iconSet, (name, data) => {
                  iconSet.icons[name] = data
                })

                await idb.set(iconSet.prefix, {
                  author: iconSet.info.author.name,
                  categories: iconSet.categories,
                  category: iconSet.info.category ?? 'Uncategorized',
                  icons: iconSet.icons,
                  lastModified: iconSet.lastModified,
                  license: iconSet.info.license.title,
                  name: iconSet.info.name,
                  palette: iconSet.info.palette,
                  prefix: iconSet.prefix,
                  prefixes: iconSet.prefixes,
                  suffixes: iconSet.suffixes,
                  version: iconSet.info.version
                })
              }
            )
          )

          await idb.update(this.version.key, () => {
            setState()

            return this.version.latest
          })
        } catch {
          await this.version.check()
        } finally {
          currentToast.dismiss()
        }
      }),
      []
    )

    useAsyncEffect(
      createAsyncEffect(async () => {
        if (state) return

        const iconSets = mapObject(Object.fromEntries(await idb.entries()), (key, iconSet) => {
          if (key === this.version.key) return mapObjectSkip

          iconSet.icons = Object.entries(iconSet.icons).map(([name, data]) => ({
            data,
            iconSetName: iconSet.name,
            id: `${iconSet.prefix}:${name}`,
            name,
            prefix: iconSet.prefix
          }))

          if (has(iconSet.suffixes))
            iconSet.suffixes = mapObject(iconSet.suffixes, (key, value) => [
              key,
              sentenceCase(value)
            ])

          return [iconSet.prefix, iconSet]
        })

        all.set(draft => {
          draft.hasData = !state
          draft.icons = Object.values(iconSets).flatMap(iconSet => iconSet.icons)
          draft.iconSets = iconSets
        })
      }),
      [state]
    )
  },
  get version() {
    const key = 'version'
    const current = async () => await idb.get(key)
    const latest = semver.valid(semver.coerce(pkg.dependencies['@iconify/json']))

    const diff = async () => {
      const keys = difference(Object.keys(collections), await idb.keys())

      return mapObject(collections, (key, value) =>
        keys.includes(key) ? [key, value] : mapObjectSkip
      )
    }

    const isOutdated = async () => (await current()) !== latest || has(await diff())

    return {
      check: async () =>
        toast('Version check', {
          duration: Number.POSITIVE_INFINITY,
          listbox: {
            [latest]: [
              {
                href: `https://www.npmjs.com/package/@iconify/json/v/${latest}`,
                target: 'blank',
                title: 'View'
              },
              { onPress: async () => this.clear(await isOutdated()), title: 'Update' }
            ],
            'Missing icon sets': Object.values(await diff()).map(iconSet => ({
              description: iconSet.author.name,
              title: iconSet.name
            }))
          }
        }),
      current,
      isOutdated,
      isValid: async () => semver.valid(await current()),
      key,
      latest
    }
  }
}

export const App = () => {
  const [state, setState] = useRafState(0)
  const all = getAll()
  const bookmarkIcons = getBookmarkIcons()
  const recentlyViewedIcons = getRecentlyViewedIcons()

  app.load()
  useLockBodyScroll(true)

  if (all.hasData)
    content = (
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
                      groupBy(Object.values(all.iconSets), iconSet => iconSet.category),
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
    )

  return <Page>{content}</Page>
}
