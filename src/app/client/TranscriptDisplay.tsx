import React from 'react'
import { Typography, Box } from '@mui/material'
import { keyframes } from '@mui/system'

const blink = keyframes`
  10%, 100% { opacity: 1; }
  50% { opacity: 0; }
`

const TranscriptDisplay = ({
  transcript,
  listening,
}: {
  transcript: string
  listening: boolean
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: '2px solid',
        borderColor: 'primary.main',
        borderRadius: '8px',
        padding: '16px',
        minHeight: { xs: '50vh', sm: '60vh', md: '70vh' },
        marginBottom: '20px',
        width: { xs: '95%', sm: '90%', md: '95%' },
        maxWidth: '1000px',
        margin: '0 auto',
      }}
    >
      <Typography variant="body1" sx={{ flexGrow: 1 }}>
        {transcript}
      </Typography>
      {listening && (
        <Typography variant="body1" sx={{ animation: `${blink} 2s infinite` }}>
          Listening...
        </Typography>
      )}
    </Box>
  )
}

export default TranscriptDisplay
