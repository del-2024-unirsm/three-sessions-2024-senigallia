// Planets + DiffisionMap + Noise
// Partially inspired by NASA's https://github.com/vishkashpvp/moon3d
// Moon texture: https://svs.gsfc.nasa.gov/cgi-bin/details.cgi?aid=4720

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'

import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';


let scene
let geometry, groundGeom, moonGeometry, reflectorBackGeom
let material, material2, groundMate, mirrorMate
let mirrorBack // reflector
let dispMap
let animation
let onWindowResize
let noise3D
let controls

export function sketch() {
    // console.log("Sketch launched")

    const p = {
        // objects
        mirrorInclination: -Math.PI / 4,
        // planets 
        moonScale: 2,
        moonPos: new THREE.Vector3(0, 9, 0),
        moonSpeed: 0.7,
        moonRotationSpeed: 0.02,
        // view
        lookAtCenter: new THREE.Vector3(0, 1.2, 0),
        cameraPosition: new THREE.Vector3(-1, 0.5, -5.5),
        autoRotate: false,
        autoRotateSpeed: -0.2,
        camera: 35,
        steadyCam: true,
        // world
        background: new THREE.Color(0x000000),
        floor: 0
    }

    // other parameters
    let near = 0.2, far = 2500
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
        // composer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onWindowResize)

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 3
    controls.maxDistance = 7
    controls.maxPolarAngle = Math.PI / 2 + .1
    controls.minPolarAngle = 0
    controls.autoRotate = p.autoRotate
    controls.autoRotateSpeed = p.autoRotateSpeed
    controls.target = p.lookAtCenter

    // SCENE
    scene = new THREE.Scene()
    scene.background = p.background
    scene.fog = new THREE.Fog(scene.background, 1, 10)

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

    // let's make a ground
    groundGeom = new THREE.PlaneGeometry(20, 20)
    let ground = new THREE.Mesh(groundGeom, groundMate)
    ground.position.set(0, p.floor, 0)
    ground.rotation.x = - Math.PI / 2
    ground.scale.set(100, 100, 100)
    ground.castShadow = false
    ground.receiveShadow = true
    scene.add(ground)

    let moonGlassGeom = new THREE.IcosahedronGeometry(.5, 0)
    let moonGlassMaterial =  new THREE.MeshPhysicalMaterial({
        // transmission: 1,
        // // opacity: .1,
        // // transparent: true,
        // thickness: .1,
        // roughness: 0.07,
        // envMap: cubeTextures[0].texture,
        // envMapIntensity: 1.5

        // color: 0x000000,
        envMap: cubeTextures[0].texture,
        // reflectivity: 1.0,
        transmission: 1.0,
        roughness: 0.0,
        // metalness: 0.1,
        // clearcoat: 0.1,
        // clearcoatRoughness: 0.01,
        // ior: 1,
        thickness: .2,
        fog: true,
       side: THREE.DoubleSide
    })
    let moonGlass= new THREE.Mesh(moonGlassGeom, moonGlassMaterial)
    // moonGlass.scale.set(p.moonScale+1, p.moonScale+1, p.moonScale+1)
    moonGlass.position.z = -2
    moonGlass.position.x = 1
    moonGlass.position.y = .2
    moonGlass.rotation.z = .2
    moonGlass.castShadow = true
    scene.add(moonGlass)

    // moon
    let moon
    geometry = new THREE.SphereGeometry(1, 48, 48)
    dispMap = textures[4].texture
    material2 = new THREE.MeshPhysicalMaterial({
        //color: 0xFFFFFF, 
        color: 0xffffff,
        //opacity: 0.5 ,
        transmoon: false,
        map: textures[3].texture,
        envMap: cubeTextures[0].texture,
        combine: THREE.addOperation,
        displacementMap: dispMap,
        displacementScale: 0.02,
        displacementBias: 0.0,
        bumpMap: dispMap,
        bumpScale: 0.01,
        roughness: 0.01,
        metalness: 1,
        shininess: 100,
        reflectivity: 1,
        transmission: 0.5,
       // thickness: .2,
        metalness: 0,
        fog: false
    })
    dispMap.wrapS = dispMap.wrapT = THREE.RepeatWrapping
    // dispMap.repeat.set(1, 1)
    moon = new THREE.Mesh(geometry, material2)
    moon.scale.set(p.moonScale, p.moonScale, p.moonScale)
    moon.rotation.x = Math.PI / 2
    moon.position.copy(p.moonPos)
    moon.castShadow = true
    moon.receiveShadow = true
    scene.add(moon)
   
   
    // LIGHTS
    


    // Stars field
    const stars = [];
    const starCount = window.innerWidth * 6;
    for (let i = 0; i < starCount; i++) {
        const distance = 8 + Math.random() * 50;
        const angle = Math.random() * Math.PI * 2;
        const z = (Math.random() - 0.5) * 2 * distance;
        const x = Math.cos(angle) * Math.sqrt(distance * distance - z * z);
        const y = Math.sin(angle) * Math.sqrt(distance * distance - z * z);
        stars.push(x, y, z);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(stars, 3)
    );
    const starMaterial = new THREE.PointsMaterial({
        size: 0.1,
        color: 0xffffff,
        fog: false,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // REFLECTOR
    let mirrorW = .7
    let mirrorH = 3
    mirrorBack = new Reflector(
        new THREE.PlaneGeometry(mirrorW, mirrorH),
        {
            // clipBias: 0.003,
            color: new THREE.Color(0x7f7f7f),
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
        })
    mirrorBack.rotation.x = p.mirrorInclination + Math.PI / 2
    mirrorBack.position.y = p.floor + 0.05 + .22
    mirrorBack.position.z = 0
    mirrorBack.rotation.y = Math.PI
    mirrorBack.rotation.z = Math.PI / 2
    scene.add(mirrorBack)
    // let's make the mirror backside to do a shadow
    reflectorBackGeom = new THREE.PlaneGeometry(mirrorW, mirrorH)
    let reflectorBack = new THREE.Mesh(reflectorBackGeom, mirrorMate)
    reflectorBack.rotation.x = p.mirrorInclination + Math.PI / 2
    reflectorBack.position.y = p.floor + 0.04 + .22
    reflectorBack.position.z = 0
    reflectorBack.rotation.y = Math.PI
    reflectorBack.castShadow = true
    reflectorBack.rotation.z = Math.PI / 2
    scene.add(reflectorBack)
    // let's make some light below the mirror...
    RectAreaLightUniformsLib.init();
    let rectLightIntensity = 30
    const rectLight = new THREE.RectAreaLight(0xffffff, rectLightIntensity, mirrorW + 0.025, mirrorH + 0.025)
    rectLight.position.set(0, p.floor + 0.045 + .22, 0)
    rectLight.rotation.x = p.mirrorInclination + Math.PI / 2
    rectLight.rotation.z = Math.PI / 2
    scene.add(rectLight)
    const rectLightHelper = new RectAreaLightHelper(rectLight)
    rectLight.add(rectLightHelper)


    const ambientLight = new THREE.AmbientLight(0xffffff)
    // scene.add(ambientLight)

    // LIGHTS
    let lightS = new THREE.SpotLight(0x999999, 1, 0, Math.PI / 5, 0.5)
    lightS.position.set(1, 50, 0)
    lightS.target.position.set(0, 0, 0)
    lightS.castShadow = true
    lightS.shadow.camera.near = 5
    lightS.shadow.camera.far = 500
    lightS.shadow.bias = 0.0001
    lightS.shadow.mapSize.width = shadowMapWidth
    lightS.shadow.mapSize.height = shadowMapHeight
    scene.add(lightS)

    // const light = new THREE.DirectionalLight(0xffffff, 1)
    // light.position.set(-10, 3, 0)
    // light.target.position.set(-10, 0, 0)
    // // light.castShadow = true
    // scene.add(light)
    // const light2 = new THREE.DirectionalLight(0xffffff, .4)
    // light.position.set(-10, 3, 0)
    // light.target.position.set(-5, 0, 0)
    // light.castShadow = true
    // scene.add(light2)
    const pointLight = new THREE.PointLight(0xffffff, 2)
    pointLight.position.set(-70, 10, 20)
    scene.add(pointLight)
    const pointLight2 = new THREE.PointLight(0xffffff, .1)
    pointLight2.position.set(-30, 20, -20)
    scene.add(pointLight2)
    // const ambientLight = new THREE.AmbientLight(0xffffff)
    // scene.add(ambientLight)

    const steadycamFlowSpeed = .02; // Adjust this value to change the speed of the steadycam flow
    const steadycamFlowAmplitude = 0.01; // Adjust this value to change the amplitude of the steadycam flow
    let steadycamFlowTime = 0;
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    const steadycamBounds = {
        x: { min: -2.5, max: 2.5 },
        y: { min: 0, max: 1.5 },
        z: { min: -15, max: -4 }
    };

    // NOISE
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
            if (moon) {
                const t1 = t * p.moonSpeed
                moon.position.x = p.moonPos.x + noise3D(0, t1, 0) * .1
                moon.position.y = p.moonPos.y + noise3D(t1 + 4, 0, 0) * .2
                moon.position.z = p.moonPos.z + noise3D(0, 0, t1 + 8) * .1
                moon.rotation.y += noise3D(0, 0, t + 10) * p.moonRotationSpeed
                starField.rotation.y -= noise3D(0, 0, t + 10) * p.moonRotationSpeed * .1
                // moonGlass.position.copy(moon.position)
            }
            // ...

            // Update steadycam flow time
            steadycamFlowTime += dt * steadycamFlowSpeed;

            // Calculate steadycam flow offsets using noise functions
            const steadycamFlowX = noise3D(steadycamFlowTime, 0, 0) * steadycamFlowAmplitude;
            const steadycamFlowY = noise3D(0, steadycamFlowTime, 0) * steadycamFlowAmplitude;
            const steadycamFlowZ = noise3D(0, 0, steadycamFlowTime) * steadycamFlowAmplitude;

            // Apply steadycam flow to camera position if not in drag mode
            if (!controls.isDragging && p.steadyCam) {
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
    geometry?.dispose()
    moonGeometry?.dispose()
    groundGeom?.dispose()
    material?.dispose()
    material2?.dispose()
    groundMate?.dispose()
    dispMap?.dispose()
    noise3D = null
    window.removeEventListener('resize', onWindowResize)
}