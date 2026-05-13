(function() {
    // === DOM Elements ===
    const textarea = document.getElementById('labText');
    const charCount = document.getElementById('charCount');
    const entropyPreview = document.getElementById('entropyPreview');
    const compressBtn = document.getElementById('compressBtn');
    const clearBtn = document.getElementById('clearBtn');
    const spectrum = document.getElementById('entropySpectrum');
    const p2pNetwork = document.getElementById('p2pNetwork');
    const labOutput = document.getElementById('labOutput');
    const weissmanVal = document.getElementById('weissmanVal');
    const origSize = document.getElementById('origSize');
    const compSize = document.getElementById('compSize');
    const savings = document.getElementById('savings');
    const systemMsg = document.getElementById('systemMsg');
    const hooliWarning = document.getElementById('hooliWarning');
    const netStatus = document.getElementById('netStatus');
    const canvas = document.getElementById('particleGrid');
    const ctx = canvas.getContext('2d');

    // === State ===
    let isCompressing = false;
    let nodes = [];
    let packets = [];
    let particles = [];
    let animFrame;

    // === Initialization ===
    function init() {
        resizeCanvas();
        createParticles();
        createP2PNodes();
        animate();
        setupEvents();
        updateSpectrum([]);
    }

    function resizeCanvas() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    }

    // === Particle Grid (Neural Network Vibe) ===
    function createParticles() {
        particles = [];
        const count = Math.floor((canvas.width * canvas.height) / 8000);
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.5 + 0.2
            });
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#2f9f46';
        ctx.strokeStyle = 'rgba(47, 159, 70, 0.15)';
        ctx.lineWidth = 0.5;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x, dy = p.y - p2.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 100) {
                    ctx.globalAlpha = (1 - dist / 100) * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    // === P2P Network ===
    function createP2PNodes() {
        p2pNetwork.innerHTML = '';
        nodes = [];
        const positions = [
            {x: '20%', y: '20%'}, {x: '80%', y: '20%'},
            {x: '10%', y: '60%'}, {x: '90%', y: '60%'},
            {x: '35%', y: '85%'}, {x: '65%', y: '85%'}
        ];
        positions.forEach((pos, i) => {
            const node = document.createElement('div');
            node.className = 'p2p-node';
            node.style.left = pos.x; node.style.top = pos.y;
            node.style.animationDelay = `${i * 0.3}s`;
            p2pNetwork.appendChild(node);
            nodes.push(node);
        });
    }

    function spawnPacket() {
        if (nodes.length < 2) return;
        const from = nodes[Math.floor(Math.random() * nodes.length)];
        let to = nodes[Math.floor(Math.random() * nodes.length)];
        while (to === from) to = nodes[Math.floor(Math.random() * nodes.length)];

        const packet = document.createElement('div');
        packet.className = 'p2p-packet';
        const fRect = from.getBoundingClientRect();
        const tRect = to.getBoundingClientRect();
        const pRect = p2pNetwork.getBoundingClientRect();

        const startX = fRect.left - pRect.left + 7;
        const startY = fRect.top - pRect.top + 7;
        const endX = tRect.left - pRect.left + 7;
        const endY = tRect.top - pRect.top + 7;

        packet.style.left = startX + 'px';
        packet.style.top = startY + 'px';
        p2pNetwork.appendChild(packet);

        const duration = 600 + Math.random() * 400;
        const start = performance.now();

        function move(now) {
            const progress = Math.min((now - start) / duration, 1);
            const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            packet.style.left = (startX + (endX - startX) * ease) + 'px';
            packet.style.top = (startY + (endY - startY) * ease) + 'px';
            if (progress < 1) {
                requestAnimationFrame(move);
            } else {
                packet.remove();
            }
        }
        requestAnimationFrame(move);
    }

    // === Entropy & Spectrum ===
    function calcEntropy(text) {
        if (!text) return 0;
        const freq = {};
        for (const char of text) freq[char] = (freq[char] || 0) + 1;
        const len = text.length;
        let entropy = 0;
        for (const count of Object.values(freq)) {
            const p = count / len;
            entropy -= p * Math.log2(p);
        }
        return entropy;
    }

    function updateSpectrum(text) {
        spectrum.innerHTML = '';
        if (!text) return;
        const freq = {};
        for (const char of text) freq[char] = (freq[char] || 0) + 1;
        const maxFreq = Math.max(...Object.values(freq));
        const bars = 32;
        const keys = Object.keys(freq).slice(0, bars);

        for (let i = 0; i < bars; i++) {
            const bar = document.createElement('div');
            bar.className = 'spec-bar';
            const val = keys[i] ? freq[keys[i]] / maxFreq : 0;
            bar.style.height = `${Math.max(5, val * 100)}%`;
            bar.style.opacity = 0.4 + val * 0.6;
            spectrum.appendChild(bar);
        }
    }

    // === Compression Logic ===
    function simulateCompression() {
        if (isCompressing) return;
        const text = textarea.value.trim();
        if (!text) {
            systemMsg.textContent = '⛔ Ошибка: Буфер пуст. Введите данные.';
            systemMsg.style.borderLeftColor = 'var(--lab-danger)';
            labOutput.hidden = false;
            return;
        }

        isCompressing = true;
        compressBtn.disabled = true;
        compressBtn.textContent = '⏳ Обработка...';
        labOutput.hidden = true;
        hooliWarning.hidden = true;
        systemMsg.style.borderLeftColor = 'var(--lab-cyan)';

        // Visual: Collapse spectrum
        document.querySelectorAll('.spec-bar').forEach(b => b.classList.add('collapsing'));

        // Visual: Burst P2P packets
        let packetInterval = setInterval(spawnPacket, 80);
        netStatus.textContent = '🟡 P2P Network: Syncing...';
        netStatus.style.color = '#eab308';

        setTimeout(() => {
            clearInterval(packetInterval);
            document.querySelectorAll('.spec-bar').forEach(b => b.classList.remove('collapsing'));
            netStatus.textContent = '🟢 P2P Network: Online';
            netStatus.style.color = '';
            showResults(text);
            isCompressing = false;
            compressBtn.disabled = false;
            compressBtn.textContent = '▶ Сжать Middle-Out';
        }, 1200);
    }

    function showResults(text) {
        const originalBytes = new Blob([text]).size;
        const entropy = calcEntropy(text);
        const maxEntropy = Math.log2(new Set(text).size || 2);
        const normEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

        // Pattern detection
        const patterns = (text.match(/(.)\1{3,}/g) || []).length;
        const patternBonus = Math.min(1.2, patterns * 0.15);

        // Base Weissman calculation
        let weissman = 1.4 + (1 - normEntropy) * 2.8 + patternBonus;
        weissman = Math.min(5.2, Math.max(1.2, weissman));

        // Hooli Spy Detection
        const hooliRegex = /gavin|hooli|belson|nucleus|xyz/i;
        const isHooli = hooliRegex.test(text);
        if (isHooli) {
            weissman *= 0.55;
            hooliWarning.hidden = false;
            document.querySelector('.terminal-header').style.borderBottomColor = 'var(--lab-danger)';
            setTimeout(() => {
                document.querySelector('.terminal-header').style.borderBottomColor = '';
            }, 2000);
        }

        // Easter Eggs
        const lower = text.toLowerCase();
        let msg = 'Middle-out компрессия завершена. Данные распределены по нодам.';
        if (lower.includes('richard')) msg = '👨‍💻 Ричард: "Не паникуй. Энтропия под контролем. Я проверил формулу трижды."';
        else if (lower.includes('gilfoyle')) msg = '🔒 Гилфойл: "Root-доступ подтверждён. GUI всё ещё зло. Серверы довольны."';
        else if (lower.includes('dinesh')) msg = '📊 Динеш: "Табличные данные обнаружены. Режим хот-дога: ВЫКЛ. Надёжность 99.999%."';
        else if (lower.includes('erlich')) msg = '🚀 Эрлих: "Aviato протокол активирован. 10% акций зарезервировано. Инкубатор гордится!"';
        else if (lower.includes('big head') || lower.includes('биг хед')) msg = '😐 Биг Хед: "Я ничего не делал, но меня повысили. Сжатие прошло успешно."';
        else if (lower.includes('jared') || lower.includes('джаред')) msg = '🤝 Джаред: "Логистика нод оптимизирована. Все документы подписаны. Ричард дышит ровно."';
        else if (isHooli) msg = '🕵️ Обнаружен корпоративный трафик. Данные изолированы. PiperNet защищает периметр.';

        const compressedBytes = Math.round(originalBytes / weissman);
        const savedPercent = Math.round((1 - compressedBytes / originalBytes) * 100);

        weissmanVal.textContent = weissman.toFixed(2);
        origSize.textContent = originalBytes;
        compSize.textContent = compressedBytes;
        savings.textContent = savedPercent + '%';
        systemMsg.textContent = msg;
        labOutput.hidden = false;
    }

    // === Events ===
    function setupEvents() {
        textarea.addEventListener('input', () => {
            const txt = textarea.value;
            charCount.textContent = txt.length;
            const ent = calcEntropy(txt);
            entropyPreview.textContent = `Энтропия: ${ent.toFixed(2)} бит/сим`;
            updateSpectrum(txt);
        });

        compressBtn.addEventListener('click', simulateCompression);
        clearBtn.addEventListener('click', () => {
            textarea.value = '';
            textarea.dispatchEvent(new Event('input'));
            labOutput.hidden = true;
            hooliWarning.hidden = true;
            systemMsg.textContent = '';
        });

        window.addEventListener('resize', () => {
            resizeCanvas();
            createParticles();
        });
    }

    // === Animation Loop ===
    function animate() {
        drawParticles();
        animFrame = requestAnimationFrame(animate);
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();