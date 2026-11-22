/* v21.1 "Tienda": 25 new painted outfits (5 per hero) with rarities, a scarce second currency (💎 gems) for outfits and
   the best chests, a shop with daily offers, a 50-tier pass, per-rarity chest openings where every reward is revealed
   one by one, the end-of-game chest reveal and profile v3. No real money anywhere: gems are only earned by playing.
   Like 22_progress.js this file only wraps existing functions; gameplay code paths are untouched. */

/* ---------- rarities ---------- */
var RAR={
  comun:{n:"Común",c:"#cfd8dc",o:0},
  rara:{n:"Rara",c:"#4fc3f7",o:1,g:60,pc:10},
  epica:{n:"Épica",c:"#b388ff",o:2,g:120,pc:15},
  mitica:{n:"Mítica",c:"#ff5252",o:3,g:200,pc:20},
  legendaria:{n:"Legendaria",c:"rainbow",o:4,g:320,pc:30}
};
function rarCol(r,t,o){var R=RAR[r]||RAR.comun;return R.c==="rainbow"?rainbowCol(t==null?(MENU.t||0):t,o||0):R.c;}
function rarHex(r){var R=RAR[r]||RAR.comun;return R.c==="rainbow"?"#ffffff":R.c;}

/* ---------- the new outfits ---------- */
/* every id maps to the sprites it repaints; names are unique per sprite so the same id can be shared by two heroes */
var NEW_SKINS={
  classic:[["navidad","Navidad","rara"],["pirata","Pirata","epica"],["esqueleto","Esqueleto","epica"],["samurai","Samurái","mitica"],["diamante","Diamante","legendaria"]],
  trueno:[["calabaza","Calabaza","rara"],["lava","Lava","epica"],["glacial","Glacial","epica"],["mecha","Mecha","mitica"],["arcoiris","Tormenta Arcoíris","legendaria"]],
  mr:[["militar","Comando","rara"],["pirata","Capitán Pirata","epica"],["calavera","Calavera","epica"],["vampiro","Vampiro","mitica"],["obsidiana","Obsidiana","legendaria"]],
  gompa:[["luchador","Luchador","rara"],["vikingo","Vikingo","epica"],["navidad","Navidad","epica"],["yeti","Yeti","mitica"],["lava","Titán de Lava","legendaria"]],
  neizan:[["comando","Desierto","rara"],["artico","Ártico","epica"],["esqueleto","Esqueleto","epica"],["samurai","Cyber Samurái","mitica"],["prisma","Prisma","legendaria"]]
};
var HERO_SPR={classic:["classic_f","classic_b"],trueno:["trueno_f","trueno_laser_f"],mr:["mr_f"],gompa:["gompa_f"],neizan:["neizan_f"]};
(function(){
  var h,i;
  for(h in SKINS)for(i=0;i<SKINS[h].length;i++){var s=SKINS[h][i];if(s.rar)continue;
    s.rar=s.id==="orig"?null:s.id==="dorado"?"epica":s.ex?"mitica":"comun";}
  for(h in NEW_SKINS){if(!SKINS[h])continue;
    NEW_SKINS[h].forEach(function(d){
      var R=REAL_SKINS[d[0]]||(REAL_SKINS[d[0]]={});HERO_SPR[h].forEach(function(n){R[n]=1;});
      SKINS[h].push({id:d[0],name:d[1],real:1,rar:d[2],gem:RAR[d[2]].g,pc:RAR[d[2]].pc,nw:1});
    });}
  var _ur=unlockedReq;unlockedReq=function(it,key){if(it&&it.gem)return (key&&PROF&&PROF.own[key])?1:0;return _ur(it,key);};
})();
function gemSkins(){var out=[],h,i;for(h in SKINS)for(i=0;i<SKINS[h].length;i++)if(SKINS[h][i].gem)out.push({hero:h,s:SKINS[h][i]});return out;}

/* full-body card art straight from the painted sprite (front, idle) */
var SKIN_FULL={};
function skinFull(hero,id){
  var key=hero+"|"+id,c=SKIN_FULL[key];if(c)return c;
  var look=makeHeroLook(hero);look.tint=id&&id!=="orig"?id:null;var e=artEntry(look,2,"idle");if(!e)return null;
  if(REAL_SKINS[id]&&e.img===ART.imgs[e.name]){skinWarm(hero,id);return null;}
  return (SKIN_FULL[key]=e.img);
}

/* ---------- gems + profile v3 ---------- */
var GEM={win:3,round6:1,vorgathFirst:100,vorgath:5,weekly:15,dailyAll:10,gift:3,giftCoins:150,dupGems:5,dupCoins:300};
function achGems(a){return Math.max(3,Math.round(a.rew/15));}
var GEMFX={t:0,n:0};
function gemsAdd(n,why){n=Math.round(n)|0;if(n<=0)return 0;PROF.gems=(PROF.gems|0)+n;GEMFX.t=1.6;GEMFX.n=n;PROF.gemLog=PROF.gemLog||{};PROF.gemLog[why||"?"]=(PROF.gemLog[why||"?"]|0)+n;return n;}
PROF_DEF.v=3;PROF_DEF.gems=0;PROF_DEF.gemLog={};PROF_DEF.gemF={};
PROF_DEF.shop={day:"",offers:[],bought:{},gift:"",xpDay:"",xpN:0,tab:0,hero:""};
PROF_DEF.miss.bonus="";
function profMigrate3(p){
  if(!p)return p;
  var from=p.v|0;
  if(from<3){try{lsSet("bz_profile_v2_backup",JSON.parse(JSON.stringify(p)));}catch(e){}}
  p=profMigrate(p);
  if(!(from>=3)){
    var g=0,i;
    /* welcome back: the gems you would already have earned (achievements, claimed pass tiers, Vorgath) */
    for(i=0;i<ACHS.length;i++)if(p.ach&&p.ach[ACHS[i].id])g+=achGems(ACHS[i]);
    for(var n in (p.pass&&p.pass.claimed)||{})if(PASS_GEMS[n])g+=PASS_GEMS[n];
    if(p.stats&&p.stats.hell>0){g+=GEM.vorgathFirst;p.gemF.vorgath=1;}
    p.gems=(p.gems|0)+g;p.gemLog.migracion=g;p._welcomeGems=g;
    p.v=3;p._migratedFrom2=Date.now();
  }
  if(typeof p.gems!=="number"||!isFinite(p.gems))p.gems=0;
  return p;
}

/* ---------- pass: 50 tiers, gems on many of them ---------- */
PASS_TIERS=50;
PASS.push(
  {k:"coins",n:700},{k:"chest",r:"epico"},{k:"skin",hero:"classic",id:"navidad"},{k:"pieces",n:10},{k:"chest",r:"poco"},
  {k:"skin",hero:"gompa",id:"luchador"},{k:"coins",n:800},{k:"title",id:"colec",name:"🎨 Coleccionista"},{k:"chest",r:"epico"},{k:"skin",hero:"mr",id:"militar"},
  {k:"pieces",n:12},{k:"coins",n:900},{k:"chest",r:"asombroso"},{k:"skin",hero:"neizan",id:"comando"},{k:"coins",n:1000},
  {k:"title",id:"brillo",name:"💎 Brillante"},{k:"skin",hero:"trueno",id:"calabaza"},{k:"chest",r:"epico"},{k:"pieces",n:15},{k:"skin",hero:"gompa",id:"vikingo",title:{id:"maestro",name:"🏆 Maestro del Pase"}}
);
var PASS_GEMS={3:5,6:5,9:10,12:10,15:10,18:10,21:15,24:15,27:15,30:20,33:15,36:15,39:20,42:20,45:25,48:25,50:40};
(function(){
  var _pc=passClaim;
  passClaim=function(n){var ok=_pc(n);if(ok&&PASS_GEMS[n]){gemsAdd(PASS_GEMS[n],"pase");profSave();try{sfx("rw_gem");}catch(e){}menuToast("💎 +"+PASS_GEMS[n]+" gemas (nivel "+n+" del pase)","#80deea");}return ok;};
})();

/* ---------- chests: plenty of coins, a small chance of gems ---------- */
CHEST.poco.coins=[100,180];CHEST.epico.coins=[260,420];CHEST.asombroso.coins=[650,950];
CHEST.poco.gp=8;CHEST.poco.g=[2,4];CHEST.epico.gp=40;CHEST.epico.g=[6,12];CHEST.asombroso.gp=100;CHEST.asombroso.g=[20,35];
var REW_ORDER={coins:0,pxp:1,gems:2,pieces:3,title:4,skin:5};
(function(){
  var _cr=chestRewards;
  chestRewards=function(r){
    var out=_cr(r),C=CHEST[r];
    if(C&&C.gp&&Math.random()*100<C.gp)out.push({k:"gems",n:p21Rand(C.g[0],C.g[1])});
    out.sort(function(a,b){return (REW_ORDER[a.k]||0)-(REW_ORDER[b.k]||0);});
    return out;
  };
  var _ra=rewardApply;
  rewardApply=function(w){
    if(w.k==="gems"){gemsAdd(w.n,"cofre");return w;}
    if(w.k==="skin"&&PROF.own["skin:"+w.hero+":"+w.id]){PROF.coins+=GEM.dupCoins;gemsAdd(GEM.dupGems,"repetido");w.dup=1;return w;}
    var r=_ra(w);
    if(w.k==="pieces"&&w.done){var d=skinDef(w.hero,w.id);if(d)w.rar=d.rar;}
    return r;
  };
  var _rl=p21RewardLabel;
  p21RewardLabel=function(w){
    if(w.k==="gems")return ["💎","+"+w.n,"Gemas","#80deea"];
    if(w.k==="skin"){var d=skinDef(w.hero,w.id),R=d&&RAR[d.rar];return ["👕",(d?d.name:w.id),p21HeroName(w.hero)+(w.dup?" · repetido +"+GEM.dupCoins+"🪙 +"+GEM.dupGems+"💎":" · "+(R?R.n:"¡Nuevo!")),d?rarCol(d.rar):"#ffd54f"];}
    return _rl(w);
  };
})();
drawChestInfo=function(){
  var s=layout.safe,w=Math.min(600,SW-s.l-s.r-30),h=Math.min(SH-s.t-s.b-24,300),x=(SW-w)/2,y=(SH-h)/2;
  ctx.fillStyle="rgba(6,4,12,0.7)";ctx.fillRect(0,0,SW,SH);
  mPanel(x,y,w,h,16,0.97);
  mText("Probabilidades de los cofres",x+w/2,y+20,16,"#ffe08a","center","900",4);
  var ks=["poco","epico","asombroso"],cw=(w-40)/3,i;
  for(i=0;i<3;i++){var C=CHEST[ks[i]],xx=x+14+i*(cw+6),yy=y+40,col=C.c==="rainbow"?rainbowCol(MENU.t||0):C.c;
    ctx.fillStyle="rgba(255,255,255,0.05)";roundRect(ctx,xx,yy,cw,h-66,12);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=1.8;roundRect(ctx,xx,yy,cw,h-66,12);ctx.stroke();
    var im=chestImg(ks[i],0);if(im){var iw=Math.min(cw*0.5,60),ih=iw*im.height/im.width;ctx.drawImage(im,xx+cw/2-iw/2,yy+6,iw,ih);}
    mText(C.n,xx+cw/2,yy+76,13,col,"center","900",3);
    mText(C.p+"%",xx+cw/2,yy+96,20,"#fff","center","900",4);
    var L=["🪙 "+C.coins[0]+"–"+C.coins[1]+" monedas","🎖️ +"+C.pxp+" XP de pase","💎 Gemas: "+(C.gp>=100?"seguro":C.gp+"%")+" ("+C.g[0]+"–"+C.g[1]+")","👕 Aspecto nuevo: "+C.skin+"%","🧩 Piezas: "+(C.pcsP>=100?"seguro":C.pcsP+"%")+" ("+C.pcs[0]+"–"+C.pcs[1]+")"];
    for(var j=0;j<L.length;j++)mText(L[j],xx+cw/2,yy+116+j*16,9.5,"#e8e0f0","center","800",2.2);
  }
  mText("Ganas un cofre al ganar una partida o al llegar a la ronda 6 · Si las 4 ranuras están llenas no recibes cofre",x+w/2,y+h-9,8.5,"#b0a8c0","center","700",2);
  mHit("ov_info",0,0,SW,SH);
};

/* ---------- earning gems ---------- */
(function(){
  var _ca=checkAchievements;
  checkAchievements=function(silent){var got=_ca(silent);if(got&&got.length){var g=0;for(var i=0;i<got.length;i++)g+=achGems(got[i]);if(gemsAdd(g,"logros")){profSave();if(!silent)menuToast("💎 +"+g+" gemas por logros","#80deea");}}return got;};
  var _re=profRunEnd;
  profRunEnd=function(kind){
    var before=MENU.runDone,beforeHell=MENU.hellDone,lr0=MENU.lastRun;_re(kind);
    var counted=(kind==="hell")?!beforeHell:!before;if(!counted||!MENU.lastRun)return;
    var g=game,round=kind==="hell"?10:(g.wave|0)+1,win=kind==="victory"||kind==="hell",gm=0;
    if(kind==="hell"){if(!PROF.gemF.vorgath){PROF.gemF.vorgath=1;gm+=GEM.vorgathFirst;}else gm+=GEM.vorgath;}
    else if(win)gm+=GEM.win;else if(round>=6)gm+=GEM.round6;
    if(gm){gemsAdd(gm,kind==="hell"?"vorgath":"partidas");MENU.lastRun.gems=(MENU.lastRun.gems||0)+gm;}
    MENU.lastRun.revealT=null;profSave();
  };
  var _mc=missClaim;
  missClaim=function(L,i){
    var ok=_mc(L,i);if(!ok)return ok;
    if(L==="w"){gemsAdd(GEM.weekly,"misiones");try{sfx("rw_gem");}catch(e){}menuToast("💎 +"+GEM.weekly+" gemas (misión semanal)","#80deea");}
    else{var all=PROF.miss.daily.length&&PROF.miss.daily.every(function(m){return m.c;});
      if(all&&PROF.miss.bonus!==PROF.miss.day){PROF.miss.bonus=PROF.miss.day;gemsAdd(GEM.dailyAll,"misiones");try{sfx("rw_gem");}catch(e){}menuToast("💎 +"+GEM.dailyAll+" gemas · ¡las 3 diarias hechas!","#80deea");}}
    profSave();return ok;
  };
  var _dm=drawMissions;
  drawMissions=function(){_dm();var s=layout.safe,y0=s.t+52,gw=SW-s.l-s.r-24,colW=(gw-12)/2,done=PROF.miss.bonus===PROF.miss.day;
    mText(done?"💎 Bonus diario cobrado":"Las 3 hechas: 💎 +"+GEM.dailyAll,s.l+12+colW/2+20,y0+16,9.5,done?"#7a9aa0":"#80deea","center","900",2.2);
};
})();

/* ---------- shop ---------- */
var SHOP={tab:0,hero:null,buy:null,buyT:0};
var SHOP_CHESTS=[{r:"poco",cur:"coins",p:500},{r:"epico",cur:"gems",p:90},{r:"asombroso",cur:"gems",p:240}];
var SHOP_XP={cur:"coins",p:400,n:250,max:3};
function shopRng(seed){var s=0;for(var i=0;i<seed.length;i++)s=(s*31+seed.charCodeAt(i))>>>0;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function shopOffers(){
  var S=PROF.shop,dk=dayKey();
  if(S.day!==dk||!S.offers||!S.offers.length){
    var rnd=shopRng("bz"+dk),all=gemSkins(),pool=all.filter(function(q){return !PROF.own["skin:"+q.hero+":"+q.s.id];}),out=[],used={};
    if(pool.length<3)pool=all;
    for(var k=0;k<40&&out.length<3&&pool.length;k++){var q=pool[Math.floor(rnd()*pool.length)],key=q.hero+":"+q.s.id;if(used[key])continue;
      if(out.length<2&&out.some(function(o){return o.hero===q.hero;})&&k<30)continue;used[key]=1;out.push({hero:q.hero,id:q.s.id});}
    /* the best of today's three goes on sale */
    var bi=0;out.forEach(function(o,i){var a=skinDef(o.hero,o.id),b=skinDef(out[bi].hero,out[bi].id);if(RAR[a.rar].o>RAR[b.rar].o)bi=i;});
    if(out[bi])out[bi].disc=25;
    S.day=dk;S.offers=out;S.bought={};profSave();
  }
  return S.offers;
}
function skinPrice(hero,id,disc){var d=skinDef(hero,id);if(!d||!d.gem)return 0;return disc?Math.round(d.gem*(100-disc)/100/5)*5:d.gem;}
function shopBadge(){return PROF.shop.gift!==dayKey()?1:0;}
(function(){var _mb=menuBadge;menuBadge=function(id){if(id==="shop")return shopBadge();return _mb(id);};})();

function drawShopSkinCard(x,y,w,h,hero,id,disc,hitId,data,ent){
  var d=skinDef(hero,id);if(!d)return;var own=!!PROF.own["skin:"+hero+":"+id],t=MENU.t||0,rc=rarCol(d.rar,t),k=mPressK(hitId),price=skinPrice(hero,id,disc);
  ctx.save();ctx.globalAlpha=ent==null?1:ent;ctx.translate(x+w/2,y+h/2+(1-(ent==null?1:ent))*30);ctx.scale(k,k);ctx.translate(-w/2,-h/2);
  var g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"rgba(44,30,62,0.97)");g.addColorStop(1,"rgba(16,10,24,0.97)");ctx.fillStyle=g;roundRect(ctx,0,0,w,h,12);ctx.fill();
  /* rarity backdrop */
  ctx.save();roundRect(ctx,0,0,w,h,12);ctx.clip();
  var gl=glowSpr(rarHex(d.rar));ctx.globalCompositeOperation="lighter";ctx.globalAlpha*=d.rar==="legendaria"?0.55:0.4;
  if(d.rar==="legendaria"){ctx.save();ctx.translate(w/2,h*0.42);ctx.rotate(t*0.4);for(var q=0;q<10;q++){ctx.rotate(Math.PI/5);ctx.fillStyle=rainbowCol(t,q*36);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(h,-h*0.12);ctx.lineTo(h,h*0.12);ctx.closePath();ctx.fill();}ctx.restore();}
  ctx.drawImage(gl,-w*0.3,-h*0.05,w*1.6,h*0.95);ctx.restore();
  var im=skinFull(hero,id);
  if(im){var ih=h*0.64,iw=ih*(im.width/im.height);if(iw>w*0.9){iw=w*0.9;ih=iw*im.height/im.width;}ctx.drawImage(im,w/2-iw/2,h*0.74-ih,iw,ih);}
  else mText("⏳",w/2,h*0.42,20,"#fff","center","700",0);
  /* rarity band + name */
  ctx.fillStyle=rc;roundRect(ctx,6,6,Math.min(w-12,ctx.measureText?72:72),15,7);ctx.fill();
  mText(RAR[d.rar].n.toUpperCase(),6+36,13.5,8.5,"#140a1c","center","900",0);
  mText(p21HeroName(hero),w-8,13.5,8.5,"#cfc6df","right","800",2);
  ctx.font="900 12px system-ui";var nm=d.name;while(ctx.measureText(nm).width>w-12&&nm.length>3)nm=nm.slice(0,-2);
  mText(nm,w/2,h*0.79,12,"#fff","center","900",3);
  /* price */
  var py=h-22;
  if(own){mText("✔ TIENES",w/2,py+8,11,"#b9f6ca","center","900",2.5);}
  else{var can=PROF.gems>=price;ctx.fillStyle=can?"rgba(0,151,167,0.9)":"rgba(60,60,72,0.9)";roundRect(ctx,8,py-2,w-16,20,10);ctx.fill();
    mText("💎 "+price,w/2+(disc?14:0),py+8,12,"#fff","center","900",2.5);
    if(disc){mText(String(d.gem),w/2-26,py+8,9,"#b0bec5","center","800",0);ctx.strokeStyle="#ff5252";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(w/2-36,py+8);ctx.lineTo(w/2-16,py+8);ctx.stroke();}}
  if(disc&&!own){ctx.save();ctx.translate(w-16,36);ctx.rotate(0.25);ctx.fillStyle="#ff5252";roundRect(ctx,-22,-9,44,18,6);ctx.fill();mText("-"+disc+"%",0,0,10,"#fff","center","900",0);ctx.restore();}
  ctx.strokeStyle=rc;ctx.lineWidth=d.rar==="legendaria"?2.6:2;roundRect(ctx,1,1,w-2,h-2,12);ctx.stroke();
  ctx.restore();
  mHit(hitId,x,y,w,h,data);
}
function drawShopChestCard(x,y,w,h,o,i,ent){
  var C=CHEST[o.r],t=MENU.t||0,col=C.c==="rainbow"?rainbowCol(t,i*50):C.c,id="sh_chest"+i,k=mPressK(id),cur=o.cur==="gems"?"💎":"🪙",can=(o.cur==="gems"?PROF.gems:PROF.coins)>=o.p;
  ctx.save();ctx.globalAlpha=ent==null?1:ent;ctx.translate(x+w/2,y+h/2);ctx.scale(k,k);ctx.translate(-w/2,-h/2);
  var g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"rgba(44,30,62,0.97)");g.addColorStop(1,"rgba(16,10,24,0.97)");ctx.fillStyle=g;roundRect(ctx,0,0,w,h,12);ctx.fill();
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha*=0.45+0.1*Math.sin(t*3+i);var gl=glowSpr(C.c==="rainbow"?"#ffffff":C.c);ctx.drawImage(gl,w*0.05,-h*0.05,w*0.9,h*0.8);ctx.restore();
  var im=chestImg(o.r,0);if(im){var iw=Math.min(w*0.62,h*0.62*im.width/im.height),ih=iw*im.height/im.width;ctx.drawImage(im,w/2-iw/2,h*0.4-ih/2+Math.sin(t*2.2+i)*2,iw,ih);}
  mText("Cofre "+C.n,w/2,h*0.73,12,col,"center","900",3);
  ctx.fillStyle=can?(o.cur==="gems"?"rgba(0,151,167,0.9)":"rgba(255,160,0,0.9)"):"rgba(60,60,72,0.9)";roundRect(ctx,8,h-26,w-16,20,10);ctx.fill();
  mText(cur+" "+fmtN(o.p),w/2,h-16,12,"#fff","center","900",2.5);
  ctx.strokeStyle=col;ctx.lineWidth=2;roundRect(ctx,1,1,w-2,h-2,12);ctx.stroke();ctx.restore();
  mHit(id,x,y,w,h,i);
}
function drawShop(){
  menuBg(0.45);mBack();mTitle("Tienda");drawTopBar();
  var s=layout.safe,t=MENU.t||0,x0=s.l+12,gw=SW-s.l-s.r-24,y0=s.t+48,i;
  /* tabs */
  var tabs=[["⭐","DESTACADO"],["👕","ASPECTOS"],["🎁","COFRES"]],tw=Math.min(150,(gw-16)/3);
  for(i=0;i<3;i++){mButton("sh_tab"+i,SW/2-(tw*3+16)/2+i*(tw+8),y0,tw,28,tabs[i][1],tabs[i][0],SHOP.tab===i?"red":"dark",{fs:11});}
  var cy=y0+38,ch=SH-s.b-8-cy,ent=function(j){return clamp((t-MENU.enterT)*4-j*0.25,0,1);};
  if(SHOP.tab===0){
    var offers=shopOffers(),lw=gw*0.62,cw=(lw-16)/3,cardH=Math.min(ch-18,220);
    mText("OFERTAS DEL DÍA",x0+4,cy+6,12,"#ffe08a","left","900",3);mText("⏱ Nuevas en "+fmtLeft(untilMidnight()),x0+lw,cy+6,9.5,"#cfc6df","right","800",2.2);
    for(i=0;i<offers.length;i++)drawShopSkinCard(x0+i*(cw+8),cy+16,cw,cardH,offers[i].hero,offers[i].id,offers[i].disc,"sh_off"+i,i,ent(i));
    var rx=x0+lw+12,rw=gw-lw-12,gh=Math.min(70,ch*0.3);
    /* daily gift */
    var free=PROF.shop.gift!==dayKey();
    ctx.save();ctx.globalAlpha=ent(3);mPanel(rx,cy,rw,gh,12,0.92);ctx.restore();
    mText("🎁",rx+24,cy+gh/2,22,"#fff","center","700",0);
    mText("REGALO DIARIO",rx+46,cy+gh*0.32,11,"#ffe08a","left","900",2.5);mText("+"+GEM.giftCoins+" 🪙  +"+GEM.gift+" 💎",rx+46,cy+gh*0.62,11,"#fff","left","800",2.5);
    if(free)mButton("sh_gift",rx+rw-84,cy+gh/2-15,76,30,"GRATIS",null,"green",{fs:12,shine:1});
    else mText("Mañana más · "+fmtLeft(untilMidnight()),rx+rw-10,cy+gh/2,9,"#b0a8c0","right","800",2);
    if(free)drawBadgeDot(rx+rw-10,cy+gh/2-15,1);
    /* chest offers */
    var oy=cy+gh+8,oh=ch-gh-8,ow=(rw-8)/2;
    drawShopChestCard(rx,oy,ow,oh,SHOP_CHESTS[1],1,ent(4));drawShopChestCard(rx+ow+8,oy,ow,oh,SHOP_CHESTS[2],2,ent(5));
  }else if(SHOP.tab===1){
    var hero=SHOP.hero||selectedHero||"classic",hb=Math.min(120,(gw-32)/5);
    for(i=0;i<HEROES.length;i++){var H=HEROES[i],on=H.id===hero,hx=SW/2-(hb*5+32)/2+i*(hb+8),k2=mPressK("sh_hero"+i);
      ctx.save();ctx.translate(hx+hb/2,cy+15);ctx.scale(k2,k2);ctx.translate(-hb/2,-15);ctx.fillStyle=on?"rgba(255,213,79,0.22)":"rgba(255,255,255,0.07)";roundRect(ctx,0,0,hb,30,10);ctx.fill();
      ctx.strokeStyle=on?"#ffd54f":"rgba(255,255,255,0.2)";ctx.lineWidth=on?2:1.2;roundRect(ctx,0,0,hb,30,10);ctx.stroke();
      var th=skinThumb(H.id,"orig",26);if(th)ctx.drawImage(th,3,2,26,26);
      var own=SKINS[H.id].filter(function(q){return q.gem&&PROF.own["skin:"+H.id+":"+q.id];}).length;
      mText(H.name,34,11,10,"#fff","left","900",2.2);mText(own+"/5",34,22,8.5,"#80deea","left","800",2);ctx.restore();mHit("sh_hero"+i,hx,cy,hb,30,H.id);}
    var list=SKINS[hero].filter(function(q){return q.gem;}),n=list.length,cw2=Math.min(150,(gw-(n-1)*8)/n),ty=cy+38,th2=Math.min(ch-38,230),sx0=SW/2-(n*cw2+(n-1)*8)/2;
    for(i=0;i<n;i++)drawShopSkinCard(sx0+i*(cw2+8),ty,cw2,th2,hero,list[i].id,0,"sh_sk"+i,{hero:hero,id:list[i].id},ent(i));
  }else{
    var cards=SHOP_CHESTS.length+1,cw3=Math.min(170,(gw-(cards-1)*10)/cards),h3=Math.min(ch-20,210),sx=SW/2-(cards*cw3+(cards-1)*10)/2;
    for(i=0;i<SHOP_CHESTS.length;i++)drawShopChestCard(sx+i*(cw3+10),cy,cw3,h3,SHOP_CHESTS[i],i,ent(i));
    /* pass XP pack */
    var xx=sx+3*(cw3+10),left=PROF.shop.xpDay===dayKey()?SHOP_XP.max-PROF.shop.xpN:SHOP_XP.max,kk=mPressK("sh_xp");
    ctx.save();ctx.globalAlpha=ent(3);ctx.translate(xx+cw3/2,cy+h3/2);ctx.scale(kk,kk);ctx.translate(-cw3/2,-h3/2);
    var g3=ctx.createLinearGradient(0,0,0,h3);g3.addColorStop(0,"rgba(30,44,66,0.97)");g3.addColorStop(1,"rgba(10,16,28,0.97)");ctx.fillStyle=g3;roundRect(ctx,0,0,cw3,h3,12);ctx.fill();
    mText("🎖️",cw3/2,h3*0.36,40,"#fff","center","700",0);mText("+"+SHOP_XP.n+" XP de pase",cw3/2,h3*0.63,12,"#80d8ff","center","900",3);mText("Quedan "+left+" hoy",cw3/2,h3*0.74,9.5,"#cfc6df","center","800",2);
    ctx.fillStyle=left>0&&PROF.coins>=SHOP_XP.p?"rgba(255,160,0,0.9)":"rgba(60,60,72,0.9)";roundRect(ctx,8,h3-26,cw3-16,20,10);ctx.fill();mText("🪙 "+SHOP_XP.p,cw3/2,h3-16,12,"#fff","center","900",2.5);
    ctx.strokeStyle="#80d8ff";ctx.lineWidth=2;roundRect(ctx,1,1,cw3-2,h3-2,12);ctx.stroke();ctx.restore();mHit("sh_xp",xx,cy,cw3,h3,0);
    mText("💎 Las gemas se ganan jugando: misiones semanales, pase, logros, cofres y Vorgath. Sin dinero real.",SW/2,cy+h3+14,9.5,"#b2ebf2","center","800",2.2);
  }
  if(SHOP.buy)drawShopBuy();
}
function drawShopBuy(){
  var B=SHOP.buy,u=clamp((MENU.t-SHOP.buyT)/0.22,0,1),e=1-Math.pow(1-u,3),s=layout.safe;
  ctx.fillStyle="rgba(6,4,12,"+(0.75*e)+")";ctx.fillRect(0,0,SW,SH);mHit("ov_buy_bg",0,0,SW,SH);
  var w=Math.min(460,SW-s.l-s.r-40),h=Math.min(SH-s.t-s.b-30,250),x=(SW-w)/2,y=(SH-h)/2+(1-e)*30;
  ctx.save();ctx.globalAlpha=e;mPanel(x,y,w,h,16,0.98);
  var price=B.p,cur=B.cur==="gems"?"💎":"🪙",have=B.cur==="gems"?PROF.gems:PROF.coins,can=have>=price;
  if(B.kind==="skin"){var d=skinDef(B.hero,B.id),im=skinFull(B.hero,B.id),pw=w*0.36;
    var gl=glowSpr(rarHex(d.rar));ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.5;ctx.drawImage(gl,x+8,y+10,pw,h-20);ctx.restore();
    if(im){var ih=h-36,iw=ih*im.width/im.height;ctx.drawImage(im,x+8+pw/2-iw/2,y+18,iw,ih);}
    var tx=x+pw+18;mText(d.name,tx,y+36,20,"#fff","left","900",4);mText(RAR[d.rar].n.toUpperCase()+" · "+p21HeroName(B.hero),tx,y+62,11,rarCol(d.rar),"left","900",2.5);
    mText("Un traje pintado de verdad: se ve en el menú,",tx,y+90,9.5,"#cfc6df","left","700",2);mText("al elegir héroe, en la partida y en el final.",tx,y+104,9.5,"#cfc6df","left","700",2);
  }else{var C=CHEST[B.r],ci=chestImg(B.r,0),pw2=w*0.36;if(ci){var cw=pw2*0.8,chh=cw*ci.height/ci.width;ctx.drawImage(ci,x+8+pw2/2-cw/2,y+h/2-chh/2-10,cw,chh);}
    var tx2=x+pw2+18;mText("Cofre "+C.n,tx2,y+36,20,C.c==="rainbow"?rainbowCol(MENU.t||0):C.c,"left","900",4);
    mText("🪙 "+C.coins[0]+"–"+C.coins[1]+"  ·  🎖️ +"+C.pxp+" XP",tx2,y+64,10,"#fff","left","800",2);
    mText("💎 Gemas: "+(C.gp>=100?"seguro":C.gp+"%")+"  ·  👕 Aspecto: "+C.skin+"%",tx2,y+82,10,"#fff","left","800",2);
    mText("🧩 Piezas: "+(C.pcsP>=100?"seguro":C.pcsP+"%"),tx2,y+100,10,"#fff","left","800",2);}
  var bx=x+w-200,by=y+h-50;
  mButton("ov_buy_no",bx,by,86,36,"Cancelar",null,"dark",{fs:12});
  if(can)mButton("ov_buy_yes",bx+94,by,100,36,cur+" "+fmtN(price),null,B.cur==="gems"?"teal":"gold",{fs:14,shine:1});
  else{mButton("ov_buy_no2",bx+94,by,100,36,cur+" "+fmtN(price),null,"grey",{fs:14});mText("Te faltan "+fmtN(price-have)+" "+cur,bx+144,by-10,9.5,"#ff8a80","center","900",2);}
  if(!can&&B.cur==="gems")mText("Gana gemas: misiones semanales, pase, logros y cofres",x+18,y+h-14,9,"#80deea","left","800",2);
  ctx.restore();
}
function shopBuyConfirm(){
  var B=SHOP.buy;if(!B)return;var have=B.cur==="gems"?PROF.gems:PROF.coins;if(have<B.p){try{sfx("hurt");}catch(e){}return;}
  if(B.cur==="gems")PROF.gems-=B.p;else PROF.coins-=B.p;
  PROF.gemLog["gasto_"+B.kind]=(PROF.gemLog["gasto_"+B.kind]|0)+(B.cur==="gems"?B.p:0);
  SHOP.buy=null;
  if(B.kind==="skin"){var key="skin:"+B.hero+":"+B.id;PROF.own[key]=1;PROF.newSkin[B.hero]=1;PROF.eq.skin[B.hero]=B.id;delete PROF.pieces[B.hero+":"+B.id];
    if(B.offer!=null)PROF.shop.bought[B.offer]=1;profSave();checkAchievements(1);skinWarm(B.hero,B.id);
    giftOpenStart([{k:"skin",hero:B.hero,id:B.id}]);}
  else{profSave();chestOpenStart(B.r,null);}
}
/* a reveal with no chest (shop purchase): straight to the card flip */
function giftOpenStart(rw){for(var i=0;i<rw.length;i++)if(rw[i].hero)skinWarm(rw[i].hero,rw[i].id);P21.open={r:null,gift:1,t:0,rw:rw,parts:[],v2:1,B:0,ri:0,rt:0,cues:{},boom:1};}

/* ---------- chest opening: one animation per rarity, rewards one by one ---------- */
var CH_TL={
  poco:{B:1.05,cues:[[0.16,"ch_drop"],[0.34,"ch_creak"],[0.84,"ch_latch"]],boom:["ch_pop"],shake:0},
  epico:{B:1.6,cues:[[0.16,"ch_drop"],[0.3,"ch_charge"],[1.02,"ch_creak"],[1.38,"ch_latch"]],boom:["ch_burst_e"],shake:5},
  asombroso:{B:2.3,cues:[[0.16,"ch_drop"],[0.3,"ch_vortex"],[1.2,"ch_charge"],[1.72,"ch_creak"],[2.04,"ch_latch"]],boom:["ch_burst_a"],shake:12}
};
function rwRar(w){if(w.k==="skin"){var d=skinDef(w.hero,w.id);return d&&d.rar||"epica";}if(w.k==="gems")return "rara";if(w.k==="pieces")return w.done?"epica":"comun";return "comun";}
function rwDur(w){if(w.k==="skin")return rwRar(w)==="legendaria"?2.1:1.7;return w.k==="gems"?0.9:0.75;}
chestOpenStart=function(r,slot){
  var rw=chestRewards(r);for(var i=0;i<rw.length;i++)rewardApply(rw[i]);
  if(slot!=null&&slot>=0)PROF.chests[slot]=null;
  profSave();checkAchievements(1);
  chestImg(r,0);chestImg(r,1);
  for(i=0;i<rw.length;i++)if(rw[i].hero&&rw[i].id)skinWarm(rw[i].hero,rw[i].id);
  P21.open={r:r,t:0,rw:rw,boom:0,parts:[],v2:1,B:CH_TL[r].B,ri:-1,rt:0,cues:{},shake:0};
};
var SHAKE={a:0};
function chFx(O,n,cx,cy,cols,sp0,sp1,grav,life,sz){for(var q=0;q<n;q++){var a=Math.random()*6.283,sp=sp0+Math.random()*(sp1-sp0);O.parts.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(grav?80:0),g:grav,l:life*(0.7+Math.random()*0.5),l0:life,c:cols[q%cols.length],r:sz*(0.6+Math.random()*0.8)});}}
function chRays(cx,cy,n,R,a,colF,rot,wid){ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.globalCompositeOperation="lighter";
  for(var i=0;i<n;i++){ctx.rotate(Math.PI*2/n);ctx.globalAlpha=a*(i%2?0.55:1);var g=ctx.createLinearGradient(0,0,R,0);g.addColorStop(0,colF(i));g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(R,-R*(wid||0.09));ctx.lineTo(R,R*(wid||0.09));ctx.closePath();ctx.fill();}
  ctx.restore();ctx.globalAlpha=1;}
function rwStart(O){var w=O.rw[O.ri];if(!w)return;O.rt=0;O.flipS=0;var R=rwRar(w),cx=SW/2,cy=SH*0.42;
  try{if(w.k==="coins")sfx("rw_coin");else if(w.k==="gems")sfx("rw_gem");else if(w.k==="skin")sfx("rw_card");else sfx("rw_card");}catch(e){}
  if(w.k==="coins")chFx(O,26,cx,cy,["#ffd54f","#ffecb3","#ffb300"],120,300,1,1.1,4);
  else if(w.k==="gems")chFx(O,30,cx,cy,["#80deea","#e0f7fa","#4dd0e1","#ffffff"],80,260,0,0.9,3.2);
  else if(w.k==="pxp")chFx(O,18,cx,cy,["#80d8ff","#ffffff"],80,200,0,0.8,3);
  else if(w.k==="pieces")chFx(O,18,cx,cy,["#b9f6ca","#69f0ae"],80,220,1,0.9,3.5);}
function drawChestOpen(){
  var O=P21.open;if(!O)return;
  var dt=MENU.dt||0.016;O.t+=dt;var t=O.t,r=O.r,C=r?CHEST[r]:null,rb=r==="asombroso",TL=r?CH_TL[r]:null,B=O.B,cx=SW/2,cy=SH*0.42,MT=MENU.t||0;
  var col=r?(rb?rainbowCol(MT):C.c):"#ffd54f",S=Math.min(SH*0.42,190);
  /* timeline sounds */
  if(TL&&t<B+0.05)for(var ci=0;ci<TL.cues.length;ci++){var cu=TL.cues[ci];if(t>=cu[0]&&!O.cues[ci]){O.cues[ci]=1;if(t-cu[0]<0.25)try{sfx(cu[1]);}catch(e){}if(cu[1]==="ch_drop"&&TL.shake)SHAKE.a=Math.max(SHAKE.a,TL.shake*0.6);}}
  if(TL&&t>=B&&!O.boom){O.boom=1;O.boomT=t;try{TL.boom.forEach(function(n){sfx(n);});}catch(e){}
    SHAKE.a=Math.max(SHAKE.a,TL.shake);
    if(r==="poco"){chFx(O,26,cx,cy,["#8d6e63","#a1887f","#5d4037"],120,300,1,1.1,4.5);chFx(O,22,cx,cy,["#4fc3f7","#ffffff"],100,260,1,0.9,3);}
    else if(r==="epico"){chFx(O,60,cx,cy,["#b388ff","#e1bee7","#7c4dff","#ffffff"],160,420,1,1.2,3.6);}
    else{var rcs=[];for(var q=0;q<12;q++)rcs.push(rainbowCol(0,q*30));rcs.push("#ffffff");chFx(O,110,cx,cy,rcs,180,520,1,1.5,4);}
    try{if(PROF.set.vib&&navigator.vibrate)navigator.vibrate(r==="poco"?30:r==="epico"?[40,40,80]:[60,40,60,40,160]);}catch(e){}}
  if(O.boom&&O.ri<0&&t>=B+0.55){O.ri=0;rwStart(O);}
  /* screen shake (decays) */
  SHAKE.a*=Math.pow(0.02,dt);var shx=(Math.random()-0.5)*SHAKE.a,shy=(Math.random()-0.5)*SHAKE.a;
  ctx.save();ctx.translate(shx,shy);
  ctx.fillStyle="rgba(6,4,12,"+Math.min(rb?0.93:0.86,t*3+0.2)+")";ctx.fillRect(-20,-20,SW+40,SH+40);
  var pre=B?clamp(t/B,0,1):1,post=O.boom?clamp((t-(O.boomT||0))/0.4,0,1):1;
  /* ---- intro per rarity ---- */
  if(r){
    var gl=glowSpr(rb?"#ffffff":C.c);
    if(r==="asombroso"&&t<B+0.6){ /* rainbow vortex + light beams from the seams */
      var va=clamp((t-0.25)/0.5,0,1)*(t<B?1:clamp(1-(t-B)/0.6,0,1)),spin=t*t*1.6;
      ctx.save();ctx.translate(cx,cy);ctx.globalCompositeOperation="lighter";
      for(var arm=0;arm<6;arm++){for(var sg=0;sg<22;sg++){var f=sg/22,ang=spin+arm*Math.PI/3+f*4.2,rad=S*(1.9-f*1.6)*(1-0.25*pre);ctx.globalAlpha=va*0.55*(1-f*0.4);ctx.fillStyle=rainbowCol(MT,arm*60+sg*8);ctx.beginPath();ctx.arc(Math.cos(ang)*rad,Math.sin(ang)*rad*0.8,3+f*5,0,7);ctx.fill();}}
      ctx.restore();ctx.globalAlpha=1;
      var bm=clamp((t-1.0)/(B-1.0),0,1);if(bm>0&&t<B){for(var bi=0;bi<5;bi++){var bx=cx+(bi-2)*S*0.16+Math.sin(MT*9+bi)*2,ba=bm*(0.4+0.6*Math.abs(Math.sin(MT*13+bi*1.7)));ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=ba*0.8;
        var bg=ctx.createLinearGradient(0,cy,0,cy-SH*0.6);bg.addColorStop(0,rainbowCol(MT,bi*70));bg.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=bg;ctx.fillRect(bx-3-bm*5,cy-SH*0.6,6+bm*10,SH*0.6);ctx.restore();}}
    }
    if(r==="epico"&&t<B){ /* purple energy converging into the chest */
      if(t>0.3&&Math.random()<dt*70){var a0=Math.random()*6.283,R0=S*(1.2+Math.random()*0.8);O.parts.push({x:cx+Math.cos(a0)*R0,y:cy+Math.sin(a0)*R0*0.8,vx:0,vy:0,tx:cx,ty:cy,l:0.7,l0:0.7,c:Math.random()<0.3?"#ffffff":"#b388ff",r:2.5+Math.random()*2.5,suck:1});}
      var ring=clamp((t-0.3)/(B-0.3),0,1);ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle="#b388ff";ctx.lineWidth=2+ring*4;ctx.globalAlpha=0.25+0.5*ring;ctx.beginPath();ctx.ellipse(cx,cy,S*(1.1-0.5*ring),S*(0.85-0.4*ring),0,0,7);ctx.stroke();ctx.restore();
    }
    ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=Math.min(1,0.3+0.5*pre*(r==="poco"?0.6:1)+(O.boom?0.3:0));ctx.drawImage(gl,cx-S*1.3,cy-S*1.1,S*2.6,S*2.4);ctx.restore();
    if(O.boom){var rot=MT*0.5,ra=Math.min(1,(t-O.boomT)*3)*(r==="poco"?0.32:0.55)*(O.ri>=0?0.6:1);chRays(cx,cy,rb?16:12,Math.max(SW,SH)*0.75,ra,function(i){return rb?rainbowCol(MT,i*(360/16)):C.c;},rot,r==="poco"?0.06:0.09);}
    /* chest: drop, wobble (creak), shake harder, latch, pop */
    var drop=clamp(t/0.18,0,1),landT=t-0.18,bounce=drop<1?(1-Math.pow(1-drop,3)):1+(landT<0.25?Math.sin(landT/0.25*Math.PI)*0.07:0);
    var shake=0;if(t<B){if(r==="poco")shake=(t>0.34&&t<0.9)?Math.sin((t-0.34)/0.56*Math.PI)*4:t>0.84?3*Math.pow(clamp((t-0.84)/(B-0.84),0,1),2):0;else shake=Math.pow(pre,2)*(r==="epico"?8:11);}
    var sx=Math.sin(t*70)*shake,rotS=r==="poco"&&t>0.34&&t<0.9?Math.sin(t*16)*0.06:Math.sin(t*55)*shake*0.012;
    var pop=O.boom?1+0.2*Math.exp(-(t-O.boomT)*6)*Math.cos((t-O.boomT)*18):1,shrink=O.ri>=0?1-0.35*clamp((t-B-0.55)/0.3,0,1):1;
    var im=chestImg(r,!!O.boom),ims=im||chestImg(r,0);
    var fade=O.ri>=0?1-clamp((t-B-0.55)/0.25,0,1):1;
    if(ims&&fade>0){var w=S*bounce*pop*shrink,h=w*ims.height/ims.width,yy=cy-(1-drop)*SH*0.45;ctx.save();ctx.globalAlpha=fade;ctx.translate(cx+sx,yy);ctx.rotate(rotS);ctx.drawImage(ims,-w/2,-h/2,w,h);
      if(t<B&&r!=="poco"){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.35*pre*(0.6+0.4*Math.sin(MT*20));ctx.drawImage(gl,-w*0.6,-h*0.6,w*1.2,h*1.2);}
      ctx.restore();}
  }
  /* particles */
  if(O.parts.length){ctx.save();ctx.globalCompositeOperation="lighter";
    for(var p=0;p<O.parts.length;p++){var P=O.parts[p];
      if(P.suck){P.x+=(P.tx-P.x)*Math.min(1,dt*4.5);P.y+=(P.ty-P.y)*Math.min(1,dt*4.5);}else{P.x+=P.vx*dt;P.y+=P.vy*dt;if(P.g)P.vy+=260*dt;P.vx*=0.985;}
      P.l-=dt;if(P.l<=0){O.parts.splice(p,1);p--;continue;}ctx.globalAlpha=clamp(P.l/P.l0,0,1);ctx.fillStyle=P.c;ctx.fillRect(P.x-P.r/2,P.y-P.r/2,P.r,P.r);}
    ctx.restore();}
  if(O.boom&&r&&t-O.boomT<(rb?0.4:0.25)){ctx.fillStyle="rgba(255,255,255,"+(1-(t-O.boomT)/(rb?0.4:0.25))*(r==="poco"?0.5:0.85)+")";ctx.fillRect(-20,-20,SW+40,SH+40);}
  if(O.boom&&r&&t-O.boomT<0.7){var sw=clamp((t-O.boomT)/0.7,0,1);ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=(1-sw)*0.9;ctx.strokeStyle=rb?rainbowCol(MT):C.c;ctx.lineWidth=10*(1-sw)+2;ctx.beginPath();ctx.ellipse(cx,cy,S*0.3+sw*Math.max(SW,SH)*0.6,(S*0.3+sw*Math.max(SW,SH)*0.6)*0.75,0,0,7);ctx.stroke();ctx.restore();}
  /* banner */
  if(r&&O.boom){var ba=clamp((t-O.boomT-0.1)*4,0,1),bs=1+0.4*(1-ba);
    ctx.save();ctx.globalAlpha=ba;ctx.translate(cx,layout.safe.t+30);ctx.scale(bs,bs);mText("¡COFRE "+C.n.toUpperCase()+"!",0,0,Math.min(28,SW*0.042),col,"center","900",6);ctx.restore();}
  if(!r&&O.gift){ctx.save();mText("¡NUEVO ASPECTO!",cx,layout.safe.t+30,Math.min(28,SW*0.042),"#ffd54f","center","900",6);ctx.restore();}
  /* ---- rewards, one by one ---- */
  var n=O.rw.length;
  if(O.ri>=0){
    O.rt+=dt;
    var cur=O.rw[Math.min(O.ri,n-1)],done=O.ri>=n;
    /* collected row at the bottom */
    var mw=Math.min(96,(SW-60)/n-8),mh=mw*0.82,tot=n*mw+(n-1)*8,mx0=cx-tot/2,my=SH-layout.safe.b-mh-26;
    for(var j=0;j<n;j++){if(j>=O.ri&&!done)break;var ent=j===O.ri-1&&!done?clamp(O.rt/0.25,0,1):1;ctx.save();ctx.globalAlpha=ent;drawRewardCard(O.rw[j],mx0+j*(mw+8),my+(1-ent)*20,mw,mh,1);ctx.restore();}
    if(!done){var w2=cur,R2=rwRar(w2),D=rwDur(w2),u=clamp(O.rt/0.3,0,1),e2=1-Math.pow(1-u,3),cw=Math.min(180,SW*0.23),chh=Math.min(SH*0.44,cw*1.15),ccy=SH*0.44;
      var rc=rarCol(R2,MT);
      if(w2.k==="skin"){ /* card back in rarity colours, then a big flip */
        var flip=clamp((O.rt-0.45)/0.3,0,1),sxk=Math.abs(Math.cos(flip*Math.PI)),front=flip>=0.5;
        if(front&&!O.flipS){O.flipS=1;try{sfx("rw_flip");if(R2==="legendaria"){sfx("rw_fanfare");SHAKE.a=Math.max(SHAKE.a,10);}else if(R2==="mitica"){sfx("rw_epic");sfx("rarity4");}else if(R2==="epica")sfx("rw_epic");else sfx("rarity2");}catch(e){}
          var cc=R2==="legendaria"?[rainbowCol(0,0),rainbowCol(0,60),rainbowCol(0,120),rainbowCol(0,180),rainbowCol(0,240),rainbowCol(0,300),"#ffffff"]:[rarHex(R2),"#ffffff"];chFx(O,R2==="legendaria"?90:50,cx,ccy,cc,140,420,1,1.3,4);}
        if(front){chRays(cx,ccy,R2==="legendaria"?18:12,Math.max(SW,SH)*0.6,0.5*clamp((O.rt-0.6)*3,0,1),function(i){return R2==="legendaria"?rainbowCol(MT,i*20):rarHex(R2);},MT*0.6,0.08);}
        ctx.save();ctx.translate(cx,ccy+(1-e2)*SH*0.2);ctx.scale(e2*sxk*(front?1+0.08*Math.exp(-(O.rt-0.6)*5):1),e2);
        if(!front){var g=ctx.createLinearGradient(0,-chh/2,0,chh/2);g.addColorStop(0,R2==="legendaria"?rainbowCol(MT,0):rarHex(R2));g.addColorStop(1,"#1a0f24");ctx.fillStyle=g;roundRect(ctx,-cw/2,-chh/2,cw,chh,14);ctx.fill();
          ctx.strokeStyle="#ffffff";ctx.lineWidth=3;roundRect(ctx,-cw/2+3,-chh/2+3,cw-6,chh-6,12);ctx.stroke();mText("?",0,0,cw*0.45,"#ffffff","center","900",6);
          ctx.globalAlpha=0.5+0.5*Math.sin(MT*20);ctx.strokeStyle=rc;ctx.lineWidth=5;roundRect(ctx,-cw/2-4,-chh/2-4,cw+8,chh+8,16);ctx.stroke();ctx.globalAlpha=1;}
        else{var d=skinDef(w2.hero,w2.id),fi=skinFull(w2.hero,w2.id),gg=ctx.createLinearGradient(0,-chh/2,0,chh/2);gg.addColorStop(0,"rgba(48,34,66,0.98)");gg.addColorStop(1,"rgba(16,10,24,0.98)");ctx.fillStyle=gg;roundRect(ctx,-cw/2,-chh/2,cw,chh,14);ctx.fill();
          ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.55;ctx.drawImage(glowSpr(rarHex(R2)),-cw*0.7,-chh*0.6,cw*1.4,chh*1.0);ctx.restore();
          if(fi){var ih=chh*0.66,iw=ih*fi.width/fi.height;ctx.drawImage(fi,-iw/2,-chh/2+12,iw,ih);}else{var th=skinThumb(w2.hero,w2.id,96);if(th)ctx.drawImage(th,-cw*0.3,-chh/2+16,cw*0.6,cw*0.6);}
          mText(d?d.name:w2.id,0,chh*0.27,Math.min(17,cw*0.1),"#fff","center","900",4);
          ctx.fillStyle=rc;roundRect(ctx,-48,chh*0.36,96,16,8);ctx.fill();mText((RAR[R2]||RAR.epica).n.toUpperCase(),0,chh*0.36+8,9.5,"#140a1c","center","900",0);
          ctx.strokeStyle=rc;ctx.lineWidth=R2==="legendaria"?4:3;roundRect(ctx,-cw/2,-chh/2,cw,chh,14);ctx.stroke();}
        ctx.restore();
        if(front){mText(p21HeroName(w2.hero)+(w2.dup?" · repetido: +"+GEM.dupCoins+" 🪙 +"+GEM.dupGems+" 💎":" · ¡equípalo en HÉROES!"),cx,ccy+chh/2+16,11,w2.dup?"#cfc6df":"#b9f6ca","center","900",3);}
      }else{
        var L=p21RewardLabel(w2),pulse=1+0.06*Math.exp(-O.rt*5)*Math.sin(O.rt*30);
        ctx.save();ctx.translate(cx,ccy+(1-e2)*SH*0.15);ctx.scale(e2*pulse,e2*pulse);
        var gl2=glowSpr(w2.k==="coins"?"#ffd54f":w2.k==="gems"?"#80deea":w2.k==="pxp"?"#80d8ff":"#b9f6ca");ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.6;ctx.drawImage(gl2,-cw*0.8,-cw*0.8,cw*1.6,cw*1.6);ctx.restore();
        if(w2.k==="gems"){ctx.save();ctx.rotate(MT*0.8);ctx.globalCompositeOperation="lighter";for(var st=0;st<4;st++){ctx.rotate(Math.PI/4);ctx.globalAlpha=0.7;ctx.fillStyle="#e0f7fa";ctx.beginPath();ctx.moveTo(0,-cw*0.55);ctx.lineTo(4,0);ctx.lineTo(0,cw*0.55);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();}ctx.restore();}
        var th2=w2.k==="pieces"&&w2.hero?skinThumb(w2.hero,w2.id,96):null;
        if(th2){ctx.drawImage(th2,-cw*0.28,-cw*0.42,cw*0.56,cw*0.56);mText("🧩",cw*0.24,-cw*0.1,cw*0.16,"#fff","center","700",0);}else mText(L[0],0,-cw*0.16,cw*0.36,"#fff","center","700",0);
        mText(L[1],0,cw*0.3,Math.min(26,cw*0.15),L[3]||"#fff","center","900",5);mText(L[2],0,cw*0.47,11,"#e8e0f0","center","800",3);
        ctx.restore();
      }
      mText((O.ri+1)+" / "+n,cx,ccy-chh/2-14,11,"#cfc6df","center","900",3);
    }
    if(done){mText(O.gift?"¡Ya es tuyo!":"¡Todo para ti!",cx,SH*0.42,20,col,"center","900",5);}
    var ready=done||O.rt>=rwDur(cur);
    mText(done?"Toca para cerrar":ready?"Toca para el siguiente":"Toca para saltar",cx,SH-layout.safe.b-12,11.5,"rgba(255,255,255,"+(0.6+0.4*Math.sin(MT*4))+")","center","800",3);
    if(!done)mText("Saltar todo ›",SW-layout.safe.r-16,layout.safe.t+30,11,"#cfc6df","right","800",3);
  }else if(t<B){mText("Toca para abrir ya",cx,SH-layout.safe.b-12,11,"rgba(255,255,255,0.5)","center","800",3);}
  ctx.restore();
  mHit("ov_chest",0,0,SW,SH);
  if(O.ri>=0&&O.ri<n)mHit("ov_chest_skip",SW-layout.safe.r-110,layout.safe.t+12,110,36);
}
function chestOpenTap(skipAll){
  var O=P21.open;if(!O)return;
  if(!O.v2){P21.open=null;return;}
  if(O.r&&!O.boom){O.t=O.B;return;}
  if(O.ri<0){O.ri=0;O.t=Math.max(O.t,O.B+0.55);rwStart(O);return;}
  var n=O.rw.length;
  if(skipAll){O.ri=n;O.rt=0;try{sfx("rw_card");}catch(e){}return;}
  if(O.ri>=n){P21.open=null;try{sfx("click");}catch(e){}return;}
  var D=rwDur(O.rw[O.ri]);
  if(O.rt<D){var w=O.rw[O.ri];if(w.k==="skin"&&O.rt<0.75)O.rt=0.75;else O.rt=D;return;}
  O.ri++;if(O.ri<n)rwStart(O);else{O.rt=0;try{sfx("rarity3");}catch(e){}}
}

/* ---------- end-of-game chest reveal ---------- */
function drawEndChest(x,y,w,h,lr){
  if(!lr||(!lr.chest&&!lr.chestFull))return;
  var now=performance.now()/1000; /* own clock: the end screens are not menu screens (MENU.t does not run there) */
  if(lr.revealT==null){lr.revealT=now;lr.revS=0;}
  var t=now-lr.revealT-0.35,MT=now;if(t<0)return;
  var cmp=h<100,a=clamp(t/0.25,0,1);ctx.save();ctx.globalAlpha*=a;
  var full=!lr.chest,C=full?null:CHEST[lr.chest],rb=lr.chest==="asombroso",col=full?"#ff5252":rb?rainbowCol(MT):C.c;
  ctx.fillStyle="rgba(16,10,26,0.9)";roundRect(ctx,x,y,w,h,14);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=2.2;roundRect(ctx,x,y,w,h,14);ctx.stroke();
  /* 4 slots, the new chest drops into its slot */
  var ss=cmp?Math.min(h-18,40):Math.min(38,(w-40)/4),sg=cmp?5:6,sx0=cmp?x+w-(ss*4+sg*3)-10:x+w/2-(ss*4+sg*3)/2,sy=cmp?y+h/2-ss/2:y+h-ss-10,slot=lr.slot!=null?lr.slot:-1;
  var tX=cmp?x+14:x+w/2,tA=cmp?"left":"center",tW=cmp?sx0-x-20:w;
  for(var i=0;i<4;i++){var c=PROF.chests[i],xx=sx0+i*(ss+sg),isNew=i===slot&&!full,jig=full?Math.sin(MT*30+i)*clamp(1-(t-0.9)/0.6,0,1)*3:0;
    ctx.fillStyle="rgba(0,0,0,0.45)";roundRect(ctx,xx+jig,sy,ss,ss,8);ctx.fill();
    ctx.strokeStyle=isNew?col:full?"#ff5252":"rgba(255,255,255,0.18)";ctx.lineWidth=isNew||full?2:1.2;roundRect(ctx,xx+jig,sy,ss,ss,8);ctx.stroke();
    if(c&&!isNew){var ti=chestThumb(c.r,ss*0.8);if(ti)ctx.drawImage(ti,xx+jig+ss/2-ti._w/2,sy+ss/2-ti._h/2,ti._w,ti._h);}}
  if(cmp&&(lr.pxp||lr.gems)){var ex=(lr.pxp?"🎖️ +"+fmtN(lr.pxp)+" XP de pase":"")+(lr.gems?"   💎 +"+lr.gems:"");mText(ex,x+w*0.5,y+h/2,11,"#b3e5fc","center","900",2.5);}
  if(full){
    var fy=cmp?y+h/2:y+20;
    mText("🎁 RANURAS LLENAS",tX,cmp?fy-12:fy,cmp?14:15,"#ff8a80","center"===tA?"center":"left","900",4);
    mText("Este cofre se ha perdido",tX,cmp?fy+5:y+40,10,"#ffcdd2",tA,"800",2.5);
    mText("Abre uno en el menú para dejar sitio",tX,cmp?fy+19:y+54,9.5,"#cfc6df",tA,"800",2.2);
    if(!lr.revS&&t>0.1){lr.revS=1;try{sfx("hurt");}catch(e){}}
  }else{
    /* drop from above into the slot */
    var tx=slot>=0?sx0+slot*(ss+sg)+ss/2:x+w/2,ty=sy+ss/2,big=cmp?h*0.9:Math.min(h*0.5,74),hx=cmp?sx0-ss*0.9:x+w/2,hy=cmp?y+h/2:y+h*0.42;
    var u=clamp(t/0.5,0,1),land=clamp((t-0.95)/0.35,0,1),e=1-Math.pow(1-u,3);
    var px=hx+(tx-hx)*land,py=(y-30+(hy-(y-30))*e)+(ty-hy)*land*land,sc=big*(1-land)+ss*0.82*land;
    if(u>=1&&!lr.revS){lr.revS=1;try{sfx("ch_drop");sfx(rb?"rarity4":lr.chest==="epico"?"rarity3":"rarity2");}catch(e2){}}
    if(land>=1&&lr.revS===1){lr.revS=2;try{sfx("ch_latch");}catch(e3){}}
    /* rarity glow + rays (rainbow for Asombroso) */
    ctx.save();ctx.beginPath();roundRect(ctx,x,y,w,h,14);ctx.clip();
    if(rb||lr.chest==="epico"){chRays(px,py,rb?14:10,w*0.8,(rb?0.5:0.35)*(1-land*0.6),function(k){return rb?rainbowCol(MT,k*26):C.c;},MT*0.7,0.1);}
    ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.6*a;var gl=glowSpr(rb?"#ffffff":C.c);ctx.drawImage(gl,px-sc*1.2,py-sc*1.1,sc*2.4,sc*2.2);ctx.restore();
    var im=chestImg(lr.chest,0);if(im){var bo=u<1?0:Math.sin(clamp((t-0.5)/0.3,0,1)*Math.PI)*0.08*(1-land),iw=sc*(1+bo),ih=iw*im.height/im.width;ctx.drawImage(im,px-iw/2,py-ih/2,iw,ih);}
    /* the big chest stays on show once its copy is in the slot */
    var back=clamp((t-1.35)/0.35,0,1);if(back>0&&im){var bw=big*(cmp?0.7:0.85)*(1+0.03*Math.sin(MT*2.4)),bh=bw*im.height/im.width,bx=cmp?hx:x+w/2,by=cmp?y+h/2:y+h*0.44;
      ctx.save();ctx.globalAlpha=a*back;ctx.globalCompositeOperation="lighter";ctx.globalAlpha*=0.5;ctx.drawImage(gl,bx-bw*1.1,by-bw*0.9,bw*2.2,bw*1.8);ctx.restore();
      ctx.save();ctx.globalAlpha=a*back;ctx.drawImage(im,bx-bw/2,by-bh/2+Math.sin(MT*2.2)*1.5,bw,bh);ctx.restore();}
    var la=clamp((t-0.5)/0.3,0,1);ctx.globalAlpha=a*la;
    mText("¡COFRE "+C.n.toUpperCase()+"!",tX,cmp?y+h/2-9:y+16,14,col,tA,"900",4);
    mText(land>=1?(cmp?"Guardado en la ranura "+(slot+1):"Guardado en la ranura "+(slot+1)+" · ábrelo en el menú"):"",tX,cmp?y+h/2+9:sy-9,9.5,"#e8e0f0",tA,"800",2.2);
  }
  ctx.restore();
}
function endRunExtra(){
  /* left card (mirrors the chest card): pass XP + gems of this run */
  var r=MENU.lastRun;if(!r||(!r.pxp&&!r.gems))return;
  var G=endChestGeom(),s=layout.safe,now=performance.now()/1000;if(r.extraT==null)r.extraT=now;var a=clamp((now-r.extraT-0.2)/0.3,0,1);
  var w=G.w,h=r.gems?92:66,x=layout.isPortrait?SW/2-w/2:s.l+14,y=layout.isPortrait?G.y-h-10:SH*0.5-h/2;
  ctx.save();ctx.globalAlpha*=a;ctx.fillStyle="rgba(16,10,26,0.9)";roundRect(ctx,x,y,w,h,14);ctx.fill();ctx.strokeStyle="#80d8ff";ctx.lineWidth=2;roundRect(ctx,x,y,w,h,14);ctx.stroke();
  mText("PASE DE BATALLA",x+14,y+16,10,"#80d8ff","left","900",2.5);mText("Nv "+passTier(),x+w-14,y+16,11,"#ffe08a","right","900",2.5);
  mText("🎖️ +"+fmtN(r.pxp||0)+" XP",x+14,y+38,14,"#fff","left","900",3);
  var tier=passTier(),pr=tier>=PASS_TIERS?1:(PROF.pass.xp-tier*PASS_TIER_XP)/PASS_TIER_XP;mBar(x+w-14-80,y+33,80,9,pr,"#40c4ff");
  if(r.gems)mText("💎 +"+r.gems+" gema"+(r.gems>1?"s":""),x+14,y+68,14,"#80deea","left","900",3);
  ctx.restore();
}
function endChestGeom(){var s=layout.safe,w=Math.min(230,SW*0.26),h=Math.min(150,SH*0.4),x=SW-s.r-14-w,y=SH*0.5-h/2;
  if(layout.isPortrait){w=Math.min(300,SW-40);h=130;x=SW/2-w/2;y=SH-s.b-h-14;}return {x:x,y:y,w:w,h:h};}
(function(){
  drawRunRewards=function(){
    var r=MENU.lastRun;if(!r)return;
    if(game&&game.state==="dead"&&typeof DEATH!=="undefined"&&DEATH){if(layout.isPortrait){var Gp=endChestGeom();drawEndChest(Gp.x,Gp.y,Gp.w,Gp.h,r);}return;}
    var y=SH*0.45,txt="+"+fmtN(r.xp)+" XP   ·   +"+fmtN(r.coins)+" 🪙"+(r.lvUp?"   ·   ⭐ ¡Nivel "+r.lvUp+"!":"");
    ctx.save();ctx.font="900 15px system-ui";var tw=ctx.measureText(txt).width+36;
    ctx.fillStyle="rgba(20,12,30,0.85)";roundRect(ctx,SW/2-tw/2,y-15,tw,30,15);ctx.fill();ctx.strokeStyle="#ffd54f";ctx.lineWidth=2;roundRect(ctx,SW/2-tw/2,y-15,tw,30,15);ctx.stroke();
    mText(txt,SW/2,y,15,"#ffe082","center","900",0);ctx.restore();
    endRunExtra();var G=endChestGeom();drawEndChest(G.x,G.y,G.w,G.h,r);
  };
  var _ld=drawLevelDone;
  drawLevelDone=function(){_ld();var r=MENU.lastRun;if(!r)return;var G=endChestGeom();
    if(r.gems){mText("💎 +"+r.gems+" gemas"+(r.gems>=GEM.vorgathFirst?" · ¡primera victoria contra Vorgath!":""),SW/2,SH*0.36-14,12,"#80deea","center","900",3);}
    endRunExtra();drawEndChest(G.x,G.y,G.w,G.h,r);};
  /* death screen (landscape): a compact strip between the badges and the buttons, once the panel has counted up */
  if(typeof drawDeathScreen==="function"){var _dd=drawDeathScreen;drawDeathScreen=function(){_dd();try{var D=DEATH,r=MENU.lastRun;if(!D||!r||layout.isPortrait)return;
    if(D.t<DEATH_CINE+DEATH_PANEL_IN+2.2)return;var L=deathLayout(),P=L.panel,y1=P.y+84+2*(Math.min(58,(P.h-84-150)/2)+8)+6+47,y2=L.retry.y-6;
    if(y2-y1<38)return;drawEndChest(P.x+18,y1,P.w-36,Math.min(64,y2-y1),r);}catch(e){}};}
  /* remember which slot the run's chest went to (for the drop-into-slot reveal) */
  var _cg=chestGrant;chestGrant=function(r){var i=_cg(r);if(i>=0&&MENU)MENU._lastGrantSlot=i;return i;};
  var _re2=profRunEnd;profRunEnd=function(kind){MENU._lastGrantSlot=null;_re2(kind);if(MENU.lastRun&&MENU._lastGrantSlot!=null&&MENU.lastRun.chest)MENU.lastRun.slot=MENU._lastGrantSlot;};
})();

/* ---------- megapower keeps your painted outfit ---------- */
/* the outfit stays as painted; the power shows through the existing overlays (storm aura + eyes, arc reactor + repulsors,
   hulk size + cracks). The variant is built once per sprite (same pixel pass as the plain mega look) and its limbs are
   pre-cut by megaPrepStep, so the fight costs nothing extra per frame. */
function megaSkinId(){try{var p=game&&game.player;if(!p)return null;var sk=equippedSkin(p.hero);return REAL_SKINS[sk]?sk:null;}catch(e){return null;}}
(function(){
  var _t=artTint;
  artTint=function(name,img,tint){
    if(tint==="thor"||tint==="iron"||tint==="hulk"){
      var k=name+"|"+tint,sk=megaSkinId(),R=sk&&REAL_SKINS[sk];
      var meta=ART.meta&&ART.meta[name],hd=!!(meta&&(img.naturalWidth||img.width)>meta.w*1.5);
      if(R&&R[name]&&!hd){
        var ks=k+"|"+sk,c=ART_TINT[ks];
        if(!c){var si=skinImg(name+"_"+sk);if(!si){var cur=ART_TINT[k];if(cur&&cur._megaSkin)delete ART_TINT[k];return _t(name,img,tint);}
          var m=megaSkin(name,si,tint);c=document.createElement("canvas");c.width=si.naturalWidth||si.width;c.height=si.naturalHeight||si.height;c.getContext("2d").drawImage(si,0,0);
          c._mega=m._mega;c._skinBase=img;c._megaSkin=sk;ART_TINT[ks]=c;}
        ART_TINT[k]=c; /* megaPrepStep looks here: pre-cuts the limbs of the variant actually used */
        return c;
      }
      var cur2=ART_TINT[k];if(cur2&&cur2._megaSkin)delete ART_TINT[k];
    }
    return _t(name,img,tint);
  };
})();

/* ---------- screen + input ---------- */
MENU_ST.shop=1;
drawMenuScreen=function(){
  MENU.hits=[];var now=performance.now();MENU.dt=Math.min(0.05,(now-(MENU._last||now))/1000);MENU._last=now;MENU.t+=MENU.dt;
  if(GEMFX.t>0)GEMFX.t-=MENU.dt;
  var st=game.state;
  if(MENU.lastLv&&account.level>MENU.lastLv)MENU.lvToast=account.level;MENU.lastLv=account.level;
  if(st==="title")drawMenuTitle();else if(st==="levels")drawLevels();else if(st==="heroes")drawHeroes();else if(st==="unlocks")drawUnlocks();
  else if(st==="achievements")drawAchievements();else if(st==="stats")drawStats();else if(st==="settings")drawSettingsMenu();else if(st==="credits")drawCredits();else if(st==="howto")drawHowToMenu();
  else if(st==="pass")drawPass();else if(st==="missions")drawMissions();else if(st==="shop")drawShop();
  if(st==="heroes"){var hh=HEROES[MENU.heroIdx];if(hh&&PROF.newSkin[hh.id]){PROF.newSkin[hh.id]=0;profSave();}}
  if(P21.info&&st==="title")drawChestInfo();
  if(st==="title"&&PROF._welcomeGems&&!P21.open){PROF._welcomeGems=0;profSave();menuToast("💎 ¡Llegan las gemas! +"+PROF.gems+" por todo lo que ya habías logrado","#80deea");}
  drawToasts();
  if(P21.open)drawChestOpen();
};
(function(){
  var _ma=menuAction;
  menuAction=function(h){
    var id=h.id,st=game.state;function ok(){try{sfx("click");}catch(e){}}
    if(id==="ov_chest"){chestOpenTap(0);return;}
    if(id==="ov_chest_skip"){chestOpenTap(1);return;}
    if(st==="title"&&id==="shop"){ok();try{sfx("card");}catch(e){}SHOP.buy=null;menuGo("shop");return;}
    if(st==="settings"&&id==="credits"){ok();MENU.credFrom="settings";menuGo("credits");return;}
    if(st==="credits"&&id==="back"&&MENU.credFrom==="settings"){ok();MENU.credFrom=null;menuGo("settings");return;}
    if(st==="shop"){
      if(SHOP.buy){if(id==="ov_buy_yes"){shopBuyConfirm();return;}if(id==="ov_buy_no"||id==="ov_buy_bg"){ok();SHOP.buy=null;return;}if(id==="ov_buy_no2"){try{sfx("hurt");}catch(e){}return;}return;}
      if(/^sh_tab\d$/.test(id)){ok();SHOP.tab=+id.slice(6);MENU.enterT=MENU.t;return;}
      if(/^sh_hero\d$/.test(id)){ok();SHOP.hero=h.data;MENU.enterT=MENU.t;return;}
      if(id==="sh_gift"){if(PROF.shop.gift===dayKey())return;PROF.shop.gift=dayKey();PROF.coins+=GEM.giftCoins;gemsAdd(GEM.gift,"regalo");profSave();try{sfx("rw_coin");sfx("rw_gem");}catch(e){}menuToast("🎁 Regalo diario: +"+GEM.giftCoins+" 🪙 +"+GEM.gift+" 💎","#b9f6ca");return;}
      var sk=null,off=null;
      if(/^sh_off\d$/.test(id)){var o=shopOffers()[h.data];if(o){sk={hero:o.hero,id:o.id};off={i:h.data,disc:o.disc};}}
      if(/^sh_sk\d$/.test(id))sk=h.data;
      if(sk){skinWarm(sk.hero,sk.id);if(PROF.own["skin:"+sk.hero+":"+sk.id]){ok();PROF.eq.skin[sk.hero]=sk.id;profSave();menuToast("👕 "+skinDef(sk.hero,sk.id).name+" equipado en "+p21HeroName(sk.hero),"#ff80ab");return;}
        ok();SHOP.buy={kind:"skin",hero:sk.hero,id:sk.id,cur:"gems",p:skinPrice(sk.hero,sk.id,off&&off.disc),offer:off?off.i:null};SHOP.buyT=MENU.t;return;}
      if(/^sh_chest\d$/.test(id)){var c=SHOP_CHESTS[h.data];ok();SHOP.buy={kind:"chest",r:c.r,cur:c.cur,p:c.p};SHOP.buyT=MENU.t;return;}
      if(id==="sh_xp"){var left=PROF.shop.xpDay===dayKey()?SHOP_XP.max-PROF.shop.xpN:SHOP_XP.max;
        if(left<=0){try{sfx("hurt");}catch(e){}menuToast("Vuelve mañana: máximo "+SHOP_XP.max+" al día","#cfc6df");return;}
        if(PROF.coins<SHOP_XP.p){try{sfx("hurt");}catch(e){}menuToast("Te faltan "+fmtN(SHOP_XP.p-PROF.coins)+" 🪙","#ff8a80");return;}
        if(PROF.shop.xpDay!==dayKey()){PROF.shop.xpDay=dayKey();PROF.shop.xpN=0;}PROF.shop.xpN++;PROF.coins-=SHOP_XP.p;var t0=passTier();passAddXP(SHOP_XP.n,1);profSave();try{sfx("rw_card");}catch(e){}
        menuToast("🎖️ +"+SHOP_XP.n+" XP de pase"+(passTier()>t0?" · ¡Nivel "+passTier()+"!":""),"#80d8ff");return;}
    }
    if(st==="heroes"&&id.indexOf("skin")===0&&!/^skin_/.test(id)){
      var hero=HEROES[MENU.heroIdx].id,s2=SKINS[hero][h.data];
      if(s2&&s2.gem&&!skinOk(hero,s2)){skinWarm(hero,s2.id);MENU.previewSkin={hero:hero,id:s2.id};var pc=PROF.pieces[hero+":"+s2.id]||0;
        menuToast("💎 "+s2.gem+" en la TIENDA"+(pc?" · 🧩 "+pc+"/"+s2.pc:"")+" · "+RAR[s2.rar].n+" (vista previa)",rarHex(s2.rar));return;}
    }
    return _ma(h);
  };
})();
PROF=profMigrate3(PROF);profSave();
(function(){var _pl=profLoad;profLoad=function(){_pl();PROF=profMigrate3(PROF);return PROF;};})();
