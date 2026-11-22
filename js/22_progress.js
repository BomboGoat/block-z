/* v21.0 "Progresión": painted skins (real outfits, not tints), chests with a 4-slot bar, a free battle pass and
   daily/weekly missions. Everything is saved in the same profile (bz_profile, now v2) and nothing costs real money.
   Hooks wrap existing functions only; untouched screens and gameplay render exactly as before. */

/* ---------- painted skins ---------- */
/* each skin id maps base sprite names to a repainted sprite with the same canvas size and silhouette, so the hero rig
   (fractional arm polygons) cuts it exactly like the original; *_hd versions feed the ending close-ups */
var REAL_SKINS={
  dorado:{classic_f:1,classic_b:1,trueno_f:1,trueno_laser_f:1,mr_f:1,gompa_f:1,neizan_f:1},
  ninja:{classic_f:1,classic_b:1},cyber:{trueno_f:1,trueno_laser_f:1},
  cazador:{mr_f:1},gladiador:{gompa_f:1},cromo:{neizan_f:1}
};
var SKIN_IMG={},SKIN_LOADED=0;
function skinImg(file){
  var o=SKIN_IMG[file];if(o)return o.ok?o.im:null;
  o=SKIN_IMG[file]={im:new Image(),ok:0,tries:0};
  o.im.onload=function(){if(o.im.width){o.ok=1;SKIN_LOADED++;if(typeof menuDirty!=="undefined")menuDirty=1;}};
  o.im.onerror=function(){if(++o.tries<4)setTimeout(function(){o.im.src="assets/spr/skins/"+file+".webp?v=21.0&r="+o.tries;},1500*o.tries);};
  o.im.src="assets/spr/skins/"+file+".webp?v=21.0";return null;
}
function skinIsReal(id){return !!REAL_SKINS[id];}
/* warm every normal-size sprite of one skin (menu preview, countdown) */
function skinWarm(hero,id){var R=REAL_SKINS[id];if(!R||typeof ART_MAP==="undefined"||!ART_MAP[hero])return;var M=ART_MAP[hero],k;for(k in M){var n=M[k];if(R[n])skinImg(n+"_"+id);}}
(function(){
  var _t=artTint;
  artTint=function(name,img,tint){
    var R=REAL_SKINS[tint];
    if(R&&R[name]){
      var meta=ART.meta&&ART.meta[name],hd=!!(meta&&(img.naturalWidth||img.width)>meta.w*1.5);
      var im=skinImg(name+"_"+tint+(hd?"_hd":""));
      if(im){im._skinBase=img;return im;}
      return hd?null:img; /* still loading: base sprite for a frame or two (HD close-ups fall back to the normal skin) */
    }
    return _t(name,img,tint);
  };
  if(typeof finHDLoad==="function"){var _fl=finHDLoad;finHDLoad=function(name){_fl(name);try{var t=game.player.look.tint;if(REAL_SKINS[t]&&REAL_SKINS[t][name])skinImg(name+"_"+t+"_hd");}catch(e){}};}
})();
if(typeof SKIN_TINT!=="undefined")delete SKIN_TINT.dorado;
/* skin lists: the old colour variants stay (nobody loses one), "dorado" becomes the painted Oro outfit, and each hero
   gets an exclusive outfit that only drops from chests or the pass */
SKINS.classic=[{id:"orig",name:"Original"},{id:"sombra",name:"Sombra",lv:3},{id:"dorado",name:"Oro",cost:400,real:1,pc:10},{id:"ninja",name:"Ninja Sombra",ex:1,real:1,pc:15}];
SKINS.trueno=[{id:"orig",name:"Original"},{id:"carmesi",name:"Carmesí",lv:5},{id:"hielo",name:"Hielo",cost:400},{id:"dorado",name:"Oro",cost:900,real:1,pc:10},{id:"cyber",name:"Cyber Neón",ex:1,real:1,pc:15}];
SKINS.mr=[{id:"orig",name:"Original"},{id:"fantasma",name:"Fantasma",lv:7},{id:"carmesi",name:"Carmesí",cost:400},{id:"dorado",name:"Oro",cost:900,real:1,pc:10},{id:"cazador",name:"Cazazombis",ex:1,real:1,pc:15}];
SKINS.gompa=[{id:"orig",name:"Original"},{id:"dorado",name:"Oro",lv:10,real:1,pc:10},{id:"toxico",name:"Tóxico",cost:400},{id:"gladiador",name:"Gladiador",ex:1,real:1,pc:15}];
SKINS.neizan=[{id:"orig",name:"Original"},{id:"hielo",name:"Hielo",lv:8},{id:"dorado",name:"Oro",cost:400,real:1,pc:10},{id:"cromo",name:"Cromo",ex:1,real:1,pc:15}];
(function(){var _ur=unlockedReq;unlockedReq=function(it,key){if(key&&PROF&&PROF.own[key])return 1;if(it&&it.ex)return 0;return _ur(it,key);};})();
function skinDef(hero,id){var l=SKINS[hero]||[];for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];return null;}
function p21HeroName(id){var h=HEROES.filter(function(x){return x.id===id;})[0];return h?h.name:id;}
function lockedRealSkins(exOnly){var out=[],h,i;for(h in SKINS)for(i=0;i<SKINS[h].length;i++){var s=SKINS[h][i];if(s.real&&!skinOk(h,s)&&(!exOnly||s.ex))out.push({hero:h,id:s.id,ex:!!s.ex});}return out;}

/* ---------- profile v2 (versioned, lossless migration) ---------- */
PROF_DEF.v=2;
PROF_DEF.chests=[null,null,null,null];
PROF_DEF.pass={xp:0,claimed:{},season:1};
PROF_DEF.miss={day:"",daily:[],week:"",weekly:[]};
PROF_DEF.pieces={};PROF_DEF.titles={};PROF_DEF.newSkin={};PROF_DEF.eq.title="";
function profMigrate(p){
  if(!p)return p;
  if(!(p.v>=2)){try{lsSet("bz_profile_v1_backup",JSON.parse(JSON.stringify(p)));}catch(e){}}
  (function fill(dst,src){for(var k in src){if(dst[k]==null)dst[k]=JSON.parse(JSON.stringify(src[k]));else if(typeof src[k]==="object"&&!Array.isArray(src[k])&&typeof dst[k]==="object")fill(dst[k],src[k]);}})(p,PROF_DEF);
  if(!Array.isArray(p.chests))p.chests=[null,null,null,null];while(p.chests.length<4)p.chests.push(null);p.chests.length=4;
  if(!(p.v>=2)){p.v=2;p._migratedFrom1=Date.now();}
  return p;
}
(function(){var _pl=profLoad;profLoad=function(){var p=_pl();PROF=profMigrate(p);return PROF;};})();
PROF=profMigrate(PROF);profSave();

/* ---------- small helpers ---------- */
function p21Rand(a,b){return Math.round(a+Math.random()*(b-a));}
function dayKey(d){d=d||new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();}
function weekKey(d){d=d||new Date();var m=new Date(d.getFullYear(),d.getMonth(),d.getDate());m.setDate(m.getDate()-((m.getDay()+6)%7));return "w"+dayKey(m);}
function untilMidnight(){var d=new Date(),n=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1);return (n-d)/1000;}
function untilMonday(){var d=new Date(),n=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1);n.setDate(n.getDate()+((8-n.getDay())%7));return (n-d)/1000;}
function fmtLeft(s){s=Math.max(0,s|0);var d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return d?d+" d "+h+" h":h?h+" h "+m+" min":m+" min";}
function rainbowCol(t,o,l){return "hsl("+(((t*120+(o||0))%360+360)%360|0)+",95%,"+(l||62)+"%)";}

/* ---------- battle pass ---------- */
var PASS_TIER_XP=300,PASS_TIERS=30;
var PASS=[
  {k:"coins",n:100},{k:"chest",r:"poco"},{k:"title",id:"novato",name:"🧟 Cazador novato"},{k:"coins",n:150},{k:"chest",r:"epico"},
  {k:"pieces",n:5},{k:"coins",n:200},{k:"chest",r:"poco"},{k:"coins",n:250},{k:"title",id:"imparable",name:"⚡ Imparable"},
  {k:"chest",r:"poco"},{k:"chest",r:"epico"},{k:"coins",n:300},{k:"pieces",n:8},{k:"skin",hero:"trueno",id:"cyber"},
  {k:"coins",n:350},{k:"chest",r:"poco"},{k:"coins",n:400},{k:"title",id:"superviviente",name:"🛡️ Superviviente"},{k:"chest",r:"asombroso"},
  {k:"coins",n:450},{k:"title",id:"rey",name:"👑 Rey del Bloque"},{k:"chest",r:"epico"},{k:"pieces",n:10},{k:"chest",r:"epico"},
  {k:"coins",n:500},{k:"chest",r:"poco"},{k:"coins",n:600},{k:"chest",r:"epico"},{k:"skin",hero:"neizan",id:"cromo",title:{id:"leyenda",name:"🌈 Leyenda Z"}}
];
function passTier(){return Math.min(PASS_TIERS,Math.floor(PROF.pass.xp/PASS_TIER_XP));}
function passClaimable(){var t=passTier(),n=0;for(var i=0;i<t;i++)if(!PROF.pass.claimed[i+1])n++;return n;}
function passAddXP(n,quiet){
  if(!(n>0))return;var t0=passTier();PROF.pass.xp=Math.min(PASS_TIERS*PASS_TIER_XP,PROF.pass.xp+Math.round(n));var t1=passTier();
  if(t1>t0&&!quiet){P21.passUp=t1;if(game&&MENU_ST[game.state])menuToast("🎖️ ¡Nivel "+t1+" del pase!","#80d8ff");}
}

/* ---------- chests ---------- */
var CHEST={
  poco:{n:"Poco raro",c:"#4fc3f7",c2:"#0d47a1",img:"chest_c",p:72,coins:[60,120],pxp:80,skin:4,pcs:[2,3],pcsP:55},
  epico:{n:"Épico",c:"#b388ff",c2:"#4a148c",img:"chest_e",p:24,coins:[160,280],pxp:200,skin:18,pcs:[4,6],pcsP:100},
  asombroso:{n:"Asombroso",c:"rainbow",c2:"#004d40",img:"chest_a",p:4,coins:[420,650],pxp:400,skin:100,pcs:[8,10],pcsP:100}
};
var CHEST_IMG={};
function chestImg(k,open){var key=CHEST[k].img+(open?"_open":"");var o=CHEST_IMG[key];if(o)return o.width?o:null;o=CHEST_IMG[key]=new Image();o.onload=function(){if(typeof menuDirty!=="undefined")menuDirty=1;};o.src="assets/ui/"+key+".webp?v=21.0";return null;}
function chestRoll(min){var r=Math.random()*100;var k=r<CHEST.asombroso.p?"asombroso":r<CHEST.asombroso.p+CHEST.epico.p?"epico":"poco";if(min==="epico"&&k==="poco")k="epico";return k;}
function chestGrant(r){var i=PROF.chests.indexOf(null);if(i<0)return -1;PROF.chests[i]={r:r,t:Date.now()};profSave();return i;}
function chestRewards(r){
  var C=CHEST[r],out=[],locked=lockedRealSkins(),lockedEx=locked.filter(function(s){return s.ex;});
  out.push({k:"coins",n:p21Rand(C.coins[0],C.coins[1])});
  out.push({k:"pxp",n:C.pxp});
  if(locked.length&&Math.random()*100<C.skin){
    /* rarer chests lean harder towards the exclusive outfits */
    var exP={poco:0.55,epico:0.65,asombroso:0.75}[r],pool=(lockedEx.length&&Math.random()<exP)?lockedEx:locked;
    var s=pool[Math.floor(Math.random()*pool.length)];out.push({k:"skin",hero:s.hero,id:s.id});
    locked=locked.filter(function(q){return !(q.hero===s.hero&&q.id===s.id);});
  }
  if(locked.length&&Math.random()*100<C.pcsP){var s2=locked[Math.floor(Math.random()*locked.length)];out.push({k:"pieces",hero:s2.hero,id:s2.id,n:p21Rand(C.pcs[0],C.pcs[1])});}
  if(!lockedRealSkins().length)out.push({k:"coins",n:{poco:80,epico:200,asombroso:600}[r],bonus:1});
  return out;
}
function rewardApply(w){
  if(w.k==="coins")PROF.coins+=w.n;
  else if(w.k==="pxp")passAddXP(w.n,1);
  else if(w.k==="skin"){var key="skin:"+w.hero+":"+w.id;if(PROF.own[key]){PROF.coins+=500;w.dup=1;}else{PROF.own[key]=1;PROF.newSkin[w.hero]=1;}}
  else if(w.k==="pieces"){
    if(!w.hero){var l=lockedRealSkins();if(!l.length){w.k="coins";w.n=w.n*40;PROF.coins+=w.n;return w;}var s=l[Math.floor(Math.random()*l.length)];w.hero=s.hero;w.id=s.id;}
    var pk=w.hero+":"+w.id,d=skinDef(w.hero,w.id),need=(d&&d.pc)||10;PROF.pieces[pk]=(PROF.pieces[pk]||0)+w.n;
    if(PROF.pieces[pk]>=need&&!PROF.own["skin:"+pk]){PROF.own["skin:"+pk]=1;PROF.newSkin[w.hero]=1;w.done=1;delete PROF.pieces[pk];}
  }
  else if(w.k==="title"){PROF.titles[w.id]=w.name;PROF.eq.title=w.id;}
  return w;
}
function chestOpenStart(r,slot){
  var rw=chestRewards(r);for(var i=0;i<rw.length;i++)rewardApply(rw[i]);
  if(slot!=null&&slot>=0)PROF.chests[slot]=null;
  profSave();checkAchievements(1);
  chestImg(r,0);chestImg(r,1);
  for(i=0;i<rw.length;i++)if(rw[i].hero&&rw[i].id)skinWarm(rw[i].hero,rw[i].id);
  P21.open={r:r,t:0,rw:rw,boom:0,sfxI:0,parts:[]};
  try{sfx("whoosh");}catch(e){}
}

/* ---------- missions ---------- */
var MISS_DAILY=[
  {t:"kill",n:[120,180,250],x:150,d:"Elimina {n} zombis"},{t:"play",n:[2,3],x:120,d:"Juega {n} partidas"},
  {t:"ulti",n:[3,5,8],x:150,d:"Usa la ulti {n} veces"},{t:"round",n:[4,5,6],x:180,d:"Llega a la ronda {n}"},
  {t:"boss",n:[1,2],x:200,d:"Derrota {n} jefe{s}"},{t:"winh",n:[1],x:250,d:"Gana una partida con {h}"},{t:"win",n:[1],x:220,d:"Gana una partida"}
];
var MISS_WEEKLY=[
  {t:"kill",n:[1200,1800],x:600,d:"Elimina {n} zombis"},{t:"play",n:[10,14],x:500,d:"Juega {n} partidas"},
  {t:"ulti",n:[25,40],x:550,d:"Usa la ulti {n} veces"},{t:"boss",n:[6,9],x:650,d:"Derrota {n} jefes"},
  {t:"win",n:[3,5],x:800,d:"Gana {n} partidas"},{t:"hell",n:[1],x:900,d:"Derrota a Vorgath"},{t:"round",n:[8],x:600,d:"Llega a la ronda {n}"}
];
var MISS_ICON={kill:"🧟",play:"🎮",ulti:"🌟",round:"🌊",boss:"👹",winh:"🦸",win:"🏆",hell:"🌀"};
function missMake(pool,k){
  var p=pool.slice(),out=[],i;
  for(i=0;i<k&&p.length;i++){var j=Math.floor(Math.random()*p.length),T=p.splice(j,1)[0],n=T.n[Math.floor(Math.random()*T.n.length)];
    var m={t:T.t,n:n,x:T.x+(n>T.n[0]?Math.round(T.x*0.2):0),p:0,c:0,d:T.d};
    if(T.t==="winh")m.h=HEROES[Math.floor(Math.random()*HEROES.length)].id;
    out.push(m);}
  return out;
}
function missText(m){return m.d.replace("{n}",fmtN(m.n)).replace("{s}",m.n>1?"s":"").replace("{h}",p21HeroName(m.h));}
function missRefresh(){
  var M=PROF.miss,dk=dayKey(),wk=weekKey(),ch=0;
  if(M.day!==dk){M.day=dk;M.daily=missMake(MISS_DAILY,3);ch=1;}
  if(M.week!==wk){M.week=wk;M.weekly=missMake(MISS_WEEKLY,3);ch=1;}
  if(ch)profSave();
}
function missAll(){return PROF.miss.daily.concat(PROF.miss.weekly);}
function missClaimable(){return missAll().filter(function(m){return !m.c&&m.p>=m.n;}).length;}
/* progress events; a mission that completes during a run pops a small toast in the HUD */
function missEvent(t,v,h){
  var L=missAll(),i,hit=0;
  for(i=0;i<L.length;i++){var m=L[i];if(m.c||m.p>=m.n)continue;
    if(m.t!==t)continue;if(t==="winh"&&m.h!==h)continue;
    var was=m.p;if(t==="round")m.p=Math.max(m.p,v);else m.p=Math.min(m.n,m.p+v);if(m.p>m.n)m.p=m.n;
    if(m.p!==was)hit=1;
    if(m.p>=m.n&&was<m.n){P21.toasts.push({txt:"✅ "+missText(m),sub:"+"+m.x+" XP de pase",t:0});if(game&&MENU_ST[game.state])menuToast("✅ Misión completada: "+missText(m),"#b9f6ca");}
  }
  return hit;
}

/* ---------- run tracking ---------- */
var P21={toasts:[],run:null,open:null,info:0,passUp:0,pscroll:null,pv:0,pdrag:null,claimFx:[],seenT:0};
(function(){
  var _rs=profRunStart;
  profRunStart=function(){_rs();missRefresh();P21.run={kills:game.kills|0,sup:0,round:1,chest:0,hellChest:0,boss:0};try{var p=game.player;if(p&&p.look&&p.look.tint)skinWarm(p.hero,p.look.tint);}catch(e){}};
  var _re=profRunEnd;
  profRunEnd=function(kind){
    var before=MENU.runDone,beforeHell=MENU.hellDone;_re(kind);
    var R=P21.run;if(!R||!MENU.lastRun)return;
    var counted=(kind==="hell")?!beforeHell:!before;if(!counted)return;
    var g=game,round=kind==="hell"?10:(g.wave|0)+1,win=kind==="victory"||kind==="hell",lr=MENU.lastRun;
    var ch=null,full=0;
    if(kind==="hell"&&!R.hellChest){R.hellChest=1;var r1=chestRoll("epico");if(chestGrant(r1)>=0)ch=r1;else full=1;}
    else if(!R.chest&&(win||round>=6)){R.chest=1;var r0=chestRoll();if(chestGrant(r0)>=0)ch=r0;else full=1;}
    var pxp=Math.round(round*12+(g.kills|0)*0.15+(win?150:0)+(kind==="hell"?250:0));if(kind==="hell"&&before)pxp=250;
    passAddXP(pxp,1);
    if(!before||kind!=="hell"){missEvent("play",1);}
    if(win&&!(kind==="hell"&&before)){missEvent("win",1);missEvent("winh",1,g.player&&g.player.hero);}
    if(kind==="hell"){missEvent("hell",1);missEvent("boss",1);}
    missEvent("round",round);
    lr.pxp=(lr.pxp||0)+pxp;if(ch)lr.chest=ch;if(full)lr.chestFull=1;
    profSave();
  };
  var _wc=onWaveCleared;
  onWaveCleared=function(){var b=game&&game.bossFight;_wc.apply(this,arguments);if(b&&P21.run){missEvent("boss",1);profSave();}};
  var _gt=menuGameTick;
  menuGameTick=function(dt){
    _gt(dt);
    var g=game;if(!g)return;var R=P21.run,p=g.player;
    if(R&&p&&(g.state==="playing"||g.state==="boss_intro"||/^hell/.test(g.state))){
      var k=g.kills|0;if(k>R.kills){missEvent("kill",k-R.kills);R.kills=k;}else if(k<R.kills)R.kills=k;
      var sc=typeof superCost==="function"?superCost(p):100,sv=p.super||0;
      if(R.sup>=sc-0.01&&sv<sc*0.5)missEvent("ulti",1);R.sup=sv;
      var rd=(g.wave|0)+1;if(rd>R.round){R.round=rd;missEvent("round",rd);}
    }
    if(g.state==="countdown"&&p&&p.look&&p.look.tint)skinWarm(p.hero,p.look.tint);
    for(var i=0;i<P21.toasts.length;i++){P21.toasts[i].t+=dt;if(P21.toasts[i].t>3.2){P21.toasts.splice(i,1);i--;}}
  };
  /* in-run mission toast (top centre, small) */
  var _hud=drawHUD;
  drawHUD=function(){_hud.apply(this,arguments);if(P21.toasts.length)p21DrawRunToast();};
  /* end screens: pass XP and the chest you earned */
  var _rr=drawRunRewards;
  drawRunRewards=function(){_rr();var r=MENU.lastRun;if(!r)return;
    var parts=[];if(r.pxp)parts.push("🎖️ +"+fmtN(r.pxp)+" XP de pase");if(r.chest)parts.push("🎁 ¡Cofre "+CHEST[r.chest].n+"!");else if(r.chestFull)parts.push("🎁 Ranuras llenas: abre un cofre");
    if(!parts.length)return;var txt=parts.join("   ·   "),y=SH*0.45+36;
    ctx.save();ctx.font="900 13px system-ui";var tw=ctx.measureText(txt).width+32,col=r.chest?(r.chest==="asombroso"?rainbowCol(MENU.t||0):CHEST[r.chest].c):"#80d8ff";
    ctx.fillStyle="rgba(20,12,30,0.85)";roundRect(ctx,SW/2-tw/2,y-13,tw,26,13);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=2;roundRect(ctx,SW/2-tw/2,y-13,tw,26,13);ctx.stroke();
    mText(txt,SW/2,y,13,"#fff","center","900",0);ctx.restore();};
})();
function p21DrawRunToast(){
  var T=P21.toasts[0],a=clamp(Math.min(T.t*5,(3.2-T.t)*3),0,1),s=layout.safe;
  ctx.save();ctx.globalAlpha=a;ctx.font="900 12px system-ui";var tw=Math.max(ctx.measureText(T.txt).width,ctx.measureText(T.sub).width)+34,x=SW/2-tw/2,y=s.t+44-(1-a)*14;
  ctx.fillStyle="rgba(12,30,18,0.9)";roundRect(ctx,x,y,tw,36,12);ctx.fill();ctx.strokeStyle="#69f0ae";ctx.lineWidth=2;roundRect(ctx,x,y,tw,36,12);ctx.stroke();
  mText(T.txt,SW/2,y+12,12,"#b9f6ca","center","900",3);mText(T.sub,SW/2,y+26,10,"#80d8ff","center","800",2.5);
  ctx.restore();
}
missRefresh();
try{var _eqh=selectedHero||"classic";skinWarm(_eqh,equippedSkin(_eqh));}catch(e){}

/* ---------- menu: title additions ---------- */
MENU_ST.pass=1;MENU_ST.missions=1;
function menuBadge(id){
  if(id==="pass")return passClaimable();
  if(id==="missions")return missClaimable();
  if(id==="heroes"){var n=0,h;for(h in PROF.newSkin)if(PROF.newSkin[h])n++;return n;}
  if(id==="achievements")return ACHS.filter(function(a){return !PROF.ach[a.id]&&a.val()>=a.goal;}).length;
  return 0;
}
function drawBadgeDot(x,y,n){
  var r=8+Math.sin((MENU.t||0)*5)*0.8;ctx.fillStyle="#ff1744";ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.stroke();
  mText(n>9?"9+":String(n),x,y+0.5,10,"#fff","center","900",0);
}
/* skin portrait (head + shoulders) for chips and reward cards */
var SKIN_THUMB={};
function skinThumb(hero,id,S){
  var key=hero+"|"+id+"|"+S,c=SKIN_THUMB[key];if(c)return c;
  var look=makeHeroLook(hero);look.tint=id&&id!=="orig"?id:null;var e=artEntry(look,2,"idle");if(!e)return null;
  if(REAL_SKINS[id]&&e.img===ART.imgs[e.name])return null; /* painted sprite still loading */
  var K=Math.min(2,dpr||1);c=document.createElement("canvas");c.width=c.height=Math.ceil(S*K);var g=c.getContext("2d");g.scale(K,K);
  var iw=e.img.naturalWidth||e.img.width,ih=e.img.naturalHeight||e.img.height,ex=(e.meta.ex!=null?e.meta.ex:0.5)*iw,ey=(e.meta.ey!=null?e.meta.ey:0.2)*ih,cw=ih*0.42;
  g.drawImage(e.img,ex-cw/2,Math.max(0,ey-cw*0.42),cw,cw,0,0,S,S);
  SKIN_THUMB[key]=c;return c;
}
function chestSlotsGeom(){
  var s=layout.safe,hero=selectedHero||"classic",H=Math.min(SH*0.62,250),hx=s.l+Math.min(SW*0.2,170);
  var bw=Math.min(300,SW*0.36),bx=SW-s.r-12-bw,lx0=hx+H*0.3,lmax=bx-lx0-12;
  var n=4,gap=8,S=Math.max(40,Math.min(66,(lmax-gap*(n-1))/n)),W=S*n+gap*(n-1),x0=lx0+lmax/2-W/2,y0=SH-s.b-S-14;
  return {x0:x0,y0:y0,S:S,gap:gap,W:W};
}
function drawChestBar(){
  var G=chestSlotsGeom(),i,t=MENU.t||0,n=PROF.chests.filter(function(c){return c;}).length;
  mText("COFRES "+n+"/4",G.x0+2,G.y0-11,11,"#ffe08a","left","900",3);
  var ib=18;mButton("chest_info",G.x0+G.W-ib,G.y0-21,ib,ib,"i",null,"dark",{fs:12,r:9});
  for(i=0;i<4;i++){
    var c=PROF.chests[i],x=G.x0+i*(G.S+G.gap),y=G.y0,S=G.S,k=mPressK("chest"+i);
    ctx.save();ctx.translate(x+S/2,y+S/2);ctx.scale(k,k);ctx.translate(-S/2,-S/2);
    ctx.fillStyle="rgba(14,8,22,0.72)";roundRect(ctx,0,0,S,S,12);ctx.fill();
    if(c){var C=CHEST[c.r]||CHEST.poco,col=C.c==="rainbow"?rainbowCol(t,i*40):C.c;
      var gl=typeof glowSpr==="function"?glowSpr(C.c==="rainbow"?"#ffffff":C.c):null;if(gl){ctx.globalAlpha=0.5+0.2*Math.sin(t*3+i);ctx.drawImage(gl,-S*0.2,-S*0.15,S*1.4,S*1.3);ctx.globalAlpha=1;}
      var im=chestImg(c.r,0),bob=Math.sin(t*2.4+i*1.3)*1.5;if(im){var w=S*0.84,h=w*im.height/im.width;ctx.drawImage(im,S/2-w/2,S*0.48-h/2+bob,w,h);}
      ctx.strokeStyle=col;ctx.lineWidth=2.2;roundRect(ctx,1,1,S-2,S-2,12);ctx.stroke();
      mText("ABRIR",S/2,S-7,8.5,"#fff","center","900",2.5);
    }else{ctx.strokeStyle="rgba(255,255,255,0.16)";ctx.lineWidth=1.5;ctx.setLineDash([4,4]);roundRect(ctx,1.5,1.5,S-3,S-3,12);ctx.stroke();ctx.setLineDash([]);
      mText("🎁",S/2,S/2-4,S*0.26,"rgba(255,255,255,0.25)","center","700",0);mText("Gana",S/2,S-10,8.5,"rgba(255,255,255,0.4)","center","800",0);}
    ctx.restore();mHit("chest"+i,x,y,S,S,i);
  }
}
(function(){
  var _dt=drawMenuTitle;
  drawMenuTitle=function(){_dt();drawChestBar();};
  var _tb=drawTopBar;
  drawTopBar=function(){_tb();if(game.state==="title"&&PROF.eq.title&&PROF.titles[PROF.eq.title]){var s=layout.safe;mText(PROF.titles[PROF.eq.title],s.l+12+42,s.t+8+40,11,"#80d8ff","left","900",3);}};
})();

/* ---------- chest opening overlay ---------- */
function p21RewardLabel(w){
  if(w.k==="coins")return ["🪙",(w.bonus?"Extra ":"")+"+"+fmtN(w.n),"Monedas","#ffd54f"];
  if(w.k==="pxp")return ["🎖️","+"+fmtN(w.n),"XP de pase","#80d8ff"];
  if(w.k==="skin"){var d=skinDef(w.hero,w.id);return ["👕",(d?d.name:w.id),p21HeroName(w.hero)+(w.dup?" · repetido +500🪙":" · ¡NUEVO ASPECTO!"),d&&d.ex?"#ff80ab":"#ffd54f"];}
  if(w.k==="pieces"){var d2=skinDef(w.hero,w.id),have=PROF.pieces[w.hero+":"+w.id]||0,need=(d2&&d2.pc)||10;return ["🧩","+"+w.n+" piezas",(d2?d2.name:"")+" de "+p21HeroName(w.hero)+(w.done?" · ¡COMPLETO!":" · "+have+"/"+need),"#b9f6ca"];}
  if(w.k==="title")return ["🏷️",w.name,"Título","#80d8ff"];
  if(w.k==="chest")return ["🎁","Cofre "+CHEST[w.r].n,"","#fff"];
  return ["?","",""];
}
function drawRewardCard(w,x,y,cw,ch,a){
  var L=p21RewardLabel(w);
  ctx.save();ctx.globalAlpha=a;
  var g=ctx.createLinearGradient(0,y,0,y+ch);g.addColorStop(0,"rgba(48,34,66,0.96)");g.addColorStop(1,"rgba(22,14,32,0.96)");ctx.fillStyle=g;roundRect(ctx,x,y,cw,ch,12);ctx.fill();
  ctx.strokeStyle=L[3]||"#fff";ctx.lineWidth=2;roundRect(ctx,x+1,y+1,cw-2,ch-2,12);ctx.stroke();
  var th=w.hero&&w.id?skinThumb(w.hero,w.id,64):null;
  if(th)ctx.drawImage(th,x+cw/2-ch*0.27,y+6,ch*0.54,ch*0.54);else mText(L[0],x+cw/2,y+ch*0.32,ch*0.26,"#fff","center","700",0);
  mText(L[1],x+cw/2,y+ch*0.7,Math.min(14,cw*0.13),L[3],"center","900",3);
  ctx.font="800 9px system-ui";var sub=L[2];while(sub&&ctx.measureText(sub).width>cw-8)sub=sub.slice(0,-2);
  mText(sub,x+cw/2,y+ch*0.87,9,"#e8e0f0","center","800",2.2);
  ctx.restore();
}
function drawChestOpen(){
  var O=P21.open;if(!O)return;O.t+=MENU.dt||0.016;var t=O.t,C=CHEST[O.r],rb=C.c==="rainbow",col=rb?rainbowCol(MENU.t||0):C.c,cx=SW/2,cy=SH*0.42;
  var BOOM=0.95;
  ctx.save();
  ctx.fillStyle="rgba(6,4,12,"+Math.min(0.86,t*3)+")";ctx.fillRect(0,0,SW,SH);
  /* light under the chest */
  var gl=typeof glowSpr==="function"?glowSpr(rb?"#ffffff":C.c):null;
  var pre=clamp(t/BOOM,0,1),post=t>BOOM?clamp((t-BOOM)/0.4,0,1):0,S=Math.min(SH*0.42,190);
  if(gl){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.35+0.5*pre+(post?0.3:0);ctx.drawImage(gl,cx-S*1.3,cy-S*1.1,S*2.6,S*2.4);ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;}
  /* rays after the burst */
  if(t>BOOM){
    var rot=(MENU.t||0)*0.5,n=rb?14:12,R=Math.max(SW,SH)*0.75,ra=Math.min(1,(t-BOOM)*3)*0.55;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.globalCompositeOperation="lighter";
    for(var i=0;i<n;i++){ctx.rotate(Math.PI*2/n);ctx.globalAlpha=ra*(i%2?0.55:1);var g2=ctx.createLinearGradient(0,0,R,0);g2.addColorStop(0,rb?rainbowCol(MENU.t||0,i*(360/n)):C.c);g2.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g2;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(R,-R*0.09);ctx.lineTo(R,R*0.09);ctx.closePath();ctx.fill();}
    ctx.restore();ctx.globalAlpha=1;
  }
  /* chest: drop in, shake harder and harder, then pop open */
  var drop=clamp(t/0.22,0,1),bounce=drop<1?(1-Math.pow(1-drop,3)):1+Math.sin(Math.min(1,(t-0.22)/0.25)*Math.PI)*0.06*(t<0.47?1:0);
  var shake=t<BOOM?Math.pow(pre,2)*7:0,sx=Math.sin(t*70)*shake,rotS=Math.sin(t*55)*shake*0.012;
  var pop=t>BOOM?1+0.18*Math.exp(-(t-BOOM)*6)*Math.cos((t-BOOM)*18):1;
  var im=chestImg(O.r,t>BOOM),ims=im||chestImg(O.r,0);
  if(ims){var w=S*bounce*pop,h=w*ims.height/ims.width;ctx.save();ctx.translate(cx+sx,cy-(1-drop)*SH*0.4);ctx.rotate(rotS);ctx.drawImage(ims,-w/2,-h/2,w,h);ctx.restore();}
  if(t<BOOM){var ticks=[0.3,0.55,0.75,0.88];if(O.sfxI<ticks.length&&t>=ticks[O.sfxI]){O.sfxI++;try{sfx("thud");}catch(e){}}}
  /* burst */
  if(t>=BOOM&&!O.boom){O.boom=1;try{sfx(O.r==="asombroso"?"rarity4":O.r==="epico"?"rarity3":"rarity2");sfx("explode");}catch(e){}
    for(var q=0;q<(rb?70:46);q++){var a=Math.random()*6.283,sp=120+Math.random()*320;O.parts.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-80,l:1,c:rb?rainbowCol(0,q*23):(q%3?C.c:"#ffffff"),r:2+Math.random()*3.5});}
    try{if(PROF.set.vib&&navigator.vibrate)navigator.vibrate(O.r==="poco"?30:[40,40,80]);}catch(e){}}
  if(O.parts.length){var dt=MENU.dt||0.016;ctx.globalCompositeOperation="lighter";
    for(var p=0;p<O.parts.length;p++){var P=O.parts[p];P.x+=P.vx*dt;P.y+=P.vy*dt;P.vy+=260*dt;P.vx*=0.985;P.l-=dt*0.75;if(P.l<=0){O.parts.splice(p,1);p--;continue;}ctx.globalAlpha=P.l;ctx.fillStyle=P.c;ctx.fillRect(P.x-P.r/2,P.y-P.r/2,P.r,P.r);}
    ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;}
  if(t>=BOOM&&t<BOOM+0.25){ctx.fillStyle="rgba(255,255,255,"+(1-(t-BOOM)/0.25)*0.85+")";ctx.fillRect(0,0,SW,SH);}
  /* rarity banner + reward cards */
  if(t>BOOM){
    var ba=clamp((t-BOOM-0.1)*4,0,1),bs=1+0.4*(1-ba);
    ctx.save();ctx.globalAlpha=ba;ctx.translate(cx,SH*0.1+16);ctx.scale(bs,bs);
    mText("¡COFRE "+C.n.toUpperCase()+"!",0,0,Math.min(30,SW*0.045),col,"center","900",6);ctx.restore();
    var nC=O.rw.length,cw=Math.min(130,(SW-60)/nC-10),chh=Math.min(112,SH*0.27),tot=nC*cw+(nC-1)*10,x0=cx-tot/2,yC=SH-layout.safe.b-chh-34;
    for(var r=0;r<nC;r++){var tc=t-BOOM-0.35-r*0.22;if(tc<0)continue;var u=clamp(tc/0.3,0,1),e=1-Math.pow(1-u,3);
      var xx=cx+(x0+r*(cw+10)-cx)*e,yy=cy+(yC-cy)*e,sc=0.4+0.6*e;
      if(tc<0.02&&!O["s"+r]){O["s"+r]=1;try{sfx(O.rw[r].k==="skin"?"rarity4":"card");}catch(e2){}}
      ctx.save();ctx.translate(xx+cw/2,yy+chh/2);ctx.scale(sc,sc);drawRewardCard(O.rw[r],-cw/2,-chh/2,cw,chh,u);ctx.restore();}
    var done=t-BOOM-0.35-(nC-1)*0.22>0.4;O.done=done;
    if(done)mText("Toca para continuar",cx,SH-layout.safe.b-14,12,"rgba(255,255,255,"+(0.6+0.4*Math.sin((MENU.t||0)*4))+")","center","800",3);
  }
  ctx.restore();
  mHit("ov_chest",0,0,SW,SH);
}
function drawChestInfo(){
  var s=layout.safe,w=Math.min(560,SW-s.l-s.r-30),h=Math.min(SH-s.t-s.b-24,280),x=(SW-w)/2,y=(SH-h)/2;
  ctx.fillStyle="rgba(6,4,12,0.7)";ctx.fillRect(0,0,SW,SH);
  mPanel(x,y,w,h,16,0.97);
  mText("Probabilidades de los cofres",x+w/2,y+20,16,"#ffe08a","center","900",4);
  var ks=["poco","epico","asombroso"],cw=(w-40)/3,i;
  for(i=0;i<3;i++){var C=CHEST[ks[i]],xx=x+14+i*(cw+6),yy=y+40,col=C.c==="rainbow"?rainbowCol(MENU.t||0):C.c;
    ctx.fillStyle="rgba(255,255,255,0.05)";roundRect(ctx,xx,yy,cw,h-66,12);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=1.8;roundRect(ctx,xx,yy,cw,h-66,12);ctx.stroke();
    var im=chestImg(ks[i],0);if(im){var iw=Math.min(cw*0.5,60),ih=iw*im.height/im.width;ctx.drawImage(im,xx+cw/2-iw/2,yy+6,iw,ih);}
    mText(C.n,xx+cw/2,yy+76,13,col,"center","900",3);
    mText(C.p+"%",xx+cw/2,yy+96,20,"#fff","center","900",4);
    var L=["🪙 "+C.coins[0]+"–"+C.coins[1]+" monedas","🎖️ +"+C.pxp+" XP de pase","👕 Aspecto nuevo: "+C.skin+"%","🧩 Piezas: "+(C.pcsP>=100?"seguro":C.pcsP+"%")+" ("+C.pcs[0]+"–"+C.pcs[1]+")"];
    for(var j=0;j<L.length;j++)mText(L[j],xx+cw/2,yy+116+j*16,9.5,"#e8e0f0","center","800",2.2);
  }
  mText("Ganas un cofre al ganar una partida o al llegar a la ronda 6 · Si las 4 ranuras están llenas no recibes cofre",x+w/2,y+h-9,8.5,"#b0a8c0","center","700",2);
  mHit("ov_info",0,0,SW,SH);
}

/* ---------- pass screen ---------- */
function passRewardLabel(i){
  var R=PASS[i];
  if(R.k==="coins")return ["🪙",fmtN(R.n),"#ffd54f"];
  if(R.k==="chest")return ["chest:"+R.r,CHEST[R.r].n,CHEST[R.r].c==="rainbow"?rainbowCol(MENU.t||0,i*30):CHEST[R.r].c];
  if(R.k==="title")return ["🏷️",R.name.replace(/^\S+\s/,""),"#80d8ff"];
  if(R.k==="pieces")return ["🧩",R.n+" piezas","#b9f6ca"];
  if(R.k==="skin"){var d=skinDef(R.hero,R.id);return ["skin:"+R.hero+":"+R.id,d?d.name:R.id,"#ff80ab"];}
  return ["?","","#fff"];
}
function drawPass(){
  menuBg(0.45);mBack();mTitle("Pase de batalla");drawTopBar();
  var s=layout.safe,t=MENU.t||0,tier=passTier(),xpIn=PROF.pass.xp-tier*PASS_TIER_XP;
  /* header: season, tier, XP to next */
  var hx=s.l+12,hy=s.t+52,hw=SW-s.l-s.r-24;
  mText("TEMPORADA 1 · GRATIS",hx+2,hy+6,10,"#80d8ff","left","900",2.5);
  var bx=hx+196,bw=Math.max(80,hw-196-150);
  var pr=tier>=PASS_TIERS?1:xpIn/PASS_TIER_XP;
  ctx.fillStyle="#ffd54f";ctx.beginPath();ctx.arc(bx-18,hy+12,15,0,7);ctx.fill();ctx.strokeStyle="#5d3a00";ctx.lineWidth=2.5;ctx.stroke();mText(String(tier),bx-18,hy+12.5,13,"#3a1c00","center","900",0);
  mBar(bx,hy+6,bw,12,pr,"#40c4ff");
  mText(tier>=PASS_TIERS?"¡PASE COMPLETADO!":fmtN(xpIn)+" / "+PASS_TIER_XP+" XP",bx+bw/2,hy+12,9,"#fff","center","900",2.5);
  mText("Juega y completa misiones para subir",hx+2,hy+20,8.5,"#b0a8c0","left","700",2);
  var nc=passClaimable();
  if(nc)mButton("pass_all",SW-s.r-12-132,hy-2,132,30,"RECLAMAR ("+nc+")",null,"green",{fs:12});
  /* track */
  var ty=hy+40,th=SH-s.b-10-ty,tw=Math.min(98,Math.max(78,th*0.62)),gap=10,L=s.l+10,Rr=SW-s.r-10,vis=Rr-L,full=PASS_TIERS*(tw+gap)-gap;
  var maxS=Math.max(0,full-vis);
  if(P21.pscroll==null){P21.pscroll=clamp((Math.max(1,tier+1)-1)*(tw+gap)-vis*0.35,0,maxS);}
  if(!P21.pdrag&&Math.abs(P21.pv)>1){P21.pscroll+=P21.pv*(MENU.dt||0.016);P21.pv*=Math.pow(0.04,MENU.dt||0.016);}
  P21.pscroll=clamp(P21.pscroll,0,maxS);
  mPanel(L-4,ty-4,vis+8,th+8,14,0.55);
  ctx.save();ctx.beginPath();ctx.rect(L,ty-4,vis,th+8);ctx.clip();
  /* progress line */
  var ly=ty+18,x0=L-P21.pscroll;
  ctx.fillStyle="rgba(0,0,0,0.5)";roundRect(ctx,x0+tw/2,ly-4,full-tw,8,4);ctx.fill();
  var fillTo=Math.min(full-tw,(Math.min(tier,PASS_TIERS)-1+(tier<PASS_TIERS?pr:0))*(tw+gap));if(tier>0||pr>0){var g=ctx.createLinearGradient(x0,0,x0+full,0);g.addColorStop(0,"#40c4ff");g.addColorStop(1,"#b388ff");ctx.fillStyle=g;roundRect(ctx,x0+tw/2,ly-4,Math.max(0,fillTo),8,4);ctx.fill();}
  for(var i=0;i<PASS_TIERS;i++){
    var x=x0+i*(tw+gap);if(x>Rr+4||x+tw<L-4)continue;
    var n=i+1,got=n<=tier,cl=!!PROF.pass.claimed[n],can=got&&!cl,R=PASS[i],lab=passRewardLabel(i),k=mPressK("pt"+n);
    /* tier node */
    ctx.fillStyle=got?"#ffd54f":"#3a3048";ctx.beginPath();ctx.arc(x+tw/2,ly,11,0,7);ctx.fill();ctx.strokeStyle=got?"#5d3a00":"rgba(255,255,255,0.25)";ctx.lineWidth=2;ctx.stroke();
    mText(String(n),x+tw/2,ly+0.5,10,got?"#3a1c00":"#cfc6df","center","900",0);
    /* card */
    var cy2=ly+20,chh=th-(cy2-ty)-4,fx=P21.claimFx.filter(function(f){return f.n===n;})[0],pop=fx?1+0.25*Math.exp(-fx.t*7)*Math.cos(fx.t*20):1;
    ctx.save();ctx.translate(x+tw/2,cy2+chh/2);ctx.scale(k*pop,k*pop);ctx.translate(-tw/2,-chh/2);
    var bg=ctx.createLinearGradient(0,0,0,chh);bg.addColorStop(0,can?"rgba(70,60,20,0.95)":"rgba(40,30,56,0.92)");bg.addColorStop(1,"rgba(18,12,26,0.95)");ctx.fillStyle=bg;roundRect(ctx,0,0,tw,chh,12);ctx.fill();
    if(can){var gw=0.5+0.5*Math.sin(t*5+i);ctx.strokeStyle="rgba(255,213,79,"+(0.55+0.45*gw)+")";ctx.lineWidth=3;}else{ctx.strokeStyle=got?"rgba(185,246,202,0.5)":"rgba(255,255,255,0.14)";ctx.lineWidth=1.5;}
    roundRect(ctx,1,1,tw-2,chh-2,12);ctx.stroke();
    var ic=lab[0],isz=Math.min(tw*0.62,chh*0.42);
    if(ic.indexOf("chest:")===0){var cim=chestImg(ic.slice(6),0);if(cim){var cw2=isz*1.1,ch2=cw2*cim.height/cim.width;ctx.drawImage(cim,tw/2-cw2/2,chh*0.36-ch2/2,cw2,ch2);}}
    else if(ic.indexOf("skin:")===0){var pp=ic.split(":"),st=skinThumb(pp[1],pp[2],72);if(st)ctx.drawImage(st,tw/2-isz/2,chh*0.36-isz/2,isz,isz);else skinWarm(pp[1],pp[2]);}
    else mText(ic,tw/2,chh*0.36,isz*0.62,"#fff","center","700",0);
    ctx.font="900 10px system-ui";var lt=lab[1];while(ctx.measureText(lt).width>tw-8&&lt.length>3)lt=lt.slice(0,-2);
    mText(lt,tw/2,chh*0.68,10,lab[2],"center","900",2.5);
    if(R.k==="skin")mText(p21HeroName(R.hero),tw/2,chh*0.68+12,8.5,"#e8e0f0","center","800",2);
    if(cl){mText(R.k==="title"&&PROF.eq.title===R.id?"EQUIPADO":"✔",tw/2,chh-12,R.k==="title"?9:14,"#b9f6ca","center","900",2.5);}
    else if(can){ctx.fillStyle="#2fb24a";roundRect(ctx,6,chh-24,tw-12,18,9);ctx.fill();mText("RECLAMAR",tw/2,chh-15,9,"#fff","center","900",2);}
    else{ctx.fillStyle="rgba(8,4,14,0.45)";roundRect(ctx,0,0,tw,chh,12);ctx.fill();mText("🔒",tw/2,chh-14,11,"#fff","center","700",0);}
    ctx.restore();
    if(x+tw>L&&x<Rr)mHit("pt"+n,Math.max(L,x),cy2,Math.min(Rr,x+tw)-Math.max(L,x),chh,n);
  }
  /* claim particles */
  for(var f=0;f<P21.claimFx.length;f++){var F=P21.claimFx[f];F.t+=MENU.dt||0.016;if(F.t>1.2){P21.claimFx.splice(f,1);f--;continue;}
    var fxX=x0+(F.n-1)*(tw+gap)+tw/2,fyY=ly+20+(th-40)*0.36;ctx.save();ctx.globalCompositeOperation="lighter";
    for(var q=0;q<18;q++){var a=q/18*6.283+F.n,rr=F.t*120*(0.6+(q%3)*0.25);ctx.globalAlpha=Math.max(0,1-F.t/1.2);ctx.fillStyle=q%2?"#ffd54f":"#80d8ff";ctx.fillRect(fxX+Math.cos(a)*rr-2,fyY+Math.sin(a)*rr-2+F.t*F.t*60,4,4);}
    ctx.restore();}
  ctx.restore();
  MENU.hits.unshift({id:"passArea",x:L,y:ty,w:vis,h:th,data:null});
  P21.passGeom={tw:tw,gap:gap,maxS:maxS};
}
function passClaim(n){
  if(n>passTier()||PROF.pass.claimed[n])return 0;
  var R=PASS[n-1];PROF.pass.claimed[n]=1;
  P21.claimFx.push({n:n,t:0});
  if(R.k==="chest"){profSave();chestOpenStart(R.r,null);return 1;}
  var w={k:R.k,n:R.n,hero:R.hero,id:R.id,name:R.name};
  if(R.k==="skin")w=rewardApply({k:"skin",hero:R.hero,id:R.id});else rewardApply(w);
  if(R.title)rewardApply({k:"title",id:R.title.id,name:R.title.name});
  profSave();checkAchievements(1);
  var L=p21RewardLabel(w);try{sfx(R.k==="skin"?"rarity4":"rarity2");}catch(e){}
  menuToast(L[0]+" "+(R.k==="skin"?"¡Aspecto "+L[1]+" para "+p21HeroName(R.hero)+"!":R.k==="title"?"Título: "+R.name:R.k==="pieces"?L[1]+" · "+L[2]:L[1]+" "+L[2]),L[3]||"#ffd54f");
  return 1;
}

/* ---------- missions screen ---------- */
function drawMissions(){
  missRefresh();
  menuBg(0.45);mBack();mTitle("Misiones");drawTopBar();
  var s=layout.safe,y0=s.t+52,gw=SW-s.l-s.r-24,colW=(gw-12)/2,h=SH-s.b-10-y0,t=MENU.t||0;
  [["DIARIAS",PROF.miss.daily,"Nuevas en "+fmtLeft(untilMidnight()),"d"],["SEMANALES",PROF.miss.weekly,"Nuevas en "+fmtLeft(untilMonday()),"w"]].forEach(function(C,ci){
    var x=s.l+12+ci*(colW+12);mPanel(x,y0,colW,h,14,0.9);
    mText(C[0],x+14,y0+16,13,ci?"#b388ff":"#ffe08a","left","900",3);mText("⏱ "+C[2],x+colW-12,y0+16,9.5,"#cfc6df","right","800",2.2);
    var rh=Math.min(74,(h-34)/3-6);
    for(var i=0;i<C[1].length;i++){var m=C[1][i],yy=y0+30+i*(rh+6),done=m.p>=m.n,id="mc_"+C[3]+i;
      ctx.fillStyle=m.c?"rgba(185,246,202,0.06)":done?"rgba(255,213,79,0.12)":"rgba(255,255,255,0.06)";roundRect(ctx,x+8,yy,colW-16,rh,10);ctx.fill();
      if(done&&!m.c){ctx.strokeStyle="rgba(255,213,79,"+(0.5+0.4*Math.sin(t*5+i))+")";ctx.lineWidth=2;roundRect(ctx,x+8,yy,colW-16,rh,10);ctx.stroke();}
      mText(MISS_ICON[m.t]||"⭐",x+28,yy+rh/2,Math.min(20,rh*0.36),"#fff","center","700",0);
      var tx=x+46,bw=colW-16-46-96;
      ctx.font="800 11px system-ui";var tt=missText(m);while(ctx.measureText(tt).width>bw+30&&tt.length>4)tt=tt.slice(0,-2);
      mText(tt,tx,yy+rh*0.3,11,m.c?"#9e98aa":"#fff","left","800",2.5);
      mBar(tx,yy+rh*0.55,bw,9,m.p/m.n,m.c?"#5e8c6a":done?"#ffd54f":"#40c4ff");
      mText(fmtN(Math.min(m.p,m.n))+" / "+fmtN(m.n),tx+bw/2,yy+rh*0.55+4.5,8,"#fff","center","900",2.2);
      mText("🎖️ +"+m.x+" XP",tx,yy+rh*0.82,9,"#80d8ff","left","800",2);
      var bx=x+colW-8-92,by=yy+rh/2-15;
      if(m.c)mText("✔ Hecha",bx+46,yy+rh/2,11,"#b9f6ca","center","900",2.5);
      else if(done)mButton(id,bx,by,84,30,"RECLAMAR",null,"green",{fs:11,data:{L:C[3],i:i}});
      else mButton(id,bx,by,84,30,"En curso",null,"dark",{fs:10,data:{L:C[3],i:i}});
    }
  });
}
function missClaim(L,i){
  var m=(L==="d"?PROF.miss.daily:PROF.miss.weekly)[i];if(!m||m.c||m.p<m.n)return 0;
  m.c=1;var t0=passTier();passAddXP(m.x,1);profSave();
  try{sfx("rarity2");}catch(e){}
  menuToast("🎖️ +"+m.x+" XP de pase"+(passTier()>t0?" · ¡Nivel "+passTier()+" del pase!":""),"#80d8ff");
  return 1;
}

/* ---------- screen dispatch, overlays and input ---------- */
drawMenuScreen=function(){
  MENU.hits=[];var now=performance.now();MENU.dt=Math.min(0.05,(now-(MENU._last||now))/1000);MENU._last=now;MENU.t+=MENU.dt;
  var st=game.state;
  if(MENU.lastLv&&account.level>MENU.lastLv)MENU.lvToast=account.level;MENU.lastLv=account.level;
  if(st==="title")drawMenuTitle();else if(st==="levels")drawLevels();else if(st==="heroes")drawHeroes();else if(st==="unlocks")drawUnlocks();
  else if(st==="achievements")drawAchievements();else if(st==="stats")drawStats();else if(st==="settings")drawSettingsMenu();else if(st==="credits")drawCredits();else if(st==="howto")drawHowToMenu();
  else if(st==="pass")drawPass();else if(st==="missions")drawMissions();
  if(st==="heroes"){var hh=HEROES[MENU.heroIdx];if(hh&&PROF.newSkin[hh.id]){PROF.newSkin[hh.id]=0;profSave();}}
  if(P21.info&&st==="title")drawChestInfo();
  drawToasts();
  if(P21.open)drawChestOpen();
};
(function(){
  var _md=menuDown,_mm=menuMove,_mu=menuUp,_ma=menuAction;
  menuDown=function(p){
    _md(p);
    if(game.state==="pass"&&!P21.open&&!MENU.drag){var h=menuHitAt(p.x,p.y);if(h&&(h.id==="passArea"||/^pt\d/.test(h.id))){P21.pdrag={x:p.x,s0:P21.pscroll||0,moved:0,lx:p.x,lt:performance.now()};P21.pv=0;}}
  };
  menuMove=function(p){
    if(P21.pdrag){var d=P21.pdrag,dx=p.x-d.x;d.moved=Math.max(d.moved,Math.abs(dx));P21.pscroll=clamp(d.s0-dx,0,(P21.passGeom&&P21.passGeom.maxS)||0);
      var now=performance.now(),dtm=Math.max(1,now-d.lt);P21.pv=-(p.x-d.lx)/dtm*1000;d.lx=p.x;d.lt=now;if(d.moved>8)MENU.press=null;if(typeof menuDirty!=="undefined")menuDirty=1;return;}
    _mm(p);
  };
  menuUp=function(p){
    if(P21.pdrag){var d=P21.pdrag;P21.pdrag=null;if(d.moved>8){MENU.press=null;return;}P21.pv=0;}
    _mu(p);
  };
  menuAction=function(h){
    var id=h.id,st=game.state;function ok(){try{sfx("click");}catch(e){}}
    if(id==="ov_chest"){var O=P21.open;if(!O)return;if(O.t<0.95){O.t=0.95;return;}if(!O.done){O.t=99;return;}P21.open=null;ok();return;}
    if(id==="ov_info"){P21.info=0;ok();return;}
    if(st==="title"){
      if(id==="chest_info"){ok();P21.info=1;return;}
      if(/^chest\d$/.test(id)){var c=PROF.chests[h.data];if(c){chestOpenStart(c.r,h.data);}else{try{sfx("click");}catch(e){}menuToast("🎁 Gana una partida (o llega a la ronda 6) para conseguir un cofre","#ffd54f");}return;}
      if(id==="pass"||id==="missions"){ok();try{sfx("card");}catch(e){}if(id==="pass")P21.pscroll=null;menuGo(id);return;}
    }
    if(st==="pass"){
      if(id==="pass_all"){var n=0,hadChest=0;for(var i=1;i<=passTier();i++){if(PROF.pass.claimed[i])continue;if(PASS[i-1].k==="chest"){if(hadChest)continue;hadChest=1;}if(passClaim(i))n++;}return;}
      if(/^pt\d/.test(id)){var tn=h.data;
        if(PROF.pass.claimed[tn]){var R=PASS[tn-1];if(R.k==="title"){ok();PROF.eq.title=PROF.eq.title===R.id?"":R.id;profSave();}else if(R.k==="skin"){ok();PROF.eq.skin[R.hero]=R.id;profSave();menuToast("👕 "+skinDef(R.hero,R.id).name+" equipado en "+p21HeroName(R.hero),"#ff80ab");}return;}
        if(tn<=passTier()){passClaim(tn);return;}
        try{sfx("hurt");}catch(e){}menuToast("🔒 Nivel "+tn+" del pase · te faltan "+fmtN(tn*PASS_TIER_XP-PROF.pass.xp)+" XP","#b388ff");return;}
    }
    if(st==="missions"&&/^mc_/.test(id)){var d=h.data;if(missClaim(d.L,d.i))return;try{sfx("click");}catch(e){}menuToast("Sigue jugando para completarla","#cfc6df");return;}
    if(st==="heroes"&&id.indexOf("skin")===0&&!/^skin_/.test(id)){
      var hero=HEROES[MENU.heroIdx].id,sk=SKINS[hero][h.data];
      if(sk&&sk.real)skinWarm(hero,sk.id);
      if(sk&&!skinOk(hero,sk)&&(sk.ex||sk.real)){
        var pc=PROF.pieces[hero+":"+sk.id]||0;
        if(sk.ex){MENU.previewSkin={hero:hero,id:sk.id};menuToast("🎁 Exclusivo: sale en cofres y en el pase · 🧩 "+pc+"/"+sk.pc+" (vista previa)","#ff80ab");return;}
        if(sk.lv&&!sk.cost){MENU.previewSkin={hero:hero,id:sk.id};menuToast("🔒 Nivel "+sk.lv+" o "+sk.pc+" piezas de cofre · 🧩 "+pc+"/"+sk.pc+" (vista previa)","#b388ff");return;}
      }
    }
    return _ma(h);
  };
})();

/* ---------- Oro: the weapon turns to real gold too ---------- */
/* the vector weapons are recoloured on the fly through a thin context proxy (only while a gold hero's weapon is drawn):
   every metal/wood/plastic colour maps to a gold ramp by brightness; skin, outline and glow effects are untouched */
var WPN_GOLD=0,GOLD_MAP={};
function goldOf(col){
  if(typeof col!=="string"||col.charAt(0)!=="#"||(col.length!==7&&col.length!==4))return col;
  var m=GOLD_MAP[col];if(m)return m;
  var h=col.length===4?"#"+col[1]+col[1]+col[2]+col[2]+col[3]+col[3]:col,n=parseInt(h.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  var L=(0.3*r+0.59*g+0.11*b)/255,t=0.25+0.75*Math.pow(L,0.6);
  var A=[70,44,4],B=[214,160,40],C=[255,244,190],o=t<0.6?[A,B,t/0.6]:[B,C,(t-0.6)/0.4],u=o[2];
  var rr=Math.round(o[0][0]+(o[1][0]-o[0][0])*u),gg=Math.round(o[0][1]+(o[1][1]-o[0][1])*u),bb=Math.round(o[0][2]+(o[1][2]-o[0][2])*u);
  return (GOLD_MAP[col]="#"+((1<<24)|(rr<<16)|(gg<<8)|bb).toString(16).slice(1));
}
(function(){
  var _dw=drawWeapon34,PX=new WeakMap();
  function proxyFor(c,keep){
    var P=new Proxy(c,{
      get:function(t,k){
        if(k==="createLinearGradient"||k==="createRadialGradient")return function(){var g=t[k].apply(t,arguments),ad=g.addColorStop.bind(g);return {addColorStop:function(o,cl){ad(o,keep[cl]?cl:goldOf(cl));},_g:g};};
        var v=t[k];return typeof v==="function"?v.bind(t):v;},
      set:function(t,k,v){
        if((k==="fillStyle"||k==="strokeStyle")){if(v&&v._g)v=v._g;else if(typeof v==="string"&&!keep[v]&&t.globalCompositeOperation!=="lighter")v=goldOf(v);}
        t[k]=v;return true;}
    });
    return P;
  }
  drawWeapon34=function(c,hx,hy,ang,wpn,sc,muzzle,skin,two){
    if(!WPN_GOLD||wpn==="bolt"||wpn==="fist")return _dw.apply(this,arguments);
    var sk=skin||"#e8c4a0",keep={};GOLD_MAP["#1a140c"]="#4a3200";keep[sk]=1;keep[shadeHex(sk,28)]=1;keep[shadeHex(sk,-28)]=1;
    return _dw.call(this,proxyFor(c,keep),hx,hy,ang,wpn,sc,muzzle,skin,two);
  };
  var _dc=drawChar34;
  drawChar34=function(wx,wy,look,ang,anim,opts){var was=WPN_GOLD;WPN_GOLD=look&&look.kind==="player"&&look.tint==="dorado"?1:0;try{return _dc.apply(this,arguments);}finally{WPN_GOLD=was;}};
  var _hs=drawHeroShowcaseRaw;
  drawHeroShowcaseRaw=function(hero,x,footY,H,skin,glow){var was=WPN_GOLD;WPN_GOLD=skin==="dorado"?1:0;try{return _hs.apply(this,arguments);}finally{WPN_GOLD=was;}};
})();
/* the ending close-ups show the painted outfit you wear (the megapower look stays for the fight itself) */
(function(){if(typeof hellFinalStart!=="function")return;var _hf=hellFinalStart;hellFinalStart=function(){try{var p=game.player,sk=equippedSkin(p.hero);if(REAL_SKINS[sk]&&p.look){p._megaTint=p.look.tint;p.look.tint=sk;skinWarm(p.hero,sk);var fe=artEntry(p.look,angDir(Math.PI/2),"idle");if(fe){finHDLoad(fe.name);}}}catch(e){}return _hf.apply(this,arguments);};})();
