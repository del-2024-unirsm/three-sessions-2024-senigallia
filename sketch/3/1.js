// EYE

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'



let scene, camera
let geometry, groundGeom, groundMate
let material, material2, mirrorMate
let animation
let onWindowResize
let noise3D
let controls
let loaderGLTF
let lightS, light, pointLight
let eye, eye2, eye3

export function sketch() {
    // console.log("Sketch launched")

    const p = {
        // colors
        availableColorsHighlights: [0xffffff, 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0x00ffff, 0xff00ff],
        availableColors: [0xffffff, 0xcc0000, 0x00cc00, 0x0000cc, 0xcccc00, 0x00cccc, 0xcc00cc],
        // time
        timeSpeed: 0.0001,
        // planet
        planetScale: 3,
        planetScaleAuto: true,
        planetScaleMax: .25,
        planetPos: new THREE.Vector3(0, 3, 0),
        planetSpeed: .7,
        planetRotationSpeed: 2,
        // view
        lookAtCenter: new THREE.Vector3(0, 0, 0),
        cameraPosition: new THREE.Vector3(-4 + Math.random() * 10, -3, 10 + Math.random() * 5),
        autoRotate: false,
        autoRotateSpeed: -0.02,
        camera: 35,
        // bloom
        exposure: 0,
        bloomStrength: 2,
        bloomThreshold: .25,
        bloomRadius: 1.2,
        // world
        background: new THREE.Color(0x333333),
        floor: -4,
    }

    // select main scene color, random choose for now
    // let whichColor = p.availableColors.length * Math.random() | 0
    // p.background = new THREE.Color(p.availableColors[whichColor])

    // other parameters
    let near = 1, far = 50
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
    controls.minDistance = 7
    controls.maxDistance = 17
    controls.maxPolarAngle = Math.PI / 2 + .2
    controls.minPolarAngle = 0
    controls.autoRotate = p.autoRotate
    controls.autoRotateSpeed = p.autoRotateSpeed
    controls.target = p.lookAtCenter

    // SCENE
    scene = new THREE.Scene()
    scene.background = p.background
    scene.fog = new THREE.Fog(scene.background, near, far)
    // geometry = new THREE.ConeGeometry(1, 2, 64)

    mirrorMate = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: textures[1].texture,
        envMap: cubeTextures[1].texture,
        side: THREE.DoubleSide,
        // combine: THREE.addOperation,
        reflectivity: 1,
        // flatShading: true,
        shininess: 100,
        // specular: 0x999999,
        fog: true
    })

    //  eye
    // This "skull" model is based on "Skull Salazar (Downloadable)" (https://sketchfab.com/3d-models/skull-salazar-downloadable-eeed09437afb4e1ea8a6ff3b0e9964ad) by jvitorsouzadesign (https://sketchfab.com/jvitorsouzadesign) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
    //GLTFLoader
    //eye
    let gltfLoaded = false

    loaderGLTF = new GLTFLoader()
    loaderGLTF.load(
        './assets/models/eye/scene.gltf',
        (gltf) => {

            gltfLoaded = true

            eye = gltf.scene.children[0]
            // eye.position.copy(p.lookAtCenter)
            eye.position.y = .7
            eye.rotation.x = -1.4

            eye.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true
                    // node.receiveShadow = true
                    if (node.name === "Object_4") {
                        node.material = mirrorMate
                        // node.material.roughness = 0
                        // node.material.metalness = .2
                        // node.material.fog = true
                    }
                }
            })

            scene.add(eye)

            eye2 = clone(eye);
            eye2.position.x = -5;
            eye2.position.z = -2;
            scene.add(eye2);

            eye3 = clone(eye);
            eye3.position.x = 5;
            eye3.position.z = -2;
            scene.add(eye3);

            // let eyeMat = eye.children[0].children[0].material
            // console.log(calaveraMat)
            // eyeMat.map = null
            // calaveraToothMat.map = null
            // calaveraMat.roughness = 1
            // calaveraToothMat.roughness = 1
            gltfLoaded = true
        },
        (xhr) => {
            // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
        },
        (error) => {
            // console.log('An error happened loading the GLTF scene')
            alert(error)
        }
    )

    // LIGHTS
    lightS = new THREE.SpotLight(0x999999, 1 * PI, 0, Math.PI / 5, 0.5)
    lightS.position.set(1, 2, 10)
    lightS.target.position.set(0, 0, 0)
    lightS.castShadow = true
    lightS.shadow.camera.near = 5
    lightS.shadow.camera.far = 200
    lightS.shadow.bias = 0.0001
    lightS.shadow.mapSize.width = shadowMapWidth
    lightS.shadow.mapSize.height = shadowMapHeight
    lightS.decay = 0
    scene.add(lightS)

    light = new THREE.DirectionalLight(0xffffff, .5 * PI)
    light.position.set(0, 2, 10)
    light.target.position.clone(eye)
    light.decay = 0
    // light.castShadow = true
    scene.add(light)
    // const light2 = new THREE.DirectionalLight(0xffffff, .4)
    // light.position.set(-10, 3, -10)
    // light.target.position.set(-5, 0, 0)
    // light.castShadow = true
    // scene.add(light2)
    pointLight = new THREE.PointLight(0xffffff, 1 * PI)
    pointLight.position.set(0, 1, 2)
    scene.add(pointLight)
    pointLight.decay = 0
    // const pointLight = new THREE.PointLight(0xffffff, .5)
    // pointLight.position.set(20, 20, 20)
    // scene.add(pointLight)
    // const pointLight2 = new THREE.PointLight(0xffffff, .1)
    // pointLight2.position.set(-30, 20, -20)
    // scene.add(pointLight2)
    // const ambientLight = new THREE.AmbientLight(0xffffff)
    // scene.add(ambientLight)

    // let's make a ground
    groundMate = new THREE.MeshStandardMaterial({
        color: p.background,
        roughness: 1,
        metalness: 0,
        fog: true,
    })
    groundGeom = new THREE.PlaneGeometry(20, 20)
    let ground = new THREE.Mesh(groundGeom, groundMate)
    ground.position.set(0, p.floor, 0)
    ground.rotation.x = - Math.PI / 2
    ground.scale.set(100, 100, 100)
    ground.castShadow = false
    ground.receiveShadow = true
    scene.add(ground)

    // NOISE
    noise3D = NOISE.createNoise3D()
    const t0 = Math.random() * 10

    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin() // XXX

        const t = t0 + performance.now() * p.timeSpeed

        // ANIMATION
        if (gltfLoaded && eye) {
            // pointLight1.position.copy(eye.position)
            // pointLight1.position.y -= .5
            const t3 = t * p.planetSpeed + 2
            eye.rotation.z = -0.1 + noise3D(0, t3 + 4, 0) * .8
            eye.rotation.y = -0.1 + noise3D(0, 0, t3) * .8

            eye2.rotation.z = -0.1 + noise3D(0, t3 + 7, 0) * .5
            eye2.rotation.y = -0.1 + noise3D(0, 0, t3 + 22) * .5

            eye3.rotation.z = -0.1 + noise3D(0, t3 + 9, 0) * .3
            eye3.rotation.y = -0.1 + noise3D(0, 0, t3 + 12) * .3
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
    geometry?.dispose()
    material?.dispose()
    material2?.dispose()
    noise3D = null
    eye?.traverse((node) => {
        if (node.isMesh) {
            node.geometry.dispose();
            node.material.dispose();
        }
    });
    eye2?.traverse((node) => {
        if (node.isMesh) {
            node.geometry.dispose();
            node.material.dispose();
        }
    });
    eye3?.traverse((node) => {
        if (node.isMesh) {
            node.geometry.dispose();
            node.material.dispose();
        }
    });
    scene.traverse((child) => {
        if (child.geometry) {
            child.geometry.dispose();
        }
        if (child.material) {
            child.material.dispose();
        }
    });
    light?.dispose();
    lightS?.dispose();
    pointLight?.dispose();
    camera = null;
    // scene = null;
    window.removeEventListener('resize', onWindowResize)
}