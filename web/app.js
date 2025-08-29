const ADMIN_TOKEN = ""; // paste on your tablet if needed

const el = s => document.querySelector(s);
const els = s => Array.from(document.querySelectorAll(s));
let currentPage = 'board';

function showPage(id){
  currentPage = id;
  els('.topnav button').forEach(b=>b.classList.toggle('active', b.dataset.page===id));
  els('.page').forEach(p=>p.hidden = p.id !== id);
  if(id==='board') loadBoard();
  if(id==='workouts') loadWorkouts();
  if(id==='bike') loadBike();
}
els('.topnav button').forEach(btn=>btn.onclick=()=>showPage(btn.dataset.page));

async function fetchItems(params={}){
  const qs = new URLSearchParams(params).toString();
  const res = await fetch('/api/items'+(qs?'?'+qs:''));
  return res.json();
}

function renderList(list, items){
  list.innerHTML = items.map(i=>`
    <li data-id="${i.id}"><span>${i.title}</span><button class="check">✓</button><button class="del">✕</button></li>
  `).join('');
}

async function loadBoard(){
  const items = await fetchItems();
  const ideas = items.filter(i=>i.type==='IDEA' || i.type==='EVENT');
  renderList(el('#ideasList'), ideas);
}
async function loadWorkouts(){
  const items = await fetchItems({type:'WORKOUT'});
  renderList(el('#workoutList'), items);
}
async function loadBike(){
  const items = await fetchItems({tag:'bike'});
  renderList(el('#bikeList'), items);
}

function listHandler(list, reload){
  list.addEventListener('click', async e=>{
    const li = e.target.closest('li');
    if(!li) return;
    if(e.target.classList.contains('check')){
      li.classList.toggle('done');
    }else if(e.target.classList.contains('del')){
      await fetch('/api/items/'+li.dataset.id,{method:'DELETE', headers:auth()});
      li.remove();
      if(reload) reload();
    }
  });
}
listHandler(el('#ideasList'), loadBoard);
listHandler(el('#workoutList'), loadWorkouts);
listHandler(el('#bikeList'), loadBike);

el('#clearIdeas').onclick = async ()=>{
  const done = el('#ideasList').querySelectorAll('li.done');
  for(const li of done){
    await fetch('/api/items/'+li.dataset.id,{method:'DELETE', headers:auth()});
    li.remove();
  }
};

function makeLocalItem(title){
  const li = document.createElement('li');
  li.innerHTML = `<span>${title}</span><button class="check">✓</button><button class="del">✕</button>`;
  return li;
}

el('#classesCol').addEventListener('click', e=>{
  if(e.target.classList.contains('add')){
    const actions = e.target.parentElement;
    const input = actions.querySelector('input');
    const ul = actions.previousElementSibling;
    if(input.value.trim()){
      ul.appendChild(makeLocalItem(input.value.trim()));
      input.value='';
    }
  }else if(e.target.classList.contains('check')){
    e.target.parentElement.classList.toggle('done');
  }else if(e.target.classList.contains('del')){
    e.target.parentElement.remove();
  }
});

el('#clearClasses').onclick = ()=>{
  els('#classesCol li.done').forEach(li=>li.remove());
};

function auth(){ return ADMIN_TOKEN ? {Authorization:`Bearer ${ADMIN_TOKEN}`} : {}; }
function showModal(v){ el('#modal').hidden = !v; }
function newItem(def={}){
  el('#type').value = def.type || 'IDEA';
  el('#title').value = '';
  el('#data').value = '';
  el('#tags').value = def.tags || '';
  el('#when').value = '';
  showModal(true);
}
el('#newIdea').onclick = ()=>newItem();
el('#newWorkout').onclick = ()=>newItem({type:'WORKOUT'});
el('#newBike').onclick = ()=>newItem({tags:'bike'});
el('#cancel').onclick = ()=>showModal(false);
el('#save').onclick = async ()=>{
  const body = {
    type: el('#type').value,
    title: el('#title').value,
    data: el('#data').value ? JSON.parse(el('#data').value) : {},
    tags: el('#tags').value.split(',').map(s=>s.trim()).filter(Boolean),
    when: el('#when').value || null
  };
  await fetch('/api/items',{method:'POST',headers:{'Content-Type':'application/json',...auth()},body:JSON.stringify(body)});
  showModal(false);
  if(currentPage==='board') loadBoard();
  if(currentPage==='workouts') loadWorkouts();
  if(currentPage==='bike') loadBike();
};

showPage('board');
