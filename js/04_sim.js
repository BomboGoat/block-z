var input={jx:0,jy:0,joy:0,joyX:0,joyY:0,joyId:-1,keys:{},super:0,superId:-1,superX:0,superY:0,sjx:0,sjy:0,superDragged:0,superMaxMag:0,superCancel:0,pause:0};
function createPlayer(){
  return{x:CFG.MAP_W/2,y:CFG.MAP_H/2,vx:0,vy:0,r:CFG.PLAYER_R,hp:CFG.MAX_HP,maxHp:CFG.MAX_HP,invuln:0,fireTimer:0,fireCooldown:CFG.FIRE_COOLDOWN,damageMul:1,speedMul:1,rangeMul:1,weapon:"pistol",pellets:1,extraShots:0,pierce:0,doubleJump:0,tripleJump:0,hasMelee:0,meleeRange:70,meleeDmg:20,meleeTimer:0,meleeSwing:0,hasShield:0,shieldReady:1,shieldCd:0,lifesteal:0,flash:0,anim:0,recoil:0,muzzle:0,aimAng:0,luck:0,hasOrbit:0,orbitAngle:0,hasChain:0,hasRevive:0,revived:0,runXP:0,runLevel:1,runXPNext:50,levelFlash:0,fireAmmo:0,iceAmmo:0,poisonAmmo:0,explosiveAmmo:0,thorns:0,hasDash:0,dashCd:0,dashT:0,dashLeft:0,regen:0,critChance:0,critMul:1.5,bounce:0,xpMagnet:0,hasDrone:0,droneAngle:0,droneX:0,droneY:0,hasDog:0,dog:{x:0,y:0,anim:0},fireAura:0,berserk:0,stomp:0,bloodlust:0,bloodStacks:0,sparkOnHit:0,overcharge:0,armorMul:1,evasion:0,abilities:[],scale:1,look:makePlayerLook(),super:0,facing:0,hero:"classic",lastMoveX:1,lastMoveY:0,dashSlash:0};
}
function applyHero(p,id){
  id=id||"classic";p.hero=id;p.look=makeHeroLook(id);
  if(id==="trueno"){p.weapon="bolt";p.fireCooldown=0.42;p.maxHp=90;p.hp=90;p.speedMul=1.05;p.damageMul=1.1;}
  else if(id==="mr"){p.weapon="knife";p.hasMelee=1;p.meleeRange=88;p.meleeDmg=14;p.fireCooldown=0.42;p.maxHp=120;p.hp=120;p.speedMul=1.15;p.armorMul=0.92;}
  else if(id==="gompa"){p.weapon="fist";p.meleeRange=86;p.meleeDmg=16;p.fireCooldown=0.5;p.maxHp=140;p.hp=140;p.speedMul=0.88;p.damageMul=1;}
  else {p.weapon="pistol";p.fireCooldown=CFG.FIRE_COOLDOWN;if(typeof applyEricWeapon==="function")applyEricWeapon(p,"pistol");}
}
function spawnZombie(type,x,y,wave){
  var t=ZT[type]||ZT.normal,sc=1+(wave||0)*0.12;
  return{type:type,x:x,y:y,r:t.r,h:t.h,vx:0,vy:0,hp:Math.round(t.hp*sc),maxHp:Math.round(t.hp*sc),speed:t.speed*(0.9+Math.random()*0.2),damage:t.damage,color:t.color,score:t.score,xp:t.xp||10,aimAng:0,hitFlash:0,attackCd:0,dead:0,deathT:0,dying:0,anim:Math.random()*8,leapCd:rand(1.2,2.6),leapT:0,screamCd:rand(2,4),spitCd:rand(1.2,2.2),buffed:0,armor:!!t.armor,attackAnim:0,burn:0,slow:0,poison:0,look:makeZombieLook(type,(Math.random()*1e9)|0),spawnT:0.65};
}
function spawnColossus(x,y){
  var z=spawnZombie("boss",x,y,0);
  z.hp=1100;z.maxHp=1100;z.isBoss=1;z.isColossus=1;z.r=24;z.h=52;z.speed=70;z.damage=20;z.score=800;z.xp=350;
  z.look=makeColossusLook();z.phase="intro";z.introT=4.2;z.atkCd=1.6;z.windup=null;z.windupT=0;z.bName="EL COLOSSUS";
  z.speechDone=0;z.bubbleText="";z.bubbleFull="";z.bubbleIdx=0;z.bubbleT=0;z.rings=[];z.throws=[];z.chargeT=0;z.chargeAng=0;
  return z;
}
function spawnHome(x,y){
  var z=spawnZombie("boss",x,y,0);
  z.hp=1200;z.maxHp=1200;z.isBoss=1;z.isHome=1;z.r=20;z.h=50;z.speed=88;z.damage=16;z.score=900;z.xp=380;
  z.look=makeHomeLook();z.phase="intro";z.introT=4;z.atkCd=1.8;z.windup=null;z.windupT=0;z.p2=0;z.bName="HOMELANDER";
  z.bubbleText="";z.bubbleFull="¿Sabéis quién soy?";z.bubbleIdx=0;z.bubbleT=0;z.rings=[];z.diveT=0;z.tx=x;z.ty=y;
  return z;
}
function addParticle(x,y,color,life,vx,vy,size,kind){var p=particlePool.pop()||{};p.x=x;p.y=y;p.vx=vx!=null?vx:rand(-80,80);p.vy=vy!=null?vy:rand(-80,80);p.life=life||0.4;p.maxLife=p.life;p.color=color;p.size=size||rand(2,5);p.kind=kind||0;p.rot=rand(0,6);p.spin=rand(-8,8);game.particles.push(p);var cap=(typeof GFX!=="undefined"&&GFX.maxPart)||240;if(game.particles.length>cap)game.particles.splice(0,game.particles.length-cap);}
function floatText(x,y,text,col){
  col=col||"#fff";
  var list=game.floatTexts,i,f,n=parseFloat(text);
  if(list&&isFinite(n)&&String(text).search(/[^0-9.+-]/)<0){
    for(i=0;i<list.length;i++){
      f=list[i];
      if(f.col===col&&Math.abs(f.x-x)<20&&Math.abs(f.y-y)<20&&isFinite(+f.text)&&String(f.text).search(/[^0-9.+-]/)<0){
        f.text=""+(Math.round((+f.text)+n));f.life=Math.max(f.life,0.55);f.x=x;f.y=y;return;
      }
    }
  }
  f=floatPool.pop()||{};f.x=x;f.y=y;f.text=text;f.col=col;f.life=0.8;
  (list||(game.floatTexts=[])).push(f);
  if(game.floatTexts.length>14){floatPool.push(game.floatTexts.shift());}
}
function bloodBurst(x,y){for(var i=0;i<3;i++)addParticle(x,y,"#8b0000",0.26,rand(-70,70),rand(-70,70),3,1);}
function pushBolt(b){if(!game.bolts)game.bolts=[];game.bolts.push(b);if(game.bolts.length>8)game.bolts.splice(0,game.bolts.length-8);}
function impactSpark(x,y){addParticle(x,y,"#e3f2fd",0.11,0,-10,9,4);var i;for(i=0;i<3;i++)addParticle(x,y,"#90caf9",0.13,rand(-100,100),rand(-100,100),rand(2,4),3);}
function truenoLaserLen(p){var vw=(typeof layout!=="undefined"&&layout.viewW)||420;return vw*((p&&p.bigStorm)?0.45:0.42);}
function explodeAt(x,y,r,dmg,opts){
  opts=opts||{};
  var i,z,p=game.player;
  for(i=0;i<game.zombies.length;i++){z=game.zombies[i];if(z.dead||z.dying)continue;if(dist(x,y,z.x,z.y)<r+z.r)hurtZombie(z,dmg,x,0,{});}
  if(!opts.friendly&&p&&dist(x,y,p.x,p.y)<r+p.r)hurtPlayer(p,dmg*0.5);
  sfx("explode");
  if(typeof gfxBoom==="function")gfxBoom(x,y,r);else for(i=0;i<10;i++)addParticle(x,y,"#ff9800",0.4,rand(-140,140),rand(-140,140),5,2);
  if(typeof addBlood==="function")addBlood(x,y,4);
}
function findNearestZombie(p,range){
  var best=null,bestD=range||CFG.AUTO_RANGE*(p.rangeMul||1),i,z,d;
  for(i=0;i<game.zombies.length;i++){
    z=game.zombies[i];if(z.dead||z.dying)continue;d=dist(p.x,p.y,z.x,z.y);if(d>=bestD)continue;
    if(d>36&&typeof inCamView==="function"&&!inCamView(z.x,z.y,-18))continue;
    if(d>40&&hiddenInBush(z.x,z.y,p))continue;if(d>28&&!hasLOS(p.x,p.y,z.x,z.y))continue;bestD=d;best=z;
  }
  return best;
}
function heroRange(p){
  if(p.weapon==="knife"||(p.hasMelee&&p.hero==="mr"))return (p.meleeRange||88)*(p.rangeMul||1)*(p.wideSlash?1.25:1)*1.2;
  return CFG.AUTO_RANGE*(p.rangeMul||1);
}
function zigPts(ax,ay,bx,by,n){
  n=Math.max(2,n||5);
  var pts=[{x:ax,y:ay}],i,t,px,py,d=dist(ax,ay,bx,by)||1,ox=-(by-ay)/d,oy=(bx-ax)/d,off,amp=Math.min(16,6+d*0.04);
  for(i=1;i<n;i++){t=i/n;px=ax+(bx-ax)*t;py=ay+(by-ay)*t;off=(i%2?1:-1)*rand(amp*0.45,amp);pts.push({x:px+ox*off,y:py+oy*off});}
  pts.push({x:bx,y:by});return pts;
}
function fireLightning(p,first){
  var jumps=3+(p.chainJumps?1:0)+(p.extraShots|0),dmg=CFG.BULLET_DAMAGE*1.05*p.damageMul,i,targets=[first],src=first,n;
  if(p.berserk&&p.hp/p.maxHp<0.4)dmg*=1.5;
  if(p.bloodlust)dmg*=(1+0.04*p.bloodStacks);
  p.aimAng=Math.atan2(first.y-p.y,first.x-p.x);p.recoil=1;p.muzzle=0.1;p.boltFlash=0.1;
  for(i=1;i<jumps;i++){
    n=null;var best=140*(p.rangeMul||1),j,z,d;
    for(j=0;j<game.zombies.length;j++){z=game.zombies[j];if(z.dead||z.dying||targets.indexOf(z)>=0)continue;d=dist(src.x,src.y,z.x,z.y);if(d<best){best=d;n=z;}}
    if(!n)break;targets.push(n);src=n;
  }
  var pts=zigPts(p.x,p.y,targets[0].x,targets[0].y,8);
  for(i=1;i<targets.length;i++)pts=pts.concat(zigPts(targets[i-1].x,targets[i-1].y,targets[i].x,targets[i].y,7).slice(1));
  pushBolt({pts:pts,life:0.11,maxLife:0.11});
  var forks=1+(Math.random()<0.55?1:0),k,a,b,ang,len;
  for(i=0;i<forks&&pts.length>3;i++){
    k=2+((Math.random()*(pts.length-3))|0);
    a=pts[k];ang=Math.atan2(pts[Math.min(k+1,pts.length-1)].y-pts[Math.max(0,k-1)].y,pts[Math.min(k+1,pts.length-1)].x-pts[Math.max(0,k-1)].x);
    ang+=(Math.random()<0.5?-1:1)*rand(0.55,1.2);len=rand(16,32);
    b={x:a.x+Math.cos(ang)*len,y:a.y+Math.sin(ang)*len};
    pushBolt({pts:zigPts(a.x,a.y,b.x,b.y,4),life:0.08,maxLife:0.08,fork:1});
  }
  for(i=0;i<targets.length;i++){
    hurtZombie(targets[i],dmg*(i?0.7:1),p.x,0,{quiet:1,noCrit:i>0});
    impactSpark(targets[i].x,targets[i].y);
    if(p.fireAmmo)targets[i].burn=1.4;if(p.iceAmmo)targets[i].slow=1.6;if(p.poisonAmmo)targets[i].poison=2;
  }
  sfx("zap");
}
function fireGompa(p,n){
  p.aimAng=Math.atan2(n.y-p.y,n.x-p.x);p.recoil=0.5;p.meleeSwing=0.14;
  var spd=400,b=bulletPool.pop()||{};
  b.x=p.x+Math.cos(p.aimAng)*18;b.y=p.y+Math.sin(p.aimAng)*18;
  b.vx=Math.cos(p.aimAng)*spd;b.vy=Math.sin(p.aimAng)*spd;b.r=7;
  b.damage=(16+(p.heavyBell?5:0))*p.damageMul;b.life=1.15*(p.rangeMul||1);
  b.pierce=0;b.bounce=0;b.bell=1;b.spinA=Math.random()*6;b.spinV=16;b.hit=new Set();
  if(p.fireAmmo)b.fire=1;if(p.iceAmmo)b.ice=1;if(p.poisonAmmo)b.poison=1;
  game.bullets.push(b);sfx("melee");
}
function fireMeleeHero(p,n){
  var range=(p.meleeRange||100)*(p.rangeMul||1)*(p.wideSlash?1.3:1);
  if(!n)return;
  var d=dist(p.x,p.y,n.x,n.y);p.aimAng=Math.atan2(n.y-p.y,n.x-p.x);
  if(d>22){var ln=Math.min(22,d-16);p.x+=Math.cos(p.aimAng)*ln;p.y+=Math.sin(p.aimAng)*ln;resolveCircle(p);}
  p.meleeSwing=0.24;p.swingDone=0;p.slashAng=p.aimAng;
  game.slashes.push({x:p.x,y:p.y,ang:p.aimAng,r:range*0.7,life:0.18,maxLife:0.18});
  sfx("slash");
}
var ERIC_WPN={
  pistol:{cd:0.38,dmg:12,spd:624,r:2.2,kind:"pistol"},
  smg:{cd:0.16,dmg:6.5,spd:720,r:2.0,spread:0.09,kind:"smg"},
  shotgun:{cd:0.58,dmg:9,spd:470,r:2.8,pellets:5,spread:0.34,kind:"shotgun"},
  revolver:{cd:0.50,dmg:32,spd:560,r:3.6,kind:"revolver"},
  rifle:{cd:0.20,dmg:13,spd:800,r:2.5,spread:0.035,kind:"rifle"},
  gl:{cd:0.68,dmg:48,spd:400,r:6,splash:32,rad:72,kind:"gl"}
};
function applyEricWeapon(p,id){
  var w=ERIC_WPN[id];if(!w)return;
  p.weapon=id;p.wpnLv=p.wpnLv||{};if(!p.wpnLv[id])p.wpnLv[id]=1;
  var lv=p.wpnLv[id],mul=Math.pow(1.14,lv-1);
  p.fireCooldown=Math.max(0.08,w.cd*Math.pow(0.96,lv-1));
  p.wpnBaseDmg=w.dmg*mul;p.wpnSpd=w.spd;p.wpnR=w.r;p.wpnSpread=w.spread||0;
  p.pellets=(w.pellets||0)?(w.pellets+Math.max(0,lv-1)):0;
  p.wpnSplash=w.splash?w.splash*mul:0;p.wpnRad=w.rad||0;
  p.twoHand=id==="shotgun"||id==="smg"||id==="rifle"||id==="gl";
}
function applyEricWeaponUp(p){
  var id=p.weapon;if(!ERIC_WPN[id])return;
  p.wpnLv=p.wpnLv||{};p.wpnLv[id]=Math.min(5,(p.wpnLv[id]||1)+1);
  applyEricWeapon(p,id);
}
function fireWeapon(p){
  var nearest=findNearestZombie(p,heroRange(p));
  if(p.weapon==="bolt"){if(!nearest)return;fireLightning(p,nearest);return;}
  if(p.weapon==="fist"){if(!nearest)return;fireGompa(p,nearest);return;}
  if(p.weapon==="knife"||(p.hasMelee&&p.hero==="mr")){if(!nearest)return;fireMeleeHero(p,nearest);return;}
  if(!nearest&&!p.hasMelee)return;
  if(p.hasMelee&&(!nearest||dist(p.x,p.y,nearest.x,nearest.y)<p.meleeRange*0.9)){p.meleeSwing=0.28;p.aimAng=nearest?Math.atan2(nearest.y-p.y,nearest.x-p.x):p.aimAng;sfx("melee");return;}
  if(!nearest)return;
  var dx=nearest.x-p.x,dy=nearest.y-p.y;p.aimAng=Math.atan2(dy,dx);p.recoil=1;p.muzzle=0.08;if(typeof ejectShell==="function")ejectShell(p);
  var originX=p.x+Math.cos(p.aimAng)*(p.r+10),originY=p.y+Math.sin(p.aimAng)*(p.r+10);
  var dmg=(p.wpnBaseDmg||CFG.BULLET_DAMAGE)*p.damageMul,shots=1+(p.extraShots|0),spread=p.wpnSpread||0,spd=p.wpnSpd||CFG.BULLET_SPEED;
  if(p.berserk&&p.hp/p.maxHp<0.4)dmg*=1.5;
  if(p.bloodlust)dmg*=(1+0.04*p.bloodStacks);
  if(p.weapon==="gl"){
    sfx("shot_gl");
    var gb=bulletPool.pop()||{};
    gb.x=originX;gb.y=originY;gb.vx=Math.cos(p.aimAng)*spd;gb.vy=Math.sin(p.aimAng)*spd;gb.r=p.wpnR||6;
    gb.damage=dmg;gb.life=1.15*(p.rangeMul||1);gb.pierce=0;gb.bounce=0;
    gb.gl=1;gb.spinA=0;gb.spinV=8;gb.expl=1;gb.explR=p.wpnRad||72;gb.explDmg=p.wpnSplash||dmg*0.65;gb.hit=new Set();
    if(p.fireAmmo)gb.fire=1;if(p.iceAmmo)gb.ice=1;if(p.poisonAmmo)gb.poison=1;
    game.bullets.push(gb);return;
  }
  if(p.weapon==="shotgun"){shots=(p.pellets||5)+(p.extraShots|0);spread=p.wpnSpread||0.34;sfx("shot_shotgun");}
  else if(p.weapon==="smg")sfx("shot_smg");
  else if(p.weapon==="revolver")sfx("shot_revolver");
  else if(p.weapon==="rifle")sfx("shot_rifle");
  else sfx("shot_pistol");
  if(p.fireAmmo)p.fireTimer+=0.04;
  for(var i=0;i<shots;i++){
    var t=shots===1?0:(i/(shots-1)-0.5),ang=p.aimAng+t*spread;
    var b=bulletPool.pop()||{};
    b.x=originX;b.y=originY;b.vx=Math.cos(ang)*spd;b.vy=Math.sin(ang)*spd;b.r=p.wpnR||(p.weapon==="shotgun"?2.8:2.2);
    b.damage=dmg;b.life=CFG.BULLET_LIFE*(p.rangeMul||1);b.pierce=p.pierce;b.bounce=p.bounce?2:0;
    b.fire=p.fireAmmo;b.ice=p.iceAmmo;b.poison=p.poisonAmmo;b.expl=p.explosiveAmmo;b.hit=new Set();
    if(p.weapon==="pistol"){b.pistol=1;b.tracer=1;}
    else if(p.weapon==="revolver")b.revolver=1;
    else if(p.weapon==="rifle")b.rifle=1;
    else if(p.weapon==="smg")b.smg=1;
    else if(p.weapon==="shotgun")b.shot=1;
    game.bullets.push(b);
  }
  addParticle(originX,originY,p.fireAmmo?"#ff5722":"#ffe082",0.1,Math.cos(p.aimAng)*40,Math.sin(p.aimAng)*40,4,2);
  if(p.overcharge&&Math.random()<0.15)hurtPlayer(p,2);
}
function hurtZombie(z,dmg,fromX,noChain,opts){
  if(z.dying||z.dead)return;opts=opts||{};
  var p=game.player;
  if(z.armor&&fromX!=null)dmg*=0.7;
  if(p.hunter&&z.isBoss)dmg*=1.18;
  if(p.lastStand&&p.hp<p.maxHp*0.35)dmg*=1.25;
  if(!opts.noCrit&&!noChain&&p.critChance&&Math.random()<p.critChance){dmg*=(p.critMul||2);floatText(z.x,z.y-8,"CRÍT","#ffeb3b");if(typeof extraCrit==="function")extraCrit(p,z);}
  z.hp-=dmg;z.hitFlash=0.12;
  if(opts.quiet){
    if(!z._laserTxt||game.time-z._laserTxt>0.2){floatText(z.x,z.y,""+Math.round(dmg),"#82b1ff");z._laserTxt=game.time;}
  }else{
    floatText(z.x,z.y,""+Math.round(dmg),"#ffe066");bloodBurst(z.x,z.y);sfx("hit");
    if(typeof addBlood==="function")addBlood(z.x,z.y,z.hp<=0?7:2);
  }
  if(z.isBoss&&typeof gfxHitStop==="function")gfxHitStop(0.05,"big");
  p.super=Math.min(CFG.SUPER_COST*(p.superCD?0.75:1),(p.super||0)+Math.min(12,dmg*0.25)*(p.superCharge?1.35:1));
  if(p.lifesteal)p.hp=Math.min(p.maxHp,p.hp+dmg*p.lifesteal);
  if(p.sparkOnHit&&!noChain){for(var i=0;i<game.zombies.length;i++){var o=game.zombies[i];if(o!==z&&!o.dead&&!o.dying&&dist(z.x,z.y,o.x,o.y)<50)hurtZombie(o,dmg*0.2,z.x,1);}}
  if(p.hasChain&&!noChain){var n=findNearestZombie({x:z.x,y:z.y},140);if(n&&n!==z)hurtZombie(n,dmg*0.5,z.x,1);}
  if(z.hp<=0)killZombie(z);
}
function killZombie(z){
  if(z.dying||z.dead)return;z.dying=1;z.deathT=0.45;sfx("death");
  if(typeof onExtraKill==="function")onExtraKill(z);
  var p=game.player;game.kills++;game.score+=z.score||10;grantRunXP(p,z.xp||10);
  for(var pi=0;pi<10;pi++)addParticle(z.x,z.y,pick(["#8bc34a","#a5d6a7","#6d4c41","#7a1f1a","#cfd8dc"]),0.55,rand(-110,110),rand(-140,-20),rand(5,13),3);
  if(typeof addBlood==="function")addBlood(z.x,z.y,8);
  if(p.bloodlust)p.bloodStacks=Math.min(10,(p.bloodStacks||0)+1);
  if(z.type==="exploder"||z.explode)explodeAt(z.x,z.y,70,28,{friendly:0});
  if(z.type==="splitter"){for(var i=0;i<2;i++){var m=spawnZombie("mini",z.x+rand(-16,16),z.y+rand(-16,16),game.wave);game.zombies.push(m);}}
}
function grantRunXP(p,n){
  if(p.xpMul)n=(n*p.xpMul)|0;
  if(p.xpMagnet)n=(n*1.25)|0;p.runXP+=n;
  while(p.runXP>=p.runXPNext){p.runXP-=p.runXPNext;p.runLevel++;p.runXPNext=(50+p.runLevel*25)|0;p.levelFlash=1;p.hp=Math.min(p.maxHp,p.hp+15);sfx("level");}
}
function hurtPlayer(p,dmg){
  if(p.invuln>0||game.state==="countdown"||game.state==="boss_intro")return;
  if(p.evasion&&Math.random()<p.evasion){floatText(p.x,p.y,"MISS","#90caf9");return;}
  if(p.hasShield&&p.shieldReady){p.shieldReady=0;p.shieldCd=6;p.invuln=0.4;sfx("hurt");return;}
  dmg*=(p.armorMul||1);if(p.giantT>0)dmg*=0.6;p.hp-=dmg;p.flash=0.12;p.invuln=CFG.INVULN_MS/1000;shake(6);
  sfx(dmg>15?"hurt_big":"hurt");
  if(p.thorns){var n=findNearestZombie(p,70);if(n)hurtZombie(n,dmg*0.4,p.x,1);}
  if(p.hp<=0){
    if(p.hasRevive&&!p.revived){p.revived=1;p.hp=p.maxHp*0.5;p.invuln=2;floatText(p.x,p.y,"REVIVE","#ff80ab");if(p.abilities.some(function(a){return a.id==="phoenix";}))p.fireAura=1;return;}
    game.state="dead";grantAccountXP(((p.runXP*0.1)|0)+5);layoutMenuButtons();sfx("death");
  }
}
function shake(n){game.shake=Math.max(game.shake||0,n);}
function dashDir(p){
  var mx=0,my=0;
  if(input.joy&&Math.abs(input.jx)+Math.abs(input.jy)>0.15){mx=input.jx;my=input.jy;}
  else if(input.keys.ArrowLeft||input.keys.a||input.keys.A)mx-=1;
  if(input.keys.ArrowRight||input.keys.d||input.keys.D)mx+=1;
  if(input.keys.ArrowUp||input.keys.w||input.keys.W)my-=1;
  if(input.keys.ArrowDown||input.keys.s||input.keys.S)my+=1;
  if(Math.abs(mx)+Math.abs(my)<0.15){mx=p.lastMoveX||0;my=p.lastMoveY||0;}
  var m=Math.sqrt(mx*mx+my*my);
  if(m<0.05){mx=Math.cos(p.facing||0);my=Math.sin(p.facing||0);m=Math.sqrt(mx*mx+my*my)||1;}
  return{x:mx/m,y:my/m};
}
function startDash(p,len,slash,ang){
  if(p.grabbed||(p.laserT>0))return;
  len*=(p.dashLenMul||1);
  var d=(ang!=null&&isFinite(ang))?{x:Math.cos(ang),y:Math.sin(ang)}:dashDir(p);
  p.dashT=0.18;p.dashVx=d.x*len/0.18;p.dashVy=d.y*len/0.18;
  p.invuln=Math.max(p.invuln,0.18);p.dashSlash=slash||0;p.facing=Math.atan2(d.y,d.x);
  var i,z;for(i=0;i<game.zombies.length;i++){z=game.zombies[i];z.dashHit=0;}
  sfx("dash");
}
function autoSuperAng(p){
  var n=typeof findNearestZombie==="function"?findNearestZombie(p,540):null;
  if(n)return Math.atan2(n.y-p.y,n.x-p.x);
  if(p.aimAng!=null)return p.aimAng;
  if(p.faceAng!=null)return p.faceAng;
  return p.facing||0;
}
function superKind(p){
  if(!p)return "cannon";
  if(p.hero==="trueno")return "laser";
  if(p.hero==="mr")return "knives";
  if(p.hero==="gompa")return "giant";
  return "cannon";
}
function superPreview(p,ang){
  var kind=superKind(p),wpn;
  if(kind==="laser")return{kind:kind,ang:ang,len:truenoLaserLen(p),w:15};
  if(kind==="knives")return{kind:kind,ang:ang,len:210,n:6,spread:48*Math.PI/180};
  if(kind==="giant")return{kind:kind,ang:ang,len:155,r:p.bigFlex?94:78};
  wpn=p&&p.weapon;
  if(wpn==="gl")return{kind:"cannon",ang:ang,len:230,n:10,spread:0.46,gl:1};
  if(wpn==="shotgun")return{kind:"cannon",ang:ang,len:200,n:26,spread:0.55};
  if(wpn==="smg")return{kind:"cannon",ang:ang,len:240,n:28,spread:0.50};
  if(wpn==="revolver")return{kind:"cannon",ang:ang,len:250,n:20,spread:0.38};
  if(wpn==="rifle")return{kind:"cannon",ang:ang,len:260,n:22,spread:0.32};
  return{kind:"cannon",ang:ang,len:250,n:24,spread:0.44};
}
function fireSuper(p,ang){
  if(!p||p.grabbed||(p.laserT>0)||(p.giantLeapT>0)||(p.super||0)<CFG.SUPER_COST)return;
  if(ang==null||!isFinite(ang))ang=autoSuperAng(p);
  p.super=0;p.facing=ang;p.aimAng=ang;if(p.faceAng!=null)p.faceAng=ang;
  if(typeof gfxHitStop==="function")gfxHitStop(0.055,"big");
  if(p.hero==="trueno"){startTruenoLaser(p,ang);return;}
  if(p.hero==="mr"){fireFlameKnives(p,ang);return;}
  if(p.hero==="gompa"){startGigante(p,ang);return;}
  fireCanonazo(p,ang);
}
function pushNova(x,y,r0,vr,life,col){
  if(!game.novas)game.novas=[];
  game.novas.push({x:x,y:y,r:r0||16,vr:vr||280,life:life||0.32,maxLife:life||0.32,col:col||"#ffe082"});
  if(game.novas.length>8)game.novas.splice(0,game.novas.length-8);
}
function fireCanonazo(p,ang){
  var wpn=p.weapon||"pistol",n=24,spread=0.44,mul=0.85,spd=p.wpnSpd||CFG.BULLET_SPEED,kick=240,i;
  if(wpn==="smg"){n=28;spread=0.50;mul=1.05;kick=200;}
  else if(wpn==="shotgun"){n=26;spread=0.55;mul=0.85;kick=280;spd=p.wpnSpd||470;}
  else if(wpn==="revolver"){n=20;spread=0.38;mul=0.42;kick=300;}
  else if(wpn==="rifle"){n=22;spread=0.32;mul=0.80;kick=230;}
  else if(wpn==="gl"){n=10;spread=0.46;mul=0.28;kick=320;spd=p.wpnSpd||400;}
  var dmg=(p.wpnBaseDmg||CFG.BULLET_DAMAGE)*mul*(p.damageMul||1);
  if(p.berserk&&p.hp/p.maxHp<0.4)dmg*=1.5;
  if(p.bloodlust)dmg*=(1+0.04*p.bloodStacks);
  var originX=p.x+Math.cos(ang)*(p.r+10),originY=p.y+Math.sin(ang)*(p.r+10);
  p.recoil=1;p.muzzle=0.2;p.knockT=0.2;p.knockVx=-Math.cos(ang)*kick;p.knockVy=-Math.sin(ang)*kick;
  if(typeof ejectShell==="function")ejectShell(p);
  for(i=0;i<n;i++){
    var t=n===1?0:(i/(n-1)-0.5),a=ang+t*spread+(Math.random()-0.5)*0.03,b=bulletPool.pop()||{};
    b.x=originX;b.y=originY;b.vx=Math.cos(a)*spd;b.vy=Math.sin(a)*spd;
    b.r=p.wpnR||(wpn==="shotgun"?2.8:2.2);b.damage=dmg;b.life=(CFG.BULLET_LIFE||1.05)*(p.rangeMul||1);
    b.pierce=0;b.bounce=0;b.hit=new Set();b.cannon=1;
    b.pistol=0;b.revolver=0;b.rifle=0;b.smg=0;b.shot=0;b.gl=0;b.expl=0;b.fire=0;b.ice=0;b.poison=0;b.knife=0;b.trail=0;b.bell=0;
    if(wpn==="pistol"){b.pistol=1;b.tracer=1;}
    else if(wpn==="revolver")b.revolver=1;
    else if(wpn==="rifle")b.rifle=1;
    else if(wpn==="smg")b.smg=1;
    else if(wpn==="shotgun")b.shot=1;
    else if(wpn==="gl"){b.gl=1;b.expl=1;b.explR=Math.min(32,(p.wpnRad||72)*0.42);b.explDmg=(p.wpnSplash||dmg)*0.4;b.spinV=8;b.r=4.2;b.life=0.95;}
    if(p.fireAmmo)b.fire=1;if(p.iceAmmo)b.ice=1;if(p.poisonAmmo)b.poison=1;
    game.bullets.push(b);
  }
  /* muzzle blast — few particles + a cheap ring, no shadowBlur */
  for(i=0;i<8;i++)addParticle(originX,originY,i<3?"#fff8e1":"#ffb74d",0.16,Math.cos(ang+rand(-0.5,0.5))*rand(40,160),Math.sin(ang+rand(-0.5,0.5))*rand(40,160),rand(4,8),2);
  pushNova(originX,originY,8,220,0.18,"#ffe082");
  shake(wpn==="gl"||wpn==="revolver"||wpn==="shotgun"?11:8);
  if(wpn==="shotgun")sfx("shot_shotgun");
  else if(wpn==="smg")sfx("shot_smg");
  else if(wpn==="revolver")sfx("shot_revolver");
  else if(wpn==="rifle")sfx("shot_rifle");
  else if(wpn==="gl")sfx("shot_gl");
  else sfx("shot_pistol");
  sfx("wave");
  floatText(p.x,p.y-18,"CAÑONAZO","#ffecb3");
}
function fireFlameKnives(p,ang){
  var n=6,spread=48*Math.PI/180,dmg=24*(p.damageMul||1),spd=510,i;
  var ys=(typeof CFG!=="undefined"&&CFG.YSCALE)||0.7;
  var originX=p.x+Math.cos(ang)*(p.r+10),originY=p.y+Math.sin(ang)*(p.r+10);
  /* Fan in screen space so 48° reads clearly under 3/4 YSCALE, and offset spawns so they are spaced from frame 0. */
  var sx=Math.cos(ang),sy=Math.sin(ang)*ys,sang=Math.atan2(sy,sx);
  var px=-Math.sin(sang),py=Math.cos(sang);
  p.meleeSwing=0.18;p.slashAng=ang;
  for(i=0;i<n;i++){
    var t=n===1?0:(i/(n-1)-0.5),slot=i-(n-1)/2,sa=sang+t*spread,b=bulletPool.pop()||{};
    var vx=Math.cos(sa),vy=Math.sin(sa)/ys,vl=Math.sqrt(vx*vx+vy*vy)||1;
    b.x=originX+px*slot*12;b.y=originY+(py*slot*12)/ys;
    b.vx=vx/vl*spd;b.vy=vy/vl*spd;b.r=6.2;
    b.damage=dmg;b.life=0.85*(p.rangeMul||1);b.pierce=0;b.pierceLeft=1+(Math.random()<0.55?1:0);
    b.bounce=0;b.hit=new Set();b.knife=1;b.fire=1;b.trail=1;b.trailT=0;b.spinA=0;b.spinV=2.2;
    b.flick=Math.random()*6.28;
    b.pistol=0;b.revolver=0;b.rifle=0;b.smg=0;b.shot=0;b.gl=0;b.expl=0;b.bell=0;b.cannon=0;b.ice=0;b.poison=0;
    game.bullets.push(b);
  }
  p.knockT=0.1;p.knockVx=-Math.cos(ang)*80;p.knockVy=-Math.sin(ang)*80;
  shake(5);sfx("slash");sfx("shot_gl");
}
function fireHitBurst(x,y){
  var i;
  addParticle(x,y,"#fff3e0",0.14,0,-8,11,4);
  for(i=0;i<6;i++)addParticle(x,y,i%2?"#ffd54f":"#ff6d00",0.22,rand(-90,90),rand(-110,20),rand(3,6),3);
}
function startGigante(p,ang){
  var len=155;
  p.giantPreScale=(p.scale&&p.giantT>0)?(p.giantPreScale||1):(p.scale||1);
  p.giantPreR=(p.r&&p.giantT>0)?(p.giantPreR||CFG.PLAYER_R):(p.r||CFG.PLAYER_R);
  p.giantT=6;p.giantMax=6;p.giantLanded=0;p.stompCd=0.2;
  p.giantLeapT=0.38;p.giantLeapMax=0.38;
  p.giantLeapX=p.x;p.giantLeapY=p.y;
  p.giantLeapTx=clamp(p.x+Math.cos(ang)*len,60,CFG.MAP_W-60);
  p.giantLeapTy=clamp(p.y+Math.sin(ang)*len,60,CFG.MAP_H-60);
  p.invuln=Math.max(p.invuln||0,0.38);
  p.vx=0;p.vy=0;
  shake(4);sfx("growl");floatText(p.x,p.y-20,"GIGANTE","#ffe0b2");
}
function giantSlam(p,rad,dmg,heavy){
  if(!p||!game)return;
  var i,z,r=rad*(p.bigFlex?1.2:1);
  for(i=0;i<game.zombies.length;i++){
    z=game.zombies[i];if(z.dead||z.dying)continue;
    if(dist(p.x,p.y,z.x,z.y)<r+z.r){
      hurtZombie(z,dmg,p.x,1,{quiet:!heavy,noCrit:1});
      if(heavy){z.stun=Math.max(z.stun||0,0.35);z.slow=Math.max(z.slow||0,0.6);}
    }
  }
  pushNova(p.x,p.y,heavy?18:10,heavy?340:260,heavy?0.4:0.24,heavy?"#bcaaa4":"#d7ccc8");
  if(heavy){shake(8);sfx("explode");sfx("foot_heavy");}
  else{shake(3);sfx("foot_heavy");}
  var k,maxP=heavy?6:3;
  for(k=0;k<maxP;k++)addParticle(p.x,p.y,"#bcaaa4",0.22,rand(-70,70),rand(-50,20),rand(4,8),3);
}
function crushSmallZombies(p){
  var i,z,small;
  for(i=0;i<game.zombies.length;i++){
    z=game.zombies[i];if(z.dead||z.dying||z.crushHit)continue;
    if(z.isBoss||z.isHome||z.isColossus||z.type==="tank"||z.type==="armored")continue;
    small=z.type==="normal"||z.type==="fast"||z.type==="crawler"||z.type==="jumper"||z.type==="exploder"||z.type==="spitter"||z.type==="screamer"||z.type==="splitter";
    if(!small)continue;
    if(dist(p.x,p.y,z.x,z.y)<p.r+z.r-1){
      z.crushHit=1;
      if(typeof killZombie==="function")killZombie(z);
      else hurtZombie(z,z.hp+5,p.x,1,{quiet:1,noCrit:1});
      addParticle(z.x,z.y,"#8d6e63",0.18,rand(-40,40),rand(-40,10),6,3);
    }
  }
}
function stopGigante(p){
  if(!p)return;
  p.giantT=0;p.giantLeapT=0;p.airH=0;
  if(p.giantPreScale!=null)p.scale=p.giantPreScale;
  if(p.giantPreR!=null)p.r=p.giantPreR;
}
function updateGigante(p,dt){
  if(!p)return;
  if(!(p.giantT>0)&&!(p.giantLeapT>0))return;
  if(p.grabbed||(game&&game.state!=="playing"&&game.state!=="countdown")){stopGigante(p);return;}
  if(p.giantT>0)p.giantT-=dt;
  var pre=p.giantPreScale||1,target=Math.min(2.15,Math.max(2,pre*1.55)),grow=0.35,shrink=0.45;
  var tLeft=Math.max(0,p.giantT),tMax=p.giantMax||6,elapsed=tMax-tLeft,sc;
  if(elapsed<grow)sc=pre+(target-pre)*(elapsed/grow);
  else if(tLeft<shrink)sc=pre+(target-pre)*Math.max(0,tLeft/shrink);
  else sc=target;
  p.scale=sc;p.r=CFG.PLAYER_R*sc;
  if(p.giantLeapT>0){
    p.giantLeapT-=dt;
    var u=1-clamp(p.giantLeapT/(p.giantLeapMax||0.38),0,1);
    p.x=p.giantLeapX+(p.giantLeapTx-p.giantLeapX)*u;
    p.y=p.giantLeapY+(p.giantLeapTy-p.giantLeapY)*u;
    p.airH=Math.sin(u*Math.PI)*38;
    p.x=clamp(p.x,60,CFG.MAP_W-60);p.y=clamp(p.y,60,CFG.MAP_H-60);resolveCircle(p);
    if(p.giantLeapT<=0){
      p.airH=0;p.giantLanded=1;p.giantLeapT=0;
      p.x=p.giantLeapTx;p.y=p.giantLeapTy;resolveCircle(p);
      giantSlam(p,p.bigFlex?94:78,34*(p.damageMul||1),1);
    }
    return;
  }
  if(p.giantT<=0){stopGigante(p);return;}
  p.stompCd=(p.stompCd||0)-dt;
  if(p.stompCd<=0&&Math.abs(p.vx)+Math.abs(p.vy)>24){
    p.stompCd=0.38;
    giantSlam(p,p.bigFlex?66:56,16*(p.damageMul||1),0);
  }
  if(sc>1.45)crushSmallZombies(p);
}
function startTruenoLaser(p,ang){
  p.laserT=3;p.laserMax=3;p.laserAng=ang;p.laserLen=truenoLaserLen(p);p.laserW=15;p.laserDps=38;p.laserTick=0;
  p.boltFlash=0.12;shake(3);sfx("laser_hum");sfx("storm");
}
function stopTruenoLaser(p){
  if(!p)return;
  if(p.laserT>0||audio.laserHum)sfx("laser_hum_off");
  p.laserT=0;
}
function updateTruenoLaser(p,dt){
  if(!p)return;
  if(!(p.laserT>0))return;
  if(p.grabbed||(game&&game.state!=="playing")){stopTruenoLaser(p);return;}
  p.laserT-=dt;
  p.laserLen=truenoLaserLen(p);p.laserW=15;
  var want=null,rate=11;
  /* Super stick only — lifting the thumb keeps the last laserAng. Move stick never steers the beam. */
  if(input.super&&Math.sqrt((input.sjx||0)*(input.sjx||0)+(input.sjy||0)*(input.sjy||0))>0.2){
    want=Math.atan2(input.sjy,input.sjx);
  }
  if(want!=null){
    var d=Math.atan2(Math.sin(want-p.laserAng),Math.cos(want-p.laserAng));
    p.laserAng+=d*(1-Math.exp(-rate*dt));
  }
  p.facing=p.laserAng;p.aimAng=p.laserAng;p.faceAng=p.laserAng;
  var x2=p.x+Math.cos(p.laserAng)*p.laserLen,y2=p.y+Math.sin(p.laserAng)*p.laserLen,half=(p.laserW||15)*0.5,i,z,dseg,hit=0;
  p.laserTick-=dt;
  if(p.laserTick<=0){
    p.laserTick=0.12;
    var tick=p.laserDps*(p.damageMul||1)*0.12;
    for(i=0;i<game.zombies.length;i++){
      z=game.zombies[i];if(z.dead||z.dying)continue;
      dseg=distSeg(z.x,z.y,p.x,p.y,x2,y2);
      if(dseg<half+z.r){
        hurtZombie(z,tick,p.x,1,{quiet:1,noCrit:1});
        z.burn=Math.max(z.burn||0,0.3);hit=1;
        if(Math.random()<0.28)addParticle(z.x+rand(-5,5),z.y+rand(-5,5),"#e3f2fd",0.16,rand(-30,30),rand(-40,16),rand(3,6),3);
      }
    }
    if(hit&&Math.random()<0.45){sfx("crackle");shake(1);}
  }
  if(Math.random()<0.08){
    var t=Math.random(),px=p.x+(x2-p.x)*t,py=p.y+(y2-p.y)*t,nx=-Math.sin(p.laserAng),ny=Math.cos(p.laserAng),off=(Math.random()-0.5)*12;
    pushBolt({pts:zigPts(px-nx*6,py-ny*6,px+nx*6+off,py+ny*6-off,3),life:0.07,maxLife:0.07,fork:1});
  }
  if(Math.random()<0.18)addParticle(x2,y2,"#bbdefb",0.14,rand(-22,22),rand(-22,22),rand(3,6),3);
  if(p.laserT<=0)stopTruenoLaser(p);
}
function goToMenu(){if(game&&game.player){stopTruenoLaser(game.player);if(typeof stopGigante==="function")stopGigante(game.player);}stopMusic();game=createTitleState();skipDtClamp=1;layoutMenuButtons();startMusic("menu");}
function emptyFX(){return{zombies:[],bullets:[],particles:[],floatTexts:[],projectiles:[],grenades:[],bolts:[],slashes:[],novas:[],lasers:[],scorches:[],bloods:[],meteors:[],fires:[],timeScale:1,hitStop:0,hitStopCd:0};}
function createTitleState(){buildMap(2026);var p=createPlayer();applyHero(p,selectedHero||"classic");p.x=760;p.y=900;var g=emptyFX();g.state="title";g.player=p;g.camX=p.x;g.camY=p.y;g.shake=0;g.wave=0;g.kills=0;g.score=0;g.waveSpawned=0;g.upgradeChoices=[];g.upgradeCards=[];g.time=0;g.bossSpawned=0;g.bossFight=0;g.message=null;g.messageTimer=0;g.titleZ=[];g.seed=2026;g.menuT=0;g.countdown=0;g.colossus=null;g.boss=null;g.home=null;g.spawnQueue=[];g.spawnTimer=0;return g;}
function startGame(){
  buildMap(((Math.random()*1e9)|0)^Date.now());
  var p=createPlayer();applyHero(p,selectedHero||"classic");p.x=760;p.y=900;resolveCircle(p);
  game=emptyFX();game.state="playing";game.player=p;game.camX=p.x;game.camY=p.y;game.shake=0;game.wave=0;game.kills=0;game.score=0;game.waveSpawned=0;game.upgradeChoices=[];game.upgradeCards=[];game.time=0;game.bossSpawned=0;game.bossFight=0;game.message=null;game.messageTimer=0;game.seed=1;game.menuT=0;game.colossus=null;game.boss=null;game.home=null;game.spawnQueue=[];game.spawnTimer=0;game.countdown=0;
  skipDtClamp=1;startWave(0);layoutMenuButtons();
}
function poolForWave(idx){var pool=["normal"];for(var w=0;w<=idx&&w<WAVE_UNLOCKS.length;w++){var u=WAVE_UNLOCKS[w];for(var i=0;i<u.length;i++)if(u[i]!=="boss"&&pool.indexOf(u[i])<0)pool.push(u[i]);}return pool;}
function startWave(idx){
  game.wave=idx;game.waveSpawned=0;game.spawnQueue=[];game.zombies=game.zombies.filter(function(z){return!z.dead;});game.bullets.length=0;game.projectiles.length=0;game.grenades.length=0;if(game.lasers)game.lasers.length=0;if(game.scorches)game.scorches.length=0;if(game.novas)game.novas.length=0;if(game.slashes)game.slashes.length=0;game.bossSpawned=0;game.bossFight=0;game.boss=null;game.colossus=null;game.home=null;
  var n=CFG.BASE_ZOMBIES+idx*CFG.ZOMBIES_PER_WAVE,pool=poolForWave(idx),i;
  if(idx===2||idx===5){for(i=0;i<3;i++)game.spawnQueue.push(pick(pool.length?pool:["normal"]));}
  else if(idx===9){for(i=0;i<6;i++)game.spawnQueue.push(pick(pool));}
  else{
    for(i=0;i<n;i++)game.spawnQueue.push(i===0&&idx>2?"fast":pick(pool));
  }
  updateFlow(game.player.x,game.player.y);
  startMusic("play");
  if(idx===0){
    game.state="countdown";game.countdown=5;game.countShown=5;game.countGroanT=0.15;sfx("wave");zombieMoan();
  }else beginCombat();
}
function beginCombat(){
  var p=game.player;
  if(game.wave===2){var s=pickSpawn(p);startBoss(spawnColossus(s.x,s.y),"¡Vamos a gamblear!","Va va vamos a gam gam blear",88);return;}
  if(game.wave===5){var s1=pickSpawn(p);startBoss(spawnHome(s1.x,s1.y),"¿Sabéis quién soy?","Sa sa sabeis quien soy yo",110);return;}
  if(game.wave===9){var s2=pickSpawn(p),fb=spawnZombie("boss",s2.x,s2.y,9);fb.isBoss=1;fb.hp=1250;fb.maxHp=1250;fb.r=26;fb.h=58;fb.bName="JEFE FINAL";fb.look.final=1;fb.look.kind="final";fb.look.type="boss";fb.rings=[];fb.throws=[];fb.atkCd=2;fb.windup=null;fb.windupT=0;fb.chargeT=0;startBoss(fb,"¡El fin!","El fin",70);return;}
  p.invuln=Math.max(p.invuln,0.9);game.state="playing";game.spawnTimer=0.5;game.graceT=1.4;
}
function startBoss(z,line,bab,pitch){
  game.zombies.push(z);game.boss=z;if(z.isColossus)game.colossus=z;if(z.isHome)game.home=z;
  game.bossSpawned=1;game.bossFight=1;game.state="boss_intro";game.message=null;
  game.introX=game.camX;game.introY=game.camY;
  z.phase="intro";z.introT=4.2;z.bubbleFull=line;z.bubbleText="";z.bubbleIdx=0;z.bubbleT=0;
  if(game.player)game.player.invuln=Math.max(game.player.invuln,4.3);
  sfx("boss");sfx("sting");
  if(z.isHome){sfx("laugh");startMusic("home");z.loom=1;}
  else if(z.isColossus){sfx("growl");sfx("foot_heavy");startMusic("colo");}
  else startMusic("final");
  try{babbleSpeak(bab,{pitch:pitch||90,gap:0.13});}catch(e){}
}
function speakColossus(){
  try{if(game&&game.colossus){game.colossus.bubbleText="";game.colossus.bubbleFull="¡Vamos a gamblear!";game.colossus.bubbleIdx=0;game.colossus.bubbleT=0;}babbleSpeak("Va va vamos a gam gam blear",{pitch:88,gap:0.13});}catch(e){}
}
function onWaveCleared(){if(game.bossFight){startMusic("play");game.bossFight=0;}if(game.wave>=9){game.state="victory";grantAccountXP(((game.player.runXP*0.25)|0)+50);layoutMenuButtons();sfx("clear");return;}game.state="upgrade";skipDtClamp=1;sfx("clear");game.rerollLeft=1;if(game.player&&game.player.secondWind)game.player.hp=Math.min(game.player.maxHp,game.player.hp+game.player.maxHp*0.2);pickUpgradeChoices();}
function rollRarity(luck){
  var w=RARITIES.map(function(r){return r.w;}),wave=(game&&game.wave)||0,wr=wave*0.85,t=0,i,r,a=0;
  if(luck>0){w[0]=Math.max(20,w[0]-luck*0.6);w[3]+=luck*0.25;w[4]+=luck*0.15;w[2]+=luck*0.2;}
  w[0]=Math.max(16,w[0]-wr*0.8);w[1]=Math.max(14,w[1]-wr*0.15);w[2]+=wr*0.3;w[3]+=wr*0.4;w[4]+=wr*0.35;
  for(i=0;i<w.length;i++)t+=w[i];r=Math.random()*t;
  for(i=0;i<w.length;i++){a+=w[i];if(r<=a)return i;}return 0;
}
function tradeLine(def){var parts=[],i;for(i=0;i<(def.plus||[]).length;i++)parts.push({s:"+"+def.plus[i],c:"#2ecc71"});for(i=0;i<(def.minus||[]).length;i++)parts.push({s:"-"+def.minus[i],c:"#e74c3c"});return parts;}
function buildUpgradeCard(def,ri){
  var R=RARITIES[ri],card={id:def.id,name:def.name,icon:def.icon,rarity:ri,rarityName:R.name,color:R.color,glow:R.glow,frame:R.frame,def:def,desc:def.desc||"",trade:tradeLine(def),apply:null};
  var tv=def.tiers?def.tiers[ri]:0;
  if(def.kind==="mul")card.desc="Aumenta "+(def.stat==="damageMul"?"el daño":def.stat==="speedMul"?"la velocidad":def.stat==="rangeMul"?"el alcance":"la potencia")+" un "+Math.round(tv*100)+"%";
  else if(def.kind==="cd")card.desc="Disparas un "+Math.round(tv*100)+"% más rápido";
  else if(def.kind==="hp")card.desc="+"+tv+" de vida máxima y te cura lo mismo";
  else if(def.kind==="heal")card.desc="Recuperas "+tv+" puntos de vida al instante";
  else if(def.kind==="add"&&def.stat==="extraShots")card.desc="Disparas "+tv+" proyectil(es) extra";
  else if(def.kind==="add"&&def.stat==="luck")card.desc="+"+tv+" suerte (mejores rarezas)";
  else if(def.kind==="set"&&def.stat==="lifesteal")card.desc="Robas un "+Math.round(tv*100)+"% del daño como vida";
  else if(def.kind==="set"&&def.stat==="regen")card.desc="Regeneras "+tv+" de vida por segundo";
  else if(def.kind==="set"&&def.stat==="critChance")card.desc="+"+Math.round(tv*100)+"% probabilidad de crítico";
  else if(def.kind==="set"&&def.stat==="critMul")card.desc="Los críticos hacen x"+tv.toFixed(1)+" daño";
  else if(def.weapon==="shotgun")card.desc="Abanico de perdigones. Fuerte a corta distancia.";
  else if(def.weapon==="smg")card.desc="Ráfagas rápidas de balas ligeras.";
  else if(def.weapon==="revolver")card.desc="Disparos pesados y precisos.";
  else if(def.weapon==="rifle")card.desc="Cadencia firme y buen alcance.";
  else if(def.weapon==="gl")card.desc="Granadas explosivas de gran potencia.";
  else if(def.kind==="wpnUp")card.desc=def.desc||"Mejora tu arma actual.";
  else if(def.flag==="doubleJump")card.desc="Tu super es un dash más largo (dos cargas)";
  else if(def.flag==="tripleJump")card.desc="Dash aún más largo con tres cargas";
  else if(def.flag==="pierce")card.desc="Tus balas atraviesan a varios enemigos";
  else if(def.flag==="hasMelee")card.desc="Ataque cuerpo a cuerpo automático cercano";
  else if(def.flag==="hasShield")card.desc="Un escudo que absorbe un golpe cada 6s";
  else if(def.flag==="hasDash")card.desc="El super se convierte en un dash ofensivo";
  else if(def.flag==="stomp")card.desc="Al usar el super sueltas una onda de choque";
  else if(def.flag==="hasOrbit")card.desc="Hojas que giran a tu alrededor";
  else if(def.flag==="hasChain")card.desc="El daño salta a un enemigo cercano";
  else if(def.flag==="hasRevive")card.desc="Revives una vez al morir";
  else if(def.flag==="fireAmmo")card.desc="Tus balas prenden a los zombis";
  else if(def.flag==="iceAmmo")card.desc="Tus balas ralentizan";
  else if(def.flag==="poisonAmmo")card.desc="Tus balas envenenan";
  else if(def.flag==="explosiveAmmo")card.desc="Las balas estallan al impactar";
  else if(def.flag==="bounce")card.desc="Las balas rebotan en las paredes";
  else if(def.custom==="giant")card.desc="Más grande, más fuerte, más lento";
  else if(def.custom==="dwarf")card.desc="Más pequeño y ágil, menos daño";
  else if(def.flag==="thorns")card.desc="Devuelves parte del daño";
  else if(def.flag==="xpMagnet")card.desc="Ganas más XP";
  else if(def.flag==="hasDrone")card.desc="Un dron dispara por ti";
  else if(def.flag==="hasDog")card.desc="Un perro zombi te acompaña";
  else if(def.flag==="fireAura")card.desc="Quemas a los enemigos cercanos";
  else if(def.custom==="berserk")card.desc="Más daño cuando te queda poca vida";
  else if(def.custom==="crystal")card.desc="Muchísimo daño, menos vida";
  else if(def.custom==="tanky")card.desc="Mucha vida y armadura, menos agilidad";
  else if(def.custom==="ninja")card.desc="Más agilidad y críticos, menos vida";
  else if(def.custom==="vamp")card.desc="Robavida y agilidad";
  else if(def.custom==="glass")card.desc="Daño extremo, de cristal";
  else if(def.custom==="shadow")card.desc="Evasión y dash, menos daño";
  else if(def.custom==="phoenix")card.desc="Revives con un aura de fuego";
  else if(def.flag==="overcharge")card.desc="Cadencia extrema, con un riesgo";
  else if(def.flag==="sparkOnHit")card.desc="El impacto chisporrotea a otros";
  else if(def.flag==="bloodlust")card.desc="Cada baja te hace más fuerte";
  else if(def.flag==="chainJumps")card.desc="Tus rayos saltan a un zombi más";
  else if(def.flag==="bigStorm")card.desc="La tormenta del super es más amplia";
  else if(def.flag==="wideSlash")card.desc="El cuchillo llega más lejos";
  else if(def.flag==="bleedSlash")card.desc="Los cortes dejan sangrando";
  else if(def.flag==="heavyBell")card.desc="Tus pesas hacen más daño";
  else if(def.flag==="bigFlex")card.desc="El Flex aturde en más área";
  else if(def.desc)card.desc=def.desc;
  else card.desc=def.name;
  if(def.desc)card.desc=def.desc;
  card.apply=function(pl){applyUpgrade(pl,def,ri);};
  return card;
}
function applyUpgrade(p,def,ri){
  var R=RARITIES[ri],tv=def.tiers?def.tiers[ri]:0;
  p.abilities.push({id:def.id,name:def.name,rarity:ri});
  if(def.kind==="mul")p[def.stat]=(p[def.stat]||1)*(1+tv);
  else if(def.kind==="cd")p.fireCooldown=Math.max(0.08,p.fireCooldown*(1-tv));
  else if(def.kind==="hp"){p.maxHp+=tv;p.hp=Math.min(p.maxHp,p.hp+tv);}
  else if(def.kind==="heal")p.hp=Math.min(p.maxHp,p.hp+tv);
  else if(def.kind==="add")p[def.stat]=(p[def.stat]||0)+tv;
  else if(def.kind==="set")p[def.stat]=tv;
  if(def.weapon){if(typeof applyEricWeapon==="function")applyEricWeapon(p,def.weapon);else{p.weapon=def.weapon;if(def.weapon==="shotgun")p.pellets=5;if(def.weapon==="smg")p.fireCooldown=Math.min(p.fireCooldown,0.18);}}
  if(def.kind==="wpnUp"&&typeof applyEricWeaponUp==="function")applyEricWeaponUp(p);
  if(def.flag)p[def.flag]=1;
  if(def.flag==="hasDash")p.dashLeft=1;
  if(def.flag==="doubleJump"){p.hasDash=1;p.dashLeft=2;}
  if(def.flag==="tripleJump"){p.hasDash=1;p.doubleJump=1;p.dashLeft=3;}
  if(def.flag==="dualPistols"){p.extraShots=(p.extraShots||0)+1;p.twoHand=1;}
  if(def.flag==="turboDash")p.dashLenMul=1.35;
  if(def.flag==="luckyCharm"){p.luck=(p.luck||0)+2;p.critChance=Math.min(0.55,(p.critChance||0)+0.08);}
  if(def.custom==="lastStand")p.lastStand=1;
  if(def.custom==="giant"){p.scale=1.35;p.r=CFG.PLAYER_R*1.3;p.damageMul*=1.25;p.maxHp+=40;p.hp+=40;p.speedMul*=0.88;}
  if(def.custom==="dwarf"){p.scale=0.78;p.r=CFG.PLAYER_R*0.8;p.damageMul*=0.9;p.speedMul*=1.2;p.evasion=Math.max(p.evasion||0,0.12);}
  if(def.custom==="berserk")p.berserk=1;
  if(def.custom==="crystal"){p.damageMul*=1.6;p.maxHp=Math.max(40,p.maxHp-35);p.hp=Math.min(p.hp,p.maxHp);}
  if(def.custom==="tanky"){p.maxHp+=70;p.hp+=70;p.armorMul=0.75;p.speedMul*=0.85;p.fireCooldown*=1.1;}
  if(def.custom==="ninja"){p.speedMul*=1.25;p.critChance=Math.max(p.critChance,0.18);p.maxHp=Math.max(40,p.maxHp-25);p.hp=Math.min(p.hp,p.maxHp);}
  if(def.custom==="vamp"){p.lifesteal=Math.max(p.lifesteal,0.1);p.speedMul*=1.12;p.maxHp=Math.max(40,p.maxHp-20);p.hp=Math.min(p.hp,p.maxHp);}
  if(def.custom==="glass"){p.damageMul*=1.8;p.maxHp=Math.max(30,p.maxHp*0.6);p.hp=Math.min(p.hp,p.maxHp);p.armorMul=1.15;}
  if(def.custom==="shadow"){p.evasion=Math.max(p.evasion||0,0.2);p.hasDash=1;p.damageMul*=0.9;}
  if(def.custom==="phoenix"){p.hasRevive=1;p.fireAura=1;}
  if(def.extra){if(def.extra.fireCooldown)p.fireCooldown*=def.extra.fireCooldown;if(def.extra.speedMul)p.speedMul*=def.extra.speedMul;if(def.extra.maxHp){p.maxHp+=def.extra.maxHp;p.hp=Math.min(p.hp,p.maxHp);}}
  if(def.flag==="fireAura")p.maxHp=Math.max(40,p.maxHp-15);
  if(def.flag==="wideSlash")p.meleeRange=(p.meleeRange||100)*1.3;
  if(def.flag==="heavyBell")p.heavyBell=1;
}

function takenFlags(p){var t={},i;for(i=0;i<p.abilities.length;i++)t[p.abilities[i].id]=1;return t;}
function pickUpgradeChoices(){var p=game.player,taken=takenFlags(p),choices=[],guard=0;while(choices.length<3&&guard++<60){var ri=rollRarity(p.luck|0);var pool=UPGRADE_DEFS.filter(function(d){if((d.once||d.flag||d.weapon||d.custom)&&taken[d.id])return 0;if(d.minR!=null&&ri<d.minR)return 0;if(d.exclusive&&ri<4)return 0;if(d.hero&&d.hero!==p.hero)return 0;if(d.weapon&&p.hero&&p.hero!=="classic")return 0;if(d.fixedR!=null&&ri!==d.fixedR)return 0;if(d.reqWeapon&&p.weapon!==d.reqWeapon)return 0;if(d.kind==="wpnUp"&&((p.wpnLv&&p.wpnLv[p.weapon])||1)>=5)return 0;if(d.flag==="hasMelee"&&(p.hero==="mr"||p.hero==="gompa"))return 0;if((d.flag==="pierce"||d.flag==="bounce")&&p.hero&&p.hero!=="classic")return 0;for(var c=0;c<choices.length;c++)if(choices[c].id===d.id)return 0;return 1;});if(!pool.length){ri=Math.max(0,ri-1);continue;}choices.push(buildUpgradeCard(pick(pool),ri));}game.upgradeChoices=choices;layoutUpgradeCards();}
function layoutUpgradeCards(){
  var n=game.upgradeChoices.length;
  var cardW2=Math.min(200,(SW-layout.safe.l-layout.safe.r-70)/n-12),cardH2=Math.min(250,SH*0.62);
  var totalW=n*cardW2+(n-1)*12,startX=(SW-totalW)/2,y=Math.max(layout.safe.t+44,(SH-cardH2)/2-10);
  game.upgradeCards=game.upgradeChoices.map(function(u,i){return{upgrade:u,x:startX+i*(cardW2+12),y:y,w:cardW2,h:cardH2,stacked:0};});
  var rw=Math.min(200,SW*0.28),rh=40;
  game.rerollBtn={x:(SW-rw)/2,y:Math.min(SH-layout.safe.b-16-rh,(y+cardH2+16)),w:rw,h:rh};
}
function handleUpgradeClick(lx,ly){
  var b=game.rerollBtn;
  if(b&&(game.rerollLeft||0)>0&&lx>=b.x&&lx<=b.x+b.w&&ly>=b.y&&ly<=b.y+b.h){
    game.rerollLeft=0;sfx("card");pickUpgradeChoices();return;
  }
  for(var i=0;i<game.upgradeCards.length;i++){var card=game.upgradeCards[i];if(lx>=card.x&&lx<=card.x+card.w&&ly>=card.y&&ly<=card.y+card.h){card.upgrade.apply(game.player);sfx("card");sfx("rarity"+card.upgrade.rarity);startWave(game.wave+1);skipDtClamp=1;return;}}
}
