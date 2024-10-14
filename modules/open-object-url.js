import { delay } from '../aliases'

export default async obj => {
  const url = URL.createObjectURL(obj)

  if (open(url)) {
    await delay('1m')
    URL.revokeObjectURL(url)
  }
}
