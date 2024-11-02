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
        animateRemoteControllerScale(1.2);
      }
    } else {
      if (isHovered) {
        isHovered = false;
        animateRemoteControllerScale(1.0);
      }
    }
  }
}

// Function to animate the scale of the remoteController
function animateRemoteControllerScale(scaleFactor) {
  if (remoteController) {
    remoteController.scale.lerp(
      new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor),
      0.1
    );
  }
}

// Function to update rotation based on mouse position
function updateRemoteControllerRotation(event) {
  const rotationSpeed = 0.005;
  initialRotation.x += event.movementY * rotationSpeed;
  initialRotation.y += event.movementX * rotationSpeed;

  if (remoteController) {
    remoteController.rotation.x = initialRotation.x;
    remoteController.rotation.y = initialRotation.y;
  }
}

// Animation loop for rendering
function animateRemote() {
  requestAnimationFrame(animateRemote);
  remoteRenderer.render(remoteScene, remoteCamera);
}

// Add event listeners for interaction
window.addEventListener('resize', onWindowResizeRemote);
remoteContainer.addEventListener('mousemove', onMouseMove);

// Start animation loop
animateRemote();