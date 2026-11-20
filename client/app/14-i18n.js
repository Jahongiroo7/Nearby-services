/* ---------- tillar: O'zbekcha (asl), English, Русский, Français, Deutsch ----------
   Sahifadagi har bir matn (va placeholder/title/aria-label) asl o'zbekcha ko'rinishida saqlanadi va lug'at bo'yicha almashtiriladi.
   Lug'atda topilmagan matn (xizmat nomi, ko'cha nomi va h.k.) o'zgarmaydi. */
const LANG_KEY="nearby-proto-lang";
let lang=["uz","en","ru","fr","de"].includes(SYS.lang)?SYS.lang:"uz"; try{ const l=localStorage.getItem(LANG_KEY); if(["uz","en","ru","fr","de"].includes(l)) lang=l; }catch(e){}
const LI={en:1,ru:2,fr:3,de:4};
const DICT={en:new Map(),ru:new Map(),fr:new Map(),de:new Map()}, RULES=[], tcache={}, MISS=new Set();
let EXO={};
try{ const D=NS_DATA.i18n||{}; EXO=D.x||{}; for(const e of (D.e||[])) for(const L in LI) if(e[LI[L]]!==undefined&&e[LI[L]]!=="") DICT[L].set(e[0],e[LI[L]]); }catch(e){}
const UNIT={
  en:{min:"min",h:"h",km:"km",m:"m",sum:"UZS",dec:"."},
  ru:{min:"мин",h:"ч",km:"км",m:"м",sum:"сум",dec:","},
  fr:{min:"min",h:"h",km:"km",m:"m",sum:"UZS",dec:","},
  de:{min:"Min.",h:"Std.",km:"km",m:"m",sum:"UZS",dec:","}
};
function unitsFix(s){
  const U=UNIT[lang]; if(!U||!/\d/.test(s)) return s;
  return s.replace(/(\d) ?daq\b/g,"$1 "+U.min).replace(/(\d) ?soat\b/g,"$1 "+U.h)
          .replace(/(\d) km\b/g,"$1 "+U.km).replace(/(\d) m\b/g,"$1 "+U.m).replace(/(\d) so'm\b/g,"$1 "+U.sum)
          .replace(/(\d),(\d)/g,(m0,a,b)=>a+U.dec+b);
}
function plRu(n,a,b,c){ n=Math.abs(n)%100; const d=n%10; return n>10&&n<20?c:d===1?a:d>=2&&d<=4?b:c; }
let BIZ=null;
const isBizName=s=>{ if(!BIZ) BIZ=new Set([...services.map(x=>x.name),...places.map(x=>x.name)]); return BIZ.has(s); };
function trCore(s){
  const d=DICT[lang]; if(d.has(s)) return d.get(s);
  const ex=EXO[s]; if(ex) return ex[LI[lang]-1];
  if(lang==="ru"&&isBizName(s)) return uz2ru(s);   // korxona va joy nomlari ruscha yoziladi (kirillcha)
  for(const r of RULES){ const m=r[0].exec(s); if(m){ const o=r[1](m,lang); if(o!=null) return unitsFix(o); } }
  if(s.includes(" · ")) return s.split(" · ").map(trText).join(" · ");
  if(s.includes(", ")&&!/^[\d.,\s+-]+$/.test(s)) return s.split(", ").map(trText).join(", ");
  return unitsFix(s);
}
function trText(s){
  if(lang==="uz") return s;
  const c=tcache[lang]||(tcache[lang]=new Map()); let r=c.get(s); if(r!==undefined) return r;
  r=trCore(s); c.set(s,r);
  if(r===s&&/[A-Za-z']{3,}/.test(s)&&!/^[\d\s.,:;·+\-–—/()%°±~'’"№#★✓|]+$/.test(s)) MISS.add(s);
  return r;
}

/* ----- nomlar: ekzonim yoki (ruscha uchun) lotindan kirillga ----- */
function uz2ru(s){
  const pairs=[["O'","У"],["o'","у"],["G'","Г"],["g'","г"],["Sh","Ш"],["sh","ш"],["Ch","Ч"],["ch","ч"],["Yo'","Ю"],["yo'","ю"],["Yu","Ю"],["yu","ю"],["Ya","Я"],["ya","я"],["Ye","Е"],["ye","е"],["Yo","Ё"],["yo","ё"],["Ng","Нг"],["ng","нг"]];
  const L={a:"а",b:"б",d:"д",e:"е",f:"ф",g:"г",h:"х",i:"и",j:"дж",k:"к",l:"л",m:"м",n:"н",o:"о",p:"п",q:"к",r:"р",s:"с",t:"т",u:"у",v:"в",x:"х",y:"й",z:"з"};
  s=s.replace(/obod\b/g,"абад").replace(/Obod\b/g,"Абад");
  let out="",i=0;
  while(i<s.length){
    let hit=false;
    for(const [a,b] of pairs){ if(s.startsWith(a,i)){ out+=b; i+=a.length; hit=true; break; } }
    if(hit) continue;
    const c=s[i], lc=c.toLowerCase();
    if(c==="'"||c==="’"||c==="ʻ"||c==="ʼ"||c==="`"){ i++; continue; }
    if(L[lc]!==undefined){ let t=L[lc]; if(lc==="e"&&(i===0||/[\s-]/.test(s[i-1]))) t="э"; out+=c!==lc?t[0].toUpperCase()+t.slice(1):t; }
    else out+=c;
    i++;
  }
  return out;
}
function nm(x){ const e=EXO[x]; if(e) return e[LI[lang]-1]; return lang==="ru"?uz2ru(x):x; }
const DAYTOK={en:{Du:"Mon",Se:"Tue",Ch:"Wed",Pa:"Thu",Ju:"Fri",Sh:"Sat",Ya:"Sun"},ru:{Du:"Пн",Se:"Вт",Ch:"Ср",Pa:"Чт",Ju:"Пт",Sh:"Сб",Ya:"Вс"},fr:{Du:"lun.",Se:"mar.",Ch:"mer.",Pa:"jeu.",Ju:"ven.",Sh:"sam.",Ya:"dim."},de:{Du:"Mo",Se:"Di",Ch:"Mi",Pa:"Do",Ju:"Fr",Sh:"Sa",Ya:"So"}};
const DAYFULL={dushanba:["Monday","в понедельник","lundi","Montag"],seshanba:["Tuesday","во вторник","mardi","Dienstag"],chorshanba:["Wednesday","в среду","mercredi","Mittwoch"],payshanba:["Thursday","в четверг","jeudi","Donnerstag"],juma:["Friday","в пятницу","vendredi","Freitag"],shanba:["Saturday","в субботу","samedi","Samstag"],yakshanba:["Sunday","в воскресенье","dimanche","Sonntag"]};
const dayTr=t=>t.replace(/\b(Du|Se|Ch|Pa|Ju|Sh|Ya)\b/g,x=>DAYTOK[lang][x]);
const R=(re,f)=>RULES.push([re,(m,L)=>{ const o=f(m); return o?o[L]:null; }]);
const RD=(re,f)=>R(re,m=>/ · /.test(m[1])?null:f(m));   // ' · ' bor satr oldin bo'laklarga bo'linadi
const NR=(re,f)=>R(re,m=>/, | · /.test(m[1])?null:f(nm(m[1]),m));   // vergul/nuqta bor satr bo'laklarga bo'linadi, butun nom sifatida o'qilmaydi
const s1=n=>n==="1";
/* sonlar */
R(/^(\d+) ta xizmat$/,m=>({en:`${m[1]} service${s1(m[1])?"":"s"}`,ru:`${m[1]} ${plRu(+m[1],"услуга","услуги","услуг")}`,fr:`${m[1]} service${+m[1]>1?"s":""}`,de:`${m[1]} ${s1(m[1])?"Dienst":"Dienste"}`}));
R(/^(\d+) ta baho$/,m=>({en:`${m[1]} rating${s1(m[1])?"":"s"}`,ru:`${m[1]} ${plRu(+m[1],"оценка","оценки","оценок")}`,fr:`${m[1]} note${+m[1]>1?"s":""}`,de:`${m[1]} Bewertung${s1(m[1])?"":"en"}`}));
R(/^(\d+) ta$/,m=>({en:m[1],ru:m[1],fr:m[1],de:m[1]}));
R(/^Yana (\d+) tasini ko'rsatish · jami (\d+)$/,m=>({en:`Show ${m[1]} more · ${m[2]} in total`,ru:`Показать ещё ${m[1]} · всего ${m[2]}`,fr:`Afficher ${m[1]} de plus · ${m[2]} au total`,de:`${m[1]} weitere anzeigen · insgesamt ${m[2]}`}));
R(/^(\d+) km radiusda$/,m=>({en:`within ${m[1]} km`,ru:`в радиусе ${m[1]} км`,fr:`dans un rayon de ${m[1]} km`,de:`im Umkreis von ${m[1]} km`}));
RD(/^reyting (.+)$/,m=>({en:`rating ${m[1]}`,ru:`рейтинг ${m[1]}`,fr:`note ${m[1]}`,de:`Bewertung ${m[1]}`}));
R(/^(\d+) kun oldin$/,m=>({en:`${m[1]} day${s1(m[1])?"":"s"} ago`,ru:`${m[1]} ${plRu(+m[1],"день","дня","дней")} назад`,fr:`il y a ${m[1]} jour${+m[1]>1?"s":""}`,de:`vor ${m[1]} Tag${s1(m[1])?"":"en"}`}));
R(/^(\d+) hafta oldin$/,m=>({en:`${m[1]} week${s1(m[1])?"":"s"} ago`,ru:`${m[1]} ${plRu(+m[1],"неделю","недели","недель")} назад`,fr:`il y a ${m[1]} semaine${+m[1]>1?"s":""}`,de:`vor ${m[1]} Woche${s1(m[1])?"":"n"}`}));
R(/^(\d+) oy oldin$/,m=>({en:`${m[1]} month${s1(m[1])?"":"s"} ago`,ru:`${m[1]} ${plRu(+m[1],"месяц","месяца","месяцев")} назад`,fr:`il y a ${m[1]} mois`,de:`vor ${m[1]} Monat${s1(m[1])?"":"en"}`}));
/* holat va jadval */
R(/^Ochiq · (\d\d:\d\d) gacha$/,m=>({en:`Open until ${m[1]}`,ru:`Открыто до ${m[1]}`,fr:`Ouvert jusqu'à ${m[1]}`,de:`Geöffnet bis ${m[1]}`}));
R(/^Yopiq · (\d\d:\d\d) da ochiladi$/,m=>({en:`Closed · opens at ${m[1]}`,ru:`Закрыто · откроется в ${m[1]}`,fr:`Fermé · ouvre à ${m[1]}`,de:`Geschlossen · öffnet um ${m[1]}`}));
R(/^Yopiq · ertaga (\d\d:\d\d) da$/,m=>({en:`Closed · opens tomorrow at ${m[1]}`,ru:`Закрыто · откроется завтра в ${m[1]}`,fr:`Fermé · ouvre demain à ${m[1]}`,de:`Geschlossen · öffnet morgen um ${m[1]}`}));
R(/^Yopiq · (dushanba|seshanba|chorshanba|payshanba|juma|shanba|yakshanba) (\d\d:\d\d) da$/,m=>{const d=DAYFULL[m[1]];return {en:`Closed · opens ${d[0]} at ${m[2]}`,ru:`Закрыто · откроется ${d[1]} в ${m[2]}`,fr:`Fermé · ouvre ${d[2]} à ${m[2]}`,de:`Geschlossen · öffnet ${d[3]} um ${m[2]}`};});
R(/^(Har kuni|(?:Du|Se|Ch|Pa|Ju|Sh|Ya)(?:–(?:Du|Se|Ch|Pa|Ju|Sh|Ya))?(?:, (?:Du|Se|Ch|Pa|Ju|Sh|Ya))*), (\d\d:\d\d)–(\d\d:\d\d)$/,m=>{const d=m[1]==="Har kuni"?trText("Har kuni"):dayTr(m[1]),t=`${m[2]}–${m[3]}`;return {en:`${d}, ${t}`,ru:`${d}, ${t}`,fr:`${d}, ${t}`,de:`${d}, ${t}`};});
/* masofa */
RD(/^To'g'ri chiziqda (.+)$/,m=>({en:`Straight line: ${m[1]}`,ru:`По прямой: ${m[1]}`,fr:`À vol d'oiseau : ${m[1]}`,de:`Luftlinie: ${m[1]}`}));
RD(/^(.+) to'g'ri chiziqda$/,m=>({en:`${m[1]} in a straight line`,ru:`${m[1]} по прямой`,fr:`${m[1]} à vol d'oiseau`,de:`${m[1]} Luftlinie`}));
RD(/^yo'l ~(.+)$/,m=>({en:`road ~${m[1]}`,ru:`по дороге ~${m[1]}`,fr:`route ~${m[1]}`,de:`Straße ~${m[1]}`}));
RD(/^mashinada ~(.+)$/,m=>({en:`by car ~${m[1]}`,ru:`на машине ~${m[1]}`,fr:`en voiture ~${m[1]}`,de:`mit dem Auto ~${m[1]}`}));
RD(/^piyoda ~(.+)$/,m=>({en:`on foot ~${m[1]}`,ru:`пешком ~${m[1]}`,fr:`à pied ~${m[1]}`,de:`zu Fuß ~${m[1]}`}));
RD(/^sizdan (.+)$/,m=>({en:`${m[1]} from you`,ru:`${m[1]} от вас`,fr:`${m[1]} de vous`,de:`${m[1]} von Ihnen`}));
R(/^Markazi: (.+)$/,m=>{const x=trText(m[1]);return {en:`Center: ${x}`,ru:`Центр: ${x}`,fr:`Centre : ${x}`,de:`Zentrum: ${x}`};});
R(/^Eng yaqin O'zbekiston shahri: (.+)$/,m=>{const x=trText(m[1]);return {en:`Nearest city in Uzbekistan: ${x}`,ru:`Ближайший город Узбекистана: ${x}`,fr:`Ville ouzbèke la plus proche : ${x}`,de:`Nächste usbekische Stadt: ${x}`};});
R(/^, (.+) narida \(mashinada ~(.+)\)\.$/,m=>({en:`, ${m[1]} away (by car ~${m[2]}).`,ru:`, ${m[1]} отсюда (на машине ~${m[2]}).`,fr:`, à ${m[1]} (en voiture ~${m[2]}).`,de:`, ${m[1]} entfernt (mit dem Auto ~${m[2]}).`}));
RD(/^(.+) ichida xizmat topilmadi\.$/,m=>({en:`No services within ${m[1]}.`,ru:`В пределах ${m[1]} услуг нет.`,fr:`Aucun service à moins de ${m[1]}.`,de:`Keine Dienste innerhalb von ${m[1]}.`}));
RD(/^(.+) ichida jamoat joyi yo'q\.$/,m=>({en:`No public places within ${m[1]}.`,ru:`В пределах ${m[1]} общественных мест нет.`,fr:`Aucun lieu public à moins de ${m[1]}.`,de:`Keine öffentlichen Orte innerhalb von ${m[1]}.`}));
RD(/^(.+) ichida$/,m=>({en:`within ${m[1]}`,ru:`в пределах ${m[1]}`,fr:`à moins de ${m[1]}`,de:`innerhalb von ${m[1]}`}));
RD(/^Nusxalandi: (.+)$/,m=>({en:`Copied: ${m[1]}`,ru:`Скопировано: ${m[1]}`,fr:`Copié : ${m[1]}`,de:`Kopiert: ${m[1]}`}));
R(/^Hisoblash nuqtasi: (.+)$/,m=>({en:`Distance origin: ${m[1]}`,ru:`Точка отсчёта: ${m[1]}`,fr:`Point de départ : ${m[1]}`,de:`Ausgangspunkt: ${m[1]}`}));
/* joy va muassasa nomlari */
NR(/^(.+) tumani hokimligi$/,N=>({en:`${N} District Administration`,ru:`Хокимият района ${N}`,fr:`Mairie du district de ${N}`,de:`Bezirksverwaltung ${N}`}));
NR(/^(.+) viloyati hokimligi$/,N=>({en:`${N} Regional Administration`,ru:`Областной хокимият: ${N}`,fr:`Administration régionale de ${N}`,de:`Gebietsverwaltung ${N}`}));
NR(/^(.+) shahar hokimligi$/,N=>({en:`${N} City Administration`,ru:`Городской хокимият: ${N}`,fr:`Mairie de ${N}`,de:`Stadtverwaltung ${N}`}));
NR(/^(.+) hokimligi$/,N=>({en:`${N} Administration`,ru:`Хокимият: ${N}`,fr:`Administration de ${N}`,de:`Verwaltung ${N}`}));
R(/^(\d+)-umumta'lim maktabi$/,m=>({en:`School No. ${m[1]}`,ru:`Школа №${m[1]}`,fr:`École n° ${m[1]}`,de:`Schule Nr. ${m[1]}`}));
R(/^(\d+)-son DMTT \(bog'cha\)$/,m=>({en:`Kindergarten No. ${m[1]}`,ru:`Детский сад №${m[1]}`,fr:`Maternelle n° ${m[1]}`,de:`Kindergarten Nr. ${m[1]}`}));
NR(/^(.+) markaziy bog'i$/,N=>({en:`${N} Central Park`,ru:`Центральный парк: ${N}`,fr:`Parc central de ${N}`,de:`Zentralpark ${N}`}));
NR(/^(.+) istirohat bog'i$/,N=>({en:`${N} Recreation Park`,ru:`Парк отдыха: ${N}`,fr:`Parc de loisirs de ${N}`,de:`Erholungspark ${N}`}));
NR(/^(.+) aeroporti$/,N=>({en:`${N} Airport`,ru:`Аэропорт: ${N}`,fr:`Aéroport de ${N}`,de:`Flughafen ${N}`}));
NR(/^(.+) viloyat o'lkashunoslik muzeyi$/,N=>({en:`${N} Regional Museum`,ru:`Краеведческий музей: ${N}`,fr:`Musée régional de ${N}`,de:`Regionalmuseum ${N}`}));
NR(/^(.+) tarix muzeyi$/,N=>({en:`${N} History Museum`,ru:`Исторический музей: ${N}`,fr:`Musée d'histoire de ${N}`,de:`Geschichtsmuseum ${N}`}));
NR(/^(.+) tumani$/,N=>({en:`${N} District`,ru:`район ${N}`,fr:`arrondissement de ${N}`,de:`Bezirk ${N}`}));
NR(/^(.+) shahriga$/,N=>({en:`To ${N}`,ru:`В ${N}`,fr:`Vers ${N}`,de:`Nach ${N}`}));
NR(/^(.+) shahri$/,N=>({en:`${N} city`,ru:`город ${N}`,fr:`ville de ${N}`,de:`Stadt ${N}`}));
NR(/^(.+) viloyati$/,N=>({en:`${N} Region`,ru:`${N}ская область`,fr:`région de ${N}`,de:`Gebiet ${N}`}));
/* manzillar va ko'chalar */
R(/^(\d+)-uy$/,m=>({en:`house ${m[1]}`,ru:`д. ${m[1]}`,fr:`n° ${m[1]}`,de:`Haus ${m[1]}`}));
NR(/^(.+) MFY$/,N=>({en:`${N} neighbourhood`,ru:`махалля ${N}`,fr:`quartier ${N}`,de:`Viertel ${N}`}));
R(/^(.+?) (\d+)-o'tish ko'chasi$/,m=>{const N=nm(m[1]);return {en:`${N} Lane ${m[2]}`,ru:`${N}, проезд ${m[2]}`,fr:`Passage ${m[2]} ${N}`,de:`${N} Gasse ${m[2]}`};});
NR(/^(.+) shoh ko'chasi$/,N=>({en:`${N} Avenue`,ru:`проспект ${N}`,fr:`Avenue ${N}`,de:`${N}-Allee`}));
NR(/^(.+) ko'chasi$/,N=>({en:`${N} Street`,ru:`улица ${N}`,fr:`Rue ${N}`,de:`${N}-Straße`}));
NR(/^(.+) yo'li$/,N=>({en:`${N} Road`,ru:`дорога ${N}`,fr:`Route de ${N}`,de:`${N}-Straße`}));
R(/^(.+) \((\d+)-filial\)$/,m=>{const b=trText(m[1]);return {en:`${b} (branch ${m[2]})`,ru:`${b} (филиал ${m[2]})`,fr:`${b} (succursale ${m[2]})`,de:`${b} (Filiale ${m[2]})`};});
R(/^[A-Z][a-z'ʻ’]+ [A-Z]\.$/,m=>({ru:uz2ru(m[0])}));
R(/^(\d+(?:[.,]\d+)?) yulduz$/,m=>{ const frac=/[.,]/.test(m[1]), n=parseFloat(m[1].replace(",",".")), d=m[1].replace(",","."), c=m[1];
  return {en:`${d} star${n===1?"":"s"}`,ru:`${c} ${frac?"звезды":plRu(n,"звезда","звезды","звёзд")}`,fr:`${c} étoile${n>1?"s":""}`,de:`${c} Stern${n===1?"":"e"}`}; });
R(/^Yana (\d+) tasini ko'rsatish$/,m=>({en:`Show ${m[1]} more`,ru:`Показать ещё ${m[1]}`,fr:`Afficher ${m[1]} de plus`,de:`${m[1]} weitere anzeigen`}));

const origT=new WeakMap(), lastT=new WeakMap(), origA=new WeakMap();
const ATTRS=["placeholder","title","aria-label"];
function tNode(n){
  const p=n.parentNode; if(!p||p.nodeName==="SCRIPT"||p.nodeName==="STYLE") return;
  const cur=n.nodeValue; let o=origT.get(n);
  if(o===undefined||cur!==lastT.get(n)){ o=cur; origT.set(n,o); }
  const core=o.trim(); if(!core||!/[A-Za-zЀ-ӿ]/.test(core)){ lastT.set(n,o); return; }
  const out=trText(core), res=out===core?o:o.slice(0,o.indexOf(core))+out+o.slice(o.indexOf(core)+core.length);
  lastT.set(n,res); if(cur!==res) n.nodeValue=res;
}
function tAttr(el,a){
  const v=el.getAttribute(a); if(v==null) return;
  let m=origA.get(el); if(!m){ m={}; origA.set(el,m); }
  if(m[a]===undefined||m[a].last!==v) m[a]={orig:v,last:v};
  const out=trText(m[a].orig.trim()); const res=out===m[a].orig.trim()?m[a].orig:out;
  m[a].last=res; if(v!==res) el.setAttribute(a,res);
}
function tWalk(root){
  if(root.nodeType===3){ tNode(root); return; }
  if(root.nodeType!==1) return;
  for(const a of ATTRS) if(root.hasAttribute(a)) tAttr(root,a);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT); let n;
  while((n=w.nextNode())){ if(n.nodeType===3) tNode(n); else for(const a of ATTRS) if(n.hasAttribute(a)) tAttr(n,a); }
}
/* zamonaviy ro'yxatlar (saralash, shahar tanlash): haqiqiy <select> yashirin, o'rnida til menyusi uslubidagi tugma va menyu */
let selMenu=null;
function closeSelMenu(){ if(!selMenu) return; selMenu.m.remove(); selMenu.btn.setAttribute("aria-expanded","false"); selMenu=null; }
function syncSelLabels(){
  document.querySelectorAll(".selbtn").forEach(b=>{ const sel=b._sel; if(!sel||!sel.isConnected) return; const o=sel.options[sel.selectedIndex]; const t=b.querySelector(".sbl"); if(o&&t&&t.textContent!==o.textContent) t.textContent=o.textContent; });
}
function enhanceSelects(){
  document.querySelectorAll("select.csel:not([data-enh])").forEach(sel=>{
    sel.dataset.enh="1"; sel.classList.add("selhid"); sel.tabIndex=-1; sel.setAttribute("aria-hidden","true");
    const b=document.createElement("button"); b.type="button"; b.className="selbtn"; b._sel=sel; b.setAttribute("aria-haspopup","listbox"); b.setAttribute("aria-expanded","false");
    b.setAttribute("aria-label",sel.getAttribute("aria-label")||"");
    b.innerHTML=`<span class="sbl"></span><svg class="i" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>`;
    sel.insertAdjacentElement("afterend",b);
    sel.addEventListener("change",syncSelLabels);
  });
  syncSelLabels();
}
function openSelMenu(btn){
  const sel=btn._sel; if(!sel) return; const same=selMenu&&selMenu.btn===btn; closeSelMenu(); if(same) return;
  const m=document.createElement("ul"); m.className="langmenu selmenu"; m.setAttribute("role","listbox");
  m.innerHTML=[...sel.options].map((o,i)=>`<li role="option" tabindex="-1" data-i="${i}" aria-selected="${i===sel.selectedIndex}"><span class="ln">${esc(o.textContent)}</span><svg class="i ck" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg></li>`).join("");
  document.body.appendChild(m);
  const r=btn.getBoundingClientRect(); m.style.minWidth=Math.max(r.width,180)+"px";
  const mh=m.offsetHeight, below=innerHeight-r.bottom-12, top=(below>=Math.min(mh,260)||r.top<mh)?r.bottom+8:r.top-mh-8;
  m.style.left=Math.max(8,Math.min(r.left,innerWidth-m.offsetWidth-8))+"px"; m.style.top=top+"px"; m.style.maxHeight=Math.max(160,Math.min(340,(top>r.top?below:r.top-20)))+"px";
  btn.setAttribute("aria-expanded","true"); selMenu={m,btn};
  const li=m.querySelector('[aria-selected="true"]')||m.firstElementChild; li&&li.focus();
}
function pickSel(i){ const {btn}=selMenu; const sel=btn._sel; sel.selectedIndex=i; sel.dispatchEvent(new Event("change",{bubbles:true})); closeSelMenu(); btn.focus(); }
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest(".selbtn"), li=e.target.closest&&e.target.closest(".selmenu li");
  if(li&&selMenu){ pickSel(+li.dataset.i); return; }
  if(b){ openSelMenu(b); return; }
  if(selMenu) closeSelMenu();
});
document.addEventListener("keydown",e=>{
  if(e.target.classList&&e.target.classList.contains("selbtn")&&(e.key==="ArrowDown"||e.key==="ArrowUp")){ e.preventDefault(); openSelMenu(e.target); return; }
  if(!selMenu) return;
  const items=[...selMenu.m.querySelectorAll("li")], i=items.indexOf(document.activeElement);
  if(e.key==="Escape"){ const b=selMenu.btn; closeSelMenu(); b.focus(); }
  else if(e.key==="ArrowDown"){ e.preventDefault(); items[(i+1)%items.length].focus(); }
  else if(e.key==="ArrowUp"){ e.preventDefault(); items[(i-1+items.length)%items.length].focus(); }
  else if((e.key==="Enter"||e.key===" ")&&i>=0){ e.preventDefault(); pickSel(i); }
});
addEventListener("scroll",e=>{ if(selMenu&&e.target&&e.target.nodeType===1&&selMenu.m.contains(e.target)) return; closeSelMenu(); },true); addEventListener("resize",closeSelMenu);   // menyuning o'z aylanishi uni yopmaydi
/* zamonaviy til menyusi: haqiqiy <select> yashirin holda saqlanadi (mantiq o'zgarmaydi) */
const LANG_LIST=[["uz","UZ","O'zbekcha"],["en","EN","English"],["ru","RU","Русский"],["fr","FR","Français"],["de","DE","Deutsch"]];
function syncLangUi(){
  const cur=LANG_LIST.find(x=>x[0]===lang)||LANG_LIST[0];
  $("#langCode").textContent=cur[1]; $("#langName").textContent=cur[2];
  document.querySelectorAll("#langMenu li").forEach(li=>li.setAttribute("aria-selected",String(li.dataset.lang===lang)));
}
function buildLangMenu(){
  $("#langMenu").innerHTML=LANG_LIST.map(([c,k,n])=>`<li role="option" tabindex="-1" data-lang="${c}" aria-selected="${c===lang}"><span class="lc">${k}</span><span class="ln">${n}</span><svg class="i ck" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg></li>`).join("");
}
function langMenu(open,focusSel){
  const menu=$("#langMenu"), btn=$("#langBtn"); menu.hidden=!open; btn.setAttribute("aria-expanded",String(open));
  if(open&&focusSel){ const li=menu.querySelector('[aria-selected="true"]')||menu.firstElementChild; li&&li.focus(); }
}
function pickLang(c){ const sel=$("#langSel"); sel.value=c; sel.dispatchEvent(new Event("change",{bubbles:true})); langMenu(false); $("#langBtn").focus(); }
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("#langBtn"), li=e.target.closest&&e.target.closest("#langMenu li");
  if(b){ langMenu($("#langMenu").hidden,false); return; }
  if(li){ pickLang(li.dataset.lang); return; }
  if(!$("#langMenu").hidden) langMenu(false);
});
document.addEventListener("keydown",e=>{
  const menu=$("#langMenu"); if(!menu) return;
  if(e.target.id==="langBtn"&&(e.key==="ArrowDown"||e.key==="ArrowUp")){ e.preventDefault(); langMenu(true,true); return; }
  if(menu.hidden) return;
  const items=[...menu.querySelectorAll("li")], i=items.indexOf(document.activeElement);
  if(e.key==="Escape"){ langMenu(false); $("#langBtn").focus(); }
  else if(e.key==="ArrowDown"){ e.preventDefault(); items[(i+1)%items.length].focus(); }
  else if(e.key==="ArrowUp"){ e.preventDefault(); items[(i-1+items.length)%items.length].focus(); }
  else if((e.key==="Enter"||e.key===" ")&&i>=0){ e.preventDefault(); pickLang(items[i].dataset.lang); }
});
function setLang(l){
  lang=l; try{ localStorage.setItem(LANG_KEY,l); }catch(e){}
  document.documentElement.lang=l; const ls=$("#langSel"); if(ls) ls.value=l; syncLangUi();
  tWalk(document.body); syncSelLabels();
  if(typeof render==="function") render();
}
function initI18n(){
  const ls=$("#langSel"); ls.value=lang; ls.addEventListener("change",e=>setLang(e.target.value)); buildLangMenu(); syncLangUi(); enhanceSelects();
  document.documentElement.lang=lang;
  new MutationObserver(ms=>{ for(const m of ms){
    if(m.type==="childList") m.addedNodes.forEach(tWalk);
    else if(m.type==="characterData") tNode(m.target);
    else if(m.type==="attributes") tAttr(m.target,m.attributeName);
  }}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
  tWalk(document.body);
}
window.__i18n={MISS,get lang(){return lang;},setLang,RULES,DICT};

