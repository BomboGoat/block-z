/* v20.5: hero select redesign. Swipeable carousel: the hero stands big on a glowing pedestal (rigged idle with
   weapon), slides in/out with a whoosh, role + rarity tags, six stat bars that fill when the hero changes, weapon
   and ulti chips, skins, and an INFO panel (weapon, ulti, passive, signature cards incl. épica/mítica/legendaria).
   Same screen is used from "Héroes" and from "Jugar → Nivel 1" (then the main button is ¡JUGAR!). Static pieces
   are cached (showcase canvas, pedestal, buttons); no shadowBlur. */
var HSEL={
  classic:{role:"TIRADOR",rar:"INICIAL",rc:"#90a4ae",ulti:"Cañonazo",uDesc:"Abanico masivo de balas que barre todo lo que tienes delante.",wDesc:"Pistola fiable de cadencia alta. Puede cambiarla por escopeta, subfusil, revólver, rifle o lanzagranadas con las cartas.",pas:"Arsenal",pDesc:"Es el único héroe que consigue armas nuevas y las mejora en las rondas.",st:[0.55,0.5,0.72,0.62,0.7,0.7]},
  trueno:{role:"ELEMENTAL",rar:"ÉPICO",rc:"#ab47bc",ulti:"Láser azul",uDesc:"Un rayo continuo que diriges y que atraviesa a toda la horda.",wDesc:"Rayos que saltan en cadena de un zombi a otro.",pas:"Sobrecargado",pDesc:"+10 % de daño y algo más de velocidad.",st:[0.5,0.62,0.6,0.66,0.82,0.85]},
  mr:{role:"ASESINO",rar:"MÍTICO",rc:"#e53935",ulti:"Cuchillos en llamas",uDesc:"Lanza un abanico de 6 cuchillos ardientes que atraviesan.",wDesc:"Cuchillos arrojadizos rápidos y precisos.",pas:"Sigiloso",pDesc:"El héroe más rápido del grupo.",st:[0.62,0.58,0.82,0.8,0.46,0.75]},
  gompa:{role:"TANQUE",rar:"ÉPICO",rc:"#ab47bc",ulti:"Gigante",uDesc:"Crece, salta y aplasta a todo lo que pisa durante 6 s.",wDesc:"Lanza pesas que golpean muy fuerte.",pas:"Culturista",pDesc:"Mucha vida (175) para aguantar en primera línea.",st:[0.82,0.7,0.5,0.45,0.42,0.9]},
  neizan:{role:"DEMOLEDOR",rar:"LEGENDARIO",rc:"#ffb300",ulti:"Minigun",uDesc:"Saca una minigun y dispara a toda velocidad durante 10 s.",wDesc:"Escopeta de doble cañón: lenta pero devastadora y con mucho empuje.",pas:"Chasis de acero",pDesc:"Medio máquina: recibe un 12 % menos de daño.",st:[0.92,0.94,0.3,0.5,0.42,0.95]}
};
var HS_LBL=[["❤️","VIDA","#ef5350"],["💥","DAÑO","#ffb300"],["⚡","CADENCIA","#ffee58"],["👟","VELOCIDAD","#42a5f5"],["🎯","ALCANCE","#66bb6a"],["🌟","ULTI","#ce93d8"]];
var HSC2={ped:{},snap:null};
function hsPedestal(col,w){var k=col+"|"+w;if(HSC2.ped[k])return HSC2.ped[k];var K=Math.min(2,dpr||1),c=document.createElement("canvas"),h=w*0.42;c.width=Math.ceil(w*K);c.height=Math.ceil(h*K);var g=c.getContext("2d");g.scale(K,K);
  var gr=g.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);gr.addColorStop(0,"rgba(255,255,255,0.35)");gr.addColorStop(0.35,cuHexA2(col,0.55));gr.addColorStop(1,cuHexA2(col,0));g.fillStyle=gr;g.save();g.scale(1,0.42);g.beginPath();g.arc(w/2,h/2/0.42,w/2,0,7);g.fill();g.restore();
  g.strokeStyle=cuHexA2(col,0.9);g.lineWidth=2;g.beginPath();g.ellipse(w/2,h/2,w*0.34,h*0.3,0,0,7);g.stroke();g.strokeStyle="rgba(255,255,255,0.5)";g.lineWidth=1;g.beginPath();g.ellipse(w/2,h/2,w*0.27,h*0.23,0,0,7);g.stroke();
  HSC2.ped[k]=c;return c;}
function cuHexA2(h,a){var n=parseInt((h||"#888888").slice(1),16);return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}
var HS_WI={classic:"🔫",trueno:"⚡",mr:"🔪",gompa:"🏋️",neizan:"💥"};
var HS_PAL={classic:"#ff8f00",trueno:"#00e5ff",mr:"#ff1744",gompa:"#c6ff00",neizan:"#ff3d00"};
function hsGo(dir){
  var n=HEROES.length;MENU.hsPrev=MENU.heroIdx;MENU.hsDir=dir;MENU.heroIdx=(MENU.heroIdx+dir+n)%n;MENU.hsT=MENU.t;MENU.previewSkin=null;
  if(typeof HSC!=="undefined"&&HSC&&HSC.c){var c=document.createElement("canvas");c.width=HSC.c.width;c.height=HSC.c.height;c.getContext("2d").drawImage(HSC.c,0,0);HSC2.snap={c:c};}
  try{sfx("whoosh");}catch(e){}
}
function hsEase(u){u=clamp(u,0,1);return 1-Math.pow(1-u,3);}
/* v20.5 perf: static parts of the hero screen (name/tags, info panel) are painted once into a cached canvas and
   blitted; they are painted live only while the stat bars fill or a skin tile is pressed. Hit boxes are replayed. */
var HS_CACHE={};
function hsCache(slot,key,x,y,w,h,live,paint){
  if(live){paint();return;}
  var K=dpr||1,C=HS_CACHE[slot];key=key+"|"+K;
  if(!C||C.key!==key){C=HS_CACHE[slot]=C||{c:document.createElement("canvas")};C.key=key;C.c.width=Math.ceil(w*K);C.c.height=Math.ceil(h*K);
    var g=C.c.getContext("2d"),saved=ctx,h0=MENU.hits.length;g.setTransform(K,0,0,K,-x*K,-y*K);ctx=g;try{paint();}catch(e){}ctx=saved;C.hits=MENU.hits.splice(h0);C.x=x;C.y=y;}
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(C.c,Math.round(x*K),Math.round(y*K));ctx.restore();
  for(var i=0;i<C.hits.length;i++)MENU.hits.push(C.hits[i]);
}
drawHeroes=function(){
  menuBg(0.35);mBack();mTitle(MENU.heroMode==="play"?"Elige tu héroe":"Héroes");drawTopBar();
  var s=layout.safe,h=HEROES[MENU.heroIdx]||HEROES[0],D=HSEL[h.id]||HSEL.classic,i,pal=HS_PAL[h.id]||"#ff8f00";
  var aw=SW-s.l-s.r,stageW=Math.min(aw*0.44,400),x0=s.l+6,cx=x0+stageW/2,top=s.t+48,fy=SH-s.b-40,H=Math.min((fy-top)*0.86,240);
  var since=MENU.hsT!=null?MENU.t-MENU.hsT:9,slide=hsEase(since/0.32),dir=MENU.hsDir||1;
  /* pedestal + glow */
  var pw=Math.min(stageW*0.82,H*1.15),pc=HSC2.ped[h.col+"|"+Math.round(pw)]||hsPedestal(h.col==="#37474f"?"#90a4ae":h.col,Math.round(pw));
  var pulse=0.85+0.15*Math.sin(MENU.t*2.4);ctx.save();ctx.globalAlpha=pulse;ctx.drawImage(pc,cx-pw/2,fy-pw*0.21,pw,pw*0.42);ctx.restore();
  /* outgoing hero snapshot */
  if(slide<1&&HSC2.snap){var K=dpr||1,sn=HSC2.snap.c;ctx.save();ctx.globalAlpha=1-slide;ctx.setTransform(1,0,0,1,0,0);var ox=-dir*slide*stageW*0.6;ctx.drawImage(sn,Math.round((cx-sn.width/K/2+ox)*K),Math.round((fy-Math.ceil(H*1.3)+0)*K));ctx.restore();}
  /* incoming hero */
  var sk=MENU.previewSkin&&MENU.previewSkin.hero===h.id?MENU.previewSkin.id:equippedSkin(h.id);
  ctx.save();ctx.globalAlpha=slide;ctx.translate(dir*(1-slide)*stageW*0.5,0);drawHeroShowcase(h.id,cx,fy,H,sk,h.col+"55");ctx.restore();
  /* name + tags over the stage */
  var nameY=top+8;
  hsCache("n",[h.id,cx,top].join("|"),x0,top-10,stageW,60,false,function(){
  mText(h.name.toUpperCase(),cx,nameY+4,26,"#fff","center","900",5);
  ctx.font="900 10px system-ui";var t1=D.role,t2=D.rar,w1=ctx.measureText(t1).width+18,w2=ctx.measureText(t2).width+18,tx=cx-(w1+w2+6)/2,ty=nameY+20;
  ctx.fillStyle=pal;roundRect(ctx,tx,ty,w1,17,8.5);ctx.fill();mText(t1,tx+w1/2,ty+9,10,"#160a00","center","900",0);
  ctx.fillStyle=D.rc;roundRect(ctx,tx+w1+6,ty,w2,17,8.5);ctx.fill();mText(t2,tx+w1+6+w2/2,ty+9,10,"#fff","center","900",2);
  });
  /* arrows */
  var ay=(top+fy)/2-6,ab=38;mButton("hs_prev",x0+2,ay-ab/2,ab,ab,"‹",null,"dark",{fs:24,r:19});mButton("hs_next",x0+stageW-ab-2,ay-ab/2,ab,ab,"›",null,"dark",{fs:24,r:19});
  /* dots */
  var dw=18,dg=8,dx0=cx-(HEROES.length*dw+(HEROES.length-1)*dg)/2,dy=SH-s.b-18;
  for(i=0;i<HEROES.length;i++){var hh=HEROES[i],on=i===MENU.heroIdx,xx=dx0+i*(dw+dg);ctx.fillStyle=on?(HS_PAL[hh.id]||"#fff"):"rgba(255,255,255,0.25)";ctx.beginPath();ctx.arc(xx+dw/2,dy,on?7:5,0,7);ctx.fill();if(on){ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.stroke();}
    if(hh.id===selectedHero){mText("✔",xx+dw/2,dy-12,9,"#b9f6ca","center","900",2);}mHit("hs_dot",xx,dy-11,dw,22,i);}
  /* swipe zone (whole stage, below arrows in z-order so the arrows win) */
  MENU.hits.unshift({id:"hs_stage",x:x0,y:top,w:stageW,h:fy-top+30,data:null});
  /* right panel */
  var px=x0+stageW+8,pw2=SW-s.r-10-px,py=s.t+50,ph=SH-s.b-10-py;mPanel(px,py,pw2,ph,14,0.9);
  var ix=px+14,iw=pw2-28,y=py+14;
  hsCache("p",[h.id,equippedSkin(h.id),MENU.previewSkin?MENU.previewSkin.id:"",selectedHero,PROF.coins,SW,SH,s.l,s.r,s.t,s.b,(SKINS[h.id]||[]).map(function(q){return skinOk(h.id,q)?1:0;}).join(""),(PROF.stats&&PROF.stats.heroWins&&PROF.stats.heroWins[h.id])||0].join("|"),px-6,py-4,pw2+12,ph+12,since<0.95||!!(MENU.press&&/^skin/.test(MENU.press.id)),function(){
  mPanel(px,py,pw2,ph,14,0.9);
  /* weapon + ulti chips */
  var cw=(iw-8)/2;
  [[HS_WI[h.id]||"🔫",h.wpn,"ARMA"],["🌟",D.ulti,"ULTI"]].forEach(function(r,j){var xx=ix+j*(cw+8);ctx.fillStyle="rgba(255,255,255,0.07)";roundRect(ctx,xx,y,cw,34,9);ctx.fill();ctx.strokeStyle=j?"rgba(206,147,216,0.6)":cuHexA2(pal,0.6);ctx.lineWidth=1.5;roundRect(ctx,xx,y,cw,34,9);ctx.stroke();
    mText(r[0],xx+16,y+17,15,"#fff","center","700",0);mText(r[2],xx+32,y+10,8.5,j?"#e1bee7":pal,"left","900",2);mText(r[1],xx+32,y+23,12,"#fff","left","900",2.5);});
  y+=44;
  /* stat bars */
  var rowH=Math.max(15,Math.min(20,(ph-44-50-46-40)/6)),bx=ix+92,bwid=iw-92-30;
  for(i=0;i<6;i++){var L=HS_LBL[i],v=D.st[i],fill=v*hsEase((since-0.05-i*0.05)/0.5),yy=y+i*rowH;
    mText(L[0],ix+7,yy+rowH/2-1,11,"#fff","center","700",0);mText(L[1],ix+18,yy+rowH/2-1,9.5,"#e8e0f0","left","900",2.5);
    ctx.fillStyle="rgba(0,0,0,0.45)";roundRect(ctx,bx,yy+rowH/2-5,bwid,10,5);ctx.fill();
    var segs=10;for(var q=0;q<segs;q++){var f=clamp(fill*segs-q,0,1);if(f<=0)break;ctx.fillStyle=L[2];ctx.globalAlpha=0.55+0.45*f;roundRect(ctx,bx+1+q*(bwid-2)/segs,yy+rowH/2-4,((bwid-2)/segs-1.5)*f,8,3);ctx.fill();}ctx.globalAlpha=1;
    var val=i===0?String(h.hp):String(Math.round(v*10));mText(val,bx+bwid+16,yy+rowH/2-1,10.5,"#fff","center","900",2.5);}
  y+=6*rowH+8;
  /* skins */
  var list=SKINS[h.id]||[],sw=Math.min(84,(iw-16)/3),shh=Math.max(34,Math.min(46,py+ph-y-50));
  for(i=0;i<list.length;i++){
    var sk2=list[i],ok=skinOk(h.id,sk2),eq=equippedSkin(h.id)===sk2.id,xx2=ix+i*(sw+8),yy2=y,k=mPressK("skin"+i);
    ctx.save();ctx.translate(xx2+sw/2,yy2+shh/2);ctx.scale(k,k);ctx.translate(-sw/2,-shh/2);
    ctx.fillStyle=eq?"rgba(255,213,79,0.22)":"rgba(255,255,255,0.07)";roundRect(ctx,0,0,sw,shh,9);ctx.fill();
    ctx.strokeStyle=eq?"#ffd54f":"rgba(255,255,255,0.18)";ctx.lineWidth=eq?2.2:1;roundRect(ctx,0,0,sw,shh,9);ctx.stroke();
    var T=SKIN_TINT[sk2.id],scol=sk2.id==="orig"?h.col:T?(T.mul||"#eef"):"#888";ctx.fillStyle=scol;ctx.beginPath();ctx.arc(14,shh/2,8,0,7);ctx.fill();ctx.strokeStyle="#1a1020";ctx.lineWidth=2;ctx.stroke();
    mText(sk2.name,27,shh*0.36,9.5,"#fff","left","800",2.2);
    var req=ok?(eq?"Equipado":"Equipar"):(sk2.lv?"Nivel "+sk2.lv:"🪙 "+sk2.cost);mText(req,27,shh*0.7,8.5,ok?(eq?"#ffd54f":"#b9f6ca"):(sk2.cost&&PROF.coins>=sk2.cost?"#ffe082":"#b0a8c0"),"left","800",2);
    if(!ok)mText("🔒",sw-9,9,8,"#fff","center","700",0);
    ctx.restore();mHit("skin"+i,xx2,yy2,sw,shh,i);}
  /* flavour line + wins when there is room (taller phones) */
  var fy2=y+shh+8,room=py+ph-50-fy2;
  if(room>=18){var wins=(PROF.stats&&PROF.stats.heroWins&&PROF.stats.heroWins[h.id])||0;mText("🏆 Victorias: "+wins+"   ·   "+(h.desc||""),ix,fy2+Math.min(room,26)/2,10,"#cfc6df","left","700",2);}
  });
  var ix=px+14,iw=pw2-28;
  /* buttons */
  var by=py+ph-42,isSel=selectedHero===h.id,play=MENU.heroMode==="play";
  mButton("hs_info",ix,by,Math.min(110,iw*0.38),34,"INFO","ℹ️","purple",{fs:14});
  var mbw=Math.min(170,iw*0.56);
  if(play)mButton("hs_play",ix+iw-mbw,by,mbw,34,"¡JUGAR!",null,"play",{fs:16,shine:1});
  else mButton("pickhero",ix+iw-mbw,by,mbw,34,isSel?"ELEGIDO ✔":"ELEGIR",null,isSel?"green":"play",{fs:15});
  if(MENU.hsInfo)hsDrawInfo(h,D,pal);
};
function hsDrawInfo(h,D,pal){
  var u=hsEase((MENU.t-(MENU.hsInfoT||0))/0.25),s=layout.safe;
  MENU.hits.length=0;
  ctx.save();ctx.globalAlpha=0.7*u;ctx.fillStyle="#06040c";ctx.fillRect(0,0,SW,SH);ctx.restore();
  mHit("hs_close_bg",0,0,SW,SH,null);
  var w=Math.min(640,SW-s.l-s.r-40),hh=SH-s.t-s.b-36,x=(SW-w)/2,y=s.t+18+(1-u)*30;
  ctx.save();ctx.globalAlpha=u;mPanel(x,y,w,hh,16,0.97);
  mHit("hs_info_panel",x,y,w,hh,null);
  mText(h.name.toUpperCase(),x+18,y+22,22,"#fff","left","900",4);ctx.font="900 10px system-ui";var tw=ctx.measureText(D.role).width+18;ctx.fillStyle=pal;roundRect(ctx,x+24+ctx.measureText(h.name.toUpperCase()).width*2.1,y+13,tw,17,8.5);ctx.fill();
  mText(D.role,x+24+ctx.measureText(h.name.toUpperCase()).width*2.1+tw/2,y+22,10,"#160a00","center","900",0);
  mButton("hs_close",x+w-44,y+8,34,30,"✕",null,"red",{fs:16,r:15});
  var col=(w-48)/2,lx=x+18,rx=x+30+col,yy=y+46;
  function sect(ix,iy,icon,title,name,desc,c){mText(icon+"  "+title,ix,iy,10,c,"left","900",2.5);mText(name,ix,iy+16,13,"#fff","left","900",3);ctx.font="600 11px system-ui";ctx.fillStyle="#d8d0e8";ctx.textAlign="left";ctx.textBaseline="middle";
    var words=desc.split(" "),line="",ly=iy+32,k;for(k=0;k<words.length;k++){var t2=line+words[k]+" ";if(ctx.measureText(t2).width>col&&line){ctx.fillText(line,ix,ly);ly+=13;line=words[k]+" ";}else line=t2;}if(line){ctx.fillText(line,ix,ly);ly+=13;}return ly+6;}
  var ly=sect(lx,yy,HS_WI[h.id]||"🔫","ARMA",h.wpn,D.wDesc,pal);ly=sect(lx,ly,"🌟","ULTI",D.ulti,D.uDesc,"#e1bee7");ly=sect(lx,ly,"🛡️","PASIVA",D.pas,D.pDesc,"#b9f6ca");
  /* card highlights */
  mText("🃏  CARTAS DESTACADAS",rx,yy,10,"#ffe08a","left","900",2.5);
  var mine=UPGRADE_DEFS.filter(function(d){return d.hero===h.id;}),cards=mine.filter(function(d){return d.id.indexOf("hc_")===0;}).sort(function(a,b){return b.fixedR-a.fixedR;}),
      extra=mine.filter(function(d){return d.id.indexOf("hc_")!==0;}).sort(function(a,b){return (b.fixedR||0)-(a.fixedR||0);}).slice(0,3),cy=yy+12,rh=Math.max(34,Math.min(58,(y+hh-cy-70)/Math.max(1,cards.length)-4));
  cards.forEach(function(d,j){var R=RARITIES[d.fixedR],yy2=cy+j*(rh+4),gl=0.5+0.5*Math.sin(MENU.t*3+j);ctx.fillStyle=cuHexA2(R.color,0.18+0.08*gl);roundRect(ctx,rx,yy2,col,rh,8);ctx.fill();ctx.strokeStyle=R.color;ctx.lineWidth=1.6;roundRect(ctx,rx,yy2,col,rh,8);ctx.stroke();
    mText(d.icon,rx+16,yy2+rh/2,15,"#fff","center","700",0);mText(d.name,rx+32,yy2+rh*0.32,11.5,"#fff","left","900",2.5);
    ctx.font="900 8.5px system-ui";var rw=ctx.measureText(R.name.toUpperCase()).width+10;ctx.fillStyle=R.color;roundRect(ctx,rx+col-rw-6,yy2+4,rw,13,6);ctx.fill();mText(R.name.toUpperCase(),rx+col-rw/2-6,yy2+11,8.5,"#fff","center","900",0);
    ctx.font="600 9.5px system-ui";ctx.fillStyle="#cfc6df";ctx.textAlign="left";ctx.textBaseline="middle";var ws=d.desc.split(" "),ln="",lines=[],mw=col-40,maxL=rh>=46?2:1;for(var q=0;q<ws.length;q++){var t3=ln+ws[q]+" ";if(ctx.measureText(t3).width>mw&&ln){lines.push(ln);ln=ws[q]+" ";}else ln=t3;}if(ln)lines.push(ln);
    if(lines.length>maxL){lines=lines.slice(0,maxL);var lt=lines[maxL-1];while(ctx.measureText(lt+"…").width>mw&&lt.length>4)lt=lt.slice(0,-1);lines[maxL-1]=lt.trim()+"…";}
    for(q=0;q<lines.length;q++)ctx.fillText(lines[q],rx+32,yy2+rh*0.32+14+q*12);});
  var ey=cy+cards.length*(rh+4)+10;if(extra.length){mText("TAMBIÉN EN SU MAZO",rx,ey,9,"#b0a8c0","left","900",2);ey+=15;
    extra.forEach(function(d){ctx.fillStyle="rgba(255,255,255,0.07)";roundRect(ctx,rx,ey-8,col,16,6);ctx.fill();mText(d.icon+" "+d.name,rx+6,ey,10,"#e8e0f0","left","800",2);ey+=19;});}
  ctx.restore();
}
(function(){
  var _ma=menuAction;
  menuAction=function(h){
    var st=game.state,id=h.id;
    if(st==="levels"&&id==="l1"){try{sfx("click");sfx("card");}catch(e){}menuGo("heroes");MENU.heroMode="play";return;}
    if(st==="heroes"){
      if(MENU.hsInfo){if(id==="hs_close"||id==="hs_close_bg"){MENU.hsInfo=0;try{sfx("click");}catch(e){}}return;}
      if(id==="hs_prev"){hsGo(-1);return;}if(id==="hs_next"){hsGo(1);return;}
      if(id==="hs_dot"){if(h.data!==MENU.heroIdx){var d=h.data>MENU.heroIdx?1:-1;MENU.heroIdx=h.data-d;hsGo(d);}return;}
      if(id==="hs_info"){MENU.hsInfo=1;MENU.hsInfoT=MENU.t;try{sfx("card");}catch(e){}return;}
      if(id==="hs_play"){var hero=HEROES[MENU.heroIdx].id;selectedHero=hero;saveHeroChoice();try{sfx("rarity3");}catch(e){}MENU.heroMode=null;startGame();return;}
      if(id==="back"){MENU.heroMode=null;MENU.hsInfo=0;}
      if(id==="pickhero"){try{sfx("rarity2");}catch(e){}}
    }
    return _ma.apply(this,arguments);
  };
  var _mgo=menuGo;menuGo=function(st){var r=_mgo.apply(this,arguments);if(st!=="heroes"){MENU.heroMode=null;MENU.hsInfo=0;}else{MENU.hsT=MENU.t;MENU.hsDir=1;HSC2.snap=null;}return r;};
  var _md=menuDown,_mm=menuMove,_mu=menuUp;
  menuDown=function(p){var h=menuHitAt(p.x,p.y);if(game&&game.state==="heroes"&&!MENU.hsInfo&&h&&h.id==="hs_stage"){MENU.hsSwipe={x:p.x,y:p.y,dx:0};MENU.press=null;if(typeof menuDirty!=="undefined")menuDirty=1;return;}MENU.hsSwipe=null;return _md.apply(this,arguments);};
  menuMove=function(p){if(MENU.hsSwipe){MENU.hsSwipe.dx=p.x-MENU.hsSwipe.x;return;}return _mm.apply(this,arguments);};
  menuUp=function(p){if(MENU.hsSwipe){var dx=p.x-MENU.hsSwipe.x;MENU.hsSwipe=null;if(Math.abs(dx)>36)hsGo(dx<0?1:-1);return;}return _mu.apply(this,arguments);};
})();
