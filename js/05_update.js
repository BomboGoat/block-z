function getPauseBtn(){var s=layout.safe,sz=40;return{x:SW-s.r-sz-10,y:s.t+10,w:sz,h:sz};}
function getSuperBtn(){var s=layout.safe,sz=layout.isPortrait?78:68;return{x:SW-s.r-sz-18,y:SH-s.b-sz-22,w:sz,h:sz};}function getMashBtn(){
  var safe=layout.safe,w=Math.min(260,SW*0.52),h=108;
  return{x:(SW-w)/2,y:Math.min(SH-safe.b-h-10,SH*0.66),w:w,h:h};
}
function registerMash(){
  var p=game&&game.player;if(!p||!p.grabbed)return;
  var now=game.time||0;
  if(now-(p.mashAt||0)<0.08)return;
  p.mashAt=now;p.mashCount=(p.mashCount||0)+1;p.mashPop=1;p.mash=(p.mash||0)+1;
  shake(6);sfx("mash");
}

function inBtn(b,x,y){return b&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;}
function joyOrigin(){return{x:layout.safe.l+90,y:SH-layout.safe.b-100};}
function resize(){
  canvas=canvas||document.getElementById("gameCanvas");
  SW=window.innerWidth;SH=window.innerHeight;
  dpr=Math.min(window.devicePixelRatio||1,(typeof GFX!=="undefined"&&GFX.dprMax)||2);
  var maxPix=8*1024*1024;if(SW*SH*dpr*dpr>maxPix)dpr=Math.sqrt(maxPix/(SW*SH));
  canvas.width=(SW*dpr)|0;canvas.height=(SH*dpr)|0;
  canvas.style.width=SW+"px";canvas.style.height=SH+"px";
  ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
  layout.isPortrait=SH>=SW;
  layout.safe=typeof readSafeInsets==="function"?readSafeInsets():{l:12,t:12,r:12,b:12};
  layout.gameX=0;layout.gameY=0;layout.gameDrawW=SW;layout.gameDrawH=SH;
  /* landscape zoom-out: viewW~420, characters stay >=60px via artTargetH */
  layout.baseViewW=420;
  layout.viewW=420;
  layout.scale=layout.gameDrawW/layout.viewW;
  layout.viewH=layout.gameDrawH/(layout.scale*CFG.YSCALE);
  W=layout.viewW;H=layout.viewH;
  if(game&&game.state==="upgrade")layoutUpgradeCards();
  if(game&&game.state==="select")layoutSelect();
  layoutMenuButtons();
}
function layoutMenuButtons(){
  var cx=SW/2,bw=Math.min(280,SW-40),bh=44,gap=10,y;
  menuBtns=[];settingsBtns=[];pauseBtns=[];howToBack=null;
  if(!game)return;
  if(game.state==="title"){
    bw=Math.min(240,SW*0.32);bh=44;
    var bx=SW-layout.safe.r-bw-12;
    y=Math.max(layout.safe.t+80,(SH-3*bh-2*gap)/2+20);
    menuBtns=[{id:"jugar",label:"JUGAR",x:bx,y:y,w:bw,h:bh},{id:"como",label:"Cómo jugar",x:bx,y:y+bh+gap,w:bw,h:bh},{id:"ajustes",label:"Ajustes",x:bx,y:y+2*(bh+gap),w:bw,h:bh}];
  }else if(game.state==="settings"){
    y=layout.safe.t+90;
    settingsBtns=[
      {id:"sfx",label:(audio.mutedSfx?"🔇 Efectos: off":"🔊 Efectos: on"),x:cx-bw/2,y:y,w:bw,h:bh},
      {id:"mus",label:(audio.mutedMus?"🔇 Música: off":"🎵 Música: on"),x:cx-bw/2,y:y+bh+gap,w:bw,h:bh},
      {id:"back",label:"Volver",x:cx-bw/2,y:y+2*(bh+gap)+8,w:bw,h:bh}
    ];
  }else if(game.state==="howto"){
    howToBack={id:"back",label:"Volver",x:cx-bw/2,y:SH-layout.safe.b-70,w:bw,h:bh};
  }else if(game.state==="pause"){
    y=layout.safe.t+80;
    pauseBtns=[{id:"continuar",label:"Continuar",x:cx-bw/2,y:y,w:bw,h:bh},{id:"ajustes",label:"Ajustes",x:cx-bw/2,y:y+bh+gap,w:bw,h:bh},{id:"menu",label:"Menú",x:cx-bw/2,y:y+2*(bh+gap),w:bw,h:bh}];
  }else if(game.state==="select"){
    var pad=8,btnH=36,bw2=Math.min(150,SW/2-20);
    y=SH-layout.safe.b-pad-btnH;
    if(game.selectCards&&game.selectCards[0]){
      var below=game.selectCards[0].y+game.selectCards[0].h+14;
      if(below+btnH<=SH-layout.safe.b-pad)y=below;
    }
    menuBtns=[
      {id:"back",label:"Volver",x:cx-bw2-6,y:y,w:bw2,h:btnH},
      {id:"start",label:"Jugar",x:cx+6,y:y,w:bw2,h:btnH}
    ];
  }else if(game.state==="dead"||game.state==="victory"){
    y=(layout.isPortrait?layout.gameY+layout.gameDrawH*0.55:SH*0.55);
    menuBtns=[{id:"menu",label:"Menú principal",x:cx-bw/2,y:y,w:bw,h:bh}];
  }
}
function layoutSelect(){
  var n=HEROES.length,s=layout.safe;
  var titleH=layout.isPortrait?50:52,btnH=36,gap=14,pad=8;
  var y=s.t+titleH;
  var maxH=SH-s.b-pad-btnH-gap-y;
  var gapX=10,availW=SW-s.l-s.r-28;
  var cw=Math.min(184,(availW-(n-1)*gapX)/n);
  var ch=Math.min(maxH, layout.isPortrait?300:248);
  ch=Math.max(160, Math.min(ch, maxH));
  var tw=n*cw+(n-1)*gapX,x0=(SW-tw)/2;
  game.selectCards=HEROES.map(function(h,i){return{hero:h,x:x0+i*(cw+gapX),y:y,w:cw,h:ch,idx:i};});
}
var menuBtns=[],settingsBtns=[],pauseBtns=[],howToBack=null,prevSettings="title";
function handleMenuClick(id,st){
  sfx("click");ensureAudio();
  if(id==="jugar"){game.state="select";game.selectIdx=Math.max(0,HEROES.findIndex(function(h){return h.id===selectedHero;}));if(game.selectIdx<0)game.selectIdx=0;layoutSelect();layoutMenuButtons();}
  else if(id==="start"){selectedHero=(HEROES[game.selectIdx]||HEROES[0]).id;saveHeroChoice();startGame();}
  else if(id==="como"){game.state="howto";layoutMenuButtons();}
  else if(id==="ajustes"){prevSettings=st||game.state;game.state="settings";layoutMenuButtons();}
  else if(id==="sfx"){setMuteSfx(!audio.mutedSfx);layoutMenuButtons();}
  else if(id==="mus"){setMuteMus(!audio.mutedMus);if(!audio.mutedMus)startMusic(game&&game.bossFight?"boss":game&&(game.state==="playing"||game.state==="countdown")?"play":"menu");else stopMusic();layoutMenuButtons();}
  else if(id==="back"){if(game.state==="select"){game.state="title";layoutMenuButtons();return;}game.state=prevSettings==="pause"?"pause":prevSettings==="howto"?"title":(prevSettings||"title");if(game.state==="title")startMusic("menu");layoutMenuButtons();}
  else if(id==="continuar"){game.state="playing";layoutMenuButtons();}
  else if(id==="menu")goToMenu();
}
function pointerToScreen(e){var r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)* (SW/r.width),y:(e.clientY-r.top)*(SH/r.height)};}
function onPointerDown(e){
  ensureAudio();
  var p=pointerToScreen(e),st=game&&game.state;
  if(st==="title"||st==="settings"||st==="howto"||st==="pause"||st==="dead"||st==="victory"||st==="select"){
    var btns=st==="title"||st==="dead"||st==="victory"||st==="select"?menuBtns:st==="settings"?settingsBtns:st==="pause"?pauseBtns:[];
    if(st==="howto"&&howToBack&&inBtn(howToBack,p.x,p.y)){handleMenuClick("back",st);return;}
    for(var i=0;i<btns.length;i++)if(inBtn(btns[i],p.x,p.y)){handleMenuClick(btns[i].id,st);return;}
    if(st==="select"){input.selX=p.x;input.selY=p.y;input.selDown=1;return;}
    return;
  }
  if(st==="upgrade"){handleUpgradeClick(p.x,p.y);return;}
  if(inBtn(getPauseBtn(),p.x,p.y)){game.state="pause";layoutMenuButtons();sfx("click");return;}
  if(game.player&&game.player.grabbed){registerMash();return;}
  if(inBtn(getSuperBtn(),p.x,p.y)){fireSuper(game.player);return;}
  /* left half joystick */
  if(p.x<SW*0.58){
    input.joy=1;input.joyX=p.x;input.joyY=p.y;input.joyId=e.pointerId!=null?e.pointerId:1;input.jx=0;input.jy=0;
    try{canvas.setPointerCapture(e.pointerId);}catch(err){}
  }
}
function onPointerMove(e){
  if(!input.joy)return;
  if(e.pointerId!=null&&input.joyId!==-1&&e.pointerId!==input.joyId)return;
  var p=pointerToScreen(e),dx=p.x-input.joyX,dy=p.y-input.joyY,m=Math.sqrt(dx*dx+dy*dy),rad=56;
  if(m>rad){dx=dx/m*rad;dy=dy/m*rad;m=rad;}
  input.jx=dx/rad;input.jy=dy/rad;
}
function onPointerUp(e){
  if(game&&game.state==="select"&&input.selDown){
    var p=pointerToScreen(e),dx=p.x-input.selX,dy=p.y-input.selY;input.selDown=0;
    if(Math.abs(dx)>40){game.selectIdx=((game.selectIdx||0)+(dx<0?1:-1)+HEROES.length)%HEROES.length;selectedHero=HEROES[game.selectIdx].id;layoutSelect();sfx("click");return;}
    var cards=game.selectCards||[],i;for(i=0;i<cards.length;i++)if(inBtn(cards[i],p.x,p.y)){game.selectIdx=cards[i].idx;selectedHero=HEROES[game.selectIdx].id;layoutSelect();sfx("click");return;}
    return;
  }
  if(e.pointerId!=null&&input.joyId!==-1&&e.pointerId!==input.joyId)return;
  input.joy=0;input.jx=0;input.jy=0;input.joyId=-1;
}
function initInput(){
  canvas.addEventListener("pointerdown",onPointerDown);
  canvas.addEventListener("pointermove",onPointerMove);
  window.addEventListener("pointerup",onPointerUp);
  window.addEventListener("pointercancel",onPointerUp);
  window.addEventListener("keydown",function(e){input.keys[e.key]=1;if(e.key==="p"||e.key==="Escape"){if(game&&game.state==="playing"){game.state="pause";layoutMenuButtons();}else if(game&&game.state==="pause"){game.state="playing";layoutMenuButtons();}}if(e.key===" "&&game&&game.player)fireSuper(game.player);});
  window.addEventListener("keyup",function(e){input.keys[e.key]=0;});
  window.addEventListener("resize",resize);window.addEventListener("orientationchange",function(){setTimeout(resize,120);});
}

function update(dt){
  if(!game)return;
  game.time+=dt;game.menuT=(game.menuT||0)+dt;
  if(game.state==="playing"&&typeof updateExtraAbilities==="function")updateExtraAbilities(dt);
  if(game.shake>0)game.shake=Math.max(0,game.shake-dt*18);
  if(game.messageTimer>0){game.messageTimer-=dt;if(game.messageTimer<=0)game.message=null;}
  var p=game.player;
  if(game.state==="title"||game.state==="select"){updateTitle(dt);updateAmbient(dt);updateCam(dt);return;}
  if(game.state==="countdown"){
    updatePlayerMove(p,dt,1);
    game.countdown-=dt;
    if(Math.ceil(game.countdown)<game.countShown){game.countShown=Math.max(1,Math.ceil(game.countdown));sfx("click");}
    game.countGroanT-=dt;if(game.countGroanT<=0){zombieMoan();game.countGroanT=0.9+Math.random()*0.5;}
    if(game.countdown<=0)beginCombat();
    updateCam(dt);return;
  }
  if(game.state==="boss_intro"){
    var c=game.boss||game.colossus||game.home;
    if(c){c.introT-=dt;updateBubble(c,dt);if(c.introT<=0){c.phase="fight";c.bubbleText="";c.bubbleFull="";c.bubbleIdx=0;c.atkCd=Math.max(c.atkCd,1.6);game.state="playing";game.player.invuln=Math.max(game.player.invuln,0.9);
      if(c.isHome){shake(16);sfx("explode");for(var hi=0;hi<10;hi++)addParticle(c.x+rand(-16,16),c.y+rand(-10,10),"#8d6e63",0.55,rand(-40,40),rand(-30,10),rand(6,14),3);c.loom=0;}
      if(c.isColossus){shake(10);sfx("stomp");sfx("growl");c.eyeFlash=0.5;}
    }}
    updateCam(dt);return;
  }
  if(game.state!=="playing")return;
  updatePlayerMove(p,dt,0);
  /* fire */
  var n=p.grabbed?null:findNearestZombie(p,heroRange(p));
  if(n)p.aimAng=Math.atan2(n.y-p.y,n.x-p.x);
  p.fireTimer-=dt;
  if(!p.grabbed&&p.fireTimer<=0&&n){fireWeapon(p);var cd=p.weapon==="smg"?Math.min(p.fireCooldown,0.16):p.fireCooldown;if(p.lastStand&&p.hp<p.maxHp*0.35)cd*=0.8;if(typeof extraFireCooldown==="function")cd=extraFireCooldown(p,cd);p.fireTimer=cd;}
  if((p.hasMelee||p.weapon==="knife"||p.weapon==="fist")&&p.meleeSwing>0){
    if(!p.swingDone&&p.meleeSwing<=0.2){
      p.swingDone=1;
      var mr=(p.meleeRange||86)*(p.rangeMul||1)*(p.wideSlash?1.25:1),mi,mz,md,mang,ma;
      for(mi=0;mi<game.zombies.length;mi++){
        mz=game.zombies[mi];if(mz.dead||mz.dying)continue;
        md=dist(p.x,p.y,mz.x,mz.y);if(md>mr+mz.r)continue;
        if(p.weapon==="fist"){mang=Math.atan2(mz.y-p.y,mz.x-p.x);ma=Math.abs(Math.atan2(Math.sin(mang-p.aimAng),Math.cos(mang-p.aimAng)));if(ma>0.7)continue;}
        hurtZombie(mz,p.meleeDmg*p.damageMul,p.x);if(p.bleedSlash)mz.poison=Math.max(mz.poison,1.4);
      }
    }
  }
  if(p.meleeSwing>0)p.meleeSwing-=dt;
  if(p.muzzle>0)p.muzzle-=dt;if(p.recoil>0)p.recoil-=dt*5;if(p.flash>0)p.flash-=dt;if(p.invuln>0)p.invuln-=dt;
  if(p.regen)p.hp=Math.min(p.maxHp,p.hp+p.regen*dt);
  if(p.shieldCd>0){p.shieldCd-=dt;if(p.shieldCd<=0)p.shieldReady=1;}
  if(p.fireAura){for(var fi=0;fi<game.zombies.length;fi++){var fz=game.zombies[fi];if(!fz.dead&&!fz.dying&&dist(p.x,p.y,fz.x,fz.y)<54){fz.burn=Math.max(fz.burn,0.4);hurtZombie(fz,8*dt*p.damageMul,p.x,1);}}}
  if(p.hasOrbit){p.orbitAngle+=dt*4;for(var oi=0;oi<3;oi++){var oa=p.orbitAngle+oi*2.094,ox=p.x+Math.cos(oa)*36,oy=p.y+Math.sin(oa)*36;for(var oz=0;oz<game.zombies.length;oz++){var zz=game.zombies[oz];if(!zz.dead&&!zz.dying&&dist(ox,oy,zz.x,zz.y)<20)hurtZombie(zz,18*dt*p.damageMul,p.x,1);}}}
  if(p.hasDrone){p.droneAngle+=dt*2;p.droneX=p.x+Math.cos(p.droneAngle)*28;p.droneY=p.y+Math.sin(p.droneAngle)*28;p.droneT=(p.droneT||0)-dt;if(p.droneT<=0){var dn=findNearestZombie(p,320);if(dn){game.bullets.push({x:p.droneX,y:p.droneY,vx:(dn.x-p.droneX)*3,vy:(dn.y-p.droneY)*3,r:3,damage:8*p.damageMul,life:0.8,pierce:0,hit:new Set()});p.droneT=0.45;}}}
  if(p.hasDog){var dog=p.dog;dog.anim+=dt*10;var tx=p.x-Math.cos(p.aimAng)*28,ty=p.y-Math.sin(p.aimAng)*28;dog.x+=(tx-dog.x)*Math.min(1,5*dt);dog.y+=(ty-dog.y)*Math.min(1,5*dt);for(var di=0;di<game.zombies.length;di++){var dz=game.zombies[di];if(!dz.dead&&!dz.dying&&dist(dog.x,dog.y,dz.x,dz.y)<28)hurtZombie(dz,10*p.damageMul*dt,dog.x,1);}}

  map.flowT+=dt;if(map.flowT>0.28)updateFlow(p.x,p.y);
  updateZombies(dt);
  if(p&&p.hp<=0&&game.state==="playing"){if(p.hasRevive&&!p.revived){p.revived=1;p.hp=p.maxHp*0.5;p.invuln=2;floatText(p.x,p.y,"REVIVE","#ff80ab");}else{game.state="dead";grantAccountXP(((p.runXP*0.1)|0)+5);layoutMenuButtons();sfx("death");}}
  updateBullets(dt);
  updateGrenades(dt);
  updateProjectiles(dt);
  updateFX(dt);updateLasers(dt);updateAmbient(dt);
  /* spawns */
  if(game.spawnQueue&&game.spawnQueue.length&&game.state==="playing"){
    game.spawnTimer-=dt;
    if(game.spawnTimer<=0&&game.zombies.filter(function(z){return!z.dead&&!z.dying;}).length<CFG.MAX_ALIVE){
      var typ=game.spawnQueue.shift(),sp=pickSpawn(p);
      game.zombies.push(spawnZombie(typ,sp.x,sp.y,game.wave));
      game.spawnTimer=CFG.SPAWN_INTERVAL;
    }
  }
  if(game.graceT>0)game.graceT-=dt;
  var alive=0;for(var ai=0;ai<game.zombies.length;ai++)if(!game.zombies[ai].dead)alive++;
  if(game.graceT<=0&&alive===0&&(!game.spawnQueue||!game.spawnQueue.length)&&game.state==="playing"&&!((game.wave===2||game.wave===5||game.wave===9)&&!game.bossSpawned))onWaveCleared();
  updateCam(dt);
}
function updatePlayerMove(p,dt,safe){
  var mx=0,my=0,mag,keys;
  if(p.grabbed){
    if(p.mashPop>0)p.mashPop=Math.max(0,p.mashPop-dt*5);
    keys=input.keys.ArrowLeft||input.keys.a||input.keys.A||input.keys.ArrowRight||input.keys.d||input.keys.D||input.keys.ArrowUp||input.keys.w||input.keys.W||input.keys.ArrowDown||input.keys.s||input.keys.S||input.keys[" "]||input.keys.Enter;
    if(keys){if(!p.mashKey){registerMash();p.mashKey=1;}}else p.mashKey=0;
    return;
  }
  if(p.throwT>0){
    p.throwT-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.max(0,1-6*dt);p.vy*=Math.max(0,1-6*dt);
    p.x=clamp(p.x,60,CFG.MAP_W-60);p.y=clamp(p.y,60,CFG.MAP_H-60);resolveCircle(p);return;
  }
  if(input.keys.ArrowLeft||input.keys.a||input.keys.A)mx-=1;
  if(input.keys.ArrowRight||input.keys.d||input.keys.D)mx+=1;
  if(input.keys.ArrowUp||input.keys.w||input.keys.W)my-=1;
  if(input.keys.ArrowDown||input.keys.s||input.keys.S)my+=1;
  if(input.joy){mx+=input.jx;my+=input.jy;}
  var m=Math.sqrt(mx*mx+my*my);if(m>1){mx/=m;my/=m;m=1;}
  var spd=CFG.PLAYER_SPEED*(p.speedMul||1);
  if(p.dashT>0){
    p.dashT-=dt;p.x+=p.dashVx*dt;p.y+=p.dashVy*dt;p.invuln=Math.max(p.invuln,0.05);
    p.trailT=(p.trailT||0)+dt;
    if(p.trailT>0.025){p.trailT=0;addParticle(p.x,p.y,p.hero==="gompa"?"#bcaaa4":p.hero==="trueno"?"#82b1ff":"#90caf9",0.32,0,0,12,4);}
    if(p.dashSlash){var di,dz;for(di=0;di<game.zombies.length;di++){dz=game.zombies[di];if(!dz.dead&&!dz.dying&&!dz.dashHit&&dist(p.x,p.y,dz.x,dz.y)<30+dz.r){hurtZombie(dz,40*p.damageMul,p.x);dz.dashHit=1;if(p.bleedSlash)dz.poison=Math.max(dz.poison,1.2);}}}
  }else{p.vx=mx*spd;p.vy=my*spd;p.x+=p.vx*dt;p.y+=p.vy*dt;}
  p.x=clamp(p.x,60,CFG.MAP_W-60);p.y=clamp(p.y,60,CFG.MAP_H-60);
  resolveCircle(p);
  /* jump / auto-hop over climbable fences */
  if(p.jumpT>0){
    p.jumpT-=dt;
    p.airH=Math.sin((1-p.jumpT/(p.jumpMax||0.42))*Math.PI)*22;
    if(p.jumpT<=0){p.jumpT=0;p.airH=0;}
  }else{
    p.airH=0;
    var hop=input.keys[" "]||input.keys.Space||input.keys.space;
    if(hop&&!p._jsp){p.jumpT=0.42;p.jumpMax=0.42;sfx("jump");}
    p._jsp=hop?1:0;
    var fh=circleHitSolid(p.x,p.y,p.r+3,"solid");
    if(fh&&fh.climbable){p._fp=(p._fp||0)+dt;if(p._fp>0.18){p.jumpT=0.42;p.jumpMax=0.42;p._fp=0;sfx("jump");}}
    else p._fp=0;
  }
  p.anim+=dt*(m>0.15?10:4);
  if(m>0.15){p.facing=Math.atan2(my,mx);p.lastMoveX=mx;p.lastMoveY=my;}
  if(p.aimAng==null)p.aimAng=p.facing||0;
  var want=p.facing||0;
  if(p.faceAng==null)p.faceAng=want;
  var ad=want-p.faceAng;
  while(ad>Math.PI)ad-=Math.PI*2;while(ad<-Math.PI)ad+=Math.PI*2;
  p.faceAng+=ad*Math.min(1,10*dt);
}
function bossCamDrop(b){
  if(!b||!layout)return 28;
  var h=typeof artTargetH==="function"?artTargetH(b.look||{kind:b.isColossus?"colossus":b.isHome?"home":"final"},layout.scale):(b.h||40)*layout.scale;
  var drop=(0.42*h)/(CFG.YSCALE*Math.max(0.5,layout.scale));
  if(b.isHome||(b.look&&b.look.kind==="home"))drop+=6;
  /* keep tall bosses inside the intro letterbox band */
  if(game&&game.state==="boss_intro"){
    var lb=(0.18*SH)/(CFG.YSCALE*Math.max(0.5,layout.scale));
    drop=Math.max(10,drop-lb*0.65);
  }
  return Math.max(16, drop);
}
function updateCam(dt){
  var p=game.player,k=1-Math.exp(-CFG.CAM_LERP*dt),tx=p.x,ty=p.y,b=game.boss,t,u,bx,by,drop;
  var base=layout.baseViewW||420, want=base, zin=0;
  if(game.state==="boss_intro"&&b){
    t=b.introT;drop=bossCamDrop(b);bx=b.x;by=b.y-drop;
    if(t>3.7){u=(4.2-t)/0.5;u=u*u*(3-2*u);tx=(game.introX||p.x)+(bx-(game.introX||p.x))*u;ty=(game.introY||p.y)+(by-(game.introY||p.y))*u;}
    else if(t>1){tx=bx;ty=by;}
    else {u=1-t;u=u*u*(3-2*u);tx=bx+(p.x-bx)*u;ty=by+(p.y-by)*u;}
    k=1-Math.exp(-10*dt);
    /* zoom in to the intro hold and KEEP that zoom (no zoom-out on the return pan) */
    zin=t>3.7?((4.2-t)/0.5)*0.22:0.22;
    want=base*(1-zin);
  }else if(game.bossFight&&b&&!b.dead&&!b.dying){
    drop=bossCamDrop(b);
    tx=p.x*0.40+b.x*0.60;ty=p.y*0.40+(b.y-drop)*0.60;
    want=base*0.78; /* same scale as the intro hold, so the boss stays imposing */
  }
  if(layout.viewW!==want){
    layout.viewW=want;
    layout.scale=layout.gameDrawW/layout.viewW;
    layout.viewH=layout.gameDrawH/(layout.scale*CFG.YSCALE);
    W=layout.viewW;H=layout.viewH;
  }
  game.camX+=(tx-game.camX)*k;game.camY+=(ty-game.camY)*k;
  var hw=worldW()*0.5,hh=worldH()*0.5;
  game.camX=clamp(game.camX,hw+8,CFG.MAP_W-hw-8);
  game.camY=clamp(game.camY,hh+8,CFG.MAP_H-hh-8);
  if(game.shake>0){game.camX+=(Math.random()-0.5)*game.shake;game.camY+=(Math.random()-0.5)*game.shake;}
}
function updateTitle(dt){
  game.menuT+=dt;
  if(!game.titleZ||!game.titleZ.length){
    game.titleZ=[];
    for(var i=0;i<5;i++){var z=spawnZombie(pick(["normal","fast","crawler"]),game.player.x+rand(-180,180),game.player.y+rand(-140,140),0);z.speed=18+i*4;game.titleZ.push(z);}
  }
  for(var i=0;i<game.titleZ.length;i++){
    var z=game.titleZ[i];z.anim+=dt*6;
    var a=Math.sin(game.menuT*0.4+i)*0.4+i;z.x+=Math.cos(a)*z.speed*dt;z.y+=Math.sin(a)*z.speed*0.7*dt;
    z.aimAng=a;resolveCircle(z);
  }
}
function updateBubble(c,dt){
  if(!c||!c.bubbleFull||c.phase==="fight"){if(c&&c.phase==="fight"){c.bubbleText="";c.bubbleFull="";}return;}
  c.bubbleT+=dt;
  if(c.bubbleIdx<c.bubbleFull.length&&c.bubbleT>0.04){c.bubbleIdx++;c.bubbleText=c.bubbleFull.slice(0,c.bubbleIdx);c.bubbleT=0;}
}
function startVault(z,f){
  if(!f||z.vaultT>0||z.isBoss||z.isHome||z.isColossus)return;
  var horiz=f.w>=f.d,dx=game.player.x-z.x,dy=game.player.y-z.y,deep;
  if(horiz){dx=0;dy=dy>=0?1:-1;deep=f.d+z.r*2+10;}
  else{dy=0;dx=dx>=0?1:-1;deep=f.w+z.r*2+10;}
  z.vaultT=0.62;z.vaultMax=0.62;z.vx0=z.x;z.vy0=z.y;z.vtx=z.x+dx*deep;z.vty=z.y+dy*deep;
}
function updateZombies(dt){
  var p=game.player,i,z;
  for(i=0;i<game.zombies.length;i++){
    z=game.zombies[i];
    if(z.dead)continue;
    if(z.dying){z.deathT-=dt;if(z.deathT<=0)z.dead=1;continue;}
    if(z.spawnT>0){z.spawnT-=dt;z.anim+=dt*6;if(z.hitFlash>0)z.hitFlash-=dt;continue;}
    if(z.hitFlash>0)z.hitFlash-=dt;
    if(z.burn>0){z.burn-=dt;z.hp-=8*dt;if(z.hp<=0)killZombie(z);}
    if(z.poison>0){z.poison-=dt;z.hp-=6*dt;if(z.hp<=0)killZombie(z);}
    if(z.slow>0)z.slow-=dt;if(z.stun>0)z.stun-=dt;
    z.anim+=dt*8;
    if(z.vaultT>0){
      z.vaultT-=dt;
      var vu=1-z.vaultT/(z.vaultMax||0.65);vu=clamp(vu,0,1);
      z.x=z.vx0+(z.vtx-z.vx0)*vu;z.y=z.vy0+(z.vty-z.vy0)*vu;
      z.lift=Math.sin(vu*Math.PI)*16;
      if(z.vaultT<=0){z.lift=0;z.vaultT=0;}
      continue;
    }
    if(z.isColossus){updateColossus(z,dt);continue;}
    if(z.isHome){updateHome(z,dt);continue;}
    if(z.isBoss){updateMiniBoss(z,dt);continue;}
    if(z.stun>0){continue;}
    var fd=flowDir(z.x,z.y),spd=z.speed*(z.buffed?1.3:1)*(z.slow>0?0.5:1);
    var ax=fd.x,ay=fd.y;
    if(!ax&&!ay){var dx=p.x-z.x,dy=p.y-z.y,len=Math.sqrt(dx*dx+dy*dy)||1;ax=dx/len;ay=dy/len;}
    else{var l=Math.sqrt(ax*ax+ay*ay)||1;ax/=l;ay/=l;}
    /* leap */
    if(z.type==="jumper"){
      z.leapCd-=dt;
      if(z.leapT>0){z.leapT-=dt;z.x+=z.leapVx*dt;z.y+=z.leapVy*dt;}
      else if(z.leapCd<=0&&dist(z.x,z.y,p.x,p.y)<260){
        var ang=Math.atan2(p.y-z.y,p.x-z.x);z.leapT=0.28;z.leapVx=Math.cos(ang)*420;z.leapVy=Math.sin(ang)*420;z.leapCd=rand(1.6,2.8);
      }
    }else{z.x+=ax*spd*dt;z.y+=ay*spd*dt;}
    z.aimAng=Math.atan2(ay,ax);resolveCircle(z);
    var fh=circleHitSolid(z.x,z.y,z.r+2,"solid");
    if(fh&&fh.climbable)startVault(z,fh);
    var moved=dist(z.x,z.y,z._sx||z.x,z._sy||z.y);
    if(moved<2.2){z._st=(z._st||0)+dt;
      if(z._st>1.15){
        if(fh&&fh.climbable){startVault(z,fh);z._st=0;}
        else if(fh){z.x+=(fh.nx||0)*6;z.y+=(fh.ny||0)*6;z._st=0.35;}
        else {z.x+=rand(-12,12);z.y+=rand(-12,12);z._st=0.35;}
        if(z._st>1.7&&!z.vaultT){game.stuckCount=(game.stuckCount||0)+1;z._st=0;}
      }
    }else{z._st=0;z._sx=z.x;z._sy=z.y;}
    /* spit */
    if(z.type==="spitter"){z.spitCd-=dt;if(z.spitCd<=0&&dist(z.x,z.y,p.x,p.y)<340&&hasLOS(z.x,z.y,p.x,p.y)&&!(hiddenInBush(p.x,p.y,z)&&dist(z.x,z.y,p.x,p.y)>40)){var sa=Math.atan2(p.y-z.y,p.x-z.x);game.projectiles.push({x:z.x,y:z.y,vx:Math.cos(sa)*220,vy:Math.sin(sa)*220,life:1.2,r:6,dmg:10,col:"#8bc34a"});z.spitCd=rand(1.4,2.2);}}
    if(z.type==="screamer"){z.screamCd-=dt;if(z.screamCd<=0){for(var j=0;j<game.zombies.length;j++){var o=game.zombies[j];if(!o.dead&&dist(z.x,z.y,o.x,o.y)<140)o.buffed=2;}z.screamCd=4;}}
    if(z.type==="exploder"&&dist(z.x,z.y,p.x,p.y)<36){killZombie(z);}
    /* melee touch */
    z.attackCd=(z.attackCd||0)-dt;
    if(z.attackCd<=0&&dist(z.x,z.y,p.x,p.y)<p.r+z.r+4){hurtPlayer(p,z.damage);z.attackCd=0.85;}
  }
}
function updateMiniBoss(z,dt){
  var p=game.player,dx=p.x-z.x,dy=p.y-z.y,d=Math.sqrt(dx*dx+dy*dy)||1;
  if(!z.rings)z.rings=[];if(!z.throws)z.throws=[];
  z.atkCd=(z.atkCd||0)-dt;
  if(z.windup){z.windupT-=dt;if(z.windupT<=0){if(z.windup==="slam"){z.rings.push({r:20,vr:180,life:0.8,dmg:22});shake(14);sfx("explode");sfx("stomp");z.eyeFlash=0.45;
        var si;for(si=0;si<14;si++)addParticle(z.x+rand(-28,28),z.y+rand(-12,12),"#8d6e63",0.6,rand(-50,50),rand(-40,8),rand(7,16),3);
      }z.windup=null;}z.anim+=dt*4;return;}
  if(z.atkCd<=0){z.windup="slam";z.windupT=0.7;z.atkCd=2.8;return;}
  z.x+=dx/d*z.speed*dt;z.y+=dy/d*z.speed*dt;z.aimAng=Math.atan2(dy,dx);resolveCircle(z);
  z._fs=(z._fs||0)+z.speed*dt;
  if(z._fs>26){z._fs=0;sfx("foot_heavy");shake(3.5);addParticle(z.x,z.y,"#6d4c41",0.35,rand(-20,20),rand(-8,4),8,3);}
  if(dist(z.x,z.y,p.x,p.y)<p.r+z.r+4){hurtPlayer(p,z.damage);z.atkCd=Math.max(z.atkCd,0.8);}
  updateRings(z,dt);
}
function updateColossus(z,dt){
  var p=game.player;updateBubble(z,dt);updateRings(z,dt);if(z.eyeFlash>0)z.eyeFlash-=dt;
  /* throws in flight */
  var i,th;
  for(i=z.throws.length-1;i>=0;i--){
    th=z.throws[i];th.t+=dt;
    if(th.t>=th.life){explodeAt(th.tx,th.ty,70,26,{friendly:0});z.throws.splice(i,1);}
  }
  if(z.chargeT>0){
    z.chargeT-=dt;z.x+=Math.cos(z.chargeAng)*380*dt;z.y+=Math.sin(z.chargeAng)*380*dt;resolveCircle(z);
    if(dist(z.x,z.y,p.x,p.y)<p.r+z.r+6)hurtPlayer(p,z.damage+8);
    z.aimAng=z.chargeAng;return;
  }
  if(z.windup){
    z.windupT-=dt;
    if(z.windupT<=0){
      if(z.windup==="slam"){z.rings.push({r:24,vr:200,life:0.9,dmg:24});z.rings.push({r:8,vr:140,life:1.1,dmg:16});shake(10);sfx("explode");}
      else if(z.windup==="charge"){z.chargeT=0.55;z.chargeAng=Math.atan2(p.y-z.y,p.x-z.x);sfx("dash");}
      else if(z.windup==="throw"){z.throws.push({x:z.x,y:z.y,tx:z.throwX,ty:z.throwY,t:0,life:0.7});sfx("wave");}
      z.windup=null;
    }
    return;
  }
  z.atkCd-=dt;
  var dx=p.x-z.x,dy=p.y-z.y,d=Math.sqrt(dx*dx+dy*dy)||1;
  z.x+=dx/d*z.speed*0.7*dt;z.y+=dy/d*z.speed*0.7*dt;z.aimAng=Math.atan2(dy,dx);resolveCircle(z);
  if(z.atkCd<=0){
    var roll=Math.random();
    if(roll<0.34){z.windup="slam";z.windupT=0.75;}
    else if(roll<0.67){z.windup="charge";z.windupT=0.55;}
    else{z.windup="throw";z.windupT=0.7;z.throwX=p.x;z.throwY=p.y;}
    z.atkCd=2.2;
  }
  if(dist(z.x,z.y,p.x,p.y)<p.r+z.r+4)hurtPlayer(p,z.damage);
}
function updateRings(z,dt){
  var i,r,p=game.player;
  for(i=z.rings.length-1;i>=0;i--){
    r=z.rings[i];r.r+=r.vr*dt;r.life-=dt;
    var d=dist(p.x,p.y,z.x,z.y);
    if(Math.abs(d-r.r)<12&&!r.hitP){hurtPlayer(p,r.dmg);r.hitP=1;}
    if(r.life<=0)z.rings.splice(i,1);
  }
}
function distSeg(px,py,ax,ay,bx,by){var abx=bx-ax,aby=by-ay,tt=((px-ax)*abx+(py-ay)*aby)/(abx*abx+aby*aby||1);tt=clamp(tt,0,1);return dist(px,py,ax+abx*tt,ay+aby*tt);}
function addLaser(x,y,ang,len,life,dmg,warn){game.lasers.push({x:x,y:y,ang:ang,len:len,life:life,maxLife:life,dmg:dmg,warn:warn||0,hitCd:0,spin:0,follow:1});}
function fadeLasers(){
  var i,L;if(!game.lasers)return;
  for(i=0;i<game.lasers.length;i++){L=game.lasers[i];if(!L.fading){L.fading=1;L.life=Math.min(L.life,0.15);L.dmg=0;L.warn=0;}}
}
function updateLasers(dt){
  var i,L,p=game.player,b=game.boss,ex,ey;
  if(!game.lasers)return;
  if(b&&(b.dead||b.dying||b.stun>0||b.grabT>0||b.grabDash>0))fadeLasers();
  for(i=game.lasers.length-1;i>=0;i--){
    L=game.lasers[i];L.life-=dt;if(L.hitCd>0)L.hitCd-=dt;
    if(L.follow&&b&&b.isHome&&!L.fading){L.x=b.x;L.y=b.y;}
    if(L.spin&&!L.fading)L.ang+=L.spin*dt;
    ex=L.x+Math.cos(L.ang)*L.len;ey=L.y+Math.sin(L.ang)*L.len;
    if(!L.warn&&!L.fading&&L.dmg&&p&&distSeg(p.x,p.y,L.x,L.y,ex,ey)<16){
      if(L.hitCd<=0){hurtPlayer(p,L.dmg);L.hitCd=0.5;addParticle(p.x,p.y,"#ff1744",0.3,0,0,6,2);}
    }
    if(!L.warn&&!L.fading&&(!L.didScorch||(L.spin&&Math.random()<0.08))){L.didScorch=1;if(!game.scorches)game.scorches=[];game.scorches.push({x:ex,y:ey,life:3});}
    if(L.life<=0){if(!L.fading){L.fading=1;L.life=0.15;L.dmg=0;}else game.lasers.splice(i,1);}
  }
}
function homeSlam(z,p,nx,ny){
  if(z.slamCd>0)return;
  z.slamCd=0.5;
  if(nx||ny){var n=Math.sqrt(nx*nx+ny*ny)||1;z.grabA=Math.atan2(ny/n,nx/n)+rand(-0.5,0.5);}
  else z.grabA+=2.1+rand(-0.4,0.4);
  if((z.grabDmg||0)>=32)return;
  var dmg=Math.min(9,35-(z.grabDmg||0));
  z.grabDmg=(z.grabDmg||0)+dmg;
  p.hp-=dmg*(p.armorMul||1);p.flash=0.12;
  floatText(p.x,p.y-8,""+(dmg|0),"#ff1744");shake(12);sfx("explode");
  var i;for(i=0;i<7;i++)addParticle(z.x,z.y,"#8d6e4a",0.4,rand(-180,180),rand(-180,180),5,2);
  if(p.hp<=0){
    p.grabbed=0;z.grabT=0;
    if(p.hasRevive&&!p.revived){p.revived=1;p.hp=p.maxHp*0.5;p.invuln=2;floatText(p.x,p.y,"REVIVE","#ff80ab");return;}
    game.state="dead";grantAccountXP(((p.runXP*0.1)|0)+5);layoutMenuButtons();sfx("death");
  }
}
function updateHome(z,dt){
  var p=game.player,dx,dy,d,ang,i,hit,sp;
  updateBubble(z,dt);
  if(z.stun>0&&!(z.grabT>0||z.grabDash>0)){z.stun-=dt;return;}

  if(z.hp<=z.maxHp*0.5&&!z.p2){z.p2=1;z.speed*=1.18;z.atkCd=0.35;floatText(z.x,z.y-10,"FASE 2","#ff1744");startMusic("home2");sfx("sting");}

  if(z.grabT>0){
    z.grabT-=dt;
    sp=520;z.x+=Math.cos(z.grabA)*sp*dt;z.y+=Math.sin(z.grabA)*sp*dt;
    z.x=clamp(z.x,70,CFG.MAP_W-70);z.y=clamp(z.y,70,CFG.MAP_H-70);
    if(z.slamCd>0)z.slamCd-=dt;
    hit=circleHitSolid(z.x,z.y,z.r+8);
    if(hit){z.x+=hit.nx*(hit.pen||8);z.y+=hit.ny*(hit.pen||8);homeSlam(z,p,hit.nx,hit.ny);}
    else if(z.x<=70||z.x>=CFG.MAP_W-70)homeSlam(z,p,z.x<=70?1:-1,0);
    else if(z.y<=70||z.y>=CFG.MAP_H-70)homeSlam(z,p,0,z.y<=70?1:-1);
    if(Math.random()<0.55)addParticle(z.x-Math.cos(z.grabA)*10,z.y-Math.sin(z.grabA)*10,"#c62828",0.28,0,0,10,4);
    p.x=z.x+Math.cos(z.grabA+3.14)*10;p.y=z.y+8;p.grabbed=1;z.aimAng=z.grabA;
    var need=z.mashNeed||8, freed=((p.mashCount||0)>=need)||z.grabT<=0;
    if(freed){
      p.grabbed=0;p.mashCount=0;p.mashPop=0;p.vx=-Math.cos(z.grabA)*180;p.vy=-Math.sin(z.grabA)*180;p.throwT=0.22;
      p.invuln=Math.max(p.invuln,0.9);p.x-=Math.cos(z.grabA)*22;p.y-=Math.sin(z.grabA)*22;resolveCircle(p);
      z.grabT=0;z.stun=1.2;z.x+=Math.cos(z.grabA)*36;z.y+=Math.sin(z.grabA)*36;resolveCircle(z);
      z.atkCd=z.p2?6.5:9;floatText(z.x,z.y-20,"¡Suelta!","#ffe082");shake(10);sfx("explode");
    }
    return;
  }
  if(z.grabDash>0){
    z.grabDash-=dt;ang=Math.atan2(z.ty-z.y,z.tx-z.x);sp=780;
    z.x+=Math.cos(ang)*sp*dt;z.y+=Math.sin(ang)*sp*dt;z.aimAng=ang;
    if(Math.random()<0.7)addParticle(z.x,z.y,"#c62828",0.25,-Math.cos(ang)*40,-Math.sin(ang)*40,9,4);
    if(dist(z.x,z.y,p.x,p.y)<z.r+p.r+14){
      z.grabT=3.0;z.grabMax=3.0;z.mashNeed=8;z.grabA=ang;z.slamCd=0.12;z.grabDmg=0;z.grabDash=0;p.grabbed=1;p.mash=0;p.mashCount=0;p.mashPop=0;p.mashAt=0;
      sfx("dash");shake(7);floatText(z.x,z.y-12,"¡AGARRE!","#ff1744");return;
    }
    if(z.grabDash<=0||dist(z.x,z.y,z.tx,z.ty)<14){
      z.grabDash=0;z.stun=1.15;z.atkCd=z.p2?6.5:9;floatText(z.x,z.y-10,"¡Fallo!","#90caf9");
    }
    return;
  }
  if(z.diveT>0){
    z.diveT-=dt;ang=Math.atan2(z.ty-z.y,z.tx-z.x);z.x+=Math.cos(ang)*520*dt;z.y+=Math.sin(ang)*520*dt;
    if(z.diveT<=0||dist(z.x,z.y,z.tx,z.ty)<16){z.diveT=0;explodeAt(z.tx,z.ty,80,24,{friendly:0});shake(10);z.atkCd=z.p2?2:2.6;}
    z.aimAng=ang;return;
  }
  if(z.windup){
    z.windupT-=dt;
    if(z.windup==="grab"){z.tx=p.x;z.ty=p.y;z.aimAng=Math.atan2(p.y-z.y,p.x-z.x);}
    if(z.windupT<=0){
      ang=Math.atan2(p.y-z.y,p.x-z.x);
      if(z.windup==="grab"){z.tx=p.x;z.ty=p.y;d=dist(z.x,z.y,z.tx,z.ty);z.grabDash=Math.min(0.55,Math.max(0.22,d/780+0.08));sfx("dash");}
      else if(z.windup==="sweep"){addLaser(z.x,z.y,ang-0.55,460,0.5,16,0);game.lasers[game.lasers.length-1].spin=2.2;}
      else if(z.windup==="burst"){addLaser(z.x,z.y,ang,420,0.28,18,0);addLaser(z.x,z.y,ang+0.18,420,0.28,18,0);}
      else if(z.windup==="dive"){z.diveT=0.32;}
      else if(z.windup==="cross"){for(i=0;i<4;i++)addLaser(z.x,z.y,i*1.57,440,0.4,14,0);}
      else if(z.windup==="spin"){addLaser(z.x,z.y,0,400,1.05,14,0);game.lasers[game.lasers.length-1].spin=6.5;}
      if(z.windup!=="grab"){z.atkCd=z.p2?2.0:2.5;shake(4);sfx("zap");}
      z.windup=null;
    }
    return;
  }
  dx=p.x-z.x;dy=p.y-z.y;d=Math.sqrt(dx*dx+dy*dy)||1;
  z.x+=dx/d*z.speed*0.45*dt;z.y+=dy/d*z.speed*0.45*dt;z.aimAng=Math.atan2(dy,dx);
  z.atkCd-=dt;
  if(z.atkCd<=0){
    var pool=["sweep","burst","dive","cross","grab"];if(z.p2)pool.push("spin","grab");
    z.windup=pool[(Math.random()*pool.length)|0];
    z.windupT=(z.windup==="dive"||z.windup==="grab")?0.9:0.75;
    ang=Math.atan2(p.y-z.y,p.x-z.x);
    if(z.windup==="sweep")addLaser(z.x,z.y,ang-0.4,460,z.windupT,0,1);
    else if(z.windup==="burst"){addLaser(z.x,z.y,ang,420,z.windupT,0,1);addLaser(z.x,z.y,ang+0.18,420,z.windupT,0,1);}
    else if(z.windup==="dive"||z.windup==="grab"){z.tx=p.x;z.ty=p.y;}
    else if(z.windup==="cross"){for(i=0;i<4;i++)addLaser(z.x,z.y,i*1.57,440,z.windupT,0,1);}
    else {addLaser(z.x,z.y,0,400,z.windupT,0,1);}
  }
}
function bulletHitsWall(b){
  var hit=circleHitSolid(b.x,b.y,b.r||3);
  if(!hit||hit.climbable)return 0;
  if(hit.break){hit.hp=(hit.hp||10)-12;if(hit.hp<=0){hit.dead=1;map.dirty=1;map.chunks={};buildGrid();sfx("explode");}return 1;}
  if(b.bounce>0){
    /* bounce using normal */
    var dot=b.vx*hit.nx+b.vy*hit.ny;b.vx-=2*dot*hit.nx;b.vy-=2*dot*hit.ny;b.bounce--;b.x+=hit.nx*3;b.y+=hit.ny*3;return 0;
  }
  return 1;
}
function updateBullets(dt){
  var i,b,j,z;
  for(i=game.bullets.length-1;i>=0;i--){
    b=game.bullets[i];b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.spinV)b.spinA=(b.spinA||0)+b.spinV*dt;
    if(b.life<=0||bulletHitsWall(b)){if(b.expl)explodeAt(b.x,b.y,b.explR||40,b.explDmg||b.damage*0.6,{friendly:1});game.bullets.splice(i,1);bulletPool.push(b);continue;}
    for(j=0;j<game.zombies.length;j++){
      z=game.zombies[j];if(z.dead||z.dying||(b.hit&&b.hit.has(z)))continue;
      if(dist(b.x,b.y,z.x,z.y)<z.r+b.r){
        if(b.hit)b.hit.add(z);
        hurtZombie(z,b.damage,b.x);
        if(b.fire)z.burn=1.4;if(b.ice)z.slow=1.6;if(b.poison)z.poison=2;
        if(b.expl)explodeAt(b.x,b.y,b.explR||42,b.explDmg||b.damage*0.5,{friendly:1});
        if(!b.pierce){game.bullets.splice(i,1);bulletPool.push(b);break;}
      }
    }
  }
}
function updateGrenades(dt){
  var i,g,t,p=game.player;
  for(i=game.grenades.length-1;i>=0;i--){
    g=game.grenades[i];g.t+=dt;t=clamp(g.t/g.life,0,1);
    g.cx=g.x+(g.tx-g.x)*t;g.cy=g.y+(g.ty-g.y)*t;
    if(g.t>=g.life){explodeAt(g.tx,g.ty,95,42*(p.damageMul||1),{friendly:1});if(p.stomp)explodeAt(g.tx,g.ty,120,24*p.damageMul,{friendly:1});game.grenades.splice(i,1);}
  }
}
function updateProjectiles(dt){
  var i,q,p=game.player,hit;
  for(i=game.projectiles.length-1;i>=0;i--){
    q=game.projectiles[i];q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;
    if(q.life<=0||circleHitSolid(q.x,q.y,q.r||5)){game.projectiles.splice(i,1);continue;}
    if(dist(q.x,q.y,p.x,p.y)<p.r+q.r){hurtPlayer(p,q.dmg||10);game.projectiles.splice(i,1);}
  }
}
function updateFX(dt){
  var i,p;
  for(i=game.particles.length-1;i>=0;i--){p=game.particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.kind===8?-20:p.kind===7?220:p.kind===6||p.kind===4?-50:40)*dt;if(p.kind===7||p.kind===9)p.rot=(p.rot||0)+(p.spin||0)*dt;if(p.life<=0){particlePool.push(game.particles.splice(i,1)[0]);}}
  for(i=game.floatTexts.length-1;i>=0;i--){p=game.floatTexts[i];p.life-=dt;p.y-=20*dt;if(p.life<=0){floatPool.push(game.floatTexts.splice(i,1)[0]);}}
  if(game.bolts)for(i=game.bolts.length-1;i>=0;i--){game.bolts[i].life-=dt;if(game.bolts[i].life<=0)game.bolts.splice(i,1);}
  if(game.slashes)for(i=game.slashes.length-1;i>=0;i--){game.slashes[i].life-=dt;if(game.slashes[i].life<=0)game.slashes.splice(i,1);}
  if(game.novas)for(i=game.novas.length-1;i>=0;i--){var nv=game.novas[i];nv.life-=dt;nv.r+=(nv.vr||300)*dt;if(nv.life<=0)game.novas.splice(i,1);}
  if(game.scorches)for(i=game.scorches.length-1;i>=0;i--){game.scorches[i].life-=dt;if(game.scorches[i].life<=0)game.scorches.splice(i,1);}
  if(typeof updateBlood==="function")updateBlood(dt);
}
function updateAmbient(dt){
  var p=game.player,i,b,s,t=game.time;
  if(map.birds){
    for(i=0;i<map.birds.length;i++){
      b=map.birds[i];b.wing+=dt*10;
      if(!b.fly&&p&&dist(p.x,p.y,b.x,b.y)<90){b.fly=1;var a=Math.atan2(b.y-p.y,b.x-p.x);b.vx=Math.cos(a)*140+rand(-30,30);b.vy=Math.sin(a)*140+rand(-30,30)-40;}
      if(b.fly){b.x+=b.vx*dt;b.y+=b.vy*dt;b.z=(b.z||0)+70*dt;if(b.z>220){b.fly=0;b.z=0;b.x=clamp(b.x+rand(-200,200),80,CFG.MAP_W-80);b.y=clamp(b.y+rand(-200,200),80,CFG.MAP_H-80);}}
    }
  }
  /* smoke from wrecks / burning barrels — only on screen */
  map.smokeT=(map.smokeT||0)-dt;
  if(map.smokeT<=0){
    map.smokeT=0.12;
    for(i=0;i<map.solids.length;i++){
      s=map.solids[i];if(s.dead)continue;
      if(!(s.wreck||s.burn))continue;
      if(!onScreen(s.x,s.y,20))continue;
      addParticle(s.x+s.w*0.5,s.y+s.d*0.3,s.burn?"#ff9800":"#90a4ae",0.7,rand(-12,12),rand(-40,-16),s.burn?5:7,6);
    }
  }
  if(p&&zoneAt(p.x,p.y).k==="grass"&&Math.random()<0.04)addParticle(p.x+rand(-80,80),p.y+rand(-80,80),pick(["#ef6c00","#2e7d32","#9ccc65"]),0.9,rand(-30,30),rand(-20,10),3,5);
  if(map.rats){for(i=0;i<map.rats.length;i++){var r=map.rats[i];r.t=(r.t||0)+dt;r.x+=Math.cos(r.a)*r.spd*dt;r.y+=Math.sin(r.a)*r.spd*dt;if(r.t>r.turn){r.a+=rand(-1.2,1.2);r.t=0;r.turn=rand(0.6,1.8);}if(r.x<40||r.x>CFG.MAP_W-40||r.y<40||r.y>CFG.MAP_H-40)r.a+=Math.PI;}}
  if(map.papers){for(i=0;i<map.papers.length;i++){var q=map.papers[i];q.x+=Math.cos(q.a)*q.spd*dt;q.y+=Math.sin(q.a)*18*dt;q.a+=dt*0.6;if(q.x<20)q.x=CFG.MAP_W-20;if(q.x>CFG.MAP_W-20)q.x=20;if(q.y<20)q.y=CFG.MAP_H-20;if(q.y>CFG.MAP_H-20)q.y=20;}}
}
