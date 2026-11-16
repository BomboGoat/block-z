/* v20.5 "Play Store polish": projectiles, muzzle flashes, impacts, hit reactions, deaths, enemy projectiles,
   grenades, screen grade/vignette and ambient life. Everything here is cached sprites + drawImage, no shadowBlur,
   no per-frame gradients; particle counts are capped and drop further when the screen is busy. */
var PL={spr:{},imp:[],amb:null};
function plStamp(k,w,h,paint){if(PL.spr[k])return PL.spr[k];var c=document.createElement("canvas");c.width=w;c.height=h;paint(c.getContext("2d"),w,h);PL.spr[k]=c;return c;}
/* streak: soft additive tracer, transparent tail (left) -> colour -> white-hot head (right) */
function plStreak(col,key){return plStamp("st_"+key,128,24,function(g,w,h){
  var gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,"rgba("+col+",0)");gr.addColorStop(0.65,"rgba("+col+",0.55)");gr.addColorStop(0.93,"rgba("+col+",0.95)");gr.addColorStop(1,"rgba(255,255,240,1)");
  var gv=g.createLinearGradient(0,0,0,h);gv.addColorStop(0,"rgba(0,0,0,0)");gv.addColorStop(0.5,"rgba(0,0,0,1)");gv.addColorStop(1,"rgba(0,0,0,0)");
  g.fillStyle=gr;g.fillRect(0,0,w,h);g.globalCompositeOperation="destination-in";g.fillStyle=gv;g.fillRect(0,0,w,h);
  g.globalCompositeOperation="source-over";var gc=g.createLinearGradient(w*0.4,0,w,0);gc.addColorStop(0,"rgba(255,255,255,0)");gc.addColorStop(1,"rgba(255,255,250,0.95)");g.fillStyle=gc;g.fillRect(w*0.4,h*0.42,w*0.6,h*0.16);});}
function plGlow(col,key){return plStamp("gl_"+key,48,48,function(g){var gr=g.createRadialGradient(24,24,0,24,24,24);gr.addColorStop(0,"rgba(255,255,245,1)");gr.addColorStop(0.25,"rgba("+col+",0.9)");gr.addColorStop(0.6,"rgba("+col+",0.28)");gr.addColorStop(1,"rgba("+col+",0)");g.fillStyle=gr;g.fillRect(0,0,48,48);});}
/* 4-point star flash for muzzles and impacts */
function plStar(col,key){return plStamp("sr_"+key,64,64,function(g){
  var gr=g.createRadialGradient(32,32,0,32,32,30);gr.addColorStop(0,"rgba(255,255,240,1)");gr.addColorStop(0.3,"rgba("+col+",0.75)");gr.addColorStop(1,"rgba("+col+",0)");g.fillStyle=gr;g.beginPath();g.arc(32,32,30,0,7);g.fill();
  g.fillStyle="rgba(255,255,235,0.95)";for(var i=0;i<4;i++){g.save();g.translate(32,32);g.rotate(i*Math.PI/2);g.beginPath();g.moveTo(0,-3.2);g.lineTo(31,0);g.lineTo(0,3.2);g.closePath();g.fill();g.restore();}});}
function plMuzzle(){return plStamp("muzzle",96,48,function(g){ /* side-on cone flash: hot core, petals, sparks */
  var gr=g.createRadialGradient(18,24,0,18,24,22);gr.addColorStop(0,"rgba(255,255,235,1)");gr.addColorStop(0.45,"rgba(255,206,84,0.9)");gr.addColorStop(1,"rgba(255,120,20,0)");g.fillStyle=gr;g.fillRect(0,0,48,48);
  function petal(len,wid,a,col){g.save();g.translate(14,24);g.rotate(a);var pg=g.createLinearGradient(0,0,len,0);pg.addColorStop(0,"rgba(255,255,230,1)");pg.addColorStop(0.5,col);pg.addColorStop(1,"rgba(255,110,0,0)");g.fillStyle=pg;g.beginPath();g.moveTo(0,-wid);g.quadraticCurveTo(len*0.55,-wid*0.9,len,0);g.quadraticCurveTo(len*0.55,wid*0.9,0,wid);g.closePath();g.fill();g.restore();}
  petal(80,9,0,"rgba(255,214,90,0.95)");petal(40,6,-0.55,"rgba(255,180,60,0.85)");petal(40,6,0.55,"rgba(255,180,60,0.85)");petal(24,5,-1.2,"rgba(255,150,40,0.7)");petal(24,5,1.2,"rgba(255,150,40,0.7)");});}
var PL_PAL={pistol:["255,196,64",1.0,22,2.4],revolver:["255,150,40",1.25,30,3.4],rifle:["255,236,200",0.9,40,2.2],smg:["255,226,120",0.8,18,1.9],shot:["255,170,70",0.85,12,2.6],
  nz:["255,140,50",1.0,16,2.8],nz2:["255,120,40",1.2,22,3.6],mini:["255,232,140",0.85,24,2.0],fire:["255,96,30",1.15,26,3.2],ice:["120,220,255",1.05,26,3.0],poison:["140,230,90",1.05,26,3.0],gen:["255,226,140",1,20,2.4]};
function plBulletKey(b){if(b.fire&&!b.knife)return"fire";if(b.ice)return"ice";if(b.poison)return"poison";if(b.mini)return"mini";if(b.nz)return b.nz===2?"nz2":"nz";if(b.revolver)return"revolver";if(b.rifle)return"rifle";if(b.smg)return"smg";if(b.shot)return"shot";if(b.pistol)return"pistol";return"gen";}
function plDrawTracer(b){
  var s=toScreen(b.x,b.y);if(b.lift)s.y-=b.lift;
  var ys=CFG.YSCALE,vx=b.vx||1,vy=(b.vy||0)*ys,a=Math.atan2(vy,vx),k=plBulletKey(b),P=PL_PAL[k],sc=layout.scale;
  if(b._ox==null){b._ox=b.x;b._oy=b.y;}
  var tr=Math.sqrt((b.x-b._ox)*(b.x-b._ox)+(b.y-b._oy)*(b.y-b._oy)*ys*ys)*sc;
  var L=Math.min(P[2]*sc*(b.cannon?1.6:1),tr+4*sc),Wd=P[3]*sc*(b.cannon?1.7:1)*(b.big||1);
  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(a);ctx.globalCompositeOperation="lighter";
  ctx.drawImage(plStreak(P[0],k),-L,-Wd*1.6,L+Wd*0.6,Wd*3.2);
  var gs=Wd*2.4;ctx.globalAlpha=0.85;ctx.drawImage(plGlow(P[0],k),-gs,-gs,gs*2,gs*2);
  ctx.restore();
}
/* soft ground shadow under anything flying with a lift */
function plProjShadow(b,r){if(!(b.lift>2)||typeof softShadowSpr!=="function")return;var s=toScreen(b.x,b.y),sc=layout.scale,w=(r||5)*sc,h=w*0.45;ctx.globalAlpha=0.28*clamp(1-b.lift/(90*sc),0.3,1);ctx.drawImage(softShadowSpr(),s.x-w,s.y-h,w*2,h*2);ctx.globalAlpha=1;}
(function(){
  var _db=drawBullet;
  drawBullet=function(b){
    if(b.bell||b.knife||b.gl||b.expl){plProjShadow(b,b.bell?7:b.gl?5:6);
      if(b.knife||b.bell){ /* motion smear: two fading ghosts behind the spinning projectile */
        var s0=toScreen(b.x,b.y),vl=Math.sqrt((b.vx||0)*(b.vx||0)+(b.vy||0)*(b.vy||0))||1;
        if(vl>120){var ox=b.x,oy=b.y,sa=b.spinA;ctx.save();for(var gi=2;gi>=1;gi--){b.x=ox-(b.vx/vl)*gi*7;b.y=oy-(b.vy/vl)*gi*7;if(sa!=null)b.spinA=sa-gi*0.35;ctx.globalAlpha=0.16*(3-gi);_db(b);}ctx.restore();b.x=ox;b.y=oy;b.spinA=sa;ctx.globalAlpha=1;}
      }
      _db(b);return;}
    if(b.trailOnly)return;
    plDrawTracer(b);
  };
})();
/* ---------- impacts: star flash + sparks, coloured per hero / element ---------- */
var PL_HIT={classic:"255,200,80",neizan:"255,140,50",mr:"255,110,40",gompa:"220,210,190",trueno:"130,200,255"};
function plImpact(x,y,ang,col,big){
  if(!game)return;var a=PL.imp;if(a.length>=28)a.shift();
  a.push({x:x,y:y,a:ang,c:col,t:0,big:big||1,r:Math.random()*6.28});
}
function plDrawImpacts(dt){
  var a=PL.imp,i,o,s,sc=layout.scale,u,sz;if(!a.length)return;
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(i=a.length-1;i>=0;i--){o=a[i];o.t+=dt;u=o.t/0.16;if(u>=1){a.splice(i,1);continue;}
    s=toScreen(o.x,o.y);s.y-=14*sc;sz=(9+10*o.big)*sc*(0.6+0.6*u);
    ctx.globalAlpha=(1-u)*0.95;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(o.r);ctx.drawImage(plStar(o.c,o.c),-sz,-sz,sz*2,sz*2);ctx.restore();
    /* spark streaks thrown back toward the shooter */
    var k,ba=o.a+Math.PI;for(k=0;k<3;k++){var sa=ba+(k-1)*0.7+Math.sin(o.r+k)*0.2,len=(6+12*u)*sc*o.big,d0=4*sc+u*14*sc;
      ctx.save();ctx.translate(s.x+Math.cos(sa)*d0,s.y+Math.sin(sa)*d0*0.8);ctx.rotate(sa);ctx.drawImage(plStreak(o.c,"i"+o.c),-len,-2*sc,len,4*sc);ctx.restore();}
  }
  ctx.restore();ctx.globalAlpha=1;
}
(function(){
  var _hz=hurtZombie;
  hurtZombie=function(z,dmg,fromX,noChain,opts){
    var hp0=z&&z.hp,q=opts&&opts.quiet;
    var r=_hz.apply(this,arguments);
    if(z&&game&&game.player&&!q&&!noChain&&hp0>0){var p=game.player,ang=Math.atan2(z.y-p.y,z.x-p.x),col=PL_HIT[p.hero]||"255,210,120";
      if(p.fireAmmo)col="255,96,30";else if(p.iceAmmo)col="120,220,255";else if(p.poisonAmmo)col="140,230,90";
      if(!(game.particles&&game.particles.length>150))plImpact(z.x,z.y,ang,col,z.isBoss?1.6:dmg>60?1.3:1);
      /* flinch: knocked a few px away from the shot, settles in 0.14 s */
      z._flA=ang;z._flT=0.14;}
    return r;
  };
  var _kz=killZombie;
  killZombie=function(z){
    if(z&&!z.dying&&!z.dead&&game&&game.player){var p=game.player;z._dieA=Math.atan2(z.y-p.y,z.x-p.x);z._dieDir=Math.cos(z._dieA)>=0?1:-1;}
    return _kz.apply(this,arguments);
  };
  var _dz=drawZ;
  drawZ=function(z){
    var ox=z.x,oy=z.y,mv=0;
    if(z._flT>0&&!z.isBoss){var f=z._flT/0.14;mv=f*f*3.2;}
    if(z.dying&&z._dieA!=null&&!z.isBoss){var dp=1-clamp(z.deathT/0.45,0,1);mv+=Math.sin(dp*Math.PI*0.5)*9;}
    if(mv){z.x+=Math.cos(z._flA!=null&&!z.dying?z._flA:z._dieA||0)*mv;z.y+=Math.sin(z._flA!=null&&!z.dying?z._flA:z._dieA||0)*mv;}
    try{_dz(z);}finally{z.x=ox;z.y=oy;}
  };
})();
/* ---------- enemy projectiles: glossy acid globs with drips, shadow and glow ---------- */
function plAcidSpr(){return plStamp("acid",40,40,function(g){
  var gr=g.createRadialGradient(20,20,0,20,20,20);gr.addColorStop(0,"rgba(190,255,120,0.55)");gr.addColorStop(1,"rgba(120,220,60,0)");g.fillStyle=gr;g.fillRect(0,0,40,40);
  var bg=g.createRadialGradient(17,16,1,20,20,9);bg.addColorStop(0,"#f4ff9a");bg.addColorStop(0.45,"#9be33a");bg.addColorStop(1,"#3f7d12");
  g.fillStyle=bg;g.beginPath();g.ellipse(20,20,9,8,0,0,7);g.fill();g.strokeStyle="rgba(20,50,8,0.9)";g.lineWidth=1.6;g.stroke();
  g.fillStyle="rgba(255,255,255,0.85)";g.beginPath();g.ellipse(16.5,16,2.6,1.7,-0.5,0,7);g.fill();});}
function plDrawEnemyProj(q){
  var s=toScreen(q.x,q.y),sc=layout.scale,t=(game.time||0);
  var lift=14*sc;
  if(typeof softShadowSpr==="function"){ctx.globalAlpha=0.3;ctx.drawImage(softShadowSpr(),s.x-5*sc,s.y-2*sc,10*sc,4.5*sc);ctx.globalAlpha=1;}
  var a=Math.atan2((q.vy||0)*CFG.YSCALE,q.vx||1),vl=Math.sqrt((q.vx||0)*(q.vx||0)+(q.vy||0)*(q.vy||0));
  if(q.acid||!q.col||q.col==="#8bc34a"){
    ctx.save();ctx.translate(s.x,s.y-lift);ctx.rotate(a);
    ctx.globalAlpha=0.5;var ac=plAcidSpr();for(var i=1;i<=3;i++){var d=i*5*sc,r=(7-i*1.5)*sc;ctx.drawImage(ac,-d-r,-r+Math.sin(t*20+i)*0.8*sc,r*2,r*2);}
    ctx.globalAlpha=1;var w=10*sc*(1+0.08*Math.sin(t*25)),h=9*sc*(1-0.08*Math.sin(t*25));ctx.drawImage(ac,-w,-h,w*2,h*2);ctx.restore();
  }else{
    ctx.save();ctx.translate(s.x,s.y-lift);ctx.globalCompositeOperation="lighter";var gs=9*sc;ctx.drawImage(plGlow("255,90,60","eproj"),-gs,-gs,gs*2,gs*2);ctx.restore();
    ctx.fillStyle=q.col;fillEllipse(ctx,s.x,s.y-lift,4*sc,4*sc);
  }
}
/* ---------- thrown grenades: arc + spin + shadow ---------- */
function plDrawGrenade(g){
  var t=clamp(g.t/g.life,0,1),s=toScreen(g.cx,g.cy),sc=layout.scale,h=Math.sin(t*Math.PI)*34*sc;
  drawMarker(g.tx,g.ty,28,"#ffeb3b",game.time);
  if(typeof softShadowSpr==="function"){var w=6*sc*(1-0.4*Math.sin(t*Math.PI));ctx.globalAlpha=0.35;ctx.drawImage(softShadowSpr(),s.x-w,s.y-w*0.45,w*2,w*0.9);ctx.globalAlpha=1;}
  ctx.save();ctx.translate(s.x,s.y-h);ctx.rotate(t*14);
  ctx.fillStyle="#4e5d2a";fillEllipse(ctx,0,0,5*sc,6*sc);ctx.strokeStyle="#1a1f0c";ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,0,5*sc,6*sc,0,0,7);ctx.stroke();
  ctx.fillStyle="#9e9e9e";ctx.fillRect(-1.6*sc,-8.6*sc,3.2*sc,3*sc);ctx.fillStyle="rgba(255,255,255,0.4)";fillEllipse(ctx,-1.6*sc,-1.8*sc,1.4*sc,2*sc);
  ctx.restore();
}
/* ---------- screen grade: cached vignette drawn as edge bands only (cheaper than the old per-frame gradient) ---------- */
var _plVig=null;
function drawVignette(){
  if(!_plVig){var c=document.createElement("canvas");c.width=256;c.height=144;var g=c.getContext("2d");g.save();g.scale(1,144/256);
    var gr=g.createRadialGradient(128,128,60,128,128,150);gr.addColorStop(0,"rgba(6,10,24,0)");gr.addColorStop(0.55,"rgba(6,10,24,0.10)");gr.addColorStop(1,"rgba(4,6,18,0.42)");g.fillStyle=gr;g.fillRect(0,0,256,256);g.restore();_plVig=c;}
  var vw=_plVig.width,vh=_plVig.height,bt=0.24,bs=0.18;
  ctx.drawImage(_plVig,0,0,vw,vh*bt,0,0,SW,SH*bt);
  ctx.drawImage(_plVig,0,vh*(1-bt),vw,vh*bt,0,SH*(1-bt),SW,SH*bt);
  ctx.drawImage(_plVig,0,vh*bt,vw*bs,vh*(1-2*bt),0,SH*bt,SW*bs,SH*(1-2*bt));
  ctx.drawImage(_plVig,vw*(1-bs),vh*bt,vw*bs,vh*(1-2*bt),SW*(1-bs),SH*bt,SW*bs,SH*(1-2*bt));
}
/* ---------- ambient life: drifting leaves + pollen glints, butterflies, passing bird shadows ---------- */
function plLeafSpr(i){return plStamp("leaf"+i,16,10,function(g){var cols=[["#7cb342","#33691e"],["#c0ca33","#827717"],["#ffb300","#e65100"],["#9ccc65","#558b2f"]][i];
  var gr=g.createLinearGradient(0,0,16,10);gr.addColorStop(0,cols[0]);gr.addColorStop(1,cols[1]);g.fillStyle=gr;g.beginPath();g.moveTo(1,5);g.quadraticCurveTo(8,-1,15,5);g.quadraticCurveTo(8,11,1,5);g.fill();g.strokeStyle="rgba(0,0,0,0.25)";g.lineWidth=0.8;g.beginPath();g.moveTo(2,5);g.lineTo(14,5);g.stroke();});}
function plButterSpr(i){return plStamp("bf"+i,20,14,function(g){var c=["#ffca28","#f06292","#4fc3f7"][i];g.fillStyle=c;g.beginPath();g.ellipse(6,5,5,4.5,-0.4,0,7);g.fill();g.beginPath();g.ellipse(14,5,5,4.5,0.4,0,7);g.fill();g.globalAlpha=0.85;g.beginPath();g.ellipse(7,10,3.4,3,0.3,0,7);g.fill();g.beginPath();g.ellipse(13,10,3.4,3,-0.3,0,7);g.fill();g.globalAlpha=1;g.fillStyle="#2b1d0e";g.fillRect(9.3,2,1.4,10);});}
function plAmbInit(){
  var A={leaves:[],bf:[],birds:null,birdT:6};for(var i=0;i<12;i++)A.leaves.push({x:Math.random(),y:Math.random(),k:i%4,s:0.6+Math.random()*0.7,ph:Math.random()*6.28,glint:i>=7});
  for(var j=0;j<3;j++)A.bf.push({ox:0,oy:0,ph:Math.random()*6.28,k:j,r:40+Math.random()*60,sp:0.4+Math.random()*0.4,set:0});
  PL.amb=A;return A;
}
function plDrawAmbient(dt){
  if(!game||!game.player||game.hell||(typeof HELL!=="undefined"&&HELL.active))return;
  var A=PL.amb||plAmbInit(),sc=layout.scale,t=game.time||0,i,o,busy=game.zombies&&game.zombies.length>26;
  /* bird shadows sweep across the ground every ~15 s */
  A.birdT-=dt;if(A.birdT<=0&&!A.birds){A.birds={x:-0.2,y:0.2+Math.random()*0.5,v:0.22+Math.random()*0.08,dy:(Math.random()-0.5)*0.1};A.birdT=12+Math.random()*10;}
  if(A.birds){var B=A.birds;B.x+=B.v*dt;B.y+=B.dy*dt;if(B.x>1.25)A.birds=null;else if(typeof softShadowSpr==="function"){ctx.globalAlpha=0.16;for(i=0;i<4;i++){var bx=(B.x-i*0.035)*SW,by=(B.y+[0,0.05,-0.04,0.09][i])*SH,fl=1+0.25*Math.sin(t*10+i);ctx.drawImage(softShadowSpr(),bx-11*sc*fl,by-3*sc,22*sc*fl,6*sc);}ctx.globalAlpha=1;}}
  /* butterflies circle near the player, settle on the grass, avoid the fight */
  if(!busy){var p=game.player;for(i=0;i<A.bf.length;i++){o=A.bf[i];o.ph+=dt*o.sp;
    if(!o.set||Math.abs(o.ox-p.x)>260||Math.abs(o.oy-p.y)>160){o.ox=p.x+(Math.random()-0.5)*300;o.oy=p.y+(Math.random()-0.5)*160;o.set=1;}
    var wx=o.ox+Math.cos(o.ph)*o.r,wy=o.oy+Math.sin(o.ph*1.3)*o.r*0.5;if(!onScreen(wx,wy,20))continue;
    var s=toScreen(wx,wy),hh=(18+6*Math.sin(o.ph*3))*sc,fl=Math.abs(Math.sin(t*16+i*2));
    if(typeof softShadowSpr==="function"){ctx.globalAlpha=0.18;ctx.drawImage(softShadowSpr(),s.x-3*sc,s.y-1*sc,6*sc,2.4*sc);ctx.globalAlpha=1;}
    ctx.save();ctx.translate(s.x,s.y-hh);ctx.scale(0.25+0.75*fl,1);var bw=6*sc;ctx.drawImage(plButterSpr(o.k),-bw,-bw*0.7,bw*2,bw*1.4);ctx.restore();}}
  /* leaves + pollen drift in screen space with a little camera parallax */
  var n=busy?6:A.leaves.length,cx=(game.camX||0)*sc*0.15,cy=(game.camY||0)*sc*0.1;
  for(i=0;i<n;i++){o=A.leaves[i];o.y+=dt*0.03*o.s;o.x+=dt*0.018*o.s;o.ph+=dt*(1.5+o.s);
    var lx=((o.x*SW-cx)%SW+SW)%SW,ly=((o.y*SH-cy)%SH+SH)%SH;lx+=Math.sin(o.ph)*10*sc;
    if(o.glint){ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.35+0.35*Math.sin(o.ph*2);var gz=3.5*sc;ctx.drawImage(plGlow("255,240,170","pollen"),lx-gz,ly-gz,gz*2,gz*2);ctx.restore();continue;}
    ctx.save();ctx.translate(lx,ly);ctx.rotate(Math.sin(o.ph)*0.9);ctx.scale(1,0.5+0.5*Math.abs(Math.cos(o.ph*0.7)));ctx.globalAlpha=0.55;var lw=2.8*sc*o.s;ctx.drawImage(plLeafSpr(o.k),-lw,-lw*0.6,lw*2,lw*1.2);ctx.restore();}
  ctx.globalAlpha=1;
}
var _plLast=0;
(function(){
  var _dl=typeof drawLighting==="function"?drawLighting:null;
  drawLighting=function(){
    var now=performance.now(),dt=_plLast?Math.min(0.05,(now-_plLast)/1000):0.016;_plLast=now;
    if(game&&(game.state==="pause"||game.state==="upgrade"))dt=0;
    plDrawImpacts(dt);
    if(_dl)_dl.apply(this,arguments);
    plDrawAmbient(dt);
  };
})();
