/* v20.2.1 — ROUND 10: portal to a lost hell planet, THANOS, mega-powers and "¡NIVEL 1 COMPLETADO!".
   After round 9 a portal opens on the island. Walking in loads a compact volcanic arena with its
   own painted ground, minimap and walk grid (HELL_DATA). Thanos arrives with a cinematic, the hero
   picks ONE mega-power from 3 pedestals, and the fight is Thanos alone (no zombies). */
var HELL={img:null,island:null,islandImg:null,building:0,active:0};
(function(){try{var im=new Image();im.onload=function(){HELL.img=im;if(HELL.active&&typeof ART!=="undefined"){ART.arena=im;if(map){map.chunks={};}}};im.src="assets/env/hell.webp?v=20.6";}catch(e){}})();
var GEMS={
  power:{c:"#18ffff",n:"IMPACTO"},space:{c:"#40c4ff",n:"VACÍO"},reality:{c:"#00e5c0",n:"ESPEJISMO"},
  soul:{c:"#64ffda",n:"ESPECTRO"},time:{c:"#80d8ff",n:"LETARGO"},mind:{c:"#a7ffeb",n:"ECO"}
};
var GEM_ORDER=["power","space","mind","reality","time","soul"];
var MEGA={
  hammer:{n:"MAZO DE TORMENTA",c:"#b388ff",c2:"#ede7f6",sub:"Golpe, lanzamiento y rayos"},
  armor:{n:"ARMADURA TITÁN",c:"#4fc3f7",c2:"#cfd8dc",sub:"Vuelo, propulsores y rayo del núcleo"},
  hulk:{n:"FURIA SALVAJE",c:"#ff8a3d",c2:"#ffe0b2",sub:"Puños, pisotón y salto"}
};
var _glowC={};
function glowSpr(col){
  if(_glowC[col])return _glowC[col];
  var c=document.createElement("canvas");c.width=c.height=64;var g=c.getContext("2d"),gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,"rgba(255,255,255,1)");gr.addColorStop(0.22,col);gr.addColorStop(0.55,hexA(col,0.35));gr.addColorStop(1,hexA(col,0));
  g.fillStyle=gr;g.fillRect(0,0,64,64);_glowC[col]=c;return c;
}
function hexA(h,a){var n=parseInt(h.slice(1),16);return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}
function hellBusy(){return game.particles&&game.particles.length>150;}
function hellPart(x,y,col,life,vx,vy,sz,k){if(hellBusy())return;addParticle(x,y,col,life,vx,vy,sz,k||3);}
/* v20.2.3: Thanos attack speeds follow the slower, more realistic movement pace */
function TMV(){return (typeof CFG!=="undefined"&&CFG.MOVE)||1;}
function smooth01(u){u=clamp(u,0,1);return u*u*(3-2*u);}
function hellSetView(w){
  if(layout.viewW===w)return;
  layout.viewW=w;layout.scale=layout.gameDrawW/layout.viewW;layout.viewH=layout.gameDrawH/(layout.scale*CFG.YSCALE);W=layout.viewW;H=layout.viewH;
}
/* v20.2.2: straight walkable line (no lava / pillar) so at least one snap circle is always reachable */
function hellClearPath(x0,y0,x1,y1){
  var d=dist(x0,y0,x1,y1),n=Math.max(2,Math.ceil(d/6)),k,x,y;
  for(k=1;k<n;k++){x=x0+(x1-x0)*k/n;y=y0+(y1-y0)*k/n;if(sampleType(x,y)!==0||sampleSDF(x,y)<9)return 0;}
  return 1;
}
function hellSpot(cx,cy,rmin,rmax,rad){
  var i,a,r,x,y;
  for(i=0;i<80;i++){a=Math.random()*6.283;r=rmin+Math.random()*(rmax-rmin);x=cx+Math.cos(a)*r;y=cy+Math.sin(a)*r;
    if(x<rad+8||y<rad+8||x>CFG.MAP_W-rad-8||y>CFG.MAP_H-rad-8)continue;
    if(sampleType(x,y)===0&&sampleSDF(x,y)>=rad)return{x:x,y:y};}
  return null;
}
/* ---------- island ⇄ hell map swap (island data untouched) ---------- */
var _hellBuildMap=buildMap;
buildMap=function(seed){
  if(!HELL.building){
    if(HELL.island)MAP_DATA=HELL.island;
    if(HELL.islandImg&&typeof ART!=="undefined")ART.arena=HELL.islandImg;
    HELL.active=0;
  }
  return _hellBuildMap(seed);
};
var _hellStartWave=startWave;
startWave=function(idx){
  if(idx===9&&!HELL.active&&game&&game.player){hellOpenPortal();return;}
  return _hellStartWave(idx);
};
var _hellOnWaveCleared=onWaveCleared;
onWaveCleared=function(){if(game&&(game.hellPortal||HELL.active))return;return _hellOnWaveCleared();};
var _hellStartGame=startGame;
startGame=function(){HELL.active=0;return _hellStartGame();};
var _hellTSM=terrainSpeedMul;
terrainSpeedMul=function(x,y){
  var m=_hellTSM(x,y),p=game&&game.player;
  if(HELL.active&&p&&x===p.x&&y===p.y){if(p.slowT>0)m*=0.5;if(p.beamT>0)m*=0.5;}
  return m;
};
var _hellHurtZombie=hurtZombie;
hurtZombie=function(z,dmg,fromX,noChain,opts){
  if(z&&z.isThanos){
    if(z.noHurt||z.ts==="dying")return;
    if(z.ts==="stun")dmg*=1.6;
    _hellHurtZombie(z,dmg,fromX,noChain,opts);
    if(!z.snapDone&&z.hp<=z.maxHp*0.16&&!z.dying){z.hp=Math.max(z.hp,z.maxHp*0.12);thanosStartSnap(z);}
    return;
  }
  return _hellHurtZombie(z,dmg,fromX,noChain,opts);
};
var _hellKillZombie=killZombie;
killZombie=function(z){if(z&&z.isThanos){thanosDie(z);return;}return _hellKillZombie(z);};
var _hellFireSuper=fireSuper;
fireSuper=function(p,ang){
  if(p&&p.mega){
    if(p.grabbed||(p.super||0)<superCost(p)||!game||game.state!=="playing"||p.leap)return;
    if(ang==null||!isFinite(ang))ang=autoSuperAng(p);
    p.super=0;p.facing=ang;p.aimAng=ang;if(p.faceAng!=null)p.faceAng=ang;
    if(typeof gfxHitStop==="function")gfxHitStop(0.06,"big");
    megaSuper(p,ang);return;
  }
  return _hellFireSuper(p,ang);
};
/* ---------- portal on the island ---------- */
function hellOpenPortal(){
  var p=game.player;
  game.wave=8;game.spawnQueue=[];game.zombies=[];game.bullets.length=0;game.projectiles.length=0;if(game.lasers)game.lasers.length=0;
  game.bossFight=0;game.boss=null;game.colossus=null;game.home=null;game.gorgon=null;game.portals=[];game.events=[];
  if(typeof clearFireFx==="function")clearFireFx();
  var s=(typeof gorgonSpot==="function"&&(gorgonSpot(p.x,p.y,80,130,26)||gorgonSpot(p.x,p.y,60,200,22)))||{x:p.x+70,y:p.y};
  game.hellPortal={x:s.x,y:s.y,t:0};
  game.graceT=1e9;game.state="playing";
  game.message="¡Se ha abierto un portal! Entra para la batalla final";game.messageTimer=4.5;
  sfx("portal",1);shake(6);startMusic("play");
}
function drawHellPortalAt(x,y,t,sz,col1,col2){
  var s=toScreen(x,y),sc=layout.scale,r=(sz||26)*sc,i,a;
  ctx.save();ctx.globalCompositeOperation="lighter";
  var gl=glowSpr(col1);ctx.globalAlpha=0.55+0.2*Math.sin(t*5);ctx.drawImage(gl,s.x-r*2.4,s.y-r*3.2,r*4.8,r*4.8);
  /* light pillar */
  var gr=ctx.createLinearGradient(0,s.y-r*4.2,0,s.y);gr.addColorStop(0,hexA(col1,0));gr.addColorStop(1,hexA(col1,0.42));
  ctx.fillStyle=gr;ctx.globalAlpha=1;ctx.fillRect(s.x-r*0.55,s.y-r*4.2,r*1.1,r*4.2);
  ctx.restore();
  ctx.save();ctx.translate(s.x,s.y-r*0.9);ctx.scale(1,1.25);
  var g2=ctx.createRadialGradient(0,0,r*0.1,0,0,r);g2.addColorStop(0,"rgba(10,0,20,0.95)");g2.addColorStop(0.55,hexA(col1,0.85));g2.addColorStop(0.85,hexA(col2,0.9));g2.addColorStop(1,hexA(col2,0));
  ctx.fillStyle=g2;ctx.beginPath();ctx.ellipse(0,0,r*0.78,r,0,0,7);ctx.fill();
  ctx.globalCompositeOperation="lighter";ctx.lineCap="round";
  for(i=0;i<5;i++){a=t*(2.4+i*0.3)+i*1.26;ctx.strokeStyle=hexA(i%2?col2:"#ffffff",0.75);ctx.lineWidth=(2.2-i*0.25)*sc;
    ctx.beginPath();ctx.ellipse(0,0,r*(0.25+i*0.13),r*(0.32+i*0.16),0,a,a+2.2);ctx.stroke();}
  ctx.restore();
  ctx.strokeStyle=hexA(col2,0.7);ctx.lineWidth=2*sc;ctx.beginPath();ctx.ellipse(s.x,s.y,r*0.9,r*0.9*CFG.YSCALE*0.6,0,0,7);ctx.stroke();
}
function drawPortalArrow(x,y,col){
  var s=toScreen(x,y),t=game.time||0,sc=layout.scale;
  var on=s.x>30&&s.x<SW-30&&s.y>40&&s.y<SH-30;
  ctx.save();
  if(on){var by=s.y-62*sc-Math.abs(Math.sin(t*4))*10;
    ctx.translate(s.x,by);ctx.fillStyle=col;ctx.strokeStyle="#1a140c";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(0,14);ctx.lineTo(-13,-2);ctx.lineTo(-5,-2);ctx.lineTo(-5,-16);ctx.lineTo(5,-16);ctx.lineTo(5,-2);ctx.lineTo(13,-2);ctx.closePath();ctx.stroke();ctx.fill();
  }else{
    var cx=SW/2,cy=SH/2,a=Math.atan2(s.y-cy,s.x-cx),ex=clamp(s.x,34,SW-34),ey=clamp(s.y,50,SH-34);
    ctx.translate(ex,ey);ctx.rotate(a);ctx.fillStyle=col;ctx.strokeStyle="#1a140c";ctx.lineWidth=3;ctx.globalAlpha=0.8+0.2*Math.sin(t*6);
    ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-8,-13);ctx.lineTo(-3,0);ctx.lineTo(-8,13);ctx.closePath();ctx.stroke();ctx.fill();
  }
  ctx.restore();
}
/* ---------- entering the hell arena ---------- */
function hellEnter(){
  var p=game.player,D=HELL_DATA;
  if(!HELL.island)HELL.island=MAP_DATA;
  if(!HELL.islandImg&&typeof ART!=="undefined")HELL.islandImg=ART.arena;
  HELL.building=1;MAP_DATA=D;if(HELL.img&&typeof ART!=="undefined")ART.arena=HELL.img;
  buildMap(10);HELL.building=0;HELL.active=1;map.isHell=1;map.chunks={};
  game.hellPortal=null;game.wave=9;game.events=[];game.spawnQueue=[];game.zombies=[];game.bullets.length=0;game.projectiles.length=0;game.grenades.length=0;
  if(game.lasers)game.lasers.length=0;if(game.bolts)game.bolts.length=0;game.portals=[];game.particles.length=0;
  if(typeof stopTruenoLaser==="function")stopTruenoLaser(p);if(typeof stopGigante==="function"&&p.giantT>0)stopGigante(p);if(typeof stopCombatLoops==="function")stopCombatLoops();
  p.x=D.start.x;p.y=D.start.y;p.vx=p.vy=0;p.dashT=0;p.knockT=0;p.throwT=0;p.grabbed=0;p.laserT=0;p.aimAng=-1.57;p.facing=-1.57;p.faceAng=-1.57;
  var z=spawnThanos(D.thanos.x,D.thanos.y);
  game.zombies.push(z);game.boss=z;game.bossSpawned=1;game.bossFight=1;game.graceT=1e9;
  game.hell={t:0,phase:"cine",peds:D.pedestals.map(function(q,i){return{x:q.x,y:q.y,id:["hammer","armor","hulk"][i],prog:0,gone:0};}),
    rings:[],orbs:[],clones:[],zones:[],safe:[],bolts:[],shots:[],hammer:null,beam:null,flash:0,fx:[],embers:[],debris:[],exit:null,glove:null,won:0,clock:[]};
  var i;for(i=0;i<34;i++)game.hell.embers.push({x:Math.random(),y:Math.random(),v:0.04+Math.random()*0.08,s:1+Math.random()*2.2,ph:Math.random()*6});
  var deb=[[40,60],[600,70],[30,300],[610,250],[90,470],[560,470],[320,20],[200,495]];
  for(i=0;i<deb.length;i++)game.hell.debris.push({x:deb[i][0],y:deb[i][1],s:6+((i*7)%5)*2,ph:i*1.3});
  game.camX=z.x;game.camY=z.y-60;
  updateFlow(p.x,p.y);
  HELL.cineT=0;HELL.musicOn=0;HELL.voice=null;game.state="hell_cine";
  stopMusic();
}
function spawnThanos(x,y){
  var z=spawnZombie("boss",x,y,9);
  z.isBoss=1;z.isThanos=1;z.bName="VORGATH";
  z.hp=z.maxHp=7800;z.r=22*CFG.CHAR;z.h=64*CFG.CHAR;z.speed=66*CFG.SPD;z.damage=16;z.score=5000;z.xp=900;
  z.look={kind:"thanos",type:"boss",pose:"walk"};z.phase="fight";z.introT=0;z.spawnT=0;
  z.ts="idle";z.tt=0;z.cd=1.6;z.gemI=0;z.queue=[];z.p2=0;z.snapDone=0;z.healed=0;z.ghost=1;z.rings=[];z.glow=0.4;z.alpha=0;
  return z;
}
/* ---------- custom states: transition, cinematic, level complete ---------- */
function hellPreUpdate(dt){
  var st=game.state,p=game.player;
  if(st==="hell_trans"){
    var T=(HELL.transT+=dt),P=HELL.transP;
    var k=1-Math.exp(-8*dt);game.camX+=(P.x-game.camX)*k;game.camY+=(P.y-18-game.camY)*k;
    hellSetView((layout.baseViewW||380)*(1-0.42*smooth01(T/1.0)));
    p.x+=(P.x-p.x)*Math.min(1,4*dt);p.y+=(P.y-p.y)*Math.min(1,4*dt);
    if(Math.random()<0.7)hellPart(P.x+rand(-30,30),P.y+rand(-20,10),Math.random()<0.5?"#18ffff":"#e0f7fa",0.6,(P.x-p.x)*2,rand(-60,-20),rand(2,4),3);
    if(typeof updateFX==="function")updateFX(dt);
    if(T>=1.05){
      hellSetView(layout.baseViewW||380);
      if(HELL.transKind==="in")hellEnter();else hellLevelDone();
    }
    return 1;
  }
  if(st==="hell_cine"){hellCineUpdate(dt);return 1;}
  if(st==="hell_final"){hellFinalUpdate(dt);return 1;}
  if(st==="level_done"){game.hell&&(game.hell.t+=dt);updateFX(dt);return 1;}
  return 0;
}
function hellStartTrans(kind,x,y){
  HELL.transKind=kind;HELL.transT=0;HELL.transP={x:x,y:y};game.state="hell_trans";
  sfx("portal",1);sfx("whoosh",0.9);shake(5);
}
function hellPlayVoice(){
  try{
    if(!audio.ctx||audio.mutedSfx||!audio.sfxBuf||!audio.sfxBuf.thanos_voice)return;
    var src=audio.ctx.createBufferSource(),g=audio.ctx.createGain();src.buffer=audio.sfxBuf.thanos_voice;g.gain.value=1.25;
    src.connect(g);g.connect(audio.sfxG||audio.master);src.start();HELL.voice=src;
  }catch(e){}
}
function hellCineEnd(){
  var p=game.player,z=game.boss;
  if(HELL.voice){try{HELL.voice.stop();}catch(e){}HELL.voice=null;}
  if(!HELL.musicOn){HELL.musicOn=1;startMusic("thanos");}
  if(z){z.alpha=1;z.look.pose="walk";z.ts="idle";}
  game.hell.phase="pick";game.state="playing";hellSetView(layout.baseViewW||380);
  game.camX=p.x;game.camY=p.y-30;
  game.message="Elige UN megapoder: pisa un pedestal";game.messageTimer=4;
  p.invuln=Math.max(p.invuln,1);
}
function hellCineUpdate(dt){
  var z=game.boss,p=game.player,T=(HELL.cineT+=dt),h=game.hell,base=layout.baseViewW||380;
  h.t+=dt;
  if(!z){hellCineEnd();return;}
  if(!HELL._boom1&&T>0.05){HELL._boom1=1;sfx("thanos_boom",1);shake(10);}
  z.alpha=clamp((T-0.25)/0.9,0,1);
  if(T<1.0&&Math.random()<0.8)hellPart(z.x+rand(-26,26),z.y+rand(-10,8),Math.random()<0.5?"#b388ff":"#4a148c",0.7,rand(-30,30),rand(-90,-30),rand(3,6),3);
  z.look.pose=(T>1.1&&T<3.75)?"cast":(T>=3.75&&T<4.5)?"snap":"walk";
  z.glow=T<1.1?0.3:T<3.75?0.6+0.4*smooth01((T-1.1)/2.4):1.3;
  z.aimAng=Math.PI/2;
  if(!HELL._said&&T>2.0){HELL._said=1;hellPlayVoice();}
  if(!HELL.musicOn&&T>3.55){HELL.musicOn=1;startMusic("thanos");sfx("thanos_boom",0.9);shake(14);h.flash=0.35;
    for(var i=0;i<16;i++){var gk=GEM_ORDER[i%6];hellPart(z.x+rand(-10,10),z.y-40,GEMS[gk].c,0.9,rand(-120,120),rand(-120,40),rand(3,5),3);}}
  var drop=62+26*smooth01((T-0.9)/1.0),tx,ty,vw,u;
  if(T<4.3){u=smooth01(T/4.0);tx=z.x;ty=z.y-drop+8*(1-u);vw=base*(0.68-0.18*u);}
  else{u=smooth01((T-4.3)/1.4);var mx=(p.x+z.x)/2,my=p.y-50;tx=z.x+(mx-z.x)*u;ty=(z.y-drop)+(my-(z.y-drop))*u;vw=base*(0.5+0.5*u);}
  hellSetView(vw);
  var k=T<0.05?1:1-Math.exp(-9*dt);
  game.camX+=(tx-game.camX)*k;game.camY+=(ty-game.camY)*k;
  var hw=worldW()*0.5,hh=worldH()*0.5;
  game.camX=clamp(game.camX,hw+4,CFG.MAP_W-hw-4);game.camY=clamp(game.camY,hh+4,CFG.MAP_H-hh-4);
  if(game.shake>0){game.camX+=(Math.random()-0.5)*game.shake;game.camY+=(Math.random()-0.5)*game.shake;}
  if(h.flash>0)h.flash-=dt;
  updateFX(dt);
  if(T>=5.75)hellCineEnd();
}
function hellSkipTap(){
  if(game&&game.state==="hell_cine"&&HELL.cineT>1){HELL._said=1;hellCineEnd();return 1;}
  return 0;
}
document.addEventListener("pointerdown",function(e){try{if(game&&game.state==="hell_cine")hellSkipTap();else if(game&&game.state==="hell_final"){hellFinalSkip();e.stopPropagation();}}catch(err){}},true);
/* ---------- per-frame gameplay in the island (portal) and hell ---------- */
function hellTick(dt){
  var p=game.player,h=game.hell;
  if(game.hellPortal){
    var hp=game.hellPortal;hp.t+=dt;
    if(Math.random()<0.5)hellPart(hp.x+rand(-18,18),hp.y+rand(-8,4),Math.random()<0.5?"#18ffff":"#e0f7fa",0.8,rand(-10,10),rand(-70,-30),rand(2,4),3);
    if(hp.t>0.8&&dist(p.x,p.y,hp.x,hp.y)<20)hellStartTrans("in",hp.x,hp.y);
    return;
  }
  if(!HELL.active||!h)return;
  h.t+=dt;if(h.flash>0)h.flash-=dt;
  if(p.slowT>0)p.slowT-=dt;
  if(h.phase==="pick")hellPickTick(p,dt);
  if(h.transformT>0){h.transformT-=dt;if(h.transformT<=0)hellFightStart();}
  hellAttacksTick(p,dt);
  if(h.glove){
    var gv=h.glove;gv.t+=dt;
    if(gv.t>0.6&&Math.random()<0.45)hellPart(gv.x+rand(-10,10),gv.y+rand(-6,3),GEMS[GEM_ORDER[(Math.random()*6)|0]].c,0.8,rand(-10,10),rand(-60,-25),rand(2,3.5),3);
    if(gv.t>0.8&&dist(p.x,p.y,gv.x,gv.y)<20)hellFinalStart();
  }
}
function hellPickTick(p,dt){
  var h=game.hell,i,q,best=null;
  for(i=0;i<h.peds.length;i++){q=h.peds[i];if(q.gone)continue;
    if(dist(p.x,p.y,q.x,q.y)<20){q.prog+=dt/0.55;best=q;}else q.prog=Math.max(0,q.prog-dt*2);
    if(q.prog>=1){megaPick(p,q.id);return;}}
}
function megaPick(p,id){
  var h=game.hell,i,q,M=MEGA[id];
  p.mega=id;p.megaCd=0.4;p.megaN=0;p.leapCd=0;p.flyCd=0;h.phase="transform";h.transformT=1.3;h.flash=0.4;
  for(i=0;i<h.peds.length;i++){q=h.peds[i];q.gone=1;if(q.id!==id)continue;for(var k=0;k<6;k++)hellPart(q.x+rand(-10,10),q.y+rand(-6,6),MEGA[q.id].c,0.6,rand(-50,50),rand(-110,-30),rand(3,5),3);}
  for(i=0;i<16;i++)hellPart(p.x,p.y,i%2?M.c:M.c2,0.8,rand(-130,130),rand(-160,10),rand(3,5),3);
  shake(12);sfx("thanos_boom",0.8);sfx(id==="hammer"?"storm":id==="armor"?"laser_loop":"stomp",0.9);
  if(id==="hammer"){p.megaDmg=1;}
  if(id==="armor"){p.armorMul=(p.armorMul||1)*0.55;p.speedMul=(p.speedMul||1)*1.12;p.maxHp=Math.round(p.maxHp*1.3);}
  if(id==="hulk"){p.maxHp=Math.round(p.maxHp*2.2);p.r=CFG.PLAYER_R*1.18;p.armorMul=(p.armorMul||1)*0.85;p.look._artScale=1.34;p.look.tint="hulk";}
  p.hp=p.maxHp;p.super=CFG.SUPER_COST*0.5;
  game.banner=null;game.message=M.n+" — "+M.sub;game.messageTimer=3.2;
  p.invuln=Math.max(p.invuln,1.5);
}
function hellFightStart(){
  var z=game.boss,h=game.hell;if(!z)return;
  h.phase="fight";z.ghost=0;z.ts="walk";z.cd=1.4;
  floatText(z.x,z.y-70,"Veamos de qué eres capaz","#e1bee7");sfx("thanos_boom",0.7);
}
/* ---------- THANOS AI ---------- */
function thanosGemNext(z){
  if(z.queue.length)return z.queue.shift();
  if(z.p2&&Math.random()<0.55){
    var combos=[["space","power"],["mind","reality"],["time","soul"],["power","mind"],["space","time"]],c=combos[(Math.random()*combos.length)|0];
    z.queue=c.slice(1);z.combo=1;return c[0];
  }
  z.combo=0;var g=GEM_ORDER[z.gemI%6];z.gemI++;return g;
}
function thanosWind(z,g){
  var p=game.player,h=game.hell,f=z.p2?0.78:1;
  z.gem=g;z.ts="wind";z.look.pose="cast";z.tele=1;sfx("growl",0.5);
  if(g==="power"){z.tt=1.0*f;z.ringG=ringGaps(3);z.ringG2=z.ringG.map(function(a){return a+Math.PI/3;});}
  else if(g==="space"){z.tt=0.65*f;var sp=hellSpot(p.x+(p.vx||0)*0.3,p.y+(p.vy||0)*0.3,32,52,z.r+4)||hellSpot(p.x,p.y,30,90,z.r)||{x:z.x,y:z.y};z.tx=sp.x;z.ty=sp.y;}
  else if(g==="reality")z.tt=0.8*f;
  else if(g==="soul")z.tt=0.9*f;
  else if(g==="time"){z.tt=0.95*f/TMV();z.ttMax=z.tt;z.cx=p.x;z.cy=p.y;}
  else if(g==="mind")z.tt=0.75*f;
  if(z.combo)z.tt*=0.9;z.ttMax=z.tt;z.windFx=0;
}
function thanosAct(z,g){
  var p=game.player,h=game.hell,i,n,a,sp,M=z.p2;
  z.tele=0;z.look.pose="snap";z.poseT=0.35;
  var col=GEMS[g].c;
  for(i=0;i<8;i++)hellPart(z.x+rand(-8,8),z.y-46,col,0.6,rand(-90,90),rand(-90,10),rand(3,5),3);
  floatText(z.x,z.y-78,GEMS[g].n,col);
  if(g==="power"){
    h.rings.push({x:z.x,y:z.y,r:14,vr:240*TMV(),life:0.95/TMV(),dmg:M?20:16,col:col,gaps:z.ringG||ringGaps(3)});
    if(M)h.rings.push({x:z.x,y:z.y,r:14,vr:240*TMV(),life:0.95/TMV(),dmg:16,col:col,delay:0.55,gaps:z.ringG2||ringGaps(3)});
    h.fx.push({k:"burst",x:z.x,y:z.y,t:0.45,max:0.45,col:col});
    sfx("thanos_boom",0.8);shake(12);z.ts="recover";z.tt=0.55;
  }else if(g==="space"){
    for(i=0;i<10;i++)hellPart(z.x+rand(-14,14),z.y+rand(-30,0),col,0.5,rand(-40,40),rand(-60,0),rand(3,5),3);
    h.fx.push({k:"rift",x:z.x,y:z.y,t:0.5,max:0.5,col:col});
    z.x=z.tx;z.y=z.ty;resolveCircle(z);sfx("portal",0.9);h.fx.push({k:"rift",x:z.x,y:z.y,t:0.55,max:0.55,col:col});
    for(i=0;i<10;i++)hellPart(z.x+rand(-14,14),z.y+rand(-30,0),col,0.5,rand(-40,40),rand(-60,0),rand(3,5),3);
    z.ts="punch_wind";z.tt=(M?0.42:0.52)/TMV();z.ttMax=z.tt;z.lockA=Math.atan2(p.y-z.y,p.x-z.x);z.look.pose="walk";
  }else if(g==="reality"){
    n=M?3:2;
    for(i=0;i<n;i++){sp=hellSpot(p.x,p.y,110,170,z.r);if(sp){h.clones.push({x:sp.x,y:sp.y,t:0,fire:0.9+i*0.35,life:2.8,shot:0});h.fx.push({k:"rift",x:sp.x,y:sp.y,t:0.5,max:0.5,col:col});}}
    for(i=0;i<(M?3:2);i++){sp=hellSpot(p.x,p.y,48,130,14);if(sp)h.zones.push({x:sp.x,y:sp.y,r:28,t:0,arm:1.1,life:3.8,col:col});}
    sfx("portal",0.7);z.ts="recover";z.tt=0.5;
  }else if(g==="soul"){
    z.ts="soul";z.tt=M?1.9:1.5;z.healSoul=0;sfx("growl",0.8);z.look.pose="cast";
  }else if(g==="time"){
    h.clock.push({x:z.cx,y:z.cy,t:0.5});
    if(dist(p.x,p.y,z.cx,z.cy)<62&&!(p.dashT>0)&&!p.leap){
      p.slowT=2.4;floatText(p.x,p.y-30,"¡RALENTIZADO!","#69f0ae");
      var heal=Math.min(z.maxHp*0.03,z.maxHp*0.09-z.healed);
      if(heal>0){z.hp=Math.min(z.maxHp,z.hp+heal);z.healed+=heal;floatText(z.x,z.y-60,"+"+Math.round(heal)+" REBOBINA","#69f0ae");}
    }
    sfx("zap",0.8);z.ts="recover";z.tt=0.5;
  }else if(g==="mind"){
    n=M?5:3;
    for(i=0;i<n;i++){a=Math.atan2(p.y-z.y,p.x-z.x)+(i-(n-1)/2)*0.55;h.orbs.push({x:z.x+Math.cos(a)*16,y:z.y+Math.sin(a)*10,vx:Math.cos(a)*145*TMV(),vy:Math.sin(a)*145*TMV(),life:2.9,dmg:12,col:col,home:1.45,r:6,trail:[]});}
    sfx("zap",0.9);z.ts="recover";z.tt=0.45;
  }
}
function thanosStartSnap(z){
  var h=game.hell,p=game.player,i,sp,tries;
  z.snapDone=1;z.noHurt=1;z.ts="snap_wind";z.tt=4.0;z.look.pose="cast";z.tele=0;z.queue=[];
  h.orbs.length=0;h.clones.length=0;h.zones.length=0;h.rings.length=0;
  h.safe=[];
  for(i=0;i<3;i++){
    sp=null;for(tries=0;tries<30&&!sp;tries++){var c=hellSpot(p.x,p.y,90,200,30);if(c&&(tries>24||hellClearPath(p.x,p.y,c.x,c.y))&&h.safe.every(function(s){return dist(s.x,s.y,c.x,c.y)>80;})&&dist(c.x,c.y,z.x,z.y)>60)sp=c;}
    if(!sp)sp=hellSpot(p.x,p.y,40,240,26);if(sp)h.safe.push({x:sp.x,y:sp.y,r:30});
  }
  sfx("thanos_boom",1);shake(10);game.message=null;
  floatText(z.x,z.y-80,"Chasquido...","#ffd54f");
}
function thanosSnapFire(z){
  var h=game.hell,p=game.player,safe=h.safe.some(function(s){return dist(p.x,p.y,s.x,s.y)<s.r+p.r*0.5;});
  z.look.pose="snap";z.poseT=1.2;h.flash=0.5;shake(22);sfx("thanos_boom",1);sfx("explode",1);
  if(!safe){p.invuln=0;hurtPlayer(p,p.maxHp*0.55/(p.armorMul||1));floatText(p.x,p.y-30,"¡CHASQUIDO!","#ffd54f");}
  else floatText(p.x,p.y-30,"¡A SALVO!","#fff59d");
  h.safe=[];z.ts="stun";z.tt=3.2;z.noHurt=0;
  floatText(z.x,z.y-80,"¡¿Imposible?!","#e1bee7");
}
function thanosDie(z){
  var h=game.hell;
  if(z.ts==="dying")return;
  if(!z.snapDone){z.hp=z.maxHp*0.12;z.dying=0;thanosStartSnap(z);return;}
  z.ts="dying";z.tt=3.4;z.noHurt=1;z.hp=0;z.tele=0;z.dyingT=0;h.won=1;
  h.orbs.length=0;h.clones.length=0;h.zones.length=0;h.rings.length=0;h.safe=[];h.beam=null;
  game.kills++;game.score+=z.score;try{grantRunXP(game.player,z.xp);}catch(e){}
  sfx("thanos_boom",1);shake(20);h.flash=0.6;stopMusic();
  floatText(z.x,z.y-80,"No... puede... ser...","#e1bee7");
}
function updateThanos(z,dt){
  var p=game.player,h=game.hell,dx=p.x-z.x,dy=p.y-z.y,d=Math.sqrt(dx*dx+dy*dy)||1,i;
  if(z.hitFlash>0)z.hitFlash-=dt;
  if(z.poseT>0){z.poseT-=dt;if(z.poseT<=0&&z.ts!=="wind"&&z.ts!=="soul"&&z.ts!=="snap_wind")z.look.pose="walk";}
  z.anim=(z.anim||0)+dt*(z.ts==="walk"?5:1.5);
  if(!h)return;
  if(z.noHurt&&z.ts!=="dying"&&z.hp<z.maxHp*0.1)z.hp=z.maxHp*0.1;
  if(z.ts==="idle"){z.aimAng=Math.atan2(dy,dx);z.glow=0.7;return;}
  if(z.ts==="dying"){
    z.tt-=dt;z.dyingT+=dt;
    if(Math.random()<0.9)hellPart(z.x+rand(-18,18),z.y-rand(0,60),Math.random()<0.6?"#3e2723":"#6d4c41",1.0,rand(-20,40),rand(-70,-20),rand(3,6),3);
    if(z.dyingT>0.4&&!z.gemsOut){z.gemsOut=1;for(i=0;i<6;i++){var g=GEM_ORDER[i];hellPart(z.x,z.y-46,GEMS[g].c,1.4,Math.cos(i*1.05)*110,Math.sin(i*1.05)*70-80,6,3);}sfx("zap",1);}
    if(z.tt<=0){z.dead=1;z.dying=0;game.boss=null;game.bossFight=0;hellDropGlove(z.x,z.y);}
    return;
  }
  z.glow=z.tele?1.1:z.p2?0.9:0.6;
  if(!z.p2&&z.hp<=z.maxHp*0.55&&z.ts==="walk"){
    z.p2=1;z.speed*=1.18;z.ts="recover";z.tt=1.0;z.look.pose="cast";z.poseT=1.0;
    floatText(z.x,z.y-80,"FASE 2","#ff1744");sfx("thanos_boom",0.9);sfx("sting");shake(14);h.flash=0.25;
    h.rings.push({x:z.x,y:z.y,r:14,vr:200*TMV(),life:0.8/TMV(),dmg:10,col:"#ffffff",delay:0.6,gaps:ringGaps(4)});
    return;
  }
  z.tt-=dt;
  switch(z.ts){
  case "walk":
    z.cd-=dt;z.aimAng=Math.atan2(dy,dx);
    if(z.cd<=0){thanosWind(z,thanosGemNext(z));return;}
    if(d>78){
      var sp=z.speed*(z.slow>0?0.6:1),ax=dx/d,ay=dy/d;
      if(typeof chaseDir==="function"&&map.flowBoss){var cg=chaseDir(z,dx,dy,d);if(cg){ax=cg.x;ay=cg.y;}}
      moveWithSlide(z,ax*sp*dt,ay*sp*dt);
    }
    if(d<z.r+p.r+2)hurtPlayer(p,Math.round(z.damage*0.8));
    break;
  case "wind":
    z.aimAng=Math.atan2(dy,dx);
    if(z.gem==="soul"&&Math.random()<0.5)hellPart(p.x,p.y-10,"#ff9a1f",0.4,rand(-20,20),rand(-40,0),3,3);
    if(Math.random()<0.55){var ga=Math.random()*6.283,gd=rand(26,44);hellPart(z.x+Math.cos(ga)*gd,z.y-40+Math.sin(ga)*gd*0.6,GEMS[z.gem].c,0.35,-Math.cos(ga)*gd*2.6,-Math.sin(ga)*gd*1.6,rand(2,3.5),3);}
    if(z.tt<=0)thanosAct(z,z.gem);
    break;
  case "punch_wind":
    z.aimAng=z.lockA=Math.atan2(dy,dx);
    if(z.tt<=0){
      z.look.pose="snap";z.poseT=0.3;sfx("melee",1);shake(8);
      if(d<48+p.r*0.4&&!(p.dashT>0)&&!p.leap)hurtPlayer(p,z.p2?24:20);
      megaRing(z.x+Math.cos(z.lockA)*20,z.y+Math.sin(z.lockA)*14,8,240,0.3,"#4d8dff");h.fx.push({k:"burst",x:z.x+Math.cos(z.lockA)*24,y:z.y+Math.sin(z.lockA)*16,t:0.3,max:0.3,col:"#4d8dff"});
      for(i=0;i<6;i++)hellPart(z.x+Math.cos(z.lockA)*30,z.y+Math.sin(z.lockA)*20,"#4d8dff",0.4,rand(-80,80),rand(-80,20),rand(3,5),3);
      z.ts="recover";z.tt=0.5;
    }
    break;
  case "soul":
    z.aimAng=Math.atan2(dy,dx);
    z.soulHold=d<THANOS_SOUL_R&&!(p.dashT>0)&&!p.leap;
    if(z.soulHold){
      var pull=(z.p2?120:100)*TMV()*dt*(d<z.r+p.r+14?0:1);moveWithSlide(p,-dx/d*pull,-dy/d*pull);
      p.hp-=(z.p2?6:4.5)*(p.armorMul||1)*dt;if(p.hp<1)p.hp=1;
      var hl=Math.min(30*dt,z.maxHp*0.02-z.healSoul);if(hl>0){z.hp=Math.min(z.maxHp,z.hp+hl);z.healSoul+=hl;}
      if(Math.random()<0.6)hellPart(p.x,p.y-12,"#ff9a1f",0.5,-dx/d*120,-dy/d*120-20,3,3);
    }
    if(z.tt<=0){z.ts="recover";z.tt=0.45;z.look.pose="walk";}
    break;
  case "recover":
    if(z.tt<=0){
      if(z.queue.length){thanosWind(z,thanosGemNext(z));return;}
      z.ts="walk";z.cd=z.p2?0.85:1.35;z.look.pose="walk";
    }
    break;
  case "snap_wind":
    z.aimAng=Math.atan2(dy,dx);z.glow=1.4;
    var cx=HELL_DATA.center.x,cy=HELL_DATA.center.y;
    if(Math.random()<0.6)hellPart(z.x+rand(-10,10),z.y-48,GEMS[GEM_ORDER[(Math.random()*6)|0]].c,0.5,rand(-50,50),rand(-60,10),rand(2,4),3);
    if(z.tt<=0)thanosSnapFire(z);
    break;
  case "stun":
    z.glow=0.2;
    if(Math.random()<0.2)hellPart(z.x+rand(-10,10),z.y-60,"#fff59d",0.6,rand(-20,20),rand(-40,-10),2,3);
    if(z.tt<=0){z.ts="walk";z.cd=0.6;}
    break;
  }
}
/* ---------- Thanos attack objects ---------- */
function ringGap(o,p){
  if(!o.gaps)return 0;var a=Math.atan2(p.y-o.y,p.x-o.x),i,da;
  for(i=0;i<o.gaps.length;i++){da=Math.atan2(Math.sin(a-o.gaps[i]),Math.cos(a-o.gaps[i]));if(Math.abs(da)<0.36)return 1;}return 0;
}
var THANOS_SOUL_R=230;
function ringGaps(n){var b=Math.random()*6.283,g=[],i;for(i=0;i<n;i++)g.push(b+i*6.283/n);return g;}
function drawGapRing(o,col){
  var s=toScreen(o.x,o.y),sc=layout.scale,i,a0,a1,gs=o.gaps.slice().sort(function(a,b){return a-b;});
  ctx.strokeStyle=col;ctx.lineWidth=5*sc;ctx.lineCap="round";
  for(i=0;i<gs.length;i++){a0=gs[i]+0.36;a1=(i+1<gs.length?gs[i+1]:gs[0]+6.283)-0.36;ctx.beginPath();ctx.ellipse(s.x,s.y,o.r*sc,o.r*CFG.YSCALE*sc,0,a0,a1);ctx.stroke();}
}
function hellAttacksTick(p,dt){
  var h=game.hell,i,o,d,dx,dy,l,z=game.boss;
  var dodge=(p.dashT>0)||p.leap||(p.airH||0)>8;
  for(i=h.rings.length-1;i>=0;i--){o=h.rings[i];
    if(o.delay>0){o.delay-=dt;continue;}
    o.r+=o.vr*dt;o.life-=dt;d=dist(p.x,p.y,o.x,o.y);
    if(!o.hit&&Math.abs(d-o.r)<12&&!dodge&&!ringGap(o,p)){hurtPlayer(p,o.dmg);o.hit=1;}
    if(o.life<=0)h.rings.splice(i,1);}
  for(i=h.orbs.length-1;i>=0;i--){o=h.orbs[i];o.life-=dt;
    dx=p.x-o.x;dy=p.y-o.y;l=Math.sqrt(dx*dx+dy*dy)||1;
    var sp=Math.sqrt(o.vx*o.vx+o.vy*o.vy)||1,ca=Math.atan2(o.vy,o.vx),ta=Math.atan2(dy,dx),da=Math.atan2(Math.sin(ta-ca),Math.cos(ta-ca));
    ca+=clamp(da,-o.home*dt,o.home*dt);o.vx=Math.cos(ca)*sp;o.vy=Math.sin(ca)*sp;o.x+=o.vx*dt;o.y+=o.vy*dt;
    if(o.trail){o.trail.push(o.x,o.y);if(o.trail.length>12)o.trail.splice(0,2);}else if(Math.random()<0.4)hellPart(o.x,o.y,o.col,0.3,0,-10,2.5,3);
    if(l<o.r+p.r&&!dodge){hurtPlayer(p,o.dmg);o.life=0;for(var k=0;k<5;k++)hellPart(o.x,o.y,o.col,0.4,rand(-60,60),rand(-60,20),3,3);}
    if(o.life<=0||sampleType(o.x,o.y)===2)h.orbs.splice(i,1);}
  for(i=h.clones.length-1;i>=0;i--){o=h.clones[i];o.t+=dt;
    if(!o.shot&&o.t>=o.fire){o.shot=1;var a=Math.atan2(p.y-o.y,p.x-o.x);h.orbs.push({x:o.x,y:o.y-10,vx:Math.cos(a)*135*TMV(),vy:Math.sin(a)*135*TMV(),life:3,dmg:12,col:"#ff2d4a",home:0.9,r:7});sfx("zap",0.5);}
    if(o.t>=o.life)h.clones.splice(i,1);}
  for(i=h.zones.length-1;i>=0;i--){o=h.zones[i];o.t+=dt;
    if(o.t>o.arm&&dist(p.x,p.y,o.x,o.y)<o.r&&!dodge){p.hp-=9*(p.armorMul||1)*dt;p.flash=0.05;if(p.hp<=0){p.hp=0;hurtPlayer(p,1);}}
    if(o.t>=o.life)h.zones.splice(i,1);}
  for(i=h.clock.length-1;i>=0;i--){h.clock[i].t-=dt;if(h.clock[i].t<=0)h.clock.splice(i,1);}
  for(i=h.fx.length-1;i>=0;i--){o=h.fx[i];o.t-=dt;if(o.vr)o.r+=o.vr*dt;if(o.t<=0)h.fx.splice(i,1);}
  if(p.mega)megaTick(p,dt);
}
/* ---------- MEGA-POWERS ---------- */
function megaDm(p){return 0.8+0.2*(p.damageMul||1);}
function megaTarget(){var z=game.boss;return z&&!z.dead&&!z.ghost&&z.ts!=="dying"?z:null;}
function megaHit(z,dmg,col){if(!z)return;hurtZombie(z,dmg,game.player.x,1,{noCrit:1});if(col)for(var i=0;i<4;i++)hellPart(z.x+rand(-10,10),z.y-rand(10,40),col,0.4,rand(-90,90),rand(-90,10),rand(2,4),3);}
function megaRing(x,y,r,vr,t,col){game.hell.fx.push({k:"ring",x:x,y:y,r:r,vr:vr,t:t,max:t,col:col});}
function megaBolt(x,y,dmg){
  var h=game.hell;h.fx.push({k:"bolt",x:x,y:y,t:0.32,max:0.32,seed:Math.random()*99});
  var z=megaTarget();if(z&&dist(z.x,z.y,x,y)<z.r+34)megaHit(z,dmg,"#e3f2fd");
  sfx("zap",1);shake(6);megaRing(x,y,6,220,0.3,"#90caf9");
}
function megaTick(p,dt){
  var h=game.hell,z=megaTarget(),M=p.mega,dm=megaDm(p),d=z?dist(p.x,p.y,z.x,z.y):1e9,a;
  p.megaCd-=dt;p.leapCd-=dt;p.flyCd-=dt;
  if(z)p.aimAng=Math.atan2(z.y-p.y,z.x-p.x);
  /* hammer projectile */
  var hm=h.hammer;
  if(hm){
    hm.t+=dt;hm.spin+=dt*22;
    if(hm.out){var dx=hm.tx-hm.x,dy=hm.ty-hm.y,l=Math.sqrt(dx*dx+dy*dy);
      if(l<8||hm.t>0.75){hm.out=0;hm.tOut=hm.t;}else{hm.x+=dx/l*Math.min(l,430*dt);hm.y+=dy/l*Math.min(l,430*dt);}}
    else{var bx=p.x-hm.x,by=p.y-hm.y,bl=Math.sqrt(bx*bx+by*by);if(bl<14){h.hammer=null;sfx("thud",0.6);}else{hm.x+=bx/bl*Math.min(bl,520*dt);hm.y+=by/bl*Math.min(bl,520*dt);}}
    if(z&&h.hammer&&dist(hm.x,hm.y,z.x,z.y)<z.r+12){if(hm.out&&!hm.h1){hm.h1=1;megaHit(z,30*dm,"#90caf9");hm.out=0;hm.tOut=hm.t;}else if(!hm.out&&!hm.h2&&hm.h1&&hm.t>hm.tOut+0.18){hm.h2=1;megaHit(z,14*dm,"#90caf9");}}
    if(Math.random()<0.5)hellPart(hm.x,hm.y,"#bbdefb",0.25,0,0,3,3);
  }
  /* unibeam */
  if(p.beamT>0){p.beamT-=dt;var bz=megaTarget();if(bz)p.beamA+=Math.atan2(Math.sin(Math.atan2(bz.y-p.y,bz.x-p.x)-p.beamA),Math.cos(Math.atan2(bz.y-p.y,bz.x-p.x)-p.beamA))*Math.min(1,4*dt);
    if(bz&&distSeg(bz.x,bz.y,p.x,p.y,p.x+Math.cos(p.beamA)*380,p.y+Math.sin(p.beamA)*380)<bz.r+14){bz.hp-=150*dm*dt;bz.hitFlash=0.06;if(!bz._bt||game.time-bz._bt>0.2){floatText(bz.x,bz.y-30,""+Math.round(30*dm),"#80deea");bz._bt=game.time;}
      if(!bz.snapDone&&bz.hp<=bz.maxHp*0.16){bz.hp=Math.max(bz.hp,bz.maxHp*0.12);thanosStartSnap(bz);}else if(bz.hp<=0)thanosDie(bz);
      p.super=Math.min(superCost(p),(p.super||0));}
    if(Math.random()<0.6)hellPart(p.x+Math.cos(p.beamA)*rand(20,300),p.y+Math.sin(p.beamA)*rand(20,300),"#e0f7fa",0.25,rand(-20,20),rand(-20,20),3,3);
  }
  /* repulsor shots */
  var s,i;
  for(i=h.shots.length-1;i>=0;i--){s=h.shots[i];s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;
    if(z&&dist(s.x,s.y,z.x,z.y)<z.r+5){megaHit(z,s.dmg,"#80deea");s.life=0;}
    if(s.life<=0||sampleType(s.x,s.y)===2)h.shots.splice(i,1);}
  /* hulk leap */
  if(p.leap){var L=p.leap;L.t+=dt;var u=clamp(L.t/L.T,0,1);
    p.x=L.sx+(L.tx-L.sx)*u;p.y=L.sy+(L.ty-L.sy)*u;p.airH=Math.sin(u*Math.PI)*(L.big?70:46);p.invuln=Math.max(p.invuln,0.1);
    if(u>=1){p.leap=null;p.airH=0;resolveCircle(p);var r=L.big?120:72,dd=L.big?190:82;
      var tz=megaTarget();if(tz&&dist(tz.x,tz.y,p.x,p.y)<r+tz.r)megaHit(tz,dd*dm,"#a5d6a7");
      megaRing(p.x,p.y,10,L.big?320:240,0.45,"#76ff03");if(L.big){megaRing(p.x,p.y,10,220,0.6,"#c5e1a5");megaRing(p.x,p.y,10,150,0.75,"#ffffff");}
      shake(L.big?20:12);sfx("stomp",1);sfx("explode",L.big?1:0.6);
      for(var k=0;k<14;k++)hellPart(p.x+rand(-30,30),p.y+rand(-15,15),k%2?"#5d4037":"#76ff03",0.6,rand(-150,150),rand(-160,-20),rand(3,6),3);}
    return;
  }
  if(!z||game.hell.phase!=="fight")return;
  if(M==="hammer"){
    if(d<60+z.r&&p.megaCd<=0){p.megaCd=0.5;p.megaN++;p.atkT=0.25;p.atkMax=0.25;
      megaHit(z,46*dm,"#bbdefb");megaRing(p.x+Math.cos(p.aimAng)*22,p.y+Math.sin(p.aimAng)*14,6,200,0.28,"#90caf9");sfx("melee",1);shake(5);
      if(p.megaN%4===0)megaBolt(z.x,z.y,55*dm);}
    else if(d<300&&!h.hammer&&p.megaCd<=0){p.megaCd=0.95;p.megaN++;p.atkT=0.2;p.atkMax=0.2;
      a=Math.atan2(z.y-p.y,z.x-p.x);var far=Math.min(300,d+30);h.hammer={x:p.x,y:p.y,tx:p.x+Math.cos(a)*far,ty:p.y+Math.sin(a)*far,out:1,t:0,spin:0};sfx("whoosh",1);
      if(p.megaN%4===0)megaBolt(z.x,z.y,55*dm);}
  }else if(M==="armor"){
    if(d<330&&p.megaCd<=0&&!(p.beamT>0)){p.megaCd=0.25;p.atkT=0.15;p.atkMax=0.15;
      a=Math.atan2(z.y-p.y,z.x-p.x)+rand(-0.04,0.04);h.shots.push({x:p.x+Math.cos(a)*10,y:p.y+Math.sin(a)*8,vx:Math.cos(a)*560,vy:Math.sin(a)*560,life:0.8,dmg:35*dm});sfx("zap",0.45);}
    /* auto flight-dash out of telegraphs */
    var danger=z.tele&&((z.gem==="time"&&dist(p.x,p.y,z.cx,z.cy)<70)||(z.gem==="power"&&d<240)||(z.gem==="space"));
    if(z.ts==="punch_wind"&&dist(p.x,p.y,z.x,z.y)<70)danger=1;
    if(game.hell.safe&&game.hell.safe.length)danger=0; /* never auto-dash out of a snap safe circle */
    if(danger&&p.flyCd<=0&&!(p.dashT>0)){
      var ax=p.x-(z.gem==="time"&&z.tele?z.cx:z.x),ay=p.y-(z.gem==="time"&&z.tele?z.cy:z.y),al=Math.sqrt(ax*ax+ay*ay)||1;
      if(input.joy&&Math.abs(input.jx)+Math.abs(input.jy)>0.2){ax=input.jx;ay=input.jy;al=Math.sqrt(ax*ax+ay*ay)||1;}
      p.dashT=0.24;p.dashVx=ax/al*640;p.dashVy=ay/al*640;p.flyCd=2.0;sfx("dash",1);
      for(var j=0;j<8;j++)hellPart(p.x,p.y,j%2?"#ff7043":"#ffd54f",0.4,-ax/al*120+rand(-30,30),-ay/al*120+rand(-30,30),3,3);
    }
  }else if(M==="hulk"){
    if(d<56+z.r&&p.megaCd<=0){p.megaCd=0.42;p.megaN++;p.atkT=0.22;p.atkMax=0.22;
      megaHit(z,58*dm,"#a5d6a7");sfx("thud",1);shake(7);
      if(p.megaN%4===0){var tz2=z;megaRing(p.x,p.y,10,260,0.4,"#76ff03");if(dist(tz2.x,tz2.y,p.x,p.y)<95+tz2.r)megaHit(tz2,80*dm,"#76ff03");sfx("stomp",1);shake(12);}}
    else if(d>125&&d<400&&p.leapCd<=0&&!game.hell.safe.length){
      a=Math.atan2(z.y-p.y,z.x-p.x);var lx=z.x-Math.cos(a)*(z.r+p.r+12),ly=z.y-Math.sin(a)*(z.r+p.r+12);
      if(sampleType(lx,ly)===0&&sampleSDF(lx,ly)>=p.r){p.leap={sx:p.x,sy:p.y,tx:lx,ty:ly,t:0,T:0.58};p.leapCd=3.0;sfx("jump",1);sfx("grunt",0.8);}
      else p.leapCd=0.5;
    }
  }
  if(M==="armor"&&(Math.abs(p.vx)+Math.abs(p.vy)>30)&&Math.random()<0.35)hellPart(p.x+rand(-3,3),p.y+2,Math.random()<0.5?"#ffab40":"#fff176",0.25,rand(-10,10),rand(10,30),2.5,3);
  if(M==="hammer"&&Math.random()<0.06)hellPart(p.x+rand(-8,8),p.y-rand(10,30),"#bbdefb",0.3,rand(-30,30),rand(-30,30),2,3);
}
function megaSuper(p,ang){
  var h=game.hell,z=megaTarget(),M=p.mega,dm=megaDm(p);
  game.message=M==="hammer"?"¡TORMENTA DIVINA!":M==="armor"?"¡UNIRRAYO!":"¡MEGA PISOTÓN!";game.messageTimer=1.6;
  if(M==="hammer"){
    var tx=z?z.x:p.x+Math.cos(ang)*120,ty=z?z.y:p.y+Math.sin(ang)*120,i;
    for(i=0;i<7;i++)(function(k){h.fx.push({k:"delay",t:0.18*k,max:0.18*k,fn:function(){var tz=megaTarget();var bx=(tz?tz.x:tx)+rand(-18,18),by=(tz?tz.y:ty)+rand(-12,12);megaBolt(bx,by,62*dm);}});})(i);
    sfx("storm",1);h.flash=0.2;
  }else if(M==="armor"){
    p.beamT=1.7;p.beamA=z?Math.atan2(z.y-p.y,z.x-p.x):ang;sfx("laser_loop",1);sfx("zap",1);shake(8);
  }else{
    var lx=p.x,ly=p.y;
    if(z){var a=Math.atan2(z.y-p.y,z.x-p.x),dd=dist(p.x,p.y,z.x,z.y);if(dd<330){lx=z.x-Math.cos(a)*(z.r+p.r+6);ly=z.y-Math.sin(a)*(z.r+p.r+6);}}
    if(!(sampleType(lx,ly)===0&&sampleSDF(lx,ly)>=p.r)){lx=p.x;ly=p.y;}
    p.leap={sx:p.x,sy:p.y,tx:lx,ty:ly,t:0,T:0.7,big:1};sfx("jump",1);sfx("grunt",1);
  }
}
/* delayed fx callbacks */
var _hellFxTick=hellAttacksTick;
hellAttacksTick=function(p,dt){
  var h=game.hell,i,o;
  for(i=h.fx.length-1;i>=0;i--){o=h.fx[i];if(o.k==="delay"&&o.t-dt<=0){o.fn();h.fx.splice(i,1);}}
  _hellFxTick(p,dt);
};
/* ---------- v20.2.3: Thanos drops the Infinity Gauntlet -> final cinematic -> level complete ---------- */
var _hellHurtPlayer=hurtPlayer;
hurtPlayer=function(p,dmg){
  if(HELL.active&&game&&game.hell&&game.hell.won)return;
  /* v20.2.3: the hero is ~22% slower now, so Thanos hits a bit softer (keeps every hero x mega-power winnable) */
  if(HELL.active&&typeof dmg==="number"&&dmg>1){var a=Array.prototype.slice.call(arguments);a[1]=dmg*0.72;return _hellHurtPlayer.apply(this,a);}
  return _hellHurtPlayer.apply(this,arguments);};
function hellDropGlove(x,y){
  var h=game.hell,sp=(sampleType(x,y)===0&&sampleSDF(x,y)>=10)?{x:x,y:y}:(hellSpot(x,y,0,40,14)||hellSpot(HELL_DATA.center.x,HELL_DATA.center.y,0,40,24)||{x:HELL_DATA.center.x,y:HELL_DATA.center.y});
  h.glove={x:sp.x,y:sp.y,t:0};h.phase="won";h.won=1;
  game.message="¡Coge el Brazal del Abismo!";game.messageTimer=6;
  sfx("zap",1);sfx("clear",1);shake(6);
  for(var i=0;i<12;i++){var g=GEM_ORDER[i%6];hellPart(sp.x,sp.y-20,GEMS[g].c,1.0,rand(-90,90),rand(-120,-20),rand(3,5),3);}
}
function hellOpenExit(x,y){hellDropGlove(x,y);} /* legacy name */
/* ---------- v20.3: ending cinematic — pick up the Gauntlet, slide it on, six gems light up, the power floods the
   hero's whole body, the final line "Se acabó... tu reinado.", the hand rises, close-up finger SNAP, white. Drawn with the rigged hero. ---------- */
var FIN={rise0:0.6,rise1:2.0,aim0:1.7,aim1:2.4,slide0:2.45,lock:3.25,gem0:3.75,gemDt:0.42,burst:6.4,voice:6.9,raise0:10.15,raise1:10.9,insert:11.05,snap:12.45,white:13.0,done:13.7};
FIN.soy=FIN.voice+1.48;FIN.name=FIN.voice+2.88;
var SNAPIMG={pre:null,post:null};
(function(){try{["pre","post"].forEach(function(k){var im=new Image();im.onload=function(){SNAPIMG[k]=im;};im.src="assets/spr/snap_"+k+".webp?v=20.6";});}catch(e){}})();
function heroName(p){return (HEROES.filter(function(x){return x.id===p.hero;})[0]||{}).name||"Héroe";}
function hellPlayBuf(name,gain){
  try{
    if(!audio.ctx||audio.mutedSfx||!audio.sfxBuf||!audio.sfxBuf[name])return null;
    var src=audio.ctx.createBufferSource(),g=audio.ctx.createGain();src.buffer=audio.sfxBuf[name];g.gain.value=gain||1;
    src.connect(g);g.connect(audio.sfxG||audio.master);src.start();return src;
  }catch(e){return null;}
}
function finKeys(K,T){ /* smooth piecewise interpolation through [time,value] keys */
  if(T<=K[0][0])return K[0][1];
  for(var i=1;i<K.length;i++)if(T<K[i][0]){var a=K[i-1],b=K[i];return a[1]+(b[1]-a[1])*smooth01((T-a[0])/(b[0]-a[0]));}
  return K[K.length-1][1];
}
var FIN_CAM_H=[[0,0.42],[2.3,0.5],[3.25,0.56],[6.3,0.68],[7.1,1.02],[10.15,1.1],[10.9,0.94]];
var FIN_CAM_F=[[0,0.80],[2.3,0.84],[3.25,0.88],[6.3,1.0],[7.1,1.25],[10.15,1.31],[10.9,1.27]];
var FIN_ARM_R=[[0,0.04],[1.7,0.04],[2.4,-1.25],[3.25,-1.16],[3.7,-0.95],[6.3,-0.88],[6.8,-0.62],[10.15,-0.58],[10.9,-2.85]];
var FIN_ARM_L=[[0,-0.04],[3.25,-0.04],[3.8,0.28],[10.15,0.3],[10.9,0.42]];
var FIN_HEAD=[[0,0],[1.0,0.05],[2.4,0.08],[3.6,0.05],[6.3,0],[7.0,-0.05],[10.9,-0.07]];
function finSnd(n,g){return hellPlayBuf(n,g);}
function finLoop(n,g){ /* looping energy hum under the power-up; returns {set(gain),stop()} */
  try{
    if(!audio.ctx||audio.mutedSfx||!audio.sfxBuf||!audio.sfxBuf[n])return null;
    var src=audio.ctx.createBufferSource(),gn=audio.ctx.createGain();src.buffer=audio.sfxBuf[n];src.loop=true;gn.gain.value=g||0.1;
    src.connect(gn);gn.connect(audio.sfxG||audio.master);src.start();
    return {set:function(v){try{gn.gain.setTargetAtTime(v,audio.ctx.currentTime,0.08);}catch(e){gn.gain.value=v;}},stop:function(){try{gn.gain.setTargetAtTime(0,audio.ctx.currentTime,0.05);src.stop(audio.ctx.currentTime+0.3);}catch(e){}}};
  }catch(e){return null;}
}
function finGemCol(t){ /* smoothly blended gem colour cycle */
  var f=(t*0.9)%6,i=Math.floor(f),u=smooth01(f-i),a=GEMS[GEM_ORDER[i]].c,b=GEMS[GEM_ORDER[(i+1)%6]].c;
  var A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);
  function ch(sh){return Math.round(((A>>sh)&255)*(1-u)+((B>>sh)&255)*u);}
  var r=ch(16),g=ch(8),bl=ch(0);return "#"+((1<<24)|(r<<16)|(g<<8)|bl).toString(16).slice(1);
}
function finPower(T){
  var F=HELL.fin,s=0,i;if(!F)return 0;for(i=0;i<6;i++)s+=F.lit[i]||0;
  var pw=s/6*0.75;if(T>=FIN.burst)pw=0.75+0.25*smooth01((T-FIN.burst)/0.6);
  return pw;
}
/* v20.3.4: the ending close-up uses 2x super-resolved hero art (cut into its own rig) so the hero stays crisp at
   cinematic zoom; falls back to the game sprite until it has loaded */
var FIN_HD={};
function finHDLoad(name){if(FIN_HD[name]!==undefined)return;FIN_HD[name]=null;try{var im=new Image();im.onload=function(){FIN_HD[name]=im;};im.src="assets/spr/"+name+"_hd.webp?v=20.6";}catch(e){}}
var FIN_HDT={};
function finHDImg(name,tint){var hd=FIN_HD[name];if(!hd)return null;if(!tint)return hd;
  var k=name+"|"+tint;if(FIN_HDT[k])return FIN_HDT[k];
  var sv=ART_TINT[k];delete ART_TINT[k];var r=null;try{r=artTint(name,hd,tint);}catch(err){r=null;}if(sv)ART_TINT[k]=sv;else delete ART_TINT[k];
  return (FIN_HDT[k]=r);}
function finHD(e){var p=game.player,tint=p&&p.look&&p.look.tint;if(!HERO_RIG[e.name])return e;var im=finHDImg(e.name,tint);if(!im)return e;return {img:im,meta:e.meta,name:e.name,flip:e.flip};}
function hellFinalStart(){
  var p=game.player,h=game.hell;
  h.glove=null;game.state="hell_final";HELL.finT=0;HELL.finVoice=null;
  HELL.fin={ev:{},lit:[0,0,0,0,0,0],waves:[],parts:[],rings:[],flash:0,vpts:[]};
  p.vx=p.vy=0;p.dashT=0;p.knockT=0;p.airH=0;p.leap=null;p.beamT=0;p.invuln=0;p.flash=0;p.atkT=0;p.meleeSwing=0;p.muzzle=0;
  if(h.hammer)h.hammer=null;
  p.aimAng=p.facing=p.faceAng=Math.PI/2;p.gauntlet=1;
  HELL.finCam={x:game.camX,y:game.camY};
  try{var fe=artEntry(game.player.look||makeHeroLook(p.hero),angDir(Math.PI/2),"idle");if(fe){var fim=finHDImg(fe.name,p.look&&p.look.tint);if(fim)rigParts(fe.name,fim);}}catch(err){}
  game.message="";game.messageTimer=0;
  finSnd("thanos_boom",0.4);shake(4);
}
function hellFinalUpdate(dt){
  var p=game.player,h=game.hell,F=HELL.fin,base=layout.baseViewW||380,i;
  if(!p||!h||!F){hellFinalEnd();return;}
  var T=(HELL.finT+=dt);h.t+=dt;
  function once(k,at,fn){if(!F.ev[k]&&T>=at){F.ev[k]=1;fn();}}
  once("rise",FIN.rise0,function(){finSnd("portal",0.6);finSnd("crackle",0.35);});
  once("aim",FIN.aim0,function(){finSnd("whoosh",0.55);});
  once("slide",FIN.slide0+0.2,function(){finSnd("fire_whoosh",0.45);});
  once("hum",FIN.lock,function(){F.hum=finLoop("laser_loop",0.1);});
  if(F.hum){F.hum.set(T>=FIN.snap?0:0.1+0.4*finPower(T)+(T>FIN.raise0?0.2:0)+(T>FIN.insert?0.1:0));if(T>=FIN.snap){F.hum.stop();F.hum=null;}}
  once("lock",FIN.lock,function(){finSnd("thud",1.3);finSnd("stomp",0.7);finSnd("zap",0.7);shake(9);F.flash=0.45;F.rings.push({t:0,c:"#ffd54f",hand:1});});
  for(i=0;i<6;i++)(function(i){once("gem"+i,FIN.gem0+i*FIN.gemDt,function(){var g=GEM_ORDER[i];F.lit[i]=0.001;F.waves.push({t0:T,c:GEMS[g].c});finSnd("rarity"+Math.min(4,i),1);finSnd("zap",0.3);shake(2+i);F.rings.push({t:0,c:GEMS[g].c,hand:1});});})(i);
  once("burst",FIN.burst,function(){finSnd("thanos_boom",0.85);finSnd("storm",0.75);shake(15);F.flash=0.75;F.rings.push({t:0,c:"#ffffff",feet:1});F.rings.push({t:-0.12,c:"#c77dff",feet:1});
    for(var k=0;k<6;k++)F.waves.push({t0:T+k*0.05,c:GEMS[GEM_ORDER[k]].c});});
  once("voice",FIN.voice,function(){HELL.finVoice=hellPlayBuf("final_voice_"+(p.hero||"classic"),1.35);});
  once("pulse1",FIN.soy,function(){F.waves.push({t0:T,c:"#ffffff"});shake(3);});
  once("name",FIN.name,function(){shake(7);finSnd("crackle",0.5);F.waves.push({t0:T,c:"#ffd54f"});F.rings.push({t:0,c:"#ffd54f",feet:1});});
  once("raise",FIN.raise0,function(){finSnd("whoosh",0.8);finSnd("storm",0.4);});
  once("insert",FIN.insert,function(){finSnd("thanos_boom",0.45);finSnd("crackle",0.5);F.flash=0.35;});
  once("snap",FIN.snap,function(){
    if(HELL.finVoice){try{HELL.finVoice.stop();}catch(e){}HELL.finVoice=null;}
    if(!hellPlayBuf("final_snap",1.4))sfx("thanos_boom",1);shake(18);F.flash=0.3;
    for(var k=0;k<40;k++){var a=Math.random()*6.283,v=rand(160,520);F.parts.push({x:-1,y:-1,snap:1,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(0.25,0.6),max:0.6,c:k%3?"#ffffff":GEMS[GEM_ORDER[k%6]].c,s:rand(2,5)});}
  });
  for(i=0;i<6;i++)if(F.lit[i]>0)F.lit[i]=Math.min(1,F.lit[i]+dt*4);
  for(i=F.rings.length-1;i>=0;i--){F.rings[i].t+=dt;if(F.rings[i].t>1.1)F.rings.splice(i,1);}
  for(i=F.waves.length-1;i>=0;i--)if(T-F.waves[i].t0>2.2)F.waves.splice(i,1);
  F.flash=Math.max(0,F.flash-dt*2.2);
  /* rising energy sparks from the body */
  var pw=finPower(T);
  if(T<FIN.insert&&F.vpts.length&&pw>0.05){var n=Math.random()<pw*3?2:0;for(i=0;i<n;i++){var q=F.vpts[(Math.random()*F.vpts.length)|0];F.parts.push({x:q.x,y:q.y,vx:rand(-14,14),vy:-rand(30,90)*(0.6+pw),life:rand(0.5,1.1),max:1.1,c:q.c||GEMS[GEM_ORDER[(Math.random()*6)|0]].c,s:rand(1.2,2.8)});}}
  for(i=F.parts.length-1;i>=0;i--){var o=F.parts[i];o.life-=dt;if(o.life<=0){F.parts.splice(i,1);continue;}if(o.x>=0){o.x+=o.vx*dt;o.y+=o.vy*dt;}else{o.ox=(o.ox||0)+o.vx*dt;o.oy=(o.oy||0)+o.vy*dt;}o.vx*=1-dt*1.5;o.vy*=1-dt*1.5;}
  if(F.parts.length>220)F.parts.splice(0,F.parts.length-220);
  /* the world behind zooms with the shot */
  var camH=finKeys(FIN_CAM_H,T);
  hellSetView(base*clamp(0.36/camH,0.28,0.9));
  var c=HELL.finCam,k=1-Math.exp(-3.2*dt),tx=p.x,ty=p.y-14;c.x+=(tx-c.x)*k;c.y+=(ty-c.y)*k;
  game.camX=c.x;game.camY=c.y;
  var hw=worldW()*0.5,hh=worldH()*0.5;
  game.camX=clamp(game.camX,hw+2,CFG.MAP_W-hw-2);game.camY=clamp(game.camY,hh+2,CFG.MAP_H-hh-2);
  if(game.shake>0){game.shake=Math.max(0,game.shake-dt*30);}
  p.aimAng=p.facing=p.faceAng=Math.PI/2;p.vx=p.vy=0;p.anim=(p.anim||0)+dt*1.5;
  updateFX(dt);
  if(T>=FIN.done||T>18)hellFinalEnd();
}
function hellFinalSkip(){
  if(game&&game.state==="hell_final"&&HELL.finT>1&&HELL.finT<FIN.insert-0.1){
    if(HELL.finVoice){try{HELL.finVoice.stop();}catch(e){}HELL.finVoice=null;}
    var F=HELL.fin;if(F){["rise","aim","slide","lock","gem0","gem1","gem2","gem3","gem4","gem5","burst","voice","pulse1","name","raise"].forEach(function(k){F.ev[k]=1;});F.lit=[1,1,1,1,1,1];F.waves=[];}
    HELL.finT=FIN.insert-0.05;return 1;}
  return 0;
}
function hellFinalEnd(){
  if(HELL.finVoice){try{HELL.finVoice.stop();}catch(e){}HELL.finVoice=null;}
  if(HELL.fin&&HELL.fin.hum){HELL.fin.hum.stop();HELL.fin.hum=null;}
  hellSetView(layout.baseViewW||380);
  if(game.player){game.camX=game.player.x;game.camY=game.player.y-30;}
  HELL.fin=null;HELL.finWhite=1;hellLevelDone();
}
function drawGauntletAt(cx,by,hgt,glow,t,rot,lit){
  var im=typeof ART!=="undefined"&&ART.imgs?ART.imgs.brazal:null,w=hgt*(im?im.width/im.height:91/200),i;
  ctx.save();ctx.translate(cx,by);if(rot)ctx.rotate(rot);
  ctx.globalCompositeOperation="lighter";ctx.globalAlpha=Math.min(0.8,0.3+0.3*glow);
  var cyc=GEMS[GEM_ORDER[((t*2)|0)%6]].c,gr=hgt*(0.9+0.25*glow);
  ctx.drawImage(glowSpr(cyc),-gr,-hgt*0.55-gr*0.8,gr*2,gr*1.6);
  ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;
  if(im&&im.width)ctx.drawImage(im,-w/2,-hgt,w,hgt);
  else{ctx.fillStyle="#1d1f26";ctx.strokeStyle="#4dfff0";ctx.lineWidth=2;roundRect(ctx,-w*0.35,-hgt,w*0.7,hgt,w*0.2);ctx.fill();ctx.stroke();}
  var G=[[0.398,0.317,"power"],[0.598,0.306,"space"],[0.762,0.332,"reality"],[0.875,0.359,"mind"],[0.128,0.425,"time"],[0.5,0.62,"soul"]]; /* v20.6: Brazal del Abismo shards */
  ctx.globalCompositeOperation="lighter";
  for(i=0;i<6;i++){var lv=lit?(lit[G[i][2]]||0):1;if(lit&&lv<=0)continue;
    var a=(0.35+0.65*glow*(0.7+0.3*Math.sin(t*7+i*1.7)))*lv,r=hgt*(0.07+0.07*glow)*(lit?1+1.6*Math.max(0,1-lv)*lv*4:1);ctx.globalAlpha=Math.min(1,a);
    ctx.drawImage(glowSpr(GEMS[G[i][2]].c),-w/2+G[i][0]*w-r,-hgt+G[i][1]*hgt-r,r*2,r*2);}
  ctx.restore();
}
var _finCv=[];
function finCanvas(i){
  var c=_finCv[i],w=canvas.width,h=canvas.height;
  if(!c){c=_finCv[i]=document.createElement("canvas");}
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
  return c;
}
var _finPrevBB=null;
function finBox(ox,oy,H,M,c){var x0=Math.floor((ox-H*0.75)*M.a+M.e),x1=Math.ceil((ox+H*0.75)*M.a+M.e),y0=Math.floor((oy-H*1.4)*M.d+M.f),y1=Math.ceil((oy+H*0.25)*M.d+M.f);
  x0=Math.max(0,x0);y0=Math.max(0,y0);x1=Math.min(c.width,x1);y1=Math.min(c.height,y1);return {x:x0,y:y0,w:Math.max(1,x1-x0),h:Math.max(1,y1-y0)};}
function finBoxU(a,b){if(!b)return a;var x0=Math.min(a.x,b.x),y0=Math.min(a.y,b.y),x1=Math.max(a.x+a.w,b.x+b.w),y1=Math.max(a.y+a.h,b.y+b.h);return {x:x0,y:y0,w:x1-x0,h:y1-y0};}
function finRot(px,py,ox,oy,a){var c=Math.cos(a),s=Math.sin(a),dx=px-ox,dy=py-oy;return {x:ox+dx*c-dy*s,y:oy+dx*s+dy*c};}
/* draw part of a polyline network: segment list with cumulative distance (in hero heights) */
function finVeinStroke(g,net,a,b,H,t,col,lw,alpha){
  if(b<=a)return;
  g.strokeStyle=col;g.lineWidth=lw;g.globalAlpha=alpha;g.beginPath();
  for(var i=0;i<net.length;i++){var s=net[i];if(s.d1<a||s.d0>b)continue;
    var u0=clamp((a-s.d0)/(s.d1-s.d0),0,1),u1=clamp((b-s.d0)/(s.d1-s.d0),0,1),n=Math.max(2,Math.ceil((u1-u0)*(s.d1-s.d0)*40)),j,first=1;
    var nx=-(s.y1-s.y0),ny=s.x1-s.x0,nl=Math.sqrt(nx*nx+ny*ny)||1;nx/=nl;ny/=nl;
    for(j=0;j<=n;j++){var u=u0+(u1-u0)*j/n,dd=s.d0+(s.d1-s.d0)*u,w=Math.sin(dd*38+s.k*3.1+t*7)*H*0.007+Math.sin(dd*91+s.k)*H*0.003;
      var x=s.x0+(s.x1-s.x0)*u+nx*w,y=s.y0+(s.y1-s.y0)*u+ny*w;if(first){g.moveTo(x,y);first=0;}else g.lineTo(x,y);}
  }
  g.stroke();g.globalAlpha=1;
}
function finDrawStage(T,F,p,t){
  var look=p.look,e=typeof artEntry==="function"?artEntry(look,2,"idle"):null;
  var camH=finKeys(FIN_CAM_H,T)*SH,footY=finKeys(FIN_CAM_F,T)*SH,cx=SW*0.47;
  var pw=finPower(T),gt=finGemCol(t);
  /* darken + focus */
  ctx.save();
  ctx.fillStyle="rgba(8,3,16,"+(0.32+0.4*pw)+")";ctx.fillRect(0,0,SW,SH);
  var vg=ctx.createRadialGradient(cx,footY-camH*0.55,camH*0.2,cx,footY-camH*0.55,Math.max(SW,SH)*0.8);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(4,0,8,0.8)");ctx.fillStyle=vg;ctx.fillRect(0,0,SW,SH);
  if(pw>0.02){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.25+0.35*pw+0.1*Math.sin(t*9);var gr=camH*(0.55+0.6*pw);ctx.drawImage(glowSpr(gt),cx-gr,footY-camH*0.55-gr,gr*2,gr*2);}
  ctx.restore();
  if(!e){return;}
  var m=e.meta,H=camH,W=H*(m.w/m.h),fx=m.fx!=null?m.fx:0.5,fy=m.fy!=null?m.fy:1,R=HERO_RIG[e.name];
  var trem=pw*(T>FIN.burst?1:0.5)+(T>FIN.raise0?0.4:0),jx=(Math.random()-0.5)*trem*H*0.008,jy=(Math.random()-0.5)*trem*H*0.006;
  var shk=(game.shake||0)*0.6,ox=cx+jx+(Math.random()-0.5)*shk,oy=footY+jy+(Math.random()-0.5)*shk;
  function dX(sx){return ox-W*fx+sx*W;} function dY(sy){return oy-H*fy+sy*H;}
  /* ground: shadow + shock rings */
  ctx.save();
  if(typeof softShadowSpr==="function"){ctx.globalAlpha=0.85;ctx.drawImage(softShadowSpr(),ox-H*0.22,oy-H*0.045,H*0.44,H*0.09);}
  ctx.globalCompositeOperation="lighter";
  for(var ri=0;ri<F.rings.length;ri++){var rg=F.rings[ri];if(!rg.feet||rg.t<0)continue;var ru=rg.t/1.1;ctx.globalAlpha=(1-ru)*0.9;ctx.strokeStyle=rg.c;ctx.lineWidth=Math.max(1,H*0.02*(1-ru));
    ctx.beginPath();ctx.ellipse(ox,oy,H*(0.15+1.4*ru),H*(0.05+0.45*ru),0,0,6.283);ctx.stroke();}
  ctx.restore();
  var armR=finKeys(FIN_ARM_R,T)+(T>FIN.lock?Math.sin(t*31)*0.02*trem:0),armL=finKeys(FIN_ARM_L,T)+Math.sin(t*27)*0.015*trem,headR=finKeys(FIN_HEAD,T);
  /* hero into an offscreen layer (mask for the energy, source for the aura) */
  var M=ctx.getTransform(),hc=finCanvas(0),hg=hc.getContext("2d");
  /* v20.5.1 perf: every offscreen pass (clear, tint, aura, veins, mask, blit) is limited to the hero's device-pixel box
     (plus last frame's box for clearing) instead of the whole screen — same pixels, a fraction of the fill */
  var BB=finBox(ox,oy,H,M,hc),BU=finBoxU(BB,_finPrevBB);_finPrevBB=BB;
  hg.setTransform(1,0,0,1,0,0);hg.clearRect(BU.x,BU.y,BU.w,BU.h);hg.setTransform(M);
  var main=ctx,hand=null;ctx=hg;
  try{ctx.save();ctx.translate(ox,oy);
    var eh=finHD(e);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
    if(R)hand=drawHeroRig(eh,eh.name,look,0,"idle",H,W,fx,fy,{armR:armR,armL:armL,headR:headR,aim:0});
    else ctx.drawImage(e.img,-W*fx,-H*fy,W,H);
    ctx.restore();}catch(err){}
  ctx=main;
  var hx,hy;
  if(hand){var hp=hand.matrixTransform(M.inverse());hx=hp.x;hy=hp.y;}else{hx=dX(0.86);hy=dY(0.62);}
  var sR=R?{x:dX(R.R.p[0]),y:dY(R.R.p[1])}:{x:dX(0.8),y:dY(0.4)},sL=R?{x:dX(R.L.p[0]),y:dY(R.L.p[1])}:{x:dX(0.2),y:dY(0.4)};
  var mhx=(e.meta.hx!=null?e.meta.hx:0.9),mhy=(e.meta.hy!=null?e.meta.hy:0.64);mhx=0.5+(mhx-0.5)*0.86;
  var hL=finRot(dX(1-mhx),dY(mhy),sL.x,sL.y,armL);
  var adx=hx-sR.x,ady=hy-sR.y,al=Math.sqrt(adx*adx+ady*ady)||1,ux=adx/al,uy=ady/al;
  /* aura: tinted silhouette, scaled up, additive, behind the hero */
  if(pw>0.02||F.flash>0){
    var tc=finCanvas(1),tg=tc.getContext("2d");tg.setTransform(1,0,0,1,0,0);tg.globalCompositeOperation="source-over";tg.clearRect(BU.x,BU.y,BU.w,BU.h);
    tg.save();tg.beginPath();tg.rect(BB.x,BB.y,BB.w,BB.h);tg.clip();tg.drawImage(hc,BB.x,BB.y,BB.w,BB.h,BB.x,BB.y,BB.w,BB.h);
    tg.globalCompositeOperation="source-in";tg.fillStyle=pw>0.02?gt:"#ffd54f";tg.fillRect(BB.x,BB.y,BB.w,BB.h);tg.restore();tg.globalCompositeOperation="source-over";
    var ccx=ox*M.a+M.e,ccy=(oy-H*0.5)*M.d+M.f;
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation="lighter";
    var sc2=[1.03,1.065,1.11],al2=[0.5,0.3,0.16];
    for(var si=0;si<3;si++){var ss=sc2[si]+0.012*Math.sin(t*11+si);ctx.globalAlpha=Math.min(1,(pw*0.9+F.flash*0.6)*al2[si]*(0.85+0.15*Math.sin(t*13+si*2)));
      ctx.setTransform(ss,0,0,ss,ccx*(1-ss),ccy*(1-ss));ctx.drawImage(tc,BB.x,BB.y,BB.w,BB.h,BB.x,BB.y,BB.w,BB.h);}
    ctx.restore();
  }
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(hc,BB.x,BB.y,BB.w,BB.h,BB.x,BB.y,BB.w,BB.h);ctx.restore();
  /* energy veins + gem waves, masked to the body */
  if(T>FIN.lock-0.05&&R){
    var net=[],dC=0;
    function seg(a,b,d0,k){var d1=d0+Math.sqrt((b.x-a.x)*(b.x-a.x)+(b.y-a.y)*(b.y-a.y))/H;net.push({x0:a.x,y0:a.y,x1:b.x,y1:b.y,d0:d0,d1:d1,k:k});return d1;}
    var el={x:(sR.x+hx)/2-uy*H*0.012,y:(sR.y+hy)/2+ux*H*0.012},C={x:dX(0.5),y:dY(R.neck+0.1)},N={x:dX(0.5),y:dY(R.neck+0.01)},Hd={x:dX(0.52),y:dY(R.neck*0.5)};
    var elL={x:(sL.x+hL.x)/2,y:(sL.y+hL.y)/2},Wt={x:dX(0.5),y:dY(R.waist)},hpL={x:dX(0.4),y:dY(R.waist+0.04)},hpR={x:dX(0.6),y:dY(R.waist+0.04)};
    var knL={x:dX(0.39),y:dY(0.77)},knR={x:dX(0.61),y:dY(0.77)},ftL={x:dX(0.38),y:dY(0.94)},ftR={x:dX(0.62),y:dY(0.94)};
    var d=seg({x:hx,y:hy},el,0,1);d=seg(el,sR,d,2);dC=seg(sR,C,d,3);
    seg(C,N,dC,4);
    d=seg(C,sL,dC,6);d=seg(sL,elL,d,7);seg(elL,hL,d,8);
    d=seg(C,Wt,dC,9);var dW=d;d=seg(Wt,hpL,dW,10);d=seg(hpL,knL,d,11);seg(knL,ftL,d,12);
    d=seg(Wt,hpR,dW,13);d=seg(hpR,knR,d,14);seg(knR,ftR,d,15);
    seg(sR,Wt,dC-0.05,16);seg(sL,{x:dX(0.42),y:dY(R.waist-0.02)},dC+0.1,17);
    var ec=finCanvas(2),eg=ec.getContext("2d");eg.setTransform(1,0,0,1,0,0);eg.globalCompositeOperation="source-over";eg.clearRect(0,0,ec.width,ec.height);
    eg.save();eg.beginPath();eg.rect(BB.x,BB.y,BB.w,BB.h);eg.clip();eg.setTransform(M);
    eg.lineCap="round";eg.lineJoin="round";
    var reach=(T-FIN.lock)*1.1,base=0.15+0.85*pw,maxD=0;for(var ni=0;ni<net.length;ni++)maxD=Math.max(maxD,net[ni].d1);
    finVeinStroke(eg,net,0,reach,H,t,gt,H*0.045,0.3*base);
    finVeinStroke(eg,net,0,reach,H,t,gt,H*0.018,0.7*base);
    finVeinStroke(eg,net,0,reach,H,t,"#fff6e0",H*0.006,0.45*base);
    for(var wi=0;wi<F.waves.length;wi++){var wv=F.waves[wi],rw=(T-wv.t0)*2.0;if(rw<0)continue;
      finVeinStroke(eg,net,rw-0.35,rw,H,t,wv.c,H*0.06,0.6);finVeinStroke(eg,net,rw-0.2,rw,H,t,wv.c,H*0.022,1);finVeinStroke(eg,net,rw-0.08,rw,H,t,"#ffffff",H*0.01,0.8);
      /* a band of the gem's colour sweeping up the whole body */
      var by=oy-H*(rw*0.55-0.05);if(by>oy-H*1.1&&by<oy+H*0.1){var bg=eg.createLinearGradient(0,by-H*0.09,0,by+H*0.09);bg.addColorStop(0,hexA(wv.c,0));bg.addColorStop(0.5,hexA(wv.c,0.55));bg.addColorStop(1,hexA(wv.c,0));eg.fillStyle=bg;eg.fillRect(ox-H,by-H*0.09,H*2,H*0.18);}}
    if(pw>0.05){var bgl=eg.createRadialGradient(C.x,C.y,0,C.x,C.y,H*0.6);bgl.addColorStop(0,hexA(gt,0.32*pw+0.1*Math.sin(t*10)*pw));bgl.addColorStop(1,hexA(gt,0.05*pw));eg.fillStyle=bgl;eg.fillRect(ox-H,oy-H*1.2,H*2,H*1.3);}
    eg.setTransform(1,0,0,1,0,0);eg.globalCompositeOperation="destination-in";eg.drawImage(hc,BB.x,BB.y,BB.w,BB.h,BB.x,BB.y,BB.w,BB.h);eg.globalCompositeOperation="source-over";eg.restore();
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation="lighter";ctx.drawImage(ec,BB.x,BB.y,BB.w,BB.h,BB.x,BB.y,BB.w,BB.h);ctx.restore();
    /* sample points for the rising sparks */
    F.vpts.length=0;for(var vi=0;vi<net.length;vi++){var sg=net[vi];if(sg.d0>reach)continue;var uu=Math.random();F.vpts.push({x:sg.x0+(sg.x1-sg.x0)*uu,y:sg.y0+(sg.y1-sg.y0)*uu});}
  }
  /* the Gauntlet */
  var lit={},gi;for(gi=0;gi<6;gi++)lit[GEM_ORDER[gi]]=F.lit[gi]||0;
  var gh=H*0.24,P,rot;
  var fr=Math.atan2(uy,ux)+Math.PI/2; /* fingers along the arm, away from the shoulder */
  if(T<FIN.lock){
    var g0={x:ox+W*0.95,y:oy-H*0.02},rr=-1.25,hf=finRot(dX(mhx),dY(mhy),sR.x,sR.y,rr),fdx=hf.x-sR.x,fdy=hf.y-sR.y,fl=Math.sqrt(fdx*fdx+fdy*fdy)||1;
    var gf={x:hf.x+fdx/fl*H*0.2,y:hf.y+fdy/fl*H*0.2},ga=Math.atan2(fdy,fdx)+Math.PI/2;
    if(T<FIN.rise0){P={x:g0.x,y:g0.y-gh*0.42-Math.abs(Math.sin(t*3))*H*0.015};rot=0;gh*=0.85;}
    else if(T<FIN.slide0){var u=smooth01((T-FIN.rise0)/(FIN.rise1-FIN.rise0));gh*=0.85/0.8;P={x:g0.x+(gf.x-g0.x)*u,y:g0.y-gh*0.4+(gf.y-g0.y+gh*0.4)*u-Math.sin(u*Math.PI)*H*0.16+Math.sin(t*3.2)*H*0.008*u};
      rot=Math.sin(u*Math.PI*2)*0.5*(1-u)+ga*smooth01((T-FIN.rise1+0.3)/0.6);gh*=0.8+0.2*u;
      if(Math.random()<0.6)F.parts.push({x:P.x+rand(-gh*0.2,gh*0.2),y:P.y+rand(-gh*0.2,gh*0.3),vx:rand(-10,10),vy:rand(-30,-8),life:0.6,max:0.6,c:GEMS[GEM_ORDER[(Math.random()*6)|0]].c,s:rand(1.5,3)});}
    else{var v=smooth01((T-FIN.slide0)/(FIN.lock-FIN.slide0));v=v*v;P={x:gf.x+(hx+ux*gh*0.12-gf.x)*v,y:gf.y+(hy+uy*gh*0.12-gf.y)*v};rot=ga+(fr-ga)*v;
      if(Math.random()<0.8)F.parts.push({x:P.x-ux*gh*0.4,y:P.y-uy*gh*0.4,vx:rand(-20,20),vy:rand(-20,20),life:0.35,max:0.35,c:"#ffe082",s:rand(1.5,3)});}
  }else{P={x:hx+ux*gh*0.12,y:hy+uy*gh*0.12};rot=fr;}
  var base2={x:P.x-Math.sin(rot)*gh*0.5,y:P.y+Math.cos(rot)*gh*0.5};
  drawGauntletAt(base2.x,base2.y,gh,0.4+0.8*pw+(T<FIN.lock?0.25*Math.sin(t*5):0),t,rot,T>=FIN.lock?lit:null);
  /* hand rings (lock + every gem) */
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(ri=0;ri<F.rings.length;ri++){var rh=F.rings[ri];if(!rh.hand||rh.t<0)continue;var hu=rh.t/0.7;if(hu>1)continue;ctx.globalAlpha=(1-hu);ctx.strokeStyle=rh.c;ctx.lineWidth=Math.max(1,H*0.018*(1-hu));
    ctx.beginPath();ctx.arc(P.x,P.y,gh*(0.3+1.6*hu),0,6.283);ctx.stroke();ctx.globalAlpha=(1-hu)*0.55;var fg=gh*(0.45+0.5*(1-hu));ctx.drawImage(glowSpr(rh.c),P.x-fg,P.y-fg,fg*2,fg*2);}
  if(T>FIN.raise0){var gw2=gh*(0.8+1.4*smooth01((T-FIN.raise0)/0.8));ctx.globalAlpha=0.4+0.2*Math.sin(t*14);ctx.drawImage(glowSpr("#ffffff"),P.x-gw2,P.y-gw2,gw2*2,gw2*2);}
  /* sparks */
  for(var pi=0;pi<F.parts.length;pi++){var o=F.parts[pi];if(o.x<0)continue;ctx.globalAlpha=clamp(o.life/o.max,0,1);var sz=o.s*(H/200+0.5);ctx.drawImage(glowSpr(o.c),o.x-sz*2,o.y-sz*2,sz*4,sz*4);}
  ctx.restore();
}
function finLightning(x0,y0,x1,y1,col,w){
  var n=7,i,dx=x1-x0,dy=y1-y0,l=Math.sqrt(dx*dx+dy*dy)||1,nx=-dy/l,ny=dx/l;
  ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);
  for(i=1;i<n;i++){var u=i/n,o=(Math.random()-0.5)*l*0.22;ctx.lineTo(x0+dx*u+nx*o,y0+dy*u+ny*o);}
  ctx.lineTo(x1,y1);ctx.stroke();
}
function finDrawInsert(T,F,p,t){
  var u=smooth01((T-FIN.insert)/0.35),post=T>=FIN.snap,ts=T-FIN.snap,pre=SNAPIMG.pre,img=post?(SNAPIMG.post||pre):pre;
  ctx.save();
  var bg=ctx.createRadialGradient(SW/2,SH*0.45,10,SW/2,SH*0.45,Math.max(SW,SH)*0.75);bg.addColorStop(0,"#0f3a44");bg.addColorStop(0.5,"#06161c");bg.addColorStop(1,"#010406");
  ctx.fillStyle=bg;ctx.fillRect(0,0,SW,SH);
  /* rotating gem-coloured rays */
  ctx.globalCompositeOperation="lighter";
  var rays=12,cx=SW/2,cy=SH*0.42,i,RL=Math.max(SW,SH);
  for(i=0;i<rays;i++){var a=i/rays*6.283+t*0.25,c=GEMS[GEM_ORDER[i%6]].c;ctx.globalAlpha=0.08+0.05*Math.sin(t*3+i);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a-0.07)*RL,cy+Math.sin(a-0.07)*RL);ctx.lineTo(cx+Math.cos(a+0.07)*RL,cy+Math.sin(a+0.07)*RL);ctx.closePath();ctx.fill();}
  ctx.restore();
  var squeeze=!post&&T>FIN.snap-0.22?1-0.035*smooth01((T-FIN.snap+0.22)/0.22):1,kick=post?1+0.06*Math.max(0,1-ts/0.25):1;
  var gh=SH*(0.74+0.08*u)*squeeze*kick,trem=(post?Math.max(0,1-ts/0.3):0.3+0.7*smooth01((T-FIN.insert)/(FIN.snap-FIN.insert)))*SH*0.006;
  var ix=cx+(Math.random()-0.5)*trem,iy=SH*0.5+gh*0.08+(Math.random()-0.5)*trem+(1-u)*SH*0.2;
  var gw=img?gh*(img.width/img.height):gh*0.55,x0=ix-gw/2,y0=iy-gh/2;
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.55+0.2*Math.sin(t*8);var gg=gh*0.85;ctx.drawImage(glowSpr(GEMS[GEM_ORDER[((t*2)|0)%6]].c),ix-gg,iy-gh*0.15-gg,gg*2,gg*2);ctx.restore();
  if(img){
    if(post&&ts<0.1&&pre){ctx.save();ctx.globalAlpha=0.55*(1-ts/0.1);ctx.drawImage(pre,x0,y0-gh*0.03,gw,gh);ctx.restore();}
    ctx.drawImage(img,x0,y0,gw,gh);
  }else drawGauntletAt(ix,iy+gh/2,gh,1,t,0,null);
  /* gem glints (positions in the close-up art) */
  var GP=[[0.548,0.327,"power"],[0.702,0.327,"space"],[0.823,0.346,"reality"],[0.913,0.365,"mind"],[0.279,0.408,"time"],[0.642,0.506,"soul"]];
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(i=0;i<6;i++){var gx=x0+GP[i][0]*gw,gy=y0+GP[i][1]*gh,r=gh*(i===5?0.05:0.065)*(1+0.25*Math.sin(t*9+i)),col=GEMS[GP[i][2]].c;ctx.globalAlpha=i===5?0.5:0.9;ctx.drawImage(glowSpr(col),gx-r,gy-r,r*2,r*2);}
  /* crackling arcs between the gems and the fingers */
  if(!post||ts<0.4){var ft={x:x0+0.47*gw,y:y0+0.13*gh};
    for(i=0;i<3;i++){var gq=GP[(Math.random()*5)|0],col2=GEMS[gq[2]].c;ctx.globalAlpha=0.7;finLightning(x0+gq[0]*gw,y0+gq[1]*gh,ft.x+rand(-gw*0.15,gw*0.15),ft.y+rand(-gh*0.05,gh*0.1),col2,Math.max(1,gh*0.008));}}
  /* the snap: contact flash, smear lines and a shock ring from the fingertips */
  if(post){var cp={x:x0+0.2*gw,y:y0+0.21*gh},k=clamp(ts/0.45,0,1);
    ctx.globalAlpha=(1-k)*0.85;var fs=gh*(0.12+0.5*k);ctx.drawImage(glowSpr("#ffffff"),cp.x-fs,cp.y-fs,fs*2,fs*2);
    ctx.strokeStyle="#ffffff";ctx.lineWidth=Math.max(1.5,gh*0.02*(1-k));ctx.beginPath();ctx.arc(cp.x,cp.y,gh*(0.1+1.4*k),0,6.283);ctx.stroke();
    if(ts<0.12){ctx.globalAlpha=0.8*(1-ts/0.12);ctx.lineWidth=Math.max(1,gh*0.01);for(i=0;i<5;i++){var sx=cp.x-gw*0.08+i*gw*0.04;ctx.beginPath();ctx.moveTo(sx,cp.y-gh*0.18);ctx.lineTo(sx+gw*0.01,cp.y+gh*0.02);ctx.stroke();}}
    for(i=0;i<F.parts.length;i++){var o=F.parts[i];if(!o.snap)continue;ctx.globalAlpha=clamp(o.life/o.max,0,1);var sz=o.s*SH/480;ctx.drawImage(glowSpr(o.c),cp.x+(o.ox||0)-sz*2,cp.y+(o.oy||0)-sz*2,sz*4,sz*4);}
  }
  ctx.restore();
  /* punch-in flash on the cut */
  if(T-FIN.insert<0.2){ctx.fillStyle="rgba(255,255,255,"+(0.6*(1-(T-FIN.insert)/0.2))+")";ctx.fillRect(0,0,SW,SH);}
}
function drawHellFinal(){
  var T=HELL.finT,F=HELL.fin,p=game.player,t=game.time||0;
  if(!F||!p)return;
  var la=clamp(T/0.8,0,1);
  if(T<FIN.insert)finDrawStage(T,F,p,t);else finDrawInsert(T,F,p,t);
  if(F.flash>0){ctx.save();ctx.globalCompositeOperation="lighter";ctx.fillStyle="rgba(255,248,230,"+Math.min(0.7,F.flash*0.7)+")";ctx.fillRect(0,0,SW,SH);ctx.restore();}
  var hb=hellLetterbox(la);
  /* subtitles */
  ctx.save();ctx.textAlign="center";ctx.lineJoin="round";
  var fs=Math.round(Math.min(26,SH*0.065)),ly=SH-hb*0.42;
  if(T>=FIN.voice&&T<FIN.insert){
    var parts=["Se acabó..."];if(T>=FIN.soy)parts.push("tu reinado.");
    var line=parts.join(" "),sa=clamp((T-FIN.voice)/0.3,0,1)*(T<FIN.name?1:clamp((FIN.name+0.6-T)/0.4,0,1));
    if(sa>0){ctx.globalAlpha=sa;ctx.font="italic 800 "+fs+"px Georgia,serif";ctx.strokeStyle="rgba(0,0,0,0.95)";ctx.lineWidth=6;ctx.strokeText(line,SW/2,ly);ctx.fillStyle="#fff3e0";ctx.fillText(line,SW/2,ly);}
  }
  if(T>=FIN.name&&T<FIN.snap){
    var nm=heroName(p).toUpperCase(),nu=clamp((T-FIN.name)/0.35,0,1),pu=1.7-0.7*smooth01(nu),ns=Math.round(Math.min(58,SH*0.15));
    var ny=T<FIN.insert?SH-hb-ns*0.3:SH-hb*0.5+ns*0.32;if(T>=FIN.insert)ns=Math.round(ns*0.75);
    ctx.save();ctx.globalAlpha=nu;ctx.translate(SW/2,ny);ctx.scale(pu,pu);ctx.font="900 "+ns+"px Georgia,serif";
    ctx.strokeStyle="rgba(20,8,0,0.95)";ctx.lineWidth=9;ctx.strokeText(nm,0,0);
    var ng=ctx.createLinearGradient(0,-ns*0.8,0,ns*0.1);ng.addColorStop(0,"#fff8d0");ng.addColorStop(0.5,"#ffd54f");ng.addColorStop(1,"#ff8f00");ctx.fillStyle=ng;ctx.fillText(nm,0,0);
    ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.25*nu*(0.7+0.3*Math.sin(t*4));ctx.fillText(nm,0,0);ctx.restore();
  }
  if(T>1&&T<FIN.insert-0.1){ctx.globalAlpha=0.55;ctx.font="12px system-ui";ctx.fillStyle="#fff";ctx.textAlign="right";ctx.fillText("Toca para saltar",SW-layout.safe.r-14,SH-8);}
  ctx.restore();
  /* snap: white */
  if(T>=FIN.snap+0.22){var wa=smooth01((T-FIN.snap-0.22)/(FIN.white-FIN.snap-0.22));ctx.fillStyle="rgba(255,255,255,"+wa+")";ctx.fillRect(0,0,SW,SH);}
}
function hellLevelDone(){
  game.state="level_done";game.hell.t=0;game.hell.doneTime=game.time;
  try{startMusic("menu");}catch(e){}
  try{grantAccountXP(((game.player.runXP*0.3)|0)+120);}catch(e){}
  sfx("level",1);layoutMenuButtons();
}
var _hellLayoutMenu=layoutMenuButtons;
layoutMenuButtons=function(){
  _hellLayoutMenu();
  if(game&&game.state==="level_done"){
    var bw=Math.min(200,SW*0.26),bh=42,gap=14,y=SH*0.72,cx=SW/2;
    menuBtns=[{id:"menu",label:"Volver al menú",x:cx-bw-gap/2,y:y,w:bw,h:bh},{id:"again",label:"Jugar otra vez",x:cx+gap/2,y:y,w:bw,h:bh}];
  }
};
var _hellMenuClick=handleMenuClick;
handleMenuClick=function(id,st){
  if(id==="again"){sfx("click");ensureAudio();startGame();return;}
  return _hellMenuClick(id,st);
};
document.addEventListener("pointerdown",function(e){
  try{
    if(!game||game.state!=="level_done"||game.hell.t<0.8)return;
    var pt=pointerToScreen(e);
    for(var i=0;i<menuBtns.length;i++)if(inBtn(menuBtns[i],pt.x,pt.y)){handleMenuClick(menuBtns[i].id,"level_done");e.stopPropagation();return;}
  }catch(err){}
},true);
/* ---------- drawing ---------- */
var _thSprTint={};
function thanosDrawZ(z){
  var opts={h:z.h,r:z.r,moving:z.ts==="walk",flash:z.hitFlash>0},sc=layout.scale,s=toScreen(z.x,z.y);
  if(z.alpha!=null&&z.alpha<1)ctx.globalAlpha=Math.max(0,z.alpha);
  var dying=z.ts==="dying";
  if(dying){var u=clamp(z.dyingT/3.2,0,1);ctx.globalAlpha=1-u*u;opts.lift=-u*10;}
  if(z.ts==="stun")opts.lift=-3;
  /* v20.3.3: anticipation — rises while charging a gem, pulls back before the punch */
  var _zx=z.x,_zy=z.y;
  if(z.ts==="wind"){var wu=1-clamp(z.tt/(z.ttMax||0.8),0,1);opts.lift=(opts.lift||0)+smooth01(wu)*5;}
  if(z.ts==="punch_wind"){var pu=smooth01(1-clamp(z.tt/(z.ttMax||0.44),0,1));z.x-=Math.cos(z.lockA||0)*6*pu;z.y-=Math.sin(z.lockA||0)*6*pu;}
  /* gem aura under */
  var gcol=z.tele&&z.gem?GEMS[z.gem].c:z.ts==="snap_wind"?"#ffd54f":"#9c4dff";
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=(dying?0.2:0.28+0.12*Math.sin((game.time||0)*6))*(z.alpha==null?1:z.alpha);
  var aw=(70+(z.tele?16:0))*sc;ctx.drawImage(glowSpr(gcol),s.x-aw,s.y-aw*0.45,aw*2,aw*0.9);ctx.restore();
  if(z.alpha!=null&&z.alpha<1)ctx.globalAlpha=Math.max(0,z.alpha);
  if(!(typeof tryDrawArt==="function"&&tryDrawArt(z.x,z.y,z.look,z.aimAng||0,z.anim,opts))){
    drawChar34(z.x,z.y,makeZombieLook("tank",1),z.aimAng||0,z.anim,opts);
  }
  z.x=_zx;z.y=_zy;
  /* gauntlet glow */
  var e=typeof artEntry==="function"?artEntry(z.look,angDir(z.aimAng||0),"walk"):null;
  if(e&&!dying){
    var m=e.meta,Hh=artTargetH(z.look,sc),Ww=Hh*(m.w/m.h),gx=m.gx!=null?m.gx:0.2,gy=m.gy!=null?m.gy:0.64,fx=m.fx!=null?m.fx:0.5;
    var px=s.x+(gx-fx)*Ww*(e.flip?-1:1),py=s.y-(1-gy)*Hh;z._gsx=px-s.x;z._gsy=py-s.y;
    var gr=(14+16*(z.glow||0.5))*sc*(0.9+0.1*Math.sin((game.time||0)*9));
    ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=Math.min(1,0.45+0.4*(z.glow||0.5))*(z.alpha==null?1:z.alpha);
    var cyc=z.tele&&z.gem?GEMS[z.gem].c:GEMS[GEM_ORDER[((game.time||0)*2|0)%6]].c;
    ctx.drawImage(glowSpr(cyc),px-gr,py-gr,gr*2,gr*2);
    if(z.ts==="snap_wind"||z.glow>1.2){ctx.globalAlpha=0.6;ctx.drawImage(glowSpr("#ffffff"),px-gr*0.6,py-gr*0.6,gr*1.2,gr*1.2);}
    ctx.restore();
  }
  ctx.globalAlpha=1;
}
var _hellDrawZ=drawZ;
drawZ=function(z){if(z&&z.isThanos){thanosDrawZ(z);return;}return _hellDrawZ(z);};
function drawPedestal(q,t){
  var M=MEGA[q.id],s=toScreen(q.x,q.y),sc=layout.scale,bob=Math.sin(t*2.5+q.x)*3*sc;
  /* stone base */
  ctx.fillStyle="rgba(0,0,0,0.35)";fillEllipse(ctx,s.x+3*sc,s.y+2*sc,20*sc,8*sc);
  ctx.fillStyle="#2b2230";ctx.fillRect(s.x-13*sc,s.y-16*sc,26*sc,16*sc);
  ctx.fillStyle="#3d3145";fillEllipse(ctx,s.x,s.y,13*sc,5*sc);
  ctx.fillStyle="#4b3d55";fillEllipse(ctx,s.x,s.y-16*sc,14*sc,5.5*sc);
  ctx.strokeStyle=M.c;ctx.lineWidth=1.5*sc;ctx.globalAlpha=0.8;ctx.beginPath();ctx.ellipse(s.x,s.y-16*sc,11*sc,4*sc,0,0,7);ctx.stroke();ctx.globalAlpha=1;
  /* light column + glow */
  ctx.save();ctx.globalCompositeOperation="lighter";
  var gr=ctx.createLinearGradient(0,s.y-80*sc,0,s.y-16*sc);gr.addColorStop(0,hexA(M.c,0));gr.addColorStop(1,hexA(M.c,0.35));
  ctx.fillStyle=gr;ctx.fillRect(s.x-9*sc,s.y-80*sc,18*sc,64*sc);
  ctx.globalAlpha=0.6+0.25*Math.sin(t*4);ctx.drawImage(glowSpr(M.c),s.x-26*sc,s.y-62*sc+bob,52*sc,52*sc);
  ctx.restore();
  /* icon */
  var ix=s.x,iy=s.y-36*sc+bob;ctx.save();ctx.translate(ix,iy);ctx.scale(sc,sc);
  if(q.id==="hammer"){ctx.rotate(-0.5+Math.sin(t*2)*0.1);
    ctx.fillStyle="#6d4c41";ctx.fillRect(-1.6,-2,3.2,16);ctx.fillStyle="#ffca28";ctx.fillRect(-2,12,4,3);
    ctx.fillStyle="#b0bec5";ctx.fillRect(-9,-9,18,9);ctx.fillStyle="#eceff1";ctx.fillRect(-9,-9,18,3);ctx.fillStyle="#ffca28";ctx.fillRect(-2.5,-9,5,9);
    ctx.strokeStyle="#1a140c";ctx.lineWidth=1;ctx.strokeRect(-9,-9,18,9);}
  else if(q.id==="armor"){
    ctx.fillStyle="#c62828";ctx.beginPath();ctx.moveTo(-10,-8);ctx.lineTo(10,-8);ctx.lineTo(8,6);ctx.lineTo(0,11);ctx.lineTo(-8,6);ctx.closePath();ctx.fill();
    ctx.fillStyle="#ffca28";ctx.beginPath();ctx.moveTo(-6,-8);ctx.lineTo(6,-8);ctx.lineTo(4,-2);ctx.lineTo(-4,-2);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#1a140c";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-10,-8);ctx.lineTo(10,-8);ctx.lineTo(8,6);ctx.lineTo(0,11);ctx.lineTo(-8,6);ctx.closePath();ctx.stroke();
    ctx.globalCompositeOperation="lighter";ctx.drawImage(glowSpr("#80deea"),-6,-1,12,12);}
  else{
    ctx.fillStyle="#43a047";ctx.beginPath();ctx.arc(0,0,9,0,7);ctx.fill();ctx.fillStyle="#66bb6a";
    for(var k=0;k<4;k++){ctx.beginPath();ctx.arc(-6+k*4,-6,2.6,0,7);ctx.fill();}
    ctx.strokeStyle="#1b5e20";ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,9,0,7);ctx.stroke();}
  ctx.restore();
  /* label */
  ctx.save();ctx.textAlign="center";ctx.font="bold "+Math.round(9.5*Math.max(1,sc*0.55))+"px system-ui";ctx.lineJoin="round";
  var ly=s.y-60*sc+bob;ctx.strokeStyle="#120a14";ctx.lineWidth=4;ctx.strokeText(M.n,s.x,ly);ctx.fillStyle=M.c;ctx.fillText(M.n,s.x,ly);
  if(q.prog>0){ctx.strokeStyle=M.c2;ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,s.y-8*sc,18*sc,-1.57,-1.57+6.283*clamp(q.prog,0,1));ctx.stroke();}
  ctx.restore();
}
function hellDrawUnder(){
  var h=game.hell,t=game.time||0,i,o,s,sc=layout.scale;
  if(game.hellPortal)drawHellPortalAt(game.hellPortal.x,game.hellPortal.y,t,26,"#b14cff","#ffd54f");
  if(!HELL.active||!h)return;
  /* floating debris over the lava */
  for(i=0;i<h.debris.length;i++){o=h.debris[i];if(!onScreen(o.x,o.y,40))continue;s=toScreen(o.x,o.y);var b=Math.sin(t*1.3+o.ph)*3*sc,w=o.s*sc;
    ctx.fillStyle="rgba(0,0,0,0.3)";fillEllipse(ctx,s.x,s.y+8*sc,w*0.9,w*0.3);
    ctx.fillStyle="#2a1f24";ctx.beginPath();ctx.moveTo(s.x-w,s.y-w*0.6+b);ctx.lineTo(s.x-w*0.3,s.y-w*1.2+b);ctx.lineTo(s.x+w,s.y-w*0.8+b);ctx.lineTo(s.x+w*0.6,s.y+b);ctx.lineTo(s.x-w*0.7,s.y+w*0.1+b);ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(255,120,40,0.55)";ctx.fillRect(s.x-w*0.6,s.y-w*0.05+b,w*1.1,1.5*sc);}
  for(i=0;i<h.zones.length;i++){o=h.zones[i];s=toScreen(o.x,o.y);var arm=o.t>o.arm;
    ctx.save();ctx.globalAlpha=arm?0.5+0.15*Math.sin(t*10):0.35;ctx.strokeStyle=o.col;ctx.lineWidth=2*sc;ctx.setLineDash(arm?[]:[6,5]);
    ctx.beginPath();ctx.ellipse(s.x,s.y,o.r*sc,o.r*CFG.YSCALE*sc,0,0,7);ctx.stroke();ctx.setLineDash([]);
    if(arm){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.35;ctx.drawImage(glowSpr(o.col),s.x-o.r*sc,s.y-o.r*0.7*sc,o.r*2*sc,o.r*1.4*sc);}ctx.restore();}
  var z=game.boss;
  if(z&&z.ts==="wind"){
    if(z.gem==="power")thDrawPowerTele(z,t);
    if(z.gem==="soul")thDrawSoulTele(z,t);
    if(z.gem==="space")drawMarker(z.tx,z.ty,30,GEMS.space.c,t);
    if(z.gem==="time"){drawMarker(z.cx,z.cy,62,GEMS.time.c,t);s=toScreen(z.cx,z.cy);ctx.save();ctx.strokeStyle=GEMS.time.c;ctx.lineWidth=2*sc;ctx.beginPath();var ang=-1.57+6.283*(1-clamp(z.tt/(z.ttMax||0.95),0,1));ctx.moveTo(s.x,s.y);ctx.lineTo(s.x+Math.cos(ang)*40*sc,s.y+Math.sin(ang)*40*sc*CFG.YSCALE);ctx.stroke();ctx.restore();}
  }
  if(z&&z.ts==="punch_wind")thDrawPunchTele(z,t);
  if(z&&z.ts==="soul")thDrawSoulTele(z,t,1);
  if(z&&z.ts==="wind")thDrawGather(z,t);
  for(i=0;i<h.rings.length;i++){o=h.rings[i];if(o.delay>0&&o.gaps)thDrawPendingRing(o,t);}
  for(i=0;i<h.clock.length;i++){o=h.clock[i];drawSlamRing(o.x,o.y,62*(1+(0.5-o.t)),hexA(GEMS.time.c,o.t*1.6));}
  for(i=0;i<h.safe.length;i++){o=h.safe[i];s=toScreen(o.x,o.y);
    ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.55+0.25*Math.sin(t*8);ctx.drawImage(glowSpr("#ffd54f"),s.x-o.r*1.6*sc,s.y-o.r*1.1*sc,o.r*3.2*sc,o.r*2.2*sc);ctx.restore();
    ctx.strokeStyle="#fff59d";ctx.lineWidth=3*sc;ctx.beginPath();ctx.ellipse(s.x,s.y,o.r*sc,o.r*CFG.YSCALE*sc,0,0,7);ctx.stroke();}
  if(h.phase==="pick")for(i=0;i<h.peds.length;i++)if(!h.peds[i].gone)drawPedestal(h.peds[i],t);
  if(h.glove){var gv=h.glove,gs=toScreen(gv.x,gv.y),du=clamp(gv.t/0.6,0,1),gl=(1-du)*60*sc+(du>=1?Math.sin(t*3)*3*sc+5*sc:Math.abs(Math.sin(du*Math.PI*1.5))*14*sc*(1-du));
    ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.45+0.15*Math.sin(t*5);ctx.drawImage(glowSpr("#4dfff0"),gs.x-28*sc,gs.y-12*sc,56*sc,24*sc);
    ctx.globalAlpha=0.22+0.08*Math.sin(t*3);ctx.drawImage(glowSpr("#fff59d"),gs.x-10*sc,gs.y-90*sc,20*sc,90*sc);ctx.restore();
    ctx.fillStyle="rgba(0,0,0,0.35)";fillEllipse(ctx,gs.x,gs.y,9*sc,3.5*sc);
    drawGauntletAt(gs.x,gs.y-gl,26*sc,0.7+0.3*Math.sin(t*4),t,0);}
}
function hellDrawOver(){
  var h=game.hell,t=game.time||0,i,o,s,sc=layout.scale,p=game.player;
  if(game.hellPortal)drawPortalArrow(game.hellPortal.x,game.hellPortal.y,"#e040fb");
  if(!HELL.active||!h)return;
  for(i=0;i<h.rings.length;i++){o=h.rings[i];if(o.delay>0)continue;ctx.save();ctx.globalCompositeOperation="lighter";if(o.gaps)drawGapRing(o,hexA(o.col,clamp(o.life*1.4,0,1)));else drawSlamRing(o.x,o.y,o.r,hexA(o.col,clamp(o.life*1.4,0,1)));ctx.restore();}
  for(i=0;i<h.clones.length;i++){o=h.clones[i];var ca=o.t<0.3?o.t/0.3:o.t>o.life-0.4?(o.life-o.t)/0.4:1;
    ctx.save();ctx.globalAlpha=0.45*ca;tryDrawArt(o.x,o.y,{kind:"thanos",type:"boss",pose:o.t>o.fire-0.4&&!o.shot?"cast":"walk"},Math.atan2(p.y-o.y,p.x-o.x),0,{h:40,r:16,noShadow:1});
    ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.35*ca;s=toScreen(o.x,o.y);ctx.drawImage(glowSpr("#ff2d4a"),s.x-34*sc,s.y-80*sc,68*sc,80*sc);ctx.restore();}
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(i=0;i<h.orbs.length;i++){o=h.orbs[i];s=toScreen(o.x,o.y);var r=(o.r+5)*sc;
    if(o.trail&&o.trail.length>3){ctx.strokeStyle=hexA(o.col,0.55);ctx.lineCap="round";ctx.lineWidth=o.r*1.1*sc;ctx.beginPath();for(var tj=0;tj<o.trail.length;tj+=2){var ts2=toScreen(o.trail[tj],o.trail[tj+1]);if(tj)ctx.lineTo(ts2.x,ts2.y-14*sc);else ctx.moveTo(ts2.x,ts2.y-14*sc);}ctx.lineTo(s.x,s.y-14*sc);ctx.stroke();}
    ctx.drawImage(glowSpr(o.col),s.x-r*1.6,s.y-14*sc-r*1.6,r*3.2,r*3.2);ctx.drawImage(glowSpr("#ffffff"),s.x-r*0.6,s.y-14*sc-r*0.6,r*1.2,r*1.2);}
  for(i=0;i<h.shots.length;i++){o=h.shots[i];s=toScreen(o.x,o.y);var ln=Math.atan2(o.vy*CFG.YSCALE,o.vx);ctx.save();ctx.translate(s.x,s.y-16*sc);ctx.rotate(ln);ctx.drawImage(glowSpr("#80deea"),-14*sc,-6*sc,28*sc,12*sc);ctx.restore();}
  ctx.restore();
  for(i=0;i<h.fx.length;i++){o=h.fx[i];
    if(o.k==="ring"){ctx.save();ctx.globalCompositeOperation="lighter";drawSlamRing(o.x,o.y,o.r,hexA(o.col,clamp(o.t/o.max,0,1)));ctx.restore();}
    else if(o.k==="burst"){s=toScreen(o.x,o.y);var bu=1-clamp(o.t/o.max,0,1),bw=(30+90*bu)*sc;ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=(1-bu)*0.9;ctx.drawImage(glowSpr(o.col),s.x-bw,s.y-bw*0.55-10*sc,bw*2,bw*1.1);ctx.globalAlpha=(1-bu)*0.7;ctx.drawImage(glowSpr("#ffffff"),s.x-bw*0.4,s.y-bw*0.25-10*sc,bw*0.8,bw*0.5);ctx.restore();}
    else if(o.k==="rift"){s=toScreen(o.x,o.y);var ru=clamp(o.t/o.max,0,1),rw=(10+22*Math.sin(ru*Math.PI))*sc;ctx.save();ctx.globalAlpha=0.85*ru;ctx.fillStyle="#05010d";ctx.beginPath();ctx.ellipse(s.x,s.y,rw,rw*0.42,0,0,7);ctx.fill();
      ctx.globalCompositeOperation="lighter";ctx.strokeStyle=o.col;ctx.lineWidth=3*sc;ctx.beginPath();ctx.ellipse(s.x,s.y,rw,rw*0.42,0,0,7);ctx.stroke();ctx.drawImage(glowSpr(o.col),s.x-rw*1.4,s.y-rw*2.2,rw*2.8,rw*2.6);ctx.restore();}
    else if(o.k==="bolt"){s=toScreen(o.x,o.y);var a2=clamp(o.t/o.max,0,1),x0=s.x,y0=s.y-14*sc,k2,yy,xx=x0;
      ctx.save();ctx.globalCompositeOperation="lighter";ctx.lineCap="round";
      ctx.drawImage(glowSpr("#90caf9"),x0-40*sc,y0-30*sc,80*sc,60*sc);
      for(var pass=0;pass<2;pass++){ctx.strokeStyle=pass?"rgba(255,255,255,"+a2+")":"rgba(100,181,246,"+(0.8*a2)+")";ctx.lineWidth=(pass?2:6)*sc;ctx.beginPath();ctx.moveTo(x0,y0);xx=x0;
        for(k2=1;k2<=7;k2++){yy=y0-k2*(SH/7);xx=x0+Math.sin(o.seed*13+k2*2.7)*16*sc;ctx.lineTo(xx,yy);}ctx.stroke();}
      ctx.restore();}}
  /* hammer in flight / in hand */
  if(p.mega==="hammer"&&game.state!=="hell_final"){
    var hx,hy,rot;
    if(h.hammer){s=toScreen(h.hammer.x,h.hammer.y);hx=s.x;hy=s.y-18*sc;rot=h.hammer.spin;}
    else{hx=p._handSx!=null?p._handSx:toScreen(p.x,p.y).x+8*sc;hy=p._handSy!=null?p._handSy:toScreen(p.x,p.y).y-20*sc;rot=-0.4+(p.atkT>0?-1.4*(p.atkT/0.25):0);}
    if(typeof drawMegaHammer==="function")drawMegaHammer(hx,hy,rot,sc,t,!!h.hammer);else{
    ctx.save();ctx.translate(hx,hy);ctx.rotate(rot);ctx.scale(sc*0.7,sc*0.7);
    ctx.fillStyle="#6d4c41";ctx.fillRect(-1.5,-2,3,15);ctx.fillStyle="#b0bec5";ctx.fillRect(-8,-9,16,8);ctx.fillStyle="#eceff1";ctx.fillRect(-8,-9,16,2.5);ctx.fillStyle="#ffca28";ctx.fillRect(-2,-9,4,8);
    ctx.strokeStyle="#1a140c";ctx.lineWidth=1.2;ctx.strokeRect(-8,-9,16,8);ctx.restore();}
  }
  if(p.mega==="armor"&&game.state!=="hell_final"){s=toScreen(p.x,p.y);var cy2=s.y-artTargetH(p.look,sc)*0.62;ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.8+0.2*Math.sin(t*10);ctx.drawImage(glowSpr("#80deea"),s.x-7*sc,cy2-7*sc,14*sc,14*sc);ctx.restore();
    if(p.beamT>0){var e2=toScreen(p.x+Math.cos(p.beamA)*380,p.y+Math.sin(p.beamA)*380);ctx.save();ctx.globalCompositeOperation="lighter";ctx.lineCap="round";
      ctx.strokeStyle="rgba(128,222,234,0.55)";ctx.lineWidth=(16+3*Math.sin(t*40))*sc;ctx.beginPath();ctx.moveTo(s.x,cy2);ctx.lineTo(e2.x,e2.y-16*sc);ctx.stroke();
      ctx.strokeStyle="rgba(255,255,255,0.95)";ctx.lineWidth=5*sc;ctx.stroke();ctx.drawImage(glowSpr("#e0f7fa"),s.x-22*sc,cy2-22*sc,44*sc,44*sc);ctx.restore();}}
  if(p.mega==="hulk"&&p.leap){s=toScreen(p.leap.tx,p.leap.ty);drawMarker(p.leap.tx,p.leap.ty,p.leap.big?120:72,"#76ff03",t);}
  /* soul tether */
  var z=game.boss;
  if(z&&(z.ts==="soul"||(z.ts==="wind"&&z.gem==="soul"))){var a3=toScreen(z.x,z.y),b3=toScreen(p.x,p.y);ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle=z.ts==="soul"?"rgba(255,154,31,0.85)":"rgba(255,154,31,"+(0.3+0.3*Math.sin(t*20))+")";ctx.lineWidth=(z.ts==="soul"?5:2)*sc;
    ctx.beginPath();ctx.moveTo(a3.x,a3.y-46*sc);ctx.quadraticCurveTo((a3.x+b3.x)/2,(a3.y+b3.y)/2-40*sc+Math.sin(t*12)*8,b3.x,b3.y-16*sc);ctx.stroke();ctx.restore();}
  if(h.glove&&h.glove.t>0.6&&game.state==="playing")drawPortalArrow(h.glove.x,h.glove.y-6,"#ffd54f");
}
var _hellUnder=typeof drawEventsUnder==="function"?drawEventsUnder:null,_hellOver=typeof drawEventsOver==="function"?drawEventsOver:null;
drawEventsUnder=function(){if(_hellUnder&&!HELL.active)_hellUnder();hellDrawUnder();};
drawEventsOver=function(){if(_hellOver&&!HELL.active)_hellOver();hellDrawOver();};
var _hellAtmo=null;
function hellAtmosphere(){
  var h=game.hell,t=game.time||0,i,e;
  /* v20.5.1 perf: baked at device resolution and blitted 1:1 (was a CSS-size layer upscaled over the whole screen every frame) */
  var M=ctx.getTransform(),dev=M.b===0&&M.c===0&&M.e===0&&M.f===0;
  if(!_hellAtmo||_hellAtmo.w!==SW||_hellAtmo.h!==SH||_hellAtmo.k!==(dev?M.a:1)||(dev&&_hellAtmo.cw!==canvas.width)){
    var k=dev?M.a:1,c=document.createElement("canvas");c.width=dev?canvas.width:Math.max(1,SW|0);c.height=dev?canvas.height:Math.max(1,SH|0);var g=c.getContext("2d");g.setTransform(k,0,0,dev?M.d:1,0,0);
    var gr=g.createLinearGradient(0,0,0,SH);gr.addColorStop(0,"rgba(255,70,20,0.22)");gr.addColorStop(0.35,"rgba(120,20,60,0.08)");gr.addColorStop(1,"rgba(60,0,60,0.16)");
    g.fillStyle=gr;g.fillRect(0,0,SW,SH);
    var rg=g.createRadialGradient(SW/2,SH/2,Math.min(SW,SH)*0.3,SW/2,SH/2,Math.max(SW,SH)*0.75);rg.addColorStop(0,"rgba(0,0,0,0)");rg.addColorStop(1,"rgba(40,0,20,0.4)");
    g.fillStyle=rg;g.fillRect(0,0,SW,SH);_hellAtmo={c:c,w:SW,h:SH,k:k,cw:canvas.width,dev:dev};
  }
  if(_hellAtmo.dev){ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(_hellAtmo.c,0,0);ctx.setTransform(M);}else ctx.drawImage(_hellAtmo.c,0,0);
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(i=0;i<h.embers.length;i++){e=h.embers[i];e.y-=e.v*0.016;if(e.y<-0.05){e.y=1.05;e.x=Math.random();}
    var x=e.x*SW+Math.sin(t*1.5+e.ph)*14,y=e.y*SH;ctx.globalAlpha=0.55+0.35*Math.sin(t*5+e.ph);ctx.fillStyle=i%3?"#ff8a3d":"#ffd27a";ctx.fillRect(x,y,e.s,e.s);}
  ctx.restore();
}
function hellLetterbox(a){var hb=SH*0.13*a;ctx.fillStyle="#000";ctx.fillRect(0,0,SW,hb);ctx.fillRect(0,SH-hb,SW,hb);return hb;}
function hellDrawScreen(){
  var st=game.state,h=game.hell,t,i;
  if(HELL.active&&h&&(st==="playing"||st==="hell_cine"||st==="pause"||st==="hell_trans"||st==="dead"||st==="level_done"||st==="hell_final"))hellAtmosphere();
  if(HELL.active&&h&&h.flash>0){ctx.fillStyle="rgba(255,255,240,"+clamp(h.flash*1.4,0,0.8)+")";ctx.fillRect(0,0,SW,SH);}
  if(st==="hell_trans"){
    t=clamp(HELL.transT/1.05,0,1);var P=toScreen(HELL.transP.x,HELL.transP.y),R=Math.max(SW,SH)*1.3*t*t;
    ctx.save();var col=HELL.transKind==="in"?"#b14cff":"#ffb300";
    var gr=ctx.createRadialGradient(P.x,P.y-20,0,P.x,P.y-20,Math.max(10,R));gr.addColorStop(0,"rgba(255,255,255,"+t+")");gr.addColorStop(0.5,hexA(col,0.9*t));gr.addColorStop(1,hexA(col,0));
    ctx.fillStyle=gr;ctx.fillRect(0,0,SW,SH);
    ctx.globalCompositeOperation="lighter";ctx.strokeStyle=hexA(col,0.6);ctx.lineWidth=3;
    for(i=0;i<9;i++){var a=i*0.7+HELL.transT*7;ctx.beginPath();ctx.arc(P.x,P.y-20,(20+i*26)*(0.4+t),a,a+1.4);ctx.stroke();}
    ctx.restore();
    if(t>0.85){ctx.fillStyle="rgba(255,250,240,"+((t-0.85)/0.15)+")";ctx.fillRect(0,0,SW,SH);}
    return 1;
  }
  if(st==="hell_cine"){
    t=HELL.cineT;var z=game.boss;
    var a=clamp(t/0.5,0,1)*(t>5.2?clamp((5.75-t)/0.55,0,1):1);
    var hb=hellLetterbox(a);
    if(t<0.6){ctx.fillStyle="rgba(255,250,240,"+(1-t/0.6)+")";ctx.fillRect(0,0,SW,SH);}
    ctx.save();ctx.textAlign="center";
    if(t>0.9&&t<5.4){var na=clamp((t-0.9)/0.4,0,1)*clamp((5.4-t)/0.4,0,1),pu=t<1.3?1.8-0.8*((t-0.9)/0.4):1;
      ctx.globalAlpha=na;ctx.save();ctx.translate(SW/2,hb*0.62);ctx.scale(pu,pu);ctx.font="900 "+Math.round(Math.min(40,SH*0.1))+"px system-ui";ctx.lineJoin="round";
      ctx.strokeStyle="rgba(0,0,0,0.9)";ctx.lineWidth=7;ctx.strokeText("VORGATH",0,0);
      var tg=ctx.createLinearGradient(0,-30,0,6);tg.addColorStop(0,"#e0f7fa");tg.addColorStop(1,"#26c6da");ctx.fillStyle=tg;ctx.fillText("VORGATH",0,0);ctx.restore();}
    if(t>2.0&&t<5.3){
      var line="Este mundo ya es mío.",nch=Math.min(line.length,Math.floor((t-2.0)/1.3*line.length)+1),sa=clamp((5.3-t)/0.4,0,1);
      ctx.globalAlpha=sa;ctx.font="italic 800 "+Math.round(Math.min(26,SH*0.065))+"px Georgia,serif";ctx.lineJoin="round";
      var ly=SH-hb*0.42;ctx.strokeStyle="rgba(0,0,0,0.95)";ctx.lineWidth=6;ctx.strokeText("«"+line.slice(0,nch)+(nch<line.length?"":"»"),SW/2,ly);
      ctx.fillStyle="#fff3e0";ctx.fillText("«"+line.slice(0,nch)+(nch<line.length?"":"»"),SW/2,ly);}
    if(t>1){ctx.globalAlpha=0.55;ctx.font="12px system-ui";ctx.fillStyle="#fff";ctx.textAlign="right";ctx.fillText("Toca para saltar",SW-layout.safe.r-14,SH-8);}
    ctx.restore();
    return 1;
  }
  if(st==="hell_final"){drawHellFinal();return 1;}
  if(st==="level_done"){drawLevelDone();return 1;}
  return 0;
}
function hellDrawHUDExtra(){
  var p=game.player,h=game.hell,s=layout.safe,t=game.time||0;
  if(HELL.active&&p&&p.mega){
    var M=MEGA[p.mega];hudFont("bold",11);var txt="⚡ "+M.n,w=ctx.measureText(txt).width+18,x=s.l+12,y=s.t+86;
    hudGlass(x,y,w,22,8);ctx.fillStyle=M.c;ctx.fillText(txt,x+9,y+15);
    if(p.slowT>0){hudFont("bold",10);ctx.fillStyle=GEMS.time.c;ctx.fillText("RALENTIZADO",x+w+8,y+15);}
  }
  if(HELL.active&&h&&h.safe&&h.safe.length&&game.boss){
    var z=game.boss,u=clamp(z.tt/4,0,1);
    ctx.save();ctx.textAlign="center";hudFont("900",Math.round(Math.min(22,SH*0.055)));ctx.lineJoin="round";
    var ty=SH*0.3,msg="¡VA A DESATAR EL ABISMO!";ctx.strokeStyle="#000";ctx.lineWidth=6;ctx.strokeText(msg,SW/2,ty);ctx.fillStyle="#ffd54f";ctx.fillText(msg,SW/2,ty);
    hudFont("bold",14);msg="Corre a un círculo dorado";ctx.lineWidth=4;ctx.strokeText(msg,SW/2,ty+22);ctx.fillStyle="#fff8e1";ctx.fillText(msg,SW/2,ty+22);
    var bw=200;ctx.fillStyle="rgba(0,0,0,0.6)";ctx.fillRect(SW/2-bw/2,ty+32,bw,7);ctx.fillStyle="#ffd54f";ctx.fillRect(SW/2-bw/2,ty+32,bw*u,7);
    ctx.restore();
  }
  if(game.hellPortal||(h&&h.exit)){}
}
function drawLevelDone(){
  var h=game.hell,t=h?h.t:1,p=game.player,a=clamp(t/0.6,0,1);
  ctx.fillStyle="rgba(8,4,14,"+(0.82*a)+")";ctx.fillRect(0,0,SW,SH);
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.35*a;ctx.drawImage(glowSpr("#ffb300"),SW/2-SW*0.45,SH*0.02,SW*0.9,SH*0.5);ctx.restore();
  ctx.save();ctx.textAlign="center";ctx.globalAlpha=a;
  var pu=t<0.6?1.6-0.6*(t/0.6):1+0.02*Math.sin(t*3);
  ctx.save();ctx.translate(SW/2,SH*0.22);ctx.scale(pu,pu);ctx.font="900 "+Math.round(Math.min(40,SW*0.05))+"px system-ui";ctx.lineJoin="round";
  ctx.strokeStyle="#1a0f00";ctx.lineWidth=8;ctx.strokeText("¡PRIMER MUNDO COMPLETADO!",0,0);
  var g=ctx.createLinearGradient(0,-30,0,8);g.addColorStop(0,"#fff59d");g.addColorStop(1,"#ffb300");ctx.fillStyle=g;ctx.fillText("¡PRIMER MUNDO COMPLETADO!",0,0);ctx.restore();
  hudFont("italic",14);ctx.fillStyle="#e1bee7";ctx.fillText("Has derrotado a Vorgath. El Brazal del Abismo es tuyo.",SW/2,SH*0.22+26);
  var hero=(HEROES.filter(function(x){return x.id===p.hero;})[0]||{}).name||"—";
  var tt=(h&&h.doneTime)||game.time||0,mm=Math.floor(tt/60),ss=Math.floor(tt%60);
  var rows=[["Bajas",""+(game.kills||0)],["Tiempo",mm+":"+(ss<10?"0":"")+ss],["Héroe",hero],["Megapoder",p.mega?MEGA[p.mega].n:"—"]];
  var bw=Math.min(420,SW*0.56),bx=SW/2-bw/2,by=SH*0.36,bh=rows.length*22+14;
  hudGlass(bx,by,bw,bh,10);
  for(var i=0;i<rows.length;i++){hudFont("bold",13);ctx.textAlign="left";ctx.fillStyle="#bdbdbd";ctx.fillText(rows[i][0],bx+18,by+26+i*22);ctx.textAlign="right";ctx.fillStyle="#fff8e1";ctx.fillText(rows[i][1],bx+bw-18,by+26+i*22);}
  ctx.textAlign="center";
  for(i=0;i<menuBtns.length;i++){var b=menuBtns[i];ctx.fillStyle=b.id==="again"?"#ffb300":"rgba(255,255,255,0.12)";roundRect(ctx,b.x,b.y,b.w,b.h,10);ctx.fill();
    ctx.strokeStyle=b.id==="again"?"#5d3a00":"rgba(255,255,255,0.4)";ctx.lineWidth=2;roundRect(ctx,b.x,b.y,b.w,b.h,10);ctx.stroke();
    hudFont("bold",15);ctx.fillStyle=b.id==="again"?"#2a1600":"#fff";ctx.fillText(b.label,b.x+b.w/2,b.y+b.h/2+5);}
  hudFont("italic",13);ctx.fillStyle="#ffcc80";ctx.globalAlpha=a*(0.7+0.3*Math.sin(t*3));ctx.fillText("Mundo 2 próximamente",SW/2,SH*0.72+66);
  ctx.restore();ctx.textAlign="left";
  if(HELL.finWhite){var wa=1-clamp(t/1.2,0,1);if(wa<=0)HELL.finWhite=0;else{ctx.fillStyle="rgba(255,255,255,"+wa+")";ctx.fillRect(0,0,SW,SH);}}
}
/* test hooks */
window.__hell={enter:function(){hellEnter();},pick:function(id){var p=game.player;megaPick(p,id);},state:function(){return{st:game.state,h:game.hell&&game.hell.phase,boss:game.boss&&{hp:game.boss.hp,max:game.boss.maxHp,ts:game.boss.ts}};},openPortal:hellOpenPortal,cineEnd:function(){hellCineEnd();},snap:function(){thanosStartSnap(game.boss);},kill:function(){var z=game.boss;if(!z)return;z.snapDone=1;thanosDie(z);},glove:function(){return game.hell&&game.hell.glove;},final:function(){hellFinalStart();},finT:function(){return HELL.finT;}};
var _hellZoneAt=typeof zoneAt==="function"?zoneAt:null;
zoneAt=function(x,y){if(HELL.active)return{name:"Planeta perdido"};return _hellZoneAt?_hellZoneAt(x,y):null;};

/* ---------- v20.3.3: clearer Thanos telegraphs ---------- */
function thEll(s,r,a0,a1){ctx.beginPath();ctx.ellipse(s.x,s.y,r,r*CFG.YSCALE,0,a0,a1);}
function thDrawPowerTele(z,t){ /* expanding danger ring with the 3 SAFE lanes shown in bright white */
  var s=toScreen(z.x,z.y),sc=layout.scale,u=1-clamp(z.tt/(z.ttMax||0.9),0,1),R=(40+200*u)*sc,g=z.ringG||[],i,a,col=GEMS.power.c;
  ctx.save();ctx.globalAlpha=0.16+0.18*u;ctx.fillStyle=col;thEll(s,R,0,7);ctx.fill();
  ctx.globalAlpha=0.6+0.4*Math.sin(t*14);ctx.strokeStyle=col;ctx.lineWidth=3*sc;ctx.setLineDash([10*sc,7*sc]);thEll(s,R,0,7);ctx.stroke();ctx.setLineDash([]);
  ctx.globalAlpha=0.9;ctx.lineCap="round";
  for(i=0;i<g.length;i++){a=g[i];var ex=Math.cos(a),ey=Math.sin(a)*CFG.YSCALE;
    ctx.strokeStyle="rgba(255,255,255,0.9)";ctx.lineWidth=4*sc;ctx.beginPath();ctx.moveTo(s.x+ex*R*0.35,s.y+ey*R*0.35);ctx.lineTo(s.x+ex*(R+18*sc),s.y+ey*(R+18*sc));ctx.stroke();
    ctx.strokeStyle="rgba(170,255,200,0.9)";ctx.lineWidth=5*sc;thEll(s,R,a-0.34,a+0.34);ctx.stroke();}
  ctx.restore();
}
function thDrawPendingRing(o,t){ /* phase-2 follow-up ring: shows where it will come from and its gaps */
  var s=toScreen(o.x,o.y),sc=layout.scale,R=(22+8*Math.sin(t*16))*sc,i,a;
  ctx.save();ctx.globalAlpha=0.8;ctx.strokeStyle=o.col;ctx.lineWidth=3*sc;thEll(s,R,0,7);ctx.stroke();
  ctx.strokeStyle="rgba(255,255,255,0.85)";ctx.lineWidth=3*sc;ctx.lineCap="round";
  for(i=0;i<o.gaps.length;i++){a=o.gaps[i];ctx.beginPath();ctx.moveTo(s.x+Math.cos(a)*R,s.y+Math.sin(a)*R*CFG.YSCALE);ctx.lineTo(s.x+Math.cos(a)*(R+60*sc),s.y+Math.sin(a)*(R+60*sc)*CFG.YSCALE);ctx.stroke();}
  ctx.restore();
}
function thDrawPunchTele(z,t){ /* filling disc = exact punch reach */
  var s=toScreen(z.x,z.y),sc=layout.scale,u=1-clamp(z.tt/(z.ttMax||0.44),0,1),R=48*sc,col=GEMS.space.c;
  ctx.save();ctx.globalAlpha=0.18+0.22*u;ctx.fillStyle=col;thEll(s,R*u,0,7);ctx.fill();
  ctx.globalAlpha=0.85;ctx.strokeStyle=col;ctx.lineWidth=3*sc;thEll(s,R,0,7);ctx.stroke();
  var a=z.lockA||0;ctx.strokeStyle="#ffffff";ctx.lineWidth=2.5*sc;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x+Math.cos(a)*R,s.y+Math.sin(a)*R*CFG.YSCALE);ctx.stroke();
  ctx.restore();
}
function thDrawSoulTele(z,t,active){ /* reach of the soul pull: get out of the circle */
  var s=toScreen(z.x,z.y),sc=layout.scale,R=THANOS_SOUL_R*sc,col=GEMS.soul.c,u=active?1:1-clamp(z.tt/(z.ttMax||0.9),0,1);
  ctx.save();ctx.globalAlpha=active?0.1:0.06+0.1*u;ctx.fillStyle=col;thEll(s,R,0,7);ctx.fill();
  ctx.globalAlpha=0.55+0.35*Math.sin(t*12);ctx.strokeStyle=col;ctx.lineWidth=2.5*sc;ctx.setLineDash(active?[]:[9*sc,7*sc]);thEll(s,R,0,7);ctx.stroke();ctx.setLineDash([]);
  if(!active){ctx.globalAlpha=0.5;ctx.lineWidth=2*sc;thEll(s,R*(1-u)+20*sc*u,0,7);ctx.stroke();}
  ctx.restore();
}
function thDrawGather(z,t){ /* gem energy converging into the gauntlet while Thanos charges */
  var s=toScreen(z.x,z.y),sc=layout.scale,u=1-clamp(z.tt/(z.ttMax||0.8),0,1),col=GEMS[z.gem].c,R=(34*(1-u)+6)*sc;
  var gx=s.x+(z._gsx!=null?z._gsx:0),gy=s.y+(z._gsy!=null?z._gsy:-46*sc);
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.35+0.5*u;ctx.strokeStyle=col;ctx.lineWidth=(2+3*u)*sc;
  ctx.beginPath();ctx.arc(gx,gy,R,0,7);ctx.stroke();
  ctx.globalAlpha=0.25+0.5*u;var gw=(18+26*u)*sc;ctx.drawImage(glowSpr(col),gx-gw,gy-gw,gw*2,gw*2);ctx.restore();
}
