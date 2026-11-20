/* ---------- toifalar ---------- */
const CATS = {
  barber:{label:"Sartaroshxona",color:"#4f46e5"},
  shop:{label:"Do'kon",color:"#db2777"},
  food:{label:"Oziq-ovqat",color:"#ea580c"},
  pharm:{label:"Dorixona",color:"#16a34a"},
  auto:{label:"Avtoservis",color:"#57534e"},
  repair:{label:"Maishiy ta'mir",color:"#7c3aed"}
};
const CAT_KEYS = Object.keys(CATS);
const PTYPES = {
  gov:{label:"Davlat tashkilotlari",one:"Davlat tashkiloti",color:"#1e3a8a",hours:"Du–Ju, 09:00–18:00"},
  park:{label:"Parklar",one:"Park",color:"#4d7c0f",hours:"Har kuni, 07:00–23:00"},
  tour:{label:"Turistik joylar",one:"Turistik joy",color:"#b45309",hours:"Har kuni, 09:00–20:00"},
  school:{label:"Maktablar",one:"Maktab",color:"#0369a1",hours:"Du–Sh, 08:00–18:00"},
  kinder:{label:"Bog'chalar",one:"Bog'cha (DMTT)",color:"#c026d3",hours:"Du–Ju, 07:00–19:00"},
  airport:{label:"Aeroport",one:"Aeroport",color:"#334155",hours:"Har kuni, 24 soat"},
  museum:{label:"Muzeylar",one:"Muzey",color:"#7f1d1d",hours:"Se–Ya, 10:00–17:00"}
};
const DAYS = ["Du","Se","Ch","Pa","Ju","Sh","Ya"];
const DAYS_FULL = ["dushanba","seshanba","chorshanba","payshanba","juma","shanba","yakshanba"];
const ALL=[0,1,2,3,4,5,6], WK=[0,1,2,3,4,5];

const NAMES = {
  barber:["Usta Barber","Sharq sartaroshxonasi","Kamalak barbershop","Javohir sartaroshxonasi","Klassik erkaklar","Oydin go'zallik saloni","Shox Barber","Ustoz Hair Studio","Navbahor sartaroshxonasi","Qaychi va ustara","Yangi Uslub","Bek Barber"],
  shop:["Baraka do'koni","Mahalla market","Kundalik 24","Xonadon savdo","Oila market","Nur do'koni","Yangi Kun minimarket","Do'stlik savdo","Tejamkor","Bozorcha","Orzu market","Saxovat do'koni"],
  food:["Bahor choyxonasi","Somsa uyi","Lazzat oshxonasi","Tandir non","Milliy taomlar","Sharq kafesi","Palov markazi","Mazali lavash","Qozon kabob","Tushlik vaqti","Shirin non","Do'mbira kafe"],
  pharm:["Shifo dorixonasi","Salomatlik","Dori-Darmon 24","Malham dorixonasi","Sog'lom oila","Davo dorixonasi","Hayot dorixonasi","Malhambaxsh","Sihat","Tabib"],
  auto:["Usta Avto","Tez shina","Motor servis","Avto Yordam","Moy almashtirish nuqtasi","G'ildirak ustaxonasi","Avto Diagnostika","Kuzov ustasi","Yo'lchi servis","Tormoz markazi"],
  repair:["Telefon ustasi","Poyabzal ta'miri","Soat ustaxonasi","Kalit va qulf","Maishiy texnika ta'miri","Tikuvchilik ustaxonasi","Kompyuter servis","Muzlatkich ustasi","Elektrik usta","Mebel ta'miri"]
};
const DESCS = {
  barber:["Erkaklar va bolalar uchun soch olish, soqol dizayni. Oldindan yozilish mumkin.","Klassik va zamonaviy soch turmaklari, issiq sochiq bilan soqol olish."],
  shop:["Kundalik oziq-ovqat, ichimliklar, maishiy kimyo. Kartadan to'lov qabul qilinadi.","Yangi non har kuni ertalab, sut mahsulotlari va meva-sabzavot."],
  food:["Milliy taomlar, tushlik menyusi. Olib ketish va yetkazib berish bor.","Tandir somsa, palov, sho'rva. Oilaviy xonalar mavjud."],
  pharm:["Retseptli va retseptsiz dorilar, tibbiy buyumlar. Farmatsevt maslahati.","Dorilar, vitaminlar, bolalar uchun mahsulotlar."],
  auto:["Moy almashtirish, diagnostika, yurish qismi ta'miri.","Shina montaji, balansirovka, tormoz tizimi."],
  repair:["Telefon, planshet va noutbuk ta'miri. Ehtiyot qismlar joyida.","Tez va kafolatli ta'mir, narx oldindan aytiladi."]
};
const PRICES = {
  barber:[["Erkaklar soch olishi",35000,60000],["Soqol olish",20000,35000],["Bolalar soch olishi",25000,40000]],
  shop:[["Non (dona)",3000,4500],["Sut, 1 litr",11000,14000],["Tuxum, 10 dona",15000,19000]],
  food:[["Osh (porsiya)",35000,50000],["Somsa (dona)",7000,10000],["Lag'mon",30000,42000]],
  pharm:[["Paratsetamol, 10 tabletka",4000,7000],["Tibbiy niqob, 10 dona",8000,12000],["Termometr",25000,45000]],
  auto:[["Moy almashtirish (ish haqi)",50000,90000],["Shina montaji, 4 dona",80000,140000],["Kompyuter diagnostikasi",100000,180000]],
  repair:[["Telefon ekranini almashtirish",250000,600000],["Poyabzal tagini almashtirish",60000,120000],["Kalit nusxasi",15000,30000]]
};
const REVIEWS = {
  barber:{pos:["Usta juda e'tiborli, soch olish 20 daqiqada tayyor bo'ldi.","Navbat tez yurdi, narxi ham mos.","Doim shu yerga kelaman, soqolni juda toza olishadi."],mid:["Yaxshi, lekin dam olish kunlari navbat uzun."],neg:["Yozilgan vaqtimda 30 daqiqa kutib qoldim."]},
  shop:{pos:["Mahsulotlar yangi, kassada kutish yo'q.","Narxlar atrofdagi do'konlardan arzonroq.","Kech soatlarda ham ochiq, juda qulay."],mid:["Assortiment yomon emas, lekin kechqurun non tugab qoladi."],neg:["Bir mahsulotning muddati o'tgan ekan, tekshirib oling."]},
  food:{pos:["Palovi zo'r, porsiya katta.","Somsa issiq va mazali, xizmat tez.","Oila bilan kelish uchun qulay joy."],mid:["Taom yaxshi, ammo tushlikda joy topish qiyin."],neg:["Buyurtma 40 daqiqa kechikdi."]},
  pharm:{pos:["Farmatsevt yaxshi maslahat berdi.","Kerakli dorilar doim bor.","Tunda ham yordam berishdi, rahmat."],mid:["Narxlar biroz qimmatroq."],neg:["Retseptdagi dori yo'q ekan, boshqa joyga bordim."]},
  auto:{pos:["Moy almashtirish 15 daqiqada tugadi.","Usta muammoni tez topdi, ortiqcha pul so'ramadi.","Shina montaji sifatli."],mid:["Ish yaxshi, lekin oldindan yozilish kerak."],neg:["Aytilgan vaqtda tayyor bo'lmadi."]},
  repair:{pos:["Telefon ekranini bir kunda almashtirib berishdi.","Poyabzalni yangidek qilib berishdi.","Narxi oldindan aytildi, keyin oshmadi."],mid:["Sifat yaxshi, lekin 3 kun kutdim."],neg:["Ta'mirdan keyin muammo yana takrorlandi."]}
};
const PEOPLE = ["Dilnoza R.","Jasur T.","Malika A.","Sardor X.","Nodira S.","Bekzod M.","Gulnora Q.","Otabek N.","Shahzoda U.","Aziz K.","Madina Y.","Javlon E.","Feruza B.","Sherzod I.","Kamola O.","Doniyor F."];
const MAHALLA = ["Bodomzor","Navbahor","Do'stlik","Mehrjon","Bog'ishamol","Ko'kcha","Beshyog'och","Qoratosh","Nurafshon","Guliston","Olmazor","Ziyokor","Tinchlik","Istiqlol"];
const HOURS = {
  barber:()=>({open:pick(["09:00","10:00"]),close:pick(["20:00","21:00"]),days:rnd()<.5?ALL:WK}),
  shop:()=>rnd()<.25?{h24:true,days:ALL}:{open:"07:00",close:pick(["22:00","23:00"]),days:ALL},
  food:()=>({open:pick(["08:00","09:00","11:00"]),close:pick(["22:00","23:00"]),days:ALL}),
  pharm:()=>rnd()<.3?{h24:true,days:ALL}:{open:"08:00",close:"22:00",days:ALL},
  auto:()=>({open:"09:00",close:pick(["18:00","19:00"]),days:WK}),
  repair:()=>({open:"10:00",close:"19:00",days:WK})
};

