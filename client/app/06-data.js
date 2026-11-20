/* ---------- ma'lumotlarni yaratish ---------- */
const usedNames={};
function uniqueName(cat,scope="ts"){
  const u=usedNames[scope]||(usedNames[scope]={});
  const pool=NAMES[cat].filter(n=>!u[n]);
  const base = pool.length ? pick(pool) : pick(NAMES[cat]);
  u[base]=(u[base]||0)+1;
  return u[base]>1 ? `${base} (${u[base]}-filial)` : base;
}
function distFrom(avg){
  const w=[1,2,3,4,5].map(s=>Math.exp(-((s-avg)**2)/1.1)+0.03);
  const t=w.reduce((a,b)=>a+b,0);
  return w.map(x=>x/t);
}
function makeReviews(cat,avg){
  const n=3+Math.floor(rnd()*2), out=[], names=[...PEOPLE];
  const ages=Array.from({length:n},()=>Math.floor(rnd()*120)).sort((a,b)=>a-b);
  for(let i=0;i<n;i++){
    const roll=rnd(), posP=clamp((avg-3)/2,.2,.92);
    const tone = i===0 || roll<posP ? "pos" : roll<posP+(1-posP)*.6 ? "mid" : "neg";
    const stars = tone==="pos" ? (rnd()<.7?5:4) : tone==="mid" ? (rnd()<.5?4:3) : (rnd()<.5?2:1);
    const ni=Math.floor(rnd()*names.length);
    out.push({name:names.splice(ni,1)[0],stars,text:pick(REVIEWS[cat][tone]),ago:ages[i]});
  }
  return out;
}
let sid=0;
function makeService(cat,x,y,scope="ts"){
  const avg=Math.round(range(3.5,4.95)*10)/10;
  const s={id:"s"+(++sid),cat,name:uniqueName(cat,scope),region:"ts",x:Math.round(x),y:Math.round(y),
    phone:`+998 ${pick(["90","91","93","94","95","97","99","33","88"])} 000 ${String(Math.floor(rnd()*100)).padStart(2,"0")} ${String(Math.floor(rnd()*100)).padStart(2,"0")}`,
    ...HOURS[cat](),rating:avg,count:4+Math.floor(Math.pow(rnd(),1.6)*240),
    desc:pick(DESCS[cat]),
    prices:PRICES[cat].map(([n,a,b])=>[n,Math.round(range(a,b)/1000)*1000])};
  s.dist=distFrom(avg);
  s.reviews=makeReviews(cat,avg);
  s.district=nearestDistrict(s.x,s.y);
  s.address=addressFor(s.x,s.y);
  return s;
}
const services=[];
const USER0={x:12350,y:9450};
for(let i=0;i<12;i++){
  const ang=rnd()*Math.PI*2, r=150+Math.sqrt(rnd())*1100;
  services.push(makeService(CAT_KEYS[i%6],USER0.x+Math.cos(ang)*r,USER0.y+Math.sin(ang)*r));
}
DISTRICTS.forEach((d,di)=>{
  const n=["Yunusobod","Mirobod","Yakkasaroy","Chilonzor","Shayxontohur"].includes(d.name)?9:6;
  for(let i=0;i<n;i++){
    const ang=rnd()*Math.PI*2, r=300+Math.sqrt(rnd())*2000;
    services.push(makeService(CAT_KEYS[(i+di)%6],clamp(d.x+Math.cos(ang)*r,500,W-500),clamp(d.y+Math.sin(ang)*r*.85,500,H-500)));
  }
});

const places=[];
let pid=0;
function addPlace(t,name,x,y,desc,district){places.push({id:"p"+(++pid),t,name,x:Math.round(x),y:Math.round(y),desc,region:"ts",district:district||nearestDistrict(x,y)});}
const inRegion=p=>!state.region||(p.region||"ts")===state.region;
[
  ["airport","Toshkent xalqaro aeroporti",13300,14300,"Shaharning asosiy aeroporti: ichki va xalqaro reyslar. Shahar markazidan taxminan 6 km janubda."],
  ["park","Amir Temur xiyoboni",12000,9000,"Shahar markazidagi xiyobon: sayr yo'laklari, favvoralar, o'rindiqlar."],
  ["tour","Mustaqillik maydoni",11250,8650,"Shaharning bosh maydoni, bayram tadbirlari shu yerda o'tadi."],
  ["museum","Temuriylar tarixi davlat muzeyi",12350,8780,"Amir Temur va temuriylar davri tarixiga bag'ishlangan muzey."],
  ["museum","O'zbekiston tarixi davlat muzeyi",11800,8300,"Qadimgi davrdan bugungacha bo'lgan tarixiy ekspozitsiyalar."],
  ["museum","Amaliy san'at muzeyi",13200,10050,"Kashtachilik, kulolchilik va milliy hunarmandchilik namunalari."],
  ["tour","Toshkent teleminorasi",12350,5400,"Balandligi 375 m bo'lgan minora, kuzatuv maydonchasi bor."],
  ["tour","Hazrati Imom majmuasi",9300,6500,"Eski shahardagi tarixiy-me'moriy majmua."],
  ["tour","Chorsu bozori",9850,7650,"Gumbazli an'anaviy bozor: ziravorlar, non, quruq mevalar."],
  ["tour","Alisher Navoiy nomidagi teatr",11500,9350,"Opera va balet teatri, shahar markazida."],
  ["park","Yapon bog'i",12900,5750,"Yapon uslubidagi bog': ko'l, ko'prikchalar, toshli yo'laklar."],
  ["park","Botanika bog'i",13900,4900,"Ilmiy botanika bog'i, mingdan ortiq o'simlik turi."],
  ["park","Ekopark",13250,9700,"Markazdagi yashil hudud, velosiped yo'laklari bilan."],
  ["park","Bobur bog'i",13700,11300,"Katta bog': ko'l, bolalar maydonchalari, sayr yo'laklari."],
  ["park","Navro'z bog'i",10500,10600,"Dam olish bog'i, tadbirlar uchun ochiq maydon."],
  ["gov","Toshkent shahar hokimligi",11650,9100,"Shahar ijroiya hokimiyati organi. Fuqarolarni qabul qilish kunlari belgilangan."],
  ["gov","Davlat xizmatlari markazi",14100,10400,"Pasport, ma'lumotnoma va boshqa davlat xizmatlarini bir joyda olish."]
].forEach(p=>addPlace(...p));
DISTRICTS.forEach(d=>{
  addPlace("gov",`${d.name} tumani hokimligi`,d.x+range(-250,250),d.y+range(-250,250),"Tuman hokimligi: murojaatlar, fuqarolarni qabul qilish.");
  const a1=rnd()*6.28, a2=rnd()*6.28;
  addPlace("school",`${10+Math.floor(rnd()*300)}-umumta'lim maktabi`,d.x+Math.cos(a1)*range(700,1600),d.y+Math.sin(a1)*range(700,1400),"Davlat umumta'lim maktabi, 1–11-sinflar.");
  addPlace("kinder",`${100+Math.floor(rnd()*500)}-son DMTT (bog'cha)`,d.x+Math.cos(a2)*range(600,1500),d.y+Math.sin(a2)*range(600,1300),"Davlat maktabgacha ta'lim tashkiloti, 3–7 yoshli bolalar uchun.");
});

/* ---------- foydalanuvchi sharhlari (shu brauzerda saqlanadi) ---------- */
const STORE_REV="nearby-proto-reviews-v1";
const myReviews = LS.get(STORE_REV, {});
const byId = id => services.find(s=>s.id===id);
function applyReview(s,r){ s.rating = s.count ? (s.rating*s.count + r.stars)/(s.count+1) : r.stars; s.count++; s.reviews.unshift(r); }
/* Boshqa foydalanuvchilarning sharhlari serverdan keladi; o'zimizniki (rid bir xil) ikki marta sanalmaydi */
const serverReviews = NS_DATA.reviews || {};
function reviewsFor(id){
  const mine = myReviews[id] || [], own = new Set(mine.map(r=>r.rid).filter(Boolean));
  return (serverReviews[id] || []).filter(r=>!own.has(r.rid)).concat(mine);
}
services.forEach(s=>reviewsFor(s.id).forEach(r=>applyReview(s,r)));

