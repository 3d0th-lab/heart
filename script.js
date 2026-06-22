// --- SEKCJA LOGIKI KONSOLI ---
const textToType = "Initializing heart.PROTOCOL_v2.0...";
const typewriterElement = document.getElementById('typewriter');
let charIndex = 0;

function typeWriter() {
    if (charIndex < textToType.length) {
        typewriterElement.textContent += textToType.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 40);
    } else {
        // Po zakończeniu pisania, pokaż status READY i przycisk
        document.querySelector('.status-line').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('secret-package').style.display = 'block';
            enableRevealTriggers();
        }, 600);
    }
}

// Rozpocznij pisanie po załadowaniu strony
window.addEventListener('load', typeWriter);

function enableRevealTriggers() {
    const triggerReveal = () => {
        document.getElementById('console-stage').classList.add('hidden');
        document.getElementById('reveal-stage').classList.remove('hidden');
        initThreeJS(); // Uruchomienie serca 3D
    };

    // Kliknięcie w przycisk lub gdziekolwiek na ekranie
    document.getElementById('decrypt-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        triggerReveal();
    });
    document.getElementById('console-stage').addEventListener('click', triggerReveal);
}


// --- SEKCJA GRAFIKI 3D (THREE.JS) ---
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    
    // Tworzenie sceny i kamery
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Oświetlenie
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xff4d6d, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Tworzenie chmury napisów "i love you" przy użyciu CanvasTexture
    const particlesGroup = new THREE.Group();
    const particleCount = 280; // Liczba napisów w sercu

    // Funkcja tworząca teksturę z napisem "i love you"
    function createTextTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Styl napisu (neonowy, czerwono-różowy)
        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = '#ff4d6d';
        ctx.shadowColor = '#ff003c';
        ctx.shadowBlur = 8;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('i love you', canvas.width / 2, canvas.height / 2);
        
        return new THREE.CanvasTexture(canvas);
    }

    const texture = createTextTexture();
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });

    // Generowanie matematycznego kształtu serca 3D
    for (let i = 0; i < particleCount; i++) {
        const sprite = new THREE.Sprite(material.clone());
        
        const t = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        // Równanie parametryczne trójwymiarowego serca
        const x = 16 * Math.pow(Math.sin(t), 3) * Math.sin(phi);
        const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const z = 16 * Math.pow(Math.sin(t), 3) * Math.cos(phi);
        
        const scale = 0.07; // Skalowanie wielkości serca
        sprite.position.set(x * scale, y * scale, z * scale);
        
        // Skalowanie pojedynczego napisu
        sprite.scale.set(0.4, 0.1, 1);
        
        // Losowe przesunięcie fali dla efektu lewitacji
        sprite.userData = { 
            baseY: y * scale, 
            waveSpeed: Math.random() * 2 + 1, 
            waveOffset: Math.random() * Math.PI 
        };

        particlesGroup.add(sprite);
    }
    scene.add(particlesGroup);

    // Dodanie tła z gwiazdami
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 1500;
    const starPositions = new Float32Array(starsCount * 3);

    for(let i=0; i<starsCount * 3; i++) {
        starPositions[i] = (Math.random() - 0.5) * 50;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.5 });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    // Obsługa obracania myszką/palcem
    let targetRotationY = 0;
    let targetRotationX = 0;
    let mouseX = 0;
    let mouseY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) - 0.5;
        mouseY = (e.clientY / window.innerHeight) - 0.5;
    });

    window.addEventListener('touchmove', (e) => {
        if(e.touches.length > 0) {
            mouseX = (e.touches[0].clientX / window.innerWidth) - 0.5;
            mouseY = (e.touches[0].clientY / window.innerHeight) - 0.5;
        }
    });

    // Pętla animacji
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Delikatne falowanie każdego napisu niezależnie
        particlesGroup.children.forEach(sprite => {
            sprite.position.y = sprite.userData.baseY + Math.sin(elapsedTime * sprite.userData.waveSpeed + sprite.userData.waveOffset) * 0.02;
        });

        // Stały powolny obrót bazy + wpływ ruchów myszki użytkownika
        targetRotationY = elapsedTime * 0.25 + (mouseX * 1.5);
        targetRotationX = mouseY * 0.8;

        particlesGroup.rotation.y += (targetRotationY - particlesGroup.rotation.y) * 0.05;
        particlesGroup.rotation.x += (targetRotationX - particlesGroup.rotation.x) * 0.05;

        // Delikatny ruch gwiazd w tle
        starField.rotation.y = elapsedTime * 0.02;

        renderer.render(scene, camera);
    }
    animate();

    // Responsywność - dopasowanie do zmiany rozmiaru ekranu
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
