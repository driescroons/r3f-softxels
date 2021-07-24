import './styles.css'

import { VRCanvas } from '@react-three/xr'
import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

import Controllers from './Controllers'
import { Level } from './Level'

// @ts-ignore
import soundAmbient from 'url:./sounds/ambient.ogg'

function App() {
  useEffect(() => {
    const ambient = new Audio(soundAmbient)
    ambient.loop = true
    ambient.play()
  }, [])

  return (
    <VRCanvas>
      <Level />
      <Controllers />
    </VRCanvas>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
