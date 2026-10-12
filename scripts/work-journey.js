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
            this.previousScrollY = window.scrollY;
            this.mobileEngaged = false;
            this.mobileGuard = true;
            this.mobileExitDirection = 0;
            this.mobileEdgeReady = true;
            this.mobileExitPanel = null;
            this.mobileWheelPanel = null;
            this.mobileTransitionUntil = 0;
            this.touch = null;
            this.mobileStep = 0;

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

            window.addEventListener('scroll', () => {
                this.handleScroll();
                this.queueUpdate();
            }, { passive: true });
            window.addEventListener('resize', this.queueMeasure, { passive: true });
            window.addEventListener('load', this.queueMeasure, { once: true });
            window.visualViewport?.addEventListener('resize', this.queueMeasure, { passive: true });
            this.motion.addEventListener('change', this.queueMeasure);
            this.previous.addEventListener('click', () => this.goTo(this.activeIndex - 1));
            this.next.addEventListener('click', () => this.goTo(this.activeIndex + 1));
            this.controls.forEach(control => {
                control.addEventListener('click', () => this.goTo(Number(control.dataset.roleIndex)));
            });
            section.addEventListener('wheel', event => {
                if (this.mode !== 'mobile') this.handleWheel(event);
            }, { passive: false });
            window.addEventListener('wheel', event => {
                if (this.mode === 'mobile') this.handleWheel(event);
            }, { passive: false });
            window.addEventListener('keydown', event => this.handleKeydown(event));
            document.addEventListener('click', event => this.handleNavigationClick(event), true);
            window.addEventListener('hashchange', () => this.releaseForExternalNavigation());
            window.addEventListener('popstate', () => this.releaseForExternalNavigation());

            window.addEventListener('touchstart', event => this.handleTouchStart(event), {
                passive: true,
                capture: true
            });
            window.addEventListener('touchmove', event => this.handleTouchMove(event), {
                passive: false,
                capture: true
            });
            window.addEventListener('touchend', event => this.handleTouchEnd(event), {
                passive: true,
                capture: true
            });
            window.addEventListener('touchcancel', event => this.handleTouchEnd(event), {
                passive: true,
                capture: true
            });

            // A swipe selects a complete chapter, so adjacent jobs cannot mingle.
            this.viewport.addEventListener('pointerdown', event => {
                if (event.pointerType === 'mouse' || this.mode === 'stacked') return;
                if (this.mode === 'mobile' && (!event.isPrimary || this.touch?.multi || window.visualViewport?.scale > 1.01)) {
                    this.pointer = null;
                    return;
                }
                this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
            }, { passive: true });
            this.viewport.addEventListener('pointerup', event => {
                const start = this.pointer;
                this.pointer = null;
                if (!start || start.id !== event.pointerId) return;
                if (this.mode === 'mobile' && (this.touch?.handled || this.touch?.multi || window.visualViewport?.scale > 1.01)) return;
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
            this.releaseForExternalNavigation();
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
            // Zooming a phone must remain a browser gesture, not a chapter resize.
            if (this.mode === 'mobile' && (window.visualViewport?.scale > 1.01 || this.touch?.multi)) return;
            const oldMode = this.mode;
            const pendingIndex = this.snapIndex;
            const wasMobileEngaged = oldMode === 'mobile' && this.isMobileEngaged();
            this.cancelSnap();
            const navHeight = this.navbar?.getBoundingClientRect().height || 70;
            const availableHeight = window.innerHeight - navHeight;
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            // Phones get a pinned, one-chapter-at-a-time stage even with reduced motion.
            this.mode = !isMobile && this.motion.matches ? 'stacked'
                : isMobile ? 'mobile' : availableHeight < 640 ? 'native' : 'pinned';
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
            this.mobileStep = Math.max(1, availableHeight);
            this.distance = this.mode === 'mobile' ? this.mobileStep * (this.panels.length - 1)
                : this.width * (this.panels.length - 1);
            this.scrollRange = this.distance;

            if (this.mode === 'pinned' || this.mode === 'mobile') {
                this.section.style.height = `${availableHeight + this.scrollRange}px`;
            } else {
                this.section.style.removeProperty('height');
                if (this.mode === 'native' && oldMode !== 'native') {
                    this.nativeIndex = Math.max(0, this.activeIndex);
                }
            }
            if (this.mode === 'mobile' && oldMode !== 'mobile' && this.activeIndex >= 0) {
                this.nativeIndex = clamp(this.activeIndex, 0, this.panels.length - 1);
            }
            this.update();
            if (this.mode === 'mobile' && this.isMobileEngaged()) this.mobileEngaged = true;
            if (this.mode === 'mobile' && wasMobileEngaged) {
                this.mobileEngaged = true;
                this.anchorMobileIndex(false);
            }
            if (pendingIndex !== null) this.goTo(pendingIndex, false);
        }

        handleWheel(event) {
            if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
            if (!event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

            if (this.mode === 'mobile') {
                this.handleMobileWheel(event);
                return;
            }
            if (this.mode !== 'pinned') return;

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

        getMobileBounds() {
            const top = this.section.getBoundingClientRect().top + window.scrollY;
            const start = top - this.navHeight;
            return { start, end: start + this.scrollRange };
        }

        isMobileEngaged() {
            if (this.mode !== 'mobile') return false;
            const bounds = this.getMobileBounds();
            const y = window.scrollY;
            return y >= bounds.start - 2 && y <= bounds.end + 2;
        }

        mobileCheckpoint(index = this.nativeIndex) {
            const bounds = this.getMobileBounds();
            return bounds.start + clamp(index, 0, this.panels.length - 1) * this.mobileStep;
        }

        getPanelFromTarget(target) {
            const element = target instanceof Element ? target : null;
            const panel = element?.closest('.journey-panel');
            if (!panel || !this.section.contains(panel)) return null;
            return panel;
        }

        panelCanScroll(panel, direction) {
            if (!panel || panel.scrollHeight <= panel.clientHeight + 1) return false;
            return direction > 0
                ? panel.scrollTop < panel.scrollHeight - panel.clientHeight - 1
                : panel.scrollTop > 1;
        }

        panelForIndex(index = this.nativeIndex) {
            return this.panels[clamp(index, 0, this.panels.length - 1)];
        }

        resetMobilePanel(index) {
            const panel = this.panelForIndex(index);
            if (panel) panel.scrollTop = 0;
        }

        setMobileIndex(index, reset = true) {
            const next = clamp(index, 0, this.panels.length - 1);
            const changed = next !== this.nativeIndex;
            if (changed && reset) this.resetMobilePanel(next);
            this.nativeIndex = next;
            if (next === 0 || next === this.panels.length - 1) this.mobileEdgeReady = true;
            this.update();
            return changed;
        }

        anchorMobileIndex() {
            if (this.mode !== 'mobile') return;
            const top = this.mobileCheckpoint();
            this.previousScrollY = top;
            window.scrollTo({ top, behavior: 'instant' });
        }

        handleMobileWheel(event) {
            if (window.visualViewport?.scale > 1.01) return;
            this.mobileGuard = true;
            const bounds = this.getMobileBounds();
            const y = window.scrollY;
            if (y < bounds.start - 2 || y > bounds.end + 2) return;

            this.mobileEngaged = true;
            const direction = Math.sign(event.deltaY);
            const now = performance.now();
            const panel = this.getPanelFromTarget(event.target);
            const activePanel = this.panelForIndex();

            // A wheel burst that is reading a long chapter stays in that chapter.
            if (now < this.wheelUntil || now < this.mobileTransitionUntil) {
                this.wheelUntil = now + 260;
                if (this.mobileWheelPanel === activePanel && panel === activePanel && this.panelCanScroll(panel, direction)) return;
                event.preventDefault();
                return;
            }
            this.mobileWheelPanel = null;
            if (panel === activePanel && this.panelCanScroll(panel, direction)) {
                this.wheelUntil = now + 260;
                this.mobileWheelPanel = panel;
                return;
            }

            const next = this.nativeIndex + direction;
            if (next < 0 || next >= this.panels.length) {
                // Keep the terminal chapter visible through the current burst. A
                // later wheel event may leave the section normally.
                if (this.mobileEdgeReady) {
                    this.mobileExitDirection = direction;
                    this.mobileEngaged = false;
                    this.mobileGuard = false;
                    const current = this.panelForIndex();
                    if (current) {
                        current.style.overscrollBehaviorY = 'auto';
                        this.mobileExitPanel = current;
                    }
                    return;
                }
                event.preventDefault();
                this.wheelUntil = now + 260;
                this.mobileEdgeReady = true;
                return;
            }

            event.preventDefault();
            this.wheelUntil = now + 260;
            this.mobileEdgeReady = next === 0 || next === this.panels.length - 1;
            this.goTo(next);
        }

        handleKeydown(event) {
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            const target = event.target instanceof Element ? event.target : null;
            if (target?.closest('input, textarea, select, [contenteditable]')) return;

            const vertical = {
                ArrowDown: 1,
                PageDown: 1,
                ArrowUp: -1,
                PageUp: -1,
                ' ': event.shiftKey ? -1 : 1
            };
            if (this.mode === 'mobile' && vertical[event.key]) {
                this.mobileGuard = true;
                if (!this.mobileEngaged && !this.isMobileEngaged()) return;
                this.mobileEngaged = true;
                const direction = vertical[event.key];
                const panel = this.getPanelFromTarget(target);
                if (panel === this.panelForIndex() && this.panelCanScroll(panel, direction)) return;
                if (event.repeat) {
                    event.preventDefault();
                    return;
                }
                if (performance.now() < this.mobileTransitionUntil) {
                    event.preventDefault();
                    return;
                }
                const next = this.nativeIndex + direction;
                if (next < 0 || next >= this.panels.length) {
                    event.preventDefault();
                    this.mobileExitDirection = direction;
                    this.mobileEngaged = false;
                    this.mobileGuard = false;
                    const distance = event.key.startsWith('Arrow') ? 40 : this.mobileStep * 0.85;
                    window.scrollBy({ top: direction * distance, behavior: this.motion.matches ? 'instant' : 'smooth' });
                    return;
                }
                event.preventDefault();
                this.goTo(next);
                if (panel) {
                    window.setTimeout(() => {
                        if (this.mode === 'mobile' && this.nativeIndex === next) this.panelForIndex().focus({ preventScroll: true });
                    }, this.motion.matches ? 0 : 200);
                }
                return;
            }
            if (event.repeat) return;

            if (!this.section.contains(target) || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const index = event.key === 'Home' ? 0
                : event.key === 'End' ? this.panels.length - 1
                : this.activeIndex + (event.key === 'ArrowRight' ? 1 : -1);
            this.goTo(index);
        }

        handleNavigationClick(event) {
            const target = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
            if (!target) return;
            const hash = target.getAttribute('href');
            const destination = hash ? document.getElementById(hash.slice(1)) : null;
            if (!destination || this.section.contains(destination)) return;
            // Navbar/in-page links are allowed to move directly to their target.
            this.mobileGuard = false;
            this.mobileEngaged = false;
            this.mobileExitDirection = 0;
        }

        releaseForExternalNavigation() {
            const hash = window.location.hash;
            const destination = hash ? document.getElementById(hash.slice(1)) : null;
            if (!destination || this.section.contains(destination)) return;
            this.mobileGuard = false;
            this.mobileEngaged = false;
            this.mobileExitDirection = 0;
        }

        correctMobileScroll(top, index) {
            const changed = this.setMobileIndex(index);
            if (changed) this.mobileTransitionUntil = performance.now() + (this.motion.matches ? 0 : 440);
            this.wheelUntil = performance.now() + 260;
            this.mobileEngaged = true;
            this.mobileExitDirection = 0;
            this.previousScrollY = top;
            if (this.touch) this.touch.handled = true;
            window.scrollTo({ top, behavior: 'instant' });
        }

        handleScroll() {
            const y = window.scrollY;
            const previous = this.previousScrollY;
            this.previousScrollY = y;
            if (this.mode !== 'mobile') return;

            const bounds = this.getMobileBounds();
            if (this.mobileExitPanel && (y < bounds.start - 2 || y > bounds.end + 2)) {
                this.mobileExitPanel.style.overscrollBehaviorY = '';
                this.mobileExitPanel = null;
            }
            if (!this.mobileGuard) {
                if (y >= bounds.start - 2 && y <= bounds.end + 2) this.mobileEngaged = true;
                return;
            }

            // Once a terminal gesture has been released, let the surrounding page
            // scroll until it re-enters the journey from the opposite side.
            if (this.mobileExitDirection) {
                const leaving = this.mobileExitDirection > 0 ? y > bounds.end + 2 : y < bounds.start - 2;
                if (leaving) {
                    this.mobileEngaged = false;
                    return;
                }
                this.mobileExitDirection = 0;
                this.mobileEngaged = true;
            }

            const enteredFromAbove = previous < bounds.start - 2 && y > bounds.end + 2;
            const enteredFromBelow = previous > bounds.end + 2 && y < bounds.start - 2;
            if (enteredFromAbove || (previous < bounds.start - 2 && y >= bounds.start)) {
                this.correctMobileScroll(bounds.start, 0);
                return;
            }
            if (enteredFromBelow || (previous > bounds.end + 2 && y <= bounds.end)) {
                this.correctMobileScroll(bounds.end, this.panels.length - 1);
                return;
            }

            const edgeCanRelease = !this.touch?.handled
                && performance.now() >= this.mobileTransitionUntil && performance.now() >= this.wheelUntil;
            if (y < bounds.start - 2) {
                // A reverse terminal gesture is allowed to leave above the stage.
                if (this.nativeIndex === 0 && this.mobileEdgeReady && edgeCanRelease) {
                    this.mobileExitDirection = -1;
                    this.mobileEngaged = false;
                    return;
                }
                this.correctMobileScroll(this.mobileCheckpoint(), this.nativeIndex);
                return;
            }
            if (y > bounds.end + 2) {
                if (this.nativeIndex === this.panels.length - 1 && this.mobileEdgeReady && edgeCanRelease) {
                    this.mobileExitDirection = 1;
                    this.mobileEngaged = false;
                    return;
                }
                this.correctMobileScroll(this.mobileCheckpoint(), this.nativeIndex);
                return;
            }

            // The stage has one legal page position for each chapter. A small
            // tolerance avoids fighting the browser before a touch is deliberate.
            const checkpoint = this.mobileCheckpoint();
            if (Math.abs(y - checkpoint) > 26) this.correctMobileScroll(checkpoint, this.nativeIndex);
        }

        handleTouchStart(event) {
            if (this.mode !== 'mobile') return;
            const first = event.touches[0];
            if (!first) return;
            this.mobileGuard = true;
            if (event.touches.length > 1 || window.visualViewport?.scale > 1.01) {
                this.mobileGuard = false;
                this.touch = { multi: true };
                return;
            }
            const bounds = this.getMobileBounds();
            const y = window.scrollY;
            this.mobileEngaged = y >= bounds.start - 2 && y <= bounds.end + 2;
            const panel = this.getPanelFromTarget(event.target);
            this.touch = {
                id: first.identifier,
                x: first.clientX,
                y: first.clientY,
                panel,
                panelScrollTop: panel?.scrollTop || 0,
                panelScrollMax: panel ? Math.max(0, panel.scrollHeight - panel.clientHeight) : 0,
                reading: false,
                handled: false,
                multi: false,
                overscrollPanel: null
            };
        }

        handleTouchMove(event) {
            const touch = this.touch;
            if (!touch || this.mode !== 'mobile') return;
            if (event.touches.length > 1) {
                touch.multi = true;
                this.mobileGuard = false;
                return;
            }
            if (touch.multi) return;
            const current = [...event.touches].find(item => item.identifier === touch.id) || event.touches[0];
            if (!current) return;
            const dx = current.clientX - touch.x;
            const dy = current.clientY - touch.y;
            if (Math.abs(dx) >= Math.abs(dy) * 1.15) return;
            if (!this.mobileEngaged) return;

            // Once a chapter or terminal boundary has consumed a gesture, consume
            // the rest of its movement so momentum cannot skip another chapter.
            if (touch.handled && !touch.exiting) {
                event.preventDefault();
                return;
            }
            if (touch.exiting) return;
            if (Math.abs(dy) < 6) return;
            if (performance.now() < this.mobileTransitionUntil) {
                event.preventDefault();
                touch.handled = true;
                return;
            }
            const direction = dy < 0 ? 1 : -1;
            const panel = touch.panel === this.panelForIndex() ? touch.panel : null;

            if (touch.reading) {
                if (!this.panelCanScroll(panel, direction)) event.preventDefault();
                return;
            }
            const startedWithRoom = direction > 0
                ? touch.panelScrollTop < touch.panelScrollMax - 1 : touch.panelScrollTop > 1;
            if (panel && startedWithRoom) {
                // Let the active panel read for this entire gesture. At its edge,
                // overscroll is contained and the next gesture changes chapter.
                touch.reading = true;
                return;
            }

            const next = this.nativeIndex + direction;
            if (next < 0 || next >= this.panels.length) {
                if (this.mobileEdgeReady) {
                    this.mobileExitDirection = direction;
                    this.mobileEngaged = false;
                    this.mobileGuard = false;
                    touch.handled = true;
                    touch.exiting = true;
                    if (panel) {
                        panel.style.overscrollBehaviorY = 'auto';
                        touch.overscrollPanel = panel;
                    }
                    return;
                }
                event.preventDefault();
                touch.handled = true;
                this.mobileEdgeReady = true;
                return;
            }

            event.preventDefault();
            if (Math.abs(dy) < 36) return;
            touch.handled = true;
            this.goTo(next);
        }

        handleTouchEnd() {
            const touch = this.touch;
            this.touch = null;
            if (!touch?.overscrollPanel) return;
            if (!touch.exiting) {
                touch.overscrollPanel.style.overscrollBehaviorY = '';
                return;
            }
            // Keep chaining enabled while the browser's native fling is still
            // running; restoring contain immediately can trap it at the stage.
            this.mobileExitPanel = touch.overscrollPanel;
            window.setTimeout(() => {
                if (this.mobileExitPanel !== touch.overscrollPanel) return;
                touch.overscrollPanel.style.overscrollBehaviorY = '';
                this.mobileExitPanel = null;
            }, 900);
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
            } else if (this.mode === 'mobile') {
                chapter = this.nativeIndex;
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
            } else if (this.mode === 'mobile') {
                this.mobileGuard = true;
                if (this.setMobileIndex(index)) {
                    this.mobileTransitionUntil = performance.now() + (this.motion.matches ? 0 : 440);
                }
                if (this.mobileEngaged || this.isMobileEngaged()) this.anchorMobileIndex(smooth);
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
