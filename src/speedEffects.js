import * as THREE from 'three';

export class SpeedEffectSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.trails = [];
    this.maxTrails = 30;
    this.spawnTimer = 0;
    this.spawnInterval = 0.03; // Spawn every few frames for smooth effect
    this.startZOffset = 0.20; // Q/E controls: Z offset from player position (adjustable)
    this.startYOffset = 0.60; // Z/X controls: Y offset from player position (adjustable)
    this.speedLineVelocity = 0.3; // How fast lines extend toward camera
  }

  createTrail(playerPosition, velocity, hoverOffset) {
    // Create a line/particle that emanates from the character sides
    const geometry = new THREE.BufferGeometry();

    // Determine spawn position (left or right side of character)
    const side = Math.random() > 0.5 ? 1 : -1;
    const offsetX = side * (0.3 + Math.random() * 0.2);
    const offsetY = (Math.random() - 0.5) * 0.5; // Slight vertical variation

    // Include hover offset so speed lines follow the character's bounce
    const startX = playerPosition.x + offsetX;
    const startY = playerPosition.y + this.startYOffset + offsetY + hoverOffset;
    const startZ = playerPosition.z + this.startZOffset; // Start position relative to character

    // Create line vertices (will extend toward camera)
    const positions = new Float32Array([
      startX, startY, startZ,
      startX, startY, startZ + 0.5 // Initial extension toward camera
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // White material with transparency
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const line = new THREE.Line(geometry, material);
    this.scene.add(line);

    // Store trail data
    this.trails.push({
      line: line,
      geometry: geometry,
      material: material,
      age: 0,
      maxAge: 0.5, // Half second lifetime
      startPos: { x: startX, y: startY, z: startZ },
      velocity: velocity
    });
  }

  update(delta) {
    if (!this.player.object) return;

    // Get player velocity (approximate from input)
    const playerVelocity = Math.sqrt(
      Math.pow(this.player.speed, 2) +
      Math.pow(this.player.verticalSpeed, 2)
    );

    // Calculate current hover offset to match character bounce
    const hoverY = Math.sin(this.player.hoverOffset) * this.player.hoverAmount;

    // Only spawn trails when moving
    if (playerVelocity > 0.05) {
      this.spawnTimer += delta;

      if (this.spawnTimer >= this.spawnInterval && this.trails.length < this.maxTrails) {
        this.createTrail(this.player.position, playerVelocity, hoverY);
        this.spawnTimer = 0;
      }
    }

    // Update existing trails
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const trail = this.trails[i];
      trail.age += delta;

      // Extend the line toward camera
      const positions = trail.geometry.attributes.position.array;

      // Extend end point toward camera (from background to foreground)
      positions[3] = trail.startPos.x; // Keep start X
      positions[4] = trail.startPos.y; // Keep start Y
      positions[5] += this.speedLineVelocity; // Move end point toward camera (adjustable)

      trail.geometry.attributes.position.needsUpdate = true;

      // Fade out based on age
      const fadeProgress = trail.age / trail.maxAge;
      trail.material.opacity = 0.8 * (1 - fadeProgress);

      // Remove old trails
      if (trail.age >= trail.maxAge) {
        this.scene.remove(trail.line);
        trail.geometry.dispose();
        trail.material.dispose();
        this.trails.splice(i, 1);
      }
    }
  }

  // Clean up all trails
  dispose() {
    this.trails.forEach(trail => {
      this.scene.remove(trail.line);
      trail.geometry.dispose();
      trail.material.dispose();
    });
    this.trails = [];
  }
}
