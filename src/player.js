import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.object = null;
    this.position = new THREE.Vector3(0, 0, 0);
    this.speed = 0.1;
    this.horizontalRange = 5;
    this.tiltAngle = 0;
    this.maxTilt = 0.3; // Max tilt in radians (about 17 degrees)
    this.tiltSpeed = 0.1;
    this.hoverOffset = 0;
    this.hoverSpeed = 0.05;
    this.hoverAmount = 0.15;
  }

  async load() {
    return new Promise((resolve, reject) => {
      const mtlLoader = new MTLLoader();
      mtlLoader.setPath('models/');

      mtlLoader.load('jetanima.mtl', (materials) => {
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('models/');

        objLoader.load(
          'jetanima.obj',
          (obj) => {
            this.object = obj;
            this.object.position.copy(this.position);

            // Adjust scale if needed (you may need to tweak this)
            this.object.scale.set(0.5, 0.5, 0.5);

            // Rotate to face forward (into the screen)
            this.object.rotation.y = Math.PI;

            // Apply white material to all meshes
            this.object.traverse((child) => {
              if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0xffffff,
                  metalness: 0.3,
                  roughness: 0.4
                });
              }
            });

            this.scene.add(this.object);
            resolve();
          },
          undefined,
          reject
        );
      });
    });
  }

  update(horizontalInput, windDrift = 0) {
    if (!this.object) return;

    // Move left/right based on input + wind
    this.position.x += horizontalInput * this.speed + windDrift;

    // Clamp position to stay in bounds
    this.position.x = Math.max(-this.horizontalRange, Math.min(this.horizontalRange, this.position.x));

    // Bank/tilt based on movement direction
    const targetTilt = horizontalInput * this.maxTilt;
    this.tiltAngle += (targetTilt - this.tiltAngle) * this.tiltSpeed;

    // Hovering effect
    this.hoverOffset += this.hoverSpeed;
    const hoverY = Math.sin(this.hoverOffset) * this.hoverAmount;

    // Apply position with hover
    this.object.position.set(
      this.position.x,
      this.position.y + hoverY,
      this.position.z
    );

    // Apply tilt rotation (banking) along the z-axis
    this.object.rotation.z = this.tiltAngle;
  }
}
