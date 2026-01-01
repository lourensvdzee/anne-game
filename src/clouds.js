import * as THREE from 'three';

export class CloudSystem {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.cloudSpeed = 0.05; // Slow, gentle movement
    this.spawnInterval = 2000; // Spawn a cloud every 2 seconds
    this.lastSpawnTime = 0;
    this.maxClouds = 15;
  }

  createCloud() {
    // Create cloud using multiple spheres for a fluffy look
    const cloudGroup = new THREE.Group();

    // Soft white material, semi-transparent
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      roughness: 1.0,
      metalness: 0.0
    });

    // Create 3-5 spheres of varying sizes
    const numPuffs = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numPuffs; i++) {
      const size = 0.5 + Math.random() * 0.8;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(size, 8, 8),
        cloudMaterial
      );

      // Position puffs randomly within a small area
      sphere.position.x = (Math.random() - 0.5) * 1.5;
      sphere.position.y = (Math.random() - 0.5) * 0.8;
      sphere.position.z = (Math.random() - 0.5) * 1.5;

      cloudGroup.add(sphere);
    }

    // Position cloud ahead of player, at random horizontal position
    const x = (Math.random() - 0.5) * 12; // Spread across screen
    const y = 1 + Math.random() * 3; // Between 1 and 4 units high
    const z = -30 - Math.random() * 10; // Start far ahead

    cloudGroup.position.set(x, y, z);

    this.scene.add(cloudGroup);
    this.clouds.push(cloudGroup);
  }

  update(deltaTime) {
    const currentTime = Date.now();

    // Spawn new clouds periodically
    if (currentTime - this.lastSpawnTime > this.spawnInterval && this.clouds.length < this.maxClouds) {
      this.createCloud();
      this.lastSpawnTime = currentTime;
    }

    // Move clouds toward camera (forward movement illusion)
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const cloud = this.clouds[i];
      cloud.position.z += this.cloudSpeed;

      // Remove clouds that have passed behind the camera
      if (cloud.position.z > 10) {
        this.scene.remove(cloud);
        this.clouds.splice(i, 1);
      }
    }
  }
}
