/* ---------- sharh ---------- */
const newRid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
document.addEventListener("submit",e=>{
  if(e.target.id==="ocoord"){
    e.preventDefault();
    const c=parseCoord($("#ocin").value);
    if(!c){ $("#ocerr").textContent="Koordinatani shunday yozing: 41.29950, 69.24010"; return; }
    if(c.bad){ $("#ocerr").textContent="Bu nuqta O'zbekiston hududidan tashqarida ko'rinadi. Tekshiring: kenglik 37–45, uzunlik 56–73."; return; }
    const w=ll2w(c.lng,c.lat); setUser(w.x,w.y,"Kiritilgan koordinata"); flyTo(w.x,w.y,Math.min(view.w,7000)); return;
  }
  if(e.target.id!=="revForm")return;
  e.preventDefault();
  const s=byId(state.sel&&state.sel.id); if(!s)return;
  const st=e.target.querySelector('input[name="rs"]:checked'), text=$("#revText").value.trim();
  if(!st||text.length<3){$("#errRev").textContent=!st?"Yulduzcha bilan baho bering.":"Sharh matnini yozing (kamida 3 belgi).";return;}
  const r={rid:newRid(),name:$("#revName").value.trim().slice(0,60)||"Mehmon",stars:+st.value,text:text.slice(0,1000),ts:Date.now()};
  const prevAvg=s.count?s.rating:0;
  applyReview(s,r);
  if(!s.dist||!prevAvg) s.dist=distFrom(s.rating);
  (myReviews[s.id]=myReviews[s.id]||[]).push(r); LS.set(STORE_REV,myReviews);
  api.post("/reviews",{serviceId:s.id,...r});
  openService(s.id);
  const sec=$("#revSec"); sec&&sec.scrollIntoView({block:"start"});
  toast("Sharhingiz qo'shildi");
});

/* ---------- umumiy tugmalar ---------- */
let toastT=0;
function toast(msg){const t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2600);}
function copyText(txt){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(()=>toast(`Nusxalandi: ${txt}`)).catch(()=>toast("Nusxalab bo'lmadi — matnni belgilab, Ctrl+C bosing"));
  } else toast("Nusxalab bo'lmadi — matnni belgilab, Ctrl+C bosing");
}
document.addEventListener("click",e=>{
  const cityBtn=e.target.closest("[data-city]");
  if(cityBtn){ openCity(cityBtn.dataset.city); return; }
  const open=e.target.closest("[data-open]");
  if(open){ const id=open.dataset.open; id.startsWith("p")?openPlace(id):openService(id); return; }
  const fv=e.target.closest("[data-fav]"); if(fv){ state.fav=!state.fav; render(); return; }
  const cat=e.target.closest("[data-cat]");
  if(cat){ state.cat=cat.dataset.cat; render(); return; }
  const layer=e.target.closest("[data-layer]");
  if(layer){ const k=layer.dataset.layer, on=!state.layers.has(k);
    on?state.layers.add(k):state.layers.delete(k);
    if(vDetail.hidden) render(); else { renderLayers(); renderMarkers(filtered(false)); }
    // viloyat tanlangan bo'lsa, yoqilgan qatlam joylarini xaritada ko'rsatish
    if(on&&state.region){ const pts=places.filter(p=>p.t===k&&inRegion(p)); if(pts.length) fitPoints(pts,1.4); }
    return; }
  if(e.target.closest('[data-act="more-places"]')){ state.allPlaces=true; render(); return; }
  const rb=e.target.closest("#segRadius button");
  if(rb){ state.radius=+rb.dataset.v; setPressed($("#segRadius"),rb.dataset.v); render();
    if(state.radius){const r=state.radius*1000;flyTo(state.user.x,state.user.y,Math.max(2.3*r,2.3*r*pxW/pxH));} return; }
  const gb=e.target.closest("#segRating button");
  if(gb){ state.minRating=+gb.dataset.v; setPressed($("#segRating"),gb.dataset.v); render(); return; }
  if(state.pickOpen&&!e.target.closest("#regPick,#mapScope,#panelScope,#regionBar")){ state.pickOpen=false; renderPick(); }
  const act=e.target.closest("[data-act]"); if(!act)return;
  const a=act.dataset.act;
  if(a==="back") showList();
  else if(a==="zoom-in") flyTo(view.x+view.w/2,view.y+view.h/2,view.w/1.8,260);
  else if(a==="zoom-out") flyTo(view.x+view.w/2,view.y+view.h/2,view.w*1.8,260);
  else if(a==="locate") flyTo(state.user.x,state.user.y,Math.min(view.w,7000),view.w>40000?800:420);
  else if(a==="country") fitPoints(UZB,1.08);
  else if(a==="to-tashkent"){ showList(); flyTo(state.user.x,state.user.y,14000,800); }
  else if(a==="share") shareThis();
  else if(a==="fav") toggleFav(act.dataset.id);
  else if(a==="cmp") cmpToggle(act.dataset.id);
  else if(a==="rt") rtToggle(act.dataset.id);
  else if(a==="vote") toggleVote(act);
  else if(a==="report") reportOpen(act.dataset.id);
  else if(a==="copy") copyText(act.dataset.copy);
  else if(a==="route"){ const t=selectedPoint(); if(t) fitPoints([state.user,t],1.5); }
  else if(a==="to-review"){ const f=$("#revForm"); if(f){f.scrollIntoView({behavior:"smooth",block:"center"}); setTimeout(()=>$("#rs5").focus({preventScroll:true}),350);} }
  else if(a==="set-user"){ const m=state.mark; state.mark=null; showList(); setUser(m.x,m.y,"Xaritadan tanlangan nuqta"); }
  else if(a==="geolocate") geolocate();
  else if(a==="coord-toggle"){ const f=$("#ocoord"); f.hidden=!f.hidden; $("#ocerr").textContent=""; if(!f.hidden) $("#ocin").focus(); }
  else if(a==="clear-region") setRegion(null);
  else if(a==="gal-prev"||a==="gal-next"){ const g=act.closest(".galwrap").querySelector(".gallery"), f=g.firstElementChild; g.scrollBy({left:(a==="gal-next"?1:-1)*(f.offsetWidth+10),behavior:"smooth"}); }
  else if(a==="scope-local"){ if(!swNoClick) scopeLocal(true); }
  else if(a==="pick-region"){ state.pickOpen=false; setRegion(regionById(act.dataset.id)); }
  else if(a==="scope-country"){ if(!swNoClick) scopeCountry(); }
  else if(a==="more-list"){ loadMore(); }
  else if(a==="reset"){ state.region=null;selectRegion(null);state.cat="all";state.radius=0;state.minRating=0;state.openNow=false;state.fav=false;state.q="";$("#q").value="";$("#openNow").checked=false;setPressed($("#segRadius"),0);setPressed($("#segRating"),0);render(); }
});
document.addEventListener("mouseover",e=>{
  const c=e.target.closest(".card[data-open]");
  svg.querySelectorAll(".mk.hl").forEach(m=>m.classList.remove("hl"));
  if(c&&markerEls[c.dataset.open]) markerEls[c.dataset.open].classList.add("hl");
});
document.addEventListener("keydown",e=>{
  if(e.key!=="Escape")return;
  if(!vDetail.hidden) showList();
});
let qTimer=0;
$("#q").addEventListener("input",e=>{ state.q=e.target.value; if(!vDetail.hidden){vDetail.hidden=true;vList.hidden=false;state.sel=null;state.mark=null;} clearTimeout(qTimer); qTimer=setTimeout(render,140); });
$("#q").addEventListener("keydown",e=>{ if(e.key==="Enter"){ const l=filtered(false); if(l.length) fitPoints(l.slice(0,30).map(r=>r.s)); } });
// Qatlam tugmalari qatori: sichqoncha g'ildiragi (tepaga/pastga) qatorni chapga/o'ngga suradi
$("#layers").addEventListener("wheel",e=>{
  const el=e.currentTarget, d=Math.abs(e.deltaY)>Math.abs(e.deltaX)?e.deltaY:e.deltaX;
  if(el.scrollWidth<=el.clientWidth) return;
  e.preventDefault(); e.stopPropagation();
  el.scrollLeft+=d*(e.deltaMode===1?30:1);
},{passive:false});
$("#openNow").addEventListener("change",e=>{ state.openNow=e.target.checked; render(); });
$("#sort").addEventListener("change",e=>{ state.sort=e.target.value; render(); });

/* ---------- ishga tushirish ---------- */
let initPending=false; // sahifa ochilganda xarita hali o'lchamsiz bo'lsa, boshlang'ich ko'rinish o'lcham kelganda qo'yiladi
function measure(){ const r=svg.getBoundingClientRect(); const cx=view.x+view.w/2, cy=view.y+view.h/2, k=pxW?view.w/pxW:14; pxW=Math.max(1,r.width); pxH=Math.max(1,r.height); sizeReal();
  if(initPending&&r.width>=50){ initPending=false; setCenter(state.user.x,state.user.y,clamp(pxW*5.5,3200,6500)); } else setCenter(cx,cy,k*pxW); applyView(); }

