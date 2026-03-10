/* ============================================
   SmartMoves Swim — Main JavaScript
   ============================================ */

(function () {
  'use strict';

  // ---- Navbar scroll effect ----
  const navbar = document.getElementById('navbar');
  function handleScroll() {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });

  // ---- Mobile nav toggle ----
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', function () {
    navLinks.classList.toggle('open');
    // Animate hamburger
    navToggle.classList.toggle('active');
  });

  // Close mobile nav when clicking a link
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      navToggle.classList.remove('active');
    });
  });

  // ---- Scroll animations (Intersection Observer) ----
  const animatedElements = document.querySelectorAll('[data-animate]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
            setTimeout(function () {
              el.classList.add('visible');
            }, delay * 150);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    animatedElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: just show everything
    animatedElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ---- Smooth scroll for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();

// ---- Modal functions (global scope) ----
function openDemoModal(e) {
  if (e) e.preventDefault();
  document.getElementById('demoModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openPricingModal(e) {
  if (e) e.preventDefault();
  document.getElementById('pricingModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModals() {
  document.querySelectorAll('.modal-overlay').forEach(function (m) {
    m.classList.remove('active');
  });
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      closeModals();
    }
  });
});

// Close modal on Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeModals();
  }
});

// ---- API Config ----
var API_URL = 'https://api.tinshed.co.nz/v1/contact';
var API_KEY = '5adfc61415da06a515218a6f543a897883abc73d41d933e37f287c199318530e';
var RECAP_KEY = '6LfSku8pAAAAAN6qtCkf20f3l5ubBIsGdZ1VYV7s';

function handleFormSubmit(e, type) {
  e.preventDefault();

  var form = e.target;
  var modal = form.closest('.modal');
  var successEl = modal.querySelector('.modal__success');
  var submitBtn = form.querySelector('button[type="submit"]');
  var btnText = submitBtn.querySelector('.btn-text');
  var originalText = btnText.textContent;

  // Gather form data
  var name = form.querySelector('[name="name"]').value.trim();
  var email = form.querySelector('[name="email"]').value.trim();
  var school = form.querySelector('[name="school"]') ? form.querySelector('[name="school"]').value.trim() : '';

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  // Build message body based on form type
  var subject, message;
  if (type === 'demo') {
    var phone = form.querySelector('[name="phone"]') ? form.querySelector('[name="phone"]').value.trim() : '';
    subject = 'SmartMoves Swim — Demo Request';
    message = 'Demo request from ' + name + '\n'
      + 'Email: ' + email + '\n'
      + 'Swim School: ' + (school || 'Not provided') + '\n'
      + 'Phone: ' + (phone || 'Not provided');
  } else {
    var locations = form.querySelector('[name="locations"]') ? form.querySelector('[name="locations"]').value : '';
    subject = 'SmartMoves Swim — Pricing Request';
    message = 'Pricing request from ' + name + '\n'
      + 'Email: ' + email + '\n'
      + 'Swim School: ' + (school || 'Not provided') + '\n'
      + 'Locations: ' + (locations || 'Not provided');
  }

  // Disable button and show loading state
  submitBtn.disabled = true;
  btnText.textContent = 'Sending…';

  // Get reCAPTCHA token, then POST to API
  grecaptcha.ready(function () {
    grecaptcha.execute(RECAP_KEY, { action: type === 'demo' ? 'demo_request' : 'pricing_request' }).then(function (token) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', API_URL, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('x-api-key', API_KEY);

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Success — show confirmation
          form.classList.add('hidden');
          successEl.classList.add('show');

          setTimeout(function () {
            closeModals();
            setTimeout(function () {
              form.classList.remove('hidden');
              successEl.classList.remove('show');
              form.reset();
            }, 400);
          }, 3000);
        } else {
          // Server error
          var errMsg = 'Something went wrong. Please try again.';
          try {
            var errData = JSON.parse(xhr.responseText);
            if (errData.error) errMsg = errData.error;
          } catch (_) {}
          alert(errMsg);
        }
        submitBtn.disabled = false;
        btnText.textContent = originalText;
      };

      xhr.onerror = function () {
        alert('Network error — please check your connection and try again.');
        submitBtn.disabled = false;
        btnText.textContent = originalText;
      };

      xhr.send(JSON.stringify({
        from: email,
        subject: subject,
        message: message,
        recaptcha_token: token
      }));
    }).catch(function () {
      alert('reCAPTCHA verification failed. Please try again.');
      submitBtn.disabled = false;
      btnText.textContent = originalText;
    });
  });
}
