
const grassPokemonIds = [1, 2, 3, 43, 44, 45, 69, 70, 71, 102, 103, 114];

/**
 * Carga todos los Pokémon tipo Hierba desde la API
 */
async function loadGrassPokemons() {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-success" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
    
    try {
        container.innerHTML = ''; // Limpiar spinner
        
        for (let id of grassPokemonIds) {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            const data = await response.json();
            
            const card = createPokemonCard(data);
            container.innerHTML += card;
        }
        
        document.getElementById('resultCount').textContent = grassPokemonIds.length;
    } catch (error) {
        console.error('Error cargando Pokémon:', error);
        container.innerHTML = '<div class="col-12 text-center text-danger">Error cargando Pokémon. Por favor, recarga la página.</div>';
    }
}

/**
 * Crea el HTML de una card de Pokémon
 * @param {Object} pokemon - Datos del Pokémon de la API
 * @returns {string} HTML de la card
 */
function createPokemonCard(pokemon) {
    const stats = pokemon.stats;
    
    return `
        <div class="col pokemon-card" data-name="${pokemon.name}" data-type="planta" data-category="hero" data-region="kanto" data-power="${stats[1].base_stat}" data-number="${pokemon.id}">
            <div class="pokemon-flashcard shadow-lg rounded-4 overflow-hidden position-relative">
                <div class="card-image-container position-relative" style="background: linear-gradient(180deg, #78C850 0%, #4E8234 100%);">
                    <div class="ratio ratio-3x4 d-flex align-items-center justify-content-center">
                        <img src="${pokemon.sprites.other['official-artwork'].front_default}" 
                             class="card-img-pokemon" 
                             alt="${pokemon.name}">
                    </div>
                    <span class="badge badge-hero position-absolute top-0 end-0 m-3 shadow-sm">🌿 PLANTA</span>
                    <div class="card-info-overlay p-3 d-flex flex-column justify-content-end">
                        <div class="card-basic-info">
                            <h4 class="fw-bold mb-1 text-white text-capitalize">${pokemon.name}</h4>
                            <p class="small text-white-50 mb-2">Nº ${String(pokemon.id).padStart(3, '0')} • Kanto</p>
                            <span class="badge rounded-pill text-white" style="background: #78C850;">PLANTA</span>
                        </div>
                        <div class="stats-summary mt-3">
                            <small class="d-block mb-1 text-white-50 fw-semibold">⚡ Ataque</small>
                            <div class="progress mb-2" style="height: 5px;">
                                <div class="progress-bar bg-success rounded-pill" style="width: ${(stats[1].base_stat / 255 * 100)}%"></div>
                            </div>
                            <small class="d-block mb-1 text-white-50 fw-semibold">🛡️ Defensa</small>
                            <div class="progress mb-2" style="height: 5px;">
                                <div class="progress-bar bg-info rounded-pill" style="width: ${(stats[2].base_stat / 255 * 100)}%"></div>
                            </div>
                            <small class="d-block mb-1 text-white-50 fw-semibold">💨 Velocidad</small>
                            <div class="progress mb-3" style="height: 5px;">
                                <div class="progress-bar bg-warning rounded-pill" style="width: ${(stats[5].base_stat / 255 * 100)}%"></div>
                            </div>
                            <button class="btn btn-outline-light btn-sm w-100 rounded-pill">
                                <i class="bi bi-info-circle me-1"></i> Ver Detalles
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Sistema de filtrado de cards
 */
function filterCards() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    const typeFilter = document.getElementById('filterType').value;
    const regionFilter = document.getElementById('filterRegion').value;
    
    const cards = document.querySelectorAll('.pokemon-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
        const name = card.dataset.name;
        const type = card.dataset.type;
        const category = card.dataset.category;
        const region = card.dataset.region;
        
        const matchesSearch = name.includes(searchTerm);
        const matchesCategory = !categoryFilter || category === categoryFilter;
        const matchesType = !typeFilter || type === typeFilter;
        const matchesRegion = !regionFilter || region === regionFilter;
        
        if (matchesSearch && matchesCategory && matchesType && matchesRegion) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    document.getElementById('resultCount').textContent = visibleCount;
}

/**
 * Limpia todos los filtros
 */
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterType').value = 'planta';
    document.getElementById('filterRegion').value = '';
    document.getElementById('sortSelect').value = '';
    filterCards();
}

/**
 * Ordena las cards según el criterio seleccionado
 */
function sortCards() {
    const sortBy = document.getElementById('sortSelect').value;
    const container = document.getElementById('cardsContainer');
    const cards = Array.from(container.querySelectorAll('.pokemon-card'));
    
    if (!sortBy) return;
    
    cards.sort((a, b) => {
        if (sortBy === 'power') {
            return parseInt(b.dataset.power) - parseInt(a.dataset.power);
        } else if (sortBy === 'number') {
            return parseInt(a.dataset.number) - parseInt(b.dataset.number);
        } else if (sortBy === 'name') {
            return a.dataset.name.localeCompare(b.dataset.name);
        }
        return 0;
    });
    
    cards.forEach(card => container.appendChild(card));
}

/**
 * Inicialización al cargar la página
 */
document.addEventListener('DOMContentLoaded', () => {
    loadGrassPokemons();
    document.getElementById('searchInput').addEventListener('input', filterCards);
});