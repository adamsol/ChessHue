
window._ ??= {};

_.addKeydownListener = callback => {
    window.addEventListener('keydown', event => {
        if (['INPUT', 'TEXTAREA'].includes(event.target.tagName) && event.target.type !== 'checkbox') {
            return;
        }
        callback(event);
    });
}
