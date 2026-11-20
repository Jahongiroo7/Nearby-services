/* ---------- tafsilot ko'rinishlari ---------- */
const vList=$("#viewList"), vDetail=$("#viewDetail"), panel=$("#panel");
function showDetail(html){
  vDetail.innerHTML=html; vList.hidden=true; vDetail.hidden=false; panel.scrollTop=0; selectRegion(curRegion());
}
function setRegion(r){
  state.region=r?r.id:null; state.sel=null; state.mark=null; state.allPlaces=false;
  vDetail.hidden=true; vList.hidden=false; vDetail.innerHTML="";
  render(); selectRegion(r); panel.scrollTop=0;
  if(r){
    // xarita viloyatdagi xizmatlarga yaqinlashadi (belgilar to'liq ko'rinishi uchun); xizmat bo'lmasa — butun viloyatga
    const pts=services.filter(s=>(s.region||"ts")===r.id).map(s=>({x:s.x,y:s.y}));
    if(!pts.length){ if(r===TASH_CITY) pts.push({x:r.cx-r.rx,y:r.cy-r.ry},{x:r.cx+r.rx,y:r.cy+r.ry}); else r.seeds.forEach(([a,b])=>pts.push(ll2w(a,b))); }
    fitPoints(pts,1.25);
  }
}
function showList(){
  selectRegion(curRegion());
  state.sel=null; state.mark=null;
  vDetail.hidden=true; vList.hidden=false; vDetail.innerHTML="";
  render();
}
function revealPanelOnPhone(){ if(matchMedia("(max-width:860px)").matches) panel.scrollIntoView({behavior:"smooth",block:"start"}); }
function nearbyServicesHtml(pt,maxM,limit,excludeId){
  const arr=services.filter(s=>s.id!==excludeId).map(s=>({s,d:gdist(s,pt)})).filter(r=>r.d<=maxM).sort((a,b)=>a.d-b.d).slice(0,limit);
  return arr.length?`<ul class="mini">${arr.map(r=>cardHtml(r.s,r.d)).join("")}</ul>`:`<p class="muted" style="margin:0">${fmtKm(maxM)} ichida xizmat topilmadi.</p>`;
}
function nearbyPlacesHtml(pt,maxM,limit,excludeId){
  const arr=places.filter(p=>p.id!==excludeId).map(p=>({p,d:gdist(p,pt)})).filter(r=>r.d<=maxM).sort((a,b)=>a.d-b.d).slice(0,limit);
  return arr.length?`<ul class="mini">${arr.map(r=>placeCardHtml(r.p,r.d)).join("")}</ul>`:`<p class="muted" style="margin:0">${fmtKm(maxM)} ichida jamoat joyi yo'q.</p>`;
}
const dsec=(icon,title,rows)=>`<section class="dsec"><h3>${ic(icon)} ${title}</h3><dl class="info">${rows}</dl></section>`;
const telHref=ph=>"tel:"+String(ph).replace(/[^\d+]/g,"");
const phoneRow=ph=>`<div><dt>${ic("phone")} Telefon</dt><dd><a class="tel" href="${telHref(ph)}">${esc(ph)}</a><button class="btn sm" data-act="copy" data-copy="${esc(ph)}">${ic("copy")} Nusxa</button><span class="phnote">Namuna raqam, haqiqiy emas</span></dd></div>`;
function coordRow(p){
  const ll=toLatLng(p.x,p.y), txt=`${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`;
  return `<div><dt>${ic("map")} Koordinata</dt><dd><span class="mono">${txt}</span><button class="btn sm" data-act="copy" data-copy="${txt}">${ic("copy")} Nusxa</button></dd></div>`;
}

function openService(id,opts={}){
  const s=byId(id); if(!s)return;
  state.sel={kind:"service",id}; state.mark=null;
  const c=CATS[s.cat], st=status(s), d=gdist(s,state.user), tr=travel(d);
  const total=s.count;
  const bars=[5,4,3,2,1].map(n=>{const p=s.count?Math.round((s.dist?s.dist[n-1]:0)*100):0;return `<div class="bar"><span>${n}</span><i><b style="width:${p}%"></b></i><span>${p}%</span></div>`;}).join("");
  const revs=sortRevs(s).map(r=>`<li class="rev"><div class="rv-h"><span class="av">${esc((r.name||"?")[0])}</span><b>${esc(r.name)}</b>${starsHtml(r.stars)}<span class="muted">${r.ts?relDays(Math.floor((Date.now()-r.ts)/864e5)):relDays(r.ago)}</span></div><p>${esc(r.text)}</p>${voteBtn(s.id,r)}</li>`).join("");
  showDetail(`
    <button class="back" data-act="back">${ic("back")} Ro'yxatga qaytish</button>
    <div class="dhead"><span class="dicon logo">${serviceLogo(s)}</span>
      <div class="dtitle"><span class="eyebrow">${c.label}</span><h2>${esc(s.name)}</h2>
      <div class="cline">${ratingHtml(s)}<span class="pill ${st.open?(st.soon?"soon":"open"):"closed"}">${st.text}</span></div></div></div>
    ${galleryHtml(s.cat,c.color,s.id)}
    <div class="actions">
      ${mapLinks(s)}<button class="btn btn-primary" data-act="route">${ic("route")} Yo'nalish</button>
      <a class="btn btn-accent" href="${telHref(s.phone)}">${ic("phone")} Qo'ng'iroq qilish</a>
      <button class="btn" data-act="share">${ic("copy")} Ulashish</button><button class="btn" data-act="fav" data-id="${s.id}" aria-pressed="${FAV.has(s.id)}"><span class="fh">${FAV.has(s.id)?"\u2665":"\u2661"}</span> <span class="ft">${FAV.has(s.id)?"Saralangan":"Saralash"}</span></button><button class="btn" data-act="cmp" data-id="${s.id}" aria-pressed="${CMP.includes(s.id)}">⇄ <span class="ct">${CMP.includes(s.id)?"Taqqoslashda":"Taqqoslash"}</span></button><button class="btn" data-act="rt" data-id="${s.id}" aria-pressed="${ROUTE.includes(s.id)}">➕ <span class="rt">${ROUTE.includes(s.id)?"Marshrutda":"Marshrutga"}</span></button><button class="btn" data-act="report" data-id="${s.id}">⚑ Xato haqida</button>
      <button class="btn" data-act="to-review">${ic("star")} Sharh yozish</button>
    </div>
    ${dsec("phone","Aloqa",phoneRow(s.phone)+`<div><dt>${ic("pin")} Manzil</dt><dd>${esc(s.address)}, ${esc(locality(s))}</dd></div>`)}
    <section class="dsec"><h3>${ic("shop")} Narxlar <span class="note-t">taxminiy</span></h3>
      ${s.desc?`<p class="desc dsec-desc">${esc(s.desc)}</p>`:""}
      ${s.prices&&s.prices.length?`<ul class="prices pr-in">${s.prices.map(([n,p])=>`<li><span>${esc(n)}</span><b>${fmtSum(p)}</b></li>`).join("")}</ul>`:`<p class="muted pr-in" style="margin:0">Narxlar hali kiritilmagan.</p>`}
    </section>
    ${dsec("clock","Ish vaqti",`<div><dt>${ic("clock")} Jadval</dt><dd>${hoursText(s)}${weekHtml(s)}</dd></div><div><dt>${ic("star")} Holati</dt><dd><span class="pill ${st.open?(st.soon?"soon":"open"):"closed"}">${st.text}</span></dd></div>${closeWarn(s,st,tr)}`)}
    ${dsec("route","Masofa va yo'l",`<div><dt>${ic("route")} Sizdan</dt><dd>${routeHtml(s)}</dd></div>`)}
    <section class="sec" id="revSec"><h3>Sharhlar <span class="muted">${total}</span></h3>
      ${s.count?`<div class="rsum"><div class="rbig"><b>${fmtR(s.rating)}</b>${starsHtml(s.rating)}<small>${s.count} ta baho</small></div><div class="bars">${bars}</div></div>`:`<p class="muted" style="margin:0">Hali sharh yo'q. Birinchi bo'lib baho bering.</p>`}
      <form class="revform" id="revForm" novalidate>
        <div class="starpick" role="radiogroup" aria-label="Bahongiz">${[5,4,3,2,1].map(n=>`<input type="radio" name="rs" id="rs${n}" value="${n}"><label for="rs${n}" title="${n} yulduz">★</label>`).join("")}</div>
        <input class="input" id="revName" maxlength="40" placeholder="Ismingiz (ixtiyoriy)" aria-label="Ismingiz">
        <textarea class="input" id="revText" rows="3" maxlength="500" placeholder="Xizmat sizga qanday yoqdi?" aria-label="Sharh matni"></textarea>
        <em class="err" id="errRev"></em>
        <div><button class="btn btn-accent" type="submit">Sharhni yuborish</button></div>
      </form>
      <ul class="revs">${revs}</ul>
    </section>
    <section class="sec"><h3>Yaqin atrofda</h3>${nearbyServicesHtml(s,1200,4,s.id)}</section>`);
  renderMarkers(filtered(false));
  ensureVisible(s);
  if(opts.fromMap) revealPanelOnPhone();
}
function openPlace(id,opts={}){
  const p=places.find(x=>x.id===id); if(!p)return;
  state.sel={kind:"place",id}; state.mark=null;
  const t=PTYPES[p.t], d=gdist(p,state.user), tr=travel(d);
  showDetail(`
    <button class="back" data-act="back">${ic("back")} Ro'yxatga qaytish</button>
    <div class="dhead"><span class="dicon sq" style="background:${t.color}">${ic(p.t)}</span>
      <div class="dtitle"><span class="eyebrow">${t.one}</span><h2>${esc(p.name)}</h2></div></div>
    <p class="desc">${esc(p.desc)}</p>
    ${galleryHtml(p.t,t.color,p.id)}
    <div class="actions">${mapLinks(p)}<button class="btn btn-primary" data-act="route">${ic("route")} Yo'nalish</button><button class="btn" data-act="share">${ic("copy")} Ulashish</button><button class="btn" data-act="rt" data-id="${p.id}" aria-pressed="${ROUTE.includes(p.id)}">➕ <span class="rt">${ROUTE.includes(p.id)?"Marshrutda":"Marshrutga"}</span></button><button class="btn" data-act="report" data-id="${p.id}">⚑ Xato haqida</button></div>
    ${dsec("building","Umumiy ma'lumot",`<div><dt>${ic("building")} Hudud</dt><dd>${esc(p.area||`${p.district} tumani, Toshkent`)}</dd></div><div><dt>${ic("clock")} Ish vaqti</dt><dd>${t.hours} <span class="muted small">(taxminiy)</span></dd></div>`)}
    ${dsec("route","Masofa va yo'l",`<div><dt>${ic("route")} Sizdan</dt><dd>${routeHtml(p)}</dd></div>`)}
    ${dsec("map","Joylashuv",coordRow(p))}
    <section class="sec"><h3>Yaqin xizmatlar <span class="muted">1,5 km ichida</span></h3>${nearbyServicesHtml(p,1500,5)}</section>
    <section class="sec"><h3>Yaqin jamoat joylari</h3>${nearbyPlacesHtml(p,2000,4,p.id)}</section>`);
  renderMarkers(filtered(false));
  ensureVisible(p);
  if(opts.fromMap) revealPanelOnPhone();
}
function farHtml(p,eyebrow,title,sub){
  const d=gdist(p,state.user), drive=`~${fmtMin(driveMin(d))}`;
  return `
    <button class="back" data-act="back">${ic("back")} Ro'yxatga qaytish</button>
    <div class="dhead"><span class="dicon" style="background:#be123c">${ic("pin")}</span>
      <div class="dtitle"><span class="eyebrow">${eyebrow}</span><h2>${esc(title)}</h2>${sub?`<span class="muted">${esc(sub)}</span>`:""}</div></div>
    ${dsec("map","Joylashuv",coordRow(p))}
    ${dsec("route","Masofa va yo'l",`<div><dt>${ic("route")} Sizdan</dt><dd>${fmtKm(d)} · mashinada ${drive} (taxminan)</dd></div>`)}
    <p class="desc">Bu nuqta O'zbekiston hududidan tashqarida. Xizmatlar faqat O'zbekiston bo'yicha ko'rsatiladi.</p>
    <div class="actions"><button class="btn btn-primary" data-act="to-tashkent">${ic("locate")} Toshkentga qaytish</button></div>`;
}
function openCity(id){
  const c=CITIES.concat(TOWNS).find(x=>x.id===id); if(!c)return;
  if(c.town){ setRegion(regionOfCity(c)); flyTo(c.x,c.y,8000,700); revealPanelOnPhone(); return; }
  setRegion(c.capital?TASH_CITY:(REGIONS.find(r=>r.center===c.name)||regionAt(c)));
  revealPanelOnPhone();
}
/* Aholi punktlaridan uzoqdagi nuqta: odam shu yerda bo'lsa nima kerak — eng yaqin shahar, xizmat va jamoat joylari, qancha masofa */
function ruralPoint(m){
  state.mark=m; state.sel={kind:"point"};
  const reg=regionAt(m), rd=nearestRoad(m.x,m.y);
  const cities=CITIES.concat(TOWNS).map(c=>({c,d:gdist(c,m)})).sort((a,b)=>a.d-b.d).slice(0,3);
  const sv=services.map(s=>({s,d:gdist(s,m)})).sort((a,b)=>a.d-b.d).slice(0,5);
  const pl=places.map(p=>({p,d:gdist(p,m)})).sort((a,b)=>a.d-b.d).slice(0,3);
  const near=cities[0];
  const cityCard=({c,d})=>`<li><button class="card" data-city="${c.id}"><span class="cicon sq" style="background:#475569">${ic("building")}</span>
    <span class="cbody"><span class="cname">${esc(c.name)}</span><span class="cmeta">${c.town?"Tuman shahri":"Viloyat markazi"} · ${esc(regionOfCity(c).short)}</span><span class="cmeta">yo'l ~${fmtKm(roadKm(d))} · mashinada ~${fmtMin(driveMin(d))}</span></span>
    <span class="dist">${fmtKm(d)}</span></button></li>`;
  showDetail(`
    <button class="back" data-act="back">${ic("back")} Ro'yxatga qaytish</button>
    <div class="dhead"><span class="dicon" style="background:#be123c">${ic("pin")}</span>
      <div class="dtitle"><span class="eyebrow">Belgilangan joy</span><h2>Aholi punktlaridan tashqarida</h2>
      <span class="muted">${esc(reg.name)}</span></div></div>
    <p class="desc">Bu atrofda xizmatlar yo'q. Eng yaqin shahar: <b>${esc(near.c.name)}</b>, ${fmtKm(near.d)} narida (mashinada ~${fmtMin(driveMin(near.d))}).</p>
    ${dsec("map","Joylashuv",coordRow(m)+`<div><dt>${ic("building")} Viloyat</dt><dd>${esc(reg.name)}</dd></div>`+(rd.road&&rd.dist<3000?`<div><dt>${ic("map")} Yaqin yo'l</dt><dd>${esc(rd.road.name)} · ${fmtKm(rd.dist)}</dd></div>`:""))}
    ${dsec("route","Masofa va yo'l",`<div><dt>${ic("route")} Sizdan</dt><dd>${routeHtml(m)}</dd></div>`)}
    <div class="actions">
      ${mapLinks(m)}
      <button class="btn btn-primary" data-city="${near.c.id}">${ic("route")} ${esc(near.c.name)} shahriga</button>
      <button class="btn" data-act="set-user">${ic("locate")} Joylashuvim shu yerda</button>
    </div>
    <section class="sec"><h3>Eng yaqin shaharlar</h3><ul class="mini">${cities.map(cityCard).join("")}</ul></section>
    <section class="sec"><h3>Eng yaqin xizmatlar</h3><ul class="mini">${sv.map(r=>cardHtml(r.s,r.d)).join("")}</ul></section>
    <section class="sec"><h3>Eng yaqin jamoat joylari</h3><ul class="mini">${pl.map(r=>placeCardHtml(r.p,r.d)).join("")}</ul></section>`);
  renderMarkers(filtered(false)); renderOverlays();
  // belgi va eng yaqin shahar ikkalasi ko'rinishi uchun
  fitPoints([m,near.c],1.9);
}
function openPoint(pt){
  const m={x:Math.round(pt.x),y:Math.round(pt.y)};
  const inTash=Math.hypot(m.x-ORIGIN.x,m.y-ORIGIN.y)<=20000;
  const nc=nearestCity(m), inCity=!inTash&&!nc.city.capital&&nc.d<=(nc.city.town?7000:12000);
  if(!inTash&&!inCity){
    if(inUzb(m)){ ruralPoint(m); return; }
    state.mark=m; state.sel={kind:"point"};
    showDetail(farHtml(m,"Belgilangan joy","O'zbekiston hududidan tashqarida",`Eng yaqin O'zbekiston shahri: ${nc.city.name} · ${fmtKm(nc.d)}`));
    renderMarkers(filtered(false)); return;
  }
  state.mark=m; state.sel={kind:"point"};
  const rd=nearestRoad(m.x,m.y), dn=inTash?nearestDistrict(m.x,m.y):nc.city.name, d=gdist(m,state.user);
  const area=inTash?`${dn} tumani, Toshkent`:`${dn} shahri, ${regionOfCity(nc.city).name}`;
  const title = rd.dist<500 ? rd.road.name : inTash?`${dn} tumani`:`${dn} shahri`;
  const inAirport = AIRPORTS.some(a=>Math.hypot(m.x-a.x,m.y-a.y)<1300);
  const inWaterLike = WATER.some(w=>{for(let i=0;i<w.pts.length-1;i++){if(segDist(m.x,m.y,w.pts[i][0],w.pts[i][1],w.pts[i+1][0],w.pts[i+1][1])<90)return true;}return false;});
  const hint = inAirport?"Aeroport hududi.":inWaterLike?"Kanal bo'yi.":"";
  showDetail(`
    <button class="back" data-act="back">${ic("back")} Ro'yxatga qaytish</button>
    <div class="dhead"><span class="dicon" style="background:#be123c">${ic("pin")}</span>
      <div class="dtitle"><span class="eyebrow">Belgilangan joy</span><h2>${esc(title)}</h2>${hint?`<span class="muted">${hint}</span>`:""}</div></div>
    ${dsec("map","Joylashuv",coordRow(m)+`<div><dt>${ic("building")} Hudud</dt><dd>${esc(area)}</dd></div><div><dt>${ic("map")} Yaqin ko'cha</dt><dd>${esc(rd.road.name)} · ${fmtKm(rd.dist)}</dd></div>`)}
    ${dsec("route","Masofa va yo'l",`<div><dt>${ic("route")} Sizdan</dt><dd>${routeHtml(m)}</dd></div>`)}
    <div class="actions">
      ${mapLinks(m)}
      <button class="btn" data-act="set-user">${ic("locate")} Joylashuvim shu yerda</button>
    </div>
    <section class="sec"><h3>Yaqin xizmatlar <span class="muted">1 km ichida</span></h3>${nearbyServicesHtml(m,1000,6)}</section>
    <section class="sec"><h3>Yaqin jamoat joylari <span class="muted">2 km ichida</span></h3>${nearbyPlacesHtml(m,2000,5)}</section>`);
  renderMarkers(filtered(false));
}
function ensureVisible(p){ if(!inView(p)||view.w>40000) flyTo(p.x,p.y,Math.min(view.w,9000)); }

