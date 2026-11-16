/* ===== v20.4: Neizan (half man / half machine), knockback, Gompa's dumbbells, Onda de choque ===== */

/* ---------- zombie knockback (shotgun pellets, minigun, stomp) ---------- */
function zKnock(z,b){
  if(!z||z.dead||z.dying||z.ghost||!b)return;
  var k=b.knock||0,vx=b.vx||0,vy=b.vy||0,l=Math.sqrt(vx*vx+vy*vy)||1;
  if(z.isThanos||z.isGorgon||z.isColossus||z.isHome||z.isFinal)k*=0.04;
  else if(z.isBoss||z.type==="boss"||z.type==="mini")k*=0.22;
  else if(z.type==="tank"||z.type==="armored")k*=0.45;
  z.kvx=(z.kvx||0)+vx/l*k;z.kvy=(z.kvy||0)+vy/l*k;
  var m=Math.sqrt(z.kvx*z.kvx+z.kvy*z.kvy),cap=Math.max(60,k*1.6);
  if(m>cap){z.kvx*=cap/m;z.kvy*=cap/m;}
}
function updateZKnock(dt){
  var L=game.zombies,i,z,f=Math.exp(-9*dt);
  for(i=0;i<L.length;i++){z=L[i];if(!z.kvx&&!z.kvy)continue;
    if(z.dead||z.dying){z.kvx=z.kvy=0;continue;}
    z.x+=z.kvx*dt;z.y+=z.kvy*dt;z.kvx*=f;z.kvy*=f;
    if(Math.abs(z.kvx)+Math.abs(z.kvy)<6){z.kvx=z.kvy=0;}
    if(typeof resolveCircle==="function")resolveCircle(z);
    z.x=clamp(z.x,20,CFG.MAP_W-20);z.y=clamp(z.y,20,CFG.MAP_H-20);}
}

/* ---------- Gompa's dumbbell: small chrome bar + rubber plates, tumbling spin, swoosh trail, impact ---------- */
var _bellSpr=null;
function ensureBellSpr(){
  if(_bellSpr)return _bellSpr;
  var W=96,H=48,c=document.createElement("canvas");c.width=W;c.height=H;var g=c.getContext("2d");g.translate(W/2,H/2);
  function rr(x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
  var o="#0e0f12";
  /* bar with knurled grip */
  var gb=g.createLinearGradient(0,-4,0,4);gb.addColorStop(0,"#f5f7fa");gb.addColorStop(0.45,"#9aa4ae");gb.addColorStop(1,"#4a525a");
  g.fillStyle=gb;rr(-30,-3.2,60,6.4,3);g.fill();g.lineWidth=2;g.strokeStyle=o;g.stroke();
  g.strokeStyle="rgba(30,34,40,0.55)";g.lineWidth=1;for(var x=-12;x<=12;x+=3){g.beginPath();g.moveTo(x,-3);g.lineTo(x+1.5,3);g.stroke();}
  /* plates: big rubber plate + small inner plate + collar, both ends */
  function plate(sx){
    var s=sx<0?-1:1;
    var gp=g.createLinearGradient(0,-20,0,20);gp.addColorStop(0,"#5b6270");gp.addColorStop(0.18,"#2c3038");gp.addColorStop(0.75,"#15171c");gp.addColorStop(1,"#08090b");
    g.fillStyle=gp;rr(s*22-(s>0?0:9),-19,9,38,3.5);g.fill();g.lineWidth=2.2;g.strokeStyle=o;g.stroke();
    g.fillStyle="rgba(255,255,255,0.22)";rr(s*22-(s>0?0:9)+1.6,-17,2.2,30,1);g.fill();
    var gi=g.createLinearGradient(0,-13,0,13);gi.addColorStop(0,"#d84343");gi.addColorStop(0.5,"#9e1b1b");gi.addColorStop(1,"#5a0d0d");
    g.fillStyle=gi;rr(s*16-(s>0?0:6),-13,6,26,2.5);g.fill();g.lineWidth=1.8;g.strokeStyle=o;g.stroke();
    g.fillStyle="#cfd6dc";rr(s*12-(s>0?0:4),-6,4,12,1.5);g.fill();g.lineWidth=1.4;g.stroke();
  }
  plate(-1);plate(1);
  _bellSpr=c;return c;
}
function drawBellProj(b){
  var s=toScreen(b.x,b.y);if(b.lift)s.y-=b.lift;
  var sc=layout.scale,len=15*sc*(b.heavy?1.12:1),spr=ensureBellSpr(),w=len,h=len*0.5;
  var sp=b.spinA||0,vx=b.vx||0,vy=(b.vy||0)*CFG.YSCALE,va=Math.atan2(vy,vx),vl=Math.sqrt(vx*vx+vy*vy)||1;
  ctx.save();
  /* swoosh: a thin tapered ribbon + two speed streaks from the plates */
  var tl=20*sc,ux=vx/vl,uy=vy/vl,nx=-uy,ny=ux,ex=s.x-ux*tl,ey=s.y-uy*tl,gw=h*0.3;
  var gr=ctx.createLinearGradient(s.x,s.y,ex,ey);gr.addColorStop(0,"rgba(240,244,248,0.32)");gr.addColorStop(1,"rgba(240,244,248,0)");
  ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(s.x+nx*gw,s.y+ny*gw);ctx.quadraticCurveTo(s.x-ux*tl*0.45+nx*gw*0.35,s.y-uy*tl*0.45+ny*gw*0.35,ex,ey);
  ctx.quadraticCurveTo(s.x-ux*tl*0.45-nx*gw*0.35,s.y-uy*tl*0.45-ny*gw*0.35,s.x-nx*gw,s.y-ny*gw);ctx.closePath();ctx.fill();
  ctx.lineCap="round";ctx.lineWidth=Math.max(1,0.9*sc);var sk,so;
  for(sk=-1;sk<=1;sk+=2){so=w*0.42*Math.abs(Math.sin(sp))*sk+h*0.25*sk;var g2=ctx.createLinearGradient(s.x,s.y,s.x-ux*tl*0.8,s.y-uy*tl*0.8);g2.addColorStop(0,"rgba(255,255,255,0.5)");g2.addColorStop(1,"rgba(255,255,255,0)");
    ctx.strokeStyle=g2;ctx.beginPath();ctx.moveTo(s.x+nx*so,s.y+ny*so);ctx.lineTo(s.x+nx*so*0.8-ux*tl*0.8,s.y+ny*so*0.8-uy*tl*0.8);ctx.stroke();}
  /* ghost frames of the spin */
  var k;for(k=2;k>=1;k--){var gx=s.x-vx/vl*k*5*sc,gy=s.y-vy/vl*k*5*sc;ctx.save();ctx.globalAlpha=0.18/k;ctx.translate(gx,gy);ctx.rotate(sp-k*0.42);ctx.scale(1,0.55+0.45*Math.abs(Math.cos((sp-k*0.42)*0.5)));ctx.drawImage(spr,-w/2,-h/2,w,h);ctx.restore();}
  /* the dumbbell: tumbles end over end (in-plane spin + foreshortening) */
  ctx.translate(s.x,s.y);ctx.rotate(sp);ctx.scale(1,0.55+0.45*Math.abs(Math.cos(sp*0.5)));
  ctx.drawImage(spr,-w/2,-h/2,w,h);
  ctx.restore();
}
function bellImpact(b,z){
  var x=z?z.x+(b.x-z.x)*0.4:b.x,y=z?z.y+(b.y-z.y)*0.4:b.y,i,a,sp;
  if(typeof pushNova==="function")pushNova(x,y,4,190,0.2,"#eceff1");
  for(i=0;i<6;i++){a=Math.random()*6.28;sp=rand(70,150);var pt=addParticle(x,y,i%2?"#fff8e1":"#b0bec5",0.25,Math.cos(a)*sp,Math.sin(a)*sp*0.7-30,rand(2,3.5),3);if(pt)pt.lift=b.lift||0;}
  var d=addParticle(x,y,"#d7ccc8",0.35,rand(-20,20),-20,4,8);if(d)d.lift=(b.lift||0)*0.5;
  shake(1.6);
}

/* ---------- Neizan's weapons ---------- */
function nzUpg(p,id){return p.abilities&&p.abilities.some(function(a){return a.id===id;});}
function applyHeroUpgrade(p,def,ri){
  if(def.id==="hero_nzArmor"){p.armorMul=(p.armorMul||1)*0.85;p.maxHp+=30;p.hp=Math.min(p.maxHp,p.hp+30);}
  if(def.id==="hero_nzMini"){p.miniBonus=(p.miniBonus||0)+3;p.miniRate=(p.miniRate||1)*1.2;}
}
function nzShell(p,col,big){
  var a=(p.aimAng||0)+(Math.cos(p.aimAng||0)>=0?-2.3:2.3),sp=rand(90,150),ho=heroHandWorld(p,p.aimAng);
  var sh=addParticle(ho.x-Math.cos(p.aimAng)*6,ho.y-Math.sin(p.aimAng)*6,col,big?0.7:0.45,Math.cos(a)*sp,Math.sin(a)*sp-60,big?4:2.6,7);
  if(sh)sh.lift=heroHandLiftPx(p);
}
function fireNeizan(p,n){
  var ang=Math.atan2(n.y-p.y,n.x-p.x);p.aimAng=ang;
  var wide=nzUpg(p,"hero_nzWide"),slug=nzUpg(p,"hero_nzSlug"),knock=nzUpg(p,"hero_nzKnock")?1.7:1;
  var np=8+(p.extraShots|0)*2+(wide?3:0),spread=0.42+(wide?0.12:0),dmg=7*p.damageMul*atkMul(p),spd=600;
  var ho=heroHandWorld(p,ang),lift=heroHandLiftPx(p),i,b;
  for(i=0;i<np;i++){var t=np===1?0:(i/(np-1)-0.5),a=ang+t*spread+(Math.random()-0.5)*0.06,sv=spd*(0.88+Math.random()*0.24);
    b=newBullet();b.x=ho.x+Math.cos(ang)*10;b.y=ho.y+Math.sin(ang)*10;b.lift=lift;b.vx=Math.cos(a)*sv;b.vy=Math.sin(a)*sv;b.r=3;
    b.damage=dmg;b.life=0.38*(p.rangeMul||1)*(0.9+Math.random()*0.2);b.pierce=p.pierce||0;b.bounce=0;b.hit=new Set();b.nz=1;b.knock=120*knock;
    b.fire=p.fireAmmo;b.ice=p.iceAmmo;b.poison=p.poisonAmmo;game.bullets.push(b);}
  if(slug){b=newBullet();b.x=ho.x;b.y=ho.y;b.lift=lift;b.vx=Math.cos(ang)*700;b.vy=Math.sin(ang)*700;b.r=4;b.damage=26*p.damageMul*atkMul(p);b.life=0.5*(p.rangeMul||1);b.pierceLeft=2;b.hit=new Set();b.nz=2;b.knock=200*knock;game.bullets.push(b);}
  p.recoil=1;p.muzzle=0.14;p.nzKick=1;markAttack(p,"shoot",0.3);
  p.knockT=0.16;p.knockVx=-Math.cos(ang)*170;p.knockVy=-Math.sin(ang)*170;
  shake(7);sfx("neizan_shot");
  var mp=addParticle(ho.x+Math.cos(ang)*22,ho.y+Math.sin(ang)*22,"#ffe0b2",0.1,Math.cos(ang)*60,Math.sin(ang)*60,4,2);if(mp)mp.lift=lift;
  for(i=0;i<3;i++){var sm=addParticle(ho.x+Math.cos(ang)*24,ho.y+Math.sin(ang)*24,"#bdbdbd",0.55,Math.cos(ang)*rand(30,70)+rand(-15,15),Math.sin(ang)*rand(30,70)-rand(10,30),rand(3,5),8);if(sm)sm.lift=lift;}
  p.nzShellT=0.4; /* break-action: two red shells pop out as he reloads */
  if(nzUpg(p,"hero_nzDouble"))p.nzSecond=0.16;
}
function fireNeizanSecond(p){
  var n=findNearestZombie(p,heroRange(p));if(!n)return;
  var ang=Math.atan2(n.y-p.y,n.x-p.x),ho=heroHandWorld(p,ang),lift=heroHandLiftPx(p),i,np=5,dmg=7*p.damageMul*atkMul(p);
  for(i=0;i<np;i++){var a=ang+(i/(np-1)-0.5)*0.3,b=newBullet();b.x=ho.x;b.y=ho.y;b.lift=lift;b.vx=Math.cos(a)*600;b.vy=Math.sin(a)*600;b.r=3;b.damage=dmg;b.life=0.36*(p.rangeMul||1);b.pierce=p.pierce||0;b.hit=new Set();b.nz=1;b.knock=90;game.bullets.push(b);}
  p.muzzle=0.12;p.nzKick=Math.max(p.nzKick||0,0.8);shake(4);sfx("neizan_shot",0.6);
}
(function(){
  var _fw=fireWeapon;
  fireWeapon=function(p){
    if(p&&p.hero==="neizan"){
      if(p.miniT>0||p.miniSpin>0)return;
      if(p.weapon==="dbshot"){var n=findNearestZombie(p,heroRange(p));if(!n)return;fireNeizan(p,n);return;}
    }
    return _fw.apply(this,arguments);
  };
  var _fs=fireSuper;
  fireSuper=function(p,ang){
    if(p&&p.hero==="neizan"&&!p.mega){
      if(p.grabbed||(p.miniT>0)||(p.miniSpin>0)||(p.super||0)<superCost(p))return;
      if(!game||game.state!=="playing")return;
      p.super=0;p.miniSpin=0.6;p.miniT=0;p.miniPut=0;p.miniAng=(ang!=null&&isFinite(ang))?ang:(p.aimAng||0);p.miniAcc=0;p.miniPh=0;p.miniFire=0;
      if(typeof gfxHitStop==="function")gfxHitStop(0.055,"big");
      sfx("minigun_spin",0.9);shake(4);floatText(p.x,p.y-30,"¡MINIGUN!","#ff5252");
      return;
    }
    return _fs.apply(this,arguments);
  };
  var _ue=updateExtraAbilities;
  updateExtraAbilities=function(dt){
    _ue.apply(this,arguments);
    var p=game.player;if(!p)return;
    updateZKnock(dt);
    if(p.stompCd>0)p.stompCd-=dt;
    if(p.hero!=="neizan")return;
    if(p.atkT>0||p.miniT>0)p.nzLast=game.time;
    if(p.nzKick>0)p.nzKick=Math.max(0,p.nzKick-dt*5.5);
    if(p.nzShellT>0){p.nzShellT-=dt;if(p.nzShellT<=0){nzShell(p,"#c62828",1);nzShell(p,"#b71c1c",1);if(typeof sfx==="function")sfx("click",0.35);}}
    if(p.nzSecond>0){p.nzSecond-=dt;if(p.nzSecond<=0)fireNeizanSecond(p);}
    updateMinigun(p,dt);
  };
  var _um=updatePlayerMove;
  updatePlayerMove=function(p,dt,safe){
    if(p&&(p.miniT>0||p.miniSpin>0)){var sm=p.speedMul;p.speedMul=sm*0.7;try{return _um.apply(this,arguments);}finally{p.speedMul=sm;}}
    return _um.apply(this,arguments);
  };
})();
function miniStop(p,quiet,force){
  if(!force&&!(p.miniT>0)&&!(p.miniSpin>0))return;
  p.miniT=0;p.miniSpin=0;p.miniFire=0;p.miniPut=0.45;
  if(typeof stopMiniLoop==="function")stopMiniLoop();
  if(!quiet)sfx("minigun_stop",0.8);
}
function updateMinigun(p,dt){
  if(p.miniPut>0)p.miniPut=Math.max(0,p.miniPut-dt);if(p.miniFlash>0)p.miniFlash-=dt;
  if(p.mega||p.dead||p.hp<=0){miniStop(p,1);return;}
  if(p.miniSpin>0){
    p.miniPh=(p.miniPh||0)+dt*(8+40*(1-p.miniSpin/0.6));p.fireTimer=Math.max(p.fireTimer,0.2);
    p.miniSpin-=dt;if(p.miniSpin<=0){p.miniSpin=0;p.miniT=10+(p.miniBonus||0);}
    return;
  }
  if(!(p.miniT>0))return;
  p.miniT-=dt;p.fireTimer=Math.max(p.fireTimer,0.2);p.super=0;
  var n=findNearestZombie(p,CFG.AUTO_RANGE*(p.rangeMul||1));
  if(n){var ta=Math.atan2(n.y-p.y,n.x-p.x),d=Math.atan2(Math.sin(ta-p.miniAng),Math.cos(ta-p.miniAng)),tr=7*dt;p.miniAng+=clamp(d,-tr,tr);}
  p.aimAng=p.miniAng;p.miniPh+=dt*48;
  var firing=!!n&&Math.abs(Math.atan2(Math.sin(Math.atan2(n.y-p.y,n.x-p.x)-p.miniAng),Math.cos(Math.atan2(n.y-p.y,n.x-p.x)-p.miniAng)))<0.5;
  if(firing){
    if(!p.miniFire){p.miniFire=1;if(typeof startMiniLoop==="function")startMiniLoop();}
    p.miniIdle=0;
    var rate=15*(p.miniRate||1);p.miniAcc+=dt*rate;
    while(p.miniAcc>=1){p.miniAcc-=1;miniShot(p);}
  }else{p.miniIdle=(p.miniIdle||0)+dt;if(p.miniFire&&p.miniIdle>0.3){p.miniFire=0;if(typeof stopMiniLoop==="function")stopMiniLoop();}}
  if(p.miniT<=0)miniStop(p,0,1);
}
function miniShot(p){
  var ang=p.miniAng+(Math.random()-0.5)*0.12,ho=heroHandWorld(p,ang),lift=heroHandLiftPx(p),b=newBullet();
  b.x=ho.x+Math.cos(ang)*16;b.y=ho.y+Math.sin(ang)*16;b.lift=lift;b.vx=Math.cos(ang)*900;b.vy=Math.sin(ang)*900;b.r=2.6;
  b.damage=5*p.damageMul*atkMul(p);b.life=0.42*(p.rangeMul||1);b.pierceLeft=1;b.bounce=0;b.hit=new Set();b.mini=1;b.knock=26;
  b.fire=p.fireAmmo;game.bullets.push(b);
  p.muzzle=0.03;p.miniFlash=0.05;markAttack(p,"shoot",0.08);p.recoil=0.6;
  p.knockT=0.05;p.knockVx=-Math.cos(ang)*18;p.knockVy=-Math.sin(ang)*18;
  p._mshell=(p._mshell||0)+1;if(p._mshell%2===0)nzShell(p,"#ffd54f",0);
  if(game.shake<1.8)shake(1.4);
}
/* if the round ends / state changes the loop must stop (noteGameState already calls stopCombatLoops) */

/* ---------- weapon art: double-barrel shotgun and minigun ---------- */
(function(){
  var _dw=drawWeapon34;
  drawWeapon34=function(c,hx,hy,ang,wpn,sc,muzzle,skin,two){
    if(wpn!=="dbshot"&&wpn!=="minigun")return _dw.apply(this,arguments);
    var p=game&&game.player,isP=p&&p.hero==="neizan"&&c===ctx&&game.state!=="title"&&!(typeof MENU_ST!=="undefined"&&MENU_ST[game.state]);
    skin=skin||"#e8c4a0";
    var o="#121212",lw=Math.max(1.4,1.8*sc),dir=Math.cos(ang)>=0?1:-1;
    function lgv(y0,y1,a,b){var g=c.createLinearGradient(0,y0,0,y1);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
    function box(x,y,w,h,r,a,b){c.fillStyle=lgv(y,y+h,a,b);roundRect(c,x,y,w,h,r);c.fill();c.strokeStyle=o;c.lineWidth=lw;roundRect(c,x,y,w,h,r);c.stroke();}
    function ell(x,y,rx,ry,f){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle=f;c.fill();c.strokeStyle=o;c.lineWidth=lw*0.85;c.stroke();}
    var kick=isP?(p.nzKick||0):0,put=isP&&wpn==="minigun"&&p.miniPut>0?(1-p.miniPut/0.45):0;
    c.save();c.translate(hx,hy);
    if(kick>0){c.translate(-Math.cos(ang)*kick*5*sc,-Math.sin(ang)*kick*5*sc);ang+=-dir*kick*0.32;}
    if(put>0){ang+=dir*put*1.1;c.globalAlpha=1-put*0.9;}
    c.rotate(ang);if(dir<0)c.scale(1,-1);
    if(wpn==="dbshot"){
      /* stock (wood, curved) */
      c.fillStyle=lgv(-4*sc,6*sc,"#a1683a","#5d3a1a");c.beginPath();c.moveTo(-3*sc,-2.6*sc);c.lineTo(-16*sc,-1.2*sc);c.quadraticCurveTo(-18.5*sc,2.5*sc,-16.5*sc,5.6*sc);c.lineTo(-11*sc,4.6*sc);c.quadraticCurveTo(-6*sc,2.6*sc,-2*sc,3.2*sc);c.closePath();c.fill();c.strokeStyle=o;c.lineWidth=lw;c.stroke();
      c.strokeStyle="rgba(255,220,170,0.35)";c.lineWidth=1;c.beginPath();c.moveTo(-14*sc,-0.6*sc);c.lineTo(-4*sc,-1.6*sc);c.stroke();
      /* receiver */
      box(-3.5*sc,-3.4*sc,8*sc,6.2*sc,1.6*sc,"#cfd8dc","#455a64");
      c.fillStyle="#ffd54f";c.beginPath();c.arc(0.5*sc,-0.3*sc,0.9*sc,0,7);c.fill();
      /* two stacked barrels */
      box(4*sc,-3.9*sc,21*sc,2.8*sc,1.2*sc,"#90a4ae","#37474f");
      box(4*sc,-1.1*sc,21*sc,2.8*sc,1.2*sc,"#78909c","#263238");
      c.fillStyle="#0b0b0b";c.beginPath();c.ellipse(25*sc,-2.5*sc,0.7*sc,1.1*sc,0,0,7);c.ellipse(25*sc,0.3*sc,0.7*sc,1.1*sc,0,0,7);c.fill();
      /* forend */
      box(5*sc,1.4*sc,9*sc,2.6*sc,1.2*sc,"#a1683a","#5d3a1a");
      /* trigger guard */
      c.strokeStyle=o;c.lineWidth=lw*0.9;c.beginPath();c.arc(-0.8*sc,4*sc,1.8*sc,0,Math.PI);c.stroke();
      c.fillStyle="#eceff1";c.fillRect(23.6*sc,-4.9*sc,1*sc,1*sc);
      /* human hand on the wrist of the stock */
      c.fillStyle=lgv(-2*sc,4*sc,shadeHex(skin,25),shadeHex(skin,-25));c.beginPath();c.ellipse(-2.6*sc,1.6*sc,3.6*sc,3.9*sc,0,0,7);c.fill();c.strokeStyle=o;c.lineWidth=lw;c.stroke();
      /* robot hand on the forend (chrome) */
      if(two!==false)nzRobotHand(c,9*sc,3*sc,sc,lw,o);
      if(muzzle>0){var a=Math.min(1,muzzle*12),ms=ensureMuzzleSpr(),sz=(5*sc+a*4*sc);
        c.globalCompositeOperation="lighter";c.globalAlpha=0.4+0.6*a;c.drawImage(ms,25*sc-sz*0.3,-1.2*sc-sz,sz*2.2,sz*2);c.globalAlpha=1;c.globalCompositeOperation="source-over";}
    }else{
      c.translate(0,2.5*sc);c.scale(1.3,1.3); /* heavy weapon, carried at the hip */
      var ph=isP?(p.miniPh||0):((game&&game.time)||0)*3;
      /* ammo belt hanging from the box */
      var bt=((isP&&p.miniFire)?(ph*0.3):0)%1,i;
      for(i=0;i<7;i++){var u=(i+bt)/7,bx=-2*sc-u*7*sc,by=5*sc+Math.sin(u*2.4)*7*sc;c.fillStyle="#ffca28";c.strokeStyle="#5d4037";c.lineWidth=0.8;c.fillRect(bx-1*sc,by-1.6*sc,2*sc,3.2*sc);c.strokeRect(bx-1*sc,by-1.6*sc,2*sc,3.2*sc);}
      /* ammo box + motor housing */
      box(-9*sc,1.5*sc,9*sc,7*sc,1.4*sc,"#556b2f","#2f3d17");
      box(-8*sc,-5.2*sc,13*sc,8.6*sc,2.4*sc,"#78909c","#263238");
      c.fillStyle="rgba(255,255,255,0.25)";c.fillRect(-6.5*sc,-4.4*sc,9*sc,1.2*sc);
      /* carry handle */
      c.strokeStyle=o;c.lineWidth=lw*1.3;c.beginPath();c.moveTo(-5*sc,-5.2*sc);c.quadraticCurveTo(0,-10*sc,6*sc,-5.6*sc);c.stroke();c.strokeStyle="#b0bec5";c.lineWidth=lw*0.6;c.stroke();
      /* rotating barrel cluster: 6 barrels, the visible three slide with the spin */
      box(5*sc,-4.2*sc,4*sc,7.4*sc,1.2*sc,"#546e7a","#263238");
      var k,list=[];for(k=0;k<6;k++){var aa=ph+k*Math.PI/3;list.push({y:Math.sin(aa)*2.6*sc,z:Math.cos(aa)});}
      list.sort(function(a,b){return a.z-b.z;});
      for(k=0;k<6;k++){var L=list[k],sh=Math.round(70+60*(L.z+1));c.fillStyle="rgb("+sh+","+(sh+8)+","+(sh+14)+")";c.strokeStyle=o;c.lineWidth=lw*0.6;roundRect(c,9*sc,L.y-0.85*sc-0.6*sc,19*sc,1.7*sc,0.8*sc);c.fill();c.stroke();}
      box(19*sc,-4*sc,2.4*sc,7*sc,0.8*sc,"#90a4ae","#37474f");box(27*sc,-3.6*sc,1.8*sc,6.2*sc,0.8*sc,"#90a4ae","#37474f");
      /* both hands: human on the grip, robot on the front handle */
      c.fillStyle=lgv(-2*sc,6*sc,shadeHex(skin,25),shadeHex(skin,-25));c.beginPath();c.ellipse(-3.2*sc,3.4*sc,3.6*sc,3.8*sc,0,0,7);c.fill();c.strokeStyle=o;c.lineWidth=lw;c.stroke();
      nzRobotHand(c,7*sc,4.6*sc,sc,lw,o);
      var fl=isP?(p.miniFlash||0):0;
      if(fl>0||muzzle>0){var ms2=ensureMuzzleSpr(),sz2=(3.5+Math.random()*3)*sc;c.globalCompositeOperation="lighter";c.globalAlpha=0.6+Math.random()*0.4;c.drawImage(ms2,28*sc-sz2*0.3,-sz2,sz2*2,sz2*2);c.globalAlpha=1;c.globalCompositeOperation="source-over";}
    }
    c.restore();
  };
})();
function nzRobotHand(c,x,y,sc,lw,o){
  var g=c.createLinearGradient(x-3*sc,y-3*sc,x+3*sc,y+3*sc);g.addColorStop(0,"#eceff1");g.addColorStop(0.5,"#90a4ae");g.addColorStop(1,"#37474f");
  c.fillStyle=g;c.beginPath();c.ellipse(x,y,3.2*sc,3.5*sc,0,0,7);c.fill();c.strokeStyle=o;c.lineWidth=lw;c.stroke();
  var i;for(i=0;i<3;i++){c.fillStyle=g;roundRect(c,x-2.6*sc+i*1.8*sc,y+1.2*sc,1.5*sc,3*sc,0.6*sc);c.fill();c.strokeStyle=o;c.lineWidth=lw*0.7;c.stroke();}
  c.fillStyle="#ff1744";c.beginPath();c.arc(x+0.4*sc,y-0.8*sc,0.7*sc,0,7);c.fill();
}

/* ---------- projectiles art ---------- */
(function(){
  var _db=drawBullet;
  drawBullet=function(b){
    if(b.bell){drawBellProj(b);return;}
    if(b.nz||b.mini){
      var s=toScreen(b.x,b.y);if(b.lift)s.y-=b.lift;
      var sc=layout.scale,vx=b.vx||0,vy=(b.vy||0)*CFG.YSCALE,vl=Math.sqrt(vx*vx+vy*vy)||1,ux=vx/vl,uy=vy/vl;
      var L=(b.mini?16:b.nz===2?12:8)*sc;
      ctx.save();ctx.lineCap="round";
      var g=ctx.createLinearGradient(s.x,s.y,s.x-ux*L,s.y-uy*L);
      g.addColorStop(0,b.mini?"rgba(255,250,210,0.95)":"rgba(255,236,179,0.95)");g.addColorStop(1,b.mini?"rgba(255,170,40,0)":"rgba(255,112,67,0)");
      ctx.strokeStyle=g;ctx.lineWidth=(b.mini?1.7:b.nz===2?2.6:1.9)*sc;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-ux*L,s.y-uy*L);ctx.stroke();
      ctx.fillStyle="#fffde7";ctx.beginPath();ctx.arc(s.x,s.y,(b.nz===2?1.6:1.1)*sc,0,7);ctx.fill();
      ctx.restore();return;
    }
    return _db.apply(this,arguments);
  };
})();
