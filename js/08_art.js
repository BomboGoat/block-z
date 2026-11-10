/* v19: generated sprites, landscape rotate overlay, extra upgrade VFX */
var ART={ready:0,imgs:{},meta:null,menuWide:null};
var ART_MAP={
  classic:{f:"classic_f",b:"classic_b"},
  trueno:{f:"trueno_f"},
  mr:{f:"mr_f"},
  gompa:{f:"gompa_f"},
  colossus:{f:"colossus_f"},
  home:{f:"home_f"},
  final:{f:"final_f"},
  normal:{f:"z_normal_f"},fast:{f:"z_fast_f"},tank:{f:"z_tank_f"},
  exploder:{f:"z_exploder_f"},crawler:{f:"z_crawler_f"},armored:{f:"z_armored_f"},
  spitter:{f:"z_spitter_f"},jumper:{f:"z_jumper_f"},screamer:{f:"z_screamer_f"},
  splitter:{f:"z_splitter_f"},mini:{f:"z_normal_f"}
};
function artLookKey(look){
  if(!look)return null;
  if(look.kind==="player")return look.hero||"classic";
  if(look.kind==="colossus")return "colossus";
  if(look.kind==="home")return "home";
  if(look.kind==="final"||(look.type==="boss"&&look.final)||look.final)return "final";
  return look.type||null;
}
function artLoad(done){
  var left=2;
  function tick(){if(--left<=0){ART.ready=1;if(done)done();}}
  var mj=new XMLHttpRequest();
  mj.onload=function(){
    try{ART.meta=JSON.parse(mj.responseText);}catch(e){ART.meta={};}
    var keys=Object.keys(ART.meta||{}),i;
    left+=keys.length;
    tick();
    for(i=0;i<keys.length;i++)(function(k){
      var im=new Image();im.onload=function(){ART.imgs[k]=im;tick();};im.onerror=tick;
      im.src=(ART.meta[k]&&ART.meta[k].file)||("assets/spr/"+k+".webp");
    })(keys[i]);
  };
  mj.onerror=tick;mj.open("GET","assets/spr/meta.json?v=19");mj.send();
  var mw=new Image();mw.onload=function(){ART.menuWide=mw;tick();};mw.onerror=tick;mw.src="assets/ui/menu-wide.webp?v=19";
}
function artEntry(look,dir){
  if(!ART.ready||!ART.meta)return null;
  var k=artLookKey(look);if(!k||!ART_MAP[k])return null;
  var away=dir===5||dir===6||dir===7, name=away&&ART_MAP[k].b?ART_MAP[k].b:ART_MAP[k].f;
  var img=ART.imgs[name],meta=ART.meta[name];
  if(!img||!img.width||!meta)return null;
  var fl=(dir<=1||dir===7)?1:(dir>=3&&dir<=5)?-1:1;
  return{img:img,meta:meta,flip:fl<0,key:k};
}
function artTargetH(look,sc){
  var h=28.4*sc; /* ~80px at landscape viewW=300 */
  if(look&&look.kind==="colossus")h*=2.4;
  else if(look&&look.kind==="home")h*=1.85;
  else if(look&&(look.kind==="final"||look.final||(look.type==="boss"&&!look.kind)))h*=2.65;
  else if(look&&(look.type==="tank"||look.type==="armored"))h*=1.25;
  else if(look&&(look.type==="crawler"||look.type==="mini"))h*=0.7;
  else if(look&&look.type==="fast")h*=0.9;
  if(look&&look.kind==="player"&&look.bulk)h*=1.08;
  return h*(look&&(look._artScale||1));
}
function tryDrawArt(wx,wy,look,ang,anim,opts){
  opts=opts||{};
  var dir=angDir(ang||0),e=artEntry(look,dir);
  if(!e)return 0;
  var s=toScreen(wx,wy),sc=layout.scale,m=e.meta;
  var pose=opts.pose||(opts.dying?"die":opts.spawnP!=null?"spawn":opts.flash?"hurt":(opts.muzzle>0||opts.atk)?"atk":opts.moving?"walk":"idle");
  var ph=((anim||0)%1)*Math.PI*2;
  if(pose==="walk")ph=anim*3.4;
  var bob=0,tilt=0,sx=1,sy=1;
  if(opts.air||(look&&look.kind==="home")){bob=-((look.kind==="home")?16:10)*sc;if(look.kind==="home")bob-=Math.sin((game.time||0)*3.5)*4*sc;}
  else if(pose==="walk"){bob=-Math.abs(Math.sin(ph))*3.2*sc;tilt=Math.sin(ph)*0.06;sx=1+Math.sin(ph*2)*0.04;sy=1-Math.sin(ph*2)*0.04;}
  else if(pose==="idle"){bob=Math.sin((game.time||anim||0)*2)*1.4*sc;sy=1+Math.sin((game.time||0)*2)*0.015;}
  else if(pose==="hurt"){bob=2*sc;tilt=-0.08;}
  else if(pose==="atk"){tilt=0.05;sx=1.04;sy=0.96;}
  var H=artTargetH(look,sc)*(opts.scale||1),W=H*(m.w/m.h);
  var vr=(opts.r||13)*sc,hover=look&&look.kind==="home";
  ctx.fillStyle="rgba(0,0,0,"+(hover?0.3:0.4)+")";
  fillEllipse(ctx,s.x+3,s.y+5,vr*(hover?2.2:1.55),vr*CFG.YSCALE*(hover?1.35:1));
  ctx.save();
  ctx.translate(s.x,s.y+bob-(opts.lift||0)*sc);
  if(opts.dying){var dp=1-(opts.dieP||0);ctx.scale(1+dp*0.15,Math.max(0.22,1-dp*0.72));ctx.rotate(dp*0.5);ctx.globalAlpha=clamp((opts.dieP||0)*1.4,0,1);}
  else if(opts.spawnP!=null){var sp=opts.spawnP||0;ctx.translate(0,(1-sp)*32*sc);ctx.scale(0.85+0.15*sp,0.65+0.35*sp);}
  ctx.rotate(tilt);ctx.scale((e.flip?-1:1)*sx,sy);
  if(opts.flash)ctx.filter="brightness(1.7) saturate(0.55)";
  var fx=m.fx!=null?m.fx:0.5, fy=m.fy!=null?m.fy:1;
  ctx.drawImage(e.img,-W*fx,-H*fy,W,H);
  ctx.filter="none";ctx.restore();ctx.globalAlpha=1;
  /* anchors */
  var hx=(m.hx!=null?m.hx:0.78),hy=(m.hy!=null?m.hy:0.62);
  hx=0.5+(hx-0.5)*0.86; /* pull hand slightly inward to the palm */
  var ax=(hx-fx)*W;if(e.flip)ax=-ax;
  var ay=(hy-fy)*H+bob-(opts.lift||0)*sc;
  opts._hand={x:s.x+ax,y:s.y+ay};
  var ex=(m.ex!=null?m.ex:0.5),ey=(m.ey!=null?m.ey:0.2);
  var e1=(ex-0.06-fx)*W,e2=(ex+0.06-fx)*W,eh=(ey-fy)*H+bob;
  if(e.flip){e1=-e1;e2=-e2;}
  opts._eyes={L:{x:s.x+e1,y:s.y+eh},R:{x:s.x+e2,y:s.y+eh},s:s};
  opts._artH=H;
  if(opts.hpBar){
    var bx=s.x-22*sc,by=s.y-H-8*sc;
    ctx.fillStyle="#2a0000";roundRect(ctx,bx,by,44*sc,5*sc,2);ctx.fill();
    ctx.fillStyle="#e53935";roundRect(ctx,bx,by,44*sc*opts.hpBar,5*sc,2);ctx.fill();
    ctx.strokeStyle="#1a140c";ctx.lineWidth=1;roundRect(ctx,bx,by,44*sc,5*sc,2);ctx.stroke();
  }
  return 1;
}
function artEyes(z){
  if(!z)return null;
  var dummy={};
  if(!tryDrawArt)return null;
  /* compute anchors without drawing: */
  var look=z.look||{},dir=angDir(z.aimAng||0),e=artEntry(look,dir);
  if(!e)return null;
  var s=toScreen(z.x,z.y),sc=layout.scale,m=e.meta,H=artTargetH(look,sc),W=H*(m.w/m.h);
  var fx=m.fx||0.5,fy=m.fy||1,ex=m.ex||0.5,ey=m.ey||0.2;
  var bob=look.kind==="home"?-(16*sc+Math.sin((game.time||0)*3.5)*4*sc):0;
  var e1=(ex-0.07-fx)*W,e2=(ex+0.07-fx)*W,eh=(ey-fy)*H+bob;
  if(e.flip){e1=-e1;e2=-e2;}
  var L={x:s.x+e1,y:s.y+eh},R={x:s.x+e2,y:s.y+eh};
  return{L:L,R:R,m:{x:(L.x+R.x)/2,y:(L.y+R.y)/2}};
}
function drawSelectPortrait(look,x,y,w,h){
  var e=artEntry(look,2);
  if(!e)return 0;
  var m=e.meta,sc=Math.min(w/m.w,(h/m.h)*1.05),dw=m.w*sc,dh=m.h*sc;
  ctx.drawImage(e.img,x+(w-dw)/2,y+h-dh+4,dw,dh);
  return 1;
}
function readSafeInsets(){
  var st=getComputedStyle(document.documentElement);
  function n(v,fb){var x=parseFloat(st.getPropertyValue(v));return isFinite(x)?x:fb;}
  return{l:Math.max(12,n("--sal",0)+6),t:Math.max(8,n("--sat",0)+6),r:Math.max(12,n("--sar",0)+6),b:Math.max(8,n("--sab",0)+6)};
}
function drawRotateOverlay(){
  var has=typeof drawMenuArt==="function"&&drawMenuArt();
  if(!has){ctx.fillStyle="#1a0708";ctx.fillRect(0,0,SW,SH);}
  ctx.fillStyle="rgba(16,4,4,0.55)";ctx.fillRect(0,0,SW,SH);
  var t=(game&&game.menuT)||(Date.now()/1000),cx=SW/2,cy=SH*0.42;
  var k=(Math.sin(t*2)+1)/2; /* 0 portrait -> 1 landscape */
  var ang=-Math.PI/2*k;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(ang);
  var pw=46,ph=78,r=8;
  ctx.fillStyle="#1a1a1a";roundRect(ctx,-pw/2,-ph/2,pw,ph,r);ctx.fill();
  ctx.strokeStyle="#ffcc80";ctx.lineWidth=3;roundRect(ctx,-pw/2,-ph/2,pw,ph,r);ctx.stroke();
  ctx.fillStyle="#3e2723";roundRect(ctx,-pw/2+6,-ph/2+10,pw-12,ph-28,4);ctx.fill();
  ctx.fillStyle="#ffab91";ctx.beginPath();ctx.arc(0,ph/2-8,3,0,7);ctx.fill();
  ctx.restore();
  ctx.textAlign="center";ctx.fillStyle="#ffe082";
  ctx.font="bold 28px system-ui";ctx.strokeStyle="rgba(0,0,0,0.7)";ctx.lineWidth=6;
  ctx.strokeText("Gira el móvil",cx,SH*0.68);
  ctx.fillText("Gira el móvil",cx,SH*0.68);
  ctx.fillStyle="#ffecb3";ctx.font="16px system-ui";
  ctx.fillText("Block Z se juega en horizontal",cx,SH*0.68+28);
  ctx.textAlign="left";
}

/* ===== extra abilities ===== */
function updateExtraAbilities(dt){
  var p=game.player;if(!p||!dt)return;
  p.frenzyT=Math.max(0,(p.frenzyT||0)-dt);
  if(p.poisonCloud){
    p._pcT=(p._pcT||0)-dt;if(p._pcT<=0){p._pcT=0.4;
      for(var i=0;i<game.zombies.length;i++){var z=game.zombies[i];if(!z.dead&&!z.dying&&dist(p.x,p.y,z.x,z.y)<70){z.poison=Math.max(z.poison||0,1.2);z.hp-=5*dt*4;if(z.hp<=0)killZombie(z);}}
    }
  }
  if(p.freezeAura){
    for(var i=0;i<game.zombies.length;i++){var z=game.zombies[i];if(!z.dead&&!z.dying&&dist(p.x,p.y,z.x,z.y)<80)z.slow=Math.max(z.slow||0,0.4);}
  }
  if(p.meteors){
    p._metT=(p._metT||0)-dt;if(p._metT<=0){p._metT=2.8;
      var tgt=findNearestZombie(p,420);if(tgt&&game.meteors)game.meteors.push({x:tgt.x,y:tgt.y,t:0,life:0.7});
    }
  }
  if(game.meteors)for(var i=game.meteors.length-1;i>=0;i--){
    var m=game.meteors[i];m.t+=dt;if(m.t>=m.life){explodeAt(m.x,m.y,48,22*p.damageMul,{friendly:1});game.meteors.splice(i,1);}
  }
  if(p.blackHole){
    p._bhT=(p._bhT||0)-dt;if(p._bhT<=0){p._bhT=7.5;p._bh={x:p.x+Math.cos(p.aimAng)*80,y:p.y+Math.sin(p.aimAng)*80,life:1.6};}
    if(p._bh){p._bh.life-=dt;var b=p._bh;
      for(var i=0;i<game.zombies.length;i++){var z=game.zombies[i];if(z.dead||z.dying)continue;var d=dist(b.x,b.y,z.x,z.y);if(d<110&&d>4){var k=80*dt/d;z.x+=(b.x-z.x)*k;z.y+=(b.y-z.y)*k;if(d<28){z.hp-=16*dt*p.damageMul;if(z.hp<=0)killZombie(z);}}}
      if(b.life<=0)p._bh=null;
    }
  }
  if(p.hasClone){
    if(!p.clone)p.clone={x:p.x-20,y:p.y,anim:0,t:0};
    var c=p.clone,tx=p.x-Math.cos(p.aimAng||0)*26,ty=p.y-Math.sin(p.aimAng||0)*26;
    c.x+=(tx-c.x)*Math.min(1,dt*6);c.y+=(ty-c.y)*Math.min(1,dt*6);c.anim+=dt;c.t-=dt;
    if(c.t<=0){var n=findNearestZombie({x:c.x,y:c.y},260);if(n){var ang=Math.atan2(n.y-c.y,n.x-c.x);game.bullets.push({x:c.x,y:c.y,vx:Math.cos(ang)*420,vy:Math.sin(ang)*420,r:3,damage:7*p.damageMul,life:0.7,pierce:0,hit:new Set(),clone:1});c.t=0.55;}}
  }
  if(p.stormCloud){
    if(!p.cloud)p.cloud={x:p.x,y:p.y-30,t:0};
    p.cloud.x+=(p.x-p.cloud.x)*Math.min(1,dt*3);p.cloud.y+=(p.y-40-p.cloud.y)*Math.min(1,dt*3);
    p.cloud.t-=dt;if(p.cloud.t<=0){p.cloud.t=1.4;var n=findNearestZombie(p,200);if(n){hurtZombie(n,10*p.damageMul,p.x);if(game.bolts)game.bolts.push({pts:[{x:p.cloud.x,y:p.cloud.y},{x:n.x,y:n.y}],life:0.18,maxLife:0.18});}}
  }
  if(p.shieldRegen&&p.hasShield&&!p.shieldReady){p.shieldCd=Math.max(0,(p.shieldCd||0)-dt*0.5);}
  if(p.dashFire&&p.dashT>0){
    p._dfT=(p._dfT||0)-dt;if(p._dfT<=0){p._dfT=0.08;if(!game.fires)game.fires=[];game.fires.push({x:p.x,y:p.y,life:1.6,r:16});if(game.fires.length>18)game.fires.shift();}
  }
  if(game.fires)for(var i=game.fires.length-1;i>=0;i--){
    var f=game.fires[i];f.life-=dt;if(f.life<=0){game.fires.splice(i,1);continue;}
    for(var j=0;j<game.zombies.length;j++){var z=game.zombies[j];if(!z.dead&&!z.dying&&dist(f.x,f.y,z.x,z.y)<f.r+z.r){z.burn=Math.max(z.burn||0,0.6);z.hp-=10*dt;if(z.hp<=0)killZombie(z);}}
  }
}
function drawExtraAbilities(){
  var p=game&&game.player,sc=layout.scale,i,s;
  if(!p)return;
  if(p.poisonCloud){s=toScreen(p.x,p.y);ctx.fillStyle="rgba(120,180,40,0.12)";ctx.beginPath();ctx.ellipse(s.x,s.y,70*sc,70*CFG.YSCALE*sc,0,0,7);ctx.fill();}
  if(p.freezeAura){s=toScreen(p.x,p.y);ctx.strokeStyle="rgba(130,200,255,0.35)";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(s.x,s.y,80*sc,80*CFG.YSCALE*sc,0,0,7);ctx.stroke();}
  if(game.fires)for(i=0;i<game.fires.length;i++){var f=game.fires[i];s=toScreen(f.x,f.y);ctx.globalAlpha=clamp(f.life/1.6,0,1)*0.7;ctx.fillStyle="#ff6d00";fillEllipse(ctx,s.x,s.y,f.r*sc,f.r*0.6*sc);ctx.globalAlpha=1;}
  if(game.meteors)for(i=0;i<game.meteors.length;i++){var m=game.meteors[i],k=m.t/m.life;s=toScreen(m.x,m.y);ctx.fillStyle="rgba(255,80,0,0.25)";fillEllipse(ctx,s.x,s.y,20*sc,12*sc);ctx.fillStyle="#ffe082";fillEllipse(ctx,s.x,s.y-80*(1-k)*sc,7*sc,7*sc);}
  if(p._bh){s=toScreen(p._bh.x,p._bh.y);var a=clamp(p._bh.life/1.6,0,1);ctx.globalAlpha=a*0.85;ctx.fillStyle="#120018";ctx.beginPath();ctx.arc(s.x,s.y,16*sc,0,7);ctx.fill();ctx.strokeStyle="rgba(180,80,255,0.7)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y,22*sc,0,7);ctx.stroke();ctx.globalAlpha=1;}
  if(p.hasClone&&p.clone){drawChar34(p.clone.x,p.clone.y,p.look,p.aimAng,p.clone.anim,{h:36,r:10,scale:0.78*(p.scale||1),moving:1,wpn:p.weapon,aim:p.aimAng});}
  if(p.stormCloud&&p.cloud){s=toScreen(p.cloud.x,p.cloud.y);ctx.fillStyle="rgba(60,80,140,0.8)";fillEllipse(ctx,s.x,s.y,22*sc,12*sc);ctx.fillStyle="rgba(40,50,90,0.7)";fillEllipse(ctx,s.x+8*sc,s.y-4*sc,14*sc,9*sc);}
  if(p.hasDrone){s=toScreen(p.droneX,p.droneY);ctx.fillStyle="#90a4ae";roundRect(ctx,s.x-6*sc,s.y-4*sc,12*sc,8*sc,2);ctx.fill();ctx.fillStyle="#4fc3f7";fillEllipse(ctx,s.x,s.y,3*sc,3*sc);}
}
function onExtraKill(z){
  var p=game&&game.player;if(!p||!z)return;
  if(p.vampKill)p.hp=Math.min(p.maxHp,p.hp+(p.maxHp*0.06));
  if(p.frenzy){p.frenzyT=Math.min(3,(p.frenzyT||0)+0.45);p.frenzyStacks=Math.min(8,(p.frenzyStacks||0)+1);}
  if(p.chainBoom&&!z._chained){z._chained=1;explodeAt(z.x,z.y,42,14*p.damageMul,{friendly:1});}
}
function extraFireCooldown(p,cd){
  if(p.frenzyT>0)cd*=(1-0.04*(p.frenzyStacks||1));
  return cd;
}
function extraCrit(p,z){
  if(p.critBolt&&z){hurtZombie(z,(CFG.BULLET_DAMAGE||8)*0.6*p.damageMul,p.x,1);if(game.bolts)game.bolts.push({pts:[{x:p.x,y:p.y},{x:z.x,y:z.y}],life:0.16,maxLife:0.16});}
}
function maybeKnifeFan(p){
  if(!p.knifeFan)return;
  p._fanN=(p._fanN||0)+1;if(p._fanN%4)return;
  var i,a0=p.aimAng||0;
  for(i=-2;i<=2;i++){var a=a0+i*0.18,b=bulletPool.pop()||{};b.x=p.x;b.y=p.y;b.vx=Math.cos(a)*380;b.vy=Math.sin(a)*380;b.r=3;b.damage=8*p.damageMul;b.life=0.55;b.pierce=0;b.hit=new Set();b.knife=1;game.bullets.push(b);}
}
function maybeShockN(p){
  if(!p.shockN)return;
  p._shN=(p._shN||0)+1;if(p._shN%4)return;
  explodeAt(p.x,p.y,70,18*p.damageMul,{friendly:1});
  if(typeof gfxHitStop==="function")gfxHitStop(0.05,"big");
}

function drawMenuArt(){
  var img=ART.menuWide||(typeof GFX!=="undefined"?GFX.menuBg:null),t=game?game.menuT||0:0;
  ctx.fillStyle="#1a0708";ctx.fillRect(0,0,SW,SH);
  if(!img||!img.width)return 0;
  var iw=img.width,ih=img.height;
  /* cover-fill with a slightly blurred enlargement first, then sharp cover aligned to the top so BLOCK Z stays visible */
  var k0=Math.max(SW/iw,SH/ih)*1.18;
  ctx.save();ctx.filter="blur(18px)";ctx.globalAlpha=0.85;
  ctx.drawImage(img,(SW-iw*k0)/2,(SH-ih*k0)/2,iw*k0,ih*k0);
  ctx.restore();
  var k=Math.max(SW/iw,SH/ih)*(1.0+Math.sin(t*0.2)*0.01);
  var ox=(SW-iw*k)/2+Math.sin(t*0.1)*6, oy=Math.min(0, SH-ih*k); /* pin top */
  ctx.drawImage(img,ox,oy,iw*k,ih*k);
  var grd=ctx.createLinearGradient(SW*0.5,0,SW,0);
  grd.addColorStop(0,"rgba(16,4,4,0)");grd.addColorStop(0.65,"rgba(16,4,4,0.15)");grd.addColorStop(1,"rgba(16,4,4,0.55)");
  ctx.fillStyle=grd;ctx.fillRect(0,0,SW,SH);
  var g2=ctx.createLinearGradient(0,SH*0.55,0,SH);
  g2.addColorStop(0,"rgba(16,4,4,0)");g2.addColorStop(1,"rgba(16,4,4,0.45)");
  ctx.fillStyle=g2;ctx.fillRect(0,0,SW,SH);
  return 1;
}
