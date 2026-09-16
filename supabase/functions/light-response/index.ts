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
:root{font-family:ui-rounded,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#253228;background:#f6f1e8}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:20px}.card{width:min(100%,520px);background:#fffdf8;border:1px solid #e8e0d4;border-radius:28px;padding:24px;box-shadow:0 14px 45px rgba(53,65,55,.10)}.brand{font-size:13px;font-weight:900;letter-spacing:.18em;color:#657a68}.who{margin:9px 0 0;color:#7d817d;font-size:14px}.question{font-size:28px;line-height:1.12;margin:10px 0 22px}.section{font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#7d817d;margin:18px 0 8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.btn,.desire{appearance:none;border:1px solid #dfddd6;background:#fff;border-radius:16px;min-height:54px;padding:10px 12px;font:inherit;font-weight:800;color:#26332a;cursor:pointer}.btn:active,.desire:active{transform:scale(.98)}.desire.on{border-color:#7c947e;background:#edf3ec}.take{grid-column:1/-1;background:#f3eee3}.hint{font-size:13px;color:#858783;margin:8px 0 0}.status{padding:28px 10px;text-align:center}.status h1{font-size:25px;margin:0 0 8px}.status p{color:#747974;line-height:1.45}.hidden{display:none}@media(max-width:390px){.card{padding:20px;border-radius:24px}.question{font-size:25px}.grid{gap:8px}.btn,.desire{min-height:52px;padding:9px 8px;font-size:14px}}
</style></head><body><main class="card"><div id="loading" class="status"><div class="brand">NOTRE TABLE</div><p>…</p></div><div id="app" class="hidden"><div class="brand">NOTRE TABLE</div><p id="who" class="who"></p><h1 id="question" class="question"></h1><div id="desireWrap" class="hidden"><div id="desireTitle" class="section"></div><div id="desires" class="grid"></div><p id="desireHint" class="hint"></p></div><div id="presenceTitle" class="section"></div><div class="grid"><button class="btn" data-presence="yes"></button><button class="btn" data-presence="no"></button><button class="btn" data-presence="maybe"></button><button class="btn take" data-presence="take_charge"></button></div></div><div id="done" class="status hidden"><div class="brand">NOTRE TABLE</div><h1 id="doneTitle"></h1><p id="doneText"></p></div></main>
<script>
(()=>{
const I={fr:{q:'Tu seras là pour ce repas ?',presence:'Ta réponse',yes:'✅ Oui',no:'❌ Non',maybe:'🤷 Peut-être',take:'🎁 Je prends les choses en main',desire:'Envie ?',hint:'Facultatif — choisis une envie puis ta présence.',home:'🍲 Plat cuisiné / fait maison',pizza:'🍕 Pizza',pasta:'🍝 Pâtes',sushi:'🍣 Sushi',chinese:'🥡 Chinois',surprise:'✨ Surprends-moi',done:'C’est noté !',doneText:'Ta réponse est revenue dans Notre Table.',invalid:'Ce lien a expiré ou a déjà été utilisé.',retry:'Demande simplement un nouveau lien à l’organisateur.',taken:n=>n+' prend les choses en main 🎁'},en:{q:'Will you be there for this meal?',presence:'Your answer',yes:'✅ Yes',no:'❌ No',maybe:'🤷 Maybe',take:'🎁 I’ll take care of it',desire:'Craving?',hint:'Optional — pick a craving, then your attendance.',home:'🍲 Home-cooked',pizza:'🍕 Pizza',pasta:'🍝 Pasta',sushi:'🍣 Sushi',chinese:'🥡 Chinese',surprise:'✨ Surprise me',done:'Got it!',doneText:'Your answer is back in Notre Table.',invalid:'This link has expired or was already used.',retry:'Ask the organizer for a new link.',taken:n=>n+' is taking care of this meal 🎁'},es:{q:'¿Estarás para esta comida?',presence:'Tu respuesta',yes:'✅ Sí',no:'❌ No',maybe:'🤷 Quizás',take:'🎁 Yo me encargo',desire:'¿Te apetece?',hint:'Opcional: elige una opción y luego tu presencia.',home:'🍲 Comida casera',pizza:'🍕 Pizza',pasta:'🍝 Pasta',sushi:'🍣 Sushi',chinese:'🥡 Chino',surprise:'✨ Sorpréndeme',done:'¡Anotado!',doneText:'Tu respuesta ya está en Notre Table.',invalid:'Este enlace caducó o ya fue utilizado.',retry:'Pide un nuevo enlace al organizador.',taken:n=>n+' se encarga de esta comida 🎁'},he:{q:'תהיה/תהיי בארוחה?',presence:'התשובה שלך',yes:'✅ כן',no:'❌ לא',maybe:'🤷 אולי',take:'🎁 אני לוקח/ת את העניינים לידיים',desire:'מתחשק?',hint:'לא חובה — בוחרים מה מתחשק ואז נוכחות.',home:'🍲 אוכל ביתי',pizza:'🍕 פיצה',pasta:'🍝 פסטה',sushi:'🍣 סושי',chinese:'🥡 סיני',surprise:'✨ תפתיעו אותי',done:'רשמנו!',doneText:'התשובה שלך חזרה ל‑Notre Table.',invalid:'הקישור פג תוקף או שכבר השתמשו בו.',retry:'אפשר לבקש קישור חדש ממארגן הארוחה.',taken:n=>n+' לוקח/ת את העניינים לידיים 🎁'}};
const lang=(navigator.language||'fr').toLowerCase().startsWith('he')?'he':(navigator.language||'fr').toLowerCase().startsWith('es')?'es':(navigator.language||'fr').toLowerCase().startsWith('en')?'en':'fr',t=I[lang];document.documentElement.lang=lang;document.documentElement.dir=lang==='he'?'rtl':'ltr';
const $=id=>document.getElementById(id),loading=$('loading'),app=$('app'),done=$('done');let token=(location.hash||'').replace(/^#(?:t=)?/,'').trim(),selected=null,busy=false;
history.replaceState({},'',location.pathname+location.search);
function showError(){loading.classList.add('hidden');app.classList.add('hidden');done.classList.remove('hidden');$('doneTitle').textContent=t.invalid;$('doneText').textContent=t.retry;}
async function call(body){const r=await fetch(location.pathname+location.search,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store'});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'ERROR');return j;}
async function submit(presence,desire=selected){if(busy)return;busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);try{await call({action:'submit',token,presence,desire});token='';app.classList.add('hidden');done.classList.remove('hidden');$('doneTitle').textContent=t.done;$('doneText').textContent=t.doneText;}catch(e){if(String(e&&e.message||e)==='QUESTION_TAKEN_OVER'){try{const c=await call({action:'context',token});if(c.take_charge_name){app.classList.add('hidden');done.classList.remove('hidden');$('doneTitle').textContent=t.taken(c.take_charge_name);$('doneText').textContent='';return}}catch{}}showError();}finally{busy=false;}}
async function start(){if(!/^[a-f0-9]{64}$/i.test(token)){showError();return}try{const c=await call({action:'context',token});loading.classList.add('hidden');if(c.take_charge_name){done.classList.remove('hidden');$('doneTitle').textContent=t.taken(c.take_charge_name);$('doneText').textContent='';return}app.classList.remove('hidden');$('who').textContent=c.member_name+' · '+c.household_name;$('question').textContent=t.q;$('presenceTitle').textContent=t.presence;const pb=document.querySelectorAll('[data-presence]');pb[0].textContent=t.yes;pb[1].textContent=t.no;pb[2].textContent=t.maybe;pb[3].textContent=t.take;pb.forEach(b=>b.addEventListener('click',()=>submit(b.dataset.presence)));
const opts=Array.isArray(c.desire_options)?c.desire_options:[];if(opts.length){$('desireWrap').classList.remove('hidden');$('desireTitle').textContent=t.desire;$('desireHint').textContent=t.hint;for(const o of opts){const b=document.createElement('button');b.className='desire';b.textContent=t[o]||o;b.addEventListener('click',()=>{if(o==='surprise'){submit('yes','surprise');return}selected=selected===o?null:o;document.querySelectorAll('.desire').forEach(x=>x.classList.toggle('on',x===b&&selected===o));});$('desires').appendChild(b);}}}catch{showError();}}
start();
})();
</script></body></html>`,{status:200,headers});
}

type Context={member_name:string;household_name:string;meal_date:string;meal_type:string;desire_options:string[];expires_at:string;take_charge_name:string|null};

Deno.serve(async(req:Request)=>{
  if(req.method==='GET')return htmlShell();
  if(req.method!=='POST')return json(405,{error:'METHOD_NOT_ALLOWED'});
  try{
    const url=Deno.env.get('SUPABASE_URL');
    if(!url)return json(500,{error:'SERVER_CONFIGURATION_ERROR'});
    const body=await req.json().catch(()=>({}));
    const action=typeof body?.action==='string'?body.action:'';
    const token=typeof body?.token==='string'?body.token.trim():'';
    if(!/^[a-f0-9]{64}$/i.test(token))return json(410,{error:'LINK_INVALID_OR_EXPIRED'});
    const admin=createClient(url,defaultSecretKey(),{auth:{autoRefreshToken:false,persistSession:false}});
    if(action==='context'){
      const result=await admin.rpc('get_light_response_context',{p_token:token});
      if(result.error)throw result.error;
      if(!result.data)return json(410,{error:'LINK_INVALID_OR_EXPIRED'});
      const context=result.data as Context;
      return json(200,context);
    }
    if(action==='submit'){
      const presence=typeof body?.presence==='string'?body.presence:'';
      const desire=typeof body?.desire==='string'?body.desire:null;
      const result=await admin.rpc('submit_light_response',{p_token:token,p_presence:presence,p_desire:desire});
      if(result.error){
        if(String(result.error.message||'').includes('TOKEN_INVALID_OR_USED'))return json(410,{error:'LINK_INVALID_OR_EXPIRED'});
        if(String(result.error.message||'').includes('QUESTION_TAKEN_OVER'))return json(409,{error:'QUESTION_TAKEN_OVER'});
        if(String(result.error.message||'').includes('DESIRE_NOT_OFFERED')||String(result.error.message||'').includes('INVALID_PRESENCE'))return json(400,{error:'INVALID_RESPONSE'});
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
