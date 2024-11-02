import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { isUnloaded } from '../Modules/navigation.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { getWebsocket } from '../WebSocket/websocket-open.js';

let scene, camera, renderer, controls, animationId;
const geometry = new THREE.SphereGeometry(0.1, 32, 32);

// Create a material for the ball with realistic properties
const material = new THREE.MeshStandardMaterial({
    color: 0xFB00BE,
    roughness: 0.3,  // Adjust for a bit of glossiness
    metalness: 0.5,  // Increased metallic property
});
const ball = new THREE.Mesh(geometry, material);

const radius = 0.12;          
const length = 0.3;          
const radialSegments = 2; 

const capsuleGeometry = new THREE.CapsuleGeometry(radius, length, radialSegments);
const capsuleMaterial = new THREE.MeshStandardMaterial({ color: 0x0077ff });

const pad0 = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
const pad1 = new THREE.Mesh(capsuleGeometry, capsuleMaterial);

const cameraPad0 = new THREE.PerspectiveCamera(
	45, // Field of view
	window.innerWidth / window.innerHeight, // Aspect ratio
	0.1, // Near clipping plane
	100 // Far clipping plane
);


let sceneLoaded = false;

export function getCameraPad0()
{
	return cameraPad0;
}


export function getScene() {
    return scene;
}

export function getBall() {
    return ball;
}

export function getPad0() {
    return pad0;
}

export function getPad1() {
    return pad1;
}

export function initScene() {
    cameraPad0.position.set(-2.82, 1.11, 15.26);
    cameraPad0.quaternion.setFromEuler(new THREE.Euler(0.13, 0, 0));

    scene = new THREE.Scene();
    ball.position.y = 0.15;
    pad0.position.set(5, 0.15, 0);
    pad0.rotation.set(Math.PI / 2, 0, 0); 
    pad1.position.set(-5, 0.15, 0);
    pad1.rotation.set(Math.PI / 2, 0, 0); 
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1); // Increased intensity
    scene.add(ambientLight);
    const directionalLight2 = new THREE.DirectionalLight(0x0b4774, 1); // Cooler light
    directionalLight2.position.set(-5, 10, -7);
    directionalLight2.castShadow = true;
    directionalLight2.shadow.mapSize.width = 2048;
    directionalLight2.shadow.mapSize.height = 2048;
    scene.add(directionalLight2);
    scene.add(ball);
    scene.add(pad1);
    scene.add(pad0);

    // Load GLTF model
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
        '../Cyberpunkv2.glb',
        (gltf) => {
            scene.add(gltf.scene);
            gltf.scene.position.set(0, 0, 0);
            gltf.scene.scale.set(0.1, 0.1, 0.1);

            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;  
                    child.receiveShadow = true;
                }
            });

            // Example of setting emissive properties
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    if (child.name === "YourEmissivePartName") {
                        child.material.emissive = new THREE.Color(0xFF0000); 
                        child.material.emissiveIntensity = 1.0; 
                    }
                }
            });
        },
        (xhr) => {
            const loadPercentage = (xhr.loaded / xhr.total) * 100;
        	console.log(loadPercentage + '% loaded');

        if (loadPercentage === 100) {
            let socket = getWebsocket();
			socket.send(JSON.stringify({
				'type': 'game_ready',
			}));
        }
        },
        (error) => {
            console.error('An error happened during GLTF loading:', error);
        }
    );

    // HDR Environment Map (use an appropriate HDR texture)
    const hdrLoader = new RGBELoader();
    hdrLoader.load('../test.hdr', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping; // Use reflection mapping
        scene.background = texture; // Set background to HDR texture
        scene.environment = texture; // Set environment for realistic reflections
    });

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;
    document.getElementById('splineContainer').appendChild(renderer.domElement);
    
    // Remove the line below to keep the HDR background
    // scene.background = new THREE.Color('#22202e'); // Remove or comment this line

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.125;

    function animate() {
        animationId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    sceneLoaded = true;
    console.log("Scene loaded");
}

// ... rest of your code remains the same

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
	isUnloaded();
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