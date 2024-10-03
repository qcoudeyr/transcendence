import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Get the robot container element
const robotContainer = document.getElementById('robotContainer');
const containerWidth = robotContainer.clientWidth;
const containerHeight = robotContainer.clientHeight;

// Orthographic camera for robot control
const aspectRatio = containerWidth / containerHeight;
const cameraSize = 50;

const robotCamera = new THREE.OrthographicCamera(
  (-cameraSize * aspectRatio) / 2,
  (cameraSize * aspectRatio) / 2,
  cameraSize / 2,
  -cameraSize / 2,
  -100000,
  100000
);
robotCamera.position.set(1000, 0, 0); // Camera positioned on the right side
robotCamera.lookAt(new THREE.Vector3(0, 0, 0));
robotCamera.up.set(0, 1, 0);

// Scene for robot control
const robotScene = new THREE.Scene();

// Raycaster and mouse vector for hover detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const initialRotation = { y: 0 };
let robotController; // Declare the robotController variable
let isHovered = false; // Variable to track hover state
let initialScale = 2.5; // Declare initialScale variable

// Load the GLTF model
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  'clouds_local.glb',
  (gltf) => {
    robotController = gltf.scene; // Assign the loaded scene to robotController
    robotScene.add(robotController);
    robotController.position.set(-10, -30, -10); // Adjusted for new camera position
    robotController.scale.set(initialScale, initialScale, initialScale);
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  (error) => {
    console.error('An error happened during GLTF loading:', error);
  }
);

// Set up the lighting (restored to original)
const ambientLight = new THREE.AmbientLight(0x404040, 8);
robotScene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10); // Original position
directionalLight.castShadow = true;
robotScene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 0.6);
pointLight.position.set(0, 20, 20); // Original position
robotScene.add(pointLight);

// Set up the renderer for the robot control
const robotRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
robotRenderer.setClearColor(0xFFFFFF, 0);

if (robotContainer) {
  robotRenderer.setSize(containerWidth, containerHeight);
  robotContainer.appendChild(robotRenderer.domElement);
}

robotRenderer.shadowMap.enabled = true;
robotRenderer.shadowMap.type = THREE.PCFShadowMap;

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

  raycaster.setFromCamera(mouse, robotCamera);

  if (robotController) {
    const intersects = raycaster.intersectObject(robotController, true);

    if (intersects.length > 0) {
      updateRobotControllerRotation(event);
      if (!isHovered) {
        isHovered = true;
        animateScaleRobotController(1.2); // Increase size on hover
      }
    } else {
      animateRotationToInitial();
      if (isHovered) {
        isHovered = false;
        animateScaleRobotController(1.0); // Return to original size when not hovered
      }
    }
  }
}

// Function to update the rotation of the robot controller based on mouse movement
function updateRobotControllerRotation(event) {
  if (!robotController) return; // Check if robotController is loaded

  const rect = robotContainer.getBoundingClientRect();
  
// Only use horizontal mouse position for rotation around Y-axis
const x = ((event.clientX - rect.left) / robotContainer.clientWidth) * 2 - 1;

const rotationRange = Math.PI /4; // Limit rotation range to +/-45 degrees

// Calculate target rotation based on horizontal mouse position
const targetRotationY = x * rotationRange;

// Smoothly interpolate the current rotation towards the target rotation
const smoothingFactor = .1; 
robotController.rotation.y += (targetRotationY - robotController.rotation.y) * smoothingFactor; 
}

// Function to animate the scaling of the robot controller
function animateScaleRobotController(targetScale) {
if (!robotController) return;

const animationDuration =300; // Duration in milliseconds 
const startScale=robotController.scale.x; 
const targetScaleValue=initialScale*targetScale; 
const startTime=performance.now();

function animateScale(time){
    const elapsedTime=time-startTime; 
    const progress=Math.min(elapsedTime/animationDuration,1);

    const currentScale=THREE.MathUtils.lerp(startScale,targetScaleValue,progress); 
    robotController.scale.set(currentScale,currentScale,currentScale);

    if(progress<1){
        requestAnimationFrame(animateScale);
    }
}

requestAnimationFrame(animateScale);
}

// Function to smoothly animate rotation back to the initial state
function animateRotationToInitial() {
if (!robotController) return;

// Smoothly interpolate the current rotation back to the initial rotation 
const smoothingFactor=0.05; 
robotController.rotation.y += (initialRotation.y-robotController.rotation.y)*smoothingFactor;

// Continue animation if not close enough to the initial rotation 
if(Math.abs(initialRotation.y-robotController.rotation.y)>0.01){
    requestAnimationFrame(animateRotationToInitial);
}
}

// Event listeners 
window.addEventListener('mousemove', onMouseMove); 
window.addEventListener('resize', onWindowResizeRobot);

// Animation loop 
function animateRobot() { 
    robotRenderer.render(robotScene, robotCamera); 
    requestAnimationFrame(animateRobot); 
} 
animateRobot();