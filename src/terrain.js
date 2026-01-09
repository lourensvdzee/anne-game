import * as THREE from 'three';

export class TerrainSystem {
  constructor(scene) {
    this.scene = scene;
    this.terrainChunks = [];
    this.chunkSize = 80; // Size of each terrain chunk (larger)
    this.numChunks = 8; // More chunks for smoother scrolling
    this.terrainSpeed = 0.05; // Slower for height illusion
    this.terrainY = -25; // Raised up so colors are more visible
    this.terrainZ = -200; // Starting Z position (further back)
    this.terrainWidth = 400; // 400 units wide as requested

    this.initializeTerrain();
  }

  initializeTerrain() {
    // Create initial terrain chunks spread out behind camera
    for (let i = 0; i < this.numChunks; i++) {
      this.createTerrainChunk(this.terrainZ - i * this.chunkSize);
    }
  }

  createTerrainChunk(zPosition) {
    const chunk = new THREE.Group();

    // Create base terrain plane with gentle hills - VERY WIDE
    const terrainGeometry = new THREE.PlaneGeometry(
      this.terrainWidth, // Very wide to fill entire view
      this.chunkSize,
      48, // More segments for smoother deformation
      24
    );

    // Deform vertices to create gentle rolling hills
    const positions = terrainGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      // Create varied hills using multiple sine waves - smaller scale for "from high up" look
      const height =
        Math.sin(x * 0.05 + zPosition * 0.03) * 1.5 +
        Math.sin(x * 0.02 + zPosition * 0.05) * 2 +
        Math.sin(y * 0.08) * 1 +
        Math.random() * 0.3; // Small random variation
      positions.setZ(i, height);
    }
    terrainGeometry.computeVertexNormals();

    // Earth-tone gradient material
    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x5d8a4c, // Green-brown grass color
      roughness: 0.9,
      metalness: 0.0,
      flatShading: true,
      side: THREE.DoubleSide
    });

    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2; // Lay flat
    terrain.position.set(0, 0, 0);
    chunk.add(terrain);

    // Add some simple trees/vegetation
    this.addVegetation(chunk, zPosition);

    // Position the chunk
    chunk.position.set(0, this.terrainY, zPosition);

    this.scene.add(chunk);
    this.terrainChunks.push({
      mesh: chunk,
      zPosition: zPosition
    });
  }

  addVegetation(chunk, baseZ) {
    // Add simple stylized trees - more spread out across wide terrain
    const numTrees = 15 + Math.floor(Math.random() * 10);

    for (let i = 0; i < numTrees; i++) {
      const tree = this.createTree();
      tree.position.set(
        (Math.random() - 0.5) * this.terrainWidth * 0.8, // X spread across wide terrain
        0, // On ground
        (Math.random() - 0.5) * this.chunkSize * 0.8 // Z spread within chunk
      );
      // Random scale - larger trees since we're high up
      const scale = 1.0 + Math.random() * 1.5;
      tree.scale.set(scale, scale, scale);
      chunk.add(tree);
    }

    // Add some rocks - more spread out
    const numRocks = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < numRocks; i++) {
      const rock = this.createRock();
      rock.position.set(
        (Math.random() - 0.5) * this.terrainWidth * 0.8,
        0,
        (Math.random() - 0.5) * this.chunkSize * 0.8
      );
      // Larger rocks since we're high up
      const scale = 0.8 + Math.random() * 1.2;
      rock.scale.set(scale, scale * 0.7, scale);
      chunk.add(rock);
    }

    // Add many field patches (darker/lighter areas) for variety from high altitude
    const numPatches = 12 + Math.floor(Math.random() * 8);
    for (let i = 0; i < numPatches; i++) {
      const patch = this.createFieldPatch();
      patch.position.set(
        (Math.random() - 0.5) * this.terrainWidth * 0.9,
        0.2, // Slightly above ground
        (Math.random() - 0.5) * this.chunkSize * 0.8
      );
      chunk.add(patch);
    }

    // Add some larger "forest" patches
    const numForests = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numForests; i++) {
      const forest = this.createForestPatch();
      forest.position.set(
        (Math.random() - 0.5) * this.terrainWidth * 0.85,
        0.15,
        (Math.random() - 0.5) * this.chunkSize * 0.7
      );
      chunk.add(forest);
    }
  }

  createFieldPatch() {
    // Create a flat colored patch to simulate fields seen from above - LARGER
    const size = 15 + Math.random() * 30;
    const patchGeometry = new THREE.PlaneGeometry(size, size * (0.4 + Math.random() * 0.6));

    // Varied field colors - more saturated
    const fieldColors = [
      0x3d6b32, // Darker green
      0x8fa84e, // Yellow-green (wheat)
      0xa67c52, // Brown (plowed)
      0x5a8a4c, // Medium green
      0xc4a35a, // Golden (harvested)
      0x4a9e3a, // Bright green
    ];
    const color = fieldColors[Math.floor(Math.random() * fieldColors.length)];

    const patchMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    const patch = new THREE.Mesh(patchGeometry, patchMaterial);
    patch.rotation.x = -Math.PI / 2; // Lay flat
    patch.rotation.z = Math.random() * Math.PI; // Random rotation

    return patch;
  }

  createForestPatch() {
    // Dark green irregular forest patch
    const size = 20 + Math.random() * 40;
    const patchGeometry = new THREE.CircleGeometry(size / 2, 8 + Math.floor(Math.random() * 4));

    const patchMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a4d1a, // Dark forest green
      roughness: 1.0,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    const patch = new THREE.Mesh(patchGeometry, patchMaterial);
    patch.rotation.x = -Math.PI / 2; // Lay flat
    patch.scale.set(1, 0.6 + Math.random() * 0.4, 1); // Slightly elongated

    return patch;
  }

  createTree() {
    const tree = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 6);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c4033, // Brown
      roughness: 0.9,
      flatShading: true
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    tree.add(trunk);

    // Foliage (cone shape for stylized look)
    const foliageGeometry = new THREE.ConeGeometry(1.2, 3, 6);
    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5a27, // Dark green
      roughness: 0.8,
      flatShading: true
    });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 3;
    tree.add(foliage);

    // Second tier of foliage
    const foliage2Geometry = new THREE.ConeGeometry(0.8, 2, 6);
    const foliage2 = new THREE.Mesh(foliage2Geometry, foliageMaterial);
    foliage2.position.y = 4.5;
    tree.add(foliage2);

    return tree;
  }

  createRock() {
    // Low-poly rock using dodecahedron
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080, // Grey
      roughness: 0.9,
      flatShading: true
    });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);

    // Random rotation for variety
    rock.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    return rock;
  }

  update(delta) {
    // Move all terrain chunks toward camera
    for (let i = this.terrainChunks.length - 1; i >= 0; i--) {
      const chunkData = this.terrainChunks[i];
      const chunk = chunkData.mesh;

      // Move chunk forward (toward camera)
      chunk.position.z += this.terrainSpeed;

      // If chunk has passed camera, recycle it to the back
      if (chunk.position.z > 20) {
        // Find the furthest back chunk
        let furthestZ = this.terrainZ;
        this.terrainChunks.forEach(c => {
          if (c.mesh.position.z < furthestZ) {
            furthestZ = c.mesh.position.z;
          }
        });

        // Remove old chunk
        this.scene.remove(chunk);
        this.terrainChunks.splice(i, 1);

        // Create new chunk at the back
        this.createTerrainChunk(furthestZ - this.chunkSize);
      }
    }
  }

  dispose() {
    this.terrainChunks.forEach(chunkData => {
      this.scene.remove(chunkData.mesh);
    });
    this.terrainChunks = [];
  }
}
