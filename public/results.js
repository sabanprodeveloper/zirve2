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
            // Plantso için özel işlem
            if (key === 'plantso') {
                const free = winners.filter(w => typeof w === 'object' && w.prizeType === 'Bedava');
                const discount = winners.filter(w => typeof w === 'object' && w.prizeType === '%30 İndirim');
                
                // Bedava grubu
                if (free.length > 0) {
                    const freeTitle = document.createElement('h4');
                    freeTitle.textContent = '🎁 Bedava (5 kişi)';
                    freeTitle.style.color = '#105214';
                    freeTitle.style.marginTop = '15px';
                    freeTitle.style.marginBottom = '10px';
                    block.appendChild(freeTitle);
                    
                    const freeList = document.createElement('ul');
                    free.forEach(winner => {
                        const li = document.createElement('li');
                        const name = typeof winner === 'string' ? winner : winner.name;
                        const gender = typeof winner === 'string' ? '' : (winner.gender || '');
                        li.textContent = name + (gender ? ` (${gender})` : '');
                        freeList.appendChild(li);
                    });
                    block.appendChild(freeList);
                }
                
                // İndirim grubu
                if (discount.length > 0) {
                    const discountTitle = document.createElement('h4');
                    discountTitle.textContent = '🏷️ %30 İndirim (5 kişi)';
                    discountTitle.style.color = '#784800';
                    discountTitle.style.marginTop = '15px';
                    discountTitle.style.marginBottom = '10px';
                    block.appendChild(discountTitle);
                    
                    const discountList = document.createElement('ul');
                    discount.forEach(winner => {
                        const li = document.createElement('li');
                        const name = typeof winner === 'string' ? winner : winner.name;
                        const gender = typeof winner === 'string' ? '' : (winner.gender || '');
                        li.textContent = name + (gender ? ` (${gender})` : '');
                        discountList.appendChild(li);
                    });
                    block.appendChild(discountList);
                }
            } else {
                const list = document.createElement('ul');
                winners.forEach(name => {
                    const li = document.createElement('li');
                    li.textContent = typeof name === 'string' ? name : name.name;
                    list.appendChild(li);
                });
                block.appendChild(list);
            }
        }
        
        wrapper.appendChild(block);
    } else {
        const title = document.createElement('h3');
        title.textContent = `${draw.prize}`;
        title.style.marginBottom = '12px';
        title.style.fontSize = '1.15em';
        title.style.width = '100%';
        title.style.textAlign = 'center';
        title.style.fontWeight = '700';
        wrapper.appendChild(title);

        if (winners.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = 'Bu çekiliş henüz yapılmadı.';
            empty.style.color = '#f1f1f1';
            wrapper.appendChild(empty);
        } else {
            // Plantso için özel işlem
            if (key === 'plantso') {
                const free = winners.filter(w => typeof w === 'object' && w.prizeType === 'Bedava');
                const discount = winners.filter(w => typeof w === 'object' && w.prizeType === '%30 İndirim');
                
                // Bedava grubu
                if (free.length > 0) {
                    const freeTitle = document.createElement('h4');
                    freeTitle.textContent = '🎁 Bedava Workshop (5 kişi)';
                    freeTitle.style.color = '#4CAF50';
                    freeTitle.style.marginBottom = '10px';
                    freeTitle.style.fontSize = '1.05em';
                    freeTitle.style.fontWeight = '700';
                    freeTitle.style.width = '100%';
                    freeTitle.style.textAlign = 'center';
                    wrapper.appendChild(freeTitle);
                    
                    const freeList = document.createElement('ul');
                    freeList.style.display = 'grid';
                    freeList.style.gridTemplateColumns = 'repeat(auto-fit, minmax(100px, 1fr))';
                    freeList.style.gap = '6px';
                    freeList.style.listStyle = 'none';
                    freeList.style.padding = '0';
                    freeList.style.margin = '0 0 12px 0';
                    freeList.style.width = '100%';
                    
                    free.forEach((winner, index) => {
                        const li = document.createElement('li');
                        const name = typeof winner === 'string' ? winner : winner.name;
                        const gender = typeof winner === 'string' ? '' : (winner.gender || '');
                        
                        let content = name;
                        if (gender) {
                            content += ` <span style="font-size: 0.75em; opacity: 0.8;">(${gender})</span>`;
                        }
                        
                        li.innerHTML = content;
                        li.style.background = 'rgba(76, 175, 80, 0.2)';
                        li.style.borderRadius = '6px';
                        li.style.padding = '5px 7px';
                        li.style.textAlign = 'center';
                        li.style.color = '#000000';
                        li.style.fontSize = '0.9em';
                        li.style.animation = `fadeInUp 0.5s ease-out forwards`;
                        li.style.opacity = '0';
                        li.style.transform = 'translateY(20px)';
                        li.style.animationDelay = `${index * 0.08}s`;
                        freeList.appendChild(li);
                    });
                    wrapper.appendChild(freeList);
                }
                
                // İndirim grubu
                if (discount.length > 0) {
                    const discountTitle = document.createElement('h4');
                    discountTitle.textContent = '🏷️ %30 İndirim Workshop (5 kişi)';
                    discountTitle.style.color = '#FF9800';
                    discountTitle.style.marginBottom = '10px';
                    discountTitle.style.fontSize = '1.05em';
                    discountTitle.style.fontWeight = '700';
                    discountTitle.style.width = '100%';
                    discountTitle.style.textAlign = 'center';
                    wrapper.appendChild(discountTitle);
                    
                    const discountList = document.createElement('ul');
                    discountList.style.display = 'grid';
                    discountList.style.gridTemplateColumns = 'repeat(auto-fit, minmax(100px, 1fr))';
                    discountList.style.gap = '6px';
                    discountList.style.listStyle = 'none';
                    discountList.style.padding = '0';
                    discountList.style.margin = '0';
                    discountList.style.width = '100%';
                    
                    discount.forEach((winner, index) => {
                        const li = document.createElement('li');
                        const name = typeof winner === 'string' ? winner : winner.name;
                        const gender = typeof winner === 'string' ? '' : (winner.gender || '');
                        
                        let content = name;
                        if (gender) {
                            content += ` <span style="font-size: 0.75em; opacity: 0.8;">(${gender})</span>`;
                        }
                        
                        li.innerHTML = content;
                        li.style.background = 'rgba(255, 152, 0, 0.2)';
                        li.style.borderRadius = '6px';
                        li.style.padding = '5px 7px';
                        li.style.textAlign = 'center';
                        li.style.color = '#000000';
                        li.style.fontSize = '0.9em';
                        li.style.animation = `fadeInUp 0.5s ease-out forwards`;
                        li.style.opacity = '0';
                        li.style.transform = 'translateY(20px)';
                        li.style.animationDelay = `${(free.length + index) * 0.08}s`;
                        discountList.appendChild(li);
                    });
                    wrapper.appendChild(discountList);
                }
            } else {
                const list = document.createElement('ul');
                list.style.display = 'grid';
                list.style.gridTemplateColumns = 'repeat(auto-fit, minmax(100px, 1fr))';
                list.style.gap = '6px';
                list.style.listStyle = 'none';
                list.style.padding = '0';
                list.style.margin = '0';
                list.style.width = '100%';
                winners.forEach((winner, index) => {
                    const li = document.createElement('li');
                    
                    // Winner dapat obje veya string olabilir
                    const name = typeof winner === 'string' ? winner : winner.name;
                    const gender = typeof winner === 'string' ? '' : (winner.gender || '');
                    const prizeType = typeof winner === 'string' ? '' : (winner.prizeType || '');
                    
                    // Winner kartı oluştur
                    let content = name;
                    if (gender) {
                      content += ` <span style="font-size: 0.75em; opacity: 0.8;">(${gender})</span>`;
                    }
                    if (prizeType) {
                      content += ` <span style="font-size: 0.7em; background: rgba(102, 126, 234, 0.3); padding: 2px 4px; border-radius: 3px; margin-left: 3px;">${prizeType}</span>`;
                    }
                    
                    li.innerHTML = content;
                    li.style.background = 'rgba(255, 255, 255, 0.12)';
                    li.style.borderRadius = '6px';
                    li.style.padding = '5px 7px';
                    li.style.textAlign = 'center';
                    li.style.color = '#000000';
                    li.style.fontSize = '0.9em';
                    li.style.animation = `fadeInUp 0.5s ease-out forwards`;
                    li.style.opacity = '0';
                    li.style.transform = 'translateY(20px)';
                    li.style.animationDelay = `${index * 0.08}s`;
                    list.appendChild(li);
                });
                wrapper.appendChild(list);
            }
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
