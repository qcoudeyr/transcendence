import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// main.js

let scene, camera, renderer, controls, animationId;
let sceneLoaded = false;

function initScene() {
  // Initialize the camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(-2.82, 1.11, 15.26);
  camera.quaternion.setFromEuler(new THREE.Euler(0.13, 0, 0));

  // Create the scene
  scene = new THREE.Scene();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1); // Bright white light, intensity 1.5
	scene.add(ambientLight);

	const directionalLight = new THREE.DirectionalLight(0xc4610f, 0.4); // White light, intensity 1
  directionalLight.position.set(0, 0.5, 0.6); // Position the light above the scene
  directionalLight.castShadow = true; // Enable shadows
  directionalLight.shadow.mapSize.width = 2048; // Shadow map size (higher for better quality)
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5; // Camera near clipping distance
  directionalLight.shadow.camera.far = 500; // Camera far clipping distance
  scene.add(directionalLight);

  const directionalLight2 = new THREE.DirectionalLight(0x0b4774, 0.4); // White light, intensity 1
  directionalLight2.position.set(0, 0.5, -0.6); // Position the light above the scene
  directionalLight2.castShadow = true; // Enable shadows
  directionalLight2.shadow.mapSize.width = 2048; // Shadow map size (higher for better quality)
  directionalLight2.shadow.mapSize.height = 2048;
  directionalLight2.shadow.camera.near = 0.5; // Camera near clipping distance
  directionalLight2.shadow.camera.far = 500; // Camera far clipping distance
  scene.add(directionalLight2);

  const cubed = new THREE.BoxGeometry(50, 50, 50);
  const basic = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  const basicred = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const basicpink = new THREE.MeshBasicMaterial({ color: 0xff00f9 });
  const cube1 = new THREE.Mesh(cubed, basic);
  scene.add(cube1);

  cube1.position.x = -3200.50;
  cube1.position.y = 1000;

  const cube3 = new THREE.Mesh(cubed, basicred);
  const geoffrey = new THREE.Mesh(cubed, basicpink);
  scene.add(geoffrey);
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
      gltf.scene.scale.set(0.1, 0.1, 0.1);
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
      console.error('An error happened during GLTF loading:', error);
    }
  );

  // Set up the renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  document.getElementById('splineContainer').appendChild(renderer.domElement);

  // Set the background color of the scene
  scene.background = new THREE.Color('#22202e');

  // Set up orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.125;

  // Resize handler to adjust the scene on window resize
  window.addEventListener('resize', onWindowResize);

  // Animation loop to render the scene
  function animate() {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  sceneLoaded = true;
  console.log("Scene loaded");
}

function onWindowResize() {
  if (!document.getElementById('splineContainer').classList.contains('small') &&
      !document.getElementById('splineContainer').classList.contains('big')) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

function unloadScene() {
  if (scene) {
    // Remove all objects from the scene
    while(scene.children.length > 0) { 
      scene.remove(scene.children[0]); 
    }

    // Dispose of geometries and materials
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    // Cancel the animation frame
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    // Dispose of the renderer
    if (renderer) {
      renderer.dispose();
      document.getElementById('splineContainer').removeChild(renderer.domElement);
    }

    // Remove event listeners
    window.removeEventListener('resize', onWindowResize);

    // Reset variables
    scene = null;
    camera = null;
    renderer = null;
    controls = null;
    animationId = null;

    sceneLoaded = false;
    console.log("Scene unloaded");
  }
}

function isSceneLoaded() {
  return sceneLoaded;
}

function disableNavBar() {
    document.querySelector('nav').style.display = 'none';
}

function enableNavBar() {
	document.querySelector('nav').style.display = 'block';
}

function checkHash() {
	if (window.location.hash === '#goodbye') {
		disableNavBar();
	}
    if (window.location.hash === '#playing') {
        if (!isSceneLoaded()) {
            initScene();
			disableNavBar();
        }
    } 
	else {
        if (isSceneLoaded()) {
            unloadScene();
        }
    }
}

window.addEventListener('load', checkHash);
window.addEventListener('hashchange', checkHash);


// Function to navigate to the home section
function goHome() {
    window.location.hash = 'home'; // Redirects to the home section
}


document.addEventListener('DOMContentLoaded', () => {
  const unloadButton = document.getElementById('unloadButton');
  if (unloadButton) {
    unloadButton.addEventListener('click', () => {
      if (isSceneLoaded()) {
        unloadScene();
		enableNavBar();
		goHome();
		console.log('scene unloaded and tried to nav');
		
      } else {
        console.log('Scene is not loaded');
      }
    });
  }
});