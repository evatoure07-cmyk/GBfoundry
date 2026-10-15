(function gbApp(){
"use strict";
const STORE="gbfoundry_demo_v2_github", SESSION="gbfoundry_demo_session";
const rolesAdmin=["CEO","COO","Assistant de direction","RH","Responsable commercial","Responsable events"];
const rolesStaff=["Commercial","Récolteur novice","Récolteur","Récolteur confirmé"];
const rights={
"CEO":["orders","quotas","staff","companies","materials","announcements","recruitment","salaries"],
"COO":["orders","quotas","staff","companies","materials","announcements","recruitment","salaries"],
"Assistant de direction":["orders","quotas","staff","companies","materials","announcements","recruitment","salaries"],
"RH":["quotas","staff","recruitment","salaries"],
"Responsable commercial":["orders","companies","materials","announcements"],
"Responsable events":["announcements","recruitment"]
};
const starter=()=>({
version:2,
users:[
{id:"ceo",username:"ceo.gb",password:"Demo1234!",name:"Direction GB",role:"CEO",kind:"admin",active:true},
{id:"coo",username:"coo.gb",password:"Demo1234!",name:"Kiana Sterling",role:"COO",kind:"admin",active:true},
{id:"assistant",username:"silo.sterling",password:"Demo1234!",name:"Silo Sterling",role:"Assistant de direction",kind:"admin",active:true},
{id:"rh",username:"rh.gb",password:"Demo1234!",name:"Responsable RH",role:"RH",kind:"admin",active:true},
{id:"commercial",username:"camille.martin",password:"Demo1234!",name:"Camille Martin",role:"Commercial",kind:"employee",active:true},
{id:"recolteur",username:"noah.laurent",password:"Demo1234!",name:"Noah Laurent",role:"Récolteur novice",kind:"employee",active:true},
{id:"partner",username:"garage.demo",password:"Demo1234!",name:"Garage Démo",role:"Entreprise",kind:"company",companyId:"demo",active:true}
],
companies:[{id:"demo",name:"Garage Démo",frequency:"Hebdomadaires",phone:"444-4444",receivers:[{id:"contact1",name:"Alex",phone:"444-4444",receive:true,pay:true}]}],
materials:[
{id:"lingot",name:"Lingot de métal",detail:"Article d'exemple à remplacer",price:null,unit:"unité",active:true,art:"ingot"},
{id:"minerai",name:"Minerai brut",detail:"Article d'exemple à remplacer",price:null,unit:"unité",active:true,art:"ore"},
{id:"cuivre",name:"Cuivre",detail:"Article d'exemple à remplacer",price:null,unit:"unité",active:true,art:"copper"},
{id:"acier",name:"Pièces métalliques",detail:"Article d'exemple à remplacer",price:null,unit:"unité",active:true,art:"metal"}
],
orders:[], declarations:[], announcements:[],
positions:[{id:"pos1",name:"Récolteur",open:true},{id:"pos2",name:"RH",open:true},{id:"pos3",name:"Responsable events",open:true},{id:"pos4",name:"Commercial",open:true}],
applications:[],
grades:[{role:"Récolteur novice",quota:400,salary:12000},{role:"Récolteur",quota:700,salary:15000},{role:"Récolteur confirmé",quota:1000,salary:18000}],
events:[],missions:[],notifications:[],notes:[]});
let db;
try {db=JSON.parse(localStorage.getItem(STORE)||"null");if(!db||db.version!==2)db=starter()}catch{db=starter()}
db.missions ||= [];db.notifications ||= [];db.notes ||= [];db.orders.forEach(o=>{o.priority ||= "Normale";});db.users.forEach(u=>{u.career ||= [];u.photo ||= "";});
let compact=false, scheduleOffset=0;
let loginKind="admin", page="dashboard", cart={}, modalCredentials=null, publicApply=false;
let sessionId=sessionStorage.getItem(SESSION)||"";
const root=document.getElementById("app");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const E=esc;
const uid=prefix=>prefix+"-"+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const now=()=>new Date().toLocaleString("fr-FR");
const current=()=>db.users.find(x=>x.id===sessionId&&x.active);
const company=()=>db.companies.find(c=>c.id===current()?.companyId);
const save=()=>localStorage.setItem(STORE,JSON.stringify(db));
const director=()=>["CEO","COO","Assistant de direction"].includes(current()?.role);
const notify=(message,target="all")=>db.notifications.unshift({id:uid("N"),message,target,at:Date.now(),readBy:[]});
const avatar=u=>u.photo?`<img class="gbavatar" src="${E(u.photo)}" alt="">`:`<span class="gbavatar">${E((u.name||"?")[0])}</span>`;
const amount=o=>o.items.reduce((a,i)=>a+Number(db.materials.find(m=>m.id===i.id)?.price||0)*Number(i.qty||0),0);
const csv=(name,rows)=>{const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;const blob=new Blob(["\uFEFF"+rows.map(r=>r.map(q).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name+".csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
const money=n=>n==null?"Tarif à confirmer":Number(n).toLocaleString("fr-FR")+" $";
const num=n=>Number(n||0).toLocaleString("fr-FR");
const allowed=p=>Boolean(current()?.kind==="admin"&&rights[current().role]?.includes(p));
const canOrders=()=>allowed("orders")||(current()?.kind==="employee"&&current()?.role==="Commercial");
const log=(type,info)=>db.events.unshift({id:uid("evt"),type,info,by:current()?.username||"public",date:now(),at:Date.now(),discordPending:true});
const toast=msg=>{const t=document.getElementById("toasts");t.textContent=msg;t.classList.add("toast");setTimeout(()=>{t.textContent="";t.classList.remove("toast")},3800)};
const label=(value,cls="")=>`<span class="chip ${cls}">${E(value)}</span>`;
const btn=(txt,act,id="",cls="secondary")=>`<button type="button" class="btn ${cls}" data-action="${act}" data-id="${E(id)}">${txt}</button>`;
const field=(name,title,type="text",value="",required=true,attrs="")=>`<label class="field">${E(title)}<input name="${E(name)}" type="${type}" value="${E(value)}" ${required?"required":""} ${attrs}></label>`;
const textarea=(name,title,required=true)=>`<label class="field">${E(title)}<textarea name="${E(name)}" ${required?"required":""}></textarea></label>`;
const select=(name,title,opts,selected="")=>`<label class="field">${E(title)}<select name="${E(name)}" required>${opts.map(x=>`<option value="${E(x)}" ${x===selected?"selected":""}>${E(x)}</option>`).join("")}</select></label>`;
const empty=(msg="Aucune donnée pour le moment.")=>`<div class="empty">${E(msg)}</div>`;
const header=(over,title,sub="",action="")=>`<div class="pagelead"><div><div class="eyebrow">${E(over)}</div><h1>${E(title)}</h1><p>${E(sub)}</p></div>${action}</div>`;
const table=(titles,rows)=>`<div class="panel tablewrap"><table><thead><tr>${titles.map(t=>`<th>${E(t)}</th>`).join("")}</tr></thead><tbody>${rows.length?rows.join(""):`<tr><td colspan="${titles.length}">Aucune donnée</td></tr>`}</tbody></table></div>`;
const icon=(art)=>({ingot:"▰",ore:"◆",copper:"◈",metal:"⬡"}[art]||"◆");
const illustration=(m)=>`<div class="itemimg" style="display:grid;place-items:center;font-size:48px;color:#db6e2b;text-shadow:2px 3px 0 #797d8340">${icon(m.art)}</div>`;
const frm=(id,inside,submit="Enregistrer")=>`<form id="${id}" class="stack">${inside}<button type="submit" class="btn">${submit}</button></form>`;
const roleKind=r=>rolesAdmin.includes(r)?"admin":"employee";
const allRoles=[...rolesAdmin,...rolesStaff];
const tempPass=()=>{const chars="abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!$";const a=new Uint32Array(12);crypto.getRandomValues(a);return [...a].map(n=>chars[n%chars.length]).join("")};
const gradFor=r=>db.grades.find(g=>g.role===r)||{quota:0,salary:0};
const employeeDeclarations=u=>db.declarations.filter(x=>x.userId===u.id);
const totalApproved=(u)=>employeeDeclarations(u).filter(x=>x.status==="Validée"&&x.week===weekOf(Date.now())).reduce((a,d)=>a+Number(d.quantity),0);
function weekOf(time){const d=new Date(time);d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return d.toISOString().slice(0,10)}
const navigation=()=>{const u=current();if(!u)return[];if(u.kind==="company")return [["catalog","Catalogue"],["orders","Mes commandes"],["receivers","Contacts"],["profile","Mon profil"]];
if(u.kind==="employee"){const out=u.role==="Commercial"?[["orders","Commandes"],["schedule","Planning"],["commercial-history","Mon activité"]]:[["dashboard","Tableau de bord"],["harvest","Mes récoltes"],["inventory","Inventaire"],["missions","Missions"]];return [...out,["announcements","Annonces"],["notifications","Notifications"],["profile","Mon profil"]]}
const out=[["dashboard","Tableau de bord"]];for(const [p,title] of [["orders","Commandes"],["quotas","Quotas à vérifier"],["staff","Équipe & comptes"],["hrnotes","Notes RH"],["employee-card","Cartes employés"],["companies","Partenaires"],["materials","Articles & récoltes"],["salaries","Salaires & grades"],["analytics","Statistiques"],["activity","Journal"],["missions","Missions"],["notifications","Notifications"],["announcements","Annonces"],["recruitment","Recrutement"]])if(allowed(p)||["analytics","activity","missions","notifications","employee-card"].includes(p)&&director()||p==="hrnotes"&&allowed("staff"))out.push([p,title]);out.push(["profile","Mon profil"]);return out};
function login(){
const kinds=[["admin","Administration","◆"],["employee","Employé","⚒"],["company","Entreprise","▣"]];
const application=publicApply?`<div class="panel"><div class="between"><h3>Candidature GB Foundry</h3>${btn("← Retour","back-login")}</div><p class="muted">Choisissez un des postes actuellement ouverts.</p>${frm("apply-form",`<div class="grid g2">${field("name","Nom et prénom RP")}${field("phone","Téléphone", "tel")}</div>${select("position","Poste",db.positions.filter(p=>p.open).map(p=>p.name))}${textarea("motivation","Pourquoi souhaitez-vous rejoindre GB Foundry ?")}`,"Envoyer ma candidature")}</div>`:
`<div class="eyebrow">PORTAIL PROFESSIONNEL</div><h2>Bienvenue chez GB Foundry.</h2><p class="muted">Choisissez votre espace de connexion.</p><div class="loginchoices">${kinds.map(k=>`<button class="loginchoice ${loginKind===k[0]?"selected":""}" data-action="choose-login" data-id="${k[0]}"><span>${k[2]}</span>${k[1]}</button>`).join("")}</div><div class="panel">${frm("login-form",`${field("username","Identifiant","text","",true,'autocomplete="username"')}${field("password","Mot de passe","password","",true,'autocomplete="current-password"')}`,"Se connecter")}<div class="divider"></div><p class="muted">Pour tester : mot de passe <strong>Demo1234!</strong> — comptes de démonstration uniquement.</p><div class="flex">${btn("CEO","demo","ceo","secondary tiny")}${btn("Commercial","demo","commercial","secondary tiny")}${btn("Récolteur","demo","recolteur","secondary tiny")}${btn("Partenaire","demo","partner","secondary tiny")}</div></div><p>${btn("Déposer une candidature","public-apply","","secondary")}</p>`;
root.innerHTML=`<div class="auth"><div class="authart"><img src="logo.png" alt="GB Foundry"><h1>GB FOUNDRY</h1><p>Récolte, production et approvisionnement pour les entreprises de San Andreas.</p><div class="small">Maquette interactive — données enregistrées sur cet appareil uniquement</div></div><div class="authmain"><div class="authinner">${application}</div></div></div>`;
}
function changeFirst(){
const u=current();root.innerHTML=`<div class="auth"><div class="authart"><img src="logo.png"><h1>SÉCURISER MON ACCÈS</h1></div><div class="authmain"><div class="authinner panel"><h2>Premier accès</h2><p>Bonjour ${E(u.name)}. Vous devez remplacer votre mot de passe temporaire.</p>${frm("first-password",`${field("password","Nouveau mot de passe","password","",true,'minlength="8"')}${field("repeat","Confirmer le nouveau mot de passe","password","",true,'minlength="8"')}`,"Enregistrer mon mot de passe")}</div></div></div>`;
}
function renderGroupedNav(nav,u){
const groupOf=id=>({
staff:"RH",hrnotes:"RH",recruitment:"RH",quotas:"Récoltes & quotas",harvest:"Récoltes & quotas",inventory:"Récoltes & quotas",materials:"Récoltes & quotas",missions:"Récoltes & quotas",orders:"Commandes & livraisons",schedule:"Commandes & livraisons","commercial-history":"Commandes & livraisons",companies:"Partenaires",receivers:"Partenaires",salaries:"Gestion",analytics:"Statistiques",activity:"Statistiques",announcements:"Communication",notifications:"Communication",catalog:"Catalogue"})[id]||"Autres";
const item=([id,name])=>`<button class="navbtn ${page===id?"active":""}" data-action="nav" data-id="${id}">${E(name)}</button>`;
const dashboard=nav.filter(n=>n[0]==="dashboard");
const profile=nav.filter(n=>n[0]==="profile");
const grouped={};nav.filter(n=>n[0]!=="dashboard"&&n[0]!=="profile"&&n[0]!=="employee-card"&&n[0]!=="hrnotes"&&n[0]!=="activity"&&n[0]!=="notifications").forEach(n=>(grouped[groupOf(n[0])] ||= []).push(n));
return dashboard.map(item).join("")+Object.entries(grouped).map(([name,items])=>`<details class="navgroup" ${items.some(n=>n[0]===page)?"open":""}><summary>${E(name)}</summary><div class="navchildren">${items.map(item).join("")}</div></details>`).join("")+profile.map(item).join("");
}
function shell(){
const u=current(), nav=navigation();if(!nav.some(n=>n[0]===page))page=nav[0][0];
root.innerHTML=`<div class="shell ${compact?"compact":""}"><aside class="sidebar"><div class="brand"><img src="logo.png" alt="Logo GB Foundry"><div><strong>GB FOUNDRY</strong><small>PORTAIL PROFESSIONNEL</small></div></div><div class="sectionlabel">${u.kind==="admin"?"DIRECTION":u.kind==="company"?"ESPACE PARTENAIRE":"ESPACE INTERNE"}</div><nav class="side-nav">${renderGroupedNav(nav,u)}</nav><div class="sidefoot"><div><strong>${E(u.name)}</strong><br>${E(u.role)}</div><div class="footactions">${btn("Mon profil","nav","profile","secondary tiny")}${btn("Déconnexion","logout","","secondary tiny")}</div></div></aside><main class="content"><div class="top"><span class="eyebrow">GB FOUNDRY / ${E(page.toUpperCase())}</span><div class="topright">${label(u.role,"orange")}</div></div><div id="view">${view()}</div><div style="margin-top:28px" class="small">© GB Foundry · Prévisualisation locale · Les données ne sont pas partagées entre appareils · Discord à connecter</div></main></div>`;
}
function quotaWarnings(){
const week=weekOf(Date.now());
return db.users.filter(u=>u.kind==="employee"&&u.role.startsWith("Récolteur")&&u.active).filter(u=>{
const quota=Number(gradFor(u.role).quota)||0;
const approved=employeeDeclarations(u).filter(d=>d.week===week&&d.status==="Validée").reduce((a,d)=>a+Number(d.quantity),0);
const today=new Date();const day=today.getDay(),hours=today.getHours();
return quota>0&&(day>3||day===3&&hours>=23)&&approved<quota/2;
});
}
function dashboard(){
const u=current();
if(u.kind==="admin"){
let pending=db.declarations.filter(d=>d.status==="En attente").length, opened=db.orders.filter(o=>o.status!=="Livrée"&&o.status!=="Annulée").length;
return `${header("DIRECTION","Tableau de bord","Suivi de l'activité de GB Foundry.")}<div class="hero"><div><div class="eyebrow">ESPACE INTERNE</div><h2>GÉRER. RÉCOLTER. LIVRER.</h2><p>Un point central pour les commandes, les équipes et les quotas.</p></div><img src="logo.png" alt=""></div><div class="grid g4" style="margin-top:18px">${[["Commandes actives",opened],["Quotas à vérifier",pending],["Employés",db.users.filter(x=>x.kind!=="company"&&x.active).length],["Entreprises",db.companies.length]].map(([a,b])=>`<div class="panel stat"><span class="eyebrow">${a}</span><span class="num">${b}</span></div>`).join("")}</div><div class="grid g2" style="margin-top:18px"><div class="panel"><h3>Dernières commandes</h3>${orderRows(db.orders.slice(0,5))}</div><div class="panel"><h3>Déclarations en attente</h3>${declRows(db.declarations.filter(d=>d.status==="En attente").slice(0,5))}</div></div>`;
}
const g=gradFor(u.role), approved=totalApproved(u), left=Math.max(0,g.quota-approved);
const pending=employeeDeclarations(u).filter(d=>d.status==="En attente"&&d.week===weekOf(Date.now())).reduce((a,d)=>a+Number(d.quantity),0);
return `${header("MON ESPACE","Tableau de bord employé","Retrouvez vos objectifs de récolte et votre rémunération indicative.")}<div class="hero"><div><div class="eyebrow">${E(u.role)}</div><h2>LA RÉCOLTE, C'EST SÉRIEUX.</h2><p>Déclarez vos items et votre casier. Seules les déclarations approuvées comptent pour le quota.</p></div><img src="logo.png" alt=""></div><div class="grid g4" style="margin-top:18px"><div class="panel stat"><span class="eyebrow">Quota de la semaine</span><span class="num">${num(g.quota)}</span></div><div class="panel stat"><span class="eyebrow">Validé</span><span class="num">${num(approved)}</span></div><div class="panel stat"><span class="eyebrow">Reste à valider</span><span class="num">${num(left)}</span></div><div class="panel stat"><span class="eyebrow">Salaire maximum</span><span class="num">${money(u.salary??g.salary)}</span></div></div><div class="panel" style="margin-top:18px"><h3>Objectifs par ressource</h3><div class="grid g3">${db.materials.filter(m=>m.active).map(m=>{const ds=employeeDeclarations(u).filter(d=>d.week===weekOf(Date.now())&&d.material===m.name);const val=ds.filter(d=>d.status==="Validée").reduce((a,d)=>a+Number(d.quantity),0);const waiting=ds.filter(d=>d.status==="En attente").reduce((a,d)=>a+Number(d.quantity),0);const goal=g.materialQuotas?.[m.id]??0;return `<div class="listitem"><strong>${E(m.name)}</strong><p>Objectif : ${num(goal)}</p><p>Validé : ${num(val)} · En attente : ${num(waiting)}</p></div>`}).join("")}</div></div><div class="panel" style="margin-top:18px"><div class="between"><h3>Progression hebdomadaire</h3>${label(approved>=g.quota?"Quota atteint":"En cours",approved>=g.quota?"green":"orange")}</div><div style="height:12px;background:#eee;border-radius:20px;margin:17px 0;overflow:hidden"><div style="height:100%;width:${g.quota?Math.min(100,approved/g.quota*100):0}%;background:#f59e0b"></div></div><div style="height:12px;background:#f3f0eb;border-radius:20px;margin-top:-29px;margin-bottom:17px;overflow:hidden"><div style="height:100%;width:${g.quota?Math.min(100,approved/g.quota*100):0}%;background:var(--orange)"></div></div><p class="muted">${num(approved)} validés · ${num(pending)} en attente de vérification · ${num(left)} restants</p>${btn("Déclarer mes récoltes","nav","harvest","dark")}</div>`;
}
function catalog(){
const companyUser=current()?.kind==="company";
return `${header("APPROVISIONNEMENT","Catalogue GB Foundry","Les articles et prix ci-dessous sont provisoires en attendant la liste définitive.")}<div class="grid g3 catalog">${db.materials.filter(m=>m.active).map(m=>`<div class="panel">${illustration(m)}<div><div class="eyebrow">RESSOURCE</div><h3>${E(m.name)}</h3><p class="muted">${E(m.detail)}</p><strong>${money(m.price)}</strong></div>${companyUser?`<div class="flex"><input type="number" min="1" value="1" class="search" style="width:90px" id="qty_${m.id}" aria-label="Quantité">${btn("Ajouter au panier","cart-add",m.id,"dark")}</div>`:""}</div>`).join("")}</div>${companyUser?`<div class="panel" style="margin-top:20px"><div class="between"><h3>Votre panier</h3>${btn("Vider","cart-clear")}</div>${Object.keys(cart).length?`<div class="list">${Object.entries(cart).map(([id,q])=>`<div class="listitem between"><strong>${E(db.materials.find(m=>m.id===id)?.name||id)}</strong><span>${num(q)} unité(s)</span></div>`).join("")}</div><div class="divider"></div>${frm("checkout-form",`${field("deliveryDate","Jour de livraison","date")}${field("deliveryTime","Heure de livraison","time")}${field("iban","IBAN de facturation","text","",true,'autocomplete="off" maxlength="42" placeholder="FR76..."')}`,"Valider la commande")}</div>`:`<p class="muted">Sélectionnez des articles pour commencer une commande.</p></div>`}<p class="notice">Les tarifs ne seront officiels qu'après saisie des prix par la direction.</p>`:""}`;
}
function orderRows(rows){
return rows.length?`<div class="orderstack">${rows.map(o=>{const co=db.companies.find(c=>c.id===o.companyId);return `<details class="panel ordercard"><summary><span><strong>${E(o.id)}</strong><small>${E(co?.name||"Entreprise")} · ${E(o.date)}</small></span><span>${o.priority==="Urgente"?label("URGENTE","red"):""}${label(o.status,o.status==="Livrée"?"green":o.status==="Annulée"?"red":"orange")} <span class="orderchevron">⌄</span></span></summary><div class="orderbody"><div class="grid g2"><div><h3>Articles commandés</h3>${o.items.map(x=>`<div class="orderline"><span>${E(x.name)}</span><strong>× ${num(x.qty)}</strong></div>`).join("")}</div><div><h3>Suivi de livraison</h3><p>Livraison souhaitée : <strong>${E(o.deliveryDate||"Non précisée")} ${E(o.deliveryTime||"")}</strong></p><p>Prise en charge : <strong>${E(o.commercial||"En attente d'un commercial")}</strong></p><p>Facturation : ${o.iban?"IBAN enregistré":"À compléter"}</p>${o.reason?`<p>Motif : ${E(o.reason)}</p>`:""}</div></div><div class="flex" style="margin-top:16px">${allowed("orders")&&o.status!=="Livrée"&&o.status!=="Annulée"?btn(o.priority==="Urgente"?"Retirer priorité":"Marquer urgente","priority-toggle",o.id,"secondary tiny"):""}${canOrders()&&o.status==="Reçue"?btn("Prendre en charge","order-claim",o.id,"dark tiny"):""}${canOrders()&&o.status==="Prise en charge"&&(allowed("orders")||o.commercialId===current()?.id)?btn("Confirmer la livraison","order-deliver",o.id,"tiny"):""}${canOrders()&&o.status!=="Livrée"&&o.status!=="Annulée"?btn("Annuler avec motif","order-cancel",o.id,"secondary tiny"):""}</div></div></details>`}).join("")}</div>`:empty("Aucune commande pour le moment.");
}
function orders(){
const u=current(),rows=u.kind==="company"?db.orders.filter(o=>o.companyId===u.companyId):db.orders;
return `${header("COMMANDES",u.kind==="company"?"Mes commandes":"Gestion des commandes","Commande reçue → Prise en charge par un commercial → Livrée.")}${orderRows(rows)}`;
}
function harvest(){
const u=current();return `${header("RÉCOLTE","Déclarer mes récoltes","Chaque déclaration est contrôlée avant de compter dans votre quota.")}<div class="grid g2"><div class="panel"><h3>Nouvelle déclaration</h3>${frm("harvest-form",`${select("material","Objet récolté",db.materials.filter(m=>m.active).map(m=>m.name))}${field("quantity","Quantité","number","",true,'min="1"')}${field("locker","Casier","text",u.name,true,"readonly")}${textarea("details","Précisions (facultatif)",false)}`,"Envoyer pour validation")}</div><div class="panel"><h3>Mon historique</h3>${declRows(employeeDeclarations(u).slice().reverse())}</div></div>`;
}
function declRows(ds){return ds.length?`<div class="list">${ds.map(d=>`<div class="listitem"><div class="between"><div><strong>${E(d.material)} · ${num(d.quantity)}</strong><p>${E(d.userName||"")} · Casier ${E(d.locker)} · ${E(d.date)}</p>${d.reason?`<p>Motif : ${E(d.reason)}</p>`:""}</div>${label(d.status,d.status==="Validée"?"green":d.status==="Refusée"?"red":"orange")}</div>${allowed("quotas")&&d.status==="En attente"?`<div class="flex" style="margin-top:10px">${btn("Valider","quota-approve",d.id,"tiny")}${btn("Refuser","quota-refuse",d.id,"secondary tiny")}</div>`:""}</div>`).join("")}</div>`:empty("Aucune déclaration.");
}
function quotas(){return `${header("CONTRÔLE","Quotas à vérifier","Validez les récoltes après vérification effective des objets dans les casiers.")}${declRows(db.declarations.filter(d=>d.status==="En attente"))}<div style="margin-top:20px">${header("HISTORIQUE","Déclarations traitées")}${declRows(db.declarations.filter(d=>d.status!=="En attente").slice().reverse().slice(0,30))}</div>`}
function receivers(){
const c=company();return `${header("ENTREPRISE","Contacts","Personnes à contacter pour les livraisons.")}<div class="grid g2"><div class="panel"><h3>Contacts enregistrés</h3>${c.receivers.length?`<div class="list">${c.receivers.map(r=>`<div class="listitem between"><div><strong>${E(r.name)}</strong><p>${E(r.phone)} · Contact</p></div>${btn("Retirer","remove-receiver",r.id,"secondary tiny")}</div>`).join("")}</div>`:empty()}</div><div class="panel"><h3>Ajouter un contact</h3>${frm("receiver-form",`${field("name","Nom et prénom")}${field("phone","Numéro de téléphone","tel")}`,"Ajouter la personne")}</div></div>`}
function staff(){
return `${header("RESSOURCES HUMAINES","Comptes & employés","Gestion des accès et des grades.")}<div class="grid"><div class="panel"><h3>Annuaire interne</h3><input class="employee-search" id="staff-search" placeholder="Rechercher un employé" aria-label="Rechercher un employé"><div class="list">${db.users.filter(x=>x.kind!=="company").map(u=>`<div class="listitem staff-entry" data-search="${E((u.name+" "+u.username+" "+u.role).toLowerCase())}"><div class="between"><div>${avatar(u)} <strong>${E(u.name)}</strong><p>${E(u.username)} · ${E(u.role)}</p></div>${label(u.active?"Actif":"Suspendu",u.active?"green":"red")}</div><div class="flex" style="margin-top:9px">${director()?btn("Promotion / rétrogradation","career-change",u.id,"secondary tiny"):""}${btn("Réinitialiser le mot de passe","reset-account",u.id,"secondary tiny")}${btn(u.active?"Suspendre":"Réactiver","toggle-account",u.id,"secondary tiny")}</div><div class="muted">${(u.career||[]).map(c=>`${E(c.date)} : ${E(c.oldRole)} → ${E(c.newRole)}`).join(" · ")}</div></div>`).join("")}</div></div></div></div>`;
}
function companies(){
return `${header("PARTENARIATS","Comptes entreprises","Gérez les identifiants et les accès des entreprises.")}<div class="grid g2"><div class="panel"><h3>Nouveau partenaire</h3>${frm("company-form",`${field("name","Nom de l'entreprise")}${field("username","Identifiant")}`,"Créer l'accès partenaire")}</div><div class="panel"><h3>Partenaires enregistrés</h3><div class="list">${db.companies.map(c=>`<div class="listitem"><strong>${E(c.name)}</strong><p>${(c.receivers||[]).length} contact(s)</p>${db.users.filter(u=>u.companyId===c.id).map(u=>`<div class="between" style="margin-top:9px"><span>${E(u.username)} ${label(u.active?"Actif":"Suspendu",u.active?"green":"red")}</span><div class="flex">${btn("Réinitialiser","reset-account",u.id,"secondary tiny")}${btn(u.active?"Suspendre":"Réactiver","toggle-account",u.id,"secondary tiny")}</div></div>`).join("")}</div>`).join("")}</div></div></div></div>`;
}
function materials(){
return `${header("RESSOURCES","Articles & récoltes","Ajoutez ou modifiez les matériaux proposés aux entreprises et déclarables par les employés.")}<div class="grid g2"><div class="panel"><h3>Ajouter un article</h3>${frm("material-form",`${field("name","Nom de l'article")}${field("price","Prix à l'unité","number","",true,'min="0"')}`,"Enregistrer l'article")}</div><div class="panel"><h3>Articles existants</h3><div class="list">${db.materials.map(m=>`<div class="listitem"><div class="between"><div><strong>${E(m.name)}</strong><p>${money(m.price)} · ${E(m.detail)}</p></div>${label(m.active?"Disponible":"Masqué",m.active?"green":"red")}</div><div class="flex" style="margin-top:10px">${btn("Modifier","material-edit",m.id,"secondary tiny")}${btn(m.active?"Masquer":"Afficher","material-toggle",m.id,"secondary tiny")}</div></div>`).join("")}</div></div></div></div>`;
}
function salaries(){
return `${header("RÉMUNÉRATION","Grades & salaires","Les valeurs affichées sont des exemples modifiables et ne correspondent à aucun paiement réel.")}<div class="grid g3">${db.grades.map(g=>`<div class="panel"><div class="eyebrow">${E(g.role)}</div><h2 style="margin:14px 0">${num(g.quota)} items</h2><p>Salaire maximum : <strong>${money(g.salary)}</strong></p>${btn("Modifier le barème","grade-edit",g.role,"secondary tiny")}</div>`).join("")}</div><div class="panel" style="margin-top:18px"><h3>Situation des récolteurs</h3>${table(["Nom","Grade","Quota validé / cible","Salaire indicatif"],db.users.filter(u=>u.kind==="employee"&&u.role.startsWith("Récolteur")).map(u=>`<tr><td><strong>${E(u.name)}</strong></td><td>${E(u.role)}</td><td>${num(totalApproved(u))} / ${num(gradFor(u.role).quota)}</td><td>${money(u.salary??gradFor(u.role).salary)}</td></tr>`))}</div>`;
}
function announcements(){
const u=current();
const items=db.announcements.filter(a=>u.kind==="admin"||a.audience==="Tous"||a.audience==="Employés");
return `${header("INFORMATIONS","Annonces GB Foundry","Informations communiquées par la direction.")}${allowed("announcements")?`<div class="panel" style="margin-bottom:20px"><h3>Publier une annonce</h3>${frm("announcement-form",`${field("title","Titre")}${select("audience","Destinataires",["Tous","Employés"])}${textarea("body","Message")}`,"Publier")}</div>`:""}${items.length?`<div class="grid g2">${items.map(a=>`<div class="panel"><div class="between"><div class="eyebrow">${E(a.audience)} · ${E(a.date)}</div>${allowed("announcements")?btn("Retirer","delete-announcement",a.id,"secondary tiny"):""}</div><h3 style="margin:12px 0">${E(a.title)}</h3><p>${E(a.body)}</p>${u.kind==="employee"?btn((a.readBy||[]).includes(u.id)?"Lu et approuvé ✓":"Lu et approuvé","ack-announcement",a.id,"secondary tiny"):""}</div>`).join("")}</div>`:empty("Aucune annonce publiée.")}`;
}
function recruitment(){
const admin=allowed("recruitment");
return `${header("NOUS REJOINDRE","Recrutement","Suivi des postes ouverts et des candidatures.")}${admin?`<div class="grid g2"><div class="panel"><h3>Ouvrir un poste</h3>${frm("position-form",`${select("position","Poste",["Récolteur","RH","Responsable events","Commercial","Responsable commercial","Assistant de direction"])}`,"Ajouter le poste")}<div class="divider"></div>${db.positions.map(p=>`<div class="listitem between"><strong>${E(p.name)}</strong>${btn(p.open?"Fermer":"Ouvrir","toggle-position",p.id,"secondary tiny")}</div>`).join("")}</div><div class="panel"><h3>Candidatures reçues</h3>${db.applications.length?db.applications.slice().map(a=>`<div class="listitem"><strong>${E(a.name)} · ${E(a.position)}</strong><p>${E(a.phone)} · ${E(a.date)}</p><p>${E(a.motivation)}</p>${btn("Supprimer la candidature","delete-application",a.id,"secondary tiny")}</div>`).join(""):empty()}</div></div>`:`<div class="panel"><h3>Postes actuellement recherchés</h3><div class="grid g3">${db.positions.filter(p=>p.open).map(p=>`<div class="listitem"><strong>${E(p.name)}</strong><p>Recrutement ouvert</p></div>`).join("")}</div><p>Pour candidater, utilisez le formulaire accessible depuis l'écran de connexion.</p></div>`}`;
}
function profile(){
const u=current();return `${header("IDENTITÉ","Mon profil","Vos informations de connexion.")}<div class="grid g2"><div class="panel"><div class="flex">${avatar(u)}<h3>${E(u.name)}</h3></div><div class="divider"></div><p>Identifiant : <strong>${E(u.username)}</strong></p><p>Accès : <strong>${E(u.role)}</strong></p><p>Statut : ${label(u.active?"Actif":"Suspendu",u.active?"green":"red")}</p></div><div class="panel"><h3>Modifier mon mot de passe</h3>${frm("password-form",`${field("oldPassword","Mot de passe actuel","password")}${field("password","Nouveau mot de passe","password","",true,'minlength="8"')}${field("repeat","Confirmation","password","",true,'minlength="8"')}`,"Mettre à jour")}</div></div>`;
}

function inventory(){const u=current(),ds=db.declarations.filter(d=>d.userId===u.id);return header("RÉCOLTES","Inventaire personnel","Déclarations en attente et validées.")+table(["Matériau","Validé","En attente"],db.materials.map(m=>{const rows=ds.filter(d=>d.material===m.name),sum=status=>rows.filter(d=>d.status===status).reduce((a,d)=>a+Number(d.quantity),0);return `<tr><td>${E(m.name)}</td><td>${num(sum("Validée"))}</td><td>${num(sum("En attente"))}</td></tr>`}))}
function schedule(){
const monday=new Date();monday.setHours(12,0,0,0);monday.setDate(monday.getDate()-(monday.getDay()+6)%7+scheduleOffset*7);
const days=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return d});
const fmt=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
return header("LOGISTIQUE","Planning des livraisons","Naviguez entre les semaines et consultez les livraisons prévues.")+
`<div class="panel"><div class="between"><button class="btn secondary" data-action="week-prev">← Précédente</button><strong>${E(days[0].toLocaleDateString("fr-FR",{month:"long",year:"numeric"}))}</strong><button class="btn secondary" data-action="week-next">Suivante →</button></div><div class="week-grid">${days.map(d=>`<div class="week-day"><strong>${E(d.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"}))}</strong>${orderRows(db.orders.filter(o=>o.deliveryDate===fmt(d)&&o.status!=="Annulée"))}</div>`).join("")}</div></div>`;
}
function missions(){return header("OBJECTIFS","Missions exceptionnelles","Missions fixées par la direction.")+(director()?`<div class="panel">${frm("mission-form",field("title","Mission")+select("material","Ressource",db.materials.map(m=>m.name))+field("quantity","Quantité","number")+field("deadline","Échéance","date")+field("reward","Prime éventuelle","number","0",false),"Créer une mission")}</div>`:"")+`<div class="grid g3">${db.missions.map(m=>`<div class="panel"><h3>${E(m.title)}</h3><p>${E(m.material)} : ${num(m.quantity)}</p><p>Échéance : ${E(m.deadline)}</p><p>Prime : ${money(m.reward)}</p>${director()?btn("Clôturer","mission-close",m.id,"secondary tiny"):""}</div>`).join("")}</div>`}
function notifications(){const u=current(),items=db.notifications.filter(n=>n.target==="all"||n.target===u.id||n.target==="orders"&&canOrders()||n.target==="quotas"&&allowed("quotas"));return header("ALERTES","Notifications","Informations récentes.")+`<div class="list">${items.slice(0,60).map(n=>`<div class="listitem between"><div>${E(n.message)}<p>${new Date(n.at).toLocaleString("fr-FR")}</p></div>${(n.readBy||[]).includes(u.id)?label("Lu","green"):btn("Marquer lu","notice-read",n.id,"secondary tiny")}</div>`).join("")}</div>`}
function activity(){return director()?header("AUDIT","Journal d'activité","Modifications enregistrées.")+`<div class="list">${db.events.slice(0,150).map(e=>`<div class="listitem"><strong>${E(e.type)}</strong><p>${E(e.info)} · ${E(e.by)} · ${E(e.date)}</p></div>`).join("")}</div>`:empty("Accès réservé")}
function analytics(){const done=db.orders.filter(o=>o.status==="Livrée");return header("FINANCES","Statistiques financières","Détail par entreprise.")+`<div class="grid g3"><div class="panel stat"><span>CA livré</span><span class="num">${money(done.reduce((a,o)=>a+amount(o),0))}</span></div><div class="panel stat"><span>Livraisons</span><span class="num">${done.length}</span></div><div class="panel stat"><span>Commandes</span><span class="num">${db.orders.length}</span></div></div><div class="panel" style="margin-top:20px"><h3>Performances commerciales</h3>${db.users.filter(x=>x.role==="Commercial").map(x=>{const assigned=db.orders.filter(o=>o.commercialId===x.id);return `<details class="listitem"><summary>${avatar(x)} <strong>${E(x.name)}</strong> · ${assigned.length} prises en charge · ${assigned.filter(o=>o.status==="Livrée").length} livrées · ${assigned.filter(o=>o.status==="Annulée").length} annulées</summary>${orderRows(assigned)}</details>`}).join("")}</div><div class="panel" style="margin-top:20px"><div class="between"><h3>Entreprises</h3>${btn("Exporter pour Google Sheets","export-orders","","secondary tiny")}</div>${db.companies.map(c=>{const os=db.orders.filter(o=>o.companyId===c.id);return `<details class="listitem"><summary><strong>${E(c.name)}</strong> · ${os.length} commandes · ${money(os.filter(o=>o.status==="Livrée").reduce((a,o)=>a+amount(o),0))}</summary>${orderRows(os)}</details>`}).join("")}</div>`}

function commercialHistory(){const u=current();if(u.role!=="Commercial")return empty("Accès réservé");const rows=db.orders.filter(o=>o.commercialId===u.id);return header("LIVRAISONS","Mon activité commerciale","Suivi des commandes prises en charge.")+`<div class="grid g3"><div class="panel stat"><span>Prises en charge</span><span class="num">${rows.length}</span></div><div class="panel stat"><span>Livrées</span><span class="num">${rows.filter(o=>o.status==="Livrée").length}</span></div><div class="panel stat"><span>Annulées</span><span class="num">${rows.filter(o=>o.status==="Annulée").length}</span></div></div>`+orderRows(rows)}
function hrnotes(){if(!allowed("staff"))return empty("Accès réservé aux RH");return header("RESSOURCES HUMAINES","Notes internes","Notes privées des dossiers employés.")+`<div class="panel">${frm("hr-note-form",select("userId","Employé",db.users.filter(x=>x.kind!=="company").map(x=>x.id+" | "+x.name))+textarea("body","Note confidentielle"),"Ajouter une note")}</div><div class="list">${db.notes.slice().reverse().map(n=>{const x=db.users.find(u=>u.id===n.userId);return `<div class="listitem"><strong>${E(x?.name||"Employé")}</strong><p>${E(n.body)}</p><small>${E(n.by)} · ${E(n.date)}</small></div>`}).join("")}</div>`}
function employeeCard(){if(!director())return empty("Accès réservé à la direction");return header("ÉQUIPE","Cartes employés","Identité, photo, matricule et grade.")+`<div class="grid g3">${db.users.filter(x=>x.kind!=="company").map(x=>`<div class="gb-id-card"><div class="gb-id-top">◆ GB FOUNDRY <span>CARTE EMPLOYÉ</span></div><div class="gb-id-main">${avatar(x)}<div><h3>${E(x.name)}</h3><p>${E(x.role)}</p><small>Matricule : ${E(x.id)}</small></div></div><div class="gb-id-foot">GB FOUNDRY • PERSONNEL</div></div>`).join("")}</div>`}
function view(){
switch(page){
case"dashboard":return dashboard();
case"inventory":return inventory();
case"schedule":return schedule();
case"missions":return missions();
case"notifications":return notifications();
case"activity":return activity();
case"analytics":return analytics();
case"hrnotes":return hrnotes();
case"commercial-history":return commercialHistory();
case"employee-card":return employeeCard();
case"catalog":return catalog();
case"orders":return orders();
case"receivers":return receivers();
case"harvest":return harvest();
case"quotas":return quotas();
case"staff":return staff();
case"companies":return companies();
case"materials":return materials();
case"salaries":return salaries();
case"announcements":return announcements();
case"recruitment":return recruitment();
case"profile":return profile();
default:return empty();
}
}
function render(){
const u=current();if(!u){sessionId="";sessionStorage.removeItem(SESSION);return login()}
if(u.mustChange)return changeFirst();return shell();
}
function credentials(u,pwd){
modalCredentials={username:u.username,password:pwd};
const d=document.getElementById("modal");d.innerHTML=`<h2>Accès temporaire créé</h2><p>Ces identifiants ne sont disponibles que sur cet appareil. Remettez-les uniquement à la personne concernée.</p><div class="notice"><strong>${E(u.username)}</strong><br><strong>${E(pwd)}</strong></div><div class="flex" style="margin-top:15px">${btn("Copier les identifiants","copy-credentials","","dark")}${btn("Fermer","close-modal")}</div><p class="muted">Aucun mot de passe n'a été envoyé sur Discord.</p>`;d.showModal();
}
function data(form){return Object.fromEntries(new FormData(form).entries())}
function getUsernameFree(name){return name&&name.trim()&&!db.users.some(u=>u.username.toLowerCase()===name.trim().toLowerCase())}
function loginSession(u){sessionId=u.id;sessionStorage.setItem(SESSION,u.id);page=u.kind==="company"?"catalog":"dashboard";cart={};render()}
document.addEventListener("submit",e=>{
const f=e.target;if(!f.id)return;e.preventDefault();const d=data(f),u=current();
if(f.id==="login-form"){
const found=db.users.find(u=>u.kind===loginKind&&u.active&&u.username.toLowerCase()===String(d.username||"").trim().toLowerCase()&&u.password===d.password);
if(!found)return toast("Identifiants ou espace de connexion incorrects.");return loginSession(found);
}
if(f.id==="apply-form"){
db.applications.push({id:uid("candidature"),...d,date:now()});save();publicApply=false;toast("Candidature enregistrée sur cet appareil.");return render();
}
if(f.id==="first-password"||f.id==="password-form"){
if(d.password!==d.repeat||d.password.length<8)return toast("Les mots de passe doivent être identiques et contenir au moins 8 caractères.");
if(f.id==="password-form"&&d.oldPassword!==u.password)return toast("Ancien mot de passe incorrect.");
u.password=d.password;u.mustChange=false;save();toast("Mot de passe enregistré.");return render();
}
if(f.id==="hr-note-form"&&allowed("staff")){const userId=d.userId.split(" | ")[0];if(!db.users.some(x=>x.id===userId&&x.kind!=="company"))return toast("Employé introuvable");db.notes.unshift({id:uid("NOTE"),userId,body:d.body,by:u.name,date:now()});log("hr_note_added",userId);save();return render()}
if(f.id==="mission-form"&&director()){db.missions.unshift({id:uid("MISSION"),...d});log("mission_created",d.title);notify("Nouvelle mission : "+d.title);save();return render()}
if(f.id==="receiver-form"&&u.kind==="company"){
company().receivers.push({id:uid("recept"),name:d.name,phone:d.phone});save();toast("Personne ajoutée.");return render();
}
if(f.id==="harvest-form"&&u.kind==="employee"){
db.declarations.push({id:uid("DECL"),userId:u.id,userName:u.name,material:d.material,quantity:Math.max(1,Number(d.quantity)),locker:d.locker,details:d.details||"",status:"En attente",date:now(),week:weekOf(Date.now())});
notify("Déclaration à vérifier : "+u.name,"quotas");log("harvest_created",`${u.name}: ${d.quantity} ${d.material}`);save();toast("Déclaration en attente de validation.");return render();
}
if(f.id==="checkout-form"&&u.kind==="company"){
if(!Object.keys(cart).length)return toast("Panier vide.");if(!d.deliveryDate||!d.deliveryTime||!d.iban)return toast("Renseignez la date, l’heure et l’IBAN.");
const items=Object.entries(cart).map(([id,qty])=>({id,qty,name:db.materials.find(m=>m.id===id)?.name||"Article"}));
const o={id:"GB-"+Date.now().toString(36).toUpperCase(),companyId:u.companyId,createdBy:u.id,receiver:"",deliveryDate:d.deliveryDate,deliveryTime:d.deliveryTime,iban:d.iban.trim().replace(/\s/g,"").toUpperCase(),items,status:"Reçue",date:now(),commercial:"",commercialId:null,reason:""};
db.orders.unshift(o);notify("Nouvelle commande "+o.id,"orders");log("order_created",o.id);save();cart={};toast("Commande "+o.id+" enregistrée.");page="orders";return render();
}
if(f.id==="staff-form"&&allowed("staff")){
if(!getUsernameFree(d.username))return toast("Identifiant déjà pris.");if(u.role==="RH"&&["CEO","COO","Assistant de direction"].includes(d.role))return toast("Accès non autorisé.");
const password=tempPass(),newUser={id:uid("EMP"),name:d.name.trim(),username:d.username.trim(),password,role:d.role,kind:roleKind(d.role),active:true,mustChange:true};
db.users.push(newUser);log("staff_created",newUser.username);save();render();return credentials(newUser,password);
}
if(f.id==="company-form"&&allowed("companies")){
if(!getUsernameFree(d.username))return toast("Identifiant déjà pris.");
const c={id:uid("ENT"),name:d.name,receivers:[]};db.companies.push(c);
const password=tempPass(),newUser={id:uid("PRO"),name:d.name,username:d.username.trim(),password,role:"Entreprise",kind:"company",companyId:c.id,active:true,mustChange:true};db.users.push(newUser);
log("partner_created",c.name);save();render();return credentials(newUser,password);
}
if(f.id==="material-form"&&allowed("materials")){
if(d.price===""||!Number.isFinite(Number(d.price))||Number(d.price)<0)return toast("Prix unitaire obligatoire.");
db.materials.push({id:uid("ITEM"),name:d.name,detail:d.detail||"",price:d.price===""?null:Math.max(0,Number(d.price)),unit:"unité",art:"ore",active:true});save();toast("Article créé.");return render();
}
if(f.id==="announcement-form"&&allowed("announcements")){
db.announcements.unshift({id:uid("ANN"),title:d.title,audience:d.audience,body:d.body,date:now()});log("announcement_created",d.title);save();toast("Annonce publiée.");return render();
}
if(f.id==="position-form"&&allowed("recruitment")){
if(db.positions.some(p=>p.name===d.position))return toast("Ce poste figure déjà dans la liste.");
db.positions.push({id:uid("POSTE"),name:d.position,open:true});save();return render();
}
});
document.addEventListener("change",e=>{if(e.target.id==="profile-photo"){const file=e.target.files?.[0],u=current();if(!file||!u)return;if(file.size>350000)return toast("Photo trop volumineuse (350 Ko maximum).");const reader=new FileReader();reader.onload=()=>{u.photo=String(reader.result);save();render()};reader.readAsDataURL(file)}});
document.addEventListener("input",e=>{if(e.target.id==="staff-search"){const q=e.target.value.toLowerCase();document.querySelectorAll(".staff-entry").forEach(el=>el.hidden=!el.dataset.search.includes(q))}});
document.addEventListener("click",e=>{
const b=e.target.closest("[data-action]");if(!b)return;const a=b.dataset.action,id=b.dataset.id,u=current();
if(a==="week-prev"){scheduleOffset--;return render()}
if(a==="week-next"){scheduleOffset++;return render()}
if(a==="choose-login"){loginKind=id;return render()}
if(a==="demo"){const x=db.users.find(u=>u.id===id);if(x){loginKind=x.kind;render();const a=root.querySelector('[name="username"]'),p=root.querySelector('[name="password"]');if(a)a.value=x.username;if(p)p.value=x.password;}return}
if(a==="public-apply"){publicApply=true;return render()}
if(a==="back-login"){publicApply=false;return render()}
if(a==="logout"){sessionId="";sessionStorage.removeItem(SESSION);cart={};return render()}
if(!u)return;
if(a==="nav"){page=id;return render()}
if(a==="compact"){compact=!compact;return render()}
if(a==="priority-toggle"&&allowed("orders")){const o=db.orders.find(o=>o.id===id);if(!o||["Livrée","Annulée"].includes(o.status))return;o.priority=o.priority==="Urgente"?"Normale":"Urgente";log("order_priority",o.id+" : "+o.priority);save();return render()}
if(a==="notice-read"){const n=db.notifications.find(n=>n.id===id);if(n){n.readBy||=[];if(!n.readBy.includes(u.id))n.readBy.push(u.id);save();}return render()}
if(a==="mission-close"&&director()){db.missions=db.missions.filter(m=>m.id!==id);log("mission_closed",id);save();return render()}
if(a==="export-orders"&&director())return csv("gbfoundry-commandes",[["Commande","Entreprise","Statut","Montant","Date livraison","Commercial"],...db.orders.map(o=>[o.id,db.companies.find(c=>c.id===o.companyId)?.name,o.status,amount(o),o.deliveryDate,o.commercial])]);
if(a==="career-change"&&director()){const x=db.users.find(v=>v.id===id);if(!x)return;const options=x.kind==="admin"?rolesAdmin:rolesStaff;const selected=prompt("Choisir le nouveau grade : "+options.join(" / "));if(!selected||!options.includes(selected)||selected===x.role)return;const date=prompt("Date de changement (AAAA-MM-JJ)",new Date().toISOString().slice(0,10));if(!date)return;const reason=prompt("Motif de promotion ou rétrogradation");if(!reason?.trim())return;const previous=x.role;x.role=selected;x.career||=[];x.career.push({date,oldRole:previous,newRole:selected,reason,by:u.name});log("career_change",x.name+" : "+previous+" vers "+selected);notify("Votre grade a changé : "+selected,x.id);save();return render()}
if(a==="cart-add"&&u.kind==="company"){const m=db.materials.find(m=>m.id===id);if(!m||!m.active)return;const qty=Number(document.getElementById("qty_"+id)?.value||0);if(qty<1)return toast("Quantité incorrecte.");cart[id]=(cart[id]||0)+qty;toast("Ajouté au panier.");return render()}
if(a==="cart-clear"){cart={};return render()}
if(a==="order-claim"&&canOrders()){
const o=db.orders.find(o=>o.id===id);if(!o||o.status!=="Reçue")return;o.status="Prise en charge";o.commercial=u.name;o.commercialId=u.id;o.claimedAt=now();log("order_claimed",`${o.id}: ${u.username}`);save();return render()
}
if(a==="order-deliver"&&canOrders()){
const o=db.orders.find(o=>o.id===id);if(!o||o.status!=="Prise en charge"||!(allowed("orders")||o.commercialId===u.id))return;
if(!confirm("Confirmer que la commande a bien été livrée ?"))return;o.status="Livrée";o.deliveredAt=now();log("order_delivered",o.id);save();return render();
}
if(a==="order-cancel"){
const o=db.orders.find(o=>o.id===id);if(!o||["Livrée","Annulée"].includes(o.status))return;
if(!canOrders())return;
const reason=prompt("Indiquez la raison précise de l'annulation (minimum 8 caractères) :");if(!reason)return;if(reason.trim().length<8)return toast("Motif trop court.");
if(!confirm("Êtes-vous sûr(e) de vouloir ANNULER définitivement cette commande ?"))return;
o.status="Annulée";o.reason=reason.trim();o.cancelledAt=now();log("order_cancelled",`${o.id}: ${reason.trim()}`);save();return render();
}
if(a==="quota-approve"&&allowed("quotas")){
const d=db.declarations.find(x=>x.id===id);if(!d||d.status!=="En attente")return;
if(!confirm("Avez-vous vérifié les items dans le casier "+d.locker+" ?"))return;
d.status="Validée";d.checkedBy=u.name;d.checkedAt=now();notify("Récolte validée : "+d.material,d.userId);log("harvest_approved",d.id);save();return render();
}
if(a==="quota-refuse"&&allowed("quotas")){
const d=db.declarations.find(x=>x.id===id);if(!d||d.status!=="En attente")return;
const why=prompt("Motif du refus (obligatoire) :");if(!why?.trim())return;d.status="Refusée";d.reason=why.trim();d.checkedBy=u.name;d.checkedAt=now();log("harvest_refused",d.id);save();return render();
}
if(a==="ack-announcement"&&u.kind==="employee"){const x=db.announcements.find(x=>x.id===id);if(!x)return;x.readBy=x.readBy||[];if(!x.readBy.includes(u.id))x.readBy.push(u.id);save();return render()}
if(a==="remove-receiver"&&u.kind==="company"){
if(!confirm("Retirer ce réceptionnaire ?"))return;company().receivers=company().receivers.filter(r=>r.id!==id);save();return render();
}
if(a==="toggle-account"&&(allowed("staff")||allowed("companies"))){
const x=db.users.find(x=>x.id===id);if(!x||x.id===u.id)return;
if(x.kind==="company"&&!allowed("companies")||x.kind!=="company"&&!allowed("staff"))return;
if(u.role==="RH"&&["CEO","COO","Assistant de direction"].includes(x.role))return;
x.active=!x.active;save();return render();
}
if(a==="reset-account"&&(allowed("staff")||allowed("companies"))){
const x=db.users.find(x=>x.id===id);if(!x)return;
if(x.kind==="company"&&!allowed("companies")||x.kind!=="company"&&!allowed("staff"))return;
if(u.role==="RH"&&["CEO","COO","Assistant de direction"].includes(x.role))return;
const pwd=tempPass();x.password=pwd;x.mustChange=true;save();render();return credentials(x,pwd);
}
if(a==="material-toggle"&&allowed("materials")){
const m=db.materials.find(x=>x.id===id);if(!m)return;m.active=!m.active;save();return render();
}
if(a==="material-edit"&&allowed("materials")){
const m=db.materials.find(x=>x.id===id);if(!m)return;const name=prompt("Nom de l'article :",m.name);if(!name?.trim())return;
const price=prompt("Prix unitaire en $ (laisser vide si inconnu) :",m.price??"");if(price===null)return;
m.name=name.trim();m.price=price.trim()===""?null:Math.max(0,Number(price)||0);save();return render();
}
if(a==="grade-edit"&&allowed("salaries")){
const g=db.grades.find(x=>x.role===id);if(!g)return;const quota=prompt("Quota hebdomadaire pour "+g.role+":",String(g.quota));if(quota===null)return;const salary=prompt("Salaire indicatif :",String(g.salary));if(salary===null)return;
if(Number(quota)<0||Number(salary)<0)return toast("Valeurs négatives interdites.");
g.quota=Math.floor(Number(quota)||0);g.salary=Math.floor(Number(salary)||0);save();return render();
}
if(a==="toggle-position"&&allowed("recruitment")){
const p=db.positions.find(x=>x.id===id);if(!p)return;p.open=!p.open;save();return render();
}
if(a==="delete-application"&&allowed("recruitment")){
if(!confirm("Supprimer cette candidature ?"))return;db.applications=db.applications.filter(x=>x.id!==id);save();return render();
}
if(a==="delete-announcement"&&allowed("announcements")){
if(!confirm("Supprimer l'annonce ?"))return;db.announcements=db.announcements.filter(x=>x.id!==id);save();return render();
}
if(a==="copy-credentials"&&modalCredentials){
const text=`GB Foundry\nIdentifiant : ${modalCredentials.username}\nMot de passe temporaire : ${modalCredentials.password}`;
navigator.clipboard?.writeText(text).then(()=>toast("Copié dans le presse-papiers.")).catch(()=>toast("Copie indisponible.")).finally(()=>{document.getElementById("modal").close()});
return;
}
if(a==="close-modal"){document.getElementById("modal").close();return}
});
render();
})();
