'use client'

import React, { useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { IconButton } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#ffffff',
    },
    text: {
      primary: '#000000',
    },
  },
})

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
    },
    text: {
      primary: '#ffffff',
    },
  },
})

const ThemeToggle = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false)

  const toggleTheme = () => {
    setDarkMode((prevMode: boolean) => {
      const newMode = !prevMode
      return newMode
    })
  }

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <IconButton
        style={{ position: 'absolute', top: 10, right: 10 }}
        onClick={toggleTheme}
        color="inherit"
      >
        {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
      {children}
    </ThemeProvider>
  )
}

export default ThemeToggle
