/* v22.0 — WORLD 2 CABIN BOSSES.
   On the ice the boss rounds are fought indoors: round 3 opens Cabin 1 (SUGAR), round 6 Cabin 2 (REINA DE ESCARCHA),
   round 8 Cabin 3 (MAMUT ZOMBI) and round 10 the IGLOO (REY DE ESCARCHA). The open door glows and an arrow / minimap
   marker leads to it; the other doors stay locked. Walking in plays a door + camera push + iris transition and swaps in
   a painted interior (CAB_DATA: walk grid / SDF traced from each room, same format as the island) the way the hell
   arena swaps maps. The exit is barred until the boss is beaten; walking out plays the reverse transition and the
   round ends (cards, or the World 2 ending after the igloo). World 1 never runs any of this. */
var CAB={
  doors:[{x:636,y:186,lx:643,ly:152,n:"Cabaña 1"},{x:731,y:232,lx:739,ly:196,n:"Cabaña 2"},{x:807,y:294,lx:816,ly:258,n:"Cabaña 3"},{x:388,y:190,lx:386,ly:168,n:"Iglú",igloo:1}],
  rounds:{2:0,5:1,7:2,9:3},
  title:["Cabaña de Sugar","Cabaña de la Reina","Granero del Mamut","Iglú del Rey"],
  imgs:["int_cab1","int_cab2","int_cab3","int_igloo"],
  img:[],spr:{},loading:0,open:-1,inside:-1,won:0,wonT:0,trans:null,cine:null,fx:[],zones:[],cracks:[],msgT:0,beat:{}
};
var CAB_META={
  sugar_cute:{file:"assets/spr/sugar_cute_f.webp",w:245,h:306,fx:0.533,fy:0.865},
  sugar_mut:{file:"assets/spr/sugar_mut_f.webp",w:398,h:426,fx:0.431,fy:0.901},
  reina:{file:"assets/spr/reina_f.webp",w:275,h:426,fx:0.451,fy:0.991},
  mamut:{file:"assets/spr/mamut_f.webp",w:431,h:426,fx:0.44,fy:0.991},
  rey:{file:"assets/spr/rey_f.webp",w:337,h:446,fx:0.559,fy:0.991}
};
var CAB_BOSS={
  sugar:{name:"SUGAR",tag:"La perrita de la cabaña… ya no es tan buena.",hp:1150,r:17,h:60,speed:74,dmg:12,mus:"colo",H:2.15,spr:"sugar_mut",quad:1},
  reina:{name:"REINA DE ESCARCHA",tag:"Sus espejos mienten.",hp:1350,r:14,h:66,speed:58,dmg:11,mus:"home",H:2.35,spr:"reina"},
  mamut:{name:"MAMUT ZOMBI",tag:"El suelo se resquebraja.",hp:1700,r:28,h:72,speed:42,dmg:14,mus:"gorgon",H:2.7,spr:"mamut",quad:1},
  rey:{name:"REY DE ESCARCHA",tag:"El invierno eterno.",hp:2300,r:22,h:76,speed:50,dmg:15,mus:"final",H:2.8,spr:"rey"}
};
var CAB_KEYS=["sugar","reina","mamut","rey"];
function cabLoad(){
  if(CAB.loading)return;CAB.loading=1;
  CAB.imgs.forEach(function(n,i){var tries=0;function go(){var im=new Image();im.onload=function(){CAB.img[i]=im;};im.onerror=function(){if(++tries<4)setTimeout(go,1500*tries);};im.src="assets/env/"+n+".webp?v=22.0"+(tries?"&r="+tries:"");}go();});
  Object.keys(CAB_META).forEach(function(k){var tries=0;function go(){var im=new Image();im.onload=function(){CAB.spr[k]=im;};im.onerror=function(){if(++tries<4)setTimeout(go,1500*tries);};im.src=CAB_META[k].file+"?v=22.0"+(tries?"&r="+tries:"");}go();});
}
function cabReady(){var n=0,i;for(i=0;i<4;i++)if(CAB.img[i])n++;return n===4&&Object.keys(CAB.spr).length===Object.keys(CAB_META).length&&typeof CAB_DATA!=="undefined";}
(function(){var _l=w2LoadImg;w2LoadImg=function(){cabLoad();return _l.apply(this,arguments);};})();
if(typeof w2Unlocked==="function"&&w2Unlocked())setTimeout(cabLoad,3000);
/* ---------- save: profile v5 (seen cinematics, cabin wins), versioned with a backup ---------- */
PROF_DEF.v=5;PROF_DEF.cine={};
function profMigrate5(p){
  if(!p)return p;
  if((p.v|0)<5){
    try{lsSet("bz_profile_v4_backup",JSON.parse(JSON.stringify(p)));}catch(e){}
    p.cine=p.cine&&typeof p.cine==="object"?p.cine:{};
    p.v=5;p._migratedFrom4=Date.now();
  }
  if(!p.cine||typeof p.cine!=="object")p.cine={};
  if(p.worlds&&p.worlds.w2&&typeof p.worlds.w2==="object"&&(!p.worlds.w2.cabins||typeof p.worlds.w2.cabins!=="object"))p.worlds.w2.cabins={};
  return p;
}
PROF=profMigrate5(PROF);profSave();
(function(){var _pl=profLoad;profLoad=function(){_pl();PROF=profMigrate5(PROF);return PROF;};})();
/* ---------- sounds: synthesized once on first use (no extra downloads) ---------- */
var CAB_SFX={cab_bark:0.34,cab_bark2:0.55,cab_roar:1.5,cab_mutate:2.7,cab_howl:1.3,cab_crack:0.55,cab_shatter:0.7,cab_bliz:1.5,cab_trumpet:1.4,cab_door:0.8,cab_whimper:0.5};
function cabSynth(name){
  var A=audio.ctx;if(!A)return null;
  var sr=A.sampleRate,dur=CAB_SFX[name]||0.5,n=Math.floor(sr*dur),buf=A.createBuffer(1,n,sr),d=buf.getChannelData(0);
  var i,k,t,v,f,e,ph=0,lp=0,lp2=0,pk=0,TAU=6.283185307;
  function nz(){return Math.random()*2-1;}
  function harm(ph,f,nH,F1,F2,w1,w2){var s=0,k,fk,a;for(k=1;k<=nH;k++){fk=f*k;a=Math.exp(-((fk-F1)*(fk-F1))/(w1*w1))+0.7*Math.exp(-((fk-F2)*(fk-F2))/(w2*w2))+0.12/k;s+=a*Math.sin(ph*k);}return s;}
  for(i=0;i<n;i++){t=i/sr;v=0;
    if(name==="cab_bark"||name==="cab_bark2"){
      var big=name==="cab_bark2",fa=big?240:430,fb=big?560:720,fc=big?170:320,td=big?0.26:0.15;
      f=t<0.03?fa+(fb-fa)*(t/0.03):fb+(fc-fb)*Math.min(1,(t-0.03)/td);ph+=TAU*f/sr;
      v=harm(ph,f,10,big?720:1050,big?1800:2500,big?420:520,700)*0.26*(1+0.4*Math.sin(TAU*(big?42:68)*t));
      e=Math.min(1,t/0.004)*Math.exp(-Math.max(0,t-(big?0.05:0.025))/(big?0.13:0.07));
      v=v*e+nz()*0.3*Math.exp(-t/0.014)+(big?nz()*0.12*e:0);
    }else if(name==="cab_roar"){
      f=(130-35*t/dur)*(1+0.03*Math.sin(TAU*7*t))+nz()*6;ph+=TAU*f/sr;
      e=Math.min(1,t/0.08)*Math.min(1,(dur-t)/0.45);
      lp+=0.08*(nz()-lp);
      v=(harm(ph,f,16,520,1500,300,600)*0.22*(1+0.6*Math.sin(TAU*31*t+Math.sin(TAU*3*t)*4))+lp*1.6)*e;
    }else if(name==="cab_mutate"){
      var u=t/dur;f=90+430*u*u;ph+=TAU*f/sr;
      var saw=0;for(k=1;k<=8;k++)saw+=Math.sin(ph*k)/k;
      lp+=0.02*(nz()-lp);lp2+=(0.05+0.5*u)*(nz()-lp2);
      e=Math.min(1,t/0.3)*Math.min(1,(dur-t)/0.25);
      v=(saw*0.18*u*(1+0.8*Math.sin(TAU*(6+30*u)*t))+Math.sin(TAU*52*t)*0.35*(1-u*0.5)+lp*2.2+lp2*0.5*u)*e;
      if(Math.random()<0.0004+0.003*u*u)pk=0.9;v+=nz()*pk;pk*=0.992;
    }else if(name==="cab_howl"){
      f=(t<0.35?420+260*(t/0.35):680-200*Math.min(1,(t-0.35)/0.8))*(1+0.025*Math.sin(TAU*6*t));ph+=TAU*f/sr;
      e=Math.min(1,t/0.1)*Math.min(1,(dur-t)/0.35);v=(Math.sin(ph)+0.35*Math.sin(2*ph)+0.12*Math.sin(3*ph))*0.45*e+nz()*0.03*e;
    }else if(name==="cab_crack"){
      if(Math.random()<(t<0.25?0.004:0.0008))pk=1;v=nz()*pk;pk*=0.985;
      v+=Math.sin(TAU*(70-40*t)*t)*0.6*Math.exp(-t/0.12);
    }else if(name==="cab_shatter"){
      lp+=0.6*(nz()-lp);v=(nz()-lp)*0.7*Math.exp(-t/0.12);
      for(k=0;k<5;k++)v+=Math.sin(TAU*(2100+k*730)*t+k)*0.12*Math.exp(-t/(0.08+k*0.05));
    }else if(name==="cab_bliz"){
      var cut=0.02+0.05*(0.5+0.5*Math.sin(TAU*1.3*t));lp+=cut*(nz()-lp);e=Math.sin(Math.PI*t/dur);v=lp*3.2*e;
    }else if(name==="cab_trumpet"){
      f=(t<0.25?300+240*(t/0.25):540-260*Math.min(1,(t-0.25)/0.9))*(1+0.03*Math.sin(TAU*7*t));ph+=TAU*f/sr;
      e=Math.min(1,t/0.05)*Math.min(1,(dur-t)/0.35);v=harm(ph,f,12,900,2000,500,700)*0.3*e+nz()*0.08*e;
    }else if(name==="cab_door"){
      f=150+60*Math.sin(TAU*1.7*t)+nz()*25;ph+=TAU*f/sr;lp+=0.1*(nz()-lp);
      e=t<0.55?Math.min(1,t/0.05)*0.8:0;v=(Math.sin(ph)*0.3+Math.sin(ph*2.01)*0.2)*e*(0.6+0.4*Math.sin(TAU*23*t))+lp*0.5*e;
      if(t>0.55)v+=Math.sin(TAU*60*t)*0.9*Math.exp(-(t-0.55)/0.07)+nz()*0.3*Math.exp(-(t-0.55)/0.03);
    }else if(name==="cab_whimper"){
      f=900-300*t/dur+40*Math.sin(TAU*9*t);ph+=TAU*f/sr;e=Math.sin(Math.PI*t/dur);v=(Math.sin(ph)+0.3*Math.sin(2*ph))*0.4*e;
    }
    d[i]=v;
  }
  var mx=0;for(i=0;i<n;i++){v=Math.abs(d[i]);if(v>mx)mx=v;}
  if(mx>0){var g=0.9/mx;for(i=0;i<n;i++)d[i]*=g;}
  return buf;
}
function cabSfx(name,vol){
  try{
    if(!ensureAudio()||!audio.ctx)return;
    if(!audio._baked&&typeof bakeSfxSync==="function")bakeSfxSync();
    if(!audio.sfxBuf)audio.sfxBuf={};
    if(!audio.sfxBuf[name])audio.sfxBuf[name]=cabSynth(name);
    sfx(name,vol==null?0.9:vol);
  }catch(e){}
}
(function(){
  for(var k in CAB_SFX)SFX_BOSS[k]=1;
  var _sa=sfxAllowed;
  sfxAllowed=function(name){if(typeof game!=="undefined"&&game&&(game.state==="cab_trans"||game.state==="cab_cine"))return 1;return _sa.apply(this,arguments);};
})();
/* ---------- helpers ---------- */
function cabW2(){return typeof WORLD!=="undefined"&&WORLD.cur===2&&typeof CAB_DATA!=="undefined";}
function cabBase(){return layout.baseViewW||380;}
function cabCam(tx,ty,k){
  game.camX+=(tx-game.camX)*k;game.camY+=(ty-game.camY)*k;
  var hw=worldW()*0.5,hh=worldH()*0.5;
  game.camX=CFG.MAP_W>2*hw+16?clamp(game.camX,hw+8,CFG.MAP_W-hw-8):CFG.MAP_W/2;
  game.camY=CFG.MAP_H>2*hh+16?clamp(game.camY,hh+8,CFG.MAP_H-hh-8):CFG.MAP_H/2;
}
function cabClearCombat(){
  var p=game.player;
  game.events=[];game.spawnQueue=[];game.zombies=[];game.bullets.length=0;game.projectiles.length=0;if(game.grenades)game.grenades.length=0;
  if(game.lasers)game.lasers.length=0;if(game.bolts)game.bolts.length=0;game.portals=[];if(game.particles)game.particles.length=0;if(game.acids)game.acids.length=0;
  if(typeof clearFireFx==="function")clearFireFx();
  if(typeof stopTruenoLaser==="function")stopTruenoLaser(p);if(typeof stopGigante==="function"&&p.giantT>0)stopGigante(p);if(typeof stopCombatLoops==="function")stopCombatLoops();
  game.boss=null;game.colossus=null;game.home=null;game.gorgon=null;game.bossFight=0;
  CAB.fx=[];CAB.zones=[];CAB.cracks=[];
}
function cabResetRun(){
  if(CAB.inside>=0&&typeof WORLD!=="undefined"&&WORLD.img&&typeof ART!=="undefined"){ART.arena=WORLD.img;if(typeof W2_DATA!=="undefined")MAP_DATA=W2_DATA;}
  CAB.open=-1;CAB.inside=-1;CAB.won=0;CAB.trans=null;CAB.cine=null;CAB.fx=[];CAB.zones=[];CAB.cracks=[];CAB.beat={};
  if(typeof layout!=="undefined"&&layout&&layout.baseViewW&&typeof hellSetView==="function")hellSetView(layout.baseViewW);
}
/* ---------- round flow ---------- */
(function(){
  var _sg=startGame;startGame=function(){cabResetRun();return _sg.apply(this,arguments);};
  var _ct=createTitleState;createTitleState=function(){cabResetRun();return _ct.apply(this,arguments);};
  var _bc=beginCombat;
  beginCombat=function(){
    if(cabW2()&&CAB.rounds[game.wave]!=null&&CAB.inside<0&&cabReady())return cabUnlock(CAB.rounds[game.wave]);
    return _bc.apply(this,arguments);
  };
  var _wc=onWaveCleared;
  onWaveCleared=function(){
    if(cabW2()&&CAB.inside>=0){cabWin();return;}
    if(cabW2()&&CAB.open>=0)return;
    return _wc.apply(this,arguments);
  };
  CAB._waveCleared=function(){return _wc.apply(this,arguments);};
})();
function cabUnlock(i){
  var p=game.player;
  CAB.open=i;CAB.won=0;CAB.fx=[];CAB.zones=[];CAB.cracks=[];CAB.openT=0;
  p.invuln=Math.max(p.invuln,0.9);game.state="playing";game.spawnTimer=0.6;game.graceT=1.4;game.bossSpawned=0;
  /* while the door is open a lighter outdoor wave keeps the pressure on */
  if(game.spawnQueue)game.spawnQueue=game.spawnQueue.slice(0,Math.ceil(game.spawnQueue.length*0.45));
  game.message=i===3?"¡El Iglú se ha abierto! Entra para la batalla final":"¡"+CAB.doors[i].n+" desbloqueada! Entra a luchar";game.messageTimer=4.6;
  sfx("portal",0.8);sfx("sting",0.7);shake(4);
}
function cabStartTrans(kind){
  var p=game.player,i=kind==="in"?CAB.open:CAB.inside,T={kind:kind,i:i,t:0,swapped:0};
  if(kind==="in"){var d=CAB.doors[i];T.px=d.x;T.py=d.y-6;T.fx=d.lx;T.fy=d.ly+8;}
  else{var D=CAB_DATA[i];T.px=D.exit.x;T.py=D.exit.y+4;T.fx=D.exit.x;T.fy=D.exit.y;}
  CAB.trans=T;game.state="cab_trans";p.vx=p.vy=0;p.dashT=0;p.knockT=0;
  if(typeof stopTruenoLaser==="function")stopTruenoLaser(p);if(typeof stopCombatLoops==="function")stopCombatLoops();
  cabSfx("cab_door",0.9);sfx("whoosh",0.7);
}
function cabEnter(i){
  var p=game.player,D=CAB_DATA[i];
  cabClearCombat();
  if(typeof HELL!=="undefined")HELL.building=1;
  MAP_DATA=D;ART.arena=CAB.img[i];
  buildMap(11+i);
  if(typeof HELL!=="undefined")HELL.building=0;
  map.isCabin=1;map.world=2;map.chunks={};
  CAB.inside=i;CAB.won=0;CAB.wonT=0;
  p.x=D.start.x;p.y=D.start.y+16;p.vx=p.vy=0;p.aimAng=p.facing=-1.57;if(p.faceAng!=null)p.faceAng=-1.57;if(p.bodyAng!=null)p.bodyAng=-1.57;
  if(p.dog){p.dog.x=p.x+10;p.dog.y=p.y+8;}
  game.camX=p.x;game.camY=p.y-30;cabCam(game.camX,game.camY,1);
  updateFlow(p.x,p.y);game.graceT=1e9;game.spawnTimer=99;
}
function cabLeave(i){
  var p=game.player,d=CAB.doors[i];
  cabClearCombat();
  if(typeof WORLD!=="undefined"&&WORLD.img)ART.arena=WORLD.img;if(typeof W2_DATA!=="undefined")MAP_DATA=W2_DATA;
  CAB.inside=-1;
  buildMap(((Math.random()*1e9)|0)^Date.now());
  p.x=d.x;p.y=d.y+4;p.vx=p.vy=0;p.aimAng=p.facing=1.57;if(p.faceAng!=null)p.faceAng=1.57;if(p.bodyAng!=null)p.bodyAng=1.57;
  if(p.dog){p.dog.x=p.x+10;p.dog.y=p.y+8;}
  game.camX=p.x;game.camY=p.y;cabCam(game.camX,game.camY,1);
  updateFlow(p.x,p.y);
}
function cabTransUpdate(dt){
  var T=CAB.trans,p=game.player,base=cabBase(),k=1-Math.exp(-6*dt);T.t+=dt;
  if(!T.swapped){
    var tIn=T.kind==="in"?1.05:1.0;
    p.x+=(T.px-p.x)*Math.min(1,5*dt);p.y+=(T.py-p.y)*Math.min(1,5*dt);p.anim=(p.anim||0)+dt*8;p.legPh=(p.legPh||0)+dt*8;
    var ang=T.kind==="in"?-1.57:1.57;p.aimAng=p.facing=ang;if(p.faceAng!=null)p.faceAng=ang;if(p.bodyAng!=null)p.bodyAng=ang;
    hellSetView(base*(1-0.36*smooth01(T.t/0.8)));
    cabCam(T.fx,T.fy-10,k);
    if(Math.random()<0.6)addParticle(T.fx+rand(-16,16),T.fy+rand(-8,8),T.kind==="in"&&T.i!==3?"#ffcc80":"#e1f5fe",0.6,rand(-20,20),rand(-50,-15),rand(2,4),3);
    if(T.t>=tIn){T.swapped=1;T.t0=T.t;
      if(T.kind==="in")cabEnter(T.i);else cabLeave(T.i);
      hellSetView(base*0.66);
      T.px=p.x;T.py=T.kind==="in"?p.y-16:p.y+14;sfx("whoosh",0.6);
    }
  }else{
    var u=(T.t-T.t0)/0.75;
    p.x+=(T.px-p.x)*Math.min(1,4*dt);p.y+=(T.py-p.y)*Math.min(1,4*dt);p.anim=(p.anim||0)+dt*8;p.legPh=(p.legPh||0)+dt*8;
    hellSetView(base*(0.66+0.34*smooth01(u)));
    cabCam(p.x,p.y-(T.kind==="in"?30:0),1-Math.exp(-8*dt));
    if(u>=1){
      hellSetView(base);CAB.trans=null;
      if(T.kind==="in")cabBossStart(T.i);
      else cabFinishRound(T.i);
    }
  }
  if(typeof updateFX==="function")updateFX(dt);
}
function cabFinishRound(i){
  var p=game.player;CAB.open=-1;CAB.beat[i]=1;
  try{var w=PROF.worlds&&PROF.worlds.w2;if(w){if(!w.cabins)w.cabins={};w.cabins[CAB_KEYS[i]]=(w.cabins[CAB_KEYS[i]]|0)+1;profSave();}}catch(e){}
  game.state="playing";p.invuln=Math.max(p.invuln,1);
  game.bossSpawned=1;
  CAB._waveCleared();
}
function cabWin(){
  if(CAB.won)return;
  CAB.won=1;CAB.wonT=0;
  var i,z;for(i=0;i<game.zombies.length;i++){z=game.zombies[i];if(!z.dead&&!z.dying&&(z.cabPup||z.cabClone||z.cabAdd))killZombie(z);}
  CAB.zones=[];CAB.cracks=[];CAB.fx=CAB.fx.filter(function(o){return o.k==="burst";});game.projectiles.length=0;
  game.message=CAB.inside===3?"¡Has derrotado al Rey! Sal del iglú":"¡Jefe derrotado! Sal por la puerta";game.messageTimer=4;
  if(game.bossFight){startMusic("play");game.bossFight=0;}
  sfx("clear",0.9);cabSfx("cab_shatter",0.8);
}
/* ---------- bosses ---------- */
function cabSpawnBoss(i,x,y){
  var key=CAB_KEYS[i],S=CAB_BOSS[key],wd=typeof waveDifficulty==="function"?waveDifficulty(game.wave):null,bs=wd?wd.bossHp:1.2;
  var z=spawnZombie("boss",x,y,game.wave);
  z.isBoss=1;z.cab=key;z.cabI=i;z.spawnT=0;z.phase="fight";z.introT=0;z.elite=0;
  z.hp=z.maxHp=Math.round(S.hp*bs);z.r=S.r;z.h=S.h;z.speed=S.speed*CFG.SPD;z.damage=Math.round(S.dmg*(wd&&wd.dmg?wd.dmg:1));
  z.bName=S.name;z.bTag=S.tag;z.score=3000+i*1000;z.xp=400+i*150;
  z.st="idle";z.stT=0;z.cd=1.6;z.rings=[];z.throws=[];z.atkCd=99;z.face=-1;z.touchCd=0;z.pupCd=6;z.cloneCd=4;z.sumCd=8;z.blinkCd=3;z.lift=0;z.anim=0;
  z.look={kind:"cab",type:"boss",cab:key};
  return z;
}
function cabBossStart(i){
  var D=CAB_DATA[i],z=cabSpawnBoss(i,D.boss.x,D.boss.y),p=game.player;
  game.graceT=1e9;game.spawnQueue=[];
  if(i===0){
    z.cute=1;z.mutP=0;z.aimAng=Math.atan2(p.y-z.y,p.x-z.x);z.face=p.x<z.x?-1:1;
    game.zombies.push(z);game.boss=z;game.bossSpawned=1;game.bossFight=0;
    CAB.cine={t:0,skip:!!(PROF.cine&&PROF.cine.sugar),bub:"",bubT:0,flash:0};game.state="cab_cine";
    try{stopMusic();}catch(e){}
    return;
  }
  var lines=[null,"Mírate en mis espejos…","¡HRRRUUUUMMM!","¡El hielo os tragará!"],bab=[null,"Mírate en mis espejos","Hrrruuum","El hielo os tragará"];
  startBoss(z,lines[i],bab[i],[0,120,60,70][i]);
  startMusic(CAB_BOSS[z.cab].mus);
  if(i===2)cabSfx("cab_trumpet",0.9);
  if(i===3)cabSfx("cab_roar",0.8);
}
/* Sugar's intro: cute Sugar barks at you, then mutates into the frost dog (6.25 s, skippable after the first view) */
function cabCineUpdate(dt){
  var C=CAB.cine,z=game.boss,p=game.player,base=cabBase();
  if(!z){game.state="playing";CAB.cine=null;return;}
  C.t+=dt;var t=C.t;
  hellSetView(base*(t<3.0?0.8-0.06*smooth01(t/3):0.74+0.2*smooth01((t-3.0)/2.4)));
  cabCam(z.x,z.y-(t<3?16:30),1-Math.exp(-4*dt));
  z.anim+=dt*(t<3?5:12);z.aimAng=Math.atan2(p.y-z.y,p.x-z.x);z.face=p.x<z.x?-1:1;
  p.anim=0;p.vx=p.vy=0;p.aimAng=p.facing=Math.atan2(z.y-p.y,z.x-p.x);
  if(C.bub)C.bubT+=dt;
  if(t>0.9&&!C.b1){C.b1=1;cabSfx("cab_bark",1);C.bub="¡Guau!";C.bubT=0;}
  if(t>1.5&&!C.b2){C.b2=1;cabSfx("cab_bark",1);C.bub="¡Guau! ¡GUAU!";C.bubT=0.15;}
  if(t>2.1&&!C.b3){C.b3=1;cabSfx("cab_bark2",1);shake(3);}
  z.lift=(t>0.9&&t<2.6)?Math.abs(Math.sin((t-0.9)*11))*4:0;
  if(t>2.8&&C.bub)C.bub="";
  if(t>3.0&&!C.m){C.m=1;cabSfx("cab_mutate",1);}
  if(t>3.0&&t<4.9){var u=(t-3.0)/1.9;z.mutP=u;z.shk=1+5*u;if(Math.random()<0.35)shake(2+5*u);
    if(Math.random()<0.5+u){var a=Math.random()*6.283,r=20+30*u;addParticle(z.x+Math.cos(a)*r,z.y+Math.sin(a)*r*0.6-10,Math.random()<0.5?"#e1f5fe":"#4fc3f7",0.5,-Math.cos(a)*60,-Math.sin(a)*40-30,rand(2,5),3);}}
  if(t>=4.9&&!C.f){C.f=1;z.cute=0;z.mutP=1;z.shk=0;C.flash=1;cabSfx("cab_roar",1);shake(16);
    for(var i=0;i<30;i++)addParticle(z.x+rand(-10,10),z.y-rand(0,30),i%2?"#e1f5fe":"#4fc3f7",0.9,rand(-220,220),rand(-200,40),rand(4,9),3);}
  if(C.flash>0)C.flash-=dt*2.2;
  if(t>5.5&&!C.n){C.n=1;sfx("sting",0.8);}
  if(typeof updateFX==="function")updateFX(dt);
  if(t>=6.25)cabCineEnd();
}
function cabCineSkip(){var C=CAB.cine;if(!C||!C.skip||C.t<0.4||C.t>=4.85)return;C.t=4.85;C.b1=C.b2=C.b3=C.m=1;C.bub="";}
function cabCineEnd(){
  var z=game.boss,p=game.player;CAB.cine=null;
  if(z){z.cute=0;z.mutP=1;z.shk=0;z.lift=0;z.st="idle";z.cd=1.2;z.phase="fight";}
  game.state="playing";game.bossFight=1;hellSetView(cabBase());startMusic(CAB_BOSS.sugar.mus);p.invuln=Math.max(p.invuln,1.2);
  try{PROF.cine.sugar=(PROF.cine.sugar|0)+1;profSave();}catch(e){}
}
/* per-frame cabin logic while playing in World 2 (doors, exit, attack fx, zones, cracks) */
function cabTick(dt){
  var p=game.player,i,o,k;p.cabSlow=0;CAB.msgT-=dt;
  if(CAB.inside<0){
    CAB.openT=(CAB.openT||0)+dt;
    if(CAB.open>=0){var d=CAB.doors[CAB.open];if(dist(p.x,p.y,d.x,d.y)<18&&cabReady()&&CAB.openT>0.5){cabStartTrans("in");return;}}
    for(i=0;i<4;i++){if(i===CAB.open)continue;var dd=CAB.doors[i];
      if(dist(p.x,p.y,dd.x,dd.y)<17&&CAB.msgT<=0){game.message=CAB.beat[i]?"Ya has vencido aquí":"Cerrada… aún no te toca";game.messageTimer=1.6;CAB.msgT=3;sfx("click",0.5);}}
    return;
  }
  var D=CAB_DATA[CAB.inside],boss=game.boss;
  if(CAB.won){CAB.wonT+=dt;if(dist(p.x,p.y,D.exit.x,D.exit.y)<20&&CAB.wonT>0.6){cabStartTrans("out");return;}}
  else if(dist(p.x,p.y,D.exit.x,D.exit.y)<18&&CAB.msgT<=0){game.message="¡Cerrado! Derrota al jefe para salir";game.messageTimer=1.6;CAB.msgT=2.5;sfx("click",0.5);}
  for(i=CAB.fx.length-1;i>=0;i--){o=CAB.fx[i];o.t+=dt;
    if(o.k==="ring"){var pr=o.r;o.r+=o.vr*dt;var dp=dist(p.x,p.y,o.x,o.y);
      if(!o.hit&&!CAB.won&&dp>pr-p.r-6&&dp<o.r+p.r){o.hit=1;hurtPlayer(p,o.dmg);if(o.push&&dp>1){var pa=Math.atan2(p.y-o.y,p.x-o.x);moveWithSlide(p,Math.cos(pa)*18,Math.sin(pa)*18);}}
      if(o.r>=o.maxR)CAB.fx.splice(i,1);}
    else if(o.k==="tele"||o.k==="blink"){if(o.t>=o.max)CAB.fx.splice(i,1);}
    else if(o.k==="icicle"){
      if(!o.done&&o.t>=o.max){o.done=1;o.t2=0;if(!CAB.won&&dist(p.x,p.y,o.x,o.y)<o.r+p.r*0.5)hurtPlayer(p,o.dmg);cabSfx("cab_shatter",0.35);shake(2);
        for(k=0;k<8;k++)addParticle(o.x,o.y,k%2?"#e1f5fe":"#81d4fa",0.5,rand(-90,90),rand(-120,-20),rand(3,6),3);}
      if(o.done){o.t2+=dt;if(o.t2>0.3)CAB.fx.splice(i,1);}}
    else if(o.k==="slash"){if(!o.hit){o.hit=1;var sd=dist(p.x,p.y,o.x,o.y),sa=Math.atan2(p.y-o.y,p.x-o.x),df=Math.abs(Math.atan2(Math.sin(sa-o.a),Math.cos(sa-o.a)));if(sd<o.r+p.r&&df<o.w)hurtPlayer(p,o.dmg);}if(o.t>=0.35)CAB.fx.splice(i,1);}
    else if(o.t>=(o.max||0.6))CAB.fx.splice(i,1);
  }
  for(i=CAB.zones.length-1;i>=0;i--){o=CAB.zones[i];o.t+=dt;var rr=o.r*Math.min(1,o.t/o.grow);
    if(o.t>o.grow&&dist(p.x,p.y,o.x,o.y)<rr){p.cabSlow=1;o.tick=(o.tick||0)-dt;if(o.tick<=0){o.tick=0.8;hurtPlayer(p,o.dmg);}}
    if(Math.random()<0.35)addParticle(o.x+rand(-rr,rr),o.y+rand(-rr,rr)*0.6,"#e1f5fe",0.6,rand(-40,40),rand(-30,0),rand(2,4),3);
    if(o.t>=o.life)CAB.zones.splice(i,1);}
  for(i=CAB.cracks.length-1;i>=0;i--){o=CAB.cracks[i];o.t+=dt;
    if(o.t>=o.erupt&&!o.hit){o.hit=1;if(!CAB.won&&segDist(p.x,p.y,o.x0,o.y0,o.x1,o.y1)<p.r+9)hurtPlayer(p,o.dmg);cabSfx("cab_crack",0.55);shake(3);
      for(var q=0;q<5;q++){var u=Math.random();addParticle(o.x0+(o.x1-o.x0)*u,o.y0+(o.y1-o.y0)*u,"#b3e5fc",0.55,rand(-30,30),rand(-110,-40),rand(3,6),3);}}
    if(o.t>=o.life)CAB.cracks.splice(i,1);}
  /* mirror clones shoot */
  for(i=0;i<game.zombies.length;i++){o=game.zombies[i];if(!o.cabClone||o.dead||o.dying)continue;o.shotCd=(o.shotCd==null?rand(1,2):o.shotCd)-dt;
    if(o.shotCd<=0&&dist(o.x,o.y,p.x,p.y)<320){o.shotCd=rand(2.2,3);cabShard(o.x,o.y,Math.atan2(p.y-o.y,p.x-o.x),170,Math.round((boss&&boss.damage||10)*0.7));}}
}
function segDist(px,py,x0,y0,x1,y1){var vx=x1-x0,vy=y1-y0,l=vx*vx+vy*vy||1,u=clamp(((px-x0)*vx+(py-y0)*vy)/l,0,1);return dist(px,py,x0+vx*u,y0+vy*u);}
function cabShard(x,y,a,spd,dmg){game.projectiles.push({x:x,y:y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life:2.2,r:6,dmg:dmg,col:"#81d4fa",ice:1});}
function cabRing(x,y,vr,maxR,dmg,col,push){CAB.fx.push({k:"ring",x:x,y:y,r:10,vr:vr,maxR:maxR,dmg:dmg,col:col||"#81d4fa",t:0,push:push||0});}
function cabTele(x,y,r,max,col){CAB.fx.push({k:"tele",x:x,y:y,r:r,t:0,max:max,col:col||"#ff5252"});}
function cabIcicle(x,y,dmg,delay){CAB.fx.push({k:"icicle",x:x,y:y,r:22,t:0,max:delay||1.0,dmg:dmg});}
function cabCrack(x,y,a,len,dmg,delay){var x1=x+Math.cos(a)*len,y1=y+Math.sin(a)*len,n=0;while(n++<12&&sampleSDF(x1,y1)<4){len*=0.85;x1=x+Math.cos(a)*len;y1=y+Math.sin(a)*len;}
  CAB.cracks.push({x0:x,y0:y,x1:x1,y1:y1,t:0,erupt:delay||0.75,life:(delay||0.75)+1.2,dmg:dmg,seed:Math.random()*99});}
function cabSpotNear(x,y,rmin,rmax,rad){return (typeof hellSpot==="function"&&hellSpot(x,y,rmin,rmax,rad))||null;}
function cabAdd(type,x,y,flag){
  var s=cabSpotNear(x,y,10,60,14)||{x:x,y:y},z=spawnZombie(type,s.x,s.y,game.wave);z[flag]=1;z.cabAdd=1;z.spawnT=0.35;
  if(typeof placeOnGround==="function")placeOnGround(z);game.zombies.push(z);return z;
}
function cabAlive(flag){var n=0,i,z;for(i=0;i<game.zombies.length;i++){z=game.zombies[i];if(z[flag]&&!z.dead&&!z.dying)n++;}return n;}
/* ---------- boss AI ---------- */
function cabMove(z,ax,ay,spd,dt){moveWithSlide(z,ax*spd*dt,ay*spd*dt);}
function cabChase(z,spd,dt,dx,dy,d){var c=chaseDir(z,dx,dy,d);cabMove(z,c.x,c.y,spd,dt);}
function cabFace(z,a){z.aimAng=a;var c=Math.cos(a);if(c>0.15)z.face=1;else if(c<-0.15)z.face=-1;}
function cabBossUpdate(z,dt){
  var p=game.player,dx=p.x-z.x,dy=p.y-z.y,d=Math.sqrt(dx*dx+dy*dy)||1;
  z.anim=(z.anim||0)+dt*6;z.touchCd-=dt;z.stT-=dt;
  if(z.stun>0){z.anim-=dt*5;return;}
  var p2=z.hp<z.maxHp*0.5;
  if(p2&&!z.p2){z.p2=1;shake(8);cabSfx(z.cab==="sugar"?"cab_howl":z.cab==="mamut"?"cab_trumpet":"cab_roar",0.8);floatText(z.x,z.y-z.h,"¡FURIA!","#4fc3f7");}
  if(z.cab==="sugar")cabAiSugar(z,dt,p,dx,dy,d,p2);
  else if(z.cab==="reina")cabAiReina(z,dt,p,dx,dy,d,p2);
  else if(z.cab==="mamut")cabAiMamut(z,dt,p,dx,dy,d,p2);
  else cabAiRey(z,dt,p,dx,dy,d,p2);
  if(z.st!=="jump"&&z.touchCd<=0&&dist(z.x,z.y,p.x,p.y)<z.r+p.r+2){hurtPlayer(p,Math.round(z.damage*0.8));z.touchCd=0.9;}
}
function cabPickSpot(z,tx,ty){return (sampleSDF(tx,ty)>=z.r+2)?{x:tx,y:ty}:cabSpotNear(tx,ty,0,60,z.r+2);}
function cabAiSugar(z,dt,p,dx,dy,d,p2){
  var sp=z.speed*(p2?1.2:1);
  if(z.st==="idle"){
    cabFace(z,Math.atan2(dy,dx));if(d>36)cabChase(z,sp,dt,dx,dy,d);
    z.cd-=dt*(p2?1.35:1);z.pupCd-=dt;
    if(z.cd<=0){
      var r=Math.random();
      if(z.hp<z.maxHp*0.72&&z.pupCd<=0&&cabAlive("cabPup")<3){z.st="howl";z.stT=0.9;cabSfx("cab_howl",0.9);}
      else if(d>150?r<0.55:r<0.38){z.st="lunge_w";z.stT=0.5;z.la=Math.atan2(dy,dx);}
      else if(r<0.7||d>150){z.st="jump_w";z.stT=0.38;}
      else{z.st="bark_w";z.stT=0.55;}
    }
  }else if(z.st==="lunge_w"){z.la=Math.atan2(dy,dx)*0.25+z.la*0.75;cabFace(z,z.la);if(z.stT<=0){z.st="lunge";z.stT=0.4;z.bit=0;cabSfx("cab_bark",0.7);}}
  else if(z.st==="lunge"){var ox=z.x,oy=z.y;cabMove(z,Math.cos(z.la),Math.sin(z.la),440*CFG.SPD,dt);
    if(Math.random()<0.6)addParticle(z.x,z.y,"#e1f5fe",0.35,rand(-20,20),rand(-30,-5),rand(3,5),3);
    if(!z.bit&&dist(z.x,z.y,p.x,p.y)<z.r+p.r+6){z.bit=1;hurtPlayer(p,Math.round(z.damage*1.3));shake(5);sfx("bite",0.8);}
    if(z.stT<=0||dist(ox,oy,z.x,z.y)<440*CFG.SPD*dt*0.3){z.st="rec";z.stT=0.45;}}
  else if(z.st==="jump_w"){z.lift=Math.max(0,(0.38-z.stT))*-6;if(z.stT<=0){var s=cabPickSpot(z,p.x,p.y)||{x:z.x,y:z.y};z.st="jump";z.jT=0;z.jx0=z.x;z.jy0=z.y;z.jx1=s.x;z.jy1=s.y;cabTele(s.x,s.y,62,0.6,"#4fc3f7");cabSfx("cab_bark2",0.6);}}
  else if(z.st==="jump"){z.jT+=dt;var u=Math.min(1,z.jT/0.6);z.x=z.jx0+(z.jx1-z.jx0)*u;z.y=z.jy0+(z.jy1-z.jy0)*u;z.lift=Math.sin(u*Math.PI)*55;cabFace(z,Math.atan2(z.jy1-z.jy0,z.jx1-z.jx0));
    if(u>=1){z.lift=0;resolveCircleSafe(z);cabRing(z.x,z.y,280,p2?135:115,z.damage,"#81d4fa");shake(10);sfx("stomp",0.9);
      for(var k=0;k<12;k++)addParticle(z.x,z.y,k%2?"#e1f5fe":"#b3e5fc",0.6,rand(-140,140),rand(-80,10),rand(4,8),3);
      if(dist(z.x,z.y,p.x,p.y)<z.r+p.r+16)hurtPlayer(p,Math.round(z.damage*1.2));z.st="rec";z.stT=0.55;}}
  else if(z.st==="bark_w"){cabFace(z,Math.atan2(dy,dx));if(z.stT<=0){cabSfx("cab_bark2",1);cabRing(z.x,z.y,300,150,z.damage,"#e1f5fe",1);if(p2)z.bark2=0.32;shake(6);z.st="rec";z.stT=0.5;}}
  else if(z.st==="howl"){if(z.stT<=0){var n=p2?3:2,j;for(j=0;j<n;j++){var s2=cabSpotNear(z.x,z.y,40,110,12);if(s2){var pz=cabAdd("fast",s2.x,s2.y,"cabPup");pz.hp=pz.maxHp=Math.round(pz.maxHp*0.8);}}z.pupCd=12;z.st="rec";z.stT=0.3;}}
  else if(z.st==="rec"){if(z.stT<=0){z.st="idle";z.cd=rand(0.8,1.5);}}
  if(z.bark2>0){z.bark2-=dt;if(z.bark2<=0){cabSfx("cab_bark",0.8);cabRing(z.x,z.y,300,150,z.damage,"#e1f5fe",1);}}
}
function resolveCircleSafe(z){try{if(typeof resolveCircle==="function")resolveCircle(z);}catch(e){}if(sampleSDF(z.x,z.y)<z.r*0.5){var s=cabSpotNear(z.x,z.y,0,80,z.r+2);if(s){z.x=s.x;z.y=s.y;}}}
function cabAiReina(z,dt,p,dx,dy,d,p2){
  var sp=z.speed*(p2?1.2:1);z.cloneCd-=dt;z.blinkCd-=dt;
  if(z.st==="idle"){
    cabFace(z,Math.atan2(dy,dx));
    if(d<120)cabMove(z,-dx/d,-dy/d,sp,dt);else if(d>210)cabChase(z,sp,dt,dx,dy,d);
    else{var sa=Math.atan2(dy,dx)+Math.PI/2*(z.orb||1);cabMove(z,Math.cos(sa),Math.sin(sa),sp*0.6,dt);if(Math.random()<0.01)z.orb=-(z.orb||1);}
    z.cd-=dt*(p2?1.35:1);
    if(z.cd<=0){var r=Math.random();
      if(z.cloneCd<=0&&cabAlive("cabClone")<(p2?3:2)){z.st="clone_w";z.stT=0.8;cabSfx("cab_shatter",0.5);}
      else if(d<110&&z.blinkCd<=0){z.st="blink_w";z.stT=0.35;}
      else if(r<0.45){z.st="fan_w";z.stT=0.55;}
      else if(r<0.75){z.st="bliz_w";z.stT=0.7;cabSfx("cab_bliz",0.7);}
      else{z.st="rain_w";z.stT=0.5;}
    }
  }else if(z.st==="fan_w"){cabFace(z,Math.atan2(dy,dx));if(z.stT<=0){var n=p2?7:5,a0=Math.atan2(dy,dx),j;for(j=0;j<n;j++)cabShard(z.x,z.y-12,a0+(j-(n-1)/2)*0.2,185,z.damage);cabSfx("cab_shatter",0.5);z.st="rec";z.stT=0.4;z.fan2=p2?0.35:0;}}
  else if(z.st==="bliz_w"){if(z.stT<=0){var nz=p2?3:2,j2;CAB.zones.push({x:p.x,y:p.y,r:46,t:0,grow:0.6,life:5.5,dmg:Math.max(4,Math.round(z.damage*0.55))});
      for(j2=1;j2<nz;j2++){var s=cabSpotNear(p.x,p.y,70,170,20);if(s)CAB.zones.push({x:s.x,y:s.y,r:42,t:0,grow:0.6,life:5.5,dmg:Math.max(4,Math.round(z.damage*0.55))});}z.st="rec";z.stT=0.4;}}
  else if(z.st==="rain_w"){if(z.stT<=0){var nn=p2?5:3;cabIcicle(p.x,p.y,z.damage,1.0);for(var i2=1;i2<nn;i2++){var s3=cabSpotNear(p.x,p.y,30,110,10);if(s3)cabIcicle(s3.x,s3.y,z.damage,0.95+i2*0.12);}z.st="rec";z.stT=0.4;}}
  else if(z.st==="clone_w"){if(z.stT<=0){var nc=p2?2:2,c;for(c=0;c<nc;c++){var s4=cabSpotNear(z.x,z.y,70,160,14);if(s4){var cz=cabAdd("normal",s4.x,s4.y,"cabClone");cz.hp=cz.maxHp=Math.round(60*(1+game.wave*0.12));cz.speed*=0.7;CAB.fx.push({k:"blink",x:s4.x,y:s4.y,t:0,max:0.5});}}z.cloneCd=p2?8:11;z.st="rec";z.stT=0.4;}}
  else if(z.st==="blink_w"){if(z.stT<=0){var s5=cabSpotNear(p.x,p.y,140,220,z.r+4);if(s5){CAB.fx.push({k:"blink",x:z.x,y:z.y,t:0,max:0.5});z.x=s5.x;z.y=s5.y;CAB.fx.push({k:"blink",x:z.x,y:z.y,t:0,max:0.5});sfx("whoosh",0.6);}z.blinkCd=5;z.st="rec";z.stT=0.3;}}
  else if(z.st==="rec"){if(z.stT<=0){z.st="idle";z.cd=rand(1,1.7);}}
  if(z.fan2>0){z.fan2-=dt;if(z.fan2<=0){var a1=Math.atan2(p.y-z.y,p.x-z.x);for(var m=0;m<6;m++)cabShard(z.x,z.y-12,a1+(m-2.5)*0.22,170,z.damage);}}
}
function cabAiMamut(z,dt,p,dx,dy,d,p2){
  var sp=z.speed*(p2?1.2:1);
  if(z.st==="idle"){
    cabFace(z,Math.atan2(dy,dx));if(d>50)cabChase(z,sp,dt,dx,dy,d);
    z._fs=(z._fs||0)+sp*dt;if(z._fs>26){z._fs=0;sfx("foot_heavy",0.5);shake(1.5);}
    z.cd-=dt*(p2?1.3:1);
    if(z.cd<=0){var r=Math.random();
      if(d>90&&r<0.5){z.st="charge_w";z.stT=0.9;z.la=Math.atan2(dy,dx);cabSfx("cab_trumpet",0.8);}
      else if(d<130||r<0.75){z.st="stomp_w";z.stT=0.7;}
      else{z.st="rain_w";z.stT=0.6;cabSfx("cab_trumpet",0.6);}
    }
  }else if(z.st==="charge_w"){z.la=Math.atan2(dy,dx)*0.15+z.la*0.85;cabFace(z,z.la);if(z.stT<=0){z.st="charge";z.stT=1.5;z.bit=0;}}
  else if(z.st==="charge"){var spd=300*CFG.SPD*(p2?1.12:1),ox=z.x,oy=z.y;cabMove(z,Math.cos(z.la),Math.sin(z.la),spd,dt);var moved=dist(ox,oy,z.x,z.y);
    z._fs=(z._fs||0)+spd*dt;if(z._fs>30){z._fs=0;sfx("foot_heavy",0.6);shake(3);}
    if(Math.random()<0.7)addParticle(z.x,z.y,"#e1f5fe",0.4,rand(-30,30),rand(-40,-5),rand(3,6),3);
    if(!z.bit&&dist(z.x,z.y,p.x,p.y)<z.r+p.r+4){z.bit=1;hurtPlayer(p,Math.round(z.damage*1.6));shake(8);var pa=Math.atan2(p.y-z.y,p.x-z.x);moveWithSlide(p,Math.cos(pa)*24,Math.sin(pa)*24);}
    var ahead=sampleSDF(z.x+Math.cos(z.la)*(z.r+8),z.y+Math.sin(z.la)*(z.r+8))<3;
    if(moved<spd*dt*0.35||ahead||z.stT<=0){
      var wall=moved<spd*dt*0.35||ahead;z.st="rec";z.stT=wall?0.5:0.6;
      if(wall){z.stun=Math.max(z.stun||0,1.1);shake(12);cabSfx("cab_crack",0.9);sfx("stomp",0.8);floatText(z.x,z.y-z.h,"¡Aturdido!","#90caf9");
        for(var k=0;k<(p2?4:3);k++)cabCrack(z.x,z.y,z.la+Math.PI+rand(-1.1,1.1),rand(80,140),z.damage,0.5);}}}
  else if(z.st==="stomp_w"){if(z.stT<=0){cabRing(z.x,z.y,250,110,z.damage,"#b3e5fc");sfx("stomp",1);shake(10);cabSfx("cab_crack",0.7);
      var nk=p2?7:5,a0=Math.random()*6.283;for(var j=0;j<nk;j++)cabCrack(z.x,z.y,a0+j*6.283/nk,rand(110,170),z.damage,0.65);z.st="rec";z.stT=0.6;}}
  else if(z.st==="rain_w"){if(z.stT<=0){var nn=p2?6:4;cabIcicle(p.x,p.y,z.damage,1.0);for(var i2=1;i2<nn;i2++){var s3=cabSpotNear(p.x,p.y,30,120,10);if(s3)cabIcicle(s3.x,s3.y,z.damage,0.95+i2*0.1);}z.st="rec";z.stT=0.4;}}
  else if(z.st==="rec"){if(z.stT<=0){z.st="idle";z.cd=rand(1,1.8);}}
}
function cabAiRey(z,dt,p,dx,dy,d,p2){
  z.sumCd-=dt;
  if(z.st==="idle"){
    cabFace(z,Math.atan2(dy,dx));if(d>70)cabChase(z,z.speed*(p2?1.15:1),dt,dx,dy,d);
    z._fs=(z._fs||0)+z.speed*dt;if(z._fs>28){z._fs=0;sfx("foot_heavy",0.5);}
    z.cd-=dt*(p2?1.3:1);
    if(z.cd<=0){var r=Math.random();
      if(d<95&&r<0.45){z.st="slash_w";z.stT=0.6;z.la=Math.atan2(dy,dx);}
      else if(z.sumCd<=0&&cabAlive("cabAdd")<4){z.st="sum_w";z.stT=0.9;}
      else if(r<0.6){z.st="nova_w";z.stT=0.8;}
      else if(p2&&r<0.8){z.st="bliz_w";z.stT=0.6;cabSfx("cab_bliz",0.7);}
      else{z.st="rain_w";z.stT=0.5;}
    }
  }else if(z.st==="slash_w"){z.la=Math.atan2(dy,dx)*0.2+z.la*0.8;cabFace(z,z.la);if(z.stT<=0){CAB.fx.push({k:"slash",x:z.x,y:z.y,a:z.la,r:92,w:0.95,dmg:Math.round(z.damage*1.5),t:0});sfx("slash",0.9);shake(7);z.st="rec";z.stT=0.5;}}
  else if(z.st==="nova_w"){if(z.stT<=0){var n=p2?16:12,a0=Math.random(),j;for(j=0;j<n;j++)cabShard(z.x,z.y-10,a0+j*6.283/n,160,z.damage);if(p2)z.nova2=0.45;cabSfx("cab_shatter",0.8);shake(6);z.st="rec";z.stT=0.5;}}
  else if(z.st==="rain_w"){if(z.stT<=0){var nn=p2?7:5;cabIcicle(p.x,p.y,Math.round(z.damage*1.2),1.0);for(var i2=1;i2<nn;i2++){var s=cabSpotNear(p.x,p.y,30,120,10);if(s)cabIcicle(s.x,s.y,Math.round(z.damage*1.2),0.95+i2*0.1);}z.st="rec";z.stT=0.4;}}
  else if(z.st==="bliz_w"){if(z.stT<=0){CAB.zones.push({x:p.x,y:p.y,r:48,t:0,grow:0.6,life:5,dmg:Math.max(4,Math.round(z.damage*0.5))});var s3=cabSpotNear(p.x,p.y,80,160,20);if(s3)CAB.zones.push({x:s3.x,y:s3.y,r:44,t:0,grow:0.6,life:5,dmg:Math.max(4,Math.round(z.damage*0.5))});z.st="rec";z.stT=0.4;}}
  else if(z.st==="sum_w"){if(z.stT<=0){var types=["normal","fast","tank"],k;for(k=0;k<3;k++){var s4=cabSpotNear(z.x,z.y,60,170,14);if(s4)cabAdd(types[k],s4.x,s4.y,"cabMinion");}sfx("growl",0.8);z.sumCd=15;z.st="rec";z.stT=0.4;}}
  else if(z.st==="rec"){if(z.stT<=0){z.st="idle";z.cd=rand(0.9,1.7);}}
  if(z.nova2>0){z.nova2-=dt;if(z.nova2<=0){for(var m=0;m<16;m++)cabShard(z.x,z.y-10,0.2+m*6.283/16,150,z.damage);cabSfx("cab_shatter",0.6);}}
}
