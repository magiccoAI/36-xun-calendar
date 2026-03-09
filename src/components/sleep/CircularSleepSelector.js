import { SleepClockState } from './SleepClockState.js';
import { ClockRenderer } from './ClockRenderer.js';
import { DragController } from './DragController.js';

export class CircularSleepSelector {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.frameId = null;
        this.pendingSnapshot = null;

        this.state = new SleepClockState(options.initialData || {});
        this.renderer = new ClockRenderer(container);
        this.dragController = new DragController(this.renderer.svg, this.state);

        this.unsubscribe = this.state.subscribe((snapshot) => {
            this.pendingSnapshot = snapshot;
            this.requestRender();
            if (typeof this.options.onChange === 'function') {
                this.options.onChange(this.getValue());
            }
        });
    }

    requestRender() {
        if (this.frameId) return;
        this.frameId = requestAnimationFrame(() => {
            this.frameId = null;
            if (this.pendingSnapshot) {
                this.renderer.render(this.pendingSnapshot);
                this.pendingSnapshot = null;
            }
        });
    }

    restore(data) {
        this.state.restore(data || {});
    }

    getValue() {
        const snapshot = this.state.getSnapshot();
        return {
            bedtimeMinutes: snapshot.bedtimeMinutes,
            wakeMinutes: snapshot.wakeMinutes,
            durationMinutes: snapshot.durationMinutes,
            bedtimeLabel: snapshot.bedtimeLabel,
            wakeLabel: snapshot.wakeLabel,
            duration: Number((snapshot.durationMinutes / 60).toFixed(1))
        };
    }

    destroy() {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }

        this.unsubscribe?.();
        this.dragController?.destroy();
        this.container.innerHTML = '';
    }
}
