// We rely on the globally available THREE object from the CDN
console.log("CANVAS 3D: Quantum Data Matrix Engine Active");

// Create a visual indicator that the new script is running
const versionDiv = document.createElement('div');
versionDiv.style.cssText = 'position:fixed; bottom:10px; right:10px; color:#00f2fe; z-index:99999; font-size:12px; font-family:monospace; opacity: 0.5;';
versionDiv.innerText = 'Matrix Engine: v3 Active';
document.body.appendChild(versionDiv);

const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 12;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ==========================================
// QUANTUM PARTICLE MATRIX
// ==========================================
const particleGroup = new THREE.Group();
scene.add(particleGroup);

const particleCount = 12000;
const knotPositions = new Float32Array(particleCount * 3);
const spherePositions = new Float32Array(particleCount * 3);
const burstPositions = new Float32Array(particleCount * 3);
const currentPositions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

const colorObj = new THREE.Color();

for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    
    // 1. SPHERE BASE
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 3.5;
    
    const sx = radius * Math.sin(phi) * Math.cos(theta);
    const sy = radius * Math.sin(phi) * Math.sin(theta);
    const sz = radius * Math.cos(phi);
    
    spherePositions[i3] = sx;
    spherePositions[i3+1] = sy;
    spherePositions[i3+2] = sz;
    
    // 2. SUNBURST (Exploded Sphere)
    const burstFactor = 1.5 + (Math.random() * 15.0); // Massive explosion
    burstPositions[i3] = sx * burstFactor;
    burstPositions[i3+1] = sy * burstFactor;
    burstPositions[i3+2] = sz * burstFactor;
    
    // 3. TORUS KNOT (Infinity Loop)
    const t = Math.random() * Math.PI * 2;
    const u = Math.random() * Math.PI * 2;
    const p = 2; const q = 3; const r = 2.2; const tube = 0.8;
    
    const cu = Math.cos(p * t);
    const su = Math.sin(p * t);
    const qu = Math.cos(q * t);
    const su2 = Math.sin(q * t);
    
    const rad = r + tube * qu;
    
    const kx = rad * cu + tube * Math.cos(u) * cu;
    const ky = rad * su + tube * Math.cos(u) * su;
    const kz = tube * su2 + tube * Math.sin(u);
    
    knotPositions[i3] = kx;
    knotPositions[i3+1] = ky;
    knotPositions[i3+2] = kz;
    
    // Initial State is Knot
    currentPositions[i3] = kx;
    currentPositions[i3+1] = ky;
    currentPositions[i3+2] = kz;
    
    // Vertex Colors based on spatial positioning (Cyan -> Magenta -> Violet)
    const hue = 0.5 + (kx / 15) + (ky / 15);
    colorObj.setHSL(hue, 1.0, 0.6); 
    colors[i3] = colorObj.r;
    colors[i3+1] = colorObj.g;
    colors[i3+2] = colorObj.b;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
});

const mainParticles = new THREE.Points(geometry, material);
particleGroup.add(mainParticles);


// ==========================================
// SCROLL & INTERACTION LOGIC
// ==========================================
let targetScrollProgress = 0;
let currentScrollProgress = 0;
let isThinkingGlobal = false;

// Attach scroll listener
const chatContainer = document.getElementById('chat-messages');
if (chatContainer) {
    chatContainer.addEventListener('scroll', () => {
        const maxScroll = chatContainer.scrollHeight - chatContainer.clientHeight;
        if(maxScroll > 0) {
            targetScrollProgress = chatContainer.scrollTop / maxScroll;
        } else {
            targetScrollProgress = 0;
        }
    });
}

// Observe Thinking State
let targetSpeed = 0.002;
let currentSpeed = 0.002;

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
            isThinkingGlobal = document.body.classList.contains('state-thinking');
            targetSpeed = isThinkingGlobal ? 0.02 : 0.002;
        }
    });
});
observer.observe(document.body, { attributes: true });


// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Magnetic Cursor Logic
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-999, -999);
let rawMouseX = 0;
let rawMouseY = 0;

document.addEventListener('mousemove', (event) => {
    rawMouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    rawMouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});


// ==========================================
// RENDER LOOP
// ==========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    currentSpeed += (targetSpeed - currentSpeed) * 0.05;
    currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.1;
    
    // Cast ray to find mouse point in 3D space
    raycaster.setFromCamera(mouse, camera);
    const mousePoint = new THREE.Vector3();
    raycaster.ray.at(12, mousePoint); // Match camera.position.z roughly

    const positions = mainParticles.geometry.attributes.position.array;
    
    // Physics and Morphing Loop
    for(let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // 1. Determine Target Shape
        let tx = knotPositions[i3];
        let ty = knotPositions[i3+1];
        let tz = knotPositions[i3+2];
        
        if (isThinkingGlobal) {
            // Force Sunburst if thinking
            tx = burstPositions[i3];
            ty = burstPositions[i3+1];
            tz = burstPositions[i3+2];
        } else if (currentScrollProgress > 0) {
            // Morph to Sphere -> Sunburst based on scroll
            // 0 to 0.5 = Knot to Sphere
            // 0.5 to 1.0 = Sphere to Sunburst
            if (currentScrollProgress < 0.5) {
                const lerp = currentScrollProgress * 2.0;
                tx = tx + (spherePositions[i3] - tx) * lerp;
                ty = ty + (spherePositions[i3+1] - ty) * lerp;
                tz = tz + (spherePositions[i3+2] - tz) * lerp;
            } else {
                const lerp = Math.pow((currentScrollProgress - 0.5) * 2.0, 0.8);
                tx = spherePositions[i3] + (burstPositions[i3] - spherePositions[i3]) * lerp;
                ty = spherePositions[i3+1] + (burstPositions[i3+1] - spherePositions[i3+1]) * lerp;
                tz = spherePositions[i3+2] + (burstPositions[i3+2] - spherePositions[i3+2]) * lerp;
            }
        }
        
        // 2. Magnetic Repulsion (Cursor scattering)
        const dx = positions[i3] - mousePoint.x;
        const dy = positions[i3+1] - mousePoint.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Radius of repulsion
        const repulseRadius = 2.5;
        if (dist < repulseRadius) {
            const force = (repulseRadius - dist) / repulseRadius;
            tx += (dx / dist) * force * 4.0;
            ty += (dy / dist) * force * 4.0;
            tz += (force * 2.0); // push forward slightly
        }
        
        // 3. Spring Physics Application
        // Moves the current position towards the target position smoothly
        positions[i3] += (tx - positions[i3]) * 0.08;
        positions[i3+1] += (ty - positions[i3+1]) * 0.08;
        positions[i3+2] += (tz - positions[i3+2]) * 0.08;
    }
    
    mainParticles.geometry.attributes.position.needsUpdate = true;

    // Global Rotations
    particleGroup.rotation.y += currentSpeed;
    particleGroup.rotation.x += currentSpeed * 0.5;

    // Subtle breathing scale
    const scale = 1 + Math.sin(elapsedTime * 2) * 0.03;
    particleGroup.scale.set(scale, scale, scale);

    // Parallax
    camera.position.x += (rawMouseX * 3 - camera.position.x) * 0.05;
    camera.position.y += (-rawMouseY * 3 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

animate();
