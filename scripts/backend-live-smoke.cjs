#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const url=process.env.SUPABASE_URL;
const publishableKey=process.env.SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const smokeTarget=String(process.env.SUPABASE_SMOKE_TARGET||'').trim().toLowerCase();
const destructiveAllowed=process.env.SUPABASE_SMOKE_ALLOW_DESTRUCTIVE==='1';
const expectRevenueCatDeletion=/^(1|true)$/i.test(String(process.env.EXPECT_REVENUECAT_DELETION||''));
const expectPremiumEnforcement=/^(1|true)$/i.test(String(process.env.EXPECT_PREMIUM_ENFORCEMENT||''));
const lightResponseEndpoint=`${String(url||'').replace(/\/$/,'')}/functions/v1/light-response`;
if(!url||!publishableKey||!serviceRoleKey){
  console.error('backend:live-smoke requires SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(2);
}
if(!/^https:\/\//.test(url)){
  console.error('SUPABASE_URL must be HTTPS.');
  process.exit(2);
}
if(!['development','staging'].includes(smokeTarget)||!destructiveAllowed){
  console.error('Refusing destructive smoke. Set SUPABASE_SMOKE_TARGET=development|staging and SUPABASE_SMOKE_ALLOW_DESTRUCTIVE=1.');
  process.exit(2);
}
if(serviceRoleKey===publishableKey||/service[_-]?role/i.test(publishableKey)||/^sb_secret_/i.test(publishableKey)||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)){
  console.error('Publishable and privileged Supabase credentials are not safely separated. SUPABASE_PUBLISHABLE_KEY must use the modern sb_publishable_* format.');
  process.exit(2);
}

const admin=createClient(url,serviceRoleKey,{auth:{autoRefreshToken:false,persistSession:false}});
const suffix=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const password=`Nt-${suffix}-A1!`;
const emails=['a','b','c','d','e'].map(x=>`notre-table-smoke-${x}-${suffix}@example.com`);
const createdUsers=[];
const createdHouseholds=[];
const createdStorageObjects=[];
const AVATAR_BUCKET='profile-avatars';
let originalPremiumEnforcement=null;

const isoDate=(date)=>date.toISOString().slice(0,10);
const addUtcDays=(iso,days)=>{const d=new Date(`${iso}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return isoDate(d);};
const mondayOfCurrentUtcWeek=()=>{const d=new Date();const day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()-(day-1));return isoDate(d);};

async function makeUser(email){
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});
  if(error)throw error;
  createdUsers.push(data.user.id);
  const client=createClient(url,publishableKey,{auth:{autoRefreshToken:false,persistSession:false}});
  const signed=await client.auth.signInWithPassword({email,password});
  if(signed.error)throw signed.error;
  return {client,user:data.user};
}
function trackHousehold(row){
  const id=Array.isArray(row)?row[0]?.id:row?.id;
  if(id&&!createdHouseholds.includes(id))createdHouseholds.push(id);
  return Array.isArray(row)?row[0]:row;
}
function untrackUser(id){const index=createdUsers.indexOf(id);if(index>=0)createdUsers.splice(index,1);}
function untrackHousehold(id){const index=createdHouseholds.indexOf(id);if(index>=0)createdHouseholds.splice(index,1);}
async function cleanup(){
  const failures=[];
  if(originalPremiumEnforcement!==null){
    const {error}=await admin.from('app_release_settings').update({premium_enforcement:originalPremiumEnforcement,updated_at:new Date().toISOString()}).eq('singleton',true);
    if(error)failures.push(`release settings: ${error.message}`);
  }
  if(createdStorageObjects.length){
    const {error}=await admin.storage.from(AVATAR_BUCKET).remove([...new Set(createdStorageObjects)]);
    if(error)failures.push(`storage: ${error.message}`);
  }
  // Remove households before any remaining Auth users so cleanup stays deterministic across schema versions.
  for(const id of [...createdHouseholds].reverse()){
    const {error}=await admin.from('households').delete().eq('id',id);
    if(error)failures.push(`household ${id}: ${error.message}`);
  }
  for(const id of [...createdUsers].reverse()){
    try{
      const {error}=await admin.auth.admin.deleteUser(id);
      if(error)failures.push(`user ${id}: ${error.message}`);
    }catch(error){
      failures.push(`user ${id}: ${error?.message||error}`);
    }
  }
  if(failures.length)throw new Error(`Smoke cleanup failed: ${failures.join(' | ')}`);
}
async function expectDenied(label,promise,{emptyIsDenied=false}={}){
  const result=await promise;
  if(result.error)return;
  if(emptyIsDenied&&Array.isArray(result.data)&&result.data.length===0)return;
  throw new Error(`${label} failed: unauthorized operation was accepted.`);
}
async function expectStorageDenied(label,promise){
  const result=await promise;
  if(result.error||!result.data?.signedUrl)return;
  throw new Error(`${label} failed: unauthorized storage read was accepted.`);
}
async function expectStorageUploadDenied(label,promise,path){
  const result=await promise;
  if(result.error)return;
  createdStorageObjects.push(path);
  throw new Error(`${label} failed: unauthorized storage upload was accepted.`);
}
async function expectPremiumDenied(label,promise){
  const result=await promise;
  if(result.error&&String(result.error.message||'').includes('FAMILY_PLAN_REQUIRED'))return;
  throw new Error(`${label} failed: expected FAMILY_PLAN_REQUIRED.`);
}
async function callRpc(client,name,args,label=name){
  const result=await client.rpc(name,args);
  if(result.error)throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function callLightResponse(body){
  const response=await fetch(lightResponseEndpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),redirect:'error'});
  const data=await response.json().catch(()=>({}));
  return {status:response.status,ok:response.ok,data};
}
async function assertLightResponseShell(){
  const response=await fetch(lightResponseEndpoint,{method:'GET',redirect:'error'});
  const html=await response.text();
  if(response.status!==200||!html.includes('NOTRE TABLE')||!html.includes('location.hash'))throw new Error('light-response Edge Function shell is not deployed or is not the expected public page.');
  if(!String(response.headers.get('cache-control')||'').includes('no-store'))throw new Error('light-response shell must be non-cacheable.');
  if(response.headers.get('referrer-policy')!=='no-referrer')throw new Error('light-response shell must suppress referrers.');
  if(response.headers.get('x-frame-options')!=='DENY')throw new Error('light-response shell must deny framing.');
  if(!String(response.headers.get('content-security-policy')||'').includes("frame-ancestors 'none'"))throw new Error('light-response shell CSP must deny framing.');
}
async function main(){
  const releaseSettings=await admin.from('app_release_settings').select('premium_enforcement').eq('singleton',true).single();
  if(releaseSettings.error)throw new Error(`Premium enforcement settings unavailable: ${releaseSettings.error.message}`);
  originalPremiumEnforcement=Boolean(releaseSettings.data?.premium_enforcement);
  if(expectPremiumEnforcement&&!originalPremiumEnforcement)throw new Error('Production-like smoke requires premium_enforcement=true on the target backend.');

  const A=await makeUser(emails[0]);
  const B=await makeUser(emails[1]);
  const C=await makeUser(emails[2]);

  const createdHouse=await A.client.rpc('create_household',{p_name:`Smoke A ${suffix}`});
  if(createdHouse.error)throw createdHouse.error;
  const hA=trackHousehold(createdHouse.data);
  if(!hA?.id)throw new Error('Household A was not created.');
  await callRpc(A.client,'complete_household_setup',{p_household_id:hA.id,p_display_name:'Smoke A',p_default_party_size:4},'complete_household_setup');
  await callRpc(A.client,'complete_household_family_setup_v2',{p_household_id:hA.id,p_display_name:'Smoke A',p_salutation:'mr',p_age:44,p_phone_number:'+15550001001',p_relationship_status:'married',p_members:[{relation:'spouse',relation_label:null,salutation:'mrs',display_name:'Smoke Partner',age:43,phone_number:'+15550001002'},{relation:'child',relation_label:null,salutation:null,display_name:'Smoke Child',age:12,phone_number:null}]},'complete_household_family_setup_v2');

  if(originalPremiumEnforcement){
    const bootstrapAccess=await admin.from('household_access').upsert({
      household_id:hA.id,plan:'family',payer_user_id:A.user.id,entitlement_id:'family',expires_at:new Date(Date.now()+7*24*60*60*1000).toISOString(),last_verified_at:new Date().toISOString(),updated_at:new Date().toISOString(),
    },{onConflict:'household_id'});
    if(bootstrapAccess.error)throw bootstrapAccess.error;
  }

  const [invitation,invitationConcurrent]=await Promise.all([
    A.client.rpc('create_household_invitation',{p_household_id:hA.id}),
    A.client.rpc('create_household_invitation',{p_household_id:hA.id}),
  ]);
  if(invitation.error)throw invitation.error;
  if(invitationConcurrent.error)throw invitationConcurrent.error;
  if(String(invitationConcurrent.data)!==String(invitation.data))throw new Error('Concurrent invite idempotency failed: simultaneous creation returned two codes.');
  const activeInvitations=await A.client.from('invitations').select('id,code').eq('household_id',hA.id).is('used_by',null).gt('expires_at',new Date().toISOString());
  if(activeInvitations.error||activeInvitations.data?.length!==1)throw activeInvitations.error??new Error('Concurrent invite serialization failed: expected exactly one active invitation.');
  const invitationRepeat=await A.client.rpc('create_household_invitation',{p_household_id:hA.id});
  if(invitationRepeat.error)throw invitationRepeat.error;
  if(String(invitationRepeat.data)!==String(invitation.data))throw new Error('Invite idempotency failed: repeated creation returned a second active code.');
  const joined=await B.client.rpc('join_household_by_code',{p_code:String(invitation.data)});
  if(joined.error)throw joined.error;
  const reusedByC=await C.client.rpc('join_household_by_code',{p_code:String(invitation.data)});
  if(!reusedByC.error)throw new Error('Invite one-use guard failed: a used code joined a second user.');
  const invitationAfterUse=await A.client.rpc('create_household_invitation',{p_household_id:hA.id});
  if(invitationAfterUse.error)throw invitationAfterUse.error;
  if(String(invitationAfterUse.data)===String(invitation.data))throw new Error('Invite rotation failed: a used code was returned again.');

  const D=await makeUser(emails[3]);
  const E=await makeUser(emails[4]);
  const [joinedD,joinedE]=await Promise.all([
    D.client.rpc('join_household_by_code',{p_code:String(invitationAfterUse.data)}),
    E.client.rpc('join_household_by_code',{p_code:String(invitationAfterUse.data)}),
  ]);
  const concurrentJoinResults=[{result:joinedD,user:D.user},{result:joinedE,user:E.user}];
  const concurrentWinners=concurrentJoinResults.filter(x=>!x.result.error);
  const concurrentLosers=concurrentJoinResults.filter(x=>Boolean(x.result.error));
  if(concurrentWinners.length!==1||concurrentLosers.length!==1)throw new Error('Concurrent invite consumption guard failed: exactly one user must consume the code.');
  const consumedInvite=await A.client.from('invitations').select('used_by').eq('household_id',hA.id).eq('code',String(invitationAfterUse.data)).single();
  if(consumedInvite.error||consumedInvite.data?.used_by!==concurrentWinners[0].user.id)throw consumedInvite.error??new Error('Concurrent invite consumption did not record the unique winner.');
  const concurrentMembers=await A.client.from('household_members').select('user_id').eq('household_id',hA.id).in('user_id',[D.user.id,E.user.id]);
  if(concurrentMembers.error||concurrentMembers.data?.length!==1||concurrentMembers.data[0]?.user_id!==concurrentWinners[0].user.id)throw concurrentMembers.error??new Error('Concurrent invite consumption admitted more than one new member.');

  await expectDenied(
    'Member invitation privilege guard',
    B.client.rpc('create_household_invitation',{p_household_id:hA.id}),
  );

  const cHouse=await C.client.rpc('create_household',{p_name:`Smoke C ${suffix}`});
  if(cHouse.error)throw cHouse.error;
  const hC=trackHousehold(cHouse.data);
  if(!hC?.id)throw new Error('Household C was not created.');

  const bRead=await B.client.from('households').select('id,name').eq('id',hA.id);
  if(bRead.error||bRead.data?.length!==1)throw bRead.error??new Error('B cannot read shared household A.');

  const cRead=await C.client.from('households').select('id').eq('id',hA.id);
  if(cRead.error)throw cRead.error;
  if((cRead.data??[]).length!==0)throw new Error('RLS isolation failed: C can read household A.');

  // Household-scoped billing mirror: one payer unlocks the same server truth for every member,
  // outsiders cannot read it, and mobile clients cannot forge it.
  const householdAccessExpiry=new Date(Date.now()+7*24*60*60*1000).toISOString();
  const seededAccess=await admin.from('household_access').upsert({
    household_id:hA.id,plan:'family',payer_user_id:A.user.id,entitlement_id:'family',expires_at:householdAccessExpiry,last_verified_at:new Date().toISOString(),updated_at:new Date().toISOString(),
  },{onConflict:'household_id'});
  if(seededAccess.error)throw seededAccess.error;
  const inheritedAccess=await B.client.from('household_access').select('plan,payer_user_id,expires_at').eq('household_id',hA.id).maybeSingle();
  if(inheritedAccess.error||inheritedAccess.data?.plan!=='family'||inheritedAccess.data?.payer_user_id!==A.user.id)throw inheritedAccess.error??new Error('Household premium inheritance failed: a member did not receive the payer household status.');
  const outsiderAccess=await C.client.from('household_access').select('plan').eq('household_id',hA.id);
  if(outsiderAccess.error)throw outsiderAccess.error;
  if((outsiderAccess.data??[]).length!==0)throw new Error('Cross-household premium read guard failed: outsider read another household billing state.');
  await expectDenied(
    'Household premium client write guard',
    B.client.from('household_access').update({plan:'free'}).eq('household_id',hA.id).select('household_id'),
    {emptyIsDenied:true},
  );

  // LIA navigation quota: one shared household counter, atomic server reservation, no client forgery.
  const navQuotaA=await A.client.rpc('reserve_lia_navigation_trip',{p_household_id:hA.id});
  if(navQuotaA.error||navQuotaA.data?.allowed!==true||Number(navQuotaA.data?.used)!==1||Number(navQuotaA.data?.remaining)!==29)throw navQuotaA.error??new Error('Navigation quota first reservation failed.');
  const navQuotaB=await B.client.rpc('reserve_lia_navigation_trip',{p_household_id:hA.id});
  if(navQuotaB.error||navQuotaB.data?.allowed!==true||Number(navQuotaB.data?.used)!==2||Number(navQuotaB.data?.remaining)!==28)throw navQuotaB.error??new Error('Navigation quota is not shared across household members.');
  await expectDenied('Navigation quota outsider reservation guard',C.client.rpc('reserve_lia_navigation_trip',{p_household_id:hA.id}));
  await expectDenied(
    'Navigation quota client write guard',
    B.client.from('lia_navigation_monthly_usage').update({trips_used:29}).eq('household_id',hA.id).select('household_id'),
    {emptyIsDenied:true},
  );

  await expectDenied(
    'Cross-household shopping insert guard',
    C.client.from('shopping_items').insert({household_id:hA.id,week_start:mondayOfCurrentUtcWeek(),label:'Forbidden insert',aisle:'fresh',source:'manual'}).select('id'),
  );
  await expectDenied(
    'Direct membership escalation guard',
    C.client.from('household_members').insert({household_id:hA.id,user_id:C.user.id,role:'admin'}).select('household_id'),
  );

  // Lightweight member flow: organizer-only phone data, opaque editable links and atomic take-charge.
  const lightMemberId=String(await callRpc(A.client,'create_light_member',{p_household_id:hA.id,p_display_name:'Smoke Light One',p_phone_number:'+15550000001'},'create_light_member'));
  if(!lightMemberId)throw new Error('Light member RPC did not return an id.');
  await callRpc(A.client,'update_light_member',{p_light_member_id:lightMemberId,p_display_name:'Smoke Light One Updated',p_phone_number:'+15550000011',p_active:true},'update_light_member');
  await callRpc(A.client,'set_lia_family_birthday',{p_household_id:hA.id,p_subject_kind:'light_member',p_subject_id:lightMemberId,p_month:3,p_day:12,p_year:null},'set_lia_family_birthday');
  await callRpc(A.client,'set_lia_family_favorite_meal',{p_household_id:hA.id,p_subject_kind:'light_member',p_subject_id:lightMemberId,p_favorite_meal:'lasagnes maison'},'set_lia_family_favorite_meal');
  await expectDenied('Light member update admin guard',B.client.rpc('update_light_member',{p_light_member_id:lightMemberId,p_display_name:'Forbidden',p_phone_number:'+15550000011',p_active:true}));
  const adminLightRead=await A.client.from('light_members').select('id,display_name,phone_number,active').eq('id',lightMemberId).single();
  if(adminLightRead.error||adminLightRead.data?.phone_number!=='+15550000011')throw adminLightRead.error??new Error('Household admin could not read managed light-member phone data.');
  await expectDenied('Light member phone privacy guard',B.client.from('light_members').select('id,phone_number').eq('household_id',hA.id),{emptyIsDenied:true});

  const lightMealDate=addUtcDays(isoDate(new Date()),2);
  const lightExpiresAt=new Date(Date.now()+3*24*60*60*1000).toISOString();
  const lightQuestionId=String(await callRpc(A.client,'upsert_light_meal_question',{p_household_id:hA.id,p_meal_date:lightMealDate,p_meal_type:'dinner',p_desire_options:['pizza','home'],p_expires_at:lightExpiresAt},'upsert_light_meal_question'));
  if(!lightQuestionId)throw new Error('Light meal question RPC did not return an id.');
  await expectDenied('Light question admin guard',B.client.rpc('upsert_light_meal_question',{p_household_id:hA.id,p_meal_date:lightMealDate,p_meal_type:'dinner',p_desire_options:['pizza'],p_expires_at:lightExpiresAt}));
  const firstToken=String(await callRpc(A.client,'issue_light_response_token',{p_question_id:lightQuestionId,p_light_member_id:lightMemberId},'issue_light_response_token'));
  if(!/^[a-f0-9]{64}$/i.test(firstToken))throw new Error('Light response token is not a 256-bit hex bearer.');
  await expectDenied('Light token hash client read guard',A.client.from('light_response_tokens').select('token_hash').limit(1));
  await assertLightResponseShell();
  const firstContext=await callLightResponse({action:'context',token:firstToken});
  if(firstContext.status!==200||firstContext.data?.member_name!=='Smoke Light One Updated'||firstContext.data?.phone_number!==undefined||firstContext.data?.light_member_id!==undefined)throw new Error('Light response Edge context leaked identifiers or lost the display name.');
  const firstSubmit=await callLightResponse({action:'submit',token:firstToken,presence:'yes',desire:'pizza'});
  if(firstSubmit.status!==200||firstSubmit.data?.ok!==true)throw new Error('Light response Edge submit failed.');
  const replay=await callLightResponse({action:'submit',token:firstToken,presence:'yes',desire:'home',note:'changed my mind'});
  if(replay.status!==200||replay.data?.ok!==true)throw new Error('Light response editable-link update failed.');
  const firstSummary=await A.client.rpc('get_light_meal_summary',{p_question_id:lightQuestionId});
  if(firstSummary.error||Number(firstSummary.data?.total)!==1||Number(firstSummary.data?.presence?.yes)!==1||Number(firstSummary.data?.desires?.home)!==1||Number(firstSummary.data?.desires?.pizza)!==0)throw firstSummary.error??new Error('Light meal summary did not reflect the edited response.');
  await callRpc(A.client,'set_lia_family_home_style',{p_question_id:lightQuestionId,p_style:'easy'},'set_lia_family_home_style');
  await expectDenied('Home-style admin guard',B.client.rpc('set_lia_family_home_style',{p_question_id:lightQuestionId,p_style:'impress'}));
  const homeStyleRead=await A.client.from('light_meal_questions').select('lia_home_style').eq('id',lightQuestionId).single();
  if(homeStyleRead.error||homeStyleRead.data?.lia_home_style!=='easy')throw homeStyleRead.error??new Error('LIA home-meal style did not persist.');

  const lightMemberTwo=String(await callRpc(A.client,'create_light_member',{p_household_id:hA.id,p_display_name:'Smoke Light Two',p_phone_number:'+15550000002'},'create_light_member second'));
  await callRpc(A.client,'upsert_light_meal_question',{p_household_id:hA.id,p_meal_date:lightMealDate,p_meal_type:'dinner',p_desire_options:['home'],p_expires_at:lightExpiresAt},'upsert_light_meal_question reset');
  const [takeTokenOne,takeTokenTwo]=await Promise.all([
    A.client.rpc('issue_light_response_token',{p_question_id:lightQuestionId,p_light_member_id:lightMemberId}),
    A.client.rpc('issue_light_response_token',{p_question_id:lightQuestionId,p_light_member_id:lightMemberTwo}),
  ]);
  if(takeTokenOne.error||takeTokenTwo.error)throw takeTokenOne.error??takeTokenTwo.error;
  const takeoverResults=await Promise.all([
    callLightResponse({action:'submit',token:String(takeTokenOne.data),presence:'yes',desire:null,takes_charge:true}),
    callLightResponse({action:'submit',token:String(takeTokenTwo.data),presence:'yes',desire:null,takes_charge:true}),
  ]);
  const takeoverSuccess=takeoverResults.filter(x=>x.status===200&&x.data?.ok===true);
  const takeoverDenied=takeoverResults.filter(x=>x.status===409&&x.data?.error==='QUESTION_TAKEN_OVER');
  if(takeoverSuccess.length!==1||takeoverDenied.length!==1)throw new Error('Concurrent take-charge serialization failed through light-response Edge Function: expected one winner and one refusal.');
  const losingIndex=takeoverResults.findIndex(x=>x.status===409);
  const losingToken=losingIndex===0?String(takeTokenOne.data):String(takeTokenTwo.data);
  const takenContext=await callLightResponse({action:'context',token:losingToken});
  if(takenContext.status!==200||!takenContext.data?.take_charge_name)throw new Error('Light-response Edge Function did not expose the take-charge winner to remaining valid links.');
  const takeoverSummary=await A.client.rpc('get_light_meal_summary',{p_question_id:lightQuestionId});
  if(takeoverSummary.error||Number(takeoverSummary.data?.total)!==1||Number(takeoverSummary.data?.presence?.take_charge)!==1||!takeoverSummary.data?.take_charge_name)throw takeoverSummary.error??new Error('Take-charge summary did not preserve the single winner.');

  // Exercise every client RPC against the real backend contract.
  const week=mondayOfCurrentUtcWeek();
  const previousWeek=addUtcDays(week,-7);
  const recipeId=String(await callRpc(A.client,'create_recipe_with_ingredients',{
    p_household_id:hA.id,
    p_title:`Smoke recipe ${suffix}`,
    p_prep_minutes:5,
    p_cook_minutes:10,
    p_portions:4,
    p_tags:['smoke'],
    p_steps:['Smoke step'],
    p_ingredients:[{name:'Tomato',normalized_key:'tomato',quantity:2,unit:'piece',aisle:'produce'}],
    p_source_url:null,
    p_photo_url:null,
    p_source_language:'en',
    p_difficulty:'easy',
  },'create_recipe_with_ingredients'));
  if(!recipeId||recipeId==='null')throw new Error('Recipe RPC returned no id.');

  const previousMealId=String(await callRpc(A.client,'set_meal_slot',{
    p_household_id:hA.id,p_meal_date:previousWeek,p_meal_type:'dinner',p_recipe_id:recipeId,p_custom_title:null,p_notes:'smoke previous',p_servings:2,p_meal_mode:'fresh',p_leftover_from_meal_id:null,p_cook_user_id:A.user.id,p_participant_user_ids:[A.user.id,B.user.id],p_guest_names:['Smoke Previous Guest'],
  },'set_meal_slot previous week'));
  if(!previousMealId||previousMealId==='null')throw new Error('set_meal_slot returned no id.');

  const concurrentCopies=await Promise.all([
    callRpc(A.client,'copy_previous_week',{p_household_id:hA.id,p_target_week_start:week},'copy_previous_week concurrent A'),
    callRpc(B.client,'copy_previous_week',{p_household_id:hA.id,p_target_week_start:week},'copy_previous_week concurrent B'),
  ]);
  if(concurrentCopies.some(value=>!(Number(value)>=1)))throw new Error('Concurrent previous-week copy did not report the copied meal for both callers.');
  const copiedMeal=await A.client.from('meal_plans').select('id,cook_user_id').eq('household_id',hA.id).eq('meal_date',week).eq('meal_type','dinner');
  if(copiedMeal.error||copiedMeal.data?.length!==1)throw copiedMeal.error??new Error('Concurrent previous-week copy created a duplicate or missing target meal.');
  const copiedMealId=copiedMeal.data[0].id;
  const copiedParticipants=await A.client.from('meal_participants').select('user_id,eating').eq('meal_plan_id',copiedMealId);
  if(copiedParticipants.error)throw copiedParticipants.error;
  const copiedParticipantSet=new Set((copiedParticipants.data??[]).filter(row=>row.eating).map(row=>row.user_id));
  if(copiedParticipantSet.size!==2||!copiedParticipantSet.has(A.user.id)||!copiedParticipantSet.has(B.user.id))throw new Error('Concurrent previous-week copy did not preserve the exact participant set.');
  const copiedGuests=await A.client.from('meal_guests').select('name').eq('meal_plan_id',copiedMealId);
  if(copiedGuests.error||copiedGuests.data?.length!==1||copiedGuests.data[0]?.name!=='Smoke Previous Guest')throw copiedGuests.error??new Error('Concurrent previous-week copy did not preserve exactly one guest.');

  const lunchDate=addUtcDays(week,1);
  const currentMealId=String(await callRpc(A.client,'set_meal_slot',{
    p_household_id:hA.id,p_meal_date:lunchDate,p_meal_type:'lunch',p_recipe_id:recipeId,p_custom_title:null,p_notes:'smoke current',p_servings:3,p_meal_mode:'fresh',p_leftover_from_meal_id:null,p_cook_user_id:B.user.id,p_participant_user_ids:[A.user.id,B.user.id],p_guest_names:['Smoke Guest',' smoke guest '],
  },'set_meal_slot current week'));
  if(!currentMealId||currentMealId==='null')throw new Error('Current meal RPC returned no id.');

  const atomicMeal=await A.client.from('meal_plans').select('cook_user_id').eq('id',currentMealId).single();
  if(atomicMeal.error||atomicMeal.data?.cook_user_id!==B.user.id)throw atomicMeal.error??new Error('Atomic meal RPC did not persist cook.');
  const atomicParticipants=await A.client.from('meal_participants').select('user_id').eq('meal_plan_id',currentMealId);
  if(atomicParticipants.error)throw atomicParticipants.error;
  const participantSet=new Set((atomicParticipants.data??[]).map(row=>row.user_id));
  if(participantSet.size!==2||!participantSet.has(A.user.id)||!participantSet.has(B.user.id))throw new Error('Atomic meal RPC did not persist exact participants.');
  const atomicGuests=await A.client.from('meal_guests').select('name').eq('meal_plan_id',currentMealId);
  if(atomicGuests.error||atomicGuests.data?.length!==1||atomicGuests.data[0]?.name?.trim().toLowerCase()!=='smoke guest')throw atomicGuests.error??new Error('Atomic meal RPC did not normalize/persist guests.');
  const forbiddenMeal=await A.client.rpc('set_meal_slot',{
    p_household_id:hA.id,p_meal_date:lunchDate,p_meal_type:'lunch',p_recipe_id:recipeId,p_custom_title:null,p_notes:'must rollback',p_servings:3,p_meal_mode:'fresh',p_leftover_from_meal_id:null,p_cook_user_id:B.user.id,p_participant_user_ids:[C.user.id],p_guest_names:['Must Not Persist'],
  });
  if(!forbiddenMeal.error)throw new Error('Atomic meal participant guard accepted an outsider.');
  const afterDeniedParticipants=await A.client.from('meal_participants').select('user_id').eq('meal_plan_id',currentMealId);
  if(afterDeniedParticipants.error)throw afterDeniedParticipants.error;
  const afterDeniedSet=new Set((afterDeniedParticipants.data??[]).map(row=>row.user_id));
  if(afterDeniedSet.size!==2||!afterDeniedSet.has(A.user.id)||!afterDeniedSet.has(B.user.id))throw new Error('Denied atomic meal mutation changed participants.');

  const pantryId=String(await callRpc(A.client,'upsert_pantry_item',{
    p_household_id:hA.id,p_label:'Smoke onion',p_ingredient_key:'onion',p_quantity:1,p_unit:'piece',p_aisle:'produce',p_expires_on:addUtcDays(week,5),
  },'upsert_pantry_item'));
  if(!pantryId||pantryId==='null')throw new Error('Pantry RPC returned no id.');

  const concurrentPantryKey=`smoke-rice-${suffix}`;
  const pantryArgs={p_household_id:hA.id,p_label:'Smoke rice',p_ingredient_key:concurrentPantryKey,p_unit:'kg',p_aisle:'pantry',p_expires_on:null};
  await Promise.all([
    callRpc(A.client,'upsert_pantry_item',{...pantryArgs,p_quantity:2},'concurrent pantry A'),
    callRpc(B.client,'upsert_pantry_item',{...pantryArgs,p_quantity:3},'concurrent pantry B'),
  ]);
  const concurrentPantry=await A.client.from('pantry_items').select('id,quantity').eq('household_id',hA.id).eq('ingredient_key',concurrentPantryKey);
  if(concurrentPantry.error||concurrentPantry.data?.length!==1||Number(concurrentPantry.data[0]?.quantity)!==5)throw concurrentPantry.error??new Error('Concurrent pantry merge failed: expected one row with quantity 5.');

  await Promise.all([
    callRpc(A.client,'rebuild_weekly_shopping_list',{p_household_id:hA.id,p_week_start:week},'concurrent weekly rebuild A'),
    callRpc(B.client,'rebuild_weekly_shopping_list',{p_household_id:hA.id,p_week_start:week},'concurrent weekly rebuild B'),
  ]);
  const generated=await A.client.from('shopping_items').select('id,ingredient_key,source,quantity').eq('household_id',hA.id).eq('week_start',week).eq('source','meal_plan').eq('ingredient_key','tomato');
  if(generated.error||generated.data?.length!==1)throw generated.error??new Error('Concurrent weekly rebuild failed: expected exactly one generated tomato row.');

  const clearTomato=await A.client.from('shopping_items').delete().eq('household_id',hA.id).eq('week_start',week).eq('ingredient_key','tomato');
  if(clearTomato.error)throw clearTomato.error;
  const [touchedA,touchedB]=await Promise.all([
    callRpc(A.client,'add_recipe_to_shopping_list',{p_household_id:hA.id,p_week_start:week,p_recipe_id:recipeId},'concurrent recipe shopping A'),
    callRpc(B.client,'add_recipe_to_shopping_list',{p_household_id:hA.id,p_week_start:week,p_recipe_id:recipeId},'concurrent recipe shopping B'),
  ]);
  if(!(Number(touchedA)>=1&&Number(touchedB)>=1))throw new Error('Concurrent recipe shopping merge failed: RPC touched no ingredient.');
  const mergedRecipeShopping=await A.client.from('shopping_items').select('id,quantity,unit').eq('household_id',hA.id).eq('week_start',week).eq('ingredient_key','tomato').eq('checked',false);
  if(mergedRecipeShopping.error||mergedRecipeShopping.data?.length!==1||Number(mergedRecipeShopping.data[0]?.quantity)!==4)throw mergedRecipeShopping.error??new Error('Concurrent recipe shopping merge failed: expected one tomato row with quantity 4.');

  const manual=await A.client.from('shopping_items').insert({household_id:hA.id,week_start:week,label:'Smoke milk',aisle:'fresh',source:'manual'}).select('id').single();
  if(manual.error)throw manual.error;

  await expectDenied(
    'Cross-household shopping update guard',
    C.client.from('shopping_items').update({checked:true,checked_at:new Date().toISOString()}).eq('id',manual.data.id).select('id'),
    {emptyIsDenied:true},
  );
  await expectDenied(
    'Cross-household shopping delete guard',
    C.client.from('shopping_items').delete().eq('id',manual.data.id).select('id'),
    {emptyIsDenied:true},
  );

  const toggled=await B.client.from('shopping_items').update({checked:true,checked_by:B.user.id,checked_at:new Date().toISOString()}).eq('id',manual.data.id).eq('household_id',hA.id).select('checked,checked_by').single();
  if(toggled.error||toggled.data?.checked!==true||toggled.data?.checked_by!==B.user.id)throw toggled.error??new Error('B could not collaborate on shared shopping.');

  // Storage RLS: owner writes, same-household member reads, outsider cannot read/write.
  const avatarPath=`${A.user.id}/smoke-${suffix}.png`;
  const forbiddenAvatarPath=`${A.user.id}/forbidden-${suffix}.png`;
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZpYQAAAAASUVORK5CYII=','base64');
  createdStorageObjects.push(avatarPath,forbiddenAvatarPath);
  const ownUpload=await A.client.storage.from(AVATAR_BUCKET).upload(avatarPath,png,{contentType:'image/png',upsert:false});
  if(ownUpload.error)throw new Error(`Avatar owner upload failed: ${ownUpload.error.message}`);
  const avatarProfile=await admin.from('profiles').update({avatar_path:avatarPath}).eq('id',A.user.id);
  if(avatarProfile.error)throw new Error(`Avatar profile path setup failed: ${avatarProfile.error.message}`);
  const sharedAvatar=await B.client.storage.from(AVATAR_BUCKET).createSignedUrl(avatarPath,60);
  if(sharedAvatar.error||!sharedAvatar.data?.signedUrl)throw sharedAvatar.error??new Error('Same-household avatar read failed.');
  await expectStorageDenied('Cross-household avatar read guard',C.client.storage.from(AVATAR_BUCKET).createSignedUrl(avatarPath,60));
  await expectStorageUploadDenied('Cross-user avatar upload guard',B.client.storage.from(AVATAR_BUCKET).upload(forbiddenAvatarPath,png,{contentType:'image/png',upsert:false}),forbiddenAvatarPath);

  // Production Premium enforcement: an expired shared household becomes member-read-only,
  // the admin keeps the Free base product, and Family reactivation restores collaboration.
  if(!originalPremiumEnforcement){
    const enablePremium=await admin.from('app_release_settings').update({premium_enforcement:true,updated_at:new Date().toISOString()}).eq('singleton',true);
    if(enablePremium.error)throw new Error(`Could not enable Premium enforcement for smoke: ${enablePremium.error.message}`);
  }
  const expiredAccess=await admin.from('household_access').upsert({
    household_id:hA.id,plan:'family',payer_user_id:A.user.id,entitlement_id:'family',expires_at:new Date(Date.now()-60*1000).toISOString(),last_verified_at:new Date().toISOString(),updated_at:new Date().toISOString(),
  },{onConflict:'household_id'});
  if(expiredAccess.error)throw expiredAccess.error;
  await expectPremiumDenied('Expired Family downgrade did not block member collaboration',B.client.rpc('upsert_pantry_item',{
    p_household_id:hA.id,p_label:'Member blocked after downgrade',p_ingredient_key:`downgrade-member-${suffix}`,p_quantity:1,p_unit:'piece',p_aisle:'pantry',p_expires_on:null,
  }));
  const adminFreeWrite=await A.client.rpc('upsert_pantry_item',{
    p_household_id:hA.id,p_label:'Admin Free write',p_ingredient_key:`downgrade-admin-${suffix}`,p_quantity:1,p_unit:'piece',p_aisle:'pantry',p_expires_on:null,
  });
  if(adminFreeWrite.error)throw new Error(`Free admin base write failed after downgrade: ${adminFreeWrite.error.message}`);
  const reactivateAccess=await admin.from('household_access').upsert({
    household_id:hA.id,plan:'family',payer_user_id:A.user.id,entitlement_id:'family',expires_at:householdAccessExpiry,last_verified_at:new Date().toISOString(),updated_at:new Date().toISOString(),
  },{onConflict:'household_id'});
  if(reactivateAccess.error)throw reactivateAccess.error;
  const memberRestored=await B.client.rpc('upsert_pantry_item',{
    p_household_id:hA.id,p_label:'Member restored',p_ingredient_key:`reactivated-member-${suffix}`,p_quantity:1,p_unit:'piece',p_aisle:'pantry',p_expires_on:null,
  });
  if(memberRestored.error)throw new Error(`Family reactivation did not restore member collaboration: ${memberRestored.error.message}`);

  const writeGuard=await B.client.rpc('can_write_household',{p_household_id:hA.id});
  if(writeGuard.error||writeGuard.data!==true)throw writeGuard.error??new Error('can_write_household RPC did not authorize an active Family member.');

  const demoteLastAdmin=await A.client.from('household_members').update({role:'member'}).eq('household_id',hA.id).eq('user_id',A.user.id);
  if(!demoteLastAdmin.error)throw new Error('Last-admin integrity failed: sole admin could be demoted.');

  // Account deletion is a deployed server path, not a mobile service-role shortcut.
  await expectDenied(
    'Account deletion privileged RPC guard',
    A.client.rpc('prepare_account_deletion',{p_user_id:A.user.id}),
  );
  const sharedDelete=await A.client.functions.invoke('delete-account',{body:{confirm:true}});
  if(sharedDelete.error||sharedDelete.data?.deleted!==true)throw sharedDelete.error??new Error('Shared-household account deletion endpoint failed.');
  if(expectRevenueCatDeletion&&sharedDelete.data?.revenuecat_customer_deleted!==true)throw new Error('Shared-household deletion did not prove RevenueCat customer erasure.');
  untrackUser(A.user.id);
  createdStorageObjects.splice(0,createdStorageObjects.length,...createdStorageObjects.filter(path=>path!==avatarPath));

  const sharedHouseAfterDelete=await admin.from('households').select('id,created_by').eq('id',hA.id).maybeSingle();
  if(sharedHouseAfterDelete.error||!sharedHouseAfterDelete.data)throw sharedHouseAfterDelete.error??new Error('Shared-household account deletion did not preserve the household.');
  if(sharedHouseAfterDelete.data.created_by!==null)throw new Error('Shared-household account deletion retained the deleted creator id.');
  const accessAfterPayerDelete=await admin.from('household_access').select('plan,payer_user_id,expires_at').eq('household_id',hA.id).maybeSingle();
  if(accessAfterPayerDelete.error||accessAfterPayerDelete.data?.plan!=='family'||accessAfterPayerDelete.data?.payer_user_id!==null||accessAfterPayerDelete.data?.expires_at!==householdAccessExpiry)throw accessAfterPayerDelete.error??new Error('Deleted payer did not preserve only the verified paid period for the shared household.');
  const successorAdmin=await admin.from('household_members').select('user_id,role').eq('household_id',hA.id).eq('user_id',B.user.id).maybeSingle();
  if(successorAdmin.error||successorAdmin.data?.role!=='admin')throw successorAdmin.error??new Error('Shared-household account deletion did not promote a successor admin.');
  const deletedAuth=await admin.auth.admin.getUserById(A.user.id);
  if(!deletedAuth.error&&deletedAuth.data?.user)throw new Error('Shared-household account deletion left the Auth user active.');
  const authoredResidue=await Promise.all([
    admin.from('recipes').select('id').eq('created_by',A.user.id),
    admin.from('meal_plans').select('id').eq('created_by',A.user.id),
    admin.from('shopping_items').select('id').eq('created_by',A.user.id),
    admin.from('household_activity').select('id').eq('actor_user_id',A.user.id),
  ]);
  for(const result of authoredResidue){if(result.error)throw result.error;if((result.data??[]).length)throw new Error('Shared-household account deletion left authored personal content.');}
  const avatarResidue=await admin.storage.from(AVATAR_BUCKET).list(A.user.id,{search:`smoke-${suffix}.png`});
  if(avatarResidue.error||(avatarResidue.data??[]).some(object=>object.name===`smoke-${suffix}.png`))throw avatarResidue.error??new Error('Account deletion left the profile avatar object in Storage.');
  const bStillReads=await B.client.from('households').select('id').eq('id',hA.id).maybeSingle();
  if(bStillReads.error||bStillReads.data?.id!==hA.id)throw bStillReads.error??new Error('Successor admin lost access after account deletion.');

  const soloDelete=await C.client.functions.invoke('delete-account',{body:{confirm:true}});
  if(soloDelete.error||soloDelete.data?.deleted!==true)throw soloDelete.error??new Error('Solo-household account deletion endpoint failed.');
  if(expectRevenueCatDeletion&&soloDelete.data?.revenuecat_customer_deleted!==true)throw new Error('Solo-household deletion did not prove RevenueCat customer erasure.');
  untrackUser(C.user.id);
  untrackHousehold(hC.id);
  const soloHouseAfterDelete=await admin.from('households').select('id').eq('id',hC.id);
  if(soloHouseAfterDelete.error||(soloHouseAfterDelete.data??[]).length!==0)throw soloHouseAfterDelete.error??new Error('Solo-household account deletion did not delete the household.');
  const soloAuth=await admin.auth.admin.getUserById(C.user.id);
  if(!soloAuth.error&&soloAuth.data?.user)throw new Error('Solo-household account deletion left the Auth user active.');

  console.log(`PASS backend live smoke: 17/17 client RPCs, light-response Edge end-to-end, invite guards, concurrent pantry/shopping merges, collaboration, cross-household read/write RLS, household subscription RLS, Premium downgrade/reactivation enforcement, avatar storage RLS, last-admin guard, deployed account deletion${expectRevenueCatDeletion?', RevenueCat erasure':''}.`);
}
async function run(){
  let primaryError=null;
  try{await main();}catch(error){primaryError=error;}
  let cleanupError=null;
  try{await cleanup();}catch(error){cleanupError=error;}
  if(primaryError){
    if(cleanupError)console.error(cleanupError?.message||cleanupError);
    throw primaryError;
  }
  if(cleanupError)throw cleanupError;
}
run().then(()=>process.exit(0)).catch((error)=>{
  console.error(error?.message||error);
  process.exit(1);
});
