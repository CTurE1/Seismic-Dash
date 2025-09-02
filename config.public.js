// Конфигурация для GitHub Pages
// ВНИМАНИЕ: Этот файл содержит приватный ключ для записи данных
// Используйте только для вашего личного проекта

const LEADERBOARD_CONFIG = {
  // JSONBin.io PRIVATE API key (для чтения и записи)
  // Создайте приватный ключ на JSONBin.io
  API_KEY: 'YOUR_PRIVATE_API_KEY_HERE', // Замените на ваш приватный ключ
  
  // Bin ID для лидерборда (используйте один из ваших существующих)
  BIN_ID: '68b4cc5bae596708fde2728', // Замените на ваш Bin ID
  
  // URL for API
  BASE_URL: 'https://api.jsonbin.io/v3/b',
  
  // Headers for requests (приватный ключ)
  HEADERS: {
    'Content-Type': 'application/json',
    'X-Master-Key': 'YOUR_PRIVATE_API_KEY_HERE'
  }
};

// Functions for working with global leaderboard
const GlobalLeaderboard = {
  // Load leaderboard from server
  async load() {
    try {
      const response = await fetch(`${LEADERBOARD_CONFIG.BASE_URL}/${LEADERBOARD_CONFIG.BIN_ID}`, {
        headers: LEADERBOARD_CONFIG.HEADERS
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.record.leaderboard || [];
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      // Return local leaderboard as fallback
      const saved = localStorage.getItem('leaderboard');
      return saved ? JSON.parse(saved) : [];
    }
  },
  
  // Save leaderboard to server
  async save(leaderboard) {
    try {
      const response = await fetch(`${LEADERBOARD_CONFIG.BASE_URL}/${LEADERBOARD_CONFIG.BIN_ID}`, {
        method: 'PUT',
        headers: LEADERBOARD_CONFIG.HEADERS,
        body: JSON.stringify({ leaderboard })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('Leaderboard successfully saved to server');
      return true;
    } catch (error) {
      console.error('Error saving leaderboard:', error);
      // Save locally as fallback
      localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
      return false;
    }
  },
  
  // Add new result
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
      
      // Save back to server
      await this.save(top10);
      
      return top10;
    } catch (error) {
      console.error('Error adding result:', error);
      return null;
    }
  }
};
