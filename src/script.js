import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Parameters
 */
const parameters = {}
parameters.count = 100000  // Number of stars in the galaxy
parameters.size = 0.01     // Size of each star
parameters.radius = 5      // Radius of the galaxy (controls the spread of stars)
parameters.branches = 3    // Number of branches in the galaxy
parameters.spin = 1        // Spin factor for the galaxy (controls rotational effect)
parameters.randomness = 0.2 // Randomness factor for star positions
parameters.randomnessPower = 3 // New randomness power parameter to control the randomness curve
parameters.insideColor = '#ff6030' // Color for stars near the center (inside)
parameters.outsideColor = '#1b3984' // Color for stars further from the center (outside)

/**
 * Variables for geometry, material, and points (moved outside of the function)
 */
let geometry = null
let material = null
let points = null

/**
 * Generate Galaxy
 */
const generateGalaxy = () => {
    // Destroy old galaxy if it exists
    if (points !== null) {
        geometry.dispose();   // Dispose of the old geometry
        material.dispose();   // Dispose of the old material
        scene.remove(points); // Remove the points (galaxy) from the scene
    }

    /**
     * Geometry
     */
    geometry = new THREE.BufferGeometry();  // Create a new BufferGeometry for the galaxy
    const positions = new Float32Array(parameters.count * 3);  // Create an array to hold the positions of the stars
    const colors = new Float32Array(parameters.count * 3);  // Create an array to hold the color data for each star

    // Create color instances for the inside and outside colors
    const colorInside = new THREE.Color(parameters.insideColor);
    const colorOutside = new THREE.Color(parameters.outsideColor);

    // Generate random positions and colors for each star
    for (let i = 0; i < parameters.count; i++) {
        const i3 = i * 3;  // 3 values per star (x, y, z)

        // Randomize the radius of the star along the x-axis using the radius parameter
        const radius = Math.random() * parameters.radius;

        // Apply spin effect: rotate each star based on its distance from the center
        const spinAngle = radius * parameters.spin;

        // Calculate the angle for each star to spread them across multiple branches
        const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2;

        // Apply randomness with power and random sign adjustment
        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;

        // Position the stars in a spiral galaxy formation with added spin effect and randomness
        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;  // X position with spin effect and randomness
        positions[i3 + 1] = randomY;  // Y position with randomness
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;  // Z position with spin effect and randomness

        // Interpolate between inside and outside colors based on the radius
        const mixedColor = colorInside.clone();  // Clone inside color to avoid modifying the original color
        mixedColor.lerp(colorOutside, radius / parameters.radius);  // Interpolate color based on the radius

        // Assign the interpolated color to the stars
        colors[i3] = mixedColor.r;  // Red channel
        colors[i3 + 1] = mixedColor.g;  // Green channel
        colors[i3 + 2] = mixedColor.b;  // Blue channel
    }

    // Set the positions and colors attributes for the geometry
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));  // Add color data to the geometry

    /**
     * Material
     */
    material = new THREE.PointsMaterial({
        size: parameters.size,         // Set the size of each star based on the parameter
        sizeAttenuation: true,         // Stars get smaller as they move away from the camera
        depthWrite: false,             // Prevent writing to depth buffer (important for additive blending)
        blending: THREE.AdditiveBlending, // Use additive blending for brighter effect
        vertexColors: true            // Enable vertex colors for each star
    });

    /**
     * Points
     */
    points = new THREE.Points(geometry, material); // Create a Points object with the geometry and material
    scene.add(points);  // Add the points (galaxy) to the scene
}

// Call the function to generate the galaxy initially
generateGalaxy();

/**
 * GUI Controls
 */
gui.add(parameters, 'count').min(100).max(1000000).step(100).onFinishChange(generateGalaxy)
gui.add(parameters, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)  // New radius parameter
gui.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy)  // New branches parameter
gui.add(parameters, 'spin').min(-5).max(5).step(0.001).onFinishChange(generateGalaxy)  // New spin parameter
gui.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)  // New randomness parameter
gui.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)  // New randomnessPower parameter

// Add color controls to the GUI
gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 3
camera.position.y = 3
camera.position.z = 3
scene.add(camera)

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Rotate the galaxy to simulate spinning
    if (points) {
        points.rotation.y = elapsedTime * 0.05;  // Slow rotation around the Y-axis
    }

    // Update controls
    controls.update()

    // Render the scene
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
