/* v20 temporary round events */
/* v20.3.3: the bridge flood ("riada") event was removed */
var EVENT_DEFS={
  tormenta:{name:"Tormenta",banner:"¡Tormenta!",icon:"⚡",mild:0,dur:[16,24],col:"#90caf9"},
  fuego:{name:"Fuego en el trigal",banner:"¡El trigal arde!",icon:"🔥",mild:0,dur:[16,24],col:"#ff8a50"},
  caja:{name:"Caja de suministros",banner:"¡Caja de suministros!",icon:"📦",mild:1,dur:[20,28],col:"#ffd54f"},
  luna:{name:"Luna de sangre",banner:"¡Luna de sangre!",icon:"🔴",mild:0,dur:[18,26],col:"#e53935"},
  tesoro:{name:"Tesoro",banner:"¡Tesoro en las ruinas!",icon:"💎",mild:1,dur:[20,28],col:"#ffe082"}
};
function randRange(a,b){return a+Math.random()*(b-a);}
function eventSpeedMul(x,y){
  if(!game||!game.events)return 1;
  var i,e;
  for(i=0;i<game.events.length;i++){
    e=game.events[i];if(!e.alive)continue;
    if(e.id==="luna")return 1; /* applied on zombies separately */
  }
  return 1;
}
function eventXpMul(){
  var i,e;if(!game||!game.events)return 1;
  for(i=0;i<game.events.length;i++){e=game.events[i];if(e.alive&&e.id==="luna")return 2;}
  return 1;
}
function eventZombieSpeedMul(){
  var i,e;if(!game||!game.events)return 1;
  for(i=0;i<game.events.length;i++){e=game.events[i];if(e.alive&&e.id==="luna")return 1.35;}
  return 1;
}
function eventAutoRangeMul(){
  var i,e;if(!game||!game.events)return 1;
  for(i=0;i<game.events.length;i++){e=game.events[i];if(e.alive&&e.id==="niebla")return 0.62;}
  return 1;
}
function pickEventIds(waveIdx){
  var mild=["caja","tesoro"] /* v20.3: fog and giant poison removed */,all=Object.keys(EVENT_DEFS),ids=[],id,pool,i;
  function pickFrom(arr){
    var left=arr.filter(function(k){return ids.indexOf(k)<0;});
    if(!left.length)return null;
    return left[(Math.random()*left.length)|0];
  }
  if(waveIdx<=0){
    if(Math.random()<0.42){id=pickFrom(mild);if(id)ids.push(id);}
    return ids;
  }
  ids.push(pickFrom(all));
  if(waveIdx>=2&&Math.random()<0.45){id=pickFrom(all);if(id)ids.push(id);}
  return ids.filter(Boolean);
}
function openSpotNear(x,y,rad){
  var i,ang,r,px,py;
  for(i=0;i<24;i++){
    ang=Math.random()*6.283;r=randRange(20,rad||80);
    px=x+Math.cos(ang)*r;py=y+Math.sin(ang)*r;
    if(!circleHitSolid(px,py,16,"solid"))return {x:px,y:py};
  }
  return {x:x,y:y};
}
function beginRoundEvents(waveIdx){
  if(!game)return;
  game.events=[];game.eventBanner=null;game.eventBannerT=0;
  if(game._flooded){restoreBridges();game._flooded=0;}
  if(game._burnedWheat){game._burnedWheat.burned=0;game._burnedWheat.regrowT=6;game._burnedWheat=null;}
  var ids=pickEventIds(waveIdx),delay=waveIdx<=0?randRange(10,16):randRange(6,12),i,id,def,ev,spot,wh;
  for(i=0;i<ids.length;i++){
    id=ids[i];def=EVENT_DEFS[id];if(!def)continue;
    ev={id:id,alive:0,delay:delay+i*randRange(5,9),dur:randRange(def.dur[0],def.dur[1]),t:0,telegraph:1.2,col:def.col,banner:def.banner,icon:def.icon};
    if(id==="fuego"){
      wh=(map.bushes||[]).filter(function(b){return b.k==="wheat";});
      ev.field=wh.length?(Math.random()<0.5||wh.length===1?wh[0]:wh[1]):null;
    }
    if(id==="caja"||id==="tesoro"){
      if(id==="tesoro")spot=openSpotNear(680,200,70);
      else spot=openSpotNear((map.start&&map.start.x)||552,((map.start&&map.start.y)||430)-40,90);
      ev.x=spot.x;ev.y=spot.y;ev.picked=0;ev.hp=40;
    }
    if(id==="toxica"){
      spot=openSpotNear((map.pond&&map.pond.x)||460,((map.pond&&map.pond.y)||285)+90,70);
      ev.x=spot.x;ev.y=spot.y;ev.r=28;ev.rMax=92;
    }
    if(id==="tormenta"){ev.strikes=[];ev.strikeT=randRange(2.2,3.6);}
    game.events.push(ev);
  }
}
function restoreBridges(){
  if(!game||!game._bridgeBackup)return;
  if(map.grid&&game._bridgeBackup){
    var i,c;for(i=0;i<game._bridgeBackup.length;i++){c=game._bridgeBackup[i];map.grid[c.i]=c.v;}
  }
  game._bridgeBackup=null;
  map.chunks={};map.dirty=1;
  if(game.player)updateFlow(game.player.x,game.player.y);
}
function blockStoneBridge(){
  var b=(map.bridges||[]).filter(function(x){return x.main;})[0]||(map.bridges&&map.bridges[0]);
  if(!b||!map.grid)return;
  var c0=(b.x/CFG.CELL)|0,c1=((b.x+b.w)/CFG.CELL)|0,r0=(b.y/CFG.CELL)|0,r1=((b.y+b.h)/CFG.CELL)|0,c,r,idx,bak=[];
  for(r=r0;r<=r1;r++)for(c=c0;c<=c1;c++){
    if(c<0||r<0||c>=map.cols||r>=map.rows)continue;
    idx=r*map.cols+c;bak.push({i:idx,v:map.grid[idx]});map.grid[idx]=1;
  }
  game._bridgeBackup=bak;game._flooded=1;game._floodBridge=b;
  map.chunks={};map.dirty=1;
  if(game.player)updateFlow(game.player.x,game.player.y);
}
function activateEvent(ev){
  ev.alive=1;ev.t=ev.dur;
  game.eventBanner=ev.banner;game.eventIcon=ev.icon||(ev.def&&ev.def.icon)||"";game.eventBannerT=2.4;
  if(ev.id==="tormenta"||ev.id==="luna"){if(typeof sfx==="function")sfx("storm");}
  if(ev.id==="fuego"&&ev.field){ev.field.burned=1;game._burnedWheat=ev.field;if(typeof fireStart==="function")fireStart(ev);else if(typeof sfx==="function")sfx("explode");}
  if(ev.id==="caja"||ev.id==="tesoro"){if(typeof sfx==="function")sfx("sting");}
}
function endEvent(ev){
  ev.alive=0;
  if(ev.id==="fuego"&&ev.field){/* stays burned until next round begins */if(typeof stopFireLoop==="function")stopFireLoop();}
}
function strikeLightning(x,y){
  var i,z,p=game.player,r=46;
  if(typeof sfx==="function")sfx("zap");
  if(typeof shake==="function")shake(7);
  if(p&&dist(p.x,p.y,x,y)<r+p.r){if(typeof hurtPlayer==="function")hurtPlayer(16);}
  if(game.zombies)for(i=0;i<game.zombies.length;i++){
    z=game.zombies[i];if(z.dead||z.dying)continue;
    if(dist(z.x,z.y,x,y)<r+z.r){if(typeof hurtZombie==="function")hurtZombie(z,55,x);}
  }
  if(typeof addParticle==="function"){
    for(i=0;i<10;i++)addParticle(x+rand(-16,16),y+rand(-12,12),"#e3f2fd",0.35,rand(-20,20),rand(-40,-10),8,5);
  }
}
function updateEvents(dt){
  if(!game||!game.events||(game.state!=="playing"&&game.state!=="countdown"))return;
  /* events don't tick during countdown or upgrade/pause */
  if(game.state!=="playing")return;
  var i,ev,p=game.player,z,d,j;
  for(i=0;i<game.events.length;i++){
    ev=game.events[i];
    if(!ev.alive){
      ev.delay-=dt;
      if(ev.delay<=0)activateEvent(ev);
      continue;
    }
    ev.t-=dt;
    if(ev.t<=0){endEvent(ev);continue;}
    if(ev.id==="tormenta"){
      ev.strikeT-=dt;
      if(!ev.pending&&ev.strikeT<=ev.telegraph){
        ev.pending=openSpotNear(p.x,p.y,160);
        ev.pendingT=ev.telegraph;
      }
      if(ev.pending){
        ev.pendingT-=dt;
        if(ev.pendingT<=0){strikeLightning(ev.pending.x,ev.pending.y);ev.pending=null;ev.strikeT=randRange(2.0,3.4);}
      }
    }
    if(ev.id==="fuego"&&ev.field&&p){
      if(inWheat(p.x,p.y)===ev.field){
        ev._ph=(ev._ph||0)+dt;if(ev._ph>0.35){ev._ph=0;if(typeof hurtPlayer==="function")hurtPlayer(7);}
      }
      if(game.zombies)for(j=0;j<game.zombies.length;j++){
        z=game.zombies[j];if(z.dead||z.dying)continue;
        if(inWheat(z.x,z.y)===ev.field){
          z._fh=(z._fh||0)+dt;if(z._fh>0.3){z._fh=0;if(typeof hurtZombie==="function")hurtZombie(z,14,z.x);}
        }
      }
    }
    if(ev.id==="toxica"){
      ev.r=Math.min(ev.rMax,(ev.r||28)+18*dt);
      if(p&&dist(p.x,p.y,ev.x,ev.y)<ev.r+p.r){ev._th=(ev._th||0)+dt;if(ev._th>0.4){ev._th=0;if(typeof hurtPlayer==="function")hurtPlayer(8);}}
      if(game.zombies)for(j=0;j<game.zombies.length;j++){
        z=game.zombies[j];if(z.dead||z.dying)continue;
        if(dist(z.x,z.y,ev.x,ev.y)<ev.r+z.r){z._th=(z._th||0)+dt;if(z._th>0.35){z._th=0;if(typeof hurtZombie==="function")hurtZombie(z,10,ev.x);}}
      }
    }
    if((ev.id==="caja"||ev.id==="tesoro")&&!ev.picked&&p){
      if(dist(p.x,p.y,ev.x,ev.y)<22+p.r){
        ev.picked=1;ev.t=0.01;
        if(ev.id==="tesoro"||Math.random()<0.5){
          p.hp=Math.min(p.maxHp,(p.hp||0)+40);
          if(typeof floatText==="function")floatText(p.x,p.y-20,"+40", "#69f0ae");
        }else{
          p._evtDmg=1.35;p._evtDmgT=12;
          if(typeof floatText==="function")floatText(p.x,p.y-20,"¡Potencia!", "#ffd54f");
        }
        if(typeof sfx==="function")sfx("level");
      }
      /* zombies contest: damage the crate */
      if(game.zombies)for(j=0;j<game.zombies.length;j++){
        z=game.zombies[j];if(z.dead||z.dying)continue;
        if(dist(z.x,z.y,ev.x,ev.y)<18+z.r){ev.hp=(ev.hp||40)-18*dt;if(ev.hp<=0){ev.picked=1;ev.t=0.01;if(typeof sfx==="function")sfx("explode");}}
      }
    }
  }
  if(game.eventBannerT>0)game.eventBannerT-=dt;
  if(p&&p._evtDmgT>0){p._evtDmgT-=dt;if(p._evtDmgT<=0)p._evtDmg=1;}
}
function drawEventsUnder(){
  if(game&&typeof drawScorchedRegrow==="function")drawScorchedRegrow();
  if(!game||!game.events)return;
  var i,ev,s,sc=layout.scale,ys=CFG.YSCALE,a,p;
  for(i=0;i<game.events.length;i++){
    ev=game.events[i];if(!ev.alive)continue;
    if(ev.id==="toxica"){
      s=toScreen(ev.x,ev.y);a=0.28+0.1*Math.sin((game.time||0)*4);
      ctx.globalAlpha=a;ctx.fillStyle="#8bc34a";fillEllipse(ctx,s.x,s.y,ev.r*sc,ev.r*ys*sc);ctx.globalAlpha=0.5;
      ctx.strokeStyle="#c6ff00";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(s.x,s.y,ev.r*sc,ev.r*ys*sc,0,0,7);ctx.stroke();ctx.globalAlpha=1;
    }
    if(ev.id==="fuego"&&ev.field&&ev.fire&&typeof drawFireUnder==="function"){drawFireUnder(ev);}
    else if(ev.id==="fuego"&&ev.field){
      s=toScreen(ev.field.x,ev.field.y);
      var w=ev.field.w*sc,h=ev.field.d*ys*sc;
      ctx.globalAlpha=0.28+0.1*Math.sin((game.time||0)*8);
      ctx.fillStyle="#ff5722";ctx.fillRect(s.x,s.y,w,h);
      ctx.globalAlpha=0.18;ctx.fillStyle="#ffeb3b";ctx.fillRect(s.x+4,s.y+4,w-8,h-8);ctx.globalAlpha=1;
    }
    if((ev.id==="caja"||ev.id==="tesoro")&&!ev.picked){
      s=toScreen(ev.x,ev.y);
      ctx.fillStyle="rgba(0,0,0,0.3)";fillEllipse(ctx,s.x+2,s.y+4,12*sc,6*sc);
      ctx.fillStyle=ev.id==="tesoro"?"#ffd54f":"#8d6e4a";
      ctx.fillRect(s.x-10*sc,s.y-14*sc,20*sc,16*sc);
      ctx.fillStyle=ev.id==="tesoro"?"#ff8f00":"#5d4037";
      ctx.fillRect(s.x-10*sc,s.y-8*sc,20*sc,4*sc);
      ctx.strokeStyle="#fff8e1";ctx.lineWidth=1.2;ctx.strokeRect(s.x-10*sc,s.y-14*sc,20*sc,16*sc);
    }
    if(ev.id==="tormenta"&&ev.pending){
      s=toScreen(ev.pending.x,ev.pending.y);
      a=0.45+0.4*Math.sin((game.time||0)*16);
      ctx.globalAlpha=a;ctx.strokeStyle="#ffe082";ctx.lineWidth=3;
      ctx.beginPath();ctx.ellipse(s.x,s.y,46*sc,46*ys*sc,0,0,7);ctx.stroke();
      ctx.globalAlpha=0.25;ctx.fillStyle="#fff59d";fillEllipse(ctx,s.x,s.y,40*sc,40*ys*sc);ctx.globalAlpha=1;
    }
  }
}
function drawEventsOver(){
  if(!game)return;
  var i,ev,rain,n,sx,sy,alive=0;
  if(!game.events)return;
  for(i=0;i<game.events.length;i++){
    ev=game.events[i];if(!ev.alive)continue;alive++;
    if(ev.id==="niebla"){
      ctx.fillStyle="rgba(180,190,200,0.28)";ctx.fillRect(0,0,SW,SH);
      var g=ctx.createRadialGradient(SW/2,SH/2,Math.min(SW,SH)*0.15,SW/2,SH/2,Math.max(SW,SH)*0.7);
      g.addColorStop(0,"rgba(160,170,180,0)");g.addColorStop(1,"rgba(90,100,110,0.72)");
      ctx.fillStyle=g;ctx.fillRect(0,0,SW,SH);
    }
    if(ev.id==="luna"){
      ctx.fillStyle="rgba(120,16,16,0.18)";ctx.fillRect(0,0,SW,SH);
    }
    if(ev.id==="tormenta"){
      ctx.fillStyle="rgba(20,30,50,0.16)";ctx.fillRect(0,0,SW,SH);
      ctx.strokeStyle="rgba(180,200,220,0.45)";ctx.lineWidth=1.2;
      n=40;ctx.beginPath();
      for(i=0;i<n;i++){
        sx=(i*73+(game.time||0)*420)%(SW+20)-10;
        sy=(i*47+(game.time||0)*900)%(SH+20)-10;
        ctx.moveTo(sx,sy);ctx.lineTo(sx-4,sy+16);
      }
      ctx.stroke();
    }
  }
}
function drawEventBanner(){
  if(!game||!game.eventBanner||game.eventBannerT<=0)return;
  var T=game.eventBannerT,ba=T>2.22?(2.4-T)/0.18:T<0.28?T/0.28:1;
  var by=layout.safe.t+8,bh=36,bw,tx=game.eventBanner,icon=game.eventIcon||"";
  var label=icon?icon+"  "+tx:tx;
  ctx.save();ctx.globalAlpha=ba;ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.font="bold 16px system-ui,Segoe UI,sans-serif";
  bw=Math.min(SW-48, Math.max(220, ctx.measureText(label).width+40));
  ctx.fillStyle="rgba(6,4,6,0.94)";roundRect(ctx,(SW-bw)/2,by,bw,bh,10);ctx.fill();
  ctx.strokeStyle="#ffe082";ctx.lineWidth=2.5;roundRect(ctx,(SW-bw)/2,by,bw,bh,10);ctx.stroke();
  ctx.fillStyle="#fffde7";ctx.shadowColor="#000";ctx.shadowBlur=4;ctx.shadowOffsetY=1;
  ctx.fillText(label,SW/2,by+bh/2+1);ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.restore();ctx.textAlign="left";ctx.textBaseline="alphabetic";
}
