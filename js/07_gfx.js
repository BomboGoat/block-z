/* v18 graphics: textures, lighting, quality, blood, menu art */
var GFX={q:2,sprMul:2,chunkMul:2,lights:1,ready:0,menuBg:null,tex:{},ft:16,slow:0,maxPart:240,dusk:1};
function gfxIsPhone(){return /iPhone|iPad|Android/i.test(navigator.userAgent||"");}
function gfxInit(){
  GFX.q=2;GFX.sprMul=gfxIsPhone()?2:3;GFX.chunkMul=2;GFX.lights=1;GFX.maxPart=gfxIsPhone()?180:280;GFX.dprMax=2;
  if(typeof ensureMuzzleSpr==="function")ensureMuzzleSpr();
  if(typeof ensureBulletSprs==="function")ensureBulletSprs();
  if(typeof ensureFxSpr==="function")ensureFxSpr();
}
function gfxSetQ(q){
  q=clamp(q|0,0,2);if(q===GFX.q)return;
  GFX.q=q;GFX.sprMul=q>=2?(gfxIsPhone()?2:3):q>=1?2:1;GFX.chunkMul=q>=1?2:1;GFX.lights=q>=1;GFX.maxPart=q>=2?240:120;
  sprCache={};sprTick=0;if(typeof map!=="undefined"&&map){map.chunks={};map.dirty=1;}
}
function gfxLoad(done){
  var urls={grass:"assets/tex/grass.webp",asphalt:"assets/tex/asphalt.webp",plaza:"assets/tex/plaza.webp",ruins:"assets/tex/ruins.webp",parking:"assets/tex/parking.webp",sidewalk:"assets/tex/sidewalk.webp",concrete:"assets/tex/concrete.webp"},keys=Object.keys(urls);
  var trees=["oak","pine","bushy"],left=keys.length+trees.length+1;
  GFX.trees=GFX.trees||{};
  function tick(){if(--left<=0){GFX.ready=1;if(typeof map!=="undefined"&&map){map.chunks={};map.dirty=1;}if(done)done();}}
  keys.forEach(function(k){var im=new Image();im.onload=function(){GFX.tex[k]=im;tick();};im.onerror=tick;im.src=urls[k]+"?v=19.7";});
  trees.forEach(function(k){var im=new Image();im.onload=function(){GFX.trees[k]=im;tick();};im.onerror=tick;im.src="assets/env/tree_"+k+".webp?v=19.7";});
  var mb=new Image();mb.onload=function(){GFX.menuBg=mb;tick();};mb.onerror=tick;mb.src="assets/ui/menu-bg.webp?v=19.7";
}
function gfxTick(dt){
  var ms=(dt||0.016)*1000;GFX.ft=GFX.ft*0.9+ms*0.1;
  if(ms>23)GFX.slow=(GFX.slow||0)+1;else GFX.slow=Math.max(0,(GFX.slow||0)-1);
  if(GFX.slow>50&&GFX.q>0){gfxSetQ(GFX.q-1);GFX.slow=0;}
}
function gfxFillZone(g,z,x0,y0){
  var ys=CFG.YSCALE,key=z.k==="parking"?"parking":(z.k==="plaza"?"plaza":(z.k==="asphalt"?"asphalt":(z.k==="grass"?"grass":(z.k==="ruins"?"ruins":"concrete"))));
  if(z.k==="sidewalk")key="sidewalk";
  var tex=GFX.tex[key],rx=z.x-x0,ry=(z.y-y0)*ys,rw=z.w,rd=z.h*ys;
  if(tex){
    var tile=key==="grass"?110:key==="asphalt"?240:key==="plaza"?140:key==="sidewalk"?80:key==="parking"?100:96;
    var sx=tile/tex.width, sy=(tile*ys)/tex.height;
    g.save();g.beginPath();g.rect(rx-1,ry-1,rw+2,rd+2);g.clip();
    g.translate(-x0,-y0*ys);g.scale(sx,sy);
    try{g.fillStyle=g.createPattern(tex,"repeat");g.fillRect(z.x/sx,z.y*ys/sy,z.w/sx,z.h*ys/sy);}catch(e){g.scale(1/sx,1/sy);g.fillStyle=z.floor;g.fillRect(z.x,z.y*ys,z.w,z.h*ys);}
    g.restore();
  }else{g.fillStyle=z.floor;g.fillRect(rx,ry,rw,rd);}
}
function gfxZoneEdges(g,x0,y0,S){
  var ys=CFG.YSCALE,i,z;
  function stampEdge(z,col,amp,rad,step){
    var rng=seeded((z.x*7+z.y*13+(z.k||"").length*5)|0);
    function blob(wx,wy,r){
      if(wx<x0-20||wy<y0-20||wx>x0+S+20||wy>y0+S+20)return;
      g.fillStyle=col;g.beginPath();g.ellipse(wx-x0,(wy-y0)*ys,r,r*ys*0.85,0,0,7);g.fill();
    }
    var x,y,n;
    for(x=z.x;x<=z.x+z.w;x+=step){n=(rng()*2-1)*amp;blob(x,z.y+n,rad+rng()*4);blob(x,z.y+z.h+n,rad+rng()*4);}
    for(y=z.y;y<=z.y+z.h;y+=step){n=(rng()*2-1)*amp;blob(z.x+n,y,rad+rng()*4);blob(z.x+z.w+n,y,rad+rng()*4);}
  }
  for(i=0;i<(map.zones||[]).length;i++){
    z=map.zones[i];
    var rx=z.x-x0,ry=(z.y-y0)*ys,rw=z.w,rd=z.h*ys;
    if(rx+rw<-24||ry+rd<-24||rx>S+24||ry>S*ys+24)continue;
    if(z.k==="grass")stampEdge(z,"rgba(40,110,36,0.45)",14,11,18);
    else if(z.k==="asphalt"||z.k==="parking"){
      stampEdge(z,"rgba(42,44,50,0.5)",8,8,16);
      stampEdge(z,"rgba(90,80,70,0.28)",10,7,22);
      var rng=seeded((z.x*3+z.y)|0),k,wx,wy;
      g.fillStyle="rgba(190,185,170,0.28)";
      for(k=0;k<Math.max(8,(z.w/90)|0);k++){
        wx=z.x+rng()*z.w;wy=z.y+(rng()<0.5?rng()*10:z.h-rng()*10);
        g.beginPath();g.ellipse(wx-x0,(wy-y0)*ys,7+rng()*10,2+rng()*3,rng()*0.4,0,7);g.fill();
      }
    }else if(z.k==="plaza")stampEdge(z,"rgba(160,130,80,0.32)",10,9,18);
    else if(z.k==="ruins")stampEdge(z,"rgba(120,70,40,0.35)",16,10,18);
  }
}
function addBlood(x,y,n){
  if(!game.bloods)game.bloods=[];
  var i;n=n||5;
  for(i=0;i<n;i++)game.bloods.push({x:x+rand(-14,14),y:y+rand(-10,10),w:rand(8,18),d:rand(5,11),life:6+rand(0,3),maxLife:8,a:rand(0,3)});
  if(game.bloods.length>80)game.bloods.splice(0,game.bloods.length-80);
}
function drawBlood(){
  var i,b,s,sc=layout.scale,ys=CFG.YSCALE;if(!game||!game.bloods)return;
  for(i=0;i<game.bloods.length;i++){
    b=game.bloods[i];s=toScreen(b.x,b.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(b.a||0);
    ctx.globalAlpha=clamp(b.life/(b.maxLife||6),0,1)*0.55;
    ctx.fillStyle="#4a0808";fillEllipse(ctx,0,0,b.w*sc,b.d*sc*ys);
    ctx.fillStyle="#2a0404";fillEllipse(ctx,-2,-1,b.w*0.45*sc,b.d*0.45*sc*ys);
    ctx.restore();
  }
  ctx.globalAlpha=1;
}
function updateBlood(dt){
  var i,b;if(!game||!game.bloods)return;
  for(i=game.bloods.length-1;i>=0;i--){b=game.bloods[i];b.life-=dt;if(b.life<=0)game.bloods.splice(i,1);}
}
function drawLighting(){
  if(!GFX.lights||!game)return;
  var sc=layout.scale,t=game.time||0,i,s,o,flick;
  /* dusk grade — warm, matches the title art */
  ctx.fillStyle="rgba(28,10,6,0.07)";ctx.fillRect(0,0,SW,SH);
  ctx.globalCompositeOperation="lighter";
  if(map&&map.lamps){
    for(i=0;i<map.lamps.length;i++){
      o=map.lamps[i];if(o.dead||!onScreen(o.x,o.y,80))continue;
      s=toScreen(o.x+o.w/2,o.y+o.d/2);flick=0.55+0.25*Math.sin(t*7+o.x*0.05);
      var grd=ctx.createRadialGradient(s.x,s.y-16*sc,2,s.x,s.y+6*sc,42*sc);
      grd.addColorStop(0,"rgba(255,220,140,"+(0.14*flick)+")");grd.addColorStop(0.5,"rgba(255,150,50,"+(0.06*flick)+")");grd.addColorStop(1,"rgba(255,80,0,0)");
      ctx.fillStyle=grd;ctx.beginPath();ctx.arc(s.x,s.y,44*sc,0,7);ctx.fill();
    }
  }
  if(map&&map.solids){
    for(i=0;i<map.solids.length;i++){
      o=map.solids[i];if(!o.burn&&!o.wreck)continue;if(!onScreen(o.x,o.y,60))continue;
      s=toScreen(o.x+o.w/2,o.y+o.d/2);flick=0.5+0.4*Math.sin(t*11+o.x);
      var g2=ctx.createRadialGradient(s.x,s.y,2,s.x,s.y,50*sc);
      g2.addColorStop(0,"rgba(255,160,40,"+(0.3*flick)+")");g2.addColorStop(1,"rgba(255,40,0,0)");
      ctx.fillStyle=g2;ctx.beginPath();ctx.arc(s.x,s.y,50*sc,0,7);ctx.fill();
    }
  }
  if(game.player&&game.player.muzzle>0){
    var pl=game.player;
    if(pl._handSx!=null){s={x:pl._handSx,y:pl._handSy};}
    else{s=toScreen(pl.x,pl.y);s.y-=(typeof heroHandLiftPx==="function"?heroHandLiftPx(pl):22*sc);}
    if(typeof ensureMuzzleSpr==="function"){
      var ms=ensureMuzzleSpr(),a=Math.min(1,pl.muzzle*16),sz=14*sc;
      ctx.globalAlpha=0.22*a;ctx.drawImage(ms,s.x-sz,s.y-sz,sz*2,sz*2);ctx.globalAlpha=1;
    }
  }
  ctx.globalCompositeOperation="source-over";
}
function drawMenuArt(){
  var img=GFX.menuBg,t=game?game.menuT||0:0;
  ctx.fillStyle="#1a0708";ctx.fillRect(0,0,SW,SH);
  if(!img||!img.width)return 0;
  var iw=img.width,ih=img.height,portrait=SH>SW*1.05;
  if(portrait){
    /* fill the screen with a Ken Burns crop of the hand / city (lower art) */
    var srcY=ih*0.20,srcH=ih*0.80,k=Math.max(SW/iw,SH/srcH)*(1.04+Math.sin(t*0.25)*0.015);
    var ox=SW/2-iw*k/2+Math.sin(t*0.12)*6,oy=SH*0.42-srcH*k*0.45+Math.cos(t*0.1)*4;
    ctx.drawImage(img,0,srcY,iw,srcH,ox,oy,iw*k,srcH*k);
    /* width-fit the BLOCK Z banner so the full title stays visible, fade the seam */
    var lk=(SW/iw)*1.02,lh=ih*0.34*lk,lx=(SW-iw*lk)/2,ly=Math.max(0,(layout&&layout.safe?layout.safe.t:0)*0.15-4);
    var cv=GFX._banner;if(!cv){cv=document.createElement("canvas");GFX._banner=cv;}
    var bh=(ih*0.34)|0;cv.width=iw;cv.height=bh;
    var bc=cv.getContext("2d");bc.clearRect(0,0,iw,bh);bc.drawImage(img,0,0,iw,bh,0,0,iw,bh);
    var fg=bc.createLinearGradient(0,bh*0.72,0,bh);fg.addColorStop(0,"rgba(0,0,0,1)");fg.addColorStop(1,"rgba(0,0,0,0)");
    bc.globalCompositeOperation="destination-in";bc.fillStyle=fg;bc.fillRect(0,0,iw,bh);bc.globalCompositeOperation="source-over";
    ctx.drawImage(cv,lx,ly,iw*lk,lh);
  }else{
    /* landscape: contain the full poster so BLOCK Z is not cropped, dark bars at the sides */
    var k=Math.min(SW/iw,SH/ih)*(1.0+Math.sin(t*0.25)*0.01);
    var ox=(SW-iw*k)/2+Math.sin(t*0.12)*4,oy=(SH-ih*k)/2;
    ctx.drawImage(img,ox,oy,iw*k,ih*k);
  }
  var grd=ctx.createLinearGradient(0,SH*0.42,0,SH);
  grd.addColorStop(0,"rgba(16,4,4,0)");grd.addColorStop(0.45,"rgba(16,4,4,0.35)");grd.addColorStop(1,"rgba(16,4,4,0.88)");
  ctx.fillStyle=grd;ctx.fillRect(0,0,SW,SH);
  return 1;
}
function gfxBoom(x,y,r){
  var i;
  for(i=0;i<8;i++)addParticle(x,y,"#ffe082",0.22,rand(-220,220),rand(-220,220),7,9);
  for(i=0;i<10;i++)addParticle(x,y,i%2?"#ff6d00":"#ff3d00",0.45,rand(-160,160),rand(-180,80),8,2);
  for(i=0;i<8;i++)addParticle(x,y,"#37474f",0.7,rand(-60,60),rand(-90,-20),10,8);
  if(game.novas)game.novas.push({x:x,y:y,r:8,vr:(r||70)*4,life:0.28,maxLife:0.28,col:"rgba(255,220,160,0.7)"});
  if(typeof shake==="function")shake(8);
}
function ejectShell(p){
  var a=(p.aimAng||0)+1.2,sp=120+rand(0,60);
  var ho=typeof heroHandWorld==="function"?heroHandWorld(p,p.aimAng):{x:p.x,y:p.y};
  var sh=addParticle(ho.x,ho.y,"#ffd54f",0.45,Math.cos(a)*sp,Math.sin(a)*sp-40,3,7);
  if(sh)sh.lift=typeof heroHandLiftPx==="function"?heroHandLiftPx(p):0;
}
function gfxHitStop(t,kind){
  if(!game)return;
  /* only big events: boss, super, heavy slam. never stack, short cap, cooldown */
  if(kind!=="big")return;
  if((game.hitStop||0)>0||(game.hitStopCd||0)>0)return;
  game.hitStop=Math.min(0.06,t||0.05);
  game.hitStopCd=0.22;
  game.timeScale=0.18;
}
function gfxHitStopTick(realDt){
  if(!game)return;
  if(game.hitStopCd>0)game.hitStopCd=Math.max(0,game.hitStopCd-realDt);
  if(game.hitStop>0){
    game.hitStop=Math.max(0,game.hitStop-realDt);
    if(game.hitStop<=0)game.timeScale=1;
  }else game.timeScale=1;
}

