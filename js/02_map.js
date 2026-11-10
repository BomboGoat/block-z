var map={zones:[],solids:[],bushes:[],decos:[],spawns:[],chunks:{},chunkS:400,dirty:1,grid:null,cols:0,rows:0,flow:null,flowT:0,decals:[],birds:[],lamps:[],rats:[],papers:[]};
function toScreen(wx,wy){return{x:layout.gameX+layout.gameDrawW/2+(wx-game.camX)*layout.scale,y:layout.gameY+layout.gameDrawH/2+(wy-game.camY)*CFG.YSCALE*layout.scale};}
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
function buildMap(seed){
  map={zones:[],solids:[],bushes:[],decos:[],spawns:[],chunks:{},chunkS:400,dirty:1,grid:null,cols:0,rows:0,flow:null,flowT:0,opens:[],corridors:[],decals:[],birds:[],lamps:[],rats:[],papers:[]};
  var MW=CFG.MAP_W,MH=CFG.MAP_H,bw=48,rng=seeded(seed||1337);
  var midX=1472,midY=1472,dw=56,GAP=40;
  map.zones=[
    {id:"park",x:bw,y:bw,w:midX-bw,h:midY-bw,k:"grass",floor:"#3aa644",floor2:"#2d8a36",name:"Parque",tint:"rgba(40,120,40,0.08)"},
    {id:"gas",x:midX+dw,y:bw,w:MW-(midX+dw)-bw,h:midY-bw,k:"plaza",floor:"#d4bc8e",floor2:"#c0a674",name:"Gasolinera",tint:"rgba(200,120,40,0.08)"},
    {id:"street",x:bw,y:midY+dw,w:midX-bw,h:MH-(midY+dw)-bw,k:"asphalt",floor:"#4a5160",floor2:"#3c424e",name:"Avenida",tint:"rgba(40,50,90,0.10)"},
    {id:"ruins",x:midX+dw,y:midY+dw,w:MW-(midX+dw)-bw,h:MH-(midY+dw)-bw,k:"ruins",floor:"#b07848",floor2:"#8d5a32",name:"Ruinas",tint:"rgba(160,70,20,0.10)"},
    {id:"lot",x:1200,y:1200,w:600,h:600,k:"parking",floor:"#4a5160",floor2:"#3c424e",name:"Aparcamiento",tint:"rgba(30,30,40,0.06)"}
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
  addWall(0,0,MW,bw,40,wallCol);addWall(0,MH-bw,MW,bw,40,wallCol);
  addWall(0,bw,bw,MH-2*bw,40,wallCol);addWall(MW-bw,bw,bw,MH-2*bw,40,wallCol);
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
    for(i=0;i<segs.length;i++)if(segs[i].w>8&&segs[i].d>8)addWall(segs[i].x,segs[i].y,segs[i].w,segs[i].d,42,wallCol);
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
  function addDecal(k,x,y,w,d,extra){var o={k:k,x:x,y:y,w:w,d:d};if(extra)for(var p in extra)o[p]=extra[p];map.decals.push(o);}
  var CARS=["#1565c0","#c62828","#f5f5f5","#212121","#ef6c00","#1a237e","#00695c","#fff8e1","#37474f"];
  function carAt(x,y,w,d,ang,wreck,ex){var e={top:rngPick(rng,CARS),ang:ang||0,wreck:wreck||0};if(ex)for(var pk in ex)e[pk]=ex[pk];return place("car",x,y,w||70,d||30,22,e);}
  /* ===== PARK ===== */
  addDecal("path",720,80,80,1360);addDecal("path",80,720,1360,80);
  place("fountain",728,728,64,64,16,{top:"#90caf9",side:"#1565c0",skipKeep:1,gap:8});
  var trees=[[180,180,42],[330,190,38],[200,330,44],[1180,180,40],[1320,200,46],[1160,330,36],[180,1160,40],[330,1180,38],[200,1300,42],[1080,980,40],[960,1080,36],[500,160,38],[960,160,42],[160,500,40],[160,960,38],[500,1280,36],[1100,500,40],[500,1100,38],[400,400,42],[1000,400,36],[400,1000,40]];
  var i,t;
  for(i=0;i<trees.length;i++){t=trees[i];place("tree",t[0],t[1],18,18,16,{top:"#5a3a1a",side:"#3a2410",canopy:t[2]});}
  place("bench",640,680,40,16,10,{top:"#8d6e4a",side:"#5d4030",tex:"wood"});
  place("bench",820,680,40,16,10,{top:"#8d6e4a",side:"#5d4030",tex:"wood"});
  place("bench",680,820,16,40,10,{top:"#8d6e4a",side:"#5d4030",tex:"wood"});
  place("bench",820,840,16,40,10,{top:"#8d6e4a",side:"#5d4030",tex:"wood"});
  place("tree",600,520,18,18,16,{top:"#5a3a1a",side:"#3a2410",canopy:40});
  place("tree",900,520,18,18,16,{top:"#5a3a1a",side:"#3a2410",canopy:44});
  place("tree",600,1080,18,18,16,{top:"#5a3a1a",side:"#3a2410",canopy:38});
  place("tree",920,1080,18,18,16,{top:"#5a3a1a",side:"#3a2410",canopy:42});
  place("tree",860,980,18,18,16,{top:"#5a3a1a",side:"#3a2410",canopy:36});
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
    s=map.solids[i];if(s.dead)continue;
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
function circleHitSolid(cx,cy,rad,ignoreBreakGone){
  var i,s,a=map.solids,best=null,bestD=0;
  for(i=0;i<a.length;i++){
    s=a[i];if(s.dead)continue;
    var qx=clamp(cx,s.x,s.x+s.w),qy=clamp(cy,s.y,s.y+s.d);
    var dx=cx-qx,dy=cy-qy,d2=dx*dx+dy*dy;
    if(d2<rad*rad){var d=Math.sqrt(d2)||0.0001;if(!best||rad-d>bestD){best=s;bestD=rad-d;best.nx=dx/d;best.ny=dy/d;best.pen=rad-d;}}
  }
  return best;
}
function resolveCircle(ent){
  var i;
  for(i=0;i<3;i++){
    var hit=circleHitSolid(ent.x,ent.y,ent.r);
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
function updateFlow(px,py){
  var cols=map.cols,rows=map.rows,cell=CFG.CELL,g=map.grid;
  if(!g)return;
  var sc=clamp((px/cell)|0,0,cols-1),sr=clamp((py/cell)|0,0,rows-1);
  var n=cols*rows,distA=map.flowDist||(map.flowDist=new Int16Array(n));
  var dir=map.flow||(map.flow=new Int8Array(n*2));
  var i;for(i=0;i<n;i++)distA[i]=-1;
  var qx=map.qx||(map.qx=new Int16Array(n)),qy=map.qy||(map.qy=new Int16Array(n));
  var h=0,t=0;qx[t]=sc;qy[t]=sr;t++;distA[sr*cols+sc]=0;
  var nbrs=[1,0,-1,0,0,1,0,-1,1,1,1,-1,-1,1,-1,-1];
  while(h<t){
    var cx=qx[h],cy=qy[h];h++;
    var cd=distA[cy*cols+cx],k;
    for(k=0;k<8;k++){
      var nx=cx+nbrs[k*2],ny=cy+nbrs[k*2+1];
      if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
      var idx=ny*cols+nx;if(g[idx]||distA[idx]>=0)continue;
      if(k>=4&&(g[cy*cols+nx]||g[ny*cols+cx]))continue;
      distA[idx]=cd+1;qx[t]=nx;qy[t]=ny;t++;
    }
  }
  for(i=0;i<n;i++){
    if(distA[i]<0){dir[i*2]=0;dir[i*2+1]=0;continue;}
    var x=i%cols,y=(i/cols)|0,best=distA[i],bx=0,by=0,k;
    for(k=0;k<8;k++){
      var nx=x+nbrs[k*2],ny=y+nbrs[k*2+1];
      if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
      var idx=ny*cols+nx,d=distA[idx];
      if(d>=0&&d<best){best=d;bx=nbrs[k*2];by=nbrs[k*2+1];}
    }
    dir[i*2]=bx;dir[i*2+1]=by;
  }
  map.flowT=0;
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
  var r0=Math.max(350,diag*1.1),r1=Math.max(r0+40,diag*1.5);
  var bias=Math.atan2(p.lastMoveY||0,p.lastMoveX||0);
  if(!(p.lastMoveX||p.lastMoveY))bias=p.facing||0;
  function ok(x,y){
    x=clamp(x,90,CFG.MAP_W-90);y=clamp(y,90,CFG.MAP_H-90);
    if(dist(p.x,p.y,x,y)<350)return 0;
    if(inCamView(x,y,28))return 0;
    if(circleHitSolid(x,y,16))return 0;
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
