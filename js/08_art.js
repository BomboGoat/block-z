/* v19: generated sprites, landscape rotate overlay, extra upgrade VFX */
var ART={ready:0,imgs:{},meta:null,menuWide:null,arena:null};
var ART_MAP={
  classic:{f:"classic_f",b:"classic_b"},
  trueno:{f:"trueno_f",laser:"trueno_laser_f"},
  mr:{f:"mr_f"},
  gompa:{f:"gompa_f"},
  neizan:{f:"neizan_f"},
  colossus:{f:"colossus_f"},
  home:{f:"home_f"},
  final:{f:"final_f"},
  normal:{f:"z_normal_f"},fast:{f:"z_fast_f"},tank:{f:"z_tank_f"},
  exploder:{f:"z_exploder_f"},crawler:{f:"z_crawler_f"},armored:{f:"z_armored_f"},
  spitter:{f:"z_spitter_f"},jumper:{f:"z_jumper_f"},screamer:{f:"z_screamer_f"},
  splitter:{f:"z_splitter_f"},mini:{f:"z_normal_f"},
  gorgon:{f:"gorgon_f"},gorgon_open:{f:"gorgon_open_f"},
  thanos:{f:"thanos_walk_f"},thanos_cast:{f:"thanos_cast_f"},thanos_snap:{f:"thanos_snap_f"}
};
function artLookKey(look){
  if(!look)return null;
  if(look.kind==="player")return look.hero||"classic";
  if(look.kind==="colossus")return "colossus";
  if(look.kind==="home")return "home";
  if(look.kind==="gorgon")return look.open?"gorgon_open":"gorgon";
  if(look.kind==="thanos")return look.pose==="cast"?"thanos_cast":look.pose==="snap"?"thanos_snap":"thanos";
  if(look.kind==="final"||(look.type==="boss"&&look.final)||look.final)return "final";
  return look.type||null;
}
function artLoad(done){
  var left=3;
  function tick(){if(--left<=0){ART.ready=1;if(done)done();}}
  var mj=new XMLHttpRequest();
  mj.onload=function(){
    try{ART.meta=JSON.parse(mj.responseText);}catch(e){ART.meta={};}
    var keys=Object.keys(ART.meta||{}),i;
    left+=keys.length;
    tick();
    for(i=0;i<keys.length;i++)(function(k){
      var im=new Image();im.onload=function(){ART.imgs[k]=im;tick();};im.onerror=tick;
      im.src=(ART.meta[k]&&ART.meta[k].file)||("assets/spr/"+k+".webp");
    })(keys[i]);
  };
  mj.onerror=tick;mj.open("GET","assets/spr/meta.json?v=20.4");mj.send();
  var mw=new Image();mw.onload=function(){ART.menuWide=mw;tick();};mw.onerror=tick;mw.src="assets/ui/menu-wide.webp?v=20.4";
  var ar=new Image();ar.onload=function(){ART.arena=ar;if(map){map.chunks={};map.dirty=1;}tick();};ar.onerror=tick;ar.src="assets/env/arena.webp?v=20.4";
}
function artEntry(look,dir,pose){
  if(!ART.ready||!ART.meta)return null;
  var k=artLookKey(look);if(!k||!ART_MAP[k])return null;
  var away=dir===5||dir===6||dir===7, name=away&&ART_MAP[k].b?ART_MAP[k].b:ART_MAP[k].f;
  if(pose==="laser"&&k==="trueno"&&ART_MAP[k].laser)name=ART_MAP[k].laser;
  var img=ART.imgs[name],meta=ART.meta[name];
  if(!img||!img.width||!meta)return null;
  if(look.tint)img=artTint(name,img,look.tint);
  var fl=(dir<=1||dir===7)?1:(dir>=3&&dir<=5)?-1:1;
  return{img:img,meta:meta,flip:fl<0,key:k,name:name};
}
function artTargetH(look,sc){
  var h=31*sc*(CFG.CHAR||1); /* v20.2.1: characters 18% smaller in world units, camera a bit closer */

  if(look&&look.kind==="colossus")h*=2.4;
  else if(look&&look.kind==="home")h*=1.85;
  else if(look&&look.kind==="gorgon")h*=2.5;
  else if(look&&look.kind==="thanos")h*=2.75*(look.pose==="cast"?1.2:look.pose==="snap"?1.03:1);
  else if(look&&(look.kind==="final"||look.final||(look.type==="boss"&&!look.kind)))h*=2.65;
  else if(look&&(look.type==="tank"||look.type==="armored"))h*=1.25;
  else if(look&&(look.type==="crawler"||look.type==="mini"))h*=0.7;
  else if(look&&look.type==="fast")h*=0.9;
  if(look&&look.kind==="player"&&look.bulk)h*=1.08;
  return h*(look&&(look._artScale||1));
}

var ART_SH={};
function artShadowSpr(e){
  var k=(e.meta&&e.meta.file)||e.key||"x";
  if(ART_SH[k])return ART_SH[k];
  var im=e.img,pad=10,c=document.createElement("canvas");
  c.width=im.width+pad*2;c.height=im.height+pad*2;
  var g=c.getContext("2d");
  g.filter="blur(3px)";g.drawImage(im,pad,pad);g.filter="none";
  g.globalCompositeOperation="source-in";g.fillStyle="#000";g.fillRect(0,0,c.width,c.height);
  ART_SH[k]={c:c,pad:pad,w:im.width,h:im.height};return ART_SH[k];
}
/* Contact blob + squashed silhouette, light from upper-left (shadow falls down-right). */
function drawArtShadow(s,e,W,H,look,bob,opts){
  opts=opts||{};
  var sc=layout.scale,m=e.meta,fx=m.fx!=null?m.fx:0.5,fy=m.fy!=null?m.fy:1;
  var hover=look&&look.kind==="home";
  var lift=(opts.lift||0)*sc;
  if(opts.air||hover)lift+=(hover?16:10)*sc;
  if(hover)lift+=Math.abs(Math.sin((game.time||0)*3.5)*4*sc);
  var up=Math.max(0,lift+Math.max(0,-bob));
  var fade=clamp(1-up/(56*sc),hover?0.22:0.18,1);
  if(opts.dying)fade*=clamp(opts.dieP||0,0.15,1);
  var shrink=0.58+0.42*fade;
  /* v20.3: one soft grounded contact shadow centred under the feet (no skewed silhouette) */
  var big=look&&(look.kind==="colossus"||look.kind==="thanos"||look.kind==="gorgon"||look.kind==="final"||look.type==="boss");
  var footW=W*(look&&look.type==="crawler"?0.56:big?0.42:0.55)*shrink,footH=Math.max(3,footW*0.34);
  ctx.save();ctx.globalAlpha=fade;
  ctx.drawImage(softShadowSpr(),s.x-footW,s.y-footH*1.05,footW*2,footH*2);
  ctx.restore();ctx.globalAlpha=1;
}
var _softSh=null;
function softShadowSpr(){
  if(_softSh)return _softSh;
  var c=document.createElement("canvas");c.width=64;c.height=64;var g=c.getContext("2d"),gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,"rgba(8,12,4,0.92)");gr.addColorStop(0.55,"rgba(8,12,4,0.74)");gr.addColorStop(0.85,"rgba(8,12,4,0.28)");gr.addColorStop(1,"rgba(0,0,0,0)");
  g.fillStyle=gr;g.fillRect(0,0,64,64);_softSh=c;return c;
}
function drawBodyShadow(s,bodyW,bob,opts,look){
  opts=opts||{};
  var sc=layout.scale,hover=look&&look.kind==="home";
  var lift=(opts.lift||0)*sc+(opts.air||hover?(hover?16:10)*sc:0);
  var up=Math.max(0,lift+Math.max(0,-(bob||0)));
  var fade=clamp(1-up/(56*sc),hover?0.22:0.18,1);
  var shrink=0.58+0.42*fade;
  var footW=bodyW*0.70*shrink,footH=Math.max(3,footW*0.30);
  var ox=7*sc*shrink,oy=2*sc;
  ctx.fillStyle="rgba(0,0,0,"+(0.30*fade)+")";
  fillEllipse(ctx,s.x+ox*0.3,s.y+oy,footW,footH);
  ctx.fillStyle="rgba(0,0,0,"+(0.16*fade)+")";
  fillEllipse(ctx,s.x+ox,s.y+oy,bodyW*0.55*shrink,bodyW*0.22*shrink);
}


function artWaist(look){
  if(!look)return 0.57;
  if(look.kind==="colossus")return 0.55;
  if(look.kind==="gorgon")return 0.52;
  if(look.kind==="final")return 0.58;
  if(look.kind==="zombie")return (look.type==="tank"||look.type==="armored")?0.56:0.57;
  if(look.hero==="gompa")return 0.54;
  if(look.hero==="neizan")return 0.58;
  if(look.hero==="classic"||look.hero==="trueno")return 0.56;
  if(look.hero==="mr")return 0.55;
  return 0.57;
}
/* Walk using the sprite's own legs (correct pants, shoes, outlines) instead of procedural sticks. */
/* v20.3: living heroes. Each hero sprite is split at runtime (cached per image, so skins/tints work)
   into body, head and both arms; legs keep the sprite's own pants and shoes. Limbs are posed every frame:
   running stride with foot lift, counter-swinging arms, body bob and lean into the run, lagging head,
   idle breathing, and the weapon arm tracks the aim (pistol/knife/dumbbell/lightning hand) with
   wind-up / recoil / throw on attack. Polygons are in normalised sprite coords. */
var HERO_RIG={
  classic_f:{neck:0.335,waist:0.56,cut:0.6,L:{p:[0.20,0.39],poly:[[0.10,0.33],[0.30,0.35],[0.31,0.62],[0.28,0.76],[0,0.76],[0,0.45]]},
             R:{p:[0.80,0.41],poly:[[0.71,0.36],[0.86,0.36],[1,0.5],[1,0.73],[0.79,0.73],[0.77,0.55],[0.73,0.45]]}},
  classic_b:{neck:0.33,waist:0.56,cut:0.6,L:{p:[0.20,0.39],poly:[[0.08,0.33],[0.30,0.35],[0.30,0.62],[0.28,0.76],[0,0.76],[0,0.45]]},
             R:{p:[0.80,0.41],poly:[[0.70,0.35],[0.88,0.36],[1,0.5],[1,0.75],[0.78,0.75],[0.76,0.55],[0.72,0.45]]}},
  trueno_f:{neck:0.36,waist:0.56,cut:0.6,L:{p:[0.18,0.43],poly:[[0.06,0.39],[0.22,0.37],[0.32,0.45],[0.27,0.62],[0.25,0.75],[0,0.75],[0,0.48]]},
             R:{p:[0.80,0.42],poly:[[0.70,0.36],[0.87,0.37],[1,0.5],[1,0.69],[0.79,0.69],[0.77,0.52],[0.72,0.45]]}},
  mr_f:{neck:0.33,waist:0.55,cut:0.64,black:1,L:{p:[0.17,0.38],poly:[[0.07,0.33],[0.25,0.32],[0.27,0.6],[0.27,0.77],[0,0.77],[0,0.45]]},
             R:{p:[0.80,0.39],poly:[[0.71,0.33],[0.86,0.35],[1,0.55],[1,0.70],[0.79,0.70],[0.78,0.55],[0.74,0.45]]}},
  gompa_f:{neck:0.30,waist:0.54,cut:0.5,grey:1,L:{p:[0.20,0.35],poly:[[0.06,0.28],[0.30,0.28],[0.31,0.5],[0.31,0.79],[0,0.79],[0,0.4]]},
             R:{p:[0.80,0.33],poly:[[0.71,0.27],[0.745,0.19],[0.89,0.23],[1,0.5],[1,0.68],[0.81,0.68],[0.76,0.5],[0.72,0.35]]}},
  neizan_f:{neck:0.30,waist:0.58,cut:0.6,black:1,L:{p:[0.17,0.34],poly:[[0.10,0.30],[0.27,0.30],[0.25,0.45],[0.22,0.60],[0.24,0.73],[0,0.73],[0,0.40]]},
             R:{p:[0.80,0.33],poly:[[0.72,0.29],[0.86,0.30],[1,0.48],[1,0.72],[0.82,0.72],[0.80,0.58],[0.79,0.45],[0.74,0.38]]}}
};
function rigParts(name,img){
  var key="_rig_"+name;if(img[key])return img[key];
  var R=HERO_RIG[name],iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
  function cv(){var c=document.createElement("canvas");c.width=iw;c.height=ih;return c;}
  function path(g,poly){g.beginPath();for(var i=0;i<poly.length;i++){var x=poly[i][0]*iw,y=poly[i][1]*ih;if(i)g.lineTo(x,y);else g.moveTo(x,y);}g.closePath();}
  /* arm = polygon minus clothes that belong to the body (pants below the cut line, gompa's grey vest) */
  function arm(a){
    var c=cv(),g=c.getContext("2d");path(g,a.poly);g.clip();g.drawImage(img,0,0);
    try{
      var d=g.getImageData(0,0,iw,ih),px=d.data,x,y,i,r,gg,b,v,mn,cutY=Math.floor((R.cut||0.6)*ih);
      for(y=0;y<ih;y++)for(x=0;x<iw;x++){i=(y*iw+x)*4;if(!px[i+3])continue;r=px[i];gg=px[i+1];b=px[i+2];v=Math.max(r,gg,b);mn=Math.min(r,gg,b);
        if(R.grey&&v>120&&(v-mn)<v*0.14){px[i+3]=0;continue;}
        if(y>cutY&&(a===R.L?x>iw*0.19:x<iw*0.86)&&((b>r+10&&v<135)||(R.black&&v<60)))px[i+3]=0;}
      g.putImageData(d,0,0);
    }catch(e){}
    return c;
  }
  var L=arm(R.L),Rr=arm(R.R);
  var body=cv(),bg=body.getContext("2d");bg.drawImage(img,0,0);
  bg.globalCompositeOperation="destination-out";bg.drawImage(L,0,0);bg.drawImage(Rr,0,0);
  try{ /* drop the faint anti-aliased remnants the cut leaves inside the arm areas */
    var mk=cv(),mg=mk.getContext("2d");mg.fillStyle="#fff";path(mg,R.L.poly);mg.fill();path(mg,R.R.poly);mg.fill();
    var md=mg.getImageData(0,0,iw,ih).data,bd=bg.getImageData(0,0,iw,ih),bp=bd.data,j;
    for(j=3;j<bp.length;j+=4)if(md[j]>0&&bp[j]<235)bp[j]=0;
    bg.putImageData(bd,0,0);
  }catch(e){}
  /* v20.3.1: islands. Pixels the polygon cut strands (cuff outlines, strap or shoulder slivers) used to float
     next to the hip/shoulder once the arm swung away. Each arm keeps only its main piece (strays go back to the
     body), then any body piece not connected to the main body moves to the arm whose polygon holds it. */
  try{
    var A=[[L,R.L],[Rr,R.R]],q=new Int32Array(iw*ih);
    function comp(dat,seedFn){ /* label 8-connected opaque pixels; return Uint8Array keep-mask of the chosen component */
      var lab=new Int32Array(iw*ih),n=0,best=0,bestN=0,sizes=[0],i0,qh,qt,k,x0,y0,dx,dy,nx,ny,ni;
      for(i0=0;i0<iw*ih;i0++){if(lab[i0]||dat[i0*4+3]<24)continue;n++;lab[i0]=n;qh=0;qt=0;q[qt++]=i0;var cnt=0;
        while(qh<qt){k=q[qh++];cnt++;x0=k%iw;y0=(k/iw)|0;
          for(dy=-1;dy<=1;dy++)for(dx=-1;dx<=1;dx++){nx=x0+dx;ny=y0+dy;if(nx<0||ny<0||nx>=iw||ny>=ih)continue;ni=ny*iw+nx;if(!lab[ni]&&dat[ni*4+3]>=24){lab[ni]=n;q[qt++]=ni;}}}
        sizes.push(cnt);}
      var pick=seedFn?seedFn(lab):0;if(!pick){for(k=1;k<=n;k++)if(sizes[k]>bestN){bestN=sizes[k];best=k;}pick=best;}
      var keep=new Uint8Array(iw*ih);for(k=0;k<iw*ih;k++)keep[k]=lab[k]===pick?1:(lab[k]?2:0);return keep;
    }
    var bd2=bg.getImageData(0,0,iw,ih),bp2=bd2.data,ai,ad,ap,keep,j2;
    for(ai=0;ai<2;ai++){var ac=A[ai][0].getContext("2d");ad=ac.getImageData(0,0,iw,ih);ap=ad.data;keep=comp(ap);
      for(j2=0;j2<iw*ih;j2++)if(keep[j2]===2){var o=j2*4,sa=ap[o+3]/255,da=bp2[o+3]/255,oa=sa+da*(1-sa);
        if(oa>0){bp2[o]=(ap[o]*sa+bp2[o]*da*(1-sa))/oa;bp2[o+1]=(ap[o+1]*sa+bp2[o+1]*da*(1-sa))/oa;bp2[o+2]=(ap[o+2]*sa+bp2[o+2]*da*(1-sa))/oa;bp2[o+3]=oa*255;}
        ap[o+3]=0;}
      ac.putImageData(ad,0,0);A[ai].push(ac,ad);}
    keep=comp(bp2,function(lab){var sx=[0.5,0.5,0.45,0.55],sy=[0.45,0.3,0.5,0.5],m;for(m=0;m<4;m++){var v=lab[Math.floor(sy[m]*ih)*iw+Math.floor(sx[m]*iw)];if(v)return v;}return 0;});
    var mL=document.createElement("canvas");mL.width=iw;mL.height=ih;var gL=mL.getContext("2d");gL.fillStyle="#fff";path(gL,R.L.poly);gL.fill();var mLd=gL.getImageData(0,0,iw,ih).data;
    gL.clearRect(0,0,iw,ih);path(gL,R.R.poly);gL.fill();var mRd=gL.getImageData(0,0,iw,ih).data;
    for(j2=0;j2<iw*ih;j2++)if(keep[j2]===2){var o2=j2*4,tgt=mLd[o2+3]?A[0]:mRd[o2+3]?A[1]:null;if(!tgt)continue;
      var tp=tgt[3].data;if(tp[o2+3]<bp2[o2+3]){tp[o2]=bp2[o2];tp[o2+1]=bp2[o2+1];tp[o2+2]=bp2[o2+2];tp[o2+3]=bp2[o2+3];}bp2[o2+3]=0;}
    A[0][2].putImageData(A[0][3],0,0);A[1][2].putImageData(A[1][3],0,0);bg.putImageData(bd2,0,0);
  }catch(e){}
  /* v20.3.4: joints that never open. (1) Shoulder caps: the top of each arm, feathered, is baked into the body so a
     swinging arm always rotates over its own shoulder instead of uncovering a hole in the torso. (2) Legs are split
     along the real gap between them (no shared overlap strip below the crotch, which used to drag dark slivers of the
     other leg along) and keep a soft shared overlap only above the crotch, where the pants are one piece. */
  var legs=null,caps=[null,null];
  try{
    var sides=[[R.L,L],[R.R,Rr]],si;
    /* (0a) thin contour slivers of an arm left in the body (they floated next to the torso when the arm swung) go to
       that arm. (0b) the torso side the arm hid is rebuilt by mirroring the torso's own cloth outward (shaded), so a
       swinging arm reveals body, not a hole or a streak. */
    (function(){var oc=cv(),og=oc.getContext("2d");og.drawImage(img,0,0);var op=og.getImageData(0,0,iw,ih).data;
      var bdF=bg.getImageData(0,0,iw,ih),bF=bdF.data,mk2=cv(),mg2=mk2.getContext("2d"),y,x,k,ai2,mid3=iw*0.5;
      var fm=new Uint8Array(iw*ih);
      for(ai2=0;ai2<2;ai2++){var A2=ai2?R.R:R.L,dir=ai2?-1:1,AC=(ai2?Rr:L).getContext("2d"),AD=AC.getImageData(0,0,iw,ih),AP=AD.data;
        mg2.clearRect(0,0,iw,ih);mg2.strokeStyle="#fff";mg2.lineWidth=Math.max(4,iw*0.05);mg2.lineJoin="round";mg2.fillStyle="#fff";path(mg2,A2.poly);mg2.fill();mg2.stroke();var mp=mg2.getImageData(0,0,iw,ih).data;
        var thin=Math.max(3,Math.round(iw*0.03)),yA=Math.floor(ih*(A2.p[1]-0.08)),yB=Math.min(ih-1,Math.ceil(ih*(R.waist+0.02)));
        for(y=Math.max(0,yA);y<=yB;y++){var rs=-1;for(x=0;x<=iw;x++){var on=x<iw&&bF[(y*iw+x)*4+3]>24;
          if(on&&rs<0)rs=x;else if(!on&&rs>=0){var len=x-rs,cxr=(rs+x)/2;if(len<=thin&&Math.abs(cxr-mid3)>iw*0.16&&mp[(y*iw+Math.round(cxr))*4+3]){
              for(k=rs;k<x;k++){var o8=(y*iw+k)*4;if(AP[o8+3]<bF[o8+3]){AP[o8]=bF[o8];AP[o8+1]=bF[o8+1];AP[o8+2]=bF[o8+2];AP[o8+3]=bF[o8+3];}bF[o8+3]=0;}}rs=-1;}}}
        AC.putImageData(AD,0,0);
        var y0=Math.floor(ih*(A2.p[1]+0.05)),y1=Math.floor(ih*R.waist),maxD=Math.round(iw*0.06);
        for(y=y0;y<=y1;y++){
          var edge=-1;for(x=Math.round(mid3);ai2?x<iw:x>=0;x-=dir){if(bF[(y*iw+x)*4+3]<200){edge=x;break;}}
          if(edge<0)continue;
          var prof=Math.sin(Math.PI*Math.min(1,(y-y0+2)/(y1-y0+4))),mD=Math.max(2,Math.round(maxD*(0.25+0.75*prof)));
          for(k=0;k<mD;k++){x=edge-dir*k;var xs=edge+dir*(k+2);if(x<0||x>=iw||xs<0||xs>=iw)break;var o7=(y*iw+x)*4,os=(y*iw+xs)*4;
            if(op[o7+3]<40||bF[os+3]<200)break;if(bF[o7+3]>=230)continue;
            var sh=0.8-0.2*(k/mD),fa=Math.min(1,(mD-k)/(mD*0.45))*Math.min(1,0.35+prof);bF[o7]=bF[os]*sh;bF[o7+1]=bF[os+1]*sh;bF[o7+2]=bF[os+2]*sh;bF[o7+3]=Math.max(bF[o7+3],255*fa);fm[y*iw+x]=1;}}}
      /* soften the rebuilt cloth (2 box passes over the filled pixels only) so it reads as shaded fabric, not streaks */
      var rad=Math.max(1,Math.round(iw*0.012));for(var pass=0;pass<2;pass++){var cp=new Uint8ClampedArray(bF);
        for(y=0;y<ih;y++)for(x=0;x<iw;x++){if(!fm[y*iw+x])continue;var sr=0,sg=0,sb=0,sn=0,yy,xx;
          for(yy=Math.max(0,y-rad);yy<=Math.min(ih-1,y+rad);yy++)for(xx=Math.max(0,x-rad);xx<=Math.min(iw-1,x+rad);xx++){var q2=(yy*iw+xx)*4;if(cp[q2+3]<200)continue;sr+=cp[q2];sg+=cp[q2+1];sb+=cp[q2+2];sn++;}
          if(sn){var q3=(y*iw+x)*4;bF[q3]=sr/sn;bF[q3+1]=sg/sn;bF[q3+2]=sb/sn;}}}
      bg.putImageData(bdF,0,0);})();
    for(si=0;si<2;si++){var a2=sides[si][0],cpx=a2.p[0]*iw,cpy=(a2.p[1]-0.025)*ih,rc=ih*(R.capR||0.095);
      var tc=cv(),tg=tc.getContext("2d");tg.drawImage(sides[si][1],0,0);tg.globalCompositeOperation="destination-in";
      var rg=tg.createRadialGradient(cpx,cpy,0,cpx,cpy,rc);rg.addColorStop(0,"rgba(0,0,0,1)");rg.addColorStop(0.55,"rgba(0,0,0,1)");rg.addColorStop(1,"rgba(0,0,0,0)");
      tg.fillStyle=rg;tg.fillRect(0,0,iw,ih);
      bg.drawImage(tc,0,0);var bx0=Math.max(0,Math.floor(cpx-rc)),by0=Math.max(0,Math.floor(cpy-rc)),bx1=Math.min(iw,Math.ceil(cpx+rc)),by1=Math.min(ih,Math.ceil(cpy+rc));tc._bb=[bx0,by0,Math.max(1,bx1-bx0),Math.max(1,by1-by0)];caps[si]=tc;}
    var ly0=Math.floor(ih*(R.waist-0.08)),bd4=bg.getImageData(0,0,iw,ih),b4=bd4.data,mid2=iw*0.5,c0=Math.floor(mid2-iw*0.16),c1=Math.ceil(mid2+iw*0.16),y,x,sp=new Float32Array(ih),gapY=ih,run2=0;
    for(y=ly0;y<ih;y++){var bestA=1e9,bc=-1;for(x=c0+1;x<c1-1;x++){var al=b4[(y*iw+x-1)*4+3]+b4[(y*iw+x)*4+3]*2+b4[(y*iw+x+1)*4+3];if(al<bestA||(al===bestA&&Math.abs(x-mid2)<Math.abs(bc-mid2))){bestA=al;bc=x;}}
      if(bestA<160){sp[y]=bc;run2++;if(run2===3&&gapY===ih)gapY=y-2;}else{sp[y]=-1;run2=0;}}
    var last=mid2;for(y=ly0;y<ih;y++){if(sp[y]<0||y<gapY)sp[y]=(y<gapY?mid2:last);last=sp[y];}
    var pad2=iw*0.07,LLc=cv(),LRc=cv(),gl2=LLc.getContext("2d"),gr2=LRc.getContext("2d"),dL=gl2.createImageData(iw,ih),dR=gr2.createImageData(iw,ih),pL=dL.data,pR=dR.data;
    var wyc=ih*R.waist;for(y=ly0;y<ih;y++)for(x=0;x<iw;x++){var o4=(y*iw+x)*4,A4=b4[o4+3];if(!A4)continue;if(y<wyc&&Math.abs(x-mid2)>iw*0.2)continue;var wl,wr;
      if(y<gapY){wl=clamp((mid2+pad2*1.6-x)/(pad2*0.8),0,1);wr=clamp((x-(mid2-pad2*1.6))/(pad2*0.8),0,1);}else{wl=x<sp[y]?1:0;wr=1-wl;}
      if(wl>0){pL[o4]=b4[o4];pL[o4+1]=b4[o4+1];pL[o4+2]=b4[o4+2];pL[o4+3]=A4*wl;}
      if(wr>0){pR[o4]=b4[o4];pR[o4+1]=b4[o4+1];pR[o4+2]=b4[o4+2];pR[o4+3]=A4*wr;}}
    gl2.putImageData(dL,0,0);gr2.putImageData(dR,0,0);legs={L:LLc,R:LRc,y0:ly0,cy:gapY};
  }catch(e){legs=null;}
  /* v20.3.4: draw only each limb's bounding box (less raster work per frame than full-sprite canvases) */
  function pbb(poly){var x0=1,y0=1,x1=0,y1=0;for(var i=0;i<poly.length;i++){x0=Math.min(x0,poly[i][0]);x1=Math.max(x1,poly[i][0]);y0=Math.min(y0,poly[i][1]);y1=Math.max(y1,poly[i][1]);}
    var m=0.04,a=Math.max(0,Math.floor((x0-m)*iw)),b=Math.max(0,Math.floor((y0-m)*ih)),c=Math.min(iw,Math.ceil((x1+m)*iw)),d=Math.min(ih,Math.ceil((y1+m)*ih));return [a,b,Math.max(1,c-a),Math.max(1,d-b)];}
  L._bb=pbb(R.L.poly);Rr._bb=pbb(R.R.poly);
  if(legs){var lm=Math.floor(iw*0.5+iw*0.07*1.6+2);legs.L._bb=[0,legs.y0,Math.min(iw,lm),ih-legs.y0];var rm=Math.max(0,Math.floor(iw*0.5-iw*0.07*1.6-2));legs.R._bb=[rm,legs.y0,iw-rm,ih-legs.y0];}
  img[key]={body:body,L:L,R:Rr,iw:iw,ih:ih,rig:R,legs:legs,capL:caps[0],capR:caps[1]};
  return img[key];
}
/* v20.3.1: split one not-yet-cached hero sprite per call (menu frames), so the first run/turn in-game never hitches */
function rigWarm(hero){
  if(typeof makeHeroLook!=="function")return;var look=makeHeroLook(hero),d,ps=["idle","walk","atk"],k,e;
  for(d=0;d<8;d++)for(k=0;k<3;k++){e=artEntry(look,d,ps[k]);if(e&&e.img&&HERO_RIG[e.name]&&(e.img.naturalWidth||e.img.width)&&!e.img["_rig_"+e.name]){rigParts(e.name,e.img);return;}}
}
function drawHeroRig(e,name,look,anim,pose,H,W,fx,fy,opts){
  var P=rigParts(name,e.img),R=P.rig,iw=P.iw,ih=P.ih,t=(game&&game.time)||0;
  function dX(sx){return -W*fx+sx*W;} function dY(sy){return -H*fy+sy*H;}
  var run=pose==="walk",ph=(anim||0)*2.25,s1=Math.sin(ph),c1=Math.cos(ph);
  var hero=look.hero||"classic",flip=e.flip?-1:1;
  /* legs */
  var amp=run?0.42:0,aL=s1*amp,aR=-s1*amp;
  var waist=R.waist,srcY=Math.floor(ih*(waist-0.08)),srcH=ih-srcY,mid=iw*0.5,pad=Math.floor(iw*0.07);
  function leg(side,ang){
    var sx0=side<0?0:Math.max(0,Math.floor(mid-pad)),sw=side<0?Math.min(iw,Math.ceil(mid+pad))-sx0:iw-sx0;
    var lf=run?Math.max(0,side<0?-c1:c1):0,hx=dX((mid+side*iw*0.11)/iw),hy=dY(waist),lift=lf*H*0.04;
    var bend=1-0.08*lf;
    ctx.save();ctx.translate(hx,hy-lift);ctx.rotate(ang);ctx.scale(1,bend);
    if(P.legs){var lc=side<0?P.legs.L:P.legs.R,lb=lc._bb;ctx.drawImage(lc,lb[0],lb[1],lb[2],lb[3],dX(lb[0]/iw)-hx,dY(lb[1]/ih)-hy,W*lb[2]/iw,H*lb[3]/ih);}
    else ctx.drawImage(P.body,sx0,srcY,sw,srcH,dX(sx0/iw)-hx,dY(srcY/ih)-hy,W*(sw/iw),H*(srcH/ih));
    ctx.restore();
  }
  /* arms: hanging angle 0; positive rotates the hand toward -x (back) in sprite space */
  var swing=run?0.62:0.05,armL=-aL/amp*swing||0,armR=-aR/amp*swing||0;
  if(!run){armL=Math.sin(t*2.2)*0.05;armR=-Math.sin(t*2.2+0.4)*0.05;}
  var atk=0;if(opts.atkT>0||opts.meleeSwing>0||opts.muzzle>0){var mx=opts.atkMax||0.2,tl=opts.atkT||opts.meleeSwing||opts.muzzle||0;atk=1-clamp(tl/Math.max(0.06,mx),0,1);}
  var aim=opts.aim!=null?opts.aim:0,sa=Math.atan2(Math.sin(aim)*CFG.YSCALE,Math.cos(aim));
  var la=flip<0?Math.PI-sa:sa;la=Math.atan2(Math.sin(la),Math.cos(la));
  var aimRot=clamp(la-Math.PI/2,-2.6,0.5);   /* rotation that points the hanging arm at the target */
  var gun=opts.wpn&&opts.wpn!=="bell"&&opts.wpn!=="bolt"&&opts.wpn!=="knife"&&opts.wpn!=="fist"&&opts.wpn!=="machete"&&opts.wpn!=="mega_hulk";
  if(gun){armR=aimRot+(opts.muzzle>0?0.18*Math.max(0,1-atk*2.5):0)+(run?s1*0.05:0)+(opts.nzKick||0)*0.24+(opts.heavy?Math.sin(t*40)*0.025:0);
    /* v20.3.1: the off-hand used to swing ~60 deg across the chest toward the gun (it can't reach it from the near
       shoulder), leaving a fist floating on the belly. Now it stays attached and relaxed: a small brace toward the
       aim, a twitch with the recoil, and a reduced counter-swing while running. */
    var brace=clamp(aimRot*0.16,-0.26,0.08)-(opts.muzzle>0?0.06*Math.max(0,1-atk*2.5):0);
    armL=run?armL*0.55+brace*0.5:brace+Math.sin(t*2.2)*0.035;}
  else if(hero==="mr"&&opts.wpn){ /* knife: held low and ready, wind back then whip the throw */
    var rest=-0.35+(run?armR*0.6:0);
    armR=atk>0?(atk<0.3?rest+0.9*(atk/0.3):rest+0.9+(aimRot-rest-0.9)*Math.min(1,(atk-0.3)/0.25)):rest;
  }else if(hero==="gompa"){ /* dumbbells: heavy swing, both arms smash toward the target on attack */
    armL*=0.8;armR*=0.8;
    if(atk>0){var k=atk<0.35?-(atk/0.35)*0.7:-0.7+((atk-0.35)/0.65)*1.7*Math.max(0,1-(atk-0.6)*1.4);armR=aimRot*Math.min(1,atk*2.2)+k*0.4;armL=clamp(aimRot*0.3,-0.5,0.15)*Math.min(1,atk*2.2)+armL*(1-Math.min(1,atk*2.2));} /* v20.3.1: off-arm pumps forward instead of crossing the chest */
  }else if(hero==="trueno"){ /* lightning hands: arms thrust to the target while casting */
    if(atk>0||opts.laser){var u=opts.laser?1:Math.min(1,atk*3);armR=armR+(aimRot-armR)*u;armL=armL+(clamp(aimRot*0.3,-0.48,0.12)-armL)*u;} /* v20.3.1: off-hand braces, no chest cross */
  }
  if(opts.armR!=null)armR=opts.armR;if(opts.armL!=null)armL=opts.armL; /* v20.3: posed by the ending cinematic */
  opts._armL=armL;opts._armR=armR; /* v20.3.3: mega overlays (repulsor palms) */
  function drawArm(side,rot){
    var a=side<0?R.L:R.R,c=side<0?P.L:P.R,px=dX(a.p[0]),py=dY(a.p[1]);
    var cap=side<0?P.capL:P.capR; /* v20.3.4: deltoid follows at half the angle, so a big raise keeps a rounded, filled shoulder */
    if(cap&&Math.abs(rot)>0.12){var bb=cap._bb;ctx.save();ctx.translate(px,py);ctx.rotate(rot*0.5);ctx.drawImage(cap,bb[0],bb[1],bb[2],bb[3],dX(bb[0]/iw)-px,dY(bb[1]/ih)-py,W*bb[2]/iw,H*bb[3]/ih);ctx.restore();}
    var ab=c._bb;ctx.save();ctx.translate(px,py);ctx.rotate(rot);if(ab)ctx.drawImage(c,ab[0],ab[1],ab[2],ab[3],dX(ab[0]/iw)-px,dY(ab[1]/ih)-py,W*ab[2]/iw,H*ab[3]/ih);else ctx.drawImage(c,-px-W*fx,-py-H*fy,W,H);ctx.restore();
  }
  /* body bob, breathing and lean are applied by the caller; head adds lag */
  var headY=run?Math.sin(ph*2-0.9)*H*0.012:Math.sin(t*2.2-0.6)*H*0.006,headR=run?-s1*0.03:Math.sin(t*1.1)*0.015;
  if(opts.headR)headR+=opts.headR;
  drawArm(1,armR);
  if(P.legs&&run&&Math.abs(s1)>0.25){var cw0=Math.floor(iw*0.4),cx0=Math.floor(iw*0.3),cy0=Math.floor(ih*waist),ch0=Math.max(1,Math.min(ih,P.legs.cy+Math.ceil(ih*0.015))-cy0); /* static crotch under the swinging legs */
    ctx.drawImage(P.body,cx0,cy0,cw0,ch0,dX(cx0/iw),dY(cy0/ih),W*(cw0/iw),H*(ch0/ih));}
  if(run&&s1>=0){leg(-1,aR);leg(1,aL);}else{leg(1,aL);leg(-1,aR);}
  var neckY=Math.floor(ih*R.neck),torsoBot=Math.min(ih,Math.ceil(ih*(waist+0.07)));
  var br=run?1:1+Math.sin(t*2.2)*0.014;
  ctx.save();ctx.translate(0,dY(waist));ctx.scale(1,br);ctx.translate(0,-dY(waist));
  ctx.drawImage(P.body,0,neckY,iw,torsoBot-neckY,dX(0),dY(neckY/ih),W,H*((torsoBot-neckY)/ih));
  ctx.restore();
  var hpY=dY(R.neck)+(br-1)*(dY(R.neck)-dY(waist));
  ctx.save();ctx.translate(0,hpY+headY);ctx.rotate(headR);
  var hb=Math.min(ih,neckY+Math.ceil(ih*0.025));
  ctx.drawImage(P.body,0,0,iw,hb,dX(0),dY(0)-hpY,W,H*(hb/ih));ctx.restore();
  drawArm(-1,armL);
  /* weapon hand = far (image-right) hand at the end of the posed arm */
  var hx=(e.meta.hx!=null?e.meta.hx:0.9),hy=(e.meta.hy!=null?e.meta.hy:0.64);hx=0.5+(hx-0.5)*0.86;
  var ax=dX(R.R.p[0]),ay=dY(R.R.p[1]),vx=dX(hx)-ax,vy=dY(hy)-ay,cr=Math.cos(armR),sr=Math.sin(armR);
  var lx=ax+vx*cr-vy*sr,ly=ay+vx*sr+vy*cr;
  if(ctx.getTransform&&typeof DOMPoint!=="undefined")return new DOMPoint(lx,ly).matrixTransform(ctx.getTransform());
  return null;
}
/* v20.4: zombies/bosses get the same joint treatment as the heroes. The old walk swung everything below the waist,
   so the hanging hands (and shirt rags) were sliced off the arms and swung with the legs. Now the legs are grown up
   from the feet (connected pixels only, so a hand hanging beside the hip stays on the body), split along the real gap
   between them, and the static body keeps the arms, hands and a hip overlap that covers the joint. Cached per image. */
var _zlegBudget=0,_zlegFrame=-1;
function zLegParts(img,waist){
  var key="_zleg"+Math.round(waist*100);if(img[key]!==undefined)return img[key];
  var fr=(game&&game.time)||0;if(_zlegFrame!==fr){_zlegFrame=fr;_zlegBudget=2;}
  if(_zlegBudget<=0)return null;_zlegBudget--;
  var iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,res=null;
  try{
    var c=document.createElement("canvas");c.width=iw;c.height=ih;var g=c.getContext("2d");g.drawImage(img,0,0);
    var d=g.getImageData(0,0,iw,ih),px=d.data,x,y,o,TH=40;
    var y0=Math.max(0,Math.floor(ih*(waist-0.08))),wy=Math.floor(ih*waist),tb=Math.min(ih,Math.ceil(ih*(waist+0.07)));
    /* band from the feet */
    var fx0=iw,fx1=-1;for(y=Math.floor(ih*0.86);y<ih;y++)for(x=0;x<iw;x++)if(px[(y*iw+x)*4+3]>60){if(x<fx0)fx0=x;if(x>fx1)fx1=x;}
    if(fx1<0){img[key]=null;return null;}
    var mgn=Math.round(iw*0.05),b0=Math.max(0,fx0-mgn),b1=Math.min(iw-1,fx1+mgn);
    /* grow leg runs upward from the feet */
    var leg=new Uint8Array(iw*ih),prev=null,cur,mid0=iw*0.5;
    for(y=ih-1;y>=y0;y--){cur=new Uint8Array(iw);var rs=-1;
      for(x=0;x<=iw;x++){var on=x<iw&&x>=b0&&x<=b1&&px[(y*iw+x)*4+3]>TH;
        if(on&&rs<0)rs=x;else if(!on&&rs>=0){var keep=false,k;
          if(y>=ih*0.86||!prev)keep=true;else for(k=Math.max(0,rs-1);k<=Math.min(iw-1,x);k++)if(prev[k]){keep=true;break;}
          /* above the waist only the central hip strip counts (arms/hands hang outside it) */
          if(keep&&y<wy){var cx=(rs+x)/2;if(Math.abs(cx-iw*0.5)>iw*0.24)keep=false;}
          if(keep)for(k=rs;k<x;k++){cur[k]=1;leg[y*iw+k]=1;}rs=-1;}}
      prev=cur;}
    /* hands that overlap the thigh: flood from the arm pixels beside the hip through arm-coloured pixels; those stay on the body */
    var sr=0,sg=0,sb=0,sn=0,qq=[],hm=new Uint8Array(iw*ih),ys=Math.max(0,wy-Math.floor(ih*0.06));
    for(y=ys;y<tb;y++)for(x=0;x<iw;x++){o=y*iw+x;if(leg[o]||px[o*4+3]<=TH||Math.abs(x-mid0)<iw*0.13)continue;var o4=o*4,mx=Math.max(px[o4],px[o4+1],px[o4+2]);if(mx<55)continue;sr+=px[o4];sg+=px[o4+1];sb+=px[o4+2];sn++;hm[o]=1;qq.push(o);}
    if(sn>8){sr/=sn;sg/=sn;sb/=sn;var qh=0,DD=78*78;
      while(qh<qq.length){var q=qq[qh++],qx=q%iw,qy=(q/iw)|0,dx2,dy2;
        for(dy2=-1;dy2<=1;dy2++)for(dx2=-1;dx2<=1;dx2++){var nx=qx+dx2,ny=qy+dy2;if(nx<0||ny<ys||nx>=iw||ny>=ih)continue;var ni=ny*iw+nx;if(hm[ni]||px[ni*4+3]<=TH)continue;
          var n4=ni*4,e1=px[n4]-sr,e2=px[n4+1]-sg,e3=px[n4+2]-sb;if(e1*e1+e2*e2+e3*e3>DD)continue;hm[ni]=1;qq.push(ni);}}
      /* grow 2px to take the hand's outline too, then hand pixels leave the legs */
      for(var gi=0;gi<2;gi++){var add=[];for(y=ys;y<ih;y++)for(x=1;x<iw-1;x++){o=y*iw+x;if(hm[o]||!leg[o])continue;if(hm[o-1]||hm[o+1]||(y>0&&hm[o-iw])||(y<ih-1&&hm[o+iw]))add.push(o);}for(var ai=0;ai<add.length;ai++)hm[add[ai]]=1;}
      for(o=0;o<iw*ih;o++)if(hm[o])leg[o]=0;}
    /* shirt rags hanging over the hips: flood from the hem through shirt-coloured pixels (limited depth); they stay on the body */
    (function(){var r2=0,g2=0,b2=0,n2=0,y1=Math.max(0,tb-Math.floor(ih*0.05)),yl=Math.min(ih,tb+Math.floor(ih*0.12)),Q=[],sm=new Uint8Array(iw*ih),xx,yy,oo;
      for(yy=y1;yy<tb;yy++)for(xx=0;xx<iw;xx++){oo=yy*iw+xx;var p4=oo*4;if(px[p4+3]<=TH||Math.abs(xx-mid0)>iw*0.2)continue;var mx2=Math.max(px[p4],px[p4+1],px[p4+2]);if(mx2<60)continue;r2+=px[p4];g2+=px[p4+1];b2+=px[p4+2];n2++;}
      if(n2<8)return;r2/=n2;g2/=n2;b2/=n2;var D2=56*56;
      for(xx=0;xx<iw;xx++){oo=(tb-1)*iw+xx;var p5=oo*4;if(px[p5+3]>TH){var f1=px[p5]-r2,f2=px[p5+1]-g2,f3=px[p5+2]-b2;if(f1*f1+f2*f2+f3*f3<=D2){sm[oo]=1;Q.push(oo);}}}
      var h2=0;while(h2<Q.length){var q2=Q[h2++],qx2=q2%iw,qy2=(q2/iw)|0,d1,d2;
        for(d2=0;d2<=1;d2++)for(d1=-1;d1<=1;d1++){var nx2=qx2+d1,ny2=qy2+d2;if(nx2<0||nx2>=iw||ny2>=yl)continue;var nj=ny2*iw+nx2;if(sm[nj]||px[nj*4+3]<=TH)continue;
          var m4=nj*4,k1=px[m4]-r2,k2=px[m4+1]-g2,k3=px[m4+2]-b2;if(k1*k1+k2*k2+k3*k3>D2)continue;sm[nj]=1;Q.push(nj);}}
      for(var gj=0;gj<1;gj++){var ad=[];for(yy=tb;yy<yl;yy++)for(xx=1;xx<iw-1;xx++){oo=yy*iw+xx;if(sm[oo]||!leg[oo])continue;if(sm[oo-1]||sm[oo+1]||sm[oo-iw])ad.push(oo);}for(var aj=0;aj<ad.length;aj++)sm[ad[aj]]=1;}
      for(oo=tb*iw;oo<iw*ih;oo++)if(sm[oo])leg[oo]=0;})();
    /* split line between the legs */
    var mid=iw*0.5,c0=Math.floor(mid-iw*0.16),c1=Math.ceil(mid+iw*0.16),sp=new Float32Array(ih),gapY=ih,run2=0;
    for(y=y0;y<ih;y++){var bestA=1e9,bc=-1;for(x=c0+1;x<c1-1;x++){var al=(leg[y*iw+x-1]?px[(y*iw+x-1)*4+3]:0)+(leg[y*iw+x]?px[(y*iw+x)*4+3]:0)*2+(leg[y*iw+x+1]?px[(y*iw+x+1)*4+3]:0);if(al<bestA||(al===bestA&&Math.abs(x-mid)<Math.abs(bc-mid))){bestA=al;bc=x;}}
      if(bestA<160){sp[y]=bc;run2++;if(run2===3&&gapY===ih)gapY=y-2;}else{sp[y]=-1;run2=0;}}
    var last=mid;for(y=y0;y<ih;y++){if(sp[y]<0||y<gapY)sp[y]=(y<gapY?mid:last);last=sp[y];}
    var Lc=document.createElement("canvas"),Rc=document.createElement("canvas"),Tc=document.createElement("canvas");Lc.width=Rc.width=Tc.width=iw;Lc.height=Rc.height=Tc.height=ih;
    var gl=Lc.getContext("2d"),gr=Rc.getContext("2d"),dL=gl.createImageData(iw,ih),dR=gr.createImageData(iw,ih),pL=dL.data,pR=dR.data,pad=iw*0.07,hb=Math.max(2,ih*0.1);
    for(y=y0;y<ih;y++)for(x=0;x<iw;x++){if(!leg[y*iw+x])continue;o=(y*iw+x)*4;var A=px[o+3],wl,wr;
      if(y<gapY){wl=clamp((mid+pad*1.6-x)/(pad*0.8),0,1);wr=clamp((x-(mid-pad*1.6))/(pad*0.8),0,1);}else{wl=x<sp[y]?1:0;wr=1-wl;}
      if(wl>0){pL[o]=px[o];pL[o+1]=px[o+1];pL[o+2]=px[o+2];pL[o+3]=A*wl;}
      if(wr>0){pR[o]=px[o];pR[o+1]=px[o+1];pR[o+2]=px[o+2];pR[o+3]=A*wr;}
      /* v20.4: the static body fades out over a short hip band instead of a hard cut, so gaps between the
         swinging legs and the rags/hands that stay on the body never show the ground through the hips */
      if(y>=tb){var fb=(y-tb)/hb;px[o+3]=fb>=1?0:A*(1-fb*fb*fb);}}
    gl.putImageData(dL,0,0);gr.putImageData(dR,0,0);Tc.getContext("2d").putImageData(d,0,0);
    var lm=Math.floor(mid+pad*1.6+2),rm=Math.max(0,Math.floor(mid-pad*1.6-2));
    Lc._bb=[0,y0,Math.min(iw,lm),ih-y0];Rc._bb=[rm,y0,iw-rm,ih-y0];
    res={L:Lc,R:Rc,T:Tc,y0:y0,tb:tb};
  }catch(err){res=null;}
  img[key]=res;return res;
}
function drawSpriteWalk(e,look,anim,pose,H,W,fx,fy){
  var iw=e.img.naturalWidth||e.img.width, ih=e.img.naturalHeight||e.img.height;
  if(pose!=="walk"){ctx.drawImage(e.img,-W*fx,-H*fy,W,H);return;}
  var waist=artWaist(look);
  var boss=look&&(look.kind==="colossus"||look.kind==="final");
  var sham=look&&look.kind==="zombie";
  var ph=(anim||0)*(boss?5.1:sham?3.3:6.6); /* v20.3: zombies shamble at a slower, heavier cadence */
  var amp=boss?0.20:sham?0.30:0.26;
  var aL=Math.sin(ph)*amp, aR=Math.sin(ph+Math.PI)*amp;
  var mid=iw*0.5;
  function destX(sx){return -W*fx+(sx/iw)*W;}
  function destY(sy){return -H*fy+(sy/ih)*H;}
  var P=zLegParts(e.img,waist);
  if(P){
    var legP=function(side,ang){var c=side<0?P.L:P.R,bb=c._bb,hx=destX(mid+side*iw*0.11),hy=destY(ih*waist),lift=Math.max(0,Math.sin(ang))*H*0.05;
      ctx.save();ctx.translate(hx,hy-lift);ctx.rotate(ang);ctx.drawImage(c,bb[0],bb[1],bb[2],bb[3],destX(bb[0])-hx,destY(bb[1])-hy,W*bb[2]/iw,H*bb[3]/ih);ctx.restore();};
    if(Math.sin(ph)>=0){legP(-1,aR);legP(1,aL);}else{legP(1,aL);legP(-1,aR);}
    ctx.drawImage(P.T,-W*fx,-H*fy,W,H);
    return;
  }
  var overlap=0.08, srcY=Math.max(0,Math.floor(ih*(waist-overlap))), srcH=ih-srcY, pad=Math.floor(iw*0.07);
  function leg(side,ang){
    var srcX=side<0?0:Math.max(0,Math.floor(mid-pad));
    var srcW=side<0?Math.min(iw,Math.ceil(mid+pad))-srcX:iw-srcX;
    if(srcW<=1)return;
    var hipSx=mid+side*iw*0.11, hipSy=ih*waist, hx=destX(hipSx), hy=destY(hipSy);
    var lift=Math.max(0,Math.sin(ang))*H*0.05;
    ctx.save();ctx.translate(hx,hy-lift);ctx.rotate(ang);
    ctx.drawImage(e.img,srcX,srcY,srcW,srcH,destX(srcX)-hx,destY(srcY)-hy,W*(srcW/iw),H*(srcH/ih));
    ctx.restore();
  }
  if(Math.sin(ph)>=0){leg(-1,aR);leg(1,aL);}else{leg(1,aL);leg(-1,aR);}
  var torsoH=Math.min(ih,Math.ceil(ih*(waist+0.07)));
  ctx.drawImage(e.img,0,0,iw,torsoH,-W*fx,-H*fy,W,H*(torsoH/ih));
}
function drawWalkLegs(look,anim,pose,H,W,fx,fy,waist){ /* kept as a no-op alias */ }

function tryDrawArt(wx,wy,look,ang,anim,opts){
  opts=opts||{};
  var pose=opts.pose||(opts.dying?"die":opts.spawnP!=null?"spawn":opts.flash?"hurt":opts.atk?"atk":opts.moving?"walk":"idle");
  var dir=angDir(ang||0),e=artEntry(look,dir,pose);
  if(!e)return 0;
  var s=toScreen(wx,wy),sc=layout.scale,m=e.meta;
  var ph=((anim||0)%1)*Math.PI*2;
  if(pose==="walk")ph=anim*3.4;
  var bob=0,tilt=0,sx=1,sy=1,lungeX=0,lungeY=0,atkFwd=0;
  var rigOn=look&&look.kind==="player"&&HERO_RIG[e.name]&&!opts.dying&&opts.spawnP==null&&!opts.noRig&&(pose==="walk"||pose==="idle"||pose==="atk"||pose==="hurt");
  if(opts.air||(look&&look.kind==="home")){bob=-((look.kind==="home")?16:10)*sc;if(look.kind==="home")bob-=Math.sin((game.time||0)*3.5)*4*sc;}
  else if(pose==="walk"&&rigOn){var rph=(anim||0)*2.25;bob=-Math.abs(Math.cos(rph))*artTargetH(look,sc)*0.035;tilt=(e.flip?-1:1)*0.075+Math.sin(rph*2)*0.012;}
  else if(pose==="walk"&&look&&look.kind==="zombie"){var zph=(anim||0)*3.3;bob=-Math.abs(Math.sin(zph))*1.8*sc;tilt=Math.sin(zph)*0.07+(e.flip?-1:1)*0.05;sx=1+Math.sin(zph*2)*0.02;sy=1-Math.sin(zph*2)*0.02;}
  else if(pose==="walk"){bob=-Math.abs(Math.sin(ph))*2.2*sc;tilt=Math.sin(ph)*0.035;sx=1+Math.sin(ph*2)*0.015;sy=1-Math.sin(ph*2)*0.015;}
  else if(pose==="idle"){bob=rigOn?0:Math.sin((game.time||anim||0)*2)*1.4*sc;sy=rigOn?1:1+Math.sin((game.time||0)*2)*0.015;}
  else if(pose==="hurt"){bob=2*sc;tilt=-0.08;}
  else if(pose==="atk"){tilt=0.05;sx=1.04;sy=0.96;}
  if((opts.atkT>0||opts.meleeSwing>0||(opts.muzzle>0&&pose!=="laser"))&&pose!=="die"&&pose!=="spawn"&&pose!=="laser"){
    var maxT=opts.atkMax||0.2,tLeft=opts.atkT||opts.meleeSwing||opts.muzzle||0,atkU=1-clamp(tLeft/Math.max(0.06,maxT),0,1);
    if(atkU<0.28)atkFwd=-(atkU/0.28)*0.85;
    else if(atkU<0.58)atkFwd=-0.85+((atkU-0.28)/0.30)*2.05;
    else atkFwd=1.2*(1-(atkU-0.58)/0.42);
    var aimA=opts.aim!=null?opts.aim:(ang||0),lsc=6.5*sc*(opts.scale||1);
    lungeX=Math.cos(aimA)*atkFwd*lsc;
    lungeY=Math.sin(aimA)*atkFwd*lsc*((typeof CFG!=="undefined"&&CFG.YSCALE)||0.7);
    tilt+=atkFwd*0.14;sx*=1+0.07*Math.abs(atkFwd);sy*=1-0.05*atkFwd;
  }
  var H=artTargetH(look,sc)*(opts.scale||1),W=H*(m.w/m.h);
  var hover=look&&look.kind==="home";
  if(!(opts.noShadow))drawArtShadow(s,e,W,H,look,bob,opts);
  var M0=rigOn&&ctx.getTransform?ctx.getTransform():null,rigHand=null;
  ctx.save();
  ctx.translate(s.x+lungeX,s.y+bob-(opts.lift||0)*sc+lungeY);
  if(opts.dying){var dp=1-(opts.dieP||0);ctx.scale(1+dp*0.15,Math.max(0.22,1-dp*0.72));ctx.rotate(dp*0.5);ctx.globalAlpha=clamp((opts.dieP||0)*1.4,0,1);}
  else if(opts.spawnP!=null){var sp=opts.spawnP||0;ctx.translate(0,(1-sp)*32*sc);ctx.scale(0.85+0.15*sp,0.65+0.35*sp);}
  ctx.rotate(tilt);ctx.scale((e.flip?-1:1)*sx,sy);
  var fx=m.fx!=null?m.fx:0.5, fy=m.fy!=null?m.fy:1;
  var skipLegs=!!(opts.air&&look&&look.kind==="home")||(look&&look.kind==="home")||(look&&look.type==="crawler")||opts.dying||opts.spawnP!=null;
  if(rigOn&&!skipLegs){
    rigHand=drawHeroRig(e,e.name,look,anim,pose,H,W,fx,fy,opts);
  }else if(!skipLegs){
    drawSpriteWalk(e,look,anim,pose,H,W,fx,fy);
  }else{
    ctx.drawImage(e.img,-W*fx,-H*fy,W,H);
  }
  if(opts.flash){
    ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.55;
    if(typeof ensureFxSpr==="function"){var fls=ensureFxSpr(),flz=Math.max(16,W*0.55);ctx.drawImage(fls,-flz,-H*fy*0.7-flz*0.2,flz*2,flz*2);}
    else{ctx.fillStyle="rgba(255,255,255,0.5)";ctx.beginPath();ctx.ellipse(0,-H*0.35,W*0.35,H*0.4,0,0,7);ctx.fill();}
    ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;
  }
  ctx.restore();ctx.globalAlpha=1;
  /* anchors */
  var hx=(m.hx!=null?m.hx:0.78),hy=(m.hy!=null?m.hy:0.62);
  hx=0.5+(hx-0.5)*0.86; /* pull hand slightly inward to the palm */
  var ax=(hx-fx)*W;if(e.flip)ax=-ax;
  var ay=(hy-fy)*H+bob-(opts.lift||0)*sc;
  opts._hand={x:s.x+ax+lungeX,y:s.y+ay+lungeY};
  if(rigHand&&M0){var rq=rigHand.matrixTransform(M0.inverse());opts._hand={x:rq.x,y:rq.y};}
  if(opts.cacheHand&&game&&game.player){
    game.player._handSx=opts._hand.x;game.player._handSy=opts._hand.y;
    game.player._handLift=s.y-opts._hand.y;
  }
  if(opts.muzzle>0&&look&&look.kind==="player"&&opts._hand&&opts.wpn&&opts.wpn!=="dbshot"&&opts.wpn!=="minigun"&&opts.wpn!=="knife"&&opts.wpn!=="fist"&&opts.wpn!=="bell"&&opts.wpn!=="bolt"&&opts.wpn!=="machete"){
    if(typeof ensureMuzzleSpr==="function"){
      var ms=ensureMuzzleSpr(),ma=Math.min(1,opts.muzzle*16),mz=16*sc*(opts.scale||1);
      var max=opts._hand.x+Math.cos(opts.aim||ang||0)*10*sc,may=opts._hand.y+Math.sin(opts.aim||ang||0)*10*sc*((typeof CFG!=="undefined"&&CFG.YSCALE)||0.7);
      ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.4+0.6*ma;
      ctx.drawImage(ms,max-mz,may-mz,mz*2,mz*2);ctx.restore();ctx.globalAlpha=1;
    }
  }
  var ex=(m.ex!=null?m.ex:0.5),ey=(m.ey!=null?m.ey:0.2);
  var e1=(ex-0.06-fx)*W,e2=(ex+0.06-fx)*W,eh=(ey-fy)*H+bob;
  if(e.flip){e1=-e1;e2=-e2;}
  opts._eyes={L:{x:s.x+e1,y:s.y+eh},R:{x:s.x+e2,y:s.y+eh},s:s};
  opts._artH=H;
  if(opts.hpBar){
    var bx=s.x-22*sc,by=s.y-H-8*sc;
    ctx.fillStyle="#2a0000";roundRect(ctx,bx,by,44*sc,5*sc,2);ctx.fill();
    ctx.fillStyle="#e53935";roundRect(ctx,bx,by,44*sc*opts.hpBar,5*sc,2);ctx.fill();
    ctx.strokeStyle="#1a140c";ctx.lineWidth=1;roundRect(ctx,bx,by,44*sc,5*sc,2);ctx.stroke();
  }
  return 1;
}
function artEyes(z){
  if(!z)return null;
  var dummy={};
  if(!tryDrawArt)return null;
  /* compute anchors without drawing: */
  var look=z.look||{},dir=angDir(z.aimAng||0),e=artEntry(look,dir);
  if(!e)return null;
  var s=toScreen(z.x,z.y),sc=layout.scale,m=e.meta,H=artTargetH(look,sc),W=H*(m.w/m.h);
  var fx=m.fx||0.5,fy=m.fy||1,ex=m.ex||0.5,ey=m.ey||0.2;
  var bob=look.kind==="home"?-(16*sc+Math.sin((game.time||0)*3.5)*4*sc):0;
  var e1=(ex-0.07-fx)*W,e2=(ex+0.07-fx)*W,eh=(ey-fy)*H+bob;
  if(e.flip){e1=-e1;e2=-e2;}
  var L={x:s.x+e1,y:s.y+eh},R={x:s.x+e2,y:s.y+eh};
  return{L:L,R:R,m:{x:(L.x+R.x)/2,y:(L.y+R.y)/2}};
}
function drawSelectPortrait(look,x,y,w,h){
  var e=artEntry(look,2);
  if(!e)return 0;
  var m=e.meta,sc=Math.min(w/m.w,(h/m.h)*1.05),dw=m.w*sc,dh=m.h*sc;
  ctx.drawImage(e.img,x+(w-dw)/2,y+h-dh+4,dw,dh);
  return 1;
}
function readSafeInsets(){
  var st=getComputedStyle(document.documentElement);
  function n(v,fb){var x=parseFloat(st.getPropertyValue(v));return isFinite(x)?x:fb;}
  return{l:Math.max(12,n("--sal",0)+6),t:Math.max(8,n("--sat",0)+6),r:Math.max(12,n("--sar",0)+6),b:Math.max(8,n("--sab",0)+6)};
}
function drawRotateOverlay(){
  var has=typeof drawMenuArt==="function"&&drawMenuArt();
  if(!has){ctx.fillStyle="#1a0708";ctx.fillRect(0,0,SW,SH);}
  ctx.fillStyle="rgba(16,4,4,0.55)";ctx.fillRect(0,0,SW,SH);
  var t=(game&&game.menuT)||(Date.now()/1000),cx=SW/2,cy=SH*0.42;
  var k=(Math.sin(t*2)+1)/2; /* 0 portrait -> 1 landscape */
  var ang=-Math.PI/2*k;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(ang);
  var pw=46,ph=78,r=8;
  ctx.fillStyle="#1a1a1a";roundRect(ctx,-pw/2,-ph/2,pw,ph,r);ctx.fill();
  ctx.strokeStyle="#ffcc80";ctx.lineWidth=3;roundRect(ctx,-pw/2,-ph/2,pw,ph,r);ctx.stroke();
  ctx.fillStyle="#3e2723";roundRect(ctx,-pw/2+6,-ph/2+10,pw-12,ph-28,4);ctx.fill();
  ctx.fillStyle="#ffab91";ctx.beginPath();ctx.arc(0,ph/2-8,3,0,7);ctx.fill();
  ctx.restore();
  ctx.textAlign="center";ctx.fillStyle="#ffe082";
  ctx.font="bold 28px system-ui";ctx.strokeStyle="rgba(0,0,0,0.7)";ctx.lineWidth=6;
  ctx.strokeText("Gira el móvil",cx,SH*0.68);
  ctx.fillText("Gira el móvil",cx,SH*0.68);
  ctx.fillStyle="#ffecb3";ctx.font="16px system-ui";
  ctx.fillText("Block Z se juega en horizontal",cx,SH*0.68+28);
  ctx.textAlign="left";
}

/* ===== extra abilities ===== */
function updateExtraAbilities(dt){
  var p=game.player;if(!p||!dt)return;
  p.frenzyT=Math.max(0,(p.frenzyT||0)-dt);
  if(p.poisonCloud){
    p._pcT=(p._pcT||0)-dt;if(p._pcT<=0){p._pcT=0.4;
      for(var i=0;i<game.zombies.length;i++){var z=game.zombies[i];if(!z.dead&&!z.dying&&dist(p.x,p.y,z.x,z.y)<70){z.poison=Math.max(z.poison||0,1.2);z.hp-=5*dt*4;if(z.hp<=0)killZombie(z);}}
    }
  }
  if(p.freezeAura){
    for(var i=0;i<game.zombies.length;i++){var z=game.zombies[i];if(!z.dead&&!z.dying&&dist(p.x,p.y,z.x,z.y)<80)z.slow=Math.max(z.slow||0,0.4);}
  }
  if(p.meteors){
    p._metT=(p._metT||0)-dt;if(p._metT<=0){p._metT=2.8;
      var tgt=findNearestZombie(p,420);if(tgt&&game.meteors)game.meteors.push({x:tgt.x,y:tgt.y,t:0,life:0.7});
    }
  }
  if(game.meteors)for(var i=game.meteors.length-1;i>=0;i--){
    var m=game.meteors[i];m.t+=dt;if(m.t>=m.life){explodeAt(m.x,m.y,48,22*p.damageMul,{friendly:1});game.meteors.splice(i,1);}
  }
  if(p.blackHole){
    p._bhT=(p._bhT||0)-dt;if(p._bhT<=0){p._bhT=7.5;p._bh={x:p.x+Math.cos(p.aimAng)*80,y:p.y+Math.sin(p.aimAng)*80,life:1.6};}
    if(p._bh){p._bh.life-=dt;var b=p._bh;
      for(var i=0;i<game.zombies.length;i++){var z=game.zombies[i];if(z.dead||z.dying)continue;var d=dist(b.x,b.y,z.x,z.y);if(d<110&&d>4){var k=80*dt/d;z.x+=(b.x-z.x)*k;z.y+=(b.y-z.y)*k;if(d<28){z.hp-=16*dt*p.damageMul;if(z.hp<=0)killZombie(z);}}}
      if(b.life<=0)p._bh=null;
    }
  }
  if(p.hasClone){
    if(!p.clone)p.clone={x:p.x-20,y:p.y,anim:0,t:0};
    var c=p.clone,tx=p.x-Math.cos(p.aimAng||0)*26,ty=p.y-Math.sin(p.aimAng||0)*26;
    c.x+=(tx-c.x)*Math.min(1,dt*6);c.y+=(ty-c.y)*Math.min(1,dt*6);c.anim+=dt;c.t-=dt;
    if(c.t<=0){var n=findNearestZombie({x:c.x,y:c.y},260);if(n){var ang=Math.atan2(n.y-c.y,n.x-c.x);game.bullets.push({x:c.x,y:c.y,vx:Math.cos(ang)*420,vy:Math.sin(ang)*420,r:3,damage:7*p.damageMul,life:0.7,pierce:0,hit:new Set(),clone:1});c.t=0.55;}}
  }
  if(p.stormCloud){
    if(!p.cloud)p.cloud={x:p.x,y:p.y-30,t:0};
    p.cloud.x+=(p.x-p.cloud.x)*Math.min(1,dt*3);p.cloud.y+=(p.y-40-p.cloud.y)*Math.min(1,dt*3);
    p.cloud.t-=dt;if(p.cloud.t<=0){p.cloud.t=1.4;var n=findNearestZombie(p,200,1);if(n){hurtZombie(n,10*p.damageMul,p.x,1,{quiet:1,noCrit:1});if(typeof pushBolt==="function")pushBolt({pts:[{x:p.cloud.x,y:p.cloud.y},{x:n.x,y:n.y}],life:0.10,maxLife:0.10});else if(game.bolts)game.bolts.push({pts:[{x:p.cloud.x,y:p.cloud.y},{x:n.x,y:n.y}],life:0.10,maxLife:0.10});}}
  }
  if(p.shieldRegen&&p.hasShield&&!p.shieldReady){p.shieldCd=Math.max(0,(p.shieldCd||0)-dt*0.5);}
  if(p.dashFire&&p.dashT>0){
    p._dfT=(p._dfT||0)-dt;if(p._dfT<=0){p._dfT=0.08;if(!game.fires)game.fires=[];game.fires.push({x:p.x,y:p.y,life:1.6,r:16});if(game.fires.length>18)game.fires.shift();}
  }
  if(game.fires)for(var i=game.fires.length-1;i>=0;i--){
    var f=game.fires[i];f.life-=dt;if(f.life<=0){game.fires.splice(i,1);continue;}
    for(var j=0;j<game.zombies.length;j++){var z=game.zombies[j];if(!z.dead&&!z.dying&&dist(f.x,f.y,z.x,z.y)<f.r+z.r){z.burn=Math.max(z.burn||0,0.6);z.hp-=10*dt;if(z.hp<=0)killZombie(z);}}
  }
}
function drawExtraAbilities(){
  var p=game&&game.player,sc=layout.scale,i,s;
  if(!p)return;
  if(p.poisonCloud){s=toScreen(p.x,p.y);ctx.fillStyle="rgba(120,180,40,0.12)";ctx.beginPath();ctx.ellipse(s.x,s.y,70*sc,70*CFG.YSCALE*sc,0,0,7);ctx.fill();}
  if(p.freezeAura){s=toScreen(p.x,p.y);ctx.strokeStyle="rgba(130,200,255,0.35)";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(s.x,s.y,80*sc,80*CFG.YSCALE*sc,0,0,7);ctx.stroke();}
  if(game.fires)for(i=0;i<game.fires.length;i++){var f=game.fires[i];s=toScreen(f.x,f.y);ctx.globalAlpha=clamp(f.life/1.6,0,1)*0.7;ctx.fillStyle="#ff6d00";fillEllipse(ctx,s.x,s.y,f.r*sc,f.r*0.6*sc);ctx.globalAlpha=1;}
  if(game.meteors)for(i=0;i<game.meteors.length;i++){var m=game.meteors[i],k=m.t/m.life;s=toScreen(m.x,m.y);ctx.fillStyle="rgba(255,80,0,0.25)";fillEllipse(ctx,s.x,s.y,20*sc,12*sc);ctx.fillStyle="#ffe082";fillEllipse(ctx,s.x,s.y-80*(1-k)*sc,7*sc,7*sc);}
  if(p._bh){s=toScreen(p._bh.x,p._bh.y);var a=clamp(p._bh.life/1.6,0,1);ctx.globalAlpha=a*0.85;ctx.fillStyle="#120018";ctx.beginPath();ctx.arc(s.x,s.y,16*sc,0,7);ctx.fill();ctx.strokeStyle="rgba(180,80,255,0.7)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y,22*sc,0,7);ctx.stroke();ctx.globalAlpha=1;}
  if(p.hasClone&&p.clone){drawChar34(p.clone.x,p.clone.y,p.look,p.aimAng,p.clone.anim,{h:36,r:10,scale:0.78*(p.scale||1),moving:1,wpn:p.weapon,aim:p.aimAng});}
  if(p.stormCloud&&p.cloud){s=toScreen(p.cloud.x,p.cloud.y);ctx.fillStyle="rgba(60,80,140,0.8)";fillEllipse(ctx,s.x,s.y,22*sc,12*sc);ctx.fillStyle="rgba(40,50,90,0.7)";fillEllipse(ctx,s.x+8*sc,s.y-4*sc,14*sc,9*sc);}
  if(p.hasDrone){s=toScreen(p.droneX,p.droneY);ctx.fillStyle="#90a4ae";roundRect(ctx,s.x-6*sc,s.y-4*sc,12*sc,8*sc,2);ctx.fill();ctx.fillStyle="#4fc3f7";fillEllipse(ctx,s.x,s.y,3*sc,3*sc);}
}
function onExtraKill(z){
  var p=game&&game.player;if(!p||!z)return;
  if(p.vampKill)p.hp=Math.min(p.maxHp,p.hp+(p.maxHp*0.06));
  if(p.frenzy){p.frenzyT=Math.min(3,(p.frenzyT||0)+0.45);p.frenzyStacks=Math.min(8,(p.frenzyStacks||0)+1);}
  if(p.chainBoom&&!z._chained){z._chained=1;explodeAt(z.x,z.y,42,14*p.damageMul,{friendly:1});}
}
function extraFireCooldown(p,cd){
  if(p.frenzyT>0)cd*=(1-0.04*(p.frenzyStacks||1));
  return cd;
}
function extraCrit(p,z){
  if(p.critBolt&&z){var ho=typeof heroHandWorld==="function"?heroHandWorld(p,p.aimAng):{x:p.x,y:p.y},hl=typeof heroHandLiftPx==="function"?heroHandLiftPx(p):0;hurtZombie(z,(CFG.BULLET_DAMAGE||8)*0.6*p.damageMul,p.x,1,{quiet:1,noCrit:1});if(typeof pushBolt==="function")pushBolt({pts:[ho,{x:z.x,y:z.y}],life:0.10,maxLife:0.10,lift:hl});else if(game.bolts)game.bolts.push({pts:[ho,{x:z.x,y:z.y}],life:0.10,maxLife:0.10,lift:hl});}
}
function maybeKnifeFan(p){
  if(!p.knifeFan)return;
  p._fanN=(p._fanN||0)+1;if(p._fanN%4)return;
  var i,a0=p.aimAng||0,ho=typeof heroHandWorld==="function"?heroHandWorld(p,a0):{x:p.x,y:p.y},hl=typeof heroHandLiftPx==="function"?heroHandLiftPx(p):0;
  for(i=-2;i<=2;i++){var a=a0+i*0.18,b=newBullet();b.x=ho.x;b.y=ho.y;b.lift=hl;b.vx=Math.cos(a)*380;b.vy=Math.sin(a)*380;b.r=3;b.damage=8*p.damageMul;b.life=0.55;b.pierce=0;b.hit=new Set();b.knife=1;game.bullets.push(b);}
}
function maybeShockN(p){
  if(!p.shockN)return;
  p._shN=(p._shN||0)+1;if(p._shN%4)return;
  explodeAt(p.x,p.y,70,18*p.damageMul,{friendly:1});
  if(typeof gfxHitStop==="function")gfxHitStop(0.05,"big");
}

function drawMenuArt(){
  var img=ART.menuWide,t=game?game.menuT||0:0;
  ctx.fillStyle="#1a0708";ctx.fillRect(0,0,SW,SH);
  if(!img||!img.width)return 0;
  var iw=img.width,ih=img.height;
  /* cover-fill with a slightly blurred enlargement first, then sharp cover aligned to the top so BLOCK Z stays visible */
  var k0=Math.max(SW/iw,SH/ih)*1.18;
  ctx.save();ctx.filter="blur(18px)";ctx.globalAlpha=0.85;
  ctx.drawImage(img,(SW-iw*k0)/2,(SH-ih*k0)/2,iw*k0,ih*k0);
  ctx.restore();
  /* cover-fit, pin TOP so the BLOCK Z logo stays fully visible */
  var k=Math.max(SW/iw,SH/ih);
  var ox=(SW-iw*k)/2+Math.sin(t*0.1)*4, oy=0;
  ctx.drawImage(img,ox,oy,iw*k,ih*k);
  var grd=ctx.createLinearGradient(SW*0.5,0,SW,0);
  grd.addColorStop(0,"rgba(16,4,4,0)");grd.addColorStop(0.65,"rgba(16,4,4,0.15)");grd.addColorStop(1,"rgba(16,4,4,0.55)");
  ctx.fillStyle=grd;ctx.fillRect(0,0,SW,SH);
  var g2=ctx.createLinearGradient(0,SH*0.55,0,SH);
  g2.addColorStop(0,"rgba(16,4,4,0)");g2.addColorStop(1,"rgba(16,4,4,0.45)");
  ctx.fillStyle=g2;ctx.fillRect(0,0,SW,SH);
  return 1;
}

/* v20.2.1: tinted sprite cache (FURIA VERDE) — built once per sprite, no per-frame filters */
var ART_TINT={};
function artTint(name,img,tint){
  var k=name+"|"+tint;if(ART_TINT[k])return ART_TINT[k];
  var c=document.createElement("canvas");c.width=img.width;c.height=img.height;var g=c.getContext("2d");
  g.drawImage(img,0,0);
  g.globalCompositeOperation="multiply";g.fillStyle=tint==="hulk"?"#8cff7a":"#ffffff";g.fillRect(0,0,c.width,c.height);
  g.globalCompositeOperation="source-atop";g.fillStyle="rgba(40,140,40,0.22)";g.fillRect(0,0,c.width,c.height);
  g.globalCompositeOperation="destination-in";g.drawImage(img,0,0);
  ART_TINT[k]=c;return c;
}
