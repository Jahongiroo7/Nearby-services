/* ---------- kunduzgi / tungi rejim ---------- */
const THEME_KEY="nearby-proto-theme", THEMES=[["auto","Avto","theme-auto"],["light","Kunduzgi","sun"],["dark","Tungi","moon"]];
let theme=["auto","light","dark"].includes(SYS.theme)?SYS.theme:"auto"; try{ const t=localStorage.getItem(THEME_KEY); if(THEMES.some(x=>x[0]===t)) theme=t; }catch(e){}
function applyTheme(){
  const r=document.documentElement; if(theme==="auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme",theme);
  const [,label,icon]=THEMES.find(x=>x[0]===theme);
  $("#themeBtn").innerHTML=`${ic(icon)}<span class="tlabel">${label}</span>`;
  $("#themeBtn").title=theme==="auto"?"Qurilma sozlamasiga qarab (hozir: "+(matchMedia("(prefers-color-scheme: dark)").matches?"tungi":"kunduzgi")+")":label+" rejim";
}
$("#themeBtn").addEventListener("click",()=>{
  theme=THEMES[(THEMES.findIndex(x=>x[0]===theme)+1)%THEMES.length][0];
  try{ localStorage.setItem(THEME_KEY,theme); }catch(e){}
  applyTheme();
});
