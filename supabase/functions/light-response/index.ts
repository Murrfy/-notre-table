import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const securityHeaders={
  'cache-control':'no-store, max-age=0',
  'referrer-policy':'no-referrer',
  'x-content-type-options':'nosniff',
  'x-frame-options':'DENY',
  'permissions-policy':'camera=(), microphone=(), geolocation=(), payment=()',
  'cross-origin-opener-policy':'same-origin',
  'cross-origin-resource-policy':'same-origin',
};
const jsonHeaders={...securityHeaders,'content-type':'application/json; charset=utf-8'};

function json(status:number,body:unknown){return new Response(JSON.stringify(body),{status,headers:jsonHeaders});}

function defaultSecretKey():string{
  const modern=Deno.env.get('SUPABASE_SECRET_KEYS');
  if(modern){
    try{
      const parsed=JSON.parse(modern);
      if(typeof parsed?.default==='string'&&parsed.default)return parsed.default;
    }catch{/* use legacy secret when configured */}
  }
  const legacy=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(legacy)return legacy;
  throw new Error('SERVER_SECRET_NOT_CONFIGURED');
}

function htmlShell(){
  const headers={
    ...securityHeaders,
    'content-type':'text/html; charset=utf-8',
    'content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  };
  return new Response(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>NOTRE TABLE</title>
<style>
:root{font-family:ui-rounded,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#253228;background:#f6f1e8}*{box-sizing:border-box}body{margin:0;min-height:100vh;padding:16px}.card{width:min(100%,720px);margin:0 auto;background:#fffdf8;border:1px solid #e8e0d4;border-radius:28px;padding:22px;box-shadow:0 14px 45px rgba(53,65,55,.10)}.brand{font-size:13px;font-weight:900;letter-spacing:.18em;color:#657a68}.who{margin:8px 0 0;color:#7d817d;font-size:14px}.question{font-size:25px;line-height:1.15;margin:10px 0 18px}.section{font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#7d817d;margin:18px 0 8px}.choiceGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.choice{appearance:none;border:1px solid #dfddd6;background:#fff;border-radius:16px;min-height:68px;padding:9px;font:inherit;font-weight:900;color:#26332a;cursor:pointer}.choice .icon{font-size:25px;display:block;margin-bottom:3px}.choice.on{border-color:#5e8d68;background:#eaf3eb;box-shadow:inset 0 0 0 1px #5e8d68}.choice .tick{color:#2f8a4b;font-size:18px;margin-left:4px}.presence{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.btn{appearance:none;border:1px solid #dfddd6;background:#fff;border-radius:14px;min-height:48px;padding:9px;font:inherit;font-weight:800;color:#26332a;cursor:pointer}.btn.on{background:#edf3ec;border-color:#7c947e}.takeBox{border:1px solid #dfddd6;background:#f3eee3;border-radius:16px;padding:13px;margin-top:9px}.takeBtn{width:100%;text-align:left}.takeBtn.on{background:#e7f1e8;border-color:#65906e}.takeInfo{font-size:13px;color:#56645a;margin-top:8px}.note{width:100%;min-height:88px;resize:vertical;border:1px solid #dfddd6;border-radius:16px;padding:12px;font:inherit;color:#26332a;background:#fff}.noteSave{width:100%;margin-top:8px}.saved{color:#477950;font-weight:800;font-size:12px;min-height:18px;margin:8px 0}.boardWrap{overflow:auto;border:1px solid #e2ded5;border-radius:16px;background:#fff;margin-top:8px}.board{border-collapse:collapse;min-width:610px;width:100%}.board th,.board td{border-right:1px solid #ece7de;border-bottom:1px solid #ece7de;padding:8px;text-align:center;min-width:86px}.board th:first-child,.board td:first-child{position:sticky;left:0;z-index:1;background:#fffdf8;min-width:128px;text-align:left;font-weight:900}.board thead th{background:#edf3ec;font-size:11px}.board thead th:first-child{z-index:2;background:#edf3ec}.boardIcon{font-size:23px;display:block}.boardCount{display:block;color:#55765b;font-size:12px;font-weight:900;margin-top:2px}.greenTick{color:#2f8a4b;font-size:24px;font-weight:1000}.waiting{color:#bbb;font-size:13px}.takeSummary{background:#edf3ec;border-radius:14px;padding:12px;margin-top:12px}.takeSummary strong{display:block;color:#456a4c}.notesList{display:grid;gap:7px}.noteItem{border:1px solid #e8e0d4;border-radius:12px;padding:9px;background:#fff}.noteName{font-weight:900;color:#55765b;font-size:11px}.noteText{font-size:13px;margin-top:3px}.status{padding:28px 10px;text-align:center}.status h1{font-size:24px;margin:0 0 8px}.status p{color:#747974;line-height:1.45}.hidden{display:none}@media(min-width:560px){.choiceGrid{grid-template-columns:repeat(5,1fr)}}@media(max-width:390px){.card{padding:18px;border-radius:22px}.question{font-size:23px}.btn,.choice{font-size:13px}}
</style></head><body><main class="card">
<div id="loading" class="status"><div class="brand">NOTRE TABLE</div><p>…</p></div>
<div id="app" class="hidden">
  <div class="brand">NOTRE TABLE</div><p id="who" class="who"></p><h1 id="question" class="question"></h1>
  <div id="choiceWrap" class="hidden"><div id="choiceTitle" class="section"></div><div id="choices" class="choiceGrid"></div></div>
  <div id="presenceWrap"><div id="presenceTitle" class="section"></div><div class="presence"><button class="btn" data-presence="yes"></button><button class="btn" data-presence="no"></button><button class="btn" data-presence="maybe"></button></div></div>
  <div id="takeWrap" class="takeBox hidden"><button id="takeBtn" class="btn takeBtn"></button><div id="takeInfo" class="takeInfo"></div></div>
  <div id="noteWrap"><div id="noteTitle" class="section"></div><textarea id="note" class="note" maxlength="500"></textarea><button id="noteSave" class="btn noteSave"></button></div>
  <div id="saved" class="saved"></div>
  <div class="section" id="boardTitle"></div><div id="board"></div>
  <div id="takeSummary" class="takeSummary hidden"></div>
  <div id="notesTitle" class="section hidden"></div><div id="notesList" class="notesList"></div>
</div>
<div id="error" class="status hidden"><div class="brand">NOTRE TABLE</div><h1 id="errorTitle"></h1><p id="errorText"></p></div>
</main>
<script>
(()=>{
const I={
fr:{q:'Qu’est-ce qui te ferait plaisir ?',choices:'Ton choix',presence:'Tu seras là ?',yes:'✅ Oui',no:'❌ Non',maybe:'🤷 Peut-être',take:'Je prends les choses en main',takeBy:n=>'C’est '+n+' qui prend les choses en main.',takeFree:'Personne ne prend encore les choses en main.',note:'Un petit mot ou une précision',notePh:'Écris ce que tu veux ajouter…',saveNote:'Enregistrer le message',saved:'C’est enregistré ✓',board:'Les choix de la famille',family:'Famille',waiting:'—',notes:'Messages',invalid:'Ce lien a expiré.',retry:'Demande simplement un nouveau lien à l’organisateur.',home:'Plat fait maison',pizza:'Pizza',pasta:'Pâtes',sushi:'Sushi',chinese:'Chinois'},
en:{q:'What would you like?',choices:'Your choice',presence:'Will you be there?',yes:'✅ Yes',no:'❌ No',maybe:'🤷 Maybe',take:'I’ll take care of everything',takeBy:n=>n+' is taking care of everything.',takeFree:'No one is taking charge yet.',note:'A note or detail',notePh:'Write anything you want to add…',saveNote:'Save message',saved:'Saved ✓',board:'Family choices',family:'Family',waiting:'—',notes:'Messages',invalid:'This link has expired.',retry:'Ask the organizer for a new link.',home:'Home-cooked',pizza:'Pizza',pasta:'Pasta',sushi:'Sushi',chinese:'Chinese'},
es:{q:'¿Qué te apetece?',choices:'Tu elección',presence:'¿Estarás?',yes:'✅ Sí',no:'❌ No',maybe:'🤷 Quizás',take:'Yo me encargo de todo',takeBy:n=>n+' se encarga de todo.',takeFree:'Nadie se encarga todavía.',note:'Un mensaje o detalle',notePh:'Escribe lo que quieras añadir…',saveNote:'Guardar mensaje',saved:'Guardado ✓',board:'Elecciones de la familia',family:'Familia',waiting:'—',notes:'Mensajes',invalid:'Este enlace ha caducado.',retry:'Pide un nuevo enlace al organizador.',home:'Comida casera',pizza:'Pizza',pasta:'Pasta',sushi:'Sushi',chinese:'Chino'},
he:{q:'מה מתחשק לך?',choices:'הבחירה שלך',presence:'תהיה/תהיי?',yes:'✅ כן',no:'❌ לא',maybe:'🤷 אולי',take:'אני לוקח/ת הכל על עצמי',takeBy:n=>n+' לוקח/ת את הכל על עצמו/ה.',takeFree:'אף אחד עדיין לא לקח אחריות.',note:'הודעה או פרט נוסף',notePh:'אפשר לכתוב כל דבר שתרצו להוסיף…',saveNote:'שמירת הודעה',saved:'נשמר ✓',board:'בחירות המשפחה',family:'משפחה',waiting:'—',notes:'הודעות',invalid:'תוקף הקישור פג.',retry:'אפשר לבקש קישור חדש ממארגן הארוחה.',home:'אוכל ביתי',pizza:'פיצה',pasta:'פסטה',sushi:'סושי',chinese:'סיני'}
};
const icons={home:'🍲',pizza:'🍕',pasta:'🍝',sushi:'🍣',chinese:'🥡'};
const lang=(navigator.language||'fr').toLowerCase().startsWith('he')?'he':(navigator.language||'fr').toLowerCase().startsWith('es')?'es':(navigator.language||'fr').toLowerCase().startsWith('en')?'en':'fr',t=I[lang];
document.documentElement.lang=lang;document.documentElement.dir=lang==='he'?'rtl':'ltr';
const $=id=>document.getElementById(id),loading=$('loading'),app=$('app'),errorBox=$('error');
let token=(location.hash||'').replace(/^#(?:t=)?/,'').trim(),context=null,selected=null,presence='yes',takesCharge=false,busy=false,poll=null;
history.replaceState({},'',location.pathname+location.search);
function fail(){loading.classList.add('hidden');app.classList.add('hidden');errorBox.classList.remove('hidden');$('errorTitle').textContent=t.invalid;$('errorText').textContent=t.retry;if(poll)clearInterval(poll);}
async function call(body){const r=await fetch(location.pathname+location.search,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store'});const j=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(j.error||'ERROR');e.payload=j;throw e}return j;}
function markSaved(){const el=$('saved');el.textContent=t.saved;setTimeout(()=>{if(el.textContent===t.saved)el.textContent='';},1600);}
function updateControls(){
  document.querySelectorAll('.choice').forEach(b=>b.classList.toggle('on',b.dataset.choice===selected));
  document.querySelectorAll('[data-presence]').forEach(b=>b.classList.toggle('on',b.dataset.presence===presence));
  $('takeBtn').classList.toggle('on',takesCharge);
  $('takeBtn').textContent=(takesCharge?'☑ ':'☐ ')+t.take;
  const other=context?.take_charge_name&&context.take_charge_name!==context.member_name?context.take_charge_name:null;
  $('takeBtn').disabled=busy||Boolean(other);
  $('takeInfo').textContent=other?t.takeBy(other):(takesCharge?t.takeBy(context.member_name):t.takeFree);
}
function renderBoard(board){
  const recipients=Array.isArray(board?.recipients)?board.recipients:[];
  const options=Array.isArray(board?.desire_options)?board.desire_options:(context?.desire_options||[]);
  const counts={};for(const o of options)counts[o]=recipients.filter(r=>r.desire===o).length;
  let html='<div class="boardWrap"><table class="board"><thead><tr><th>'+t.family+'</th>';
  for(const o of options)html+='<th><span class="boardIcon">'+(icons[o]||'')+'</span>'+escapeHtml(t[o]||o)+'<span class="boardCount">'+(counts[o]||0)+'</span></th>';
  html+='</tr></thead><tbody>';
  for(const r of recipients){html+='<tr><td>'+escapeHtml(r.member_name||'')+'</td>';for(const o of options)html+='<td>'+(r.desire===o?'<span class="greenTick">✓</span>':'<span class="waiting">'+t.waiting+'</span>')+'</td>';html+='</tr>'}
  html+='</tbody></table></div>';$('board').innerHTML=html;
  const charge=board?.take_charge_name||null;$('takeSummary').classList.toggle('hidden',!charge);$('takeSummary').innerHTML=charge?'<strong>✓ '+escapeHtml(t.take)+'</strong>'+escapeHtml(charge):'';
  const notes=recipients.filter(r=>typeof r.note==='string'&&r.note.trim());$('notesTitle').classList.toggle('hidden',!notes.length);$('notesTitle').textContent=t.notes;$('notesList').innerHTML=notes.map(r=>'<div class="noteItem"><div class="noteName">'+escapeHtml(r.member_name)+'</div><div class="noteText">'+escapeHtml(r.note)+'</div></div>').join('');
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
async function refreshBoard(){
  if(!token)return;
  try{const board=await call({action:'board',token});context.take_charge_name=board.take_charge_name||null;renderBoard(board);updateControls();}catch(e){if(String(e.message).includes('LINK_INVALID'))fail();}
}
async function save(){
  if(busy||!token)return;busy=true;updateControls();
  try{
    await call({action:'submit',token,presence,desire:selected,note:($('note').value||'').trim(),takes_charge:takesCharge});
    markSaved();await refreshBoard();
  }catch(e){
    if(String(e.message).startsWith('QUESTION_TAKEN_OVER')){takesCharge=false;await refreshBoard();}
    else if(String(e.message).includes('LINK_INVALID'))fail();
  }finally{busy=false;updateControls();}
}
function buildChoices(options){
  $('choices').innerHTML='';
  for(const o of options){const b=document.createElement('button');b.className='choice';b.dataset.choice=o;b.innerHTML='<span class="icon">'+(icons[o]||'')+'</span>'+escapeHtml(t[o]||o)+'<span class="tick">✓</span>';b.addEventListener('click',()=>{selected=selected===o?null:o;if(presence==='no'&&selected)presence='yes';updateControls();void save();});$('choices').appendChild(b);}
}
async function start(){
  if(!/^[a-f0-9]{64}$/i.test(token)){fail();return}
  try{
    const c=await call({action:'context',token});context=c;loading.classList.add('hidden');app.classList.remove('hidden');
    $('who').textContent=c.member_name+' · '+c.household_name;$('question').textContent=t.q;$('choiceTitle').textContent=t.choices;$('presenceTitle').textContent=t.presence;$('boardTitle').textContent=t.board;$('noteTitle').textContent=t.note;$('note').placeholder=t.notePh;$('noteSave').textContent=t.saveNote;$('takeBtn').textContent='☐ '+t.take;
    const current=c.current_response||null;selected=current?.desire||null;presence=current?.presence||'yes';takesCharge=Boolean(current?.takes_charge);$('note').value=current?.note||'';
    const options=Array.isArray(c.desire_options)?c.desire_options:[];if(c.allow_desire&&options.length){$('choiceWrap').classList.remove('hidden');buildChoices(options);}if(!c.allow_presence)$('presenceWrap').classList.add('hidden');if(c.allow_take_charge)$('takeWrap').classList.remove('hidden');
    const pb=document.querySelectorAll('[data-presence]');pb[0].textContent=t.yes;pb[1].textContent=t.no;pb[2].textContent=t.maybe;pb.forEach(b=>b.addEventListener('click',()=>{presence=b.dataset.presence||'yes';if(presence==='no'){selected=null;takesCharge=false;}updateControls();void save();}));
    $('takeBtn').addEventListener('click',()=>{if($('takeBtn').disabled)return;takesCharge=!takesCharge;if(takesCharge&&presence==='no')presence='yes';updateControls();void save();});
    $('noteSave').addEventListener('click',()=>void save());
    renderBoard({desire_options:options,take_charge_name:c.take_charge_name,recipients:c.recipients||[]});updateControls();
    poll=setInterval(()=>void refreshBoard(),4000);
  }catch{fail();}
}
start();
})();
</script></body></html>`,{status:200,headers});
}

type Context={
  member_name:string;member_age:number|null;member_relation:'spouse'|'child'|'other';
  household_name:string;meal_date:string;meal_type:string;desire_options:string[];
  allow_presence:boolean;allow_desire:boolean;allow_take_charge:boolean;allow_note:boolean;
  expires_at:string;take_charge_name:string|null;current_response:unknown;recipients:unknown[];
};

Deno.serve(async(req:Request)=>{
  if(req.method==='GET')return htmlShell();
  if(req.method!=='POST')return json(405,{error:'METHOD_NOT_ALLOWED'});
  try{
    const url=Deno.env.get('SUPABASE_URL');if(!url)return json(500,{error:'SERVER_CONFIGURATION_ERROR'});
    const body=await req.json().catch(()=>({}));const action=typeof body?.action==='string'?body.action:'';
    const token=typeof body?.token==='string'?body.token.trim():'';
    if(!/^[a-f0-9]{64}$/i.test(token))return json(410,{error:'LINK_INVALID_OR_EXPIRED'});
    const admin=createClient(url,defaultSecretKey(),{auth:{autoRefreshToken:false,persistSession:false}});

    if(action==='context'){
      const result=await admin.rpc('get_light_response_context',{p_token:token});
      if(result.error)throw result.error;if(!result.data)return json(410,{error:'LINK_INVALID_OR_EXPIRED'});
      return json(200,result.data as Context);
    }
    if(action==='board'){
      const result=await admin.rpc('get_light_family_decisions',{p_token:token});
      if(result.error)throw result.error;if(!result.data)return json(410,{error:'LINK_INVALID_OR_EXPIRED'});
      return json(200,result.data);
    }
    if(action==='submit'){
      const presence=typeof body?.presence==='string'?body.presence:'yes';
      const desire=typeof body?.desire==='string'?body.desire:null;
      const note=typeof body?.note==='string'?body.note.slice(0,500):null;
      const takesCharge=body?.takes_charge===true;
      const result=await admin.rpc('submit_light_response',{p_token:token,p_presence:presence,p_desire:desire,p_note:note,p_takes_charge:takesCharge});
      if(result.error){
        const message=String(result.error.message||'');
        if(message.includes('TOKEN_INVALID_OR_USED'))return json(410,{error:'LINK_INVALID_OR_EXPIRED'});
        if(message.includes('QUESTION_TAKEN_OVER'))return json(409,{error:'QUESTION_TAKEN_OVER'});
        if(message.includes('DESIRE_NOT_OFFERED')||message.includes('INVALID_PRESENCE')||message.includes('INVALID_RESPONSE')||message.includes('RESPONSE_NOT_ALLOWED_FOR_AGE')||message.includes('NOTE_TOO_LONG'))return json(400,{error:'INVALID_RESPONSE'});
        throw result.error;
      }
      return json(200,{ok:true});
    }
    return json(400,{error:'INVALID_ACTION'});
  }catch(error){
    console.error('light-response failed',error);
    return json(500,{error:'RESPONSE_FAILED'});
  }
});
