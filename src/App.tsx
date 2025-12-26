import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import IntegersTool from './tools/IntegersTool'
import RatioSharingTool from './tools/RatioSharingTool'
// import DoubleBracketsTool from './tools/DoubleBracketsTool'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/integers" element={<IntegersTool />} />
      <Route path="/ratio-sharing" element={<RatioSharingTool />} />
      {/* <Route path="/double-brackets" element={<DoubleBracketsTool />} /> */}
    </Routes>
  )
}

export default App
