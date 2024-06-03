//TEST CLOTH 8 VERTICES AND ROTATION

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, animation, onWindowResize, controls, onMouseMove
let groundGeom
let groundMate, clothMaterial, mirrorMate
let world
let noise3D
let cloth, clothParticles, constraints = []
let flowField

export function sketch() {

    let mouse = new THREE.Vector2()
    onMouseMove = (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    };
    window.addEventListener('mousemove', onMouseMove);

    const p = {
        // cloth
        clothWidth: 10,
        clothHeight: 10,
        clothResolution: 22,
        // view
        lookAtCenter: new THREE.Vector3(0, 5, 3),
        cameraPosition: new THREE.Vector3(0, 1, - 7 - Math.random() * 25),
        autoRotate: false,
        autoRotateSpeed: -1 + Math.random() * 2,
        camera: 35,
        // world
        background: new THREE.Color(0x000000),
        clothMass: 1,
        gravity: (0, -18, 0),
        wind: true,
        windStrength: 2 + Math.random() * 8,
        floor: -2,
    };

    // other parameters
    let near = 0.2, far = 1000;
    let shadowMapWidth = 2048, shadowMapHeight = 2048;
    let paused = false;

    // CAMERA
    let camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far)
    camera.position.copy(p.cameraPosition)
    camera.lookAt(p.lookAtCenter)

    // WINDOW RESIZE
    onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // SCENE
    scene = new THREE.Scene()
    scene.background = p.background
    scene.fog = new THREE.Fog(scene.background, 15, 80)
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, p.gravity, 0)
    });
    world.solver.iterations = 10

    // MATERIALS
    groundMate = new THREE.MeshStandardMaterial({
        color: p.background,
        roughness: 1,
        metalness: 0,
        fog: true,
    })

    // Static ground plane
    groundGeom = new THREE.PlaneGeometry(20, 20)
    let ground = new THREE.Mesh(groundGeom, groundMate)
    ground.position.set(0, p.floor, 0)
    ground.rotation.x = - Math.PI / 2
    ground.scale.set(100, 100, 100)
    ground.castShadow = false
    ground.receiveShadow = true
    scene.add(ground)
    const groundBody = new CANNON.Body({
        position: new CANNON.Vec3(0, p.floor - 1, 0),
        mass: 0,
        shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);
    ground.position.copy(groundBody.position);
    ground.quaternion.copy(groundBody.quaternion);

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI / 2 + 0.2;
    controls.minPolarAngle = Math.PI / 2 - 0.4;
    controls.autoRotate = p.autoRotate;
    controls.autoRotateSpeed = p.autoRotateSpeed;
    controls.target = p.lookAtCenter;

    // CLOTH
    const cWidth = p.clothWidth
    const cHeight = p.clothHeight
    const Nx = p.clothResolution
    const Ny = p.clothResolution
    const clothGeometry = new THREE.PlaneGeometry(cWidth, cHeight, Nx, Ny)
    mirrorMate = new THREE.MeshPhongMaterial({
        color: 0x444444,
        envMap: cubeTextures[0].texture,
        side: THREE.DoubleSide,
        flatShading: true,
        // combine: THREE.addOperation,
        // reflectivity: 0,
        // specular: 0x999999,
        // fog: true
    })

    cloth = new THREE.Mesh(clothGeometry, mirrorMate)
    cloth.castShadow = true
    // cloth.receiveShadow = true
    scene.add(cloth)

    const restDistanceX = cWidth / Nx
    const restDistanceY = cHeight / Ny
    clothParticles = []
    const mass = (p.clothMass / Nx) * Ny

    const connectParticles = (x1, y1, x2, y2) => {
        const particleA = clothParticles[x1][y1];
        const particleB = clothParticles[x2][y2];
        const distance = particleA.position.distanceTo(particleB.position);
        const constraint = new CANNON.DistanceConstraint(particleA, particleB, distance);
        world.addConstraint(constraint);
        constraints.push(constraint);
    }

    for (let x = 0; x <= Nx; x++) {
        clothParticles.push([])
        for (let y = 0; y <= Ny; y++) {

            const hangingPosition = new CANNON.Vec3(
                (x - Nx * 0.5) * restDistanceX,
                p.floor + cHeight + 4,
                (y - Ny * 0.5) * restDistanceY
            )

            const particle = new CANNON.Body({
                mass: mass,
                // mass: y === Ny ? 0 : mass, // line
                // mass: y >= Ny - 2 && x >= Nx - 2 || y >= Ny - 2 && x <= 2 ? 0 : mass, // arms
                // mass: y >= Ny - 2 && x >= Nx - 1 || y >= Ny - 2 && x <= 1 || y <= 2 && x <= 1 || y <= 2 && x >= Nx - 1 ? 0 : mass, // 4 arms
                position: hangingPosition,
                shape: new CANNON.Particle(),
                velocity: new CANNON.Vec3(0, 0, 0),
                linearDamping: 0.5
            });

            clothParticles[x].push(particle);
            world.addBody(particle);
        }
    }

    // Constrains
    for (let x = 0; x <= Nx; x++) {
        for (let y = 0; y <= Ny; y++) {
            if (x < Nx && y < Ny) {
                connectParticles(x, y, x, y + 1);
                connectParticles(x, y, x + 1, y);
            } else if (x === Nx && y < Ny) {
                connectParticles(x, y, x, y + 1);
            } else if (x < Nx && y === Ny) {
                connectParticles(x, y, x + 1, y);
            }
        }
    }

    // Aggiungi le corde elastiche
    const anchorDistance = 9;
    const anchorPoints = [
        // Angoli superiori
        new CANNON.Vec3(cWidth / 2 + 5, p.floor + cHeight + 6 + anchorDistance, cHeight / 2 - 7),
        new CANNON.Vec3(-cWidth / 2 - 5, p.floor + cHeight + 6 + anchorDistance, cHeight / 2 - 7),
        // Angoli inferiori
        new CANNON.Vec3(cWidth / 2 + 5, p.floor + 1, cHeight / 2 - 10),
        new CANNON.Vec3(-cWidth / 2 - 5, p.floor + 1, cHeight / 2 - 10),
        // Vertice a metà altezza su laterale 1
        new CANNON.Vec3(cWidth / 2 + 10, cHeight / 2, cHeight / 2 - 1),
        // Vertice a metà altezza su laterale 2
        new CANNON.Vec3(-cWidth / 2 - 10, cHeight / 2, cHeight / 2 -1),
        // Vertice a metà larghezza sotto
        new CANNON.Vec3(cWidth / 2, p.floor - 1, cHeight / 2 ),
        // Vertice a metà larghezza sopra
        new CANNON.Vec3(cWidth / 2, p.floor + cHeight + 7 + anchorDistance, cHeight / 2),
    
    ];

    const anchorBodies = [];
    anchorPoints.forEach((point) => {
        const anchorBody = new CANNON.Body({
            mass: 0,
            position: point,
            shape: new CANNON.Particle(),
        });
        anchorBodies.push(anchorBody);
        world.addBody(anchorBody);
    });


    //in questo blocco ho aggiunto i nuovi 4 vetrici con le coordinate
    const cornerParticles = [
        // Angoli superiori
        clothParticles[Nx][Ny],
        clothParticles[0][Ny],
        // Angoli inferiori
        clothParticles[Nx][0],
        clothParticles[0][0],
        // Metà a sx
        clothParticles[Nx][Ny/2],
        // Lato a dx
        clothParticles[0][Ny/2],
        // Metà orizzontale sotto
        clothParticles[Nx/2][0],
        // Metà orizzontale sopra
        clothParticles[Nx/2][Ny]
       
    
    ];

    cornerParticles.forEach((particle, index) => {
        const anchorBody = anchorBodies[index];
        const constraint = new CANNON.DistanceConstraint(particle, anchorBody, anchorDistance);
        world.addConstraint(constraint);
        constraints.push(constraint);
    });

    // Calcola il punto mediano tra i due anchorPoints superiori e inferiori e centrali
    const midpointTop = new CANNON.Vec3(
        (anchorPoints[0].x + anchorPoints[1].x) / 2,
        (anchorPoints[0].y + anchorPoints[1].y) / 2,
        (anchorPoints[0].z + anchorPoints[1].z) / 2
    );
    const midpointBottom = new CANNON.Vec3(
        (anchorPoints[2].x + anchorPoints[3].x) / 2,
        (anchorPoints[2].y + anchorPoints[3].y) / 2,
        (anchorPoints[2].z + anchorPoints[3].z) / 2
    );

       /* I due blocchi precedenti sono quelli impostati da Vale
       io ho aggiunto questi sotto per definire la rotazione intorno ai punti posizionati sul lati verticali (4 e 5)
       la dicitura  midpoint "centre" l'ho inventata io, è corretta?
       non ho aggiunto lo stesso blocchetto per i punti 6 e 7 che sarebbero quelli sui
       due lati orizzonatali eppure non cambia nulla, perchè?? */

    const midpointCentre = new CANNON.Vec3(
        (anchorPoints[4].x + anchorPoints[5].x) / 2,
        (anchorPoints[4].y + anchorPoints[5].y) / 2,
        (anchorPoints[4].z + anchorPoints[5].z) / 2
    
    );


     

    // Initialize the vertices of the cloth
    const vertices = [];
    for (let x = 0; x <= Nx; x++) {
        for (let y = 0; y <= Ny; y++) {
            vertices.push(new THREE.Vector3());
        }
    }
    clothGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices.length * 3), 3));

    const light = new THREE.DirectionalLight(0xffffff, 7)
    light.position.set(0, 10, -5)
    light.target.position.set(0, 2, 10)
    light.castShadow = true
    light.shadow.radius = 16
    light.shadow.camera.near = 2
    light.shadow.camera.far = 200
    light.shadow.bias = 0.0001
    light.shadow.mapSize.width = shadowMapWidth
    light.shadow.mapSize.height = shadowMapHeight
    scene.add(light)
    const lightHelper = new THREE.DirectionalLightHelper(light, 5);
    // scene.add(lightHelper);

    const lightD = new THREE.DirectionalLight(0xffffff, 3)
    lightD.position.set(2, 0, -5)
    lightD.target.position.set(0, 2, 10)
    scene.add(lightD)

    const ambientLight = new THREE.AmbientLight(0xffffff)
    scene.add(ambientLight)

    // NOISE
    noise3D = NOISE.createNoise3D()
    let t0 = Math.random() * 10

    // Flowfield per il vento
    const flowFieldSize = 32 // Dimensione della griglia del flowfield
    flowField = createFlowField(flowFieldSize, 0) // Inizializzazione del flowfield
    function createFlowField(size, offsetSpeed) {
        const flowField = []
        const noiseFreq = 0.1 // Frequenza del rumore per il flowfield

        for (let y = 0; y < size; y++) {
            const row = []
            for (let x = 0; x < size; x++) {
                const noiseX = noise3D(x * noiseFreq, offsetSpeed, y * noiseFreq);
                const noiseY = noise3D(x * noiseFreq, y * noiseFreq, offsetSpeed);

                const windDirection = new THREE.Vector3(- mouse.x, - mouse.y, 0).normalize();
                const windIntensity = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
                // const vector = windDirection.multiplyScalar(windIntensity * p.windStrength);
                const vector = new THREE.Vector3(-mouse.x + noiseX, 0, -mouse.y + noiseY).normalize().multiplyScalar(p.windStrength + windIntensity * 2);

                row.push(vector);
            }
            flowField.push(row);
        }

        return flowField;
    }


    // ANIMATE
    const timeStep = 1 / 60
    const stepsPerFrame = 2
    let lastCallTime

    const animate = () => {
        if (showStats) stats.begin();

        // ANIMATION
        if (!paused) {

            const t = performance.now() / 1000

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
            lastCallTime = t

            // CANNON SIMULATION

            if (p.wind) {
                const t1 = t * 1.0 // speed
                // Aggiorna il flowfield
                flowField = createFlowField(flowFieldSize, t1 * 0.1); // Regola la velocità di animazione del flowfield

                for (let x = 0; x <= Nx; x++) {
                    for (let y = 0; y <= Ny; y++) {
                        const particle = clothParticles[x][y];

                        // Ottieni il vettore del flusso dalla griglia del flowfield
                        let gridX = Math.floor((particle.position.x + cWidth / 2) / cWidth * flowFieldSize)
                        let gridY = Math.floor((particle.position.z + cHeight / 2) / cHeight * flowFieldSize)

                        // Confinare gridX e gridY nei limiti dell'array flowField
                        gridX = Math.max(0, Math.min(flowFieldSize - 1, gridX))
                        gridY = Math.max(0, Math.min(flowFieldSize - 1, gridY))
                        const windForce = flowField[gridY][gridX].clone()

                        particle.applyForce(windForce);
                    }
                }
            }

            

            // Calcola le nuove posizioni degli anchorBodies per il movimento circolare
            const radius = 8; // Raggio del cerchio
            const speed = 1.1; // Velocità di rotazione


            

            anchorBodies[0].position.set(
                midpointTop.x + radius * Math.cos(speed * t),
                midpointTop.y,
                midpointTop.z + radius * Math.sin(speed * t)
            );

            anchorBodies[1].position.set(
                midpointTop.x + radius * Math.cos(speed * t + Math.PI),
                midpointTop.y,
                midpointTop.z + radius * Math.sin(speed * t + Math.PI)
            );

            anchorBodies[2].position.set(
                midpointBottom.x + radius * Math.cos(speed * t),
                midpointBottom.y,
                midpointBottom.z + radius * Math.sin(speed * t)
            );

            anchorBodies[3].position.set(
                midpointBottom.x + radius * Math.cos(speed * t + Math.PI),
                midpointBottom.y,
                midpointBottom.z + radius * Math.sin(speed * t + Math.PI)
            );

            anchorBodies[4].position.set(
                midpointCentre.x,
                midpointCentre.y,
                midpointCentre.z
            );

            anchorBodies[5].position.set(
                midpointCentre.x + radius * Math.cos(speed * t + Math.PI),
                midpointCentre.y,
                midpointCentre.z + radius * Math.sin(speed * t + Math.PI)
            ); 

            const positions = cloth.geometry.attributes.position.array;
            for (let x = 0; x <= Nx; x++) {
                for (let y = 0; y <= Ny; y++) {
                    const particle = clothParticles[x][y]
                    const index = (x * (Nx + 1) + y) * 3
                    positions[index] = particle.position.x
                    positions[index + 1] = particle.position.y
                    positions[index + 2] = particle.position.z 
                } 
            }
            cloth.geometry.attributes.position.needsUpdate = true
        }

        controls.update()
        renderer.render(scene, camera)
        if (showStats) stats.end()

        animation = requestAnimationFrame(animate)
    };
    animate()
}

export function dispose() {
    cancelAnimationFrame(animation)
    controls?.dispose()
    clothMaterial?.dispose()
    mirrorMate?.dispose()
    groundGeom?.dispose()
    groundMate?.dispose()
    world = null
    noise3D = null
    flowField = null
    window?.removeEventListener('resize', onWindowResize)
    window?.removeEventListener('mousemove', onMouseMove)
}