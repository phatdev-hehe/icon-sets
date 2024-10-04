import { parseIconSet, quicklyValidateIconSet } from '@iconify/utils'
import { useAsyncEffect, useRafState } from 'ahooks'
import { sentenceCase } from 'change-case'
import * as _ from 'es-toolkit'
import * as idb from 'idb-keyval'
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
import semver from 'semver'

import {
  delay,
  getAll,
  has,
  is,
  JSZip,
  mapObject,
  mapObjectSkip,
  pluralize,
  toast,
  useIsFirstRender
} from '../aliases'
import pkg from '../package.json'

import collections from '/node_modules/@iconify/json/collections.json'

export default {
  clear: async (clear = true) => {
    if (clear) await idb.clear()

    toast('The page will be reloaded in 5 seconds')

    await delay('5s')

    location.reload()
  },
  load() {
    const isFirstRender = useIsFirstRender()
    const windowSize = useWindowSize()
    const [state, setState] = useRafState(true)
    const all = getAll()

    const createEffect = fn => {
      if (all.state) return () => Promise

      return fn
    }

    useAsyncEffect(
      createEffect(async () => {
        if ([isFirstRender, isBrowser, isDesktop, ...Object.values(JSZip.support)].some(is.falsy)) {
          const createSection = (title, items) => ({
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
              ...createSection('Default', [
                ['First render', isFirstRender],
                ['Browser', isBrowser],
                ['Desktop', isDesktop]
              ]),
              ...createSection(`JSZip ${JSZip.version}`, Object.entries(JSZip.support))
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
            currentToast.dismiss()
          }
        }
      }),
      []
    )

    useAsyncEffect(
      createEffect(async () => {
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

          iconSet.suffixes = mapObject(iconSet.suffixes ?? {}, (key, value) => [
            key,
            sentenceCase(value)
          ])

          return [key, iconSet]
        })

        all.set(draft => {
          draft.icons = Object.values(iconSets).flatMap(iconSet => iconSet.icons)
          draft.iconSets = iconSets
          draft.state = !state
        })
      }),
      [state]
    )
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
