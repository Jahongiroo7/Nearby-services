/* ===== Saralanganlar, ulashish, havola orqali ochish va "orqaga" tugmasi ===== */
const FAV_KEY="ns_fav"+ACC_SUF; let FAV=new Set(); try{ FAV=new Set(JSON.parse(localStorage.getItem(FAV_KEY)||"[]")); }catch(e){}
function toggleFav(id){
  if(FAV.has(id)){ FAV.delete(id); toast("Saralanganlardan olib tashlandi"); } else { FAV.add(id); toast("Saralanganlarga qo'shildi"); }
  try{ localStorage.setItem(FAV_KEY,JSON.stringify([...FAV])); }catch(e){}
  document.querySelectorAll('[data-act="fav"]').forEach(b=>{ const on=FAV.has(b.dataset.id); b.setAttribute("aria-pressed",String(on)); const t=b.querySelector(".ft"), h=b.querySelector(".fh"); if(t) t.textContent=on?"Saralangan":"Saralash"; if(h) h.textContent=on?"\u2665":"\u2661"; });
  if(state.fav&&vDetail.hidden) render(); else renderCats();
}
function hashNow(){ const s=state.sel; if(s&&(s.kind==="service"||s.kind==="place")&&s.id&&!vDetail.hidden) return "#s-"+s.id; if(state.region&&state.region!==userRegion().id) return "#r-"+state.region; return ""; }
let navPushed=false;
function syncHash(){
  try{
    const h=hashNow(), cur=location.hash||""; if(cur===h) return;
    const url=location.pathname+location.search+h;
    if(h.startsWith("#s-")&&!cur.startsWith("#s-")){ history.pushState(null,"",url); navPushed=true; } else history.replaceState(null,"",url);
  }catch(e){}
}
function shareThis(){
  const s=state.sel, o=s?(byId(s.id)||places.find(p=>p.id===s.id)):null, name=o?o.name:"Nearby Services";
  const url=location.href.split("#")[0]+hashNow(), text=name+" — Nearby Services", eu=encodeURIComponent(url), et=encodeURIComponent(text);
  const apps=[["Telegram","#229ED9","T","https://t.me/share/url?url="+eu+"&text="+et],["WhatsApp","#25D366","W","https://wa.me/?text="+encodeURIComponent(text+" "+url)],["Facebook","#1877F2","f","https://www.facebook.com/sharer/sharer.php?u="+eu],["X","#111827","X","https://twitter.com/intent/tweet?url="+eu+"&text="+et],["Email","#6b7280","@","mailto:?subject="+et+"&body="+encodeURIComponent(text+"\n"+url)],["SMS","#16a34a","S","sms:?body="+encodeURIComponent(text+" "+url)]];
  const prev=document.activeElement, d=document.createElement("div"); d.className="pn-cf sh-dlg"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-label","Ulashish");
  d.innerHTML='<div class="pn-cfbox sh-box"><button type="button" class="sh-x" data-sh="x" aria-label="Yopish">×</button><h3>Ulashish</h3><p class="sh-name"></p>'+shAccHtml()+'<div class="sh-apps">'+apps.map(([n,c,l,h])=>`<a class="sh-app" href="${esc(h)}" target="_blank" rel="noopener noreferrer"><i style="background:${c}">${l}</i><span>${n}</span></a>`).join("")+'</div><div class="sh-link"><input class="input" readonly aria-label="Havola"><button type="button" class="btn btn-primary" data-sh="copy">Nusxa olish</button></div>'+(navigator.share?'<button type="button" class="btn sh-more" data-sh="native">Boshqa ilovalar orqali yuborish…</button>':"")+'<p class="sh-hint">Havolani olgan odam xizmatni to\'g\'ridan-to\'g\'ri ochadi. Demo akkauntlarga yuborish shu brauzerda ishlaydi. Boshqa odamga Telegram, WhatsApp kabi ilovalar orqali yuboring.</p></div>';
  d.querySelector(".sh-name").textContent=name; d.querySelector(".sh-link input").value=url;
  const key=e=>{ if(e.key==="Escape"){ e.preventDefault(); e.stopImmediatePropagation(); close(); } };
  const close=()=>{ d.remove(); window.removeEventListener("keydown",key,true); if(prev&&prev.focus){ try{ prev.focus({preventScroll:true}); }catch(e){} } };
  d.addEventListener("click",e=>{
    if(e.target===d||e.target.closest('[data-sh="x"]')){ close(); return; }
    const b=e.target.closest("[data-sh]"); if(!b) return;
    if(b.dataset.sh==="send"){ const ids=[...d.querySelectorAll(".sh-ac input:checked")].map(i=>i.value); if(!ids.length){ toast("Avval akkauntni tanlang"); return; } sendShares(ids,s&&s.id,d.querySelector("#sh-msg").value); toast("Yuborildi: "+ids.map(accName).join(", ")); close(); return; }
    if(b.dataset.sh==="copy") copyText(url);
    else if(b.dataset.sh==="native"){ navigator.share({title:name,text,url}).then(close).catch(()=>{}); }
  });
  d.querySelector(".sh-link input").addEventListener("focus",e=>e.target.select());
  window.addEventListener("keydown",key,true); document.body.appendChild(d); d.querySelector(".sh-app").focus();
}
function routeFromHash(){
  const h=location.hash||""; let m;
  if((m=h.match(/^#s-([A-Za-z0-9_]+)$/))){
    const id=m[1]; if(state.sel&&state.sel.id===id&&!vDetail.hidden) return;
    const s=byId(id), p=s?null:places.find(x=>x.id===id);
    const o=s||p; if(!o) return;
    if(o.region&&state.region&&state.region!==o.region){ state.region=o.region; selectRegion(regionById(o.region)); render(); }
    if(s) openService(id); else openPlace(id);
  } else if((m=h.match(/^#r-([a-z]+)$/))){
    const r=regionById(m[1]); if(r&&state.region!==r.id) setRegion(r); else if(!vDetail.hidden) showList();
  } else if(!vDetail.hidden) showList();
}
{ const _os=openService, _op=openPlace, _sl=showList, _sr=setRegion;
  openService=function(id,o){ _os(id,o); syncHash(); };
  openPlace=function(id,o){ _op(id,o); syncHash(); };
  showList=function(){ _sl(); if(navPushed&&(location.hash||"").startsWith("#s-")){ navPushed=false; try{ history.back(); }catch(e){} } else syncHash(); };
  setRegion=function(r){ _sr(r); syncHash(); };
}
addEventListener("popstate",routeFromHash); addEventListener("hashchange",routeFromHash);
addEventListener("ns-photos",()=>{ PHOTOS=null; if(state.sel&&!vDetail.hidden){ const sc=panel.scrollTop; if(state.sel.kind==="service") openService(state.sel.id); else if(state.sel.kind==="place") openPlace(state.sel.id); panel.scrollTop=sc; } });
