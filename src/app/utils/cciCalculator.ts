import { CCIParameter, CCIResult, maturityLevels, CategoryScore, ImprovementArea } from '../types';

/**
 * Calculate the individual score for a parameter
 */
export const calculateParameterScore = (parameter: CCIParameter): number => {
  if (parameter.denominator === 0) return 0;
  
  // Calculate raw percentage
  const percentage = (parameter.numerator / parameter.denominator) * 100;
  
  // For most parameters, higher is better (target is 100%)
  if (parameter.target === 100) {
    return Math.min(percentage, 100);
  }
  
  // For parameter #12 (Physical Security Incidents), lower is better (target is 0%)
  if (parameter.target === 0) {
    return Math.max(0, 100 - percentage);
  }
  
  // For parameter #19 (Critical Assets) which has a target of 50%
  if (parameter.target === 50) {
    // If percentage is 50% or higher, score is 100
    if (percentage >= 50) return 100;
    // Otherwise, score is proportionally calculated
    return (percentage / 50) * 100;
  }
  
  return 0; // Default fallback
};

/**
 * Calculate the weighted score for a parameter
 */
export const calculateWeightedScore = (parameter: CCIParameter): number => {
  const score = calculateParameterScore(parameter);
  return (score * parameter.weightage) / 100;
};

/**
 * Calculate total score without category or improvement calculations (to avoid recursion)
 */
export const calculateBasicCCIScore = (parameters: CCIParameter[]): number => {
  // Update self-assessment scores
  const updatedParameters = parameters.map(param => ({
    ...param,
    selfAssessmentScore: calculateParameterScore(param)
  }));
  
  // Calculate total weighted score
  return updatedParameters.reduce((sum, param) => {
    return sum + calculateWeightedScore(param);
  }, 0);
};

/**
 * Calculate the overall CCI index and maturity level
 */
export const calculateCCIIndex = (parameters: CCIParameter[]): CCIResult => {
  // Update self-assessment scores
  const updatedParameters = parameters.map(param => ({
    ...param,
    selfAssessmentScore: calculateParameterScore(param)
  }));
  
  // Calculate total weighted score
  const totalScore = updatedParameters.reduce((sum, param) => {
    return sum + calculateWeightedScore(param);
  }, 0);
  
  // Determine maturity level
  const maturityLevel = maturityLevels.find(
    level => totalScore >= level.min && totalScore <= level.max
  ) || maturityLevels[maturityLevels.length - 1];
  
  // Calculate category scores
  const categories = [...new Set(parameters.filter(p => p.frameworkCategory).map(p => p.frameworkCategory?.split(':')[0]))];
  const categoryScores: CategoryScore[] = categories.map(category => {
    if (!category) return { name: 'Uncategorized', score: 0 };
    
    const categoryParams = parameters.filter(p => p.frameworkCategory?.startsWith(category));
    const totalWeight = categoryParams.reduce((sum, p) => sum + p.weightage, 0);
    
    let score = 0;
    if (totalWeight > 0) {
      score = categoryParams.reduce((sum, p) => {
        return sum + (calculateParameterScore(p) * p.weightage);
      }, 0) / totalWeight;
    }
    
    return {
      name: category,
      score: score
    };
  });
  
  // Calculate improvement areas
  const improvementAreas: ImprovementArea[] = [];
  
  // For each parameter, calculate impact if improved to target
  updatedParameters.forEach(param => {
    const currentScore = calculateParameterScore(param);
    const targetScore = param.target || 100;
    const gap = Math.max(0, targetScore - currentScore);
    
    // Skip if already at target
    if (gap <= 0) return;
    
    // Clone parameters and calculate CCI with this parameter at target
    const paramsWithImprovement = parameters.map(p => 
      p.id === param.id 
        ? { ...p, numerator: (p.denominator * targetScore) / 100 } 
        : p
    );
    
    const improvedScore = calculateBasicCCIScore(paramsWithImprovement);
    const impact = improvedScore - totalScore;
    
    improvementAreas.push({
      measureId: param.measureId,
      title: param.title,
      score: currentScore,
      impact: impact
    });
  });
  
  // Sort improvement areas by impact and get top 4
  const topImprovementAreas = improvementAreas
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 4);
  
  return {
    totalScore,
    maturityLevel: maturityLevel.level,
    maturityDescription: maturityLevel.level === 'Fail' 
      ? 'The organization has scored below the cut-off in at least one domain/sub-domain'
      : `The organization has achieved ${maturityLevel.level}`,
    date: new Date().toISOString(),
    organization: 'Your Organization', // This should be dynamically set
    categoryScores: categoryScores,
    improvementAreas: topImprovementAreas
  };
}; 