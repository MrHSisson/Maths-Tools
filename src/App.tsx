import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import IntegersTool from './tools/IntegersTool'
import RatioSharingTool from './tools/RatioSharingTool'
import SimplifyingRatiosTool from './tools/SimplifyingRatiosTool'
import CircleProperties from './tools/CircleProperties'
import CompletingTheSquare from './tools/CompletingTheSquare'
import EstimationTool from './tools/EstimationTool'
import ExpandingDoubleBracketsFOIL from './tools/ExpandingDoubleBracketsFOIL'
import ExpandingDoubleBracketsGRID from './tools/ExpandingDoubleBracketsGRID'
import ExpandingSingleBracketsFOIL from './tools/ExpandingSingleBracketsFOIL'
import ExpandingSingleBracketsGRID from './tools/ExpandingSingleBracketsGRID'
import IterationTool from './tools/IterationTool'
import RecipesTool from './tools/RecipesTool'
import TimesTablesGenerator from './tools/TimesTablesGenerator';
import NegativeOperationsGenerator from './tools/NegativeOperationsGenerator';
import FractionToRatio from './tools/FractionToRatio';
import PowersOfTen from './tools/PowersOfTen';
import PerimeterTool from './tools/PerimeterTool';
import FractionsOfAmounts from './tools/FractionsOfAmounts';


function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/integers" element={<IntegersTool />} />
      <Route path="/ratio-sharing" element={<RatioSharingTool />} />
      <Route path="/simplifying-ratios" element={<SimplifyingRatiosTool />} />
      <Route path="/expanding-double-brackets-grid" element={<ExpandingDoubleBracketsGRID />} />
      <Route path="/circle-properties" element={<CircleProperties />} />
      <Route path="/completing-the-square" element={<CompletingTheSquare />} />
      <Route path="/estimation" element={<EstimationTool />} />
      <Route path="/expanding-double-brackets-foil" element={<ExpandingDoubleBracketsFOIL />} />
      <Route path="/expanding-single-brackets-foil" element={<ExpandingSingleBracketsFOIL />} />
      <Route path="/expanding-single-brackets-grid" element={<ExpandingSingleBracketsGRID />} />
      <Route path="/iteration" element={<IterationTool />} />
      <Route path="/recipes" element={<RecipesTool />} />
      <Route path="/timestables" element={<TimesTablesGenerator />} />
      <Route path="/negative-operations" element={<NegativeOperationsGenerator />} />
      <Route path="/fraction-to-ratio" element={<FractionToRatio />} />
      <Route path="/powers-of-ten" element={<PowersOfTen />} />
      <Route path="/perimeter" element={<PerimeterTool />} />
      <Route path="/fractions-of-amounts" element={<FractionsOfAmounts />} />
    </Routes>
  )
}

export default App
