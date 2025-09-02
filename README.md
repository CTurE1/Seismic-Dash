# 🌍 Seismic Dash - Earthquake Simulator Game

A thrilling browser-based earthquake simulation game featuring Rocky, a brave character navigating through seismic challenges. Built with p5.js and powered by a secure Vercel serverless backend.

![Game Preview](assets/logo.png)

## 🎮 Game Features

- **Dynamic Gameplay**: Jump over obstacles as Rocky during earthquake simulations
- **Magnitude System**: 7 different earthquake magnitude levels with increasing difficulty
- **Global Leaderboard**: Real-time score tracking with secure API backend
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Sound Effects**: Immersive audio experience with earthquake sounds
- **Progressive Difficulty**: Game speed and obstacle frequency increase with score

## 🚀 Quick Start

### Play Online
Visit the live game: https://seismic-dash.vercel.app/

### Local Development
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/seismic-dash.git
   cd seismic-dash
   ```

2. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

3. **Run locally:**
   ```bash
   vercel dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🎯 How to Play

- **Spacebar** - Make Rocky jump
- **Avoid obstacles** - Dodge falling stones and debris
- **Survive earthquakes** - Navigate through increasing magnitude levels
- **Score points** - Earn points for distance traveled
- **Compete globally** - Submit your high scores to the leaderboard

## 🏗️ Project Structure

```
seismic-dash/
├── api/
│   └── leaderboard.js          # Vercel serverless function
├── assets/
│   ├── Magnitude/              # Game assets and sounds
│   ├── ground/                 # Ground tile textures
│   └── *.png                   # Character and UI sprites
├── index.html                  # Main game page
├── script.js                   # Core game logic
├── rocky.js                    # Rocky character class
├── stone.js                    # Obstacle class
├── leaderboard-api.js          # Client-side API interface
├── style.css                   # Game styling
├── vercel.json                 # Vercel configuration
└── README.md                   # This file
```

## 🔧 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Graphics**: p5.js library for canvas rendering
- **Backend**: Vercel Serverless Functions
- **Database**: JSONBin.io for leaderboard storage
- **Deployment**: Vercel platform
- **Audio**: Web Audio API with MP3/WebM support

## 🌐 Deployment Guide

### Prerequisites
- GitHub account
- Vercel account
- JSONBin.io account

### Step 1: Prepare JSONBin.io
1. Sign up at [JSONBin.io](https://jsonbin.io)
2. Create a new bin
3. Set the JSON structure:
   ```json
   {
     "leaderboard": []
   }
   ```
4. Copy your Bin ID and Secret Key

### Step 2: Deploy to Vercel
1. **Connect Repository:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project:**
   - Framework Preset: **Other**
   - Root Directory: `./` (default)
   - Build Command: Leave empty
   - Output Directory: Leave empty

3. **Set Environment Variables:**
   In Project Settings → Environment Variables, add:
   ```
   JSONBIN_BIN_ID=your_bin_id_here
   JSONBIN_SECRET_KEY=your_secret_key_here
   JSONBIN_READ_KEY=your_read_key_here (optional)
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your game will be available at https://seismic-dash.vercel.app/

## 🔒 Security Features

- **Server-side API Keys**: All sensitive keys stored in Vercel environment variables
- **Rate Limiting**: Built-in protection against spam submissions
- **Input Validation**: Sanitized user inputs to prevent malicious data
- **CORS Protection**: Properly configured cross-origin resource sharing
- **Error Handling**: Graceful fallbacks for network issues

## 📡 API Endpoints

The game uses a secure REST API for leaderboard management:

### GET `/api/leaderboard`
Retrieves the current global leaderboard.

**Response:**
```json
{
  "ok": true,
  "leaderboard": [
    {
      "name": "Player1",
      "score": 1500,
      "magnitude": "Magnitude 3.0",
      "date": "2024-01-01T12:00:00.000Z",
      "timestamp": 1704110400000
    }
  ]
}
```

### POST `/api/leaderboard`
Submits a new score to the leaderboard.

**Request Body:**
```json
{
  "name": "PlayerName",
  "score": 1200,
  "magnitude": "Magnitude 2.0"
}
```

**Response:**
```json
{
  "ok": true,
  "saved": {
    "name": "PlayerName",
    "score": 1200,
    "magnitude": "Magnitude 2.0",
    "date": "2024-01-01T12:00:00.000Z",
    "timestamp": 1704110400000
  },
  "leaderboard": [...]
}
```

## 🎨 Customization

### Adding New Magnitude Levels
Edit the `MAG_LEVELS` array in `script.js`:
```javascript
const MAG_LEVELS = [
  { label: "Magnitude 1.0", score: 200, stones: 5, speed: 5.8 },
  { label: "Magnitude 2.0", score: 1100, stones: 25, speed: 6.2 },
  // Add your custom levels here
];
```

### Modifying Game Assets
- Replace images in the `assets/` directory
- Update sprite references in the respective class files
- Maintain original dimensions for best compatibility

### Styling Changes
Edit `style.css` to customize:
- Game background colors
- UI element styling
- Responsive breakpoints
- Animation effects

## 🐛 Troubleshooting

### Common Issues

**Game not loading:**
- Check browser console for JavaScript errors
- Ensure all asset files are properly uploaded
- Verify Vercel deployment completed successfully

**Leaderboard not working:**
- Verify environment variables are set correctly
- Check JSONBin.io bin structure matches expected format
- Test API endpoints directly using curl or Postman

**Performance issues:**
- Clear browser cache and reload
- Check network connection
- Disable browser extensions that might interfere

### Debug Mode
Enable debug logging by opening browser console and looking for:
- `Leaderboard API error:` - Backend communication issues
- `Score successfully saved` - Confirmation of successful submissions
- `Using fallback save` - Local storage being used instead of server

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit your changes:** `git commit -m 'Add amazing feature'`
4. **Push to the branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and conventions
- Test changes on multiple devices and browsers
- Update documentation for new features
- Ensure backward compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **p5.js Community** - For the amazing graphics library
- **Vercel** - For providing excellent serverless hosting
- **JSONBin.io** - For simple and reliable data storage
- **The Coding Train** - Original inspiration for the game mechanics


---

**Made with ❤️ for the gaming community**

*Experience the thrill of surviving earthquakes in this exciting browser game!*
