import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Get the robot container element
const robotContainer = document.getElementById('robotContainer');
const containerWidth = robotContainer.clientWidth;
const containerHeight = robotContainer.clientHeight;

// Orthographic camera for robot control
const aspectRatio = containerWidth / containerHeight;
const cameraSize = 1000;

const robotCamera = new THREE.OrthographicCamera(
  (-cameraSize * aspectRatio) / 2,
  (cameraSize * aspectRatio) / 2,
  cameraSize / 2,
  -cameraSize / 2,
  -100000,
  100000
);

const cameraDistance = 1000;
const angleInRadians = THREE.MathUtils.degToRad(45);
const offset = Math.sin(angleInRadians) * cameraDistance;

robotCamera.position.set(offset, 0, offset);
robotCamera.lookAt(new THREE.Vector3(0, 0, 0));

// Scene for robot control
const robotScene = new THREE.Scene();

// Raycaster and mouse vector for hover detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const gltfLoader = new GLTFLoader();
let robotController; // Variable to store the loaded robot controller object
let isHovered = false; // Variable to track hover state

// Load the GLTF model
gltfLoader.load(
  './test.glb',
  (gltf) => {
    robotController = gltf.scene;
    robotScene.add(robotController);
    robotController.position.set(0, 0, 900);
    robotController.scale.set(200, 200, 200);
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  (error) => {
    console.error('An error happened during GLTF loading:', error);
  }
);

const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
robotScene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
robotScene.add(directionalLight);

const robotRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
robotRenderer.setClearColor(0x000000, 0);

if (robotContainer) {
  robotRenderer.setSize(containerWidth, containerHeight);
  robotContainer.appendChild(robotRenderer.domElement);
}

robotRenderer.shadowMap.enabled = true;
robotRenderer.shadowMap.type = THREE.PCFShadowMap;

let isCursorInside = false;

function onWindowResizeRobot() {
  const newWidth = robotContainer.clientWidth;
  const newHeight = robotContainer.clientHeight;

  const newAspectRatio = newWidth / newHeight;
  robotCamera.left = (-cameraSize * newAspectRatio) / 2;
  robotCamera.right = (cameraSize * newAspectRatio) / 2;
  robotCamera.top = cameraSize / 2;
  robotCamera.bottom = -cameraSize / 2;
  robotCamera.updateProjectionMatrix();

  robotRenderer.setSize(newWidth, newHeight);
}

// Function to handle mouse movement for hover effect and rotation
function onMouseMove(event) {
  const rect = robotContainer.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Update the raycaster with the mouse coordinates
  raycaster.setFromCamera(mouse, robotCamera);

  // Check if the ray intersects with the robotController
  if (robotController) {
    const intersects = raycaster.intersectObject(robotController, true);

    if (intersects.length > 0) {
      // Hovered, update rotation and scale
      updateRobotControllerRotation(event);
      if (!isHovered) {
        isHovered = true;
        animateScaleRobotController(1.2); // Increase size
      }
    } else {
      // Not hovered, reset rotation and scale
      animateRotationToInitial();
      if (isHovered) {
        isHovered = false;
        animateScaleRobotController(1.0); // Return to original size
      }
    }
  }
}

// Function to update the rotation of the robot controller based on mouse movement
function updateRobotControllerRotation(event) {
  if (!robotController) return;

  const rect = robotContainer.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / robotContainer.clientWidth) * 2 - 1;
  const y = -((event.clientY - rect.top) / robotContainer.clientHeight) * 2 + 1;

  const rotationRange = Math.PI / 4; // 45 degrees

  // Calculate target rotations
  const targetRotationY = x * rotationRange;
  const targetRotationX = -y * rotationRange;

  // Smoothly interpolate the current rotation towards the target rotation
  const smoothingFactor = 0.1; // Adjust this value for more or less smoothing
  robotController.rotation.y += (targetRotationY - robotController.rotation.y) * smoothingFactor;
  robotController.rotation.x += (targetRotationX - robotController.rotation.x) * smoothingFactor;
}

// Function to animate the scaling of the robot controller
function animateScaleRobotController(targetScale) {
  if (!robotController) return;

  // Animate scaling using requestAnimationFrame
  const animationDuration = 300; // Duration in milliseconds
  const startTime = performance.now();

  function animateScale(time) {
    const elapsedTime = time - startTime;
    const progress = Math.min(elapsedTime / animationDuration, 1);

    // Interpolate the scale
    const currentScale = THREE.MathUtils.lerp(robotController.scale.x, 250 * targetScale, progress);
    robotController.scale.set(currentScale, currentScale, currentScale);

    if (progress < 1) {
      requestAnimationFrame(animateScale);
    }
  }

  requestAnimationFrame(animateScale);
}

// Function to smoothly animate rotation back to the initial state
function animateRotationToInitial() {
  if (!robotController) return;

  // Smoothly interpolate the current rotation back to the initial rotation
  const smoothingFactor = 0.05; // Adjust this value for more or less smoothing
  robotController.rotation.x += (initialRotation.x - robotController.rotation.x) * smoothingFactor;
  robotController.rotation.y += (initialRotation.y - robotController.rotation.y) * smoothingFactor;

  // Continue animation if not close enough to the initial rotation
  if (Math.abs(initialRotation.x - robotController.rotation.x) > 0.01 || Math.abs(initialRotation.y - robotController.rotation.y) > 0.01) {
    requestAnimationFrame(animateRotationToInitial);
  }
}

// Event listener for mouse movement
window.addEventListener('mousemove', onMouseMove);

robotContainer.addEventListener('mouseenter', () => {
  isCursorInside = true;
});

robotContainer.addEventListener('mouseleave', () => {
  isCursorInside = false;

  // Start the smooth rotation animation when the cursor leaves
  requestAnimationFrame(animateRotationToInitial);
});

// Event listener for window resize
window.addEventListener('resize', onWindowResizeRobot);

// Start animation loop
function animateRobot() {
  robotRenderer.render(robotScene, robotCamera);
}
robotRenderer.setAnimationLoop(animateRobot);