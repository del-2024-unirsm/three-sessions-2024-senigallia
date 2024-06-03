// TAROTS - ALL

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

let camera
let scene
let animation
let onWindowResize
let controls
let loaderGLTF
let mixer, actionsToPlay, action, actions, activeAction, previousAction
let groundGeom, clock
let human, humanMate, groundMate
let noise3D
let rectLight, light, rectLightHelper
let directorTimeOut
let fireFlyMate

const api = { state: 'Walk' };

export function sketch() {
  // console.log("Sketch launched")

  actionsToPlay = [

    // idles
    {
      name: 'idle',
      color: 2,
      kind: 'idle'
    },
    {
      name: 'run',
      color: 2,
      kind: 'idle'
    },
    {
      name: 'Walk',
      color: 2,
      kind: 'idle'
    },

    // others 
    {
      name: 'appeso',
      color: 1,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'arrampicata',
      color: 4,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'caduta',
      color: 5,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'disteso',
      color: 6,
      kind: 'special',
      repetitions: 2,
      loopInOut: false
    },
    {
      name: 'eremita',
      color: 7,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'forza',
      color: 8,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'fuga',
      color: 0,
      kind: 'special',
      repetitions: 3,
      loopInOut: true
    },
    {
      name: 'giustizia',
      color: 1,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'guardingo',
      color: 2,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
    {
      name: 'imperatore',
      color: 3,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
    {
      name: 'imperatrice',
      color: 4,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
    {
      name: 'innamorati',
      color: 5,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
    {
      name: 'luna',
      color: 6,
      kind: 'special',
      repetitions: 3,
      loopInOut: true
    },
    {
      name: 'mago',
      color: 7,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'matto',
      color: 8,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'Mondo',
      color: 9,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'morte',
      color: 10,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
    {
      name: 'noia',
      color: 0,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
    {
      name: 'porta',
      color: 1,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'ruota',
      color: 2,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'salsa',
      color: 3,
      kind: 'special',
      repetitions: 4,
      loopInOut: false
    },
    {
      name: 'saluto',
      color: 4,
      kind: 'special',
      repetitions: 2,
      loopInOut: false
    },
    {
      name: 'sole',
      color: 5,
      kind: 'special',
      repetitions: 3,
      loopInOut: false
    },
    {
      name: 'solleva',
      color: 6,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
    {
      name: 'tiene',
      color: 7,
      kind: 'special',
      repetitions: 1,
      loopInOut: false
    },
  ];

  // PARAMETERS
  const p = {
    // human
    idleMinDuration: 4,
    idleMaxDuration: 10,
    shadowMode: false,
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
      0x000000  // Black
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
      0x232323  // Black
    ],
    // objects
    lightSpeed: 1,
    // view
    lookAtCenter: new THREE.Vector3(0, .2, 0),
    cameraPosition: new THREE.Vector3(0, 1, -10),
    autoRotate: false,
    autoRotateSpeed: -.05,
    camera: 35,
    fireFlySpeed: .2,
    // ...
    // world
    background: new THREE.Color(0xffffff),
    floor: 0,
    // ...
  }
  
  // debug shadowMode
  if (Math.random() > .5) {
    p.shadowMode = !p.shadowMode
  }

  // debug other camera
  if (Math.random() > .5) {
    p.lookAtCenter = new THREE.Vector3(0, 1.5, 0)
    p.cameraPosition = new THREE.Vector3(-2, 2, -4)
  }


  // select main scene color, random choose for now
  let whichColor = 2 // p.availableColors.length * Math.random() | 0
  p.background = new THREE.Color(p.availableColors[whichColor])

  // other parameters
  let near = 0.2, far = 200
  let shadowMapWidth = 2048, shadowMapHeight = 2048

  // CAMERA
  camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far)
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
  humanMate = new THREE.MeshStandardMaterial()
  humanMate.fog = true
  if (p.shadowMode) {
    humanMate.color = p.background
    humanMate.roughness = .5
    humanMate.metalness = 0
    humanMate.flatShading = true
  } else {
    humanMate.color = new THREE.Color(0xffffff)
    humanMate.envMap = cubeTextures[0].texture
    humanMate.roughness = .2
    humanMate.metalness = 1
    humanMate.flatShading = false
  }
  groundMate = new THREE.MeshStandardMaterial({
    color: p.background,
    roughness: 1,
    metalness: 0,
    fog: true,
  })
  fireFlyMate = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    emissive: 0xFFFFFF,
    emissiveIntensity: 10,
    roughness: 1,
    metalness: 0,
    fog: false,

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
          if (!p.shadowMode) node.material = humanMate
          node.castShadow = true
          node.receiveShadow = true
        }
      })
      human.position.y = p.floor
      human.position.z = 2
      human.rotation.y = Math.PI
      // animations
      mixer = new THREE.AnimationMixer(human)
      // action = mixer.clipAction(gltf.animations[Math.floor(Math.random() * gltf.animations.length)]) 

      actions = {}
      for (let i = 0; i < gltf.animations.length; i++) {
        const clip = gltf.animations[i];
        const action = mixer.clipAction(clip);
        actions[clip.name] = action;
        // console.log(clip.name)
      }
      // console.log(actionsNames)
      actions["idle"].play()
      activeAction = actions["idle"];
      fadeToAction("idle", 0.5);
      changeSceneColor(actionsToPlay[0]); // idle
      setTimeout(playDirector, 0);
      // activeAction.play();

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

  const minDuration = p.idleMinDuration //secs
  const maxDuration = p.idleMaxDuration
  let isFirstAction = true
  const playDirector = () => {

    // Scegli un'azione di idle casuale
    const idleActions = actionsToPlay.filter(action => action.kind === 'idle');
    let randomIdleAction
    if (!isFirstAction) {
      randomIdleAction = idleActions[Math.floor(Math.random() * idleActions.length)];
      fadeToAction(randomIdleAction.name, 0.5);
      changeSceneColor(randomIdleAction);
      activeAction.clampWhenFinished = false;
      activeAction.loop = THREE.LoopRepeat;
      activeAction.repetitions = Infinity;
      activeAction.play();
    } else {
      randomIdleAction = idleActions[0];
      isFirstAction = false;
    }

    // Scegli un'azione speciale in modo casuale
    const specialActions = actionsToPlay.filter(action => action.kind === 'special');
    const randomSpecialAction = specialActions[Math.floor(Math.random() * specialActions.length)];

    let repetitions = randomSpecialAction.repetitions;
    let loopInOut = randomSpecialAction.loopInOut;
    let direction = 1;

    const onSpecialActionFinished = () => {
      if (loopInOut) {
        if (direction === 1) {
          repetitions--;
        }
        if (repetitions > 0) {
          direction *= -1;
          activeAction.timeScale = direction;
          activeAction.paused = false;
          activeAction.play();
        } else {
          // Torna all'azione di idle corrente
          fadeToAction(randomIdleAction.name, 0.5);
          changeSceneColor(randomIdleAction);
          mixer.removeEventListener('finished', onSpecialActionFinished);
          if (directorTimeOut) {
            clearTimeout(directorTimeOut);
            directorTimeOut = 0;
          }
          directorTimeOut = setTimeout(playDirector, 0);
        }
      } else {
        repetitions--;
        if (repetitions > 0) {
          activeAction.reset();
          activeAction.play();
        } else {
          // Torna all'azione di idle corrente
          fadeToAction(randomIdleAction.name, 0.5);
          changeSceneColor(randomIdleAction);
          mixer.removeEventListener('finished', onSpecialActionFinished);
          if (directorTimeOut) {
            clearTimeout(directorTimeOut);
            directorTimeOut = 0;
          }
          directorTimeOut = setTimeout(playDirector, 0);
        }
      }
    };

    const playSpecialAction = () => {
      fadeToAction(randomSpecialAction.name, 0.5);
      changeSceneColor(randomSpecialAction);
      activeAction.clampWhenFinished = true;
      activeAction.loop = THREE.LoopOnce;
      activeAction.repetitions = 1;
      mixer.addEventListener('finished', onSpecialActionFinished);
      activeAction.play();
    };

    // Richiama l'azione speciale dopo un intervallo di tempo casuale solo se l'azione corrente è un idle
    if (idleActions.some(action => action.name === activeAction.getClip().name)) {
      const randSec = minDuration + Math.random() * (maxDuration - minDuration);
      if (directorTimeOut) {
        clearTimeout(directorTimeOut);
        directorTimeOut = 0;
      }
      directorTimeOut = setTimeout(playSpecialAction, randSec * 1000);
    }
  }

  const fadeToAction = (name, duration) => {
    previousAction = activeAction;
    activeAction = actions[name];
    activeAction
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .crossFadeFrom(previousAction, duration)
      .play();
  }
  const changeSceneColor = (action, duration = .5) => {
    const startColor = scene.background.clone();
    const startColorHighlight = rectLight.color.clone();
    const endColor = new THREE.Color(p.availableColors[action.color]);
    const endColorHighlight = new THREE.Color(p.availableColorsHighlights[action.color]);

    let startTime = performance.now();

    const easeOutQuad = (t) => {
      return 1 - (1 - t) * (1 - t);
    };

    const animate = () => {
      const elapsedTime = (performance.now() - startTime) / 1000;
      const t = Math.min(elapsedTime / duration, 1);
      const easedT = easeOutQuad(t);

      scene.background = startColor.clone().lerp(endColor, easedT);
      scene.fog.color = scene.background;
      if (p.shadowMode)
        humanMate.color = scene.background;
      else
        humanMate.color = new THREE.Color(0xffffff)
      groundMate.color = scene.background;
      rectLight.color = startColorHighlight.clone().lerp(endColorHighlight, easedT);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        p.background = endColor;
      }
    };

    animate();
  }

  // FIREFLIES
  const fireFlyGeom = new THREE.SphereGeometry(.01, 12, 2)
  const fireFly = new THREE.Mesh(fireFlyGeom, fireFlyMate)
  const fireFlyLight = new THREE.PointLight(0xFFFFFF, 10, 2); 
  fireFlyLight.castShadow = true; 
  scene.add(fireFlyLight);
  scene.add(fireFly)

  const fireFlyGeom1 = new THREE.SphereGeometry(.01, 10, 2)
  const fireFly1 = new THREE.Mesh(fireFlyGeom1, fireFlyMate)
  const fireFlyLight1 = new THREE.PointLight(0xFFFFFF, 12, 2); 
  fireFlyLight1.castShadow = true; 
  scene.add(fireFlyLight1);
  scene.add(fireFly1)

  const fireFlyGeom2 = new THREE.SphereGeometry(.01, 10, 2)
  const fireFly2 = new THREE.Mesh(fireFlyGeom2, fireFlyMate)
  const fireFlyLight2 = new THREE.PointLight(0xFFFFFF, 12, 2); 
  fireFlyLight2.castShadow = true; 
  scene.add(fireFlyLight2);
  scene.add(fireFly2)

  const fireFlyGeom3 = new THREE.SphereGeometry(.01, 12, 2)
  const fireFly3 = new THREE.Mesh(fireFlyGeom3, fireFlyMate)
  const fireFlyLight3 = new THREE.PointLight(0xFFFFFF, 10, 2); 
  fireFlyLight3.castShadow = true; 
  scene.add(fireFlyLight3);
  scene.add(fireFly3)

  const fireFlyGeom4 = new THREE.SphereGeometry(.01, 10, 2)
  const fireFly4 = new THREE.Mesh(fireFlyGeom4, fireFlyMate)
  const fireFlyLight4 = new THREE.PointLight(0xFFFFFF, 12, 2); 
  fireFlyLight4.castShadow = true; 
  scene.add(fireFlyLight4);
  scene.add(fireFly4)

  const fireFlyGeom5 = new THREE.SphereGeometry(.01, 10, 2)
  const fireFly5 = new THREE.Mesh(fireFlyGeom5, fireFlyMate)
  const fireFlyLight5 = new THREE.PointLight(0xFFFFFF, 12, 2); 
  fireFlyLight5.castShadow = true; 
  scene.add(fireFlyLight5);
  scene.add(fireFly5)

  const fireFlyGeom6 = new THREE.SphereGeometry(.01, 10, 2)
  const fireFly6 = new THREE.Mesh(fireFlyGeom6, fireFlyMate)
  const fireFlyLight6 = new THREE.PointLight(0xFFFFFF, 12, 2); 
  fireFlyLight6.castShadow = true; 
  scene.add(fireFlyLight6);
  scene.add(fireFly6)

  const fireFlyGeom7 = new THREE.SphereGeometry(.01, 10, 2)
  const fireFly7 = new THREE.Mesh(fireFlyGeom7, fireFlyMate)
  const fireFlyLight7 = new THREE.PointLight(0xFFFFFF, 12, 2); 
  fireFlyLight7.castShadow = true; 
  scene.add(fireFlyLight7);
  scene.add(fireFly7)

  const fireFlyGeom8 = new THREE.SphereGeometry(.01, 12, 2)
  const fireFly8 = new THREE.Mesh(fireFlyGeom8, fireFlyMate)
  const fireFlyLight8 = new THREE.PointLight(0xFFFFFF, 10, 2); 
  fireFlyLight8.castShadow = true; 
  scene.add(fireFlyLight8);
  scene.add(fireFly8)

  const fireFlyGeom9 = new THREE.SphereGeometry(.01, 10, 2)
  const fireFly9 = new THREE.Mesh(fireFlyGeom9, fireFlyMate)
  const fireFlyLight9 = new THREE.PointLight(0xFFFFFF, 12, 2); 
  fireFlyLight9.castShadow = true; 
  scene.add(fireFlyLight9);
  scene.add(fireFly9)

  const fireFlyGeom10 = new THREE.SphereGeometry(.01, 10, 2)
  const fireFly10 = new THREE.Mesh(fireFlyGeom10, fireFlyMate)
  const fireFlyLight10 = new THREE.PointLight(0xFFFFFF, 12, 2); 
  fireFlyLight10.castShadow = true; 
  scene.add(fireFlyLight10);
  scene.add(fireFly10)

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

  clock = new THREE.Clock()

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

    const t2 = t * p.fireFlySpeed + 10
            fireFly.position.x = 0 + noise3D(0, t2, 0) * 2
            fireFly.position.y = 2 + noise3D(t2 + 4, 0, 0) * .8
            fireFly.position.z = 1 + noise3D(0, 0, t2 + 8) * 2
            fireFlyLight.position.copy(fireFly.position)

    const t3 = t * p.fireFlySpeed + 10
            fireFly1.position.x = 1 + noise3D(0, t3, 0) * 2
            fireFly1.position.y = 3 + noise3D(t3 + 4, 0, 0) * .8
            fireFly1.position.z = 2 + noise3D(0, 0, t3 + 8) * 2
            fireFlyLight1.position.copy(fireFly1.position)

    const t4 = t * p.fireFlySpeed + 10
            fireFly2.position.x = 0 + noise3D(0, t4, 0) * 2
            fireFly2.position.y = 2 + noise3D(t4 + 4, 0, 0) * .8
            fireFly2.position.z = 4 + noise3D(0, 0, t4 + 8) * 2
            fireFlyLight2.position.copy(fireFly2.position)

    const t5 = t * p.fireFlySpeed + 10
            fireFly3.position.x = 1 + noise3D(0, t5, 0) * 2
            fireFly3.position.y = 4 + noise3D(t5 + 4, 0, 0) * .8
            fireFly3.position.z = 2 + noise3D(0, 0, t5 + 8) * 2
            fireFlyLight3.position.copy(fireFly3.position)

    const t6 = t * p.fireFlySpeed + 10
            fireFly4.position.x = 1 + noise3D(0, t6, 0) * 2
            fireFly4.position.y = 2 + noise3D(t6 + 4, 0, 0) * .8
            fireFly4.position.z = 3 + noise3D(0, 0, t6 + 8) * 2
            fireFlyLight4.position.copy(fireFly4.position)

    const t7 = t * p.fireFlySpeed + 10
            fireFly5.position.x = 2 + noise3D(0, t7, 0) * 2
            fireFly5.position.y = 4 + noise3D(t7 + 4, 0, 0) * .8
            fireFly5.position.z = 4 + noise3D(0, 0, t7 + 8) * 2
            fireFlyLight5.position.copy(fireFly5.position)

    const t8 = t * p.fireFlySpeed + 10
            fireFly6.position.x = 1 + noise3D(0, t8, 0) * 2
            fireFly6.position.y = 4 + noise3D(t8 + 4, 0, 0) * .8
            fireFly6.position.z = 3 + noise3D(0, 0, t8 + 8) * 2
            fireFlyLight6.position.copy(fireFly6.position)

    const t9 = t * p.fireFlySpeed + 10
            fireFly7.position.x = 3 + noise3D(0, t9, 0) * 2
            fireFly7.position.y = 2 + noise3D(t9 + 4, 0, 0) * .8
            fireFly7.position.z = 4 + noise3D(0, 0, t9 + 8) * 2
            fireFlyLight7.position.copy(fireFly7.position)

    const t10 = t * p.fireFlySpeed + 10
            fireFly8.position.x = 1 + noise3D(0, t10, 0) * 2
            fireFly8.position.y = 4 + noise3D(t10 + 4, 0, 0) * .8
            fireFly8.position.z = 1 + noise3D(0, 0, t10 + 8) * 2
            fireFlyLight8.position.copy(fireFly8.position)

    const t11 = t * p.fireFlySpeed + 10
            fireFly9.position.x = 1 + noise3D(0, t11, 0) * 2
            fireFly9.position.y = 4 + noise3D(t11 + 4, 0, 0) * .8
            fireFly9.position.z = 1 + noise3D(0, 0, t11 + 8) * 2
            fireFlyLight9.position.copy(fireFly9.position)

    const t12 = t * p.fireFlySpeed + 10
            fireFly10.position.x = 3 + noise3D(0, t12, 0) * 2
            fireFly10.position.y = 2 + noise3D(t12 + 4, 0, 0) * .8
            fireFly10.position.z = 2 + noise3D(0, 0, t12 + 8) * 2
            fireFlyLight10.position.copy(fireFly10.position)


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
    human.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
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
  camera = null;
  if (directorTimeOut) {
    clearTimeout(directorTimeOut);
    directorTimeOut = 0;
  }
  // gui?.destroy()
  // ...
  window.removeEventListener('resize', onWindowResize)
}