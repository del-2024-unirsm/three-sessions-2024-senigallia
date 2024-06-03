// CILINDRI CHE DANZANO SINUSOIDE

let onWindowResize;
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector'
// import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';



export function sketch() {

   // CAMERA
    let camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 3;
  

    // WINDOW RESIZE
    onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);


    // SCENE

    const debugObject = {
        waveDepthColor: "#1e4d40",
        waveSurfaceColor: "#4d9aaa",
        fogNear: 3,
        fogFar: 10,
        fogColor: "#8e99a2"
    };

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(
        debugObject.fogColor,
        debugObject.fogNear,
        debugObject.fogFar
    );

//     // Load EXR texture
//   const exrLoader = new EXRLoader();
//   exrLoader.load('./assets/textures/bosco4.exr', function(texture) {
//     texture.mapping = THREE.EquirectangularReflectionMapping;
//     scene.environment = texture;
//     scene.background = texture;
//   });


    // Point light
    const light1 = new THREE.PointLight(0xffffff, 10);
    light1.castShadow = true;
    scene.add(light1);

    const pointLight = new THREE.PointLight(0xFFFFFF, 0.5); // Luce direzionale con intensità 2
    pointLight.position.set(2.5, 2.5, 2.5); // Posiziona la luce sopra la scena
    pointLight.castShadow = true; // Abilita la creazione di ombre
    scene.add(pointLight);


    // REFLECTIVE FLOOR

    // Creare il riflettore
    // const refe = new Reflector(new THREE.PlaneGeometry(25, 15), {
    //      clipBias: 0.003,
    //      textureWidth: window.innerWidth * window.devicePixelRatio,
    //      extureHeight: window.innerHeight * window.devicePixelRatio,
    //      color: 0x777777
    //  });
    //  refe.rotateX(-Math.PI / 2); 
    //  refe.position.x = 6;
    //  scene.add(refe);

    // Creare il materiale opaco trasparente
    const planeMaterial = new THREE.MeshLambertMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.8
    });

    // Creare il secondo piano leggermente sopra il riflettore
    // const planeGeometry = new THREE.PlaneGeometry(25, 15);
    // const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    // plane.rotateX(-Math.PI / 2);
    // plane.position.y += 0.01;  // Posiziona leggermente sopra il riflettore
    // plane.position.x += 6; 
    // plane.receiveShadow = true;
    // scene.add(plane);


    const orbitControls = new OrbitControls(camera, renderer.domElement)
    orbitControls.enableDamping = true
    orbitControls.target.set(0, 1, 0)

    light1.shadow.mapSize.width = 1024;
    light1.shadow.mapSize.height = 1024;
    light1.shadow.camera.near = 0.1;
    light1.shadow.camera.far = 100;
    pointLight.shadow.mapSize.width = 1024;
    pointLight.shadow.mapSize.height = 1024;
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 100;

    // Back mirror
    // const mirrorBack1 = new Reflector(new THREE.PlaneGeometry(25, 15), {
    //     color: new THREE.Color(0x7f7f7f),
    //     textureWidth: window.innerWidth * window.devicePixelRatio,
    //     textureHeight: window.innerHeight * window.devicePixelRatio,
    // });

    // mirrorBack1.position.y = 7.5;
    // mirrorBack1.position.z = -6;
    // mirrorBack1.position.x = 6;
    // scene.add(mirrorBack1);




    // CYLINDERS
    const cylinderGeometry = new THREE.CylinderGeometry(0.01, 0.05, 10, 15);
    const cylinderMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x202020,
        emissiveIntensity: 2.0,
        roughness: 0.5,
        metalness: 0.1,
    });

    const cylinderSpacingX = 0.5;
    const cylinderSpacingZ = 3;

    let arrayCilindri = [];

    for (let j = 0; j < 4; j++) {
        arrayCilindri[j] = [];
        for (let i = 0; i < 40; i++) {
            const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
            // Posiziona il cilindro in modo che la sua base inferiore aderisca esattamente al piano
            cylinder.position.set(i * cylinderSpacingX - 6.5 * cylinderSpacingX, 5, j * cylinderSpacingZ - 1.5 * cylinderSpacingZ);
            cylinder.castShadow = true;
            scene.add(cylinder);
            arrayCilindri[j][i] = cylinder;
        }
    }

    // CANNON.js SETUP
    const world = new CANNON.World();
    world.gravity.set(-10, -9.81, 10);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    const fixedBody = new CANNON.Body({
        mass: 0, // Imposta a 0 per creare un corpo fisso
        position: new CANNON.Vec3(0, 2, 0),
    });
    world.addBody(fixedBody);

    const cylinderBodies = [];
    const cylinderShape = new CANNON.Cylinder(0.01, 0.1, 10, 15);
    const mass = 1;

    for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 40; i++) {
            const cylinderBody = new CANNON.Body({
                mass: mass,
                position: new CANNON.Vec3(i * cylinderSpacingX - 6.5 * cylinderSpacingX, 5, j * cylinderSpacingZ - 1.5 * cylinderSpacingZ),
            });
            cylinderBody.addShape(cylinderShape);
            world.addBody(cylinderBody);
            cylinderBodies.push(cylinderBody);

            // Aggiungi il vincolo tra il cilindro e il corpo fisso
            const constraint = new CANNON.PointToPointConstraint(cylinderBody, new CANNON.Vec3(0, 0, 0), fixedBody, new CANNON.Vec3(i * cylinderSpacingX - 6.5 * cylinderSpacingX, 0, j * cylinderSpacingZ - 1.5 * cylinderSpacingZ));
            world.addConstraint(constraint);
        }
    }

     // NOISE SETUP
 
     const clock = new THREE.Clock();

    function applySinusoidalMovement() {
        const time = performance.now() * 0.001;
        const amplitude = 5; // Amplitude del movimento sinusoidale
        const frequency = 0.5; // Frequenza del movimento sinusoidale
    
        for (let j = 0; j < 4; j++) {
            for (let i = 0; i < 40; i++) {
                const a = Math.floor(Math.random()*4);
                const b = Math.floor(Math.random()*40);
                const cylinder = arrayCilindri[a][b];
                if (cylinder) {
                    const offsetY = Math.sin(time * frequency + a * 0.5 + b * 0.1) * amplitude;
                    if (cylinder.position.y <= 5 && offsetY > 5) {
                        // Se il cilindro è sul piano e il movimento successivo sarebbe verso l'alto
                        // Imposta la posizione y al piano
                        cylinder.position.y = 0;
                    } else {
                        // Altrimenti, applica il movimento sinusoidale
                        cylinder.position.y = offsetY;
                    }
                }
            }
        }
    }
    
    

    // ANIMATION

    function animate() {
        requestAnimationFrame(animate);
        
        
        applySinusoidalMovement();


        renderer.render(scene, camera);
    }

    animate();

}


export function dispose() {
    window?.removeEventListener('resize', onWindowResize);
}
