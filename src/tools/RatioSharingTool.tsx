import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, Home, Menu, X, ChevronUp, ChevronDown } from 'lucide-react';

const RatioSharingTool = () => {
  const navigate = useNavigate();
  
  const [topic, setTopic] = useState('sharing');
  const [mode, setMode] = useState('whiteboard');
  const [difficulty, setDifficulty] = useState('level1');
  const [shareQuestionType, setShareQuestionType] = useState('mixed');
  const [useAlgebraicMethod, setUseAlgebraicMethod] = useState(false);
  const [knownAmountsQuestionType, setKnownAmountsQuestionType] = useState('mixed');
  const [useNumericalMethod, setUseNumericalMethod] = useState(false);
  const [differenceQuestionType, setDifferenceQuestionType] = useState('mixed');
  const [useDifferenceNumericalMethod, setUseDifferenceNumericalMethod] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [colorScheme, setColorScheme] = useState('default');
  
  const [question, setQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  
  const [numQuestions, setNumQuestions] = useState(5);
  const [worksheet, setWorksheet] = useState([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [numColumns, setNumColumns] = useState(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState(1);

  const fontSizes = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const getFontSize = () => fontSizes[worksheetFontSize];
  
  const getStepBg = () => {
    if (colorScheme === 'blue') return '#B3D9F2';
    if (colorScheme === 'pink') return '#F2B3D9';
    if (colorScheme === 'yellow') return '#F2EBB3';
    return '#f3f4f6';
  };
  
  const getQuestionBg = () => {
    if (colorScheme === 'blue') return '#D1E7F8';
    if (colorScheme === 'pink') return '#F8D1E7';
    if (colorScheme === 'yellow') return '#F8F4D1';
    return '#ffffff';
  };
  
  const getBarEmptyBg = () => {
    if (colorScheme === 'blue') return '#D1E7F8';
    if (colorScheme === 'pink') return '#F8D1E7';
    if (colorScheme === 'yellow') return '#F8F4D1';
    return '#ffffff';
  };
  
  const getBarFilledBg = () => {
    if (colorScheme === 'blue') return '#9ec9e3';
    if (colorScheme === 'pink') return '#e39ec9';
    if (colorScheme === 'yellow') return '#e3e39e';
    return '#d1d5db';
  };
  
  const getBarKnownBg = () => {
    if (colorScheme === 'blue') return '#7eb8e0';
    if (colorScheme === 'pink') return '#e07eb8';
    if (colorScheme === 'yellow') return '#e0e07e';
    return '#93c5fd';
  };
  
  const getBarDiffBg = () => {
    if (colorScheme === 'blue') return '#d8b4fe';
    if (colorScheme === 'pink') return '#fed8b4';
    if (colorScheme === 'yellow') return '#b4fed8';
    return '#e9d5ff';
  };
  
  const getWhiteboardWorkingBg = () => {
    if (colorScheme === 'blue') return '#B3D9F2';
    if (colorScheme === 'pink') return '#F2B3D9';
    if (colorScheme === 'yellow') return '#F2EBB3';
    return '#f3f4f6';
  };

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const namesList = ['Alice', 'Ben', 'Charlie', 'Diana', 'Emma', 'Finn', 'Grace', 'Harry', 'Isla', 'Jack', 'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Peter'];
  
  const getRandomNames = (count) => {
    const shuffled = [...namesList].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const formatCurrency = (amount) => {
    if (amount % 1 === 0) return `£${amount}`;
    return `£${amount.toFixed(2)}`;
  };

  const findHCF = (numbers) => {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    return numbers.reduce((acc, num) => gcd(acc, num));
  };

  const generateSharingWorking = (ratioParts, total, ratioSum, partValue, shares, questionType, names, algebraic = false) => {
    if (algebraic) {
      return [
        { type: 'showRatio', parts: ratioParts, names: names },
        { type: 'explainParts', parts: ratioParts, names: names },
        { type: 'ratioSum', parts: ratioParts, names: names, sum: ratioSum },
        { type: 'partValue', total: total, sum: ratioSum, value: partValue },
        { type: 'calculateShares', parts: ratioParts, names: names, partValue: partValue, shares: shares },
        { type: 'verifyTotal', shares: shares, total: total, names: names },
        { type: 'answer', questionType: questionType, shares: shares, names: names }
      ];
    } else {
      return [
        { type: 'barModelEmpty', bars: ratioParts.map((parts, idx) => ({ person: names[idx], boxes: parts })) },
        { type: 'totalParts', sum: ratioSum },
        { type: 'partValue', total: total, sum: ratioSum, value: partValue },
        { type: 'barModelFilled', bars: ratioParts.map((parts, idx) => ({ person: names[idx], boxes: parts, value: partValue, total: shares[idx] })) },
        { type: 'answer', questionType: questionType, shares: shares, names: names }
      ];
    }
  };

  const generateSharingQuestion = (diff) => {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      attempts++;

      const names = getRandomNames(2);
      let ratioParts = [];
      let total = 0, ratioSum = 0, partValue = 0;

      if (diff === 'level1') {
        const options = [[1,2], [1,3], [1,4], [2,3], [3,4]];
        ratioParts = randomChoice(options);
        ratioSum = ratioParts.reduce((a, b) => a + b, 0);
        const multiplier = randomInt(10, 20);
        total = ratioSum * multiplier;
      } else if (diff === 'level2') {
        ratioParts = [randomInt(1, 6), randomInt(1, 6)];
        ratioSum = ratioParts.reduce((a, b) => a + b, 0);
        if (ratioSum < 5 || ratioSum > 15) continue;
        const multiplier = randomInt(8, 15);
        total = ratioSum * multiplier;
      } else {
        ratioParts = [randomInt(3, 9), randomInt(3, 9)];
        ratioSum = ratioParts.reduce((a, b) => a + b, 0);
        if (ratioSum < 8 || ratioSum > 25) continue;
        
        if (Math.random() < 0.8) {
          const multiplier = randomInt(10, 30);
          total = ratioSum * multiplier;
        } else {
          const multiplier = randomInt(10, 30) + 0.5;
          total = ratioSum * multiplier;
        }
      }

      const allEqual = ratioParts.every(p => p === ratioParts[0]);
      if (allEqual) continue;

      const ratioHCF = findHCF(ratioParts);
      if (ratioHCF > 1) continue;

      partValue = total / ratioSum;
      const shares = ratioParts.map(p => p * partValue);

      if (total < 20 || total > 500) continue;

      let actualQuestionType = shareQuestionType;
      if (shareQuestionType === 'mixed') {
        actualQuestionType = randomChoice(['personA', 'personB', 'both']);
      }

      const displayText = `${names[0]} and ${names[1]} share ${formatCurrency(total)} in the ratio ${ratioParts.join(':')}.${
            actualQuestionType === 'personA' ? ` What is ${names[0]}'s share?` :
            actualQuestionType === 'personB' ? ` What is ${names[1]}'s share?` :
            ' Find both shares.'
          }`;

      let answerText = '';
      if (actualQuestionType === 'personA') {
        answerText = `${names[0]}: ${formatCurrency(shares[0])}`;
      } else if (actualQuestionType === 'personB') {
        answerText = `${names[1]}: ${formatCurrency(shares[1])}`;
      } else {
        answerText = shares.map((s, i) => `${names[i]}: ${formatCurrency(s)}`).join(', ');
      }

      return {
        display: displayText,
        answer: answerText,
        ratio: ratioParts.join(':'),
        ratioParts: ratioParts,
        total: total,
        ratioSum: ratioSum,
        partValue: partValue,
        shares: shares,
        questionType: actualQuestionType,
        working: generateSharingWorking(ratioParts, total, ratioSum, partValue, shares, actualQuestionType, names, useAlgebraicMethod),
        names: names,
        difficulty: diff
      };
    }

    const fallbackNames = getRandomNames(2);
    return {
      display: `${fallbackNames[0]} and ${fallbackNames[1]} share £90 in the ratio 1:2. What is ${fallbackNames[0]}'s share?`,
      answer: `${fallbackNames[0]}: £30`,
      ratio: '1:2',
      ratioParts: [1, 2],
      total: 90,
      ratioSum: 3,
      partValue: 30,
      shares: [30, 60],
      questionType: 'personA',
      working: generateSharingWorking([1, 2], 90, 3, 30, [30, 60], 'personA', fallbackNames, useAlgebraicMethod),
      names: fallbackNames,
      difficulty: diff
    };
  };

  const generateKnownAmountsWorking = (ratioParts, knownAmount, knownPerson, partValue, shares, total, questionType, names, useBarModel = true) => {
    if (useBarModel) {
      const steps = [];
      const otherPerson = knownPerson === 0 ? 1 : 0;
      
      steps.push({
        type: 'barModelKnown',
        bars: [
          { person: names[0], boxes: ratioParts[0], isKnown: knownPerson === 0, knownAmount: knownPerson === 0 ? knownAmount : null },
          { person: names[1], boxes: ratioParts[1], isKnown: knownPerson === 1, knownAmount: knownPerson === 1 ? knownAmount : null }
        ]
      });

      steps.push({
        type: 'identifyRatioPart',
        knownPerson: names[knownPerson],
        ratioPart: ratioParts[knownPerson]
      });

      steps.push({
        type: 'calculatePartValue',
        knownAmount: knownAmount,
        ratioPart: ratioParts[knownPerson],
        partValue: partValue
      });

      steps.push({
        type: 'barModelFilled',
        bars: [
          { person: names[0], boxes: ratioParts[0], value: partValue, total: shares[0] },
          { person: names[1], boxes: ratioParts[1], value: partValue, total: shares[1] }
        ]
      });

      if (questionType === 'total') {
        steps.push({
          type: 'calculateTotalFromBar',
          shares: shares,
          total: total,
          names: names
        });
      } else if (questionType === 'other') {
        steps.push({
          type: 'readOtherFromBar',
          otherPerson: names[otherPerson],
          share: shares[otherPerson]
        });
      }

      steps.push({
        type: 'answer',
        questionType: questionType,
        shares: shares,
        total: total,
        names: names,
        knownPerson: knownPerson
      });

      return steps;
    } else {
      const steps = [];
      
      steps.push({
        type: 'showGiven',
        knownPerson: names[knownPerson],
        knownAmount: knownAmount,
        ratio: ratioParts.join(':'),
        names: names
      });

      steps.push({
        type: 'identifyRatioPart',
        knownPerson: names[knownPerson],
        ratioPart: ratioParts[knownPerson]
      });

      steps.push({
        type: 'calculatePartValue',
        knownAmount: knownAmount,
        ratioPart: ratioParts[knownPerson],
        partValue: partValue
      });

      if (questionType === 'total') {
        steps.push({
          type: 'calculateTotal',
          parts: ratioParts,
          names: names,
          partValue: partValue,
          shares: shares,
          total: total
        });
      } else if (questionType === 'other') {
        const otherPerson = knownPerson === 0 ? 1 : 0;
        steps.push({
          type: 'calculateOther',
          otherPerson: names[otherPerson],
          ratioPart: ratioParts[otherPerson],
          partValue: partValue,
          share: shares[otherPerson]
        });
      }

      steps.push({
        type: 'answer',
        questionType: questionType,
        shares: shares,
        total: total,
        names: names,
        knownPerson: knownPerson
      });

      return steps;
    }
  };

  const generateKnownAmountsQuestion = (diff) => {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      attempts++;

      const names = getRandomNames(2);
      let ratioParts = [];
      let partValue = 0;
      let knownPerson = 0;

      if (diff === 'level1') {
        const options = [[1,2], [1,3], [2,3], [1,4], [3,4], [1,5], [2,5], [3,5], [4,5]];
        ratioParts = randomChoice(options);
        knownPerson = Math.random() < 0.5 ? 0 : 1;
        partValue = randomInt(2, 10);
      } else if (diff === 'level2') {
        ratioParts = [randomInt(1, 7), randomInt(1, 7)];
        if (findHCF(ratioParts) > 1) continue;
        
        if (ratioParts[0] === 1 && ratioParts[1] === 1) continue;
        if (ratioParts[0] === 1) {
          knownPerson = 1;
        } else if (ratioParts[1] === 1) {
          knownPerson = 0;
        } else {
          knownPerson = Math.random() < 0.5 ? 0 : 1;
        }
        
        partValue = randomInt(5, 25);
      } else {
        ratioParts = [randomInt(5, 15), randomInt(5, 15)];
        if (findHCF(ratioParts) > 1) continue;
        if (Math.abs(ratioParts[0] - ratioParts[1]) < 2) continue;
        knownPerson = Math.random() < 0.5 ? 0 : 1;
        partValue = randomInt(3, 20);
      }

      const allEqual = ratioParts.every(p => p === ratioParts[0]);
      if (allEqual) continue;

      const knownAmount = ratioParts[knownPerson] * partValue;
      
      const shares = ratioParts.map(p => p * partValue);
      const total = shares.reduce((a, b) => a + b, 0);

      if (diff === 'level1') {
        if (knownAmount >= 50 || total >= 50) continue;
      }

      if (knownAmount < 10 || knownAmount > 400) continue;
      if (total < 20 || total > 600) continue;

      let actualQuestionType = knownAmountsQuestionType;
      if (knownAmountsQuestionType === 'mixed') {
        actualQuestionType = randomChoice(['total', 'other']);
      }

      const otherPerson = knownPerson === 0 ? 1 : 0;
      
      let displayText = `${names[0]} and ${names[1]} share money in the ratio ${ratioParts.join(':')}. `;
      displayText += `${names[knownPerson]} receives ${formatCurrency(knownAmount)}. `;
      
      if (actualQuestionType === 'total') {
        displayText += `What is the total amount shared?`;
      } else if (actualQuestionType === 'other') {
        displayText += `How much does ${names[otherPerson]} receive?`;
      }

      let answerText = '';
      if (actualQuestionType === 'total') {
        answerText = `Total: ${formatCurrency(total)}`;
      } else if (actualQuestionType === 'other') {
        answerText = `${names[otherPerson]}: ${formatCurrency(shares[otherPerson])}`;
      }

      const shouldUseBarModel = diff !== 'level3' && !useNumericalMethod;

      return {
        display: displayText,
        answer: answerText,
        ratio: ratioParts.join(':'),
        ratioParts: ratioParts,
        knownAmount: knownAmount,
        knownPerson: knownPerson,
        partValue: partValue,
        shares: shares,
        total: total,
        questionType: actualQuestionType,
        working: generateKnownAmountsWorking(ratioParts, knownAmount, knownPerson, partValue, shares, total, actualQuestionType, names, shouldUseBarModel),
        names: names,
        difficulty: diff
      };
    }

    const fallbackNames = getRandomNames(2);
    const shouldUseBarModel = diff !== 'level3' && !useNumericalMethod;
    return {
      display: `${fallbackNames[0]} and ${fallbackNames[1]} share money in the ratio 2:3. ${fallbackNames[0]} receives £40. What is the total amount shared?`,
      answer: 'Total: £100',
      ratio: '2:3',
      ratioParts: [2, 3],
      knownAmount: 40,
      knownPerson: 0,
      partValue: 20,
      shares: [40, 60],
      total: 100,
      questionType: 'total',
      working: generateKnownAmountsWorking([2, 3], 40, 0, 20, [40, 60], 100, 'total', fallbackNames, shouldUseBarModel),
      names: fallbackNames,
      difficulty: diff
    };
  };

  const generateDifferenceWorking = (ratioParts, difference, largerPerson, partValue, shares, total, questionType, names, useBarModel = true) => {
    if (useBarModel) {
      const steps = [];
      
      steps.push({
        type: 'barModelDifference',
        bars: [
          { person: names[0], boxes: ratioParts[0] },
          { person: names[1], boxes: ratioParts[1] }
        ],
        difference: difference,
        largerPerson: largerPerson
      });

      steps.push({
        type: 'identifyDifferenceParts',
        difference: difference,
        partDifference: Math.abs(ratioParts[1] - ratioParts[0])
      });

      steps.push({
        type: 'calculatePartValueFromDifference',
        difference: difference,
        partDifference: Math.abs(ratioParts[1] - ratioParts[0]),
        partValue: partValue
      });

      steps.push({
        type: 'barModelFilled',
        bars: [
          { person: names[0], boxes: ratioParts[0], value: partValue, total: shares[0] },
          { person: names[1], boxes: ratioParts[1], value: partValue, total: shares[1] }
        ]
      });

      if (questionType === 'total') {
        steps.push({
          type: 'calculateTotalFromBar',
          shares: shares,
          total: total,
          names: names
        });
      } else if (questionType === 'personA') {
        steps.push({
          type: 'readPersonAFromBar',
          person: names[0],
          share: shares[0]
        });
      } else if (questionType === 'personB') {
        steps.push({
          type: 'readPersonBFromBar',
          person: names[1],
          share: shares[1]
        });
      }

      steps.push({
        type: 'answerDifference',
        questionType: questionType,
        shares: shares,
        total: total,
        names: names
      });

      return steps;
    } else {
      const steps = [];
      
      steps.push({
        type: 'showGivenDifference',
        names: names,
        ratio: ratioParts.join(':'),
        difference: difference,
        largerPerson: largerPerson
      });

      steps.push({
        type: 'identifyDifferenceParts',
        difference: difference,
        partDifference: Math.abs(ratioParts[1] - ratioParts[0])
      });

      steps.push({
        type: 'calculatePartValueFromDifference',
        difference: difference,
        partDifference: Math.abs(ratioParts[1] - ratioParts[0]),
        partValue: partValue
      });

      if (questionType === 'total') {
        steps.push({
          type: 'calculateTotal',
          parts: ratioParts,
          names: names,
          partValue: partValue,
          shares: shares,
          total: total
        });
      } else if (questionType === 'personA') {
        steps.push({
          type: 'calculatePersonA',
          person: names[0],
          ratioPart: ratioParts[0],
          partValue: partValue,
          share: shares[0]
        });
      } else if (questionType === 'personB') {
        steps.push({
          type: 'calculatePersonB',
          person: names[1],
          ratioPart: ratioParts[1],
          partValue: partValue,
          share: shares[1]
        });
      }

      steps.push({
        type: 'answerDifference',
        questionType: questionType,
        shares: shares,
        total: total,
        names: names
      });

      return steps;
    }
  };

  const generateDifferenceQuestion = (diff) => {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      attempts++;

      const names = getRandomNames(2);
      let ratioParts = [];
      let partValue = 0;

      if (diff === 'level1') {
        const options = [[1,2], [1,3], [2,3], [1,4], [3,4], [2,5], [3,5]];
        ratioParts = randomChoice(options);
        partValue = randomInt(3, 12);
      } else if (diff === 'level2') {
        ratioParts = [randomInt(1, 8), randomInt(1, 8)];
        if (findHCF(ratioParts) > 1) continue;
        if (Math.abs(ratioParts[0] - ratioParts[1]) < 1) continue;
        partValue = randomInt(5, 20);
      } else {
        ratioParts = [randomInt(3, 12), randomInt(3, 12)];
        if (findHCF(ratioParts) > 1) continue;
        if (Math.abs(ratioParts[0] - ratioParts[1]) < 2) continue;
        partValue = randomInt(4, 25);
      }

      const allEqual = ratioParts.every(p => p === ratioParts[0]);
      if (allEqual) continue;

      const shares = ratioParts.map(p => p * partValue);
      const difference = Math.abs(shares[1] - shares[0]);
      const total = shares.reduce((a, b) => a + b, 0);
      const largerPerson = shares[0] > shares[1] ? 0 : 1;

      if (diff === 'level1') {
        if (difference >= 50 || total >= 100) continue;
      }

      if (difference < 5 || difference > 400) continue;
      if (total < 20 || total > 700) continue;

      let actualQuestionType = differenceQuestionType;
      if (differenceQuestionType === 'mixed') {
        actualQuestionType = randomChoice(['total', 'personA', 'personB']);
      }

      const smallerPerson = largerPerson === 0 ? 1 : 0;
      
      const wordingStyle = randomInt(1, 3);
      let comparisonText = '';
      
      if (wordingStyle === 1) {
        comparisonText = `${names[largerPerson]} receives ${formatCurrency(difference)} more than ${names[smallerPerson]}`;
      } else if (wordingStyle === 2) {
        comparisonText = `${names[smallerPerson]} receives ${formatCurrency(difference)} less than ${names[largerPerson]}`;
      } else {
        comparisonText = `The difference in amounts is ${formatCurrency(difference)}`;
      }
      
      let displayText = `${names[0]} and ${names[1]} share money in the ratio ${ratioParts.join(':')}. `;
      displayText += `${comparisonText}. `;
      
      if (actualQuestionType === 'total') {
        displayText += `What is the total amount shared?`;
      } else if (actualQuestionType === 'personA') {
        displayText += `How much does ${names[0]} receive?`;
      } else if (actualQuestionType === 'personB') {
        displayText += `How much does ${names[1]} receive?`;
      }

      let answerText = '';
      if (actualQuestionType === 'total') {
        answerText = `Total: ${formatCurrency(total)}`;
      } else if (actualQuestionType === 'personA') {
        answerText = `${names[0]}: ${formatCurrency(shares[0])}`;
      } else if (actualQuestionType === 'personB') {
        answerText = `${names[1]}: ${formatCurrency(shares[1])}`;
      }

      const shouldUseBarModel = diff !== 'level3' && !useDifferenceNumericalMethod;

      return {
        display: displayText,
        answer: answerText,
        ratio: ratioParts.join(':'),
        ratioParts: ratioParts,
        difference: difference,
        largerPerson: largerPerson,
        partValue: partValue,
        shares: shares,
        total: total,
        questionType: actualQuestionType,
        working: generateDifferenceWorking(ratioParts, difference, largerPerson, partValue, shares, total, actualQuestionType, names, shouldUseBarModel),
        names: names,
        difficulty: diff
      };
    }

    const fallbackNames = getRandomNames(2);
    const shouldUseBarModel = diff !== 'level3' && !useDifferenceNumericalMethod;
    return {
      display: `${fallbackNames[0]} and ${fallbackNames[1]} share money in the ratio 2:3. The difference in amounts is £20. What is the total amount shared?`,
      answer: 'Total: £100',
      ratio: '2:3',
      ratioParts: [2, 3],
      difference: 20,
      largerPerson: 1,
      partValue: 20,
      shares: [40, 60],
      total: 100,
      questionType: 'total',
      working: generateDifferenceWorking([2, 3], 20, 1, 20, [40, 60], 100, 'total', fallbackNames, shouldUseBarModel),
      names: fallbackNames,
      difficulty: diff
    };
  };

  const generateMixedSharingQuestion = (level) => {
    const questionTypes = ['sharing', 'known', 'difference'];
    const selectedType = randomChoice(questionTypes);
    
    let question;
    
    if (selectedType === 'sharing') {
      question = generateSharingQuestion(level);
      question.mixedType = 'sharing';
    } else if (selectedType === 'known') {
      question = generateKnownAmountsQuestion(level);
      question.mixedType = 'known';
    } else {
      question = generateDifferenceQuestion(level);
      question.mixedType = 'difference';
    }
    
    return question;
  };

  const generateQuestion = (level) => {
    if (topic === 'sharing') {
      return generateSharingQuestion(level);
    } else if (topic === 'known') {
      return generateKnownAmountsQuestion(level);
    } else if (topic === 'difference') {
      return generateDifferenceQuestion(level);
    } else {
      return generateMixedSharingQuestion(level);
    }
  };

  const handleNewQuestion = () => {
    setQuestion(generateQuestion(difficulty));
    setShowAnswer(false);
    setShowWhiteboardAnswer(false);
  };

  const handleGenerateWorksheet = () => {
    const questions = [];
    const usedKeys = new Set();
    
    const generateUniqueQuestion = (level) => {
      let attempts = 0;
      const maxAttempts = 100;
      
      while (attempts < maxAttempts) {
        const q = generateQuestion(level);
        const uniqueKey = q.display;
        
        if (!usedKeys.has(uniqueKey)) {
          usedKeys.add(uniqueKey);
          return q;
        }
        
        attempts++;
      }
      
      return generateQuestion(level);
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

  useEffect(() => {
    if ((mode === 'single' || mode === 'whiteboard') && !question) {
      handleNewQuestion();
    }
  }, [mode]);

  useEffect(() => {
    if ((mode === 'single' || mode === 'whiteboard') && question) {
      handleNewQuestion();
    }
  }, [difficulty, topic]);

  useEffect(() => {
    if (mode === 'single' && question && (topic === 'sharing' || topic === 'known' || topic === 'difference' || topic === 'mixed')) {
      handleNewQuestion();
    }
  }, [shareQuestionType, useAlgebraicMethod, knownAmountsQuestionType, useNumericalMethod, differenceQuestionType, useDifferenceNumericalMethod]);

  const renderStep = (step, idx) => {
    return (
      <div key={idx} className="rounded-lg p-6 border border-gray-200" style={{ backgroundColor: getStepBg() }}>
        {step.type === 'showRatio' && step.names && (
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-3" style={{ color: '#000000' }}>Ratio:</h4>
            <div className="text-3xl font-medium" style={{ color: '#000000' }}>
              {step.names.map((name, i) => (
                <span key={i}>{i > 0 && ' : '}{name} = {step.parts[i]}</span>
              ))}
            </div>
          </div>
        )}

        {step.type === 'explainParts' && step.names && (
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-3" style={{ color: '#000000' }}>Understanding the parts:</h4>
            <div className="space-y-2">
              {step.names.map((name, i) => (
                <div key={i} className="text-2xl font-medium" style={{ color: '#000000' }}>
                  {name} gets {step.parts[i]} part{step.parts[i] !== 1 ? 's' : ''}
                </div>
              ))}
            </div>
          </div>
        )}

        {step.type === 'ratioSum' && step.parts && (
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-3" style={{ color: '#000000' }}>Total number of parts:</h4>
            <div className="text-3xl font-medium" style={{ color: '#000000' }}>
              {step.parts.map((p, i) => (
                <span key={i}>{i > 0 && ' + '}{p}</span>
              ))} = {step.sum} parts
            </div>
          </div>
        )}

        {step.type === 'partValue' && (
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-3" style={{ color: '#000000' }}>Value of 1 part:</h4>
            <div className="text-3xl font-medium" style={{ color: '#000000' }}>
              {formatCurrency(step.total)} ÷ {step.sum} = {formatCurrency(step.value)}
            </div>
          </div>
        )}

        {step.type === 'calculateShares' && step.names && (
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-4" style={{ color: '#000000' }}>Calculate each share:</h4>
            <div className="space-y-3">
              {step.names.map((name, i) => (
                <div key={i} className="text-2xl font-medium" style={{ color: '#000000' }}>
                  {name}: {step.parts[i]} × {formatCurrency(step.partValue)} = {formatCurrency(step.shares[i])}
                </div>
              ))}
            </div>
          </div>
        )}

        {step.type === 'verifyTotal' && step.shares && (
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-3" style={{ color: '#000000' }}>Check (optional):</h4>
            <div className="text-2xl font-medium" style={{ color: '#000000' }}>
              {step.shares.map((s) => formatCurrency(s)).join(' + ')} = {formatCurrency(step.total)} ✓
            </div>
          </div>
        )}

        {step.type === 'barModelEmpty' && step.bars && (
          <div>
            <h4 className="text-xl font-semibold mb-4 text-center" style={{ color: '#000000' }}>Bar Model:</h4>
            <div className="flex flex-col gap-3 items-start" style={{ marginLeft: '25%' }}>
              {step.bars.map((bar, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-32 text-2xl font-bold text-left flex-shrink-0" style={{ color: '#000000' }}>{bar.person}</div>
                  <div className="flex gap-1">
                    {Array(bar.boxes).fill(0).map((_, boxIdx) => (
                      <div key={boxIdx} className="w-20 h-20 border-4 border-blue-900 rounded flex-shrink-0" style={{ backgroundColor: getBarEmptyBg() }}></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step.type === 'totalParts' && (
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-3" style={{ color: '#000000' }}>Total parts:</h4>
            <div className="text-3xl font-medium" style={{ color: '#000000' }}>{step.sum} parts</div>
          </div>
        )}

        {step.type === 'barModelFilled' && step.bars && (
          <div>
            <h4 className="text-xl font-semibold mb-4 text-center" style={{ color: '#000000' }}>Calculate shares:</h4>
            <div className="flex flex-col gap-3 items-start" style={{ marginLeft: '25%' }}>
              {step.bars.map((bar, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-32 text-2xl font-bold text-left flex-shrink-0" style={{ color: '#000000' }}>{bar.person}</div>
                  <div className="flex gap-1">
                    {Array(bar.boxes).fill(0).map((_, boxIdx) => (
                      <div key={boxIdx} className="w-20 h-20 border-4 border-blue-900 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ color: '#000000', backgroundColor: getBarFilledBg() }}>
                        {formatCurrency(bar.value)}
                      </div>
                    ))}
                  </div>
                  <span className="text-2xl font-bold ml-4" style={{ color: '#000000' }}>= {formatCurrency(bar.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step.type === 'answer' && step.names && step.shares && (
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-3" style={{ color: '#000000' }}>Answer:</h4>
            <div className="text-5xl font-bold" style={{ color: '#166534' }}>
              {step.questionType === 'personA' && `${step.names[0]}: ${formatCurrency(step.shares[0])}`}
              {step.questionType === 'personB' && `${step.names[1]}: ${formatCurrency(step.shares[1])}`}
              {step.questionType === 'both' && (
                <div className="flex flex-col gap-2">
                  {step.shares.map((share, i) => (
                    <div key={i}>{step.names[i]}: {formatCurrency(share)}</div>
                  ))}
                </div>
              )}
              {step.questionType === 'total' && `Total: ${formatCurrency(step.total)}`}
              {step.questionType === 'other' && step.knownPerson !== undefined && `${step.names[step.knownPerson === 0 ? 1 : 0]}: ${formatCurrency(step.shares[step.knownPerson === 0 ? 1 : 0])}`}
            </div>
          </div>
        )}

        {step.type === 'showGiven' && step.names && (
          <div className="text-center">
            <h4 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Given information:</h4>
            <div className="space-y-3">
              <div className="text-3xl font-medium" style={{ color: '#000000' }}>
                {step.names.join(' : ')} = {step.ratio}
              </div>
              <div className="text-3xl font-medium" style={{ color: '#000000' }}>
                {step.knownPerson} receives {formatCurrency(step.knownAmount)}
              </div>
            </div>
          </div>
        )}

        {step.type === 'identifyRatioPart' && (
          <div className="text-center">
            <h4 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Identify the ratio part:</h4>
            <div className="text-4xl font-bold" style={{ color: '#000000' }}>
              {step.knownPerson} has {step.ratioPart} part{step.ratioPart !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {step.type === 'calculatePartValue' && (
          <div className="text-center">
            <h4 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Calculate value of 1 part:</h4>
            <div className="text-4xl font-bold" style={{ color: '#000000' }}>
              {formatCurrency(step.knownAmount)} ÷ {step.ratioPart} = {formatCurrency(step.partValue)}
            </div>
          </div>
        )}

        {step.type === 'calculateTotal' && step.parts && (
          <div className="text-center">
            <h4 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Calculate total amount:</h4>
            <div className="space-y-4">
              <div className="text-2xl font-medium" style={{ color: '#000000' }}>
                Total parts: {step.parts.join(' + ')} = {step.parts.reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-4xl font-bold" style={{ color: '#000000' }}>
                Total: {step.parts.reduce((a, b) => a + b, 0)} × {formatCurrency(step.partValue)} = {formatCurrency(step.total)}
              </div>
            </div>
          </div>
        )}

        {step.type === 'calculateOther' && (
          <div className="text-center">
            <h4 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Calculate {step.otherPerson}'s share:</h4>
            <div className="text-4xl font-bold" style={{ color: '#000000' }}>
              {step.ratioPart} × {formatCurrency(step.partValue)} = {formatCurrency(step.share)}
            </div>
          </div>
        )}

        {step.type === 'barModelKnown' && step.bars && (
          <div>
            <h4 className="text-2xl font-semibold mb-4 text-center" style={{ color: '#000000' }}>Bar Model - Given information:</h4>
            <div className="flex flex-col gap-3 items-start" style={{ marginLeft: '25%' }}>
              {step.bars.map((bar, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-32 text-2xl font-bold text-left flex-shrink-0" style={{ color: '#000000' }}>{bar.person}</div>
                  <div className="flex gap-1">
                    {Array(bar.boxes).fill(0).map((_, boxIdx) => (
                      <div key={boxIdx} className="w-20 h-20 border-4 rounded flex-shrink-0" style={{
                        borderColor: bar.isKnown ? '#1e3a8a' : '#9ca3af',
                        backgroundColor: bar.isKnown ? getBarKnownBg() : getBarEmptyBg()
                      }}></div>
                    ))}
                  </div>
                  {bar.isKnown && (
                    <span className="text-2xl font-bold ml-4" style={{ color: '#000000' }}>= {formatCurrency(bar.knownAmount)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step.type === 'calculateTotalFromBar' && step.shares && (
          <div className="text-center">
            <h4 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Add all parts to find total:</h4>
            <div className="text-4xl font-bold" style={{ color: '#000000' }}>
              {step.shares.map((s) => formatCurrency(s)).join(' + ')} = {formatCurrency(step.total)}
            </div>
          </div>
        )}

        {step.type === 'readOtherFromBar' && (
          <div className="text-center">
            <h4 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Read {step.otherPerson}'s share from bar:</h4>
            <div className="text-4xl font-bold" style={{ color: '#000000' }}>
              {formatCurrency(step.share)}
            </div>
          </div>
        )}

        {step.type === 'barModelDifference' && step.bars && (
          <div>
            <h4 className="text-2xl font-semibold mb-4 text-center" style={{ color: '#000000' }}>Bar Model - showing the difference:</h4>
            <div className="flex flex-col gap-3 items-start" style={{ marginLeft: '25%' }}>
              {step.bars.map((bar, i) => {
                const isLargerPerson = i === step.largerPerson;
                const smallerBoxCount = Math.min(step.bars[0].boxes, step.bars[1].boxes);
                
                return (
                  <div key={i} className="flex items-center">
                    <div className="w-32 text-2xl font-bold text-left flex-shrink-0" style={{ color: '#000000' }}>{bar.person}</div>
                    <div className="flex gap-1">
                      {Array(bar.boxes).fill(0).map((_, boxIdx) => {
                        const isDifferenceBox = isLargerPerson && boxIdx >= smallerBoxCount;
                        return (
                          <div 
                            key={boxIdx} 
                            className="w-20 h-20 border-4 rounded flex-shrink-0"
                            style={{
                              borderColor: isDifferenceBox ? '#a855f7' : '#9ca3af',
                              backgroundColor: isDifferenceBox ? getBarDiffBg() : getBarEmptyBg()
                            }}>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="ml-32 mt-2">
                <div className="text-2xl font-bold px-4 py-2 rounded-lg inline-flex items-center gap-2" style={{ color: '#000000', backgroundColor: getBarDiffBg() }}>
                  <span className="inline-block w-6 h-6 border-4 rounded" style={{ borderColor: '#a855f7', backgroundColor: getBarDiffBg() }}></span>
                  Difference: {formatCurrency(step.difference)}
                </div>
              </div>
            </div>
          </div>
        )}

        {step.type === 'identifyDifferenceParts' && (
          <div className="text-center">
            <h4 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>The difference represents:</h4>
            <div className="text-4xl font-bold" style={{ color: '#000000' }}>
              {step.partDifference} part{step.partDifference !== 1 ? 's' : ''} = {formatCurrency(step.difference)}
            </div>
          </div>
        )}

        {step.type === 'calculatePartValueFromDifference' && (
          <div className="text-center">
            <h4 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Calculate value of 1 part:</h4>
            <div className="text-4xl font-bold" style={{ color: '#000000' }}>
              {formatCurrency(step.difference)} ÷ {step.partDifference} = {formatCurrency(step.partValue)}
            </div>
          </div>
        )}

        {step.type === 'readPersonAFromBar' && (
          <div className="text-center">
            <h4 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Read {step.person}'s share from bar:</h4>
            <div className="text-4xl font-bold" style={{ color: '#000000' }}>
              {formatCurrency(step.share)}
            </div>
          </div>
        )}

        {step.type === 'readPersonBFromBar' && (
          <div className="text-center">
            <h4 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Read {step.person}'s share from bar:</h4>
            <div className="text-4xl font-bold" style={{ color: '#000000' }}>
              {formatCurrency(step.share)}
            </div>
          </div>
        )}

        {step.type === 'showGivenDifference' && step.names && (
          <div className="text-center">
            <h4 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Given information:</h4>
            <div className="space-y-3">
              <div className="text-3xl font-medium" style={{ color: '#000000' }}>
                {step.names.join(' : ')} = {step.ratio}
              </div>
              <div className="text-3xl font-medium" style={{ color: '#000000' }}>
                Difference: {formatCurrency(step.difference)}
              </div>
            </div>
          </div>
        )}

        {step.type === 'calculatePersonA' && (
          <div className="text-center">
            <h4 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Calculate {step.person}'s share:</h4>
            <div className="text-4xl font-bold" style={{ color: '#000000' }}>
              {step.ratioPart} × {formatCurrency(step.partValue)} = {formatCurrency(step.share)}
            </div>
          </div>
        )}

        {step.type === 'calculatePersonB' && (
          <div className="text-center">
            <h4 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Calculate {step.person}'s share:</h4>
            <div className="text-4xl font-bold" style={{ color: '#000000' }}>
              {step.ratioPart} × {formatCurrency(step.partValue)} = {formatCurrency(step.share)}
            </div>
          </div>
        )}

        {step.type === 'answerDifference' && step.names && step.shares && (
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-3" style={{ color: '#000000' }}>Answer:</h4>
            <div className="text-5xl font-bold" style={{ color: '#166534' }}>
              {step.questionType === 'personA' && `${step.names[0]}: ${formatCurrency(step.shares[0])}`}
              {step.questionType === 'personB' && `${step.names[1]}: ${formatCurrency(step.shares[1])}`}
              {step.questionType === 'total' && `Total: ${formatCurrency(step.total)}`}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} />
            <span className="font-semibold text-lg">Home</span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border-2 border-gray-200 overflow-hidden z-50">
                <div className="py-2">
                  <div className="px-6 py-2 font-bold text-gray-700 text-sm uppercase tracking-wide">
                    Color Schemes
                  </div>
                  <button 
                    onClick={() => setColorScheme('default')}
                    className={'w-full text-left px-6 py-3 font-semibold transition-colors ' + 
                      (colorScheme === 'default' ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}>
                    Default
                  </button>
                  <button 
                    onClick={() => setColorScheme('blue')}
                    className={'w-full text-left px-6 py-3 font-semibold transition-colors ' + 
                      (colorScheme === 'blue' ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}>
                    Blue
                  </button>
                  <button 
                    onClick={() => setColorScheme('pink')}
                    className={'w-full text-left px-6 py-3 font-semibold transition-colors ' + 
                      (colorScheme === 'pink' ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}>
                    Pink
                  </button>
                  <button 
                    onClick={() => setColorScheme('yellow')}
                    className={'w-full text-left px-6 py-3 font-semibold transition-colors ' + 
                      (colorScheme === 'yellow' ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}>
                    Yellow
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>Dividing Into Ratios</h1>

          {/* Topic Selector */}
          <div className="flex justify-center gap-3 flex-wrap mb-6">
            {['sharing', 'known', 'difference', 'mixed'].map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={'px-8 py-4 rounded-xl font-bold text-xl transition-all ' + 
                  (topic === t 
                    ? 'bg-blue-900 text-white shadow-lg' 
                    : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900 border-2 border-gray-200 shadow')}>
                {t === 'sharing' ? 'Sharing in a Ratio' :
                 t === 'known' ? 'Known Amounts' :
                 t === 'difference' ? 'Given Difference' :
                 'Mixed Sharing'}
              </button>
            ))}
          </div>

          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '1px', backgroundColor: '#d1d5db' }}></div>
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center gap-4 mb-8">
            {['whiteboard', 'single', 'worksheet'].map((m) => (
              <button 
                key={m}
                onClick={() => setMode(m)}
                className={'px-8 py-4 rounded-xl font-bold text-xl transition-all border-2 border-gray-200 ' + 
                  (mode === m 
                    ? 'bg-blue-900 text-white shadow-lg' 
                    : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900 shadow')}>
                {m === 'whiteboard' ? 'Whiteboard' :
                 m === 'single' ? 'Single Q' :
                 'Worksheet'}
              </button>
            ))}
          </div>

          {/* WHITEBOARD & SINGLE Q MODES */}
          {(mode === 'whiteboard' || mode === 'single') && (
            <div className="flex flex-col gap-4" style={mode === 'single' ? { minHeight: '120vh' } : {}}>
              {/* Compact Control Bar */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-600">Difficulty:</span>
                    <div className="flex gap-2">
                      {['level1', 'level2', 'level3'].map((lvl, idx) => (
                        <button 
                          key={lvl}
                          onClick={() => setDifficulty(lvl)}
                          className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                            (difficulty === lvl 
                              ? (lvl === 'level1' ? 'bg-green-600 text-white' :
                                 lvl === 'level2' ? 'bg-yellow-600 text-white' :
                                 'bg-red-600 text-white')
                              : (lvl === 'level1' ? 'bg-white text-green-600 border-2 border-green-600' :
                                 lvl === 'level2' ? 'bg-white text-yellow-600 border-2 border-yellow-600' :
                                 'bg-white text-red-600 border-2 border-red-600'))}>
                          Level {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {topic === 'sharing' && (
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <input type="checkbox" checked={useAlgebraicMethod}
                          onChange={(e) => setUseAlgebraicMethod(e.target.checked)}
                          className="w-3 h-3" />
                        Numerical
                      </label>
                    )}
                    {topic === 'known' && difficulty !== 'level3' && (
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <input type="checkbox" checked={useNumericalMethod}
                          onChange={(e) => setUseNumericalMethod(e.target.checked)}
                          className="w-3 h-3" />
                        Numerical
                      </label>
                    )}
                    {topic === 'difference' && difficulty !== 'level3' && (
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <input type="checkbox" checked={useDifferenceNumericalMethod}
                          onChange={(e) => setUseDifferenceNumericalMethod(e.target.checked)}
                          className="w-3 h-3" />
                        Numerical
                      </label>
                    )}
                    {topic === 'mixed' && difficulty !== 'level3' && (
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <input type="checkbox" checked={useNumericalMethod || useDifferenceNumericalMethod}
                          onChange={(e) => {
                            setUseNumericalMethod(e.target.checked);
                            setUseDifferenceNumericalMethod(e.target.checked);
                          }}
                          className="w-3 h-3" />
                        Numerical
                      </label>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {topic === 'sharing' && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-600">Type:</label>
                        <select value={shareQuestionType}
                          onChange={(e) => setShareQuestionType(e.target.value)}
                          className="px-2 py-1 border-2 border-gray-300 rounded-lg text-xs font-semibold">
                          <option value="mixed">Mixed</option>
                          <option value="personA">Person A</option>
                          <option value="personB">Person B</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                    )}
                    {topic === 'known' && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-600">Type:</label>
                        <select value={knownAmountsQuestionType}
                          onChange={(e) => setKnownAmountsQuestionType(e.target.value)}
                          className="px-2 py-1 border-2 border-gray-300 rounded-lg text-xs font-semibold">
                          <option value="mixed">Mixed</option>
                          <option value="total">Total</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    )}
                    {topic === 'difference' && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-600">Type:</label>
                        <select value={differenceQuestionType}
                          onChange={(e) => setDifferenceQuestionType(e.target.value)}
                          className="px-2 py-1 border-2 border-gray-300 rounded-lg text-xs font-semibold">
                          <option value="mixed">Mixed</option>
                          <option value="total">Total</option>
                          <option value="personA">Person A</option>
                          <option value="personB">Person B</option>
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={handleNewQuestion}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <RefreshCw size={18} />
                      New Question
                    </button>
                    <button 
                      onClick={() => mode === 'whiteboard' ? setShowWhiteboardAnswer(!showWhiteboardAnswer) : setShowAnswer(!showAnswer)}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <Eye size={18} />
                      {(mode === 'whiteboard' ? showWhiteboardAnswer : showAnswer) ? 'Hide Answer' : 'Show Answer'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Question Display */}
              {question && (
                <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
                  {mode === 'whiteboard' ? (
                    <>
                      {!showWhiteboardAnswer ? (
                        <div className="text-6xl font-bold text-center mb-6" style={{ color: '#000000' }}>
                          {question.display}
                        </div>
                      ) : (
                        <div className="text-6xl font-bold text-center mb-6">
                          <span style={{ color: '#000000' }}>{question.display}</span>
                          <div className="mt-4" style={{ color: '#166534' }}>= {question.answer}</div>
                        </div>
                      )}
                      
                      <div className="rounded-xl" style={{ height: '500px', backgroundColor: getWhiteboardWorkingBg() }}></div>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl font-bold text-center mb-8" style={{ color: '#000000' }}>
                        {question.display}
                      </div>
                      
                      {showAnswer && question.working && (
                        <div className="mt-8 space-y-6">
                          <h3 className="text-3xl font-bold mb-6 text-center" style={{ color: '#000000' }}>Solution:</h3>
                          {question.working.map((step, idx) => renderStep(step, idx))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* WORKSHEET MODE */}
          {mode === 'worksheet' && (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="space-y-4">
                  {/* Line 1 */}
                  <div className="flex justify-center items-center gap-8">
                    <div className="flex items-center gap-3">
                      <label className="text-lg font-semibold">Questions per level:</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="20" 
                        value={numQuestions} 
                        onChange={(e) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))} 
                        className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="diff" 
                        checked={isDifferentiated} 
                        onChange={(e) => setIsDifferentiated(e.target.checked)} 
                        className="w-5 h-5" 
                      />
                      <label htmlFor="diff" className="text-lg font-semibold">Differentiated</label>
                    </div>
                  </div>

                  {/* Line 2 */}
                  <div className="flex justify-center items-center gap-8">
                    {!isDifferentiated && (
                      <>
                        <div className="flex items-center gap-3">
                          <label className="text-lg font-semibold">Difficulty:</label>
                          <div className="flex gap-2">
                            {['level1', 'level2', 'level3'].map((lvl, idx) => (
                              <button 
                                key={lvl}
                                onClick={() => setDifficulty(lvl)}
                                className={'px-6 py-2 rounded-lg font-semibold w-24 ' + 
                                  (difficulty === lvl 
                                    ? (lvl === 'level1' ? 'bg-green-600 text-white' :
                                       lvl === 'level2' ? 'bg-yellow-600 text-white' :
                                       'bg-red-600 text-white')
                                    : (lvl === 'level1' ? 'bg-white text-green-600 border-2 border-green-600' :
                                       lvl === 'level2' ? 'bg-white text-yellow-600 border-2 border-yellow-600' :
                                       'bg-white text-red-600 border-2 border-red-600'))}>
                                Level {idx + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <label className="text-lg font-semibold">Columns:</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="4" 
                            value={numColumns} 
                            onChange={(e) => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))} 
                            className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg" 
                          />
                        </div>
                      </>
                    )}

                    <button onClick={handleGenerateWorksheet}
                      className="px-8 py-3 bg-blue-900 text-white rounded-lg font-semibold text-lg hover:bg-blue-800 shadow-lg">
                      Generate Worksheet
                    </button>
                    {worksheet.length > 0 && (
                      <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)}
                        className="px-8 py-3 bg-blue-900 text-white rounded-lg font-semibold text-lg flex items-center gap-2 hover:bg-blue-800 shadow-lg">
                        <Eye size={20} />
                        {showWorksheetAnswers ? 'Hide' : 'Show'} Answers
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {worksheet.length > 0 && (
                <div className="bg-white rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQuestionBg() }}>
                  {/* Font Size Controls */}
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    <button 
                      onClick={() => setWorksheetFontSize(Math.max(0, worksheetFontSize - 1))} 
                      disabled={worksheetFontSize === 0} 
                      className={'w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ' + 
                        (worksheetFontSize === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-blue-800')}>
                      <ChevronDown size={20} />
                    </button>
                    <button 
                      onClick={() => setWorksheetFontSize(Math.min(3, worksheetFontSize + 1))} 
                      disabled={worksheetFontSize === 3} 
                      className={'w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ' + 
                        (worksheetFontSize === 3 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-blue-800')}>
                      <ChevronUp size={20} />
                    </button>
                  </div>

                  <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>
                    Dividing Into Ratios Worksheet
                  </h2>
                  
                  {isDifferentiated ? (
                    <div className="grid grid-cols-3 gap-6">
                      {['level1', 'level2', 'level3'].map((lvl, idx) => (
                        <div key={lvl} className={'rounded-xl p-6 border-4 ' +
                          (lvl === 'level1' ? 'bg-green-50 border-green-500' :
                           lvl === 'level2' ? 'bg-yellow-50 border-yellow-500' :
                           'bg-red-50 border-red-500')}>
                          <h3 className="text-2xl font-bold text-center mb-6" style={{ color: '#000000' }}>
                            Level {idx + 1}
                          </h3>
                          <div className="space-y-3">
                            {worksheet.filter(q => q.difficulty === lvl).map((q, i) => (
                              <div key={i} className={getFontSize()} style={{ color: '#000000' }}>
                                <span className="font-semibold" style={{ color: '#000000' }}>{i + 1}.</span>
                                <span className="ml-3 font-bold" style={{ color: '#000000' }}>
                                  {q.display}
                                </span>
                                {showWorksheetAnswers && (
                                  <div className="ml-8 font-semibold mt-1" style={{ color: '#059669' }}>
                                    = {q.answer}
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
                      numColumns === 3 ? 'grid-cols-3' :
                      'grid-cols-4'
                    }`}>
                      {worksheet.map((q, i) => (
                        <div key={i} className={getFontSize()} style={{ color: '#000000' }}>
                          <span className="font-semibold" style={{ color: '#000000' }}>{i + 1}.</span>
                          <span className="ml-2 font-bold" style={{ color: '#000000' }}>
                            {q.display}
                          </span>
                          {showWorksheetAnswers && (
                            <span className="ml-3 font-semibold" style={{ color: '#059669' }}>
                              = {q.answer}
                            </span>
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
};

export default RatioSharingTool;
