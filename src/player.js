import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.object = null;
    this.mixer = null;
    this.position = new THREE.Vector3(0, -1.76, 0); // Default position - visually centered on screen
    this.speed = 0.1;
    this.verticalSpeed = 0.08; // Speed for up/down movement

    // Base limits for full-size screen (these are reference values)
    this.baseTopLeftLimit = -3.44;
    this.baseTopRightLimit = 3.39;
    this.baseBottomLeftLimit = -4.35;
    this.baseBottomRightLimit = 4.35;
    this.baseMinVerticalPosition = -4.40;
    this.baseMaxVerticalPosition = 1.44;

    // Actual limits (will be scaled for screen size)
    this.topLeftLimit = this.baseTopLeftLimit;
    this.topRightLimit = this.baseTopRightLimit;
    this.bottomLeftLimit = this.baseBottomLeftLimit;
    this.bottomRightLimit = this.baseBottomRightLimit;
    this.minVerticalPosition = this.baseMinVerticalPosition;
    this.maxVerticalPosition = this.baseMaxVerticalPosition;

    this.reverseVertical = false; // Toggle for reversing up/down controls

    // Track horizontal "lane" as a percentage (0.0 = far left, 1.0 = far right)
    // This allows the character to follow the same curved path when moving vertically
    this.horizontalLanePercent = 0.5; // Start in middle

    // Update limits based on current screen size
    this.updateLimitsForScreenSize();
    window.addEventListener('resize', () => this.updateLimitsForScreenSize());

    this.hoverOffset = 0;
    this.hoverSpeed = 0.05;
    this.hoverAmount = 0.15;
    this.clock = new THREE.Clock();

    // Rotation settings
    this.baseRotationY = 180; // Base rotation in degrees (facing forward)
    this.rotationLeft = 156;  // Rotation when moving left (180 - 24)
    this.rotationRight = 204; // Rotation when moving right (180 + 24)
    this.currentRotationY = this.baseRotationY;
    this.rotationSpeed = 0.1; // Smooth transition speed

    // X-axis tilt (forward/back)
    this.tiltX = 7.0; // Base forward tilt in degrees
    this.verticalTilt = 0; // Additional tilt from vertical movement
    this.maxVerticalTilt = 20; // Max degrees to tilt when moving up/down

    // Z-axis banking (left/right tilt when moving)
    this.tiltAngle = 0;
    this.maxTilt = 0.6; // radians (bigger tilt effect)
    this.tiltSpeed = 0.1;

    // Physics simulation for hair/dress
    this.hairSwayOffset = 0;
    this.hairSwaySpeed = 0.1;
    this.hairSwayAmount = 0.05;
    this.dressSwayOffset = 0;
    this.dressSwaySpeed = 0.08;
    this.dressSwayAmount = 0.1;
    this.previousVelocityX = 0;
    this.previousVelocityY = 0;

    // Hair "standing" direction - where the ponytail points/stands
    // Think of it like setting which way a flag points when there's wind
    this.hairStandDirectionX = -1.6; // Negative = stands toward camera (forward)
    this.hairStandDirectionY = 0.0;  // 0 = level, positive = up, negative = down
    this.hairStandDirectionZ = 0.4;  // Negative = left side, positive = right side (slightly left)

    // Hair direction presets
    this.currentHairDirectionPreset = 0;
    this.hairDirectionPresets = [
      { name: "Forward (toward camera)", x: -1.0, y: 0.0, z: 0.0 },
      { name: "Backward (away from camera)", x: 1.0, y: 0.0, z: 0.0 },
      { name: "Left side", x: 0.0, y: 0.0, z: -1.0 },
      { name: "Right side", x: 0.0, y: 0.0, z: 1.0 },
      { name: "Upward", x: 0.0, y: 1.0, z: 0.0 },
      { name: "Downward", x: 0.0, y: -1.0, z: 0.0 },
      { name: "Forward-Right", x: -1.0, y: 0.0, z: 1.0 },
      { name: "Forward-Left", x: -1.0, y: 0.0, z: -1.0 },
      { name: "Backward-Right", x: 1.0, y: 0.0, z: 1.0 },
      { name: "Backward-Left", x: 1.0, y: 0.0, z: -1.0 }
    ];

    // Hair movement presets - Mathematical variations
    this.currentHairPreset = 0;
    this.hairPresets = [
      {
        name: "1: Pure Forward Blast",
        forwardAmount: 1.0,
        sideSwayAmount: 0.0,
        upDownAmount: 0.0,
        multiplier: 0.6
      },
      {
        name: "2: Extreme Reverse Whip",
        forwardAmount: 0.0,
        sideSwayAmount: 2.5,
        upDownAmount: 0.0,
        multiplier: 0.8
      },
      {
        name: "3: Preset1 + Neutral X",
        forwardAmount: 0.0,  // X: -1.6 * (windSway + 0.0) = nearly neutral
        sideSwayAmount: 0.0, // Same as Preset 1
        upDownAmount: 0.0,   // Same as Preset 1
        multiplier: 0.6
      },
      {
        name: "4: Preset1 + Reverse Z",
        forwardAmount: 0.0,   // Z: movementSway * -2.5 + 0.4 * (windSway + 0.0)
        sideSwayAmount: -2.5, // Extreme reverse whip
        upDownAmount: 0.0,    // Same as Preset 1
        multiplier: 0.6
      },
      {
        name: "5: Preset1 + Z WindSway",
        forwardAmount: 0.0,   // Z: movementSway * -2.5 + 0.4 * windSway (stays dynamic)
        sideSwayAmount: -2.5, // Extreme reverse
        upDownAmount: 0.0,    // Same as Preset 1
        multiplier: 0.6
      },
      {
        name: "6: Preset1 + Neutral Y",
        forwardAmount: 0.0,   // Y: sin * 0.0 + 0.0 * (windSway + 0.0) = neutral
        sideSwayAmount: 0.0,  // Same as Preset 1
        upDownAmount: 0.0,    // Set to 0 for neutral Y
        multiplier: 0.6
      },
      {
        name: "7: Strong Forward + Mild Z",
        forwardAmount: 1.0,
        sideSwayAmount: -1.0, // Milder reverse
        upDownAmount: 0.0,
        multiplier: 0.6
      },
      {
        name: "8: Balanced Mix",
        forwardAmount: 0.7,
        sideSwayAmount: -1.8,
        upDownAmount: 0.0,
        multiplier: 0.65
      },
      {
        name: "9: Triple Combo",
        forwardAmount: 0.8,
        sideSwayAmount: -2.0,
        upDownAmount: 0.5,   // Add some vertical
        multiplier: 0.7
      },
      {
        name: "10: Extreme All",
        forwardAmount: 1.0,
        sideSwayAmount: -2.5,
        upDownAmount: 1.0,
        multiplier: 0.8
      }
    ];
  }

  updateLimitsForScreenSize() {
    // Reference width (the width these base values were designed for)
    const referenceWidth = 1920;
    const referenceHeight = 1080;

    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    // For horizontal limits, scale based on aspect ratio
    // Narrower screens need smaller horizontal limits
    const aspectRatio = currentWidth / currentHeight;
    const referenceAspectRatio = referenceWidth / referenceHeight;
    const aspectScale = aspectRatio / referenceAspectRatio;

    // Apply scaling to horizontal limits
    this.topLeftLimit = this.baseTopLeftLimit * aspectScale;
    this.topRightLimit = this.baseTopRightLimit * aspectScale;
    this.bottomLeftLimit = this.baseBottomLeftLimit * aspectScale;
    this.bottomRightLimit = this.baseBottomRightLimit * aspectScale;

    // Vertical limits stay the same (camera handles vertical scaling)
    this.minVerticalPosition = this.baseMinVerticalPosition;
    this.maxVerticalPosition = this.baseMaxVerticalPosition;

    // Clamp position if it's now outside the new limits
    const verticalPercent = (this.position.y - this.minVerticalPosition) /
                           (this.maxVerticalPosition - this.minVerticalPosition);
    const minX = this.topLeftLimit + (this.bottomLeftLimit - this.topLeftLimit) * (1 - verticalPercent);
    const maxX = this.topRightLimit + (this.bottomRightLimit - this.topRightLimit) * (1 - verticalPercent);
    this.position.x = Math.max(minX, Math.min(maxX, this.position.x));

    console.log(`Screen resized - Limits updated for ${currentWidth}x${currentHeight} (aspect: ${aspectScale.toFixed(2)})`);
  }

  async load() {
    try {
      await this.loadHybrid();
    } catch (error) {
      await this.loadGLBOnly();
    }
  }

  async loadHybrid() {
    // Load only the FBX (contains both model and animation)
    const fbx = await this.loadFBX('Flying_new.fbx');

    // Use the FBX as the character model
    this.object = fbx;

    // Set scale - MUCH smaller to see full body with feet
    this.object.scale.set(0.01, 0.01, 0.01); // Zoom out MUCH more
    this.object.position.copy(this.position);
    this.object.position.z = -1; // Move closer to camera
    this.object.position.y = -15.0; // Even MUCH MUCH lower - very far below middle of screen

    // Rotate: 180° to face forward direction
    this.object.rotation.y = (180 * Math.PI / 180);
    this.object.rotation.x = (this.tiltX * Math.PI / 180); // Use tiltX property

    // Enhance materials
    this.object.traverse((child) => {
      if (child.isMesh) {
        if (child.material) {
          child.material.roughness = 0.7;
          child.material.metalness = 0;
        }
      }
    });

    // Try to apply animation from the FBX
    if (fbx.animations && fbx.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.object);
      const action = this.mixer.clipAction(fbx.animations[0]);
      action.play();
      action.setLoop(THREE.LoopRepeat, Infinity);
    }

    this.scene.add(this.object);

    // Find bones for physics (hair/dress)
    this.findPhysicsBones();
  }

  findPhysicsBones() {
    if (!this.object) return;

    this.hairBones = [];
    this.dressBones = [];

    this.object.traverse((child) => {
      if (child.isBone) {
        const boneName = child.name.toLowerCase();

        // Look for ponytail/hair bones
        if (boneName.includes('hair') || boneName.includes('ponytail') ||
            boneName.includes('braid') || boneName.includes('pigtail')) {
          this.hairBones.push(child);
        }

        // Look for dress/skirt bones
        if (boneName.includes('dress') || boneName.includes('skirt') ||
            boneName.includes('cloth') || boneName.includes('cape')) {
          this.dressBones.push(child);
        }
      }
    });

    console.log('Found hair bones:', this.hairBones.length);
    console.log('Found dress bones:', this.dressBones.length);
  }

  async loadGLTF(path) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(path, resolve, undefined, reject);
    });
  }

  async loadFBX(path) {
    return new Promise((resolve, reject) => {
      const loader = new FBXLoader();
      loader.load(path, resolve, undefined, reject);
    });
  }

  async loadGLBOnly() {
    return new Promise((resolve) => {
      const loader = new GLTFLoader();

      loader.load(
        'toon_girl_character.glb',
        (gltf) => {
          this.object = gltf.scene;
          this.object.scale.set(1, 1, 1);
          this.object.position.copy(this.position);
          this.object.rotation.y = Math.PI;

          this.object.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.roughness = 0.7;
              child.material.metalness = 0;
            }
          });

          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.object);
            const action = this.mixer.clipAction(gltf.animations[0]);
            action.play();
          }

          this.scene.add(this.object);
          resolve();
        },
        undefined,
        () => {
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
  }

  update(horizontalInput, verticalInput, windDrift = 0) {
    if (!this.object) return;

    // Update animation if it exists
    if (this.mixer) {
      const delta = this.clock.getDelta();
      this.mixer.update(delta);
    }

    // Calculate current limits BEFORE any movement
    let verticalProgress = (this.position.y - this.minVerticalPosition) /
                           (this.maxVerticalPosition - this.minVerticalPosition);
    let minX = this.bottomLeftLimit + (this.topLeftLimit - this.bottomLeftLimit) * verticalProgress;
    let maxX = this.bottomRightLimit + (this.topRightLimit - this.bottomRightLimit) * verticalProgress;
    const currentWidth = maxX - minX;

    // When moving HORIZONTALLY, update the lane percentage
    if (Math.abs(horizontalInput) > 0.01) {
      this.position.x += horizontalInput * this.speed + windDrift;
      this.position.x = Math.max(minX, Math.min(maxX, this.position.x));
      // Calculate which lane we're in (0.0 = far left, 1.0 = far right)
      this.horizontalLanePercent = (this.position.x - minX) / currentWidth;
    }

    // Move up/down based on vertical input (with optional reversal)
    const effectiveVerticalInput = this.reverseVertical ? -verticalInput : verticalInput;
    this.position.y += effectiveVerticalInput * this.verticalSpeed;
    this.position.y = Math.max(this.minVerticalPosition, Math.min(this.maxVerticalPosition, this.position.y));

    // Recalculate limits based on NEW vertical position
    verticalProgress = (this.position.y - this.minVerticalPosition) /
                       (this.maxVerticalPosition - this.minVerticalPosition);
    minX = this.bottomLeftLimit + (this.topLeftLimit - this.bottomLeftLimit) * verticalProgress;
    maxX = this.bottomRightLimit + (this.topRightLimit - this.bottomRightLimit) * verticalProgress;

    // Apply the lane percentage to the new position
    // This makes the character follow the same curved path when moving vertically
    this.position.x = minX + (this.horizontalLanePercent * (maxX - minX));

    // Determine target rotation based on movement direction
    let targetRotationY;
    if (horizontalInput > 0.1) {
      // Moving right
      targetRotationY = this.rotationRight;
    } else if (horizontalInput < -0.1) {
      // Moving left
      targetRotationY = this.rotationLeft;
    } else {
      // Not moving - use base rotation
      targetRotationY = this.baseRotationY;
    }

    // Smoothly interpolate to target rotation
    this.currentRotationY += (targetRotationY - this.currentRotationY) * this.rotationSpeed;

    // Bank/tilt based on movement direction (Z-axis)
    // Moving right = positive input = tilt right (positive z rotation)
    // Moving left = negative input = tilt left (negative z rotation)
    const targetTilt = horizontalInput * this.maxTilt;
    this.tiltAngle += (targetTilt - this.tiltAngle) * this.tiltSpeed;

    // Vertical tilt based on up/down movement (X-axis)
    // Moving up = positive input = head tilts up (negative x tilt for backward lean)
    // Moving down = negative input = head tilts down (positive x tilt for forward lean)
    const targetVerticalTilt = verticalInput * this.maxVerticalTilt;
    this.verticalTilt += (targetVerticalTilt - this.verticalTilt) * this.tiltSpeed;

    // Hovering effect
    this.hoverOffset += this.hoverSpeed;
    const hoverY = Math.sin(this.hoverOffset) * this.hoverAmount;

    // Apply position with hover
    this.object.position.set(
      this.position.x,
      this.position.y + hoverY,
      this.position.z
    );

    // Log position every 60 frames (roughly once per second)
    if (!this.frameCount) this.frameCount = 0;
    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      console.log(`Position - X: ${this.position.x.toFixed(2)}, Y: ${this.position.y.toFixed(2)}, Z: ${this.position.z.toFixed(2)}`);
    }

    // Apply rotation: forward tilt (x) + vertical tilt, current y rotation, and banking (z)
    const totalXTilt = this.tiltX + this.verticalTilt;
    this.object.rotation.set(
      totalXTilt * Math.PI / 180, // X-axis: base tilt + vertical movement tilt
      this.currentRotationY * Math.PI / 180, // Y-axis: left/right turn
      this.tiltAngle // Z-axis: banking when moving left/right
    );

    // Update physics for hair and dress
    this.updatePhysics(horizontalInput, effectiveVerticalInput, windDrift);
  }

  updatePhysics(horizontalInput, verticalInput, windDrift) {
    if (!this.hairBones && !this.dressBones) return;

    // Get current preset
    const preset = this.hairPresets[this.currentHairPreset];

    // Calculate velocity changes for inertia effects
    const velocityX = horizontalInput + windDrift;
    const velocityY = verticalInput;
    const deltaVelocityX = velocityX - this.previousVelocityX;

    // Update hair sway with preset parameters
    this.hairSwayOffset += this.hairSwaySpeed;
    const windSway = Math.sin(this.hairSwayOffset) * this.hairSwayAmount;
    const movementSway = deltaVelocityX * 2;

    // Hair rotates using preset values AND hair stand direction
    // X rotation: forward/backward (toward/away from camera)
    const hairRotationX = this.hairStandDirectionX * (windSway + preset.forwardAmount);
    // Z rotation: side-to-side - give hairStandDirectionZ the same strength as X
    const hairRotationZ = movementSway * preset.sideSwayAmount + this.hairStandDirectionZ * (windSway + preset.forwardAmount);
    // Y rotation: up-down bounce - give hairStandDirectionY the same strength as X
    const hairRotationY = Math.sin(this.hairSwayOffset * 1.3) * preset.upDownAmount + this.hairStandDirectionY * (windSway + preset.forwardAmount);

    // Update dress sway (uses same stand direction as hair)
    this.dressSwayOffset += this.dressSwaySpeed;
    const dressSway = Math.sin(this.dressSwayOffset) * this.dressSwayAmount;

    // Dress billows based on hair stand direction
    const dressRotationX = this.hairStandDirectionX * (dressSway + 0.8); // Much stronger
    const dressRotationZ = movementSway * 0.5 + this.hairStandDirectionZ * dressSway; // Side movement
    const dressRotationY = Math.sin(this.dressSwayOffset * 0.7) * 0.3 + this.hairStandDirectionY * dressSway; // Outward flare

    // Apply to hair bones using preset multiplier
    if (this.hairBones) {
      this.hairBones.forEach((bone, index) => {
        const multiplier = 1 + (index * preset.multiplier); // Progressive sway along chain
        bone.rotation.x = hairRotationX * multiplier; // Forward toward camera
        bone.rotation.y = hairRotationY * multiplier; // Up-down bounce
        bone.rotation.z = hairRotationZ * multiplier; // Side to side
      });
    }

    // Apply to dress bones with more dramatic movement
    if (this.dressBones) {
      this.dressBones.forEach((bone, index) => {
        const multiplier = 1 + (index * 0.5); // Much stronger progressive movement
        bone.rotation.x = dressRotationX * multiplier; // Forward billow
        bone.rotation.z = dressRotationZ * multiplier; // Side sway
        bone.rotation.y = dressRotationY * multiplier; // Outward flare for all-around movement
      });
    }

    this.previousVelocityX = velocityX;
    this.previousVelocityY = velocityY;
  }

  // Method to cycle through hair presets
  nextHairPreset() {
    this.currentHairPreset = (this.currentHairPreset + 1) % this.hairPresets.length;
    console.log(`Hair Preset ${this.currentHairPreset + 1}/10: "${this.hairPresets[this.currentHairPreset].name}"`);
  }

  previousHairPreset() {
    this.currentHairPreset = (this.currentHairPreset - 1 + this.hairPresets.length) % this.hairPresets.length;
    console.log(`Hair Preset ${this.currentHairPreset + 1}/10: "${this.hairPresets[this.currentHairPreset].name}"`);
  }

  // Cycle through hair direction presets
  nextHairDirection() {
    this.currentHairDirectionPreset = (this.currentHairDirectionPreset + 1) % this.hairDirectionPresets.length;
    const preset = this.hairDirectionPresets[this.currentHairDirectionPreset];
    this.hairStandDirectionX = preset.x;
    this.hairStandDirectionY = preset.y;
    this.hairStandDirectionZ = preset.z;
    console.log(`Hair Direction ${this.currentHairDirectionPreset + 1}/10: "${preset.name}" (X:${preset.x.toFixed(1)}, Y:${preset.y.toFixed(1)}, Z:${preset.z.toFixed(1)})`);
  }

  previousHairDirection() {
    this.currentHairDirectionPreset = (this.currentHairDirectionPreset - 1 + this.hairDirectionPresets.length) % this.hairDirectionPresets.length;
    const preset = this.hairDirectionPresets[this.currentHairDirectionPreset];
    this.hairStandDirectionX = preset.x;
    this.hairStandDirectionY = preset.y;
    this.hairStandDirectionZ = preset.z;
    console.log(`Hair Direction ${this.currentHairDirectionPreset + 1}/10: "${preset.name}" (X:${preset.x.toFixed(1)}, Y:${preset.y.toFixed(1)}, Z:${preset.z.toFixed(1)})`);
  }
}
