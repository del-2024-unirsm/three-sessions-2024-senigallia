// CILINDRI CHE OSCILLANO

let onWindowResize;
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector'



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
    // scene.background = new THREE.Color(debugObject.fogColor);

    // Load EXR texture
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

    /*const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1); // Soft white light con intensità 1
    scene.add(ambientLight);*/

    const pointLight = new THREE.PointLight(0xFFFFFF, 0.5); // Luce direzionale con intensità 2
    pointLight.position.set(2.5, 2.5, 2.5); // Posiziona la luce sopra la scena
    pointLight.castShadow = true; // Abilita la creazione di ombre
    scene.add(pointLight);


    // REFLECTIVE FLOOR

    // Creare il riflettore
    const refe = new Reflector(new THREE.PlaneGeometry(25, 15), {
         clipBias: 0.003,
         textureWidth: window.innerWidth * window.devicePixelRatio,
         extureHeight: window.innerHeight * window.devicePixelRatio,
         color: 0x777777
     });
     refe.rotateX(-Math.PI / 2); 
     refe.position.x = 6;
     scene.add(refe);

    // Creare il materiale opaco trasparente
    const planeMaterial = new THREE.MeshLambertMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.8
    });

    // Creare il secondo piano leggermente sopra il riflettore
    const planeGeometry = new THREE.PlaneGeometry(25, 15);
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotateX(-Math.PI / 2);
    plane.position.y += 0.01;  // Posiziona leggermente sopra il riflettore
    plane.position.x += 6; 
    plane.receiveShadow = true;
    scene.add(plane);


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

    const mirrorBack1 = new Reflector(new THREE.PlaneGeometry(25, 15), {
        color: new THREE.Color(0x7f7f7f),
        textureWidth: window.innerWidth * window.devicePixelRatio,
        textureHeight: window.innerHeight * window.devicePixelRatio,
    });

    mirrorBack1.position.y = 7.5;
    mirrorBack1.position.z = -6;
    mirrorBack1.position.x = 6;
    scene.add(mirrorBack1);




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
    world.gravity.set(-0.3, 9.81, 0.3);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    const fixedBody = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(0, 0, 0),
    });
    world.addBody(fixedBody);

    const cylinderBodies = [];
    const cylinderShape = new CANNON.Cylinder(0.01, 0.05, 10, 15);
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

            const constraint = new CANNON.PointToPointConstraint(cylinderBody, new CANNON.Vec3(0, -5, 0), fixedBody, new CANNON.Vec3(i * cylinderSpacingX - 6.5 * cylinderSpacingX, 0, j * cylinderSpacingZ - 1.5 * cylinderSpacingZ));
            world.addConstraint(constraint);
        }
    }

    
    // Funzione per applicare forze casuali ai cilindri
    function applyRandomForces() {
        for (let i = 0; i < cylinderBodies.length; i++) {
            const body = cylinderBodies[i];
            const force = new CANNON.Vec3(
                (Math.random() - 0.5) * 0.01,
                0,
                (Math.random() - 0.5) * 0.01
            );
            body.applyForce(force, body.position);
        }
    }

    // Funzione di animazione
    function animate() {
        //applyWindForces();
        requestAnimationFrame(animate);
        applyRandomForces()
    
        // Step di simulazione del mondo fisico
        world.step(1 / 60, 10);
    
        // Aggiorna le posizioni dei cilindri Three.js in base alle posizioni dei corpi Cannon.js
        for (let j = 0; j < 4; j++) {
            for (let i = 0; i < 40; i++) {
                const cylinder = arrayCilindri[j][i];
                const body = cylinderBodies[j * 40 + i];
                if (cylinder && body) {
                    cylinder.position.copy(body.position);
                    cylinder.quaternion.copy(body.quaternion);
                }
            }
        }
    
        orbitControls.update();
        render();
    }

    function render() {
        renderer.render(scene, camera);
    }

    animate();

}


export function dispose() {
    window?.removeEventListener('resize', onWindowResize);
}
