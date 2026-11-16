const byId = id => document.getElementById(id);
const setText = (id, value, fallback = '') => { byId(id).textContent = value || fallback; };

async function loadEvent() {
  const response = await fetch('/event.json');
  if (!response.ok) throw new Error('event');
  const event = await response.json();
  const name = event.guestOfHonor || 'Madeleine y Katerin';
  setText('hero-names', name);
  setText('event-date', event.date, 'Fecha por definir');
  setText('event-time', event.time, 'Hora por confirmar');
  setText('map-venue', event.venue, 'Mi Lindo Hogar');
  setText('map-address', event.address, 'Nuestra casa · Madeleine y Katerin');

  const mapQuery = event.mapQuery || '';
  let mapUrl = event.mapUrl || '';
    
  if (mapQuery) {
    const encoded = encodeURIComponent(mapQuery);
    const embedUrl = `https://maps.google.com/maps?q=${encoded}&z=16&output=embed`;
    byId('map-preview-frame').src = embedUrl;
    byId('map-empty').hidden = true;
    if (!mapUrl) mapUrl = `https://google.com{encoded}`;
  } else {
    byId('map-empty').hidden = false;
  }

  if (mapUrl) {
    byId('maps-link').href = mapUrl;
    byId('maps-link').hidden = false;
  }
}

function toggleMap() {
  const expanded = byId('map-toggle').getAttribute('aria-expanded') === 'true';
  byId('map-toggle').setAttribute('aria-expanded', String(!expanded));
  byId('map-preview-toggle').setAttribute('aria-expanded', String(!expanded));
  byId('map-expanded').hidden = expanded;
  byId('map-card').classList.toggle('is-open', !expanded);
}

byId('map-toggle').addEventListener('click', toggleMap);
byId('map-preview-toggle').addEventListener('click', toggleMap);

async function sendRsvp(attendance) {
  const input = byId('guest-input');
  const message = byId('rsvp-message');
  const name = input.value.trim();
  message.classList.remove('error');
  if (name.length < 2) {
    message.textContent = 'Escribe tu nombre para registrar tu respuesta.';
    message.classList.add('error');
    input.focus();
    return;
  }
  const buttons = [byId('yes-button'), byId('no-button')];
  buttons.forEach(button => { button.disabled = true; });
  message.textContent = 'Guardando tu respuesta…';
  try {
    const response = await fetch('/api/rsvps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, attendance })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo guardar la respuesta.');
    input.value = '';
    if (attendance === 'yes') {
      window.location.assign('./gracias.html');
      return;
    }
    message.textContent = result.message;
    byId('decline-dialog').showModal();
  } catch (error) {
    message.textContent = 'No pudimos conectar con el registro. Inténtalo otra vez en un momento.';
    message.classList.add('error');
  } finally {
    buttons.forEach(button => { button.disabled = false; });
  }
}

byId('yes-button').addEventListener('click', () => sendRsvp('yes'));
byId('no-button').addEventListener('click', () => sendRsvp('no'));
byId('decline-close').addEventListener('click', () => byId('decline-dialog').close());
byId('decline-dialog').addEventListener('click', event => {
  if (event.target === byId('decline-dialog')) byId('decline-dialog').close();
});

loadEvent().catch(() => {
  setText('rsvp-message', 'No se pudo cargar la invitación. Recarga la página para intentarlo de nuevo.');
  byId('rsvp-message').classList.add('error');
});
