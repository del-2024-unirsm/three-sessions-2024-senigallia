//scale che si costruiscono
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

let scene;
let groundMate, mirrorMate;
let groundGeom, stepSideGeom, reflectorBackGeom;
let mirrorBack; // reflector
let animation;
let onWindowResize;
let noise3D;
let controls;
let ramps = [];
let rampBuildCounter = 0;
let rampBuildDelay = 0;

export function sketch() {
    const p = {
        lightSpeed: .2,
        animate: false,
        lookAtCenter: new THREE.Vector3(0, 0, 0),
        cameraPosition: new THREE.Vector3(1 + Math.random() * 6, 1, 1),
        autoRotate: false,
        autoRotateSpeed: -1,
        camera: 35,
        background: new THREE.Color(0x000000),
        floor: -0.5,
    };

   //altri parametri
    let near = 0.2, far = 200;
    let shadowMapWidth = 2048, shadowMapHeight = 2048;
    let paused = false


    let camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far);
    camera.position.copy(p.cameraPosition);
    camera.lookAt(p.lookAtCenter);

    onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;

    scene = new THREE.Scene();
    scene.background = p.background;
    scene.fog = new THREE.Fog(scene.background, 3, 30);

    mirrorMate = new THREE.MeshPhongMaterial({
        color: 0x444444,
        envMap: cubeTextures[3].texture,
        side: THREE.DoubleSide,
        combine: THREE.addOperation,
        reflectivity: 1,
        fog: true
    });

    groundMate = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 1,
        metalness: 0,
        fog: true,
    });

    let mirrorW = .7;
    let mirrorH = 3;
    mirrorBack = new Reflector(
        new THREE.PlaneGeometry(mirrorW, mirrorH),
        {
            clipBias: 0.003,
            color: new THREE.Color(0x7f7f7f),
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
        });
    mirrorBack.position.y = p.floor + mirrorH / 2;
    mirrorBack.position.z = 7;
    mirrorBack.rotation.y = Math.PI;
    scene.add(mirrorBack);

    reflectorBackGeom = new THREE.PlaneGeometry(mirrorW, mirrorH);
    let reflectorBack = new THREE.Mesh(reflectorBackGeom, mirrorMate);
    reflectorBack.position.y = p.floor + mirrorW / 2;
    reflectorBack.position.z = 7.05;
    reflectorBack.rotation.y = Math.PI;
    reflectorBack.castShadow = true;
    scene.add(reflectorBack);

    RectAreaLightUniformsLib.init();
    let rectLightIntensity = 100;
    const rectLight = new THREE.RectAreaLight(0x9eddec, rectLightIntensity, mirrorW, mirrorH);
    rectLight.position.set(0, p.floor + mirrorH / 2, 7.025);
    scene.add(rectLight);
    const rectLightHelper = new RectAreaLightHelper(rectLight);
    rectLight.add(rectLightHelper);

    let stepW = 1.2;
    let stepH = 0.4;
    stepSideGeom = new THREE.PlaneGeometry(stepW, stepH);

    // Funzione per controllare le intersezioni
    function checkIntersection(ramp1, ramp2) {
        const box1 = new THREE.Box3().setFromObject(ramp1);
        const box2 = new THREE.Box3().setFromObject(ramp2);
        return box1.intersectsBox(box2);
    }

    let minSteps = 5;
    let maxStepsDelta = 10;
    for (let r = 0; r < 100; r++) { //aumentare o diminiire il numero delle scalinate
        const steps = new THREE.Group();
        const rampSteps = minSteps + Math.random() * maxStepsDelta;
        for (let s = 0; s < rampSteps; s++) {
            const stepV = new THREE.Mesh(stepSideGeom, mirrorMate);
            const stepH = new THREE.Mesh(stepSideGeom, mirrorMate);
            stepV.position.y = p.floor + 0.2 + s * .4;
            stepV.position.z = s * .4;
            stepH.rotation.x = Math.PI / 2;
            stepH.position.y = p.floor + .4 + s * .4;
            stepH.position.z = .2 + s * .4;
            stepH.castShadow = true;
            stepV.castShadow = true;
            steps.add(stepH);
            steps.add(stepV);
        }

        let rampOrientation = Math.floor(Math.random() * 4);
        steps.rotation.y = Math.PI / 2 * rampOrientation;
        steps.position.x = -5 + Math.random() * 10; // Posizione x casuale
        steps.position.z = -5 + Math.random() * 10; // Posizione z casuale
        steps.position.y = p.floor + Math.random() * 5; // Altezza casuale
        steps.userData.offset = Math.random() * 2 * Math.PI;
        steps.userData.rampSteps = steps.children.slice();
        steps.children = [];
        ramps.push(steps);
        scene.add(steps);

        // Check for intersections with previously added ramps
        let intersects = false;
        do {
            intersects = false;
            for (let i = 0; i < ramps.length - 1; i++) {
                if (checkIntersection(steps, ramps[i])) {
                    intersects = true;
                    steps.rotation.y += Math.PI / 2; // Rotate 90 degrees clockwise
                    break;
                }
            }
        } while (intersects);
    }

    groundGeom = new THREE.PlaneGeometry(20, 20);
    let ground = new THREE.Mesh(groundGeom, groundMate);
    ground.position.set(0, p.floor, 0);
    ground.rotation.x = - Math.PI / 2;
    ground.scale.set(100, 100, 100);
    ground.castShadow = false;
    ground.receiveShadow = true;
    scene.add(ground);

    const light = new THREE.DirectionalLight(0xffffff, 10);
    light.position.set(0, 2, -5);
    light.castShadow = true;
    light.shadow.radius = 8;
    light.shadow.camera.near = 2;
    light.shadow.camera.far = 200;
    light.shadow.bias = 0.0001;
    light.shadow.mapSize.width = shadowMapWidth;
    light.shadow.mapSize.height = shadowMapHeight;
    scene.add(light);

    const lightD = new THREE.DirectionalLight(0x9eddec, 10);
    lightD.position.set(0, 3, -3);
    lightD.target.position.set(0, 0, 0);
    scene.add(lightD);

    const steadycamFlowSpeed = 0.1; // Aumentato il valore per una maggiore velocità
    const steadycamFlowAmplitude = 5; // Aumentato il valore per una maggiore ampiezza
    let steadycamFlowTime = 0;
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    const steadycamBounds = {
    x: { min: -1000, max: 1000 }, // Allargati i limiti sull'asse x
    y: { min: 3, max: 1000 }, // Allargati i limiti sull'asse y
    z: { min: -100, max: 100 } // Allargati i limiti sull'asse z
    };


    noise3D = NOISE.createNoise3D();
    const t0 = Math.random() * 10;
    const clock = new THREE.Clock()

    const animate = () => {
        if (showStats) stats.begin();

        if (!paused) {

            const t = t0 + performance.now() * 0.0001
            let dt = clock.getDelta()

            
            const t1 = t * p.lightSpeed + 0;
            const t2 = t1 + 10;
            camera.position.set(noise3D(t1, 0, 0) * 2, noise3D(0, t1 + 4, 0) * 1, -6);
            controls.target.set(noise3D(t2, 0, 0) * 2, 1, noise3D(0, t2 + 4, 0) * 2);

             // Update steadycam flow time
             steadycamFlowTime += dt * steadycamFlowSpeed;

             // Calculate steadycam flow offsets using noise functions
             const steadycamFlowX = noise3D(steadycamFlowTime, 0, 0) * steadycamFlowAmplitude;
             const steadycamFlowY = noise3D(0, steadycamFlowTime, 0) * steadycamFlowAmplitude;
             const steadycamFlowZ = noise3D(0, 0, steadycamFlowTime) * steadycamFlowAmplitude;
 
             // Apply steadycam flow to camera position if not in drag mode
             if (!controls.isDragging) {
                 // const cameraPosition = controls.object.position.clone();
                 // cameraPosition.add(new THREE.Vector3(steadycamFlowX, steadycamFlowY, steadycamFlowZ));
                 // controls.object.position.copy(cameraPosition);
                 const cameraPosition = controls.object.position.clone();
                 cameraPosition.add(new THREE.Vector3(steadycamFlowX, steadycamFlowY, steadycamFlowZ));
 
                 // Clamp the camera position within the defined boundaries
                 cameraPosition.x = clamp(cameraPosition.x, steadycamBounds.x.min, steadycamBounds.x.max);
                 cameraPosition.y = clamp(cameraPosition.y, steadycamBounds.y.min, steadycamBounds.y.max);
                 cameraPosition.z = clamp(cameraPosition.z, steadycamBounds.z.min, steadycamBounds.z.max);
 
                 controls.object.position.copy(cameraPosition);
             }
        }

        const time = performance.now() * 0.001;
        const amplitude = 0.05;
        const frequency = 1;
        ramps.forEach(ramp => {
            const randomVerticalOffset = Math.sin(time * frequency + ramp.userData.offset) * amplitude;
            ramp.position.y = p.floor + randomVerticalOffset;
        });

        if (rampBuildDelay++ % 10 === 0 && rampBuildCounter < ramps.length * (minSteps + maxStepsDelta)) {
            let rampIndex = Math.floor(rampBuildCounter / (minSteps + maxStepsDelta));
            let stepIndex = rampBuildCounter % (minSteps + maxStepsDelta);
            let steps = ramps[rampIndex].userData.rampSteps;
            if (stepIndex < steps.length) {
                ramps[rampIndex].add(steps[stepIndex * 2]);
                ramps[rampIndex].add(steps[stepIndex * 2 + 1]);
            }
            rampBuildCounter++;
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
    controls?.dispose();
    groundGeom?.dispose();
    reflectorBackGeom?.dispose();
    groundMate?.dispose();
    stepSideGeom?.dispose();
    mirrorMate?.dispose();
    mirrorBack?.dispose();
    noise3D = null;
    window.removeEventListener('resize', onWindowResize);
}