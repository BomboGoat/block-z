var audio={ctx:null,master:null,sfxG:null,musG:null,mutedSfx:0,mutedMus:0,musicTimer:null,musicMode:null,started:0,step:0};
var titleSplash=1;
function loadAudioSettings(){var s=lsGet("bz_audio",null);if(s){audio.mutedSfx=!!s.sfx;audio.mutedMus=!!s.mus;}}
function saveAudioSettings(){lsSet("bz_audio",{sfx:audio.mutedSfx?1:0,mus:audio.mutedMus?1:0});}
var MUS_BEDS={
  menu:"assets/mus/menu.mp3",
  play:"assets/mus/play.mp3",
  colo:"assets/mus/colo.mp3",
  home:"assets/mus/home.mp3",
  home2:"assets/mus/home2.mp3",
  final:"assets/mus/final.mp3",
  gorgon:"assets/mus/gorgon.mp3",
  thanos:"assets/mus/thanos.mp3"
};
function musicBedKey(mode){return (mode&&MUS_BEDS[mode])?mode:null;}
function ensureMusicBeds(){
  if(audio.beds)return;
  audio.beds={};
  Object.keys(MUS_BEDS).forEach(function(k){
    var a=new Audio(MUS_BEDS[k]+(MUS_BEDS[k].indexOf("?")>=0?"":"?v=20.4.1"));
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
  try{
    if(!createAudioGraph())return null;
    if(audio.ctx.state==="suspended"){var rp=audio.ctx.resume();if(rp&&rp.then)rp.catch(function(){});}
    audio.started=1;
    ensureMusicBeds();hookBedNodes();
    if(fresh&&audio.musicMode)startMusic(audio.musicMode);
    setTimeout(function(){try{decodeFetchedSfx();bakeSfxSync();}catch(e){}},0);
    return audio.ctx;
  }catch(e){return audio.ctx||null;}
}
function setMuteSfx(v){audio.mutedSfx=!!v;if(audio.sfxG)audio.sfxG.gain.value=audio.mutedSfx?0:0.55;saveAudioSettings();}
function setMuteMus(v){audio.mutedMus=!!v;if(audio.musG)audio.musG.gain.value=audio.mutedMus?0:0.42;saveAudioSettings();}

var SFX_UI={unlock:1,click:1,card:1,rarity0:1,rarity1:1,rarity2:1,rarity3:1,rarity4:1,xp:1,level:1,wave:1,clear:1};
var SFX_BOSS={boss:1,sting:1,growl:1,laugh:1,stomp:1,foot_heavy:1,gorgon_roar:1,gorgon_growl:1,portal:1};
var SFX_FILES={
  explode:"assets/sfx/explode.mp3",click:"assets/sfx/click.mp3",foot_heavy:"assets/sfx/foot_heavy.mp3",
  death:"assets/sfx/death.mp3",dash:"assets/sfx/dash.mp3",wave:"assets/sfx/wave.mp3",
  shot_gl:"assets/sfx/shot_gl.mp3",growl:"assets/sfx/growl.mp3",zap:"assets/sfx/zap.mp3",
  stomp:"assets/sfx/stomp.mp3",sting:"assets/sfx/sting.mp3",slash:"assets/sfx/slash.mp3",
  shot_smg:"assets/sfx/shot_smg.mp3",shot_shotgun:"assets/sfx/shot_shotgun.mp3",
  shot_rifle:"assets/sfx/shot_rifle.mp3",shot_revolver:"assets/sfx/shot_revolver.mp3",
  shot_pistol:"assets/sfx/shot_pistol.mp3",melee:"assets/sfx/melee.mp3",jump:"assets/sfx/jump.mp3",
  whoosh:"assets/sfx/whoosh.mp3",fire_whoosh:"assets/sfx/fire_whoosh.mp3",
  grunt:"assets/sfx/grunt.mp3",thud:"assets/sfx/thud.mp3",
  clear:"assets/sfx/clear.mp3",card:"assets/sfx/card.mp3",storm:"assets/sfx/storm.mp3",
  mash:"assets/sfx/mash.mp3",level:"assets/sfx/level.mp3",laugh:"assets/sfx/laugh.mp3",
  hurt:"assets/sfx/hurt.mp3",hit:"assets/sfx/hit.mp3",crackle:"assets/sfx/crackle.mp3",
  boss:"assets/sfx/boss.mp3",splash:"assets/sfx/splash.mp3",laser_loop:"assets/sfx/laser_loop.mp3",
  rarity0:"assets/sfx/rarity0.mp3",rarity1:"assets/sfx/rarity1.mp3",rarity2:"assets/sfx/rarity2.mp3",
  rarity3:"assets/sfx/rarity3.mp3",rarity4:"assets/sfx/rarity4.mp3",
  gorgon_roar:"assets/sfx/gorgon_roar.mp3",gorgon_growl:"assets/sfx/gorgon_growl.mp3",portal:"assets/sfx/portal.mp3",
  fire_loop:"assets/sfx/fire_loop.mp3",fire_ignite:"assets/sfx/fire_ignite.mp3",
  thanos_voice:"assets/sfx/thanos_voice.mp3",thanos_boom:"assets/sfx/thanos_boom.mp3",
  final_snap:"assets/sfx/final_snap.mp3",final_voice_classic:"assets/sfx/final_voice_classic.mp3",final_voice_trueno:"assets/sfx/final_voice_trueno.mp3",
  final_voice_mr:"assets/sfx/final_voice_mr.mp3",final_voice_gompa:"assets/sfx/final_voice_gompa.mp3",
  final_voice_neizan:"assets/sfx/final_voice_neizan.mp3",neizan_shot:"assets/sfx/neizan_shot.mp3",
  minigun_spin:"assets/sfx/minigun_spin.mp3",minigun_loop:"assets/sfx/minigun_loop.mp3",minigun_stop:"assets/sfx/minigun_stop.mp3"
};
function combatLive(){return typeof game!=="undefined"&&game&&game.state==="playing";}
function sfxAllowed(name){
  if(name==="unlock")return 1;
  if(SFX_UI[name])return 1;
  if(typeof game==="undefined"||!game)return 0;
  if(game.state==="playing")return 1;
  if(game.state==="hell_cine"||game.state==="hell_trans"||game.state==="level_done"||game.state==="hell_final")return 1;
  if(game.state==="boss_intro"&&SFX_BOSS[name])return 1;
  return 0;
}
function stopCombatLoops(){stopLaserHum();stopFireLoop();stopMiniLoop();}
/* v20.4: Neizan's minigun (real recorded M61 loop, CC0) */
function startMiniLoop(){
  if(!ensureAudio()||audio.mutedSfx||!audio.sfxG||!combatLive())return;
  if(!audio._baked)bakeSfxSync();
  if(audio.miniLoop&&audio.miniLoop.alive)return;
  var ctx=audio.ctx,t=ctx.currentTime,buf=audio.sfxBuf&&audio.sfxBuf.minigun_loop;if(!buf)return;
  var g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.5,t+0.05);g.connect(audio.sfxG);
  var src=ctx.createBufferSource();src.buffer=buf;src.loop=true;src.connect(g);
  try{src.start(t);}catch(e){return;}
  audio.miniLoop={g:g,src:src,alive:1};
}
function stopMiniLoop(){
  var h=audio.miniLoop,t;if(!h)return;audio.miniLoop=null;h.alive=0;
  try{t=audio.ctx.currentTime;h.g.gain.cancelScheduledValues(t);h.g.gain.setValueAtTime(Math.max(0.0001,h.g.gain.value||0.0001),t);h.g.gain.linearRampToValueAtTime(0.0001,t+0.08);h.src.stop(t+0.12);}catch(e){}
}
function noteGameState(){
  if(typeof game==="undefined"||!game)return;
  var st=game.state;
  if(audio._st===st)return;
  audio._st=st;
  if(st!=="playing")stopCombatLoops();
}

function prefetchSfx(){
  if(audio._sfxPrefetch)return;
  audio._sfxPrefetch=1;audio.sfxRaw=audio.sfxRaw||{};
  Object.keys(SFX_FILES).forEach(function(k){
    if(audio.sfxRaw[k])return;
    var ctrl=typeof AbortController==="function"?new AbortController():null;
    var to=setTimeout(function(){try{if(ctrl)ctrl.abort();}catch(e){}},8000);
    fetch(SFX_FILES[k]+"?v=20.4.1",ctrl?{signal:ctrl.signal}:undefined).then(function(r){return r&&r.ok?r.arrayBuffer():null;}).then(function(ab){
      clearTimeout(to);
      if(ab)audio.sfxRaw[k]=ab;
      if(audio.ctx)decodeFetchedSfx();
    }).catch(function(){clearTimeout(to);});
  });
}
function decodeFetchedSfx(){
  if(!audio.ctx)return;
  audio.sfxBuf=audio.sfxBuf||{};
  Object.keys(audio.sfxRaw||{}).forEach(function(k){
    if(audio.sfxBuf[k]||!audio.sfxRaw[k]||audio["_dec_"+k])return;
    audio["_dec_"+k]=1;
    var done=0,timer;
    function ok(buf){if(done)return;done=1;if(timer)clearTimeout(timer);if(buf)audio.sfxBuf[k]=buf;}
    function fail(){if(done)return;done=1;if(timer)clearTimeout(timer);audio["_dec_"+k]=0;}
    timer=setTimeout(fail,5000);
    try{
      var src=audio.sfxRaw[k],ab=src.slice?src.slice(0):src;
      var ret=audio.ctx.decodeAudioData(ab,ok,fail);
      if(ret&&typeof ret.then==="function")ret.then(ok,fail);
    }catch(e){fail();}
  });
}
function bakeSfxSync(){
  if(!audio.ctx)return;
  decodeFetchedSfx();
  /* aliases */
  audio.sfxBuf=audio.sfxBuf||{};
  if(audio.sfxBuf.click){audio.sfxBuf.unlock=audio.sfxBuf.unlock||audio.sfxBuf.click;audio.sfxBuf.xp=audio.sfxBuf.xp||audio.sfxBuf.click;}
  initVoicePool();
  audio._baked=1;
}

function initVoicePool(){
  if(!audio.ctx||!audio.sfxG||audio.voices)return;
  var n=8,i,ch;
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
  if(!ch)return 0;
  try{ch.src.buffer=buf;}catch(e){armVoice(ch);try{ch.src.buffer=buf;}catch(e2){return 0;}}
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
  return n<2?1:0;
}
function gunshot(kind){playSfxBuf("shot_"+(kind||"pistol"),0.9);}
function beep(freq,dur,type,vol,slide){if(!playSfxBuf("click",vol||0.1))return;}
function noiseBurst(dur,vol){playSfxBuf("hit",vol||0.2);}

function startLaserHum(){
  if(!ensureAudio()||audio.mutedSfx||!audio.sfxG)return;
  if(!combatLive())return;
  if(!audio._baked)bakeSfxSync();
  if(audio.laserHum&&audio.laserHum.alive)return;
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
  setTimeout(function(){try{h.src.stop();}catch(e){};try{h.src.disconnect();}catch(e){};try{h.g.disconnect();}catch(e){};},140);
}

/* v20.2.0: looping wheat-fire crackle (recorded CC0), volume follows distance */
function startFireLoop(vol){
  if(!ensureAudio()||audio.mutedSfx||!audio.sfxG||!combatLive())return;
  if(!audio._baked)bakeSfxSync();
  var buf=audio.sfxBuf&&audio.sfxBuf.fire_loop;if(!buf)return;
  if(audio.fireLoop&&audio.fireLoop.alive){setFireLoopVol(vol);return;}
  var ctx=audio.ctx,t=ctx.currentTime,g=ctx.createGain(),src;
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(Math.max(0.0002,vol==null?0.3:vol),t+0.6);
  g.connect(audio.sfxG);
  src=ctx.createBufferSource();src.buffer=buf;src.loop=true;src.connect(g);
  try{src.start(t);}catch(e){return;}
  audio.fireLoop={g:g,src:src,alive:1};
}
function setFireLoopVol(vol){
  var h=audio.fireLoop;if(!h||!h.alive||!audio.ctx)return;
  try{h.g.gain.setTargetAtTime(Math.max(0.0002,vol),audio.ctx.currentTime,0.15);}catch(e){}
}
function stopFireLoop(){
  var h=audio.fireLoop,t;if(!h)return;audio.fireLoop=null;h.alive=0;
  try{t=audio.ctx.currentTime;h.g.gain.cancelScheduledValues(t);h.g.gain.setValueAtTime(Math.max(0.0001,h.g.gain.value||0.0001),t);h.g.gain.linearRampToValueAtTime(0.0001,t+0.5);}catch(e){}
  setTimeout(function(){try{h.src.stop();}catch(e){};try{h.src.disconnect();}catch(e){};try{h.g.disconnect();}catch(e){};},600);
}

function sfx(name,extra){
  noteGameState();
  if(name&&name.indexOf("rarity")===0&&!SFX_FILES[name])name="rarity0";
  if(name==="unlock")name="click";
  if(name==="xp")name="click";
  if(name!=="laser_hum"&&name!=="laser_hum_off"&&!sfxAllowed(name))return;
  if(name==="laser_hum"){if(sfxAllowed("storm")||combatLive())startLaserHum();return;}
  if(name==="laser_hum_off"){stopLaserHum();return;}
  if(name&&name.indexOf("shot_")==0){gunshot(name.slice(5));return;}
  var vol=0.85;
  if(extra&&typeof extra==="number")vol=extra;
  playSfxBuf(name,vol);
}

function startBed(key,vol,dur){
  ensureMusicBeds();hookBedNodes();
  var b=audio.beds&&audio.beds[key];if(!b||!b.el)return;
  b.wanted=1;
  try{if(b.el.paused){var pr=b.el.play();if(pr&&pr.then)pr.catch(function(){});}}catch(e){}
  fadeBed(b,vol==null?1:vol,dur||0.8);
}
function startMusic(mode){
  if(!mode){stopMusic();return;}
  if(!ensureAudio()||!audio.ctx){audio.musicMode=mode;return;}
  if(audio.mutedMus){audio.musicMode=mode;return;}
  var bed=musicBedKey(mode)||"play";
  if(audio.musicMode===mode&&audio.beds&&audio.beds[bed]&&audio.beds[bed].wanted)return;
  audio.musicMode=mode;
  ensureMusicBeds();hookBedNodes();unlockBeds();
  Object.keys(audio.beds||{}).forEach(function(k){
    var b=audio.beds[k];
    if(k===bed)return;
    if(b.wanted||(b.gain&&b.gain.gain.value>0.001)){b.wanted=0;fadeBed(b,0,0.7);setTimeout(function(){if(!b.wanted){try{b.el.pause();}catch(e){}}},780);}
  });
  startBed(bed, mode==="menu"?0.85:0.95, 0.7);
}
function stopMusic(){
  audio.musicMode=null;
  if(audio.musicTimer){clearTimeout(audio.musicTimer);audio.musicTimer=null;}
  fadeOutBeds(0.6);
}
try{prefetchSfx();ensureMusicBeds();}catch(e){}

function dismissTitleSplash(){
  if(!titleSplash)return 0;
  titleSplash=0;audio._splashEat=1;
  /* Only swallow leftover events from this same gesture — a later tap on JUGAR must work. */
  setTimeout(function(){try{if(audio)audio._splashEat=0;}catch(e){}},80);
  return 1;
}
function unlockAudioNonBlocking(){
  try{
    createAudioGraph();
    if(audio.ctx&&audio.ctx.state==="suspended"){var rp=audio.ctx.resume();if(rp&&rp.then)rp.catch(function(){});}
    audio.started=1;
    ensureMusicBeds();hookBedNodes();unlockBeds();
    if(!audio.mutedMus&&(!audio.musicMode||audio.musicMode==="menu"))startMusic("menu");
    setTimeout(function(){try{decodeFetchedSfx();bakeSfxSync();}catch(e){}},0);
  }catch(e){}
}
function onFirstAudioGesture(e){
  var typ=e&&e.type;
  /* iOS Safari only treats click and touchend as audio-activation gestures.
     Always dismiss the splash first so a failed/slow decode can never trap the player. */
  if(typ!=="click"&&typ!=="touchend"&&typ!=="pointerup")return;
  var first=!!titleSplash;
  dismissTitleSplash();
  if(typ==="pointerup"&&!first&&audio._unlocked)return;
  if(typ==="click"||typ==="touchend"||first){
    try{unlockAudioNonBlocking();}catch(err){}
    audio._tapped=1;audio._unlocked=1;
  }
}
if(typeof window!=="undefined"){
  window.addEventListener("click",onFirstAudioGesture,true);
  window.addEventListener("touchend",onFirstAudioGesture,{capture:true,passive:true});
  window.addEventListener("pointerup",onFirstAudioGesture,{capture:true,passive:true});
  window.__audio=audio;
  document.addEventListener("visibilitychange",function(){if(!document.hidden){try{if(audio.ctx&&audio.ctx.state==="suspended")audio.ctx.resume();}catch(e){}}});
  window.addEventListener("pageshow",function(){try{if(audio.ctx&&audio.ctx.state==="suspended")audio.ctx.resume();}catch(e){}});
}
