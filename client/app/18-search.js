/* ===== Qidiruv takliflari va oxirgi qidiruvlar ===== */
const K_QS="ns_recent_q"+ACC_SUF; let RQ=LS.get(K_QS,[]);
const qBox=$("#q"), qWrap=qBox.closest(".search"), sg=document.createElement("div");
sg.className="sugg"; sg.id="sugg"; sg.setAttribute("role","listbox"); sg.setAttribute("aria-label","Qidiruv takliflari"); sg.hidden=true; qWrap.appendChild(sg);
qBox.setAttribute("role","combobox"); qBox.setAttribute("aria-expanded","false"); qBox.setAttribute("aria-controls","sugg"); qBox.setAttribute("aria-autocomplete","list");
let sgItems=[], sgIdx=-1;
function rqAdd(t){ t=String(t||"").trim(); if(t.length<2) return; RQ=[t,...RQ.filter(x=>x.toLowerCase()!==t.toLowerCase())].slice(0,6); LS.set(K_QS,RQ); }
function sgHide(){ sg.hidden=true; qBox.setAttribute("aria-expanded","false"); sgIdx=-1; qBox.removeAttribute("aria-activedescendant"); }
function sgMark(){ sg.querySelectorAll(".sg-i").forEach((el,i)=>{ const on=i===sgIdx; el.setAttribute("aria-selected",String(on)); if(on){ qBox.setAttribute("aria-activedescendant",el.id); el.scrollIntoView({block:"nearest"}); } }); if(sgIdx<0) qBox.removeAttribute("aria-activedescendant"); }
function sgShow(){
  const nq=norm(qBox.value), items=[]; let html="";
  if(!nq){
    if(!RQ.length){ sgHide(); return; }
    RQ.forEach(t=>items.push({k:"recent",t}));
    html='<div class="sg-h"><span>Oxirgi qidiruvlar</span><button type="button" data-sg-clear="1">Tozalash</button></div>';
  } else {
    CAT_KEYS.forEach(k=>{ if(norm(CATS[k].label).includes(nq)) items.push({k:"cat",cat:k,t:CATS[k].label}); });
    services.filter(s=>matches(s,nq)).map(s=>({s,d:gdist(s,state.user)})).sort((a,b)=>a.d-b.d).slice(0,6).forEach(({s,d})=>items.push({k:"svc",s,d}));
  }
  sgItems=items; sgIdx=-1;
  if(!items.length){ html+='<div class="sg-none">Hech narsa topilmadi</div>'; }
  html+=items.map((it,i)=>{
    const id='sg-'+i;
    if(it.k==="recent") return `<div class="sg-i" role="option" id="${id}" data-i="${i}"><span class="sg-ic">↺</span><span class="sg-t">${esc(it.t)}</span><button type="button" class="sg-x" data-rx="${i}" aria-label="Olib tashlash">×</button></div>`;
    if(it.k==="cat") return `<div class="sg-i" role="option" id="${id}" data-i="${i}"><span class="sg-ic" style="background:${CATS[it.cat].color}"></span><span class="sg-t">Toifa: <b>${esc(it.t)}</b></span></div>`;
    const s=it.s, c=CATS[s.cat];
    return `<div class="sg-i" role="option" id="${id}" data-i="${i}"><span class="sg-ic logo">${serviceLogo(s)}</span><span class="sg-t"><b>${esc(s.name)}</b><small>${c.label} · ${esc(s.district||"")}</small></span><span class="sg-d">${fmtKm(it.d)}</span></div>`;
  }).join("");
  sg.innerHTML=html; sg.hidden=false; qBox.setAttribute("aria-expanded","true");
}
function sgPick(i){
  const it=sgItems[i]; if(!it) return; sgHide();
  if(it.k==="recent"){ qBox.value=it.t; state.q=it.t; if(!vDetail.hidden){ vDetail.hidden=true; vList.hidden=false; state.sel=null; state.mark=null; } render(); rqAdd(it.t); return; }
  if(it.k==="cat"){ qBox.value=""; state.q=""; state.cat=it.cat; if(!vDetail.hidden) showList(); render(); return; }
  if(it.k==="svc"){ const s=it.s; rqAdd(s.name); qBox.value=""; state.q=""; if(s.region&&state.region&&state.region!==s.region){ state.region=s.region; selectRegion(regionById(s.region)); } render(); openService(s.id); qBox.blur(); }
}
qBox.addEventListener("focus",sgShow);
qBox.addEventListener("input",sgShow);
qBox.addEventListener("keydown",e=>{
  if(sg.hidden){ if(e.key==="ArrowDown"){ sgShow(); } return; }
  const n=sgItems.length;
  if(e.key==="ArrowDown"&&n){ e.preventDefault(); sgIdx=(sgIdx+1)%n; sgMark(); }
  else if(e.key==="ArrowUp"&&n){ e.preventDefault(); sgIdx=(sgIdx-1+n)%n; sgMark(); }
  else if(e.key==="Enter"){ if(sgIdx>=0){ e.preventDefault(); e.stopImmediatePropagation(); sgPick(sgIdx); } else { rqAdd(qBox.value); sgHide(); } }
  else if(e.key==="Escape"){ e.stopImmediatePropagation(); sgHide(); }
},true);
sg.addEventListener("mousedown",e=>{
  e.preventDefault();
  if(e.target.closest("[data-sg-clear]")){ RQ=[]; LS.set(K_QS,RQ); sgHide(); return; }
  const x=e.target.closest("[data-rx]"); if(x){ RQ.splice(+x.dataset.rx,1); LS.set(K_QS,RQ); sgShow(); return; }
  const it=e.target.closest(".sg-i"); if(it) sgPick(+it.dataset.i);
});
document.addEventListener("click",e=>{ if(!e.target.closest(".search")) sgHide(); });
