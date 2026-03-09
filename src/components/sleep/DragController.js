import { TimeMath } from './TimeMath.js';

export class DragController {
    constructor(svg, state) {
        this.svg = svg;
        this.state = state;
        this.activePointerId = null;

        this.bindEvents();
    }

    bindEvents() {
        this.onPointerDown = this.handlePointerDown.bind(this);
        this.onPointerMove = this.handlePointerMove.bind(this);
        this.onPointerUp = this.handlePointerUp.bind(this);

        this.svg.addEventListener('pointerdown', this.onPointerDown);
        this.svg.addEventListener('pointermove', this.onPointerMove);
        this.svg.addEventListener('pointerup', this.onPointerUp);
        this.svg.addEventListener('pointercancel', this.onPointerUp);
        this.svg.addEventListener('lostpointercapture', this.onPointerUp);
    }

    getRelativePoint(event) {
        const rect = this.svg.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 240;
        const y = ((event.clientY - rect.top) / rect.height) * 240;
        return { x, y };
    }

    updateFromEvent(event) {
        const snapshot = this.state.getSnapshot();
        if (!snapshot.activeHandle) return;

        const { x, y } = this.getRelativePoint(event);
        const angle = TimeMath.pointToAngle(x, y, 120, 120);
        const minutes = TimeMath.angleToMinutes(angle);
        this.state.setMinutesForHandle(snapshot.activeHandle, minutes);
    }

    handlePointerDown(event) {
        const handle = event.target.closest('[data-handle]');
        if (!handle) return;

        event.preventDefault();
        this.activePointerId = event.pointerId;
        const handleName = handle.getAttribute('data-handle');
        this.state.setActiveHandle(handleName);
        this.svg.setPointerCapture(event.pointerId);
        
        // 显示太阳图标的动态刻度
        this.showAdjustmentRing(handleName);
        
        this.updateFromEvent(event);
    }

    handlePointerMove(event) {
        if (event.pointerId !== this.activePointerId) return;
        this.updateFromEvent(event);
    }

    handlePointerUp(event) {
        if (event.pointerId !== this.activePointerId) return;

        this.activePointerId = null;
        this.state.setActiveHandle(null);
        
        // 隐藏所有动态刻度
        this.hideAllAdjustmentRings();
    }

    showAdjustmentRing(handleName) {
        if (handleName === 'wake') {
            const wakeHandle = this.svg.querySelector('[data-handle="wake"]');
            if (wakeHandle) {
                const adjustmentRing = wakeHandle.querySelector('.adjustment-ring');
                if (adjustmentRing) {
                    adjustmentRing.setAttribute('opacity', '1');
                    adjustmentRing.style.transition = 'opacity 0.3s ease-in-out';
                }
            }
        }
    }

    hideAllAdjustmentRings() {
        const adjustmentRings = this.svg.querySelectorAll('.adjustment-ring');
        adjustmentRings.forEach(ring => {
            ring.setAttribute('opacity', '0');
        });
    }

    destroy() {
        this.svg.removeEventListener('pointerdown', this.onPointerDown);
        this.svg.removeEventListener('pointermove', this.onPointerMove);
        this.svg.removeEventListener('pointerup', this.onPointerUp);
        this.svg.removeEventListener('pointercancel', this.onPointerUp);
        this.svg.removeEventListener('lostpointercapture', this.onPointerUp);
    }
}
