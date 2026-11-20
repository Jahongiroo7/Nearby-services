/* ---------- filtrlash va ro'yxat ---------- */
const norm = s => String(s).toLowerCase().replace(/[‘’ʻʼ`´]/g,"'").trim();
function matches(s,q){ return norm(`${s.name} ${CATS[s.cat].label} ${s.district} ${regionById(s.region||"ts").name} ${s.address} ${s.desc||""} ${lang!=="uz"?trText(CATS[s.cat].label)+" "+trText(s.desc||"")+" "+trText(s.district)+" "+trText(regionById(s.region||"ts").name):""}`).includes(q); }
function filtered(ignoreCat){
  const q=norm(state.q);
  let arr=services.map(s=>({s,d:gdist(s,state.user)})).filter(({s,d})=>
    (ignoreCat||state.cat==="all"||s.cat===state.cat) &&
    (!state.radius||d<=state.radius*1000) &&
    (!state.minRating||(s.count>0&&s.rating>=state.minRating)) &&
    (!state.openNow||status(s).open) &&
    (!q||matches(s,q)) &&
    (!state.fav||FAV.has(s.id)) &&
    (!state.region||(s.region||"ts")===state.region));
  if(!ignoreCat){
    const by={dist:(a,b)=>a.d-b.d,rating:(a,b)=>(b.s.rating-a.s.rating)||(b.s.count-a.s.count),reviews:(a,b)=>b.s.count-a.s.count}[state.sort];
    arr.sort(by);
  }
  return arr;
}
/* Har bir xizmatning o'z logotipi: s.logo (rasm manzili yoki data:) bo'lsa o'sha, bo'lmasa nomidan noyob belgi yaratiladi
   (bosh harflar, rang, shakl va bezak nomdan olingan hash'ga bog'liq; turi - burchakdagi kichik belgi) */
const LOGO_PAL=[["#1951fc","#6db4ff"],["#7c3aed","#c4a7ff"],["#0d9488","#5eead4"],["#ea580c","#fdba74"],["#db2777","#f9a8d4"],["#16a34a","#86efac"],["#0b2cb1","#3781fc"],["#be123c","#fda4af"],["#0369a1","#7dd3fc"],["#a16207","#fde047"]];
const logoCache=new Map();
let LOGO_N=0;
/* Umumiy rang juftliklari: [och, to'q] */
const LOGO_COL=[["#93c5fd","#1d4ed8"],["#a5b4fc","#3730a3"],["#c4b5fd","#6d28d9"],["#f0abfc","#a21caf"],["#f9a8d4","#be185d"],["#fda4af","#be123c"],["#fca5a5","#b91c1c"],["#fdba74","#c2410c"],["#fcd34d","#a16207"],["#bef264","#4d7c0f"],["#86efac","#15803d"],["#5eead4","#0f766e"],["#67e8f9","#0e7490"],["#7dd3fc","#0369a1"],["#cbd5e1","#334155"],["#a8a29e","#292524"]];
const LOGO_SHAPES=[
  'M15 0h18a15 15 0 0 1 15 15v18a15 15 0 0 1-15 15H15A15 15 0 0 1 0 33V15A15 15 0 0 1 15 0z',
  'M24 0A24 24 0 1 1 24 48 24 24 0 0 1 24 0z',
  'M20 0h8c14 0 20 6 20 20v8c0 14-6 20-20 20h-8C6 48 0 42 0 28v-8C0 6 6 0 20 0z',
  'M10 0h28a10 10 0 0 1 10 10v28a10 10 0 0 1-10 10H10A10 10 0 0 1 0 38V10A10 10 0 0 1 10 0z'
];
const LOGO_ART={
  barber:[
    (A,u)=>`<defs><clipPath id="p${u}"><rect x="8" y="5.200" width="8" height="13.600" rx="1"/></clipPath></defs><rect x="7.500" y="2.600" width="9" height="3" rx="1.500" fill="#fff"/><rect x="7.500" y="18.400" width="9" height="3" rx="1.500" fill="#fff"/><rect x="8" y="5.200" width="8" height="13.600" fill="#fff"/><g clip-path="url(#p${u})"><path d="M7 5l10-3.500v4L7 9.500z" fill="#ef4444"/><path d="M7 11.500l10-3.500v4L7 15.500z" fill="#ef4444"/><path d="M7 8.200l10-3.500v3.800L7 12z" fill="#2563eb"/><path d="M7 14.700l10-3.500V15L7 18.700z" fill="#2563eb"/><path d="M7 20l10-3.500V20z" fill="#ef4444"/></g>`,
    (A)=>`<circle cx="7" cy="18" r="3" fill="none" stroke="#fff" stroke-width="1.900"/><circle cx="17" cy="18" r="3" fill="none" stroke="#fff" stroke-width="1.900"/><path d="M8.800 15.400L17.500 2.500M15.200 15.400L6.500 2.500" stroke="#fff" stroke-width="2.200" stroke-linecap="round"/><circle cx="12" cy="10.500" r="1.100" fill="${A}"/>`,
    (A)=>`<rect x="2.500" y="4" width="19" height="6" rx="2" fill="#fff"/><path d="M5 11v8M8 11v8M11 11v8M14 11v8M17 11v8M20 11v6" stroke="#fff" stroke-width="1.700" stroke-linecap="round"/><rect x="5" y="6" width="14" height="2" rx="1" fill="${A}" opacity=".55"/>`,
    (A)=>`<path d="M12 12.500c-1.600-3-4.300-3.800-7-2.400C3 11.200 2.200 13.500 2.800 16c1.700-1.300 3.800-1.500 5.400-.6 1.600.9 2.600 1.500 3.800 3.600 1.200-2.100 2.200-2.700 3.800-3.600 1.600-.9 3.700-.7 5.400.6.600-2.500-.2-4.800-2.200-5.900-2.700-1.400-5.400-.6-7 2.400z" fill="#fff"/><circle cx="12" cy="7" r="2.600" fill="none" stroke="#fff" stroke-width="1.700"/>`
  ],
  shop:[
    (A)=>`<path d="M4.500 8.500h15l-1.200 12.300a1 1 0 0 1-1 .9H6.700a1 1 0 0 1-1-.9z" fill="#fff"/><path d="M8.600 8.500V7a3.400 3.400 0 0 1 6.800 0v1.500" fill="none" stroke="#fff" stroke-width="1.900" stroke-linecap="round"/><path d="M12 18.600l-2.900-2.700a1.800 1.800 0 0 1 2.900-2.100 1.800 1.800 0 0 1 2.900 2.100z" fill="${A}"/>`,
    (A)=>`<path d="M2 4h3.200l2.300 10.800h10.600l2.100-7.800H6.200" fill="none" stroke="#fff" stroke-width="2.100" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="19" r="1.900" fill="#fff"/><circle cx="17" cy="19" r="1.900" fill="#fff"/><path d="M7 9.500h12.500l-1.300 4.300H8.100z" fill="#fff" opacity=".35"/>`,
    (A)=>`<path d="M3 12.200V4.800A1.800 1.800 0 0 1 4.800 3h7.400L21 11.800l-8.200 8.200z" fill="#fff"/><circle cx="7.600" cy="7.600" r="1.800" fill="${A}"/><path d="M11 12.500l3.500 3.500" stroke="${A}" stroke-width="1.500" stroke-linecap="round"/>`,
    (A)=>`<rect x="3.500" y="10" width="17" height="11" rx="1.600" fill="#fff"/><rect x="2.500" y="6.500" width="19" height="4.200" rx="1.200" fill="#fff"/><path d="M12 6.500V21" stroke="${A}" stroke-width="2.200"/><path d="M12 6.500c-1-3.500-5-4-5-1.500s3.500 2 5 1.500zM12 6.500c1-3.500 5-4 5-1.500s-3.500 2-5 1.500z" fill="none" stroke="#fff" stroke-width="1.700" stroke-linejoin="round"/>`
  ],
  food:[
    (A)=>`<circle cx="12" cy="5.600" r="1.600" fill="#fff"/><path d="M3.600 16.600a8.400 8.400 0 0 1 16.800 0z" fill="#fff"/><rect x="2" y="17.500" width="20" height="2.300" rx="1.150" fill="#fff"/><path d="M7.200 14.600a5 5 0 0 1 3.300-3.300" fill="none" stroke="${A}" stroke-width="1.500" stroke-linecap="round"/>`,
    (A)=>`<path d="M3.800 11a8.200 6.600 0 0 1 16.400 0z" fill="#fff"/><circle cx="8.500" cy="8" r=".8" fill="${A}"/><circle cx="12" cy="6.600" r=".8" fill="${A}"/><circle cx="15.500" cy="8" r=".8" fill="${A}"/><rect x="3" y="12.300" width="18" height="3" rx="1.500" fill="${A}" stroke="#fff" stroke-width="1"/><path d="M3.800 16.800h16.400a2.200 2.200 0 0 1-2.200 3.400H6a2.200 2.200 0 0 1-2.200-3.400z" fill="#fff"/>`,
    (A)=>`<path d="M6 2.500v6a2.200 2.200 0 0 0 2.200 2.200V21.500h1.600V10.700A2.200 2.200 0 0 0 12 8.500v-6h-1.400v4.600h-.9V2.500H8.300v4.600h-.9V2.500z" fill="#fff"/><path d="M17.500 2.500c-2.300 1.600-3.500 4.300-3.500 7.700h3v11.300h1.800V2.500z" fill="#fff"/>`,
    (A)=>`<path d="M4.500 9h11.500v6.200a5.300 5.300 0 0 1-5.300 5.300H9.800a5.300 5.300 0 0 1-5.300-5.300z" fill="#fff"/><path d="M16 10.500h1.600a2.800 2.800 0 0 1 0 5.600H16" fill="none" stroke="#fff" stroke-width="1.800"/><path d="M8 3.500c-.9 1.100.9 1.800 0 3M11.800 3.500c-.9 1.100.9 1.800 0 3" fill="none" stroke="#fff" stroke-width="1.400" stroke-linecap="round"/><path d="M6.800 12.500h6.600" stroke="${A}" stroke-width="1.500" stroke-linecap="round"/>`
  ],
  pharm:[
    (A)=>`<path d="M3.500 12.500h17a8.500 8.500 0 0 1-17 0z" fill="#fff"/><rect x="2.500" y="11.300" width="19" height="2" rx="1" fill="#fff"/><path d="M15.600 2.700l2.900 2.900-6 6.500-2.900-2.900z" fill="#fff"/><path d="M10.900 14.100h2.200v1.900h1.900v2.200h-1.900v1.900h-2.200v-1.900H9v-2.200h1.900z" fill="${A}"/>`,
    (A)=>`<g transform="rotate(-45 12 12)"><rect x="2.500" y="7.500" width="19" height="9" rx="4.500" fill="#fff"/><path d="M12 7.500h5a4.500 4.500 0 0 1 0 9h-5z" fill="${A}" stroke="#fff" stroke-width="1"/></g>`,
    (A)=>`<rect x="3" y="3" width="18" height="18" rx="4.500" fill="#fff"/><path d="M10.200 6.500h3.600v3.700h3.700v3.600h-3.700v3.700h-3.600v-3.700H6.500v-3.600h3.700z" fill="${A}"/>`,
    (A)=>`<rect x="8.500" y="2.500" width="7" height="3.200" rx="1" fill="#fff"/><path d="M7.500 6.800h9V19a2.200 2.200 0 0 1-2.200 2.200H9.700A2.200 2.200 0 0 1 7.500 19z" fill="#fff"/><path d="M11 10.500h2v2h2v2h-2v2h-2v-2H9v-2h2z" fill="${A}"/>`
  ],
  auto:[
    (A)=>`<path d="M2.600 15.600v-3.400l2.100-4.700a2.200 2.200 0 0 1 2-1.300h10.600a2.200 2.200 0 0 1 2 1.300l2.100 4.700v3.400a1.100 1.100 0 0 1-1.100 1.100H3.700a1.100 1.100 0 0 1-1.100-1.100z" fill="#fff"/><path d="M6 8.200h12l1.300 3.200H4.700z" fill="${A}"/><circle cx="7.200" cy="17" r="2.500" fill="#fff" stroke="${A}" stroke-width="1.300"/><circle cx="16.800" cy="17" r="2.500" fill="#fff" stroke="${A}" stroke-width="1.300"/>`,
    (A)=>`<circle cx="12" cy="12" r="9.500" fill="#fff"/><circle cx="12" cy="12" r="6" fill="${A}"/><circle cx="12" cy="12" r="1.900" fill="#fff"/><path d="M12 6v4.100M12 13.900V18M6 12h4.100M13.900 12H18M7.800 7.800l2.900 2.900M13.300 13.300l2.900 2.900M16.200 7.800l-2.900 2.900M10.700 13.300l-2.900 2.900" stroke="#fff" stroke-width="1.200"/>`,
    (A)=>`<path d="M12 2.500c4.200 5.100 6.500 8.400 6.500 11.600a6.500 6.500 0 0 1-13 0C5.500 10.900 7.800 7.600 12 2.500z" fill="#fff"/><path d="M8.800 14.600a3.300 3.300 0 0 0 3 3.300" fill="none" stroke="${A}" stroke-width="1.800" stroke-linecap="round"/>`,
    (A)=>`<g fill="#fff"><rect x="10.200" y="1.800" width="3.600" height="20.400" rx="1"/><rect x="10.200" y="1.800" width="3.600" height="20.400" rx="1" transform="rotate(60 12 12)"/><rect x="10.200" y="1.800" width="3.600" height="20.400" rx="1" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="7"/></g><circle cx="12" cy="12" r="3.300" fill="${A}"/>`
  ],
  repair:[
    (A)=>`<g transform="rotate(45 12 12)"><rect x="10.800" y="9" width="2.400" height="12.500" rx="1.200" fill="#fff"/><path d="M8.400 2.500h2.300v3.600h2.600V2.500h2.300v5.200a3.600 3.600 0 0 1-7.200 0z" fill="#fff"/></g><g transform="rotate(-45 12 12)"><rect x="11.100" y="2.500" width="1.800" height="10" rx=".6" fill="#fff"/><rect x="9.800" y="11.500" width="4.400" height="9.500" rx="2" fill="${A}" stroke="#fff" stroke-width="1"/></g>`,
    (A)=>`<g transform="rotate(45 12 12)"><rect x="10.800" y="8" width="2.400" height="14" rx="1.200" fill="#fff"/><rect x="5.500" y="2.500" width="13" height="6" rx="1.600" fill="${A}" stroke="#fff" stroke-width="1.100"/></g>`,
    (A)=>`<path d="M2.500 12.200L12 3.800l9.500 8.400h-2.700V20H5.200v-7.800z" fill="#fff"/><rect x="10" y="13.500" width="4" height="6.500" rx="1" fill="${A}"/><path d="M9.500 9.500h5" stroke="${A}" stroke-width="1.500" stroke-linecap="round"/>`,
    (A)=>`<path d="M13.600 1.800L5.500 13.200h5.300l-1.300 9 9.200-12.500h-5.600z" fill="#fff"/><path d="M10.600 15.500l3-4.200" stroke="${A}" stroke-width="1.300" stroke-linecap="round"/>`
  ]
};
function serviceLogo(s){
  if(s.logo) return `<img class="logoimg" src="${esc(s.logo)}" alt="${esc(s.name)}" loading="lazy" decoding="async">`;
  const cat=CATS[s.cat]?s.cat:"barber";
  const words=String(s.name||"?").replace(/['’ʻ`]/g,"").split(/[\s\-–]+/).filter(Boolean);
  let brand=(words[0]||"?"); if(brand.length<3&&words[1]) brand+=" "+words[1]; brand=brand.toUpperCase(); if(brand.length>9) brand=brand.slice(0,8)+".";
  let h=2166136261; for(const ch of String(s.name)+"|"+s.id){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); h^=h>>>13; } h>>>=0;
  const pal=LOGO_COL[h%LOGO_COL.length], arts=LOGO_ART[cat], art=arts[(h>>>8)%arts.length];
  const mode=(h>>>11)%4, deco=(h>>>14)%3, uid=h+"_"+(++LOGO_N), gid="g"+uid, cid="c"+uid;
  /* rejimlar: 0 - rangli gradient + oq belgi; 1 - och fon + to'q belgi; 2 - qorong'i fon + yorqin belgi; 3 - tekis to'q rang + oq belgi */
  const bgStops=[[pal[0],pal[1]],["#ffffff",pal[0]],["#111827",pal[1]],[pal[1],pal[1]]][mode];
  const main=["#fff",pal[1],pal[0],"#fff"][mode], acc=[pal[1],pal[0],"#111827",pal[0]][mode], tcol=mode===1?pal[1]:"#fff", dcol=mode===1?pal[1]:"#fff";
  const decoSvg=deco===0?"":deco===1?`<circle cx="42" cy="6" r="22" fill="${dcol}" opacity=".10"/>`:`<path d="M-4 52L52 -4" stroke="${dcol}" stroke-opacity=".12" stroke-width="10"/>`;
  const glyph=art(acc,uid).replace(/#fff/g,main);
  /* yozuv doira ichiga to'liq sig'adi: shrift uzunlikka qarab kichrayadi, uzun nomlar kengligi bilan cheklanadi */
  const L=brand.length, fs=L<=4?7.200:L===5?6.600:L===6?6.100:L===7?5.500:4.900, tl=L>=8?27.500:0;
  return `<svg viewBox="0 0 48 48" role="img" aria-label="${esc(s.name)}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bgStops[0]}"/><stop offset="1" stop-color="${bgStops[1]}"/></linearGradient><clipPath id="${cid}"><circle cx="24" cy="24" r="24"/></clipPath></defs>
    <circle cx="24" cy="24" r="24" fill="url(#${gid})"/><g clip-path="url(#${cid})">${decoSvg}</g><circle cx="24" cy="24" r="22.300" fill="none" stroke="${dcol}" stroke-opacity="${mode===1?".22":".28"}" stroke-width=".9"/>
    <svg x="12" y="5.500" width="24" height="24" viewBox="0 0 24 24">${glyph}</svg>
    <text x="24" y="38.600" text-anchor="middle" font-family="Manrope,Inter,system-ui,sans-serif" font-size="${fs}" font-weight="800" fill="${tcol}" letter-spacing=".5"${tl?` textLength="${tl}" lengthAdjust="spacingAndGlyphs"`:""}>${esc(brand)}</text></svg>`;
}
function cardHtml(s,d){
  const c=CATS[s.cat],st=status(s);
  return `<li><button class="card" data-open="${s.id}"><span class="cicon logo">${serviceLogo(s)}</span>
    <span class="cbody"><span class="cname">${esc(s.name)}</span><span class="cmeta">${c.label} · ${esc(s.district)}</span>
    <span class="cline">${ratingHtml(s)}<span class="pill ${st.open?(st.soon?"soon":"open"):"closed"}">${st.text}</span></span></span>
    <span class="dist">${fmtKm(d)}</span></button></li>`;
}
function placeCardHtml(p,d){
  const t=PTYPES[p.t];
  return `<li><button class="card" data-open="${p.id}"><span class="cicon sq" style="background:${t.color}">${ic(p.t)}</span>
    <span class="cbody"><span class="cname">${esc(p.name)}</span><span class="cmeta">${t.one} · ${esc(p.district)}</span></span>
    <span class="dist">${fmtKm(d)}</span></button></li>`;
}
function renderCats(){
  const base=filtered(true), cnt={all:base.length};
  CAT_KEYS.forEach(k=>cnt[k]=base.filter(r=>r.s.cat===k).length);
  $("#cats").innerHTML=[["all","Barchasi",null],...CAT_KEYS.map(k=>[k,CATS[k].label,CATS[k].color])].map(([k,l,c])=>
    `<button class="chip" data-cat="${k}" aria-pressed="${state.cat===k}">${c?`<span class="dot" style="background:${c}"></span>`:""}${l} <span class="n">${cnt[k]}</span></button>`).join("")+
    `<button class="chip" data-fav="1" aria-pressed="${!!state.fav}"><span class="dot"></span>\u2665 Saralanganlar <span class="n">${base.filter(r=>FAV.has(r.s.id)).length}</span></button>`;
}
function userRegion(){ return regionAt(state.user); }
function syncScope(){
  const ur=userRegion(), pos=state.region?0:1;
  for(const sw of document.querySelectorAll(".sw")){
    sw.dataset.pos=pos;
    const bs=sw.querySelectorAll("button"); bs[0].setAttribute("aria-pressed",String(pos===0)); bs[1].setAttribute("aria-pressed",String(pos===1)); bs[0].title=ur.name;
  }
}
function scopeLocal(toggle){ if(state.region){ if(toggle){ state.pickOpen=!state.pickOpen; renderPick(); } } else { state.pickOpen=true; setRegion(userRegion()); } }
function scopeCountry(){ state.pickOpen=false; setRegion(null); fitPoints(CITIES.map(c=>({x:c.x,y:c.y})),1.25); }
/* suriladigan tanlagich: tutqichni sudrash yoki bosish; qo'yib yuborganda eng yaqin tomonga o'rnashadi */
let swDrag=null, swNoClick=false;
document.addEventListener("pointerdown",e=>{
  const sw=e.target.closest&&e.target.closest(".sw"); if(!sw||e.button>0) return;
  const th=sw.querySelector(".sthumb"); swDrag={sw,th,x0:e.clientX,pos:+sw.dataset.pos,step:th.offsetWidth+6,moved:false,off:0,id:e.pointerId};
});
document.addEventListener("pointermove",e=>{
  const d=swDrag; if(!d||e.pointerId!==d.id) return;
  const dx=e.clientX-d.x0;
  if(!d.moved&&Math.abs(dx)>6){ d.moved=true; try{ d.sw.setPointerCapture(e.pointerId); }catch(_){} d.th.style.transition="none"; d.sw.classList.add("dragging"); }
  if(d.moved){ d.off=Math.max(0,Math.min(d.step,d.pos*d.step+dx)); d.th.style.transform=`translateX(${d.off}px)`; }
});
function endSwDrag(e){
  const d=swDrag; if(!d||e.pointerId!==d.id) return; swDrag=null;
  if(!d.moved) return;
  d.th.style.transition=""; d.th.style.transform=""; d.sw.classList.remove("dragging"); swNoClick=true; setTimeout(()=>swNoClick=false,0);
  const pos=d.off>d.step/2?1:0;
  d.sw.dataset.pos=pos;
  if(pos===0) scopeLocal(false); else scopeCountry();
}
document.addEventListener("pointerup",endSwDrag); document.addEventListener("pointercancel",endSwDrag);
/* "Viloyatni ko'rish" bosilganda tugma ustida viloyat tanlash paneli ochiladi */
function renderPick(){
  const el=$("#regPick"); if(!el) return;
  if(!state.pickOpen){ el.hidden=true; return; }
  el.hidden=false;
  el.innerHTML=`<div class="rp-t">Viloyatni tanlang</div><div class="rp-g">${[TASH_CITY,...REGIONS].map(r=>`<button type="button" data-act="pick-region" data-id="${r.id}" aria-pressed="${state.region===r.id}">${esc(r.name)}</button>`).join("")}</div>`;
}
// boshqa viloyat shaharlari va yozuvlari viloyat rejimida yashiriladi
let cityReg=null;
function syncOutside(){
  const wrap=$("#mapwrap"); wrap.classList.toggle("not-ts",!!state.region&&state.region!=="ts");
  if(!cityReg){ cityReg={}; for(const c of CITIES.concat(TOWNS)) cityReg[c.id]=regionAt(c).id; }
  document.querySelectorAll("#gCountry .city").forEach(g=>g.classList.toggle("outr",!!state.region&&cityReg[g.dataset.id]!==state.region));
}
function regionBarHtml(){
  const ur=userRegion(), local=state.region===ur.id, all=!state.region;
  let h="";
  if(state.region&&!local){
    const r=regionById(state.region), cc=CITIES.find(c=>c.name===r.center);
    h+=`<div class="rbanner"><span class="rsw" style="background:${RCOL[r.c]}"></span>
    <div class="rbt"><span class="eyebrow">Tanlangan hudud</span><b>${esc(r.name)}</b>${cc?`<span class="muted">Markazi: ${esc(cc.name)} · sizdan ${fmtKm(gdist(cc,state.user))}</span>`:""}</div>
    <button class="btn sm" data-act="clear-region">${ic("close")} Barcha hududlar</button></div>`;
  }
  return h;
}
let curList=[];
const moreLi=n=>`<li class="more"><button class="btn sm" data-act="more-list">Yana ${n} tasini ko'rsatish</button></li>`;
// ro'yxat oxiriga yetganda keyingi kartalar o'zi qo'shiladi (tugmasiz, cheklovsiz); faqat yangilari chiziladi
let moreT=0;
function checkMore(){
  const el=document.querySelector("#results .more"); if(!el) return;
  if(el.getBoundingClientRect().top<innerHeight+900) loadMore();
}
function onScrollMore(){ const n=performance.now(); if(n-moreT<60) return; moreT=n; checkMore(); }
$("#panel").addEventListener("scroll",onScrollMore,{passive:true}); addEventListener("scroll",onScrollMore,{passive:true});
function armMore(){ checkMore(); }
function loadMore(){
  const ul=$("#results"), el=ul.querySelector(".more"); if(!el) return;
  const from=state.listLimit; state.listLimit+=40; el.remove();
  const rest=curList.length-state.listLimit;
  ul.insertAdjacentHTML("beforeend",curList.slice(from,state.listLimit).map(r=>cardHtml(r.s,r.d)).join("")+(rest>0?moreLi(Math.min(40,rest)):""));
  armMore();
}
function render(){
  $("#regionBar").innerHTML=regionBarHtml();
  syncScope(); renderPick(); syncOutside();
  renderCats();
  const list=filtered(false);
  const q=norm(state.q);
  let sub=[];
  if(state.region) sub.push(regionById(state.region).short);
  if(state.radius) sub.push(`${state.radius} km radiusda`);
  if(state.minRating) sub.push(`reyting ${fmtR(state.minRating)}+`);
  if(state.openNow) sub.push("hozir ochiq");
  sub.push("to'g'ri chiziq masofasi"); sub.push({dist:"eng yaqini birinchi",rating:"reyting bo'yicha",reviews:"sharhlar soni bo'yicha"}[state.sort]);
  $("#rcount").textContent=`${list.length} ta xizmat`;
  $("#rsub").textContent=sub.join(" · ");
  // ro'yxat 1000+ bo'lishi mumkin: 80 tadan ko'rsatiladi; filtr o'zgarsa hisob boshidan
  const lkey=JSON.stringify([state.q,state.cat,state.radius,state.minRating,state.openNow,state.sort,state.region]);
  if(lkey!==state.listKey){ const first=state.listKey===undefined||state.listKey===null; state.listKey=lkey; state.listLimit=40; if(!first) $("#panel").scrollTop=0; }
  curList=list;
  $("#results").innerHTML=list.length?list.slice(0,state.listLimit).map(r=>cardHtml(r.s,r.d)).join("")+
    (list.length>state.listLimit?moreLi(Math.min(40,list.length-state.listLimit)):""):
    `<li class="empty"><span>Bu filtrlarga mos xizmat topilmadi. Radiusni kengaytiring yoki filtrlarni tozalang.</span><button class="btn sm" data-act="reset">Filtrlarni tozalash</button></li>`;
  armMore();
  // Jamoat joylari: qidiruvda yoki viloyat tanlanganda — xarita qatlamlari (Davlat, Park, Muzey…) bo'yicha
  wrap.classList.toggle("has-region",!!state.region);
  wrap.classList.toggle("local-scope",!!state.region);
  renderLayers();
  if(q||state.region){
    const all=places.filter(p=>state.layers.has(p.t)&&inRegion(p)&&(!q||norm(`${p.name} ${PTYPES[p.t].one} ${p.district} ${p.area||""} ${lang!=="uz"?trText(p.name)+" "+trText(PTYPES[p.t].one)+" "+trText(p.district):""}`).includes(q)))
      .map(p=>({p,d:gdist(p,state.user)})).sort((a,b)=>a.d-b.d);
    const lim=state.allPlaces?all.length:24, shown=all.slice(0,lim);
    $("#placeHits").innerHTML=all.length?`<div class="sec"><div class="subhead"><span>Jamoat joylari</span><span class="muted">${all.length} ta</span></div>
      <ul class="results">${shown.map(r=>placeCardHtml(r.p,r.d)).join("")}</ul>
      ${all.length>lim?`<button class="btn sm" data-act="more-places">Yana ${all.length-lim} tasini ko'rsatish</button>`:""}</div>`
      :(state.region&&!q?`<p class="muted" style="margin:0">Xaritada jamoat joylari qatlami yoqilmagan.</p>`:"");
  } else $("#placeHits").innerHTML="";
  renderMarkers(list);
}
function setPressed(group,val){group.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===String(val))));}

