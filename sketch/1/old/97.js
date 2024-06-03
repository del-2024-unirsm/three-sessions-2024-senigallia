//PROVA DI VETTORI SFERE

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GUI } from 'dat.gui'

let scene
let material, materialOne, materialTwo
let geometry, geoOne, geoTwo
let animation
let onWindowResize
let gui
let controls


export function sketch() {
    // PARAMETERS
    const p = {
        lookAtCenter: new THREE.Vector3(0, 0, 0),
        cameraPosition: new THREE.Vector3(25, -25, Math.random() * 75),
        autoRotate: false,
        autoRotateSpeed: 8,//-.5,
        camera: 35,

        //SPHERE
        // num_sphere: 1000,
        // vector: new THREE.Vector3(0, 1, 0),
        // gravityCenter: new THREE.Vector3(0, 0, 0),
        // sphereRadius: 0.5+Math.random()*5,
        // tempVector: new THREE.Vector3(),

    }

    // CAMERA
    let near = 0.2, far = 1000
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

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 + 0.2
    controls.minPolarAngle = Math.PI / 2 - 0.4
    controls.autoRotate = p.autoRotate
    controls.autoRotateSpeed = p.autoRotateSpeed
    controls.target = p.lookAtCenter
    controls.update()

    // SCENE
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    scene.fog = new THREE.Fog(scene.background, 100, 1000)

    // LIGHT
    // const light = new THREE.PointLight(0xffffff, 10, 100)
    // light.position.set(50, 50, 50)
    // scene.add(light)

    const light1 = new THREE.SpotLight(0xE33117, 50)
    light1.position.set(2.5, 5, 5)
    light1.angle = Math.PI / 4
    light1.penumbra = 0.5
    light1.castShadow = true
    light1.shadow.mapSize.width = 1024
    light1.shadow.mapSize.height = 1024
    light1.shadow.camera.near = 0.5
    light1.shadow.camera.far = 20
    scene.add(light1)

    const light2 = new THREE.SpotLight(0xE33117, 50)
    light2.position.set(-2.5, 5, 5)
    light2.angle = Math.PI / 4
    light2.penumbra = 0.5
    light2.castShadow = true
    light2.shadow.mapSize.width = 1024
    light2.shadow.mapSize.height = 1024
    light2.shadow.camera.near = 0.5
    light2.shadow.camera.far = 20
    scene.add(light2)

    //CANNON WORD
    const world = new CANNON.World()
    world.gravity.set(0, -1, 0) // setting minimal gravity otherwise you lose friction calculations

    const sphereMeshes = []
    const sphereBodies = []


    //MATERIAL
    //material = new THREE.MeshPhongMaterial({ color: 0x3300ff, specular: 0x555555, shininess: 30 })
    // material = new THREE.MeshStandardMaterial({
    //     color: 0xE33117,
    //     emissive: 0xE33117,
    //     metalness: 0.7,
    //     roughness: 0.2
    // })

    // material = new THREE.MeshStandardMaterial({
    //     envMap: cubeTextures[0].texture,
    //     color: 0xE33117,
    //     emissive: 0xE33117,
    //     metalness: 0.7,
    //     roughness: 0.2,
    //     transparent: true, // Abilita la trasparenza
    //     opacity: 0.8 // Imposta il livello di trasparenza (0.5 è un esempio, puoi modificarlo come preferisci)
    // });

    const material = new THREE.MeshPhysicalMaterial({
        envMap: cubeTextures[0].texture,
        color: 0xffffff,
        metalness: 0.5,
        roughness: 0,
        transmission: 0.7,
        transparent: true,
        thickness: 1.0,
        opacity: 0.8, 
        reflectivity: 1,
        clearcoat: 1,
        clearcoatRoughness: 0,
    });

    for (let x = 0; x < 300; x++) {
        const sphereRadius = 0.1+Math.random()*2
        const sphereGeometry = new THREE.SphereGeometry(sphereRadius)
        sphereMeshes.push(new THREE.Mesh(sphereGeometry, material))
        sphereMeshes[x].position.x = Math.random() * 100 - 50
        sphereMeshes[x].position.y = Math.random() * 100 - 50
        sphereMeshes[x].position.z = Math.random() * 100 - 50
        sphereMeshes[x].castShadow = true
        sphereMeshes[x].receiveShadow = true
        scene.add(sphereMeshes[x])
    
        const sphereShape = new CANNON.Sphere(sphereRadius)
        sphereBodies.push(new CANNON.Body({ mass: 1 }))
        sphereBodies[x].addShape(sphereShape)
        sphereBodies[x].position.x = sphereMeshes[x].position.x
        sphereBodies[x].position.y = sphereMeshes[x].position.y
        sphereBodies[x].position.z = sphereMeshes[x].position.z
        world.addBody(sphereBodies[x])
    }
    
    world.addEventListener('postStep', function () {
        // Gravity towards (0,0,0)
        sphereBodies.forEach((s) => {
            const v = new CANNON.Vec3()
            v.set(-s.position.x, -s.position.y, -s.position.z).normalize()
            v.scale(1, s.force)
            s.applyLocalForce(v)
            s.force.y += s.mass
        })
    })
    
    const explode = () => {
        sphereBodies.forEach((s) => {
            s.force.set(s.position.x, s.position.y, s.position.z).normalize()
            s.velocity = s.force.scale(Math.random() * 50)
        })
    }
    // XXX 


    const clock = new THREE.Clock()
    let delta

    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin()

        delta = Math.min(clock.getDelta(), 0.1)
        world.step(delta)

        sphereBodies.forEach((s, i) => {
        sphereMeshes[i].position.set(s.position.x, s.position.y, s.position.z)
        sphereMeshes[i].quaternion.set(
            s.quaternion.x,
            s.quaternion.y,
            s.quaternion.z,
            s.quaternion.w
        )
    })

        controls.update()
        renderer.render(scene, camera)

        if (showStats) stats.end()

        animation = requestAnimationFrame(animate)
    }

    animate()
}

export function dispose() {
    cancelAnimationFrame(animation)
    controls?.dispose()
    window.removeEventListener('resize', onWindowResize)
}
