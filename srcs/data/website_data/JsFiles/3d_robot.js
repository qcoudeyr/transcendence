import * as THREE from 'three';
import SplineLoader from '@splinetool/loader';

// Get the robot container element
const robotContainer = document.getElementById('robotContainer');
const containerWidth = robotContainer.clientWidth;
const containerHeight = robotContainer.clientHeight;

// Orthographic camera for robot control
const aspectRatio = containerWidth / containerHeight;
const cameraSize = 1000; // Adjust this value based on how zoomed in or out you want the view to be

const robotCamera = new THREE.OrthographicCamera(
  (-cameraSize * aspectRatio) / 2,
  (cameraSize * aspectRatio) / 2,
  cameraSize / 2,
  -cameraSize / 2,
  -100000,
  100000
);

// Position the camera slightly higher to ensure padding at the bottom
const cameraDistance = 1000; // Distance from the robot
const cameraHeight = 0; // Height adjustment to add padding at the bottom

robotCamera.position.set(0, cameraHeight, cameraDistance);
robotCamera.lookAt(new THREE.Vector3(0, 0, 0)); // Look at the origin

// Scene for robot control
const robotScene = new THREE.Scene();

// Load the Spline robot control
const robotLoader = new SplineLoader();
let robotController; // Variable to store the loaded robot controller object

// Store initial rotation state
const initialRotation = { x: 0, y: 0 };

robotLoader.load(
  'https://prod.spline.design/KYNdbTcnGM3bvnVs/scene.splinecode',
  (splineScene) => {
    robotController = splineScene;
    robotScene.add(splineScene);

    // Store initial rotation
    if (robotController) {
      initialRotation.x = robotController.rotation.x;
      initialRotation.y = robotController.rotation.y;

      // Adjust the height of the robot to match the remote
      robotController.position.y = 0; // Adjust this value as needed to match the height
    }
  }
);

// Set up the renderer for the robot control
const robotRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
robotRenderer.setClearColor(0x000000, 0); // Transparent background

// Attach the renderer to the robot container
if (robotContainer) {
  robotRenderer.setSize(containerWidth, containerHeight);
  robotContainer.appendChild(robotRenderer.domElement);
}

// Scene settings for transparency
robotRenderer.shadowMap.enabled = true;
robotRenderer.shadowMap.type = THREE.PCFShadowMap;

// Variable to track if cursor is inside the container
let isCursorInside = false;

// Function to handle window resize
function onWindowResizeRobot() {
  const newWidth = robotContainer.clientWidth;
  const newHeight = robotContainer.clientHeight;

  // Update camera to maintain correct aspect ratio
  const newAspectRatio = newWidth / newHeight;
  robotCamera.left = (-cameraSize * newAspectRatio) / 2;
  robotCamera.right = (cameraSize * newAspectRatio) / 2;
  robotCamera.top = cameraSize / 2;
  robotCamera.bottom = -cameraSize / 2;
  robotCamera.updateProjectionMatrix();

  // Update renderer size
  robotRenderer.setSize(newWidth, newHeight);
}

// Function to update the rotation of the robot controller based on mouse movement
function updateRobotControllerRotation(event) {
  if (!robotController || !isCursorInside) return;

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
window.addEventListener('mousemove', updateRobotControllerRotation);

// Event listeners for mouse enter and leave
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
