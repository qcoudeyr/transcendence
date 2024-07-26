import * as THREE from 'three';
import SplineLoader from '@splinetool/loader';

// Get the remote container element
const remoteContainer = document.getElementById('remoteContainer');
const containerWidth = remoteContainer.clientWidth;
const containerHeight = remoteContainer.clientHeight;

// Orthographic camera for remote control
const aspectRatio = containerWidth / containerHeight;
const cameraSize = 1000; // Adjust this value based on how zoomed in or out you want the view to be

const remoteCamera = new THREE.OrthographicCamera(
  -cameraSize * aspectRatio / 2,
  cameraSize * aspectRatio / 2,
  cameraSize / 2,
  -cameraSize / 2,
  -100000,
  100000
);
remoteCamera.position.set(0, 0, 1000);
remoteCamera.lookAt(new THREE.Vector3(0, 0, 0));

// Scene for remote control
const remoteScene = new THREE.Scene();

// Load the Spline remote control
const remoteLoader = new SplineLoader();
let remoteController; // Variable to store the loaded remote controller object

// Store initial rotation state
const initialRotation = { x: 0, y: 0 };

remoteLoader.load(
  'https://prod.spline.design/70lI1f4u6GTMzTOX/scene.splinecode',
  (splineScene) => {
    remoteController = splineScene;
    remoteScene.add(splineScene);
    
    // Store initial rotation
    if (remoteController) {
      initialRotation.x = remoteController.rotation.x;
      initialRotation.y = remoteController.rotation.y;
    }
  }
);

// Set up the renderer for the remote control
const remoteRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
remoteRenderer.setClearColor(0x000000, 0); // Transparent background

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
  remoteCamera.left = -cameraSize * newAspectRatio / 2;
  remoteCamera.right = cameraSize * newAspectRatio / 2;
  remoteCamera.top = cameraSize / 2;
  remoteCamera.bottom = -cameraSize / 2;
  remoteCamera.updateProjectionMatrix();

  // Update renderer size
  remoteRenderer.setSize(newWidth, newHeight);
}

// Function to update the rotation of the remote controller based on mouse movement
function updateRemoteControllerRotation(event) {
  if (!remoteController || !isCursorInside) return;

  const rect = remoteContainer.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / remoteContainer.clientWidth) * 2 - 1;
  const y = -((event.clientY - rect.top) / remoteContainer.clientHeight) * 2 + 1;

  const rotationRange = Math.PI / 4; // 45 degrees

  // Update the remote controller's rotation
  remoteController.rotation.y = -x * rotationRange;
  remoteController.rotation.x = -y * rotationRange;
}

// Event listener for mouse movement
window.addEventListener('mousemove', updateRemoteControllerRotation);

// Event listeners for mouse enter and leave
remoteContainer.addEventListener('mouseenter', () => {
  isCursorInside = true;
});

remoteContainer.addEventListener('mouseleave', () => {
  isCursorInside = false;

  // Reset rotation when cursor leaves
  if (remoteController) {
    remoteController.rotation.x = initialRotation.x;
    remoteController.rotation.y = initialRotation.y;
  }
});

// Event listener for window resize
window.addEventListener('resize', onWindowResizeRemote);

// Start animation loop
function animateRemote() {
  remoteRenderer.render(remoteScene, remoteCamera);
}
remoteRenderer.setAnimationLoop(animateRemote);
