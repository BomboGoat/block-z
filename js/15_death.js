/* v20.3.3 — cinematic death / game-over screen.
   On death: the world freezes into slow motion, the camera pushes in on the hero, who topples over, while the
   colour drains and a red vignette closes in (death hit + body thud + low sting). Then a painted panel slides in:
   "HAS CAÍDO", hero portrait, run stats counting up (round, kills, time, damage, XP, coins), the account level bar
   filling, new-record / achievement badges, and REINTENTAR / MENÚ buttons.
   Perf: once the 1.6 s cinematic ends the frozen world is snapshotted once and blitted; the panel frame, title
   and portrait are cached canvases; no shadowBlur, no filters. Nothing here runs during play. */
var DEATH=null;
var DEATH_CINE=1.6,DEATH_PANEL_IN=0.45;
function deathSnd(n,v){try{if(typeof playSfxBuf==="function")playSfxBuf(n,v==null?0.8:v);}catch(e){}}
function deathInit(){
  var g=game,p=g.player;
  var acc0={level:account.level,xp:account.xp,xpToNext:account.xpToNext||xpForLevel(account.level)};
  var round=(typeof HELL!=="undefined"&&HELL.active)?10:(g.wave||0)+1;
  var kills=g.kills||0,prevBest=PROF?PROF.stats.bestRound||0:0,prevKills=PROF?PROF.stats.bestKills||0:0;
  DEATH={t:0,acc0:acc0,round:round,hell:(typeof HELL!=="undefined"&&HELL.active)?1:0,kills:kills,time:Math.max(0,(g.time||0)-((typeof MENU!=="undefined"&&MENU.runT0)||0)),
    dmg:Math.round(p.dmgDealt||0),hero:p.hero||selectedHero||"classic",ach0:PROF?Object.keys(PROF.ach||{}):[],
    recRound:prevBest>0&&round>prevBest,recKills:prevKills>0&&kills>prevKills,firstRun:!(PROF&&PROF.stats.runs>0),
    fallDir:(Math.cos(p.aimAng||0)>=0?-1:1),snap:null,ticks:0,sfx:{},rew:null};
  if(PROF&&kills>prevKills){PROF.stats.bestKills=kills;try{profSave();}catch(e){}}
  try{if(typeof stopMusic==="function")stopMusic();}catch(e){}
  deathSnd("death",0.9);setTimeout(function(){deathSnd("hurt",0.5);},60);
  g.shake=Math.max(g.shake||0,7);
}
/* update: run the timer, freeze-frame slow motion (zombies keep a slow sway), collect the rewards once
   profRunEnd has booked them */
(function(){
  var _u=update;
  update=function(dt){
    _u(dt);
    if(!game)return;
    if(game.state!=="dead"){if(DEATH&&game.state!=="dead")DEATH=null;return;}
    if(!DEATH||DEATH.g!==game){deathInit();DEATH.g=game;}
    var D=DEATH,t0=D.t;D.t+=dt;
    if(t0<0.62&&D.t>=0.62)deathSnd("thud",0.9);
    if(t0<DEATH_CINE-0.25&&D.t>=DEATH_CINE-0.25)deathSnd("sting",0.75);
    if(D.t<DEATH_CINE){var zs=game.zombies,i;for(i=0;i<zs.length;i++)if(!zs[i].dead)zs[i].anim=(zs[i].anim||0)+dt*1.2;}
    if(!D.rew&&D.t>DEATH_CINE-0.1){
      var r=(typeof MENU!=="undefined"&&MENU.lastRun)||{xp:0,coins:0};
      var newA=[];if(PROF&&typeof ACHS!=="undefined")ACHS.forEach(function(a){if(PROF.ach[a.id]&&D.ach0.indexOf(a.id)<0)newA.push(a.name);});
      D.rew={xp:r.xp||0,coins:r.coins||0,lvUp:r.lvUp||0,acc1:{level:account.level,xp:account.xp,xpToNext:account.xpToNext||xpForLevel(account.level)},ach:newA};
      if(typeof layoutMenuButtons==="function")layoutMenuButtons();
    }
    /* count-up ticks + level / badge stings */
    if(D.rew){
      var k=deathCount(D.t);
      if(k.any&&D.t-(D.lastTick||0)>0.075){D.lastTick=D.t;deathSnd("click",0.22);}
      if(k.coinsDone&&!D.sfx.coins){D.sfx.coins=1;deathSnd("rarity1",0.5);}
      if(k.bar>=1&&D.rew.lvUp&&!D.sfx.lv){D.sfx.lv=1;deathSnd("level",0.8);}
      if(k.badges&&!D.sfx.badge&&(D.recRound||D.recKills||D.rew.ach.length)){D.sfx.badge=1;deathSnd("rarity3",0.6);}
    }
  };
})();
function eOut(x){x=clamp(x,0,1);return 1-Math.pow(1-x,3);}
/* timeline of the panel (seconds since death) */
function deathCount(t){
  var s=t-DEATH_CINE-DEATH_PANEL_IN,o={},i,any=0;
  o.v=[];for(i=0;i<6;i++){var q=clamp((s-0.15-i*0.22)/0.75,0,1);o.v.push(eOut(q));if(q>0&&q<1)any=1;}
  o.coinsDone=o.v[5]>=1;o.bar=clamp((s-1.75)/0.9,0,1);o.badges=s>2.45;o.btn=s>0.4;o.any=any;
  return o;
}
/* hero topples over during the cinematic */
(function(){
  var _dh=drawHero;
  drawHero=function(){
    if(!(game&&game.state==="dead"&&DEATH)){return _dh();}
    var p=game.player,s=toScreen(p.x,p.y),f=eOut(DEATH.t/0.62),ang=DEATH.fallDir*f*1.42,b=f>=1?Math.max(0,1-(DEATH.t-0.62)/0.25)*Math.sin((DEATH.t-0.62)*30)*0.04:0;
    ctx.save();ctx.translate(s.x,s.y+f*2*layout.scale);ctx.rotate(ang+b*DEATH.fallDir);ctx.translate(-s.x,-s.y);
    var w=p.weapon;if(f>0.2)p.weapon=null;
    var inv=p.invuln;p.invuln=0;
    try{_dh();}catch(e){}
    p.invuln=inv;p.weapon=w;
    ctx.restore();
  };
})();
/* ---------- drawing ---------- */
function deathGrade(k){
  /* colour drains, red closes in */
  ctx.save();
  ctx.globalCompositeOperation="saturation";ctx.globalAlpha=0.9*k;ctx.fillStyle="#808080";ctx.fillRect(0,0,SW,SH);
  ctx.globalCompositeOperation="source-over";
  if(!DEATH.vig||DEATH.vig.w!==SW||DEATH.vig.h!==SH){
    var c=document.createElement("canvas");c.width=Math.ceil(SW/2);c.height=Math.ceil(SH/2);var g=c.getContext("2d"),gr=g.createRadialGradient(c.width/2,c.height*0.52,Math.min(c.width,c.height)*0.18,c.width/2,c.height/2,Math.max(c.width,c.height)*0.62);
    gr.addColorStop(0,"rgba(60,0,0,0)");gr.addColorStop(0.6,"rgba(90,0,6,0.45)");gr.addColorStop(1,"rgba(40,0,0,0.92)");g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);DEATH.vig={c:c,w:SW,h:SH};
  }
  ctx.globalAlpha=k;ctx.drawImage(DEATH.vig.c,0,0,SW,SH);
  ctx.globalAlpha=0.18*k;ctx.fillStyle="#3a0006";ctx.globalCompositeOperation="multiply";ctx.fillRect(0,0,SW,SH);
  ctx.restore();
}
function deathWorld(){
  var D=DEATH,p=game.player,t=D.t;
  if(D.snap&&D.snap.w===canvas.width&&D.snap.h===canvas.height){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(D.snap.c,0,0);ctx.restore();return;}
  var e=eOut(t/DEATH_CINE),z=1+0.6*e,s=toScreen(p.x,p.y-10);
  drawWorld();
  if(typeof drawLighting==="function")drawLighting();
  /* camera push-in on the fallen hero: drawWorld owns the transform, so zoom the finished frame */
  if(z>1.001){
    if(!D.tmp||D.tmp.width!==canvas.width||D.tmp.height!==canvas.height){D.tmp=document.createElement("canvas");D.tmp.width=canvas.width;D.tmp.height=canvas.height;}
    var tg=D.tmp.getContext("2d");tg.setTransform(1,0,0,1,0,0);tg.drawImage(canvas,0,0);
    var cx=s.x+(SW*0.5-s.x)*e*0.65,cy=s.y+(SH*0.56-s.y)*e*0.65,K=dpr||1;
    ctx.save();ctx.setTransform(K,0,0,K,0,0);ctx.translate(cx,cy);ctx.scale(z,z);ctx.translate(-s.x,-s.y);ctx.drawImage(D.tmp,0,0,SW,SH);ctx.restore();
  }
  drawVignette();
  deathGrade(eOut(t/1.1));
  /* hit flash at the moment of death */
  if(t<0.25){ctx.fillStyle="rgba(255,40,30,"+(0.45*(1-t/0.25))+")";ctx.fillRect(0,0,SW,SH);}
  if(t>=DEATH_CINE){ /* freeze the finished frame once */
    var c=document.createElement("canvas");c.width=canvas.width;c.height=canvas.height;c.getContext("2d").drawImage(canvas,0,0);D.snap={c:c,w:canvas.width,h:canvas.height};
  }
}
function deathLayout(){
  var s=layout.safe,top=s.t+10,bot=SH-s.b-10,h=bot-top,pw=Math.min(560,SW*0.62),portW=Math.min(230,SW-s.l-s.r-pw-50);
  var total=portW+16+pw,x0=(SW-total)/2;
  var L={port:{x:x0,y:top+8,w:portW,h:h-16},panel:{x:x0+portW+16,y:top,w:pw,h:h}};
  var bw=(pw-60)/2,bh=Math.min(46,h*0.13),by=top+h-bh-14;
  L.retry={id:"retry",x:L.panel.x+20,y:by,w:bw,h:bh};L.menu={id:"menu",x:L.panel.x+40+bw,y:by,w:bw,h:bh};
  return L;
}
function deathPanelCache(L){
  var K=dpr||1,P=L.panel,key=P.w+"x"+P.h+"@"+K;if(DEATH.pc&&DEATH.pc.key===key)return DEATH.pc.c;
  var c=document.createElement("canvas");c.width=Math.ceil((P.w+16)*K);c.height=Math.ceil((P.h+16)*K);var g=c.getContext("2d");g.setTransform(K,0,0,K,8*K,8*K);
  var w=P.w,h=P.h;
  g.fillStyle="rgba(0,0,0,0.35)";roundRect(g,-3,4,w+6,h+6,20);g.fill();
  var gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,"rgba(46,14,20,0.96)");gr.addColorStop(0.5,"rgba(26,10,16,0.96)");gr.addColorStop(1,"rgba(14,6,10,0.97)");g.fillStyle=gr;roundRect(g,0,0,w,h,18);g.fill();
  /* blood-red header band */
  g.save();roundRect(g,0,0,w,h,18);g.clip();
  var hb=g.createLinearGradient(0,0,0,70);hb.addColorStop(0,"rgba(170,20,24,0.55)");hb.addColorStop(1,"rgba(170,20,24,0)");g.fillStyle=hb;g.fillRect(0,0,w,70);
  /* faint claw scratches */
  g.strokeStyle="rgba(255,80,70,0.07)";g.lineWidth=5;g.lineCap="round";
  for(var i=0;i<3;i++){g.beginPath();g.moveTo(w*0.68+i*16,h*0.18);g.quadraticCurveTo(w*0.76+i*16,h*0.45,w*0.72+i*18,h*0.82);g.stroke();}
  g.restore();
  g.strokeStyle="rgba(255,120,100,0.45)";g.lineWidth=2;roundRect(g,1,1,w-2,h-2,17);g.stroke();
  g.strokeStyle="rgba(255,200,170,0.12)";g.lineWidth=1;roundRect(g,5,5,w-10,h-10,14);g.stroke();
  /* title, baked with its glow */
  var saved=ctx;ctx=g;
  g.save();g.globalAlpha=0.5;var gs=typeof glowSpr==="function"?glowSpr("#ff2a1a"):null;if(gs)g.drawImage(gs,w/2-170,-20,340,96);g.restore();
  g.font="italic 900 38px system-ui,-apple-system,sans-serif";g.textAlign="center";g.textBaseline="middle";g.lineJoin="round";
  g.strokeStyle="#1a0204";g.lineWidth=10;g.strokeText("HAS CAÍDO",w/2,34);
  g.strokeStyle="#6a0a0c";g.lineWidth=5;g.strokeText("HAS CAÍDO",w/2,36);
  var tg=g.createLinearGradient(0,14,0,54);tg.addColorStop(0,"#ffe0c8");tg.addColorStop(0.45,"#ff5a3c");tg.addColorStop(1,"#a8100c");g.fillStyle=tg;g.fillText("HAS CAÍDO",w/2,34);
  ctx=saved;
  DEATH.pc={key:key,c:c};return c;
}
function deathPortrait(L){
  var K=dpr||1,P=L.port,key=P.w+"x"+P.h+"@"+K+DEATH.hero;if(DEATH.pp&&DEATH.pp.key===key)return DEATH.pp.c;
  var c=document.createElement("canvas");c.width=Math.ceil(P.w*K);c.height=Math.ceil(P.h*K);var g=c.getContext("2d");g.setTransform(K,0,0,K,0,0);
  var w=P.w,h=P.h;
  /* plate */
  var gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,"rgba(60,10,14,0.85)");gr.addColorStop(1,"rgba(16,4,8,0.92)");g.fillStyle=gr;roundRect(g,0,0,w,h,18);g.fill();
  g.save();roundRect(g,0,0,w,h,18);g.clip();
  var rg=g.createRadialGradient(w/2,h*0.55,4,w/2,h*0.55,h*0.6);rg.addColorStop(0,"rgba(255,70,40,0.35)");rg.addColorStop(1,"rgba(255,70,40,0)");g.fillStyle=rg;g.fillRect(0,0,w,h);
  var saved=ctx;ctx=g;
  try{var H=Math.min(h*0.78,w*1.5);if(typeof drawHeroShowcaseRaw==="function")drawHeroShowcaseRaw(DEATH.hero,w*0.44,h*0.86,H,typeof equippedSkin==="function"?equippedSkin(DEATH.hero):"orig",null);}catch(e){}
  ctx=saved;
  /* drained, blood-lit */
  g.globalCompositeOperation="saturation";g.globalAlpha=0.55;g.fillStyle="#808080";g.fillRect(0,0,w,h);
  g.globalCompositeOperation="source-atop";g.globalAlpha=0.22;g.fillStyle="#b0101a";g.fillRect(0,0,w,h);
  g.globalCompositeOperation="source-over";g.globalAlpha=1;
  var bg=g.createLinearGradient(0,h*0.7,0,h);bg.addColorStop(0,"rgba(10,2,4,0)");bg.addColorStop(1,"rgba(10,2,4,0.85)");g.fillStyle=bg;g.fillRect(0,0,w,h);
  g.restore();
  g.strokeStyle="rgba(255,120,100,0.4)";g.lineWidth=2;roundRect(g,1,1,w-2,h-2,17);g.stroke();
  var hd=(typeof HEROES!=="undefined"&&HEROES.filter(function(x){return x.id===DEATH.hero;})[0])||{name:"Héroe"};
  ctx=g;try{mText(hd.name,w/2,h-22,18,"#ffd9c8","center","900",4);}catch(e){}ctx=saved;
  DEATH.pp={key:key,c:c};return c;
}
function drawDeathScreen(){
  var D=DEATH;if(!D)return;
  deathWorld();
  var t=D.t;if(t<DEATH_CINE)return;
  var L=deathLayout(),K=dpr||1,a=eOut((t-DEATH_CINE)/DEATH_PANEL_IN),k=deathCount(t);
  if(typeof MENU!=="undefined")MENU.hits=[];
  /* darken behind the panel */
  ctx.fillStyle="rgba(8,2,4,"+(0.45*a)+")";ctx.fillRect(0,0,SW,SH);
  /* portrait slides from the left, panel from the right */
  var pc=deathPortrait(L),P=L.port;
  ctx.save();ctx.globalAlpha=a;ctx.drawImage(pc,P.x-(1-a)*80,P.y,P.w,P.h);ctx.restore();
  var Pn=L.panel,dx=(1-a)*90;
  ctx.save();ctx.globalAlpha=a;ctx.drawImage(deathPanelCache(L),Pn.x-8+dx,Pn.y-8,Pn.w+16,Pn.h+16);
  ctx.translate(Pn.x+dx,Pn.y);
  var w=Pn.w,h=Pn.h,R=D.rew||{xp:0,coins:0,ach:[],acc1:account};
  mText(D.hell?"Reino de Thanos · ¡tan cerca!":"Nivel 1 · La Isla",w/2,66,12.5,"#ffb4a0","center","800",3);
  /* stat tiles: 3 x 2 */
  var stats=[
    {ic:"🌊",lb:"Ronda alcanzada",v:D.round,f:function(n){return Math.round(n)+" / 10";}},
    {ic:"💀",lb:"Bajas",v:D.kills,f:function(n){return fmtN(n);}},
    {ic:"⏱",lb:"Tiempo",v:D.time,f:function(n){var s=Math.round(n);return Math.floor(s/60)+":"+("0"+(s%60)).slice(-2);}},
    {ic:"⚔",lb:"Daño infligido",v:D.dmg,f:function(n){return fmtN(n);}},
    {ic:"✨",lb:"XP ganada",v:R.xp,f:function(n){return "+"+fmtN(n);},col:"#9fe8ff"},
    {ic:"🪙",lb:"Monedas",v:R.coins,f:function(n){return "+"+fmtN(n);},col:"#ffd54f"}
  ];
  var gx=18,gy=84,tw=(w-gx*2-16)/3,th=Math.min(58,(h-84-150)/2),i;
  for(i=0;i<6;i++){
    var c=i%3,r=(i/3)|0,x=gx+c*(tw+8),y=gy+r*(th+8),q=k.v[i];
    ctx.fillStyle="rgba(255,255,255,"+(0.05+0.04*(q>0&&q<1?1:0))+")";roundRect(ctx,x,y,tw,th,10);ctx.fill();
    ctx.strokeStyle="rgba(255,150,120,0.16)";ctx.lineWidth=1;roundRect(ctx,x+0.5,y+0.5,tw-1,th-1,10);ctx.stroke();
    mText(stats[i].ic,x+16,y+th/2,15,"#fff","center","700",0);
    mText(stats[i].lb,x+30,y+th*0.32,10.5,"#d9b3a8","left","700",0);
    var big=q>=1&&q<1.01&&(t-DEATH_CINE-DEATH_PANEL_IN-0.15-i*0.22-0.75)<0.18?1.12:1;
    mText(stats[i].f(stats[i].v*q),x+30,y+th*0.68,Math.round(18*big),stats[i].col||"#ffffff","left","900",3);
  }
  /* account level bar */
  var by=gy+2*(th+8)+6,bw=w-gx*2,A0=D.acc0,A1=R.acc1||A0,f0=A0.xp/Math.max(1,A0.xpToNext),lvl=A0.level,fill;
  var kb=k.bar;
  if(A1.level>A0.level){var span=(A1.level-A0.level)+A1.xp/Math.max(1,A1.xpToNext)-f0,pos=f0+span*kb;lvl=A0.level+Math.floor(pos);fill=pos-Math.floor(pos);if(kb>=1){lvl=A1.level;fill=A1.xp/Math.max(1,A1.xpToNext);}}
  else{fill=f0+(A1.xp/Math.max(1,A1.xpToNext)-f0)*kb;}
  mText("Nivel "+lvl,gx,by+8,13,"#ffe08a","left","900",3);
  var bx=gx+70,bww=bw-70;
  ctx.fillStyle="rgba(0,0,0,0.5)";roundRect(ctx,bx,by,bww,15,7.5);ctx.fill();
  if(fill>0.001){var bg2=ctx.createLinearGradient(bx,0,bx+bww,0);bg2.addColorStop(0,"#ffb347");bg2.addColorStop(1,"#ffe27a");ctx.fillStyle=bg2;roundRect(ctx,bx,by,Math.max(15,bww*clamp(fill,0,1)),15,7.5);ctx.fill();
    if(kb>0&&kb<1){ctx.fillStyle="rgba(255,255,255,0.55)";ctx.fillRect(bx+bww*clamp(fill,0,1)-3,by+2,3,11);}}
  ctx.strokeStyle="rgba(255,220,160,0.35)";ctx.lineWidth=1;roundRect(ctx,bx+0.5,by+0.5,bww-1,14,7);ctx.stroke();
  if(kb>=1&&R.lvUp){var pl=0.5+0.5*Math.sin(t*6);mText("⭐ ¡SUBES A NIVEL "+R.lvUp+"!",bx+bww/2,by+7.5,11,"rgb(255,"+(200+55*pl|0)+",120)","center","900",3);}
  /* badges */
  if(k.badges){
    var bs=[];if(D.recRound)bs.push(["🏆 ¡Nuevo récord de ronda!","#ffd54f"]);if(D.recKills)bs.push(["💀 ¡Récord de bajas!","#ff8a80"]);
    R.ach.forEach(function(n){bs.push(["🎖 Logro: "+n,"#b9f6ca"]);});
    var bx2=gx,byy=by+24,bp=clamp((t-DEATH_CINE-DEATH_PANEL_IN-2.45)/0.3,0,1);
    ctx.save();ctx.globalAlpha*=bp;
    for(i=0;i<Math.min(3,bs.length);i++){ctx.font="800 11px system-ui,-apple-system,sans-serif";var bw3=ctx.measureText(bs[i][0]).width+20;
      if(bx2+bw3>w-gx)break;ctx.fillStyle="rgba(0,0,0,0.4)";roundRect(ctx,bx2,byy,bw3,20,10);ctx.fill();ctx.strokeStyle=bs[i][1];ctx.lineWidth=1.2;roundRect(ctx,bx2,byy,bw3,20,10);ctx.stroke();
      mText(bs[i][0],bx2+10,byy+10,11,bs[i][1],"left","800",0);bx2+=bw3+8;}
    if(!bs.length)mText(D.firstRun?"¡Tu primera partida! Cada ronda te hace más fuerte.":"Sigue sumando XP para desbloquear aspectos y ventajas.",w/2,byy+10,11,"#c9a8a0","center","700",0);
    ctx.restore();
  }
  ctx.restore();
  /* buttons (cached faces from the menu) */
  if(k.btn){var ba=eOut((t-DEATH_CINE-DEATH_PANEL_IN-0.4)/0.35);
    if(typeof mButton==="function"){mButton("retry",L.retry.x,L.retry.y,L.retry.w,L.retry.h,"Reintentar","↻","play",{enter:ba,shine:1,fs:18});mButton("menu",L.menu.x,L.menu.y,L.menu.w,L.menu.h,"Menú","⌂","dark",{enter:ba,fs:18});}
  }
}
/* route draw/layout/input for the dead state */
(function(){
  var _de=drawEndScreen;
  drawEndScreen=function(won){if(!won&&DEATH&&!(layout&&layout.isPortrait))return; return _de(won);};
  var _rr=typeof drawRunRewards==="function"?drawRunRewards:null;
  if(_rr)drawRunRewards=function(){if(game&&game.state==="dead"&&DEATH)return;return _rr();};
  var _d=draw;
  draw=function(){
    if(game&&game.state==="dead"&&DEATH&&!(layout&&layout.isPortrait)){ctx.clearRect(0,0,SW,SH);drawDeathScreen();return;}
    return _d();
  };
  var _lm=layoutMenuButtons;
  layoutMenuButtons=function(){_lm();if(game&&game.state==="dead"&&DEATH){if(DEATH.t>=DEATH_CINE+DEATH_PANEL_IN+0.3){var L=deathLayout();menuBtns=[L.retry,L.menu];}else menuBtns=[];}};
  var _hm=handleMenuClick;
  handleMenuClick=function(id,st){
    if(game&&game.state==="dead"&&DEATH&&DEATH.t<DEATH_CINE+DEATH_PANEL_IN+0.3)return;
    if(id==="retry"){try{sfx("click");}catch(e){}ensureAudio();DEATH=null;startGame();return;}
    return _hm(id,st);
  };
  /* keep the buttons live as soon as they appear */
  var _u2=update;update=function(dt){_u2(dt);if(game&&game.state==="dead"&&DEATH&&!DEATH.btnOn&&DEATH.t>=DEATH_CINE+DEATH_PANEL_IN+0.3){DEATH.btnOn=1;layoutMenuButtons();}};
})();
/* damage dealt this run (for the stats) */
(function(){
  var _hz=hurtZombie;
  hurtZombie=function(z,dmg){var h=z&&z.hp||0,r=_hz.apply(this,arguments);try{var p=game&&game.player;if(p&&z&&game.state==="playing")p.dmgDealt=(p.dmgDealt||0)+Math.max(0,Math.min(h,h-Math.max(0,z.hp)));}catch(e){}return r;};
})();
