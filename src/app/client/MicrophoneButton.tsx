import React, { useState } from 'react'
import { Button } from '@mui/material'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import { keyframes } from '@mui/system'
import { styled } from '@mui/material/styles'

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`

interface PulseButtonProps {
  listening: boolean
}

const PulseButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'listening',
})<PulseButtonProps>(({ listening }) => ({
  borderRadius: '50%',
  width: '10vh',
  height: '10vh',
  minWidth: '0',
  padding: '0',
  animation: listening ? `${pulse} 1s infinite` : 'none',
}))

const MicrophoneButton = ({
  toggleListening,
}: {
  toggleListening: () => void
}) => {
  const [listening, setListening] = useState(false)

  const handleToggle = () => {
    setListening(!listening)
    toggleListening()
  }

  return (
    <PulseButton
      variant="contained"
      listening={listening}
      sx={{
        backgroundColor: listening ? 'red' : 'primary.main',
        '&:hover': {
          backgroundColor: listening ? 'darkred' : 'primary.dark',
        },
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        minWidth: '0',
        padding: '0',
        animation: listening ? `${pulse} 1s infinite` : 'none',
      }}
      onClick={handleToggle}
    >
      {listening ? <MicOffIcon /> : <MicIcon />}
    </PulseButton>
  )
}

export default MicrophoneButton
