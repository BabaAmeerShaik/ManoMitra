/**
 * ManoMitra Data Management System
 * Handles data storage, export, and analytics for cognitive games
 */

// Game categories and their associated cognitive skills
const gameCategories = {
  'memory-match': {
    name: 'Memory Match Game',
    skills: ['Visual memory', 'Concentration', 'Short-term memory'],
    metrics: ['Time to complete', 'Number of attempts', 'Pairs matched']
  },
  'sequence-recall': {
    name: 'Sequence Recall Game',
    skills: ['Sequential memory', 'Attention span', 'Auditory/visual sequential training'],
    metrics: ['Highest level reached', 'Correct sequences', 'Average response time']
  },
  'reaction-time': {
    name: 'Reaction Time Game',
    skills: ['Cognitive speed', 'Attention', 'Fast decision-making', 'Reflexes'],
    metrics: ['Average reaction time (ms)', 'Best reaction time', 'Missed targets']
  },
  'math-game': {
    name: 'Simple Math Game',
    skills: ['Logical thinking', 'Calculation', 'Mental arithmetic'],
    metrics: ['Correct answers', 'Total questions', 'Accuracy percentage']
  },
  'word-association': {
    name: 'Word Association Game',
    skills: ['Language skills', 'Memory', 'Verbal association'],
    metrics: ['Correct associations', 'Total attempts', 'Response time']
  },
  'pattern-recognition': {
    name: 'Pattern Recognition Game',
    skills: ['Problem-solving', 'Visual skills', 'Pattern detection'],
    metrics: ['Patterns completed', 'Highest level', 'Accuracy percentage']
  },
  'breathing-exercise': {
    name: 'Mindfulness Breathing Exercise',
    skills: ['Focus', 'Calmness', 'Stress reduction'],
    metrics: ['Completed cycles', 'Total time', 'Consistency']
  },
  'find-difference': {
    name: 'Find the Difference Game',
    skills: ['Visual discrimination', 'Observation', 'Attention to detail'],
    metrics: ['Differences found', 'Time to complete', 'Accuracy']
  }
};

/**
 * Saves game result to localStorage
 * @param {string} userId - The user identifier
 * @param {string} gameId - The game identifier
 * @param {Object} result - The game result object
 */
function saveGameResult(userId, gameId, result) {
  // Get existing game data or initialize empty array
  const gameData = JSON.parse(localStorage.getItem('manomitraGameData')) || [];
  
  // Add user information and timestamp
  const gameResult = {
    userId: userId,
    gameId: gameId,
    ...result,
    timestamp: new Date().toISOString()
  };
  
  // Add to array
  gameData.push(gameResult);
  
  // Save back to localStorage
  localStorage.setItem('manomitraGameData', JSON.stringify(gameData));
  
  // Also update user stats
  updateUserStats(userId, gameId, result);
}

/**
 * Updates user statistics based on game results
 * @param {string} userId - The user identifier
 * @param {string} gameId - The game identifier
 * @param {Object} result - The game result object
 */
function updateUserStats(userId, gameId, result) {
  // Get existing user stats or initialize
  const allUserStats = JSON.parse(localStorage.getItem('manomitraUserStats')) || {};
  
  // Initialize stats for this user if needed
  if (!allUserStats[userId]) {
    allUserStats[userId] = {
      gamesPlayed: 0,
      totalScore: 0,
      skillLevels: {
        memory: 0,
        focus: 0,
        problem: 0,
        reaction: 0
      },
      gameStats: {}
    };
  }
  
  const userStats = allUserStats[userId];
  
  // Update overall stats
  userStats.gamesPlayed++;
  
  // Initialize or update game-specific stats
  if (!userStats.gameStats[gameId]) {
    userStats.gameStats[gameId] = {
      timesPlayed: 0,
      bestScore: 0,
      lastPlayed: null
    };
  }
  
  const gameStats = userStats.gameStats[gameId];
  gameStats.timesPlayed++;
  gameStats.lastPlayed = new Date().toISOString();
  
  // Handle game-specific scoring
  switch(gameId) {
    case 'reaction-time':
      // Lower is better for reaction time
      if (!gameStats.bestScore || result.score < gameStats.bestScore) {
        gameStats.bestScore = result.score;
      }
      break;
    default:
      // Higher is better for most games
      if (result.score > gameStats.bestScore) {
        gameStats.bestScore = result.score;
      }
  }
  
  // Update skill levels based on game results
  updateSkillLevels(userStats, gameId, result);
  
  // Save updated stats
  allUserStats[userId] = userStats;
  localStorage.setItem('manomitraUserStats', JSON.stringify(allUserStats));
}

/**
 * Updates user skill levels based on game results
 * @param {Object} userStats - The user statistics object
 * @param {string} gameId - The game identifier
 * @param {Object} result - The game result object
 */
function updateSkillLevels(userStats, gameId, result) {
  // Mapping of games to primary and secondary skills
  const gameSkillMap = {
    'memory-match': { primary: 'memory', secondary: 'focus' },
    'sequence-recall': { primary: 'memory', secondary: 'focus' },
    'reaction-time': { primary: 'reaction', secondary: null },
    'math-game': { primary: 'problem', secondary: 'focus' },
    'word-association': { primary: 'memory', secondary: 'problem' },
    'pattern-recognition': { primary: 'problem', secondary: 'focus' },
    'breathing-exercise': { primary: 'focus', secondary: null },
    'find-difference': { primary: 'focus', secondary: 'problem' }
  };
  
  // Get skill mapping for this game
  const skillMap = gameSkillMap[gameId];
  if (!skillMap) return;
  
  // Normalize score based on game type (0-1 scale)
  let normalizedScore = 0;
  
  switch (gameId) {
    case 'reaction-time':
      // Convert reaction time to 0-1 scale (lower is better)
      // Assuming 600ms is bad (0), 200ms is good (1)
      normalizedScore = Math.max(0, Math.min(1, (600 - result.score) / 400));
      break;
    case 'sequence-recall':
    case 'pattern-recognition':
      // Level-based games (assuming max level 20)
      normalizedScore = Math.min(1, result.level / 20);
      break;
    default:
      // Score-based games (assuming 0-100 scale)
      normalizedScore = Math.min(1, result.score / 100);
  }
  
  // Update primary skill (more impact)
  if (skillMap.primary) {
    userStats.skillLevels[skillMap.primary] += normalizedScore * 0.1;
    // Cap skill level at 1
    userStats.skillLevels[skillMap.primary] = Math.min(1, userStats.skillLevels[skillMap.primary]);
  }
  
  // Update secondary skill (less impact)
  if (skillMap.secondary) {
    userStats.skillLevels[skillMap.secondary] += normalizedScore * 0.05;
    // Cap skill level at 1
    userStats.skillLevels[skillMap.secondary] = Math.min(1, userStats.skillLevels[skillMap.secondary]);
  }
}

/**
 * Exports all game data to Excel file
 * Uses SheetJS library (xlsx)
 */
function exportToExcel() {
  // This function requires SheetJS (xlsx) library to be included in the page
  if (typeof XLSX === 'undefined') {
    console.error('XLSX library not found. Please include SheetJS in your page.');
    return;
  }
  
  // Get all game data
  const gameData = JSON.parse(localStorage.getItem('manomitraGameData')) || [];
  
  if (gameData.length === 0) {
    alert('No game data to export');
    return;
  }
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create worksheet for each game type
  const gameTypes = [...new Set(gameData.map(item => item.gameId))];
  
  gameTypes.forEach(gameType => {
    // Filter data for this game type
    const gameResults = gameData.filter(item => item.gameId === gameType);
    
    if (gameResults.length === 0) return;
    
    // Get game category info
    const categoryInfo = gameCategories[gameType] || { name: gameType };
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(gameResults);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, categoryInfo.name.substring(0, 31)); // 31 char limit for sheet names
  });
  
  // Create summary worksheet
  const summaryData = gameTypes.map(gameType => {
    const results = gameData.filter(item => item.gameId === gameType);
    const category = gameCategories[gameType] || { name: gameType };
    
    return {
      "Game Type": category.name,
      "Times Played": results.length,
      "First Played": results.length > 0 ? new Date(results[0].timestamp).toLocaleDateString() : '-',
      "Last Played": results.length > 0 ? new Date(results[results.length - 1].timestamp).toLocaleDateString() : '-'
    };
  });
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
  
  // Export file
  XLSX.writeFile(wb, `ManoMitra_GameData_${new Date().toISOString().slice(0,10)}.xlsx`);
}

/**
 * Gets recommendations based on user performance
 * @param {string} userId - The user identifier
 * @returns {Array} - Array of recommendation objects
 */
function getUserRecommendations(userId) {
  // Get user stats
  const allUserStats = JSON.parse(localStorage.getItem('manomitraUserStats')) || {};
  const userStats = allUserStats[userId] || null;
  
  if (!userStats) return [];
  
  const recommendations = [];
  
  // Find weakest skill
  const skillLevels = userStats.skillLevels;
  
  // Find the weakest skill
  let weakestSkill = null;
  let lowestLevel = 1;
  
  for (const [skill, level] of Object.entries(skillLevels)) {
    if (level < lowestLevel) {
      lowestLevel = level;
      weakestSkill = skill;
    }
  }
  
  // Generate recommendations based on weakest skill
  if (weakestSkill) {
    // Find games that target the weakest skill
    const targetGames = [];
    
    for (const [gameId, mapping] of Object.entries({
      'memory-match': { primary: 'memory', secondary: 'focus' },
      'sequence-recall': { primary: 'memory', secondary: 'focus' },
      'reaction-time': { primary: 'reaction', secondary: null },
      'math-game': { primary: 'problem', secondary: 'focus' },
      'word-association': { primary: 'memory', secondary: 'problem' },
      'pattern-recognition': { primary: 'problem', secondary: 'focus' },
      'breathing-exercise': { primary: 'focus', secondary: null },
      'find-difference': { primary: 'focus', secondary: 'problem' }
    })) {
      if (mapping.primary === weakestSkill || mapping.secondary === weakestSkill) {
        targetGames.push(gameId);
      }
    }
    
    // Convert skill name to readable form
    const skillNames = {
      'memory': 'Memory',
      'focus': 'Focus & Attention',
      'problem': 'Problem Solving',
      'reaction': 'Reaction Speed'
    };
    
    // Add recommendation
    recommendations.push({
      skill: skillNames[weakestSkill] || weakestSkill,
      message: `Your ${skillNames[weakestSkill] || weakestSkill} skills could use improvement. Try these games:`,
      games: targetGames.map(gameId => gameCategories[gameId]?.name || gameId)
    });
  }
  
  // Check for games not played recently
  const gameTypes = Object.keys(gameCategories);
  const notPlayedGames = [];
  
  for (const gameId of gameTypes) {
    if (!userStats.gameStats[gameId] || !userStats.gameStats[gameId].timesPlayed) {
      notPlayedGames.push(gameId);
    }
  }
  
  if (notPlayedGames.length > 0) {
    recommendations.push({
      skill: 'Game Variety',
      message: 'Try these games you haven\'t played yet:',
      games: notPlayedGames.map(gameId => gameCategories[gameId]?.name || gameId)
    });
  }
  
  // Add general recommendations for cognitive health
  recommendations.push({
    skill: 'Overall Cognitive Health',
    message: 'For best results, try to:',
    tips: [
      'Play a variety of games to exercise different cognitive skills',
      'Practice consistently (at least 3 times per week)',
      'Gradually increase difficulty as you improve',
      'Take short breaks between intense focus sessions'
    ]
  });
  
  return recommendations;
}

/**
 * Analyzes performance trends over time
 * @param {string} userId - The user identifier
 * @param {string} gameId - Optional game identifier to filter by
 * @returns {Object} - Performance trend data
 */
function analyzePerformanceTrends(userId, gameId = null) {
  // Get all game data
  const gameData = JSON.parse(localStorage.getItem('manomitraGameData')) || [];
  
  // Filter by user ID
  let userData = gameData.filter(item => item.userId === userId);
  
  // Further filter by game ID if specified
  if (gameId) {
    userData = userData.filter(item => item.gameId === gameId);
  }
  
  // Sort by timestamp
  userData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  if (userData.length === 0) {
    return {
      dataPoints: [],
      improvement: 0,
      trend: 'neutral'
    };
  }
  
  // Group by week
  const weeklyData = {};
  
  userData.forEach(item => {
    const date = new Date(item.timestamp);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Set to start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        count: 0,
        totalScore: 0,
        scores: []
      };
    }
    
    // Normalize score based on game type
    let normalizedScore;
    
    switch (item.gameId) {
      case 'reaction-time':
        // Lower is better, normalize to 0-100 range (600ms → 0, 200ms → 100)
        normalizedScore = Math.max(0, Math.min(100, (600 - item.score) / 4));
        break;
      default:
        // Assume scores are already in a reasonable range
        normalizedScore = item.score;
    }
    
    weeklyData[weekKey].count++;
    weeklyData[weekKey].totalScore += normalizedScore;
    weeklyData[weekKey].scores.push(normalizedScore);
  });
  
  // Calculate weekly averages
  const dataPoints = Object.keys(weeklyData).map(week => {
    const data = weeklyData[week];
    return {
      week: week,
      average: data.totalScore / data.count,
      count: data.count
    };
  });
  
  // Calculate overall improvement
  let improvement = 0;
  let trend = 'neutral';
  
  if (dataPoints.length >= 2) {
    const firstAvg = dataPoints[0].average;
    const lastAvg = dataPoints[dataPoints.length - 1].average;
    
    improvement = ((lastAvg - firstAvg) / firstAvg) * 100;
    
    if (improvement > 5) {
      trend = 'improving';
    } else if (improvement < -5) {
      trend = 'declining';
    }
  }
  
  return {
    dataPoints,
    improvement,
    trend
  };
}

/**
 * Generates a cognitive health report for the user
 * @param {string} userId - The user identifier
 * @returns {Object} - Report data
 */
function generateCognitiveReport(userId) {
  // Get user stats
  const allUserStats = JSON.parse(localStorage.getItem('manomitraUserStats')) || {};
  const userStats = allUserStats[userId] || null;
  
  if (!userStats) {
    return {
      message: 'No data available for this user',
      data: null
    };
  }
  
  // Get all game data
  const gameData = JSON.parse(localStorage.getItem('manomitraGameData')) || [];
  const userData = gameData.filter(item => item.userId === userId);
  
  // Get performance trends
  const trends = analyzePerformanceTrends(userId);
  
  // Get recommendations
  const recommendations = getUserRecommendations(userId);
  
  // Calculate overall cognitive score (0-100)
  let overallScore = 0;
  let totalWeight = 0;
  
  const weights = {
    'memory': 0.3,
    'focus': 0.3,
    'problem': 0.25,
    'reaction': 0.15
  };
  
  for (const [skill, level] of Object.entries(userStats.skillLevels)) {
    const weight = weights[skill] || 0.1;
    overallScore += level * 100 * weight;
    totalWeight += weight;
  }
  
  if (totalWeight > 0) {
    overallScore = Math.round(overallScore / totalWeight);
  }
  
  // Generate report
  return {
    overallScore,
    skillLevels: userStats.skillLevels,
    gamesPlayed: userData.length,
    uniqueGamesPlayed: Object.keys(userStats.gameStats).length,
    lastActivity: userData.length > 0 ? userData[userData.length - 1].timestamp : null,
    improvement: trends.improvement,
    trend: trends.trend,
    recommendations,
    dataPoints: trends.dataPoints
  };
}

// Export functions for use in other files
window.ManoMitraData = {
  saveGameResult,
  exportToExcel,
  getUserRecommendations,
  analyzePerformanceTrends,
  generateCognitiveReport
};