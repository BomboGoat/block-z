/* Block Z upgrade audit: runs inside the game page. For each hero and each card in that hero's pool it plays a
   deterministic scenario twice (without / with the card) and measures what actually changes. */
(function(){
var UA=window.__UA={};
function seed(s){var a=s|0;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
var M=null;
function hook(){
  if(UA._hooked)return;UA._hooked=1;
  var _hz=hurtZombie;hurtZombie=function(z,d){if(M){M.hits++;M.dmgArg+=d||0;}return _hz.apply(this,arguments);};
  var _ma=markAttack;markAttack=function(){if(M)M.atk++;return _ma.apply(this,arguments);};
  var _ft=floatText;floatText=function(x,y,t){if(M&&t==="CRÍT")M.crits++;if(M&&t==="MISS")M.miss++;return _ft.apply(this,arguments);};
}
function wrapBullets(){var arr=game.bullets,op=arr.push;arr.push=function(){for(var i=0;i<arguments.length;i++){var b=arguments[i];if(M){M.proj++;if(b.bounce>0)M.pBounce++;if(b.pierce||(b.pierceLeft>0))M.pPierce++;}}return op.apply(this,arguments);};}
UA.setup=function(hero,pre){
  hook();seed(777);var dn=Date.now;Date.now=function(){return 1700000000000;};
  titleSplash=0;selectedHero=hero;startGame();Date.now=dn;
  var g=game;g.countdown=0;if(g.state==="countdown")beginCombat();
  g.state="playing";g.zombies=[];g.spawnQueue=[{type:"hold"}];g.events=[];g.graceT=1e9;g.bossFight=0;
  var p=g.player;/* v22.0: Mr's ulti ring is tested on open grass (the v21.5 traced boulder north of the start sat inside the ring) */if(hero==="mr"&&(typeof WORLD==="undefined"||WORLD.cur!==2)){p.x=500;p.y=470;p.vx=p.vy=0;}p.runXPNext=1e12;p.invuln=0;
  (pre||[]).forEach(function(id){UA.give(id);});
  wrapBullets();seed(4242);
  return p;
};
UA.def=function(id){return UPGRADE_DEFS.filter(function(d){return d.id===id;})[0];};
UA.give=function(id,ri){var d=UA.def(id);if(!d)throw new Error("no card "+id);if(ri==null)ri=d.fixedR!=null?d.fixedR:4;applyUpgrade(game.player,d,ri);};
UA.pool=function(hero){
  var p={hero:hero,weapon:hero==="classic"?"pistol":null};
  return UPGRADE_DEFS.filter(function(d){
    if(d.hero&&d.hero!==hero)return 0;if(!upgAllowed(d,hero))return 0;if(d.weapon&&hero!=="classic")return 0;
    if(typeof upgHeroOk==="function"&&!upgHeroOk(d,hero))return 0;
    if(d.flag==="hasMelee"&&(hero==="mr"||hero==="gompa"||hero==="neizan"))return 0;
    if((d.flag==="pierce"||d.flag==="bounce")&&hero!=="classic")return 0;
    return 1;}).map(function(d){return {id:d.id,name:d.name,desc:(typeof buildUpgradeCard==="function"?(function(){try{var gp=game&&game.player;var c=buildUpgradeCard(d,d.fixedR!=null?d.fixedR:Math.max(d.minR||0,d.exclusive?4:2));return c.desc;}catch(e){return d.desc||"";}})():d.desc),minR:d.minR||0,fixedR:d.fixedR,reqWeapon:d.reqWeapon,req:d.req,weapon:d.weapon};});
};
function dummy(x,y,hp,boss){var z=spawnZombie("normal",x,y,0);z.hp=z.maxHp=hp;z.speed=0;z.damage=0;z.spawnT=0;z.ax=x;z.ay=y;z.armor=0;if(boss){z.isBoss=1;}game.zombies.push(z);return z;}
function spots(p,kind){
  var out=[],i,a;
  if(kind==="close"){for(i=0;i<5;i++){a=-0.8+i*0.4;out.push([p.x+Math.cos(a)*34,p.y+Math.sin(a)*34]);}}
  else if(kind==="far"){var R=UA._far||360;for(i=0;i<3;i++){a=-0.12+i*0.12;out.push([p.x+Math.cos(a)*R,p.y+Math.sin(a)*R]);}}
  else if(kind==="one"){out.push([p.x+90,p.y]);}
  else if(kind==="spread"){for(i=0;i<5;i++)out.push([p.x+70+i*150,p.y+(i%2?10:-10)]);}
  else {for(i=0;i<8;i++){a=-0.9+i*0.26;var r=70+(i%3)*28;out.push([p.x+Math.cos(a)*r,p.y+Math.sin(a)*r]);}}
  return out;
}
UA.run=function(hero,cardId,scen,pre,opts){
  opts=opts||{};var p=UA.setup(hero,pre);
  if(scen==="far"||scen==="spread")UA._far=heroRange(p)*1.12+4; /* just beyond the hero's base reach */
  if(scen==="heal"||opts.hurtFirst){p.hp=Math.round(p.maxHp*0.5);}
  if(cardId==="__super"){p.super=superCost(p);}
  else if(cardId)UA.give(cardId,opts.ri);
  var T=opts.T||6,dt=1/60,i,t,list=[],kill=scen==="kill",HP=kill?18:1e6;
  if(scen==="lowhp"){p.hp=p.maxHp*0.25;}
  M={knock:0,hits:0,dmgArg:0,atk:0,crits:0,miss:0,proj:0,pBounce:0,pPierce:0,dmg:0,burn:0,slow:0,poison:0,healed:0,taken:0,dist:0,kills0:game.kills,xp0:p.runXP,tReady:-1};
  var res={hero:hero,card:cardId,scen:scen};
  if(scen==="stat"||scen==="heal"&&opts.instant){res.maxHp=p.maxHp;res.hp=p.hp;res.luck=p.luck||0;res.critChance=p.critChance||0;res.speedMul=p.speedMul;res.armorMul=p.armorMul||1;res.evasion=p.evasion||0;res.laserLen=(typeof truenoLaserLen==="function")?truenoLaserLen(p):0;var sp=superPreview(p,0);res.superR=sp.r||0;res.superLen=sp.len||0;res.miniT=10+(p.miniBonus||0);res.miniRate=p.miniRate||1;M=null;return res;}
  if(scen==="wave"){p.hp=p.maxHp*0.5;var h0=p.hp;game.zombies=[];game.spawnQueue=[];onWaveCleared();res.healed=p.hp-h0;M=null;return res;}
  if(scen==="move"){input.joy=1;input.jx=1;input.jy=0;var x0=p.x;for(t=0;t<1;t+=dt)update(dt);input.joy=0;input.jx=0;res.dist=p.x-x0;M=null;return res;}
  if(scen==="hurt"||scen==="lethal"){
    var near=[];for(i=0;i<4;i++){near.push(dummy(p.x+Math.cos(i*1.57)*40,p.y+Math.sin(i*1.57)*40,1e6));}
    var hp0=p.hp,blocks=0,died=0,dealt0=0,survived=0;
    for(i=0;i<12;i++){p.invuln=0;var before=p.hp,sr=p.shieldReady;hurtPlayer(p,scen==="lethal"?p.maxHp*0.6:9);if(p.hasShield&&sr&&!p.shieldReady)blocks++;if(game.state==="dead"){died=1;break;}survived++;
      for(t=0;t<0.5;t+=dt){update(dt);near.forEach(function(z){z.x=z.ax;z.y=z.ay;});}}
    res.taken=hp0-p.hp+(died&&scen!=="lethal"?1e6:0);res.died=died;res.survived=survived;res.blocks=blocks;res.miss=M.miss;
    res.dmg=near.reduce(function(s,z){return s+(z.maxHp-z.hp);},0);M=null;return res;
  }
  var pos=spots(p,scen==="boss"?"one":scen==="kill"?"crowd":scen),zs=pos.map(function(q){return dummy(q[0],q[1],HP,scen==="boss");});
  var hpPrev=p.hp,cost=(typeof superCost==="function")?superCost(p):CFG.SUPER_COST;
  for(t=0;t<T;t+=dt){
    var before=zs.map(function(z){return z.hp;});
    if(cardId==="__super"&&t===0)fireSuper(p,0);
    update(dt);
    if(game.state!=="playing"){res.endState=game.state;break;}
    for(i=0;i<zs.length;i++){var z=zs[i];M.dmg+=Math.max(0,before[i]-Math.max(z.hp,kill?0:-1e9));M.knock+=Math.sqrt((z.kvx||0)*(z.kvx||0)+(z.kvy||0)*(z.kvy||0));z.x=z.ax;z.y=z.ay;
      if(z.burn>0)M.burn++;if(z.slow>0)M.slow++;if(z.poison>0)M.poison++;
      if(kill&&(z.dying||z.dead||z.hp<=0)){var k=game.zombies.indexOf(z);var nz=dummy(z.ax,z.ay,HP);zs[i]=nz;}}
    game.zombies=game.zombies.filter(function(z){return !z.dead;});
    if(p.hp>hpPrev)M.healed+=p.hp-hpPrev;hpPrev=p.hp;
    cost=(typeof superCost==="function")?superCost(p):CFG.SUPER_COST;
    if(M.tReady<0&&(p.super||0)>=cost-1e-6)M.tReady=t;
  }
  for(var k in M)res[k]=M[k];res.kills=game.kills-M.kills0;res.xp=p.runXP-M.xp0;res.super=p.super||0;res.dmgPerHit=M.hits?M.dmgArg/M.hits:0;
  if(res.tReady<0)res.tReady=999;
  M=null;return res;
};
})();
