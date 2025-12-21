import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import IntegersTool from './tools/IntegersTool'
import RatioTool from './tools/RatioTool'
import DoubleBracketsTool from './tools/DoubleBracketsTool'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/integers" element={<IntegersTool />} />
      <Route path="/ratio" element={<RatioTool />} />
      <Route path="/double-brackets" element={<DoubleBracketsTool />} />
    </Routes>
  )
}

export default App
