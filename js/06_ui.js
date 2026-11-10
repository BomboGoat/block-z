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
  var two=wpn==="shotgun"||wpn==="smg"||wpn==="pistol";
  if(p.fireAura){var s=toScreen(p.x,p.y);ctx.fillStyle="rgba(255,87,34,0.18)";fillEllipse(ctx,s.x,s.y,50*layout.scale,36*layout.scale);}
  if(p.hasOrbit){for(var i=0;i<3;i++){var a=p.orbitAngle+i*2.094,ox=p.x+Math.cos(a)*36,oy=p.y+Math.sin(a)*36,os=toScreen(ox,oy);ctx.fillStyle="#eceff1";ctx.beginPath();ctx.arc(os.x,os.y,4*layout.scale,0,7);ctx.fill();}}
  drawChar34(p.x,p.y,p.look,p.aimAng,p.anim,{h:40,r:p.r,scale:p.scale||1,moving:Math.abs(p.vx)+Math.abs(p.vy)>20,wpn:wpn,aim:p.aimAng,twoHand:two,muzzle:p.muzzle,flash:p.flash>0,lift:p.grabbed?26:0});
  if(p.hasShield&&p.shieldReady){var s2=toScreen(p.x,p.y);ctx.strokeStyle="rgba(33,150,243,0.7)";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(s2.x,s2.y,22*layout.scale,16*layout.scale,0,0,7);ctx.stroke();}
  ctx.globalAlpha=1;
}
function drawZ(z){
  if(z.dying)ctx.globalAlpha=clamp(z.deathT*2,0,1);
  var look=z.look||makeZombieLook(z.type,1);
  var opts={h:z.h,r:z.r,moving:z.isHome?0:1,flash:z.hitFlash>0,hpBar:(!game.lineup&&(z.isBoss||z.type==="tank"||z.type==="armored")&&!z.bName)?z.hp/z.maxHp:0};
  if(z.leapT>0)opts.air=1;
  if(z.isHome&&(z.windup||z.grabDash>0||z.grabT>0))opts.eyeGlow=1;
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
  if(game.state==="playing"||game.state==="countdown"||game.state==="boss_intro"){drawJoystick();drawSuperBtn();}
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
  ctx.save();ctx.globalAlpha=input.joy?0.7:0.4;
  ctx.shadowColor="rgba(80,180,255,0.55)";ctx.shadowBlur=input.joy?16:8;
  ctx.strokeStyle="#e3f2fd";ctx.lineWidth=4;ctx.beginPath();ctx.arc(ox,oy,rad,0,7);ctx.stroke();
  ctx.shadowBlur=0;ctx.fillStyle="rgba(20,30,50,0.35)";ctx.beginPath();ctx.arc(ox,oy,rad,0,7);ctx.fill();
  ctx.shadowColor="rgba(255,255,255,0.5)";ctx.shadowBlur=10;
  ctx.fillStyle="#f5f5f5";ctx.beginPath();ctx.arc(ox+input.jx*rad*0.62,oy+input.jy*rad*0.62,20,0,7);ctx.fill();
  ctx.strokeStyle="#1a140c";ctx.lineWidth=2;ctx.stroke();
  ctx.restore();
}
function drawSuperBtn(){
  var b=getSuperBtn(),p=game.player,ch=clamp((p.super||0)/CFG.SUPER_COST,0,1),cx=b.x+b.w/2,cy=b.y+b.h/2,R=b.w/2;
  ctx.save();
  if(ch>=1){ctx.shadowColor="#ffc107";ctx.shadowBlur=18;}
  ctx.fillStyle="rgba(20,16,12,0.7)";ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fill();
  ctx.strokeStyle="#1a140c";ctx.lineWidth=3;ctx.stroke();
  ctx.shadowBlur=0;
  ctx.strokeStyle="#ffe082";ctx.lineWidth=5;
  ctx.beginPath();ctx.arc(cx,cy,R-4,-Math.PI/2,-Math.PI/2+ch*Math.PI*2);ctx.stroke();
  ctx.fillStyle=ch>=1?"#fff8e1":"#cfd8dc";ctx.font="bold "+Math.max(18,(b.w*0.3)|0)+"px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillText(p.hasDash||p.doubleJump?"💨":"💣",cx,cy);
  ctx.restore();ctx.textAlign="left";ctx.textBaseline="alphabetic";
}
function drawUIButton(b,fill){ctx.fillStyle=fill||"#2ecc71";roundRect(ctx,b.x,b.y,b.w,b.h,14);ctx.fill();ctx.strokeStyle="#1a140c";ctx.lineWidth=3;roundRect(ctx,b.x,b.y,b.w,b.h,14);ctx.stroke();ctx.strokeStyle="rgba(255,255,255,0.25)";ctx.lineWidth=1.5;roundRect(ctx,b.x+3,b.y+3,b.w-6,b.h-6,11);ctx.stroke();ctx.fillStyle="#0a0a12";ctx.font="bold 18px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(b.label,b.x+b.w/2,b.y+b.h/2+1);ctx.textBaseline="alphabetic";ctx.textAlign="left";}
function drawLogo(cx,y,scale){
  ctx.save();ctx.translate(cx,y);ctx.scale(scale||1,scale||1);
  ctx.font="bold 44px system-ui";ctx.textAlign="center";ctx.lineJoin="round";
  ctx.strokeStyle="#1a140c";ctx.lineWidth=8;ctx.strokeText("BLOCK Z",0,0);
  ctx.fillStyle="#ffd54f";ctx.fillText("BLOCK Z",0,0);
  ctx.restore();
}
function barStat(x,y,w,v,col){ctx.fillStyle="rgba(0,0,0,0.4)";roundRect(ctx,x,y,w,7,3);ctx.fill();ctx.fillStyle=col;roundRect(ctx,x,y,w*clamp(v/140,0,1),7,3);ctx.fill();ctx.strokeStyle="#1a140c";ctx.lineWidth=1;roundRect(ctx,x,y,w,7,3);ctx.stroke();}
function drawSelect(){
  var hasArt=typeof drawMenuArt==="function"&&drawMenuArt();
  if(!hasArt)drawWorld();
  ctx.fillStyle=hasArt?"rgba(12,3,3,0.42)":"rgba(0,0,0,0.55)";ctx.fillRect(0,0,SW,SH);
  layoutSelect();layoutMenuButtons();
  ctx.textAlign="center";strokeText("Elige personaje",SW/2,layout.safe.t+36,"#ffd54f",layout.isPortrait?22:26);
  if(layout.isPortrait){ctx.fillStyle="#cfd8dc";ctx.font="12px system-ui";ctx.fillText("Desliza para ver más",SW/2,layout.safe.t+56);}
  var cards=game.selectCards||[],i,c,h,sel;
  for(i=0;i<cards.length;i++){
    c=cards[i];h=c.hero;sel=(h.id===selectedHero)||(c.idx===(game.selectIdx||0));
    ctx.fillStyle="#14141e";roundRect(ctx,c.x,c.y,c.w,c.h,14);ctx.fill();
    ctx.strokeStyle=sel?h.col:"#1a140c";ctx.lineWidth=sel?4:2;roundRect(ctx,c.x,c.y,c.w,c.h,14);ctx.stroke();
    if(sel){ctx.strokeStyle="rgba(255,255,255,0.25)";ctx.lineWidth=1.4;roundRect(ctx,c.x+3,c.y+3,c.w-6,c.h-6,11);ctx.stroke();}
    var look=makeHeroLook(h.id),spr=getCharSpr(look,2,1,{}),fh=layout.isPortrait?122:110;
    var sc=Math.min(c.w*1.25,(c.h-fh)*1.38)/SPR_H,px=c.x+c.w/2,py=c.y+c.h-fh-SPR_H*sc+26;
    ctx.save();roundRect(ctx,c.x+2,c.y+2,c.w-4,c.h-fh,12);ctx.clip();
    ctx.drawImage(spr.c,px-SPR_W*sc/2,py,SPR_W*sc,SPR_H*sc);
    ctx.restore();
    var gy=c.y+c.h-fh;
    ctx.fillStyle="#14141e";ctx.beginPath();ctx.moveTo(c.x+2,gy);ctx.lineTo(c.x+c.w-2,gy);ctx.lineTo(c.x+c.w-2,c.y+c.h-14);ctx.quadraticCurveTo(c.x+c.w-2,c.y+c.h-2,c.x+c.w-14,c.y+c.h-2);ctx.lineTo(c.x+14,c.y+c.h-2);ctx.quadraticCurveTo(c.x+2,c.y+c.h-2,c.x+2,c.y+c.h-14);ctx.closePath();ctx.fill();
    ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="bold 15px system-ui";ctx.fillText(h.name,px,gy+14);
    ctx.fillStyle=h.col;ctx.font="10px system-ui";ctx.fillText(h.wpn,px,gy+26);
    ctx.fillStyle="#cfd8dc";ctx.font="9px system-ui";
    var dy=gy+40,words=String(h.desc).split(" "),line="",wi,lines=0;
    for(wi=0;wi<words.length;wi++){var tt=line+words[wi]+" ";if(ctx.measureText(tt).width>c.w-16&&line){ctx.fillText(line,px,dy);dy+=12;line=words[wi]+" ";lines++;if(lines>=1){var rest=words.slice(wi).join(" ");if(ctx.measureText(rest).width>c.w-16){while(rest.length>1&&ctx.measureText(rest+"…").width>c.w-16)rest=rest.slice(0,-1);rest+="…";}ctx.fillText(rest,px,dy);dy+=12;line="";break;}}else line=tt;}
    if(line){ctx.fillText(line,px,dy);dy+=12;}
    var bx=c.x+10,bw=c.w-20,by=gy+72;
    ctx.textAlign="left";ctx.fillStyle="#eee";ctx.font="9px system-ui";
    ctx.fillText("HP",bx,by+6);barStat(bx+24,by,bw-24,h.hp,"#e53935");
    ctx.fillText("VEL",bx,by+18);barStat(bx+24,by+12,bw-24,h.spd,"#42a5f5");
    ctx.fillText("DMG",bx,by+30);barStat(bx+24,by+24,bw-24,h.dmg,"#ffb300");
  }
  for(i=0;i<menuBtns.length;i++)drawUIButton(menuBtns[i],menuBtns[i].id==="start"?"#2ecc71":"#95a5a6");
  ctx.textAlign="left";
}
function drawTitle(){
  var hasArt=typeof drawMenuArt==="function"&&drawMenuArt();
  if(!hasArt){drawWorld();ctx.fillStyle="rgba(0,0,0,0.38)";ctx.fillRect(0,0,SW,SH);}
  var cx=SW/2,top=layout.isPortrait?layout.safe.t+20:SH*0.06;
  if(!hasArt)drawLogo(cx,layout.isPortrait?layout.safe.t+54:SH*0.12,layout.isPortrait?0.85:1.05);
  ctx.textAlign="center";
  ctx.fillStyle="#ffecb3";ctx.font="bold 13px system-ui";
  ctx.strokeStyle="rgba(0,0,0,0.7)";ctx.lineWidth=4;ctx.lineJoin="round";
  var sub="Sobrevive · Mejora · Derrota a los jefes";
  var sy=hasArt?(layout.isPortrait?SH*0.46:SH*0.42):top+(layout.isPortrait?40:48);
  if(!hasArt){ctx.fillStyle="#cfd8dc";ctx.font="13px system-ui";}
  ctx.strokeText(sub,cx,sy);ctx.fillText(sub,cx,sy);
  ctx.fillStyle="#ffc107";ctx.font="bold 13px system-ui";
  ctx.strokeText("Nivel "+account.level+"  ·  XP "+account.xp+"/"+account.xpToNext,cx,sy+20);
  ctx.fillText("Nivel "+account.level+"  ·  XP "+account.xp+"/"+account.xpToNext,cx,sy+20);
  layoutMenuButtons();for(var i=0;i<menuBtns.length;i++)drawUIButton(menuBtns[i],i===0?"#e65100":i===1?"#c62818":"#5d4037");
  ctx.textAlign="left";
}
function drawSettings(){ctx.fillStyle="rgba(0,0,0,0.82)";ctx.fillRect(0,0,SW,SH);ctx.textAlign="center";ctx.fillStyle="#ffc107";ctx.font="bold 22px system-ui";ctx.fillText("Ajustes",SW/2,layout.safe.t+56);layoutMenuButtons();for(var i=0;i<settingsBtns.length;i++)drawUIButton(settingsBtns[i],settingsBtns[i].id==="back"?"#95a5a6":"#5c6bc0");}
function drawHowTo(){
  ctx.fillStyle="rgba(0,0,0,0.84)";ctx.fillRect(0,0,SW,SH);
  ctx.textAlign="center";ctx.fillStyle="#ffc107";ctx.font="bold 22px system-ui";ctx.fillText("Cómo jugar",SW/2,layout.safe.t+50);
  ctx.fillStyle="#ecf0f1";ctx.font="13px system-ui";ctx.textAlign="left";
  var lines=["• Joystick izquierdo (donde pongas el pulgar)","• Elige personaje antes de jugar","• Atacas al enemigo más cercano","• Super (derecha): habilidad única","• El dash sigue el joystick de movimiento","• Arbustos: te esconden","• Jefes en las rondas 3, 6 y 10"];
  var y=layout.safe.t+90;for(var i=0;i<lines.length;i++){ctx.fillText(lines[i],24+layout.safe.l,y);y+=24;}
  layoutMenuButtons();if(howToBack)drawUIButton(howToBack,"#95a5a6");
}
function drawPauseUI(){ctx.fillStyle="rgba(0,0,0,0.78)";ctx.fillRect(0,0,SW,SH);ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="bold 24px system-ui";ctx.fillText("Pausa",SW/2,layout.safe.t+36);layoutMenuButtons();for(var i=0;i<pauseBtns.length;i++){var col=pauseBtns[i].id==="continuar"?"#2ecc71":pauseBtns[i].id==="menu"?"#e67e22":"#5c6bc0";drawUIButton(pauseBtns[i],col);}}
function drawUpgradeUI(){ctx.fillStyle="rgba(0,0,0,0.78)";ctx.fillRect(0,0,SW,SH);ctx.textAlign="center";ctx.fillStyle="#ffc107";ctx.font=layout.isPortrait?"bold 16px system-ui":"bold 22px system-ui";var titleY=game.upgradeCards[0]?Math.max(28,game.upgradeCards[0].y-16):40;ctx.fillText("¡Ronda superada! Elige una mejora",SW/2,titleY);
  for(var i=0;i<game.upgradeCards.length;i++){var card=game.upgradeCards[i],up=card.upgrade;if(up.rarity>=4){ctx.shadowColor=up.glow;ctx.shadowBlur=16;}ctx.fillStyle="#14141e";ctx.strokeStyle=up.frame;ctx.lineWidth=3;roundRect(ctx,card.x,card.y,card.w,card.h,10);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=up.color;ctx.fillRect(card.x+3,card.y+3,card.stacked?52:card.w-6,card.stacked?card.h-6:22);
    ctx.fillStyle="#fff";ctx.font=card.stacked?"bold 16px system-ui":"bold 18px system-ui";ctx.textAlign=card.stacked?"left":"center";
    if(card.stacked){ctx.fillText(up.icon+"  "+up.name,card.x+64,card.y+28);ctx.font="11px system-ui";ctx.fillStyle=up.color;ctx.fillText(up.rarityName,card.x+64,card.y+46);ctx.fillStyle="#cfd8dc";ctx.font="12px system-ui";ctx.fillText(up.desc,card.x+64,card.y+66);}
    else{ctx.textAlign="center";ctx.fillText(up.icon,card.x+card.w/2,card.y+58);ctx.font="bold 16px system-ui";ctx.fillText(up.name,card.x+card.w/2,card.y+84);ctx.fillStyle=up.color;ctx.font="11px system-ui";ctx.fillText(up.rarityName,card.x+card.w/2,card.y+104);ctx.fillStyle="#cfd8dc";ctx.font="12px system-ui";wrapText(up.desc,card.x+card.w/2,card.y+128,card.w-16,16);}
    var tr=up.trade,ty=card.stacked?card.y+card.h-16:card.y+card.h-28,t,tw=0,parts=[];ctx.font="11px system-ui";ctx.textAlign="left";
    for(t=0;t<tr.length;t++){parts[t]=tr[t].s+(t<tr.length-1?"  ":"");tw+=ctx.measureText(parts[t]).width;}
    var tx=card.stacked?card.x+64:(card.x+card.w/2-tw/2);
    for(t=0;t<tr.length;t++){ctx.fillStyle=tr[t].c;ctx.fillText(parts[t],tx,ty);tx+=ctx.measureText(parts[t]).width;}
  }ctx.textAlign="left";
}
function wrapText(text,x,y,max,lh){var words=String(text).split(" "),line="",i;ctx.textAlign="center";for(i=0;i<words.length;i++){var t=line+words[i]+" ";if(ctx.measureText(t).width>max&&line){ctx.fillText(line,x,y);y+=lh;line=words[i]+" ";}else line=t;}ctx.fillText(line,x,y);}
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
function drawBossIntroUI(){
  var b=game.boss,t=b?b.introT:0,h=SH*0.15;
  var a=t>3.8?clamp((4.2-t)/0.4,0,1):t<0.8?clamp(t/0.8,0,1):1;
  ctx.fillStyle="rgba(0,0,0,"+(0.9*a)+")";ctx.fillRect(0,0,SW,h);ctx.fillRect(0,SH-h,SW,h);
  ctx.save();ctx.globalAlpha=a;ctx.textAlign="center";
  ctx.font="bold 26px system-ui";ctx.fillStyle="#ff1744";ctx.fillText((b&&b.bName)||"JEFE",SW/2,h*0.48);
  ctx.fillStyle="#ffe082";ctx.font="15px system-ui";ctx.fillText((b&&(b.bubbleFull||b.bubbleText))||"",SW/2,h*0.48+22);
  ctx.restore();ctx.textAlign="left";
}
function drawVignette(){var g=ctx.createRadialGradient(SW/2,SH/2,Math.min(SW,SH)*0.35,SW/2,SH/2,Math.max(SW,SH)*0.72);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,0.38)");ctx.fillStyle=g;ctx.fillRect(0,0,SW,SH);}
function drawZoneTint(){
  var p=game&&game.player,z=p?zoneAt(p.x,p.y):null;
  ctx.fillStyle="rgba(255,140,60,0.06)";ctx.fillRect(0,0,SW,SH);
  if(z&&z.tint){ctx.fillStyle=z.tint;ctx.fillRect(0,0,SW,SH);}
}
function draw(){
  ctx.clearRect(0,0,SW,SH);
  ctx.fillStyle="#102014";ctx.fillRect(0,0,SW,SH);
  if(!game)return;
  if(game.state==="title"){drawTitle();drawZoneTint();drawVignette();return;}
  if(game.state==="select"){drawSelect();drawVignette();return;}
  if(game.state==="settings"){drawSettings();return;}
  if(game.state==="howto"){drawHowTo();return;}
  drawWorld();drawZoneTint();if(typeof drawLighting==="function")drawLighting();drawVignette();
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
  if(game&&game.hitStop>0)dt*=0.12;
  try{update(dt);draw();}catch(e){showBootError(e);}
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
window.__lineup=function(){if(!game)return;var p=game.player,types=["normal","fast","tank","spitter","exploder","crawler","jumper","armored","screamer","splitter"],i,g=game;g.lineup=1;g.zombies=[];g.spawnQueue=["hold"];g.graceT=999;g.state="playing";g.particles.length=0;g.floatTexts.length=0;p.fireTimer=999;p.invuln=10;var spot=null,x,y;for(y=220;y<1100&&!spot;y+=70)for(x=220;x<1100;x+=70)if(!overlapsAny(x,y,300,180,10)){spot={x:x+40,y:y+80};break;}if(!spot)spot={x:700,y:500};p.x=spot.x;p.y=spot.y;g.camX=p.x+110;g.camY=p.y+16;layout.viewW=layout.isPortrait?400:700;layout.scale=layout.gameDrawW/layout.viewW;p.aimAng=0.25;p.weapon="pistol";p.anim=1;p.muzzle=0;p.vx=0;p.vy=0;for(i=0;i<types.length;i++){var z=spawnZombie(types[i],p.x+50+(i%5)*58,p.y-8+((i/5)|0)*62,0);z.aimAng=0.25;z.anim=1;z.hitFlash=0;g.zombies.push(z);}var c=spawnColossus(p.x+50+5*58,p.y+8);c.phase="fight";c.introT=0;c.aimAng=Math.PI;c.anim=1;c.hitFlash=0;c.bubbleText="";g.zombies.push(c);g.colossus=c;var hm=spawnHome(p.x+50+4*58,p.y+70);hm.phase="fight";hm.introT=0;hm.aimAng=Math.PI;hm.anim=1;g.zombies.push(hm);var b=spawnZombie("boss",p.x+50+5*58,p.y+70,9);b.isBoss=1;b.aimAng=Math.PI;b.anim=1;g.zombies.push(b);};
document.addEventListener("DOMContentLoaded",boot);if(document.readyState!=="loading")boot();
