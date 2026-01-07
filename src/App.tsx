import { useState } from 'react'
import './App.css'
import PoseWebcam from "./components/PoseWebcam";

function App() {

  return (
    <div style={{ padding: 16 }}>
      <PoseWebcam />
    </div>
  )
}

export default App
