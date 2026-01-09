import * as THREE from 'three';
import { Player } from './player.js';
import { InputManager } from './input.js';
import { CloudSystem } from './clouds.js';
import { SpeedEffectSystem } from './speedEffects.js';
import { BirdSystem } from './birds.js';
import { TerrainSystem } from './terrain.js';

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
    this.birds = new BirdSystem(this.scene);
    this.terrain = new TerrainSystem(this.scene);
    this.speedEffects = null; // Will be initialized after player loads

    // Wind effect
    this.windTime = 0;
    this.windStrength = 0.002; // Very subtle

    // Wind gust effect
    this.windGustTime = 0;
    this.windGustActive = false;
    this.windGustDirection = 0;
    this.windGustStrength = 0;
    this.nextGustTime = 5000 + Math.random() * 10000; // 5-15 seconds until first gust

    // Speed effects toggle
    this.speedEffectsEnabled = true;
    this.clock = new THREE.Clock();

    // Score system
    this.score = 0;
    this.lastHitTime = 0;
    this.hitCooldown = 1000; // 1 second cooldown between hits

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
    // Camera position - locked in sweet spot
    this.cameraY = -0.70;
    this.cameraZ = 3.50;
    this.cameraLookAtY = -0.80;

    this.camera.position.set(0, this.cameraY, this.cameraZ);
    this.camera.lookAt(0, this.cameraLookAtY, 0);
  }

  // Call this to update camera and log values
  updateCamera() {
    this.camera.position.set(0, this.cameraY, this.cameraZ);
    this.camera.lookAt(0, this.cameraLookAtY, 0);
    console.log(`Camera - Position Y: ${this.cameraY.toFixed(2)}, Z: ${this.cameraZ.toFixed(2)}, LookAt Y: ${this.cameraLookAtY.toFixed(2)}`);
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

        // Camera controls - use [ ] for camera Y, ; ' for lookAt Y
        case 'BracketLeft': // [ - Move camera down
          this.cameraY -= 0.2;
          this.updateCamera();
          break;
        case 'BracketRight': // ] - Move camera up
          this.cameraY += 0.2;
          this.updateCamera();
          break;
        case 'Semicolon': // ; - Move lookAt down
          this.cameraLookAtY -= 0.2;
          this.updateCamera();
          break;
        case 'Quote': // ' - Move lookAt up
          this.cameraLookAtY += 0.2;
          this.updateCamera();
          break;
        case 'Backslash': // \ - Move camera closer (Z)
          this.cameraZ -= 0.2;
          this.updateCamera();
          break;
        case 'Enter': // Enter - Move camera further (Z)
          this.cameraZ += 0.2;
          this.updateCamera();
          break;

        // Bird debug controls
        case 'Space': // Pause/resume birds
          if (this.birds) {
            this.birds.togglePause();
          }
          break;
        case 'KeyD': // Toggle bird debug mode
          if (this.birds) {
            this.birds.toggleDebug();
          }
          break;
        case 'KeyF': // Toggle bird number labels
          if (this.birds) {
            this.birds.toggleLabels();
          }
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
    const currentTime = Date.now();

    // Get input from player
    let horizontalInput = this.input.getHorizontalInput();
    let verticalInput = this.input.getVerticalInput();

    // Add gentle wind drift
    this.windTime += 0.01;
    let windDrift = Math.sin(this.windTime) * this.windStrength;

    // Wind gust system - occasional stronger pushes
    if (!this.windGustActive && currentTime > this.nextGustTime) {
      // Start a new gust
      this.windGustActive = true;
      this.windGustTime = 0;
      this.windGustDirection = Math.random() > 0.5 ? 1 : -1; // Random left or right
      this.windGustStrength = 0.02 + Math.random() * 0.02; // 0.02-0.04 strength (stronger)
      this.currentGustDuration = 2.5 + Math.random() * 1.5; // 2.5-4 seconds (much longer)
      console.log(`Wind gust! Direction: ${this.windGustDirection > 0 ? 'right' : 'left'}, Duration: ${this.currentGustDuration.toFixed(1)}s`);
    }

    let gustIntensity = 0;
    if (this.windGustActive) {
      this.windGustTime += delta;
      const gustProgress = this.windGustTime / this.currentGustDuration;

      if (gustProgress < 1) {
        // Smooth bell curve for gust intensity
        gustIntensity = Math.sin(gustProgress * Math.PI);
        windDrift += this.windGustDirection * this.windGustStrength * gustIntensity;
      } else {
        // Gust finished
        this.windGustActive = false;
        this.nextGustTime = currentTime + 6000 + Math.random() * 10000; // 6-16 seconds until next gust
      }
    }

    // Update player with input + wind + gust info for visual reaction
    this.player.update(horizontalInput, verticalInput, windDrift, {
      gustActive: this.windGustActive,
      gustDirection: this.windGustDirection,
      gustIntensity: gustIntensity
    });

    // Update wind meter UI
    this.updateWindMeter(windDrift, gustIntensity);

    // Update cloud system
    this.clouds.update();

    // Update bird system
    this.birds.update(delta);

    // Check for bird collisions (only with close-up birds)
    this.checkBirdCollisions(currentTime);

    // Update terrain system
    this.terrain.update(delta);

    // Update speed effects
    if (this.speedEffects && this.speedEffectsEnabled) {
      this.speedEffects.update(delta);
    }
  }

  checkBirdCollisions(currentTime) {
    if (!this.player.object || !this.birds) return;

    // Only check if cooldown has passed
    if (currentTime - this.lastHitTime < this.hitCooldown) return;

    // Use actual object position, not the logical position
    // The player object is at Z: -1 with Y offset
    const playerObjPos = this.player.object.position;
    const collisionRadiusXY = 1.2; // Collision distance in X/Y
    const collisionRadiusZ = 2.0; // Z tolerance

    for (const birdData of this.birds.birds) {
      // Only check close-up birds for collision
      if (!birdData.isCloseUp) continue;

      const birdPos = birdData.mesh.position;

      // Check Z first - bird must be near player's Z plane (-1)
      const dz = Math.abs(birdPos.z - playerObjPos.z);
      if (dz > collisionRadiusZ) continue;

      // Check X/Y distance
      const dx = birdPos.x - playerObjPos.x;
      const dy = birdPos.y - playerObjPos.y;
      const distanceXY = Math.sqrt(dx * dx + dy * dy);

      // Debug logging for close birds
      if (dz < 3) {
        console.log(`Bird #${birdData.id} near player: dist=${distanceXY.toFixed(2)}, dz=${dz.toFixed(2)}, bird(${birdPos.x.toFixed(1)},${birdPos.y.toFixed(1)},${birdPos.z.toFixed(1)}) player(${playerObjPos.x.toFixed(1)},${playerObjPos.y.toFixed(1)},${playerObjPos.z.toFixed(1)})`);
      }

      if (distanceXY < collisionRadiusXY) {
        // Hit!
        this.score -= 1;
        this.lastHitTime = currentTime;
        this.showHitIndicator();
        this.updateScoreDisplay();
        this.player.playHitAnimation(); // Trigger hit animation
        console.log(`🔴 BIRD COLLISION! Bird #${birdData.id} | Score: ${this.score}`);
        break;
      }
    }
  }

  showHitIndicator() {
    const hitIndicator = document.getElementById('hit-indicator');
    if (!hitIndicator) return;

    // Remove and re-add class to restart animation
    hitIndicator.classList.remove('show');
    // Force reflow
    void hitIndicator.offsetWidth;
    hitIndicator.classList.add('show');
  }

  updateScoreDisplay() {
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
      scoreDisplay.textContent = `Score: ${this.score}`;
    }
  }

  updateWindMeter(windDrift, gustIntensity) {
    const arrow = document.getElementById('wind-arrow');
    const strengthBar = document.getElementById('wind-strength');
    const gustIndicator = document.getElementById('gust-indicator');

    if (!arrow || !strengthBar || !gustIndicator) return;

    // Calculate total wind strength (base + gust)
    const baseStrength = Math.abs(windDrift) / this.windStrength; // 0-1 for base wind
    const gustStrength = gustIntensity; // 0-1 for gust
    const totalStrength = Math.min(1, baseStrength * 0.3 + gustStrength * 0.7);

    // Update strength bar
    strengthBar.style.width = `${totalStrength * 100}%`;

    // Update arrow direction based on wind drift
    if (windDrift > 0.001) {
      arrow.textContent = '→';
      arrow.style.transform = 'scaleX(1)';
    } else if (windDrift < -0.001) {
      arrow.textContent = '←';
      arrow.style.transform = 'scaleX(1)';
    } else {
      arrow.textContent = '•';
    }

    // Show gust indicator
    if (this.windGustActive && gustIntensity > 0.3) {
      gustIndicator.classList.add('active');
    } else {
      gustIndicator.classList.remove('active');
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
