// Import necessary modules from Three.js and SplineLoader
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import SplineLoader from '@splinetool/loader';

// Initialize the camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(-279.82, 147.11, 1587.26);
camera.quaternion.setFromEuler(new THREE.Euler(0.13, 0, 0));

// Create the scene
const scene = new THREE.Scene();

// Load the Spline scene
const loader = new SplineLoader();
loader.load(
  'https://prod.spline.design/5xralFUfZjqF4DkN/scene.splinecode',
  (splineScene) => {
    scene.add(splineScene);
    console.log('Spline scene loaded successfully.');
  },
  undefined,
  (error) => {
    console.error('Error loading Spline scene:', error);
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
  const button = document.getElementById('resizeButton');
  const splineContainer = document.getElementById('splineContainer');

  // Add event listener to the button for toggling the size
  button.addEventListener('click', () => {
    if (splineContainer.classList.contains('small')) {
      // When in small mode, switch to big mode
      splineContainer.classList.remove('small');
      splineContainer.classList.add('big');
      button.textContent = 'Small Screen';
      renderer.setSize(800, 600);
      camera.aspect = 800 / 600;
      controls.enabled = true; // Enable controls if needed
    } else if (splineContainer.classList.contains('big')) {
      // When in big mode, switch to full screen
      splineContainer.classList.remove('big');
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      button.textContent = 'Big Screen';
      controls.enabled = true; // Enable controls if needed
    } else {
      // When in full screen mode, switch to small mode
      splineContainer.classList.add('small');
      renderer.setSize(640, 480);
      camera.aspect = 640 / 480;
      button.textContent = 'Full Screen';
      controls.enabled = true; // Enable controls if needed
    }

    // Update the camera projection matrix and controls
    camera.updateProjectionMatrix();
  });
});
