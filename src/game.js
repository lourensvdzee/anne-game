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
    // Ambient light for overall illumination
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // Directional light (sun)
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(5, 10, 5);
    this.scene.add(sun);
  }

  setupSky() {
    // Simple gradient sky using fog and background color
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    this.scene.fog = new THREE.Fog(0x87ceeb, 20, 50);
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
