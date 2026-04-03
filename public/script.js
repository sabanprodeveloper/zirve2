// Doğru token
const CORRECT_TOKEN = 'EGZ-26';

document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const mainContainer = document.getElementById('main-container');
    const loginForm = document.getElementById('login-form');
    const tokenInput = document.getElementById('token-input');
    const loginError = document.getElementById('login-error');

    // Login işlemi
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const enteredToken = tokenInput.value.trim();
        
        if (enteredToken === CORRECT_TOKEN) {
            // Başarılı giriş
            loginError.classList.add('hidden');
            loginContainer.classList.add('hidden');
            mainContainer.classList.remove('hidden');
            tokenInput.value = '';
            
            // Ana sayfayı başlat
            initializeApp();
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
        const namesList = document.getElementById('names-list');
        const selectBtn = document.getElementById('select-btn');
        const winnerSection = document.getElementById('winner-section');
        const winnerName = document.getElementById('winner-name');
        const resetBtn = document.getElementById('reset-btn');
        const errorMessage = document.getElementById('error-message');

        let names = [];

        // Katılımcıları yükle
        async function loadNames() {
            try {
                namesList.innerHTML = '<p class="loading">Yükleniyor...</p>';
                const response = await fetch('/names');
                
                if (!response.ok) {
                    throw new Error('Veriler yüklenemedi');
                }

                names = await response.json();
                displayNames();
                hideError();
            } catch (err) {
                showError('Katılımcılar yüklenemedi: ' + err.message);
                namesList.innerHTML = '<p class="loading">Hata oluştu!</p>';
            }
        }

        // Katılımcıları göster
        function displayNames() {
            namesList.innerHTML = '';
            
            if (names.length === 0) {
                namesList.innerHTML = '<p class="loading">Katılımcı bulunamadı</p>';
                return;
            }

            names.forEach(name => {
                const tag = document.createElement('div');
                tag.className = 'name-tag';
                tag.textContent = name;
                namesList.appendChild(tag);
            });
        }

        // Kazananı seç
        selectBtn.addEventListener('click', async () => {
            if (names.length === 0) {
                showError('Katılımcı bulunamadı!');
                return;
            }

            selectBtn.disabled = true;
            selectBtn.innerHTML = '<span class="btn-text">Seçiliyor...</span><span class="btn-emoji spinning">🎲</span>';

            try {
                const response = await fetch('/winner');
                
                if (!response.ok) {
                    throw new Error('Kazanan seçilemedi');
                }

                const data = await response.json();
                
                // Kazanan animasyonu
                await animateWinnerSelection(data.winner);
                showWinner(data.winner);
                hideError();
            } catch (err) {
                showError('Hata: ' + err.message);
            } finally {
                selectBtn.disabled = false;
                selectBtn.innerHTML = '<span class="btn-text">Kazananı Seç</span><span class="btn-emoji">🎲</span>';
            }
        });

        // Kazanan animasyonu
    async function animateWinnerSelection(winnerName) {
    const nameTags = document.querySelectorAll('.name-tag');
    const winnerIndex = names.indexOf(winnerName);

    if (winnerIndex === -1 || nameTags.length === 0) return;

    let currentIndex = 0;
    let prevIndex = null;

    let speed = 50;          // hızlı başla
    let maxSpeed = 300;      // en yavaş hız
    let slowing = false;

    let totalSteps = nameTags.length + Math.floor(Math.random() * nameTags.length);
    // en az 1 tur + biraz ekstra

    return new Promise(resolve => {

        function step() {
            // Önceki seçimi kaldır (OPTIMIZED)
            if (prevIndex !== null) {
                nameTags[prevIndex].classList.remove('selected');
            }

            // Yeni seçimi ekle
            nameTags[currentIndex].classList.add('selected');
            nameTags[currentIndex].scrollIntoView({ block: 'nearest' });

            prevIndex = currentIndex;

            // Sonraki index
            currentIndex = (currentIndex + 1) % nameTags.length;

            totalSteps--;

            // Yavaşlama başlat
            if (totalSteps < nameTags.length) {
                slowing = true;
            }

            if (slowing) {
                speed += 10; // yavaşlat
                if (speed > maxSpeed) speed = maxSpeed;
            }

            // DURMA KOŞULU (KRİTİK)
            if (totalSteps <= 0 && currentIndex === winnerIndex) {
                // Final highlight
                setTimeout(() => {
                    if (prevIndex !== null) {
                        nameTags[prevIndex].classList.remove('selected');
                    }

                    nameTags[winnerIndex].classList.add('selected', 'winner-final');
                    nameTags[winnerIndex].scrollIntoView({ block: 'center' });

                    resolve();
                }, speed);

                return;
            }

            setTimeout(step, speed);
        }

        step();
    });
}

        // Kazananı göster
        function showWinner(winner) {
            winnerName.textContent = winner;
            document.querySelector('.section').style.display = 'none';
            winnerSection.classList.remove('hidden');
            
            // Kazanan sesini çal (isteğe bağlı)
            
            
            // Confetti saçma efekti
            createConfetti();
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
            document.querySelector('.section').style.display = 'block';
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

        // Katılımcıları yüklemeyi başlat
        loadNames();
    }
});
