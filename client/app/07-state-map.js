/* ---------- holat ---------- */
const state={q:"",cat:"all",radius:0,minRating:0,openNow:false,sort:"dist",region:null,
  layers:new Set(Object.keys(PTYPES)),sel:null,mark:null,user:{...USER0,label:"Toshkent markazi (namunaviy nuqta)",acc:0}};

/* ---------- xarita ---------- */
const svg=$("#map"), svgBase=$("#mapBase"), wrap=$("#mapwrap");
/* Haqiqiy qatlam canvas'da: 10 mingdan ortiq bino SVG'da surishni sekinlashtirardi, canvas'da esa bir kadr ~bir necha ms.
   Yo'llarning eni metrda (zoomga qarab o'sadi), lekin juda uzoqda ham ko'rinib turishi uchun pikselda minimum bor. */
const rc=$("#mapReal"), rctx=rc.getContext("2d");
let drawnView=null, lastDrawT=0, locPath=null;
let RC={}, RCG={}, realQueued=false, realFont="Inter, system-ui, sans-serif";
function sizeReal(){ const dpr=Math.min(2,window.devicePixelRatio||1); rc.width=Math.max(1,Math.round(pxW*dpr)); rc.height=Math.max(1,Math.round(pxH*dpr)); drawnView=null; rc.style.transform=""; queueReal(true); }
function readColors(){ const cs=getComputedStyle(document.documentElement), g=n=>cs.getPropertyValue(n).trim();
  RC={land:g("--map-land"),road:g("--map-road"),major:g("--map-road-major"),edge:g("--map-road-edge"),park:g("--map-park"),pitch:g("--map-pitch"),
      water:g("--map-water"),bldg:g("--map-bldg"),bldgEdge:g("--map-bldg-edge"),label:g("--muted"),rail:g("--map-label"),far:g("--muted")};
  const t=document.createElement("canvas").getContext("2d"); t.fillStyle=RC.land||"#000"; const fs=t.fillStyle; let rgb;
  if(fs[0]==="#") rgb=[parseInt(fs.slice(1,3),16),parseInt(fs.slice(3,5),16),parseInt(fs.slice(5,7),16)]; else rgb=(fs.match(/[\d.]+/g)||[0,0,0]).slice(0,3).map(Number);
  const dark=(rgb[0]*.299+rgb[1]*.587+rgb[2]*.114)<110;
  RCG=dark?{land:"#123a78",road:"#69707f",major:"#a3aab8",far:"#a3aab8",edge:"#0b1220",rail:"#4b5563",bldg:"#1a2233",bldgEdge:"#3a4256"}
          :{land:"#a4cbf1",road:"#6d7fa3",major:"#3f5280",far:"#3f5280",edge:"#dbe8fb",rail:"#8590a8",bldg:"#c9d6ee",bldgEdge:"#a6b6d8"};
  realFont=getComputedStyle(document.body).fontFamily||realFont; }
function onTheme(){ readColors(); queueReal(); }
try{ matchMedia("(prefers-color-scheme: dark)").addEventListener("change",onTheme); }catch(e){}
new MutationObserver(onTheme).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
// surish/zoom paytida tayyor canvas rasmi CSS transform bilan siljiydi (GPU), haqiqiy qayta chizish ~150 ms da bir marta
let realFirst=true;
function queueReal(imm){ if(realQueued) return; realQueued=true;
  const go=()=>{ if(realFirst){ realFirst=false; requestAnimationFrame(()=>requestAnimationFrame(()=>{ realQueued=false; drawReal(); })); return; }   // birinchi chizish: avval sahifa ko'rinadi
      requestAnimationFrame(()=>{ realQueued=false; drawReal(); }); }, wait=imm?0:Math.max(0,150-(performance.now()-lastDrawT));
  if(wait>0) setTimeout(go,wait); else go(); }
function syncReal(){ if(!drawnView||!pxW) return; const s=drawnView.w/view.w, tx=(drawnView.x-view.x)/view.w*pxW, ty=(drawnView.y-view.y)/view.w*pxW;
  rc.style.transformOrigin="0 0"; rc.style.transform=(Math.abs(s-1)<1e-6&&Math.abs(tx)<.01&&Math.abs(ty)<.01)?"":`translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${s})`; }
const walkP=(p,a,close)=>{let x=a[0],y=a[1];p.moveTo(x,y);for(let i=2;i<a.length;i+=2){x+=a[i];y+=a[i+1];p.lineTo(x,y);}if(close)p.closePath();};
const polyP=list=>{const p=new Path2D();(list||[]).forEach(a=>walkP(p,a,true));return p;};
const lineP=list=>{const p=new Path2D();(list||[]).forEach(a=>walkP(p,a,false));return p;};
/* Bino ma'lumoti yo'q shaharlar uchun: haqiqiy ko'chalar bo'ylab uchastkalarga bino joylashtiriladi.
   Har bir bino ko'cha yo'nalishiga to'g'ri turadi; boshqa ko'cha va binolar bilan kesishsa tashlab yuboriladi. Natija doim bir xil (seed). */
const HALF_W={major:12,sec:8.5,ter:6.5,min:4.5};
const hh=(a,b,c)=>{let x=(Math.imul(a,374761393)+Math.imul(b,668265263)+Math.imul(c,1440670441))|0;x=Math.imul(x^(x>>>13),1274126177);x^=x>>>16;return (x>>>0)/4294967296;};
function makeBuildingGen(a){
  const roads=a.r.filter(r=>r[0] in HALF_W).map((r,idx)=>{const pts=decPts(r[2]),cum=[0];
    for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
    return {cls:r[0],pts,cum,pitch:15+(idx*7919%5)};});
  if(!roads.length) return null;
  const C=40, CS=1500, rh=new Map(), bh=new Map(), key=(x,y)=>Math.floor(x/C)*100003+Math.floor(y/C), cellSegs=new Map(), done=new Map();
  const addCell=(x,y,code)=>{const k=Math.floor(x/CS)*100003+Math.floor(y/CS);let s=cellSegs.get(k);if(!s)cellSegs.set(k,s=new Set());s.add(code);};
  roads.forEach((r,ri)=>{const h=HALF_W[r.cls];
    for(let i=0;i<r.pts.length-1;i++){const [ax,ay]=r.pts[i],[bx,by]=r.pts[i+1],L=Math.hypot(bx-ax,by-ay),n=Math.max(1,Math.ceil(L/10)),code=ri*2000000+i;
      for(let j=0;j<=n;j++){const x=ax+(bx-ax)*j/n,y=ay+(by-ay)*j/n,k=key(x,y);(rh.get(k)||rh.set(k,[]).get(k)).push(x,y,h);
        if(j%20===0||j===n){addCell(x-45,y-45,code);addCell(x+45,y-45,code);addCell(x-45,y+45,code);addCell(x+45,y+45,code);}}}});
  // haqiqiy binolar sohasi ichkarisida (chekkadan 260 m dan keyin) generatsiya yo'q; chekkada esa haqiqiy binolarga tegmagan joylarga qo'yiladi
  const M=260, realZ=REAL_AREAS.filter(z=>z.b&&z!==a), skip=realZ.map(z=>[z.bbox[0]+M,z.bbox[1]+M,z.bbox[2]-M,z.bbox[3]-M]);
  const realHit=(cx,cy,m)=>{ for(const z of realZ){ const bb=z.bbox; if(cx<bb[0]||cx>bb[2]||cy<bb[1]||cy>bb[3]) continue;
      if(!z._rc){ const h=new Map(); for(const poly of z.b){ const pts=decPts(poly); let sx=0,sy=0; for(const q of pts){sx+=q[0];sy+=q[1];} const mx=sx/pts.length,my=sy/pts.length,k=Math.floor(mx/30)*100003+Math.floor(my/30); (h.get(k)||h.set(k,[]).get(k)).push(mx,my); } z._rc=h; }
      const k0=Math.floor(cx/30),k1=Math.floor(cy/30);
      for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){ const arr=z._rc.get((k0+i)*100003+(k1+j)); if(!arr) continue; for(let t=0;t<arr.length;t+=2) if(Math.hypot(arr[t]-cx,arr[t+1]-cy)<m*.5+9) return true; } }
    return false; };
  const clear=(cx,cy,ux,uy,w,d)=>{const k0=Math.floor(cx/C),k1=Math.floor(cy/C);
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const arr=rh.get((k0+i)*100003+(k1+j));if(!arr)continue;
      for(let t=0;t<arr.length;t+=3){const dx=arr[t]-cx,dy=arr[t+1]-cy,lx=dx*ux+dy*uy,ly=-dx*uy+dy*ux,
        ex=Math.max(Math.abs(lx)-w/2,0),ey=Math.max(Math.abs(ly)-d/2,0);if(Math.hypot(ex,ey)<arr[t+2]+2.2)return false;}}
    return true;};
  const free=(cx,cy,m)=>{const k0=Math.floor(cx/C),k1=Math.floor(cy/C);
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const arr=bh.get((k0+i)*100003+(k1+j));if(!arr)continue;
      for(let t=0;t<arr.length;t+=3){if(Math.hypot(arr[t]-cx,arr[t+1]-cy)<(arr[t+2]+m)*.5)return false;}}
    return true;};
  function cell(kx,ky){
    const k=kx*100003+ky; if(done.has(k)) return done.get(k);
    const out=new Path2D(); done.set(k,out);
    const set=cellSegs.get(k); if(!set) return out;
    const x0=kx*CS,y0=ky*CS,x1=x0+CS,y1=y0+CS;
    const place=(cx,cy,ux,uy,w,d)=>{
      if(cx<x0||cx>=x1||cy<y0||cy>=y1) return false;
      for(const b of skip) if(cx>b[0]&&cx<b[2]&&cy>b[1]&&cy<b[3]) return false;
      const m=Math.min(w,d); if(realZ.length&&realHit(cx,cy,Math.max(w,d))) return false; if(!free(cx,cy,m)||!clear(cx,cy,ux,uy,w,d)) return false;
      const vx=-uy,vy=ux,hw=w/2,hd=d/2;
      out.moveTo(cx-ux*hw-vx*hd,cy-uy*hw-vy*hd);out.lineTo(cx+ux*hw-vx*hd,cy+uy*hw-vy*hd);out.lineTo(cx+ux*hw+vx*hd,cy+uy*hw+vy*hd);out.lineTo(cx-ux*hw+vx*hd,cy-uy*hw+vy*hd);out.closePath();
      const kk=key(cx,cy);(bh.get(kk)||bh.set(kk,[]).get(kk)).push(cx,cy,m); return true;};
    for(const code of set){
      const ri=Math.floor(code/2000000), i=code%2000000, r=roads[ri], h=HALF_W[r.cls];
      const [ax,ay]=r.pts[i],[bx,by]=r.pts[i+1], L=r.cum[i+1]-r.cum[i]; if(L<1) continue;
      const ux=(bx-ax)/L,uy=(by-ay)/L,nx=-uy,ny=ux, P=r.pitch;
      for(let j=Math.ceil((r.cum[i]-P/2)/P); (j+.5)*P<r.cum[i+1]; j++){
        const s=(j+.5)*P-r.cum[i]; if(s<0) continue;
        const cx=ax+ux*s,cy=ay+uy*s, w=P-3-hh(ri,j,1)*3;
        for(const sd of [1,-1]){
          const q=hh(ri,j,sd+5); if(q<.1) continue;
          const d=8+hh(ri,j,sd+9)*8, off=h+4+hh(ri,j,sd+13)*5+d/2;
          if(place(cx+nx*sd*off,cy+ny*sd*off,ux,uy,w,d)&&hh(ri,j,sd+17)<.45){const d2=7+hh(ri,j,sd+21)*6, o2=off+d/2+3+d2/2; place(cx+nx*sd*o2,cy+ny*sd*o2,ux,uy,w*(.8+hh(ri,j,sd+25)*.4),d2);}
        }
      }
    }
    return out;
  }
  // ko'rinib turgan kataklarning yo'llari (yaratilmagan bo'lsa, shu yerda yaratiladi)
  // vaqt byudjeti (deadline): yangi kataklar kadrga sig'masa keyingi kadrga qoladi (l.pending), sayt qotmaydi
  return (vx0,vy0,vx1,vy1,deadline)=>{const l=[],todo=[],mx=(vx0+vx1)/2,my=(vy0+vy1)/2;
    for(let kx=Math.floor(vx0/CS);kx<=Math.floor(vx1/CS);kx++)for(let ky=Math.floor(vy0/CS);ky<=Math.floor(vy1/CS);ky++){
      const k=kx*100003+ky; if(done.has(k)) l.push(done.get(k)); else todo.push([kx,ky,Math.hypot((kx+.5)*CS-mx,(ky+.5)*CS-my)]);}
    todo.sort((a,b)=>a[2]-b[2]);
    for(let i=0;i<todo.length;i++){ if(i>0&&deadline&&performance.now()>deadline){ l.pending=true; break; } l.push(cell(todo[i][0],todo[i][1])); }
    return l;};
}
function areaPaths(a){
  if(a._p) return a._p;
  const by={}; a.r.forEach(([c,,d])=>(by[c]=by[c]||[]).push(d));
  const needGen=!a.b&&a.r.some(r=>r[0] in HALF_W), det=!!a.b||needGen;
  const P={detail:det,gen:null,needGen,b:polyP(a.b),g:polyP(a.g),p:polyP(a.p),w:polyP(a.w),wl:lineP(a.wl),r:{},labels:[]};
  P.by=by;   // yo'l yo'llari (Path2D) sinf bo'yicha drawReal'da kadr byudjeti bilan quriladi
  const ord={major:0,sec:1,ter:2,min:3};
  areaNamed(a).forEach(r=>{ if(!(r.cls in ord)) return; let best=null,bl=0;
    for(let i=0;i<r.pts.length-1;i++){const [ax,ay]=r.pts[i],[bx,by2]=r.pts[i+1],l=Math.hypot(bx-ax,by2-ay);if(l>bl){bl=l;best=[ax,ay,bx,by2];}}
    if(best&&bl>40) P.labels.push({name:r.name,cls:r.cls,x:(best[0]+best[2])/2,y:(best[1]+best[3])/2,a:Math.atan2(best[3]-best[1],best[2]-best[0]),len:bl}); });
  P.labels.sort((x,y)=>(ord[x.cls]-ord[y.cls])||(y.len-x.len));
  return a._p=P;
}
let HW=null;
// [sinf, eni (m), min eni (px), rang, shu masshtabdan (m/px) yaqinda ko'rinadi]
const ROAD_STYLE=[["foot",2.5,.7,"edge",3],["svc",5,1,"road",5],["min",9,1.4,"road",13],["ter",13,2,"road",28],["sec",17,2.6,"major",40],["major",24,3.2,"major",40],["rail",4,1.3,"rail",40]];
function drawReal(){
  const ctx=rctx, dpr=rc.width/pxW, k=view.w/pxW;
  lastDrawT=performance.now(); drawnView={x:view.x,y:view.y,w:view.w}; rc.style.transform="";
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,rc.width,rc.height);
  if(!REAL){ $("#osmattr").hidden=true; return; }
  const s=dpr/k; ctx.setTransform(s,0,0,s,-view.x*s,-view.y*s);
  ctx.lineCap="round"; ctx.lineJoin="round";
  const vx0=view.x, vy0=view.y, vx1=view.x+view.w, vy1=view.y+view.h;
  const dl=performance.now()+10; let pend=false, fresh=false, builtRoad=false;   // kadr byudjeti: og'ir hisoblash kadrlarga bo'linadi
  // shaharlararo yo'llar: har qanday masshtabda, ingichka
  if(!HW){ HW={major:lineP(REAL.hw.filter(h=>h[0]==="major").map(h=>h[1])),sec:lineP(REAL.hw.filter(h=>h[0]!=="major").map(h=>h[1]).concat(REAL.links||[]))}; }
  const LOC=!!localLimit(), lf=LOC?.45:1;   // viloyat rejimi: butun ko'rinish bir xil fon, haqiqiy yo'llar uzoqroq masshtabgacha
  let LP=null;
  if(LOC){ ctx.fillStyle=RC.land; ctx.fillRect(vx0,vy0,view.w,view.h);
    // hudud chegarasi (shahar konturi): ichida - haqiqiy yo'llar, tashqarisi biroz to'qroq; chizma kontur bo'ylab qirqiladi
    const rid=state.region; LP=(locPath&&locPath.id===rid)?locPath.p:(locPath={id:rid,p:new Path2D(regionD(regionById(rid)))}).p;
  }
  ctx.save(); if(LP) ctx.clip(LP,"evenodd");   // viloyat rejimi: chegaradan tashqarida hech narsa chizilmaydi
  const RC0=RC; RC=Object.assign({},RC,RCG); if(!LOC) RC.land=RC0.land; else { ctx.fillStyle=RC.land; ctx.fillRect(vx0,vy0,view.w,view.h); }   // barcha chiziqlar (yo'l, temir yo'l) kulrang; chegaralar oq
  const hwW=k>150?1:k>40?1.4:2;
  const drawHW=()=>{
  if(k<40){ ctx.strokeStyle=RC.edge; ctx.lineWidth=(hwW+1.4)*k; ctx.stroke(HW.sec); ctx.stroke(HW.major); }
  // uzoqdan ko'rinish uchun ochiq rang (to'q fonda ham, yorug' fonda ham farqlanadi)
  ctx.strokeStyle=k>40?RC.far:RC.major; ctx.lineWidth=(k>40?2:hwW*.9)*k; ctx.stroke(HW.sec); ctx.lineWidth=(k>40?3:hwW*1.3)*k; ctx.stroke(HW.major);
  }; drawHW();
  ctx.globalAlpha=1;
  let any=REAL.hw.length>0;
  if(k<(LOC?90:40)) for(const a of REAL_AREAS){
    const bb=a.bbox; if(bb[2]<vx0||bb[0]>vx1||bb[3]<vy0||bb[1]>vy1) continue;
    const P=areaPaths(a); any=true;
    // viloyat rejimi: ma'lumot tugaydigan chetdagi uzilgan yo'l uchlari chizilmaydi (chekinib qirqiladi)
    const inset=LOC&&!a.b;   // viloyat rejimi: ma'lumot chegarasi to'rtburchak bo'lib ko'rinmasin, mayda yo'llar oval bo'ylab asta so'nadi
    if(inset){ ctx.save(); ctx.beginPath(); ctx.rect(bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]); ctx.clip(); }   // chegaradan chiqib ketgan yo'l parchalari qirqiladi (so'nmay qolib, to'g'ri chiziq hosil qilmasin)
    if(!a.b&&!LOC){ ctx.fillStyle=RC.land; ctx.fillRect(bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]); } // ostidagi sxematik chizmani yopadi (ichma-ich markaziy hudud katta hududning ustida, o'z to'rtburchagini bo'yamaydi)
    if(P.detail){ ctx.fillStyle=RC.park; ctx.fill(P.g); ctx.fillStyle=RC.pitch; ctx.fill(P.p); ctx.fillStyle=RC.water; ctx.fill(P.w); }
    ctx.strokeStyle=RC.water; ctx.lineWidth=Math.max(10,2.5*k); ctx.stroke(P.wl);
    if(P.detail&&k<11){ if(P.needGen&&!P.gen){ if(!fresh||performance.now()<dl){ P.gen=makeBuildingGen(a)||(()=>[]); fresh=true; } else pend=true; }
      const bl=P.needGen?(P.gen?P.gen(Math.max(vx0,bb[0]),Math.max(vy0,bb[1]),Math.min(vx1,bb[2]),Math.min(vy1,bb[3]),dl):[]):[P.b]; if(bl.pending) pend=true; ctx.fillStyle=RC.bldg; for(const b of bl) ctx.fill(b); if(k<3){ ctx.strokeStyle=RC.bldgEdge; ctx.lineWidth=.9*k; for(const b of bl) ctx.stroke(b); } }
    const st=[], wd=r=>Math.max(r[1],r[2]*k);
    for(const r of ROAD_STYLE){ if(k*lf>=r[4]||!P.by[r[0]]) continue;
      if(!P.r[r[0]]){ if(!builtRoad||performance.now()<dl){ P.r[r[0]]=lineP(P.by[r[0]]); builtRoad=true; } else { pend=true; continue; } }
      st.push(r); }
    for(const r of st){ if(r[0]==="foot"||r[0]==="rail") continue; ctx.strokeStyle=RC.edge; ctx.lineWidth=wd(r)+1.6*k; ctx.stroke(P.r[r[0]]); }
    for(const r of st){ ctx.strokeStyle=RC[r[3]]; ctx.lineWidth=wd(r); if(r[0]==="rail") ctx.setLineDash([7*k,6*k]); ctx.stroke(P.r[r[0]]); ctx.setLineDash([]); }
    // chegara qirrasi: ma'lumot tugaydigan joyda keskin chiziq bo'lmasligi uchun fon rangiga asta so'nadi
    if(!a.b&&!LOC){ const F=Math.min(Math.max(70*k,400),2500), N=10, W=bb[2]-bb[0], H=bb[3]-bb[1]; ctx.fillStyle=RC.land;
      for(let i=0;i<N;i++){ const d=F/N, a=1-i/N; ctx.globalAlpha=a*a;
        if(bb[0]+i*d<vx1&&bb[0]+(i+1)*d>vx0){ ctx.fillRect(bb[0]+i*d,bb[1],d+1,H); }
        if(bb[2]-(i+1)*d<vx1&&bb[2]-i*d>vx0){ ctx.fillRect(bb[2]-(i+1)*d-1,bb[1],d+1,H); }
        if(bb[1]+i*d<vy1&&bb[1]+(i+1)*d>vy0){ ctx.fillRect(bb[0],bb[1]+i*d,W,d+1); }
        if(bb[3]-(i+1)*d<vy1&&bb[3]-i*d>vy0){ ctx.fillRect(bb[0],bb[3]-(i+1)*d-1,W,d+1); } }
      ctx.globalAlpha=1; }
    if(inset){ const lc=rgbaOf(RC.land), cx=(bb[0]+bb[2])/2, cy=(bb[1]+bb[3])/2;
      ctx.save(); ctx.beginPath(); ctx.rect(bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]); ctx.clip();
      ctx.translate(cx,cy); ctx.scale((bb[2]-bb[0])/2,(bb[3]-bb[1])/2);
      const g=ctx.createRadialGradient(0,0,0,0,0,1); g.addColorStop(0,lc(0)); g.addColorStop(.66,lc(0)); g.addColorStop(.84,lc(.5)); g.addColorStop(.95,lc(.92)); g.addColorStop(1,lc(1));
      ctx.fillStyle=g; ctx.fillRect(-1,-1,2,2); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]); ctx.clip(); drawHW(); ctx.restore(); ctx.restore(); }
  }
  ctx.restore();
  if(LP){ ctx.setLineDash([]); ctx.lineJoin="round"; ctx.strokeStyle="rgba(0,0,0,.38)"; ctx.lineWidth=4.4*k; ctx.stroke(LP);
    ctx.strokeStyle="#ffffff"; ctx.lineWidth=2.2*k; ctx.stroke(LP); }
  RC=RC0;
  $("#osmattr").hidden=!any;
  if(k<3.4){ ctx.setTransform(dpr,0,0,dpr,0,0); const placed=[], seen={};
    for(const a of REAL_AREAS){ const bb=a.bbox; if(bb[2]<vx0||bb[0]>vx1||bb[3]<vy0||bb[1]>vy1) continue; drawRealLabels(ctx,k,areaPaths(a).labels,placed,seen); } }
  if(pend) queueReal(true); else if(k<11) prefetchCells();
}
// ekran atrofidagi binolarni bo'sh vaqtda oldindan tayyorlash: tez surganda ham binolar kech chiqmaydi
let pfTok=0;
function prefetchCells(){
  const tok=++pfTok;
  const run=()=>{ if(tok!==pfTok) return; const dl=performance.now()+6; let more=false;
    const ex=.4, x0=view.x-view.w*ex, y0=view.y-view.h*ex, x1=view.x+view.w*(1+ex), y1=view.y+view.h*(1+ex);
    for(const a of REAL_AREAS){ const bb=a.bbox, P=a._p; if(!P||!P.needGen||!P.gen||bb[2]<x0||bb[0]>x1||bb[3]<y0||bb[1]>y1) continue;
      const l=P.gen(Math.max(x0,bb[0]),Math.max(y0,bb[1]),Math.min(x1,bb[2]),Math.min(y1,bb[3]),dl); if(l.pending) more=true; }
    if(more) idle(run); };
  idle(run);
}
function rgbaOf(col){ const C=rgbaOf.c||(rgbaOf.c={}); let m=C[col]; if(!m){ const cx=document.createElement("canvas").getContext("2d"); cx.fillStyle=col; const v=String(cx.fillStyle); let r,g,b; if(v[0]==="#"){ r=parseInt(v.slice(1,3),16); g=parseInt(v.slice(3,5),16); b=parseInt(v.slice(5,7),16); } else { const q=v.match(/[\d.]+/g)||[0,0,0]; r=+q[0]; g=+q[1]; b=+q[2]; } m=C[col]=a=>"rgba("+r+","+g+","+b+","+a+")"; } return m; }
const idle=f=>("requestIdleCallback" in window)?requestIdleCallback(f,{timeout:250}):setTimeout(f,40);
function drawRealLabels(ctx,k,labels,placed,seen){
  ctx.font=`600 11px ${realFont}`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.lineJoin="round";
  for(const L of labels){
    if(L.cls==="min"&&k>1.8) continue;
    const sx=(L.x-view.x)/k, sy=(L.y-view.y)/k;
    if(sx<-60||sx>pxW+60||sy<-20||sy>pxH+20) continue;
    const w=ctx.measureText(L.name).width; if(w>L.len/k*1.15) continue; // nom ko'cha bo'lagidan uzun bo'lsa yozilmaydi
    if((seen[L.name]||[]).some(p=>Math.hypot(p[0]-sx,p[1]-sy)<260)) continue;
    const r=w/2+6; if(placed.some(p=>Math.hypot(p[0]-sx,p[1]-sy)<r+p[2])) continue;
    placed.push([sx,sy,r]); (seen[L.name]=seen[L.name]||[]).push([sx,sy]);
    let a=L.a; if(a>Math.PI/2) a-=Math.PI; if(a<-Math.PI/2) a+=Math.PI;
    ctx.save(); ctx.translate(sx,sy); ctx.rotate(a);
    ctx.lineWidth=3.5; ctx.strokeStyle=RC.land; ctx.strokeText(L.name,0,0); ctx.fillStyle=RC.label; ctx.fillText(L.name,0,0);
    ctx.restore();
  }
}
let view={x:0,y:0,w:14000,h:10000}, pxW=800, pxH=600, anim=0, markersDirty=true, scaledEls=[], lastScaleK=-1;
const kpx=()=>view.w/pxW;
const W_MIN=1200, W_MAX=2200000;
function setCenter(cx,cy,w){view.w=clamp(w,W_MIN,W_MAX);view.h=view.w*pxH/pxW;view.x=cx-view.w/2;view.y=cy-view.h/2;clampView();}
/* "Faqat mening hududim" rejimida xarita hududdan tashqariga chiqmaydi va undan uzoqqa uzoqlashmaydi; "Butun davlat" bosilganda erkin */
const boxCache={};
function regionBox(r){
  if(boxCache[r.id]) return boxCache[r.id];
  let x0=1e12,y0=1e12,x1=-1e12,y1=-1e12; const add=(x,y)=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);};
  const g=typeof REG_RINGS!=="undefined"&&HAVE_REAL_REG?REG_RINGS[r.id]:null;
  if(g) g.o.forEach(ring=>ring.forEach(q=>add(q.x,q.y)));
  else if(r===TASH_CITY){ add(r.cx-r.rx,r.cy-r.ry); add(r.cx+r.rx,r.cy+r.ry); }
  else if(r.seeds) r.seeds.forEach(([a,b])=>{ const w=ll2w(a,b); add(w.x,w.y); });
  if(x1<x0) return null;
  return boxCache[r.id]={x0,y0,x1,y1};
}
function localLimit(){
  if(!state||!state.region||!state.user) return null;   // tanlangan har qanday viloyat (o'zimniki yoki boshqasi)
  const b=regionBox(regionById(state.region)); if(!b) return null;
  const px=(b.x1-b.x0)*.02, py=(b.y1-b.y0)*.02, x0=b.x0-px, x1=b.x1+px, y0=b.y0-py, y1=b.y1+py;
  return {x0,y0,x1,y1,w:Math.max(x1-x0,(y1-y0)*pxW/pxH)};   // eng uzoq ko'rinish: hudud ekranga aynan sig'adi
}
function clampView(){
  const L=localLimit();
  if(L&&view.w>L.w){ const mx=view.x+view.w/2,my=view.y+view.h/2; view.w=L.w; view.h=view.w*pxH/pxW; view.x=mx-view.w/2; view.y=my-view.h/2; }
  let cx=clamp(view.x+view.w/2,-1150000,420000),cy=clamp(view.y+view.h/2,-520000,540000);
  if(L){   // ko'rinish hudud ichida qoladi; hudud ekrandan kichik bo'lsa markazda turadi
    cx=(L.x1-L.x0<=view.w)?(L.x0+L.x1)/2:clamp(cx,L.x0+view.w/2,L.x1-view.w/2);
    cy=(L.y1-L.y0<=view.h)?(L.y0+L.y1)/2:clamp(cy,L.y0+view.h/2,L.y1-view.h/2);
  }
  view.x=cx-view.w/2;view.y=cy-view.h/2;
}
function toWorld(cx,cy){const r=svg.getBoundingClientRect();return {x:view.x+(cx-r.left)/pxW*view.w,y:view.y+(cy-r.top)/pxH*view.h};}
function applyView(){
  svg.setAttribute("viewBox",`${view.x} ${view.y} ${view.w} ${view.h}`); svgBase.setAttribute("viewBox",`${view.x} ${view.y} ${view.w} ${view.h}`);
  const k=kpx();
  const zl = k<6 ? "near" : k<13 ? "mid" : k<40 ? "far" : k<150 ? "region" : "country";
  const small = zl==="region"||zl==="country"; // uzoqda xizmat belgilari kichik nuqtaga aylanadi
  // belgilar o'lchami faqat masshtabga bog'liq: surishda (pan) qayta hisoblanmaydi — 1000+ element uchun tezlik
  // 2000+ element: belgilar qayta chizilganda hammasi bir marta, keyin faqat ko'rinib turganlari yangilanadi
  const all=markersDirty||k!==lastScaleK; lastScaleK=k;  // masshtab o'zgarsa hamma belgi yangilanadi: aks holda ko'rinmay turgan shahar nomlari eski (juda katta) o'lchamda qolib, yaqinlashganda ekranni to'sib qo'yadi
  if(markersDirty){ scaledEls=[...wrap.querySelectorAll("[data-sx]")].map(g=>({g,x:+g.dataset.sx,y:+g.dataset.sy,mk:g.classList.contains("mk"),s:-1})); markersDirty=false; }
  const mx=view.w*.2,my=view.h*.2,x0=view.x-mx,x1=view.x+view.w+mx,y0=view.y-my,y1=view.y+view.h+my;
  for(const e of scaledEls){
    if(!all&&(e.x<x0||e.x>x1||e.y<y0||e.y>y1)) continue;
    const s=small&&e.mk?k*(zl==="country"?.3:.42):k;
    if(e.s!==s){ e.s=s; e.g.setAttribute("transform",`translate(${e.x} ${e.y}) scale(${s})`); }
  }
  wrap.dataset.zoom = zl;
  layoutCityLabels(k,zl);
  queueReal(); syncReal();
  checkMarkerWindow(k);
  const rl=$("#gRoadLabels"); rl.setAttribute("font-size",(11*k).toFixed(1)); rl.setAttribute("stroke-width",(3.5*k).toFixed(1));
  const target=100*k, steps=[50,100,200,500,1000,2000,5000,10000,20000,50000,100000,200000,500000];
  const m=steps.filter(s=>s<=target).pop()||50;
  const sb=$("#scaleBar"), sw=(m/k).toFixed(0)+"px"; if(sb.style.width!==sw) sb.style.width=sw;
  const st=$("#scaleTxt"), stx=m>=1000?`${m/1000} km`:`${m} m`; if(st.textContent!==stx) st.textContent=stx;
}
/* Shahar nomlari ustma-ust tushmasligi uchun: hamma shahar nuqtasi doim ko'rinadi, nomi esa joy bo'lsa
   o'ngga, bo'lmasa chapga yoziladi; ikkalasida ham joy bo'lmasa yashiriladi (yaqinlashtirsa chiqadi).
   Joylashuv faqat masshtabga bog'liq, shuning uchun faqat k o'zgarganda hisoblanadi. */
let lblK=-1, lblSel="";
function layoutCityLabels(k,zl){
  if(zl==="near") return;   // yaqin ko'rinishda shahar nomlari yashirin
  const sel=state.region||"";
  if(k===lblK&&sel===lblSel) return; lblK=k; lblSel=sel;
  const boxes=[], hit=b=>boxes.some(o=>b[0]<o[2]&&b[2]>o[0]&&b[1]<o[3]&&b[3]>o[1]);
  const cities=[...document.querySelectorAll("#gCountry .city")].map(g=>({g,t:g.querySelector("text"),x:+g.dataset.sx/k,y:+g.dataset.sy/k,
    town:g.classList.contains("town"),cap:g.classList.contains("capital"),on:g.classList.contains("on")}));
  cities.forEach(c=>boxes.push([c.x-5,c.y-5,c.x+5,c.y+5]));
  // mamlakat va viloyat yozuvlari ham to'siq
  if(zl==="country"||zl==="region") document.querySelectorAll("#gCountry .ctry,#gCountry .rlbl").forEach(t=>{
    if(getComputedStyle(t).display==="none") return; const g=t.parentNode, w=t.textContent.length*8.5;
    const x=+g.dataset.sx/k, y=+g.dataset.sy/k; boxes.push([x-w/2,y-10,x+w/2,y+3]); });
  const rank=c=>c.cap?0:!c.town?1:c.on?2:3;
  cities.sort((a,b)=>rank(a)-rank(b));
  for(const c of cities){
    if(c.cap){ c.g.classList.remove("hidelbl"); const w=c.t.textContent.length*7.2; boxes.push([c.x-10-w,c.y-8,c.x-8,c.y+6]); continue; }
    const w=c.t.textContent.length*(c.town?(zl==="country"?5.8:6.4):7), R=[c.x+7,c.y-8,c.x+9+w,c.y+6], L=[c.x-9-w,c.y-8,c.x-7,c.y+6];
    let place=!hit(R)?"r":!hit(L)?"l":(c.town?"":"r"); // viloyat markazi nomi doim yoziladi
    c.g.classList.toggle("hidelbl",!place);
    if(place){ const left=place==="l"; c.t.setAttribute("x",left?-8:(c.town?8:9)); c.t.setAttribute("text-anchor",left?"end":"start"); boxes.push(left?L:R); }
  }
}
function flyTo(cx,cy,w,ms=420){
  cancelAnimationFrame(anim);
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){setCenter(cx,cy,w);applyView();return;}
  const s={cx:view.x+view.w/2,cy:view.y+view.h/2,w:view.w},t0=performance.now();
  const step=t=>{const p=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-p,3);setCenter(s.cx+(cx-s.cx)*e,s.cy+(cy-s.cy)*e,s.w*Math.pow(w/s.w,e));applyView();if(p<1)anim=requestAnimationFrame(step);};
  anim=requestAnimationFrame(step);
}
function fitPoints(pts,pad=1.35){
  if(!pts.length)return;
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const w=Math.max((maxX-minX)*pad,((maxY-minY)*pad)*pxW/pxH,2600);
  flyTo((minX+maxX)/2,(minY+maxY)/2,w);
}
function inView(p,m=.12){return p.x>view.x+view.w*m&&p.x<view.x+view.w*(1-m)&&p.y>view.y+view.h*m&&p.y<view.y+view.h*(1-m);}

