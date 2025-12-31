import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import IntegersTool from './tools/IntegersTool'
import RatioSharingTool from './tools/RatioSharingTool'
import SimplifyingRatiosTool from './tools/SimplifyingRatiosTool'
import DoubleBracketsTool from './tools/DoubleBracketsTool'
import CircleProperties from './tools/CircleProperties'
import CompletingTheSquare from './tools/CompletingTheSquare'
import EstimationTool from './tools/EstimationTool'
import ExpandingDoubleBracketsFOIL from './tools/ExpandingDoubleBracketsFOIL'


function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/integers" element={<IntegersTool />} />
      <Route path="/ratio-sharing" element={<RatioSharingTool />} />
      <Route path="/simplifying-ratios" element={<SimplifyingRatiosTool />} />
      <Route path="/double-brackets" element={<DoubleBracketsTool />} />
      <Route path="/circle-properties" element={<CircleProperties />} />
      <Route path="/completing-the-square" element={<CompletingTheSquare />} />
      <Route path="/estimation" element={<EstimationTool />} />
      <Route path="/expanding-double-brackets-foil" element={<ExpandingDoubleBracketsFOIL />} />
    </Routes>
  )
}

export default App
