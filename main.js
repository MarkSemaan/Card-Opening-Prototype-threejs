let scene, camera, renderer;
let pack;
let isDragging = false;
let isRotatingDeck = false;
let startX = 0, startY = 0;
let swipeSensitivity = 0.02;
let swipeThreshold = 60;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let cardStack = [];
const numCards = 5;
let velocity = 0;
let lastX = 0, lastY = 0;
let isPackOpen = false;

function init() {
    const container = document.getElementById('container');

    // Scene and Camera setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // Renderer setup
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Create pack and card stack
    createPackAndStack();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.getElementById('open-pack').addEventListener('click', openPack);

    animate();
}

function createPackAndStack() {
    // Remove existing cards (if any)
    cardStack.forEach((card) => scene.remove(card));
    cardStack = [];

    // Create pack with slight rotation
    const packGeometry = new THREE.BoxGeometry(2, 0.5, 1);
    const packMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    pack = new THREE.Mesh(packGeometry, packMaterial);
    pack.position.set(0, 0, -5);
    pack.rotation.x = -0.1; // Slight vertical rotation for depth
    pack.visible = true;
    scene.add(pack);

     // Create card stack
    for (let i = 0; i < numCards; i++) {
        const cardGeometry = new THREE.BoxGeometry(1.8, 2.5, 0.02);
        const cardMaterial = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const card = new THREE.Mesh(cardGeometry, cardMaterial);

        //Fixed offset based on index for consistent spacing
        const xOffset = (i - (numCards - 1) / 2) * 0.02;
        const yOffset = 0; // Keep Y at 0 for alignment
        const zOffset = -0.05 * i;

        card.position.set(xOffset, yOffset, zOffset);
        card.visible = false;
        cardStack.push(card);
        scene.add(card);
    }
}

function openPack() {
    if (pack.visible) {
        isPackOpen = true;
        gsap.to(pack.position, {
            z: 0,
            duration: 1,
            onComplete: () => {
                pack.visible = false;
                cardStack.forEach((card) => (card.visible = true));
                 isPackOpen = false;
            },
        });
    } else {
        resetScene();
    }
}


function resetScene() {
    pack.position.set(0, 0, -5);
    pack.rotation.set(-0.1, 0, 0);
    pack.visible = true;

    cardStack.forEach((card) => scene.remove(card));
    cardStack = [];

     for (let i = 0; i < numCards; i++) {
        const cardGeometry = new THREE.BoxGeometry(1.8, 2.5, 0.02);
        const cardMaterial = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const card = new THREE.Mesh(cardGeometry, cardMaterial);

          //Fixed offset based on index for consistent spacing
        const xOffset = (i - (numCards - 1) / 2) * 0.02;
        const yOffset = 0; // Keep Y at 0 for alignment
        const zOffset = -0.05 * i;


        card.position.set(xOffset, yOffset, zOffset);
        card.visible = false;
        cardStack.push(card);
        scene.add(card);
    }
}

function onPointerDown(event) {
    if (isPackOpen) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(cardStack[0]);
    if (intersects.length > 0 && !isPackOpen) {
        isDragging = true;
        startX = event.clientX;
        lastX = startX;
    } else if (!isPackOpen) {
        isRotatingDeck = true;
        startX = event.clientX;
        startY = event.clientY;
    }
}

function onPointerMove(event) {
    if (isDragging) {
        const deltaX = event.clientX - startX;
        velocity = event.clientX - lastX;
        lastX = event.clientX;

        cardStack[0].position.x = deltaX * swipeSensitivity;
    } else if (isRotatingDeck) {
        const deltaX = (event.clientX - startX) * 0.002;
        const deltaY = (event.clientY - startY) * 0.002;

        pack.rotation.y = deltaX;
        pack.rotation.x = -0.1 + deltaY;

        cardStack.forEach((card) => {
            card.rotation.y = deltaX;
            card.rotation.x = -0.1 + deltaY;
        });
    }
}

function onPointerUp(event) {
    if (isDragging) {
      const topCard = cardStack[0];
      const fling = Math.abs(velocity) > 10;
      const thresholdCrossed = Math.abs(topCard.position.x) > swipeThreshold;

      if (fling || thresholdCrossed) {
          const direction = velocity > 0 ? 1 : -1;

          gsap.to(topCard.position, {
            x: direction * 10,
            duration: 0.5,
            ease: 'power2.out',
            onStart: () => {
                cardStack.shift();
                cardStack.forEach((card, i) => {
                     //Fixed offset based on index for consistent spacing
                    const xOffset = (i - (numCards - 1) / 2) * 0.02;
                    const yOffset = 0; // Keep Y at 0 for alignment
                    card.position.x = xOffset;
                     card.position.y = yOffset
                    card.position.z = -0.05 * i;
                });
                if (cardStack.length === 0) {
                    setTimeout(resetScene, 500);
                }
            },
          });
      } else {
        gsap.to(topCard.position, { x: 0, duration: 0.3, ease: 'power1.out' });
      }
      isDragging = false;
    }

    if (isRotatingDeck) {
        gsap.to(pack.rotation, { x: -0.1, y: 0, duration: 0.5, ease: 'power2.out' });
        cardStack.forEach((card) => {
            gsap.to(card.rotation, { x: -0.1, y: 0, duration: 0.5, ease: 'power2.out' });
        });
        isRotatingDeck = false;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();