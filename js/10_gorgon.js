/* v20.2.0 — GORGON (round 8): a lanky, pale flower-faced horror from the other side.
   Opens dark-red rifts, sinks through them and ambushes the player, lunges with long claws,
   summons small horrors from portals and roars with its petal face opened wide.
   Phase 2 (<50% HP): faster, more portals, rifts stay open longer. */
function spawnGorgon(x,y){
  var z=spawnZombie("boss",x,y,7);
  var bs=(typeof waveDifficulty==="function"?waveDifficulty(7).bossHp:1.15);
  z.hp=Math.round(1400*bs);z.maxHp=z.hp;z.isBoss=1;z.isGorgon=1;z.r=19*CFG.CHAR;z.h=58*CFG.CHAR;z.speed=96*CFG.SPD;
  z.damage=Math.round(20*bs);z.score=1000;z.xp=420;
  z.look={kind:"gorgon",type:"boss",open:0};z.phase="intro";z.introT=4.2;z.atkCd=1.6;z.windup=null;z.windupT=0;
  z.gs="walk";z.gt=0;z.p2=0;z.bName="GORGON";z.spawnT=0;z.sink=1;z.ghost=1;z.clawCd=1.2;z.portalCd=4.5;z.summonCd=8;z.roarCd=12;
  z.bubbleText="";z.bubbleFull="";z.bubbleIdx=0;z.bubbleT=0;z.rings=[];z.slash=0;z.roared=0;z.introRoar=0;
  if(typeof spawnBlocked==="function"&&spawnBlocked(z.x,z.y,16)&&typeof placeOnGround==="function")placeOnGround(z);
  return z;
}
/* ---------- portals (dark-red Upside-Down rifts) ---------- */
var _portalSpr=null,_portalGlow=null;
function portalSprites(){
  if(_portalSpr)return;
  var c=document.createElement("canvas");c.width=160;c.height=80;var g=c.getContext("2d"),gr,i,a,r;
  gr=g.createRadialGradient(80,40,4,80,40,78);
  gr.addColorStop(0,"rgba(5,0,2,1)");gr.addColorStop(0.42,"rgba(28,0,6,0.98)");gr.addColorStop(0.62,"rgba(120,6,18,0.9)");
  gr.addColorStop(0.8,"rgba(190,24,30,0.55)");gr.addColorStop(1,"rgba(120,0,10,0)");
  g.save();g.scale(1,0.5);g.fillStyle=gr;g.beginPath();g.arc(80,80,78,0,7);g.fill();g.restore();
  /* jagged crack veins radiating out */
  g.strokeStyle="rgba(255,70,60,0.85)";g.lineCap="round";
  for(i=0;i<11;i++){
    a=i/11*6.283+((i*37)%7)*0.05;r=26+((i*13)%9);
    g.lineWidth=1.6;g.beginPath();g.moveTo(80+Math.cos(a)*22,40+Math.sin(a)*11);
    g.lineTo(80+Math.cos(a+0.12)*r*1.4,40+Math.sin(a+0.12)*r*0.7);
    g.lineTo(80+Math.cos(a-0.05)*r*2.3,40+Math.sin(a-0.05)*r*1.15);g.stroke();
  }
  _portalSpr=c;
  var c2=document.createElement("canvas");c2.width=64;c2.height=64;var h=c2.getContext("2d");
  gr=h.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,"rgba(255,60,50,0.9)");gr.addColorStop(0.4,"rgba(200,10,30,0.45)");gr.addColorStop(1,"rgba(120,0,20,0)");
  h.fillStyle=gr;h.fillRect(0,0,64,64);_portalGlow=c2;
}
function addPortal(x,y,o){
  if(!game.portals)game.portals=[];
  o=o||{};
  var pt={x:x,y:y,r:4,rMax:o.r||30,life:o.life||2,maxLife:o.life||2,tele:o.tele||0,spawnT:o.spawnT!=null?o.spawnT:-1,spawnN:o.spawnN||0,pt:0,seed:Math.random()*6};
  game.portals.push(pt);
  if(game.portals.length>8)game.portals.shift();
  return pt;
}
function gorgonMinionsAlive(){
  var n=0,i,z;for(i=0;i<game.zombies.length;i++){z=game.zombies[i];if(!z.dead&&!z.dying&&z.fromPortal)n++;}return n;
}
function updatePortals(dt){
  var a=game.portals;if(!a||!a.length)return;
  var i,pt,k,typ,m,lim;
  for(i=a.length-1;i>=0;i--){
    pt=a[i];pt.life-=dt;
    var grow=pt.maxLife-pt.life;
    pt.r=pt.life<0.35?pt.rMax*Math.max(0,pt.life/0.35):pt.rMax*Math.min(1,0.15+grow/0.3);
    pt.pt-=dt;
    if(pt.pt<=0&&pt.r>8){
      pt.pt=0.07;
      var ang=Math.random()*6.283,rr=Math.random()*pt.r*0.8;
      addParticle(pt.x+Math.cos(ang)*rr,pt.y+Math.sin(ang)*rr*0.5,Math.random()<0.5?"#ff3d3d":"#5a0010",0.7,rand(-8,8),rand(-46,-18),rand(2,4),3);
    }
    if(pt.spawnT>0){
      pt.spawnT-=dt;
      if(pt.spawnT<=0&&pt.spawnN>0){
        lim=game.boss&&game.boss.p2?7:5;
        for(k=0;k<pt.spawnN&&gorgonMinionsAlive()<lim;k++){
          typ=Math.random()<0.55?"fast":(Math.random()<0.5?"crawler":"normal");
          m=spawnZombie(typ,pt.x+rand(-8,8),pt.y+rand(-5,5),game.wave);
          m.fromPortal=1;m.xp=Math.round((m.xp||10)*0.5);m.score=Math.round((m.score||10)*0.5);
          if(typeof placeOnGround==="function")placeOnGround(m);
          game.zombies.push(m);
        }
        sfx("portal",0.5);
      }
    }
    if(pt.life<=0)a.splice(i,1);
  }
}
function drawPortals(){
  var a=game.portals;if(!a||!a.length)return;portalSprites();
  var i,pt,s,sc=layout.scale,w,h,pul,t=game.time||0;
  for(i=0;i<a.length;i++){
    pt=a[i];if(pt.r<1)continue;s=toScreen(pt.x,pt.y);
    if(s.x<-120||s.x>SW+120||s.y<-80||s.y>SH+80)continue;
    pul=1+0.06*Math.sin(t*9+pt.seed);
    w=pt.r*2.3*sc*pul;h=w*0.5*CFG.YSCALE/0.7;
    ctx.drawImage(_portalSpr,s.x-w/2,s.y-h/2,w,h);
    ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.5+0.25*Math.sin(t*7+pt.seed);
    ctx.drawImage(_portalGlow,s.x-w*0.55,s.y-h*0.75,w*1.1,h*1.3);
    ctx.restore();
    if(pt.tele){
      var tp=clamp(1-pt.life/pt.maxLife,0,1);
      ctx.save();ctx.strokeStyle="#ff1744";ctx.lineWidth=2.5;ctx.globalAlpha=0.55+0.45*Math.sin(t*18);
      ctx.beginPath();ctx.ellipse(s.x,s.y,(pt.rMax+26*(1-tp))*sc,(pt.rMax+26*(1-tp))*CFG.YSCALE*sc,0,0,7);ctx.stroke();ctx.restore();
    }
  }
}
/* ---------- AI ---------- */
function gorgonSpot(cx,cy,rmin,rmax,rad){
  var i,ang,r,x,y;
  for(i=0;i<70;i++){
    ang=Math.random()*6.283;r=rmin+Math.random()*(rmax-rmin);x=cx+Math.cos(ang)*r;y=cy+Math.sin(ang)*r;
    if(typeof spawnBlocked==="function"){if(!spawnBlocked(x,y,rad||16))return{x:x,y:y};}
    else if(!circleHitSolid(x,y,rad||22))return{x:x,y:y};
  }
  return null;
}
function gorgonSet(z,s,t){z.gs=s;z.gt=t;}
function gorgonOpen(z,v){z.look.open=v?1:0;}
function gorgonIntroTick(z,dt){
  var t=z.introT;
  if(!z._introPortal){z._introPortal=1;addPortal(z.x,z.y,{r:36,life:4.6});sfx("portal",0.7);}
  z.sink=t>3.0?clamp((t-3.0)/1.0,0,1):0;z.ghost=0;
  if(t<2.75&&!z.introRoar){z.introRoar=1;gorgonOpen(z,1);sfx("gorgon_roar",1);shake(14);z.roarT=2.9;
    for(var i=0;i<12;i++)addParticle(z.x+rand(-22,22),z.y+rand(-10,10),i%2?"#ff3d3d":"#3a0008",0.8,rand(-60,60),rand(-90,-20),rand(3,6),3);}
  if(z.roarT>0){z.roarT-=dt;if(z.roarT<=0)gorgonOpen(z,0);}
}
function gorgonIntroEnd(z){z.sink=0;z.ghost=0;gorgonOpen(z,0);gorgonSet(z,"walk",0);z.clawCd=0.8;shake(8);sfx("gorgon_growl",0.9);}
function gorgonClawHit(z,p,dmg){
  var ang=Math.atan2(p.y-z.y,p.x-z.x);
  if(dist(z.x,z.y,p.x,p.y)<z.r+p.r+22){
    hurtPlayer(p,dmg);
    z.clawFx={x:p.x,y:p.y,t:0.28,ang:ang};
    shake(8);return 1;
  }
  return 0;
}
function updateGorgon(z,dt){
  var p=game.player,dx=p.x-z.x,dy=p.y-z.y,d=Math.sqrt(dx*dx+dy*dy)||1,sp,sp2,i;
  updateRings(z,dt);
  if(z.slash>0)z.slash-=dt;
  if(z.clawFx){z.clawFx.t-=dt;if(z.clawFx.t<=0)z.clawFx=null;}
  if(z.roarT>0){z.roarT-=dt;}
  z.clawCd-=dt;z.portalCd-=dt;z.summonCd-=dt;z.roarCd-=dt;
  /* phase 2 */
  if(!z.p2&&z.hp<=z.maxHp*0.5&&z.gs!=="under"&&z.gs!=="sink"&&z.gs!=="tele"){
    z.p2=1;z.speed*=1.2;floatText(z.x,z.y-30,"FASE 2","#ff1744");sfx("sting");
    gorgonSet(z,"roar_wind",0.45);gorgonOpen(z,1);z.roarCd=0;z.summonCd=Math.min(z.summonCd,3);z.portalCd=Math.min(z.portalCd,2.5);
    for(i=0;i<2;i++){var ps=gorgonSpot(z.x,z.y,90,170,18);if(ps)addPortal(ps.x,ps.y,{r:28,life:5,spawnT:1.2,spawnN:1});}
    return;
  }
  z.gt-=dt;
  switch(z.gs){
  case "walk":
    gorgonOpen(z,z.roarT>0);
    if(z.stun>0)return;
    if(d<78&&z.clawCd<=0){gorgonSet(z,"claw_wind",z.p2?0.3:0.42);gorgonOpen(z,1);z.lockA=Math.atan2(dy,dx);sfx("gorgon_growl",0.6);return;}
    if(z.roarCd<=0&&d<230){gorgonSet(z,"roar_wind",z.p2?0.5:0.65);gorgonOpen(z,1);return;}
    if(z.summonCd<=0&&gorgonMinionsAlive()<(z.p2?5:3)){gorgonSet(z,"summon_wind",0.6);gorgonOpen(z,1);return;}
    if(z.portalCd<=0&&d>70){gorgonSet(z,"sink",0.55);addPortal(z.x,z.y,{r:30,life:z.p2?2.6:1.5});sfx("portal",0.8);return;}
    sp=z.speed*(z.slow>0?0.6:1);
    var fd=typeof flowDir==="function"?flowDir(z.x,z.y):null,ax=dx/d,ay=dy/d;
    if(fd&&(fd.x||fd.y)&&d>60){var cg=typeof chaseDir==="function"?chaseDir(z,dx,dy,d):null;if(cg){ax=cg.x;ay=cg.y;}else{var l=Math.sqrt(fd.x*fd.x+fd.y*fd.y)||1;ax=fd.x/l;ay=fd.y/l;}}
    if(typeof moveWithSlide==="function")moveWithSlide(z,ax*sp*dt,ay*sp*dt);else{z.x+=ax*sp*dt;z.y+=ay*sp*dt;resolveCircle(z);}
    z.aimAng=Math.atan2(dy,dx);
    if(d<z.r+p.r+4){hurtPlayer(p,Math.round(z.damage*0.6));}
    break;
  case "claw_wind":
    z.aimAng=z.lockA=Math.atan2(dy,dx);
    if(z.gt<=0){gorgonSet(z,"lunge",0.2);z.hitDone=0;sfx("slash");}
    break;
  case "lunge":
    sp2=Math.min(520,d/0.2+60);
    if(typeof moveWithSlide==="function")moveWithSlide(z,Math.cos(z.lockA)*sp2*dt,Math.sin(z.lockA)*sp2*dt);
    if(Math.random()<0.6)addParticle(z.x,z.y,"#7a0a14",0.25,-Math.cos(z.lockA)*40,-Math.sin(z.lockA)*40,7,4);
    if(!z.hitDone&&gorgonClawHit(z,p,z.damage+(z.p2?4:0))){z.hitDone=1;}
    if(z.gt<=0){z.slash=0.18;gorgonSet(z,"recover",z.p2?0.35:0.5);z.clawCd=z.p2?0.9:1.3;}
    break;
  case "recover":
    if(z.gt<=0){gorgonOpen(z,0);gorgonSet(z,"walk",0);}
    break;
  case "roar_wind":
    z.aimAng=Math.atan2(dy,dx);
    if(z.gt<=0){
      sfx("gorgon_roar",0.95);shake(14);z.roarT=1.1;
      z.rings.push({r:16,vr:260,life:0.75,dmg:z.p2?16:13});
      for(i=0;i<14;i++)addParticle(z.x+rand(-20,20),z.y+rand(-10,8),i%2?"#ff3d3d":"#2a0006",0.7,rand(-90,90),rand(-80,-10),rand(3,6),3);
      gorgonSet(z,"recover",0.9);z.roarCd=z.p2?8:11.5;
    }
    break;
  case "summon_wind":
    z.aimAng=Math.atan2(dy,dx);
    if(z.gt<=0){
      var n=z.p2?3:2,k,s2;
      for(k=0;k<n;k++){s2=gorgonSpot(p.x,p.y,110,180,18);if(s2)addPortal(s2.x,s2.y,{r:26,life:2.6,spawnT:1.0,spawnN:1});}
      sfx("portal",0.8);z.roarT=0.6;
      gorgonSet(z,"recover",0.55);z.summonCd=z.p2?9:13;
    }
    break;
  case "sink":
    z.sink=clamp(1-z.gt/0.55,0,1);z.ghost=z.sink>0.45?1:0;
    if(z.gt<=0){z.sink=1;z.ghost=1;gorgonSet(z,"under",z.p2?0.25:0.45);}
    break;
  case "under":
    if(z.gt<=0){
      var lead=0.35,tx=p.x+(p.vx||0)*lead,ty=p.y+(p.vy||0)*lead,spot=gorgonSpot(tx,ty,46,74,20)||gorgonSpot(p.x,p.y,50,110,20);
      if(!spot){spot={x:z.x,y:z.y};}
      z.tx=spot.x;z.ty=spot.y;
      var tl=z.p2?0.7:1.0;
      addPortal(spot.x,spot.y,{r:32,life:tl+0.9,tele:1});sfx("portal",0.9);
      gorgonSet(z,"tele",tl);
    }
    break;
  case "tele":
    if(z.gt<=0){
      z.x=z.tx;z.y=z.ty;if(typeof spawnBlocked==="function"&&spawnBlocked(z.x,z.y,14)&&typeof placeOnGround==="function")placeOnGround(z);
      gorgonSet(z,"emerge",0.35);gorgonOpen(z,1);sfx("gorgon_growl",1);shake(6);
      for(i=0;i<10;i++)addParticle(z.x+rand(-18,18),z.y+rand(-8,8),i%2?"#ff3d3d":"#3a0008",0.6,rand(-50,50),rand(-90,-30),rand(3,6),3);
    }
    break;
  case "emerge":
    z.sink=clamp(z.gt/0.35,0,1);z.ghost=z.sink>0.55?1:0;
    if(z.gt<=0){z.sink=0;z.ghost=0;z.lockA=Math.atan2(p.y-z.y,p.x-z.x);gorgonSet(z,"claw_wind",z.p2?0.16:0.24);z.portalCd=z.p2?5.5:8.5;}
    break;
  }
}
/* ---------- drawing ---------- */
function drawGorgonZ(z){
  if(z.sink>=0.999&&z.ghost)return;
  var opts={h:z.h,r:z.r,moving:z.gs==="walk"&&!(z.stun>0),flash:z.hitFlash>0};
  if(z.dying){opts.dying=1;opts.dieP=clamp(z.deathT/0.45,0,1);}
  var open=z.look.open||z.gs==="claw_wind"||z.gs==="lunge"||z.gs==="roar_wind";
  z.look.open=open?1:0;
  if(z.gs==="claw_wind"||z.gs==="lunge"){opts.atk=1;opts.atkT=z.gs==="lunge"?Math.max(0.01,z.gt):0.2;opts.atkMax=0.22;opts.aim=z.lockA;}
  if(z.gs==="roar_wind"||z.roarT>0)opts.atk=1;
  var sink=z.sink||0,s=toScreen(z.x,z.y),sc=layout.scale;
  if(z.p2&&sink<0.5&&!z.dying){portalSprites();var aw=70*sc,ah=aw*0.55;ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.45+0.2*Math.sin((game.time||0)*8);ctx.drawImage(_portalGlow,s.x-aw/2,s.y-ah/2,aw,ah);ctx.restore();}
  if(sink>0){
    var H=artTargetH(z.look,sc);
    opts.noShadow=1;opts.lift=-(sink*H)/sc;opts.moving=0;
    ctx.save();ctx.beginPath();ctx.rect(s.x-H,s.y-H*1.4,H*2,H*1.4+2*sc);ctx.clip();
  }
  if(!(typeof tryDrawArt==="function"&&tryDrawArt(z.x,z.y,z.look,z.aimAng||0,z.anim,opts))){
    drawChar34(z.x,z.y,makeZombieLook("tank",1),z.aimAng||0,z.anim,opts);
  }
  if(sink>0)ctx.restore();
  var ri;for(ri=0;ri<(z.rings||[]).length;ri++)drawSlamRing(z.x,z.y,z.rings[ri].r,"rgba(200,20,40,0.8)");
  if(z.gs==="claw_wind"&&sink<0.1){
    var a=z.lockA||0,e=toScreen(z.x+Math.cos(a)*96,z.y+Math.sin(a)*96);
    ctx.save();ctx.strokeStyle="rgba(255,30,50,0.85)";ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(e.x,e.y);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  }
  if(z.slash>0){
    var la=z.lockA||0,u=1-z.slash/0.18,c=toScreen(z.x+Math.cos(la)*20,z.y+Math.sin(la)*20),k,sa=Math.atan2(Math.sin(la)*CFG.YSCALE,Math.cos(la));
    ctx.save();ctx.globalCompositeOperation="lighter";ctx.lineCap="round";ctx.strokeStyle="rgba(255,90,90,"+(0.9*(1-u))+")";
    for(k=-1;k<=1;k++){ctx.lineWidth=(3-Math.abs(k))*sc;ctx.beginPath();ctx.arc(c.x,c.y-26*sc,(30+k*7)*sc,sa-1.1+u*0.4,sa+0.9+u*0.4);ctx.stroke();}
    ctx.restore();
  }
  if(z.clawFx){
    var cf=z.clawFx,cs=toScreen(cf.x,cf.y),ca=clamp(cf.t/0.28,0,1),j;
    ctx.save();ctx.translate(cs.x,cs.y-22*sc);ctx.rotate(0.35);ctx.lineCap="round";
    for(j=-1;j<=1;j++){
      ctx.strokeStyle="rgba(40,0,0,"+(0.7*ca)+")";ctx.lineWidth=3.6*sc;ctx.beginPath();ctx.moveTo(j*6*sc-5*sc,-15*sc);ctx.lineTo(j*6*sc+5*sc,15*sc);ctx.stroke();
      ctx.strokeStyle="rgba(255,70,70,"+ca+")";ctx.lineWidth=1.8*sc;ctx.stroke();
    }
    ctx.restore();
  }
}
