import { useTheme } from 'next-themes'

export const Theme = ({ render }) => render(useTheme())
