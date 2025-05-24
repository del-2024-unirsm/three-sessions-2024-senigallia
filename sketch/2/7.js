//DANCING CLOTHES 
//ANGELICA E MEDORO

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, animation, onWindowResize, controls, onMouseMove;
let groundGeom;
let groundMate, clothMaterial, mirrorMate;
let world, groundBody;
let noise3D;
let cloth, cloth2, clothParticles, clothParticles2, constraints = [];
let flowField, flowField2;

export function sketch() {
    let mouse = new THREE.Vector2();
    onMouseMove = (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    const p = {
        // cloth
        clothWidth: 14,
        clothHeight: 14,
        clothResolution: 12,
        clothElasticity: .5,
        // view
        lookAtCenter: new THREE.Vector3(0, 4, 0),
        cameraPosition: new THREE.Vector3(-10, 1, 5),
        autoRotate: true,
        autoRotateSpeed: -1.5 + Math.random() * 3,
        camera: 35,
        // world
        background: new THREE.Color(0x000000),
        clothMass: 1,
        gravity: -.2, //  -Math.random() * .2,
        wind: true,
        windStrength: 1,
        // windStrength2: 0.9 + Math.random() * .2,
        mouse: false,
        floor: 0,
    };

    // other parameters
    let near = 0.2, far = 1000;
    let shadowMapWidth = 2048, shadowMapHeight = 2048;
    let paused = false;

    // CAMERA
    let camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far);
    camera.position.copy(p.cameraPosition);
    camera.lookAt(p.lookAtCenter);

    // WINDOW RESIZE
    onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // SCENE
    scene = new THREE.Scene();
    scene.background = p.background;
    scene.fog = new THREE.Fog(scene.background, 15, 80);
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, p.gravity, 0)
    });
    world.solver.iterations = 20;

    // MATERIALS
    groundMate = new THREE.MeshStandardMaterial({
        color: p.background,
        roughness: 1,
        metalness: 0,
        fog: true,
    });

    // Static ground plane
    groundGeom = new THREE.PlaneGeometry(20, 20);
    let ground = new THREE.Mesh(groundGeom, groundMate);
    ground.position.set(0, p.floor, 0);
    ground.rotation.x = - Math.PI / 2;
    ground.scale.set(100, 100, 100);
    ground.castShadow = false;
    ground.receiveShadow = true;
    scene.add(ground);
    groundBody = new CANNON.Body({
        position: new CANNON.Vec3(0, p.floor + 0.005, 0),
        mass: 0,
        shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.005;
    controls.minDistance = 5;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minPolarAngle = 0;
    controls.autoRotate = p.autoRotate;
    controls.autoRotateSpeed = p.autoRotateSpeed;
    controls.target = p.lookAtCenter;

    // CLOTH
    const cWidth = p.clothWidth;
    const cHeight = p.clothHeight;
    const Nx = p.clothResolution;
    const Ny = p.clothResolution;
    const clothGeometry = new THREE.PlaneGeometry(cWidth, cHeight, Nx, Ny);
    mirrorMate = new THREE.MeshPhongMaterial({
        color: 0x444444,
        envMap: cubeTextures[1].texture,
        side: THREE.DoubleSide,
        flatShading: true,
        reflectivity: 1,
        specular: 0x999999,
        fog: true
    });

    // CLOTH 1
    cloth = new THREE.Mesh(clothGeometry, mirrorMate);
    cloth.castShadow = true;
    // cloth.receiveShadow = true;
    scene.add(cloth);

    const contactResolution = 1
    const cYstarting = p.floor + cHeight / 2 // + Math.random() * cHeight / 2;
    const restDistanceX = cWidth / Nx;
    const restDistanceY = cHeight / Ny;
    clothParticles = [];
    const mass = (p.clothMass / Nx) * Ny;
    const particleRadius = restDistanceX * 0.5; // Radius for collision spheres


    // XXXX

    const connectParticles = (particles, x1, y1, x2, y2) => {
        const particleA = particles[x1][y1];
        const particleB = particles[x2][y2];
        const distance = particleA.position.distanceTo(particleB.position);
        const constraint = new CANNON.DistanceConstraint(particleA, particleB, distance, p.clothElasticity);
        world.addConstraint(constraint);
        constraints.push(constraint);
    };

    for (let x = 0; x <= Nx; x++) {
        clothParticles.push([]);
        for (let y = 0; y <= Ny; y++) {
            const hangingPosition = new CANNON.Vec3(
                (x - Nx * 0.5) * restDistanceX,
                cYstarting,
                (y - Ny * 0.5) * restDistanceY
            );

            let particleShape;
            if (x % contactResolution === 0 && y % contactResolution === 0) {
                particleShape = new CANNON.Sphere(particleRadius);
            } else {
                particleShape = new CANNON.Particle();
            }
            const particle = new CANNON.Body({
                mass: mass,
                position: hangingPosition,
                shape: particleShape,
                velocity: new CANNON.Vec3(0, 0, 0),
                linearDamping: 0.5,
                material: clothMaterial
            });

            particle.collisionFilterGroup = 1 | 2;
            particle.collisionFilterMask = 1 | 2;

            clothParticles[x].push(particle);
            world.addBody(particle);
        }
    }
    // Constrains cloth 1
    for (let x = 0; x <= Nx; x++) {
        for (let y = 0; y <= Ny; y++) {
            if (x < Nx && y < Ny) {
                connectParticles(clothParticles, x, y, x, y + 1);
                connectParticles(clothParticles, x, y, x + 1, y);
                connectParticles(clothParticles, x, y, x + 1, y + 1);
                if (y > 0) {
                    connectParticles(clothParticles, x, y, x + 1, y - 1);
                }
            } else if (x === Nx && y < Ny) {
                connectParticles(clothParticles, x, y, x, y + 1);
            } else if (x < Nx && y === Ny) {
                connectParticles(clothParticles, x, y, x + 1, y);
            }
        }
    }
    // Initialize the vertices of cloth 1
    const vertices = [];
    for (let x = 0; x <= Nx; x++) {
        for (let y = 0; y <= Ny; y++) {
            vertices.push(new THREE.Vector3());
        }
    }
    clothGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices.length * 3), 3));

    // CLOTH 2
    const clothGeometry2 = new THREE.PlaneGeometry(cWidth, cHeight, Nx, Ny);
    cloth2 = new THREE.Mesh(clothGeometry2, mirrorMate);
    cloth2.castShadow = true;
    // cloth2.receiveShadow = true;
    scene.add(cloth2);

    const cYstarting2 = cYstarting + 3; // Posizione diversa per il secondo telo
    clothParticles2 = [];

    for (let x = 0; x <= Nx; x++) {
        clothParticles2.push([]);
        for (let y = 0; y <= Ny; y++) {
            const hangingPosition = new CANNON.Vec3(
                (x - Nx * 0.5) * restDistanceX,
                cYstarting2,
                (y - Ny * 0.5) * restDistanceY
            );

            let particleShape;
            if (x % contactResolution === 0 && y % contactResolution === 0) {
                particleShape = new CANNON.Sphere(particleRadius);
            } else {
                particleShape = new CANNON.Particle();
            }
            const particle = new CANNON.Body({
                mass: mass,
                position: hangingPosition,
                shape: particleShape,
                velocity: new CANNON.Vec3(0, 0, 0),
                linearDamping: 0.5,
                material: clothMaterial
            });
            particle.collisionFilterGroup = 1 | 2;
            particle.collisionFilterMask = 1 | 2;

            clothParticles2[x].push(particle);
            world.addBody(particle);
        }
    }
    // Constrains cloth 2 
    for (let x = 0; x <= Nx; x++) {
        for (let y = 0; y <= Ny; y++) {
            if (x < Nx && y < Ny) {
                connectParticles(clothParticles2, x, y, x, y + 1);
                connectParticles(clothParticles2, x, y, x + 1, y);
                connectParticles(clothParticles2, x, y, x + 1, y + 1);
                if (y > 0) {
                    connectParticles(clothParticles2, x, y, x + 1, y - 1);
                }
            } else if (x === Nx && y < Ny) {
                connectParticles(clothParticles2, x, y, x, y + 1);
            } else if (x < Nx && y === Ny) {
                connectParticles(clothParticles2, x, y, x + 1, y);
            }
        }
    }
    // Initialize the vertices of cloth 2
    const vertices2 = [];
    for (let x = 0; x <= Nx; x++) {
        for (let y = 0; y <= Ny; y++) {
            vertices2.push(new THREE.Vector3());
        }
    }
    clothGeometry2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices2.length * 3), 3));

    // LIGHTS
    const light = new THREE.PointLight(0xffffff, 4 * PI);
    light.position.set(0, 45, 0);
    // light.target.position.set(0, 2, 0);
    light.castShadow = true;
    light.shadow.radius = 8;
    light.shadow.camera.near = .1;
    light.shadow.camera.far = 200;
    light.shadow.bias = 0.0001;
    light.shadow.mapSize.width = shadowMapWidth;
    light.shadow.mapSize.height = shadowMapHeight;
    light.decay = 0;
    scene.add(light);

    const lightD = new THREE.DirectionalLight(0xffffff, 10 * PI);
    lightD.position.set(0, 2, 0);
    lightD.target.position.set(0, 8, 0);
    lightD.decay = 0
    scene.add(lightD);
    const lightHelperD = new THREE.DirectionalLightHelper(lightD, 5);

    // NOISE
    noise3D = NOISE.createNoise3D();
    let t0 = Math.random() * 10;

    // FLOWFIELD 
    const flowFieldSize = 32;
    flowField = createFlowField(flowFieldSize, 0, p.windStrength);
    // flowField2 = createFlowField(flowFieldSize, 0, p.windStrength2);

    function createFlowField(size, offsetSpeed, windStrength) {
        const flowField = [];
        const noiseFreq = 0.05;

        for (let y = 0; y < size; y++) {
            const row = [];
            for (let x = 0; x < size; x++) {
                const noiseX = noise3D(x * noiseFreq, offsetSpeed, y * noiseFreq);
                const noiseY = noise3D(x * noiseFreq, y * noiseFreq, offsetSpeed);

                if (p.mouse) {
                    const windDirection = new THREE.Vector3(-mouse.x, -mouse.y, 0).normalize();
                    const windIntensity = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
                    const vector = new THREE.Vector3(-mouse.x + noiseX, mouse.y + noiseY, 0).normalize().multiplyScalar(windStrength + windIntensity * 2);
                    row.push(vector);
                } else {
                    const vector = new THREE.Vector3(noiseX * .1, noiseY, 0).normalize().multiplyScalar(windStrength);
                    row.push(vector);
                }
            }
            flowField.push(row);
        }

        return flowField;
    }

    // ANIMATE
    const timeStep = 1 / 60;
    const stepsPerFrame = 2;
    let lastCallTime;

    // Start simulation from a certain time
    // Applica le forze del vento alle particelle del cloth durante l'inizializzazione
    for (let i = 0; i < 50 + Math.floor(Math.random() * 100); i++) {
        for (let x = 0; x <= Nx; x++) {
            for (let y = 0; y <= Ny; y++) {
                const particle = clothParticles[x][y];
                const particle2 = clothParticles2[x][y];

                let gridX = Math.floor((particle.position.x + cWidth / 2) / cWidth * flowFieldSize);
                let gridY = Math.floor((particle.position.z + cHeight / 2) / cHeight * flowFieldSize);
                // let gridX2 = Math.floor((particle2.position.x + cWidth / 2) / cWidth * flowFieldSize);
                // let gridY2 = Math.floor((particle2.position.z + cHeight / 2) / cHeight * flowFieldSize);

                gridX = Math.max(0, Math.min(flowFieldSize - 1, gridX));
                gridY = Math.max(0, Math.min(flowFieldSize - 1, gridY));
                // gridX2 = Math.max(0, Math.min(flowFieldSize - 1, gridX2));
                // gridY2 = Math.max(0, Math.min(flowFieldSize - 1, gridY2));

                const windForce = flowField[gridY][gridX].clone();
                const windForce2 = flowField[gridX][gridY].clone();

                particle.applyForce(windForce);
                particle2.applyForce(windForce2);
            }
        }
        world.step(timeStep);
    }

    const animate = () => {
        if (showStats) stats.begin();

        // ANIMATION
        if (!paused) {
            const t = performance.now() / 1000;

            if (!lastCallTime) {
                for (let i = 0; i < stepsPerFrame; i++) {
                    world.step(timeStep);
                }
            } else {
                const dt = t - lastCallTime;
                const numSteps = Math.ceil(dt / timeStep);
                for (let i = 0; i < numSteps; i++) {
                    world.step(timeStep);
                }
            }
            lastCallTime = t;

            // CANNON SIMULATION

            if (p.wind) {
                const t1 = t * 1.0; //speed
                // Aggiorna il flowfield
                flowField = createFlowField(flowFieldSize, t1 * 0.1, p.windStrength);
                // flowField2 = createFlowField(flowFieldSize, t1 * 0.1, p.windStrength2);

                for (let x = 0; x <= Nx; x++) {
                    for (let y = 0; y <= Ny; y++) {
                        const particle = clothParticles[x][y];
                        const particle2 = clothParticles2[x][y];

                        // Ottieni il vettore del flusso dalla griglia del flowfield
                        let gridX = Math.floor((particle.position.x + cWidth / 2) / cWidth * flowFieldSize);
                        let gridY = Math.floor((particle.position.z + cHeight / 2) / cHeight * flowFieldSize);
                        // let gridX2 = Math.floor((particle2.position.x + cWidth / 2) / cWidth * flowFieldSize);
                        // let gridY2 = Math.floor((particle2.position.z + cHeight / 2) / cHeight * flowFieldSize);

                        // Confinare gridX e gridY nei limiti dell'array flowField
                        gridX = Math.max(0, Math.min(flowFieldSize - 1, gridX));
                        gridY = Math.max(0, Math.min(flowFieldSize - 1, gridY));
                        // gridX2 = Math.max(0, Math.min(flowFieldSize - 1, gridX2));
                        // gridY2 = Math.max(0, Math.min(flowFieldSize - 1, gridY2));
                        const windForce = flowField[gridY][gridX].clone();
                        const windForce2 = flowField[gridX][gridY].clone();

                        particle.applyForce(windForce);
                        particle2.applyForce(windForce2);
                    }
                }
            }

            const positions = cloth.geometry.attributes.position.array;
            const positions2 = cloth2.geometry.attributes.position.array;
            for (let x = 0; x <= Nx; x++) {
                for (let y = 0; y <= Ny; y++) {
                    const particle = clothParticles[x][y];
                    const particle2 = clothParticles2[x][y];
                    const index = (x * (Nx + 1) + y) * 3;
                    const index2 = (x * (Nx + 1) + y) * 3;
                    positions[index] = particle.position.x;
                    positions[index + 1] = particle.position.y;
                    positions[index + 2] = particle.position.z;
                    positions2[index2] = particle2.position.x;
                    positions2[index2 + 1] = particle2.position.y;
                    positions2[index2 + 2] = particle2.position.z;
                }
            }
            cloth.geometry.attributes.position.needsUpdate = true;
            cloth2.geometry.attributes.position.needsUpdate = true;
        }

        controls.update();
        renderer.render(scene, camera);
        if (showStats) stats.end();

        animation = requestAnimationFrame(animate);
    };
    animate();
}

export function dispose() {
    cancelAnimationFrame(animation);
    scene.remove(cloth);
    scene.remove(cloth2);
    clothParticles?.forEach((row) => {
        row?.forEach((particle) => {
            world?.removeBody(particle);
        });
    });
    clothParticles2?.forEach((row) => {
        row?.forEach((particle) => {
            world?.removeBody(particle);
        });
    });
    clothParticles = null;
    clothParticles2 = null;
    constraints?.forEach((constraint) => {
        world?.removeConstraint(constraint);
    });
    world?.removeBody(groundBody);
    controls?.dispose();
    clothMaterial?.dispose();
    mirrorMate?.dispose();
    groundGeom?.dispose();
    groundMate?.dispose();
    world = null;
    noise3D = null;
    flowField = null;
    window?.removeEventListener('resize', onWindowResize);
    window?.removeEventListener('mousemove', onMouseMove);
}
