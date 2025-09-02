// leaderboard-local.js
// Локальная версия лидерборда (без API) для тестирования

// Функции для работы с локальным лидербордом
const GlobalLeaderboard = {
  // Загрузить лидерборд из localStorage
  async load() {
    try {
      const saved = localStorage.getItem('leaderboard');
      const leaderboard = saved ? JSON.parse(saved) : [];
      console.log('Local leaderboard loaded:', leaderboard.length, 'records');
      return leaderboard;
    } catch (error) {
      console.error('Error loading local leaderboard:', error);
      return [];
    }
  },
  
  // Сохранить лидерборд в localStorage
  async save(leaderboard) {
    try {
      localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
      console.log('Local leaderboard saved');
      return true;
    } catch (error) {
      console.error('Error saving local leaderboard:', error);
      return false;
    }
  },
  
  // Добавить новый результат
  async addScore(playerName, score, magnitude) {
    try {
      // Load current leaderboard
      const leaderboard = await this.load();
      
      // Add new result
      const newEntry = {
        name: playerName,
        score: score,
        magnitude: magnitude,
        date: new Date().toISOString()
      };
      
      leaderboard.push(newEntry);
      
      // Sort by score (descending)
      leaderboard.sort((a, b) => b.score - a.score);
      
      // Keep only top-10
      const top10 = leaderboard.slice(0, 10);
      
      // Save back
      await this.save(top10);
      
      console.log('Score added to local leaderboard:', newEntry);
      return top10;
    } catch (error) {
      console.error('Error adding score to local leaderboard:', error);
      return null;
    }
  }
};
