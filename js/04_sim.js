var input={jx:0,jy:0,joy:0,joyX:0,joyY:0,joyId:-1,keys:{},super:0,pause:0};
function createPlayer(){
  return{x:CFG.MAP_W/2,y:CFG.MAP_H/2,vx:0,vy:0,r:CFG.PLAYER_R,hp:CFG.MAX_HP,maxHp:CFG.MAX_HP,invuln:0,fireTimer:0,fireCooldown:CFG.FIRE_COOLDOWN,damageMul:1,speedMul:1,rangeMul:1,weapon:"pistol",pellets:1,extraShots:0,pierce:0,doubleJump:0,tripleJump:0,hasMelee:0,meleeRange:70,meleeDmg:20,meleeTimer:0,meleeSwing:0,hasShield:0,shieldReady:1,shieldCd:0,lifesteal:0,flash:0,anim:0,recoil:0,muzzle:0,aimAng:0,luck:0,hasOrbit:0,orbitAngle:0,hasChain:0,hasRevive:0,revived:0,runXP:0,runLevel:1,runXPNext:50,levelFlash:0,fireAmmo:0,iceAmmo:0,poisonAmmo:0,explosiveAmmo:0,thorns:0,hasDash:0,dashCd:0,dashT:0,dashLeft:0,regen:0,critChance:0,critMul:1.5,bounce:0,xpMagnet:0,hasDrone:0,droneAngle:0,droneX:0,droneY:0,hasDog:0,dog:{x:0,y:0,anim:0},fireAura:0,berserk:0,stomp:0,bloodlust:0,bloodStacks:0,sparkOnHit:0,overcharge:0,armorMul:1,evasion:0,abilities:[],scale:1,look:makePlayerLook(),super:0,facing:0,hero:"classic",lastMoveX:1,lastMoveY:0,dashSlash:0};
}
function applyHero(p,id){
  id=id||"classic";p.hero=id;p.look=makeHeroLook(id);
  if(id==="trueno"){p.weapon="bolt";p.fireCooldown=0.42;p.maxHp=90;p.hp=90;p.speedMul=1.05;p.damageMul=1.1;}
  else if(id==="mr"){p.weapon="knife";p.hasMelee=1;p.meleeRange=88;p.meleeDmg=14;p.fireCooldown=0.42;p.maxHp=120;p.hp=120;p.speedMul=1.15;p.armorMul=0.92;}
  else if(id==="gompa"){p.weapon="fist";p.meleeRange=86;p.meleeDmg=16;p.fireCooldown=0.5;p.maxHp=140;p.hp=140;p.speedMul=0.88;p.damageMul=1;}
  else {p.weapon="pistol";p.fireCooldown=CFG.FIRE_COOLDOWN;}
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
function floatText(x,y,text,col){var f=floatPool.pop()||{};f.x=x;f.y=y;f.text=text;f.col=col||"#fff";f.life=0.8;game.floatTexts.push(f);}
function bloodBurst(x,y){for(var i=0;i<6;i++)addParticle(x,y,"#8b0000",0.3,rand(-80,80),rand(-80,80),3,1);}
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
  for(i=0;i<game.zombies.length;i++){z=game.zombies[i];if(z.dead||z.dying)continue;d=dist(p.x,p.y,z.x,z.y);if(d>=bestD)continue;if(d>40&&hiddenInBush(z.x,z.y,p))continue;if(d>28&&!hasLOS(p.x,p.y,z.x,z.y))continue;bestD=d;best=z;}
  return best;
}
function heroRange(p){
  if(p.weapon==="knife"||(p.hasMelee&&p.hero==="mr"))return (p.meleeRange||88)*(p.rangeMul||1)*(p.wideSlash?1.25:1)*1.2;
  return CFG.AUTO_RANGE*(p.rangeMul||1);
}
function zigPts(ax,ay,bx,by,n){
  var pts=[{x:ax,y:ay}],i,t,px,py,nx,ny,d=dist(ax,ay,bx,by)||1,ox=-(by-ay)/d,oy=(bx-ax)/d;
  for(i=1;i<n;i++){t=i/n;px=ax+(bx-ax)*t;py=ay+(by-ay)*t;var off=(i%2?1:-1)*rand(8,16);pts.push({x:px+ox*off,y:py+oy*off});}
  pts.push({x:bx,y:by});return pts;
}
function fireLightning(p,first){
  var jumps=3+(p.chainJumps?1:0)+(p.extraShots|0),dmg=CFG.BULLET_DAMAGE*1.05*p.damageMul,i,targets=[first],src=first,n;
  if(p.berserk&&p.hp/p.maxHp<0.4)dmg*=1.5;
  if(p.bloodlust)dmg*=(1+0.04*p.bloodStacks);
  p.aimAng=Math.atan2(first.y-p.y,first.x-p.x);p.recoil=1;p.muzzle=0.1;
  for(i=1;i<jumps;i++){
    n=null;var best=140*(p.rangeMul||1),j,z,d;
    for(j=0;j<game.zombies.length;j++){z=game.zombies[j];if(z.dead||z.dying||targets.indexOf(z)>=0)continue;d=dist(src.x,src.y,z.x,z.y);if(d<best){best=d;n=z;}}
    if(!n)break;targets.push(n);src=n;
  }
  var pts=zigPts(p.x,p.y,targets[0].x,targets[0].y,5);
  for(i=1;i<targets.length;i++)pts=pts.concat(zigPts(targets[i-1].x,targets[i-1].y,targets[i].x,targets[i].y,4).slice(1));
  game.bolts.push({pts:pts,life:0.32,maxLife:0.32});
  for(i=0;i<targets.length;i++){hurtZombie(targets[i],dmg*(i?0.7:1),p.x);if(p.fireAmmo)targets[i].burn=1.4;if(p.iceAmmo)targets[i].slow=1.6;if(p.poisonAmmo)targets[i].poison=2;}
  sfx("zap");
}
function fireGompa(p,n){
  var d=dist(p.x,p.y,n.x,n.y),reach=(p.meleeRange||86)*(p.rangeMul||1);
  p.aimAng=Math.atan2(n.y-p.y,n.x-p.x);p.recoil=0.6;
  if(d<reach+n.r){
    p.meleeSwing=0.22;p.swingDone=0;p.slashAng=p.aimAng;
    game.slashes.push({x:p.x,y:p.y,ang:p.aimAng,r:reach*0.7,life:0.16,maxLife:0.16});
    sfx("melee");
    if(typeof maybeShockN==="function")maybeShockN(p);
    if(typeof maybeKnifeFan==="function")maybeKnifeFan(p);
  }else{
    var spd=340,b=bulletPool.pop()||{};
    b.x=p.x+Math.cos(p.aimAng)*16;b.y=p.y+Math.sin(p.aimAng)*16;
    b.vx=Math.cos(p.aimAng)*spd;b.vy=Math.sin(p.aimAng)*spd;b.r=6;
    b.damage=(16+(p.heavyBell?5:0))*p.damageMul;b.life=1.05*(p.rangeMul||1);
    b.pierce=0;b.bounce=0;b.bell=1;b.hit=new Set();
    if(p.fireAmmo)b.fire=1;if(p.iceAmmo)b.ice=1;if(p.poisonAmmo)b.poison=1;
    game.bullets.push(b);sfx("hit");
  }
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
  var dmg=CFG.BULLET_DAMAGE*p.damageMul,shots=1+(p.extraShots|0),spread=0,spd=CFG.BULLET_SPEED;
  if(p.berserk&&p.hp/p.maxHp<0.4)dmg*=1.5;
  if(p.bloodlust)dmg*=(1+0.04*p.bloodStacks);
  if(p.weapon==="shotgun"){shots=p.pellets+(p.extraShots|0);spread=0.32;spd*=0.9;sfx("shot_shotgun");}
  else if(p.weapon==="smg"){spread=0.08;spd*=1.05;sfx("shot_smg");}
  else sfx("shot_pistol");
  if(p.fireAmmo)p.fireTimer+=0.04;
  for(var i=0;i<shots;i++){
    var t=shots===1?0:(i/(shots-1)-0.5),ang=p.aimAng+t*spread;
    var b=bulletPool.pop()||{};
    b.x=originX;b.y=originY;b.vx=Math.cos(ang)*spd;b.vy=Math.sin(ang)*spd;b.r=p.weapon==="shotgun"?3.2:3.6;
    b.damage=dmg;b.life=CFG.BULLET_LIFE*(p.rangeMul||1);b.pierce=p.pierce;b.bounce=p.bounce?2:0;
    b.fire=p.fireAmmo;b.ice=p.iceAmmo;b.poison=p.poisonAmmo;b.expl=p.explosiveAmmo;b.hit=new Set();
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
  z.hp-=dmg;z.hitFlash=0.12;floatText(z.x,z.y,""+Math.round(dmg),"#ffe066");bloodBurst(z.x,z.y);sfx("hit");
  if(typeof addBlood==="function")addBlood(z.x,z.y,z.hp<=0?7:2);
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
  dmg*=(p.armorMul||1);p.hp-=dmg;p.flash=0.12;p.invuln=CFG.INVULN_MS/1000;shake(6);
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
function startDash(p,len,slash){
  if(p.grabbed)return;
  len*=(p.dashLenMul||1);
  var d=dashDir(p);
  p.dashT=0.18;p.dashVx=d.x*len/0.18;p.dashVy=d.y*len/0.18;
  p.invuln=Math.max(p.invuln,0.18);p.dashSlash=slash||0;p.facing=Math.atan2(d.y,d.x);
  var i,z;for(i=0;i<game.zombies.length;i++){z=game.zombies[i];z.dashHit=0;}
  sfx("dash");
}
function fireSuper(p){
  if(p.grabbed||(p.super||0)<CFG.SUPER_COST)return;
  p.super=0;
  if(typeof gfxHitStop==="function")gfxHitStop(0.055,"big");
  if(p.hero==="trueno"){
    var r=p.bigStorm?170:130,i,z,ang;
    for(i=0;i<game.zombies.length;i++){z=game.zombies[i];if(!z.dead&&!z.dying&&dist(p.x,p.y,z.x,z.y)<r+z.r){hurtZombie(z,38*p.damageMul,p.x);z.burn=0.4;}}
    for(i=0;i<8;i++){ang=i*0.785;game.bolts.push({pts:zigPts(p.x+Math.cos(ang)*10,p.y+Math.sin(ang)*10,p.x+Math.cos(ang)*r,p.y+Math.sin(ang)*r,5),life:0.28,maxLife:0.28});}
    game.novas.push({x:p.x,y:p.y,r:20,vr:420,life:0.45,maxLife:0.45,col:"#82b1ff"});shake(7);sfx("storm");return;
  }
  if(p.hero==="mr"){startDash(p,190,1);return;}
  if(p.hero==="gompa"){
    var i,z,r=p.bigFlex?130:100;
    explodeAt(p.x,p.y,r,36*p.damageMul,{friendly:1});
    for(i=0;i<game.zombies.length;i++){z=game.zombies[i];if(!z.dead&&!z.dying&&dist(p.x,p.y,z.x,z.y)<r+z.r){z.stun=1.25;z.slow=1.25;}}
    game.novas.push({x:p.x,y:p.y,r:20,vr:360,life:0.45,maxLife:0.45,col:"#bcaaa4"});shake(8);sfx("explode");return;
  }
  if(p.hasDash||p.doubleJump||p.stomp){
    var len=p.tripleJump?220:p.doubleJump?180:150;
    startDash(p,len,0);
    if(p.stomp)explodeAt(p.x,p.y,90,28*p.damageMul,{friendly:1});
  }else{
    var ang=p.aimAng,tx=p.x+Math.cos(ang)*220,ty=p.y+Math.sin(ang)*220;
    game.grenades.push({x:p.x,y:p.y,tx:tx,ty:ty,t:0,life:0.55});
    sfx("wave");
  }
}
function goToMenu(){stopMusic();game=createTitleState();skipDtClamp=1;layoutMenuButtons();startMusic("menu");}
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
  sfx("boss");startMusic("boss");
  try{babbleSpeak(bab,{pitch:pitch||90,gap:0.13});}catch(e){}
}
function speakColossus(){
  try{if(game&&game.colossus){game.colossus.bubbleText="";game.colossus.bubbleFull="¡Vamos a gamblear!";game.colossus.bubbleIdx=0;game.colossus.bubbleT=0;}babbleSpeak("Va va vamos a gam gam blear",{pitch:88,gap:0.13});}catch(e){}
}
function onWaveCleared(){if(game.bossFight){startMusic("play");game.bossFight=0;}if(game.wave>=9){game.state="victory";grantAccountXP(((game.player.runXP*0.25)|0)+50);layoutMenuButtons();sfx("clear");return;}game.state="upgrade";skipDtClamp=1;sfx("clear");game.rerollLeft=1;if(game.player&&game.player.secondWind)game.player.hp=Math.min(game.player.maxHp,game.player.hp+game.player.maxHp*0.2);pickUpgradeChoices();}
function rollRarity(luck){var w=RARITIES.map(function(r){return r.w;});if(luck>0){w[0]=Math.max(20,w[0]-luck*0.6);w[3]+=luck*0.25;w[4]+=luck*0.15;w[2]+=luck*0.2;}var t=0,i;for(i=0;i<w.length;i++)t+=w[i];var r=Math.random()*t,a=0;for(i=0;i<w.length;i++){a+=w[i];if(r<=a)return i;}return 0;}
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
  else if(def.weapon==="shotgun")card.desc="Cambia a escopeta: abanico de perdigones";
  else if(def.weapon==="smg")card.desc="Cambia a subfusil: cadencia muy alta";
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
  if(def.weapon){p.weapon=def.weapon;if(def.weapon==="shotgun")p.pellets=3;if(def.weapon==="smg")p.fireCooldown=Math.min(p.fireCooldown,0.18);}
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
function pickUpgradeChoices(){var p=game.player,taken=takenFlags(p),choices=[],guard=0;while(choices.length<3&&guard++<60){var ri=rollRarity(p.luck|0);var pool=UPGRADE_DEFS.filter(function(d){if((d.once||d.flag||d.weapon||d.custom)&&taken[d.id])return 0;if(d.minR!=null&&ri<d.minR)return 0;if(d.exclusive&&ri<4)return 0;if(d.hero&&d.hero!==p.hero)return 0;if(d.weapon&&p.hero&&p.hero!=="classic")return 0;if(d.flag==="hasMelee"&&(p.hero==="mr"||p.hero==="gompa"))return 0;if((d.flag==="pierce"||d.flag==="bounce")&&p.hero&&p.hero!=="classic")return 0;for(var c=0;c<choices.length;c++)if(choices[c].id===d.id)return 0;return 1;});if(!pool.length){ri=Math.max(0,ri-1);continue;}choices.push(buildUpgradeCard(pick(pool),ri));}game.upgradeChoices=choices;layoutUpgradeCards();}
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
