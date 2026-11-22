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
  passClaim=function(n){var ok=_pc(n);if(ok&&PASS_GEMS[n]){gemsAdd(PASS_GEMS[n],"pase");profSave();try{sfx("cx_gem");}catch(e){}menuToast("💎 +"+PASS_GEMS[n]+" gemas (nivel "+n+" del pase)","#80deea");}return ok;};
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
    if(L==="w"){gemsAdd(GEM.weekly,"misiones");try{sfx("cx_gem");}catch(e){}menuToast("💎 +"+GEM.weekly+" gemas (misión semanal)","#80deea");}
    else{var all=PROF.miss.daily.length&&PROF.miss.daily.every(function(m){return m.c;});
      if(all&&PROF.miss.bonus!==PROF.miss.day){PROF.miss.bonus=PROF.miss.day;gemsAdd(GEM.dailyAll,"misiones");try{sfx("cx_gem");}catch(e){}menuToast("💎 +"+GEM.dailyAll+" gemas · ¡las 3 diarias hechas!","#80deea");}}
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

/* ---------- v21.2 chest opening: drop + idle bob with shine sweep, tap to charge (rising riser, light leaking from the lid),
   burst with god rays, flash and camera punch, rewards fly out one by one, and a full-screen celebration for big drops.
   Everything glowy is pre-rendered once (sprites), particles come from a fixed pool, no shadowBlur. ---------- */
var CH_TL={
  poco:{C:0.55,cues:[[0,"cx_wobble"]],boom:["cx_burst_p"],shake:3,punch:0.05,vib:30,nR:10,stars:46,coins:10,gems:0},
  epico:{C:1.35,cues:[[0,"cx_riser_e"]],boom:["cx_burst_e"],shake:7,punch:0.08,vib:[40,40,80],nR:14,stars:90,coins:16,gems:10},
  asombroso:{C:2.0,cues:[[0,"cx_riser_a"]],boom:["cx_burst_a"],shake:11,punch:0.12,vib:[60,40,60,40,160],nR:18,stars:150,coins:24,gems:22}
};
var CHFX={P:[],N:560,i:0,spr:{},HUES:[]};
(function(){for(var i=0;i<CHFX.N;i++)CHFX.P.push({a:0});for(var h=0;h<12;h++)CHFX.HUES.push("hsl("+(h*30)+",100%,62%)");})();
function cfxCan(w,h){var c=document.createElement("canvas");c.width=w;c.height=h;return c;}
function cfxStar(col){var k="st"+col,c=CHFX.spr[k];if(c)return c;c=cfxCan(48,48);var g=c.getContext("2d"),gr=g.createRadialGradient(24,24,0,24,24,24);
  gr.addColorStop(0,"rgba(255,255,255,1)");gr.addColorStop(0.2,col);gr.addColorStop(1,"rgba(0,0,0,0)");g.globalAlpha=0.6;g.fillStyle=gr;g.fillRect(0,0,48,48);g.globalAlpha=1;
  g.fillStyle="#ffffff";g.beginPath();g.moveTo(24,2);g.lineTo(26,22);g.lineTo(46,24);g.lineTo(26,26);g.lineTo(24,46);g.lineTo(22,26);g.lineTo(2,24);g.lineTo(22,22);g.closePath();g.fill();return CHFX.spr[k]=c;}
function cfxSoft(col){var k="sf"+col,c=CHFX.spr[k];if(c)return c;c=cfxCan(128,128);var g=c.getContext("2d"),gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,col);gr.addColorStop(0.35,col);gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.globalAlpha=0.9;g.fillRect(0,0,128,128);return CHFX.spr[k]=c;}
function cfxRays(col,n){var k="ry"+col+n,c=CHFX.spr[k];if(c)return c;var R=256;c=cfxCan(512,512);var g=c.getContext("2d");g.translate(R,R);g.globalCompositeOperation="lighter";
  for(var i=0;i<n;i++){var a=i/n*6.283,w=(i%2?0.045:0.08)*(0.8+0.4*((i*37)%7)/7),cc=col==="rainbow"?CHFX.HUES[Math.floor(i*12/n)%12]:col,gr=g.createRadialGradient(0,0,0,0,0,R);
    gr.addColorStop(0,"rgba(255,255,255,0.95)");gr.addColorStop(0.14,cc);gr.addColorStop(0.6,cc.indexOf("hsl")===0?cc.replace("hsl","hsla").replace(")",",0.35)"):hexA(cc,0.35));gr.addColorStop(1,"rgba(0,0,0,0)");
    g.fillStyle=gr;g.globalAlpha=i%2?0.6:1;g.beginPath();g.moveTo(0,0);g.arc(0,0,R,a-w,a+w);g.closePath();g.fill();}
  return CHFX.spr[k]=c;}
function cfxFan(col){var k="fn"+col,c=CHFX.spr[k];if(c)return c;c=cfxCan(256,256);var g=c.getContext("2d");g.translate(128,250);g.globalCompositeOperation="lighter";
  for(var i=0;i<11;i++){var a=-Math.PI/2+(i-5)*0.2+((i*13)%5-2)*0.02,w=i%2?0.035:0.06,cc=col==="rainbow"?CHFX.HUES[(i*2)%12]:col,gr=g.createRadialGradient(0,0,0,0,0,248);
    gr.addColorStop(0,"rgba(255,255,255,1)");gr.addColorStop(0.2,cc);gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.globalAlpha=i%2?0.55:0.9;g.beginPath();g.moveTo(0,0);g.arc(0,0,248,a-w,a+w);g.closePath();g.fill();}
  var gl=g.createRadialGradient(0,0,0,0,0,70);gl.addColorStop(0,"rgba(255,255,255,0.9)");gl.addColorStop(1,"rgba(0,0,0,0)");g.globalAlpha=1;g.fillStyle=gl;g.fillRect(-70,-70,140,140);
  return CHFX.spr[k]=c;}
function cfxBeam(col){var k="bm"+col,c=CHFX.spr[k];if(c)return c;c=cfxCan(48,256);var g=c.getContext("2d"),gr=g.createLinearGradient(0,0,48,0);
  gr.addColorStop(0,"rgba(0,0,0,0)");gr.addColorStop(0.3,col);gr.addColorStop(0.5,"rgba(255,255,255,1)");gr.addColorStop(0.7,col);gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(0,0,48,256);
  g.globalCompositeOperation="destination-in";var v=g.createLinearGradient(0,0,0,256);v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(0.45,"rgba(0,0,0,0.8)");v.addColorStop(1,"rgba(0,0,0,1)");g.fillStyle=v;g.fillRect(0,0,48,256);return CHFX.spr[k]=c;}
function cfxCoin(){var c=CHFX.spr.coin;if(c)return c;c=cfxCan(40,40);var g=c.getContext("2d"),gr=g.createRadialGradient(15,13,2,20,20,19);gr.addColorStop(0,"#fff8d0");gr.addColorStop(0.35,"#ffd54f");gr.addColorStop(0.85,"#e09a00");gr.addColorStop(1,"#a86b00");
  g.fillStyle=gr;g.beginPath();g.arc(20,20,18,0,7);g.fill();g.strokeStyle="#8a5a00";g.lineWidth=2;g.stroke();g.strokeStyle="rgba(255,240,180,0.85)";g.lineWidth=1.6;g.beginPath();g.arc(20,20,12.5,0,7);g.stroke();
  g.fillStyle="rgba(255,255,255,0.75)";g.beginPath();g.ellipse(14,12,5,2.6,-0.6,0,7);g.fill();return CHFX.spr.coin=c;}
function cfxGem(){var c=CHFX.spr.gem;if(c)return c;c=cfxCan(40,40);var g=c.getContext("2d");function poly(p,f){g.fillStyle=f;g.beginPath();g.moveTo(p[0],p[1]);for(var i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.closePath();g.fill();}
  poly([20,37,4,14,11,5,29,5,36,14],"#26c6da");poly([11,5,29,5,25,14,15,14],"#b2ebf2");poly([4,14,15,14,20,37],"#00acc1");poly([36,14,25,14,20,37],"#4dd0e1");poly([15,14,25,14,20,37],"#80deea");
  g.strokeStyle="rgba(255,255,255,0.9)";g.lineWidth=1.3;g.beginPath();g.moveTo(20,37);g.lineTo(4,14);g.lineTo(11,5);g.lineTo(29,5);g.lineTo(36,14);g.closePath();g.stroke();
  g.fillStyle="#fff";g.beginPath();g.moveTo(13,7);g.lineTo(17,7);g.lineTo(14,12);g.closePath();g.fill();return CHFX.spr.gem=c;}
function cfxSil(img){if(!img)return null;if(img._sil)return img._sil;var c=cfxCan(img.width,img.height),g=c.getContext("2d");g.drawImage(img,0,0);g.globalCompositeOperation="source-in";g.fillStyle="#fff";g.fillRect(0,0,c.width,c.height);img._sil=c;return c;}
function cfxWarm(r){try{var rc=r==="asombroso"?"rainbow":CHEST[r].c,n=CH_TL[r].nR;cfxRays(rc,n);cfxFan(rc);cfxCoin();cfxGem();if(r==="asombroso")cfxRays("rainbow",n+4);cfxRays("#ffd54f",12);cfxRays("#80deea",12);cfxRays("#80d8ff",12);
  (r==="asombroso"?CHFX.HUES:[CHEST[r].c,"#ffffff"]).forEach(function(c){cfxStar(c);});}catch(e){}}
function cfxClear(){for(var i=0;i<CHFX.N;i++)CHFX.P[i].a=0;}
/* t: 0 star (additive), 1 soft glow (additive), 2 confetti, 3 coin, 4 gem, 5 suck-in star, 6 rising mote */
function cfxAdd(t,x,y,vx,vy,l,s,c,g){var P=CHFX.P[CHFX.i];CHFX.i=(CHFX.i+1)%CHFX.N;P.a=1;P.t=t;P.x=x;P.y=y;P.vx=vx;P.vy=vy;P.l=P.l0=l;P.s=s;P.c=c;P.g=g||0;P.r=Math.random()*6.283;P.vr=(Math.random()-0.5)*12;P.ph=Math.random()*6.283;return P;}
function cfxBurst(t,n,x,y,sp0,sp1,l,s,cols,g,up){for(var q=0;q<n;q++){var a=Math.random()*6.283,sp=sp0+Math.random()*(sp1-sp0);cfxAdd(t,x,y,Math.cos(a)*sp,Math.sin(a)*sp*(up?0.7:1)-(up||0),l*(0.65+Math.random()*0.6),s*(0.6+Math.random()*0.8),cols[q%cols.length],g);}}
function cfxConfetti(n,lv){var cols=lv>=3?CHFX.HUES:lv===2?["#ff5252","#ff8a80","#ffd54f","#ffffff","#ff4081"]:["#80deea","#ffd54f","#ffffff","#b388ff"];
  for(var q=0;q<n;q++)cfxAdd(2,Math.random()*SW,-10-Math.random()*SH*0.3,(Math.random()-0.5)*60,60+Math.random()*120,2.6+Math.random()*1.4,4+Math.random()*4,cols[q%cols.length],1);}
function cfxDraw(dt){var P,i,al;
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(i=0;i<CHFX.N;i++){P=CHFX.P[i];if(!P.a)continue;
    P.l-=dt;if(P.l<=0){P.a=0;continue;}
    if(P.t===5){var k=Math.min(1,dt*5.5);P.x+=(P.vx-P.x)*k;P.y+=(P.vy-P.y)*k;}
    else if(P.t===6){P.y-=P.vy*dt;P.x+=Math.sin(P.ph+P.l*3)*12*dt;}
    else if(P.t===2){P.vy=Math.min(P.vy+90*dt,170);P.x+=(P.vx+Math.sin(P.ph+P.l*5)*40)*dt;P.y+=P.vy*dt;P.r+=P.vr*dt;}
    else{P.x+=P.vx*dt;P.y+=P.vy*dt;if(P.g)P.vy+=(P.t===3||P.t===4?520:240)*dt;var dmp=Math.pow(0.35,dt);P.vx*=dmp;if(!P.g)P.vy*=dmp;}
    if(P.t>1&&P.t<5)continue;
    al=Math.min(1,P.l/P.l0*1.6);if(P.t===6)al*=Math.min(1,(P.l0-P.l)*3);ctx.globalAlpha=al;
    if(P.t===1){var gs=cfxSoft(P.c);ctx.drawImage(gs,P.x-P.s,P.y-P.s,P.s*2,P.s*2);}
    else{var ss=P.s*(P.t===0?(0.75+0.25*Math.sin(P.ph+P.l*18)):1),sp=cfxStar(P.c);ctx.drawImage(sp,P.x-ss,P.y-ss,ss*2,ss*2);}}
  ctx.globalCompositeOperation="source-over";
  for(i=0;i<CHFX.N;i++){P=CHFX.P[i];if(!P.a||P.t<2||P.t>4)continue;al=Math.min(1,P.l/P.l0*2.5);ctx.globalAlpha=al;
    if(P.t===2){var cs=Math.cos(P.r),sn=Math.sin(P.r),fl=Math.abs(Math.sin(P.ph+P.l*7));ctx.save();ctx.translate(P.x,P.y);ctx.rotate(P.r);ctx.scale(1,0.25+0.75*fl);ctx.fillStyle=P.c;ctx.fillRect(-P.s/2,-P.s*0.3,P.s,P.s*0.6);ctx.restore();}
    else if(P.t===3){var cw=Math.abs(Math.cos(P.ph+P.l*9))*0.85+0.15;ctx.drawImage(cfxCoin(),P.x-P.s*cw,P.y-P.s,P.s*2*cw,P.s*2);}
    else{ctx.drawImage(cfxGem(),P.x-P.s,P.y-P.s,P.s*2,P.s*2);}}
  ctx.restore();}
var CHFX_SCR=null;
function cfxShine(img,x,y,w,h,ph,a){ /* diagonal shine band clipped to the chest silhouette */
  var sil=cfxSil(img);if(!sil||a<=0)return;var K=Math.min(2,dpr||1),cw=Math.ceil(w*K),ch=Math.ceil(h*K);
  if(!CHFX_SCR)CHFX_SCR=cfxCan(cw,ch);if(CHFX_SCR.width<cw||CHFX_SCR.height<ch){CHFX_SCR.width=Math.max(cw,CHFX_SCR.width);CHFX_SCR.height=Math.max(ch,CHFX_SCR.height);}
  var g=CHFX_SCR.getContext("2d");g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation="source-over";g.clearRect(0,0,CHFX_SCR.width,CHFX_SCR.height);
  var bx=(-0.6+ph*2.2)*cw,gr=g.createLinearGradient(bx,0,bx+cw*0.45,ch*0.3);gr.addColorStop(0,"rgba(255,255,255,0)");gr.addColorStop(0.5,"rgba(255,255,255,0.95)");gr.addColorStop(1,"rgba(255,255,255,0)");
  g.fillStyle=gr;g.fillRect(0,0,cw,ch);g.globalCompositeOperation="destination-in";g.drawImage(sil,0,0,cw,ch);
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=a;ctx.drawImage(CHFX_SCR,0,0,cw,ch,x,y,w,h);ctx.restore();}

function rwRar(w){if(w.k==="skin"){var d=skinDef(w.hero,w.id);return d&&d.rar||"epica";}if(w.k==="gems")return "rara";if(w.k==="pieces")return w.done?"epica":"comun";return "comun";}
/* big drops get the full-screen celebration (lv 1..3 scales the show) */
function rwBig(w,r){
  if(w.k==="skin"){var R=rwRar(w);if(R==="legendaria")return {lv:3,txt:"¡LEGENDARIA!",col:"rainbow",R:R};if(R==="mitica")return {lv:2,txt:"¡MÍTICA!",col:RAR.mitica.c,R:R};
    if(r==="asombroso")return {lv:2,txt:"¡"+(RAR[R]||RAR.epica).n.toUpperCase()+"!",col:rarHex(R),R:R};return null;}
  if(w.k==="gems"&&w.n>=20)return {lv:1,txt:"¡LLUVIA DE GEMAS!",col:"#80deea"};
  if(w.k==="coins"&&w.n>=900)return {lv:1,txt:"¡MONTAÑA DE MONEDAS!",col:"#ffd54f"};
  return null;}
function bigImp(B){return B.lv>=2?1.0:0.55;}
function rwDur(w){if(w._big)return bigImp(w._big)+1.15;if(w.k==="skin")return 1.7;return w.k==="gems"||w.k==="coins"?0.95:0.75;}
chestOpenStart=function(r,slot){
  var rw=chestRewards(r);for(var i=0;i<rw.length;i++)rewardApply(rw[i]);
  if(slot!=null&&slot>=0)PROF.chests[slot]=null;
  profSave();checkAchievements(1);
  chestImg(r,0);chestImg(r,1);
  for(i=0;i<rw.length;i++){if(rw[i].hero&&rw[i].id)skinWarm(rw[i].hero,rw[i].id);rw[i]._big=rwBig(rw[i],r);}
  cfxClear();cfxWarm(r);
  P21.open={r:r,t:0,rw:rw,v2:1,ph:"drop",B:null,ri:-1,rt:0,cues:{},boom:0};
};
function giftOpenStart(rw){for(var i=0;i<rw.length;i++){if(rw[i].hero)skinWarm(rw[i].hero,rw[i].id);rw[i]._big=rwBig(rw[i],null);}cfxClear();P21.open={r:null,gift:1,t:0,rw:rw,v2:1,ph:"open",B:0,ri:0,rt:0,cues:{},boom:1,boomT:0};rwStart(P21.open);}
var SHAKE={a:0};
function chVib(p){try{if(PROF.set.vib&&navigator.vibrate)navigator.vibrate(p);}catch(e){}}
function chCharge(O){if(O.ph!=="drop"&&O.ph!=="idle")return;var TL=CH_TL[O.r];O.ph="charge";O.tC=O.t;O.B=O.t+TL.C;O.cues={};}
function chBoom(O){var TL=CH_TL[O.r],r=O.r,rb=r==="asombroso",C=CHEST[r],cx=SW/2,S=Math.min(SH*0.44,200),cy=SH*0.44,ly=cy-S*0.12;
  O.ph="open";O.boom=1;O.boomT=O.t;O.B=O.t;try{TL.boom.forEach(function(n){sfx(n);});}catch(e){}
  SHAKE.a=Math.max(SHAKE.a,TL.shake);O.pT=O.t;O.pA=TL.punch;O.flT=O.t;O.flA=r==="poco"?0.45:rb?0.95:0.8;
  var cols=rb?CHFX.HUES:r==="epico"?["#b388ff","#e1bee7","#7c4dff","#ffffff"]:["#4fc3f7","#b3e5fc","#ffffff"];
  cfxBurst(0,TL.stars,cx,ly,140,rb?560:440,1.3,rb?9:8,cols,1,90);
  cfxBurst(1,rb?14:8,cx,ly,40,200,0.7,rb?60:44,rb?["#ffffff","#ffd54f","#80deea"]:[C.c,"#ffffff"],0);
  cfxBurst(3,TL.coins,cx,ly,160,380,1.6,9,["#fff"],1,260);
  if(TL.gems)cfxBurst(4,TL.gems,cx,ly,140,360,1.6,9,["#fff"],1,240);
  if(rb)cfxConfetti(70,3);
  chVib(TL.vib);}
function rwStart(O){var w=O.rw[O.ri];if(!w)return;O.rt=0;O.flipS=0;O.arr=0;O.bigHit=0;var cx=SW/2,cy=SH*0.44;
  if(w._big){var B=w._big;try{if(B.lv>=2)sfx("cx_big_hit");else sfx("cx_whoosh");}catch(e){}SHAKE.a=Math.max(SHAKE.a,2);return;}
  try{if(w.k==="coins")sfx("cx_coin");else if(w.k==="gems")sfx("cx_gem");else sfx("cx_card");}catch(e){}}
function rwArrive(O,w,cx,cy){var R=rwRar(w);
  if(w.k==="coins"){cfxBurst(3,Math.min(26,6+Math.round(w.n/30)),cx,cy,120,320,1.4,9,["#fff"],1,240);cfxBurst(0,16,cx,cy,80,240,0.8,7,["#ffd54f","#fff3c4"],0);}
  else if(w.k==="gems"){cfxBurst(4,Math.min(22,4+w.n),cx,cy,110,300,1.4,9,["#fff"],1,220);cfxBurst(0,18,cx,cy,80,240,0.9,7,["#80deea","#e0f7fa"],0);}
  else if(w.k==="pxp")cfxBurst(0,16,cx,cy,80,220,0.8,7,["#80d8ff","#ffffff"],0);
  else if(w.k==="pieces")cfxBurst(0,16,cx,cy,80,220,0.9,7,["#b9f6ca","#69f0ae","#ffffff"],0);}
/* skin card front, centred on the origin */
function drawSkinFront(w2,cw,chh,R2,rc){var d=skinDef(w2.hero,w2.id),fi=skinFull(w2.hero,w2.id),gg=ctx.createLinearGradient(0,-chh/2,0,chh/2);gg.addColorStop(0,"rgba(48,34,66,0.98)");gg.addColorStop(1,"rgba(16,10,24,0.98)");ctx.fillStyle=gg;roundRect(ctx,-cw/2,-chh/2,cw,chh,14);ctx.fill();
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.55;ctx.drawImage(glowSpr(rarHex(R2)),-cw*0.7,-chh*0.6,cw*1.4,chh*1.0);ctx.restore();
  if(fi){var ih=chh*0.66,iw=ih*fi.width/fi.height;ctx.drawImage(fi,-iw/2,-chh/2+12,iw,ih);}else{var th=skinThumb(w2.hero,w2.id,96);if(th)ctx.drawImage(th,-cw*0.3,-chh/2+16,cw*0.6,cw*0.6);}
  mText(d?d.name:w2.id,0,chh*0.27,Math.min(17,cw*0.1),"#fff","center","900",4);
  ctx.fillStyle=rc;roundRect(ctx,-48,chh*0.36,96,16,8);ctx.fill();mText((RAR[R2]||RAR.epica).n.toUpperCase(),0,chh*0.36+8,9.5,"#140a1c","center","900",0);
  ctx.strokeStyle=rc;ctx.lineWidth=R2==="legendaria"?4:3;roundRect(ctx,-cw/2,-chh/2,cw,chh,14);ctx.stroke();}
function drawCardBack(cw,chh,R2,MT){var g=ctx.createLinearGradient(0,-chh/2,0,chh/2);g.addColorStop(0,R2==="legendaria"?rainbowCol(MT,0):rarHex(R2));g.addColorStop(1,"#1a0f24");ctx.fillStyle=g;roundRect(ctx,-cw/2,-chh/2,cw,chh,14);ctx.fill();
  ctx.strokeStyle="#ffffff";ctx.lineWidth=3;roundRect(ctx,-cw/2+3,-chh/2+3,cw-6,chh-6,12);ctx.stroke();mText("?",0,0,cw*0.45,"#ffffff","center","900",6);}
function rwAmount(w,e){if(w.k==="coins")return (w.bonus?"Extra ":"")+"+"+fmtN(Math.round(w.n*e));if(w.k==="gems")return "+"+Math.round(w.n*e);if(w.k==="pxp")return "+"+fmtN(Math.round(w.n*e));return null;}
function drawChestOpen(){
  var O=P21.open;if(!O)return;
  var dt=Math.min(0.05,MENU.dt||0.016);O.t+=dt;var t=O.t,r=O.r,C=r?CHEST[r]:null,rb=r==="asombroso",TL=r?CH_TL[r]:null,cx=SW/2,cy=SH*0.44,MT=MENU.t||0;
  var col=r?(rb?rainbowCol(MT):C.c):"#ffd54f",hexc=r?(rb?"#ffffff":C.c):"#ffd54f",rcol=r?(rb?"rainbow":C.c):"#ffd54f",S=Math.min(SH*0.44,200),ly=cy-S*0.12;
  /* ---- phase machine ---- */
  if(r){
    if(O.ph==="drop"&&t>=0.3){O.ph="idle";O.tI=t;cfxSil(chestImg(r,0));try{sfx("cx_land");if(rb)sfx("cx_shimmer");}catch(e){}SHAKE.a=Math.max(SHAKE.a,TL.shake*0.5+1);O.landT=t;
      cfxBurst(0,18,cx,cy+S*0.38,60,200,0.6,6,[hexc==="#ffffff"?"#e0f7fa":hexc,"#ffffff"],0);}
    if(O.ph==="charge"){for(var ci=0;ci<TL.cues.length;ci++){var cu=TL.cues[ci];if(t-O.tC>=cu[0]&&!O.cues[ci]){O.cues[ci]=1;try{sfx(cu[1]);}catch(e){}}}
      if(r!=="poco"&&Math.random()<dt*(rb?90:60)){var a0=Math.random()*6.283,R0=S*(1.1+Math.random()*0.9);var Pp=cfxAdd(5,cx+Math.cos(a0)*R0,cy+Math.sin(a0)*R0*0.8,cx,ly,0.55,4+Math.random()*4,rb?CHFX.HUES[(Math.random()*12)|0]:(Math.random()<0.3?"#ffffff":C.c));}
      if(t>=O.B)chBoom(O);}
    if((O.ph==="idle"||O.ph==="drop")&&Math.random()<dt*(rb?16:10))cfxAdd(6,cx+(Math.random()-0.5)*S*1.1,cy+S*0.3,0,30+Math.random()*40,1.6,3+Math.random()*3,rb?CHFX.HUES[(Math.random()*12)|0]:(Math.random()<0.4?"#ffffff":C.c));
    if(O.boom&&O.ri<0&&t>=O.boomT+0.8){O.ri=0;rwStart(O);}
  }
  /* ---- camera: shake + punch zoom ---- */
  SHAKE.a*=Math.pow(0.02,dt);var shx=(Math.random()-0.5)*SHAKE.a,shy=(Math.random()-0.5)*SHAKE.a;
  var zm=1;if(O.ph==="charge")zm+=0.05*Math.pow(clamp((t-O.tC)/TL.C,0,1),2);if(O.pT!=null){var pk=t-O.pT;zm+=O.pA*Math.exp(-pk*6)*Math.cos(pk*15);}
  ctx.save();
  ctx.fillStyle="rgba(6,4,12,"+Math.min(rb?0.93:0.88,t*3+0.2)+")";ctx.fillRect(0,0,SW,SH);
    ctx.translate(cx+shx,cy+shy);ctx.scale(zm,zm);ctx.translate(-cx,-cy);
  var pre=O.ph==="charge"?clamp((t-O.tC)/TL.C,0,1):O.boom?1:0,sinceB=O.boom?t-O.boomT:0;
  /* ---- chest stage ---- */
  if(r){
    var fade=O.ri>=0?1-clamp((t-O.boomT-0.8)/0.3,0,1):1;
    if(fade>0){
      ctx.save();ctx.globalAlpha=fade;
      /* prismatic rings (Asombroso) and slow rays behind the closed chest */
      if(!O.boom&&r!=="poco"){var ra0=(rb?0.22:0.14)+pre*0.5;ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=fade*ra0*Math.min(1,t*2);var RS=S*(2.0+pre*0.6),ry=cfxRays(rcol,TL.nR);
        ctx.translate(cx,cy);ctx.rotate(MT*(0.25+pre*2.5));ctx.drawImage(ry,-RS,-RS,RS*2,RS*2);ctx.restore();}
      if(rb&&!O.boom){ctx.save();ctx.globalCompositeOperation="lighter";for(var ri=0;ri<5;ri++){var rr=S*(0.75+ri*0.2+0.08*Math.sin(MT*2+ri))*(1-0.25*pre);ctx.globalAlpha=fade*(0.18+0.25*pre)*(1-ri/6);ctx.strokeStyle=rainbowCol(MT,ri*50);ctx.lineWidth=3+pre*3;ctx.beginPath();ctx.ellipse(cx,cy,rr,rr*0.78,0,0,7);ctx.stroke();}ctx.restore();}
      /* god rays + lid fan after the burst */
      if(O.boom){var ga=Math.min(1,sinceB*4)*(r==="poco"?0.5:0.8),RS2=Math.max(SW,SH)*0.8*(0.7+0.3*Math.min(1,sinceB*3));ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=fade*ga;ctx.translate(cx,ly);ctx.rotate(MT*0.35);ctx.drawImage(cfxRays(rcol,TL.nR),-RS2,-RS2,RS2*2,RS2*2);
        if(rb){ctx.rotate(-MT*0.7);ctx.globalAlpha=fade*ga*0.5;ctx.drawImage(cfxRays(rb?"rainbow":"#ffffff",TL.nR+4),-RS2*0.7,-RS2*0.7,RS2*1.4,RS2*1.4);}ctx.restore();
        var fa=fade*(0.55+0.45*Math.exp(-sinceB*3)),FW=S*(2.2+0.6*Math.exp(-sinceB*4));ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=fa;ctx.drawImage(cfxFan(rcol),cx-FW/2,ly-FW*0.97,FW,FW);ctx.restore();}
      /* aura */
      var au=O.boom?0.9:(0.38+0.14*Math.sin(MT*3)+0.6*pre);ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=fade*Math.min(1,au);ctx.drawImage(glowSpr(hexc),cx-S*1.25,cy-S*1.05,S*2.5,S*2.3);ctx.restore();
      /* chest body: drop with stretch, landing squash, idle bob + breathe, charge shake, burst pop */
      var im0=chestImg(r,0),im=O.boom?(chestImg(r,1)||im0):im0;
      if(im){var sx=1,sy=1,yy=cy,rot=0,ox=0;
        if(O.ph==="drop"){var u=clamp(t/0.3,0,1);yy=cy-(1-u*u)*SH*0.75;sy=1+0.14*u;sx=1-0.07*u;}
        else{var lt=t-(O.landT||0.3),k=Math.exp(-lt*8)*Math.cos(lt*21);sx=1+0.15*k;sy=1-0.15*k;}
        if(O.ph==="idle"){var it=t-O.tI;yy-=S*0.04*(0.5-0.5*Math.cos(it*2.6));var br=1+0.015*Math.sin(it*2.6);sx*=br;sy*=br;}
        if(O.ph==="charge"){var ct=t-O.tC;if(r==="poco"){[0,0.16,0.3].forEach(function(k0){var dd=ct-k0;if(dd>=0&&dd<0.16){var w0=Math.sin(dd/0.16*Math.PI);rot+=0.09*w0*(k0===0.16?-1:1);sy*=1-0.07*w0;sx*=1+0.05*w0;yy-=S*0.05*w0;}});}
          else{var am=Math.pow(pre,1.6)*(rb?9:7);ox=Math.sin(t*72)*am;rot=Math.sin(t*51)*am*0.01;var pu=1+0.06*pre+0.03*Math.sin(t*30)*pre;sx*=pu;sy*=pu;}}
        if(O.boom){var bk=sinceB,pop=1+0.22*Math.exp(-bk*6)*Math.cos(bk*16);sx*=pop;sy*=pop;}
        var shr=O.ri>=0?1-0.35*clamp((t-O.boomT-0.8)/0.3,0,1):1,w=S*shr,h=w*im.height/im.width;
        /* ground shadow */
        var hgt=clamp((cy-yy)/(SH*0.5),0,1);ctx.save();ctx.globalAlpha=fade*0.55*(1-hgt*0.7);ctx.drawImage(glowSpr("#000000"),cx-w*0.48*(1-hgt*0.4),cy+h*0.36,w*0.96*(1-hgt*0.4),h*0.2);ctx.restore();
        ctx.save();ctx.translate(cx+ox,yy+h/2);ctx.rotate(rot);ctx.scale(sx,sy);ctx.drawImage(im,-w/2,-h,w,h);
        /* glowing hot before the burst */
        if(O.ph==="charge"&&r!=="poco"){var sil=cfxSil(im0);if(sil){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=fade*Math.pow(pre,2.2)*(0.7+0.3*Math.sin(t*40));ctx.drawImage(sil,-w/2,-h,w,h);}}
        ctx.restore();
        /* shine sweep while it waits (and while charging) */
        if(O.ph==="idle"){var sp=((t-(O.tI||0))%1.9)/1.0;if(sp<1)cfxShine(im0,cx-w/2*sx+ox,yy+h/2-h*sy,w*sx,h*sy,sp,fade*0.75);}
        /* light leaking out of the lid */
        if(O.ph==="charge"){var lk=Math.pow(pre,1.4)*(0.75+0.25*Math.sin(t*37)),LW=S*(0.9+1.1*pre);ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=fade*lk;ctx.drawImage(cfxFan(rcol),cx+ox-LW/2,ly-LW*0.97+S*0.04,LW,LW);ctx.restore();}
      }
      ctx.restore();
    }
  }
  /* particles */
  cfxDraw(dt);
  /* burst flash + shockwave */
  if(O.flT!=null){var fk=t-O.flT,fl=rb?0.45:0.3;if(fk<fl){ctx.fillStyle="rgba(255,255,255,"+(1-fk/fl)*O.flA+")";ctx.fillRect(-40,-40,SW+80,SH+80);}}
  if(O.boom&&r&&sinceB<0.7){var sw=clamp(sinceB/0.7,0,1);ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=(1-sw)*0.9;ctx.strokeStyle=col;ctx.lineWidth=12*(1-sw)+2;var R1=S*0.3+sw*Math.max(SW,SH)*0.6;ctx.beginPath();ctx.ellipse(cx,ly,R1,R1*0.72,0,0,7);ctx.stroke();if(rb||r==="epico"){ctx.globalAlpha=(1-sw)*0.5;ctx.lineWidth=6*(1-sw)+1;ctx.strokeStyle="#ffffff";ctx.beginPath();ctx.ellipse(cx,ly,R1*0.7,R1*0.5,0,0,7);ctx.stroke();}ctx.restore();}
  /* banner */
  if(r&&O.boom&&O.ri<1){var ba=clamp((sinceB-0.05)*5,0,1),bs=1+0.6*Math.exp(-sinceB*9)*Math.cos(sinceB*20)*(ba<1?1:0.4),by=layout.safe.t+32;
    ctx.save();ctx.globalAlpha=ba*(O.ri>=0?fade:1);ctx.translate(cx,by);ctx.scale(bs,bs);mText("¡COFRE "+C.n.toUpperCase()+"!",0,0,Math.min(30,SW*0.045),col,"center","900",6);ctx.restore();}
  if(!r&&O.gift&&O.ri<O.rw.length&&!(O.rw[O.ri]&&O.rw[O.ri]._big)){mText("¡NUEVO ASPECTO!",cx,layout.safe.t+30,Math.min(28,SW*0.042),"#ffd54f","center","900",6);}
  if(r&&!O.boom){var pa=O.ph==="idle"?Math.min(1,(t-O.tI)*3):0;if(pa>0){var ps=1+0.06*Math.sin(MT*5);ctx.save();ctx.globalAlpha=pa*(0.75+0.25*Math.sin(MT*5));ctx.translate(cx,cy+S*0.62);ctx.scale(ps,ps);mText("¡Toca para abrir!",0,0,Math.min(19,SW*0.03),"#ffffff","center","900",5);ctx.restore();}
    var ba2=clamp(t*4,0,1);ctx.save();ctx.globalAlpha=ba2*0.9;mText("COFRE "+C.n.toUpperCase(),cx,layout.safe.t+30,Math.min(24,SW*0.036),col,"center","900",5);ctx.restore();}
  /* ---- rewards, one by one ---- */
  var n=O.rw.length;
  if(O.ri>=0){
    O.rt+=dt;
    var cur=O.rw[Math.min(O.ri,n-1)],done=O.ri>=n,big=!done&&cur._big;
    var mw=Math.min(96,(SW-60)/n-8),mh=mw*0.82,tot=n*mw+(n-1)*8,mx0=cx-tot/2,my=SH-layout.safe.b-mh-26;
    if(!big)for(var j=0;j<n;j++){if(j>=O.ri&&!done)break;var ent=j===O.ri-1&&!done?clamp(O.rt/0.25,0,1):1;ctx.save();ctx.globalAlpha=ent;drawRewardCard(O.rw[j],mx0+j*(mw+8),my+(1-ent)*20,mw,mh,1);ctx.restore();}
    if(big)drawBigDrop(O,cur,dt,MT);
    else if(!done){var w2=cur,R2=rwRar(w2),u2=clamp(O.rt/0.32,0,1),e2=1-Math.pow(1-u2,3),cw=Math.min(180,SW*0.23),chh=Math.min(SH*0.44,cw*1.15),ccy=SH*0.44,rc=rarCol(R2,MT);
      var fy=ccy+(1-e2)*S*0.15-Math.sin(u2*Math.PI)*S*0.25;
      if(u2>=1&&!O.arr){O.arr=1;rwArrive(O,w2,cx,ccy);}
      /* rays + glow behind each reward */
      var rcl=w2.k==="coins"?"#ffd54f":w2.k==="gems"?"#80deea":w2.k==="pxp"?"#80d8ff":w2.k==="skin"?(R2==="legendaria"?"rainbow":rarHex(R2)):"#b9f6ca";
      ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.42*e2;var RR=cw*1.9;ctx.translate(cx,fy);ctx.rotate(MT*0.5);ctx.drawImage(cfxRays(rcl,12),-RR,-RR,RR*2,RR*2);ctx.restore();
      if(w2.k==="skin"){
        var flip=clamp((O.rt-0.45)/0.3,0,1),sxk=Math.abs(Math.cos(flip*Math.PI)),front=flip>=0.5;
        if(front&&!O.flipS){O.flipS=1;try{sfx("cx_flip");sfx(R2==="mitica"?"cx_myth":R2==="epica"?"cx_epic":"cx_rare");}catch(e){}
          cfxBurst(0,R2==="mitica"?70:46,cx,ccy,140,420,1.2,8,[rarHex(R2),"#ffffff"],1,60);SHAKE.a=Math.max(SHAKE.a,3);}
        ctx.save();ctx.translate(cx,fy);ctx.scale(e2*sxk*(front?1+0.08*Math.exp(-(O.rt-0.6)*5):1),e2);
        if(!front){drawCardBack(cw,chh,R2,MT);ctx.globalAlpha=0.5+0.5*Math.sin(MT*20);ctx.strokeStyle=rc;ctx.lineWidth=5;roundRect(ctx,-cw/2-4,-chh/2-4,cw+8,chh+8,16);ctx.stroke();ctx.globalAlpha=1;}
        else drawSkinFront(w2,cw,chh,R2,rc);
        ctx.restore();
        if(front){mText(p21HeroName(w2.hero)+(w2.dup?" · repetido: +"+GEM.dupCoins+" 🪙 +"+GEM.dupGems+" 💎":" · ¡equípalo en HÉROES!"),cx,ccy+chh/2+16,11,w2.dup?"#cfc6df":"#b9f6ca","center","900",3);}
      }else{
        var L=p21RewardLabel(w2),pulse=1+0.08*Math.exp(-Math.max(0,O.rt-0.32)*6)*Math.sin(Math.max(0,O.rt-0.32)*30),amt=rwAmount(w2,1-Math.pow(1-clamp((O.rt-0.2)/0.6,0,1),3));
        ctx.save();ctx.translate(cx,fy);ctx.scale(e2*pulse,e2*pulse);
        ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.65;ctx.drawImage(glowSpr(rcl==="rainbow"?"#ffffff":rcl),-cw*0.8,-cw*0.8,cw*1.6,cw*1.6);ctx.restore();
        if(w2.k==="gems"){ctx.save();ctx.rotate(MT*0.8);ctx.globalCompositeOperation="lighter";for(var st=0;st<4;st++){ctx.rotate(Math.PI/4);ctx.globalAlpha=0.7;ctx.fillStyle="#e0f7fa";ctx.beginPath();ctx.moveTo(0,-cw*0.55);ctx.lineTo(4,0);ctx.lineTo(0,cw*0.55);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();}ctx.restore();}
        var th2=w2.k==="pieces"&&w2.hero?skinThumb(w2.hero,w2.id,96):null;
        if(th2){ctx.drawImage(th2,-cw*0.28,-cw*0.42,cw*0.56,cw*0.56);mText("🧩",cw*0.24,-cw*0.1,cw*0.16,"#fff","center","700",0);}
        else if(w2.k==="coins"){var cs2=cw*0.2;[[-0.5,0.2],[0.5,0.2],[0,0.12],[-0.25,-0.05],[0.25,-0.05],[0,-0.22]].forEach(function(q){ctx.drawImage(cfxCoin(),q[0]*cw*0.42-cs2,q[1]*cw-cs2-cw*0.12,cs2*2,cs2*2);});}
        else if(w2.k==="gems"){var gs2=cw*0.27;ctx.drawImage(cfxGem(),-gs2,-gs2-cw*0.16,gs2*2,gs2*2);}
        else mText(L[0],0,-cw*0.16,cw*0.36,"#fff","center","700",0);
        mText(amt||L[1],0,cw*0.3,Math.min(26,cw*0.15),L[3]||"#fff","center","900",5);mText(L[2],0,cw*0.47,11,"#e8e0f0","center","800",3);
        ctx.restore();
      }
      mText((O.ri+1)+" / "+n,cx,ccy-chh/2-14,11,"#cfc6df","center","900",3);
    }
    if(done){if(O.rt<0.05&&!O.doneS){O.doneS=1;try{sfx("cx_done");}catch(e){}cfxBurst(0,30,cx,SH*0.42,80,260,1.0,7,[hexc==="#ffffff"?"#ffd54f":hexc,"#ffffff"],0);}
      var dk=clamp(O.rt/0.3,0,1),dsc=1+0.3*(1-dk);ctx.save();ctx.globalAlpha=dk;ctx.translate(cx,SH*0.42);ctx.scale(dsc,dsc);mText(O.gift?"¡Ya es tuyo!":"¡Todo para ti!",0,0,22,col,"center","900",5);ctx.restore();}
    var ready=done||O.rt>=rwDur(cur);
    mText(done?"Toca para cerrar":ready?(big?"Toca para continuar":"Toca para el siguiente"):"Toca para saltar",cx,SH-layout.safe.b-12,11.5,"rgba(255,255,255,"+(0.6+0.4*Math.sin(MT*4))+")","center","800",3);
    if(!done)mText("Saltar todo ›",SW-layout.safe.r-16,layout.safe.t+30,11,"#cfc6df","right","800",3);
  }else if(O.ph==="charge"){mText("Toca para abrir ya",cx,SH-layout.safe.b-12,11,"rgba(255,255,255,0.5)","center","800",3);}
  ctx.restore();
  mHit("ov_chest",0,0,SW,SH);
  if(O.ri>=0&&O.ri<n)mHit("ov_chest_skip",SW-layout.safe.r-110,layout.safe.t+12,110,36);
}
/* ---------- big-drop celebration: darken, rarity beams, the item rises spinning in a halo, banner, confetti, fanfare ---------- */
function drawBigDrop(O,w,dt,MT){
  var B=w._big,lv=B.lv,IMP=bigImp(B),rt=O.rt,cx=SW/2,ccy=SH*0.46,rbw=B.col==="rainbow",hc=rbw?"#ffffff":B.col,bcol=rbw?rainbowCol(MT):B.col;
  var b=clamp(rt/IMP,0,1),hit=rt>=IMP,ak=hit?rt-IMP:0;
  if(hit&&!O.bigHit){O.bigHit=1;O.flT=O.t;O.flA=0.6+0.13*lv;O.pT=O.t;O.pA=0.05+0.035*lv;SHAKE.a=Math.max(SHAKE.a,4+4*lv);
    try{if(lv>=2)sfx("cx_fanfare");else{sfx("cx_myth");sfx(w.k==="gems"?"cx_gem":"cx_coin");}}catch(e){}
    var cols=rbw?CHFX.HUES:[hc,"#ffffff"];cfxBurst(0,30+lv*30,cx,ccy,160,520,1.4,9,cols,1,80);cfxBurst(1,6+lv*2,cx,ccy,40,220,0.8,50,[hc==="#ffffff"?"#ffd54f":hc,"#ffffff"],0);
    cfxConfetti(lv*60,lv===1?1:lv);
    if(w.k==="gems"||lv>=2)cfxBurst(4,w.k==="gems"?Math.min(40,w.n):8*lv,cx,ccy,180,460,1.8,10,["#fff"],1,300);
    if(w.k==="coins")cfxBurst(3,36,cx,ccy,180,460,1.8,10,["#fff"],1,300);
    chVib(lv>=3?[80,40,80,40,260]:lv===2?[60,40,160]:[50,30,80]);}
  /* keep the party going: confetti rain + falling gems/coins for a while */
  if(hit&&ak<2.4&&Math.random()<dt*(lv*22)){cfxConfetti(1,lv===1?1:lv);}
  if(hit&&ak<1.6&&(w.k==="gems"||w.k==="coins")&&Math.random()<dt*18)cfxAdd(w.k==="gems"?4:3,Math.random()*SW,-12,(Math.random()-0.5)*40,80+Math.random()*80,2.4,8+Math.random()*4,"#fff",1);
  /* darken */
  ctx.save();ctx.fillStyle="rgba(0,0,0,"+(0.62*Math.min(1,rt/0.3))+")";ctx.fillRect(-40,-40,SW+80,SH+80);ctx.restore();
  /* rarity beams sweeping in */
  var nb=3+lv*2,sp=SW/(nb+1);ctx.save();ctx.globalCompositeOperation="lighter";
  for(var i=0;i<nb;i++){var off=(i-(nb-1)/2),bx=cx+off*sp*(1-0.55*b)+Math.sin(MT*1.3+i)*8,fl=0.75+0.25*Math.sin(MT*9+i*1.7),ba=(hit?Math.max(0.35,1-ak*0.9):0.15+0.6*b)*fl;
    var bc=rbw?CHFX.HUES[(i*3)%12]:hc,bw=(22+lv*6)*(hit?1+0.6*Math.exp(-ak*4):1),bh=SH*1.15;ctx.globalAlpha=ba*0.85;ctx.drawImage(cfxBeam(bc),bx-bw/2,SH-bh,bw,bh);}
  ctx.restore();
  /* halo: rotating ray wheels + orbiting stars */
  var hs=Math.min(SW,SH)*(0.42+0.18*lv/3)*(0.35+0.65*b)*(hit?1+0.15*Math.exp(-ak*5):1),rk=rbw?"rainbow":hc;
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.translate(cx,ccy);
  ctx.globalAlpha=(0.25+0.55*b)*(hit?1:0.8);ctx.rotate(MT*0.6);ctx.drawImage(cfxRays(rk,16),-hs*1.6,-hs*1.6,hs*3.2,hs*3.2);
  ctx.rotate(-MT*1.3);ctx.globalAlpha=0.35*b;ctx.drawImage(cfxRays(rbw?"rainbow":"#ffffff",22),-hs*1.1,-hs*1.1,hs*2.2,hs*2.2);ctx.rotate(MT*0.7);
  ctx.globalAlpha=(0.5+0.3*Math.sin(MT*4))*b;ctx.drawImage(glowSpr(hc==="#ffffff"?"#ffffff":hc),-hs*0.8,-hs*0.8,hs*1.6,hs*1.6);
  var no=8+lv*4;for(var q=0;q<no;q++){var oa=MT*1.6+q*6.283/no,orx=hs*0.78,ory=hs*0.5,ox=Math.cos(oa)*orx,oy=Math.sin(oa)*ory,os=(6+lv*1.5)*(0.7+0.3*Math.sin(MT*8+q));ctx.globalAlpha=b*(0.5+0.5*Math.sin(oa)*0.5+0.25);ctx.drawImage(cfxStar(rbw?CHFX.HUES[q%12]:hc),ox-os,oy-os,os*2,os*2);}
  ctx.restore();
  /* the item: rises from below spinning, flips to the front on impact */
  var e=1-Math.pow(1-b,3),iy=ccy+(1-e)*SH*0.62,cw=Math.min(190,SW*0.24),chh=Math.min(SH*0.5,cw*1.15);
  ctx.save();ctx.translate(cx,iy+(hit?Math.sin(ak*2.2)*3:0));
  if(w.k==="skin"){var R2=B.R||rwRar(w),rc=rarCol(R2,MT);
    if(!hit){var spin=Math.pow(b,0.55)*Math.PI*(4+lv*2);ctx.scale(Math.max(0.04,Math.abs(Math.cos(spin)))*(0.55+0.45*e),0.55+0.45*e);drawCardBack(cw,chh,R2,MT);}
    else{var ps=1+0.16*Math.exp(-ak*6)*Math.cos(ak*18);ctx.scale(ps,ps);drawSkinFront(w,cw,chh,R2,rc);}
  }else{var isG=w.k==="gems",sz=cw*(0.55+0.45*e)*(hit?1+0.14*Math.exp(-ak*6)*Math.cos(ak*18):1);
    if(!hit)ctx.rotate(Math.sin(rt*14)*0.08*(1-b));
    if(isG){ctx.drawImage(cfxGem(),-sz*0.62,-sz*0.75,sz*1.24,sz*1.24);ctx.drawImage(cfxGem(),-sz*0.85,-sz*0.25,sz*0.6,sz*0.6);ctx.drawImage(cfxGem(),sz*0.25,-sz*0.25,sz*0.6,sz*0.6);}
    else{var cs=sz*0.24;[[-0.55,0.15],[0.55,0.15],[-0.18,0.2],[0.18,0.2],[-0.36,-0.05],[0.36,-0.05],[0,0],[-0.18,-0.25],[0.18,-0.25],[0,-0.48]].forEach(function(p){ctx.drawImage(cfxCoin(),p[0]*sz-cs,p[1]*sz-cs-sz*0.1,cs*2,cs*2);});}
    if(hit){var amt=rwAmount(w,1-Math.pow(1-clamp(ak/0.7,0,1),3));mText(amt+(isG?" 💎":" 🪙"),0,sz*0.55,Math.min(34,cw*0.2),isG?"#b2ebf2":"#ffe082","center","900",6);}}
  ctx.restore();
  /* banner slam */
  if(hit){var bk=clamp(ak/0.22,0,1),bs=bk<1?2.4-1.4*bk:1+0.1*Math.exp(-(ak-0.22)*7)*Math.cos((ak-0.22)*22),by=layout.safe.t+40,fs=Math.min(lv>=3?40:34,SW*0.055);
    ctx.save();ctx.globalAlpha=bk;ctx.translate(cx,by);ctx.scale(bs,bs);
    ctx.font="900 "+fs+"px system-ui,-apple-system,sans-serif";var tw=ctx.measureText(B.txt).width+fs*1.6,th=fs*1.35;
    var rg=ctx.createLinearGradient(-tw/2,0,tw/2,0);if(rbw){for(var hh=0;hh<=6;hh++)rg.addColorStop(hh/6,rainbowCol(MT,hh*60,55));}else{rg.addColorStop(0,"rgba(0,0,0,0.0)");rg.addColorStop(0.15,hexA(hc,0.85));rg.addColorStop(0.85,hexA(hc,0.85));rg.addColorStop(1,"rgba(0,0,0,0)");}
    ctx.fillStyle="rgba(10,4,16,0.75)";roundRect(ctx,-tw/2,-th/2,tw,th,th/2);ctx.fill();ctx.globalAlpha=bk*0.9;ctx.strokeStyle=rg;ctx.lineWidth=3;roundRect(ctx,-tw/2,-th/2,tw,th,th/2);ctx.stroke();ctx.globalAlpha=bk;
    var tg;if(rbw){tg=ctx.createLinearGradient(-tw/2,0,tw/2,0);for(var h2=0;h2<=6;h2++)tg.addColorStop(h2/6,rainbowCol(MT*1.5,h2*60,68));}
    mText(B.txt,0,1,fs,rbw?tg:bcol,"center","900",Math.max(5,fs*0.18));
    /* shine across the banner */
    var shp=((ak*0.8)%1.6);if(shp<1){ctx.save();ctx.beginPath();roundRect(ctx,-tw/2,-th/2,tw,th,th/2);ctx.clip();ctx.globalCompositeOperation="lighter";var sx0=-tw/2+shp*tw*1.3-tw*0.15,sg=ctx.createLinearGradient(sx0-30,0,sx0+30,0);sg.addColorStop(0,"rgba(255,255,255,0)");sg.addColorStop(0.5,"rgba(255,255,255,0.55)");sg.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=sg;ctx.fillRect(sx0-30,-th/2,60,th);ctx.restore();}
    ctx.restore();
    if(w.k==="skin"){var sa=clamp((ak-0.3)/0.3,0,1);ctx.save();ctx.globalAlpha=sa;mText(p21HeroName(w.hero)+(w.dup?" · repetido: +"+GEM.dupCoins+" 🪙 +"+GEM.dupGems+" 💎":" · ¡equípalo en HÉROES!"),cx,ccy+chh/2+18,12,w.dup?"#cfc6df":"#b9f6ca","center","900",3);ctx.restore();}
  }
}
function chestOpenTap(skipAll){
  var O=P21.open;if(!O)return;
  if(!O.v2){P21.open=null;return;}
  if(O.r&&(O.ph==="drop"||O.ph==="idle")){chCharge(O);return;}
  if(O.r&&O.ph==="charge"){O.B=O.t;return;}
  if(O.ri<0){O.ri=0;O.t=Math.max(O.t,(O.boomT||0)+0.8);rwStart(O);return;}
  var n=O.rw.length;
  if(skipAll){O.ri=n;O.rt=0;try{sfx("cx_card");}catch(e){}return;}
  if(O.ri>=n){P21.open=null;cfxClear();try{sfx("click");}catch(e){}return;}
  var w=O.rw[O.ri],D=rwDur(w);
  if(O.rt<D){if(w._big){var I=bigImp(w._big);O.rt=O.rt<I?I:D;}else if(w.k==="skin"&&O.rt<0.75)O.rt=0.75;else O.rt=D;return;}
  O.ri++;O.doneS=0;if(O.ri<n)rwStart(O);else O.rt=0;
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
    if(u>=1&&!lr.revS){lr.revS=1;try{sfx("cx_land");sfx(rb?"cx_myth":lr.chest==="epico"?"cx_epic":"cx_rare");}catch(e2){}}
    if(land>=1&&lr.revS===1){lr.revS=2;try{sfx("cx_whoosh");}catch(e3){}}
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
var _MSK={k:"",v:null};
function megaSkinId(){try{var p=game&&game.player;if(!p)return null;var k=p.hero+"|"+(PROF.eq.skin[p.hero]||"");if(k!==_MSK.k){var sk=equippedSkin(p.hero);_MSK.k=k;_MSK.v=REAL_SKINS[sk]?sk:null;}return _MSK.v;}catch(e){return null;}} /* memo: artTint runs every frame in the fight */
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
  /* v21.2: while a chest is open the menu sits under a ~90% dark veil, so it is drawn once into a snapshot and the
     snapshot is reused (one blit instead of the painted menu, buttons and texts every frame) */
  var O=P21.open;
  if(O&&O.snap&&O.snap.width===canvas.width&&O.snap.height===canvas.height&&O.snapSt===st){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(O.snap,0,0);ctx.restore();drawChestOpen();return;}
  if(MENU.lastLv&&account.level>MENU.lastLv)MENU.lvToast=account.level;MENU.lastLv=account.level;
  if(st==="title")drawMenuTitle();else if(st==="levels")drawLevels();else if(st==="heroes")drawHeroes();else if(st==="unlocks")drawUnlocks();
  else if(st==="achievements")drawAchievements();else if(st==="stats")drawStats();else if(st==="settings")drawSettingsMenu();else if(st==="credits")drawCredits();else if(st==="howto")drawHowToMenu();
  else if(st==="pass")drawPass();else if(st==="missions")drawMissions();else if(st==="shop")drawShop();
  if(st==="heroes"){var hh=HEROES[MENU.heroIdx];if(hh&&PROF.newSkin[hh.id]){PROF.newSkin[hh.id]=0;profSave();}}
  if(P21.info&&st==="title")drawChestInfo();
  if(st==="title"&&PROF._welcomeGems&&!P21.open){PROF._welcomeGems=0;profSave();menuToast("💎 ¡Llegan las gemas! +"+PROF.gems+" por todo lo que ya habías logrado","#80deea");}
  drawToasts();
  if(P21.open){O=P21.open;if(O.t>0.3){try{var sn=O.snap||document.createElement("canvas");sn.width=canvas.width;sn.height=canvas.height;sn.getContext("2d").drawImage(canvas,0,0);O.snap=sn;O.snapSt=st;}catch(e){}}drawChestOpen();}
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
      if(id==="sh_gift"){if(PROF.shop.gift===dayKey())return;PROF.shop.gift=dayKey();PROF.coins+=GEM.giftCoins;gemsAdd(GEM.gift,"regalo");profSave();try{sfx("cx_coin");sfx("cx_gem");}catch(e){}menuToast("🎁 Regalo diario: +"+GEM.giftCoins+" 🪙 +"+GEM.gift+" 💎","#b9f6ca");return;}
      var sk=null,off=null;
      if(/^sh_off\d$/.test(id)){var o=shopOffers()[h.data];if(o){sk={hero:o.hero,id:o.id};off={i:h.data,disc:o.disc};}}
      if(/^sh_sk\d$/.test(id))sk=h.data;
      if(sk){skinWarm(sk.hero,sk.id);if(PROF.own["skin:"+sk.hero+":"+sk.id]){ok();PROF.eq.skin[sk.hero]=sk.id;profSave();menuToast("👕 "+skinDef(sk.hero,sk.id).name+" equipado en "+p21HeroName(sk.hero),"#ff80ab");return;}
        ok();SHOP.buy={kind:"skin",hero:sk.hero,id:sk.id,cur:"gems",p:skinPrice(sk.hero,sk.id,off&&off.disc),offer:off?off.i:null};SHOP.buyT=MENU.t;return;}
      if(/^sh_chest\d$/.test(id)){var c=SHOP_CHESTS[h.data];ok();SHOP.buy={kind:"chest",r:c.r,cur:c.cur,p:c.p};SHOP.buyT=MENU.t;return;}
      if(id==="sh_xp"){var left=PROF.shop.xpDay===dayKey()?SHOP_XP.max-PROF.shop.xpN:SHOP_XP.max;
        if(left<=0){try{sfx("hurt");}catch(e){}menuToast("Vuelve mañana: máximo "+SHOP_XP.max+" al día","#cfc6df");return;}
        if(PROF.coins<SHOP_XP.p){try{sfx("hurt");}catch(e){}menuToast("Te faltan "+fmtN(SHOP_XP.p-PROF.coins)+" 🪙","#ff8a80");return;}
        if(PROF.shop.xpDay!==dayKey()){PROF.shop.xpDay=dayKey();PROF.shop.xpN=0;}PROF.shop.xpN++;PROF.coins-=SHOP_XP.p;var t0=passTier();passAddXP(SHOP_XP.n,1);profSave();try{sfx("cx_card");}catch(e){}
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
