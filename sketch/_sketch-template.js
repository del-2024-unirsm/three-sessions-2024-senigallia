import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

let scene
let materialOne, materialTwo
let geometry, geoOne, geoTwo
let animation
let onWindowResize
let gui
let controls

//

export function sketch() {
    // console.log("Sketch launched")

    // PARAMETERS
    const p = {
        // objects
        // ...
        // view
        lookAtCenter: new THREE.Vector3(0, 0, 0),
        cameraPosition: new THREE.Vector3(25, -25, Math.random() * 75),
        autoRotate: true,
        autoRotateSpeed: -.05,
        camera: 35,
        // ...
        // world
        // ...
    }

    // CAMERA
    // other parameters
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
    // controls.minDistance = 10
    // controls.maxDistance = 25
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
    // materials
    material = new THREE.MeshPhongMaterial({ specular: 0x000000, shininess: 1 })
    // ...
    // geometries
    // ...
    // lights
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

    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin() // XXX
        controls.update()

        // ANIMATION
        // ...

        renderer.render(scene, camera) // RENDER
        if (showStats) stats.end() // XXX

        animation = requestAnimationFrame(animate) // CIAK
    }
    animate()
}

export function dispose() {
    cancelAnimationFrame(animation)
    controls?.dispose()
    // geometry?.dispose()
    // material?.dispose()
    // gui?.destroy()
    // ...
    window.removeEventListener('resize', onWindowResize)
}