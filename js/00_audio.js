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
    audio.comp.threshold.value=-16;audio.comp.knee.value=10;audio.comp.ratio.value=5;
    audio.comp.attack.value=0.003;audio.comp.release.value=0.14;
    audio.master.connect(audio.comp);audio.comp.connect(audio.ctx.destination);
    audio.sfxG=audio.ctx.createGain();audio.sfxG.gain.value=audio.mutedSfx?0:0.9;audio.sfxG.connect(audio.master);
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
  return audio.ctx;
}
function setMuteSfx(v){audio.mutedSfx=!!v;if(audio.sfxG)audio.sfxG.gain.value=audio.mutedSfx?0:0.9;saveAudioSettings();}
function setMuteMus(v){audio.mutedMus=!!v;if(audio.musG)audio.musG.gain.value=audio.mutedMus?0:0.42;saveAudioSettings();}
function getNoiseBuf(dur){
  if(!audio.ctx)return null;
  audio.noiseBuf=audio.noiseBuf||{};
  var key=dur.toFixed(3);if(audio.noiseBuf[key])return audio.noiseBuf[key];
  var n=Math.max(1,(audio.ctx.sampleRate*dur)|0),buf=audio.ctx.createBuffer(1,n,audio.ctx.sampleRate),d=buf.getChannelData(0);
  var last=0;for(var i=0;i<n;i++){last=0.65*last+0.35*(Math.random()*2-1);d[i]=last;} /* slightly brown */
  audio.noiseBuf[key]=buf;return buf;
}
function gunshot(kind){
  if(!ensureAudio()||!audio.sfxG||audio.mutedSfx)return;
  if((audio.gunVoices||0)>=4)return;
  audio.gunVoices=(audio.gunVoices||0)+1;
  var ctx=audio.ctx,t=ctx.currentTime,p=0.93+Math.random()*0.14;
  var cfg={
    pistol:{nDur:0.09,nVol:0.62,hp:1600,lp:9000,thump:155*p,tVol:0.42,tDur:0.07,tail:0.16,tailVol:0.22,tailLp:2200},
    shotgun:{nDur:0.16,nVol:0.78,hp:350,lp:4500,thump:68*p,tVol:0.72,tDur:0.14,tail:0.40,tailVol:0.38,tailLp:1400},
    smg:{nDur:0.05,nVol:0.48,hp:2000,lp:10000,thump:190*p,tVol:0.28,tDur:0.04,tail:0.08,tailVol:0.14,tailLp:2800},
    revolver:{nDur:0.14,nVol:0.7,hp:500,lp:3800,thump:78*p,tVol:0.62,tDur:0.12,tail:0.32,tailVol:0.34,tailLp:1500},
    rifle:{nDur:0.07,nVol:0.58,hp:1400,lp:8000,thump:140*p,tVol:0.4,tDur:0.06,tail:0.14,tailVol:0.2,tailLp:2400},
    gl:{nDur:0.12,nVol:0.55,hp:250,lp:1800,thump:52*p,tVol:0.7,tDur:0.16,tail:0.28,tailVol:0.3,tailLp:900}
  }[kind];
  if(!cfg){audio.gunVoices--;return;}
  function noise(dur,vol,hp,lp,atk,dec){
    var s=ctx.createBufferSource();s.buffer=getNoiseBuf(Math.max(dur,0.2));
    var f1=ctx.createBiquadFilter();f1.type="highpass";f1.frequency.value=hp;f1.Q.value=0.7;
    var f2=ctx.createBiquadFilter();f2.type="lowpass";f2.frequency.value=lp;f2.Q.value=0.8;
    var g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(0.001,vol),t+atk);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dec);
    s.connect(f1);f1.connect(f2);f2.connect(g);g.connect(audio.sfxG);s.start(t);s.stop(t+dec+0.02);
  }
  /* sharp transient */
  noise(cfg.nDur,cfg.nVol,cfg.hp,cfg.lp,0.0015,cfg.nDur);
  /* low body thump */
  var o=ctx.createOscillator(),og=ctx.createGain();
  o.type="sine";o.frequency.setValueAtTime(cfg.thump,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,cfg.thump*0.45),t+cfg.tDur);
  og.gain.setValueAtTime(0.0001,t);og.gain.exponentialRampToValueAtTime(cfg.tVol,t+0.004);og.gain.exponentialRampToValueAtTime(0.0001,t+cfg.tDur);
  o.connect(og);og.connect(audio.sfxG);o.start(t);o.stop(t+cfg.tDur+0.02);
  /* click / case (pistol & smg) */
  if(kind!=="shotgun"){var o2=ctx.createOscillator(),g2=ctx.createGain();o2.type="triangle";o2.frequency.value=1800*p;g2.gain.setValueAtTime(0.12,t);g2.gain.exponentialRampToValueAtTime(0.0001,t+0.018);o2.connect(g2);g2.connect(audio.sfxG);o2.start(t);o2.stop(t+0.03);}
  /* decay tail */
  noise(cfg.tail,cfg.tailVol,200,cfg.tailLp,0.01,cfg.tail);
  var life=Math.max(cfg.nDur,cfg.tDur,cfg.tail)+0.02;
  setTimeout(function(){audio.gunVoices=Math.max(0,(audio.gunVoices||1)-1);},life*1000);
}
function beep(freq,dur,type,vol,slide){
  if(!ensureAudio()||!audio.sfxG)return;var t=audio.ctx.currentTime,o=audio.ctx.createOscillator(),g=audio.ctx.createGain();
  o.type=type||"square";o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,slide),t+dur);
  g.gain.setValueAtTime(vol||0.15,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);o.connect(g);g.connect(audio.sfxG);o.start(t);o.stop(t+dur+0.02);
}
function noiseBurst(dur,vol){
  if(!ensureAudio()||!audio.sfxG)return;var n=Math.max(1,(audio.ctx.sampleRate*dur)|0),buf=audio.ctx.createBuffer(1,n,audio.ctx.sampleRate),d=buf.getChannelData(0);
  for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);var s=audio.ctx.createBufferSource();s.buffer=buf;var g=audio.ctx.createGain();g.gain.value=vol||0.2;s.connect(g);g.connect(audio.sfxG);s.start();
}
function sfx(name,extra){
  if(audio.mutedSfx&&name!=="unlock")return;
  switch(name){
    case"mash":musOsc(audio.sfxG,"sine",180,audio.ctx.currentTime,0.07,0.22,90);noiseBurst(0.05,0.1);break;
    case"shot_pistol":gunshot("pistol");break;
    case"shot_shotgun":gunshot("shotgun");break;
    case"shot_smg":gunshot("smg");break;
    case"shot_revolver":gunshot("revolver");break;
    case"shot_rifle":gunshot("rifle");break;
    case"shot_gl":gunshot("gl");break;
    case"melee":beep(200,0.08,"sawtooth",0.18,80);break;
    case"hit":beep(150,0.05,"triangle",0.1,60);break;
    case"death":beep(120,0.2,"sawtooth",0.14,40);noiseBurst(0.15,0.12);painSfx("death");break;
    case"groan":zombieMoan();break;
    case"explode":noiseBurst(0.35,0.4);beep(80,0.3,"sawtooth",0.2,30);break;
    case"hurt":noiseBurst(0.05,0.08);painSfx("hurt");break;
    case"hurt_big":noiseBurst(0.08,0.12);painSfx("big");break;
    case"jump":beep(420,0.08,"sine",0.1,600);break;
    case"xp":beep(660,0.05,"sine",0.08,990);break;
    case"level":beep(523,0.1,"square",0.12);setTimeout(function(){beep(659,0.1,"square",0.12);},80);setTimeout(function(){beep(784,0.18,"square",0.14);},160);break;
    case"card":beep(440,0.06,"triangle",0.1);beep(660,0.08,"triangle",0.08);break;
    case"rarity0":beep(330,0.08,"triangle",0.08);break;
    case"rarity1":beep(440,0.08,"triangle",0.09);beep(554,0.1,"triangle",0.08);break;
    case"rarity2":beep(523,0.08,"square",0.1);beep(659,0.1,"square",0.09);beep(784,0.12,"square",0.08);break;
    case"rarity3":beep(392,0.1,"sawtooth",0.12);beep(494,0.1,"sawtooth",0.1);beep(587,0.15,"sawtooth",0.12);break;
    case"rarity4":beep(523,0.08,"square",0.14);beep(659,0.08,"square",0.12);beep(784,0.08,"square",0.12);beep(1046,0.25,"triangle",0.16);noiseBurst(0.2,0.1);break;
    case"wave":beep(200,0.15,"square",0.12,400);break;
    case"clear":beep(523,0.1,"sine",0.1);beep(659,0.12,"sine",0.1);beep(784,0.18,"sine",0.12);break;
    case"boss":beep(60,0.4,"sawtooth",0.22,40);noiseBurst(0.3,0.2);break;
    case"sting":beep(48,0.55,"sawtooth",0.28,28);beep(36,0.7,"sine",0.22,22);noiseBurst(0.25,0.22);break;
    case"growl":beep(70,0.55,"sawtooth",0.2,32);beep(48,0.7,"triangle",0.16,24);noiseBurst(0.35,0.16);break;
    case"laugh":
      (function(){var i,d=0;for(i=0;i<5;i++){setTimeout(function(){beep(210+Math.random()*70,0.11,"sawtooth",0.13,90);},d*1000);d+=0.11+Math.random()*0.04;}})();
      break;
    case"stomp":noiseBurst(0.22,0.32);beep(46,0.28,"sine",0.24,22);beep(70,0.16,"sawtooth",0.1,30);break;
    case"foot_heavy":noiseBurst(0.08,0.16);beep(58,0.12,"sine",0.16,32);break;
    case"click":beep(800,0.04,"square",0.08);break;
    case"dash":beep(900,0.06,"sine",0.1,200);break;
    case"zap":beep(980,0.05,"square",0.1,220);beep(1400,0.08,"sawtooth",0.08,400);noiseBurst(0.06,0.08);break;
    case"slash":beep(240,0.06,"sawtooth",0.16,90);beep(520,0.05,"triangle",0.08,200);break;
    case"flame":noiseBurst(0.12,0.1);beep(90,0.1,"sawtooth",0.06,50);break;
    case"storm":beep(80,0.25,"sawtooth",0.16,40);beep(1200,0.2,"sawtooth",0.08,400);noiseBurst(0.25,0.18);break;
    case"laser_hum":startLaserHum();break;
    case"laser_hum_off":stopLaserHum();break;
    case"crackle":if(Math.random()<0.65){musOsc(audio.sfxG,"sawtooth",900+Math.random()*700,audio.ctx.currentTime,0.05,0.07,200);noiseBurst(0.04,0.07);}break;
  }
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
function startLaserHum(){
  if(!ensureAudio()||audio.mutedSfx||!audio.sfxG)return;
  stopLaserHum();
  var ctx=audio.ctx,t=ctx.currentTime,g=ctx.createGain(),f=ctx.createBiquadFilter(),o1=ctx.createOscillator(),o2=ctx.createOscillator(),src,buf,n,i,d,nf,ng;
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.2,t+0.1);
  f.type="lowpass";f.frequency.value=1400;f.Q.value=0.7;
  o1.type="sawtooth";o1.frequency.value=62;o2.type="sawtooth";o2.frequency.value=67;
  o1.connect(f);o2.connect(f);f.connect(g);g.connect(audio.sfxG);
  o1.start();o2.start();
  buf=getNoiseBuf(2)||(function(){n=(ctx.sampleRate*2)|0;buf=ctx.createBuffer(1,n,ctx.sampleRate);d=buf.getChannelData(0);for(i=0;i<n;i++)d[i]=Math.random()*2-1;return buf;})();
  src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
  nf=ctx.createBiquadFilter();nf.type="bandpass";nf.frequency.value=1800;nf.Q.value=0.6;
  ng=ctx.createGain();ng.gain.value=0.08;src.connect(nf);nf.connect(ng);ng.connect(g);src.start();
  audio.laserHum={g:g,os:[o1,o2],src:src,ng:ng};
}
function stopLaserHum(){
  var h=audio.laserHum,t;
  if(!h)return;audio.laserHum=null;
  try{t=audio.ctx?audio.ctx.currentTime:0;h.g.gain.cancelScheduledValues(t);h.g.gain.setValueAtTime(Math.max(0.0001,h.g.gain.value),t);h.g.gain.linearRampToValueAtTime(0.0001,t+0.12);}catch(e){}
  setTimeout(function(){
    try{h.os.forEach(function(o){o.stop();});h.src.stop();h.g.disconnect();}catch(e){}
  },160);
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
function zombieMoan(){
  if(!ensureAudio()||audio.mutedSfx||!audio.sfxG)return;
  var ctx=audio.ctx,t=ctx.currentTime,dur=0.4+Math.random()*0.55,p=62+Math.random()*38;
  var o=ctx.createOscillator(),o2=ctx.createOscillator(),f1=ctx.createBiquadFilter(),f2=ctx.createBiquadFilter(),g=ctx.createGain();
  o.type="sawtooth";o2.type="triangle";
  o.frequency.setValueAtTime(p,t);o.frequency.linearRampToValueAtTime(p*(0.65+Math.random()*0.25),t+dur);
  o2.frequency.setValueAtTime(p*1.5,t);
  f1.type="bandpass";f1.frequency.value=320+Math.random()*220;f1.Q.value=4.5;
  f2.type="bandpass";f2.frequency.value=700+Math.random()*300;f2.Q.value=3.5;
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.22,t+0.05);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(f1);o2.connect(f1);f1.connect(f2);f2.connect(g);g.connect(audio.sfxG);
  o.start(t);o2.start(t);o.stop(t+dur+0.02);o2.stop(t+dur+0.02);
  noiseBurst(dur*0.45,0.05);
}
function painSfx(kind){
  if(!ensureAudio()||audio.mutedSfx||!audio.sfxG)return;
  var now=(typeof performance!=="undefined"&&performance.now)?performance.now():Date.now();
  if(kind!=="death"&&audio.lastPain&&now-audio.lastPain<300)return;
  audio.lastPain=now;
  var ctx=audio.ctx,t=ctx.currentTime;
  var dur=kind==="death"?0.58:kind==="big"?0.34:0.18;
  var pitch=kind==="death"?88:kind==="big"?118+Math.random()*28:148+Math.random()*42;
  var o=ctx.createOscillator(),f1=ctx.createBiquadFilter(),f2=ctx.createBiquadFilter(),g=ctx.createGain();
  o.type="sawtooth";o.frequency.setValueAtTime(pitch,t);o.frequency.exponentialRampToValueAtTime(pitch*0.52,t+dur);
  f1.type="bandpass";f1.frequency.value=kind==="death"?480:620+Math.random()*80;f1.Q.value=6;
  f2.type="bandpass";f2.frequency.value=kind==="death"?880:1150+Math.random()*120;f2.Q.value=5;
  var vol=kind==="death"?0.48:kind==="big"?0.34:0.22;
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(f1);f1.connect(f2);f2.connect(g);g.connect(audio.sfxG);
  o.start(t);o.stop(t+dur+0.02);
  noiseBurst(dur*0.4,kind==="death"?0.12:0.045);
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
function startMenuImmediate(){
  audio.musicMode="menu";
  audio._wantMenuBuf=1;
  if(audio.mutedMus)return;
  createAudioGraph();
  if(audio.menuBuf){startMenuBuffer(audio.droneBus?1:0);return;}
  tryDecodeMenu();
  if(audio.menuBuf){startMenuBuffer(0);return;}
  if(!audio._menuFailed){startDrone();return;}
  ensureMusicBeds();hookBedNodes();unlockBeds();
  var B=audio.beds&&audio.beds.menu,pr;
  if(B){
    B.wanted=1;
    try{B.el.muted=false;if(B.el.paused){pr=B.el.play();if(pr&&pr.catch)pr.catch(function(){});}}catch(e){}
    fadeBed(B,1,0.08);
    audio._soundPath="element";
    markSoundStarted();
  }
}
function dismissTitleSplash(){
  if(!titleSplash)return 0;
  titleSplash=0;audio._splashEat=1;
  return 1;
}
function onFirstAudioGesture(){
  if(audio._tapped){
    if(titleSplash)dismissTitleSplash();
    return;
  }
  audio._tapped=1;
  audio._tapT=(typeof performance!=="undefined"?performance.now():Date.now());
  dismissTitleSplash();
  createAudioGraph();
  try{if(audio.ctx&&audio.ctx.state==="suspended")audio.ctx.resume();}catch(e){}
  audio.started=1;
  if(!audio.mutedMus&&(!audio.musicMode||audio.musicMode==="menu"))startMenuImmediate();
  else ensureAudio();
}
if(typeof window!=="undefined"){
  window.addEventListener("pointerdown",onFirstAudioGesture,true);
  window.addEventListener("touchstart",onFirstAudioGesture,{capture:true,passive:true});
  window.__audio=audio;
  try{createAudioGraph();}catch(e){}
  preloadMenuBuf();
}
