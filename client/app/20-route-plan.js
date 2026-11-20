/* ===== Marshrut rejasi: bir nechta joyga ketma-ket yo'l ===== */
const K_RT="ns_route"; let ROUTE=LS.get(K_RT,[]).filter(id=>itemOf(id)).slice(0,6), RT_SHOW=false, RT_MODE=LS.get("ns_route_mode","car");
function rtLeg(a,b){
  const d=gdist(a,b); let rt=null; try{ rt=getRoute(a,b); }catch(e){}
  if(rt&&!rt.far&&(rt.walk||rt.drive)) return {len:(rt.drive||rt.walk).len,walk:rt.walk?rt.walk.min:walkMin(d),car:rt.drive?rt.drive.min:driveMin(d),rt};
  return {len:d,walk:walkMin(d),car:driveMin(d),rt:null};
}
function rtPlan(){ const out=[]; let prev=state.user; for(const id of ROUTE){ const t=itemOf(id); if(!t) continue; out.push({id,t,L:rtLeg(prev,t)}); prev=t; } return out; }
function rtSave(){
  LS.set(K_RT,ROUTE); rtBar();
  document.querySelectorAll('[data-act="rt"]').forEach(b=>{ const on=ROUTE.includes(b.dataset.id); b.setAttribute("aria-pressed",String(on)); const t=b.querySelector(".rt"); if(t) t.textContent=on?"Marshrutda":"Marshrutga"; });
  if(!ROUTE.length) RT_SHOW=false;
  try{ renderOverlays(); }catch(e){}
}
function rtToggle(id){
  if(ROUTE.includes(id)) ROUTE=ROUTE.filter(x=>x!==id);
  else { if(ROUTE.length>=6){ toast("Marshrutga eng ko'pi bilan 6 ta joy qo'shish mumkin"); return; } ROUTE.push(id); toast("Marshrutga qo'shildi: "+ROUTE.length+"-joy"); }
  rtSave();
}
function rtBar(){
  let b=document.getElementById("rtBar"), R=document.documentElement.classList;
  if(!ROUTE.length||!SYS.fRoute){ if(b) b.remove(); R.remove("has-rt"); return; }
  R.add("has-rt");
  if(!b){ b=document.createElement("div"); b.id="rtBar"; b.className="cmp-bar rt-bar"; b.setAttribute("role","region"); b.setAttribute("aria-label","Marshrut rejasi"); document.body.appendChild(b);
    b.addEventListener("click",e=>{ const a=e.target.closest("[data-rb]"); if(!a) return; if(a.dataset.rb==="open") rtOpen(); else if(a.dataset.rb==="clear"){ ROUTE=[]; rtSave(); } }); }
  b.innerHTML=`<span class="cmp-n rt-n">${ROUTE.length}</span><span class="cmp-names">Marshrut: ${ROUTE.map(id=>esc((itemOf(id)||{}).name||"")).join(" → ")}</span><button type="button" class="btn btn-primary sm" data-rb="open">Marshrut</button><button type="button" class="btn sm" data-rb="clear" aria-label="Tozalash">×</button>`;
}
function rtLinks(plan){
  const ll=o=>{ const p=toLatLng(o.x,o.y); return p.lat.toFixed(6)+","+p.lng.toFixed(6); };
  if(!plan.length) return {g:"",y:""};
  const mode=RT_MODE==="walk"?"walking":"driving", last=plan[plan.length-1].t, way=plan.slice(0,-1).map(p=>ll(p.t)).join("|");
  const g="https://www.google.com/maps/dir/?api=1&origin="+ll(state.user)+"&destination="+ll(last)+(way?"&waypoints="+encodeURIComponent(way):"")+"&travelmode="+mode;
  const y="https://yandex.com/maps/?rtext="+[ll(state.user),...plan.map(p=>ll(p.t))].join("~")+"&rtt="+(RT_MODE==="walk"?"pd":"auto");
  return {g,y};
}
function rtOpen(){
  document.querySelectorAll(".rt-dlg").forEach(x=>x.remove());
  const plan=rtPlan(); if(!plan.length){ toast("Marshrut bo'sh"); return; }
  const prev=document.activeElement, d=document.createElement("div"); d.className="pn-cf cmp-dlg rt-dlg"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-label","Marshrut rejasi");
  const km=m=>fmtKm(m), tot=plan.reduce((a,p)=>({len:a.len+p.L.len,walk:a.walk+p.L.walk,car:a.car+p.L.car}),{len:0,walk:0,car:0}), mode=RT_MODE==="walk"?"walk":"car", L=rtLinks(plan);
  const leg=p=>`${km(p.L.len)} · ~${fmtMin(p.L[mode])}`;
  d.innerHTML=`<div class="pn-cfbox cmp-box rt-box"><button type="button" class="sh-x" data-rt="x" aria-label="Yopish">×</button><h3>Marshrut rejasi</h3>
    <div class="rt-sum"><div><b>${km(tot.len)}</b><span>jami masofa</span></div><div><b>~${fmtMin(tot[mode])}</b><span>${mode==="walk"?"piyoda":"mashinada"}</span></div><div class="rt-mode" role="group" aria-label="Yurish usuli"><button type="button" data-rt="mode-car" aria-pressed="${mode==="car"}">Mashinada</button><button type="button" data-rt="mode-walk" aria-pressed="${mode==="walk"}">Piyoda</button></div></div>
    <ol class="rt-list"><li class="rt-start"><span class="rt-no">A</span><div class="rt-m"><b>${esc(state.user.label||"Siz turgan joy")}</b><small>Boshlanish nuqtasi</small></div></li>${plan.map((p,i)=>`<li><span class="rt-no">${i+1}</span><span class="rt-logo">${p.t.cat?serviceLogo(p.t):""}</span><div class="rt-m"><b>${esc(p.t.name)}</b><small>${leg(p)}</small></div><div class="rt-ops"><button type="button" class="btn sm" data-rt="up" data-i="${i}" aria-label="Yuqoriga"${i===0?" disabled":""}>↑</button><button type="button" class="btn sm" data-rt="down" data-i="${i}" aria-label="Pastga"${i===plan.length-1?" disabled":""}>↓</button><button type="button" class="btn sm" data-rt="rm" data-i="${i}" aria-label="Olib tashlash">×</button></div></li>`).join("")}</ol>
    <div class="rt-acts"><button type="button" class="btn btn-primary" data-rt="show">${RT_SHOW?"Xaritadan yashirish":"Xaritada ko'rsatish"}</button><button type="button" class="btn" data-rt="opt">Eng qisqa tartib</button></div>
    <div class="rt-acts"><a class="btn" href="${esc(L.g)}" target="_blank" rel="noopener noreferrer">Google Maps</a><a class="btn" href="${esc(L.y)}" target="_blank" rel="noopener noreferrer">Yandex Maps</a><button type="button" class="btn" data-rt="clear">Tozalash</button></div>
    <p class="sh-hint">Vaqt taxminiy: tirbandlik hisobga olinmagan. "Eng qisqa tartib" joylarni sizdan boshlab eng yaqinidan boshlab joylashtiradi.</p></div>`;
  const key=e=>{ if(e.key==="Escape"){ e.preventDefault(); e.stopImmediatePropagation(); close(); } };
  const close=()=>{ d.remove(); window.removeEventListener("keydown",key,true); if(prev&&prev.focus){ try{ prev.focus({preventScroll:true}); }catch(e){} } };
  d.addEventListener("click",e=>{
    if(e.target===d||e.target.closest('[data-rt="x"]')){ close(); return; }
    const b=e.target.closest("[data-rt]"); if(!b) return; const a=b.dataset.rt, i=+b.dataset.i;
    if(a==="mode-car"||a==="mode-walk"){ RT_MODE=a==="mode-walk"?"walk":"car"; LS.set("ns_route_mode",RT_MODE); close(); rtOpen(); return; }
    if(a==="up"&&i>0){ [ROUTE[i-1],ROUTE[i]]=[ROUTE[i],ROUTE[i-1]]; rtSave(); close(); rtOpen(); return; }
    if(a==="down"&&i<ROUTE.length-1){ [ROUTE[i+1],ROUTE[i]]=[ROUTE[i],ROUTE[i+1]]; rtSave(); close(); rtOpen(); return; }
    if(a==="rm"){ ROUTE.splice(i,1); rtSave(); close(); if(ROUTE.length) rtOpen(); return; }
    if(a==="clear"){ ROUTE=[]; rtSave(); close(); return; }
    if(a==="opt"){ const left=ROUTE.map(id=>itemOf(id)).filter(Boolean), out=[]; let cur=state.user; while(left.length){ let bi=0; left.forEach((t,k)=>{ if(gdist(cur,t)<gdist(cur,left[bi])) bi=k; }); cur=left.splice(bi,1)[0]; out.push(cur.id); } ROUTE=out; rtSave(); toast("Joylar eng qisqa tartibda joylashtirildi"); close(); rtOpen(); return; }
    if(a==="show"){ RT_SHOW=!RT_SHOW; rtSave(); close(); if(RT_SHOW){ fitPoints([state.user,...plan.map(p=>p.t)],1.4); if(matchMedia("(max-width:860px)").matches){ try{ document.getElementById("mapwrap").scrollIntoView({behavior:"smooth",block:"start"}); }catch(_){} } } return; }
  });
  window.addEventListener("keydown",key,true); document.body.appendChild(d); d.querySelector('[data-rt="x"]').focus();
}
function rtDraw(){
  if(!RT_SHOW||!ROUTE.length||!SYS.fRoute) return;
  const pd=r=>"M"+r.pts.map(q=>Math.round(q[0])+","+Math.round(q[1])).join("L"); let path="", pins="", prev=state.user;
  ROUTE.forEach((id,i)=>{ const t=itemOf(id); if(!t) return; const L=rtLeg(prev,t), r=L.rt&&!L.rt.far?(L.rt.drive||L.rt.walk):null;
    path+=r?`<path class="route-case" d="${pd(r)}"/><path class="route-car" d="${pd(r)}"/>`:`<line class="route" x1="${prev.x}" y1="${prev.y}" x2="${t.x}" y2="${t.y}"/>`;
    pins+=`<g data-sx="${t.x}" data-sy="${t.y}" style="pointer-events:none"><circle class="rp-dot" r="13"/><text class="rp-n" y="4.500" text-anchor="middle">${i+1}</text></g>`; prev=t; });
  $("#gRoute").insertAdjacentHTML("beforeend",path); $("#gMark").insertAdjacentHTML("beforeend",pins);
}
{ const _ro=renderOverlays; renderOverlays=function(){ _ro(); rtDraw(); }; }
rtBar();
