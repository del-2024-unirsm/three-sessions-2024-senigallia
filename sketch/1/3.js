// TANGO

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

let scene, camera, animation
let light1, light2
let onWindowResize, controls, onPostStep
let world
let noise3D
let directorTimeOut
const sphereMeshes = []
const sphereBodies = []


export function sketch() {
    // PARAMETERS
    const p = {
        // spheres
        numSpheres: 100,
        minSphereRadius: .5,
        maxSphereRadius: 2,
        // camera
        lookAtCenter: new THREE.Vector3(0, 0, 0),
        cameraPosition: new THREE.Vector3(25, -25, Math.random() * 75),
        autoRotate: true,
        autoRotateSpeed: -10 + Math.random() * 20,
        camera: 35,
    }

    // CAMERA
    let near = 0.2, far = 1000
    camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth /
        window.innerHeight, near, far)
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
    controls.dampingFactor = 0.005
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
    const light = new THREE.PointLight(0xffffff, 5 * PI)
    light.position.set(-10, 10, 10)
    light.castShadow = true
    light.shadow.mapSize.width = 1024
    light.shadow.mapSize.height = 1024
    light.shadow.camera.near = 0.5
    light.shadow.camera.far = 20
    light.decay = 0
    scene.add(light)

    light1 = new THREE.SpotLight(0xE33117, 5 * PI)
    light1.position.set(10, 5, 5)
    // light1.angle = Math.PI / 4
    // light1.penumbra = 0.5
    light1.decay = 0
    scene.add(light1)

    light2 = new THREE.SpotLight(0xE33117, 3 * PI)
    light2.position.set(-5, 5, 5)
    // light2.angle = Math.PI / 4
    // light2.penumbra = 0.5
    light2.castShadow = true
    light2.shadow.mapSize.width = 1024
    light2.shadow.mapSize.height = 1024
    light2.shadow.camera.near = 0.5
    light2.shadow.camera.far = 20
    light2.decay = 0
    scene.add(light2)

    //CANNON WORD
    world = new CANNON.World()
    world.gravity.set(0, -1, 0) // setting minimal gravity otherwise you lose friction calculations

    //MATERIAL
    //material = new THREE.MeshPhongMaterial({ 
    // color: 0x3300ff, specular:
    // 0x555555, shininess: 30
    // })
    // material = new THREE.MeshStandardMaterial({
    // color: 0xE33117,
    // emissive: 0xE33117,
    // metalness: 0.7,
    // roughness: 0.2
    // })

    // material = new THREE.MeshStandardMaterial({
    // envMap: cubeTextures[0].texture,
    // color: 0xE33117,
    // emissive: 0xE33117,
    // metalness: 0.7,
    // roughness: 0.2,
    // transparent: true, // Abilita la trasparenza
    // opacity: 0.8 // Imposta il livello di trasparenza (0.5 è un esempio, puoi modificarlo come preferisci)
    // });

    const material = new THREE.MeshPhysicalMaterial({
        envMap: cubeTextures[0].texture,
        color: 0xffffff,
        metalness: 0,
        roughness: .1,
        transmission: 1,
        thickness: 1,
        flatShading: true,
        specultarIntensity: 1,
        specularColor: 0xffffff,
        ior: 1.5,
    });

    const centralMate = new THREE.MeshPhysicalMaterial({
        envMap: cubeTextures[0].texture,
        color: 0xE33117,
        // emissive: 0xE33117,
        metalness: 0.7,
        roughness: 0.2,
        transparent: true, // Abilita la trasparenza
        opacity: 0.8 // Imposta il livello di trasparenza (0.5 è un esempio, puoi modificarlo come preferisci)
    });

    const sphereCenterRadius = 5
    const sphereCenterGeom = new THREE.SphereGeometry(sphereCenterRadius, 32, 32)
    const sphereCenter = new THREE.Mesh(sphereCenterGeom, centralMate)
    sphereCenter.position.x = 0
    sphereCenter.position.y = 0
    sphereCenter.position.z = 0
    sphereCenter.castShadow = true
    sphereCenter.receiveShadow = true
    scene.add(sphereCenter)
    const sphereCenterShape = new CANNON.Sphere(sphereCenterRadius, 32, 32)
    const sphereCenterBody = new CANNON.Body({ mass: 0 })
    sphereCenterBody.addShape(sphereCenterShape)
    sphereCenterBody.position.x = 0
    sphereCenterBody.position.y = 0
    sphereCenterBody.position.z = 0

    // Add random angular velocity
    const randomAngularVelocity = new CANNON.Vec3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
    )
    sphereCenterBody.angularVelocity.set(randomAngularVelocity.x,
        randomAngularVelocity.y, randomAngularVelocity.z)

    // Set angular damping
    sphereCenterBody.angularDamping = 0.1

    world.addBody(sphereCenterBody)

    for (let s = 0; s < p.numSpheres; s++) {
        const sphereRadius = p.minSphereRadius + Math.random() *
            (p.maxSphereRadius - p.minSphereRadius)

        const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 8, 8)
        sphereMeshes.push(new THREE.Mesh(sphereGeometry, material))
        sphereMeshes[s].position.x = -50 + Math.random() * 100
        sphereMeshes[s].position.y = -50 + Math.random() * 100
        sphereMeshes[s].position.z = -50 + Math.random() * 100
        sphereMeshes[s].castShadow = true
        sphereMeshes[s].receiveShadow = true
        scene.add(sphereMeshes[s])

        const sphereShape = new CANNON.Sphere(sphereRadius, 8, 8)
        sphereBodies.push(new CANNON.Body({ mass: sphereRadius, }))
        sphereBodies[s].addShape(sphereShape)
        sphereBodies[s].position.x = sphereMeshes[s].position.x
        sphereBodies[s].position.y = sphereMeshes[s].position.y
        sphereBodies[s].position.z = sphereMeshes[s].position.z

        // Add random velocity
        const randomVelocity = new CANNON.Vec3(
            -2.5 * Math.random() * 5,
            -2.5 * Math.random() * 5,
            -2.5 * Math.random() * 5
        )
        sphereBodies[s].velocity.set(randomVelocity.x, randomVelocity.y, randomVelocity.z)

        // Add random angular velocity
        const randomAngularVelocity = new CANNON.Vec3(
            -1 + Math.random() * 2,
            -1 + Math.random() * 2,
            -1 + Math.random() * 2
        )
        sphereBodies[s].angularVelocity.set(randomAngularVelocity.x, randomAngularVelocity.y, randomAngularVelocity.z)

        // Set angular damping
        sphereBodies[s].angularDamping = 0.9

        world.addBody(sphereBodies[s])
    }

    const explode = () => {
        sphereBodies.forEach((s) => {
            s.force.set(s.position.x, s.position.y, s.position.z).normalize()
            s.velocity = s.force.scale(Math.random() * 100)
        })
        directorTimeOut = setTimeout(explode, 5000 + Math.random() * 10000);
    }

    const playDirector = () => {
        directorTimeOut = setTimeout(explode, 10000);
    }
    playDirector()

    const clock = new THREE.Clock()
    let delta

    const v = new CANNON.Vec3()
    world.addEventListener('preStep', () => {
        sphereBodies.forEach((s, i) => {
            const v = new CANNON.Vec3()
            v.copy(sphereCenterBody.position)
            v.vsub(s.position, v)
            const distance = v.length()
            v.normalize()
            const forceMagnitude = 10000 / Math.pow(distance, 2)
            v.scale(forceMagnitude, v)
            s.applyForce(v, s.position)
        })
    })

    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin()

        delta = Math.min(clock.getDelta(), 0.1)
        world.step(delta)

        // Apply gravitational force to the central sphere
        // v.set(-sphereCenterBody.position.x, -sphereCenterBody.position.y, -sphereCenterBody.position.z).normalize()
        // v.scale(1, sphereCenterBody.force)
        // sphereCenterBody.applyLocalForce(v)
        // sphereCenterBody.force.y += sphereCenterBody.mass


        sphereCenter.position.set(sphereCenterBody.position.x, sphereCenterBody.position.y, sphereCenterBody.position.z)
        sphereCenter.quaternion.set(
            sphereCenterBody.quaternion.x,
            sphereCenterBody.quaternion.y,
            sphereCenterBody.quaternion.z,
            sphereCenterBody.quaternion.w
        )

        sphereBodies.forEach((s, i) => {

            // Aggiorna la posizione e la rotazione delle sfere
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
    camera = null
    sphereMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
    });
    sphereBodies.length = 0
    light1?.dispose()
    light2?.dispose()
    if (directorTimeOut)
     clearTimeout(directorTimeOut)
    // world = null
    noise3D = null
    window.removeEventListener('resize', onWindowResize)
}