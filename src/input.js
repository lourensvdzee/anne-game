export class InputManager {
  constructor() {
    this.keys = {};
    this.touch = { active: false, x: 0 };
    this.canvasWidth = window.innerWidth;

    this.setupKeyboard();
    this.setupTouch();
    this.setupResize();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setupTouch() {
    const canvas = document.getElementById('game-canvas');

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touch.active = true;
      this.touch.x = e.touches[0].clientX;
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.touch.active) {
        this.touch.x = e.touches[0].clientX;
      }
    });

    canvas.addEventListener('touchend', () => {
      this.touch.active = false;
    });
  }

  setupResize() {
    window.addEventListener('resize', () => {
      this.canvasWidth = window.innerWidth;
    });
  }

  getHorizontalInput() {
    let direction = 0;

    // Keyboard input
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) direction -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) direction += 1;

    // Touch input (normalized -1 to 1)
    if (this.touch.active) {
      const normalized = (this.touch.x / this.canvasWidth) * 2 - 1;
      direction = normalized;
    }

    return direction;
  }
}
