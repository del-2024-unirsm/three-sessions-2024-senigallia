//TEST CLOTH + MIRRORS > ORLANDO RECUPERA IL SENNO

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

let scene, animation, onWindowResize, controls, onMouseMove
let groundGeom
let groundMate, clothMaterial, mirrorMate, mirrorMate2
let world
let noise3D
let cloth, clothParticles, constraints = []
let flowField

//aggiunta specchi
let mirrorBack; // reflector
let mirrorBack2; // reflector
let mirrorBack3; // reflector
let reflectorBackGeom, reflectorBackGeom2, reflectorBackGeom3


export function sketch() {

    let mouse = new THREE.Vector2()
    onMouseMove = (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    };
    window.addEventListener('mousemove', onMouseMove);

    const p = {
        // cloth
        clothWidth: 15,
        clothHeight: 15,
        clothResolution: 22,
        // view
        lookAtCenter: new THREE.Vector3(0, 5, 3),
        cameraPosition: new THREE.Vector3(0, 1, - 25 - Math.random() * 10),
        autoRotate: false,
        autoRotateSpeed: -1 + Math.random() * 2,
        camera: 35,
        // world
        background: new THREE.Color(0x000000),
        clothMass: 1,
        gravity: -9,
        wind: true,
        windStrength: 2 + Math.random() * 1,
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
    scene.fog = new THREE.Fog(scene.background, 20, 100)
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

    // REFLECTOR 1
    let mirrorW = 5;
    let mirrorH = 15;

    mirrorBack = new Reflector(
        new THREE.PlaneGeometry(mirrorW, mirrorH),
        {
            clipBias: 0.003,
            color: new THREE.Color(0x7f7f7f),
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
        });
    mirrorBack.position.y = p.floor + mirrorH / 2 - 2;
    mirrorBack.position.z = 15;
    mirrorBack.rotation.y = Math.PI;
    scene.add(mirrorBack);
    // let's make the mirror backside to do a shadow
    reflectorBackGeom = new THREE.PlaneGeometry(mirrorW, mirrorH)
    let reflectorBack = new THREE.Mesh(reflectorBackGeom, mirrorMate)
    reflectorBack.position.y = mirrorBack.position.y
    reflectorBack.position.z = mirrorBack.position.z + 0.08
    reflectorBack.rotation.y = mirrorBack.rotation.y
    reflectorBack.castShadow = true
    scene.add(reflectorBack)
    // let's make some light below the mirror...
    RectAreaLightUniformsLib.init();
    let rectLightIntensity = 100
    const rectLight = new THREE.RectAreaLight(0xffffff, rectLightIntensity, mirrorW, mirrorH)
    rectLight.position.set(0, mirrorBack.position.y, mirrorBack.position.z + 0.01)
    scene.add(rectLight)
    const rectLightHelper = new RectAreaLightHelper(rectLight)
    // rectLight.add(rectLightHelper)

    // REFLECTOR 2
    mirrorBack2 = new Reflector(
        new THREE.PlaneGeometry(mirrorW, mirrorH),
        {
            clipBias: 0.003,
            color: new THREE.Color(0x7f7f7f),
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
        });
    mirrorBack2.position.y = p.floor + mirrorH / 2 - 2;
    mirrorBack2.position.z = 12;
    mirrorBack2.position.x = 12;
    mirrorBack2.rotation.y = Math.PI - Math.PI / 3 + 1.6;
    scene.add(mirrorBack2);
    // let's make the mirror backside to do a shadow
    // reflectorBackGeom2 = new THREE.PlaneGeometry(mirrorW, mirrorH)
    // let reflectorBack2 = new THREE.Mesh(reflectorBackGeom2, mirrorMate)
    // reflectorBack2.position.y = mirrorBack2.position.y
    // reflectorBack2.position.z = mirrorBack2.position.z + 0.08
    // reflectorBack2.position.x = mirrorBack2.position.x
    // reflectorBack2.rotation.y = mirrorBack2.rotation.y
    // reflectorBack2.castShadow = true
    // scene.add(reflectorBack2)

    // REFLECTOR 3
    mirrorBack3 = new Reflector(
        new THREE.PlaneGeometry(mirrorW, mirrorH),
        {
            clipBias: 0.003,
            color: new THREE.Color(0x7f7f7f),
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
        });
    mirrorBack3.position.y = p.floor + mirrorH / 2 - 2;
    mirrorBack3.position.z = 12;
    mirrorBack3.position.x = -12;
    mirrorBack3.rotation.y = Math.PI - Math.PI / 3 + 0.5;
    scene.add(mirrorBack3);
    // let's make the mirror backside to do a shadow
    // reflectorBackGeom3 = new THREE.PlaneGeometry(mirrorW, mirrorH)
    // let reflectorBack3 = new THREE.Mesh(reflectorBackGeom3, mirrorMate)
    // reflectorBack3.position.y = mirrorBack3.position.y
    // reflectorBack3.position.z = mirrorBack3.position.z + 0.08
    // reflectorBack3.position.x = mirrorBack3.position.x
    // reflectorBack3.rotation.y = mirrorBack3.rotation.y
    // reflectorBack3.castShadow = true
    // scene.add(reflectorBack3)

    // Static ground plane
    groundGeom = new THREE.PlaneGeometry(20, 20)
    let ground = new THREE.Mesh(groundGeom, groundMate)
    ground.position.set(0, p.floor, 0)
    ground.rotation.x = - Math.PI / 2
    ground.scale.set(100, 100, 100)
    ground.castShadow = true
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
        //specular: 0x999999,
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

    // definiamo il punto che sta al centro dell'area
    const centerX = Math.floor(Nx / 2);
    const centerY = Math.floor(Ny / 2);

    for (let x = 0; x <= Nx; x++) {
        clothParticles.push([]);
        for (let y = 0; y <= Ny; y++) {
            const hangingPosition = new CANNON.Vec3(
                (x - Nx * 0.5) * restDistanceX,
                p.floor + cHeight + 4,
                (y - Ny * 0.5) * restDistanceY
            );

            const particle = new CANNON.Body({
                mass: (x === centerX && y === centerY) ? 0 : mass,  // Fissa solo la particella centrale del tessuto
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
                // Aggiungi vincoli diagonali
                connectParticles(x, y, x + 1, y + 1);
                if (y > 0) {
                    connectParticles(x, y, x + 1, y - 1);
                }
            } else if (x === Nx && y < Ny) {
                connectParticles(x, y, x, y + 1);
            } else if (x < Nx && y === Ny) {
                connectParticles(x, y, x + 1, y);
            }
        }
    }


    // Initialize the vertices of the cloth
    const vertices = [];
    for (let x = 0; x <= Nx; x++) {
        for (let y = 0; y <= Ny; y++) {
            vertices.push(new THREE.Vector3());
        }
    }
    clothGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices.length * 3), 3));

    const light = new THREE.DirectionalLight(0xffffff, 10)
    light.position.set(15, 20, -4)
    light.target.position.set(0, 0, 12)
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

    const lightD = new THREE.DirectionalLight(0xffffff, 20)
    lightD.position.set(0, 10, 7)
    lightD.target.position.set(0, 10, -7)
    scene.add(lightD)
    const lightHelperD = new THREE.DirectionalLightHelper(lightD, 5);
    // scene.add(lightHelperD);

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
    mirrorMate2?.dispose()
    groundGeom?.dispose()
    groundMate?.dispose()

    // Dispose dei reflectors
    mirrorBack?.dispose();
    mirrorBack2?.dispose();
    mirrorBack3?.dispose();

    // Dispose delle geometrie dei reflectors
    reflectorBackGeom?.dispose();
    reflectorBackGeom2?.dispose();
    reflectorBackGeom3?.dispose();

    // Rimuovi i reflectors dalla scena
    scene?.remove(mirrorBack);
    scene?.remove(mirrorBack2);
    scene?.remove(mirrorBack3);

    world = null
    noise3D = null
    flowField = null
    window?.removeEventListener('resize', onWindowResize)
    window?.removeEventListener('mousemove', onMouseMove)
}