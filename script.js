let projectsData = {};

async function loadProjects() {
    try {
        const response = await fetch('projects.json');
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

function renderProjects(projects) {
    const carouselTrack = document.getElementById('carouselTrack');
    if (!carouselTrack) return;
    const sortedProjects = projects.sort((a, b) => a.order - b.order);
    carouselTrack.innerHTML = '';
    sortedProjects.forEach(project => {
        const workItem = document.createElement('div');
        workItem.className = 'work-item fadeInUp';
        workItem.setAttribute('data-project', project.id);
        
        workItem.innerHTML = `
            <div class="work-image-wrapper">
                <img src="${project.thumbnail}" alt="${project.name}" class="work-thumbnail" />
                <div class="work-overlay">
                    <h3>${project.name}</h3>
                    <p>${project.shortDescription}</p>
                </div>
            </div>
            <button class="work-view-btn" onclick="openProjectModal(${project.id})">View Project</button>
        `;
        
        carouselTrack.appendChild(workItem);
    });
    if (window.worksCarousel) {
        worksCarousel.workItems = document.querySelectorAll('.work-item');
        worksCarousel.totalSlides = worksCarousel.workItems.length;
        worksCarousel.setupDots();
        worksCarousel.updateCarousel();
    }
    document.querySelectorAll('.work-item').forEach(item => {
        const img = item.querySelector('.work-thumbnail');
        const wrapper = item.querySelector('.work-image-wrapper');
        if (img && wrapper) {
            wrapper.style.setProperty('--work-bg-image', `url(${img.src})`);
        }
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
        
        this.currentTheme = 'light';
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
        this.applyTheme(this.currentTheme);
    }
    
    applyTheme(theme) {
        if (theme === 'dark') {
            this.body.setAttribute('data-theme', 'dark');
        } else {
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

class WorksCarousel {
    constructor() {
        this.carouselTrack = document.getElementById('carouselTrack');
        this.carouselDots = document.getElementById('carouselDots');
        this.workItems = document.querySelectorAll('.work-item');
        this.currentSlide = 0;
        this.slidesPerView = 3;
        this.totalSlides = this.workItems.length;
        
        this.init();
        this.setupDots();
        this.updateCarousel();
    }
    
    init() {
        this.updateSlidesPerView();
        window.addEventListener('resize', () => {
            this.updateSlidesPerView();
            this.updateCarousel();
            this.updateDots();
        });
    }
    
    updateSlidesPerView() {
        if (window.innerWidth <= 768) {
            this.slidesPerView = 1;
        } else if (window.innerWidth <= 1200) {
            this.slidesPerView = 2;
        } else {
            this.slidesPerView = 3;
        }
    }
    
    setupDots() {
        const dotsCount = Math.ceil(this.totalSlides / this.slidesPerView);
        this.carouselDots.innerHTML = '';
        
        for (let i = 0; i < dotsCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'carousel-dot';
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.goToSlide(i));
            this.carouselDots.appendChild(dot);
        }
    }
    
    updateDots() {
        const dots = this.carouselDots.querySelectorAll('.carousel-dot');
        const activeDotIndex = Math.floor(this.currentSlide / this.slidesPerView);
        
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeDotIndex);
        });
    }
    
    updateCarousel() {
        const items = Array.from(this.workItems);
        const containerWidth = this.carouselTrack.parentElement.offsetWidth;
    
        let itemWidth;
        if (this.slidesPerView === 1) {
            itemWidth = containerWidth;
        } else if (this.slidesPerView === 2) {
            itemWidth = (containerWidth - 2.5 * 16) / 2; 
        } else {
            itemWidth = (containerWidth - 2 * 2.5 * 16) / 3;
        }
    
        const gap = 2.5 * 16; 
        const translateX = -(this.currentSlide * (itemWidth + gap));
    
        this.carouselTrack.style.transform = `translateX(${translateX}px)`;
        this.updateDots();
    }
    
    move(direction) {
        const maxSlide = this.totalSlides - this.slidesPerView;
        this.currentSlide += direction;
        
        if (this.currentSlide < 0) {
            this.currentSlide = maxSlide;
        } else if (this.currentSlide > maxSlide) {
            this.currentSlide = 0;
        }
        
        this.updateCarousel();
    }
    
    goToSlide(slideIndex) {
        this.currentSlide = slideIndex * this.slidesPerView;
        this.updateCarousel();
    }
}

let worksCarousel;

function moveCarousel(direction) {
    if (worksCarousel) {
        worksCarousel.move(direction);
    }
}

let currentProjectImages = [];
let currentSlideIndex = 0;

function openProjectModal(projectId) {
    const modal = document.getElementById('projectModal');
    const project = projectsData[projectId];
    
    if (!project) return;
    
    document.getElementById('modalProjectName').textContent = project.name;
    document.getElementById('modalProjectDescription').textContent = project.description;
    document.getElementById('modalProjectLink').href = project.link;
    
    const techStackContainer = document.getElementById('modalTechStack');
    techStackContainer.innerHTML = '';
    project.techStack.forEach(tech => {
        const tag = document.createElement('span');
        tag.className = 'tech-tag';
        tag.textContent = tech;
        techStackContainer.appendChild(tag);
    });
    
    currentProjectImages = project.images;
    currentSlideIndex = 0;
    setupCarousel();
    
    const carousel = document.querySelector('.modal-carousel');
    if (carousel && project.images.length > 0) {
        carousel.style.setProperty('--modal-bg-image', `url(${project.images[0]})`);
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    modal.classList.remove('active');
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
        
        const indicator = document.createElement('div');
        indicator.className = 'indicator';
        if (index === 0) indicator.classList.add('active');
        indicator.addEventListener('click', () => goToSlideModal(index));
        indicatorsContainer.appendChild(indicator);
    });
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
    const indicators = document.querySelectorAll('.indicator');
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
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadProjects();
    new ThemeManager();
    new NavigationManager();
    worksCarousel = new WorksCarousel();
    Utils.initButtonActions();
    Utils.initFormSubmission();
    let touchStartX = 0;
    let touchEndX = 0;
    const carouselContainer = document.querySelector('.carousel-container');
    
    if (carouselContainer) {
        carouselContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        carouselContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const difference = touchStartX - touchEndX;
        
        if (Math.abs(difference) > swipeThreshold) {
            if (difference > 0) {
                moveCarousel(1);
            } else {
                moveCarousel(-1);
            }
        }
    }
});