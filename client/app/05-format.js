/* ---------- formatlash ---------- */
const fmtKm = m => m<1000 ? `${Math.max(10,Math.round(m/10)*10)} m` : `${(m/1000).toFixed(m<10000?1:0).replace(".",",")} km`;
const fmtR = r => r.toFixed(1).replace(".",",");
const fmtSum = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g," ")+" so'm";
const toMin = t => {const [h,m]=t.split(":").map(Number);return h*60+m;};
function relDays(n){if(n<=0)return"bugun";if(n===1)return"kecha";if(n<7)return`${n} kun oldin`;if(n<30)return`${Math.floor(n/7)} hafta oldin`;return`${Math.floor(n/30)} oy oldin`;}
function daysText(days){
  if(days.length===7) return "Har kuni";
  if(days.join()===WK.join()) return "Du–Sh";
  if(days.join()==="0,1,2,3,4") return "Du–Ju";
  return days.map(d=>DAYS[d]).join(", ");
}
function hoursText(s){ return s.h24 ? "Har kuni, 24 soat" : `${daysText(s.days)}, ${s.open}–${s.close}`; }
function status(s){
  if(s.h24) return {open:true,text:"24/7 ochiq"};
  const now=new Date(), d=(now.getDay()+6)%7, m=now.getHours()*60+now.getMinutes();
  const o=toMin(s.open), c=toMin(s.close);
  if(s.days.includes(d) && m>=o && m<c){ const left=c-m; return left<=30?{open:true,soon:true,left,text:`Tez yopiladi · ${left} daqiqa`}:{open:true,left,text:`Ochiq · ${s.close} gacha`}; }
  for(let i=0;i<8;i++){
    const dd=(d+i)%7;
    if(!s.days.includes(dd)) continue;
    if(i===0){ if(m<o) return {open:false,text:`Yopiq · ${s.open} da ochiladi`}; continue; }
    return {open:false,text: i===1 ? `Yopiq · ertaga ${s.open} da` : `Yopiq · ${DAYS_FULL[dd]} ${s.open} da`};
  }
  return {open:false,text:"Yopiq"};
}
function closeWarn(s,st,tr){
  if(!st.open||s.h24||st.left==null) return "";
  const l=st.left;
  if(tr.car>l) return `<div><dt>⚠ Eslatma</dt><dd class="cwarn">Yopilishigacha ${l} daqiqa qoldi, mashinada ~${tr.car} daqiqa yo'l. Yetib borguncha yopilishi mumkin.</dd></div>`;
  if(tr.walk>l) return `<div><dt>⚠ Eslatma</dt><dd class="cwarn">Yopilishigacha ${l} daqiqa qoldi. Piyoda (~${tr.walk} daqiqa) ulgurmaysiz, mashinada ulgurasiz (~${tr.car} daqiqa).</dd></div>`;
  return "";
}
function starsHtml(n){const r=Math.round(n);return `<span class="stars" aria-label="${fmtR(n)} yulduz">${"★".repeat(r)}<span class="off">${"★".repeat(5-r)}</span></span>`;}
function ratingHtml(s){return s.count ? `<span class="rt"><span class="star">★</span>${fmtR(s.rating)} <span class="muted">(${s.count})</span></span>` : `<span class="pill new">Yangi</span>`;}
/* Yo'l ma'lumoti bo'lmagan uzoq masofalar uchun taxminiy model: yo'l uzunligi to'g'ri chiziqdan ~25-35% ko'p, tezlik masofaga qarab o'zgaradi. */
const roadKm=m=>m*(m<3000?1.35:m<30000?1.3:1.25);
function driveMin(m){const r=roadKm(m)/1000;return (Math.min(r,6)/25+Math.min(Math.max(r-6,0),40)/50+Math.max(r-46,0)/75)*60;}
function walkMin(m){return roadKm(m)/1000/4.8*60;}
function fmtMin(min){
  const t=Math.max(1,Math.round(min));
  if(t<60) return `${t} daq`;
  const h=Math.floor(t/60), r=t%60;
  return r?`${h} soat ${r} daq`:`${h} soat`;
}
function travelTxt(m){
  const base=`${fmtKm(m)} to'g'ri chiziqda · yo'l ~${fmtKm(roadKm(m))}`;
  return m>25000?`${base} · mashinada ~${fmtMin(driveMin(m))}`:`${base} · piyoda ~${fmtMin(walkMin(m))} · mashinada ~${fmtMin(driveMin(m))}`;
}
function travel(m){return {walk:Math.max(1,Math.round(walkMin(m))),car:Math.max(1,Math.round(driveMin(m)))};}

