/* v20.5: rare hero cards. Six rarity tiers (Común → Legendaria, Mítica added), round-scaled odds, and three
   signature cards per hero (Épica, Mítica, Legendaria) whose effects are big and visible. Card faces are cached
   per rarity and size; the reveal flips each card in, epic+ get a shimmer, legendary gets a charge-up, sun rays,
   sparks and a flash. All effect VFX are cached sprites / simple paths, no shadowBlur. */
RARITIES.length=0;
[{id:"comun",name:"Común",w:55,color:"#9e9e9e",glow:"#cfd8dc",mul:1.10,frame:"#757575"},
 {id:"poco_comun",name:"Poco común",w:25,color:"#43a047",glow:"#a5d6a7",mul:1.18,frame:"#2e7d32"},
 {id:"rara",name:"Rara",w:12,color:"#1e88e5",glow:"#90caf9",mul:1.30,frame:"#1565c0"},
 {id:"epica",name:"Épica",w:6,color:"#8e24aa",glow:"#e1bee7",mul:1.45,frame:"#6a1b9a"},
 {id:"mitica",name:"Mítica",w:2.4,color:"#e53935",glow:"#ff8a80",mul:1.60,frame:"#b71c1c"},
 {id:"legendaria",name:"Legendaria",w:1.1,color:"#ffb300",glow:"#ffe082",mul:1.80,frame:"#ff8f00"}].forEach(function(r){RARITIES.push(r);});
/* numeric tiers get a 6th (legendary) value */
UPGRADE_DEFS.forEach(function(d){if(d.tiers&&d.tiers.length===5){var l=d.tiers[4];d.tiers.push(d.kind==="add"?l:+(l*1.22).toFixed(3));}});
/* odds scale with the round: commons fade out, epic/mythic/legendary grow; luck helps the top tiers */
rollRarity=function(luck){
  var w=RARITIES.map(function(r){return r.w;}),wave=(game&&game.wave)||0,wr=wave*0.85,t=0,i,r,a=0;
  if(luck>0){w[0]=Math.max(20,w[0]-luck*0.6);w[2]+=luck*0.2;w[3]+=luck*0.22;w[4]+=luck*0.12;w[5]+=luck*0.06;}
  w[0]=Math.max(16,w[0]-wr*0.8);w[1]=Math.max(14,w[1]-wr*0.15);w[2]+=wr*0.3;w[3]+=wr*0.4;w[4]+=wr*0.3;w[5]+=wr*0.2;
  for(i=0;i<w.length;i++)t+=w[i];r=Math.random()*t;
  for(i=0;i<w.length;i++){a+=w[i];if(r<=a)return i;}return 0;
};
/* ---------- signature cards ---------- */
var HCARDS=[
 {id:"hc_classic_e",hero:"classic",fixedR:3,once:1,minR:3,icon:"🎯",name:"Ráfaga dorada",desc:"Cada 5.º disparo lanza un abanico de 5 balas doradas",plus:["Abanico"],minus:[]},
 {id:"hc_classic_m",hero:"classic",fixedR:4,once:1,minR:4,icon:"☄️",name:"Bala del juicio",desc:"Cada 4 s disparas una bala gigante que lo atraviesa todo",plus:["Perforación","Daño"],minus:[]},
 {id:"hc_classic_l",hero:"classic",fixedR:5,once:1,minR:5,icon:"✈️",name:"Bombardeo aéreo",desc:"Cada 7 s pides un bombardeo: 5 explosiones en línea sobre la horda",plus:["Explosiones","Área"],minus:[]},
 {id:"hc_trueno_e",hero:"trueno",fixedR:3,once:1,minR:3,icon:"🔵",name:"Jaula de tormenta",desc:"Cada 6 s te rodea un anillo eléctrico que electrocuta a quien lo toque",plus:["Anillo","Control"],minus:[]},
 {id:"hc_trueno_m",hero:"trueno",fixedR:4,once:1,minR:4,icon:"🌩️",name:"Furia del cielo",desc:"Cada 2,5 s caen rayos del cielo sobre 3 zombis",plus:["Rayos","Área"],minus:[]},
 {id:"hc_trueno_l",hero:"trueno",fixedR:5,once:1,minR:5,icon:"🌀",name:"Ojo del huracán",desc:"Cada 9 s invocas un huracán eléctrico que arrastra y fríe a la horda",plus:["Huracán","Atracción"],minus:[]},
 {id:"hc_mr_e",hero:"mr",fixedR:3,once:1,minR:3,icon:"🗡️",name:"Lluvia de cuchillos",desc:"Cada 5 s caen 8 cuchillos sobre el grupo más cercano",plus:["Área"],minus:[]},
 {id:"hc_mr_m",hero:"mr",fixedR:4,once:1,minR:4,icon:"🌪️",name:"Tornado de cuchillas",desc:"Cada 8 s te rodea un tornado de cuchillas durante 3 s",plus:["Tornado","Daño continuo"],minus:[]},
 {id:"hc_mr_l",hero:"mr",fixedR:5,once:1,minR:5,icon:"🕶️",name:"Ejecución sombría",desc:"Cada 6 s tu sombra corta a los 6 zombis más cercanos en un instante",plus:["Ejecución","Daño enorme"],minus:[]},
 {id:"hc_gompa_e",hero:"gompa",fixedR:3,once:1,minR:3,icon:"🦶",name:"Pisotón sísmico",desc:"Cada 5 s das un pisotón que daña y aturde a tu alrededor",plus:["Onda","Aturdir"],minus:[]},
 {id:"hc_gompa_m",hero:"gompa",fixedR:4,once:1,minR:4,icon:"🌋",name:"Terremoto",desc:"Cada 8 s abres una grieta de 3 golpes sísmicos hacia los zombis",plus:["Grieta","Aturdir"],minus:[]},
 {id:"hc_gompa_l",hero:"gompa",fixedR:5,once:1,minR:5,icon:"🏋️",name:"Lluvia de pesas",desc:"Cada 7 s caen 6 pesas gigantes del cielo sobre la horda",plus:["Meteoros","Área"],minus:[]},
 {id:"hc_neizan_e",hero:"neizan",fixedR:3,once:1,minR:3,icon:"🐉",name:"Aliento de dragón",desc:"Tus cartuchos escupen un cono de fuego que quema todo delante",plus:["Fuego","Cono"],minus:[]},
 {id:"hc_neizan_m",hero:"neizan",fixedR:4,once:1,minR:4,icon:"💣",name:"Slug explosivo",desc:"Cada 3.er disparo lanza un slug que explota con metralla",plus:["Explosión"],minus:[]},
 {id:"hc_neizan_l",hero:"neizan",fixedR:5,once:1,minR:5,icon:"🔴",name:"Protocolo Terminator",desc:"Cada 10 s tu ojo dispara un láser rojo que barre la zona",plus:["Láser","Barrido"],minus:[]}
];
HCARDS.forEach(function(c){c.flag=c.id;UPGRADE_DEFS.push(c);});
/* ---------- effect engine ---------- */
var CFX=[];
function hcHas(p,id){return !!(p&&p[id]);}
function hcDmg(p,base){var w=(game&&game.wave)||0;return base*(p.damageMul||1)*(1+0.09*w);}
function hcAlive(){var out=[],i,z;for(i=0;i<game.zombies.length;i++){z=game.zombies[i];if(!z.dead&&!z.dying&&!z.ghost)out.push(z);}return out;}
function hcNearest(p,n,maxD){var a=hcAlive().filter(function(z){return dist(p.x,p.y,z.x,z.y)<(maxD||420);});a.sort(function(u,v){return dist(p.x,p.y,u.x,u.y)-dist(p.x,p.y,v.x,v.y);});return a.slice(0,n);}
function hcHit(z,d,x){if(!z||z.dead||z.dying)return;hurtZombie(z,d,x!=null?x:z.x,1,{noCrit:1});}
function hcArea(x,y,r,d,stun){var a=hcAlive(),i,z,n=0;for(i=0;i<a.length;i++){z=a[i];if(dist(x,y,z.x,z.y)<r+z.r){hcHit(z,d,x);if(stun){z.stun=Math.max(z.stun||0,stun);}n++;}}return n;}
function cfx(o){if(CFX.length>40)CFX.shift();o.t=0;CFX.push(o);return o;}
var HC_SPR={};
function hcSpr(k,w,h,paint){if(HC_SPR[k])return HC_SPR[k];var c=document.createElement("canvas");c.width=w;c.height=h;paint(c.getContext("2d"),w,h);HC_SPR[k]=c;return c;}
function hcRing(col){return hcSpr("ring"+col,128,128,function(g){var gr=g.createRadialGradient(64,64,40,64,64,64);gr.addColorStop(0,"rgba("+col+",0)");gr.addColorStop(0.72,"rgba("+col+",0.55)");gr.addColorStop(0.86,"rgba(255,255,255,0.95)");gr.addColorStop(1,"rgba("+col+",0)");g.fillStyle=gr;g.fillRect(0,0,128,128);});}
function hcCrack(){return hcSpr("crack",128,64,function(g){g.strokeStyle="rgba(30,18,10,0.85)";g.lineCap="round";function br(x,y,a,l,w,d){if(d>4||l<4)return;var x2=x+Math.cos(a)*l,y2=y+Math.sin(a)*l*0.5;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();br(x2,y2,a+(Math.random()-0.5)*0.9,l*0.7,w*0.7,d+1);if(Math.random()<0.6)br(x2,y2,a+(Math.random()<0.5?-1:1)*(0.6+Math.random()*0.6),l*0.5,w*0.6,d+1);}
  for(var i=0;i<7;i++)br(64,32,i/7*6.28,22,4,0);g.fillStyle="rgba(255,150,40,0.5)";g.beginPath();g.ellipse(64,32,10,5,0,0,7);g.fill();});}
function hcGlow(col){return (typeof plGlow==="function")?plGlow(col,"hc"+col):hcRing(col);}
/* per-hero timers */
function hcTick(p,dt){
  if(!p||game.state!=="playing")return;
  var T=p._hcT||(p._hcT={}),k;
  function due(id,period,first){if(!p[id])return 0;if(T[id]==null)T[id]=first!=null?first:0.8;T[id]-=dt;if(T[id]<=0){T[id]+=period;return 1;}return 0;}
  /* Eric */
  if(due("hc_classic_m",4)){var tg=hcNearest(p,1,520)[0];if(tg){var a=Math.atan2(tg.y-p.y,tg.x-p.x);hcRail(p,a);}else T.hc_classic_m=0.3;}
  if(due("hc_classic_l",7,1)){var g=hcNearest(p,1,460)[0];if(g){hcAirstrike(p,g);}else T.hc_classic_l=0.5;}
  /* Tro */
  if(due("hc_trueno_e",6,0.6)){cfx({k:"cage",x:p.x,y:p.y,life:2.6,r:74,tick:0});sfx("storm",0.6);}
  if(due("hc_trueno_m",2.5,0.7)){var ts=hcNearest(p,3,440);if(ts.length){ts.forEach(function(z,i){cfx({k:"skybolt",x:z.x,y:z.y,life:0.42,delay:i*0.08,z:z,done:0});});sfx("zap");}else T.hc_trueno_m=0.4;}
  if(due("hc_trueno_l",9,1.2)){var h=hcNearest(p,1,380)[0];var hx=h?h.x:p.x+Math.cos(p.aimAng||0)*120,hy=h?h.y:p.y+Math.sin(p.aimAng||0)*120;cfx({k:"hurricane",x:hx,y:hy,life:3.4,tick:0});sfx("storm",0.9);shake(6);}
  /* Mr */
  if(due("hc_mr_e",5,0.7)){var m=hcNearest(p,1,420)[0];if(m){for(var i=0;i<8;i++){var aa=i/8*6.28+Math.random()*0.4,rr=8+Math.random()*34;cfx({k:"knifefall",x:m.x+Math.cos(aa)*rr,y:m.y+Math.sin(aa)*rr*0.8,life:0.55,delay:i*0.045,done:0});}sfx("whoosh");}else T.hc_mr_e=0.4;}
  if(due("hc_mr_m",8,0.9)){cfx({k:"tornado",life:3,tick:0});sfx("slash");}
  if(due("hc_mr_l",6,1)){var vs=hcNearest(p,6,330);if(vs.length){hcExecute(p,vs);}else T.hc_mr_l=0.4;}
  /* Gompa */
  if(due("hc_gompa_e",5,0.7)){var n=hcArea(p.x,p.y,92,hcDmg(p,46),0.7);cfx({k:"slam",x:p.x,y:p.y,life:0.6,r:92});shake(9);sfx("stomp");}
  if(due("hc_gompa_m",8,1)){var q=hcNearest(p,1,420)[0],qa=q?Math.atan2(q.y-p.y,q.x-p.x):(p.aimAng||0);for(var j=0;j<3;j++)cfx({k:"quake",x:p.x+Math.cos(qa)*(50+j*62),y:p.y+Math.sin(qa)*(50+j*62),a:qa,life:0.7,delay:j*0.22,done:0,r:58+j*8});}
  if(due("hc_gompa_l",7,1.1)){var ws=hcNearest(p,6,440);if(ws.length){for(var w2=0;w2<6;w2++){var zt=ws[w2%ws.length];cfx({k:"bellfall",x:zt.x+(w2>=ws.length?(Math.random()-0.5)*60:0),y:zt.y+(w2>=ws.length?(Math.random()-0.5)*40:0),life:0.95,delay:w2*0.12,done:0});}}else T.hc_gompa_l=0.4;}
  /* Neizan */
  if(due("hc_neizan_l",10,1.2)){var nl=hcNearest(p,1,420)[0];if(nl){var na=Math.atan2(nl.y-p.y,nl.x-p.x);cfx({k:"laser",a0:na-0.9,a1:na+0.9,life:1.6,tick:0});sfx("laser_loop",0.5);}else T.hc_neizan_l=0.4;}
}
function hcRail(p,a){
  var len=560,x1=p.x+Math.cos(a)*len,y1=p.y+Math.sin(a)*len,a2=hcAlive(),i,z;
  for(i=0;i<a2.length;i++){z=a2[i];if(distSegHC(z.x,z.y,p.x,p.y,x1,y1)<z.r+14)hcHit(z,hcDmg(p,90),p.x);}
  cfx({k:"rail",x:p.x,y:p.y,a:a,len:len,life:0.45});shake(7);sfx("shot_revolver");sfx("whoosh",0.6);
}
function hcAirstrike(p,g){
  var a=Math.atan2(g.y-p.y,g.x-p.x)+(Math.random()-0.5)*0.4,i;
  for(i=0;i<5;i++){var d=-70+i*35;cfx({k:"strike",x:g.x+Math.cos(a)*d,y:g.y+Math.sin(a)*d,life:1.05,delay:i*0.14,done:0});}
  cfx({k:"plane",a:a,x:g.x,y:g.y,life:1.6});sfx("whoosh");
}
function hcExecute(p,vs){
  var pts=[{x:p.x,y:p.y}],i;for(i=0;i<vs.length;i++){pts.push({x:vs[i].x,y:vs[i].y});}
  cfx({k:"exec",pts:pts,zs:vs,life:0.9,hit:0});sfx("slash");sfx("whoosh",0.7);
}
function distSegHC(px,py,ax,ay,bx,by){var dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1,t=clamp(((px-ax)*dx+(py-ay)*dy)/l,0,1);return dist(px,py,ax+dx*t,ay+dy*t);}
function hcUpdate(dt){
  var p=game.player,i,o;
  for(i=CFX.length-1;i>=0;i--){o=CFX[i];
    if(o.delay>0){o.delay-=dt;continue;}
    o.t+=dt;
    if(o.k==="cage"){o.x=p.x;o.y=p.y;o.tick-=dt;if(o.tick<=0){o.tick=0.3;var cz=hcAlive();for(var c=0;c<cz.length;c++){var zz=cz[c],dd=dist(o.x,o.y,zz.x,zz.y);if(dd<o.r+zz.r){hcHit(zz,hcDmg(p,14),o.x);zz.slow=Math.max(zz.slow||0,0.5);if(Math.random()<0.4&&typeof pushBolt==="function")pushBolt({pts:zigPts(o.x,o.y,zz.x,zz.y,4),life:0.08,maxLife:0.08,lift:12});}}}}
    else if(o.k==="skybolt"&&!o.done){o.done=1;var sz=o.z;if(sz&&!sz.dead&&!sz.dying){o.x=sz.x;o.y=sz.y;}hcArea(o.x,o.y,26,hcDmg(p,52),0.25);shake(4);}
    else if(o.k==="hurricane"){var hz=hcNearest({x:o.x,y:o.y},1,260)[0];if(hz){o.x+=(hz.x-o.x)*dt*0.9;o.y+=(hz.y-o.y)*dt*0.9;}o.tick-=dt;var all=hcAlive();for(var h=0;h<all.length;h++){var z3=all[h],d3=dist(o.x,o.y,z3.x,z3.y);if(d3<150&&!z3.isBoss){var pull=Math.min(1,dt*2.4);z3.x+=(o.x-z3.x)*pull*0.6;z3.y+=(o.y-z3.y)*pull*0.6;}}
      if(o.tick<=0){o.tick=0.25;hcArea(o.x,o.y,64,hcDmg(p,16),0.2);if(typeof pushBolt==="function"){var bz=all[(Math.random()*all.length)|0];if(bz&&dist(o.x,o.y,bz.x,bz.y)<150)pushBolt({pts:zigPts(o.x,o.y,bz.x,bz.y,5),life:0.1,maxLife:0.1,lift:30});}}}
    else if(o.k==="knifefall"&&!o.done&&o.t>=0.32){o.done=1;hcArea(o.x,o.y,20,hcDmg(p,26));}
    else if(o.k==="tornado"){o.tick-=dt;if(o.tick<=0){o.tick=0.2;hcArea(p.x,p.y,64,hcDmg(p,13));}}
    else if(o.k==="exec"){var seg=o.zs.length?Math.floor(o.t/0.09):0;while(o.hit<Math.min(seg,o.zs.length)){var ez=o.zs[o.hit];hcHit(ez,hcDmg(p,120),p.x);o.hit++;}}
    else if(o.k==="quake"&&!o.done){o.done=1;hcArea(o.x,o.y,o.r,hcDmg(p,44),0.6);shake(7);sfx("stomp",0.8);}
    else if(o.k==="bellfall"&&!o.done&&o.t>=0.5){o.done=1;hcArea(o.x,o.y,40,hcDmg(p,70),0.5);shake(8);sfx("thud");if(typeof gfxBoom==="function")gfxBoom(o.x,o.y,26);}
    else if(o.k==="strike"&&!o.done&&o.t>=0.62){o.done=1;hcArea(o.x,o.y,46,hcDmg(p,64));if(typeof gfxBoom==="function")gfxBoom(o.x,o.y,40);sfx("explode");shake(8);}
    else if(o.k==="laser"){o.tick-=dt;var u=clamp(o.t/o.life,0,1),la=o.a0+(o.a1-o.a0)*(0.5-0.5*Math.cos(u*Math.PI));o.a=la;if(o.tick<=0){o.tick=0.08;var lz=hcAlive(),lx=p.x+Math.cos(la)*430,ly=p.y+Math.sin(la)*430;for(var L=0;L<lz.length;L++){var z4=lz[L];if(distSegHC(z4.x,z4.y,p.x,p.y,lx,ly)<z4.r+10)hcHit(z4,hcDmg(p,22),p.x);}}}
    else if(o.k==="slug"&&!o.done&&o.t>=o.life){o.done=1;explodeAt(o.tx,o.ty,58,hcDmg(p,48),{friendly:1,knock:180});shake(8);}
    if(o.t>=o.life)CFX.splice(i,1);
  }
}
/* attack-count procs (Eric fan, Neizan slug/dragon) piggy-back on markAttack */
(function(){
  var _ma=markAttack;
  markAttack=function(p,kind,t){
    var r=_ma.apply(this,arguments);
    if(!p||!game||game.player!==p||game.state!=="playing")return r;
    p._hcN=(p._hcN||0)+1;
    var tg=hcNearest(p,1,heroRange?heroRange(p)*1.1:400)[0],a=tg?Math.atan2(tg.y-p.y,tg.x-p.x):(p.aimAng||0);
    if(p.hc_classic_e&&p._hcN%5===0){for(var i=0;i<5;i++)hcSpawnBullet(p,a+(i-2)*0.16,520,hcDmg(p,16),{pistol:1,big:1.25});sfx("shot_smg",0.6);}
    if(p.hc_neizan_e){cfx({k:"dragon",a:a,life:0.42});var cz=hcAlive();for(var c=0;c<cz.length;c++){var z=cz[c],d=dist(p.x,p.y,z.x,z.y),da=Math.atan2(z.y-p.y,z.x-p.x)-a;da=Math.atan2(Math.sin(da),Math.cos(da));if(d<150&&Math.abs(da)<0.42){hcHit(z,hcDmg(p,18),p.x);z.burn=Math.max(z.burn||0,2.2);}}sfx("fire_whoosh",0.5);}
    if(p.hc_neizan_m&&p._hcN%3===0&&tg){cfx({k:"slug",x:p.x,y:p.y,tx:tg.x,ty:tg.y,life:0.28,done:0});}
    return r;
  };
})();
function hcSpawnBullet(p,a,spd,dmg,fl){
  var ho=typeof heroHandWorld==="function"?heroHandWorld(p,a):{x:p.x,y:p.y},b=newBullet();
  b.x=ho.x;b.y=ho.y;b.lift=typeof heroHandLiftPx==="function"?heroHandLiftPx(p):20;b.vx=Math.cos(a)*spd;b.vy=Math.sin(a)*spd;b.r=3;b.damage=dmg;b.life=0.9;b.pierce=0;b.bounce=0;b.hit=new Set();
  b.pistol=0;b.revolver=0;b.rifle=0;b.smg=0;b.shot=0;b.gl=0;b.expl=0;b.fire=0;b.ice=0;b.poison=0;b.knife=0;b.trail=0;b.bell=0;b.cannon=0;
  for(var k in fl)b[k]=fl[k];game.bullets.push(b);return b;
}
(function(){
  var _sg=startGame;startGame=function(){CFX.length=0;if(typeof PL!=="undefined")PL.imp.length=0;return _sg.apply(this,arguments);};
  var _u=update;
  update=function(dt){
    var r=_u.apply(this,arguments);
    if(game&&game.player&&game.state==="playing"){hcTick(game.player,dt);hcUpdate(dt);
}
    else if(game&&game.state!=="pause"&&game.state!=="upgrade"&&CFX.length&&game.state!=="playing"){CFX.length=0;}
    return r;
  };
})();
/* ---------- drawing ---------- */
function hcDraw(){
  if(!CFX.length||!game||!game.player)return;
  var p=game.player,sc=layout.scale,ys=CFG.YSCALE,i,o,s,t=game.time||0;
  for(i=0;i<CFX.length;i++){o=CFX[i];if(o.delay>0&&o.k!=="strike"&&o.k!=="bellfall"&&o.k!=="knifefall")continue;var u=clamp(o.t/o.life,0,1);
    ctx.save();
    if(o.k==="cage"){s=toScreen(p.x,p.y);var R=o.r*sc,fa=u<0.1?u/0.1:u>0.85?(1-u)/0.15:1;ctx.globalCompositeOperation="lighter";ctx.globalAlpha=fa*(0.75+0.25*Math.sin(t*30));ctx.drawImage(hcRing("100,180,255"),s.x-R*1.1,s.y-R*1.1*ys,R*2.2,R*2.2*ys);
      ctx.strokeStyle="rgba(200,235,255,"+(0.8*fa)+")";ctx.lineWidth=1.6*sc;ctx.beginPath();for(var k=0;k<=24;k++){var aa=k/24*6.283,rr=R*(0.96+0.08*Math.sin(aa*7+t*40));var xx=s.x+Math.cos(aa)*rr,yy=s.y+Math.sin(aa)*rr*ys-6*sc;if(k)ctx.lineTo(xx,yy);else ctx.moveTo(xx,yy);}ctx.stroke();}
    else if(o.k==="skybolt"){s=toScreen(o.x,o.y);var ba=1-u;ctx.globalCompositeOperation="lighter";ctx.globalAlpha=ba;ctx.strokeStyle="rgba(170,220,255,0.9)";ctx.lineWidth=5*sc*ba+1;ctx.beginPath();var y0=s.y-260*sc,xx2=s.x;ctx.moveTo(xx2,y0);for(var q=1;q<=8;q++){ctx.lineTo(s.x+(q<8?(Math.sin(q*7.3+o.x)*14*sc):0),y0+(s.y-y0)*q/8);}ctx.stroke();ctx.strokeStyle="rgba(255,255,255,1)";ctx.lineWidth=1.8*sc;ctx.stroke();
      var gz=34*sc*(0.6+ba);ctx.drawImage(hcGlow("120,190,255"),s.x-gz,s.y-gz*0.6,gz*2,gz*1.2);ctx.globalCompositeOperation="source-over";ctx.globalAlpha=0.5*ba;ctx.drawImage(hcCrack(),s.x-26*sc,s.y-13*sc,52*sc,26*sc);}
    else if(o.k==="hurricane"){s=toScreen(o.x,o.y);var fa2=u<0.12?u/0.12:u>0.85?(1-u)/0.15:1;for(var r2=0;r2<5;r2++){var rad=(18+r2*15)*sc,rot=t*(6-r2*0.7)+r2;ctx.globalAlpha=fa2*(0.55-r2*0.08);ctx.strokeStyle=r2%2?"rgba(150,200,255,1)":"rgba(220,240,255,1)";ctx.lineWidth=(3.4-r2*0.4)*sc;ctx.beginPath();ctx.ellipse(s.x,s.y-r2*12*sc,rad,rad*0.38,0,rot,rot+4.2);ctx.stroke();}
      ctx.globalCompositeOperation="lighter";ctx.globalAlpha=fa2*0.6;var hg=70*sc;ctx.drawImage(hcGlow("90,150,255"),s.x-hg,s.y-hg*0.9,hg*2,hg*1.5);}
    else if(o.k==="knifefall"){s=toScreen(o.x,o.y);var fu=clamp(o.t/0.32,0,1),hh=(1-fu)*150*sc;if(o.delay>0){ctx.restore();continue;}
      ctx.globalAlpha=0.35*fu;if(typeof softShadowSpr==="function")ctx.drawImage(softShadowSpr(),s.x-6*sc,s.y-2.5*sc,12*sc,5*sc);ctx.globalAlpha=fu<1?1:Math.max(0,1-(o.t-0.32)/0.2);
      ctx.translate(s.x,s.y-hh-4*sc);ctx.rotate(Math.PI/2);ctx.fillStyle="#eceff1";ctx.beginPath();ctx.moveTo(10*sc,0);ctx.lineTo(-3*sc,3*sc);ctx.lineTo(-3*sc,-3*sc);ctx.closePath();ctx.fill();ctx.strokeStyle="#1a140c";ctx.lineWidth=1;ctx.stroke();ctx.fillStyle="#3e2723";ctx.fillRect(-9*sc,-1.8*sc,6*sc,3.6*sc);
      if(fu>=1){ctx.setTransform(1,0,0,1,0,0);ctx.restore();ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=Math.max(0,1-(o.t-0.32)/0.2);var kg=14*sc;ctx.drawImage(hcGlow("255,240,220"),s.x-kg,s.y-kg*0.7,kg*2,kg*1.4);}}
    else if(o.k==="tornado"){s=toScreen(p.x,p.y);var fa3=u<0.1?u/0.1:u>0.88?(1-u)/0.12:1;ctx.globalAlpha=fa3*0.35;ctx.strokeStyle="rgba(230,240,255,1)";ctx.lineWidth=2*sc;for(var w=0;w<3;w++){ctx.beginPath();ctx.ellipse(s.x,s.y-(8+w*10)*sc,(56-w*6)*sc,(20-w*2)*sc,0,t*9+w,t*9+w+3.4);ctx.stroke();}
      ctx.globalAlpha=fa3;for(var kn=0;kn<8;kn++){var ka=t*9+kn/8*6.283,kr=56*sc*(0.9+0.1*Math.sin(t*5+kn)),kx=s.x+Math.cos(ka)*kr,ky=s.y-14*sc+Math.sin(ka)*kr*0.38;ctx.save();ctx.translate(kx,ky);ctx.rotate(ka+Math.PI/2);ctx.fillStyle="#f5f5f5";ctx.beginPath();ctx.moveTo(9*sc,0);ctx.lineTo(-3*sc,2.6*sc);ctx.lineTo(-3*sc,-2.6*sc);ctx.closePath();ctx.fill();ctx.strokeStyle="#263238";ctx.lineWidth=1;ctx.stroke();ctx.fillStyle="#3e2723";ctx.fillRect(-8*sc,-1.6*sc,5*sc,3.2*sc);ctx.restore();}}
    else if(o.k==="exec"){var nseg=o.pts.length-1,prog=Math.min(nseg,o.t/0.09),fa4=u>0.7?(1-u)/0.3:1;ctx.globalAlpha=fa4;ctx.lineCap="round";
      for(var e=0;e<Math.floor(prog)+1&&e<nseg;e++){var A=toScreen(o.pts[e].x,o.pts[e].y),B=toScreen(o.pts[e+1].x,o.pts[e+1].y),f=Math.min(1,prog-e);A.y-=16*sc;B.y-=16*sc;var bx=A.x+(B.x-A.x)*f,by=A.y+(B.y-A.y)*f;
        ctx.strokeStyle="rgba(20,10,30,0.55)";ctx.lineWidth=7*sc;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(bx,by);ctx.stroke();ctx.strokeStyle="rgba(255,255,255,0.95)";ctx.lineWidth=2*sc;ctx.stroke();
        if(f>=1){ctx.save();ctx.translate(B.x,B.y);ctx.rotate(-0.7);ctx.strokeStyle="rgba(255,60,60,0.95)";ctx.lineWidth=3*sc;ctx.beginPath();ctx.moveTo(-14*sc,0);ctx.lineTo(14*sc,0);ctx.stroke();ctx.rotate(1.4);ctx.beginPath();ctx.moveTo(-10*sc,0);ctx.lineTo(10*sc,0);ctx.stroke();ctx.restore();}}
      var hd=Math.min(nseg,Math.floor(prog)),C=toScreen(o.pts[Math.min(nseg,hd+(prog<nseg?1:0))].x,o.pts[Math.min(nseg,hd+(prog<nseg?1:0))].y);ctx.fillStyle="rgba(10,6,16,0.8)";ctx.beginPath();ctx.ellipse(C.x,C.y-16*sc,6*sc,14*sc,0,0,7);ctx.fill();}
    else if(o.k==="slam"||o.k==="quake"){if(o.delay>0){ctx.restore();continue;}s=toScreen(o.x,o.y);var R2=o.r*sc*(0.4+0.6*Math.min(1,u*2.5)),fa5=1-u;ctx.globalAlpha=0.8*fa5;ctx.drawImage(hcCrack(),s.x-R2,s.y-R2*0.5,R2*2,R2);
      ctx.globalAlpha=0.6*fa5;ctx.strokeStyle="rgba(215,204,200,1)";ctx.lineWidth=5*sc*fa5+1;ctx.beginPath();ctx.ellipse(s.x,s.y,R2*1.05,R2*1.05*ys,0,0,7);ctx.stroke();
      for(var dpt=0;dpt<6;dpt++){var da2=dpt/6*6.28+o.x,dr=R2*0.8;ctx.fillStyle="rgba(140,110,90,"+(0.5*fa5)+")";ctx.beginPath();ctx.arc(s.x+Math.cos(da2)*dr,s.y+Math.sin(da2)*dr*ys-u*18*sc,(4+3*u)*sc,0,7);ctx.fill();}
      if(o.k==="quake"){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.5*fa5;var qg=R2*0.6;ctx.drawImage(hcGlow("255,120,40"),s.x-qg,s.y-qg*0.5,qg*2,qg);}}
    else if(o.k==="bellfall"||o.k==="strike"){s=toScreen(o.x,o.y);var land=o.k==="bellfall"?0.5:0.62,fu2=clamp(o.t/land,0,1),post=o.t-land;
      if(o.delay>0||fu2<1){var mr=(o.k==="bellfall"?40:46)*sc;ctx.globalAlpha=0.25+0.5*fu2;ctx.strokeStyle=o.k==="bellfall"?"rgba(255,213,79,0.95)":"rgba(255,82,82,0.95)";ctx.lineWidth=2*sc;ctx.beginPath();ctx.ellipse(s.x,s.y,mr*(1.2-0.2*fu2),mr*(1.2-0.2*fu2)*ys,0,0,7);ctx.stroke();
        if(o.delay<=0){ctx.globalAlpha=0.4*fu2;if(typeof softShadowSpr==="function")ctx.drawImage(softShadowSpr(),s.x-mr*0.5*fu2,s.y-mr*0.22*fu2,mr*fu2,mr*0.44*fu2);
          var hy2=s.y-(1-fu2)*(1-fu2)*300*sc;ctx.globalAlpha=1;ctx.save();ctx.translate(s.x,hy2-10*sc);
          if(o.k==="bellfall"){ctx.rotate(0.3+o.t*6);var bs=1.6*sc;ctx.fillStyle="#455a64";ctx.fillRect(-12*bs,-1.6*bs,24*bs,3.2*bs);ctx.fillStyle="#263238";ctx.beginPath();ctx.ellipse(-12*bs,0,4*bs,7*bs,0,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(12*bs,0,4*bs,7*bs,0,0,7);ctx.fill();ctx.fillStyle="rgba(255,255,255,0.35)";ctx.fillRect(-11*bs,-5*bs,2*bs,8*bs);ctx.fillRect(13*bs,-5*bs,2*bs,8*bs);}
          else{ctx.rotate(Math.PI/2);ctx.fillStyle="#37474f";ctx.beginPath();ctx.ellipse(0,0,9*sc,3.4*sc,0,0,7);ctx.fill();ctx.fillStyle="#b71c1c";ctx.fillRect(-9*sc,-1*sc,3*sc,2*sc);ctx.fillStyle="#cfd8dc";ctx.beginPath();ctx.moveTo(-9*sc,0);ctx.lineTo(-13*sc,-4*sc);ctx.lineTo(-13*sc,4*sc);ctx.closePath();ctx.fill();}
          ctx.restore();}}
      else{var fa6=clamp(1-post/0.45,0,1);ctx.globalAlpha=0.7*fa6;ctx.drawImage(hcCrack(),s.x-30*sc,s.y-15*sc,60*sc,30*sc);}}
    else if(o.k==="plane"){var ps=toScreen(o.x,o.y),pa=Math.atan2(Math.sin(o.a)*ys,Math.cos(o.a)),pd=(u-0.5)*SW*1.4;ctx.globalAlpha=0.3*Math.sin(u*Math.PI);if(typeof softShadowSpr==="function"){ctx.translate(ps.x+Math.cos(pa)*pd,ps.y+Math.sin(pa)*pd);ctx.rotate(pa);ctx.drawImage(softShadowSpr(),-60*sc,-12*sc,120*sc,24*sc);ctx.fillStyle="rgba(0,0,0,0.5)";ctx.fillRect(-20*sc,-50*sc,22*sc,100*sc);}}
    else if(o.k==="rail"){s=toScreen(o.x,o.y);s.y-=18*sc;var ra=Math.atan2(Math.sin(o.a)*ys,Math.cos(o.a)),rl=o.len*sc*Math.sqrt(Math.cos(o.a)*Math.cos(o.a)+Math.sin(o.a)*Math.sin(o.a)*ys*ys),fa7=1-u;ctx.translate(s.x,s.y);ctx.rotate(ra);ctx.globalCompositeOperation="lighter";
      ctx.globalAlpha=fa7;if(typeof plStreak==="function")ctx.drawImage(plStreak("255,200,60","rail"),0,-9*sc*fa7-2,rl*Math.min(1,u*6),18*sc*fa7+4);ctx.fillStyle="rgba(255,255,230,"+fa7+")";ctx.fillRect(0,-1.2*sc,rl*Math.min(1,u*6),2.4*sc);
      for(var rg=1;rg<5;rg++){var rx=rl*rg/5*Math.min(1,u*6);ctx.strokeStyle="rgba(255,220,120,"+(0.6*fa7)+")";ctx.lineWidth=1.5*sc;ctx.beginPath();ctx.ellipse(rx,0,3*sc,(6+u*10)*sc,0,0,7);ctx.stroke();}}
    else if(o.k==="dragon"){var hs=p._handSx!=null?{x:p._handSx,y:p._handSy}:toScreen(p.x,p.y),da3=Math.atan2(Math.sin(o.a)*ys,Math.cos(o.a)),fa8=1-u;ctx.translate(hs.x,hs.y);ctx.rotate(da3);ctx.globalCompositeOperation="lighter";
      var fl=typeof ensureFlameSpr==="function"?ensureFlameSpr():null;if(fl){for(var fi=0;fi<4;fi++){var fw=(60+fi*25)*sc*(0.6+u*0.8),fh=(16+fi*9)*sc*(0.6+u),off=(fi-1.5)*0.16;ctx.save();ctx.rotate(off);ctx.globalAlpha=fa8*(0.85-fi*0.12);ctx.scale(-1,1);ctx.drawImage(fl,-fw-6*sc,-fh/2,fw,fh);ctx.restore();}}}
    else if(o.k==="slug"){var A2=p._handSx!=null?{x:p._handSx,y:p._handSy}:toScreen(o.x,o.y),B2=toScreen(o.tx,o.ty);B2.y-=10*sc;var sx=A2.x+(B2.x-A2.x)*u,sy=A2.y+(B2.y-A2.y)*u-Math.sin(u*Math.PI)*20*sc;ctx.globalCompositeOperation="lighter";var sg=10*sc;ctx.drawImage(hcGlow("255,150,60"),sx-sg,sy-sg,sg*2,sg*2);ctx.fillStyle="#ffe0b2";ctx.beginPath();ctx.arc(sx,sy,2.8*sc,0,7);ctx.fill();}
    else if(o.k==="laser"){var eye=toScreen(p.x,p.y);eye.y-=(p._handLift||22)+10*sc;var la2=Math.atan2(Math.sin(o.a||0)*ys,Math.cos(o.a||0)),fa9=u<0.08?u/0.08:u>0.9?(1-u)/0.1:1,LL=430*sc;ctx.translate(eye.x,eye.y);ctx.rotate(la2);ctx.globalCompositeOperation="lighter";
      ctx.globalAlpha=fa9;if(typeof plStreak==="function"){ctx.save();ctx.scale(-1,1);ctx.drawImage(plStreak("255,30,30","laser"),-LL,-10*sc,LL,20*sc);ctx.restore();}ctx.fillStyle="rgba(255,220,220,"+fa9+")";ctx.fillRect(0,-1.4*sc,LL,2.8*sc);var eg=16*sc*(0.9+0.2*Math.sin(t*40));ctx.drawImage(hcGlow("255,40,40"),-eg,-eg,eg*2,eg*2);}
    ctx.restore();
  }
  ctx.globalAlpha=1;
}
(function(){
  var _dl=drawLighting;
  drawLighting=function(){var r=_dl.apply(this,arguments);hcDraw();return r;};
})();
/* ---------- card reveal UI ---------- */
var CARDUI={face:{},back:{},rays:null,shine:null};
function cuHexA(h,a){var n=parseInt(h.slice(1),16);return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}
function cuFace(ri,w,h){
  var k=ri+"_"+Math.round(w)+"_"+Math.round(h);if(CARDUI.face[k])return CARDUI.face[k];
  var R=RARITIES[ri],d=Math.min(2,window.devicePixelRatio||1),pad=18,c=document.createElement("canvas");c.width=Math.ceil((w+pad*2)*d);c.height=Math.ceil((h+pad*2)*d);
  var g=c.getContext("2d");g.scale(d,d);g.translate(pad,pad);
  /* soft outer glow (baked) */
  if(ri>=3){for(var i=6;i>=1;i--){g.strokeStyle=cuHexA(R.glow,0.05*(7-i)/(ri>=5?0.7:1));g.lineWidth=i*3;roundRect(g,0,0,w,h,12);g.stroke();}}
  var fr=g.createLinearGradient(0,0,w,h);fr.addColorStop(0,R.glow);fr.addColorStop(0.45,R.color);fr.addColorStop(1,R.frame);
  g.fillStyle=fr;roundRect(g,0,0,w,h,12);g.fill();
  var ip=ri>=5?7:5,bg=g.createLinearGradient(0,ip,0,h-ip);bg.addColorStop(0,"#25223a");bg.addColorStop(1,"#0f0e19");
  g.fillStyle=bg;roundRect(g,ip,ip,w-ip*2,h-ip*2,9);g.fill();
  var rg=g.createRadialGradient(w/2,h*0.3,4,w/2,h*0.3,w*0.75);rg.addColorStop(0,cuHexA(R.color,ri>=3?0.42:0.26));rg.addColorStop(1,cuHexA(R.color,0));g.fillStyle=rg;roundRect(g,ip,ip,w-ip*2,h-ip*2,9);g.fill();
  /* banner */
  var bh=22,bgb=g.createLinearGradient(0,ip,0,ip+bh);bgb.addColorStop(0,R.glow);bgb.addColorStop(1,R.color);g.fillStyle=bgb;roundRect(g,ip+3,ip+3,w-ip*2-6,bh,6);g.fill();
  g.fillStyle="rgba(0,0,0,0.25)";g.fillRect(ip+3,ip+3+bh-3,w-ip*2-6,3);
  g.font="900 12px system-ui";g.textAlign="center";g.fillStyle="rgba(0,0,0,0.35)";g.fillText(R.name.toUpperCase(),w/2,ip+3+16);g.fillStyle="#fff";g.fillText(R.name.toUpperCase(),w/2+0,ip+3+15);
  /* icon disc */
  var cx=w/2,cy=ip+bh+38,dg=g.createRadialGradient(cx,cy-6,3,cx,cy,30);dg.addColorStop(0,cuHexA(R.glow,0.9));dg.addColorStop(0.6,cuHexA(R.color,0.55));dg.addColorStop(1,cuHexA(R.frame,0.2));g.fillStyle=dg;g.beginPath();g.arc(cx,cy,28,0,7);g.fill();
  g.strokeStyle=cuHexA(R.glow,0.9);g.lineWidth=2;g.stroke();
  /* corner gems for epic+ */
  if(ri>=3){var gems=[[ip+8,h-ip-8],[w-ip-8,h-ip-8]];if(ri>=5)gems.push([ip+8,ip+bh+12],[w-ip-8,ip+bh+12]);gems.forEach(function(q){g.save();g.translate(q[0],q[1]);g.rotate(Math.PI/4);g.fillStyle=R.glow;g.fillRect(-4,-4,8,8);g.fillStyle=R.frame;g.fillRect(-2,-2,4,4);g.restore();});}
  if(ri>=5){g.strokeStyle="rgba(255,248,200,0.8)";g.lineWidth=1.2;roundRect(g,3,3,w-6,h-6,10);g.stroke();}
  CARDUI.face[k]={c:c,pad:pad,d:d};return CARDUI.face[k];
}
function cuBack(ri,w,h){
  var k=ri+"_"+Math.round(w)+"_"+Math.round(h);if(CARDUI.back[k])return CARDUI.back[k];
  var R=RARITIES[ri],d=Math.min(2,window.devicePixelRatio||1),c=document.createElement("canvas");c.width=Math.ceil(w*d);c.height=Math.ceil(h*d);var g=c.getContext("2d");g.scale(d,d);
  var fr=g.createLinearGradient(0,0,w,h);fr.addColorStop(0,"#3a3550");fr.addColorStop(1,"#15131f");g.fillStyle=fr;roundRect(g,0,0,w,h,12);g.fill();
  g.strokeStyle=cuHexA(R.color,0.9);g.lineWidth=3;roundRect(g,4,4,w-8,h-8,9);g.stroke();
  g.save();g.translate(w/2,h/2);for(var i=0;i<12;i++){g.rotate(Math.PI/6);g.fillStyle=cuHexA(R.color,0.12);g.beginPath();g.moveTo(0,0);g.lineTo(w,-12);g.lineTo(w,12);g.closePath();g.fill();}g.restore();
  g.font="900 54px system-ui";g.textAlign="center";g.fillStyle=cuHexA(R.glow,0.9);g.fillText("Z",w/2,h/2+19);
  CARDUI.back[k]={c:c,d:d};return CARDUI.back[k];
}
function cuRays(){if(CARDUI.rays)return CARDUI.rays;var c=document.createElement("canvas");c.width=c.height=256;var g=c.getContext("2d");g.translate(128,128);
  for(var i=0;i<16;i++){g.rotate(Math.PI/8);var gr=g.createLinearGradient(0,0,128,0);gr.addColorStop(0,"rgba(255,236,150,0.75)");gr.addColorStop(1,"rgba(255,200,60,0)");g.fillStyle=gr;g.beginPath();g.moveTo(0,0);g.lineTo(128,-14);g.lineTo(128,14);g.closePath();g.fill();}
  CARDUI.rays=c;return c;}
function cuShine(){if(CARDUI.shine)return CARDUI.shine;var c=document.createElement("canvas");c.width=64;c.height=256;var g=c.getContext("2d"),gr=g.createLinearGradient(0,0,64,0);gr.addColorStop(0,"rgba(255,255,255,0)");gr.addColorStop(0.5,"rgba(255,255,255,0.55)");gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.fillRect(0,0,64,256);CARDUI.shine=c;return c;}
function cuTimes(){ /* reveal schedule (s) per card */
  var out=[],t=0.1,i,c;for(i=0;i<game.upgradeCards.length;i++){c=game.upgradeCards[i].upgrade;var pre=c.rarity>=5?0.75:c.rarity>=4?0.35:0;out.push({start:t,flip:t+pre,end:t+pre+0.26});t+=0.16;}
  return out;
}
function cuEl(){return game&&game.upgradeOpenAt!=null?(fxNow()-game.upgradeOpenAt)/1000:99;}
(function(){
  var _ur=upgradeReady;
  upgradeReady=function(){if(!_ur())return false;if(!game||!game.upgradeCards||!game.upgradeCards.length||game.upgradeOpenAt==null)return true;var ts=cuTimes(),last=ts[ts.length-1];return cuEl()>=last.end+0.05;};
  var _sfx=sfx;
  sfx=function(name,extra){if(name==="rarity5"){_sfx("rarity4",extra);_sfx("level",extra);return;}return _sfx.apply(this,arguments);};
  var _pick=pickUpgradeChoices;
  pickUpgradeChoices=function(){var r=_pick.apply(this,arguments);if(game)game._cuSnd={};return r;};
})();
drawUpgradeUI=function(){
  var el=cuEl(),ts=cuTimes(),ready=upgradeReady(),i,fl=0;
  ctx.fillStyle="rgba(6,6,14,0.8)";ctx.fillRect(0,0,SW,SH);
  ctx.textAlign="center";var titleY=game.upgradeCards[0]?Math.max(26,game.upgradeCards[0].y-14):40;
  ctx.font="900 22px system-ui";ctx.lineJoin="round";ctx.strokeStyle="#2a1600";ctx.lineWidth=5;ctx.strokeText("¡Ronda superada! Elige una mejora",SW/2,titleY);ctx.fillStyle="#ffcc33";ctx.fillText("¡Ronda superada! Elige una mejora",SW/2,titleY);
  game._cuSnd=game._cuSnd||{};
  for(i=0;i<game.upgradeCards.length;i++){var card=game.upgradeCards[i],up=card.upgrade,T=ts[i],ri=up.rarity,R=RARITIES[ri];
    var cx=card.x+card.w/2,cy=card.y+card.h/2,w=card.w,h=card.h;
    if(el<T.start)continue;
    var intro=clamp((el-T.start)/0.22,0,1),ei=1-Math.pow(1-intro,3);
    var flipU=clamp((el-T.flip)/0.26,0,1),showFace=flipU>=0.5,sx=Math.abs(Math.cos(flipU*Math.PI));
    if(flipU>=1)sx=1;
    if(el>=T.flip+0.13&&!game._cuSnd[i]){game._cuSnd[i]=1;if(ri>=3)sfx("rarity"+ri);else sfx("card");if(ri>=5){shake(10);fl=1;}}
    var pr=input&&input.upPress&&!input.upPress.moved&&input.upPress.target===i;
    var bob=showFace&&flipU>=1?Math.sin(fxNow()/1000*2+i)*2:0,sc=(0.8+0.2*ei)*(pr?0.95:1);
    ctx.save();ctx.globalAlpha=ei;ctx.translate(cx,cy+(1-ei)*40+bob);
    /* behind-card effects */
    if(showFace&&ri>=5){ctx.save();ctx.globalCompositeOperation="lighter";ctx.rotate(fxNow()/1000*0.6);var rs=Math.max(w,h)*1.05;ctx.globalAlpha=0.38*ei;ctx.drawImage(cuRays(),-rs,-rs,rs*2,rs*2);ctx.restore();}
    if(ri>=4&&typeof plGlow==="function"){ctx.save();ctx.globalCompositeOperation="lighter";var pulse=0.5+0.5*Math.sin(fxNow()/1000*(ri>=5?5:3.5));
      var pre=!showFace?clamp((el-T.start)/Math.max(0.01,T.flip-T.start),0,1):1,gs=Math.max(w,h)*(0.7+0.15*pulse);ctx.globalAlpha=(showFace?0.45+0.25*pulse:pre*0.8)*ei;
      var col=ri>=5?"255,200,60":"255,70,60";ctx.drawImage(plGlow(col,"card"+ri),-gs,-gs,gs*2,gs*2);ctx.restore();}
    ctx.scale(sc*sx,sc);
    if(!showFace){ /* back: shakes harder as a mythic/legendary charges */
      var chg=clamp((el-T.start)/Math.max(0.01,T.flip-T.start+0.13),0,1),jit=ri>=4?Math.sin(fxNow()/14)*chg*(ri>=5?3:1.6):0;
      var bk=cuBack(ri,w,h);ctx.drawImage(bk.c,-w/2+jit,-h/2,w,h);
      if(ri>=4){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=chg*0.5*ei;ctx.fillStyle=ri>=5?"#ffd54f":"#ff5252";roundRect(ctx,-w/2,-h/2,w,h,12);ctx.fill();}
    }else{
      var F=cuFace(ri,w,h);ctx.drawImage(F.c,-w/2-F.pad,-h/2-F.pad,w+F.pad*2,h+F.pad*2);
      /* shimmer sweep */
      if(ri>=3){var per=ri>=5?1.6:2.4,ph=((fxNow()/1000+i*0.5)%per)/per;ctx.save();roundRect(ctx,-w/2+5,-h/2+5,w-10,h-10,9);ctx.clip();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.5;ctx.rotate(0.35);ctx.drawImage(cuShine(),-w*0.9+ph*w*1.8-20,-h,40,h*2);ctx.restore();}
      var x0=-w/2,y0=-h/2,ip=ri>=5?7:5;
      ctx.textAlign="center";ctx.font="32px system-ui";ctx.fillStyle="#fff";ctx.fillText(up.icon,0,y0+ip+22+38+11);
      ctx.font="800 15px system-ui";ctx.fillStyle="#fff";var ny=wrapTextH(up.name,0,y0+ip+22+38+30+20,w-20,17);
      if(up.def&&up.def.hero){ctx.font="800 9px system-ui";ctx.fillStyle=R.glow;ctx.fillText("★ CARTA DE HÉROE ★",0,ny+14);ny+=12;}
      ctx.fillStyle="#d7dce4";ctx.font="12px system-ui";wrapText(up.desc,0,ny+20,w-18,15);
      var tr=up.trade||[],t,tw=0,parts=[];ctx.font="700 11px system-ui";ctx.textAlign="left";
      for(t=0;t<tr.length;t++){parts[t]=tr[t].s+(t<tr.length-1?"  ":"");tw+=ctx.measureText(parts[t]).width;}
      var tx=-tw/2,ty=h/2-ip-10;for(t=0;t<tr.length;t++){ctx.fillStyle=tr[t].c;ctx.fillText(parts[t],tx,ty);tx+=ctx.measureText(parts[t]).width;}
      if(flipU<1){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=(1-flipU)*1.4;ctx.fillStyle="#fff";roundRect(ctx,-w/2,-h/2,w,h,12);ctx.fill();}
    }
    ctx.restore();
    /* legendary sparks orbiting */
    if(showFace&&ri>=5&&typeof plGlow==="function"){ctx.save();ctx.globalCompositeOperation="lighter";var tt=fxNow()/1000;for(var s=0;s<10;s++){var a=tt*1.4+s*0.628,rx=w*0.62,ry=h*0.58,px=cx+Math.cos(a)*rx,py=cy+Math.sin(a)*ry,z=4+3*Math.sin(tt*6+s);ctx.globalAlpha=0.7;ctx.drawImage(plGlow("255,220,120","spark"),px-z,py-z,z*2,z*2);}ctx.restore();}
    if(!ready&&flipU>=1){ctx.save();ctx.globalAlpha=0.25;ctx.fillStyle="#000";roundRect(ctx,card.x,card.y,card.w,card.h,12);ctx.fill();ctx.restore();}
    if(pr){ctx.save();ctx.strokeStyle="#fff8e1";ctx.lineWidth=3;roundRect(ctx,card.x-3,card.y-3,card.w+6,card.h+6,14);ctx.stroke();ctx.restore();}
  }
  /* legendary flash */
  var lf=0;for(i=0;i<ts.length;i++){var u2=game.upgradeCards[i].upgrade;if(u2.rarity>=5){var dtf=el-(ts[i].flip+0.13);if(dtf>0&&dtf<0.5)lf=Math.max(lf,1-dtf/0.5);}}
  if(lf>0){ctx.save();ctx.globalAlpha=lf*0.55;ctx.fillStyle="#fff3c4";ctx.fillRect(0,0,SW,SH);ctx.restore();}
  var hrb=game.rerollBtn;if(hrb&&hrb.y+hrb.h+14<SH-2){ctx.font="bold 11px system-ui";ctx.textAlign="center";ctx.fillStyle=ready?"rgba(255,236,179,0.85)":"rgba(200,200,200,0.5)";ctx.fillText(ready?"Toca una carta para elegirla":"Revelando cartas…",SW/2,hrb.y+hrb.h+13);}
  var rb=game.rerollBtn;if(rb){var on=(game.rerollLeft||0)>0&&ready;ctx.fillStyle=on?"#3e2723":"#2a2a2a";ctx.strokeStyle=on?"#ffb74d":"#555";ctx.lineWidth=2;roundRect(ctx,rb.x,rb.y,rb.w,rb.h,10);ctx.fill();ctx.stroke();ctx.fillStyle=on?"#ffe082":"#888";ctx.font="bold 15px system-ui";ctx.textAlign="center";ctx.fillText((game.rerollLeft||0)>0?"🎲  Cambiar cartas  (1)":"Sin más cambios",rb.x+rb.w/2,rb.y+rb.h/2+5);}
  ctx.textAlign="left";
};
