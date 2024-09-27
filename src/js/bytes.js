import bytes from 'bytes'

export default value => bytes(value, { decimalPlaces: 1, unitSeparator: ' ' })
