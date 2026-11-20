/* ===== Taqqoslash: 2-3 xizmatni yonma-yon solishtirish ===== */
const K_CMP="ns_cmp"; let CMP=LS.get(K_CMP,[]).filter(id=>byId(id)).slice(0,3);
function cmpSave(){
  LS.set(K_CMP,CMP); cmpBar();
  document.querySelectorAll('[data-act="cmp"]').forEach(b=>{ const on=CMP.includes(b.dataset.id); b.setAttribute("aria-pressed",String(on)); const t=b.querySelector(".ct"); if(t) t.textContent=on?"Taqqoslashda":"Taqqoslash"; });
}
function cmpToggle(id){
  if(CMP.includes(id)) CMP=CMP.filter(x=>x!==id);
  else { if(CMP.length>=3){ toast("Eng ko'pi bilan 3 ta xizmatni taqqoslash mumkin"); return; } CMP.push(id); }
  cmpSave();
}
function cmpBar(){
  let b=document.getElementById("cmpBar");
  if(!CMP.length||!SYS.fCompare){ if(b) b.remove(); return; }
  if(!b){ b=document.createElement("div"); b.id="cmpBar"; b.className="cmp-bar"; b.setAttribute("role","region"); b.setAttribute("aria-label","Taqqoslash"); document.body.appendChild(b);
    b.addEventListener("click",e=>{ const a=e.target.closest("[data-cb]"); if(!a) return; if(a.dataset.cb==="open") cmpOpen(); else if(a.dataset.cb==="clear"){ CMP=[]; cmpSave(); } }); }
  b.innerHTML=`<span class="cmp-n">${CMP.length}/3</span><span class="cmp-names">${CMP.map(id=>esc((byId(id)||{}).name||"")).join(" · ")}</span><button type="button" class="btn btn-primary sm" data-cb="open"${CMP.length<2?" disabled":""}>Taqqoslash</button><button type="button" class="btn sm" data-cb="clear" aria-label="Tozalash">×</button>`;
}
function cmpOpen(){
  const list=CMP.map(byId).filter(Boolean); if(list.length<2){ toast("Kamida 2 ta xizmat tanlang"); return; }
  const prev=document.activeElement, d=document.createElement("div"); d.className="pn-cf cmp-dlg"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-label","Xizmatlarni taqqoslash");
  const dist=list.map(s=>gdist(s,state.user)), bestR=Math.max(...list.map(s=>s.count?s.rating:0)), bestD=Math.min(...dist);
  const rows=[
    ["Toifa",s=>esc(CATS[s.cat].label)],
    ["Reyting",s=>s.count?`<b class="${s.rating===bestR?"cmp-best":""}">★ ${fmtR(s.rating)}</b> <small>(${s.count})</small>`:"Yangi"],
    ["Masofa",(s,i)=>`<b class="${dist[i]===bestD?"cmp-best":""}">${fmtKm(dist[i])}</b>`],
    ["Holati",s=>{ const st=status(s); return `<span class="pill ${st.open?(st.soon?"soon":"open"):"closed"}">${esc(st.text)}</span>`; }],
    ["Ish vaqti",s=>esc(hoursText(s))],
    ["Tuman",s=>esc(s.district||"-")],
    ["Telefon",s=>esc(s.phone||"-")],
    ["Narxlar",s=>s.prices&&s.prices.length?s.prices.slice(0,3).map(([n,p])=>`${esc(n)}: <b>${fmtSum(p)}</b>`).join("<br>"):"-"]
  ];
  d.innerHTML=`<div class="pn-cfbox cmp-box"><button type="button" class="sh-x" data-cm="x" aria-label="Yopish">×</button><h3>Taqqoslash</h3><div class="cmp-scroll"><table class="cmp-t"><thead><tr><th></th>${list.map(s=>`<th><span class="cmp-logo">${serviceLogo(s)}</span><b>${esc(s.name)}</b><span class="cmp-btns"><button type="button" class="btn sm btn-primary" data-cm="open" data-id="${s.id}">Ochish</button><button type="button" class="btn sm" data-cm="rm" data-id="${s.id}" aria-label="Olib tashlash">×</button></span></th>`).join("")}</tr></thead><tbody>${rows.map(([l,f])=>`<tr><th scope="row">${l}</th>${list.map((s,i)=>`<td>${f(s,i)}</td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="sh-hint">Yashil rang: eng yaxshi ko'rsatkich (yuqori reyting, eng yaqin masofa).</p></div>`;
  const key=e=>{ if(e.key==="Escape"){ e.preventDefault(); e.stopImmediatePropagation(); close(); } };
  const close=()=>{ d.remove(); window.removeEventListener("keydown",key,true); if(prev&&prev.focus){ try{ prev.focus({preventScroll:true}); }catch(e){} } };
  d.addEventListener("click",e=>{
    if(e.target===d||e.target.closest('[data-cm="x"]')){ close(); return; }
    const b=e.target.closest("[data-cm]"); if(!b) return; const id=b.dataset.id;
    if(b.dataset.cm==="open"){ close(); const s=byId(id); if(s&&s.region&&state.region&&state.region!==s.region){ state.region=s.region; selectRegion(regionById(s.region)); render(); } openService(id); }
    else if(b.dataset.cm==="rm"){ CMP=CMP.filter(x=>x!==id); cmpSave(); close(); if(CMP.length>=2) cmpOpen(); }
  });
  window.addEventListener("keydown",key,true); document.body.appendChild(d); d.querySelector('[data-cm="x"]').focus();
}
cmpBar();
