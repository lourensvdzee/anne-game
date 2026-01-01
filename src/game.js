import * as THREE from 'three';
import { Player } from './player.js';
import { InputManager } from './input.js';
import { CloudSystem } from './clouds.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.input = new InputManager();
    this.player = new Player(this.scene);
    this.clouds = new CloudSystem(this.scene);

    // Wind effect
    this.windTime = 0;
    this.windStrength = 0.002; // Very subtle

    this.setupRenderer();
    this.setupCamera();
    this.setupLights();
    this.setupSky();
    this.setupResize();
  }

  setupRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  setupCamera() {
    // Camera behind and above the player
    this.camera.position.set(0, 3, 8);
    this.camera.lookAt(0, 0, 0);
  }

  setupLights() {
    // Monument Valley inspired lighting - soft, warm, atmospheric
    const ambient = new THREE.AmbientLight(0xffeedd, 0.7);
    this.scene.add(ambient);

    // Golden hour sun - warm, soft directional light (save reference for controls)
    this.sun = new THREE.DirectionalLight(0xffd89b, 1.0);
    this.sun.position.set(-19, 87.5, 79.5); // Your preferred position!
    this.scene.add(this.sun);

    // Subtle fill light from below (sky reflection)
    const fillLight = new THREE.HemisphereLight(0xffd4a3, 0xb8d4e8, 0.4);
    this.scene.add(fillLight);

    // Light controls
    this.setupLightControls();

    console.log('Monument Valley lighting complete');
    console.log('Light controls: I/K (up/down), J/L (left/right), U/O (forward/back)');
  }

  setupLightControls() {
    window.addEventListener('keydown', (e) => {
      const moveSpeed = 0.5;

      switch(e.code) {
        case 'KeyI': // Move light up
          this.sun.position.y += moveSpeed;
          console.log('Sun position:', this.sun.position);
          break;
        case 'KeyK': // Move light down
          this.sun.position.y -= moveSpeed;
          console.log('Sun position:', this.sun.position);
          break;
        case 'KeyJ': // Move light left
          this.sun.position.x -= moveSpeed;
          console.log('Sun position:', this.sun.position);
          break;
        case 'KeyL': // Move light right
          this.sun.position.x += moveSpeed;
          console.log('Sun position:', this.sun.position);
          break;
        case 'KeyU': // Move light forward
          this.sun.position.z -= moveSpeed;
          console.log('Sun position:', this.sun.position);
          break;
        case 'KeyO': // Move light backward
          this.sun.position.z += moveSpeed;
          console.log('Sun position:', this.sun.position);
          break;
      }
    });
  }

  setupSky() {
    // Gradient sky - Monument Valley inspired pastel sunset
    // Create gradient using fog and background color
    const skyColor = new THREE.Color(0xffd4a3); // Warm peach/pink upper sky
    const horizonColor = new THREE.Color(0xb8d4e8); // Soft blue horizon

    this.scene.background = skyColor;
    this.scene.fog = new THREE.Fog(horizonColor, 15, 60);

    console.log('Pastel gradient sky complete');
  }

  setupResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  async init() {
    await this.player.load();
  }

  update() {
    // Get base input from player
    let horizontalInput = this.input.getHorizontalInput();

    // Add gentle wind drift
    this.windTime += 0.01;
    const windDrift = Math.sin(this.windTime) * this.windStrength;

    // Update player with input + wind
    this.player.update(horizontalInput, windDrift);

    // Update cloud system
    this.clouds.update();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.update();
      this.render();
    };
    animate();
  }
}
