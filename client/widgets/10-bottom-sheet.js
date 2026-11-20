(function(){
  const mq=matchMedia("(max-width:860px)"), app=document.querySelector(".app"), panel=document.getElementById("panel");
  if(!app||!panel) return;
  const hd=document.createElement("div"); hd.className="sheet-h"; hd.setAttribute("role","button"); hd.setAttribute("aria-label","Panelni ochish yoki yopish"); hd.innerHTML="<i></i>"; panel.prepend(hd);
  let idx=1, cur=0;
  const pts=()=>{ const H=app.clientHeight; return [Math.min(250,H*.36),H*.52,H-6]; };
  function set(px,anim){ cur=px; const H=app.clientHeight; app.style.setProperty("--sh",Math.round(px)+"px"); panel.style.transition=anim?"height .28s cubic-bezier(.2,.8,.2,1)":"none"; app.dataset.snap=px>H-40?"full":px>H*.4?"half":"peek"; }
  function go(i){ idx=i; set(pts()[i],true); }
  function apply(){ if(mq.matches) go(idx); else { app.style.removeProperty("--sh"); delete app.dataset.snap; panel.style.transition=""; } }
  let sy=0,sh=0,drag=false,moved=false;
  hd.addEventListener("pointerdown",e=>{ drag=true; moved=false; sy=e.clientY; sh=cur; try{hd.setPointerCapture(e.pointerId);}catch(_){} });
  hd.addEventListener("pointermove",e=>{ if(!drag) return; const dy=sy-e.clientY; if(Math.abs(dy)>4) moved=true; const H=app.clientHeight; set(Math.max(110,Math.min(H-6,sh+dy)),false); });
  const end=e=>{ if(!drag) return; drag=false; if(!moved){ go((idx+1)%3); return; } const p=pts(); let b=0; p.forEach((v,i)=>{ if(Math.abs(v-cur)<Math.abs(p[b]-cur)) b=i; }); go(b); };
  hd.addEventListener("pointerup",end); hd.addEventListener("pointercancel",end);
  mq.addEventListener("change",apply); addEventListener("resize",()=>{ if(mq.matches) set(pts()[idx],false); });
  const vd=document.getElementById("viewDetail");
  if(vd) new MutationObserver(()=>{ if(mq.matches&&!vd.hidden&&idx===0) go(1); }).observe(vd,{attributes:true,attributeFilter:["hidden"]});
  const q=document.getElementById("q"); if(q) q.addEventListener("focus",()=>{ if(mq.matches&&idx===0) go(1); });
  apply();
})();
