/**
 * ManoMitra Application Integration
 * Handles integration between different components of the application
 */

// Global namespace for ManoMitra application
window.ManoMitra = window.ManoMitra || {};

// Initialize application
ManoMitra.init = function() {
  console.log('Initializing ManoMitra application...');
  
  // Load user data if available
  ManoMitra.loadUserData();
  
  // Add event listeners
  ManoMitra.setupEventListeners();
};

// Load user data from localStorage
ManoMitra.loadUserData = function() {
  // Check if we have a current user in session storage
  const currentUsername = sessionStorage.getItem('manomitraCurrentUser');
  
  if (currentUsername) {
    // Get user data from localStorage
    const allUsers = JSON.parse(localStorage.getItem('manomitraUsers')) || [];
    ManoMitra.currentUser = allUsers.find(user => user.username === currentUsername);
    
    // If user found, trigger user loaded event
    if (ManoMitra.currentUser) {
      const event = new CustomEvent('userdataloaded', { detail: ManoMitra.currentUser });
      document.dispatchEvent(event);
    }
  }
};

// Set up global event listeners
ManoMitra.setupEventListeners = function() {
  // Listen for login events
  document.addEventListener('userlogin', function(e) {
    const username = e.detail.username;
    
    // Store in session storage
    sessionStorage.setItem('manomitraCurrentUser', username);
    
    // Reload user data
    ManoMitra.loadUserData();
  });
  
  // Listen for logout events
  document.addEventListener('userlogout', function() {
    // Clear session storage
    sessionStorage.removeItem('manomitraCurrentUser');
    
    // Clear current user
    ManoMitra.currentUser = null;
  });
  
  // Listen for game completion events
  document.addEventListener('gamecompleted', function(e) {
    const gameData = e.detail;
    
    // Save game results
    ManoMitra.saveGameResult(gameData);
  });
};

// Save game result to localStorage
ManoMitra.saveGameResult = function(gameData) {
  // Make sure we have required data
  if (!gameData || !gameData.gameId || !ManoMitra.currentUser) {
    console.error('Cannot save game result: Missing gameId or user');
    return;
  }
  
  // Add user information
  gameData.userId = ManoMitra.currentUser.username;
  gameData.timestamp = new Date().toISOString();
  
  // Get existing game data from localStorage
  const existingData = JSON.parse(localStorage.getItem('manomitraGameData')) || [];
  
  // Add new game result
  existingData.push(gameData);
  
  // Save back to localStorage
  localStorage.setItem('manomitraGameData', JSON.stringify(existingData));
  
  console.log('Game result saved:', gameData);
  
  // Also update user stats
  ManoMitra.updateUserStats(gameData);
};

// Update user statistics based on game results
ManoMitra.updateUserStats = function(gameData) {
  if (!ManoMitra.currentUser) return;
  
  // Get existing user stats from localStorage
  const allUserStats = JSON.parse(localStorage.getItem('manomitraUserStats')) || {};
  
  // Initialize stats for this user if needed
  if (!allUserStats[ManoMitra.currentUser.username]) {
    allUserStats[ManoMitra.currentUser.username] = {
      gamesPlayed: 0,
      streak: 1,
      lastPlayed: null,
      skillLevels: {
        memory: 0.2, // Start with some baseline values
        focus: 0.2,
        problem: 0.2,
        reaction: 0.2
      },
      gameStats: {}
    };
  }
  
  const userStats = allUserStats[ManoMitra.currentUser.username];
  
  // Update basic stats
  userStats.gamesPlayed++;
  
  // Calculate streak
  const today = new Date().toISOString().split('T')[0];
  const lastPlayed = userStats.lastPlayed ? new Date(userStats.lastPlayed).toISOString().split('T')[0] : null;
  
  if (lastPlayed) {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    if (lastPlayed === today) {
      // Already played today, streak unchanged
    } else if (lastPlayed === yesterdayString) {
      // Played yesterday, increase streak
      userStats.streak++;
    } else {
      // Missed a day, reset streak
      userStats.streak = 1;
    }
  }
  
  userStats.lastPlayed = new Date().toISOString();
  
  // Initialize or update game-specific stats
  if (!userStats.gameStats[gameData.gameId]) {
    userStats.gameStats[gameData.gameId] = {
      timesPlayed: 0,
      bestScore: 0,
      lastPlayed: null
    };
  }
  
  const gameStats = userStats.gameStats[gameData.gameId];
  gameStats.timesPlayed++;
  gameStats.lastPlayed = new Date().toISOString();
  
  // Handle game-specific scoring
  switch(gameData.gameId) {
    case 'reaction-time':
      // Lower is better for reaction time
      if (!gameStats.bestScore || gameData.score < gameStats.bestScore) {
        gameStats.bestScore = gameData.score;
      }
      break;
    default:
      // Higher is better for most games
      if (gameData.score > gameStats.bestScore) {
        gameStats.bestScore = gameData.score;
      }
  }
  
  // Update skill levels based on game results
  ManoMitra.updateSkillLevels(userStats, gameData);
  
  // Save updated stats
  allUserStats[ManoMitra.currentUser.username] = userStats;
  localStorage.setItem('manomitraUserStats', JSON.stringify(allUserStats));
  
  console.log('User stats updated:', userStats);
};

// Update skill levels based on game results
ManoMitra.updateSkillLevels = function(userStats, gameData) {
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
  const skillMap = gameSkillMap[gameData.gameId];
  if (!skillMap) return;
  
  // Normalize score based on game type (0-1 scale)
  let normalizedScore = 0;
  
  switch (gameData.gameId) {
    case 'reaction-time':
      // Convert reaction time to 0-1 scale (lower is better)
      // Assuming 600ms is bad (0), 200ms is good (1)
      normalizedScore = Math.max(0, Math.min(1, (600 - gameData.score) / 400));
      break;
    case 'sequence-recall':
    case 'pattern-recognition':
      // Level-based games (assuming max level 20)
      normalizedScore = Math.min(1, gameData.level / 20);
      break;
    default:
      // Score-based games (assuming 0-100 scale)
      normalizedScore = Math.min(1, gameData.score / 100);
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
};

// Get recommendations based on user performance
ManoMitra.getRecommendations = function() {
  if (!ManoMitra.currentUser) return [];
  
  // Get user stats
  const allUserStats = JSON.parse(localStorage.getItem('manomitraUserStats')) || {};
  const userStats = allUserStats[ManoMitra.currentUser.username];
  
  if (!userStats) return [];
  
  const recommendations = [];
  
  // Find the weakest skill
  let weakestSkill = null;
  let lowestLevel = 1;
  
  for (const [skill, level] of Object.entries(userStats.skillLevels)) {
    if (level < lowestLevel) {
      lowestLevel = level;
      weakestSkill = skill;
    }
  }
  
  // Generate recommendations based on weakest skill
  if (weakestSkill) {
    // Convert skill name to readable form
    const skillNames = {
      'memory': 'Memory',
      'focus': 'Focus & Attention',
      'problem': 'Problem Solving',
      'reaction': 'Reaction Speed'
    };
    
    // Recommend games based on weakest skill
    const gameRecommendations = [];
    
    switch(weakestSkill) {
      case 'memory':
        gameRecommendations.push('Memory Match Game', 'Sequence Recall Game', 'Word Association Game');
        break;
      case 'focus':
        gameRecommendations.push('Mindfulness Breathing Exercise', 'Find the Difference Game', 'Sequence Recall Game');
        break;
      case 'problem':
        gameRecommendations.push('Pattern Recognition Game', 'Math Game', 'Word Association Game');
        break;
      case 'reaction':
        gameRecommendations.push('Reaction Time Game', 'Find the Difference Game');
        break;
    }
    
    recommendations.push({
      skill: skillNames[weakestSkill] || weakestSkill,
      message: `Your ${skillNames[weakestSkill] || weakestSkill} skills could use improvement.`,
      games: gameRecommendations
    });
  }
  
  return recommendations;
};

// Export data to Excel
ManoMitra.exportToExcel = function() {
  if (typeof window.excelExporter === 'undefined') {
    console.error('Excel exporter not available. Make sure excel-exporter.js is loaded.');
    return;
  }
  
  if (ManoMitra.currentUser) {
    window.excelExporter.exportUserData(ManoMitra.currentUser.username);
  } else {
    window.excelExporter.exportUserData(null); // Export all data
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', ManoMitra.init);