(function() {
    'use strict';

    // DOM Elements
    const input = document.getElementById('inputData');
    const statBytes = document.getElementById('statBytes');
    const statEntropy = document.getElementById('statEntropy');
    const runBtn = document.getElementById('runBtn');
    const resetBtn = document.getElementById('resetBtn');
    const clearLogBtn = document.getElementById('clearLog');
    const terminal = document.getElementById('terminal');
    const hooliToast = document.getElementById('hooliToast');
    const pipelineNodes = document.querySelectorAll('.node');
    const pipelineLinks = document.querySelectorAll('.link');
    const pipelineStatus = document.getElementById('pipelineStatus');
    const mWeissman = document.getElementById('mWeissman');
    const mOriginal = document.getElementById('mOriginal');
    const mCompressed = document.getElementById('mCompressed');
    const mSavings = document.getElementById('mSavings');
    const ringPath = document.getElementById('ringPath');
    const clock = document.getElementById('clock');
    const btnText = runBtn?.querySelector('.text');

    let isRunning = false;

    // Clock
    function updateClock() {
        if (clock) clock.textContent = new Date().toLocaleTimeString('ru-RU', { hour12: false });
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
        if (!terminal) return;
        const line = document.createElement('div');
        line.className = 'log-entry';
        const time = new Date().toLocaleTimeString('ru-RU', { hour12: false });
        line.innerHTML = `<span class="tag ${type}">${type.toUpperCase()}</span> [${time}] ${msg}`;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
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
        if (pipelineStatus) pipelineStatus.textContent = 'Ожидание данных...';
    }

    function updateRing(percent) {
        if (!ringPath) return;
        const circumference = 100;
        const offset = circumference - (percent / 100) * circumference;
        ringPath.style.strokeDasharray = `${percent}, ${circumference}`;
    }

    // Input handling
    if (input) {
        input.addEventListener('input', () => {
            const txt = input.value;
            const bytes = new Blob([txt]).size;
            if (statBytes) statBytes.textContent = formatBytes(bytes);
            if (statEntropy) statEntropy.textContent = `H: ${calcEntropy(txt).toFixed(2)}`;
        });
    }

    // Compression Engine
    if (runBtn) {
        runBtn.addEventListener('click', async () => {
            if (isRunning) return;
            const text = input ? input.value.trim() : '';
            if (!text) {
                addLog('Буфер пуст. Введите данные для обработки.', 'warn');
                return;
            }

            isRunning = true;
            runBtn.disabled = true;
            runBtn.classList.add('loading');
            if (btnText) btnText.textContent = 'ОБРАБОТКА...';
            if (hooliToast) hooliToast.hidden = true;
            resetPipeline();
            addLog('Инициализация конвейера. Загрузка данных в память.', 'sys');

            const delay = ms => new Promise(r => setTimeout(r, ms));

            try {
                setPipelineStage('parse');
                if (pipelineStatus) pipelineStatus.textContent = 'Парсинг структуры...';
                await delay(400);
                addLog('Парсинг завершён. Структура данных валидна.', 'sys');

                setPipelineStage('analyze');
                if (pipelineStatus) pipelineStatus.textContent = 'Расчёт энтропии...';
                await delay(500);
                const entropy = calcEntropy(text);
                addLog(`Анализ: H=${entropy.toFixed(2)} бит/сим. Поиск точки максимальной плотности.`, 'sys');

                setPipelineStage('compress');
                if (pipelineStatus) pipelineStatus.textContent = 'Выполняется middle-out...';
                await delay(600);
                addLog('Сжатие запущено. Распределение нагрузки по ядрам.', 'sys');

                setPipelineStage('distribute');
                if (pipelineStatus) pipelineStatus.textContent = 'Финализация...';
                await delay(400);
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
                    if (hooliToast) hooliToast.hidden = false;
                    addLog('Обнаружены сигнатуры Hooli. Применён протокол изоляции.', 'warn');
                }

                const compressedBytes = Math.round(originalBytes / weissman);
                const savedPercent = Math.round((1 - compressedBytes / originalBytes) * 100);

                // Animate metrics
                animateValue(mWeissman, 0, weissman, 600);
                if (mOriginal) mOriginal.textContent = formatBytes(originalBytes);
                animateValue(mCompressed, 0, compressedBytes, 600, ' B');
                animateValue(mSavings, 0, savedPercent, 600, '%');
                updateRing(savedPercent);

                if (pipelineStatus) pipelineStatus.textContent = 'Готово';
                addLog(`Результат: W=${weissman.toFixed(2)} | Экономия: ${savedPercent}%`, 'ok');
            } catch (e) {
                addLog(`Критическая ошибка: ${e.message}`, 'err');
                if (pipelineStatus) pipelineStatus.textContent = 'Ошибка';
            } finally {
                isRunning = false;
                runBtn.disabled = false;
                runBtn.classList.remove('loading');
                if (btnText) btnText.textContent = 'ЗАПУСТИТЬ СЖАТИЕ';
            }
        });
    }

    // Reset
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (isRunning) return;
            if (input) {
                input.value = '';
                input.dispatchEvent(new Event('input'));
            }
            if (mWeissman) mWeissman.textContent = '—';
            if (mOriginal) mOriginal.textContent = '0 B';
            if (mCompressed) mCompressed.textContent = '0 B';
            if (mSavings) mSavings.textContent = '0%';
            updateRing(0);
            resetPipeline();
            if (hooliToast) hooliToast.hidden = true;
            addLog('Среда сброшена. Ожидание входного потока.', 'sys');
        });
    }

    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', () => {
            if (terminal) {
                terminal.innerHTML = '<div class="log-entry"><span class="tag sys">SYS</span> Лог очищен.</div>';
            }
        });
    }

    // Init
    addLog('Движок инициализирован. Ожидание данных.', 'sys');
})();