/* v20.3.3 — MEGA-POWER TRANSFORMATIONS. Picking a pedestal now visibly changes the hero:
   - MAZO DE TORMENTA (v20.6): dark storm-steel armour with violet runes, a ragged storm-grey mantle, violet eyes, violet lightning aura, rune maul in hand.
   - ARMADURA TITÁN (v20.6): gunmetal/steel plated suit, helmet with one glowing cyan visor band, hexagonal core, propulsor palms, jets on dash.
   - FURIA SALVAJE (v20.6): the hero grows, ember-orange skin, ripped shirt + muscles, dark hide trousers, ground cracks on heavy steps, roar.
   Skins are built ONCE per sprite with pixel ops (no per-frame filters); overlays are a few cheap paths/glow sprites. */
var MEGA_TINT={hammer:"thor",armor:"iron",hulk:"hulk"};
function megaPal(L,st){ /* st: [[pos,r,g,b],...] pos 0..1 */
  var u=clamp(L/255,0,1),i;for(i=1;i<st.length;i++)if(u<=st[i][0])break;if(i>=st.length)i=st.length-1;
  var a=st[i-1],b=st[i],k=clamp((u-a[0])/Math.max(1e-4,b[0]-a[0]),0,1);
  return [a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k,a[3]+(b[3]-a[3])*k];
}
var MP_RED=[[0,40,0,6],[0.35,150,10,22],[0.7,225,40,40],[1,255,190,170]];
var MP_GOLD=[[0,70,40,6],[0.4,190,130,24],[0.75,245,200,70],[1,255,250,210]];
var MP_STEEL=[[0,22,26,36],[0.4,92,104,124],[0.75,170,184,204],[1,240,246,255]];
var MP_CHAIN=[[0,14,16,22],[0.5,58,64,78],[1,140,150,168]];
var MP_GREEN=[[0,52,14,4],[0.35,150,52,14],[0.7,232,116,40],[1,255,214,160]]; /* v20.6: ember-orange beast skin */
var MP_GUN=[[0,10,16,26],[0.35,40,58,82],[0.7,88,112,140],[1,200,220,240]]; /* gunmetal blue */
var MP_TSTEEL=[[0,30,34,40],[0.4,110,120,132],[0.75,185,194,204],[1,250,252,255]]; /* bright steel trim */
var MP_PURPLE=[[0,22,14,8],[0.45,70,46,28],[0.8,122,86,54],[1,200,170,130]]; /* v20.6: dark hide trousers */
function mpSkin(r,g,b){var v=Math.max(r,g,b);return r>110&&r>=g&&g>=b*0.95&&(r-b)>38&&g>r*0.42&&g<r*0.9&&v>90;}
function mpHash(x){x=Math.sin(x*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function megaSkin(name,img,kind){
  var iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,R=(typeof HERO_RIG!=="undefined"&&HERO_RIG[name])||{neck:0.33,waist:0.56};
  var c=document.createElement("canvas");c.width=iw;c.height=ih;var g=c.getContext("2d");g.drawImage(img,0,0);
  var meta={eyes:null,chest:{x:0.5,y:R.neck+(R.waist-R.neck)*0.36},back:/_b$/.test(name)};
  try{
    var d=g.getImageData(0,0,iw,ih),px=d.data,x,y,i,r,gg,b,L,v,mn,col;
    var neckY=R.neck*ih,waistY=R.waist*ih;
    /* face: skin bbox inside the head */
    var fx0=iw,fx1=0,fy0=ih,fy1=0,fn=0,ex=[],ey=[];
    for(y=0;y<neckY;y++)for(x=0;x<iw;x++){i=(y*iw+x)*4;if(px[i+3]<200)continue;if(mpSkin(px[i],px[i+1],px[i+2])){fn++;if(x<fx0)fx0=x;if(x>fx1)fx1=x;if(y<fy0)fy0=y;if(y>fy1)fy1=y;}}
    var hx0=iw,hx1=0,hy0=ih;for(y=0;y<neckY;y++)for(x=0;x<iw;x++){if(px[(y*iw+x)*4+3]>160){if(x<hx0)hx0=x;if(x>hx1)hx1=x;if(y<hy0)hy0=y;}}meta.head={x0:hx0,x1:hx1,y0:hy0,y1:neckY};
    var hasFace=fn>iw*ih*0.012&&!meta.back,fcx=(fx0+fx1)/2,fcy=(fy0+fy1)/2,fw=fx1-fx0,fh=fy1-fy0;
    if(hasFace){
      for(y=fy0;y<fy0+fh*0.75;y++)for(x=fx0;x<=fx1;x++){i=(y*iw+x)*4;if(px[i+3]<200)continue;r=px[i];gg=px[i+1];b=px[i+2];v=Math.max(r,gg,b);mn=Math.min(r,gg,b);
        if(v>185&&(v-mn)<v*0.22){ex.push(x);ey.push(y);}}
      var lx=0,ly=0,ln=0,rx=0,ry=0,rn=0;for(i=0;i<ex.length;i++){if(ex[i]<fcx){lx+=ex[i];ly+=ey[i];ln++;}else{rx+=ex[i];ry+=ey[i];rn++;}}
      if(ln>=3&&rn>=3)meta.eyes=[{x:lx/ln/iw,y:ly/ln/ih},{x:rx/rn/iw,y:ry/rn/ih}];
      else meta.eyes=[{x:(fcx-fw*0.2)/iw,y:(fy0+fh*0.45)/ih},{x:(fcx+fw*0.2)/iw,y:(fy0+fh*0.45)/ih}];
    }
    var hem=function(xx){return waistY-ih*(0.03+0.05*mpHash(Math.floor(xx/5)));};
    for(y=0;y<ih;y++)for(x=0;x<iw;x++){i=(y*iw+x)*4;if(!px[i+3])continue;r=px[i];gg=px[i+1];b=px[i+2];
      L=0.3*r+0.59*gg+0.11*b;v=Math.max(r,gg,b);var sk=mpSkin(r,gg,b),head=y<neckY+ih*0.01;
      col=null;
      if(kind==="iron"){
        if(head){
          var inFace=hasFace&&((x-fcx)*(x-fcx))/((fw*0.52)*(fw*0.52))+((y-fcy-fh*0.08)*(y-fcy-fh*0.08))/((fh*0.6)*(fh*0.6))<1;
          col=megaPal(Math.min(255,L*1.15+30),inFace?MP_TSTEEL:MP_GUN);
        }else if(sk)col=megaPal(L*1.1+10,MP_TSTEEL);         /* gauntlets */
        else if(Math.abs(y-waistY)<ih*0.022)col=megaPal(L*1.2+30,MP_TSTEEL); /* belt line */
        else if(y>ih*0.9)col=megaPal(L*1.1+20,MP_TSTEEL);   /* boots */
        else col=megaPal(Math.min(178,(L-30)*1.2+55),MP_GUN);
      }else if(kind==="thor"){
        if(head){ /* eyes become electric blue */
          if(hasFace&&v>185&&(v-Math.min(r,gg,b))<v*0.22&&y<fy0+fh*0.75&&x>=fx0&&x<=fx1)col=[205,180,255];
        }else if(!sk){
          if(y<waistY+ih*0.01)col=megaPal(Math.min(215,(L-25)*1.4+40),(x<iw*0.27||x>iw*0.73)?MP_CHAIN:MP_STEEL);
          else if(y<ih*0.9)col=megaPal(L*0.75,MP_CHAIN);
        }
      }else if(kind==="hulk"){
        if(sk)col=megaPal(L*1.05,MP_GREEN);
        else if(!head&&y>neckY&&y<waistY+ih*0.02){
          /* ripped shirt: chest and sleeves torn away, ragged tatters remain at the hem */
          if(y<hem(x)||x<iw*0.26||x>iw*0.74)col=megaPal(Math.min(255,L*0.9+70),MP_GREEN);
          else col=[r*0.62,gg*0.62,b*0.62];
        }else if(!head&&y>=waistY+ih*0.02&&y<ih*0.92){
          if(b>r+8||v<90)col=megaPal(L*1.25+20,MP_PURPLE);
        }
      }
      if(col){px[i]=col[0];px[i+1]=col[1];px[i+2]=col[2];}
    }
    g.putImageData(d,0,0);
  }catch(e){}
  /* painted details, clipped to the sprite */
  g.save();g.globalCompositeOperation="source-atop";g.lineCap="round";
  var cx=meta.chest.x*iw,cy=meta.chest.y*ih,u=iw/160;
  if(kind==="iron"&&meta.head){
    var hd=meta.head,hcx=(hd.x0+hd.x1)/2,hw=(hd.x1-hd.x0)*0.5*0.9,hh=(hd.y1-hd.y0)*0.5*0.98,hcy=hd.y0+hh*1.02;
    if(meta.eyes&&!meta.back)hcx=hcx*0.5+((meta.eyes[0].x+meta.eyes[1].x)/2*iw)*0.5;
    g.restore();g.save();
    /* erase hair / cap outside the helmet shell, keep everything below the neck */
    g.globalCompositeOperation="destination-out";g.beginPath();g.rect(0,0,iw,hd.y1);g.ellipse(hcx,hcy,hw,hh,0,0,7,true);g.fill("evenodd");
    g.globalCompositeOperation="source-over";
    var hg=g.createRadialGradient(hcx-hw*0.35,hcy-hh*0.45,hw*0.1,hcx,hcy,hw*1.15);hg.addColorStop(0,"#b0c4d8");hg.addColorStop(0.35,"#55708c");hg.addColorStop(0.8,"#26384c");hg.addColorStop(1,"#121c28");
    g.fillStyle=hg;g.beginPath();g.ellipse(hcx,hcy,hw,hh,0,0,7);g.fill();g.strokeStyle="#0a1018";g.lineWidth=2*u;g.stroke();
    if(!meta.back){
      var fw2=hw*0.82,ft=hcy-hh*0.2,fb=hcy+hh*0.9;
      /* v20.6 titan helmet: a dark jaw guard, a centre ridge and ONE wide glowing visor band (no faceplate / eye slits) */
      var fg=g.createLinearGradient(0,ft,0,fb);fg.addColorStop(0,"#3a4f66");fg.addColorStop(1,"#141e2a");
      g.fillStyle=fg;g.beginPath();g.moveTo(hcx-fw2,ft);g.lineTo(hcx+fw2,ft);g.lineTo(hcx+fw2*0.8,hcy+hh*0.55);g.lineTo(hcx+fw2*0.3,fb);g.lineTo(hcx-fw2*0.3,fb);g.lineTo(hcx-fw2*0.8,hcy+hh*0.55);g.closePath();g.fill();
      g.strokeStyle="rgba(190,210,230,0.7)";g.lineWidth=1.2*u;g.stroke();
      g.strokeStyle="rgba(200,220,240,0.55)";g.lineWidth=1.4*u;g.beginPath();g.moveTo(hcx,hd.y0+hh*0.25);g.lineTo(hcx,ft);g.moveTo(hcx,hcy+hh*0.4);g.lineTo(hcx,fb-hh*0.08);g.stroke();
      var ey2=hcy+hh*0.08,ew2=fw2*0.42;
      g.fillStyle="#05090e";g.fillRect(hcx-fw2*0.9,ey2-4*u,fw2*1.8,8*u);
      var vg=g.createLinearGradient(hcx-fw2,0,hcx+fw2,0);vg.addColorStop(0,"#0097a7");vg.addColorStop(0.5,"#e0ffff");vg.addColorStop(1,"#0097a7");
      g.fillStyle=vg;g.fillRect(hcx-fw2*0.82,ey2-2.2*u,fw2*1.64,4.4*u);
      meta.eyes=[{x:(hcx-fw2*0.12-ew2*0.5)/iw,y:ey2/ih},{x:(hcx+fw2*0.12+ew2*0.5)/iw,y:ey2/ih}];
    }else{g.strokeStyle="rgba(150,220,240,0.6)";g.lineWidth=1.5*u;g.beginPath();g.moveTo(hcx,hd.y0+2*u);g.lineTo(hcx,hd.y1-2*u);g.stroke();}
    g.restore();g.save();g.globalCompositeOperation="source-atop";g.lineCap="round";
  }
  if(kind==="iron"&&!meta.back){
    g.fillStyle="rgba(8,14,22,0.92)";g.beginPath();for(var hq=0;hq<6;hq++){var ha=hq*1.0472+0.5236;g.lineTo(cx+Math.cos(ha)*10*u,cy+Math.sin(ha)*10*u);}g.closePath();g.fill();
    var rg=g.createRadialGradient(cx,cy,0,cx,cy,7*u);rg.addColorStop(0,"#ffffff");rg.addColorStop(0.45,"#9ff6ff");rg.addColorStop(1,"#1ec8e6");g.fillStyle=rg;g.beginPath();for(hq=0;hq<6;hq++){ha=hq*1.0472+0.5236;g.lineTo(cx+Math.cos(ha)*7*u,cy+Math.sin(ha)*7*u);}g.closePath();g.fill();
    g.strokeStyle="rgba(170,200,225,0.85)";g.lineWidth=1.6*u;g.beginPath();g.moveTo(cx-24*u,cy-14*u);g.quadraticCurveTo(cx,cy-4*u,cx+24*u,cy-14*u);g.stroke(); /* plate seams */
    g.strokeStyle="rgba(0,10,20,0.55)";g.lineWidth=1.2*u;g.beginPath();g.moveTo(cx,cy+11*u);g.lineTo(cx,cy+32*u);g.moveTo(cx-14*u,cy+18*u);g.lineTo(cx+14*u,cy+18*u);g.stroke();
  }else if(kind==="thor"&&!meta.back){
    /* v20.6: a glowing violet storm rune (diamond + zig-zag) instead of chest discs */
    g.fillStyle="rgba(20,10,40,0.85)";g.beginPath();g.moveTo(cx,cy-14*u);g.lineTo(cx+10*u,cy+2*u);g.lineTo(cx,cy+18*u);g.lineTo(cx-10*u,cy+2*u);g.closePath();g.fill();
    g.strokeStyle="#d1c4ff";g.lineWidth=2*u;g.lineJoin="round";g.beginPath();g.moveTo(cx+2*u,cy-9*u);g.lineTo(cx-4*u,cy+2*u);g.lineTo(cx+3*u,cy+2*u);g.lineTo(cx-2*u,cy+13*u);g.stroke();
    var k;
  }else if(kind==="hulk"&&!meta.back){
    g.strokeStyle="rgba(70,20,4,0.55)";g.lineWidth=2*u;
    g.beginPath();g.moveTo(cx-22*u,cy-6*u);g.quadraticCurveTo(cx-10*u,cy+4*u,cx-1*u,cy-4*u);g.moveTo(cx+22*u,cy-6*u);g.quadraticCurveTo(cx+10*u,cy+4*u,cx+1*u,cy-4*u);g.stroke(); /* pecs */
    g.lineWidth=1.5*u;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx,cy+26*u);for(k=0;k<3;k++){g.moveTo(cx-8*u,cy+8*u+k*7*u);g.quadraticCurveTo(cx-4*u,cy+10*u+k*7*u,cx,cy+8*u+k*7*u);g.moveTo(cx+8*u,cy+8*u+k*7*u);g.quadraticCurveTo(cx+4*u,cy+10*u+k*7*u,cx,cy+8*u+k*7*u);}g.stroke(); /* abs */
    g.strokeStyle="rgba(255,230,190,0.35)";g.lineWidth=1.4*u;g.beginPath();g.moveTo(cx-20*u,cy-9*u);g.quadraticCurveTo(cx-10*u,cy-12*u,cx-3*u,cy-8*u);g.moveTo(cx+20*u,cy-9*u);g.quadraticCurveTo(cx+10*u,cy-12*u,cx+3*u,cy-8*u);g.stroke();
  }
  g.restore();
  c._mega=meta;return c;
}
(function(){
  var _t=artTint;
  artTint=function(name,img,tint){
    if(tint!=="thor"&&tint!=="iron"&&tint!=="hulk")return _t(name,img,tint);
    var k=name+"|"+tint;if(ART_TINT[k])return ART_TINT[k];
    ART_TINT[k]=megaSkin(name,img,tint);return ART_TINT[k];
  };
})();
/* ---------- overlays inside the hero rig (local sprite space, flip already applied) ---------- */
var _mpBolts={t:-1,list:[]};
function mpCape(name,H,W,fx,fy,opts,anim,run){
  var R=HERO_RIG[name];if(!R)return;
  function dX(s){return -W*fx+s*W;} function dY(s){return -H*fy+s*H;}
  var t=game.time||0,ph=(anim||0)*2.25,wv=run?Math.sin(ph*2)*0.04:Math.sin(t*2.4)*0.02;
  var lx=dX(R.L.p[0]+0.06),rx=dX(R.R.p[0]-0.06),ty=dY(R.neck+0.04),by=dY(0.9),spread=W*(run?0.2:0.12);
  var gr=ctx.createLinearGradient(0,ty,0,by);gr.addColorStop(0,"#4a4f6a");gr.addColorStop(0.6,"#2e2f4a");gr.addColorStop(1,"#17162a");
  ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(lx,ty);ctx.lineTo(rx,ty);
  ctx.quadraticCurveTo(rx+spread*0.6,(ty+by)/2,rx+spread+W*wv*3,by);
  var n=5,i;for(i=1;i<=n;i++){var xx=rx+spread+(lx-spread-rx-spread)*i/n+W*wv*3*(1-i/n),yy=by+Math.sin(t*5+i*1.7)*H*0.012+(i%2?H*0.015:0);ctx.lineTo(xx,yy);}
  ctx.quadraticCurveTo(lx-spread*0.6,(ty+by)/2,lx,ty);ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(8,6,20,0.7)";ctx.lineWidth=Math.max(1,W*0.012);ctx.stroke();
  ctx.strokeStyle="rgba(180,150,255,0.3)";ctx.beginPath();ctx.moveTo(lx+W*0.04,ty+H*0.03);ctx.quadraticCurveTo(lx-spread*0.2,(ty+by)/2,lx-spread*0.5,by-H*0.02);ctx.stroke();
}
function mpBoltPath(x0,y0,x1,y1,seg,jit){var pts=[[x0,y0]],i;for(i=1;i<seg;i++){var u=i/seg;pts.push([x0+(x1-x0)*u+(Math.random()-0.5)*jit,y0+(y1-y0)*u+(Math.random()-0.5)*jit]);}pts.push([x1,y1]);return pts;}
function mpStroke(pts){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(var i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();}
function mpOverlay(kind,e,name,H,W,fx,fy,opts,anim,run){
  var t=game.time||0,p=game.player,meta=e.img&&e.img._mega,R=HERO_RIG[name];
  function dX(s){return -W*fx+s*W;} function dY(s){return -H*fy+s*H;}
  var ph=(anim||0)*2.25,headY=run?Math.sin(ph*2-0.9)*H*0.012:Math.sin(t*2.2-0.6)*H*0.006;
  ctx.save();ctx.globalCompositeOperation="lighter";
  if(kind==="thor"){
    if(meta&&meta.eyes){var gs=glowSpr("#b388ff"),er=W*0.09*(0.85+0.15*Math.sin(t*14));for(var q=0;q<2;q++){var ee=meta.eyes[q];ctx.globalAlpha=0.9;ctx.drawImage(gs,dX(ee.x)-er,dY(ee.y)+headY-er,er*2,er*2);}}
    /* crackling aura: fresh arcs every ~70 ms */
    if(t-_mpBolts.t>0.07||t<_mpBolts.t){_mpBolts.t=t;_mpBolts.list=[];var nb=3+((Math.random()*2)|0);
      for(var b=0;b<nb;b++){var a0=Math.random()*6.283,a1=a0+rand(0.6,1.4),rx=W*0.62,ry=H*0.5,cy=dY(0.55);
        _mpBolts.list.push(mpBoltPath(Math.cos(a0)*rx,cy+Math.sin(a0)*ry,Math.cos(a1)*rx*0.8,cy+Math.sin(a1)*ry*0.8,7,W*0.22));}}
    ctx.globalAlpha=0.3+0.12*Math.sin(t*9);ctx.drawImage(glowSpr("#7c4dff"),-W*0.9,dY(0.0),W*1.8,H*1.05);
    ctx.lineCap="round";ctx.lineJoin="round";
    for(b=0;b<_mpBolts.list.length;b++){ctx.globalAlpha=0.85;ctx.strokeStyle="rgba(170,120,255,0.75)";ctx.lineWidth=Math.max(2,W*0.05);mpStroke(_mpBolts.list[b]);ctx.strokeStyle="#ffffff";ctx.lineWidth=Math.max(0.8,W*0.012);mpStroke(_mpBolts.list[b]);}
  }else if(kind==="iron"){
    if(meta&&!meta.back){var cx=dX(meta.chest.x),cy2=dY(meta.chest.y),cr=W*(0.2+0.03*Math.sin(t*10));ctx.globalAlpha=0.95;ctx.drawImage(glowSpr("#80deea"),cx-cr,cy2-cr,cr*2,cr*2);
      if(meta.eyes){var er2=W*0.07;for(q=0;q<2;q++){ee=meta.eyes[q];ctx.globalAlpha=0.8;ctx.drawImage(glowSpr("#e0f7fa"),dX(ee.x)-er2,dY(ee.y)+headY-er2,er2*2,er2*2);}}}
    /* repulsor palms at the end of both posed arms */
    if(R&&opts._armR!=null){
      var hands=[[R.R,opts._armR,(e.meta.hx!=null?e.meta.hx:0.9),(e.meta.hy!=null?e.meta.hy:0.66)],[R.L,opts._armL,0.1,0.7]],hi;
      for(hi=0;hi<2;hi++){var A=hands[hi][0],rot=hands[hi][1],hx=0.5+(hands[hi][2]-0.5)*0.86,hy=hands[hi][3];
        var ax=dX(A.p[0]),ay=dY(A.p[1]),vx=dX(hx)-ax,vy=dY(hy)-ay,c0=Math.cos(rot),s0=Math.sin(rot),px=ax+vx*c0-vy*s0,py=ay+vx*s0+vy*c0;
        var fire=hi===0&&p&&(p.atkT>0||p.beamT>0),hr=W*(fire?0.34:0.16)*(0.9+0.1*Math.sin(t*16+hi));
        ctx.globalAlpha=fire?1:0.8;ctx.drawImage(glowSpr("#80deea"),px-hr,py-hr,hr*2,hr*2);ctx.drawImage(glowSpr("#ffffff"),px-hr*0.4,py-hr*0.4,hr*0.8,hr*0.8);}
    }
    /* jet flames from the boots while dashing / flying */
    if(p&&(p.dashT>0||(p.airH||0)>2)){var fl=H*(0.16+0.06*Math.sin(t*50));
      for(q=-1;q<=1;q+=2){var bx=dX(0.5+q*0.13),by=dY(0.98);var fg=ctx.createLinearGradient(0,by,0,by+fl);fg.addColorStop(0,"rgba(255,255,230,0.95)");fg.addColorStop(0.35,"rgba(255,190,60,0.85)");fg.addColorStop(1,"rgba(255,80,20,0)");
        ctx.globalAlpha=1;ctx.fillStyle=fg;ctx.beginPath();ctx.moveTo(bx-W*0.06,by);ctx.quadraticCurveTo(bx,by+fl*1.2,bx+W*0.06,by);ctx.closePath();ctx.fill();
        ctx.drawImage(glowSpr("#ffab40"),bx-W*0.14,by-W*0.08,W*0.28,W*0.28);}}
  }else if(kind==="hulk"){
    if(p&&p.megaRoar>0){ctx.globalAlpha=0.35*Math.min(1,p.megaRoar);ctx.drawImage(glowSpr("#ff7043"),-W*0.9,dY(0.15),W*1.8,H*0.85);}
  }
  ctx.restore();
}
(function(){
  var _rig=drawHeroRig;
  drawHeroRig=function(e,name,look,anim,pose,H,W,fx,fy,opts){
    var kind=look&&look.tint,mk=kind==="thor"||kind==="iron"||kind==="hulk",run=pose==="walk";
    if(!mk)return _rig.apply(this,arguments);
    var back=/_b$/.test(name);
    if(kind==="thor"&&!back)mpCape(name,H,W,fx,fy,opts,anim,run);
    var r=_rig.apply(this,arguments);
    if(kind==="thor"&&back)mpCape(name,H,W,fx,fy,opts,anim,run);
    mpOverlay(kind,e,name,H,W,fx,fy,opts,anim,run);
    return r;
  };
  /* mega weapons: no gun model; the hammer is drawn by the hell layer, armour aims with open palms */
  var _dw=drawWeapon34;
  drawWeapon34=function(c,hx,hy,ang,wpn){if(typeof wpn==="string"&&wpn.indexOf("mega_")===0)return;return _dw.apply(this,arguments);};
})();
/* ---------- the transformation itself ---------- */
var MEGA_TF=1.9; /* seconds */
(function(){
  var _pick=megaPick;
  megaPick=function(p,id){
    _pick(p,id);
    var h=game.hell;h.transformT=MEGA_TF;h.flash=0.12;p.megaT=0;p.megaId=id;p.megaFx=0;
    p.look.tint=MEGA_TINT[id];
    if(id==="hulk"){p.look._artScale=1;p._hulkTo=1.34;}
    p.invuln=Math.max(p.invuln,MEGA_TF+0.6);
    game.message=null;
    try{if(typeof artEntry==="function"){artEntry(p.look,2,"walk");if(p.look.hero==="classic")artEntry(p.look,6,"walk");}}catch(e){}
  };
  var _tick=hellTick;
  hellTick=function(dt){
    _tick(dt);
    var p=game.player,h=game.hell;if(!p||!h||!p.mega)return;
    if(p.megaT!=null&&p.megaT<MEGA_TF+0.5){
      var T0=p.megaT;p.megaT+=dt;var T=p.megaT;
      function at(x){return T0<x&&T>=x;}
      var M=MEGA[p.mega];
      if(at(0.02)){sfx("whoosh",0.9);sfx(p.mega==="hammer"?"storm":p.mega==="armor"?"dash":"growl",0.9);}
      if(T<1.0&&Math.random()<0.8){var a=Math.random()*6.283,rr=rand(30,60);hellPart(p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr*0.6,Math.random()<0.5?M.c:M.c2,0.45,-Math.cos(a)*rr*2,-Math.sin(a)*rr*1.2-30,rand(2,4),3);}
      if(p.mega==="armor"&&T>0.15&&T<0.95&&Math.random()<0.5)sfx("click",0.35);
      if(at(1.0)){ /* the reveal */
        shake(16);h.flash=0.35;sfx("thanos_boom",0.9);megaRing(p.x,p.y,8,300,0.5,M.c);megaRing(p.x,p.y,8,200,0.65,"#ffffff");
        if(p.mega==="hammer"){sfx("zap",1);sfx("storm",0.8);h.fx.push({k:"bolt",x:p.x,y:p.y,t:0.4,max:0.4,seed:Math.random()*99});}
        else if(p.mega==="armor"){sfx("zap",1);sfx("level",0.6);}
        else{sfx("gorgon_roar",0.75);sfx("stomp",1);p.megaRoar=1.2;h.cracks=h.cracks||[];h.cracks.push({x:p.x,y:p.y,r:46,t:2.4,big:1,seed:Math.random()*9});}
        for(var i=0;i<18;i++)hellPart(p.x,p.y-10,i%2?M.c:M.c2,0.8,rand(-160,160),rand(-170,20),rand(3,5),3);
      }
      if(at(1.35)){game.message=M.n+" — "+M.sub;game.messageTimer=2.6;}
      if(p.mega==="hulk"&&p._hulkTo){var gu=clamp((T-0.85)/0.4,0,1),ov=gu<1?Math.sin(gu*Math.PI)*0.12:0;p.look._artScale=1+(p._hulkTo-1)*gu+ov;if(T>1.4)p.look._artScale=p._hulkTo;}
    }
    if(p.megaT!=null&&p.megaT<MEGA_TF+0.5){
      var base=layout.baseViewW||380,zk=p.megaT<0.45?smooth01(p.megaT/0.45):p.megaT<MEGA_TF-0.35?1:smooth01(1-(p.megaT-(MEGA_TF-0.35))/0.6);
      game.megaZoom={w:1-0.45*zk,dy:20*zk};
      if(p.megaT>=MEGA_TF+0.25)game.megaZoom=null;
    }
    if(p.megaRoar>0)p.megaRoar-=dt;
    /* hulk: heavy steps crack the ground */
    if(p.mega==="hulk"&&h.phase==="fight"||p.mega==="hulk"&&h.phase==="transform"&&p.megaT>MEGA_TF){
      var mv=Math.abs(p.vx||0)+Math.abs(p.vy||0)>20;
      if(mv&&!p.leap){var st=Math.floor((p.anim||0)*2.25/Math.PI);if(st!==p._step){p._step=st;h.cracks=h.cracks||[];h.cracks.push({x:p.x+rand(-4,4),y:p.y+rand(-2,2),r:rand(13,18),t:1.4,seed:Math.random()*9});if(h.cracks.length>14)h.cracks.shift();shake(1.5);if(st%2===0)sfx("foot_heavy",0.35);}}
    }
    if(h.cracks)for(var ci=h.cracks.length-1;ci>=0;ci--){h.cracks[ci].t-=dt;if(h.cracks[ci].t<=0)h.cracks.splice(ci,1);}
    /* iron: exhaust sparks on dashes */
    if(p.mega==="armor"&&p.dashT>0&&Math.random()<0.8)hellPart(p.x+rand(-3,3),p.y+1,Math.random()<0.5?"#ffab40":"#fff59d",0.3,rand(-20,20),rand(20,50),rand(2,3.5),3);
    /* thor: a faint crackle now and then */
    if(p.mega==="hammer"&&h.phase==="fight"&&Math.random()<dt*0.25)sfx("crackle",0.25);
  };
  /* draw: crossfade normal -> transformed hero, lift + energy column during the change */
  var _dh=drawHero;
  drawHero=function(){
    var p=game.player;
    if(!p||!p.mega||!HELL.active)return _dh.apply(this,arguments);
    var w0=p.weapon;p.weapon="mega_"+p.mega;
    var T=p.megaT==null?9:p.megaT,air0=p.airH||0;
    try{
      if(T<1.15){
        var u=smooth01((T-0.55)/0.5),lift=Math.sin(clamp(T/1.15,0,1)*Math.PI)*10;p.airH=air0+lift;
        var tint=p.look.tint,sca=p.look._artScale;
        if(u<1){p.look.tint=(typeof megaSkinId==="function"&&megaSkinId())||null;if(p.mega==="hulk")p.look._artScale=1;ctx.save();ctx.globalAlpha=1-u;_dh.apply(this,arguments);ctx.restore();p.look.tint=tint;p.look._artScale=sca;}
        if(u>0){ctx.save();ctx.globalAlpha=u;_dh.apply(this,arguments);ctx.restore();}
      }else _dh.apply(this,arguments);
    }finally{p.weapon=w0;p.airH=air0;}
  };
  var _over=hellDrawOver;
  hellDrawOver=function(){
    var p=game.player,h=game.hell,t=game.time||0,sc=layout.scale;
    if(p&&p.mega&&p.megaT!=null&&p.megaT<1.6&&HELL.active){
      var T=p.megaT,M=MEGA[p.mega],s=toScreen(p.x,p.y),k=clamp(1-Math.abs(T-0.9)/0.9,0,1);
      ctx.save();ctx.globalCompositeOperation="lighter";
      /* light column */
      var cw=(10+16*k)*sc,ch=SH*0.95;ctx.globalAlpha=0.55*k;ctx.drawImage(glowSpr(M.c),s.x-cw*2.2,s.y-ch,cw*4.4,ch*1.08);
      ctx.globalAlpha=0.5*k;ctx.drawImage(glowSpr(M.c2||M.c),s.x-cw,s.y-ch*0.85,cw*2,ch*0.9);
      ctx.globalAlpha=0.45*k;ctx.drawImage(glowSpr("#ffffff"),s.x-cw*0.35,s.y-ch*0.8,cw*0.7,ch*0.84);ctx.globalAlpha=1;
      /* spinning runes ring at the feet */
      ctx.strokeStyle=hexA(M.c,0.8*k);ctx.lineWidth=3*sc;var rr=(26+10*Math.sin(t*6))*sc;
      for(var j=0;j<3;j++){ctx.beginPath();ctx.ellipse(s.x,s.y,rr+j*8*sc,(rr+j*8*sc)*CFG.YSCALE,0,t*3+j,t*3+j+3.6);ctx.stroke();}
      /* the flash at the reveal */
      var fl=clamp(1-Math.abs(T-1.0)/0.22,0,1);if(fl>0){var fw=90*sc*(0.6+fl);ctx.globalAlpha=fl;ctx.drawImage(glowSpr("#ffffff"),s.x-fw,s.y-30*sc-fw,fw*2,fw*2);ctx.drawImage(glowSpr(M.c),s.x-fw*1.6,s.y-30*sc-fw*1.2,fw*3.2,fw*2.4);}
      ctx.restore();
      /* armour plates flying in */
      if(p.mega==="armor"&&T>0.1&&T<1.0){for(var q=0;q<10;q++){var a=q*0.628+0.3,pu=clamp((T-0.1-q*0.05)/0.45,0,1);if(pu<=0||pu>=1)continue;var d=(1-pu)*(90+20*(q%3))*sc,px=s.x+Math.cos(a)*d,py=s.y-24*sc+Math.sin(a)*d*0.6;
        ctx.save();ctx.translate(px,py);ctx.rotate(a+pu*4);ctx.fillStyle=q%3?"#d32f2f":"#ffc940";ctx.fillRect(-5*sc,-3*sc,10*sc,6*sc);ctx.strokeStyle="#3a0a0a";ctx.lineWidth=1;ctx.strokeRect(-5*sc,-3*sc,10*sc,6*sc);ctx.restore();}}
    }
    return _over.apply(this,arguments);
  };
  var _under=hellDrawUnder;
  hellDrawUnder=function(){
    _under.apply(this,arguments);
    var h=game.hell;if(!HELL.active||!h||!h.cracks||!h.cracks.length)return;
    var sc=layout.scale,i,c,s,j;
    ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
    for(i=0;i<h.cracks.length;i++){c=h.cracks[i];s=toScreen(c.x,c.y);var a=clamp(c.t/0.6,0,1);
      ctx.globalAlpha=0.75*a;ctx.strokeStyle="#140806";ctx.lineWidth=(c.big?3:2)*sc;
      var n=c.big?9:5;for(j=0;j<n;j++){var an=c.seed+j*6.283/n,len=c.r*(0.6+0.4*mpHash(c.seed*10+j))*sc;ctx.beginPath();ctx.moveTo(s.x,s.y);
        var mx=s.x+Math.cos(an+0.25)*len*0.5,my=s.y+Math.sin(an+0.25)*len*0.5*CFG.YSCALE;ctx.lineTo(mx,my);ctx.lineTo(s.x+Math.cos(an)*len,s.y+Math.sin(an)*len*CFG.YSCALE);ctx.stroke();}
      if(c.big){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.35*a;ctx.drawImage(glowSpr("#ff7043"),s.x-c.r*sc,s.y-c.r*0.5*sc,c.r*2*sc,c.r*sc);ctx.globalCompositeOperation="source-over";}}
    ctx.restore();
  };
  /* punchier mega hits */
  var _mh=megaHit;
  megaHit=function(z,dmg,col){_mh.apply(this,arguments);if(z&&game.hell&&col)game.hell.fx.push({k:"burst",x:z.x+rand(-6,6),y:z.y+rand(-4,4),t:0.25,max:0.25,col:col});};
})();
/* nicer hammer (replaces the old box drawing) */
function drawMegaHammer(hx,hy,rot,sc,t,fly){ /* v20.6: the storm MAUL — long wrapped haft, a heavy dark rune block with spiked caps */
  ctx.save();ctx.translate(hx,hy);ctx.rotate(rot);ctx.scale(sc*0.52,sc*0.52);
  ctx.fillStyle="#2b2433";ctx.fillRect(-1.4,-1,2.8,19);ctx.fillStyle="#6a5a80";for(var i=0;i<5;i++)ctx.fillRect(-1.5,1.5+i*3.2,3,0.9);
  ctx.fillStyle="#9e9e9e";ctx.beginPath();ctx.moveTo(-2.4,18);ctx.lineTo(2.4,18);ctx.lineTo(0,21.5);ctx.closePath();ctx.fill();
  var hg=ctx.createLinearGradient(0,-12,0,0);hg.addColorStop(0,"#6d6a7c");hg.addColorStop(0.5,"#3b3848");hg.addColorStop(1,"#1d1b26");
  ctx.fillStyle=hg;ctx.beginPath();ctx.moveTo(-7,-12);ctx.lineTo(7,-12);ctx.lineTo(8.5,-10);ctx.lineTo(8.5,-2);ctx.lineTo(7,0);ctx.lineTo(-7,0);ctx.lineTo(-8.5,-2);ctx.lineTo(-8.5,-10);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#0c0a12";ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle="#bdbdbd";for(var q=-1;q<=1;q+=2){ctx.beginPath();ctx.moveTo(q*8.5,-9);ctx.lineTo(q*12.5,-6);ctx.lineTo(q*8.5,-3);ctx.closePath();ctx.fill();}
  ctx.strokeStyle="#d1c4ff";ctx.lineWidth=1.2;ctx.lineJoin="round";ctx.beginPath();ctx.moveTo(1.5,-10);ctx.lineTo(-2,-6);ctx.lineTo(2,-6);ctx.lineTo(-1.5,-2);ctx.stroke();
  ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.5+0.3*Math.sin(t*12);ctx.drawImage(glowSpr("#b388ff"),-16,-20,32,30);
  if(Math.random()<(fly?0.9:0.35)){ctx.globalAlpha=0.9;ctx.strokeStyle="#ede7f6";ctx.lineWidth=1;var pts=mpBoltPath(rand(-10,10),rand(-12,2),rand(-14,14),rand(-16,6),4,6);mpStroke(pts);}
  ctx.restore();
}
/* ---------- v20.5.2: MEGAPOWER CARDS. After the villain intro cinematic the world freezes and three legendary
   cards (Mazo de tormenta, Armadura titán, Furia salvaje) flip in; tap one to take it. Why it used to stutter: the
   moment you stepped on a pedestal the game built the transformed skin (pixel pass, ~40 ms on a 4x-throttled CPU) and
   then cut it into limbs (~100-140 ms) on the very next frames. Now all three skins + limb sets are prepared one per
   frame while the cards are still face down and static (nothing moves, so the work is invisible), the frozen world is a
   single snapshot blit, and each card face is pre-rendered once. Choosing a card then costs nothing. */
var MEGA_CARD_TXT={
  hammer:["Golpes y mazazos","eléctricos.","Lanza el mazo","y rayos del cielo."],
  armor:["Vuelo, propulsores y","rayo del núcleo.","+30% vida, -45% daño","recibido, +12% vel."],
  hulk:["Puños, pisotón y","salto gigante.","Vida x2,2, más grande,","-15% daño recibido."]
};
var MEGA_PICK=null;
function megaCardLayout(){
  var w=Math.round(Math.min(168,SW*0.2,SH*0.62/1.42)),h=Math.round(w*1.42),gap=Math.round(Math.max(14,w*0.16)),tot=w*3+gap*2,x0=Math.round(SW/2-tot/2),y=Math.round(SH*0.53-h/2+10);
  return ["hammer","armor","hulk"].map(function(id,i){return{id:id,x:x0+i*(w+gap),y:y,w:w,h:h};});
}
function megaPrepStep(){ /* one heavy task per call; returns true while work remains */
  var p=game&&game.player;if(!p||typeof ART_MAP==="undefined"||!ART.ready)return false;
  var k=typeof artLookKey==="function"?artLookKey(p.look):null,m=k&&ART_MAP[k];if(!m)return false;
  var names=[m.f];if(m.b&&m.b!==m.f)names.push(m.b);
  var ids=["hammer","armor","hulk"],i,j,nm,img,tn,tk;
  for(j=0;j<names.length;j++){nm=names[j];img=ART.imgs[nm];if(img&&img.width&&HERO_RIG[nm]&&!img["_rig_"+nm]){rigParts(nm,img);return true;}} /* plain skin limbs too (the transform blends from them) */
  for(i=0;i<ids.length;i++)for(j=0;j<names.length;j++){nm=names[j];img=ART.imgs[nm];if(!img||!img.width||!HERO_RIG[nm])continue;tn=MEGA_TINT[ids[i]];tk=nm+"|"+tn;
    if(!ART_TINT[tk]){artTint(nm,img,tn);return true;}
    if(!ART_TINT[tk]["_rig_"+nm]){rigParts(nm,ART_TINT[tk]);return true;}}
  return false;
}
function megaCardFace(id,w,h){
  var P=MEGA_PICK,key=id+"_"+w+"_"+h;if(P.faces[key])return P.faces[key];
  var M=MEGA[id],d=Math.min(2,window.devicePixelRatio||1),pad=6,c=document.createElement("canvas");c.width=Math.ceil((w+pad*2)*d);c.height=Math.ceil((h+pad*2)*d);
  var g=c.getContext("2d");g.scale(d,d);g.translate(pad,pad);
  if(typeof cuFace==="function"){var F=cuFace(5,w,h);g.drawImage(F.c,-F.pad,-F.pad,w+F.pad*2,h+F.pad*2);}
  else{g.fillStyle="#1d1626";roundRect(g,0,0,w,h,12);g.fill();}
  /* power-coloured wash + banner text */
  var wg=g.createLinearGradient(0,0,0,h);wg.addColorStop(0,hexA(M.c,0.0));wg.addColorStop(0.45,hexA(M.c,0.22));wg.addColorStop(1,hexA(M.c,0.05));g.fillStyle=wg;roundRect(g,7,30,w-14,h-37,9);g.fill();
  g.fillStyle="#3a2a00";g.fillRect(10,10,w-20,19);g.font="900 11px system-ui";g.textAlign="center";g.fillStyle="#fff3c4";g.fillText("MEGAPODER",w/2,23.5);
  /* the hero already transformed (intact painted sprite, prepared during the face-down phase) */
  var p=game.player,ah=h*0.44,ay=36,look={};for(var kk in p.look)look[kk]=p.look[kk];look.tint=MEGA_TINT[id];look._artScale=1;
  var gs=glowSpr(M.c);g.save();g.globalCompositeOperation="lighter";g.globalAlpha=0.75;g.drawImage(gs,w/2-ah*0.62,ay+ah*0.02,ah*1.24,ah*1.0);g.restore();
  try{var e=typeof artEntry==="function"?artEntry(look,2,"idle"):null;
    if(e&&e.img){var mt=e.meta,iw=ah*(mt.w/mt.h);g.imageSmoothingQuality="high";g.drawImage(e.img,w/2-iw/2,ay,iw,ah);}}catch(err){}
  /* power badge */
  g.save();g.translate(w-24,ay+ah-14);g.fillStyle="rgba(10,6,16,0.85)";g.beginPath();g.arc(0,0,13,0,7);g.fill();g.strokeStyle=M.c;g.lineWidth=2;g.stroke();
  g.scale(0.85,0.85);megaIcon(g,id);g.restore();
  /* name + text */
  g.textAlign="center";g.font="900 "+(w<140?12:13)+"px system-ui";g.lineJoin="round";g.strokeStyle="rgba(0,0,0,0.8)";g.lineWidth=3;
  var nm=M.n.split(" "),l1=nm.slice(0,Math.ceil(nm.length/2)).join(" "),l2=nm.slice(Math.ceil(nm.length/2)).join(" "),ny=ay+ah+16;
  g.strokeText(l1,w/2,ny);g.fillStyle=M.c2;g.fillText(l1,w/2,ny);g.strokeText(l2,w/2,ny+14);g.fillText(l2,w/2,ny+14);
  g.font=(w<140?9:10)+"px system-ui";g.fillStyle="#e3e6ee";var T=MEGA_CARD_TXT[id];for(var i=0;i<T.length;i++)g.fillText(T[i],w/2,ny+31+i*12);
  P.faces[key]={c:c,pad:pad};return P.faces[key];
}
function megaIcon(g,id){ /* v20.6 icons: rune maul / titan helm / beast claw */
  if(id==="hammer"){g.rotate(-0.5);g.fillStyle="#2b2433";g.fillRect(-1.4,-2,2.8,15);g.fillStyle="#3b3848";g.fillRect(-7,-9,14,9);g.fillStyle="#6d6a7c";g.fillRect(-7,-9,14,2.4);g.fillStyle="#bdbdbd";g.beginPath();g.moveTo(-7,-7);g.lineTo(-10,-4.5);g.lineTo(-7,-2);g.moveTo(7,-7);g.lineTo(10,-4.5);g.lineTo(7,-2);g.fill();g.strokeStyle="#d1c4ff";g.lineWidth=1.2;g.beginPath();g.moveTo(1.2,-8);g.lineTo(-1.6,-4.6);g.lineTo(1.6,-4.6);g.lineTo(-1.2,-1.2);g.stroke();}
  else if(id==="armor"){g.fillStyle="#37506a";g.beginPath();g.moveTo(-8,-4);g.quadraticCurveTo(-8,-10,0,-10);g.quadraticCurveTo(8,-10,8,-4);g.lineTo(6,5);g.lineTo(0,9);g.lineTo(-6,5);g.closePath();g.fill();g.fillStyle="#05090e";g.fillRect(-7,-3.4,14,4);g.fillStyle="#80f0ff";g.fillRect(-6,-2.6,12,2.4);g.strokeStyle="#b0c4d8";g.lineWidth=1;g.beginPath();g.moveTo(0,-10);g.lineTo(0,-4);g.stroke();}
  else{g.fillStyle="#e8742a";g.beginPath();g.arc(0,2,7.5,0,7);g.fill();g.fillStyle="#2a1a10";for(var k=0;k<4;k++){g.beginPath();g.moveTo(-6+k*4,-3);g.lineTo(-4.6+k*4,-11);g.lineTo(-3.2+k*4,-3);g.closePath();g.fill();}g.fillStyle="#ffb27a";g.beginPath();g.arc(-2,0,2.4,0,7);g.fill();}
}
function megaCardsOpen(){
  MEGA_PICK={t:0,prep:1,chosen:null,ct:0,snap:null,faces:{},cards:megaCardLayout(),sw:SW,sh:SH,snd:{}};
  game.state="hell_pick";game.hell.phase="cards";game.message=null;
}
function megaCardPick(id){
  var P=MEGA_PICK;if(!P||P.chosen||!game||game.state!=="hell_pick")return;
  while(megaPrepStep()){} /* only if tapped before the prep finished (tests) */
  P.chosen=id;P.ct=0;sfx("rarity5");shake(6);
}
(function(){
  var _ce=hellCineEnd;
  hellCineEnd=function(){_ce.apply(this,arguments);if(game&&game.hell&&game.hell.phase==="pick"&&!game.player.mega)megaCardsOpen();};
  var _mp=megaPick;
  megaPick=function(p,id){if(game&&game.state==="hell_pick"){game.state="playing";}MEGA_PICK=null;return _mp.apply(this,arguments);};
  var _pre=hellPreUpdate;
  hellPreUpdate=function(dt){
    if(!game||game.state!=="hell_pick")return _pre.apply(this,arguments);
    var P=MEGA_PICK;if(!P){game.state="playing";return 1;}
    if(P.prep){if(!megaPrepStep())P.prep=0;return 1;}  /* frozen, static frame while preparing */
    P.t+=dt;
    var i;for(i=0;i<3;i++){if(!P.snd[i]&&P.t>=0.12+i*0.16+0.15){P.snd[i]=1;sfx(i===2?"rarity5":"rarity4");}}
    if(P.chosen){P.ct+=dt;if(P.ct>=0.62){var id=P.chosen;megaPick(game.player,id);}}
    return 1;
  };
  var _scr=hellDrawScreen;
  hellDrawScreen=function(){if(game&&game.state==="hell_pick"){if(typeof hellAtmosphere==="function"&&game.hell)hellAtmosphere();return 1;}return _scr.apply(this,arguments);};
  var _draw=draw;
  draw=function(){
    if(!(game&&game.state==="hell_pick"&&MEGA_PICK)||(layout&&layout.isPortrait))return _draw.apply(this,arguments);
    var P=MEGA_PICK;
    if(P.sw!==SW||P.sh!==SH){P.cards=megaCardLayout();P.sw=SW;P.sh=SH;P.snap=null;P.faces={};}
    if(!P.snap||P.snap.width!==canvas.width||P.snap.height!==canvas.height){
      _draw.apply(this,arguments); /* one real frame of the frozen arena, then reuse it */
      var sc=document.createElement("canvas");sc.width=canvas.width;sc.height=canvas.height;var sg=sc.getContext("2d");sg.drawImage(canvas,0,0);sg.fillStyle="rgba(6,4,12,0.62)";sg.fillRect(0,0,sc.width,sc.height);P.snap=sc; /* dim baked in: one blit per frame */
      ctx.fillStyle="rgba(6,4,12,0.62)";ctx.fillRect(0,0,SW,SH);
    }else{var M=ctx.getTransform();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(P.snap,0,0);ctx.setTransform(M);}
    drawMegaCards();
  };
  document.addEventListener("pointerdown",function(e){
    try{if(!game||game.state!=="hell_pick"||!MEGA_PICK)return;e.stopPropagation();
      var P=MEGA_PICK;if(P.prep||P.chosen||P.t<0.12+2*0.16+0.3)return;
      var q=pointerToScreen(e),i,c;for(i=0;i<P.cards.length;i++){c=P.cards[i];if(q.x>=c.x&&q.x<=c.x+c.w&&q.y>=c.y&&q.y<=c.y+c.h){megaCardPick(c.id);return;}}
    }catch(err){}
  },true);
})();
function drawMegaCards(){
  var P=MEGA_PICK,t=P.t,i,c,el,now=(game.time||0)+t;
  if(P.chosen){ctx.fillStyle="rgba(6,4,12,"+(0.45*clamp(P.ct/0.4,0,1))+")";ctx.fillRect(0,0,SW,SH);}
  ctx.save();ctx.textAlign="center";ctx.lineJoin="round";var ty=Math.max(30,P.cards[0].y-16);
  ctx.font="900 "+Math.round(Math.min(24,SH*0.06))+"px system-ui";ctx.strokeStyle="#1a0a20";ctx.lineWidth=5;ctx.strokeText("Elige tu MEGAPODER",SW/2,ty);ctx.fillStyle="#ffd54f";ctx.fillText("Elige tu MEGAPODER",SW/2,ty);
  var ready=!P.prep&&t>=0.12+2*0.16+0.3&&!P.chosen;
  ctx.font="bold 11px system-ui";ctx.fillStyle=ready?"rgba(255,236,179,0.9)":"rgba(220,220,220,0.55)";
  var cb=P.cards[0].y+P.cards[0].h+16;if(cb<SH-4)ctx.fillText(P.chosen?"":ready?"Toca una carta para elegirla":"Revelando poderes…",SW/2,cb);
  ctx.restore();
  for(i=0;i<P.cards.length;i++){c=P.cards[i];var w=c.w,h=c.h,cx=c.x+w/2,cy=c.y+h/2,M=MEGA[c.id];
    var st=0.12+i*0.16,flipU=P.prep?0:clamp((t-st)/0.3,0,1),face=flipU>=0.5,sx=flipU>=1?1:Math.abs(Math.cos(flipU*Math.PI));
    var sel=P.chosen===c.id,oth=P.chosen&&!sel,k=sel?smooth01(clamp(P.ct/0.35,0,1)):0,sc=1+0.14*k,al=oth?1-clamp(P.ct/0.3,0,1):1;if(al<=0)continue;
    var bob=face&&flipU>=1&&!P.chosen?Math.sin(now*2+i)*2:0,mx=sel?(SW/2-cx)*k:0;
    ctx.save();ctx.globalAlpha=al;ctx.translate(cx+mx,cy+bob);
    if(face&&typeof plGlow==="function"){ctx.save();ctx.globalCompositeOperation="lighter";var pul=0.5+0.5*Math.sin(now*4+i),gz=Math.max(w,h)*(0.58+0.08*pul+0.3*k);ctx.globalAlpha=al*(0.35+0.2*pul+0.4*k);ctx.drawImage(glowSpr(M.c),-gz,-gz,gz*2,gz*2);
      if(typeof cuRays==="function"&&sel){ctx.rotate(now*0.5+i);var rs=Math.max(w,h)*1.0;ctx.globalAlpha=al*(0.16+0.3*k);ctx.drawImage(cuRays(),-rs,-rs,rs*2,rs*2);}ctx.restore();}
    ctx.scale(sc*sx,sc);
    if(!face){if(typeof cuBack==="function"){var bk=cuBack(5,w,h);ctx.drawImage(bk.c,-w/2,-h/2,w,h);}else{ctx.fillStyle="#2a2238";roundRect(ctx,-w/2,-h/2,w,h,12);ctx.fill();}}
    else{var F=megaCardFace(c.id,w,h);ctx.drawImage(F.c,-w/2-F.pad,-h/2-F.pad,w+F.pad*2,h+F.pad*2);
      if(typeof cuShine==="function"){var ph=((now+i*0.5)%1.8)/1.8;ctx.save();roundRect(ctx,-w/2+5,-h/2+5,w-10,h-10,9);ctx.clip();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.4*al;ctx.rotate(0.35);ctx.drawImage(cuShine(),-w*0.9+ph*w*1.8-20,-h,40,h*2);ctx.restore();}
      if(flipU<1){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=(1-flipU)*1.4*al;ctx.fillStyle="#fff";roundRect(ctx,-w/2,-h/2,w,h,12);ctx.fill();}
      if(sel){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.35*(1-k*0.6);ctx.strokeStyle=M.c2;ctx.lineWidth=4;roundRect(ctx,-w/2-3,-h/2-3,w+6,h+6,14);ctx.stroke();}}
    ctx.restore();}
  if(P.chosen&&P.ct>0.45){ctx.save();ctx.globalAlpha=clamp((P.ct-0.45)/0.17,0,1)*0.85;ctx.fillStyle="#fffdf5";ctx.fillRect(0,0,SW,SH);ctx.restore();}
}
