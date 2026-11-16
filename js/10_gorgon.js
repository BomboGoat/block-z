/* v20.2.0 — GORGON (round 8): a lanky, pale flower-faced horror from the other side.
   Opens dark-red rifts, sinks through them and ambushes the player, lunges with long claws,
   summons small horrors from portals and roars with its petal face opened wide.
   Phase 2 (<50% HP): faster, more portals, rifts stay open longer. */
function spawnGorgon(x,y){
  var z=spawnZombie("boss",x,y,7);
  var bs=(typeof waveDifficulty==="function"?waveDifficulty(7).bossHp:1.15);
  z.hp=Math.round(1200*bs);z.maxHp=z.hp;z.isBoss=1;z.isGorgon=1;z.r=19*CFG.CHAR;z.h=58*CFG.CHAR;z.speed=88*CFG.SPD;
  z.damage=Math.round(16*bs);z.score=1000;z.xp=420;
  z.look={kind:"gorgon",type:"boss",open:0};z.phase="intro";z.introT=4.2;z.atkCd=1.6;z.windup=null;z.windupT=0;
  z.gs="walk";z.gt=0;z.p2=0;z.bName="GORGON";z.spawnT=0;z.sink=1;z.ghost=1;z.clawCd=1.4;z.portalCd=6;z.summonCd=9;z.roarCd=12;z.screechCd=7;z.vineCd=5;z.dogCd=14;
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
  var pt={x:x,y:y,r:4,rMax:o.r||30,life:o.life||2,maxLife:o.life||2,tele:o.tele||0,spawnT:o.spawnT!=null?o.spawnT:-1,spawnN:o.spawnN||0,pt:0,seed:Math.random()*6,dog:o.dog||0};
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
          typ=pt.dog?"crawler":Math.random()<0.55?"fast":(Math.random()<0.5?"crawler":"normal");
          m=spawnZombie(typ,pt.x+rand(-8,8),pt.y+rand(-5,5),game.wave);
          m.fromPortal=1;if(pt.dog){m.demodog=1;m.speed=(m.speed||60)*1.55;m.hp=m.maxHp=Math.round((m.maxHp||m.hp)*0.6);m.damage=Math.round((m.damage||8)*0.5);m.spawnT=0.4;}m.xp=Math.round((m.xp||10)*0.5);m.score=Math.round((m.score||10)*0.5);
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
  drawGorgonGround();
  var a=game.portals;if(!a||!a.length)return;portalSprites();
  var i,pt,s,sc=layout.scale,w,h,pul,t=game.time||0;
  for(i=0;i<a.length;i++){
    pt=a[i];if(pt.r<1)continue;s=toScreen(pt.x,pt.y);var _pd=pt;
    if(s.x<-120||s.x>SW+120||s.y<-80||s.y>SH+80)continue;
    pul=1+0.06*Math.sin(t*9+pt.seed);
    w=pt.r*2.3*sc*pul;h=w*0.5*CFG.YSCALE/0.7;
    ctx.drawImage(_portalSpr,s.x-w/2,s.y-h/2,w,h);
    ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.5+0.25*Math.sin(t*7+pt.seed);
    ctx.drawImage(_portalGlow,s.x-w*0.55,s.y-h*0.75,w*1.1,h*1.3);
    ctx.restore();
    if(pt.tele){
      var tp=clamp(1-pt.life/pt.maxLife,0,1);
      /* v20.3.3: clearer ambush warning: a danger disc that fills up + shrinking ring + "!" */
      var rr2=(pt.rMax+10)*sc;
      ctx.save();ctx.globalAlpha=0.16+0.22*tp;ctx.fillStyle="#ff1744";ctx.beginPath();ctx.ellipse(s.x,s.y,rr2*tp,rr2*tp*CFG.YSCALE,0,0,7);ctx.fill();
      ctx.globalAlpha=0.55+0.45*Math.sin(t*18);ctx.strokeStyle="#ff1744";ctx.lineWidth=2.5;
      ctx.beginPath();ctx.ellipse(s.x,s.y,(pt.rMax+26*(1-tp))*sc,(pt.rMax+26*(1-tp))*CFG.YSCALE*sc,0,0,7);ctx.stroke();
      ctx.setLineDash([5,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(s.x,s.y,rr2,rr2*CFG.YSCALE,0,0,7);ctx.stroke();ctx.setLineDash([]);
      if(!_pd.dog){ctx.globalAlpha=0.9;ctx.font="900 "+Math.round(16*sc/2.2+8)+"px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineWidth=3;ctx.strokeStyle="#2a0006";ctx.strokeText("!",s.x,s.y-rr2*0.55);ctx.fillStyle="#ffeb3b";ctx.fillText("!",s.x,s.y-rr2*0.55);}
      ctx.restore();
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
  if(dist(z.x,z.y,p.x,p.y)<z.r+p.r+13&&!(p.dashT>0)){
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
  z.clawCd-=dt;z.portalCd-=dt;z.summonCd-=dt;z.roarCd-=dt;z.screechCd-=dt;z.vineCd-=dt;z.dogCd-=dt;if(z.vines)gorgonVinesTick(z,dt);
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
    if(d<78&&z.clawCd<=0){gorgonSet(z,"claw_wind",z.p2?0.42:0.55);gorgonOpen(z,1);z.lockA=Math.atan2(dy,dx);z.combo=z.p2||Math.random()<0.45;sfx("gorgon_growl",0.6);return;}
    /* v20.3.3 new moves: petal screech cone (slows), Upside-Down vines in a line, demodog pack */
    if(z.screechCd<=0&&d<150&&d>40){gorgonSet(z,"screech_wind",0.75);gorgonOpen(z,1);z.lockA=Math.atan2(dy,dx);sfx("gorgon_growl",0.8);return;}
    if(z.vineCd<=0&&d>90&&d<300){gorgonSet(z,"vine_wind",0.35);gorgonOpen(z,1);z.lockA=Math.atan2(dy,dx);gorgonVinesStart(z);sfx("stomp",0.8);shake(5);return;}
    if(z.dogCd<=0&&gorgonMinionsAlive()<(z.p2?4:3)){gorgonSet(z,"dog_wind",0.7);gorgonOpen(z,1);return;}
    if(z.roarCd<=0&&d<230){gorgonSet(z,"roar_wind",z.p2?0.6:0.75);gorgonOpen(z,1);return;}
    if(z.summonCd<=0&&gorgonMinionsAlive()<(z.p2?4:2)){gorgonSet(z,"summon_wind",0.6);gorgonOpen(z,1);return;}
    if(z.portalCd<=0&&d>70){gorgonSet(z,"sink",0.55);addPortal(z.x,z.y,{r:30,life:z.p2?2.6:1.5});sfx("portal",0.8);return;}
    sp=z.speed*(z.slow>0?0.6:1);
    var fd=typeof flowDir==="function"?flowDir(z.x,z.y):null,ax=dx/d,ay=dy/d;
    if(fd&&(fd.x||fd.y)&&d>60){var cg=typeof chaseDir==="function"?chaseDir(z,dx,dy,d):null;if(cg){ax=cg.x;ay=cg.y;}else{var l=Math.sqrt(fd.x*fd.x+fd.y*fd.y)||1;ax=fd.x/l;ay=fd.y/l;}}
    if(typeof moveWithSlide==="function")moveWithSlide(z,ax*sp*dt,ay*sp*dt);else{z.x+=ax*sp*dt;z.y+=ay*sp*dt;resolveCircle(z);}
    z.aimAng=Math.atan2(dy,dx);
    if(d<z.r+p.r+2){hurtPlayer(p,Math.round(z.damage*0.5));}
    break;
  case "claw_wind":
    z.aimAng=z.lockA=Math.atan2(dy,dx);
    if(z.gt<=0){gorgonSet(z,"lunge",0.2);z.hitDone=0;sfx("slash");}
    break;
  case "lunge":
    sp2=Math.min(520*(CFG.MOVE||1),d/0.2+60);
    if(typeof moveWithSlide==="function")moveWithSlide(z,Math.cos(z.lockA)*sp2*dt,Math.sin(z.lockA)*sp2*dt);
    if(Math.random()<0.6)addParticle(z.x,z.y,"#7a0a14",0.25,-Math.cos(z.lockA)*40,-Math.sin(z.lockA)*40,7,4);
    if(!z.hitDone&&gorgonClawHit(z,p,z.damage+(z.p2?4:0))){z.hitDone=1;}
    if(z.gt<=0){z.slash=0.18;if(z.combo){z.combo=0;z.lockA=Math.atan2(p.y-z.y,p.x-z.x);gorgonSet(z,"claw2_wind",0.38);sfx("gorgon_growl",0.5);}else gorgonSet(z,"recover",z.p2?0.45:0.6);z.clawCd=z.p2?1.2:1.7;}
    break;
  case "recover":
    if(z.gt<=0){gorgonOpen(z,0);gorgonSet(z,"walk",0);}
    break;
  case "roar_wind":
    z.aimAng=Math.atan2(dy,dx);
    if(z.gt<=0){
      sfx("gorgon_roar",0.95);shake(14);z.roarT=1.1;
      z.rings.push({r:16,vr:220,life:0.6,dmg:z.p2?13:10});
      for(i=0;i<14;i++)addParticle(z.x+rand(-20,20),z.y+rand(-10,8),i%2?"#ff3d3d":"#2a0006",0.7,rand(-90,90),rand(-80,-10),rand(3,6),3);
      gorgonSet(z,"recover",0.9);z.roarCd=z.p2?9:13;
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
  case "claw2_wind": /* second swipe of the combo: an arc in front, telegraphed by a filling wedge */
    if(z.gt<=0){
      var ca=Math.atan2(p.y-z.y,p.x-z.x),cd=Math.atan2(Math.sin(ca-z.lockA),Math.cos(ca-z.lockA));
      if(d<z.r+p.r+44&&Math.abs(cd)<0.85&&!(p.dashT>0)){hurtPlayer(p,Math.round(z.damage*0.8));z.clawFx={x:p.x,y:p.y,t:0.28,ang:ca};shake(7);}
      z.slash=0.2;z.slash2=1;sfx("slash");for(i=0;i<8;i++)addParticle(z.x+Math.cos(z.lockA)*30,z.y+Math.sin(z.lockA)*30,i%2?"#ff5252":"#5a0010",0.4,Math.cos(z.lockA+rand(-0.8,0.8))*rand(60,160),Math.sin(z.lockA+rand(-0.8,0.8))*rand(60,160),rand(2,4),3);
      gorgonSet(z,"recover",z.p2?0.5:0.65);
    }
    break;
  case "screech_wind":
    z.aimAng=z.lockA;
    if(z.gt<=0){gorgonSet(z,"screech",0.55);z.roarT=0.7;sfx("gorgon_roar",0.9);shake(9);z.scrHit=0;z.scrT=0;}
    break;
  case "screech":
    z.scrT=(z.scrT||0)+dt;
    if(!z.scrHit&&z.scrT>0.08){
      var sa2=Math.atan2(p.y-z.y,p.x-z.x),sd=Math.atan2(Math.sin(sa2-z.lockA),Math.cos(sa2-z.lockA));
      if(d<GORGON_SCR_R&&Math.abs(sd)<GORGON_SCR_A&&!(p.dashT>0)){z.scrHit=1;hurtPlayer(p,Math.round(z.damage*0.35));p.slowUntil=game.time+1.6;floatText(p.x,p.y-24,"LENTO","#ff80ab");}
    }
    if(Math.random()<0.7)addParticle(z.x+Math.cos(z.lockA)*24,z.y+Math.sin(z.lockA)*24,Math.random()<0.5?"#ff8a9a":"#9a1030",0.5,Math.cos(z.lockA+rand(-0.45,0.45))*rand(120,240),Math.sin(z.lockA+rand(-0.45,0.45))*rand(120,240),rand(2,4),3);
    if(z.gt<=0){gorgonSet(z,"recover",0.6);z.screechCd=z.p2?8:11;}
    break;
  case "vine_wind":
    z.aimAng=z.lockA;
    if(z.gt<=0){gorgonSet(z,"recover",0.9);z.vineCd=z.p2?7:10;}
    break;
  case "dog_wind":
    z.aimAng=Math.atan2(dy,dx);
    if(z.gt<=0){
      var nd=z.p2?3:2,kk,sd2;
      for(kk=0;kk<nd;kk++){sd2=gorgonSpot(z.x,z.y,40,90,14);if(sd2)addPortal(sd2.x,sd2.y,{r:22,life:2.2,spawnT:0.9,spawnN:1,dog:1,tele:1});}
      sfx("portal",0.9);z.roarT=0.6;sfx("gorgon_growl",0.9);
      gorgonSet(z,"recover",0.6);z.dogCd=z.p2?14:18;
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
      var tl=z.p2?0.95:1.25;
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
    if(z.gt<=0){z.sink=0;z.ghost=0;z.lockA=Math.atan2(p.y-z.y,p.x-z.x);gorgonSet(z,"claw_wind",z.p2?0.34:0.42);z.combo=0;z.portalCd=z.p2?6.5:9.5;}
    break;
  }
}
/* ---------- drawing ---------- */
function drawGorgonZ(z){
  if(z.sink>=0.999&&z.ghost)return;
  var opts={h:z.h,r:z.r,moving:z.gs==="walk"&&!(z.stun>0),flash:z.hitFlash>0};
  if(z.dying){opts.dying=1;opts.dieP=clamp(z.deathT/0.45,0,1);}
  var open=z.look.open||z.gs==="claw_wind"||z.gs==="lunge"||z.gs==="roar_wind"||z.gs==="claw2_wind"||z.gs==="screech_wind"||z.gs==="screech"||z.gs==="dog_wind"||z.gs==="vine_wind";
  z.look.open=open?1:0;
  if(z.gs==="claw_wind"||z.gs==="lunge"){opts.atk=1;opts.atkT=z.gs==="lunge"?Math.max(0.01,z.gt):0.2;opts.atkMax=0.22;opts.aim=z.lockA;}
  if(z.gs==="claw2_wind"){opts.atk=1;opts.atkT=Math.max(0.01,z.gt*0.5);opts.atkMax=0.22;opts.aim=z.lockA;}
  if(z.gs==="roar_wind"||z.roarT>0||z.gs==="screech_wind"||z.gs==="screech"||z.gs==="vine_wind"||z.gs==="dog_wind")opts.atk=1;
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

/* ---------- v20.3.3: new Gorgon moves (ground telegraphs, vines, screech cone, slow) ---------- */
var GORGON_SCR_R=150,GORGON_SCR_A=0.5;
function gorgonVinesStart(z){
  var p=game.player,a=z.lockA,L=Math.min(300,Math.max(170,dist(z.x,z.y,p.x,p.y)+70)),n=Math.round(L/22),i,pts=[];
  for(i=1;i<=n;i++){var x=z.x+Math.cos(a)*i*22,y=z.y+Math.sin(a)*i*22;if(typeof spawnBlocked==="function"?spawnBlocked(x,y,4):circleHitSolid(x,y,4))break;pts.push({x:x+rand(-3,3),y:y+rand(-3,3),t:-(0.85+i*0.06),hit:0,h:0.8+Math.random()*0.5,s:Math.random()*6});}
  z.vines={pts:pts,t:0};
}
function gorgonVinesTick(z,dt){
  var V=z.vines,p=game.player,i,v,alive=0;V.t+=dt;
  for(i=0;i<V.pts.length;i++){v=V.pts[i];v.t+=dt;
    if(v.t>=0&&!v.erupt){v.erupt=1;if(i%3===0){sfx("stomp",0.35);shake(3);}for(var k=0;k<4;k++)addParticle(v.x,v.y,k%2?"#3a1a10":"#7a0a14",0.5,rand(-50,50),rand(-90,-30),rand(2,4),3);}
    if(v.erupt&&!v.hit&&v.t<0.25&&!(p.dashT>0)&&dist(v.x,v.y,p.x,p.y)<p.r+9){v.hit=1;V.done=1;hurtPlayer(p,Math.round(z.damage*0.85));}
    if(v.t<0.9)alive=1;
  }
  if(!alive||z.dead||z.dying)z.vines=null;
}
function drawGorgonGround(){
  var g=game;if(!g||!g.zombies)return;
  var i,z,sc=layout.scale,ys=CFG.YSCALE,t=g.time||0,p=g.player;
  /* screech slow on the hero */
  if(p&&p.slowUntil>t){var ps=toScreen(p.x,p.y),k2;ctx.save();ctx.strokeStyle="rgba(255,120,170,0.7)";ctx.lineWidth=1.6;for(k2=0;k2<2;k2++){var rr=(12+((t*30+k2*9)%18))*sc;ctx.globalAlpha=0.7*(1-((t*30+k2*9)%18)/18);ctx.beginPath();ctx.ellipse(ps.x,ps.y,rr,rr*ys,0,0,7);ctx.stroke();}ctx.restore();}
  for(i=0;i<g.zombies.length;i++){z=g.zombies[i];if(!z.isGorgon||z.dead)continue;
    var s=toScreen(z.x,z.y);
    /* claw lunge path + combo wedge */
    if(z.gs==="claw2_wind"){var u=1-clamp(z.gt/0.38,0,1),a0=z.lockA,R=(z.r+44)*sc;
      ctx.save();ctx.translate(s.x,s.y);ctx.scale(1,ys);ctx.fillStyle="rgba(255,30,50,"+(0.12+0.25*u)+")";ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R*u,a0-0.85,a0+0.85);ctx.closePath();ctx.fill();
      ctx.strokeStyle="rgba(255,60,70,0.85)";ctx.lineWidth=2/ys;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,a0-0.85,a0+0.85);ctx.closePath();ctx.stroke();ctx.restore();}
    /* screech cone: fills during the wind-up, sound waves while active */
    if(z.gs==="screech_wind"||z.gs==="screech"){var w=z.gs==="screech"?1:1-clamp(z.gt/0.75,0,1),R2=GORGON_SCR_R*sc,a1=z.lockA;
      ctx.save();ctx.translate(s.x,s.y);ctx.scale(1,ys);
      ctx.fillStyle="rgba(255,60,130,"+(z.gs==="screech"?0.22:0.12+0.24*w)+")";ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R2*(z.gs==="screech"?1:w),a1-GORGON_SCR_A,a1+GORGON_SCR_A);ctx.closePath();ctx.fill();
      ctx.strokeStyle="rgba(255,110,170,0.95)";ctx.lineWidth=2.5/ys;ctx.setLineDash([9,6]);ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R2,a1-GORGON_SCR_A,a1+GORGON_SCR_A);ctx.closePath();ctx.stroke();ctx.setLineDash([]);
      if(z.gs==="screech"){ctx.globalCompositeOperation="lighter";for(var q=0;q<4;q++){var f=((z.scrT||0)*2.4+q*0.25)%1;ctx.strokeStyle="rgba(255,170,200,"+(0.75*(1-f))+")";ctx.lineWidth=(4-f*2.5)/ys;ctx.beginPath();ctx.arc(0,0,R2*f,a1-GORGON_SCR_A*0.9,a1+GORGON_SCR_A*0.9);ctx.stroke();}}
      ctx.restore();}
    /* vines: crack line telegraph, then tendrils erupt one after another */
    if(z.vines){var V=z.vines,j,v;
      ctx.save();
      for(j=0;j<V.pts.length;j++){v=V.pts[j];var vs=toScreen(v.x,v.y);
        if(v.t<0){var pre=clamp(1+v.t/0.85,0,1);ctx.globalAlpha=0.35+0.5*pre;ctx.fillStyle="#ff1744";ctx.beginPath();ctx.ellipse(vs.x,vs.y,9*sc*pre+2,9*sc*ys*pre+1,0,0,7);ctx.fill();
          ctx.globalAlpha=0.8;ctx.strokeStyle="#2a0006";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(vs.x-6*sc,vs.y-1);ctx.lineTo(vs.x+1,vs.y+2);ctx.lineTo(vs.x+7*sc,vs.y-1);ctx.stroke();}
        else if(v.t<0.9){var up=v.t<0.12?v.t/0.12:v.t>0.6?Math.max(0,1-(v.t-0.6)/0.3):1,hh=34*v.h*sc*up;ctx.globalAlpha=1;
          ctx.fillStyle="rgba(20,0,4,0.45)";ctx.beginPath();ctx.ellipse(vs.x,vs.y,8*sc,8*sc*ys,0,0,7);ctx.fill();
          for(var m=-1;m<=1;m++){var bx=vs.x+m*4*sc,sw=Math.sin(t*6+v.s+m)*2*sc,gr=ctx.createLinearGradient(0,vs.y-hh,0,vs.y);gr.addColorStop(0,"#ff4d5e");gr.addColorStop(0.35,"#6a0a18");gr.addColorStop(1,"#1a0306");
            ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(bx-4*sc,vs.y);ctx.quadraticCurveTo(bx+sw-2*sc,vs.y-hh*0.5,bx+sw*1.6,vs.y-hh*(m?0.75:1));ctx.quadraticCurveTo(bx+sw+2*sc,vs.y-hh*0.5,bx+4*sc,vs.y);ctx.closePath();ctx.fill();}}
      }
      ctx.restore();}
  }
}
(function(){var _ts=terrainSpeedMul;terrainSpeedMul=function(x,y){var m=_ts(x,y),p=game&&game.player;if(p&&p.slowUntil>(game.time||0)&&x===p.x&&y===p.y)m*=0.55;return m;};})();

/* v20.3.3: small four-legged "demodog" minion summoned by the Gorgon (procedural, cheap paths) */
function drawDemodog(z){
  var s=toScreen(z.x,z.y),sc=layout.scale,t=game.time||0,p=game.player;
  var a=Math.atan2(p.y-z.y,p.x-z.x),fx=Math.cos(a)>=0?1:-1,d=dist(z.x,z.y,p.x,p.y),open=d<75||z.dying?1:0;
  var k=0.82*sc,ph=t*16+z.x*0.13,bob=Math.abs(Math.sin(ph))*1.4,dieP=z.dying?clamp(1-z.deathT/0.45,0,1):0,i;
  ctx.save();ctx.fillStyle="rgba(0,0,0,0.3)";ctx.beginPath();ctx.ellipse(s.x,s.y,14*k,4.5*k,0,0,7);ctx.fill();
  ctx.translate(s.x,s.y);ctx.scale(fx*k,k);if(dieP){ctx.translate(0,-4);ctx.rotate(-dieP*1.2);ctx.translate(0,4);}
  ctx.lineCap="round";ctx.lineJoin="round";
  function leg(hx,hy,kx,ky,px,py,c,w){ctx.strokeStyle="#140f0c";ctx.lineWidth=w+1.2;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(kx,ky);ctx.lineTo(px,py);ctx.stroke();
    ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();ctx.fillStyle="#140f0c";ctx.beginPath();ctx.moveTo(px-1.5,py);ctx.lineTo(px+2.6,py+0.3);ctx.lineTo(px+0.5,py-1.4);ctx.fill();}
  var s1=Math.sin(ph),s2=Math.sin(ph+Math.PI);
  /* far legs (darker) */
  leg(-8,-10-bob,-12+s2*2,-5,-8+s2*3.5,0,"#3a342d",1.9);
  leg(6,-13-bob,9+s1*1.5,-6,7+s1*3.5,0,"#3a342d",1.9);
  /* body: shoulder hump higher than hips */
  var gr=ctx.createRadialGradient(1,-19-bob,1,0,-14-bob,15);gr.addColorStop(0,"#a39a82");gr.addColorStop(0.55,"#5f574b");gr.addColorStop(1,"#26211c");
  ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(-13,-11-bob);ctx.bezierCurveTo(-11,-17-bob,-3,-17-bob,3,-21-bob);ctx.bezierCurveTo(8,-23-bob,12,-19-bob,13,-16-bob);
  ctx.bezierCurveTo(12,-12-bob,9,-9-bob,5,-9-bob);ctx.bezierCurveTo(0,-7-bob,-6,-7-bob,-10,-8-bob);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#140f0c";ctx.lineWidth=1.1;ctx.stroke();
  /* ribs + wet highlight */
  ctx.strokeStyle="rgba(25,18,14,0.55)";ctx.lineWidth=0.8;for(i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-2+i*3,-16.5-bob+i*0.6);ctx.quadraticCurveTo(-1+i*3,-12-bob,-3+i*3,-9.5-bob);ctx.stroke();}
  ctx.strokeStyle="rgba(235,225,200,0.55)";ctx.lineWidth=0.9;ctx.beginPath();ctx.moveTo(-9,-14.5-bob);ctx.bezierCurveTo(-4,-16-bob,0,-17.5-bob,4,-20-bob);ctx.stroke();
  /* tail */
  ctx.strokeStyle="#2c2620";ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-12,-11-bob);ctx.quadraticCurveTo(-17,-10-bob,-19,-13-bob+s1*1.2);ctx.stroke();
  /* near legs */
  leg(-7,-10-bob,-11+s1*2,-5,-7+s1*3.5,0,"#6b6252",2.1);
  leg(8,-12-bob,10+s2*1.5,-6,9+s2*3.5,0,"#6b6252",2.1);
  /* neck + head */
  var hx=16,hy=-15-bob+Math.sin(ph*0.5)*0.6;
  ctx.fillStyle="#4a433a";ctx.beginPath();ctx.moveTo(10,-19-bob);ctx.quadraticCurveTo(14,-18-bob,hx,hy-2);ctx.lineTo(hx,hy+2);ctx.quadraticCurveTo(12,-12-bob,9,-12-bob);ctx.closePath();ctx.fill();
  if(open){
    var o=0.75+0.25*Math.sin(t*12);
    for(i=0;i<5;i++){var pa=(i-2)*0.72;var ex=hx+Math.cos(pa)*9*o+2,ey=hy+Math.sin(pa)*9*o;
      ctx.fillStyle=i%2?"#8f846c":"#b0a48a";ctx.strokeStyle="#140f0c";ctx.lineWidth=0.7;ctx.beginPath();ctx.moveTo(hx,hy);
      ctx.quadraticCurveTo(hx+Math.cos(pa-0.45)*7,hy+Math.sin(pa-0.45)*7,ex,ey);ctx.quadraticCurveTo(hx+Math.cos(pa+0.45)*7,hy+Math.sin(pa+0.45)*7,hx,hy);ctx.fill();ctx.stroke();
      ctx.fillStyle="rgba(170,20,40,0.85)";ctx.beginPath();ctx.moveTo(hx+0.5,hy);ctx.quadraticCurveTo(hx+Math.cos(pa-0.2)*5,hy+Math.sin(pa-0.2)*5,hx+Math.cos(pa)*6.5+1,hy+Math.sin(pa)*6.5);ctx.quadraticCurveTo(hx+Math.cos(pa+0.2)*5,hy+Math.sin(pa+0.2)*5,hx+0.5,hy);ctx.fill();}
    var mg=ctx.createRadialGradient(hx+1.5,hy,0.3,hx+1.5,hy,3.8);mg.addColorStop(0,"#ff4a5c");mg.addColorStop(0.6,"#7a0012");mg.addColorStop(1,"#2a0006");
    ctx.fillStyle=mg;ctx.beginPath();ctx.arc(hx+1.5,hy,3.8,0,7);ctx.fill();
    ctx.fillStyle="#f3ead2";for(i=0;i<8;i++){var ta=i/8*6.283;ctx.beginPath();ctx.moveTo(hx+1.5+Math.cos(ta)*3.8,hy+Math.sin(ta)*3.8);ctx.lineTo(hx+1.5+Math.cos(ta+0.2)*2.4,hy+Math.sin(ta+0.2)*2.4);ctx.lineTo(hx+1.5+Math.cos(ta-0.2)*2.4,hy+Math.sin(ta-0.2)*2.4);ctx.fill();}
  }else{
    var hg=ctx.createLinearGradient(hx,hy-4,hx,hy+4);hg.addColorStop(0,"#9a8f77");hg.addColorStop(1,"#4f473d");
    ctx.fillStyle=hg;ctx.strokeStyle="#140f0c";ctx.lineWidth=0.9;ctx.beginPath();ctx.moveTo(hx-2,hy-4);ctx.quadraticCurveTo(hx+7,hy-4.5,hx+10,hy);ctx.quadraticCurveTo(hx+7,hy+4,hx-2,hy+3.5);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle="rgba(140,0,25,0.9)";ctx.lineWidth=0.7;ctx.beginPath();ctx.moveTo(hx,hy-0.2);ctx.lineTo(hx+9.5,hy);ctx.moveTo(hx+1,hy-2.4);ctx.lineTo(hx+7.5,hy-1.2);ctx.moveTo(hx+1,hy+2.2);ctx.lineTo(hx+7.5,hy+1.1);ctx.stroke();
  }
  ctx.restore();
  if(z.hitFlash>0){ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.45;ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(s.x+fx*2*k,s.y-14*k,13*k,6*k,0,0,7);ctx.fill();ctx.restore();}
}
