import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// main.js

let scene, camera, renderer, controls, animationId;
const geometry = new THREE.SphereGeometry(0.1, 32, 32);

	// Create a material for the ball
	const material = new THREE.MeshStandardMaterial({
		color: 0xFB00BE, // Color of the ball
		roughness: 0.4,  // Adjust for a bit of glossiness
		metalness: 0.1,  // Slightly metallic
	});
const ball = new THREE.Mesh(geometry, material);
let sceneLoaded = false;

export function getScene()
{
	return scene;
}

export function getBall()
{
	return ball;
}

// Store references outside of function scope

export function initScene() {
	if (animationId) cancelAnimationFrame(animationId);
	if (scene) {
	  while (scene.children.length > 0) {
		scene.remove(scene.children[0]);
	  }
	}
  
	// Initialize the camera and scene
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
	camera.position.set(-2.82, 1.11, 15.26);
	camera.quaternion.setFromEuler(new THREE.Euler(0.13, 0, 0));
  
	scene = new THREE.Scene();
	scene.background = new THREE.Color('#22202e');
	ball.position.y = 0.15;
  
	// Add lights
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
	scene.add(ambientLight);
  
	const directionalLight = new THREE.DirectionalLight(0xc4610f, 0.4);
	directionalLight.position.set(0, 0.5, 0.6);
	directionalLight.castShadow = true;
	scene.add(directionalLight);
  
	const directionalLight2 = new THREE.DirectionalLight(0x0b4774, 0.4);
	directionalLight2.position.set(0, 0.5, -0.6);
	directionalLight2.castShadow = true;
	scene.add(directionalLight2);
  
	scene.add(ball);
  
	// Load GLTF model
	const gltfLoader = new GLTFLoader();
	gltfLoader.load(
	  '../Cyberpunkv2.glb',
	  (gltf) => {
		scene.add(gltf.scene);
		gltf.scene.position.set(0, 0, 0);
		gltf.scene.scale.set(0.1, 0.1, 0.1);
	  },
	  (xhr) => console.log(`${(xhr.loaded / xhr.total * 100)}% loaded`),
	  (error) => console.error('GLTF loading error:', error)
	);
  
	// Create renderer if it doesn't already exist
	if (!renderer) {
	  renderer = new THREE.WebGLRenderer({ antialias: true });
	  renderer.setSize(window.innerWidth, window.innerHeight);
	  renderer.shadowMap.enabled = true;
	  renderer.shadowMap.type = THREE.PCFShadowMap;
	  document.getElementById('splineContainer').appendChild(renderer.domElement);
	}
  
	// Set up orbit controls
	if (controls) controls.dispose();
	controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.125;
  
	// Resize handling
	window.addEventListener('resize', onWindowResize);
  
	// Animation loop
	function animate() {
	  animationId = requestAnimationFrame(animate);
	  controls.update();
	  renderer.render(scene, camera);
	}
	animate();
  
	console.log("Scene loaded");
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