
export default function initDock(container, items) {
    if (!container) return;

    // Configuration
    const baseSize = 50;
    const magnification = 70;
    const distanceLimit = 200;

    // Create Dock Panel
    const dockPanel = document.createElement('div');
    dockPanel.className = 'dock-panel';

    // Track item states
    const dockItems = [];

    // Create Items
    items.forEach(item => {
        const itemEl = document.createElement('button');
        itemEl.className = 'dock-item';
        itemEl.setAttribute('aria-label', item.label);

        // Icon
        const iconEl = document.createElement('div');
        iconEl.className = 'dock-icon';
        iconEl.innerHTML = item.icon;
        itemEl.appendChild(iconEl);

        // Label (Tooltip)
        const labelEl = document.createElement('div');
        labelEl.className = 'dock-label';
        labelEl.textContent = item.label;
        itemEl.appendChild(labelEl);

        // Click Handler
        itemEl.onclick = item.onClick;

        dockPanel.appendChild(itemEl);

        // State for animation
        dockItems.push({
            el: itemEl,
            currentSize: baseSize,
            targetSize: baseSize
        });
    });

    container.appendChild(dockPanel);

    // Animation Loop
    let mouseX = Infinity;
    let isHovering = false;

    function animate() {
        let needsUpdate = false;

        dockItems.forEach(item => {
            // Calculate scale based on mouse position if hovering
            if (isHovering && mouseX !== Infinity) {
                const rect = item.el.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const dist = Math.abs(mouseX - centerX);

                if (dist < distanceLimit) {
                    const extra = (magnification - baseSize) * Math.cos(dist / distanceLimit * Math.PI / 2); // Cosine eased drop-off
                    item.targetSize = baseSize + Math.max(0, extra);
                } else {
                    item.targetSize = baseSize;
                }
            } else {
                item.targetSize = baseSize;
            }

            // Lerp towards target
            const diff = item.targetSize - item.currentSize;
            if (Math.abs(diff) > 0.1) {
                item.currentSize += diff * 0.2; // Smoothness factor
                needsUpdate = true; // Keep animating if not settled
            } else {
                item.currentSize = item.targetSize;
            }

            // Apply size
            item.el.style.width = `${item.currentSize}px`;
            item.el.style.height = `${item.currentSize}px`;

            // Scale icon to keep it proportional 
            // (Optional: can also just let flexbox center it)
        });

        requestAnimationFrame(animate);
    }

    // Start Animation Loop
    animate();

    // Event Listeners
    dockPanel.addEventListener('mousemove', (e) => {
        isHovering = true;
        mouseX = e.clientX;
    });

    dockPanel.addEventListener('mouseleave', () => {
        isHovering = false;
        mouseX = Infinity;
    });

    // Handle touch devices roughly
    dockPanel.addEventListener('touchmove', (e) => {
        isHovering = true;
        mouseX = e.touches[0].clientX;
    });

    dockPanel.addEventListener('touchend', () => {
        isHovering = false;
        mouseX = Infinity;
    });
}
