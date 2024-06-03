// TAROTS - ALL

// Todo: 
// - ligth angle for each position and easeout transition (like colors) 

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

export function sketch() {
  // console.log("Sketch launched")

  actionsToPlay = [
    // instructions:
    // kind: 'idle' < actions for idle mode
    // kind: 'special' < other actions to play randomly with parameters (repetitions, loopInOut, ...)

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
      0xaaaaaa, // White
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
  humanMate.roughness = .2
  humanMate.metalness = .9
  humanMate.flatShading = false
  humanMate.color = new THREE.Color(0xffffff)
  if (p.shadowMode) {
  } else {
    humanMate.envMap = cubeTextures[0].texture
  }
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
          // if (!p.shadowMode) 
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
  const { idleMinDuration, idleMaxDuration } = p;
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
      const randSec = idleMinDuration + Math.random() * (idleMaxDuration - idleMinDuration);
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

  // LIGHTS
  RectAreaLightUniformsLib.init();
  let rectLightWidth = 4
  let rectLightHeight = 5.5
  let rectLightIntensity = 5 * PI
  rectLight = new THREE.RectAreaLight(p.availableColorsHighlights[whichColor], rectLightIntensity, rectLightWidth, rectLightHeight)
  rectLight.position.set(0, p.floor + rectLightHeight / 2, 10)
  scene.add(rectLight)
  rectLightHelper = new RectAreaLightHelper(rectLight)
  rectLight.add(rectLightHelper)

  light = new THREE.DirectionalLight(0xffffff, .4 * PI)
  light.position.set(0, 2, 10)
  light.castShadow = true
  light.shadow.radius = 8
  light.shadow.camera.near = 2
  light.shadow.camera.far = 200
  light.shadow.bias = 0.0001
  light.shadow.mapSize.width = shadowMapWidth
  light.shadow.mapSize.height = shadowMapHeight
  light.decay = 0
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
  rectLight?.dispose();
  rectLightHelper?.dispose();
  light?.dispose();
  // scene = null;
  camera = null;
  if (directorTimeOut) {
    clearTimeout(directorTimeOut);
    directorTimeOut = 0;
  }
  // gui?.destroy()
  // ...
  window.removeEventListener('resize', onWindowResize)
}