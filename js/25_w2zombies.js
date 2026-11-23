/* v21.4 — WORLD 2 ICE ZOMBIES. Five new hand-painted zombies (fused one-piece sprites, same pipeline as the island's:
   legs cut at runtime, shamble walk, contact shadow) replace the tinted island zombies on the ice:
     Congelado (normal)        — frost-bitten parka walker; its touch chills you (slower for a moment)
     Patinador (fast)          — skates in sudden bursts straight at you, leaving an ice spray
     Bruto de hielo (tank)     — huge, plated in ice: every hit on it is softened
     Lanzaesquirlas (spitter)  — throws ice shards that chill on hit (no acid on the ice)
     Bomba de escarcha (exploder) — bursts into a freezing puddle that slows whoever steps in
   Nothing here runs on World 1 (every hook returns to the original code when WORLD.cur!==2), so W1 stays identical. */
var W2Z={
  map:{normal:"w2_walker",fast:"w2_skater",tank:"w2_brute",spitter:"w2_thrower",exploder:"w2_bomber",mini:"w2_walker"},
  names:{normal:"Congelado",fast:"Patinador",tank:"Bruto de hielo",spitter:"Lanzaesquirlas",exploder:"Bomba de escarcha"},
  banner:{fast:1,tank:1,spitter:1,exploder:1},
  unlocks:[["fast"],["tank"],[],["spitter"],[],["exploder"],[],[],[],["boss"]],
  meta:{"w2_walker_f":{"file":"assets/spr/w2_walker_f.webp","w":201,"h":360,"fx":0.492,"fy":0.992,"hx":0.98,"hy":0.656,"ex":0.578,"ey":0.284},
        "w2_skater_f":{"file":"assets/spr/w2_skater_f.webp","w":271,"h":360,"fx":0.417,"fy":0.992,"hx":0.985,"hy":0.604,"ex":0.671,"ey":0.234},
        "w2_brute_f":{"file":"assets/spr/w2_brute_f.webp","w":289,"h":360,"fx":0.549,"fy":0.992,"hx":0.986,"hy":0.528,"ex":0.582,"ey":0.191},
        "w2_thrower_f":{"file":"assets/spr/w2_thrower_f.webp","w":237,"h":360,"fx":0.494,"fy":0.992,"hx":0.983,"hy":0.575,"ex":0.578,"ey":0.273},
        "w2_bomber_f":{"file":"assets/spr/w2_bomber_f.webp","w":216,"h":360,"fx":0.529,"fy":0.992,"hx":0.981,"hy":0.606,"ex":0.543,"ey":0.272}},
  imgs:{},n:0,loading:0,icy:0,boom:0
};
function w2zReady(){return W2Z.n>=5;}
function w2zLoad(){
  if(W2Z.loading)return;W2Z.loading=1;
  Object.keys(W2Z.meta).forEach(function(k){var im=new Image();im.onload=function(){W2Z.imgs[k]=im;W2Z.n++;};im.onerror=function(){W2Z.loading=0;};im.src=W2Z.meta[k].file+"?v=22.0";});
}
function w2zOn(){return typeof WORLD!=="undefined"&&WORLD.cur===2&&!(typeof HELL!=="undefined"&&HELL.active);}
(function(){var _l=w2LoadImg;w2LoadImg=function(){w2zLoad();return _l.apply(this,arguments);};if(w2Unlocked())setTimeout(w2zLoad,2600);})();
/* sprite lookup: an ice zombie draws its own painting (no tint) */
(function(){
  var _ae=artEntry;
  artEntry=function(look,dir,pose){
    if(look&&look.w2&&ART.ready){var nm=look.w2+"_f",img=W2Z.imgs[nm],meta=W2Z.meta[nm];
      if(img&&img.width){var fl=(dir<=1||dir===7)?1:(dir>=3&&dir<=5)?-1:1;return{img:img,meta:meta,flip:fl<0,key:look.w2,name:nm};}}
    return _ae.apply(this,arguments);
  };
})();
/* dress a freshly spawned zombie on the ice; returns 1 when it became an ice zombie (no frost tint then) */
function w2zDress(z){
  if(!w2zOn()||!z||!z.look||z.look.kind!=="zombie"||!w2zReady())return 0;
  var k=W2Z.map[z.type];if(!k)return 0;
  z.look.w2=k;z.w2=k;z.look.tint=null;
  if(k==="w2_walker")z.chillHit=1.1;
  else if(k==="w2_skater"){z.skCd=rand(1.2,2.6);z.skT=0;}
  else if(k==="w2_brute"){z.iceArmor=0.72;z.hp=Math.round(z.hp*1.08);z.maxHp=z.hp;}
  else if(k==="w2_thrower"){z.spitCd=rand(1.0,1.8);}
  return 1;
}
/* waves on the ice use only the ice roster */
(function(){
  var _pw=poolForWave;
  poolForWave=function(idx){
    if(!w2zOn()||!w2zReady())return _pw.apply(this,arguments);
    var pool=["normal"],w,i,u;for(w=0;w<=idx&&w<W2Z.unlocks.length;w++){u=W2Z.unlocks[w];for(i=0;i<u.length;i++)if(u[i]!=="boss"&&pool.indexOf(u[i])<0)pool.push(u[i]);}
    return pool;
  };
  var _an=announceNewZombie;
  announceNewZombie=function(type,elite){
    if(!w2zOn()||!w2zReady()||elite||!W2Z.names[type])return _an.apply(this,arguments);
    if(!game)return;if(!game.seenTypes)game.seenTypes={};if(game.seenTypes[type])return;game.seenTypes[type]=1;
    if(!W2Z.banner[type])return;game.banner="NUEVO ZOMBI: "+W2Z.names[type].toUpperCase();game.bannerT=2.8;
  };
})();
/* ---------- chill (player slowed for a moment) ---------- */
function w2zChill(p,sec,txt){
  if(!p||p.dead)return;var t=game.time||0,was=(p.chillUntil||0)>t;
  p.chillUntil=Math.max(p.chillUntil||0,t+sec);
  if(!was&&txt&&(!p._chillTxt||t-p._chillTxt>1.2)){p._chillTxt=t;floatText(p.x,p.y-26,"¡CONGELADO!","#9fe8ff");}
}
(function(){
  var _ts=terrainSpeedMul;
  terrainSpeedMul=function(x,y){var m=_ts(x,y),p=game&&game.player;if(p&&p.chillUntil>(game.time||0)&&x===p.x&&y===p.y&&w2zOn())m*=0.62;return m;};
})();
/* ---------- behaviours ---------- */
(function(){
  var _uz=updateZombies;
  updateZombies=function(dt){
    if(!w2zOn())return _uz.apply(this,arguments);
    var zs=game.zombies,p=game.player,i,z,d,hp0=p?p.hp:0;
    for(i=0;i<zs.length;i++){z=zs[i];if(z.dead||z.dying||!z.w2)continue;
      if(z.w2==="w2_skater"&&p){
        if(z.skT>0){z.skT-=dt;if(z.skT<=0){z.speed=z._skBase;}
          else if(Math.random()<0.5&&(game.particles||[]).length<150)addParticle(z.x+rand(-6,6),z.y+rand(-2,3),Math.random()<0.5?"#e3f6ff":"#9fdcff",0.35,rand(-30,30),rand(-30,0),rand(2,4),3);}
        else{z.skCd-=dt;d=dist(z.x,z.y,p.x,p.y);
          if(z.skCd<=0&&d<300&&d>50&&z.spawnT<=0&&(!z.stun||z.stun<=0)){z._skBase=z.speed;z.speed*=2.15;z.skT=0.6;z.skCd=rand(2.2,3.4);try{sfx("dash");}catch(e){}}}
      }
    }
    /* melee: remember who touched the hero this frame */
    var near=[];if(p)for(i=0;i<zs.length;i++){z=zs[i];if(z.w2==="w2_walker"&&!z.dead&&!z.dying&&(z.attackCd||0)<=0&&dist(z.x,z.y,p.x,p.y)<p.r+z.r+4)near.push(z);}
    var r=_uz.apply(this,arguments);
    if(p&&near.length&&p.hp<hp0)w2zChill(p,near[0].chillHit||1,1);
    return r;
  };
  /* ice armour on the brute; icy shards instead of blood on every ice zombie */
  var _hz=hurtZombie;
  hurtZombie=function(z,dmg){
    if(!w2zOn()||!z||!z.w2)return _hz.apply(this,arguments);
    if(z.iceArmor&&dmg>0){arguments[1]=dmg*z.iceArmor;if((game.particles||[]).length<140&&Math.random()<0.6)addParticle(z.x+rand(-8,8),z.y-rand(10,26),"#d8f4ff",0.3,rand(-90,90),rand(-120,-30),rand(2,4),3);}
    W2Z.icy=1;try{return _hz.apply(this,arguments);}finally{W2Z.icy=0;}
  };
  var _kz=killZombie;
  killZombie=function(z){
    if(!w2zOn()||!z||!z.w2)return _kz.apply(this,arguments);
    if(z.dying||z.dead)return;
    W2Z.icy=1;W2Z.boom=z.w2==="w2_bomber"?1:0;
    try{var r=_kz.apply(this,arguments);}finally{W2Z.icy=0;W2Z.boom=0;}
    if(z.w2==="w2_bomber")w2zPuddle(z.x,z.y);
    return r;
  };
  var ICY={"#8bc34a":"#bfefff","#a5d6a7":"#e3f6ff","#6d4c41":"#7fb6dc","#7a1f1a":"#4f8fc0","#8b0000":"#8fd6ff","#cfd8dc":"#ffffff"};
  var _ap=addParticle;
  addParticle=function(x,y,color){if(W2Z.icy&&ICY[color])arguments[2]=ICY[color];return _ap.apply(this,arguments);};
  var _ab=addBlood;addBlood=function(){if(W2Z.icy)return;return _ab.apply(this,arguments);};
  /* the bomber's burst is a frost blast (same damage and radius as the island's) */
  var _gb=gfxBoom;
  gfxBoom=function(x,y,r){
    if(!W2Z.boom)return _gb.apply(this,arguments);
    var i;W2Z.icy=0;
    for(i=0;i<8;i++)addParticle(x,y,"#ffffff",0.22,rand(-220,220),rand(-220,220),7,9);
    for(i=0;i<12;i++)addParticle(x,y,i%2?"#7fd8ff":"#c9f1ff",0.5,rand(-170,170),rand(-190,70),rand(4,8),3);
    for(i=0;i<6;i++)addParticle(x,y,"#e8f7ff",0.8,rand(-50,50),rand(-80,-20),10,8);
    if(game.novas)game.novas.push({x:x,y:y,r:8,vr:(r||70)*4,life:0.3,maxLife:0.3,col:"rgba(170,230,255,0.8)"});
    if(typeof shake==="function")shake(8);W2Z.icy=1;
  };
})();
/* ---------- freezing puddles ---------- */
function w2zPuddle(x,y){if(!game.w2frost)game.w2frost=[];game.w2frost.push({x:x,y:y,r:36,life:4.5,maxLife:4.5});if(game.w2frost.length>8)game.w2frost.shift();}
var _w2zPudSpr=null;
function w2zPudSpr(){
  if(_w2zPudSpr)return _w2zPudSpr;var c=document.createElement("canvas");c.width=128;c.height=128;var g=c.getContext("2d"),i;
  var gr=g.createRadialGradient(64,64,6,64,64,62);gr.addColorStop(0,"rgba(225,248,255,0.95)");gr.addColorStop(0.55,"rgba(140,215,255,0.75)");gr.addColorStop(0.85,"rgba(90,170,235,0.45)");gr.addColorStop(1,"rgba(90,170,235,0)");
  g.fillStyle=gr;g.beginPath();g.arc(64,64,62,0,7);g.fill();
  g.strokeStyle="rgba(255,255,255,0.85)";g.lineWidth=2;for(i=0;i<7;i++){var a=i*0.9+0.3,l=20+((i*37)%24);g.beginPath();g.moveTo(64,64);g.lineTo(64+Math.cos(a)*l,64+Math.sin(a)*l);g.lineTo(64+Math.cos(a+0.25)*(l+10),64+Math.sin(a+0.25)*(l+10));g.stroke();}
  for(i=0;i<9;i++){var b=i*0.7,rr=34+((i*13)%18),x=64+Math.cos(b)*rr,y=64+Math.sin(b)*rr;g.fillStyle="rgba(240,252,255,0.95)";g.beginPath();g.moveTo(x,y-7);g.lineTo(x+3,y);g.lineTo(x,y+3);g.lineTo(x-3,y);g.closePath();g.fill();}
  _w2zPudSpr=c;return c;
}
var _w2zChillSpr=null;
function w2zChillSpr(){
  if(_w2zChillSpr)return _w2zChillSpr;var c=document.createElement("canvas");c.width=96;c.height=96;var g=c.getContext("2d"),i;
  g.strokeStyle="rgba(170,235,255,0.95)";g.lineWidth=4;g.beginPath();g.arc(48,48,40,0,7);g.stroke();
  g.strokeStyle="rgba(255,255,255,0.7)";g.lineWidth=1.5;g.beginPath();g.arc(48,48,34,0,7);g.stroke();
  for(i=0;i<8;i++){var a=i*0.785,x=48+Math.cos(a)*40,y=48+Math.sin(a)*40;g.fillStyle="rgba(235,250,255,0.98)";g.beginPath();g.moveTo(x,y-9);g.lineTo(x+3.5,y);g.lineTo(x,y+3);g.lineTo(x-3.5,y);g.closePath();g.fill();}
  _w2zChillSpr=c;return c;
}
(function(){
  var _ds=drawScorches;
  drawScorches=function(){
    var r=_ds.apply(this,arguments);if(!w2zOn()||!game)return r;
    var sc=layout.scale,ys=CFG.YSCALE,i,f,s,a,p=game.player,t=game.time||0;
    if(game.w2frost)for(i=0;i<game.w2frost.length;i++){f=game.w2frost[i];if(!onScreen(f.x,f.y,60))continue;s=toScreen(f.x,f.y);a=clamp(f.life/f.maxLife*1.6,0,1);
      ctx.globalAlpha=0.8*a;ctx.drawImage(w2zPudSpr(),s.x-f.r*sc,s.y-f.r*sc*ys,f.r*2*sc,f.r*2*sc*ys);}
    if(p&&p.chillUntil>t&&!p.dead){s=toScreen(p.x,p.y);var k=clamp((p.chillUntil-t)*2,0,1),rr=(17+Math.sin(t*6)*1.5)*sc;ctx.globalAlpha=0.85*k;ctx.drawImage(w2zChillSpr(),s.x-rr,s.y-rr*ys,rr*2,rr*2*ys);}
    ctx.globalAlpha=1;return r;
  };
})();
/* ---------- ice shards (the thrower's projectiles) ---------- */
(function(){
  var _up=updateProjectiles;
  updateProjectiles=function(dt){
    if(!w2zOn()||!game.projectiles)return _up.apply(this,arguments);
    var i,q,p=game.player,a=game.projectiles;
    for(i=a.length-1;i>=0;i--){q=a[i];
      if(q.acid&&!q.ice){q.acid=0;q.ice=1;q.col="#bdeeff";}
      if(!q.ice)continue;
      q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.spin=(q.spin||0)+dt;
      var hitP=p&&!p.dead&&dist(q.x,q.y,p.x,p.y)<p.r+q.r;
      if(q.life<=0||hitP||circleHitSolid(q.x,q.y,q.r||5,"proj")){
        if(hitP){var hp0=p.hp;hurtPlayer(p,q.dmg||10);if(p.hp<hp0)w2zChill(p,1.4,1);}
        var k;for(k=0;k<5;k++)addParticle(q.x,q.y,k%2?"#e8f8ff":"#9fdcff",0.3,rand(-90,90),rand(-90,40),rand(2,4),3);
        a.splice(i,1);
      }
    }
    var r=_up.apply(this,arguments);
    if(game.w2frost){for(i=game.w2frost.length-1;i>=0;i--){var f=game.w2frost[i];f.life-=dt;
      if(p&&!p.dead&&dist(f.x,f.y,p.x,p.y)<f.r+p.r*0.5)w2zChill(p,0.35,1);
      if(f.life<=0)game.w2frost.splice(i,1);}}
    return r;
  };
  var _shard=null;
  function shardSpr(){if(_shard)return _shard;var c=document.createElement("canvas");c.width=48;c.height=20;var g=c.getContext("2d");
    var gl=g.createRadialGradient(24,10,0,24,10,22);gl.addColorStop(0,"rgba(180,235,255,0.55)");gl.addColorStop(1,"rgba(180,235,255,0)");g.fillStyle=gl;g.fillRect(0,0,48,20);
    var gr=g.createLinearGradient(0,4,0,16);gr.addColorStop(0,"#ffffff");gr.addColorStop(0.45,"#9fe2ff");gr.addColorStop(1,"#2f8fd0");
    g.fillStyle=gr;g.beginPath();g.moveTo(44,10);g.lineTo(26,4);g.lineTo(8,7);g.lineTo(4,10);g.lineTo(8,13);g.lineTo(26,16);g.closePath();g.fill();
    g.strokeStyle="rgba(10,50,90,0.9)";g.lineWidth=1.3;g.stroke();g.strokeStyle="rgba(255,255,255,0.9)";g.lineWidth=1;g.beginPath();g.moveTo(40,10);g.lineTo(12,9);g.stroke();
    _shard=c;return c;}
  var _pd=plDrawEnemyProj;
  plDrawEnemyProj=function(q){
    if(!q||!q.ice)return _pd.apply(this,arguments);
    var s=toScreen(q.x,q.y),sc=layout.scale,lift=14*sc,a=Math.atan2((q.vy||0)*CFG.YSCALE,q.vx||1);
    if(typeof softShadowSpr==="function"){ctx.globalAlpha=0.3;ctx.drawImage(softShadowSpr(),s.x-5*sc,s.y-2*sc,10*sc,4.5*sc);ctx.globalAlpha=1;}
    ctx.save();ctx.translate(s.x,s.y-lift);ctx.rotate(a);ctx.drawImage(shardSpr(),-16*sc,-6.5*sc,32*sc,13*sc);ctx.restore();
  };
})();
/* the bomber glows cold while it runs at you */
(function(){
  var _dz=drawZ;
  drawZ=function(z){
    var r=_dz.apply(this,arguments);
    if(z&&z.w2==="w2_bomber"&&!z.dying&&w2zOn()&&game.player){var d=dist(z.x,z.y,game.player.x,game.player.y);if(d<110){var s=toScreen(z.x,z.y),sc=layout.scale,k=1-d/110,pl=0.5+0.5*Math.sin((game.time||0)*(10+k*14));
      ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.25+0.35*k*pl;ctx.drawImage(w2zPudSpr(),s.x-16*sc,s.y-34*sc,32*sc,28*sc);ctx.restore();}}
    return r;
  };
})();
window.__w2z={ready:w2zReady,load:w2zLoad};
if(window.__w2){window.__w2.load=function(){w2LoadImg();};window.__w2.select=function(n){WORLD.sel=n;if(n===2)w2LoadImg();};}
/* the wave builder also reads WAVE_UNLOCKS directly for the round's "fresh" types: on the ice it reads the ice roster */
(function(){
  var _sw=startWave;
  startWave=function(idx){
    if(!w2zOn()||!w2zReady())return _sw.apply(this,arguments);
    var keep=WAVE_UNLOCKS;WAVE_UNLOCKS=W2Z.unlocks;
    try{return _sw.apply(this,arguments);}finally{WAVE_UNLOCKS=keep;}
  };
})();
