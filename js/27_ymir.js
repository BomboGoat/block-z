/* v22.1 — YMIR, EL REY DEL INVIERNO ETERNO. The igloo's final boss is now a colossal frost giant (Norse myth's
   primordial frost giant, public domain; a nod to the "ice-king who raises the dead" archetype: ice-spike crown,
   glowing eyes, frozen dead rising — original design, no copied names/costumes/lines).
   - ENTRY cinematic: Ymir sleeps encased in ice before his throne; the block cracks, his eyes ignite, it shatters,
     he roars and speaks, name card. Skippable (tap) after the first view.
   - ULTRA POWERS: before the fight you pick 1 of 3 ice ultra powers (Corazón de Ventisca, Lanza Boreal,
     Armadura Glaciar). Each has a passive and an automatic ULTRA strike on a cooldown. Cheap FX (cached glows, a
     few paths), card faces rendered once, one per frame.
   - Three phases: P1 fist slam / spike waves / icicles / backhand; P2 (66%) + freezing beam, raising the frozen
     dead, blizzards; P3 (33%) enrage "Invierno Eterno": faster, aura, avalanche ultimate, falling ice.
   - VICTORY cinematic: Ymir cracks, his last words, he shatters into pieces; then you leave the igloo and get
     "¡SEGUNDO MUNDO COMPLETADO!" with a reward (first win: Cofre Asombroso + 50 gemas; later: 10 gemas).
   - Synth SFX baked one per frame during the igloo transition (no hitch). Profile v6 (ultra picks, Ymir wins)
     migrated with a backup. Only runs inside the World 2 igloo; World 1 untouched. */
var YM={fx:[],beam:null,pick:null,reward:null,art:{},faces:{},bakeQ:null,lastUlt:0};
CAB_META.ymir={file:"assets/spr/ymir_f.webp",w:394,h:526,fx:0.551,fy:0.992,ex:0.519,ey:0.289};
CAB_META.ymir_cast={file:"assets/spr/ymir_cast_f.webp",w:404,h:526,fx:0.504,fy:0.992,ex:0.497,ey:0.212};
delete CAB_META.rey;
CAB_BOSS.ymir={name:"YMIR",tag:"El Rey del Invierno Eterno",hp:5200,r:30,h:100,speed:44,dmg:16,mus:"final",H:3.6,spr:"ymir"};
CAB_KEYS[3]="ymir";CAB.title[3]="Iglú de Ymir";
(function(){ /* if the cabin loader already ran, fetch the new sprites too */
  if(CAB.loading)["ymir","ymir_cast"].forEach(function(k){var tries=0;function go(){var im=new Image();im.onload=function(){CAB.spr[k]=im;};im.onerror=function(){if(++tries<4)setTimeout(go,1500*tries);};im.src=CAB_META[k].file+"?v=22.1"+(tries?"&r="+tries:"");}go();});
})();
var YM_ULTRA={
  ventisca:{n:"CORAZÓN DE VENTISCA",u:"TORMENTA POLAR",c:"#4fc3f7",c2:"#e1f5fe",cd:7,
    d:["Aura helada que daña sin parar","+ regeneras vida"],ud:"Cada 7 s: tormenta que lo arrasa todo"},
  boreal:{n:"LANZA BOREAL",u:"LANZAS DE AURORA",c:"#69f0ae",c2:"#b388ff",cd:5.5,
    d:["+30% de daño a todo","la aurora guía tus golpes"],ud:"Cada 5,5 s: 3 lanzas caen del cielo"},
  glaciar:{n:"ARMADURA GLACIAR",u:"PUÑO GLACIAR",c:"#448aff",c2:"#b3e5fc",cd:6,
    d:["-45% de daño recibido","+12% velocidad, inmune al frío"],ud:"Cada 6 s: un puño de hielo gigante"}
};
var YM_IDS=["ventisca","boreal","glaciar"];
function ymLoadArt(){YM_IDS.forEach(function(k){if(YM.art[k])return;var im=new Image();im.onload=function(){YM.art[k]=im;};im.src="assets/ui/ultra_"+k+".webp?v=22.1";YM.art[k]=0;});}
(function(){var _l=cabLoad;cabLoad=function(){ymLoadArt();return _l.apply(this,arguments);};})();
/* ---------- save: profile v6 (ultra picks + Ymir wins), versioned with a backup ---------- */
PROF_DEF.v=6;PROF_DEF.ultra={};
function profMigrate6(p){
  if(!p)return p;
  if((p.v|0)<6){
    try{lsSet("bz_profile_v5_backup",JSON.parse(JSON.stringify(p)));}catch(e){}
    p.ultra=p.ultra&&typeof p.ultra==="object"?p.ultra:{};
    p.v=6;p._migratedFrom5=Date.now();
  }
  if(!p.ultra||typeof p.ultra!=="object")p.ultra={};
  return p;
}
PROF=profMigrate6(PROF);profSave();
(function(){var _pl=profLoad;profLoad=function(){_pl();PROF=profMigrate6(PROF);return PROF;};})();
/* ---------- synthesized SFX (baked one per frame while walking into the igloo) ---------- */
var YM_SFX={ym_roar:2.4,ym_break:1.9,ym_slam:1.3,ym_beam:1.7,ym_raise:1.7,ym_pick:1.6,ym_nova:1.2,ym_lance:1.0,ym_fist:1.0,ym_win:3.2,ym_wind:3.0,ym_charge:0.9};
function ymSynth(name){
  var A=audio.ctx;if(!A)return null;
  var sr=A.sampleRate,dur=YM_SFX[name]||1,n=Math.floor(sr*dur),buf=A.createBuffer(1,n,sr),d=buf.getChannelData(0);
  var i,k,t,v,f,e,ph=0,ph2=0,ph3=0,lp=0,lp2=0,bp=0,pk=0,TAU=6.283185307,u;
  function nz(){return Math.random()*2-1;}
  for(i=0;i<n;i++){t=i/sr;u=t/dur;v=0;
    if(name==="ym_roar"){ /* colossal roar: sub growl + formant buzz + breath noise */
      f=(78-26*u)*(1+0.04*Math.sin(TAU*5*t))+nz()*4;ph+=TAU*f/sr;ph2+=TAU*f*0.5/sr;
      var s=0;for(k=1;k<=22;k++){var fk=f*k,a=Math.exp(-((fk-480)*(fk-480))/(260*260))+0.8*Math.exp(-((fk-1100)*(fk-1100))/(420*420))+0.1/k;s+=a*Math.sin(ph*k);}
      lp+=0.06*(nz()-lp);lp2+=0.3*(nz()-lp2);
      e=Math.min(1,t/0.12)*Math.min(1,(dur-t)/0.7);
      v=(s*0.2*(1+0.7*Math.sin(TAU*27*t+Math.sin(TAU*2*t)*5))+Math.sin(ph2)*0.55+lp*2.0+lp2*0.18)*e;
    }else if(name==="ym_break"){ /* creaking cracks building up, then a huge crystalline shatter */
      if(t<1.0){if(Math.random()<0.0008+0.006*u)pk=0.6+0.4*u;v=nz()*pk;pk*=0.988;v+=Math.sin(TAU*(55+30*u)*t)*0.25*u;}
      else{var q=t-1.0;lp+=0.55*(nz()-lp);v=(nz()-lp)*0.9*Math.exp(-q/0.25)+Math.sin(TAU*48*q)*0.9*Math.exp(-q/0.3);
        for(k=0;k<7;k++)v+=Math.sin(TAU*(1700+k*610)*q+k*1.7)*0.1*Math.exp(-q/(0.12+k*0.07));}
    }else if(name==="ym_slam"){ /* deep boom + ice crunch */
      f=60*Math.exp(-t*2.2)+28;ph+=TAU*f/sr;lp+=0.25*(nz()-lp);
      v=Math.sin(ph)*1.0*Math.exp(-t/0.45)+lp*0.9*Math.exp(-t/0.12)+nz()*0.25*Math.exp(-t/0.05);
      for(k=0;k<4;k++)v+=Math.sin(TAU*(2300+k*800)*t)*0.06*Math.exp(-t/(0.06+k*0.04));
    }else if(name==="ym_beam"){ /* frost beam: humming chord + shimmer */
      e=Math.min(1,t/0.15)*Math.min(1,(dur-t)/0.3);ph+=TAU*110/sr;ph2+=TAU*(165+4*Math.sin(TAU*6*t))/sr;ph3+=TAU*(880+60*Math.sin(TAU*13*t))/sr;
      lp+=0.15*(nz()-lp);v=(Math.sin(ph)*0.5+Math.sin(ph2)*0.35+Math.sin(ph3)*0.12*(0.5+0.5*Math.sin(TAU*21*t))+lp*0.5)*e;
    }else if(name==="ym_raise"){ /* eerie rising ghost choir */
      f=140+90*u;ph+=TAU*f/sr;ph2+=TAU*f*1.498/sr;ph3+=TAU*f*2.01/sr;
      e=Math.min(1,t/0.4)*Math.min(1,(dur-t)/0.4);var vib=1+0.3*Math.sin(TAU*5.5*t);
      v=(Math.sin(ph)*0.4+Math.sin(ph2)*0.3*vib+Math.sin(ph3)*0.15+Math.sin(ph*5)*0.06*vib)*e;lp+=0.03*(nz()-lp);v+=lp*0.8*e;
    }else if(name==="ym_pick"){ /* magical rising arpeggio + bell chord */
      var notes=[523.25,659.25,783.99,1046.5,1318.5],ni=Math.min(4,Math.floor(t/0.09));
      for(k=0;k<=ni;k++){var tk=t-k*0.09,fq=notes[k];v+=Math.sin(TAU*fq*tk)*0.22*Math.exp(-tk/0.6)+Math.sin(TAU*fq*2*tk)*0.06*Math.exp(-tk/0.3);}
      lp+=0.5*(nz()-lp);v+=(nz()-lp)*0.05*Math.exp(-t/0.4);
    }else if(name==="ym_nova"){ /* whoosh + crystal burst */
      var cut=0.02+0.4*Math.exp(-t*4);lp+=cut*(nz()-lp);v=lp*2.2*Math.min(1,t/0.03)*Math.exp(-t/0.45);
      for(k=0;k<6;k++)v+=Math.sin(TAU*(1500+k*450)*t+k)*0.08*Math.exp(-t/(0.2+k*0.05));
      v+=Math.sin(TAU*(70-30*u)*t)*0.6*Math.exp(-t/0.25);
    }else if(name==="ym_lance"){ /* falling zap + sparkle */
      f=2400*Math.exp(-t*7)+180;ph+=TAU*f/sr;v=(Math.sin(ph)>0?0.35:-0.35)*Math.exp(-t/0.35)*(t<0.25?1:0.6);
      lp+=0.4*(nz()-lp);v+=lp*0.4*Math.exp(-Math.max(0,t-0.2)/0.15)*(t>0.2?1:0);
      for(k=0;k<4;k++)v+=Math.sin(TAU*(2600+k*700)*t)*0.06*Math.exp(-Math.max(0,t-0.2)/0.25)*(t>0.2?1:0);
    }else if(name==="ym_fist"){ /* heavy crystal impact */
      f=90*Math.exp(-t*3)+35;ph+=TAU*f/sr;lp+=0.35*(nz()-lp);
      v=Math.sin(ph)*0.9*Math.exp(-t/0.3)+lp*0.7*Math.exp(-t/0.08);for(k=0;k<5;k++)v+=Math.sin(TAU*(1900+k*520)*t+k)*0.09*Math.exp(-t/(0.1+k*0.05));
    }else if(name==="ym_win"){ /* triumphant fanfare: brass-like major arpeggio into a held chord */
      var seq=[[0,392],[0.18,523.25],[0.36,659.25],[0.54,783.99]],hold=[523.25,659.25,783.99,1046.5];
      for(k=0;k<seq.length;k++){var tt=t-seq[k][0];if(tt<0)continue;var fe=seq[k][1],en=Math.min(1,tt/0.02)*(k<3?Math.exp(-tt/0.25):Math.min(1,(dur-t)/0.6));
        var br=0;for(var hm=1;hm<=6;hm++)br+=Math.sin(TAU*fe*hm*tt)*(1/hm)*(hm<3?1:0.6);v+=br*0.18*en;}
      if(t>0.75){var th=t-0.75,eh=Math.min(1,th/0.1)*Math.min(1,(dur-t)/0.7);for(k=0;k<4;k++){var vb=1+0.004*Math.sin(TAU*5*th+k);v+=(Math.sin(TAU*hold[k]*vb*th)+0.3*Math.sin(TAU*hold[k]*2*th))*0.09*eh;}}
      v+=Math.sin(TAU*65*t)*0.4*Math.exp(-t/0.4);
    }else if(name==="ym_wind"){ /* howling wind */
      var cw=0.01+0.03*(0.5+0.5*Math.sin(TAU*0.7*t+Math.sin(TAU*0.23*t)*2));lp+=cw*(nz()-lp);bp+=0.002*(lp-bp);
      e=Math.sin(Math.PI*u);ph+=TAU*(300+120*Math.sin(TAU*0.5*t))/sr;v=(lp*3-bp*2)*e+Math.sin(ph)*0.05*e*(0.5+0.5*Math.sin(TAU*0.9*t));
    }else if(name==="ym_charge"){ /* rising frost charge */
      f=200+900*u*u;ph+=TAU*f/sr;lp+=0.2*(nz()-lp);e=Math.min(1,t/0.05)*Math.min(1,(dur-t)/0.1);v=(Math.sin(ph)*0.3+Math.sin(ph*2.01)*0.15+lp*0.3*u)*e;
    }
    d[i]=v;
  }
  /* cheap one-time "hall" so the big ones ring out */
  if(name==="ym_roar"||name==="ym_slam"||name==="ym_win"||name==="ym_break"){var D1=Math.floor(sr*0.061),D2=Math.floor(sr*0.089),D3=Math.floor(sr*0.137);for(i=D3;i<n;i++)d[i]+=0.28*d[i-D1]+0.2*d[i-D2]+0.14*d[i-D3];}
  var mx=0;for(i=0;i<n;i++){v=Math.abs(d[i]);if(v>mx)mx=v;}
  if(mx>0){var g=0.92/mx;for(i=0;i<n;i++)d[i]*=g;}
  return buf;
}
function ymBakeOne(){ /* time-sliced: one sound per call */
  try{if(!audio.ctx||!ensureAudio())return 0;if(!audio.sfxBuf)audio.sfxBuf={};
    for(var k in YM_SFX){if(!audio.sfxBuf[k]){audio.sfxBuf[k]=ymSynth(k);return 1;}}}catch(e){}
  return 0;
}
function ymSfx(name,vol){
  try{if(!ensureAudio()||!audio.ctx)return;if(!audio._baked&&typeof bakeSfxSync==="function")bakeSfxSync();
    if(!audio.sfxBuf)audio.sfxBuf={};if(!audio.sfxBuf[name])audio.sfxBuf[name]=ymSynth(name);sfx(name,vol==null?0.9:vol);}catch(e){}
}
(function(){
  for(var k in YM_SFX)SFX_BOSS[k]=1;
  var _sa=sfxAllowed;
  sfxAllowed=function(name){if(typeof game!=="undefined"&&game&&game.state==="ymir_pick")return 1;return _sa.apply(this,arguments);};
})();
/* ---------- helpers ---------- */
function ymIsBoss(z){return z&&z.cab==="ymir";}
function ymBoss(){var b=game&&game.boss;return ymIsBoss(b)?b:null;}
function ymIn(){return cabW2()&&CAB.inside===3;}
function ymDmgMul(){var p=game.player;return (p&&p.damageMul||1)*(typeof atkMul==="function"&&p?atkMul(p):1);}
function ymSprH(){return cabSprH(CAB_BOSS.ymir.H);}
/* ---------- flow: entry cinematic -> ultra picker -> fight ---------- */
(function(){
  var _bs=cabBossStart;
  cabBossStart=function(i){
    if(i!==3)return _bs.apply(this,arguments);
    var D=CAB_DATA[3],z=cabSpawnBoss(3,D.boss.x,D.boss.y+32),p=game.player;
    game.graceT=1e9;game.spawnQueue=[];
    z.face=1;z.ph=1;z.cd=1.8;z.st="idle";z.ymInv=0;z.raiseCd=6;z.beamCd=4;z.avaCd=6;z.fallCd=2;z.frz=0;
    game.zombies.push(z);game.boss=z;game.bossSpawned=1;game.bossFight=0;
    YM.fx=[];YM.beam=null;p.ultra=null;
    CAB.cine={ymir:1,t:0,skip:!!(PROF.cine&&PROF.cine.ymir),bub:"",bubT:0,flash:0};game.state="cab_cine";
    try{stopMusic();}catch(e){}
    ymSfx("ym_wind",0.7);
  };
  var _cu=cabCineUpdate;cabCineUpdate=function(dt){if(CAB.cine&&CAB.cine.ymir)return ymCineUpdate(dt);if(CAB.cine&&CAB.cine.ywin)return ymWinUpdate(dt);return _cu.apply(this,arguments);};
  var _cd=cabDrawCine;cabDrawCine=function(){if(CAB.cine&&CAB.cine.ymir)return ymDrawCine();if(CAB.cine&&CAB.cine.ywin)return ymDrawWin();return _cd.apply(this,arguments);};
  var _cs=cabCineSkip;cabCineSkip=function(){var C=CAB.cine;if(C&&C.ymir){if(C.skip&&C.t>0.4&&C.t<7.2){C.t=7.2;C.done=1;C.bub="";}return;}if(C&&C.ywin)return;return _cs.apply(this,arguments);};
  /* bake the new sounds one per frame while the igloo door animation plays */
  var _tu=cabTransUpdate;cabTransUpdate=function(dt){if(CAB.trans&&CAB.trans.i===3&&CAB.trans.kind==="in")ymBakeOne();return _tu.apply(this,arguments);};
  var _rr=cabResetRun;cabResetRun=function(){YM.fx=[];YM.beam=null;YM.pick=null;YM.reward=null;return _rr.apply(this,arguments);};
  var _cc=cabClearCombat;cabClearCombat=function(){YM.fx=[];YM.beam=null;return _cc.apply(this,arguments);};
})();
var YM_LINES={wake:"Mil inviernos dormido… ¿y me despierta un mortal?",die:"El invierno… nunca… termina…"};
function ymCineUpdate(dt){
  var C=CAB.cine,z=game.boss,p=game.player,base=cabBase();
  if(!z){game.state="playing";CAB.cine=null;return;}
  C.t+=dt;var t=C.t;
  var zoom=t<1.2?0.82-0.1*smooth01(t/1.2):t<3.0?0.72:t<3.6?0.72+0.1*smooth01((t-3)/0.6):t<6.6?0.82:0.82+0.18*smooth01((t-6.6)/0.9);
  hellSetView(base*zoom);
  var cy0=z.y-ymSprH()/(CFG.YSCALE*layout.scale)*0.5;cabCam(t<0.6?p.x+(z.x-p.x)*smooth01(t/0.6):z.x,t<0.6?p.y+(cy0-p.y)*smooth01(t/0.6):cy0,1-Math.exp(-5*dt));
  p.anim=0;p.vx=p.vy=0;p.aimAng=p.facing=Math.atan2(z.y-p.y,z.x-p.x);z.face=p.x<z.x?-1:1;z.anim=(z.anim||0)+dt*2;
  if(C.bub)C.bubT+=dt;
  if(t>1.2&&!C.c1){C.c1=1;cabSfx("cab_crack",0.9);shake(3);}
  if(t>1.8&&!C.c2){C.c2=1;cabSfx("cab_crack",1);shake(4);}
  if(t>1.1&&!C.br){C.br=1;ymSfx("ym_break",1);}
  if(t>2.3&&!C.c3){C.c3=1;shake(6);}
  if(t>1.2&&t<2.95&&Math.random()<0.4)addParticle(z.x+rand(-30,30),z.y-rand(10,90),"#e1f5fe",0.5,rand(-30,30),rand(-30,10),rand(2,3),3);
  if(t>=2.95&&!C.sh){C.sh=1;C.flash=1;shake(22);ymSfx("ym_roar",1);
    for(var i=0;i<40;i++)addParticle(z.x+rand(-35,35),z.y-rand(0,100),i%3?"#b3e5fc":"#ffffff",1.1,rand(-260,260),rand(-260,60),rand(4,10),3);
    cabRing(z.x,z.y,420,240,0,"#e1f5fe",0);}
  if(t>3.0&&t<4.4&&Math.random()<0.5)shake(5);
  if(C.flash>0)C.flash-=dt*1.8;
  if(t>4.5&&!C.b1){C.b1=1;C.bub=YM_LINES.wake;C.bubT=0;}
  if(t>6.3&&C.bub)C.bub="";
  if(t>6.3&&!C.nm){C.nm=1;sfx("sting",0.9);ymSfx("ym_slam",0.7);shake(8);}
  if(typeof updateFX==="function")updateFX(dt);
  for(var j=CAB.fx.length-1;j>=0;j--){var o=CAB.fx[j];o.t+=dt;if(o.k==="ring"){o.r+=o.vr*dt;if(o.r>=o.maxR)CAB.fx.splice(j,1);}}
  if(t>=8.0)ymCineEnd();
}
function ymCineEnd(){
  var z=game.boss;CAB.cine=null;CAB.fx=[];
  if(z){z.st="idle";z.cd=2;}
  hellSetView(cabBase());
  try{PROF.cine.ymir=(PROF.cine.ymir|0)+1;profSave();}catch(e){}
  ymPickOpen();
}
/* ---------- ultra picker (frozen frame + 3 cards) ---------- */
function ymPickOpen(){
  ymLoadArt();
  YM.pick={t:0,chosen:null,ct:0,snap:null,cards:null,sw:0,sh:0,snd:[0,0,0]};game.state="ymir_pick";
  ymSfx("ym_charge",0.8);
}
function ymCardLayout(){
  var n=3,w=Math.round(Math.min(178,SW*0.25,(SH-110)/1.42)),h=Math.round(w*1.42),gap=Math.round(Math.min(26,SW*0.03)),tw=n*w+(n-1)*gap,x0=SW/2-tw/2,y0=Math.max(46,SH/2-h/2+8),out=[],i;
  for(i=0;i<n;i++)out.push({id:YM_IDS[i],x:x0+i*(w+gap),y:y0,w:w,h:h});return out;
}
function ymCardFace(id,w,h){
  var key=id+"_"+w+"_"+h;if(YM.faces[key])return YM.faces[key];
  var U=YM_ULTRA[id],pad=8,c=document.createElement("canvas"),dp=Math.min(2,window.devicePixelRatio||1);c.width=(w+pad*2)*dp;c.height=(h+pad*2)*dp;var g=c.getContext("2d");g.scale(dp,dp);g.translate(pad,pad);
  var bg=g.createLinearGradient(0,0,0,h);bg.addColorStop(0,"#0b1830");bg.addColorStop(1,"#050a16");g.fillStyle=bg;roundRect(g,0,0,w,h,12);g.fill();
  var im=YM.art[id],aw=w-14,ah=aw*0.86;
  g.save();roundRect(g,7,7,aw,ah,9);g.clip();if(im)g.drawImage(im,0,(im.height-im.height*0.86)/2,im.width,im.height*0.86,7,7,aw,ah);else{g.fillStyle=U.c;g.globalAlpha=0.4;g.fillRect(7,7,aw,ah);}
  var sh=g.createLinearGradient(0,7+ah*0.6,0,7+ah);sh.addColorStop(0,"rgba(5,10,22,0)");sh.addColorStop(1,"rgba(5,10,22,0.9)");g.globalAlpha=1;g.fillStyle=sh;g.fillRect(7,7,aw,ah);g.restore();
  g.lineWidth=3;var bd=g.createLinearGradient(0,0,w,h);bd.addColorStop(0,U.c2);bd.addColorStop(0.5,U.c);bd.addColorStop(1,U.c2);g.strokeStyle=bd;roundRect(g,1.5,1.5,w-3,h-3,11);g.stroke();
  g.textAlign="center";g.lineJoin="round";var fs=Math.max(10,Math.round(w*0.082)),y=7+ah-6;
  g.font="900 "+fs+"px system-ui";g.strokeStyle="#000";g.lineWidth=4;g.strokeText(U.n,w/2,y);g.fillStyle="#fff";g.fillText(U.n,w/2,y);
  y=7+ah+Math.round(fs*1.25);g.font="bold "+Math.max(9,Math.round(w*0.06))+"px system-ui";g.fillStyle="#cfe8ff";
  for(var i=0;i<U.d.length;i++){g.fillText(U.d[i],w/2,y);y+=Math.round(w*0.072);}
  y+=2;g.fillStyle=U.c;g.font="900 "+Math.max(9,Math.round(w*0.062))+"px system-ui";g.fillText("ULTRA: "+U.u,w/2,y);y+=Math.round(w*0.07);
  g.fillStyle="rgba(255,255,255,0.75)";g.font="italic "+Math.max(8,Math.round(w*0.054))+"px system-ui";g.fillText(U.ud,w/2,y);
  var F={c:c,pad:pad};YM.faces[key]=F;return F;
}
function ymPickReady(){var P=YM.pick;return P&&!P.chosen&&P.t>=0.12+2*0.16+0.35;}
function ymPickChoose(id){
  var P=YM.pick;if(!P||P.chosen||!YM_ULTRA[id])return;P.chosen=id;P.ct=0;ymSfx("ym_pick",1);sfx("rarity4",0.6);shake(6);
}
function ymApplyUltra(id){
  var p=game.player,z=game.boss;YM.pick=null;
  p.ultra=id;p.ultraT=YM_ULTRA[id].cd*0.6;p.ultraFx=0;p.ultraTick=0;
  try{PROF.ultra[id]=(PROF.ultra[id]|0)+1;profSave();}catch(e){}
  game.state="playing";game.bossFight=1;startMusic("final");p.invuln=Math.max(p.invuln,1.5);
  game.message="¡"+YM_ULTRA[id].n+"!";game.messageTimer=2.2;
  YM.fx.push({k:"burst",x:p.x,y:p.y,t:0,max:0.8,col:YM_ULTRA[id].c});
  for(var i=0;i<24;i++)addParticle(p.x,p.y-10,i%2?YM_ULTRA[id].c:YM_ULTRA[id].c2,0.8,rand(-200,200),rand(-220,40),rand(3,7),3);
  if(z){z.st="idle";z.cd=1.6;}
}
(function(){
  var _pre=hellPreUpdate;
  hellPreUpdate=function(dt){
    if(game&&game.state==="ymir_pick"){
      var P=YM.pick;if(!P){game.state="playing";return 1;}
      P.t+=dt;
      for(var i=0;i<3;i++){if(!P.snd[i]&&P.t>=0.12+i*0.16+0.15){P.snd[i]=1;sfx(i===2?"rarity4":"rarity3",0.7);}}
      if(P.sw===SW&&P.cards){for(i=0;i<3;i++){var c=P.cards[i];if(!YM.faces[c.id+"_"+c.w+"_"+c.h]&&(YM.art[c.id]||P.t>1.2)){ymCardFace(c.id,c.w,c.h);break;}}}
      if(P.chosen){P.ct+=dt;if(P.ct>=0.7)ymApplyUltra(P.chosen);}
      return 1;
    }
    if(game&&game.state==="playing"&&ymIn()&&game.player)ymTick(dt);
    return _pre.apply(this,arguments);
  };
  var _scr=hellDrawScreen;
  hellDrawScreen=function(){if(game&&game.state==="ymir_pick")return 1;return _scr.apply(this,arguments);};
  var _draw=draw;
  draw=function(){
    if(!(game&&game.state==="ymir_pick"&&YM.pick))return _draw.apply(this,arguments);
    var P=YM.pick;
    if(P.sw!==SW||P.sh!==SH){P.cards=ymCardLayout();P.sw=SW;P.sh=SH;P.snap=null;}
    if(!P.snap||P.snap.width!==canvas.width||P.snap.height!==canvas.height){
      _draw.apply(this,arguments);
      var sc=document.createElement("canvas");sc.width=canvas.width;sc.height=canvas.height;var sg=sc.getContext("2d");sg.drawImage(canvas,0,0);sg.fillStyle="rgba(2,8,20,0.64)";sg.fillRect(0,0,sc.width,sc.height);P.snap=sc;
      ctx.fillStyle="rgba(2,8,20,0.64)";ctx.fillRect(0,0,SW,SH);
    }else{var M=ctx.getTransform();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(P.snap,0,0);ctx.setTransform(M);}
    ymDrawPick();
  };
  window.addEventListener("pointerdown",function(e){
    try{if(!game||game.state!=="ymir_pick"||!YM.pick)return;e.stopPropagation();e.preventDefault();
      var P=YM.pick;if(!ymPickReady()||!P.cards)return;
      var q=pointerToScreen(e),i,c;for(i=0;i<P.cards.length;i++){c=P.cards[i];if(q.x>=c.x&&q.x<=c.x+c.w&&q.y>=c.y&&q.y<=c.y+c.h){ymPickChoose(c.id);return;}}
    }catch(err){}
  },true);
})();
function ymDrawPick(){
  var P=YM.pick,t=P.t,i,c,now=(game.time||0)+t;
  if(P.chosen){ctx.fillStyle="rgba(2,8,20,"+(0.45*clamp(P.ct/0.4,0,1))+")";ctx.fillRect(0,0,SW,SH);}
  ctx.save();ctx.textAlign="center";ctx.lineJoin="round";var ty=Math.max(30,P.cards[0].y-16),fs=Math.round(Math.min(24,SH*0.06));
  ctx.font="900 "+fs+"px system-ui";ctx.strokeStyle="#020a18";ctx.lineWidth=5;ctx.strokeText("Elige tu ULTRAPODER",SW/2,ty);
  var tg=ctx.createLinearGradient(0,ty-fs,0,ty);tg.addColorStop(0,"#ffffff");tg.addColorStop(1,"#4fc3f7");ctx.fillStyle=tg;ctx.fillText("Elige tu ULTRAPODER",SW/2,ty);
  var ready=ymPickReady();ctx.font="bold 11px system-ui";ctx.fillStyle=ready?"rgba(225,245,254,0.9)":"rgba(220,220,220,0.55)";
  var cb=P.cards[0].y+P.cards[0].h+16;if(cb<SH-4)ctx.fillText(P.chosen?"":ready?"Toca una carta para elegirla":"Invocando poderes…",SW/2,cb);
  ctx.restore();
  for(i=0;i<P.cards.length;i++){c=P.cards[i];var w=c.w,h=c.h,cx=c.x+w/2,cy=c.y+h/2,U=YM_ULTRA[c.id];
    var st=0.12+i*0.16,flipU=clamp((t-st)/0.3,0,1),face=flipU>=0.5,sx=flipU>=1?1:Math.abs(Math.cos(flipU*Math.PI));
    var sel=P.chosen===c.id,oth=P.chosen&&!sel,k=sel?smooth01(clamp(P.ct/0.35,0,1)):0,sc=1+0.14*k,al=oth?1-clamp(P.ct/0.3,0,1):1;if(al<=0)continue;
    var bob=face&&flipU>=1&&!P.chosen?Math.sin(now*2+i)*2:0,mx=sel?(SW/2-cx)*k:0;
    ctx.save();ctx.globalAlpha=al;ctx.translate(cx+mx,cy+bob);
    if(face){ctx.save();ctx.globalCompositeOperation="lighter";var pul=0.5+0.5*Math.sin(now*4+i),gz=Math.max(w,h)*(0.56+0.08*pul+0.3*k);ctx.globalAlpha=al*(0.3+0.2*pul+0.4*k);ctx.drawImage(glowSpr(U.c),-gz,-gz,gz*2,gz*2);
      if(typeof cuRays==="function"&&sel){ctx.rotate(now*0.5+i);var rs=Math.max(w,h);ctx.globalAlpha=al*(0.16+0.3*k);ctx.drawImage(cuRays(),-rs,-rs,rs*2,rs*2);}ctx.restore();}
    ctx.scale(sc*sx,sc);
    if(!face){var bg=ctx.createLinearGradient(0,-h/2,0,h/2);bg.addColorStop(0,"#163a63");bg.addColorStop(1,"#071426");ctx.fillStyle=bg;roundRect(ctx,-w/2,-h/2,w,h,12);ctx.fill();
      ctx.strokeStyle="#81d4fa";ctx.lineWidth=3;roundRect(ctx,-w/2+1.5,-h/2+1.5,w-3,h-3,11);ctx.stroke();
      ctx.save();ctx.globalAlpha=al*0.9;ctx.fillStyle="#b3e5fc";ctx.font="900 "+Math.round(w*0.3)+"px system-ui";ctx.textAlign="center";ctx.fillText("❄",0,w*0.1);ctx.restore();}
    else{var F=YM.faces[c.id+"_"+w+"_"+h];
      if(F)ctx.drawImage(F.c,-w/2-F.pad,-h/2-F.pad,w+F.pad*2,h+F.pad*2);
      else{ctx.fillStyle="#0b1830";roundRect(ctx,-w/2,-h/2,w,h,12);ctx.fill();ctx.strokeStyle=U.c;ctx.lineWidth=3;roundRect(ctx,-w/2+1.5,-h/2+1.5,w-3,h-3,11);ctx.stroke();ctx.fillStyle="#fff";ctx.font="900 12px system-ui";ctx.textAlign="center";ctx.fillText(U.n,0,0);}
      if(typeof cuShine==="function"){var ph=((now+i*0.5)%1.8)/1.8;ctx.save();roundRect(ctx,-w/2+5,-h/2+5,w-10,h-10,9);ctx.clip();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.35*al;ctx.rotate(0.35);ctx.drawImage(cuShine(),-w*0.9+ph*w*1.8-20,-h,40,h*2);ctx.restore();}
      if(flipU<1){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=(1-flipU)*1.4*al;ctx.fillStyle="#fff";roundRect(ctx,-w/2,-h/2,w,h,12);ctx.fill();}
      if(sel){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.4*(1-k*0.6);ctx.strokeStyle=U.c2;ctx.lineWidth=4;roundRect(ctx,-w/2-3,-h/2-3,w+6,h+6,14);ctx.stroke();}}
    ctx.restore();}
  if(P.chosen&&P.ct>0.45){ctx.save();ctx.globalAlpha=clamp((P.ct-0.45)/0.2,0,1)*0.85;ctx.fillStyle="#f2fbff";ctx.fillRect(0,0,SW,SH);ctx.restore();}
}
/* ---------- per-frame: ultra powers + boss fx ---------- */
function ymNearest(x,y,maxD,skipBoss){var b=null,bd=maxD||1e9,i,z,d;for(i=0;i<game.zombies.length;i++){z=game.zombies[i];if(z.dead||z.dying||(skipBoss&&z.isBoss))continue;d=dist(x,y,z.x,z.y);if(d<bd){bd=d;b=z;}}return b;}
function ymTick(dt){
  var p=game.player,z=ymBoss(),i,o,U=p.ultra&&YM_ULTRA[p.ultra],mul=ymDmgMul();
  if(U&&!CAB.won){
    p.ultraFx=(p.ultraFx||0)+dt;p.ultraT-=dt;
    if(p.ultra==="ventisca"){
      p.ultraTick-=dt;if(p.ultraTick<=0){p.ultraTick=0.25;
        for(i=0;i<game.zombies.length;i++){o=game.zombies[i];if(o.dead||o.dying)continue;if(dist(p.x,p.y,o.x,o.y)<84+(o.r||10)){hurtZombie(o,7*mul,p.x,1,{quiet:1,noCrit:1});o.ymChill=0.6;}}
        if(p.hp>0)p.hp=Math.min(p.maxHp,p.hp+0.7);}
      if(Math.random()<0.25){var a=Math.random()*6.283;addParticle(p.x+Math.cos(a)*80,p.y+Math.sin(a)*56,"#e1f5fe",0.5,-Math.sin(a)*60,Math.cos(a)*40-10,rand(2,3),3);}
    }
    if(p.ultraT<=0){p.ultraT=U.cd;ymUltraFire(p.ultra);}
  }
  for(i=YM.fx.length-1;i>=0;i--){o=YM.fx[i];o.t+=dt;
    if(o.k==="spk"){if(!o.hit&&o.t>=o.del){o.hit=1;if(!CAB.won&&dist(p.x,p.y,o.x,o.y)<o.r+p.r)hurtPlayer(p,o.dmg);if(o.snd)cabSfx("cab_crack",0.45);
        if(Math.random()<0.6)addParticle(o.x,o.y,"#b3e5fc",0.45,rand(-40,40),rand(-110,-40),rand(3,5),3);}
      if(o.t>=o.del+0.9)YM.fx.splice(i,1);}
    else if(o.k==="fist"){if(!o.hit&&o.t>=o.max){o.hit=1;ymSfx("ym_slam",1);shake(14);
        if(!CAB.won&&dist(p.x,p.y,o.x,o.y)<o.r+p.r){hurtPlayer(p,o.dmg);var pa=Math.atan2(p.y-o.y,p.x-o.x);moveWithSlide(p,Math.cos(pa)*26,Math.sin(pa)*26);}
        cabRing(o.x,o.y,300,o.r+60,Math.round(o.dmg*0.45),"#b3e5fc");var nc=o.p3?6:4,a0=Math.random()*6.283;for(var k=0;k<nc;k++)cabCrack(o.x,o.y,a0+k*6.283/nc,rand(90,150),Math.round(o.dmg*0.6),0.5);
        for(k=0;k<16;k++)addParticle(o.x,o.y,k%2?"#e1f5fe":"#81d4fa",0.7,rand(-200,200),rand(-180,0),rand(4,8),3);}
      if(o.t>=o.max+0.5)YM.fx.splice(i,1);}
    else if(o.k==="grave"){if(!o.done&&o.t>=o.max){o.done=1;var s=cabSpotNear(o.x,o.y,0,30,12)||o;var m=cabAdd(o.type,s.x,s.y,"ymDead");m.hp=m.maxHp=Math.round(m.maxHp*(o.type==="tank"?0.7:0.9));
        cabSfx("cab_shatter",0.5);for(var q=0;q<8;q++)addParticle(o.x,o.y,"#81d4fa",0.6,rand(-80,80),rand(-150,-30),rand(3,6),3);}
      if(o.t>=o.max+0.4)YM.fx.splice(i,1);}
    else if(o.k==="lance"){if(!o.hit&&o.t>=o.max){o.hit=1;ymSfx("ym_lance",0.8);shake(6);ymAoe(o.x,o.y,44,o.dmg,0.35);
        for(var q2=0;q2<14;q2++)addParticle(o.x,o.y,q2%2?"#69f0ae":"#b388ff",0.7,rand(-180,180),rand(-200,20),rand(3,6),3);}
      if(o.t>=o.max+0.5)YM.fx.splice(i,1);}
    else if(o.k==="ufist"){if(!o.hit&&o.t>=o.max){o.hit=1;ymSfx("ym_fist",1);shake(12);ymAoe(o.x,o.y,60,o.dmg,0.8);
        for(var q3=0;q3<18;q3++)addParticle(o.x,o.y,q3%2?"#448aff":"#b3e5fc",0.8,rand(-220,220),rand(-220,10),rand(4,8),3);}
      if(o.t>=o.max+0.7)YM.fx.splice(i,1);}
    else if(o.k==="nova"){o.r=o.maxR*smooth01(o.t/0.55);
      for(var j=0;j<game.zombies.length;j++){var zz=game.zombies[j];if(zz.dead||zz.dying||o.hitSet[j+"_"+zz.x])continue;if(dist(o.x,o.y,zz.x,zz.y)<o.r+(zz.r||10)&&!zz["ymN"+o.id]){zz["ymN"+o.id]=1;hurtZombie(zz,o.dmg,o.x,1,{noCrit:1});if(zz.isBoss)zz.frz=Math.max(zz.frz||0,0.8);else{var ka=Math.atan2(zz.y-o.y,zz.x-o.x);moveWithSlide(zz,Math.cos(ka)*30,Math.sin(ka)*30);}}}
      if(o.t>=0.9)YM.fx.splice(i,1);}
    else if(o.t>=(o.max||0.8))YM.fx.splice(i,1);
  }
  if(YM.beam)ymBeamTick(dt,z);
}
function ymAoe(x,y,r,dmg,frz){
  for(var i=0;i<game.zombies.length;i++){var o=game.zombies[i];if(o.dead||o.dying)continue;if(dist(x,y,o.x,o.y)<r+(o.r||10)){hurtZombie(o,dmg,x,1,{noCrit:1});if(o.isBoss&&frz)o.frz=Math.max(o.frz||0,frz);}}
}
var YM_NID=0;
function ymUltraFire(id){
  var p=game.player,z=ymBoss(),U=YM_ULTRA[id],mul=ymDmgMul(),i;
  YM.lastUlt=game.time||0;floatText(p.x,p.y-34,"¡"+U.u+"!",U.c2);
  if(id==="ventisca"){ymSfx("ym_nova",1);shake(9);YM.fx.push({k:"nova",x:p.x,y:p.y,t:0,r:0,maxR:190,dmg:150*mul,id:++YM_NID,hitSet:{}});
    for(i=0;i<26;i++){var a=i*6.283/26;addParticle(p.x+Math.cos(a)*20,p.y+Math.sin(a)*14,i%2?"#ffffff":"#81d4fa",0.7,Math.cos(a)*320,Math.sin(a)*220,rand(3,6),3);}}
  else if(id==="boreal"){var tg=[],nb;if(z&&!z.dying)tg.push(z);
    for(i=0;i<game.zombies.length&&tg.length<3;i++){nb=game.zombies[i];if(!nb.dead&&!nb.dying&&!nb.isBoss&&dist(p.x,p.y,nb.x,nb.y)<330)tg.push(nb);}
    while(tg.length<3&&z&&!z.dying)tg.push({x:z.x+rand(-40,40),y:z.y+rand(-26,26)});
    if(!tg.length){var nn=ymNearest(p.x,p.y,360);if(nn)tg.push(nn);}
    for(i=0;i<tg.length;i++)YM.fx.push({k:"lance",x:tg[i].x,y:tg[i].y,t:-i*0.14,max:0.38,dmg:110*mul,a:rand(-0.25,0.25)});
    sfx("zap",0.6);}
  else if(id==="glaciar"){var tz=z&&!z.dying&&dist(p.x,p.y,z.x,z.y)<330?z:ymNearest(p.x,p.y,330);var tx=tz?tz.x:p.x+Math.cos(p.aimAng||0)*80,ty=tz?tz.y:p.y+Math.sin(p.aimAng||0)*60;
    YM.fx.push({k:"ufist",x:tx,y:ty,t:0,max:0.42,dmg:190*mul});ymSfx("ym_charge",0.5);}
}
(function(){
  /* Lanza Boreal: +30% damage; Ymir's phase shield */
  var _hz=hurtZombie;
  hurtZombie=function(z,dmg,fromX,noChain,opts){
    if(z&&ymIsBoss(z)&&z.ymInv>0){z.hitFlash=0.06;return;}
    var p=game&&game.player;if(p&&p.ultra==="boreal"&&ymIn())dmg*=1.3;
    return _hz.call(this,z,dmg,fromX,noChain,opts);
  };
  /* Armadura Glaciar: -45% damage taken */
  var _hp=hurtPlayer;
  hurtPlayer=function(p,dmg){
    if(typeof p==="number"){dmg=p;p=game&&game.player;}
    if(p&&p.ultra==="glaciar"&&ymIn())dmg*=0.55;
    return _hp.call(this,p,dmg);
  };
  var _tsm=terrainSpeedMul;
  terrainSpeedMul=function(x,y){var m=_tsm.apply(this,arguments),p=game&&game.player;
    if(p&&p.ultra==="glaciar"&&ymIn()&&x===p.x&&y===p.y){if(p.cabSlow)m*=2;m*=1.12;}
    if(p&&ymIn()&&YM.chillT>0&&x===p.x&&y===p.y&&p.ultra!=="glaciar")m*=0.6;
    return m;};
})();
/* ---------- boss AI ---------- */
(function(){
  var _bu=cabBossUpdate;
  cabBossUpdate=function(z,dt){if(ymIsBoss(z))return ymBossUpdate(z,dt);return _bu.apply(this,arguments);};
})();
function ymBossUpdate(z,dt){
  var p=game.player,dx=p.x-z.x,dy=p.y-z.y,d=Math.sqrt(dx*dx+dy*dy)||1,f=z.hp/z.maxHp;
  z.anim=(z.anim||0)+dt*5;z.touchCd-=dt;z.stT-=dt;if(z.ymInv>0)z.ymInv-=dt;YM.chillT=(YM.chillT||0)-dt;
  if(z.frz>0){z.frz-=dt;return;}
  /* phase changes */
  if(z.ph===1&&f<0.66){ymPhase(z,2);return;}
  if(z.ph===2&&f<0.33){ymPhase(z,3);return;}
  if(z.st==="phase"){if(z.stT<=0){z.st="idle";z.cd=0.8;}return;}
  var P3=z.ph===3,spd=z.speed*(P3?1.3:z.ph===2?1.12:1),rate=P3?1.45:z.ph===2?1.2:1;
  z.raiseCd-=dt;z.beamCd-=dt;z.avaCd-=dt;
  if(P3){z.fallCd-=dt;if(z.fallCd<=0){z.fallCd=1.5;var s0=cabSpotNear(p.x,p.y,0,60,8);if(s0)cabIcicle(s0.x,s0.y,Math.round(z.damage*0.9),0.95);}}
  if(z.st==="idle"){
    cabFace(z,Math.atan2(dy,dx));if(d>80)cabChase(z,spd,dt,dx,dy,d);
    z._fs=(z._fs||0)+spd*dt;if(z._fs>30){z._fs=0;sfx("foot_heavy",0.6);shake(P3?3:2);}
    z.cd-=dt*rate;
    if(z.cd<=0){var r=Math.random();
      if(P3&&z.avaCd<=0){z.st="ava_w";z.stT=1.2;z.avaCd=16;ymSfx("ym_roar",0.8);game.message="¡INVIERNO ETERNO!";game.messageTimer=1.6;}
      else if(z.ph>=2&&z.raiseCd<=0&&cabAlive("ymDead")<(P3?6:4)){z.st="raise_w";z.stT=1.0;z.raiseCd=P3?11:14;ymSfx("ym_raise",0.9);}
      else if(z.ph>=2&&z.beamCd<=0&&d>70){z.st="beam_w";z.stT=0.95;z.la=Math.atan2(dy,dx);z.beamCd=P3?7:9;ymSfx("ym_charge",0.9);}
      else if(d<110&&r<0.45){z.st="sweep_w";z.stT=0.55;z.la=Math.atan2(dy,dx);}
      else if(r<0.42){z.st="fist_w";z.stT=0.9;z.tx=p.x;z.ty=p.y;}
      else if(r<0.72){z.st="spk_w";z.stT=0.6;z.la=Math.atan2(dy,dx);}
      else if(z.ph>=2&&r<0.86){z.st="bliz_w";z.stT=0.6;cabSfx("cab_bliz",0.7);}
      else{z.st="rain_w";z.stT=0.55;}
    }
  }else if(z.st==="fist_w"){z.tx+=(p.x-z.tx)*Math.min(1,dt*2.5);z.ty+=(p.y-z.ty)*Math.min(1,dt*2.5);cabFace(z,Math.atan2(z.ty-z.y,z.tx-z.x));
    if(z.stT<=0){var nf=P3?3:1,j;YM.fx.push({k:"fist",x:z.tx,y:z.ty,t:0,max:0.5,r:62,dmg:Math.round(z.damage*1.6),p3:P3});
      for(j=1;j<nf;j++){var sf=cabSpotNear(p.x,p.y,60,130,10);if(sf)YM.fx.push({k:"fist",x:sf.x,y:sf.y,t:-0.25*j,max:0.5,r:56,dmg:Math.round(z.damage*1.4),p3:P3});}
      z.st="rec";z.stT=0.75;}}
  else if(z.st==="spk_w"){z.la=Math.atan2(dy,dx)*0.3+z.la*0.7;cabFace(z,z.la);
    if(z.stT<=0){var nl=z.ph===1?1:z.ph===2?3:5,k,m;for(k=0;k<nl;k++){var aa=z.la+(k-(nl-1)/2)*0.32;
        for(m=1;m<=14;m++){var sx=z.x+Math.cos(aa)*(z.r+m*24),sy=z.y+Math.sin(aa)*(z.r+m*24);if(sampleSDF(sx,sy)<4)break;YM.fx.push({k:"spk",x:sx,y:sy,t:0,del:0.08+m*0.055,r:16,dmg:Math.round(z.damage*1.1),snd:m%4===1});}}
      ymSfx("ym_slam",0.6);shake(6);z.st="rec";z.stT=0.6;}}
  else if(z.st==="sweep_w"){z.la=Math.atan2(dy,dx)*0.2+z.la*0.8;cabFace(z,z.la);if(z.stT<=0){CAB.fx.push({k:"slash",x:z.x,y:z.y,a:z.la,r:118,w:1.05,dmg:Math.round(z.damage*1.5),t:0});sfx("slash",0.9);ymSfx("ym_fist",0.5);shake(8);z.st="rec";z.stT=0.55;}}
  else if(z.st==="rain_w"){if(z.stT<=0){var nn=P3?9:z.ph===2?7:5;cabIcicle(p.x,p.y,Math.round(z.damage*1.2),1.0);for(var i2=1;i2<nn;i2++){var s=cabSpotNear(p.x,p.y,30,130,10);if(s)cabIcicle(s.x,s.y,Math.round(z.damage*1.2),0.9+i2*0.09);}z.st="rec";z.stT=0.45;}}
  else if(z.st==="bliz_w"){if(z.stT<=0){var dm=Math.max(4,Math.round(z.damage*0.5));CAB.zones.push({x:p.x,y:p.y,r:50,t:0,grow:0.6,life:5,dmg:dm});var s3=cabSpotNear(p.x,p.y,90,170,20);if(s3)CAB.zones.push({x:s3.x,y:s3.y,r:46,t:0,grow:0.6,life:5,dmg:dm});z.st="rec";z.stT=0.4;}}
  else if(z.st==="raise_w"){if(z.stT<=0){var types=P3?["normal","fast","tank","normal","fast"]:["normal","fast","normal","tank"],q;
      for(q=0;q<types.length;q++){var sg=cabSpotNear(z.x,z.y,60,200,14);if(sg)YM.fx.push({k:"grave",x:sg.x,y:sg.y,t:-q*0.12,max:1.0,type:types[q]});}
      game.message="¡Los muertos helados despiertan!";game.messageTimer=1.6;z.st="rec";z.stT=0.5;}}
  else if(z.st==="beam_w"){z.la=Math.atan2(dy,dx)*0.25+z.la*0.75;cabFace(z,z.la);if(z.stT<=0){YM.beam={a:z.la,t:0,dur:P3?2.2:1.7,tick:0,turn:P3?0.85:0.6};ymSfx("ym_beam",0.9);shake(5);z.st="beam";z.stT=YM.beam.dur;}}
  else if(z.st==="beam"){if(z.stT<=0||!YM.beam){YM.beam=null;z.st="rec";z.stT=0.6;}}
  else if(z.st==="ava_w"){if(z.stT<=0){ymAvalanche(z);z.st="rec";z.stT=1.0;}}
  else if(z.st==="rec"){if(z.stT<=0){z.st="idle";z.cd=rand(0.7,1.4);}}
  if(z.y<YM_MINY)z.y+=(YM_MINY-z.y)*Math.min(1,dt*6);
  if(z.touchCd<=0&&d<z.r+p.r+2){hurtPlayer(p,Math.round(z.damage*0.8));z.touchCd=0.9;}
}
var YM_MINY=180;
function ymPhase(z,n){
  var p=game.player;z.ph=n;z.st="phase";z.stT=1.5;z.ymInv=1.5;YM.beam=null;
  ymSfx("ym_roar",1);shake(16);cabRing(z.x,z.y,380,220,Math.round(z.damage*0.6),"#e1f5fe",1);
  YM.fx.push({k:"burst",x:z.x,y:z.y-40,t:0,max:1.0,col:"#4fc3f7"});
  game.message=n===2?"FASE 2 · ¡Los muertos helados despiertan!":"FASE FINAL · ¡INVIERNO ETERNO!";game.messageTimer=2.4;
  floatText(z.x,z.y-z.h,n===2?"¡FASE 2!":"¡FURIA ETERNA!","#4fc3f7");
  for(var i=0;i<26;i++)addParticle(z.x+rand(-30,30),z.y-rand(0,90),i%2?"#e1f5fe":"#4fc3f7",0.9,rand(-220,220),rand(-220,20),rand(4,8),3);
  if(n===3){z.avaCd=2.5;z.fallCd=1;}
}
function ymBeamTick(dt,z){
  var B=YM.beam,p=game.player;if(!z||z.dying||CAB.won){YM.beam=null;return;}
  B.t+=dt;var want=Math.atan2(p.y-z.y,p.x-z.x),da=Math.atan2(Math.sin(want-B.a),Math.cos(want-B.a));B.a+=clamp(da,-B.turn*dt,B.turn*dt);cabFace(z,B.a);
  var x0=z.x+Math.cos(B.a)*(z.r+6),y0=z.y+Math.sin(B.a)*(z.r+6)-0,L=440,x1=x0+Math.cos(B.a)*L,y1=y0+Math.sin(B.a)*L;B.x0=x0;B.y0=y0;B.x1=x1;B.y1=y1;
  B.tick-=dt;if(segDist(p.x,p.y,x0,y0,x1,y1)<p.r+13){YM.chillT=0.5;if(B.tick<=0){B.tick=0.28;hurtPlayer(p,Math.max(4,Math.round(z.damage*0.45)));}}
  if(Math.random()<0.7){var u=Math.random();addParticle(x0+(x1-x0)*u,y0+(y1-y0)*u,"#e1f5fe",0.35,rand(-30,30),rand(-50,-10),rand(2,4),3);}
  if(B.t>=B.dur)YM.beam=null;
}
function ymAvalanche(z){
  var p=game.player,k,i;ymSfx("ym_slam",1);shake(18);
  cabRing(z.x,z.y,260,320,Math.round(z.damage*0.9),"#e1f5fe",1);
  YM.fx.push({k:"burst",x:z.x,y:z.y-40,t:0,max:1.0,col:"#e1f5fe"});
  /* three waves of falling ice around you, each leaving a gap to dodge into */
  for(k=0;k<3;k++){var gap=Math.random()*6.283;for(i=0;i<10;i++){var a=i*6.283/10;if(Math.abs(Math.atan2(Math.sin(a-gap),Math.cos(a-gap)))<0.5)continue;var rr=36+k*34,x=p.x+Math.cos(a)*rr,y=p.y+Math.sin(a)*rr*0.75;if(sampleSDF(x,y)<4)continue;cabIcicle(x,y,Math.round(z.damage*1.1),1.0+k*0.55);}}
  cabIcicle(p.x,p.y,Math.round(z.damage*1.1),1.0);
}
/* camera: in the Ymir fight the view opens 10% and leans up (max 34% of the view) so the giant's crown stays on screen */
(function(){
  var _uc=updateCam;
  updateCam=function(dt){
    var b=ymBoss();
    if(!(b&&!b.dying&&ymIn()&&game.state==="playing"))return _uc.apply(this,arguments);
    var p=game.player,k=1-Math.exp(-CFG.CAM_LERP*dt),base=layout.baseViewW||380,want=Math.round(base*1.1);
    if(layout.viewW!==want){layout.viewW=want;layout.scale=layout.gameDrawW/layout.viewW;layout.viewH=layout.gameDrawH/(layout.scale*CFG.YSCALE);W=layout.viewW;H=layout.viewH;}
    var vw=worldW(),vh=worldH(),headH=ymSprH()/(CFG.YSCALE*layout.scale),headY=b.y-headH*1.02,tx=p.x,ty=p.y,lim=vh*0.34,hi=headY+vh*0.5-vh*0.12;
    if(ty>hi)ty=Math.max(hi,p.y-lim);
    tx+=clamp((b.x-p.x)*0.2,-vw*0.08,vw*0.08);
    game.camX+=(tx-game.camX)*k;game.camY+=(ty-game.camY)*k;
    var hw=vw*0.5,hh=vh*0.5;
    game.camX=CFG.MAP_W>2*hw+16?clamp(game.camX,hw+8,CFG.MAP_W-hw-8):CFG.MAP_W/2;
    game.camY=CFG.MAP_H>2*hh+16?clamp(game.camY,hh+8,CFG.MAP_H-hh-8):CFG.MAP_H/2;
    if(game.shake>0){game.camX+=(Math.random()-0.5)*game.shake;game.camY+=(Math.random()-0.5)*game.shake;}
  };
})();
/* ---------- death -> victory cinematic ---------- */
(function(){
  var _kz=killZombie;
  killZombie=function(z){
    var was=z&&!z.dying&&!z.dead&&ymIsBoss(z)&&CAB.inside===3;
    var r=_kz.apply(this,arguments);
    if(was){
      z.deathT=99;YM.beam=null;YM.fx=[];game.message=null;game.messageTimer=0;
      game.zombies=game.zombies.filter(function(o){return o===z;});game.projectiles.length=0;CAB.zones=[];CAB.cracks=[];
      var p=game.player;p.vx=p.vy=0;
      CAB.cine={ywin:1,t:0,x:z.x,y:z.y,face:z.face||1,bub:"",bubT:0,flash:0,pcs:null};game.state="cab_cine";
      try{stopMusic();}catch(e){}
      ymSfx("ym_break",0.9);
      ymGrantReward();
    }
    return r;
  };
})();
function ymGrantReward(){
  try{var w=PROF.worlds&&PROF.worlds.w2;if(!w)return;var first=!(w.ymir|0);w.ymir=(w.ymir|0)+1;
    var R={first:first,gems:0,chest:null,full:0};
    if(first){var ci=chestGrant("asombroso");if(ci>=0)R.chest="asombroso";else R.full=1;R.gems=gemsAdd(R.full?80:50,"ymir");}
    else R.gems=gemsAdd(10,"ymir");
    YM.reward=R;profSave();}catch(e){}
}
function ymWinUpdate(dt){
  var C=CAB.cine,p=game.player,base=cabBase();C.t+=dt;var t=C.t;
  hellSetView(base*(t<0.8?1-0.3*smooth01(t/0.8):t<4.0?0.7:0.7+0.3*smooth01((t-4.0)/1.2)));
  var wy=C.y-ymSprH()/(CFG.YSCALE*layout.scale)*0.45,pu=smooth01(clamp((t-3.3)/1.2,0,1));cabCam(C.x+(p.x-C.x)*0.5*pu,wy+((C.y+p.y)*0.5-wy)*pu,1-Math.exp(-4*dt));
  p.vx=p.vy=0;p.aimAng=p.facing=Math.atan2(C.y-p.y,C.x-p.x);
  if(C.bub)C.bubT+=dt;
  if(t>0.3&&!C.k1){C.k1=1;cabSfx("cab_crack",1);shake(5);}
  if(t>0.9&&!C.k2){C.k2=1;cabSfx("cab_crack",1);shake(6);}
  if(t>0.6&&!C.b1){C.b1=1;C.bub=YM_LINES.die;C.bubT=0;}
  if(t>2.2&&C.bub)C.bub="";
  if(t<2.4&&Math.random()<0.5)shake(2+3*t);
  if(t>=2.4&&!C.sh){C.sh=1;C.flash=1;shake(24);cabSfx("cab_shatter",1);ymSfx("ym_slam",1);
    var M=CAB_META.ymir,h=ymSprH()/layout.scale,w=h*M.w/M.h,cols=4,rows=5,i,j;C.pcs=[];
    for(j=0;j<rows;j++)for(i=0;i<cols;i++){var cx=(i+0.5)/cols,cy=(j+0.5)/rows,ox=(cx-M.fx)*w*C.face,oy=-(M.fy-cy)*h;
      C.pcs.push({i:i,j:j,x:ox,y:oy,vx:ox*3.4+rand(-90,90),vy:-rand(40,190),r:0,vr:rand(-5,5),a:1});}
    for(i=0;i<46;i++)addParticle(C.x+rand(-30,30),C.y-rand(0,110),i%3?"#b3e5fc":"#ffffff",1.2,rand(-300,300),rand(-320,40),rand(4,10),3);
    cabRing(C.x,C.y,420,300,0,"#e1f5fe",0);}
  if(C.pcs){for(var q=0;q<C.pcs.length;q++){var P=C.pcs[q];P.vy+=520*dt;P.x+=P.vx*dt;P.y+=P.vy*dt;P.r+=P.vr*dt;if(P.y>0){P.y=0;P.vy*=-0.25;P.vx*=0.6;P.vr*=0.5;}if(t>4.4)P.a=Math.max(0,P.a-dt*0.9);}}
  if(t>=2.9&&!C.fan){C.fan=1;ymSfx("ym_win",1);}
  if(C.flash>0)C.flash-=dt*1.4;
  if(t>3.0){p.lift=Math.abs(Math.sin((t-3.0)*7))*6*(t<5?1:0);}
  for(var j2=CAB.fx.length-1;j2>=0;j2--){var o=CAB.fx[j2];o.t+=dt;if(o.k==="ring"){o.r+=o.vr*dt;if(o.r>=o.maxR)CAB.fx.splice(j2,1);}}
  if(typeof updateFX==="function")updateFX(dt);
  if(t>=6.2)ymWinEnd();
}
function ymWinEnd(){
  var p=game.player,z=game.boss;CAB.cine=null;p.lift=0;hellSetView(cabBase());
  if(z){z.dead=1;z.deathT=0;var i=game.zombies.indexOf(z);if(i>=0)game.zombies.splice(i,1);}
  game.boss=null;game.state="playing";
  if(!CAB.won)cabWin();
  game.message=null;game.messageTimer=0;
  CAB.wonT=1;cabStartTrans("out");
}
/* ---------- drawing ---------- */
(function(){
  var _dz=cabDrawZ;
  cabDrawZ=function(z){if(ymIsBoss(z))return ymDrawBoss(z);return _dz.apply(this,arguments);};
  var _dg=cabDrawGround;
  cabDrawGround=function(){var r=_dg.apply(this,arguments);if(ymIn())ymDrawGround();return r;};
  var _do=cabDrawOver;
  cabDrawOver=function(){var r=_do.apply(this,arguments);if(ymIn())ymDrawOver();return r;};
  var _ld=drawLevelDone;
  drawLevelDone=function(){_ld.apply(this,arguments);try{if(game.hell&&game.hell.w2&&YM.reward)ymDrawReward();}catch(e){}};
})();
function ymEyes(x,y,h,face,key,a){
  var M=CAB_META[key],s=toScreen(x,y),w=h*M.w/M.h,ex=s.x+(M.ex-M.fx)*w*face,ey=s.y-(M.fy-M.ey)*h,t=game.time||0,g=h*0.09*(1+0.15*Math.sin(t*6));
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=a*(0.75+0.25*Math.sin(t*6));ctx.drawImage(glowSpr("#4fc3f7"),ex-g,ey-g,g*2,g*2);ctx.restore();
}
function ymDrawBoss(z){
  var t=game.time||0,C=CAB.cine,h=ymSprH(),face=z.face||1,sc=layout.scale;
  if(C&&C.ywin){ymDrawShatter(z);return;}
  var cast=z.st==="fist_w"||z.st==="raise_w"||z.st==="phase"||z.st==="ava_w"||z.st==="beam_w"||z.st==="beam"||(C&&C.ymir&&C.t>2.95&&C.t<5.0);
  var key=cast?"ymir_cast":"ymir",bob=Math.sin(z.anim*1.0)*0.016,s=toScreen(z.x,z.y);
  if(z.ph===3||z.st==="phase"){ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.3+0.14*Math.sin(t*5);var g2=h*0.75;ctx.drawImage(glowSpr("#4fc3f7"),s.x-g2,s.y-h*0.95,g2*2,g2*1.7);ctx.restore();}
  cabShadow(z.x,z.y,z.r*1.5+8,0);
  var encased=C&&C.ymir&&C.t<2.95;
  var sq=z.st==="fist_w"?1+0.04*clamp(1-z.stT/0.9,0,1):1;
  cabDrawSpr(key,z.x,z.y,h*sq,face,{alpha:encased?0.82:1,sy:1+bob,sx:1-bob*0.5,flash:!encased&&(z.hitFlash>0||z.frz>0&&Math.sin(t*20)>0),rot:z.st==="sweep_w"?-0.05*face:0});
  if(z.frz>0){ctx.save();ctx.globalAlpha=0.35;ctx.fillStyle="#b3e5fc";var fw=h*0.5;ctx.fillRect(s.x-fw/2,s.y-h*0.9,fw,h*0.9);ctx.restore();}
  if(encased)ymDrawIceBlock(z,h,C.t);
  else ymEyes(z.x,z.y,h,face,key,1);
  if(z.ymInv>0){ctx.save();ctx.globalAlpha=0.35+0.2*Math.sin(t*14);ctx.strokeStyle="#e1f5fe";ctx.lineWidth=3*sc;ctx.beginPath();ctx.ellipse(s.x,s.y-h*0.45,h*0.42,h*0.56,0,0,7);ctx.stroke();ctx.restore();}
}
function ymDrawIceBlock(z,h,t){
  var s=toScreen(z.x,z.y),w=h*0.78,top=s.y-h*1.04,sc=layout.scale,crk=clamp((t-1.1)/1.8,0,1);
  ctx.save();
  var g=ctx.createLinearGradient(0,top,0,s.y);g.addColorStop(0,"rgba(225,245,254,0.55)");g.addColorStop(1,"rgba(129,212,250,0.42)");ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(s.x-w*0.5,s.y+4*sc);ctx.lineTo(s.x-w*0.56,top+h*0.2);ctx.lineTo(s.x-w*0.3,top);ctx.lineTo(s.x+w*0.25,top-h*0.04);ctx.lineTo(s.x+w*0.55,top+h*0.16);ctx.lineTo(s.x+w*0.5,s.y+4*sc);ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,0.8)";ctx.lineWidth=2*sc;ctx.stroke();
  ctx.globalAlpha=0.35;ctx.fillStyle="#ffffff";ctx.beginPath();ctx.moveTo(s.x-w*0.42,top+h*0.24);ctx.lineTo(s.x-w*0.3,top+h*0.06);ctx.lineTo(s.x-w*0.2,top+h*0.08);ctx.lineTo(s.x-w*0.34,top+h*0.6);ctx.closePath();ctx.fill();
  if(crk>0){ctx.globalAlpha=1;ctx.lineCap="round";var seeds=[[0.1,0.35],[-0.2,0.55],[0.25,0.7],[-0.05,0.2],[0.3,0.3],[-0.3,0.25]];
    for(var i=0;i<seeds.length;i++){var u=clamp(crk*1.6-i*0.15,0,1);if(u<=0)continue;var cx=s.x+seeds[i][0]*w,cy=top+seeds[i][1]*h;
      ctx.strokeStyle="rgba(255,255,255,0.95)";ctx.lineWidth=2*sc;ctx.beginPath();ctx.moveTo(cx,cy);
      for(var k=1;k<=4;k++){var a=i*1.7+k*0.9,l=k*h*0.05*u;ctx.lineTo(cx+Math.cos(a)*l*1.3,cy+Math.sin(a)*l);}ctx.stroke();
      ctx.strokeStyle="rgba(79,195,247,0.9)";ctx.lineWidth=0.9*sc;ctx.stroke();}
    if(t>1.6){var ea=clamp((t-1.6)/0.5,0,1);ymEyes(z.x,z.y,h,z.face||1,"ymir",ea);}}
  ctx.restore();
}
function ymDrawShatter(z){
  var C=CAB.cine,M=CAB_META.ymir,im=CAB.spr.ymir,h=ymSprH(),w=h*M.w/M.h,s=toScreen(C.x,C.y),sc=layout.scale,t=C.t;if(!im)return;
  if(!C.pcs){ /* cracking: kneel + glowing cracks + shudder */
    var sh=t>0.2?rand(-2,2)*sc*Math.min(1,t):0,kneel=smooth01(clamp(t/1.2,0,1));
    cabShadow(C.x,C.y,z.r*1.5+8,0);
    cabDrawSpr("ymir",C.x,C.y,h*(1-0.08*kneel),C.face,{dx:sh,sy:1-0.05*kneel,flash:Math.sin(t*12)>0.3});
    var top=s.y-h*0.95,crk=clamp(t/2.2,0,1);ctx.save();ctx.globalCompositeOperation="lighter";ctx.lineCap="round";
    for(var i=0;i<8;i++){var u=clamp(crk*1.5-i*0.1,0,1);if(u<=0)continue;var cx=s.x+(((i*37)%10)/10-0.5)*w*0.6,cy=top+((i*53%10)/10)*h*0.8;
      ctx.strokeStyle="rgba(180,240,255,"+(0.5+0.5*u)+")";ctx.lineWidth=(1.5+2*u)*sc;ctx.beginPath();ctx.moveTo(cx,cy);for(var k=1;k<=4;k++){var a=i*2.1+k*1.1,l=k*h*0.045*u;ctx.lineTo(cx+Math.cos(a)*l*1.4,cy+Math.sin(a)*l);}ctx.stroke();}
    var gg=h*(0.4+0.4*crk);ctx.globalAlpha=0.25+0.5*crk;ctx.drawImage(glowSpr("#4fc3f7"),s.x-gg,s.y-h*0.5-gg,gg*2,gg*2);ctx.restore();
    ymEyes(C.x,C.y,h*(1-0.08*kneel),C.face,"ymir",1-crk*0.5);
    return;}
  var cols=4,rows=5,sw=im.width/cols,shh=im.height/rows,pw=w/cols,phh=h/rows;
  for(var q=0;q<C.pcs.length;q++){var P=C.pcs[q];if(P.a<=0)continue;var px=s.x+P.x*sc,py=s.y+P.y*sc*CFG.YSCALE+Math.min(0,P.y)*sc*(1-CFG.YSCALE);
    ctx.save();ctx.globalAlpha=P.a;ctx.translate(px,py);ctx.rotate(P.r);if(C.face<0)ctx.scale(-1,1);
    ctx.drawImage(im,P.i*sw,P.j*shh,sw,shh,-pw/2,-phh/2,pw,phh);
    ctx.globalCompositeOperation="lighter";ctx.globalAlpha=P.a*0.35;ctx.drawImage(im,P.i*sw,P.j*shh,sw,shh,-pw/2,-phh/2,pw,phh);ctx.restore();}
}
function ymDrawGround(){
  var t=game.time||0,sc=layout.scale,i,o,s,p=game.player;
  /* chosen ultra: aura under the hero */
  if(p&&p.ultra&&!CAB.won&&game.state==="playing"){var U=YM_ULTRA[p.ultra];s=toScreen(p.x,p.y);
    ctx.save();ctx.globalCompositeOperation="lighter";
    if(p.ultra==="ventisca"){ctx.globalAlpha=0.22+0.06*Math.sin(t*4);ctx.drawImage(glowSpr("#4fc3f7"),s.x-84*sc,s.y-60*sc,168*sc,120*sc);
      ctx.globalAlpha=0.5;ctx.strokeStyle="#e1f5fe";ctx.lineWidth=1.5*sc;ctx.setLineDash([5*sc,7*sc]);ctx.lineDashOffset=-t*30;ctx.beginPath();ctx.ellipse(s.x,s.y,84*sc,84*sc*CFG.YSCALE,0,0,7);ctx.stroke();ctx.setLineDash([]);}
    else if(p.ultra==="boreal"){ctx.globalAlpha=0.28+0.1*Math.sin(t*3);ctx.drawImage(glowSpr(Math.sin(t*1.5)>0?"#69f0ae":"#b388ff"),s.x-40*sc,s.y-30*sc,80*sc,60*sc);}
    else{ctx.globalAlpha=0.3;ctx.drawImage(glowSpr("#448aff"),s.x-36*sc,s.y-26*sc,72*sc,52*sc);}
    ctx.restore();}
  /* telegraphs */
  for(i=0;i<YM.fx.length;i++){o=YM.fx[i];
    if(o.k==="fist"&&!o.hit&&o.t>-0.01){s=toScreen(o.x,o.y);var u=clamp(o.t/o.max,0,1),rr=o.r*sc;
      ctx.save();ctx.globalAlpha=0.22+0.3*u;ctx.fillStyle="rgba(255,82,82,0.45)";ctx.beginPath();ctx.ellipse(s.x,s.y,rr*u,rr*u*CFG.YSCALE,0,0,7);ctx.fill();
      ctx.globalAlpha=0.85;ctx.strokeStyle="#ff5252";ctx.lineWidth=2.5*sc;ctx.beginPath();ctx.ellipse(s.x,s.y,rr,rr*CFG.YSCALE,0,0,7);ctx.stroke();ctx.restore();}
    else if(o.k==="grave"&&o.t>-0.01){s=toScreen(o.x,o.y);var ug=clamp(o.t/o.max,0,1);ctx.save();ctx.globalAlpha=0.6+0.4*ug;ctx.fillStyle="rgba(1,30,60,0.6)";ctx.beginPath();ctx.ellipse(s.x,s.y,14*sc,14*sc*CFG.YSCALE,0,0,7);ctx.fill();
      ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.4+0.5*ug;ctx.drawImage(glowSpr("#4fc3f7"),s.x-20*sc,s.y-22*sc,40*sc,40*sc);ctx.restore();}
    else if(o.k==="spk"){s=toScreen(o.x,o.y);
      if(o.t<o.del){var ut=clamp(o.t/o.del,0,1);ctx.save();ctx.globalAlpha=0.25+0.4*ut;ctx.fillStyle="#4fc3f7";ctx.beginPath();ctx.ellipse(s.x,s.y,10*sc,10*sc*CFG.YSCALE,0,0,7);ctx.fill();ctx.restore();}
      else{var e=o.t-o.del,hh=(e<0.12?e/0.12:Math.max(0,1-(e-0.4)/0.5))*22*sc;if(hh<=0)continue;ctx.save();ctx.fillStyle="#b3e5fc";ctx.strokeStyle="#01579b";ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(s.x-9*sc,s.y);ctx.lineTo(s.x-4*sc,s.y-hh*0.7);ctx.lineTo(s.x-1*sc,s.y);ctx.moveTo(s.x-3*sc,s.y);ctx.lineTo(s.x+1*sc,s.y-hh);ctx.lineTo(s.x+5*sc,s.y);ctx.moveTo(s.x+3*sc,s.y);ctx.lineTo(s.x+7*sc,s.y-hh*0.6);ctx.lineTo(s.x+10*sc,s.y);ctx.fill();ctx.stroke();ctx.restore();}}
    else if((o.k==="lance"||o.k==="ufist")&&!o.hit&&o.t>-0.01){s=toScreen(o.x,o.y);var ul=clamp(o.t/o.max,0,1),col=o.k==="lance"?"#69f0ae":"#448aff",rl=(o.k==="lance"?44:60)*sc;
      ctx.save();ctx.globalAlpha=0.3+0.5*ul;ctx.strokeStyle=col;ctx.lineWidth=2*sc;ctx.beginPath();ctx.ellipse(s.x,s.y,rl*(1.4-0.4*ul),rl*(1.4-0.4*ul)*CFG.YSCALE,0,0,7);ctx.stroke();ctx.restore();}
  }
  /* beam aim telegraph */
  var b=ymBoss();
  if(b&&b.st==="beam_w"){s=toScreen(b.x,b.y);ctx.save();ctx.translate(s.x,s.y);ctx.scale(1,CFG.YSCALE);ctx.rotate(b.la);ctx.globalAlpha=0.2+0.2*Math.sin(t*20);ctx.fillStyle="#4fc3f7";ctx.fillRect(b.r*sc,-12*sc,440*sc,24*sc);ctx.restore();}
  if(b&&b.st==="sweep_w"){s=toScreen(b.x,b.y);ctx.save();ctx.translate(s.x,s.y);ctx.scale(1,CFG.YSCALE);ctx.globalAlpha=0.25+0.15*Math.sin(t*18);ctx.fillStyle="#ff5252";ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,118*sc,b.la-1.05,b.la+1.05);ctx.closePath();ctx.fill();ctx.restore();}
}
function ymDrawOver(){
  var t=game.time||0,sc=layout.scale,i,o,s;
  for(i=0;i<YM.fx.length;i++){o=YM.fx[i];
    if(o.k==="fist"&&o.t>-0.01){s=toScreen(o.x,o.y);var u=clamp(o.t/o.max,0,1);
      if(!o.hit){var fy=s.y-(1-u*u)*220*sc,fw=o.r*0.9*sc;ctx.save();ctx.globalAlpha=clamp(u*3,0,1);ymFistShape(s.x,fy,fw,"#81d4fa","#e1f5fe");ctx.restore();}
      else{var e=o.t-o.max;ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=Math.max(0,1-e/0.5);ctx.drawImage(glowSpr("#e1f5fe"),s.x-o.r*1.6*sc,s.y-o.r*1.3*sc,o.r*3.2*sc,o.r*2.2*sc);ctx.restore();}}
    else if(o.k==="ufist"&&o.t>-0.01){s=toScreen(o.x,o.y);var u2=clamp(o.t/o.max,0,1);
      if(!o.hit){var fy2=s.y-(1-u2*u2)*240*sc;ctx.save();ctx.globalAlpha=clamp(u2*3,0,1);ymFistShape(s.x,fy2,52*sc,"#448aff","#b3e5fc");ctx.restore();}
      else{var e2=o.t-o.max,k2=Math.max(0,1-e2/0.7);ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=k2;ctx.drawImage(glowSpr("#448aff"),s.x-90*sc,s.y-70*sc,180*sc,120*sc);ctx.restore();
        ctx.save();ctx.globalAlpha=k2;for(var c=0;c<8;c++){var a=c*0.785,rx=s.x+Math.cos(a)*48*sc*(1-k2*0.3),ry=s.y+Math.sin(a)*34*sc*(1-k2*0.3),hh=26*sc*k2;ctx.fillStyle="#82b1ff";ctx.strokeStyle="#0d47a1";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(rx-6*sc,ry);ctx.lineTo(rx,ry-hh);ctx.lineTo(rx+6*sc,ry);ctx.closePath();ctx.fill();ctx.stroke();}ctx.restore();}}
    else if(o.k==="lance"&&o.t>-0.01){s=toScreen(o.x,o.y);var u3=clamp(o.t/o.max,0,1);
      if(!o.hit){var ly=s.y-(1-u3)*SH;ctx.save();ctx.globalCompositeOperation="lighter";ctx.translate(s.x,ly);ctx.rotate(o.a);var lg=ctx.createLinearGradient(0,-SH*0.5,0,0);lg.addColorStop(0,"rgba(179,136,255,0)");lg.addColorStop(0.6,"rgba(105,240,174,0.8)");lg.addColorStop(1,"rgba(255,255,255,1)");ctx.fillStyle=lg;
        ctx.beginPath();ctx.moveTo(-5*sc,-SH*0.5);ctx.lineTo(5*sc,-SH*0.5);ctx.lineTo(3*sc,-10*sc);ctx.lineTo(0,6*sc);ctx.lineTo(-3*sc,-10*sc);ctx.closePath();ctx.fill();ctx.restore();}
      else{var e3=o.t-o.max,k3=Math.max(0,1-e3/0.5);ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=k3;ctx.drawImage(glowSpr("#69f0ae"),s.x-60*sc,s.y-50*sc,120*sc,90*sc);
        var bw=(8+10*k3)*sc,cg=ctx.createLinearGradient(0,0,0,s.y);cg.addColorStop(0,"rgba(179,136,255,0)");cg.addColorStop(1,"rgba(105,240,174,"+(0.7*k3)+")");ctx.fillStyle=cg;ctx.fillRect(s.x-bw/2,0,bw,s.y);ctx.restore();}}
    else if(o.k==="nova"){s=toScreen(o.x,o.y);var fa=clamp(1-o.t/0.9,0,1);ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.5*fa;ctx.drawImage(glowSpr("#4fc3f7"),s.x-o.r*sc,s.y-o.r*sc*0.8,o.r*2*sc,o.r*1.6*sc);
      ctx.globalAlpha=0.9*fa;ctx.strokeStyle="#ffffff";ctx.lineWidth=(4+8*fa)*sc;ctx.beginPath();ctx.ellipse(s.x,s.y,o.r*sc,o.r*sc*CFG.YSCALE,0,0,7);ctx.stroke();
      ctx.strokeStyle="#4fc3f7";ctx.lineWidth=3*sc;ctx.beginPath();ctx.ellipse(s.x,s.y,o.r*0.8*sc,o.r*0.8*sc*CFG.YSCALE,0,0,7);ctx.stroke();ctx.restore();}
    else if(o.k==="burst"){s=toScreen(o.x,o.y);var fb=clamp(1-o.t/o.max,0,1),gb=(40+120*(1-fb))*sc;ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=fb*0.8;ctx.drawImage(glowSpr(o.col),s.x-gb,s.y-gb,gb*2,gb*2);ctx.restore();}
  }
  var B=YM.beam;
  if(B&&B.x0!=null){var a0=toScreen(B.x0,B.y0),a1=toScreen(B.x1,B.y1),hb=ymSprH()*0.55,k=Math.min(1,B.t/0.12)*Math.min(1,(B.dur-B.t)/0.15),wob=1+0.15*Math.sin(t*40);
    ctx.save();ctx.lineCap="round";ctx.globalCompositeOperation="lighter";
    ctx.globalAlpha=0.35*k;ctx.strokeStyle="#4fc3f7";ctx.lineWidth=30*sc*wob;ctx.beginPath();ctx.moveTo(a0.x,a0.y-hb);ctx.lineTo(a1.x,a1.y-16*sc);ctx.stroke();
    ctx.globalAlpha=0.8*k;ctx.strokeStyle="#b3e5fc";ctx.lineWidth=14*sc*wob;ctx.stroke();
    ctx.globalAlpha=k;ctx.strokeStyle="#ffffff";ctx.lineWidth=5*sc;ctx.stroke();
    ctx.drawImage(glowSpr("#e1f5fe"),a0.x-30*sc,a0.y-hb-30*sc,60*sc,60*sc);ctx.restore();}
  /* ultra badge + cooldown */
  var p=game.player;
  if(p&&p.ultra&&game.state==="playing"&&!CAB.won){var U=YM_ULTRA[p.ultra],sf=layout.safe,x=sf.l+12,y=sf.t+86;hudFont("900",11);var txt="❄ "+U.n,w=ctx.measureText(txt).width+44;
    hudGlass(x,y,w,24,8);ctx.fillStyle=U.c;ctx.textAlign="left";ctx.fillText(txt,x+9,y+16);
    var cx=x+w-14,cy=y+12,r=7,fr=1-clamp(p.ultraT/U.cd,0,1);ctx.save();ctx.strokeStyle="rgba(255,255,255,0.2)";ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.stroke();
    ctx.strokeStyle=fr>=0.98?"#ffffff":U.c2;ctx.beginPath();ctx.arc(cx,cy,r,-1.5708,-1.5708+fr*6.2832);ctx.stroke();ctx.restore();
    var since=(game.time||0)-YM.lastUlt;if(since<0.9&&since>=0){ctx.save();ctx.globalAlpha=1-since/0.9;ctx.textAlign="center";hudFont("900",Math.round(Math.min(30,SH*0.07)));ctx.lineJoin="round";ctx.strokeStyle="#021226";ctx.lineWidth=6;var yy=SH*0.26-since*16;ctx.strokeText("¡"+U.u+"!",SW/2,yy);ctx.fillStyle=U.c2;ctx.fillText("¡"+U.u+"!",SW/2,yy);ctx.restore();}
    ctx.textAlign="left";}
}
function ymFistShape(x,y,w,c1,c2){
  /* faceted crystal fist seen from the side, knuckles down */
  ctx.save();ctx.translate(x,y);var g=ctx.createLinearGradient(-w,-w*1.4,w,0);g.addColorStop(0,c2);g.addColorStop(1,c1);ctx.fillStyle=g;ctx.strokeStyle="#01305e";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-w*0.55,-w*1.5);ctx.lineTo(w*0.5,-w*1.55);ctx.lineTo(w*0.62,-w*0.75);ctx.lineTo(w*0.7,-w*0.2);ctx.lineTo(w*0.35,0);ctx.lineTo(-w*0.4,0);ctx.lineTo(-w*0.72,-w*0.3);ctx.lineTo(-w*0.62,-w*0.85);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle="rgba(255,255,255,0.7)";ctx.lineWidth=1.5;ctx.beginPath();for(var i=0;i<4;i++){var kx=-w*0.45+i*w*0.27;ctx.moveTo(kx,-w*0.02);ctx.lineTo(kx+w*0.05,-w*0.38);}ctx.moveTo(-w*0.6,-w*0.85);ctx.lineTo(w*0.6,-w*0.8);ctx.stroke();
  ctx.fillStyle="#455a64";ctx.fillRect(-w*0.6,-w*1.7,w*1.15,w*0.22);ctx.restore();
}
function ymDrawCine(){
  var C=CAB.cine,z=game.boss;if(!C||!z)return;var t=C.t,sc=layout.scale;
  var a=clamp(t/0.5,0,1)*(t>7.6?clamp((8.0-t)/0.4,0,1):1),hb=hellLetterbox(a);
  var bsc=Math.min(1.5,Math.max(0.9,sc*0.9));
  if(C.bub){var s=toScreen(z.x,z.y),pop=C.bubT<0.15?0.6+0.4*(C.bubT/0.15):1;cabBubble(clamp(s.x,120,SW-120),Math.max(hb+30,s.y-ymSprH()-10*sc),C.bub,bsc,pop,"#0d47a1");}
  if(C.flash>0){ctx.fillStyle="rgba(235,250,255,"+clamp(C.flash,0,1)+")";ctx.fillRect(0,0,SW,SH);}
  if(t>6.3){ymNameCard("YMIR","EL REY DEL INVIERNO ETERNO",clamp((t-6.3)/0.3,0,1)*(t>7.6?clamp((8.0-t)/0.4,0,1):1),hb);}
  if(C.skip&&t>0.4&&t<7.2){ctx.save();ctx.globalAlpha=0.6;ctx.font="12px system-ui";ctx.fillStyle="#fff";ctx.textAlign="right";ctx.fillText("Toca para saltar",SW-layout.safe.r-14,SH-8);ctx.restore();}
}
function ymNameCard(name,sub,a,hb){
  if(a<=0)return;ctx.save();ctx.globalAlpha=a;ctx.textAlign="center";ctx.lineJoin="round";
  var fs=Math.round(Math.min(64,SH*0.16)),py=SH-hb-Math.round(fs*0.62)-8,sp=1+0.25*(1-a);
  ctx.translate(SW/2,py);ctx.scale(sp,sp);
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=a*0.5;ctx.drawImage(glowSpr("#4fc3f7"),-fs*3,-fs*1.4,fs*6,fs*2);ctx.restore();
  ctx.font="900 "+fs+"px system-ui";ctx.strokeStyle="rgba(2,10,24,0.95)";ctx.lineWidth=10;ctx.strokeText(name,0,0);
  var g=ctx.createLinearGradient(0,-fs,0,0);g.addColorStop(0,"#ffffff");g.addColorStop(0.55,"#b3e5fc");g.addColorStop(1,"#29b6f6");ctx.fillStyle=g;ctx.fillText(name,0,0);
  ctx.font="900 "+Math.round(fs*0.27)+"px system-ui";ctx.lineWidth=5;ctx.strokeText(sub,0,fs*0.42);ctx.fillStyle="#e1f5fe";ctx.fillText(sub,0,fs*0.42);
  ctx.restore();
}
function ymDrawWin(){
  var C=CAB.cine;if(!C)return;var t=C.t,sc=layout.scale,a=clamp(t/0.4,0,1)*(t>5.8?clamp((6.2-t)/0.4,0,1):1),hb=hellLetterbox(a);
  if(C.bub){var s=toScreen(C.x,C.y);cabBubble(clamp(s.x,120,SW-120),Math.max(hb+30,s.y-ymSprH()-10*sc),C.bub,Math.min(1.5,Math.max(0.9,sc*0.9)),C.bubT<0.15?0.6+0.4*(C.bubT/0.15):1,"#0d47a1");}
  if(C.flash>0){ctx.fillStyle="rgba(240,252,255,"+clamp(C.flash,0,1)+")";ctx.fillRect(0,0,SW,SH);}
  if(t>3.0){var ta=clamp((t-3.0)/0.35,0,1)*(t>5.8?clamp((6.2-t)/0.4,0,1):1);
    ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.22*ta;var gl=ctx.createLinearGradient(0,hb,0,SH*0.5);gl.addColorStop(0,"#69f0ae");gl.addColorStop(0.5,"#4fc3f7");gl.addColorStop(1,"rgba(179,136,255,0)");ctx.fillStyle=gl;ctx.fillRect(0,hb,SW,SH*0.5);ctx.restore();
    ymNameCard("¡YMIR HA CAÍDO!","EL INVIERNO ETERNO SE ROMPE",ta,hb);}
}
function ymDrawReward(){
  var R=YM.reward,t=(game.hell&&game.hell.t)||0;if(!R||t<0.6)return;var a=clamp((t-0.6)/0.4,0,1);
  var txt="❄ Botín de Ymir:  "+(R.chest?"🌈 Cofre Asombroso  ·  ":R.full?"(ranuras llenas)  ·  ":"")+"💎 +"+R.gems+" gemas";
  ctx.save();ctx.globalAlpha=a;ctx.font="900 13px system-ui";var tw=ctx.measureText(txt).width+32,y=SH*0.22+46;
  ctx.fillStyle="rgba(4,18,38,0.88)";roundRect(ctx,SW/2-tw/2,y-13,tw,26,13);ctx.fill();
  ctx.strokeStyle=R.chest&&typeof rainbowCol==="function"?rainbowCol(t):"#4fc3f7";ctx.lineWidth=2;roundRect(ctx,SW/2-tw/2,y-13,tw,26,13);ctx.stroke();
  ctx.fillStyle="#e1f5fe";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(txt,SW/2,y+1);ctx.restore();
}
/* test hooks */
window.__ymir={state:function(){var b=ymBoss();return{st:game&&game.state,ultra:game&&game.player&&game.player.ultra,pick:!!YM.pick,ready:ymPickReady(),cine:CAB.cine?(CAB.cine.ymir?"intro":CAB.cine.ywin?"win":"other"):null,
  boss:b?{hp:Math.round(b.hp),max:b.maxHp,ph:b.ph,st:b.st,x:b.x,y:b.y}:null,fx:YM.fx.length,beam:!!YM.beam,reward:YM.reward,seen:PROF.cine&&PROF.cine.ymir|0};},
  choose:function(id){if(!YM.pick)return 0;YM.pick.t=Math.max(YM.pick.t,1);ymPickChoose(id);return 1;},
  cards:function(){return YM.pick&&YM.pick.cards;},fire:function(){var p=game.player;if(p&&p.ultra)ymUltraFire(p.ultra);},
  setHp:function(f){var b=ymBoss();if(b)b.hp=b.maxHp*f;},bake:function(){var n=0;while(ymBakeOne()&&n<30)n++;return n;}};
