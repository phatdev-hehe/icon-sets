import { saveAs } from 'file-saver'

import { bytes, Icon, toast } from '../aliases'

export default async (data, filename) => {
  const currentToast = toast(filename, {
    description: 'Preparing to download',
    duration: Number.POSITIVE_INFINITY
  })

  data = [await data, filename]

  saveAs(...data)

  currentToast.update({
    action: <Icon name='arrow-small-down' onPress={() => saveAs(...data)} tooltip='Download' />,
    description: bytes(data[0])
  })
}
