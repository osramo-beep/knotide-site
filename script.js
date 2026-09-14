// Knotide Bio — comportamento do site

document.getElementById('year').textContent = new Date().getFullYear();

// Menu móvel
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

// Envio do formulário de contacto (Formspree, plano gratuito)
const form = document.getElementById('contactForm');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = document.createElement('p');
  status.className = 'form-note';

  if (form.action.includes('SUBSTITUIR_PELO_SEU_ID')) {
    status.textContent = 'Formulário ainda não configurado. Envie um email diretamente para geral@knotidebio.pt.';
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
      status.textContent = 'Mensagem enviada. Obrigado pelo contacto.';
    } else {
      status.textContent = 'Não foi possível enviar. Tente novamente ou escreva para geral@knotidebio.pt.';
    }
  } catch (err) {
    status.textContent = 'Não foi possível enviar. Tente novamente ou escreva para geral@knotidebio.pt.';
  }
  form.appendChild(status);
});
