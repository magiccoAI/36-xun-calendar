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
        this.state.setMinutesForHandle(snapshot.activeHandle, TimeMath.angleToMinutes(angle));
    }

    handlePointerDown(event) {
        const handle = event.target.closest('[data-handle]');
        if (!handle) return;

        event.preventDefault();
        this.activePointerId = event.pointerId;
        this.state.setActiveHandle(handle.getAttribute('data-handle'));
        this.svg.setPointerCapture(event.pointerId);
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
    }

    destroy() {
        this.svg.removeEventListener('pointerdown', this.onPointerDown);
        this.svg.removeEventListener('pointermove', this.onPointerMove);
        this.svg.removeEventListener('pointerup', this.onPointerUp);
        this.svg.removeEventListener('pointercancel', this.onPointerUp);
        this.svg.removeEventListener('lostpointercapture', this.onPointerUp);
    }
}
