import * as THREE from 'three';

export class CloudSystem {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.cloudSpeed = 0.05;
    this.spawnInterval = 2500; // Slower spawn = fewer clouds
    this.lastSpawnTime = 0;
    this.maxClouds = 12; // Much fewer clouds
  }

  createCloud() {
    // Monument Valley style - smooth, soft, realistic clouds
    const cloudGroup = new THREE.Group();

    // Ultra-soft cloud material - light blue, NO shadows
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xb8d4e8, // Light blue (same as horizon fog color)
      transparent: true,
      opacity: 0.75,
      roughness: 1.0,
      metalness: 0.0,
      flatShading: false,
      side: THREE.DoubleSide,
      // Prevent dark spots where spheres overlap
      depthWrite: false, // Don't write to depth buffer
      blending: THREE.AdditiveBlending // Additive blending for soft overlaps
    });

    // Create 6-12 spheres for softer, less massive clouds
    const numPuffs = 6 + Math.floor(Math.random() * 7);

    for (let i = 0; i < numPuffs; i++) {
      // Wide size variation for organic look
      const size = 0.6 + Math.random() * 1.8;

      // HIGH poly count for smoothness (32 segments)
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(size, 32, 32), // Very smooth spheres
        cloudMaterial
      );

      // Tight clustering for cohesive cloud mass
      const clusterRadius = 2.2;
      sphere.position.x = (Math.random() - 0.5) * clusterRadius;
      sphere.position.y = (Math.random() - 0.5) * clusterRadius * 0.5;
      sphere.position.z = (Math.random() - 0.5) * clusterRadius;

      cloudGroup.add(sphere);
    }

    // Wide vertical distribution - clouds ABOVE, BELOW, and around player
    const x = (Math.random() - 0.5) * 20; // Wide horizontal spread

    // NEW: Much wider Y range - from far below to high above
    const yChoice = Math.random();
    let y;
    if (yChoice < 0.3) {
      // 30% chance: Clouds far BELOW (creates depth)
      y = -10 + Math.random() * 8; // -10 to -2
    } else if (yChoice < 0.6) {
      // 30% chance: Clouds at player level or slightly above
      y = -1 + Math.random() * 4; // -1 to 3
    } else {
      // 40% chance: Clouds HIGH above
      y = 3 + Math.random() * 8; // 3 to 11
    }

    const z = -35 - Math.random() * 20; // Start further ahead

    cloudGroup.position.set(x, y, z);

    // Varied scale for diversity
    const scale = 0.6 + Math.random() * 0.5;
    cloudGroup.scale.set(scale, scale, scale);

    this.scene.add(cloudGroup);
    this.clouds.push(cloudGroup);
  }

  update() {
    const currentTime = Date.now();

    // Spawn new clouds periodically
    if (currentTime - this.lastSpawnTime > this.spawnInterval && this.clouds.length < this.maxClouds) {
      this.createCloud();
      this.lastSpawnTime = currentTime;
    }

    // Move clouds toward camera
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const cloud = this.clouds[i];
      cloud.position.z += this.cloudSpeed;

      // Remove clouds that have passed behind the camera
      if (cloud.position.z > 15) {
        this.scene.remove(cloud);
        this.clouds.splice(i, 1);
      }
    }
  }
}
