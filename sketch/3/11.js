
// Planets + DiffisionMap + Noise
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { LoopSubdivision } from 'three-subdivide'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';




let scene
let geometry, groundGeom, parentGeometry
let mirrorBack
let material, material2, groundMate
let reflectionCube, dispMap
let animation
let onWindowResize
let noise3D
let controls
let composer
let bloomPass

export function sketch() {
    // console.log("Sketch launched")

    const p = {
        // planets 
        parentScale: 2,
        childScale: 1,
        parentPos: new THREE.Vector3(0, 3, 0),
        childPos: new THREE.Vector3(6, 1.5, 0),
        parentSpeed: 0.07,
        childSpeed: 1,
        parentRotationSpeed: 0.02,
        childLight: false,
        // view
        lookAtCenter: new THREE.Vector3(0, 1, 0),
        cameraPosition: new THREE.Vector3(Math.random() * -7, -4, 0),
        autoRotate: false,
        autoRotateSpeed: -0.2,
        camera: 35, 
        // world
        floor: 0.5
    }

    // other parameters
    let near = 0.2, far = 1000
    let shadowMapWidth = 2048, shadowMapHeight = 2048

    // CAMERA
    /*let camera = new THREE.PerspectiveCamera(-5, window.innerWidth / window.innerHeight, near, far)
    //camera.position.copy(p.cameraPosition)
    camera.lookAt(p.lookAtCenter)*/
    let camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far)
    camera.position.copy(p.cameraPosition)
    camera.position.set(1, 6 , 6)
    camera.rotation.y = Math.PI / 2;
    camera.rotation.z = Math.PI / 2;
    camera.lookAt(p.lookAtCenter)

     

    // WINDOW RESIZE
    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        composer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onWindowResize)

        // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 3
    controls.maxDistance = 30
    controls.maxPolarAngle = Math.PI
    controls.minPolarAngle = 0
    controls.autoRotate = p.autoRotate
    controls.autoRotateSpeed = p.autoRotateSpeed
    controls.target = p.lookAtCenter

    // SCENE
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
   // scene.fog = new THREE.Fog(scene.background, 5, 100)
    geometry = new THREE.SphereGeometry(1, 32, 32)
    

    // child
    let child
    material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        //envMap: cubeTextures[4].texture,
        reflectivity: 1.0,
        transmission: 1.0,
        roughness: 0.0,
        metalness: 0.2,
        clearcoat: 0.2,
        clearcoatRoughness: 0.0,
        ior: 1.5,
        thickness: 4,
        //fog: false,
        side: THREE.DoubleSide
    })
    
    // parent
    const iterations = 4
    parentGeometry = LoopSubdivision.modify(geometry, iterations, {
        split: false,
        uvSmooth: true,
        preserveEdges: false,
        flatOnly: false,
        maxTriangles: 5000
    })
    mergeVertices(parentGeometry)
    let parent
    dispMap = textures[2].texture, 
    material2 = new THREE.MeshPhysicalMaterial({
        //color: 0xFFFFFF, 
        color: 0x9c9c9c,
        //opacity: 0.5 ,
        transparent: false,
        map: textures[0].texture,
        displacementMap: dispMap,
        displacementScale: 0.02,
        displacementBias: 0.0,
        bumpMap: dispMap,
        bumpScale: 0.01,
        roughness: 0.01,
        metalness: 0
      
       
    })
    dispMap.wrapS = dispMap.wrapT = THREE.RepeatWrapping
    dispMap.repeat.set(1, 1)
    parent = new THREE.Mesh(parentGeometry, material2)
    parent.position.y = 5
    parent.position.x = -3
    parent.rotation.x = Math.PI / 8;

    parent.scale.set(p.parentScale, p.parentScale, p.parentScale)
    parent.castShadow = true
    parent.receiveShadow = true
    scene.add(parent)
    // LIGHTS
    
    const ambientLight = new THREE.AmbientLight(0xffffff)
    scene.add(ambientLight) 

    // LIGHTS
    /*let lightS = new THREE.SpotLight(0x999999, 1, 0, Math.PI / 5, 0.5)
    lightS.position.set(1, 50, 0)
    lightS.target.position.set(0, 0, 0)
    lightS.castShadow = true
    lightS.shadow.camera.near = 5
    lightS.shadow.camera.far = 500
    lightS.shadow.bias = 0.0001
    lightS.shadow.mapSize.width = shadowMapWidth
    lightS.shadow.mapSize.height = shadowMapHeight
    scene.add(lightS)*/
 
    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(-10, 3, 0)
    light.target.position.set(-10, 0, 0)
    // light.castShadow = true
    scene.add(light)
    // const light2 = new THREE.DirectionalLight(0xffffff, .4)
    // light.position.set(-10, 3, 0)
    // light.target.position.set(-5, 0, 0)
    // light.castShadow = true
    // scene.add(light2)
    const pointLight = new THREE.PointLight(0xffffff, 2)
    pointLight.position.set(70, 10, 20)
    scene.add(pointLight)
    const pointLight2 = new THREE.PointLight(0xffffff, .1)
    pointLight2.position.set(-30, 20, -20)
    scene.add(pointLight2)
    // const ambientLight = new THREE.AmbientLight(0xffffff)
    // scene.add(ambientLight)
 
    /*let's make a ground
    groundGeom = new THREE.PlaneGeometry(20, 20)
    groundMate = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 1 })
    let ground = new THREE.Mesh(groundGeom, groundMate)
    ground.position.set(0, p.floor, 0)
    ground.rotation.x = - Math.PI / 2
    ground.scale.set(100, 100, 100)
    ground.castShadow = false
    ground.receiveShadow = true
    scene.add(ground) */

    // Pavimento specchiato
let mirrorW = .7
let mirrorH = 3
const mirrorGeometry = new THREE.PlaneGeometry(mirrorW, mirrorH);
mirrorBack = new Reflector(mirrorGeometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0x7f7f7f

});
mirrorBack.position.set(0, p.floor, 0);
mirrorBack.rotation.x = -Math.PI / 2;
mirrorBack.scale.set(100, 100, 100);
scene.add(mirrorBack)


   // NOISE
    noise3D = NOISE.createNoise3D()
    const t0 = Math.random() * 10

    function initPostProcessing() {
        const renderPass = new RenderPass(scene, camera);

        const bloomParams = {
            exposure: 0,
            bloomStrength: 0.0,
            bloomThreshold: 0.0,
            bloomRadius: 0
        };
        bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            bloomParams.bloomStrength,
            bloomParams.bloomRadius,
            bloomParams.bloomThreshold
        );

        composer = new EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(bloomPass);
    }

    initPostProcessing();



    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin() // XXX

        const t = t0 + performance.now() * 0.0001

        // ANIMATION
        if (parent) {
            const t1 = t * p.parentSpeed
            parent.position.x = p.parentPos.x + noise3D(0, t1, 0) * .2
            parent.position.y = p.parentPos.y + noise3D(t1 + 4, 0, 0) * .3
            parent.position.z = p.parentPos.z + noise3D(0, 0, t1 + 8) * .1
            //parent.rotation.y += noise3D(0, 0, t + 10) * p.parentRotationSpeed
            parent.rotation.y = Math.PI / 100;
        }
        if (child) {
            const t2 = t * p.childSpeed + 10
            child.position.x = p.childPos.x + noise3D(0, t2, 0) * .5
            child.position.y = p.childPos.y + noise3D(t2 + 4, 0, 0) * 1.5
            child.position.z = p.childPos.z + noise3D(0, 0, t2 + 8) * .4
            if (p.childLight) pointLight.position.copy(child.position)
        }
        // ...
 
        controls.update()
        //renderer.render(scene, camera) // RENDER
        composer.render();
        if (showStats) stats.end() // XXX
   

        animation = requestAnimationFrame(animate) // CIAK
    }
    animate()
}

export function dispose() {
    cancelAnimationFrame(animation)
    controls?.dispose()
    geometry?.dispose()
    parentGeometry?.dispose()
    groundGeom?.dispose()
    material?.dispose()
    material2?.dispose()
    groundMate?.dispose()
    reflectionCube?.dispose()
    dispMap?.dispose()
    noise3D = null
    window.removeEventListener('resize', onWindowResize)
}