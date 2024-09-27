// Code refactoring

// ko dat tham so nhu mot bien
// han che dung es-toolkit (con loi nhieu)
// neu ham goi di goi lai thi viet ra 1 bien duy nhat
// kt keyword thua thieu (new, async/await,...)
// cac dieu kien them khi xu ly icons (0 icons, 1 icon, 2 icons)

// thay vi dung &&, ||, ?:
// thi dung dieu kien if cho de hieu [if (true) a = b]

// khi cap nhat state thi viet [setState(state => state)]
// luc nay state luon la gia tri moi
// https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state

// quy uoc dat ten tham so
// icon => (currentIcon) => currentIcon.name === icon.name
// neu nhu tham so ko biet dat ten thi (p1, p2,...)

// han che dung (destructuring assignment)
// vi (icon.name) de nhin hon (name)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment

// khi can biet 1 object co gia tri hay ko
// thi dung 'has-values' (ko phan biet kieu boolean)

import { parseIconSet, quicklyValidateIconSet } from '@iconify/utils'
import { cn, Spinner } from '@nextui-org/react'
import { useAsyncEffect, useRafState } from 'ahooks'
import * as _ from 'es-toolkit'
import { sort } from 'fast-sort'
import has from 'has-values'
import * as idb from 'idb-keyval'
import mapObject, { mapObjectSkip } from 'map-obj'
import { useTheme } from 'next-themes'
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
import { useFirstRender, useWindowSize } from 'react-haiku'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useLockBodyScroll } from 'react-use'
import semver from 'semver'
import { Toaster } from 'sonner'
import sortKeys from 'sort-keys'

import pkg from '../package.json'
import bytes from './js/bytes'
import delay from './js/delay'
import { EndlessIcons } from './js/endless-icons'
import { FilterIcons } from './js/filter-icons'
import { getAsyncValue } from './js/get-async-value'
import { getAtom } from './js/get-atom'
import { getBookmarkIcons } from './js/get-bookmark-icons'
import { getRelativeTime } from './js/get-relative-time'
import { Grid } from './js/grid'
import { JSZip } from './js/jszip'
import Listbox from './js/listbox'
import { number } from './js/number'
import pluralize from './js/pluralize'
import { Providers } from './js/providers'
import { getRecentlyViewedIcons, RecentlyViewedIcons } from './js/recently-viewed-icons'
import { SearchIcons } from './js/search-icons'
import Stars from './js/stars'
import toast from './js/toast'

import collections from '/node_modules/@iconify/json/collections.json'

const use = {
  modules: {
    iconSets: {
      clear: async (clear = true) => {
        if (clear) await idb.clear()

        toast('The page will be reloaded in 5 seconds')

        await delay('5s')

        location.reload()
      },
      get get() {
        const isFirstRender = useFirstRender()
        const windowSize = useWindowSize()
        const [state, setState] = useRafState(true)
        const atom = getAtom()

        useAsyncEffect(async () => {
          if (
            ![isFirstRender, isBrowser, isDesktop, ...Object.values(JSZip.support)].every(Boolean)
          ) {
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

          const allIconSets = mapObject(Object.fromEntries(await idb.entries()), (key, iconSet) => {
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

          atom.set(draft => {
            draft.allIcons = Object.values(allIconSets).flatMap(iconSet => iconSet.icons)
            draft.allIconSets = allIconSets
            draft.state = !state
          })
        }, [state])

        return null
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
              [latest]: [
                { onPress: async () => this.clear(await isOutdated()), title: 'Update now' }
              ],
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
  }
}

const Comp = {
  Theme: ({ render }) => render(useTheme())
}

export default () => {
  const { iconSets } = use.modules
  const bookmarkIcons = getBookmarkIcons()
  const [state, setState] = useRafState(0)
  const atom = getAtom()

  iconSets.get
  useLockBodyScroll(true)

  return (
    <Providers>
      {atom.state ? (
        <PanelGroup
          className='card !~w-[50rem]/[66rem] lg:~lg:!~h-[50rem]/[38rem]'
          direction='horizontal'>
          <Panel className='py-2' defaultSize={25} maxSize={25}>
            <Comp.Theme
              render={({ resolvedTheme, setTheme }) => (
                <Listbox
                  sections={{
                    [getAsyncValue(iconSets.version.current)]: [
                      [
                        pluralize(atom.allIconSets, 'icon set'),
                        pluralize(atom.allIcons, 'icon', true)
                      ],
                      ['Endless scrolling', 'Hehe'],
                      ['Bookmarks', pluralize(bookmarkIcons.state, 'icon', true)],
                      ['Recently viewed', pluralize(getRecentlyViewedIcons(), 'icon', true)]
                    ].map(([title, description], index) => ({
                      description,
                      isActive: state === index,
                      onPress: () => setState(index),
                      title
                    })),
                    ...sortKeys(
                      mapObject(
                        Object.groupBy(Object.values(atom.allIconSets), ({ category }) => category),
                        (category, iconSets) => [
                          `${category} (${number(iconSets)})`,
                          sort(iconSets)
                            .asc('name')
                            .map(iconSet => ({
                              descriptions: [
                                iconSet.author,
                                iconSet.license,
                                pluralize(iconSet.icons, 'icon', true),
                                getRelativeTime(iconSet.lastModified)
                              ],
                              isActive: state === iconSet.prefix,
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
                        description: bytes(getAsyncValue(() => navigator.storage.estimate()).usage),
                        isActive: true,
                        onPress: iconSets.clear,
                        title: 'Clear data'
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
                {state === 0 && <Grid icons={atom.allIcons} />}
                {state === 1 && <EndlessIcons />}
                {state === 2 && <Grid icons={bookmarkIcons.state} />}
                {state === 3 && <RecentlyViewedIcons />}
                {atom.allIconSets[state] && <FilterIcons {...atom.allIconSets[state]} />}
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
      <Stars />
      <Comp.Theme
        render={({ resolvedTheme }) => (
          <Toaster
            className='z-auto'
            theme={resolvedTheme}
            toastOptions={{
              classNames: {
                content: 'w-full',
                default: 'card justify-between gap-4',
                description: 'text-foreground-500',
                title: 'line-clamp-1'
              }
            }}
          />
        )}
      />
    </Providers>
  )
}
