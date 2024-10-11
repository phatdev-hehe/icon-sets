import { parseIconSet, quicklyValidateIconSet } from '@iconify/utils'
import { useAsyncEffect, useRafState } from 'ahooks'
import { sentenceCase } from 'change-case'
import { difference } from 'es-toolkit'
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

import {
  collections,
  delay,
  getAll,
  has,
  idb,
  is,
  JSZip,
  mapObject,
  mapObjectSkip,
  pkg,
  pluralize,
  semver,
  toast,
  useIsFirstRender
} from '../aliases'

export default {
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
            id: `${iconSet.prefix}:${name}`,
            name,
            prefix: iconSet.prefix,
            setName: iconSet.name
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
            Actions: [
              {
                description: latest,
                onPress: async () => this.clear(await isOutdated()),
                title: 'Update'
              }
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
