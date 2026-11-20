/* ---------- O'zbekiston (uzoqlashtirganda ko'rinadi) ---------- */
const ll2w=(lng,lat)=>({x:Math.round(ORIGIN.x+(lng-ORIGIN.lng)*83900),y:Math.round(ORIGIN.y+(ORIGIN.lat-lat)*111000)});
// Chegara soddalashtirilgan (Natural Earth 1:110m asosida), taxminiy
const UZB_OLD=[[66.52,37.36],[66.55,37.97],[65.22,38.40],[64.17,38.89],[63.52,39.36],[62.37,40.05],[61.88,41.08],[61.55,41.27],[60.47,41.22],[60.08,41.43],[59.98,42.22],[58.63,42.75],[57.79,42.17],[56.93,41.83],[57.10,41.32],[55.97,41.31],[55.93,45.00],[58.50,45.59],[58.69,45.50],[60.24,44.78],[61.06,44.41],[62.01,43.50],[63.19,43.65],[64.90,43.73],[66.10,43.00],[66.02,41.99],[66.51,41.99],[66.71,41.17],[67.99,41.14],[68.26,40.66],[68.63,40.67],[69.07,41.38],[70.39,42.08],[70.96,42.27],[71.26,42.17],[70.42,41.52],[71.16,41.14],[71.87,41.39],[73.06,40.87],[71.77,40.15],[71.01,40.24],[70.60,40.22],[70.46,40.50],[70.67,40.96],[69.33,40.73],[69.01,40.09],[68.54,39.53],[67.70,39.58],[67.44,39.14],[68.18,38.90],[68.39,38.16],[67.83,37.14],[67.08,37.36]].map(([a,b])=>ll2w(a,b));
/* Haqiqiy chegaralar (OpenStreetMap, 120 m aniqlikda soddalashtirilgan; fayl ichiga joylangan) */
const BOUNDS=NS_DATA.bounds||null;
const decRing=a=>{const p=[{x:a[0],y:a[1]}];for(let i=2;i<a.length;i+=2){const l=p[p.length-1];p.push({x:l.x+a[i],y:l.y+a[i+1]});}return p;};
const UZB_RINGS=BOUNDS?BOUNDS.country.map(decRing):[UZB_OLD];
const UZB=UZB_RINGS.slice().sort((a,b)=>b.length-a.length)[0];
const ringsD=rs=>rs.map(r=>`M${r.map(p=>`${p.x},${p.y}`).join("L")}Z`).join("");
const inRing=(r,p)=>{let ins=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)ins=!ins;}return ins;};
const CITIES=[
  ["Toshkent","Toshkent shahri",69.280,41.311],["Nurafshon","Toshkent viloyati",69.36,41.04],["Guliston","Sirdaryo viloyati",68.78,40.49],
  ["Jizzax","Jizzax viloyati",67.842,40.116],["Samarqand","Samarqand viloyati",66.976,39.654],["Qarshi","Qashqadaryo viloyati",65.789,38.861],
  ["Termiz","Surxondaryo viloyati",67.278,37.224],["Buxoro","Buxoro viloyati",64.421,39.768],["Navoiy","Navoiy viloyati",65.374,40.103],
  ["Urganch","Xorazm viloyati",60.63,41.55],["Nukus","Qoraqalpog'iston Respublikasi",59.61,42.46],["Namangan","Namangan viloyati",71.672,40.998],
  ["Andijon","Andijon viloyati",72.344,40.783],["Farg'ona","Farg'ona viloyati",71.786,40.384]
].map(([name,region,lng,lat],i)=>({id:"c"+i,name,region,capital:i===0,lat,lng,...ll2w(lng,lat)}));
const NEIGHBORS=[["Qozog'iston",65.5,45.2],["Turkmaniston",60.2,39.3],["Afg'oniston",66.5,36.8],["Tojikiston",70.3,38.6],["Qirg'iziston",73.6,41.9]];
function inUzb(p){return UZB_RINGS.some(r=>inRing(r,p));}
function nearestCity(p){let b=CITIES[0],bd=Infinity;for(const c of CITIES.concat(TOWNS)){const d=gdist(c,p);if(d<bd){bd=d;b=c;}}return {city:b,d:bd};}
/* Viloyatlar: har biriga bir nechta "urug'" nuqta beriladi, hudud = eng yaqin urug' (Voronoi), so'ng mamlakat chegarasi bilan kesiladi.
   Natija taxminiy, lekin viloyatlarning joylashuvi va qo'shnichiligi to'g'ri chiqadi. */
const RCOL=["#3b82f6","#16a34a","#8b5cf6","#ec4899","#0d9488","#ef4444"];
const REGIONS=[
  {id:"qq",name:"Qoraqalpog'iston Respublikasi",short:"Qoraqalpog'iston",center:"Nukus",c:0,lbl:[58.3,43.7],seeds:[[56.8,44.6],[56.8,42.6],[58.3,43.2],[58.6,44.8],[60.0,44.2],[61.0,43.4],[59.6,42.5],[60.3,42.6],[61.4,41.75]]},
  {id:"xo",name:"Xorazm viloyati",short:"Xorazm",center:"Urganch",c:3,small:true,lbl:[60.75,41.25],seeds:[[60.35,41.42],[60.7,41.6],[61.0,41.3]]},
  {id:"nv",name:"Navoiy viloyati",short:"Navoiy",center:"Navoiy",c:1,lbl:[64.0,42.4],seeds:[[62.6,42.9],[63.8,43.0],[65.0,43.1],[63.2,41.9],[64.6,41.9],[65.6,41.6],[65.4,40.5],[66.0,40.8]]},
  {id:"bx",name:"Buxoro viloyati",short:"Buxoro",center:"Buxoro",c:2,lbl:[63.2,40.45],seeds:[[64.4,39.75],[63.6,39.6],[63.2,40.3],[62.4,40.9],[64.1,40.4]]},
  {id:"sm",name:"Samarqand viloyati",short:"Samarqand",center:"Samarqand",c:4,small:true,lbl:[66.35,40.0],seeds:[[66.95,39.6],[66.2,39.85],[66.6,40.15],[67.4,39.4]]},
  {id:"jz",name:"Jizzax viloyati",short:"Jizzax",center:"Jizzax",c:2,small:true,lbl:[67.5,40.55],seeds:[[67.85,40.1],[67.3,40.6],[68.3,39.95],[67.9,40.7]]},
  {id:"sd",name:"Sirdaryo viloyati",short:"Sirdaryo",center:"Guliston",c:3,small:true,lbl:[68.62,40.68],seeds:[[68.8,40.45],[68.55,40.85],[68.8,40.2]]},
  {id:"tv",name:"Toshkent viloyati",short:"Toshkent vil.",center:"Nurafshon",c:0,small:true,lbl:[70.1,41.3],seeds:[[69.3,40.45],[69.0,41.15],[69.6,41.0],[70.15,41.0],[69.7,41.45],[70.1,41.7],[70.5,41.9]]},
  {id:"nm",name:"Namangan viloyati",short:"Namangan",center:"Namangan",c:1,small:true,lbl:[71.25,41.2],seeds:[[71.65,41.05],[71.1,40.95],[71.95,41.15]]},
  {id:"an",name:"Andijon viloyati",short:"Andijon",center:"Andijon",c:4,small:true,lbl:[72.75,40.95],seeds:[[72.35,40.78],[72.8,40.75]]},
  {id:"fg",name:"Farg'ona viloyati",short:"Farg'ona",center:"Farg'ona",c:2,small:true,lbl:[71.2,40.25],seeds:[[71.75,40.4],[71.0,40.5],[71.35,40.35],[72.05,40.45]]},
  {id:"qd",name:"Qashqadaryo viloyati",short:"Qashqadaryo",center:"Qarshi",c:0,lbl:[65.5,38.32],seeds:[[65.8,38.85],[66.6,38.95],[65.0,39.1],[66.3,38.4],[65.3,38.55],[64.6,38.9]]},
  {id:"sx",name:"Surxondaryo viloyati",short:"Surxondaryo",center:"Termiz",c:3,lbl:[67.75,38.15],seeds:[[67.3,37.4],[67.0,37.8],[67.6,38.1],[67.9,38.5],[67.9,37.9]]}
];
const TASH_CITY={id:"ts",name:"Toshkent shahri",short:"Toshkent sh.",center:"Toshkent",c:2,cx:12000,cy:9300,rx:12500,ry:9500};
const SEEDS=[]; REGIONS.forEach(r=>r.seeds.forEach(([lng,lat])=>SEEDS.push({...ll2w(lng,lat),r})));
function clipHalf(poly,a,b){
  const nx=b.x-a.x, ny=b.y-a.y, c=((a.x+b.x)/2)*nx+((a.y+b.y)/2)*ny, f=p=>p.x*nx+p.y*ny-c, out=[];
  for(let i=0;i<poly.length;i++){
    const P=poly[i], Q=poly[(i+1)%poly.length], fp=f(P), fq=f(Q);
    if(fp<=0) out.push(P);
    if((fp<0&&fq>0)||(fp>0&&fq<0)){const t=fp/(fp-fq);out.push({x:P.x+(Q.x-P.x)*t,y:P.y+(Q.y-P.y)*t});}
  }
  return out;
}
const CELLS=(()=>{
  const xs=UZB.map(p=>p.x), ys=UZB.map(p=>p.y);
  const x0=Math.min(...xs)-200000, x1=Math.max(...xs)+200000, y0=Math.min(...ys)-200000, y1=Math.max(...ys)+200000;
  return SEEDS.map((s,i)=>{let poly=[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
    SEEDS.forEach((o,j)=>{ if(j!==i&&poly.length) poly=clipHalf(poly,s,o); }); return poly;});
})();
const RING_ID={"Navoiy Region":"nv","Xorazm Region":"xo","Bukhara Region":"bx","Surxondaryo Region":"sx","Samarqand Region":"sm","Jizzakh Region":"jz","Qashqadaryo Region":"qd","Namangan Region":"nm","Fergana Region":"fg","Tashkent Region":"tv","Sirdaryo Region":"sd","Tashkent":"ts","Andijan Region":"an","Republic of Karakalpakstan":"qq"};
const REG_RINGS={}; // id -> {o:[halqalar], i:[ichki halqalar]}
if(BOUNDS) Object.values(BOUNDS.regions).forEach(v=>{const id=RING_ID[v.alt[0]]; if(id) REG_RINGS[id]={o:v.o.map(decRing),i:v.i.map(decRing)};});
const HAVE_REAL_REG=Object.keys(REG_RINGS).length>=13;
const polyD=poly=>poly.length?`M${poly.map(p=>`${Math.round(p.x)},${Math.round(p.y)}`).join("L")}Z`:"";
const ellD=e=>`M${e.cx-e.rx},${e.cy}a${e.rx},${e.ry} 0 1 0 ${2*e.rx},0a${e.rx},${e.ry} 0 1 0 ${-2*e.rx},0Z`;
const regionD=r=>HAVE_REAL_REG&&REG_RINGS[r.id]?ringsD(REG_RINGS[r.id].o)+ringsD(REG_RINGS[r.id].i):r===TASH_CITY?ellD(r):SEEDS.map((s,i)=>s.r===r?polyD(CELLS[i]):"").join("")+(r.id==="tv"?ellD(TASH_CITY):""); // Toshkent viloyatidan shahar "teshik" qilib chiqariladi (evenodd)
function regionAt(p){
  if(HAVE_REAL_REG){
    for(const id in REG_RINGS){const g=REG_RINGS[id]; if(g.o.some(r=>inRing(r,p))&&!g.i.some(r=>inRing(r,p))) return regionById(id);}
  }
  const e=TASH_CITY; if(((p.x-e.cx)/e.rx)**2+((p.y-e.cy)/e.ry)**2<=1) return e;
  let b=SEEDS[0],bd=Infinity; for(const s of SEEDS){const d=dist(s,p);if(d<bd){bd=d;b=s;}} return b.r;
}
const realBorderD=()=>Object.values(REG_RINGS).map(g=>ringsD(g.o)+ringsD(g.i)).join("");
function regionsSvg(){
  let fill=REGIONS.map(r=>`<path d="${regionD(r)}" style="fill:${RCOL[r.c]};stroke:${RCOL[r.c]}"/>`).join("");
  fill+=`<path class="tsfill" d="${regionD(TASH_CITY)}" style="fill:${RCOL[TASH_CITY.c]};stroke:${RCOL[TASH_CITY.c]}"/>`;
  let bd="";
  CELLS.forEach((poly,i)=>{
    for(let k=0;k<poly.length;k++){
      const P=poly[k], Q=poly[(k+1)%poly.length], m={x:(P.x+Q.x)/2,y:(P.y+Q.y)/2}, di=dist(m,SEEDS[i]);
      let bj=-1,bdj=Infinity; SEEDS.forEach((s,j)=>{ if(j===i)return; const d=dist(m,s); if(d<bdj){bdj=d;bj=j;} });
      if(bj>i&&Math.abs(bdj-di)<5&&SEEDS[bj].r!==SEEDS[i].r) bd+=`M${Math.round(P.x)},${Math.round(P.y)}L${Math.round(Q.x)},${Math.round(Q.y)}`;
    }
  });
  if(HAVE_REAL_REG) bd="";
  return `<g class="regions" clip-path="url(#uzbClip)"><g class="rfill">${fill}</g><path class="rborder" d="${bd}"/><path class="rborder" d="${HAVE_REAL_REG?realBorderD():ellD(TASH_CITY)}"/><path class="rsel" id="rsel" d=""/></g>`;
}
function selectRegion(r){ const el=document.getElementById("rsel"); if(el) el.setAttribute("d",r?regionD(r):"");
  document.querySelectorAll(".city.town").forEach(t=>t.classList.toggle("on",!!r&&t.dataset.rid===r.id)); }
const regionById=id=>REGIONS.find(r=>r.id===id)||TASH_CITY;
function curRegion(){ return state.region?regionById(state.region):null; }
const locality=s=>(s.region||"ts")==="ts"?`${s.district} tumani, Toshkent`:`${s.district}, ${regionById(s.region).name}`;

