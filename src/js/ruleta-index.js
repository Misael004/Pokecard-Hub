const appContainer = document.getElementById("main-app");
const carousel = document.getElementById("carousel");
const btnExplorar = document.getElementById("btn-explorar");

const totalCards = 8;
const radius = 350;
let currentAngle = 0;
let isDragging = false;
let startX = 0;
let lastAngle = 0;
let autoRotate = true;

// 1. Cargar Pokémon desde la API
async function fetchPokemon(ids) {
    carousel.innerHTML = "";
    for (let i = 0; i < ids.length; i++) {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${ids[i]}`);
            const data = await response.json();

            const cardAngle = (360 / totalCards) * i;
            const card = document.createElement("div");
            card.className = "card-pokemon";
            card.style.transform = `rotateY(${cardAngle}deg) translateZ(${radius}px)`;

            card.innerHTML = `
                <img src="${data.sprites.other['official-artwork'].front_default}" alt="${data.name}" draggable="false">
                <div class="pokemon-name">${data.name}</div>
            `;
            carousel.appendChild(card);
        } catch (e) { console.error("Error API", e); }
    }
}

// 2. Animación continua
function step() {
    if (autoRotate && !isDragging) {
        currentAngle -= 0.2;
        carousel.style.transform = `rotateY(${currentAngle}deg)`;
    }
    requestAnimationFrame(step);
}

// 3. Eventos de Interacción (Usando document y appContainer)
appContainer.addEventListener("mousedown", (e) => {
    isDragging = true;
    autoRotate = false;
    startX = e.clientX;
    lastAngle = currentAngle;
    appContainer.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    currentAngle = lastAngle + deltaX * 0.2;
    carousel.style.transform = `rotateY(${currentAngle}deg)`;
});

document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    appContainer.style.cursor = "default";
    setTimeout(() => { if (!isDragging) autoRotate = true; }, 1500);
});

// 4. Lógica del botón Explorar
btnExplorar.addEventListener("click", () => {
    const randomIds = Array.from({ length: totalCards }, () => Math.floor(Math.random() * 800) + 1);

    // Efecto de transición: giro rápido
    autoRotate = false;
    currentAngle -= 360;
    carousel.style.transition = "transform 1s ease-in-out";
    carousel.style.transform = `rotateY(${currentAngle}deg)`;

    setTimeout(() => {
        carousel.style.transition = "transform 0.1s ease-out";
        fetchPokemon(randomIds);
        autoRotate = true;
    }, 1000);
});

// Inicio
fetchPokemon([25, 6, 150, 94, 131, 384, 448, 249]);
step();