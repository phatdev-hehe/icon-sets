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

import { parseIconSet, quicklyValidateIconSet } from '@iconify/utils'
import { cn, Spinner } from '@nextui-org/react'
import { useAsyncEffect, useRafState } from 'ahooks'
import * as _ from 'es-toolkit'
import { sort } from 'fast-sort'
import * as idb from 'idb-keyval'
import mapObject, { mapObjectSkip } from 'map-obj'
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
import { createRoot } from 'react-dom/client'
import { useFirstRender, useWindowSize } from 'react-haiku'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useLockBodyScroll } from 'react-use'
import semver from 'semver'
import sortKeys from 'sort-keys'

import {
  asyncValue,
  bytes,
  delay,
  EndlessIcons,
  FilterIcons,
  getAll,
  getBookmarkIcons,
  getRecentlyViewedIcons,
  Grid,
  has,
  is,
  JSZip,
  Listbox,
  number,
  Page,
  pluralize,
  RecentlyViewedIcons,
  relativeTime,
  SearchIcons,
  Theme,
  toast
} from '../aliases'
import pkg from '../package.json'
import './app.css'

import collections from '/node_modules/@iconify/json/collections.json'

const iconSets = {
  async clear(clear = true) {
    if (clear) await idb.clear()

    toast('The page will be reloaded in 5 seconds')

    await delay('5s')

    location.reload()
  },
  load() {
    const isFirstRender = useFirstRender()
    const windowSize = useWindowSize()
    const [state, setState] = useRafState(true)
    const all = getAll()

    useAsyncEffect(async () => {
      if ([isFirstRender, isBrowser, isDesktop, ...Object.values(JSZip.support)].some(is.falsy)) {
        const section = (title, items) => ({
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
            ...section('Default', [
              ['First render', isFirstRender],
              ['Browser', isBrowser],
              ['Desktop', isDesktop]
            ]),
            ...section(`JSZip ${JSZip.version}`, Object.entries(JSZip.support))
          }
        })
      }

      if (await this.version.isNotFound()) return await this.version.check()

      if (await this.version.isValid()) {
        if (await this.version.isOutdated()) await this.version.check()

        setState()
      } else {
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
        await idb.set('version', 'not_found')

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
                  suffixes: iconSet.suffixes
                })
              }
            )
          )

          await idb.update('version', () => this.version.latest)
          ;(await this.version.isOutdated()) ? await this.version.check() : setState()
        } catch {
          await this.version.check()
        } finally {
          currentToast.dismiss
        }
      }
    }, [])

    useAsyncEffect(async () => {
      if (state) return

      const iconSets = mapObject(Object.fromEntries(await idb.entries()), (key, iconSet) => {
        if (key === 'version') return mapObjectSkip

        iconSet.icons = Object.entries(iconSet.icons).map(([name, data]) => ({
          data,
          id: `${iconSet.prefix}:${name}`,
          name,
          prefix: iconSet.prefix,
          setName: iconSet.name
        }))

        return [key, iconSet]
      })

      all.set(draft => {
        draft.icons = Object.values(iconSets).flatMap(iconSet => iconSet.icons)
        draft.iconSets = iconSets
        draft.state = !state
      })
    }, [state])
  },
  get version() {
    const current = async () => await idb.get('version')
    const latest = semver.valid(semver.coerce(pkg.dependencies['@iconify/json']))

    const difference = async () => {
      const keys = _.difference(['version', ...Object.keys(collections)], await idb.keys())

      return mapObject(collections, (key, value) =>
        keys.includes(key) ? [key, value] : mapObjectSkip
      )
    }

    const isOutdated = async () => (await current()) !== latest || has(await difference())

    const check = async () =>
      toast('Version check', {
        duration: Number.POSITIVE_INFINITY,
        listbox: {
          [latest]: [{ onPress: async () => this.clear(await isOutdated()), title: 'Update now' }],
          'Missing icon sets': Object.values(await difference()).map(iconSet => ({
            description: iconSet.author.name,
            title: iconSet.name
          }))
        }
      })

    return {
      check,
      current,
      difference,
      isNotFound: async () => (await current()) === 'not_found',
      isOutdated,
      isValid: async () => semver.valid(await current()),
      latest
    }
  }
}

const App = () => {
  const bookmarkIcons = getBookmarkIcons()
  const recentlyViewedIcons = getRecentlyViewedIcons()
  const [state, setState] = useRafState(0)
  const all = getAll()

  iconSets.load()
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
                    [asyncValue(iconSets.version.current)]: [
                      [pluralize(all.iconSets, 'icon set'), all.icons],
                      ['Endless scrolling', 'Hehe'],
                      ['Bookmarks', bookmarkIcons.state],
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
                        onPress: iconSets.clear,
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
                {state === 2 && <Grid icons={bookmarkIcons.state} />}
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

createRoot(document.getElementById('root')).render(<App />)
