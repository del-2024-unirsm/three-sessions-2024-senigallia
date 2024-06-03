// CAUSTIC + GRIFFIN

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

let scene, camera
let groundMate, mirrorMate, griffinMate, fireFlyMate, griffin
let groundGeom, reflectorBackGeom
let rectLight, rectLightHelper, spotLight, light
let fireFlyGeom, fireFlyLight
let mirrorBack // reflector
let animation
let onWindowResize
let gui
let controls
let loaderGLTF
let mixer
let noise3D

export function sketch() {
    // console.log("Sketch launched")

    // PARAMETERS
    const p = {
        // objects
        mirrorInclination: -.05,
        // ...
        // view
        lookAtCenter: new THREE.Vector3(0, 1.5, 0),
        cameraPosition: new THREE.Vector3(0, 1, -5),
        autoRotate: true,
        autoRotateSpeed: 0,
        camera: 35,
        // ...
        // fireflies
        fireFlySpeed: .1,
        // world
        background: new THREE.Color(0x0000ff),
        floor: 0,
        // ...
    }

    // CAMERA
    let near = 0.2, far = 200
    let shadowMapWidth = 2048, shadowMapHeight = 2048
    let paused = false;

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
    controls.minDistance = 1
    controls.maxDistance = 6.5
    controls.maxPolarAngle = Math.PI / 2 + 0.2
    controls.minPolarAngle = 0
    controls.autoRotate = p.autoRotate
    controls.autoRotateSpeed = p.autoRotateSpeed
    controls.target = p.lookAtCenter
    controls.update()

    // SCENE
    scene = new THREE.Scene()
    scene.background = p.background
    scene.fog = new THREE.Fog(scene.background, 10, 30)
    // materials
    griffinMate = new THREE.MeshStandardMaterial({
        color: 0x333333,
        // envMap: cubeTextures[2].texture,
        roughness: .4,
        metalness: .9,
        fog: true,
        flatShading: true,
    })
    mirrorMate = new THREE.MeshPhongMaterial({
        color: 0x444444,
        envMap: cubeTextures[0].texture,
        side: THREE.DoubleSide,
        // combine: THREE.addOperation,
        reflectivity: 1,
        // specular: 0x999999,
        fog: true
    })
    groundMate = new THREE.MeshStandardMaterial({
        color: 0x330000,
        roughness: 1,
        metalness: 0,
        fog: true,
    })
    fireFlyMate = new THREE.MeshStandardMaterial({
        color: 0x0000FF,
        emissive: 0x0000FF,
        roughness: 1,
        metalness: 0,
        fog: false,

    })
    // ...

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
    // ...

    // Let's load our low poly human
    //GLTFLoader
    let gltfLoaded = false
    griffin
    loaderGLTF = new GLTFLoader()
    loaderGLTF.load(
        // resource URL
        // './assets/models/griffin_animated/scene.gltf',
        './assets/models/greif.glb',
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
            griffin = gltf.scene
            griffin.scale.set(5, 5, 5)
            const box = new THREE.Box3().setFromObject(griffin);
            const size = box.getSize(new THREE.Vector3());
            griffin.traverse((node) => {
                if (node.isMesh) {
                    // node.material = griffinMate
                    node.castShadow = true
                    // node.receiveShadow = true
                }
            })
            griffin.position.y = p.floor
            griffin.position.z = -7
            griffin.position.x = 1
            // griffin.rotation.y = - Math.PI / 2 + .5
            // animations
            // mixer = new THREE.AnimationMixer(griffin)
            // let action = mixer.clipAction(gltf.animations[0])
            // action.play()
            //
            scene.add(griffin)
            // console.log(human)
            // let humanMat = griffin.children[0].material
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
    const reflectorBack = new THREE.Mesh(reflectorBackGeom, mirrorMate)
    reflectorBack.rotation.x = p.mirrorInclination
    reflectorBack.position.y = p.floor + mirrorH / 2
    reflectorBack.position.z = 3.05
    reflectorBack.rotation.y = Math.PI
    reflectorBack.castShadow = true
    scene.add(reflectorBack)
    // let's make some light below the mirror...
    RectAreaLightUniformsLib.init();
    let rectLightIntensity = 30
    rectLight = new THREE.RectAreaLight(0xffffff, rectLightIntensity, mirrorW + 0.025, mirrorH + 0.025)
    rectLight.position.set(0, p.floor + mirrorH / 2, 3.025)
    rectLight.rotation.x = p.mirrorInclination
    scene.add(rectLight)
    rectLightHelper = new RectAreaLightHelper(rectLight)
    rectLight.add(rectLightHelper)

    const video = document.getElementById('video');
    video.crossOrigin = "anonymous";
    video.playsinline = "true";
    video.loop = 'true';
    video.play();

    const texture = new THREE.VideoTexture(video);
    // texture.colorSpace = THREE.SRGBColorSpace;
    // texture.needsUpdate = true;
    spotLight = new THREE.SpotLight(0xbbbbff, 20 * PI);
    // spotLight.distance = 50;
    // spotLight.intensity = 1;
    // spotLight.decay = 0;
    // spotLight.angle = 1
    spotLight.decay = 0
    spotLight.penumbra = .5
    spotLight.position.set(0, 10, 0);
    spotLight.map = texture
    // spotLight.castShadow = true;
    // spotLight.shadow.mapSize.width = 1024;
    // spotLight.shadow.mapSize.height = 1024;
    // spotLight.shadow.camera.near = 500;
    // spotLight.shadow.camera.far = 4000;
    // spotLight.shadow.camera.fov = 30;
    scene.add(spotLight);
    const spotlightHelper = new THREE.DirectionalLightHelper(spotLight, 5);
    // scene.add(spotlightHelper);

    // FIREFLIES
    fireFlyGeom = new THREE.SphereGeometry(.005, 4, 4)
    const fireFly = new THREE.Mesh(fireFlyGeom, fireFlyMate)
    fireFlyLight = new THREE.PointLight(0xff0000, 40 * PI, 5);
    fireFlyLight.castShadow = true;
    // fireFlyLight.decay = 0
    scene.add(fireFlyLight);
    scene.add(fireFly)

    light = new THREE.DirectionalLight(p.background, 15)
    light.position.set(0, 4, -10)
    light.castShadow = true
    light.shadow.radius = 8
    light.shadow.camera.near = 2
    light.shadow.camera.far = 100
    light.shadow.bias = 0.0001
    light.shadow.mapSize.width = shadowMapWidth
    light.shadow.mapSize.height = shadowMapHeight
    scene.add(light)
    scene.add(light.target)
    light.target.position.set(0, 0, -7)
    const lightHelper = new THREE.DirectionalLightHelper(light, 5);
    scene.add(lightHelper);

    // ...
    // scene.add(a)
    // scene.add(b)
    // scene.add(c)

    // GUI
    // gui = new GUI.GUI()
    // const nameFolder = gui.addFolder('Name of the folder')
    // nameFolder.add(cube.rotation, 'x', 0, Math.PI * 2)
    // nameFolder.open()
    // ...



    const steadycamFlowSpeed = .03; // Adjust this value to change the speed of the steadycam flow
    const steadycamFlowAmplitude = 0.01; // Adjust this value to change the amplitude of the steadycam flow
    let steadycamFlowTime = 0;
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    const steadycamBounds = {
        x: { min: -2, max: 1.3 },
        y: { min: 0, max: 1 },
        z: { min: -6.5, max: -4.5 }
    };

    // NOISE
    noise3D = NOISE.createNoise3D()
    let t0 = Math.random() * 10

    const clock = new THREE.Clock()

    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin() // XXX

        if (!paused) {

            const t = performance.now() / 1000

            // ANIMATION
            // ...
            let dt = clock.getDelta()
            if (mixer) mixer.update(dt)

            const t2 = t * p.fireFlySpeed + 10
            fireFly.position.x = -1 + noise3D(0, t2, 0) * 2
            fireFly.position.y = p.floor + 2 + noise3D(t2 + 4, 0, 0) * 4
            fireFly.position.z = -5 - noise3D(0, 0, t2 + 8) * 3
            fireFlyLight.position.copy(fireFly.position)

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
    fireFlyMate?.dispose()
    fireFlyGeom?.dispose();
    reflectorBackGeom?.dispose()
    groundMate?.dispose()
    mirrorMate?.dispose()
    griffinMate?.dispose()
    mirrorBack?.dispose()
    noise3D = null
    if (griffin) {
        griffin.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
        scene.remove(griffin);
    }
    scene.traverse((child) => {
        if (child.geometry) {
            child.geometry.dispose();
        }
        if (child.material) {
            child.material.dispose();
        }
    });
    rectLight?.dispose();
    rectLightHelper?.dispose();
    light?.dispose();
    fireFlyLight?.dispose();
    spotLight?.dispose();
    camera = null
    mixer?.uncacheRoot(mixer.getRoot());
    // gui?.destroy()
    // ...
    window.removeEventListener('resize', onWindowResize)
}