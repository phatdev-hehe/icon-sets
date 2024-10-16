import { delay, has } from '../aliases'

export default async obj => {
  const url = URL.createObjectURL(obj)

  if (has(open(url))) {
    await delay('1m')
    URL.revokeObjectURL(url)
  }
}
