import * as THREE from 'three';

export class CloudSystem {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.cloudSpeed = 0.05;
    this.spawnInterval = 1500; // Back to more clouds
    this.lastSpawnTime = 0;
    this.maxClouds = 20; // More clouds like before
  }

  createCloud() {
    // Monument Valley style - smooth, soft, realistic clouds
    const cloudGroup = new THREE.Group();

    // BRIGHT WHITE clouds - very transparent while keeping white color
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Pure white
      transparent: true,
      opacity: 0.25, // Very transparent (was 0.5)
      roughness: 1.0,
      metalness: 0.0,
      flatShading: false,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending // Additive blending for bright white
    });

    // Create 8-12 spheres - balanced between quality and performance
    const numPuffs = 8 + Math.floor(Math.random() * 5);

    for (let i = 0; i < numPuffs; i++) {
      // Wide size variation including small details
      // Mix of large (0.8-2.0), medium (0.4-0.8), and small (0.2-0.4) spheres
      let size;
      const sizeRandom = Math.random();
      if (sizeRandom < 0.4) {
        // 40% large spheres (main cloud body)
        size = 0.8 + Math.random() * 1.2;
      } else if (sizeRandom < 0.7) {
        // 30% medium spheres (fill gaps)
        size = 0.4 + Math.random() * 0.4;
      } else {
        // 30% small spheres (fine details)
        size = 0.2 + Math.random() * 0.2;
      }

      // LOWER poly count to prevent memory issues (16 segments instead of 32)
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(size, 16, 16), // Lower poly to save memory
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
