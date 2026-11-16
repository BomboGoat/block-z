/* node tests/upgrade_audit.js <port> [outdir] [heroes] — plays every card of every hero and checks its effect. */
const { chromium } = require("/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright");
const fs=require("fs"),path=require("path");
const port=process.argv[2]||8897,out=process.argv[3]||"/tmp/ua";fs.mkdirSync(out,{recursive:true});
const HEROES=(process.argv[4]||"classic,trueno,mr,gompa,neizan").split(",");
/* card -> [scenario, metric, comparison, prerequisites]  (">" = must increase, "<" = must decrease) */
const E={
 dmg:["crowd","dmg",">"],firerate:["crowd","atk",">"],hp:["stat","maxHp",">"],heal:["healnow","hp",">"],speed:["move","dist",">"],
 luck:["stat","luck",">"],regen:["heal","healed",">"],crit:["crowd","crits",">",null,{T:15}],critDmg:["crowd","dmg",">",["crit"]],
 vampKill:["killheal","healed",">"],secondWind:["wave","healed",">"],superCharge:["crowd","tReady","<",null,{T:16}],superCD:["crowd","tReady","<",null,{T:16}],
 xpBoost:["kill","xp",">"],hunter:["boss","dmg",">"],shield:["hurt","taken","<"],magnet:["kill","xp",">"],lastStand:["lowhp","dmg",">"],
 luckyCharm:["stat","critChance",">"],revive:["lethal","survived",">"],swift:["move","dist",">"],
 multishot:["crowd","proj",">"],bulletStorm:["crowd","proj",">"],pierce:["crowd","pPierce",">"],bounce:["crowd","pBounce",">"],
 fire:["crowd","burn",">"],ice:["crowd","slow",">"],poison:["crowd","poison",">"],explosive:["crowd","dmg",">"],heavy:["crowd","dmg",">"],
 range:["far","dmg",">"],melee:["close","dmg",">"],drone:["crowd","dmg",">"],dog:["crowd","dmg",">"],clone:["crowd","dmg",">"],
 frenzy:["kill","atk",">"],bloodlust:["kill","dmgPerHit",">"],chain:["crowd","hits",">"],critBolt:["crowd","hits",">",["crit"]],spark:["crowd","hits",">"],
 overcharge:["crowd","atk",">"],meteors:["crowd","dmg",">"],blackHole:["crowd","dmg",">"],phoenix:["lethal","survived",">"],orbit:["close","dmg",">"],
 ninja:["move","dist",">"],shadow:["hurt","taken","<"],lifesteal:["healcrowd","healed",">"],vampBat:["healcrowd","healed",">"],
 giant:["stat","maxHp",">"],stomp:["hurt","dmg",">"],tanky:["hurt","taken","<"],fortress:["stat","maxHp",">"],berserk:["lowhp","dmg",">"],
 thorns:["hurt","dmg",">"],chainBoom:["kill","kills",">"],shieldRegen:["hurt","blocks",">",["shield"]],fireAura:["close","dmg",">"],
 hero_chain:["crowd","hits",">"],hero_storm:["stat","laserLen",">"],hero_slash:["far","dmg",">"],hero_bleed:["crowd","poison",">"],
 hero_iron:["crowd","dmg",">"],hero_flex:["stat","superR",">"],hero_dual:["crowd","proj",">"],hero_cloud:["crowd","dmg",">"],
 hero_fan:["crowd","proj",">"],hero_shockN:["crowd","dmg",">"],
 shotgun:["close","dmg",">"],smg:["crowd","dmg",">"],revolver:["crowd","dmg",">"],rifle:["crowd","dmg",">"],gl:["crowd","dmg",">"],
 pistol_up:["crowd","dmg",">"],smg_up:["crowd","dmg",">",["smg"]],shotgun_up:["close","dmg",">",["shotgun"]],revolver_up:["crowd","dmg",">",["revolver"]],
 rifle_up:["crowd","dmg",">",["rifle"]],gl_up:["crowd","dmg",">",["gl"]],
 hero_nzWide:["crowd","proj",">"],hero_nzSlug:["crowd","dmgPerHit",">"],hero_nzKnock:["crowd","knock",">"],hero_nzDouble:["crowd","proj",">"],
 hero_nzMini:["stat","miniT",">"],hero_nzArmor:["hurt","taken","<"],
 /* v20.5 signature cards (Épica / Mítica / Legendaria) */
 hc_classic_e:["crowd","proj",">"],hc_classic_m:["crowd","dmg",">"],hc_classic_l:["crowd","dmg",">",null,{T:9}],
 hc_trueno_e:["close","dmg",">"],hc_trueno_m:["crowd","dmg",">"],hc_trueno_l:["crowd","dmg",">",null,{T:9}],
 hc_mr_e:["crowd","dmg",">"],hc_mr_m:["close","dmg",">"],hc_mr_l:["crowd","dmg",">"],
 hc_gompa_e:["close","dmg",">"],hc_gompa_m:["crowd","dmg",">"],hc_gompa_l:["crowd","dmg",">",null,{T:9}],
 hc_neizan_e:["crowd","burn",">"],hc_neizan_m:["crowd","dmg",">"],hc_neizan_l:["crowd","dmg",">",null,{T:9}]
};
const HERO_E={trueno:{multishot:["crowd","hits",">"],range:["spread","hits",">"]}};
const SUPER_E=["crowd","dmg",">",null,{T:4}];
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:"/usr/bin/google-chrome",args:["--no-sandbox"]});
 const pg=await (await b.newContext({viewport:{width:844,height:390},deviceScaleFactor:1})).newPage();
 const errs=[];pg.on("pageerror",e=>errs.push(e.message));
 await pg.addInitScript(()=>{const o=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>window.__hold?0:o(cb);});
 await pg.goto(`http://127.0.0.1:${port}/index.html?t=${Date.now()}`,{waitUntil:"networkidle"});await pg.waitForTimeout(1200);
 await pg.addScriptTag({content:fs.readFileSync(path.join(__dirname,"ua_page.js"),"utf8")});
 await pg.evaluate(()=>{window.__hold=1;window.startFireLoop=function(){};});
 const rows=[],base={};
 for(const hero of HEROES){
  const pool=await pg.evaluate(h=>__UA.pool(h),hero);pool.push({id:"__super",name:"SUPER (ulti)",desc:"La habilidad definitiva del héroe"});
  for(const c of pool){
   let e=c.id==="__super"?SUPER_E:(HERO_E[hero]&&HERO_E[hero][c.id])||E[c.id];
   if(!e){rows.push({hero,id:c.id,name:c.name,desc:c.desc,result:"NO TEST"});console.log(hero,c.id,"NO TEST");continue;}
   let [scen,metric,op,pre,xo]=e;pre=(pre||[]).slice();if(c.reqWeapon&&c.reqWeapon!=="pistol")pre.push(c.reqWeapon);
   let sc=scen,opts=Object.assign({},xo||{});
   if(scen==="healnow"){sc="heal";opts.instant=1;}
   if(scen==="killheal"){sc="kill";opts.hurtFirst=1;}
   if(scen==="healcrowd"){sc="crowd";opts.hurtFirst=1;}
   const run=async(card)=>pg.evaluate(([h,card,sc,pre,opts])=>__UA.run(h,card,sc,pre,opts),[hero,card,sc,pre,opts]).catch(err=>({error:String(err).slice(0,200)}));
   const key=hero+"|"+scen+"|"+pre.join(",")+"|"+JSON.stringify(opts);
   if(!base[key])base[key]=await run(null);
   const r=await run(c.id),bv=base[key][metric],cv=r[metric];
   let ok=!r.error&&!base[key].error&&(op===">"?cv>bv*1.001+1e-9:cv<bv*0.999-1e-9);
   rows.push({hero,id:c.id,name:c.name,desc:c.desc,scen,metric,op,base:bv,with:cv,result:r.error?("ERROR "+r.error):base[key].error?("ERROR base "+base[key].error):ok?"PASS":"FAIL"});
   console.log(`${hero} ${c.id} ${metric} ${typeof bv==="number"?bv.toFixed(2):bv} -> ${typeof cv==="number"?cv.toFixed(2):cv} ${rows[rows.length-1].result}`);
  }
 }
 fs.writeFileSync(out+"/results.json",JSON.stringify(rows,null,1));
 const pass=rows.filter(r=>r.result==="PASS").length;console.log(`PASS ${pass}/${rows.length}`,errs.slice(0,5));
 await b.close();
})();
