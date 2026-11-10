function onScreen(wx,wy,pad){pad=pad||80;var s=toScreen(wx,wy);return s.x>-pad&&s.x<SW+pad&&s.y>-pad&&s.y<SH+pad;}
function drawWorld(){
  drawGround();
  if(typeof drawBlood==="function")drawBlood();
  drawScorches();
  drawAmbientLive();
  /* y-sort all props + actors */
  var list=[],i,o,p=game.player,pad=140;
  function vis(x,y,w,d){var s1=toScreen(x,y),s2=toScreen(x+w,y+d);return!(s2.x<-pad||s1.x>SW+pad||s2.y<-pad||s1.y>SH+pad);}
  for(i=0;i<map.solids.length;i++){o=map.solids[i];if(o.dead)continue;if(vis(o.x,o.y,o.w,o.d))list.push({y:o.y+o.d+(o.canopy||0)*0.35,k:"p",o:o});}
  for(i=0;i<(map.decos||[]).length;i++){o=map.decos[i];if(vis(o.x,o.y,o.w,o.d))list.push({y:o.y+o.d,k:"p",o:o});}
  if(p)list.push({y:p.y+p.r,k:"pl"});
  var zs=game.state==="title"?game.titleZ:game.zombies;
  if(zs)for(i=0;i<zs.length;i++){o=zs[i];if(o.dead)continue;if(onScreen(o.x,o.y,80))list.push({y:o.y+o.r,k:"z",o:o});}
  if(game.player&&game.player.hasDog&&game.player.dog)list.push({y:game.player.dog.y+8,k:"dog"});
  list.sort(function(a,b){return a.y-b.y;});
  for(i=0;i<list.length;i++){
    var it=list[i];
    if(it.k==="p")drawProp(it.o,0);
    else if(it.k==="b")drawBush(it.o,it.ghost);
    else if(it.k==="pl")drawHero();
    else if(it.k==="z")drawZ(it.o);
    else if(it.k==="dog"){var d=game.player.dog;drawChar34(d.x,d.y,{kind:"zombie",skin:"#6e7a5a",shirt:"#3e2723",pants:"#3e2723",hair:"#1a120b",eyeGlow:"#c62828"},game.player.aimAng,d.anim||0,{h:16,r:8,scale:0.7,moving:1});}
  }
  /* bushes always on top of units (Brawl Stars hide) */
  for(i=0;i<map.bushes.length;i++){
    o=map.bushes[i];if(!vis(o.x,o.y,o.w,o.d))continue;
    var ghost=!!(p&&p.x>o.x-6&&p.x<o.x+o.w+6&&p.y>o.y-6&&p.y<o.y+o.d+6);
    drawBush(o,ghost);
  }
  /* bullets / fx above */
  if(game.bullets)for(i=0;i<game.bullets.length;i++)if(onScreen(game.bullets[i].x,game.bullets[i].y,20))drawBullet(game.bullets[i]);
  if(game.projectiles)for(i=0;i<game.projectiles.length;i++){var q=game.projectiles[i],s=toScreen(q.x,q.y);ctx.fillStyle=q.col||"#8bc34a";fillEllipse(ctx,s.x,s.y,5,4);}
  if(game.grenades)for(i=0;i<game.grenades.length;i++){var g=game.grenades[i];drawMarker(g.tx,g.ty,28,"#ffeb3b",game.time);var t=clamp(g.t/g.life,0,1),gs=toScreen(g.cx,g.cy);ctx.fillStyle="#37474f";fillEllipse(ctx,gs.x,gs.y-Math.sin(t*Math.PI)*30,5,5);}
  if(game.particles)for(i=0;i<game.particles.length;i++){var pt=game.particles[i],ps=toScreen(pt.x,pt.y),pa=clamp(pt.life/(pt.maxLife||0.4),0,1);ctx.globalAlpha=pa;ctx.fillStyle=pt.color;if(pt.kind===4){fillEllipse(ctx,ps.x,ps.y,pt.size*layout.scale,pt.size*0.55*layout.scale);}else if(pt.kind===7){ctx.save();ctx.translate(ps.x,ps.y);ctx.rotate(pt.rot||0);ctx.fillRect(-2,-1,4,2);ctx.restore();}else if(pt.kind===8){ctx.globalAlpha=pa*0.45;fillEllipse(ctx,ps.x,ps.y,pt.size*layout.scale*(1.4-pa),pt.size*0.7*layout.scale);}else if(pt.kind===9){ctx.save();ctx.translate(ps.x,ps.y);ctx.rotate(pt.rot||0);ctx.fillRect(-pt.size,0,pt.size*2,1.2);ctx.restore();}else fillEllipse(ctx,ps.x,ps.y,pt.size,pt.size*0.7);ctx.globalAlpha=1;}
  if(game.bolts)for(i=0;i<game.bolts.length;i++)drawBolt(game.bolts[i]);
  if(p&&p.boltFlash>0&&typeof ensureFxSpr==="function"){
    var hf=toScreen(p.x+Math.cos(p.aimAng||0)*12,p.y+Math.sin(p.aimAng||0)*12),ha=clamp(p.boltFlash/0.1,0,1),hsz=22*layout.scale*ha;
    ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.95*ha;
    ctx.drawImage(ensureFxSpr(),hf.x-hsz,hf.y-hsz,hsz*2,hsz*2);
    ctx.restore();
  }
  if(game.slashes)for(i=0;i<game.slashes.length;i++)drawSlashFX(game.slashes[i]);
  if(game.novas)for(i=0;i<game.novas.length;i++)drawNova(game.novas[i]);
  if(game.lasers)drawLasers();
  if(game.floatTexts)for(i=0;i<game.floatTexts.length;i++)drawFloat(game.floatTexts[i]);
}
function drawHero(){
  var p=game.player,blink=p.invuln>0&&((game.time*16)|0)%2===0;if(blink)ctx.globalAlpha=0.4;
  var wpn=p.weapon||"pistol";
  if(p.hasMelee&&p.meleeSwing>0&&wpn!=="knife"&&wpn!=="fist")wpn="machete";
  if(p.weapon==="fist"&&p.meleeSwing>0)wpn="fist";
  var two=wpn==="shotgun"||wpn==="smg"||wpn==="rifle"||wpn==="gl"||wpn==="pistol"||p.twoHand;
  if(p.fireAura){var s=toScreen(p.x,p.y);ctx.fillStyle="rgba(255,87,34,0.18)";fillEllipse(ctx,s.x,s.y,50*layout.scale,36*layout.scale);}
  if(p.hasOrbit){for(var i=0;i<3;i++){var a=p.orbitAngle+i*2.094,ox=p.x+Math.cos(a)*36,oy=p.y+Math.sin(a)*36,os=toScreen(ox,oy);ctx.fillStyle="#eceff1";ctx.beginPath();ctx.arc(os.x,os.y,4*layout.scale,0,7);ctx.fill();}}
  drawChar34(p.x,p.y,p.look,p.faceAng!=null?p.faceAng:(p.facing||p.aimAng),p.anim,{h:40,r:p.r,scale:p.scale||1,moving:Math.abs(p.vx)+Math.abs(p.vy)>20,wpn:wpn,aim:p.aimAng,twoHand:two,muzzle:p.muzzle,flash:p.flash>0,lift:(p.grabbed?26:0)+(p.airH||0)});
  if(p.hasShield&&p.shieldReady){var s2=toScreen(p.x,p.y);ctx.strokeStyle="rgba(33,150,243,0.7)";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(s2.x,s2.y,22*layout.scale,16*layout.scale,0,0,7);ctx.stroke();}
  ctx.globalAlpha=1;
}
function drawZ(z){
  if(z.dying)ctx.globalAlpha=clamp(z.deathT*2,0,1);
  var look=z.look||makeZombieLook(z.type,1);
  var opts={h:z.h,r:z.r,moving:z.isHome?0:1,flash:z.hitFlash>0,hpBar:(!game.lineup&&(z.isBoss||z.type==="tank"||z.type==="armored")&&!z.bName)?z.hp/z.maxHp:0};
  if(z.leapT>0||z.vaultT>0)opts.air=1;
  if(z.lift)opts.lift=(opts.lift||0)+z.lift;
  if(z.isHome&&(game.bossFight||game.state==="boss_intro"||z.windup||z.grabDash>0||z.grabT>0))opts.eyeGlow=1;
  if(z.isColossus&&(z.eyeFlash>0||z.windup==="slam"))opts.eyeGlow=1;
  if(z.isHome&&game.state==="boss_intro")opts.lift=(opts.lift||0)+22*clamp(((z.introT||0)-1)/3,0,1);
  if(z.dying){opts.dying=1;opts.dieP=clamp(z.deathT/0.45,0,1);}
  if(z.spawnT>0)opts.spawnP=clamp(1-z.spawnT/0.65,0,1);
  if(z.windup&&(z.isColossus||z.isHome||z.isBoss))opts.atk=1;
  drawChar34(z.x,z.y,look,z.aimAng||0,z.anim,opts);
  if(z.isHome&&(z.grabDash>0||z.grabT>0))drawSpeedLines(z);
  if(z.isHome&&z.windup==="grab"){
    var hs=toScreen(z.x,z.y),he=toScreen(z.tx,z.ty),ha=Math.atan2(he.y-hs.y,he.x-hs.x),ey=homeEyes(z),sx=ey?ey.m.x:hs.x,sy=ey?ey.m.y:hs.y-40*layout.scale;
    ctx.strokeStyle="rgba(255,40,40,0.9)";ctx.lineWidth=3;ctx.setLineDash([10,6]);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(he.x,he.y);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#ff1744";ctx.beginPath();ctx.moveTo(he.x,he.y);ctx.lineTo(he.x-Math.cos(ha-0.4)*16,he.y-Math.sin(ha-0.4)*16);ctx.lineTo(he.x-Math.cos(ha+0.4)*16,he.y-Math.sin(ha+0.4)*16);ctx.fill();
  }
  if(z.isColossus){
    if(z.windup==="slam")drawMarker(z.x,z.y,70,"#e53935",game.time);
    if(z.windup==="charge"){var s=toScreen(z.x,z.y),s2=toScreen(z.x+Math.cos(Math.atan2(game.player.y-z.y,game.player.x-z.x))*200,z.y+Math.sin(Math.atan2(game.player.y-z.y,game.player.x-z.x))*200);ctx.strokeStyle="rgba(229,57,53,0.7)";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s2.x,s2.y);ctx.stroke();}
    if(z.windup==="throw")drawMarker(z.throwX,z.throwY,36,"#ff9800",game.time);
    var ri;for(ri=0;ri<(z.rings||[]).length;ri++)drawSlamRing(z.x,z.y,z.rings[ri].r,"rgba(229,57,53,0.75)");
    for(ri=0;ri<(z.throws||[]).length;ri++)drawMarker(z.throws[ri].tx,z.throws[ri].ty,36,"#ff9800",game.time);
  }
  if(z.isHome&&z.windup==="dive")drawMarker(z.tx,z.ty,36,"#ff1744",game.time);
  if(z.bubbleText&&game.state!=="boss_intro"){
    var bs=toScreen(z.x,z.y-z.r);
    ctx.font="bold 14px system-ui";ctx.textAlign="center";
    var tw=ctx.measureText(z.bubbleText).width+16;
    ctx.fillStyle="rgba(0,0,0,0.75)";roundRect(ctx,bs.x-tw/2,bs.y-z.h*layout.scale-36,tw,26,8);ctx.fill();
    ctx.fillStyle="#ffe082";ctx.fillText(z.bubbleText,bs.x,bs.y-z.h*layout.scale-18);
    ctx.textAlign="left";
  }
  if(z.isBoss&&!z.isColossus&&!z.isHome){var i2;for(i2=0;i2<(z.rings||[]).length;i2++)drawSlamRing(z.x,z.y,z.rings[i2].r,"rgba(229,57,53,0.7)");if(z.windup==="slam")drawMarker(z.x,z.y,60,"#e53935",game.time);}
  ctx.globalAlpha=1;
}
function panel(x,y,w,h,fill){ctx.fillStyle=fill||"rgba(15,18,28,0.72)";roundRect(ctx,x,y,w,h,10);ctx.fill();ctx.strokeStyle="#1a140c";ctx.lineWidth=2.4;roundRect(ctx,x,y,w,h,10);ctx.stroke();ctx.strokeStyle="rgba(255,255,255,0.18)";ctx.lineWidth=1;roundRect(ctx,x+2,y+2,w-4,h-4,8);ctx.stroke();}
function strokeText(txt,x,y,col,size){ctx.font="bold "+(size||14)+"px system-ui";ctx.lineJoin="round";ctx.strokeStyle="#1a140c";ctx.lineWidth=4;ctx.strokeText(txt,x,y);ctx.fillStyle=col||"#fff";ctx.fillText(txt,x,y);}
function drawHUD(){
  var p=game.player,s=layout.safe;
  var hx=s.l+12,hy=s.t+10,hw=Math.min(200,SW*0.36),hh=16;
  panel(hx-6,hy-6,hw+12,64);
  ctx.fillStyle="#4a1515";roundRect(ctx,hx,hy,hw,hh,8);ctx.fill();
  ctx.fillStyle=lg(ctx,hx,hy,hx,hy+hh,"#ef5350","#b71c1c");
  if(p.hp>0){roundRect(ctx,hx,hy,Math.max(6,hw*clamp(p.hp/p.maxHp,0,1)),hh,8);ctx.fill();}
  ctx.strokeStyle="#1a140c";ctx.lineWidth=2;roundRect(ctx,hx,hy,hw,hh,8);ctx.stroke();
  ctx.font="bold 11px system-ui";ctx.fillStyle="#fff";ctx.fillText((p.hp|0)+"/"+(p.maxHp|0),hx+6,hy+12);
  strokeText("Ronda "+(game.wave+1)+"/10   Nv "+p.runLevel,hx,hy+32,"#ffd54f",13);
  var zn="";for(var zi=map.zones.length-1;zi>=0;zi--){var zz=map.zones[zi];if(p.x>=zz.x&&p.x<=zz.x+zz.w&&p.y>=zz.y&&p.y<=zz.y+zz.h){zn=zz.name;break;}}
  ctx.fillStyle="#cfd8dc";ctx.font="11px system-ui";ctx.fillText((zn?zn+"  ·  ":"")+"Bajas "+game.kills+"  ·  "+game.score+" pts",hx,hy+44);
  drawMinimap();
  drawPauseBtn();
  if((game.state==="playing"||game.state==="countdown"||game.state==="boss_intro")&&!(p&&p.grabbed)){drawJoystick();drawSuperBtn();}
  if(p&&p.grabbed)drawMashButton();
  var boss=game.boss;
  if(boss&&!boss.dead&&!boss.dying&&game.bossFight&&game.state!=="boss_intro"){
    var bw=Math.min(340,SW-120),bx=(SW-bw)/2,by=s.t+2,bh=8;
    ctx.fillStyle="rgba(10,0,0,0.72)";roundRect(ctx,bx-4,by,bw+8,22,6);ctx.fill();
    ctx.textAlign="center";ctx.fillStyle="#ffd54f";ctx.font="bold 9px system-ui";ctx.fillText(boss.bName||"JEFE",SW/2,by+8);
    ctx.fillStyle="#3a0000";roundRect(ctx,bx,by+10,bw,bh,3);ctx.fill();
    ctx.fillStyle="#e53935";roundRect(ctx,bx,by+10,bw*clamp(boss.hp/boss.maxHp,0,1),bh,3);ctx.fill();
    ctx.strokeStyle="#1a140c";ctx.lineWidth=1.4;roundRect(ctx,bx,by+10,bw,bh,3);ctx.stroke();
    ctx.textAlign="left";
  }
}
function drawMinimap(){
  var s=layout.safe,mw=layout.isPortrait?78:96,mh=mw,x=s.l+12,y=s.t+74;
  panel(x-6,y-6,mw+12,mh+12);
  var sx=mw/CFG.MAP_W,sy=mh/CFG.MAP_H,i,z;
  for(i=0;i<map.zones.length;i++){z=map.zones[i];ctx.fillStyle=z.floor;ctx.fillRect(x+z.x*sx,y+z.y*sy,z.w*sx,z.h*sy);}
  ctx.fillStyle="rgba(255,255,255,0.25)";
  for(i=0;i<map.solids.length;i++){var o=map.solids[i];if(o.k==="wall")ctx.fillRect(x+o.x*sx,y+o.y*sy,Math.max(1,o.w*sx),Math.max(1,o.d*sy));}
  if(game.zombies)for(i=0;i<game.zombies.length;i++){z=game.zombies[i];if(z.dead||z.dying)continue;ctx.fillStyle=z.isColossus||z.isBoss?"#ff1744":"#8bc34a";ctx.fillRect(x+z.x*sx-1,y+z.y*sy-1,3,3);}
  var p=game.player;ctx.fillStyle="#42a5f5";ctx.beginPath();ctx.arc(x+p.x*sx,y+p.y*sy,3,0,7);ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,0.5)";ctx.lineWidth=1;
  ctx.strokeRect(x+(game.camX-worldW()/2)*sx,y+(game.camY-worldH()/2)*sy,worldW()*sx,worldH()*sy);
}
function drawPauseBtn(){var b=getPauseBtn();panel(b.x,b.y,b.w,b.h,"rgba(20,22,32,0.7)");ctx.fillStyle="#fff";roundRect(ctx,b.x+13,b.y+10,5,20,1.5);ctx.fill();roundRect(ctx,b.x+22,b.y+10,5,20,1.5);ctx.fill();}
function drawJoystick(){
  if(!(game.state==="playing"||game.state==="countdown"||game.state==="boss_intro"))return;
  var ox=input.joy?input.joyX:joyOrigin().x,oy=input.joy?input.joyY:joyOrigin().y,rad=58;
  ctx.save();ctx.globalAlpha=input.joy?0.78:0.45;
  ctx.fillStyle="rgba(20,30,50,0.4)";ctx.beginPath();ctx.arc(ox,oy,rad,0,7);ctx.fill();
  ctx.strokeStyle="rgba(227,242,253,0.95)";ctx.lineWidth=4;ctx.beginPath();ctx.arc(ox,oy,rad,0,7);ctx.stroke();
  ctx.strokeStyle="rgba(129,212,250,0.35)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(ox,oy,rad-5,0,7);ctx.stroke();
  ctx.globalAlpha=1;
  ctx.fillStyle="#f5f5f5";ctx.beginPath();ctx.arc(ox+input.jx*rad*0.62,oy+input.jy*rad*0.62,20,0,7);ctx.fill();
  ctx.strokeStyle="#1a140c";ctx.lineWidth=2;ctx.stroke();
  ctx.restore();
}
function drawSuperBtn(){
  var b=getSuperBtn(),p=game.player,ch=clamp((p.super||0)/CFG.SUPER_COST,0,1),cx=b.x+b.w/2,cy=b.y+b.h/2,R=b.w/2;
  var laserOn=p&&p.laserT>0,stick=ch>=1||laserOn,aiming=!!(input.super&&stick),cancel=aiming&&input.superCancel;
  var icon="💣",kind=typeof superKind==="function"?superKind(p):"";
  if(kind==="laser")icon="⚡";else if(kind==="knives")icon="🔥";else if(kind==="giant")icon="🦍";else if(kind==="cannon")icon="💥";else if(kind==="dash")icon="💨";else if(kind==="flex")icon="💪";
  ctx.save();
  if(stick){
    var rad=54,ringCol=cancel?"#ff8a80":(kind==="laser"||laserOn?"#81d4fa":"#ffe082");
    ctx.globalAlpha=0.92;
    ctx.fillStyle=cancel?"rgba(80,16,16,0.82)":(kind==="laser"||laserOn?"rgba(10,24,40,0.72)":"rgba(20,16,12,0.72)");
    ctx.beginPath();ctx.arc(cx,cy,rad,0,7);ctx.fill();
    ctx.strokeStyle=cancel?"#ff5252":"rgba(227,242,253,0.95)";ctx.lineWidth=4;ctx.stroke();
    ctx.strokeStyle=cancel?"#ff8a80":ringCol;ctx.lineWidth=5;
    ctx.beginPath();ctx.arc(cx,cy,rad-6,-Math.PI/2,-Math.PI/2+(laserOn?1:ch)*Math.PI*2);ctx.stroke();
    ctx.globalAlpha=aiming?0.28:0.9;
    ctx.fillStyle=cancel?"#ffcdd2":"#fff8e1";ctx.font="bold 22px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(cancel?"✕":icon,cx,cy);
    ctx.globalAlpha=1;
    var kx=cx+(input.sjx||0)*rad*0.62,ky=cy+(input.sjy||0)*rad*0.62;
    ctx.fillStyle=cancel?"#ef5350":"#f5f5f5";ctx.beginPath();ctx.arc(kx,ky,20,0,7);ctx.fill();
    ctx.strokeStyle="#1a140c";ctx.lineWidth=2;ctx.stroke();
  }else{
    ctx.fillStyle="rgba(20,16,12,0.7)";ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fill();
    ctx.strokeStyle="#1a140c";ctx.lineWidth=3;ctx.stroke();
    ctx.strokeStyle="#ffe082";ctx.lineWidth=5;
    ctx.beginPath();ctx.arc(cx,cy,R-4,-Math.PI/2,-Math.PI/2+ch*Math.PI*2);ctx.stroke();
    ctx.fillStyle="#cfd8dc";ctx.font="bold "+Math.max(18,(b.w*0.3)|0)+"px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(icon,cx,cy);
  }
  ctx.restore();ctx.textAlign="left";ctx.textBaseline="alphabetic";
}
function drawSuperAim(){
  var p=game&&game.player;if(!p||!input.super||input.superCancel)return;
  if(p.laserT>0)return;
  if((p.super||0)<CFG.SUPER_COST)return;
  var ang=input.superDragged?Math.atan2(input.sjy,input.sjx):autoSuperAng(p);
  var pr=typeof superPreview==="function"?superPreview(p,ang):null;if(!pr)return;
  var a=toScreen(p.x,p.y),sc=layout.scale,ys=CFG.YSCALE,i,s,e,x2,y2;
  ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
  if(pr.kind==="flex"){
    s=toScreen(p.x,p.y);
    ctx.fillStyle="rgba(188,170,164,0.22)";ctx.strokeStyle="rgba(255,224,178,0.85)";ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(s.x,s.y,pr.r*sc,pr.r*sc*ys,0,0,7);ctx.fill();ctx.stroke();
  }else if(pr.kind==="grenade"){
    x2=p.x+Math.cos(pr.ang)*pr.len;y2=p.y+Math.sin(pr.ang)*pr.len;
    s=toScreen(p.x,p.y);e=toScreen(x2,y2);
    ctx.strokeStyle="rgba(255,235,59,0.85)";ctx.setLineDash([10,8]);ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(e.x,e.y);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="rgba(255,193,7,0.22)";ctx.strokeStyle="#ffeb3b";ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(e.x,e.y,pr.r*sc,pr.r*sc*ys,0,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle="#ffeb3b";ctx.beginPath();ctx.arc(e.x,e.y,5,0,7);ctx.fill();
  }else if(pr.kind==="dash"){
    x2=p.x+Math.cos(pr.ang)*pr.len;y2=p.y+Math.sin(pr.ang)*pr.len;
    s=toScreen(p.x,p.y);e=toScreen(x2,y2);
    ctx.strokeStyle=pr.slash?"rgba(224,224,224,0.9)":"rgba(129,212,250,0.9)";ctx.lineWidth=6*sc;
    ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(e.x,e.y);ctx.stroke();
    var hx=Math.cos(pr.ang),hy=Math.sin(pr.ang),px=-hy,py=hx,tip=14;
    var t1=toScreen(x2-hx*16+px*10,y2-hy*16+py*10),t2=toScreen(x2-hx*16-px*10,y2-hy*16-py*10);
    ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(t1.x,t1.y);ctx.lineTo(t2.x,t2.y);ctx.closePath();ctx.fill();
  }else if(pr.kind==="laser"){
    x2=p.x+Math.cos(pr.ang)*pr.len;y2=p.y+Math.sin(pr.ang)*pr.len;
    s=toScreen(p.x,p.y);e=toScreen(x2,y2);
    var w=(pr.w||15)*sc;
    ctx.strokeStyle="rgba(33,150,243,0.2)";ctx.lineWidth=w*1.15;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(e.x,e.y);ctx.stroke();
    ctx.strokeStyle="rgba(144,202,249,0.7)";ctx.lineWidth=w*0.45;ctx.stroke();
    ctx.strokeStyle="rgba(227,242,253,0.95)";ctx.lineWidth=2;ctx.setLineDash([14,9]);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(e.x,e.y);ctx.stroke();ctx.setLineDash([]);
  }else if(pr.kind==="cannon"){
    s=toScreen(p.x,p.y);
    var n=pr.n||24,sp=pr.spread||0.44,len=pr.len||250,k,aa,ex,ey,es;
    ctx.fillStyle="rgba(255,193,7,0.14)";
    ctx.beginPath();ctx.moveTo(s.x,s.y);
    for(k=0;k<=8;k++){
      aa=pr.ang+((k/8)-0.5)*sp;ex=p.x+Math.cos(aa)*len;ey=p.y+Math.sin(aa)*len;es=toScreen(ex,ey);
      if(k===0)ctx.moveTo(s.x,s.y);ctx.lineTo(es.x,es.y);
    }
    ctx.closePath();ctx.fill();
    ctx.strokeStyle=pr.gl?"rgba(174,213,129,0.9)":"rgba(255,224,130,0.9)";ctx.lineWidth=2;ctx.setLineDash([8,6]);
    for(k=0;k<Math.min(n,7);k++){
      aa=pr.ang+((n<=1?0:k/(Math.min(n,7)-1))-0.5)*sp;
      es=toScreen(p.x+Math.cos(aa)*len,p.y+Math.sin(aa)*len);
      ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(es.x,es.y);ctx.stroke();
    }
    ctx.setLineDash([]);
  }else if(pr.kind==="knives"){
    s=toScreen(p.x,p.y);
    var kn=pr.n||6,ksp=pr.spread||(48*Math.PI/180),klen=pr.len||210,ki,ka,ke,tip,hx,hy;
    ctx.strokeStyle="rgba(255,138,80,0.85)";ctx.fillStyle="rgba(255,87,34,0.2)";ctx.lineWidth=3;
    for(ki=0;ki<kn;ki++){
      ka=pr.ang+((ki/(kn-1))-0.5)*ksp;
      ke=toScreen(p.x+Math.cos(ka)*klen,p.y+Math.sin(ka)*klen);
      ctx.setLineDash([7,6]);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(ke.x,ke.y);ctx.stroke();ctx.setLineDash([]);
      hx=Math.cos(ka);hy=Math.sin(ka);
      tip=toScreen(p.x+Math.cos(ka)*klen,p.y+Math.sin(ka)*klen);
      var t1=toScreen(p.x+Math.cos(ka)*klen-hx*12+(-hy)*7,p.y+Math.sin(ka)*klen-hy*12+hx*7);
      var t2=toScreen(p.x+Math.cos(ka)*klen-hx*12-(-hy)*7,p.y+Math.sin(ka)*klen-hy*12-hx*7);
      ctx.fillStyle="#ffab40";ctx.beginPath();ctx.moveTo(ke.x,ke.y);ctx.lineTo(t1.x,t1.y);ctx.lineTo(t2.x,t2.y);ctx.closePath();ctx.fill();
    }
  }else if(pr.kind==="giant"){
    x2=p.x+Math.cos(pr.ang)*pr.len;y2=p.y+Math.sin(pr.ang)*pr.len;
    s=toScreen(p.x,p.y);e=toScreen(x2,y2);
    ctx.strokeStyle="rgba(188,170,164,0.9)";ctx.lineWidth=6*sc;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(e.x,e.y);ctx.stroke();
    var ghx=Math.cos(pr.ang),ghy=Math.sin(pr.ang),g1=toScreen(x2-ghx*16+(-ghy)*10,y2-ghy*16+ghx*10),g2=toScreen(x2-ghx*16-(-ghy)*10,y2-ghy*16-ghx*10);
    ctx.fillStyle="rgba(188,170,164,0.95)";ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(g1.x,g1.y);ctx.lineTo(g2.x,g2.y);ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(188,170,164,0.22)";ctx.strokeStyle="rgba(255,224,178,0.9)";ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(e.x,e.y,pr.r*sc,pr.r*sc*ys,0,0,7);ctx.fill();ctx.stroke();
  }
  ctx.restore();
}
function drawTruenoLaser(){
  var p=game&&game.player;if(!p||!(p.laserT>0))return;
  var x2=p.x+Math.cos(p.laserAng)*p.laserLen,y2=p.y+Math.sin(p.laserAng)*p.laserLen;
  var s=toScreen(p.x,p.y),e=toScreen(x2,y2),sc=layout.scale,w=(p.laserW||15)*sc;
  var pulse=1+Math.sin((game.time||0)*42)*0.06,life=clamp(p.laserT/(p.laserMax||3),0,1),spr=typeof ensureFxSpr==="function"?ensureFxSpr():null;
  ctx.save();ctx.lineCap="round";ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.45+0.55*Math.min(1,life*4);
  ctx.strokeStyle="rgba(21,101,192,0.32)";ctx.lineWidth=w*1.15*pulse;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(e.x,e.y);ctx.stroke();
  ctx.strokeStyle="rgba(66,165,245,0.7)";ctx.lineWidth=w*0.62;ctx.stroke();
  ctx.strokeStyle="rgba(227,242,253,0.95)";ctx.lineWidth=Math.max(1.6,w*0.22);ctx.stroke();
  ctx.strokeStyle="rgba(255,255,255,0.9)";ctx.lineWidth=Math.max(1,w*0.1);ctx.stroke();
  if(spr){
    var tip=14*sc;
    ctx.globalAlpha=0.85;ctx.drawImage(spr,e.x-tip,e.y-tip,tip*2,tip*2);
    var hs=10*sc;ctx.globalAlpha=0.7;ctx.drawImage(spr,s.x-hs,s.y-hs,hs*2,hs*2);
  }
  ctx.restore();
}
function drawUIButton(b,fill){ctx.fillStyle=fill||"#2ecc71";roundRect(ctx,b.x,b.y,b.w,b.h,14);ctx.fill();ctx.strokeStyle="#1a140c";ctx.lineWidth=3;roundRect(ctx,b.x,b.y,b.w,b.h,14);ctx.stroke();ctx.strokeStyle="rgba(255,255,255,0.25)";ctx.lineWidth=1.5;roundRect(ctx,b.x+3,b.y+3,b.w-6,b.h-6,11);ctx.stroke();ctx.fillStyle="#0a0a12";ctx.font="bold 18px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(b.label,b.x+b.w/2,b.y+b.h/2+1);ctx.textBaseline="alphabetic";ctx.textAlign="left";}
function drawLogo(cx,y,scale){
  ctx.save();ctx.translate(cx,y);ctx.scale(scale||1,scale||1);
  ctx.font="bold 44px system-ui";ctx.textAlign="center";ctx.lineJoin="round";
  ctx.strokeStyle="#1a140c";ctx.lineWidth=8;ctx.strokeText("BLOCK Z",0,0);
  ctx.fillStyle="#ffd54f";ctx.fillText("BLOCK Z",0,0);
  ctx.restore();
}
function barStat(x,y,w,v,col,bh){bh=bh||7;var rr=Math.max(2,bh*0.4);ctx.fillStyle="rgba(0,0,0,0.4)";roundRect(ctx,x,y,w,bh,rr);ctx.fill();ctx.fillStyle=col;roundRect(ctx,x,y,w*clamp(v/140,0,1),bh,rr);ctx.fill();ctx.strokeStyle="#1a140c";ctx.lineWidth=1;roundRect(ctx,x,y,w,bh,rr);ctx.stroke();}
function drawSelect(){
  var hasArt=typeof drawMenuArt==="function"&&drawMenuArt();
  if(!hasArt)drawWorld();
  ctx.fillStyle=hasArt?"rgba(12,3,3,0.42)":"rgba(0,0,0,0.55)";ctx.fillRect(0,0,SW,SH);
  layoutSelect();layoutMenuButtons();
  ctx.textAlign="center";strokeText("Elige personaje",SW/2,layout.safe.t+36,"#ffd54f",layout.isPortrait?22:26);
  var cards=game.selectCards||[],i,c,h,sel;
  for(i=0;i<cards.length;i++){
    c=cards[i];h=c.hero;sel=(h.id===selectedHero)||(c.idx===(game.selectIdx||0));
    ctx.fillStyle="#14141e";roundRect(ctx,c.x,c.y,c.w,c.h,14);ctx.fill();
    ctx.strokeStyle=sel?h.col:"#1a140c";ctx.lineWidth=sel?4:2;roundRect(ctx,c.x,c.y,c.w,c.h,14);ctx.stroke();
    if(sel){ctx.strokeStyle="rgba(255,255,255,0.25)";ctx.lineWidth=1.4;roundRect(ctx,c.x+3,c.y+3,c.w-6,c.h-6,11);ctx.stroke();}
    var look=makeHeroLook(h.id),k=Math.max(0.78,Math.min(1,c.h/255)),fh=Math.round(108*k),px=c.x+c.w/2;
    ctx.save();roundRect(ctx,c.x+2,c.y+2,c.w-4,c.h-fh,12);ctx.clip();
    if(!(typeof drawSelectPortrait==="function"&&drawSelectPortrait(look,c.x+4,c.y+4,c.w-8,c.h-fh-4))){
      var spr=getCharSpr(look,2,1,{}),sc=Math.min(c.w*1.25,(c.h-fh)*1.38)/SPR_H,py=c.y+c.h-fh-SPR_H*sc+26;
      ctx.drawImage(spr.c,px-SPR_W*sc/2,py,SPR_W*sc,SPR_H*sc);
    }
    ctx.restore();
    var gy=c.y+c.h-fh;
    ctx.fillStyle="#14141e";ctx.beginPath();ctx.moveTo(c.x+2,gy);ctx.lineTo(c.x+c.w-2,gy);ctx.lineTo(c.x+c.w-2,c.y+c.h-14);ctx.quadraticCurveTo(c.x+c.w-2,c.y+c.h-2,c.x+c.w-14,c.y+c.h-2);ctx.lineTo(c.x+14,c.y+c.h-2);ctx.quadraticCurveTo(c.x+2,c.y+c.h-2,c.x+2,c.y+c.h-14);ctx.closePath();ctx.fill();
    ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="bold "+Math.round(15*k)+"px system-ui";ctx.fillText(h.name,px,gy+Math.round(14*k));
    ctx.fillStyle=h.col;ctx.font=Math.round(10*k)+"px system-ui";ctx.fillText(h.wpn,px,gy+Math.round(26*k));
    ctx.fillStyle="#cfd8dc";ctx.font=Math.round(9*k)+"px system-ui";
    var dy=gy+Math.round(40*k),words=String(h.desc).split(" "),line="",wi,lines=0,lh=Math.round(12*k);
    for(wi=0;wi<words.length;wi++){var tt=line+words[wi]+" ";if(ctx.measureText(tt).width>c.w-16&&line){ctx.fillText(line,px,dy);dy+=lh;line=words[wi]+" ";lines++;if(lines>=1){var rest=words.slice(wi).join(" ");if(ctx.measureText(rest).width>c.w-16){while(rest.length>1&&ctx.measureText(rest+"…").width>c.w-16)rest=rest.slice(0,-1);rest+="…";}ctx.fillText(rest,px,dy);dy+=lh;line="";break;}}else line=tt;}
    if(line){ctx.fillText(line,px,dy);dy+=lh;}
    var bx=c.x+10,bw=c.w-20,by=gy+Math.round(72*k),barH=Math.max(5,Math.round(7*k)),bgap=Math.round(12*k);
    ctx.textAlign="left";ctx.fillStyle="#eee";ctx.font=Math.round(9*k)+"px system-ui";
    ctx.fillText("HP",bx,by+6*k);barStat(bx+24,by,bw-24,h.hp,"#e53935",barH);
    ctx.fillText("VEL",bx,by+bgap+6*k);barStat(bx+24,by+bgap,bw-24,h.spd,"#42a5f5",barH);
    ctx.fillText("DMG",bx,by+bgap*2+6*k);barStat(bx+24,by+bgap*2,bw-24,h.dmg,"#ffb300",barH);
  }
  for(i=0;i<menuBtns.length;i++)drawUIButton(menuBtns[i],menuBtns[i].id==="start"?"#2ecc71":"#95a5a6");
  ctx.textAlign="left";
}
function drawTitle(){
  var hasArt=typeof drawMenuArt==="function"&&drawMenuArt();
  if(!hasArt){drawWorld();ctx.fillStyle="rgba(0,0,0,0.38)";ctx.fillRect(0,0,SW,SH);}
  var cx=SW/2,top=layout.isPortrait?layout.safe.t+20:SH*0.06;
  if(!hasArt)drawLogo(cx,layout.isPortrait?layout.safe.t+54:SH*0.12,layout.isPortrait?0.85:1.05);
  layoutMenuButtons();
  for(var i=0;i<menuBtns.length;i++)drawUIButton(menuBtns[i],i===0?"#e65100":i===1?"#c62818":"#5d4037");
  var sub="Sobrevive · Mejora · Derrota a los jefes";
  var xp="Nivel "+account.level+"  ·  XP "+account.xp+"/"+account.xpToNext;
  var last=menuBtns[menuBtns.length-1], tx,ty;
  if(hasArt&&last){
    tx=last.x+last.w/2;
    ty=Math.min(SH-layout.safe.b-28, last.y+last.h+22);
  }else{
    tx=cx;ty=(hasArt?SH*0.42:top+48);
  }
  ctx.textAlign="center";ctx.lineJoin="round";
  ctx.strokeStyle="rgba(0,0,0,0.85)";ctx.lineWidth=5;
  ctx.font="bold 13px system-ui";ctx.fillStyle="#ffecb3";
  ctx.strokeText(sub,tx,ty);ctx.fillText(sub,tx,ty);
  ctx.fillStyle="#ffc107";ctx.font="bold 13px system-ui";
  ctx.strokeText(xp,tx,ty+18);ctx.fillText(xp,tx,ty+18);
  ctx.textAlign="left";
}
function drawTitleSplash(){
  ctx.save();
  ctx.fillStyle="rgba(6,2,2,0.58)";ctx.fillRect(0,0,SW,SH);
  var cx=SW/2,cy=SH*0.62,pulse=0.72+0.28*Math.sin((typeof performance!=="undefined"?performance.now():0)/280);
  ctx.globalAlpha=pulse;ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineJoin="round";
  ctx.font="bold "+Math.max(22,Math.min(36,SH*0.08))+"px system-ui";
  ctx.strokeStyle="rgba(0,0,0,0.9)";ctx.lineWidth=7;
  ctx.strokeText("Toca para empezar",cx,cy);ctx.fillStyle="#fff8e1";ctx.fillText("Toca para empezar",cx,cy);
  ctx.restore();ctx.textAlign="left";ctx.textBaseline="alphabetic";
}
function drawSettings(){ctx.fillStyle="rgba(0,0,0,0.82)";ctx.fillRect(0,0,SW,SH);ctx.textAlign="center";ctx.fillStyle="#ffc107";ctx.font="bold 22px system-ui";ctx.fillText("Ajustes",SW/2,layout.safe.t+56);layoutMenuButtons();for(var i=0;i<settingsBtns.length;i++)drawUIButton(settingsBtns[i],settingsBtns[i].id==="back"?"#95a5a6":"#5c6bc0");}
function drawHowTo(){
  ctx.fillStyle="rgba(0,0,0,0.84)";ctx.fillRect(0,0,SW,SH);
  ctx.textAlign="center";ctx.fillStyle="#ffc107";ctx.font="bold 22px system-ui";ctx.fillText("Cómo jugar",SW/2,layout.safe.t+50);
  ctx.fillStyle="#ecf0f1";ctx.font="13px system-ui";ctx.textAlign="left";
  var lines=["• Joystick izquierdo (donde pongas el pulgar)","• Elige personaje antes de jugar","• Atacas al enemigo más cercano","• Super (derecha): apúntala con su joystick","• Arbustos: te esconden","• Jefes en las rondas 3, 6 y 10"];
  var y=layout.safe.t+90;for(var i=0;i<lines.length;i++){ctx.fillText(lines[i],24+layout.safe.l,y);y+=24;}
  layoutMenuButtons();if(howToBack)drawUIButton(howToBack,"#95a5a6");
}
function drawPauseUI(){ctx.fillStyle="rgba(0,0,0,0.78)";ctx.fillRect(0,0,SW,SH);ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="bold 24px system-ui";ctx.fillText("Pausa",SW/2,layout.safe.t+36);layoutMenuButtons();for(var i=0;i<pauseBtns.length;i++){var col=pauseBtns[i].id==="continuar"?"#2ecc71":pauseBtns[i].id==="menu"?"#e67e22":"#5c6bc0";drawUIButton(pauseBtns[i],col);}}
function drawUpgradeUI(){ctx.fillStyle="rgba(0,0,0,0.78)";ctx.fillRect(0,0,SW,SH);ctx.textAlign="center";ctx.fillStyle="#ffc107";ctx.font=layout.isPortrait?"bold 16px system-ui":"bold 22px system-ui";var titleY=game.upgradeCards[0]?Math.max(28,game.upgradeCards[0].y-16):40;ctx.fillText("¡Ronda superada! Elige una mejora",SW/2,titleY);
  for(var i=0;i<game.upgradeCards.length;i++){var card=game.upgradeCards[i],up=card.upgrade;if(up.rarity>=4){ctx.shadowColor=up.glow;ctx.shadowBlur=16;}ctx.fillStyle="#14141e";ctx.strokeStyle=up.frame;ctx.lineWidth=3;roundRect(ctx,card.x,card.y,card.w,card.h,10);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=up.color;ctx.fillRect(card.x+3,card.y+3,card.stacked?52:card.w-6,card.stacked?card.h-6:22);
    ctx.strokeStyle=up.frame;ctx.lineWidth=2;roundRect(ctx,card.x+5,card.y+5,card.w-10,card.h-10,7);ctx.stroke();
    ctx.fillStyle="#fff";ctx.font=card.stacked?"bold 16px system-ui":"bold 18px system-ui";ctx.textAlign=card.stacked?"left":"center";
    if(card.stacked){ctx.fillText(up.icon+"  "+up.name,card.x+64,card.y+28);ctx.font="bold 11px system-ui";ctx.fillStyle=up.color;ctx.fillText((up.rarityName||"").toUpperCase(),card.x+64,card.y+46);ctx.fillStyle="#cfd8dc";ctx.font="12px system-ui";ctx.fillText(up.desc,card.x+64,card.y+66);}
    else{ctx.textAlign="center";ctx.fillText(up.icon,card.x+card.w/2,card.y+52);ctx.font="bold 14px system-ui";ctx.fillStyle="#fff";var ny=wrapTextH(up.name,card.x+card.w/2,card.y+74,card.w-18,16);ctx.fillStyle=up.color;ctx.font="bold 12px system-ui";ctx.fillText((up.rarityName||"").toUpperCase(),card.x+card.w/2,ny+18);ctx.fillStyle="#cfd8dc";ctx.font="12px system-ui";wrapText(up.desc,card.x+card.w/2,ny+38,card.w-16,16);}
    var tr=up.trade,ty=card.stacked?card.y+card.h-16:card.y+card.h-28,t,tw=0,parts=[];ctx.font="11px system-ui";ctx.textAlign="left";
    for(t=0;t<tr.length;t++){parts[t]=tr[t].s+(t<tr.length-1?"  ":"");tw+=ctx.measureText(parts[t]).width;}
    var tx=card.stacked?card.x+64:(card.x+card.w/2-tw/2);
    for(t=0;t<tr.length;t++){ctx.fillStyle=tr[t].c;ctx.fillText(parts[t],tx,ty);tx+=ctx.measureText(parts[t]).width;}
  }
  var rb=game.rerollBtn;if(rb){var on=(game.rerollLeft||0)>0;ctx.fillStyle=on?"#3e2723":"#2a2a2a";ctx.strokeStyle=on?"#ffb74d":"#555";ctx.lineWidth=2;roundRect(ctx,rb.x,rb.y,rb.w,rb.h,10);ctx.fill();ctx.stroke();ctx.fillStyle=on?"#ffe082":"#888";ctx.font="bold 15px system-ui";ctx.textAlign="center";ctx.fillText(on?"🎲  Cambiar cartas  (1)":"Sin más cambios",rb.x+rb.w/2,rb.y+rb.h/2+5);}
  ctx.textAlign="left";
}
function wrapText(text,x,y,max,lh){return wrapTextH(text,x,y,max,lh);}
function wrapTextH(text,x,y,max,lh){var words=String(text).split(" "),line="",i;ctx.textAlign="center";for(i=0;i<words.length;i++){var t=line+words[i]+" ";if(ctx.measureText(t).width>max&&line){ctx.fillText(line,x,y);y+=lh;line=words[i]+" ";}else line=t;}ctx.fillText(line,x,y);return y;}
function drawEndScreen(won){ctx.fillStyle="rgba(0,0,0,0.78)";ctx.fillRect(0,0,SW,SH);ctx.textAlign="center";var cx=SW/2,top=layout.isPortrait?layout.gameY+layout.gameDrawH*0.32:SH*0.26;ctx.fillStyle=won?"#2ecc71":"#e74c3c";ctx.font="bold 32px system-ui";ctx.fillText(won?"¡VICTORIA!":"HAS MUERTO",cx,top);ctx.fillStyle="#ecf0f1";ctx.font="15px system-ui";ctx.fillText("Puntos "+game.score+" · Bajas "+game.kills,cx,top+34);ctx.fillText("Ronda "+(game.wave+1)+"/10 · Nv "+game.player.runLevel,cx,top+56);ctx.fillStyle="#ffc107";ctx.fillText("Cuenta Nv "+account.level,cx,top+78);layoutMenuButtons();for(var i=0;i<menuBtns.length;i++)drawUIButton(menuBtns[i],"#3498db");}
function drawCountdownOverlay(){
  var n=Math.max(1,Math.ceil(game.countdown||0));
  ctx.fillStyle="rgba(0,0,0,0.38)";ctx.fillRect(0,0,SW,SH);
  ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.font="bold 22px system-ui";ctx.strokeStyle="rgba(0,0,0,0.75)";ctx.lineWidth=5;
  var msg="RONDA "+(game.wave+1)+" - ¡EMPIEZA LA RONDA!";
  ctx.strokeText(msg,SW/2,SH*0.32);ctx.fillStyle="#ffecb3";ctx.fillText(msg,SW/2,SH*0.32);
  ctx.font="bold 84px system-ui";ctx.lineWidth=10;ctx.strokeText(String(n),SW/2,SH*0.5);ctx.fillStyle="#ffc107";ctx.fillText(String(n),SW/2,SH*0.5);
  ctx.textBaseline="alphabetic";ctx.textAlign="left";
}
function drawMashButton(){
  var b=getMashBtn(),p=game.player,need=(game.boss&&game.boss.mashNeed)||8;
  var prog=clamp((p.mashCount||0)/need,0,1);
  if(game.boss&&game.boss.grabMax)prog=Math.max(prog,1-clamp((game.boss.grabT||0)/game.boss.grabMax,0,1)*0.0);
  var pop=1+0.18*(p.mashPop||0), pulse=1+Math.sin((game.time||0)*10)*0.03;
  ctx.save();ctx.translate(b.x+b.w/2,b.y+b.h/2);ctx.scale(pop*pulse,pop*pulse);
  ctx.translate(-(b.x+b.w/2),-(b.y+b.h/2));
  ctx.fillStyle="rgba(0,0,0,0.45)";roundRect(ctx,b.x-6,b.y-6,b.w+12,b.h+12,20);ctx.fill();
  var g=ctx.createLinearGradient(b.x,b.y,b.x,b.y+b.h);
  g.addColorStop(0,"#ff5252");g.addColorStop(1,"#b71c1c");
  ctx.fillStyle=g;roundRect(ctx,b.x,b.y,b.w,b.h,18);ctx.fill();
  ctx.strokeStyle="#ffe082";ctx.lineWidth=4;roundRect(ctx,b.x,b.y,b.w,b.h,18);ctx.stroke();
  ctx.textAlign="center";ctx.font="bold 28px system-ui";
  ctx.strokeStyle="rgba(0,0,0,0.7)";ctx.lineWidth=6;ctx.strokeText("¡PULSA!",b.x+b.w/2,b.y+42);
  ctx.fillStyle="#fff";ctx.fillText("¡PULSA!",b.x+b.w/2,b.y+42);
  var bx=b.x+18,by=b.y+b.h-28,bw=b.w-36,bh=14;
  ctx.fillStyle="rgba(0,0,0,0.45)";roundRect(ctx,bx,by,bw,bh,7);ctx.fill();
  ctx.fillStyle="#ffe082";roundRect(ctx,bx,by,Math.max(6,bw*prog),bh,7);ctx.fill();
  ctx.strokeStyle="#1a140c";ctx.lineWidth=2;roundRect(ctx,bx,by,bw,bh,7);ctx.stroke();
  ctx.restore();ctx.textAlign="left";
}
function drawBossIntroUI(){
  var b=game.boss,t=b?b.introT:0,h=SH*0.18;
  var a=t>3.8?clamp((4.2-t)/0.4,0,1):t<0.8?clamp(t/0.8,0,1):1;
  ctx.fillStyle="rgba(0,0,0,"+(0.92*a)+")";ctx.fillRect(0,0,SW,h);ctx.fillRect(0,SH-h,SW,h);
  ctx.save();ctx.globalAlpha=a;ctx.textAlign="center";
  var punch=1;
  if(t<=3.7&&t>3.15)punch=2.35-1.35*((3.7-t)/0.55);
  else if(t>3.7)punch=0.6;
  var nameY=h*0.42;
  ctx.save();ctx.translate(SW/2,nameY);ctx.scale(punch,punch);
  ctx.font="bold 34px system-ui";
  ctx.strokeStyle="rgba(0,0,0,0.85)";ctx.lineWidth=6;ctx.strokeText((b&&b.bName)||"JEFE",0,0);
  ctx.fillStyle="#ff1744";ctx.fillText((b&&b.bName)||"JEFE",0,0);
  ctx.restore();
  var line=(b&&(b.bubbleFull||b.bubbleText))||"";
  var tag=b&&b.isHome?"No hay escapatoria.":b&&b.isColossus?"El suelo tiembla.":b&&b.isBoss?"Este es el final.":"";
  ctx.fillStyle="#ffe082";ctx.font="16px system-ui";
  ctx.strokeStyle="rgba(0,0,0,0.7)";ctx.lineWidth=4;
  if(line){ctx.strokeText(line,SW/2,nameY+28);ctx.fillText(line,SW/2,nameY+28);}
  if(tag){ctx.fillStyle="#ef9a9a";ctx.font="italic 14px system-ui";ctx.fillText(tag,SW/2,nameY+48);}
  ctx.restore();ctx.textAlign="left";
}
function drawBossMenace(){
  var b=game.boss,intro=game.state==="boss_intro",fight=game.bossFight&&b&&!b.dead&&!b.dying;
  if(!(intro||fight)||!b)return;
  var sc=layout.scale,s=toScreen(b.x,b.y),a=1,t=b.introT||0;
  if(intro)a=t>3.8?clamp((4.2-t)/0.4,0,1):t<0.8?clamp(t/0.8,0,1):1;
  /* dark vignette + fight tint (readable) */
  var g=ctx.createRadialGradient(SW/2,SH/2,Math.min(SW,SH)*0.28,SW/2,SH/2,Math.max(SW,SH)*0.78);
  g.addColorStop(0,"rgba(0,0,0,0)");
  g.addColorStop(1,b.isHome?"rgba(40,0,0,"+(0.42*a)+")":b.isColossus?"rgba(30,8,4,"+(0.34*a)+")":"rgba(10,0,16,"+(0.4*a)+")");
  ctx.fillStyle=g;ctx.fillRect(0,0,SW,SH);
  ctx.fillStyle=b.isHome?(b.p2?"rgba(80,0,10,0.12)":"rgba(70,8,12,0.08)"):b.isColossus?"rgba(60,20,10,0.07)":"rgba(20,0,30,0.09)";
  ctx.globalAlpha=a;ctx.fillRect(0,0,SW,SH);ctx.globalAlpha=1;
  /* Homelander looming shadow during intro, flickering aura, heat haze */
  if(b.isHome){
    if(intro&&t>1){
      var loom=0.6+1.4*clamp((t-1)/3,0,1);
      ctx.save();ctx.fillStyle="rgba(0,0,0,"+(0.32*a)+")";
      ctx.beginPath();ctx.ellipse(s.x,s.y+8*sc,70*sc*loom,22*sc*loom,0,0,7);ctx.fill();
      ctx.restore();
    }
    var flick=0.18+0.16*Math.abs(Math.sin((game.time||0)*11));
    if(b.p2)flick+=0.08;
    var ag=ctx.createRadialGradient(s.x,s.y-18*sc,8*sc,s.x,s.y-10*sc,70*sc);
    ag.addColorStop(0,"rgba(200,16,16,"+flick+")");
    ag.addColorStop(1,"rgba(80,0,0,0)");
    ctx.fillStyle=ag;ctx.beginPath();ctx.arc(s.x,s.y-16*sc,70*sc,0,7);ctx.fill();
    /* heat haze bands */
    ctx.save();ctx.globalAlpha=0.07+0.03*Math.sin((game.time||0)*7);
    var hi,hy;
    for(hi=0;hi<8;hi++){
      hy=s.y-10*sc-hi*10*sc+Math.sin((game.time||0)*6+hi)*4*sc;
      ctx.strokeStyle="rgba(255,180,140,0.9)";ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(s.x-50*sc,hy);
      ctx.quadraticCurveTo(s.x+Math.sin((game.time||0)*5+hi)*10*sc,hy-6*sc,s.x+50*sc,hy);
      ctx.stroke();
    }
    ctx.restore();
  }
  if(b.isColossus&&(b.eyeFlash||0)>0){
    ctx.save();ctx.globalAlpha=Math.min(1,b.eyeFlash*2);
    ctx.fillStyle="rgba(255,40,20,0.18)";ctx.fillRect(0,0,SW,SH);
    ctx.restore();
  }
}
function drawVignette(){var g=ctx.createRadialGradient(SW/2,SH/2,Math.min(SW,SH)*0.35,SW/2,SH/2,Math.max(SW,SH)*0.72);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,0.16)");ctx.fillStyle=g;ctx.fillRect(0,0,SW,SH);}
function drawZoneTint(){
  var p=game&&game.player,z=p?zoneAt(p.x,p.y):null;
  if(z&&z.tint){ctx.fillStyle=z.tint;ctx.fillRect(0,0,SW,SH);}
}
function draw(){
  ctx.clearRect(0,0,SW,SH);
  ctx.fillStyle="#102014";ctx.fillRect(0,0,SW,SH);
  if(layout&&layout.isPortrait&&typeof drawRotateOverlay==="function"){drawRotateOverlay();return;}
  if(!game)return;
  if(game.state==="title"){drawTitle();if(typeof titleSplash!=="undefined"&&titleSplash)drawTitleSplash();return;}
  if(game.state==="select"){drawSelect();drawVignette();return;}
  if(game.state==="settings"){drawSettings();return;}
  if(game.state==="howto"){drawHowTo();return;}
  drawWorld();
  if(typeof drawTruenoLaser==="function")drawTruenoLaser();
  if(typeof drawSuperAim==="function")drawSuperAim();
  if(typeof drawExtraAbilities==="function")drawExtraAbilities();
  drawZoneTint();if(typeof drawLighting==="function")drawLighting();drawVignette();
  if(typeof drawBossMenace==="function")drawBossMenace();
  if(game.state==="countdown")drawCountdownOverlay();
  if(game.state==="boss_intro"){drawBossIntroUI();return;}
  if(game.state!=="upgrade")drawHUD();
  if(game.state==="pause")drawPauseUI();
  if(game.state==="upgrade")drawUpgradeUI();
  if(game.state==="dead")drawEndScreen(0);
  if(game.state==="victory")drawEndScreen(1);
}
function frame(now){
  var t=now||Date.now(),dt=Math.min(0.033,(t-last)/1000);last=t;
  if(skipDtClamp){dt=0.016;skipDtClamp=0;}
  if(typeof gfxTick==="function")gfxTick(dt);
  if(typeof gfxHitStopTick==="function")gfxHitStopTick(dt);
  else if(game){if(game.hitStop>0){game.hitStop=Math.max(0,game.hitStop-dt);if(game.hitStop<=0)game.timeScale=1;}else game.timeScale=1;}
  if(layout&&layout.isPortrait){
    if(game)game.menuT=(game.menuT||0)+dt;
    try{draw();}catch(e){showBootError(e);}
    requestAnimationFrame(frame);return;
  }
  var gdt=dt*((game&&game.timeScale)||1);
  try{update(gdt);draw();}catch(e){showBootError(e);}
  requestAnimationFrame(frame);
}
var booted=0;
function boot(){
  if(booted)return;booted=1;
  try{
    if(typeof gfxInit==="function")gfxInit();
    canvas=document.getElementById("gameCanvas");
    loadAccount();loadHeroChoice();loadAudioSettings();resize();initInput();
    game=createTitleState();layoutMenuButtons();
    if(typeof gfxLoad==="function")gfxLoad(function(){try{draw();}catch(e){}});
    if(typeof artLoad==="function")artLoad(function(){try{draw();}catch(e){}});
    try{draw();}catch(e){showBootError(e);}
    last=(typeof performance!=="undefined"&&performance.now)?performance.now():Date.now();
    requestAnimationFrame(frame);
    var tries=0,bt=setInterval(function(){tries++;resize();if(tries>=20)clearInterval(bt);},100);
  }catch(err){showBootError(err);}
}
window.__startGame=startGame;window.__game=function(){return game;};window.__layout=function(){return layout;};
window.__beginCombat=beginCombat;window.__ensureAudio=ensureAudio;
window.__forceColossus=function(){if(!game||game.state==="title"||game.state==="settings"||game.state==="howto"||game.state==="select")startGame();startWave(2);};
window.__forceHome=function(){if(!game||game.state==="title"||game.state==="settings"||game.state==="howto"||game.state==="select")startGame();startWave(5);};
window.__forceGrab=function(){var z=game&&game.boss;if(!z||!z.isHome)return;z.phase="fight";z.windup="grab";z.windupT=0.9;z.grabDash=0;z.grabT=0;z.stun=0;z.tx=game.player.x;z.ty=game.player.y;z.aimAng=Math.atan2(game.player.y-z.y,game.player.x-z.x);};
window.__forceLaser=function(k){var z=game&&game.boss;if(!z||!z.isHome)return;k=k||"sweep";z.phase="fight";z.windup=k;z.windupT=0.75;z.stun=0;var ang=Math.atan2(game.player.y-z.y,game.player.x-z.x);game.lasers=[];if(k==="sweep")addLaser(z.x,z.y,ang-0.4,460,z.windupT,0,1);else if(k==="burst"){addLaser(z.x,z.y,ang,420,z.windupT,0,1);addLaser(z.x,z.y,ang+0.18,420,z.windupT,0,1);}else if(k==="cross"){for(var i=0;i<4;i++)addLaser(z.x,z.y,i*1.57,440,z.windupT,0,1);}else addLaser(z.x,z.y,0,400,z.windupT,0,1);};
window.__teleport=function(x,y){if(game&&game.player){game.player.x=x;game.player.y=y;game.camX=x;game.camY=y;}};
window.__selectScreen=function(){if(!game)game=createTitleState();game.state="select";game.selectIdx=Math.max(0,HEROES.findIndex(function(h){return h.id===selectedHero;}));if(game.selectIdx<0)game.selectIdx=0;layoutSelect();layoutMenuButtons();};
window.__setHero=function(id){selectedHero=id||"classic";saveHeroChoice();if(game&&game.player)applyHero(game.player,selectedHero);};
window.__zoneCam=function(id){var v=map.view&&map.view[id];if(v&&game){game.player.x=v.x;game.player.y=v.y;game.camX=v.x;game.camY=v.y;}};
window.__lineup=function(){if(!game)return;var p=game.player,types=["normal","fast","tank","spitter","exploder","crawler","jumper","armored","screamer","splitter"],i,g=game;g.lineup=1;g.zombies=[];g.spawnQueue=["hold"];g.graceT=999;g.state="playing";g.particles.length=0;g.floatTexts.length=0;p.fireTimer=999;p.invuln=10;var spot=null,x,y;for(y=220;y<1100&&!spot;y+=70)for(x=220;x<1100;x+=70)if(!overlapsAny(x,y,320,200,10)){spot={x:x+50,y:y+90};break;}if(!spot)spot={x:700,y:500};p.x=spot.x;p.y=spot.y;g.camX=p.x+80;g.camY=p.y-24;p.aimAng=0.35;p.weapon="pistol";p.anim=1;p.muzzle=0;p.vx=0;p.vy=0;p.spawnT=0;
for(i=0;i<types.length;i++){var z=spawnZombie(types[i],p.x-20+(i%5)*48,p.y-86+((i/5)|0)*50,0);z.aimAng=0.35;z.anim=1;z.hitFlash=0;z.spawnT=0;g.zombies.push(z);}
var c=spawnColossus(p.x+130,p.y-20);c.phase="fight";c.introT=0;c.aimAng=0.4;c.anim=1;c.hitFlash=0;c.bubbleText="";c.spawnT=0;g.zombies.push(c);g.colossus=c;
var hm=spawnHome(p.x+195,p.y-40);hm.phase="fight";hm.introT=0;hm.aimAng=0.4;hm.anim=1;hm.spawnT=0;g.zombies.push(hm);
};
document.addEventListener("DOMContentLoaded",boot);if(document.readyState!=="loading")boot();
