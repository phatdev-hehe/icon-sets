import { delay, has } from '../aliases'

export default async obj => {
  const url = globalThis.URL.createObjectURL(obj)

  if (has(globalThis.open(url))) {
    await delay('1m')
    globalThis.URL.revokeObjectURL(url)
  }
}
