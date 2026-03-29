document.addEventListener('DOMContentLoaded', () => {
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
        selectBtn.innerHTML = '<span class="btn-text">Seçiliyor...</span><span class="btn-emoji">⏳</span>';

        try {
            const response = await fetch('/winner');
            
            if (!response.ok) {
                throw new Error('Kazanan seçilemedi');
            }

            const data = await response.json();
            showWinner(data.winner);
            hideError();
        } catch (err) {
            showError('Hata: ' + err.message);
        } finally {
            selectBtn.disabled = false;
            selectBtn.innerHTML = '<span class="btn-text">Kazananı Seç</span><span class="btn-emoji">🎲</span>';
        }
    });

    // Kazananı göster
    function showWinner(winner) {
        winnerName.textContent = winner;
        document.querySelector('.section').style.display = 'none';
        winnerSection.classList.remove('hidden');
        
        // Animasyon efekti
        winnerName.style.animation = 'none';
        setTimeout(() => {
            winnerName.style.animation = 'slideIn 0.5s ease-out';
        }, 10);
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

    // Sayfa yüklendiğinde katılımcıları yükle
    loadNames();

    // Her 30 saniyede bir katılımcıları yenile (yeni katılımcılar gelip gelmediğini kontrol et)
    setInterval(loadNames, 30000);
});
