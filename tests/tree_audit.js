/* node tests/tree_audit.js <port> — checks sprite-tree spacing (no fused canopies) and clearance from ruins/props. */
const { chromium } = require("/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright");
const port=process.argv[2]||8897;
(async()=>{const b=await chromium.launch({headless:true,executablePath:"/usr/bin/google-chrome",args:["--no-sandbox"]});
const p=await (await b.newContext({viewport:{width:844,height:390}})).newPage();
await p.goto(`http://127.0.0.1:${port}/index.html?t=${Date.now()}`,{waitUntil:"networkidle"});await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{selectedHero="classic";startGame();
  const T=map.solids.filter(s=>s.k==="tree").map(s=>({x:s.x+s.w/2,y:s.y+s.d/2,R:s.canopy||40}));
  const P=map.solids.filter(s=>s.k!=="tree");const bad=[];
  for(let i=0;i<T.length;i++){for(let j=i+1;j<T.length;j++){const d=Math.hypot(T[i].x-T[j].x,T[i].y-T[j].y);if(d<(T[i].R+T[j].R)*1.1)bad.push(["trees",i,j,Math.round(d)]);}
    for(const s of P){const qx=Math.max(s.x,Math.min(T[i].x,s.x+s.w)),qy=Math.max(s.y,Math.min(T[i].y,s.y+s.d)),d=Math.hypot(T[i].x-qx,T[i].y-qy);if(d<T[i].R*0.55)bad.push(["prop",i,s.k,Math.round(d)]);}
    const c=MAP_DATA.cell,k=Math.floor(T[i].y/c)*MAP_DATA.cols+Math.floor(T[i].x/c);if(map.grid[k]!==1)bad.push(["trunk-not-solid",i]);}
  return {n:T.length,bad};});
console.log("trees",r.n,"issues",r.bad.length,JSON.stringify(r.bad));process.exitCode=r.bad.length?1:0;await b.close();})();
