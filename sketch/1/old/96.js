import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import * as CANNON from 'cannon-es'

let scene
let animation
let onWindowResize
let controls
let groundMate

export function sketch() {
    // PARAMETERS
    const p = {
        // view
        lookAtCenter: new THREE.Vector3(0, 0, 0),
        cameraPosition: new THREE.Vector3(25, -25, Math.random() * 75),
        autoRotate: true,
        autoRotateSpeed: -0.05,
        camera: 35,
    }

    // CAMERA
    let near = 0.2, far = 1000
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
    
    // LIGHTS
    const light1 = new THREE.SpotLight(0xffffff, 300)
    light1.position.set(10, 10, -10)
    light1.angle = Math.PI / 4
    light1.penumbra = 0.5
    light1.castShadow = true
    light1.shadow.mapSize.width = 2048
    light1.shadow.mapSize.height = 2048
    light1.shadow.camera.near = 10
    light1.shadow.camera.far = 30
    light1.shadow.bias = 0.001
    scene.add(light1)

    const light2 = new THREE.SpotLight(0xffffff, 300)
    light2.position.set(-10, 10, -10)
    light2.angle = Math.PI / 4
    light2.penumbra = 0.5
    light2.castShadow = true
    light2.shadow.mapSize.width = 2048
    light2.shadow.mapSize.height = 2048
    light2.shadow.camera.near = 10
    light2.shadow.camera.far = 30
    light2.shadow.bias = 0.001
    scene.add(light2)

    // MATERIAL
    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.54,
        flatShading: true,
    })

    const groundColor = new THREE.Color(0xffffff)
    groundMate = new THREE.MeshStandardMaterial({
        color: groundColor,
        roughness: 1,
        metalness: 0,
        fog: true,
        transparent: true,
        opacity: .5

    })

    // PHYSICS WORLD
    const world = new CANNON.World()
    world.gravity.set(0, -9.82, 0)

    // // ADD INCLINED PLANE INSTEAD OF BOWL
    // const planeGeometry = new THREE.PlaneGeometry(20, 20, 32, 32)
    // // planeGeometry.vertices.forEach(vertex => {
    // //     // Move vertices upwards to create an inclined plane
    // //     vertex.z += Math.sin(vertex.x * 0.3) * 2
    // // })
    // const plane = new THREE.Mesh(planeGeometry, groundMate)
    // plane.receiveShadow = true
    // scene.add(plane)

    // Static ground plane
    const groundGeom = new THREE.PlaneGeometry(20, 20)
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

    // ADD SPHERES
    const ballCount = 100
    const sphereMesh = new Array()
    const sphereBody = new Array()
    for (let i = 0; i < ballCount; i++) {
        const sphereGeometry = new THREE.SphereGeometry(0.5, 8, 8)
        sphereMesh.push(new THREE.Mesh(sphereGeometry, material))
        sphereMesh[i].position.x = Math.random() * 10 - 5
        sphereMesh[i].position.y = i / 4 + 4
        sphereMesh[i].position.z = Math.random() * 10 - 5
        sphereMesh[i].castShadow = true
        sphereMesh[i].receiveShadow = true
        scene.add(sphereMesh[i])
        const sphereShape = new CANNON.Sphere(0.5)
        sphereBody.push(new CANNON.Body({ mass: 0.1 }))
        sphereBody[i].addShape(sphereShape)
        sphereBody[i].position.x = sphereMesh[i].position.x
        sphereBody[i].position.y = sphereMesh[i].position.y
        sphereBody[i].position.z = sphereMesh[i].position.z
        world.addBody(sphereBody[i])
    }

    
    const clock = new THREE.Clock()
    let delta

    const animate = () => {
        if (showStats) stats.begin();

        delta = clock.getDelta()
        if (delta > 0.1) delta = 0.1
        world.step(delta)

        for (let i = 0; i < ballCount; i++) {
            sphereMesh[i].position.set(
                sphereBody[i].position.x,
                sphereBody[i].position.y,
                sphereBody[i].position.z
            )
            sphereMesh[i].quaternion.set(
                sphereBody[i].quaternion.x,
                sphereBody[i].quaternion.y,
                sphereBody[i].quaternion.z,
                sphereBody[i].quaternion.w
            )
        }

        controls.update()
        renderer.render(scene, camera) // RENDER

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
