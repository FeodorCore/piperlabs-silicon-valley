(function() {
    // DOM Elements
    const buffer = document.getElementById('inputBuffer');
    const tagBytes = document.getElementById('tagBytes');
    const tagEntropy = document.getElementById('tagEntropy');
    const runBtn = document.getElementById('runEngine');
    const resetBtn = document.getElementById('resetEngine');
    const clearLogBtn = document.getElementById('clearLog');
    const telemetryFeed = document.getElementById('telemetryFeed');
    const hooliAlert = document.getElementById('hooliAlert');
    const pipelineNodes = document.querySelectorAll('.pipeline-node');
    const pipelineLinks = document.querySelectorAll('.pipeline-link');
    const pipelineStatus = document.getElementById('pipelineStatus');
    const mWeissman = document.getElementById('mWeissman');
    const mOriginal = document.getElementById('mOriginal');
    const mCompressed = document.getElementById('mCompressed');
    const mSavings = document.getElementById('mSavings');
    const sysClock = document.getElementById('sysClock');
    const btnText = runBtn ? runBtn.querySelector('.btn-text') : null;

    let isRunning = false;

    // Clock
    function updateClock() {
        if (!sysClock) return;
        sysClock.textContent = new Date().toLocaleTimeString('ru-RU', { hour12: false });
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Utils
    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function calcEntropy(text) {
        if (!text) return 0;
        const freq = {};
        for (const c of text) freq[c] = (freq[c] || 0) + 1;
        const len = text.length;
        let ent = 0;
        for (const count of Object.values(freq)) {
            const p = count / len;
            ent -= p * Math.log2(p);
        }
        return ent;
    }

    function addLog(msg, type = 'sys') {
        if (!telemetryFeed) return;
        const line = document.createElement('div');
        line.className = 'log-line';
        const time = new Date().toLocaleTimeString('ru-RU', { hour12: false });
        line.innerHTML = `<span class="log-tag ${type}">${type.toUpperCase()}</span> [${time}] ${msg}`;
        telemetryFeed.appendChild(line);
        telemetryFeed.scrollTop = telemetryFeed.scrollHeight;
    }

    function animateValue(el, start, end, duration, suffix = '') {
        if (!el) return;
        const range = end - start;
        const startTime = performance.now();
        function step(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = start + range * ease;
            el.textContent = (Number.isInteger(end) ? Math.round(current) : current.toFixed(2)) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function setPipelineStage(stageName) {
        const stages = ['parse', 'analyze', 'compress', 'distribute'];
        const currentIdx = stages.indexOf(stageName);

        pipelineNodes.forEach((n, i) => {
            n.classList.remove('active', 'done');
            if (i === currentIdx) n.classList.add('active');
            else if (i < currentIdx) n.classList.add('done');
        });

        pipelineLinks.forEach((l, i) => {
            l.classList.toggle('active', i < currentIdx);
        });
    }

    function resetPipeline() {
        pipelineNodes.forEach(n => n.classList.remove('active', 'done'));
        pipelineLinks.forEach(l => l.classList.remove('active'));
        if (pipelineStatus) pipelineStatus.textContent = 'Ожидание данных';
    }

    // Input handling
    if (buffer) {
        buffer.addEventListener('input', () => {
            const txt = buffer.value;
            const bytes = new Blob([txt]).size;
            if (tagBytes) tagBytes.textContent = formatBytes(bytes);
            if (tagEntropy) tagEntropy.textContent = `H: ${calcEntropy(txt).toFixed(2)}`;
        });
    }

    // Compression
    if (runBtn) {
        runBtn.addEventListener('click', async () => {
            if (isRunning) return;
            const text = buffer ? buffer.value.trim() : '';
            if (!text) {
                addLog('Буфер пуст. Введите данные для обработки.', 'warn');
                return;
            }

            isRunning = true;
            runBtn.disabled = true;
            runBtn.classList.add('loading');
            if (btnText) btnText.textContent = 'ОБРАБОТКА...';
            if (hooliAlert) hooliAlert.hidden = true;
            resetPipeline();
            addLog('Инициализация конвейера. Загрузка данных в память.', 'sys');

            const delay = ms => new Promise(r => setTimeout(r, ms));

            try {
                setPipelineStage('parse');
                if (pipelineStatus) pipelineStatus.textContent = 'Парсинг структуры...';
                await delay(350);
                addLog('Парсинг завершён. Структура данных валидна.', 'sys');

                setPipelineStage('analyze');
                if (pipelineStatus) pipelineStatus.textContent = 'Расчёт энтропии...';
                await delay(450);
                const entropy = calcEntropy(text);
                addLog(`Анализ: H=${entropy.toFixed(2)} бит/сим. Поиск точки максимальной плотности.`, 'sys');

                setPipelineStage('compress');
                if (pipelineStatus) pipelineStatus.textContent = 'Выполняется middle-out...';
                await delay(550);
                addLog('Сжатие запущено. Распределение нагрузки по ядрам.', 'sys');

                setPipelineStage('distribute');
                if (pipelineStatus) pipelineStatus.textContent = 'Финализация...';
                await delay(350);
                addLog('Конвейер завершён. Подготовка метрик.', 'ok');

                // Math
                const originalBytes = new Blob([text]).size;
                const maxEntropy = Math.log2(new Set(text).size || 2);
                const normEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;
                const patterns = (text.match(/(.)\1{3,}/g) || []).length;
                const patternBonus = Math.min(1.2, patterns * 0.15);
                let weissman = 1.4 + (1 - normEntropy) * 2.8 + patternBonus;
                weissman = Math.min(5.2, Math.max(1.2, weissman));

                const hooliRegex = /gavin|hooli|belson|nucleus|xyz/i;
                const isHooli = hooliRegex.test(text);
                if (isHooli) {
                    weissman *= 0.55;
                    if (hooliAlert) hooliAlert.hidden = false;
                    addLog('Обнаружены сигнатуры Hooli. Применён протокол изоляции.', 'warn');
                }

                const compressedBytes = Math.round(originalBytes / weissman);
                const savedPercent = Math.round((1 - compressedBytes / originalBytes) * 100);

                // Animate metrics
                animateValue(mWeissman, 0, weissman, 500);
                if (mOriginal) mOriginal.textContent = formatBytes(originalBytes);
                animateValue(mCompressed, 0, compressedBytes, 500, ' B');
                animateValue(mSavings, 0, savedPercent, 500, '%');

                if (pipelineStatus) pipelineStatus.textContent = 'Готово';
                addLog(`Результат: W=${weissman.toFixed(2)} | Экономия: ${savedPercent}%`, 'ok');
            } catch (e) {
                addLog(`Критическая ошибка: ${e.message}`, 'err');
                if (pipelineStatus) pipelineStatus.textContent = 'Ошибка';
            } finally {
                isRunning = false;
                runBtn.disabled = false;
                runBtn.classList.remove('loading');
                if (btnText) btnText.textContent = 'ИНИЦИАЛИЗИРОВАТЬ КОНВЕЙЕР';
            }
        });
    }

    // Reset
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (isRunning) return;
            if (buffer) {
                buffer.value = '';
                buffer.dispatchEvent(new Event('input'));
            }
            if (mWeissman) mWeissman.textContent = '—';
            if (mOriginal) mOriginal.textContent = '0 B';
            if (mCompressed) mCompressed.textContent = '0 B';
            if (mSavings) mSavings.textContent = '0%';
            resetPipeline();
            if (hooliAlert) hooliAlert.hidden = true;
            addLog('Среда сброшена. Ожидание входного потока.', 'sys');
        });
    }

    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', () => {
            if (telemetryFeed) {
                telemetryFeed.innerHTML = '<div class="log-line"><span class="log-tag sys">SYS</span> Лог очищен.</div>';
            }
        });
    }

    // Init
    addLog('Движок инициализирован. Ожидание данных.', 'sys');
})();