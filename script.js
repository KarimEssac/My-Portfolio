const projectsData = {};
const testimonialsData = {};
let allProjects = [];
let allTestimonials = [];
let activeTestimonialIndex = 0;
let testimonialViewerTrigger = null;
let activeWorksFilter = 'platforms';
let activeSpotlightProjectId = null;

const worksFilters = [
    { id: 'platforms', label: 'Platforms', accent: '#4867b1' },
    { id: 'commerce', label: 'Commerce', accent: '#b65f43' },
    { id: 'management', label: 'Systems', accent: '#7b5bb8' },
    { id: 'finance', label: 'Finance', accent: '#3d7d99' },
    { id: 'extensions', label: 'Extensions', accent: '#e6a15c' },
    { id: 'pos', label: 'POS', accent: '#dc2626' }
];

const projectPresentations = {
    1: { detail: 'assets/fantazina/3.webp', device: 'mobile', ratio: '481 / 839' },
    2: { detail: 'assets/skorka/3.webp', device: 'mobile', ratio: '374 / 846' },
    3: { detail: 'assets/lens-and-light/4.webp', device: 'mobile', ratio: '408 / 847' },
    7: { hero: 'assets/sweden/2.webp', detail: 'assets/sweden/1.webp', device: 'extension', ratio: '256 / 567' },
    8: { hero: 'assets/mostaql-filterer/3.webp', detail: 'assets/mostaql-filterer/1.webp', device: 'extension', ratio: '392 / 599' }
};

async function loadProjects() {
    try {
        const response = await fetch('projects.json?v=' + Date.now());
        const data = await response.json();
        
        data.projects.forEach(project => {
            projectsData[project.id] = project;
        });
        
        renderProjects(data.projects);
        
        return data.projects;
    } catch (error) {
        console.error('Error loading projects:', error);
        return [];
    }
}

async function loadTestimonials() {
    try {
        const response = await fetch('testimonials.json?v=' + Date.now());
        const data = await response.json();

        data.testimonials.forEach(testimonial => {
            testimonialsData[testimonial.id] = testimonial;
        });

        renderTestimonials(data.testimonials);

        return data.testimonials;
    } catch (error) {
        console.error('Error loading testimonials:', error);
        return [];
    }
}

function renderProjects(projects) {
    allProjects = [...projects].sort((a, b) => a.order - b.order);
    const availableFilters = new Set(allProjects.map(project => getProjectMeta(project).filter));

    if (!availableFilters.has(activeWorksFilter)) {
        activeWorksFilter = worksFilters.find(filter => availableFilters.has(filter.id))?.id || worksFilters[0].id;
    }

    const overview = document.getElementById('worksOverview');
    if (overview) {
        overview.textContent = `${String(allProjects.length).padStart(2, '0')} projects / ${availableFilters.size} categories`;
    }

    const firstVisibleProject = getVisibleProjects()[0];
    activeSpotlightProjectId = firstVisibleProject?.id ?? null;
    renderWorksFilters();
    renderProjectIndex();

    if (firstVisibleProject) {
        updateWorksSpotlight(firstVisibleProject.id);
    }
}

function getProjectMeta(project) {
    return {
        category: project.category || 'Web Application',
        filter: project.filter || 'platforms',
        focus: project.focus || 'Interface, backend, database',
        result: project.result || project.shortDescription,
        accent: project.accent || '#212F43'
    };
}

function getVisibleProjects() {
    return allProjects.filter(project => getProjectMeta(project).filter === activeWorksFilter);
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function getProjectLink(project) {
    const link = (project.link || '').trim();
    return link && link !== '#' ? link : '';
}

function getProjectImages(project) {
    const presentation = projectPresentations[project.id] || {};
    const localGallery = { 2: 'assets/skorka', 4: 'assets/scout' }[project.id];
    const images = (project.images || []).map(image => {
        const filename = image.match(/\/([1-7]\.webp)(?:[?#].*)?$/)?.[1];
        return localGallery && filename ? `${localGallery}/${filename}` : image;
    });
    return [presentation.hero, project.thumbnail, ...images]
        .filter(Boolean)
        .filter((image, index, gallery) => gallery.indexOf(image) === index);
}

function getTestimonialAccent(platform) {
    return { mostaql: '#2563eb', upwork: '#2f7d68' }[String(platform || '').toLowerCase()] || '#4867b1';
}

function getClientInitials(name) {
    return String(name || 'Client').trim().split(/\s+/).slice(0, 2)
        .map(part => part[0]).join('').toUpperCase();
}

function renderRatingMeter(rating) {
    const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
    return Array.from({ length: 5 }, (_, index) => `
        <svg class="testimonial-star ${index < safeRating ? 'is-filled' : ''}" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 14.78 8.63 21 9.53 16.5 13.92 17.56 20.11 12 17.19 6.44 20.11 7.5 13.92 3 9.53 9.22 8.63Z" />
        </svg>
    `).join('');
}

function renderTestimonials(testimonials) {
    allTestimonials = [...testimonials].sort((a, b) => a.order - b.order);
    activeTestimonialIndex = 0;
    const spotlight = document.getElementById('testimonialSpotlight');
    const clients = document.getElementById('testimonialClients');
    if (!spotlight || !clients) return;

    const count = document.getElementById('testimonialTotalCount');
    const average = document.getElementById('testimonialAverageRating');
    const stars = document.getElementById('testimonialOverallStars');
    const averageValue = allTestimonials.length
        ? allTestimonials.reduce((sum, review) => sum + Number(review.rating || 0), 0) / allTestimonials.length : 0;
    if (count) count.textContent = String(allTestimonials.length).padStart(2, '0');
    if (average) average.textContent = allTestimonials.length ? averageValue.toFixed(1) : '—';
    if (stars) stars.innerHTML = renderRatingMeter(averageValue);

    clients.style.setProperty('--review-columns', Math.min(Math.max(allTestimonials.length, 1), 2));
    clients.innerHTML = allTestimonials.map((review, index) => `
        <button type="button" class="testimonial-client-tab ${index === 0 ? 'is-active' : ''}"
            id="review-tab-${review.id}" data-review-index="${index}"
            style="--testimonial-accent: ${getTestimonialAccent(review.platform)}"
            role="tab" aria-selected="${index === 0}" aria-controls="testimonialSpotlight"
            tabindex="${index === 0 ? 0 : -1}">
            <span class="testimonial-client-index">${String(index + 1).padStart(2, '0')}</span>
            <span class="testimonial-client-tab-copy">
                <strong>${escapeHTML(review.clientName)}</strong>
                <span>${escapeHTML(review.category)}</span>
            </span>
            <span class="testimonial-client-tab-arrow">${projectArrowIcon()}</span>
        </button>
    `).join('');

    const tabs = [...clients.querySelectorAll('[data-review-index]')];
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => selectTestimonial(index));
        tab.addEventListener('keydown', event => {
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const nextIndex = event.key === 'Home' ? 0
                : event.key === 'End' ? tabs.length - 1
                : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + tabs.length) % tabs.length;
            selectTestimonial(nextIndex);
            tabs[nextIndex].focus();
        });
    });

    document.querySelector('[data-review-previous]').onclick = () => selectTestimonial(activeTestimonialIndex - 1);
    document.querySelector('[data-review-next]').onclick = () => selectTestimonial(activeTestimonialIndex + 1);

    let swipeStart = null;
    spotlight.onpointerdown = event => {
        if (event.pointerType !== 'mouse' && event.isPrimary) {
            swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
        }
    };
    spotlight.onpointerup = event => {
        const start = swipeStart;
        swipeStart = null;
        if (!start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) {
            selectTestimonial(activeTestimonialIndex + (dx < 0 ? 1 : -1));
        }
    };
    spotlight.onpointercancel = () => { swipeStart = null; };
    selectTestimonial(0);
}

function selectTestimonial(index) {
    if (!allTestimonials.length) return;
    index = Math.max(0, Math.min(allTestimonials.length - 1, index));
    const spotlight = document.getElementById('testimonialSpotlight');
    const review = allTestimonials[index];
    if (!spotlight || spotlight.dataset.review === String(review.id)) return;

    activeTestimonialIndex = index;
    const accent = getTestimonialAccent(review.platform);
    const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
    spotlight.dataset.review = review.id;
    spotlight.style.setProperty('--testimonial-accent', accent);
    spotlight.setAttribute('aria-labelledby', `review-tab-${review.id}`);
    document.getElementById('testimonials').style.setProperty('--testimonial-accent', accent);
    spotlight.innerHTML = `
        <div class="testimonial-quote-panel testimonial-reveal">
            <div class="testimonial-topline">
                <span class="testimonial-platform"><i class="testimonial-platform-dot" aria-hidden="true"></i>${escapeHTML(review.platform)}</span>
                <div class="testimonial-rating" role="img" aria-label="${rating} out of 5 stars">
                    ${renderRatingMeter(rating)}
                    <strong>${rating.toFixed(1)}<span> / 5</span></strong>
                </div>
            </div>
            <span class="testimonial-quote-mark" aria-hidden="true">“</span>
            <blockquote class="testimonial-quote"><p dir="auto">${escapeHTML(review.quote)}</p></blockquote>
            <div class="testimonial-author">
                <span class="testimonial-avatar" aria-hidden="true">${escapeHTML(getClientInitials(review.clientName))}</span>
                <div>
                    <strong class="testimonial-client-name">${escapeHTML(review.clientName)}</strong>
                    <span class="testimonial-client-role">Client on ${escapeHTML(review.platform)}</span>
                </div>
            </div>
            <p class="testimonial-summary">${escapeHTML(review.summary)}</p>
        </div>
        <div class="testimonial-project-panel testimonial-reveal">
            <div class="testimonial-context">
                <span class="testimonial-label">The project</span>
                <h3 id="testimonialProjectTitle" dir="auto">${escapeHTML(review.projectTitle)}</h3>
                <dl class="testimonial-facts">
                    <div><dt>Category</dt><dd>${escapeHTML(review.category)}</dd></div>
                    <div><dt>Timeline</dt><dd>${escapeHTML(review.completedIn)}</dd></div>
                </dl>
            </div>
            <button type="button" class="testimonial-source" aria-label="Read the original ${escapeHTML(review.platform)} review from ${escapeHTML(review.clientName)}">
                <span class="testimonial-source-top">
                    <span class="testimonial-source-platform">From ${escapeHTML(review.platform)}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /></svg>
                </span>
                <span class="testimonial-source-image">
                    <img src="${escapeHTML(review.image)}" alt="Original ${escapeHTML(review.platform)} feedback from ${escapeHTML(review.clientName)}"
                        width="${review.id === 2 ? 892 : 899}" height="${review.id === 2 ? 502 : 504}" loading="lazy" decoding="async" />
                </span>
                <span class="testimonial-source-bottom"><span>Read original feedback</span>${projectArrowIcon()}</span>
            </button>
        </div>
    `;

    document.querySelectorAll('#testimonialClients [data-review-index]').forEach(tab => {
        const active = Number(tab.dataset.reviewIndex) === index;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
    });
    document.querySelector('[data-review-current]').textContent = String(index + 1).padStart(2, '0');
    document.querySelector('[data-review-total]').textContent = String(allTestimonials.length).padStart(2, '0');
    document.querySelector('[data-review-previous]').disabled = index === 0;
    document.querySelector('[data-review-next]').disabled = index === allTestimonials.length - 1;
    document.getElementById('testimonialStatus').textContent =
        `Review ${index + 1} of ${allTestimonials.length}. ${review.clientName}, ${review.platform}, ${rating} out of 5 stars.`;
    spotlight.querySelector('.testimonial-source').addEventListener('click', () => openTestimonialViewer(review.id));
}

function projectArrowIcon(direction = 'diagonal') {
    const path = direction === 'left' ? 'M15 6 9 12l6 6'
        : direction === 'right' ? 'm9 6 6 6-6 6'
        : 'M6 18 18 6M6 6h12v12';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"/></svg>';
}

function renderWorksFilters() {
    const filtersContainer = document.getElementById('worksFilters');
    if (!filtersContainer) return;

    filtersContainer.innerHTML = worksFilters.map(filter => {
        const count = allProjects.filter(project => getProjectMeta(project).filter === filter.id).length;
        if (!count) return '';
        return `
            <button
                type="button"
                class="works-filter ${filter.id === activeWorksFilter ? 'active' : ''}"
                style="--filter-accent: ${escapeHTML(filter.accent)}"
                data-filter="${filter.id}"
                aria-pressed="${filter.id === activeWorksFilter}"
                aria-controls="workSpotlight projectIndex"
                aria-label="${escapeHTML(filter.label)}, ${count} ${count === 1 ? 'project' : 'projects'}"
            >
                <span class="works-filter-dot" aria-hidden="true"></span>
                ${escapeHTML(filter.label)}
                <span class="works-filter-count" aria-hidden="true">${String(count).padStart(2, '0')}</span>
            </button>
        `;
    }).join('');

    filtersContainer.querySelectorAll('.works-filter').forEach(button => {
        button.addEventListener('click', () => {
            if (activeWorksFilter === button.dataset.filter) return;
            activeWorksFilter = button.dataset.filter;
            const firstProject = getVisibleProjects()[0];
            activeSpotlightProjectId = firstProject?.id ?? null;

            // Keep the category button in place so keyboard focus is retained.
            filtersContainer.querySelectorAll('.works-filter').forEach(filterButton => {
                const active = filterButton.dataset.filter === activeWorksFilter;
                filterButton.classList.toggle('active', active);
                filterButton.setAttribute('aria-pressed', String(active));
            });
            renderProjectIndex();
            if (firstProject) updateWorksSpotlight(firstProject.id);
        });
    });
}

function renderProjectIndex() {
    const indexContainer = document.getElementById('projectIndex');
    if (!indexContainer) return;

    const visibleProjects = getVisibleProjects();
    const label = worksFilters.find(filter => filter.id === activeWorksFilter)?.label || 'Projects';
    const countLabel = `${String(visibleProjects.length).padStart(2, '0')} ${visibleProjects.length === 1 ? 'project' : 'projects'}`;
    const counter = document.getElementById('worksCounter');
    const collectionCount = document.getElementById('projectCollectionCount');
    if (counter) counter.textContent = `${label} / ${countLabel}`;
    if (collectionCount) collectionCount.textContent = countLabel;
    indexContainer.style.setProperty('--project-columns', Math.min(visibleProjects.length, 3));

    indexContainer.innerHTML = visibleProjects.map(project => {
        const meta = getProjectMeta(project);
        const active = activeSpotlightProjectId === project.id;
        return `
            <button
                type="button"
                class="project-index-item ${active ? 'is-active' : ''}"
                id="project-tab-${project.id}"
                style="--project-accent: ${escapeHTML(meta.accent)}"
                data-project="${project.id}"
                role="tab"
                aria-selected="${active}"
                aria-controls="workSpotlight"
                tabindex="${active ? 0 : -1}"
            >
                <span class="project-index-number">${String(getProjectPosition(project.id)).padStart(2, '0')}</span>
                <span class="project-index-copy">
                    <strong>${escapeHTML(project.name)}</strong>
                    <span>${escapeHTML(project.shortDescription)}</span>
                </span>
                <span class="project-index-arrow">${projectArrowIcon()}</span>
            </button>
        `;
    }).join('');

    const tabs = [...indexContainer.querySelectorAll('.project-index-item')];
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => updateWorksSpotlight(Number(tab.dataset.project)));
        tab.addEventListener('keydown', event => {
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const nextIndex = event.key === 'Home' ? 0
                : event.key === 'End' ? tabs.length - 1
                : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + tabs.length) % tabs.length;
            const nextTab = tabs[nextIndex];
            updateWorksSpotlight(Number(nextTab.dataset.project));
            nextTab.focus();
        });
    });
}

function updateWorksSpotlight(projectId) {
    const spotlight = document.getElementById('workSpotlight');
    const project = projectsData[projectId];
    if (!spotlight || !project || spotlight.dataset.project === String(projectId)) return;

    const meta = getProjectMeta(project);
    const presentation = projectPresentations[project.id] || {};
    const projectLink = getProjectLink(project);
    const galleryImages = getProjectImages(project);
    const position = String(getProjectPosition(projectId)).padStart(2, '0');
    const total = String(allProjects.length).padStart(2, '0');

    activeSpotlightProjectId = projectId;
    spotlight.dataset.project = projectId;
    spotlight.dataset.previewIndex = '0';
    spotlight.setAttribute('aria-labelledby', `project-tab-${projectId}`);
    spotlight.style.setProperty('--project-accent', meta.accent);
    const section = document.getElementById('projects');
    section.style.setProperty('--project-accent', meta.accent);
    section.dataset.category = meta.filter;

    spotlight.innerHTML = `
        <span class="project-watermark" aria-hidden="true">${position}</span>
        <div class="project-story project-reveal">
            <div class="project-kicker">
                <span class="project-category"><i class="project-color-dot" aria-hidden="true"></i>${escapeHTML(meta.category)}</span>
                <span class="project-position">${position} / ${total}</span>
            </div>
            <h3 id="spotlightTitle">${escapeHTML(project.name)}</h3>
            <p class="project-subtitle">${escapeHTML(project.shortDescription)}</p>
            <p class="project-summary">${escapeHTML(meta.result)}</p>
            <div class="project-focus">
                <span class="project-detail-label">Focus</span>
                <p>${escapeHTML(meta.focus)}</p>
            </div>
            <div class="project-stack">
                <span class="project-detail-label">Built with</span>
                <div class="project-tech">
                    ${(project.techStack || []).map(tech => `<span class="project-tech-item">${escapeHTML(tech)}</span>`).join('')}
                </div>
            </div>
            <div class="project-actions">
                <button type="button" class="project-case-study">Explore project ${projectArrowIcon()}</button>
                ${projectLink ? `<a class="project-external" href="${escapeHTML(projectLink)}" target="_blank" rel="noopener noreferrer">${projectLink.includes('github.com') ? 'View repository' : 'Visit website'} ${projectArrowIcon()}</a>` : ''}
            </div>
        </div>
        <div class="project-visual project-reveal" ${presentation.detail ? 'data-has-detail="true"' : ''}>
            <div class="project-orbit" aria-hidden="true"></div>
            <span class="project-visual-cross project-visual-cross--one" aria-hidden="true"></span>
            <span class="project-visual-cross project-visual-cross--two" aria-hidden="true"></span>
            <button type="button" class="project-preview" aria-label="Open ${escapeHTML(project.name)} screenshot gallery">
                <span class="project-browser">
                    <span class="project-browser-bar">
                        <span class="project-browser-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                        <span class="project-browser-label">${escapeHTML(project.name)}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>
                    </span>
                    <span class="project-browser-screen">
                        <img class="project-preview-image" data-project-preview-main src="${escapeHTML(galleryImages[0])}" alt="${escapeHTML(project.name)} — screenshot 1 of ${galleryImages.length}" loading="eager" decoding="async" />
                    </span>
                </span>
                <span class="project-preview-hint">View gallery ${projectArrowIcon()}</span>
            </button>
            ${presentation.detail ? `
                <span class="project-detail-preview" data-device="${presentation.device}" style="--device-ratio: ${presentation.ratio}" aria-hidden="true">
                    <img src="${escapeHTML(presentation.detail)}" alt="" loading="lazy" decoding="async" />
                    <span class="project-detail-caption">${presentation.device === 'extension' ? 'Extension' : 'Mobile view'}</span>
                </span>
            ` : ''}
            <div class="project-view-controls">
                <div class="project-view-caption"><span data-project-view-count aria-live="polite" aria-atomic="true">01 / ${String(galleryImages.length).padStart(2, '0')}</span><span>Screens</span></div>
                <div class="project-view-dots" role="group" aria-label="Choose a project screenshot">
                    ${galleryImages.map((image, index) => `<button type="button" class="project-view-dot ${index === 0 ? 'is-active' : ''}" data-image-index="${index}" aria-label="Show screenshot ${index + 1}" aria-pressed="${index === 0}"></button>`).join('')}
                </div>
                ${galleryImages.length > 1 ? `
                    <div class="project-view-arrows">
                        <button type="button" class="project-view-arrow" data-project-image-step="-1" aria-label="Previous screenshot">${projectArrowIcon('left')}</button>
                        <button type="button" class="project-view-arrow" data-project-image-step="1" aria-label="Next screenshot">${projectArrowIcon('right')}</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    document.querySelectorAll('#projectIndex .project-index-item').forEach(tab => {
        const active = Number(tab.dataset.project) === projectId;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
    });
    const status = document.getElementById('projectStatus');
    if (status) status.textContent = `${project.name}, ${meta.category}. ${galleryImages.length} screenshots available.`;

    const showScreenshot = index => {
        index = (index + galleryImages.length) % galleryImages.length;
        spotlight.dataset.previewIndex = index;
        const image = spotlight.querySelector('[data-project-preview-main]');
        image.src = galleryImages[index];
        image.alt = `${project.name} — screenshot ${index + 1} of ${galleryImages.length}`;
        spotlight.querySelector('[data-project-view-count]').textContent =
            `${String(index + 1).padStart(2, '0')} / ${String(galleryImages.length).padStart(2, '0')}`;
        spotlight.querySelectorAll('.project-view-dot').forEach(dot => {
            const active = Number(dot.dataset.imageIndex) === index;
            dot.classList.toggle('is-active', active);
            dot.setAttribute('aria-pressed', String(active));
        });
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            image.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' });
        }
    };

    spotlight.querySelectorAll('[data-image-index]').forEach(dot => {
        dot.addEventListener('click', () => showScreenshot(Number(dot.dataset.imageIndex)));
    });
    spotlight.querySelectorAll('[data-project-image-step]').forEach(button => {
        button.addEventListener('click', () => showScreenshot(
            Number(spotlight.dataset.previewIndex) + Number(button.dataset.projectImageStep)));
    });
    spotlight.querySelectorAll('.project-case-study, .project-preview').forEach(button => {
        button.addEventListener('click', () => openProjectModal(projectId, Number(spotlight.dataset.previewIndex)));
    });
}

window.addEventListener('load', () => {
    const loader = document.querySelector('.page-loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
            document.body.style.overflow = '';
        }, 500);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const loader = document.querySelector('.page-loader');
    if (loader && !loader.classList.contains('hidden')) {
        document.body.style.overflow = 'hidden';
    }
});

class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.body = document.body;
        this.themeIcon = this.themeToggle.querySelector('.theme-icon');
        
        const savedTheme = localStorage.getItem('preferredTheme');
        this.currentTheme = savedTheme ? savedTheme : 'light';
        this.applyTheme(this.currentTheme);
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('preferredTheme', this.currentTheme);
        this.applyTheme(this.currentTheme);
    }
    
    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.body.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            this.body.removeAttribute('data-theme');
        }
    }
}

class NavigationManager {
    constructor() {
        this.hamburger = document.getElementById('hamburger');
        this.navMenu = document.querySelector('.nav-menu');
        this.navLinks = document.querySelectorAll('.nav-link');
        
        this.bindEvents();
        this.handleScroll();
    }
    
    bindEvents() {
        this.hamburger.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
        
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });
        
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });
        
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 70;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
                
                this.updateActiveLink(link);
            });
        });
    }
    
    toggleMobileMenu() {
        this.hamburger.classList.toggle('active');
        this.navMenu.classList.toggle('active');
        
        if (this.navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
    
    closeMobileMenu() {
        this.hamburger.classList.remove('active');
        this.navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    handleScroll() {
        const navbar = document.querySelector('.navbar');
        
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(var(--primary-bg-rgb, 255, 255, 255), 0.95)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'var(--primary-bg)';
            navbar.style.boxShadow = 'none';
        }

        // Active section highlighting
        const sections = document.querySelectorAll('section[id]');
        const scrollY = window.scrollY + 120;
        let currentId = '';

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            if (scrollY >= top && scrollY < top + height) {
                currentId = section.getAttribute('id');
            }
        });

        if (currentId) {
            this.navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
            });
        }
    }
    
    updateActiveLink(clickedLink) {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
        });
        clickedLink.classList.add('active');
    }
}

class Utils {
    static initButtonActions() {
        const primaryButton = document.querySelector('.btn-primary');
        if (primaryButton) {
            primaryButton.addEventListener('click', () => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                    const offsetTop = contactSection.offsetTop - 70;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        }
    }
    
    static initFormSubmission() {
        const form = document.querySelector('.contact-form form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';
                const templateParams = {
                    from_name: form.querySelector('#name').value,
                    from_email: form.querySelector('#email').value,
                    message: form.querySelector('#message').value
                };
                emailjs.send('service_3y3flil', 'template_0wx3njk', templateParams)
                    .then(function(response) {
                        console.log('SUCCESS!', response.status, response.text);
                        alert('Message sent successfully! I\'ll get back to you soon.');
                        form.reset();
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }, function(error) {
                        console.log('FAILED...', error);
                        alert('Failed to send message. Please try again or contact me directly at karimessac@gmail.com');
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    });
            });
        }
    }
}

let currentProjectImages = [];
let currentSlideIndex = 0;

function getProjectPosition(projectId) {
    const index = allProjects.findIndex(project => project.id === projectId);
    return index >= 0 ? index + 1 : 1;
}

function updateModalImageCount() {
    const imageCount = document.getElementById('modalImageCount');
    if (!imageCount) return;

    const current = String(currentSlideIndex + 1).padStart(2, '0');
    const total = String(currentProjectImages.length || 1).padStart(2, '0');
    imageCount.textContent = `${current} / ${total}`;
}

function openProjectModal(projectId, imageIndex = 0) {
    const modal = document.getElementById('projectModal');
    const project = projectsData[projectId];
    
    if (!project) return;

    const meta = getProjectMeta(project);
    const projectPosition = getProjectPosition(projectId);
    const projectType = worksFilters.find(filter => filter.id === meta.filter)?.label || meta.category;
    const modalImages = getProjectImages(project);

    modal.style.setProperty('--project-accent', meta.accent);
    
    document.getElementById('modalProjectCategory').textContent = meta.category;
    document.getElementById('modalProjectPosition').textContent = `${String(projectPosition).padStart(2, '0')} / ${String(allProjects.length).padStart(2, '0')}`;
    document.getElementById('modalProjectName').textContent = project.name;
    document.getElementById('modalProjectResult').textContent = meta.result;
    document.getElementById('modalProjectFocus').textContent = meta.focus;
    document.getElementById('modalProjectType').textContent = projectType;
    document.getElementById('modalProjectScreens').textContent = `${modalImages.length} ${modalImages.length === 1 ? 'screen' : 'screens'}`;
    document.getElementById('modalProjectDescription').textContent = project.description;

    const modalProjectLink = document.getElementById('modalProjectLink');
    const modalProjectAvailability = document.getElementById('modalProjectAvailability');
    const projectLink = getProjectLink(project);
    modalProjectLink.href = projectLink || '#';
    modalProjectLink.style.display = projectLink ? 'inline-flex' : 'none';
    modalProjectLink.textContent = projectLink.includes('github.com') ? 'View Repository' : 'Visit Project';
    modalProjectAvailability.textContent = projectLink ? '' : 'Preview-only case study';
    modalProjectAvailability.style.display = projectLink ? 'none' : 'inline-flex';
    
    const techStackContainer = document.getElementById('modalTechStack');
    techStackContainer.innerHTML = '';
    project.techStack.forEach(tech => {
        const tag = document.createElement('span');
        tag.className = 'tech-tag';
        tag.textContent = tech;
        techStackContainer.appendChild(tag);
    });
    
    currentProjectImages = modalImages;
    currentSlideIndex = Math.max(0, Math.min(modalImages.length - 1, imageIndex));
    setupCarousel();
    updateModalImageCount();
    
    const carousel = document.querySelector('.modal-carousel');
    if (carousel && currentProjectImages.length > 0) {
        carousel.style.setProperty('--modal-bg-image', `url(${currentProjectImages[currentSlideIndex]})`);
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function openTestimonialViewer(testimonialId) {
    const viewer = document.getElementById('testimonialViewer');
    const image = document.getElementById('testimonialViewerImage');
    const platform = document.getElementById('testimonialViewerPlatform');
    const client = document.getElementById('testimonialViewerClient');
    const testimonial = testimonialsData[testimonialId];

    if (!viewer || !image || !testimonial) return;

    testimonialViewerTrigger = document.activeElement;
    viewer.style.setProperty('--testimonial-accent', getTestimonialAccent(testimonial.platform));
    image.src = testimonial.image;
    image.alt = `${testimonial.platform} testimonial from ${testimonial.clientName}`;

    if (platform) {
        platform.textContent = testimonial.platform;
    }

    if (client) {
        client.textContent = testimonial.clientName;
    }

    viewer.classList.add('active');
    viewer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const closeButton = viewer.querySelector('.testimonial-viewer-close');
    closeButton.focus({ preventScroll: true });
    viewer.onkeydown = event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeTestimonialViewer();
        } else if (event.key === 'Tab') {
            event.preventDefault();
            closeButton.focus({ preventScroll: true });
        }
    };
}

function closeTestimonialViewer() {
    const viewer = document.getElementById('testimonialViewer');
    const image = document.getElementById('testimonialViewerImage');

    if (!viewer) return;

    viewer.classList.remove('active');
    viewer.setAttribute('aria-hidden', 'true');
    viewer.onkeydown = null;

    if (image) {
        image.src = '';
    }

    document.body.style.overflow = '';
    if (testimonialViewerTrigger?.isConnected) {
        testimonialViewerTrigger.focus({ preventScroll: true });
    }
    testimonialViewerTrigger = null;
}

function setupCarousel() {
    const carouselContainer = document.getElementById('carouselImages');
    const indicatorsContainer = document.getElementById('carouselIndicators');
    
    carouselContainer.innerHTML = '';
    indicatorsContainer.innerHTML = '';
    
    currentProjectImages.forEach((imageSrc, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        if (index === currentSlideIndex) slide.classList.add('active');
        
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = `Project image ${index + 1}`;
        
        slide.appendChild(img);
        carouselContainer.appendChild(slide);
        
        const indicator = document.createElement('button');
        indicator.type = 'button';
        indicator.className = 'indicator-dot';
        indicator.setAttribute('aria-label', `Show project image ${index + 1}`);
        if (index === currentSlideIndex) indicator.classList.add('active');
        indicator.addEventListener('click', () => goToSlideModal(index));
        indicatorsContainer.appendChild(indicator);
    });

    updateModalImageCount();
}

function changeSlide(direction) {
    currentSlideIndex += direction;
    
    if (currentSlideIndex < 0) {
        currentSlideIndex = currentProjectImages.length - 1;
    } else if (currentSlideIndex >= currentProjectImages.length) {
        currentSlideIndex = 0;
    }
    
    updateCarouselDisplay();
}

function goToSlideModal(index) {
    currentSlideIndex = index;
    updateCarouselDisplay();
}

function updateCarouselDisplay() {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator-dot');
    const carousel = document.querySelector('.modal-carousel');
    
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlideIndex);
    });
    
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlideIndex);
    });
    
    if (carousel && currentProjectImages[currentSlideIndex]) {
        carousel.style.setProperty('--modal-bg-image', `url(${currentProjectImages[currentSlideIndex]})`);
    }

    updateModalImageCount();
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadProjects();
    await loadTestimonials();
    new ThemeManager();
    new NavigationManager();
    Utils.initButtonActions();
    Utils.initFormSubmission();

});
