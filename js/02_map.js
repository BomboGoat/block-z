var map={zones:[],solids:[],bushes:[],decos:[],spawns:[],chunks:{},chunkS:400,dirty:1,grid:null,cols:0,rows:0,flow:null,flowT:0,decals:[],birds:[],lamps:[],rats:[],papers:[]};
function toScreen(wx,wy){return{x:layout.gameX+layout.gameDrawW/2+(wx-game.camX)*layout.scale,y:layout.gameY+layout.gameDrawH/2+(wy-game.camY)*CFG.YSCALE*layout.scale};}
function toScreenH(wx,wy,lift){var s=toScreen(wx,wy);if(lift)s.y-=lift;return s;}
function addSolid(o){o.solid=1;map.solids.push(o);}
function addBush(o){o.bush=1;map.bushes.push(o);}
function addDeco(o){map.decos.push(o);}
function visBox(o){
  if(o.k==="tree"){var R=o.canopy||40;return{x:o.x+o.w/2-R,y:o.y+o.d/2-R,w:R*2,d:R*2};}
  return{x:o.x,y:o.y,w:o.w,d:o.d};
}
function boxesHit(ax,ay,aw,ad,bx,by,bw,bd,pad){pad=pad||0;return ax-pad<bx+bw&&ax+aw+pad>bx&&ay-pad<by+bd&&ay+ad+pad>by;}
function inOpen(x,y,w,d){
  var i,op=map.opens;
  for(i=0;i<op.length;i++){var g=op[i];if(boxesHit(x,y,w,d,g.x,g.y,g.w,g.h,6))return 1;}
  return 0;
}
function inKeep(x,y,w,d){
  if(inOpen(x,y,w,d))return 1;
  var i,op=map.corridors||[];
  for(i=0;i<op.length;i++){var g=op[i];if(boxesHit(x,y,w,d,g.x,g.y,g.w,g.h,0))return 1;}
  return 0;
}
function overlapsAny(x,y,w,d,pad){
  pad=pad==null?40:pad;var i,a=map.solids,vb;
  for(i=0;i<a.length;i++){vb=visBox(a[i]);if(boxesHit(x,y,w,d,vb.x,vb.y,vb.w,vb.d,pad))return 1;}
  a=map.bushes;
  for(i=0;i<a.length;i++){if(boxesHit(x,y,w,d,a[i].x,a[i].y,a[i].w,a[i].d,Math.min(24,pad)))return 1;}
  a=map.decos;
  for(i=0;i<a.length;i++){if(a[i].k==="canopy")continue;if(boxesHit(x,y,w,d,a[i].x,a[i].y,a[i].w,a[i].d,16))return 1;}
  return 0;
}
function addWall(x,y,w,d,h,col){if(w<4||d<4)return;addSolid({k:"wall",x:x,y:y,w:w,d:d,h:h||36,top:col||"#6d6a63",side:shadeHex(col||"#6d6a63",-32)});}
function addFence(x,y,w,d,style,opt){
  opt=opt||{};
  if(w<3||d<3)return;
  var border=!!opt.border;
  addSolid({k:"fence",style:style||"wood",x:x,y:y,w:w,d:d,h:opt.h||(border?14:12),climbable:!border&&opt.climbable!==0,border:border,solid:1,top:style==="chain"?"#8a9aa8":"#8d6e4a",side:style==="chain"?"#5c6b75":"#5d4037"});
}
function buildMap(seed){
  map={zones:[],solids:[],bushes:[],decos:[],spawns:[],chunks:{},chunkS:400,dirty:1,grid:null,cols:0,rows:0,flow:null,flowT:0,opens:[],corridors:[],decals:[],birds:[],lamps:[],rats:[],papers:[]};
  var MW=CFG.MAP_W,MH=CFG.MAP_H,bw=48,rng=seeded(seed||1337);
  var midX=1472,midY=1472,dw=56,GAP=40;
  map.zones=[
    {id:"park",x:bw,y:bw,w:midX-bw,h:midY-bw,k:"grass",floor:"#3aa644",floor2:"#2d8a36",name:"Parque",tint:"rgba(30,90,30,0.04)"},
    {id:"gas",x:midX+dw,y:bw,w:MW-(midX+dw)-bw,h:midY-bw,k:"plaza",floor:"#d4bc8e",floor2:"#c0a674",name:"Gasolinera",tint:"rgba(180,110,40,0.04)"},
    {id:"street",x:bw,y:midY+dw,w:midX-bw,h:MH-(midY+dw)-bw,k:"asphalt",floor:"#4a5160",floor2:"#3c424e",name:"Avenida",tint:"rgba(30,36,60,0.045)"},
    {id:"ruins",x:midX+dw,y:midY+dw,w:MW-(midX+dw)-bw,h:MH-(midY+dw)-bw,k:"ruins",floor:"#b07848",floor2:"#8d5a32",name:"Ruinas",tint:"rgba(140,60,20,0.05)"},
    {id:"lot",x:1200,y:1200,w:600,h:600,k:"parking",floor:"#4a5160",floor2:"#3c424e",name:"Aparcamiento",tint:"rgba(20,20,28,0.04)"}
  ];
  map.opens=[
    {x:midX,y:560,w:dw,h:220},{x:midX,y:1380,w:dw,h:240},{x:midX,y:2140,w:dw,h:220},
    {x:560,y:midY,w:220,h:dw},{x:1380,y:midY,w:240,h:dw},{x:2140,y:midY,w:220,h:dw}
  ];
  map.corridors=[
    {x:720,y:80,w:80,h:1360},{x:80,y:720,w:1360,h:80},
    {x:2280,y:80,w:90,h:1360},{x:1560,y:700,w:1360,h:80},
    {x:80,y:2100,w:1360,h:180},{x:720,y:1560,w:80,h:1360},
    {x:2100,y:1560,w:90,h:1360},{x:1560,y:2100,w:1360,h:90},
    {x:1380,y:1380,w:240,h:240}
  ];
  var wallCol="#d2c4ae";
  addFence(0,0,MW,12,"wood",{border:1,h:14});
  addFence(0,MH-12,MW,12,"wood",{border:1,h:14});
  addFence(0,12,12,MH-24,"wood",{border:1,h:14});
  addFence(MW-12,12,12,MH-24,"wood",{border:1,h:14});
  function wallStrip(x,y,w,d){
    var segs=[{x:x,y:y,w:w,d:d}],i,j,op=map.opens;
    for(i=0;i<op.length;i++){
      var g=op[i],next=[];
      for(j=0;j<segs.length;j++){
        var s=segs[j];
        if(!(s.x<g.x+g.w&&s.x+s.w>g.x&&s.y<g.y+g.h&&s.y+s.d>g.y)){next.push(s);continue;}
        if(s.y<g.y)next.push({x:s.x,y:s.y,w:s.w,d:Math.min(s.y+s.d,g.y)-s.y});
        var y2=Math.max(s.y,g.y+g.h);if(y2<s.y+s.d)next.push({x:s.x,y:y2,w:s.w,d:s.y+s.d-y2});
        var my=Math.max(s.y,g.y),mh=Math.min(s.y+s.d,g.y+g.h)-my;
        if(mh>0&&s.x<g.x)next.push({x:s.x,y:my,w:Math.min(s.x+s.w,g.x)-s.x,d:mh});
        var x2=Math.max(s.x,g.x+g.w);if(mh>0&&x2<s.x+s.w)next.push({x:x2,y:my,w:s.x+s.w-x2,d:mh});
      }
      segs=next;
    }
    for(i=0;i<segs.length;i++)if(segs[i].w>8&&segs[i].d>8){
      var sg=segs[i],fw,fd,fx,fy;
      if(sg.w>=sg.d){fd=10;fy=sg.y+(sg.d-fd)/2;addFence(sg.x,fy,sg.w,fd,"chain",{climbable:1,h:12});}
      else{fw=10;fx=sg.x+(sg.w-fw)/2;addFence(fx,sg.y,fw,sg.d,"wood",{climbable:1,h:13});}
    }
  }
  wallStrip(midX,bw,dw,MH-2*bw);
  wallStrip(bw,midY,MW-2*bw,dw);
  function tryAdd(k,x,y,w,d,h,extra){
    x+=rng()*8-4;y+=rng()*8-4;
    if(x<bw+10||y<bw+10||x+w>MW-bw-10||y+d>MH-bw-10)return 0;
    var vx=x,vy=y,vw=w,vd=d,R;
    if(k==="tree"){R=(extra&&extra.canopy)||40;vx=x+w/2-R;vy=y+d/2-R;vw=R*2;vd=R*2;}
    if(inKeep(vx,vy,vw,vd)||overlapsAny(vx,vy,vw,vd,GAP))return 0;
    var o={k:k,x:x,y:y,w:w,d:d,h:h||20};if(extra)for(var p in extra)o[p]=extra[p];
    if(k==="bush")addBush(o);else if(k==="canopy"||k==="fountain"||k==="sign"||k==="roadsign"||k==="cone"||k==="bag")addDeco(o);else addSolid(o);
    return o;
  }
  function place(k,x,y,w,d,h,extra){
    if(x<bw+8||y<bw+8||x+w>MW-bw-8||y+d>MH-bw-8)return 0;
    var vx=x,vy=y,vw=w,vd=d,R,gap=(extra&&extra.gap!=null)?extra.gap:GAP;
    if(k==="tree"){R=(extra&&extra.canopy)||40;vx=x+w/2-R;vy=y+d/2-R;vw=R*2;vd=R*2;}
    if(!(extra&&extra.skipKeep)&&inKeep(vx,vy,vw,vd))return 0;
    if(overlapsAny(vx,vy,vw,vd,gap))return 0;
    var o={k:k,x:x,y:y,w:w,d:d,h:h||20};if(extra)for(var p in extra)o[p]=extra[p];
    if(k==="bush")addBush(o);else if(k==="canopy"||k==="fountain"||k==="sign"||k==="roadsign"||k==="cone"||k==="bag")addDeco(o);else addSolid(o);
    return o;
  }
  function addDecal(k,x,y,w,d,extra){var o={k:k,x:x,y:y,w:w,d:d};if(extra)for(var p in extra)o[p]=extra[p];
    if(o.k==="dirtpath"&&o.pts&&o.pts.length){var minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9,j,pad=(o.w||60)/2+16;
      for(j=0;j<o.pts.length;j++){minx=Math.min(minx,o.pts[j][0]);miny=Math.min(miny,o.pts[j][1]);maxx=Math.max(maxx,o.pts[j][0]);maxy=Math.max(maxy,o.pts[j][1]);}
      o.x=minx-pad;o.y=miny-pad;o.w=maxx-minx+pad*2;o.d=maxy-miny+pad*2;}
    map.decals.push(o);}
  var CARS=["#1565c0","#c62828","#f5f5f5","#212121","#ef6c00","#1a237e","#00695c","#fff8e1","#37474f"];
  function carAt(x,y,w,d,ang,wreck,ex){var e={top:rngPick(rng,CARS),ang:ang||0,wreck:wreck||0};if(ex)for(var pk in ex)e[pk]=ex[pk];return place("car",x,y,w||70,d||30,22,e);}
  /* ===== PARK ===== */
  function meander(x0,y0,x1,y1,horiz,wid){
    var pts=[],n=9,i,t,x,y,off;
    for(i=0;i<=n;i++){t=i/n;x=x0+(x1-x0)*t;y=y0+(y1-y0)*t;off=(i&&i<n)?(rng()*2-1)*40:0;if(horiz)y+=off;else x+=off;pts.push([x,y]);}
    addDecal("dirtpath",0,0,0,0,{pts:pts,w:wid||62});
  }
  meander(760,90,755,1410,0,64);meander(90,760,1410,755,1,64);
  place("fountain",728,728,64,64,16,{top:"#90caf9",side:"#1565c0",skipKeep:1,gap:8});
  var kinds=["oak","pine","bushy"];
  function tk(i,x){return kinds[(i+((x/17)|0))%3];}
  var trees=[[180,180,42],[330,190,38],[200,330,44],[1180,180,40],[1320,200,46],[1160,330,36],[180,1160,40],[330,1180,38],[200,1300,42],[1080,980,40],[960,1080,36],[500,160,38],[960,160,42],[160,500,40],[160,960,38],[500,1280,36],[1100,500,40],[500,1100,38],[400,400,42],[1000,400,36],[400,1000,40]];
  var i,t;
  for(i=0;i<trees.length;i++){t=trees[i];place("tree",t[0],t[1],18,18,16,{top:"#5a3a1a",side:"#3a2410",canopy:t[2],treeKind:tk(i,t[0])});}
  place("bench",640,680,40,16,10,{top:"#8d6e4a",side:"#5d4030",tex:"wood"});
  place("bench",820,680,40,16,10,{top:"#8d6e4a",side:"#5d4030",tex:"wood"});
  place("bench",680,820,16,40,10,{top:"#8d6e4a",side:"#5d4030",tex:"wood"});
  place("bench",820,840,16,40,10,{top:"#8d6e4a",side:"#5d4030",tex:"wood"});
  place("tree",600,520,18,18,16,{top:"#5a3a1a",side:"#3a2410",canopy:40,treeKind:"oak"});
  place("tree",900,520,18,18,16,{top:"#5a3a1a",side:"#3a2410",canopy:44,treeKind:"pine"});
  place("tree",600,1080,18,18,16,{top:"#5a3a1a",side:"#3a2410",canopy:38,treeKind:"bushy"});
  place("tree",920,1080,18,18,16,{top:"#5a3a1a",side:"#3a2410",canopy:42,treeKind:"oak"});
  place("tree",860,980,18,18,16,{top:"#5a3a1a",side:"#3a2410",canopy:36,treeKind:"pine"});
  place("crate",420,420,26,26,22,{top:"#b07a3a",side:"#7a4e22",hp:18,maxHp:18,break:1});
  place("crate",500,420,26,26,22,{top:"#b07a3a",side:"#7a4e22",hp:18,maxHp:18,break:1});
  var bushes=[[100,100,40],[100,250,36],[250,100,38],[1300,100,42],[1300,260,36],[100,1300,40],[260,1300,34],[900,100,38],[100,900,36],[1100,1100,40],[600,200,34],[200,600,36],[600,1280,38]];
  for(i=0;i<bushes.length;i++){t=bushes[i];place("bush",t[0],t[1],t[2],t[2]*0.9,16,{top:"#2e8b2e",side:"#1e5c1e"});}
  addDecal("puddle",980,600,40,24);addDecal("leaves",300,600,50,40);addDecal("leaves",900,1000,46,36);
  for(i=0;i<8;i++)map.birds.push({x:200+rng()*1100,y:200+rng()*1100,vx:0,vy:0,fly:0,wing:rng()*6,z:0});
  /* ===== GAS ===== */
  place("shop",1588,100,150,96,48,{top:"#eceff1",side:"#78909c",tex:"metal",shop:1});
  place("sign",1810,64,26,16,72,{top:"#c62828",side:"#7f1515",label:"GAS",gap:8,skipKeep:1});
  place("canopy",1860,230,340,160,12,{top:"#c62828",side:"#7f1515",post:1});
  place("pump",1920,280,22,16,28,{top:"#efefef",side:"#c62828"});
  place("pump",2040,280,22,16,28,{top:"#efefef",side:"#c62828"});
  place("pump",2160,280,22,16,28,{top:"#efefef",side:"#c62828"});
  var gx,gy,gi;
  for(gi=0;gi<4;gi++){carAt(1860+gi*110,480,70,30,0,gi===3);carAt(1860+gi*110,590,70,30,0,0);}
  carAt(2500,280,70,30,0,0);carAt(2610,280,70,30,0,0);carAt(2500,390,70,30,1,0);
  place("barrel",2680,120,16,16,24,{top:"#d35400",side:"#8e2c00",burn:1});
  place("barrel",2740,120,16,16,24,{top:"#d35400",side:"#8e2c00"});
  place("barrel",2680,180,16,16,24,{top:"#d35400",side:"#8e2c00"});
  place("crate",1590,230,26,26,22,{top:"#b07a3a",side:"#7a4e22",hp:16,maxHp:16,break:1});
  place("bush",2800,200,36,32,16,{top:"#348034",side:"#1e5a1e"});
  place("bush",2800,400,38,34,16,{top:"#348034",side:"#1e5a1e"});
  place("bush",2600,1000,36,32,16,{top:"#348034",side:"#1e5a1e"});
  addDecal("puddle",2000,700,48,28);addDecal("manhole",2300,900,22,22);
  /* ===== STREET ===== */
  addDecal("crosswalk",400,2100,70,180);addDecal("crosswalk",1000,2100,70,180);
  var sx,row=[120,230,340,450,900,1010,1120];
  for(i=0;i<row.length;i++){carAt(row[i],1998,74,32,0,i===2);carAt(row[i],2320,74,32,0,0);}
  var lamps=[[200,2076],[500,2076],[1000,2076],[1300,2076],[200,2290],[500,2290],[1000,2290],[1300,2290],[420,520],[900,700],[1600,420],[2400,700],[420,2400],[2400,2400],[1500,1500],[1700,1700]];
  for(i=0;i<lamps.length;i++){t=place("lamp",lamps[i][0],lamps[i][1],8,8,36,{top:"#37474f",side:"#212121"});if(t)map.lamps.push(t);}
  place("bench",600,2050,48,16,10,{top:"#8d6e4a",side:"#5d4030",tex:"wood"});
  place("roadsign",780,2060,14,12,28,{top:"#efefef",side:"#1565c0",gap:12});
  place("barrel",200,1900,16,16,24,{top:"#6d4c41",side:"#3e2723"});
  place("barrel",280,1900,16,16,24,{top:"#6d4c41",side:"#3e2723",burn:1});
  place("crate",1100,1900,28,28,22,{top:"#a36b2f",side:"#6d4218",hp:18,maxHp:18,break:1});
  addDecal("puddle",600,2400,56,30);addDecal("manhole",800,2180,24,24);
  /* ===== RUINS ===== */
  function wallbit(x,y,w,d,h){place("wallbit",x,y,w,d,h||36,{top:"#9e9e9e",side:"#616161",graf:rng()<0.35});}
  wallbit(1850,1850,200,18,38);wallbit(1850,1850,18,200,40);wallbit(2032,1850,18,120,36);
  wallbit(2300,1850,220,18,40);wallbit(2300,1850,18,180,36);wallbit(2502,1850,18,180,38);wallbit(2300,2012,80,18,32);
  wallbit(1850,2300,18,200,42);wallbit(1850,2300,180,18,36);wallbit(1850,2482,90,18,30);
  wallbit(2400,2400,160,18,34);wallbit(2400,2400,18,140,40);wallbit(2542,2400,18,80,28);
  wallbit(2700,2000,70,16,30);wallbit(2600,2600,50,16,26);
  place("rubble",1950,2080,44,32,16,{top:"#8d6e63",side:"#5d4037"});
  place("rubble",2000,2280,50,36,18,{top:"#8d6e63",side:"#5d4037"});
  place("rubble",2600,1980,46,30,16,{top:"#8d6e63",side:"#5d4037"});
  place("rubble",2700,2580,54,34,18,{top:"#8d6e63",side:"#5d4037"});
  place("rubble",2260,2260,40,30,14,{top:"#8d6e63",side:"#5d4037"});
  place("rubble",2800,2300,48,32,16,{top:"#8d6e63",side:"#5d4037"});
  place("barrel",1900,1920,16,16,24,{top:"#5d4037",side:"#3e2723",burn:1});
  place("barrel",1960,1920,16,16,24,{top:"#5d4037",side:"#3e2723"});
  place("crate",2440,1900,26,26,22,{top:"#8d6e63",side:"#5d4037",hp:14,maxHp:14,break:1});
  place("crate",2440,1980,26,26,22,{top:"#8d6e63",side:"#5d4037",hp:14,maxHp:14,break:1});
  addDecal("graf",1860,1872,40,20,{col:"#8e24aa"});addDecal("puddle",2200,2500,44,26);
  /* ===== LOT cars in 4 quadrants, aisles clear ===== */
  carAt(1220,1230,70,30,0,0);carAt(1220,1320,70,30,0,1);
  carAt(1680,1230,70,30,0,0);carAt(1680,1320,70,30,0,0);
  carAt(1220,1660,70,30,0,0);carAt(1220,1750,70,30,0,0);
  carAt(1680,1660,70,30,0,0);carAt(1680,1750,70,30,0,0);
  place("barrel",1320,1230,16,16,24,{top:"#d35400",side:"#8e2c00"});
  addDecal("manhole",1500,1350,24,24);addDecal("puddle",1720,1500,40,22);
  /* a few trees in every zone, edges only */
  place("tree",2780,200,18,18,16,{canopy:38,treeKind:"pine",top:"#5a3a1a",side:"#3a2410"});
  place("tree",2790,1180,18,18,16,{canopy:36,treeKind:"oak",top:"#5a3a1a",side:"#3a2410"});
  place("tree",1600,1280,18,18,16,{canopy:34,treeKind:"bushy",top:"#5a3a1a",side:"#3a2410"});
  place("tree",160,1860,18,18,16,{canopy:36,treeKind:"oak",top:"#5a3a1a",side:"#3a2410"});
  place("tree",1360,1860,18,18,16,{canopy:34,treeKind:"pine",top:"#5a3a1a",side:"#3a2410"});
  place("tree",160,2680,18,18,16,{canopy:38,treeKind:"bushy",top:"#5a3a1a",side:"#3a2410"});
  place("tree",1360,2680,18,18,16,{canopy:36,treeKind:"oak",top:"#5a3a1a",side:"#3a2410"});
  place("tree",2800,1880,18,18,16,{canopy:34,treeKind:"pine",top:"#5a3a1a",side:"#3a2410"});
  place("tree",1880,2780,18,18,16,{canopy:32,treeKind:"bushy",top:"#5a3a1a",side:"#3a2410"});
  place("tree",1210,1210,18,18,16,{canopy:30,treeKind:"bushy",top:"#5a3a1a",side:"#3a2410"});
  place("tree",1740,1760,18,18,16,{canopy:32,treeKind:"oak",top:"#5a3a1a",side:"#3a2410"});

  /* v15 props — keep corridors clear (gap 16-40) */
  function pack(list){var j,a;for(j=0;j<list.length;j++){a=list[j];place(a[0],a[1],a[2],a[3],a[4],a[5],a[6]||{gap:16});}}
  pack([
    ["pic",560,640,48,28,12,{top:"#8d6e4a",side:"#5d4030",tex:"wood",gap:16}],
    ["pic",900,860,48,28,12,{top:"#8d6e4a",side:"#5d4030",tex:"wood",gap:16}],
    ["slide",1040,860,44,28,28,{gap:16}],
    ["swing",1120,860,40,18,28,{gap:16}],
    ["dump",1280,600,36,22,26,{top:"#2e7d32",side:"#1b5e20",gap:16}],
    ["bag",1260,650,14,12,10,{top:"#37474f",gap:10}],
    ["bag",1298,650,14,12,10,{top:"#455a64",gap:10}],
    ["tank",2720,520,28,28,40,{top:"#78909c",side:"#455a64",gap:18}],
    ["tank",2770,520,28,28,40,{top:"#78909c",side:"#455a64",gap:18}],
    ["wash",2500,600,110,50,36,{gap:12}],
    ["vend",1750,220,22,18,36,{gap:14}],
    ["cone",1900,360,10,10,16,{gap:8}],
    ["cone",2020,360,10,10,16,{gap:8}],
    ["cone",2140,360,10,10,16,{gap:8}],
    ["bar",1860,430,50,10,12,{gap:12}],
    ["dump",1600,400,36,22,26,{top:"#2e7d32",side:"#1b5e20",gap:16}],
    ["bus",860,1880,70,22,28,{gap:12}],
    ["booth",1280,1880,20,20,42,{gap:12}],
    ["stand",520,1880,22,16,22,{gap:12}],
    ["vend",300,1900,22,18,36,{gap:14}],
    ["dump",200,1800,36,22,26,{top:"#33691e",side:"#1b5e20",gap:16}],
    ["bag",250,1800,14,12,10,{gap:8}],
    ["cone",680,1980,10,10,16,{gap:8}],
    ["cone",820,1980,10,10,16,{gap:8}],
    ["bar",980,1988,56,10,12,{gap:12}],
    ["scaf",2260,1960,70,28,40,{gap:12}],
    ["rubble",2100,1980,48,32,16,{top:"#8d6e63",side:"#5d4037",gap:16}],
    ["rubble",2480,2200,46,30,16,{top:"#8d6e63",side:"#5d4037",gap:16}],
    ["cart",1320,1320,22,16,16,{gap:12}],
    ["cart",1640,1660,22,16,16,{gap:12}],
    ["cart",1320,1660,22,16,16,{gap:12}],
    ["dump",1480,1230,32,22,26,{top:"#2e7d32",side:"#1b5e20",gap:14}]
  ]);
  carAt(1260,1998,74,32,0,0,{cop:1,top:"#0d47a1",gap:8});
  carAt(1400,1998,80,34,0,0,{ambu:1,top:"#fafafa",gap:8});
  for(i=0;i<10;i++)map.rats.push({x:200+rng()*2600,y:200+rng()*2600,a:rng()*6.28,spd:30+rng()*40,t:0,turn:0.8+rng()});
  for(i=0;i<12;i++)map.papers.push({x:200+rng()*2600,y:200+rng()*2600,a:rng()*6,spd:18+rng()*24});
  var s;for(i=0;i<map.solids.length;i++){s=map.solids[i];if(s.k==="car"&&!s.side)s.side=shadeHex(s.top,-40);if(!s.top)s.top="#888";if(!s.side)s.side=shadeHex(s.top,-30);}
  map.spawns=[];
  for(i=0;i<map.opens.length;i++){var g=map.opens[i];map.spawns.push({x:g.x+g.w/2,y:g.y+g.h/2});}
  map.spawns.push({x:200,y:200},{x:MW-200,y:200},{x:200,y:MH-200},{x:MW-200,y:MH-200},{x:MW/2,y:180},{x:MW/2,y:MH-180},{x:180,y:MH/2},{x:MW-180,y:MH/2});
  map.view={park:{x:760,y:820},gas:{x:2550,y:580},street:{x:1100,y:2140},ruins:{x:2200,y:1960},lot:{x:1330,y:1290}};
  buildGrid();
  ensureConnected(760,900);
}
function buildGrid(){
  map.cols=(CFG.MAP_W/CFG.CELL)|0;map.rows=(CFG.MAP_H/CFG.CELL)|0;
  var n=map.cols*map.rows,g=new Uint8Array(n),i,s,c,r;
  for(i=0;i<map.solids.length;i++){
    s=map.solids[i];if(s.dead||s.climbable)continue;
    var c0=clamp((s.x/CFG.CELL)|0,0,map.cols-1),c1=clamp(((s.x+s.w)/CFG.CELL)|0,0,map.cols-1);
    var r0=clamp((s.y/CFG.CELL)|0,0,map.rows-1),r1=clamp(((s.y+s.d)/CFG.CELL)|0,0,map.rows-1);
    for(r=r0;r<=r1;r++)for(c=c0;c<=c1;c++)g[r*map.cols+c]=1;
  }
  map.grid=g;
}
function ensureConnected(sx,sy){
  var pts=[[760,900],[2050,450],[700,2200],[2200,2200],[1500,1340],[250,250],[2750,250],[250,2750],[2750,2750],[1000,1000],[2000,1000],[1000,2000],[2500,2500]],guard=0;
  function reachable(x,y){
    updateFlow(sx,sy);
    var c=clamp((x/CFG.CELL)|0,0,map.cols-1),r=clamp((y/CFG.CELL)|0,0,map.rows-1),idx=r*map.cols+c;
    if(map.grid[idx]){
      var k,nbrs=[1,0,-1,0,0,1,0,-1];
      for(k=0;k<4;k++){var nx=c+nbrs[k*2],ny=r+nbrs[k*2+1];if(nx>=0&&ny>=0&&nx<map.cols&&ny<map.rows&&!map.grid[ny*map.cols+nx]&&map.flowDist[ny*map.cols+nx]>=0)return 1;}
      return 0;
    }
    return map.flowDist&&map.flowDist[idx]>=0;
  }
  while(guard++<10){
    var i,bad=null;
    for(i=0;i<pts.length;i++)if(!reachable(pts[i][0],pts[i][1])){bad=pts[i];break;}
    if(!bad)return;
    var bx=bad[0],by=bad[1],best=null,bestD=1e9,j,s;
    for(j=0;j<map.solids.length;j++){
      s=map.solids[j];if(s.dead||s.k==="wall")continue;
      var d=dist(bx,by,s.x+s.w/2,s.y+s.d/2);
      if(d<bestD){bestD=d;best=s;}
    }
    if(!best)return;
    best.dead=1;buildGrid();
  }
}
function circleHitSolid(cx,cy,rad,ent){
  var i,s,a=map.solids,best=null,bestD=0,mode;
  mode=typeof ent==="string"?ent:(ent?"ent":"soft");
  for(i=0;i<a.length;i++){
    s=a[i];if(s.dead)continue;
    if(s.climbable){
      if(mode==="soft")continue;
      if(mode==="ent"){
        if(ent.vaultT>0||ent.jumpT>0||ent.dashT>0||(ent.airH||0)>4||ent.isHome||ent.isColossus||ent.isBoss)continue;
      }
    }
    var qx=clamp(cx,s.x,s.x+s.w),qy=clamp(cy,s.y,s.y+s.d);
    var dx=cx-qx,dy=cy-qy,d2=dx*dx+dy*dy;
    if(d2<rad*rad){var d=Math.sqrt(d2)||0.0001;if(!best||rad-d>bestD){best=s;bestD=rad-d;best.nx=dx/d;best.ny=dy/d;best.pen=rad-d;}}
  }
  return best;
}
function resolveCircle(ent){
  var i;
  for(i=0;i<3;i++){
    var hit=circleHitSolid(ent.x,ent.y,ent.r,ent);
    if(!hit)return;
    var nx=hit.nx,ny=hit.ny,pen=hit.pen;
    if(Math.abs(nx)+Math.abs(ny)<0.05){
      var dl=ent.x-hit.x,dr=hit.x+hit.w-ent.x,dt=ent.y-hit.y,db=hit.y+hit.d-ent.y,m=Math.min(dl,dr,dt,db);
      if(m===dl){nx=-1;ny=0;pen=ent.r+dl;}
      else if(m===dr){nx=1;ny=0;pen=ent.r+dr;}
      else if(m===dt){nx=0;ny=-1;pen=ent.r+dt;}
      else{nx=0;ny=1;pen=ent.r+db;}
    }
    ent.x+=nx*pen;ent.y+=ny*pen;
  }
}
function hasLOS(ax,ay,bx,by){
  var d=dist(ax,ay,bx,by),n=Math.max(2,(d/14)|0),i;
  for(i=1;i<n;i++){var t=i/n;if(circleHitSolid(ax+(bx-ax)*t,ay+(by-ay)*t,2))return 0;}
  return 1;
}
function hiddenInBush(x,y,other){
  var b=pointInBush(x,y);if(!b)return 0;
  if(other&&pointInBush(other.x,other.y)===b)return 0;
  return 1;
}
function pointInBush(x,y){
  var i,b=map.bushes;
  for(i=0;i<b.length;i++){var s=b[i];if(x>=s.x&&x<=s.x+s.w&&y>=s.y&&y<=s.y+s.d)return s;}
  return null;
}
/* v20.2: clearance-aware flow — zombies prefer routes with room for their body, so they stop
   jamming in 1-cell gaps between trees, rocks and the pond shore. Weighted (Dial) search:
   roomy cells cost 1, tight cells 4, wall-hugging cells 24 — pockets stay reachable. */
function _flowWide(WR){
  var cols=map.cols,rows=map.rows,cell=CFG.CELL,g=map.grid,n=cols*rows,i;
  var D=typeof decodeMapData==="function"?decodeMapData():null,sd=D&&D.sdf&&D.sdf.length===n?D.sdf:null,ss=map.solids||[],si,o,c0,c1,r0,r1,rr,cc2,ox,oy,lim,qx2,qy2;
  var wide=new Uint8Array(n);
  for(i=0;i<n;i++)wide[i]=g[i]?0:(sd?(sd[i]>=WR*10?1:(sd[i]<110?2:0)):1);
  for(si=0;si<ss.length;si++){
    o=ss[si];if(!o||o.dead||o.k==="bush")continue;
    c0=Math.max(0,((o.x-WR-o.w)/cell)|0);c1=Math.min(cols-1,((o.x+o.w*2+WR)/cell)|0);
    r0=Math.max(0,((o.y-WR-o.d)/cell)|0);r1=Math.min(rows-1,((o.y+o.d*2+WR)/cell)|0);
    for(rr=r0;rr<=r1;rr++)for(cc2=c0;cc2<=c1;cc2++){
      ox=(cc2+0.5)*cell;oy=(rr+0.5)*cell;
      if(o.shape==="circle"){var ocr=o.cr||Math.min(o.w,o.d)/2;lim=ocr+WR;qx2=ox-(o.x+o.w/2);qy2=oy-(o.y+o.d/2);}
      else{lim=WR;qx2=ox-clamp(ox,o.x,o.x+o.w);qy2=oy-clamp(oy,o.y,o.y+o.d);}
      if(qx2*qx2+qy2*qy2<lim*lim&&wide[rr*cols+cc2]===1)wide[rr*cols+cc2]=0;
    }
  }
  return wide;
}
function _flowBuild(F,px,py,WR){
  var cols=map.cols,rows=map.rows,cell=CFG.CELL,g=map.grid,n=cols*rows,i;
  if(!F.dist||F.dist.length!==n){
    F.dist=new Int16Array(n);F.dir=new Int8Array(n*2);F.cost=new Int32Array(n);F.pass=new Uint8Array(n);
    F.nxt=new Int32Array(n*8+8);F.val=new Int32Array(n*8+8);F.dv=new Int32Array(n*8+8);F.wide=null;
  }
  if(!F.wide||F.wide.length!==n)F.wide=_flowWide(WR);
  var sc=clamp((px/cell)|0,0,cols-1),sr=clamp((py/cell)|0,0,rows-1);
  var distA=F.dist,dir=F.dir,cost=F.cost,pass=F.pass,wide=F.wide,nxt=F.nxt,val=F.val,dv=F.dv;
  for(i=0;i<n;i++)cost[i]=2147483647;
  var NB=512,bh=F.bh||(F.bh=new Int32Array(NB));
  for(i=0;i<NB;i++)bh[i]=-1;
  var pool=0,cur=0,pending=0,nbrs=[1,0,-1,0,0,1,0,-1,1,1,1,-1,-1,1,-1,-1],k,cx,cy,nx,ny,idx,e,ci,cd,nd,step,bk;
  var s0=sr*cols+sc;cost[s0]=0;val[0]=s0;dv[0]=0;nxt[0]=-1;bh[0]=0;pool=1;pending=1;
  while(pending>0){
    bk=cur%NB;e=bh[bk];
    if(e<0){cur++;continue;}
    bh[bk]=nxt[e];pending--;
    ci=val[e];cd=dv[e];if(cd!==cost[ci])continue;
    cx=ci%cols;cy=(ci/cols)|0;
    for(k=0;k<8;k++){
      nx=cx+nbrs[k*2];ny=cy+nbrs[k*2+1];
      if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
      idx=ny*cols+nx;if(g[idx])continue;
      if(k>=4&&(g[cy*cols+nx]||g[ny*cols+cx]))continue;
      step=(k>=4?14:10)*((wide[idx]===1||(Math.abs(nx-sc)<=3&&Math.abs(ny-sr)<=3))?1:(wide[idx]===2?24:4));
      nd=cd+step;
      if(nd<cost[idx]&&pool<nxt.length){cost[idx]=nd;val[pool]=idx;dv[pool]=nd;bk=nd%NB;nxt[pool]=bh[bk];bh[bk]=pool;pool++;pending++;}
    }
  }
  for(i=0;i<n;i++){distA[i]=cost[i]===2147483647?-1:Math.min(32000,(cost[i]/10)|0);pass[i]=wide[i]===1?1:2;}
  for(i=0;i<n;i++){
    if(distA[i]<0){dir[i*2]=0;dir[i*2+1]=0;continue;}
    var x=i%cols,y=(i/cols)|0,best=cost[i],bx=0,by=0,d;
    for(k=0;k<8;k++){
      nx=x+nbrs[k*2];ny=y+nbrs[k*2+1];
      if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
      idx=ny*cols+nx;if(g[idx])continue;d=cost[idx];
      if(k>=4&&(g[y*cols+nx]||g[ny*cols+x]))continue;
      if(d<best){best=d;bx=nbrs[k*2];by=nbrs[k*2+1];}
    }
    dir[i*2]=bx;dir[i*2+1]=by;
  }
}
function updateFlow(px,py){
  if(!map.grid)return;
  var F=map._flowZ||(map._flowZ={});
  _flowBuild(F,px,py,17); /* sized for the biggest walker (tank r18) */
  map.flowDist=F.dist;map.flow=F.dir;map.wideMask=F.wide;map.flowPass=F.pass;
  /* bosses get their own, roomier field while one is alive */
  var b=typeof game!=="undefined"&&game?game.boss:null;
  if(b&&!b.dead){var FB=map._flowB||(map._flowB={});_flowBuild(FB,px,py,(b.isThanos?Math.min(30,Math.max(20,(b.r||24)+2)):14));map.flowBoss=FB.dir;}
  else map.flowBoss=null;
  map.flowT=0;
}
/* v20.2: follow the flow path through cell centres (2-cell look-ahead) so bodies stay on the
   roomy centre line instead of grinding along walls */
function flowSteer(x,y,fx,fy,fl){
  fl=fl||map.flow;
  var cs=CFG.CELL,c=clamp((x/cs)|0,0,map.cols-1),r=clamp((y/cs)|0,0,map.rows-1),k,i,dx,dy,l;
  for(k=0;k<2;k++){
    c+=fx;r+=fy;if(c<0||r<0||c>=map.cols||r>=map.rows){c-=fx;r-=fy;break;}
    i=r*map.cols+c;var nfx=fl[i*2],nfy=fl[i*2+1];if(!nfx&&!nfy)break;fx=nfx;fy=nfy;
  }
  dx=(c+0.5)*cs-x;dy=(r+0.5)*cs-y;l=Math.sqrt(dx*dx+dy*dy);
  if(l<0.5)return {x:0,y:0};
  return {x:dx/l,y:dy/l};
}
/* bosses: follow the flow path around water/props when far, go straight when close */
function chaseDir(z,dx,dy,d){
  squeezeTick(z,1/60,d);
  var fl=(z&&z.isBoss&&map.flowBoss)||map.flow;
  if(d>60&&map&&fl){var c=clamp((z.x/CFG.CELL)|0,0,map.cols-1),r=clamp((z.y/CFG.CELL)|0,0,map.rows-1),i=r*map.cols+c,fx=fl[i*2],fy=fl[i*2+1];
    if(fx||fy){var s2=flowSteer(z.x,z.y,fx,fy,fl);if(s2.x||s2.y)return s2;}}
  return {x:dx/(d||1),y:dy/(d||1)};
}
function flowDir(x,y){
  if(!map.flow)return{x:0,y:0};
  var c=clamp((x/CFG.CELL)|0,0,map.cols-1),r=clamp((y/CFG.CELL)|0,0,map.rows-1),i=r*map.cols+c;
  return{x:map.flow[i*2],y:map.flow[i*2+1]};
}
function inCamView(x,y,pad){
  pad=pad||20;var hw=worldW()*0.5+pad,hh=worldH()*0.5+pad;
  return Math.abs(x-game.camX)<hw&&Math.abs(y-game.camY)<hh;
}
function pickSpawn(p){
  if(!map.flowDist)updateFlow(p.x,p.y);
  var hw=worldW()*0.5,hh=worldH()*0.5,diag=Math.sqrt(hw*hw+hh*hh);
  var r0=diag+28,r1=diag+90;
  var bias=Math.atan2(p.lastMoveY||0,p.lastMoveX||0);
  if(!(p.lastMoveX||p.lastMoveY))bias=p.facing||0;
  function ok(x,y){
    x=clamp(x,90,CFG.MAP_W-90);y=clamp(y,90,CFG.MAP_H-90);
    if(inCamView(x,y,16))return 0;
    if(dist(p.x,p.y,x,y)<r0-8)return 0;
    if(circleHitSolid(x,y,16,"solid"))return 0;
    var c=clamp((x/CFG.CELL)|0,0,map.cols-1),r=clamp((y/CFG.CELL)|0,0,map.rows-1),idx=r*map.cols+c;
    if(map.grid[idx])return 0;
    if(map.flowDist&&map.flowDist[idx]<0)return 0;
    return{x:x,y:y};
  }
  var i,sp,ang,r;
  for(i=0;i<32;i++){
    ang=i<8?bias+(i%2?1:-1)*(0.35+i*0.12)+rand(-0.15,0.15):bias+i*2.399+rand(-0.2,0.2);
    r=r0+(i*17%100)/100*(r1-r0);
    sp=ok(p.x+Math.cos(ang)*r,p.y+Math.sin(ang)*r);if(sp)return sp;
  }
  for(r=r0;r<=r0+420;r+=36){
    for(i=0;i<14;i++){ang=bias+i*(6.283/14);sp=ok(p.x+Math.cos(ang)*r,p.y+Math.sin(ang)*r);if(sp)return sp;}
  }
  ang=bias;return{x:clamp(p.x+Math.cos(ang)*r0,90,CFG.MAP_W-90),y:clamp(p.y+Math.sin(ang)*r0,90,CFG.MAP_H-90)};
}
function zoneAt(x,y){
  var i,z,best=map.zones[0];
  for(i=0;i<map.zones.length;i++){z=map.zones[i];if(x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h)best=z;}
  return best;
}

/* ===== v20 compact arena ===== */
function b64ToU8(s){
  var bin=atob(s),i,u=new Uint8Array(bin.length);
  for(i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  return u;
}
function b64ToI16(s){
  var u=b64ToU8(s);return new Int16Array(u.buffer);
}
function decodeMapData(){
  if(!MAP_DATA||MAP_DATA._decoded)return MAP_DATA;
  MAP_DATA.walk=b64ToU8(MAP_DATA.walk_b64);
  MAP_DATA.sdf=b64ToI16(MAP_DATA.sdf_b64);
  if(MAP_DATA.type_b64)MAP_DATA.typemap=b64ToU8(MAP_DATA.type_b64);
  MAP_DATA._decoded=1;
  return MAP_DATA;
}
function sampleType(x,y){
  var D=decodeMapData(),c,r;
  if(!D||!D.typemap)return 0;
  c=Math.floor(x/D.cell);r=Math.floor(y/D.cell);
  if(c<0)c=0;else if(c>=D.cols)c=D.cols-1;
  if(r<0)r=0;else if(r>=D.rows)r=D.rows-1;
  return D.typemap[r*D.cols+c];
}
function sampleSDF(x,y){
  var D=decodeMapData();if(!D||!D.sdf)return 40;
  /* values are stored at cell centres */
  var cs=D.cell,c=x/cs-0.5,r=y/cs-0.5,c0=Math.floor(c),r0=Math.floor(r);
  var fx=c-c0,fy=r-r0;
  function at(cc,rr){
    cc=cc<0?0:(cc>=D.cols?D.cols-1:cc);
    rr=rr<0?0:(rr>=D.rows?D.rows-1:rr);
    return D.sdf[rr*D.cols+cc]/10;
  }
  var a=at(c0,r0),b=at(c0+1,r0),c1=at(c0,r0+1),d=at(c0+1,r0+1);
  return a*(1-fx)*(1-fy)+b*fx*(1-fy)+c1*(1-fx)*fy+d*fx*fy;
}
function sdfNormal(x,y){
  var e=5,dx=sampleSDF(x+e,y)-sampleSDF(x-e,y),dy=sampleSDF(x,y+e)-sampleSDF(x,y-e),l=Math.sqrt(dx*dx+dy*dy)||1;
  return {x:dx/l,y:dy/l};
}
/* v20.2.3: island bosses use a slimmer FOOTPRINT against water/forest (their body still collides
   with props and the player at full size) so they walk over the bridges like everyone else. */
var BOSS_TERRAIN_R=10;
function terrR(ent,rad){
  if(ent&&ent.isBoss&&!ent.isThanos&&!(typeof HELL!=="undefined"&&HELL.active))return Math.min(rad,BOSS_TERRAIN_R);
  return rad;
}
function terrainHit(cx,cy,rad){
  var d=sampleSDF(cx,cy);
  if(d>=rad-0.2)return null;
  var n=sdfNormal(cx,cy);
  return {k:"terrain",x:cx,y:cy,w:0,d:0,nx:n.x,ny:n.y,pen:rad-d,solid:1};
}
function hitCircleProp(s,cx,cy,rad){
  var px=s.x+s.w/2,py=s.y+s.d/2,cr=s.cr||Math.min(s.w,s.d)/2;
  var dx=cx-px,dy=cy-py,d2=dx*dx+dy*dy,lim=rad+cr;
  if(d2>=lim*lim)return null;
  var d=Math.sqrt(d2)||0.0001;
  return {k:s.k,x:s.x,y:s.y,w:s.w,d:s.d,nx:dx/d,ny:dy/d,pen:lim-d,solid:s,shape:"circle"};
}

function buildMap(seed){
  decodeMapData();
  var D=MAP_DATA;
  CFG.MAP_W=D.w;CFG.MAP_H=D.h;CFG.CELL=D.cell;
  map={zones:[],solids:[],bushes:[],decos:[],spawns:[],chunks:{},chunkS:256,dirty:1,grid:null,cols:D.cols,rows:D.rows,flow:null,flowT:0,opens:[],corridors:[],decals:[],birds:[],lamps:[],rats:[],papers:[],view:{},play:D.play,start:D.start,pond:D.pond,bridges:D.bridges||[],wheat:D.wheat||[],sdf:D.sdf,walk:D.walk};
  var i,p,list;
  map.zones=(D.zones||[]).slice();
  map.bushes=[];
  (D.bushes||[]).forEach(function(b,bi){var o={x:b.x,y:b.y,w:b.w,d:b.d||b.h,h:b.h||14,k:"wheat",bush:1},m=typeof WHEAT_MASK!=="undefined"&&WHEAT_MASK[bi];
    if(m){o.x=m.x;o.y=m.y;o.w=m.c*m.cs;o.d=m.r*m.cs;o.mask=m;} /* v20.3.3: field box = traced wheat bounds */
    map.bushes.push(o);});
  function addAll(arr){
    if(!arr)return;
    for(i=0;i<arr.length;i++){p=arr[i];addSolid({k:p.k,x:p.x,y:p.y,w:p.w,d:p.d,h:p.h,canopy:p.canopy,treeKind:p.treeKind,shape:p.shape,cr:p.cr,top:p.top,side:p.side});}
  }
  addAll(D.trees);addAll(D.ruins);addAll(D.crates);addAll(D.barrels);addAll(D.rocks);
  map.spawns=(D.spawns||[]).slice();
  (function nudgeSpawns(){
    var i,e,s;
    for(i=0;i<map.spawns.length;i++){
      s=map.spawns[i];e={x:s.x,y:s.y,r:16};resolveCircle(e);
      if(typeof sampleSDF==="function" && sampleSDF(e.x,e.y)<18){
        /* pull toward start until clear */
        var k,vx=(map.start.x-e.x),vy=(map.start.y-e.y),l=Math.hypot(vx,vy)||1;
        for(k=0;k<12 && sampleSDF(e.x,e.y)<18;k++){e.x+=vx/l*6;e.y+=vy/l*6;resolveCircle(e);}
      }
      s.x=e.x;s.y=e.y;
    }
  })();
  map.start=D.start||{x:D.w/2,y:D.h*0.7};
  map.view={
    lago:{x:(D.pond&&D.pond.x)||500,y:(D.pond&&D.pond.y)+80||360},
    trigal:{x:(D.wheat&&D.wheat[0]&&D.wheat[0].x+D.wheat[0].w/2)||280,y:(D.wheat&&D.wheat[0]&&D.wheat[0].y+D.wheat[0].h/2)||230},
    ruinas:{x:680,y:200},
    puente:{x:555,y:500},
    park:map.start,gas:map.start,street:map.start,ruins:{x:680,y:200},lot:map.start
  };
  map.opens=[{x:map.play.x0,y:map.play.y0,w:map.play.x1-map.play.x0,h:map.play.y1-map.play.y0}];
  /* grid from baked walk mask (already includes prop footprints) */
  map.grid=new Uint8Array(D.walk);
  map.cols=D.cols;map.rows=D.rows;
  map.arenaReady=1;
}

function buildGrid(){
  /* kept for compatibility; v20 grid is baked */
  if(MAP_DATA&&MAP_DATA.walk){decodeMapData();map.grid=new Uint8Array(MAP_DATA.walk);map.cols=MAP_DATA.cols;map.rows=MAP_DATA.rows;return;}
}

function circleHitSolid(cx,cy,rad,ent){
  var i,s,a=map.solids,best=null,bestD=0,mode,hit,d,dx,dy,d2,qx,qy;
  mode=typeof ent==="string"?ent:(ent?"ent":"soft");
  for(i=0;i<a.length;i++){
    s=a[i];if(s.dead)continue;
    if(s.climbable){
      if(mode==="soft")continue;
      if(mode==="ent"){
        if(ent.vaultT>0||ent.jumpT>0||ent.dashT>0||(ent.airH||0)>4||ent.isHome||ent.isColossus||ent.isBoss)continue;
      }
    }
    if(s.shape==="circle"){
      hit=hitCircleProp(s,cx,cy,rad);
      if(hit&&(!best||hit.pen>bestD)){best=hit;bestD=hit.pen;}
      continue;
    }
    qx=clamp(cx,s.x,s.x+s.w);qy=clamp(cy,s.y,s.y+s.d);
    dx=cx-qx;dy=cy-qy;d2=dx*dx+dy*dy;
    if(d2<rad*rad){
      d=Math.sqrt(d2)||0.0001;
      if(!best||rad-d>bestD){best=s;bestD=rad-d;best.nx=dx/d;best.ny=dy/d;best.pen=rad-d;}
    }
  }
  /* Projectiles fly over water and over the watery shore SDF.
     Only forest / map-edge (typemap 2) plus physical props block shots. */
  if(mode==="proj"){
    if(typeof sampleType==="function"&&sampleType(cx,cy)===2){
      hit=terrainHit(cx,cy,rad);
      if(hit&&(!best||hit.pen>bestD))best=hit;
    }
  }else{
    hit=terrainHit(cx,cy,(mode==="ent"&&ent)?terrR(ent,rad):rad);
    if(hit&&(!best||hit.pen>bestD))best=hit;
  }
  return best;
}
function _bestSdfDir(x,y){
  var k,ang,s,best=-1e9,bx=1,by=0,px,py;
  for(k=0;k<8;k++){
    ang=k*0.78539816339;
    px=x+Math.cos(ang)*6;py=y+Math.sin(ang)*6;
    s=sampleSDF(px,py);
    if(s>best){best=s;bx=Math.cos(ang);by=Math.sin(ang);}
  }
  return {x:bx,y:by};
}
function resolveCircle(ent){
  var i,hit,nx,ny,pen,dl,dr,dt,db,m,s0,s1,n,rad=ent.r||13,k;
  for(i=0;i<8;i++){
    hit=circleHitSolid(ent.x,ent.y,rad,ent);
    if(!hit)break;
    nx=hit.nx;ny=hit.ny;pen=hit.pen;
    if(!(pen>0))break;
    if(Math.abs(nx)+Math.abs(ny)<0.08){
      if(hit.k==="terrain"||hit.k==="sdf"){n=sdfNormal(ent.x,ent.y);nx=n.x;ny=n.y;}
      else if(hit.w||hit.d){
        dl=ent.x-hit.x;dr=hit.x+hit.w-ent.x;dt=ent.y-hit.y;db=hit.y+hit.d-ent.y;m=Math.min(dl,dr,dt,db);
        if(m===dl){nx=-1;ny=0;pen=rad+dl;}
        else if(m===dr){nx=1;ny=0;pen=rad+dr;}
        else if(m===dt){nx=0;ny=-1;pen=rad+dt;}
        else{nx=0;ny=1;pen=rad+db;}
      }else{n=_bestSdfDir(ent.x,ent.y);nx=n.x;ny=n.y;}
    }
    if(Math.abs(nx)+Math.abs(ny)<0.08){n=_bestSdfDir(ent.x,ent.y);nx=n.x;ny=n.y;}
    s0=sampleSDF(ent.x,ent.y);
    ent.x+=nx*pen;ent.y+=ny*pen;
    s1=sampleSDF(ent.x,ent.y);
    if(s1<s0-0.15 && s0<terrR(ent,rad)){
      /* stepped deeper into terrain — revert and climb SDF */
      ent.x-=nx*pen;ent.y-=ny*pen;
      n=_bestSdfDir(ent.x,ent.y);
      pen=Math.max(2,rad-sampleSDF(ent.x,ent.y));
      ent.x+=n.x*pen;ent.y+=n.y*pen;
    }
  }
  /* final escape so we never remain in water / forest */
  var trad=terrR(ent,rad);
  for(i=0;i<10;i++){
    s0=sampleSDF(ent.x,ent.y);
    if(s0>=trad-0.2)break;
    n=sdfNormal(ent.x,ent.y);
    if(Math.abs(n.x)+Math.abs(n.y)<0.08)n=_bestSdfDir(ent.x,ent.y);
    ent.x+=n.x*Math.max(2,trad-s0);
    ent.y+=n.y*Math.max(2,trad-s0);
    hit=circleHitSolid(ent.x,ent.y,rad,ent);
    if(hit&&hit.k!=="terrain"){ent.x+= (hit.nx||0)*((hit.pen||2));ent.y+=(hit.ny||0)*((hit.pen||2));}
  }
  /* never clamp to the play AABB — it includes river corners */
  ent.x=clamp(ent.x,8,CFG.MAP_W-8);
  ent.y=clamp(ent.y,8,CFG.MAP_H-8);
  if(sampleSDF(ent.x,ent.y)<terrR(ent,ent.r||13)-0.2 && ent._gx!=null){
    ent.x=ent._gx;ent.y=ent._gy;
  }
}
/* v20.2: a big body that makes no progress toward the hero for ~2 s squeezes (smaller
   collision radius, same look) through the gap, then regains its size in open ground */
function squeezeTick(z,dt,d){
  if(z._qx==null){z._qx=z.x;z._qy=z.y;z._qt=0;z._qs=0;}
  z._qt+=dt;
  if(z._qt>=1){var m=Math.hypot(z.x-z._qx,z.y-z._qy);z._qs=(m<10&&d>(z.r||13)+40)?z._qs+1:0;z._qx=z.x;z._qy=z.y;z._qt=0;}
  if(z._qs>=2&&!z._sqR&&(z.r||13)>11){z._sqR=11;z._sqT=2.5;}
  if(z._sqR){z._sqT-=dt;if(z._sqT<=0&&sampleSDF(z.x,z.y)>=(z.r||13)+1){z._sqR=0;z._qs=0;}}
}
function moveWithSlide(ent,dx,dy){
  var rSave=ent.r;if(ent._sqR)ent.r=ent._sqR;
  _moveWithSlide(ent,dx,dy);
  ent.r=rSave;
}
function _moveWithSlide(ent,dx,dy){
  var dist=Math.hypot(dx,dy),steps,i,s,rad=terrR(ent,ent.r||13);
  if(typeof sampleSDF==="function" && sampleSDF(ent.x,ent.y)>=rad-0.5){ent._gx=ent.x;ent._gy=ent.y;}
  if(dist<0.0001){resolveCircle(ent);return;}
  steps=Math.max(1,Math.ceil(dist/3.2));s=1/steps;
  for(i=0;i<steps;i++){ent.x+=dx*s;ent.y+=dy*s;resolveCircle(ent);}
  if(typeof sampleSDF==="function" && sampleSDF(ent.x,ent.y)<(ent.r||13)*0.35 && ent._gx!=null){ent.x=ent._gx;ent.y=ent._gy;resolveCircle(ent);}
}
/* v20.1.2: safe spawns — every spawn point is validated against all props
   (trees, ruins, crates, barrels, rocks), water / forest edge (typemap + SDF)
   and the baked walk grid, with clearance for the biggest unit. */
var SPAWN_CLEAR_Z=22,SPAWN_CLEAR_BOSS=30;
function spawnBlocked(x,y,rad){
  rad=rad||SPAWN_CLEAR_Z;
  if(!(x>=rad+4&&y>=rad+4&&x<=CFG.MAP_W-rad-4&&y<=CFG.MAP_H-rad-4))return 1;
  if(typeof sampleType==="function"&&sampleType(x,y)!==0)return 1;
  if(typeof sampleSDF==="function"&&sampleSDF(x,y)<rad)return 1;
  /* props: test every solid, including climbable ones, with full radius */
  var i,s,a=map.solids||[],qx,qy,dx,dy,cr;
  for(i=0;i<a.length;i++){
    s=a[i];if(!s||s.dead)continue;
    if(s.shape==="circle"){
      cr=s.cr||Math.min(s.w,s.d)/2;dx=x-(s.x+s.w/2);dy=y-(s.y+s.d/2);
      if(dx*dx+dy*dy<(rad+cr)*(rad+cr))return 1;
      continue;
    }
    qx=clamp(x,s.x,s.x+s.w);qy=clamp(y,s.y,s.y+s.d);dx=x-qx;dy=y-qy;
    if(dx*dx+dy*dy<rad*rad)return 1;
  }
  if(spawnHidden(x,y,rad))return 1;
  if(map.grid){
    var need=Math.ceil(rad/CFG.CELL)+1,cc,rr,c0,r0,px,py,lim=(rad+CFG.CELL*0.4)*(rad+CFG.CELL*0.4);
    c0=(x/CFG.CELL)|0;r0=(y/CFG.CELL)|0;
    for(rr=r0-need;rr<=r0+need;rr++){
      for(cc=c0-need;cc<=c0+need;cc++){
        px=(cc+0.5)*CFG.CELL;py=(rr+0.5)*CFG.CELL;
        if((px-x)*(px-x)+(py-y)*(py-y)>lim)continue;
        if(rr<0||rr>=map.rows||cc<0||cc>=map.cols)return 1;
        if(map.grid[rr*map.cols+cc])return 1;
      }
    }
  }
  return 0;
}
/* Spots that look "inside" a structure on screen: behind a tree sprite
   (drawn tall above its trunk, opaque from the north), under its canopy,
   or tucked into the painted ruin / crate walls just north of a footprint. */
function spawnHidden(x,y,rad){
  var i,s,a=map.solids||[],cx,cy,R,mul,hy,hw,dx,dy,ys=CFG.YSCALE||0.7,m=rad*0.5;
  for(i=0;i<a.length;i++){
    s=a[i];if(!s||s.dead)continue;
    if(s.k==="tree"){
      cx=s.x+s.w/2;cy=s.y+s.d/2;R=s.canopy||34;dx=x-cx;dy=y-cy;
      if(dx*dx+dy*dy<(R*0.6+m)*(R*0.6+m))return 1;
      mul=s.treeKind==="pine"?2.85:s.treeKind==="bushy"?2.25:2.55;
      hy=R*mul/ys;hw=R*mul*0.78*(s.treeKind==="pine"?0.32:0.4);
      if(dy<0&&dy>-hy*0.92&&Math.abs(dx)<hw+m*0.5)return 1;
      continue;
    }
    if(s.k==="ruin"||s.k==="crate"||s.k==="barrel"||s.k==="rock"){
      hy=(s.h||16)/ys+m;
      if(x>s.x-m&&x<s.x+s.w+m&&y<s.y+s.d&&y>s.y-hy)return 1;
    }
  }
  return 0;
}
function _freeCells(rad){
  map._freeCache=map._freeCache||{};
  var key=rad+":"+(map.solids?map.solids.length:0);
  if(map._freeCache[key])return map._freeCache[key];
  var out=[],c,r,wx,wy;
  for(r=1;r<map.rows-1;r++)for(c=1;c<map.cols-1;c++){
    if(map.grid&&map.grid[r*map.cols+c])continue;
    wx=(c+0.5)*CFG.CELL;wy=(r+0.5)*CFG.CELL;
    if(!spawnBlocked(wx,wy,rad))out.push({x:wx,y:wy});
  }
  map._freeCache[key]=out;return out;
}
function placeOnGround(ent){
  if(!ent)return ent;
  var rad=ent.isBoss?Math.max(ent.r||26,SPAWN_CLEAR_BOSS):(ent.r||13)+2,i,ang,d,px,py,best=null,bd=1e18,f;
  if(!spawnBlocked(ent.x,ent.y,rad))return ent;
  for(d=6;d<=150;d+=6){
    for(i=0;i<24;i++){
      ang=i*(6.28318530718/24);
      px=ent.x+Math.cos(ang)*d;py=ent.y+Math.sin(ang)*d;
      if(!spawnBlocked(px,py,rad)){ent.x=px;ent.y=py;return ent;}
    }
  }
  f=_freeCells(rad);
  for(i=0;i<f.length;i++){d=(f[i].x-ent.x)*(f[i].x-ent.x)+(f[i].y-ent.y)*(f[i].y-ent.y);if(d<bd){bd=d;best=f[i];}}
  if(best){ent.x=best.x;ent.y=best.y;}
  return ent;
}
function pickSpawn(p,radOpt){
  if(!map.flowDist)updateFlow(p.x,p.y);
  var hw=worldW()*0.5,hh=worldH()*0.5,diag=Math.sqrt(hw*hw+hh*hh);
  var r0=diag+24,i,best=null,bestD=0,s,d,rad=radOpt||SPAWN_CLEAR_Z;
  function reach(x,y){
    if(!map.flowDist)return 1;
    var c=clamp((x/CFG.CELL)|0,0,map.cols-1),r=clamp((y/CFG.CELL)|0,0,map.rows-1);
    return map.flowDist[r*map.cols+c]>=0;
  }
  function usable(x,y){
    if(inCamView(x,y,20))return 0;
    if(dist(p.x,p.y,x,y)<Math.max(140,r0-40))return 0;
    if(spawnBlocked(x,y,rad))return 0;
    return reach(x,y);
  }
  if(map.spawns&&map.spawns.length){
    for(i=0;i<map.spawns.length;i++){
      s=map.spawns[(i*7+((game&&game.time*10)|0))%map.spawns.length];
      if(!usable(s.x,s.y))continue;
      d=dist(p.x,p.y,s.x,s.y);
      /* prefer spawns with a roomy route to the player (no squeezing between trees) */
      if(map.flowPass&&map.flowPass[clamp((s.y/CFG.CELL)|0,0,map.rows-1)*map.cols+clamp((s.x/CFG.CELL)|0,0,map.cols-1)]!==1)d*=0.3;
      if(d>bestD){bestD=d;best=s;}
    }
    if(best)return {x:best.x,y:best.y};
  }
  var ang,r,pt;
  for(r=r0;r<=r0+320;r+=24){
    for(i=0;i<20;i++){
      ang=i*(6.283/20)+(p.facing||0);
      pt={x:p.x+Math.cos(ang)*r,y:p.y+Math.sin(ang)*r};
      if(usable(pt.x,pt.y))return pt;
    }
  }
  /* still valid ground, even if close / on camera — never a blocked point */
  var f=_freeCells(rad),cand=null;bestD=-1;
  for(i=0;i<f.length;i++){
    if(!reach(f[i].x,f[i].y))continue;
    d=dist(p.x,p.y,f[i].x,f[i].y);
    if(inCamView(f[i].x,f[i].y,10))d*=0.25;
    if(d>bestD){bestD=d;cand=f[i];}
  }
  if(cand)return {x:cand.x,y:cand.y};
  if(f.length)return {x:f[0].x,y:f[0].y};
  return {x:map.start.x,y:map.start.y};
}
function pickBossSpawn(p){
  /* open clearing south of the pond / north of the stone bridge */
  var rad=SPAWN_CLEAR_BOSS,cands=[
    {x:(map.start&&map.start.x)||552,y:((map.start&&map.start.y)||430)-20},
    {x:620,y:400},{x:500,y:400},{x:640,y:360},{x:480,y:360}
  ],i,s,e;
  for(i=0;i<cands.length;i++){
    s=cands[i];
    if(!spawnBlocked(s.x,s.y,rad))return {x:s.x,y:s.y};
  }
  e=pickSpawn(p||(game&&game.player)||{x:552,y:430},rad);
  return e;
}
function zoneAt(x,y){
  var i,z,best=null,ba=1e15,a,t,n=10;
  for(i=0;i<(map.zones||[]).length;i++){
    z=map.zones[i];
    if(x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+(z.h||z.d||0)){
      a=z.w*(z.h||z.d||1);
      if(a<ba){ba=a;best=z;}
    }
  }
  if(best)return best;
  t=typeof sampleType==="function"?sampleType(x,y):0;
  if(t===1)return {k:"pond",name:"Lago"};
  if(t===2)return {k:"forest",name:"Bosque"};
  if(typeof sampleType==="function"&&(sampleType(x+n,y)===2||sampleType(x-n,y)===2||sampleType(x,y+n)===2||sampleType(x,y-n)===2))
    return {k:"forest",name:"Bosque"};
  return {k:"path",name:"Camino"};
}
/* v20.3.3: the wheat zone is the painted wheat itself, not its bounding rectangle. Masks were traced from
   arena.webp (2 world px cells, 1 cell eroded, top edge lowered by the stalk height) and are tested at the
   feet point (entity x,y), so walking past the field no longer triggers the slow-down / stalks overlay. */
var WHEAT_MASK=[{"x":179,"y":153,"c":89,"r":86,"cs":2,"b":"AAAAAAAAAAAgAAAAAAAAAAAAADgAAAAAAAAAAAADf7AAAAAAAAAAAAH/+AAAAAAAAAAAA//8AAAAAAAAAAAB//8AAAAAAAAAAAH///AAAAAAAAADD///+AAAAAAAAAfn///+AAAAAAAAT/P////QAAAAAAA///////4AAAAAAP///////4AAAAAAf///////4AAAAAA////////4AAAAAD////////wAAAAAH////////wAAAAAP////////gAAAAA/////////AAAAPH////////+AAAAff////////8AAAA//////////4AAAD/////////PgAAAP////////8MAAAT/////////4QAAB//////////wAAAH//////////AAAAP/////////8AAAAf////////fIAAAAf///////8YAAAAB////////4AAAAAH///////9wAAAAAH///////xAAAAAcf///////gAAAAM9////////AAAAA7////////+AAAAA/////////oAAAAB////////+AAAAAD////////wAAAAAH////////AAAAAAH///////+AAAAAAP///////4AAAAAAf///////wAAAAAZ///////+AAAAABz///////4AAAAAD3///////gAAAAAH///////+AAAAAAP///////8AAAAAAf///////4AAAAAA////////4AAAAAB////////wAAAAAD////////gAAAAAH////////gAAAAAP////////gAAAAAf////////gAAAAA/////////AAAAAB////////+AAAAAD/////////gAAAAH/////////gAAAAP/////////AAAAAf/////////AAAAA/////////+AAAAB/////////8AAAAD/////////4AAAAH/////////4AAAAP/////////gAAAAf/////////gAAAAf////////+AAAAA/////////4AAAAA/////////gAAAAA///////3gAAAAAB///////CAAAAAAD/////P8AAAAAAAD////8PIAAAAAAAH////4MAAAAAAAAP///34QAAAAAAAAP///HwAAAAAAAAAH//+HAAAAAAAAAAH//4eAAAAAAAAAAP//wcAAAAAAAAAAH//gQAAAAAAAAAAH/+AAAAAAAAAAAAf/4AAAAAAAAAAAA/54AAAAAAAAAAAA/hgAAAAAAAAAAAA/DAAAAAAAAAAAAAMAAAAAAAAAAAA"},{"x":769,"y":353,"c":55,"r":45,"cs":2,"b":"AAAAACAAAAAAAABAAAAAAAAB6AAAAAAAH/gAAAAAAX/wAAAAAAP/4gAAAAAH//4AAAAAn//9AAAAA////gAAAC////gAAAB////4AAGR////+AAH4////+AAD+/////gAB//////+AA///////AAf//////4AP//////8AP//////+AH///////wL///////4H///////8X///////+//////////////////f///////9v///////8X///////8D////////A////////Af///////AP//////3wD//////xwA3/////wgAB/////8AAA/////+AAAP/////AAAH///84AAAA3//8IAAAAB//+AAAAAAH//AAAAAABf/AAAAAAAGegAAAAAAAGAAAAAAAACAAAAAA=="}];
(function(){for(var i=0;i<WHEAT_MASK.length;i++){var m=WHEAT_MASK[i],s=atob(m.b),u=new Uint8Array(s.length),j;for(j=0;j<s.length;j++)u[j]=s.charCodeAt(j);m.bits=u;}})();
function wheatMaskAt(m,x,y){
  var c=Math.floor((x-m.x)/m.cs),r=Math.floor((y-m.y)/m.cs);if(c<0||r<0||c>=m.c||r>=m.r)return 0;
  var n=r*m.c+c;return (m.bits[n>>3]>>(7-(n&7)))&1;
}
function inWheat(x,y){
  var i,b=map.bushes;
  if(!b)return 0;
  for(i=0;i<b.length;i++){var f=b[i];if(f.k!=="wheat"||x<f.x||x>f.x+f.w||y<f.y||y>f.y+f.d)continue;
    if(!f.mask||wheatMaskAt(f.mask,x,y))return f;}
  return 0;
}
function terrainSpeedMul(x,y){
  var m=1;
  if(inWheat(x,y))m*=0.78;
  if(typeof eventSpeedMul==="function")m*=eventSpeedMul(x,y);
  return m;
}
