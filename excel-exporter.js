/**
 * ManoMitra Excel Data Exporter
 * Handles exporting game data to Excel spreadsheets
 * Requires SheetJS library to be included in the page
 */

class ManoMitraExcelExporter {
  constructor() {
    // Check if SheetJS library is available
    if (typeof XLSX === 'undefined') {
      console.error('SheetJS library not loaded. Please include it in your page.');
      this.isReady = false;
    } else {
      this.isReady = true;
    }
    
    // Define game metadata
    this.gameMetadata = {
      'memory-match': {
        name: 'Memory Match Game',
        columns: ['Date', 'Time (s)', 'Pairs Found', 'Total Pairs', 'Score'],
        skills: ['Visual memory', 'Short-term memory', 'Concentration']
      },
      'sequence-recall': {
        name: 'Sequence Recall Game',
        columns: ['Date', 'Level Reached', 'Correct Sequences', 'Total Attempts', 'Score'],
        skills: ['Sequential memory', 'Attention span', 'Pattern recognition']
      },
      'reaction-time': {
        name: 'Reaction Time Game',
        columns: ['Date', 'Average Time (ms)', 'Best Time (ms)', 'Attempts', 'Score'],
        skills: ['Cognitive speed', 'Attention', 'Reflexes']
      },
      'math-game': {
        name: 'Math Game',
        columns: ['Date', 'Correct Answers', 'Total Questions', 'Time (s)', 'Score'],
        skills: ['Calculation', 'Logical thinking', 'Mental arithmetic']
      },
      'word-association': {
        name: 'Word Association Game',
        columns: ['Date', 'Correct Associations', 'Total Attempts', 'Time (s)', 'Score'],
        skills: ['Verbal memory', 'Language association', 'Semantic processing']
      },
      'pattern-recognition': {
        name: 'Pattern Recognition Game',
        columns: ['Date', 'Level Reached', 'Patterns Completed', 'Accuracy (%)', 'Score'],
        skills: ['Visual pattern detection', 'Problem-solving', 'Spatial reasoning']
      },
      'breathing-exercise': {
        name: 'Mindfulness Breathing',
        columns: ['Date', 'Completed Cycles', 'Total Time (min)', 'Consistency (%)', 'Score'],
        skills: ['Focus', 'Calmness', 'Stress management']
      },
      'find-difference': {
        name: 'Find the Difference Game',
        columns: ['Date', 'Differences Found', 'Total Differences', 'Time (s)', 'Score'],
        skills: ['Visual discrimination', 'Attention to detail', 'Observation']
      }
    };
  }
  
  /**
   * Export all game data for a specific user
   * @param {string} username - Username to filter data by
   */
  exportUserData(username) {
    if (!this.isReady) {
      console.error('Excel exporter not ready. SheetJS library missing.');
      return;
    }
    
    // Get game data from localStorage
    const gameData = JSON.parse(localStorage.getItem('manomitraGameData')) || [];
    
    // Filter by username if provided
    const filteredData = username 
      ? gameData.filter(item => item.userId === username)
      : gameData;
    
    if (filteredData.length === 0) {
      alert('No game data to export');
      return;
    }
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add user info sheet
    this._addUserInfoSheet(wb, username);
    
    // Group data by game type
    const gameTypes = [...new Set(filteredData.map(item => item.gameId))];
    
    // Create sheet for each game type
    gameTypes.forEach(gameType => {
      this._addGameSheet(wb, gameType, filteredData.filter(item => item.gameId === gameType));
    });
    
    // Add summary sheet
    this._addSummarySheet(wb, filteredData, gameTypes);
    
    // Generate filename
    let filename = 'ManoMitra_GameData';
    if (username) {
      filename += `_${username}`;
    }
    filename += `_${new Date().toISOString().slice(0,10)}.xlsx`;
    
    // Export workbook
    XLSX.writeFile(wb, filename);
  }
  
  /**
   * Export data for a specific game type
   * @param {string} gameId - The game identifier
   * @param {string} username - Optional username to filter by
   */
  exportGameData(gameId, username = null) {
    if (!this.isReady) {
      console.error('Excel exporter not ready. SheetJS library missing.');
      return;
    }
    
    // Get game data from localStorage
    const gameData = JSON.parse(localStorage.getItem('manomitraGameData')) || [];
    
    // Filter by game ID and username if provided
    let filteredData = gameData.filter(item => item.gameId === gameId);
    
    if (username) {
      filteredData = filteredData.filter(item => item.userId === username);
    }
    
    if (filteredData.length === 0) {
      alert(`No data available for ${this.gameMetadata[gameId]?.name || gameId}`);
      return;
    }
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add game sheet
    this._addGameSheet(wb, gameId, filteredData);
    
    // Generate filename
    let filename = `ManoMitra_${this.gameMetadata[gameId]?.name || gameId}`;
    if (username) {
      filename += `_${username}`;
    }
    filename += `_${new Date().toISOString().slice(0,10)}.xlsx`;
    
    // Export workbook
    XLSX.writeFile(wb, filename);
  }
  
  /**
   * Export cognitive assessment report
   * @param {string} username - Username to generate report for
   */
  exportCognitiveReport(username) {
    if (!this.isReady) {
      console.error('Excel exporter not ready. SheetJS library missing.');
      return;
    }
    
    // Get user stats
    const allUserStats = JSON.parse(localStorage.getItem('manomitraUserStats')) || {};
    const userStats = allUserStats[username];
    
    if (!userStats) {
      alert(`No data available for user ${username}`);
      return;
    }
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add user info sheet
    this._addUserInfoSheet(wb, username);
    
    // Add cognitive assessment sheet
    this._addCognitiveAssessmentSheet(wb, username, userStats);
    
    // Generate filename
    const filename = `ManoMitra_CognitiveReport_${username}_${new Date().toISOString().slice(0,10)}.xlsx`;
    
    // Export workbook
    XLSX.writeFile(wb, filename);
  }
  
  /**
   * Add user info sheet to workbook
   * @param {Object} wb - Workbook object
   * @param {string} username - Username
   * @private
   */
  _addUserInfoSheet(wb, username) {
    // Get user info
    const allUsers = JSON.parse(localStorage.getItem('manomitraUsers')) || [];
    const user = allUsers.find(u => u.username === username);
    
    if (!user) return;
    
    // Create user info data
    const userInfo = [
      ['Username', username],
      ['Member Since', new Date().toLocaleDateString()], // Placeholder - actual creation date not stored
      ['', ''],
      ['Cognitive Assessment', ''],
      ['Memory', Math.round((user.skillLevels?.memory || 0) * 100) + '%'],
      ['Focus & Attention', Math.round((user.skillLevels?.focus || 0) * 100) + '%'],
      ['Problem Solving', Math.round((user.skillLevels?.problem || 0) * 100) + '%'],
      ['Reaction Speed', Math.round((user.skillLevels?.reaction || 0) * 100) + '%']
    ];
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(userInfo);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Column A width
      { wch: 30 }  // Column B width
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'User Info');
  }
  
  /**
   * Add game data sheet to workbook
   * @param {Object} wb - Workbook object
   * @param {string} gameId - Game identifier
   * @param {Array} gameData - Game data array
   * @private
   */
  _addGameSheet(wb, gameId, gameData) {
    // Get game metadata
    const metadata = this.gameMetadata[gameId] || {
      name: gameId,
      columns: ['Date', 'Score']
    };
    
    // Prepare data for sheet
    const sheetData = [metadata.columns];
    
    // Sort data by date (oldest first)
    gameData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Process each game record
    gameData.forEach(record => {
      const row = [];
      
      // Format date
      row.push(new Date(record.timestamp).toLocaleDateString());
      
      // Add game-specific data
      switch(gameId) {
        case 'memory-match':
          row.push(record.time || '');
          row.push(record.pairsFound || '');
          row.push(record.totalPairs || '');
          row.push(record.score || '');
          break;
        case 'sequence-recall':
          row.push(record.level || '');
          row.push(record.correctSequences || '');
          row.push(record.attempts || '');
          row.push(record.score || '');
          break;
        case 'reaction-time':
          row.push(record.averageTime || '');
          row.push(record.bestTime || '');
          row.push(record.attempts || '');
          row.push(record.score || '');
          break;
        case 'math-game':
          row.push(record.correctAnswers || '');
          row.push(record.totalQuestions || '');
          row.push(record.time || '');
          row.push(record.score || '');
          break;
        case 'word-association':
          row.push(record.correctAssociations || '');
          row.push(record.totalAttempts || '');
          row.push(record.time || '');
          row.push(record.score || '');
          break;
        case 'pattern-recognition':
          row.push(record.level || '');
          row.push(record.patternsCompleted || '');
          row.push(record.accuracy || '');
          row.push(record.score || '');
          break;
        case 'breathing-exercise':
          row.push(record.cycles || '');
          row.push(record.totalTime || '');
          row.push(record.consistency || '');
          row.push(record.score || '');
          break;
        case 'find-difference':
          row.push(record.differencesFound || '');
          row.push(record.totalDifferences || '');
          row.push(record.time || '');
          row.push(record.score || '');
          break;
        default:
          row.push(record.score || '');
      }
      
      sheetData.push(row);
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Set column widths
    ws['!cols'] = metadata.columns.map(() => ({ wch: 15 }));
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, metadata.name.substring(0, 31)); // 31 char limit for sheet names
  }
  
  /**
   * Add summary sheet to workbook
   * @param {Object} wb - Workbook object
   * @param {Array} gameData - Game data array
   * @param {Array} gameTypes - Array of game types
   * @private
   */
  _addSummarySheet(wb, gameData, gameTypes) {
    // Create summary header row
    const summaryData = [['Game Type', 'Times Played', 'First Played', 'Last Played', 'Average Score', 'Best Score']];
    
    // Process each game type
    gameTypes.forEach(gameType => {
      const gameResults = gameData.filter(item => item.gameId === gameType);
      
      if (gameResults.length === 0) return;
      
      // Sort by date
      gameResults.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Get game metadata
      const metadata = this.gameMetadata[gameType] || { name: gameType };
      
      // Calculate average score
      let totalScore = 0;
      let bestScore = 0;
      
      gameResults.forEach(result => {
        const score = parseFloat(result.score) || 0;
        totalScore += score;
        
        // Update best score (for reaction time, lower is better)
        if (gameType === 'reaction-time') {
          if (bestScore === 0 || score < bestScore) {
            bestScore = score;
          }
        } else {
          if (score > bestScore) {
            bestScore = score;
          }
        }
      });
      
      const averageScore = totalScore / gameResults.length;
      
      // Add row to summary data
      summaryData.push([
        metadata.name,
        gameResults.length,
        new Date(gameResults[0].timestamp).toLocaleDateString(),
        new Date(gameResults[gameResults.length - 1].timestamp).toLocaleDateString(),
        gameType === 'reaction-time' ? `${averageScore.toFixed(0)} ms` : averageScore.toFixed(2),
        gameType === 'reaction-time' ? `${bestScore} ms` : bestScore.toFixed(0)
      ]);
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Game Type
      { wch: 12 }, // Times Played
      { wch: 15 }, // First Played
      { wch: 15 }, // Last Played
      { wch: 15 }, // Average Score
      { wch: 15 }  // Best Score
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
  }
  
  /**
   * Add cognitive assessment sheet to workbook
   * @param {Object} wb - Workbook object
   * @param {string} username - Username
   * @param {Object} userStats - User statistics
   * @private
   */
  _addCognitiveAssessmentSheet(wb, username, userStats) {
    // Get game data for performance trends
    const gameData = JSON.parse(localStorage.getItem('manomitraGameData')) || [];
    const userData = gameData.filter(item => item.userId === username);
    
    // Create cognitive assessment data
    const assessmentData = [
      ['Cognitive Assessment Report'],
      ['User', username],
      ['Date', new Date().toLocaleDateString()],
      [''],
      ['Skill Levels (0-100%)'],
      ['Memory', Math.round((userStats.skillLevels?.memory || 0) * 100) + '%'],
      ['Focus & Attention', Math.round((userStats.skillLevels?.focus || 0) * 100) + '%'],
      ['Problem Solving', Math.round((userStats.skillLevels?.problem || 0) * 100) + '%'],
      ['Reaction Speed', Math.round((userStats.skillLevels?.reaction || 0) * 100) + '%'],
      [''],
      ['Activity Summary'],
      ['Games Played', userStats.gamesPlayed || 0],
      ['Unique Game Types', Object.keys(userStats.gameStats || {}).length],
      ['Last Activity', userData.length > 0 ? new Date(userData[userData.length - 1].timestamp).toLocaleDateString() : 'N/A'],
      [''],
      ['Game Performance Summary']
    ];
    
    // Add performance summary for each game type
    Object.entries(userStats.gameStats || {}).forEach(([gameId, stats]) => {
      const metadata = this.gameMetadata[gameId] || { name: gameId };
      
      assessmentData.push([
        metadata.name,
        `Times Played: ${stats.timesPlayed || 0}`,
        `Best Score: ${stats.bestScore || 0}`,
        `Last Played: ${stats.lastPlayed ? new Date(stats.lastPlayed).toLocaleDateString() : 'N/A'}`
      ]);
    });
    
    // Add recommendations section
    assessmentData.push(['']);
    assessmentData.push(['Recommendations']);
    
    // Get skills that need improvement (below 50%)
    const weakSkills = [];
    Object.entries(userStats.skillLevels || {}).forEach(([skill, level]) => {
      if (level < 0.5) {
        const skillNames = {
          'memory': 'Memory',
          'focus': 'Focus & Attention',
          'problem': 'Problem Solving',
          'reaction': 'Reaction Speed'
        };
        
        weakSkills.push(skillNames[skill] || skill);
      }
    });
    
    if (weakSkills.length > 0) {
      assessmentData.push([`Focus on improving: ${weakSkills.join(', ')}`]);
    } else {
      assessmentData.push(['Continue with balanced training across all skill areas']);
    }
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(assessmentData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Column A
      { wch: 30 }, // Column B
      { wch: 20 }, // Column C
      { wch: 25 }  // Column D
    ];
    
    // Merge cells for title
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } } // Merge A1:D1
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Cognitive Assessment');
  }
}

// Create global instance for use in HTML
window.excelExporter = new ManoMitraExcelExporter();