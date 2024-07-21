import { nextui } from '@nextui-org/react'
import * as fluid from 'fluid-tailwind'

module.exports = {
  content: { extract: fluid.extract, files: ['src/*', 'node_modules/@nextui-org/theme/dist/*'] },
  darkMode: 'class',
  plugins: [
    fluid.default,
    require('tailwind-scrollbar'),
    nextui({
      themes: {
        dark: {
          colors: {
            danger: 'orangered',
            focus: 'greenyellow',
            primary: { DEFAULT: 'greenyellow' },
            warning: 'orange'
          }
        },
        light: {
          colors: {
            danger: 'red',
            focus: 'mediumblue',
            primary: { DEFAULT: 'mediumblue' },
            warning: 'darkorange'
          }
        }
      }
    })
  ],
  theme: { fontSize: fluid.fontSize, screens: fluid.screens }
}
