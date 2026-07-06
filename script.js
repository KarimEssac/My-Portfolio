const projectsData = {};
const testimonialsData = {};
let allProjects = [];
let allTestimonials = [];
let activeWorksFilter = 'platforms';
let activeSpotlightProjectId = null;

const worksFilters = [
    { id: 'platforms', label: 'Platforms' },
    { id: 'commerce', label: 'Commerce' },
    { id: 'management', label: 'Systems' },
    { id: 'finance', label: 'Finance' },
    { id: 'extensions', label: 'Extensions' },
    { id: 'pos', label: 'POS' }
];

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

    const totalCount = document.getElementById('worksTotalCount');
    if (totalCount) {
        totalCount.textContent = allProjects.length;
    }

    renderWorksFilters();
    renderWorksCards();

    const firstVisibleProject = getVisibleProjects()[0];
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

function renderTechPills(project, limit = 4, className = 'work-tech-pill') {
    return (project.techStack || [])
        .slice(0, limit)
        .map(tech => `<span class="${className}">${escapeHTML(tech)}</span>`)
        .join('');
}

function renderRatingMeter(rating) {
    const maxRating = 5;
    const safeRating = Math.max(0, Math.min(maxRating, Number(rating) || 0));

    return Array.from({ length: maxRating }, (_, index) => `
        <span class="${index < safeRating ? 'filled' : ''}"></span>
    `).join('');
}

function renderTestimonials(testimonials) {
    allTestimonials = [...testimonials].sort((a, b) => a.order - b.order);

    const testimonialsGrid = document.getElementById('testimonialsGrid');
    if (!testimonialsGrid) return;

    const totalCount = document.getElementById('testimonialTotalCount');
    const averageRating = document.getElementById('testimonialAverageRating');

    if (totalCount) {
        totalCount.textContent = allTestimonials.length;
    }

    if (averageRating && allTestimonials.length) {
        const average = allTestimonials.reduce((sum, testimonial) => sum + Number(testimonial.rating || 0), 0) / allTestimonials.length;
        averageRating.textContent = average.toFixed(1);
    }

    testimonialsGrid.innerHTML = allTestimonials.map((testimonial, index) => `
        <article class="testimonial-card ${index === 0 ? 'is-featured' : ''}" data-testimonial="${testimonial.id}" data-platform="${escapeHTML((testimonial.platform || '').toLowerCase())}">
            <div class="testimonial-card-top">
                <span class="testimonial-platform">${escapeHTML(testimonial.platform)}</span>
                <span class="testimonial-number">${String(index + 1).padStart(2, '0')}</span>
            </div>
            <div class="testimonial-rating" aria-label="${escapeHTML(testimonial.rating)} out of 5 rating">
                ${renderRatingMeter(testimonial.rating)}
                <strong>${Number(testimonial.rating || 0).toFixed(1)}</strong>
            </div>
            <h3 dir="auto">${escapeHTML(testimonial.projectTitle)}</h3>
            <p class="testimonial-summary">${escapeHTML(testimonial.summary)}</p>
            <blockquote>${escapeHTML(testimonial.quote)}</blockquote>
            <div class="testimonial-meta-grid">
                <div>
                    <span>Client</span>
                    <strong>${escapeHTML(testimonial.clientName)}</strong>
                </div>
                <div>
                    <span>Category</span>
                    <strong>${escapeHTML(testimonial.category)}</strong>
                </div>
                <div>
                    <span>Timeline</span>
                    <strong>${escapeHTML(testimonial.completedIn)}</strong>
                </div>
            </div>
            <button class="testimonial-image-button" type="button" data-testimonial="${testimonial.id}" aria-label="Open ${escapeHTML(testimonial.clientName)} testimonial image">
                <img src="${escapeHTML(testimonial.image)}" alt="${escapeHTML(testimonial.platform)} testimonial from ${escapeHTML(testimonial.clientName)}" loading="lazy" />
                <span>View original screenshot</span>
            </button>
        </article>
    `).join('');

    testimonialsGrid.querySelectorAll('.testimonial-image-button').forEach(button => {
        button.addEventListener('click', () => {
            openTestimonialViewer(Number(button.dataset.testimonial));
        });
    });
}

function renderWorksFilters() {
    const filtersContainer = document.getElementById('worksFilters');
    if (!filtersContainer) return;

    const availableFilters = new Set(allProjects.map(project => getProjectMeta(project).filter));
    const filtersToRender = worksFilters.filter(filter => availableFilters.has(filter.id));

    filtersContainer.innerHTML = filtersToRender.map(filter => `
        <button
            type="button"
            class="works-filter ${filter.id === activeWorksFilter ? 'active' : ''}"
            data-filter="${filter.id}"
            aria-pressed="${filter.id === activeWorksFilter}"
        >
            ${escapeHTML(filter.label)}
        </button>
    `).join('');

    filtersContainer.querySelectorAll('.works-filter').forEach(button => {
        button.addEventListener('click', () => {
            activeWorksFilter = button.dataset.filter;
            renderWorksFilters();
            renderWorksCards();

            const firstVisibleProject = getVisibleProjects()[0];
            if (firstVisibleProject) {
                updateWorksSpotlight(firstVisibleProject.id);
            }
        });
    });
}

function renderWorksCards() {
    const worksGrid = document.getElementById('carouselTrack');
    const worksCounter = document.getElementById('worksCounter');
    if (!worksGrid) return;

    const visibleProjects = getVisibleProjects();

    if (worksCounter) {
        const activeFilterLabel = worksFilters.find(filter => filter.id === activeWorksFilter)?.label || 'Projects';
        const projectLabel = visibleProjects.length === 1 ? 'project' : 'projects';
        worksCounter.textContent = `${visibleProjects.length} ${projectLabel} in ${activeFilterLabel}`;
    }

    worksGrid.innerHTML = visibleProjects.map((project, index) => {
        const meta = getProjectMeta(project);
        const isActive = activeSpotlightProjectId === project.id || (!activeSpotlightProjectId && index === 0);

        return `
            <article
                class="work-item fadeInUp ${isActive ? 'is-active' : ''}"
                data-project="${project.id}"
                role="button"
                tabindex="0"
                aria-label="Open ${escapeHTML(project.name)} project"
            >
                <div class="work-image-wrapper">
                    <img src="${escapeHTML(project.thumbnail)}" alt="${escapeHTML(project.name)}" class="work-thumbnail" loading="lazy" />
                    <span class="work-index">${String(index + 1).padStart(2, '0')}</span>
                    <span class="work-category">${escapeHTML(meta.category)}</span>
                </div>
                <div class="work-card-body">
                    <h3>${escapeHTML(project.name)}</h3>
                    <p>${escapeHTML(project.shortDescription)}</p>
                    <div class="work-focus">${escapeHTML(meta.focus)}</div>
                    <div class="work-tech-list">
                        ${renderTechPills(project, 3)}
                    </div>
                </div>
                <div class="work-card-footer">
                    <span>Case study</span>
                    <button type="button" class="work-view-btn" data-project="${project.id}">Explore</button>
                </div>
            </article>
        `;
    }).join('');

    worksGrid.querySelectorAll('.work-item').forEach(card => {
        const projectId = Number(card.dataset.project);
        const project = projectsData[projectId];
        const meta = getProjectMeta(project);

        card.style.setProperty('--project-accent', meta.accent);
        card.style.setProperty('--work-bg-image', `url("${project.thumbnail}")`);

        card.addEventListener('mouseenter', () => updateWorksSpotlight(projectId));
        card.addEventListener('focus', () => updateWorksSpotlight(projectId));
        card.addEventListener('click', () => openProjectModal(projectId));
        card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openProjectModal(projectId);
            }
        });
    });

    worksGrid.querySelectorAll('.work-view-btn').forEach(button => {
        button.addEventListener('click', event => {
            event.stopPropagation();
            openProjectModal(Number(button.dataset.project));
        });
    });
}

function updateWorksSpotlight(projectId) {
    const spotlight = document.getElementById('workSpotlight');
    const project = projectsData[projectId];
    if (!spotlight || !project) return;

    const meta = getProjectMeta(project);
    const projectLink = getProjectLink(project);
    const galleryImages = [project.thumbnail, ...(project.images || [])]
        .filter(Boolean)
        .filter((image, index, images) => images.indexOf(image) === index)
        .slice(0, 4);

    activeSpotlightProjectId = projectId;
    spotlight.style.setProperty('--project-accent', meta.accent);
    spotlight.style.setProperty('--work-bg-image', `url("${project.thumbnail}")`);

    spotlight.innerHTML = `
        <div class="spotlight-copy">
            <span class="spotlight-kicker">${escapeHTML(meta.category)}</span>
            <h3>${escapeHTML(project.name)}</h3>
            <p>${escapeHTML(meta.result)}</p>
            <div class="spotlight-focus">
                <span>${escapeHTML(meta.focus)}</span>
            </div>
            <div class="spotlight-tech">
                ${renderTechPills(project, 5, 'spotlight-tech-pill')}
            </div>
            <div class="spotlight-actions">
                <button type="button" class="work-view-btn spotlight-view" data-project="${project.id}">View Case Study</button>
                ${projectLink ? `<a class="spotlight-link" href="${escapeHTML(projectLink)}" target="_blank" rel="noopener noreferrer">Open Live</a>` : ''}
            </div>
        </div>
        <div class="spotlight-media">
            <div class="spotlight-screen">
                <img src="${escapeHTML(project.thumbnail)}" alt="${escapeHTML(project.name)} preview" loading="eager" />
            </div>
            <div class="spotlight-strip">
                ${galleryImages.slice(1).map((image, index) => `
                    <img src="${escapeHTML(image)}" alt="${escapeHTML(project.name)} gallery preview ${index + 1}" loading="eager" />
                `).join('')}
            </div>
        </div>
    `;

    document.querySelectorAll('.work-item').forEach(card => {
        card.classList.toggle('is-active', Number(card.dataset.project) === projectId);
    });

    const viewButton = spotlight.querySelector('.spotlight-view');
    if (viewButton) {
        viewButton.addEventListener('click', () => openProjectModal(projectId));
    }
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

function openProjectModal(projectId) {
    const modal = document.getElementById('projectModal');
    const project = projectsData[projectId];
    
    if (!project) return;

    const meta = getProjectMeta(project);
    const projectPosition = getProjectPosition(projectId);
    const projectType = worksFilters.find(filter => filter.id === meta.filter)?.label || meta.category;
    const modalImages = [project.thumbnail, ...(project.images || [])]
        .filter(Boolean)
        .filter((image, index, images) => images.indexOf(image) === index);

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
    currentSlideIndex = 0;
    setupCarousel();
    updateModalImageCount();
    
    const carousel = document.querySelector('.modal-carousel');
    if (carousel && currentProjectImages.length > 0) {
        carousel.style.setProperty('--modal-bg-image', `url(${currentProjectImages[0]})`);
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
}

function closeTestimonialViewer() {
    const viewer = document.getElementById('testimonialViewer');
    const image = document.getElementById('testimonialViewerImage');

    if (!viewer) return;

    viewer.classList.remove('active');
    viewer.setAttribute('aria-hidden', 'true');

    if (image) {
        image.src = '';
    }

    document.body.style.overflow = '';
}

function setupCarousel() {
    const carouselContainer = document.getElementById('carouselImages');
    const indicatorsContainer = document.getElementById('carouselIndicators');
    
    carouselContainer.innerHTML = '';
    indicatorsContainer.innerHTML = '';
    
    currentProjectImages.forEach((imageSrc, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        if (index === 0) slide.classList.add('active');
        
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = `Project image ${index + 1}`;
        
        slide.appendChild(img);
        carouselContainer.appendChild(slide);
        
        const indicator = document.createElement('button');
        indicator.type = 'button';
        indicator.className = 'indicator-dot';
        indicator.setAttribute('aria-label', `Show project image ${index + 1}`);
        if (index === 0) indicator.classList.add('active');
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

    // Experience accordion
    document.querySelectorAll('.experience-item').forEach(item => {
        const card = item.querySelector('.experience-card');
        if (!card) return;
        card.addEventListener('click', () => {
            const isOpen = item.classList.contains('is-open');
            // Close all
            document.querySelectorAll('.experience-item.is-open').forEach(openItem => {
                openItem.classList.remove('is-open');
            });
            // Toggle clicked (if it was closed, open it)
            if (!isOpen) {
                item.classList.add('is-open');
            }
        });
    });
});
