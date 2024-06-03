// Empty sketch
let onWindowResize //

export function sketch() {
    // console.log("Set launched")

    // CAMERA
    let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 5

    // WINDOW RESIZE
    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onWindowResize)

    // SCENE
    const scene = new THREE.Scene()

    // RENDER EMPTY
    renderer.render(scene, camera) // RENDER
}

export function dispose() {
    window?.removeEventListener('resize', onWindowResize)
}