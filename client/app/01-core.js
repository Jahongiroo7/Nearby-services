const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ic = n => `<svg class="i" aria-hidden="true"><use href="#ic-${n}"/></svg>`;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
/* Server bilan aloqa (xato bo'lsa ilova baribir ishlaydi: ma'lumot brauzerda qoladi) */
const api = {
  post(path, body){
    return fetch("/api"+path, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)})
      .then(r=>r.ok).catch(()=>false);
  }
};
const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
/* Tizim sozlamalari (admin panelida o'zgartiriladi); standart qiymatlar */
const SYS_KEY="ns_sys";
const SYS_DEF={name:"Nearby",sub:"Services · Toshkent",lang:"uz",theme:"auto",sort:"dist",radius:0,openNow:false,
  fReviews:true,fFav:true,fShare:true,fGallery:true,fPhone:true,fKabinet:true,fCompare:true,fRoute:true,fReport:true,annOn:false,annText:"",annKind:"info",maint:false,maintText:"Saytda texnik ishlar olib borilmoqda. Tez orada qaytamiz."};
let SYS=Object.assign({},SYS_DEF,LS.get(SYS_KEY,{}));
/* Akkauntlar (demo): har birining o'z saralanganlari va kelgan ulashishlari bor */
const ACC_KEY="ns_acc", ACCS_KEY="ns_accounts", K_SH="ns_shares";
const ACC_DEF=[{id:"guest",name:"Mehmon"},{id:"aziz",name:"Aziz"},{id:"malika",name:"Malika"},{id:"jasur",name:"Jasur"},{id:"dilnoza",name:"Dilnoza"},{id:"sardor",name:"Sardor"}];
let ACCS=LS.get(ACCS_KEY,null); if(!Array.isArray(ACCS)||!ACCS.length) ACCS=ACC_DEF.map(a=>({...a}));
if(!ACCS.some(a=>a.id==="guest")) ACCS.unshift({...ACC_DEF[0]});
let ACC_ID="guest"; try{ ACC_ID=localStorage.getItem(ACC_KEY)||"guest"; }catch(e){} if(!ACCS.some(a=>a.id===ACC_ID)) ACC_ID="guest";
const ACC_SUF=ACC_ID==="guest"?"":"_"+ACC_ID, accById=id=>ACCS.find(a=>a.id===id), accName=id=>(accById(id)||{name:"Mehmon"}).name;
const accColor=id=>{ let h=0; for(const c of String(id)) h=(h*31+c.charCodeAt(0))>>>0; return ["#4f46e5","#db2777","#ea580c","#16a34a","#0369a1","#7c3aed","#be123c","#0d9488"][h%8]; };
let SHARES=LS.get(K_SH,[]); if(!Array.isArray(SHARES)) SHARES=[];

