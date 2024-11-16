// Modal functions
export function showModal(title, content, onConfirm, onCancel) {
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-content">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="modal-cancel">Cancel</button>
                    <button class="modal-confirm">Confirm</button>
                </div>
            </div>
        </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Get modal elements
    const modal = document.querySelector('.modal-overlay');
    const confirmBtn = modal.querySelector('.modal-confirm');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const focusableElements = modal.querySelectorAll('button, input, select');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Handle ESC, Enter, and TAB key
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            onCancel?.();
            closeModal(modal);
        }
        // Handle Enter key
        if (e.key === 'Enter' && !e.target.matches('textarea')) {
            onConfirm?.();
            closeModal(modal);
        }
        // Trap Tab key
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
  
    // Setup event listeners
    confirmBtn.addEventListener('click', () => {
        onConfirm?.();
        closeModal(modal);
    });

    cancelBtn.addEventListener('click', () => {
        onCancel?.();
        closeModal(modal);
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            onCancel?.();
            closeModal(modal);
        }
    });

    // Find the first input contorl and move the focus there if it exists
    modal.querySelector('input')?.focus();
}

function closeModal(modal) {
    modal.remove();
}

