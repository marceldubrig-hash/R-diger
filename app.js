const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];
const canvas = $('#wheel');
const ctx = canvas.getContext('2d');
const state = {
  choices: [], rotation: 0, spinning: false, mode: 'amt', spins: 0, rerolls: 0,
  sound: true, music: false, lastResult: null
};

const palettes = [
  ['#e5c84d','#b84040','#335c67','#f4f1de','#52796f','#c98239','#d8a7b1','#8390a6'],
  ['#ffd166','#ef476f','#06d6a0','#118ab2','#f7f3e3','#8338ec','#fb5607','#3a86ff'],
  ['#d6d1b1','#8b2635','#3e5641','#f4e9cd','#477998','#b78f49','#7d6b7d','#b7b7a4']
];
const comments = {
  amt: [
    'Rüdiger hat entschieden. Diskussion beendet.',
    'Der Vorgang wurde geprüft. Von wem, ist unklar.',
    'Rechtsmittelbelehrung: Pech gehabt.',
    'Die Entscheidung ist sachlich nicht begründbar, aber gestempelt.',
    'Ihr Antrag auf eine bessere Option wurde vorsorglich abgelehnt.',
    'Diese Entscheidung entspricht der DIN EN LOL-0815.'
  ],
  kirmes: [
    'HAUPTGEWINN!!! Also vermutlich. Irgendwas blinkt jedenfalls.',
    'JAAAAA! Rüdiger schmeißt imaginär drei Kuscheltiere in die Menge.',
    'Die Losbude hat gesprochen. Rückgabe ausgeschlossen.',
    '10/10 Kirmesphysik. Das bleibt jetzt so.'
  ],
  chaos: [
    'Bruder muss los. Und zwar offenbar genau dahin.',
    'Kannste dir nicht ausdenken. Rüdiger schon.',
    'Was letzte Entscheidung? Diese hier.',
    'Rüdiger nicht so tief! Zu spät.',
    'Anzeige ist raus. Gegen wen, klären wir später.',
    'Das ist bodenlos. Also amtlich bodenlos.'
  ],
  npc: [
    'Ergebnis festgestellt.',
    'Interaktion abgeschlossen.',
    'Standarddialog beendet.',
    'Option ausgewählt. Weitere Emotionen nicht installiert.'
  ]
};
const tickerLines = [
  '+++ EILMELDUNG: Rüdiger wurde erneut ohne fachliche Qualifikation zur Entscheidungsinstanz ernannt +++',
  '+++ BUNDESWEITE STÖRUNG: Bürger drehen erneut so lange, bis das gewünschte Ergebnis kommt +++',
  '+++ WARNUNG: Kranplätze müssen weiterhin verdichtet sein +++',
  '+++ AKTUELL: Die Restwürde ist unter den saisonüblichen Mittelwert gefallen +++',
  '+++ SERVICEHINWEIS: Das Faxgerät ist digitaler als die gesamte Verwaltung +++'
];
const logLines = [
  'Rüdiger prüft die Zuständigkeit und findet keine.',
  'Sachlage unnötig verkompliziert.',
  'Formular 38 wurde aus Gründen vernichtet.',
  'Ein Mitarbeiter hat „Safe“ gesagt. Vorgang eskaliert.',
  'Dackel wurde informiert. Keine Reaktion.',
  'Entscheidungsserver läuft auf Hoffnung.',
  'Rüdiger hat kurz genickt. Das zählt als Freigabe.'
];
const ruedigerEvents = [
  {text:'NEIN.', effect:'overlay'},
  {text:'FAX WIRD EMPFANGEN…', effect:'fax'},
  {text:'AMTLICHER DACKEL-EINSATZ', effect:'dackel'},
  {text:'KRANPLATZPRÜFUNG!', effect:'overlay'},
  {text:'RÜDIGER HAT URLAUB BEANTRAGT', effect:'overlay'},
  {text:'RESTWÜRDE -12%', effect:'dignity'},
  {text:'ANZEIGE IST RAUS', effect:'overlay'},
  {text:'NICHTS PASSIERT.', effect:'nothing'}
];

function random(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }

function readChoices(){
  const lines = $('#choices').value.split('\n').map(v=>v.trim()).filter(Boolean).slice(0,18);
  state.choices = lines.length >= 2 ? lines : ['Ja','Nein','Vielleicht','Frag Rüdiger später'];
  localStorage.setItem('ruediger-choices', JSON.stringify(state.choices));
  drawWheel();
}

function load(){
  try {
    const saved = JSON.parse(localStorage.getItem('ruediger-choices')||'null');
    if(saved?.length){ $('#choices').value=saved.join('\n'); }
    const savedMode = localStorage.getItem('ruediger-mode');
    if(savedMode) setMode(savedMode);
    state.spins = +(localStorage.getItem('ruediger-spins')||0);
    state.rerolls = +(localStorage.getItem('ruediger-rerolls')||0);
  } catch(e){}
  const hash = location.hash.slice(1);
  if(hash.startsWith('r=')){
    try{
      const decoded = JSON.parse(decodeURIComponent(hash.slice(2)));
      if(Array.isArray(decoded)) $('#choices').value=decoded.join('\n');
    }catch(e){}
  }
  readChoices();
  updateStats();
  updateAktenzeichen();
}

function drawWheel(){
  const {choices} = state;
  const cx=canvas.width/2, cy=canvas.height/2, r=345;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(cx,cy);
  const palette = state.mode==='kirmes'?palettes[1]:state.mode==='npc'?palettes[2]:palettes[0];
  const arc=Math.PI*2/choices.length;
  choices.forEach((label,i)=>{
    const start=i*arc-Math.PI/2;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,r,start,start+arc);
    ctx.closePath();
    ctx.fillStyle=palette[i%palette.length];
    ctx.fill();
    ctx.lineWidth=5;
    ctx.strokeStyle='#171717';
    ctx.stroke();
    ctx.save();
    ctx.rotate(start+arc/2);
    ctx.translate(r*.61,0);
    ctx.rotate(Math.PI/2);
    ctx.fillStyle='#101010';
    ctx.font=`700 ${Math.max(18,Math.min(32,230/choices.length+14))}px Roboto Mono`;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    const max=19;
    const text=label.length>max?label.slice(0,max-1)+'…':label;
    ctx.fillText(text,0,0);
    ctx.restore();
  });
  ctx.beginPath();
  ctx.arc(0,0,70,0,Math.PI*2);
  ctx.fillStyle='#f6edcf';
  ctx.fill();
  ctx.lineWidth=8;
  ctx.strokeStyle='#111';
  ctx.stroke();
  ctx.font='700 24px Archivo Black';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillStyle='#111';
  ctx.fillText('RÜDIGER',0,0);
  ctx.restore();
}

function setMode(mode){
  if(!['amt','kirmes','chaos','npc'].includes(mode)) mode='amt';
  state.mode=mode;
  localStorage.setItem('ruediger-mode',mode);
  document.body.classList.remove('kirmes','chaos-mode','npc-mode');
  if(mode==='kirmes') document.body.classList.add('kirmes');
  if(mode==='chaos') document.body.classList.add('chaos-mode');
  if(mode==='npc') document.body.classList.add('npc-mode');
  $$('.mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  if(state.choices.length) drawWheel();
}

function play(el){
  if(!state.sound) return;
  try{
    el.currentTime=0;
    el.volume=.72;
    el.play().catch(()=>{});
  }catch(e){}
}

function spin(){
  if(state.spinning || state.choices.length<2) return;
  state.spinning=true;
  $('#spinBtn').disabled=true;
  $('#resultModal').classList.add('hidden');
  state.spins++;
  localStorage.setItem('ruediger-spins',state.spins);
  updateStats();
  play($('#spinSfx'));
  const n=state.choices.length;
  const index=Math.floor(Math.random()*n);
  const segment=360/n;
  const targetCenter=index*segment+segment/2;
  const rounds=6+Math.floor(Math.random()*4);
  const normalized=((state.rotation%360)+360)%360;
  const desired=(360-targetCenter)%360;
  const delta=rounds*360+((desired-normalized+360)%360);
  state.rotation+=delta;
  canvas.style.transform=`rotate(${state.rotation}deg)`;
  $('#torqueMeter').style.width='100%';
  $('#torqueText').textContent=`${Math.floor(400+Math.random()*900)} Nm`;
  $('#qualityMeter').style.width=`${30+Math.random()*68}%`;
  $('#qualityText').textContent=random(['wissenschaftlich bedenklich','sieht amtlich aus','statistisch wild','ausreichend laminiert']);
  log('Drehvorgang eingeleitet. Haftung ausgelagert.');
  setTimeout(()=>{
    state.spinning=false;
    $('#spinBtn').disabled=false;
    state.lastResult=state.choices[index];
    $('#torqueMeter').style.width='4%';
    $('#torqueText').textContent='0 Nm';
    showResult(state.lastResult);
  },5200);
}

function showResult(result){
  play($('#winSfx'));
  $('#resultTitle').textContent=result;
  $('#resultComment').textContent=random(comments[state.mode]);
  const confidence=(51+Math.random()*48).toFixed(1).replace('.',',');
  const regret=(7+Math.random()*91).toFixed(1).replace('.',',');
  $('#resultMeta').innerHTML=`Aktenzeichen: <b>${$('#aktenzeichen').textContent}</b><br>Amtliche Sicherheit: <b>${confidence}%</b> · Potenzielles Bereuen: <b>${regret}%</b>`;
  $('#resultModal').classList.remove('hidden');
  if(state.mode==='chaos' && Math.random()>.45){
    setTimeout(()=>temporaryOverlay(random(['BRUDER MUSS LOS','DAS BLEIBT JETZT SO','BODENLOS','WAS LETZTE PREIS?'])),450);
  }
  updateAktenzeichen();
}

function updateStats(){
  $('#spinCount').textContent=state.spins;
  $('#rerollCount').textContent=state.rerolls;
  const dignity=clamp(88-state.rerolls*7-state.spins*.6,2,99);
  $('#dignityValue').textContent=`${Math.round(dignity)}%`;
  $('#doubtValue').textContent=`${Math.round(clamp(9+state.rerolls*9+Math.random()*7,4,99))}%`;
  $('#dinValue').textContent=`${Math.round(clamp(84+Math.sin(state.spins)*8,61,98))}%`;
  $('#geringValue').textContent=(5.2+(state.spins%9)*.37).toFixed(1).replace('.',',');
}

function updateAktenzeichen(){
  const d=new Date();
  $('#aktenzeichen').textContent=`RÜD-${d.getFullYear()}-${String(state.spins+815).padStart(4,'0')}`;
}

function log(msg){
  const now=new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
  $('#ruedigerLog').textContent=`${now}: ${msg}`;
}

function temporaryOverlay(text, ms=1150){
  const el=$('#chaosOverlay');
  el.textContent=text;
  el.classList.remove('hidden');
  setTimeout(()=>el.classList.add('hidden'),ms);
}

function ruediger(){
  const event=random(ruedigerEvents);
  log(event.text);
  switch(event.effect){
    case 'overlay':
      temporaryOverlay(event.text);
      break;
    case 'fax':
      document.body.classList.add('fax-flash');
      play($('#spinSfx'));
      temporaryOverlay('FAX\nWIRD\nEMPFANGEN',1300);
      setTimeout(()=>document.body.classList.remove('fax-flash'),1200);
      break;
    case 'dackel':
      temporaryOverlay('🐕\nAMTLICHER DACKEL',1200);
      break;
    case 'dignity':
      state.rerolls+=2;
      localStorage.setItem('ruediger-rerolls',state.rerolls);
      updateStats();
      temporaryOverlay('-12% RESTWÜRDE');
      break;
    case 'nothing':
      $('#ruedigerBtn').textContent='…';
      setTimeout(()=>$('#ruedigerBtn').innerHTML='RÜDIGER-KNOPF<br><small>Nicht drücken.</small>',900);
      break;
  }
}

function preset(){
  const sets=[
    ['Döner','Pizza','Currywurst','Burger','Leberkässemmel','Nudeln um 02:14 Uhr'],
    ['Bier holen','Müll rausbringen','Abwasch','Staubsaugen','So tun als hätte man es nicht gesehen','Manu fragen'],
    ['Zocken','Kneipe','Film','Kochen','Spazieren (gelogen)','Irgendwo hinfahren ohne Plan'],
    ['Vernünftig sein','Unvernünftig sein','Rüdiger entscheiden lassen','Noch einmal drehen','Gar nichts tun','Snack']
  ];
  $('#choices').value=random(sets).join('\n');
  readChoices();
  log('Amtliche Vorlage ohne erkennbare Rechtsgrundlage geladen.');
}

function toggleMusic(){
  state.music=$('#musicToggle').checked;
  const a=$('#music');
  a.volume=.22;
  if(state.music){
    a.play().catch(()=>log('Musik wartet auf eine weitere Nutzerinteraktion. Browser macht Browserdinge.'));
  } else {
    a.pause();
  }
}

$('#applyBtn').addEventListener('click',()=>{readChoices();log('Optionen übernommen. Verantwortung nicht.');});
$('#presetBtn').addEventListener('click',preset);
$('#spinBtn').addEventListener('click',spin);
$('#ruedigerBtn').addEventListener('click',ruediger);
$('#acceptBtn').addEventListener('click',()=>{
  $('#resultModal').classList.add('hidden');
  log(`Beschluss „${state.lastResult}“ widerstandslos akzeptiert.`);
});
$('#rerollBtn').addEventListener('click',()=>{
  state.rerolls++;
  localStorage.setItem('ruediger-rerolls',state.rerolls);
  updateStats();
  $('#resultModal').classList.add('hidden');
  log('Einspruch registriert. Demokratie nur wenn Ergebnis gefällt, verstanden.');
  setTimeout(spin,260);
});
$('#soundToggle').addEventListener('change',e=>state.sound=e.target.checked);
$('#musicToggle').addEventListener('change',toggleMusic);
$$('.mode').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
canvas.addEventListener('click',spin);
document.addEventListener('keydown',e=>{
  if(e.code==='Space' && !/TEXTAREA|INPUT/.test(document.activeElement.tagName)){
    e.preventDefault();
    spin();
  }
  if(e.key.toLowerCase()==='r') ruediger();
});
setInterval(()=>$('#tickerText').textContent=random(tickerLines),11000);
setInterval(()=>{
  if(!state.spinning && Math.random()>.45) log(random(logLines));
},19000);
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
load();
