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
