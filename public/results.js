document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('results-wrapper');
    const pageTitle = document.querySelector('h1');
    const backBtn = document.getElementById('back-btn');
    const state = loadState();
    const drawOptions = {
        jamal: { label: 'Jamal Coffee', prize: '15 kişi tatlı + kahve', count: 15, logo: 'sponsorlar/jamal.jpg' },
        miracle: { label: 'Miracle', prize: '16 kişi parfüm', count: 16, logo: 'sponsorlar/bilinmeyen.jpg' },
        plantso: { label: 'Plantso', prize: '10 kişi workshop', count: 10, logo: 'sponsorlar/plantso.jfif' },
        gamezone: { label: 'Gamezone', prize: '5 kişi ücretsiz oyun', count: 5, logo: 'sponsorlar/gamezone.png' }
    };

    const selectedDraw = getQueryParam('draw');
    const validDraw = selectedDraw && drawOptions[selectedDraw];

    if (!state || !state.winnersByDraw) {
        wrapper.innerHTML = '<p class="loading">Henüz çekiliş yapılmadı.</p>';
        return;
    }

    if (validDraw) {
        pageTitle.textContent = `📋 ${drawOptions[selectedDraw].label} Sonucu`;
        renderDrawResult(selectedDraw, state, drawOptions, wrapper);
    } else {
        pageTitle.textContent = '📋 Tüm Çekiliş Sonuçları';
        renderAllResults(state, drawOptions, wrapper);
    }

    backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});

function renderDrawResult(key, state, drawOptions, wrapper) {
    const draw = drawOptions[key];
    const winners = state.winnersByDraw[key] || [];

    const block = document.createElement('div');
    block.className = 'result-block';

    const logoImg = document.createElement('img');
    logoImg.src = draw.logo;
    logoImg.alt = draw.label;
    logoImg.className = 'result-logo';
    block.appendChild(logoImg);

    const title = document.createElement('h3');
    title.textContent = `${draw.label} — ${draw.count} kişi | ${draw.prize}`;
    block.appendChild(title);

    if (winners.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'Bu çekiliş henüz yapılmadı.';
        empty.style.color = '#f1f1f1';
        block.appendChild(empty);
    } else {
        const list = document.createElement('ul');
        winners.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            list.appendChild(li);
        });
        block.appendChild(list);
    }

    wrapper.appendChild(block);
}

function renderAllResults(state, drawOptions, wrapper) {
    const hasAny = Object.values(state.winnersByDraw).some(winners => winners && winners.length > 0);
    if (!hasAny) {
        wrapper.innerHTML = '<p class="loading">Henüz çekiliş yapılmadı.</p>';
        return;
    }

    Object.keys(drawOptions).forEach(key => {
        renderDrawResult(key, state, drawOptions, wrapper);
    });
}

function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function loadState() {
    try {
        return JSON.parse(localStorage.getItem('egzDrawState') || '{}');
    } catch (err) {
        return {};
    }
}
