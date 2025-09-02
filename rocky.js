// Rocky class
// Requires: FLOOR_Y, rockyImg
// Optional: createDust(x,y) for dust effects
class Rocky {
	constructor(img = rockyImg) {
	  this.img = img;
	  this.w = img ? img.width  : 60;
	  this.h = img ? img.height : 80;
  
	  this.basePad = 0;
  
	  this.x = 100;
	  this.y = FLOOR_Y;
	  this.vy = 0;
	  this.g       = 0.75;
	  this.jumpVel = -16.5;
  
	  this.onGround = true;
	  this.coyoteFrames = 8;
	  this.coyoteLeft   = 0;
  
	  this.bufferFrames = 8;
	  this.bufferLeft   = 0;
  
	  this.holdMaxFrames = 18;
	  this.holdLeft      = 0;
  
	  this.animPhase = 0;
	}
  
	snapToFloor() { this.y = FLOOR_Y; }
  
	setJumpBuffer() { this.bufferLeft = this.bufferFrames; }
  
	update(spaceHeld = false) {
	  this.vy += this.g;
	  this.y  += this.vy;
  
	  if (this.y > FLOOR_Y) {
		if (!this.onGround && typeof createDust === 'function') {
		  createDust(this.x + this.w * 0.4, FLOOR_Y - 2);
		}
		this.y = FLOOR_Y;
		this.vy = 0;
		this.onGround = true;
		this.coyoteLeft = this.coyoteFrames;
		this.holdLeft = 0;
	  } else {
		this.onGround = false;
		if (this.coyoteLeft > 0) this.coyoteLeft--;
	  }
  
	  if (this.bufferLeft > 0) {
		if (this.canStartJump()) {
		  this.startJump();
		  this.bufferLeft = 0;
		} else {
		  this.bufferLeft--;
		}
	  }
  
	  if (this.holdLeft > 0 && spaceHeld && this.vy < 0) {
		this.vy -= 0.6;
		this.holdLeft--;
	  } else {
		this.holdLeft = 0;
	  }
  
	  this.animPhase += 0.2;
	}
  
	jump() {
	  if (this.canStartJump()) {
		this.startJump();
	  } else {
		this.setJumpBuffer();
	  }
	}
  
	canStartJump() {
	  return this.onGround || this.coyoteLeft > 0;
	}
  
	startJump() {
	  this.vy = this.jumpVel;
	  this.onGround = false;
	  this.coyoteLeft = 0;
	  this.holdLeft = this.holdMaxFrames;
	  if (typeof createDust === 'function') {
		createDust(this.x + this.w * 0.4, FLOOR_Y - 2);
	  }
	  if (typeof sfxJump !== 'undefined' && sfxJump) {
		sfxJump.currentTime = 0;
		sfxJump.play().catch(e => {});
	  }
	}
  
	show() {
	  noStroke(); fill(0, 40);
	  ellipse(this.x + this.w * 0.5, FLOOR_Y - 4, this.w * 0.55, this.w * 0.2);
  
	  const bounce = (this.onGround ? Math.sin(this.animPhase) * 1.2 : 0);
	  const tilt   = (this.onGround ? Math.sin(this.animPhase * 0.6) * 0.05 : 0);
  
	  const drawY = (this.y - (this.h - this.basePad)) + bounce;
  
	  push();
	  translate(this.x + this.w * 0.5, drawY + (this.h - this.basePad));
	  rotate(tilt);
	  image(this.img, -this.w * 0.5, -(this.h - this.basePad));
	  pop();
	}
  
	getAABB() {
	  const drawY = this.y - (this.h - this.basePad);
	  const padX = this.w * 0.18;
	  const padTop = this.h * 0.08;
	  return {
		x: this.x + padX,
		y: drawY + padTop,
		w: this.w - padX * 2,
		h: (this.h - this.basePad) - padTop
	  };
	}
  
	hits(obj) {
	  const a = this.getAABB();
	  const b = (typeof obj.getAABB === 'function') ? obj.getAABB() :
				{ x: obj.x, y: obj.y, w: obj.w, h: obj.h };
  
	  return a.x < b.x + b.w && a.x + a.w > b.x &&
			 a.y < b.y + b.h && a.y + a.h > b.y;
	}
  }
  