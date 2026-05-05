import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import RatioSharingTool from './tools/RatioSharingTool'
import SimplifyingRatiosTool from './tools/SimplifyingRatiosTool'
import RecipesTool from './tools/RecipesTool'
import FractionToRatio from './tools/FractionToRatio';
import FractionsOfAmounts from './tools/FractionsOfAmounts';

//Generators

import TimesTablesGenerator from './tools/Generators/TimesTablesGenerator';
import NegativeOperationsGenerator from './tools/Generators/NegativeOperationsGenerator';
import MultiplicationGenerator from './tools/Generators/MultiplicationGenerator';

//Number

import IntegerAddSub from './tools/Number/IntegerAddSub';
import Estimation from './tools/Number/Estimation';
import PowersOfTen from './tools/Number/PowersOfTen';

//Algebra

import CompletingTheSquare from './tools/Algebra/CompletingTheSquare'
import ExpandingDoubleBracketsFOIL from './tools/Algebra/ExpandingDoubleBracketsFOIL'
import ExpandingDoubleBracketsGRID from './tools/Algebra/ExpandingDoubleBracketsGRID'
import ExpandingSingleBracketsFOIL from './tools/Algebra/ExpandingSingleBracketsFOIL'
import ExpandingSingleBracketsGRID from './tools/Algebra/ExpandingSingleBracketsGRID'
import Iterations from './tools/Algebra/Iterations'
import SimultaneousEquations from './tools/Algebra/SimultaneousEquations';
import NonLinearSimEq from './tools/Algebra/NonLinearSimEq';
import SolvingLinearEquations from './tools/Algebra/SolvingLinearEquations';


//Geometry

import CircleProperties from './tools/Geometry/CircleProperties'
import PerimeterTool from './tools/Geometry/PerimeterTool';
import BasicAngleFacts from './tools/Geometry/BasicAngleFacts';
import AnglesInTriangles from './tools/Geometry/AnglesInTriangles';
import EquationsOfLines from './tools/Geometry/EquationsOfLines';

//Teacher Tools

import Visualiser from './tools/TeacherTools/Visualiser';
import ToolShell from './tools/TeacherTools/ToolShell';
import CallSelector from './tools/TeacherTools/CallSelector';

//Computer Science

import SystemArchitecture from './tools/SystemArchitecture';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/ratio-sharing" element={<RatioSharingTool />} />
      <Route path="/simplifying-ratios" element={<SimplifyingRatiosTool />} />
      <Route path="/recipes" element={<RecipesTool />} />
      <Route path="/fraction-to-ratio" element={<FractionToRatio />} />
      <Route path="/fractions-of-amounts" element={<FractionsOfAmounts />} />

      //Generators

      <Route path="/timestables" element={<TimesTablesGenerator />} />
      <Route path="/negative-operations" element={<NegativeOperationsGenerator />} />
      <Route path="/multiplication-methods" element={<MultiplicationGenerator />} />

      //Number

      <Route path="/integer-add-and-subtract" element={<IntegerAddSub />} />
      <Route path="/estimation" element={<Estimation />} />
      <Route path="/powers-of-ten" element={<PowersOfTen />} />

      //Algebra 

      <Route path="/expanding-double-brackets-grid" element={<ExpandingDoubleBracketsGRID />} />
      <Route path="/completing-the-square" element={<CompletingTheSquare />} />
      <Route path="/expanding-double-brackets-foil" element={<ExpandingDoubleBracketsFOIL />} />
      <Route path="/expanding-single-brackets-foil" element={<ExpandingSingleBracketsFOIL />} />
      <Route path="/expanding-single-brackets-grid" element={<ExpandingSingleBracketsGRID />} />
      <Route path="/iterations" element={<Iterations />} />
      <Route path="/simultaneous-equations-elimination" element={<SimultaneousEquations />} />
      <Route path="/simultaneous-equations-substitution" element={<NonLinearSimEq />} />
      <Route path="/solving-linear-equations" element={<SolvingLinearEquations />} />

      //Geometry
      
      <Route path="/circle-properties" element={<CircleProperties />} />
      <Route path="/perimeter" element={<PerimeterTool />} />
      <Route path="/basic-angle-facts" element={<BasicAngleFacts />} />
      <Route path="/angles-in-triangles" element={<AnglesInTriangles />} />
      <Route path="/equations-of-lines" element={<EquationsOfLines />} />
      
      //Teacher Tools
      
      <Route path="/visualiser" element={<Visualiser />} />
      <Route path="/tool-shell" element={<ToolShell />} />
      <Route path="/call-selector" element={<CallSelector />} />

      //Computer Science

      <Route path="/system-architecure" element={<SystemArchitecture />} />
      
    </Routes>
  )
}

export default App
