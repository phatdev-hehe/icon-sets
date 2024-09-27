import fluid, { extract, fontSize, screens } from 'fluid-tailwind'

module.exports = {
  content: { extract, files: ['src/**', 'node_modules/@nextui-org/theme/dist/*'] },
  darkMode: 'class',
  plugins: [
    fluid,
    require('tailwind-scrollbar'),
    require('@nextui-org/react').nextui({
      themes: {
        dark: {
          colors: {
            danger: 'orangered',
            focus: 'cyan',
            primary: { DEFAULT: 'cyan' },
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
  theme: { fontSize, screens }
}
