import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Get the remote container element
const remoteContainer = document.getElementById('remoteContainer');
const containerWidth = remoteContainer.clientWidth;
const containerHeight = remoteContainer.clientHeight;

// Orthographic camera for remote control
const aspectRatio = containerWidth / containerHeight;
const cameraSize = 50;

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

// Raycaster and mouse vector for hover detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const initialRotation = { x: 0, y: 0 };
let remoteController; // Declare the remoteController variable
let isHovered = false; // Variable to track hover state

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
    // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  (error) => {
    console.error('An error happened during GLTF loading:', error);
  }
);

// Set up the lighting
const ambientLight = new THREE.AmbientLight(0x404040, 8);
remoteScene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
remoteScene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 0.6);
pointLight.position.set(0, 20, 20);
remoteScene.add(pointLight);

// Set up the renderer for the remote control
const remoteRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
remoteRenderer.setClearColor(0xFFFFFF, 0);

if (remoteContainer) {
  remoteRenderer.setSize(containerWidth, containerHeight);
  remoteContainer.appendChild(remoteRenderer.domElement);
}

remoteRenderer.shadowMap.enabled = true;
remoteRenderer.shadowMap.type = THREE.PCFShadowMap;

function onWindowResizeRemote() {
  const newWidth = remoteContainer.clientWidth;
  const newHeight = remoteContainer.clientHeight;

  const newAspectRatio = newWidth / newHeight;
  remoteCamera.left = (-cameraSize * newAspectRatio) / 2;
  remoteCamera.right = (cameraSize * newAspectRatio) / 2;
  remoteCamera.top = cameraSize / 2;
  remoteCamera.bottom = -cameraSize / 2;
  remoteCamera.updateProjectionMatrix();

  remoteRenderer.setSize(newWidth, newHeight);
}

// Function to handle mouse movement for hover effect and rotation
function onMouseMove(event) {
  const rect = remoteContainer.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Update the raycaster with the mouse coordinates
  raycaster.setFromCamera(mouse, remoteCamera);

  // Check if the ray intersects with the remoteController
  if (remoteController) {
    const intersects = raycaster.intersectObject(remoteController, true);

    if (intersects.length > 0) {
      // Hovered, update rotation and scale
      updateRemoteControllerRotation(event);
      if (!isHovered) {
        isHovered = true;
        animateScaleRemoteController(1.2); // Increase size
      }
    } else {
      // Not hovered, reset rotation and scale
      animateRotationToInitial();
      if (isHovered) {
        isHovered = false;
        animateScaleRemoteController(1.0); // Return to original size
      }
    }
  }
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

// Function to animate the scaling of the remote controller
function animateScaleRemoteController(targetScale) {
  if (!remoteController) return;

  // Animate scaling using requestAnimationFrame
  const animationDuration = 300; // Duration in milliseconds
  const startScale = remoteController.scale.x;
  const targetScaleValue = 10 * targetScale;
  const startTime = performance.now();

  function animateScale(time) {
    const elapsedTime = time - startTime;
    const progress = Math.min(elapsedTime / animationDuration, 1);

    // Interpolate the scale
    const currentScale = THREE.MathUtils.lerp(startScale, targetScaleValue, progress);
    remoteController.scale.set(currentScale, currentScale, currentScale);

    if (progress < 1) {
      requestAnimationFrame(animateScale);
    }
  }

  requestAnimationFrame(animateScale);
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


function onMouseClick(event) {
	const rect = remoteContainer.getBoundingClientRect();
	mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
	mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
	raycaster.setFromCamera(mouse, remoteCamera);
  
	if (remoteController) {
	  const intersects = raycaster.intersectObject(remoteController, true);
  
	  if (intersects.length > 0) {
		remoteController.traverse((child) => {
		  if (child.isMesh) {
			child.material.color.set(0x808080); // Set to gray
		  }
		});
	  }
	}
  }

  window.addEventListener('click', onMouseClick);
// Event listener for mouse movement
window.addEventListener('mousemove', onMouseMove);

// Event listener for window resize
window.addEventListener('resize', onWindowResizeRemote);

// Start animation loop
function animateRemote() {
  remoteRenderer.render(remoteScene, remoteCamera);
}
remoteRenderer.setAnimationLoop(animateRemote);
