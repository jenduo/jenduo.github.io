import { useEffect } from 'react'
import { Terminal } from './terminal/Terminal'
import { driftDelay } from './terminal/desk'
import './styles/terminal.css'

export default function App() {
  // The desk light wanders on a fixed path in CSS. This only decides where in
  // that path a visitor arrives, so no two arrivals look the same.
  useEffect(() => {
    document.body.style.setProperty('--drift-delay', driftDelay())
  }, [])

  return <Terminal />
}
