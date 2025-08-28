const ADMIN_TOKEN = ""; // paste on your tablet if needed

const el = s => document.querySelector(s);
const grid = el('#grid');
const modal = el('#modal');

async function load() {
  const params = new URLSearchParams();
  if (el('#view').value) params.set('type', el('#view').value);
  if (el('#tag').value) params.set('tag', el('#tag').value);
  if (el('#q').value) params.set('q', el('#q').value);
  const res = await fetch('/api/items?' + params.toString());
  const items = await res.json();
  grid.innerHTML = items.map(i => `
    <article class="card item">
      <strong>${i.title}</strong>
      <div class="meta">${i.type} ${i.tags.map(t=>`• ${t}`).join(' ')} ${i.when?`• ${new Date(i.when).toLocaleString()}`:''}</div>
      <pre style="white-space:pre-wrap">${JSON.stringify(i.data, null, 2)}</pre>
    </article>
  `).join('');
}

function showModal(v){ modal.hidden = !v; }

el('#new').onclick = () => { 
  el('#type').value = 'IDEA';
  el('#title').value = '';
  el('#data').value = '';
  el('#tags').value = '';
  el('#when').value = '';
  showModal(true);
};
el('#cancel').onclick = () => showModal(false);
el('#save').onclick = async () => {
  const body = {
    type: el('#type').value,
    title: el('#title').value,
    data: el('#data').value ? JSON.parse(el('#data').value) : {},
    tags: el('#tags').value.split(',').map(s=>s.trim()).filter(Boolean),
    when: el('#when').value || null
  };
  await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', ...(ADMIN_TOKEN && {Authorization:`Bearer ${ADMIN_TOKEN}`}) },
    body: JSON.stringify(body)
  });
  showModal(false);
  load();
};

['#view','#tag','#q'].forEach(id => el(id).addEventListener('input', load));
load();
