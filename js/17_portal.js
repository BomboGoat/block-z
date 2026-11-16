/* v20.3.4 — EL GRAN PORTAL.
   After round 9: cinematic announcement, the portal opens in an open, reachable clearing chosen by
   a flood fill over the walk grid (clear of trees, ruins, water, wheat and map edges), a camera
   pan reveals it and returns to the hero, an edge arrow points to it, and walking in plays a
   vortex entrance (pulled + spun + shrunk, flash, swirl to white) before the Thanos cinematic. */
var GP={T:0,skip:0,eT:0,snd:{}};
var GP_RV=4.6,GP_EN=1.95; /* reveal / entrance lengths (s) */
function gpEase(u){u=clamp(u,0,1);return u<0.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;}
/* ---------- placement ---------- */
function gpFindSpot(p,lv){
  lv=lv||0;var L=[[110,300,1.15,44],[90,480,1.5,40],[70,800,9,34]][lv];
  if(!map||!map.grid)return null;
  var cols=map.cols,rows=map.rows,cs=CFG.CELL,g=map.grid,n=cols*rows,seen=new Uint8Array(n),dist=new Int32Array(n),q=new Int32Array(n),qh=0,qt=0;
  var sc=clamp((p.x/cs)|0,0,cols-1),sr=clamp((p.y/cs)|0,0,rows-1),s0=sr*cols+sc,i,c,r,k;
  if(g[s0]){ /* hero on a blocked cell edge: start from the nearest free one */
    var best=-1,bd=1e9;for(r=Math.max(0,sr-4);r<=Math.min(rows-1,sr+4);r++)for(c=Math.max(0,sc-4);c<=Math.min(cols-1,sc+4);c++){i=r*cols+c;if(!g[i]){var d=(r-sr)*(r-sr)+(c-sc)*(c-sc);if(d<bd){bd=d;best=i;}}}
    if(best<0)return null;s0=best;}
  seen[s0]=1;q[qt++]=s0;
  while(qh<qt){i=q[qh++];c=i%cols;r=(i/cols)|0;
    if(c>0&&!seen[i-1]&&!g[i-1]){seen[i-1]=1;dist[i-1]=dist[i]+1;q[qt++]=i-1;}
    if(c<cols-1&&!seen[i+1]&&!g[i+1]){seen[i+1]=1;dist[i+1]=dist[i]+1;q[qt++]=i+1;}
    if(r>0&&!seen[i-cols]&&!g[i-cols]){seen[i-cols]=1;dist[i-cols]=dist[i]+1;q[qt++]=i-cols;}
    if(r<rows-1&&!seen[i+cols]&&!g[i+cols]){seen[i+cols]=1;dist[i+cols]=dist[i]+1;q[qt++]=i+cols;}}
  var bestS=-1e9,bx=0,by=0,x,y,dd,sd,s,a;
  for(r=2;r<rows-2;r+=2)for(c=2;c<cols-2;c+=2){
    i=r*cols+c;if(!seen[i])continue;x=(c+0.5)*cs;y=(r+0.5)*cs;
    if(x<70||x>CFG.MAP_W-70||y<95||y>CFG.MAP_H-50)continue;
    dd=Math.hypot(x-p.x,y-p.y);if(dd<L[0]||dd>L[1])continue;
    var pl=dist[i]*cs;if(pl>(Math.abs(x-p.x)+Math.abs(y-p.y))*L[2]+40)continue; /* no detours round rivers / walls */
    if(spawnBlocked(x,y,L[3])||spawnBlocked(x,y-30,L[3]-10)||spawnBlocked(x-30,y-10,26)||spawnBlocked(x+30,y-10,26))continue;
    var wet=0;for(k=0;k<12&&!wet;k++){a=k*0.5236;if(inWheat(x+Math.cos(a)*64,y+Math.sin(a)*48)||inWheat(x+Math.cos(a)*36,y+Math.sin(a)*28)||sampleType(x+Math.cos(a)*60,y+Math.sin(a)*46)!==0)wet=1;}
    if(wet||inWheat(x,y))continue;
    sd=Math.min(typeof sampleSDF==="function"?sampleSDF(x,y):40,90);
    s=sd*1.4-Math.abs(dd-190)*0.35-(Math.abs(y-p.y)>150?30:0);
    if(s>bestS){bestS=s;bx=x;by=y;}
  }
  if(bestS>-1e9)return{x:bx,y:by};
  return lv<2?gpFindSpot(p,lv+1):null;
}
/* ---------- opening (round 9 cleared) ---------- */
var _gpOpen=hellOpenPortal;
hellOpenPortal=function(){
  _gpOpen();
  var p=game.player,s=gpFindSpot(p);
  if(s){game.hellPortal.x=s.x;game.hellPortal.y=s.y;}
  var hp=game.hellPortal;hp.t=0;hp.open=0;hp.boost=0;hp.big=1;
  game.message="";game.messageTimer=0;
  GP.T=0;GP.skip=0;GP.snd={};GP.cam0={x:game.camX,y:game.camY};
  game.state="portal_reveal";
  if(typeof stopCombatLoops==="function")stopCombatLoops();
};
function gpSnd(key,at,T,fn){if(!GP.snd[key]&&T>=at){GP.snd[key]=1;fn();}}
function gpRevealUpdate(dt){
  var hp=game.hellPortal,p=game.player,base=layout.baseViewW||380;
  if(!hp){game.state="playing";return;}
  var T=(GP.T+=dt);hp.t+=dt;
  gpSnd("rumble",0,T,function(){sfx("storm",0.9);sfx("thanos_boom",0.55);shake(7);});
  gpSnd("open",1.25,T,function(){sfx("portal",1);sfx("fire_whoosh",0.8);shake(12);});
  gpSnd("title",1.55,T,function(){sfx("thanos_boom",0.8);});
  gpSnd("back",3.4,T,function(){sfx("whoosh",0.6);});
  hp.open=smooth01((T-1.25)/0.75);
  var px=p.x,py=p.y-20,qx=hp.x,qy=hp.y-34,tx,ty,u,vw;
  if(T<0.55){tx=px;ty=py;vw=base;}
  else if(T<1.45){u=gpEase((T-0.55)/0.9);tx=px+(qx-px)*u;ty=py+(qy-py)*u;vw=base*(1-0.14*u);}
  else if(T<3.4){tx=qx;ty=qy;vw=base*0.86;}
  else{u=gpEase((T-3.4)/1.0);tx=qx+(px-qx)*u;ty=qy+(py-qy)*u;vw=base*(0.86+0.14*u);}
  hellSetView(vw);
  var hw=worldW()*0.5,hh=worldH()*0.5;
  game.camX=clamp(tx,hw+8,CFG.MAP_W-hw-8);game.camY=clamp(ty,hh+8,CFG.MAP_H-hh-8);
  if(game.shake>0){game.camX+=(Math.random()-0.5)*game.shake*0.6;game.camY+=(Math.random()-0.5)*game.shake*0.6;}
  if(hp.open>0&&Math.random()<0.6)hellPart(hp.x+rand(-26,26),hp.y+rand(-6,4),Math.random()<0.5?"#ff7a2a":"#c060ff",0.9,rand(-12,12),rand(-80,-35),rand(2,4),3);
  if(typeof updateFX==="function")updateFX(dt);
  if(T>=GP_RV){hellSetView(base);game.state="playing";game.message="Entra en el GRAN PORTAL";game.messageTimer=3;p.invuln=Math.max(p.invuln||0,0.5);}
}
/* ---------- entrance ---------- */
function gpStartEnter(){
  var p=game.player,hp=game.hellPortal;
  GP.eT=0;GP.e0={x:p.x,y:p.y};GP.esnd={};game.state="portal_enter";
  if(typeof stopCombatLoops==="function")stopCombatLoops();
  sfx("portal",1);sfx("whoosh",0.9);shake(5);
}
function gpEnterUpdate(dt){
  var hp=game.hellPortal,p=game.player,base=layout.baseViewW||380;
  if(!hp){game.state="playing";return;}
  var T=(GP.eT+=dt);hp.t+=dt;hp.boost=clamp(T/1.1,0,1);
  var u=gpEase(clamp(T/1.15,0,1));
  p.x=GP.e0.x+(hp.x-GP.e0.x)*u;p.y=GP.e0.y+(hp.y+2-GP.e0.y)*u;p.vx=p.vy=0;
  p.scale=1-0.9*Math.pow(clamp((T-0.25)/0.95,0,1),1.6);
  p.airH=34*smooth01((T-0.15)/1.0)+Math.sin(T*9)*2*(1-u);
  GP.spin=(GP.spin||0)+dt*(4+T*T*22);p.aimAng=GP.spin;p.facing=GP.spin;if(p.faceAng!=null)p.faceAng=GP.spin;
  if(!GP.esnd.a&&T>0.55){GP.esnd.a=1;sfx("fire_whoosh",0.9);shake(8);}
  if(!GP.esnd.b&&T>1.12){GP.esnd.b=1;sfx("thanos_boom",0.9);sfx("portal",0.8);shake(14);}
  var k=1-Math.exp(-7*dt);game.camX+=(hp.x-game.camX)*k;game.camY+=(hp.y-30-game.camY)*k;
  hellSetView(base*(1-0.4*smooth01(T/1.3)));
  for(var j=0;j<3;j++){var a=Math.random()*6.283,rr=rand(40,80);hellPart(hp.x+Math.cos(a)*rr,hp.y-30+Math.sin(a)*rr*0.6,Math.random()<0.5?"#ff9a3d":"#d07cff",0.45,-Math.cos(a)*rr*2,-Math.sin(a)*rr*1.2,rand(2,3.5),3);}
  if(typeof updateFX==="function")updateFX(dt);
  if(T>=GP_EN){p.scale=1;p.airH=0;hellSetView(base);GP.spin=0;hellEnter();}
}
var _gpPre=hellPreUpdate;
hellPreUpdate=function(dt){
  var st=game.state;
  if(st==="portal_reveal"){gpRevealUpdate(dt);return 1;}
  if(st==="portal_enter"){gpEnterUpdate(dt);return 1;}
  return _gpPre(dt);
};
var _gpTick=hellTick;
hellTick=function(dt){
  var hp=game.hellPortal,p=game.player;
  if(hp&&game.state==="playing"){
    hp.t+=dt;hp.open=1;
    if(Math.random()<0.45)hellPart(hp.x+rand(-24,24),hp.y+rand(-6,4),Math.random()<0.5?"#ff7a2a":"#c060ff",0.9,rand(-10,10),rand(-75,-30),rand(2,4),3);
    if(hp.t>0.3&&Math.hypot(p.x-hp.x,(p.y-hp.y)*1.25)<24)gpStartEnter();
    return;
  }
  return _gpTick(dt);
};
var _gpSfxOk=sfxAllowed;
sfxAllowed=function(n){if(game&&(game.state==="portal_reveal"||game.state==="portal_enter"))return 1;return _gpSfxOk(n);};
document.addEventListener("pointerdown",function(){try{if(game&&game.state==="portal_reveal"&&GP.T>1.6&&GP.T<3.4){GP.T=3.4;}}catch(e){}},true);
/* ---------- drawing the portal ---------- */
var GP_CRACK=null;
function gpCracks(){if(GP_CRACK)return GP_CRACK;GP_CRACK=[];var i,j,a,r,pts;
  for(i=0;i<9;i++){a=i*0.698+Math.sin(i*7.3)*0.25;pts=[];r=14;for(j=0;j<5;j++){r+=9+((i*13+j*7)%6);pts.push(a+Math.sin(i*3.1+j*2.3)*0.16,r);}GP_CRACK.push(pts);}return GP_CRACK;}
function gpGround(hp){
  var s=toScreen(hp.x,hp.y),sc=layout.scale,t=hp.t,o=hp.open,ys=CFG.YSCALE,i,j,c,pr;
  if(o<=0)return;
  ctx.save();
  /* scorched ground */
  var R=64*sc*o,gr=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,R);gr.addColorStop(0,"rgba(20,4,10,0.75)");gr.addColorStop(0.6,"rgba(40,8,12,0.45)");gr.addColorStop(1,"rgba(40,8,12,0)");
  ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(s.x,s.y,R,R*ys,0,0,7);ctx.fill();
  /* glowing lava cracks */
  ctx.globalCompositeOperation="lighter";ctx.lineCap="round";ctx.lineJoin="round";
  var cr=gpCracks();
  for(pr=0;pr<2;pr++){ctx.strokeStyle=pr?"rgba(255,220,140,"+(0.55*o)+")":"rgba(255,90,20,"+(0.5+0.2*Math.sin(t*3))*o+")";ctx.lineWidth=(pr?1:3)*sc;
    for(i=0;i<cr.length;i++){c=cr[i];ctx.beginPath();ctx.moveTo(s.x+Math.cos(c[0])*12*sc,s.y+Math.sin(c[0])*12*sc*ys);
      for(j=0;j<c.length;j+=2)ctx.lineTo(s.x+Math.cos(c[j])*c[j+1]*sc*o,s.y+Math.sin(c[j])*c[j+1]*sc*ys*o);ctx.stroke();}}
  /* rune circle */
  var rr=46*sc*o;ctx.strokeStyle="rgba(255,120,40,"+0.55*o+")";ctx.lineWidth=2*sc;ctx.beginPath();ctx.ellipse(s.x,s.y,rr,rr*ys,0,0,7);ctx.stroke();
  ctx.strokeStyle="rgba(200,110,255,"+0.6*o+")";ctx.setLineDash([7*sc,6*sc]);ctx.lineDashOffset=-t*30*sc;ctx.beginPath();ctx.ellipse(s.x,s.y,rr*0.82,rr*0.82*ys,0,0,7);ctx.stroke();ctx.setLineDash([]);
  for(i=0;i<8;i++){var a=t*0.6+i*0.785,gx=s.x+Math.cos(a)*rr*0.92,gy=s.y+Math.sin(a)*rr*0.92*ys;ctx.globalAlpha=(0.6+0.4*Math.sin(t*4+i))*o;ctx.drawImage(glowSpr("#ff8a3d"),gx-6*sc,gy-4*sc,12*sc,8*sc);}
  ctx.globalAlpha=0.5*o*(0.8+0.2*Math.sin(t*5));ctx.drawImage(glowSpr("#ff5a1f"),s.x-70*sc,s.y-30*sc,140*sc,60*sc);
  ctx.restore();
}
function gpVortex(hp){
  var s=toScreen(hp.x,hp.y),sc=layout.scale,t=hp.t,o=hp.open,b=hp.boost||0,i,k,a;
  if(o<=0)return;
  var cx=s.x,cy=s.y-40*sc-b*4*sc,RX=27*sc*(0.06+0.94*smooth01(o*1.25))*(1+0.12*b),RY=38*sc*Math.min(1,o*2.5)*(1+0.12*b);
  ctx.save();ctx.globalCompositeOperation="lighter";
  /* layered halo */
  ctx.globalAlpha=(0.55+0.15*Math.sin(t*3))*o;ctx.drawImage(glowSpr("#ff4a1a"),cx-RX*3.4,cy-RY*2.6,RX*6.8,RY*5.2);
  ctx.globalAlpha=0.6*o;ctx.drawImage(glowSpr("#a040ff"),cx-RX*2.2,cy-RY*1.8,RX*4.4,RY*3.6);
  /* heat-shimmer rings */
  ctx.lineWidth=1.5*sc;for(i=0;i<3;i++){var w=1.18+i*0.16+0.04*Math.sin(t*4+i*2);ctx.strokeStyle="rgba(255,170,110,"+(0.18-i*0.045)*o+")";ctx.beginPath();ctx.ellipse(cx,cy,RX*w,RY*w,0,0,7);ctx.stroke();}
  ctx.restore();
  /* body */
  ctx.save();ctx.beginPath();ctx.ellipse(cx,cy,RX,RY,0,0,7);
  var bg=ctx.createRadialGradient(cx,cy,0,cx,cy,RY);bg.addColorStop(0,"#000000");bg.addColorStop(0.3,"#14031f");bg.addColorStop(0.62,"#4a0f6a");bg.addColorStop(0.86,"#b0306a");bg.addColorStop(1,"#ff7a2a");
  ctx.fillStyle=bg;ctx.fill();ctx.clip();
  ctx.globalCompositeOperation="lighter";ctx.lineCap="round";
  /* spiral arms swirling inward */
  for(k=0;k<6;k++){var a0=k*1.047-t*(2.2+b*4);ctx.strokeStyle=k%2?"rgba(255,140,60,0.55)":"rgba(210,120,255,0.6)";ctx.lineWidth=(3.2-k*0.2)*sc;ctx.beginPath();
    for(i=0;i<=16;i++){var u=i/16,ang=a0+u*3.6,rr=(1-u*0.92);var X=cx+Math.cos(ang)*RX*rr,Y=cy+Math.sin(ang)*RY*rr;if(i)ctx.lineTo(X,Y);else ctx.moveTo(X,Y);}ctx.stroke();}
  /* motes falling into the eye */
  for(i=0;i<22;i++){var ph=(t*(0.45+b*0.8)+i/22)%1,ang2=i*2.4-ph*5.5,rr2=1-ph;ctx.globalAlpha=Math.sin(ph*Math.PI);ctx.fillStyle=i%3?"#ffd0a0":"#e8b8ff";
    ctx.fillRect(cx+Math.cos(ang2)*RX*rr2-1*sc,cy+Math.sin(ang2)*RY*rr2-1*sc,2*sc,2*sc);}
  ctx.globalAlpha=0.75+0.25*Math.sin(t*6);ctx.drawImage(glowSpr("#c77dff"),cx-RX*0.6,cy-RY*0.5,RX*1.2,RY*1.0);
  ctx.globalAlpha=0.5+0.5*b;ctx.drawImage(glowSpr("#ffffff"),cx-RX*0.25,cy-RY*0.22,RX*0.5,RY*0.44);
  ctx.restore();
  /* flaming jagged rim */
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.lineJoin="round";
  for(var pass=0;pass<3;pass++){ctx.beginPath();
    for(i=0;i<=48;i++){a=i/48*6.283;var nz=1+0.06*Math.sin(a*7+t*9)+0.05*Math.sin(a*13-t*13)+0.03*Math.sin(a*3+t*4)+(pass===2?-0.06:0);
      var X2=cx+Math.cos(a)*RX*nz,Y2=cy+Math.sin(a)*RY*nz;if(i)ctx.lineTo(X2,Y2);else ctx.moveTo(X2,Y2);}
    ctx.strokeStyle=pass===0?"rgba(255,80,20,0.85)":pass===1?"rgba(255,220,120,0.9)":"rgba(200,100,255,0.8)";ctx.lineWidth=(pass===0?5:pass===1?1.6:2.2)*sc;ctx.stroke();}
  /* flame tongues licking off the rim */
  for(i=0;i<14;i++){a=i*0.449+Math.sin(t*0.7+i)*0.2;var fl=0.5+0.5*Math.sin(t*8+i*1.7),fx=cx+Math.cos(a)*RX*1.04,fy=cy+Math.sin(a)*RY*1.04,fs=(6+6*fl)*sc;
    ctx.globalAlpha=0.55*fl*o;ctx.drawImage(glowSpr(i%2?"#ff7a2a":"#ffb347"),fx-fs*0.6,fy-fs*1.3,fs*1.2,fs*1.6);}
  /* crackling arcs */
  var seed=Math.floor(t*7);if(seed%3!==0){var aa=(seed*2.399)%6.283;ctx.globalAlpha=0.85*o;ctx.strokeStyle="#ffe6ff";ctx.lineWidth=1.3*sc;ctx.beginPath();
    for(i=0;i<6;i++){var ua=aa+i*0.16,ur=1.02+((seed*7+i*5)%5)*0.05;var X3=cx+Math.cos(ua)*RX*ur,Y3=cy+Math.sin(ua)*RY*ur;if(i)ctx.lineTo(X3,Y3);else ctx.moveTo(X3,Y3);}ctx.stroke();}
  ctx.restore();
  /* orbiting rock shards */
  ctx.save();
  for(i=0;i<7;i++){a=t*(0.7+i*0.05)+i*0.9;var ox=cx+Math.cos(a)*RX*1.55,oy=cy+Math.sin(a)*RY*0.75+Math.sin(t*2+i)*3*sc,ssz=(3+(i%3)*1.4)*sc*o;
    ctx.fillStyle="#2a1418";ctx.beginPath();ctx.moveTo(ox-ssz,oy);ctx.lineTo(ox-ssz*0.2,oy-ssz*1.1);ctx.lineTo(ox+ssz,oy-ssz*0.3);ctx.lineTo(ox+ssz*0.4,oy+ssz*0.8);ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(255,120,40,0.9)";ctx.fillRect(ox-ssz*0.6,oy+ssz*0.35,ssz*1.1,1.2*sc);}
  ctx.restore();
  /* opening flash */
  if(o>0&&o<1){ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=Math.sin(o*Math.PI)*0.9;var fw=90*sc;ctx.drawImage(glowSpr("#ffffff"),cx-fw*0.5,cy-fw*1.1,fw,fw*2.2);ctx.restore();}
}
/* the island portal: ground under everyone, the vortex y-sorted against the hero */
drawHellPortalAt=function(){};
var _gpUnder=hellDrawUnder;
hellDrawUnder=function(){
  var hp=game.hellPortal;
  if(hp&&hp.big){gpGround(hp);if(!(game.player&&game.player.y<hp.y-2&&game.state!=="portal_enter"))gpVortex(hp);}
  return _gpUnder.apply(this,arguments);
};
var _gpArrow=drawPortalArrow;
drawPortalArrow=function(x,y,col){
  var hp=game.hellPortal;
  if(!(hp&&hp.big&&col==="#e040fb"))return _gpArrow(x,y,col);
  if(game.state!=="playing")return;
  var s=toScreen(x,y-40),t=game.time||0,sc=layout.scale,on=s.x>40&&s.x<SW-40&&s.y>50&&s.y<SH-40;
  ctx.save();
  if(on){var by=s.y-52*sc-Math.abs(Math.sin(t*4))*8;ctx.translate(s.x,by);
    ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.6;ctx.drawImage(glowSpr("#ff7a2a"),-18,-20,36,36);ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;
    ctx.fillStyle="#ffb347";ctx.strokeStyle="#2a0a14";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,12);ctx.lineTo(-12,-2);ctx.lineTo(-4.5,-2);ctx.lineTo(-4.5,-14);ctx.lineTo(4.5,-14);ctx.lineTo(4.5,-2);ctx.lineTo(12,-2);ctx.closePath();ctx.stroke();ctx.fill();
  }else{
    var cx=SW/2,cy=SH/2,a=Math.atan2(s.y-cy,s.x-cx),ex=clamp(s.x,46,SW-46),ey=clamp(s.y,62,SH-46);
    ctx.translate(ex,ey);
    ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.7+0.3*Math.sin(t*6);ctx.drawImage(glowSpr("#b040ff"),-26,-26,52,52);ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;
    ctx.fillStyle="rgba(20,4,24,0.85)";ctx.beginPath();ctx.arc(0,0,15,0,7);ctx.fill();ctx.strokeStyle="#ffb347";ctx.lineWidth=2;ctx.stroke();
    ctx.save();ctx.beginPath();ctx.ellipse(0,0,5.5,8,0,0,7);var pg=ctx.createRadialGradient(0,0,0,0,0,8);pg.addColorStop(0,"#000");pg.addColorStop(0.6,"#7a2aa8");pg.addColorStop(1,"#ff7a2a");ctx.fillStyle=pg;ctx.fill();ctx.restore();
    ctx.rotate(a);ctx.translate(22+Math.sin(t*6)*2,0);ctx.fillStyle="#ffb347";ctx.strokeStyle="#2a0a14";ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-5,-8);ctx.lineTo(-2,0);ctx.lineTo(-5,8);ctx.closePath();ctx.stroke();ctx.fill();
  }
  ctx.restore();
};
var _gpOver=hellDrawOver;
hellDrawOver=function(){
  var hp=game.hellPortal;
  if(hp&&hp.big&&game.player&&game.player.y<hp.y-2&&game.state!=="portal_enter")gpVortex(hp);
  return _gpOver.apply(this,arguments);
};
/* ---------- screen overlays ---------- */
function gpTitle(T){
  var a=clamp((T-1.5)/0.25,0,1)*clamp((GP_RV-0.5-T)/0.45,0,1);if(a<=0)return;
  var pu=T<1.75?1.6-0.6*smooth01((T-1.5)/0.25):1,cy=SH*0.3,fs=Math.round(Math.min(46,SH*0.115)),fs2=Math.round(fs*0.5);
  ctx.save();ctx.globalAlpha=a;ctx.textAlign="center";ctx.lineJoin="round";
  /* band */
  var bw=Math.min(SW*0.86,620),bh=fs*2.3,gb=ctx.createLinearGradient(SW/2-bw/2,0,SW/2+bw/2,0);gb.addColorStop(0,"rgba(20,2,10,0)");gb.addColorStop(0.2,"rgba(20,2,10,0.72)");gb.addColorStop(0.8,"rgba(20,2,10,0.72)");gb.addColorStop(1,"rgba(20,2,10,0)");
  ctx.fillStyle=gb;ctx.fillRect(SW/2-bw/2,cy-fs*1.45,bw,bh);
  var gl=ctx.createLinearGradient(SW/2-bw/2,0,SW/2+bw/2,0);gl.addColorStop(0,"rgba(255,170,60,0)");gl.addColorStop(0.5,"rgba(255,200,100,0.95)");gl.addColorStop(1,"rgba(255,170,60,0)");
  ctx.fillStyle=gl;var lw=bw*smooth01((T-1.5)/0.5);ctx.fillRect(SW/2-lw/2,cy-fs*1.45,lw,2);ctx.fillRect(SW/2-lw/2,cy-fs*1.45+bh-2,lw,2);
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=a*0.45;ctx.drawImage(glowSpr("#ff5a1f"),SW/2-bw*0.45,cy-fs*1.6,bw*0.9,fs*2.6);ctx.restore();
  /* small line */
  ctx.font="800 "+fs2+"px system-ui";ctx.strokeStyle="rgba(0,0,0,0.9)";ctx.lineWidth=5;ctx.strokeText("¡HA APARECIDO",SW/2,cy-fs*0.78);ctx.fillStyle="#ffe0a0";ctx.fillText("¡HA APARECIDO",SW/2,cy-fs*0.78);
  /* big line */
  ctx.save();ctx.translate(SW/2,cy+fs*0.32);ctx.scale(pu,pu);ctx.font="900 "+fs+"px system-ui";
  ctx.strokeStyle="rgba(0,0,0,0.92)";ctx.lineWidth=8;ctx.strokeText("EL GRAN PORTAL!",0,0);
  var tg=ctx.createLinearGradient(0,-fs*0.85,0,fs*0.1);tg.addColorStop(0,"#fff3c4");tg.addColorStop(0.45,"#ffb347");tg.addColorStop(1,"#c040ff");ctx.fillStyle=tg;ctx.fillText("EL GRAN PORTAL!",0,0);
  /* light sweep */
  var sw=((T-1.8)/0.9);if(sw>0&&sw<1){var tw=ctx.measureText("EL GRAN PORTAL!").width,sx=-tw/2+tw*1.3*sw-tw*0.15;ctx.globalCompositeOperation="source-atop";
    var sg=ctx.createLinearGradient(sx-30,0,sx+30,0);sg.addColorStop(0,"rgba(255,255,255,0)");sg.addColorStop(0.5,"rgba(255,255,255,0.85)");sg.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=sg;ctx.fillText("EL GRAN PORTAL!",0,0);}
  ctx.restore();
  ctx.font="italic 700 "+Math.round(fs*0.34)+"px system-ui";ctx.lineWidth=4;ctx.strokeStyle="rgba(0,0,0,0.85)";var sub="Entra y enfréntate a la batalla final";
  ctx.globalAlpha=a*clamp((T-1.9)/0.4,0,1);ctx.strokeText(sub,SW/2,cy+fs*0.82);ctx.fillStyle="#f3d9ff";ctx.fillText(sub,SW/2,cy+fs*0.82);
  ctx.restore();
}
function gpEnterScreen(T){
  var hp=game.hellPortal;if(!hp)return;
  var P=toScreen(hp.x,hp.y-40),u=clamp((T-1.05)/(GP_EN-1.05),0,1),i,k;
  ctx.save();
  /* darken edges, pull focus to the vortex */
  var v=ctx.createRadialGradient(P.x,P.y,SH*0.15,P.x,P.y,Math.max(SW,SH)*0.8);v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(10,0,16,"+(0.55*clamp(T/0.8,0,1))+")");ctx.fillStyle=v;ctx.fillRect(0,0,SW,SH);
  if(T>0.95){
    ctx.globalCompositeOperation="lighter";ctx.lineCap="round";
    var R=Math.max(SW,SH)*(0.15+1.2*u*u);
    for(k=0;k<8;k++){var a0=k*0.785-T*(6+u*10);ctx.strokeStyle=k%2?"rgba(255,140,60,"+(0.7*u+0.2)+")":"rgba(200,110,255,"+(0.7*u+0.2)+")";ctx.lineWidth=(10+30*u);ctx.beginPath();
      for(i=0;i<=14;i++){var w=i/14,ang=a0+w*3.2,rr=R*(1-w*0.95);var X=P.x+Math.cos(ang)*rr,Y=P.y+Math.sin(ang)*rr*0.8;if(i)ctx.lineTo(X,Y);else ctx.moveTo(X,Y);}ctx.stroke();}
    var fw=R*1.1;ctx.globalAlpha=0.6+0.4*u;ctx.drawImage(glowSpr("#ffffff"),P.x-fw*0.5,P.y-fw*0.5,fw,fw);
  }
  ctx.restore();
  if(T>1.1&&T<1.25){ctx.fillStyle="rgba(255,255,255,"+(1-Math.abs(T-1.17)/0.08)*0.8+")";ctx.fillRect(0,0,SW,SH);}
  if(u>0.6){ctx.fillStyle="rgba(255,250,244,"+clamp((u-0.6)/0.4,0,1)+")";ctx.fillRect(0,0,SW,SH);}
}
var _gpScreen=hellDrawScreen;
hellDrawScreen=function(){
  var st=game.state;
  if(st==="portal_reveal"){
    var T=GP.T,la=clamp(T/0.4,0,1)*clamp((GP_RV-T)/0.45,0,1);
    hellLetterbox(la);
    if(T<0.35){ctx.fillStyle="rgba(255,120,40,"+(0.25*(1-T/0.35))+")";ctx.fillRect(0,0,SW,SH);}
    gpTitle(T);
    if(T>1.6&&T<3.4){ctx.save();ctx.globalAlpha=0.5;ctx.font="12px system-ui";ctx.fillStyle="#fff";ctx.textAlign="right";ctx.fillText("Toca para continuar",SW-layout.safe.r-14,SH-8);ctx.restore();}
    return 1;
  }
  if(st==="portal_enter"){gpEnterScreen(GP.eT);return 1;}
  return _gpScreen();
};
