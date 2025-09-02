// leaderboard-api.js
// Клиентский код для работы с Vercel API
// Заменяет config.js - никаких API ключей в браузере!

const API_URL = '/api/leaderboard';

// Функции для работы с глобальным лидербордом
const GlobalLeaderboard = {
  // Загрузить лидерборд с сервера
  async load() {
    try {
      const response = await fetch(API_URL, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.leaderboard || [];
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      // Fallback: возвращаем локальный лидерборд
      const saved = localStorage.getItem('leaderboard');
      return saved ? JSON.parse(saved) : [];
    }
  },
  
  // Сохранить лидерборд на сервер
  async save(leaderboard) {
    try {
      // Для сохранения используем POST с новым результатом
      // Этот метод теперь не используется напрямую
      console.log('Save method called - use addScore instead');
      return true;
    } catch (error) {
      console.error('Error saving leaderboard:', error);
      // Fallback: сохраняем локально
      localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
      return false;
    }
  },
  
  // Добавить новый результат
  async addScore(playerName, score, magnitude) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: playerName,
          score: score,
          magnitude: magnitude
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.ok) {
        console.log('Score successfully saved to global leaderboard');
        return data.leaderboard || [];
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error adding score:', error);
      
      // Fallback: сохраняем локально
      try {
        const leaderboard = await this.load();
        const newEntry = {
          name: playerName,
          score: score,
          magnitude: magnitude,
          date: new Date().toISOString()
        };
        
        leaderboard.push(newEntry);
        leaderboard.sort((a, b) => b.score - a.score);
        const top10 = leaderboard.slice(0, 10);
        
        localStorage.setItem('leaderboard', JSON.stringify(top10));
        return top10;
      } catch (fallbackError) {
        console.error('Fallback save failed:', fallbackError);
        return null;
      }
    }
  }
};
