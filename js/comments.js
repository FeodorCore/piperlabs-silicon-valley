document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('commentForm');
    const textarea = document.getElementById('c-text');
    const counter = document.querySelector('.comment-form__counter');
    const successMsg = document.getElementById('formSuccess');

    if (form && textarea && counter) {
        textarea.addEventListener('input', () => {
            const len = textarea.value.length;
            counter.textContent = `${len} / 1000`;
            counter.style.color = len > 900 ? '#ef4444' : '#9ca3af';
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            // Mock success
            form.reset();
            counter.textContent = '0 / 1000';
            counter.style.color = '#9ca3af';
            successMsg.hidden = false;
            setTimeout(() => { successMsg.hidden = true; }, 4000);
        });
    }
});