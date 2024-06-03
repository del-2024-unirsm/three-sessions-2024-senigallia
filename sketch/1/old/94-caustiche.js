//CAUSTICHE PROVA
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let onWindowResize;

export function sketch() {
  const black = new THREE.Color('black');
  const white = new THREE.Color('white');

  /*function loadFile(filename) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.FileLoader();

      loader.load(filename, (data) => {
        resolve(data);
      });
    });
  }*/

  const waterPosition = new THREE.Vector3(0, 0, 0.8);
  const near = 0;
  const far = 2;
  const waterSize = 512;

  const light = [0, 0, -1];
  const lightCamera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, near, far);
  lightCamera.position.set(0, 0, 1.5);
  lightCamera.lookAt(0, 0, 0);

  let camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onWindowResize);

  const debugObject = {
    waveDepthColor: "#1e4d40",
    waveSurfaceColor: "#4d9aaa",
    fogNear: 1,
    fogFar: 3,
    fogColor: "#A34739",
  };

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(debugObject.fogColor, debugObject.fogNear, debugObject.fogFar);
  scene.background = new THREE.Color(debugObject.fogColor);

  const orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;
  orbitControls.target.set(0, 1, 0);

  const temporaryRenderTarget = new THREE.WebGLRenderTarget(1920, 1080);
  const clock = new THREE.Clock();

  //const waterGeometry = new THREE.PlaneBufferGeometry(2, 2, waterSize, waterSize);
  const floorGeometry = new THREE.PlaneBufferGeometry(100, 100, 1, 1);

  const cubetextureloader = new THREE.CubeTextureLoader();
  const skybox = cubetextureloader.load([
    './assets/textures/TropicalSunnyDay_px.jpg', './assets/textures/TropicalSunnyDay_nx.jpg',
    './assets/textures/TropicalSunnyDay_py.jpg', './assets/textures/TropicalSunnyDay_ny.jpg',
    './assets/textures/TropicalSunnyDay_pz.jpg', './assets/textures/TropicalSunnyDay_nz.jpg',
  ]);
  scene.background = skybox;

  class WaterSimulation {
    constructor() {
      this._camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 2000);
      this._geometry = new THREE.PlaneBufferGeometry(4, 2);
      this._targetA = new THREE.WebGLRenderTarget(waterSize, waterSize, { type: THREE.FloatType });
      this._targetB = new THREE.WebGLRenderTarget(waterSize, waterSize, { type: THREE.FloatType });
      this.target = this._targetA;

      const shadersPromises = [
        // vertexShader
        `attribute vec3 position;
         varying vec2 coord;

         void main() {
           coord = position.xy * 0.5 + 0.5;
           gl_Position = vec4(position.xyz, 1.0);
         }`,
        // dropFragmentShader
        `precision highp float;
         precision highp int;
         const float PI = 3.141592653589793;
         uniform sampler2D texture;
         uniform vec2 center;
         uniform float radius;
         uniform float strength;
         varying vec2 coord;

         void main() {
           vec4 info = texture2D(texture, coord);
           float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);
           drop = 0.5 - cos(drop * PI) * 0.5;
           info.r += drop * strength;
           gl_FragColor = info;
         }`,
        // updateFragmentShader
        `precision highp float;
         precision highp int;
         uniform sampler2D texture;
         uniform vec2 delta;
         varying vec2 coord;

         void main() {
           vec4 info = texture2D(texture, coord);
           vec2 dx = vec2(delta.x, 0.0);
           vec2 dy = vec2(0.0, delta.y);
           float average = (
             texture2D(texture, coord - dx).r +
             texture2D(texture, coord - dy).r +
             texture2D(texture, coord + dx).r +
             texture2D(texture, coord + dy).r
           ) * 0.25;

           info.g += (average - info.r) * 2.0;
           info.g *= 0.995;
           info.r += info.g;

           vec3 ddx = vec3(delta.x, texture2D(texture, vec2(coord.x + delta.x, coord.y)).r - info.r, 0.0);
           vec3 ddy = vec3(0.0, texture2D(texture, vec2(coord.x, coord.y + delta.y)).r - info.r, delta.y);
           info.ba = normalize(cross(ddy, ddx)).xz;

           gl_FragColor = info;
         }`,
      ];

      this.loaded = Promise.all(shadersPromises)
        .then(([vertexShader, dropFragmentShader, updateFragmentShader]) => {
          const dropMaterial = new THREE.RawShaderMaterial({
            uniforms: {
              center: { value: [0, 0] },
              radius: { value: 0 },
              strength: { value: 0 },
              texture: { value: null },
            },
            vertexShader: vertexShader,
            fragmentShader: dropFragmentShader,
          });

          const updateMaterial = new THREE.RawShaderMaterial({
            uniforms: {
              delta: { value: [1 / 216, 1 / 216] },
              texture: { value: null },
            },
            vertexShader: vertexShader,
            fragmentShader: updateFragmentShader,
          });

          this._dropMesh = new THREE.Mesh(this._geometry, dropMaterial);
          this._updateMesh = new THREE.Mesh(this._geometry, updateMaterial);
        });
    }

    addDrop(renderer, x, y, radius, strength) {
      this._dropMesh.material.uniforms['center'].value = [x, y];
      this._dropMesh.material.uniforms['radius'].value = radius;
      this._dropMesh.material.uniforms['strength'].value = strength;

      this._render(renderer, this._dropMesh);
    }

    stepSimulation(renderer) {
      this._render(renderer, this._updateMesh);
    }

    _render(renderer, mesh) {
      const _oldTarget = this.target;
      const _newTarget = this.target === this._targetA ? this._targetB : this._targetA;

      const oldTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(_newTarget);
      mesh.material.uniforms['texture'].value = _oldTarget.texture;
      renderer.render(mesh, this._camera);
      renderer.setRenderTarget(oldTarget);
      this.target = _newTarget;
    }
  }
  
  
  // Water Shader
class Water {
  constructor() {
    this.geometry = new THREE.PlaneBufferGeometry(4, 2, waterSize, waterSize);

    const shadersPromises = [
      // vertexShader
      `uniform sampler2D water;
      
      varying vec2 refractedPosition[3];
      varying vec3 reflected;
      varying float reflectionFactor;

      const float refractionFactor = 1.;

      const float fresnelBias = 0.1;
      const float fresnelPower = 2.;
      const float fresnelScale = 1.;

      // Air refractive index / Water refractive index
      const float eta = 0.7504;

      void main() {
        vec4 info = texture2D(water, position.xy * 0.5 + 0.5);

        // The water position is the vertex position on which we apply the height-map
        vec3 pos = vec3(position.xy, position.z + info.r);
        vec3 norm = normalize(vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a)).xzy;

        vec3 eye = normalize(pos - cameraPosition);
        vec3 refracted = normalize(refract(eye, norm, eta));
        reflected = normalize(reflect(eye, norm));

        reflectionFactor = fresnelBias + fresnelScale * pow(1. + dot(eye, norm), fresnelPower);

        mat4 proj = projectionMatrix * modelViewMatrix;

        vec4 projectedRefractedPosition = proj * vec4(pos + refractionFactor * refracted, 1.0);
        refractedPosition[0] = projectedRefractedPosition.xy / projectedRefractedPosition.w;

        projectedRefractedPosition = proj * vec4(pos + refractionFactor * normalize(refract(eye, norm, eta * 0.96)), 1.0);
        refractedPosition[1] = projectedRefractedPosition.xy / projectedRefractedPosition.w;

        projectedRefractedPosition = proj * vec4(pos + refractionFactor * normalize(refract(eye, norm, eta * 0.92)), 1.0);
        refractedPosition[2] = projectedRefractedPosition.xy / projectedRefractedPosition.w;

        gl_Position = proj * vec4(pos, 1.0);
      }`,
      // fragmentShader
      `uniform sampler2D envMap;
      uniform samplerCube skybox;

      varying vec2 refractedPosition[3];
      varying vec3 reflected;
      varying float reflectionFactor;

      void main() {
        // Color coming from the sky reflection
        vec3 reflectedColor = textureCube(skybox, reflected).xyz;

        // Color coming from the environment refraction, applying chromatic aberration
        vec3 refractedColor = vec3(1.);
        refractedColor.r = texture2D(envMap, refractedPosition[0] * 0.5 + 0.5).r;
        refractedColor.g = texture2D(envMap, refractedPosition[1] * 0.5 + 0.5).g;
        refractedColor.b = texture2D(envMap, refractedPosition[2] * 0.5 + 0.5).b;

        gl_FragColor = vec4(mix(refractedColor, reflectedColor, clamp(reflectionFactor, 0., 1.)), 1.);
      }`
    ];

    this.loaded = Promise.all(shadersPromises)
      .then(([vertexShader, fragmentShader]) => {
        this.material = new THREE.ShaderMaterial({
          uniforms: {
            light: { value: light },
            water: { value: null },
            envMap: { value: null },
            skybox: { value: skybox },
          },
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
        });
        this.material.extensions = {
          derivatives: true
        };

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(waterPosition.x, waterPosition.y, waterPosition.z);
      });
  }

  setHeightTexture(waterTexture) {
    this.material.uniforms['water'].value = waterTexture;
  }

  setEnvMapTexture(envMap) {
    this.material.uniforms['envMap'].value = envMap;
  }
}

// This renders the environment map seen from the light POV.
// The resulting texture contains (posx, posy, posz, depth) in the colors channels.
class EnvironmentMap {
  constructor() {
    this.size = 1024;
    this.target = new THREE.WebGLRenderTarget(this.size, this.size, {type: THREE.FloatType});

    const shadersPromises = [
      // vertexShader
      `varying vec4 worldPosition;
      varying float depth;

      void main() {
        // Compute world position
        worldPosition = modelMatrix * vec4(position, 1.);

        // Project vertex in the screen coordinates
        vec4 projectedPosition = projectionMatrix * viewMatrix * worldPosition;

        // Store vertex depth
        depth = projectedPosition.z;

        gl_Position = projectedPosition;
      }`,
      // fragmentShader
      `varying vec4 worldPosition;
      varying float depth;

      void main() {
        gl_FragColor = vec4(worldPosition.xyz, depth);
      }`,
    ];

    this._meshes = [];

    this.loaded = Promise.all(shadersPromises)
      .then(([vertexShader, fragmentShader]) => {
        this._material = new THREE.ShaderMaterial({
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
        });
      });
  }

  setGeometries(geometries) {
    this._meshes = [];

    for (let geometry of geometries) {
      this._meshes.push(new THREE.Mesh(geometry, this._material));
    }
  }

  render(renderer) {
    const oldTarget = renderer.getRenderTarget();

    renderer.setRenderTarget(this.target);
    renderer.setClearColor(black, 0);
    renderer.clear();

    for (let mesh of this._meshes) {
      renderer.render(mesh, lightCamera);
    }

    renderer.setRenderTarget(oldTarget);
  }
}
  
  
class Caustics {
  constructor() {
    this.target = new THREE.WebGLRenderTarget(waterSize * 3, waterSize * 3, { type: THREE.FloatType });
    this._waterGeometry = new THREE.PlaneBufferGeometry(2, 2, waterSize, waterSize);

    const shadersPromises = [
      // vertexShader
      `uniform vec3 light;
       uniform sampler2D water;
       uniform sampler2D env;
       uniform float deltaEnvTexture;

       varying vec3 oldPosition;
       varying vec3 newPosition;
       varying float waterDepth;
       varying float depth;

       const float eta = 0.7504;
       const int MAX_ITERATIONS = 50;

       void main() {
         vec4 waterInfo = texture2D(water, position.xy * 0.5 + 0.5);
         vec3 waterPosition = vec3(position.xy, position.z + waterInfo.r + 0.8);
         vec3 waterNormal = normalize(vec3(waterInfo.b, sqrt(1.0 - dot(waterInfo.ba, waterInfo.ba)), waterInfo.a)).xzy;

         oldPosition = waterPosition;
         vec4 projectedWaterPosition = projectionMatrix * viewMatrix * vec4(waterPosition, 1.);
         vec2 currentPosition = projectedWaterPosition.xy;
         vec2 coords = 0.5 + 0.5 * currentPosition;

         vec3 refracted = refract(light, waterNormal, eta);
         vec4 projectedRefractionVector = projectionMatrix * viewMatrix * vec4(refracted, 1.);
         vec3 refractedDirection = projectedRefractionVector.xyz;

         waterDepth = 0.5 + 0.5 * projectedWaterPosition.z / projectedWaterPosition.w;
         float currentDepth = projectedWaterPosition.z;
         vec4 environment = texture2D(env, coords);

         float factor = deltaEnvTexture / length(refractedDirection.xy);
         vec2 deltaDirection = refractedDirection.xy * factor;
         float deltaDepth = refractedDirection.z * factor;

         for (int i = 0; i < MAX_ITERATIONS; i++) {
           currentPosition += deltaDirection;
           currentDepth += deltaDepth;

           if (environment.w <= currentDepth) {
             break;
           }

           environment = texture2D(env, 0.5 + 0.5 * currentPosition);
         }

         newPosition = environment.xyz;
         vec4 projectedEnvPosition = projectionMatrix * viewMatrix * vec4(newPosition, 1.0);
         depth = 0.5 + 0.5 * projectedEnvPosition.z / projectedEnvPosition.w;

         gl_Position = projectedEnvPosition;
       }`,
      
      // fragmentShader
      `const float causticsFactor = 0.15;
       varying vec3 oldPosition;
       varying vec3 newPosition;
       varying float waterDepth;
       varying float depth;

       void main() {
         float causticsIntensity = 0.;

         if (depth >= waterDepth) {
           float oldArea = length(dFdx(oldPosition)) * length(dFdy(oldPosition));
           float newArea = length(dFdx(newPosition)) * length(dFdy(newPosition));

           float ratio;

           if (newArea == 0.) {
             ratio = 2.0e+20;
           } else {
             ratio = oldArea / newArea;
           }

           causticsIntensity = causticsFactor * ratio;
         }

         gl_FragColor = vec4(causticsIntensity, 0., 0., depth);
       }`,
    ];

    this.loaded = Promise.all(shadersPromises).then(([waterVertexShader, waterFragmentShader]) => {
      this._waterMaterial = new THREE.ShaderMaterial({
        uniforms: {
          light: { value: light },
          env: { value: null },
          water: { value: null },
          deltaEnvTexture: { value: null },
        },
        vertexShader: waterVertexShader,
        fragmentShader: waterFragmentShader,
        transparent: true,
      });

      this._waterMaterial.blending = THREE.CustomBlending;
      this._waterMaterial.blendEquation = THREE.AddEquation;
      this._waterMaterial.blendSrc = THREE.OneFactor;
      this._waterMaterial.blendDst = THREE.OneFactor;
      this._waterMaterial.blendEquationAlpha = THREE.AddEquation;
      this._waterMaterial.blendSrcAlpha = THREE.OneFactor;
      this._waterMaterial.blendDstAlpha = THREE.ZeroFactor;
      this._waterMaterial.side = THREE.DoubleSide;
      this._waterMaterial.extensions = {
        derivatives: true
      };

      this._waterMesh = new THREE.Mesh(this._waterGeometry, this._waterMaterial);
    });
  }

  setDeltaEnvTexture(deltaEnvTexture) {
    this._waterMaterial.uniforms['deltaEnvTexture'].value = deltaEnvTexture;
  }

  setTextures(waterTexture, envTexture) {
    this._waterMaterial.uniforms['env'].value = envTexture;
    this._waterMaterial.uniforms['water'].value = waterTexture;
  }

  render(renderer) {
    const oldTarget = renderer.getRenderTarget();

    renderer.setRenderTarget(this.target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();

    renderer.render(this._waterMesh, lightCamera);

    renderer.setRenderTarget(oldTarget);
  }
}

class Environment {
  constructor() {
    const shadersPromises = [
      // vertexShader
      `uniform vec3 light;
       uniform mat4 lightProjectionMatrix;
       uniform mat4 lightViewMatrix;

       varying float lightIntensity;
       varying vec3 lightPosition;

       void main(void){
         lightIntensity = -dot(light, normalize(normal));
         vec4 lightRelativePosition = lightProjectionMatrix * lightViewMatrix * modelMatrix * vec4(position, 1.);
         lightPosition = 0.5 + lightRelativePosition.xyz / lightRelativePosition.w * 0.5;
         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
       }`,

      // fragmentShader
      `uniform sampler2D caustics;

       varying float lightIntensity;
       varying vec3 lightPosition;

       const float bias = 0.001;
       const vec3 underwaterColor = vec3(0.4, 0.9, 1.0);
       const vec2 resolution = vec2(1024.);

       float blur(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
         float intensity = 0.;
         vec2 off1 = vec2(1.3846153846) * direction;
         vec2 off2 = vec2(3.2307692308) * direction;
         intensity += texture2D(image, uv).x * 0.2270270270;
         intensity += texture2D(image, uv + (off1 / resolution)).x * 0.3162162162;
         intensity += texture2D(image, uv - (off1 / resolution)).x * 0.3162162162;
         intensity += texture2D(image, uv + (off2 / resolution)).x * 0.0702702703;
         intensity += texture2D(image, uv - (off2 / resolution)).x * 0.0702702703;
         return intensity;
       }

       void main() {
         float computedLightIntensity = 0.5;
         computedLightIntensity += 0.2 * lightIntensity;

         float causticsDepth = texture2D(caustics, lightPosition.xy).w;

         if (causticsDepth > lightPosition.z - bias) {
           float causticsIntensity = 0.5 * (
             blur(caustics, lightPosition.xy, resolution, vec2(0., 0.5)) +
             blur(caustics, lightPosition.xy, resolution, vec2(0.5, 0.))
           );

           computedLightIntensity += causticsIntensity * smoothstep(0., 1., lightIntensity);
         }

         gl_FragColor = vec4(underwaterColor * computedLightIntensity, 1.);
       }`,
    ];

    this._meshes = [];

    this.loaded = Promise.all(shadersPromises).then(([vertexShader, fragmentShader]) => {
      this._material = new THREE.ShaderMaterial({
        uniforms: {
          light: { value: light },
          caustics: { value: null },
          lightProjectionMatrix: { value: lightCamera.projectionMatrix },
          lightViewMatrix: { value: lightCamera.matrixWorldInverse }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
      });
    });
  }

  setGeometries(geometries) {
    this._meshes = [];

    for (let geometry of geometries) {
      this._meshes.push(new THREE.Mesh(geometry, this._material));
    }
  }

  updateCaustics(causticsTexture) {
    this._material.uniforms['caustics'].value = causticsTexture;
  }

  addTo(scene) {
    for (let mesh of this._meshes) {
      scene.add(mesh);
    }
  }
}

  
class Debug {
  constructor() {
    this._camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 1);
    this._geometry = new THREE.PlaneBufferGeometry();

    const shadersPromises = [
      // vertexShader
      `uniform sampler2D texture;
       attribute vec3 position;
       varying vec2 coord;

       void main() {
         coord = position.xy + 0.5;
         gl_Position = vec4(position.xy * 2., 0., 1.);
       }`,
      // fragmentShader
      `precision highp float;
       precision highp int;
       
       uniform sampler2D texture;
       varying vec2 coord;

       void main() {
         vec4 color = texture2D(texture, coord);
         gl_FragColor = vec4(color.x, color.y, color.z, 1.);
       }`,
    ];

    this.loaded = Promise.all(shadersPromises)
      .then(([vertexShader, fragmentShader]) => {
        this._material = new THREE.RawShaderMaterial({
          uniforms: {
            texture: { value: null },
          },
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
        });

        this._mesh = new THREE.Mesh(this._geometry, this._material);
        this._material.transparent = true;
      });
  }

  /*draw(renderer, texture) {
    this._material.uniforms['texture'].value = texture;

    const oldTarget = renderer.getRenderTarget();

    renderer.setRenderTarget(null);
    renderer.render(this._mesh, this._camera);

    renderer.setRenderTarget(oldTarget);
  }*/
}

const waterSimulation = new WaterSimulation();
const water = new Water();
const environmentMap = new EnvironmentMap();
const environment = new Environment();
const caustics = new Caustics();
const debug = new Debug();

// Main rendering loop
function animate() {
  stats.begin();

  // Update the water
  if (clock.getElapsedTime() > 0.032) {
    waterSimulation.stepSimulation(renderer);
    const waterTexture = waterSimulation.target.texture;
    water.setHeightTexture(waterTexture);

    environmentMap.render(renderer);
    const environmentMapTexture = environmentMap.target.texture;

    caustics.setTextures(waterTexture, environmentMapTexture);
    caustics.render(renderer);
    const causticsTexture = caustics.target.texture;

    // debug.draw(renderer, environmentMapTexture);
    // debug.draw(renderer, causticsTexture);

    environment.updateCaustics(causticsTexture);

    clock.start();
  }

  
  // Render everything but the refractive water
  renderer.setRenderTarget(temporaryRenderTarget);
  renderer.setClearColor(white, 1);
  renderer.clear();

  water.mesh.visible = false;
  renderer.render(scene, camera);

  water.setEnvMapTexture(temporaryRenderTarget.texture);

  // Then render the final scene with the refractive water
  renderer.setRenderTarget(null);
  renderer.setClearColor(white, 1);
  renderer.clear();

  water.mesh.visible = true;
  renderer.render(scene, camera);

  //controls.update();

  stats.end();

  window.requestAnimationFrame(animate);
}

function onMouseMove(event) {
  const rect = canvas.getBoundingClientRect();

  mouse.x = (event.clientX - rect.left) * 2 / width - 1;
  mouse.y = - (event.clientY - rect.top) * 2 / height + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(targetmesh);

  for (let intersect of intersects) {
    waterSimulation.addDrop(renderer, intersect.point.x, intersect.point.y, 0.03, 0.02);
  }
}

const loaded = [
  waterSimulation.loaded,
  water.loaded,
  environmentMap.loaded,
  environment.loaded,
  caustics.loaded,
  debug.loaded,
];

  Promise.all(loaded).then(() => {
  const envGeometries = [floorGeometry];

  environmentMap.setGeometries(envGeometries);
  environment.setGeometries(envGeometries);

  environment.addTo(scene);
  scene.add(water.mesh);

  caustics.setDeltaEnvTexture(1. / environmentMap.size);

  //canvas.addEventListener('mousemove', { handleEvent: onMouseMove });

  for (var i = 0; i < 5; i++) {
    waterSimulation.addDrop(
      renderer,
      Math.random() * 2 - 1, Math.random() * 2 - 1,
      0.03, (i & 1) ? 0.02 : -0.02
    );
  }

  animate();
});
}

export function dispose() {
  window?.removeEventListener('resize', onWindowResize);
}
