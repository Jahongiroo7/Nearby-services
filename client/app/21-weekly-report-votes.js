/* ===== Haftalik jadval, xato haqida xabar, sharhlarga "Foydali" ===== */
function weekHtml(s){
  const today=(new Date().getDay()+6)%7;
  const rows=DAYS_FULL.map((n,i)=>{ const on=s.h24||(s.days||[]).includes(i), t=s.h24?"24 soat":on?`${s.open}–${s.close}`:"Yopiq"; return `<tr${i===today?' class="wk-today"':""}><th>${n[0].toUpperCase()+n.slice(1)}${i===today?" (bugun)":""}</th><td${on?"":' class="wk-off"'}>${t}</td></tr>`; }).join("");
  return `<details class="wk"><summary>Haftalik jadval</summary><table class="wk-t"><tbody>${rows}</tbody></table></details>`;
}
const K_VOTES="ns_votes", K_MYV="ns_myvotes"+ACC_SUF; let VOTES=LS.get(K_VOTES,{}), MYV=new Set(LS.get(K_MYV,[]));
const vcount=sig=>VOTES[sig]||0;
function voteBtn(sid,r){ const sig=revSig(sid,r), n=vcount(sig), on=MYV.has(sig); return `<button type="button" class="btn sm vote" data-act="vote" data-sig="${esc(sig)}" aria-pressed="${on}">👍 Foydali${n?` <span>${n}</span>`:""}</button>`; }
function sortRevs(s){ const arr=s.reviews.slice(); if(arr.some(r=>vcount(revSig(s.id,r))>0)) arr.sort((a,b)=>vcount(revSig(s.id,b))-vcount(revSig(s.id,a))); return arr; }
function toggleVote(btn){
  const sig=btn.dataset.sig;
  if(MYV.has(sig)){ MYV.delete(sig); VOTES[sig]=Math.max(0,(VOTES[sig]||1)-1); } else { MYV.add(sig); VOTES[sig]=(VOTES[sig]||0)+1; }
  LS.set(K_VOTES,VOTES); LS.set(K_MYV,[...MYV]);
  const n=vcount(sig); btn.setAttribute("aria-pressed",String(MYV.has(sig))); btn.innerHTML="👍 Foydali"+(n?` <span>${n}</span>`:"");
}
const K_REP="ns_reports"; let REPORTS=LS.get(K_REP,[]);
const REP_WHY=["Telefon raqami noto'g'ri","Manzil yoki joylashuv noto'g'ri","Ish vaqti noto'g'ri","Xizmat yopilgan yoki mavjud emas","Boshqa muammo"];
const repNew=()=>REPORTS.filter(x=>x.status==="new").length;
function reportOpen(id){
  const o=itemOf(id); if(!o) return;
  const prev=document.activeElement, d=document.createElement("div"); d.className="pn-cf rep-dlg"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-label","Xato haqida xabar");
  d.innerHTML=`<div class="pn-cfbox sh-box"><button type="button" class="sh-x" data-rp="x" aria-label="Yopish">×</button><h3>Xato haqida xabar</h3><p class="sh-name"></p>
    <label class="rp-l">Muammo turi<select class="input" id="rp-why">${REP_WHY.map(w=>`<option>${esc(w)}</option>`).join("")}</select></label>
    <label class="rp-l">Izoh (ixtiyoriy)<textarea class="input" id="rp-text" rows="3" maxlength="300" placeholder="To'g'ri ma'lumotni yozing"></textarea></label>
    <div class="pn-cfa"><button type="button" class="btn" data-rp="x">Bekor qilish</button><button type="button" class="btn btn-primary" data-rp="send">Yuborish</button></div><p class="sh-hint">Xabar admin paneliga tushadi.</p></div>`;
  d.querySelector(".sh-name").textContent=o.name;
  const key=e=>{ if(e.key==="Escape"){ e.preventDefault(); e.stopImmediatePropagation(); close(); } };
  const close=()=>{ d.remove(); window.removeEventListener("keydown",key,true); if(prev&&prev.focus){ try{ prev.focus({preventScroll:true}); }catch(e){} } };
  d.addEventListener("click",e=>{
    if(e.target===d||e.target.closest('[data-rp="x"]')){ close(); return; }
    if(e.target.closest('[data-rp="send"]')){ const rep={id:"r"+Date.now(),item:id,why:d.querySelector("#rp-why").value,text:d.querySelector("#rp-text").value.trim().slice(0,300),from:ACC_ID,ts:Date.now(),status:"new"}; REPORTS.unshift(rep); api.post("/reports",rep); REPORTS=REPORTS.slice(0,200); LS.set(K_REP,REPORTS); toast("Xabar yuborildi. Rahmat!"); close(); }
  });
  window.addEventListener("keydown",key,true); document.body.appendChild(d); d.querySelector("#rp-why").focus();
}
function pRepList(){
  if(!REPORTS.length) return `<p class="muted">Hali xabar yo'q. Foydalanuvchilar xizmatdagi xatolar haqida shu yerga yozadi (xizmat tafsilotida <b>Xato haqida</b> tugmasi).</p>`;
  return `<div class="pn-bar"><span class="muted">${REPORTS.length} ta xabar · ${repNew()} tasi yangi</span>${pBtn("rep-clear","Hal qilinganlarni tozalash")}</div><ul class="pn-list">${REPORTS.map(x=>{ const it=itemOf(x.item); return `<li class="pn-row${x.status==="new"?" pn-unread":""}"><div class="pn-rm"><b>${it?esc(it.name):"(o'chirilgan)"}</b><small>${esc(x.why)}${x.text?": «"+esc(x.text)+"»":""} · ${esc(accName(x.from))} · ${timeAgo(x.ts)}</small></div><div class="pn-ra">${it?pBtn("rep-open","Saytda ko'rish",`data-id="${esc(x.item)}"`):""}${x.status==="new"?pBtn("rep-ok","Hal qilindi",`data-id="${x.id}"`,"btn-primary"):'<span class="pill open">hal qilindi</span>'}${pBtn("rep-del","O'chirish",`data-id="${x.id}"`,"danger")}</div></li>`; }).join("")}</ul>`;
}
applyTheme();
drawBase(); drawCountry(); renderLayers(); renderOrigin();
const r0=svg.getBoundingClientRect(); pxW=Math.max(1,r0.width); pxH=Math.max(1,r0.height); sizeReal(); readColors();
// boshlang'ich ko'rinish: Toshkent markazi, binolar ko'rinadigan masshtabda
initPending=r0.width<50;
setCenter(state.user.x,state.user.y,clamp(pxW*5.5,3200,6500));
{ const r0=userRegion(); state.region=r0.id; selectRegion(r0); }   // boshlanishda faqat foydalanuvchi turgan hudud
render();
if("ResizeObserver" in window) new ResizeObserver(measure).observe(svg); else addEventListener("resize",measure);
initI18n();
routeFromHash();
pRoute();
setTimeout(()=>idle(()=>{ try{
  startHw();   // shaharlararo yo'l grafi
  // foydalanuvchi turgan hududning ko'cha grafi (birinchi marshrut qotmasin)
  let area=null; for(const z of REAL_AREAS){ const bb=z.bbox; if(state.user.x>=bb[0]&&state.user.x<=bb[2]&&state.user.y>=bb[1]&&state.user.y<=bb[3]&&z.r.length&&(!area||(bb[2]-bb[0])*(bb[3]-bb[1])<(area.bbox[2]-area.bbox[0])*(area.bbox[3]-area.bbox[1]))) area=z; }
  if(area&&!area._g) stepGen(graphGen(area));
}catch(e){} }),2500);
