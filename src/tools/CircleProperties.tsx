import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// ===== TYPE DEFINITIONS =====
type WorkingStep = {
  type: string;
  text?: string;
  textPi?: string;
  textNumeric?: string;
  answerPi?: string;
  answerNumeric?: string;
  answer?: string;
};

type QuestionType = {
  level: number;
  diameter: number;
  radius: number;
  given: string;
  find: string;
  displayQuestion: string;
  angle: number;
  type: string;
  circumference?: string;
  circumferenceNumeric?: number;
  circumferencePi?: string;
  area?: string;
  areaNumeric?: number;
  areaPi?: string;
  answer?: string;
  working?: WorkingStep[];
  theta?: number;
  questionStyle?: string;
  difficulty?: string;
  answerNumeric?: string;
  answerPi?: string;
};

type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';
type DifficultyLevel = 'level1' | 'level2' | 'level3';
type Mode = 'whiteboard' | 'single' | 'worksheet';
type QuestionTypeString = 'circumference' | 'area' | 'sectors';
type SectorStyle = 'mixed' | 'area' | 'arcLength' | 'perimeter';

export default function CirclePropertiesTool() {
  const navigate = useNavigate();
  const PI = 3.142592;
  
  // ===== STATE =====
  const [mode, setMode] = useState<Mode>('whiteboard');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('level1');
  const [questionType, setQuestionType] = useState<QuestionTypeString>('circumference');
  const [sectorQuestionStyle, setSectorQuestionStyle] = useState<SectorStyle>('mixed');
  
  const [whiteboardQuestion, setWhiteboardQuestion] = useState<QuestionType | null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState<boolean>(false);
  
  const [question, setQuestion] = useState<QuestionType | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [worksheet, setWorksheet] = useState<QuestionType[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState<boolean>(false);
  const [isDifferentiated, setIsDifferentiated] = useState<boolean>(false);
  const [numColumns, setNumColumns] = useState<number>(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState<number>(1);
  
  const [allowDecimals, setAllowDecimals] = useState<boolean>(false);
  const [answerInPi, setAnswerInPi] = useState<boolean>(false);
  
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // ===== HELPER FUNCTIONS =====
  const formatNumber = (num: number | string): string => {
    if (typeof num === 'string') return num;
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
  };

  // ===== COLOR SCHEME HELPERS =====
  const getQuestionBg = (): string => {
    if (colorScheme === 'blue') return '#D1E7F8';
    if (colorScheme === 'pink') return '#F8D1E7';
    if (colorScheme === 'yellow') return '#F8F4D1';
    return '#ffffff';
  };

  const getStepBg = (): string => {
    if (colorScheme === 'blue') return '#B3D9F2';
    if (colorScheme === 'pink') return '#F2B3D9';
    if (colorScheme === 'yellow') return '#F2EBB3';
    return '#f3f4f6';
  };

  const getWhiteboardWorkingBg = (): string => {
    if (colorScheme === 'blue') return '#B3D9F2';
    if (colorScheme === 'pink') return '#F2B3D9';
    if (colorScheme === 'yellow') return '#F2EBB3';
    return '#f3f4f6';
  };

  const getFinalAnswerBg = (): string => {
    if (colorScheme === 'blue') return '#B3D9F2';
    if (colorScheme === 'pink') return '#F2B3D9';
    if (colorScheme === 'yellow') return '#F2EBB3';
    return '#f3f4f6';
  };

  const getDiagramLabelBg = (): string => {
    if (colorScheme === 'blue') return '#D1E7F8';
    if (colorScheme === 'pink') return '#F8D1E7';
    if (colorScheme === 'yellow') return '#F8F4D1';
    return '#ffffff';
  };
  
  const getInfoBoxBg = (levelOverride?: DifficultyLevel): string => {
    if (levelOverride === 'level1') return '#DCFCE7';
    if (levelOverride === 'level2') return '#FEF9C3';
    if (levelOverride === 'level3') return '#FEE2E2';
    if (colorScheme === 'blue') return '#E0F2FE';
    if (colorScheme === 'pink') return '#FCE7F3';
    if (colorScheme === 'yellow') return '#FEF9C3';
    return '#FFFFFF';
  };

  // ===== FONT SIZE =====
  const fontSizes = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const getFontSize = (): string => fontSizes[worksheetFontSize];

  const renderCircleDiagram = (q: QuestionType, size: number = 400, isWorksheet: boolean = false, fontSizeScale: number = 1, levelOverride?: DifficultyLevel): JSX.Element => {
    if (q.type === 'sector') {
      return renderSectorDiagram(q, size, isWorksheet, fontSizeScale, levelOverride);
    }
    
    const centerY = size / 2;
    const circleRadius = size * 0.35;
    const angleRad = (q.angle * Math.PI) / 180;
    
    const diamLabelY = centerY + Math.sin(angleRad) * circleRadius * 0.3;
    const radLabelY = centerY + Math.sin(angleRad) * circleRadius * 0.5;
    
    const fontSize = isWorksheet ? Math.max(16, 18 * fontSizeScale) : 24;
    const belowLabelFontSize = isWorksheet ? Math.max(18, 22 * fontSizeScale) : 26;
    
    const boxHeight = isWorksheet ? belowLabelFontSize * 1.8 : 0;
    const boxPadding = isWorksheet ? belowLabelFontSize * 0.8 : 0;
    const boxSpacing = isWorksheet ? boxHeight * 0.15 : 0;
    const firstBoxY = centerY + circleRadius + (isWorksheet ? size * 0.12 : 35);
    
    let infoBoxes: string[] = [];
    if (q.given === 'diameter' || q.find === 'diameter') {
      infoBoxes.push(q.given === 'diameter' ? `d = ${formatNumber(q.diameter)} cm` : 'd = ?');
    }
    if (q.given === 'radius' || q.find === 'radius') {
      infoBoxes.push(q.given === 'radius' ? `r = ${formatNumber(q.radius)} cm` : 'r = ?');
    }
    if (q.given === 'circumference') {
      infoBoxes.push(`C = ${q.circumference} cm`);
    }
    if (q.given === 'area') {
      infoBoxes.push(`A = ${q.area} cm²`);
    }
    
    const maxTextLength = Math.max(...infoBoxes.map(info => info.length));
    const maxBoxWidth = (maxTextLength * belowLabelFontSize * 0.6) + (boxPadding * 2);
    const svgWidth = isWorksheet ? Math.max(size, maxBoxWidth + 20) : size;
    const adjustedCenterX = svgWidth / 2;
    
    const circleCenterX = adjustedCenterX;
    const circleCenterY = centerY;
    const circleRadiusAdjusted = circleRadius;
    
    const diamEndXAdjusted = circleCenterX + Math.cos(angleRad) * circleRadiusAdjusted;
    const diamEndYAdjusted = circleCenterY + Math.sin(angleRad) * circleRadiusAdjusted;
    const diamStartXAdjusted = circleCenterX - Math.cos(angleRad) * circleRadiusAdjusted;
    const diamStartYAdjusted = circleCenterY - Math.sin(angleRad) * circleRadiusAdjusted;
    const radEndXAdjusted = circleCenterX + Math.cos(angleRad) * circleRadiusAdjusted;
    const radEndYAdjusted = circleCenterY + Math.sin(angleRad) * circleRadiusAdjusted;
    
    const diamLabelXAdjusted = circleCenterX + Math.cos(angleRad) * circleRadiusAdjusted * 0.3;
    const radLabelXAdjusted = circleCenterX + Math.cos(angleRad) * circleRadiusAdjusted * 0.5;
    
    const svgHeight = isWorksheet 
      ? firstBoxY + (infoBoxes.length * (boxHeight + boxSpacing)) + boxSpacing 
      : size;
    
    return (
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <circle cx={circleCenterX} cy={circleCenterY} r={circleRadiusAdjusted} fill="none" stroke="#000000" strokeWidth="3" />
        <circle cx={circleCenterX} cy={circleCenterY} r="3" fill="#000000" />
        
        {(q.given === 'diameter' || q.find === 'diameter') && (
          <line x1={diamStartXAdjusted} y1={diamStartYAdjusted} x2={diamEndXAdjusted} y2={diamEndYAdjusted}
            stroke="#000000" strokeWidth="2" strokeDasharray="5,5" />
        )}
        
        {(q.given === 'radius' || q.find === 'radius') && (
          <line x1={circleCenterX} y1={circleCenterY} x2={radEndXAdjusted} y2={radEndYAdjusted}
            stroke="#000000" strokeWidth="2" strokeDasharray="5,5" />
        )}
        
        {!isWorksheet && (q.given === 'diameter' || q.find === 'diameter') && (
          <>
            <rect x={diamLabelXAdjusted - 40} y={diamLabelY - 16} width="80" height="32"
              fill={getDiagramLabelBg()} opacity="0.9" rx="3" />
            <text x={diamLabelXAdjusted} y={diamLabelY} fill="#000000" fontSize={fontSize}
              fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
              {q.given === 'diameter' ? `d = ${formatNumber(q.diameter)}` : 'd = ?'}
            </text>
          </>
        )}
        
        {!isWorksheet && (q.given === 'radius' || q.find === 'radius') && (
          <>
            <rect x={radLabelXAdjusted - 38} y={radLabelY - 16} width="76" height="32"
              fill={getDiagramLabelBg()} opacity="0.9" rx="3" />
            <text x={radLabelXAdjusted} y={radLabelY} fill="#000000" fontSize={fontSize}
              fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
              {q.given === 'radius' ? `r = ${formatNumber(q.radius)}` : 'r = ?'}
            </text>
          </>
        )}
        
        {isWorksheet && infoBoxes.map((info, idx) => {
          const boxY = firstBoxY + (idx * (boxHeight + boxSpacing));
          const estimatedTextWidth = info.length * belowLabelFontSize * 0.6;
          const boxWidth = estimatedTextWidth + (boxPadding * 2);
          const boxX = (svgWidth - boxWidth) / 2;
          const boxFill = getInfoBoxBg(levelOverride);
          
          return (
            <g key={idx}>
              <rect x={boxX} y={boxY} width={boxWidth} height={boxHeight}
                fill={boxFill} stroke="#D1D5DB" strokeWidth="2" rx="4" />
              <text x={adjustedCenterX} y={boxY + boxHeight / 2} fill="#000000"
                fontSize={belowLabelFontSize} fontWeight="bold" textAnchor="middle" 
                dominantBaseline="middle">
                {info}
              </text>
            </g>
          );
        })}
        
        {!isWorksheet && q.given === 'circumference' && (
          <text x={circleCenterX} y={circleCenterY + circleRadiusAdjusted + 45} fill="#000000"
            fontSize={belowLabelFontSize} fontWeight="bold" textAnchor="middle">
            C = {q.circumference} cm
          </text>
        )}
        
        {!isWorksheet && q.given === 'area' && (
          <text x={circleCenterX} y={circleCenterY + circleRadiusAdjusted + 45} fill="#000000"
            fontSize={belowLabelFontSize} fontWeight="bold" textAnchor="middle">
            A = {q.area} cm²
          </text>
        )}
      </svg>
    );
  };

  const renderSectorDiagram = (q: QuestionType, size: number = 400, isWorksheet: boolean = false, fontSizeScale: number = 1, levelOverride?: DifficultyLevel): JSX.Element => {
    const centerX = size / 2;
    const centerY = size / 2;
    const circleRadius = size * 0.35;
    
    const theta = q.theta ?? 90;
    
    let startAngle = 0;
    let endAngle = 0;
    let isTopHalf = false;
    if (theta === 180) {
      isTopHalf = Math.random() > 0.5;
      if (isTopHalf) {
        startAngle = 180;
        endAngle = 0;
      } else {
        startAngle = 0;
        endAngle = 180;
      }
    } else if (theta === 90) {
      startAngle = -90;
      endAngle = 0;
    } else {
      startAngle = -90;
      endAngle = startAngle + theta;
    }
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const startX = centerX + Math.cos(startRad) * circleRadius;
    const startY = centerY + Math.sin(startRad) * circleRadius;
    const endX = centerX + Math.cos(endRad) * circleRadius;
    const endY = centerY + Math.sin(endRad) * circleRadius;
    
    const largeArcFlag = theta > 180 ? 1 : 0;
    
    let labelText = '';
    let labelAngle = 0;
    
    if (q.level === 1) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      labelAngle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
      const dimensionLine = { x1: startX, y1: startY, x2: endX, y2: endY };
      const labelX = midX;
      const labelY = midY;
      labelText = `d = ${formatNumber(q.diameter)} cm`;
    } else {
      const midX = (centerX + startX) / 2;
      const midY = (centerY + startY) / 2;
      labelAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);
      const dimensionLine = { x1: centerX, y1: centerY, x2: startX, y2: startY };
      const labelX = midX;
      const labelY = midY;
      labelText = `r = ${formatNumber(q.radius)} cm`;
    }
    
    const belowLabelFontSize = isWorksheet ? Math.max(18, 22 * fontSizeScale) : 26;
    const showTheta = q.level !== 1 && ![90, 180, 270].includes(theta);
    
    const boxHeight = isWorksheet ? belowLabelFontSize * 1.8 : 0;
    const boxPadding = isWorksheet ? belowLabelFontSize * 0.8 : 0;
    const boxSpacing = isWorksheet ? boxHeight * 0.15 : 0;
    const firstBoxY = centerY + circleRadius + (isWorksheet ? size * 0.12 : 35);
    
    let infoBoxes: string[] = [];
    infoBoxes.push(labelText);
    if (showTheta) {
      infoBoxes.push(`θ = ${theta}°`);
    }
    
    const maxTextLength = Math.max(...infoBoxes.map(info => info.length));
    const maxBoxWidth = (maxTextLength * belowLabelFontSize * 0.6) + (boxPadding * 2);
    const svgWidth = isWorksheet ? Math.max(size, maxBoxWidth + 20) : size;
    const adjustedCenterX = svgWidth / 2;
    
    const sectorCenterX = adjustedCenterX;
    const sectorCenterY = centerY;
    
    const startXAdjusted = sectorCenterX + Math.cos(startRad) * circleRadius;
    const startYAdjusted = sectorCenterY + Math.sin(startRad) * circleRadius;
    const endXAdjusted = sectorCenterX + Math.cos(endRad) * circleRadius;
    const endYAdjusted = sectorCenterY + Math.sin(endRad) * circleRadius;
    
    const pathDataAdjusted = [
      `M ${sectorCenterX} ${sectorCenterY}`,
      `L ${startXAdjusted} ${startYAdjusted}`,
      `A ${circleRadius} ${circleRadius} 0 ${largeArcFlag} 1 ${endXAdjusted} ${endYAdjusted}`,
      `Z`
    ].join(' ');
    
    let dimensionLineAdjusted: any = null;
    let labelXAdjusted = 0;
    let labelYAdjusted = 0;
    
    if (q.level === 1) {
      const midX = (startXAdjusted + endXAdjusted) / 2;
      const midY = (startYAdjusted + endYAdjusted) / 2;
      dimensionLineAdjusted = { x1: startXAdjusted, y1: startYAdjusted, x2: endXAdjusted, y2: endYAdjusted };
      labelXAdjusted = midX;
      labelYAdjusted = midY;
    } else {
      const midX = (sectorCenterX + startXAdjusted) / 2;
      const midY = (sectorCenterY + startYAdjusted) / 2;
      dimensionLineAdjusted = { x1: sectorCenterX, y1: sectorCenterY, x2: startXAdjusted, y2: startYAdjusted };
      labelXAdjusted = midX;
      labelYAdjusted = midY;
    }
    
    const svgHeight = isWorksheet 
      ? firstBoxY + (infoBoxes.length * (boxHeight + boxSpacing)) + boxSpacing 
      : size;
    
    return (
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <path d={pathDataAdjusted} fill="#C8E6C9" stroke="#2E7D32" strokeWidth="3" />
        {q.level !== 1 && <circle cx={sectorCenterX} cy={sectorCenterY} r="3" fill="#2E7D32" />}
        
        <line x1={dimensionLineAdjusted.x1} y1={dimensionLineAdjusted.y1} x2={dimensionLineAdjusted.x2} y2={dimensionLineAdjusted.y2}
          stroke="#000000" strokeWidth="2" />
        
        {(() => {
          const dx = dimensionLineAdjusted.x2 - dimensionLineAdjusted.x1;
          const dy = dimensionLineAdjusted.y2 - dimensionLineAdjusted.y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          const unitX = dx / length;
          const unitY = dy / length;
          const perpX = -unitY;
          const perpY = unitX;
          const arrowLength = 10;
          const arrowWidth = 4;
          const arrow1X = dimensionLineAdjusted.x1 + unitX * arrowLength;
          const arrow1Y = dimensionLineAdjusted.y1 + unitY * arrowLength;
          const arrow2X = dimensionLineAdjusted.x2 - unitX * arrowLength;
          const arrow2Y = dimensionLineAdjusted.y2 - unitY * arrowLength;
          
          return (
            <>
              <line x1={dimensionLineAdjusted.x1} y1={dimensionLineAdjusted.y1}
                x2={arrow1X + perpX * arrowWidth} y2={arrow1Y + perpY * arrowWidth}
                stroke="#000000" strokeWidth="2" />
              <line x1={dimensionLineAdjusted.x1} y1={dimensionLineAdjusted.y1}
                x2={arrow1X - perpX * arrowWidth} y2={arrow1Y - perpY * arrowWidth}
                stroke="#000000" strokeWidth="2" />
              <line x1={dimensionLineAdjusted.x2} y1={dimensionLineAdjusted.y2}
                x2={arrow2X + perpX * arrowWidth} y2={arrow2Y + perpY * arrowWidth}
                stroke="#000000" strokeWidth="2" />
              <line x1={dimensionLineAdjusted.x2} y1={dimensionLineAdjusted.y2}
                x2={arrow2X - perpX * arrowWidth} y2={arrow2Y - perpY * arrowWidth}
                stroke="#000000" strokeWidth="2" />
            </>
          );
        })()}
        
        {!isWorksheet && (
          <g transform={`translate(${labelXAdjusted}, ${labelYAdjusted}) rotate(${q.level === 1 ? 0 : labelAngle})`}>
            <rect x="-50" y="-18" width="100" height="36" fill={getDiagramLabelBg()} opacity="0.95" rx="3" />
            <text x="0" y="0" fill="#000000" fontSize="24" fontWeight="bold"
              textAnchor="middle" dominantBaseline="middle">{labelText}</text>
          </g>
        )}
        
        {isWorksheet && infoBoxes.map((info, idx) => {
          const boxY = firstBoxY + (idx * (boxHeight + boxSpacing));
          const estimatedTextWidth = info.length * belowLabelFontSize * 0.6;
          const boxWidth = estimatedTextWidth + (boxPadding * 2);
          const boxX = (svgWidth - boxWidth) / 2;
          const boxFill = getInfoBoxBg(levelOverride);
          
          return (
            <g key={idx}>
              <rect x={boxX} y={boxY} width={boxWidth} height={boxHeight}
                fill={boxFill} stroke="#D1D5DB" strokeWidth="2" rx="4" />
              <text x={adjustedCenterX} y={boxY + boxHeight / 2} fill="#000000"
                fontSize={belowLabelFontSize} fontWeight="bold" textAnchor="middle" 
                dominantBaseline="middle">
                {info}
              </text>
            </g>
          );
        })}
        
        {q.level === 3 && (
          <>
            <path d={`M ${sectorCenterX + Math.cos(startRad) * 25} ${sectorCenterY + Math.sin(startRad) * 25} A 25 25 0 ${theta > 180 ? 1 : 0} 1 ${sectorCenterX + Math.cos(endRad) * 25} ${sectorCenterY + Math.sin(endRad) * 25}`}
              fill="none" stroke="#000000" strokeWidth="2" />
            {(() => {
              const midAngleRad = (startRad + endRad) / 2;
              const labelDistance = 35;
              const thetaLabelX = sectorCenterX + Math.cos(midAngleRad) * labelDistance;
              const thetaLabelY = sectorCenterY + Math.sin(midAngleRad) * labelDistance;
              return (
                <text x={thetaLabelX} y={thetaLabelY} fill="#000000" fontSize="24"
                  fontWeight="bold" textAnchor="middle" dominantBaseline="middle">θ</text>
              );
            })()}
          </>
        )}
        
        {!isWorksheet && showTheta && (
          <text x={sectorCenterX} y={sectorCenterY + circleRadius + 50} fill="#000000"
            fontSize={belowLabelFontSize} fontWeight="bold" textAnchor="middle">θ = {theta}°</text>
        )}
      </svg>
    );
  };

  // ===== QUESTION GENERATION =====
  const generateCircumferenceQuestion = (level: DifficultyLevel, angle: number): QuestionType => {
    if (level === 'level1') {
      const diameter = allowDecimals 
        ? Math.round((Math.random() * 24 + 1) * 10) / 10 
        : Math.floor(Math.random() * 25) + 1;
      const radius = diameter / 2;
      const circumference = diameter * PI;
      const circumferencePi = diameter;
      
      return {
        level: 1, diameter, radius, given: 'diameter', find: 'circumference',
        displayQuestion: `Find the circumference`,
        circumference: answerInPi ? `${formatNumber(circumferencePi)}π` : formatNumber(Math.round(circumference * 10) / 10),
        circumferenceNumeric: Math.round(circumference * 10) / 10,
        circumferencePi: `${formatNumber(circumferencePi)}π`,
        angle, type: 'circumference',
        working: [
          { type: 'given', text: `Diameter (d) = ${formatNumber(diameter)} cm` },
          { type: 'formula', text: 'Circumference = πd' },
          { type: 'substitution', text: `Circumference = π × ${formatNumber(diameter)}` },
          { type: 'calculation', textPi: `Circumference = ${formatNumber(circumferencePi)}π cm`,
            textNumeric: `Circumference = ${formatNumber(diameter)} × 3.142592 = ${formatNumber(Math.round(circumference * 10) / 10)} cm` },
          { type: 'final', answerPi: `${formatNumber(circumferencePi)}π cm`,
            answerNumeric: `${formatNumber(Math.round(circumference * 10) / 10)} cm` }
        ]
      };
    } else if (level === 'level2') {
      const radius = allowDecimals 
        ? Math.round((Math.random() * 24 + 1) * 10) / 10 
        : Math.floor(Math.random() * 25) + 1;
      const diameter = radius * 2;
      const circumference = 2 * PI * radius;
      const circumferencePi = 2 * radius;
      
      return {
        level: 2, diameter, radius, given: 'radius', find: 'circumference',
        displayQuestion: `Find the circumference`,
        circumference: answerInPi ? `${formatNumber(circumferencePi)}π` : formatNumber(Math.round(circumference * 10) / 10),
        circumferenceNumeric: Math.round(circumference * 10) / 10,
        circumferencePi: `${formatNumber(circumferencePi)}π`,
        angle, type: 'circumference',
        working: [
          { type: 'given', text: `Radius (r) = ${formatNumber(radius)} cm` },
          { type: 'formula', text: 'Circumference = 2πr' },
          { type: 'substitution', text: `Circumference = 2 × π × ${formatNumber(radius)}` },
          { type: 'calculation', textPi: `Circumference = ${formatNumber(circumferencePi)}π cm`,
            textNumeric: `Circumference = 2 × 3.142592 × ${formatNumber(radius)} = ${formatNumber(Math.round(circumference * 10) / 10)} cm` },
          { type: 'final', answerPi: `${formatNumber(circumferencePi)}π cm`,
            answerNumeric: `${formatNumber(Math.round(circumference * 10) / 10)} cm` }
        ]
      };
    } else {
      const findWhat = Math.random() > 0.5 ? 'radius' : 'diameter';
      let radius: number, diameter: number, circumference: number, circumferencePi: number;
      
      if (findWhat === 'radius') {
        radius = allowDecimals ? Math.round((Math.random() * 24 + 1) * 10) / 10 : Math.floor(Math.random() * 25) + 1;
        diameter = radius * 2;
        circumference = 2 * PI * radius;
        circumferencePi = 2 * radius;
      } else {
        diameter = allowDecimals ? Math.round((Math.random() * 24 + 1) * 10) / 10 : Math.floor(Math.random() * 25) + 1;
        radius = diameter / 2;
        circumference = PI * diameter;
        circumferencePi = diameter;
      }
      
      const working = findWhat === 'radius' ? [
        { type: 'given', text: `Circumference (C) = ${answerInPi ? `${formatNumber(circumferencePi)}π` : formatNumber(Math.round(circumference * 10) / 10)} cm` },
        { type: 'formula', text: 'Circumference = 2πr' },
        { type: 'rearrange', text: 'r = C ÷ (2π)' },
        { type: 'substitution', textPi: `r = ${formatNumber(circumferencePi)}π ÷ (2π)`,
          textNumeric: `r = ${formatNumber(Math.round(circumference * 10) / 10)} ÷ (2π)` },
        { type: 'calculation', textPi: `r = ${formatNumber(radius)} cm`,
          textNumeric: `r = ${formatNumber(Math.round(circumference * 10) / 10)} ÷ (2 × 3.142592) = ${formatNumber(radius)} cm` },
        { type: 'final', answer: `${formatNumber(radius)} cm` }
      ] : [
        { type: 'given', text: `Circumference (C) = ${answerInPi ? `${formatNumber(circumferencePi)}π` : formatNumber(Math.round(circumference * 10) / 10)} cm` },
        { type: 'formula', text: 'Circumference = πd' },
        { type: 'rearrange', text: 'd = C ÷ π' },
        { type: 'substitution', textPi: `d = ${formatNumber(circumferencePi)}π ÷ π`,
          textNumeric: `d = ${formatNumber(Math.round(circumference * 10) / 10)} ÷ π` },
        { type: 'calculation', textPi: `d = ${formatNumber(diameter)} cm`,
          textNumeric: `d = ${formatNumber(Math.round(circumference * 10) / 10)} ÷ 3.142592 = ${formatNumber(diameter)} cm` },
        { type: 'final', answer: `${formatNumber(diameter)} cm` }
      ];
      
      return {
        level: 3, diameter, radius, given: 'circumference', find: findWhat,
        displayQuestion: `Find the ${findWhat}`,
        circumference: answerInPi ? `${formatNumber(circumferencePi)}π` : formatNumber(Math.round(circumference * 10) / 10),
        circumferenceNumeric: Math.round(circumference * 10) / 10,
        circumferencePi: `${formatNumber(circumferencePi)}π`,
        answer: formatNumber(findWhat === 'radius' ? radius : diameter),
        angle, type: 'circumference', working
      };
    }
  };

  const generateAreaQuestion = (level: DifficultyLevel, angle: number): QuestionType => {
    if (level === 'level1') {
      const radius = allowDecimals ? Math.round((Math.random() * 24 + 1) * 10) / 10 : Math.floor(Math.random() * 25) + 1;
      const diameter = radius * 2;
      const area = PI * radius * radius;
      const areaPi = radius * radius;
      
      return {
        level: 1, diameter, radius, given: 'radius', find: 'area',
        displayQuestion: `Find the area`,
        area: answerInPi ? `${formatNumber(areaPi)}π` : formatNumber(Math.round(area * 10) / 10),
        areaNumeric: Math.round(area * 10) / 10, areaPi: `${formatNumber(areaPi)}π`,
        angle, type: 'area',
        working: [
          { type: 'given', text: `Radius (r) = ${formatNumber(radius)} cm` },
          { type: 'formula', text: 'Area = πr²' },
          { type: 'substitution', text: `Area = π × ${formatNumber(radius)}²` },
          { type: 'simplify', text: `Area = π × ${formatNumber(radius * radius)}` },
          { type: 'calculation', textPi: `Area = ${formatNumber(areaPi)}π cm²`,
            textNumeric: `Area = 3.142592 × ${formatNumber(radius * radius)} = ${formatNumber(Math.round(area * 10) / 10)} cm²` },
          { type: 'final', answerPi: `${formatNumber(areaPi)}π cm²`,
            answerNumeric: `${formatNumber(Math.round(area * 10) / 10)} cm²` }
        ]
      };
    } else if (level === 'level2') {
      const diameter = allowDecimals ? Math.round((Math.random() * 24 + 1) * 10) / 10 : Math.floor(Math.random() * 25) + 1;
      const radius = diameter / 2;
      const area = PI * radius * radius;
      const areaPi = radius * radius;
      
      return {
        level: 2, diameter, radius, given: 'diameter', find: 'area',
        displayQuestion: `Find the area`,
        area: answerInPi ? `${formatNumber(areaPi)}π` : formatNumber(Math.round(area * 10) / 10),
        areaNumeric: Math.round(area * 10) / 10, areaPi: `${formatNumber(areaPi)}π`,
        angle, type: 'area',
        working: [
          { type: 'given', text: `Diameter (d) = ${formatNumber(diameter)} cm` },
          { type: 'findRadius', text: `Radius (r) = d ÷ 2 = ${formatNumber(diameter)} ÷ 2 = ${formatNumber(radius)} cm` },
          { type: 'formula', text: 'Area = πr²' },
          { type: 'substitution', text: `Area = π × ${formatNumber(radius)}²` },
          { type: 'simplify', text: `Area = π × ${formatNumber(radius * radius)}` },
          { type: 'calculation', textPi: `Area = ${formatNumber(areaPi)}π cm²`,
            textNumeric: `Area = 3.142592 × ${formatNumber(radius * radius)} = ${formatNumber(Math.round(area * 10) / 10)} cm²` },
          { type: 'final', answerPi: `${formatNumber(areaPi)}π cm²`,
            answerNumeric: `${formatNumber(Math.round(area * 10) / 10)} cm²` }
        ]
      };
    } else {
      const findWhat = Math.random() > 0.5 ? 'radius' : 'diameter';
      let radius: number, diameter: number, area: number, areaPi: number;
      
      if (findWhat === 'radius') {
        radius = allowDecimals ? Math.round((Math.random() * 24 + 1) * 10) / 10 : Math.floor(Math.random() * 25) + 1;
        diameter = radius * 2;
        area = PI * radius * radius;
        areaPi = radius * radius;
      } else {
        diameter = allowDecimals ? Math.round((Math.random() * 24 + 1) * 10) / 10 : Math.floor(Math.random() * 25) + 1;
        radius = diameter / 2;
        area = PI * radius * radius;
        areaPi = radius * radius;
      }
      
      const working = findWhat === 'radius' ? [
        { type: 'given', text: `Area (A) = ${answerInPi ? `${formatNumber(areaPi)}π` : formatNumber(Math.round(area * 10) / 10)} cm²` },
        { type: 'formula', text: 'Area = πr²' },
        { type: 'rearrange', text: 'r² = A ÷ π' },
        { type: 'substitution', textPi: `r² = ${formatNumber(areaPi)}π ÷ π`,
          textNumeric: `r² = ${formatNumber(Math.round(area * 10) / 10)} ÷ π` },
        { type: 'simplify', textPi: `r² = ${formatNumber(radius * radius)}`,
          textNumeric: `r² = ${formatNumber(Math.round(area * 10) / 10)} ÷ 3.142592 = ${formatNumber(radius * radius)}` },
        { type: 'calculation', text: `r = √${formatNumber(radius * radius)} = ${formatNumber(radius)} cm` },
        { type: 'final', answer: `${formatNumber(radius)} cm` }
      ] : [
        { type: 'given', text: `Area (A) = ${answerInPi ? `${formatNumber(areaPi)}π` : formatNumber(Math.round(area * 10) / 10)} cm²` },
        { type: 'formula', text: 'Area = πr²' },
        { type: 'rearrange', text: 'r² = A ÷ π' },
        { type: 'substitution', textPi: `r² = ${formatNumber(areaPi)}π ÷ π`,
          textNumeric: `r² = ${formatNumber(Math.round(area * 10) / 10)} ÷ π` },
        { type: 'simplify', textPi: `r² = ${formatNumber(radius * radius)}`,
          textNumeric: `r² = ${formatNumber(Math.round(area * 10) / 10)} ÷ 3.142592 = ${formatNumber(radius * radius)}` },
        { type: 'calculation', text: `r = √${formatNumber(radius * radius)} = ${formatNumber(radius)} cm` },
        { type: 'findDiameter', text: `Diameter (d) = 2r = 2 × ${formatNumber(radius)} = ${formatNumber(diameter)} cm` },
        { type: 'final', answer: `${formatNumber(diameter)} cm` }
      ];
      
      return {
        level: 3, diameter, radius, given: 'area', find: findWhat,
        displayQuestion: `Find the ${findWhat}`,
        area: answerInPi ? `${formatNumber(areaPi)}π` : formatNumber(Math.round(area * 10) / 10),
        areaNumeric: Math.round(area * 10) / 10, areaPi: `${formatNumber(areaPi)}π`,
        answer: formatNumber(findWhat === 'radius' ? radius : diameter),
        angle, type: 'area', working
      };
    }
  };

  const generateSectorQuestion = (level: DifficultyLevel, angle: number): QuestionType => {
    let theta = 0;
    let radius = 0;
    let diameter = 0;
    let questionStyle: SectorStyle = sectorQuestionStyle;
    
    if (questionStyle === 'mixed') {
      const styles: SectorStyle[] = ['area', 'perimeter', 'arcLength'];
      questionStyle = styles[Math.floor(Math.random() * styles.length)];
    }
    
    if (level === 'level1') {
      theta = 180;
      diameter = allowDecimals ? Math.round((Math.random() * 24 + 2) * 10) / 10 : Math.floor(Math.random() * 24) + 2;
      radius = diameter / 2;
      
      const area = (PI * radius * radius) / 2;
      const areaPi = (radius * radius) / 2;
      const arcLength = PI * radius;
      const arcLengthPi = radius;
      const perimeter = PI * radius + diameter;
      const perimeterPi = radius;
      
      let displayQuestion = '';
      let answer = '';
      let answerNumeric = '';
      let answerPi = '';
      let working: WorkingStep[] = [];
      
      if (questionStyle === 'area') {
        displayQuestion = 'Find the area of the semi-circle';
        answerNumeric = formatNumber(Math.round(area * 10) / 10);
        answerPi = `${formatNumber(areaPi)}π`;
        answer = answerInPi ? answerPi : answerNumeric;
        working = [
          { type: 'given', text: `Diameter (d) = ${formatNumber(diameter)} cm, θ = 180°` },
          { type: 'findRadius', text: `Radius (r) = d ÷ 2 = ${formatNumber(diameter)} ÷ 2 = ${formatNumber(radius)} cm` },
          { type: 'formula', text: 'Area of sector = (θ/360) × πr²' },
          { type: 'substitution', text: `Area = (180/360) × π × ${formatNumber(radius)}²` },
          { type: 'simplify', text: `Area = (1/2) × π × ${formatNumber(radius * radius)}` },
          { type: 'calculation', textPi: `Area = ${formatNumber(areaPi)}π cm²`,
            textNumeric: `Area = 0.5 × 3.142592 × ${formatNumber(radius * radius)} = ${answerNumeric} cm²` },
          { type: 'final', answerPi: `${answerPi} cm²`, answerNumeric: `${answerNumeric} cm²` }
        ];
      } else if (questionStyle === 'arcLength') {
        displayQuestion = 'Find the arc length of the semi-circle';
        answerNumeric = formatNumber(Math.round(arcLength * 10) / 10);
        answerPi = `${formatNumber(arcLengthPi)}π`;
        answer = answerInPi ? answerPi : answerNumeric;
        working = [
          { type: 'given', text: `Diameter (d) = ${formatNumber(diameter)} cm, θ = 180°` },
          { type: 'findRadius', text: `Radius (r) = d ÷ 2 = ${formatNumber(diameter)} ÷ 2 = ${formatNumber(radius)} cm` },
          { type: 'formula', text: 'Arc length = (θ/360) × 2πr' },
          { type: 'substitution', text: `Arc length = (180/360) × 2 × π × ${formatNumber(radius)}` },
          { type: 'simplify', text: `Arc length = (1/2) × 2 × π × ${formatNumber(radius)}` },
          { type: 'calculation', textPi: `Arc length = ${formatNumber(arcLengthPi)}π cm`,
            textNumeric: `Arc length = ${formatNumber(radius)} × 3.142592 = ${answerNumeric} cm` },
          { type: 'final', answerPi: `${answerPi} cm`, answerNumeric: `${answerNumeric} cm` }
        ];
      } else {
        displayQuestion = 'Find the perimeter of the semi-circle';
        answerNumeric = formatNumber(Math.round(perimeter * 10) / 10);
        answerPi = `${formatNumber(perimeterPi)}π + ${formatNumber(diameter)}`;
        answer = answerInPi ? answerPi : answerNumeric;
        working = [
          { type: 'given', text: `Diameter (d) = ${formatNumber(diameter)} cm, θ = 180°` },
          { type: 'findRadius', text: `Radius (r) = d ÷ 2 = ${formatNumber(diameter)} ÷ 2 = ${formatNumber(radius)} cm` },
          { type: 'formula', text: 'Perimeter = arc length + diameter = (θ/360) × 2πr + d' },
          { type: 'substitution', text: `Perimeter = (180/360) × 2 × π × ${formatNumber(radius)} + ${formatNumber(diameter)}` },
          { type: 'simplify', text: `Perimeter = π × ${formatNumber(radius)} + ${formatNumber(diameter)}` },
          { type: 'calculation', textPi: `Perimeter = ${answerPi} cm`,
            textNumeric: `Perimeter = ${formatNumber(Math.round(arcLength * 10) / 10)} + ${formatNumber(diameter)} = ${answerNumeric} cm` },
          { type: 'final', answerPi: `${answerPi} cm`, answerNumeric: `${answerNumeric} cm` }
        ];
      }
      
      return { level: 1, theta, radius, diameter, displayQuestion, answer, answerNumeric, answerPi,
        questionStyle, angle, type: 'sector', working, given: '', find: '' };
    } else if (level === 'level2') {
      theta = 90;
      diameter = allowDecimals ? Math.round((Math.random() * 24 + 2) * 10) / 10 : Math.floor(Math.random() * 24) + 2;
      radius = diameter / 2;
      
      const area = (PI * radius * radius) / 4;
      const areaPi = (radius * radius) / 4;
      const arcLength = (PI * radius) / 2;
      const arcLengthPi = radius / 2;
      const perimeter = (PI * radius) / 2 + 2 * radius;
      const perimeterPi = radius / 2;
      
      let displayQuestion = '';
      let answer = '';
      let answerNumeric = '';
      let answerPi = '';
      let working: WorkingStep[] = [];
      
      if (questionStyle === 'area') {
        displayQuestion = 'Find the area of the quarter-circle';
        answerNumeric = formatNumber(Math.round(area * 10) / 10);
        answerPi = `${formatNumber(areaPi)}π`;
        answer = answerInPi ? answerPi : answerNumeric;
        working = [
          { type: 'given', text: `Diameter (d) = ${formatNumber(diameter)} cm, θ = 90°` },
          { type: 'findRadius', text: `Radius (r) = d ÷ 2 = ${formatNumber(diameter)} ÷ 2 = ${formatNumber(radius)} cm` },
          { type: 'formula', text: 'Area of sector = (θ/360) × πr²' },
          { type: 'substitution', text: `Area = (90/360) × π × ${formatNumber(radius)}²` },
          { type: 'simplify', text: `Area = (1/4) × π × ${formatNumber(radius * radius)}` },
          { type: 'calculation', textPi: `Area = ${formatNumber(areaPi)}π cm²`,
            textNumeric: `Area = 0.25 × 3.142592 × ${formatNumber(radius * radius)} = ${answerNumeric} cm²` },
          { type: 'final', answerPi: `${answerPi} cm²`, answerNumeric: `${answerNumeric} cm²` }
        ];
      } else if (questionStyle === 'arcLength') {
        displayQuestion = 'Find the arc length of the quarter-circle';
        answerNumeric = formatNumber(Math.round(arcLength * 10) / 10);
        answerPi = `${formatNumber(arcLengthPi)}π`;
        answer = answerInPi ? answerPi : answerNumeric;
        working = [
          { type: 'given', text: `Diameter (d) = ${formatNumber(diameter)} cm, θ = 90°` },
          { type: 'findRadius', text: `Radius (r) = d ÷ 2 = ${formatNumber(diameter)} ÷ 2 = ${formatNumber(radius)} cm` },
          { type: 'formula', text: 'Arc length = (θ/360) × 2πr' },
          { type: 'substitution', text: `Arc length = (90/360) × 2 × π × ${formatNumber(radius)}` },
          { type: 'simplify', text: `Arc length = (1/4) × 2 × π × ${formatNumber(radius)}` },
          { type: 'calculation', textPi: `Arc length = ${formatNumber(arcLengthPi)}π cm`,
            textNumeric: `Arc length = 0.5 × ${formatNumber(radius)} × 3.142592 = ${answerNumeric} cm` },
          { type: 'final', answerPi: `${answerPi} cm`, answerNumeric: `${answerNumeric} cm` }
        ];
      } else {
        displayQuestion = 'Find the perimeter of the quarter-circle';
        answerNumeric = formatNumber(Math.round(perimeter * 10) / 10);
        answerPi = `${formatNumber(perimeterPi)}π + ${formatNumber(2 * radius)}`;
        answer = answerInPi ? answerPi : answerNumeric;
        working = [
          { type: 'given', text: `Diameter (d) = ${formatNumber(diameter)} cm, θ = 90°` },
          { type: 'findRadius', text: `Radius (r) = d ÷ 2 = ${formatNumber(diameter)} ÷ 2 = ${formatNumber(radius)} cm` },
          { type: 'formula', text: 'Perimeter = arc length + 2r = (θ/360) × 2πr + 2r' },
          { type: 'substitution', text: `Perimeter = (90/360) × 2 × π × ${formatNumber(radius)} + 2 × ${formatNumber(radius)}` },
          { type: 'simplify', text: `Perimeter = 0.5 × π × ${formatNumber(radius)} + ${formatNumber(2 * radius)}` },
          { type: 'calculation', textPi: `Perimeter = ${answerPi} cm`,
            textNumeric: `Perimeter = ${formatNumber(Math.round(arcLength * 10) / 10)} + ${formatNumber(2 * radius)} = ${answerNumeric} cm` },
          { type: 'final', answerPi: `${answerPi} cm`, answerNumeric: `${answerNumeric} cm` }
        ];
      }
      
      return { level: 2, theta, radius, diameter, displayQuestion, answer, answerNumeric, answerPi,
        questionStyle, angle, type: 'sector', working, given: '', find: '' };
    } else {
      theta = Math.floor(Math.random() * 359) + 1;
      diameter = allowDecimals ? Math.round((Math.random() * 24 + 2) * 10) / 10 : Math.floor(Math.random() * 24) + 2;
      radius = diameter / 2;
      
      const area = (theta / 360) * PI * radius * radius;
      const areaPi = (theta / 360) * radius * radius;
      const arcLength = (theta / 360) * 2 * PI * radius;
      const arcLengthPi = (theta / 360) * 2 * radius;
      const perimeter = (theta / 360) * 2 * PI * radius + 2 * radius;
      const perimeterPi = (theta / 360) * 2 * radius;
      
      let displayQuestion = '';
      let answer = '';
      let answerNumeric = '';
      let answerPi = '';
      let working: WorkingStep[] = [];
      
      if (questionStyle === 'area') {
        displayQuestion = 'Find the area of the sector';
        answerNumeric = formatNumber(Math.round(area * 10) / 10);
        answerPi = `${formatNumber(Math.round(areaPi * 100) / 100)}π`;
        answer = answerInPi ? answerPi : answerNumeric;
        working = [
          { type: 'given', text: `Diameter (d) = ${formatNumber(diameter)} cm, θ = ${theta}°` },
          { type: 'findRadius', text: `Radius (r) = d ÷ 2 = ${formatNumber(diameter)} ÷ 2 = ${formatNumber(radius)} cm` },
          { type: 'formula', text: 'Area of sector = (θ/360) × πr²' },
          { type: 'substitution', text: `Area = (${theta}/360) × π × ${formatNumber(radius)}²` },
          { type: 'simplify', text: `Area = (${theta}/360) × π × ${formatNumber(radius * radius)}` },
          { type: 'calculation', textPi: `Area = ${answerPi} cm²`,
            textNumeric: `Area = ${formatNumber(theta/360)} × 3.142592 × ${formatNumber(radius * radius)} = ${answerNumeric} cm²` },
          { type: 'final', answerPi: `${answerPi} cm²`, answerNumeric: `${answerNumeric} cm²` }
        ];
      } else if (questionStyle === 'arcLength') {
        displayQuestion = 'Find the arc length of the sector';
        answerNumeric = formatNumber(Math.round(arcLength * 10) / 10);
        answerPi = `${formatNumber(Math.round(arcLengthPi * 100) / 100)}π`;
        answer = answerInPi ? answerPi : answerNumeric;
        working = [
          { type: 'given', text: `Diameter (d) = ${formatNumber(diameter)} cm, θ = ${theta}°` },
          { type: 'findRadius', text: `Radius (r) = d ÷ 2 = ${formatNumber(diameter)} ÷ 2 = ${formatNumber(radius)} cm` },
          { type: 'formula', text: 'Arc length = (θ/360) × 2πr' },
          { type: 'substitution', text: `Arc length = (${theta}/360) × 2 × π × ${formatNumber(radius)}` },
          { type: 'simplify', text: `Arc length = (${theta}/360) × ${formatNumber(2 * radius)} × π` },
          { type: 'calculation', textPi: `Arc length = ${answerPi} cm`,
            textNumeric: `Arc length = ${formatNumber(theta/360)} × 2 × 3.142592 × ${formatNumber(radius)} = ${answerNumeric} cm` },
          { type: 'final', answerPi: `${answerPi} cm`, answerNumeric: `${answerNumeric} cm` }
        ];
      } else {
        displayQuestion = 'Find the perimeter of the sector';
        answerNumeric = formatNumber(Math.round(perimeter * 10) / 10);
        answerPi = `${formatNumber(Math.round(perimeterPi * 100) / 100)}π + ${formatNumber(2 * radius)}`;
        answer = answerInPi ? answerPi : answerNumeric;
        working = [
          { type: 'given', text: `Diameter (d) = ${formatNumber(diameter)} cm, θ = ${theta}°` },
          { type: 'findRadius', text: `Radius (r) = d ÷ 2 = ${formatNumber(diameter)} ÷ 2 = ${formatNumber(radius)} cm` },
          { type: 'formula', text: 'Perimeter = arc length + 2r = (θ/360) × 2πr + 2r' },
          { type: 'substitution', text: `Perimeter = (${theta}/360) × 2 × π × ${formatNumber(radius)} + 2 × ${formatNumber(radius)}` },
          { type: 'simplify', text: `Perimeter = (${theta}/360) × ${formatNumber(2 * radius)} × π + ${formatNumber(2 * radius)}` },
          { type: 'calculation', textPi: `Perimeter = ${answerPi} cm`,
            textNumeric: `Perimeter = ${formatNumber(Math.round(arcLength * 10) / 10)} + ${formatNumber(2 * radius)} = ${answerNumeric} cm` },
          { type: 'final', answerPi: `${answerPi} cm`, answerNumeric: `${answerNumeric} cm` }
        ];
      }
      
      return { level: 3, theta, radius, diameter, displayQuestion, answer, answerNumeric, answerPi,
        questionStyle, angle, type: 'sector', working, given: '', find: '' };
    }
  };

  const generateQuestion = (level: DifficultyLevel): QuestionType => {
    const angle = Math.floor(Math.random() * 24) * 15;
    if (questionType === 'circumference') {
      return generateCircumferenceQuestion(level, angle);
    } else if (questionType === 'area') {
      return generateAreaQuestion(level, angle);
    } else {
      return generateSectorQuestion(level, angle);
    }
  };

  // ===== EVENT HANDLERS =====
  const handleNewWhiteboardQuestion = (): void => {
    setWhiteboardQuestion(generateQuestion(difficulty));
    setShowWhiteboardAnswer(false);
  };

  const handleNewQuestion = (): void => {
    setQuestion(generateQuestion(difficulty));
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = (): void => {
    const questions: any[] = [];
    const usedKeys = new Set<string>();
    
    const generateUniqueQuestion = (lvl: DifficultyLevel): any => {
      let attempts = 0, q: any, uniqueKey: string;
      do {
        q = generateQuestion(lvl);
        if (questionType === 'sectors') {
          uniqueKey = `${q.theta}-${q.diameter}-${q.questionStyle}`;
        } else if (questionType === 'circumference') {
          if (q.given === 'radius') {
            uniqueKey = `circ-r${q.radius}-${q.level}`;
          } else if (q.given === 'diameter') {
            uniqueKey = `circ-d${q.diameter}-${q.level}`;
          } else {
            uniqueKey = `circ-c${q.circumferenceNumeric}-find${q.find}`;
          }
        } else {
          if (q.given === 'radius') {
            uniqueKey = `area-r${q.radius}-${q.level}`;
          } else if (q.given === 'diameter') {
            uniqueKey = `area-d${q.diameter}-${q.level}`;
          } else {
            uniqueKey = `area-a${q.areaNumeric}-find${q.find}`;
          }
        }
        if (++attempts > 100) break;
      } while (usedKeys.has(uniqueKey));
      usedKeys.add(uniqueKey);
      return q;
    };
    
    if (isDifferentiated) {
      ['level1', 'level2', 'level3'].forEach(lvl => {
        for (let i = 0; i < numQuestions; i++) {
          questions.push({ ...generateUniqueQuestion(lvl), difficulty: lvl });
        }
      });
    } else {
      for (let i = 0; i < numQuestions; i++) {
        questions.push({ ...generateUniqueQuestion(difficulty), difficulty });
      }
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  // ===== EFFECTS =====
  useEffect(() => {
    if (mode === 'whiteboard' && !whiteboardQuestion) handleNewWhiteboardQuestion();
    if (mode === 'single' && !question) handleNewQuestion();
  }, [mode]);

  useEffect(() => {
    if (mode === 'whiteboard' && whiteboardQuestion) handleNewWhiteboardQuestion();
    if (mode === 'single' && question) handleNewQuestion();
  }, [difficulty, allowDecimals, answerInPi, questionType]);

  // ===== RENDER =====
  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} /><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border-2 border-gray-200 overflow-hidden z-50">
                <div className="py-2">
                  <div className="px-6 py-2 font-bold text-gray-700 text-sm uppercase tracking-wide">Color Schemes</div>
                  {(['default', 'blue', 'pink', 'yellow'] as const).map((scheme: ColorScheme) => (
                    <button key={scheme} onClick={() => setColorScheme(scheme)}
                      className={'w-full text-left px-6 py-3 font-semibold transition-colors ' +
                        (colorScheme === scheme ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}>
                      {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>
          Circle Properties
        </h1>

        <div className="flex justify-center gap-3 flex-wrap mb-6">
          {(['circumference', 'area', 'sectors'] as const).map((topic: QuestionTypeString) => (
            <button key={topic} onClick={() => setQuestionType(topic)}
              className={'px-8 py-4 rounded-xl font-bold text-xl transition-all border-2 border-gray-200 ' +
                (questionType === topic ? 'bg-blue-900 text-white shadow-lg' : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900 shadow')}>
              {topic === 'circumference' ? 'Circumference' : topic === 'area' ? 'Area' : 'Sectors'}
            </button>
          ))}
        </div>

        <div className="flex justify-center mb-8">
          <div style={{ width: '90%', height: '1px', backgroundColor: '#d1d5db' }}></div>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          {(['whiteboard', 'single', 'worksheet'] as const).map((m: Mode) => (
            <button key={m} onClick={() => setMode(m)}
              className={'px-8 py-4 rounded-xl font-bold text-xl transition-all border-2 border-gray-200 ' +
                (mode === m ? 'bg-blue-900 text-white shadow-lg' : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900 shadow')}>
              {m === 'whiteboard' ? 'Whiteboard' : m === 'single' ? 'Single Q' : 'Worksheet'}
            </button>
          ))}
        </div>

        {mode === 'whiteboard' && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600">Difficulty:</span>
                  <div className="flex gap-2">
                    {(['level1', 'level2', 'level3'] as const).map((lvl: DifficultyLevel, idx: number) => (
                      <button key={lvl} onClick={() => setDifficulty(lvl)}
                        className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' +
                          (difficulty === lvl
                            ? (idx === 0 ? 'bg-green-600 text-white' : idx === 1 ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white')
                            : (idx === 0 ? 'bg-white text-green-600 border-2 border-green-600' : idx === 1 ? 'bg-white text-yellow-600 border-2 border-yellow-600' : 'bg-white text-red-600 border-2 border-red-600'))}>
                        Level {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <input type="checkbox" checked={allowDecimals}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAllowDecimals(e.target.checked)} className="w-3 h-3" />
                    Decimals
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <input type="checkbox" checked={answerInPi}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnswerInPi(e.target.checked)} className="w-3 h-3" />
                    In π
                  </label>
                </div>

                {questionType === 'sectors' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-600">Type:</label>
                    <select value={sectorQuestionStyle}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const value = e.target.value as SectorStyle;
                        setSectorQuestionStyle(value);
                      }}
                      className="px-2 py-1 border-2 border-gray-300 rounded-lg text-xs font-semibold">
                      <option value="mixed">Mixed</option>
                      <option value="area">Area</option>
                      <option value="arcLength">Arc Length</option>
                      <option value="perimeter">Perimeter</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={handleNewWhiteboardQuestion}
                    className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                    <RefreshCw size={18} />
                    New Question
                  </button>
                  <button onClick={() => setShowWhiteboardAnswer(!showWhiteboardAnswer)}
                    className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                    <Eye size={18} />
                    {showWhiteboardAnswer ? 'Hide Answer' : 'Show Answer'}
                  </button>
                </div>
              </div>
            </div>

            {whiteboardQuestion && (
              <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
                <div className="text-center mb-6">
                  <span className="text-6xl font-bold" style={{ color: '#000000' }}>
                    {whiteboardQuestion.displayQuestion}
                  </span>
                  {showWhiteboardAnswer && (
                    <span className="text-6xl font-bold ml-4" style={{ color: '#166534' }}>
                      = {whiteboardQuestion.type === 'circumference'
                        ? (whiteboardQuestion.level === 3 ? `${whiteboardQuestion.answer} cm` : `${whiteboardQuestion.circumference} cm`)
                        : whiteboardQuestion.type === 'area'
                        ? (whiteboardQuestion.level === 3 ? `${whiteboardQuestion.answer} cm` : `${whiteboardQuestion.area} cm²`)
                        : whiteboardQuestion.answer}
                    </span>
                  )}
                </div>

                <div className="flex gap-6">
                  <div className="rounded-xl flex items-center justify-center" style={{ backgroundColor: getQuestionBg(), width: '450px', height: '500px' }}>
                    {renderCircleDiagram(whiteboardQuestion, 400)}
                  </div>
                  <div className="flex-1 rounded-xl p-6" style={{ backgroundColor: getWhiteboardWorkingBg(), minHeight: '500px' }}></div>
                </div>
              </div>
            )}
          </>
        )}

        {mode === 'single' && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600">Difficulty:</span>
                  <div className="flex gap-2">
                    {['level1', 'level2', 'level3'].map((lvl, idx) => (
                      <button key={lvl} onClick={() => setDifficulty(lvl)}
                        className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' +
                          (difficulty === lvl
                            ? (idx === 0 ? 'bg-green-600 text-white' : idx === 1 ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white')
                            : (idx === 0 ? 'bg-white text-green-600 border-2 border-green-600' : idx === 1 ? 'bg-white text-yellow-600 border-2 border-yellow-600' : 'bg-white text-red-600 border-2 border-red-600'))}>
                        Level {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <input type="checkbox" checked={allowDecimals}
                      onChange={(e) => setAllowDecimals(e.target.checked)} className="w-3 h-3" />
                    Decimals
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <input type="checkbox" checked={answerInPi}
                      onChange={(e) => setAnswerInPi(e.target.checked)} className="w-3 h-3" />
                    In π
                  </label>
                </div>

                {questionType === 'sectors' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-600">Type:</label>
                    <select value={sectorQuestionStyle}
                      onChange={(e) => setSectorQuestionStyle(e.target.value)}
                      className="px-2 py-1 border-2 border-gray-300 rounded-lg text-xs font-semibold">
                      <option value="mixed">Mixed</option>
                      <option value="area">Area</option>
                      <option value="arcLength">Arc Length</option>
                      <option value="perimeter">Perimeter</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={handleNewQuestion}
                    className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                    <RefreshCw size={18} />
                    New Question
                  </button>
                  <button onClick={() => setShowAnswer(!showAnswer)}
                    className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                    <Eye size={18} />
                    {showAnswer ? 'Hide Answer' : 'Show Answer'}
                  </button>
                </div>
              </div>
            </div>

            {question && (
              <div className="overflow-y-auto" style={{ height: '120vh' }}>
                <div className="rounded-xl shadow-lg p-12 w-full" style={{ backgroundColor: getQuestionBg() }}>
                  <div className="text-6xl font-bold text-center mb-8" style={{ color: '#000000' }}>
                    {question.displayQuestion}
                  </div>

                  <div className="flex justify-center mb-8">
                    {renderCircleDiagram(question, 400)}
                  </div>

                  {showAnswer && question.working && (
                    <>
                      <div className="space-y-6 mb-8">
                        {question.working.filter((step: any) => step.type !== 'final').map((step: any, idx: number) => (
                          <div key={idx} className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                            {step.type === 'given' && (
                              <div>
                                <h4 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>Given</h4>
                                <div className="text-3xl font-medium" style={{ color: '#000000' }}>{step.text}</div>
                              </div>
                            )}
                            {step.type === 'formula' && (
                              <div>
                                <h4 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>Formula</h4>
                                <div className="text-3xl font-medium" style={{ color: '#000000' }}>{step.text}</div>
                              </div>
                            )}
                            {step.type === 'rearrange' && (
                              <div>
                                <h4 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>Rearrange</h4>
                                <div className="text-3xl font-medium" style={{ color: '#000000' }}>{step.text}</div>
                              </div>
                            )}
                            {step.type === 'substitution' && (
                              <div>
                                <h4 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>Substitute</h4>
                                <div className="text-3xl font-medium" style={{ color: '#000000' }}>
                                  {answerInPi ? (step.textPi || step.text) : (step.textNumeric || step.text)}
                                </div>
                              </div>
                            )}
                            {step.type === 'calculation' && (
                              <div>
                                <h4 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>Calculate</h4>
                                <div className="text-3xl font-medium" style={{ color: '#000000' }}>
                                  {answerInPi ? (step.textPi || step.text) : (step.textNumeric || step.text)}
                                </div>
                              </div>
                            )}
                            {step.type === 'findRadius' && (
                              <div>
                                <h4 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>Find Radius</h4>
                                <div className="text-3xl font-medium" style={{ color: '#000000' }}>{step.text}</div>
                              </div>
                            )}
                            {step.type === 'simplify' && (
                              <div>
                                <h4 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>Simplify</h4>
                                <div className="text-3xl font-medium" style={{ color: '#000000' }}>
                                  {answerInPi ? (step.textPi || step.text) : (step.textNumeric || step.text)}
                                </div>
                              </div>
                            )}
                            {step.type === 'findDiameter' && (
                              <div>
                                <h4 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>Find Diameter</h4>
                                <div className="text-3xl font-medium" style={{ color: '#000000' }}>{step.text}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl p-6 text-center" style={{ backgroundColor: getFinalAnswerBg() }}>
                        <span className="text-5xl font-bold" style={{ color: '#166534' }}>
                          = {question.type === 'circumference'
                            ? (question.level === 3 ? `${question.answer} cm` : `${question.circumference} cm`)
                            : question.type === 'area'
                            ? (question.level === 3 ? `${question.answer} cm` : `${question.area} cm²`)
                            : question.answer}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {mode === 'worksheet' && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="space-y-4">
                {/* Line 1: Questions + Differentiated */}
                <div className="flex justify-center items-center gap-6">
                  <div className="flex items-center gap-3">
                    <label className="text-lg font-semibold" style={{ color: '#000000' }}>Questions per level:</label>
                    <input type="number" min="1" max="20" value={numQuestions}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                      className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg" />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="diff" checked={isDifferentiated}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsDifferentiated(e.target.checked)} className="w-5 h-5" />
                    <label htmlFor="diff" className="text-lg font-semibold" style={{ color: '#000000' }}>Differentiated</label>
                  </div>
                </div>

                {/* Line 2: Difficulty + Columns (hidden if differentiated) */}
                {!isDifferentiated && (
                  <div className="flex justify-center items-center gap-6">
                    <div className="flex items-center gap-3">
                      <label className="text-lg font-semibold" style={{ color: '#000000' }}>Difficulty:</label>
                      <div className="flex gap-2">
                        {(['level1', 'level2', 'level3'] as const).map((lvl: DifficultyLevel, idx: number) => (
                          <button key={lvl} onClick={() => setDifficulty(lvl)}
                            className={'px-6 py-2 rounded-lg font-semibold ' +
                              (difficulty === lvl
                                ? (idx === 0 ? 'bg-green-600 text-white' : idx === 1 ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white')
                                : 'bg-gray-200')}>
                            Level {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-base font-semibold" style={{ color: '#000000' }}>Columns:</label>
                      <input type="number" min="1" max="4" value={numColumns}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))}
                        className="w-16 px-3 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold" />
                    </div>
                  </div>
                )}

                {/* Line 3: Variables + Dropdown */}
                <div className="flex justify-center items-center gap-6">
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={allowDecimals}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAllowDecimals(e.target.checked)} className="w-4 h-4" />
                      <span className="text-sm font-semibold" style={{ color: '#000000' }}>Decimals</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={answerInPi}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnswerInPi(e.target.checked)} className="w-4 h-4" />
                      <span className="text-sm font-semibold" style={{ color: '#000000' }}>In π</span>
                    </label>
                  </div>

                  {questionType === 'sectors' && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold" style={{ color: '#000000' }}>Type:</label>
                      <select value={sectorQuestionStyle}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          setSectorQuestionStyle(e.target.value as SectorStyle);
                        }}
                        className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold bg-white">
                        <option value="mixed">Mixed</option>
                        <option value="area">Area</option>
                        <option value="arcLength">Arc Length</option>
                        <option value="perimeter">Perimeter</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Line 4: Action Buttons */}
                <div className="flex justify-center items-center gap-4">
                  <button onClick={handleGenerateWorksheet}
                    className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-800">
                    <RefreshCw size={20} />
                    Generate Worksheet
                  </button>
                  {worksheet.length > 0 && (
                    <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)}
                      className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-800">
                      <Eye size={20} />
                      {showWorksheetAnswers ? 'Hide' : 'Show'} Answers
                    </button>
                  )}
                </div>
              </div>
            </div>

            {worksheet.length > 0 && (
              <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQuestionBg() }}>
                <div className="absolute top-4 right-4 flex items-center gap-1">
                  <button onClick={() => setWorksheetFontSize(Math.max(0, worksheetFontSize - 1))}
                    disabled={worksheetFontSize === 0}
                    className={'w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ' +
                      (worksheetFontSize === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-blue-800')}>
                    <ChevronDown size={20} />
                  </button>
                  <button onClick={() => setWorksheetFontSize(Math.min(3, worksheetFontSize + 1))}
                    disabled={worksheetFontSize === 3}
                    className={'w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ' +
                      (worksheetFontSize === 3 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-blue-800')}>
                    <ChevronUp size={20} />
                  </button>
                </div>

                <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>
                  {questionType === 'circumference' ? 'Circumference' : questionType === 'area' ? 'Area' : 'Sectors'} - Worksheet
                </h2>

                {isDifferentiated ? (
                  <div className="grid grid-cols-3 gap-4">
                    {(['level1', 'level2', 'level3'] as const).map((lvl: DifficultyLevel, idx: number) => (
                      <div key={lvl} className={'rounded-xl p-4 border-4 ' +
                        (lvl === 'level1' ? 'bg-green-50 border-green-500' :
                         lvl === 'level2' ? 'bg-yellow-50 border-yellow-500' : 'bg-red-50 border-red-500')}>
                        <h3 className={'text-2xl font-bold text-center mb-4 ' +
                          (lvl === 'level1' ? 'text-green-700' : lvl === 'level2' ? 'text-yellow-700' : 'text-red-700')}>
                          Level {idx + 1}
                        </h3>
                        <div className="space-y-3">
                          {worksheet.filter((q: QuestionType) => q.difficulty === lvl).map((q: QuestionType, i: number) => (
                            <div key={i} className="rounded-lg p-3 border-2 border-gray-200" style={{
                              backgroundColor: lvl === 'level1' ? '#DCFCE7' : lvl === 'level2' ? '#FEF9C3' : '#FEE2E2'
                            }}>
                              <div className={`font-bold ${getFontSize()}`} style={{ color: '#000000' }}>
                                {i + 1}. {q.displayQuestion}
                              </div>
                              <div className="flex justify-center my-1">{renderCircleDiagram(q, 200, true, 1 + worksheetFontSize * 0.3, lvl)}</div>
                              {showWorksheetAnswers && (
                                <div className={`mt-1 font-semibold ${getFontSize()}`} style={{ color: '#059669' }}>
                                  = {q.type === 'circumference'
                                    ? (q.level === 3 ? `${q.answer} cm` : `${q.circumference} cm`)
                                    : q.type === 'area'
                                    ? (q.level === 3 ? `${q.answer} cm` : `${q.area} cm²`)
                                    : q.answer}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`grid gap-x-6 gap-y-3 ${
                    numColumns === 1 ? 'grid-cols-1' :
                    numColumns === 2 ? 'grid-cols-2' :
                    numColumns === 3 ? 'grid-cols-3' : 'grid-cols-4'
                  }`}>
                    {worksheet.map((q: QuestionType, i: number) => (
                      <div key={i} className="rounded-lg p-3 border-2 border-gray-200" style={{ backgroundColor: getStepBg() }}>
                        <div className={`font-bold ${getFontSize()} mb-1`} style={{ color: '#000000' }}>
                          {i + 1}. {q.displayQuestion}
                        </div>
                        <div className="flex justify-center mb-1">{renderCircleDiagram(q, 180, true, 1 + worksheetFontSize * 0.3)}</div>
                        {showWorksheetAnswers && (
                          <div className={`font-semibold ${getFontSize()} text-center`} style={{ color: '#059669' }}>
                            = {q.type === 'circumference'
                              ? (q.level === 3 ? `${q.answer} cm` : `${q.circumference} cm`)
                              : q.type === 'area'
                              ? (q.level === 3 ? `${q.answer} cm` : `${q.area} cm²`)
                              : q.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
