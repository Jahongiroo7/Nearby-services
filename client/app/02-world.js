/* ---------- dunyo koordinatalari (metr), 24 x 18 km ---------- */
const W = 24000, H = 18000;
const ORIGIN = {x:12000, y:9000, lat:41.3111, lng:69.2797};
const toLatLng = (x,y) => ({lat: ORIGIN.lat - (y-ORIGIN.y)/111000, lng: ORIGIN.lng + (x-ORIGIN.x)/83900});
const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);   // dunyo koordinatalarida tekis masofa (faqat geometriya uchun)
/* Foydalanuvchiga ko'rsatiladigan masofa: xarita nuqtalari avval haqiqiy kenglik/uzunlikka qaytariladi, so'ng haversine.
   Tekis xarita hisobi Toshkentdan uzoqda 5% gacha adashadi. */
const EARTH_R=6371008.8, RAD=Math.PI/180;
function gdist(a,b){
  const la1=(ORIGIN.lat-(a.y-ORIGIN.y)/111000)*RAD, la2=(ORIGIN.lat-(b.y-ORIGIN.y)/111000)*RAD;
  const dlo=(b.x-a.x)/83900*RAD, dla=la2-la1;
  const h=Math.sin(dla/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dlo/2)**2;
  return 2*EARTH_R*Math.asin(Math.min(1,Math.sqrt(h)));
}

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rnd = mulberry32(20261022);
const pick = a => a[Math.floor(rnd()*a.length)];
const range = (a,b) => a + rnd()*(b-a);

const DISTRICTS = [
  {name:"Yunusobod",x:12900,y:4300},{name:"Olmazor",x:7600,y:5200},{name:"Shayxontohur",x:8900,y:8300},
  {name:"Mirzo Ulug'bek",x:17200,y:7000},{name:"Mirobod",x:14300,y:10600},{name:"Yakkasaroy",x:11700,y:11900},
  {name:"Chilonzor",x:7200,y:12300},{name:"Uchtepa",x:3600,y:10600},{name:"Yashnobod",x:18600,y:11900},
  {name:"Sergeli",x:10600,y:16300},{name:"Bektemir",x:21000,y:15600},{name:"Yangihayot",x:5600,y:16200}
];
function ellipsePts(cx,cy,rx,ry,n){const p=[];for(let i=0;i<=n;i++){const t=i/n*Math.PI*2;p.push([Math.round(cx+rx*Math.cos(t)),Math.round(cy+ry*Math.sin(t))]);}return p;}
const ROADS = [
  {name:"Amir Temur shoh ko'chasi",major:true,label:true,pts:[[12000,9000],[12250,6500],[12600,3800],[12900,1200],[13000,-300]]},
  {name:"Shota Rustaveli ko'chasi",major:false,label:true,pts:[[12100,9150],[12400,11500],[12700,13200],[13100,18300]]},
  {name:"Bunyodkor shoh ko'chasi",major:true,label:true,pts:[[11400,9800],[9600,11200],[7400,12600],[4600,14300],[-300,16800]]},
  {name:"Mustaqillik shoh ko'chasi",major:true,label:true,pts:[[12300,8800],[14500,7900],[17300,6600],[20200,5200],[24300,3600]]},
  {name:"Navoiy ko'chasi",major:false,label:true,pts:[[11800,8900],[10000,8500],[8000,7900],[5600,7600],[2400,7500],[-300,7600]]},
  {name:"Farg'ona yo'li",major:true,label:true,pts:[[12600,9500],[14800,11000],[17400,12700],[20300,14700],[24300,17000]]},
  {name:"Labzak ko'chasi",major:false,label:true,pts:[[8800,5400],[10700,6700],[12250,7600]]},
  {name:"Qatortol ko'chasi",major:false,label:true,pts:[[6900,9000],[6600,12500],[6300,16800]]},
  {name:"Osiyo ko'chasi",major:false,label:true,pts:[[15200,2800],[15600,6800],[15900,10800],[16400,14800]]},
  {name:"Kichik halqa yo'li",major:false,label:false,pts:ellipsePts(11900,9100,4300,3600,56)},
  {name:"Katta halqa yo'li",major:true,label:false,pts:ellipsePts(12000,9300,10200,7600,80)}
];
const WATER = [
  {name:"Anhor kanali",pts:[[10300,-300],[10900,2500],[11300,5200],[11500,7600],[11650,9200],[11900,11200],[12500,13700],[13700,16300],[14400,18300]]},
  {name:"Bo'zsuv kanali",pts:[[5800,-300],[6600,3000],[7300,6200],[7900,9400],[8500,12800],[9200,15800],[9800,18300]]},
  {name:"Salor kanali",pts:[[16000,-300],[16600,3000],[17200,6000],[18300,9000],[19600,12500],[21200,18300]]}
];
const PARKS = [
  [12000,9000,270,250,0],[12900,5750,360,260,-10],[13900,4900,720,480,15],[13250,9700,430,250,-20],
  [13700,11300,620,420,10],[10500,10600,460,330,0],[16800,8200,500,300,25],[5200,9800,520,340,-15],[19400,10100,420,300,0]
];

