/* v20.2.0 — upgrade-card input guard, damage-taken numbers + red edge flash, wheat-fire visuals.
   Everything here is cheap: sprites are pre-rendered once, particles are pooled and capped. */
function fxNow(){return (typeof performance!=="undefined"&&performance.now)?performance.now():Date.now();}

/* ================= 1. Upgrade screen guard ================= */
var UPG_GUARD_MS=700,UPG_REROLL_GUARD_MS=450,UPG_MOVE_TOL=22;
function upgradeOpened(ms){
  if(!game)return;
  game.upgradeOpenAt=fxNow();game.upgradeGuard=ms||UPG_GUARD_MS;
  if(typeof input!=="undefined")input.upPress=null;
}
function upgradeReady(){return game&&game.upgradeOpenAt!=null?(fxNow()-game.upgradeOpenAt>=(game.upgradeGuard||UPG_GUARD_MS)):1;}
function upgradeTargetAt(x,y){
  var b=game.rerollBtn,i,c;
  if(b&&(game.rerollLeft||0)>0&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return "reroll";
  for(i=0;i<game.upgradeCards.length;i++){c=game.upgradeCards[i];if(x>=c.x&&x<=c.x+c.w&&y>=c.y&&y<=c.y+c.h)return i;}
  return null;
}
function upgradeDown(e,pt){
  /* touches that began before the screen opened never reach here (no new pointerdown);
     taps during the guard window are ignored entirely */
  if(!upgradeReady()){input.upPress=null;return;}
  var tg=upgradeTargetAt(pt.x,pt.y);
  if(tg===null){input.upPress=null;return;}
  input.upPress={id:e.pointerId!=null?e.pointerId:-7,x:pt.x,y:pt.y,target:tg,moved:0};
}
function upgradeMove(e,pt){
  var pr=input.upPress;if(!pr)return;
  if((e.pointerId!=null?e.pointerId:-7)!==pr.id)return;
  if(Math.abs(pt.x-pr.x)>UPG_MOVE_TOL||Math.abs(pt.y-pr.y)>UPG_MOVE_TOL)pr.moved=1;
}
function upgradeUp(e,pt){
  var pr=input.upPress;
  if(!pr)return;
  if((e.pointerId!=null?e.pointerId:-7)!==pr.id)return;
  input.upPress=null;
  if(e.type==="pointercancel"||pr.moved||!upgradeReady())return;
  if(Math.abs(pt.x-pr.x)>UPG_MOVE_TOL||Math.abs(pt.y-pr.y)>UPG_MOVE_TOL)return;
  var tg=upgradeTargetAt(pt.x,pt.y);
  if(tg===null||tg!==pr.target)return;
  upgradeActivate(tg);
}
function upgradeActivate(tg){
  if(tg==="reroll"){
    if(!((game.rerollLeft||0)>0))return;
    game.rerollLeft=0;sfx("card");pickUpgradeChoices();upgradeOpened(UPG_REROLL_GUARD_MS);return;
  }
  var card=game.upgradeCards[tg];if(!card)return;
  card.upgrade.apply(game.player);sfx("card");sfx("rarity"+card.upgrade.rarity);
  input.upPress=null;game.upgradeOpenAt=null;
  startWave(game.wave+1);skipDtClamp=1;
}
/* per-card animation state, used by drawUpgradeUI */
function upgradeCardAnim(i){
  if(!game||game.upgradeOpenAt==null)return{a:1,grey:0,pressed:0};
  var el=fxNow()-game.upgradeOpenAt,g=game.upgradeGuard||UPG_GUARD_MS;
  var u=clamp((el-i*70)/330,0,1),ea=1-Math.pow(1-u,3);
  var grey=el<g?0.62:clamp(1-(el-g)/140,0,1)*0.62;
  var pr=typeof input!=="undefined"&&input.upPress;
  return{a:ea,grey:grey,pressed:pr&&!pr.moved&&pr.target===i?1:0,ready:el>=g};
}

/* ================= 3. Damage taken ================= */
var _hurtVig=null;
function onPlayerDamaged(p,dmg){
  if(!game||!(dmg>0))return;
  var n=Math.max(1,Math.round(dmg)),L=game.pdmg||(game.pdmg=[]),last=L[L.length-1];
  if(last&&last.age<0.22){last.v+=n;last.pop=1;last.age=Math.min(last.age,0.05);}
  else{L.push({v:n,age:0,ox:(Math.random()*2-1)*7,pop:1});if(L.length>6)L.shift();}
  game.hurtFlash=Math.min(1,(game.hurtFlash||0)+0.22+n/32);
}
function updateDamageFx(dt){
  var L=game.pdmg,i;
  if(L)for(i=L.length-1;i>=0;i--){L[i].age+=dt;if(L[i].pop>0)L[i].pop=Math.max(0,L[i].pop-dt*6);if(L[i].age>1.05)L.splice(i,1);}
  if(game.hurtFlash>0)game.hurtFlash=Math.max(0,game.hurtFlash-dt*1.9);
}
function drawPlayerDamage(){
  var L=game.pdmg,p=game.player;if(!L||!L.length||!p)return;
  var s=toScreen(p.x,p.y),sc=layout.scale,i,d,y,a,sz,txt,sct;
  ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineJoin="round";
  for(i=0;i<L.length;i++){
    d=L[i];a=d.age<0.75?1:clamp(1-(d.age-0.75)/0.3,0,1);
    y=s.y-46*sc*(CFG.CHAR||1)-Math.max(d.age*42,(L.length-1-i)*19+d.age*14);
    sz=Math.round(19+Math.min(9,d.v*0.28));sct=1+0.35*d.pop+(d.age<0.08?0.2*(1-d.age/0.08):0);
    txt="-"+d.v;
    ctx.globalAlpha=a;
    ctx.save();ctx.translate(s.x+d.ox,y);ctx.scale(sct,sct);
    ctx.font="900 "+sz+"px system-ui,Segoe UI,Helvetica Neue,sans-serif";
    ctx.strokeStyle="#2a0003";ctx.lineWidth=5;ctx.strokeText(txt,0,0);
    ctx.fillStyle="#ff2d2d";ctx.fillText(txt,0,0);
    ctx.fillStyle="rgba(255,200,200,0.55)";ctx.fillText(txt,0,-1.2);ctx.fillStyle="#ff2d2d";ctx.globalAlpha=a*0.6;ctx.fillText(txt,0,0.6);
    ctx.restore();
  }
  ctx.restore();ctx.globalAlpha=1;
}
function drawHurtFlash(){
  var h=game&&game.hurtFlash;if(!(h>0.01))return;
  if(!_hurtVig){
    var c=document.createElement("canvas");c.width=192;c.height=108;var g=c.getContext("2d");
    g.save();g.scale(1,108/192);
    var gr=g.createRadialGradient(96,96,40,96,96,112);
    gr.addColorStop(0,"rgba(200,0,0,0)");gr.addColorStop(0.55,"rgba(210,0,10,0.35)");gr.addColorStop(1,"rgba(230,10,20,1)");
    g.fillStyle=gr;g.fillRect(0,0,192,192);g.restore();_hurtVig=c;
  }
  /* only the edge bands are drawn: the centre of the vignette is transparent anyway */
  var vw=_hurtVig.width,vh=_hurtVig.height,bt=0.2,bs=0.13;
  ctx.save();ctx.globalAlpha=Math.min(0.85,h*0.9);
  ctx.drawImage(_hurtVig,0,0,vw,vh*bt,0,0,SW,SH*bt);
  ctx.drawImage(_hurtVig,0,vh*(1-bt),vw,vh*bt,0,SH*(1-bt),SW,SH*bt);
  ctx.drawImage(_hurtVig,0,vh*bt,vw*bs,vh*(1-2*bt),0,SH*bt,SW*bs,SH*(1-2*bt));
  ctx.drawImage(_hurtVig,vw*(1-bs),vh*bt,vw*bs,vh*(1-2*bt),SW*(1-bs),SH*bt,SW*bs,SH*(1-2*bt));
  ctx.restore();
}

/* ================= 2. Fuego en el trigal ================= */
var FIRE={strip:null,fw:64,fh:128,nf:8,glow:null,smoke:null};
function fireSprites(){
  if(FIRE.strip)return;
  var W=FIRE.fw,H=FIRE.fh,N=FIRE.nf,c=document.createElement("canvas");c.width=W*N;c.height=H;
  var g=c.getContext("2d"),f,k,u,x,y,r,ph,gr,col;
  g.globalCompositeOperation="lighter";
  for(f=0;f<N;f++){
    ph=f/N*Math.PI*2;
    for(k=0;k<30;k++){
      u=k/30;
      y=H*(0.92-u*0.8);
      x=f*W+W/2+Math.sin(u*5.2+ph+k*0.21)*W*0.13*u+Math.sin(ph*2+u*8)*W*0.045*u;
      r=W*0.34*(1-u*0.78)+1.5;
      col=u<0.16?[255,214,120,0.42]:u<0.42?[255,150,32,0.4]:u<0.7?[240,80,18,0.33]:[160,28,8,0.22];
      gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,"rgba("+col[0]+","+col[1]+","+col[2]+","+col[3]+")");
      gr.addColorStop(1,"rgba("+col[0]+","+col[1]+","+col[2]+",0)");
      g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();
    }
    /* side tongues */
    for(k=0;k<2;k++){
      var sx=f*W+W/2+(k?1:-1)*W*0.16,ty=H*(0.55-0.12*Math.sin(ph+k*2.1));
      for(u=0;u<1;u+=0.12){
        y=H*0.9-(H*0.9-ty)*u;x=sx+Math.sin(ph*1.5+u*6+k)*W*0.06;r=W*0.12*(1-u*0.7)+1;
        gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,"rgba(255,140,30,0.35)");gr.addColorStop(1,"rgba(255,80,10,0)");
        g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();
      }
    }
    gr=g.createRadialGradient(f*W+W/2,H*0.9,0,f*W+W/2,H*0.9,W*0.2);
    gr.addColorStop(0,"rgba(255,240,190,0.45)");gr.addColorStop(1,"rgba(255,200,100,0)");
    g.fillStyle=gr;g.beginPath();g.arc(f*W+W/2,H*0.9,W*0.2,0,7);g.fill();
  }
  FIRE.strip=c;
  var c2=document.createElement("canvas");c2.width=96;c2.height=96;var h=c2.getContext("2d");
  gr=h.createRadialGradient(48,48,0,48,48,48);gr.addColorStop(0,"rgba(255,150,40,0.85)");gr.addColorStop(0.45,"rgba(255,90,20,0.35)");gr.addColorStop(1,"rgba(200,40,0,0)");
  h.fillStyle=gr;h.fillRect(0,0,96,96);FIRE.glow=c2;
  var c3=document.createElement("canvas");c3.width=64;c3.height=64;var m=c3.getContext("2d");
  gr=m.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,"rgba(60,52,48,0.55)");gr.addColorStop(0.6,"rgba(50,44,40,0.25)");gr.addColorStop(1,"rgba(40,36,34,0)");
  m.fillStyle=gr;m.fillRect(0,0,64,64);FIRE.smoke=c3;
}
/* Wheat mask -> scorched overlay + flame anchors (built once per field) */
function fireBuildField(f){
  if(f._fireBuilt)return;
  f._fireBuilt=1;f._anchors=[];f._scorch=null;
  var PX=2,w=Math.max(4,Math.round(f.w*PX)),h=Math.max(4,Math.round(f.d*PX)),data=null,i,x,y,r,g,b,o,wheat;
  try{
    if(ART&&ART.arena&&ART.arena.width){
      var k=ART.arena.width/CFG.MAP_W,src=document.createElement("canvas");src.width=w;src.height=h;
      var sg=src.getContext("2d");sg.drawImage(ART.arena,f.x*k,f.y*k,f.w*k,f.d*k,0,0,w,h);
      data=sg.getImageData(0,0,w,h);
    }
  }catch(e){data=null;}
  var out=document.createElement("canvas");out.width=w;out.height=h;var og=out.getContext("2d"),od=og.createImageData(w,h),mask=new Uint8Array(w*h),raw=new Uint8Array(w*h),lum,n;
  for(y=0;y<h;y++)for(x=0;x<w;x++){
    i=y*w+x;o=i*4;
    if(data){r=data.data[o];g=data.data[o+1];b=data.data[o+2];wheat=(r>95&&r>=g&&r-b>80&&(b<r*0.27||(r>245&&g>185&&b<r*0.36)))?1:0;}
    else wheat=1;
    raw[i]=wheat;
  }
  /* 3x3 majority filter: drops path speckles, fills highlight holes */
  for(y=0;y<h;y++)for(x=0;x<w;x++){
    var cnt9=0,yy,xx;
    for(yy=y-1;yy<=y+1;yy++)for(xx=x-1;xx<=x+1;xx++)if(yy>=0&&xx>=0&&yy<h&&xx<w&&raw[yy*w+xx])cnt9++;
    if(cnt9<5)continue;
    i=y*w+x;o=i*4;mask[i]=1;
    if(data){r=data.data[o];g=data.data[o+1];b=data.data[o+2];}else{r=200;g=170;b=80;}
    n=(Math.sin(x*12.9898+y*78.233)*43758.5453)%1;if(n<0)n+=1;
    lum=(r+g+b)/3*0.2;
    if(n<0.06){od.data[o]=96;od.data[o+1]=90;od.data[o+2]=84;}
    else if(n>0.985){od.data[o]=210;od.data[o+1]=70;od.data[o+2]=20;}
    else{od.data[o]=lum*1.15+10|0;od.data[o+1]=lum*0.82+6|0;od.data[o+2]=lum*0.6+4|0;}
    od.data[o+3]=232;
  }
  og.putImageData(od,0,0);f._scorch=out;
  /* tiles that actually contain scorch (drawn instead of the whole rectangle) */
  var TS=64,tx,ty,x0,y0,x1,y1,minx,miny,maxx,maxy;f._tiles=[];
  for(ty=0;ty<h;ty+=TS)for(tx=0;tx<w;tx+=TS){
    minx=1e9;miny=1e9;maxx=-1;maxy=-1;x1=Math.min(w,tx+TS);y1=Math.min(h,ty+TS);
    for(y0=ty;y0<y1;y0++)for(x0=tx;x0<x1;x0++)if(mask[y0*w+x0]){if(x0<minx)minx=x0;if(x0>maxx)maxx=x0;if(y0<miny)miny=y0;if(y0>maxy)maxy=y0;}
    if(maxx>=0)f._tiles.push([minx,miny,maxx-minx+1,maxy-miny+1]);
  }
  /* anchors on a jittered grid, only on wheat */
  var step=15,cand=[],cx,cy,mx,my,cnt;
  for(cy=step*0.5;cy<f.d;cy+=step)for(cx=step*0.5;cx<f.w;cx+=step){
    mx=((cx+((cy*7)%5)-2)*PX)|0;my=(cy*PX)|0;
    if(mx<0||my<0||mx>=w||my>=h)continue;
    if(mask[my*w+mx])cand.push({x:f.x+cx+(Math.random()*8-4),y:f.y+cy+(Math.random()*6-3),ph:Math.random(),s:0.8+Math.random()*0.5});
  }
  for(i=cand.length-1;i>0;i--){cnt=(Math.random()*(i+1))|0;o=cand[i];cand[i]=cand[cnt];cand[cnt]=o;}
  var cap=f.w*f.d>20000?13:7;
  f._anchors=cand.slice(0,cap);
  if(!f._anchors.length)f._anchors=[{x:f.x+f.w/2,y:f.y+f.d/2,ph:0,s:1}];
}
function fireStart(ev){
  var f=ev.field;if(!f)return;
  fireSprites();fireBuildField(f);
  var p=game.player,ix=f.x+f.w*Math.random(),iy=f.y+f.d*Math.random();
  if(p){ix=clamp(p.x,f.x+10,f.x+f.w-10);iy=clamp(p.y,f.y+10,f.y+f.d-10);if(Math.abs(p.x-ix)+Math.abs(p.y-iy)<1){ix=f.x+f.w*Math.random();iy=f.y+f.d*Math.random();}}
  ev.fire={ix:ix,iy:iy,front:0,maxR:Math.sqrt(f.w*f.w+f.d*f.d),vt:0};
  f.regrowT=0;
  sfx("fire_ignite",0.9);
  if(typeof startFireLoop==="function")startFireLoop(0.05);
}
function fireIntensity(ev,a){
  var fr=ev.fire;if(!fr)return 0;
  var d=Math.sqrt((a.x-fr.ix)*(a.x-fr.ix)+(a.y-fr.iy)*(a.y-fr.iy)),v=clamp((fr.front-d)/26,0,1);
  if(ev.t<2)v*=Math.max(0,ev.t/2);
  return v;
}
function fireEvents(){var out=[],i,e;if(!game||!game.events)return out;for(i=0;i<game.events.length;i++){e=game.events[i];if(e.alive&&e.id==="fuego"&&e.field&&e.fire)out.push(e);}return out;}
var _emb=[],_smk=[],_embPool=[],EMB_CAP=30,SMK_CAP=4;
function updateFireFx(dt){
  var evs=fireEvents(),i,j,ev,f,a,v,p=game.player,best=1e9,dd;
  for(i=0;i<evs.length;i++){
    ev=evs[i];f=ev.field;ev.fire.front=Math.min(ev.fire.maxR+30,ev.fire.front+78*dt);
    var acts=f._anchors||[];
    for(j=0;j<acts.length;j++){
      a=acts[j];v=a._v=fireIntensity(ev,a);if(v<0.2)continue;
      if(_emb.length<EMB_CAP&&Math.random()<dt*1.6*v){
        var e=_embPool.pop()||{};e.x=a.x+rand(-6,6);e.y=a.y+rand(-3,3);e.h=rand(8,22);e.vx=rand(-14,14);e.vh=rand(34,70);e.life=e.max=rand(0.9,1.7);e.c=Math.random()<0.5?"#ffcc66":"#ff7a2e";_emb.push(e);
      }
      if(_smk.length<SMK_CAP&&Math.random()<dt*0.22*v){
        _smk.push({x:a.x+rand(-5,5),y:a.y,h:rand(26,36),vx:rand(4,14),vh:rand(16,26),life:2.6,max:2.6,s:rand(0.8,1.2)});
      }
    }
    if(p){dd=Math.max(0,Math.max(f.x-p.x,0,p.x-(f.x+f.w)))+Math.max(0,Math.max(f.y-p.y,0,p.y-(f.y+f.d)));if(dd<best)best=dd;}
  }
  for(i=_emb.length-1;i>=0;i--){a=_emb[i];a.life-=dt;a.x+=a.vx*dt+Math.sin((game.time||0)*6+i)*8*dt;a.h+=a.vh*dt;a.vh*=1-0.6*dt;if(a.life<=0){_embPool.push(a);_emb.splice(i,1);}}
  for(i=_smk.length-1;i>=0;i--){a=_smk[i];a.life-=dt;a.x+=a.vx*dt;a.h+=a.vh*dt;if(a.life<=0)_smk.splice(i,1);}
  /* crackle loop follows distance; restarts after pauses/upgrade */
  if(evs.length&&game.state==="playing"){
    game._fireVolT=(game._fireVolT||0)-dt;
    if(game._fireVolT<=0){game._fireVolT=0.25;var vol=0.42*clamp(1-best/300,0.1,1);
      var ramp=0;for(i=0;i<evs.length;i++)ramp=Math.max(ramp,clamp(evs[i].fire.front/60,0,1)*(evs[i].t<2?evs[i].t/2:1));
      if(typeof startFireLoop==="function")startFireLoop(Math.max(0.0003,vol*ramp));}
  }else if(typeof audio!=="undefined"&&audio.fireLoop&&typeof stopFireLoop==="function")stopFireLoop();
  /* regrowth of last round's scorched field */
  var bs=map&&map.bushes;if(bs)for(i=0;i<bs.length;i++)if(bs[i].regrowT>0){bs[i].regrowT-=dt;if(bs[i].regrowT<0)bs[i].regrowT=0;}
}
function drawFireUnder(ev){
  var f=ev.field;if(!f||!ev.fire)return;
  var s=toScreen(f.x,f.y),sc=layout.scale,w=f.w*sc,h=f.d*CFG.YSCALE*sc;
  if(s.x>SW+20||s.y>SH+20||s.x+w<-20||s.y+h<-20)return;
  var prog=clamp(ev.fire.front/(ev.fire.maxR*0.9),0,1);
  if(f._scorch){ctx.globalAlpha=0.25+0.75*prog;drawScorch(f,s,sc);ctx.globalAlpha=1;}
  var fade=ev.t<2?Math.max(0,ev.t/2):1,fl=0.8+0.2*Math.sin((game.time||0)*13)+0.1*Math.sin((game.time||0)*29);
  /* warm light pools on the ground under a few burning spots (small sprites, not a field-sized fill) */
  var acts=f._anchors||[],j,a,v,as,gw,gh,cnt=0;
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(j=0;j<acts.length&&cnt<3;j+=5){
    a=acts[j];v=a._v||0;if(v<0.1)continue;cnt++;
    as=toScreen(a.x,a.y);gw=58*sc*(0.7+0.3*v);gh=gw*0.55;
    ctx.globalAlpha=0.5*v*fl*fade;ctx.drawImage(FIRE.glow,as.x-gw/2,as.y-gh*0.6,gw,gh);
  }
  ctx.restore();
}
function drawScorch(f,s,sc){
  var T=f._tiles,i,t,kx=sc/2,ky=CFG.YSCALE*sc/2;
  if(!T){ctx.drawImage(f._scorch,s.x,s.y,f.w*sc,f.d*CFG.YSCALE*sc);return;}
  for(i=0;i<T.length;i++){t=T[i];ctx.drawImage(f._scorch,t[0],t[1],t[2],t[3],s.x+t[0]*kx,s.y+t[1]*ky,t[2]*kx,t[3]*ky);}
}
function drawScorchedRegrow(){
  var bs=map&&map.bushes,i,f,s,sc=layout.scale;if(!bs)return;
  for(i=0;i<bs.length;i++){f=bs[i];if(!(f.regrowT>0)||!f._scorch)continue;
    s=toScreen(f.x,f.y);ctx.globalAlpha=clamp(f.regrowT/6,0,1)*0.95;drawScorch(f,s,sc);ctx.globalAlpha=1;}
  /* burned but event over (rest of this round) */
  for(i=0;i<bs.length;i++){f=bs[i];if(!f.burned||!f._scorch||f._onFire)continue;
    s=toScreen(f.x,f.y);drawScorch(f,s,sc);}
}
function fireSortItems(list){
  var evs=fireEvents(),i,j,ev,a,v,s,acts,bs=map&&map.bushes;
  if(bs)for(i=0;i<bs.length;i++)bs[i]._onFire=0;
  for(i=0;i<evs.length;i++){
    ev=evs[i];ev.field._onFire=1;acts=ev.field._anchors||[];
    for(j=0;j<acts.length;j++){
      a=acts[j];v=a._v||0;if(v<0.03)continue;
      s=toScreen(a.x,a.y);if(s.x<-60||s.x>SW+60||s.y<-20||s.y>SH+120)continue;
      list.push({y:a.y,k:"fire",o:a});
    }
  }
}
function drawFireAnchor(a){
  var s=toScreen(a.x,a.y),sc=layout.scale,v=a._v||0,t=game.time||0;
  var fi=((t*13+a.ph*8)|0)%FIRE.nf,w=(23+5*Math.sin(t*3+a.ph*9))*sc*a.s*(0.55+0.45*v),h=w*1.95;
  var prev=ctx.globalCompositeOperation;
  ctx.globalCompositeOperation="lighter";ctx.globalAlpha=Math.min(1,0.25+0.85*v);
  ctx.drawImage(FIRE.strip,fi*FIRE.fw,0,FIRE.fw,FIRE.fh,s.x-w/2,s.y-h*0.9,w,h);
  ctx.globalCompositeOperation=prev;ctx.globalAlpha=1;
}
function drawFireOver(){
  if(!_emb.length&&!_smk.length)return;
  var i,a,s,sc=layout.scale,al,sz;
  for(i=0;i<_smk.length;i++){
    a=_smk[i];s=toScreen(a.x,a.y);al=a.life/a.max;sz=(13+(1-al)*24)*sc*a.s;
    ctx.globalAlpha=0.5*Math.min(1,al*1.6)*Math.min(1,(1-al)*5);
    ctx.drawImage(FIRE.smoke,s.x-sz/2,s.y-a.h*sc-sz/2,sz,sz);
  }
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(i=0;i<_emb.length;i++){
    a=_emb[i];s=toScreen(a.x,a.y);al=a.life/a.max;
    ctx.globalAlpha=al*(0.6+0.4*Math.sin((game.time||0)*25+i));ctx.fillStyle=a.c;sz=(1.6+al*1.4)*sc;
    ctx.fillRect(s.x-sz/2,s.y-a.h*sc-sz/2,sz,sz);
  }
  ctx.restore();ctx.globalAlpha=1;
}
function clearFireFx(){_emb.length=0;_smk.length=0;}

/* ================= per-frame tick ================= */
function fxTick(dt){
  if(!game)return;
  updateDamageFx(dt);
  if(game.state==="playing")updateFireFx(dt);
  if((game.state==="playing"||game.state==="boss_intro")&&typeof updatePortals==="function")updatePortals(dt);
}
