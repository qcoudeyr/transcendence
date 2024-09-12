import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Initialize the camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(-279.82, 147.11, 1587.26);
camera.quaternion.setFromEuler(new THREE.Euler(0.13, 0, 0));

// Create the scene
const scene = new THREE.Scene();

const teste = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( teste );

const light = new THREE.RectAreaLight(0xff0000, 1, 100, 100);
    light.position.set(680, 220, -200);
    light.rotation.x = THREE.MathUtils.degToRad(0);
    scene.add(light);

    const light3 = new THREE.RectAreaLight(0xff00c8, 1, 100, 100);
    light3.position.set(530, 220, -200);
    light3.rotation.x = THREE.MathUtils.degToRad(0);
    scene.add(light3);

    const light4 = new THREE.RectAreaLight(0x0300be, 15, 100, 100);
    light4.position.set(-200, 240, 200);
    light4.rotation.x = THREE.MathUtils.degToRad(180);
    scene.add(light4);

    const light5 = new THREE.RectAreaLight(0xb300be, 10, 100, 100);
    light5.position.set(0, 240, 200);
    light5.rotation.x = THREE.MathUtils.degToRad(180);
    scene.add(light5);

    const WHITETEST = new THREE.RectAreaLight(0xFFFFFF, 10, 100, 100);
    WHITETEST.position.set(200, 240, 200);
    WHITETEST.rotation.x = THREE.MathUtils.degToRad(-90);
    scene.add(WHITETEST);

	const WHITETEST2 = new THREE.RectAreaLight(0xFFFFFF, 10, 100, 100);
    WHITETEST2.position.set(-100, 240, 0);
    WHITETEST2.rotation.x = THREE.MathUtils.degToRad(360);
    scene.add(WHITETEST2);

	const cubed = new THREE.BoxGeometry( 50, 50, 50 );
	const basic = new THREE.MeshBasicMaterial( { color: 0xFFFFFF } );
	const basicred = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
	const basicpink = new THREE.MeshBasicMaterial( { color: 0xff00f9 } );
	const cube1 = new THREE.Mesh( cubed, basic );
	scene.add( cube1 );



	cube1.position.x = -3200.50;
	cube1.position.y = 1000;


	const cube3 = new THREE.Mesh(cubed, basicred);
	const geoffrey = new THREE.Mesh(cubed, basicpink);
	scene.add (geoffrey);
	scene.add(cube3);

	geoffrey.position.x = -320;
	geoffrey.position.y = 100;

	cube3.position.x = 0;
	cube3.position.y = 250;


// Load GLTF model
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  '../Cyberpunkv2.glb',
  (gltf) => {
    scene.add(gltf.scene);
    gltf.scene.position.set(0, 0, 0);
    gltf.scene.scale.set(10, 10, 10);
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  (error) => {
    console.error('An error happened during GLTF loading:', error);
  }
);

// Set up the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.getElementById('splineContainer').appendChild(renderer.domElement);

// Set the background color of the scene
scene.background = new THREE.Color('#22202e');

// Set up orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.125;

// Resize handler to adjust the scene on window resize
window.addEventListener('resize', onWindowResize);

function onWindowResize() {
  if (!document.getElementById('splineContainer').classList.contains('small') &&
      !document.getElementById('splineContainer').classList.contains('big')) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Animation loop to render the scene
function animate() {
  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

// DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
  const button = document.getElementById('resizeButton');
  const splineContainer = document.getElementById('splineContainer');

  button.addEventListener('click', () => {
    if (splineContainer.classList.contains('small')) {
      splineContainer.classList.remove('small');
      splineContainer.classList.add('big');
      button.textContent = 'Small Screen';
      renderer.setSize(800, 600);
      camera.aspect = 800 / 600;
    } else if (splineContainer.classList.contains('big')) {
      splineContainer.classList.remove('big');
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      button.textContent = 'Big Screen';
    } else {
      splineContainer.classList.add('small');
      renderer.setSize(640, 480);
      camera.aspect = 640 / 480;
      button.textContent = 'Full Screen';
    }

    camera.updateProjectionMatrix();
  });
});