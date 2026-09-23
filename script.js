// Knotide Bio — site behaviour

document.getElementById('year').textContent = new Date().getFullYear();

// Mobile menu
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Contact form submission (Formspree, free plan)
const form = document.getElementById('contactForm');

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.createElement('p');
    status.className = 'form-note';

    if (form.action.includes('SUBSTITUIR_PELO_SEU_ID')) {
      status.textContent = 'Form not configured yet. Please email info@knotidebio.pt directly.';
      form.appendChild(status);
      return;
    }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        form.reset();
        status.textContent = 'Message sent. Thank you for reaching out.';
      } else {
        status.textContent = 'Could not send the message. Please try again or email info@knotidebio.pt.';
      }
    } catch (err) {
      status.textContent = 'Could not send the message. Please try again or email info@knotidebio.pt.';
    }
    form.appendChild(status);
  });
}
