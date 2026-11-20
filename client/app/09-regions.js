/* ---------- Viloyat markazlari: Toshkentdagidek ko'chalar, park, kanal, aeroport, jamoat joylari va xizmatlar ----------
   (Toshkent ma'lumotlaridan keyin yaratiladi, ularning id'lari o'zgarmasin. Shahar sxemasi umumlashtirilgan, taxminiy.) */
const STREETS=["Amir Temur ko'chasi","Alisher Navoiy ko'chasi","Mustaqillik ko'chasi","Bobur ko'chasi","Ibn Sino ko'chasi"];
const CITY_GRIDS=[], AIRPORTS=[{x:13300,y:14300,a:-8}];
const regionOfCity=c=>c.capital?TASH_CITY:c.rid?REGIONS.find(r=>r.id===c.rid):(REGIONS.find(r=>r.center===c.name)||regionAt(c));
// Taniqli joylar: [tur, nom, lng, lat, tavsif, joylashgan shahar (markazdan tashqarida bo'lsa)] — koordinatalar taxminiy
const LANDMARKS={
  "Samarqand":[["tour","Registon maydoni",66.9755,39.6547,"Uchta madrasa o'rab turgan tarixiy maydon, shaharning ramzi."],["tour","Go'ri Amir maqbarasi",66.9688,39.6485,"Amir Temur va temuriylar dafn etilgan maqbara."],["tour","Shohi Zinda majmuasi",66.9877,39.6630,"XI–XIX asrlarga oid maqbaralar ko'chasi."],["tour","Bibixonim masjidi",66.9790,39.6610,"Amir Temur davrida qurilgan ulkan jome masjidi."],["museum","Ulug'bek rasadxonasi muzeyi",67.0055,39.6748,"XV asr rasadxonasi qoldiqlari va muzey."]],
  "Buxoro":[["tour","Ark qal'asi",64.4097,39.7779,"Buxoro amirlarining qadimiy qal'asi."],["tour","Poyi Kalon majmuasi",64.4144,39.7757,"Minorai Kalon, masjid va madrasadan iborat majmua."],["tour","Labi Hovuz",64.4203,39.7741,"Hovuz atrofidagi madrasa va xonaqoh ansambli."],["tour","Somoniylar maqbarasi",64.4012,39.7774,"IX–X asrlarga oid g'ishtin maqbara."]],
  "Urganch":[["tour","Ichan Qal'a",60.3594,41.3783,"Devor bilan o'ralgan tarixiy ichki shahar.","Xiva"]],
  "Nukus":[["museum","Savitskiy nomidagi san'at muzeyi",59.6100,42.4650,"Qoraqalpog'iston davlat san'at muzeyi, avangard to'plami bilan mashhur."]],
  "Qarshi":[["tour","Oqsaroy",66.8270,39.0600,"Amir Temur saroyi qoldiqlari.","Shahrisabz"]],
  "Farg'ona":[["tour","Xudoyorxon o'rdasi",70.9420,40.5450,"Qo'qon xonlarining XIX asr saroyi.","Qo'qon"]],
  "Andijon":[["museum","Bobur adabiy-memorial muzeyi",72.3500,40.7850,"Zahiriddin Muhammad Boburga bag'ishlangan muzey."]],
  "Jizzax":[["park","Zomin milliy bog'i",68.40,39.62,"Tog'li milliy bog': archazorlar va dam olish maskanlari.","Zomin"]]
};
const HAS_AIRPORT=new Set(["Samarqand","Buxoro","Urganch","Nukus","Termiz","Qarshi","Navoiy","Andijon","Namangan","Farg'ona"]);
// Tuman markazlari va boshqa shaharlar (koordinatalar taxminiy) — viloyat faqat markazidan iborat bo'lib qolmasligi uchun
const TOWN_LIST={
  qq:[["Beruniy",60.75,41.69],["To'rtko'l",61.00,41.55],["Xo'jayli",59.45,42.40],["Qo'ng'irot",58.90,43.07],["Mo'ynoq",59.02,43.77],["Chimboy",59.78,42.94]],
  xo:[["Xiva",60.36,41.38],["Xonqa",60.79,41.47],["Hazorasp",61.07,41.32]],
  nv:[["Zarafshon",64.20,41.57],["Uchquduq",63.55,42.16],["Nurota",65.69,40.56]],
  bx:[["G'ijduvon",64.68,40.10],["Kogon",64.55,39.72],["Qorako'l",63.85,39.50]],
  sm:[["Kattaqo'rg'on",66.26,39.90],["Urgut",67.24,39.40]],
  jz:[["Zomin",68.40,39.96],["G'allaorol",67.59,40.02]],
  sd:[["Yangiyer",68.82,40.27],["Shirin",69.05,40.23],["Sirdaryo",68.66,40.84]],
  tv:[["Chirchiq",69.58,41.47],["Angren",70.14,41.02],["Olmaliq",69.60,40.85],["Bekobod",69.22,40.22],["Yangiyo'l",69.05,41.11]],
  nm:[["Chust",71.24,41.00],["Chortoq",71.82,41.07],["Pop",71.11,40.87]],
  an:[["Asaka",72.24,40.64],["Xonobod",72.93,40.80],["Shahrixon",72.06,40.71]],
  fg:[["Qo'qon",70.94,40.53],["Marg'ilon",71.72,40.47],["Quvasoy",71.98,40.30],["Rishton",71.28,40.36]],
  qd:[["Shahrisabz",66.83,39.06],["G'uzor",66.25,38.62],["Koson",65.58,39.04],["Muborak",65.15,39.26]],
  sx:[["Denov",67.90,38.27],["Sherobod",67.03,37.67],["Boysun",67.20,38.21],["Sho'rchi",67.79,38.00]]
};
const TOWNS=[];
Object.entries(TOWN_LIST).forEach(([rid,arr])=>arr.forEach(([name,lng,lat])=>TOWNS.push({id:"t"+TOWNS.length,name,rid,town:true,lng,lat,...ll2w(lng,lat)})));
const CITY_LABELS=[]; // shahar ichidagi mahalla nomlari (Toshkentdagi tuman yozuvlari kabi)
function buildCity(c,f=1){
  const real=!!realAreaAt(c.x,c.y);   // haqiqiy ko'chalar bor: sxematik ko'cha/park/kanal faqat ma'lumot uchun saqlanadi, chizilmaydi
  const rot=rnd()*Math.PI, streets=STREETS;
  const mh=[...MAHALLA];
  for(let i=0;i<5;i++){ const a=rot+i*1.257+range(-.3,.3), r=range(1600,4200)*f, ni=Math.floor(rnd()*mh.length);
    CITY_LABELS.push({x:Math.round(c.x+Math.cos(a)*r),y:Math.round(c.y+Math.sin(a)*r),name:mh.splice(ni,1)[0]}); }
  streets.forEach((name,i)=>{
    const a=rot+i*2*Math.PI/streets.length+range(-.2,.2), L=range(7000,9000)*f, pts=[];
    for(let t=0;t<=4;t++){const r=L*t/4, w=t>0&&t<4?range(-300,300)*f:0;pts.push([Math.round(c.x+Math.cos(a)*r-Math.sin(a)*w),Math.round(c.y+Math.sin(a)*r+Math.cos(a)*w)]);}
    ROADS.push({name,major:i<2,label:true,pts,city:c.name,skip:real});
  });
  ROADS.push({name:"Halqa yo'li",major:false,label:false,pts:ellipsePts(c.x,c.y,Math.round(range(3600,4600)*f),Math.round(range(3000,3800)*f),48),city:c.name,skip:real});
  if(!real) CITY_GRIDS.push({x:c.x,y:c.y,r:Math.round(6500*f),rot});
  for(let i=0;i<3;i++){const a=rnd()*6.28,r=range(900,3600)*f;PARKS.push([Math.round(c.x+Math.cos(a)*r),Math.round(c.y+Math.sin(a)*r),Math.round(range(260,520)),Math.round(range(180,360)),Math.round(range(-30,30)),real?1:0]);}
  const wa=rot+Math.PI/2+range(-.4,.4);
  WATER.push({name:"kanal",skip:real,pts:[-1,-.5,0,.5,1].map((t,i)=>{const off=(i%2?range(-600,600):0)+1200*f;return [Math.round(c.x+Math.cos(wa)*t*9000*f-Math.sin(wa)*off),Math.round(c.y+Math.sin(wa)*t*9000*f+Math.cos(wa)*off)];})});
  if(HAS_AIRPORT.has(c.name)){const a=rnd()*6.28;AIRPORTS.push({x:Math.round(c.x+Math.cos(a)*6800),y:Math.round(c.y+Math.sin(a)*6800),a:Math.round(range(-40,40)),city:c});}
}
function populate(c){
  const town=!!c.town;
  buildCity(c,town?.8:1);
  const r=regionOfCity(c), rs=r.short.replace(" vil.","");
  const near=(d0,d1)=>{const a=rnd()*6.28,rr=range(d0,d1);return [c.x+Math.cos(a)*rr,c.y+Math.sin(a)*rr];};
  const P=(t,name,xy,desc,town)=>{addPlace(t,name,xy[0],xy[1],desc,town||c.name);const p=places[places.length-1];p.city=c.name;p.region=r.id;p.area=`${town||c.name}${town?"":" shahri"}, ${r.name}`;};
  const addServices=(n,rad0)=>{for(let i=0;i<n;i++){
    const ang=rnd()*Math.PI*2, rad=200+Math.sqrt(rnd())*rad0;
    const s=makeService(CAT_KEYS[i%6],c.x+Math.cos(ang)*rad,c.y+Math.sin(ang)*rad,c.name);
    s.region=r.id; s.district=c.name;
    services.push(s);
    reviewsFor(s.id).forEach(rv=>applyReview(s,rv));
  }};
  // Viloyat markazi ham, tuman shahri ham bir xil to'liq to'plamni oladi; markazda qo'shimcha viloyat muassasalari bor
  const pk=PARKS.length-3, f=town?.8:1;
  if(!town) P("gov",r.id==="qq"?"Qoraqalpog'iston Respublikasi Vazirlar Kengashi":`${rs} viloyati hokimligi`,near(200,700),"Hududiy ijroiya hokimiyati: murojaatlar, fuqarolarni qabul qilish.");
  P("gov",`${c.name} shahar hokimligi`,near(300,1300*f),"Shahar hokimligi: murojaatlar va fuqarolarni qabul qilish.");
  P("gov","Davlat xizmatlari markazi",near(600,2200*f),"Pasport, ma'lumotnoma va boshqa davlat xizmatlarini bir joyda olish.");
  for(let i=0;i<3;i++) P("school",`${1+Math.floor(rnd()*60)}-umumta'lim maktabi`,near(800,4800*f),"Davlat umumta'lim maktabi, 1–11-sinflar.");
  for(let i=0;i<2;i++) P("kinder",`${1+Math.floor(rnd()*90)}-son DMTT (bog'cha)`,near(700,4500*f),"Davlat maktabgacha ta'lim tashkiloti, 3–7 yoshli bolalar uchun.");
  P("park",`${c.name} markaziy bog'i`,[PARKS[pk][0],PARKS[pk][1]],"Shahar markaziy bog'i: sayr yo'laklari, bolalar maydonchalari.");
  P("park",`${c.name} istirohat bog'i`,[PARKS[pk+1][0],PARKS[pk+1][1]],"Dam olish bog'i, oilaviy sayr uchun.");
  P("museum",town?`${c.name} tarix muzeyi`:r.id==="qq"?"Qoraqalpog'iston o'lkashunoslik muzeyi":`${rs} viloyat o'lkashunoslik muzeyi`,near(300,1800*f),"Hudud tarixi, tabiati va madaniyatiga oid ekspozitsiyalar.");
  if(!town) (LANDMARKS[c.name]||[]).forEach(([t,name,lng,lat,desc,lt])=>{const p=ll2w(lng,lat);P(t,name,[p.x,p.y],desc,lt);});
  const ap=AIRPORTS.find(a=>a.city===c);
  if(ap) P("airport",`${c.name} aeroporti`,[ap.x,ap.y],"Viloyat aeroporti: ichki va xalqaro reyslar.");
  addServices(town?18:c.name==="Nurafshon"?14:24,town?4400:5500);
}
CITIES.forEach(c=>{ if(!c.capital) populate(c); });
TOWNS.forEach(populate);

function drawCountry(){
  let h=NEIGHBORS.map(([n,lng,lat])=>{const p=ll2w(lng,lat);return `<g data-sx="${p.x}" data-sy="${p.y}"><text class="ctry" text-anchor="middle">${esc(n)}</text></g>`;}).join("");
  h+=REGIONS.map(r=>{const p=ll2w(...r.lbl);return `<g data-sx="${p.x}" data-sy="${p.y}"><text class="rlbl${r.small?" small":""}" text-anchor="middle">${esc(r.short)}</text></g>`;}).join("");
  h+=CITIES.map(c=>`<g class="city${c.capital?" capital":""}" data-kind="city" data-id="${c.id}" data-sx="${c.x}" data-sy="${c.y}">
    <circle class="cdot" r="${c.capital?6:4.5}"/><text x="${c.capital?-10:9}" y="4" text-anchor="${c.capital?"end":"start"}">${esc(c.name)}</text></g>`).join("");
  h+=TOWNS.map(c=>`<g class="city town" data-kind="city" data-id="${c.id}" data-rid="${c.rid}" data-sx="${c.x}" data-sy="${c.y}"><circle class="cdot" r="3.5"/><text x="8" y="4">${esc(c.name)}</text></g>`).join("");
  $("#gCountry").innerHTML=h;
}

function drawBase(){
  let h=`<rect class="out" x="-3000000" y="-2000000" width="5000000" height="4000000"/>`;
  h+=`<path class="uzb" d="${ringsD(UZB_RINGS)}"/>`;
  h+=regionsSvg();
  let gd="";
  for(let x=600;x<W;x+=1100){const j=((x*7)%320)-160;gd+=`M${x+j},-300L${x-j},${H+300}`;}
  for(let y=500;y<H;y+=1000){const j=((y*5)%260)-130;gd+=`M-300,${y+j}L${W+300},${y-j}`;}
  CITY_GRIDS.forEach(g=>[g.rot,g.rot+Math.PI/2].forEach(th=>{
    const ux=Math.cos(th),uy=Math.sin(th);
    for(let k=-g.r+450;k<g.r;k+=950){const half=Math.sqrt(g.r*g.r-k*k);
      gd+=`M${Math.round(g.x-uy*k-ux*half)},${Math.round(g.y+ux*k-uy*half)}L${Math.round(g.x-uy*k+ux*half)},${Math.round(g.y+ux*k+uy*half)}`;}
  }));
  h+=`<path class="minor" d="${gd}"/>`;
  PARKS.forEach(([x,y,rx,ry,a,sk])=>{ if(!sk) h+=`<ellipse class="park" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})"/>`;});
  AIRPORTS.forEach(a=>h+=`<g transform="rotate(${a.a} ${a.x} ${a.y})"><rect class="air" x="${a.x-1400}" y="${a.y-550}" width="2800" height="1100" rx="160"/><line class="runway" x1="${a.x-1150}" y1="${a.y+120}" x2="${a.x+1150}" y2="${a.y+120}"/><line class="runway" x1="${a.x-950}" y1="${a.y-220}" x2="${a.x+950}" y2="${a.y-220}"/></g>`);
  WATER.forEach(w=>{ if(!w.skip) h+=`<path class="water" d="${smooth(w.pts)}"/>`; });
  ROADS.forEach(r=>{ if(!r.skip) h+=`<path class="road-edge${r.major?" major":""}" d="${smooth(r.pts)}"/>`; });
  ROADS.forEach(r=>{ if(!r.skip) h+=`<path class="road${r.major?" major":""}" d="${smooth(r.pts)}"/>`; });
  $("#gBase").innerHTML=h;
  let defs="",lbl="";
  ROADS.forEach((r,i)=>{ if(!r.label||r.skip)return; let p=r.pts; if(p[0][0]>p[p.length-1][0]) p=[...p].reverse();
    defs+=`<path id="rp${i}" d="${smooth(p)}"/>`;
    lbl+=`<text class="roadlbl" dy="-0.7em"><textPath href="#rp${i}" startOffset="58%" text-anchor="middle">${esc(r.name)}</textPath></text>`; });
  defs+=`<clipPath id="uzbClip"><path d="${ringsD(UZB_RINGS)}"/></clipPath>`;
  $("#mapDefs").innerHTML=defs; $("#gRoadLabels").innerHTML=lbl;
  $("#gDistricts").innerHTML=DISTRICTS.map(d=>`<g data-sx="${d.x}" data-sy="${d.y}"><text class="dlbl" text-anchor="middle" y="-24">${esc(d.name)}</text></g>`).join("")
    ;
}

const markerEls={};
/* Tezlik: belgilar ekrandagi hudud (+50% chegara) uchun to'liq chiziladi; uzoq ko'rinishda (k>=40) har biri bitta nuqta.
   Xarita surilganda/masshtab o'zgarganda oyna tashqarisiga chiqsa, qisqa kechikish bilan qayta chiziladi. */
let lastMarkerList=[], mWin=null, mTimer=0;
function renderMarkers(list){
  lastMarkerList=list;
  const k=kpx(), dot=k>=40, mx=view.w*.5, my=view.h*.5, x0=view.x-mx, x1=view.x+view.w+mx, y0=view.y-my, y1=view.y+view.h+my;
  mWin={x0,y0,x1,y1,dot,w:view.w};
  const inWin=o=>o.x>=x0&&o.x<=x1&&o.y>=y0&&o.y<=y1, selId=state.sel&&state.sel.id, visible=new Set(list.map(r=>r.s.id));
  let h=""; const cs=k*9, seenP=new Set(), seenS=new Set(), gk=(x,y)=>Math.floor(x/cs)*100003+Math.floor(y/cs);
  places.forEach(p=>{
    if(!state.layers.has(p.t)||!inRegion(p))return;
    const sel=selId===p.id;
    if(dot){
      if(k>=150&&!state.region&&!sel) return;     // butun mamlakat ko'rinishida jamoat joylari faqat viloyat tanlanganda
      if(!sel){ const g=gk(p.x,p.y); if(seenP.has(g)) return; seenP.add(g); }
      h+=`<g class="mk pm dot${sel?" sel":""}" data-kind="place" data-id="${p.id}" data-sx="${p.x}" data-sy="${p.y}">${sel?'<rect class="halo" x="-14" y="-14" width="28" height="28" rx="9"/>':""}<rect class="ring" x="-10" y="-10" width="20" height="20" rx="6" style="fill:${PTYPES[p.t].color}"/></g>`;
      return;
    }
    if(!sel&&!inWin(p)) return;
    h+=`<g class="mk pm${sel?" sel":""}" data-kind="place" data-id="${p.id}" data-sx="${p.x}" data-sy="${p.y}">
      <rect class="halo" x="-14" y="-14" width="28" height="28" rx="9"/>
      <rect class="ring" x="-10" y="-10" width="20" height="20" rx="6" style="fill:${PTYPES[p.t].color}"/>
      <use href="#ic-${p.t}" x="-6.5" y="-6.5" width="13" height="13"/>
      <text class="lbl" x="15" y="4">${esc(p.name)}</text></g>`;
  });
  $("#gPlaces").innerHTML=h;
  h="";
  services.forEach(s=>{
    if(!visible.has(s.id))return;
    const sel=selId===s.id;
    if(dot){
      if(!sel){ const g=gk(s.x,s.y); if(seenS.has(g)) return; seenS.add(g); }
      h+=`<g class="mk sm dot${sel?" sel":""}" data-kind="service" data-id="${s.id}" data-sx="${s.x}" data-sy="${s.y}">${sel?'<circle class="halo" r="16"/>':""}<circle class="ring" r="11.5" style="fill:${CATS[s.cat].color}"/></g>`;
      return;
    }
    if(!sel&&!inWin(s)) return;
    h+=`<g class="mk sm${sel?" sel":""}" data-kind="service" data-id="${s.id}" data-sx="${s.x}" data-sy="${s.y}">
      <circle class="halo" r="16"/>
      <circle class="ring" r="11.5" style="fill:${CATS[s.cat].color}"/>
      <use href="#ic-${s.cat}" x="-7" y="-7" width="14" height="14"/>
      <text class="lbl" x="16" y="4">${esc(s.name)}</text></g>`;
  });
  $("#gServices").innerHTML=h;
  // tanlangan belgi eng ustda turishi uchun
  const selEl=svg.querySelector(".mk.sel"); if(selEl) selEl.parentNode.appendChild(selEl);
  for(const kk in markerEls) delete markerEls[kk];
  svg.querySelectorAll(".mk").forEach(el=>markerEls[el.dataset.id]=el);
  renderOverlays();
  applyView();
}
function checkMarkerWindow(k){
  if(!mWin) return;
  const dot=k>=40;
  if(view.x<mWin.x0||view.y<mWin.y0||view.x+view.w>mWin.x1||view.y+view.h>mWin.y1||dot!==mWin.dot||view.w>mWin.w*1.9||view.w<mWin.w/3){
    clearTimeout(mTimer); mTimer=setTimeout(()=>renderMarkers(lastMarkerList), dot!==mWin.dot?20:90);
  }
}
function renderOverlays(){
  markersDirty=true;
  const u=state.user;
  $("#gUser").innerHTML=(u.acc>5?`<circle class="acc" cx="${u.x}" cy="${u.y}" r="${u.acc}"/>`:"")+`<g class="user" data-sx="${u.x}" data-sy="${u.y}"><circle class="pulse" r="24"/><circle class="dot" r="8"/><text class="lbl" x="14" y="-10">Siz</text></g>`;
  { const lat=ORIGIN.lat-(u.y-ORIGIN.y)/111000, rm=state.radius*1000, rx=rm*83900/(111320*Math.cos(lat*RAD)), ry=rm*111000/111195;
    $("#gRadius").innerHTML=state.radius?`<ellipse class="radius" cx="${u.x}" cy="${u.y}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}"/>`:""; }
  const t=selectedPoint();
  let routeSvg="";
  if(t){ const rt=getRoute(u,t), pd=r=>`M${r.pts.map(q=>`${Math.round(q[0])},${Math.round(q[1])}`).join("L")}`;
    if(rt&&(rt.drive||rt.walk)){
      if(rt.walk&&(!rt.drive||Math.abs(rt.walk.len-rt.drive.len)>rt.drive.len*.05)) routeSvg+=`<path class="route-walk" d="${pd(rt.walk)}"/>`;
      if(rt.drive) routeSvg+=`<path class="route-case" d="${pd(rt.drive)}"/><path class="route-car" d="${pd(rt.drive)}"/>`; }
    else routeSvg=`<line class="route" x1="${u.x}" y1="${u.y}" x2="${t.x}" y2="${t.y}"/>`; }
  $("#gRoute").innerHTML=routeSvg;
  const m=state.mark;
  $("#gMark").innerHTML=m?`<g data-sx="${m.x}" data-sy="${m.y}" style="pointer-events:none"><path class="markpin" d="M0,0 C-2,-7 -11,-11 -11,-20 A11,11 0 1 1 11,-20 C11,-11 2,-7 0,0Z"/><circle class="markpin-dot" cy="-20" r="4"/></g>`:"";
}
/* Hisoblash nuqtasi: barcha masofalar shu nuqtadan. GPS bo'lsa aniq joylashuv, bo'lmasa koordinata yoki xaritadan tanlash. */
function setUser(x,y,label,acc){
  const was=state.user?userRegion():null, follow=!!was&&state.region===was.id;
  state.user={x:Math.round(x),y:Math.round(y),label,acc:acc||0}; routeCache.clear();
  if(follow){ const nr=userRegion(); state.region=nr.id; selectRegion(nr); }
  renderOrigin(); renderOverlays(); render();
  const ll=toLatLng(state.user.x,state.user.y);
  toast(`Hisoblash nuqtasi: ${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`);
}
function renderOrigin(){ renderOrigin0(); enhanceSelects(); }
function renderOrigin0(){
  const u=state.user, ll=toLatLng(u.x,u.y), open=!$("#ocoord")||!$("#ocoord").hidden;
  $("#originBar").innerHTML=`<div class="origin"><div class="ot"><span class="eyebrow">Masofa shu nuqtadan hisoblanadi</span><b>${esc(u.label)}</b>
    <span class="muted">${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}${u.acc>5?` · ±${Math.round(u.acc)} m`:""}</span></div>
    <div class="oa"><button class="btn sm" data-act="geolocate">${ic("locate")} Joylashuvimni aniqlash</button><button class="btn sm" data-act="coord-toggle">${ic("pin")} Koordinata kiritish</button>
      <select class="citysel csel" id="citySel" aria-label="Shaharni tanlang"><option value="">Shaharni tanlang</option>${CITIES.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div>
    <form class="ocoord" id="ocoord" hidden novalidate><input class="input" id="ocin" inputmode="decimal" autocomplete="off" placeholder="41.29950, 69.24010" aria-label="Koordinata (kenglik, uzunlik)"><button class="btn btn-accent sm" type="submit">Qo'yish</button><em class="err" id="ocerr"></em></form></div>`;
}
document.addEventListener("change",e=>{
  if(!e.target||e.target.id!=="citySel"||!e.target.value) return;
  const c=CITIES.concat(TOWNS).find(x=>x.id===e.target.value); if(!c) return;
  setUser(c.x,c.y,`${c.name} markazi`,0); flyTo(c.x,c.y,Math.min(view.w,7000));
});
function parseCoord(txt){
  const n=(txt.replace(/[°NSEWnsew]/g," ").match(/-?\d+(?:[.,]\d+)?/g)||[]).map(v=>parseFloat(v.replace(",",".")));
  if(n.length<2) return null;
  let lat=n[0], lng=n[1];
  if(lat>46&&lng<46) [lat,lng]=[lng,lat];            // teskari yozilgan bo'lsa (uzunlik, kenglik)
  if(!(lat>=36&&lat<=46&&lng>=55&&lng<=74)) return {bad:true,lat,lng};
  return {lat,lng};
}
function originHelp(msg){
  const f=$("#ocoord"); if(f){ f.hidden=false; $("#ocerr").textContent=msg; $("#ocin").focus(); }
}
function geolocate(){
  if(!navigator.geolocation){ originHelp("Bu brauzerda joylashuv aniqlanmaydi. Koordinatani qo'lda kiriting."); return; }
  toast("Joylashuv aniqlanmoqda…");
  navigator.geolocation.getCurrentPosition(pos=>{
    const c=pos.coords, w=ll2w(c.longitude,c.latitude);
    setUser(w.x,w.y,"Mening joylashuvim",c.accuracy);
    if(!inUzb(w)) toast("Siz O'zbekiston tashqarisidasiz: masofalar baribir shu nuqtadan hisoblanadi");
    flyTo(w.x,w.y,Math.min(view.w,7000));
  },err=>originHelp(err&&err.code===1?"Brauzer bu sahifaga joylashuvni bermadi (artifact ichida GPS bloklangan). Koordinatani qo'lda kiriting: telefon xaritasida joyni bosib turing, koordinata chiqadi.":"Joylashuvni aniqlab bo'lmadi. Koordinatani qo'lda kiriting."),
  {enableHighAccuracy:true,timeout:10000,maximumAge:60000});
}
function selectedPoint(){
  if(!state.sel)return null;
  if(state.sel.kind==="service")return byId(state.sel.id);
  if(state.sel.kind==="place")return places.find(p=>p.id===state.sel.id);
  if(state.sel.kind==="point")return state.mark;
  return null;
}

