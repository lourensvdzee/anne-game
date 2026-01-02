import * as THREE from 'three';
import { Player } from './player.js';
import { InputManager } from './input.js';
import { CloudSystem } from './clouds.js';
import { SpeedEffectSystem } from './speedEffects.js';

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
    this.speedEffects = null; // Will be initialized after player loads

    // Wind effect
    this.windTime = 0;
    this.windStrength = 0.002; // Very subtle

    // Speed effects toggle
    this.speedEffectsEnabled = true;
    this.clock = new THREE.Clock();

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
    // Camera even closer for bigger character view
    this.camera.position.set(0, 1.5, 3.5);
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
  }

  setupLightControls() {
    window.addEventListener('keydown', (e) => {
      const moveSpeed = 0.5;
      const rotationSpeed = 1; // degrees

      switch(e.code) {
        case 'KeyI': // Move light up
          this.sun.position.y += moveSpeed;
          break;
        case 'KeyK': // Move light down
          this.sun.position.y -= moveSpeed;
          break;
        case 'KeyJ': // Move light left
          this.sun.position.x -= moveSpeed;
          break;
        case 'KeyL': // Move light right
          this.sun.position.x += moveSpeed;
          break;
        case 'KeyU': // Move light forward
          this.sun.position.z -= moveSpeed;
          break;
        case 'KeyO': // Move light backward
          this.sun.position.z += moveSpeed;
          break;
        case 'KeyN': // Increase base rotation
          this.player.baseRotationY += rotationSpeed;
          break;
        case 'KeyM': // Decrease base rotation
          this.player.baseRotationY -= rotationSpeed;
          break;
        case 'Digit1': // Increase left movement rotation
          this.player.rotationLeft += rotationSpeed;
          break;
        case 'Digit2': // Decrease left movement rotation
          this.player.rotationLeft -= rotationSpeed;
          break;
        case 'Digit3': // Increase right movement rotation
          this.player.rotationRight += rotationSpeed;
          break;
        case 'Digit4': // Decrease right movement rotation
          this.player.rotationRight -= rotationSpeed;
          break;
        case 'Digit7': // Tilt back (front up)
          this.player.tiltX += rotationSpeed;
          break;
        case 'Digit8': // Tilt forward (front down)
          this.player.tiltX -= rotationSpeed;
          break;
        case 'Digit5': // Increase banking tilt amount
          this.player.maxTilt += 0.05;
          break;
        case 'Digit6': // Decrease banking tilt amount
          this.player.maxTilt -= 0.05;
          if (this.player.maxTilt < 0) this.player.maxTilt = 0;
          break;
        case 'KeyR': // Reverse vertical controls
          this.player.reverseVertical = !this.player.reverseVertical;
          break;
        case 'KeyP': // Log current position
          console.log('Position Y:', this.player.position.y.toFixed(2));
          break;
        case 'KeyT': // Toggle speed effects
          this.speedEffectsEnabled = !this.speedEffectsEnabled;
          if (!this.speedEffectsEnabled && this.speedEffects) {
            this.speedEffects.dispose();
          }
          break;
        case 'KeyQ': // Move speed lines closer to character (more toward camera)
          if (this.speedEffects) {
            this.speedEffects.startZOffset += 0.1;
            console.log('Speed line start Z offset:', this.speedEffects.startZOffset.toFixed(2));
          }
          break;
        case 'KeyE': // Move speed lines further from character (more toward background)
          if (this.speedEffects) {
            this.speedEffects.startZOffset -= 0.1;
            console.log('Speed line Z offset:', this.speedEffects.startZOffset.toFixed(2));
          }
          break;
        case 'KeyZ': // Move speed lines up (higher on character)
          if (this.speedEffects) {
            this.speedEffects.startYOffset += 0.1;
            console.log('Speed line Y offset:', this.speedEffects.startYOffset.toFixed(2));
          }
          break;
        case 'KeyX': // Move speed lines down (lower on character)
          if (this.speedEffects) {
            this.speedEffects.startYOffset -= 0.1;
            console.log('Speed line Y offset:', this.speedEffects.startYOffset.toFixed(2));
          }
          break;
        case 'KeyH': // Increase hair sway amount
          this.player.hairSwayAmount += 0.05;
          console.log('Hair sway amount:', this.player.hairSwayAmount.toFixed(2));
          break;
        case 'KeyG': // Decrease hair sway amount
          this.player.hairSwayAmount -= 0.05;
          if (this.player.hairSwayAmount < 0) this.player.hairSwayAmount = 0;
          console.log('Hair sway amount:', this.player.hairSwayAmount.toFixed(2));
          break;
        case 'KeyV': // Increase dress sway amount
          this.player.dressSwayAmount += 0.05;
          console.log('Dress sway amount:', this.player.dressSwayAmount.toFixed(2));
          break;
        case 'KeyB': // Decrease dress sway amount
          this.player.dressSwayAmount -= 0.05;
          if (this.player.dressSwayAmount < 0) this.player.dressSwayAmount = 0;
          console.log('Dress sway amount:', this.player.dressSwayAmount.toFixed(2));
          break;
        case 'Period': // Next hair movement preset (. key)
          this.player.nextHairPreset();
          break;
        case 'Comma': // Previous hair movement preset (, key)
          this.player.previousHairPreset();
          break;
        case 'Numpad8': // Hair stands toward camera (forward)
          this.player.hairStandDirectionX -= 0.1;
          console.log('Hair stands toward camera:', this.player.hairStandDirectionX.toFixed(2));
          break;
        case 'Numpad2': // Hair stands away from camera (backward)
          this.player.hairStandDirectionX += 0.1;
          console.log('Hair stands away from camera:', this.player.hairStandDirectionX.toFixed(2));
          break;
        case 'Numpad4': // Hair stands to the left
          this.player.hairStandDirectionZ -= 0.1;
          console.log('Hair stands to the left:', this.player.hairStandDirectionZ.toFixed(2));
          break;
        case 'Numpad6': // Hair stands to the right
          this.player.hairStandDirectionZ += 0.1;
          console.log('Hair stands to the right:', this.player.hairStandDirectionZ.toFixed(2));
          break;
        case 'NumpadAdd': // Hair stands up (+)
          this.player.hairStandDirectionY += 0.1;
          console.log('Hair stands up:', this.player.hairStandDirectionY.toFixed(2));
          break;
        case 'NumpadSubtract': // Hair stands down (-)
          this.player.hairStandDirectionY -= 0.1;
          console.log('Hair stands down:', this.player.hairStandDirectionY.toFixed(2));
          break;
        case 'Numpad5': // Reset hair to default
          this.player.hairStandDirectionX = -1.6;
          this.player.hairStandDirectionY = 0.0;
          this.player.hairStandDirectionZ = 0.4;
          console.log('Hair reset to default (X:-1.6, Y:0.0, Z:0.4)');
          break;
      }
    });
  }

  setupSky() {
    // Light blue sky with subtle fog gradient
    const skyColor = new THREE.Color(0x87ceeb); // Light sky blue
    const horizonColor = new THREE.Color(0xb8d4e8); // Slightly different blue for horizon

    this.scene.background = skyColor;
    this.scene.fog = new THREE.Fog(horizonColor, 15, 60);
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
    // Initialize speed effects after player is loaded
    this.speedEffects = new SpeedEffectSystem(this.scene, this.player);
  }

  update() {
    const delta = this.clock.getDelta();

    // Get input from player
    let horizontalInput = this.input.getHorizontalInput();
    let verticalInput = this.input.getVerticalInput();

    // Add gentle wind drift
    this.windTime += 0.01;
    const windDrift = Math.sin(this.windTime) * this.windStrength;

    // Update player with input + wind
    this.player.update(horizontalInput, verticalInput, windDrift);

    // Update cloud system
    this.clouds.update();

    // Update speed effects
    if (this.speedEffects && this.speedEffectsEnabled) {
      this.speedEffects.update(delta);
    }
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
