//PROVA DI VETTORI SFERE

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

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
        autoRotate: true,
        autoRotateSpeed: -2,
        camera: 35,

        //SPHERE
        num_sphere: 1000,
        vector: new THREE.Vector3(0, 1, 0),
        gravityCenter: new THREE.Vector3(0, 0, 0),
        sphereRadius: 1,//0.5+Math.random()*5,
        tempVector: new THREE.Vector3(),

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
    const light = new THREE.PointLight(0xffffff, 10, 100)
    light.position.set(50, 50, 50)
    scene.add(light)


    //MATERIAL
    //material = new THREE.MeshPhongMaterial({ color: 0x3300ff, specular: 0x555555, shininess: 30 })
    material = new THREE.MeshStandardMaterial({
        color: 0xE33117,
        //emissive: 0xE33117,
        metalness: 0.7,
        roughness: 0.2
    })

    const num_sphere = p.num_sphere
    const vector = p.vector
    const gravityCenter = p.gravityCenter
    const sphereRadius = p.sphereRadius
    const tempVector = p.tempVector

    // INSTANCED MESH SETUP
    const geometry = new THREE.SphereGeometry(sphereRadius, 16, 16)
    const instancedMesh = new THREE.InstancedMesh(geometry, material, num_sphere)
    scene.add(instancedMesh)

    // BUFFERS
    const positions = new Float32Array(num_sphere * 3)
    const velocities = new Float32Array(num_sphere * 3)
    const quaternions = new Float32Array(num_sphere * 4)

    // INITIALIZATION
    for (let i = 0; i < num_sphere; i++) {
        const index = i * 3
        positions[index] = Math.random() * 400 - 200
        positions[index + 1] = Math.random() * 400 - 200
        positions[index + 2] = Math.random() * 400 - 200

        velocities[index] = Math.random() * 2 - 1
        velocities[index + 1] = Math.random() * 2 - 1
        velocities[index + 2] = Math.random() * 2 - 1

        const quaternion = new THREE.Quaternion()
        quaternion.setFromAxisAngle(vector, Math.random() * 2 * Math.PI)
        quaternion.toArray(quaternions, i * 4)
    }

    // UPDATE FUNCTION
    function update(deltaTime) {
        for (let i = 0; i < num_sphere; i++) {
            const index = i * 3
            const pos = new THREE.Vector3(positions[index], positions[index + 1], positions[index + 2])
            const vel = new THREE.Vector3(velocities[index], velocities[index + 1], velocities[index + 2])

            // Apply gravity towards the center
            tempVector.copy(gravityCenter).sub(pos).normalize().multiplyScalar(0.1)
            vel.add(tempVector)

            // update positions
            pos.add(vel.multiplyScalar(deltaTime*20))

            // Store updated positions and velocities
            pos.toArray(positions, index)
            vel.toArray(velocities, index)

            // update instance matrix
            const quaternion = new THREE.Quaternion()
            quaternion.setFromAxisAngle(vector, Math.atan2(vel.z, vel.x))
            instancedMesh.setMatrixAt(i, new THREE.Matrix4().compose(pos, quaternion, new THREE.Vector3(1, 1, 1)))
        }
        instancedMesh.instanceMatrix.needsUpdate = true
    }

    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin()

        // Calculate deltaTime
        const currentTime = performance.now()
        const deltaTime = (currentTime - lastTime) / 1000
        lastTime = currentTime

        update(deltaTime)

        controls.update()
        renderer.render(scene, camera)

        if (showStats) stats.end()

        animation = requestAnimationFrame(animate)
    }

    // Initial setvector
    let lastTime = performance.now()
    animate()
}

export function dispose() {
    cancelAnimationFrame(animation)
    controls?.dispose()
    window.removeEventListener('resize', onWindowResize)
}
