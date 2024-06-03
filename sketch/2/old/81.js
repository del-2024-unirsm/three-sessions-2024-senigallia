// PROVA TESSUTO RIGIDO SOPRA PALLA



import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

let scene
let groundGeom
let groundMate
let material
let animation
let onWindowResize
let world
let controls
let composer
let renderPass
let bloomPass
const pieceMaterials = []

export function sketch() {
    // console.log("Sketch launched")

    const p = {
        // start
        fromSky: false,
        slowBuild: true,
        slowBuildDelay: 1, // sec
        pauseAfterBuild: true,
        pauseAfterBuildTime: 20, // sec

        // columns
        columnsNo: 8,
        columnsRadius: 12,// + Math.random() * 2,
        piecesNo: 11, // no of pieces per columns
        piaceMaxSize: 0.9,// + Math.random() * .3, // piece Max radius
    
        // view
        lookAtCenter: new THREE.Vector3(Math.random() * -4, 4, Math.random() * 4),
        cameraPosition: new THREE.Vector3(0, 0.5, 0), // < z will be recalculated based on columnRadius/2
        autoRotate: true,
        autoRotateSpeed: -1 + Math.random() * 2,
        camera: 75,
        // bloom
        exposure: 0.5,
        bloomStrength: 2,
        bloomThreshold: .2,
        bloomRadius: .7,
        // world
        gravity: -5.0,
        floor: -1,
    }

    // other parameters
    let near = 0.2, far = 1000
    let shadowMapWidth = 2048, shadowMapHeight = 2048
    let paused = false

    // CAMERA
    let camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far)
    camera.position.copy(p.cameraPosition)
    camera.position.z = - p.columnsRadius / 2
    camera.lookAt(p.lookAtCenter)

    // WINDOW RESIZE
    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onWindowResize)

    // SCENE
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    scene.fog = new THREE.Fog(scene.background, 15, 100)
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, p.gravity, 0)
    })

    // POST-PROCESSING
    composer = new EffectComposer(renderer)
    renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = p.bloomThreshold
    bloomPass.strength = p.bloomStrength
    bloomPass.radius = p.bloomRadius
    composer.addPass(bloomPass)

    // Static ground plane
    groundGeom = new THREE.PlaneGeometry(50, 50)
    groundMate = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.1 })
    let ground = new THREE.Mesh(groundGeom, groundMate)
    ground.position.set(0, p.floor, 0)
    ground.rotation.x = - Math.PI / 2
    ground.scale.set(100, 100, 100)
    ground.castShadow = false
    ground.receiveShadow = true
    scene.add(ground)
    const groundBody = new CANNON.Body({
        position: new CANNON.Vec3(0, p.floor, 0),
        mass: 0,
        shape: new CANNON.Plane(),
    })
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    world.addBody(groundBody)
    ground.position.copy(groundBody.position)
    ground.quaternion.copy(groundBody.quaternion)

    // LIGHTS
    let lightS = new THREE.SpotLight(0xffffff, 2, 200, Math.PI / 5, 0.1)
    lightS.position.set(0, 50, 0)
    lightS.target.position.set(0, 0, 0)
    lightS.castShadow = true
    lightS.shadow.camera.near = 5
    lightS.shadow.camera.far = 200
    lightS.shadow.bias = 0.0001
    lightS.shadow.mapSize.width = shadowMapWidth
    lightS.shadow.mapSize.height = shadowMapHeight
    scene.add(lightS)

    const light = new THREE.DirectionalLight(0xffffff, 0.5)
    light.position.set(-4, 4, 0)
    light.target.position.set(0, 10, 10)
    scene.add(light)
    
    const pointLight2 = new THREE.PointLight(0xffffff, 0.5)
    pointLight2.position.set(0, 2, 0)
    scene.add(pointLight2)

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 10
    controls.maxDistance = 25
    controls.maxPolarAngle = Math.PI / 2 + 0.2
    controls.minPolarAngle = Math.PI / 2 - 0.4
    controls.autoRotate = p.autoRotate
    controls.autoRotateSpeed = p.autoRotateSpeed
    controls.target = p.lookAtCenter

    // Create a red sphere
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
    const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.set(0, 0, 0)
    scene.add(sphere)

    // Create a cloth above the sphere
    const clothSize = 5
    const clothSegments = 20
    const clothGeometry = new THREE.PlaneGeometry(clothSize, clothSize, clothSegments, clothSegments)
    const clothMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    const cloth = new THREE.Mesh(clothGeometry, clothMaterial)
    cloth.position.set(0, 2, 0) // Position the cloth above the sphere
    scene.add(cloth)

    // Physics for the cloth
    const clothBodies = []
    const mass = 0.1
    const restDistance = clothSize / clothSegments
    const clothParticles = []

    for (let i = 0; i <= clothSegments; i++) {
        clothParticles.push([])
        for (let j = 0; j <= clothSegments; j++) {
            const particle = new CANNON.Body({
                mass: mass,
                position: new CANNON.Vec3(
                    i * restDistance - clothSize / 2,
                    2,
                    j * restDistance - clothSize / 2
                ),
                shape: new CANNON.Particle(),
                velocity: new CANNON.Vec3(0, 0, 0)
            })
            clothParticles[i].push(particle)
            world.addBody(particle)
            clothBodies.push(particle)
        }
    }

    const DISTANCE_CONSTRAINT = (i1, j1, i2, j2) => {
        const particleA = clothParticles[i1][j1]
        const particleB = clothParticles[i2][j2]
        const distance = particleA.position.distanceTo(particleB.position)
        world.addConstraint(new CANNON.DistanceConstraint(particleA, particleB, distance))
    }

    for (let i = 0; i < clothSegments; i++) {
        for (let j = 0; j < clothSegments; j++) {
            DISTANCE_CONSTRAINT(i, j, i, j + 1)
            DISTANCE_CONSTRAINT(i, j, i + 1, j)
            if (i < clothSegments && j < clothSegments) {
                DISTANCE_CONSTRAINT(i, j, i + 1, j + 1)
                DISTANCE_CONSTRAINT(i + 1, j, i, j + 1)
            }
        }
    }

    // Initialize the vertices of the cloth
    const vertices = []
    for (let i = 0; i <= clothSegments; i++) {
        for (let j = 0; j <= clothSegments; j++) {
            vertices.push(new THREE.Vector3())
        }
    }
    clothGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices.length * 3), 3))

    // ANIMATE
    const timeStep = 1 / 60 // seconds
    let lastCallTime
    const animate = () => {
        if (showStats) stats.begin() // XXX

        // ANIMATION
        if (!paused) {
            const time = performance.now() / 1000 // seconds
            if (!lastCallTime) {
                world.step(timeStep)
            } else {
                const dt = time - lastCallTime
                world.step(timeStep, dt)
            }
            lastCallTime = time

            // Update cloth vertices
            const positions = clothGeometry.attributes.position.array
            for (let i = 0; i <= clothSegments; i++) {
                for (let j = 0; j <= clothSegments; j++) {
                    const particle = clothParticles[i][j]
                    const index = (i * (clothSegments + 1) + j) * 3
                    positions[index] = particle.position.x
                    positions[index + 1] = particle.position.y
                    positions[index + 2] = particle.position.z
                }
            }
            clothGeometry.attributes.position.needsUpdate = true
        }

        bloomPass.strength = MIC.getHighsVol(1.5, 5)

        controls.update()
        renderer.render(scene, camera) // RENDER
        composer.render() // POST-PROCESSING
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
    pieceGeometry?.dispose()
    material?.dispose()
    for (let i = 0; i < pieceMaterials.length; i++) {
        pieceMaterials[i]?.dispose()
    }
    world = null
    let id = window.setTimeout(function () { }, 0)
    while (id--) {
        window.clearTimeout(id)
    }
    composer?.dispose()
    renderPass?.dispose()
    bloomPass?.dispose()
    window?.removeEventListener('resize', onWindowResize)
    //XXX DISPOSE BLOOM
}
