/* v21.3 — WORLD 2 "El Lugar del Hielo".
   A second painted map (assets/env/ice.webp + W2_DATA, same 1104x624 grid as the island) swapped in at run start,
   the same way the hell arena swaps MAP_DATA/ART.arena. The island data, art and code paths are untouched when
   World 1 is played. Frost zombies are pre-baked tinted sprites (cached once per sprite), the snowfall replaces the
   island's leaves/pollen with the same per-sprite cost, and the dusk grade becomes a cold one (same single fill).
   Unlock: finishing World 1 (any earlier W1 win in the save counts). Profile v4 adds PROF.worlds (backup kept). */
var WORLD={sel:1,cur:1,img:null,imgLoading:0,w1:null,w1Img:null,snow:null,warm:null};
function w2LoadImg(){
  if(WORLD.img||WORLD.imgLoading)return;WORLD.imgLoading=1;
  try{var im=new Image();im.onload=function(){WORLD.img=im;WORLD.imgLoading=0;};im.onerror=function(){WORLD.imgLoading=0;};im.src="assets/env/ice.webp?v=21.4";}catch(e){WORLD.imgLoading=0;}
}
/* ---------- save: profile v4 (world progress), versioned with a backup ---------- */
PROF_DEF.v=4;PROF_DEF.worlds={w1done:0,w2:{runs:0,wins:0,best:0,heroWins:{}}};
function profMigrate4(p){
  if(!p)return p;
  var from=p.v|0;
  if(from<4){
    try{lsSet("bz_profile_v3_backup",JSON.parse(JSON.stringify(p)));}catch(e){}
    p.worlds=p.worlds&&typeof p.worlds==="object"?p.worlds:{};
    var st=p.stats||{};
    /* anyone who already beat World 1 (classic win or Vorgath) gets World 2 straight away */
    p.worlds.w1done=(p.worlds.w1done||(st.wins|0)>0||(st.hell|0)>0||(p.gemF&&p.gemF.vorgath))?1:0;
    if(!p.worlds.w2||typeof p.worlds.w2!=="object")p.worlds.w2={runs:0,wins:0,best:0,heroWins:{}};
    if(p.worlds.w1done)p.worlds._w1doneNew=1;
    p.v=4;p._migratedFrom3=Date.now();
  }
  if(!p.worlds||typeof p.worlds!=="object")p.worlds={w1done:0};
  if(!p.worlds.w2||typeof p.worlds.w2!=="object")p.worlds.w2={runs:0,wins:0,best:0,heroWins:{}};
  if(!p.worlds.w2.heroWins)p.worlds.w2.heroWins={};
  return p;
}
PROF=profMigrate4(PROF);profSave();
(function(){var _pl=profLoad;profLoad=function(){_pl();PROF=profMigrate4(PROF);return PROF;};})();
function w2Unlocked(){var s=PROF&&PROF.stats||{};return !!(PROF&&PROF.worlds&&(PROF.worlds.w1done||(s.wins|0)>0||(s.hell|0)>0));}
if(w2Unlocked())setTimeout(w2LoadImg,2500);
/* ---------- map swap ---------- */
function w2IsIce(){return WORLD.cur===2&&typeof W2_DATA!=="undefined";}
(function(){
  var _bm=buildMap;
  buildMap=function(seed){
    if(typeof HELL!=="undefined"&&HELL.building)return _bm.apply(this,arguments);
    if(!WORLD.w1)WORLD.w1=(typeof HELL!=="undefined"&&HELL.island)||MAP_DATA;
    if(typeof ART!=="undefined"&&ART.arena&&ART.arena!==WORLD.img&&!(typeof HELL!=="undefined"&&ART.arena===HELL.img))WORLD.w1Img=ART.arena;
    var D=w2IsIce()?W2_DATA:WORLD.w1,img=w2IsIce()?WORLD.img:WORLD.w1Img;
    MAP_DATA=D;
    if(typeof HELL!=="undefined"){if(HELL.island)HELL.island=D;if(HELL.islandImg&&img)HELL.islandImg=img;}
    if(img&&typeof ART!=="undefined")ART.arena=img;
    var r=_bm.apply(this,arguments);
    if(map)map.world=WORLD.cur;
    return r;
  };
  var _cts=createTitleState;createTitleState=function(){WORLD.cur=1;return _cts.apply(this,arguments);};
  var _sg=startGame;startGame=function(){WORLD.cur=(WORLD.sel===2&&w2Unlocked()&&WORLD.img&&typeof W2_DATA!=="undefined")?2:1;WORLD.warm=null;if(typeof EVENT_DEFS!=="undefined"&&EVENT_DEFS.tesoro)EVENT_DEFS.tesoro.banner=WORLD.cur===2?"¡Tesoro en las cabañas!":"¡Tesoro en las ruinas!";var r=_sg.apply(this,arguments);if(WORLD.cur===2){WORLD.warm=w2WarmList();}return r;};
  /* the island's ruin cut-outs only exist on World 1 */
  var _roi=ruinOccItems;ruinOccItems=function(list){if(WORLD.cur===2)return;return _roi.apply(this,arguments);};
  /* round 10 on the ice: no hell portal — the final boss fights on the frozen island */
  var _hop=hellOpenPortal;hellOpenPortal=function(){if(WORLD.cur===2&&typeof _hellStartWave==="function")return _hellStartWave(9);return _hop.apply(this,arguments);};
  var _wc=onWaveCleared;onWaveCleared=function(){
    var r=_wc.apply(this,arguments);
    if(WORLD.cur===2&&game&&game.state==="victory"){game.state="level_done";game.hell={t:0,doneTime:game.time,w2:1};try{startMusic("menu");}catch(e){}try{sfx("level",1);}catch(e){}layoutMenuButtons();}
    return r;
  };
})();
/* area names on the ice (minimap label); same kinds as the island so no grass FX ever triggers here */
(function(){
  var _za=zoneAt;
  zoneAt=function(x,y){
    if(WORLD.cur!==2||(typeof HELL!=="undefined"&&HELL.active))return _za.apply(this,arguments);
    var dx=(x-472)/100,dy=(y-282)/64;
    if(dx*dx+dy*dy<1.25||(x>530&&x<700&&y>318&&y<445&&Math.abs((y-318)-(x-530)*0.72)<34))return {k:"ice",name:"Lago helado"};
    if(x>455&&x<655&&y>462&&y<578)return {k:"bridge",name:"Puente helado"};
    if(y>=578)return {k:"path",name:"Orilla sur"};
    if(x>600&&x<910&&y>55&&y<285)return {k:"cabins",name:"Cabañas"};
    if(x>290&&x<420&&y>95&&y<210)return {k:"igloo",name:"Iglú"};
    var t=sampleType(x,y);if(t===1)return {k:"pond",name:"Río helado"};if(t===2)return {k:"forest",name:"Bosque nevado"};
    return {k:"path",name:"Nieve"};
  };
})();
/* ---------- progress: W2 runs are tracked apart, W1 records stay exactly as they were ---------- */
(function(){
  var _re=profRunEnd;
  profRunEnd=function(kind){
    var g=game,p=g&&g.player;
    if(WORLD.cur!==2){
      var r0=_re.apply(this,arguments);
      if((kind==="victory"||kind==="hell")&&PROF&&PROF.worlds&&!PROF.worlds.w1done){PROF.worlds.w1done=1;PROF.worlds._w1doneNew=1;profSave();setTimeout(w2LoadImg,200);}
      return r0;
    }
    if(!p||(MENU.runDone&&kind!=="hell"))return _re.apply(this,arguments);
    if(MENU.runDone)return;
    var st=PROF.stats,keep={wins:st.wins,bestRound:st.bestRound,hell:st.hell,hw:JSON.parse(JSON.stringify(st.heroWins||{}))};
    var win=kind==="victory"||kind==="hell",round=(g.wave|0)+1;
    var r=_re.call(this,win?"victory":kind);
    st.wins=keep.wins;st.bestRound=keep.bestRound;st.hell=keep.hell;st.heroWins=keep.hw;
    var w=PROF.worlds.w2;w.runs=(w.runs|0)+1;w.best=Math.max(w.best|0,win?10:round);
    if(win){w.wins=(w.wins|0)+1;w.heroWins[p.hero]=(w.heroWins[p.hero]|0)+1;}
    profSave();return r;
  };
})();
/* ---------- frost zombies: one cached icy copy per sprite ---------- */
(function(){
  var _at=artTint,C={};
  artTint=function(name,img,tint){
    if(tint!=="frost")return _at.apply(this,arguments);
    var k=name;if(C[k])return C[k];
    var w=img.naturalWidth||img.width,h=img.naturalHeight||img.height,c=document.createElement("canvas");c.width=w;c.height=h;var g=c.getContext("2d");
    g.drawImage(img,0,0);
    /* hue -> ice blue (green skin turns frost-bitten, red eyes turn into cold glowing blue), contrast kept */
    g.globalCompositeOperation="hue";g.fillStyle="rgba(64,170,255,0.92)";g.fillRect(0,0,w,h);
    g.globalCompositeOperation="saturation";g.fillStyle="rgba(128,128,128,0.28)";g.fillRect(0,0,w,h);
    g.globalCompositeOperation="source-atop";
    var gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,"rgba(240,250,255,0.30)");gr.addColorStop(0.28,"rgba(215,240,255,0.10)");gr.addColorStop(1,"rgba(120,180,240,0.04)");
    g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.globalCompositeOperation="destination-in";g.drawImage(img,0,0);
    C[k]=c;return c;
  };
  var _sz=spawnZombie;
  spawnZombie=function(){var z=_sz.apply(this,arguments);if(typeof w2zDress==="function"&&w2zDress(z))return z;if(WORLD.cur===2&&z&&z.look&&z.look.kind==="zombie"&&!z.look.tint){z.look.tint="frost";z.frost=1;}return z;};
})();
function w2WarmList(){
  var out=[],t;if(typeof ART_MAP==="undefined")return out;
  if(typeof w2zReady==="function"&&w2zReady())return ["final_f"]; /* v21.4: ice zombies have their own paintings; only the frozen king is tinted */
  for(t in ART_MAP){var e=ART_MAP[t];if(t.indexOf("z_")!==0&&!/^(normal|fast|tank|crawler|spitter|jumper|armored|exploder|screamer|splitter|mini|boss|final)$/.test(t))continue;
    if(e.f)out.push(e.f);if(e.b)out.push(e.b);}
  return out;
}
/* bake the icy sprites during the 3-2-1 countdown, one per frame (never mid-fight) */
(function(){
  var _mt=menuGameTick;
  menuGameTick=function(dt){
    _mt.apply(this,arguments);
    if(WORLD.cur===2&&WORLD.warm&&WORLD.warm.length&&game&&(game.state==="countdown"||game.state==="upgrade")){
      var n=WORLD.warm.shift(),im=ART.imgs&&ART.imgs[n];if(im&&im.width)try{artTint(n,im,"frost");}catch(e){}
    }
  };
})();
/* the island's last boss is a frozen king on the ice */
(function(){
  var _sb=startBoss;
  startBoss=function(z,line,bab,pitch){if(WORLD.cur===2&&z&&z.look&&z.look.kind==="final"){z.bName="REY DE ESCARCHA";line="¡El hielo os tragará!";}return _sb.call(this,z,line,bab,pitch);};
})();
/* the leg pre-cut (3-2-1 / cards / boss intro) works on the icy sprites when on the ice */
(function(){
  var _zw=zLegWarm,LF={};
  zLegWarm=function(){
    if(WORLD.cur!==2)return _zw.apply(this,arguments);
    if(!game||!ART.ready)return;
    if(game.state==="boss_intro"){if(game.boss)zLegWarmLook(game.boss.look);return;}
    var wv=game.state==="upgrade"?(game.wave||0)+1:(game.wave||0),pool=typeof poolForWave==="function"?poolForWave(wv)||[]:[],i,t;
    if(wv>=9&&pool.indexOf("boss")<0)pool=pool.concat(["boss"]);
    for(i=0;i<pool.length;i++){t=pool[i];if(!LF[t]){LF[t]=makeZombieLook(t,1);if(typeof W2Z!=="undefined"&&W2Z.map[t]&&w2zReady())LF[t].w2=W2Z.map[t];else LF[t].tint="frost";}if(zLegWarmLook(LF[t]))return;}
  };
})();
/* ---------- snowfall (replaces leaves/pollen on the ice; same sprite budget) ---------- */
function w2SnowSpr(){
  if(WORLD.snowSpr)return WORLD.snowSpr;
  var c=document.createElement("canvas");c.width=c.height=16;var g=c.getContext("2d"),gr=g.createRadialGradient(8,8,0,8,8,8);
  gr.addColorStop(0,"rgba(255,255,255,1)");gr.addColorStop(0.45,"rgba(240,248,255,0.85)");gr.addColorStop(1,"rgba(220,240,255,0)");
  g.fillStyle=gr;g.fillRect(0,0,16,16);WORLD.snowSpr=c;return c;
}
function w2SnowInit(){
  var a=[],i;for(i=0;i<56;i++)a.push({x:Math.random(),y:Math.random(),s:0.5+Math.random()*1.1,ph:Math.random()*6.283,d:i%3});
  WORLD.snow=a;return a;
}
function w2DrawSnow(dt){
  if(!game||!game.player)return;
  var A=WORLD.snow||w2SnowInit(),sc=layout.scale,t=game.time||0,busy=game.zombies&&game.zombies.length>26,n=busy?32:A.length,i,o,spr=w2SnowSpr();
  var lowQ=typeof GFX!=="undefined"&&GFX.q===0;if(lowQ)n=Math.min(n,28);
  var cx=(game.camX||0)*sc,cy=(game.camY||0)*sc;
  for(i=0;i<n;i++){o=A[i];var par=0.12+o.d*0.08;
    o.y+=dt*0.05*o.s;o.x+=dt*0.008*o.s;o.ph+=dt*(0.8+o.s);
    var lx=((o.x*SW-cx*par)%SW+SW)%SW+Math.sin(o.ph)*6*sc,ly=((o.y*SH-cy*par)%SH+SH)%SH;
    var r=(0.9+o.s*0.9+o.d*0.5)*sc;ctx.globalAlpha=0.45+0.3*o.d/2;ctx.drawImage(spr,lx-r,ly-r,r*2,r*2);}
  ctx.globalAlpha=1;
}
(function(){
  var _pa=plDrawAmbient;
  plDrawAmbient=function(dt){if(WORLD.cur===2&&!(typeof HELL!=="undefined"&&HELL.active)){if(game&&(game.state==="pause"||game.state==="upgrade"))dt=0;return w2DrawSnow(dt);}return _pa.apply(this,arguments);};
})();
/* ---------- screen grade on snow ----------
   The island's vignette / hurt flash only paint four edge bands (their centre is nearly clear and hidden by the busy
   grass). On flat snow the band edge shows as a faint rectangle, so on the ice the same cached gradient is laid over
   the whole screen instead: it is baked into the same device-size layer, so the per-frame cost is still one blit. */
(function(){
  var _vb=_plVigBands;
  _plVigBands=function(c){if(WORLD.cur!==2)return _vb.apply(this,arguments);c.drawImage(_plVig,0,0,_plVig.width,_plVig.height,0,0,SW,SH);};
  var _dv=drawVignette;
  drawVignette=function(){if(_plVigBake&&_plVigBake.world!==WORLD.cur)_plVigBake=null;var r=_dv.apply(this,arguments);if(_plVigBake)_plVigBake.world=WORLD.cur;return r;};
  var _hf=drawHurtFlash;
  drawHurtFlash=function(){
    if(WORLD.cur!==2)return _hf.apply(this,arguments);
    var h=game&&game.hurtFlash;if(!(h>0.01))return;
    if(!_hurtVig){_hf.apply(this,arguments);return;}
    ctx.save();ctx.globalAlpha=Math.min(0.85,h*0.9);ctx.drawImage(_hurtVig,0,0,_hurtVig.width,_hurtVig.height,0,0,SW,SH);ctx.restore();
  };
})();
/* ---------- level select ---------- */
(function(){
  var _ma=menuAction;
  menuAction=function(h){
    var st=game&&game.state,id=h&&h.id;
    if(st==="levels"&&id==="l1"){WORLD.sel=1;return _ma.apply(this,arguments);}
    if(st==="levels"&&id==="l2"){
      if(!w2Unlocked()){try{sfx("hurt");}catch(e){}menuToast("🔒 Completa el Mundo 1","#9fd8ff");return;}
      if(!WORLD.img||(typeof w2zReady==="function"&&!w2zReady())){w2LoadImg();try{sfx("click");}catch(e){}menuToast("Cargando el Lugar del Hielo…","#9fd8ff");return;}
      WORLD.sel=2;if(PROF.worlds._w1doneNew){delete PROF.worlds._w1doneNew;profSave();}try{sfx("click");sfx("card");}catch(e){}menuGo("heroes");MENU.heroMode="play";return;
    }
    return _ma.apply(this,arguments);
  };
})();
/* test hooks */
window.__w2={state:function(){return{sel:WORLD.sel,cur:WORLD.cur,img:!!WORLD.img,unlocked:w2Unlocked(),map:map&&map.world,data:MAP_DATA===(typeof W2_DATA!=="undefined"&&W2_DATA)?2:1};},
  select:function(n){WORLD.sel=n;if(n===2)w2LoadImg();},load:w2LoadImg};
