// Stone class (rock obstacle)
// Requires: FLOOR_Y, stoneImg
// Optional: gameSpeed, dtMul() for frame independence
class Stone {
	constructor(img = stoneImg, startX, speedOverride) {
	  this.img = img;
	  this.w = img ? img.width  : 48;
	  this.h = img ? img.height : 64;
  
	  this.basePad = 0;
  
	  this.x = (startX !== undefined) ? startX : width + random(240, 420);
	  this.speed = (speedOverride !== undefined) ? speedOverride : (typeof gameSpeed === 'number' ? gameSpeed + 1.2 : 6);
  
	  this.scale = 1.0;
	  this.tilt  = 0.0;
	}
  
	update() {
		const mul = (typeof dtMul === 'function') ? dtMul() : 1;
		const baseSpeed = (typeof gameSpeed === 'number') ? (gameSpeed + 0.6) : this.speed;
		this.x -= baseSpeed * mul;
	  }
	  
  
	show() {
	  noStroke(); fill(0, 40);
	  const shW = this.w * this.scale * 0.55;
	  const shH = this.w * this.scale * 0.22;
	  ellipse(this.x + (this.w * this.scale) * 0.5, FLOOR_Y - 4, shW, shH);
  
	  const drawW = this.w * this.scale;
	  const drawH = (this.h - this.basePad) * this.scale;
	  const drawY = FLOOR_Y - drawH;
  
	  push();
	  translate(this.x + drawW * 0.5, drawY + drawH);
	  rotate(this.tilt);
	  image(this.img, -drawW * 0.5, -drawH, drawW, drawH);
	  pop();
	}
  
	getAABB() {
	  const drawW = this.w * this.scale;
	  const drawH = (this.h - this.basePad) * this.scale;
	  const drawY = FLOOR_Y - drawH;
  
	  const padX   = drawW * 0.14;
	  const padTop = drawH * 0.08;
  
	  return {
		x: this.x + padX,
		y: drawY + padTop,
		w: drawW - padX * 2,
		h: drawH - padTop
	  };
	}
  
	isOffscreen() { return this.x + this.w * this.scale < 0; }
  }
  