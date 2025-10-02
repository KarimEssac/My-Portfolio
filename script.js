window.addEventListener('load', () => {
    const loader = document.querySelector('.page-loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
            document.body.style.overflow = '';
        }, 500);
    }
});

// Prevent scrolling while loader is active
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.querySelector('.page-loader');
    if (loader && !loader.classList.contains('hidden')) {
        document.body.style.overflow = 'hidden';
    }
});
// Theme Management
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

// Navigation Management
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

// Project Data
const projectsData = {
    1: {
        name: "Skorka",
        description: "Skorka is a footwear e-commerce application designed to provide users with a seamless online shopping experience. It allows customers to browse and search products, add items to their cart, and complete secure purchases with ease. The platform also supports product categorization, user authentication, and order management, making it efficient for both customers and administrators. With its clean design and intuitive interface, Skorka simplifies footwear shopping and enhances overall user satisfaction.",
        techStack: ["PHP", "Laravel", "HTML", "WebSockets", "CSS", "JavaScript", "MySQL"],
        link: "https://skorkaa.com",
        images: [
            "https://i.ibb.co/8D52ZD51/1.png",
            "https://i.ibb.co/ycM4DzCt/2.png",
            "https://i.ibb.co/1Yy7MChm/3.png",
            "https://i.ibb.co/CTHG72v/4.png",
            "https://i.ibb.co/sp02pY1X/6.png",
            "https://i.ibb.co/Xrx83kbN/5.jpg",
            "https://i.ibb.co/XrD13pJ0/7.png"
        ]
    },
    2: {
        name: "Task Management App",
        description: "The Scouters Management System is a web application that streamlines the process of handling scout registrations, managing activities, and monitoring performance. It enables leaders to organize events, track participation, and maintain structured records, while also providing reports that support better decision-making. With its simple interface and efficient workflows, the system reduces manual effort and improves overall coordination between scouts and leaders.",
        techStack: ["PHP", "Laravel", "HTML", "WebSockets", "CSS", "JavaScript", "MySQL"],
        link: "https://github.com/KarimEssac/Scout_Management_System",
        images: [
            "https://i.ibb.co/h1hDqZKn/2.png",
            "https://i.ibb.co/z18PxGs/3.png",
            "https://i.ibb.co/zhW9j5Gn/7.png",
            "https://i.ibb.co/WNjhj4K5/4.png",
            "https://i.ibb.co/BKCBTdMr/5.png",
            "https://i.ibb.co/R4VvnRXQ/1.png",
            "https://i.ibb.co/7x6nKmjs/6.png"
            
        ]
    },
    3: {
        name: "Pharaonic Bank",
        description: "Pharaonic Bank is a full-stack web application developed as a student project to simulate real banking operations. It provides core features such as user account creation, secure authentication, balance tracking, transactions, and fund transfers. The system also supports admin management for overseeing users and operations. Designed with a structured backend and an intuitive frontend, it demonstrates how technology can streamline banking processes while offering students hands-on experience in building scalable financial applications.",
        techStack: ["PHP", "Laravel", "HTML", "WebSockets", "CSS", "JavaScript", "MySQL"],
        link: "",
        images: [
            "https://i.ibb.co/KxgH7FFQ/1.png",
            "https://i.ibb.co/d4y0J23m/2.png",
            "https://i.ibb.co/8L42Cxhd/3.png",
            "https://i.ibb.co/HLftQGQS/4.png",
            "https://i.ibb.co/whjnSLjw/5.png",
            "https://i.ibb.co/tP4Jz1SN/6.png"
        ]
    }
};

// Project Modal Management
let currentSlideIndex = 0;
let currentProjectImages = [];

function openProjectModal(projectId) {
    const modal = document.getElementById('projectModal');
    const project = projectsData[projectId];
    
    if (!project) return;
    
    // Set project data
    document.getElementById('modalProjectName').textContent = project.name;
    document.getElementById('modalProjectDescription').textContent = project.description;
    document.getElementById('modalProjectLink').href = project.link;
    
    // Set tech stack
    const techStackContainer = document.getElementById('modalTechStack');
    techStackContainer.innerHTML = '';
    project.techStack.forEach(tech => {
        const tag = document.createElement('span');
        tag.className = 'tech-tag';
        tag.textContent = tech;
        techStackContainer.appendChild(tag);
    });
    
    // Set up carousel
    currentProjectImages = project.images;
    currentSlideIndex = 0;
    setupCarousel();
    
    // Set background image for modal carousel
    const carousel = document.querySelector('.modal-carousel');
    if (carousel && project.images.length > 0) {
        carousel.style.setProperty('--modal-bg-image', `url(${project.images[0]})`);
    }
    
    // Show modal
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
    
    // Clear existing content
    carouselContainer.innerHTML = '';
    indicatorsContainer.innerHTML = '';
    
    // Create slides
    currentProjectImages.forEach((imageSrc, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        if (index === 0) slide.classList.add('active');
        
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = `Project image ${index + 1}`;
        
        slide.appendChild(img);
        carouselContainer.appendChild(slide);
        
        // Create indicator
        const indicator = document.createElement('div');
        indicator.className = 'indicator-dot';
        if (index === 0) indicator.classList.add('active');
        indicator.onclick = () => goToSlide(index);
        indicatorsContainer.appendChild(indicator);
    });
}

function changeSlide(direction) {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator-dot');
    const carousel = document.querySelector('.modal-carousel');
    
    if (slides.length === 0) return;
    
    slides[currentSlideIndex].classList.remove('active');
    indicators[currentSlideIndex].classList.remove('active');
    
    currentSlideIndex += direction;
    
    if (currentSlideIndex >= slides.length) {
        currentSlideIndex = 0;
    } else if (currentSlideIndex < 0) {
        currentSlideIndex = slides.length - 1;
    }
    
    slides[currentSlideIndex].classList.add('active');
    indicators[currentSlideIndex].classList.add('active');
    
    // Update background image
    if (carousel && currentProjectImages[currentSlideIndex]) {
        carousel.style.setProperty('--modal-bg-image', `url(${currentProjectImages[currentSlideIndex]})`);
    }
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator-dot');
    const carousel = document.querySelector('.modal-carousel');
    
    if (slides.length === 0) return;
    
    slides[currentSlideIndex].classList.remove('active');
    indicators[currentSlideIndex].classList.remove('active');
    
    currentSlideIndex = index;
    
    slides[currentSlideIndex].classList.add('active');
    indicators[currentSlideIndex].classList.add('active');
    
    // Update background image
    if (carousel && currentProjectImages[currentSlideIndex]) {
        carousel.style.setProperty('--modal-bg-image', `url(${currentProjectImages[currentSlideIndex]})`);
    }
}

// Keyboard navigation for modal
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('projectModal');
    if (modal.classList.contains('active')) {
        if (e.key === 'Escape') {
            closeProjectModal();
        } else if (e.key === 'ArrowLeft') {
            changeSlide(-1);
        } else if (e.key === 'ArrowRight') {
            changeSlide(1);
        }
    }
});

// Utility Functions
class Utils {
    static initButtonActions() {
        const primaryBtn = document.querySelector('.btn-primary');
        if (primaryBtn) {
            primaryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const contactSection = document.querySelector('#contact');
                if (contactSection) {
                    window.scrollTo({
                        top: contactSection.offsetTop - 70,
                        behavior: 'smooth'
                    });
                }
            });
        }
        
        const secondaryBtn = document.querySelector('.btn-secondary');
        if (secondaryBtn) {
            secondaryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                alert('CV download functionality coming soon!');
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
// Initialize
document.addEventListener('DOMContentLoaded', () => {
    
    new ThemeManager();
    new NavigationManager();
    Utils.initButtonActions();
    Utils.initFormSubmission();
    document.querySelectorAll('.work-item').forEach(item => {
    const img = item.querySelector('.work-thumbnail');
    const wrapper = item.querySelector('.work-image-wrapper');
    if (img && wrapper) {
        wrapper.style.setProperty('--work-bg-image', `url(${img.src})`);
    }
});
});
