import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import IntegersTool from './tools/IntegersTool'
import RatioSharingTool from './tools/RatioSharingTool'
import SimplifyingRatiosTool from './tools/SimplifyingRatiosTool'
// import DoubleBracketsTool from './tools/DoubleBracketsTool'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/integers" element={<IntegersTool />} />
      <Route path="/ratio-sharing" element={<RatioSharingTool />} />
      <Route path="/simplifying-ratios" element={<SimplifyingRatiosTool />} />
      {/* <Route path="/double-brackets" element={<DoubleBracketsTool />} /> */}
    </Routes>
  )
}

export default App
