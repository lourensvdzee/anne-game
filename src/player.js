import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.object = null;
    this.mixer = null;
    this.position = new THREE.Vector3(0, 0, 0);
    this.speed = 0.1;
    this.horizontalRange = 5;
    this.tiltAngle = 0;
    this.maxTilt = 0.3;
    this.tiltSpeed = 0.1;
    this.hoverOffset = 0;
    this.hoverSpeed = 0.05;
    this.hoverAmount = 0.15;
    this.clock = new THREE.Clock();
  }

  async load() {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();

      loader.load(
        'toon_girl_character.glb',
        (gltf) => {
          this.object = gltf.scene;

          // Scale the model (adjust as needed)
          this.object.scale.set(1, 1, 1); // GLB usually has good default scale

          // Position at origin
          this.object.position.copy(this.position);

          // Rotate to face forward if needed
          this.object.rotation.y = Math.PI; // Test this - might need adjustment

          // Enhance materials for better look
          this.object.traverse((child) => {
            if (child.isMesh) {
              // Keep original materials but enhance them
              if (child.material) {
                child.material.roughness = 0.7;
                child.material.metalness = 0;
                // Enable shadows if needed
                child.castShadow = true;
                child.receiveShadow = true;
              }
            }
          });

          // Setup animation if it exists in the GLB
          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.object);
            // Play first animation (if any)
            const action = this.mixer.clipAction(gltf.animations[0]);
            action.play();
            console.log('GLB animation playing:', gltf.animations[0].name);
          } else {
            console.log('No animations in GLB file');
          }

          this.scene.add(this.object);
          console.log('GLB character loaded successfully');
          resolve();
        },
        (progress) => {
          const percent = (progress.loaded / progress.total * 100).toFixed(0);
          console.log('Loading GLB:', percent + '%');
        },
        (error) => {
          console.error('GLB load error:', error);
          // Fallback to placeholder
          this.createPlaceholder();
          resolve();
        }
      );
    });
  }

  createPlaceholder() {
    this.object = new THREE.Group();
    const bodyColor = 0xffd4a3;
    const hairColor = 0xc4956c;

    const bodyGeometry = new THREE.CapsuleGeometry(0.15, 0.6, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.7,
      metalness: 0,
      flatShading: true
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.3;
    this.object.add(body);

    const headGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 0.75;
    this.object.add(head);

    const hairGeometry = new THREE.ConeGeometry(0.13, 0.5, 8);
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.8,
      metalness: 0,
      flatShading: true
    });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.set(0, 0.85, -0.05);
    hair.rotation.x = Math.PI;
    this.object.add(hair);

    this.object.scale.set(1.5, 1.5, 1.5);
    this.object.position.copy(this.position);
    this.scene.add(this.object);
    console.log('Placeholder character created');
  }

  update(horizontalInput, windDrift = 0) {
    if (!this.object) return;

    // Update animation if it exists
    if (this.mixer) {
      const delta = this.clock.getDelta();
      this.mixer.update(delta);
    }

    // Move left/right based on input + wind
    this.position.x += horizontalInput * this.speed + windDrift;
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
