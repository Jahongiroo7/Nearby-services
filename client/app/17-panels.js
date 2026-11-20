/* ===== Foydalanuvchi paneli (Kabinet) va Admin paneli: demo, ma'lumot shu brauzerda saqlanadi ===== */
const K_PROF="ns_profile"+ACC_SUF, K_RECENT="ns_recent"+ACC_SUF, K_ADD="ns_admin_add", K_EDIT="ns_admin_edit", K_DEL="ns_admin_del", K_HID="ns_admin_hidrev", K_PASS="ns_admin_pass";
const LSX={ get(k,d){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } }, set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };
let PROF=LSX.get(K_PROF,{name:""}), RECENT=LSX.get(K_RECENT,[]); if(!PROF.name&&ACC_ID!=="guest") PROF.name=accName(ACC_ID);
let A_ADD=LSX.get(K_ADD,[]), A_EDIT=LSX.get(K_EDIT,{}), A_DEL=LSX.get(K_DEL,[]), A_HID=LSX.get(K_HID,[]);
const revSig=(sid,r)=>sid+"|"+(r.name||"")+"|"+r.stars+"|"+String(r.text||"").slice(0,40);
function dropRating(s,r){ if(s.count>1){ s.rating=Math.max(1,(s.rating*s.count-r.stars)/(s.count-1)); s.count--; } else { s.count=0; s.rating=0; } }
function adminApply(){
  for(const id of A_DEL){ const i=services.findIndex(s=>s.id===id); if(i>=0) services.splice(i,1); }
  for(const [id,ch] of Object.entries(A_EDIT)){ const s=byId(id); if(s) Object.assign(s,ch); }
  for(const n of A_ADD) if(!byId(n.id)) services.push(n);
  for(const sig of A_HID){ const id=sig.split("|")[0], s=byId(id); if(!s) continue; const i=s.reviews.findIndex(r=>revSig(id,r)===sig); if(i>=0){ dropRating(s,s.reviews[i]); s.reviews.splice(i,1); } }
}
adminApply();
{ const _o=openService; openService=function(id,o){ _o(id,o); if(byId(id)){ RECENT=[id,...RECENT.filter(x=>x!==id)].slice(0,12); LSX.set(K_RECENT,RECENT); const rn=document.getElementById("revName"); if(rn&&!rn.value&&PROF.name) rn.value=PROF.name; } }; }

let PN=null, PKIND="", PTAB="", PEDIT=null, PLIM=40, PSRCH="", PCAT="", PONLY=false, PARM=0;
const pAuth=()=>{ try{ return sessionStorage.getItem("ns_admin_ok")==="1"; }catch(e){ return false; } };
const pPass=()=>LSX.get(K_PASS,"Starboy007bnm");
const regionList=()=>{ const seen=new Set(), out=[]; for(const r of [TASH_CITY,...REGIONS]){ if(!seen.has(r.id)){ seen.add(r.id); out.push(r); } } return out; };
const pStat=(n,l)=>`<div class="pn-stat"><b>${n}</b><span>${l}</span></div>`;
const pRow=(main,sub,acts)=>`<li class="pn-row"><div class="pn-rm"><b>${main}</b><small>${sub}</small></div><div class="pn-ra">${acts}</div></li>`;
const pBtn=(act,label,data="",cls="")=>`<button type="button" class="btn sm ${cls}" data-pa="${act}" ${data}>${label}</button>`;
const myRevAll=()=>{ const out=[]; for(const [id,list] of Object.entries(myReviews)){ const s=byId(id); if(!s) continue; list.forEach((r,i)=>out.push({s,r,i})); } return out; };

function pBuild(){
  PN=document.createElement("div"); PN.className="pnl"; PN.hidden=true; PN.setAttribute("role","dialog"); PN.setAttribute("aria-modal","true");
  PN.innerHTML='<div class="pn-box"><header class="pn-h"><b class="pn-t"></b><button type="button" class="pn-x" aria-label="Yopish">×</button></header><nav class="pn-tabs" role="tablist"></nav><div class="pn-body"></div></div>';
  document.body.appendChild(PN);
  PN.addEventListener("click",pClick);
  PN.addEventListener("submit",pSubmit);
  PN.addEventListener("input",e=>{ const t=e.target; if(t.closest&&t.closest("form[data-f=svc]")) pPreview(); if(t.id==="pn-q"){ PSRCH=t.value; PLIM=40; pRenderBody(true); } });
  PN.addEventListener("change",e=>{ const t=e.target; if(t.closest&&t.closest("form[data-f=svc]")) pPreview(); if(t.id==="pn-cat"){ PCAT=t.value; PLIM=40; pRenderBody(); } else if(t.id==="pn-only"){ PONLY=t.checked; pRenderBody(); } });
}
function pOpen(kind,fromHash){
  if(!PN) pBuild(); const was=PN.hidden===false&&PKIND===kind;
  PKIND=kind; if(!was){ PTAB=kind==="user"?(unread()?"inbox":"profile"):"stats"; PEDIT=null; PLIM=40; PSRCH=""; PCAT=""; PONLY=false; }
  PN.hidden=false; document.documentElement.classList.add("pn-open"); pRender(); if(PKIND==="user"&&PTAB==="inbox") markRead();
  if(!fromHash){ try{ history.pushState(null,"","#"+(kind==="user"?"kabinet":"admin")); }catch(e){} }
  const x=PN.querySelector(".pn-x"); if(x) x.focus({preventScroll:true});
}
function pClose(fromHash){
  if(!PN||PN.hidden) return; PN.hidden=true; document.documentElement.classList.remove("pn-open");
  if(!fromHash&&/^#(kabinet|admin)$/.test(location.hash)){ try{ history.back(); }catch(e){} }
}
function pRender(){
  PN.querySelector(".pn-t").textContent=PKIND==="user"?"Kabinet":"Admin panel";
  const tabs=PKIND==="user"?[["profile","Profil"],["inbox","Kelgan"+(unread()?" ("+unread()+")":"")],["acc","Akkauntlar"],["fav","Saralanganlar"],["rev","Sharhlarim"],["recent","Ko'rilganlar"],["set","Sozlamalar"]]
    :(pAuth()?[["stats","Statistika"],["svc","Xizmatlar"],["rev","Sharhlar"],["rep","Xabarlar"+(repNew()?" ("+repNew()+")":"")],["set","Sozlamalar"],["sec","Xavfsizlik"]]:[]);
  PN.querySelector(".pn-tabs").innerHTML=tabs.map(([k,l])=>`<button type="button" role="tab" class="pn-tab" data-pa="tab" data-k="${k}" aria-selected="${PTAB===k}">${l}</button>`).join("");
  PN.querySelector(".pn-tabs").hidden=!tabs.length;
  pRenderBody();
}
function pRenderBody(keepFocus){
  const b=PN.querySelector(".pn-body"), sc=b.scrollTop; const fid=keepFocus&&document.activeElement&&document.activeElement.id, pos=fid&&document.activeElement.selectionStart;
  b.innerHTML=PKIND==="user"?pUser():pAdmin(); b.scrollTop=sc;
  pPreview();
  if(fid){ const el=document.getElementById(fid); if(el){ el.focus({preventScroll:true}); try{ el.setSelectionRange(pos,pos); }catch(e){} } }
}

/* ----- foydalanuvchi paneli ----- */
function pUser(){
  const favs=[...FAV].map(byId).filter(Boolean), mine=myRevAll(), rec=RECENT.map(byId).filter(Boolean);
  if(PTAB==="inbox") return pInbox();
  if(PTAB==="acc") return pAccounts();
  if(PTAB==="profile") return `<form class="pn-form" data-f="profile"><label>Ismingiz<input class="input" id="pn-name" maxlength="40" value="${esc(PROF.name||"")}" placeholder="Masalan, Aziz"></label>
    <p class="muted">Ism sharh yozganda avtomatik qo'yiladi. Ma'lumot faqat shu brauzerda saqlanadi.</p><div><button class="btn btn-primary" type="submit">Saqlash</button></div></form>
    <div class="pn-stats">${pStat(favs.length,"Saralanganlar")}${pStat(mine.length,"Sharhlarim")}${pStat(rec.length,"Ko'rilganlar")}</div>`;
  const svcRow=(s,acts)=>pRow(esc(s.name),`${CATS[s.cat]?CATS[s.cat].label:""} · ${esc(s.district||"")} · ★ ${s.count?fmtR(s.rating):"-"}`,pBtn("open","Ochish",`data-id="${s.id}"`,"btn-primary")+(acts||""));
  if(PTAB==="fav") return favs.length?`<ul class="pn-list">${favs.map(s=>svcRow(s,pBtn("unfav","Olib tashlash",`data-id="${s.id}"`))).join("")}</ul>`:`<p class="muted">Hali saralangan xizmat yo'q. Xizmat tafsilotida <b>♥ Saralash</b> tugmasini bosing.</p>`;
  if(PTAB==="rev") return mine.length?`<ul class="pn-list">${mine.map(({s,r,i})=>pRow(esc(s.name)+" "+starsHtml(r.stars),esc(r.text||""),pBtn("open","Ochish",`data-id="${s.id}"`)+pBtn("delmine","O'chirish",`data-id="${s.id}" data-i="${i}"`,"danger"))).join("")}</ul>`:`<p class="muted">Siz hali sharh yozmagansiz.</p>`;
  if(PTAB==="recent") return rec.length?`<ul class="pn-list">${rec.map(s=>svcRow(s)).join("")}</ul>`:`<p class="muted">Hali xizmat ko'rmagansiz.</p>`;
  return `<p class="muted">Bu yerdagi hamma ma'lumot (ism, saralanganlar, ko'rilganlar) shu brauzerda saqlanadi.</p>
    <div>${pBtn("clearme","Mening ma'lumotlarimni tozalash","","danger")}</div>`;
}

/* ----- admin paneli ----- */
function pAdmin(){
  if(!pAuth()) return `<form class="pn-form pn-login" data-f="login"><p class="muted">Admin paneliga kirish uchun parolni kiriting.</p>
    <label>Parol<input class="input" id="pn-pass" type="password" autocomplete="current-password" required></label><em class="err" id="pn-err"></em>
    <div><button class="btn btn-primary" type="submit">Kirish</button></div>
    <p class="muted pn-demo">Demo rejim: bu haqiqiy himoya emas, ma'lumot shu brauzerda saqlanadi. Parolni Xavfsizlik bo'limida o'zgartirish mumkin.</p></form>`;
  if(PEDIT) return pSvcForm(PEDIT==="new"?null:byId(PEDIT));
  if(PTAB==="stats") return pStats();
  if(PTAB==="svc") return pSvcList();
  if(PTAB==="rev") return pRevList();
  if(PTAB==="rep") return pRepList();
  if(PTAB==="set") return pSysForm();
  return pAdminSettings();
}
function pStats(){
  const rated=services.filter(s=>s.count>0), tot=services.reduce((a,s)=>a+s.count,0), avg=rated.length?rated.reduce((a,s)=>a+s.rating,0)/rated.length:0;
  const byCat=CAT_KEYS.map(k=>[CATS[k].label,services.filter(s=>s.cat===k).length]), mx=Math.max(1,...byCat.map(x=>x[1]));
  const top=(arr,f)=>arr.slice().sort(f).slice(0,5).map(s=>`<li>${esc(s.name)} <small class="muted">★ ${s.count?fmtR(s.rating):"-"} · ${s.count} baho</small></li>`).join("");
  return `<div class="pn-stats">${pStat(services.length,"Xizmatlar")}${pStat(places.length,"Jamoat joylari")}${pStat(tot,"Baholar jami")}${pStat(rated.length?fmtR(avg):"-","O'rtacha reyting")}${pStat(myRevAll().length,"Foydalanuvchi sharhlari")}${pStat(A_ADD.length,"Admin qo'shgan")}${pStat(A_DEL.length,"O'chirilgan")}${pStat(FAV.size,"Saralanganlar (shu brauzer)")}</div>
    <h4 class="pn-h4">Toifalar bo'yicha</h4><ul class="pn-bars">${byCat.map(([l,n])=>`<li><span>${esc(l)}</span><i><b style="width:${Math.round(n/mx*100)}%"></b></i><em>${n}</em></li>`).join("")}</ul>
    <h4 class="pn-h4">Eng ko'p baholanganlar</h4><ol class="pn-top">${top(services,(a,b)=>b.count-a.count)}</ol>
    <h4 class="pn-h4">Eng yuqori reyting (20+ baho)</h4><ol class="pn-top">${top(services.filter(s=>s.count>=20),(a,b)=>b.rating-a.rating)}</ol>`;
}
function pSvcList(){
  const q=norm(PSRCH); let arr=services.filter(s=>(!PCAT||s.cat===PCAT)&&(!q||norm(s.name+" "+(s.district||"")+" "+(s.address||"")).includes(q)));
  const shown=arr.slice(0,PLIM), more=arr.length>PLIM;
  return `<div class="pn-hero"><div><b>Xizmatlarni boshqarish</b><span>${services.length} ta xizmat · ${A_ADD.length} tasi siz qo'shgan</span></div>${pBtn("new","+ Yangi xizmat qo'shish","","pn-cta")}</div>
    <div class="pn-bar"><input class="input" id="pn-q" type="search" placeholder="Nomi yoki tuman bo'yicha qidirish" value="${esc(PSRCH)}" aria-label="Qidirish">
    <select class="input" id="pn-cat" aria-label="Toifa"><option value="">Barcha toifalar</option>${CAT_KEYS.map(k=>`<option value="${k}"${PCAT===k?" selected":""}>${CATS[k].label}</option>`).join("")}</select></div>
    <p class="muted">${arr.length} ta xizmat</p>
    <ul class="pn-list">${shown.map(s=>`<li class="pn-row"><span class="pn-ico logo">${serviceLogo(s)}</span><div class="pn-rm"><b>${esc(s.name)}${s.id[0]==="a"?' <span class="pill open">yangi</span>':""}</b><small>${CATS[s.cat]?CATS[s.cat].label:""} · ${esc(regionById(s.region||"ts").short)} · ${esc(s.district||"")} · ★ ${s.count?fmtR(s.rating):"-"} (${s.count})</small></div><div class="pn-ra">${pBtn("open","Saytda ko'rish",`data-id="${s.id}"`)}${pBtn("edit","Tahrirlash",`data-id="${s.id}"`)}${pBtn("del","O'chirish",`data-id="${s.id}"`,"danger")}</div></li>`).join("")}</ul>
    ${more?`<div class="pn-more">${pBtn("more","Yana ko'rsatish")}</div>`:""}`;
}
const pPriceRow=(n="",p="")=>`<div class="pn-price"><input class="input pn-pn" maxlength="60" placeholder="Xizmat nomi" value="${esc(n)}"><input class="input pn-pp" inputmode="numeric" placeholder="Narxi, so'm" value="${p?esc(p):""}"><button type="button" class="pn-del" data-pa="delprice" aria-label="Olib tashlash">×</button></div>`;
function pPreview(){
  const el=PN.querySelector("#pn-prev"); if(!el) return; const g=id=>{ const e=PN.querySelector("#"+id); return e?e.value:""; };
  const cat=(PN.querySelector('input[name="f-catr"]:checked')||{}).value||"barber", c=CATS[cat], name=g("f-name").trim()||"Xizmat nomi", dis=g("f-district").trim(), h24=PN.querySelector("#f-h24")&&PN.querySelector("#f-h24").checked;
  el.innerHTML=`<span class="pn-ico lg logo">${serviceLogo({id:"prev",name,cat})}</span><div class="pn-rm"><b>${esc(name)}</b><small>${c.label}${dis?" · "+esc(dis):""}</small><small>${h24?"24 soat ochiq":esc(g("f-open")||"09:00")+" – "+esc(g("f-close")||"18:00")} · <span class="pill open">Yangi</span></small></div>`;
}
function pSvcForm(s){
  const ll=s?toLatLng(s.x,s.y):toLatLng(state.user.x,state.user.y), v=(k,d="")=>esc(s&&s[k]!=null?s[k]:d), curCat=s?s.cat:"barber";
  const prices=(s&&s.prices&&s.prices.length?s.prices:[["",""]]).map(([n,p])=>pPriceRow(n,p)).join("");
  return `<form class="pn-form pn-svcform" data-f="svc" data-id="${s?s.id:""}">
    <div class="pn-ftop"><button type="button" class="pn-back" data-pa="cancel">‹ Ro'yxatga qaytish</button><h3>${s?"Xizmatni tahrirlash":"Yangi xizmat qo'shish"}</h3></div>
    <div class="pn-prev" id="pn-prev"></div>
    <section class="pn-sec"><h4><i>1</i> Asosiy ma'lumot</h4>
      <label>Xizmat nomi<input class="input" id="f-name" maxlength="80" required value="${v("name")}" placeholder="Masalan, Sartaroshxona Zebo"></label>
      <div class="pn-lbl">Toifa</div><div class="pn-cats">${CAT_KEYS.map(k=>`<label class="pn-cat"><input type="radio" name="f-catr" value="${k}"${curCat===k?" checked":""}><span style="--c:${CATS[k].color}"><i></i>${CATS[k].label}</span></label>`).join("")}</div>
      <label>Tavsif<textarea class="input" id="f-desc" rows="3" maxlength="400" placeholder="Xizmat haqida qisqacha">${v("desc")}</textarea></label></section>
    <section class="pn-sec"><h4><i>2</i> Joylashuv va aloqa</h4>
      <div class="pn-2"><label>Hudud<select class="input" id="f-region">${regionList().map(r=>`<option value="${r.id}"${((s&&s.region)||"ts")===r.id?" selected":""}>${esc(r.short)}</option>`).join("")}</select></label>
      <label>Tuman<input class="input" id="f-district" maxlength="60" value="${v("district")}" placeholder="Masalan, Chilonzor"></label></div>
      <label>Manzil<input class="input" id="f-address" maxlength="120" value="${v("address")}" placeholder="Ko'cha va uy raqami"></label>
      <label>Telefon<input class="input" id="f-phone" maxlength="30" value="${v("phone","+998 ")}" inputmode="tel"></label>
      <div class="pn-2"><label>Kenglik (lat)<input class="input" id="f-lat" inputmode="decimal" value="${ll.lat.toFixed(5)}"></label><label>Uzunlik (lng)<input class="input" id="f-lng" inputmode="decimal" value="${ll.lng.toFixed(5)}"></label></div>
      <div class="pn-acts">${pBtn("usecenter","⌖ Xarita markazi")}${pBtn("useuser","● Mening nuqtam")}</div>
      <p class="muted pn-hint">Maslahat: panelni yoping, xaritani kerakli joyga suring, so'ng "Xarita markazi" tugmasini bosing.</p></section>
    <section class="pn-sec"><h4><i>3</i> Ish vaqti</h4>
      <label class="pn-chk"><input type="checkbox" id="f-h24"${s&&s.h24?" checked":""}> Kecha-kunduz ochiq (24 soat)</label>
      <div class="pn-2"><label>Ochilishi<input class="input" id="f-open" type="time" value="${v("open","09:00")}"></label><label>Yopilishi<input class="input" id="f-close" type="time" value="${v("close","18:00")}"></label></div></section>
    <section class="pn-sec"><h4><i>4</i> Narxlar <small>ixtiyoriy</small></h4><div id="f-prices">${prices}</div>${pBtn("addprice","+ Narx qo'shish")}</section>
    <em class="err" id="pn-err"></em>
    <div class="pn-sticky"><button class="btn pn-save" type="submit">${s?"Saqlash":"Xizmatni qo'shish"}</button>${pBtn("cancel","Bekor qilish")}</div></form>`;
}
function pRevList(){
  const q=norm(PSRCH); const mineSig=new Set(myRevAll().map(x=>revSig(x.s.id,x.r))); const rows=[];
  for(const s of services){ if(PONLY&&!myRevAll().some(x=>x.s===s)) continue; for(const r of s.reviews){ if(PONLY&&!mineSig.has(revSig(s.id,r))) continue; if(q&&!norm(s.name+" "+(r.name||"")+" "+(r.text||"")).includes(q)) continue; rows.push({s,r}); } }
  const shown=rows.slice(0,PLIM);
  return `<div class="pn-bar"><input class="input" id="pn-q" type="search" placeholder="Xizmat, muallif yoki matn bo'yicha" value="${esc(PSRCH)}" aria-label="Qidirish"><label class="pn-chk"><input type="checkbox" id="pn-only"${PONLY?" checked":""}> Faqat foydalanuvchi sharhlari</label></div>
    <p class="muted">${rows.length} ta sharh</p><ul class="pn-list">${shown.map(({s,r})=>pRow(`${esc(s.name)} ${starsHtml(r.stars)}`,`<b>${esc(r.name||"Mehmon")}:</b> ${esc(r.text||"")}`,pBtn("hide","O'chirish",`data-sig="${esc(revSig(s.id,r))}"`,"danger"))).join("")}</ul>
    ${rows.length>PLIM?`<div class="pn-more">${pBtn("more","Yana ko'rsatish")}</div>`:""}`;
}
function pAdminSettings(){
  return `<form class="pn-form" data-f="pass"><h4 class="pn-h4">Parolni o'zgartirish</h4><label>Yangi parol (kamida 6 belgi)<input class="input" id="pn-newpass" type="password" minlength="6" autocomplete="new-password"></label><em class="err" id="pn-err"></em><div><button class="btn btn-primary" type="submit">Saqlash</button></div></form>
    <h4 class="pn-h4">Ma'lumotlar</h4><p class="muted">Admin o'zgarishlari (qo'shilgan, tahrirlangan, o'chirilgan xizmatlar va sharhlar) shu brauzerda saqlanadi.</p>
    <div class="pn-acts">${pBtn("export","Nusxa olish (JSON)")}${pBtn("reset","Admin o'zgarishlarini bekor qilish","","danger")}${pBtn("logout","Chiqish")}</div>\n    <h4 class="pn-h4">Xavfli amal</h4><p class="muted">Barcha sozlamalar, saralanganlar, sharhlar va admin o'zgarishlari shu brauzerdan o'chiriladi.</p>\n    <div>${pBtn("factory","Butun tizimni zavod holiga qaytarish","","danger")}</div>`;
}
/* ----- tizim sozlamalari ----- */
function applySys(){
  const R=document.documentElement.classList;
  R.toggle("sys-no-reviews",!SYS.fReviews); R.toggle("sys-no-fav",!SYS.fFav); R.toggle("sys-no-share",!SYS.fShare); R.toggle("sys-no-gallery",!SYS.fGallery); R.toggle("sys-no-phone",!SYS.fPhone); R.toggle("sys-no-kab",!SYS.fKabinet); R.toggle("sys-no-cmp",!SYS.fCompare); R.toggle("sys-no-rt",!SYS.fRoute); R.toggle("sys-no-rep",!SYS.fReport);
  if(!SYS.fFav&&state.fav) state.fav=false;
  const nm=String(SYS.name||"").trim()||"Nearby", b=document.querySelector(".brand b"); if(b) b.textContent=nm;
  const sm=document.querySelector(".brand small"); if(sm&&SYS.sub) sm.textContent=SYS.sub;
  document.title=nm==="Nearby"?"Nearby Services":nm;
  const admin=SYS.maint&&pAuth(), txt=admin?"Texnik ishlar rejimi yoqilgan: foydalanuvchilar sayt o'rniga xabar ko'radi (siz adminsiz).":(SYS.annOn&&String(SYS.annText||"").trim()?String(SYS.annText).trim():"");
  let ann=document.getElementById("sysAnn");
  if(txt){ if(!ann){ ann=document.createElement("div"); ann.id="sysAnn"; ann.setAttribute("role","status"); document.body.prepend(ann); } ann.className="sys-ann "+(admin?"warn":(SYS.annKind==="warn"?"warn":"info")); ann.textContent=txt; } else if(ann) ann.remove();
  let m=document.getElementById("sysMaint");
  if(SYS.maint&&!pAuth()){ if(!m){ m=document.createElement("div"); m.id="sysMaint"; m.className="sys-maint"; m.innerHTML='<div><span class="sys-mi">⚙</span><h2>Texnik ishlar</h2><p></p></div>'; document.body.appendChild(m); } m.querySelector("p").textContent=SYS.maintText||SYS_DEF.maintText; } else if(m) m.remove();
  try{ render(); }catch(e){}
}
function pSysForm(){
  const sw=(id,label,on,hint)=>`<label class="pn-sw"><span><b>${label}</b>${hint?`<small>${hint}</small>`:""}</span><input type="checkbox" id="${id}"${on?" checked":""}><i aria-hidden="true"></i></label>`;
  const sel=(id,opts,cur)=>`<select class="input" id="${id}">${opts.map(([v,l])=>`<option value="${v}"${String(cur)===String(v)?" selected":""}>${l}</option>`).join("")}</select>`;
  return `<form class="pn-form pn-sysform" data-f="sys"><div class="pn-hero pn-hero2"><div><b>Tizim sozlamalari</b><span>O'zgarishlar saqlangach darhol saytga qo'llanadi</span></div></div>
    <section class="pn-sec"><h4><i>1</i> Umumiy</h4>
      <div class="pn-2"><label>Sayt nomi<input class="input" id="sys-name" maxlength="30" value="${esc(SYS.name)}"></label><label>Qisqa izoh (nom ostida)<input class="input" id="sys-sub" maxlength="50" value="${esc(SYS.sub)}"></label></div>
      <div class="pn-2"><label>Standart til${sel("sys-lang",[["uz","O'zbekcha"],["en","English"],["ru","Русский"],["fr","Français"],["de","Deutsch"]],SYS.lang)}</label><label>Standart mavzu${sel("sys-theme",[["auto","Avtomatik"],["light","Kunduzgi"],["dark","Tungi"]],SYS.theme)}</label></div>
      <p class="muted pn-hint">Foydalanuvchi o'zi til yoki mavzu tanlagan bo'lsa, uning tanlovi saqlanadi. Yangi tashrif buyuruvchilar standartni ko'radi.</p></section>
    <section class="pn-sec"><h4><i>2</i> Standart filtrlar</h4>
      <div class="pn-2"><label>Tartiblash${sel("sys-sort",[["dist","Eng yaqini"],["rating","Reytingi yuqori"],["reviews","Ko'p sharhlangan"]],SYS.sort)}</label><label>Masofa${sel("sys-radius",[[0,"Hammasi"],[1,"1 km"],[5,"5 km"],[10,"10 km"]],SYS.radius)}</label></div>
      ${sw("sys-open","Faqat hozir ochiq xizmatlar",SYS.openNow,"Sayt ochilganda shu filtr yoqilgan bo'ladi")}</section>
    <section class="pn-sec"><h4><i>3</i> Imkoniyatlar</h4>
      ${sw("sys-reviews","Sharh yozish",SYS.fReviews,"O'chirilsa, yangi sharh yozib bo'lmaydi")}${sw("sys-fav","Saralanganlar",SYS.fFav,"♥ tugmasi va filtr")}${sw("sys-share","Ulashish tugmasi",SYS.fShare)}${sw("sys-gallery","Rasmlar galereyasi",SYS.fGallery)}${sw("sys-phone","\"Namuna raqam\" izohi",SYS.fPhone,"Telefon raqami yonidagi eslatma")}${sw("sys-kab","Kabinet tugmasi",SYS.fKabinet,"Tepadagi foydalanuvchi paneli")}${sw("sys-cmp","Taqqoslash",SYS.fCompare,"Xizmatlarni yonma-yon solishtirish")}${sw("sys-rt","Marshrut rejasi",SYS.fRoute,"Bir necha joyga ketma-ket yo'l")}${sw("sys-rep","Xato haqida xabar",SYS.fReport,"Foydalanuvchilar xatolarni adminga yuboradi")}</section>
    <section class="pn-sec"><h4><i>4</i> E'lon</h4>
      ${sw("sys-ann","Saytning tepasida e'lon ko'rsatish",SYS.annOn)}
      <label>E'lon matni<textarea class="input" id="sys-anntext" rows="2" maxlength="200" placeholder="Masalan, Bayram kunlari ish vaqti o'zgargan">${esc(SYS.annText||"")}</textarea></label>
      <label>Turi${sel("sys-annkind",[["info","Xabar (ko'k)"],["warn","Ogohlantirish (sariq)"]],SYS.annKind)}</label></section>
    <section class="pn-sec"><h4><i>5</i> Texnik ishlar rejimi</h4>
      ${sw("sys-maint","Saytni vaqtincha yopish",SYS.maint,"Foydalanuvchilar faqat xabarni ko'radi. Admin kirib ishlashda davom etadi (logotipni 5 marta bosing, Ctrl+Shift+A yoki #admin)")}
      <label>Xabar matni<textarea class="input" id="sys-mainttext" rows="2" maxlength="200">${esc(SYS.maintText||"")}</textarea></label></section>
    <em class="err" id="pn-err"></em>
    <div class="pn-sticky"><button class="btn pn-save" type="submit">Saqlash</button>${pBtn("sysreset","Standart holatga qaytarish")}</div></form>`;
}
/* ----- akkauntlar va kelgan ulashishlar ----- */
const myInbox=()=>SHARES.filter(x=>x.to===ACC_ID);
const unread=()=>myInbox().filter(x=>!x.read).length;
function sendShares(ids,target,msg){ const t=Date.now(); ids.forEach((to,i)=>SHARES.unshift({id:"m"+t+"_"+i,from:ACC_ID,to,item:target,msg:String(msg||"").slice(0,120),ts:t,read:false})); SHARES=SHARES.slice(0,300); LS.set(K_SH,SHARES); }
function updBadge(){ const b=document.querySelector("[data-pn=user]"); if(!b) return; let sp=b.querySelector(".pn-badge"); const n=unread(); if(n){ if(!sp){ sp=document.createElement("span"); sp.className="pn-badge"; sp.setAttribute("aria-label","O'qilmagan ulashishlar"); b.appendChild(sp); } sp.textContent=n>9?"9+":String(n); } else if(sp) sp.remove(); }
function markRead(){ let ch=false; SHARES.forEach(x=>{ if(x.to===ACC_ID&&!x.read){ x.read=true; ch=true; } }); if(ch) LS.set(K_SH,SHARES); updBadge(); }
function timeAgo(ts){ const m=Math.max(0,Math.round((Date.now()-ts)/60000)); if(m<1) return "hozirgina"; if(m<60) return m+" daqiqa oldin"; const h=Math.round(m/60); if(h<24) return h+" soat oldin"; return Math.round(h/24)+" kun oldin"; }
const itemOf=id=>byId(id)||places.find(p=>p.id===id);
function shAccHtml(){
  const o=ACCS.filter(a=>a.id!==ACC_ID); if(!o.length) return "";
  return `<div class="sh-sec"><div class="sh-t">Akkauntga yuborish${ACC_ID!=="guest"?` <small>(siz: ${esc(accName(ACC_ID))})</small>`:""}</div><div class="sh-accs">${o.map(a=>`<label class="sh-ac"><input type="checkbox" value="${a.id}"><span class="ac-av" style="background:${accColor(a.id)}">${esc(a.name[0])}</span><span>${esc(a.name)}</span></label>`).join("")}</div><div class="sh-send"><input class="input" id="sh-msg" maxlength="120" placeholder="Xabar (ixtiyoriy)" aria-label="Xabar"><button type="button" class="btn btn-primary" data-sh="send">Yuborish</button></div></div>`;
}
function pInbox(){
  const list=myInbox();
  if(!list.length) return `<p class="muted">Hali sizga hech narsa ulashilmagan. Boshqa akkaunt xizmatni <b>Ulashish</b> orqali sizga yuborsa, shu yerda ko'rinadi.</p>`;
  return `<div class="pn-bar"><span class="muted">${list.length} ta xabar</span>${pBtn("inbox-clear","Hammasini tozalash","","danger")}</div><ul class="pn-list">${list.map(x=>{ const it=itemOf(x.item), nm=it?esc(it.name):"(o'chirilgan)"; return `<li class="pn-row${x.read?"":" pn-unread"}"><span class="ac-av" style="background:${accColor(x.from)}">${esc(accName(x.from)[0])}</span><div class="pn-rm"><b>${nm}</b><small>${esc(accName(x.from))} yubordi · ${timeAgo(x.ts)}${x.msg?" · «"+esc(x.msg)+"»":""}</small></div><div class="pn-ra">${it?pBtn("inbox-open","Ochish",`data-id="${esc(x.item)}"`,"btn-primary"):""}${pBtn("inbox-del","O'chirish",`data-id="${x.id}"`,"danger")}</div></li>`; }).join("")}</ul>`;
}
function pAccounts(){
  return `<ul class="pn-list">${ACCS.map(a=>`<li class="pn-row"><span class="ac-av" style="background:${accColor(a.id)}">${esc(a.name[0])}</span><div class="pn-rm"><b>${esc(a.name)}${a.id===ACC_ID?' <span class="pill open">hozirgi</span>':""}</b><small>${a.id==="guest"?"Asosiy akkaunt":"Demo akkaunt"}</small></div><div class="pn-ra">${a.id===ACC_ID?"":pBtn("acc-login","Kirish",`data-id="${a.id}"`,"btn-primary")}${(a.id==="guest"||a.id===ACC_ID)?"":pBtn("acc-del","O'chirish",`data-id="${a.id}"`,"danger")}</div></li>`).join("")}</ul>
  <form class="pn-form" data-f="newacc" style="margin-top:16px"><h4 class="pn-h4">Yangi akkaunt qo'shish</h4><label>Ism<input class="input" id="pn-accname" maxlength="24" placeholder="Masalan, Bobur"></label><em class="err" id="pn-err"></em><div><button class="btn btn-primary" type="submit">Qo'shish</button></div>
  <p class="muted pn-hint">Demo: akkauntlar shu brauzerda saqlanadi, parol yo'q. Akkaunt almashtirilsa, saralanganlar va kelgan ulashishlar ham o'zgaradi.</p></form>`;
}
function pPersist(){ LSX.set(K_ADD,A_ADD); LSX.set(K_EDIT,A_EDIT); LSX.set(K_DEL,A_DEL); LSX.set(K_HID,A_HID); }
function pRefreshSite(){ try{ if(!vDetail.hidden&&state.sel&&!byId(state.sel.id)&&state.sel.kind==="service") showList(); render(); }catch(e){} }
function pConfirm(o,onOk){
  const prev=document.activeElement, d=document.createElement("div"); d.className="pn-cf"; d.setAttribute("role","alertdialog"); d.setAttribute("aria-modal","true");
  d.innerHTML='<div class="pn-cfbox"><div class="pn-cfico" aria-hidden="true">!</div><h3></h3><p></p><div class="pn-cfa"><button type="button" class="btn" data-c="no">Bekor qilish</button><button type="button" class="btn pn-cfok" data-c="ok"></button></div></div>';
  d.querySelector("h3").textContent=o.title; d.querySelector("p").textContent=o.text; d.querySelector(".pn-cfok").textContent=o.ok||"Tasdiqlash";
  const key=e=>{ if(e.key==="Escape"){ e.preventDefault(); e.stopImmediatePropagation(); close(); } };
  const close=()=>{ d.remove(); window.removeEventListener("keydown",key,true); if(prev&&prev.focus){ try{ prev.focus({preventScroll:true}); }catch(e){} } };
  d.addEventListener("click",e=>{ const b=e.target.closest("[data-c]"); if(b){ const ok=b.dataset.c==="ok"; close(); if(ok) onOk(); } else if(e.target===d) close(); });
  window.addEventListener("keydown",key,true); document.body.appendChild(d); d.querySelector('[data-c="no"]').focus();
}
let pArmT=0; const pArm=v=>{ PARM=v; clearTimeout(pArmT); pArmT=setTimeout(()=>{ PARM=0; if(PN&&!PN.hidden) pRenderBody(); },4000); };

function pClick(e){
  if(e.target===PN||e.target.closest(".pn-x")){ pClose(); return; }
  const el=e.target.closest("[data-pa]"); if(!el) return; const a=el.dataset.pa, id=el.dataset.id;
  if(a==="tab"){ PTAB=el.dataset.k; PEDIT=null; PLIM=40; PSRCH=""; PONLY=false; PARM=0; pRender(); if(PTAB==="inbox") markRead(); return; }
  if(a==="open"){ pClose(true); try{ if(/^#(kabinet|admin)$/.test(location.hash)) history.replaceState(null,"",location.pathname+location.search); }catch(_){} const s=byId(id); if(s&&s.region&&state.region&&state.region!==s.region){ state.region=s.region; selectRegion(regionById(s.region)); render(); } openService(id); return; }
  if(a==="unfav"){ toggleFav(id); pRenderBody(); return; }
  if(a==="delmine"){ const list=myReviews[id]||[], i=+el.dataset.i, r=list[i], s=byId(id); if(r&&s){ list.splice(i,1); if(!list.length) delete myReviews[id]; LS.set(STORE_REV,myReviews); const k=s.reviews.findIndex(x=>x.ts===r.ts&&x.text===r.text); if(k>=0) s.reviews.splice(k,1); dropRating(s,r); toast("Sharh o'chirildi"); pRefreshSite(); pRenderBody(); } return; }
  if(a==="clearme"){ pConfirm({title:"Ma'lumotlarni tozalash",text:"Ismingiz, saralanganlar va ko'rilganlar ro'yxati shu brauzerdan o'chiriladi.",ok:"Ha, tozalash"},()=>{ FAV.clear(); try{ localStorage.removeItem(FAV_KEY); localStorage.removeItem(K_PROF); localStorage.removeItem(K_RECENT); }catch(_){} PROF={name:""}; RECENT=[]; toast("Ma'lumotlar tozalandi"); renderCats(); pRenderBody(); }); return; }
  if(a==="acc-login"){ try{ localStorage.setItem(ACC_KEY,id); }catch(_){} try{ history.replaceState(null,"",location.pathname+location.search+"#kabinet"); }catch(_){} location.reload(); return; }
  if(a==="acc-del"){ pConfirm({title:"Akkauntni o'chirish",text:"«"+accName(id)+"» akkaunti va unga tegishli ulashishlar o'chiriladi.",ok:"Ha, o'chirish"},()=>{ ACCS=ACCS.filter(x=>x.id!==id); LS.set(ACCS_KEY,ACCS); SHARES=SHARES.filter(x=>x.to!==id&&x.from!==id); LS.set(K_SH,SHARES); try{ ["ns_fav_","ns_profile_","ns_recent_","ns_recent_q_"].forEach(p=>localStorage.removeItem(p+id)); }catch(_){} toast("Akkaunt o'chirildi"); pRenderBody(); }); return; }
  if(a==="inbox-open"){ pClose(true); try{ if(/^#(kabinet|admin)$/.test(location.hash)) history.replaceState(null,"",location.pathname+location.search); }catch(_){} location.hash="#s-"+id; return; }
  if(a==="inbox-del"){ SHARES=SHARES.filter(x=>x.id!==id); LS.set(K_SH,SHARES); updBadge(); pRenderBody(); return; }
  if(a==="inbox-clear"){ pConfirm({title:"Xabarlarni tozalash",text:"Sizga kelgan barcha ulashishlar o'chiriladi.",ok:"Ha, tozalash"},()=>{ SHARES=SHARES.filter(x=>x.to!==ACC_ID); LS.set(K_SH,SHARES); updBadge(); pRenderBody(); }); return; }
  if(a==="rep-ok"){ const r=REPORTS.find(x=>x.id===id); if(r){ r.status="resolved"; LS.set(K_REP,REPORTS); } pRender(); return; }
  if(a==="rep-del"){ REPORTS=REPORTS.filter(x=>x.id!==id); LS.set(K_REP,REPORTS); pRender(); return; }
  if(a==="rep-clear"){ REPORTS=REPORTS.filter(x=>x.status==="new"); LS.set(K_REP,REPORTS); pRender(); return; }
  if(a==="rep-open"){ pClose(true); try{ if(/^#(kabinet|admin)$/.test(location.hash)) history.replaceState(null,"",location.pathname+location.search); }catch(_){} location.hash="#s-"+id; return; }
  if(a==="usecenter"||a==="useuser"){ const p=a==="usecenter"?{x:view.x+view.w/2,y:view.y+view.h/2}:state.user, ll=toLatLng(p.x,p.y); PN.querySelector("#f-lat").value=ll.lat.toFixed(5); PN.querySelector("#f-lng").value=ll.lng.toFixed(5); const rg=regionAt(p); if(rg&&PN.querySelector("#f-region")) PN.querySelector("#f-region").value=rg.id; if(!PN.querySelector("#f-district").value) PN.querySelector("#f-district").value=nearestDistrict(Math.round(p.x),Math.round(p.y)); toast(a==="usecenter"?"Xarita markazi olindi":"Sizning nuqtangiz olindi"); pPreview(); return; }
  if(a==="addprice"){ PN.querySelector("#f-prices").insertAdjacentHTML("beforeend",pPriceRow()); const r=PN.querySelectorAll(".pn-pn"); r[r.length-1].focus(); return; }
  if(a==="delprice"){ const row=el.closest(".pn-price"), box=row.parentElement; if(box.children.length>1) row.remove(); else row.querySelectorAll("input").forEach(i=>i.value=""); return; }
  if(a==="new"){ PEDIT="new"; pRenderBody(); PN.querySelector(".pn-body").scrollTop=0; return; }
  if(a==="edit"){ PEDIT=id; pRenderBody(); PN.querySelector(".pn-body").scrollTop=0; return; }
  if(a==="cancel"){ PEDIT=null; pRenderBody(); return; }
  if(a==="more"){ PLIM+=40; pRenderBody(); return; }
  if(a==="del"){ const s0=byId(id); pConfirm({title:"Xizmatni o'chirish",text:"«"+(s0?s0.name:"")+"» xizmati o'chiriladi.",ok:"Ha, o'chirish"},()=>{ const s=byId(id); if(s){ const ai=A_ADD.findIndex(x=>x.id===id); if(ai>=0) A_ADD.splice(ai,1); else A_DEL.push(id); delete A_EDIT[id]; services.splice(services.indexOf(s),1); FAV.delete(id); pPersist(); toast("Xizmat o'chirildi"); pRefreshSite(); } pRenderBody(); }); return; }
  if(a==="hide"){ const sig=el.dataset.sig, sid=sig.split("|")[0], s=byId(sid); if(s){ const i=s.reviews.findIndex(r=>revSig(sid,r)===sig); if(i>=0){ const r=s.reviews[i]; dropRating(s,r); s.reviews.splice(i,1); A_HID.push(sig); pPersist(); toast("Sharh o'chirildi"); pRefreshSite(); } } pRenderBody(); return; }
  if(a==="sysreset"){ SYS=Object.assign({},SYS_DEF); LS.set(SYS_KEY,SYS); state.sort=SYS.sort; state.radius=SYS.radius; state.openNow=SYS.openNow; { const so=$("#sort"); if(so) so.value=state.sort; const on=$("#openNow"); if(on) on.checked=false; try{ setPressed($("#segRadius"),0); }catch(_){} } applySys(); toast("Standart sozlamalar qaytarildi"); pRenderBody(); return; }
  if(a==="factory"){ pConfirm({title:"Zavod holiga qaytarish",text:"Barcha sozlamalar, saralanganlar, sharhlar va admin o'zgarishlari shu brauzerdan o'chiriladi. Buni qaytarib bo'lmaydi.",ok:"Ha, qaytarish"},()=>{ try{ Object.keys(localStorage).filter(k=>/^(ns_|nearby-proto)/.test(k)).forEach(k=>localStorage.removeItem(k)); sessionStorage.clear(); }catch(_){} toast("Tizim zavod holiga qaytarildi. Sahifa yangilanadi"); setTimeout(()=>location.reload(),700); }); return; }
  if(a==="logout"){ try{ sessionStorage.removeItem("ns_admin_ok"); }catch(_){} PTAB="stats"; applySys(); pRender(); return; }
  if(a==="reset"){ pConfirm({title:"Admin o'zgarishlarini bekor qilish",text:"Qo'shilgan, tahrirlangan va o'chirilgan xizmatlar hamda o'chirilgan sharhlar asl holatiga qaytadi.",ok:"Ha, bekor qilish"},()=>{ for(const k of [K_ADD,K_EDIT,K_DEL,K_HID]) try{ localStorage.removeItem(k); }catch(_){} toast("Admin o'zgarishlari bekor qilindi. Sahifa yangilanadi"); setTimeout(()=>location.reload(),700); }); return; }
  if(a==="export"){ const txt=JSON.stringify({settings:SYS,added:A_ADD,edited:A_EDIT,deleted:A_DEL,hiddenReviews:A_HID}); copyText(txt); return; }
}
function pSubmit(e){
  const f=e.target.closest("form[data-f]"); if(!f) return; e.preventDefault(); const kind=f.dataset.f, err=PN.querySelector("#pn-err");
  const fail=m=>{ if(err) err.textContent=m; };
  if(kind==="newacc"){ const nm=PN.querySelector("#pn-accname").value.trim(); if(nm.length<2) return fail("Ism kamida 2 belgi bo'lsin"); if(ACCS.length>=12) return fail("Akkauntlar soni 12 tadan oshmasin"); if(ACCS.some(a=>a.name.toLowerCase()===nm.toLowerCase())) return fail("Bunday ismli akkaunt bor");
    let id=nm.toLowerCase().replace(/[^a-z0-9]+/g,"")||"user", base=id, n=1; while(accById(id)) id=base+(++n); ACCS.push({id,name:nm}); LS.set(ACCS_KEY,ACCS); toast("Akkaunt qo'shildi"); pRenderBody(); return; }
  if(kind==="profile"){ PROF.name=PN.querySelector("#pn-name").value.trim().slice(0,40); LSX.set(K_PROF,PROF); toast("Saqlandi"); return; }
  if(kind==="login"){ if(PN.querySelector("#pn-pass").value===pPass()){ try{ sessionStorage.setItem("ns_admin_ok","1"); }catch(_){} PTAB="stats"; applySys(); pRender(); } else fail("Parol noto'g'ri"); return; }
  if(kind==="pass"){ const v=PN.querySelector("#pn-newpass").value; if(v.length<6){ fail("Kamida 6 belgi kiriting"); return; } LSX.set(K_PASS,v); toast("Parol o'zgartirildi"); PN.querySelector("#pn-newpass").value=""; return; }
  if(kind==="sys"){
    const g=id=>PN.querySelector("#"+id), name=g("sys-name").value.trim();
    if(name.length<2) return fail("Sayt nomi kamida 2 belgi bo'lsin");
    SYS=Object.assign({},SYS_DEF,{name,sub:g("sys-sub").value.trim(),lang:g("sys-lang").value,theme:g("sys-theme").value,sort:g("sys-sort").value,radius:+g("sys-radius").value,openNow:g("sys-open").checked,
      fReviews:g("sys-reviews").checked,fFav:g("sys-fav").checked,fShare:g("sys-share").checked,fGallery:g("sys-gallery").checked,fPhone:g("sys-phone").checked,fKabinet:g("sys-kab").checked,fCompare:g("sys-cmp").checked,fRoute:g("sys-rt").checked,fReport:g("sys-rep").checked,
      annOn:g("sys-ann").checked,annText:g("sys-anntext").value.trim(),annKind:g("sys-annkind").value,maint:g("sys-maint").checked,maintText:g("sys-mainttext").value.trim()||SYS_DEF.maintText});
    if(SYS.annOn&&!SYS.annText) return fail("E'lon yoqilgan, lekin matni bo'sh");
    LS.set(SYS_KEY,SYS); applySys(); toast("Sozlamalar saqlandi"); pRenderBody(); return;
  }
  if(kind==="svc"){
    const g=id=>PN.querySelector("#"+id), name=g("f-name").value.trim(), lat=parseFloat(g("f-lat").value.replace(",",".")), lng=parseFloat(g("f-lng").value.replace(",","."));
    if(name.length<2) return fail("Nomi kamida 2 belgi bo'lsin");
    if(!(lat>=37&&lat<=46)||!(lng>=55&&lng<=74)) return fail("Koordinata O'zbekiston ichida bo'lsin (lat 37–46, lng 55–74)");
    const h24=g("f-h24").checked, pr=[...PN.querySelectorAll(".pn-price")].map(r=>[r.querySelector(".pn-pn").value.trim(),parseInt(String(r.querySelector(".pn-pp").value).replace(/\D/g,""),10)]).filter(x=>x[0]&&x[1]>0), catEl=PN.querySelector('input[name="f-catr"]:checked'), ch={name,cat:catEl?catEl.value:"barber",prices:pr,region:g("f-region").value,district:g("f-district").value.trim(),address:g("f-address").value.trim(),phone:g("f-phone").value.trim(),desc:g("f-desc").value.trim()};
    if(h24){ ch.h24=true; } else { ch.h24=false; ch.open=g("f-open").value||"09:00"; ch.close=g("f-close").value||"18:00"; }
    const id=f.dataset.id, s=id?byId(id):null, w=ll2w(lng,lat);
    if(s){ const old=toLatLng(s.x,s.y); if(old.lat.toFixed(5)!==lat.toFixed(5)||old.lng.toFixed(5)!==lng.toFixed(5)){ ch.x=w.x; ch.y=w.y; } Object.assign(s,ch);
      const ai=A_ADD.findIndex(x=>x.id===id); if(ai>=0) Object.assign(A_ADD[ai],ch); else A_EDIT[id]=Object.assign(A_EDIT[id]||{},ch); toast("Xizmat yangilandi"); }
    else { const nid="a"+(A_ADD.reduce((m,x)=>Math.max(m,+x.id.slice(1)||0),0)+1); const n=Object.assign({id:nid,x:w.x,y:w.y,days:ALL,rating:0,count:0,prices:[],dist:[0,0,0,0,0],reviews:[]},ch); if(!n.district) n.district=nearestDistrict(n.x,n.y); if(!n.address) n.address=addressFor(n.x,n.y); A_ADD.push(n); services.push(n); toast("Yangi xizmat qo'shildi"); }
    pPersist(); PEDIT=null; pRefreshSite(); pRenderBody(); return;
  }
}
function pHeaderButtons(){
  const tb=document.getElementById("themeBtn"); if(!tb||document.querySelector("[data-pn]")) return;
  const mk=(k,label,path)=>{ const b=document.createElement("button"); b.type="button"; b.className="btn pn-btn"; b.dataset.pn=k; b.setAttribute("aria-label",label);
    b.innerHTML='<svg class="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg><span class="pn-l">'+label+'</span>'; return b; };
  tb.insertAdjacentElement("beforebegin",mk("user",ACC_ID==="guest"?"Kabinet":accName(ACC_ID),'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>'));
}
document.addEventListener("click",e=>{ const b=e.target.closest("[data-pn]"); if(b) pOpen(b.dataset.pn); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&PN&&!PN.hidden){ e.preventDefault(); e.stopImmediatePropagation(); pClose(); } },true);
function pRoute(){ const h=location.hash; if(h==="#kabinet") pOpen("user",true); else if(h==="#admin") pOpen("admin",true); else if(PN&&!PN.hidden) pClose(true); }
addEventListener("popstate",pRoute); addEventListener("hashchange",pRoute);
pHeaderButtons(); updBadge();
/* Admin paneliga yashirin kirish: logotipni 3 soniyada 5 marta bosing, Ctrl/Cmd+Shift+A yoki #admin havolasi */
{ let clicks=[];
  document.addEventListener("click",e=>{ if(!e.target.closest(".brand .mk")) return; const t=Date.now(); clicks=clicks.filter(x=>t-x<3000); clicks.push(t); if(clicks.length>=5){ clicks=[]; pOpen("admin"); } });
  document.addEventListener("keydown",e=>{ if((e.ctrlKey||e.metaKey)&&e.shiftKey&&(e.key==="A"||e.key==="a")){ e.preventDefault(); pOpen("admin"); } });
}
/* Tizim sozlamalari standart qiymatlari */
state.sort=["dist","rating","reviews"].includes(SYS.sort)?SYS.sort:"dist"; state.radius=[0,1,5,10].includes(+SYS.radius)?+SYS.radius:0; state.openNow=!!SYS.openNow;
{ const so=$("#sort"); if(so) so.value=state.sort; const on=$("#openNow"); if(on) on.checked=state.openNow; try{ setPressed($("#segRadius"),state.radius); }catch(e){} }
applySys();
