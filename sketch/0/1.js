// MIRROR/CASLTLE - PRIMER

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'

import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

let scene, camera
let groundMate, mirrorMate
let groundGeom, stepSideGeom, reflectorBackGeom
const ramps = []
let mirrorBack // reflector
let animation, light, lightD
let onWindowResize
let noise3D
// let gui
let controls

export function sketch() {
  // console.log("Sketch launched")

  actionsToPlay = [

    // idles
    {
      name: 'idle',
      color: 2,
      kind: 'idle'
    },
    {
      name: 'run',
      color: 2,
      kind: 'idle'
    },
    {
      name: 'Walk',
      color: 2,
      kind: 'idle'
    },

    // others 
    {
      name: 'appeso',
      color: 1,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'arrampicata',
      color: 4,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'caduta',
      color: 5,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'disteso',
      color: 6,
      kind: 'special',
      repetitions: 2,
      loopInOut: false
    },
    {
      name: 'eremita',
      color: 7,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'forza',
      color: 8,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'fuga',
      color: 0,
      kind: 'special',
      repetitions: 3,
      loopInOut: true
    },
    {
      name: 'giustizia',
      color: 1,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'guardingo',
      color: 2,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
    {
      name: 'imperatore',
      color: 3,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
    {
      name: 'imperatrice',
      color: 4,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
    {
      name: 'innamorati',
      color: 5,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
    {
      name: 'luna',
      color: 6,
      kind: 'special',
      repetitions: 3,
      loopInOut: true
    },
    {
      name: 'mago',
      color: 7,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'matto',
      color: 8,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'Mondo',
      color: 9,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'morte',
      color: 10,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
    {
      name: 'noia',
      color: 0,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
    {
      name: 'porta',
      color: 1,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'ruota',
      color: 2,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'salsa',
      color: 3,
      kind: 'special',
      repetitions: 4,
      loopInOut: false
    },
    {
      name: 'saluto',
      color: 4,
      kind: 'special',
      repetitions: 2,
      loopInOut: false
    },
    {
      name: 'sole',
      color: 5,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'solleva',
      color: 6,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
    {
      name: 'tiene',
      color: 7,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
  ];

    // PARAMETERS
    const p = {
        // objects
        lightSpeed: .2,
        animate: false,
        // mirror
        mirrorInclination: .05,
        // ...
        // view
        lookAtCenter: new THREE.Vector3(0, 2, 0),
        cameraPosition: new THREE.Vector3(- 5 + Math.random() * 10, -0.4, -8),
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

    // CAMERA
    camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far)
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
    // controls.maxAzimuthAngle = - Math.PI / 2
    // controls.minAzimuthAngle = Math.PI / 2
    controls.autoRotate = p.autoRotate
    controls.autoRotateSpeed = p.autoRotateSpeed
    controls.target = p.lookAtCenter

    // SCENE
    scene = new THREE.Scene()
    scene.background = p.background
    scene.fog = new THREE.Fog(scene.background, 3, 30)
    // materials
    // sky.mapping = THREE.CubeRefractionMapping
    mirrorMate = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        envMap: cubeTextures[1].texture,
        side: THREE.DoubleSide,
        // combine: THREE.addOperation,
        // reflectivity: 1,
        // flatShading: true,
        // shininess: 100,
        // specular: 0x999999,
        fog: false
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
    mirrorBack.rotation.x = p.mirrorInclination
    mirrorBack.position.y = p.floor + mirrorH / 2
    mirrorBack.position.z = 3
    mirrorBack.rotation.y = Math.PI
    scene.add(mirrorBack)
    // let's make the mirror backside to do a shadow
    reflectorBackGeom = new THREE.PlaneGeometry(mirrorW, mirrorH)
    let reflectorBack = new THREE.Mesh(reflectorBackGeom, mirrorMate)
    reflectorBack.rotation.x = p.mirrorInclination
    reflectorBack.position.y = p.floor + mirrorH / 2
    reflectorBack.position.z = 3.05
    reflectorBack.rotation.y = Math.PI
    reflectorBack.castShadow = true
    scene.add(reflectorBack)
    // let's make some light below the mirror...
    RectAreaLightUniformsLib.init();
    let rectLightIntensity = 100
    const rectLight = new THREE.RectAreaLight(0xffffff, rectLightIntensity, mirrorW + .025, mirrorH + .025)
    rectLight.rotation.x = p.mirrorInclination
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

    light = new THREE.DirectionalLight(0xffffff, 3)//* PI)
    light.position.set(-3, 0, -7)
    light.target.position.set(0, 0, 0)
    light.castShadow = true
    light.shadow.radius = 8
    light.shadow.camera.near = 2
    light.shadow.camera.far = 200
    light.shadow.bias = 0.0001
    light.shadow.mapSize.width = shadowMapWidth
    light.shadow.mapSize.height = shadowMapHeight
    // light.decay = 0
    scene.add(light)
    // const lightHelper = new THREE.DirectionalLightHelper(light, 5);
    // scene.add(lightHelper);

    lightD = new THREE.DirectionalLight(0xffffff, 1) //* PI)
    lightD.position.set(-3, 3, 0)
    lightD.target.position.set(0, 0, 0)
    lightD.decay = 0
    scene.add(lightD)

    const pointLight2 = new THREE.PointLight(0xffffff, 10 * PI)
    pointLight2.position.set(-6, 2, +.5)
    scene.add(pointLight2)

    const pointLight = new THREE.PointLight(0xffffff, 10 * PI)
    pointLight.position.set(6, 2, -.5)
    scene.add(pointLight)
    // const pointLight2 = new THREE.PointLight(0xffffff, .1)
    // pointLight2.position.set(-30, 20, -20)
    // scene.add(pointLight2)
    const ambientLight = new THREE.AmbientLight(0x555555)
    scene.add(ambientLight)

    // GUI
    // gui = new GUI.GUI()
    // const nameFolder = gui.addFolder('Name of the folder')
    // nameFolder.add(cube.rotation, 'x', 0, Math.PI * 2)
    // nameFolder.open()
    // ...

    noise3D = NOISE.createNoise3D()
    const t0 = Math.random() * 10

    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin() // XXX

        if (p.animate) {
            // ANIMATION
            const t = t0 + performance.now() * 0.0001
            const t1 = t * p.lightSpeed + 0
            const t2 = t1 + 10
            camera.position.set(noise3D(t1, 0, 0) * 2, noise3D(0, t1 + 4, 0) * 1, -6)
            controls.target.set(noise3D(t2, 0, 0) * 2, 1, noise3D(0, t2 + 4, 0) * 2)
            // ...
        }
        // ...

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
    ramps.forEach(ramp => scene.remove(ramp))
    ramps.length = 0
    scene.traverse((child) => {
        if (child.geometry) {
            child.geometry.dispose();
        }
        if (child.material) {
            child.material.dispose();
        }
    });
    light?.dispose()
    lightD?.dispose()
    // scene = null;
    camera = null;
    // gui?.destroy()
    // ...
    window.removeEventListener('resize', onWindowResize)
}