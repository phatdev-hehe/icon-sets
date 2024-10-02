import { saveAs } from 'file-saver'

import { bytes, Icon, toast } from '../aliases'

export default async (data, filename) => {
  const currentToast = toast(filename, {
    description: 'Preparing to download',
    duration: Number.POSITIVE_INFINITY
  })

  data = await data

  const download = () => saveAs(data, filename)

  download()

  currentToast.update({
    action: <Icon name='arrow-small-down' onPress={download} tooltip='Download' />,
    description: bytes(data)
  })
}
