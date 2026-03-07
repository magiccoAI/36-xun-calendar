export class CircularSleepSelector {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.bedtimeMinutes = 1380; // 23:00 default
        this.wakeTimeMinutes = 420;  // 07:00 default
        this.isDragging = null;
        this.selectedHandle = null;
        this.radius = 90;  // Reduced from 120
        this.centerRadius = 60;  // Reduced from 80
        this.centerX = 110;
        this.centerY = 110;
        this.dragSpeed = 0;
        this.lastDragTime = 0;
        this.lastDragAngle = 0;
        this.snapThreshold = 7.5; // degrees for magnetic snapping
        this.animationFrameId = null;
        this.proximityThreshold = 45; // degrees for showing detailed scales
        this.isDragging = false;
        this.activeHandleType = null;
        
        // State management
        this.state = new Proxy({
            bedtimeMinutes: this.bedtimeMinutes,
            wakeTimeMinutes: this.wakeTimeMinutes,
            sleepQuality: null,
            isDragging: false,
            dragType: null
        }, {
            set: (target, property, value) => {
                target[property] = value;
                this.onStateChange(property, value);
                return true;
            }
        });
        
        this.init();
    }
    
    init() {
        if (!this.container) {
            console.warn('CircularSleepSelector: Container not found');
            return;
        }
        
        this.updateCenterCoordinates();
        this.render();
        this.bindEvents();
        this.updateDisplays();
        this.bindResizeListener();
        
        // Initialize night zone after render
        setTimeout(() => {
            this.updateNightZone();
        }, 10);
    }
    
    render() {
        this.container.innerHTML = `
            <div class="circular-sleep-selector">
                <div class="relative w-[220px] h-[220px] mx-auto flex items-center justify-center">
                    <svg id="sleep-clock" width="220" height="220" viewBox="0 0 220 220" class="transform -rotate-90">
                        ${this.renderBackground()}
                        ${this.renderHourMarkers()}
                        ${this.renderHourNumbers()}
                        ${this.renderSleepArc()}
                        ${this.renderGradients()}
                        ${this.renderHandles()}
                    </svg>
                    
                    <!-- Center display -->
                    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div id="sleep-duration" class="text-lg font-semibold text-gray-700 transition-transform duration-200">8.0h</div>
                        <div class="text-xs text-gray-500">睡眠时长</div>
                    </div>
                    
                    <!-- Time bubble tooltip -->
                    <div id="time-bubble" class="absolute hidden bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none transition-all duration-150 opacity-0 transform scale-90"></div>
                </div>
                
                <!-- Time displays -->
                <div class="flex justify-between mt-6 text-sm">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">🌙</span>
                        <div>
                            <div class="text-xs text-gray-500">入睡时间</div>
                            <div id="bedtime-display" class="font-medium text-gray-700">23:00</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-lg">☀️</span>
                        <div>
                            <div class="text-xs text-gray-500">起床时间</div>
                            <div id="wake-time-display" class="font-medium text-gray-700">07:00</div>
                        </div>
                    </div>
                </div>
                
                <!-- Sleep quality buttons -->
                <div class="mt-6">
                    <div class="text-xs text-gray-500 mb-2">睡眠质量</div>
                    <div class="flex gap-2">
                        <button class="sleep-quality-btn flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" data-quality="excellent">
                            😴 优秀
                        </button>
                        <button class="sleep-quality-btn flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" data-quality="normal">
                            😐 一般
                        </button>
                        <button class="sleep-quality-btn flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" data-quality="poor">
                            😫 较差
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderBackground() {
        return `
            <!-- Background circle -->
            <circle cx="110" cy="110" r="${this.radius}" fill="none" stroke="#e5e7eb" stroke-width="2"/>
            
            <!-- Dynamic night zone overlay -->
            <path id="night-zone" 
                  fill="url(#nightGradient)" 
                  fill-opacity="0.15" 
                  stroke="none"/>
                  
            <!-- Inner glow effect -->
            <circle cx="110" cy="110" r="${this.radius - 2}" 
                    fill="none" 
                    stroke="url(#glowGradient)" 
                    stroke-width="1" 
                    opacity="0.3"/>
        `;
    }
    
    renderHourMarkers() {
        return this.generateHourMarkers();
    }
    
    renderHourNumbers() {
        return this.generateHourNumbers();
    }
    
    renderSleepArc() {
        return '<path id="sleep-arc" fill="none" stroke="url(#sleepGradient)" stroke-width="6" stroke-linecap="round"/>';
    }
    
    renderGradients() {
        return `
            <defs>
                <!-- Conic gradient for sleep arc -->
                <radialGradient id="sleepGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.8" />
                    <stop offset="50%" style="stop-color:#a855f7;stop-opacity:0.9" />
                    <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
                </radialGradient>
                
                <!-- Night zone gradient -->
                <radialGradient id="nightGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#1e293b;stop-opacity:0.3" />
                    <stop offset="70%" style="stop-color:#334155;stop-opacity:0.5" />
                    <stop offset="100%" style="stop-color:#475569;stop-opacity:0.7" />
                </radialGradient>
                
                <!-- Glow effect gradient -->
                <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.6" />
                    <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:0" />
                </radialGradient>
                
                <!-- Animated gradient for arc flow -->
                <linearGradient id="arcFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1">
                        <animate attributeName="stop-color" 
                                 values="#8b5cf6;#a855f7;#8b5cf6" 
                                 dur="4s" 
                                 repeatCount="indefinite"/>
                    </stop>
                    <stop offset="50%" style="stop-color:#a855f7;stop-opacity:1">
                        <animate attributeName="stop-color" 
                                 values="#a855f7;#f59e0b;#a855f7" 
                                 dur="4s" 
                                 repeatCount="indefinite"/>
                    </stop>
                    <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1">
                        <animate attributeName="stop-color" 
                                 values="#f59e0b;#8b5cf6;#f59e0b" 
                                 dur="4s" 
                                 repeatCount="indefinite"/>
                    </stop>
                </linearGradient>
            </defs>
        `;
    }
    
    renderHandles() {
        const bedtimeAngle = (this.bedtimeMinutes / 1440) * 360 - 90;
        const wakeTimeAngle = (this.wakeTimeMinutes / 1440) * 360 - 90;
        const bedtimeRadian = (bedtimeAngle * Math.PI) / 180;
        const wakeTimeRadian = (wakeTimeAngle * Math.PI) / 180;
        
        const moonX = this.radius * Math.cos(bedtimeRadian);
        const moonY = this.radius * Math.sin(bedtimeRadian);
        const sunX = this.radius * Math.cos(wakeTimeRadian);
        const sunY = this.radius * Math.sin(wakeTimeRadian);
        
        // Check for overlap and apply offset if needed
        const distance = Math.sqrt(Math.pow(moonX - sunX, 2) + Math.pow(moonY - sunY, 2));
        const offset = distance < 15 ? 8 : 0;
        
        return `
            <!-- Moon handle (bedtime) -->
            <g id="moon-handle" class="cursor-grab active:cursor-grabbing transition-transform duration-150" 
               transform="translate(${110 + moonX}, ${110 + moonY})" 
               style="transform: translate(${110 + moonX}px, ${110 + moonY}px) ${offset ? `translate(${-offset/2}px, ${offset}px)` : ''}">
                <circle r="10" fill="#f3f4f6" stroke="#8b5cf6" stroke-width="2" class="transition-all duration-150"/>
                <text x="0" y="4" text-anchor="middle" font-size="10" fill="#8b5cf6" transform="rotate(90)">🌙</text>
            </g>
            
            <!-- Sun handle (wake time) -->
            <g id="sun-handle" class="cursor-grab active:cursor-grabbing transition-transform duration-150" 
               transform="translate(${110 + sunX}, ${110 + sunY})" 
               style="transform: translate(${110 + sunX}px, ${110 + sunY}px) ${offset ? `translate(${offset/2}px, ${offset}px)` : ''}">
                <circle r="10" fill="#fef3c7" stroke="#f59e0b" stroke-width="2" class="transition-all duration-150"/>
                <text x="0" y="4" text-anchor="middle" font-size="10" fill="#f59e0b" transform="rotate(90)">☀️</text>
            </g>
        `;
    }
    
    generateHourMarkers() {
        let markers = '';
        
        // Generate 24 main hour markers
        for (let hour = 0; hour < 24; hour++) {
            const angle = (hour / 24) * 360 - 90;
            const radian = (angle * Math.PI) / 180;
            const x1 = 110 + (this.radius - 3) * Math.cos(radian);
            const y1 = 110 + (this.radius - 3) * Math.sin(radian);
            const x2 = 110 + this.radius * Math.cos(radian);
            const y2 = 110 + this.radius * Math.sin(radian);
            
            markers += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9ca3af" stroke-width="1"/>`;
            
            // Add 15-minute subdivisions with proximity detection
            if (hour < 23) {
                for (let minute = 15; minute < 60; minute += 15) {
                    const subAngle = ((hour + minute/60) / 24) * 360 - 90;
                    const subRadian = (subAngle * Math.PI) / 180;
                    const subX1 = 110 + (this.radius - 1.5) * Math.cos(subRadian);
                    const subY1 = 110 + (this.radius - 1.5) * Math.sin(subRadian);
                    const subX2 = 110 + (this.radius - 0.5) * Math.cos(subRadian);
                    const subY2 = 110 + (this.radius - 0.5) * Math.sin(subRadian);
                    
                    // Check proximity to active handle
                    const isNearActiveHandle = this.isMarkerNearActiveHandle(subAngle);
                    const opacity = isNearActiveHandle ? '1' : '0';
                    const strokeWidth = isNearActiveHandle ? '0.5' : '0';
                    
                    markers += `<line class="sub-marker" 
                                   x1="${subX1}" y1="${subY1}" 
                                   x2="${subX2}" y2="${subY2}" 
                                   stroke="#d1d5db" 
                                   stroke-width="${strokeWidth}" 
                                   opacity="${opacity}"
                                   style="transition: opacity 0.3s ease, stroke-width 0.3s ease"/>`;
                }
            }
        }
        return markers;
    }
    
    isMarkerNearActiveHandle(markerAngle) {
        if (!this.activeHandleType && !this.state.isDragging) return false;
        
        const handleMinutes = this.activeHandleType === 'bedtime' ? 
            this.state.bedtimeMinutes : this.state.wakeTimeMinutes;
        const handleAngle = (handleMinutes / 1440) * 360 - 90;
        
        // Normalize angles for comparison
        const normalizedMarker = markerAngle < 0 ? markerAngle + 360 : markerAngle;
        const normalizedHandle = handleAngle < 0 ? handleAngle + 360 : handleAngle;
        
        // Calculate angular distance
        let distance = Math.abs(normalizedMarker - normalizedHandle);
        if (distance > 180) distance = 360 - distance;
        
        return distance < this.proximityThreshold;
    }
    
    updateMarkerVisibility() {
        const subMarkers = document.querySelectorAll('.sub-marker');
        subMarkers.forEach(marker => {
            // Get the angle from the marker position
            const x1 = parseFloat(marker.getAttribute('x1'));
            const y1 = parseFloat(marker.getAttribute('y1'));
            const angle = Math.atan2(y1 - 110, x1 - 110) * (180 / Math.PI) + 90;
            
            const isNear = this.isMarkerNearActiveHandle(angle);
            marker.style.opacity = isNear ? '1' : '0';
            marker.style.strokeWidth = isNear ? '0.5' : '0';
        });
    }
    
    generateHourNumbers() {
        let numbers = '';
        
        // Show key hours in 24-hour format
        const keyHours = [0, 6, 12, 18]; // 0点, 6点, 12点, 18点
        
        keyHours.forEach(hour => {
            const angle = (hour / 24) * 360 - 90;
            const radian = (angle * Math.PI) / 180;
            const x = 110 + (this.radius - 15) * Math.cos(radian);
            const y = 110 + (this.radius - 15) * Math.sin(radian);
            
            // Keep text horizontal for better readability
            numbers += `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="10" fill="#6b7280">${hour}点</text>`;
        });
        return numbers;
    }
    
    updateCenterCoordinates() {
        const svg = document.getElementById('sleep-clock');
        if (svg) {
            const rect = svg.getBoundingClientRect();
            this.centerX = rect.left + rect.width / 2;
            this.centerY = rect.top + rect.height / 2;
        } else {
            // Fallback to default values
            this.centerX = 110;
            this.centerY = 110;
        }
    }
    
    bindResizeListener() {
        window.addEventListener('resize', () => {
            this.updateCenterCoordinates();
        });
    }
    
    onStateChange(property, value) {
        switch (property) {
            case 'bedtimeMinutes':
                this.bedtimeMinutes = value;
                this.updateHandles();
                this.updateDisplays();
                this.updateMarkerVisibility();
                break;
            case 'wakeTimeMinutes':
                this.wakeTimeMinutes = value;
                this.updateHandles();
                this.updateDisplays();
                this.updateMarkerVisibility();
                break;
            case 'sleepQuality':
                this.sleepQuality = value;
                break;
            case 'isDragging':
                this.isDragging = value;
                if (!value) {
                    this.updateMarkerVisibility();
                }
                break;
            case 'dragType':
                this.isDragging = value;
                break;
        }
    }
    
    bindEvents() {
        const svg = document.getElementById('sleep-clock');
        const moonHandle = document.getElementById('moon-handle');
        const sunHandle = document.getElementById('sun-handle');
        
        // Mouse events
        [moonHandle, sunHandle].forEach(handle => {
            handle.addEventListener('mousedown', (e) => this.startDrag(e, handle === moonHandle ? 'bedtime' : 'wake'));
            // Add click to select overlapped handles
            handle.addEventListener('click', (e) => this.handleHandleClick(e, handle === moonHandle ? 'bedtime' : 'wake'));
        });
        
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', () => this.endDrag());
        
        // Touch events
        [moonHandle, sunHandle].forEach(handle => {
            handle.addEventListener('touchstart', (e) => this.startDrag(e, handle === moonHandle ? 'bedtime' : 'wake'));
            handle.addEventListener('click', (e) => this.handleHandleClick(e, handle === moonHandle ? 'bedtime' : 'wake'));
        });
        
        document.addEventListener('touchmove', (e) => this.onDrag(e));
        document.addEventListener('touchend', () => this.endDrag());
        
        // Sleep quality buttons
        document.querySelectorAll('.sleep-quality-btn').forEach(btn => {
            btn.addEventListener('click', () => this.onSleepQualityClick(btn));
        });
    }
    
    handleHandleClick(e, type) {
        e.stopPropagation();
        
        // Check if handles are overlapping
        const bedtimeAngle = (this.bedtimeMinutes / 1440) * 360 - 90;
        const wakeTimeAngle = (this.wakeTimeMinutes / 1440) * 360 - 90;
        const angleDiff = Math.abs(bedtimeAngle - wakeTimeAngle);
        
        if (angleDiff < 15) { // Handles are close/overlapping
            // Toggle selection between handles
            if (this.selectedHandle === type) {
                this.selectedHandle = type === 'bedtime' ? 'wake' : 'bedtime';
            } else {
                this.selectedHandle = type;
            }
            
            // Visual feedback for selection
            this.updateHandleSelection();
        }
    }
    
    updateHandleSelection() {
        const moonHandle = document.getElementById('moon-handle');
        const sunHandle = document.getElementById('sun-handle');
        
        // Reset both handles
        [moonHandle, sunHandle].forEach(handle => {
            const circle = handle.querySelector('circle');
            circle.style.strokeWidth = '2';
            circle.style.filter = '';
        });
        
        // Highlight selected handle
        if (this.selectedHandle) {
            const selectedEl = this.selectedHandle === 'bedtime' ? moonHandle : sunHandle;
            const circle = selectedEl.querySelector('circle');
            circle.style.strokeWidth = '3';
            circle.style.filter = 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.5))';
        }
    }
    
    startDrag(e, type) {
        e.preventDefault();
        this.state.isDragging = true;
        this.state.dragType = type;
        this.selectedHandle = type;
        this.activeHandleType = type;
        this.isDragging = true;
        
        const handle = document.getElementById(type === 'bedtime' ? 'moon-handle' : 'sun-handle');
        
        // Bring handle to front
        handle.parentElement.appendChild(handle);
        handle.style.cursor = 'grabbing';
        
        // Initialize drag tracking
        this.lastDragTime = Date.now();
        const svg = document.getElementById('sleep-clock');
        const rect = svg.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;
        this.lastDragAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
        if (this.lastDragAngle < 0) this.lastDragAngle += 360;
        
        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
        
        // Show time bubble
        this.showTimeBubble(type);
        
        // Start animation loop for smooth updates
        this.startAnimationLoop();
    }
    
    onDrag(e) {
        if (!this.state.isDragging) return;
        
        const svg = document.getElementById('sleep-clock');
        const rect = svg.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        // Calculate angle from center
        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;
        
        // Calculate drag speed for inertia effects
        const currentTime = Date.now();
        const timeDiff = currentTime - this.lastDragTime;
        const angleDiff = Math.abs(angle - this.lastDragAngle);
        this.dragSpeed = timeDiff > 0 ? angleDiff / timeDiff * 100 : 0;
        this.lastDragTime = currentTime;
        this.lastDragAngle = angle;
        
        // Magnetic snapping - check proximity to 15-minute intervals
        const minuteSnap = 15;
        const totalMinutes = (angle / 360) * 1440;
        const nearestSnap = Math.round(totalMinutes / minuteSnap) * minuteSnap;
        const snapAngle = (nearestSnap / 1440) * 360;
        const angleDistance = Math.abs(angle - snapAngle);
        
        let finalAngle = angle;
        let isSnapping = false;
        
        // Apply magnetic snapping if close to a tick mark
        if (angleDistance < this.snapThreshold) {
            finalAngle = snapAngle;
            isSnapping = true;
            
            // Haptic feedback
            if ('vibrate' in navigator && timeDiff > 100) {
                navigator.vibrate(30);
            }
        }
        
        // Store drag state for animation frame
        this.pendingDragUpdate = {
            angle: finalAngle,
            isSnapping: isSnapping,
            type: this.state.dragType
        };
        
        // Update time bubble immediately for responsiveness
        const minutes = Math.round((finalAngle / 360) * 1440 / 15) * 15;
        this.updateTimeBubble(minutes);
        
        // Update marker visibility
        this.updateMarkerVisibility();
    }
    
    startAnimationLoop() {
        if (this.animationFrameId) return;
        
        const animate = () => {
            if (!this.state.isDragging) {
                this.stopAnimationLoop();
                return;
            }
            
            if (this.pendingDragUpdate) {
                const { angle, isSnapping, type } = this.pendingDragUpdate;
                
                // Convert angle to minutes
                const minutes = Math.round((angle / 360) * 1440 / 15) * 15;
                
                // Update state
                if (type === 'bedtime') {
                    this.state.bedtimeMinutes = minutes;
                } else {
                    this.state.wakeTimeMinutes = minutes;
                }
                
                // Update visual elements
                this.updateHandles();
                this.updateSleepArc();
                this.updateNightZone();
                
                // Visual feedback for snapping
                if (isSnapping) {
                    this.animateSnap(type);
                }
                
                // Add inertia effect to duration display
                this.updateDurationWithInertia();
                
                this.pendingDragUpdate = null;
            }
            
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        this.animationFrameId = requestAnimationFrame(animate);
    }
    
    stopAnimationLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.pendingDragUpdate = null;
    }
    
    endDrag() {
        if (!this.state.isDragging) return;
        
        const handle = document.getElementById(this.state.dragType === 'bedtime' ? 'moon-handle' : 'sun-handle');
        handle.style.cursor = 'grab';
        
        // Hide time bubble
        this.hideTimeBubble();
        
        // Stop animation loop
        this.stopAnimationLoop();
        
        // Reset state
        this.state.isDragging = false;
        this.state.dragType = null;
        this.isDragging = false;
        this.activeHandleType = null;
        this.dragSpeed = 0;
        
        // Final marker visibility update
        this.updateMarkerVisibility();
    }
    
    animateSnap(type) {
        const handle = document.getElementById(type === 'bedtime' ? 'moon-handle' : 'sun-handle');
        const circle = handle.querySelector('circle');
        
        // Add scaling animation for snap feedback
        circle.style.transition = 'transform 0.15s ease-out';
        circle.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            circle.style.transform = 'scale(1)';
        }, 150);
    }
    
    showTimeBubble(type) {
        const bubble = document.getElementById('time-bubble');
        if (!bubble) return;
        
        bubble.classList.remove('hidden');
        
        // Position bubble near the handle
        const handle = document.getElementById(type === 'bedtime' ? 'moon-handle' : 'sun-handle');
        const handleRect = handle.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        bubble.style.left = `${handleRect.left - containerRect.left + handleRect.width / 2}px`;
        bubble.style.top = `${handleRect.top - containerRect.top - 30}px`;
        
        // Fade in animation
        setTimeout(() => {
            bubble.classList.remove('opacity-0', 'scale-90');
            bubble.classList.add('opacity-100', 'scale-100');
        }, 10);
    }
    
    updateTimeBubble(minutes) {
        const bubble = document.getElementById('time-bubble');
        if (!bubble) return;
        
        bubble.textContent = this.minutesToTime(minutes);
    }
    
    hideTimeBubble() {
        const bubble = document.getElementById('time-bubble');
        if (!bubble) return;
        
        bubble.classList.remove('opacity-100', 'scale-100');
        bubble.classList.add('opacity-0', 'scale-90');
        
        setTimeout(() => {
            bubble.classList.add('hidden');
        }, 150);
    }
    
    updateDurationWithInertia() {
        const durationElement = document.getElementById('sleep-duration');
        if (!durationElement) return;
        
        // Calculate duration
        let duration;
        if (this.bedtimeMinutes > this.wakeTimeMinutes) {
            duration = (1440 - this.bedtimeMinutes + this.wakeTimeMinutes) / 60;
        } else {
            duration = (this.wakeTimeMinutes - this.bedtimeMinutes) / 60;
        }
        
        durationElement.textContent = `${duration.toFixed(1)}h`;
        
        // Add inertia effect based on drag speed
        const tilt = Math.min(this.dragSpeed * 0.1, 15); // Max 15 degrees tilt
        const scale = 1 + Math.min(this.dragSpeed * 0.01, 0.1); // Max 10% scale
        
        durationElement.style.transform = `rotate(${tilt}deg) scale(${scale})`;
        
        // Reset animation after drag ends
        if (!this.state.isDragging) {
            setTimeout(() => {
                durationElement.style.transform = 'rotate(0deg) scale(1)';
            }, 200);
        }
    }
    
    updateHandles() {
        const moonHandle = document.getElementById('moon-handle');
        const sunHandle = document.getElementById('sun-handle');
        
        if (!moonHandle || !sunHandle) return;
        
        const bedtimeAngle = (this.state.bedtimeMinutes / 1440) * 360 - 90;
        const wakeTimeAngle = (this.state.wakeTimeMinutes / 1440) * 360 - 90;
        
        const bedtimeRadian = (bedtimeAngle * Math.PI) / 180;
        const wakeTimeRadian = (wakeTimeAngle * Math.PI) / 180;
        
        const moonX = this.radius * Math.cos(bedtimeRadian);
        const moonY = this.radius * Math.sin(bedtimeRadian);
        const sunX = this.radius * Math.cos(wakeTimeRadian);
        const sunY = this.radius * Math.sin(wakeTimeRadian);
        
        // Check for overlap and apply offset
        const distance = Math.sqrt(Math.pow(moonX - sunX, 2) + Math.pow(moonY - sunY, 2));
        const offset = distance < 15 ? 8 : 0;
        
        moonHandle.setAttribute('transform', `translate(${110 + moonX}, ${110 + moonY})`);
        sunHandle.setAttribute('transform', `translate(${110 + sunX}, ${110 + sunY})`);
        
        // Apply offset styles if needed
        if (offset) {
            moonHandle.style.transform = `translate(${110 + moonX}px, ${110 + moonY}px) translate(${-offset/2}px, ${offset}px)`;
            sunHandle.style.transform = `translate(${110 + sunX}px, ${110 + sunY}px) translate(${offset/2}px, ${offset}px)`;
        } else {
            moonHandle.style.transform = `translate(${110 + moonX}px, ${110 + moonY}px)`;
            sunHandle.style.transform = `translate(${110 + sunX}px, ${110 + sunY}px)`;
        }
        
        this.updateSleepArc();
    }
    
    updateSleepArc() {
        const arc = document.getElementById('sleep-arc');
        if (!arc) return;
        
        const bedtimeAngle = (this.state.bedtimeMinutes / 1440) * 360 - 90;
        const wakeTimeAngle = (this.state.wakeTimeMinutes / 1440) * 360 - 90;
        
        let startAngle = bedtimeAngle;
        let endAngle = wakeTimeAngle;
        
        // Handle cross-midnight case
        if (this.state.bedtimeMinutes > this.state.wakeTimeMinutes) {
            // Sleep spans midnight, arc goes from bedtime to midnight, then 0 to wake time
            const path = this.createArcPath(110, 110, this.radius, bedtimeAngle, wakeTimeAngle + 360);
            arc.setAttribute('d', path);
        } else {
            // Normal case: bedtime before wake time
            const path = this.createArcPath(110, 110, this.radius, bedtimeAngle, wakeTimeAngle);
            arc.setAttribute('d', path);
        }
        
        // Also update the night zone shadow
        this.updateNightZone();
    }
    
    updateNightZone() {
        const nightZone = document.getElementById('night-zone');
        if (!nightZone) return;
        
        const bedtimeAngle = (this.state.bedtimeMinutes / 1440) * 360 - 90;
        const wakeTimeAngle = (this.state.wakeTimeMinutes / 1440) * 360 - 90;
        
        // Create dynamic night zone that follows sleep arc
        let nightZonePath;
        if (this.state.bedtimeMinutes > this.state.wakeTimeMinutes) {
            // Cross-midnight case
            nightZonePath = this.createArcPath(110, 110, this.radius, bedtimeAngle, wakeTimeAngle + 360);
        } else {
            // Normal case
            nightZonePath = this.createArcPath(110, 110, this.radius, bedtimeAngle, wakeTimeAngle);
        }
        
        // Apply path with smooth transition
        nightZone.setAttribute('d', nightZonePath);
        
        // Optimize transition based on drag state
        if (this.state.isDragging) {
            // Faster transition during drag for responsiveness
            nightZone.style.transition = 'd 0.08s ease-out, fill-opacity 0.15s ease-out';
            nightZone.style.fillOpacity = '0.2'; // Slightly more visible during interaction
        } else {
            // Smoother transition when not dragging
            nightZone.style.transition = 'd 0.2s ease-out, fill-opacity 0.3s ease-out';
            nightZone.style.fillOpacity = '0.15'; // Normal opacity
        }
        
        // Add subtle pulse effect during drag
        if (this.state.isDragging && !nightZone.classList.contains('dragging')) {
            nightZone.classList.add('dragging');
            nightZone.style.filter = 'brightness(1.1)';
        } else if (!this.state.isDragging && nightZone.classList.contains('dragging')) {
            nightZone.classList.remove('dragging');
            nightZone.style.filter = 'brightness(1)';
        }
    }
    
    createArcPath(cx, cy, radius, startAngle, endAngle) {
        const startRadian = (startAngle * Math.PI) / 180;
        const endRadian = (endAngle * Math.PI) / 180;
        
        const x1 = cx + radius * Math.cos(startRadian);
        const y1 = cy + radius * Math.sin(startRadian);
        const x2 = cx + radius * Math.cos(endRadian);
        const y2 = cy + radius * Math.sin(endRadian);
        
        const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
        
        return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
    }
    
    updateDisplays() {
        // Update time displays
        const bedtimeDisplay = document.getElementById('bedtime-display');
        const wakeTimeDisplay = document.getElementById('wake-time-display');
        
        if (bedtimeDisplay) {
            bedtimeDisplay.textContent = this.minutesToTime(this.state.bedtimeMinutes);
        }
        if (wakeTimeDisplay) {
            wakeTimeDisplay.textContent = this.minutesToTime(this.state.wakeTimeMinutes);
        }
        
        // Calculate and update duration
        let duration;
        if (this.state.bedtimeMinutes > this.state.wakeTimeMinutes) {
            // Cross-midnight sleep
            duration = (1440 - this.state.bedtimeMinutes + this.state.wakeTimeMinutes) / 60;
        } else {
            // Same day sleep (less common)
            duration = (this.state.wakeTimeMinutes - this.state.bedtimeMinutes) / 60;
        }
        
        const durationElement = document.getElementById('sleep-duration');
        if (durationElement) {
            durationElement.textContent = `${duration.toFixed(1)}h`;
            
            // Add warning color for insufficient sleep
            if (duration < 6) {
                durationElement.classList.add('text-orange-600');
                durationElement.classList.remove('text-gray-700');
            } else {
                durationElement.classList.add('text-gray-700');
                durationElement.classList.remove('text-orange-600');
            }
        }
    }
    
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60) % 24;
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    
    onSleepQualityClick(button) {
        // Remove all active states
        document.querySelectorAll('.sleep-quality-btn').forEach(btn => {
            btn.classList.remove('bg-blue-100', 'border-blue-300', 'text-blue-700',
                              'bg-gray-100', 'border-gray-300', 'text-gray-700',
                              'bg-red-100', 'border-red-300', 'text-red-700');
            btn.classList.add('border-gray-200');
        });
        
        // Add active state
        const quality = button.dataset.quality;
        this.state.sleepQuality = quality;
        
        switch (quality) {
            case 'excellent':
                button.classList.remove('border-gray-200');
                button.classList.add('bg-blue-100', 'border-blue-300', 'text-blue-700');
                break;
            case 'normal':
                button.classList.remove('border-gray-200');
                button.classList.add('bg-gray-100', 'border-gray-300', 'text-gray-700');
                break;
            case 'poor':
                button.classList.remove('border-gray-200');
                button.classList.add('bg-red-100', 'border-red-300', 'text-red-700');
                break;
        }
    }
    
    // Get current sleep data (for saving)
    getSleepData() {
        let duration;
        if (this.state.bedtimeMinutes > this.state.wakeTimeMinutes) {
            duration = (1440 - this.state.bedtimeMinutes + this.state.wakeTimeMinutes) / 60;
        } else {
            duration = (this.state.wakeTimeMinutes - this.state.bedtimeMinutes) / 60;
        }
        
        return {
            bedtime: this.minutesToTime(this.state.bedtimeMinutes),
            wakeUpTime: this.minutesToTime(this.state.wakeTimeMinutes),
            totalHours: parseFloat(duration.toFixed(1)),
            quality: this.state.sleepQuality
        };
    }
    
    // Set sleep data (for loading)
    setSleepData(data) {
        if (!data) return;
        
        if (data.bedtime) {
            const [hours, minutes] = data.bedtime.split(':').map(Number);
            this.state.bedtimeMinutes = hours * 60 + minutes;
        }
        
        if (data.wakeUpTime) {
            const [hours, minutes] = data.wakeUpTime.split(':').map(Number);
            this.state.wakeTimeMinutes = hours * 60 + minutes;
        }
        
        if (data.quality) {
            const button = document.querySelector(`[data-quality="${data.quality}"]`);
            if (button) {
                this.onSleepQualityClick(button);
            }
        }
        
        this.updateHandles();
        this.updateDisplays();
    }
    
    // Reset to defaults
    reset() {
        this.state.bedtimeMinutes = 1380; // 23:00
        this.state.wakeTimeMinutes = 420;  // 07:00
        this.state.sleepQuality = null;
        
        // Reset quality buttons
        document.querySelectorAll('.sleep-quality-btn').forEach(btn => {
            btn.classList.remove('bg-blue-100', 'border-blue-300', 'text-blue-700',
                              'bg-gray-100', 'border-gray-300', 'text-gray-700',
                              'bg-red-100', 'border-red-300', 'text-red-700');
            btn.classList.add('border-gray-200');
        });
        
        this.updateHandles();
        this.updateDisplays();
    }
}
