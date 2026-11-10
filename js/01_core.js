var CFG={MAP_W:3000,MAP_H:3000,CELL:50,YSCALE:0.70,PLAYER_R:13,PLAYER_SPEED:250,MAX_HP:100,INVULN_MS:700,AUTO_RANGE:360,FIRE_COOLDOWN:0.38,BULLET_SPEED:520,BULLET_DAMAGE:12,BULLET_LIFE:1.05,BASE_ZOMBIES:5,ZOMBIES_PER_WAVE:2,MAX_ALIVE:10,SPAWN_INTERVAL:1.25,BOSS_HP:720,CAM_LERP:6.5,WORLD_BASE_W:520,WORLD_BASE_H:300,SAFE_PAD:8,SUPER_COST:100};
var RARITIES=[
{id:"comun",name:"Común",w:55,color:"#9e9e9e",glow:"#bdbdbd",mul:1.10,frame:"#757575"},
{id:"poco_comun",name:"Poco común",w:25,color:"#2196f3",glow:"#64b5f6",mul:1.18,frame:"#1565c0"},
{id:"rara",name:"Rara",w:12,color:"#9c27b0",glow:"#ce93d8",mul:1.30,frame:"#6a1b9a"},
{id:"epica",name:"Épica",w:6,color:"#e53935",glow:"#ef9a9a",mul:1.45,frame:"#b71c1c"},
{id:"legendaria",name:"Legendaria",w:2,color:"#ffc107",glow:"#ffe082",mul:1.70,frame:"#ff8f00"}
];
var ZT={
normal:{hp:30,speed:78,damage:10,r:13,h:28,color:"#4a7c3f",score:10,xp:12},
fast:{hp:18,speed:165,damage:8,r:11,h:26,color:"#7cb342",score:15,xp:16},
tank:{hp:110,speed:42,damage:18,r:18,h:34,color:"#2e5a28",score:25,xp:28},
spitter:{hp:35,speed:58,damage:8,r:13,h:28,color:"#8bc34a",score:20,xp:22,ranged:1},
exploder:{hp:28,speed:100,damage:0,r:15,h:24,color:"#ef6c00",score:22,xp:24,explode:1},
crawler:{hp:22,speed:60,damage:12,r:16,h:14,color:"#556b2f",score:14,xp:15},
jumper:{hp:32,speed:88,damage:14,r:12,h:30,color:"#66bb6a",score:20,xp:22,leap:1},
armored:{hp:85,speed:48,damage:14,r:15,h:30,color:"#455a64",score:30,xp:30,armor:1},
screamer:{hp:40,speed:52,damage:6,r:13,h:30,color:"#ab47bc",score:28,xp:26,scream:1},
splitter:{hp:45,speed:64,damage:10,r:13,h:28,color:"#c0ca33",score:26,xp:20,split:1},
mini:{hp:12,speed:120,damage:6,r:9,h:16,color:"#aed581",score:5,xp:6},
boss:{hp:700,speed:58,damage:26,r:22,h:44,color:"#1b3d18",score:500,xp:200}
};
var WAVE_UNLOCKS=[[],["fast"],["tank"],["spitter"],["exploder","crawler"],["jumper"],["armored"],["screamer"],["splitter"],["boss"]];
var UPGRADE_DEFS=[
{id:"dmg",name:"Más daño",icon:"💥",kind:"mul",stat:"damageMul",tiers:[0.10,0.18,0.30,0.45,0.70],plus:["Daño"],minus:[]},
{id:"firerate",name:"Cadencia",icon:"⚡",kind:"cd",stat:"fireCooldown",tiers:[0.10,0.16,0.24,0.32,0.42],plus:["Cadencia"],minus:[]},
{id:"hp",name:"Vitalidad",icon:"❤️",kind:"hp",tiers:[20,30,45,65,90],plus:["Vida"],minus:[]},
{id:"heal",name:"Botiquín",icon:"🩹",kind:"heal",tiers:[35,50,70,100,140],plus:["Curación"],minus:[]},
{id:"speed",name:"Agilidad",icon:"💨",kind:"mul",stat:"speedMul",tiers:[0.12,0.18,0.26,0.36,0.50],plus:["Movilidad"],minus:[]},
{id:"multishot",name:"Ráfaga",icon:"✨",kind:"add",stat:"extraShots",tiers:[1,1,2,2,3],plus:["Proyectiles"],minus:["Precisión"]},
{id:"luck",name:"Suerte",icon:"🍀",kind:"add",stat:"luck",tiers:[3,5,8,12,18],plus:["Rareza"],minus:[]},
{id:"jump",name:"Doble dash",icon:"💨",once:1,minR:1,flag:"doubleJump",plus:["Dash"],minus:[]},
{id:"triple",name:"Triple dash",icon:"🌀",once:1,minR:2,flag:"tripleJump",plus:["Dash"],minus:[]},
{id:"pierce",name:"Perforación",icon:"➡️",once:1,minR:1,flag:"pierce",plus:["Penetración"],minus:[]},
{id:"shotgun",name:"Nueva arma: Escopeta",icon:"💥",once:1,hero:"classic",weapon:"shotgun",fixedR:2,desc:"Abanico de perdigones. Fuerte a corta distancia.",plus:["Área","Potencia"],minus:["Alcance"]},
{id:"smg",name:"Nueva arma: Subfusil",icon:"🔁",once:1,hero:"classic",weapon:"smg",fixedR:1,desc:"Ráfagas rápidas de balas ligeras.",plus:["Cadencia"],minus:["Daño/bala"]},
{id:"revolver",name:"Nueva arma: Revólver",icon:"🔫",once:1,hero:"classic",weapon:"revolver",fixedR:3,desc:"Disparos pesados y precisos.",plus:["Daño","Impacto"],minus:["Cadencia"]},
{id:"rifle",name:"Nueva arma: Rifle de asalto",icon:"🎯",once:1,hero:"classic",weapon:"rifle",fixedR:3,desc:"Cadencia firme y buen alcance.",plus:["Cadencia","Alcance"],minus:[]},
{id:"gl",name:"Nueva arma: Lanzagranadas",icon:"💣",once:1,hero:"classic",weapon:"gl",fixedR:4,desc:"Granadas explosivas de gran potencia.",plus:["Explosión","Área"],minus:["Cadencia"]},
{id:"pistol_up",name:"Pistola mejorada",icon:"🔫",hero:"classic",kind:"wpnUp",reqWeapon:"pistol",fixedR:0,desc:"Mejora tu pistola: más daño y cadencia.",plus:["Daño","Cadencia"],minus:[]},
{id:"smg_up",name:"Subfusil mejorado",icon:"🔁",hero:"classic",kind:"wpnUp",reqWeapon:"smg",fixedR:1,desc:"Mejora tu subfusil: más daño y cadencia.",plus:["Daño","Cadencia"],minus:[]},
{id:"shotgun_up",name:"Escopeta mejorada",icon:"💥",hero:"classic",kind:"wpnUp",reqWeapon:"shotgun",fixedR:2,desc:"Mejora tu escopeta: más perdigones y daño.",plus:["Área","Daño"],minus:[]},
{id:"revolver_up",name:"Revólver mejorado",icon:"🔫",hero:"classic",kind:"wpnUp",reqWeapon:"revolver",fixedR:3,desc:"Mejora tu revólver: más daño y cadencia.",plus:["Daño"],minus:[]},
{id:"rifle_up",name:"Rifle mejorado",icon:"🎯",hero:"classic",kind:"wpnUp",reqWeapon:"rifle",fixedR:3,desc:"Mejora tu rifle: más daño y cadencia.",plus:["Daño","Cadencia"],minus:[]},
{id:"gl_up",name:"Lanzagranadas mejorado",icon:"💣",hero:"classic",kind:"wpnUp",reqWeapon:"gl",fixedR:4,desc:"Mejora tu lanzagranadas: más explosión y cadencia.",plus:["Explosión"],minus:[]},
{id:"melee",name:"Machete",icon:"🔪",once:1,minR:2,flag:"hasMelee",plus:["Cuerpo a cuerpo"],minus:[]},
{id:"shield",name:"Escudo",icon:"🛡️",once:1,minR:2,flag:"hasShield",plus:["Defensa"],minus:[]},
{id:"lifesteal",name:"Robavida",icon:"🩸",kind:"set",stat:"lifesteal",tiers:[0.06,0.08,0.12,0.16,0.22],minR:2,plus:["Vampirismo"],minus:[]},
{id:"orbit",name:"Hojas orbitales",icon:"🗡️",once:1,minR:4,flag:"hasOrbit",exclusive:1,plus:["Daño continuo"],minus:[]},
{id:"chain",name:"Rayo en cadena",icon:"⚡",once:1,minR:4,flag:"hasChain",exclusive:1,plus:["Electricidad"],minus:[]},
{id:"revive",name:"2ª oportunidad",icon:"💖",once:1,minR:4,flag:"hasRevive",exclusive:1,plus:["Revivir"],minus:[]},
{id:"fire",name:"Balas ígneas",icon:"🔥",once:1,minR:1,flag:"fireAmmo",plus:["Fuego","Quemadura"],minus:["Cadencia"]},
{id:"ice",name:"Balas gélidas",icon:"❄️",once:1,minR:1,flag:"iceAmmo",plus:["Hielo","Ralentiza"],minus:["Daño"]},
{id:"poison",name:"Veneno",icon:"☠️",once:1,minR:2,flag:"poisonAmmo",plus:["Veneno"],minus:["Impacto"]},
{id:"explosive",name:"Explosivas",icon:"💣",once:1,minR:3,flag:"explosiveAmmo",plus:["Explosión"],minus:["Cadencia"]},
{id:"giant",name:"Gigante",icon:"🦣",once:1,minR:2,custom:"giant",plus:["Tamaño","Fuerza","Vida"],minus:["Movilidad"]},
{id:"dwarf",name:"Enano",icon:"🐜",once:1,minR:1,custom:"dwarf",plus:["Agilidad","Evasión"],minus:["Tamaño","Fuerza"]},
{id:"thorns",name:"Espinas",icon:"🌵",once:1,minR:2,flag:"thorns",plus:["Refleja daño"],minus:[]},
{id:"dash",name:"Dash",icon:"💨",once:1,minR:1,flag:"hasDash",plus:["Dash"],minus:[]},
{id:"regen",name:"Regeneración",icon:"💚",kind:"set",stat:"regen",tiers:[1.5,2.5,4,6,9],minR:1,plus:["Regen"],minus:[]},
{id:"crit",name:"Críticos",icon:"🎯",kind:"set",stat:"critChance",tiers:[0.08,0.12,0.18,0.25,0.35],plus:["Crítico"],minus:[]},
{id:"critDmg",name:"Golpe letal",icon:"💀",kind:"set",stat:"critMul",tiers:[1.5,1.8,2.2,2.7,3.5],minR:1,plus:["Daño crítico"],minus:[]},
{id:"bounce",name:"Rebote",icon:"🏀",once:1,minR:2,flag:"bounce",plus:["Rebote"],minus:[]},
{id:"range",name:"Francotirador",icon:"🔭",kind:"mul",stat:"rangeMul",tiers:[0.15,0.25,0.4,0.6,0.9],plus:["Alcance"],minus:["Cadencia"]},
{id:"magnet",name:"Imán XP",icon:"🧲",once:1,minR:1,flag:"xpMagnet",plus:["XP"],minus:[]},
{id:"drone",name:"Dron aliado",icon:"🤖",once:1,minR:3,flag:"hasDrone",plus:["Aliado"],minus:[]},
{id:"dog",name:"Perro zombi",icon:"🐕",once:1,minR:3,flag:"hasDog",plus:["Mascota"],minus:[]},
{id:"fireAura",name:"Aura de fuego",icon:"🌋",once:1,minR:3,flag:"fireAura",plus:["Aura fuego"],minus:["Vida máx"]},
{id:"berserk",name:"Berserker",icon:"😤",once:1,minR:2,custom:"berserk",plus:["Daño bajo vida"],minus:["Defensa"]},
{id:"crystal",name:"Cristal",icon:"💎",once:1,minR:3,custom:"crystal",plus:["Daño enorme"],minus:["Vida"]},
{id:"tanky",name:"Tanque",icon:"🛡️",once:1,minR:1,custom:"tanky",plus:["Vida","Armadura"],minus:["Movilidad","Cadencia"]},
{id:"ninja",name:"Ninja",icon:"🥷",once:1,minR:2,custom:"ninja",plus:["Agilidad","Crítico"],minus:["Vida"]},
{id:"stomp",name:"Onda de choque",icon:"💥",once:1,minR:2,flag:"stomp",plus:["Onda"],minus:[]},
{id:"vampBat",name:"Murciélago",icon:"🦇",once:1,minR:3,custom:"vamp",plus:["Vampirismo","Agilidad"],minus:["Vida máx"]},
{id:"heavy",name:"Balas pesadas",icon:"🪨",kind:"mul",stat:"damageMul",tiers:[0.2,0.3,0.45,0.6,0.85],extra:{fireCooldown:1.15},plus:["Daño"],minus:["Cadencia"]},
{id:"glass",name:"Cañón de cristal",icon:"🔫",once:1,minR:3,custom:"glass",plus:["Daño extremo"],minus:["Vida","Defensa"]},
{id:"swift",name:"Viento",icon:"🌬️",kind:"mul",stat:"speedMul",tiers:[0.2,0.3,0.4,0.55,0.75],extra:{maxHp:-10},plus:["Movilidad"],minus:["Vida"]},
{id:"fortress",name:"Fortaleza",icon:"🏰",kind:"hp",tiers:[40,60,90,130,180],extra:{speedMul:0.9},plus:["Vida"],minus:["Movilidad"]},
{id:"spark",name:"Chispa",icon:"✨",once:1,minR:2,flag:"sparkOnHit",plus:["Chispas"],minus:[]},
{id:"bloodlust",name:"Sed de sangre",icon:"😈",once:1,minR:3,flag:"bloodlust",plus:["Daño por baja"],minus:[]},
{id:"phoenix",name:"Fénix",icon:"🔥",once:1,minR:4,flag:"hasRevive",exclusive:1,custom:"phoenix",plus:["Revivir","Aura fuego"],minus:[]},
{id:"shadow",name:"Sombra",icon:"🌑",once:1,minR:3,custom:"shadow",plus:["Evasión","Dash"],minus:["Daño"]},
{id:"overcharge",name:"Sobrecarga",icon:"⚡",once:1,minR:4,exclusive:1,flag:"overcharge",plus:["Cadencia extrema"],minus:["Autodaño"]},
{id:"hero_chain",name:"Más saltos",icon:"⚡",once:1,minR:1,hero:"trueno",flag:"chainJumps",plus:["Cadenas"],minus:[]},
{id:"hero_storm",name:"Tormenta",icon:"🌩️",once:1,minR:2,hero:"trueno",flag:"bigStorm",plus:["Super rayo"],minus:[]},
{id:"hero_slash",name:"Arcazo",icon:"🗡️",once:1,minR:1,hero:"mr",flag:"wideSlash",plus:["Alcance cuchillo"],minus:[]},
{id:"hero_bleed",name:"Sangrado",icon:"🩸",once:1,minR:2,hero:"mr",flag:"bleedSlash",plus:["Sangrado"],minus:[]},
{id:"hero_iron",name:"Hierro",icon:"🏋️",once:1,minR:1,hero:"gompa",flag:"heavyBell",plus:["Pesa pesada"],minus:[]},
{id:"hero_flex",name:"Flex plus",icon:"💪",once:1,minR:2,hero:"gompa",flag:"bigFlex",plus:["Super slam"],minus:[]},
{id:"vampKill",name:"Vampirismo letal",icon:"🦇",once:1,minR:2,flag:"vampKill",desc:"Cúrate un 6% de vida máxima al matar",plus:["Curación"],minus:[]},
{id:"meteors",name:"Meteoritos",icon:"☄️",once:1,minR:3,flag:"meteors",desc:"Caen meteoritos sobre los zombis cercanos",plus:["Área"],minus:[]},
{id:"chainBoom",name:"Reacción",icon:"💥",once:1,minR:2,flag:"chainBoom",desc:"Los enemigos explotan al morir",plus:["Explosión"],minus:[]},
{id:"dashFire",name:"Estela ígnea",icon:"🔥",once:1,minR:2,flag:"dashFire",desc:"El dash deja un rastro de fuego",plus:["Fuego","Dash"],minus:[]},
{id:"superCharge",name:"Super carga",icon:"🔋",once:1,minR:1,flag:"superCharge",desc:"La super se carga un 35% más rápido",plus:["Super"],minus:[]},
{id:"superCD",name:"Super rápido",icon:"⏱️",once:1,minR:2,flag:"superCD",desc:"La super cuesta un 25% menos",plus:["Super"],minus:[]},
{id:"frenzy",name:"Frenesí",icon:"😤",once:1,minR:2,flag:"frenzy",desc:"Cada baja sube la cadencia durante unos segundos",plus:["Cadencia"],minus:[]},
{id:"critBolt",name:"Rayo crítico",icon:"⚡",once:1,minR:2,flag:"critBolt",desc:"Los críticos lanzan un rayo extra",plus:["Crítico","Electricidad"],minus:[]},
{id:"blackHole",name:"Agujero negro",icon:"🌀",once:1,minR:3,exclusive:1,flag:"blackHole",desc:"Un mini agujero negro atrae y daña a los zombis",plus:["Control","Daño"],minus:[]},
{id:"clone",name:"Clon",icon:"👥",once:1,minR:4,exclusive:1,flag:"hasClone",desc:"Un clon te sigue y dispara",plus:["Aliado"],minus:[]},
{id:"poisonCloud",name:"Nube tóxica",icon:"☁️",once:1,minR:2,flag:"poisonCloud",desc:"Una nube de veneno te rodea",plus:["Veneno","Aura"],minus:[]},
{id:"shieldRegen",name:"Escudo vivo",icon:"💠",once:1,minR:2,flag:"shieldRegen",desc:"El escudo se regenera más rápido",plus:["Defensa"],minus:[]},
{id:"freezeAura",name:"Aura gélida",icon:"🧊",once:1,minR:2,flag:"freezeAura",desc:"Los zombis cercanos se ralentizan",plus:["Hielo","Control"],minus:[]},
{id:"xpBoost",name:"Sabiduría",icon:"📘",kind:"mul",stat:"xpMul",tiers:[0.15,0.22,0.32,0.45,0.6],desc:"Ganas más XP al terminar las rondas",plus:["XP"],minus:[]},
{id:"hunter",name:"Cazajefes",icon:"🎯",once:1,minR:2,flag:"hunter",desc:"+18% de daño a jefes",plus:["Jefes"],minus:[]},
{id:"secondWind",name:"Segundo aire",icon:"🌬️",once:1,minR:1,flag:"secondWind",desc:"Al terminar una ronda recuperas un 20% de vida",plus:["Curación"],minus:[]},
{id:"turboDash",name:"Dash largo",icon:"🚀",once:1,minR:1,flag:"turboDash",desc:"El dash recorre más distancia",plus:["Dash"],minus:[]},
{id:"lastStand",name:"Último aliento",icon:"❤️‍🔥",once:1,minR:2,custom:"lastStand",desc:"Con poca vida ganas daño y cadencia",plus:["Bajo vida"],minus:[]},
{id:"luckyCharm",name:"Amuleto",icon:"🍀",once:1,minR:1,flag:"luckyCharm",desc:"Más suerte en las mejoras y +8% de crítico",plus:["Suerte","Crítico"],minus:[]},
{id:"bulletStorm",name:"Tromba",icon:"🌧️",kind:"add",stat:"extraShots",tiers:[1,1,1,2,2],minR:1,desc:"Disparas un proyectil extra",plus:["Proyectiles"],minus:["Precisión"]},
{id:"hero_dual",name:"Doble pistola",icon:"🔫",once:1,minR:1,hero:"classic",flag:"dualPistols",desc:"Eric dispara con dos pistolas",plus:["Proyectiles"],minus:[]},
{id:"hero_cloud",name:"Nube tormenta",icon:"🌩️",once:1,minR:2,hero:"trueno",flag:"stormCloud",desc:"Una nube te sigue y lanza rayos",plus:["Electricidad"],minus:[]},
{id:"hero_fan",name:"Abanico",icon:"🗡️",once:1,minR:2,hero:"mr",flag:"knifeFan",desc:"Cada pocos cortes lanzas un abanico de cuchillos",plus:["Área"],minus:[]},
{id:"hero_shockN",name:"Onda rítmica",icon:"💥",once:1,minR:1,hero:"gompa",flag:"shockN",desc:"Cada 4.º puñetazo suelta una onda de choque",plus:["Onda"],minus:[]}
];
var bootErrorEl=document.getElementById("bootError");
function showBootError(err){try{var msg=(err&&err.stack)?String(err.stack):String(err);if(bootErrorEl){bootErrorEl.style.display="block";bootErrorEl.textContent="Error del juego:\n"+msg;}if(console&&console.error)console.error(err);}catch(e2){}}
window.addEventListener("error",function(ev){showBootError(ev&&(ev.error||ev.message)||"error");});
window.addEventListener("unhandledrejection",function(ev){showBootError(ev&&(ev.reason)||"promise");});
var canvas,ctx,SW=390,SH=844,dpr=1,W=CFG.WORLD_BASE_W,H=CFG.WORLD_BASE_H,game=null,last=0,skipDtClamp=0,memStore={},account={level:1,xp:0,xpToNext:80};
var particlePool=[],floatPool=[],bulletPool=[];
var layout={gameX:0,gameY:0,gameDrawW:0,gameDrawH:0,scale:1,isPortrait:1,safe:{l:0,t:0,r:0,b:0},viewW:800,viewH:400};
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function rand(a,b){return a+Math.random()*(b-a);}
function pick(a){return a[(Math.random()*a.length)|0];}
function dist(ax,ay,bx,by){var dx=ax-bx,dy=ay-by;return Math.sqrt(dx*dx+dy*dy);}
function fillEllipse(c,x,y,rx,ry){c.save();c.translate(x,y);c.scale(rx,ry);c.beginPath();c.arc(0,0,1,0,6.283185);c.restore();c.fill();}
function roundRect(c,x,y,w,h,r){if(w<0){x+=w;w=-w;}if(h<0){y+=h;h=-h;}r=Math.min(Math.abs(r)||0,w/2,h/2);c.beginPath();if(r<=0){c.rect(x,y,w,h);return;}c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function xpForLevel(lv){return (80+lv*45+lv*lv*8)|0;}
function seeded(seed){var s=seed|0;return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return ((s<0?~s+1:s)%100000)/100000;};}
function lsGet(k,def){try{var v=localStorage.getItem(k);if(v==null)return def;return JSON.parse(v);}catch(e){return k in memStore?memStore[k]:def;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){memStore[k]=v;}}
function loadHeroChoice(){var h=lsGet("bz_hero","classic");if(h==="brasa")h="gompa";selectedHero=(h&&HEROES.some(function(x){return x.id===h;}))?h:"classic";}
function saveHeroChoice(){lsSet("bz_hero",selectedHero);}
function loadAccount(){var a=lsGet("bz_account",null)||lsGet("cz_account",null);if(a&&a.level){account.level=a.level|0;account.xp=a.xp|0;account.xpToNext=xpForLevel(account.level);}else account={level:1,xp:0,xpToNext:xpForLevel(1)};}
function saveAccount(){lsSet("bz_account",{level:account.level,xp:account.xp});}
function grantAccountXP(n){account.xp+=n;while(account.xp>=account.xpToNext){account.xp-=account.xpToNext;account.level++;account.xpToNext=xpForLevel(account.level);}saveAccount();}
function shadeHex(hex,amt){hex=(hex||"#888").replace("#","");if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];var r=clamp(parseInt(hex.substr(0,2),16)+amt,0,255),g=clamp(parseInt(hex.substr(2,2),16)+amt,0,255),b=clamp(parseInt(hex.substr(4,2),16)+amt,0,255);return "#"+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);}
function rngPick(rng,arr){return arr[(rng()*arr.length)|0];}
function rngRange(rng,a,b){return a+rng()*(b-a);}
var selectedHero="classic";
var HEROES=[
{id:"classic",name:"Eric",desc:"Equilibrado. Super Cañonazo: un abanico masivo con su arma.",hp:100,spd:100,dmg:100,wpn:"Pistola",col:"#1565c0"},
{id:"trueno",name:"Tro",desc:"Rayos en cadena y un láser dirigido.",hp:90,spd:105,dmg:115,wpn:"Rayos",col:"#ffd54f"},
{id:"mr",name:"Mr.",desc:"Cuchillo ágil. Super: abanico de cuchillos en llamas.",hp:120,spd:115,dmg:100,wpn:"Cuchillo",col:"#37474f"},
{id:"gompa",name:"Gompa",desc:"Culturista. Super Gigante: crece, salta y aplasta.",hp:140,spd:88,dmg:100,wpn:"Pesas",col:"#6d4c41"}
];
function makePlayerLook(){return{kind:"player",hero:"classic",skin:"#d2a679",skinShadow:"#a67c52",skinLight:"#e8c4a0",hair:"#2c1810",brow:"#1a1008",eye:"#2e4a3e",eyeWhite:"#e8e4d9",hoodie:"#1565c0",hoodieDark:"#0d47a1",hoodieLight:"#42a5f5",pants:"#1a237e",pantsDark:"#0d1540",shoe:"#1a1a1a",cap:"#8b1a1a",capBrim:"#5c1010",stubble:1};}
function makeHeroLook(id){
  if(id==="trueno")return{kind:"player",hero:"trueno",skin:"#e8c4a0",skinShadow:"#a67c52",skinLight:"#f3d7b8",hair:"#1a120c",beardCol:"#1a120c",brow:"#1a120c",eye:"#1565c0",eyeWhite:"#fff",eyeGlow:"#448aff",hoodie:"#1565c0",hoodieDark:"#0d47a1",hoodieLight:"#ffeb3b",pants:"#0d47a1",pantsDark:"#0a2370",shoe:"#212121",curl:1,beard:1,glowEye:1};
  if(id==="mr")return{kind:"player",hero:"mr",skin:"#d2a679",skinShadow:"#a67c52",skinLight:"#e8c4a0",hair:"#2a2a2a",brow:"#111",eye:"#1a1a1a",eyeWhite:"#f5f5f5",hoodie:"#212121",hoodieDark:"#111",hoodieLight:"#616161",pants:"#111111",pantsDark:"#000",shoe:"#111",shirt:"#fafafa",quiff:1,goatee:1,shades:1};
  if(id==="gompa")return{kind:"player",hero:"gompa",skin:"#d2a679",skinShadow:"#a67c52",skinLight:"#e8c4a0",hair:"#2a1c14",brow:"#2a1c14",eye:"#3e2723",eyeWhite:"#f5f0e8",hoodie:"#eceff1",hoodieDark:"#b0bec5",hoodieLight:"#fff",pants:"#37474f",pantsDark:"#212121",shoe:"#212121",bald:1,beard:1,bulk:1};
  return makePlayerLook();
}
function makeHomeLook(){return{kind:"home",skin:"#f0d5b0",skinShadow:"#c4a07a",skinLight:"#f8e6c8",hair:"#f5d76e",brow:"#e0b84e",eye:"#4fc3f7",eyeWhite:"#fff",hoodie:"#1565c0",hoodieDark:"#0d47a1",hoodieLight:"#42a5f5",pants:"#0d47a1",pantsDark:"#0a2a70",shoe:"#fafafa",shirt:"#fff",quiff:1,smug:1,cape:1};}

function makeZombieLook(type,seed){
  var pal={
    normal:{skin:"#8fa86e",shirt:"#4e5a3a",pants:"#3e4a32",hair:"#1a120b",eye:"#c62828",bald:0},
    fast:{skin:"#6e8a4e",shirt:"#2e3d28",pants:"#1f2a1a",hair:"#212121",eye:"#ff8a80",bald:0},
    tank:{skin:"#6b7a52",shirt:"#455a3c",pants:"#2a3324",hair:"#1a120b",eye:"#ff1744",bald:1},
    spitter:{skin:"#9aaa68",shirt:"#5e4a6e",pants:"#3a3344",hair:"#37474f",eye:"#76ff03",bald:0},
    exploder:{skin:"#8a7a4a",shirt:"#5d4037",pants:"#3e2723",hair:"#3e2723",eye:"#ff6d00",bald:1},
    crawler:{skin:"#6e7a4a",shirt:"#3e4a32",pants:"#2a3324",hair:"#1a120b",eye:"#c62828",bald:1},
    jumper:{skin:"#7cb342",shirt:"#33691e",pants:"#1b5e20",hair:"#1b5e20",eye:"#aeea00",bald:0},
    armored:{skin:"#7a8a72",shirt:"#546e7a",pants:"#37474f",hair:"#263238",eye:"#ff8a80",bald:1},
    screamer:{skin:"#9a8aaa",shirt:"#6a1b9a",pants:"#4a148c",hair:"#4a148c",eye:"#e040fb",bald:0},
    splitter:{skin:"#c0ca6a",shirt:"#827717",pants:"#5a5a1a",hair:"#3e3e10",eye:"#eeff41",bald:0},
    mini:{skin:"#aed581",shirt:"#7cb342",pants:"#558b2f",hair:"#33691e",eye:"#c62828",bald:0},
    boss:{skin:"#4a5a38",shirt:"#1b2a18",pants:"#10180e",hair:"#0a0a08",eye:"#ff1744",bald:0}
  };
  var p=pal[type]||pal.normal;
  var look={kind:"zombie",type:type,skin:p.skin,skinShadow:shadeHex(p.skin,-28),skinLight:shadeHex(p.skin,24),hair:p.hair,eyeGlow:p.eye,shirt:p.shirt,shirtDark:shadeHex(p.shirt,-25),pants:p.pants,pantsDark:shadeHex(p.pants,-20),shoe:"#1c1c1c",bald:p.bald,wound:1,blood:1,hunch:type==="crawler"?0.3:0.1};
  if(type==="armored")look.helmet=1;
  if(type==="exploder")look.bombs=1;
  return look;
}
function makeColossusLook(){return{kind:"colossus",skin:"#d2c4a4",skinShadow:"#a89070",skinLight:"#ead8bc",hair:"#2a1c14",eyeGlow:"#ff1744",jacket:"#f5f5f3",jacketDark:"#c4c4c0",shirt:"#141414",pants:"#1e1814",pantsDark:"#100c0a",shoe:"#f2f2f0",beard:1,curlyTop:1,openJacket:1};}
