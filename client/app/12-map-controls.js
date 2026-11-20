/* ---------- xarita bilan ishlash ---------- */
const pointers=new Map(); let down=null, dragging=false, pinch=null;
let vq=0; function applyViewSoon(){ if(vq) return; vq=requestAnimationFrame(()=>{ vq=0; applyView(); }); }
let tipQ=0,tipX=0,tipY=0;
function tipSoon(x,y){ tipX=x; tipY=y; if(tipQ) return; tipQ=requestAnimationFrame(()=>{ tipQ=0; const ll=toLatLng(...Object.values(toWorld(tipX,tipY))); const t=`${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`; const el=$("#coordtip"); if(el.textContent!==t) el.textContent=t; }); }
function zoomAtScreen(sx,sy,newW){
  const r=svg.getBoundingClientRect(), fx=(sx-r.left)/pxW, fy=(sy-r.top)/pxH;
  const wx=view.x+fx*view.w, wy=view.y+fy*view.h;
  view.w=clamp(newW,W_MIN,W_MAX); view.h=view.w*pxH/pxW; view.x=wx-fx*view.w; view.y=wy-fy*view.h;
  clampView(); applyViewSoon();
}
svg.addEventListener("pointerdown",e=>{
  if(e.button>0)return;
  cancelAnimationFrame(anim);
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===1){down={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y,target:e.target};dragging=false;}
  else if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,w:view.w};down=null;dragging=true;}
});
svg.addEventListener("pointermove",e=>{
  tipSoon(e.clientX,e.clientY);
  if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&pointers.size===2){const [a,b]=[...pointers.values()];const d=Math.hypot(a.x-b.x,a.y-b.y)||1;zoomAtScreen((a.x+b.x)/2,(a.y+b.y)/2,pinch.w*pinch.d/d);pinch={d,w:view.w};return;}
  if(down){
    const dx=e.clientX-down.x, dy=e.clientY-down.y;
    if(!dragging&&Math.hypot(dx,dy)>5){dragging=true;try{svg.setPointerCapture(e.pointerId);}catch(_){}svg.classList.add("drag");}
    if(dragging){view.x=down.vx-dx*view.w/pxW;view.y=down.vy-dy*view.h/pxH;clampView();applyViewSoon();}
  }
});
function endPointer(e){
  if(!pointers.has(e.pointerId))return;
  pointers.delete(e.pointerId);
  if(pointers.size<2)pinch=null;
  if(e.type==="pointerup"&&down&&!dragging) handleMapClick(e,down.target);
  if(pointers.size===0){down=null;dragging=false;svg.classList.remove("drag");}
}
svg.addEventListener("pointerup",endPointer);
svg.addEventListener("pointercancel",endPointer);
svg.addEventListener("wheel",e=>{e.preventDefault();cancelAnimationFrame(anim);zoomAtScreen(e.clientX,e.clientY,view.w*Math.pow(1.0018,e.deltaY*(e.deltaMode===1?33:1)));},{passive:false});

function handleMapClick(e,target){
  const p=toWorld(e.clientX,e.clientY);
  const mk=target&&target.closest?target.closest("[data-kind]"):null;
  if(mk){ const k=mk.dataset.kind; k==="service"?openService(mk.dataset.id,{fromMap:true}):k==="city"?openCity(mk.dataset.id):openPlace(mk.dataset.id,{fromMap:true}); return; }
  const z=wrap.dataset.zoom;
  if((z==="region"||z==="country")&&inUzb(p)){
    const nc=nearestCity(p); // shahardan uzoq nuqta — viloyat ro'yxati emas, shu joy haqida ma'lumot (eng yaqin shahar, xizmat...)
    if(nc.d>Math.max(nc.city.town?7000:12000,18*(view.w/pxW))){ openPoint(p); revealPanelOnPhone(); return; }
    setRegion(regionAt(p)); revealPanelOnPhone(); return; }
  openPoint(p); revealPanelOnPhone();
}

/* ---------- qatlam tugmalari ---------- */
function renderLayers(){
  $("#layers").innerHTML=`<span class="lchip lead">${ic("map")} Xaritada</span>`+Object.entries(PTYPES).map(([k,t])=>
    `<button class="lchip" data-layer="${k}" aria-pressed="${state.layers.has(k)}"><span class="sq" style="background:${t.color}">${ic(k)}</span>${t.label} <span class="n">${places.filter(p=>p.t===k&&inRegion(p)).length}</span></button>`).join("");
}

