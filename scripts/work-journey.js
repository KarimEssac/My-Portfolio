(() => {
    'use strict';

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    class WorkJourney {
        constructor(section) {
            this.section = section;
            this.viewport = section.querySelector('.journey-viewport');
            this.panels = [...section.querySelectorAll('.journey-panel')];
            this.controls = [...section.querySelectorAll('[data-role-index]')];
            this.bars = [...section.querySelectorAll('.journey-role-bar[data-role-index]')];
            this.counter = section.querySelector('[data-journey-counter]');
            this.total = section.querySelector('[data-journey-total]');
            this.status = section.querySelector('[data-journey-status]');
            this.progress = section.querySelector('[data-journey-progress]');
            this.previous = section.querySelector('[data-journey-previous]');
            this.next = section.querySelector('[data-journey-next]');
            this.navbar = document.querySelector('.navbar');
            this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.activeIndex = -1;
            this.nativeIndex = 0;
            this.displayMode = '';
            this.frame = null;
            this.measureFrame = null;
            this.snapFrame = null;
            this.snapIndex = null;
            this.wheelUntil = 0;
            this.mode = '';

            const today = new Date();
            const currentYear = Math.max(2026, today.getFullYear());
            this.chartStart = 2019;
            this.chartEnd = currentYear + 1;
            const present = Math.max(2026.5, today.getFullYear() + today.getMonth() / 12);
            this.markerDates = this.panels.map(panel => panel.dataset.markerDate === 'present'
                ? Math.min(present, this.chartEnd - 0.18) : Number(panel.dataset.markerDate));
            if (this.total) this.total.textContent = `/ ${String(this.panels.length).padStart(2, '0')}`;
            this.renderDates(currentYear, present);

            this.queueUpdate = () => {
                if (this.frame !== null || this.snapFrame !== null) return;
                this.frame = requestAnimationFrame(() => {
                    this.frame = null;
                    this.update();
                });
            };
            this.queueMeasure = () => {
                if (this.measureFrame !== null) return;
                this.measureFrame = requestAnimationFrame(() => {
                    this.measureFrame = null;
                    this.measure();
                });
            };

            window.addEventListener('scroll', this.queueUpdate, { passive: true });
            window.addEventListener('resize', this.queueMeasure, { passive: true });
            window.addEventListener('load', this.queueMeasure, { once: true });
            window.visualViewport?.addEventListener('resize', this.queueMeasure, { passive: true });
            this.motion.addEventListener('change', this.queueMeasure);
            this.previous.addEventListener('click', () => this.goTo(this.activeIndex - 1));
            this.next.addEventListener('click', () => this.goTo(this.activeIndex + 1));
            this.controls.forEach(control => {
                control.addEventListener('click', () => this.goTo(Number(control.dataset.roleIndex)));
            });
            section.addEventListener('wheel', event => this.handleWheel(event), { passive: false });

            section.addEventListener('keydown', event => {
                if (event.altKey || event.ctrlKey || event.metaKey) return;
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                if (event.target.closest('input, textarea, select, [contenteditable]')) return;
                event.preventDefault();
                const index = event.key === 'Home' ? 0
                    : event.key === 'End' ? this.panels.length - 1
                    : this.activeIndex + (event.key === 'ArrowRight' ? 1 : -1);
                this.goTo(index);
            });

            // A swipe selects a complete chapter, so adjacent jobs cannot mingle.
            this.viewport.addEventListener('pointerdown', event => {
                if (event.pointerType === 'mouse' || this.mode === 'stacked') return;
                this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
            }, { passive: true });
            this.viewport.addEventListener('pointerup', event => {
                const start = this.pointer;
                this.pointer = null;
                if (!start || start.id !== event.pointerId) return;
                const dx = event.clientX - start.x;
                const dy = event.clientY - start.y;
                if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                    this.goTo(this.activeIndex + (dx < 0 ? 1 : -1));
                }
            }, { passive: true });
            this.viewport.addEventListener('pointercancel', () => { this.pointer = null; }, { passive: true });

            this.resizeObserver = new ResizeObserver(this.queueMeasure);
            this.resizeObserver.observe(this.viewport);
            if (this.navbar) this.resizeObserver.observe(this.navbar);
            document.fonts?.ready.then(this.queueMeasure);
            this.measure();
        }

        position(date) {
            return clamp((date - this.chartStart) / (this.chartEnd - this.chartStart), 0, 1) * 100;
        }

        renderDates(currentYear, present) {
            const ticks = this.section.querySelector('.journey-years');
            for (let year = this.chartStart; year <= currentYear; year++) {
                const tick = document.createElement('span');
                tick.className = 'journey-year';
                tick.style.left = `${this.position(year)}%`;
                const label = document.createElement('span');
                label.className = 'journey-year-label';
                label.textContent = year;
                tick.appendChild(label);
                ticks.appendChild(tick);
            }
            this.section.querySelectorAll('[data-date-start]').forEach(bar => {
                const start = Number(bar.dataset.dateStart);
                const end = bar.dataset.dateEnd === 'present'
                    ? Math.min(this.chartEnd, present + 0.22) : Number(bar.dataset.dateEnd);
                bar.style.left = `${this.position(start)}%`;
                bar.style.width = `${this.position(end) - this.position(start)}%`;
            });
        }

        measure() {
            const oldMode = this.mode;
            const pendingIndex = this.snapIndex;
            this.cancelSnap();
            const navHeight = this.navbar?.getBoundingClientRect().height || 70;
            const availableHeight = window.innerHeight - navHeight;
            this.mode = this.motion.matches ? 'stacked' : availableHeight < 640 ? 'native' : 'pinned';
            this.navHeight = navHeight;
            this.section.style.setProperty('--journey-nav-height', `${navHeight}px`);
            this.section.style.setProperty('--journey-height', `${availableHeight}px`);
            this.section.dataset.scrollMode = this.mode;

            if (this.mode === 'pinned') {
                const needsMoreRoom = this.panels.some(panel => {
                    const bounds = panel.getBoundingClientRect();
                    const copy = panel.querySelector('.journey-copy').getBoundingClientRect();
                    const art = panel.querySelector('.journey-art').getBoundingClientRect();
                    return copy.top < bounds.top - 1 || copy.bottom > bounds.bottom + 1
                        || art.top < bounds.top - 1 || art.bottom > bounds.bottom + 1;
                });
                if (needsMoreRoom) {
                    this.mode = 'native';
                    this.section.dataset.scrollMode = this.mode;
                }
            }

            this.width = this.viewport.clientWidth;
            this.distance = this.width * (this.panels.length - 1);
            this.scrollRange = this.distance;

            if (this.mode === 'pinned') {
                this.section.style.height = `${availableHeight + this.scrollRange}px`;
            } else {
                this.section.style.removeProperty('height');
                if (this.mode === 'native' && oldMode !== 'native') {
                    this.nativeIndex = Math.max(0, this.activeIndex);
                }
            }
            this.update();
            if (pendingIndex !== null) this.goTo(pendingIndex, false);
        }

        handleWheel(event) {
            if (this.mode !== 'pinned' || event.defaultPrevented || event.ctrlKey || event.metaKey) return;
            if (!event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

            const offset = this.navHeight - this.section.getBoundingClientRect().top;
            if (offset < -1 || offset > this.scrollRange + 1) return;

            const now = performance.now();
            // Treat the wheel burst and its trackpad momentum as one gesture.
            if (this.snapFrame !== null || now < this.wheelUntil) {
                event.preventDefault();
                this.wheelUntil = now + 180;
                return;
            }

            const index = this.activeIndex + Math.sign(event.deltaY);
            // At either end, hand scrolling back to the surrounding page.
            if (index < 0 || index >= this.panels.length) return;

            event.preventDefault();
            this.wheelUntil = now + 180;
            this.goTo(index);
        }

        cancelSnap() {
            if (this.snapFrame !== null) cancelAnimationFrame(this.snapFrame);
            this.snapFrame = null;
            this.snapIndex = null;
        }

        update() {
            let chapter;
            if (this.mode === 'pinned') {
                const offset = this.navHeight - this.section.getBoundingClientRect().top;
                const fraction = clamp(offset / Math.max(1, this.distance), 0, 1);
                chapter = fraction * (this.panels.length - 1);
            } else if (this.mode === 'native') {
                chapter = this.nativeIndex;
            } else {
                const positions = this.panels.map(panel =>
                    Math.abs(panel.getBoundingClientRect().top - this.navHeight - 40));
                chapter = positions.indexOf(Math.min(...positions));
            }

            // Keep the timeline continuous while each role gets a complete, readable stage.
            const leftIndex = Math.min(Math.floor(chapter), this.panels.length - 1);
            const rightIndex = Math.min(leftIndex + 1, this.panels.length - 1);
            const date = this.markerDates[leftIndex]
                + (this.markerDates[rightIndex] - this.markerDates[leftIndex]) * (chapter - leftIndex);
            this.section.style.setProperty('--journey-marker', `${this.position(date)}%`);
            this.section.style.setProperty('--journey-completion', `${chapter / (this.panels.length - 1) * 100}%`);

            const activeIndex = this.snapIndex ?? Math.round(chapter);
            const activePanel = this.panels[activeIndex];
            const roleLabel = [activePanel.dataset.company, activePanel.dataset.project].filter(Boolean).join(' · ');
            this.progress.setAttribute('aria-valuenow',
                String(Math.round(chapter / (this.panels.length - 1) * 100)));
            this.progress.setAttribute('aria-valuetext',
                `${roleLabel}, chapter ${activeIndex + 1} of ${this.panels.length}`);
            if (activeIndex === this.activeIndex && this.displayMode === this.mode) return;

            const previousIndex = this.activeIndex;
            const animate = previousIndex >= 0 && previousIndex !== activeIndex
                && this.displayMode === this.mode && this.mode !== 'stacked';
            this.section.classList.toggle('journey-animate', animate);
            this.section.dataset.direction = activeIndex >= previousIndex ? 'forward' : 'backward';
            this.activeIndex = activeIndex;
            this.displayMode = this.mode;
            this.counter.textContent = String(activeIndex + 1).padStart(2, '0');
            this.status.textContent =
                `${roleLabel} · ${activePanel.dataset.period}`;
            this.previous.disabled = activeIndex === 0;
            this.next.disabled = activeIndex === this.panels.length - 1;

            this.panels.forEach((panel, index) => {
                const active = index === activeIndex;
                const available = active || this.mode === 'stacked';
                panel.classList.toggle('is-active', active);
                panel.classList.toggle('is-leaving', animate && index === previousIndex);
                panel.inert = !available;
                panel.tabIndex = available ? 0 : -1;
                if (available) panel.removeAttribute('aria-hidden');
                else panel.setAttribute('aria-hidden', 'true');
            });
            this.bars.forEach(bar => {
                const active = Number(bar.dataset.roleIndex) === activeIndex;
                bar.classList.toggle('is-active', active);
                if (active) bar.setAttribute('aria-current', 'step');
                else bar.removeAttribute('aria-current');
            });
        }

        goTo(index, smooth = true) {
            index = clamp(index, 0, this.panels.length - 1);
            const behavior = smooth && !this.motion.matches ? 'smooth' : 'instant';
            if (this.mode === 'pinned') {
                this.cancelSnap();
                const start = this.section.getBoundingClientRect().top + window.scrollY - this.navHeight;
                const top = start + index * this.width;
                const origin = window.scrollY;
                if (behavior === 'instant' || Math.abs(top - origin) < 1) {
                    window.scrollTo({ top, behavior: 'instant' });
                    this.update();
                    return;
                }

                // Select the role immediately; glide its timeline marker to the target.
                this.snapIndex = index;
                this.update();
                const startedAt = performance.now();
                const step = timestamp => {
                    const fraction = clamp((timestamp - startedAt) / 600, 0, 1);
                    const eased = fraction * fraction * (3 - 2 * fraction);
                    window.scrollTo({ top: origin + (top - origin) * eased, behavior: 'instant' });
                    if (fraction === 1) {
                        this.snapFrame = null;
                        this.snapIndex = null;
                    } else {
                        this.snapFrame = requestAnimationFrame(step);
                    }
                    this.update();
                };
                this.snapFrame = requestAnimationFrame(step);
            } else if (this.mode === 'native') {
                this.nativeIndex = index;
                this.update();
            } else {
                const top = this.panels[index].getBoundingClientRect().top + window.scrollY - this.navHeight - 24;
                window.scrollTo({ top, behavior });
            }
        }
    }

    const initialize = () => {
        const section = document.querySelector('.work-journey');
        if (section) new WorkJourney(section);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
    else initialize();
})();
