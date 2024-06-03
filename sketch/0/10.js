//steadyCam

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'

import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

let scene
let groundMate, mirrorMate
let groundGeom, stepSideGeom, reflectorBackGeom
let mirrorBack // reflector
let animation
let onWindowResize
let noise3D
// let gui
let controls

export function sketch() {
    // console.log("Sketch launched")

    // PARAMETERS
    const p = {
        // objects
        lightSpeed: .2,
        animate: false,
        // ...
        // view
        lookAtCenter: new THREE.Vector3(0, 1, 0),
        cameraPosition: new THREE.Vector3(- 3 + Math.random() * 6, -0.5, -5),
        autoRotate: false,
        autoRotateSpeed: -1,
        camera: 35,
        // ...
        // world
        background: new THREE.Color(0x00a28a),
        floor: -0.5,
        // ...
    }

    // other parameters
    let near = 0.2, far = 200
    let shadowMapWidth = 2048, shadowMapHeight = 2048
    let paused = false

    // CAMERA
    let camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far)
    camera.position.copy(p.cameraPosition)
    camera.lookAt(p.lookAtCenter)

    // WINDOW RESIZE
    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onWindowResize)

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 5
    controls.maxDistance = 15
    controls.maxPolarAngle = Math.PI / 2
    controls.minPolarAngle = Math.PI / 2 - 0.8
    controls.maxAzimuthAngle = - Math.PI / 2
    controls.minAzimuthAngle = Math.PI / 2
    controls.autoRotate = p.autoRotate
    controls.autoRotateSpeed = p.autoRotateSpeed
    controls.target = p.lookAtCenter

    // SCENE
    scene = new THREE.Scene()
    scene.background = p.background
    scene.fog = new THREE.Fog(scene.background, 3, 30)
    // materials
    mirrorMate = new THREE.MeshPhongMaterial({
        color: 0x444444,
        envMap: cubeTextures[0].texture,
        side: THREE.DoubleSide,
        combine: THREE.addOperation,
        reflectivity: 1,
        // specular: 0x999999,
        fog: true
    })
    groundMate = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 1,
        metalness: 0,
        fog: true,
    })

    // REFLECTOR
    let mirrorW = .7
    let mirrorH = 3
    mirrorBack = new Reflector(
        new THREE.PlaneGeometry(mirrorW, mirrorH),
        {
            clipBias: 0.003,
            color: new THREE.Color(0x7f7f7f),
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
        })
    mirrorBack.position.y = p.floor + mirrorH / 2
    mirrorBack.position.z = 3
    mirrorBack.rotation.y = Math.PI
    scene.add(mirrorBack)
    // let's make the mirror backside to do a shadow
    reflectorBackGeom = new THREE.PlaneGeometry(mirrorW, mirrorH)
    let reflectorBack = new THREE.Mesh(reflectorBackGeom, mirrorMate)
    reflectorBack.position.y = p.floor + mirrorW / 2
    reflectorBack.position.z = 3.05
    reflectorBack.rotation.y = Math.PI
    reflectorBack.castShadow = true
    scene.add(reflectorBack)
    // let's make some light below the mirror...
    RectAreaLightUniformsLib.init();
    let rectLightIntensity = 100
    const rectLight = new THREE.RectAreaLight(0xffffff, rectLightIntensity, mirrorW, mirrorH)
    rectLight.position.set(0, p.floor + mirrorH / 2, 3.025)
    scene.add(rectLight)
    const rectLightHelper = new RectAreaLightHelper(rectLight)
    rectLight.add(rectLightHelper)

    // GEOMETRIES
    // let's make a staircase mirror    
    let stepW = 1.2
    let stepH = 0.4
    stepSideGeom = new THREE.PlaneGeometry(stepW, stepH)


    let minSteps = 5
    let maxStepsDelta = 10
    const ramps = []
    for (let r = 0; r < 3; r++) {
        const steps = new THREE.Group
        const rampSteps = minSteps + Math.random() * maxStepsDelta
        for (let s = 0; s < rampSteps; s++) {
            const stepV = new THREE.Mesh(stepSideGeom, mirrorMate)
            const stepH = new THREE.Mesh(stepSideGeom, mirrorMate)
            // front side
            stepV.position.y = p.floor + 0.2 + s * .4
            stepV.position.z = s * .4
            // top side
            stepH.rotation.x = Math.PI / 2
            stepH.position.y = p.floor + .4 + s * .4
            stepH.position.z = .2 + s * .4
            // shadows
            stepH.castShadow = true
            stepV.castShadow = true
            // add to rampgroup
            steps.add(stepH)
            steps.add(stepV)
        }
        // find an orientation for the ramp
        let rampOrientation = Math.floor(Math.random() * 4)
        steps.rotation.y = Math.PI / 2 * rampOrientation
        steps.position.x = - 3 + r * 3
        ramps.push(steps)
        scene.add(steps)
    }
    // let's make a ground
    groundGeom = new THREE.PlaneGeometry(20, 20)
    let ground = new THREE.Mesh(groundGeom, groundMate)
    ground.position.set(0, p.floor, 0)
    ground.rotation.x = - Math.PI / 2
    ground.scale.set(100, 100, 100)
    ground.castShadow = false
    ground.receiveShadow = true
    scene.add(ground)

    const light = new THREE.DirectionalLight(0xffffff, 10)
    light.position.set(0, 2, -5)
    // light.target = cube
    light.castShadow = true
    light.shadow.radius = 8
    light.shadow.camera.near = 2
    light.shadow.camera.far = 200
    light.shadow.bias = 0.0001
    light.shadow.mapSize.width = shadowMapWidth
    light.shadow.mapSize.height = shadowMapHeight
    scene.add(light)
    // const lightHelper = new THREE.DirectionalLightHelper(light, 5);
    // scene.add(lightHelper);

    const lightD = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(0, 3, -3)
    light.target.position.set(0, 0, 0)
    scene.add(lightD)
    // const pointLight = new THREE.PointLight(0xffffff, 2)
    // pointLight.position.set(20, 20, 20)
    // scene.add(pointLight)
    // const pointLight2 = new THREE.PointLight(0xffffff, .1)
    // pointLight2.position.set(-30, 20, -20)
    // scene.add(pointLight2)
    // const ambientLight = new THREE.AmbientLight(0xffffff)
    // scene.add(ambientLight)

    // GUI
    // gui = new GUI.GUI()
    // const nameFolder = gui.addFolder('Name of the folder')
    // nameFolder.add(cube.rotation, 'x', 0, Math.PI * 2)
    // nameFolder.open()
    // ...


    // valori di partenza
   /* const steadycamFlowSpeed = .02; // Adjust this value to change the speed of the steadycam flow
    const steadycamFlowAmplitude = 0.01; // Adjust this value to change the amplitude of the steadycam flow
    let steadycamFlowTime = 0;
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    const steadycamBounds = {
        x: { min: -2.5, max: 2.5 },
        y: { min: 0, max: 1.5 },
        z: { min: -15, max: -4 }
    }; */

    const steadycamFlowSpeed = 0.1; // Aumentato il valore per una maggiore velocità
    const steadycamFlowAmplitude = 0.1; // Aumentato il valore per una maggiore ampiezza
    let steadycamFlowTime = 0;
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    const steadycamBounds = {
    x: { min: -5, max: 5 }, // Allargati i limiti sull'asse x
    y: { min: 0, max: 3 }, // Allargati i limiti sull'asse y
    z: { min: -20, max: -3 } // Allargati i limiti sull'asse z
    };

    noise3D = NOISE.createNoise3D()
    const t0 = Math.random() * 10
    const clock = new THREE.Clock()

    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin() // XXX
        if (!paused) {

            const t = t0 + performance.now() * 0.0001
            let dt = clock.getDelta()

            // ANIMATION
            const t1 = t * p.lightSpeed + 0
            const t2 = t1 + 10
            camera.position.set(noise3D(t1, 0, 0) * 2, noise3D(0, t1 + 4, 0) * 1, -6)
            controls.target.set(noise3D(t2, 0, 0) * 2, 1, noise3D(0, t2 + 4, 0) * 2)
            // ...

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

        controls.update()
        renderer.render(scene, camera) // RENDER
        if (showStats) stats.end() // XXX


        animation = requestAnimationFrame(animate) // CIAK
    }
    animate()
}

export function dispose() {
    cancelAnimationFrame(animation)
    controls?.dispose()
    groundGeom?.dispose()
    reflectorBackGeom?.dispose()
    groundMate?.dispose()
    stepSideGeom?.dispose()
    mirrorMate?.dispose()
    mirrorBack?.dispose()
    noise3D = null
    // gui?.destroy()
    // ...
    window.removeEventListener('resize', onWindowResize)
}