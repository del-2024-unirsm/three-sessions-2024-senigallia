import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

let scene
let groundMate, humanMate
let groundGeom
let animation
let onWindowResize
let noise3D
// let gui
let controls
let loaderGLTF
let mixer

export function sketch() {
    // console.log("Sketch launched")

    // PARAMETERS
    const p = {
        // colors
        availableColorsHighlights: [0xffffff, 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0x00ffff, 0xff00ff],
        availableColors: [0xffffff, 0xcc0000, 0x00cc00, 0x0000cc, 0xcccc00, 0x00cccc, 0xcc00cc],
        // objects
        lightSpeed: 1,
        // ...
        // view
        lookAtCenter: new THREE.Vector3(0, 0, 0),
        cameraPosition: new THREE.Vector3(0, 1, -10),
        autoRotate: false,
        autoRotateSpeed: -.05,
        camera: 35,
        // ...
        // world
        background: new THREE.Color(0xffffff),
        floor: -0.5,
        // ...
    }

    // select main scene color, random choose for now
    let whichColor = p.availableColors.length * Math.random() | 0
    p.background = new THREE.Color(p.availableColors[whichColor])

    // other parameters
    let near = 0.2, far = 200
    let shadowMapWidth = 2048, shadowMapHeight = 2048

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
    controls.minPolarAngle = Math.PI / 2 - 0.2
    controls.maxAzimuthAngle = - Math.PI / 2
    controls.minAzimuthAngle = Math.PI / 2
    controls.autoRotate = p.autoRotate
    controls.autoRotateSpeed = p.autoRotateSpeed
    controls.target = p.lookAtCenter

    // SCENE
    scene = new THREE.Scene()
    scene.background = p.background
    scene.fog = new THREE.Fog(scene.background, 10, 30)
    // materials
    humanMate = new THREE.MeshStandardMaterial({
        color: p.background,
        roughness: 0.5,
        metalness: 0,
        fog: true,
        flatShading: true,
    })
    groundMate = new THREE.MeshStandardMaterial({
        color: p.background,
        roughness: 1,
        metalness: 0,
        fog: true,
    })


    // GEOMETRIES
    // let's make a ground
    groundGeom = new THREE.PlaneGeometry(20, 20)
    let ground = new THREE.Mesh(groundGeom, groundMate)
    ground.position.set(0, p.floor, 0)
    ground.rotation.x = - Math.PI / 2
    ground.scale.set(100, 100, 100)
    ground.castShadow = false
    ground.receiveShadow = true
    scene.add(ground)

    // Let's load our low poly human
    //GLTFLoader
    let gltfLoaded = false
    let human
    loaderGLTF = new GLTFLoader()
    loaderGLTF.load(
        // resource URL
        './assets/models/Orlando_NLA_threejs.gltf',
        // called when the resource is loaded
        (gltf) => {
            // gltf.animations // Array<THREE.AnimationClip>
            // gltf.scene.scale.set(0.075, 0.075, 0.075)
            // gltf.scene.position.x = -0.85
            // gltf.scene.position.y = 3.35
            // gltf.scene // THREE.Group
            // gltf.scenes // Array<THREE.Group>
            // gltf.asset // Object
            // gltf.scene.children[0].material = material XXX
            human = gltf.scene
            // human.scale.set(1.5, 1.5, 1.5)
            const box = new THREE.Box3().setFromObject(human);
            const size = box.getSize(new THREE.Vector3());
            human.traverse((node) => {
                if (node.isMesh) {
                    node.material = humanMate
                    node.castShadow = true
                    node.receiveShadow = true
                }
            })
            human.position.y = p.floor + size.y / 2 - 0.5
            human.position.z = 2
            human.rotation.y = Math.PI
            // animations
            mixer = new THREE.AnimationMixer(human)

            let action = mixer.clipAction(gltf.animations[2])
                action.play()

                
           /* for (let i = 0; i < gltf.animations.length; i++) {
                let action = mixer.clipAction(gltf.animations[i])
                action.play()
            } */
            //
            scene.add(human)
            // console.log(human)
            // let humanMat = human.children[0].material
            // console.log(humanMat)
            gltfLoaded = true
        },
        (xhr) => {
            // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
        },
        (error) => {
            // console.log('An error happened loading the GLTF scene')
        }
    )


    // LIGHTS

    // big rect
    RectAreaLightUniformsLib.init();
    let rectLightWidth = 4
    let rectLightHeight = 5.5
    let rectLightIntensity = 5
    const rectLight = new THREE.RectAreaLight(p.availableColorsHighlights[whichColor], rectLightIntensity, rectLightWidth, rectLightHeight)
    rectLight.position.set(0, p.floor + rectLightHeight / 2, 10)
    scene.add(rectLight)
    const rectLightHelper = new RectAreaLightHelper(rectLight)
    rectLight.add(rectLightHelper)


    const light = new THREE.DirectionalLight(0xffffff, .4)
    light.position.set(0, 2, 10)
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

    // GUI
    // gui = new GUI.GUI()
    // const nameFolder = gui.addFolder('Name of the folder')
    // nameFolder.add(cube.rotation, 'x', 0, Math.PI * 2)
    // nameFolder.open()
    // ...

    // NOISE
    noise3D = NOISE.createNoise3D()
    const t0 = Math.random() * 10

    const clock = new THREE.Clock()

    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin() // XXX

        // ANIMATION
        const t = t0 + performance.now() * 0.0001
        const t1 = t * p.lightSpeed + 0
        light.position.x = -3 + noise3D(0, t1, 0) * 6
        // ...

        let dt = clock.getDelta()
        if (mixer) mixer.update(dt)

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
    groundMate?.dispose()
    humanMate?.dispose()
    noise3D = null
    // gui?.destroy()
    // ...
    window.removeEventListener('resize', onWindowResize)
}