import * as THREE from 'three';

export class BirdSystem {
  constructor(scene) {
    this.scene = scene;
    this.birds = [];
    this.maxBirds = 25; // Increased from 10
    this.spawnInterval = 1500 + Math.random() * 2000; // 1.5-3.5 seconds between spawns (faster)
    this.lastSpawnTime = 0;
    this.lastCloseUpTime = 0;
    this.closeUpInterval = 12000 + Math.random() * 15000; // 12-27 seconds between close-ups (more frequent)

    // Debug/pause controls
    this.paused = false;
    this.debugMode = false;
    this.showLabels = false; // Toggle for number labels

    // Bird ID counter to prevent duplicates
    this.nextBirdId = 0;

    // Spawn a few birds at startup
    this.initializeBirds();
  }

  initializeBirds() {
    // Start with 6-8 birds already in the scene (increased from 2-3)
    const initialBirds = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < initialBirds; i++) {
      this.createBird(true, 'random');
    }
  }

  // Toggle pause for debugging
  togglePause() {
    this.paused = !this.paused;
    console.log(`Birds ${this.paused ? 'PAUSED' : 'RESUMED'}`);
    return this.paused;
  }

  // Toggle debug mode to show bird directions
  toggleDebug() {
    this.debugMode = !this.debugMode;
    console.log(`Bird debug mode ${this.debugMode ? 'ON' : 'OFF'}`);
    if (this.debugMode) {
      this.logBirdInfo();
    }
    return this.debugMode;
  }

  // Toggle number labels above birds
  toggleLabels() {
    this.showLabels = !this.showLabels;
    console.log(`Bird labels ${this.showLabels ? 'ON' : 'OFF'}`);

    // Update existing birds
    this.birds.forEach(birdData => {
      if (birdData.label) {
        birdData.label.visible = this.showLabels;
      }
    });

    return this.showLabels;
  }

  // Create a text sprite for bird number
  createBirdLabel(id, isCloseUp) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;

    // Draw background circle
    context.beginPath();
    context.arc(32, 32, 28, 0, Math.PI * 2);
    context.fillStyle = isCloseUp ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 100, 255, 0.8)';
    context.fill();

    // Draw border
    context.strokeStyle = 'white';
    context.lineWidth = 3;
    context.stroke();

    // Draw number
    context.fillStyle = 'white';
    context.font = 'bold 28px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(id.toString(), 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.5, 0.5, 1);
    sprite.position.set(0, 0.3, 0); // Above the bird
    sprite.visible = this.showLabels;

    return sprite;
  }

  // Log info about all current birds
  logBirdInfo() {
    console.log(`\n=== BIRD INFO (${this.birds.length} birds) ===`);
    this.birds.forEach((birdData, i) => {
      const pos = birdData.mesh.position;
      const rot = birdData.mesh.rotation;

      // Calculate flight direction in human terms
      let horizontalDir = '';
      if (birdData.velocityX > 0.01) horizontalDir = 'RIGHT';
      else if (birdData.velocityX < -0.01) horizontalDir = 'LEFT';
      else horizontalDir = 'STRAIGHT';

      let verticalDir = '';
      if (birdData.velocityY > 0.005) verticalDir = '+UP';
      else if (birdData.velocityY < -0.005) verticalDir = '+DOWN';

      let depthDir = '';
      if (birdData.velocityZ > 0.01) depthDir = '+TOWARD';
      else if (birdData.velocityZ < -0.01) depthDir = '+AWAY';

      const dirString = `${horizontalDir}${verticalDir}${depthDir}`;
      const isClose = birdData.isCloseUp ? ' [CLOSE-UP]' : '';

      console.log(`Bird ${i}${isClose}: ${birdData.flightPattern} | Flying: ${dirString} | ` +
        `Pos(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}) | ` +
        `Rot Y: ${(rot.y * 180 / Math.PI).toFixed(0)}°`);
    });
    console.log('===================================\n');
  }

  createBird(randomizePosition = false, distanceType = 'random') {
    if (this.birds.length >= this.maxBirds) return;

    const bird = new THREE.Group();

    // Determine distance category
    let zRange, scaleMultiplier;
    if (distanceType === 'close') {
      // Very close bird - dramatic fly-by
      zRange = { min: -3, max: -1 };
      scaleMultiplier = 2.5;
    } else if (distanceType === 'medium') {
      // Medium distance
      zRange = { min: -8, max: -4 };
      scaleMultiplier = 1.5;
    } else if (distanceType === 'far') {
      // Far distance
      zRange = { min: -25, max: -15 };
      scaleMultiplier = 0.6;
    } else {
      // Random - weighted towards variety
      const distRoll = Math.random();
      if (distRoll < 0.15) {
        // 15% close
        zRange = { min: -6, max: -3 };
        scaleMultiplier = 1.8;
      } else if (distRoll < 0.45) {
        // 30% medium
        zRange = { min: -12, max: -6 };
        scaleMultiplier = 1.2;
      } else {
        // 55% far
        zRange = { min: -25, max: -12 };
        scaleMultiplier = 0.7;
      }
    }

    // More detailed bird for closer views
    const isDetailedBird = scaleMultiplier > 1.0;

    // Bird colors - variety of species
    const birdColors = [
      { body: 0x2a2a2a, wing: 0x3a3a3a }, // Dark (crow/raven)
      { body: 0x8B4513, wing: 0x654321 }, // Brown (sparrow)
      { body: 0x4a4a4a, wing: 0x6a6a6a }, // Grey (pigeon)
      { body: 0x1a1a3a, wing: 0x2a2a4a }, // Dark blue (swallow)
    ];
    const colorChoice = birdColors[Math.floor(Math.random() * birdColors.length)];

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: colorChoice.body,
      roughness: 0.7,
      metalness: 0.1
    });

    const wingMaterial = new THREE.MeshStandardMaterial({
      color: colorChoice.wing,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    if (isDetailedBird) {
      // More detailed bird model for close-ups
      // Body - smoother elongated ellipsoid
      const bodyGeometry = new THREE.SphereGeometry(0.1, 12, 8);
      bodyGeometry.scale(1.5, 0.8, 0.8);
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      bird.add(body);

      // Head
      const headGeometry = new THREE.SphereGeometry(0.06, 10, 8);
      const head = new THREE.Mesh(headGeometry, bodyMaterial);
      head.position.set(0.12, 0.03, 0);
      bird.add(head);

      // Beak
      const beakGeometry = new THREE.ConeGeometry(0.02, 0.06, 4);
      const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xFFAA00, roughness: 0.5 });
      const beak = new THREE.Mesh(beakGeometry, beakMaterial);
      beak.rotation.z = -Math.PI / 2;
      beak.position.set(0.18, 0.03, 0);
      bird.add(beak);

      // Tail
      const tailGeometry = new THREE.ConeGeometry(0.04, 0.15, 4);
      const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
      tail.rotation.z = Math.PI / 2;
      tail.position.set(-0.18, 0, 0);
      bird.add(tail);

      // Detailed wings
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(-0.08, 0.25);
      wingShape.lineTo(-0.02, 0.28);
      wingShape.lineTo(0.06, 0.15);
      wingShape.lineTo(0.08, 0);
      wingShape.lineTo(0, 0);

      const wingExtrudeSettings = { depth: 0.01, bevelEnabled: false };
      const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);

      const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
      leftWing.position.set(-0.02, 0.05, 0.01);
      leftWing.name = 'leftWing';
      bird.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
      rightWing.position.set(-0.02, -0.05, -0.01);
      rightWing.scale.y = -1;
      rightWing.name = 'rightWing';
      bird.add(rightWing);
    } else {
      // Simple bird for distance
      const bodyGeometry = new THREE.ConeGeometry(0.08, 0.3, 4);
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.rotation.z = Math.PI / 2;
      bird.add(body);

      // Simple wings
      const wingGeometry = new THREE.BufferGeometry();
      const wingVertices = new Float32Array([
        0, 0, 0,
        -0.15, 0, 0.25,
        0.05, 0, 0.08
      ]);
      wingGeometry.setAttribute('position', new THREE.BufferAttribute(wingVertices, 3));
      wingGeometry.computeVertexNormals();

      const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
      leftWing.position.set(0, 0.02, 0);
      leftWing.name = 'leftWing';
      bird.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
      rightWing.position.set(0, -0.02, 0);
      rightWing.scale.z = -1;
      rightWing.name = 'rightWing';
      bird.add(rightWing);
    }

    // Choose flight pattern type
    const patternRoll = Math.random();
    let flightPattern;
    if (patternRoll < 0.4) {
      flightPattern = 'horizontal'; // Left to right or right to left
    } else if (patternRoll < 0.7) {
      flightPattern = 'diagonal'; // Diagonal paths (top-left to bottom-right, etc)
    } else {
      flightPattern = 'depth'; // Coming toward camera like clouds
    }

    // Starting position based on pattern
    let startX, startY, startZ;
    let velocityX = 0, velocityY = 0, velocityZ = 0;

    if (flightPattern === 'horizontal') {
      // Horizontal flight - left to right or vice versa
      const fromLeft = Math.random() > 0.5;
      startX = fromLeft ? -15 : 15;
      startY = -3 + Math.random() * 5;
      startZ = zRange.min + Math.random() * (zRange.max - zRange.min);

      velocityX = (fromLeft ? 1 : -1) * (0.03 + Math.random() * 0.03);
      velocityZ = 0.02; // Slight movement toward camera like clouds

    } else if (flightPattern === 'diagonal') {
      // Diagonal flight - various angles
      const diagType = Math.floor(Math.random() * 4);
      if (diagType === 0) {
        // Top-left to bottom-right
        startX = -12;
        startY = 4;
        velocityX = 0.04;
        velocityY = -0.02;
      } else if (diagType === 1) {
        // Top-right to bottom-left
        startX = 12;
        startY = 4;
        velocityX = -0.04;
        velocityY = -0.02;
      } else if (diagType === 2) {
        // Bottom-left to top-right
        startX = -12;
        startY = -4;
        velocityX = 0.04;
        velocityY = 0.015;
      } else {
        // Bottom-right to top-left
        startX = 12;
        startY = -4;
        velocityX = -0.04;
        velocityY = 0.015;
      }
      startZ = zRange.min + Math.random() * (zRange.max - zRange.min);
      velocityZ = 0.02; // Move toward camera

    } else {
      // Depth flight - coming toward camera (like clouds)
      startX = (Math.random() - 0.5) * 15;
      startY = -2 + Math.random() * 4;
      startZ = -40 - Math.random() * 20; // Start far back

      velocityX = (Math.random() - 0.5) * 0.01; // Slight horizontal drift
      velocityY = (Math.random() - 0.5) * 0.005; // Slight vertical drift
      velocityZ = 0.04 + Math.random() * 0.02; // Moving toward camera
    }

    // If randomizing position, place bird somewhere along its path
    if (randomizePosition) {
      const progress = 0.2 + Math.random() * 0.5;
      startX += velocityX * progress * 200;
      startY += velocityY * progress * 200;
      startZ += velocityZ * progress * 200;
    }

    bird.position.set(startX, startY, startZ);

    // Rotate bird to face direction of travel (seen from the side)
    // Calculate angle based on velocity
    const horizontalAngle = Math.atan2(velocityZ, velocityX);
    bird.rotation.y = -horizontalAngle + Math.PI / 2; // Perpendicular to show side view

    // Slight pitch based on vertical movement
    bird.rotation.z = Math.atan2(velocityY, Math.sqrt(velocityX * velocityX + velocityZ * velocityZ)) * 0.5;

    // Apply scale multiplier
    bird.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);

    // Store bird data with unique ID
    const birdId = this.nextBirdId++;
    const speedMultiplier = distanceType === 'close' ? 2.0 : (scaleMultiplier > 1.0 ? 1.5 : 1.0);

    // Create label sprite
    const label = this.createBirdLabel(birdId, distanceType === 'close');
    bird.add(label);

    const birdData = {
      id: birdId,
      mesh: bird,
      label: label,
      velocityX: velocityX * speedMultiplier,
      velocityY: velocityY * speedMultiplier,
      velocityZ: velocityZ * speedMultiplier,
      wingPhase: Math.random() * Math.PI * 2,
      wingSpeed: 8 + Math.random() * 4,
      verticalWobble: Math.random() * 0.002,
      wobblePhase: Math.random() * Math.PI * 2,
      isCloseUp: distanceType === 'close',
      flightPattern: flightPattern,
      spawnTime: Date.now()
    };

    this.scene.add(bird);
    this.birds.push(birdData);

    return birdData;
  }

  update(delta) {
    const currentTime = Date.now();

    // Spawn new birds periodically (even when paused, to build up population)
    if (currentTime - this.lastSpawnTime > this.spawnInterval) {
      const newBird = this.createBird(false, 'random');
      if (newBird) {
        this.lastSpawnTime = currentTime;
        this.spawnInterval = 1500 + Math.random() * 2000; // Faster spawning
      }
    }

    // Occasionally spawn a dramatic close-up bird
    // Also ensure minimum 500ms gap from last regular spawn to prevent overlap
    if (currentTime - this.lastCloseUpTime > this.closeUpInterval &&
        currentTime - this.lastSpawnTime > 500) {
      const newBird = this.createBird(false, 'close');
      if (newBird) {
        this.lastCloseUpTime = currentTime;
        this.closeUpInterval = 12000 + Math.random() * 15000;
        console.log(`Close-up bird fly-by! (Bird #${newBird.id})`);
      }
    }

    // If paused, don't move birds
    if (this.paused) return;

    // Debug logging every few seconds
    if (this.debugMode && this.debugCounter === undefined) this.debugCounter = 0;
    if (this.debugMode) {
      this.debugCounter++;
      if (this.debugCounter % 180 === 0) { // Every ~3 seconds at 60fps
        this.logBirdInfo();
      }
    }

    // Update existing birds
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const birdData = this.birds[i];
      const bird = birdData.mesh;

      // Move bird using 3D velocity
      bird.position.x += birdData.velocityX;
      bird.position.y += birdData.velocityY;
      bird.position.z += birdData.velocityZ;

      // Slight vertical wobble (natural flying motion)
      birdData.wobblePhase += 0.02;
      bird.position.y += Math.sin(birdData.wobblePhase) * birdData.verticalWobble;

      // Scale bird based on Z position (closer = bigger)
      const baseScale = bird.scale.x; // Store original scale
      const zScale = Math.max(0.3, Math.min(3, 1 + (bird.position.z + 20) * 0.05));
      // Only update scale for depth-moving birds
      if (birdData.flightPattern === 'depth') {
        const newScale = baseScale * zScale / (1 + (birdData.velocityZ > 0 ? 20 : -20) * 0.05);
        bird.scale.set(newScale, newScale, newScale);
      }

      // Animate wings
      birdData.wingPhase += delta * birdData.wingSpeed;
      const wingAngle = Math.sin(birdData.wingPhase) * 0.4;

      bird.children.forEach(child => {
        if (child.name === 'leftWing') {
          child.rotation.x = wingAngle;
        } else if (child.name === 'rightWing') {
          child.rotation.x = -wingAngle;
        }
      });

      // Remove birds that have left the visible area
      const shouldRemove =
        bird.position.x > 18 || bird.position.x < -18 || // Left/right bounds
        bird.position.y > 10 || bird.position.y < -10 || // Top/bottom bounds
        bird.position.z > 10; // Passed camera

      if (shouldRemove) {
        this.scene.remove(bird);
        this.birds.splice(i, 1);
      }
    }
  }

  dispose() {
    this.birds.forEach(birdData => {
      this.scene.remove(birdData.mesh);
    });
    this.birds = [];
  }
}
