const API_BASE    = 'https://pokeapi.co/api/v2';
const BATCH_SIZE  = 10;
const MAX_RETRIES = 3;
const TIMEOUT_MS  = 8000;

const state = {
    allPokemons:      [],
    filteredPokemons: [],
    types:            [],
    generations:      [],
    isLoading:        false,
    activeFilters: {
        search: '',
        type:   '',
        region: '',
    }
};

const typeColors = {
    grass:    { bg: 'linear-gradient(160deg, #78C850 0%, #4E8234 100%)', badge: '#4E8234', label: 'Planta',    emoji: '🌿', key: 'planta'    },
    fire:     { bg: 'linear-gradient(160deg, #F08030 0%, #C03028 100%)', badge: '#C03028', label: 'Fuego',     emoji: '🔥', key: 'fuego'     },
    water:    { bg: 'linear-gradient(160deg, #6890F0 0%, #1A4C9A 100%)', badge: '#1A4C9A', label: 'Agua',      emoji: '💧', key: 'agua'      },
    electric: { bg: 'linear-gradient(160deg, #F8D030 0%, #C8A800 100%)', badge: '#C8A800', label: 'Eléctrico', emoji: '⚡', key: 'electrico' },
    psychic:  { bg: 'linear-gradient(160deg, #F85888 0%, #9B1030 100%)', badge: '#9B1030', label: 'Psíquico',  emoji: '🔮', key: 'psiquico'  },
    normal:   { bg: 'linear-gradient(160deg, #A8A878 0%, #6D6D4E 100%)', badge: '#6D6D4E', label: 'Normal',    emoji: '⭐', key: 'normal'    },
    fighting: { bg: 'linear-gradient(160deg, #C03028 0%, #7B1818 100%)', badge: '#7B1818', label: 'Lucha',     emoji: '🥊', key: 'lucha'     },
    poison:   { bg: 'linear-gradient(160deg, #A040A0 0%, #682A68 100%)', badge: '#682A68', label: 'Veneno',    emoji: '☠️', key: 'veneno'    },
    ground:   { bg: 'linear-gradient(160deg, #E0C068 0%, #927D44 100%)', badge: '#927D44', label: 'Tierra',    emoji: '🪨', key: 'tierra'    },
    flying:   { bg: 'linear-gradient(160deg, #A890F0 0%, #6064B0 100%)', badge: '#6064B0', label: 'Volador',   emoji: '🦅', key: 'volador'   },
    rock:     { bg: 'linear-gradient(160deg, #B8A038 0%, #786824 100%)', badge: '#786824', label: 'Roca',      emoji: '🗿', key: 'roca'      },
    ghost:    { bg: 'linear-gradient(160deg, #705898 0%, #493963 100%)', badge: '#493963', label: 'Fantasma',  emoji: '👻', key: 'fantasma'  },
    ice:      { bg: 'linear-gradient(160deg, #98D8D8 0%, #4090A0 100%)', badge: '#4090A0', label: 'Hielo',     emoji: '❄️', key: 'hielo'     },
    dragon:   { bg: 'linear-gradient(160deg, #7038F8 0%, #4924A1 100%)', badge: '#4924A1', label: 'Dragón',    emoji: '🐉', key: 'dragon'    },
    steel:    { bg: 'linear-gradient(160deg, #B8B8D0 0%, #787887 100%)', badge: '#787887', label: 'Acero',     emoji: '⚙️', key: 'acero'     },
    dark:     { bg: 'linear-gradient(160deg, #705848 0%, #49392F 100%)', badge: '#49392F', label: 'Siniestro', emoji: '🌑', key: 'siniestro' },
    bug:      { bg: 'linear-gradient(160deg, #A8B820 0%, #6D7815 100%)', badge: '#6D7815', label: 'Bicho',     emoji: '🐛', key: 'bicho'     },
    fairy:    { bg: 'linear-gradient(160deg, #EE99AC 0%, #9B6470 100%)', badge: '#9B6470', label: 'Hada',      emoji: '✨', key: 'hada'      },
};

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getRegionById(id) {
    if (id <= 151)  return 'kanto';
    if (id <= 251)  return 'johto';
    if (id <= 386)  return 'hoenn';
    if (id <= 493)  return 'sinnoh';
    if (id <= 649)  return 'unova';
    if (id <= 721)  return 'kalos';
    if (id <= 809)  return 'alola';
    if (id <= 905)  return 'galar';
    return 'paldea';
}

// fetch con timeout (AbortController) y reintentos con espera exponencial
async function fetchWithRetry(url, retries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();

        } catch (error) {
            if (attempt === retries) return null;
            await new Promise(r => setTimeout(r, 100 * attempt));
        }
    }
}

function showLoader() {
    const container = document.getElementById('cardsContainer');
    if (!container) return;
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-danger" style="width:3rem;height:3rem;" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3 fw-semibold" style="color: rgba(255,255,255,0.6);">Cargando Pokédex...</p>
        </div>
    `;
}

function showError(message) {
    const container = document.getElementById('cardsContainer');
    if (!container) return;
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="bi bi-exclamation-triangle fs-1 text-danger"></i>
            <p class="mt-2 text-white">${message}</p>
            <button class="btn btn-outline-danger btn-sm mt-2" onclick="location.reload()">
                <i class="bi bi-arrow-clockwise me-1"></i> Reintentar
            </button>
        </div>
    `;
}

function showEmptyState() {
    const container = document.getElementById('cardsContainer');
    if (!container) return;
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <p class="fs-1 mb-3">🔍</p>
            <p class="text-white fs-5 fw-semibold">Elige una generación o tipo para empezar</p>
            <p class="opacity-50 text-white small">Usa los filtros del sidebar para explorar la Pokédex</p>
        </div>
    `;
    const el = document.getElementById('resultCount');
    if (el) el.textContent = '0';
}

function updateResultCount() {
    const el = document.getElementById('resultCount');
    if (el) el.textContent = state.filteredPokemons.length;
}

async function loadAndPopulateTypes() {
    const data = await fetchWithRetry(`${API_BASE}/type?limit=30`);
    if (!data) return;

    // unknown y shadow son tipos internos que no aparecen en el juego normal
    state.types = data.results.filter(t => !['unknown', 'shadow'].includes(t.name));

    const select = document.getElementById('filterType');
    if (!select) return;

    select.innerHTML = '<option value="">Todos los tipos</option>';

    state.types.forEach(type => {
        const typeData = typeColors[type.name];
        if (!typeData) return;
        const option = document.createElement('option');
        option.value       = typeData.key;
        option.textContent = `${typeData.emoji} ${typeData.label}`;
        select.appendChild(option);
    });
}

async function loadAndPopulateGenerations() {
    const data = await fetchWithRetry(`${API_BASE}/generation`);
    if (!data) return;

    state.generations = data.results;

    const genLabels = {
        'generation-i':    { label: 'Gen I — Kanto',    value: 'generation-i'    },
        'generation-ii':   { label: 'Gen II — Johto',   value: 'generation-ii'   },
        'generation-iii':  { label: 'Gen III — Hoenn',  value: 'generation-iii'  },
        'generation-iv':   { label: 'Gen IV — Sinnoh',  value: 'generation-iv'   },
        'generation-v':    { label: 'Gen V — Unova',    value: 'generation-v'    },
        'generation-vi':   { label: 'Gen VI — Kalos',   value: 'generation-vi'   },
        'generation-vii':  { label: 'Gen VII — Alola',  value: 'generation-vii'  },
        'generation-viii': { label: 'Gen VIII — Galar', value: 'generation-viii' },
        'generation-ix':   { label: 'Gen IX — Paldea',  value: 'generation-ix'   },
    };

    const select = document.getElementById('filterRegion');
    if (!select) return;

    select.innerHTML = '<option value="">Todas las regiones</option>';

    state.generations.forEach(gen => {
        const info = genLabels[gen.name];
        if (!info) return;
        const option = document.createElement('option');
        option.value       = info.value;
        option.textContent = info.label;
        select.appendChild(option);
    });
}

async function getPokemonIdsByGeneration(generation) {
    const data = await fetchWithRetry(`${API_BASE}/generation/${generation}`);
    if (!data) return [];

    return data.pokemon_species
        .map(p => {
            const parts = p.url.split('/').filter(Boolean);
            return parseInt(parts[parts.length - 1]);
        })
        .filter(id => !isNaN(id))
        .sort((a, b) => a - b);
}

async function loadPokemonBatch(ids) {
    const results = await Promise.all(
        ids.map(id => fetchWithRetry(`${API_BASE}/pokemon/${id}`))
    );
    return results.filter(p => p !== null);
}

async function loadFromIds(ids) {
    if (ids.length === 0) throw new Error('lista vacía');

    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const pokemons = await loadPokemonBatch(ids.slice(i, i + BATCH_SIZE));

        state.allPokemons.push(...pokemons);
        state.filteredPokemons = [...state.allPokemons];

        pokemons.forEach(p => container.insertAdjacentHTML('beforeend', createPokemonCard(p)));
        updateResultCount();
    }
}

async function loadPokemonsByGeneration(generation) {
    if (state.isLoading) return;
    state.isLoading   = true;
    state.allPokemons = [];
    state.activeFilters.search = '';
    const searchEl = document.getElementById('searchInput');
    if (searchEl) searchEl.value = '';

    showLoader();
    try {
        await loadFromIds(await getPokemonIdsByGeneration(generation));
    } catch (e) {
        showError('No se pudieron cargar los Pokémon de esa generación.');
    } finally {
        state.isLoading = false;
    }
}

async function loadPokemonsByType(typeKey) {
    if (state.isLoading) return;
    state.isLoading   = true;
    state.allPokemons = [];
    state.activeFilters.search = '';
    const searchEl = document.getElementById('searchInput');
    if (searchEl) searchEl.value = '';

    showLoader();
    try {
        const typeEntry = Object.entries(typeColors).find(([, v]) => v.key === typeKey);
        if (!typeEntry) throw new Error('tipo no encontrado');

        const data = await fetchWithRetry(`${API_BASE}/type/${typeEntry[0]}`);
        if (!data) throw new Error('fallo al cargar tipo');

        // ids > 1010 son formas alternativas y variantes regionales, las saltamos
        const ids = data.pokemon
            .map(e => {
                const parts = e.pokemon.url.split('/').filter(Boolean);
                return parseInt(parts[parts.length - 1]);
            })
            .filter(id => !isNaN(id) && id <= 1010)
            .sort((a, b) => a - b);

        await loadFromIds(ids);
    } catch (e) {
        showError('No se pudieron cargar los Pokémon de ese tipo.');
    } finally {
        state.isLoading = false;
    }
}

function createPokemonCard(pokemon) {
    const stats        = pokemon.stats;
    const typeData     = typeColors[pokemon.types[0].type.name] || typeColors['normal'];
    const region       = getRegionById(pokemon.id);
    const secondary    = pokemon.types[1]?.type.name ?? null;
    const secData      = secondary ? (typeColors[secondary] ?? null) : null;

    const atkPct = (stats[1].base_stat / 255 * 100).toFixed(1);
    const defPct = (stats[2].base_stat / 255 * 100).toFixed(1);
    const hpPct  = (stats[0].base_stat / 255 * 100).toFixed(1);
    const spdPct = (stats[5].base_stat / 255 * 100).toFixed(1);

    return `
        <div class="col pokemon-card"
             data-name="${pokemon.name}"
             data-type="${typeData.key}"
             data-region="${region}"
             data-power="${stats[1].base_stat}"
             data-number="${pokemon.id}">
            <div class="pokemon-flashcard shadow-lg rounded-4 overflow-hidden position-relative">
                <div class="card-image-container position-relative" style="background: ${typeData.bg};">
                    <div class="ratio ratio-3x4 d-flex align-items-center justify-content-center">
                        <img src="${pokemon.sprites.other['official-artwork'].front_default}"
                             class="card-img-pokemon" alt="${pokemon.name}" loading="lazy">
                    </div>
                    <span class="badge badge-type position-absolute top-0 end-0 m-3 shadow-sm"
                          style="background: ${typeData.badge};">
                        ${typeData.emoji} ${typeData.label.toUpperCase()}
                    </span>
                    <div class="card-info-overlay p-3 d-flex flex-column justify-content-end">
                        <div class="card-basic-info">
                            <h4 class="fw-bold mb-1 text-white text-capitalize">${pokemon.name}</h4>
                            <p class="small text-white-50 mb-2">Nº ${String(pokemon.id).padStart(3, '0')} • ${capitalize(region)}</p>
                            <span class="badge rounded-pill text-white" style="background: ${typeData.badge};">
                                ${typeData.emoji} ${typeData.label}
                            </span>
                            ${secData ? `<span class="badge rounded-pill text-white ms-1" style="background:${secData.badge};">${secData.emoji} ${secData.label}</span>` : ''}
                        </div>
                        <div class="stats-summary mt-3">
                            <small class="d-block mb-1 text-white-50 fw-semibold">⚡ Ataque</small>
                            <div class="progress mb-2" style="height:5px;">
                                <div class="progress-bar rounded-pill" style="width:${atkPct}%;background:${typeData.badge};"></div>
                            </div>
                            <small class="d-block mb-1 text-white-50 fw-semibold">🛡️ Defensa</small>
                            <div class="progress mb-2" style="height:5px;">
                                <div class="progress-bar bg-info rounded-pill" style="width:${defPct}%"></div>
                            </div>
                            <small class="d-block mb-1 text-white-50 fw-semibold">❤️ HP</small>
                            <div class="progress mb-2" style="height:5px;">
                                <div class="progress-bar bg-danger rounded-pill" style="width:${hpPct}%"></div>
                            </div>
                            <small class="d-block mb-1 text-white-50 fw-semibold">💨 Velocidad</small>
                            <div class="progress mb-3" style="height:5px;">
                                <div class="progress-bar bg-warning rounded-pill" style="width:${spdPct}%"></div>
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

function renderFilteredPokemons() {
    const { search, type, region } = state.activeFilters;

    state.filteredPokemons = state.allPokemons.filter(pokemon => {
        const primaryKey    = typeColors[pokemon.types[0].type.name]?.key ?? '';
        const pokemonRegion = getRegionById(pokemon.id);
        return pokemon.name.toLowerCase().includes(search.toLowerCase())
            && (!type   || primaryKey    === type)
            && (!region || pokemonRegion === region);
    });

    const container = document.getElementById('cardsContainer');
    if (!container) return;

    if (state.filteredPokemons.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="fs-1">😔</p>
                <p class="text-white opacity-75">No se encontraron Pokémon con esos filtros.</p>
                <button class="btn btn-outline-light btn-sm mt-2" onclick="clearFilters()">Limpiar filtros</button>
            </div>
        `;
    } else {
        container.innerHTML = state.filteredPokemons.map(p => createPokemonCard(p)).join('');
    }

    updateResultCount();
}

async function handleRegionChange(value) {
    state.activeFilters.region = value;
    if (state.activeFilters.type) { renderFilteredPokemons(); return; }
    if (!value) { state.allPokemons = []; state.filteredPokemons = []; showEmptyState(); return; }
    await loadPokemonsByGeneration(value);
}

async function handleTypeChange(value) {
    state.activeFilters.type = value;
    if (!value) {
        if (state.activeFilters.region) { await loadPokemonsByGeneration(state.activeFilters.region); return; }
        state.allPokemons = []; state.filteredPokemons = []; showEmptyState(); return;
    }
    await loadPokemonsByType(value);
}

function filterCards() {
    if (state.allPokemons.length === 0) return;
    state.activeFilters.search = document.getElementById('searchInput')?.value ?? '';
    renderFilteredPokemons();
}

function clearFilters() {
    state.activeFilters    = { search: '', type: '', region: '' };
    state.allPokemons      = [];
    state.filteredPokemons = [];
    ['searchInput', 'filterType', 'filterRegion', 'sortSelect'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    showEmptyState();
}

function sortCards() {
    const sortBy = document.getElementById('sortSelect')?.value;
    if (!sortBy) return;
    state.filteredPokemons.sort((a, b) => {
        if (sortBy === 'power')  return b.stats[1].base_stat - a.stats[1].base_stat;
        if (sortBy === 'number') return a.id - b.id;
        if (sortBy === 'name')   return a.name.localeCompare(b.name);
        return 0;
    });
    const container = document.getElementById('cardsContainer');
    if (container) container.innerHTML = state.filteredPokemons.map(p => createPokemonCard(p)).join('');
}

function setupEventListeners() {
    document.getElementById('searchInput')  ?.addEventListener('input',  filterCards);
    document.getElementById('filterType')   ?.addEventListener('change', e => handleTypeChange(e.target.value));
    document.getElementById('filterRegion') ?.addEventListener('change', e => handleRegionChange(e.target.value));
    document.getElementById('sortSelect')   ?.addEventListener('change', sortCards);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([loadAndPopulateTypes(), loadAndPopulateGenerations()]);
        showEmptyState();
        setupEventListeners();
    } catch (e) {
        showError('Error al iniciar la Pokédex. Por favor, recarga la página.');
    }
});