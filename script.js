// Global variables
let rocky, stones = [];
let rockyImg, stoneImg;
let stoneVariants = [];

let score = 0;
let highScore = 0;
let gameOver = false;

// Leaderboard system
let leaderboard = [];
let playerName = '';
let isEnteringName = false;
let showLeaderboard = false;
let currentPlayerScore = 0;
let hasPlayerName = false;

// Game speed
let gameSpeed = 6;
const SPEED_GROWTH = 0.0003;

// Magnitude levels (7 levels)
const MAG_LEVELS = [
  { label: "Magnitude 1.0", score:  200, stones: 5,  speed: 5.8 },
  { label: "Magnitude 2.0", score: 1100, stones: 25,  speed: 6.2 },
  { label: "Magnitude 3.0", score: 2300, stones: 40,  speed: 6.6 },
  { label: "Magnitude 4.0", score: 4100, stones: 60,  speed: 7.0 },
  { label: "Magnitude 5.0", score: 6500, stones: 85,  speed: 7.5 },
  { label: "Magnitude 6.0", score: 9800, stones: 115, speed: 8.0 },
  { label: "Magnitude 7.0", score: 14500, stones: 150, speed: 8.6 },
];

// Magnitude color palette
const MAG_PALETTE = {
  0: { base: "#6B8290", accent: "#93A7B3" },
  1: { base: "#E6D8A5", accent: "#F2E7BF" },
  2: { base: "#63C6B8", accent: "#87D7CC" },
  3: { base: "#28A745", accent: "#44C05D" },
  4: { base: "#7ED957", accent: "#A0E57C" },
  5: { base: "#8C9E3B", accent: "#A9BA58" },
  6: { base: "#D1B64A", accent: "#E6CD6E" },
  7: { base: "#B8741A", accent: "#D99230" },
};

// Get color profile by index
function magProfile(idx) {
  const key = Math.max(0, Math.min(7, idx));
  const profile = MAG_PALETTE[key] || MAG_PALETTE[0];
  
  if (!profile || !profile.base || !profile.accent) {
    console.log('Warning: Invalid profile for idx:', idx, 'key:', key, 'profile:', profile);
    return MAG_PALETTE[0];
  }
  
  if (typeof profile.base !== 'string' || typeof profile.accent !== 'string') {
    console.log('Warning: Profile colors are not strings:', profile);
    return MAG_PALETTE[0];
  }
  
  return profile;
}

// Draw progress gradient
function fillProgressGradient(x, y, w, h, colA, colB) {
  noStroke();
  
  let safeColA = '#6B8290';
  let safeColB = '#93A7B3';
  
  if (colA && typeof colA === 'string' && colA.startsWith('#')) {
    safeColA = colA;
  } else if (colA && typeof colA === 'string') {
    safeColA = colA;
  }
  
  if (colB && typeof colB === 'string' && colB.startsWith('#')) {
    safeColB = colB;
  } else if (colB && typeof colB === 'string') {
    safeColB = colB;
  }
  
  try {
    let colorA, colorB;
    
    try {
      colorA = color(safeColA);
    } catch (e) {
      console.log('Error creating colorA:', e, 'Value:', safeColA);
      colorA = color('#6B8290');
    }
    
    try {
      colorB = color(safeColB);
    } catch (e) {
      console.log('Error creating colorB:', e, 'Value:', safeColB);
      colorB = color('#93A7B3');
    }
    
    for (let i = 0; i < w; i++) {
      const t = i / Math.max(1, w);
      const c = lerpColor(colorA, colorB, t);
      fill(c);
      rect(x + i, y, 1, h);
    }
  } catch (e) {
    console.log('Error in fillProgressGradient:', e);
    console.log('colA:', colA, 'colB:', colB);
    console.log('safeColA:', safeColA, 'safeColB:', safeColB);
    fill('#6B8290');
    rect(x, y, w, h);
  }
}

// Get progress to next level (0..1)
function progressToNextClamped() {
  try {
    const p = typeof progressToNext === 'function' ? progressToNext() : 0;
    return Math.max(0, Math.min(1, p));
  } catch (e) {
    console.log('Error in progressToNextClamped:', e);
    return 0;
  }
}

let magnitudeLevelIdx = -1;
let popupTimer = 0;
let iconMagnitude = null;
let noHitStreak = 0;
let currentMagnitudeLabel = "Magnitude 0.0";
let magnitudeIcons = [];
let logoImg = null;
let muteImg = null;
let soundImg = null;
let BADGES = {};

// Sound effects and screen shake
let sfxLevelUp = null;
let sfxEarthquake = null;
let sfxJump = null;
let sfxGameOver = null;
let bgMusic = null;
let isMuted = false;
let screenShakeTimer = 0;
let screenShakeIntensity = 0;

// Ground line
const GROUND_Y = () => height - 64;
let FLOOR_Y = 0;
function updateFloorY(){ FLOOR_Y = GROUND_Y(); }

// Controls
let spacePressed = false;

// Background / parallax / clouds
let skyG, farG, midG;
let parallaxLayers = [];
let cloudsFar = [], cloudsNear = [];

// Ground tiles
let groundEdgeTiles = [];
let groundFillTiles = [];

// Frame-independent multiplier
function dtMul(){ return deltaTime / 16.6667; }

// Screen shake
function createScreenShake(intensity = 8, duration = 12) {
  if (gameOver) return;
  
  screenShakeTimer = duration;
  screenShakeIntensity = intensity;
}

// Random earthquakes
function createRandomEarthquake() {
  if (gameOver) return;
  if (screenShakeTimer > 0) return;
  
  const intensity = random(12, 20);
  const duration = random(180, 360);
  
  createScreenShake(intensity, duration);
  
  if (sfxEarthquake) {
    sfxEarthquake.currentTime = 0;
    sfxEarthquake.volume = 0.6;
    sfxEarthquake.play().catch(e => console.log('Error playing earthquake sound:', e));
  }
  
  console.log(`🌋 Earthquake! Intensity: ${intensity.toFixed(1)}, Duration: ${(duration/60).toFixed(1)} sec (rare event)`);
}

// Magnitude helper functions
function eligibleForLevel(idx){
  if (idx < 0 || idx >= MAG_LEVELS.length) return false;
  
  const req = MAG_LEVELS[idx];
  if (score < req.score / 5) return false;
  if (noHitStreak < req.stones / 5) return false;
  if (gameSpeed < req.speed * 0.8) return false;
  return true;
}

function computeMagnitudeIndex(){
  let idx = -1;
  for (let i=0;i<MAG_LEVELS.length;i++){
    if (eligibleForLevel(i)) idx = i; else break;
  }
  return idx;
}

function progressToNext(){
  if (magnitudeLevelIdx >= MAG_LEVELS.length-1) return 1;
  
  const nextLevelIdx = magnitudeLevelIdx + 1;
  if (nextLevelIdx >= MAG_LEVELS.length) return 1;
  
  const req = MAG_LEVELS[nextLevelIdx];
  const pScore = constrain((score * 5) / req.score, 0, 1);
  const pStones = constrain((noHitStreak * 5) / req.stones, 0, 1);
  const pSpeed = constrain(gameSpeed / (req.speed * 0.8), 0, 1);
  return min(pScore, pStones, pSpeed);
}



// Load assets
function preload() {
  rockyImg   = loadImage('assets/rocky.png');
	stoneImg = loadImage('assets/stone.png');

  stoneVariants = [
    loadImage('assets/stone.png'),
    loadImage('assets/stone_01.png'),
    loadImage('assets/stone_02.png')
  ];

  for (let i = 1; i <= 4; i++) {
    groundEdgeTiles.push(loadImage(`assets/ground/tile_000${i}.png`));
  }
  groundFillTiles.push(loadImage('assets/ground/tile_0152.png'));
  groundFillTiles.push(loadImage('assets/ground/tile_0154.png'));
  
  for (let i = 1; i <= 7; i++) {
    magnitudeIcons.push(loadImage(`assets/Magnitude/${i}.png`));
  }
  
  for (let i = 1; i <= 7; i++) {
    BADGES[i] = loadImage(`assets/Magnitude/${i}.png`);
  }
  
  sfxLevelUp = new Audio('assets/Magnitude/levelUP.mp3');
  sfxEarthquake = new Audio('assets/Magnitude/earthquake.mp3');
  sfxJump = new Audio('assets/Magnitude/jump.mp3');
  sfxJump.volume = 0.5;
  sfxGameOver = new Audio('assets/Magnitude/GameOver.mp3');
  
  bgMusic = new Audio('assets/Magnitude/background.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.3;
  
  bgMusic.addEventListener('ended', function() {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => {});
  });
  
  // logoImg = loadImage('assets/logo.png'); // Temporarily disabled
  muteImg = loadImage('assets/Magnitude/icon-mute.svg');
  soundImg = loadImage('assets/Magnitude/icon-sound.svg');
}

// Parallax and background
function buildSky() {
  skyG = createGraphics(width, height);
  const c1 = color('#9fd7f2'), c2 = color('#bfe8fb');
  skyG.noStroke();
  for (let y = 0; y < height; y++) {
    skyG.fill(lerpColor(c1, c2, y / (height-1)));
    skyG.rect(0, y, width, 1);
  }
}

function makeMountainsG(w, h, peaks, amp, hex, seed=1) {
  const g = createGraphics(w, h);
  const rnd = (a=>()=>((a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),(a^=a>>>14)>>>0)/4294967296))(seed);
  g.noStroke(); g.fill(hex);
  g.beginShape(); g.vertex(0,h);
  const base = h*0.55, step = w/(peaks*2);
  for (let i=0;i<=peaks*2;i++){
    const nx=i*step, ny=base + Math.sin(i*0.9)*h*amp*(0.5+rnd()*0.5);
    g.vertex(nx, ny);
  }
  g.vertex(w,h); g.endShape(CLOSE);
  return g;
}

function buildCloudSprite(size=90){
  const g = createGraphics(size, size*0.7);
  g.noStroke(); g.fill(255,235);
  const s=size;
  [[0.00,0.45,0.55],[0.28,0.42,0.48],[0.55,0.43,0.50],[0.18,0.30,0.35],[0.42,0.28,0.38]]
    .forEach(([x,y,r])=>g.ellipse(x*s+0.25*s,y*s-0.05*s,r*s,r*s*0.72));
  g.fill(255,245); g.ellipse(0.45*s,0.32*s,0.55*s,0.38*s);
  return g;
}

function createClouds(){
  cloudsFar=[]; cloudsNear=[];
  for(let i=0;i<5;i++){
    const sz=random(70,110);
    cloudsFar.push({x:random(width), y:random(40,130), s:sz, spr:buildCloudSprite(sz), v:random(3,6), ph:random(TWO_PI)});
  }
  for(let i=0;i<7;i++){
    const sz=random(60,90);
    cloudsNear.push({x:random(width), y:random(50,160), s:sz, spr:buildCloudSprite(sz), v:random(8,14), ph:random(TWO_PI)});
  }
}

function initParallax(){
  buildSky();
  farG = makeMountainsG(width, floor(height*0.40), 6, 0.18, '#e6f2f8', 12345);
  midG = makeMountainsG(width, floor(height*0.52), 5, 0.28, '#d7e9f4', 67890);
  parallaxLayers = [
    {name:'far', img:farG, x:0, y: floor(FLOOR_Y - farG.height - 40), speed:0.25},
    {name:'mid', img:midG, x:0, y: floor(FLOOR_Y - midG.height - 14), speed:0.40},
    {name:'clouds', speed:0.70}
  ];
  createClouds();
}

function updateClouds(){
  const d=dtMul();
  cloudsFar.forEach(c=>{ c.x -= c.v*d; c.y += 0.03*sin(frameCount*0.008+c.ph); if (c.x<-c.s){c.x=width+c.s; c.y=random(40,130);} });
  cloudsNear.forEach(c=>{ c.x -= (c.v + gameSpeed*0.8)*d; c.y += 0.04*sin(frameCount*0.01+c.ph); if (c.x<-c.s){c.x=width+c.s; c.y=random(50,160);} });
}

function updateParallax(){
  const k = 8, d=dtMul();
  for (let L of parallaxLayers){
    if (L.name==='clouds'){ updateClouds(); }
    else{ L.x -= (gameSpeed*k)*L.speed*d; const w=L.img.width; if (L.x<=-w) L.x+=w; }
  }
}

function renderParallax(){
  image(skyG, 0, 0);
  for (let L of parallaxLayers){
    if (L.name==='clouds'){
      noStroke(); cloudsFar.forEach(c=>image(c.spr,c.x,c.y)); cloudsNear.forEach(c=>image(c.spr,c.x,c.y));
    } else {
      image(L.img, L.x, L.y);
      image(L.img, L.x + L.img.width, L.y);
    }
  }
}

// Initialization
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  updateFloorY();
  initParallax();

  rocky = new Rocky(rockyImg);

  for (let i = 0; i < 2; i++) {
    const randomStoneImg = stoneVariants.length > 0 ? random(stoneVariants) : stoneImg;
    stones.push(new Stone(randomStoneImg, width + 300 * (i + 1)));
  }

  highScore = Number(localStorage.getItem('hi')) || 0;
  
  loadLeaderboard().then(() => {
    console.log('Leaderboard loaded, records:', leaderboard.length);
  }).catch(error => {
    console.error('Error loading leaderboard:', error);
  });
  loadPlayerName();
  
  isMuted = localStorage.getItem('soundMuted') === 'true';
  
  if (bgMusic) {
    bgMusic.play().catch(e => {});
  }
  
  if (isMuted) {
    if (bgMusic) bgMusic.volume = 0;
    if (sfxLevelUp) sfxLevelUp.volume = 0;
    if (sfxEarthquake) sfxEarthquake.volume = 0;
    if (sfxJump) sfxJump.volume = 0;
    if (sfxGameOver) sfxGameOver.volume = 0;
  }
  
  magnitudeLevelIdx = computeMagnitudeIndex();
  if (magnitudeLevelIdx >= 0 && magnitudeLevelIdx < magnitudeIcons.length) {
    iconMagnitude = magnitudeIcons[magnitudeLevelIdx];
    currentMagnitudeLabel = MAG_LEVELS[magnitudeLevelIdx].label;
  }
}

// Main game loop
function draw() {
  push();
  
  if (screenShakeTimer > 0 && !gameOver) {
    const shakeX = random(-screenShakeIntensity, screenShakeIntensity);
    const shakeY = random(-screenShakeIntensity, screenShakeIntensity);
    translate(shakeX, shakeY);
    screenShakeTimer--;
  }
  
  renderParallax();
  updateParallax();
  drawGround();

  if (gameOver) { 
    if (screenShakeTimer > 0) {
      screenShakeTimer = 0;
      screenShakeIntensity = 0;
    }
    if (sfxEarthquake && !sfxEarthquake.paused) {
      sfxEarthquake.pause();
    }
    
    if (isEnteringName) {
      drawNameInput();
    } else if (showLeaderboard) {
      drawLeaderboard();
    } else {
      drawGameOver(); 
    }
    
    drawSoundButton();
    return; 
  }

  gameSpeed += SPEED_GROWTH;
  score += 0.1 + gameSpeed * 0.01;
  
  const newIdx = computeMagnitudeIndex();
  if (newIdx > magnitudeLevelIdx && newIdx >= 0){
    onMagnitudeLevelUp(newIdx);
  }
  
  if (popupTimer > 0) popupTimer--;
  
  if (!gameOver && random() < 0.00033) {
    console.log(`🌋 Random earthquake! Chance: ${(0.00033 * 100).toFixed(3)}%`);
    createRandomEarthquake();
  }

  rocky.update(spacePressed);
  rocky.show();

// Obstacle spawning
if (stones.length < 4) {
	const lastRight = stones.length
	  ? (stones[stones.length - 1].x + stones[stones.length - 1].w * (stones[stones.length - 1].scale || 1))
	  : width;
  
	const airFrames = Math.abs(2 * (rocky.jumpVel) / rocky.g);
	const relSpeed  = (gameSpeed + 0.8);
	const stoneW   = stoneImg ? stoneImg.width : 48;
  
    const MIN_GAP = Math.max(500, relSpeed * airFrames + stoneW * 0.9 + 100);
    const MAX_GAP = MIN_GAP + 400;
  
	const spawnX = Math.max(width, lastRight) + random(MIN_GAP, MAX_GAP);
	
	const randomStoneImg = stoneVariants.length > 0 ? random(stoneVariants) : stoneImg;
	
	const stoneIndex = stoneVariants.indexOf(randomStoneImg);
	totalStones++;
	stoneStats[stoneIndex + 1]++;
	
	if (totalStones % 10 === 0) {
		logStoneStats();
	}
	
	console.log(`🪨 Created stone #${stoneIndex + 1}, position: ${spawnX.toFixed(0)}, gap: ${(spawnX - lastRight).toFixed(0)}`);
	
	stones.push(new Stone(randomStoneImg, spawnX));
  }
  

  // Update/draw/cleanup stones
  for (let i = stones.length - 1; i >= 0; i--) {
    const c = stones[i];
    c.update();
    c.show();

    if (c.isOffscreen()) {
      stones.splice(i, 1);
      noHitStreak++;
    }

    // Collision
    if (rocky.hits(c)) {
      gameOver = true;
      currentPlayerScore = Math.floor(score);
      
      if (sfxGameOver) {
        sfxGameOver.currentTime = 0;
        sfxGameOver.play().catch(e => console.log('Error playing game over sound:', e));
      }
      
      if (currentPlayerScore > 0) {
        if (currentPlayerScore > highScore) {
          highScore = currentPlayerScore;
          localStorage.setItem('hi', String(highScore));
        }
        
        const shouldUpdateLeaderboard = shouldUpdatePlayerScore(currentPlayerScore);
        
        if (hasPlayerName) {
          if (shouldUpdateLeaderboard) {
            saveLeaderboard().then(() => {
              console.log('Result saved to leaderboard');
            }).catch(error => {
              console.error('Error saving result:', error);
            });
          }
          showLeaderboard = true;
        } else {
          isEnteringName = true;
        }
      }
      
      noHitStreak = 0;
    }
  }

  drawHUD();
  drawSoundButton();
  
  if (!gameOver) {
    drawMagnitudeChipTopCenter();
    drawMagnitudePopup();
  }
  
  pop();
}

// Render helpers
function drawSky(){
  noStroke();
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1);
    const r = lerp(155, 195, t);
    const g = lerp(210, 235, t);
    const b = lerp(245, 255, t);
    fill(r, g, b);
    rect(0, y, width, 1);
  }
}

function tilesReady(arr){ return arr.length>0 && arr.every(i=>i && i.width>0); }

function drawRowTiled(imgArr, y){
  if (!tilesReady(imgArr)) return;
  const w=imgArr[0].width, h=imgArr[0].height;
  noSmooth();
  const start = -((frameCount % w));
  for (let x=start; x<width+w; x+=w){
    const idx = ((floor((x-start)/w)) % imgArr.length + imgArr.length) % imgArr.length;
    image(imgArr[idx], x, y);
  }
  smooth();
}

function drawGround(){
  const yTop = FLOOR_Y;

  if (tilesReady(groundEdgeTiles)) {
    const h = groundEdgeTiles[0].height;
    drawRowTiled(groundEdgeTiles, yTop - h);
  } else {
    stroke(150,120,90); strokeWeight(2); line(0, yTop, width, yTop);
  }

  if (tilesReady(groundFillTiles)) {
    const h = groundFillTiles[0].height;
    for (let yy=yTop; yy<height; yy+=h) drawRowTiled(groundFillTiles, yy);
  }

  noStroke();
  for (let i=0;i<48;i++){ fill(255, map(i,0,47,40,0)); rect(0, yTop - 48 + i, width, 1); }
}

function drawMagnitudePopup() {
  if (popupTimer <= 0) return;

  const lvl = Math.max(0, magnitudeLevelIdx + 1);
  const prof = magProfile(lvl);

  const W = Math.floor(min(600, width * 0.65));
  const H = 58, R = 14;
  const CX = Math.floor(width / 2);
  const X = CX - Math.floor(W / 2);
  const Y = 20 + 52 + 12;

  const life = 90;
  const t = 1 - Math.max(0, Math.min(1, popupTimer / life));
  const alpha = (t < 0.15) ? map(t, 0, 0.15, 0, 1) : (t > 0.85 ? map(t, 0.85, 1, 1, 0) : 1);
  const dy = lerp(10, 0, easeOutCubic(constrain(t*1.2, 0, 1)));

  noStroke(); fill(0, 90 * alpha);
  rect(X, Y + 4 + dy, W, H, R);

  let safeBaseColor = '#6B8290';
  if (prof && prof.base && typeof prof.base === 'string' && prof.base.startsWith('#')) {
    safeBaseColor = prof.base;
  }
  
  try {
    const baseColor = color(safeBaseColor);
    fill(red(baseColor), green(baseColor), blue(baseColor), 210 * alpha);
  } catch (e) {
    console.log('Error creating color in drawMagnitudePopup:', e);
    console.log('prof:', prof, 'safeBaseColor:', safeBaseColor);
    fill(107, 130, 144, 210 * alpha);
  }
  rect(X, Y + dy, W, H, R);

  const PADX = 16;
  const badge = BADGES[lvl] || BADGES[1];
  const B = 32;
  const textW = 18 * (`Magnitude ${lvl}.0!`.length);
  const iconX = X + Math.floor((W - (B + 10 + textW)) / 2);

  image(badge, iconX, Y + dy + (H - B)/2, B, B);

  fill(255, 235 * alpha);
  textAlign(LEFT, CENTER); textSize(18);
  text(`Magnitude ${lvl}.0!`, iconX + B + 10, Y + dy + H/2);

  popupTimer--;
}

function easeOutCubic(x){ return 1 - pow(1 - x, 3); }

// Trigger popup on magnitude level up
function onMagnitudeLevelUp(newLevel){
  magnitudeLevelIdx = newLevel;
  popupTimer = 90;
  
  if (newLevel >= 0 && newLevel < MAG_LEVELS.length) {
    currentMagnitudeLabel = MAG_LEVELS[newLevel].label;
  } else {
    currentMagnitudeLabel = "Magnitude 0.0";
  }
  
  if (newLevel >= 0 && newLevel < magnitudeIcons.length) {
    iconMagnitude = magnitudeIcons[newLevel];
  }
  
  if (sfxLevelUp) {
    sfxLevelUp.currentTime = 0;
    sfxLevelUp.play().catch(e => console.log('Error playing sound:', e));
  }
  
  if (screenShakeTimer <= 0 && !gameOver) {
    createScreenShake(6, 15);
  }
  
  console.log(`🎉 Magnitude ${newLevel + 1}.0 achieved! Index: ${magnitudeLevelIdx}, Level: ${currentMagnitudeLabel}`);
}

function drawMagnitudeChipTopCenter() {
  if (gameOver) return;
  
  const lvl = Math.max(0, magnitudeLevelIdx + 1);
  const prof = magProfile(lvl);
  const W = Math.floor(min(600, width * 0.65));
  const H = 70;
  const R = 14;
  const CX = Math.floor(width / 2);
  const X = CX - Math.floor(W / 2);
  const Y = 20;

  noStroke(); fill(0, 80); rect(X, Y + 4, W, H, R);

  fill(60, 85, 98, 220);
  rect(X, Y, W, H, R);

  const PAD = 14;
  let px = X + PAD;
  let py = Y + PAD;

  const badgeImg = BADGES[lvl] || BADGES[1];
  const B = 28;
  if (badgeImg) {
    image(badgeImg, px, py + 2, B, B);
  } else {
    let safeColor = '#6B8290';
    if (prof && prof.base && typeof prof.base === 'string' && prof.base.startsWith('#')) {
      safeColor = prof.base;
    }
    
    try {
      fill(safeColor);
    } catch (e) {
      console.log('Error with fill color in drawMagnitudeChipTopCenter:', e);
      fill('#6B8290');
    }
    ellipse(px + B/2, py + B/2, B, B);
  }

  px += B + 10;
  fill(255); textAlign(LEFT, BASELINE);
  textSize(18); text(`Magnitude ${lvl}.0`, px, py + 16);

  const barW = W - 64;
  const barH = 8;
  const barX = X + 32;
  const barY = Y + H - 12;

  noStroke(); fill(255, 40); rect(barX, barY, barW, barH, barH/2);

  const p = progressToNextClamped();
  if (p > 0) {
    if (prof && (typeof prof.base !== 'string' || typeof prof.accent !== 'string')) {
      console.log('Warning: Invalid color values in prof:', prof);
      console.log('prof.base type:', typeof prof.base, 'value:', prof.base);
      console.log('prof.accent type:', typeof prof.accent, 'value:', prof.accent);
    }
    
    fillProgressGradient(barX, barY, Math.floor(barW * p), barH, prof.base, prof.accent);
    fill(255, 20); rect(barX, barY, Math.floor(barW * p), Math.floor(barH/2), barH/2, barH/2, 0, 0);
  }
}

function drawHUD(){
  noStroke(); fill(40);
  textAlign(RIGHT, TOP);
  textSize(24);
  text(Math.floor(score), width - 24, 20);

  textSize(14);
  text(`HI ${highScore}`, width - 24, 48);
}

function drawGameOver(){
  fill(0, 120); noStroke();
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(42);
  text('GAME OVER', width/2, height/2 - 40);

  textSize(20);
  text(`Score: ${Math.floor(score)}   Best: ${highScore}`, width/2, height/2 + 4);
  text('Space — restart', width/2, height/2 + 40);
}

function drawNameInput(){
  fill(0, 120); noStroke();
  rect(0, 0, width, height);

  fill(0, 80);
  rect(width/2 - 250 + 4, height/2 - 120 + 4, 500, 240, 15);
  
  fill(228, 219, 210, 200);
  rect(width/2 - 250, height/2 - 120, 500, 240, 15);
  
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  
  if (logoImg) {
    image(logoImg, width/2 - 160, height/2 - 96, 32, 32);
    text('Enter your nickname!', width/2 + 20, height/2 - 80);
  } else {
    text('Enter your nickname!', width/2, height/2 - 80);
  }
  
  textSize(18);
  fill(255, 200);
  text(`Score: ${currentPlayerScore}`, width/2, height/2 - 40);
  
  if (currentMagnitudeLabel && currentMagnitudeLabel !== "Magnitude 0.0") {
    textSize(16);
    fill(255, 180);
    text(` ${currentMagnitudeLabel}`, width/2, height/2 - 15);
  }
  
  fill(0, 40);
  rect(width/2 - 180 + 2, height/2 + 10 + 2, 360, 40, 8);
  
  fill(255, 240);
  rect(width/2 - 180, height/2 + 10, 360, 40, 8);
  
  fill(60, 60, 60);
  textAlign(LEFT, CENTER);
  textSize(18);
  text(playerName + (frameCount % 60 < 30 ? '|' : ''), width/2 - 170, height/2 + 30);
  
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text('Press ENTER to save', width/2, height/2 + 70);
  
  fill(255, 180);
  textSize(14);
  text(`Maximum ${playerName.length}/20 characters`, width/2, height/2 + 95);
}

function drawLeaderboard(){
  fill(0, 120); noStroke();
  rect(0, 0, width, height);

  if (logoImg) {
    push();
    imageMode(CENTER);
    tint(255, 255, 255, 100);
    image(logoImg, width/2, height/2, 600, 400);
    noTint();
    imageMode(CORNER);
    pop();
  } else {
    console.log('Logo not loaded!');
  }

  fill(228, 219, 210, 200);
  rect(width/2 - 300, height/2 - 200, 600, 400, 15);
  
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  text('🏆 TOP-10 PLAYERS', width/2, height/2 - 160);
  
  textSize(18);
  const shouldUpdate = shouldUpdatePlayerScore(currentPlayerScore);
  const statusText = shouldUpdate ? '🏆 NEW RECORD!' : 'Your result';
  text(`${statusText}: ${playerName} - ${currentPlayerScore}`, width/2, height/2 - 280);
  
  if (shouldUpdate) {
    fill('#FFD700');
    textSize(16);
    text('🎉 Congratulations on improvement!', width/2, height/2 - 255);
  }
  
  let y = height/2 - 80;
  
  textAlign(LEFT, CENTER);
  textSize(14);
  fill(255, 180);
  
  noStroke();
  fill(180, 170, 160, 180);
  rect(width/2 - 270, y - 12, 540, 28, 6);
  
  fill(255, 180);
  text('Rank', width/2 - 250, y);
  text('Player', width/2 - 180, y);
  text('Magnitude', width/2 + 50, y);
  textAlign(RIGHT, CENTER);
  text('Points', width/2 + 250, y);
  textAlign(LEFT, CENTER);
  
  stroke(180, 170, 160, 200);
  strokeWeight(1);
  line(width/2 - 270, y + 15, width/2 + 270, y + 15);
  noStroke();
  
  y += 30;
  
  textSize(16);
  
  for (let i = 0; i < Math.min(leaderboard.length, 10); i++) {
    const entry = leaderboard[i];
    const isCurrentPlayer = entry.name === playerName && entry.score === currentPlayerScore;
    
    noStroke();
    if (isCurrentPlayer) {
      fill('#FFD700', 40);
    } else {
      fill(180, 170, 160, 100);
    }
    rect(width/2 - 270, y - 10, 540, 24, 4);
    
    fill(isCurrentPlayer ? '#FFD700' : 255);
    
    text(`${i + 1}.`, width/2 - 250, y);
    
    const displayName = entry.name.length > 20 ? entry.name.substring(0, 17) + '...' : entry.name;
    text(displayName, width/2 - 180, y);
    
    if (entry.magnitude) {
      const magIndex = getMagnitudeIndex(entry.magnitude);
      if (magIndex >= 0 && magIndex < magnitudeIcons.length) {
        image(magnitudeIcons[magIndex], width/2 + 50, y - 8, 16, 16);
        fill(isCurrentPlayer ? '#FFD700' : 255, 200);
        text(entry.magnitude, width/2 + 70, y);
      } else {
        fill(isCurrentPlayer ? '#FFD700' : 255, 200);
        text(`${entry.magnitude}`, width/2 + 50, y);
      }
    } else {
      fill(isCurrentPlayer ? '#FFD700' : 255, 100);
      text('—', width/2 + 50, y);
    }
    
    fill(isCurrentPlayer ? '#FFD700' : 255);
    textAlign(RIGHT, CENTER);
    text(entry.score, width/2 + 250, y);
    textAlign(LEFT, CENTER);
    
    y += 25;
  }
  
  for (let i = leaderboard.length; i < 10; i++) {
    noStroke();
    fill(180, 170, 160, 80);
    rect(width/2 - 270, y - 10, 540, 24, 4);
    
    fill(255, 80);
    text(`${i + 1}.`, width/2 - 250, y);
    text('—', width/2 - 180, y);
    text('—', width/2 + 50, y);
    textAlign(RIGHT, CENTER);
    text('—', width/2 + 250, y);
    textAlign(LEFT, CENTER);
    y += 25;
  }
  
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text('Space — restart', width/2, height/2 + 220);
}

function getMagnitudeIndex(magnitudeLabel) {
  if (!magnitudeLabel) return -1;
  for (let i = 0; i < MAG_LEVELS.length; i++) {
    if (MAG_LEVELS[i].label === magnitudeLabel) return i;
  }
  return -1;
}

async function loadLeaderboard(){
  try {
    leaderboard = await GlobalLeaderboard.load();
    console.log('Global leaderboard loaded:', leaderboard.length, 'records');
  } catch (error) {
    console.error('Error loading global leaderboard, using local:', error);
    const saved = localStorage.getItem('leaderboard');
    if (saved) {
      try {
        leaderboard = JSON.parse(saved);
        leaderboard.sort((a, b) => b.score - a.score);
      } catch (e) {
        console.error('Error loading local leaderboard:', e);
        leaderboard = [];
      }
    } else {
      leaderboard = [];
    }
  }
}

function loadPlayerName(){
  const saved = localStorage.getItem('playerName');
  if (saved && saved.trim()) {
    playerName = saved.trim();
    hasPlayerName = true;
  }
}

function savePlayerName(){
  if (playerName.trim()) {
    localStorage.setItem('playerName', playerName.trim());
    hasPlayerName = true;
  }
}

function shouldUpdatePlayerScore(newScore) {
  const playerBestScore = leaderboard
    .filter(entry => entry.name === playerName)
    .reduce((best, entry) => Math.max(best, entry.score), 0);
  
  const playerBestMagnitude = leaderboard
    .filter(entry => entry.name === playerName)
    .reduce((best, entry) => {
      if (!entry.magnitude) return best;
      const currentMag = getMagnitudeIndex(entry.magnitude);
      return Math.max(best, currentMag);
    }, -1);
  
  const newMagnitude = getMagnitudeIndex(currentMagnitudeLabel);
  return newScore > playerBestScore || newMagnitude > playerBestMagnitude;
}

async function saveLeaderboard(){
  if (playerName.trim() && currentPlayerScore > 0) {
    try {
      // Добавляем таймаут для API запроса
      const apiPromise = GlobalLeaderboard.addScore(
        playerName.trim(), 
        currentPlayerScore, 
        currentMagnitudeLabel
      );
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout')), 10000)
      );
      
      const updatedLeaderboard = await Promise.race([apiPromise, timeoutPromise]);
      
      if (updatedLeaderboard) {
        leaderboard = updatedLeaderboard;
        console.log('Result successfully added to global leaderboard');
      } else {
        saveLeaderboardLocal();
      }
    } catch (error) {
      console.error('Error saving to global leaderboard, using local:', error);
      saveLeaderboardLocal();
    }
  }
}

function saveLeaderboardLocal(){
  if (playerName.trim() && currentPlayerScore > 0) {
    leaderboard = leaderboard.filter(entry => entry.name !== playerName);
    
    leaderboard.push({
      name: playerName.trim(),
      score: currentPlayerScore,
      magnitude: currentMagnitudeLabel,
      date: new Date().toISOString()
    });
    
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 100);
    
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
  }
}

// Controls
function keyPressed(){
  if (key === ' ') {
    // Start background music on first user interaction
    if (bgMusic && bgMusic.paused && !isMuted) {
      bgMusic.play().catch(e => console.log('Error starting background music:', e));
    }
    
    if (gameOver) {
      restart();
      return;
    }
    rocky.setJumpBuffer();
    rocky.jump();
    spacePressed = true;
  }
  
  if (isEnteringName) {
    if (keyCode === ENTER) {
      if (playerName.trim()) {
        savePlayerName();
        
        // Добавляем таймаут для предотвращения зависания
        const saveTimeout = setTimeout(() => {
          console.warn('Save leaderboard timeout - using local fallback');
          saveLeaderboardLocal();
          isEnteringName = false;
          showLeaderboard = true;
        }, 5000); // 5 секунд таймаут
        
        saveLeaderboard().then(() => {
          clearTimeout(saveTimeout);
          console.log('Result saved to leaderboard');
          isEnteringName = false;
          showLeaderboard = true;
        }).catch(error => {
          clearTimeout(saveTimeout);
          console.error('Error saving result:', error);
          // Fallback на локальное сохранение
          saveLeaderboardLocal();
          isEnteringName = false;
          showLeaderboard = true;
        });
      }
    } else if (keyCode === BACKSPACE) {
      playerName = playerName.slice(0, -1);
    } else if (key && key.length === 1 && playerName.length < 20) {
      // Дополнительная проверка на валидные символы
      if (/[a-zA-Z0-9\s\-_\.]/.test(key)) {
        playerName += key;
      }
    }
  }
}
function keyReleased(){
  if (key === ' ') spacePressed = false;
}

// Mouse click handling
function mousePressed() {
  const buttonSize = 40;
  const x = 20;
  const y = 20;
  
  if (mouseX >= x && mouseX <= x + buttonSize && 
      mouseY >= y && mouseY <= y + buttonSize) {
    toggleSound();
  }
}

// Stone statistics
let stoneStats = {1: 0, 2: 0, 3: 0};
let totalStones = 0;

function logStoneStats() {
  console.log('📊 Stone statistics:');
  console.log(`   Total created: ${totalStones}`);
  console.log(`   Stone #1: ${stoneStats[1]} (${((stoneStats[1]/totalStones)*100).toFixed(1)}%)`);
  console.log(`   Stone #2: ${stoneStats[2]} (${((stoneStats[2]/totalStones)*100).toFixed(1)}%)`);
  console.log(`   Stone #3: ${stoneStats[3]} (${((stoneStats[3]/totalStones)*100).toFixed(1)}%)`);
}

// Toggle sound
function toggleSound() {
  isMuted = !isMuted;
  
  localStorage.setItem('soundMuted', isMuted);
  
  if (isMuted) {
    if (bgMusic) bgMusic.volume = 0;
    if (sfxLevelUp) sfxLevelUp.volume = 0;
    if (sfxEarthquake) sfxEarthquake.volume = 0;
    if (sfxJump) sfxJump.volume = 0;
    if (sfxGameOver) sfxGameOver.volume = 0;
    console.log('🔇 Sound disabled');
  } else {
    if (bgMusic) bgMusic.volume = 0.3;
    if (sfxLevelUp) sfxLevelUp.volume = 1;
    if (sfxEarthquake) sfxEarthquake.volume = 0.6;
    if (sfxJump) sfxJump.volume = 0.5;
    if (sfxGameOver) sfxGameOver.volume = 1;
    console.log('🔊 Sound enabled');
  }
}

// Draw sound button
function drawSoundButton() {
  const buttonSize = 40;
  const x = 20;
  const y = 20;
  
  const mouseOver = mouseX >= x && mouseX <= x + buttonSize && 
                   mouseY >= y && mouseY <= y + buttonSize;
  
  noStroke();
  fill(0, 60);
  rect(x + 2, y + 2, buttonSize, buttonSize, 8);
  
  fill(mouseOver ? (isMuted ? 220 : 200) : (isMuted ? 180 : 160), 240);
  rect(x, y, buttonSize, buttonSize, 10);
  
  stroke(isMuted ? 255 : 220, mouseOver ? 150 : 120);
  strokeWeight(2);
  noFill();
  rect(x, y, buttonSize, buttonSize, 10);
  noStroke();
  
  const currentIcon = isMuted ? muteImg : soundImg;
  if (currentIcon) {
    imageMode(CORNER);
    image(currentIcon, x + 8, y + 8, buttonSize - 16, buttonSize - 16);
  } else {
    fill(isMuted ? 255 : 100);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(isMuted ? '🔇' : '🔊', x + buttonSize/2, y + buttonSize/2);
  }
  
  if (mouseOver) {
    fill(0, 200);
    noStroke();
    rect(x + buttonSize + 10, y, 140, 32, 8);
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(13);
    text(isMuted ? '🔊 Enable sound' : '🔇 Disable sound', x + buttonSize + 15, y + 16);
  }
}

// Restart game
function restart(){
  gameOver = false;
  score = 0;
  gameSpeed = 6;
  stones = [];
  rocky.snapToFloor();
  
  isEnteringName = false;
  showLeaderboard = false;
  currentPlayerScore = 0;
  
  magnitudeLevelIdx = -1;
  iconMagnitude = null;
  currentMagnitudeLabel = "Magnitude 0.0";
  popupTimer = 0;
  noHitStreak = 0;
  
  screenShakeTimer = 0;
  screenShakeIntensity = 0;
  
  stoneStats = {1: 0, 2: 0, 3: 0};
  totalStones = 0;
  
  if (sfxLevelUp) sfxLevelUp.pause();
  if (sfxEarthquake) sfxEarthquake.pause();
  
  if (bgMusic && bgMusic.paused) {
    bgMusic.play().catch(e => console.log('Error resuming background music:', e));
  }

  for (let i = 0; i < 2; i++) {
    const randomStoneImg = stoneVariants.length > 0 ? random(stoneVariants) : stoneImg;
    stones.push(new Stone(randomStoneImg, width + 300 * (i + 1)));
  }
}

// Window resize
function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  updateFloorY();
  initParallax();
  if (rocky) rocky.snapToFloor();
}

// Frame-independent movement (optional)
// Use dtMul() in classes
/*
function dtMul(){ return deltaTime / 16.6667; }
*/
