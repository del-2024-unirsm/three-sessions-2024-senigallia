// FOREST 

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, animation, onWindowResize, controls
let groundGeom, lanceGeometry
const lances = []
let groundMate, lanceMate, fireFlyMate
let fireFlyGeom, fireFlyLight
let light, lightD, ambientLight
let world
let noise3D
let flowField
let arrayfireflies = []

export function sketch() {

    const p = {
        // lights
        night: false,
        // lance
        lanceLength: 1 + Math.random() * 3,
        baseDiam: .04,
        topDiam: 0,
        numRows: 2 + Math.floor(Math.random() * 2),
        numCols: 2 + Math.floor(Math.random() * 2),
        spacing: .4 + Math.random() * 1,
        spacingVariability: Math.random(),
        lanceMass: 1,
        // view
        lookAtCenter: new THREE.Vector3(0, 0, 0),
        cameraPosition: new THREE.Vector3(0, 5, 0),
        autoRotate: true,
        autoRotateSpeed: -1 + Math.random() * 1,
        camera: 35,
        // fireflies
        // numfireflies: 10, // xxx
        fireFlySpeed: .1,
        // world
        background: new THREE.Color(0x000000),
        gravity: 20,
        wind: true,
        windStrength: .1 + Math.random() * .2,
        floor: -1,
    };

    //debug random night/day xxx
    // if (Math.random() > .5) p.night = true

    let lanceColor
    let groundColor
    if (!p.night) {
        p.background = new THREE.Color(0xaaaaaa)
        lanceColor = new THREE.Color(0x000000)
        groundColor = new THREE.Color(0x333333)
    } else {
        p.background = new THREE.Color(0x000000)
        lanceColor = new THREE.Color(0xcccccc)
        groundColor = new THREE.Color(0x666666)
    }

    // other parameters
    let near = 0.2, far = 1000;
    let shadowMapWidth = 2048, shadowMapHeight = 2048;
    let paused = false;

    // CAMERA
    camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far)
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
    scene.fog = new THREE.Fog(scene.background, 2, 20)
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, p.gravity, 0)
    });
    // world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10

    // MATERIALS
    groundMate = new THREE.MeshStandardMaterial({
        color: groundColor,
        roughness: 1,
        metalness: 0,
        fog: true,
        // transparent: true,
        // opacity: .5

    })
    fireFlyMate = new THREE.MeshStandardMaterial({
        color: 0xFFC702,
        emissive: 0xFFC702,
        roughness: 1,
        metalness: 0,
        fog: false,

    })
    lanceMate = new THREE.MeshPhongMaterial({
        color: lanceColor,
        envMap: cubeTextures[0].texture,
        // emissive: 0xffffff,
        // side: THREE.DoubleSide,
        // combine: THREE.addOperation,
        // reflectivity: .3,
        // flatShading: true,
        // shininess: 100,
        // specular: 0xffffff,
        fog: true
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
        position: new CANNON.Vec3(0, p.floor - 0.1, 0),
        mass: 0,
        shape: new CANNON.Plane(),
    });
    // xxx body has a bug with point lance point constraints... 
    // groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    // groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    // world.addBody(groundBody);
    // ground.position.copy(groundBody.position);
    // ground.quaternion.copy(groundBody.quaternion);

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.005;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.minPolarAngle = -Math.PI;
    controls.autoRotate = p.autoRotate;
    controls.autoRotateSpeed = p.autoRotateSpeed;
    controls.target = p.lookAtCenter;

    // FOREST
    const lanceLength = p.lanceLength // 5
    const numRows = p.numRows // 3 + Math.random() * 5;
    const numCols = p.numCols // 3 + Math.random() * 5;
    const spacing = p.spacing // .3 + Math.random() * .7;
    const spacingVariability = p.spacingVariability // .5;
    const baseDiam = p.baseDiam
    const topDiam = p.topDiam
    lanceGeometry = new THREE.CylinderGeometry(topDiam, baseDiam, lanceLength, 16);

    //BLOCKS -- offset = BLOCKS_SPACE
    // const blocks = [
    //     { numRows, numCols, spacing, spacingVariability, offset: new THREE.Vector3(-0.9, 0, 0) },
    //     { numRows, numCols, spacing, spacingVariability, offset: new THREE.Vector3(0.9, 0, 0) },
    // ];


    // for (const block of blocks) {
    //     const { numRows, numCols, spacing, spacingVariability, offset } = block;
        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
                const lance = new THREE.Mesh(lanceGeometry, lanceMate);
                lance.castShadow = true;
                lance.position.set(
                    (j - (numCols - 1) / 2) * spacing - (Math.random() * spacing / 2 * spacingVariability),
                    p.floor,
                    (i - (numRows - 1) / 2) * spacing + (Math.random() * spacing / 2 * spacingVariability)
                );
                scene.add(lance);

                const lanceShape = new CANNON.Cylinder(0.01, 0.05, lanceLength, 8);
                const lanceBody = new CANNON.Body({ mass: p.lanceMass });
                lanceBody.addShape(lanceShape);
                lanceBody.position.copy(lance.position);
                world.addBody(lanceBody);

                // Crea un corpo fisico statico per l'ancoraggio al terreno
                const anchorBody = new CANNON.Body({ mass: 0 });
                anchorBody.position.set(lance.position.x, p.floor, lance.position.z);
                world.addBody(anchorBody);

                // Aggiungi un vincolo a cerniera tra la base della lancia e l'ancoraggio al terreno
                // const constraint = new CANNON.HingeConstraint(lanceBody, anchorBody, {
                //     pivotA: new CANNON.Vec3(0, - lanceLength / 2, 0),
                //     pivotB: new CANNON.Vec3(0, 0, 0),
                //     axisA: new CANNON.Vec3(1, 0, 0),
                //     axisB: new CANNON.Vec3(0, 0, 1),
                // });
                // Aggiungi il vincolo tra il cilindro e il corpo fisso
                const constraint = new CANNON.PointToPointConstraint(
                    lanceBody,
                    new CANNON.Vec3(0, - lanceLength / 2, 0),
                    anchorBody,
                    new CANNON.Vec3(0, 0, 0),
                )
                world.addConstraint(constraint);

                lances.push({ mesh: lance, body: lanceBody });
            }
        }
    // }

    // Funzione per aggiornare la posizione delle lance
    function updateLances() {
        for (const lance of lances) {
            lance.mesh.position.copy(lance.body.position);
            lance.mesh.quaternion.copy(lance.body.quaternion);
        }
    }

    // FIREFLIES
    fireFlyGeom = new THREE.SphereGeometry(.005, 10, 2)
    const fireFly = new THREE.Mesh(fireFlyGeom, fireFlyMate)
    fireFlyLight = new THREE.PointLight(0xFFC702, 3, 2);
    fireFlyLight.castShadow = true;
    scene.add(fireFlyLight);
    scene.add(fireFly)

    // FIREFLIES ARRAY
    // arrayfireflies = []

    // for (let i = 0; i < p.numfireflies; i++) {
    //     const fireFly = new THREE.Mesh(fireFlyGeom, fireFlyMate);
    //     fireFlyLight = new THREE.PointLight(0xFFC702, 3, 1);
    //     fireFlyLight.castShadow = true; // Abilita la creazione di ombre
    //     arrayfireflies.push(fireFly);
    //     fireFly.add(fireFlyLight);
    //     scene.add(fireFly)
    // }

    // LIGHTS
    let lightIntensity
    if (p.night) lightIntensity = .5 * PI
    else lightIntensity = 4 * PI
    light = new THREE.DirectionalLight(0xffffff, lightIntensity)
    light.position.set(10, 20, -20)
    light.target.position.set(0, 0, 0)
    light.castShadow = true
    light.shadow.radius = 4
    light.shadow.camera.near = 2
    light.shadow.camera.far = 200
    light.shadow.bias = 0.0001
    light.shadow.mapSize.width = shadowMapWidth
    light.shadow.mapSize.height = shadowMapHeight
    light.decay = 0
    scene.add(light)
    const lightHelper = new THREE.DirectionalLightHelper(light, 5);
    // scene.add(lightHelper);

    lightD = new THREE.DirectionalLight(0xffffff, 10 * PI)
    lightD.position.set(-4, 0, -5)
    lightD.target.position.set(0, 4, 0)
    lightD.decay = 0
    // scene.add(lightD)

    // ambientLight = new THREE.AmbientLight(0xffffff)
    // scene.add(ambientLight)

    // NOISE
    noise3D = NOISE.createNoise3D()
    let t0 = Math.random() * 10

    // Parametri del flowfield
    let num
    if (numRows >= numCols) num = numRows
    else num = numCols
    const flowfieldResolution = Math.floor(num);
    const flowfieldScale = 0.1;

    // Funzione per generare il flowfield utilizzando noise3D
    function generateFlowfield() {
        flowField = new Array(flowfieldResolution);

        for (let i = 0; i < flowfieldResolution; i++) {
            flowField[i] = new Array(flowfieldResolution);
            for (let j = 0; j < flowfieldResolution; j++) {
                const x = i * flowfieldScale;
                const z = j * flowfieldScale;
                const noise = noise3D(x, 0, z);
                const angle = noise * Math.PI * 2;
                flowField[i][j] = new CANNON.Vec3(Math.cos(angle), 0, Math.sin(angle));
            }
        }
    }

    // Funzione per simulare il vento con il flowfield
    function simulateWindWithFlowfield() {
        const windStrength = -p.windStrength; // Riduce l'intensità del vento
        for (const lance of lances) {
            const position = lance.body.position;
            const cellX = Math.floor((position.x + 10) / 20 * flowfieldResolution);
            const cellZ = Math.floor((position.z + 10) / 20 * flowfieldResolution);

            // Verifica che gli indici siano all'interno dei limiti del flowfield
            // if (cellX >= 0 && cellX < flowfieldResolution && cellZ >= 0 && cellZ < flowfieldResolution) {
            const windDirection = flowField[cellX][cellZ];
            const windForce = windDirection.scale(windStrength);
            lance.body.applyForce(windForce, new CANNON.Vec3(0, 1, 0));
            // }
        }
    }

    generateFlowfield();

    // ANIMATE
    const timeStep = 1 / 60
    const stepsPerFrame = 1
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
                simulateWindWithFlowfield();
            }
            updateLances();

            const t2 = t * p.fireFlySpeed + 10
            fireFly.position.x = -1 + noise3D(0, t2, 0) * 2
            fireFly.position.y = -.4 + noise3D(t2 + 4, 0, 0) * .8
            fireFly.position.z = -1 + noise3D(0, 0, t2 + 8) * 2
            fireFlyLight.position.copy(fireFly.position)


            // xxx
            // for (let i = 0; i < p.numfireflies; i++) {
            //     arrayfireflies[i].position.x = -1 + noise3D(0, t2 + i, 0) * 2;
            //     arrayfireflies[i].position.y = -.4 + noise3D(t2 + i + 4, 0, 0) * .8;
            //     arrayfireflies[i].position.z = -1 + noise3D(0, 0, t2 - i + 8) * 2;
            //     arrayfireflies[i].position.copy(arrayfireflies[i].position);
            // }
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
    lanceMate?.dispose()
    groundGeom?.dispose()
    groundMate?.dispose()
    lanceGeometry?.dispose()
    lances?.forEach((lance) => {
        world?.removeBody(lance.body);
        // lance.body.shapes.forEach((shape) => {
        //     shape.dispose();
        // });
    });
    world?.constraints.forEach((constraint) => {
        world?.removeConstraint(constraint);
    });
    world = null
    noise3D = null
    flowField = null
    fireFlyGeom?.dispose();
    fireFlyMate?.dispose();
    fireFlyLight?.dispose();
    // arrayfireflies.forEach((f) => {

    // }
    light?.dispose();
    lightD?.dispose();
    ambientLight?.dispose();
    camera = null
    window?.removeEventListener('resize', onWindowResize)
    // window?.removeEventListener('mousemove', onMouseMove)
}