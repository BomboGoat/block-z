function worldH(){return layout.gameDrawH/(layout.scale*CFG.YSCALE);}
function worldW(){return layout.gameDrawW/layout.scale;}
function safeGrad(x0,y0,x1,y1){if(!isFinite(x0+y0+x1+y1))return null;return ctx.createLinearGradient(x0,y0,x1,y1);}
function ellP(c,x,y,rx,ry){c.beginPath();c.ellipse(x,y,Math.max(0.4,rx),Math.max(0.4,ry),0,0,7);}
function fs(c,fill,stroke,lw){if(fill){c.fillStyle=fill;c.fill();}if(stroke!==0){c.strokeStyle=stroke||"#1a140c";c.lineWidth=lw==null?2.5:lw;c.lineJoin="round";c.lineCap="round";c.stroke();}}
function lg(c,x0,y0,x1,y1,a,b){if(!isFinite(x0+y0+x1+y1))return a||"#888";var g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
function rg(c,x,y,r0,r1,a,b){if(!isFinite(x+y+r0+r1))return a||"#888";var g=c.createRadialGradient(x,y,Math.max(0,r0),x,y,Math.max(0.1,r1));g.addColorStop(0,a);g.addColorStop(1,b);return g;}

/* ===== environment ===== */
function drawShadow(wx,wy,rw,rd){
  var s=toScreen(wx,wy),sc=layout.scale;
  ctx.fillStyle="rgba(0,0,0,0.32)";
  fillEllipse(ctx,s.x,s.y+rd*CFG.YSCALE*sc*0.15,rw*sc,rd*CFG.YSCALE*sc*0.45);
}
function drawBox3D(o,alpha){
  var s=toScreen(o.x,o.y),sc=layout.scale,ys=CFG.YSCALE;
  var sw=o.w*sc,sd=Math.max(3,o.d*ys*sc),h=(isFinite(o.h)?o.h:22)*sc;
  var x=s.x,y=s.y,top=o.top||"#c2b6a2",side=o.side||shadeHex(top,-40);
  if(!isFinite(x+y+sw+sd+h)||sw<1)return;
  ctx.globalAlpha=alpha==null?1:alpha;
  ctx.fillStyle="rgba(20,16,10,0.38)";
  ctx.beginPath();ctx.ellipse(x+sw*0.5,y+sd+3,sw*0.66,Math.max(6,sd*0.5),0,0,7);ctx.fill();
  var fy=y+sd-h,ty=y-h,rr=Math.min(7*sc,sw*0.12,sd*0.18);
  /* front */
  ctx.fillStyle=lg(ctx,x,fy,x,fy+h,shadeHex(side,8),shadeHex(side,-18));
  roundRect(ctx,x,fy,sw,h,Math.min(4,rr));ctx.fill();
  ctx.fillStyle="rgba(0,0,0,0.16)";ctx.fillRect(x+sw*0.82,fy,sw*0.18,h);
  ctx.fillStyle="rgba(255,255,255,0.08)";ctx.fillRect(x,fy,sw*0.1,h);
  /* top */
  ctx.fillStyle=lg(ctx,x,ty,x+sw,ty+sd,shadeHex(top,36),shadeHex(top,-8));
  roundRect(ctx,x,ty,sw,sd,rr);ctx.fill();
  /* texture */
  var tex=o.tex||(o.k==="crate"||o.k==="wallbit"?"wood":o.k==="wall"||o.k==="rubble"?"brick":o.k==="shop"?"metal":"");
  if(tex==="brick"){
    ctx.strokeStyle="rgba(80,50,30,0.22)";ctx.lineWidth=1;
    var by,bx,bh=Math.max(7,8*sc),bw=Math.max(11,14*sc);
    for(by=ty+4;by<ty+sd-3;by+=bh){for(bx=x+3+((by/bh|0)%2)*bw*0.5;bx<x+sw-4;bx+=bw){roundRect(ctx,bx,by,bw-2,bh-2,1.5);ctx.stroke();}}
  }else if(tex==="wood"){
    ctx.strokeStyle="rgba(60,30,10,0.28)";ctx.lineWidth=1.2;
    for(bx=x+6;bx<x+sw-4;bx+=6*sc){ctx.beginPath();ctx.moveTo(bx,ty+3);ctx.lineTo(bx,ty+sd-3);ctx.stroke();}
    ctx.fillStyle="rgba(40,30,20,0.55)";
    ctx.beginPath();ctx.arc(x+sw*0.28,ty+sd*0.35,1.5*sc,0,7);ctx.arc(x+sw*0.72,ty+sd*0.62,1.5*sc,0,7);ctx.fill();
  }else if(tex==="metal"){
    ctx.strokeStyle="rgba(255,255,255,0.15)";ctx.lineWidth=1;
    ctx.strokeRect(x+4,ty+4,sw-8,sd-8);
  }
  if(h>28*sc&&sw>22){
    var wx,wy,rows=Math.max(1,(h/14/sc)|0),cols=Math.max(1,(sw/16)|0),wi,wj;
    for(wj=0;wj<rows;wj++)for(wi=0;wi<cols;wi++){
      wx=x+6+wi*((sw-10)/cols);wy=fy+4+wj*12*sc;
      ctx.fillStyle=(wi+wj+((o.x+o.y)|0))%3===0?"rgba(255,220,140,0.45)":"rgba(30,50,70,0.55)";
      ctx.fillRect(wx,wy,Math.max(4,(sw-12)/cols-3),Math.max(4,7*sc));
    }
  }
  if(h>36*sc&&sw>30){ctx.fillStyle="#90a4ae";ctx.fillRect(x+sw*0.62,ty-5*sc,sw*0.18,6*sc);ctx.fillStyle="#607d8b";ctx.fillRect(x+sw*0.64,ty-9*sc,sw*0.14,5*sc);}
  ctx.strokeStyle="rgba(20,14,8,0.85)";ctx.lineWidth=Math.max(1.6,1.8*sc);
  roundRect(ctx,x,ty,sw,sd,rr);ctx.stroke();
  ctx.strokeStyle="rgba(255,255,255,0.32)";ctx.lineWidth=1.3;
  ctx.beginPath();ctx.moveTo(x+rr,ty+2.5);ctx.lineTo(x+sw-rr,ty+2.5);ctx.stroke();
  ctx.fillStyle="rgba(0,0,0,0.28)";ctx.fillRect(x,ty+sd-2,sw,2);
  ctx.globalAlpha=1;
}
function treeHides(o,x,y){
  var cx=o.x+o.w/2,cy=o.y+o.d/2,R=o.canopy||40,d=dist(x,y,cx,cy);
  return d<R+12||(y<cy&&d<R+28);
}
function drawTree(o){
  var s=toScreen(o.x+o.w/2,o.y+o.d/2),sc=layout.scale,R=(o.canopy||40)*sc,h=(o.h||16)*sc;
  ctx.fillStyle="rgba(0,0,0,0.28)";fillEllipse(ctx,s.x+3,s.y+10,R*0.72,R*0.34);
  drawBox3D({x:o.x+o.w*0.22,y:o.y+o.d*0.22,w:o.w*0.56,d:o.d*0.56,h:o.h+8,top:"#8d6e4a",side:"#5d4030",k:"crate",tex:"wood"});
  var ghost=0,p=game&&game.player,zs,i;
  if(p&&treeHides(o,p.x,p.y))ghost=1;
  if(!ghost&&game&&game.zombies){zs=game.zombies;for(i=0;i<zs.length;i++)if(!zs[i].dead&&onScreen(zs[i].x,zs[i].y,40)&&treeHides(o,zs[i].x,zs[i].y)){ghost=1;break;}}
  var cy=s.y-h-R*0.28;
  ctx.globalAlpha=ghost?0.38:1;
  function blob(x,y,rx,ry,col,hi){ellP(ctx,x,y,rx,ry);fs(ctx,rg(ctx,x-rx*0.25,y-ry*0.3,2,rx,hi||shadeHex(col,40),col),"#143318",2.2);}
  blob(s.x,cy,R,R*0.78,"#1b7a32","#6ad14a");
  blob(s.x-R*0.28,cy-R*0.12,R*0.62,R*0.52,"#248a38","#8be05a");
  blob(s.x+R*0.3,cy+R*0.05,R*0.5,R*0.42,"#186c2c","#5cbf40");
  blob(s.x-R*0.08,cy-R*0.38,R*0.34,R*0.26,"#3daa44","#b6f07a");
  ctx.globalAlpha=1;
}
function drawBush(o,ghost){
  var a=ghost?0.5:1;ctx.globalAlpha=a;
  var s=toScreen(o.x,o.y),sc=layout.scale,ys=CFG.YSCALE,sw=o.w*sc,sd=o.d*ys*sc,h=(o.h||16)*sc;
  var cx=s.x+sw*0.5,cy=s.y+sd*0.28-h*0.2,top=o.top||"#2fa344";
  ctx.fillStyle="rgba(0,0,0,0.28)";fillEllipse(ctx,cx+2,s.y+sd*0.72,sw*0.52,sd*0.4);
  function bb(x,y,rx,ry,col){ellP(ctx,x,y,rx,ry);fs(ctx,rg(ctx,x-rx*0.3,y-ry*0.35,1,rx,shadeHex(col,45),col),"#145222",2);}
  bb(cx,cy+4,sw*0.48,sd*0.48,shadeHex(top,-20));
  bb(cx-sw*0.16,cy-2,sw*0.4,sd*0.38,top);
  bb(cx+sw*0.2,cy+2,sw*0.34,sd*0.32,shadeHex(top,-10));
  bb(cx-sw*0.06,cy-10,sw*0.22,sd*0.2,shadeHex(top,28));
  ctx.globalAlpha=1;
}
function drawCar(o){
  var s=toScreen(o.x,o.y),sc=layout.scale,ys=CFG.YSCALE,sw=o.w*sc,sd=o.d*ys*sc,h=(isFinite(o.h)?o.h:24)*sc;
  var x=s.x,y=s.y,ty=y-h,col=o.top||"#1565c0",side=(typeof o.side==="string"&&o.side)?o.side:shadeHex(col,-40);
  if(!isFinite(x+y+sw+sd+h)||sw<2)return;
  ctx.fillStyle="rgba(0,0,0,0.35)";ctx.beginPath();ctx.ellipse(x+sw*0.5,y+sd+2,sw*0.58,sd*0.48,0,0,7);ctx.fill();
  /* body front */
  ctx.fillStyle=lg(ctx,x,ty+sd,x,ty+sd+h,side,shadeHex(side,-16));
  roundRect(ctx,x,ty+sd,sw,h,5);ctx.fill();
  /* body top — rounded van */
  ctx.fillStyle=lg(ctx,x,ty,x+sw,ty+sd,shadeHex(col,40),shadeHex(col,-6));
  roundRect(ctx,x,ty,sw,sd,8*sc);ctx.fill();
  ctx.strokeStyle="#1a140c";ctx.lineWidth=2;roundRect(ctx,x,ty,sw,sd,8*sc);ctx.stroke();
  /* windows */
  var wg=lg(ctx,x,ty,x+sw,ty+sd,"rgba(200,230,255,0.7)","rgba(30,60,100,0.75)");
  ctx.fillStyle=wg;
  roundRect(ctx,x+sw*0.1,ty+sd*0.18,sw*0.32,sd*0.58,3);ctx.fill();
  roundRect(ctx,x+sw*0.56,ty+sd*0.18,sw*0.32,sd*0.58,3);ctx.fill();
  ctx.fillStyle="rgba(255,255,255,0.4)";
  ctx.fillRect(x+sw*0.12,ty+sd*0.22,sw*0.12,sd*0.16);
  /* wheels */
  ctx.fillStyle="#1a1a1a";fillEllipse(ctx,x+sw*0.2,y+sd+2,6*sc,4*sc);fillEllipse(ctx,x+sw*0.8,y+sd+2,6*sc,4*sc);
  ctx.fillStyle="#9e9e9e";fillEllipse(ctx,x+sw*0.2,y+sd+2,2.6*sc,1.8*sc);fillEllipse(ctx,x+sw*0.8,y+sd+2,2.6*sc,1.8*sc);
  ctx.fillStyle="#ffe082";roundRect(ctx,x+sw-8,ty+sd+2,7,6,2);ctx.fill();
  ctx.fillStyle="#e53935";roundRect(ctx,x+2,ty+sd+2,7,6,2);ctx.fill();
  if(o.wreck){ctx.fillStyle="rgba(40,40,40,0.35)";roundRect(ctx,x+sw*0.2,ty+sd*0.1,sw*0.5,sd*0.4,3);ctx.fill();ctx.fillStyle="#5d4037";fillEllipse(ctx,x+sw*0.7,ty+sd*0.5,5*sc,3*sc);
    if(((game.time*4)|0)%2){ctx.fillStyle="#ff1744";fillEllipse(ctx,x+sw*0.85,ty+2,3*sc,3*sc);}}
  if(o.cop||o.ambu){var on=((game.time*8)|0)%2;ctx.fillStyle=on?"#2196f3":"#e53935";fillEllipse(ctx,x+sw*0.35,ty-3,4*sc,3*sc);ctx.fillStyle=on?"#e53935":"#2196f3";fillEllipse(ctx,x+sw*0.62,ty-3,4*sc,3*sc);}
  if(o.ambu){ctx.fillStyle="#e53935";ctx.fillRect(x+sw*0.08,ty+sd*0.42,sw*0.84,sd*0.16);}
}
function drawBarrel(o){
  var s=toScreen(o.x,o.y),sc=layout.scale,ys=CFG.YSCALE,sw=o.w*sc,sd=o.d*ys*sc,h=(o.h||24)*sc;
  var cx=s.x+sw/2,topC=o.top||"#d35400",side=o.side||"#8e2c00";
  ctx.fillStyle="rgba(0,0,0,0.3)";fillEllipse(ctx,cx,s.y+sd+1,sw*0.6,sd*0.4);
  ctx.fillStyle=lg(ctx,s.x,s.y-h,s.x+sw,s.y,side,shadeHex(side,-20));
  ctx.fillRect(s.x,s.y-h+sd*0.35,sw,h);
  ctx.fillStyle=lg(ctx,s.x,s.y-h,s.x+sw,s.y-h+sd,shadeHex(topC,30),topC);
  fillEllipse(ctx,cx,s.y-h+sd*0.35,sw*0.5,sd*0.48);
  ctx.strokeStyle="#1a140c";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,s.y-h+sd*0.35,sw*0.5,sd*0.48,0,0,7);ctx.stroke();
  ctx.strokeStyle="rgba(0,0,0,0.35)";ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(cx,s.y-h+sd*0.35+h*0.35,sw*0.5,sd*0.2,0,0,7);ctx.stroke();
  ctx.strokeStyle="rgba(255,255,255,0.2)";ctx.beginPath();ctx.ellipse(cx,s.y-h+sd*0.32,sw*0.28,sd*0.22,0,0,7);ctx.stroke();
}
function drawPump(o){
  drawBox3D({x:o.x,y:o.y,w:o.w,d:o.d,h:o.h||28,top:"#eceff1",side:"#c62828",tex:"metal"});
  var s=toScreen(o.x,o.y),sc=layout.scale,ys=CFG.YSCALE,sw=o.w*sc,sd=o.d*ys*sc,h=(o.h||28)*sc;
  ctx.fillStyle="#1565c0";roundRect(ctx,s.x+sw*0.18,s.y-h+sd*0.15,sw*0.64,sd*0.5,2);ctx.fill();
  ctx.fillStyle="#ffc107";ctx.fillRect(s.x+sw*0.35,s.y-h-5,sw*0.3,6);
}
function drawFountain(o){
  drawBox3D({x:o.x,y:o.y,w:o.w,d:o.d,h:10,top:"#90a4ae",side:"#546e7a",tex:"metal"});
  var s=toScreen(o.x+o.w/2,o.y+o.d/2),sc=layout.scale,t=game?game.time:0;
  ctx.fillStyle="#4fc3f7";fillEllipse(ctx,s.x,s.y-12*sc,o.w*0.32*sc,o.d*0.22*sc);
  ctx.strokeStyle="rgba(255,255,255,0.55)";ctx.lineWidth=1.6;
  var i,r;
  for(i=0;i<3;i++){r=(8+i*7+(t*28+i*10)%14)*sc;ctx.globalAlpha=0.55-i*0.12;ctx.beginPath();ctx.ellipse(s.x,s.y-14*sc,r,r*0.55,0,0,7);ctx.stroke();}
  ctx.globalAlpha=1;ctx.fillStyle="rgba(255,255,255,0.7)";fillEllipse(ctx,s.x,s.y-22*sc-Math.sin(t*8)*3*sc,3*sc,5*sc);
}
function drawSign(o){
  var s=toScreen(o.x,o.y),sc=layout.scale,ys=CFG.YSCALE,sw=o.w*sc,sd=o.d*ys*sc,h=(o.h||64)*sc;
  ctx.fillStyle="#37474f";ctx.fillRect(s.x+sw*0.4,s.y+sd-h,sw*0.2,h);
  var flk=0.65+0.35*((Math.sin((game?game.time:0)*9+o.x)>0)?1:0.25);
  ctx.fillStyle="rgba(198,40,40,"+flk+")";roundRect(ctx,s.x-sw*0.4,s.y-h+sd,sw*1.8,sd*1.6+16,4);ctx.fill();
  ctx.strokeStyle="#1a140c";ctx.lineWidth=2;roundRect(ctx,s.x-sw*0.4,s.y-h+sd,sw*1.8,sd*1.6+16,4);ctx.stroke();
  ctx.fillStyle="#ffd54f";ctx.font="bold "+Math.max(10,11*sc)+"px system-ui";ctx.textAlign="center";
  ctx.fillText(o.label||"GAS",s.x+sw*0.5,s.y-h+sd+14*sc);ctx.textAlign="left";
}
function drawLamp(o){
  var s=toScreen(o.x,o.y),sc=layout.scale,ys=CFG.YSCALE,sw=o.w*sc,sd=o.d*ys*sc,h=(o.h||36)*sc;
  var flick=0.72+0.28*Math.sin((game?game.time:0)*7+o.x*0.05);
  ctx.fillStyle="rgba(0,0,0,0.35)";fillEllipse(ctx,s.x+sw/2+2,s.y+sd+2,10*sc,5*sc);
  ctx.fillStyle="#263238";ctx.fillRect(s.x+sw*0.32,s.y+sd-h,sw*0.36,h);
  ctx.fillStyle="#90a4ae";ctx.fillRect(s.x+sw*0.28,s.y+sd-h-4*sc,sw*0.44,5*sc);
  ctx.fillStyle="rgba(255,240,160,"+flick+")";fillEllipse(ctx,s.x+sw/2,s.y+sd-h,7*sc,6*sc);
  ctx.fillStyle="rgba(255,255,230,"+(0.5*flick)+")";fillEllipse(ctx,s.x+sw/2,s.y+sd-h,3*sc,2.4*sc);
}
function drawBench(o){
  var s=toScreen(o.x,o.y),sc=layout.scale,ys=CFG.YSCALE,sw=o.w*sc,sd=Math.max(6,o.d*ys*sc),h=8*sc;
  ctx.fillStyle="rgba(0,0,0,0.28)";fillEllipse(ctx,s.x+sw/2,s.y+sd+2,sw*0.5,sd*0.45);
  ctx.fillStyle="#5d4030";roundRect(ctx,s.x+sw*0.08,s.y+sd-h+4,5,h,1.5);ctx.fill();roundRect(ctx,s.x+sw*0.82,s.y+sd-h+4,5,h,1.5);ctx.fill();
  ctx.fillStyle=lg(ctx,s.x,s.y-h,s.x,s.y+sd,"#c49a6c","#8d6e4a");
  roundRect(ctx,s.x,s.y-h,sw,sd+3,4);ctx.fill();
  ctx.strokeStyle="#1a140c";ctx.lineWidth=2;roundRect(ctx,s.x,s.y-h,sw,sd+3,4);ctx.stroke();
  ctx.strokeStyle="rgba(80,40,10,0.35)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(s.x+6,s.y-h+sd*0.5);ctx.lineTo(s.x+sw-6,s.y-h+sd*0.5);ctx.stroke();
}
function drawProp(o,ghost){
  if(o.dead)return;
  if(o.k==="tree")drawTree(o);
  else if(o.k==="bench")drawBench(o);
  else if(o.k==="bush")drawBush(o,ghost);
  else if(o.k==="car")drawCar(o);
  else if(o.k==="barrel")drawBarrel(o);
  else if(o.k==="pump")drawPump(o);
  else if(o.k==="fountain")drawFountain(o);
  else if(o.k==="sign")drawSign(o);
  else if(o.k==="lamp")drawLamp(o);
  else if(o.k==="roadsign"){
    var s=toScreen(o.x,o.y),sc=layout.scale,sd=o.d*CFG.YSCALE*sc,h=(o.h||28)*sc,sw=o.w*sc;
    ctx.fillStyle="#37474f";ctx.fillRect(s.x+sw*0.35,s.y+sd-h,sw*0.3,h);
    ctx.fillStyle="#1565c0";roundRect(ctx,s.x-4,s.y-h+sd,sw+8,14,2);ctx.fill();
    ctx.fillStyle="#fff";ctx.fillRect(s.x+sw*0.2,s.y-h+sd+5,sw*0.6,3);
  }else if(o.k==="canopy"){
    var s=toScreen(o.x,o.y),sc=layout.scale,ys=CFG.YSCALE,sw=o.w*sc,sd=o.d*ys*sc,h=50*sc;
    ctx.fillStyle="#6d4c41";
    ctx.fillRect(s.x+6,s.y+sd-h,6,h);ctx.fillRect(s.x+sw-12,s.y+sd-h,6,h);
    drawBox3D({x:o.x,y:o.y,w:o.w,d:o.d,h:14,top:o.top||"#e53935",side:o.side||"#8e1212",tex:"metal"});
   }else drawXtra(o);
}



function drawXtra(o){
  var s=toScreen(o.x,o.y),sc=layout.scale,ys=CFG.YSCALE,sw=o.w*sc,sd=o.d*ys*sc,h=(o.h||20)*sc,k=o.k,t=game?game.time:0,cx=s.x+sw/2;
  if(k==="dump"){drawBox3D({x:o.x,y:o.y,w:o.w,d:o.d,h:o.h||26,top:o.top||"#2e7d32",side:o.side||"#1b5e20",tex:"metal"});ctx.fillStyle="#1b5e20";roundRect(ctx,s.x-2,s.y-h-3,sw+4,6,2);ctx.fill();}
  else if(k==="bag"){ctx.fillStyle="rgba(0,0,0,0.25)";fillEllipse(ctx,cx,s.y+sd,sw*0.5,sd*0.4);ctx.fillStyle=o.top||"#37474f";fillEllipse(ctx,cx,s.y+sd*0.3-4,sw*0.48,sd*0.55);ctx.fillStyle="#1a1a1a";fillEllipse(ctx,cx,s.y+sd*0.05-8,sw*0.12,sd*0.18);}
  else if(k==="cone"){ctx.fillStyle="rgba(0,0,0,0.25)";fillEllipse(ctx,cx,s.y+sd,sw*0.5,sd*0.35);ctx.fillStyle="#ef6c00";ctx.beginPath();ctx.moveTo(cx,s.y-h);ctx.lineTo(s.x+sw,s.y+sd);ctx.lineTo(s.x,s.y+sd);ctx.closePath();ctx.fill();ctx.strokeStyle="#1a140c";ctx.lineWidth=1.4;ctx.stroke();ctx.fillStyle="#fafafa";ctx.fillRect(s.x+sw*0.25,s.y-h*0.4,sw*0.5,5);}
  else if(k==="bar"){drawBox3D({x:o.x,y:o.y,w:o.w,d:o.d,h:o.h||14,top:"#ef6c00",side:"#e65100"});ctx.fillStyle="#fafafa";var i;for(i=0;i<4;i++)ctx.fillRect(s.x+i*sw/4,s.y-h+sd*0.2,sw/8,h*0.6);}
  else if(k==="stand"){drawBox3D({x:o.x,y:o.y,w:o.w,d:o.d,h:o.h||22,top:"#c62828",side:"#7f1515",tex:"metal"});ctx.fillStyle="#eceff1";ctx.fillRect(s.x+3,s.y-h+4,sw-6,8);}
  else if(k==="booth"){drawBox3D({x:o.x,y:o.y,w:o.w,d:o.d,h:o.h||42,top:"#1565c0",side:"#0d47a1",tex:"metal"});ctx.fillStyle="rgba(180,220,255,0.45)";roundRect(ctx,s.x+3,s.y-h+6,sw-6,h*0.55,2);ctx.fill();}
  else if(k==="bus"){ctx.fillStyle="#546e7a";ctx.fillRect(s.x+4,s.y+sd-h,5,h);ctx.fillRect(s.x+sw-9,s.y+sd-h,5,h);drawBox3D({x:o.x,y:o.y,w:o.w,d:o.d,h:10,top:"#1565c0",side:"#0d47a1",tex:"metal"});ctx.fillStyle="#ffe082";ctx.font="bold 8px system-ui";ctx.fillText("BUS",s.x+6,s.y-8);}
  else if(k==="vend"){drawBox3D({x:o.x,y:o.y,w:o.w,d:o.d,h:o.h||36,top:"#1565c0",side:"#0d47a1",tex:"metal"});ctx.fillStyle="#212121";roundRect(ctx,s.x+4,s.y-h+6,sw-8,h*0.5,2);ctx.fill();ctx.fillStyle="#e53935";ctx.fillRect(s.x+6,s.y-h+h*0.62,sw-12,5);}
  else if(k==="pic"){drawBench(o);ctx.fillStyle="#8d6e4a";roundRect(ctx,s.x-6,s.y-h-6,sw+12,6,2);ctx.fill();}
  else if(k==="slide"){var gy=s.y+sd;ctx.fillStyle="#90a4ae";ctx.fillRect(s.x,gy-h,7,h);ctx.fillRect(s.x+10,gy-h,7,h);ctx.strokeStyle="#cfd8dc";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x,gy-h*0.65);ctx.lineTo(s.x+17,gy-h*0.65);ctx.moveTo(s.x,gy-h*0.35);ctx.lineTo(s.x+17,gy-h*0.35);ctx.stroke();ctx.fillStyle="#e53935";ctx.beginPath();ctx.moveTo(s.x+16,gy-h);ctx.lineTo(s.x+sw,gy-4);ctx.lineTo(s.x+sw-8,gy);ctx.lineTo(s.x+10,gy-h+10);ctx.closePath();ctx.fill();ctx.strokeStyle="#1a140c";ctx.lineWidth=1.6;ctx.stroke();}
  else if(k==="swing"){ctx.fillStyle="#5d4037";ctx.fillRect(s.x,s.y+sd-h,4,h);ctx.fillRect(s.x+sw-4,s.y+sd-h,4,h);ctx.fillRect(s.x,s.y-h,sw,4);ctx.strokeStyle="#212121";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(s.x+sw*0.3,s.y-h);ctx.lineTo(s.x+sw*0.3,s.y-h*0.3);ctx.moveTo(s.x+sw*0.7,s.y-h);ctx.lineTo(s.x+sw*0.7,s.y-h*0.3);ctx.stroke();ctx.fillStyle="#8d6e4a";roundRect(ctx,s.x+sw*0.22,s.y-h*0.3,sw*0.56,5,2);ctx.fill();}
  else if(k==="tank"){var o2={x:o.x,y:o.y,w:o.w,d:o.d,h:o.h||36,top:o.top||"#78909c",side:o.side||"#455a64"};drawBarrel(o2);ctx.fillStyle="#e53935";ctx.fillRect(s.x+sw*0.3,s.y-h-4,sw*0.4,5);}
  else if(k==="wash"){ctx.fillStyle="#90a4ae";ctx.fillRect(s.x,s.y+sd-h,6,h);ctx.fillRect(s.x+sw-6,s.y+sd-h,6,h);ctx.fillStyle="#42a5f5";ctx.globalAlpha=0.35;ctx.fillRect(s.x+6,s.y-h+4,sw-12,h-8);ctx.globalAlpha=1;ctx.fillStyle="#eceff1";ctx.fillRect(s.x,s.y-h,sw,6);}
  else if(k==="scaf"){ctx.strokeStyle="#ffb300";ctx.lineWidth=2;ctx.strokeRect(s.x,s.y-h,sw,h+sd);ctx.beginPath();ctx.moveTo(s.x,s.y-h);ctx.lineTo(s.x+sw,s.y+sd);ctx.moveTo(s.x+sw,s.y-h);ctx.lineTo(s.x,s.y+sd);ctx.stroke();ctx.fillStyle="#ffe082";ctx.fillRect(s.x,s.y-h*0.5,sw,3);}
  else if(k==="cart"){ctx.strokeStyle="#90a4ae";ctx.lineWidth=1.8;roundRect(ctx,s.x,s.y-h+4,sw,h,2);ctx.stroke();ctx.fillStyle="#1a1a1a";fillEllipse(ctx,s.x+4,s.y+sd,3,2.2);fillEllipse(ctx,s.x+sw-4,s.y+sd,3,2.2);}
  else drawBox3D(o);
}
/* ===== ground chunks ===== */
function chunkKey(cx,cy){return cx+","+cy;}
function ensureChunk(cx,cy){
  var k=chunkKey(cx,cy);if(map.chunks[k]&&!map.chunks[k].dirty)return map.chunks[k];
  var S=map.chunkS,mul=(typeof GFX!=="undefined"&&GFX.chunkMul)||2;
  var c=document.createElement("canvas");c.width=(S*mul)|0;c.height=(S*CFG.YSCALE*mul)|0;
  var g=c.getContext("2d");g.imageSmoothingEnabled=1;g.imageSmoothingQuality="high";g.setTransform(mul,0,0,mul,0,0);
  var x0=cx*S,y0=cy*S,i,z;
  g.fillStyle="#1e3a1c";g.fillRect(0,0,S,S*CFG.YSCALE);
  for(i=0;i<map.zones.length;i++){
    z=map.zones[i];
    var rx=z.x-x0,ry=(z.y-y0)*CFG.YSCALE,rw=z.w,rd=z.h*CFG.YSCALE;
    if(rx+rw<0||ry+rd<0||rx>S||ry>S*CFG.YSCALE)continue;
    if(typeof gfxFillZone==="function")gfxFillZone(g,z,x0,y0);
    else{g.fillStyle=z.floor;g.fillRect(rx,ry,rw,rd);}
    paintFloor(g,z,x0,y0);
  }
  if(typeof gfxZoneEdges==="function")gfxZoneEdges(g,x0,y0,S);
  paintDecals(g,x0,y0,S);
  map.chunks[k]={c:c,dirty:0,cx:cx,cy:cy};return map.chunks[k];
}
function paintDecals(g,x0,y0,S){
  var d=map.decals||[],i,o,ys=CFG.YSCALE;
  for(i=0;i<d.length;i++){
    o=d[i];
    if(o.x+o.w<x0||o.x>x0+S||o.y+o.d<y0||o.y>y0+S)continue;
    var x=o.x-x0,y=(o.y-y0)*ys,w=o.w,h=o.d*ys;
    if(o.k==="path"){g.fillStyle="rgba(210,190,90,0.28)";g.fillRect(x,y,w,h);}
    else if(o.k==="crosswalk"){
      g.fillStyle="rgba(250,250,250,0.8)";var s;
      for(s=0;s<o.d;s+=14)g.fillRect(x,y+s*ys,w,5*ys);
    }else if(o.k==="puddle"){
      g.fillStyle="rgba(40,70,100,0.45)";g.beginPath();g.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,7);g.fill();
      g.fillStyle="rgba(255,180,80,0.12)";g.beginPath();g.ellipse(x+w/2,y+h*0.35,w*0.28,h*0.18,0,0,7);g.fill();
      g.strokeStyle="rgba(200,220,240,0.4)";g.lineWidth=1.4;g.stroke();
    }else if(o.k==="leaves"){
      var rng=seeded((o.x*9+o.y)|0),j;
      for(j=0;j<12;j++){g.fillStyle=rng()<0.5?"#ef6c00":"#2e7d32";g.globalAlpha=0.7;g.beginPath();g.ellipse(x+rng()*w,y+rng()*h,3+rng()*3,2,rng()*3,0,7);g.fill();}
      g.globalAlpha=1;
    }else if(o.k==="manhole"){
      g.fillStyle="#37474f";g.beginPath();g.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,7);g.fill();
      g.strokeStyle="#90a4ae";g.lineWidth=2;g.stroke();
    }else if(o.k==="graf"){
      g.fillStyle=o.col||"#8e24aa";g.globalAlpha=0.55;g.font="bold 11px system-ui";g.fillText("BZ",x+2,y+12);g.globalAlpha=1;
    }
  }
}
function paintFloor(g,z,x0,y0){
  var rng=seeded((z.x*13+z.y*97+z.k.length*11)|0),i,ys=CFG.YSCALE,x,y;
  if(z.k==="grass"){
    for(i=0;i<28;i++){g.fillStyle=rng()<0.5?"#1b5e20":"#558b2f";g.globalAlpha=0.18;g.beginPath();g.ellipse(z.x+rng()*z.w-x0,(z.y+rng()*z.h-y0)*ys,8+rng()*14,4+rng()*8,0,0,7);g.fill();g.globalAlpha=1;}
    for(i=0;i<40;i++){x=z.x+rng()*z.w-x0;y=(z.y+rng()*z.h-y0)*ys;g.fillStyle="#2e7d32";g.beginPath();g.moveTo(x,y);g.lineTo(x-2,y-5);g.lineTo(x+2,y-4);g.fill();if(rng()<0.2){g.fillStyle=rng()<0.5?"#fff59d":"#f8bbd0";g.beginPath();g.arc(x,y-5,1.6,0,7);g.fill();}}
  }else if(z.k==="asphalt"){
    g.fillStyle="rgba(255,230,80,0.85)";
    for(x=z.x+80;x<z.x+z.w-40;x+=200){for(y=z.y+24;y<z.y+z.h-24;y+=46)g.fillRect(x-x0,(y-y0)*ys,5,11*ys);}
  }else if(z.k==="parking"){
    g.strokeStyle="rgba(250,250,250,0.7)";g.lineWidth=2;
    function stalls(x0s,y0s,rows){var r,c;for(r=0;r<rows;r++){for(c=0;c<2;c++){var x=x0s+c*90,y=y0s+r*90;g.strokeRect(x-x0,(y-y0)*ys,80,36*ys);}}}
    stalls(1210,1220,2);stalls(1670,1220,2);stalls(1210,1650,2);stalls(1670,1650,2);
  }else if(z.k==="plaza"){
    g.fillStyle="rgba(255,200,40,0.35)";g.fillRect(z.x+160-x0,(z.y+180-y0)*ys,300,6);
  }else if(z.k==="ruins"){
    for(i=0;i<36;i++){g.fillStyle="rgba(80,50,30,0.28)";g.fillRect(z.x+rng()*z.w-x0,(z.y+rng()*z.h-y0)*ys,7+rng()*18,5+rng()*12);}
    g.fillStyle="rgba(0,0,0,0.14)";
    for(i=0;i<12;i++){g.beginPath();g.ellipse(z.x+rng()*z.w-x0,(z.y+rng()*z.h-y0)*ys,12+rng()*16,6+rng()*8,0,0,7);g.fill();}
  }
}
function drawGround(){
  var S=map.chunkS,hw=worldW()*0.5+S,hh=worldH()*0.5+S;
  var c0=Math.floor((game.camX-hw)/S),c1=Math.floor((game.camX+hw)/S);
  var r0=Math.floor((game.camY-hh)/S),r1=Math.floor((game.camY+hh)/S);
  var cx,cy;
  for(cy=r0;cy<=r1;cy++)for(cx=c0;cx<=c1;cx++){
    if(cx<0||cy<0||cx*S>CFG.MAP_W||cy*S>CFG.MAP_H)continue;
    var ch=ensureChunk(cx,cy),s=toScreen(cx*S,cy*S);
    ctx.imageSmoothingEnabled=1;
    ctx.drawImage(ch.c,s.x,s.y,S*layout.scale,S*CFG.YSCALE*layout.scale);
  }
}

/* ===== character sprite cache ===== */
var SPR_W=120,SPR_H=156,sprCache={},sprTick=0,SPR_MAX=140;
function angDir(a){return((Math.round(((a||0)+Math.PI*2)%(Math.PI*2)/(Math.PI/4)))&7);}
function sprKind(look){return look.kind==="player"?"pl"+(look.hero||"c"):look.kind==="colossus"?"co":look.kind==="home"?"hm":(look.type||look.kind||"n");}
function getCharSpr(look,dir,fr,opts){
  var mul=(typeof GFX!=="undefined"&&GFX.sprMul)||2, pose=(opts&&opts.pose)||"w", face=(opts&&opts.face)||"i";
  var key=sprKind(look)+"_"+dir+"_"+((fr|0)&7)+"_"+(opts&&opts.air?1:0)+"_"+(opts&&opts.noArm?1:0)+"_"+pose+"_"+face+"_"+mul;
  var e=sprCache[key];if(e){e.t=++sprTick;return e;}
  var keys=Object.keys(sprCache),max=typeof GFX!=="undefined"&&GFX.q===0?64:SPR_MAX;
  if(keys.length>=max){var i,old=keys[0],ot=sprCache[old].t;for(i=1;i<keys.length;i++)if(sprCache[keys[i]].t<ot){old=keys[i];ot=sprCache[old].t;}delete sprCache[old];}
  var cv=document.createElement("canvas");cv.width=SPR_W*mul;cv.height=SPR_H*mul;
  var c=cv.getContext("2d");c.scale(mul,mul);c.lineJoin="round";c.lineCap="round";
  c.imageSmoothingEnabled=1;c.imageSmoothingQuality="high";
  c.translate(SPR_W/2,SPR_H-16);
  paintCharBS(c,look,dir,fr,opts);
  e={c:cv,t:++sprTick};sprCache[key]=e;return e;
}

/* local space: feet at (0,0), Y up is negative, char ~110px tall */
function paintCharBS(c,look,dir,fr,opts){
  var typ=look.type||(look.kind==="player"?"player":look.kind==="colossus"?"colossus":look.kind==="home"?"home":"normal");
  var toward=dir===1||dir===2||dir===3,away=dir===5||dir===6||dir===7,side=dir===0||dir===4;
  var fl=(dir<=1||dir===7)?1:(dir>=3&&dir<=5)?-1:0;
  if(fl===0)fl=toward?1:1;
  var pose=(opts&&opts.pose)||(((opts&&opts.moving)!==0)?"walk":"idle");
  var ph=((fr||0)/8)*Math.PI*2, bob, swg;
  if(opts&&opts.air){bob=-12;swg=0;}
  else if(pose==="idle"){bob=Math.sin(ph)*1.6;swg=Math.sin(ph)*1.5;}
  else if(pose==="walk"){bob=-Math.abs(Math.sin(ph))*2.8;swg=Math.sin(ph)*11;}
  else if(pose==="hurt"){bob=3;swg=2;}
  else if(pose==="die"){bob=5+(fr||0);swg=0;}
  else if(pose==="spawn"){bob=18*(1-(opts.spawnP||0));swg=3;}
  else {bob=-1;swg=3;}
  var isCo=look.kind==="colossus",isBoss=typ==="boss"&&!isCo,isTank=typ==="tank",isFast=typ==="fast",isExp=typ==="exploder";
  var isCraw=typ==="crawler",isSpit=typ==="spitter",isArm=typ==="armored",isScr=typ==="screamer",isMini=typ==="mini";
  var isJump=typ==="jumper",isSplit=typ==="splitter";
  var isHome=look.kind==="home";
  var sc=(isHome)?1.28:(isCo||isBoss)?1.18:isTank||isArm||look.bulk?1.12:isMini||isCraw?0.72:isFast?0.92:1;
  c.save();c.translate(0,-bob);var sq=pose==="walk"?1+Math.sin(ph*2)*0.04:1;c.scale(sc/sq,sc*sq);
  var skin=look.skin||"#8a9a6b",skL=look.skinLight||shadeHex(skin,28),skD=look.skinShadow||shadeHex(skin,-28);
  var shirt=look.hoodie||look.shirt||"#1565c0",shL=look.hoodieLight||look.shirtDark?shadeHex(shirt,30):shadeHex(shirt,30),shD=look.hoodieDark||look.shirtDark||shadeHex(shirt,-30);
  var pants=look.pants||"#1a237e",pnD=look.pantsDark||shadeHex(pants,-20);
  var shoe=look.shoe||"#1a1a1a",out="#1a140c",lw=2.6;
  if(isExp){shirt="#5d4037";shL="#6d4c41";shD="#3e2723";}
  if(isCo){shirt=look.shirt||"#141414";shL="#2a2a2a";shD="#000";pants=look.pants||"#1e1814";shoe="#f2f2f0";}

  /* proportions */
  var bodyW=look.bulk?40:isHome?28:isTank||isCo||isBoss?34:isFast||isMini?22:isExp?38:isCraw?36:28;
  var bodyD=isExp?22:isCraw?12:16, bodyH=look.bulk?18:isHome?20:isCraw?10:isExp?20:16;
  var headR=isTank?16:isCo||isBoss?20:isHome?18:isCraw||isMini?13:isScr?19:18;
  var armC=look.bulk?skin:shirt,armCD=look.bulk?skD:shD,armT=look.bulk?9:6.5;
  var torsoY=isCraw?-16:isHome?-32:-28, headY=torsoY-bodyH-headR*0.55-(isSpit?4:0);
  if(isCraw)headY=-22;

  function limb(x1,y1,x2,y2,th,col,colD){
    c.save();
    var dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy)||1,ang=Math.atan2(dy,dx);
    c.translate(x1,y1);c.rotate(ang);
    c.fillStyle=lg(c,0,-th,0,th,shadeHex(col,20),colD||col);
    roundRect(c,0,-th/2,len,th,th/2);c.fill();
    c.strokeStyle=out;c.lineWidth=lw;roundRect(c,0,-th/2,len,th,th/2);c.stroke();
    c.restore();
  }
  function foot(x,y,col){
    ellP(c,x+fl*2,y,isCo?8:6,3.4);fs(c,col,out,lw);
    if(isCo||look.kind==="player"){c.fillStyle="rgba(255,255,255,0.35)";ellP(c,x+fl*2,y-1,3,1.2);c.fill();}
  }
  function hand(x,y){ellP(c,x,y,5,4.4);fs(c,lg(c,x-3,y-3,x+3,y+3,skL,skD),out,lw);}

  /* legs */
  if(!isCraw){
    var lx=-7,rx=7,fy=0,hy=torsoY+4;
    if(!toward){limb(lx,hy,lx-swg*0.4,fy,8,pants,pnD);foot(lx-swg*0.4,fy,shoe);limb(rx,hy,rx+swg*0.4,fy,8,pants,pnD);foot(rx+swg*0.4,fy,shoe);}
  }else{
    limb(-16, -6, -22+swg*0.3, 2, 7, pants, pnD);limb(16,-6,22-swg*0.3,2,7,pants,pnD);
    foot(-22,3,shoe);foot(22,3,shoe);
  }

  var armY=torsoY-2, farX=-fl*(bodyW*0.48), nearX=fl*(bodyW*0.48);
  var aimA=dir*Math.PI/4, hx=Math.cos(aimA)*16, hy2=armY+Math.sin(aimA)*6-4;
  if(!(opts&&opts.noArm)){if(away||!toward){limb(farX,armY,farX-fl*6+swg*0.15,armY+12,armT,armC,armCD);hand(farX-fl*6,armY+12);}}

  /* torso */
  if(isCo){
    /* black tee */
    ellP(c,0,torsoY-2,bodyW*0.28,bodyH*0.7);fs(c,"#1a1a1a",0,0);
    c.fillStyle="#111";roundRect(c,-bodyW*0.22,torsoY-2,bodyW*0.44,bodyH+6,6);c.fill();
    /* jacket flaps */
    var jw=look.jacket||"#f5f5f3",jd=look.jacketDark||"#c8c8c4";
    c.fillStyle=lg(c,-bodyW,torsoY-bodyH,0,torsoY+bodyH,shadeHex(jw,20),jd);
    c.beginPath();c.moveTo(-bodyW*0.52,torsoY-bodyH);c.quadraticCurveTo(-bodyW*0.58,torsoY, -bodyW*0.42,torsoY+bodyH+4);c.lineTo(-bodyW*0.08,torsoY+bodyH);c.lineTo(-bodyW*0.12,torsoY-bodyH+2);c.closePath();c.fill();c.strokeStyle=out;c.lineWidth=lw;c.stroke();
    c.fillStyle=lg(c,0,torsoY-bodyH,bodyW,torsoY+bodyH,shadeHex(jw,20),jd);
    c.beginPath();c.moveTo(bodyW*0.52,torsoY-bodyH);c.quadraticCurveTo(bodyW*0.58,torsoY, bodyW*0.42,torsoY+bodyH+4);c.lineTo(bodyW*0.08,torsoY+bodyH);c.lineTo(bodyW*0.12,torsoY-bodyH+2);c.closePath();c.fill();c.stroke();
  }else if(isExp){
    ellP(c,0,torsoY+2,bodyW*0.58,bodyH*1.15);fs(c,rg(c,-6,torsoY-8,4,bodyW*0.6,shadeHex(shirt,20),shirt),out,lw);
    ellP(c,0,torsoY+4,bodyW*0.32,bodyH*0.55);fs(c,rg(c,0,torsoY,2,bodyW*0.3,"#ffcc80","#e65100"),0,0);
  }else{
    var tw=bodyW,th=bodyH+8;
    c.fillStyle=lg(c,-tw,torsoY-th,tw,torsoY+th,shL,shD);
    roundRect(c,-tw/2,torsoY-th*0.35,tw,th,10);c.fill();
    c.strokeStyle=out;c.lineWidth=lw;roundRect(c,-tw/2,torsoY-th*0.35,tw,th,10);c.stroke();
    c.strokeStyle="rgba(255,255,255,0.28)";c.lineWidth=1.4;c.beginPath();c.moveTo(-tw/2+6,torsoY-th*0.35+3);c.lineTo(tw/2-8,torsoY-th*0.35+3);c.stroke();
    if(isTank||isBoss||look.bulk){ /* shoulders */
      ellP(c,-tw*0.48,torsoY-2,8,6.5);fs(c,shD,out,lw);ellP(c,tw*0.48,torsoY-2,8,6.5);fs(c,shD,out,lw);
    }
    if(isHome){c.fillStyle="#ffd54f";c.beginPath();c.moveTo(0,torsoY-7);c.lineTo(6,torsoY-1);c.lineTo(0,torsoY+8);c.lineTo(-6,torsoY-1);c.closePath();c.fill();c.strokeStyle="#f9a825";c.lineWidth=1.3;c.stroke();c.fillStyle="#fff8e1";c.beginPath();c.moveTo(0,torsoY-3);c.lineTo(2.2,torsoY+1);c.lineTo(0,torsoY+4);c.lineTo(-2.2,torsoY+1);c.closePath();c.fill();}
  }
  if(toward&&!isCraw){limb(lx=-7,torsoY+4,lx-swg*0.4,0,8,pants,pnD);foot(lx-swg*0.4,0,shoe);limb(rx=7,torsoY+4,rx+swg*0.4,0,8,pants,pnD);foot(rx+swg*0.4,0,shoe);}

  if(!(opts&&opts.noArm)){
    if(toward||side){limb(nearX,armY,hx,hy2,armT+1,armC,armCD);hand(hx,hy2);}
    else {limb(nearX,armY,nearX+fl*5,armY+11,armT,armC,armCD);hand(nearX+fl*5,armY+11);}
    if(toward){limb(farX,armY,farX-fl*6,armY+11,armT,armC,armCD);hand(farX-fl*6,armY+11);}
  }

  /* head */
  var hx0=fl*2, hy0=headY;
  ellP(c,hx0,hy0,headR*0.92,headR);
  fs(c,rg(c,hx0-headR*0.3,hy0-headR*0.4,3,headR*1.05,skL,skD),out,lw+0.2);
  /* ears if side */
  if(side){ellP(c,hx0-fl*headR*0.85,hy0,4.2,5.2);fs(c,skD,out,lw);}

  /* hair / hats */
  if(isCo){
    c.fillStyle=look.hair||"#2a1c14";
    ellP(c,hx0,hy0-headR*0.72,headR*0.9,headR*0.5);c.fill();
    var ci;for(ci=0;ci<8;ci++){ellP(c,hx0+Math.cos(ci*0.85)*headR*0.62,hy0-headR*0.7+Math.sin(ci*1.3)*headR*0.18,headR*0.3,headR*0.26);fs(c,look.hair||"#2a1c14",out,1.6);}
  }else if(look.kind==="player"||look.kind==="home"){
    if(look.bald){c.fillStyle="rgba(255,255,255,0.16)";ellP(c,hx0-headR*0.18,hy0-headR*0.48,headR*0.28,headR*0.12);c.fill();}
    else if(look.curl){
      var hc=look.hair||"#1a120c";
      c.fillStyle=hc;ellP(c,hx0,hy0-headR*0.55,headR*0.82,headR*0.36);c.fill();
      var ci;for(ci=0;ci<7;ci++){ellP(c,hx0+Math.cos(ci*0.9)*headR*0.52,hy0-headR*0.76+Math.sin(ci*1.2)*headR*0.12,headR*0.2,headR*0.18);fs(c,hc,out,1.2);}
      c.fillStyle="#5c6bc0";
      for(ci=0;ci<3;ci++){ellP(c,hx0+Math.cos(ci*2.1+0.4)*headR*0.4,hy0-headR*0.88+Math.sin(ci)*headR*0.08,headR*0.12,headR*0.1);c.fill();}
    }else if(look.quiff){
      var qc=look.hair||"#2a2a2a";
      c.fillStyle=qc;ellP(c,hx0,hy0-headR*0.36,headR*0.9,headR*0.48);fs(c,qc,out,lw);
      if(look.kind==="home"){
        c.beginPath();c.moveTo(hx0-headR*0.22,hy0-headR*0.32);c.quadraticCurveTo(hx0+fl*headR*0.05,hy0-headR*1.15,hx0+fl*headR*0.7,hy0-headR*0.5);c.quadraticCurveTo(hx0+fl*headR*0.25,hy0-headR*0.7,hx0+headR*0.1,hy0-headR*0.32);c.closePath();fs(c,qc,out,1.5);
        c.fillStyle="rgba(255,248,200,0.35)";ellP(c,hx0+fl*headR*0.15,hy0-headR*0.7,headR*0.16,headR*0.1);c.fill();
      }else{
        c.beginPath();c.moveTo(hx0-headR*0.3,hy0-headR*0.32);c.quadraticCurveTo(hx0-headR*0.15,hy0-headR*1.62,hx0+fl*headR*0.28,hy0-headR*1.48);c.quadraticCurveTo(hx0+fl*headR*0.62,hy0-headR*0.85,hx0+headR*0.22,hy0-headR*0.32);c.closePath();fs(c,qc,out,1.7);
        c.fillStyle="rgba(220,220,230,0.45)";ellP(c,hx0-headR*0.04,hy0-headR*1.12,headR*0.12,headR*0.22);c.fill();
        c.strokeStyle="rgba(255,255,255,0.4)";c.lineWidth=1.4;c.beginPath();c.moveTo(hx0-headR*0.08,hy0-headR*0.5);c.quadraticCurveTo(hx0,hy0-headR*1.35,hx0+fl*headR*0.22,hy0-headR*1.28);c.stroke();
      }
    }else{
      c.fillStyle=look.hair||"#2c1810";ellP(c,hx0,hy0-headR*0.4,headR*0.88,headR*0.5);c.fill();
      c.fillStyle=look.cap||"#8b1a1a";
      ellP(c,hx0,hy0-headR*0.52,headR*0.98,headR*0.5);fs(c,look.cap||"#8b1a1a",out,lw);
      c.fillStyle=look.capBrim||"#5c1010";
      if(away){roundRect(c,hx0-headR*0.55,hy0-headR*0.22,headR*1.1,headR*0.22,3);c.fill();c.strokeStyle=out;c.stroke();}
      else {var bx=hx0+(fl>0?headR*0.15:-headR*1.05);roundRect(c,bx,hy0-headR*0.18,headR*0.95,headR*0.24,4);c.fill();c.strokeStyle=out;c.lineWidth=lw;c.stroke();}
    }
  }else if(isArm){
    c.fillStyle="#607d8b";ellP(c,hx0,hy0-headR*0.15,headR*1.0,headR*0.9);fs(c,lg(c,hx0,hy0-headR,hx0,hy0+headR,"#90a4ae","#455a64"),out,lw);
    c.fillStyle="#37474f";c.fillRect(hx0-headR*0.7,hy0-2,headR*1.4,4);
  }else if(!look.bald){
    c.fillStyle=look.hair||"#212121";ellP(c,hx0,hy0-headR*0.5,headR*0.9,headR*0.5);fs(c,look.hair||"#212121",out,lw);
  }
  if(isCo||look.beard){
    var bc=look.beardCol||look.hair||"#2a1c14";c.fillStyle=bc;
    if(!away){
      ellP(c,hx0-headR*0.48,hy0+headR*0.4,headR*0.22,headR*0.26);c.fill();
      ellP(c,hx0+headR*0.48,hy0+headR*0.4,headR*0.22,headR*0.26);c.fill();
      ellP(c,hx0,hy0+headR*0.7,headR*0.48,headR*0.22);c.fill();
      if(look.curl){var bi;for(bi=0;bi<5;bi++){ellP(c,hx0+(bi-2)*headR*0.16,hy0+headR*0.7+(bi%2?1.5:-1),headR*0.15,headR*0.13);fs(c,bc,out,1.1);}}
    }else {ellP(c,hx0,hy0+headR*0.4,headR*0.5,headR*0.22);c.fill();}
  }else if(look.goatee&&!away){
    c.fillStyle=look.hair||"#2a2a2a";
    ellP(c,hx0,hy0+headR*0.7,headR*0.24,headR*0.3);c.fill();
    ellP(c,hx0,hy0+headR*0.36,headR*0.2,headR*0.1);c.fill();
    c.strokeStyle=out;c.lineWidth=1.2;c.beginPath();c.ellipse(hx0,hy0+headR*0.7,headR*0.24,headR*0.3,0,0,7);c.stroke();
    c.fillStyle="rgba(255,255,255,0.18)";ellP(c,hx0-1,hy0+headR*0.62,headR*0.08,headR*0.1);c.fill();
  }
  /* face */
  if(!away){
    var ex=fl*2.2, ey=hy0-headR*0.02;
    if(look.kind==="player"||look.kind==="home"){
      ellP(c,hx0-headR*0.32+ex*0.2,ey,headR*0.2,headR*0.17);fs(c,"#f5f0e8",out,1.3);
      ellP(c,hx0+headR*0.3+ex*0.2,ey,headR*0.2,headR*0.17);fs(c,"#f5f0e8",out,1.3);
      c.fillStyle=look.eye||"#2e4a3e";
      ellP(c,hx0-headR*0.26+ex,ey+0.4,headR*0.1,headR*0.12);c.fill();
      ellP(c,hx0+headR*0.36+ex,ey+0.4,headR*0.1,headR*0.12);c.fill();
      c.fillStyle="#fff";ellP(c,hx0-headR*0.28+ex,ey-1,2,1.6);c.fill();ellP(c,hx0+headR*0.34+ex,ey-1,2,1.6);c.fill();
      c.strokeStyle=look.brow||"#1a1008";c.lineWidth=2;
      c.beginPath();c.moveTo(hx0-headR*0.5,ey-headR*0.28);c.lineTo(hx0-headR*0.12,ey-headR*0.22);c.stroke();
      c.beginPath();c.moveTo(hx0+headR*0.12,ey-headR*0.22);c.lineTo(hx0+headR*0.5,ey-headR*0.28);c.stroke();
      if(look.glowEye){
        ellP(c,hx0-headR*0.32+ex*0.2,ey,headR*0.2,headR*0.17);fs(c,"#fff",out,1.3);
        ellP(c,hx0+headR*0.3+ex*0.2,ey,headR*0.2,headR*0.17);fs(c,"#fff",out,1.3);
        c.fillStyle=look.eyeGlow||"#448aff";
        ellP(c,hx0-headR*0.26+ex,ey+0.3,headR*0.1,headR*0.12);c.fill();
        ellP(c,hx0+headR*0.36+ex,ey+0.3,headR*0.1,headR*0.12);c.fill();
        c.fillStyle="#0d47a1";ellP(c,hx0-headR*0.25+ex,ey+0.4,headR*0.045,headR*0.055);c.fill();ellP(c,hx0+headR*0.37+ex,ey+0.4,headR*0.045,headR*0.055);c.fill();
        c.fillStyle="#fff";ellP(c,hx0-headR*0.29+ex,ey-0.8,1.8,1.5);c.fill();ellP(c,hx0+headR*0.33+ex,ey-0.8,1.8,1.5);c.fill();
      }
      if(look.shades){
        c.fillStyle="#111";roundRect(c,hx0-headR*0.62,ey-headR*0.16,headR*1.24,headR*0.36,4);c.fill();
        c.strokeStyle="#eee";c.lineWidth=1.2;roundRect(c,hx0-headR*0.62,ey-headR*0.16,headR*1.24,headR*0.36,4);c.stroke();
        c.fillStyle="rgba(120,180,220,0.25)";roundRect(c,hx0-headR*0.58,ey-headR*0.1,headR*0.5,headR*0.22,3);c.fill();
      }
      if(look.stache){c.fillStyle="#1a1a1a";ellP(c,hx0-headR*0.18,hy0+headR*0.28,headR*0.22,headR*0.1);c.fill();ellP(c,hx0+headR*0.18,hy0+headR*0.28,headR*0.22,headR*0.1);c.fill();}
      c.strokeStyle="#a86b5a";c.lineWidth=1.6;c.beginPath();
      if(look.smug){c.arc(hx0+ex*0.45,hy0+headR*0.32,headR*0.22,-0.15,1.15);}else c.arc(hx0+ex*0.3,hy0+headR*0.38,headR*0.28,0.2,Math.PI-0.2);
      c.stroke();
      if(look.stubble){c.fillStyle="rgba(60,40,30,0.3)";ellP(c,hx0,hy0+headR*0.42,headR*0.42,headR*0.18);c.fill();}
    }else{
      var glow=look.eyeGlow||"#c62828";
      ellP(c,hx0-headR*0.3+ex*0.2,ey,headR*0.18,headR*0.14);fs(c,glow,out,1.2);
      ellP(c,hx0+headR*0.28+ex*0.2,ey,headR*0.18,headR*0.14);fs(c,glow,out,1.2);
      c.fillStyle="#fff";ellP(c,hx0-headR*0.32+ex,ey-1,2,1.5);c.fill();ellP(c,hx0+headR*0.26+ex,ey-1,2,1.5);c.fill();
      if(isScr||isSpit){c.fillStyle="#3e1a1a";ellP(c,hx0,hy0+headR*0.42,headR*0.42,headR*0.28);c.fill();c.fillStyle="#7a2020";ellP(c,hx0,hy0+headR*0.44,headR*0.28,headR*0.14);c.fill();}
      else if(isSplit){c.strokeStyle="#5d4037";c.lineWidth=1.5;c.beginPath();c.moveTo(hx0,hy0-headR*0.6);c.lineTo(hx0,hy0+headR*0.5);c.stroke();}
      else {c.strokeStyle=shadeHex(skin,-40);c.lineWidth=1.4;c.beginPath();c.arc(hx0,hy0+headR*0.38,headR*0.22,0.3,Math.PI-0.3);c.stroke();}
    }
  }
  /* wounds / blood + v18 detail */
  if(look.kind!=="player"&&!isCo&&look.blood!==0){
    c.fillStyle="rgba(120,20,20,0.45)";ellP(c,-bodyW*0.2,torsoY+4,4,3);c.fill();
  }
  if(look.kind!=="player"&&!isCo&&!isHome){
    var rng=seeded((look.type||"n").length*97+(skin.charCodeAt(1)||3)*13),bi;
    for(bi=0;bi<5;bi++){c.fillStyle="rgba(40,20,10,"+(0.25+rng()*0.3)+")";ellP(c,(rng()-0.5)*bodyW*0.7,torsoY+(rng()-0.4)*bodyH,2+rng()*3,1.6+rng()*2);c.fill();}
    if(!away){c.strokeStyle="rgba(80,20,20,0.45)";c.lineWidth=0.9;c.beginPath();c.moveTo(hx0-headR*0.2,hy0+headR*0.1);c.quadraticCurveTo(hx0,hy0+headR*0.35,hx0+headR*0.15,hy0+headR*0.5);c.stroke();}
    if(isTank||isArm){c.fillStyle="rgba(80,30,20,0.5)";ellP(c,bodyW*0.2,torsoY+2,5,3);c.fill();}
  }
  /* clothing seams / zipper / AO / rim */
  if(!isCraw){
    c.strokeStyle="rgba(0,0,0,0.22)";c.lineWidth=1;
    c.beginPath();c.moveTo(0,torsoY-bodyH*0.2);c.lineTo(0,torsoY+bodyH*0.55);c.stroke();
    c.fillStyle="rgba(255,255,255,0.14)";c.fillRect(-1,torsoY-bodyH*0.15,2,bodyH*0.5);
    if(look.kind==="player"){c.fillStyle=shD;roundRect(c,-bodyW*0.16,torsoY+2,bodyW*0.22,7,2);c.fill();c.strokeStyle="rgba(0,0,0,0.3)";c.lineWidth=0.8;c.stroke();}
  }
  /* under-chin AO */
  c.fillStyle="rgba(0,0,0,0.16)";ellP(c,fl*2,headY+headR*0.72,headR*0.55,headR*0.18);c.fill();
  /* rim light */
  c.strokeStyle="rgba(255,230,200,0.16)";c.lineWidth=1.4;
  c.beginPath();c.ellipse(fl*2-4,headY,headR*0.82,headR*0.92,0,-1.2,0.4);c.stroke();
  /* expression overrides */
  if(!away&&opts&&opts.face==="hurt"){
    c.strokeStyle="#6d2a22";c.lineWidth=2;c.beginPath();c.arc(hx0,hy0+headR*0.42,headR*0.2,3.5,6.1);c.stroke();
    c.fillStyle="rgba(180,40,40,0.25)";ellP(c,hx0,hy0+headR*0.2,headR*0.5,headR*0.28);c.fill();
  }else if(!away&&opts&&opts.face==="atk"){
    c.fillStyle="#3e1a1a";ellP(c,hx0,hy0+headR*0.42,headR*0.22,headR*0.16);c.fill();
  }
  c.restore();
}

function charScOf(look){var typ=look.type||look.kind;return look.kind==="home"?1.28:look.kind==="colossus"||typ==="boss"?1.18:typ==="tank"||typ==="armored"||look.bulk?1.12:typ==="mini"||typ==="crawler"?0.72:typ==="fast"?0.92:1;}
function sprPlace(wx,wy,look,ang,opts){
  opts=opts||{};
  var s=toScreen(wx,wy),sc=layout.scale,dir=angDir(ang||0);
  var hover=look.kind==="home"?14*sc:0,visH=(opts.h||38)*1.15;
  if(look.kind==="colossus")visH=52;else if(look.kind==="home")visH=58;else if(look.type==="boss")visH=50;else if(look.type==="tank"||look.type==="armored")visH=44;else if(look.type==="crawler"||look.type==="mini")visH=26;
  visH*=(opts.scale||1);
  var bs=visH*sc/110,rec=opts.muzzle?Math.min(4,opts.muzzle*40):0;
  var oy=s.y-(SPR_H-16)*bs-hover-(hover?Math.sin((game.time||0)*3.5)*4*sc:0)-(opts.lift||0)*sc;
  return{s:s,sc:sc,dir:dir,hover:hover,bs:bs,ox:s.x-Math.cos(ang||0)*rec*sc,oy:oy,cs:charScOf(look),dw:SPR_W*bs,dh:SPR_H*bs,rec:rec};
}
function locXY(pl,lx,ly,bob){return{x:pl.ox+lx*pl.cs*pl.bs,y:pl.oy+(SPR_H-16-(bob||0)+ly*pl.cs)*pl.bs};}
function homeEyes(z){
  if(!z)return null;
  if(typeof artEyes==="function"){var ae=artEyes(z);if(ae)return ae;}
  var look=z.look||makeHomeLook(),pl=sprPlace(z.x,z.y,look,z.aimAng||0,{h:58}),dir=pl.dir;
  var fl=(dir<=1||dir===7)?1:(dir>=3&&dir<=5)?-1:1,headR=18,hy0=-61.9,ex=fl*2.2,ey=hy0-0.36,hx0=fl*2;
  var L=locXY(pl,hx0-headR*0.32+ex*0.2,ey,0),R=locXY(pl,hx0+headR*0.3+ex*0.2,ey,0);
  if(dir>=5&&dir<=7){L=R=locXY(pl,hx0,hy0,0);}
  return{L:L,R:R,m:{x:(L.x+R.x)/2,y:(L.y+R.y)/2}};
}
function limbS(x1,y1,x2,y2,th,col,colD){
  ctx.save();
  var dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy)||1,ang=Math.atan2(dy,dx);
  ctx.translate(x1,y1);ctx.rotate(ang);
  ctx.fillStyle=lg(ctx,0,-th,0,th,shadeHex(col,20),colD||col);
  roundRect(ctx,0,-th/2,len,th,th/2);ctx.fill();
  ctx.strokeStyle="#1a140c";ctx.lineWidth=Math.max(1.5,th*0.22);roundRect(ctx,0,-th/2,len,th,th/2);ctx.stroke();
  ctx.restore();
}
function drawChar34(wx,wy,look,ang,anim,opts){
  opts=opts||{};
  var pose=opts.pose||(opts.dying?"die":opts.spawnP!=null?"spawn":opts.flash?"hurt":(opts.muzzle>0||opts.atk)?"atk":opts.moving?"walk":"idle");
  opts.pose=pose;opts.face=opts.face||(opts.flash?"hurt":(opts.muzzle>0||opts.atk)?"atk":"idle");
  if(typeof tryDrawArt==="function"&&tryDrawArt(wx,wy,look,ang,anim,opts)){
    if(opts.wpn&&opts._hand){
      var aim=opts.aim!=null?opts.aim:ang,sa=Math.atan2(Math.sin(aim)*CFG.YSCALE,Math.cos(aim));
      var sc=layout.scale,bs=artTargetH(look,sc)/110;
      drawWeapon34(ctx,opts._hand.x,opts._hand.y,sa,opts.wpn,bs*1.25,opts.muzzle||0,look.skin||"#e8c4a0",opts.twoHand);
    }
    if(opts.eyeGlow&&opts._eyes){
      var pulse=0.65+0.35*Math.sin((game.time||0)*18),gi,pt,g,sc=layout.scale;
      for(gi=0;gi<2;gi++){pt=gi?opts._eyes.R:opts._eyes.L;g=ctx.createRadialGradient(pt.x,pt.y,1,pt.x,pt.y,14*sc);g.addColorStop(0,"rgba(255,255,210,"+pulse+")");g.addColorStop(0.4,"rgba(255,50,40,"+(0.75*pulse)+")");g.addColorStop(1,"rgba(255,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(pt.x,pt.y,14*sc,0,7);ctx.fill();}
    }
    return;
  }
  var pl=sprPlace(wx,wy,look,ang,opts),s=pl.s,sc=pl.sc,dir=pl.dir,bs=pl.bs,ox=pl.ox,oy=pl.oy,dw=pl.dw,dh=pl.dh;
  var fr;if(pose==="walk")fr=((anim*3.5)|0)&7;else if(pose==="idle")fr=((anim*1.6)|0)&7;else if(pose==="die")fr=Math.min(7,(((1-(opts.dieP||0))*8)|0));else if(pose==="spawn")fr=Math.min(7,(((opts.spawnP||0)*8)|0));else fr=((anim*2.2)|0)&7;
  var vr=(opts.r||13)*sc,hover=pl.hover;
  ctx.fillStyle="rgba(0,0,0,"+(hover?0.32:0.42)+")";fillEllipse(ctx,s.x+3*sc,s.y+5,vr*(hover?2.2:1.5),vr*CFG.YSCALE*(hover?1.3:0.95));
  if(look.cape)drawCape(s.x,oy+dh*0.46,ang,bs,look);
  if(opts.wpn)opts.noArm=1;
  var spr=getCharSpr(look,dir,fr,opts);
  ctx.imageSmoothingEnabled=1;ctx.imageSmoothingQuality="high";
  if(opts.flash){ctx.filter="brightness(1.7) saturate(0.6)";}
  if(opts.dying||opts.spawnP!=null){ctx.save();ctx.translate(s.x,s.y);if(opts.dying){var dp=1-(opts.dieP||0);ctx.scale(1+dp*0.15,Math.max(0.25,1-dp*0.7));ctx.rotate(dp*0.5);ctx.globalAlpha=clamp((opts.dieP||0)*1.4,0,1);ctx.drawImage(spr.c,-dw/2,oy-s.y-dp*8,dw,dh);}else{var sp=opts.spawnP||0;ctx.translate(0,(1-sp)*28*sc);ctx.scale(0.85+0.15*sp,0.7+0.3*sp);ctx.drawImage(spr.c,-dw/2,oy-s.y,dw,dh);}ctx.restore();}
  else ctx.drawImage(spr.c,ox-dw/2,oy,dw,dh);
  ctx.filter="none";ctx.globalAlpha=1;
  if(opts.wpn){
    var aim=opts.aim!=null?opts.aim:ang,sa=Math.atan2(Math.sin(aim)*CFG.YSCALE,Math.cos(aim));
    var bob=pose==="walk"?-Math.abs(Math.sin((fr/8)*Math.PI*2))*2.8:0;
    var fl=(dir<=1||dir===7)?1:(dir>=3&&dir<=5)?-1:1;
    var bodyW=look.bulk?40:28,armY=-30,shN=locXY(pl,fl*(bodyW*0.48),armY,bob),shF=locXY(pl,-fl*(bodyW*0.48),armY,bob);
    var al=22*pl.cs*bs,gx=shN.x+Math.cos(sa)*al,gy=shN.y+Math.sin(sa)*al;
    var shirt=look.hoodie||look.shirt||"#1565c0",shD=look.hoodieDark||look.shirtDark||shadeHex(shirt,-30);
    var armT=(look.bulk?9:6.5)*pl.cs*bs,skin=look.skin||"#e8c4a0";
    if(opts.twoHand){var sx=gx+Math.cos(sa)*7*bs,sy=gy+Math.sin(sa)*7*bs;limbS(shF.x,shF.y,sx,sy,armT*0.9,shirt,shD);}
    else limbS(shF.x,shF.y,shF.x-fl*8*bs,shF.y+12*bs,armT*0.9,shirt,shD);
    limbS(shN.x,shN.y,gx,gy,armT+1,shirt,shD);
    drawWeapon34(ctx,gx,gy,sa,opts.wpn,bs*1.35,opts.muzzle||0,skin,opts.twoHand);
  }
  if(opts.eyeGlow){
    var ey=homeEyes({x:wx,y:wy,look:look,aimAng:ang});
    if(ey){var pulse=0.65+0.35*Math.sin((game.time||0)*18),gi=0,pt,g;
      for(gi=0;gi<2;gi++){pt=gi?ey.R:ey.L;g=ctx.createRadialGradient(pt.x,pt.y,1,pt.x,pt.y,14*sc);g.addColorStop(0,"rgba(255,255,210,"+pulse+")");g.addColorStop(0.4,"rgba(255,50,40,"+(0.75*pulse)+")");g.addColorStop(1,"rgba(255,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(pt.x,pt.y,14*sc,0,7);ctx.fill();}}
  }
  if(opts.hpBar){
    var bx=s.x-18*sc,by=oy-2*bs;
    ctx.fillStyle="#2a0000";roundRect(ctx,bx,by,36*sc,5*sc,2);ctx.fill();
    ctx.fillStyle="#e53935";roundRect(ctx,bx,by,36*sc*opts.hpBar,5*sc,2);ctx.fill();
    ctx.strokeStyle="#1a140c";ctx.lineWidth=1;roundRect(ctx,bx,by,36*sc,5*sc,2);ctx.stroke();
  }
}

function drawWeapon34(c,hx,hy,ang,wpn,sc,muzzle,skin,two){
  skin=skin||"#e8c4a0";
  var skL=shadeHex(skin,28),skD=shadeHex(skin,-28),o="#1a140c",lw=Math.max(1.5,1.9*sc);
  c.save();c.translate(hx,hy);c.rotate(ang);
  function body(x,y,w,h,r,col,col2){c.fillStyle=lg(c,x,y,x,y+h,col,col2||shadeHex(col,-30));roundRect(c,x,y,w,h,r);c.fill();c.strokeStyle=o;c.lineWidth=lw;roundRect(c,x,y,w,h,r);c.stroke();}
  function palm(x,y,rx,ry){ellP(c,x,y,rx,ry);fs(c,lg(c,x-rx,y-ry,x+rx,y+ry,skL,skD),o,lw);}
  function fing(x,y,rx,ry){c.save();c.translate(x,y);ellP(c,0,0,rx,ry);fs(c,lg(c,-rx,-ry,rx,ry,skL,skD),o,lw*0.85);c.restore();}
  function wrap(oy){var i;for(i=0;i<4;i++)fing((i-1.5)*1.45*sc,(oy||3.4)*sc,1.45*sc,2.5*sc);fing(-4.1*sc,0.6*sc,1.6*sc,2.3*sc);}
  if(wpn==="knife"){
    palm(0,0.6*sc,4.6*sc,5*sc);
    body(-5*sc,-2*sc,8*sc,4*sc,1.4,"#5d4037","#3e2723");
    var gd=c.createLinearGradient(2*sc,-2.4*sc,16*sc,2*sc);gd.addColorStop(0,"#fafafa");gd.addColorStop(1,"#78909c");
    c.fillStyle=gd;c.beginPath();c.moveTo(2*sc,-2.2*sc);c.lineTo(16*sc,0);c.lineTo(2*sc,2.2*sc);c.closePath();c.fill();c.strokeStyle=o;c.lineWidth=lw;c.stroke();
    wrap(2.8);
  }else if(wpn==="bolt"){
    palm(0,0.8*sc,4.2*sc,5*sc);
    fing(5*sc,-2.8*sc,1.4*sc,2.8*sc);fing(6.2*sc,-0.6*sc,1.4*sc,2.8*sc);fing(6.2*sc,1.4*sc,1.4*sc,2.8*sc);fing(5*sc,3.2*sc,1.4*sc,2.6*sc);fing(-3.6*sc,0.4*sc,1.6*sc,2.2*sc);
    c.fillStyle="#fff59d";c.shadowColor="#82b1ff";c.shadowBlur=8*sc;
    c.beginPath();c.moveTo(7*sc,-3.2*sc);c.lineTo(15*sc,0);c.lineTo(7*sc,3.2*sc);c.closePath();c.fill();c.shadowBlur=0;
    body(-2*sc,-1.6*sc,8*sc,3.2*sc,1.4,"#1565c0","#0d47a1");
  }else if(wpn==="fist"){
    palm(0,0,5.2*sc,5.6*sc);
    var i;for(i=0;i<4;i++)fing(3.4*sc,(i-1.5)*2.1*sc,2.4*sc,1.5*sc);
    fing(-3.2*sc,-1.6*sc,1.8*sc,2.4*sc);
  }else if(wpn==="bell"){
    palm(0,0.4*sc,4.4*sc,5*sc);
    body(-8*sc,-1.5*sc,20*sc,3*sc,1.2,"#90a4ae","#455a64");
    c.fillStyle="#546e7a";fillEllipse(c,-8*sc,0,4.2*sc,4.2*sc);fillEllipse(c,12*sc,0,4.2*sc,4.2*sc);
    c.fillStyle="#cfd8dc";fillEllipse(c,-8*sc,0,1.6*sc,1.6*sc);fillEllipse(c,12*sc,0,1.6*sc,1.6*sc);
    wrap(3.0);
  }else if(wpn==="machete"){
    palm(0,0.6*sc,4.4*sc,5*sc);
    body(-5*sc,-2.2*sc,8*sc,4.6*sc,2,"#6d4c41","#3e2723");
    var gd=c.createLinearGradient(2*sc,-3.6*sc,18*sc,3*sc);gd.addColorStop(0,"#f5f5f5");gd.addColorStop(1,"#607d8b");
    c.fillStyle=gd;c.beginPath();c.moveTo(2*sc,-3*sc);c.lineTo(17*sc,-3.4*sc);c.quadraticCurveTo(21*sc,0,17*sc,3*sc);c.lineTo(2*sc,2.4*sc);c.closePath();c.fill();c.strokeStyle=o;c.lineWidth=lw;c.stroke();
    wrap(3.0);
  }else{
    palm(0,1.6*sc,4.6*sc,5.2*sc);
    if(wpn==="shotgun"){
      body(-2.2*sc,-3.6*sc,20*sc,5.2*sc,2,"#78909c","#37474f");
      body(-14*sc,-3.2*sc,12*sc,6.6*sc,2,"#8d6e4a","#5d4037");
      body(-2.2*sc,0.4*sc,4.6*sc,7*sc,1.5,"#5d4037","#3e2723");
    }else if(wpn==="smg"){
      body(-2*sc,-3.4*sc,16*sc,5.6*sc,2,"#78909c","#37474f");
      body(-2*sc,0.6*sc,4.4*sc,6.8*sc,1.4,"#37474f","#102027");
      body(3*sc,2.2*sc,3.2*sc,6.4*sc,1,"#212121","#000");
    }else{
      body(-2.2*sc,0.2*sc,4.6*sc,7.2*sc,1.6,"#5d4037","#3e2723");
      body(-2.2*sc,-3.8*sc,16*sc,5*sc,2,"#90a4ae","#455a64");
      c.strokeStyle="rgba(255,255,255,0.45)";c.lineWidth=1;c.beginPath();c.moveTo(0,-3*sc);c.lineTo(12*sc,-3*sc);c.stroke();
    }
    wrap(3.6);
    if(two){palm(6.5*sc,2.4*sc,3.6*sc,4*sc);fing(5.2*sc,4.6*sc,1.3*sc,2.1*sc);fing(7*sc,4.6*sc,1.3*sc,2.1*sc);fing(8.6*sc,3.8*sc,1.3*sc,2.1*sc);}
  }
  if(muzzle>0&&wpn!=="machete"&&wpn!=="knife"&&wpn!=="fist"&&wpn!=="bell"&&wpn!=="bolt"){
    var mx=(wpn==="shotgun"?19:wpn==="smg"?14:14)*sc,a=Math.min(1,muzzle*16);
    var grd=c.createRadialGradient(mx,0,1,mx,0,12*sc+a*8);grd.addColorStop(0,"rgba(255,255,230,1)");grd.addColorStop(0.4,"rgba(255,200,60,"+a+")");grd.addColorStop(1,"rgba(255,120,0,0)");
    c.fillStyle=grd;c.beginPath();c.arc(mx,0,12*sc+a*8,0,7);c.fill();
    c.fillStyle="rgba(255,255,240,"+a+")";c.beginPath();c.moveTo(mx,-4*sc);c.lineTo(mx+10*sc+a*8,0);c.lineTo(mx,4*sc);c.closePath();c.fill();
  }
  c.restore();
}
function drawBullet(b){
  var s=toScreen(b.x,b.y),sc=layout.scale,ang=Math.atan2(b.vy||0,b.vx||1);
  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(ang);
  if(b.bell){ctx.fillStyle="#546e7a";fillEllipse(ctx,-5*sc,0,4*sc,4*sc);fillEllipse(ctx,5*sc,0,4*sc,4*sc);ctx.fillStyle="#90a4ae";ctx.fillRect(-5*sc,-1.4*sc,10*sc,2.8*sc);ctx.restore();return;}
  var col=b.fire?"#ff5722":b.ice?"#81d4fa":b.poison?"#9ccc65":"#ffe082";
  ctx.shadowColor=col;ctx.shadowBlur=8*sc;
  ctx.fillStyle=col;fillEllipse(ctx,0,0,7*sc,2.4*sc);
  ctx.fillStyle="#fff";fillEllipse(ctx,2*sc,0,3*sc,1.4*sc);
  ctx.restore();
}
function drawMarker(x,y,r,col,t){
  var s=toScreen(x,y),sc=layout.scale,ys=CFG.YSCALE;
  ctx.save();ctx.strokeStyle=col;ctx.lineWidth=3;ctx.globalAlpha=0.7+0.3*Math.sin((t||0)*10);
  ctx.beginPath();ctx.ellipse(s.x,s.y,r*sc,r*ys*sc,0,0,7);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s.x-7,s.y);ctx.lineTo(s.x+7,s.y);ctx.moveTo(s.x,s.y-7);ctx.lineTo(s.x,s.y+7);ctx.stroke();
  ctx.restore();
}
function drawSlamRing(x,y,r,col){
  var s=toScreen(x,y),sc=layout.scale,ys=CFG.YSCALE;
  ctx.strokeStyle=col;ctx.lineWidth=5*sc;ctx.globalAlpha=0.85;
  ctx.beginPath();ctx.ellipse(s.x,s.y,r*sc,r*ys*sc,0,0,7);ctx.stroke();
  ctx.globalAlpha=1;
}
function drawFloat(ft){
  var fs=toScreen(ft.x,ft.y),pop=1.15-clamp(ft.life/0.8,0,1)*0.2;
  ctx.save();ctx.translate(fs.x,fs.y);ctx.scale(pop,pop);
  ctx.globalAlpha=clamp(ft.life/0.8,0,1);ctx.font="bold 16px system-ui";ctx.textAlign="center";ctx.lineJoin="round";
  ctx.strokeStyle="#1a140c";ctx.lineWidth=4;ctx.strokeText(ft.text,0,0);
  ctx.fillStyle=ft.col;ctx.fillText(ft.text,0,0);
  ctx.restore();
}
function drawBolt(b){
  if(!b.pts||b.pts.length<2)return;
  var i,sc=layout.scale,a=clamp(b.life/(b.maxLife||0.2),0,1);
  ctx.save();ctx.lineJoin="round";ctx.lineCap="round";
  ctx.strokeStyle="rgba(255,245,157,"+a+")";ctx.lineWidth=6*sc;ctx.shadowColor="#82b1ff";ctx.shadowBlur=18*sc;
  ctx.beginPath();
  for(i=0;i<b.pts.length;i++){var s=toScreen(b.pts[i].x,b.pts[i].y);if(i===0)ctx.moveTo(s.x,s.y);else ctx.lineTo(s.x,s.y);}
  ctx.stroke();
  ctx.strokeStyle="rgba(130,177,255,"+a+")";ctx.lineWidth=2.2*sc;ctx.shadowBlur=0;ctx.stroke();
  ctx.restore();
}
function drawSlashFX(sl){
  var s=toScreen(sl.x,sl.y),sc=layout.scale,a=clamp(sl.life/(sl.maxLife||0.2),0,1),r=(sl.r||50)*sc;
  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(sl.ang||0);
  ctx.strokeStyle="rgba(245,245,245,"+a+")";ctx.lineWidth=4*sc;ctx.lineCap="round";
  ctx.beginPath();ctx.arc(0,0,r,-0.7,0.7);ctx.stroke();
  ctx.strokeStyle="rgba(255,235,59,"+(a*0.7)+")";ctx.lineWidth=2*sc;ctx.stroke();
  ctx.restore();
}
function drawNova(n){
  var s=toScreen(n.x,n.y),sc=layout.scale,ys=CFG.YSCALE,a=clamp(n.life/(n.maxLife||0.5),0,1);
  ctx.save();
  ctx.strokeStyle=n.col||"rgba(255,87,34,"+a+")";ctx.lineWidth=6*sc;ctx.globalAlpha=a;
  ctx.beginPath();ctx.ellipse(s.x,s.y,n.r*sc,n.r*ys*sc,0,0,7);ctx.stroke();
  ctx.fillStyle="rgba(255,160,0,"+(a*0.18)+")";ctx.beginPath();ctx.ellipse(s.x,s.y,n.r*sc,n.r*ys*sc,0,0,7);ctx.fill();
  ctx.restore();
}
function drawBirds(){
  var i,b,s,sc=layout.scale,t=game?game.time:0;
  for(i=0;i<(map.birds||[]).length;i++){
    b=map.birds[i];if(!onScreen(b.x,b.y,30)&&!b.fly)continue;
    s=toScreen(b.x,b.y- (b.z||0));
    ctx.fillStyle="#eceff1";
    var w=3+Math.sin((b.wing||0)+t*18)*2;
    if(b.fly){ctx.beginPath();ctx.moveTo(s.x-6*sc,s.y-w*sc);ctx.lineTo(s.x,s.y);ctx.lineTo(s.x+6*sc,s.y-w*sc);ctx.strokeStyle="#cfd8dc";ctx.lineWidth=1.6;ctx.stroke();}
    fillEllipse(ctx,s.x,s.y,3.2*sc,2.2*sc);
    ctx.fillStyle="#37474f";fillEllipse(ctx,s.x+2.4*sc,s.y-0.4*sc,1.4*sc,1.2*sc);
  }
}

function drawCape(cx,cy,ang,bs,look){
  var fast=(game&&game.boss&&(game.boss.grabDash>0||game.boss.grabT>0||game.boss.diveT>0))?1.85:1;
  var t=game?game.time:0,fl=Math.sin(t*4)*11*bs*fast,fl2=Math.cos(t*3.1)*8*bs*fast,fl3=Math.sin(t*5.2)*6*bs*fast;
  ctx.save();ctx.translate(cx,cy);
  ctx.fillStyle="#c62828";
  ctx.beginPath();ctx.moveTo(-11*bs,-2*bs);ctx.quadraticCurveTo(-30*bs+fl,22*bs,-18*bs+fl,54*bs);ctx.quadraticCurveTo(fl2,44*bs,20*bs+fl,54*bs);ctx.quadraticCurveTo(32*bs+fl2,20*bs,11*bs,-2*bs);ctx.closePath();
  ctx.fill();ctx.strokeStyle="#1a140c";ctx.lineWidth=1.8;ctx.stroke();
  ctx.strokeStyle="rgba(255,180,180,0.35)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,4*bs);ctx.quadraticCurveTo(fl2,28*bs,fl,50*bs);ctx.stroke();
  ctx.restore();
}
function drawScorches(){
  var i,S,ss,sc=layout.scale;if(!game||!game.scorches)return;
  for(i=0;i<game.scorches.length;i++){S=game.scorches[i];ss=toScreen(S.x,S.y);ctx.globalAlpha=clamp(S.life/3,0,1)*0.55;ctx.fillStyle="#1a1208";fillEllipse(ctx,ss.x,ss.y,14*sc,8*sc);ctx.fillStyle="#2a1c10";fillEllipse(ctx,ss.x,ss.y,7*sc,4*sc);ctx.globalAlpha=1;}
}
function drawSpeedLines(z){
  var s=toScreen(z.x,z.y),a=z.aimAng||0,i,sc=layout.scale,bx,by,len;
  ctx.strokeStyle="rgba(255,230,230,0.5)";ctx.lineWidth=1.5;ctx.lineCap="round";
  for(i=0;i<8;i++){len=16+i*3;bx=s.x-Math.cos(a)*(28+i*9)*sc+Math.sin(a)*(i-4)*7*sc;by=s.y-Math.sin(a)*CFG.YSCALE*(28+i*9)*sc-Math.cos(a)*(i-4)*4*sc;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx-Math.cos(a)*len*sc,by-Math.sin(a)*CFG.YSCALE*len*sc);ctx.stroke();}
}
function drawLasers(){
  var i,L,a,e,sc=layout.scale,eyes,ox,oy,ex,ey,mx,my,jx,jy,s;
  if(!game.lasers)return;
  for(i=0;i<game.lasers.length;i++){
    L=game.lasers[i];a=L.ang;e=toScreen(L.x+Math.cos(a)*L.len,L.y+Math.sin(a)*L.len);
    eyes=homeEyes(game.boss&&game.boss.isHome?game.boss:null);
    if(eyes&&eyes.L&&eyes.R){ox=eyes.L.x;oy=eyes.L.y;ex=eyes.R.x;ey=eyes.R.y;if(eyes.m){mx=eyes.m.x;my=eyes.m.y;}else{mx=(ox+ex)/2;my=(oy+ey)/2;}}
    else{s=toScreen(L.x,L.y);ox=ex=mx=s.x;oy=ey=my=s.y-48*sc;}
    jx=mx+(e.x-mx)*0.16;jy=my+(e.y-my)*0.16;
    ctx.save();ctx.lineCap="round";ctx.globalAlpha=L.fading?clamp(L.life/0.15,0,1):1;
    if(L.warn||(L.life>L.maxLife-0.02&&L.dmg===0&&!L.fading)){ctx.strokeStyle="rgba(255,80,80,0.75)";ctx.setLineDash([8,6]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(e.x,e.y);ctx.moveTo(ex,ey);ctx.lineTo(e.x,e.y);ctx.stroke();ctx.setLineDash([]);}
    if(!L.warn){
      ctx.strokeStyle="rgba(255,40,40,0.45)";ctx.lineWidth=5*sc;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(jx,jy);ctx.moveTo(ex,ey);ctx.lineTo(jx,jy);ctx.stroke();
      ctx.strokeStyle="#ff1744";ctx.lineWidth=2*sc;ctx.stroke();
      ctx.strokeStyle="rgba(255,40,40,0.35)";ctx.lineWidth=14*sc;ctx.beginPath();ctx.moveTo(jx,jy);ctx.lineTo(e.x,e.y);ctx.stroke();
      ctx.strokeStyle="#ff1744";ctx.lineWidth=6*sc;ctx.stroke();
      ctx.strokeStyle="#fff8e1";ctx.lineWidth=2*sc;ctx.stroke();
      var grd=ctx.createRadialGradient(mx,my,1,mx,my,12*sc);grd.addColorStop(0,"rgba(255,240,180,0.9)");grd.addColorStop(1,"rgba(255,20,20,0)");
      ctx.fillStyle=grd;ctx.beginPath();ctx.arc(mx,my,12*sc,0,7);ctx.fill();
      ctx.fillStyle="rgba(20,8,0,0.55)";fillEllipse(ctx,e.x,e.y,12*sc,7*sc);
    }
    ctx.restore();
  }
}
function drawAmbientLive(){
  var p=game&&game.player,t=game?game.time:0,sc=layout.scale,i,z,s;
  /* swaying tufts near cam in grass */
  z=p?zoneAt(p.x,p.y):null;
  if(z&&z.k==="grass"){
    var rng=seeded(((game.camX/80)|0)*13+((game.camY/80)|0)*97),n;
    ctx.strokeStyle="#1b5e20";ctx.lineWidth=1.3;
    for(n=0;n<18;n++){
      var wx=game.camX+(rng()-0.5)*worldW()*0.9,wy=game.camY+(rng()-0.5)*worldH()*0.9;
      s=toScreen(wx,wy);var sw=Math.sin(t*3+n)*4;
      ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.quadraticCurveTo(s.x+sw,s.y-8*sc,s.x+sw*0.4,s.y-14*sc);ctx.stroke();
      if(n%4===0){ctx.fillStyle=n%8===0?"#fff59d":"#f8bbd0";fillEllipse(ctx,s.x+sw*0.4,s.y-14*sc,2.2*sc,2.2*sc);}
    }
  }
  /* puddle shimmer */
  for(i=0;i<(map.decals||[]).length;i++){
    var o=map.decals[i];if(o.k!=="puddle"||!onScreen(o.x,o.y,20))continue;
    s=toScreen(o.x+o.w/2,o.y+o.d/2);
    ctx.strokeStyle="rgba(255,255,255,"+(0.2+0.2*Math.sin(t*3+o.x))+")";ctx.lineWidth=1.4;
    ctx.beginPath();ctx.ellipse(s.x,s.y,(o.w*0.35+Math.sin(t*2)*2)*sc,(o.d*0.28)*sc,0,0,7);ctx.stroke();
  }
  drawBirds();
  if(map.rats){for(i=0;i<map.rats.length;i++){var r=map.rats[i];if(!onScreen(r.x,r.y,10))continue;s=toScreen(r.x,r.y);ctx.fillStyle="#3e2723";fillEllipse(ctx,s.x,s.y,5*sc,3*sc);ctx.fillStyle="#1a1a1a";fillEllipse(ctx,s.x+4*sc,s.y-1,2*sc,1.4*sc);}}
  if(map.papers){for(i=0;i<map.papers.length;i++){var q=map.papers[i];if(!onScreen(q.x,q.y,8))continue;s=toScreen(q.x,q.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(q.a||0);ctx.globalAlpha=0.8;ctx.fillStyle="#eceff1";ctx.fillRect(-4*sc,-3*sc,8*sc,5*sc);ctx.restore();ctx.globalAlpha=1;}}
  for(i=0;i<map.solids.length;i++){var oo=map.solids[i];if((oo.k!=="dump"&&oo.k!=="bag")||!onScreen(oo.x,oo.y,20))continue;var fi;s=toScreen(oo.x+oo.w/2,oo.y+oo.d/2);for(fi=0;fi<4;fi++){var fa=t*7+fi*1.7;ctx.fillStyle="#212121";fillEllipse(ctx,s.x+Math.cos(fa)*10*sc,s.y-12*sc+Math.sin(fa*1.4)*6*sc,1.4,1.1);}}
}
