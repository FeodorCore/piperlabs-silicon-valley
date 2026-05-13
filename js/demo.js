(function() {
    const modal = document.getElementById('demoModal');
    const openModalBtn = document.querySelector('.hero__btn--secondary'); // кнопка "Посмотреть демо"
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const textarea = document.getElementById('demoText');
    const compressBtn = document.getElementById('compressBtn');
    const clearBtn = document.getElementById('clearDemoBtn');
    const charCounter = document.getElementById('charCounter');
    const demoResult = document.getElementById('demoResult');
    const weissmanSpan = document.getElementById('weissmanValue');
    const originalSizeSpan = document.getElementById('originalSize');
    const compressedSizeSpan = document.getElementById('compressedSize');
    const progressBar = document.getElementById('animationProgress');
    const progressFill = document.querySelector('.progress-fill');

    if (!modal || !openModalBtn) return;

    function openModal() {
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (demoResult) demoResult.hidden = true;
        if (textarea) textarea.value = '';
        updateCharCounter();
    }

    function closeModal() {
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function updateCharCounter() {
        if (charCounter && textarea) {
            charCounter.textContent = textarea.value.length;
        }
    }

    function simulateCompression() {
        const text = textarea.value.trim();
        if (text.length === 0) {
            alert('Введите текст для сжатия!');
            return;
        }

        if (progressBar) progressBar.style.display = 'block';
        if (progressFill) progressFill.style.width = '0%';
        if (demoResult) demoResult.hidden = true;

        let width = 0;
        const interval = setInterval(() => {
            width += 5;
            if (progressFill) progressFill.style.width = width + '%';
            if (width >= 100) {
                clearInterval(interval);
                // После анимации – показать результат
                performCompressionLogic(text);
                if (progressBar) progressBar.style.display = 'none';
                if (demoResult) demoResult.hidden = false;
            }
        }, 20);
    }

    function performCompressionLogic(originalText) {
        const originalSize = new Blob([originalText]).size; // размер в байтах (UTF-8)

        const uniqueChars = new Set(originalText).size;
        const entropyFactor = uniqueChars / originalText.length;
        let weissman = 1.2 + (1 - entropyFactor) * 4.0;
        const repeats = (originalText.match(/(.)\1{3,}/g) || []).length;
        weissman += Math.min(0.8, repeats * 0.05);
        weissman = Math.min(5.2, Math.max(1.2, weissman));

        const compressedSize = Math.round(originalSize / weissman);

        weissmanSpan.textContent = weissman.toFixed(2);
        originalSizeSpan.textContent = originalSize;
        compressedSizeSpan.textContent = compressedSize;

        if (originalText.toLowerCase().includes('gilfoyle')) {
            weissmanSpan.textContent = '5.2 (Gilfoyle approved)';
        }
        if (originalText.toLowerCase().includes('hooli')) {
            weissmanSpan.style.background = '#991b1b';
            setTimeout(() => { weissmanSpan.style.background = ''; }, 1000);
        }
    }

    function clearDemo() {
        if (textarea) textarea.value = '';
        updateCharCounter();
        if (demoResult) demoResult.hidden = true;
        if (progressBar) progressBar.style.display = 'none';
    }

    openModalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
    if (compressBtn) compressBtn.addEventListener('click', simulateCompression);
    if (clearBtn) clearBtn.addEventListener('click', clearDemo);
    if (textarea) textarea.addEventListener('input', updateCharCounter);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
            closeModal();
        }
    });

    updateCharCounter();
})();