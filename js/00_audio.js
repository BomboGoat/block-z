var audio={ctx:null,master:null,sfxG:null,musG:null,mutedSfx:0,mutedMus:0,musicTimer:null,musicMode:null,started:0,step:0};
function loadAudioSettings(){var s=lsGet("bz_audio",null);if(s){audio.mutedSfx=!!s.sfx;audio.mutedMus=!!s.mus;}}
function saveAudioSettings(){lsSet("bz_audio",{sfx:audio.mutedSfx?1:0,mus:audio.mutedMus?1:0});}
function ensureAudio(){
  if(audio.ctx){if(audio.ctx.state==="suspended")audio.ctx.resume();return audio.ctx;}
  try{
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
    audio.ctx=new AC();audio.master=audio.ctx.createGain();audio.master.gain.value=0.7;
    audio.comp=audio.ctx.createDynamicsCompressor();
    audio.comp.threshold.value=-16;audio.comp.knee.value=10;audio.comp.ratio.value=5;
    audio.comp.attack.value=0.003;audio.comp.release.value=0.14;
    audio.master.connect(audio.comp);audio.comp.connect(audio.ctx.destination);
    audio.sfxG=audio.ctx.createGain();audio.sfxG.gain.value=audio.mutedSfx?0:0.9;audio.sfxG.connect(audio.master);
    audio.musG=audio.ctx.createGain();audio.musG.gain.value=audio.mutedMus?0:0.28;audio.musG.connect(audio.master);
    audio.gunVoices=0;audio.started=1;return audio.ctx;
  }catch(e){return null;}
}
function setMuteSfx(v){audio.mutedSfx=!!v;if(audio.sfxG)audio.sfxG.gain.value=audio.mutedSfx?0:0.9;saveAudioSettings();}
function setMuteMus(v){audio.mutedMus=!!v;if(audio.musG)audio.musG.gain.value=audio.mutedMus?0:0.28;saveAudioSettings();}
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
    case"storm":beep(80,0.25,"sawtooth",0.16,40);beep(1200,0.2,"square",0.1,300);noiseBurst(0.25,0.18);break;
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
function startMusic(mode){
  if(!mode){stopMusic();return;}
  if(!ensureAudio()||!audio.ctx){audio.musicMode=mode;return;}
  if(audio.mutedMus){audio.musicMode=mode;return;}
  if(audio.musicMode===mode&&audio.musBus&&audio.musicTimer)return;
  if(audio.musBus)fadeOutBus(audio.musBus,0.7);
  if(audio.musicTimer){clearTimeout(audio.musicTimer);audio.musicTimer=null;}
  audio.musicGen=(audio.musicGen||0)+1;
  var gen=audio.musicGen,bus=audio.ctx.createGain(),now=audio.ctx.currentTime;
  bus.gain.setValueAtTime(0.0001,now);bus.gain.linearRampToValueAtTime(1,now+0.65);
  bus.connect(audio.musG);audio.musBus=bus;audio.musicMode=mode;audio.musicStep=0;
  function tick(){
    if(gen!==audio.musicGen||!audio.ctx||!audio.musBus)return;
    var t=audio.ctx.currentTime,s=audio.musicStep++,m=audio.musicMode,wait=0.28,n,bass,mel,ch;
    if(m==="menu"){
      /* Dark eerie horror intro, ~66 BPM, D minor, music-box, drones, wind, distant groans */
      wait=0.455;
      mel=[587.3,0,440.0,0, 698.5,0,659.3,0,  587.3,0,0,440.0, 523.3,0,440.0,0,
           698.5,659.3,0,587.3, 0,440.0,0,0,  587.3,0,349.2,0, 329.6,0,293.7,0];
      n=s%32;
      if(n%8===0){musOsc(bus,"sine",36.71,t,2.2,0.07);musOsc(bus,"sine",55.00,t,2.2,0.04);musChoir(bus,t,[146.8,174.6],2.0,0.02);}
      if(n===4||n===20)musWind(bus,t,2.8,0.03);
      if(n===18||n===30)musGroanMus(bus,t);
      if(mel[n])musBox(bus,t,mel[n],1.15,0.055);
    }else if(m==="play"){
      /* Calm horror tension, ~90 BPM, E minor, pulsing low synth, subtle perc, non-fatiguing */
      wait=0.333;
      bass=[82.41,82.41,82.41,82.41, 82.41,82.41,73.42,82.41, 82.41,82.41,82.41,61.74, 73.42,73.42,82.41,82.41];
      mel=[0,0,329.6,0, 0,392.0,0,0, 329.6,0,246.9,0, 0,293.7,0,0];
      n=s%16;
      musOsc(bus,"sine",bass[n],t,0.3,0.09);
      musOsc(bus,"triangle",bass[n]*0.5,t,0.32,0.08);
      if(n%8===0)musKick(bus,t,0.05);
      if(n%8===4)musNoise(bus,t,0.045,0.012,2200);
      if(n===0)musChoir(bus,t,[164.8,196.0,246.9],2.5,0.02);
      if(mel[n])musOsc(bus,"triangle",mel[n],t,0.5,0.03);
      if(n===10)musWind(bus,t,1.6,0.016);
    }else if(m==="colo"||m==="boss"){
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
      if(n%4===0)musChoir(bus,t,[233.1,246.9,277.2,349.2],0.6,0.04);
      musNoise(bus,t,0.06,0.02,400);
      var rise2=415.3*Math.pow(1.018,(s%24));
      musOsc(bus,"square",rise2,t,0.12,0.035);
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
      if(n%8===6)musOsc(bus,"square",196.0,t,0.28,0.05,138.6);
      if(n%16===8)musOsc(bus,"triangle",277.2,t,0.4,0.05,155.6);
    }
    audio.musicTimer=setTimeout(tick,wait*1000);
  }
  tick();
}
function stopMusic(){
  audio.musicGen=(audio.musicGen||0)+1;
  if(audio.musicTimer){clearTimeout(audio.musicTimer);audio.musicTimer=null;}
  if(audio.musBus)fadeOutBus(audio.musBus,0.3);
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
