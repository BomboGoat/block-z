/* v20.3: living main menu, level select, heroes/skins, unlocks, achievements, records, settings, credits,
   and the persistent profile (coins, stats, unlocks, equipment, settings) saved in localStorage ("bz_profile").
   The menu scene renders the real island at dusk behind the UI and stops as soon as a run starts. */
var MENU_ST={title:1,levels:1,heroes:1,unlocks:1,achievements:1,stats:1,settings:1,credits:1,howto:1};
var PROF=null;
var PROF_DEF={v:1,coins:0,stats:{runs:0,wins:0,hell:0,kills:0,bestRound:0,time:0,bosses:0,heroWins:{}},ach:{},own:{},
  eq:{skin:{},trail:"none",perk:"none"},
  set:{mus:0.8,sfx:0.9,vib:1,joySide:"L",joySize:1,dmgNum:1,gfx:"auto"}};
function profLoad(){
  var p=lsGet("bz_profile",null),k;
  if(!p||typeof p!=="object")p={};
  function fill(dst,src){for(var k in src){if(dst[k]==null)dst[k]=JSON.parse(JSON.stringify(src[k]));else if(typeof src[k]==="object"&&!Array.isArray(src[k])&&typeof dst[k]==="object")fill(dst[k],src[k]);}}
  fill(p,PROF_DEF);PROF=p;
  try{var a=lsGet("bz_audio",null);if(a&&p._audioMigrated==null){if(a.sfx)p.set.sfx=0;if(a.mus)p.set.mus=0;p._audioMigrated=1;}}catch(e){}
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(function(){});}catch(e){}
  return p;
}
function profSave(){if(PROF)lsSet("bz_profile",PROF);}
profLoad();

/* ---------- unlockables ---------- */
var SKINS={
  classic:[{id:"orig",name:"Original"},{id:"sombra",name:"Sombra",lv:3},{id:"dorado",name:"Dorado",cost:400}],
  trueno:[{id:"orig",name:"Original"},{id:"carmesi",name:"Carmesí",lv:5},{id:"hielo",name:"Hielo",cost:400}],
  mr:[{id:"orig",name:"Original"},{id:"fantasma",name:"Fantasma",lv:7},{id:"carmesi",name:"Carmesí",cost:400}],
  gompa:[{id:"orig",name:"Original"},{id:"dorado",name:"Dorado",lv:10},{id:"toxico",name:"Tóxico",cost:400}]
};
var TRAILS=[{id:"none",name:"Sin estela"},{id:"spark",name:"Chispas",lv:2,col:"#ffd54f"},{id:"fire",name:"Fuego",lv:6,col:"#ff7043"},
  {id:"ice",name:"Escarcha",lv:11,col:"#80deea"},{id:"toxic",name:"Ácido",cost:250,col:"#b2ff59"},{id:"rainbow",name:"Arcoíris",lv:14,col:"rainbow"}];
var PERKS=[{id:"none",name:"Ninguna",desc:"Sin ventaja inicial"},{id:"hp",name:"Vitalidad",desc:"+10% vida máxima",lv:4},
  {id:"speed",name:"Zancada",desc:"+6% velocidad",lv:8},{id:"magnet",name:"Imán",desc:"+12% XP de partida",lv:12},
  {id:"dmg",name:"Filo",desc:"+5% daño",lv:16},{id:"regen",name:"Vendas",desc:"Recupera 1 PV cada 4 s",cost:600}];
function unlockedReq(it,key){
  if(!it.lv&&!it.cost)return 1;
  if(it.lv&&account.level>=it.lv)return 1;
  if(it.cost&&PROF.own[key])return 1;
  return 0;
}
function skinOk(hero,s){return unlockedReq(s,"skin:"+hero+":"+s.id);}
function equippedSkin(hero){var id=PROF.eq.skin[hero]||"orig",l=SKINS[hero]||[],i;for(i=0;i<l.length;i++)if(l[i].id===id&&skinOk(hero,l[i]))return id;return "orig";}
function countUnlocks(){
  var n=0,h,i;for(h in SKINS)for(i=1;i<SKINS[h].length;i++)if(skinOk(h,SKINS[h][i]))n++;
  for(i=1;i<TRAILS.length;i++)if(unlockedReq(TRAILS[i],"trail:"+TRAILS[i].id))n++;
  for(i=1;i<PERKS.length;i++)if(unlockedReq(PERKS[i],"perk:"+PERKS[i].id))n++;
  return n;
}
/* skin colour variants: built once per sprite by the tint cache (no per-frame filters) */
var SKIN_TINT={sombra:{mul:"#7f86b8",over:"rgba(30,20,80,0.18)"},dorado:{mul:"#ffd36a",over:"rgba(255,190,40,0.16)"},carmesi:{mul:"#ff8a8a",over:"rgba(160,0,20,0.14)"},
  hielo:{mul:"#a6e8ff",over:"rgba(120,220,255,0.16)"},fantasma:{scr:"rgba(235,240,255,0.42)"},toxico:{mul:"#b9ff8f",over:"rgba(90,200,40,0.14)"}};
(function(){
  var _t=artTint;
  artTint=function(name,img,tint){
    var T=SKIN_TINT[tint];if(!T)return _t(name,img,tint);
    var k=name+"|"+tint;if(ART_TINT[k])return ART_TINT[k];
    var c=document.createElement("canvas");c.width=img.width;c.height=img.height;var g=c.getContext("2d");
    g.drawImage(img,0,0);
    if(T.mul){g.globalCompositeOperation="multiply";g.fillStyle=T.mul;g.fillRect(0,0,c.width,c.height);}
    if(T.scr){g.globalCompositeOperation="screen";g.fillStyle=T.scr;g.fillRect(0,0,c.width,c.height);}
    if(T.over){g.globalCompositeOperation="source-atop";g.fillStyle=T.over;g.fillRect(0,0,c.width,c.height);}
    g.globalCompositeOperation="destination-in";g.drawImage(img,0,0);
    ART_TINT[k]=c;return c;
  };
})();

/* ---------- achievements ---------- */
var ACHS=[
  {id:"first",name:"Primeros pasos",desc:"Termina una partida",rew:50,val:function(){return PROF.stats.runs;},goal:1},
  {id:"k250",name:"Matazombis",desc:"250 zombis eliminados",rew:100,val:function(){return PROF.stats.kills;},goal:250},
  {id:"k2000",name:"Exterminador",desc:"2000 zombis eliminados",rew:300,val:function(){return PROF.stats.kills;},goal:2000},
  {id:"r5",name:"Superviviente",desc:"Llega a la ronda 5",rew:100,val:function(){return PROF.stats.bestRound;},goal:5},
  {id:"boss1",name:"Cazajefes",desc:"Derrota a 3 jefes en total",rew:150,val:function(){return PROF.stats.bosses;},goal:3},
  {id:"win1",name:"Héroe de la isla",desc:"Completa el Nivel 1",rew:300,val:function(){return PROF.stats.wins;},goal:1},
  {id:"thanos",name:"Inevitable",desc:"Derrota a Thanos",rew:500,val:function(){return PROF.stats.hell;},goal:1},
  {id:"all4",name:"Cuarteto",desc:"Gana con los 4 héroes",rew:600,val:function(){var n=0,h;for(h in PROF.stats.heroWins)if(PROF.stats.heroWins[h]>0)n++;return n;},goal:4},
  {id:"lv10",name:"Veterano",desc:"Llega al nivel 10",rew:250,val:function(){return account.level;},goal:10},
  {id:"col5",name:"Coleccionista",desc:"Consigue 5 desbloqueos",rew:200,val:function(){return countUnlocks();},goal:5},
  {id:"time60",name:"Maratón",desc:"Juega 60 minutos",rew:200,val:function(){return Math.floor(PROF.stats.time/60);},goal:60}
];
var MENU={scr:"title",t:0,enterT:0,hits:[],press:null,toasts:[],fly:[],heroIdx:0,scroll:0,drag:null,lastLv:0,runDone:0,lastRun:null,prevState:null,cam:{a:0}};
function checkAchievements(silent){
  var i,a,got=[];
  for(i=0;i<ACHS.length;i++){a=ACHS[i];if(PROF.ach[a.id])continue;if(a.val()>=a.goal){PROF.ach[a.id]=1;PROF.coins+=a.rew;got.push(a);}}
  if(got.length){profSave();if(!silent)for(i=0;i<got.length;i++)menuToast("🏆 ¡Logro! "+got[i].name+"  +"+got[i].rew+" 🪙","#ffd54f");}
  return got;
}
function menuToast(txt,col){MENU.toasts.push({txt:txt,col:col||"#fff",t:0});if(MENU.toasts.length>3)MENU.toasts.shift();}

/* ---------- run hooks: rewards, stats, perks, trails ---------- */
function profRunStart(){
  MENU.runDone=0;MENU.runT0=game.time||0;MENU.lastRun=null;
  var p=game.player;if(!p)return;
  var sk=equippedSkin(p.hero);if(sk!=="orig"&&p.look)p.look.tint=sk;
  var pk=PROF.eq.perk;if(!unlockedReq(PERKS.filter(function(x){return x.id===pk;})[0]||PERKS[0],"perk:"+pk))pk="none";
  if(pk==="hp"){p.maxHp=Math.round(p.maxHp*1.1);p.hp=p.maxHp;}
  else if(pk==="speed")p.speedMul=(p.speedMul||1)*1.06;
  else if(pk==="dmg")p.damageMul=(p.damageMul||1)*1.05;
  else if(pk==="magnet")p.perkXP=1.12;
  else if(pk==="regen")p.perkRegen=1;
  applyGfxSetting();
}
function profRunEnd(kind){
  if(MENU.runDone&&kind!=="hell")return;
  var g=game,p=g&&g.player;if(!p)return;
  var round=(g.wave|0)+1,kills=g.kills|0,win=kind==="victory"||kind==="hell";
  if(kind==="hell"){
    if(MENU.hellDone)return;MENU.hellDone=1;
    PROF.stats.hell++;var hx=250,hc=300;grantAccountXP(hx);PROF.coins+=hc;
    MENU.lastRun={xp:hx,coins:hc,hell:1};
    if(MENU.runDone){profSave();checkAchievements(1);return;}
    /* beating Thanos ends the run as a win: count it in runs / wins / per-hero wins too */
    var st0=PROF.stats;MENU.runDone=1;st0.runs++;st0.kills+=kills;st0.bestRound=Math.max(st0.bestRound,10);
    st0.time+=Math.max(0,(g.time||0)-(MENU.runT0||0));st0.bosses+=4;st0.wins++;st0.heroWins[p.hero]=(st0.heroWins[p.hero]||0)+1;
    var lv1=account.level,wx=Math.round(10*14+kills*0.6+260),wc=Math.round(kills*0.5+60+150);grantAccountXP(wx);PROF.coins+=wc;
    MENU.lastRun={xp:hx+wx,coins:hc+wc,win:true,hell:1,lvUp:account.level>lv1?account.level:0,round:10,kills:kills};
    profSave();checkAchievements(1);return;
  }
  MENU.runDone=1;MENU.hellDone=0;
  var st=PROF.stats;st.runs++;st.kills+=kills;st.bestRound=Math.max(st.bestRound,win?10:round);
  st.time+=Math.max(0,(g.time||0)-(MENU.runT0||0));
  st.bosses+=(round>3?1:0)+(round>6?1:0)+(win?1:0);
  if(win){st.wins++;st.heroWins[p.hero]=(st.heroWins[p.hero]||0)+1;}
  var xp=Math.round(round*14+kills*0.6+(win?260:0)),coins=Math.round(kills*0.5+round*6+(win?150:0));
  var lv0=account.level;grantAccountXP(xp);PROF.coins+=coins;
  MENU.lastRun={xp:xp,coins:coins,win:win,lvUp:account.level>lv0?account.level:0,round:round,kills:kills};
  profSave();checkAchievements(1);
}
var _menuPrevState=null,_trailT=0;
function menuGameTick(dt){
  if(!game)return;
  var st=game.state;
  if(st!==_menuPrevState){
    if(st==="playing"&&(_menuPrevState==="select"||_menuPrevState==="countdown"&&!MENU.runLive)){}
    if(st==="dead")profRunEnd("dead");
    else if(st==="victory")profRunEnd("victory");
    else if(st==="level_done")profRunEnd("hell");
    _menuPrevState=st;
  }
  var p=game.player;
  if(p&&st==="playing"){
    if(p.perkRegen){p._prT=(p._prT||0)+dt;if(p._prT>=4){p._prT=0;if(p.hp>0&&p.hp<p.maxHp)p.hp=Math.min(p.maxHp,p.hp+1);}}
    var tr=PROF.eq.trail;
    if(tr&&tr!=="none"&&(Math.abs(p.vx)+Math.abs(p.vy)>30)){
      _trailT+=dt;
      if(_trailT>0.05){_trailT=0;var T=TRAILS.filter(function(x){return x.id===tr;})[0];
        if(T&&unlockedReq(T,"trail:"+T.id)){var col=T.col==="rainbow"?"hsl("+(((game.time*220)|0)%360)+",95%,62%)":T.col;
          addParticle(p.x+rand(-3,3),p.y+rand(-2,2),col,0.42,rand(-10,10),rand(-14,-2),rand(2.2,3.6),3);}}
    }
  }
  applyAudioLevels();
  /* menu scene: keep a few zombies shambling inside the drifting camera view */
  if(game.titleZ&&(st==="title"||st==="select"||(MENU_ST[st]&&!(st==="settings"&&prevSettings==="pause")))){
    for(var zi=0;zi<game.titleZ.length;zi++){var z=game.titleZ[zi];
      if(dist(z.x,z.y,game.camX,game.camY)>240){var a=Math.random()*6.283,e2={x:game.camX+Math.cos(a)*rand(60,130),y:game.camY+Math.sin(a)*rand(30,70),r:13};resolveCircle(e2);if(sampleSDF(e2.x,e2.y)>16){z.x=e2.x;z.y=e2.y;}}}
  }
}
function applyAudioLevels(){
  if(!PROF)return;var s=PROF.set;
  audio.mutedSfx=!(s.sfx>0.001);audio.mutedMus=!(s.mus>0.001);
  if(audio.sfxG){var v=audio.mutedSfx?0:0.55*s.sfx/0.9;if(Math.abs(audio.sfxG.gain.value-v)>0.001)audio.sfxG.gain.value=v;}
  if(audio.musG){var m=audio.mutedMus?0:0.42*s.mus/0.8;if(Math.abs(audio.musG.gain.value-m)>0.001)audio.musG.gain.value=m;}
}
function applyGfxSetting(){
  var g=PROF.set.gfx;if(typeof GFX==="undefined")return;
  GFX.lockQ=g!=="auto";
  if(g==="alta")gfxSetQ(2);else if(g==="media")gfxSetQ(1);else if(g==="baja")gfxSetQ(0);
}
/* graphics: "Auto" keeps the adaptive quality exactly as before; a fixed choice disables the auto step-down */
(function(){var _gt=gfxTick;gfxTick=function(dt){if(GFX.lockQ){var ms=(dt||0.016)*1000;GFX.ft=GFX.ft*0.9+ms*0.1;return;}_gt(dt);};})();
/* settings that reach into gameplay */
(function(){
  var _ft=floatText;
  floatText=function(x,y,text,col){if(PROF&&!PROF.set.dmgNum&&/^\d+$/.test(String(text)))return;return _ft(x,y,text,col);};
  var _hp=hurtPlayer;
  hurtPlayer=function(p,dmg){var h0=p.hp,r=_hp(p,dmg);try{if(PROF.set.vib&&p.hp<h0&&navigator.vibrate)navigator.vibrate(p.hp<=0?120:25);}catch(e){}return r;};
  var _jo=joyOrigin;
  joyOrigin=function(){var o=_jo();if(PROF.set.joySide==="R")o.x=SW-o.x;return o;};
  var _sb=getSuperBtn;
  getSuperBtn=function(){var b=_sb();if(PROF.set.joySide==="R")b.x=SW-b.x-b.w;return b;};
  var _gx=grantAccountXP;
  grantAccountXP=function(n){if(game&&game.player&&game.player.perkXP)n=Math.round(n*game.player.perkXP);var lv=account.level;_gx(n);if(account.level>lv)MENU.lvToast=account.level;};
  var _sg=startGame;
  startGame=function(){_sg();profRunStart();};
})();

/* ---------- living background ---------- */
var MENU_FLIES=null;
function menuBg(dim){
  var t=MENU.t;
  if(game&&game.state==="settings"&&prevSettings==="pause"){drawWorld();ctx.fillStyle="rgba(6,6,14,0.66)";ctx.fillRect(0,0,SW,SH);return;}
  if(!map||!map.arenaReady||!(ART.arena||GFX.arena)){ctx.fillStyle="#120a14";ctx.fillRect(0,0,SW,SH);return;}
  /* slow cinematic drift over the island, gentle parallax with the pointer */
  var cx=560+Math.sin(t*0.045)*170+(MENU.parX||0)*14,cy=318+Math.sin(t*0.07+1.3)*70+(MENU.parY||0)*8;
  game.camX=cx;game.camY=cy;
  drawWorld();
  /* dusk grade */
  ctx.save();ctx.globalCompositeOperation="multiply";ctx.fillStyle="#7d6aa8";ctx.fillRect(0,0,SW,SH);ctx.restore();
  var g=ctx.createLinearGradient(0,0,0,SH);
  g.addColorStop(0,"rgba(255,110,50,0.26)");g.addColorStop(0.35,"rgba(200,60,90,0.10)");g.addColorStop(1,"rgba(10,6,30,0.45)");
  ctx.fillStyle=g;ctx.fillRect(0,0,SW,SH);
  var v=ctx.createRadialGradient(SW*0.42,SH*0.55,Math.min(SW,SH)*0.25,SW*0.5,SH*0.5,Math.max(SW,SH)*0.75);
  v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(4,2,10,0.62)");ctx.fillStyle=v;ctx.fillRect(0,0,SW,SH);
  /* fireflies + embers */
  if(!MENU_FLIES){MENU_FLIES=[];for(var i=0;i<34;i++)MENU_FLIES.push({x:Math.random(),y:Math.random(),p:Math.random()*6.3,s:0.5+Math.random(),e:i%3===0});}
  var spr=typeof ensureFxSpr==="function"?ensureFxSpr():null;
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(i=0;i<MENU_FLIES.length;i++){
    var f=MENU_FLIES[i],x,y,a,r;
    if(f.e){f.y-=0.00055*f.s*60*MENU.dt;f.x+=Math.sin(t*0.8+f.p)*0.0004;if(f.y<-0.05){f.y=1.05;f.x=Math.random();}}
    x=(f.x+Math.sin(t*0.3*f.s+f.p)*0.03)*SW;y=(f.y+Math.cos(t*0.4*f.s+f.p)*0.03)*SH;
    a=0.35+0.45*Math.max(0,Math.sin(t*1.7*f.s+f.p));r=(f.e?2.2:2.8)*f.s;
    ctx.globalAlpha=a*(dim?0.6:1);
    if(spr)ctx.drawImage(spr,x-r*4,y-r*4,r*8,r*8);
    ctx.fillStyle=f.e?"#ffab40":"#e6ff8a";ctx.beginPath();ctx.arc(x,y,r*0.55,0,7);ctx.fill();
  }
  ctx.restore();ctx.globalAlpha=1;
  if(dim){ctx.fillStyle="rgba(8,5,16,"+dim+")";ctx.fillRect(0,0,SW,SH);}
}
drawMenuArt=function(){menuBg(0.35);return 1;};

/* ---------- UI helpers ---------- */
function mHit(id,x,y,w,h,data){MENU.hits.push({id:id,x:x,y:y,w:w,h:h,data:data});}
function mPressK(id){var pr=MENU.press;return pr&&pr.id===id?0.94:1;}
function mText(s,x,y,size,col,align,weight,stroke){
  ctx.font=(weight||"800")+" "+size+"px system-ui,-apple-system,sans-serif";ctx.textAlign=align||"left";ctx.textBaseline="middle";
  if(stroke!==0){ctx.lineJoin="round";ctx.strokeStyle="rgba(10,4,12,0.85)";ctx.lineWidth=stroke||Math.max(3,size*0.22);ctx.strokeText(s,x,y);}
  ctx.fillStyle=col||"#fff";ctx.fillText(s,x,y);
}
function mPanel(x,y,w,h,r,a){
  ctx.save();
  ctx.shadowColor="rgba(0,0,0,0.5)";ctx.shadowBlur=14;ctx.shadowOffsetY=4;
  var g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,"rgba(36,26,48,"+(a||0.9)+")");g.addColorStop(1,"rgba(18,12,26,"+(a||0.9)+")");
  ctx.fillStyle=g;roundRect(ctx,x,y,w,h,r||14);ctx.fill();ctx.restore();
  ctx.strokeStyle="rgba(255,214,140,0.28)";ctx.lineWidth=1.5;roundRect(ctx,x+0.75,y+0.75,w-1.5,h-1.5,r||14);ctx.stroke();
}
var BTN_STY={
  play:["#ffb300","#ff6d00","#bf360c"],blue:["#4f8cff","#2c5be0","#162f86"],teal:["#26c6a6","#109178","#08523f"],
  purple:["#b06cff","#7b3fe4","#43207f"],gold:["#ffd54f","#f0a020","#8a5200"],red:["#ff6b6b","#d63a3a","#7a1515"],
  grey:["#8d93a8","#5c6178","#2c3040"],green:["#66e07a","#2fb24a","#14602a"],dark:["#4a4058","#2e2638","#16101e"]
};
function mButton(id,x,y,w,h,label,icon,sty,opts){
  opts=opts||{};var c=BTN_STY[sty]||BTN_STY.blue,k=mPressK(id),r=opts.r||Math.min(16,h*0.38);
  var ent=opts.enter!=null?opts.enter:1,ox=(1-ent)*60;
  ctx.save();ctx.globalAlpha=ent;ctx.translate(x+w/2+ox,y+h/2);ctx.scale(k,k);ctx.translate(-w/2,-h/2);
  ctx.shadowColor="rgba(0,0,0,0.55)";ctx.shadowBlur=10;ctx.shadowOffsetY=4;
  ctx.fillStyle=c[2];roundRect(ctx,0,3,w,h,r);ctx.fill();ctx.shadowColor="transparent";
  var g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,c[0]);g.addColorStop(1,c[1]);
  ctx.fillStyle=g;roundRect(ctx,0,0,w,h-2,r);ctx.fill();
  ctx.fillStyle="rgba(255,255,255,0.22)";roundRect(ctx,3,2,w-6,(h-2)*0.45,r*0.8);ctx.fill();
  if(opts.shine){var sx=((MENU.t*0.55)%2.2-0.6)*w*1.4;ctx.save();roundRect(ctx,0,0,w,h-2,r);ctx.clip();var sg=ctx.createLinearGradient(sx,0,sx+w*0.35,h);sg.addColorStop(0,"rgba(255,255,255,0)");sg.addColorStop(0.5,"rgba(255,255,255,0.45)");sg.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=sg;ctx.fillRect(0,0,w,h);ctx.restore();}
  ctx.strokeStyle="rgba(20,8,4,0.75)";ctx.lineWidth=2;roundRect(ctx,0,0,w,h-2,r);ctx.stroke();
  var fs=opts.fs||Math.round(Math.min(h*0.42,22));
  if(icon){
    if(opts.iconTop){mText(icon,w/2,h*0.36,Math.round(h*0.34),"#fff","center","700",0);mText(label,w/2,h*0.74,Math.round(fs*0.78),"#fff","center","800",3);}
    else{mText(icon,h*0.48,h/2-1,Math.round(fs*1.05),"#fff","center","700",0);mText(label,h*0.9+(w-h*0.9)/2,h/2-1,fs,"#fff","center","900",3.5);}
  }else mText(label,w/2,h/2-1,fs,"#fff","center","900",3.5);
  if(opts.lock){ctx.fillStyle="rgba(10,6,16,0.55)";roundRect(ctx,0,0,w,h-2,r);ctx.fill();mText("🔒",w-14,12,12,"#fff","center","700",0);}
  ctx.restore();ctx.globalAlpha=1;
  mHit(id,x,y,w,h,opts.data);
}
function mBack(){var s=layout.safe;mButton("back",s.l+10,s.t+8,92,34,"Volver","‹","dark",{fs:15});}
function mTitle(t){mText(t,SW/2,layout.safe.t+26,24,"#ffe08a","center","900",5);}
function mBar(x,y,w,h,v,col,bg){ctx.fillStyle=bg||"rgba(0,0,0,0.45)";roundRect(ctx,x,y,w,h,h/2);ctx.fill();if(v>0){var g=ctx.createLinearGradient(x,0,x+w,0);g.addColorStop(0,shadeHex(col,30));g.addColorStop(1,col);ctx.fillStyle=g;roundRect(ctx,x,y,Math.max(h,w*clamp(v,0,1)),h,h/2);ctx.fill();}ctx.strokeStyle="rgba(0,0,0,0.6)";ctx.lineWidth=1;roundRect(ctx,x,y,w,h,h/2);ctx.stroke();}
function fmtN(n){n=Math.round(n||0);return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,".");}
function fmtTime(s){s=Math.round(s||0);var h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?h+" h "+m+" min":m+" min";}

/* ---------- top bar: level, XP, coins ---------- */
function drawTopBar(){
  var s=layout.safe,x=s.l+12,y=s.t+8,isTitle=game.state==="title";
  var R=17;
  ctx.save();
  if(!isTitle){
    var cw0=96,cx0=SW-s.r-12-cw0,lw=74,lx=cx0-lw-8;
    ctx.fillStyle="rgba(14,8,20,0.72)";roundRect(ctx,lx,y+4,lw,26,13);ctx.fill();ctx.strokeStyle="rgba(179,136,255,0.6)";ctx.lineWidth=1.5;roundRect(ctx,lx,y+4,lw,26,13);ctx.stroke();
    mText("⭐",lx+14,y+17.5,13,"#fff","center","700",0);mText("Nv "+account.level,lx+lw-10,y+17.5,13,"#e1d4ff","right","900",3);
    ctx.fillStyle="#7c4dff";roundRect(ctx,lx+8,y+26,(lw-16)*clamp(account.xp/Math.max(1,account.xpToNext),0,1),2.5,1.2);ctx.fill();
    x=-999;
  }
  if(isTitle){
  var g=ctx.createRadialGradient(x+R-4,y+R-5,2,x+R,y+R,R);g.addColorStop(0,"#ffe082");g.addColorStop(1,"#e08a00");
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x+R,y+R,R,0,7);ctx.fill();ctx.strokeStyle="#3a1c00";ctx.lineWidth=2.5;ctx.stroke();
  mText(""+account.level,x+R,y+R+1,account.level>=100?11:15,"#3a1c00","center","900",0);
  var bw=Math.min(150,SW*0.18);
  mText("Nivel "+account.level,x+2*R+8,y+9,12,"#fff","left","800",3);
  mBar(x+2*R+8,y+19,bw,9,account.xp/Math.max(1,account.xpToNext),"#7c4dff");
  mText(fmtN(account.xp)+" / "+fmtN(account.xpToNext)+" XP",x+2*R+8+bw/2,y+23.5,8,"#fff","center","700",2.4);
  }
  /* coins pill */
  var cw=96,cx=SW-s.r-12-cw,cy=y+4;
  ctx.fillStyle="rgba(14,8,20,0.72)";roundRect(ctx,cx,cy,cw,26,13);ctx.fill();ctx.strokeStyle="rgba(255,213,79,0.6)";ctx.lineWidth=1.5;roundRect(ctx,cx,cy,cw,26,13);ctx.stroke();
  mText("🪙",cx+15,cy+13.5,15,"#fff","center","700",0);
  mText(fmtN(PROF.coins),cx+cw-12,cy+13.5,14,"#ffe082","right","900",3);
  ctx.restore();
}

/* ---------- hero showcase (rigged idle, breathing) ---------- */
var HERO_WPN={classic:"pistol",trueno:"bolt",mr:"knife",gompa:"bell"};
function drawHeroShowcase(hero,x,footY,H,skin,glow){
  var look=makeHeroLook(hero);look.tint=skin&&skin!=="orig"?skin:null;
  var e=artEntry(look,2,"idle");
  /* soft spotlight + ground shadow */
  ctx.save();
  if(glow){var gg=ctx.createRadialGradient(x,footY-H*0.45,4,x,footY-H*0.45,H*0.75);gg.addColorStop(0,glow);gg.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=gg;ctx.fillRect(x-H,footY-H*1.3,H*2,H*1.5);}
  if(typeof softShadowSpr==="function"){ctx.globalAlpha=0.75;ctx.drawImage(softShadowSpr(),x-H*0.24,footY-H*0.05,H*0.48,H*0.11);ctx.globalAlpha=1;}
  ctx.restore();
  if(!e)return;
  var m=e.meta,W=H*(m.w/m.h),fx=m.fx!=null?m.fx:0.5,fy=m.fy!=null?m.fy:1;
  var M0=ctx.getTransform();ctx.save();ctx.translate(x,footY);
  var hand=null;
  if(HERO_RIG[e.name])hand=drawHeroRig(e,e.name,look,0,"idle",H,W,fx,fy,{aim:0.9,wpn:HERO_WPN[hero]});
  else ctx.drawImage(e.img,-W*fx,-H*fy,W,H);
  ctx.restore();
  if(hand&&typeof drawWeapon34==="function"){var q=hand.matrixTransform(M0.inverse());drawWeapon34(ctx,q.x,q.y,0.6,HERO_WPN[hero],H/110*1.25*0.9,0,look.skin,hero==="classic");}
}

/* ---------- animated logo ---------- */
function drawMenuLogo(cx,cy,size){
  var t=MENU.t,bob=Math.sin(t*1.6)*3,sc=1+Math.sin(t*2.2)*0.012;
  ctx.save();ctx.translate(cx,cy+bob);ctx.scale(sc,sc);ctx.rotate(-0.04);
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineJoin="round";
  var f="italic 900 "+size+"px system-ui,-apple-system,sans-serif";ctx.font=f;
  var pulse=0.55+0.45*Math.sin(t*2.6);
  ctx.shadowColor="rgba(255,90,20,"+(0.55+0.3*pulse)+")";ctx.shadowBlur=26;
  ctx.strokeStyle="#2a0a04";ctx.lineWidth=size*0.26;ctx.strokeText("BLOCK Z",0,0);
  ctx.shadowBlur=0;
  ctx.strokeStyle="#7a1d06";ctx.lineWidth=size*0.14;ctx.strokeText("BLOCK Z",0,size*0.04);
  var g=ctx.createLinearGradient(0,-size*0.5,0,size*0.5);g.addColorStop(0,"#fff6a8");g.addColorStop(0.35,"#ffd23a");g.addColorStop(0.7,"#ff7a12");g.addColorStop(1,"#d43a08");
  ctx.fillStyle=g;ctx.fillText("BLOCK Z",0,0);
  /* sweeping shine */
  var w=ctx.measureText("BLOCK Z").width,sx=((t*0.4)%1.8-0.4)*w*1.6-w*0.8;
  ctx.save();ctx.globalCompositeOperation="source-atop";
  var sg=ctx.createLinearGradient(sx,-size,sx+size*0.8,size);sg.addColorStop(0,"rgba(255,255,255,0)");sg.addColorStop(0.5,"rgba(255,255,255,0.65)");sg.addColorStop(1,"rgba(255,255,255,0)");
  ctx.restore();
  ctx.globalCompositeOperation="source-over";
  /* shine drawn clipped to glyphs via a second pass */
  ctx.save();ctx.beginPath();ctx.rect(-w,-size,w*2,size*2);ctx.clip();ctx.globalAlpha=0.55;ctx.fillStyle=sg;ctx.globalCompositeOperation="lighter";
  ctx.font=f;ctx.fillText("BLOCK Z",0,0);ctx.restore();
  ctx.font="800 "+Math.round(size*0.2)+"px system-ui";ctx.fillStyle="rgba(255,236,200,0.92)";ctx.strokeStyle="rgba(20,6,6,0.85)";ctx.lineWidth=4;
  ctx.strokeText("SUPERVIVENCIA ZOMBI",0,size*0.66);ctx.fillText("SUPERVIVENCIA ZOMBI",0,size*0.66);
  ctx.restore();
}

/* ---------- screens ---------- */
function enterK(i){return clamp((MENU.t-MENU.enterT)*4.5-i*0.35,0,1);}
function menuGo(st){
  if(st!=="title"&&game.state==="title")MENU.parentOk=1;
  game.state=st;MENU.enterT=MENU.t;MENU.scroll=0;MENU.press=null;
  if(st==="heroes"){MENU.heroIdx=Math.max(0,HEROES.findIndex(function(h){return h.id===selectedHero;}));}
  if(st==="credits"&&!MENU.credits){MENU.credits=["Cargando…"];try{var x=new XMLHttpRequest();x.onload=function(){MENU.credits=String(x.responseText||"").split(/\r?\n/);};x.open("GET","CREDITS.txt?v=20.3");x.send();}catch(e){}}
  if(typeof layoutMenuButtons==="function")layoutMenuButtons();
}
function drawMenuTitle(){
  menuBg(0);
  var s=layout.safe,hero=selectedHero||"classic",H=Math.min(SH*0.62,250);
  var hx=s.l+Math.min(SW*0.2,170),fy=SH-s.b-14;
  drawHeroShowcase(hero,hx,fy,H,equippedSkin(hero),"rgba(255,170,80,0.28)");
  mHit("hero_show",hx-H*0.25,fy-H,H*0.5,H);
  var hn=(HEROES.filter(function(h){return h.id===hero;})[0]||HEROES[0]).name;
  mText(hn,hx,fy-H-4,15,"#fff","center","900",4);
  var colX=SW-s.r-12,bw=Math.min(300,SW*0.36),bx=colX-bw;
  var lx0=hx+H*0.2,lmax=bx-lx0-16;
  drawMenuLogo(lx0+lmax/2,SH*0.25,Math.max(30,Math.min(62,lmax/4.6)));
  drawTopBar();
  var y0=Math.max(s.t+50,SH*0.2),pH=Math.min(62,SH*0.16);
  var pulse=1+Math.sin(MENU.t*3.2)*0.02;
  ctx.save();ctx.translate(bx+bw/2,y0+pH/2);ctx.scale(pulse,pulse);ctx.translate(-(bx+bw/2),-(y0+pH/2));
  mButton("play",bx,y0,bw,pH,"JUGAR","▶","play",{shine:1,fs:Math.round(pH*0.45),enter:enterK(0)});
  ctx.restore();
  var items=[["heroes","HÉROES","🦸","blue"],["unlocks","MEJORAS","🎁","purple"],["achievements","LOGROS","🏆","gold"],["stats","RÉCORDS","📊","teal"],["settings","AJUSTES","⚙️","grey"],["credits","CRÉDITOS","🎬","red"]];
  var gap=8,gw=(bw-gap)/2,gh=Math.min(44,(SH-s.b-12-(y0+pH+12)-2*gap)/3),i;
  for(i=0;i<items.length;i++){
    var it=items[i],x=bx+(i%2)*(gw+gap),y=y0+pH+12+Math.floor(i/2)*(gh+gap);
    var badge=it[0]==="achievements"?ACHS.filter(function(a){return !PROF.ach[a.id]&&a.val()>=a.goal;}).length:0;
    mButton(it[0],x,y,gw,gh,it[1],it[2],it[3],{fs:Math.round(gh*0.34),enter:enterK(1+i*0.4)});
  }
}
function drawLevels(){
  menuBg(0.3);mBack();mTitle("Elige nivel");drawTopBar();
  var s=layout.safe,n=3,gap=14,cw=Math.min(230,(SW-s.l-s.r-40-gap*2)/3),ch=Math.min(260,SH-s.t-s.b-96),x0=(SW-(cw*3+gap*2))/2,y=s.t+56,i;
  var L=[{id:"l1",name:"Nivel 1",sub:"La Isla",ok:1},{id:"l2",name:"Nivel 2",sub:"La Ciudad",ok:0},{id:"l3",name:"Nivel 3",sub:"El Abismo",ok:0}];
  for(i=0;i<n;i++){
    var l=L[i],x=x0+i*(cw+gap),ent=enterK(i*0.6),k=mPressK(l.id),yy=y+(1-ent)*40;
    ctx.save();ctx.globalAlpha=ent;ctx.translate(x+cw/2,yy+ch/2);ctx.scale(k,k);ctx.translate(-cw/2,-ch/2);
    mPanel(0,0,cw,ch,16,0.94);
    ctx.save();roundRect(ctx,6,6,cw-12,ch*0.62,12);ctx.clip();
    var img=GFX.menuBg&&i===0?null:null,ar=ART.arena||GFX.arena;
    if(ar&&ar.width){var sw=ar.width*0.62,sh=ar.height*0.62,ox=ar.width*0.19+Math.sin(MENU.t*0.2+i)*ar.width*0.05,oy=ar.height*0.16;ctx.drawImage(ar,ox,oy,sw,sh,6,6,cw-12,ch*0.62);}
    if(!l.ok){
      var g=ctx.createLinearGradient(0,0,0,ch*0.62);
      g.addColorStop(0,i===1?"rgba(30,40,70,0.9)":"rgba(70,10,20,0.9)");g.addColorStop(1,"rgba(8,6,14,0.95)");
      ctx.fillStyle=g;ctx.fillRect(6,6,cw-12,ch*0.62);
      /* silhouettes */
      ctx.fillStyle=i===1?"rgba(120,160,255,0.22)":"rgba(255,90,60,0.22)";
      for(var b=0;b<9;b++){var bh2=(18+((b*37)%40))*(ch/260),bw2=(cw-12)/9;ctx.fillRect(6+b*bw2,6+ch*0.62-bh2,bw2-2,bh2);}
      mText("🔒",cw/2,ch*0.3,34,"#fff","center","700",0);
    }else{
      var gl=ctx.createLinearGradient(0,ch*0.3,0,ch*0.62);gl.addColorStop(0,"rgba(0,0,0,0)");gl.addColorStop(1,"rgba(10,6,16,0.7)");ctx.fillStyle=gl;ctx.fillRect(6,6,cw-12,ch*0.62);
    }
    ctx.restore();
    mText(l.name,cw/2,ch*0.7,20,l.ok?"#ffe08a":"#9a92a8","center","900",4);
    mText(l.sub,cw/2,ch*0.79,13,l.ok?"#fff":"#8a8398","center","700",3);
    if(l.ok){
      var best=PROF.stats.bestRound;
      mText(PROF.stats.wins>0?"✔ Completado · "+PROF.stats.wins+" victorias":"Mejor ronda: "+(best||"—")+" / 10",cw/2,ch*0.88,10.5,"#b9f6ca","center","700",3);
      var tagW=74;ctx.fillStyle="#ff6d00";roundRect(ctx,cw/2-tagW/2,ch*0.93,tagW,16,8);ctx.fill();mText("JUGAR ▶",cw/2,ch*0.93+8,10,"#fff","center","900",0);
    }else{
      ctx.fillStyle="rgba(255,255,255,0.12)";roundRect(ctx,cw/2-50,ch*0.86,100,22,11);ctx.fill();
      mText("Próximamente",cw/2,ch*0.86+11,12,"#ffd54f","center","800",3);
    }
    ctx.restore();ctx.globalAlpha=1;
    mHit(l.id,x,y,cw,ch);
  }
}
function drawHeroes(){
  menuBg(0.4);mBack();mTitle("Héroes");drawTopBar();
  var s=layout.safe,h=HEROES[MENU.heroIdx]||HEROES[0],i;
  /* hero tabs */
  var tw=Math.min(88,(SW*0.3)),th=40,tx=s.l+12,ty=s.t+52;
  for(i=0;i<HEROES.length;i++){var hh=HEROES[i],sel=i===MENU.heroIdx;
    mButton("htab",tx,ty+i*(th+6),tw,th,hh.name,null,sel?"gold":"dark",{fs:14,data:i});
    if(hh.id===selectedHero)mText("✔",tx+tw-10,ty+i*(th+6)+10,11,"#b9f6ca","center","900",2);}
  /* big hero */
  var cx=tx+tw+Math.min(110,SW*0.14),H=Math.min(SH*0.6,230),fy=SH-s.b-20;
  var sk=PROF.eq.skin[h.id]||"orig";var skObj=(SKINS[h.id]||[]).filter(function(x){return x.id===sk;})[0];
  var preview=MENU.previewSkin&&MENU.previewSkin.hero===h.id?MENU.previewSkin.id:equippedSkin(h.id);
  drawHeroShowcase(h.id,cx,fy,H,preview,h.col+"55");
  /* stats panel */
  var px=cx+Math.min(120,SW*0.15),pw=SW-s.r-12-px,py=s.t+52,ph=SH-s.b-12-py;
  mPanel(px,py,pw,ph,14,0.9);
  mText(h.name,px+14,py+18,20,"#fff","left","900",4);
  var pal={classic:"#ff8f00",trueno:"#00e5ff",mr:"#ff1744",gompa:"#c6ff00"};
  ctx.fillStyle=pal[h.id]||"#ff8f00";roundRect(ctx,px+pw-110,py+9,96,18,9);ctx.fill();mText(h.wpn,px+pw-62,py+18,11,"#140a00","center","900",0);
  ctx.font="600 11px system-ui";ctx.fillStyle="#d8d0e8";ctx.textAlign="left";ctx.textBaseline="middle";
  var words=h.desc.split(" "),line="",ly=py+40;for(i=0;i<words.length;i++){var t2=line+words[i]+" ";if(ctx.measureText(t2).width>pw-28&&line){ctx.fillText(line,px+14,ly);ly+=14;line=words[i]+" ";}else line=t2;}if(line){ctx.fillText(line,px+14,ly);ly+=14;}
  var by=ly+6,bwid=pw-80;
  [["VIDA",h.hp/180,"#ef5350",h.hp],["VELOCIDAD",h.spd/120,"#42a5f5",h.spd],["DAÑO",h.dmg/120,"#ffb300",h.dmg]].forEach(function(r,j){
    mText(r[0],px+14,by+j*17+5,9.5,"#fff","left","800",2.5);mBar(px+76,by+j*17,bwid-10,10,r[1],r[2]);
  });
  var wins=PROF.stats.heroWins[h.id]||0;mText("Victorias: "+wins,px+14,by+3*17+6,10,"#b9f6ca","left","700",2.5);
  /* skins */
  var sy=by+3*17+20,list=SKINS[h.id]||[],sw=Math.min(92,(pw-28-16)/3),shh=Math.max(40,Math.min(58,py+ph-sy-34));
  mText("ASPECTOS",px+14,sy+2,10,"#ffe08a","left","900",2.5);
  for(i=0;i<list.length;i++){
    var sk2=list[i],ok=skinOk(h.id,sk2),eq=equippedSkin(h.id)===sk2.id,xx=px+14+i*(sw+8),yy=sy+12;
    var k=mPressK("skin"+i);
    ctx.save();ctx.translate(xx+sw/2,yy+shh/2);ctx.scale(k,k);ctx.translate(-sw/2,-shh/2);
    ctx.fillStyle=eq?"rgba(255,213,79,0.22)":"rgba(255,255,255,0.07)";roundRect(ctx,0,0,sw,shh,10);ctx.fill();
    ctx.strokeStyle=eq?"#ffd54f":"rgba(255,255,255,0.18)";ctx.lineWidth=eq?2.5:1;roundRect(ctx,0,0,sw,shh,10);ctx.stroke();
    var T=SKIN_TINT[sk2.id],sc=sk2.id==="orig"?h.col:T?(T.mul||"#eef"):"#888";
    var gr=ctx.createLinearGradient(0,6,0,shh*0.5);gr.addColorStop(0,shadeHex(sc,40));gr.addColorStop(1,sc);ctx.fillStyle=gr;ctx.beginPath();ctx.arc(sw/2,shh*0.32,shh*0.18,0,7);ctx.fill();ctx.strokeStyle="#1a1020";ctx.lineWidth=2;ctx.stroke();
    mText(sk2.name,sw/2,shh*0.66,10.5,"#fff","center","800",2.5);
    var req=ok?(eq?"Equipado":"Equipar"):(sk2.lv?"Nivel "+sk2.lv:"🪙 "+sk2.cost);
    mText(req,sw/2,shh*0.86,9,ok?(eq?"#ffd54f":"#b9f6ca"):(sk2.cost&&PROF.coins>=sk2.cost?"#ffe082":"#b0a8c0"),"center","800",2.2);
    if(!ok){mText("🔒",sw-9,9,9,"#fff","center","700",0);}
    ctx.restore();
    mHit("skin"+i,xx,yy,sw,shh,i);
  }
  var isSel=selectedHero===h.id;
  mButton("pickhero",px+pw-130,py+ph-40,118,32,isSel?"ELEGIDO":"ELEGIR",null,isSel?"green":"play",{fs:14});
}
function itemState(it,key){var ok=unlockedReq(it,key);return ok;}
function drawUnlocks(){
  menuBg(0.45);mBack();mTitle("Mejoras y desbloqueos");drawTopBar();
  var s=layout.safe,cols=[["Estelas",TRAILS,"trail"],["Ventajas iniciales",PERKS,"perk"]],gap=12,x0=s.l+12,w=(SW-s.l-s.r-24-gap)/2,y=s.t+52,h=SH-s.b-10-y,c,i;
  for(c=0;c<2;c++){
    var col=cols[c],x=x0+c*(w+gap),list=col[1],rh=Math.min(36,(h-30)/list.length-4);
    mPanel(x,y,w,h,14,0.88);mText(col[0],x+12,y+15,13,"#ffe08a","left","900",3);
    for(i=0;i<list.length;i++){
      var it=list[i],key=col[2]+":"+it.id,ok=unlockedReq(it,key),eq=(col[2]==="trail"?PROF.eq.trail:PROF.eq.perk)===it.id,ry=y+28+i*(rh+4),id=col[2]+"_"+i;
      var k=mPressK(id);ctx.save();ctx.translate(x+w/2,ry+rh/2);ctx.scale(k,k);ctx.translate(-w/2,-rh/2);
      ctx.fillStyle=eq?"rgba(255,213,79,0.2)":"rgba(255,255,255,0.06)";roundRect(ctx,8,0,w-16,rh,9);ctx.fill();
      if(eq){ctx.strokeStyle="#ffd54f";ctx.lineWidth=2;roundRect(ctx,8,0,w-16,rh,9);ctx.stroke();}
      if(col[2]==="trail"){var cc=it.col==="rainbow"?"hsl("+(((MENU.t*120)|0)%360)+",95%,62%)":(it.col||"#555");for(var d=0;d<5;d++){ctx.globalAlpha=ok?(1-d*0.17):0.3;ctx.fillStyle=cc;ctx.beginPath();ctx.arc(26+d*7,rh/2,4.2-d*0.6,0,7);ctx.fill();}ctx.globalAlpha=1;}
      else mText(["⭕","❤️","👟","🧲","🗡️","🩹"][i]||"✨",28,rh/2,14,"#fff","center","700",0);
      mText(it.name,64,rh/2-(it.desc&&rh>30?6:0),12,ok?"#fff":"#9a92a8","left","800",3);
      if(it.desc&&rh>30)mText(it.desc,64,rh/2+8,9,ok?"#cfc6df":"#7c7590","left","600",2);
      var st=ok?(eq?"EQUIPADO":"Equipar"):(it.lv?"🔒 Nivel "+it.lv:"🪙 "+it.cost);
      mText(st,w-18,rh/2,10,ok?(eq?"#ffd54f":"#b9f6ca"):(it.cost&&PROF.coins>=it.cost?"#ffe082":"#a49cb5"),"right","900",2.5);
      ctx.restore();mHit(id,x+8,ry,w-16,rh,{kind:col[2],it:it,key:key});
    }
  }
}
function drawAchievements(){
  menuBg(0.45);mBack();mTitle("Logros");drawTopBar();
  var s=layout.safe,cols=2,gap=8,x0=s.l+12,w=(SW-s.l-s.r-24-gap)/2,y0=s.t+52,rows=Math.ceil(ACHS.length/cols),rh=Math.min(50,(SH-s.b-10-y0-(rows-1)*gap)/rows),i;
  var done=0;for(i=0;i<ACHS.length;i++)if(PROF.ach[ACHS[i].id])done++;
  mText(done+" / "+ACHS.length,SW/2+90,s.t+27,12,"#b9f6ca","left","800",3);
  for(i=0;i<ACHS.length;i++){
    var a=ACHS[i],x=x0+(i%cols)*(w+gap),y=y0+Math.floor(i/cols)*(rh+gap),got=!!PROF.ach[a.id],v=Math.min(a.goal,a.val()),ent=enterK(i*0.15);
    ctx.save();ctx.globalAlpha=ent;
    var g=ctx.createLinearGradient(x,y,x+w,y);g.addColorStop(0,got?"rgba(120,80,10,0.92)":"rgba(30,22,42,0.9)");g.addColorStop(1,got?"rgba(60,36,6,0.92)":"rgba(18,12,26,0.9)");
    ctx.fillStyle=g;roundRect(ctx,x,y,w,rh,10);ctx.fill();ctx.strokeStyle=got?"#ffd54f":"rgba(255,255,255,0.14)";ctx.lineWidth=got?2:1;roundRect(ctx,x,y,w,rh,10);ctx.stroke();
    mText(got?"🏆":"🔒",x+20,y+rh/2,got?18:14,"#fff","center","700",0);
    mText(a.name,x+40,y+rh*0.3,12,got?"#ffe08a":"#fff","left","900",3);
    mText(a.desc,x+40,y+rh*0.56,9.5,"#d0c8e0","left","600",2);
    mBar(x+40,y+rh*0.72,w-150,6,v/a.goal,got?"#ffd54f":"#7c4dff");
    mText(fmtN(v)+"/"+fmtN(a.goal),x+w-104,y+rh*0.75,8.5,"#fff","left","700",2);
    mText("+"+a.rew+" 🪙",x+w-10,y+rh*0.32,11,"#ffe082","right","900",2.5);
    ctx.restore();
  }
  ctx.globalAlpha=1;
}
function drawStats(){
  menuBg(0.45);mBack();mTitle("Récords y estadísticas");drawTopBar();
  var s=layout.safe,st=PROF.stats,x=s.l+12,w=SW-s.l-s.r-24,y=s.t+52,h=SH-s.b-10-y;
  var cards=[["🏁","Mejor ronda",(st.bestRound||0)+" / 10"],["💀","Zombis eliminados",fmtN(st.kills)],["🏆","Victorias",fmtN(st.wins)],["🎮","Partidas",fmtN(st.runs)],
    ["⏱️","Tiempo jugado",fmtTime(st.time)],["👹","Jefes derrotados",fmtN(st.bosses)],["🫰","Thanos derrotado",st.hell?st.hell+" ×":"Aún no"],["⭐","Nivel de cuenta",""+account.level]];
  var cols=4,gap=8,cw=(w-gap*(cols-1))/cols,ch=Math.min(70,(h*0.62-gap)/2),i;
  for(i=0;i<cards.length;i++){
    var cx=x+(i%cols)*(cw+gap),cy=y+Math.floor(i/cols)*(ch+gap),ent=enterK(i*0.2);
    ctx.save();ctx.globalAlpha=ent;mPanel(cx,cy+(1-ent)*20,cw,ch,12,0.9);
    mText(cards[i][0],cx+20,cy+ch/2,18,"#fff","center","700",0);
    mText(cards[i][1],cx+38,cy+ch*0.34,10,"#cfc6df","left","700",2.5);
    mText(cards[i][2],cx+38,cy+ch*0.66,cw>150?18:15,"#ffe08a","left","900",3.5);
    ctx.restore();
  }
  ctx.globalAlpha=1;
  var py=y+2*(ch+gap)+4,ph=SH-s.b-10-py;mPanel(x,py,w,ph,12,0.88);
  mText("Victorias por héroe",x+12,py+14,12,"#ffe08a","left","900",3);
  var maxW=1;HEROES.forEach(function(h){maxW=Math.max(maxW,st.heroWins[h.id]||0);});
  var bw=(w-24-3*10)/4;
  HEROES.forEach(function(h,j){var bx=x+12+j*(bw+10),v=st.heroWins[h.id]||0;mText(h.name,bx,py+34,11,"#fff","left","800",2.5);mBar(bx,py+44,bw,10,v/maxW,h.col==="#37474f"?"#90a4ae":h.col);mText(""+v,bx+bw,py+34,11,"#b9f6ca","right","800",2.5);});
}
var SET_ROWS=[["mus","Música","slider"],["sfx","Efectos","slider"],["vib","Vibración","toggle"],["dmgNum","Números de daño","toggle"],["joySide","Joystick","choice",[["L","Izquierda"],["R","Derecha"]]],["joySize","Tamaño joystick","choice",[[0.85,"Pequeño"],[1,"Normal"],[1.2,"Grande"]]],["gfx","Gráficos","choice",[["auto","Auto"],["alta","Alta"],["media","Media"],["baja","Baja"]]]];
function drawSettingsMenu(){
  menuBg(0.45);mBack();mTitle("Ajustes");if(prevSettings!=="pause")drawTopBar();
  var s=layout.safe,w=Math.min(560,SW-s.l-s.r-24),x=(SW-w)/2,y=s.t+50,h=SH-s.b-10-y,rh=Math.min(38,(h-46)/SET_ROWS.length),i,j;
  mPanel(x,y,w,h,14,0.9);
  for(i=0;i<SET_ROWS.length;i++){
    var r=SET_ROWS[i],ry=y+8+i*rh,v=PROF.set[r[0]];
    mText(r[1],x+16,ry+rh/2,13,"#fff","left","800",3);
    var cx0=x+w*0.42,cw=w*0.58-16;
    if(r[2]==="slider"){
      mBar(cx0,ry+rh/2-5,cw-44,10,v,"#ff9800");var kx=cx0+(cw-44)*v;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(kx,ry+rh/2,9,0,7);ctx.fill();ctx.strokeStyle="#3a1c00";ctx.lineWidth=2;ctx.stroke();
      mText(Math.round(v*100)+"%",cx0+cw,ry+rh/2,11,"#ffe082","right","800",2.5);
      mHit("sl_"+r[0],cx0-10,ry,cw-24,rh,{key:r[0],x0:cx0,w:cw-44});
    }else if(r[2]==="toggle"){
      var on=!!v,tw=52,tx=cx0+cw-tw;ctx.fillStyle=on?"#43a047":"#4a4058";roundRect(ctx,tx,ry+rh/2-12,tw,24,12);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(on?tx+tw-12:tx+12,ry+rh/2,9,0,7);ctx.fill();
      mText(on?"Sí":"No",tx-10,ry+rh/2,11,on?"#b9f6ca":"#a49cb5","right","800",2.5);
      mHit("tg_"+r[0],tx-40,ry,tw+40,rh,{key:r[0]});
    }else{
      var opts=r[3],ow=Math.min(80,(cw-(opts.length-1)*6)/opts.length);
      for(j=0;j<opts.length;j++){var ox=cx0+cw-(opts.length-j)*(ow+6)+6,sel=v===opts[j][0];
        ctx.fillStyle=sel?"#ff9800":"rgba(255,255,255,0.1)";roundRect(ctx,ox,ry+rh/2-12,ow,24,12);ctx.fill();
        mText(opts[j][1],ox+ow/2,ry+rh/2,10.5,sel?"#1a0a00":"#e0d8f0","center","800",sel?0:2);
        mHit("ch_"+r[0]+"_"+j,ox,ry+rh/2-14,ow,28,{key:r[0],val:opts[j][0]});}
    }
  }
  mButton("howto",x+w-150,y+h-34,138,28,"Cómo jugar","❔","dark",{fs:12});
}
function drawCredits(){
  menuBg(0.5);mBack();mTitle("Créditos");
  var s=layout.safe,w=Math.min(620,SW-s.l-s.r-24),x=(SW-w)/2,y=s.t+50,h=SH-s.b-10-y;
  mPanel(x,y,w,h,14,0.9);
  ctx.save();roundRect(ctx,x+4,y+4,w-8,h-8,12);ctx.clip();
  var lines=["BLOCK Z","Idea, dirección y pruebas: Eric Montes","Hecho con mucho cariño (y muchos zombis)",""].concat(MENU.credits||[]),i,ly=y+20-MENU.scroll;
  for(i=0;i<lines.length;i++){var L=lines[i];if(ly>y-20&&ly<y+h+20){if(i===0)mText(L,x+w/2,ly,20,"#ffe08a","center","900",4);else if(/^=+$|^-+$/.test(L)){}else mText(L,x+18,ly,/^[A-Z][^a-z]*$/.test(L)&&L.length>2?12:10.5,/^[A-Z][^a-z]*$/.test(L)&&L.length>2?"#ffd54f":"#e0d8f0","left",/^\s/.test(L)?"600":"700",2);}ly+=i===0?26:15;}
  MENU.creditsH=ly+MENU.scroll-y;
  ctx.restore();
  if(MENU.creditsH>h){var sb=h*h/MENU.creditsH;ctx.fillStyle="rgba(255,255,255,0.25)";roundRect(ctx,x+w-7,y+6+(h-12-sb)*(MENU.scroll/Math.max(1,MENU.creditsH-h)),4,sb,2);ctx.fill();}
  mHit("creditsArea",x,y,w,h);
}
function drawHowToMenu(){
  menuBg(0.5);mBack();mTitle("Cómo jugar");
  var s=layout.safe,w=Math.min(560,SW-s.l-s.r-24),x=(SW-w)/2,y=s.t+50,h=SH-s.b-10-y;mPanel(x,y,w,h,14,0.9);
  var L=[["🕹️","Mueve con el joystick (aparece donde pongas el pulgar)"],["🎯","Atacas solo al enemigo más cercano"],["💥","Super: arrástrala desde su botón para apuntar"],["🌾","El trigo y los arbustos te esconden"],["🏛️","Puedes entrar en las ruinas"],["👹","Jefes en las rondas 3, 6 y 10 · Thanos al final"],["🎁","Gana XP y monedas para desbloquear aspectos, estelas y ventajas"]],i;
  for(i=0;i<L.length;i++){var ly=y+20+i*Math.min(30,(h-26)/L.length);mText(L[i][0],x+24,ly,15,"#fff","center","700",0);mText(L[i][1],x+44,ly,12,"#ece4f8","left","700",2.5);}
}
function drawToasts(){
  var i,t,s=layout.safe;
  if(MENU.lvToast){menuToast("⭐ ¡Subes a nivel "+MENU.lvToast+"!","#b388ff");MENU.lvToast=0;try{sfx("level");}catch(e){}}
  for(i=0;i<MENU.toasts.length;i++){
    t=MENU.toasts[i];t.t+=MENU.dt;var a=clamp(Math.min(t.t*4,(3.4-t.t)*2),0,1);if(t.t>3.4){MENU.toasts.splice(i,1);i--;continue;}
    ctx.save();ctx.globalAlpha=a;ctx.font="800 13px system-ui";var tw=ctx.measureText(t.txt).width+30,x=SW/2-tw/2,y=SH-s.b-44-i*34+(1-a)*10;
    ctx.fillStyle="rgba(20,12,30,0.92)";roundRect(ctx,x,y,tw,28,14);ctx.fill();ctx.strokeStyle=t.col;ctx.lineWidth=2;roundRect(ctx,x,y,tw,28,14);ctx.stroke();
    mText(t.txt,SW/2,y+14,13,t.col,"center","800",0);ctx.restore();
  }
}
function drawMenuScreen(){
  MENU.hits=[];var now=performance.now();MENU.dt=Math.min(0.05,(now-(MENU._last||now))/1000);MENU._last=now;MENU.t+=MENU.dt;
  var st=game.state;
  if(MENU.lastLv&&account.level>MENU.lastLv)MENU.lvToast=account.level;MENU.lastLv=account.level;
  if(st==="title")drawMenuTitle();else if(st==="levels")drawLevels();else if(st==="heroes")drawHeroes();else if(st==="unlocks")drawUnlocks();
  else if(st==="achievements")drawAchievements();else if(st==="stats")drawStats();else if(st==="settings")drawSettingsMenu();else if(st==="credits")drawCredits();else if(st==="howto")drawHowToMenu();
  drawToasts();
}
/* rewards line on the end screens */
function drawRunRewards(){
  var r=MENU.lastRun;if(!r)return;
  var y=SH*0.45,txt="+"+fmtN(r.xp)+" XP   ·   +"+fmtN(r.coins)+" 🪙"+(r.lvUp?"   ·   ⭐ ¡Nivel "+r.lvUp+"!":"");
  ctx.save();ctx.font="900 15px system-ui";var tw=ctx.measureText(txt).width+36;
  ctx.fillStyle="rgba(20,12,30,0.85)";roundRect(ctx,SW/2-tw/2,y-15,tw,30,15);ctx.fill();ctx.strokeStyle="#ffd54f";ctx.lineWidth=2;roundRect(ctx,SW/2-tw/2,y-15,tw,30,15);ctx.stroke();
  mText(txt,SW/2,y,15,"#ffe082","center","900",0);ctx.restore();
}

/* ---------- input ---------- */
function menuHitAt(x,y){for(var i=MENU.hits.length-1;i>=0;i--){var h=MENU.hits[i];if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h)return h;}return null;}
function menuDown(p){
  MENU.parX=(p.x/SW-0.5)*2;MENU.parY=(p.y/SH-0.5)*2;
  var h=menuHitAt(p.x,p.y);
  if(h&&h.id.indexOf("sl_")===0){MENU.drag={kind:"slider",h:h};menuSlide(p.x);return;}
  if(h&&h.id==="creditsArea"){MENU.drag={kind:"scroll",y:p.y,s0:MENU.scroll};return;}
  MENU.press=h?{id:h.id,h:h}:null;
}
function menuSlide(x){var h=MENU.drag.h,was=PROF.set[h.data.key];PROF.set[h.data.key]=Math.round(clamp((x-h.data.x0)/h.data.w,0,1)*20)/20;applyAudioLevels();profSave();if(h.data.key==="mus"&&!(was>0)&&PROF.set.mus>0){try{startMusic(game&&game.state==="settings"&&prevSettings==="pause"?(game.bossFight?"boss":"play"):"menu");}catch(e){}}}
function menuMove(p){
  if(!MENU.drag)return;
  if(MENU.drag.kind==="slider")menuSlide(p.x);
  else if(MENU.drag.kind==="scroll"){var maxS=Math.max(0,(MENU.creditsH||0)-(SH-layout.safe.t-layout.safe.b-60));MENU.scroll=clamp(MENU.drag.s0-(p.y-MENU.drag.y),0,maxS);}
}
function menuUp(p){
  if(MENU.drag){if(MENU.drag.kind==="slider"){try{sfx("click");}catch(e){}}MENU.drag=null;return;}
  var pr=MENU.press;MENU.press=null;if(!pr)return;
  var h=menuHitAt(p.x,p.y);if(!h||h.id!==pr.id)return;
  menuAction(h);
}
function menuAction(h){
  var id=h.id,st=game.state;
  function ok(){try{sfx("click");}catch(e){}}
  if(id==="back"){ok();if(st==="settings"&&prevSettings==="pause"){game.state="pause";layoutMenuButtons();return;}if(st==="howto"&&MENU.howFrom==="settings"){menuGo("settings");return;}menuGo("title");return;}
  if(st==="title"){
    if(id==="play"){ok();try{sfx("whoosh");}catch(e){}menuGo("levels");return;}
    if(id==="hero_show"){ok();menuGo("heroes");return;}
    if(id==="settings"){prevSettings="title";}
    if({heroes:1,unlocks:1,achievements:1,stats:1,settings:1,credits:1}[id]){ok();try{sfx("card");}catch(e){}if(id==="achievements")checkAchievements(0);menuGo(id);return;}
  }
  if(st==="levels"){
    if(id==="l1"){ok();try{sfx("card");}catch(e){}game.state="select";game.selectIdx=Math.max(0,HEROES.findIndex(function(h){return h.id===selectedHero;}));layoutSelect();layoutMenuButtons();return;}
    if(id==="l2"||id==="l3"){try{sfx("hurt");}catch(e){}menuToast("🔒 Próximamente","#ffd54f");return;}
  }
  if(st==="heroes"){
    if(id==="htab"){ok();MENU.heroIdx=h.data;MENU.previewSkin=null;return;}
    var hero=HEROES[MENU.heroIdx].id;
    if(id==="pickhero"){ok();selectedHero=hero;saveHeroChoice();menuToast("✔ "+HEROES[MENU.heroIdx].name+" elegido","#b9f6ca");return;}
    if(id.indexOf("skin")===0){
      var sk=SKINS[hero][h.data],key="skin:"+hero+":"+sk.id;
      if(skinOk(hero,sk)){ok();PROF.eq.skin[hero]=sk.id;profSave();MENU.previewSkin=null;return;}
      if(sk.cost){if(PROF.coins>=sk.cost){PROF.coins-=sk.cost;PROF.own[key]=1;PROF.eq.skin[hero]=sk.id;profSave();try{sfx("rarity3");}catch(e){}menuToast("✨ ¡Aspecto "+sk.name+" desbloqueado!","#ffd54f");checkAchievements(0);}else{MENU.previewSkin={hero:hero,id:sk.id};menuToast("Te faltan "+(sk.cost-PROF.coins)+" 🪙 (vista previa)","#ff8a80");}return;}
      MENU.previewSkin={hero:hero,id:sk.id};menuToast("🔒 Se desbloquea en el nivel "+sk.lv+" (vista previa)","#b388ff");return;
    }
  }
  if(st==="unlocks"&&h.data&&h.data.it){
    var d=h.data,it=d.it;
    if(unlockedReq(it,d.key)){ok();if(d.kind==="trail")PROF.eq.trail=it.id;else PROF.eq.perk=it.id;profSave();return;}
    if(it.cost){if(PROF.coins>=it.cost){PROF.coins-=it.cost;PROF.own[d.key]=1;if(d.kind==="trail")PROF.eq.trail=it.id;else PROF.eq.perk=it.id;profSave();try{sfx("rarity3");}catch(e){}menuToast("✨ ¡"+it.name+" desbloqueado!","#ffd54f");checkAchievements(0);}else menuToast("Te faltan "+(it.cost-PROF.coins)+" 🪙","#ff8a80");return;}
    menuToast("🔒 Se desbloquea en el nivel "+it.lv,"#b388ff");return;
  }
  if(st==="settings"){
    if(id==="howto"){ok();MENU.howFrom="settings";menuGo("howto");return;}
    if(id.indexOf("tg_")===0){ok();PROF.set[h.data.key]=PROF.set[h.data.key]?0:1;profSave();if(h.data.key==="vib"&&PROF.set.vib){try{navigator.vibrate&&navigator.vibrate(30);}catch(e){}}return;}
    if(id.indexOf("ch_")===0){ok();PROF.set[h.data.key]=h.data.val;profSave();if(h.data.key==="gfx")applyGfxSetting();return;}
  }
}
/* route pointer events for the menu states before the game's own handlers */
(function(){
  var _d=onPointerDown,_m=onPointerMove,_u=onPointerUp;
  function owns(){return game&&MENU_ST[game.state]&&!(typeof titleSplash!=="undefined"&&titleSplash);}
  onPointerDown=function(e){
    if(typeof titleSplash!=="undefined"&&titleSplash)return _d(e);
    if(typeof audio!=="undefined"&&audio&&audio._splashEat){audio._splashEat=0;return;}
    if(owns()){ensureAudio();menuDown(pointerToScreen(e));return;}
    if(game&&game.state==="playing"&&PROF.set.joySide==="R"){
      /* mirrored layout: joystick on the right, super on the left */
      var p=pointerToScreen(e);
      if(!inBtn(getPauseBtn(),p.x,p.y)&&!inBtn(getSuperBtn(),p.x,p.y)&&!(game.player&&game.player.grabbed)&&p.x>SW*0.42){
        input.joy=1;input.joyX=p.x;input.joyY=p.y;input.joyId=e.pointerId!=null?e.pointerId:1;input.jx=0;input.jy=0;try{canvas.setPointerCapture(e.pointerId);}catch(err){}return;
      }
      if(p.x<SW*0.58&&!inBtn(getSuperBtn(),p.x,p.y)&&!inBtn(getPauseBtn(),p.x,p.y))return;
    }
    return _d(e);
  };
  onPointerMove=function(e){
    if(owns()){menuMove(pointerToScreen(e));return;}
    if(input.joy&&PROF.set.joySize!==1&&!input.super){
      if(e.pointerId!=null&&input.joyId!==-1&&e.pointerId!==input.joyId)return _m(e);
      var p=pointerToScreen(e),dx=p.x-input.joyX,dy=p.y-input.joyY,m=Math.sqrt(dx*dx+dy*dy),rad=56*PROF.set.joySize;
      if(m>rad){dx=dx/m*rad;dy=dy/m*rad;}input.jx=dx/rad;input.jy=dy/rad;return;
    }
    return _m(e);
  };
  onPointerUp=function(e){if(owns()){menuUp(pointerToScreen(e));return;}return _u(e);};
  /* listeners were bound to the old functions in initInput; rebind through thin trampolines */
  if(typeof initInput==="function"){var _ii=initInput;initInput=function(){_ii();};}
})();

/* the remaining canvas buttons (hero select, pause, end screens) get the same glossy look */
(function(){
  var MAP={"#2ecc71":"green","#95a5a6":"grey","#e65100":"play","#c62818":"red","#5d4037":"dark","#5c6bc0":"blue","#e74c3c":"red","#3498db":"blue","#f39c12":"gold"};
  drawUIButton=function(b,fill){var st=MAP[(fill||"").toLowerCase()]||(fill&&/^#?[0-9a-f]{6}$/i.test(fill)?null:"green");
    if(!st){BTN_STY._c=[shadeHex(fill,40),fill,shadeHex(fill,-60)];st="_c";}
    var saveHits=MENU.hits;MENU.hits=[];mButton("_ui",b.x,b.y,b.w,b.h,b.label,null,st,{fs:Math.round(Math.min(b.h*0.44,20))});MENU.hits=saveHits;};
})();

/* equipped skins show everywhere the hero is drawn (hero select cards, in-game) */
(function(){var _mh=makeHeroLook;makeHeroLook=function(id){var l=_mh(id);try{var sk=equippedSkin(id||"classic");if(sk!=="orig")l.tint=sk;}catch(e){}return l;};})();
/* the pause-screen mute toggles write through to the profile volumes (applyAudioLevels runs every frame) */
(function(){
  var _ms=setMuteSfx,_mm=setMuteMus;
  setMuteSfx=function(v){if(PROF){if(v){if(PROF.set.sfx>0.001)PROF._sfxPrev=PROF.set.sfx;PROF.set.sfx=0;}else PROF.set.sfx=PROF._sfxPrev||0.9;profSave();}_ms(v);applyAudioLevels();};
  setMuteMus=function(v){if(PROF){if(v){if(PROF.set.mus>0.001)PROF._musPrev=PROF.set.mus;PROF.set.mus=0;}else PROF.set.mus=PROF._musPrev||0.8;profSave();}_mm(v);applyAudioLevels();};
})();
