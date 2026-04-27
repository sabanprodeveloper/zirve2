// Doğru token
const CORRECT_TOKEN = 'EGZ-26';

// Verileri logda göstermemek için loglama işlemini kaldırın
const optimizeData = (data) => {
    return data.map(entry => {
        return {
            tarih: entry[0],
            adSoyad: entry[1],
            email: entry[3],
            bolum: entry[4],
            sinif: entry[5],
            cinsiyet: entry[6]
        };
    });
};

// Verileri sınırlandırın (örneğin, ilk 100 kişi)
const limitData = (data, limit = 100) => {
    return data.slice(0, limit);
};

const rawData = [
    // ...mevcut veriler...
];

const filteredData = optimizeData(rawData);
const limitedData = limitData(filteredData);

document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const mainContainer = document.getElementById('main-container');
    const loginForm = document.getElementById('login-form');
    const tokenInput = document.getElementById('token-input');
    const loginError = document.getElementById('login-error');

    const storedLogin = localStorage.getItem('egzLoggedIn') === 'true';

    function showMainPage() {
        loginError.classList.add('hidden');
        loginContainer.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        document.querySelector('.sponsors-card')?.classList.remove('hidden');
        initializeApp();
    }

    // Daha önce başarılı giriş yapıldıysa doğrudan ana sayfayı aç.
    if (storedLogin) {
        showMainPage();
        return;
    }



    // Login işlemi
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const enteredToken = tokenInput.value.trim();
        
        if (enteredToken === CORRECT_TOKEN) {
            // Başarılı giriş
            localStorage.setItem('egzLoggedIn', 'true');
             window.location.href = 'qrcode.html';
            tokenInput.value = '';
        } else {
            // Başarısız giriş
            loginError.textContent = 'Geçersiz token! Tekrar deneyin.';
            loginError.classList.remove('hidden');
            tokenInput.value = '';
            tokenInput.focus();
        }
    });

    // Ana uygulama
    function initializeApp() {
        const selectBtn = document.getElementById('select-btn');
        const winnerSection = document.getElementById('winner-section');
        const winnerList = document.getElementById('winner-list');
        const resetBtn = document.getElementById('reset-btn');
        const errorMessage = document.getElementById('error-message');
        const drawInfo = document.getElementById('draw-info');
        const drawButtons = document.querySelectorAll('.draw-btn');

        const STORAGE_KEY = 'egzDrawState';
        let names = [];
        let selectedDrawKey = 'jamal';
        let state = loadState();

        const drawOptions = {
            jamal: { label: 'Jamal Coffee', prize: '15 kişi tatlı + kahve', count: 15 },
            miracle: { label: 'Miracle', prize: '16 kişi parfüm', count: 16 },
            plantso: { label: 'Plantso', prize: '10 kişi workshop', count: 10 },
            gamezone: { label: 'Gamezone', prize: '5 kişi ücretsiz oyun', count: 5 }
        };

        function loadState() {
            try {
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
                return {
                    winnersByDraw: saved.winnersByDraw || {
                        jamal: [],
                        miracle: [],
                        plantso: [],
                        gamezone: []
                    },
                    allWinners: saved.allWinners || [],
                    savedNames: saved.savedNames || []
                };
            } catch (err) {
                return {
                    winnersByDraw: { jamal: [], miracle: [], plantso: [], gamezone: [] },
                    allWinners: [],
                    savedNames: []
                };
            }
        }

        function saveState() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }

        function getRemainingNames() {
            return names.filter(name => !state.allWinners.includes(name));
        }

        function isDrawCompleted(key) {
            return state.winnersByDraw[key] && state.winnersByDraw[key].length > 0;
        }

        function updateDrawSelection(key) {
            selectedDrawKey = key;
            drawButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.draw === key);
            });

            const draw = drawOptions[key];
            drawInfo.textContent = `Seçilen çekiliş: ${draw.label} — ${draw.count} kişi (${draw.prize})`;
            if (isDrawCompleted(key)) {
                selectBtn.disabled = true;
                selectBtn.querySelector('.btn-text').textContent = `${draw.label} çekilişi tamamlandı`;
            } else {
                selectBtn.disabled = false;
                selectBtn.querySelector('.btn-text').textContent = `${draw.label} için Kazananları Seç`;
            }
        }

        drawButtons.forEach(button => {
            button.addEventListener('click', () => updateDrawSelection(button.dataset.draw));
        });

        updateDrawSelection(selectedDrawKey);

        // Katılımcıları yükle
        async function loadNames() {
            try {
                const response = await fetch('/names');
                if (!response.ok) {
                    throw new Error('Veriler yüklenemedi');
                }

                names = await response.json();
                state.savedNames = names;
                saveState();
                hideError();
            } catch (err) {
                if (state.savedNames.length) {
                    names = state.savedNames;
                    hideError();
                } else {
                    showError('Katılımcılar yüklenemedi: ' + err.message);
                }
            }
        }

        function chooseWinners() {
            const draw = drawOptions[selectedDrawKey];
            const remaining = getRemainingNames();
            if (remaining.length < draw.count) {
                showError(`Yeterli katılımcı yok. Kalan ${remaining.length} katılımcı var.`);
                return [];
            }

            if (isDrawCompleted(selectedDrawKey)) {
                showError(`${draw.label} çekilişi zaten tamamlandı.`);
                return [];
            }

            const copy = [...remaining];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy.slice(0, draw.count);
        }

        function saveDrawResults(draw, winners) {
            state.winnersByDraw[selectedDrawKey] = winners;
            // allWinners'a sadece isimleri ekle (state tutarlılığı için)
            const winnerNames = winners.map(w => typeof w === 'string' ? w : w.name);
            state.allWinners = [...state.allWinners, ...winnerNames];
            saveState();
            
            // Firebase'e de kaydet
            const drawOption = drawOptions[selectedDrawKey];
            if (drawOption) {
                fetch('/save-cekilis-result', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cekilisKodu: selectedDrawKey,
                        cekilisAdi: drawOption.label,
                        odul: drawOption.prize,
                        kazananlar: winners.map(w => {
                            if (typeof w === 'string') {
                                return { name: w, gender: '', prizeType: null };
                            }
                            return w;
                        })
                    })
                })
                .then(res => res.json())
                .then(data => console.log('✓ Çekiliş sonucu Firebase\'ye kaydedildi:', data))
                .catch(err => console.error('⚠️ Firebase kaydetme hatası:', err));
            }
        }

        // Kazananı seç
        selectBtn.addEventListener('click', async () => {
            if (names.length === 0) {
                showError('Katılımcı listesi henüz hazır değil. Lütfen sayfayı yenileyin.');
                return;
            }

            const draw = drawOptions[selectedDrawKey];
            
            if (isDrawCompleted(selectedDrawKey)) {
                showError(`${draw.label} çekilişi zaten tamamlandı.`);
                return;
            }

            selectBtn.disabled = true;
            selectBtn.innerHTML = '<span class="btn-text">Seçiliyor...</span><span class="btn-emoji spinning">🎲</span>';

            try {
                // Backend'den kazananları çek (Plantso ve Miracle için cinsiyet/ödül türü bilgisi dahil)
                const response = await fetch('/winners-select', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        draw: selectedDrawKey,
                        count: draw.count,
                        alreadySelected: state.allWinners // Daha önce seçilmiş olanlar
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Kazanan seçim hatası');
                }

                const data = await response.json();
                const winners = data.winners.map(w => ({
                    name: w.name,
                    gender: w.gender,
                    prizeType: w.prizeType
                }));

                await animateWinnerSelection();
                saveDrawResults(draw, winners);
                hideError();
                updateDrawSelection(selectedDrawKey);
                window.location.href = `results.html?draw=${encodeURIComponent(selectedDrawKey)}`;
                return;
            } catch (err) {
                showError('Hata: ' + err.message);
                console.error('Kazanan seçim hatası:', err);
            } finally {
                selectBtn.disabled = isDrawCompleted(selectedDrawKey);
                selectBtn.innerHTML = `<span class="btn-text">${draw.label} için Kazananları Seç</span><span class="btn-emoji">🎲</span>`;
            }
        });

        // Kazanan animasyonu (basitleştirilmiş)
        async function animateWinnerSelection() {
            return new Promise(resolve => {
                createConfetti();
                setTimeout(resolve, 1500);
            });
        }

        // Confetti efekti
        function createConfetti() {
            for (let i = 0; i < 15; i++) {
                const confetti = document.createElement('div');
                confetti.style.position = 'fixed';
                confetti.style.width = '10px';
                confetti.style.height = '10px';
                confetti.style.backgroundColor = ['#667eea', '#764ba2', '#f093fb', '#f5576c'][Math.floor(Math.random() * 4)];
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '-10px';
                confetti.style.borderRadius = '50%';
                confetti.style.pointerEvents = 'none';
                confetti.style.zIndex = '9999';
                confetti.style.animation = `confetti ${2000 + Math.random() * 1000}ms ease-in forwards`;
                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 3000);
            }
        }

        // Tekrar seç
        resetBtn.addEventListener('click', () => {
            winnerSection.classList.add('hidden');
            winnerList.innerHTML = '';
        });

        // Hata mesajı göster
        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.classList.remove('hidden');
        }

        // Hata mesajı gizle
        function hideError() {
            errorMessage.classList.add('hidden');
        }

        loadNames();
    }
});
