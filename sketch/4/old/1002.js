// TAROTS - SILVER SURFER

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';


let scene
let animation
let onWindowResize
let controls
let loaderGLTF
let mixer, action, actions, activeAction, previousAction
let groundGeom
let human, humanMate, groundMate
let noise3D
let rectLight, light, rectLightHelper

const api = { state: 'Walk' };

export function sketch() {
  // console.log("Sketch launched")

  // PARAMETERS
  const p = {
    // colors
    availableColorsHighlights: [
      0xE48CFF, // Violet
      0x4DFFFF, // Light blue
      0xffffff, // White
      0x0000FF, // Blue
      0xFFFF00, // Yellow
      0xFFF3D6, // Light Yellow
      0xFFCFC0, // Pink
      0xFF0000, // Red
      0x93FF22, // Light green
      0x00CF00, // Dark green
      // 0x000000  // Black
    ],
    availableColors: [
      0x532B5F, // Violet
      0x9eddec, // Light blue
      0xffffff, // White
      0x0140A6, // Blue
      0xFFC702, // Yellow
      0xFED374, // Light Yellow
      0xFACDA4, // Pink
      0xE33117, // Red
      0x92BE23, // Light green
      0x1E841E, // Dark green
      // 0x232323  // Black
    ],
    // objects
    lightSpeed: 1,
    // view
    lookAtCenter: new THREE.Vector3(0, 1.5, 0),
    cameraPosition: new THREE.Vector3(-2, 2, -4),
    autoRotate: false,
    autoRotateSpeed: -.05,
    camera: 35,
    // ...
    // world
    background: new THREE.Color(0xffffff),
    floor: 0,
    // ...
  }

  // select main scene color, random choose for now
  let whichColor = p.availableColors.length * Math.random() | 0
  p.background = new THREE.Color(p.availableColors[whichColor])

  // other parameters
  let near = 0.2, far = 200
  let shadowMapWidth = 2048, shadowMapHeight = 2048

  // CAMERA
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
  controls.minDistance = 5
  controls.maxDistance = 15
  controls.maxPolarAngle = Math.PI / 2
  controls.minPolarAngle = Math.PI / 2 - 0.2
  controls.maxAzimuthAngle = - Math.PI / 2
  controls.minAzimuthAngle = Math.PI / 2
  controls.autoRotate = p.autoRotate
  controls.autoRotateSpeed = p.autoRotateSpeed
  controls.target = p.lookAtCenter

  // SCENE
  scene = new THREE.Scene()
  scene.background = p.background
  scene.fog = new THREE.Fog(scene.background, 10, 30)

  // MATERIALS
  humanMate = new THREE.MeshStandardMaterial({
    color: p.background,
    envMap: cubeTextures[0].texture,
    roughness: .2,
    metalness: 1,
    fog: true,
    flatShading: false,
  })
  groundMate = new THREE.MeshStandardMaterial({
    color: p.background,
    roughness: 1,
    metalness: 0,
    fog: true,
  })

  // GROUND
  // let's make a ground
  groundGeom = new THREE.PlaneGeometry(20, 20)
  let ground = new THREE.Mesh(groundGeom, groundMate)
  ground.position.set(0, p.floor, 0)
  ground.rotation.x = - Math.PI / 2
  ground.scale.set(100, 100, 100)
  ground.castShadow = false
  ground.receiveShadow = true
  scene.add(ground)

  //
  // Let's load our low poly human
  //GLTFLoader
  let gltfLoaded = false
  loaderGLTF = new GLTFLoader()
  loaderGLTF.load(
    // resource URL
    './assets/models/human-pose/Orlando_pose_threejs.glb',
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
      human = gltf.scene
      // human.scale.set(1.5, 1.5, 1.5)
      human.scale.set(1.7, 1.7, 1.7)
      const box = new THREE.Box3().setFromObject(human);
      const size = box.getSize(new THREE.Vector3());
      human.traverse((node) => {
        if (node.isMesh) {
          node.material = humanMate
          node.castShadow = true
          node.receiveShadow = true
        }
      })
      human.position.y = p.floor
      human.position.z = 2
      human.rotation.y = Math.PI
      // animations
      mixer = new THREE.AnimationMixer(human)
      let action = mixer.clipAction(gltf.animations[Math.floor(Math.random() * gltf.animations.length)])
      action.play()
      //
      scene.add(human)
      // console.log(human)
      // let humanMat = human.children[0].material
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

  /*
  function createGUI(model, animations) {
    const states = [
      'appeso', 
      'arrampica', 
      'caduta', 
      'disteso', 
      'eremita', 
      'forza', 
      'fuga', 
      'giustizia', 
      'guardingo', 
      'idle', 
      'imperatore', 
      'imperatrice', 
      'innamorati', 
      'luna', 
      'mago', 
      'matto', 
      'morte', 
      'noia', 
      'porta', 
      'run', 
      'ruota', 
      'salsa', 
      'saluto', 
      'sole', 
      'solleva', 
      'tiene', 
      'Walk'
    ];
    gui = new GUI();
    mixer = new THREE.AnimationMixer(model);
    actions = {};
    for (let i = 0; i < animations.length; i++) {
      const clip = animations[i];
      const action = mixer.clipAction(clip);
      actions[clip.name] = action;
      if (states.indexOf(clip.name)) {
        action.clampWhenFinished = true;
        action.loop = THREE.LoopRepeat;
      }
    }
  
    // states
    const statesFolder = gui.addFolder('States');
    const clipCtrl = statesFolder.add(api, 'state').options(states);
    clipCtrl.onChange(function () {
      fadeToAction(api.state, 0.5); // XXX <<<
    });
  
    statesFolder.open();
    activeAction = actions['Walk'];
    activeAction.play();
  */

  function fadeToAction(name, duration) {
    previousAction = activeAction;
    activeAction = actions[name];
    if (previousAction !== activeAction) {
      previousAction.fadeOut(duration);
    }

    activeAction
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play();
  }

  // LIGHTS
  RectAreaLightUniformsLib.init();
  let rectLightWidth = 4
  let rectLightHeight = 5.5
  let rectLightIntensity = 5
  rectLight = new THREE.RectAreaLight(p.availableColorsHighlights[whichColor], rectLightIntensity, rectLightWidth, rectLightHeight)
  rectLight.position.set(0, p.floor + rectLightHeight / 2, 10)
  scene.add(rectLight)
  rectLightHelper = new RectAreaLightHelper(rectLight)
  rectLight.add(rectLightHelper)

  light = new THREE.DirectionalLight(0xffffff, .4)
  light.position.set(0, 2, 10)
  light.castShadow = true
  light.shadow.radius = 8
  light.shadow.camera.near = 2
  light.shadow.camera.far = 200
  light.shadow.bias = 0.0001
  light.shadow.mapSize.width = shadowMapWidth
  light.shadow.mapSize.height = shadowMapHeight
  scene.add(light)

  // NOISE
  noise3D = NOISE.createNoise3D()
  const t0 = Math.random() * 10

  const clock = new THREE.Clock()

  // ANIMATE
  const animate = () => {
    if (showStats) stats.begin() // XXX

    // ANIMATION
    const t = t0 + performance.now() * 0.0001
    const t1 = t * p.lightSpeed + 0
    light.position.x = -3 + noise3D(0, t1, 0) * 6
    // ...

    let dt = clock.getDelta()
    if (mixer) mixer.update(dt)

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
  groundMate?.dispose()
  humanMate?.dispose()
  noise3D = null
  if (human) {
    scene.remove(human);
  }
  if (mixer) {
    mixer.stopAllAction();
    mixer.uncacheRoot(mixer.getRoot());
    mixer = null;
  }
  scene.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      child.material.dispose();
    }
  });
  if (actions) {
    for (const key in actions) {
      if (actions.hasOwnProperty(key)) {
        const action = actions[key];
        action.stop();
      }
    }
    actions = null;
  }
  if (action) {
    action.stop();
    action = null;
  }
  rectLight.dispose();
  rectLightHelper.dispose();
  light.dispose();
  scene = null;
}