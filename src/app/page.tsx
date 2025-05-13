'use client'

import React, { useState } from 'react'
import { Container, Typography } from '@mui/material'
import MicrophoneButton from './client/MicrophoneButton'
import TranscriptDisplay from './client/TranscriptDisplay'

const HomePage = () => {
  const [transcript] = useState('')
  const [listening, setListening] = useState(false)

  return (
    <Container maxWidth="lg" className="text-center mt-12">
      <Typography variant="h4" gutterBottom>
        AI Language Exchange Partner
      </Typography>
      <TranscriptDisplay transcript={transcript} listening={listening} />
      <div className="mt-6">
        <MicrophoneButton toggleListening={() => setListening(!listening)} />
      </div>
    </Container>
  )
}

export default HomePage
