var audio={ctx:null,master:null,sfxG:null,musG:null,mutedSfx:0,mutedMus:0,musicTimer:null,musicMode:null,started:0,step:0};
var titleSplash=1;
function loadAudioSettings(){var s=lsGet("bz_audio",null);if(s){audio.mutedSfx=!!s.sfx;audio.mutedMus=!!s.mus;}}
function saveAudioSettings(){lsSet("bz_audio",{sfx:audio.mutedSfx?1:0,mus:audio.mutedMus?1:0});}
var MUS_BEDS={menu:"assets/mus/menu.mp3",play:"assets/mus/play.mp3"};
function musicBedKey(mode){return(mode==="menu"||mode==="play")?mode:null;}
function ensureMusicBeds(){
  if(audio.beds)return;
  audio.beds={};
  Object.keys(MUS_BEDS).forEach(function(k){
    var a=new Audio(MUS_BEDS[k]);
    a.loop=true;a.preload="auto";a.crossOrigin="anonymous";a.volume=0;a.setAttribute("playsinline","playsinline");
    audio.beds[k]={el:a,gain:null,wanted:0,src:null};
  });
}
function hookBedNodes(){
  if(!audio.ctx||!audio.beds)return;
  Object.keys(audio.beds).forEach(function(k){
    var b=audio.beds[k];if(b.src||!audio.musG)return;
    try{b.gain=audio.ctx.createGain();b.gain.gain.value=0;b.src=audio.ctx.createMediaElementSource(b.el);b.src.connect(b.gain);b.gain.connect(audio.musG);}catch(err){}
  });
}
function fadeBed(b,to,dur){
  if(!b)return;
  if(b.gain&&audio.ctx){
    var t=audio.ctx.currentTime,cur=b.gain.gain.value;
    try{b.gain.gain.cancelScheduledValues(t);b.gain.gain.setValueAtTime(Math.max(0.0001,cur),t);b.gain.gain.linearRampToValueAtTime(to,t+dur);}catch(e){b.gain.gain.value=to;}
  }
  try{b.el.volume=to;}catch(e){}
}
function unlockBeds(){
  ensureMusicBeds();
  if(audio.ctx&&audio.ctx.state==="suspended")audio.ctx.resume();
  hookBedNodes();
  Object.keys(audio.beds||{}).forEach(function(k){
    var b=audio.beds[k],pr;
    if(!b.el)return;
    if(b.el.paused){
      try{b.el.muted=true;b.el.volume=0;}catch(e){}
      pr=b.el.play();
      if(pr&&pr.then)pr.then(function(){if(!b.wanted){try{b.el.pause();b.el.currentTime=0;}catch(e){}}b.el.muted=false;}).catch(function(){});
    }
  });
}
function fadeOutBeds(dur){
  Object.keys(audio.beds||{}).forEach(function(k){
    var b=audio.beds[k];
    if(!b.wanted&&(!b.gain||b.gain.gain.value<=0.001))return;
    b.wanted=0;fadeBed(b,0,dur||0.7);
    setTimeout(function(){if(!b.wanted){try{b.el.pause();}catch(e){}}},((dur||0.7)*1000)+80);
  });
}
function createAudioGraph(){
  if(audio.ctx)return audio.ctx;
  try{
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
    audio.ctx=new AC();audio.master=audio.ctx.createGain();audio.master.gain.value=0.7;
    audio.comp=audio.ctx.createDynamicsCompressor();
    audio.comp.threshold.value=-18;audio.comp.knee.value=8;audio.comp.ratio.value=10;
    audio.comp.attack.value=0.003;audio.comp.release.value=0.12;
    audio.master.connect(audio.comp);audio.comp.connect(audio.ctx.destination);
    audio.sfxG=audio.ctx.createGain();audio.sfxG.gain.value=audio.mutedSfx?0:0.55;audio.sfxG.connect(audio.master);
    audio.musG=audio.ctx.createGain();audio.musG.gain.value=audio.mutedMus?0:0.42;audio.musG.connect(audio.master);
    audio.gunVoices=0;
    return audio.ctx;
  }catch(e){return null;}
}
function ensureAudio(){
  var fresh=!audio.ctx;
  if(!createAudioGraph())return null;
  if(audio.ctx.state==="suspended")try{audio.ctx.resume();}catch(e){}
  audio.started=1;
  ensureMusicBeds();hookBedNodes();unlockBeds();
  if(typeof tryDecodeMenu==="function")tryDecodeMenu();
  if(fresh&&audio.musicMode)startMusic(audio.musicMode);
  if(typeof bakeSfxSync==="function")bakeSfxSync();
  return audio.ctx;
}
function setMuteSfx(v){audio.mutedSfx=!!v;if(audio.sfxG)audio.sfxG.gain.value=audio.mutedSfx?0:0.55;saveAudioSettings();}
function setMuteMus(v){audio.mutedMus=!!v;if(audio.musG)audio.musG.gain.value=audio.mutedMus?0:0.42;saveAudioSettings();}

/* ===== v19.6.3: pre-baked SFX buffers + pooled voice chains (iOS-safe) ===== */
var SFX_UI={unlock:1,click:1,card:1,rarity0:1,rarity1:1,rarity2:1,rarity3:1,rarity4:1,xp:1,level:1,wave:1,clear:1};
var SFX_BOSS={boss:1,sting:1,growl:1,laugh:1,stomp:1,foot_heavy:1};
function combatLive(){
  return typeof game!=="undefined"&&game&&game.state==="playing";
}
function sfxAllowed(name){
  if(name==="unlock")return 1;
  if(SFX_UI[name])return 1;
  if(typeof game==="undefined"||!game)return 0;
  if(game.state==="playing")return 1;
  if(game.state==="boss_intro"&&SFX_BOSS[name])return 1;
  return 0;
}
function stopCombatLoops(){
  stopLaserHum();
}
function noteGameState(){
  if(typeof game==="undefined"||!game)return;
  var st=game.state;
  if(audio._st===st)return;
  audio._st=st;
  if(st!=="playing")stopCombatLoops();
}

function sfxOsc(type,t,f){
  var ph=t*f,x=ph-Math.floor(ph);
  if(type==="sine")return Math.sin(6.283185307179586*ph);
  if(type==="square")return x<0.5?1:-1;
  if(type==="sawtooth")return 2*x-1;
  if(type==="triangle")return x<0.5?4*x-1:3-4*x;
  return Math.sin(6.283185307179586*ph);
}
function sfxEnv(t,atk,hold,rel){
  if(t<0)return 0;
  if(t<atk)return t/Math.max(0.0008,atk);
  if(t<atk+hold)return 1;
  if(t<atk+hold+rel)return 1-(t-atk-hold)/Math.max(0.0008,rel);
  return 0;
}
function makeAudioBuf(dur,fn){
  if(!audio.ctx)return null;
  var rate=audio.ctx.sampleRate,n=Math.max(1,(rate*dur)|0),buf=audio.ctx.createBuffer(1,n,rate),d=buf.getChannelData(0),i;
  for(i=0;i<n;i++)d[i]=fn(i/rate,i,n)||0;
  return buf;
}
function getNoiseBuf(dur){
  if(!audio.ctx)return null;
  audio.noiseBuf=audio.noiseBuf||{};
  var key=(dur||0.2).toFixed(3);if(audio.noiseBuf[key])return audio.noiseBuf[key];
  var last=0;
  audio.noiseBuf[key]=makeAudioBuf(dur||0.2,function(){
    last=0.65*last+0.35*(Math.random()*2-1);return last;
  });
  return audio.noiseBuf[key];
}
function mixTone(out,type,freq,atk,hold,rel,vol,slide){
  var dur=atk+hold+rel,i,n=out.length,rate=audio.ctx.sampleRate,t,f,e;
  for(i=0;i<n;i++){
    t=i/rate;if(t>dur)break;
    f=freq;if(slide)f=freq*Math.pow(Math.max(0.04,slide/freq),Math.min(1,t/dur));
    e=sfxEnv(t,atk,hold,rel);
    out[i]+=sfxOsc(type,t,f)*e*vol;
  }
}
function mixNoise(out,atk,hold,rel,vol,hp,lp){
  var dur=atk+hold+rel,i,n=out.length,rate=audio.ctx.sampleRate,t,e,v=0,last=0,hpA,lpA,x;
  hpA=hp?Math.exp(-2*Math.PI*hp/rate):0;
  lpA=lp?Math.exp(-2*Math.PI*lp/rate):0;
  for(i=0;i<n;i++){
    t=i/rate;if(t>dur)break;
    x=(Math.random()*2-1);
    if(hp){last=hpA*last+(1-hpA)*x;x=x-last;}
    if(lp){v=lpA*v+(1-lpA)*x;x=v;}
    e=sfxEnv(t,atk,hold,rel);
    out[i]+=x*e*vol;
  }
}
function bufFromMix(dur,build){
  if(!audio.ctx)return null;
  var rate=audio.ctx.sampleRate,n=Math.max(1,(rate*dur)|0),arr=new Float32Array(n),i,pk=0.0001,buf,d;
  build(arr);
  for(i=0;i<n;i++){var a=arr[i]<0?-arr[i]:arr[i];if(a>pk)pk=a;}
  var g=pk>0.89?0.89/pk:1;
  buf=audio.ctx.createBuffer(1,n,rate);d=buf.getChannelData(0);
  for(i=0;i<n;i++)d[i]=arr[i]*g;
  return buf;
}

function bakeSfxSync(){
  if(!audio.ctx||audio._baked)return;
  audio.sfxBuf=audio.sfxBuf||{};
  var B=audio.sfxBuf;
  /* tonal zap — NO noise (the 19.6.2 static) */
  B.zap=bufFromMix(0.09,function(o){
    mixTone(o,"sine",1180,0.002,0.012,0.06,0.22,420);
    mixTone(o,"triangle",1760,0.002,0.01,0.05,0.12,700);
    mixTone(o,"sine",2400,0.001,0.006,0.03,0.06,900);
  });
  B.crackle=bufFromMix(0.06,function(o){
    mixTone(o,"sine",1540,0.0015,0.008,0.035,0.14,620);
    mixTone(o,"triangle",2100,0.001,0.006,0.03,0.08,1100);
  });
  B.melee=bufFromMix(0.1,function(o){mixTone(o,"sine",200,0.002,0.02,0.07,0.2,80);mixTone(o,"triangle",140,0.002,0.02,0.06,0.1,60);});
  B.slash=bufFromMix(0.1,function(o){mixTone(o,"sawtooth",240,0.002,0.016,0.05,0.12,90);mixTone(o,"triangle",520,0.002,0.012,0.04,0.08,200);});
  B.hit=bufFromMix(0.06,function(o){mixTone(o,"triangle",150,0.002,0.012,0.035,0.12,60);});
  B.click=bufFromMix(0.05,function(o){mixTone(o,"sine",800,0.001,0.008,0.03,0.08);});
  B.jump=bufFromMix(0.09,function(o){mixTone(o,"sine",420,0.002,0.02,0.05,0.1,600);});
  B.xp=bufFromMix(0.07,function(o){mixTone(o,"sine",660,0.002,0.015,0.04,0.08,990);});
  B.dash=bufFromMix(0.08,function(o){mixTone(o,"sine",900,0.002,0.016,0.05,0.1,200);});
  B.wave=bufFromMix(0.18,function(o){mixTone(o,"sine",200,0.004,0.04,0.1,0.12,400);});
  B.death=bufFromMix(0.28,function(o){mixTone(o,"sawtooth",120,0.006,0.08,0.16,0.16,40);mixNoise(o,0.006,0.04,0.12,0.1,200,1800);});
  B.explode=bufFromMix(0.4,function(o){mixNoise(o,0.004,0.08,0.28,0.32,80,1400);mixTone(o,"sine",80,0.004,0.08,0.22,0.2,30);});
  B.hurt=bufFromMix(0.12,function(o){mixTone(o,"sawtooth",140,0.003,0.03,0.07,0.1,70);mixNoise(o,0.003,0.02,0.06,0.05,200,2000);});
  B.hurt_big=bufFromMix(0.18,function(o){mixTone(o,"sawtooth",110,0.004,0.05,0.1,0.14,50);mixNoise(o,0.004,0.04,0.1,0.08,150,1600);});
  B.card=bufFromMix(0.14,function(o){mixTone(o,"triangle",440,0.003,0.03,0.05,0.1);mixTone(o,"triangle",660,0.003,0.04,0.07,0.08);});
  B.rarity0=bufFromMix(0.1,function(o){mixTone(o,"triangle",330,0.003,0.03,0.05,0.08);});
  B.rarity1=bufFromMix(0.16,function(o){mixTone(o,"triangle",440,0.003,0.03,0.05,0.09);mixTone(o,"triangle",554,0.003,0.04,0.07,0.08);});
  B.rarity2=bufFromMix(0.22,function(o){mixTone(o,"sine",523,0.003,0.03,0.05,0.1);mixTone(o,"sine",659,0.003,0.04,0.06,0.09);mixTone(o,"sine",784,0.003,0.05,0.08,0.08);});
  B.rarity3=bufFromMix(0.28,function(o){mixTone(o,"triangle",392,0.004,0.04,0.06,0.12);mixTone(o,"triangle",494,0.004,0.05,0.07,0.1);mixTone(o,"triangle",587,0.004,0.07,0.1,0.12);});
  B.rarity4=bufFromMix(0.4,function(o){mixTone(o,"sine",523,0.003,0.03,0.05,0.12);mixTone(o,"sine",659,0.003,0.04,0.06,0.1);mixTone(o,"sine",784,0.003,0.05,0.07,0.1);mixTone(o,"triangle",1046,0.004,0.1,0.16,0.14);});
  B.clear=bufFromMix(0.32,function(o){mixTone(o,"sine",523,0.004,0.04,0.06,0.1);mixTone(o,"sine",659,0.004,0.06,0.08,0.1);mixTone(o,"sine",784,0.004,0.08,0.12,0.12);});
  B.level=bufFromMix(0.4,function(o){mixTone(o,"sine",523,0.004,0.05,0.06,0.12);mixTone(o,"sine",659,0.004,0.08,0.07,0.12);mixTone(o,"sine",784,0.004,0.14,0.12,0.14);});
  B.boss=bufFromMix(0.5,function(o){mixTone(o,"sawtooth",60,0.01,0.18,0.25,0.2,40);mixNoise(o,0.01,0.1,0.25,0.14,80,800);});
  B.sting=bufFromMix(0.7,function(o){mixTone(o,"sawtooth",48,0.01,0.25,0.35,0.22,28);mixTone(o,"sine",36,0.02,0.3,0.35,0.16,22);mixNoise(o,0.01,0.1,0.25,0.12,60,600);});
  B.growl=bufFromMix(0.75,function(o){mixTone(o,"sawtooth",70,0.02,0.3,0.35,0.18,32);mixTone(o,"triangle",48,0.02,0.35,0.35,0.14,24);mixNoise(o,0.02,0.15,0.3,0.1,70,700);});
  B.stomp=bufFromMix(0.35,function(o){mixNoise(o,0.004,0.06,0.2,0.22,40,600);mixTone(o,"sine",46,0.004,0.1,0.18,0.2,22);mixTone(o,"sine",70,0.003,0.05,0.12,0.08,30);});
  B.foot_heavy=bufFromMix(0.16,function(o){mixNoise(o,0.003,0.03,0.08,0.1,50,700);mixTone(o,"sine",58,0.003,0.04,0.08,0.14,32);});
  B.flame=bufFromMix(0.16,function(o){mixTone(o,"sawtooth",90,0.006,0.04,0.08,0.08,50);mixNoise(o,0.006,0.04,0.08,0.06,200,1600);});
  B.storm=bufFromMix(0.32,function(o){
    mixTone(o,"sine",80,0.008,0.1,0.16,0.12,40);
    mixTone(o,"sine",980,0.003,0.05,0.14,0.1,420);
    mixTone(o,"triangle",1400,0.003,0.04,0.12,0.06,500);
  });
  B.mash=bufFromMix(0.1,function(o){mixTone(o,"sine",180,0.003,0.03,0.05,0.16,90);});
  B.groan=bufFromMix(0.55,function(o){mixTone(o,"sawtooth",80,0.02,0.2,0.28,0.14,52);mixTone(o,"triangle",120,0.02,0.18,0.25,0.08,70);});
  B.laugh=bufFromMix(0.7,function(o){
    var k;for(k=0;k<5;k++)mixTone(o,"triangle",210+k*18,0.01+k*0.12,0.05,0.07,0.1,90);
  });
  function bakeGun(kind,cfg){
    B["shot_"+kind]=bufFromMix(Math.max(0.22,cfg.tail+0.04),function(o){
      mixNoise(o,0.0015,cfg.nDur*0.35,cfg.nDur*0.65,cfg.nVol*0.55,cfg.hp,cfg.lp);
      mixTone(o,"sine",cfg.thump,0.002,cfg.tDur*0.35,cfg.tDur*0.65,cfg.tVol,Math.max(30,cfg.thump*0.45));
      if(kind!=="shotgun")mixTone(o,"triangle",1800,0.001,0.006,0.012,0.08);
      mixNoise(o,0.008,cfg.tail*0.3,cfg.tail*0.7,cfg.tailVol*0.45,200,cfg.tailLp);
    });
  }
  bakeGun("pistol",{nDur:0.09,nVol:0.62,hp:1600,lp:9000,thump:155,tVol:0.42,tDur:0.07,tail:0.16,tailVol:0.22,tailLp:2200});
  bakeGun("shotgun",{nDur:0.16,nVol:0.78,hp:350,lp:4500,thump:68,tVol:0.72,tDur:0.14,tail:0.40,tailVol:0.38,tailLp:1400});
  bakeGun("smg",{nDur:0.05,nVol:0.48,hp:2000,lp:10000,thump:190,tVol:0.28,tDur:0.04,tail:0.08,tailVol:0.14,tailLp:2800});
  bakeGun("revolver",{nDur:0.14,nVol:0.7,hp:500,lp:3800,thump:78,tVol:0.62,tDur:0.12,tail:0.32,tailVol:0.34,tailLp:1500});
  bakeGun("rifle",{nDur:0.07,nVol:0.58,hp:1400,lp:8000,thump:140,tVol:0.4,tDur:0.06,tail:0.14,tailVol:0.2,tailLp:2400});
  bakeGun("gl",{nDur:0.12,nVol:0.55,hp:250,lp:1800,thump:52,tVol:0.7,tDur:0.16,tail:0.28,tailVol:0.3,tailLp:900});
  /* looping tonal hum (no noise) */
  B.laser_loop=bufFromMix(1.0,function(o){
    var i,n=o.length,rate=audio.ctx.sampleRate,t,x;
    for(i=0;i<n;i++){
      t=i/rate;
      x=sfxOsc("sine",t,62)*0.55+sfxOsc("sine",t,67)*0.4+sfxOsc("triangle",t,124)*0.08;
      o[i]=x*0.22;
    }
  });
  audio._baked=1;
  initVoicePool();
  /* OfflineAudioContext bake stays off the gameplay thread: PCM buffers are already ready. */
}

function bakeSfxOffline(){
  var OC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!OC||!audio.ctx||audio._bakedOff)return;
  audio._bakedOff=1;
  /* Prefer the offline graph for gunshots when the browser can render it, but PCM is already ready. */
  var kinds=["pistol","shotgun","smg","revolver","rifle","gl"];
  function renderOne(i){
    if(i>=kinds.length)return;
    var kind=kinds[i],dur=0.45,rate=audio.ctx.sampleRate,oc,p,n;
    try{
      oc=new OC(1,Math.max(1,(rate*dur)|0),rate);
    }catch(e){return;}
    p=oc.currentTime;
    /* short tonal+filtered body — same idea as gunshot, one buffer */
    var cfg={pistol:[155,0.42,9000],shotgun:[68,0.72,4500],smg:[190,0.28,10000],revolver:[78,0.62,3800],rifle:[140,0.4,8000],gl:[52,0.7,1800]}[kind];
    var o=oc.createOscillator(),g=oc.createGain(),f=oc.createBiquadFilter();
    o.type="sine";o.frequency.setValueAtTime(cfg[0],p);o.frequency.exponentialRampToValueAtTime(Math.max(30,cfg[0]*0.45),p+0.1);
    g.gain.setValueAtTime(0.0001,p);g.gain.exponentialRampToValueAtTime(cfg[1]*0.5,p+0.004);g.gain.exponentialRampToValueAtTime(0.0001,p+0.18);
    f.type="lowpass";f.frequency.value=cfg[2];
    o.connect(f);f.connect(g);g.connect(oc.destination);o.start(p);o.stop(p+0.22);
    var pr=oc.startRendering();
    if(pr&&pr.then)pr.then(function(buf){if(buf&&audio.sfxBuf){/* keep richer PCM; offline thump is a supplement, don't replace the mixed PCM */}}).catch(function(){});
    setTimeout(function(){renderOne(i+1);},0);
  }
  renderOne(0);
}

function initVoicePool(){
  if(!audio.ctx||!audio.sfxG||audio.voices)return;
  var n=8,i,ch,src;
  audio.voices=[];audio.voiceN=0;
  for(i=0;i<n;i++){
    ch={gain:audio.ctx.createGain(),src:null,armed:0,busy:0,until:0};
    ch.gain.gain.value=1;
    ch.gain.connect(audio.sfxG);
    armVoice(ch);
    audio.voices.push(ch);
  }
}
function armVoice(ch){
  if(!audio.ctx)return;
  try{if(ch.src){ch.src.onended=null;try{ch.src.disconnect();}catch(e){}}}catch(e){}
  ch.src=audio.ctx.createBufferSource();
  ch.src.connect(ch.gain);
  ch.armed=1;ch.busy=0;
}
function playSfxBuf(name,vol){
  if(!ensureAudio()||audio.mutedSfx||!audio.sfxG)return 0;
  if(!audio._baked)bakeSfxSync();
  if(!audio.voices)initVoicePool();
  var buf=audio.sfxBuf&&audio.sfxBuf[name];
  if(!buf)return 0;
  var t=audio.ctx.currentTime,i,ch=null,v=audio.voices,now=t;
  for(i=0;i<v.length;i++){
    if(v[i].busy&&v[i].until<=now){v[i].busy=0;if(!v[i].armed)armVoice(v[i]);}
    if(!v[i].busy&&v[i].armed){ch=v[i];break;}
  }
  if(!ch)return 0; /* hard cap — never restart an active source */
  try{
    ch.src.buffer=buf;
  }catch(e){armVoice(ch);try{ch.src.buffer=buf;}catch(e2){return 0;}}
  var g=Math.max(0.0001,(vol==null?0.85:vol));
  ch.gain.gain.cancelScheduledValues(t);
  ch.gain.gain.setValueAtTime(0.0001,t);
  ch.gain.gain.exponentialRampToValueAtTime(g,t+0.004);
  ch.busy=1;ch.armed=0;ch.until=t+buf.duration+0.02;
  var src=ch.src;
  src.onended=function(){if(ch.src===src){ch.busy=0;armVoice(ch);}};
  try{src.start(t);}catch(e){ch.busy=0;armVoice(ch);return 0;}
  return 1;
}

function sfxOk(){
  if(!audio.voices)return 1;
  var t=audio.ctx?audio.ctx.currentTime:0,i,n=0,v=audio.voices;
  for(i=0;i<v.length;i++)if(v[i].busy&&v[i].until>t)n++;
  return n<2?1:0; /* at most 2 new one-shots per call site still go through playSfxBuf cap */
}

function gunshot(kind){playSfxBuf("shot_"+(kind||"pistol"),0.9);}
function beep(freq,dur,type,vol,slide){
  /* rare fallback for unsaved names — still goes through a baked click if possible */
  if(!playSfxBuf("click",vol||0.1))return;
}
function noiseBurst(dur,vol){
  /* no live BufferSource+raw gain. Mapped to a short baked, enveloped hit. */
  playSfxBuf(dur>0.2?"explode":"hurt",Math.min(0.5,vol||0.12));
}

function sfx(name,extra){
  if(audio.mutedSfx&&name!=="unlock")return;
  if(name!=="laser_hum"&&name!=="laser_hum_off"&&!sfxAllowed(name))return;
  if(name==="laser_hum"){if(sfxAllowed("storm")||combatLive())startLaserHum();return;}
  if(name==="laser_hum_off"){stopLaserHum();return;}
  if(!ensureAudio()||!audio.sfxG)return;
  if(!audio._baked)bakeSfxSync();
  playSfxBuf(name, name==="zap"?0.7:name.indexOf("shot_")===0?0.9:0.85);
}

function startLaserHum(){
  if(!ensureAudio()||audio.mutedSfx||!audio.sfxG)return;
  if(!combatLive())return;
  if(!audio._baked)bakeSfxSync();
  if(audio.laserHum&&audio.laserHum.alive)return; /* already running — do not restart */
  stopLaserHum();
  var ctx=audio.ctx,t=ctx.currentTime,g=ctx.createGain(),src,buf=audio.sfxBuf&&audio.sfxBuf.laser_loop;
  if(!buf)return;
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.16,t+0.08);
  g.connect(audio.sfxG);
  src=ctx.createBufferSource();src.buffer=buf;src.loop=true;src.connect(g);
  try{src.start(t);}catch(e){return;}
  audio.laserHum={g:g,src:src,alive:1};
}
function stopLaserHum(){
  var h=audio.laserHum,t;
  if(!h)return;audio.laserHum=null;
  h.alive=0;
  try{
    t=audio.ctx?audio.ctx.currentTime:0;
    h.g.gain.cancelScheduledValues(t);
    h.g.gain.setValueAtTime(Math.max(0.0001,h.g.gain.value||0.0001),t);
    h.g.gain.linearRampToValueAtTime(0.0001,t+0.1);
  }catch(e){}
  setTimeout(function(){
    try{h.src.stop();}catch(e){}
    try{h.src.disconnect();h.g.disconnect();}catch(e){}
  },140);
}

function zombieMoan(){
  if(!sfxAllowed("groan"))return;
  playSfxBuf("groan",0.7);
}
function painSfx(kind){
  if(!sfxAllowed(kind==="death"?"death":"hurt"))return;
  playSfxBuf(kind==="death"?"death":kind==="big"?"hurt_big":"hurt",0.7);
}

/* ===== v8 procedural tracks (menu / play / boss) with crossfade ===== */
function musOsc(bus,type,freq,t,dur,vol,slide){
  if(!audio.ctx||!bus)return;
  var o=audio.ctx.createOscillator(),g=audio.ctx.createGain(),f=audio.ctx.createBiquadFilter();
  o.type=type||"sine";o.frequency.setValueAtTime(Math.max(20,freq),t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t+dur);
  f.type="lowpass";f.frequency.value=type==="sawtooth"?1200:type==="square"?1800:2400;
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(0.001,vol),t+Math.min(0.03,dur*0.2));
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(f);f.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+0.03);
}
function musNoise(bus,t,dur,vol,freq){
  if(!audio.ctx||!bus)return;
  var n=Math.max(1,(audio.ctx.sampleRate*dur)|0),buf=audio.ctx.createBuffer(1,n,audio.ctx.sampleRate),d=buf.getChannelData(0);
  for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  var s=audio.ctx.createBufferSource();s.buffer=buf;
  var f=audio.ctx.createBiquadFilter();f.type="highpass";f.frequency.value=freq||800;
  var g=audio.ctx.createGain();g.gain.setValueAtTime(vol||0.04,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f);f.connect(g);g.connect(bus);s.start(t);s.stop(t+dur+0.02);
}
function musKick(bus,t,vol){
  musOsc(bus,"sine",96,t,0.14,vol||0.17,30);
  musNoise(bus,t,0.03,(vol||0.17)*0.32,100);
}
function musSnare(bus,t,vol){
  musNoise(bus,t,0.09,vol||0.08,1600);
  musOsc(bus,"triangle",200,t,0.05,(vol||0.08)*0.45);
}
function musHat(bus,t,vol){
  musNoise(bus,t,0.02,vol||0.026,6500);
}
function musChoir(bus,t,freqs,dur,vol){
  var i;for(i=0;i<(freqs||[]).length;i++)musOsc(bus,"sine",freqs[i],t,dur,vol||0.028);
}
function musWind(bus,t,dur,vol){
  if(!audio.ctx||!bus)return;
  var n=Math.max(1,(audio.ctx.sampleRate*dur)|0),buf=audio.ctx.createBuffer(1,n,audio.ctx.sampleRate),d=buf.getChannelData(0),acc=0,i;
  for(i=0;i<n;i++){acc=acc*0.985+(Math.random()*2-1)*0.015;d[i]=acc;}
  var src=audio.ctx.createBufferSource();src.buffer=buf;
  var f=audio.ctx.createBiquadFilter();f.type="lowpass";f.frequency.value=480;
  var g=audio.ctx.createGain();
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol||0.028,t+dur*0.35);g.gain.linearRampToValueAtTime(0.0001,t+dur);
  src.connect(f);f.connect(g);g.connect(bus);src.start(t);src.stop(t+dur+0.03);
}
function musBox(bus,t,freq,dur,vol){
  if(!freq)return;
  musOsc(bus,"sine",freq,t,dur,vol);
  musOsc(bus,"sine",freq*1.007,t,dur*1.1,vol*0.42);
  musOsc(bus,"triangle",freq*2.005,t,dur*0.4,vol*0.1);
  musOsc(bus,"sine",freq,t+0.4,dur*0.85,vol*0.26);
  musOsc(bus,"sine",freq,t+0.8,dur*0.7,vol*0.11);
}
function musGroanMus(bus,t){
  var p=56+Math.random()*30;
  musOsc(bus,"sawtooth",p,t,0.9,0.03,p*0.6);
  musOsc(bus,"triangle",p*1.35,t,0.7,0.015,p*0.75);
  musNoise(bus,t,0.5,0.012,160);
}
function fadeOutBus(bus,sec){
  if(!bus||!audio.ctx)return;
  var t=audio.ctx.currentTime;
  try{bus.gain.cancelScheduledValues(t);bus.gain.setValueAtTime(Math.max(0.0001,bus.gain.value),t);bus.gain.linearRampToValueAtTime(0,t+sec);}catch(e){}
  setTimeout(function(){try{bus.disconnect();}catch(e){}}, (sec*1000)+80);
}
function startMusic(mode){
  if(!mode){stopMusic();return;}
  if(!ensureAudio()||!audio.ctx){audio.musicMode=mode;return;}
  if(audio.mutedMus){audio.musicMode=mode;return;}
  var bed=musicBedKey(mode);
  if(audio.musicMode===mode){
    if(mode==="menu"&&(audio.menuSrc||audio.droneBus||(audio.beds&&audio.beds.menu&&audio.beds.menu.wanted)))return;
    if(bed&&audio.beds&&audio.beds[bed]&&audio.beds[bed].wanted)return;
    if(!bed&&audio.musBus&&audio.musicTimer)return;
  }
  if(mode!=="menu"){
    if(typeof stopMenuBuffer==="function")stopMenuBuffer(0.45);
    if(typeof stopDrone==="function")stopDrone(0.45);
  }
  if(audio.musBus)fadeOutBus(audio.musBus,0.7);
  if(audio.musicTimer){clearTimeout(audio.musicTimer);audio.musicTimer=null;}
  audio.musicGen=(audio.musicGen||0)+1;
  audio.musicMode=mode;audio.musicStep=0;
  ensureMusicBeds();hookBedNodes();unlockBeds();
  /* fade out beds that are not the one we want */
  Object.keys(audio.beds||{}).forEach(function(k){
    var b=audio.beds[k];
    if(bed===k&&mode!=="menu")return;
    if(mode==="menu"&&k==="menu"&&audio._menuFailed)return;
    if(b.wanted||(b.gain&&b.gain.gain.value>0.001)){b.wanted=0;fadeBed(b,0,0.7);setTimeout(function(){if(!b.wanted){try{b.el.pause();}catch(e){}}},780);}
  });
  if(mode==="menu"){
    if(typeof startMenuImmediate==="function"){startMenuImmediate();return;}
  }
  if(bed&&audio.beds[bed]){
    var B=audio.beds[bed],pr;
    B.wanted=1;
    try{B.el.muted=false;if(B.el.paused){pr=B.el.play();if(pr&&pr.catch)pr.catch(function(){});}}catch(e){}
    fadeBed(B,1,0.7);
    audio.musBus=null;
    if(mode==="play"){
      /* very quiet heartbeat pulse under the recorded bed — not a melody */
      var gen=audio.musicGen,bus=audio.ctx.createGain(),now=audio.ctx.currentTime;
      bus.gain.setValueAtTime(0.0001,now);bus.gain.linearRampToValueAtTime(1,now+0.65);
      bus.connect(audio.musG);audio.musBus=bus;
      function pulse(){
        if(gen!==audio.musicGen||!audio.ctx||audio.musicMode!=="play")return;
        var t=audio.ctx.currentTime;
        musOsc(bus,"sine",46.25,t,0.28,0.035,32);
        musNoise(bus,t,0.04,0.012,180);
        audio.musicTimer=setTimeout(pulse,820);
      }
      pulse();
    }
    return;
  }
  var gen=audio.musicGen,bus=audio.ctx.createGain(),now=audio.ctx.currentTime;
  bus.gain.setValueAtTime(0.0001,now);bus.gain.linearRampToValueAtTime(1,now+0.65);
  bus.connect(audio.musG);audio.musBus=bus;
  function tick(){
    if(gen!==audio.musicGen||!audio.ctx||!audio.musBus)return;
    var t=audio.ctx.currentTime,s=audio.musicStep++,m=audio.musicMode,wait=0.28,n,bass,mel,ch;
    if(m==="colo"||m==="boss"){
      /* Epic Colossus, ~104 BPM, D minor, big drums + brass */
      wait=0.288;
      bass=[73.42,73.42,73.42,65.41, 73.42,87.31,98.00,73.42, 65.41,73.42,58.27,73.42, 87.31,73.42,55.00,73.42];
      n=s%16;
      musOsc(bus,"sawtooth",bass[n],t,0.22,0.13,bass[n]*0.9);
      musOsc(bus,"sine",bass[n]*0.5,t,0.2,0.15);
      musOsc(bus,"sine",36.71,t,0.18,0.1);
      if(n%4===0){musKick(bus,t,0.22);musOsc(bus,"sawtooth",146.8,t,0.16,0.08);musOsc(bus,"sawtooth",220.0,t,0.16,0.06);}
      if(n%4===2){musSnare(bus,t,0.1);musOsc(bus,"triangle",110,t,0.12,0.08,70);}
      if(n%8===6)musOsc(bus,"sawtooth",293.7,t,0.28,0.06,196);
      if(n===0)musChoir(bus,t,[146.8,174.6,220.0],1.0,0.025);
    }else if(m==="home"){
      /* Homelander: faster, choir, deep bass, rising tension ~144 BPM */
      wait=0.208;
      bass=[61.74,61.74,46.25,61.74, 55.00,61.74,73.42,61.74, 51.91,61.74,46.25,55.00, 61.74,73.42,82.41,61.74];
      n=s%16;
      musOsc(bus,"sawtooth",bass[n],t,0.16,0.12,bass[n]*0.92);
      musOsc(bus,"sine",30.87,t,0.18,0.16);
      musKick(bus,t,0.17);
      if(n%4===2)musSnare(bus,t,0.08);
      musHat(bus,t,0.032);
      if(n%4===0)musChoir(bus,t,[246.9,293.7,370.0,440.0],0.7,0.035);
      /* rising tension every 2 bars */
      var rise=493.9*Math.pow(1.014,(s%32));
      if(n%2===0)musOsc(bus,"triangle",rise,t,0.18,0.04);
    }else if(m==="home2"){
      /* Phase 2: darker, faster, dissonant ~156 BPM */
      wait=0.192;
      bass=[61.74,58.27,51.91,46.25, 61.74,43.65,51.91,61.74, 58.27,51.91,46.25,43.65, 61.74,69.30,51.91,46.25];
      n=s%16;
      musOsc(bus,"sawtooth",bass[n],t,0.15,0.13,bass[n]*0.88);
      musOsc(bus,"sine",29.14,t,0.2,0.18);
      musKick(bus,t,0.2);
      musHat(bus,t,0.036);
      if(n%2===0)musSnare(bus,t,n%4===0?0.1:0.05);
      if(n%4===0)musChoir(bus,t,[233.1,246.9,277.2,349.2],0.75,0.045);
      musNoise(bus,t,0.06,0.02,400);
      if(n%4===0)musOsc(bus,"sawtooth",207.7,t,0.22,0.05,155.6);
    }else{
      /* Final boss: ritual, distinct, ~96 BPM, C# minor + tritone */
      wait=0.312;
      bass=[34.65,34.65,41.20,34.65, 51.91,34.65,46.25,34.65, 30.87,34.65,41.20,51.91, 34.65,38.89,46.25,34.65];
      n=s%16;
      musOsc(bus,"sawtooth",bass[n],t,0.24,0.13);
      musOsc(bus,"sine",bass[n],t,0.26,0.14);
      if(n%4===0){musKick(bus,t,0.2);musOsc(bus,"sine",20.6,t,0.3,0.12);}
      if(n%8===4)musSnare(bus,t,0.09);
      if(n%4===2)musHat(bus,t,0.02);
      if(n===0)musChoir(bus,t,[138.6,164.8,207.7],1.15,0.04);
      if(n%8===6)musOsc(bus,"sawtooth",196.0,t,0.35,0.05,138.6);
      if(n%16===8)musChoir(bus,t,[277.2,329.6],0.5,0.03);
    }
    audio.musicTimer=setTimeout(tick,wait*1000);
  }
  tick();
}
function stopMusic(){
  audio.musicGen=(audio.musicGen||0)+1;
  if(audio.musicTimer){clearTimeout(audio.musicTimer);audio.musicTimer=null;}
  if(audio.musBus)fadeOutBus(audio.musBus,0.3);
  fadeOutBeds(0.3);
  if(typeof stopMenuBuffer==="function")stopMenuBuffer(0.3);
  if(typeof stopDrone==="function")stopDrone(0.3);
  audio.musBus=null;audio.musicMode=null;
}
function babbleSpeak(text,opts){
  opts=opts||{};if(!ensureAudio()||audio.mutedSfx)return;
  var syllables=text.replace(/[¡!¿?.,]/g," ").trim().split(/\s+/);
  var expanded=[];
  for(var i=0;i<syllables.length;i++){
    var w=syllables[i];expanded.push(w);
    if(w.length>3&&Math.random()<0.55)expanded.push(w.slice(0,Math.max(2,(w.length/2)|0))); /* stutter */
  }
  var base=opts.pitch||95,t0=audio.ctx.currentTime,gap=opts.gap||0.11;
  for(var i=0;i<expanded.length;i++){
    var f=base*(0.92+Math.random()*0.22)+(expanded[i].length%3)*8;
    var o=audio.ctx.createOscillator(),g=audio.ctx.createGain(),f2=audio.ctx.createBiquadFilter();
    o.type="sawtooth";o.frequency.value=f;f2.type="lowpass";f2.frequency.value=700;
    var st=t0+i*gap;g.gain.setValueAtTime(0.0001,st);g.gain.exponentialRampToValueAtTime(0.22,st+0.015);g.gain.exponentialRampToValueAtTime(0.0001,st+0.09);
    o.connect(f2);f2.connect(g);g.connect(audio.sfxG);o.start(st);o.stop(st+0.1);
  }
  return expanded.length*gap;
}


function markSoundStarted(){
  if(audio.tapToSoundMs!=null)return;
  if(audio._tapT!=null){
    audio.tapToSoundMs=(typeof performance!=="undefined"?performance.now():Date.now())-audio._tapT;
    audio.tapToSoundPath=audio._soundPath||"";
  }
  if(typeof window!=="undefined"){
    window.__tapToSoundMs=audio.tapToSoundMs;
    window.__tapToSoundPath=audio.tapToSoundPath;
  }
}
function startDrone(){
  if(audio.droneBus||!audio.ctx||audio.mutedMus)return;
  var ctx=audio.ctx,bus=ctx.createGain(),now=ctx.currentTime,o1,o2,o3,g1,g2,g3,n,ng,f;
  bus.gain.setValueAtTime(0.0001,now);bus.gain.linearRampToValueAtTime(1,now+0.03);
  bus.connect(audio.musG);audio.droneBus=bus;
  function osc(type,freq,vol){
    var o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.value=freq;g.gain.value=vol;
    o.connect(g);g.connect(bus);try{o.start();}catch(e){}
    return{o:o,g:g};
  }
  audio.droneOscs=[osc("sine",55,0.16),osc("sine",82.4,0.07),osc("triangle",110,0.03)];
  try{
    n=ctx.createBufferSource();ng=ctx.createGain();f=ctx.createBiquadFilter();
    n.buffer=getNoiseBuf(1.5);n.loop=true;f.type="lowpass";f.frequency.value=240;ng.gain.value=0.045;
    n.connect(f);f.connect(ng);ng.connect(bus);n.start();
    audio.droneOscs.push({o:n,g:ng});
  }catch(e){}
  audio._soundPath=audio._soundPath||"drone";
  markSoundStarted();
}
function stopDrone(fade){
  if(!audio.droneBus)return;
  var bus=audio.droneBus,oscs=audio.droneOscs,t=audio.ctx?audio.ctx.currentTime:0;
  if(audio.ctx){
    try{bus.gain.cancelScheduledValues(t);bus.gain.setValueAtTime(Math.max(0.0001,bus.gain.gain.value),t);bus.gain.linearRampToValueAtTime(0.0001,t+(fade||0.5));}catch(e){}
  }
  setTimeout(function(){
    try{if(oscs)oscs.forEach(function(x){try{x.o.stop();}catch(e){}});}catch(e){}
    try{bus.disconnect();}catch(e){}
    if(audio.droneBus===bus){audio.droneBus=null;audio.droneOscs=null;}
  },((fade||0.5)*1000)+50);
}
function startMenuBuffer(cross){
  if(!audio.ctx||!audio.menuBuf||audio.mutedMus)return;
  if(audio.menuSrc){markSoundStarted();return;}
  var src=audio.ctx.createBufferSource(),g=audio.ctx.createGain(),now=audio.ctx.currentTime;
  src.buffer=audio.menuBuf;src.loop=true;
  g.gain.setValueAtTime(0.0001,now);
  g.gain.linearRampToValueAtTime(1,now+(cross?0.5:0.03));
  src.connect(g);g.connect(audio.musG);
  try{src.start(0);}catch(e){}
  audio.menuSrc=src;audio.menuSrcG=g;audio._wantMenuBuf=0;
  src.onended=function(){if(audio.menuSrc===src)audio.menuSrc=null;};
  if(audio.droneBus)stopDrone(0.5);
  audio._soundPath=cross?"drone+mp3":"buffer";
  markSoundStarted();
  /* If the HTMLAudio fallback is already playing, drop it once the buffer is audible. */
  if(audio.ctx&&audio.ctx.state==="running"&&(audio._menuElHold||(audio.beds&&audio.beds.menu&&audio.beds.menu.wanted))){
    audio._menuElHold=0;
    var B=audio.beds.menu;
    if(B){B.wanted=0;fadeBed(B,0,0.3);setTimeout(function(){if(!B.wanted){try{B.el.pause();}catch(e){}}},360);}
  }
}
function stopMenuBuffer(fade){
  if(!audio.menuSrcG){audio.menuSrc=null;audio.menuSrcG=null;return;}
  var g=audio.menuSrcG,src=audio.menuSrc,t=audio.ctx?audio.ctx.currentTime:0;
  if(audio.ctx){
    try{g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(Math.max(0.0001,g.gain.gain.value),t);g.gain.linearRampToValueAtTime(0.0001,t+(fade||0.3));}catch(e){}
  }
  setTimeout(function(){try{src.stop();}catch(e){}try{g.disconnect();}catch(e){}},((fade||0.3)*1000)+50);
  audio.menuSrc=null;audio.menuSrcG=null;
}
function tryDecodeMenu(){
  if(audio.menuBuf||!audio.menuAB||!audio.ctx)return;
  if(audio._menuDecoding)return;
  audio._menuDecoding=1;
  var ab=audio.menuAB,ok=function(buf){
    audio.menuBuf=buf;audio._menuDecoding=0;
    if(audio._wantMenuBuf||(audio.musicMode==="menu"&&!audio.mutedMus))startMenuBuffer(audio.droneBus?1:0);
  },fail=function(){audio._menuDecoding=0;audio._menuFailed=1;};
  try{
    var p=audio.ctx.decodeAudioData(ab.slice?ab.slice(0):ab,ok,fail);
    if(p&&p.then)p.then(ok).catch(fail);
  }catch(e){fail();}
}
function preloadMenuBuf(){
  if(audio._menuFetch)return;
  audio._menuFetch=1;
  var url="assets/mus/menu.mp3";
  function got(ab){audio.menuAB=ab;createAudioGraph();tryDecodeMenu();}
  function bad(){audio._menuFailed=1;}
  try{
    if(window.fetch){
      fetch(url,{cache:"force-cache",credentials:"same-origin"}).then(function(r){if(!r.ok)throw new Error("menu "+r.status);return r.arrayBuffer();}).then(got).catch(bad);
    }else{
      var x=new XMLHttpRequest();x.open("GET",url,true);x.responseType="arraybuffer";
      x.onload=function(){if(x.status>=200&&x.status<300)got(x.response);else bad();};
      x.onerror=bad;x.send();
    }
  }catch(e){bad();}
}
function getSilentBuf(){
  if(audio.silentBuf||!audio.ctx)return audio.silentBuf||null;
  try{audio.silentBuf=audio.ctx.createBuffer(1,1,audio.ctx.sampleRate||44100);}catch(e){return null;}
  return audio.silentBuf;
}
function hookCtxState(){
  if(!audio.ctx||audio._stateHooked)return;
  audio._stateHooked=1;
  audio.ctx.onstatechange=function(){
    var st=audio.ctx&&audio.ctx.state;
    if(st==="running"){
      if(audio._wantMenuBuf&&audio.menuBuf&&!audio.menuSrc&&!audio.mutedMus)startMenuBuffer(audio._menuElHold?1:0);
      if(audio.menuSrc&&audio._menuElHold){
        audio._menuElHold=0;
        var B=audio.beds&&audio.beds.menu;
        if(B){B.wanted=0;fadeBed(B,0,0.35);setTimeout(function(){if(!B.wanted){try{B.el.pause();}catch(e){}}},400);}
      }
    }else if((st==="interrupted"||st==="suspended")&&typeof document!=="undefined"&&!document.hidden){
      try{audio.ctx.resume();}catch(e){}
    }
  };
}
function unlockAudioSync(){
  createAudioGraph();
  hookCtxState();
  if(typeof bakeSfxSync==="function")bakeSfxSync();
  if(!audio.ctx)return;
  var st=audio.ctx.state;
  if(st==="suspended"||st==="interrupted"){try{audio.ctx.resume();}catch(e){}}
  try{
    var silent=getSilentBuf();
    if(silent){var s=audio.ctx.createBufferSource();s.buffer=silent;s.connect(audio.master||audio.ctx.destination);s.start(0);}
  }catch(e){}
  ensureMusicBeds();hookBedNodes();
  try{
    var el=audio.beds&&audio.beds.menu&&audio.beds.menu.el;
    if(el){
      var keep=!!(audio.beds.menu.wanted||audio._menuElHold);
      el.muted=true;try{el.volume=0;}catch(e){}
      var pr=el.play();
      if(pr&&pr.then)pr.then(function(){if(!keep&&!(audio.beds.menu&&audio.beds.menu.wanted)&&!audio._menuElHold){try{el.pause();el.currentTime=0;}catch(e){}}el.muted=false;}).catch(function(){});
    }
  }catch(e){}
}
function playMenuElement(){
  ensureMusicBeds();hookBedNodes();
  var B=audio.beds&&audio.beds.menu,pr;
  if(!B||!B.el)return 0;
  B.wanted=1;audio._menuElHold=1;
  try{B.el.muted=false;B.el.volume=B.el.volume||1;if(audio.ctx&&B.gain){/* musG already handles master mute */}pr=B.el.play();if(pr&&pr.catch)pr.catch(function(){});}catch(e){return 0;}
  fadeBed(B,1,0.06);
  if(!audio.menuSrc){audio._soundPath=audio._soundPath||"element";markSoundStarted();}
  return 1;
}
function startMenuImmediate(){
  audio.musicMode="menu";
  audio._wantMenuBuf=1;
  if(audio.mutedMus)return;
  createAudioGraph();
  hookCtxState();
  /* HTMLAudio.play() in this same call stack — this is what actually starts music on iOS Safari. */
  playMenuElement();
  if(audio.menuBuf){
    startMenuBuffer(audio.droneBus?1:0);
    if(audio.menuSrc&&audio.ctx&&audio.ctx.state==="running"){
      audio._menuElHold=0;
      var B=audio.beds&&audio.beds.menu;
      if(B){B.wanted=0;fadeBed(B,0,0.2);setTimeout(function(){if(!B.wanted){try{B.el.pause();}catch(e){}}},260);}
    }
    return;
  }
  tryDecodeMenu();
  if(audio.menuBuf){startMenuBuffer(0);return;}
  if(!audio._menuFailed&&!(audio.beds&&audio.beds.menu&&audio.beds.menu.wanted))startDrone();
}
function resumeIfNeeded(){
  if(!audio.ctx)return;
  var st=audio.ctx.state;
  if(st==="suspended"||st==="interrupted"){try{audio.ctx.resume();}catch(e){}}
  if(audio.musicMode==="menu"&&!audio.mutedMus){
    var B=audio.beds&&audio.beds.menu;
    if(B&&(B.wanted||audio._menuElHold)&&B.el){try{var pr=B.el.play();if(pr&&pr.catch)pr.catch(function(){});}catch(e){}}
    if(audio._wantMenuBuf&&audio.menuBuf&&!audio.menuSrc&&audio.ctx.state==="running")startMenuBuffer(1);
  }
}
function dismissTitleSplash(){
  if(!titleSplash)return 0;
  titleSplash=0;audio._splashEat=1;
  return 1;
}
function onFirstAudioGesture(e){
  var typ=e&&e.type,valid=typ==="click"||typ==="touchend";
  /* pointerdown/touchstart are not user-activation on iOS Safari — don't consume the unlock, don't dismiss the splash. */
  if(!valid){
    if(audio._unlocked)return;
    return;
  }
  if(audio._unlocked){
    if(titleSplash)dismissTitleSplash();
    resumeIfNeeded();
    return;
  }
  if(!audio._tapT)audio._tapT=(typeof performance!=="undefined"?performance.now():Date.now());
  unlockAudioSync();
  audio.started=1;
  if(!audio.mutedMus&&(!audio.musicMode||audio.musicMode==="menu"))startMenuImmediate();
  else ensureAudio();
  dismissTitleSplash();
  audio._tapped=1;
  audio._unlocked=1;
}
if(typeof window!=="undefined"){
  /* iOS Safari only treats click and touchend as audio-activation gestures. */
  window.addEventListener("click",onFirstAudioGesture,true);
  window.addEventListener("touchend",onFirstAudioGesture,{capture:true,passive:true});
  window.__audio=audio;
  try{createAudioGraph();hookCtxState();}catch(e){}
  preloadMenuBuf();
  document.addEventListener("visibilitychange",function(){if(!document.hidden)resumeIfNeeded();});
  window.addEventListener("pageshow",function(){resumeIfNeeded();});
  window.addEventListener("focus",function(){resumeIfNeeded();});
}
