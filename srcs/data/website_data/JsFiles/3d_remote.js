import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Get the remote container element
const remoteContainer = document.getElementById('remoteContainer');
const containerWidth = remoteContainer.clientWidth;
const containerHeight = remoteContainer.clientHeight;

// Orthographic camera for remote control
const aspectRatio = containerWidth / containerHeight;
const cameraSize = 50; // Adjust this value based on how zoomed in or out you want the view to be

const remoteCamera = new THREE.OrthographicCamera(
  (-cameraSize * aspectRatio) / 2,
  (cameraSize * aspectRatio) / 2,
  cameraSize / 2,
  -cameraSize / 2,
  -100000,
  100000
);
remoteCamera.position.set(0, 0, 1000);
remoteCamera.lookAt(new THREE.Vector3(0, 0, 0));

// Scene for remote control
const remoteScene = new THREE.Scene();

// Store initial rotation state
const initialRotation = { x: 0, y: 0 };

let remoteController; // Declare the remoteController variable

// Load the GLTF model
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  './low_poly_earth.glb',
  (gltf) => {
    remoteController = gltf.scene; // Assign the loaded scene to remoteController
    remoteScene.add(remoteController);
    remoteController.position.set(0, 0, 0);
    remoteController.scale.set(10, 10, 10);
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  (error) => {
    console.error('An error happened during GLTF loading:', error);
  }
);

// Set up the lighting
// Ambient light for general illumination
const ambientLight = new THREE.AmbientLight(0x404040, 8); // Soft white light with some intensity
remoteScene.add(ambientLight);

// Directional light to simulate a main light source
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10); // Position the light above and in front of the remote
directionalLight.castShadow = true; // Enable shadows
directionalLight.shadow.mapSize.width = 1024; // Shadow map resolution
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
remoteScene.add(directionalLight);

// Optionally, add a point light to add a nice highlight
const pointLight = new THREE.PointLight(0xffffff, 0.6);
pointLight.position.set(0, 20, 20); // Position the point light to shine directly on the remote
remoteScene.add(pointLight);

// Set up the renderer for the remote control
const remoteRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
remoteRenderer.setClearColor(0xFFFFFF, 0); // Transparent background

// Attach the renderer to the remote container
if (remoteContainer) {
  remoteRenderer.setSize(containerWidth, containerHeight);
  remoteContainer.appendChild(remoteRenderer.domElement);
}

// Scene settings for transparency
remoteRenderer.shadowMap.enabled = true;
remoteRenderer.shadowMap.type = THREE.PCFShadowMap;

// Variable to track if cursor is inside the container
let isCursorInside = false;

// Function to handle window resize
function onWindowResizeRemote() {
  const newWidth = remoteContainer.clientWidth;
  const newHeight = remoteContainer.clientHeight;

  // Update camera to maintain correct aspect ratio
  const newAspectRatio = newWidth / newHeight;
  remoteCamera.left = (-cameraSize * newAspectRatio) / 2;
  remoteCamera.right = (cameraSize * newAspectRatio) / 2;
  remoteCamera.top = cameraSize / 2;
  remoteCamera.bottom = -cameraSize / 2;
  remoteCamera.updateProjectionMatrix();

  // Update renderer size
  remoteRenderer.setSize(newWidth, newHeight);
}

// Function to update the rotation of the remote controller based on mouse movement
function updateRemoteControllerRotation(event) {
  if (!remoteController) return; // Check if remoteController is loaded

  const rect = remoteContainer.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / remoteContainer.clientWidth) * 2 - 1;
  const y = -((event.clientY - rect.top) / remoteContainer.clientHeight) * 2 + 1;

  const rotationRange = Math.PI / 4; // 45 degrees

  // Calculate target rotations
  const targetRotationY = x * rotationRange;
  const targetRotationX = -y * rotationRange;

  // Smoothly interpolate the current rotation towards the target rotation
  const smoothingFactor = 0.1; // Adjust this value for more or less smoothing
  remoteController.rotation.y += (targetRotationY - remoteController.rotation.y) * smoothingFactor;
  remoteController.rotation.x += (targetRotationX - remoteController.rotation.x) * smoothingFactor;
}

// Function to smoothly animate rotation back to the initial state
function animateRotationToInitial() {
  if (!remoteController) return;

  // Smoothly interpolate the current rotation back to the initial rotation
  const smoothingFactor = 0.05; // Adjust this value for more or less smoothing
  remoteController.rotation.x += (initialRotation.x - remoteController.rotation.x) * smoothingFactor;
  remoteController.rotation.y += (initialRotation.y - remoteController.rotation.y) * smoothingFactor;

  // Continue animation if not close enough to the initial rotation
  if (Math.abs(initialRotation.x - remoteController.rotation.x) > 0.01 || Math.abs(initialRotation.y - remoteController.rotation.y) > 0.01) {
    requestAnimationFrame(animateRotationToInitial);
  }
}

// Event listener for mouse movement
window.addEventListener('mousemove', updateRemoteControllerRotation);

// Event listeners for mouse enter and leave
remoteContainer.addEventListener('mouseenter', () => {
  isCursorInside = true;
});

remoteContainer.addEventListener('mouseleave', () => {
  isCursorInside = false;

  // Start the smooth rotation animation when the cursor leaves
  requestAnimationFrame(animateRotationToInitial);
});

// Event listener for window resize
window.addEventListener('resize', onWindowResizeRemote);

// Start animation loop
function animateRemote() {
  remoteRenderer.render(remoteScene, remoteCamera);
}
remoteRenderer.setAnimationLoop(animateRemote);