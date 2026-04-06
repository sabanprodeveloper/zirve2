document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('results-wrapper');
    const pageTitle = document.querySelector('h1');
    const backBtn = document.getElementById('back-btn');
    const state = loadState();
    const drawOptions = {
        jamal: { label: 'Jamal Coffee', prize: 'Tatlı + Kahve', count: 15, logo: 'sponsorlar/jamal.jpg' },
        miracle: { label: 'Miracle', prize: 'Parfüm', count: 16, logo: 'sponsorlar/bilinmeyen.jpg' },
        plantso: { label: 'Plantso', prize: 'Workshop', count: 10, logo: 'sponsorlar/plantso.jfif'},
        gamezone: { label: 'Gamezone', prize: 'Ücretsiz Oyun', count: 5, logo: 'sponsorlar/gamezone.png' }
    };

    const selectedDraw = getQueryParam('draw');
    const validDraw = selectedDraw && drawOptions[selectedDraw];

    if (!state || !state.winnersByDraw) {
        wrapper.innerHTML = '<p class="loading">Henüz çekiliş yapılmadı.</p>';
        return;
    }

    if (validDraw) {
        pageTitle.textContent = `📋 ${drawOptions[selectedDraw].label} Çekiliş Sonucu`;
        wrapper.classList.add('single-result');
        
        // Seçili çekilişin logosunu başlığın yanına ekle
        const logoImg = document.createElement('img');
        logoImg.src = drawOptions[selectedDraw].logo;
        logoImg.alt = drawOptions[selectedDraw].label;
        logoImg.style.height = '50px';
        logoImg.style.marginLeft = '20px';
        logoImg.style.verticalAlign = 'middle';
        logoImg.style.objectFit = 'contain';
        pageTitle.appendChild(logoImg);
        
        renderDrawResult(selectedDraw, state, drawOptions, wrapper, true);
    } else {
        pageTitle.textContent = '📋 Tüm Çekiliş Sonuçları';
        renderAllResults(state, drawOptions, wrapper);
    }

    backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});

function renderDrawResult(key, state, drawOptions, wrapper, isSingle = false) {
    const draw = drawOptions[key];
    const winners = state.winnersByDraw[key] || [];

    let container = wrapper;
    
    if (!isSingle) {
        const block = document.createElement('div');
        block.className = 'result-block';
        
        const logoImg = document.createElement('img');
        logoImg.src = draw.logo;
        logoImg.alt = draw.label;
        logoImg.className = 'result-logo';
        block.appendChild(logoImg);

        const title = document.createElement('h3');
        title.textContent = `${draw.prize}`;
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
    } else {
        const title = document.createElement('h3');
        title.textContent = `${draw.prize}`;
        title.style.marginBottom = '30px';
        title.style.fontSize = '1.3em';
        title.style.width = '100%';
        title.style.textAlign = 'center';
        wrapper.appendChild(title);

        if (winners.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = 'Bu çekiliş henüz yapılmadı.';
            empty.style.color = '#f1f1f1';
            wrapper.appendChild(empty);
        } else {
            const list = document.createElement('ul');
            list.style.display = 'flex';
            list.style.flexWrap = 'wrap';
            list.style.gap = '12px';
            list.style.listStyle = 'none';
            list.style.padding = '0';
            list.style.margin = '0';
            list.style.alignItems = 'center';
            list.style.justifyContent = 'center';
            list.style.width = '100%';
            list.style.marginTop = '0';
            list.style.marginBottom = '0';
            winners.forEach((name, index) => {
                const li = document.createElement('li');
                li.textContent = name;
                li.style.background = 'rgba(255, 255, 255, 0.12)';
                li.style.borderRadius = '12px';
                li.style.padding = '10px 14px';
                li.style.textAlign = 'center';
                li.style.color = '#000000';
                li.style.fontSize = '1.05em';
                li.style.animation = `fadeInUp 0.5s ease-out forwards`;
                li.style.opacity = '0';
                li.style.transform = 'translateY(20px)';
                li.style.animationDelay = `${index * 0.1}s`;
                li.style.whiteSpace = 'nowrap';
                list.appendChild(li);
            });
            wrapper.appendChild(list);
        }
    }
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
