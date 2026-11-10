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
    smg:{nDur:0.05,nVol:0.48,hp:2000,lp:10000,thump:190*p,tVol:0.28,tDur:0.04,tail:0.08,tailVol:0.14,tailLp:2800}
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
  if(audio.musBus)fadeOutBus(audio.musBus,0.45);
  if(audio.musicTimer){clearTimeout(audio.musicTimer);audio.musicTimer=null;}
  audio.musicGen=(audio.musicGen||0)+1;
  var gen=audio.musicGen,bus=audio.ctx.createGain(),now=audio.ctx.currentTime;
  bus.gain.setValueAtTime(0.0001,now);bus.gain.linearRampToValueAtTime(1,now+0.4);
  bus.connect(audio.musG);audio.musBus=bus;audio.musicMode=mode;audio.musicStep=0;
  function tick(){
    if(gen!==audio.musicGen||!audio.ctx||!audio.musBus)return;
    var t=audio.ctx.currentTime,s=audio.musicStep++,modeNow=audio.musicMode;
    var wait=0.28;
    if(modeNow==="menu"){
      wait=0.395; /* ~76 BPM */
      var pad=[146.8,174.6,220,196,220,261.6,220,174.6,164.8,174.6,220,146.8,130.8,146.8,174.6,196];
      var bass=[73.4,0,73.4,0,65.4,0,73.4,87.3,73.4,0,87.3,0,65.4,73.4,58.3,73.4];
      var n=s%pad.length;
      if(s%8===0){musOsc(bus,"sine",73.4,t,1.8,0.07);musOsc(bus,"sine",110,t,1.8,0.045);}
      musOsc(bus,"triangle",pad[n],t,0.36,0.1);
      if(bass[n])musOsc(bus,"sine",bass[n],t,0.32,0.08);
      if(s%16===4)musNoise(bus,t,0.5,0.03,400);
    } else if(modeNow==="play"){
      wait=0.227; /* ~132 BPM */
      var lead=[220,261.6,329.6,392,440,392,329.6,293.7,220,246.9,261.6,329.6,392,349.2,329.6,261.6];
      var bass=[110,110,130.8,164.8,110,98,82.4,130.8];
      var n=s%lead.length,b=s%bass.length;
      musOsc(bus,"square",lead[n],t,0.16,s%4===0?0.09:0.07);
      musOsc(bus,"triangle",bass[b],t,0.18,0.11);
      musOsc(bus,"sine",bass[b]/2,t,0.14,0.08); /* kick-ish */
      if(s%4===2)musNoise(bus,t,0.08,0.07,1400);
      if(s%2===1)musNoise(bus,t,0.03,0.03,5000);
    } else { /* boss: heavy, dark F# phrygian, distinct */
      wait=0.278; /* ~108 BPM */
      var bass=[92.5,92.5,92.5,98,92.5,82.4,69.3,92.5,87.3,92.5,110,92.5,69.3,73.4,61.7,92.5];
      var stab=[185,0,196,0,185,174.6,0,138.6,185,0,207.7,196,185,0,246.9,185];
      var n=s%bass.length;
      musOsc(bus,"sawtooth",bass[n],t,0.2,0.12,bass[n]*0.92);
      musOsc(bus,"sine",bass[n]/2,t,0.16,0.14);
      if(stab[n])musOsc(bus,"square",stab[n],t,0.12,0.07);
      if(s%4===0){musNoise(bus,t,0.1,0.1,200);musOsc(bus,"sine",48,t,0.18,0.16,30);}
      if(s%8===6)musOsc(bus,"sawtooth",277.2,t,0.22,0.06,185);
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
