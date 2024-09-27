import { NextUIProvider } from '@nextui-org/react'
import { domAnimation, LazyMotion } from 'framer-motion'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { locale } from './locale'

export const Providers = ({ children }) => (
  <LazyMotion features={domAnimation} strict>
    <ThemeProvider attribute='class' disableTransitionOnChange>
      <NextUIProvider className='flex-center p-6' locale={locale}>
        <BrowserRouter>
          <Routes>
            <Route element={children} path='/' />
          </Routes>
        </BrowserRouter>
      </NextUIProvider>
    </ThemeProvider>
  </LazyMotion>
)
