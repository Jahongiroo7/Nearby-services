/* ---------- geometriya ---------- */
function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay;const t=clamp(((px-ax)*dx+(py-ay)*dy)/((dx*dx+dy*dy)||1),0,1);return Math.hypot(px-ax-t*dx,py-ay-t*dy);}
/* ---------- Toshkent markazi: OpenStreetMap ma'lumotlari (fayl ichiga joylangan — tashqi so'rov, kutish yo'q) ---------- */
const REAL=NS_DATA.osm||null;
const decPts=a=>{const p=[[a[0],a[1]]];for(let i=2;i<a.length;i+=2){const l=p[p.length-1];p.push([l[0]+a[i],l[1]+a[i+1]]);}return p;};
const REAL_AREAS=REAL?REAL.areas.filter(a=>a.r.length||(a.b&&a.b.length)):[];
// kichik hudud (masalan, Toshkent markazi) katta hududdan (butun Toshkent) ustun turadi — ro'yxatda keyinroq
function realAreaAt(x,y){for(let i=REAL_AREAS.length-1;i>=0;i--){const b=REAL_AREAS[i].bbox;if(x>=b[0]&&x<=b[2]&&y>=b[1]&&y<=b[3])return REAL_AREAS[i];}return null;}
function areaNamed(a){ if(!a._named) a._named=a.r.filter(r=>r[1]>=0&&r[0]!=="foot").map(r=>({name:REAL.names[r[1]],cls:r[0],pts:decPts(r[2])})); return a._named; }
function nearestRoad(x,y){let best={dist:Infinity,road:null};
  const area=realAreaAt(x,y);
  if(area){ // haqiqiy hududda — faqat haqiqiy ko'cha nomlari
    for(const r of areaNamed(area)){for(let i=0;i<r.pts.length-1;i++){const d=segDist(x,y,r.pts[i][0],r.pts[i][1],r.pts[i+1][0],r.pts[i+1][1]);if(d<best.dist)best={dist:d,road:r};}}
    if(best.road) return best;
  }
  for(const r of ROADS){for(let i=0;i<r.pts.length-1;i++){const d=segDist(x,y,r.pts[i][0],r.pts[i][1],r.pts[i+1][0],r.pts[i+1][1]);if(d<best.dist)best={dist:d,road:r};}}return best;}
/* ---------- Haqiqiy ko'chalar bo'yicha yo'l topish (A*) ----------
   Graf OSM ko'chalaridan yig'iladi (chorrahalar yo'lning umumiy nuqtalari). Piyoda: barcha yo'llar, 4,8 km/soat.
   Mashinada: yo'l toifasiga qarab shahar ichidagi o'rtacha tezlik. Bir tomonlama harakat va svetoforlar hisobga olinmagan. */
const WALK_MS=4.8/3.6;
const CAR_MS={major:42/3.6,sec:34/3.6,ter:28/3.6,min:22/3.6,svc:12/3.6};
const JUNCTION_S=7; // chorrahada o'rtacha kechikish (svetofor, burilish), faqat mashinada
class MinHeap{constructor(){this.a=[];}
  push(f,n){const a=this.a;a.push([f,n]);let i=a.length-1;while(i>0){const p=(i-1)>>1;if(a[p][0]<=a[i][0])break;[a[p],a[i]]=[a[i],a[p]];i=p;}}
  pop(){const a=this.a,top=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;for(;;){const l=i*2+1,r=l+1;let m=i;if(l<a.length&&a[l][0]<a[m][0])m=l;if(r<a.length&&a[r][0]<a[m][0])m=r;if(m===i)break;[a[m],a[i]]=[a[i],a[m]];i=m;}}return top;}
  get size(){return this.a.length;}}
function* graphGen(area){
  if(area._g) return area._g;
  const idx=new Map(), X=[], Y=[], adj=[], EI=[], EJ=[], EL=[], EC=[], C=100, cells=new Map();
  const node=(x,y)=>{const k=(x+2000000)*4194304+(y+2000000);let i=idx.get(k);if(i===undefined){i=X.length;idx.set(k,i);X.push(x);Y.push(y);adj.push([]);}return i;};
  let gn=0;
  for(const r of area.r){ if((++gn&255)===0) yield; const cls=r[0]; if(cls==="rail") continue; const p=decPts(r[2]);
    for(let t=0;t<p.length-1;t++){
      const i=node(p[t][0],p[t][1]), j=node(p[t+1][0],p[t+1][1]); if(i===j) continue;
      const len=Math.hypot(p[t+1][0]-p[t][0],p[t+1][1]-p[t][1]), e=EI.length;
      EI.push(i);EJ.push(j);EL.push(len);EC.push(cls);adj[i].push(e);adj[j].push(e);
      const n=Math.max(1,Math.ceil(len/40)); let last=null;
      for(let q=0;q<=n;q++){const x=p[t][0]+(p[t+1][0]-p[t][0])*q/n,y=p[t][1]+(p[t+1][1]-p[t][1])*q/n,k=Math.floor(x/C)*100003+Math.floor(y/C);
        if(k===last) continue; last=k; (cells.get(k)||cells.set(k,[]).get(k)).push(e);} } }
  return area._g={X,Y,adj,EI,EJ,EL,EC,C,cells};
}
function graphOf(area){ if(area._g) return area._g; const it=graphGen(area); let r; while(!(r=it.next()).done); return r.value; }
// og'ir hisoblash bo'sh vaqtda ~8 ms lik bo'laklarda bajariladi (sahifa qotmaydi)
function stepGen(it,done){ const run=()=>{ const dl=performance.now()+8; let r; do{ r=it.next(); }while(!r.done&&performance.now()<dl); if(r.done){ if(done) done(r.value); } else idle(run); }; idle(run); }
function snapTo(G,x,y,carOnly){
  const C=G.C, cx=Math.floor(x/C), cy=Math.floor(y/C); let best=null;
  for(let r=0;r<=6;r++){
    for(let i=-r;i<=r;i++)for(let j=-r;j<=r;j++){ if(Math.max(Math.abs(i),Math.abs(j))!==r) continue;
      const arr=G.cells.get((cx+i)*100003+(cy+j)); if(!arr) continue;
      for(const e of arr){ if(carOnly&&G.EC[e]==="foot") continue;
        const ax=G.X[G.EI[e]],ay=G.Y[G.EI[e]],bx=G.X[G.EJ[e]],by=G.Y[G.EJ[e]],dx=bx-ax,dy=by-ay,L2=dx*dx+dy*dy||1,
          t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/L2)),px=ax+t*dx,py=ay+t*dy,d=Math.hypot(x-px,y-py);
        if(!best||d<best.d) best={e,t,px,py,d}; } }
    if(best&&best.d<=r*C) break; }
  return best&&best.d<500?best:null;
}
function solveRoute(G,S,T,mode,a,b){
  const SP=G.speeds||CAR_MS, speed=e=>mode==="walk"?WALK_MS:(SP[G.EC[e]]||SP.min||CAR_MS.min);
  const allowed=e=>mode==="walk"||G.EC[e]!=="foot";
  if(!allowed(S.e)||!allowed(T.e)) return null;
  const vmax=mode==="walk"?WALK_MS:Math.max(...Object.values(SP)), heap=new MinHeap(), NN=G.X.length, gc=new Float64Array(NN).fill(Infinity), pnA=new Int32Array(NN).fill(-2), peA=new Int32Array(NN);
  const relax=(n,c,pn,pe)=>{ if(c<gc[n]){ gc[n]=c; pnA[n]=pn; peA[n]=pe; heap.push(c+Math.hypot(G.X[n]-T.px,G.Y[n]-T.py)/vmax,n); } };
  const sl=G.EL[S.e], tl=G.EL[T.e], sv=speed(S.e), tv=speed(T.e);
  relax(G.EI[S.e],S.t*sl/sv,-1,S.e); relax(G.EJ[S.e],(1-S.t)*sl/sv,-1,S.e);
  let best=Infinity, bestNode=-1;
  if(S.e===T.e){ best=Math.abs(S.t-T.t)*sl/sv; }   // bir xil yo'l bo'lagida: to'g'ridan-to'g'ri
  while(heap.size){
    const [f,n]=heap.pop(), g=gc[n], h=Math.hypot(G.X[n]-T.px,G.Y[n]-T.py)/vmax;
    if(f-h>g+1e-6) continue;           // eskirgan yozuv
    if(f>=best) break;
    if(n===G.EI[T.e]){ const c=g+T.t*tl/tv; if(c<best){best=c;bestNode=n;} }
    if(n===G.EJ[T.e]){ const c=g+(1-T.t)*tl/tv; if(c<best){best=c;bestNode=n;} }
    for(const e of G.adj[n]){ if(!allowed(e)) continue; const m=G.EI[e]===n?G.EJ[e]:G.EI[e]; relax(m,g+G.EL[e]/speed(e)+(mode==='drive'&&G.adj[m].length>=3?JUNCTION_S:0),n,e); }
  }
  if(best===Infinity) return null;
  const pts=[[a.x,a.y],[S.px,S.py]];
  if(bestNode>=0){ const nodes=[]; let n=bestNode; for(;;){ nodes.push(n); const pn=pnA[n]; if(pn<0) break; n=pn; }
    nodes.reverse().forEach(i=>pts.push([G.X[i],G.Y[i]])); }
  pts.push([T.px,T.py],[b.x,b.y]);
  let len=0; for(let i=0;i<pts.length-1;i++) len+=gdist({x:pts[i][0],y:pts[i][1]},{x:pts[i+1][0],y:pts[i+1][1]});
  const off=(S.d+T.d)/WALK_MS; // nuqtadan ko'chagacha piyoda
  return {len,min:(best+off)/60,pts};
}
const routeCache=new Map();
/* Shaharlararo yo'l: magistral va viloyatlararo yo'llar (REAL.hw + links) grafi. Boshlang'ich va oxirgi nuqta eng yaqin yo'lga
   to'g'ri chiziq bilan ulanadi (shahar ichida ~30 km/soat, 1.3x egri). Yo'l topilmasa taxminiy hisob qoladi. */
let HWG=null, hwStarted=false;
function* hwGen(){
  const r=[]; for(const h of REAL.hw) r.push([h[0]==="major"?"major":"sec",-1,h[1]]); for(const l of (REAL.links||[])) r.push(["sec",-1,l]);
  // shahar hududlaridagi asosiy yo'llar: magistrallarni shahar ichida ulaydi
  for(const z of REAL_AREAS) for(const q of z.r) if(q[0]==="major"||q[0]==="sec"||q[0]==="ter") r.push([q[0],-1,q[2]]);
  yield;
  const G=yield* graphGen({r}); G.speeds={major:85/3.6,sec:62/3.6,ter:50/3.6,min:40/3.6};
  // aniq tutashmagan yaqin uchlarni ulash (<=700 m): bo'laklar birlashadi
  const n=G.X.length, par=new Int32Array(n); for(let i=0;i<n;i++) par[i]=i;
  const find=i=>{while(par[i]!==i){par[i]=par[par[i]];i=par[i];}return i;};
  for(let e=0;e<G.EI.length;e++){ const a=find(G.EI[e]),b=find(G.EJ[e]); if(a!==b) par[a]=b; }
  const CS=700, grid=new Map(), gk=(x,y)=>Math.floor(x/CS)*100003+Math.floor(y/CS);
  for(let i=0;i<n;i++){ const k=gk(G.X[i],G.Y[i]); (grid.get(k)||grid.set(k,[]).get(k)).push(i); }
  yield;
  const deg=i=>G.adj[i].length;
  for(let i=0;i<n;i++){ if((i&4095)===0) yield; if(deg(i)>2) continue;   // faqat uchlar (tutashmagan chekkalar)
    const cx=Math.floor(G.X[i]/CS), cy=Math.floor(G.Y[i]/CS); let best=-1,bd=CS*CS;
    for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){ const arr=grid.get((cx+a)*100003+(cy+b)); if(!arr) continue;
      for(const j of arr){ if(find(j)===find(i)) continue; const d=(G.X[j]-G.X[i])**2+(G.Y[j]-G.Y[i])**2; if(d<bd){bd=d;best=j;} } }
    if(best>=0){ const e=G.EI.length; G.EI.push(i); G.EJ.push(best); G.EL.push(Math.sqrt(bd)); G.EC.push("sec"); G.adj[i].push(e); G.adj[best].push(e); par[find(i)]=find(best); } }
  return HWG=G;
}
function startHw(){
  if(hwStarted||!REAL||!REAL.hw) return; hwStarted=true;
  stepGen(hwGen(),()=>{ routeCache.clear(); try{ renderOverlays(); }catch(e){} });   // tayyor bo'lgach tanlangan marshrut yo'l bo'ylab qayta chiziladi
}
function snapFar(G,p){
  let best=null;
  for(let e=0;e<G.EI.length;e++){
    const ax=G.X[G.EI[e]],ay=G.Y[G.EI[e]],bx=G.X[G.EJ[e]],by=G.Y[G.EJ[e]],dx=bx-ax,dy=by-ay,L2=dx*dx+dy*dy||1,
      t=Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y-ay)*dy)/L2)),px=ax+t*dx,py=ay+t*dy,d=Math.hypot(p.x-px,p.y-py);
    if(!best||d<best.d) best={e,t,px,py,d}; }
  return best&&best.d<60000?best:null;
}
function farRoute(a,b){
  try{
    const G=HWG; if(!G){ startHw(); return null; }
    const S=snapFar(G,a), T=snapFar(G,b); if(!S||!T) return null;
    const acc=S.d+T.d; S.d=0; T.d=0;
    const r=solveRoute(G,S,T,"drive",a,b); if(!r) return null;
    r.len+=acc*.3; r.min+=acc*1.3/(30/3.6)/60;
    return {walk:null,drive:r,far:true};
  }catch(e){ return null; }
}
function getRoute(a,b){
  const key=`${a.x},${a.y}>${b.x},${b.y}`; if(routeCache.has(key)) return routeCache.get(key);
  let res=null;
  if(REAL&&gdist(a,b)<30000){
    // ikkala nuqtani qamrab oladigan eng kichik haqiqiy hudud
    let area=null;
    for(const z of REAL_AREAS){ const bb=z.bbox;
      if(a.x>=bb[0]&&a.x<=bb[2]&&a.y>=bb[1]&&a.y<=bb[3]&&b.x>=bb[0]&&b.x<=bb[2]&&b.y>=bb[1]&&b.y<=bb[3]&&z.r.length){
        if(!area||(bb[2]-bb[0])*(bb[3]-bb[1])<(area.bbox[2]-area.bbox[0])*(area.bbox[3]-area.bbox[1])) area=z; } }
    if(area){ try{
      const G=graphOf(area), r={};
      for(const mode of ["walk","drive"]){ const S=snapTo(G,a.x,a.y,mode==="drive"), T=snapTo(G,b.x,b.y,mode==="drive"); r[mode]=S&&T?solveRoute(G,S,T,mode,a,b):null; }
      if(r.walk||r.drive) res=r;
    }catch(e){ res=null; } }
  }
  if(!res&&REAL&&REAL.hw){ res=farRoute(a,b); if(!res&&!HWG){ return null; } }   // graf hali qurilmoqda: keshlanmaydi
  routeCache.set(key,res); return res;
}
/* tashqi xaritalarda yo'nalish: bosilgandagina ochiladi, koordinatalar faqat shu havolaga qo'yiladi */
function mapLinks(t){
  const u=toLatLng(state.user.x,state.user.y), d=toLatLng(t.x,t.y), f=v=>v.toFixed(6);
  const g=`https://www.google.com/maps/dir/?api=1&origin=${f(u.lat)},${f(u.lng)}&destination=${f(d.lat)},${f(d.lng)}&travelmode=driving`;
  const y=`https://yandex.com/maps/?rtext=${f(u.lat)},${f(u.lng)}~${f(d.lat)},${f(d.lng)}&rtt=auto`;
  return `<a class="btn mapext g" href="${g}" target="_blank" rel="noopener noreferrer">${ic("map")} Google Maps</a><a class="btn mapext y" href="${y}" target="_blank" rel="noopener noreferrer">${ic("map")} Yandex Maps</a>`;
}
/* Joy haqida rasmlar: tashqi manba bloklanadi, shuning uchun har bir turga 3 ta illyustratsiya sahifaning o'zida chiziladi
   (tashqi ko'rinish, ichki makon, xizmat). Rang va tafsilotlar joyning id'siga qarab o'zgaradi. */
function updGalArrows(g){
  const w=g.parentNode, p=w.querySelector(".prev"), n=w.querySelector(".next"); if(!p||!n) return;
  p.disabled=g.scrollLeft<4; n.disabled=g.scrollLeft+g.clientWidth>=g.scrollWidth-4;
}
document.addEventListener("scroll",e=>{ if(e.target.classList&&e.target.classList.contains("gallery")) updGalArrows(e.target); },true);
/* Haqiqiy fotolar: Wikimedia Commons (erkin litsenziyalar), har tur uchun 4 ta; muallif va litsenziya rasmning ustida ko'rsatiladi */
const photosOf=k=>(NS_DATA.photos||{})[k];
function photoGallery(key,seedStr){
  const ph=photosOf(key); if(!ph||ph.length<3) return null;
  const off=(parseInt(String(seedStr).replace(/\D/g,""),10)||1)%ph.length, alt=(CATS[key]&&CATS[key].label)||(PTYPES[key]&&PTYPES[key].one)||"";
  const sel=[0,1,2].map(i=>ph[(off+i)%ph.length]);
  return `<div class="galwrap"><div class="gallery" role="group" aria-label="Rasmlar">${sel.map(p=>`<figure><img src="${p.d}" alt="${esc(alt)}" loading="lazy" decoding="async"><a class="credit" href="${esc(p.u)}" target="_blank" rel="noopener noreferrer" title="${esc(p.a)} · ${esc(p.l)} · Wikimedia Commons">© ${esc(p.a)} · ${esc(p.l)}</a></figure>`).join("")}</div>
    <button type="button" class="garrow prev" data-act="gal-prev" aria-label="Oldingi rasm" disabled>${ic("back")}</button>
    <button type="button" class="garrow next" data-act="gal-next" aria-label="Keyingi rasm">${ic("back")}</button></div>
    <p class="gnote">Namunaviy foto (turga mos), Wikimedia Commons</p>`;
}
function galleryHtml(key,color,seedStr){
  const real=photoGallery(key,seedStr); if(real) return real;
  const sd=(parseInt(String(seedStr).replace(/\D/g,""),10)||1)*131, R=i=>hh(sd,i,3), id="gl"+(sd%100000);
  const ico=(x,y,w,c)=>`<svg x="${x}" y="${y}" width="${w}" height="${w}" style="color:${c};fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><use href="#ic-${key}"/></svg>`;
  const defsS=`<defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".9"/><stop offset="1" stop-color="#0b1a4d"/></linearGradient></defs>`,
    defsW=`<defs><linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f1ff"/><stop offset="1" stop-color="#b9cdf0"/></linearGradient></defs>`,
    defsR=`<defs><radialGradient id="${id}r" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#03195b"/></radialGradient></defs>`;
  // 1) tashqi ko'rinish
  const bh=62+R(1)*38, bw=176+R(2)*30, bx=(320-bw)/2, by=138-bh; let far="",win="",tree="";
  for(let i=0;i<6;i++){ const w=28+R(10+i)*26, h=30+R(20+i)*50; far+=`<rect x="${i*56-10+R(30+i)*14}" y="${138-h}" width="${w}" height="${h}" fill="#fff" opacity=".10"/>`; }
  const cols=Math.floor(bw/34), rows=Math.max(1,Math.floor((bh-46)/22));
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++) win+=`<rect x="${bx+14+c*34}" y="${by+42+r*22}" width="20" height="13" rx="2" fill="#fff" opacity="${(.22+R(40+r*9+c)*.55).toFixed(2)}"/>`;
  for(const tx of [bx-26,bx+bw+26]) tree+=`<rect x="${tx-2}" y="116" width="4" height="22" fill="#0a1538"/><circle cx="${tx}" cy="108" r="${13+R(50)*5}" fill="#2fa56a" opacity=".85"/>`;
  const ext=`<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">${defsS}<rect width="320" height="180" fill="url(#${id}s)"/><circle cx="${40+R(3)*220}" cy="${28+R(4)*20}" r="14" fill="#fff" opacity=".35"/>${far}
    <rect y="138" width="320" height="42" fill="#07122f"/><rect y="156" width="320" height="3" fill="#fff" opacity=".14"/>
    ${tree}<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="${color}"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="#fff" opacity=".08"/>
    <rect x="${bx+14}" y="${by+8}" width="${bw-28}" height="28" rx="8" fill="#fff"/>${ico(bx+bw/2-11,by+11,22,color)}
    ${win}<rect x="${bx+bw/2-12}" y="116" width="24" height="22" rx="3" fill="#07122f" opacity=".85"/></svg>`;
  // 2) ichki makon
  let shelf="";
  for(let r=0;r<3;r++){ shelf+=`<rect x="22" y="${36+r*34}" width="276" height="4" rx="2" fill="#7d93c4"/>`;
    let x=26; for(let i=0;x<286;i++){ const w=10+R(60+r*20+i)*16, h=12+R(100+r*20+i)*14; shelf+=`<rect x="${x}" y="${36+r*34-h}" width="${w}" height="${h}" rx="2" fill="${R(140+r*20+i)>.55?color:"#fff"}" opacity="${(.55+R(180+r*20+i)*.4).toFixed(2)}"/>`; x+=w+4+R(220+i)*6; } }
  const inn=`<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">${defsW}<rect width="320" height="180" fill="url(#${id}w)"/>${shelf}
    <rect y="140" width="320" height="40" fill="#8aa3d6"/><rect x="40" y="124" width="240" height="26" rx="8" fill="${color}"/><rect x="40" y="124" width="240" height="8" rx="4" fill="#fff" opacity=".25"/>
    ${[70,160,250].map((x,i)=>`<line x1="${x}" y1="0" x2="${x}" y2="${14+R(240+i)*10}" stroke="#506090" stroke-width="2"/><circle cx="${x}" cy="${20+R(240+i)*10}" r="8" fill="#ffd66b"/>`).join("")}
    ${ico(144,98,32,"#fff")}</svg>`;
  // 3) xizmat
  let dots="";
  for(let i=0;i<14;i++) dots+=`<circle cx="${R(300+i)*320}" cy="${R(320+i)*180}" r="${2+R(340+i)*6}" fill="#fff" opacity="${(.06+R(360+i)*.14).toFixed(2)}"/>`;
  const det=`<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">${defsR}<rect width="320" height="180" fill="url(#${id}r)"/>${dots}
    <circle cx="160" cy="90" r="64" fill="none" stroke="#fff" opacity=".18" stroke-width="2"/><circle cx="160" cy="90" r="46" fill="#fff" opacity=".12"/>
    <rect x="118" y="48" width="84" height="84" rx="24" fill="#fff" opacity=".95"/>${ico(132,62,56,color)}</svg>`;
  const cap=["Tashqi ko'rinish","Ichki makon","Xizmat"];
  return `<div class="galwrap"><div class="gallery" role="group" aria-label="Rasmlar">${[ext,inn,det].map((svg,i)=>`<figure>${svg}<figcaption>${cap[i]}</figcaption></figure>`).join("")}</div>
    <button type="button" class="garrow prev" data-act="gal-prev" aria-label="Oldingi rasm" disabled>${ic("back")}</button>
    <button type="button" class="garrow next" data-act="gal-next" aria-label="Keyingi rasm">${ic("back")}</button></div>
    <p class="gnote">Namuna illyustratsiya, haqiqiy foto emas</p>`;
}
function routeHtml(t){
  const u=state.user, d=gdist(u,t), rt=getRoute(u,t);
  if(!rt) return `<div>${travelTxt(d)} <span class="muted">(taxminiy: bu masofa uchun yo'l ma'lumoti yo'q)</span></div>`;
  if(rt.far) return `<div class="muted">To'g'ri chiziqda ${fmtKm(d)}</div><div>Mashinada: <b>${fmtKm(rt.drive.len)} · ~${fmtMin(rt.drive.min)}</b></div>`+
    `<div class="muted small">Magistral va viloyatlararo yo'llar bo'yicha; shahar ichidagi qismi taxminiy, tirbandlik hisobga olinmagan.</div>`;
  const line=(label,r,fallback)=>r?`<div>${label}: <b>${fmtKm(r.len)} · ~${fmtMin(r.min)}</b></div>`:`<div>${label}: <span class="muted">${fallback}</span></div>`;
  return `<div class="muted">To'g'ri chiziqda ${fmtKm(d)}</div>`+line("Piyoda",rt.walk,`~${fmtMin(walkMin(d))} (taxminiy)`)+line("Mashinada",rt.drive,`~${fmtMin(driveMin(d))} (taxminiy)`)+
    `<div class="muted small">Haqiqiy ko'chalar bo'yicha hisob; chorrahadagi o'rtacha kechikish bor, tirbandlik va bir tomonlama harakat hisobga olinmagan.</div>`;
}
function nearestDistrict(x,y){let b=DISTRICTS[0],bd=Infinity;for(const d of DISTRICTS){const dd=Math.hypot(d.x-x,d.y-y);if(dd<bd){bd=dd;b=d;}}return b.name;}
function smooth(p){
  let d=`M${p[0][0]},${p[0][1]}`;
  for(let i=0;i<p.length-1;i++){
    const p0=p[i-1]||p[i],p1=p[i],p2=p[i+1],p3=p[i+2]||p2;
    const c1=[Math.round(p1[0]+(p2[0]-p0[0])/6),Math.round(p1[1]+(p2[1]-p0[1])/6)];
    const c2=[Math.round(p2[0]-(p3[0]-p1[0])/6),Math.round(p2[1]-(p3[1]-p1[1])/6)];
    d+=`C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}
function addressFor(x,y){
  const r=nearestRoad(x,y);
  if(r.dist<420) return `${r.road.name}, ${1+Math.floor(rnd()*140)}-uy`;
  return `${pick(MAHALLA)} MFY, ${1+Math.floor(rnd()*60)}-uy`;
}

