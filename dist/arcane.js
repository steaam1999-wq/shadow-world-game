(()=>{var Qe=Math.PI*2,sh={W:1280,H:760};function rh(i){let t=1280,e=760,n=(b,C)=>b+Math.random()*(C-b),s=(b,C,B)=>b<C?C:b>B?B:b,r=(b,C,B,F)=>{let P=b-B,mt=C-F;return P*P+mt*mt},a=b=>b[Math.random()*b.length|0],o={},l={active:!1,id:null,ox:0,oy:0,dx:0,dy:0};window.addEventListener("keydown",b=>{o[b.code]=!0,c&&((b.code==="Space"||b.code==="KeyE")&&(U(),b.preventDefault()),(b.code==="Escape"||b.code==="KeyP")&&UI.togglePause&&UI.togglePause())}),window.addEventListener("keyup",b=>{o[b.code]=!1}),window.addEventListener("blur",()=>{for(let b in o)o[b]=!1;c&&!c.paused&&!c.over&&UI.togglePause(!0)}),i.addEventListener("touchstart",b=>{for(let C of b.changedTouches)l.active||(l.active=!0,l.id=C.identifier,l.ox=C.clientX,l.oy=C.clientY,l.dx=l.dy=0);b.preventDefault()},{passive:!1}),i.addEventListener("touchmove",b=>{for(let C of b.changedTouches)if(C.identifier===l.id){let B=C.clientX-l.ox,F=C.clientY-l.oy,P=Math.hypot(B,F),mt=50;P>mt&&(l.ox+=B-B/P*mt,l.oy+=F-F/P*mt,B=B/P*mt,F=F/P*mt),l.dx=B/mt,l.dy=F/mt}b.preventDefault()},{passive:!1});let h=b=>{for(let C of b.changedTouches)C.identifier===l.id&&(l.active=!1,l.dx=l.dy=0)};i.addEventListener("touchend",h),i.addEventListener("touchcancel",h);let u=72,f=new Map,p=[];function d(b,C){return(b+32768)*65536+(C+32768)}function m(){f.clear();for(let b of c.enemies){if(b.dead)continue;let C=d(Math.floor(b.x/u),Math.floor(b.y/u)),B=f.get(C);B||(B=[],f.set(C,B)),B.push(b)}}function x(b,C,B,F=p){F.length=0;let P=Math.floor((b-B-30)/u),mt=Math.floor((b+B+30)/u),ut=Math.floor((C-B-30)/u),A=Math.floor((C+B+30)/u);for(let k=P;k<=mt;k++)for(let tt=ut;tt<=A;tt++){let et=f.get(d(k,tt));if(et)for(let ht of et){if(ht.dead)continue;let I=B+ht.r;r(b,C,ht.x,ht.y)<=I*I&&F.push(ht)}}return F}let c=null;function g(){let b=C=>Save.meta(C);return{x:0,y:0,r:13,face:1,walk:0,baseHp:100+b("vitality")*10,hp:0,maxHp:0,lvl:1,xp:0,xpNext:_(1),invuln:0,heart:0,regenAcc:0,dmgMul:1,cdMul:1,areaMul:1,amount:0,speed:150,magnet:70,regen:0,rerolls:b("insight")}}function _(b){return Math.floor(3+b*2.2+b*b*.16)}function M(b){let C=DATA.chapters[b];c={ch:C,chId:b,time:0,kills:0,paused:!1,over:!1,p:g(),weapons:[],passives:{},spec:null,enemies:[],shots:[],eShots:[],gems:[],pickups:[],rings:[],lines:[],blasts:[],parts:[],texts:[],hazards:[],holes:[],dying:[],spawnAcc:0,boss:null,bossSpawned:!1,victoryT:-1,elitesDone:0,tidesDone:0,fragmentsFound:[],shake:0,flash:0,flashColor:"#b46cff",heartUses:0,bladeAngle:0,auraTick:0,banner:null,levelQueue:0},y("bolt"),R(),c.p.hp=c.p.maxHp,v(C.roman+". "+C.name,"\u0412\u044B\u0436\u0438\u0432\u0438 \u0434\u043E \u043F\u0440\u0438\u0445\u043E\u0434\u0430 \u0441\u0442\u0440\u0430\u0436\u0430")}function v(b,C,B=3){c.banner={title:b,sub:C,t:B,max:B}}function R(){let b=c.p,C=c.passives,B=F=>C[F]||0;b.maxHp=b.baseHp+B("heart")*20,b.regen=B("heart")*.4,b.dmgMul=(1+B("tome")*.1)*(1+Save.meta("power")*.06),b.cdMul=Math.pow(.93,B("crystal")),b.areaMul=1+B("rune")*.1,b.amount=(B("eye")>=2?1:0)+(B("eye")>=4?1:0),b.speed=150*(1+B("boots")*.08)*(1+Save.meta("haste")*.05),b.magnet=90*(1+B("magnet")*.3)*(1+Save.meta("reach")*.15),c.spec==="storm"&&(b.speed*=1.15,b.cdMul*=.9),b.hp=Math.min(b.hp,b.maxHp)}function w(b){return c.weapons.find(C=>C.id===b)}function y(b){let C=w(b);if(C){C.lvl=Math.min(5,C.lvl+1);return}c.weapons.push({id:b,lvl:1,evo:!1,cd:.3,cd2:0,angle:0})}function S(b=3){let C=[],B=c.spec?DATA.specs[c.spec].weapon:null;for(let ut of c.weapons){let A=DATA.weapons[ut.id];ut.lvl>=5&&!ut.evo&&c.passives[A.evo.needs]&&C.push({type:"evo",id:ut.id,w:100,icon:A.icon,color:"#ffd86b",title:"\u2727 "+A.evo.name,desc:"\u042D\u0412\u041E\u041B\u042E\u0426\u0418\u042F: "+A.evo.desc,tag:"\u042D\u0432\u043E\u043B\u044E\u0446\u0438\u044F"})}for(let ut in DATA.weapons){let A=DATA.weapons[ut],k=w(ut);if(k&&k.lvl>=5||!k&&c.weapons.length>=DATA.rules.weaponSlots)continue;let tt=k?k.lvl+1:1;C.push({type:"weapon",id:ut,w:(ut===B?3:1)*(k?1.4:1),icon:A.icon,color:A.color,title:A.name,desc:k?A.lvlDesc[k.lvl]:A.desc,tag:k?"\u0423\u0440. "+tt:"\u041D\u043E\u0432\u043E\u0435 \u0437\u0430\u043A\u043B\u0438\u043D\u0430\u043D\u0438\u0435"})}for(let ut in DATA.passives){let A=DATA.passives[ut],k=c.passives[ut]||0;if(k>=5||!k&&Object.keys(c.passives).length>=DATA.rules.passiveSlots)continue;let tt=Object.keys(DATA.weapons).find(et=>DATA.weapons[et].evo.needs===ut&&w(et));C.push({type:"passive",id:ut,w:tt?1.3:1,icon:A.icon,color:"#d8c8ff",title:A.name,desc:A.desc+(tt?" (\u042D\u0432\u043E\u043B\u044E\u0446\u0438\u044F \u0434\u043B\u044F: "+DATA.weapons[tt].name+")":""),tag:k?"\u0423\u0440. "+(k+1):"\u0410\u0440\u0442\u0435\u0444\u0430\u043A\u0442"})}let F=[],P=C.filter(ut=>ut.type==="evo");P.length&&F.push(P[0]);let mt=C.filter(ut=>ut.type!=="evo");for(;F.length<b&&mt.length;){let ut=mt.reduce((tt,et)=>tt+et.w,0),A=Math.random()*ut,k=0;for(;k<mt.length&&(A-=mt[k].w,!(A<=0));k++);k=Math.min(k,mt.length-1),F.push(mt[k]),mt.splice(k,1)}return F.length||F.push({type:"heal",id:"heal",icon:"\u271A",color:"#7dffa8",title:"\u042D\u0444\u0438\u0440\u043D\u044B\u0439 \u044D\u043B\u0438\u043A\u0441\u0438\u0440",desc:"\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C 40% \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u044F \u0438 +10 \u042D\u0444\u0438\u0440\u0430.",tag:"\u0414\u0430\u0440"}),F}function D(){return Object.keys(DATA.specs).map(b=>{let C=DATA.specs[b];return{type:"spec",id:b,icon:C.icon,color:C.color,title:C.name,desc:C.desc,tag:"\u041C\u0430\u0433\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0448\u043A\u043E\u043B\u0430"}})}function L(b){let C=c.p;if(b.type==="weapon")y(b.id);else if(b.type==="passive")c.passives[b.id]=(c.passives[b.id]||0)+1,b.id==="heart"&&(C.hp+=20),b.id==="eye"&&Save.addCorruption(1);else if(b.type==="evo"){let B=w(b.id);B.evo=!0,v("\u042D\u0432\u043E\u043B\u044E\u0446\u0438\u044F!",DATA.weapons[b.id].evo.name,2.5),c.flash=.6,c.flashColor="#ffd86b"}else if(b.type==="spec"){c.spec=b.id;let B=DATA.specs[b.id];w(B.weapon)?y(B.weapon):c.weapons.length>=DATA.rules.weaponSlots?c.weapons[c.weapons.length-1]={id:B.weapon,lvl:1,evo:!1,cd:.3,cd2:0,angle:0}:y(B.weapon),b.id==="void"&&Save.addCorruption(8),v(B.name,"\u0422\u0432\u043E\u044F \u043C\u0430\u0433\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0448\u043A\u043E\u043B\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u0430",2.5),c.flash=.6,c.flashColor=B.color}else b.type==="heal"&&(C.hp=Math.min(C.maxHp,C.hp+C.maxHp*.4),c.bonusEther=(c.bonusEther||0)+10);R()}function U(){if(!c||c.paused||c.over)return;let b=c.p;if(b.heart<100)return;b.heart=0,c.heartUses++,Save.addCorruption(2);let C=Math.max(t,e)*.75,B=x(b.x,b.y,C,[]);for(let F of B)if(q(F,(F.boss?220:160)*b.dmgMul*(c.spec==="void"?1.4:1),"void",!0),!F.boss){let P=Math.atan2(F.y-b.y,F.x-b.x);F.kx=Math.cos(P)*400,F.ky=Math.sin(P)*400}c.eShots.length=0,b.invuln=Math.max(b.invuln,1.5),c.flash=.8,c.flashColor="#b46cff",c.shake=14,c.rings.push({x:b.x,y:b.y,r:10,max:C,speed:1600,dmg:0,hit:null,color:"#c78bff",visual:!0,width:18}),z(b.x,b.y-40,"\u0421\u0415\u0420\u0414\u0426\u0415 \u042D\u0424\u0418\u0420\u0410","#e0b8ff",22),UI.onHeartUsed&&UI.onHeartUsed()}function z(b,C,B,F,P=14){c.texts.length>70||c.texts.push({x:b,y:C,txt:B,color:F,size:P,life:.8})}function G(b,C,B,F,P=120,mt=.5,ut=3){c.parts.length>700&&(F=Math.min(F,2));for(let A=0;A<F;A++){let k=Math.random()*Qe,tt=Math.random()*P;c.parts.push({x:b,y:C,vx:Math.cos(k)*tt,vy:Math.sin(k)*tt,life:mt*n(.5,1),max:mt,color:B,size:ut*n(.6,1.2)})}}let N={bolt:"arcane",lightning:"storm",fire:"fire",frost:"frost",blood:"blood",void:"void"};function q(b,C,B,F){if(b.dead)return;let P=c.spec;P&&P===B&&(C*=P==="void"?1.4:1.5),P==="fire"&&B!=="burn"&&(b.burnT=2.5,b.burnDps=Math.max(b.burnDps||0,C*.25)),P==="frost"&&(b.slowT=Math.max(b.slowT||0,1),b.slow=Math.max(b.slow||0,.3)),b.hp-=C,b.flash=.08,c.dealt=(c.dealt||0)+C,!F&&(C>=8||Math.random()<.3)&&z(b.x+n(-6,6),b.y-b.r-4,Math.round(C),B==="burn"?"#ffa860":"#ffffff",C>60?16:12),b.hp<=0&&Y(b)}function Y(b){b.dead=!0,c.dying.length<120&&c.dying.push({e:b,t:0}),c.kills++;let C=c.p;if(G(b.x,b.y,b.color,b.boss?80:b.elite?30:7,b.boss?320:140,.6,b.boss?5:3),c.spec==="blood"&&(C.hp=Math.min(C.maxHp,C.hp+1)),b.bladeKill){let B=w("blood");B&&(C.hp=Math.min(C.maxHp,C.hp+(B.evo?1.2:.4)))}if(b.boss){$(b);return}W(b.x,b.y,b.xp),b.elite?(c.pickups.push({x:b.x,y:b.y,kind:"fragment",t:0}),c.pickups.push({x:b.x+20,y:b.y,kind:"heal",t:0}),c.shake=Math.max(c.shake,6)):Math.random()<.004&&c.pickups.push({x:b.x,y:b.y,kind:Math.random()<.5?"magnet":"heal",t:0})}function W(b,C,B){if(c.gems.length>450){let F=c.gems[Math.random()*c.gems.length|0];F.val+=B;return}c.gems.push({x:b+n(-4,4),y:C+n(-4,4),val:B,mag:!1})}function $(b){c.boss=null,c.victoryT=3,c.shake=20,c.flash=1,c.flashColor="#ffffff";for(let C of c.gems)C.mag=!0;c.pickups.push({x:b.x,y:b.y,kind:"fragment",t:0});for(let C of c.enemies)C.dead||(C.dead=!0,G(C.x,C.y,C.color,4));c.eShots.length=0,c.hazards.length=0,v("\u0421\u0442\u0440\u0430\u0436 \u043F\u043E\u0432\u0435\u0440\u0436\u0435\u043D",DATA.bosses[b.bossId].name,3)}function X(b=60){let C=Math.random()*Qe,B=Math.hypot(t,e)/2+b;return[c.p.x+Math.cos(C)*B,c.p.y+Math.sin(C)*B]}function j(b,C,B,F=!1){let P=DATA.enemies[b],mt=c.time,ut=c.ch.hpMul*(1+mt/140)*(1+c.chId*.12*mt/240)*(F?14:1),A={type:b,x:C,y:B,r:P.r*(F?1.6:1),hp:P.hp*ut,maxHp:P.hp*ut,speed:P.speed*(F?.85:1)*n(.9,1.1),dmg:P.dmg*(1+c.chId*.12)*(1+mt/400)*(F?1.5:1),color:P.color,shape:P.shape,xp:P.xp*(F?25:1),ranged:P.ranged||null,shootCd:P.ranged?n(1,P.ranged.cd):0,elite:F,seed:Math.random()*10,slowT:0,slow:0,burnT:0,burnDps:0,frozen:0,flash:0,kx:0,ky:0,hits:{}};return c.enemies.push(A),A}function it(b){let C=c.time;if(c.victoryT>=0)return;let B=(.9+C*.032)*(1+c.chId*.1);c.boss&&(B*=.35),c.spawnAcc+=B*b;let F=c.ch.enemies,P=[6,C>35?3:0,C>95?1.6:0],mt=P[0]+P[1]+P[2],ut=0;for(let tt of c.enemies)tt.ranged&&!tt.dead&&ut++;for(;c.spawnAcc>=1;){if(c.spawnAcc--,c.enemies.length>=DATA.rules.maxEnemies){c.spawnAcc=0;break}let tt=Math.random()*mt,et=0;for(;tt>P[et];)tt-=P[et],et++;let ht=F[Math.min(et,2)];DATA.enemies[ht].ranged&&ut>22&&(ht=F[0]),c.chId===3&&Math.random()<.15&&(ht=a(["ghost","wolf","skeleton","deadmage"]));let[I,T]=X();j(ht,I,T)}let A=DATA.rules.eliteTimes;if(c.elitesDone<A.length&&C>=A[c.elitesDone]){c.elitesDone++;let[tt,et]=X(20);j(F[Math.min(c.elitesDone-1,2)],tt,et,!0),v("\u041D\u043E\u0441\u0438\u0442\u0435\u043B\u044C \u043F\u0430\u043C\u044F\u0442\u0438","\u0423\u0431\u0435\u0439 \u044D\u043B\u0438\u0442\u043D\u043E\u0433\u043E \u0432\u0440\u0430\u0433\u0430, \u0447\u0442\u043E\u0431\u044B \u0443\u0437\u043D\u0430\u0442\u044C \u043F\u0440\u0430\u0432\u0434\u0443",2.2)}let k=DATA.rules.tideTimes;if(c.tidesDone<k.length&&C>=k[c.tidesDone]){c.tidesDone++;let tt=34+c.chId*6,et=Math.max(t,e)*.55;for(let ht=0;ht<tt;ht++){let I=ht/tt*Qe;j(F[0],c.p.x+Math.cos(I)*et,c.p.y+Math.sin(I)*et)}v("\u041F\u0440\u0438\u043B\u0438\u0432 \u0411\u0435\u0437\u0434\u043D\u044B","\u041E\u043D\u0438 \u043E\u043A\u0440\u0443\u0436\u0430\u044E\u0442 \u0442\u0435\u0431\u044F",2)}!c.bossSpawned&&C>=DATA.rules.bossTime&&(c.bossSpawned=!0,vt())}function vt(){let b=c.ch.boss,C=DATA.bosses[b],[B,F]=X(-80),P={type:b,bossId:b,boss:!0,x:B,y:F,r:C.r,hp:C.hp,maxHp:C.hp,speed:C.speed,dmg:C.dmg,color:C.color,shape:C.shape,xp:0,slowT:0,slow:0,burnT:0,burnDps:0,frozen:0,flash:0,kx:0,ky:0,hits:{},seed:0,ai:{t:0,a:0,b:0,c:0,d:0,mode:"walk",mt:0,spin:0,vx:0,vy:0,tx:0,ty:0}};c.enemies.push(P),c.boss=P,c.shake=10,UI.onBoss&&UI.onBoss(C)}function Bt(b,C,B,F,P,mt,ut=6){c.boss&&b===c.boss.x&&C===c.boss.y&&(c.boss.atk=.4),c.eShots.push({x:b,y:C,vx:Math.cos(B)*F,vy:Math.sin(B)*F,dmg:P,color:mt,r:ut,life:6})}function nt(b,C,B,F,P,mt){for(let ut=0;ut<C;ut++)Bt(b.x,b.y,F+ut/C*Qe,B,b.dmg*.6,P,mt)}function Pt(b,C,B,F,P,mt){c.hazards.push({x:b,y:C,r:B,t:0,delay:F,dmg:P,color:mt,done:!1})}function zt(b,C){let B=c.p,F=b.ai;F.t+=C,F.a-=C,F.b-=C,F.c-=C,F.d-=C;let P=Math.atan2(B.y-b.y,B.x-b.x),mt=b.hp/b.maxHp,ut=mt<.5,A=!0,k=b.speed;switch(F.mode==="windup"?(A=!1,F.mt-=C,F.mt<=0&&(F.mode="charge",F.mt=.65,F.vx=Math.cos(F.dir)*560,F.vy=Math.sin(F.dir)*560)):F.mode==="charge"&&(A=!1,F.mt-=C,b.x+=F.vx*C,b.y+=F.vy*C,Math.random()<.6&&G(b.x,b.y,"#ff5a5a",1,40,.4),F.mt<=0&&(F.mode="walk",(b.bossId==="fallen_knight"||b.bossId==="abyss_lord")&&nt(b,ut?14:10,170,F.t,"#ff7a7a",7))),b.bossId){case"fallen_knight":{if(F.mode==="walk"&&F.a<=0&&(F.a=ut?3:4.2,F.mode="windup",F.mt=.75,F.dir=P),F.b<=0&&F.mode==="walk"){F.b=ut?2.4:3.4;let tt=ut?9:7;for(let et=0;et<tt;et++)Bt(b.x,b.y,P+(et-(tt-1)/2)*.16,230,b.dmg*.6,"#ffd0d0",7)}break}case"devourer":{if(k*=.9,Math.sqrt(r(b.x,b.y,B.x,B.y))<560){let et=(ut?95:75)*C;B.x-=Math.cos(P)*et,B.y-=Math.sin(P)*et}if(F.a<=0){F.a=2.6;for(let et=-2;et<=2;et++)Bt(b.x,b.y,P+et*.22,190,b.dmg*.55,"#a6ff5a",9)}if(F.b<=0){F.b=8;for(let et=0;et<6;et++){let ht=et/6*Qe;j("wolf",b.x+Math.cos(ht)*80,b.y+Math.sin(ht)*80)}}ut&&F.c<=0&&(F.c=3.5,nt(b,22,150,F.t,"#7dff7a",8));break}case"soulless_king":{if(F.a<=0&&(F.a=ut?2.5:3.5,nt(b,18,160,F.t*.7,"#ffe27a",7)),F.b<=0){F.b=7,G(b.x,b.y,"#ffe27a",30,200);let tt=Math.random()*Qe;b.x=B.x+Math.cos(tt)*260,b.y=B.y+Math.sin(tt)*260,G(b.x,b.y,"#ffe27a",30,200),F.a=Math.min(F.a,.6)}if(F.c<=0){F.c=9;for(let tt=0;tt<4;tt++){let et=tt/4*Qe+.7;j("deadmage",b.x+Math.cos(et)*90,b.y+Math.sin(et)*90)}}ut&&(F.spin+=C,F.d<=0&&(F.d=.16,Bt(b.x,b.y,F.spin*2.2,180,b.dmg*.5,"#fff0a0",6),Bt(b.x,b.y,F.spin*2.2+Math.PI,180,b.dmg*.5,"#fff0a0",6)));break}case"abyss_lord":{let tt=mt>.66?1:mt>.33?2:3;if(tt!==F.phase&&(F.phase=tt,tt>1&&(v("\u0424\u0430\u0437\u0430 "+tt,tt===2?"\u0411\u0435\u0437\u0434\u043D\u0430 \u043F\u0440\u043E\u0431\u0443\u0436\u0434\u0430\u0435\u0442\u0441\u044F":"\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0432\u0437\u0434\u043E\u0445 \u0412\u043B\u0430\u0434\u044B\u043A\u0438",2),c.shake=15,nt(b,30,200,0,"#e08bff",8))),F.spin+=C,F.d<=0){F.d=tt===3?.09:.14;let et=tt===1?2:3;for(let ht=0;ht<et;ht++)Bt(b.x,b.y,F.spin*1.7+ht*Qe/et,170,b.dmg*.45,"#d68bff",6)}if(F.mode==="walk"&&F.a<=0&&(F.a=tt===3?3.5:5.5,F.mode="windup",F.mt=.7,F.dir=P),tt>=2){if(F.b<=0){F.b=6;for(let ht=0;ht<5;ht++){let[I,T]=[b.x+n(-120,120),b.y+n(-120,120)];j("spawn",I,T)}}if(Math.sqrt(r(b.x,b.y,B.x,B.y))<520){let ht=40*C;B.x-=Math.cos(P)*ht,B.y-=Math.sin(P)*ht}}tt===3&&F.c<=0&&(F.c=2.2,Pt(B.x,B.y,85,1,b.dmg*1.1,"#b46cff"),Pt(B.x+n(-160,160),B.y+n(-160,160),85,1.2,b.dmg*1.1,"#b46cff"));break}}A&&F.mode==="walk"&&Math.sqrt(r(b.x,b.y,B.x,B.y))>b.r+B.r&&(b.x+=Math.cos(P)*k*C,b.y+=Math.sin(P)*k*C),F.mode==="walk"&&(b.face=Math.cos(P)>=0?1:-1)}function Vt(b,C,B=700,F){let P=null,mt=B*B;for(let ut of c.enemies){if(ut.dead||F&&F.has(ut))continue;let A=r(b,C,ut.x,ut.y);A<mt&&(mt=A,P=ut)}return P}function Lt(){let b=c.p,C=[];for(let B of c.enemies)!B.dead&&Math.abs(B.x-b.x)<t/2&&Math.abs(B.y-b.y)<e/2&&C.push(B);return C.length?a(C):null}function Xt(b){c.p.castT=.3,c.p.castA=Math.atan2(b.vy,b.vx),c.shots.push(Object.assign({pierce:1,life:2,r:6,hit:new Set,homing:0,kind:"bolt",slow:0},b))}function Te(b,C,B,F){c.p.castT=.3,c.p.castA=Math.atan2(b.y-c.p.y,b.x-c.p.x);let P=b,mt=c.p.x,ut=c.p.y-10,A=new Set;for(let k=0;k<=B&&P;k++){A.add(P),c.lines.push({x1:mt,y1:ut,x2:P.x,y2:P.y,life:.18,color:"#fff27a"}),G(P.x,P.y,"#fff7b0",3,90,.3,2),mt=P.x,ut=P.y;let tt=Vt(P.x,P.y,F,A);q(P,C,"storm"),P=tt}}function $t(b){let C=c.p;for(let B of c.weapons){B.cd-=b;let F=B.lvl,P=C.amount,mt=C.dmgMul,ut=C.cdMul,A=C.areaMul;switch(B.id){case"bolt":{if(B.cd>0)break;if(B.evo){B.cd=.55*ut;let k=5+P;for(let tt=0;tt<k;tt++){let et=Math.random()*Qe;Xt({x:C.x,y:C.y,vx:Math.cos(et)*380,vy:Math.sin(et)*380,dmg:34*mt,pierce:3,homing:6,color:"#cfe8ff",r:7*A,el:"arcane",life:2.2,star:!0})}}else{let k=Vt(C.x,C.y,650);if(!k){B.cd=.1;break}B.cd=(.8-(F>=3?.12:0))*ut;let tt=1+(F>=2?1:0)+(F>=4?1:0)+P,et=Math.atan2(k.y-C.y,k.x-C.x);for(let ht=0;ht<tt;ht++){let I=et+(ht-(tt-1)/2)*.12;Xt({x:C.x,y:C.y,vx:Math.cos(I)*460,vy:Math.sin(I)*460,dmg:(14+(F>=3?6:0)+(F>=5?8:0))*mt,pierce:1+(F>=4?1:0)+(F>=5?1:0),color:"#9ad0ff",r:6*A,el:"arcane",life:1.6})}}break}case"lightning":{if(B.cd>0)break;if(B.evo){B.cd=.55*ut;for(let k=0;k<3+P;k++){let tt=Lt();if(!tt)break;c.lines.push({x1:tt.x+n(-40,40),y1:tt.y-500,x2:tt.x,y2:tt.y,life:.2,color:"#fffbd0",wide:!0});for(let et of x(tt.x,tt.y,60*A,[]))q(et,40*mt,"storm");c.blasts.push({x:tt.x,y:tt.y,r:60*A,life:.2,max:.2,color:"#fff27a"}),Te(tt,26*mt,4,150)}}else{let k=Vt(C.x,C.y,500);if(!k){B.cd=.1;break}B.cd=(1.7-(F>=3?.3:0)-(F>=5?.3:0))*ut;let tt=2+(F>=2?1:0)+(F>=4?1:0)+(F>=5?2:0)+P;Te(k,(16+(F>=2?6:0)+(F>=4?8:0))*mt,tt,150*A)}break}case"fire":{if(B.evo&&(c.auraTick-=b,c.auraTick<=0)){c.auraTick=.25;for(let tt of x(C.x,C.y,95*A,[]))q(tt,7*mt,"fire",!0),tt.burnT=2,tt.burnDps=Math.max(tt.burnDps,12*mt)}if(B.cd>0)break;let k=(B.evo?260:110+(F>=2?25:0)+(F>=4?30:0))*A;B.cd=(B.evo?1.6:3-(F>=3?.5:0)-(F>=5?.5:0))*ut,c.rings.push({x:C.x,y:C.y,r:8,max:k,speed:k*2.6,dmg:(B.evo?45:18+(F>=2?6:0)+(F>=4?8:0)+(F>=5?8:0))*mt,hit:new Set,color:"#ff8a3c",el:"fire",burn:(B.evo?18:4+F*2)*mt,width:10});break}case"frost":{if(B.evo&&(B.cd2-=b,B.cd2<=0)){B.cd2=4.5*ut;let et=420*A;for(let ht of x(C.x,C.y,et,[]))ht.frozen=ht.boss?.6:2.2,q(ht,40*mt,"frost");c.rings.push({x:C.x,y:C.y,r:10,max:et,speed:1400,dmg:0,hit:null,color:"#bff8ff",visual:!0,width:14}),c.flash=.25,c.flashColor="#bff8ff"}if(B.cd>0)break;B.cd=(B.evo?.9:1.4-(F>=4?.3:0))*ut;let k=(B.evo?16:3+(F>=2?1:0)+(F>=3?1:0)+(F>=4?1:0)+(F>=5?2:0))+P,tt=Math.random()*Qe;for(let et=0;et<k;et++){let ht=tt+et/k*Qe;Xt({x:C.x,y:C.y,vx:Math.cos(ht)*340,vy:Math.sin(ht)*340,dmg:(B.evo?26:9+(F>=2?4:0)+(F>=5?6:0))*mt,pierce:(F>=3?2:1)+(B.evo?2:0),color:"#9ff4ff",r:5*A,el:"frost",slow:.45,life:1.1,kind:"shard"})}break}case"blood":{let k=(B.evo?6:2+(F>=3?1:0)+(F>=5?1:0))+P,tt=(B.evo?115:72+(F>=4?18:0))*A,et=(B.evo?32:10+(F>=2?5:0)+(F>=4?6:0)+(F>=5?6:0))*mt;B.angle+=b*(B.evo?3.6:3),B.blades=[];for(let ht=0;ht<k;ht++){let I=B.angle+ht/k*Qe,T=C.x+Math.cos(I)*tt,Z=C.y+Math.sin(I)*tt;B.blades.push({x:T,y:Z,a:I});for(let dt of x(T,Z,(B.evo?18:12)*A)){let lt=dt.hits.blood||-9;c.time-lt<.35||(dt.hits.blood=c.time,dt.bladeKill=!0,q(dt,et,"blood"),dt.dead||(dt.bladeKill=!1),B.evo&&(C.hp=Math.min(C.maxHp,C.hp+et*.01)),G(dt.x,dt.y,"#ff3b5c",2,80,.3))}}break}case"void":{if(B.cd>0)break;if(B.evo){B.cd=4*ut;let k=Lt()||Vt(C.x,C.y,800),tt=k?k.x:C.x+n(-200,200),et=k?k.y:C.y+n(-200,200);c.holes.push({x:tt,y:et,t:0,life:3,r:210*A,dmg:22*mt,tick:0,final:140*mt});for(let ht=1;ht<=P;ht++)c.holes.push({x:tt+n(-250,250),y:et+n(-250,250),t:0,life:3,r:170*A,dmg:18*mt,tick:0,final:110*mt})}else{B.cd=(2.6-(F>=5?.6:0))*ut;let k=1+(F>=3?1:0)+(F>=5?1:0)+P;for(let tt=0;tt<k;tt++){let et=Lt()||Vt(C.x,C.y,700),ht=et?Math.atan2(et.y-C.y,et.x-C.x)+n(-.2,.2):Math.random()*Qe;Xt({x:C.x,y:C.y,vx:Math.cos(ht)*170,vy:Math.sin(ht)*170,dmg:(34+(F>=2?12:0)+(F>=4?16:0))*mt,pierce:1,color:"#b46cff",r:10*A,el:"void",life:1.5,kind:"orb",blast:(75+(F>=2?15:0)+(F>=4?20:0))*A})}}break}}}}function ie(b,C,B,F,P,mt){for(let ut of x(b,C,B,[]))q(ut,F,P);c.blasts.push({x:b,y:C,r:B,life:.3,max:.3,color:mt}),G(b,C,mt,14,B*2,.45,3),c.shake=Math.max(c.shake,3)}function ae(b){let C=c.p;C.invuln>0||c.victoryT>=0||(C.hp-=b,C.invuln=.5,c.shake=Math.max(c.shake,7),c.flash=Math.max(c.flash,.25),c.flashColor="#ff2040",z(C.x,C.y-26,"-"+Math.round(b),"#ff6a7a",15),C.hp<=0&&(C.hp=0,At(!1)))}function ct(b){let C=c.p;c.time+=b;let B=0,F=0;(o.KeyW||o.ArrowUp)&&(F-=1),(o.KeyS||o.ArrowDown)&&(F+=1),(o.KeyA||o.ArrowLeft)&&(B-=1),(o.KeyD||o.ArrowRight)&&(B+=1),l.active&&(B+=l.dx,F+=l.dy);let P=Math.hypot(B,F);if(P>0){let A=Math.min(1,P)/P;C.x+=B*A*C.speed*b,C.y+=F*A*C.speed*b,Math.abs(B)>.1&&(C.face=B>0?1:-1),C.moveA=Math.atan2(F,B),C.walk+=b*10,C.moving=!0}else C.moving=!1;C.invuln-=b,C.castT=Math.max(0,(C.castT||0)-b),C.regen>0&&(C.hp=Math.min(C.maxHp,C.hp+C.regen*b)),m(),it(b),$t(b);let mt=[];for(let A of c.enemies){if(A.dead||(A.flash-=b,A.burnT>0&&(A.burnT-=b,A.burnAcc=(A.burnAcc||0)+b,A.burnAcc>=.5&&(A.burnAcc=0,q(A,A.burnDps*.5,"burn"),A.dead))))continue;if(A.frozen>0)A.frozen-=b;else if(A.boss)zt(A,b);else{let tt=A.speed;A.slowT>0&&(A.slowT-=b,tt*=1-A.slow);let et=C.x-A.x,ht=C.y-A.y,I=Math.hypot(et,ht)||1,T=1;if(A.ranged&&I<A.ranged.range*.65&&(T=-.4),A.x+=et/I*tt*b*T,A.y+=ht/I*tt*b*T,A.face=et>=0?1:-1,A.ranged&&(A.shootCd-=b,A.shootCd<=0&&I<A.ranged.range&&(A.shootCd=A.ranged.cd*n(.8,1.2),A.atk=.35,Bt(A.x,A.y,Math.atan2(ht,et),A.ranged.speed,A.ranged.dmg*(1+c.chId*.12),A.ranged.color,5))),I>1400&&!A.elite){let[Z,dt]=X();A.x=Z,A.y=dt}}if((A.kx||A.ky)&&(A.x+=A.kx*b,A.y+=A.ky*b,A.kx*=.88,A.ky*=.88,Math.abs(A.kx)+Math.abs(A.ky)<5&&(A.kx=A.ky=0)),!A.boss){x(A.x,A.y,A.r,mt);let tt=0;for(let et of mt){if(et===A||tt>5)continue;let ht=A.x-et.x,I=A.y-et.y,T=Math.hypot(ht,I)||.01,Z=A.r+et.r;if(T<Z){let dt=(Z-T)*.35;A.x+=ht/T*dt,A.y+=I/T*dt,tt++}}}let k=A.r+C.r-3;r(A.x,A.y,C.x,C.y)<k*k&&ae(A.dmg)}for(let A of c.shots){if(A.life-=b,A.homing){let k=Vt(A.x,A.y,300,A.hit);if(k){let tt=Math.atan2(k.y-A.y,k.x-A.x),et=Math.hypot(A.vx,A.vy),ht=Math.atan2(A.vy,A.vx),I=tt-ht;for(;I>Math.PI;)I-=Qe;for(;I<-Math.PI;)I+=Qe;let T=ht+s(I,-A.homing*b,A.homing*b);A.vx=Math.cos(T)*et,A.vy=Math.sin(T)*et}}if(A.x+=A.vx*b,A.y+=A.vy*b,A.kind==="orb"&&A.life<=0){ie(A.x,A.y,A.blast,A.dmg,"void","#b46cff");continue}for(let k of x(A.x,A.y,A.r))if(!A.hit.has(k)){if(A.hit.add(k),A.kind==="orb"){ie(A.x,A.y,A.blast,A.dmg,"void","#b46cff"),A.life=-1;break}if(q(k,A.dmg,A.el),A.slow&&!k.dead&&(k.slowT=1.6,k.slow=Math.max(k.slow,A.slow)),!k.boss&&!k.dead){let tt=Math.hypot(A.vx,A.vy)||1;k.kx+=A.vx/tt*60,k.ky+=A.vy/tt*60}if(G(A.x,A.y,A.color,2,60,.25,2),--A.pierce<=0){A.life=-1;break}}}c.shots=c.shots.filter(A=>A.life>0);for(let A of c.rings)if(A.r+=A.speed*b,!A.visual){for(let k of x(A.x,A.y,A.r,[]))if(!A.hit.has(k)){if(r(A.x,A.y,k.x,k.y)<(A.r-40)*(A.r-40)){A.hit.add(k);continue}A.hit.add(k),q(k,A.dmg,A.el),k.dead||(k.burnT=3,k.burnDps=Math.max(k.burnDps,A.burn))}}c.rings=c.rings.filter(A=>A.r<A.max);for(let A of c.holes){A.t+=b,A.tick-=b;for(let k of x(A.x,A.y,A.r,[])){if(k.boss)continue;let tt=Math.atan2(A.y-k.y,A.x-k.x);k.x+=Math.cos(tt)*160*b,k.y+=Math.sin(tt)*160*b}if(A.tick<=0){A.tick=.3;for(let k of x(A.x,A.y,A.r*.45,[]))q(k,A.dmg,"void",!0)}if(Math.random()<.5){let k=Math.random()*Qe;c.parts.push({x:A.x+Math.cos(k)*A.r,y:A.y+Math.sin(k)*A.r,vx:-Math.cos(k)*A.r*1.5,vy:-Math.sin(k)*A.r*1.5,life:.6,max:.6,color:"#c78bff",size:2.5})}A.t>=A.life&&ie(A.x,A.y,A.r*.7,A.final,"void","#d0a0ff")}c.holes=c.holes.filter(A=>A.t<A.life);for(let A of c.eShots){A.life-=b,A.x+=A.vx*b,A.y+=A.vy*b;let k=A.r+C.r-2;r(A.x,A.y,C.x,C.y)<k*k&&(ae(A.dmg),A.life=0)}c.eShots=c.eShots.filter(A=>A.life>0);for(let A of c.hazards)A.t+=b,!A.done&&A.t>=A.delay&&(A.done=!0,c.blasts.push({x:A.x,y:A.y,r:A.r,life:.35,max:.35,color:A.color}),r(A.x,A.y,C.x,C.y)<(A.r+C.r)*(A.r+C.r)&&ae(A.dmg));c.hazards=c.hazards.filter(A=>A.t<A.delay+.1);let ut=C.magnet*C.magnet;for(let A of c.gems){let k=r(A.x,A.y,C.x,C.y);if(!A.mag&&k<ut&&(A.mag=!0),A.mag){let tt=Math.sqrt(k)||1,et=420+(c.victoryT>=0?400:0);A.x+=(C.x-A.x)/tt*et*b,A.y+=(C.y-A.y)/tt*et*b,tt<C.r+8&&(A.dead=!0,Mt(A.val))}}c.gems=c.gems.filter(A=>!A.dead);for(let A of c.pickups){A.t+=b;let k=r(A.x,A.y,C.x,C.y);if(k<(C.magnet*.8)**2||c.victoryT>=0){let tt=Math.sqrt(k)||1;A.x+=(C.x-A.x)/tt*300*b,A.y+=(C.y-A.y)/tt*300*b}k<(C.r+14)**2&&(A.dead=!0,Ot(A))}c.pickups=c.pickups.filter(A=>!A.dead),c.enemies=c.enemies.filter(A=>!A.dead);for(let A of c.lines)A.life-=b;c.lines=c.lines.filter(A=>A.life>0);for(let A of c.blasts)A.life-=b;c.blasts=c.blasts.filter(A=>A.life>0);for(let A of c.parts)A.life-=b,A.x+=A.vx*b,A.y+=A.vy*b,A.vx*=.92,A.vy*=.92;c.parts=c.parts.filter(A=>A.life>0);for(let A of c.texts)A.life-=b,A.y-=32*b;c.texts=c.texts.filter(A=>A.life>0),c.shake=Math.max(0,c.shake-b*30),c.flash=Math.max(0,c.flash-b*1.5),c.banner&&(c.banner.t-=b,c.banner.t<=0&&(c.banner=null)),c.victoryT>=0&&(c.victoryT-=b,c.victoryT<0&&!c.over&&At(!0)),c.levelQueue>0&&!c.over&&(c.levelQueue--,St())}function Mt(b){let C=c.p;for(C.xp+=b,c.xpTotal=(c.xpTotal||0)+b,C.heart=Math.min(100,C.heart+b*.55*(c.spec==="void"?2:1));C.xp>=C.xpNext;)C.xp-=C.xpNext,C.lvl++,C.xpNext=_(C.lvl),C.lvl>=DATA.rules.specLevel&&!c.spec&&(c.specPending=!0),c.levelQueue++}function St(){c.paused=!0;let b=c.p;G(b.x,b.y,"#9ad0ff",24,200,.6),c.specPending&&!c.spec?(c.specPending=!1,UI.onLevelUp(D(),!0)):UI.onLevelUp(S(3),!1)}function Ot(b){let C=c.p;if(b.kind==="heal"){let B=Math.round(C.maxHp*.3);C.hp=Math.min(C.maxHp,C.hp+B),z(C.x,C.y-30,"+"+B,"#7dffa8",16)}else if(b.kind==="magnet"){for(let B of c.gems)B.mag=!0;z(C.x,C.y-30,"\u041F\u0440\u0438\u0442\u044F\u0436\u0435\u043D\u0438\u0435!","#9ad0ff",16)}else if(b.kind==="fragment"){let B=Save.unlockNextFragment(c.chId);B?(c.fragmentsFound.push(B),UI.onFragment&&UI.onFragment(B)):(c.bonusEther=(c.bonusEther||0)+25,z(C.x,C.y-30,"+25 \u042D\u0444\u0438\u0440\u0430","#c9a8ff",16))}}function At(b){if(c.over)return;c.over=!0,c.paused=!0;let C=Save.data,B=Math.floor(c.kills/8)+Math.floor(c.time/6)+(b?80+c.chId*40:0)+(c.bonusEther||0);C.ether+=B,C.runs++,C.kills+=c.kills,b||C.deaths++,C.bestTime[c.chId]=Math.max(C.bestTime[c.chId]||0,Math.floor(c.time)),b&&(C.cleared[c.chId]=!0,C.unlockedChapter=Math.max(C.unlockedChapter,Math.min(3,c.chId+1)));let F=null;c.fragmentsFound.length||(F=Save.unlockNextFragment(c.chId)),Save.write();let P={victory:b,ch:c.chId,time:c.time,kills:c.kills,level:c.p.lvl,ether:B,fragments:c.fragmentsFound.slice(),vision:F,spec:c.spec,heartUses:c.heartUses};setTimeout(()=>UI.onRunEnd(P),b?200:900)}function ee(){c=null;for(let b in o)o[b]=!1}return{start:M,quit:ee,useHeart:U,applyChoice:L,update:ct,setView(b,C){t=b,e=C,sh.W=b,sh.H=C},reroll(){return!c||c.p.rerolls<=0?null:(c.p.rerolls--,S(3))},get rerolls(){return c?c.p.rerolls:0},setPaused(b){c&&!c.over&&(c.paused=b)},get running(){return!!c&&!c.over},get run(){return c},getWeapon:b=>c&&w(b),joy:l,debug:{skipTo(b){c&&(c.time=b)},god(){c&&(c.p.invuln=1e9)},xp(b){c&&Mt(b)},step(b,C){for(let B=0;B<b&&c&&!c.paused;B++){if(C){let F=c.p,P=0,mt=0;for(let k of c.enemies){let tt=F.x-k.x,et=F.y-k.y,ht=tt*tt+et*et;ht<48400&&(P+=tt/ht*900*(k.boss?4:1),mt+=et/ht*900*(k.boss?4:1))}for(let k of c.eShots){let tt=F.x-k.x,et=F.y-k.y,ht=tt*tt+et*et;ht<14400&&(P+=tt/ht*1500,mt+=et/ht*1500)}let ut=null,A=1e12;for(let k of c.gems){let tt=r(k.x,k.y,F.x,F.y);tt<A&&(A=tt,ut=k)}if(ut){let k=Math.sqrt(A)||1;P+=(ut.x-F.x)/k*4,mt+=(ut.y-F.y)/k*4}F.heart>=100&&(c.boss||F.hp<F.maxHp*.4)&&U(),o.KeyD=P>.3,o.KeyA=P<-.3,o.KeyS=mt>.3,o.KeyW=mt<-.3}ct(1/60)}for(let B in o)o[B]=!1}}}}var zh=0,ec=1,kh=2;var qi=1,Hh=2,Is=3,Wn=0,un=1,wn=2,si=0,Ci=1,Yi=2,nc=3,ic=4,Gh=5;var Zi=100,Vh=101,Wh=102,Xh=103,qh=104,Yh=200,Zh=201,Jh=202,$h=203,sc=204,rc=205,Kh=206,Qh=207,jh=208,tu=209,eu=210,nu=211,iu=212,su=213,ru=214,Ca=0,Ia=1,Pa=2,ms=3,La=4,Da=5,Na=6,Ua=7,ac=0,au=1,ou=2,Xn=0,Dr=1,Nr=2,Ur=3,Ji=4,Fr=5,Or=6,Br=7;var oc=300,$i=301,Ps=302,co=303,ho=304,gs=1e3,kn=1001,Fa=1002,We=1003,lu=1004;var zr=1005;var cn=1006,uo=1007;var ri=1008;var dn=1009,lc=1010,cc=1011,Ls=1012,fo=1013,Fn=1014,An=1015,Ze=1016,po=1017,mo=1018,Ki=1020,hc=35902,uc=35899,dc=1021,fc=1022,On=1023,ei=1026,ai=1027,go=1028,xo=1029,Ii=1030,_o=1031;var yo=1033,kr=33776,Hr=33777,Gr=33778,Vr=33779,vo=35840,Mo=35841,So=35842,bo=35843,To=36196,Eo=37492,wo=37496,Ao=37488,Ro=37489,Wr=37490,Co=37491,Io=37808,Po=37809,Lo=37810,Do=37811,No=37812,Uo=37813,Fo=37814,Oo=37815,Bo=37816,zo=37817,ko=37818,Ho=37819,Go=37820,Vo=37821,Wo=36492,Xo=36494,qo=36495,Yo=36283,Zo=36284,Xr=36285,Jo=36286;var Ks=2300,Oa=2301,Aa=2302,Gl=2303,Vl=2400,Wl=2401,Xl=2402;var cu=3200;var $o=0,hu=1,oi="",en="srgb",Qs="srgb-linear",js="linear",_e="srgb";var Ra=7680;var uu=519,du=512,fu=513,pu=514,pc=515,mu=516,gu=517,mc=518,gc=519,xu=35044,xc=35048;var _c="300 es",Tn=2e3,xs=2001;function Dd(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Nd(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function tr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function _u(){let i=tr("canvas");return i.style.display="block",i}var ah={},_s=null;function yc(...i){let t="THREE."+i.shift();_s?_s("log",t,...i):console.log(t,...i)}function yu(i){let t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Kt(...i){i=yu(i);let t="THREE."+i.shift();if(_s)_s("warn",t,...i);else{let e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function Qt(...i){i=yu(i);let t="THREE."+i.shift();if(_s)_s("error",t,...i);else{let e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function Zs(...i){let t=i.join(" ");t in ah||(ah[t]=!0,Kt(...i))}function vu(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}var Mu={[Ca]:Ca,[Pa]:Na,[La]:La,[ms]:Da,[Ia]:Ia,[Na]:Pa,[Ua]:Ua,[Da]:ms},Gn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let s=n[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}},je=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var xl=Math.PI/180,Ba=180/Math.PI;function Ds(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(je[i&255]+je[i>>8&255]+je[i>>16&255]+je[i>>24&255]+"-"+je[t&255]+je[t>>8&255]+"-"+je[t>>16&15|64]+je[t>>24&255]+"-"+je[e&63|128]+je[e>>8&255]+"-"+je[e>>16&255]+je[e>>24&255]+je[n&255]+je[n>>8&255]+je[n>>16&255]+je[n>>24&255]).toLowerCase()}function de(i,t,e){return Math.max(t,Math.min(e,i))}function Ud(i,t){return(i%t+t)%t}function _l(i,t,e){return(1-e)*i+e*t}function Su(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function vc(i){switch(i.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function Fd(i,t){if(t.constructor===Float32Array)return i;let e=vc(t);if(e===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(i/e,-1)}function Od(i,t){if(t.constructor===Float32Array)return i;let e=vc(t);if(e===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(i*e)}var wc=class wc{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=de(this.x,t.x,e.x),this.y=de(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=de(this.x,t,e),this.y=de(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(de(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(de(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};wc.prototype.isVector2=!0;var ft=wc,Ye=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],h=n[s+1],u=n[s+2],f=n[s+3],p=r[a+0],d=r[a+1],m=r[a+2],x=r[a+3];if(f!==x||l!==p||h!==d||u!==m){let c=l*p+h*d+u*m+f*x;c<0&&(p=-p,d=-d,m=-m,x=-x,c=-c);let g=1-o;if(c<.9995){let _=Math.acos(c),M=Math.sin(_);g=Math.sin(g*_)/M,o=Math.sin(o*_)/M,l=l*g+p*o,h=h*g+d*o,u=u*g+m*o,f=f*g+x*o}else{l=l*g+p*o,h=h*g+d*o,u=u*g+m*o,f=f*g+x*o;let _=1/Math.sqrt(l*l+h*h+u*u+f*f);l*=_,h*=_,u*=_,f*=_}}t[e]=l,t[e+1]=h,t[e+2]=u,t[e+3]=f}static multiplyQuaternionsFlat(t,e,n,s,r,a){let o=n[s],l=n[s+1],h=n[s+2],u=n[s+3],f=r[a],p=r[a+1],d=r[a+2],m=r[a+3];return t[e]=o*m+u*f+l*d-h*p,t[e+1]=l*m+u*p+h*f-o*d,t[e+2]=h*m+u*d+o*p-l*f,t[e+3]=u*m-o*f-l*p-h*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,h=o(n/2),u=o(s/2),f=o(r/2),p=l(n/2),d=l(s/2),m=l(r/2);switch(a){case"XYZ":this._x=p*u*f+h*d*m,this._y=h*d*f-p*u*m,this._z=h*u*m+p*d*f,this._w=h*u*f-p*d*m;break;case"YXZ":this._x=p*u*f+h*d*m,this._y=h*d*f-p*u*m,this._z=h*u*m-p*d*f,this._w=h*u*f+p*d*m;break;case"ZXY":this._x=p*u*f-h*d*m,this._y=h*d*f+p*u*m,this._z=h*u*m+p*d*f,this._w=h*u*f-p*d*m;break;case"ZYX":this._x=p*u*f-h*d*m,this._y=h*d*f+p*u*m,this._z=h*u*m-p*d*f,this._w=h*u*f+p*d*m;break;case"YZX":this._x=p*u*f+h*d*m,this._y=h*d*f+p*u*m,this._z=h*u*m-p*d*f,this._w=h*u*f-p*d*m;break;case"XZY":this._x=p*u*f-h*d*m,this._y=h*d*f-p*u*m,this._z=h*u*m+p*d*f,this._w=h*u*f+p*d*m;break;default:Kt("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],h=e[2],u=e[6],f=e[10],p=n+o+f;if(p>0){let d=.5/Math.sqrt(p+1);this._w=.25/d,this._x=(u-l)*d,this._y=(r-h)*d,this._z=(a-s)*d}else if(n>o&&n>f){let d=2*Math.sqrt(1+n-o-f);this._w=(u-l)/d,this._x=.25*d,this._y=(s+a)/d,this._z=(r+h)/d}else if(o>f){let d=2*Math.sqrt(1+o-n-f);this._w=(r-h)/d,this._x=(s+a)/d,this._y=.25*d,this._z=(l+u)/d}else{let d=2*Math.sqrt(1+f-n-o);this._w=(a-s)/d,this._x=(r+h)/d,this._y=(l+u)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(de(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,h=e._z,u=e._w;return this._x=n*u+a*o+s*h-r*l,this._y=s*u+a*l+r*o-n*h,this._z=r*u+a*h+n*l-s*o,this._w=a*u-n*o-s*l-r*h,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-e;if(o<.9995){let h=Math.acos(o),u=Math.sin(h);l=Math.sin(l*h)/u,e=Math.sin(e*h)/u,this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},Ac=class Ac{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(oh.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(oh.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,h=2*(a*s-o*n),u=2*(o*e-r*s),f=2*(r*n-a*e);return this.x=e+l*h+a*f-o*u,this.y=n+l*u+o*h-r*f,this.z=s+l*f+r*u-a*h,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=de(this.x,t.x,e.x),this.y=de(this.y,t.y,e.y),this.z=de(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=de(this.x,t,e),this.y=de(this.y,t,e),this.z=de(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(de(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return yl.copy(this).projectOnVector(t),this.sub(yl)}reflect(t){return this.sub(yl.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(de(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Ac.prototype.isVector3=!0;var H=Ac,yl=new H,oh=new Ye,Rc=class Rc{constructor(t,e,n,s,r,a,o,l,h){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,h)}set(t,e,n,s,r,a,o,l,h){let u=this.elements;return u[0]=t,u[1]=s,u[2]=o,u[3]=e,u[4]=r,u[5]=l,u[6]=n,u[7]=a,u[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],h=n[1],u=n[4],f=n[7],p=n[2],d=n[5],m=n[8],x=s[0],c=s[3],g=s[6],_=s[1],M=s[4],v=s[7],R=s[2],w=s[5],y=s[8];return r[0]=a*x+o*_+l*R,r[3]=a*c+o*M+l*w,r[6]=a*g+o*v+l*y,r[1]=h*x+u*_+f*R,r[4]=h*c+u*M+f*w,r[7]=h*g+u*v+f*y,r[2]=p*x+d*_+m*R,r[5]=p*c+d*M+m*w,r[8]=p*g+d*v+m*y,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],h=t[7],u=t[8];return e*a*u-e*o*h-n*r*u+n*o*l+s*r*h-s*a*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],h=t[7],u=t[8],f=u*a-o*h,p=o*l-u*r,d=h*r-a*l,m=e*f+n*p+s*d;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/m;return t[0]=f*x,t[1]=(s*h-u*n)*x,t[2]=(o*n-s*a)*x,t[3]=p*x,t[4]=(u*e-s*l)*x,t[5]=(s*r-o*e)*x,t[6]=d*x,t[7]=(n*l-h*e)*x,t[8]=(a*e-n*r)*x,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){let l=Math.cos(r),h=Math.sin(r);return this.set(n*l,n*h,-n*(l*a+h*o)+a+t,-s*h,s*l,-s*(-h*a+l*o)+o+e,0,0,1),this}scale(t,e){return Zs("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(vl.makeScale(t,e)),this}rotate(t){return Zs("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(vl.makeRotation(-t)),this}translate(t,e){return Zs("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(vl.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};Rc.prototype.isMatrix3=!0;var te=Rc,vl=new te,lh=new te().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ch=new te().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Bd(){let i={enabled:!0,workingColorSpace:Qs,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===_e&&(s.r=ti(s.r),s.g=ti(s.g),s.b=ti(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===_e&&(s.r=ps(s.r),s.g=ps(s.g),s.b=ps(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===oi?js:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[a].fromXYZ).multiply(this.spaces[r].toXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Qs]:{primaries:t,whitePoint:n,transfer:js,toXYZ:lh,fromXYZ:ch,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:en},outputColorSpaceConfig:{drawingBufferColorSpace:en}},[en]:{primaries:t,whitePoint:n,transfer:_e,toXYZ:lh,fromXYZ:ch,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:en}}}),i}var ue=Bd();function ti(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function ps(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var ts,za=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{ts===void 0&&(ts=tr("canvas")),ts.width=t.width,ts.height=t.height;let s=ts.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=ts}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=tr("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=ti(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(ti(e[n]/255)*255):e[n]=ti(e[n]);return{data:e,width:t.width,height:t.height}}else return Kt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},zd=0,ys=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:zd++}),this.uuid=Ds(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width||0,e.height||0,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Ml(s[a].image)):r.push(Ml(s[a]))}else r=Ml(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function Ml(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?za.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Kt("Texture: Unable to serialize Texture."),{})}var kd=0,Sl=new H,hn=class i extends Gn{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=kn,s=kn,r=cn,a=ri,o=On,l=dn,h=i.DEFAULT_ANISOTROPY,u=oi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:kd++}),this.uuid=Ds(),this.name="",this.source=new ys(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=h,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ft(0,0),this.repeat=new ft(1,1),this.center=new ft(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new te,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(Sl).x}get height(){return this.source.getSize(Sl).y}get depth(){return this.source.getSize(Sl).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.mipmapsAutoUpdate=t.mipmapsAutoUpdate,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isPMREMTexture=t.isPMREMTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){Kt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Kt(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==oc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case gs:t.x=t.x-Math.floor(t.x);break;case kn:t.x=t.x<0?0:1;break;case Fa:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case gs:t.y=t.y-Math.floor(t.y);break;case kn:t.y=t.y<0?0:1;break;case Fa:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};hn.DEFAULT_IMAGE=null;hn.DEFAULT_MAPPING=oc;hn.DEFAULT_ANISOTROPY=1;var Cc=class Cc{constructor(t=0,e=0,n=0,s=1){this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,h=l[0],u=l[4],f=l[8],p=l[1],d=l[5],m=l[9],x=l[2],c=l[6],g=l[10];if(Math.abs(u-p)<.01&&Math.abs(f-x)<.01&&Math.abs(m-c)<.01){if(Math.abs(u+p)<.1&&Math.abs(f+x)<.1&&Math.abs(m+c)<.1&&Math.abs(h+d+g-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let M=(h+1)/2,v=(d+1)/2,R=(g+1)/2,w=(u+p)/4,y=(f+x)/4,S=(m+c)/4;return M>v&&M>R?M<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(M),s=w/n,r=y/n):v>R?v<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),n=w/s,r=S/s):R<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(R),n=y/r,s=S/r),this.set(n,s,r,e),this}let _=Math.sqrt((c-m)*(c-m)+(f-x)*(f-x)+(p-u)*(p-u));return Math.abs(_)<.001&&(_=1),this.x=(c-m)/_,this.y=(f-x)/_,this.z=(p-u)/_,this.w=Math.acos((h+d+g-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=de(this.x,t.x,e.x),this.y=de(this.y,t.y,e.y),this.z=de(this.z,t.z,e.z),this.w=de(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=de(this.x,t,e),this.y=de(this.y,t,e),this.z=de(this.z,t,e),this.w=de(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(de(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Cc.prototype.isVector4=!0;var Ce=Cc,ka=class extends Gn{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:cn,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new Ce(0,0,t,e),this.scissorTest=!1,this.viewport=new Ce(0,0,t,e),this.textures=[];let s=n.count;for(let r=0;r<s;r++)this.textures[r]=new hn({width:t,height:e,depth:n.depth}),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){let e={minFilter:cn,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.mipmapsAutoUpdate!==void 0&&(e.mipmapsAutoUpdate=t.mipmapsAutoUpdate),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let s=Object.assign({},t.textures[e].image);this.textures[e].source=new ys(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;else this.depthTexture=null;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},Oe=class extends ka{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},er=class extends hn{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=We,this.minFilter=We,this.wrapR=kn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var Ha=class extends hn{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=We,this.minFilter=We,this.wrapR=kn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}};var lo=class lo{constructor(t,e,n,s,r,a,o,l,h,u,f,p,d,m,x,c){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,h,u,f,p,d,m,x,c)}set(t,e,n,s,r,a,o,l,h,u,f,p,d,m,x,c){let g=this.elements;return g[0]=t,g[4]=e,g[8]=n,g[12]=s,g[1]=r,g[5]=a,g[9]=o,g[13]=l,g[2]=h,g[6]=u,g[10]=f,g[14]=p,g[3]=d,g[7]=m,g[11]=x,g[15]=c,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new lo().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,s=1/es.setFromMatrixColumn(t,0).length(),r=1/es.setFromMatrixColumn(t,1).length(),a=1/es.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),h=Math.sin(s),u=Math.cos(r),f=Math.sin(r);if(t.order==="XYZ"){let p=a*u,d=a*f,m=o*u,x=o*f;e[0]=l*u,e[4]=-l*f,e[8]=h,e[1]=d+m*h,e[5]=p-x*h,e[9]=-o*l,e[2]=x-p*h,e[6]=m+d*h,e[10]=a*l}else if(t.order==="YXZ"){let p=l*u,d=l*f,m=h*u,x=h*f;e[0]=p+x*o,e[4]=m*o-d,e[8]=a*h,e[1]=a*f,e[5]=a*u,e[9]=-o,e[2]=d*o-m,e[6]=x+p*o,e[10]=a*l}else if(t.order==="ZXY"){let p=l*u,d=l*f,m=h*u,x=h*f;e[0]=p-x*o,e[4]=-a*f,e[8]=m+d*o,e[1]=d+m*o,e[5]=a*u,e[9]=x-p*o,e[2]=-a*h,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){let p=a*u,d=a*f,m=o*u,x=o*f;e[0]=l*u,e[4]=m*h-d,e[8]=p*h+x,e[1]=l*f,e[5]=x*h+p,e[9]=d*h-m,e[2]=-h,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){let p=a*l,d=a*h,m=o*l,x=o*h;e[0]=l*u,e[4]=x-p*f,e[8]=m*f+d,e[1]=f,e[5]=a*u,e[9]=-o*u,e[2]=-h*u,e[6]=d*f+m,e[10]=p-x*f}else if(t.order==="XZY"){let p=a*l,d=a*h,m=o*l,x=o*h;e[0]=l*u,e[4]=-f,e[8]=h*u,e[1]=p*f+x,e[5]=a*u,e[9]=d*f-m,e[2]=m*f-d,e[6]=o*u,e[10]=x*f+p}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Hd,t,Gd)}lookAt(t,e,n){let s=this.elements;return mn.subVectors(t,e),mn.lengthSq()===0&&(mn.z=1),mn.normalize(),di.crossVectors(n,mn),di.lengthSq()===0&&(Math.abs(n.z)===1?mn.x+=1e-4:mn.z+=1e-4,mn.normalize(),di.crossVectors(n,mn)),di.normalize(),sa.crossVectors(mn,di),s[0]=di.x,s[4]=sa.x,s[8]=mn.x,s[1]=di.y,s[5]=sa.y,s[9]=mn.y,s[2]=di.z,s[6]=sa.z,s[10]=mn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],h=n[12],u=n[1],f=n[5],p=n[9],d=n[13],m=n[2],x=n[6],c=n[10],g=n[14],_=n[3],M=n[7],v=n[11],R=n[15],w=s[0],y=s[4],S=s[8],D=s[12],L=s[1],U=s[5],z=s[9],G=s[13],N=s[2],q=s[6],Y=s[10],W=s[14],$=s[3],X=s[7],j=s[11],it=s[15];return r[0]=a*w+o*L+l*N+h*$,r[4]=a*y+o*U+l*q+h*X,r[8]=a*S+o*z+l*Y+h*j,r[12]=a*D+o*G+l*W+h*it,r[1]=u*w+f*L+p*N+d*$,r[5]=u*y+f*U+p*q+d*X,r[9]=u*S+f*z+p*Y+d*j,r[13]=u*D+f*G+p*W+d*it,r[2]=m*w+x*L+c*N+g*$,r[6]=m*y+x*U+c*q+g*X,r[10]=m*S+x*z+c*Y+g*j,r[14]=m*D+x*G+c*W+g*it,r[3]=_*w+M*L+v*N+R*$,r[7]=_*y+M*U+v*q+R*X,r[11]=_*S+M*z+v*Y+R*j,r[15]=_*D+M*G+v*W+R*it,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],h=t[13],u=t[2],f=t[6],p=t[10],d=t[14],m=t[3],x=t[7],c=t[11],g=t[15],_=l*d-h*p,M=o*d-h*f,v=o*p-l*f,R=a*d-h*u,w=a*p-l*u,y=a*f-o*u;return e*(x*_-c*M+g*v)-n*(m*_-c*R+g*w)+s*(m*M-x*R+g*y)-r*(m*v-x*w+c*y)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[1],a=t[5],o=t[9],l=t[2],h=t[6],u=t[10];return e*(a*u-o*h)-n*(r*u-o*l)+s*(r*h-a*l)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],h=t[7],u=t[8],f=t[9],p=t[10],d=t[11],m=t[12],x=t[13],c=t[14],g=t[15],_=e*o-n*a,M=e*l-s*a,v=e*h-r*a,R=n*l-s*o,w=n*h-r*o,y=s*h-r*l,S=u*x-f*m,D=u*c-p*m,L=u*g-d*m,U=f*c-p*x,z=f*g-d*x,G=p*g-d*c,N=_*G-M*z+v*U+R*L-w*D+y*S;if(N===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let q=1/N;return t[0]=(o*G-l*z+h*U)*q,t[1]=(s*z-n*G-r*U)*q,t[2]=(x*y-c*w+g*R)*q,t[3]=(p*w-f*y-d*R)*q,t[4]=(l*L-a*G-h*D)*q,t[5]=(e*G-s*L+r*D)*q,t[6]=(c*v-m*y-g*M)*q,t[7]=(u*y-p*v+d*M)*q,t[8]=(a*z-o*L+h*S)*q,t[9]=(n*L-e*z-r*S)*q,t[10]=(m*w-x*v+g*_)*q,t[11]=(f*v-u*w-d*_)*q,t[12]=(o*D-a*U-l*S)*q,t[13]=(e*U-n*D+s*S)*q,t[14]=(x*M-m*R-c*_)*q,t[15]=(u*R-f*M+p*_)*q,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,h=r*a,u=r*o;return this.set(h*a+n,h*o-s*l,h*l+s*o,0,h*o+s*l,u*o+n,u*l-s*a,0,h*l-s*o,u*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,h=r+r,u=a+a,f=o+o,p=r*h,d=r*u,m=r*f,x=a*u,c=a*f,g=o*f,_=l*h,M=l*u,v=l*f,R=n.x,w=n.y,y=n.z;return s[0]=(1-(x+g))*R,s[1]=(d+v)*R,s[2]=(m-M)*R,s[3]=0,s[4]=(d-v)*w,s[5]=(1-(p+g))*w,s[6]=(c+_)*w,s[7]=0,s[8]=(m+M)*y,s[9]=(c-_)*y,s[10]=(1-(p+x))*y,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),e.identity(),this;let a=es.set(s[0],s[1],s[2]).length(),o=es.set(s[4],s[5],s[6]).length(),l=es.set(s[8],s[9],s[10]).length();r<0&&(a=-a),Pn.copy(this);let h=1/a,u=1/o,f=1/l;return Pn.elements[0]*=h,Pn.elements[1]*=h,Pn.elements[2]*=h,Pn.elements[4]*=u,Pn.elements[5]*=u,Pn.elements[6]*=u,Pn.elements[8]*=f,Pn.elements[9]*=f,Pn.elements[10]*=f,e.setFromRotationMatrix(Pn),n.x=a,n.y=o,n.z=l,this}makePerspective(t,e,n,s,r,a,o=Tn,l=!1){let h=this.elements,u=2*r/(e-t),f=2*r/(n-s),p=(e+t)/(e-t),d=(n+s)/(n-s),m,x;if(l)m=r/(a-r),x=a*r/(a-r);else if(o===Tn)m=-(a+r)/(a-r),x=-2*a*r/(a-r);else if(o===xs)m=-a/(a-r),x=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return h[0]=u,h[4]=0,h[8]=p,h[12]=0,h[1]=0,h[5]=f,h[9]=d,h[13]=0,h[2]=0,h[6]=0,h[10]=m,h[14]=x,h[3]=0,h[7]=0,h[11]=-1,h[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=Tn,l=!1){let h=this.elements,u=2/(e-t),f=2/(n-s),p=-(e+t)/(e-t),d=-(n+s)/(n-s),m,x;if(l)m=1/(a-r),x=a/(a-r);else if(o===Tn)m=-2/(a-r),x=-(a+r)/(a-r);else if(o===xs)m=-1/(a-r),x=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return h[0]=u,h[4]=0,h[8]=0,h[12]=p,h[1]=0,h[5]=f,h[9]=0,h[13]=d,h[2]=0,h[6]=0,h[10]=m,h[14]=x,h[3]=0,h[7]=0,h[11]=0,h[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};lo.prototype.isMatrix4=!0;var pe=lo,es=new H,Pn=new pe,Hd=new H(0,0,0),Gd=new H(1,1,1),di=new H,sa=new H,mn=new H,hh=new pe,uh=new Ye,sn=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],h=s[5],u=s[9],f=s[2],p=s[6],d=s[10];switch(e){case"XYZ":this._y=Math.asin(de(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,d),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(p,h),this._z=0);break;case"YXZ":this._x=Math.asin(-de(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,h)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(de(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-f,d),this._z=Math.atan2(-a,h)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-de(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(p,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,h));break;case"YZX":this._z=Math.asin(de(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,h),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-de(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(p,h),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-u,d),this._y=0);break;default:Kt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return hh.makeRotationFromQuaternion(t),this.setFromRotationMatrix(hh,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return uh.setFromEuler(this),this.setFromQuaternion(uh,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};sn.DEFAULT_ORDER="XYZ";var vs=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Vd=0,dh=new H,ns=new Ye,Jn=new pe,ra=new H,Hs=new H,Wd=new H,Xd=new Ye,fh=new H(1,0,0),ph=new H(0,1,0),mh=new H(0,0,1),gh={type:"added"},qd={type:"removed"},is={type:"childadded",child:null},bl={type:"childremoved",child:null},rn=class i extends Gn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Vd++}),this.uuid=Ds(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new H,e=new sn,n=new Ye,s=new H(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new pe},normalMatrix:{value:new te}}),this.matrix=new pe,this.matrixWorld=new pe,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new vs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ns.setFromAxisAngle(t,e),this.quaternion.multiply(ns),this}rotateOnWorldAxis(t,e){return ns.setFromAxisAngle(t,e),this.quaternion.premultiply(ns),this}rotateX(t){return this.rotateOnAxis(fh,t)}rotateY(t){return this.rotateOnAxis(ph,t)}rotateZ(t){return this.rotateOnAxis(mh,t)}translateOnAxis(t,e){return dh.copy(t).applyQuaternion(this.quaternion),this.position.add(dh.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(fh,t)}translateY(t){return this.translateOnAxis(ph,t)}translateZ(t){return this.translateOnAxis(mh,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Jn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?ra.copy(t):ra.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Hs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Jn.lookAt(Hs,ra,this.up):Jn.lookAt(ra,Hs,this.up),this.quaternion.setFromRotationMatrix(Jn),s&&(Jn.extractRotation(s.matrixWorld),ns.setFromRotationMatrix(Jn),this.quaternion.premultiply(ns.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Qt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(gh),is.child=t,this.dispatchEvent(is),is.child=null):Qt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(qd),bl.child=t,this.dispatchEvent(bl),bl.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Jn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Jn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Jn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(gh),is.child=t,this.dispatchEvent(is),is.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Hs,t,Wd),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Hs,Xd,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let h=0,u=l.length;h<u;h++){let f=l[h];r(t.shapes,f)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,h=this.material.length;l<h;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){let o=a(t.geometries),l=a(t.materials),h=a(t.textures),u=a(t.images),f=a(t.shapes),p=a(t.skeletons),d=a(t.animations),m=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),h.length>0&&(n.textures=h),u.length>0&&(n.images=u),f.length>0&&(n.shapes=f),p.length>0&&(n.skeletons=p),d.length>0&&(n.animations=d),m.length>0&&(n.nodes=m)}return n.object=s,n;function a(o){let l=[];for(let h in o){let u=o[h];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};rn.DEFAULT_UP=new H(0,1,0);rn.DEFAULT_MATRIX_AUTO_UPDATE=!0;rn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var jt=class extends rn{constructor(){super(),this.isGroup=!0,this.type="Group"}},Yd={type:"move"},Ms=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new jt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new jt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new H,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new H),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new jt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new H,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new H,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,h=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(h&&t.hand){a=!0;for(let x of t.hand.values()){let c=e.getJointPose(x,n),g=this._getHandJoint(h,x);c!==null&&(g.matrix.fromArray(c.transform.matrix),g.matrix.decompose(g.position,g.quaternion,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=c.radius),g.visible=c!==null}let u=h.joints["index-finger-tip"],f=h.joints["thumb-tip"],p=u.position.distanceTo(f.position),d=.02,m=.005;h.inputState.pinching&&p>d+m?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!h.inputState.pinching&&p<=d-m&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.quaternion,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Yd)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),h!==null&&(h.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new jt;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},bu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},fi={h:0,s:0,l:0},aa={h:0,s:0,l:0};function Tl(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var Yt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=en){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ue.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=ue.workingColorSpace){return this.r=t,this.g=e,this.b=n,ue.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=ue.workingColorSpace){if(t=Ud(t,1),e=de(e,0,1),n=de(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=Tl(a,r,t+1/3),this.g=Tl(a,r,t),this.b=Tl(a,r,t-1/3)}return ue.colorSpaceToWorking(this,s),this}setStyle(t,e=en){function n(r){r!==void 0&&parseFloat(r)<1&&Kt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseFloat(r[1]))/100,Math.min(100,parseFloat(r[2]))/100,Math.min(100,parseFloat(r[3]))/100,e);break;case"hsl":case"hsla":if(r=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:Kt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);Kt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=en){let n=bu[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Kt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=ti(t.r),this.g=ti(t.g),this.b=ti(t.b),this}copyLinearToSRGB(t){return this.r=ps(t.r),this.g=ps(t.g),this.b=ps(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=en){return ue.workingToColorSpace(tn.copy(this),t),Math.round(de(tn.r*255,0,255))*65536+Math.round(de(tn.g*255,0,255))*256+Math.round(de(tn.b*255,0,255))}getHexString(t=en){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ue.workingColorSpace){ue.workingToColorSpace(tn.copy(this),e);let n=tn.r,s=tn.g,r=tn.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,h,u=(o+a)/2;if(o===a)l=0,h=0;else{let f=a-o;switch(h=u<=.5?f/(a+o):f/(2-a-o),a){case n:l=(s-r)/f+(s<r?6:0);break;case s:l=(r-n)/f+2;break;case r:l=(n-s)/f+4;break}l/=6}return t.h=l,t.s=h,t.l=u,t}getRGB(t,e=ue.workingColorSpace){return ue.workingToColorSpace(tn.copy(this),e),t.r=tn.r,t.g=tn.g,t.b=tn.b,t}getStyle(t=en){ue.workingToColorSpace(tn.copy(this),t);let e=tn.r,n=tn.g,s=tn.b;return t!==en?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(fi),this.setHSL(fi.h+t,fi.s+e,fi.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(fi),t.getHSL(aa);let n=_l(fi.h,aa.h,e),s=_l(fi.s,aa.s,e),r=_l(fi.l,aa.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},tn=new Yt;Yt.NAMES=bu;var nr=class i{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new Yt(t),this.near=e,this.far=n}clone(){return new i(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},ir=class extends rn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new sn,this.environmentIntensity=1,this.environmentRotation=new sn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),this.background=t.background!==null?t.background.clone():null,this.environment=t.environment!==null?t.environment.clone():null,this.fog=t.fog!==null?t.fog.clone():null,this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),this.overrideMaterial=t.overrideMaterial!==null?t.overrideMaterial.clone():null,this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}},Ln=new H,$n=new H,El=new H,Kn=new H,ss=new H,rs=new H,xh=new H,wl=new H,Al=new H,Rl=new H,Cl=new Ce,Il=new Ce,Pl=new Ce,xi=class i{constructor(t=new H,e=new H,n=new H){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Ln.subVectors(t,e),s.cross(Ln);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){Ln.subVectors(s,e),$n.subVectors(n,e),El.subVectors(t,e);let a=Ln.dot(Ln),o=Ln.dot($n),l=Ln.dot(El),h=$n.dot($n),u=$n.dot(El),f=a*h-o*o;if(f===0)return r.set(0,0,0),null;let p=1/f,d=(h*l-o*u)*p,m=(a*u-o*l)*p;return r.set(1-d-m,m,d)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Kn)===null?!1:Kn.x>=0&&Kn.y>=0&&Kn.x+Kn.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,Kn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Kn.x),l.addScaledVector(a,Kn.y),l.addScaledVector(o,Kn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,a){return Cl.setScalar(0),Il.setScalar(0),Pl.setScalar(0),Cl.fromBufferAttribute(t,e),Il.fromBufferAttribute(t,n),Pl.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(Cl,r.x),a.addScaledVector(Il,r.y),a.addScaledVector(Pl,r.z),a}static isFrontFacing(t,e,n,s){return Ln.subVectors(n,e),$n.subVectors(t,e),Ln.cross($n).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Ln.subVectors(this.c,this.b),$n.subVectors(this.a,this.b),Ln.cross($n).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,a,o;ss.subVectors(s,n),rs.subVectors(r,n),wl.subVectors(t,n);let l=ss.dot(wl),h=rs.dot(wl);if(l<=0&&h<=0)return e.copy(n);Al.subVectors(t,s);let u=ss.dot(Al),f=rs.dot(Al);if(u>=0&&f<=u)return e.copy(s);let p=l*f-u*h;if(p<=0&&l>=0&&u<=0&&l-u>0)return a=l/(l-u),e.copy(n).addScaledVector(ss,a);Rl.subVectors(t,r);let d=ss.dot(Rl),m=rs.dot(Rl);if(m>=0&&d<=m)return e.copy(r);let x=d*h-l*m;if(x<=0&&h>=0&&m<=0)return o=h/(h-m),e.copy(n).addScaledVector(rs,o);let c=u*m-d*f;if(c<=0&&f-u>=0&&d-m>=0)return xh.subVectors(r,s),o=(f-u)/(f-u+(d-m)),e.copy(s).addScaledVector(xh,o);let g=1/(c+x+p);return a=x*g,o=p*g,e.copy(n).addScaledVector(ss,a).addScaledVector(rs,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Vn=class{constructor(t=new H(1/0,1/0,1/0),e=new H(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Dn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Dn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=Dn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0&&t.isBatchedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Dn):Dn.fromBufferAttribute(r,a),Dn.applyMatrix4(t.matrixWorld),this.expandByPoint(Dn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),oa.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),oa.copy(n.boundingBox)),oa.applyMatrix4(t.matrixWorld),this.union(oa)}let s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Dn),Dn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Gs),la.subVectors(this.max,Gs),as.subVectors(t.a,Gs),os.subVectors(t.b,Gs),ls.subVectors(t.c,Gs),pi.subVectors(os,as),mi.subVectors(ls,os),zi.subVectors(as,ls);let e=[0,-pi.z,pi.y,0,-mi.z,mi.y,0,-zi.z,zi.y,pi.z,0,-pi.x,mi.z,0,-mi.x,zi.z,0,-zi.x,-pi.y,pi.x,0,-mi.y,mi.x,0,-zi.y,zi.x,0];return!Ll(e,as,os,ls,la)||(e=[1,0,0,0,1,0,0,0,1],!Ll(e,as,os,ls,la))?!1:(ca.crossVectors(pi,mi),e=[ca.x,ca.y,ca.z],Ll(e,as,os,ls,la))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Dn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Dn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Qn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Qn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Qn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Qn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Qn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Qn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Qn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Qn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Qn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},Qn=[new H,new H,new H,new H,new H,new H,new H,new H],Dn=new H,oa=new Vn,as=new H,os=new H,ls=new H,pi=new H,mi=new H,zi=new H,Gs=new H,la=new H,ca=new H,ki=new H;function Ll(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){ki.fromArray(i,r);let o=s.x*Math.abs(ki.x)+s.y*Math.abs(ki.y)+s.z*Math.abs(ki.z),l=t.dot(ki),h=e.dot(ki),u=n.dot(ki);if(Math.max(-Math.max(l,h,u),Math.min(l,h,u))>o)return!1}return!0}var Ue=new H,ha=new ft,Zd=0,xn=class extends Gn{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Zd++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=xu,this.updateRanges=[],this.gpuType=An,this.version=0,this._normalizationScale=t!==void 0?vc(t):void 0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this._normalizationScale=t._normalizationScale,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)ha.fromBufferAttribute(this,e),ha.applyMatrix3(t),this.setXY(e,ha.x,ha.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Ue.fromBufferAttribute(this,e),Ue.applyMatrix3(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Ue.fromBufferAttribute(this,e),Ue.applyMatrix4(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ue.fromBufferAttribute(this,e),Ue.applyNormalMatrix(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ue.fromBufferAttribute(this,e),Ue.transformDirection(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=this._denormalize(n)),n}setComponent(t,e,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=this._denormalize(e)),e}setX(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=this._denormalize(e)),e}setY(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=this._denormalize(e)),e}setZ(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=this._denormalize(e)),e}setW(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n),s=this._normalize(s)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n),s=this._normalize(s),r=this._normalize(r)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(t){let e=this._normalizationScale;return e!==void 0?Math.max(t/e,-1):Fd(t,this.array)}_normalize(t){let e=this._normalizationScale;return e!==void 0?Math.round(t*e):Od(t,this.array)}};var sr=class extends xn{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var rr=class extends xn{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var he=class extends xn{constructor(t,e,n){super(new Float32Array(t),e,n)}},Jd=new Vn,Vs=new H,Dl=new H,_i=class{constructor(t=new H,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Jd.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Vs.subVectors(t,this.center);let e=Vs.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Vs,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Dl.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Vs.copy(t.center).add(Dl)),this.expandByPoint(Vs.copy(t.center).sub(Dl))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},$d=0,bn=new pe,Nl=new rn,cs=new H,gn=new Vn,Ws=new Vn,Ve=new H,De=class i extends Gn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:$d++}),this.uuid=Ds(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Dd(t)?rr:sr)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new te().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return bn.makeRotationFromQuaternion(t),this.applyMatrix4(bn),this}rotateX(t){return bn.makeRotationX(t),this.applyMatrix4(bn),this}rotateY(t){return bn.makeRotationY(t),this.applyMatrix4(bn),this}rotateZ(t){return bn.makeRotationZ(t),this.applyMatrix4(bn),this}translate(t,e,n){return bn.makeTranslation(t,e,n),this.applyMatrix4(bn),this}scale(t,e,n){return bn.makeScale(t,e,n),this.applyMatrix4(bn),this}lookAt(t){return Nl.lookAt(t),Nl.updateMatrix(),this.applyMatrix4(Nl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(cs).negate(),this.translate(cs.x,cs.y,cs.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new he(n,3))}else{let n=Math.min(t.length,e.count);for(let s=0;s<n;s++){let r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&Kt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Vn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Qt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new H(-1/0,-1/0,-1/0),new H(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];gn.setFromBufferAttribute(r),this.morphTargetsRelative?(Ve.addVectors(this.boundingBox.min,gn.min),this.boundingBox.expandByPoint(Ve),Ve.addVectors(this.boundingBox.max,gn.max),this.boundingBox.expandByPoint(Ve)):(this.boundingBox.expandByPoint(gn.min),this.boundingBox.expandByPoint(gn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Qt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new _i);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Qt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new H,1/0);return}if(t){let n=this.boundingSphere.center;if(gn.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];Ws.setFromBufferAttribute(o),this.morphTargetsRelative?(Ve.addVectors(gn.min,Ws.min),gn.expandByPoint(Ve),Ve.addVectors(gn.max,Ws.max),gn.expandByPoint(Ve)):(gn.expandByPoint(Ws.min),gn.expandByPoint(Ws.max))}gn.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)Ve.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Ve));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],l=this.morphTargetsRelative;for(let h=0,u=o.count;h<u;h++)Ve.fromBufferAttribute(o,h),l&&(cs.fromBufferAttribute(t,h),Ve.add(cs)),s=Math.max(s,n.distanceToSquared(Ve))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Qt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Qt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new xn(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[],h=new Uint8Array(n.count);for(let D=0;D<n.count;D++)o[D]=new H,l[D]=new H;let u=new H,f=new H,p=new H,d=new ft,m=new ft,x=new ft,c=new H,g=new H;function _(D,L,U){h[D]=h[L]=h[U]=1,u.fromBufferAttribute(n,D),f.fromBufferAttribute(n,L),p.fromBufferAttribute(n,U),d.fromBufferAttribute(r,D),m.fromBufferAttribute(r,L),x.fromBufferAttribute(r,U),f.sub(u),p.sub(u),m.sub(d),x.sub(d);let z=1/(m.x*x.y-x.x*m.y);isFinite(z)&&(c.copy(f).multiplyScalar(x.y).addScaledVector(p,-m.y).multiplyScalar(z),g.copy(p).multiplyScalar(m.x).addScaledVector(f,-x.x).multiplyScalar(z),o[D].add(c),o[L].add(c),o[U].add(c),l[D].add(g),l[L].add(g),l[U].add(g))}let M=this.groups;M.length===0&&(M=[{start:0,count:t.count}]);for(let D=0,L=M.length;D<L;++D){let U=M[D],z=U.start,G=U.count;for(let N=z,q=z+G;N<q;N+=3)_(t.getX(N+0),t.getX(N+1),t.getX(N+2))}let v=new H,R=new H,w=new H,y=new H;function S(D){w.fromBufferAttribute(s,D),y.copy(w);let L=o[D];v.copy(L),v.sub(w.multiplyScalar(w.dot(L))).normalize(),R.crossVectors(y,L);let z=R.dot(l[D])<0?-1:1;a.setXYZW(D,v.x,v.y,v.z,z)}for(let D=0,L=n.count;D<L;++D)h[D]&&S(D);this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new xn(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let p=0,d=n.count;p<d;p++)n.setXYZ(p,0,0,0);let s=new H,r=new H,a=new H,o=new H,l=new H,h=new H,u=new H,f=new H;if(t)for(let p=0,d=t.count;p<d;p+=3){let m=t.getX(p+0),x=t.getX(p+1),c=t.getX(p+2);s.fromBufferAttribute(e,m),r.fromBufferAttribute(e,x),a.fromBufferAttribute(e,c),u.subVectors(a,r),f.subVectors(s,r),u.cross(f),o.fromBufferAttribute(n,m),l.fromBufferAttribute(n,x),h.fromBufferAttribute(n,c),o.add(u),l.add(u),h.add(u),n.setXYZ(m,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(c,h.x,h.y,h.z)}else for(let p=0,d=e.count;p<d;p+=3)s.fromBufferAttribute(e,p+0),r.fromBufferAttribute(e,p+1),a.fromBufferAttribute(e,p+2),u.subVectors(a,r),f.subVectors(s,r),u.cross(f),n.setXYZ(p+0,u.x,u.y,u.z),n.setXYZ(p+1,u.x,u.y,u.z),n.setXYZ(p+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ve.fromBufferAttribute(t,e),Ve.normalize(),t.setXYZ(e,Ve.x,Ve.y,Ve.z)}toNonIndexed(){function t(o,l){let h=o.array,u=o.itemSize,f=o.normalized,p=new h.constructor(l.length*u),d=0,m=0;for(let x=0,c=l.length;x<c;x++){o.isInterleavedBufferAttribute?d=l[x]*o.data.stride+o.offset:d=l[x]*u;for(let g=0;g<u;g++)p[m++]=h[d++]}return new xn(p,u,f)}if(this.index===null)return Kt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],h=t(l,n);e.setAttribute(o,h)}let r=this.morphAttributes;for(let o in r){let l=[],h=r[o];for(let u=0,f=h.length;u<f;u++){let p=h[u],d=t(p,n);l.push(d)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let h=a[o];e.addGroup(h.start,h.count,h.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let h in l)l[h]!==void 0&&(t[h]=l[h]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let h=n[l];t.data.attributes[l]=h.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let h=this.morphAttributes[l],u=[];for(let f=0,p=h.length;f<p;f++){let d=h[f];u.push(d.toJSON(t.data))}u.length>0&&(s[l]=u,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let s=t.attributes;for(let h in s){let u=s[h];this.setAttribute(h,u.clone(e))}let r=t.morphAttributes;for(let h in r){let u=[],f=r[h];for(let p=0,d=f.length;p<d;p++)u.push(f[p].clone(e));this.morphAttributes[h]=u}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let h=0,u=a.length;h<u;h++){let f=a[h];this.addGroup(f.start,f.count,f.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Ul=new H,Kd=new H,Qd=new te,Nn=class{constructor(t=new H(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=Ul.subVectors(n,e).cross(Kd.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let s=t.delta(Ul),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let a=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(s,a)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||Qd.getNormalMatrix(t),s=this.coplanarPoint(Ul).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},jd=0,yi=class extends Gn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:jd++}),this.uuid=Ds(),this.name="",this.type="Material",this.blending=Ci,this.side=Wn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=sc,this.blendDst=rc,this.blendEquation=Zi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Yt(0,0,0),this.blendAlpha=0,this.depthFunc=ms,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=uu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ra,this.stencilZFail=Ra,this.stencilZPass=Ra,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){Kt(`Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Kt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(t).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(e){let r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Yt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.diffuseRoughness!==void 0&&(this.diffuseRoughness=t.diffuseRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessMinimum),t.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=t.iridescenceThicknessMaximum),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=t.iridescenceThicknessRange[1]),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new Nn().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new ft().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ft().fromArray(t.clearcoatNormalScale)),t.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=e[t.diffuseRoughnessMap]||null),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var jn=new H,Fl=new H,ua=new H,da=new H,ar=class{constructor(t=new H,e=new H(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,jn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=jn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(jn.copy(this.origin).addScaledVector(this.direction,e),jn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Fl.copy(t).add(e).multiplyScalar(.5),ua.copy(e).sub(t).normalize(),da.copy(this.origin).sub(Fl);let r=t.distanceTo(e)*.5,a=-this.direction.dot(ua),o=da.dot(this.direction),l=-da.dot(ua),h=da.lengthSq(),u=Math.abs(1-a*a),f,p,d,m;if(u>0)if(f=a*l-o,p=a*o-l,m=r*u,f>=0)if(p>=-m)if(p<=m){let x=1/u;f*=x,p*=x,d=f*(f+a*p+2*o)+p*(a*f+p+2*l)+h}else p=r,f=Math.max(0,-(a*p+o)),d=-f*f+p*(p+2*l)+h;else p=-r,f=Math.max(0,-(a*p+o)),d=-f*f+p*(p+2*l)+h;else p<=-m?(f=Math.max(0,-(-a*r+o)),p=f>0?-r:Math.min(Math.max(-r,-l),r),d=-f*f+p*(p+2*l)+h):p<=m?(f=0,p=Math.min(Math.max(-r,-l),r),d=p*(p+2*l)+h):(f=Math.max(0,-(a*r+o)),p=f>0?r:Math.min(Math.max(-r,-l),r),d=-f*f+p*(p+2*l)+h);else p=a>0?-r:r,f=Math.max(0,-(a*p+o)),d=-f*f+p*(p+2*l)+h;return n&&n.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(Fl).addScaledVector(ua,p),d}intersectSphere(t,e){if(t.radius<0)return null;jn.subVectors(t.center,this.origin);let n=jn.dot(this.direction),s=jn.dot(jn)-n*n,r=t.radius*t.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l,h=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,p=this.origin;return h>=0?(n=(t.min.x-p.x)*h,s=(t.max.x-p.x)*h):(n=(t.max.x-p.x)*h,s=(t.min.x-p.x)*h),u>=0?(r=(t.min.y-p.y)*u,a=(t.max.y-p.y)*u):(r=(t.max.y-p.y)*u,a=(t.min.y-p.y)*u),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),f>=0?(o=(t.min.z-p.z)*f,l=(t.max.z-p.z)*f):(o=(t.max.z-p.z)*f,l=(t.min.z-p.z)*f),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,jn)!==null}intersectTriangle(t,e,n,s,r){let a=this.origin,o=this.direction,l=o.x,h=o.y,u=o.z,f=t.x-a.x,p=t.y-a.y,d=t.z-a.z,m=e.x-a.x,x=e.y-a.y,c=e.z-a.z,g=n.x-a.x,_=n.y-a.y,M=n.z-a.z,v=Math.abs(l),R=Math.abs(h),w=Math.abs(u),y,S,D,L,U,z,G,N,q,Y,W,$;if(v>=R&&v>=w?(D=l,z=f,q=m,$=g,l>=0?(y=h,S=u,L=p,U=d,G=x,N=c,Y=_,W=M):(y=u,S=h,L=d,U=p,G=c,N=x,Y=M,W=_)):R>=w?(D=h,z=p,q=x,$=_,h>=0?(y=u,S=l,L=d,U=f,G=c,N=m,Y=M,W=g):(y=l,S=u,L=f,U=d,G=m,N=c,Y=g,W=M)):(D=u,z=d,q=c,$=M,u>=0?(y=l,S=h,L=f,U=p,G=m,N=x,Y=g,W=_):(y=h,S=l,L=p,U=f,G=x,N=m,Y=_,W=g)),D===0)return null;let X=y/D,j=S/D,it=1/D,vt=L-X*z,Bt=U-j*z,nt=G-X*q,Pt=N-j*q,zt=Y-X*$,Vt=W-j*$,Lt=zt*Pt-Vt*nt,Xt=vt*Vt-Bt*zt,Te=nt*Bt-Pt*vt;if(s){if(Lt<0||Xt<0||Te<0)return null}else if((Lt<0||Xt<0||Te<0)&&(Lt>0||Xt>0||Te>0))return null;let $t=Lt+Xt+Te;if($t===0)return null;let ie=it*(Lt*z+Xt*q+Te*$);return($t>0?ie<0:ie>0)?null:this.at(ie/$t,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},vi=class extends yi{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Yt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new sn,this.combine=ac,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},_h=new pe,Hi=new ar,fa=new _i,yh=new H,pa=new H,ma=new H,ga=new H,Ol=new H,xa=new H,vh=new H,_a=new H,pt=class extends rn{constructor(t=new De,e=new vi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(r&&o){xa.set(0,0,0);for(let l=0,h=r.length;l<h;l++){let u=o[l],f=r[l];u!==0&&(Ol.fromBufferAttribute(f,t),a?xa.addScaledVector(Ol,u):xa.addScaledVector(Ol.sub(e),u))}e.add(xa)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),fa.copy(n.boundingSphere),fa.applyMatrix4(r),Hi.copy(t.ray).recast(t.near),!(fa.containsPoint(Hi.origin)===!1&&(Hi.intersectSphere(fa,yh)===null||Hi.origin.distanceToSquared(yh)>(t.far-t.near)**2))&&(_h.copy(r).invert(),Hi.copy(t.ray).applyMatrix4(_h),!(n.boundingBox!==null&&Hi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Hi)))}_computeIntersections(t,e,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,h=r.attributes.uv,u=r.attributes.uv1,f=r.attributes.normal,p=r.groups,d=r.drawRange;if(o!==null)if(Array.isArray(a))for(let m=0,x=p.length;m<x;m++){let c=p[m],g=a[c.materialIndex],_=Math.max(c.start,d.start),M=Math.min(o.count,Math.min(c.start+c.count,d.start+d.count));for(let v=_,R=M;v<R;v+=3){let w=o.getX(v),y=o.getX(v+1),S=o.getX(v+2);s=ya(this,g,t,n,h,u,f,w,y,S),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=c.materialIndex,e.push(s))}}else{let m=Math.max(0,d.start),x=Math.min(o.count,d.start+d.count);for(let c=m,g=x;c<g;c+=3){let _=o.getX(c),M=o.getX(c+1),v=o.getX(c+2);s=ya(this,a,t,n,h,u,f,_,M,v),s&&(s.faceIndex=Math.floor(c/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let m=0,x=p.length;m<x;m++){let c=p[m],g=a[c.materialIndex],_=Math.max(c.start,d.start),M=Math.min(l.count,Math.min(c.start+c.count,d.start+d.count));for(let v=_,R=M;v<R;v+=3){let w=v,y=v+1,S=v+2;s=ya(this,g,t,n,h,u,f,w,y,S),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=c.materialIndex,e.push(s))}}else{let m=Math.max(0,d.start),x=Math.min(l.count,d.start+d.count);for(let c=m,g=x;c<g;c+=3){let _=c,M=c+1,v=c+2;s=ya(this,a,t,n,h,u,f,_,M,v),s&&(s.faceIndex=Math.floor(c/3),e.push(s))}}}};function tf(i,t,e,n,s,r,a,o){let l;if(t.side===un?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===Wn,o),l===null)return null;_a.copy(o),_a.applyMatrix4(i.matrixWorld);let h=e.ray.origin.distanceTo(_a);return h<e.near||h>e.far?null:{distance:h,point:_a.clone(),object:i}}function ya(i,t,e,n,s,r,a,o,l,h){i.getVertexPosition(o,pa),i.getVertexPosition(l,ma),i.getVertexPosition(h,ga);let u=tf(i,t,e,n,pa,ma,ga,vh);if(u){let f=new H;xi.getBarycoord(vh,pa,ma,ga,f),s&&(u.uv=xi.getInterpolatedAttribute(s,o,l,h,f,new ft)),r&&(u.uv1=xi.getInterpolatedAttribute(r,o,l,h,f,new ft)),a&&(u.normal=xi.getInterpolatedAttribute(a,o,l,h,f,new H),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));let p={a:o,b:l,c:h,normal:new H,materialIndex:0};xi.getNormal(pa,ma,ga,p.normal),u.face=p,u.barycoord=f}return u}var or=class extends hn{constructor(t=null,e=1,n=1,s,r,a,o,l,h=We,u=We,f,p){super(null,a,o,l,h,u,s,r,f,p),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Mi=class extends xn{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},hs=new pe,Mh=new pe,va=[],Sh=new Vn,ef=new pe,Xs=new pt,qs=new _i,Si=class extends pt{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Mi(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,ef)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Vn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,hs),Sh.copy(t.boundingBox).applyMatrix4(hs),this.boundingBox.union(Sh)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new _i),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,hs),qs.copy(t.boundingSphere).applyMatrix4(hs),this.boundingSphere.union(qs)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),this.morphTexture=t.morphTexture!==null?t.morphTexture.clone():null,this.instanceColor=t.instanceColor!==null?t.instanceColor.clone():null,this.count=t.count,this.boundingBox=t.boundingBox!==null?t.boundingBox.clone():null,this.boundingSphere=t.boundingSphere!==null?t.boundingSphere.clone():null,this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(t,e){let n=this.matrixWorld,s=this.count;if(Xs.geometry=this.geometry,Xs.material=this.material,Xs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),qs.copy(this.boundingSphere),qs.applyMatrix4(n),t.ray.intersectsSphere(qs)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,hs),Mh.multiplyMatrices(n,hs),Xs.matrixWorld=Mh,Xs.raycast(t,va);for(let a=0,o=va.length;a<o;a++){let l=va[a];l.instanceId=r,l.object=this,e.push(l)}va.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new Mi(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){let n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new or(new Float32Array(s*this.count),s,this.count,go,An));let r=this.morphTexture.source.data.data,a=0;for(let h=0;h<n.length;h++)a+=n[h];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*t;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Gi=new _i,nf=new ft(.5,.5),Ma=new H,bi=class{constructor(t=new Nn,e=new Nn,n=new Nn,s=new Nn,r=new Nn,a=new Nn){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Tn,n=!1){let s=this.planes,r=t.elements,a=r[0],o=r[1],l=r[2],h=r[3],u=r[4],f=r[5],p=r[6],d=r[7],m=r[8],x=r[9],c=r[10],g=r[11],_=r[12],M=r[13],v=r[14],R=r[15];if(s[0].setComponents(h-a,d-u,g-m,R-_).normalize(),s[1].setComponents(h+a,d+u,g+m,R+_).normalize(),s[2].setComponents(h+o,d+f,g+x,R+M).normalize(),s[3].setComponents(h-o,d-f,g-x,R-M).normalize(),n)s[4].setComponents(l,p,c,v).normalize(),s[5].setComponents(h-l,d-p,g-c,R-v).normalize();else if(s[4].setComponents(h-l,d-p,g-c,R-v).normalize(),e===Tn)s[5].setComponents(h+l,d+p,g+c,R+v).normalize();else if(e===xs)s[5].setComponents(l,p,c,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Gi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Gi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Gi)}intersectsSprite(t){Gi.center.set(0,0,0);let e=nf.distanceTo(t.center);return Gi.radius=.7071067811865476+e,Gi.applyMatrix4(t.matrixWorld),this.intersectsSphere(Gi)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(Ma.x=s.normal.x>0?t.max.x:t.min.x,Ma.y=s.normal.y>0?t.max.y:t.min.y,Ma.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Ma)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},bh=new pe,Ga=class i{constructor(){this.coordinateSystem=Tn,this._frustums=[],this._count=0}setFromArrayCamera(t){let e=t.cameras,n=this._frustums;for(let s=0;s<e.length;s++){let r=e[s];bh.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[s]===void 0&&(n[s]=new bi),n[s].setFromProjectionMatrix(bh,r.coordinateSystem,r.reversedDepth)}return this._count=e.length,this}getFrustum(t){return this._frustums[t]}intersectsObject(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsObject(t))return!0;return!1}intersectsSprite(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsSprite(t))return!0;return!1}intersectsSphere(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsSphere(t))return!0;return!1}intersectsBox(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsBox(t))return!0;return!1}containsPoint(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].containsPoint(t))return!0;return!1}copy(t){this.coordinateSystem=t.coordinateSystem;let e=this._frustums,n=t._frustums;for(let s=0;s<t._count;s++)e[s]===void 0&&(e[s]=new bi),e[s].copy(n[s]);return this._count=t._count,this}clone(){return new i().copy(this)}};var lr=class extends hn{constructor(t=[],e=$i,n,s,r,a,o,l,h,u){super(t,e,n,s,r,a,o,l,h,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},Ss=class extends hn{constructor(t,e,n,s,r,a,o,l,h){super(t,e,n,s,r,a,o,l,h),this.isCanvasTexture=!0,this.needsUpdate=!0}};var ni=class extends hn{constructor(t,e,n=Fn,s,r,a,o=We,l=We,h,u=ei,f=1){if(u!==ei&&u!==ai)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let p={width:t,height:e,depth:f};super(p,s,r,a,o,l,u,n,h),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new ys(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}},cr=class extends ni{constructor(t,e=Fn,n=$i,s,r,a=We,o=We,l,h=ei){let u={width:t,height:t,depth:1},f=[u,u,u,u,u,u];super(t,t,e,n,s,r,a,o,l,h),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},hr=class extends hn{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},Ti=class i extends De{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],h=[],u=[],f=[],p=0,d=0;m("z","y","x",-1,-1,n,e,t,a,r,0),m("z","y","x",1,-1,n,e,-t,a,r,1),m("x","z","y",1,1,t,n,e,s,a,2),m("x","z","y",1,-1,t,n,-e,s,a,3),m("x","y","z",1,-1,t,e,n,s,r,4),m("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new he(h,3)),this.setAttribute("normal",new he(u,3)),this.setAttribute("uv",new he(f,2));function m(x,c,g,_,M,v,R,w,y,S,D){let L=v/y,U=R/S,z=v/2,G=R/2,N=w/2,q=y+1,Y=S+1,W=0,$=0,X=new H;for(let j=0;j<Y;j++){let it=j*U-G;for(let vt=0;vt<q;vt++){let Bt=vt*L-z;X[x]=Bt*_,X[c]=it*M,X[g]=N,h.push(X.x,X.y,X.z),X[x]=0,X[c]=0,X[g]=w>0?1:-1,u.push(X.x,X.y,X.z),f.push(vt/y),f.push(1-j/S),W+=1}}for(let j=0;j<S;j++)for(let it=0;it<y;it++){let vt=p+it+q*j,Bt=p+it+q*(j+1),nt=p+(it+1)+q*(j+1),Pt=p+(it+1)+q*j;l.push(vt,Bt,Pt),l.push(Bt,nt,Pt),$+=6}o.addGroup(d,$,D),d+=$,p+=W}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},ur=class i extends De{constructor(t=1,e=1,n=4,s=8,r=1){super(),this.type="CapsuleGeometry",this.parameters={radius:t,height:e,capSegments:n,radialSegments:s,heightSegments:r},e=Math.max(0,e),n=Math.max(1,Math.floor(n)),s=Math.max(3,Math.floor(s)),r=Math.max(1,Math.floor(r));let a=[],o=[],l=[],h=[],u=e/2,f=Math.PI/2*t,p=e,d=2*f+p,m=n*2+r,x=s+1,c=new H,g=new H;for(let _=0;_<=m;_++){let M=0,v=0,R=0,w=0;if(_<=n){let D=_/n,L=D*Math.PI/2;v=-u-t*Math.cos(L),R=t*Math.sin(L),w=-t*Math.cos(L),M=D*f}else if(_<=n+r){let D=(_-n)/r;v=-u+D*e,R=t,w=0,M=f+D*p}else{let D=(_-n-r)/n,L=D*Math.PI/2;v=u+t*Math.sin(L),R=t*Math.cos(L),w=t*Math.sin(L),M=f+p+D*f}let y=Math.max(0,Math.min(1,M/d)),S=0;_===0?S=.5/s:_===m&&(S=-.5/s);for(let D=0;D<=s;D++){let L=D/s,U=L*Math.PI*2,z=Math.sin(U),G=Math.cos(U);g.x=-R*G,g.y=v,g.z=R*z,o.push(g.x,g.y,g.z),c.set(-R*G,w,R*z),c.normalize(),l.push(c.x,c.y,c.z),h.push(L+S,y)}if(_>0){let D=(_-1)*x;for(let L=0;L<s;L++){let U=D+L,z=D+L+1,G=_*x+L,N=_*x+L+1;a.push(U,z,G),a.push(z,N,G)}}}this.setIndex(a),this.setAttribute("position",new he(o,3)),this.setAttribute("normal",new he(l,3)),this.setAttribute("uv",new he(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.height,t.capSegments,t.radialSegments,t.heightSegments)}};var ii=class i extends De{constructor(t=1,e=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let h=this;s=Math.floor(s),r=Math.floor(r);let u=[],f=[],p=[],d=[],m=0,x=[],c=n/2,g=0;_(),a===!1&&(t>0&&M(!0),e>0&&M(!1)),this.setIndex(u),this.setAttribute("position",new he(f,3)),this.setAttribute("normal",new he(p,3)),this.setAttribute("uv",new he(d,2));function _(){let v=new H,R=new H,w=0,y=(e-t)/n;for(let S=0;S<=r;S++){let D=[],L=S/r,U=L*(e-t)+t;for(let z=0;z<=s;z++){let G=z/s,N=G*l+o,q=Math.sin(N),Y=Math.cos(N);R.x=U*q,R.y=-L*n+c,R.z=U*Y,f.push(R.x,R.y,R.z),v.set(q,y,Y).normalize(),p.push(v.x,v.y,v.z),d.push(G,1-L),D.push(m++)}x.push(D)}for(let S=0;S<s;S++)for(let D=0;D<r;D++){let L=x[D][S],U=x[D+1][S],z=x[D+1][S+1],G=x[D][S+1];(t>0||D!==0)&&(u.push(L,U,G),w+=3),(e>0||D!==r-1)&&(u.push(U,z,G),w+=3)}h.addGroup(g,w,0),g+=w}function M(v){let R=m,w=new ft,y=new H,S=0,D=v===!0?t:e,L=v===!0?1:-1;for(let z=1;z<=s;z++)f.push(0,c*L,0),p.push(0,L,0),d.push(.5,.5),m++;let U=m;for(let z=0;z<=s;z++){let N=z/s*l+o,q=Math.cos(N),Y=Math.sin(N);y.x=D*Y,y.y=c*L,y.z=D*q,f.push(y.x,y.y,y.z),p.push(0,L,0),w.x=q*.5+.5,w.y=Y*.5*L+.5,d.push(w.x,w.y),m++}for(let z=0;z<s;z++){let G=R+z,N=U+z;v===!0?u.push(N,N+1,G):u.push(N+1,N,G),S+=3}h.addGroup(g,S,v===!0?1:2),g+=S}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},dr=class i extends ii{constructor(t=1,e=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new i(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},fr=class i extends De{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};let r=[],a=[];o(s),h(n),u(),this.setAttribute("position",new he(r,3)),this.setAttribute("normal",new he(r.slice(),3)),this.setAttribute("uv",new he(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(_){let M=new H,v=new H,R=new H;for(let w=0;w<e.length;w+=3)d(e[w+0],M),d(e[w+1],v),d(e[w+2],R),l(M,v,R,_)}function l(_,M,v,R){let w=R+1,y=[];for(let S=0;S<=w;S++){y[S]=[];let D=_.clone().lerp(v,S/w),L=M.clone().lerp(v,S/w),U=w-S;for(let z=0;z<=U;z++)z===0&&S===w?y[S][z]=D:y[S][z]=D.clone().lerp(L,z/U)}for(let S=0;S<w;S++)for(let D=0;D<2*(w-S)-1;D++){let L=Math.floor(D/2);D%2===0?(p(y[S][L+1]),p(y[S+1][L]),p(y[S][L])):(p(y[S][L+1]),p(y[S+1][L+1]),p(y[S+1][L]))}}function h(_){let M=new H;for(let v=0;v<r.length;v+=3)M.x=r[v+0],M.y=r[v+1],M.z=r[v+2],M.normalize().multiplyScalar(_),r[v+0]=M.x,r[v+1]=M.y,r[v+2]=M.z}function u(){let _=new H;for(let M=0;M<r.length;M+=3){_.x=r[M+0],_.y=r[M+1],_.z=r[M+2];let v=c(_)/2/Math.PI+.5,R=g(_)/Math.PI+.5;a.push(v,1-R)}m(),f()}function f(){for(let _=0;_<a.length;_+=6){let M=a[_+0],v=a[_+2],R=a[_+4],w=Math.max(M,v,R),y=Math.min(M,v,R);w>.9&&y<.1&&(M<.2&&(a[_+0]+=1),v<.2&&(a[_+2]+=1),R<.2&&(a[_+4]+=1))}}function p(_){r.push(_.x,_.y,_.z)}function d(_,M){let v=_*3;M.x=t[v+0],M.y=t[v+1],M.z=t[v+2]}function m(){let _=new H,M=new H,v=new H,R=new H,w=new ft,y=new ft,S=new ft;for(let D=0,L=0;D<r.length;D+=9,L+=6){_.set(r[D+0],r[D+1],r[D+2]),M.set(r[D+3],r[D+4],r[D+5]),v.set(r[D+6],r[D+7],r[D+8]),w.set(a[L+0],a[L+1]),y.set(a[L+2],a[L+3]),S.set(a[L+4],a[L+5]),R.copy(_).add(M).add(v).divideScalar(3);let U=c(R);x(w,L+0,_,U),x(y,L+2,M,U),x(S,L+4,v,U)}}function x(_,M,v,R){R<0&&_.x===1&&(a[M]=_.x-1),v.x===0&&v.z===0&&(a[M]=R/2/Math.PI+.5)}function c(_){return Math.atan2(_.z,-_.x)}function g(_){return Math.atan2(-_.y,Math.sqrt(_.x*_.x+_.z*_.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.vertices,t.indices,t.radius,t.detail)}};var _n=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Kt("Curve: .getPoint() not implemented.")}getPointAt(t,e){let n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let e=[],n,s=this.getPoint(0),r=0;e.push(0);for(let a=1;a<=t;a++)n=this.getPoint(a/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e=null){let n=this.getLengths(),s=0,r=n.length,a;e?a=e:a=t*n[r-1];let o=0,l=r-1,h;for(;o<=l;)if(s=Math.floor(o+(l-o)/2),h=n[s]-a,h<0)o=s+1;else if(h>0)l=s-1;else{l=s;break}if(s=l,n[s]===a)return s/(r-1);let u=n[s],p=n[s+1]-u,d=(a-u)/p;return(s+d)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);let a=this.getPoint(s),o=this.getPoint(r),l=e||(a.isVector2?new ft:new H);return l.copy(o).sub(a).normalize(),l}getTangentAt(t,e){let n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e=!1){let n=new H,s=[],r=[],a=[],o=new H,l=new pe;for(let d=0;d<=t;d++){let m=d/t;s[d]=this.getTangentAt(m,new H)}r[0]=new H,a[0]=new H;let h=Number.MAX_VALUE,u=Math.abs(s[0].x),f=Math.abs(s[0].y),p=Math.abs(s[0].z);u<=h&&(h=u,n.set(1,0,0)),f<=h&&(h=f,n.set(0,1,0)),p<=h&&n.set(0,0,1),o.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let d=1;d<=t;d++){if(r[d]=r[d-1].clone(),a[d]=a[d-1].clone(),o.crossVectors(s[d-1],s[d]),o.length()>Number.EPSILON){o.normalize();let m=Math.acos(de(s[d-1].dot(s[d]),-1,1));r[d].applyMatrix4(l.makeRotationAxis(o,m))}a[d].crossVectors(s[d],r[d])}if(e===!0){let d=Math.acos(de(r[0].dot(r[t]),-1,1));d/=t,s[0].dot(o.crossVectors(r[0],r[t]))>0&&(d=-d);for(let m=1;m<=t;m++)r[m].applyMatrix4(l.makeRotationAxis(s[m],d*m)),a[m].crossVectors(s[m],r[m])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this.cacheArcLengths=null,this}toJSON(){let t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this.cacheArcLengths=null,this}},bs=class extends _n{constructor(t=0,e=0,n=1,s=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(t,e=new ft){let n=e,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);let o=this.aStartAngle+t*r,l=this.aX+this.xRadius*Math.cos(o),h=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let u=Math.cos(this.aRotation),f=Math.sin(this.aRotation),p=l-this.aX,d=h-this.aY;l=p*u-d*f+this.aX,h=p*f+d*u+this.aY}return n.set(l,h)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){let t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}},Va=class extends bs{constructor(t,e,n,s,r,a){super(t,e,n,n,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}};function Mc(){let i=0,t=0,e=0,n=0;function s(r,a,o,l){i=r,t=o,e=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,h){s(a,o,h*(o-r),h*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,h,u,f){let p=(a-r)/h-(o-r)/(h+u)+(o-a)/u,d=(o-a)/u-(l-a)/(u+f)+(l-o)/f;p*=u,d*=u,s(a,o,p,d)},calc:function(r){let a=r*r,o=a*r;return i+t*r+e*a+n*o}}}var Th=new H,Eh=new H,Bl=new Mc,zl=new Mc,kl=new Mc,Wa=class extends _n{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new H){let n=e,s=this.points,r=s.length,a=(r-(this.closed?0:1))*t,o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let h,u;this.closed||o>0?h=s[(o-1)%r]:(Eh.subVectors(s[0],s[1]).add(s[0]),h=Eh);let f=s[o%r],p=s[(o+1)%r];if(this.closed||o+2<r?u=s[(o+2)%r]:(Th.subVectors(s[r-1],s[r-2]).add(s[r-1]),u=Th),this.curveType==="centripetal"||this.curveType==="chordal"){let d=this.curveType==="chordal"?.5:.25,m=Math.pow(h.distanceToSquared(f),d),x=Math.pow(f.distanceToSquared(p),d),c=Math.pow(p.distanceToSquared(u),d);x<1e-4&&(x=1),m<1e-4&&(m=x),c<1e-4&&(c=x),Bl.initNonuniformCatmullRom(h.x,f.x,p.x,u.x,m,x,c),zl.initNonuniformCatmullRom(h.y,f.y,p.y,u.y,m,x,c),kl.initNonuniformCatmullRom(h.z,f.z,p.z,u.z,m,x,c)}else this.curveType==="catmullrom"&&(Bl.initCatmullRom(h.x,f.x,p.x,u.x,this.tension),zl.initCatmullRom(h.y,f.y,p.y,u.y,this.tension),kl.initCatmullRom(h.z,f.z,p.z,u.z,this.tension));return n.set(Bl.calc(l),zl.calc(l),kl.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(new H().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}};function wh(i,t,e,n,s){let r=(n-t)*.5,a=(s-e)*.5,o=i*i,l=i*o;return(2*e-2*n+r+a)*l+(-3*e+3*n-2*r-a)*o+r*i+e}function sf(i,t){let e=1-i;return e*e*t}function rf(i,t){return 2*(1-i)*i*t}function af(i,t){return i*i*t}function Js(i,t,e,n){return sf(i,t)+rf(i,e)+af(i,n)}function of(i,t){let e=1-i;return e*e*e*t}function lf(i,t){let e=1-i;return 3*e*e*i*t}function cf(i,t){return 3*(1-i)*i*i*t}function hf(i,t){return i*i*i*t}function $s(i,t,e,n,s){return of(i,t)+lf(i,e)+cf(i,n)+hf(i,s)}var pr=class extends _n{constructor(t=new ft,e=new ft,n=new ft,s=new ft){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new ft){let n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set($s(t,s.x,r.x,a.x,o.x),$s(t,s.y,r.y,a.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},Xa=class extends _n{constructor(t=new H,e=new H,n=new H,s=new H){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new H){let n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set($s(t,s.x,r.x,a.x,o.x),$s(t,s.y,r.y,a.y,o.y),$s(t,s.z,r.z,a.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},mr=class extends _n{constructor(t=new ft,e=new ft){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new ft){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new ft){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},qa=class extends _n{constructor(t=new H,e=new H){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new H){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new H){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},gr=class extends _n{constructor(t=new ft,e=new ft,n=new ft){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new ft){let n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(Js(t,s.x,r.x,a.x),Js(t,s.y,r.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Ya=class extends _n{constructor(t=new H,e=new H,n=new H){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new H){let n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(Js(t,s.x,r.x,a.x),Js(t,s.y,r.y,a.y),Js(t,s.z,r.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},xr=class extends _n{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new ft){let n=e,s=this.points,r=(s.length-1)*t,a=Math.floor(r),o=r-a,l=s[a===0?a:a-1],h=s[a],u=s[a>s.length-2?s.length-1:a+1],f=s[a>s.length-3?s.length-1:a+2];return n.set(wh(o,l.x,h.x,u.x,f.x),wh(o,l.y,h.y,u.y,f.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(new ft().fromArray(s))}return this}},ql=Object.freeze({__proto__:null,ArcCurve:Va,CatmullRomCurve3:Wa,CubicBezierCurve:pr,CubicBezierCurve3:Xa,EllipseCurve:bs,LineCurve:mr,LineCurve3:qa,QuadraticBezierCurve:gr,QuadraticBezierCurve3:Ya,SplineCurve:xr}),Za=class extends _n{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1,this.cacheLengths=null}add(t){this.curves.push(t)}closePath(){let t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){let n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new ql[n](e,t))}return this}getPoint(t,e){let n=t*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=n){let a=s[r]-n,o=this.curves[r],l=o.getLength(),h=l===0?0:1-a/l;return o.getPointAt(h,e)}r++}return null}getLength(){let t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let t=[],e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){let e=[],n;for(let s=0,r=this.curves;s<r.length;s++){let a=r[s],o=a.isEllipseCurve?t*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?t*a.points.length:t,l=a.getPoints(o);for(let h=0;h<l.length;h++){let u=l[h];n&&n.equals(u)||(e.push(u),n=u)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){let s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this.cacheLengths=null,this}toJSON(){let t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){let s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){let s=t.curves[e];this.curves.push(new ql[s.type]().fromJSON(s))}return this.cacheLengths=null,this}},_r=class extends Za{constructor(t){super(),this.type="Path",this.currentPoint=new ft,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){let n=new mr(this.currentPoint.clone(),new ft(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,s){let r=new gr(this.currentPoint.clone(),new ft(t,e),new ft(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(t,e,n,s,r,a){let o=new pr(this.currentPoint.clone(),new ft(t,e),new ft(n,s),new ft(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(t){let e=[this.currentPoint.clone()].concat(t),n=new xr(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,s,r,a){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+o,e+l,n,s,r,a),this}absarc(t,e,n,s,r,a){return this.absellipse(t,e,n,n,s,r,a),this}ellipse(t,e,n,s,r,a,o,l){let h=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(t+h,e+u,n,s,r,a,o,l),this}absellipse(t,e,n,s,r,a,o,l){let h=new bs(t,e,n,s,r,a,o,l);if(this.curves.length>0){let f=h.getPoint(0);f.equals(this.currentPoint)||this.lineTo(f.x,f.y)}this.curves.push(h);let u=h.getPoint(1);return this.currentPoint.copy(u),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){let t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}},Ei=class extends _r{constructor(t){super(t),this.uuid=Ds(),this.type="Shape",this.holes=[]}getPointsHoles(t){let e=[];for(let n=0,s=this.holes.length;n<s;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){let s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){let s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){let s=t.holes[e];this.holes.push(new _r().fromJSON(s))}return this}};function uf(i,t,e=2){let n=t&&t.length,s=n?t[0]*e:i.length,r=Tu(i,0,s,e,!0),a=[];if(!r||r.next===r.prev)return a;let o,l,h;if(n&&(r=gf(i,t,r,e)),i.length>80*e){o=i[0],l=i[1];let u=o,f=l;for(let p=e;p<s;p+=e){let d=i[p],m=i[p+1];d<o&&(o=d),m<l&&(l=m),d>u&&(u=d),m>f&&(f=m)}h=Math.max(u-o,f-l),h=h!==0?32767/h:0}return yr(r,a,e,o,l,h,0),a}function Tu(i,t,e,n,s){let r;if(s===Af(i,t,e,n)>0)for(let a=t;a<e;a+=n)r=Ah(a/n|0,i[a],i[a+1],r);else for(let a=e-n;a>=t;a-=n)r=Ah(a/n|0,i[a],i[a+1],r);return r&&Ts(r,r.next)&&(Mr(r),r=r.next),r}function Vi(i,t){if(!i)return i;t||(t=i);let e=i,n;do if(n=!1,!e.steiner&&(Ts(e,e.next)||Pe(e.prev,e,e.next)===0)){if(Mr(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function yr(i,t,e,n,s,r,a){if(!i)return;!a&&r&&Mf(i,n,s,r);let o=i;for(;i.prev!==i.next;){let l=i.prev,h=i.next;if(r?ff(i,n,s,r):df(i)){t.push(l.i,i.i,h.i),Mr(i),i=h.next,o=h.next;continue}if(i=h,i===o){a?a===1?(i=pf(Vi(i),t),yr(i,t,e,n,s,r,2)):a===2&&mf(i,t,e,n,s,r):yr(Vi(i),t,e,n,s,r,1);break}}}function df(i){let t=i.prev,e=i,n=i.next;if(Pe(t,e,n)>=0)return!1;let s=t.x,r=e.x,a=n.x,o=t.y,l=e.y,h=n.y,u=Math.min(s,r,a),f=Math.min(o,l,h),p=Math.max(s,r,a),d=Math.max(o,l,h),m=n.next;for(;m!==t;){if(m.x>=u&&m.x<=p&&m.y>=f&&m.y<=d&&Ys(s,o,r,l,a,h,m.x,m.y)&&Pe(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function ff(i,t,e,n){let s=i.prev,r=i,a=i.next;if(Pe(s,r,a)>=0)return!1;let o=s.x,l=r.x,h=a.x,u=s.y,f=r.y,p=a.y,d=Math.min(o,l,h),m=Math.min(u,f,p),x=Math.max(o,l,h),c=Math.max(u,f,p),g=Yl(d,m,t,e,n),_=Yl(x,c,t,e,n),M=i.prevZ,v=i.nextZ;for(;M&&M.z>=g&&v&&v.z<=_;){if(M.x>=d&&M.x<=x&&M.y>=m&&M.y<=c&&M!==s&&M!==a&&Ys(o,u,l,f,h,p,M.x,M.y)&&Pe(M.prev,M,M.next)>=0||(M=M.prevZ,v.x>=d&&v.x<=x&&v.y>=m&&v.y<=c&&v!==s&&v!==a&&Ys(o,u,l,f,h,p,v.x,v.y)&&Pe(v.prev,v,v.next)>=0))return!1;v=v.nextZ}for(;M&&M.z>=g;){if(M.x>=d&&M.x<=x&&M.y>=m&&M.y<=c&&M!==s&&M!==a&&Ys(o,u,l,f,h,p,M.x,M.y)&&Pe(M.prev,M,M.next)>=0)return!1;M=M.prevZ}for(;v&&v.z<=_;){if(v.x>=d&&v.x<=x&&v.y>=m&&v.y<=c&&v!==s&&v!==a&&Ys(o,u,l,f,h,p,v.x,v.y)&&Pe(v.prev,v,v.next)>=0)return!1;v=v.nextZ}return!0}function pf(i,t){let e=i;do{let n=e.prev,s=e.next.next;!Ts(n,s)&&wu(n,e,e.next,s)&&vr(n,s)&&vr(s,n)&&(t.push(n.i,e.i,s.i),Mr(e),Mr(e.next),e=i=s),e=e.next}while(e!==i);return Vi(e)}function mf(i,t,e,n,s,r){let a=i;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Tf(a,o)){let l=Au(a,o);a=Vi(a,a.next),l=Vi(l,l.next),yr(a,t,e,n,s,r,0),yr(l,t,e,n,s,r,0);return}o=o.next}a=a.next}while(a!==i)}function gf(i,t,e,n){let s=[];for(let r=0,a=t.length;r<a;r++){let o=t[r]*n,l=r<a-1?t[r+1]*n:i.length,h=Tu(i,o,l,n,!1);h===h.next&&(h.steiner=!0),s.push(bf(h))}s.sort(xf);for(let r=0;r<s.length;r++)e=_f(s[r],e);return e}function xf(i,t){let e=i.x-t.x;if(e===0&&(e=i.y-t.y,e===0)){let n=(i.next.y-i.y)/(i.next.x-i.x),s=(t.next.y-t.y)/(t.next.x-t.x);e=n-s}return e}function _f(i,t){let e=yf(i,t);if(!e)return t;let n=Au(e,i);return Vi(n,n.next),Vi(e,e.next)}function yf(i,t){let e=t,n=i.x,s=i.y,r=-1/0,a;if(Ts(i,e))return e;do{if(Ts(i,e.next))return e.next;if(s<=e.y&&s>=e.next.y&&e.next.y!==e.y){let f=e.x+(s-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(f<=n&&f>r&&(r=f,a=e.x<e.next.x?e:e.next,f===n))return a}e=e.next}while(e!==t);if(!a)return null;let o=a,l=a.x,h=a.y,u=1/0;e=a;do{if(n>=e.x&&e.x>=l&&n!==e.x&&Eu(s<h?n:r,s,l,h,s<h?r:n,s,e.x,e.y)){let f=Math.abs(s-e.y)/(n-e.x);vr(e,i)&&(f<u||f===u&&(e.x>a.x||e.x===a.x&&vf(a,e)))&&(a=e,u=f)}e=e.next}while(e!==o);return a}function vf(i,t){return Pe(i.prev,i,t.prev)<0&&Pe(t.next,i,i.next)<0}function Mf(i,t,e,n){let s=i;do s.z===0&&(s.z=Yl(s.x,s.y,t,e,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,Sf(s)}function Sf(i){let t,e=1;do{let n=i,s;i=null;let r=null;for(t=0;n;){t++;let a=n,o=0;for(let h=0;h<e&&(o++,a=a.nextZ,!!a);h++);let l=e;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||n.z<=a.z)?(s=n,n=n.nextZ,o--):(s=a,a=a.nextZ,l--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;n=a}r.nextZ=null,e*=2}while(t>1);return i}function Yl(i,t,e,n,s){return i=(i-e)*s|0,t=(t-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,i|t<<1}function bf(i){let t=i,e=i;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==i);return e}function Eu(i,t,e,n,s,r,a,o){return(s-a)*(t-o)>=(i-a)*(r-o)&&(i-a)*(n-o)>=(e-a)*(t-o)&&(e-a)*(r-o)>=(s-a)*(n-o)}function Ys(i,t,e,n,s,r,a,o){return!(i===a&&t===o)&&Eu(i,t,e,n,s,r,a,o)}function Tf(i,t){return i.next.i!==t.i&&i.prev.i!==t.i&&!Ef(i,t)&&(vr(i,t)&&vr(t,i)&&wf(i,t)&&(Pe(i.prev,i,t.prev)||Pe(i,t.prev,t))||Ts(i,t)&&Pe(i.prev,i,i.next)>0&&Pe(t.prev,t,t.next)>0)}function Pe(i,t,e){return(t.y-i.y)*(e.x-t.x)-(t.x-i.x)*(e.y-t.y)}function Ts(i,t){return i.x===t.x&&i.y===t.y}function wu(i,t,e,n){let s=ba(Pe(i,t,e)),r=ba(Pe(i,t,n)),a=ba(Pe(e,n,i)),o=ba(Pe(e,n,t));return!!(s!==r&&a!==o||s===0&&Sa(i,e,t)||r===0&&Sa(i,n,t)||a===0&&Sa(e,i,n)||o===0&&Sa(e,t,n))}function Sa(i,t,e){return t.x<=Math.max(i.x,e.x)&&t.x>=Math.min(i.x,e.x)&&t.y<=Math.max(i.y,e.y)&&t.y>=Math.min(i.y,e.y)}function ba(i){return i>0?1:i<0?-1:0}function Ef(i,t){let e=i;do{if(e.i!==i.i&&e.next.i!==i.i&&e.i!==t.i&&e.next.i!==t.i&&wu(e,e.next,i,t))return!0;e=e.next}while(e!==i);return!1}function vr(i,t){return Pe(i.prev,i,i.next)<0?Pe(i,t,i.next)>=0&&Pe(i,i.prev,t)>=0:Pe(i,t,i.prev)<0||Pe(i,i.next,t)<0}function wf(i,t){let e=i,n=!1,s=(i.x+t.x)/2,r=(i.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==i);return n}function Au(i,t){let e=Zl(i.i,i.x,i.y),n=Zl(t.i,t.x,t.y),s=i.next,r=t.prev;return i.next=t,t.prev=i,e.next=s,s.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function Ah(i,t,e,n){let s=Zl(i,t,e);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function Mr(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function Zl(i,t,e){return{i,x:t,y:e,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Af(i,t,e,n){let s=0;for(let r=t,a=e-n;r<e;r+=n)s+=(i[a]-i[r])*(i[r+1]+i[a+1]),a=r;return s}var Jl=class{static triangulate(t,e,n=2){return uf(t,e,n)}},Hn=class i{static area(t){let e=t.length,n=0;for(let s=e-1,r=0;r<e;s=r++)n+=t[s].x*t[r].y-t[r].x*t[s].y;return n*.5}static isClockWise(t){return i.area(t)<0}static triangulateShape(t,e){let n=[],s=[],r=[];Rh(t),Ch(n,t);let a=t.length;e.forEach(Rh);for(let l=0;l<e.length;l++)s.push(a),a+=e[l].length,Ch(n,e[l]);let o=Jl.triangulate(n,s);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}};function Rh(i){let t=i.length;t>2&&i[t-1].equals(i[0])&&i.pop()}function Ch(i,t){for(let e=0;e<t.length;e++)i.push(t[e].x),i.push(t[e].y)}var Sr=class i extends De{constructor(t=new Ei([new ft(.5,.5),new ft(-.5,.5),new ft(-.5,-.5),new ft(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];let n=this,s=[],r=[];for(let o=0,l=t.length;o<l;o++){let h=t[o];a(h)}this.setAttribute("position",new he(s,3)),this.setAttribute("uv",new he(r,2)),this.computeVertexNormals();function a(o){let l=[],h=e.curveSegments!==void 0?e.curveSegments:12,u=e.steps!==void 0?e.steps:1,f=e.depth!==void 0?e.depth:1,p=e.bevelEnabled!==void 0?e.bevelEnabled:!0,d=e.bevelThickness!==void 0?e.bevelThickness:.2,m=e.bevelSize!==void 0?e.bevelSize:d-.1,x=e.bevelOffset!==void 0?e.bevelOffset:0,c=e.bevelSegments!==void 0?e.bevelSegments:3,g=e.extrudePath,_=e.UVGenerator!==void 0?e.UVGenerator:Rf,M,v=!1,R,w,y,S;if(g){M=g.getSpacedPoints(u),v=!0,p=!1;let ct=g.isCatmullRomCurve3?g.closed:!1;R=g.computeFrenetFrames(u,ct),w=new H,y=new H,S=new H}p||(c=0,d=0,m=0,x=0);let D=o.extractPoints(h),L=D.shape,U=D.holes;if(!Hn.isClockWise(L)){L=L.reverse();for(let ct=0,Mt=U.length;ct<Mt;ct++){let St=U[ct];Hn.isClockWise(St)&&(U[ct]=St.reverse())}}function G(ct){let St=10000000000000001e-36,Ot=ct[0];for(let At=1;At<=ct.length;At++){let ee=At%ct.length,b=ct[ee],C=b.x-Ot.x,B=b.y-Ot.y,F=C*C+B*B,P=Math.max(Math.abs(b.x),Math.abs(b.y),Math.abs(Ot.x),Math.abs(Ot.y)),mt=St*P*P;if(F<=mt){ct.splice(ee,1),At--;continue}Ot=b}}G(L),U.forEach(G);let N=U.length,q=L;for(let ct=0;ct<N;ct++){let Mt=U[ct];L=L.concat(Mt)}function Y(ct,Mt,St){return Mt||Qt("ExtrudeGeometry: vec does not exist"),ct.clone().addScaledVector(Mt,St)}let W=L.length;function $(ct,Mt,St){let Ot,At,ee,b=ct.x-Mt.x,C=ct.y-Mt.y,B=St.x-ct.x,F=St.y-ct.y,P=b*b+C*C,mt=b*F-C*B;if(Math.abs(mt)>Number.EPSILON){let ut=Math.sqrt(P),A=Math.sqrt(B*B+F*F),k=Mt.x-C/ut,tt=Mt.y+b/ut,et=St.x-F/A,ht=St.y+B/A,I=((et-k)*F-(ht-tt)*B)/(b*F-C*B);Ot=k+b*I-ct.x,At=tt+C*I-ct.y;let T=Ot*Ot+At*At;if(T<=2)return new ft(Ot,At);ee=Math.sqrt(T/2)}else{let ut=!1;b>Number.EPSILON?B>Number.EPSILON&&(ut=!0):b<-Number.EPSILON?B<-Number.EPSILON&&(ut=!0):Math.sign(C)===Math.sign(F)&&(ut=!0),ut?(Ot=-C,At=b,ee=Math.sqrt(P)):(Ot=b,At=C,ee=Math.sqrt(P/2))}return new ft(Ot/ee,At/ee)}let X=[];for(let ct=0,Mt=q.length,St=Mt-1,Ot=ct+1;ct<Mt;ct++,St++,Ot++)St===Mt&&(St=0),Ot===Mt&&(Ot=0),X[ct]=$(q[ct],q[St],q[Ot]);let j=[],it,vt=X.concat();for(let ct=0,Mt=N;ct<Mt;ct++){let St=U[ct];it=[];for(let Ot=0,At=St.length,ee=At-1,b=Ot+1;Ot<At;Ot++,ee++,b++)ee===At&&(ee=0),b===At&&(b=0),it[Ot]=$(St[Ot],St[ee],St[b]);j.push(it),vt=vt.concat(it)}let Bt;if(c===0)Bt=Hn.triangulateShape(q,U);else{let ct=[],Mt=[];for(let St=0;St<c;St++){let Ot=St/c,At=d*Math.cos(Ot*Math.PI/2),ee=m*Math.sin(Ot*Math.PI/2)+x;for(let b=0,C=q.length;b<C;b++){let B=Y(q[b],X[b],ee);Xt(B.x,B.y,-At),Ot===0&&ct.push(B)}for(let b=0,C=N;b<C;b++){let B=U[b];it=j[b];let F=[];for(let P=0,mt=B.length;P<mt;P++){let ut=Y(B[P],it[P],ee);Xt(ut.x,ut.y,-At),Ot===0&&F.push(ut)}Ot===0&&Mt.push(F)}}Bt=Hn.triangulateShape(ct,Mt)}let nt=Bt.length,Pt=m+x;for(let ct=0;ct<W;ct++){let Mt=p?Y(L[ct],vt[ct],Pt):L[ct];v?(y.copy(R.normals[0]).multiplyScalar(Mt.x),w.copy(R.binormals[0]).multiplyScalar(Mt.y),S.copy(M[0]).add(y).add(w),Xt(S.x,S.y,S.z)):Xt(Mt.x,Mt.y,0)}for(let ct=1;ct<=u;ct++)for(let Mt=0;Mt<W;Mt++){let St=p?Y(L[Mt],vt[Mt],Pt):L[Mt];v?(y.copy(R.normals[ct]).multiplyScalar(St.x),w.copy(R.binormals[ct]).multiplyScalar(St.y),S.copy(M[ct]).add(y).add(w),Xt(S.x,S.y,S.z)):Xt(St.x,St.y,f/u*ct)}for(let ct=c-1;ct>=0;ct--){let Mt=ct/c,St=d*Math.cos(Mt*Math.PI/2),Ot=m*Math.sin(Mt*Math.PI/2)+x;for(let At=0,ee=q.length;At<ee;At++){let b=Y(q[At],X[At],Ot);Xt(b.x,b.y,f+St)}for(let At=0,ee=U.length;At<ee;At++){let b=U[At];it=j[At];for(let C=0,B=b.length;C<B;C++){let F=Y(b[C],it[C],Ot);v?Xt(F.x,F.y+M[u-1].y,M[u-1].x+St):Xt(F.x,F.y,f+St)}}}zt(),Vt();function zt(){let ct=s.length/3;if(p){let Mt=0,St=W*Mt;for(let Ot=0;Ot<nt;Ot++){let At=Bt[Ot];Te(At[2]+St,At[1]+St,At[0]+St)}Mt=u+c*2,St=W*Mt;for(let Ot=0;Ot<nt;Ot++){let At=Bt[Ot];Te(At[0]+St,At[1]+St,At[2]+St)}}else{for(let Mt=0;Mt<nt;Mt++){let St=Bt[Mt];Te(St[2],St[1],St[0])}for(let Mt=0;Mt<nt;Mt++){let St=Bt[Mt];Te(St[0]+W*u,St[1]+W*u,St[2]+W*u)}}n.addGroup(ct,s.length/3-ct,0)}function Vt(){let ct=s.length/3,Mt=0;Lt(q,Mt),Mt+=q.length;for(let St=0,Ot=U.length;St<Ot;St++){let At=U[St];Lt(At,Mt),Mt+=At.length}n.addGroup(ct,s.length/3-ct,1)}function Lt(ct,Mt){let St=ct.length;for(;--St>=0;){let Ot=St,At=St-1;At<0&&(At=ct.length-1);for(let ee=0,b=u+c*2;ee<b;ee++){let C=W*ee,B=W*(ee+1),F=Mt+Ot+C,P=Mt+At+C,mt=Mt+At+B,ut=Mt+Ot+B;$t(F,P,mt,ut)}}}function Xt(ct,Mt,St){l.push(ct),l.push(Mt),l.push(St)}function Te(ct,Mt,St){ie(ct),ie(Mt),ie(St);let Ot=s.length/3,At=_.generateTopUV(n,s,Ot-3,Ot-2,Ot-1);ae(At[0]),ae(At[1]),ae(At[2])}function $t(ct,Mt,St,Ot){ie(ct),ie(Mt),ie(Ot),ie(Mt),ie(St),ie(Ot);let At=s.length/3,ee=_.generateSideWallUV(n,s,At-6,At-3,At-2,At-1);ae(ee[0]),ae(ee[1]),ae(ee[3]),ae(ee[1]),ae(ee[2]),ae(ee[3])}function ie(ct){s.push(l[ct*3+0]),s.push(l[ct*3+1]),s.push(l[ct*3+2])}function ae(ct){r.push(ct.x),r.push(ct.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return Cf(e,n,t)}static fromJSON(t,e){let n=[];for(let r=0,a=t.shapes.length;r<a;r++){let o=e[t.shapes[r]];n.push(o)}let s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new ql[s.type]().fromJSON(s)),new i(n,t.options)}},Rf={generateTopUV:function(i,t,e,n,s){let r=t[e*3],a=t[e*3+1],o=t[n*3],l=t[n*3+1],h=t[s*3],u=t[s*3+1];return[new ft(r,a),new ft(o,l),new ft(h,u)]},generateSideWallUV:function(i,t,e,n,s,r){let a=t[e*3],o=t[e*3+1],l=t[e*3+2],h=t[n*3],u=t[n*3+1],f=t[n*3+2],p=t[s*3],d=t[s*3+1],m=t[s*3+2],x=t[r*3],c=t[r*3+1],g=t[r*3+2];return Math.abs(o-u)<Math.abs(a-h)?[new ft(a,1-l),new ft(h,1-f),new ft(p,1-m),new ft(x,1-g)]:[new ft(o,1-l),new ft(u,1-f),new ft(d,1-m),new ft(c,1-g)]}};function Cf(i,t,e){if(e.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){let r=i[n];e.shapes.push(r.uuid)}else e.shapes.push(i.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}var br=class i extends fr{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new i(t.radius,t.detail)}},Tr=class i extends De{constructor(t=[new ft(0,-.5),new ft(.5,0),new ft(0,.5)],e=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:s},e=Math.floor(e),s=de(s,0,Math.PI*2);let r=[],a=[],o=[],l=[],h=[],u=1/e,f=new H,p=new ft,d=new H,m=new H,x=new H,c=0,g=0;for(let _=0;_<=t.length-1;_++)switch(_){case 0:c=t[_+1].x-t[_].x,g=t[_+1].y-t[_].y,d.x=g*1,d.y=-c,d.z=g*0,x.copy(d),d.normalize(),l.push(d.x,d.y,d.z);break;case t.length-1:x.normalize(),l.push(x.x,x.y,x.z);break;default:c=t[_+1].x-t[_].x,g=t[_+1].y-t[_].y,d.x=g*1,d.y=-c,d.z=g*0,m.copy(d),d.x+=x.x,d.y+=x.y,d.z+=x.z,d.normalize(),l.push(d.x,d.y,d.z),x.copy(m)}for(let _=0;_<=e;_++){let M=n+_*u*s,v=Math.sin(M),R=Math.cos(M);for(let w=0;w<=t.length-1;w++){f.x=t[w].x*v,f.y=t[w].y,f.z=t[w].x*R,a.push(f.x,f.y,f.z),p.x=_/e,p.y=w/(t.length-1),o.push(p.x,p.y);let y=l[3*w+0]*v,S=l[3*w+1],D=l[3*w+0]*R;h.push(y,S,D)}}for(let _=0;_<e;_++)for(let M=0;M<t.length-1;M++){let v=M+_*t.length,R=v,w=v+t.length,y=v+t.length+1,S=v+1;r.push(R,w,S),r.push(y,S,w)}this.setIndex(r),this.setAttribute("position",new he(a,3)),this.setAttribute("uv",new he(o,2)),this.setAttribute("normal",new he(h,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.points,t.segments,t.phiStart,t.phiLength)}},yn=class i extends fr{constructor(t=1,e=0){let n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new i(t.radius,t.detail)}},En=class i extends De{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),h=o+1,u=l+1,f=t/o,p=e/l,d=[],m=[],x=[],c=[];for(let g=0;g<u;g++){let _=g*p-a;for(let M=0;M<h;M++){let v=M*f-r;m.push(v,-_,0),x.push(0,0,1),c.push(M/o),c.push(1-g/l)}}for(let g=0;g<l;g++)for(let _=0;_<o;_++){let M=_+h*g,v=_+h*(g+1),R=_+1+h*(g+1),w=_+1+h*g;d.push(M,v,w),d.push(v,R,w)}this.setIndex(d),this.setAttribute("position",new he(m,3)),this.setAttribute("normal",new he(x,3)),this.setAttribute("uv",new he(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}};var Er=class i extends De{constructor(t=new Ei([new ft(0,.5),new ft(-.5,-.5),new ft(.5,-.5)]),e=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:e};let n=[],s=[],r=[],a=[],o=0,l=0;if(Array.isArray(t)===!1)h(t);else for(let u=0;u<t.length;u++)h(t[u]),this.addGroup(o,l,u),o+=l,l=0;this.setIndex(n),this.setAttribute("position",new he(s,3)),this.setAttribute("normal",new he(r,3)),this.setAttribute("uv",new he(a,2));function h(u){let f=s.length/3,p=u.extractPoints(e),d=p.shape,m=p.holes;Hn.isClockWise(d)===!1&&(d=d.reverse());for(let c=0,g=m.length;c<g;c++){let _=m[c];Hn.isClockWise(_)===!0&&(m[c]=_.reverse())}let x=Hn.triangulateShape(d,m);for(let c=0,g=m.length;c<g;c++){let _=m[c];d=d.concat(_)}for(let c=0,g=d.length;c<g;c++){let _=d[c];s.push(_.x,_.y,0),r.push(0,0,1),a.push(_.x,_.y)}for(let c=0,g=x.length;c<g;c++){let _=x[c],M=_[0]+f,v=_[1]+f,R=_[2]+f;n.push(M,v,R),l+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON(),e=this.parameters.shapes;return If(e,t)}static fromJSON(t,e){let n=[];for(let s=0,r=t.shapes.length;s<r;s++){let a=e[t.shapes[s]];n.push(a)}return new i(n,t.curveSegments)}};function If(i,t){if(t.shapes=[],Array.isArray(i))for(let e=0,n=i.length;e<n;e++){let s=i[e];t.shapes.push(s.uuid)}else t.shapes.push(i.uuid);return t}var Un=class i extends De{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),h=0,u=[],f=new H,p=new H,d=[],m=[],x=[],c=[];for(let g=0;g<=n;g++){let _=[],M=g/n,v=a+M*o,R=t*Math.cos(v),w=Math.sqrt(t*t-R*R),y=0;g===0&&a===0?y=.5/e:g===n&&l===Math.PI&&(y=-.5/e);for(let S=0;S<=e;S++){let D=S/e,L=s+D*r;f.x=-w*Math.cos(L),f.y=R,f.z=w*Math.sin(L),m.push(f.x,f.y,f.z),p.copy(f).normalize(),x.push(p.x,p.y,p.z),c.push(D+y,1-M),_.push(h++)}u.push(_)}for(let g=0;g<n;g++)for(let _=0;_<e;_++){let M=u[g][_+1],v=u[g][_],R=u[g+1][_],w=u[g+1][_+1];(g!==0||a>0)&&d.push(M,v,w),(g!==n-1||l<Math.PI)&&d.push(v,R,w)}this.setIndex(d),this.setAttribute("position",new he(m,3)),this.setAttribute("normal",new he(x,3)),this.setAttribute("uv",new he(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var Be=class i extends De{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r,thetaStart:a,thetaLength:o},n=Math.floor(n),s=Math.floor(s);let l=[],h=[],u=[],f=[],p=new H,d=new H,m=new H;for(let x=0;x<=n;x++){let c=a+x/n*o;for(let g=0;g<=s;g++){let _=g/s*r;d.x=(t+e*Math.cos(c))*Math.cos(_),d.y=(t+e*Math.cos(c))*Math.sin(_),d.z=e*Math.sin(c),h.push(d.x,d.y,d.z),p.x=t*Math.cos(_),p.y=t*Math.sin(_),m.subVectors(d,p).normalize(),u.push(m.x,m.y,m.z),f.push(g/s),f.push(x/n)}}for(let x=1;x<=n;x++)for(let c=1;c<=s;c++){let g=(s+1)*x+c-1,_=(s+1)*(x-1)+c-1,M=(s+1)*(x-1)+c,v=(s+1)*x+c;l.push(g,_,v),l.push(_,M,v)}this.setIndex(l),this.setAttribute("position",new he(h,3)),this.setAttribute("normal",new he(u,3)),this.setAttribute("uv",new he(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}};function Qi(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];if(Ih(s))s.isRenderTargetTexture?(Kt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone();else if(Array.isArray(s))if(Ih(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();t[e][n]=r}else t[e][n]=s.slice();else t[e][n]=s}}return t}function an(i){let t={};for(let e=0;e<i.length;e++){let n=Qi(i[e]);for(let s in n)t[s]=n[s]}return t}function Ih(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Pf(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Sc(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ue.workingColorSpace}var li={clone:Qi,merge:an},Lf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Df=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Fe=class extends yi{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Lf,this.fragmentShader=Df,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Qi(t.uniforms),this.uniformsGroups=Pf(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(let n in t.uniforms){let s=t.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=e[s.value]||null;break;case"c":this.uniforms[n].value=new Yt().setHex(s.value);break;case"v2":this.uniforms[n].value=new ft().fromArray(s.value);break;case"v3":this.uniforms[n].value=new H().fromArray(s.value);break;case"v4":this.uniforms[n].value=new Ce().fromArray(s.value);break;case"m3":this.uniforms[n].value=new te().fromArray(s.value);break;case"m4":this.uniforms[n].value=new pe().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},Es=class extends Fe{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},Wi=class extends yi{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Yt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Yt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=$o,this.normalScale=new ft(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new sn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}};var Ja=class extends yi{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=cu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},$a=class extends yi{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function us(i,t){return!i||i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function Ta(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}var wi=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let a;e:{i:if(!(t<s)){for(let o=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=e[++n],t<s)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}a=n,n=0;break e}break n}for(;n<a;){let o=n+a>>>1;t<e[o]?a=o:n=o+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let a=0;a!==s;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Ka=class extends wi{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Vl,endingEnd:Vl}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,a=t+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case Wl:r=t,o=2*e-n;break;case Xl:r=s.length-2,o=e+s[r]-s[r+1];break;default:r=t,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Wl:a=t,l=2*n-e;break;case Xl:a=1,l=n+s[1]-s[0];break;default:a=t-1,l=e}let h=(n-e)*.5,u=this.valueSize;this._weightPrev=h/(e-o),this._weightNext=h/(l-n),this._offsetPrev=r*u,this._offsetNext=a*u}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,h=l-o,u=this._offsetPrev,f=this._offsetNext,p=this._weightPrev,d=this._weightNext,m=(n-e)/(s-e),x=m*m,c=x*m,g=-p*c+2*p*x-p*m,_=(1+p)*c+(-1.5-2*p)*x+(-.5+p)*m+1,M=(-1-d)*c+(1.5+d)*x+.5*m,v=d*c-d*x;for(let R=0;R!==o;++R)r[R]=g*a[u+R]+_*a[h+R]+M*a[l+R]+v*a[f+R];return r}},Qa=class extends wi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,h=l-o,u=(n-e)/(s-e),f=1-u;for(let p=0;p!==o;++p)r[p]=a[h+p]*f+a[l+p]*u;return r}},ja=class extends wi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},to=class extends wi{interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,h=l-o,u=this.inTangents,f=this.outTangents;if(!u||!f){let m=(n-e)/(s-e),x=1-m;for(let c=0;c!==o;++c)r[c]=a[h+c]*x+a[l+c]*m;return r}let p=o*2,d=t-1;for(let m=0;m!==o;++m){let x=a[h+m],c=a[l+m],g=d*p+m*2,_=f[g],M=f[g+1],v=t*p+m*2,R=u[v],w=u[v+1],y=Uf(n,e,_,R,s);r[m]=Ru(y,x,M,w,c)}return r}};function Ru(i,t,e,n,s){let r=1-i;return r*r*r*t+3*r*r*i*e+3*r*i*i*n+i*i*i*s}function Nf(i,t,e,n,s){let r=1-i;return 3*r*r*(e-t)+6*r*i*(n-e)+3*i*i*(s-n)}function Uf(i,t,e,n,s){let r=(i-t)/(s-t);for(let a=0;a<8;a++){let o=Ru(r,t,e,n,s)-i;if(Math.abs(o)<1e-10)break;let l=Nf(r,t,e,n,s);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}var vn=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=us(e,this.TimeBufferType),this.values=us(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:us(t.times,Array),values:us(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s),Ta(t.settings)&&(n.settings={inTangents:us(t.settings.inTangents,Array),outTangents:us(t.settings.outTangents,Array)})}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new ja(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Qa(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Ka(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new to(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case Ks:e=this.InterpolantFactoryMethodDiscrete;break;case Oa:e=this.InterpolantFactoryMethodLinear;break;case Aa:e=this.InterpolantFactoryMethodSmooth;break;case Gl:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Kt("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ks;case this.InterpolantFactoryMethodLinear:return Oa;case this.InterpolantFactoryMethodSmooth:return Aa;case this.InterpolantFactoryMethodBezier:return Gl}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t;Ta(this.settings)&&(Ph(this.settings.inTangents,t),Ph(this.settings.outTangents,t))}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t;Ta(this.settings)&&(Lh(this.settings.inTangents,t),Lh(this.settings.outTangents,t))}return this}trim(t,e){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Qt("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Qt("KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){Qt("KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(a!==null&&a>l){Qt("KeyframeTrack: Out of order keys.",this,o,l,a),t=!1;break}a=l}if(s!==void 0&&Nd(s))for(let o=0,l=s.length;o!==l;++o){let h=s[o];if(isNaN(h)){Qt("KeyframeTrack: Value is not a valid number.",this,o,h),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Aa,r=t.length-1,a=1;for(let o=1;o<r;++o){let l=!1,h=t[o],u=t[o+1];if(h!==u&&(o!==1||h!==t[0]))if(s)l=!0;else{let f=o*n,p=f-n,d=f+n;for(let m=0;m!==n;++m){let x=e[f+m];if(x!==e[p+m]||x!==e[d+m]){l=!0;break}}}if(l){if(o!==a){t[a]=t[o];let f=o*n,p=a*n;for(let d=0;d!==n;++d)e[p+d]=e[f+d]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,l=a*n,h=0;h!==n;++h)e[l+h]=e[o+h];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,Ta(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function Ph(i,t){for(let e=0,n=i.length;e!==n;e+=2)i[e]+=t}function Lh(i,t){for(let e=0,n=i.length;e!==n;e+=2)i[e]*=t}vn.prototype.ValueTypeName="";vn.prototype.TimeBufferType=Float32Array;vn.prototype.ValueBufferType=Float32Array;vn.prototype.DefaultInterpolation=Oa;var Ai=class extends vn{constructor(t,e,n){super(t,e,n)}};Ai.prototype.ValueTypeName="bool";Ai.prototype.ValueBufferType=Array;Ai.prototype.DefaultInterpolation=Ks;Ai.prototype.InterpolantFactoryMethodLinear=void 0;Ai.prototype.InterpolantFactoryMethodSmooth=void 0;var eo=class extends vn{constructor(t,e,n,s){super(t,e,n,s)}};eo.prototype.ValueTypeName="color";var no=class extends vn{constructor(t,e,n,s){super(t,e,n,s)}};no.prototype.ValueTypeName="number";var io=class extends wi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-e)/(s-e),h=t*o;for(let u=h+o;h!==u;h+=4)Ye.slerpFlat(r,0,a,h-o,a,h,l);return r}},wr=class extends vn{constructor(t,e,n,s){super(t,e,n,s)}InterpolantFactoryMethodLinear(t){return new io(this.times,this.values,this.getValueSize(),t)}};wr.prototype.ValueTypeName="quaternion";wr.prototype.InterpolantFactoryMethodSmooth=void 0;var Ri=class extends vn{constructor(t,e,n){super(t,e,n)}};Ri.prototype.ValueTypeName="string";Ri.prototype.ValueBufferType=Array;Ri.prototype.DefaultInterpolation=Ks;Ri.prototype.InterpolantFactoryMethodLinear=void 0;Ri.prototype.InterpolantFactoryMethodSmooth=void 0;var so=class extends vn{constructor(t,e,n,s){super(t,e,n,s)}};so.prototype.ValueTypeName="vector";var ro=class{constructor(t,e,n){let s=this,r=!1,a=0,o=0,l,h=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(u){o++,r===!1&&s.onStart!==void 0&&s.onStart(u,a,o),r=!0},this.itemEnd=function(u){a++,s.onProgress!==void 0&&s.onProgress(u,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,f){return h.push(u,f),this},this.removeHandler=function(u){let f=h.indexOf(u);return f!==-1&&h.splice(f,2),this},this.getHandler=function(u){for(let f=0,p=h.length;f<p;f+=2){let d=h[f],m=h[f+1];if(d.global&&(d.lastIndex=0),d.test(u))return m}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Cu=new ro,ao=class{constructor(t){this.manager=t!==void 0?t:Cu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}setPriority(t){return this.priority=t,this}setCache(t){return this.cache=t,this}abort(){return this}};ao.DEFAULT_MATERIAL_NAME="__DEFAULT";var ws=class extends rn{static registerNode(t){this.prototype._lightNode=t}constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Yt(t),this.intensity=e}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}},Ar=class extends ws{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(rn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Yt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){let e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}},Hl=new pe,Dh=new H,Nh=new H,Rr=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ft(512,512),this.mapType=dn,this.map=null,this.mapPass=null,this.matrix=new pe,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new bi,this._frameExtents=new ft(1,1),this._viewportCount=1,this._viewports=[new Ce(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera;Dh.setFromMatrixPosition(t.matrixWorld),e.position.copy(Dh),Nh.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Nh),e.updateMatrixWorld(),this._updateMatrix(e,this.matrix,this._frustum)}_updateMatrix(t,e,n,s){Hl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),n.setFromProjectionMatrix(Hl,t.coordinateSystem,t.reversedDepth);let r=this._frameExtents,a=s?s.z/r.x:1,o=s?s.w/r.y:1,l=s?s.x/r.x:0,h=s?s.y/r.y:0;t.coordinateSystem===xs||t.reversedDepth?e.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+h,0,0,1,0,0,0,0,1):e.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+h,0,0,.5,.5,0,0,0,1),e.multiply(Hl)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.mapType=t.mapType,this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.mapType=this.mapType,t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}},Ea=new H,wa=new Ye,zn=new H,Cr=class extends rn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new pe,this.projectionMatrix=new pe,this.projectionMatrixInverse=new pe,this.coordinateSystem=Tn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Ea,wa,zn),zn.x===1&&zn.y===1&&zn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ea,wa,zn.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(Ea,wa,zn),zn.x===1&&zn.y===1&&zn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ea,wa,zn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},gi=new H,Uh=new ft,Fh=new ft,nn=class extends Cr{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Ba*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(xl*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Ba*2*Math.atan(Math.tan(xl*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){gi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(gi.x,gi.y).multiplyScalar(-t/gi.z),gi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(gi.x,gi.y).multiplyScalar(-t/gi.z)}getViewSize(t,e){return this.getViewBounds(t,Uh,Fh),e.subVectors(Fh,Uh)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(xl*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,h=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/h,s*=a.width/l,n*=a.height/h}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}};var $l=class extends Rr{constructor(){super(new nn(90,1,.5,500)),this.isPointLightShadow=!0}},As=class extends ws{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new $l}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.distance=this.distance,e.object.decay=this.decay,e.object.shadow=this.shadow.toJSON(),e}},Xi=class extends Cr{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let h=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=h*this.view.offsetX,a=r+h*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Kl=class extends Rr{constructor(){super(new Xi(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Rs=class extends ws{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(rn.DEFAULT_UP),this.updateMatrix(),this.target=new rn,this.shadow=new Kl}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}};var Ir=class extends De{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(t){return super.copy(t),this.instanceCount=t.instanceCount,this}toJSON(){let t=super.toJSON();return t.instanceCount=this.instanceCount,t.isInstancedBufferGeometry=!0,t}};var ds=-90,fs=1,Cs=class extends rn{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new nn(ds,fs,t,e);s.layers=this.layers,this.add(s);let r=new nn(ds,fs,t,e);r.layers=this.layers,this.add(r);let a=new nn(ds,fs,t,e);a.layers=this.layers,this.add(a);let o=new nn(ds,fs,t,e);o.layers=this.layers,this.add(o);let l=new nn(ds,fs,t,e);l.layers=this.layers,this.add(l);let h=new nn(ds,fs,t,e);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(let h of e)this.remove(h);if(t===Tn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===xs)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let h of e)this.add(h),h.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,h,u]=this.children,f=t.getRenderTarget(),p=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;let x=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let c=!1;t.isWebGLRenderer===!0?c=t.state.buffers.depth.getReversed():c=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),c&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),c&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,s),c&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,s),c&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(n,4,s),c&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),n.texture.mipmapsAutoUpdate=x,t.setRenderTarget(n,5,s),c&&t.autoClear===!1&&t.clearDepth(),t.render(e,u),t.setRenderTarget(f,p,d),t.xr.enabled=m,n.texture.needsPMREMUpdate=!0}},oo=class extends nn{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t,this.perCameraFrustumCulled=!1}},Pr=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(t){this._document=t,t.hidden!==void 0&&(this._pageVisibilityHandler=Ff.bind(this),t.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(t){return this._timescale=t,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(t){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(t!==void 0?t:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function Ff(){this._document.hidden===!1&&this.reset()}var bc="\\[\\]\\.:\\/",Of=new RegExp("["+bc+"]","g"),Tc="[^"+bc+"]",Bf="[^"+bc.replace("\\.","")+"]",zf=/((?:WC+[\/:])*)/.source.replace("WC",Tc),kf=/(WCOD+)?/.source.replace("WCOD",Bf),Hf=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Tc),Gf=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Tc),Vf=new RegExp("^"+zf+kf+Hf+Gf+"$"),Wf=["material","materials","bones","map"],Ql=class{constructor(t,e,n){let s=n||Re.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},Re=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Of,"")}static parseTrackName(t){let e=Vf.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);Wf.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let l=n(o.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Kt("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let h=e.objectIndex;switch(n){case"materials":if(!t.material){Qt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Qt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Qt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let u=0;u<t.length;u++)if(t[u].name===h){h=u;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Qt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Qt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Qt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(h!==void 0){if(t[h]===void 0){Qt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[h]}}let a=t[s];if(a===void 0){let h=e.nodeName;Qt("PropertyBinding: Trying to update property for track: "+h+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){Qt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Qt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Re.Composite=Ql;Re.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Re.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Re.prototype.GetterByBindingType=[Re.prototype._getValue_direct,Re.prototype._getValue_array,Re.prototype._getValue_arrayElement,Re.prototype._getValue_toArray];Re.prototype.SetterByBindingTypeAndVersioning=[[Re.prototype._setValue_direct,Re.prototype._setValue_direct_setNeedsUpdate,Re.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Re.prototype._setValue_array,Re.prototype._setValue_array_setNeedsUpdate,Re.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Re.prototype._setValue_arrayElement,Re.prototype._setValue_arrayElement_setNeedsUpdate,Re.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Re.prototype._setValue_fromArray,Re.prototype._setValue_fromArray_setNeedsUpdate,Re.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Qx=new Float32Array(1);var Oh=new pe,Lr=class{constructor(t,e,n=0,s=1/0){this.ray=new ar(t,e),this.near=n,this.far=s,this.camera=null,this.layers=new vs,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,e.projectionMatrix.elements[14]).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):Qt("Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return Oh.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Oh),this}intersectObject(t,e=!0,n=[]){return jl(t,this,n,e),n.sort(Bh),n}intersectObjects(t,e=!0,n=[]){for(let s=0,r=t.length;s<r;s++)jl(t[s],this,n,e);return n.sort(Bh),n}};function Bh(i,t){return i.distance-t.distance}function jl(i,t,e,n){let s=!0;if(i.layers.test(t.layers)&&i.raycast(t,e)===!1&&(s=!1),s===!0&&n===!0){let r=i.children;for(let a=0,o=r.length;a<o;a++)jl(r[a],t,e,!0)}}var Ic=class Ic{constructor(t,e,n,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,s){let r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=s,this}};Ic.prototype.isMatrix2=!0;var tc=Ic;function Ec(i,t,e,n){let s=Xf(n);switch(e){case dc:return i*t;case go:return i*t/s.components*s.byteLength;case xo:return i*t/s.components*s.byteLength;case Ii:return i*t*2/s.components*s.byteLength;case _o:return i*t*2/s.components*s.byteLength;case fc:return i*t*3/s.components*s.byteLength;case On:return i*t*4/s.components*s.byteLength;case yo:return i*t*4/s.components*s.byteLength;case kr:case Hr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Gr:case Vr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Mo:case bo:return Math.max(i,16)*Math.max(t,8)/4;case vo:case So:return Math.max(i,8)*Math.max(t,8)/2;case To:case Eo:case Ao:case Ro:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case wo:case Wr:case Co:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Io:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Po:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Lo:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case Do:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case No:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Uo:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Fo:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case Oo:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Bo:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case zo:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case ko:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Ho:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Go:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Vo:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case Wo:case Xo:case qo:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Yo:case Zo:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Xr:case Jo:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Xf(i){switch(i){case dn:case lc:return{byteLength:1,components:1};case Ls:case cc:case Ze:return{byteLength:2,components:1};case po:case mo:return{byteLength:2,components:4};case Fn:case fo:case An:return{byteLength:4,components:1};case hc:case uc:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"187"}}));typeof window<"u"&&(window.__THREE__?Kt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="187");function Ku(){let i=null,t=!1,e=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),e(r,a)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function jf(i){let t=new WeakMap;function e(o,l){let h=o.array,u=o.usage,f=h.byteLength,p=i.createBuffer();i.bindBuffer(l,p),i.bufferData(l,h,u),o.onUploadCallback();let d;if(h instanceof Float32Array)d=i.FLOAT;else if(typeof Float16Array<"u"&&h instanceof Float16Array)d=i.HALF_FLOAT;else if(h instanceof Uint16Array)o.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(h instanceof Int16Array)d=i.SHORT;else if(h instanceof Uint32Array)d=i.UNSIGNED_INT;else if(h instanceof Int32Array)d=i.INT;else if(h instanceof Int8Array)d=i.BYTE;else if(h instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:p,type:d,bytesPerElement:h.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,l,h){let u=l.array,f=l.updateRanges;if(i.bindBuffer(h,o),f.length===0)i.bufferSubData(h,0,u);else{f.sort((d,m)=>d.start-m.start);let p=0;for(let d=1;d<f.length;d++){let m=f[p],x=f[d];x.start<=m.start+m.count+1?m.count=Math.max(m.count,x.start+x.count-m.start):(++p,f[p]=x)}f.length=p+1;for(let d=0,m=f.length;d<m;d++){let x=f[d];i.bufferSubData(h,x.start*u.BYTES_PER_ELEMENT,u,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let u=t.get(o);(!u||u.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let h=t.get(o);if(h===void 0)t.set(o,e(o,l));else if(h.version<o.version){if(h.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(h.buffer,o,l),h.version=o.version}}return{get:s,remove:r,update:a}}var tp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,ep=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,np=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ip=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,sp=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,rp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,ap=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,op=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,lp=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,cp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,hp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,up=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,dp=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,fp=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,pp=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,mp=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,gp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,xp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,_p=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,yp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,vp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Mp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Sp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,bp=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Tp=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Ep=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,wp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Ap=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Rp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Cp="gl_FragColor = linearToOutputTexel( gl_FragColor );",Ip=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Pp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Lp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,Dp=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Np=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Up=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Fp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Op=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Bp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,zp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,kp=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Hp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Gp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Vp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Wp=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Xp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,qp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Yp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Zp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Jp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,$p=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Kp=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Qp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,jp=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,tm=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,em=`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,nm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,im=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,sm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,rm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,am=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,om=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,lm=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,cm=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,hm=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,um=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,dm=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,fm=`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,pm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,mm=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,gm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,xm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,_m=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,ym=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,vm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Mm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Sm=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,bm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Tm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Em=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,wm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Am=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Rm=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Cm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Im=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Pm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Lm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Dm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Nm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Um=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Fm=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Om=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Bm=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,zm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,km=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Hm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Gm=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Vm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Wm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Xm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,qm=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Ym=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Zm=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Jm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,$m=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Km=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Qm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,jm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,t0=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,e0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,n0=`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,i0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,s0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,r0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,a0=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,o0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,l0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,c0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,h0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,u0=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,d0=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,f0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,p0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,m0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,g0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,x0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,_0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,y0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,v0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,M0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,S0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,b0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,T0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,E0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,w0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,A0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,R0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,C0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,I0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,P0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,L0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,ce={alphahash_fragment:tp,alphahash_pars_fragment:ep,alphamap_fragment:np,alphamap_pars_fragment:ip,alphatest_fragment:sp,alphatest_pars_fragment:rp,aomap_fragment:ap,aomap_pars_fragment:op,batching_pars_vertex:lp,batching_vertex:cp,begin_vertex:hp,beginnormal_vertex:up,bsdfs:dp,iridescence_fragment:fp,bumpmap_pars_fragment:pp,clipping_planes_fragment:mp,clipping_planes_pars_fragment:gp,clipping_planes_pars_vertex:xp,clipping_planes_vertex:_p,color_fragment:yp,color_pars_fragment:vp,color_pars_vertex:Mp,color_vertex:Sp,common:bp,defaultnormal_vertex:Tp,displacementmap_pars_vertex:Ep,displacementmap_vertex:wp,emissivemap_fragment:Ap,emissivemap_pars_fragment:Rp,colorspace_fragment:Cp,colorspace_pars_fragment:Ip,envmap_fragment:Pp,envmap_common_pars_fragment:Lp,envmap_pars_fragment:Dp,envmap_pars_vertex:Np,envmap_physical_pars_fragment:Xp,envmap_vertex:Up,fog_vertex:Fp,fog_pars_vertex:Op,fog_fragment:Bp,fog_pars_fragment:zp,gradientmap_pars_fragment:kp,lightmap_pars_fragment:Hp,lights_lambert_fragment:Gp,lights_lambert_pars_fragment:Vp,lights_pars_begin:Wp,lights_toon_fragment:qp,lights_toon_pars_fragment:Yp,lights_phong_fragment:Zp,lights_phong_pars_fragment:Jp,lights_physical_fragment:$p,lights_physical_pars_fragment:Kp,lights_fragment_begin:Qp,lights_fragment_maps:jp,lights_fragment_end:tm,lightprobes_pars_fragment:em,logdepthbuf_fragment:nm,logdepthbuf_pars_fragment:im,logdepthbuf_pars_vertex:sm,logdepthbuf_vertex:rm,map_fragment:am,map_pars_fragment:om,map_particle_fragment:lm,map_particle_pars_fragment:cm,metalnessmap_fragment:hm,metalnessmap_pars_fragment:um,morphinstance_vertex:dm,morphcolor_vertex:fm,morphnormal_vertex:pm,morphtarget_pars_vertex:mm,morphtarget_vertex:gm,normal_fragment_begin:xm,normal_fragment_maps:_m,normal_pars_fragment:ym,normal_pars_vertex:vm,normal_vertex:Mm,normalmap_pars_fragment:Sm,clearcoat_normal_fragment_begin:bm,clearcoat_normal_fragment_maps:Tm,clearcoat_pars_fragment:Em,iridescence_pars_fragment:wm,opaque_fragment:Am,packing:Rm,premultiplied_alpha_fragment:Cm,project_vertex:Im,dithering_fragment:Pm,dithering_pars_fragment:Lm,roughnessmap_fragment:Dm,roughnessmap_pars_fragment:Nm,shadowmap_pars_fragment:Um,shadowmap_pars_vertex:Fm,shadowmap_vertex:Om,shadowmask_pars_fragment:Bm,skinbase_vertex:zm,skinning_pars_vertex:km,skinning_vertex:Hm,skinnormal_vertex:Gm,specularmap_fragment:Vm,specularmap_pars_fragment:Wm,tonemapping_fragment:Xm,tonemapping_pars_fragment:qm,transmission_fragment:Ym,transmission_pars_fragment:Zm,uv_pars_fragment:Jm,uv_pars_vertex:$m,uv_vertex:Km,worldpos_vertex:Qm,background_vert:jm,background_frag:t0,backgroundCube_vert:e0,backgroundCube_frag:n0,cube_vert:i0,cube_frag:s0,depth_vert:r0,depth_frag:a0,distance_vert:o0,distance_frag:l0,equirect_vert:c0,equirect_frag:h0,linedashed_vert:u0,linedashed_frag:d0,meshbasic_vert:f0,meshbasic_frag:p0,meshlambert_vert:m0,meshlambert_frag:g0,meshmatcap_vert:x0,meshmatcap_frag:_0,meshnormal_vert:y0,meshnormal_frag:v0,meshphong_vert:M0,meshphong_frag:S0,meshphysical_vert:b0,meshphysical_frag:T0,meshtoon_vert:E0,meshtoon_frag:w0,points_vert:A0,points_frag:R0,shadow_vert:C0,shadow_frag:I0,sprite_vert:P0,sprite_frag:L0},Ut={common:{diffuse:{value:new Yt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new te},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new te}},envmap:{envMap:{value:null},envMapRotation:{value:new te},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new te}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new te}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new te},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new te},normalScale:{value:new ft(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new te},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new te}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new te}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new te}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Yt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new Yt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0},uvTransform:{value:new te}},sprite:{diffuse:{value:new Yt(16777215)},opacity:{value:1},center:{value:new ft(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new te},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0}}},Yn={basic:{uniforms:an([Ut.common,Ut.specularmap,Ut.envmap,Ut.aomap,Ut.lightmap,Ut.fog]),vertexShader:ce.meshbasic_vert,fragmentShader:ce.meshbasic_frag},lambert:{uniforms:an([Ut.common,Ut.specularmap,Ut.envmap,Ut.aomap,Ut.lightmap,Ut.emissivemap,Ut.bumpmap,Ut.normalmap,Ut.displacementmap,Ut.fog,Ut.lights,{emissive:{value:new Yt(0)},envMapIntensity:{value:1}}]),vertexShader:ce.meshlambert_vert,fragmentShader:ce.meshlambert_frag},phong:{uniforms:an([Ut.common,Ut.specularmap,Ut.envmap,Ut.aomap,Ut.lightmap,Ut.emissivemap,Ut.bumpmap,Ut.normalmap,Ut.displacementmap,Ut.fog,Ut.lights,{emissive:{value:new Yt(0)},specular:{value:new Yt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ce.meshphong_vert,fragmentShader:ce.meshphong_frag},standard:{uniforms:an([Ut.common,Ut.envmap,Ut.aomap,Ut.lightmap,Ut.emissivemap,Ut.bumpmap,Ut.normalmap,Ut.displacementmap,Ut.roughnessmap,Ut.metalnessmap,Ut.fog,Ut.lights,{emissive:{value:new Yt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ce.meshphysical_vert,fragmentShader:ce.meshphysical_frag},toon:{uniforms:an([Ut.common,Ut.aomap,Ut.lightmap,Ut.emissivemap,Ut.bumpmap,Ut.normalmap,Ut.displacementmap,Ut.gradientmap,Ut.fog,Ut.lights,{emissive:{value:new Yt(0)}}]),vertexShader:ce.meshtoon_vert,fragmentShader:ce.meshtoon_frag},matcap:{uniforms:an([Ut.common,Ut.bumpmap,Ut.normalmap,Ut.displacementmap,Ut.fog,{matcap:{value:null}}]),vertexShader:ce.meshmatcap_vert,fragmentShader:ce.meshmatcap_frag},points:{uniforms:an([Ut.points,Ut.fog]),vertexShader:ce.points_vert,fragmentShader:ce.points_frag},dashed:{uniforms:an([Ut.common,Ut.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ce.linedashed_vert,fragmentShader:ce.linedashed_frag},depth:{uniforms:an([Ut.common,Ut.displacementmap]),vertexShader:ce.depth_vert,fragmentShader:ce.depth_frag},normal:{uniforms:an([Ut.common,Ut.bumpmap,Ut.normalmap,Ut.displacementmap,{opacity:{value:1}}]),vertexShader:ce.meshnormal_vert,fragmentShader:ce.meshnormal_frag},sprite:{uniforms:an([Ut.sprite,Ut.fog]),vertexShader:ce.sprite_vert,fragmentShader:ce.sprite_frag},background:{uniforms:{uvTransform:{value:new te},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ce.background_vert,fragmentShader:ce.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new te}},vertexShader:ce.backgroundCube_vert,fragmentShader:ce.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ce.cube_vert,fragmentShader:ce.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ce.equirect_vert,fragmentShader:ce.equirect_frag},distance:{uniforms:an([Ut.common,Ut.displacementmap,{referencePosition:{value:new H},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ce.distance_vert,fragmentShader:ce.distance_frag},shadow:{uniforms:an([Ut.lights,Ut.fog,{color:{value:new Yt(0)},opacity:{value:1}}]),vertexShader:ce.shadow_vert,fragmentShader:ce.shadow_frag}};Yn.physical={uniforms:an([Yn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new te},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new te},clearcoatNormalScale:{value:new ft(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new te},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new te},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new te},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new te},sheen:{value:0},sheenColor:{value:new Yt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new te},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new te},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new te},transmissionSamplerSize:{value:new ft},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new te},attenuationDistance:{value:0},attenuationColor:{value:new Yt(0)},specularColor:{value:new Yt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new te},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new te},anisotropyVector:{value:new ft},anisotropyMap:{value:null},anisotropyMapTransform:{value:new te}}]),vertexShader:ce.meshphysical_vert,fragmentShader:ce.meshphysical_frag};var Ko={r:0,b:0,g:0},D0=new pe,Qu=new te;Qu.set(-1,0,0,0,1,0,0,0,1);function N0(i,t,e,n,s,r){let a=new Yt(0),o=s===!0?0:1,l,h,u=null,f=0,p=null;function d(_){let M=_.isScene===!0?_.background:null;if(M&&M.isTexture){let v=_.backgroundBlurriness>0;M=t.get(M,v)}return M}function m(_){let M=!1,v=d(_);v===null?c(a,o):v&&v.isColor&&(c(v,1),M=!0);let R=i.xr.getEnvironmentBlendMode();R==="additive"?e.buffers.color.setClear(0,0,0,1,r):R==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||M)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function x(_,M){let v=d(M);v&&v.isCubeTexture?(h===void 0&&(h=new pt(new Ti(1,1,1),new Fe({name:"BackgroundCubeMaterial",uniforms:Qi(Yn.backgroundCube.uniforms),vertexShader:Yn.backgroundCube.vertexShader,fragmentShader:Yn.backgroundCube.fragmentShader,side:un,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(R,w,y){this.matrixWorld.copyPosition(y.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(h)),h.material.uniforms.envMap.value=v,h.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(D0.makeRotationFromEuler(M.backgroundRotation)).transpose(),v.isRenderTargetTexture===!1&&h.material.uniforms.backgroundRotation.value.premultiply(Qu),h.material.toneMapped=ue.getTransfer(v.colorSpace)!==_e,(u!==v||f!==v.version||p!==i.toneMapping)&&(h.material.needsUpdate=!0,u=v,f=v.version,p=i.toneMapping),h.layers.enableAll(),_.unshift(h,h.geometry,h.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new pt(new En(2,2),new Fe({name:"BackgroundMaterial",uniforms:Qi(Yn.background.uniforms),vertexShader:Yn.background.vertexShader,fragmentShader:Yn.background.fragmentShader,side:Wn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.toneMapped=ue.getTransfer(v.colorSpace)!==_e,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),(u!==v||f!==v.version||p!==i.toneMapping)&&(l.material.needsUpdate=!0,u=v,f=v.version,p=i.toneMapping),l.layers.enableAll(),_.unshift(l,l.geometry,l.material,0,0,null))}function c(_,M){_.getRGB(Ko,Sc(i)),e.buffers.color.setClear(Ko.r,Ko.g,Ko.b,M,r)}function g(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(_,M=1){a.set(_),o=M,c(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(_){o=_,c(a,o)},render:m,addToRenderList:x,dispose:g}}function U0(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=p(null),r=s,a=!1;function o(U,z,G,N,q){let Y=!1,W=f(U,N,G,z);r!==W&&(r=W,h(r.object)),Y=d(U,N,G,q),Y&&m(U,N,G,q),q!==null&&t.update(q,i.ELEMENT_ARRAY_BUFFER),(Y||a)&&(a=!1,v(U,z,G,N),q!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(q).buffer))}function l(){return i.createVertexArray()}function h(U){return i.bindVertexArray(U)}function u(U){return i.deleteVertexArray(U)}function f(U,z,G,N){let q=N.wireframe===!0,Y=n[z.id];Y===void 0&&(Y={},n[z.id]=Y);let W=U.isInstancedMesh===!0?U.id:0,$=Y[W];$===void 0&&($={},Y[W]=$);let X=$[G.id];X===void 0&&(X={},$[G.id]=X);let j=X[q];return j===void 0&&(j=p(l()),X[q]=j),j}function p(U){let z=[],G=[],N=[];for(let q=0;q<e;q++)z[q]=0,G[q]=0,N[q]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:z,enabledAttributes:G,attributeDivisors:N,object:U,attributes:{},index:null}}function d(U,z,G,N){let q=r.attributes,Y=z.attributes,W=0,$=G.getAttributes();for(let X in $)if($[X].location>=0){let it=q[X],vt=Y[X];if(vt===void 0&&(X==="instanceMatrix"&&U.instanceMatrix&&(vt=U.instanceMatrix),X==="instanceColor"&&U.instanceColor&&(vt=U.instanceColor)),it===void 0||it.attribute!==vt||vt&&it.data!==vt.data)return!0;W++}return r.attributesNum!==W||r.index!==N}function m(U,z,G,N){let q={},Y=z.attributes,W=0,$=G.getAttributes();for(let X in $)if($[X].location>=0){let it=Y[X];it===void 0&&(X==="instanceMatrix"&&U.instanceMatrix&&(it=U.instanceMatrix),X==="instanceColor"&&U.instanceColor&&(it=U.instanceColor));let vt={};vt.attribute=it,it&&it.data&&(vt.data=it.data),q[X]=vt,W++}r.attributes=q,r.attributesNum=W,r.index=N}function x(){let U=r.newAttributes;for(let z=0,G=U.length;z<G;z++)U[z]=0}function c(U){g(U,0)}function g(U,z){let G=r.newAttributes,N=r.enabledAttributes,q=r.attributeDivisors;G[U]=1,N[U]===0&&(i.enableVertexAttribArray(U),N[U]=1),q[U]!==z&&(i.vertexAttribDivisor(U,z),q[U]=z)}function _(){let U=r.newAttributes,z=r.enabledAttributes;for(let G=0,N=z.length;G<N;G++)z[G]!==U[G]&&(i.disableVertexAttribArray(G),z[G]=0)}function M(U,z,G,N,q,Y,W){W===!0?i.vertexAttribIPointer(U,z,G,q,Y):i.vertexAttribPointer(U,z,G,N,q,Y)}function v(U,z,G,N){x();let q=N.attributes,Y=G.getAttributes(),W=z.defaultAttributeValues;for(let $ in Y){let X=Y[$];if(X.location>=0){let j=q[$];if(j===void 0&&($==="instanceMatrix"&&U.instanceMatrix&&(j=U.instanceMatrix),$==="instanceColor"&&U.instanceColor&&(j=U.instanceColor)),j!==void 0){let it=j.normalized,vt=j.itemSize,Bt=t.get(j);if(Bt===void 0)continue;let nt=Bt.buffer,Pt=Bt.type,zt=Bt.bytesPerElement,Vt=Pt===i.INT||Pt===i.UNSIGNED_INT||j.gpuType===fo;if(j.isInterleavedBufferAttribute){let Lt=j.data,Xt=Lt.isInterleavedBuffer===!0?Lt.stride:Lt.itemSize,Te=j.offset;if(Lt.isInstancedInterleavedBuffer||Lt.isInstancedBufferAttribute){for(let $t=0;$t<X.locationSize;$t++)g(X.location+$t,Lt.meshPerAttribute);U.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=Lt.meshPerAttribute*Lt.count)}else for(let $t=0;$t<X.locationSize;$t++)c(X.location+$t);i.bindBuffer(i.ARRAY_BUFFER,nt);for(let $t=0;$t<X.locationSize;$t++)M(X.location+$t,vt/X.locationSize,Pt,it,Xt*zt,(Te+vt/X.locationSize*$t)*zt,Vt)}else{if(j.isInstancedBufferAttribute){for(let Lt=0;Lt<X.locationSize;Lt++)g(X.location+Lt,j.meshPerAttribute);U.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let Lt=0;Lt<X.locationSize;Lt++)c(X.location+Lt);i.bindBuffer(i.ARRAY_BUFFER,nt);for(let Lt=0;Lt<X.locationSize;Lt++)M(X.location+Lt,vt/X.locationSize,Pt,it,vt*zt,vt/X.locationSize*Lt*zt,Vt)}}else if(W!==void 0){let it=W[$];if(it!==void 0)switch(it.length){case 2:i.vertexAttrib2fv(X.location,it);break;case 3:i.vertexAttrib3fv(X.location,it);break;case 4:i.vertexAttrib4fv(X.location,it);break;default:i.vertexAttrib1fv(X.location,it)}}}}_()}function R(){D();for(let U in n){let z=n[U];for(let G in z){let N=z[G];for(let q in N){let Y=N[q];for(let W in Y)u(Y[W].object),delete Y[W];delete N[q]}}delete n[U]}}function w(U){if(n[U.id]===void 0)return;let z=n[U.id];for(let G in z){let N=z[G];for(let q in N){let Y=N[q];for(let W in Y)u(Y[W].object),delete Y[W];delete N[q]}}delete n[U.id]}function y(U){for(let z in n){let G=n[z];for(let N in G){let q=G[N];if(q[U.id]===void 0)continue;let Y=q[U.id];for(let W in Y)u(Y[W].object),delete Y[W];delete q[U.id]}}}function S(U){for(let z in n){let G=n[z],N=U.isInstancedMesh===!0?U.id:0,q=G[N];if(q!==void 0){for(let Y in q){let W=q[Y];for(let $ in W)u(W[$].object),delete W[$];delete q[Y]}delete G[N],Object.keys(G).length===0&&delete n[z]}}}function D(){L(),a=!0,r!==s&&(r=s,h(r.object))}function L(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:D,resetDefaultState:L,dispose:R,releaseStatesOfGeometry:w,releaseStatesOfObject:S,releaseStatesOfProgram:y,initAttributes:x,enableAttribute:c,disableUnusedAttributes:_}}function F0(i,t,e){let n;function s(l){n=l}function r(l,h){i.drawArrays(n,l,h),e.update(h,n,1)}function a(l,h,u){u!==0&&(i.drawArraysInstanced(n,l,h,u),e.update(h,n,u))}function o(l,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,h,0,u);let p=0;for(let d=0;d<u;d++)p+=h[d];e.update(p,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function O0(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let y=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(y.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(y){return!(y!==On&&n.convert(y)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(y){let S=y===Ze&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(y!==dn&&y!==An&&!S&&n.convert(y)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(y){if(y==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";y="mediump"}return y==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=e.precision!==void 0?e.precision:"highp",u=l(h);u!==h&&(Kt("WebGLRenderer:",h,"not supported, using",u,"instead."),h=u);let f=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),p=e.logarithmicDepthBuffer===!0&&f===!1;e.reversedDepthBuffer===!0&&f===!1&&Kt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),e.logarithmicDepthBuffer===!0&&f===!0&&Kt("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");let d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),m=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),c=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),g=i.getParameter(i.MAX_VERTEX_ATTRIBS),_=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),M=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),R=i.getParameter(i.MAX_SAMPLES),w=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:h,logarithmicDepthBuffer:p,reversedDepthBuffer:f,maxTextures:d,maxVertexTextures:m,maxTextureSize:x,maxCubemapSize:c,maxAttributes:g,maxVertexUniforms:_,maxVaryings:M,maxFragmentUniforms:v,maxSamples:R,samples:w}}function B0(i){let t=this,e=null,n=0,s=!1,r=!1,a=new Nn,o=new te,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,p){let d=f.length!==0||p||n!==0||s;return s=p,n=f.length,d},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,p){e=u(f,p,0)},this.setState=function(f,p,d){let m=f.clippingPlanes,x=f.clipIntersection,c=f.clipShadows,g=i.get(f);if(!s||m===null||m.length===0||r&&!c)r?u(null):h();else{let _=r?0:n,M=_*4,v=g.clippingState||null;l.value=v,v=u(m,p,M,d);for(let R=0;R!==M;++R)v[R]=e[R];g.clippingState=v,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=_}};function h(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(f,p,d,m){let x=f!==null?f.length:0,c=null;if(x!==0){if(c=l.value,m!==!0||c===null){let g=d+x*4,_=p.matrixWorldInverse;o.getNormalMatrix(_),(c===null||c.length<g)&&(c=new Float32Array(g));for(let M=0,v=d;M!==x;++M,v+=4)a.copy(f[M]).applyMatrix4(_,o),a.normal.toArray(c,v),c[v+3]=a.constant}l.value=c,l.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,c}}var Zr=class extends Oe{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new lr(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Ti(5,5,5),r=new Fe({name:"CubemapFromEquirect",uniforms:Qi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:un,blending:si});r.uniforms.tEquirect.value=e;let a=new pt(s,r),o=e.minFilter;return e.minFilter===ri&&(e.minFilter=cn),new Cs(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}},Iu=256,z0=3,k0=20,ju=256,td=16,H0=3,G0=new H,V0=new Yt,jo=class i{constructor(t){this._renderer=t,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new Cs(1,10,null),this._boxMesh=new pt(new Ti(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){let{size:a=256,position:o=G0}=r,l=this._renderer;this._setSize(a);let h=this._allocateTarget(),u=this._getSourceTarget(!0);e>0&&(u.texture.mipmapsAutoUpdate=!1);let f=l.autoClear,p=l.autoClearColor,d=l.autoClearDepth,m=l.autoClearStencil,x=t.background;l.autoClear=!0,l.autoClearColor=!0,l.autoClearDepth=!0,l.autoClearStencil=!0,x===null&&(t.background=l.getClearColor(V0));let c=new Cs(n,s,u);return c.position.copy(o),c.update(l,t),l.autoClear=f,l.autoClearColor=p,l.autoClearDepth=d,l.autoClearStencil=m,t.background=x,e>0&&(u.texture.mipmapsAutoUpdate=!0,this._blur(h,e)),this._applyPMREM(h),h}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Du(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Lu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(t,e){return e>0?1-Math.sqrt(1-t/e):0}_setSize(t){this._cubeSize=Math.max(Iu,Su(t))}_fromTexture(t,e){t.mapping===$i||t.mapping===Ps?this._setSize(t.image.length===0?Iu:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4);let n=e||this._allocateTarget();return this._textureToCubemap(t),this._applyPMREM(n),n}_allocateTarget(){let t=this._cubeSize,e=Pu(t,!1,!1),n=Math.log2(t)-z0;for(let s=0;s<=n;s++)e.texture.mipmaps.push({width:t>>s,height:t>>s});return e.texture.name="PMREM",e.texture.isPMREMTexture=!0,e}_getSourceTarget(t=!1){let e=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==e||t&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Pu(e,!0,t)),this._sourceTarget}_compileMaterial(t){this._boxMesh.material=t,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(t,e,n){let s=this._boxMesh,r=this._cubeCamera;s.material=n,r.renderTarget=t,r.activeMipmapLevel=e;let a=t.width>>e;t.viewport.set(0,0,a,a),r.update(this._renderer,s),t.viewport.set(0,0,t.width,t.height)}_textureToCubemap(t){let e;t.mapping===$i||t.mapping===Ps?(this._cubemapMaterial===null&&(this._cubemapMaterial=Du()),e=this._cubemapMaterial,e.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=Lu()),e=this._equirectMaterial),e.uniforms.envMap.value=t,this._renderCube(this._getSourceTarget(),0,e)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=W0(),this._integrationMaterial=X0());let e=this._cubeSize,n=t.texture.mipmaps.length-1,s=this._ggxMaterial.uniforms;s.envMap.value=this._sourceTarget.texture;let r=this._integrationMaterial.uniforms;r.envMap.value=this._sourceTarget.texture,r.sourceLod.value=Math.log2(e/td);for(let a=0;a<=n;a++){let o=i.lodToRoughness(a,n);if(a>n-H0)r.roughness.value=o,this._renderCube(t,a,this._integrationMaterial);else{let l=o>0?Math.log2(e)+.5*Math.log2(6/(ju*Math.pow(o,4)))+.5:0;s.roughness.value=o,s.lodBias.value=l,this._renderCube(t,a,this._ggxMaterial)}}}_blur(t,e){this._blurMaterial===null&&(this._blurMaterial=q0());let n=this._blurMaterial,s=n.uniforms,r=this._sourceTarget;s.sigma.value=Math.min(e,Math.PI)/Math.SQRT2,s.envMap.value=r.texture,this._renderCube(t,0,n),s.envMap.value=t.texture,this._renderCube(r,0,n)}};function Pu(i,t,e){return new Zr(i,{minFilter:ri,generateMipmaps:t,type:Ze,colorSpace:Qs,depthBuffer:e})}function Jr(i,t,e){return new Fe({name:i,uniforms:t,vertexShader:ce.cube_vert,fragmentShader:e,side:un,blending:si,depthTest:!1,depthWrite:!1})}function W0(){return Jr("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${ju}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function X0(){return Jr("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:td}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function q0(){return Jr("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${k0}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function Lu(){return Jr("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function Du(){return Jr("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function Y0(i){let t=new WeakMap,e=new WeakMap,n=null;function s(p,d=!1){return p==null?null:d?a(p):r(p)}function r(p){if(p&&p.isTexture){let d=p.mapping;if(d===co||d===ho)if(t.has(p)){let m=t.get(p).texture;return o(m,p.mapping)}else{let m=p.image;if(m&&m.height>0){let x=new Zr(m.height);return x.fromEquirectangularTexture(i,p),t.set(p,x),p.addEventListener("dispose",h),o(x.texture,p.mapping)}else return null}}return p}function a(p){if(p&&p.isTexture&&p.isPMREMTexture!==!0){let d=p.mapping,m=d===co||d===ho,x=d===$i||d===Ps;if(m||x){let c=e.get(p),g=c!==void 0?c.texture.pmremVersion:0;if(p.isRenderTargetTexture&&p.pmremVersion!==g)return n===null&&(n=new jo(i)),c=m?n.fromEquirectangular(p,c):n.fromCubemap(p,c),c.texture.pmremVersion=p.pmremVersion,e.set(p,c),c.texture;if(c!==void 0)return c.texture;{let _=p.image;return m&&_&&_.height>0||x&&_&&l(_)?(n===null&&(n=new jo(i)),c=m?n.fromEquirectangular(p):n.fromCubemap(p),c.texture.pmremVersion=p.pmremVersion,e.set(p,c),p.addEventListener("dispose",u),c.texture):null}}}return p}function o(p,d){return d===co?p.mapping=$i:d===ho&&(p.mapping=Ps),p}function l(p){let d=0,m=6;for(let x=0;x<m;x++)p[x]!==void 0&&d++;return d===m}function h(p){let d=p.target;d.removeEventListener("dispose",h);let m=t.get(d);m!==void 0&&(t.delete(d),m.dispose())}function u(p){let d=p.target;d.removeEventListener("dispose",u);let m=e.get(d);m!==void 0&&(e.delete(d),m.dispose())}function f(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:f}}function Z0(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&Zs("WebGLRenderer: "+n+" extension not supported."),s}}}function J0(i,t,e,n){let s={},r=new WeakMap,a=new FinalizationRegistry(m=>delete s[m]);function o(m){l(m.target)}function l(m){m.index!==null&&t.remove(m.index);for(let c in m.attributes)t.remove(m.attributes[c]);m.removeEventListener("dispose",o),delete s[m.id],a.unregister(m);let x=r.get(m);x&&(t.remove(x),r.delete(m)),n.releaseStatesOfGeometry(m),m.isInstancedBufferGeometry===!0&&delete m._maxInstanceCount,e.memory.geometries--}function h(m,x){return s[x.id]!==void 0||(x.addEventListener("dispose",o),s[x.id]=new WeakRef(x),a.register(x,x.id,x),e.memory.geometries++),x}function u(m){let x=m.attributes;for(let c in x)t.update(x[c],i.ARRAY_BUFFER)}function f(m){let x=m.index,c=m.attributes.position,g=0;if(c===void 0)return;let _=x!==null?x.array.length:c.array.length/3-1,M=c.count>=65535?rr:sr,v=new M(Math.ceil(_/3)*6,1),R=v.array;if(x!==null){let y=x.array;g=x.version;for(let S=0,D=0;S<_;S+=3){let L=y[S+0],U=y[S+1],z=y[S+2];R[D++]=L,R[D++]=U,R[D++]=U,R[D++]=z,R[D++]=z,R[D++]=L}}else{g=c.version;for(let y=0,S=0;y<_;y+=3){let D=y+0,L=y+1,U=y+2;R[S++]=D,R[S++]=L,R[S++]=L,R[S++]=U,R[S++]=U,R[S++]=D}}v.version=g;let w=r.get(m);w&&t.remove(w),r.set(m,v)}function p(m){let x=r.get(m);if(x){let c=m.index;c!==null&&x.version<c.version&&f(m)}else f(m);return r.get(m)}function d(){for(let m in s){let x=s[m].deref();x!==void 0&&l(x)}}return{get:h,update:u,getWireframeAttribute:p,dispose:d}}function $0(i,t,e){let n;function s(f){n=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function l(f,p){i.drawElements(n,p,r,f*a),e.update(p,n,1)}function h(f,p,d){d!==0&&(i.drawElementsInstanced(n,p,r,f*a,d),e.update(p,n,d))}function u(f,p,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,p,0,r,f,0,d);let x=0;for(let c=0;c<d;c++)x+=p[c];e.update(x,n,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=h,this.renderMultiDraw=u}function K0(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:Qt("WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function Q0(i,t,e){let n=new WeakMap,s=new Ce;function r(a,o,l){let h=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=u!==void 0?u.length:0,p=n.get(o);if(p===void 0||p.count!==f){let D=function(){y.dispose(),n.delete(o),o.removeEventListener("dispose",D)};p!==void 0&&p.texture.dispose();let d=o.morphAttributes.position!==void 0,m=o.morphAttributes.normal!==void 0,x=o.morphAttributes.color!==void 0,c=o.morphAttributes.position||[],g=o.morphAttributes.normal||[],_=o.morphAttributes.color||[],M=0;d===!0&&(M=1),m===!0&&(M=2),x===!0&&(M=3);let v=o.attributes.position.count*M,R=1;v>t.maxTextureSize&&(R=Math.ceil(v/t.maxTextureSize),v=t.maxTextureSize);let w=new Float32Array(v*R*4*f),y=new er(w,v,R,f);y.type=An,y.needsUpdate=!0;let S=M*4;for(let L=0;L<f;L++){let U=c[L],z=g[L],G=_[L],N=v*R*4*L;for(let q=0;q<U.count;q++){let Y=q*S;d===!0&&(s.fromBufferAttribute(U,q),w[N+Y+0]=s.x,w[N+Y+1]=s.y,w[N+Y+2]=s.z,w[N+Y+3]=0),m===!0&&(s.fromBufferAttribute(z,q),w[N+Y+4]=s.x,w[N+Y+5]=s.y,w[N+Y+6]=s.z,w[N+Y+7]=0),x===!0&&(s.fromBufferAttribute(G,q),w[N+Y+8]=s.x,w[N+Y+9]=s.y,w[N+Y+10]=s.z,w[N+Y+11]=G.itemSize===4?s.w:1)}}p={count:f,texture:y,size:new ft(v,R)},n.set(o,p),o.addEventListener("dispose",D)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let d=0;for(let x=0;x<h.length;x++)d+=h[x];let m=o.morphTargetsRelative?1:1-d;l.getUniforms().setValue(i,"morphTargetBaseInfluence",m),l.getUniforms().setValue(i,"morphTargetInfluences",h)}l.getUniforms().setValue(i,"morphTargetsTexture",p.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",p.size)}return{update:r}}function j0(i,t,e,n,s){let r=new WeakMap;function a(h){let u=s.render.frame,f=h.geometry,p=t.get(h,f);if(r.get(p)!==u&&(t.update(p),r.set(p,u)),h.isInstancedMesh&&(h.hasEventListener("dispose",l)===!1&&h.addEventListener("dispose",l),r.get(h)!==u&&(e.update(h.instanceMatrix,i.ARRAY_BUFFER),h.instanceColor!==null&&e.update(h.instanceColor,i.ARRAY_BUFFER),r.set(h,u))),h.isSkinnedMesh){let d=h.skeleton;r.get(d)!==u&&(d.update(),r.set(d,u))}return p}function o(){r=new WeakMap}function l(h){let u=h.target;u.removeEventListener("dispose",l),n.releaseStatesOfObject(u),e.remove(u.instanceMatrix),u.instanceColor!==null&&e.remove(u.instanceColor)}return{update:a,dispose:o}}var tg={[Dr]:"LINEAR_TONE_MAPPING",[Nr]:"REINHARD_TONE_MAPPING",[Ur]:"CINEON_TONE_MAPPING",[Ji]:"ACES_FILMIC_TONE_MAPPING",[Or]:"AGX_TONE_MAPPING",[Br]:"NEUTRAL_TONE_MAPPING",[Fr]:"CUSTOM_TONE_MAPPING"};function eg(i,t,e,n,s,r){let a=new Oe(t,e,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,h=null,u=new De;u.setAttribute("position",new he([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute("uv",new he([0,2,0,0,2,0],2));let f=new Es({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),p=new pt(u,f),d=new Xi(-1,1,1,-1,0,1),m=null,x=null,c=!1,g,_=null,M=[],v=!1;this.setSize=function(R,w){a.setSize(R,w),o!==null&&o.setSize(R,w),l!==null&&l.setSize(R,w);for(let y=0;y<M.length;y++){let S=M[y];S.setSize&&S.setSize(R,w)}},this.setEffects=function(R){M=R,v=M.length>0&&M[0].isRenderPass===!0;let w=a.width,y=a.height;M.length>0&&o===null&&(o=new Oe(w,y,{type:Ze,depthBuffer:!1,stencilBuffer:!1}),l=new Oe(w,y,{type:Ze,depthBuffer:!1,stencilBuffer:!1}));let S=s===!0&&M.some(D=>D.needsDepthTexture===!0);S!==(a.depthTexture!==null)&&(S===!0&&h===null&&(h=new ni(w,y),r===!0&&(h.format=ai,h.type=Ki)),a.dispose(),a.depthTexture=S?h:null,a.resolveDepthBuffer=S,a.storeMultisampledDepthBuffer=S);for(let D=0;D<M.length;D++){let L=M[D];L.setSize&&L.setSize(w,y),S&&L.needsDepthTexture===!0&&L.setDepthTexture&&L.setDepthTexture(h)}},this.begin=function(R,w){if(c||R.toneMapping===Xn&&M.length===0)return!1;if(_=w,w!==null){let y=w.width,S=w.height;(a.width!==y||a.height!==S)&&this.setSize(y,S)}return v===!1&&R.setRenderTarget(a),g=R.toneMapping,R.toneMapping=Xn,!0},this.hasRenderPass=function(){return v},this.end=function(R,w){R.toneMapping=g,c=!0;let y=a,S=o;for(let D=0;D<M.length;D++){let L=M[D];L.enabled!==!1&&(L.render(R,S,y,w),L.needsSwap!==!1&&(y=S,S=S===o?l:o))}if(m!==R.outputColorSpace||x!==R.toneMapping){m=R.outputColorSpace,x=R.toneMapping,f.defines={},ue.getTransfer(m)===_e&&(f.defines.SRGB_TRANSFER="");let D=tg[x];D&&(f.defines[D]=""),f.needsUpdate=!0}f.uniforms.tDiffuse.value=y.texture,R.setRenderTarget(_),R.render(p,d),_=null,c=!1},this.isCompositing=function(){return c},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),u.dispose(),f.dispose()}}var ed=new hn,nd=new ni(1,1),id=new cr(1),sd=new er,rd=new Ha,ad=new lr,Nu=[],Uu=[],Fu=new Float32Array(16),Ou=new Float32Array(9),Bu=new Float32Array(4);function Us(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=Nu[s];if(r===void 0&&(r=new Float32Array(s),Nu[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function ze(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function ke(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function el(i,t){let e=Uu[t];e===void 0&&(e=new Int32Array(t),Uu[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function ng(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function ig(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ze(e,t))return;i.uniform2fv(this.addr,t),ke(e,t)}}function sg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(ze(e,t))return;i.uniform3fv(this.addr,t),ke(e,t)}}function rg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ze(e,t))return;i.uniform4fv(this.addr,t),ke(e,t)}}function ag(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(ze(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),ke(e,t)}else{if(ze(e,n))return;Bu.set(n),i.uniformMatrix2fv(this.addr,!1,Bu),ke(e,n)}}function og(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(ze(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),ke(e,t)}else{if(ze(e,n))return;Ou.set(n),i.uniformMatrix3fv(this.addr,!1,Ou),ke(e,n)}}function lg(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(ze(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),ke(e,t)}else{if(ze(e,n))return;Fu.set(n),i.uniformMatrix4fv(this.addr,!1,Fu),ke(e,n)}}function cg(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function hg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ze(e,t))return;i.uniform2iv(this.addr,t),ke(e,t)}}function ug(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ze(e,t))return;i.uniform3iv(this.addr,t),ke(e,t)}}function dg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ze(e,t))return;i.uniform4iv(this.addr,t),ke(e,t)}}function fg(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function pg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ze(e,t))return;i.uniform2uiv(this.addr,t),ke(e,t)}}function mg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ze(e,t))return;i.uniform3uiv(this.addr,t),ke(e,t)}}function gg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ze(e,t))return;i.uniform4uiv(this.addr,t),ke(e,t)}}function nl(i){return i.version===0&&(i.compareFunction=gc,i.needsUpdate=!0),i}function xg(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?r=nl(nd):r=ed,e.setTexture2D(t||r,s)}function _g(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||rd,s)}function yg(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_CUBE_SHADOW?r=nl(id):r=ad,e.setTextureCube(t||r,s)}function vg(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||sd,s)}function Mg(i){switch(i){case 5126:return ng;case 35664:return ig;case 35665:return sg;case 35666:return rg;case 35674:return ag;case 35675:return og;case 35676:return lg;case 5124:case 35670:return cg;case 35667:case 35671:return hg;case 35668:case 35672:return ug;case 35669:case 35673:return dg;case 5125:return fg;case 36294:return pg;case 36295:return mg;case 36296:return gg;case 35678:case 36198:case 36298:case 36306:case 35682:return xg;case 35679:case 36299:case 36307:return _g;case 35680:case 36300:case 36308:case 36293:return yg;case 36289:case 36303:case 36311:case 36292:return vg}}function Sg(i,t){i.uniform1fv(this.addr,t)}function bg(i,t){let e=Us(t,this.size,2);i.uniform2fv(this.addr,e)}function Tg(i,t){let e=Us(t,this.size,3);i.uniform3fv(this.addr,e)}function Eg(i,t){let e=Us(t,this.size,4);i.uniform4fv(this.addr,e)}function wg(i,t){let e=Us(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Ag(i,t){let e=Us(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Rg(i,t){let e=Us(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Cg(i,t){i.uniform1iv(this.addr,t)}function Ig(i,t){i.uniform2iv(this.addr,t)}function Pg(i,t){i.uniform3iv(this.addr,t)}function Lg(i,t){i.uniform4iv(this.addr,t)}function Dg(i,t){i.uniform1uiv(this.addr,t)}function Ng(i,t){i.uniform2uiv(this.addr,t)}function Ug(i,t){i.uniform3uiv(this.addr,t)}function Fg(i,t){i.uniform4uiv(this.addr,t)}function Og(i,t,e){let n=this.cache,s=t.length,r=el(e,s);ze(n,r)||(i.uniform1iv(this.addr,r),ke(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=nl(nd):a=ed;for(let o=0;o!==s;++o)e.setTexture2D(t[o]||a,r[o])}function Bg(i,t,e){let n=this.cache,s=t.length,r=el(e,s);ze(n,r)||(i.uniform1iv(this.addr,r),ke(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||rd,r[a])}function zg(i,t,e){let n=this.cache,s=t.length,r=el(e,s);ze(n,r)||(i.uniform1iv(this.addr,r),ke(n,r));let a;this.type===i.SAMPLER_CUBE_SHADOW?a=nl(id):a=ad;for(let o=0;o!==s;++o)e.setTextureCube(t[o]||a,r[o])}function kg(i,t,e){let n=this.cache,s=t.length,r=el(e,s);ze(n,r)||(i.uniform1iv(this.addr,r),ke(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||sd,r[a])}function Hg(i){switch(i){case 5126:return Sg;case 35664:return bg;case 35665:return Tg;case 35666:return Eg;case 35674:return wg;case 35675:return Ag;case 35676:return Rg;case 5124:case 35670:return Cg;case 35667:case 35671:return Ig;case 35668:case 35672:return Pg;case 35669:case 35673:return Lg;case 5125:return Dg;case 36294:return Ng;case 36295:return Ug;case 36296:return Fg;case 35678:case 36198:case 36298:case 36306:case 35682:return Og;case 35679:case 36299:case 36307:return Bg;case 35680:case 36300:case 36308:case 36293:return zg;case 36289:case 36303:case 36311:case 36292:return kg}}var Dc=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Mg(e.type)}},Nc=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Hg(e.type)}},Uc=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(t,e[o.id],n)}}},Pc=/(\w+)(\])?(\[|\.)?/g;function zu(i,t){i.seq.push(t),i.map[t.id]=t}function Gg(i,t,e){let n=i.name,s=n.length;for(Pc.lastIndex=0;;){let r=Pc.exec(n),a=Pc.lastIndex,o=r[1],l=r[2]==="]",h=r[3];if(l&&(o=o|0),h===void 0||h==="["&&a+2===s){zu(e,h===void 0?new Dc(o,i,t):new Nc(o,i,t));break}else{let f=e.map[o];f===void 0&&(f=new Uc(o),zu(e,f)),e=f}}}var Ns=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=t.getActiveUniform(e,a),l=t.getUniformLocation(e,o.name);Gg(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){let o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let a=t[s];a.id in e&&n.push(a)}return n}};function ku(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var Vg=37297,Wg=0;function Xg(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}var Hu=new te;function qg(i){ue._getMatrix(Hu,ue.workingColorSpace,i);let t=`mat3( ${Hu.elements.map(e=>e.toFixed(4))} )`;switch(ue.getTransfer(i)){case js:return[t,"LinearTransferOETF"];case _e:return[t,"sRGBTransferOETF"];default:return Kt("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Gu(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+Xg(i.getShaderSource(t),o)}else return r}function Yg(i,t){let e=qg(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( ${e[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}var Zg={[Dr]:"Linear",[Nr]:"Reinhard",[Ur]:"Cineon",[Ji]:"ACESFilmic",[Or]:"AgX",[Br]:"Neutral",[Fr]:"Custom"};function Jg(i,t){let e=Zg[t];return e===void 0?(Kt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var Qo=new H;function $g(){ue.getLuminanceCoefficients(Qo);let i=Qo.x.toFixed(4),t=Qo.y.toFixed(4),e=Qo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Kg(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Yr).join(`
`)}function Qg(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function jg(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function Yr(i){return i!==""}function Vu(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function Wu(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var tx=/^[ \t]*#include +<([\w\d./]+)>/gm;function Fc(i){return i.replace(tx,ex)}function ex(i,t){let e=ce[t];if(e===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">");return Fc(e)}var nx=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Xu(i){return i.replace(nx,ix)}function ix(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function qu(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}var sx={[qi]:"SHADOWMAP_TYPE_PCF",[Is]:"SHADOWMAP_TYPE_VSM"};function rx(i){return sx[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var ax={[Ps]:"ENVMAP_MODE_REFRACTION"};function ox(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":ax[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var lx={[ac]:"ENVMAP_BLENDING_MULTIPLY",[au]:"ENVMAP_BLENDING_MIX",[ou]:"ENVMAP_BLENDING_ADD"};function cx(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":lx[i.combine]||"ENVMAP_BLENDING_NONE"}function hx(i,t,e,n){let s=i.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,l=rx(e),h=e.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",u=ox(e),f=cx(e),p=Kg(e),d=Qg(r),m=s.createProgram(),x,c,g=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(x=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d].filter(Yr).join(`
`),x.length>0&&(x+=`
`),c=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d].filter(Yr).join(`
`),c.length>0&&(c+=`
`)):(x=[qu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+e.diffuseRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Yr).join(`
`),c=[qu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",e.envMap?"#define "+f:"",e.envMapPMREM?"#define ENVMAP_MAX_LOD "+e.envMapMaxLod+".0":"",e.envMapPMREM?"#define ENVMAP_SIZE "+e.envMapSize+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",e.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Xn?"#define TONE_MAPPING":"",e.toneMapping!==Xn?ce.tonemapping_pars_fragment:"",e.toneMapping!==Xn?Jg("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",ce.colorspace_pars_fragment,Yg("linearToOutputTexel",e.outputColorSpace),$g(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Yr).join(`
`)),a=Fc(a),a=Vu(a,e),a=Wu(a,e),o=Fc(o),o=Vu(o,e),o=Wu(o,e),a=Xu(a),o=Xu(o),e.isRawShaderMaterial!==!0&&(g=`#version 300 es
`,x=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+x,c=["#define varying in",e.glslVersion===_c?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===_c?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+c);let _=g+x+a,M=g+c+o,v=ku(s,s.VERTEX_SHADER,_),R=ku(s,s.FRAGMENT_SHADER,M);s.attachShader(m,v),s.attachShader(m,R),e.index0AttributeName!==void 0?s.bindAttribLocation(m,0,e.index0AttributeName):e.hasPositionAttribute===!0&&s.bindAttribLocation(m,0,"position"),s.linkProgram(m);function w(L){if(i.debug.checkShaderErrors){let U=s.getProgramInfoLog(m)||"",z=s.getShaderInfoLog(v)||"",G=s.getShaderInfoLog(R)||"",N=U.trim(),q=z.trim(),Y=G.trim(),W=!0,$=!0;if(s.getProgramParameter(m,s.LINK_STATUS)===!1)if(W=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,m,v,R);else{let X=Gu(s,v,"vertex"),j=Gu(s,R,"fragment");Qt("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(m,s.VALIDATE_STATUS)+`

Material Name: `+L.name+`
Material Type: `+L.type+`

Program Info Log: `+N+`
`+X+`
`+j)}else N!==""?Kt("WebGLProgram: Program Info Log:",N):(q===""||Y==="")&&($=!1);$&&(L.diagnostics={runnable:W,programLog:N,vertexShader:{log:q,prefix:x},fragmentShader:{log:Y,prefix:c}})}s.deleteShader(v),s.deleteShader(R),y=new Ns(s,m),S=jg(s,m)}let y;this.getUniforms=function(){return y===void 0&&w(this),y};let S;this.getAttributes=function(){return S===void 0&&w(this),S};let D=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return D===!1&&(D=s.getProgramParameter(m,Vg)),D},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(m),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Wg++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=v,this.fragmentShader=R,this}var ux=0,Oc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){let s=this._getShaderCacheForMaterial(t);return s.has(e)===!1&&(s.add(e),e.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new Bc(t),e.set(t,n)),n}},Bc=class{constructor(t){this.id=ux++,this.code=t,this.usedTimes=0}};function dx(i){return i===Ii||i===Wr||i===Xr}function fx(i,t,e,n,s,r){let a=new vs,o=new Oc,l=new Set,h=[],u=new Map,f=n.logarithmicDepthBuffer,p={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function d(y){return l.add(y),y===0?"uv":`uv${y}`}function m(y,S,D,L,U,z){let G=L.fog,N=U.geometry,q=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?L.environment:null,Y=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap,W=t.get(y.envMap||q,Y),$=p[y.type],X=n.precision;y.precision!==null&&(X=n.getMaxPrecision(y.precision),X!==y.precision&&Kt("WebGLProgram.getParameters:",y.precision,"not supported, using",X,"instead."));let j=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,it=j!==void 0?j.length:0,vt=0;N.morphAttributes.position!==void 0&&(vt=1),N.morphAttributes.normal!==void 0&&(vt=2),N.morphAttributes.color!==void 0&&(vt=3);let Bt,nt,Pt,zt;if($){let Nt=Yn[$];Bt=Nt.vertexShader,nt=Nt.fragmentShader}else{Bt=y.vertexShader,nt=y.fragmentShader;let Nt=o.getVertexShaderStage(y),Se=o.getFragmentShaderStage(y);o.update(y,Nt,Se),Pt=Nt.id,zt=Se.id}let Vt=i.getRenderTarget(),Lt=i.state.buffers.depth.getReversed(),Xt=U.isInstancedMesh===!0,Te=U.isBatchedMesh===!0,$t=!!y.map,ie=!!y.matcap,ae=!!W,ct=ae&&W.isPMREMTexture===!0,Mt=!!y.aoMap,St=!!y.lightMap,Ot=!!y.bumpMap&&y.wireframe===!1,At=!!y.normalMap,ee=!!y.displacementMap,b=!!y.emissiveMap,C=!!y.metalnessMap,B=!!y.roughnessMap,F=y.anisotropy>0,P=y.clearcoat>0,mt=y.diffuseRoughness>0,ut=y.dispersion>0,A=y.retroreflectivity>0,k=y.iridescence>0,tt=y.sheen>0,et=y.transmission>0,ht=F&&!!y.anisotropyMap,I=P&&!!y.clearcoatMap,T=P&&!!y.clearcoatNormalMap,Z=P&&!!y.clearcoatRoughnessMap,dt=mt&&!!y.diffuseRoughnessMap,lt=k&&!!y.iridescenceMap,bt=k&&!!y.iridescenceThicknessMap,Ct=tt&&!!y.sheenColorMap,rt=tt&&!!y.sheenRoughnessMap,at=!!y.specularMap,Et=!!y.specularColorMap,O=!!y.specularIntensityMap,ot=et&&!!y.transmissionMap,st=et&&!!y.thicknessMap,wt=!!y.gradientMap,yt=!!y.alphaMap,Tt=y.alphaTest>0,qt=!!y.alphaHash,le=!!y.extensions,xt=Xn;y.toneMapped&&(Vt===null||Vt.isXRRenderTarget===!0)&&(xt=i.toneMapping);let Jt=ct?W.isCompressedCubeTexture?W.image[0].mipmaps:W.mipmaps:null,oe={shaderID:$,shaderType:y.type,shaderName:y.name,vertexShader:Bt,fragmentShader:nt,defines:y.defines,customVertexShaderID:Pt,customFragmentShaderID:zt,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:X,batching:Te,batchingColor:Te&&U._colorsTexture!==null,instancing:Xt,instancingColor:Xt&&U.instanceColor!==null,instancingMorph:Xt&&U.morphTexture!==null,outputColorSpace:Vt===null?i.outputColorSpace:Vt.isXRRenderTarget===!0?Vt.texture.colorSpace:ue.workingColorSpace,alphaToCoverage:!!y.alphaToCoverage,map:$t,matcap:ie,envMap:ae,envMapMode:ae&&W.mapping,envMapPMREM:ct,envMapMaxLod:ct?Jt.length-1:null,envMapSize:ct?Jt[0].width:null,aoMap:Mt,lightMap:St,bumpMap:Ot,normalMap:At,displacementMap:ee,emissiveMap:b,normalMapObjectSpace:At&&y.normalMapType===hu,normalMapTangentSpace:At&&y.normalMapType===$o,packedNormalMap:At&&y.normalMapType===$o&&dx(y.normalMap.format),metalnessMap:C,roughnessMap:B,anisotropy:F,anisotropyMap:ht,clearcoat:P,clearcoatMap:I,clearcoatNormalMap:T,clearcoatRoughnessMap:Z,diffuseRoughness:mt,diffuseRoughnessMap:dt,dispersion:ut,retroreflection:A,iridescence:k,iridescenceMap:lt,iridescenceThicknessMap:bt,sheen:tt,sheenColorMap:Ct,sheenRoughnessMap:rt,specularMap:at,specularColorMap:Et,specularIntensityMap:O,transmission:et,transmissionMap:ot,thicknessMap:st,gradientMap:wt,opaque:y.transparent===!1&&y.blending===Ci&&y.alphaToCoverage===!1,alphaMap:yt,alphaTest:Tt,alphaHash:qt,combine:y.combine,mapUv:$t&&d(y.map.channel),aoMapUv:Mt&&d(y.aoMap.channel),lightMapUv:St&&d(y.lightMap.channel),bumpMapUv:Ot&&d(y.bumpMap.channel),normalMapUv:At&&d(y.normalMap.channel),displacementMapUv:ee&&d(y.displacementMap.channel),emissiveMapUv:b&&d(y.emissiveMap.channel),metalnessMapUv:C&&d(y.metalnessMap.channel),roughnessMapUv:B&&d(y.roughnessMap.channel),anisotropyMapUv:ht&&d(y.anisotropyMap.channel),clearcoatMapUv:I&&d(y.clearcoatMap.channel),clearcoatNormalMapUv:T&&d(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Z&&d(y.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:dt&&d(y.diffuseRoughnessMap.channel),iridescenceMapUv:lt&&d(y.iridescenceMap.channel),iridescenceThicknessMapUv:bt&&d(y.iridescenceThicknessMap.channel),sheenColorMapUv:Ct&&d(y.sheenColorMap.channel),sheenRoughnessMapUv:rt&&d(y.sheenRoughnessMap.channel),specularMapUv:at&&d(y.specularMap.channel),specularColorMapUv:Et&&d(y.specularColorMap.channel),specularIntensityMapUv:O&&d(y.specularIntensityMap.channel),transmissionMapUv:ot&&d(y.transmissionMap.channel),thicknessMapUv:st&&d(y.thicknessMap.channel),alphaMapUv:yt&&d(y.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(At||F),vertexNormals:!!N.attributes.normal,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!N.attributes.uv&&($t||yt),fog:!!G,useFog:y.fog===!0,fogExp2:!!G&&G.isFogExp2,flatShading:y.wireframe===!1&&(y.flatShading===!0||N.attributes.normal===void 0&&At===!1&&(y.isMeshLambertMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isMeshPhysicalMaterial)),sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:Lt,skinning:U.isSkinnedMesh===!0,hasPositionAttribute:N.attributes.position!==void 0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:it,morphTextureStride:vt,numSunLights:S.sun.length,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numSunLightShadows:S.sunShadowMap.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numLightProbeGrids:z.filter(Nt=>Nt.texture!==null).length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:y.dithering,shadowMapEnabled:i.shadowMap.enabled&&D.length>0,shadowMapType:i.shadowMap.type,toneMapping:xt,decodeVideoTexture:$t&&y.map.isVideoTexture===!0&&ue.getTransfer(y.map.colorSpace)===_e,decodeVideoTextureEmissive:b&&y.emissiveMap.isVideoTexture===!0&&ue.getTransfer(y.emissiveMap.colorSpace)===_e,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===wn,flipSided:y.side===un,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:le&&y.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(le&&y.extensions.multiDraw===!0||Te)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return oe.vertexUv1s=l.has(1),oe.vertexUv2s=l.has(2),oe.vertexUv3s=l.has(3),l.clear(),oe}function x(y){let S=[];if(y.shaderID?S.push(y.shaderID):(S.push(y.customVertexShaderID),S.push(y.customFragmentShaderID)),y.defines!==void 0)for(let D in y.defines)S.push(D),S.push(y.defines[D]);return y.isRawShaderMaterial===!1&&(c(S,y),g(S,y),S.push(i.outputColorSpace)),S.push(y.customProgramCacheKey),S.join()}function c(y,S){y.push(S.precision),y.push(S.outputColorSpace),y.push(S.envMapMode),y.push(S.envMapPMREM),y.push(S.envMapMaxLod),y.push(S.envMapSize),y.push(S.mapUv),y.push(S.alphaMapUv),y.push(S.lightMapUv),y.push(S.aoMapUv),y.push(S.bumpMapUv),y.push(S.normalMapUv),y.push(S.displacementMapUv),y.push(S.emissiveMapUv),y.push(S.metalnessMapUv),y.push(S.roughnessMapUv),y.push(S.anisotropyMapUv),y.push(S.clearcoatMapUv),y.push(S.clearcoatNormalMapUv),y.push(S.clearcoatRoughnessMapUv),y.push(S.diffuseRoughnessMapUv),y.push(S.iridescenceMapUv),y.push(S.iridescenceThicknessMapUv),y.push(S.sheenColorMapUv),y.push(S.sheenRoughnessMapUv),y.push(S.specularMapUv),y.push(S.specularColorMapUv),y.push(S.specularIntensityMapUv),y.push(S.transmissionMapUv),y.push(S.thicknessMapUv),y.push(S.combine),y.push(S.fogExp2),y.push(S.sizeAttenuation),y.push(S.morphTargetsCount),y.push(S.numSunLights),y.push(S.numDirLights),y.push(S.numPointLights),y.push(S.numSpotLights),y.push(S.numSpotLightMaps),y.push(S.numHemiLights),y.push(S.numRectAreaLights),y.push(S.numSunLightShadows),y.push(S.numDirLightShadows),y.push(S.numPointLightShadows),y.push(S.numSpotLightShadows),y.push(S.numSpotLightShadowsWithMaps),y.push(S.numLightProbes),y.push(S.numLightProbeGrids),y.push(S.shadowMapType),y.push(S.toneMapping),y.push(S.numClippingPlanes),y.push(S.numClipIntersection),y.push(S.depthPacking)}function g(y,S){a.disableAll(),S.instancing&&a.enable(0),S.instancingColor&&a.enable(1),S.instancingMorph&&a.enable(2),S.matcap&&a.enable(3),S.envMap&&a.enable(4),S.normalMapObjectSpace&&a.enable(5),S.normalMapTangentSpace&&a.enable(6),S.clearcoat&&a.enable(7),S.iridescence&&a.enable(8),S.alphaTest&&a.enable(9),S.vertexColors&&a.enable(10),S.vertexAlphas&&a.enable(11),S.vertexUv1s&&a.enable(12),S.vertexUv2s&&a.enable(13),S.vertexUv3s&&a.enable(14),S.vertexTangents&&a.enable(15),S.anisotropy&&a.enable(16),S.alphaHash&&a.enable(17),S.batching&&a.enable(18),S.dispersion&&a.enable(19),S.retroreflection&&a.enable(24),S.diffuseRoughness&&a.enable(25),S.batchingColor&&a.enable(20),S.gradientMap&&a.enable(21),S.packedNormalMap&&a.enable(22),S.vertexNormals&&a.enable(23),y.push(a.mask),a.disableAll(),S.fog&&a.enable(0),S.useFog&&a.enable(1),S.flatShading&&a.enable(2),S.logarithmicDepthBuffer&&a.enable(3),S.reversedDepthBuffer&&a.enable(4),S.skinning&&a.enable(5),S.morphTargets&&a.enable(6),S.morphNormals&&a.enable(7),S.morphColors&&a.enable(8),S.premultipliedAlpha&&a.enable(9),S.shadowMapEnabled&&a.enable(10),S.doubleSided&&a.enable(11),S.flipSided&&a.enable(12),S.useDepthPacking&&a.enable(13),S.dithering&&a.enable(14),S.transmission&&a.enable(15),S.sheen&&a.enable(16),S.opaque&&a.enable(17),S.pointsUvs&&a.enable(18),S.decodeVideoTexture&&a.enable(19),S.decodeVideoTextureEmissive&&a.enable(20),S.alphaToCoverage&&a.enable(21),S.numLightProbeGrids>0&&a.enable(22),S.hasPositionAttribute&&a.enable(23),y.push(a.mask)}function _(y){let S=p[y.type],D;if(S){let L=Yn[S];D=li.clone(L.uniforms)}else D=y.uniforms;return D}function M(y,S){let D=u.get(S);return D!==void 0?++D.usedTimes:(D=new hx(i,S,y,s),h.push(D),u.set(S,D)),D}function v(y){if(--y.usedTimes===0){let S=h.indexOf(y);h[S]=h[h.length-1],h.pop(),u.delete(y.cacheKey),y.destroy()}}function R(y){o.remove(y)}function w(){o.dispose()}return{getParameters:m,getProgramCacheKey:x,getUniforms:_,acquireProgram:M,releaseProgram:v,releaseShaderCache:R,programs:h,dispose:w}}function px(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function mx(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function Yu(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Zu(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(p){let d=0;return p.isInstancedMesh&&(d+=2),p.isSkinnedMesh&&(d+=1),d}function o(p,d,m,x,c,g){let _=i[t];return _===void 0?(_={id:p.id,object:p,geometry:d,material:m,materialVariant:a(p),groupOrder:x,renderOrder:p.renderOrder,z:c,group:g},i[t]=_):(_.id=p.id,_.object=p,_.geometry=d,_.material=m,_.materialVariant=a(p),_.groupOrder=x,_.renderOrder=p.renderOrder,_.z=c,_.group=g),t++,_}function l(p,d,m,x,c,g,_){_.reversedDepth===!0&&(c=-c);let M=o(p,d,m,x,c,g);m.transmission>0?n.push(M):m.transparent===!0?s.push(M):e.push(M)}function h(p,d,m,x,c,g){let _=o(p,d,m,x,c,g);m.transmission>0?n.unshift(_):m.transparent===!0?s.unshift(_):e.unshift(_)}function u(p,d){e.length>1&&e.sort(p||mx),n.length>1&&n.sort(d||Yu),s.length>1&&s.sort(d||Yu)}function f(){for(let p=t,d=i.length;p<d;p++){let m=i[p];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:l,unshift:h,finish:f,sort:u}}function gx(){let i=new WeakMap;function t(n,s){let r=i.get(n),a;return r===void 0?(a=new Zu,i.set(n,[a])):s>=r.length?(a=new Zu,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function xx(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new H,color:new Yt};break;case"SpotLight":e={position:new H,direction:new H,color:new Yt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new H,color:new Yt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new H,skyColor:new Yt,groundColor:new Yt};break;case"RectAreaLight":e={color:new Yt,position:new H,halfWidth:new H,halfHeight:new H};break}return i[t.id]=e,e}}}function _x(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var yx=0;function vx(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function Mx(i){let t=new xx,e=_x(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)n.probe.push(new H);let s=new H,r=new pe,a=new pe;function o(h){let u=0,f=0,p=0;for(let z=0;z<9;z++)n.probe[z].set(0,0,0);let d=0,m=0,x=0,c=0,g=0,_=0,M=0,v=0,R=0,w=0,y=0,S=0,D=0,L=0;h.sort(vx);for(let z=0,G=h.length;z<G;z++){let N=h[z],q=N.color,Y=N.intensity,W=N.distance,$=null;if(N.shadow&&N.shadow.map&&(N.shadow.map.texture.format===Ii?$=N.shadow.map.texture:$=N.shadow.map.depthTexture||N.shadow.map.texture),N.isAmbientLight)u+=q.r*Y,f+=q.g*Y,p+=q.b*Y;else if(N.isLightProbe){for(let X=0;X<9;X++)n.probe[X].addScaledVector(N.sh.coefficients[X],Y);L++}else if(N.isSunLight){let X=t.get(N);if(X.color.copy(N.color).multiplyScalar(N.intensity),N.castShadow){let j=N.shadow,it=e.get(N);it.shadowIntensity=j.intensity,it.shadowBias=j.bias,it.shadowNormalBias=j.normalBias,it.shadowRadius=j.radius,it.shadowMapSize.copy(j.mapSize).multiply(j.getFrameExtents()),n.sunShadow[m]=it,n.sunShadowMap[m]=$;let vt=j.getViewportCount();for(let Bt=0;Bt<vt;Bt++)n.sunShadowMatrix[x+Bt]=j.getMatrix(Bt),n.sunShadowCascade[x+Bt]=j._cascadeData[Bt];x+=vt,m++}n.sun[d]=X,d++}else if(N.isDirectionalLight){let X=t.get(N);if(X.color.copy(N.color).multiplyScalar(N.intensity),N.castShadow){let j=N.shadow,it=e.get(N);it.shadowIntensity=j.intensity,it.shadowBias=j.bias,it.shadowNormalBias=j.normalBias,it.shadowRadius=j.radius,it.shadowMapSize=j.mapSize,n.directionalShadow[c]=it,n.directionalShadowMap[c]=$,n.directionalShadowMatrix[c]=N.shadow.matrix,R++}n.directional[c]=X,c++}else if(N.isSpotLight){let X=t.get(N);X.position.setFromMatrixPosition(N.matrixWorld),X.color.copy(q).multiplyScalar(Y),X.distance=W,X.coneCos=Math.cos(N.angle),X.penumbraCos=Math.cos(N.angle*(1-N.penumbra)),X.decay=N.decay,n.spot[_]=X;let j=N.shadow;if(N.map&&(n.spotLightMap[S]=N.map,S++,j.updateMatrices(N),N.castShadow&&D++),n.spotLightMatrix[_]=j.matrix,N.castShadow){let it=e.get(N);it.shadowIntensity=j.intensity,it.shadowBias=j.bias,it.shadowNormalBias=j.normalBias,it.shadowRadius=j.radius,it.shadowMapSize=j.mapSize,n.spotShadow[_]=it,n.spotShadowMap[_]=$,y++}_++}else if(N.isRectAreaLight){let X=t.get(N);X.color.copy(q).multiplyScalar(Y),X.halfWidth.set(N.width*.5,0,0),X.halfHeight.set(0,N.height*.5,0),n.rectArea[M]=X,M++}else if(N.isPointLight){let X=t.get(N);if(X.color.copy(N.color).multiplyScalar(N.intensity),X.distance=N.distance,X.decay=N.decay,N.castShadow){let j=N.shadow,it=e.get(N);it.shadowIntensity=j.intensity,it.shadowBias=j.bias,it.shadowNormalBias=j.normalBias,it.shadowRadius=j.radius,it.shadowMapSize=j.mapSize,it.shadowCameraNear=j.camera.near,it.shadowCameraFar=j.camera.far,n.pointShadow[g]=it,n.pointShadowMap[g]=$,n.pointShadowMatrix[g]=N.shadow.matrix,w++}n.point[g]=X,g++}else if(N.isHemisphereLight){let X=t.get(N);X.skyColor.copy(N.color).multiplyScalar(Y),X.groundColor.copy(N.groundColor).multiplyScalar(Y),n.hemi[v]=X,v++}}M>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Ut.LTC_FLOAT_1,n.rectAreaLTC2=Ut.LTC_FLOAT_2):(n.rectAreaLTC1=Ut.LTC_HALF_1,n.rectAreaLTC2=Ut.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=f,n.ambient[2]=p;let U=n.hash;(U.sunLength!==d||U.directionalLength!==c||U.pointLength!==g||U.spotLength!==_||U.rectAreaLength!==M||U.hemiLength!==v||U.numSunShadows!==m||U.numDirectionalShadows!==R||U.numPointShadows!==w||U.numSpotShadows!==y||U.numSpotMaps!==S||U.numLightProbes!==L)&&(n.sun.length=d,n.directional.length=c,n.spot.length=_,n.rectArea.length=M,n.point.length=g,n.hemi.length=v,n.sunShadow.length=m,n.sunShadowMap.length=m,n.sunShadowMatrix.length=x,n.sunShadowCascade.length=x,n.directionalShadow.length=R,n.directionalShadowMap.length=R,n.directionalShadowMatrix.length=R,n.pointShadow.length=w,n.pointShadowMap.length=w,n.pointShadowMatrix.length=w,n.spotShadow.length=y,n.spotShadowMap.length=y,n.spotLightMatrix.length=y+S-D,n.spotLightMap.length=S,n.numSpotLightShadowsWithMaps=D,n.numLightProbes=L,U.sunLength=d,U.directionalLength=c,U.pointLength=g,U.spotLength=_,U.rectAreaLength=M,U.hemiLength=v,U.numSunShadows=m,U.numDirectionalShadows=R,U.numPointShadows=w,U.numSpotShadows=y,U.numSpotMaps=S,U.numLightProbes=L,n.version=yx++)}function l(h,u){let f=0,p=0,d=0,m=0,x=0,c=0,g=u.matrixWorldInverse;for(let _=0,M=h.length;_<M;_++){let v=h[_];if(v.isSunLight){let R=n.sun[f];R.direction.setFromMatrixPosition(v.matrixWorld),R.direction.transformDirection(g),f++}else if(v.isDirectionalLight){let R=n.directional[p];R.direction.setFromMatrixPosition(v.matrixWorld),s.setFromMatrixPosition(v.target.matrixWorld),R.direction.sub(s),R.direction.transformDirection(g),p++}else if(v.isSpotLight){let R=n.spot[m];R.position.setFromMatrixPosition(v.matrixWorld),R.position.applyMatrix4(g),R.direction.setFromMatrixPosition(v.matrixWorld),s.setFromMatrixPosition(v.target.matrixWorld),R.direction.sub(s),R.direction.transformDirection(g),m++}else if(v.isRectAreaLight){let R=n.rectArea[x];R.position.setFromMatrixPosition(v.matrixWorld),R.position.applyMatrix4(g),a.identity(),r.copy(v.matrixWorld),r.premultiply(g),a.extractRotation(r),R.halfWidth.set(v.width*.5,0,0),R.halfHeight.set(0,v.height*.5,0),R.halfWidth.applyMatrix4(a),R.halfHeight.applyMatrix4(a),x++}else if(v.isPointLight){let R=n.point[d];R.position.setFromMatrixPosition(v.matrixWorld),R.position.applyMatrix4(g),d++}else if(v.isHemisphereLight){let R=n.hemi[c];R.direction.setFromMatrixPosition(v.matrixWorld),R.direction.transformDirection(g),c++}}}return{setup:o,setupView:l,state:n}}function Ju(i){let t=new Mx(i),e=[],n=[],s=[];function r(f){u.camera=f,e.length=0,n.length=0,s.length=0}function a(f){f.isLightProbeGrid?s.push(f):e.push(f)}function o(f){n.push(f)}function l(){t.setup(e),s.sort((f,p)=>f.priority-p.priority||f.id-p.id)}function h(f){t.setupView(e,f)}let u={lightsArray:e,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:u,setupLights:l,setupLightsView:h,pushLight:a,pushShadow:o}}function Sx(i){let t=new WeakMap;function e(s,r=0){let a=t.get(s),o;return a===void 0?(o=new Ju(i),t.set(s,[o])):r>=a.length?(o=new Ju(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}var bx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Tx=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Ex=[new H(1,0,0),new H(-1,0,0),new H(0,1,0),new H(0,-1,0),new H(0,0,1),new H(0,0,-1)],wx=[new H(0,-1,0),new H(0,-1,0),new H(0,0,1),new H(0,0,-1),new H(0,-1,0),new H(0,-1,0)],$u=new pe,qr=new H,Lc=new H;function Ax(i,t,e){let n=new bi,s=new ft,r=new ft,a=new Ce,o=new Ja,l=new $a,h={},u=e.maxTextureSize,f={[Wn]:un,[un]:Wn,[wn]:wn},p=new Fe({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ft},radius:{value:4}},vertexShader:bx,fragmentShader:Tx}),d=p.clone();d.defines.HORIZONTAL_PASS=1;let m=new De;m.setAttribute("position",new xn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new pt(m,p),c=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=qi;let g=this.type;this.render=function(w,y,S){if(c.enabled===!1||c.autoUpdate===!1&&c.needsUpdate===!1||w.length===0)return;this.type===Hh&&(Kt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=qi);let D=i.getRenderTarget(),L=i.getActiveCubeFace(),U=i.getActiveMipmapLevel(),z=i.state;z.setBlending(si),z.buffers.depth.getReversed()===!0?z.buffers.color.setClear(0,0,0,0):z.buffers.color.setClear(1,1,1,1),z.buffers.depth.setTest(!0),z.setScissorTest(!1);let G=g!==this.type;G&&y.traverse(function(N){N.material&&(Array.isArray(N.material)?N.material.forEach(q=>q.needsUpdate=!0):N.material.needsUpdate=!0)});for(let N=0,q=w.length;N<q;N++){let Y=w[N],W=Y.shadow;if(W===void 0){Kt("WebGLShadowMap:",Y,"has no shadow.");continue}if(W.autoUpdate===!1&&W.needsUpdate===!1)continue;s.copy(W.mapSize);let $=W.getFrameExtents();s.multiply($),r.copy(W.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/$.x),s.x=r.x*$.x,W.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/$.y),s.y=r.y*$.y,W.mapSize.y=r.y));let X=i.state.buffers.depth.getReversed();if(W.camera._reversedDepth=X,W.map===null||G===!0){if(W.map!==null&&(W.map.depthTexture!==null&&(W.map.depthTexture.dispose(),W.map.depthTexture=null),W.map.dispose()),this.type===Is){if(Y.isPointLight){Kt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}W.map=new Oe(s.x,s.y,{format:Ii,type:Ze,minFilter:cn,magFilter:cn,generateMipmaps:!1}),W.map.texture.name=Y.name+".shadowMap",W.map.depthTexture=new ni(s.x,s.y,An),W.map.depthTexture.name=Y.name+".shadowMapDepth",W.map.depthTexture.format=ei,W.map.depthTexture.compareFunction=null,W.map.depthTexture.minFilter=We,W.map.depthTexture.magFilter=We}else Y.isPointLight?(W.map=new Zr(s.x),W.map.depthTexture=new cr(s.x,Fn)):(W.map=new Oe(s.x,s.y),W.map.depthTexture=new ni(s.x,s.y,Fn)),W.map.depthTexture.name=Y.name+".shadowMap",W.map.depthTexture.format=ei,this.type===qi?(W.map.depthTexture.compareFunction=X?mc:pc,W.map.depthTexture.minFilter=cn,W.map.depthTexture.magFilter=cn):(W.map.depthTexture.compareFunction=null,W.map.depthTexture.minFilter=We,W.map.depthTexture.magFilter=We);W.camera.updateProjectionMatrix()}W.map.isWebGLCubeRenderTarget!==!0&&(W.map.width!==s.x||W.map.height!==s.y)&&W.map.setSize(s.x,s.y);let j=W.map.isWebGLCubeRenderTarget?6:W.getViewportCount();Y.isPointLight!==!0&&W.updateMatrices(Y,S);let it=(W.camera.layers.mask&4294967294)!==0?W.camera.layers:S.layers;for(let vt=0;vt<j;vt++){let Bt=W.getCamera(vt);if(Y.isPointLight){let nt=W.camera,Pt=W.matrix,zt=Y.distance||nt.far;zt!==nt.far&&(nt.far=zt,nt.updateProjectionMatrix()),qr.setFromMatrixPosition(Y.matrixWorld),nt.position.copy(qr),Lc.copy(nt.position),Lc.add(Ex[vt]),nt.up.copy(wx[vt]),nt.lookAt(Lc),nt.updateMatrixWorld(),Pt.makeTranslation(-qr.x,-qr.y,-qr.z),$u.multiplyMatrices(nt.projectionMatrix,nt.matrixWorldInverse),W._frustum.setFromProjectionMatrix($u,nt.coordinateSystem,nt.reversedDepth)}if(W.map.isWebGLCubeRenderTarget)i.setRenderTarget(W.map,vt),i.clear();else{vt===0&&(i.setRenderTarget(W.map),i.clear());let nt=W.getViewport(vt);a.set(r.x*nt.x,r.y*nt.y,r.x*nt.z,r.y*nt.w),z.viewport(a)}n=W.getFrustum(vt),v(y,S,Bt,Y,it,this.type)}W.isPointLightShadow!==!0&&this.type===Is&&_(W,S),W.needsUpdate=!1}g=this.type,c.needsUpdate=!1,i.setRenderTarget(D,L,U)};function _(w,y){let S=t.update(x);p.defines.VSM_SAMPLES!==w.blurSamples&&(p.defines.VSM_SAMPLES=w.blurSamples,d.defines.VSM_SAMPLES=w.blurSamples,p.needsUpdate=!0,d.needsUpdate=!0),w.mapPass===null?w.mapPass=new Oe(s.x,s.y,{format:Ii,type:Ze}):(w.mapPass.width!==w.map.width||w.mapPass.height!==w.map.height)&&w.mapPass.setSize(w.map.width,w.map.height),p.uniforms.shadow_pass.value=w.map.depthTexture,p.uniforms.resolution.value.set(w.map.width,w.map.height),p.uniforms.radius.value=w.radius,i.setRenderTarget(w.mapPass),i.clear(),i.renderBufferDirect(y,null,S,p,x,null),d.uniforms.shadow_pass.value=w.mapPass.texture,d.uniforms.resolution.value.set(w.map.width,w.map.height),d.uniforms.radius.value=w.radius,i.setRenderTarget(w.map),i.clear(),i.renderBufferDirect(y,null,S,d,x,null)}function M(w,y,S,D){let L=null,U=S.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(U!==void 0)L=U;else if(L=S.isPointLight===!0?l:o,i.localClippingEnabled&&y.clipShadows===!0&&Array.isArray(y.clippingPlanes)&&y.clippingPlanes.length!==0||y.displacementMap&&y.displacementScale!==0||y.alphaMap&&y.alphaTest>0||y.map&&y.alphaTest>0||y.alphaToCoverage===!0){let z=L.uuid,G=y.uuid,N=h[z];N===void 0&&(N={},h[z]=N);let q=N[G];q===void 0&&(q=L.clone(),N[G]=q,y.addEventListener("dispose",R)),L=q}if(L.visible=y.visible,L.wireframe=y.wireframe,D===Is?L.side=y.shadowSide!==null?y.shadowSide:y.side:L.side=y.shadowSide!==null?y.shadowSide:f[y.side],L.alphaMap=y.alphaMap,L.alphaTest=y.alphaToCoverage===!0?.5:y.alphaTest,L.map=y.map,L.clipShadows=y.clipShadows,L.clippingPlanes=y.clippingPlanes,L.clipIntersection=y.clipIntersection,L.displacementMap=y.displacementMap,L.displacementScale=y.displacementScale,L.displacementBias=y.displacementBias,L.wireframeLinewidth=y.wireframeLinewidth,L.linewidth=y.linewidth,S.isPointLight===!0&&L.isMeshDistanceMaterial===!0){let z=i.properties.get(L);z.light=S}return L}function v(w,y,S,D,L,U){if(w.visible===!1)return;if(w.layers.test(L)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&U===Is)&&(!w.frustumCulled||w.intersectsFrustum(n))){w.modelViewMatrix.multiplyMatrices(S.matrixWorldInverse,w.matrixWorld);let N=t.update(w),q=w.material;if(Array.isArray(q)){let Y=N.groups;for(let W=0,$=Y.length;W<$;W++){let X=Y[W],j=q[X.materialIndex];if(j&&j.visible){let it=M(w,j,D,U);w.onBeforeShadow(i,w,y,S,N,it,X),i.renderBufferDirect(S,null,N,it,w,X),w.onAfterShadow(i,w,y,S,N,it,X)}}}else if(q.visible){let Y=M(w,q,D,U);w.onBeforeShadow(i,w,y,S,N,Y,null),i.renderBufferDirect(S,null,N,Y,w,null),w.onAfterShadow(i,w,y,S,N,Y,null)}}let G=w.children;for(let N=0,q=G.length;N<q;N++)v(G[N],y,S,D,L,U)}function R(w){w.target.removeEventListener("dispose",R);for(let S in h){let D=h[S],L=w.target.uuid;L in D&&(D[L].dispose(),delete D[L])}}}function Rx(i,t){function e(){let O=!1,ot=new Ce,st=null,wt=new Ce(0,0,0,0);return{setMask:function(yt){st!==yt&&!O&&(i.colorMask(yt,yt,yt,yt),st=yt)},setLocked:function(yt){O=yt},setClear:function(yt,Tt,qt,le,xt){xt===!0&&(yt*=le,Tt*=le,qt*=le),ot.set(yt,Tt,qt,le),wt.equals(ot)===!1&&(i.clearColor(yt,Tt,qt,le),wt.copy(ot))},reset:function(){O=!1,st=null,wt.set(-1,0,0,0)}}}function n(){let O=!1,ot=!1,st=null,wt=null,yt=null;return{setReversed:function(Tt){if(ot!==Tt){let qt=t.get("EXT_clip_control");Tt?qt.clipControlEXT(qt.LOWER_LEFT_EXT,qt.ZERO_TO_ONE_EXT):qt.clipControlEXT(qt.LOWER_LEFT_EXT,qt.NEGATIVE_ONE_TO_ONE_EXT),ot=Tt;let le=yt;yt=null,this.setClear(le)}},getReversed:function(){return ot},setTest:function(Tt){Tt?Lt(i.DEPTH_TEST):Xt(i.DEPTH_TEST)},setMask:function(Tt){st!==Tt&&!O&&(i.depthMask(Tt),st=Tt)},setFunc:function(Tt){if(ot&&(Tt=Mu[Tt]),wt!==Tt){switch(Tt){case Ca:i.depthFunc(i.NEVER);break;case Ia:i.depthFunc(i.ALWAYS);break;case Pa:i.depthFunc(i.LESS);break;case ms:i.depthFunc(i.LEQUAL);break;case La:i.depthFunc(i.EQUAL);break;case Da:i.depthFunc(i.GEQUAL);break;case Na:i.depthFunc(i.GREATER);break;case Ua:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}wt=Tt}},setLocked:function(Tt){O=Tt},setClear:function(Tt){yt!==Tt&&(yt=Tt,ot&&(Tt=1-Tt),i.clearDepth(Tt))},reset:function(){O=!1,st=null,wt=null,yt=null,ot=!1}}}function s(){let O=!1,ot=null,st=null,wt=null,yt=null,Tt=null,qt=null,le=null,xt=null;return{setTest:function(Jt){O||(Jt?Lt(i.STENCIL_TEST):Xt(i.STENCIL_TEST))},setMask:function(Jt){ot!==Jt&&!O&&(i.stencilMask(Jt),ot=Jt)},setFunc:function(Jt,oe,Nt){(st!==Jt||wt!==oe||yt!==Nt)&&(i.stencilFunc(Jt,oe,Nt),st=Jt,wt=oe,yt=Nt)},setOp:function(Jt,oe,Nt){(Tt!==Jt||qt!==oe||le!==Nt)&&(i.stencilOp(Jt,oe,Nt),Tt=Jt,qt=oe,le=Nt)},setLocked:function(Jt){O=Jt},setClear:function(Jt){xt!==Jt&&(i.clearStencil(Jt),xt=Jt)},reset:function(){O=!1,ot=null,st=null,wt=null,yt=null,Tt=null,qt=null,le=null,xt=null}}}let r=new e,a=new n,o=new s,l={},h=new WeakMap,u={},f={},p={},d=new WeakMap,m=[],x=null,c=!1,g=null,_=null,M=null,v=null,R=null,w=null,y=null,S=new Yt(0,0,0),D=0,L=!1,U=null,z=null,G=null,N=null,q=null,Y=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),W=!1,$=0,X=i.getParameter(i.VERSION);X.indexOf("WebGL")!==-1?($=parseFloat(/^WebGL (\d)/.exec(X)[1]),W=$>=1):X.indexOf("OpenGL ES")!==-1&&($=parseFloat(/^OpenGL ES (\d)/.exec(X)[1]),W=$>=2);let j=null,it={},vt=i.getParameter(i.SCISSOR_BOX),Bt=i.getParameter(i.VIEWPORT),nt=new Ce().fromArray(vt),Pt=new Ce().fromArray(Bt);function zt(O,ot,st,wt){let yt=new Uint8Array(4),Tt=i.createTexture();i.bindTexture(O,Tt),i.texParameteri(O,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(O,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let qt=0;qt<st;qt++)O===i.TEXTURE_3D||O===i.TEXTURE_2D_ARRAY?i.texImage3D(ot,0,i.RGBA,1,1,wt,0,i.RGBA,i.UNSIGNED_BYTE,yt):i.texImage2D(ot+qt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,yt);return Tt}let Vt={};Vt[i.TEXTURE_2D]=zt(i.TEXTURE_2D,i.TEXTURE_2D,1),Vt[i.TEXTURE_CUBE_MAP]=zt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Vt[i.TEXTURE_2D_ARRAY]=zt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Vt[i.TEXTURE_3D]=zt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),Lt(i.DEPTH_TEST),a.setFunc(ms),Ot(!1),At(ec),Lt(i.CULL_FACE),Mt(si);function Lt(O){u[O]!==!0&&(i.enable(O),u[O]=!0)}function Xt(O){u[O]!==!1&&(i.disable(O),u[O]=!1)}function Te(O,ot){return p[O]!==ot?(i.bindFramebuffer(O,ot),p[O]=ot,O===i.DRAW_FRAMEBUFFER&&(p[i.FRAMEBUFFER]=ot),O===i.FRAMEBUFFER&&(p[i.DRAW_FRAMEBUFFER]=ot),!0):!1}function $t(O,ot){let st=m,wt=!1;if(O){st=d.get(ot),st===void 0&&(st=[],d.set(ot,st));let yt=O.textures;if(st.length!==yt.length||st[0]!==i.COLOR_ATTACHMENT0){for(let Tt=0,qt=yt.length;Tt<qt;Tt++)st[Tt]=i.COLOR_ATTACHMENT0+Tt;st.length=yt.length,wt=!0}}else st[0]!==i.BACK&&(st[0]=i.BACK,wt=!0);wt&&i.drawBuffers(st)}function ie(O){return x!==O?(i.useProgram(O),x=O,!0):!1}let ae={[Zi]:i.FUNC_ADD,[Vh]:i.FUNC_SUBTRACT,[Wh]:i.FUNC_REVERSE_SUBTRACT};ae[Xh]=i.MIN,ae[qh]=i.MAX;let ct={[Yh]:i.ZERO,[Zh]:i.ONE,[Jh]:i.SRC_COLOR,[sc]:i.SRC_ALPHA,[eu]:i.SRC_ALPHA_SATURATE,[jh]:i.DST_COLOR,[Kh]:i.DST_ALPHA,[$h]:i.ONE_MINUS_SRC_COLOR,[rc]:i.ONE_MINUS_SRC_ALPHA,[tu]:i.ONE_MINUS_DST_COLOR,[Qh]:i.ONE_MINUS_DST_ALPHA,[nu]:i.CONSTANT_COLOR,[iu]:i.ONE_MINUS_CONSTANT_COLOR,[su]:i.CONSTANT_ALPHA,[ru]:i.ONE_MINUS_CONSTANT_ALPHA};function Mt(O,ot,st,wt,yt,Tt,qt,le,xt,Jt){if(O===si){c===!0&&(Xt(i.BLEND),c=!1);return}if(c===!1&&(Lt(i.BLEND),c=!0),O!==Gh){if(O!==g||Jt!==L){if((_!==Zi||R!==Zi)&&(i.blendEquation(i.FUNC_ADD),_=Zi,R=Zi),Jt)switch(O){case Ci:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Yi:i.blendFunc(i.ONE,i.ONE);break;case nc:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case ic:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Qt("WebGLState: Invalid blending: ",O);break}else switch(O){case Ci:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Yi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case nc:Qt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case ic:Qt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Qt("WebGLState: Invalid blending: ",O);break}M=null,v=null,w=null,y=null,S.set(0,0,0),D=0,g=O,L=Jt}return}yt=yt||ot,Tt=Tt||st,qt=qt||wt,(ot!==_||yt!==R)&&(i.blendEquationSeparate(ae[ot],ae[yt]),_=ot,R=yt),(st!==M||wt!==v||Tt!==w||qt!==y)&&(i.blendFuncSeparate(ct[st],ct[wt],ct[Tt],ct[qt]),M=st,v=wt,w=Tt,y=qt),(le.equals(S)===!1||xt!==D)&&(i.blendColor(le.r,le.g,le.b,xt),S.copy(le),D=xt),g=O,L=!1}function St(O,ot){O.side===wn?Xt(i.CULL_FACE):Lt(i.CULL_FACE);let st=O.side===un;ot&&(st=!st),Ot(st),O.blending===Ci&&O.transparent===!1?Mt(si):Mt(O.blending,O.blendEquation,O.blendSrc,O.blendDst,O.blendEquationAlpha,O.blendSrcAlpha,O.blendDstAlpha,O.blendColor,O.blendAlpha,O.premultipliedAlpha),a.setFunc(O.depthFunc),a.setTest(O.depthTest),a.setMask(O.depthWrite),r.setMask(O.colorWrite);let wt=O.stencilWrite;o.setTest(wt),wt&&(o.setMask(O.stencilWriteMask),o.setFunc(O.stencilFunc,O.stencilRef,O.stencilFuncMask),o.setOp(O.stencilFail,O.stencilZFail,O.stencilZPass)),b(O.polygonOffset,O.polygonOffsetFactor,O.polygonOffsetUnits),O.alphaToCoverage===!0?Lt(i.SAMPLE_ALPHA_TO_COVERAGE):Xt(i.SAMPLE_ALPHA_TO_COVERAGE)}function Ot(O){U!==O&&(O?i.frontFace(i.CW):i.frontFace(i.CCW),U=O)}function At(O){O!==zh?(Lt(i.CULL_FACE),O!==z&&(O===ec?i.cullFace(i.BACK):O===kh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Xt(i.CULL_FACE),z=O}function ee(O){O!==G&&(W&&i.lineWidth(O),G=O)}function b(O,ot,st){O?(Lt(i.POLYGON_OFFSET_FILL),(N!==ot||q!==st)&&(N=ot,q=st,a.getReversed()&&(ot=-ot,st=-st),i.polygonOffset(ot,st))):Xt(i.POLYGON_OFFSET_FILL)}function C(O){O?Lt(i.SCISSOR_TEST):Xt(i.SCISSOR_TEST)}function B(O){O===void 0&&(O=i.TEXTURE0+Y-1),j!==O&&(i.activeTexture(O),j=O)}function F(O,ot,st){st===void 0&&(j===null?st=i.TEXTURE0+Y-1:st=j);let wt=it[st];wt===void 0&&(wt={type:void 0,texture:void 0},it[st]=wt),(wt.type!==O||wt.texture!==ot)&&(j!==st&&(i.activeTexture(st),j=st),i.bindTexture(O,ot||Vt[O]),wt.type=O,wt.texture=ot)}function P(){let O=it[j];O!==void 0&&O.type!==void 0&&(i.bindTexture(O.type,null),O.type=void 0,O.texture=void 0)}function mt(){try{i.compressedTexImage2D(...arguments)}catch(O){Qt("WebGLState:",O)}}function ut(){try{i.compressedTexImage3D(...arguments)}catch(O){Qt("WebGLState:",O)}}function A(){try{i.texSubImage2D(...arguments)}catch(O){Qt("WebGLState:",O)}}function k(){try{i.texSubImage3D(...arguments)}catch(O){Qt("WebGLState:",O)}}function tt(){try{i.compressedTexSubImage2D(...arguments)}catch(O){Qt("WebGLState:",O)}}function et(){try{i.compressedTexSubImage3D(...arguments)}catch(O){Qt("WebGLState:",O)}}function ht(){try{i.texStorage2D(...arguments)}catch(O){Qt("WebGLState:",O)}}function I(){try{i.texStorage3D(...arguments)}catch(O){Qt("WebGLState:",O)}}function T(){try{i.texImage2D(...arguments)}catch(O){Qt("WebGLState:",O)}}function Z(){try{i.texImage3D(...arguments)}catch(O){Qt("WebGLState:",O)}}function dt(O){return f[O]!==void 0?f[O]:i.getParameter(O)}function lt(O,ot){f[O]!==ot&&(i.pixelStorei(O,ot),f[O]=ot)}function bt(O){nt.equals(O)===!1&&(i.scissor(O.x,O.y,O.z,O.w),nt.copy(O))}function Ct(O){Pt.equals(O)===!1&&(i.viewport(O.x,O.y,O.z,O.w),Pt.copy(O))}function rt(O,ot){let st=h.get(ot);st===void 0&&(st=new WeakMap,h.set(ot,st));let wt=st.get(O);wt===void 0&&(wt=i.getUniformBlockIndex(ot,O.name),i.uniformBlockBinding(ot,wt,wt),st.set(O,wt))}function at(O,ot,st){let yt=h.get(ot).get(O);l[yt]!==st&&(i.bindBufferBase(i.UNIFORM_BUFFER,yt,st),l[yt]=st)}function Et(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),u={},f={},j=null,it={},p={},l={},d=new WeakMap,m=[],x=null,c=!1,g=null,_=null,M=null,v=null,R=null,w=null,y=null,S=new Yt(0,0,0),D=0,L=!1,U=null,z=null,G=null,N=null,q=null,nt.set(0,0,i.canvas.width,i.canvas.height),Pt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:Lt,disable:Xt,bindFramebuffer:Te,drawBuffers:$t,useProgram:ie,setBlending:Mt,setMaterial:St,setFlipSided:Ot,setCullFace:At,setLineWidth:ee,setPolygonOffset:b,setScissorTest:C,activeTexture:B,bindTexture:F,unbindTexture:P,compressedTexImage2D:mt,compressedTexImage3D:ut,texImage2D:T,texImage3D:Z,pixelStorei:lt,getParameter:dt,updateUBOMapping:rt,uniformBlockBinding:at,texStorage2D:ht,texStorage3D:I,texSubImage2D:A,texSubImage3D:k,compressedTexSubImage2D:tt,compressedTexSubImage3D:et,scissor:bt,viewport:Ct,reset:Et}}function Cx(i,t,e,n,s,r,a){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new ft,u=new WeakMap,f=new Set,p,d=new WeakMap,m=new Set,x=new FinalizationRegistry(I=>m.delete(I)),c=!1;try{c=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(I,T){return c?new OffscreenCanvas(I,T):tr("canvas")}function _(I,T,Z){let dt=1,lt=ht(I);if((lt.width>Z||lt.height>Z)&&(dt=Z/Math.max(lt.width,lt.height)),dt<1)if(typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&I instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&I instanceof ImageBitmap||typeof VideoFrame<"u"&&I instanceof VideoFrame){let bt=Math.floor(dt*lt.width),Ct=Math.floor(dt*lt.height);p===void 0&&(p=g(bt,Ct));let rt=T?g(bt,Ct):p;return rt.width=bt,rt.height=Ct,rt.getContext("2d").drawImage(I,0,0,bt,Ct),Kt("WebGLRenderer: Texture has been resized from ("+lt.width+"x"+lt.height+") to ("+bt+"x"+Ct+")."),rt}else return"data"in I&&Kt("WebGLRenderer: Image in DataTexture is too big ("+lt.width+"x"+lt.height+")."),I;return I}function M(I){return I.generateMipmaps}function v(I){i.generateMipmap(I)}function R(I){return I.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:I.isWebGL3DRenderTarget?i.TEXTURE_3D:I.isWebGLArrayRenderTarget||I.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function w(I,T,Z,dt,lt,bt=!1){if(I!==null){if(i[I]!==void 0)return i[I];Kt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+I+"'")}let Ct;dt&&(Ct=t.get("EXT_texture_norm16"),Ct||Kt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let rt=T;if(T===i.RED&&(Z===i.FLOAT&&(rt=i.R32F),Z===i.HALF_FLOAT&&(rt=i.R16F),Z===i.UNSIGNED_BYTE&&(rt=i.R8),Z===i.UNSIGNED_SHORT&&Ct&&(rt=Ct.R16_EXT),Z===i.SHORT&&Ct&&(rt=Ct.R16_SNORM_EXT)),T===i.RED_INTEGER&&(Z===i.UNSIGNED_BYTE&&(rt=i.R8UI),Z===i.UNSIGNED_SHORT&&(rt=i.R16UI),Z===i.UNSIGNED_INT&&(rt=i.R32UI),Z===i.BYTE&&(rt=i.R8I),Z===i.SHORT&&(rt=i.R16I),Z===i.INT&&(rt=i.R32I)),T===i.RG&&(Z===i.FLOAT&&(rt=i.RG32F),Z===i.HALF_FLOAT&&(rt=i.RG16F),Z===i.UNSIGNED_BYTE&&(rt=i.RG8),Z===i.UNSIGNED_SHORT&&Ct&&(rt=Ct.RG16_EXT),Z===i.SHORT&&Ct&&(rt=Ct.RG16_SNORM_EXT)),T===i.RG_INTEGER&&(Z===i.UNSIGNED_BYTE&&(rt=i.RG8UI),Z===i.UNSIGNED_SHORT&&(rt=i.RG16UI),Z===i.UNSIGNED_INT&&(rt=i.RG32UI),Z===i.BYTE&&(rt=i.RG8I),Z===i.SHORT&&(rt=i.RG16I),Z===i.INT&&(rt=i.RG32I)),T===i.RGB_INTEGER&&(Z===i.UNSIGNED_BYTE&&(rt=i.RGB8UI),Z===i.UNSIGNED_SHORT&&(rt=i.RGB16UI),Z===i.UNSIGNED_INT&&(rt=i.RGB32UI),Z===i.BYTE&&(rt=i.RGB8I),Z===i.SHORT&&(rt=i.RGB16I),Z===i.INT&&(rt=i.RGB32I)),T===i.RGBA_INTEGER&&(Z===i.UNSIGNED_BYTE&&(rt=i.RGBA8UI),Z===i.UNSIGNED_SHORT&&(rt=i.RGBA16UI),Z===i.UNSIGNED_INT&&(rt=i.RGBA32UI),Z===i.BYTE&&(rt=i.RGBA8I),Z===i.SHORT&&(rt=i.RGBA16I),Z===i.INT&&(rt=i.RGBA32I)),T===i.RGB&&(Z===i.UNSIGNED_SHORT&&Ct&&(rt=Ct.RGB16_EXT),Z===i.SHORT&&Ct&&(rt=Ct.RGB16_SNORM_EXT),Z===i.UNSIGNED_INT_5_9_9_9_REV&&(rt=i.RGB9_E5),Z===i.UNSIGNED_INT_10F_11F_11F_REV&&(rt=i.R11F_G11F_B10F)),T===i.RGBA){let at=bt?js:ue.getTransfer(lt);Z===i.FLOAT&&(rt=i.RGBA32F),Z===i.HALF_FLOAT&&(rt=i.RGBA16F),Z===i.UNSIGNED_BYTE&&(rt=at===_e?i.SRGB8_ALPHA8:i.RGBA8),Z===i.UNSIGNED_SHORT&&Ct&&(rt=Ct.RGBA16_EXT),Z===i.SHORT&&Ct&&(rt=Ct.RGBA16_SNORM_EXT),Z===i.UNSIGNED_SHORT_4_4_4_4&&(rt=i.RGBA4),Z===i.UNSIGNED_SHORT_5_5_5_1&&(rt=i.RGB5_A1)}return(rt===i.R16F||rt===i.R32F||rt===i.RG16F||rt===i.RG32F||rt===i.RGBA16F||rt===i.RGBA32F)&&t.get("EXT_color_buffer_float"),rt}function y(I,T){let Z;return I?T===null||T===Fn||T===Ki?Z=i.DEPTH24_STENCIL8:T===An?Z=i.DEPTH32F_STENCIL8:T===Ls&&(Z=i.DEPTH24_STENCIL8,Kt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):T===null||T===Fn||T===Ki?Z=i.DEPTH_COMPONENT24:T===An?Z=i.DEPTH_COMPONENT32F:T===Ls&&(Z=i.DEPTH_COMPONENT16),Z}function S(I,T){return M(I)===!0||I.isFramebufferTexture&&I.minFilter!==We&&I.minFilter!==cn?Math.log2(Math.max(T.width,T.height))+1:I.mipmaps.length>0?I.mipmaps.length:I.isCompressedTexture&&Array.isArray(I.image)?T.mipmaps.length:1}function D(I){let T=new WeakRef(I);n.get(I).__ref=T,m.add(T),x.register(I,T,T)}function L(I){let T=n.get(I).__ref;T!==void 0&&(m.delete(T),x.unregister(T))}function U(I){G(I.target)}function z(I){N(I.target)}function G(I){I.removeEventListener("dispose",U),L(I),Y(I),I.isVideoTexture&&u.delete(I),I.isHTMLTexture&&f.delete(I)}function N(I){I.removeEventListener("dispose",z),L(I),$(I)}function q(){for(let I of m){let T=I.deref();T!==void 0&&(T.isRenderTarget===!0?N(T):G(T))}m.clear(),f.clear()}function Y(I){let T=n.get(I);if(T.__webglInit===void 0)return;let Z=I.source,dt=d.get(Z);if(dt){let lt=dt[T.__cacheKey];lt.usedTimes--,lt.usedTimes===0&&W(I),Object.keys(dt).length===0&&d.delete(Z)}n.remove(I)}function W(I){let T=n.get(I);i.deleteTexture(T.__webglTexture);let Z=I.source,dt=d.get(Z);delete dt[T.__cacheKey],a.memory.textures--}function $(I){let T=n.get(I);T.__depthDisposeCallback&&T.__depthDisposeCallback();let Z=I.depthTexture;if(Z&&Z.renderTarget===I&&G(Z),I.isWebGLCubeRenderTarget)for(let lt=0;lt<6;lt++){if(Array.isArray(T.__webglFramebuffer[lt]))for(let bt=0;bt<T.__webglFramebuffer[lt].length;bt++)i.deleteFramebuffer(T.__webglFramebuffer[lt][bt]);else i.deleteFramebuffer(T.__webglFramebuffer[lt]);T.__webglDepthbuffer&&i.deleteRenderbuffer(T.__webglDepthbuffer[lt])}else{if(Array.isArray(T.__webglFramebuffer))for(let lt=0;lt<T.__webglFramebuffer.length;lt++)i.deleteFramebuffer(T.__webglFramebuffer[lt]);else i.deleteFramebuffer(T.__webglFramebuffer);if(T.__webglDepthbuffer&&i.deleteRenderbuffer(T.__webglDepthbuffer),T.__webglMultisampledFramebuffer&&i.deleteFramebuffer(T.__webglMultisampledFramebuffer),T.__webglColorRenderbuffer)for(let lt=0;lt<T.__webglColorRenderbuffer.length;lt++)T.__webglColorRenderbuffer[lt]&&i.deleteRenderbuffer(T.__webglColorRenderbuffer[lt]);T.__webglDepthRenderbuffer&&i.deleteRenderbuffer(T.__webglDepthRenderbuffer)}let dt=I.textures;for(let lt=0,bt=dt.length;lt<bt;lt++){let Ct=n.get(dt[lt]);Ct.__webglTexture&&(i.deleteTexture(Ct.__webglTexture),a.memory.textures--),n.remove(dt[lt])}n.remove(I)}let X=0;function j(){X=0}function it(){return X}function vt(I){X=I}function Bt(){let I=X;return I>=s.maxTextures&&Kt("WebGLTextures: Trying to use "+(I+1)+" texture units while this GPU supports only "+s.maxTextures),X+=1,I}function nt(I){let T=[];return T.push(I.wrapS),T.push(I.wrapT),T.push(I.wrapR||0),T.push(I.magFilter),T.push(I.minFilter),T.push(I.anisotropy),T.push(I.internalFormat),T.push(I.format),T.push(I.type),T.push(I.generateMipmaps),T.push(I.mipmapsAutoUpdate),T.push(I.premultiplyAlpha),T.push(I.flipY),T.push(I.unpackAlignment),T.push(I.colorSpace),T.join()}function Pt(I,T){let Z=n.get(I);if(I.isVideoTexture&&tt(I),I.isRenderTargetTexture===!1&&I.isExternalTexture!==!0&&I.version>0&&Z.__version!==I.version){let dt=I.image;if(dt===null)Kt("WebGLRenderer: Texture marked for update but no image data found.");else if(dt.complete===!1)Kt("WebGLRenderer: Texture marked for update but image is incomplete");else{St(Z,I,T);return}}else I.isExternalTexture&&(Z.__webglTexture=I.sourceTexture?I.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,Z.__webglTexture,i.TEXTURE0+T)}function zt(I,T){let Z=n.get(I);if(I.isRenderTargetTexture===!1&&I.version>0&&Z.__version!==I.version){St(Z,I,T);return}else I.isExternalTexture&&(Z.__webglTexture=I.sourceTexture?I.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,Z.__webglTexture,i.TEXTURE0+T)}function Vt(I,T){let Z=n.get(I);if(I.isRenderTargetTexture===!1&&I.version>0&&Z.__version!==I.version){St(Z,I,T);return}e.bindTexture(i.TEXTURE_3D,Z.__webglTexture,i.TEXTURE0+T)}function Lt(I,T){let Z=n.get(I);if(I.version>0&&Z.__version!==I.version){Ot(Z,I,T);return}e.bindTexture(i.TEXTURE_CUBE_MAP,Z.__webglTexture,i.TEXTURE0+T)}let Xt={[gs]:i.REPEAT,[kn]:i.CLAMP_TO_EDGE,[Fa]:i.MIRRORED_REPEAT},Te={[We]:i.NEAREST,[lu]:i.NEAREST_MIPMAP_NEAREST,[zr]:i.NEAREST_MIPMAP_LINEAR,[cn]:i.LINEAR,[uo]:i.LINEAR_MIPMAP_NEAREST,[ri]:i.LINEAR_MIPMAP_LINEAR},$t={[du]:i.NEVER,[gc]:i.ALWAYS,[fu]:i.LESS,[pc]:i.LEQUAL,[pu]:i.EQUAL,[mc]:i.GEQUAL,[mu]:i.GREATER,[gu]:i.NOTEQUAL};function ie(I,T){if(T.type===An&&t.has("OES_texture_float_linear")===!1&&(T.magFilter===cn||T.magFilter===uo||T.magFilter===zr||T.magFilter===ri||T.minFilter===cn||T.minFilter===uo||T.minFilter===zr||T.minFilter===ri)&&Kt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(I,i.TEXTURE_WRAP_S,Xt[T.wrapS]),i.texParameteri(I,i.TEXTURE_WRAP_T,Xt[T.wrapT]),(I===i.TEXTURE_3D||I===i.TEXTURE_2D_ARRAY)&&i.texParameteri(I,i.TEXTURE_WRAP_R,Xt[T.wrapR]),i.texParameteri(I,i.TEXTURE_MAG_FILTER,Te[T.magFilter]),i.texParameteri(I,i.TEXTURE_MIN_FILTER,Te[T.minFilter]),T.compareFunction&&(i.texParameteri(I,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(I,i.TEXTURE_COMPARE_FUNC,$t[T.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(T.magFilter===We||T.minFilter!==zr&&T.minFilter!==ri||T.type===An&&t.has("OES_texture_float_linear")===!1)return;if(T.anisotropy>1||n.get(T).__currentAnisotropy){let Z=t.get("EXT_texture_filter_anisotropic");i.texParameterf(I,Z.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(T.anisotropy,s.getMaxAnisotropy())),n.get(T).__currentAnisotropy=T.anisotropy}}}function ae(I,T){let Z=!1;I.__webglInit===void 0&&(I.__webglInit=!0,T.addEventListener("dispose",U),D(T));let dt=T.source,lt=d.get(dt);lt===void 0&&(lt={},d.set(dt,lt));let bt=nt(T);if(bt!==I.__cacheKey){lt[bt]===void 0&&(lt[bt]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,Z=!0),lt[bt].usedTimes++;let Ct=lt[I.__cacheKey];Ct!==void 0&&(lt[I.__cacheKey].usedTimes--,Ct.usedTimes===0&&W(T)),I.__cacheKey=bt,I.__webglTexture=lt[bt].texture}return Z}function ct(I,T,Z){return Math.floor(Math.floor(I/Z)/T)}function Mt(I,T,Z,dt){let bt=I.updateRanges;if(bt.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,T.width,T.height,Z,dt,T.data);else{bt.sort((O,ot)=>O.start-ot.start);let Ct=0;for(let O=1;O<bt.length;O++){let ot=bt[Ct],st=bt[O],wt=ot.start+ot.count,yt=ct(st.start,T.width,4),Tt=ct(ot.start,T.width,4);st.start<=wt+1&&yt===Tt&&ct(st.start+st.count-1,T.width,4)===yt?ot.count=Math.max(ot.count,st.start+st.count-ot.start):(++Ct,bt[Ct]=st)}bt.length=Ct+1;let rt=e.getParameter(i.UNPACK_ROW_LENGTH),at=e.getParameter(i.UNPACK_SKIP_PIXELS),Et=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,T.width);for(let O=0,ot=bt.length;O<ot;O++){let st=bt[O],wt=Math.floor(st.start/4),yt=Math.ceil(st.count/4),Tt=wt%T.width,qt=Math.floor(wt/T.width),le=yt,xt=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,Tt),e.pixelStorei(i.UNPACK_SKIP_ROWS,qt),e.texSubImage2D(i.TEXTURE_2D,0,Tt,qt,le,xt,Z,dt,T.data)}I.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,rt),e.pixelStorei(i.UNPACK_SKIP_PIXELS,at),e.pixelStorei(i.UNPACK_SKIP_ROWS,Et)}}function St(I,T,Z){let dt=i.TEXTURE_2D;(T.isDataArrayTexture||T.isCompressedArrayTexture)&&(dt=i.TEXTURE_2D_ARRAY),T.isData3DTexture&&(dt=i.TEXTURE_3D);let lt=ae(I,T),bt=T.source;e.bindTexture(dt,I.__webglTexture,i.TEXTURE0+Z);let Ct=n.get(bt);if(bt.version!==Ct.__version||lt===!0){if(e.activeTexture(i.TEXTURE0+Z),(typeof ImageBitmap<"u"&&T.image instanceof ImageBitmap)===!1){let xt=ue.getPrimaries(ue.workingColorSpace),Jt=T.colorSpace===oi?null:ue.getPrimaries(T.colorSpace),oe=T.colorSpace===oi||xt===Jt?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,T.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,oe)}e.pixelStorei(i.UNPACK_ALIGNMENT,T.unpackAlignment);let at=_(T.image,!1,s.maxTextureSize);at=et(T,at);let Et=r.convert(T.format,T.colorSpace),O=r.convert(T.type),ot=w(T.internalFormat,Et,O,T.normalized,T.colorSpace,T.isVideoTexture);ie(dt,T);let st,wt=T.mipmaps,yt=T.isVideoTexture!==!0,Tt=Ct.__version===void 0||lt===!0,qt=bt.dataReady,le=S(T,at);if(T.isDepthTexture)ot=y(T.format===ai,T.type),Tt&&(yt?e.texStorage2D(i.TEXTURE_2D,1,ot,at.width,at.height):e.texImage2D(i.TEXTURE_2D,0,ot,at.width,at.height,0,Et,O,null));else if(T.isDataTexture)if(wt.length>0){yt&&Tt&&e.texStorage2D(i.TEXTURE_2D,le,ot,wt[0].width,wt[0].height);for(let xt=0,Jt=wt.length;xt<Jt;xt++)st=wt[xt],yt?qt&&e.texSubImage2D(i.TEXTURE_2D,xt,0,0,st.width,st.height,Et,O,st.data):e.texImage2D(i.TEXTURE_2D,xt,ot,st.width,st.height,0,Et,O,st.data);T.generateMipmaps=!1}else yt?(Tt&&e.texStorage2D(i.TEXTURE_2D,le,ot,at.width,at.height),qt&&Mt(T,at,Et,O)):e.texImage2D(i.TEXTURE_2D,0,ot,at.width,at.height,0,Et,O,at.data);else if(T.isCompressedTexture)if(T.isCompressedArrayTexture){yt&&Tt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,le,ot,wt[0].width,wt[0].height,at.depth);for(let xt=0,Jt=wt.length;xt<Jt;xt++)if(st=wt[xt],T.format!==On)if(Et!==null)if(yt){if(qt)if(T.layerUpdates.size>0){let oe=Ec(st.width,st.height,T.format,T.type);for(let Nt of T.layerUpdates){let Se=st.data.subarray(Nt*oe/st.data.BYTES_PER_ELEMENT,(Nt+1)*oe/st.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,xt,0,0,Nt,st.width,st.height,1,Et,Se)}}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,xt,0,0,0,st.width,st.height,at.depth,Et,st.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,xt,ot,st.width,st.height,at.depth,0,st.data,0,0);else Kt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else yt?qt&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,xt,0,0,0,st.width,st.height,at.depth,Et,O,st.data):e.texImage3D(i.TEXTURE_2D_ARRAY,xt,ot,st.width,st.height,at.depth,0,Et,O,st.data);T.layerUpdates.size>0&&T.clearLayerUpdates()}else{yt&&Tt&&e.texStorage2D(i.TEXTURE_2D,le,ot,wt[0].width,wt[0].height);for(let xt=0,Jt=wt.length;xt<Jt;xt++)st=wt[xt],T.format!==On?Et!==null?yt?qt&&e.compressedTexSubImage2D(i.TEXTURE_2D,xt,0,0,st.width,st.height,Et,st.data):e.compressedTexImage2D(i.TEXTURE_2D,xt,ot,st.width,st.height,0,st.data):Kt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):yt?qt&&e.texSubImage2D(i.TEXTURE_2D,xt,0,0,st.width,st.height,Et,O,st.data):e.texImage2D(i.TEXTURE_2D,xt,ot,st.width,st.height,0,Et,O,st.data)}else if(T.isDataArrayTexture)if(yt){if(Tt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,le,ot,at.width,at.height,at.depth),qt)if(T.layerUpdates.size>0){let xt=Ec(at.width,at.height,T.format,T.type);for(let Jt of T.layerUpdates){let oe=at.data.subarray(Jt*xt/at.data.BYTES_PER_ELEMENT,(Jt+1)*xt/at.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Jt,at.width,at.height,1,Et,O,oe)}T.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,at.width,at.height,at.depth,Et,O,at.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,ot,at.width,at.height,at.depth,0,Et,O,at.data);else if(T.isData3DTexture)yt?(Tt&&e.texStorage3D(i.TEXTURE_3D,le,ot,at.width,at.height,at.depth),qt&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,at.width,at.height,at.depth,Et,O,at.data)):e.texImage3D(i.TEXTURE_3D,0,ot,at.width,at.height,at.depth,0,Et,O,at.data);else if(T.isFramebufferTexture){if(Tt)if(yt)e.texStorage2D(i.TEXTURE_2D,le,ot,at.width,at.height);else{let xt=at.width,Jt=at.height;for(let oe=0;oe<le;oe++)e.texImage2D(i.TEXTURE_2D,oe,ot,xt,Jt,0,Et,O,null),xt>>=1,Jt>>=1}}else if(T.isHTMLTexture){if("texElementImage2D"in i){let xt=i.canvas;if(xt.hasAttribute("layoutsubtree")||xt.setAttribute("layoutsubtree","true"),at.parentNode!==xt){xt.appendChild(at),f.add(T),xt.onpaint=Jt=>{let oe=Jt.changedElements;for(let Nt of f)oe.includes(Nt.image)&&(Nt.needsUpdate=!0)},xt.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,at);else{let oe=i.RGBA,Nt=i.RGBA,Se=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,oe,Nt,Se,at)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(wt.length>0){if(yt&&Tt){let xt=ht(wt[0]);e.texStorage2D(i.TEXTURE_2D,le,ot,xt.width,xt.height)}for(let xt=0,Jt=wt.length;xt<Jt;xt++)st=wt[xt],yt?qt&&e.texSubImage2D(i.TEXTURE_2D,xt,0,0,Et,O,st):e.texImage2D(i.TEXTURE_2D,xt,ot,Et,O,st);T.generateMipmaps=!1}else if(yt){if(Tt){let xt=ht(at);e.texStorage2D(i.TEXTURE_2D,le,ot,xt.width,xt.height)}qt&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,Et,O,at)}else e.texImage2D(i.TEXTURE_2D,0,ot,Et,O,at);M(T)&&T.mipmapsAutoUpdate===!0&&v(dt),Ct.__version=bt.version,T.onUpdate&&T.onUpdate(T)}I.__version=T.version}function Ot(I,T,Z){if(T.image.length!==6)return;let dt=ae(I,T),lt=T.source;e.bindTexture(i.TEXTURE_CUBE_MAP,I.__webglTexture,i.TEXTURE0+Z);let bt=n.get(lt);if(lt.version!==bt.__version||dt===!0){e.activeTexture(i.TEXTURE0+Z);let Ct=ue.getPrimaries(ue.workingColorSpace),rt=T.colorSpace===oi?null:ue.getPrimaries(T.colorSpace),at=T.colorSpace===oi||Ct===rt?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,T.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,T.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,at);let Et=T.isCompressedTexture||T.image[0].isCompressedTexture,O=T.image[0]&&T.image[0].isDataTexture,ot=[];for(let Nt=0;Nt<6;Nt++)!Et&&!O?ot[Nt]=_(T.image[Nt],!0,s.maxCubemapSize):ot[Nt]=O?T.image[Nt].image:T.image[Nt],ot[Nt]=et(T,ot[Nt]);let st=ot[0],wt=r.convert(T.format,T.colorSpace),yt=r.convert(T.type),Tt=w(T.internalFormat,wt,yt,T.normalized,T.colorSpace),qt=T.isVideoTexture!==!0,le=bt.__version===void 0||dt===!0,xt=lt.dataReady,Jt=S(T,st);ie(i.TEXTURE_CUBE_MAP,T);let oe;if(T.isDepthTexture){if(Tt=y(T.format===ai,T.type),le)if(qt)e.texStorage2D(i.TEXTURE_CUBE_MAP,1,Tt,st.width,st.height);else for(let Nt=0;Nt<6;Nt++)e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Nt,0,Tt,st.width,st.height,0,wt,yt,null)}else if(Et){qt&&le&&e.texStorage2D(i.TEXTURE_CUBE_MAP,Jt,Tt,st.width,st.height);for(let Nt=0;Nt<6;Nt++){oe=ot[Nt].mipmaps;for(let Se=0;Se<oe.length;Se++){let He=oe[Se];T.format!==On?wt!==null?qt?xt&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Nt,Se,0,0,He.width,He.height,wt,He.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Nt,Se,Tt,He.width,He.height,0,He.data):Kt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):qt?xt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Nt,Se,0,0,He.width,He.height,wt,yt,He.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Nt,Se,Tt,He.width,He.height,0,wt,yt,He.data)}}}else{if(oe=T.mipmaps,qt&&le){oe.length>0&&Jt++;let Nt=ht(ot[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,Jt,Tt,Nt.width,Nt.height)}for(let Nt=0;Nt<6;Nt++)if(O){qt?xt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Nt,0,0,0,ot[Nt].width,ot[Nt].height,wt,yt,ot[Nt].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Nt,0,Tt,ot[Nt].width,ot[Nt].height,0,wt,yt,ot[Nt].data);for(let Se=0;Se<oe.length;Se++){let hi=oe[Se].image[Nt].image;qt?xt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Nt,Se+1,0,0,hi.width,hi.height,wt,yt,hi.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Nt,Se+1,Tt,hi.width,hi.height,0,wt,yt,hi.data)}}else{qt?xt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Nt,0,0,0,wt,yt,ot[Nt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Nt,0,Tt,wt,yt,ot[Nt]);for(let Se=0;Se<oe.length;Se++){let He=oe[Se];qt?xt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Nt,Se+1,0,0,wt,yt,He.image[Nt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Nt,Se+1,Tt,wt,yt,He.image[Nt])}}}M(T)&&T.mipmapsAutoUpdate===!0&&v(i.TEXTURE_CUBE_MAP),bt.__version=lt.version,T.onUpdate&&T.onUpdate(T)}I.__version=T.version}function At(I,T,Z,dt,lt,bt){let Ct=r.convert(Z.format,Z.colorSpace),rt=r.convert(Z.type),at=w(Z.internalFormat,Ct,rt,Z.normalized,Z.colorSpace),Et=n.get(T),O=n.get(Z);if(O.__renderTarget=T,!Et.__hasExternalTextures){let ot=Math.max(1,T.width>>bt),st=Math.max(1,T.height>>bt);lt===i.TEXTURE_3D||lt===i.TEXTURE_2D_ARRAY?e.texImage3D(lt,bt,at,ot,st,T.depth,0,Ct,rt,null):e.texImage2D(lt,bt,at,ot,st,0,Ct,rt,null)}e.bindFramebuffer(i.FRAMEBUFFER,I),k(T)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,dt,lt,O.__webglTexture,0,A(T)):(lt===i.TEXTURE_2D||lt>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&lt<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,dt,lt,O.__webglTexture,bt),e.bindFramebuffer(i.FRAMEBUFFER,null)}function ee(I,T,Z){if(i.bindRenderbuffer(i.RENDERBUFFER,I),T.depthBuffer){let dt=T.depthTexture,lt=dt&&dt.isDepthTexture?dt.type:null,bt=y(T.stencilBuffer,lt),Ct=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;k(T)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,A(T),bt,T.width,T.height):Z?i.renderbufferStorageMultisample(i.RENDERBUFFER,A(T),bt,T.width,T.height):i.renderbufferStorage(i.RENDERBUFFER,bt,T.width,T.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Ct,i.RENDERBUFFER,I)}else{let dt=T.textures;for(let lt=0;lt<dt.length;lt++){let bt=dt[lt],Ct=r.convert(bt.format,bt.colorSpace),rt=r.convert(bt.type),at=w(bt.internalFormat,Ct,rt,bt.normalized,bt.colorSpace);k(T)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,A(T),at,T.width,T.height):Z?i.renderbufferStorageMultisample(i.RENDERBUFFER,A(T),at,T.width,T.height):i.renderbufferStorage(i.RENDERBUFFER,at,T.width,T.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function b(I,T,Z){let dt=T.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,I),!(T.depthTexture&&T.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let lt=n.get(T.depthTexture);lt.__renderTarget=T;let bt=dt?T.depthTexture.image[0]:T.depthTexture.image;(!lt.__webglTexture||bt.width!==T.width||bt.height!==T.height)&&(bt.width=T.width,bt.height=T.height,T.depthTexture.needsUpdate=!0),dt?Lt(T.depthTexture,0):Pt(T.depthTexture,0);let Ct=lt.__webglTexture,rt=A(T),at=dt?i.TEXTURE_CUBE_MAP_POSITIVE_X+Z:i.TEXTURE_2D,Et=T.depthTexture.format===ai?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(T.depthTexture.format===ei)k(T)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Et,at,Ct,0,rt):i.framebufferTexture2D(i.FRAMEBUFFER,Et,at,Ct,0);else if(T.depthTexture.format===ai)k(T)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Et,at,Ct,0,rt):i.framebufferTexture2D(i.FRAMEBUFFER,Et,at,Ct,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function C(I){let T=n.get(I),Z=I.isWebGLCubeRenderTarget===!0;if(T.__boundDepthTexture!==I.depthTexture){let dt=I.depthTexture;if(T.__depthDisposeCallback&&T.__depthDisposeCallback(),dt){let lt=()=>{delete T.__boundDepthTexture,delete T.__depthDisposeCallback,dt.removeEventListener("dispose",lt)};dt.addEventListener("dispose",lt),T.__depthDisposeCallback=lt}T.__boundDepthTexture=dt}if(I.depthTexture&&!T.__autoAllocateDepthBuffer)if(Z)for(let dt=0;dt<6;dt++)b(T.__webglFramebuffer[dt],I,dt);else I.texture.mipmaps.length>0?b(T.__webglFramebuffer[0],I,0):b(T.__webglFramebuffer,I,0);else if(Z){T.__webglDepthbuffer=[];for(let dt=0;dt<6;dt++)if(e.bindFramebuffer(i.FRAMEBUFFER,T.__webglFramebuffer[dt]),T.__webglDepthbuffer[dt]===void 0)T.__webglDepthbuffer[dt]=i.createRenderbuffer(),ee(T.__webglDepthbuffer[dt],I,!1);else{let lt=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,bt=T.__webglDepthbuffer[dt];i.bindRenderbuffer(i.RENDERBUFFER,bt),i.framebufferRenderbuffer(i.FRAMEBUFFER,lt,i.RENDERBUFFER,bt)}}else if(I.texture.mipmaps.length>0?e.bindFramebuffer(i.FRAMEBUFFER,T.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,T.__webglFramebuffer),T.__webglDepthbuffer===void 0)T.__webglDepthbuffer=i.createRenderbuffer(),ee(T.__webglDepthbuffer,I,!1);else{let lt=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,bt=T.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,bt),i.framebufferRenderbuffer(i.FRAMEBUFFER,lt,i.RENDERBUFFER,bt)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function B(I,T,Z){let dt=n.get(I);T!==void 0&&At(dt.__webglFramebuffer,I,I.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),Z!==void 0&&C(I)}function F(I){let T=I.texture,Z=n.get(I),dt=n.get(T);I.addEventListener("dispose",z),D(I);let lt=I.textures,bt=I.isWebGLCubeRenderTarget===!0,Ct=lt.length>1;if(Ct||(dt.__webglTexture===void 0&&(dt.__webglTexture=i.createTexture()),dt.__version=T.version,a.memory.textures++),bt){Z.__webglFramebuffer=[];for(let rt=0;rt<6;rt++)if(T.mipmaps.length>0){Z.__webglFramebuffer[rt]=[];for(let at=0;at<T.mipmaps.length;at++)Z.__webglFramebuffer[rt][at]=i.createFramebuffer()}else Z.__webglFramebuffer[rt]=i.createFramebuffer()}else{if(T.mipmaps.length>0){Z.__webglFramebuffer=[];for(let rt=0;rt<T.mipmaps.length;rt++)Z.__webglFramebuffer[rt]=i.createFramebuffer()}else Z.__webglFramebuffer=i.createFramebuffer();if(Ct)for(let rt=0,at=lt.length;rt<at;rt++){let Et=n.get(lt[rt]);Et.__webglTexture===void 0&&(Et.__webglTexture=i.createTexture(),a.memory.textures++)}if(I.samples>0&&k(I)===!1){Z.__webglMultisampledFramebuffer=i.createFramebuffer(),Z.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,Z.__webglMultisampledFramebuffer);for(let rt=0;rt<lt.length;rt++){let at=lt[rt];Z.__webglColorRenderbuffer[rt]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,Z.__webglColorRenderbuffer[rt]);let Et=r.convert(at.format,at.colorSpace),O=r.convert(at.type),ot=w(at.internalFormat,Et,O,at.normalized,at.colorSpace,I.isXRRenderTarget===!0),st=A(I);i.renderbufferStorageMultisample(i.RENDERBUFFER,st,ot,I.width,I.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+rt,i.RENDERBUFFER,Z.__webglColorRenderbuffer[rt])}i.bindRenderbuffer(i.RENDERBUFFER,null),I.depthBuffer&&(Z.__webglDepthRenderbuffer=i.createRenderbuffer(),ee(Z.__webglDepthRenderbuffer,I,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(bt){e.bindTexture(i.TEXTURE_CUBE_MAP,dt.__webglTexture),ie(i.TEXTURE_CUBE_MAP,T);for(let rt=0;rt<6;rt++)if(T.mipmaps.length>0)for(let at=0;at<T.mipmaps.length;at++)At(Z.__webglFramebuffer[rt][at],I,T,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+rt,at);else At(Z.__webglFramebuffer[rt],I,T,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+rt,0);M(T)?v(i.TEXTURE_CUBE_MAP):T.mipmaps.length>0&&i.texParameteri(i.TEXTURE_CUBE_MAP,i.TEXTURE_MAX_LEVEL,T.mipmaps.length-1),e.unbindTexture()}else if(Ct){for(let rt=0,at=lt.length;rt<at;rt++){let Et=lt[rt],O=n.get(Et),ot=i.TEXTURE_2D;(I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(ot=I.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ot,O.__webglTexture),ie(ot,Et),At(Z.__webglFramebuffer,I,Et,i.COLOR_ATTACHMENT0+rt,ot,0),M(Et)&&v(ot)}e.unbindTexture()}else{let rt=i.TEXTURE_2D;if((I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(rt=I.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(rt,dt.__webglTexture),ie(rt,T),T.mipmaps.length>0)for(let at=0;at<T.mipmaps.length;at++)At(Z.__webglFramebuffer[at],I,T,i.COLOR_ATTACHMENT0,rt,at);else At(Z.__webglFramebuffer,I,T,i.COLOR_ATTACHMENT0,rt,0);M(T)?v(rt):T.mipmaps.length>0&&i.texParameteri(rt,i.TEXTURE_MAX_LEVEL,T.mipmaps.length-1),e.unbindTexture()}I.depthBuffer&&C(I)}function P(I){let T=I.textures;for(let Z=0,dt=T.length;Z<dt;Z++){let lt=T[Z];if(M(lt)&&lt.mipmapsAutoUpdate===!0){let bt=R(I),Ct=n.get(lt).__webglTexture;e.bindTexture(bt,Ct),v(bt),e.unbindTexture()}}}let mt=[];function ut(I){if(I.samples>0){if(k(I)===!1){let T=I.textures,Z=I.width,dt=I.height,lt=i.COLOR_BUFFER_BIT,bt=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Ct=n.get(I),rt=T.length>1;if(rt)for(let Et=0;Et<T.length;Et++)e.bindFramebuffer(i.FRAMEBUFFER,Ct.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Et,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,Ct.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Et,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,Ct.__webglMultisampledFramebuffer),I.texture.mipmaps.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ct.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ct.__webglFramebuffer);for(let Et=0;Et<T.length;Et++){if(I.resolveDepthBuffer&&(I.depthBuffer&&(lt|=i.DEPTH_BUFFER_BIT),I.stencilBuffer&&I.resolveStencilBuffer&&(lt|=i.STENCIL_BUFFER_BIT)),rt){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Ct.__webglColorRenderbuffer[Et]);let O=n.get(T[Et]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,O,0)}i.blitFramebuffer(0,0,Z,dt,0,0,Z,dt,lt,i.NEAREST),l===!0&&(mt.length=0,mt.push(i.COLOR_ATTACHMENT0+Et),I.depthBuffer&&I.storeMultisampledDepthBuffer===!1&&mt.push(bt),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,mt))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),rt)for(let Et=0;Et<T.length;Et++){e.bindFramebuffer(i.FRAMEBUFFER,Ct.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Et,i.RENDERBUFFER,Ct.__webglColorRenderbuffer[Et]);let O=n.get(T[Et]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,Ct.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Et,i.TEXTURE_2D,O,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ct.__webglMultisampledFramebuffer)}else if(I.depthBuffer&&I.storeMultisampledDepthBuffer===!1&&l){let T=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[T])}}}function A(I){return Math.min(s.maxSamples,I.samples)}function k(I){let T=n.get(I);return I.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&T.__useRenderToTexture!==!1}function tt(I){let T=a.render.frame;u.get(I)!==T&&(u.set(I,T),I.update())}function et(I,T){let Z=I.colorSpace,dt=I.format,lt=I.type;return I.isCompressedTexture===!0||I.isVideoTexture===!0||Z!==Qs&&Z!==oi&&(ue.getTransfer(Z)===_e?(dt!==On||lt!==dn)&&Kt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Qt("WebGLTextures: Unsupported texture color space:",Z)),T}function ht(I){return typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement?(h.width=I.naturalWidth||I.width,h.height=I.naturalHeight||I.height):typeof VideoFrame<"u"&&I instanceof VideoFrame?(h.width=I.displayWidth,h.height=I.displayHeight):(h.width=I.width,h.height=I.height),h}this.allocateTextureUnit=Bt,this.resetTextureUnits=j,this.getTextureUnits=it,this.setTextureUnits=vt,this.setTexture2D=Pt,this.setTexture2DArray=zt,this.setTexture3D=Vt,this.setTextureCube=Lt,this.rebindTextures=B,this.setupRenderTarget=F,this.updateRenderTargetMipmap=P,this.updateMultisampleRenderTarget=ut,this.setupDepthRenderbuffer=C,this.setupFrameBufferTexture=At,this.useMultisampledRTT=k,this.dispose=q}function Ix(i,t){function e(n,s=oi){let r,a=ue.getTransfer(s);if(n===dn)return i.UNSIGNED_BYTE;if(n===po)return i.UNSIGNED_SHORT_4_4_4_4;if(n===mo)return i.UNSIGNED_SHORT_5_5_5_1;if(n===hc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===uc)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===lc)return i.BYTE;if(n===cc)return i.SHORT;if(n===Ls)return i.UNSIGNED_SHORT;if(n===fo)return i.INT;if(n===Fn)return i.UNSIGNED_INT;if(n===An)return i.FLOAT;if(n===Ze)return i.HALF_FLOAT;if(n===dc)return i.ALPHA;if(n===fc)return i.RGB;if(n===On)return i.RGBA;if(n===ei)return i.DEPTH_COMPONENT;if(n===ai)return i.DEPTH_STENCIL;if(n===go)return i.RED;if(n===xo)return i.RED_INTEGER;if(n===Ii)return i.RG;if(n===_o)return i.RG_INTEGER;if(n===yo)return i.RGBA_INTEGER;if(n===kr||n===Hr||n===Gr||n===Vr)if(a===_e)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===kr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Hr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Gr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Vr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===kr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Hr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Gr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Vr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===vo||n===Mo||n===So||n===bo)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===vo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Mo)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===So)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===bo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===To||n===Eo||n===wo||n===Ao||n===Ro||n===Wr||n===Co)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===To||n===Eo)return a===_e?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===wo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Ao)return r.COMPRESSED_R11_EAC;if(n===Ro)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Wr)return r.COMPRESSED_RG11_EAC;if(n===Co)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Io||n===Po||n===Lo||n===Do||n===No||n===Uo||n===Fo||n===Oo||n===Bo||n===zo||n===ko||n===Ho||n===Go||n===Vo)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Io)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Po)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Lo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Do)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===No)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Uo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Fo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Oo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Bo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===zo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ko)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Ho)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Go)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Vo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Wo||n===Xo||n===qo)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===Wo)return a===_e?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Xo)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===qo)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Yo||n===Zo||n===Xr||n===Jo)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===Yo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Zo)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Xr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Jo)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ki?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var Px=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Lx=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,zc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let n=new hr(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new Fe({vertexShader:Px,fragmentShader:Lx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new pt(new En(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},kc=class extends Gn{constructor(t,e){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,h=null,u=null,f=null,p=null,d=null,m=null,x=typeof XRWebGLBinding<"u",c=new zc,g={},_=e.getContextAttributes(),M=null,v=null,R=[],w=[],y=new ft,S=null,D=null,L=new nn;L.viewport=new Ce;let U=new nn;U.viewport=new Ce;let z=[L,U],G=new oo,N=null,q=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(nt){let Pt=R[nt];return Pt===void 0&&(Pt=new Ms,R[nt]=Pt),Pt.getTargetRaySpace()},this.getControllerGrip=function(nt){let Pt=R[nt];return Pt===void 0&&(Pt=new Ms,R[nt]=Pt),Pt.getGripSpace()},this.getHand=function(nt){let Pt=R[nt];return Pt===void 0&&(Pt=new Ms,R[nt]=Pt),Pt.getHandSpace()};function Y(nt){let Pt=w.indexOf(nt.inputSource);if(Pt===-1)return;let zt=R[Pt];zt!==void 0&&(zt.update(nt.inputSource,nt.frame,h||a),zt.dispatchEvent({type:nt.type,data:nt.inputSource}))}function W(){s.removeEventListener("select",Y),s.removeEventListener("selectstart",Y),s.removeEventListener("selectend",Y),s.removeEventListener("squeeze",Y),s.removeEventListener("squeezestart",Y),s.removeEventListener("squeezeend",Y),s.removeEventListener("end",W),s.removeEventListener("inputsourceschange",$);for(let nt=0;nt<R.length;nt++){let Pt=w[nt];Pt!==null&&(w[nt]=null,R[nt].disconnect(Pt))}N=null,q=null,c.reset();for(let nt in g)delete g[nt];if(t.setRenderTarget(M),d=null,p=null,f=null,s=null,v=null,Bt.stop(),n.isPresenting=!1,t.setPixelRatio(S),t.setSize(y.width,y.height,!1),D!==null){let nt=D.camera;nt.fov=D.fov,nt.zoom=D.zoom,nt.updateProjectionMatrix(),D=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(nt){r=nt,n.isPresenting===!0&&Kt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(nt){o=nt,n.isPresenting===!0&&Kt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||a},this.setReferenceSpace=function(nt){h=nt},this.getBaseLayer=function(){return p!==null?p:d},this.getBinding=function(){return f===null&&x&&(f=new XRWebGLBinding(s,e)),f},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(nt){if(s=nt,s!==null){if(M=t.getRenderTarget(),s.addEventListener("select",Y),s.addEventListener("selectstart",Y),s.addEventListener("selectend",Y),s.addEventListener("squeeze",Y),s.addEventListener("squeezestart",Y),s.addEventListener("squeezeend",Y),s.addEventListener("end",W),s.addEventListener("inputsourceschange",$),_.xrCompatible!==!0&&await e.makeXRCompatible(),S=t.getPixelRatio(),t.getSize(y),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let zt=null,Vt=null,Lt=null;_.depth&&(Lt=_.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,zt=_.stencil?ai:ei,Vt=_.stencil?Ki:Fn);let Xt={colorFormat:e.RGBA8,depthFormat:Lt,scaleFactor:r};f=this.getBinding(),p=f.createProjectionLayer(Xt),s.updateRenderState({layers:[p]}),t.setPixelRatio(1),t.setSize(p.textureWidth,p.textureHeight,!1),v=new Oe(p.textureWidth,p.textureHeight,{format:On,type:dn,depthTexture:new ni(p.textureWidth,p.textureHeight,Vt,void 0,void 0,void 0,void 0,void 0,void 0,zt),stencilBuffer:_.stencil,colorSpace:t.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}else{let zt={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(s,e,zt),s.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),v=new Oe(d.framebufferWidth,d.framebufferHeight,{format:On,type:dn,colorSpace:t.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),h=null,a=await s.requestReferenceSpace(o),Bt.setContext(s),Bt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return c.getDepthTexture()};function $(nt){for(let Pt=0;Pt<nt.removed.length;Pt++){let zt=nt.removed[Pt],Vt=w.indexOf(zt);Vt>=0&&(w[Vt]=null,R[Vt].disconnect(zt))}for(let Pt=0;Pt<nt.added.length;Pt++){let zt=nt.added[Pt],Vt=w.indexOf(zt);if(Vt===-1){for(let Xt=0;Xt<R.length;Xt++)if(Xt>=w.length){w.push(zt),Vt=Xt;break}else if(w[Xt]===null){w[Xt]=zt,Vt=Xt;break}if(Vt===-1)break}let Lt=R[Vt];Lt&&Lt.connect(zt)}}function X(nt,Pt){Pt===null?nt.matrixWorld.copy(nt.matrix):nt.matrixWorld.multiplyMatrices(Pt.matrixWorld,nt.matrix),nt.matrixWorldInverse.copy(nt.matrixWorld).invert()}this.updateCamera=function(nt){if(s===null)return;let Pt=nt.near,zt=nt.far;c.texture!==null&&(c.depthNear>0&&(Pt=c.depthNear),c.depthFar>0&&(zt=c.depthFar)),G.near=U.near=L.near=Pt,G.far=U.far=L.far=zt,(N!==G.near||q!==G.far)&&(s.updateRenderState({depthNear:G.near,depthFar:G.far}),N=G.near,q=G.far),G.layers.mask=nt.layers.mask|6,L.layers.mask=G.layers.mask&-5,U.layers.mask=G.layers.mask&-3;let Vt=nt.parent,Lt=G.cameras;X(G,Vt);for(let Xt=0;Xt<Lt.length;Xt++)X(Lt[Xt],Vt);G.projectionMatrix.copy(L.projectionMatrix),G.projectionMatrixInverse.copy(L.projectionMatrixInverse),D===null&&nt.isPerspectiveCamera&&(D={camera:nt,fov:nt.fov,zoom:nt.zoom}),j(nt,G,Vt)};function j(nt,Pt,zt){zt===null?nt.matrix.copy(Pt.matrixWorld):(nt.matrix.copy(zt.matrixWorld),nt.matrix.invert(),nt.matrix.multiply(Pt.matrixWorld)),nt.matrix.decompose(nt.position,nt.quaternion,nt.scale),nt.updateMatrixWorld(!0),nt.projectionMatrix.copy(Pt.projectionMatrix),nt.projectionMatrixInverse.copy(Pt.projectionMatrixInverse),nt.isPerspectiveCamera&&(nt.fov=Ba*2*Math.atan(1/nt.projectionMatrix.elements[5]),nt.zoom=1)}this.getCamera=function(){return G},this.getFoveation=function(){if(!(p===null&&d===null))return l},this.setFoveation=function(nt){l=nt,p!==null&&(p.fixedFoveation=nt),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=nt)},this.hasDepthSensing=function(){return c.texture!==null},this.getDepthSensingMesh=function(){return c.getMesh(G)},this.getCameraTexture=function(nt){return g[nt]};let it=null;function vt(nt,Pt){if(u=Pt.getViewerPose(h||a),m=Pt,u!==null){let zt=u.views;d!==null&&(t.setRenderTargetFramebuffer(v,d.framebuffer),t.setRenderTarget(v));let Vt=!1;zt.length!==G.cameras.length&&(G.cameras.length=0,Vt=!0);for(let $t=0;$t<zt.length;$t++){let ie=zt[$t],ae=null;if(d!==null)ae=d.getViewport(ie);else{let Mt=f.getViewSubImage(p,ie);ae=Mt.viewport,$t===0&&(t.setRenderTargetTextures(v,Mt.colorTexture,Mt.depthStencilTexture),t.setRenderTarget(v))}let ct=z[$t];ct===void 0&&(ct=new nn,ct.layers.enable($t),ct.viewport=new Ce,z[$t]=ct),ct.matrix.fromArray(ie.transform.matrix),ct.matrix.decompose(ct.position,ct.quaternion,ct.scale),ct.projectionMatrix.fromArray(ie.projectionMatrix),ct.projectionMatrixInverse.copy(ct.projectionMatrix).invert(),ct.viewport.set(ae.x,ae.y,ae.width,ae.height),$t===0&&(G.matrix.copy(ct.matrix),G.matrix.decompose(G.position,G.quaternion,G.scale)),Vt===!0&&G.cameras.push(ct)}let Lt=s.enabledFeatures;if(Lt&&Lt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&x){f=n.getBinding();let $t=f.getDepthInformation(zt[0]);$t&&$t.isValid&&$t.texture&&c.init($t,s.renderState)}if(Lt&&Lt.includes("camera-access")&&x){t.state.unbindTexture(),f=n.getBinding();for(let $t=0;$t<zt.length;$t++){let ie=zt[$t].camera;if(ie){let ae=g[ie];ae||(ae=new hr,g[ie]=ae);let ct=f.getCameraImage(ie);ae.sourceTexture=ct}}}}for(let zt=0;zt<R.length;zt++){let Vt=w[zt],Lt=R[zt];Vt!==null&&Lt!==void 0&&Lt.update(Vt,Pt,h||a)}it&&it(nt,Pt),Pt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Pt}),m=null}let Bt=new Ku;Bt.setAnimationLoop(vt),this.setAnimationLoop=function(nt){it=nt},this.dispose=function(){}}},Dx=new pe,od=new te;od.set(-1,0,0,0,1,0,0,0,1);function Nx(i,t){function e(c,g){c.matrixAutoUpdate===!0&&c.updateMatrix(),g.value.copy(c.matrix)}function n(c,g){g.color.getRGB(c.fogColor.value,Sc(i)),g.isFog?(c.fogNear.value=g.near,c.fogFar.value=g.far):g.isFogExp2&&(c.fogDensity.value=g.density)}function s(c,g,_,M,v){g.isNodeMaterial?g.uniformsNeedUpdate=!1:g.isMeshBasicMaterial?r(c,g):g.isMeshLambertMaterial?(r(c,g),g.envMap&&(c.envMapIntensity.value=g.envMapIntensity)):g.isMeshToonMaterial?(r(c,g),f(c,g)):g.isMeshPhongMaterial?(r(c,g),u(c,g),g.envMap&&(c.envMapIntensity.value=g.envMapIntensity)):g.isMeshStandardMaterial?(r(c,g),p(c,g),g.isMeshPhysicalMaterial&&d(c,g,v)):g.isMeshMatcapMaterial?(r(c,g),m(c,g)):g.isMeshDepthMaterial?r(c,g):g.isMeshDistanceMaterial?(r(c,g),x(c,g)):g.isMeshNormalMaterial?r(c,g):g.isLineBasicMaterial?(a(c,g),g.isLineDashedMaterial&&o(c,g)):g.isPointsMaterial?l(c,g,_,M):g.isSpriteMaterial?h(c,g):g.isShadowMaterial?(c.color.value.copy(g.color),c.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function r(c,g){c.opacity.value=g.opacity,g.color&&c.diffuse.value.copy(g.color),g.emissive&&c.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(c.map.value=g.map,e(g.map,c.mapTransform)),g.alphaMap&&(c.alphaMap.value=g.alphaMap,e(g.alphaMap,c.alphaMapTransform)),g.bumpMap&&(c.bumpMap.value=g.bumpMap,e(g.bumpMap,c.bumpMapTransform),c.bumpScale.value=g.bumpScale,g.side===un&&(c.bumpScale.value*=-1)),g.normalMap&&(c.normalMap.value=g.normalMap,e(g.normalMap,c.normalMapTransform),c.normalScale.value.copy(g.normalScale),g.side===un&&c.normalScale.value.negate()),g.displacementMap&&(c.displacementMap.value=g.displacementMap,e(g.displacementMap,c.displacementMapTransform),c.displacementScale.value=g.displacementScale,c.displacementBias.value=g.displacementBias),g.emissiveMap&&(c.emissiveMap.value=g.emissiveMap,e(g.emissiveMap,c.emissiveMapTransform)),g.specularMap&&(c.specularMap.value=g.specularMap,e(g.specularMap,c.specularMapTransform)),g.alphaTest>0&&(c.alphaTest.value=g.alphaTest);let _=t.get(g),M=_.envMap,v=_.envMapRotation;M&&(c.envMap.value=M,c.envMapRotation.value.setFromMatrix4(Dx.makeRotationFromEuler(v)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&c.envMapRotation.value.premultiply(od),c.reflectivity.value=g.reflectivity,c.ior.value=g.ior,c.refractionRatio.value=g.refractionRatio),g.lightMap&&(c.lightMap.value=g.lightMap,c.lightMapIntensity.value=g.lightMapIntensity,e(g.lightMap,c.lightMapTransform)),g.aoMap&&(c.aoMap.value=g.aoMap,c.aoMapIntensity.value=g.aoMapIntensity,e(g.aoMap,c.aoMapTransform))}function a(c,g){c.diffuse.value.copy(g.color),c.opacity.value=g.opacity,g.map&&(c.map.value=g.map,e(g.map,c.mapTransform))}function o(c,g){c.dashSize.value=g.dashSize,c.totalSize.value=g.dashSize+g.gapSize,c.scale.value=g.scale}function l(c,g,_,M){c.diffuse.value.copy(g.color),c.opacity.value=g.opacity,c.size.value=g.size*_,c.scale.value=M*.5,g.map&&(c.map.value=g.map,e(g.map,c.uvTransform)),g.alphaMap&&(c.alphaMap.value=g.alphaMap,e(g.alphaMap,c.alphaMapTransform)),g.alphaTest>0&&(c.alphaTest.value=g.alphaTest)}function h(c,g){c.diffuse.value.copy(g.color),c.opacity.value=g.opacity,c.rotation.value=g.rotation,g.map&&(c.map.value=g.map,e(g.map,c.mapTransform)),g.alphaMap&&(c.alphaMap.value=g.alphaMap,e(g.alphaMap,c.alphaMapTransform)),g.alphaTest>0&&(c.alphaTest.value=g.alphaTest)}function u(c,g){c.specular.value.copy(g.specular),c.shininess.value=Math.max(g.shininess,1e-4)}function f(c,g){g.gradientMap&&(c.gradientMap.value=g.gradientMap)}function p(c,g){c.metalness.value=g.metalness,g.metalnessMap&&(c.metalnessMap.value=g.metalnessMap,e(g.metalnessMap,c.metalnessMapTransform)),c.roughness.value=g.roughness,g.roughnessMap&&(c.roughnessMap.value=g.roughnessMap,e(g.roughnessMap,c.roughnessMapTransform)),g.envMap&&(c.envMapIntensity.value=g.envMapIntensity)}function d(c,g,_){c.ior.value=g.ior,g.diffuseRoughness>0&&(c.diffuseRoughness.value=g.diffuseRoughness,g.diffuseRoughnessMap&&(c.diffuseRoughnessMap.value=g.diffuseRoughnessMap,e(g.diffuseRoughnessMap,c.diffuseRoughnessMapTransform))),g.sheen>0&&(c.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),c.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(c.sheenColorMap.value=g.sheenColorMap,e(g.sheenColorMap,c.sheenColorMapTransform)),g.sheenRoughnessMap&&(c.sheenRoughnessMap.value=g.sheenRoughnessMap,e(g.sheenRoughnessMap,c.sheenRoughnessMapTransform))),g.clearcoat>0&&(c.clearcoat.value=g.clearcoat,c.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(c.clearcoatMap.value=g.clearcoatMap,e(g.clearcoatMap,c.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(c.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,e(g.clearcoatRoughnessMap,c.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(c.clearcoatNormalMap.value=g.clearcoatNormalMap,e(g.clearcoatNormalMap,c.clearcoatNormalMapTransform),c.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===un&&c.clearcoatNormalScale.value.negate())),g.dispersion>0&&(c.dispersion.value=g.dispersion),g.retroreflectivity>0&&(c.retroreflectivity.value=g.retroreflectivity),g.iridescence>0&&(c.iridescence.value=g.iridescence,c.iridescenceIOR.value=g.iridescenceIOR,c.iridescenceThicknessMinimum.value=g.iridescenceThicknessMinimum,c.iridescenceThicknessMaximum.value=g.iridescenceThicknessMaximum,g.iridescenceMap&&(c.iridescenceMap.value=g.iridescenceMap,e(g.iridescenceMap,c.iridescenceMapTransform)),g.iridescenceThicknessMap&&(c.iridescenceThicknessMap.value=g.iridescenceThicknessMap,e(g.iridescenceThicknessMap,c.iridescenceThicknessMapTransform))),g.transmission>0&&(c.transmission.value=g.transmission,c.transmissionSamplerMap.value=_.texture,c.transmissionSamplerSize.value.set(_.width,_.height),g.transmissionMap&&(c.transmissionMap.value=g.transmissionMap,e(g.transmissionMap,c.transmissionMapTransform)),c.thickness.value=g.thickness,g.thicknessMap&&(c.thicknessMap.value=g.thicknessMap,e(g.thicknessMap,c.thicknessMapTransform)),c.attenuationDistance.value=g.attenuationDistance,c.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(c.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(c.anisotropyMap.value=g.anisotropyMap,e(g.anisotropyMap,c.anisotropyMapTransform))),c.specularIntensity.value=g.specularIntensity,c.specularColor.value.copy(g.specularColor),g.specularColorMap&&(c.specularColorMap.value=g.specularColorMap,e(g.specularColorMap,c.specularColorMapTransform)),g.specularIntensityMap&&(c.specularIntensityMap.value=g.specularIntensityMap,e(g.specularIntensityMap,c.specularIntensityMapTransform))}function m(c,g){g.matcap&&(c.matcap.value=g.matcap)}function x(c,g){let _=t.get(g).light;c.referencePosition.value.setFromMatrixPosition(_.matrixWorld),c.nearDistance.value=_.shadow.camera.near,c.farDistance.value=_.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Ux(i,t,e,n){let s={},r={};function a(_,M){let v=M.program;n.uniformBlockBinding(_,v,s[_.id])}function o(_,M){let v=s[_.id];v===void 0&&(m(_),v=l(_),s[_.id]=v,_.addEventListener("dispose",c));let R=M.program;n.updateUBOMapping(_,R);let w=t.render.frame;r[_.id]!==w&&(h(_),r[_.id]=w)}function l(_){let M=i.createBuffer(),v=_.__size,R=_.usage;return i.bindBuffer(i.UNIFORM_BUFFER,M),i.bufferData(i.UNIFORM_BUFFER,v,R),i.bindBuffer(i.UNIFORM_BUFFER,null),M}function h(_){let M=s[_.id],v=_.uniforms,R=_.__cache;i.bindBuffer(i.UNIFORM_BUFFER,M);for(let w=0,y=v.length;w<y;w++){let S=v[w];if(Array.isArray(S))for(let D=0,L=S.length;D<L;D++)u(S[D],w,D,R);else u(S,w,0,R)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function u(_,M,v,R){if(p(_,M,v,R)===!0){let w=_.__offset,y=_.value;if(Array.isArray(y)){let S=0;for(let D=0;D<y.length;D++){let L=y[D],U=x(L,!0);f(L,_.__data,S),S+=U.storage/Float32Array.BYTES_PER_ELEMENT}}else f(y,_.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,w,_.__data)}}function f(_,M,v){typeof _=="number"||typeof _=="boolean"?M[v]=_:_.isMatrix3?(M[v]=_.elements[0],M[v+1]=_.elements[1],M[v+2]=_.elements[2],M[v+3]=0,M[v+4]=_.elements[3],M[v+5]=_.elements[4],M[v+6]=_.elements[5],M[v+7]=0,M[v+8]=_.elements[6],M[v+9]=_.elements[7],M[v+10]=_.elements[8],M[v+11]=0):ArrayBuffer.isView(_)?M.set(_.subarray(0,M.length-v),v):_.toArray(M,v)}function p(_,M,v,R){let w=_.value,y=M+"_"+v;if(Array.isArray(w)){R[y]===void 0&&(R[y]=[]);let S=R[y],D=!1;for(let L=0;L<w.length;L++)d(w[L],S,L)===!0&&(D=!0);return D}return d(w,R,y)}function d(_,M,v){if(M[v]===void 0)return typeof _=="number"||typeof _=="boolean"?M[v]=_:ArrayBuffer.isView(_)?M[v]=_.slice():M[v]=_.clone(),!0;{let R=M[v];if(typeof _=="number"||typeof _=="boolean"){if(R!==_)return M[v]=_,!0}else{if(ArrayBuffer.isView(_))return!0;if(R.equals(_)===!1)return R.copy(_),!0}}return!1}function m(_){let M=_.uniforms,v=0,R=16;for(let y=0,S=M.length;y<S;y++){let D=Array.isArray(M[y])?M[y]:[M[y]];for(let L=0,U=D.length;L<U;L++){let z=D[L],G=Array.isArray(z.value)?z.value:[z.value],N=Array.isArray(M[y])||Array.isArray(z.value),q=v;for(let W=0,$=G.length;W<$;W++){let X=G[W],j=x(X,N),it=v%R,vt=it%j.boundary,Bt=it+vt;v+=vt,Bt!==0&&R-Bt<j.storage&&(v+=R-Bt),W===0&&(q=v),v+=j.storage}let Y=z.type==="int"?Int32Array:z.type==="uint"?Uint32Array:Float32Array;z.__data=new Y((v-q)/Float32Array.BYTES_PER_ELEMENT),z.__offset=q}}let w=v%R;return w>0&&(v+=R-w),_.__size=v,_.__cache={},this}function x(_,M){let v={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(v.boundary=4,v.storage=4):_.isVector2?(v.boundary=8,v.storage=8):_.isVector3||_.isColor?(v.boundary=16,v.storage=12):_.isVector4?(v.boundary=16,v.storage=16):_.isMatrix3?(v.boundary=16,v.storage=48):_.isMatrix4?(v.boundary=16,v.storage=64):_.isTexture?Kt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(_)?(v.boundary=16,v.storage=_.byteLength):Kt("WebGLRenderer: Unsupported uniform value type.",_),M===!0&&(v.boundary=16,v.storage=Math.ceil(v.storage/16)*16),v}function c(_){let M=_.target;M.removeEventListener("dispose",c),i.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function g(){for(let _ in s)i.deleteBuffer(s[_]);s={},r={}}return{bind:a,update:o,dispose:g}}var Fx=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),qn=null;function Ox(){return qn===null&&(qn=new or(Fx,16,16,Ii,Ze),qn.name="DFG_LUT",qn.minFilter=cn,qn.magFilter=cn,qn.wrapS=kn,qn.wrapT=kn,qn.generateMipmaps=!1,qn.needsUpdate=!0),qn}var tl=class{constructor(t={}){let{canvas:e=_u(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:h=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:p=!1,outputBufferType:d=dn}=t;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=a;let x=d,c=new Set([yo,_o,xo]),g=new Set([dn,Fn,Ls,Ki,po,mo]),_=new Uint32Array(4),M=new Int32Array(4),v={textures:[],min:[],max:[],resolution:[]},R=null,w=null,y=[],S=[],D=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Xn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let L=this,U=!1,z=null,G=null,N=null,q=null;this._outputColorSpace=en;let Y=0,W=0,$=null,X=-1,j=null,it=new Ce,vt=new Ce,Bt=null,nt=new Yt(0),Pt=0,zt=e.width,Vt=e.height,Lt=1,Xt=null,Te=null,$t=new Ce(0,0,zt,Vt),ie=new Ce(0,0,zt,Vt),ae=!1,ct=new bi,Mt=new Ga,St=!1,Ot=!1,At=new pe,ee=new H,b=new Ce,C={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},B=!1;function F(){return $===null?Lt:1}let P=n;function mt(E,V){return e.getContext(E,V)}let ut,A,k,tt,et,ht,I,T,Z,dt,lt,bt,Ct,rt,at,Et,O,ot,st,wt,yt,Tt,qt;try{let E={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:h,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${"187"}`),e.addEventListener("webglcontextlost",Jt,!1),e.addEventListener("webglcontextrestored",oe,!1),e.addEventListener("webglcontextcreationerror",Nt,!1),P===null){let V="webgl2";if(P=mt(V,E),P===null)throw mt(V)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}le()}catch(E){throw e.removeEventListener("webglcontextlost",Jt,!1),e.removeEventListener("webglcontextrestored",oe,!1),e.removeEventListener("webglcontextcreationerror",Nt,!1),Qt("WebGLRenderer: "+E.message),E}function le(){ut=new Z0(P),ut.init(),yt=new Ix(P,ut),A=new O0(P,ut,t,yt),k=new Rx(P,ut),A.reversedDepthBuffer&&p&&k.buffers.depth.setReversed(!0),G=P.createFramebuffer(),N=P.createFramebuffer(),q=P.createFramebuffer(),tt=new K0(P),et=new px,ht=new Cx(P,ut,k,et,A,yt,tt),I=new Y0(L),T=new jf(P),Tt=new U0(P,T),Z=new J0(P,T,tt,Tt),dt=new j0(P,Z,T,Tt,tt),ot=new Q0(P,A,ht),at=new B0(et),lt=new fx(L,I,ut,A,Tt,at),bt=new Nx(L,et),Ct=new gx,rt=new Sx(ut),O=new N0(L,I,k,dt,m,l),Et=new Ax(L,dt,A),qt=new Ux(P,tt,A,k),st=new F0(P,ut,tt),wt=new $0(P,ut,tt),tt.programs=lt.programs,L.capabilities=A,L.extensions=ut,L.properties=et,L.renderLists=Ct,L.shadowMap=Et,L.state=k,L.info=tt}x!==dn&&(D=new eg(x,e.width,e.height,o,s,r));let xt=new kc(L,P);this.xr=xt,this.getContext=function(){return P},this.getContextAttributes=function(){return P.getContextAttributes()},this.forceContextLoss=function(){let E=ut.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){let E=ut.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return Lt},this.setPixelRatio=function(E){E!==void 0&&(Lt=E,this.setSize(zt,Vt,!1))},this.getSize=function(E){return E.set(zt,Vt)},this.setSize=function(E,V,Q=!0){if(xt.isPresenting){Kt("WebGLRenderer: Can't change size while VR device is presenting.");return}zt=E,Vt=V,e.width=Math.floor(E*Lt),e.height=Math.floor(V*Lt),Q===!0&&(e.style.width=E+"px",e.style.height=V+"px"),D!==null&&D.setSize(e.width,e.height),this.setViewport(0,0,E,V)},this.getDrawingBufferSize=function(E){return E.set(zt*Lt,Vt*Lt).floor()},this.setDrawingBufferSize=function(E,V,Q){zt=E,Vt=V,Lt=Q,e.width=Math.floor(E*Q),e.height=Math.floor(V*Q),this.setViewport(0,0,E,V)},this.setEffects=function(E){if(x===dn){Qt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(E){for(let V=0;V<E.length;V++)if(E[V].isOutputPass===!0){Kt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}D.setEffects(E||[])},this.getCurrentViewport=function(E){return E.copy(it)},this.getViewport=function(E){return E.copy($t)},this.setViewport=function(E,V,Q,J){E.isVector4?$t.set(E.x,E.y,E.z,E.w):$t.set(E,V,Q,J),k.viewport(it.copy($t).multiplyScalar(F()).round())},this.getScissor=function(E){return E.copy(ie)},this.setScissor=function(E,V,Q,J){E.isVector4?ie.set(E.x,E.y,E.z,E.w):ie.set(E,V,Q,J),k.scissor(vt.copy(ie).multiplyScalar(F()).round())},this.getScissorTest=function(){return ae},this.setScissorTest=function(E){k.setScissorTest(ae=E)},this.setOpaqueSort=function(E){Xt=E},this.setTransparentSort=function(E){Te=E},this.getClearColor=function(E){return E.copy(O.getClearColor())},this.setClearColor=function(){O.setClearColor(...arguments)},this.getClearAlpha=function(){return O.getClearAlpha()},this.setClearAlpha=function(){O.setClearAlpha(...arguments)},this.clear=function(E=!0,V=!0,Q=!0){let J=0;if(E){let K=!1;if($!==null){let It=$.texture.format;K=c.has(It)}if(K){let It=$.texture.type,kt=g.has(It),Rt=O.getClearColor(),Ft=O.getClearAlpha(),Wt=Rt.r,ne=Rt.g,me=Rt.b;kt?(_[0]=Wt,_[1]=ne,_[2]=me,_[3]=Ft,P.clearBufferuiv(P.COLOR,0,_)):(M[0]=Wt,M[1]=ne,M[2]=me,M[3]=Ft,P.clearBufferiv(P.COLOR,0,M))}else J|=P.COLOR_BUFFER_BIT}V&&(J|=P.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Q&&(J|=P.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),J!==0&&P.clear(J)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(E){E.setRenderer(this),z=E},this.dispose=function(){e.removeEventListener("webglcontextlost",Jt,!1),e.removeEventListener("webglcontextrestored",oe,!1),e.removeEventListener("webglcontextcreationerror",Nt,!1),O.dispose(),Ct.dispose(),rt.dispose(),ht.dispose(),et.dispose(),I.dispose(),dt.dispose(),Z.dispose(),Tt.dispose(),qt.dispose(),lt.dispose(),xt.dispose(),xt.removeEventListener("sessionstart",Zc),xt.removeEventListener("sessionend",Jc),Fi.stop()};function Jt(E){E.preventDefault(),yc("WebGLRenderer: Context Lost."),U=!0}function oe(){yc("WebGLRenderer: Context Restored."),U=!1;let E=tt.autoReset,V=Et.enabled,Q=Et.autoUpdate,J=Et.needsUpdate,K=Et.type;le(),tt.autoReset=E,Et.enabled=V,Et.autoUpdate=Q,Et.needsUpdate=J,Et.type=K}function Nt(E){Qt("WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function Se(E){let V=E.target;V.removeEventListener("dispose",Se),He(V)}function He(E){hi(E),et.remove(E)}function hi(E){let V=et.get(E).programs;V!==void 0&&(V.forEach(function(Q){lt.releaseProgram(Q)}),E.isShaderMaterial&&lt.releaseShaderCache(E))}this.renderBufferDirect=function(E,V,Q,J,K,It){V===null&&(V=C);let kt=K.isMesh&&K.matrixWorld.determinantAffine()<0,Rt=Id(E,V,Q,J,K);k.setMaterial(J,kt);let Ft=Q.index,Wt=1;if(J.wireframe===!0){if(Ft=Z.getWireframeAttribute(Q),Ft===void 0)return;Wt=2}let ne=Q.drawRange,me=Q.attributes.position,Ht=ne.start*Wt,ge=(ne.start+ne.count)*Wt;It!==null&&(Ht=Math.max(Ht,It.start*Wt),ge=Math.min(ge,(It.start+It.count)*Wt)),Ft!==null?(Ht=Math.max(Ht,0),ge=Math.min(ge,Ft.count)):me!=null&&(Ht=Math.max(Ht,0),ge=Math.min(ge,me.count));let Ne=ge-Ht;if(Ne<0||Ne===1/0)return;Tt.setup(K,J,Rt,Q,Ft);let Ae,we=st;if(Ft!==null&&(Ae=T.get(Ft),we=wt,we.setIndex(Ae)),K.isMesh)J.wireframe===!0?(k.setLineWidth(J.wireframeLinewidth*F()),we.setMode(P.LINES)):we.setMode(P.TRIANGLES);else if(K.isLine){let $e=J.linewidth;$e===void 0&&($e=1),k.setLineWidth($e*F()),K.isLineSegments?we.setMode(P.LINES):K.isLineLoop?we.setMode(P.LINE_LOOP):we.setMode(P.LINE_STRIP)}else K.isPoints?we.setMode(P.POINTS):K.isSprite&&we.setMode(P.TRIANGLES);if(K.isBatchedMesh)if(ut.get("WEBGL_multi_draw"))we.renderMultiDraw(K._multiDrawStarts,K._multiDrawCounts,K._multiDrawCount);else{let $e=K._multiDrawStarts,Gt=K._multiDrawCounts,ln=K._multiDrawCount,ve=Ft?T.get(Ft).bytesPerElement:1,Oi=et.get(J).currentProgram.getUniforms();for(let Ke=0;Ke<ln;Ke++)Oi.setValue(P,"_gl_DrawID",Ke),we.render($e[Ke]/ve,Gt[Ke])}else if(K.isInstancedMesh)we.renderInstances(Ht,Ne,K.count);else if(Q.isInstancedBufferGeometry){let $e=Q._maxInstanceCount!==void 0?Q._maxInstanceCount:1/0,Gt=Math.min(Q.instanceCount,$e);we.renderInstances(Ht,Ne,Gt)}else we.render(Ht,Ne)};function Yc(E,V,Q,J){z!==null&&E.isNodeMaterial&&z.setObject(J,E),St===!0&&at.setState(E,Q,!1),E.transparent===!0&&E.side===wn&&E.forceSinglePass===!1?(E.side=un,E.needsUpdate=!0,ks(E,V,J),E.side=Wn,E.needsUpdate=!0,ks(E,V,J),E.side=wn):ks(E,V,J)}this.compile=function(E,V,Q=null){Q===null&&(Q=E),z!==null&&z.renderStart(E,V,Q),w=rt.get(Q),w.init(V),S.push(w),Q.traverseVisible(function(K){K.isLight&&K.layers.test(V.layers)&&(w.pushLight(K),K.castShadow&&w.pushShadow(K))}),E!==Q&&E.traverseVisible(function(K){K.isLight&&K.layers.test(V.layers)&&(w.pushLight(K),K.castShadow&&w.pushShadow(K))}),w.setupLights(),z!==null&&z.updateLights(w.state.lightsArray),Ot=this.localClippingEnabled,St=at.init(this.clippingPlanes,Ot),St===!0&&at.setGlobalState(this.clippingPlanes,V),z!==null&&Et.render(w.state.shadowsArray,Q,V);let J=new Set;return E.traverse(function(K){if(!(K.isMesh||K.isPoints||K.isLine||K.isSprite))return;let It=K.material;if(It)if(Array.isArray(It))for(let kt=0;kt<It.length;kt++){let Rt=It[kt];Yc(Rt,Q,V,K),J.add(Rt)}else Yc(It,Q,V,K),J.add(It)}),w=S.pop(),z!==null&&z.renderEnd(),J},this.compileAsync=function(E,V,Q=null){let J=this.compile(E,V,Q);return new Promise(K=>{function It(){if(J.forEach(function(kt){let Ft=et.get(kt).currentProgram;(Ft===void 0||Ft.isReady())&&J.delete(kt)}),J.size===0){K(E);return}setTimeout(It,10)}ut.get("KHR_parallel_shader_compile")!==null?It():setTimeout(It,10)})};let ml=null;function Rd(E){ml&&ml(E)}function Zc(){Fi.stop()}function Jc(){Fi.start()}let Fi=new Ku;Fi.setAnimationLoop(Rd),typeof self<"u"&&Fi.setContext(self),this.setAnimationLoop=function(E){ml=E,xt.setAnimationLoop(E),E===null?Fi.stop():Fi.start()},xt.addEventListener("sessionstart",Zc),xt.addEventListener("sessionend",Jc),this.render=function(E,V){if(V!==void 0&&V.isCamera!==!0){Qt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(U===!0)return;z!==null&&z.renderStart(E,V);let Q=xt.enabled===!0&&xt.isPresenting===!0,J=D!==null&&($===null||Q)&&D.begin(L,$);if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),V.parent===null&&V.matrixWorldAutoUpdate===!0&&V.updateMatrixWorld(),xt.enabled===!0&&xt.isPresenting===!0&&(D===null||D.isCompositing()===!1)&&(xt.cameraAutoUpdate===!0&&xt.updateCamera(V),V=xt.getCamera()),E.isScene===!0&&E.onBeforeRender(L,E,V,$),w=rt.get(E,S.length),w.init(V),w.state.textureUnits=ht.getTextureUnits(),S.push(w),At.multiplyMatrices(V.projectionMatrix,V.matrixWorldInverse),V.isArrayCamera?Mt.setFromArrayCamera(V):ct.setFromProjectionMatrix(At,Tn,V.reversedDepth),Ot=this.localClippingEnabled,St=at.init(this.clippingPlanes,Ot),R=Ct.get(E,y.length),R.init(),y.push(R),this.info.render.frame++,xt.enabled===!0&&xt.isPresenting===!0){let kt=L.xr.getDepthSensingMesh();kt!==null&&gl(kt,V,-1/0,L.sortObjects)}gl(E,V,0,L.sortObjects),R.finish(),z!==null&&z.updateLights(w.state.lightsArray),L.sortObjects===!0&&R.sort(Xt,Te),B=xt.enabled===!1||xt.isPresenting===!1||xt.hasDepthSensing()===!1,B&&O.addToRenderList(R,E),this.info.autoReset===!0&&this.info.reset(),St===!0&&at.beginShadows();let K=w.state.shadowsArray;if(Et.render(K,E,V),St===!0&&at.endShadows(),(J&&D.hasRenderPass())===!1){let kt=R.opaque,Rt=R.transmissive;if(w.setupLights(),V.isArrayCamera){let Ft=V.cameras;if(Rt.length>0)for(let Wt=0,ne=Ft.length;Wt<ne;Wt++){let me=Ft[Wt];Kc(kt,Rt,E,me)}B&&O.render(E);for(let Wt=0,ne=Ft.length;Wt<ne;Wt++){let me=Ft[Wt];$c(R,E,me,me.viewport)}}else Rt.length>0&&Kc(kt,Rt,E,V),B&&O.render(E),$c(R,E,V)}$!==null&&W===0&&(ht.updateMultisampleRenderTarget($),ht.updateRenderTargetMipmap($)),J&&D.end(L),E.isScene===!0&&E.onAfterRender(L,E,V),Tt.resetDefaultState(),X=-1,j=null,S.pop(),S.length>0?(w=S[S.length-1],ht.setTextureUnits(w.state.textureUnits),St===!0&&at.setGlobalState(L.clippingPlanes,w.state.camera)):w=null,y.pop(),y.length>0?R=y[y.length-1]:R=null,z!==null&&z.renderEnd()};function gl(E,V,Q,J){if(E.visible===!1)return;if(E.layers.test(V.layers)){if(E.isGroup)Q=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(V);else if(E.isLight)w.pushLight(E),E.castShadow&&w.pushShadow(E);else if(E.isSprite){let kt=V.isArrayCamera?Mt:ct;if(!E.frustumCulled||E.intersectsFrustum(kt)){J&&b.setFromMatrixPosition(E.matrixWorld).applyMatrix4(At);let Rt=dt.update(E),Ft=E.material;Ft.visible&&R.push(E,Rt,Ft,Q,b.z,null,V)}}else if(E.isMesh||E.isLine||E.isPoints){let kt=V.isArrayCamera?Mt:ct;if(!E.frustumCulled||E.intersectsFrustum(kt)){let Rt=dt.update(E),Ft=E.material;if(J&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),b.copy(E.boundingSphere.center)):(Rt.boundingSphere===null&&Rt.computeBoundingSphere(),b.copy(Rt.boundingSphere.center)),b.applyMatrix4(E.matrixWorld).applyMatrix4(At)),Array.isArray(Ft)){let Wt=Rt.groups;for(let ne=0,me=Wt.length;ne<me;ne++){let Ht=Wt[ne],ge=Ft[Ht.materialIndex];ge&&ge.visible&&R.push(E,Rt,ge,Q,b.z,Ht,V)}}else Ft.visible&&R.push(E,Rt,Ft,Q,b.z,null,V)}}}let It=E.children;for(let kt=0,Rt=It.length;kt<Rt;kt++)gl(It[kt],V,Q,J)}function $c(E,V,Q,J){let{opaque:K,transmissive:It,transparent:kt}=E;w.setupLightsView(Q),St===!0&&at.setGlobalState(L.clippingPlanes,Q),J&&k.viewport(it.copy(J)),K.length>0&&na(K,V,Q),It.length>0&&na(It,V,Q),kt.length>0&&na(kt,V,Q),k.buffers.depth.setTest(!0),k.buffers.depth.setMask(!0),k.buffers.color.setMask(!0),k.setPolygonOffset(!1)}function Kc(E,V,Q,J){if((Q.isScene===!0?Q.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[J.id]===void 0){let Ht=ut.has("EXT_color_buffer_half_float")||ut.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[J.id]=new Oe(1,1,{generateMipmaps:!0,type:Ht?Ze:dn,minFilter:ri,samples:Math.max(4,A.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ue.workingColorSpace})}let It=w.state.transmissionRenderTarget[J.id],kt=J.viewport||it;It.setSize(kt.z*L.transmissionResolutionScale,kt.w*L.transmissionResolutionScale);let Rt=L.getRenderTarget(),Ft=L.getActiveCubeFace(),Wt=L.getActiveMipmapLevel();L.setRenderTarget(It),L.getClearColor(nt),Pt=L.getClearAlpha(),Pt<1&&L.setClearColor(16777215,.5),L.clear(),B&&O.render(Q);let ne=L.toneMapping;L.toneMapping=Xn;let me=J.viewport;if(J.viewport!==void 0&&(J.viewport=void 0),w.setupLightsView(J),St===!0&&at.setGlobalState(L.clippingPlanes,J),na(E,Q,J),ht.updateMultisampleRenderTarget(It),ht.updateRenderTargetMipmap(It),ut.has("WEBGL_multisampled_render_to_texture")===!1){let Ht=!1;for(let ge=0,Ne=V.length;ge<Ne;ge++){let Ae=V[ge],{object:we,geometry:$e,material:Gt,group:ln}=Ae;if(Gt.side===wn&&we.layers.test(J.layers)){let ve=Gt.side;Gt.side=un,Gt.needsUpdate=!0,Qc(we,Q,J,$e,Gt,ln),Gt.side=ve,Gt.needsUpdate=!0,Ht=!0}}Ht===!0&&(ht.updateMultisampleRenderTarget(It),ht.updateRenderTargetMipmap(It))}L.setRenderTarget(Rt,Ft,Wt),L.setClearColor(nt,Pt),me!==void 0&&(J.viewport=me),L.toneMapping=ne}function na(E,V,Q){let J=V.isScene===!0?V.overrideMaterial:null;for(let K=0,It=E.length;K<It;K++){let kt=E[K],{object:Rt,geometry:Ft,group:Wt}=kt,ne=kt.material;ne.allowOverride===!0&&J!==null&&(ne=J),Rt.layers.test(Q.layers)&&Qc(Rt,V,Q,Ft,ne,Wt)}}function Qc(E,V,Q,J,K,It){z!==null&&K.isNodeMaterial&&z.setObject(E,K),E.onBeforeRender(L,V,Q,J,K,It),E.modelViewMatrix.multiplyMatrices(Q.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),K.onBeforeRender(L,V,Q,J,E,It),K.transparent===!0&&K.side===wn&&K.forceSinglePass===!1?(K.side=un,K.needsUpdate=!0,L.renderBufferDirect(Q,V,J,K,E,It),K.side=Wn,K.needsUpdate=!0,L.renderBufferDirect(Q,V,J,K,E,It),K.side=wn):L.renderBufferDirect(Q,V,J,K,E,It),E.onAfterRender(L,V,Q,J,K,It)}function jc(E){let V=0;for(let Q of E)Q.texture!==null&&V++;return V}function ks(E,V,Q){V.isScene!==!0&&(V=C);let J=et.get(E),K=w.state.lights,It=w.state.shadowsArray,kt=K.state.version,Rt=lt.getParameters(E,K.state,It,V,Q,w.state.lightProbeGridArray),Ft=lt.getProgramCacheKey(Rt),Wt=J.programs;J.environment=E.isMeshStandardMaterial||E.isMeshLambertMaterial||E.isMeshPhongMaterial?V.environment:null,J.fog=V.fog;let ne=E.isMeshStandardMaterial||E.isMeshLambertMaterial&&!E.envMap||E.isMeshPhongMaterial&&!E.envMap;J.envMap=I.get(E.envMap||J.environment,ne),J.envMapRotation=J.environment!==null&&E.envMap===null?V.environmentRotation:E.envMapRotation,Wt===void 0&&(E.addEventListener("dispose",Se),Wt=new Map,J.programs=Wt,J.programVariants=new Map);let me=Wt.get(Ft);if(me!==void 0){if(J.currentProgram===me&&J.lightsStateVersion===kt)return eh(E,Rt),me}else Rt.uniforms=lt.getUniforms(E),z!==null&&E.isNodeMaterial&&z.build(E,Q,Rt),E.onBeforeCompile(Rt,L),me=lt.acquireProgram(Rt,Ft),Wt.set(Ft,me),J.uniforms=Rt.uniforms;let Ht=J.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Ht.clippingPlanes=at.uniform),eh(E,Rt),J.needsLights=Ld(E),J.lightsStateVersion=kt,J.needsLights&&(Ht.ambientLightColor.value=K.state.ambient,Ht.lightProbe.value=K.state.probe,Ht.sunLights.value=K.state.sun,Ht.sunLightShadows.value=K.state.sunShadow,Ht.directionalLights.value=K.state.directional,Ht.directionalLightShadows.value=K.state.directionalShadow,Ht.spotLights.value=K.state.spot,Ht.spotLightShadows.value=K.state.spotShadow,Ht.rectAreaLights.value=K.state.rectArea,Ht.ltc_1.value=K.state.rectAreaLTC1,Ht.ltc_2.value=K.state.rectAreaLTC2,Ht.pointLights.value=K.state.point,Ht.pointLightShadows.value=K.state.pointShadow,Ht.hemisphereLights.value=K.state.hemi,Ht.sunShadowMatrix.value=K.state.sunShadowMatrix,Ht.sunShadowCascade.value=K.state.sunShadowCascade,Ht.directionalShadowMatrix.value=K.state.directionalShadowMatrix,Ht.spotLightMatrix.value=K.state.spotLightMatrix,Ht.spotLightMap.value=K.state.spotLightMap,Ht.pointShadowMatrix.value=K.state.pointShadowMatrix),J.numLightProbeGrids=jc(w.state.lightProbeGridArray),J.currentProgram=me,J.uniformsList=null,me}function Cd(E,V,Q,J,K){let It=et.get(E),kt=It.currentProgram.id+","+J+","+K,Rt=It.programVariants.get(kt);return Rt===void 0?(Rt=ks(E,V,Q),It.programVariants.set(kt,Rt)):(It.currentProgram=Rt,It.uniformsList=null,It.outputColorSpace=J,It.toneMapping=K),Rt}function th(E){if(E.uniformsList===null){let V=E.currentProgram.getUniforms();E.uniformsList=Ns.seqWithValue(V.seq,E.uniforms)}return E.uniformsList}function eh(E,V){let Q=et.get(E);Q.outputColorSpace=V.outputColorSpace,Q.batching=V.batching,Q.batchingColor=V.batchingColor,Q.instancing=V.instancing,Q.instancingColor=V.instancingColor,Q.instancingMorph=V.instancingMorph,Q.skinning=V.skinning,Q.morphTargets=V.morphTargets,Q.morphNormals=V.morphNormals,Q.morphColors=V.morphColors,Q.morphTargetsCount=V.morphTargetsCount,Q.numClippingPlanes=V.numClippingPlanes,Q.numIntersection=V.numClipIntersection,Q.vertexAlphas=V.vertexAlphas,Q.vertexTangents=V.vertexTangents,Q.toneMapping=V.toneMapping}function Id(E,V,Q,J,K){V.isScene!==!0&&(V=C),ht.resetTextureUnits();let It=V.fog,kt=J.isMeshStandardMaterial||J.isMeshLambertMaterial||J.isMeshPhongMaterial?V.environment:null,Rt=$===null?L.outputColorSpace:$.isXRRenderTarget===!0?$.texture.colorSpace:ue.workingColorSpace,Ft=J.isMeshStandardMaterial||J.isMeshLambertMaterial&&!J.envMap||J.isMeshPhongMaterial&&!J.envMap,Wt=I.get(J.envMap||kt,Ft),ne=J.vertexColors===!0&&!!Q.attributes.color&&Q.attributes.color.itemSize===4,me=!!Q.attributes.tangent&&(!!J.normalMap||J.anisotropy>0),Ht=!!Q.morphAttributes.position,ge=!!Q.morphAttributes.normal,Ne=!!Q.morphAttributes.color,Ae=Xn;J.toneMapped&&($===null||$.isXRRenderTarget===!0)&&(Ae=L.toneMapping);let we=Q.morphAttributes.position||Q.morphAttributes.normal||Q.morphAttributes.color,$e=we!==void 0?we.length:0,Gt=et.get(J),ln=w.state.lights;if(St===!0&&(Ot===!0||E!==j)){let Ie=E===j&&J.id===X;at.setState(J,E,Ie)}let ve=!1,Oi=!1;J.version===Gt.__version?Gt.needsLights&&Gt.lightsStateVersion!==ln.state.version||K.isBatchedMesh&&Gt.batching===!1||!K.isBatchedMesh&&Gt.batching===!0||K.isBatchedMesh&&Gt.batchingColor===!0&&K._colorsTexture===null||K.isBatchedMesh&&Gt.batchingColor===!1&&K._colorsTexture!==null||K.isInstancedMesh&&Gt.instancing===!1||!K.isInstancedMesh&&Gt.instancing===!0||K.isSkinnedMesh&&Gt.skinning===!1||!K.isSkinnedMesh&&Gt.skinning===!0||K.isInstancedMesh&&Gt.instancingColor===!0&&K.instanceColor===null||K.isInstancedMesh&&Gt.instancingColor===!1&&K.instanceColor!==null||K.isInstancedMesh&&Gt.instancingMorph===!0&&K.morphTexture===null||K.isInstancedMesh&&Gt.instancingMorph===!1&&K.morphTexture!==null||Gt.envMap!==Wt||J.fog===!0&&Gt.fog!==It||Gt.numClippingPlanes!==void 0&&(Gt.numClippingPlanes!==at.numPlanes||Gt.numIntersection!==at.numIntersection)||Gt.vertexAlphas!==ne||Gt.vertexTangents!==me||Gt.morphTargets!==Ht||Gt.morphNormals!==ge||Gt.morphColors!==Ne||Gt.morphTargetsCount!==$e||Gt.numLightProbeGrids!==jc(w.state.lightProbeGridArray)?ve=!0:(Gt.outputColorSpace!==Rt||Gt.toneMapping!==Ae)&&(Oi=!0):(ve=!0,Gt.__version=J.version);let Ke=Gt.currentProgram;(ve===!0||Oi===!0)&&(Ke=Oi===!0?Cd(J,V,K,Rt,Ae):ks(J,V,K),z&&J.isNodeMaterial&&z.onUpdateProgram(J,Ke,Gt));let ia=!1,ui=!1,Bi=!1,xe=Ke.getUniforms(),qe=Gt.uniforms;if(k.useProgram(Ke.program)&&(ia=!0,ui=!0,Bi=!0),J.id!==X&&(X=J.id,ui=!0),ia||j!==E){k.buffers.depth.getReversed()&&E.reversedDepth!==!0&&(E._reversedDepth=!0,E.updateProjectionMatrix()),xe.setValue(P,"projectionMatrix",E.projectionMatrix),xe.setValue(P,"viewMatrix",E.matrixWorldInverse);let Ge=xe.map.cameraPosition;Ge!==void 0&&Ge.setValue(P,ee.setFromMatrixPosition(E.matrixWorld)),A.logarithmicDepthBuffer&&xe.setValue(P,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(J.isMeshPhongMaterial||J.isMeshToonMaterial||J.isMeshLambertMaterial||J.isMeshBasicMaterial||J.isMeshStandardMaterial||J.isShaderMaterial)&&xe.setValue(P,"isOrthographic",E.isOrthographicCamera===!0),j!==E&&(j=E,ui=!0,Bi=!0)}if(Gt.needsLights&&(ln.state.sunShadowMap.length>0&&xe.setValue(P,"sunShadowMap",ln.state.sunShadowMap,ht),ln.state.directionalShadowMap.length>0&&xe.setValue(P,"directionalShadowMap",ln.state.directionalShadowMap,ht),ln.state.spotShadowMap.length>0&&xe.setValue(P,"spotShadowMap",ln.state.spotShadowMap,ht),ln.state.pointShadowMap.length>0&&xe.setValue(P,"pointShadowMap",ln.state.pointShadowMap,ht)),K.isSkinnedMesh){xe.setOptional(P,K,"bindMatrix"),xe.setOptional(P,K,"bindMatrixInverse");let Ie=K.skeleton;Ie&&(Ie.boneTexture===null&&Ie.computeBoneTexture(),xe.setValue(P,"boneTexture",Ie.boneTexture,ht))}K.isBatchedMesh&&(xe.setOptional(P,K,"batchingTexture"),xe.setValue(P,"batchingTexture",K._matricesTexture,ht),xe.setOptional(P,K,"batchingIdTexture"),xe.setValue(P,"batchingIdTexture",K._indirectTexture,ht),xe.setOptional(P,K,"batchingColorTexture"),K._colorsTexture!==null&&xe.setValue(P,"batchingColorTexture",K._colorsTexture,ht));let In=Q.morphAttributes;if((In.position!==void 0||In.normal!==void 0||In.color!==void 0)&&ot.update(K,Q,Ke),(ui||Gt.receiveShadow!==K.receiveShadow)&&(Gt.receiveShadow=K.receiveShadow,xe.setValue(P,"receiveShadow",K.receiveShadow)),(J.isMeshStandardMaterial||J.isMeshLambertMaterial||J.isMeshPhongMaterial)&&J.envMap===null&&V.environment!==null&&(qe.envMapIntensity.value=V.environmentIntensity),qe.dfgLUT!==void 0&&(qe.dfgLUT.value=Ox()),ui){if(xe.setValue(P,"toneMappingExposure",L.toneMappingExposure),Gt.needsLights&&Pd(qe,Bi),It&&J.fog===!0&&bt.refreshFogUniforms(qe,It),bt.refreshMaterialUniforms(qe,J,Lt,Vt,w.state.transmissionRenderTarget[E.id]),Gt.needsLights&&Gt.numLightProbeGrids>0){let Ie=v,Ge=0;for(let Zn of w.state.lightProbeGridArray)Zn.texture!==null&&(Ie.textures[Ge]=Zn.texture,Ie.min[Ge]=Zn.boundingBox.min,Ie.max[Ge]=Zn.boundingBox.max,Ie.resolution[Ge]=Zn.resolution,Ge++);for(let Zn in Ie)Ie[Zn].length=Ge;qe.probesSH.value=Ie.textures,qe.probesMin.value=Ie.min,qe.probesMax.value=Ie.max,qe.probesResolution.value=Ie.resolution}Ns.upload(P,th(Gt),qe,ht)}if(J.isShaderMaterial&&J.uniformsNeedUpdate===!0&&(Ns.upload(P,th(Gt),qe,ht),J.uniformsNeedUpdate=!1),J.isSpriteMaterial&&xe.setValue(P,"center",K.center),xe.setValue(P,"modelViewMatrix",K.modelViewMatrix),xe.setValue(P,"normalMatrix",K.normalMatrix),xe.setValue(P,"modelMatrix",K.matrixWorld),J.uniformsGroups!==void 0){let Ie=J.uniformsGroups;for(let Ge=0,Zn=Ie.length;Ge<Zn;Ge++){let ih=Ie[Ge];qt.update(ih,Ke),qt.bind(ih,Ke)}}return Ke}function Pd(E,V){E.ambientLightColor.needsUpdate=V,E.lightProbe.needsUpdate=V,E.sunLights.needsUpdate=V,E.sunLightShadows.needsUpdate=V,E.directionalLights.needsUpdate=V,E.directionalLightShadows.needsUpdate=V,E.pointLights.needsUpdate=V,E.pointLightShadows.needsUpdate=V,E.spotLights.needsUpdate=V,E.spotLightShadows.needsUpdate=V,E.rectAreaLights.needsUpdate=V,E.hemisphereLights.needsUpdate=V}function Ld(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return Y},this.getActiveMipmapLevel=function(){return W},this.getRenderTarget=function(){return $},this.setRenderTargetTextures=function(E,V,Q){let J=et.get(E);J.__autoAllocateDepthBuffer=E.resolveDepthBuffer===!1,J.__autoAllocateDepthBuffer===!1&&(J.__useRenderToTexture=!1),et.get(E.texture).__webglTexture=V,et.get(E.depthTexture).__webglTexture=J.__autoAllocateDepthBuffer?void 0:Q,J.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(E,V){let Q=et.get(E);Q.__webglFramebuffer=V,Q.__useDefaultFramebuffer=V===void 0},this.setRenderTarget=function(E,V=0,Q=0){$=E,Y=V,W=Q;let J=null,K=!1,It=!1;if(E){let Rt=et.get(E);if(Rt.__useDefaultFramebuffer!==void 0){k.bindFramebuffer(P.FRAMEBUFFER,Rt.__webglFramebuffer),it.copy(E.viewport),vt.copy(E.scissor),Bt=E.scissorTest,k.viewport(it),k.scissor(vt),k.setScissorTest(Bt),X=-1;return}else if(Rt.__webglFramebuffer===void 0)ht.setupRenderTarget(E);else if(Rt.__hasExternalTextures)ht.rebindTextures(E,et.get(E.texture).__webglTexture,et.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){let ne=E.depthTexture;if(Rt.__boundDepthTexture!==ne){if(ne!==null&&et.has(ne)&&(E.width!==ne.image.width||E.height!==ne.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");ht.setupDepthRenderbuffer(E)}}let Ft=E.texture;(Ft.isData3DTexture||Ft.isDataArrayTexture||Ft.isCompressedArrayTexture)&&(It=!0);let Wt=et.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Wt[V])?J=Wt[V][Q]:J=Wt[V],K=!0):E.samples>0&&ht.useMultisampledRTT(E)===!1?J=et.get(E).__webglMultisampledFramebuffer:Array.isArray(Wt)?J=Wt[Q]:J=Wt,it.copy(E.viewport),vt.copy(E.scissor),Bt=E.scissorTest}else it.copy($t).multiplyScalar(Lt).floor(),vt.copy(ie).multiplyScalar(Lt).floor(),Bt=ae;if(Q!==0&&(J=G),k.bindFramebuffer(P.FRAMEBUFFER,J)&&k.drawBuffers(E,J),k.viewport(it),k.scissor(vt),k.setScissorTest(Bt),K){let Rt=et.get(E.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_CUBE_MAP_POSITIVE_X+V,Rt.__webglTexture,Q)}else if(It){let Rt=V;for(let Ft=0;Ft<E.textures.length;Ft++){let Wt=et.get(E.textures[Ft]);P.framebufferTextureLayer(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0+Ft,Wt.__webglTexture,Q,Rt)}}else if(E!==null&&Q!==0){let Rt=et.get(E.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,Rt.__webglTexture,Q)}X=-1};function nh(E){let V=et.get(E);return(V.__readFormat!==E.format||V.__readType!==E.type)&&(V.__readFormat=E.format,V.__readType=E.type,V.__formatReadable=A.textureFormatReadable(E.format),V.__typeReadable=A.textureTypeReadable(E.type)),V}this.readRenderTargetPixels=function(E,V,Q,J,K,It,kt,Rt=0){if(!(E&&E.isWebGLRenderTarget)){Qt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ft=et.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&kt!==void 0&&(Ft=Ft[kt],Array.isArray(Ft)&&(Ft=Ft[0])),Ft){k.bindFramebuffer(P.FRAMEBUFFER,Ft);try{let Wt=E.textures[Rt],ne=Wt.format,me=Wt.type;E.textures.length>1&&P.readBuffer(P.COLOR_ATTACHMENT0+Rt);let Ht=nh(Wt);if(Ht.__formatReadable===!1){Qt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ht.__typeReadable===!1){Qt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}V>=0&&V<=E.width-J&&Q>=0&&Q<=E.height-K&&P.readPixels(V,Q,J,K,yt.convert(ne),yt.convert(me),It)}finally{let Wt=$!==null?et.get($).__webglFramebuffer:null;k.bindFramebuffer(P.FRAMEBUFFER,Wt)}}},this.readRenderTargetPixelsAsync=async function(E,V,Q,J,K,It,kt,Rt=0){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ft=et.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&kt!==void 0&&(Ft=Ft[kt],Array.isArray(Ft)&&(Ft=Ft[0])),Ft)if(V>=0&&V<=E.width-J&&Q>=0&&Q<=E.height-K){k.bindFramebuffer(P.FRAMEBUFFER,Ft);let Wt=E.textures[Rt],ne=Wt.format,me=Wt.type;E.textures.length>1&&P.readBuffer(P.COLOR_ATTACHMENT0+Rt);let Ht=nh(Wt);if(Ht.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ht.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let ge=P.createBuffer();P.bindBuffer(P.PIXEL_PACK_BUFFER,ge),P.bufferData(P.PIXEL_PACK_BUFFER,It.byteLength,P.STREAM_READ),P.readPixels(V,Q,J,K,yt.convert(ne),yt.convert(me),0),P.bindBuffer(P.PIXEL_PACK_BUFFER,null);let Ne=$!==null?et.get($).__webglFramebuffer:null;k.bindFramebuffer(P.FRAMEBUFFER,Ne);let Ae=P.fenceSync(P.SYNC_GPU_COMMANDS_COMPLETE,0);return P.flush(),await vu(P,Ae,4),P.bindBuffer(P.PIXEL_PACK_BUFFER,ge),P.getBufferSubData(P.PIXEL_PACK_BUFFER,0,It),P.bindBuffer(P.PIXEL_PACK_BUFFER,null),P.deleteBuffer(ge),P.deleteSync(Ae),It}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(E,V=null,Q=0){let J=Math.pow(2,-Q),K=Math.floor(E.image.width*J),It=Math.floor(E.image.height*J),kt=V!==null?V.x:0,Rt=V!==null?V.y:0;ht.setTexture2D(E,0),P.copyTexSubImage2D(P.TEXTURE_2D,Q,0,0,kt,Rt,K,It),k.unbindTexture()},this.copyTextureToTexture=function(E,V,Q=null,J=null,K=0,It=0){let kt,Rt,Ft,Wt,ne,me,Ht,ge,Ne,Ae=E.isCompressedTexture?E.mipmaps[It]:E.image;if(Q!==null)kt=Q.max.x-Q.min.x,Rt=Q.max.y-Q.min.y,Ft=Q.isBox3?Q.max.z-Q.min.z:1,Wt=Q.min.x,ne=Q.min.y,me=Q.isBox3?Q.min.z:0;else{let xe=Math.pow(2,-K);kt=Math.floor(Ae.width*xe),Rt=Math.floor(Ae.height*xe),E.isDataArrayTexture?Ft=Ae.depth:E.isData3DTexture?Ft=Math.floor(Ae.depth*xe):Ft=1,Wt=0,ne=0,me=0}J!==null?(Ht=J.x,ge=J.y,Ne=J.z):(Ht=0,ge=0,Ne=0);let we=yt.convert(V.format),$e=yt.convert(V.type),Gt;V.isData3DTexture?(ht.setTexture3D(V,0),Gt=P.TEXTURE_3D):V.isDataArrayTexture||V.isCompressedArrayTexture?(ht.setTexture2DArray(V,0),Gt=P.TEXTURE_2D_ARRAY):(ht.setTexture2D(V,0),Gt=P.TEXTURE_2D),k.activeTexture(P.TEXTURE0),k.pixelStorei(P.UNPACK_FLIP_Y_WEBGL,V.flipY),k.pixelStorei(P.UNPACK_PREMULTIPLY_ALPHA_WEBGL,V.premultiplyAlpha),k.pixelStorei(P.UNPACK_ALIGNMENT,V.unpackAlignment);let ln=k.getParameter(P.UNPACK_ROW_LENGTH),ve=k.getParameter(P.UNPACK_IMAGE_HEIGHT),Oi=k.getParameter(P.UNPACK_SKIP_PIXELS),Ke=k.getParameter(P.UNPACK_SKIP_ROWS),ia=k.getParameter(P.UNPACK_SKIP_IMAGES);k.pixelStorei(P.UNPACK_ROW_LENGTH,Ae.width),k.pixelStorei(P.UNPACK_IMAGE_HEIGHT,Ae.height),k.pixelStorei(P.UNPACK_SKIP_PIXELS,Wt),k.pixelStorei(P.UNPACK_SKIP_ROWS,ne),k.pixelStorei(P.UNPACK_SKIP_IMAGES,me);let ui=E.isDataArrayTexture||E.isData3DTexture,Bi=V.isDataArrayTexture||V.isData3DTexture;if(E.isDepthTexture){let xe=et.get(E),qe=et.get(V),In=et.get(xe.__renderTarget),Ie=et.get(qe.__renderTarget);k.bindFramebuffer(P.READ_FRAMEBUFFER,In.__webglFramebuffer),k.bindFramebuffer(P.DRAW_FRAMEBUFFER,Ie.__webglFramebuffer);for(let Ge=0;Ge<Ft;Ge++)ui&&(P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,et.get(E).__webglTexture,K,me+Ge),P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,et.get(V).__webglTexture,It,Ne+Ge)),P.blitFramebuffer(Wt,ne,Wt+kt,ne+Rt,Ht,ge,Ht+kt,ge+Rt,P.DEPTH_BUFFER_BIT,P.NEAREST);k.bindFramebuffer(P.READ_FRAMEBUFFER,null),k.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else if(K!==0||E.isRenderTargetTexture||et.has(E)){let xe=et.get(E),qe=et.get(V);k.bindFramebuffer(P.READ_FRAMEBUFFER,N),k.bindFramebuffer(P.DRAW_FRAMEBUFFER,q);for(let In=0;In<Ft;In++)ui?P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,xe.__webglTexture,K,me+In):P.framebufferTexture2D(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,xe.__webglTexture,K),Bi?P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,qe.__webglTexture,It,Ne+In):P.framebufferTexture2D(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,qe.__webglTexture,It),K!==0?P.blitFramebuffer(Wt,ne,Wt+kt,ne+Rt,Ht,ge,Ht+kt,ge+Rt,P.COLOR_BUFFER_BIT,P.NEAREST):Bi?P.copyTexSubImage3D(Gt,It,Ht,ge,Ne+In,Wt,ne,kt,Rt):P.copyTexSubImage2D(Gt,It,Ht,ge,Wt,ne,kt,Rt);k.bindFramebuffer(P.READ_FRAMEBUFFER,null),k.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else Bi?E.isDataTexture||E.isData3DTexture?P.texSubImage3D(Gt,It,Ht,ge,Ne,kt,Rt,Ft,we,$e,Ae.data):V.isCompressedArrayTexture?P.compressedTexSubImage3D(Gt,It,Ht,ge,Ne,kt,Rt,Ft,we,Ae.data):P.texSubImage3D(Gt,It,Ht,ge,Ne,kt,Rt,Ft,we,$e,Ae):E.isDataTexture?P.texSubImage2D(P.TEXTURE_2D,It,Ht,ge,kt,Rt,we,$e,Ae.data):E.isCompressedTexture?P.compressedTexSubImage2D(P.TEXTURE_2D,It,Ht,ge,Ae.width,Ae.height,we,Ae.data):P.texSubImage2D(P.TEXTURE_2D,It,Ht,ge,kt,Rt,we,$e,Ae);k.pixelStorei(P.UNPACK_ROW_LENGTH,ln),k.pixelStorei(P.UNPACK_IMAGE_HEIGHT,ve),k.pixelStorei(P.UNPACK_SKIP_PIXELS,Oi),k.pixelStorei(P.UNPACK_SKIP_ROWS,Ke),k.pixelStorei(P.UNPACK_SKIP_IMAGES,ia),It===0&&V.generateMipmaps===!0&&V.mipmapsAutoUpdate===!0&&P.generateMipmap(Gt),k.unbindTexture()},this.initRenderTarget=function(E){et.get(E).__webglFramebuffer===void 0&&ht.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?ht.setTextureCube(E,0):E.isData3DTexture?ht.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?ht.setTexture2DArray(E,0):ht.setTexture2D(E,0),k.unbindTexture()},this.resetState=function(){Y=0,W=0,$=null,k.reset(),Tt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Tn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=ue._getDrawingBufferColorSpace(t),e.unpackColorSpace=ue._getUnpackColorSpace()}};var Fs={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var Mn=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},Bx=new Xi(-1,1,1,-1,0,1),Hc=class extends De{constructor(){super(),this.setAttribute("position",new he([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new he([0,2,0,0,2,0],2))}},zx=new Hc,Pi=class{constructor(t){this._mesh=new pt(zx,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,Bx)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}};var il=class extends Mn{constructor(t,e="tDiffuse"){super(),this.textureID=e,this.uniforms=null,this.material=null,t instanceof Fe?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=li.clone(t.uniforms),this.material=new Fe({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this._fsQuad=new Pi(this.material)}render(t,e,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this._fsQuad.render(t))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var Kr=class extends Mn{constructor(t,e){super(),this.scene=t,this.camera=e,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,e,n){let s=t.getContext(),r=t.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),r.buffers.stencil.setFunc(s.ALWAYS,a,4294967295),r.buffers.stencil.setClear(o),r.buffers.stencil.setLocked(!0),t.setRenderTarget(n),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(e),this.clear&&t.clear(),t.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(s.EQUAL,1,4294967295),r.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),r.buffers.stencil.setLocked(!0)}},sl=class extends Mn{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}};var rl=class{constructor(t,e){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),e===void 0){let n=t.getSize(new ft);this._width=n.width,this._height=n.height,e=new Oe(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Ze}),e.texture.name="EffectComposer.rt1"}else this._width=e.width,this._height=e.height;this.renderTarget1=e,this.renderTarget2=e.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new il(Fs),this.copyPass.material.blending=si,this.timer=new Pr}swapBuffers(){let t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,e){this.passes.splice(e,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){let e=this.passes.indexOf(t);e!==-1&&this.passes.splice(e,1)}isLastEnabledPass(t){for(let e=t+1;e<this.passes.length;e++)if(this.passes[e].enabled)return!1;return!0}render(t){this.timer.update(),t===void 0&&(t=this.timer.getDelta());let e=this.renderer.getRenderTarget(),n=!1;for(let s=0,r=this.passes.length;s<r;s++){let a=this.passes[s];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),a.render(this.renderer,this.writeBuffer,this.readBuffer,t,n),a.needsSwap){if(n){let o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}Kr!==void 0&&(a instanceof Kr?n=!0:a instanceof sl&&(n=!1))}}this.renderer.setRenderTarget(e)}reset(t){if(t===void 0){let e=this.renderer.getSize(new ft);this._pixelRatio=this.renderer.getPixelRatio(),this._width=e.width,this._height=e.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,e){this._width=t,this._height=e;let n=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(n,s),this.renderTarget2.setSize(n,s);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,s)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var al=class extends Mn{constructor(t,e,n=null,s=null,r=null){super(),this.scene=t,this.camera=e,this.overrideMaterial=n,this.clearColor=s,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new Yt}render(t,e,n){let s=t.autoClear;t.autoClear=!1;let r,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor,t.getClearAlpha())),this.clearAlpha!==null&&(r=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),t.autoClear=s}};var ld={name:"LuminosityHighPassShader",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new Yt(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};var Os=class i extends Mn{constructor(t,e=1,n,s){super(),this.strength=e,this.radius=n,this.threshold=s,this.resolution=t!==void 0?new ft(t.x,t.y):new ft(256,256),this.clearColor=new Yt(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new Oe(r,a,{type:Ze,depthBuffer:!1}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let u=0;u<this.nMips;u++){let f=new Oe(r,a,{type:Ze,depthBuffer:!1});f.texture.name="UnrealBloomPass.h"+u,f.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(f);let p=new Oe(r,a,{type:Ze,depthBuffer:!1});p.texture.name="UnrealBloomPass.v"+u,p.texture.generateMipmaps=!1,this.renderTargetsVertical.push(p),r=Math.round(r/2),a=Math.round(a/2)}let o=ld;this.highPassUniforms=li.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Fe({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];let l=[6,10,14,18,22];r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let u=0;u<this.nMips;u++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[u])),this.separableBlurMaterials[u].uniforms.invSize.value=new ft(1/r,1/a),r=Math.round(r/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=e,this.compositeMaterial.uniforms.bloomRadius.value=.1;let h=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=h,this.bloomTintColors=[new H(1,1,1),new H(1,1,1),new H(1,1,1),new H(1,1,1),new H(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=li.clone(Fs.uniforms),this.blendMaterial=new Fe({uniforms:this.copyUniforms,vertexShader:Fs.vertexShader,fragmentShader:Fs.fragmentShader,premultipliedAlpha:!0,blending:Yi,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new Yt,this._oldClearAlpha=1,this._basic=new vi,this._fsQuad=new Pi(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(t,e){let n=Math.round(t/2),s=Math.round(e/2);this.renderTargetBright.setSize(n,s);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(n,s),this.renderTargetsVertical[r].setSize(n,s),this.separableBlurMaterials[r].uniforms.invSize.value=new ft(1/n,1/s),n=Math.round(n/2),s=Math.round(s/2)}render(t,e,n,s,r){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let a=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),r&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=n.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this._fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=i.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[l]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=i.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[l]),t.clear(),this._fsQuad.render(t),o=this.renderTargetsVertical[l];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(n),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=a}_getSeparableBlurMaterial(t){let e=[],n=t/3;for(let a=0;a<t;a++)e.push(.39894*Math.exp(-.5*a*a/(n*n))/n);let s=[],r=[];for(let a=1;a<t;a+=2){let o=e[a],l=a+1<t?e[a+1]:0,h=o+l;s.push((a*o+(a+1)*l)/h),r.push(h)}return new Fe({defines:{KERNEL_PAIRS:s.length},uniforms:{colorTexture:{value:null},invSize:{value:new ft(.5,.5)},direction:{value:new ft(.5,.5)},centerWeight:{value:e[0]},gaussianOffsets:{value:s},gaussianWeights:{value:r}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float centerWeight;
				uniform float gaussianOffsets[KERNEL_PAIRS];
				uniform float gaussianWeights[KERNEL_PAIRS];

				void main() {

					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;

					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {

						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(t){return new Fe({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}};Os.BlurDirectionX=new ft(1,0);Os.BlurDirectionY=new ft(0,1);var Qr={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var ol=class extends Mn{constructor(){super(),this.isOutputPass=!0,this.uniforms=li.clone(Qr.uniforms),this.material=new Es({name:Qr.name,uniforms:this.uniforms,vertexShader:Qr.vertexShader,fragmentShader:Qr.fragmentShader}),this._fsQuad=new Pi(this.material),this._outputColorSpace=null,this._toneMapping=null}render(t,e,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,(this._outputColorSpace!==t.outputColorSpace||this._toneMapping!==t.toneMapping)&&(this._outputColorSpace=t.outputColorSpace,this._toneMapping=t.toneMapping,this.material.defines={},ue.getTransfer(this._outputColorSpace)===_e&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===Dr?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===Nr?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===Ur?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===Ji?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===Or?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===Br?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===Fr&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this._fsQuad.render(t))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var kx=`
  attribute vec3 aPos;
  attribute vec4 aColor;
  attribute vec4 aParams;   // x=\u0448\u0438\u0440\u0438\u043D\u0430, y=\u0432\u044B\u0441\u043E\u0442\u0430, z=\u043F\u043E\u0432\u043E\u0440\u043E\u0442, w=\u043A\u043B\u0435\u0442\u043A\u0430 \u0430\u0442\u043B\u0430\u0441\u0430
  attribute vec3 aDir;      // \u0435\u0441\u043B\u0438 \u043D\u0435\u043D\u0443\u043B\u0435\u0432\u043E\u0439 \u2014 \u0441\u043F\u0440\u0430\u0439\u0442 \u0432\u044B\u0442\u044F\u0433\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0432\u0434\u043E\u043B\u044C \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F
  varying vec2 vUv;
  varying vec4 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(aPos, 1.0);
    float rot = aParams.z;
    if (dot(aDir, aDir) > 0.0) {
      vec3 vd = (modelViewMatrix * vec4(aDir, 0.0)).xyz;
      rot = atan(vd.y, vd.x);
    }
    float c = cos(rot), s = sin(rot);
    vec2 corner = position.xy * aParams.xy;
    mv.xy += vec2(c * corner.x - s * corner.y, s * corner.x + c * corner.y);
    gl_Position = projectionMatrix * mv;
    float cell = aParams.w;
    vec2 cellOff = vec2(mod(cell, 4.0), 3.0 - floor(cell / 4.0)) * 0.25;
    vUv = cellOff + (position.xy + 0.5) * 0.25;
    vColor = aColor;
  }
`,Hx=`
  attribute vec3 aPos;
  attribute vec4 aColor;
  attribute vec4 aParams;
  varying vec2 vUv;
  varying vec4 vColor;
  void main() {
    float c = cos(aParams.z), s = sin(aParams.z);
    vec2 corner = position.xy * aParams.xy;
    vec3 p = aPos + vec3(c * corner.x - s * corner.y, 0.0, s * corner.x + c * corner.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    float cell = aParams.w;
    vec2 cellOff = vec2(mod(cell, 4.0), 3.0 - floor(cell / 4.0)) * 0.25;
    vUv = cellOff + (position.xy + 0.5) * 0.25;
    vColor = aColor;
  }
`,Gx=`
  uniform sampler2D map;
  varying vec2 vUv;
  varying vec4 vColor;
  void main() {
    vec4 t = texture2D(map, vUv);
    vec4 col = vec4(vColor.rgb * t.rgb, vColor.a * t.a);
    if (col.a < 0.003) discard;
    gl_FragColor = col;
  }
`,ji=class{constructor(t,e,{additive:n=!0,ground:s=!1,depthTest:r=!0,renderOrder:a=10}={}){this.max=t,this.n=0;let o=new Ir,l=new En(1,1);o.index=l.index,o.setAttribute("position",l.attributes.position),this.pos=new Float32Array(t*3),this.col=new Float32Array(t*4),this.par=new Float32Array(t*4),this.dir=new Float32Array(t*3);let h=(f,p)=>{let d=new Mi(f,p);return d.setUsage(xc),d};this.aPos=h(this.pos,3),this.aCol=h(this.col,4),this.aPar=h(this.par,4),this.aDir=h(this.dir,3),o.setAttribute("aPos",this.aPos),o.setAttribute("aColor",this.aCol),o.setAttribute("aParams",this.aPar),s||o.setAttribute("aDir",this.aDir),o.instanceCount=0,this.geo=o;let u=new Fe({uniforms:{map:{value:e}},vertexShader:s?Hx:kx,fragmentShader:Gx,transparent:!0,depthWrite:!1,depthTest:r,blending:n?Yi:Ci});this.mesh=new pt(o,u),this.mesh.frustumCulled=!1,this.mesh.renderOrder=a}begin(){this.n=0}add(t,e,n,s,r,a,o,l,h,u,f,p=0,d=0,m=0){if(this.n>=this.max)return;let x=this.n++,c=x*3,g=x*4;this.pos[c]=t,this.pos[c+1]=e,this.pos[c+2]=n,this.col[g]=a,this.col[g+1]=o,this.col[g+2]=l,this.col[g+3]=h,this.par[g]=s,this.par[g+1]=r,this.par[g+2]=u,this.par[g+3]=f,this.dir[c]=p,this.dir[c+1]=d,this.dir[c+2]=m}end(){this.geo.instanceCount=this.n;let t=this.n;for(let[e,n]of[[this.aPos,3],[this.aCol,4],[this.aPar,4],[this.aDir,3]])e.clearUpdateRanges(),e.addUpdateRange(0,t*n),e.needsUpdate=!0}},cd=new Map;function Rn(i){let t=cd.get(i);if(!t){let e=new Yt(i);t=[e.r,e.g,e.b],cd.set(i,t)}return t}var on=Math.PI*2;function cl(i,t=i){let e=document.createElement("canvas");return e.width=i,e.height=t,e}function ci(i){let t=i>>>0||1;return()=>(t^=t<<13,t^=t>>>17,t^=t<<5,(t>>>0)%1e5/1e5)}var _t={GLOW:0,STAR:1,STREAK:2,RING:3,SMOKE:4,FLAME:5,RUNE:6,SHADOW:7,DOT:8,SHOCK:9,CRESCENT:10,SIGIL:11,SHARD:12,BOLT:13,PETAL:14,CRACK:15};function hd(){let t=cl(512),e=t.getContext("2d"),n=(o,l)=>{e.save(),e.translate(o%4*128+128/2,Math.floor(o/4)*128+128/2),l(),e.restore()},s=(o,l)=>{let h=e.createRadialGradient(0,0,0,0,0,o);return l.forEach(([u,f])=>h.addColorStop(u,f)),h};n(_t.GLOW,()=>{e.fillStyle=s(62,[[0,"rgba(255,255,255,1)"],[.18,"rgba(255,255,255,0.75)"],[.45,"rgba(255,255,255,0.22)"],[1,"rgba(255,255,255,0)"]]),e.fillRect(-64,-64,128,128)}),n(_t.STAR,()=>{e.fillStyle=s(30,[[0,"#fff"],[.4,"rgba(255,255,255,0.5)"],[1,"rgba(255,255,255,0)"]]),e.fillRect(-64,-64,128,128),e.fillStyle="#fff";for(let o=0;o<2;o++){e.save(),e.rotate(o*Math.PI/4);let l=o?34:60,h=o?4:7;e.beginPath(),e.moveTo(0,-l),e.quadraticCurveTo(h*.3,-h*.3,l,0),e.quadraticCurveTo(h*.3,h*.3,0,l),e.quadraticCurveTo(-h*.3,h*.3,-l,0),e.quadraticCurveTo(-h*.3,-h*.3,0,-l),e.fill(),e.restore()}}),n(_t.STREAK,()=>{let o=e.createLinearGradient(-64,0,64,0);o.addColorStop(0,"rgba(255,255,255,0)"),o.addColorStop(.75,"rgba(255,255,255,0.7)"),o.addColorStop(.92,"#fff"),o.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=o,e.beginPath(),e.ellipse(0,0,63,14,0,0,on),e.fill(),e.fillStyle="rgba(255,255,255,0.9)",e.beginPath(),e.ellipse(20,0,40,4,0,0,on),e.fill()}),n(_t.RING,()=>{e.strokeStyle="#fff",e.lineWidth=5,e.shadowColor="#fff",e.shadowBlur=10,e.beginPath(),e.arc(0,0,56,0,on),e.stroke()}),n(_t.SMOKE,()=>{let o=ci(77);for(let l=0;l<26;l++){let h=o()*on,u=o()*26,f=14+o()*24;e.fillStyle=s(f,[[0,"rgba(255,255,255,0.22)"],[1,"rgba(255,255,255,0)"]]),e.save(),e.translate(Math.cos(h)*u,Math.sin(h)*u),e.fillRect(-f,-f,f*2,f*2),e.restore()}}),n(_t.FLAME,()=>{let o=e.createRadialGradient(0,18,2,0,6,54);o.addColorStop(0,"rgba(255,255,255,1)"),o.addColorStop(.3,"rgba(255,255,255,0.8)"),o.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=o,e.beginPath(),e.moveTo(0,-60),e.bezierCurveTo(26,-20,40,20,0,52),e.bezierCurveTo(-40,20,-26,-20,0,-60),e.fill()});let r=(o,l)=>{let h=ci(o);e.strokeStyle="#fff",e.fillStyle="#fff",e.shadowColor="#fff",e.shadowBlur=4,e.lineWidth=3,e.beginPath(),e.arc(0,0,60,0,on),e.stroke(),e.lineWidth=1.5,e.beginPath(),e.arc(0,0,50,0,on),e.stroke(),e.font="bold 11px serif",e.textAlign="center",e.textBaseline="middle";let u="\u16A0\u16A2\u16A6\u16A8\u16B1\u16B2\u16B7\u16B9\u16BA\u16BE\u16C1\u16C3\u16C7\u16C8\u16C9\u16CA\u16CF\u16D2\u16D6\u16D7\u16DA\u16DC\u16DE\u16DF";for(let f=0;f<20;f++){let p=f/20*on;e.save(),e.rotate(p+Math.PI/2),e.translate(0,-55),e.rotate(0),e.fillText(u[h()*u.length|0],0,0),e.restore()}e.lineWidth=2;for(let f=0;f<l;f++){let p=3+f*2,d=40-f*6;e.beginPath();for(let m=0;m<=p;m++){let x=m*on/p*(f%2?2:1)-Math.PI/2,c=Math.cos(x)*d,g=Math.sin(x)*d;m?e.lineTo(c,g):e.moveTo(c,g)}e.stroke()}e.beginPath(),e.arc(0,0,14,0,on),e.stroke()};n(_t.RUNE,()=>r(11,2)),n(_t.SIGIL,()=>r(29,3)),n(_t.SHADOW,()=>{e.fillStyle=s(60,[[0,"rgba(0,0,0,0.85)"],[.55,"rgba(0,0,0,0.5)"],[1,"rgba(0,0,0,0)"]]),e.fillRect(-64,-64,128,128)}),n(_t.DOT,()=>{e.fillStyle=s(20,[[0,"#fff"],[.6,"rgba(255,255,255,0.9)"],[1,"rgba(255,255,255,0)"]]),e.fillRect(-24,-24,48,48)}),n(_t.SHOCK,()=>{let o=e.createRadialGradient(0,0,30,0,0,62);o.addColorStop(0,"rgba(255,255,255,0)"),o.addColorStop(.7,"rgba(255,255,255,0.35)"),o.addColorStop(.9,"rgba(255,255,255,1)"),o.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=o,e.fillRect(-64,-64,128,128)}),n(_t.CRESCENT,()=>{e.fillStyle="#fff",e.shadowColor="#fff",e.shadowBlur=8,e.beginPath(),e.arc(0,0,54,-2.4,.9),e.arc(16,-10,44,.9,-2.4,!0),e.fill()}),n(_t.SHARD,()=>{let o=e.createLinearGradient(-60,0,60,0);o.addColorStop(0,"rgba(255,255,255,0.1)"),o.addColorStop(1,"#fff"),e.fillStyle=o,e.beginPath(),e.moveTo(60,0),e.lineTo(-10,12),e.lineTo(-58,0),e.lineTo(-10,-12),e.closePath(),e.fill()}),n(_t.BOLT,()=>{e.strokeStyle="#fff",e.lineWidth=6,e.shadowColor="#fff",e.shadowBlur=12,e.lineCap="round";let o=ci(5);e.beginPath(),e.moveTo(-62,0);for(let l=-50;l<=62;l+=12)e.lineTo(l,(o()-.5)*30);e.stroke()}),n(_t.PETAL,()=>{e.fillStyle=s(30,[[0,"#fff"],[1,"rgba(255,255,255,0)"]]),e.beginPath(),e.ellipse(0,0,40,16,.5,0,on),e.fill()}),n(_t.CRACK,()=>{e.strokeStyle="#fff",e.lineCap="round";let o=ci(9);for(let l=0;l<7;l++){let h=l/7*on+o()*.5,u=0,f=0;e.lineWidth=4,e.beginPath(),e.moveTo(0,0);for(let p=0;p<5;p++)h+=(o()-.5)*.8,u+=Math.cos(h)*12,f+=Math.sin(h)*12,e.lineTo(u,f),e.lineWidth=4-p*.6;e.stroke()}});let a=new Ss(t);return a.colorSpace=en,a.generateMipmaps=!0,a}function Li(i,t,e,n,s,r){for(let a of[-t,0,t])for(let o of[-t,0,t])e+a<-s||e+a>t+s||n+o<-s||n+o>t+s||(i.save(),i.translate(e+a,n+o),r(),i.restore())}function Gc(i,t,e,n,s,r,a,o){i.fillStyle=n,i.fillRect(0,0,t,t);for(let l=0;l<s;l++){let h=e()*t,u=e()*t,f=a+e()*(o-a),p=e()<.5;Li(i,t,h,u,f,()=>{let d=i.createRadialGradient(0,0,0,0,0,f);d.addColorStop(0,p?`rgba(255,255,255,${r})`:`rgba(0,0,0,${r*1.3})`),d.addColorStop(1,"rgba(0,0,0,0)"),i.fillStyle=d,i.fillRect(-f,-f,f*2,f*2)})}}function Bs(i,t,e,n){i.beginPath();let s=7;for(let r=0;r<s;r++){let a=r/s*on,o=e/2*(.85+t()*.15),l=n/2*(.85+t()*.15),h=Math.cos(a)*o,u=Math.sin(a)*l;r?i.lineTo(h,u):i.moveTo(h,u)}i.closePath()}function ll(i,t,e,n,s,r){i.strokeStyle=s,i.lineCap="round";for(let a=0;a<n;a++){let o=e()*t,l=e()*t,h=e()*on,u=[[o,l]];for(let f=0;f<8;f++)h+=(e()-.5)*1.2,o+=Math.cos(h)*(8+e()*14),l+=Math.sin(h)*(8+e()*14),u.push([o,l]);for(let f of[-t,0,t])for(let p of[-t,0,t])i.lineWidth=r,i.beginPath(),u.forEach(([d,m],x)=>x?i.lineTo(d+f,m+p):i.moveTo(d+f,m+p)),i.stroke()}}function ud(i){let e=cl(1024),n=e.getContext("2d"),s=cl(1024),r=s.getContext("2d"),a=cl(512),o=a.getContext("2d");o.fillStyle="#000",o.fillRect(0,0,512,512);let l=ci(i.length*977+13),h=!1;if(i==="ruins"||i==="crypt"){let f=i==="crypt";Gc(n,1024,l,f?"#16181f":"#1c1a1d",200,.06,20,80),r.fillStyle="#000",r.fillRect(0,0,1024,1024);let p=f?8:6,d=1024/p;for(let m=0;m<p;m++){let x=m%2*d*.5;for(let c=0;c<p;c++){let g=c*d+x+d/2,_=m*d+d/2,M=d*(f?.94:.9),v=d*(f?.94:.88),R=f?30+l()*18:40+l()*26,w=f?[R*.85,R*.9,R*1.1]:[R*1.05,R,R*.92];Li(n,1024,g,_,d,()=>{f?(n.beginPath(),n.rect(-M/2,-v/2,M,v)):Bs(n,l,M,v);let y=n.createLinearGradient(-M/2,-v/2,M/2,v/2);y.addColorStop(0,`rgb(${w.map(S=>S*1.15|0)})`),y.addColorStop(1,`rgb(${w.map(S=>S*.8|0)})`),n.fillStyle=y,n.fill(),n.strokeStyle="rgba(0,0,0,0.55)",n.lineWidth=3,n.stroke()}),Li(r,1024,g,_,d,()=>{f?(r.beginPath(),r.rect(-M/2,-v/2,M,v)):Bs(r,l,M,v),r.fillStyle=`rgb(${150+l()*60|0},150,150)`,r.fill()})}}r.filter="blur(3px)",r.drawImage(s,0,0),r.filter="none";for(let m=0;m<40;m++){let x=l()*1024,c=l()*1024,g=10+l()*40,_=l();Li(n,1024,x,c,g,()=>{let M=n.createRadialGradient(0,0,0,0,0,g),v=_<.45?f?"40,60,70":"50,70,40":_<.75?"0,0,0":"90,10,14";M.addColorStop(0,`rgba(${v},${_<.75?.35:.5})`),M.addColorStop(1,`rgba(${v},0)`),n.fillStyle=M,n.fillRect(-g,-g,g*2,g*2)})}if(ll(n,1024,l,30,"rgba(0,0,0,0.6)",2),ll(r,1024,l,30,"rgba(0,0,0,0.9)",3),f){n.strokeStyle="rgba(200,190,170,0.35)",n.lineWidth=4,n.lineCap="round";for(let m=0;m<30;m++){let x=l()*1024,c=l()*1024,g=l()*on,_=10+l()*16;n.beginPath(),n.moveTo(x,c),n.lineTo(x+Math.cos(g)*_,c+Math.sin(g)*_),n.stroke()}}}else if(i==="forest"){Gc(n,1024,l,"#1d3a36",500,.07,10,70),r.fillStyle="#808080",r.fillRect(0,0,1024,1024);for(let f=0;f<9e3;f++){let p=l()*1024,d=l()*1024,m=4+l()*9,x=-Math.PI/2+(l()-.5)*.9,c=l();n.strokeStyle=c<.5?`rgba(70,${120+l()*50|0},${110+l()*30|0},0.6)`:`rgba(20,${50+l()*30|0},48,0.6)`,n.lineWidth=1.4,n.beginPath(),n.moveTo(p,d),n.lineTo(p+Math.cos(x)*m,d+Math.sin(x)*m),n.stroke()}for(let f=0;f<26;f++){let p=l()*1024,d=l()*1024,m=20+l()*50,x=m*(.6+l()*.3),c=90+l()*50|0;Li(n,1024,p,d,m,()=>{Bs(n,l,m,x),n.fillStyle=`rgb(${c-10},${c},${c+5})`,n.fill(),n.strokeStyle="rgba(0,0,0,0.5)",n.lineWidth=2,n.stroke()}),Li(r,1024,p,d,m,()=>{Bs(r,l,m,x),r.fillStyle="#e0e0e0",r.fill()})}h=!0;for(let f=0;f<60;f++){let p=l()*512,d=l()*512;o.fillStyle=`rgba(${150+l()*80|0},${200+l()*55|0},255,0.9)`,o.beginPath(),o.arc(p,d,1+l()*1.5,0,on),o.fill(),n.fillStyle="rgba(220,240,255,0.8)",n.beginPath(),n.arc(p*2,d*2,2.5,0,on),n.fill()}}else{Gc(n,1024,l,"#140c1c",400,.08,20,90),r.fillStyle="#808080",r.fillRect(0,0,1024,1024);for(let d=0;d<40;d++){let m=l()*1024,x=l()*1024,c=40+l()*120,g=c*(.5+l()*.4),_=26+l()*20|0;Li(n,1024,m,x,c,()=>{Bs(n,l,c,g),n.fillStyle=`rgb(${_+8},${_},${_+16})`,n.fill(),n.strokeStyle="rgba(0,0,0,0.6)",n.lineWidth=3,n.stroke()}),Li(r,1024,m,x,c,()=>{Bs(r,l,c,g),r.fillStyle="#d0d0d0",r.fill()})}h=!0;let f=ci(31);ll(n,1024,f,10,"rgba(150,70,220,0.7)",2);let p=ci(31);o.save(),o.scale(.5,.5),ll(o,1024,p,10,"rgba(170,90,240,0.8)",3),o.restore(),o.filter="blur(2px)",o.drawImage(a,0,0),o.filter="none"}let u=(f,p)=>{let d=new Ss(f);return d.wrapS=d.wrapT=gs,d.anisotropy=4,p&&(d.colorSpace=en),d};return{map:u(e,!0),bump:u(s,!1),emissive:h?u(a,!0):null}}function hl(i,t=!1){let e=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),s=new Set(Object.keys(i[0].morphAttributes)),r={},a={},o=i[0].morphTargetsRelative,l=new De;l.morphTargetsRelative=o;let h=0;for(let u=0;u<i.length;++u){let f=i[u],p=0,d=0;if(e!==(f.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let m in f.attributes){if(!n.has(m))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+m+'" attribute exists among all geometries, or in none of them.'),null;r[m]===void 0&&(r[m]=[]),r[m].push(f.attributes[m]),p++}if(p!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(o!==f.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let m in f.morphAttributes){if(!s.has(m))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;if(f.morphAttributes[m].length!==i[0].morphAttributes[m].length)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have the same number of morph targets for the "'+m+'" morph attribute.'),null;a[m]===void 0&&(a[m]=[]),a[m].push(f.morphAttributes[m]),d++}if(d!==s.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of morph attributes."),null;if(t){let m;if(e)m=f.index.count;else if(f.attributes.position!==void 0)m=f.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;l.addGroup(h,m,u),h+=m}}if(e){let u=0,f=[];for(let p=0;p<i.length;++p){let d=i[p].index;for(let m=0;m<d.count;++m)f.push(d.getX(m)+u);u+=i[p].attributes.position.count}l.setIndex(f)}for(let u in r){let f=dd(r[u]);if(!f)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;l.setAttribute(u,f)}for(let u in a){let f=a[u][0].length;if(f!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[u]=[];for(let p=0;p<f;++p){let d=[];for(let x=0;x<a[u].length;++x)d.push(a[u][x][p]);let m=dd(d);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;l.morphAttributes[u].push(m)}}}return l}function dd(i){let t,e,n,s=-1,r=0;for(let h=0;h<i.length;++h){let u=i[h];if(t===void 0&&(t=u.array.constructor),t!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=u.itemSize),e!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=u.normalized),n!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=u.gpuType),s!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=u.count*e}let a=new t(r),o=new xn(a,e,n),l=0;for(let h=0;h<i.length;++h){let u=i[h];if(u.isInterleavedBufferAttribute){let f=l/e;for(let p=0,d=u.count;p<d;p++)for(let m=0;m<e;m++){let x=u.getComponent(p,m);o.setComponent(p+f,m,x)}}else a.set(u.array,l);l+=u.count*e}return s!==void 0&&(o.gpuType=s),o}var Di=Math.PI*2,fd=new Map;function gt(i,t={}){let e=i+JSON.stringify(t),n=fd.get(e);return n||(n=new Wi({color:i,roughness:t.rough??.75,metalness:Math.min(t.metal??.05,.4),emissive:t.emi?new Yt(t.emi):new Yt(0),emissiveIntensity:t.ei??1,flatShading:!!t.flat,transparent:!!t.opacity,opacity:t.opacity??1,side:t.double?wn:Wn,depthWrite:!t.opacity}),n.userData.key=e,fd.set(e,n),n)}var ye=(i,t=4)=>gt(i,{emi:i,ei:t,rough:.4}),Vc=(i,t,e,n)=>(i.position.set(t,e,n),i);function fe(i,t,e,n=7){let s=new ii(i,t,e,n,2);return s.translate(0,-e/2,0),s}var Zt=(i,t=12,e=9)=>new Un(i,t,e),se=(i,t,e)=>new Ti(i,t,e),Ee=(i,t,e=8)=>new dr(i,t,e),Me=(i,t,e,n=10)=>new ii(i,t,e,n),gd=(i,t,e=10)=>new ur(i,t,4,e);function Wc(i,t=16){return new Tr(i.map(([e,n])=>new ft(e,n)),t)}function be(i,t=0,e=1,n=.25){let s=new br(i,t),r=s.attributes.position,a=e,o=()=>(a=a*16807%2147483647,a/2147483647),l=new Map;for(let h=0;h<r.count;h++){let u=r.getX(h).toFixed(3)+r.getY(h).toFixed(3)+r.getZ(h).toFixed(3),f=l.get(u);f===void 0&&(f=1+(o()-.5)*n*2,l.set(u,f)),r.setXYZ(h,r.getX(h)*f,r.getY(h)*f,r.getZ(h)*f)}return s.computeVertexNormals(),s}function jr(i,t=18,e=.12,n=3){let s=Wc(i,t),r=s.attributes.position,a=Math.min(...i.map(o=>o[1]));for(let o=0;o<r.count;o++)if(Math.abs(r.getY(o)-a)<1e-4){let l=Math.atan2(r.getZ(o),r.getX(o));r.setY(o,a+(Math.sin(l*7+n)*.5+.5)*e)}return s.computeVertexNormals(),s}function Vx(i,t,e){let n=new Ei;n.absarc(0,0,i,-2.2,.9,!1),n.absarc(i*.3,-i*.18,i*.82,.9,-2.2,!0);let s=new Sr(n,{depth:e,bevelEnabled:!0,bevelThickness:e*.4,bevelSize:t*.2,bevelSegments:1,curveSegments:14});return s.translate(0,0,-e/2),s}function pd(i,t,e=1){let n=new Ei;n.moveTo(0,0),n.quadraticCurveTo(i*.4,t*.9,i,t*.55);let s=4;for(let a=0;a<s;a++){let o=i*(1-a/s),l=i*(1-(a+1)/s);n.quadraticCurveTo((o+l)/2,-t*(.05+.08*((a+e)%2)),l,a===s-1?0:t*(.15+.1*a)*.6)}return new Er(n,12)}var fn=class{constructor(){this.groups=new Map}add(t,e,{ch:n="body",k:s=0,pv:r=[0,0,0],at:a=[0,0,0],rot:o=[0,0,0],scl:l=[1,1,1]}={}){let h=t.clone(),u=new pe().compose(new H(...a),new Ye().setFromEuler(new sn(...o)),new H(...l));h.applyMatrix4(u);for(let m of Object.keys(h.attributes))["position","normal"].includes(m)||h.deleteAttribute(m);let f=h.index?h.toNonIndexed():h,p=n+"|"+s+"|"+r.join(",")+"|"+e.userData.key,d=this.groups.get(p);return d||(d={ch:n,k:s,pv:r,mat:e,geos:[]},this.groups.set(p,d)),d.geos.push(f),this}build(){let t=[];for(let e of this.groups.values()){let n=hl(e.geos,!1);n.computeBoundingSphere(),t.push({ch:e.ch,k:e.k,pv:e.pv,mat:e.mat,geo:n})}return t}},Wx={rx:0,ry:0,rz:0,dy:0,s:1};function xd(i,t,e){let n=Wx;n.rx=n.ry=n.rz=n.dy=0,n.s=1;let s=Math.sin(e.ph),r=e.mv;switch(i){case"body":n.dy=Math.abs(s)*.05*r,n.rz=Math.sin(e.ph)*.04*r,n.rx=e.atk*.25;break;case"sway":n.rz=Math.sin(e.t*2+e.seed)*.08,n.rx=.12*r+e.atk*.3;break;case"head":n.ry=Math.sin(e.t*1.3+e.seed)*.25,n.rx=-e.atk*.3;break;case"legL":n.rx=s*.65*r;break;case"legR":n.rx=-s*.65*r;break;case"armL":n.rx=-s*.5*r;break;case"armR":n.rx=s*.5*r-e.atk*2;break;case"reachL":n.rx=-1+Math.sin(e.t*3+e.seed)*.15;break;case"reachR":n.rx=-1+Math.sin(e.t*3+e.seed+1)*.15-e.atk;break;case"fl":n.rx=(t?s:-s)*.7*r;break;case"bl":n.rx=(t?-s:s)*.7*r;break;case"tail":n.ry=Math.sin(e.ph*.5+e.t*2)*.5;break;case"cape":n.rx=.15+.25*r+Math.sin(e.t*3+e.seed)*.06;break;case"tent":n.rx=Math.sin(e.t*3+t*1.3+e.seed)*.4,n.rz=Math.cos(e.t*2.6+t*2.1)*.3;break;case"spin":n.ry=e.t*2.5+t;break;case"pulse":n.s=1+Math.sin(e.t*5+e.seed)*.07+e.atk*.15;break;case"jaw":n.rx=.1+(Math.sin(e.t*4)*.5+.5)*.15+e.atk*.9;break;case"wingL":n.rz=Math.sin(e.t*7+e.seed)*.5;break;case"wingR":n.rz=-Math.sin(e.t*7+e.seed)*.5;break}return n}var Sn={};Sn.ghost=()=>{let i=new fn,t=gt("#a8b6ff",{emi:"#2a3890",ei:.55,opacity:.7,double:!0,rough:.3});i.add(jr([[0,1.5],[.24,1.46],[.38,1.3],[.42,1],[.46,.7],[.55,.38],[.62,.15]],16,.18),t,{ch:"sway"}),i.add(Zt(.2),gt("#05060c"),{ch:"sway",at:[0,1.22,.2],scl:[1,1.1,.8]});let e=ye("#9fe8ff",6);return i.add(Zt(.05,6,5),e,{ch:"sway",at:[-.08,1.24,.36]}).add(Zt(.05,6,5),e,{ch:"sway",at:[.08,1.24,.36]}),i.add(fe(.1,.02,.6),t,{ch:"reachL",pv:[-.36,1.08,.05]}),i.add(fe(.1,.02,.6),t,{ch:"reachR",pv:[.36,1.08,.05]}),{parts:i.build(),float:!0,h:1.6}};Sn.ghoul=()=>{let i=new fn,t=gt("#76805e",{flat:!0,rough:.9}),e=gt("#2c2f22",{flat:!0});i.add(gd(.3,.32),t,{ch:"body",at:[0,.78,0],rot:[.55,0,0]});for(let s=0;s<3;s++)i.add(Zt(.07,6,5),e,{ch:"body",at:[0,.98-s*.14,-.2-s*.03]});i.add(Zt(.2,10,8),t,{ch:"head",pv:[0,1,.22],at:[0,.04,.08],scl:[1,.85,1.25]}),i.add(se(.22,.05,.12),e,{ch:"head",pv:[0,1,.22],at:[0,-.06,.25]});let n=ye("#ff3020",6);i.add(Zt(.045,6,5),n,{ch:"head",pv:[0,1,.22],at:[-.08,.08,.3]}).add(Zt(.045,6,5),n,{ch:"head",pv:[0,1,.22],at:[.08,.08,.3]});for(let[s,r]of[["armL",-.32],["armR",.32]]){i.add(fe(.08,.055,.72),t,{ch:s,pv:[r,.98,.12]});for(let a=-1;a<=1;a++)i.add(Ee(.025,.14,4),e,{ch:s,pv:[r,.98,.12],at:[a*.04,-.78,.03],rot:[Math.PI,0,0]})}return i.add(fe(.1,.07,.56),t,{ch:"legL",pv:[-.15,.56,0]}),i.add(fe(.1,.07,.56),t,{ch:"legR",pv:[.15,.56,0]}),{parts:i.build(),h:1.35}};Sn.cknight=()=>{let i=new fn,t=gt("#6a6a7c",{metal:.4,rough:.45,flat:!0}),e=gt("#2e2c38",{metal:.3,rough:.5}),n=gt("#3a1322",{rough:.9}),s=ye("#ff2a2a",7);return i.add(fe(.12,.1,.78),t,{ch:"legL",pv:[-.16,.8,0]}),i.add(fe(.12,.1,.78),t,{ch:"legR",pv:[.16,.8,0]}),i.add(Me(.34,.26,.68,8),t,{ch:"body",at:[0,1.15,0]}),i.add(se(.42,.7,.05),n,{ch:"body",at:[0,.82,.25]}),i.add(Zt(.18,8,6),t,{ch:"body",at:[-.38,1.44,0],scl:[1,.7,1]}).add(Zt(.18,8,6),t,{ch:"body",at:[.38,1.44,0],scl:[1,.7,1]}),i.add(Me(.17,.19,.32,8),e,{ch:"head",pv:[0,1.5,0],at:[0,.18,0]}),i.add(Ee(.06,.25,6),t,{ch:"head",pv:[0,1.5,0],at:[0,.46,0]}),i.add(se(.24,.035,.03),s,{ch:"head",pv:[0,1.5,0],at:[0,.2,.18]}),i.add(se(.75,1.1,.03),n,{ch:"cape",pv:[0,1.48,-.2],at:[0,-.55,0]}),i.add(fe(.08,.07,.6),t,{ch:"armL",pv:[-.4,1.38,0]}),i.add(Me(.3,.3,.06,10),e,{ch:"armL",pv:[-.4,1.38,0],at:[-.06,-.5,.18],rot:[Math.PI/2,0,0]}),i.add(Me(.16,.16,.08,6),t,{ch:"armL",pv:[-.4,1.38,0],at:[-.06,-.5,.22],rot:[Math.PI/2,0,0]}),i.add(fe(.08,.07,.6),t,{ch:"armR",pv:[.4,1.38,0]}),i.add(se(.07,1,.025),gt("#9a98b0",{metal:.9,rough:.25,emi:"#3a2a60",ei:.6}),{ch:"armR",pv:[.4,1.38,0],at:[0,-.55,.55],rot:[Math.PI/2,0,0]}),i.add(se(.26,.05,.06),e,{ch:"armR",pv:[.4,1.38,0],at:[0,-.6,.06]}),{parts:i.build(),h:2}};Sn.wolf=()=>{let i=new fn,t=gt("#4a3a30",{flat:!0,rough:.95}),e=gt("#211812",{flat:!0}),n=gt("#7a3cc0",{emi:"#6a2cd0",ei:1.6,flat:!0});i.add(gd(.25,.7),t,{ch:"body",at:[0,.62,0],rot:[Math.PI/2,0,0]});for(let a=0;a<5;a++)i.add(Ee(.06,.28-a*.03,5),n,{ch:"body",at:[0,.88,.3-a*.16],rot:[-.4,0,0]});let s={ch:"head",pv:[0,.75,.48]};i.add(Zt(.21,9,7),t,{...s,at:[0,.03,.08],scl:[.9,.85,1.1]}),i.add(Ee(.12,.32,6),t,{...s,at:[0,-.04,.34],rot:[Math.PI/2,0,0]}),i.add(Ee(.06,.18,4),t,{...s,at:[-.11,.24,.02],rot:[-.2,0,-.3]}).add(Ee(.06,.18,4),t,{...s,at:[.11,.24,.02],rot:[-.2,0,.3]});let r=ye("#ffd23a",6);i.add(Zt(.035,6,5),r,{...s,at:[-.09,.07,.24]}).add(Zt(.035,6,5),r,{...s,at:[.09,.07,.24]}),i.add(Ee(.015,.08,3),gt("#e8e0c8"),{...s,at:[.05,-.12,.38],rot:[Math.PI,0,0]}).add(Ee(.015,.08,3),gt("#e8e0c8"),{...s,at:[-.05,-.12,.38],rot:[Math.PI,0,0]});for(let[a,o]of[["fl",.36],["bl",-.36]])for(let l of[0,1])i.add(fe(.075,.05,.55),t,{ch:a,k:l,pv:[l?.15:-.15,.56,o]}),i.add(Zt(.055,5,4),e,{ch:a,k:l,pv:[l?.15:-.15,.56,o],at:[0,-.55,.03]});return i.add(fe(.07,.025,.55),t,{ch:"tail",pv:[0,.72,-.48],rot:[-2.2,0,0]}),{parts:i.build(),h:1.1}};Sn.wisp=()=>{let i=new fn;i.add(Zt(.17),ye("#9dffc8",6),{ch:"pulse",pv:[0,1.1,0]}),i.add(Zt(.32,14,10),gt("#5affb0",{emi:"#2aff90",ei:1.2,opacity:.3,rough:.2}),{ch:"pulse",pv:[0,1.1,0]});for(let t=0;t<3;t++){let e=t/3*Di;i.add(Zt(.06,6,5),ye("#c8ffe0",5),{ch:"spin",k:0,pv:[0,1.1,0],at:[Math.cos(e)*.48,Math.sin(t)*.1,Math.sin(e)*.48]})}for(let t=0;t<3;t++)i.add(Ee(.08,.5,5),gt("#5affb0",{emi:"#2aff90",ei:1.5,opacity:.4}),{ch:"tent",k:t,pv:[(t-1)*.1,.9,0],at:[0,-.25,0],rot:[Math.PI,0,0]});return{parts:i.build(),float:!0,h:1.5}};Sn.treant=()=>{let i=new fn,t=gt("#3d2a1c",{flat:!0,rough:1}),e=gt("#25503a",{flat:!0,rough:.9}),n=gt("#2f6a40",{flat:!0,emi:"#103a20",ei:.4});i.add(Me(.28,.42,1.35,8),t,{ch:"body",at:[0,.95,0]}),i.add(se(.2,.06,.05),gt("#0a0604"),{ch:"body",at:[0,1.05,.33]});let s=ye("#d8ff5a",6);i.add(Zt(.05,6,5),s,{ch:"body",at:[-.11,1.28,.3]}).add(Zt(.05,6,5),s,{ch:"body",at:[.11,1.28,.3]}),i.add(fe(.16,.1,.62),t,{ch:"legL",pv:[-.2,.55,0]}),i.add(fe(.16,.1,.62),t,{ch:"legR",pv:[.2,.55,0]});for(let[a,o]of[["armL",-1],["armR",1]])i.add(fe(.11,.05,.95),t,{ch:a,pv:[o*.3,1.45,0],rot:[0,0,o*.9]}),i.add(fe(.05,.02,.4),t,{ch:a,pv:[o*.3,1.45,0],at:[o*.5,-.4,0],rot:[.3,0,o*1.8]}),i.add(be(.18,0,7),e,{ch:a,pv:[o*.3,1.45,0],at:[o*.75,-.55,0]});let r={ch:"head",pv:[0,1.62,0]};return i.add(be(.5,1,3),e,{...r,at:[0,.25,0]}),i.add(be(.36,0,5),n,{...r,at:[-.34,.08,.1]}).add(be(.36,0,9),e,{...r,at:[.34,.12,-.05]}),{parts:i.build(),h:2.4}};Sn.skeleton=()=>{let i=new fn,t=gt("#d6ceb6",{rough:.7}),e=gt("#6b5a48",{metal:.6,rough:.6});i.add(se(.26,.1,.12),t,{ch:"body",at:[0,.86,0]}),i.add(Me(.035,.035,.55,5),t,{ch:"body",at:[0,1.12,-.04]});for(let r=0;r<4;r++)i.add(new Be(.17-r*.015,.022,5,12,Math.PI*1.4),t,{ch:"body",at:[0,1.05+r*.1,-.02],rot:[Math.PI/2,0,Math.PI*.8]});let n={ch:"head",pv:[0,1.42,0]};i.add(Zt(.16,10,8),t,{...n,at:[0,.14,0],scl:[.95,1,1.05]}),i.add(se(.16,.06,.12),t,{...n,at:[0,0,.06]}),i.add(Zt(.05,6,5),gt("#05060a"),{...n,at:[-.06,.15,.13]}).add(Zt(.05,6,5),gt("#05060a"),{...n,at:[.06,.15,.13]});let s=ye("#4aa8ff",7);return i.add(Zt(.025,5,4),s,{...n,at:[-.06,.15,.16]}).add(Zt(.025,5,4),s,{...n,at:[.06,.15,.16]}),i.add(fe(.04,.03,.82),t,{ch:"legL",pv:[-.1,.86,0]}),i.add(fe(.04,.03,.82),t,{ch:"legR",pv:[.1,.86,0]}),i.add(fe(.035,.03,.62),t,{ch:"armL",pv:[-.22,1.38,0]}),i.add(fe(.035,.03,.62),t,{ch:"armR",pv:[.22,1.38,0]}),i.add(se(.05,.75,.02),e,{ch:"armR",pv:[.22,1.38,0],at:[0,-.62,.38],rot:[Math.PI/2,0,0]}),{parts:i.build(),h:1.8}};Sn.deadmage=()=>{let i=new fn,t=gt("#1d2442",{rough:.9,double:!0}),e=gt("#5a7ab8",{metal:.6,rough:.4});i.add(jr([[0,1.45],[.22,1.42],[.3,1.3],[.36,.9],[.46,.4],[.54,.05]],14,.12),t,{ch:"sway"}),i.add(new Be(.33,.025,4,16),e,{ch:"sway",at:[0,.95,0],rot:[Math.PI/2,0,0]}),i.add(Zt(.24,10,8),t,{ch:"sway",at:[0,1.58,-.02],scl:[1,1.1,1.05]}),i.add(Zt(.17,8,6),gt("#020308"),{ch:"sway",at:[0,1.55,.1]});let n=ye("#7fc8ff",7);return i.add(Zt(.03,5,4),n,{ch:"sway",at:[-.06,1.57,.24]}).add(Zt(.03,5,4),n,{ch:"sway",at:[.06,1.57,.24]}),i.add(fe(.1,.07,.5),t,{ch:"armL",pv:[-.28,1.35,0]}),i.add(fe(.1,.07,.5),t,{ch:"armR",pv:[.28,1.35,0]}),i.add(Me(.025,.025,1.7,5),gt("#3a2a1e"),{ch:"armR",pv:[.28,1.35,0],at:[.02,-.45,.12]}),i.add(Zt(.09,8,6),ye("#7fbfff",6),{ch:"armR",pv:[.28,1.35,0],at:[.02,.42,.12]}),{parts:i.build(),h:1.9}};Sn.golem=()=>{let i=new fn,t=gt("#bdb39a",{flat:!0,rough:.85}),e=gt("#3a342a",{flat:!0});i.add(be(.62,0,11,.2),t,{ch:"body",at:[0,1.45,0],scl:[1.2,1,.9]});for(let s=0;s<4;s++)i.add(Me(.05,.05,.9,5),t,{ch:"body",at:[-.3+s*.2,1.2,.45],rot:[.2,0,Math.PI/2+.3]});i.add(Zt(.15,10,8),ye("#5ab0ff",6),{ch:"body",at:[0,1.45,.55]}),i.add(Zt(.2,8,6),t,{ch:"head",pv:[0,2,.15],at:[0,.1,.05]});let n=ye("#5ab0ff",7);i.add(Zt(.04,5,4),n,{ch:"head",pv:[0,2,.15],at:[-.07,.12,.22]}).add(Zt(.04,5,4),n,{ch:"head",pv:[0,2,.15],at:[.07,.12,.22]});for(let[s,r]of[["armL",-1],["armR",1]])i.add(fe(.2,.15,.9),t,{ch:s,pv:[r*.75,1.8,0]}),i.add(be(.26,0,13+r),e,{ch:s,pv:[r*.75,1.8,0],at:[0,-1,.05]});return i.add(fe(.22,.18,.85),t,{ch:"legL",pv:[-.32,.88,0]}),i.add(fe(.22,.18,.85),t,{ch:"legR",pv:[.32,.88,0]}),{parts:i.build(),h:2.5}};Sn.spawn=()=>{let i=new fn,t=gt("#4a1d7a",{emi:"#2a0a50",ei:.8,rough:.5});i.add(Zt(.42,14,10),t,{ch:"pulse",pv:[0,.5,0],scl:[1,.85,1]});let e=ye("#ffb0ff",6);[[-.15,.12,.33,.07],[.15,.1,.33,.06],[0,-.05,.38,.08],[.25,-.08,.28,.05]].forEach(([n,s,r,a])=>i.add(Zt(a,6,5),e,{ch:"pulse",pv:[0,.5,0],at:[n,s,r]}));for(let n=0;n<6;n++){let s=n/6*Di;i.add(fe(.08,.02,.65),t,{ch:"tent",k:n,pv:[Math.sin(s)*.32,.35,Math.cos(s)*.32],rot:[Math.cos(s)*1.1,0,-Math.sin(s)*1.1]})}return{parts:i.build(),h:1}};Sn.voideye=()=>{let i=new fn,t={ch:"pulse",pv:[0,1.25,0]};i.add(Zt(.46,16,12),gt("#efe0ec",{rough:.25}),t),i.add(Me(.26,.26,.02,20),ye("#ff4fd2",3),{...t,at:[0,0,.45],rot:[Math.PI/2,0,0]}),i.add(se(.06,.32,.02),gt("#0b0010"),{...t,at:[0,0,.465]});for(let e=0;e<6;e++)i.add(Me(.008,.008,.4,3),gt("#c02050",{emi:"#600010",ei:1}),{...t,at:[Math.cos(e)*.3,Math.sin(e*2)*.3,.3],rot:[e,e*2,0]});for(let e=0;e<5;e++){let n=e/5*Di;i.add(fe(.07,.015,.8),gt("#5a1a7a",{emi:"#2a0040",ei:.6}),{ch:"tent",k:e,pv:[Math.cos(n)*.22,.9,Math.sin(n)*.22]})}return{parts:i.build(),float:!0,h:1.8}};Sn.horror=()=>{let i=new fn,t=gt("#24113a",{flat:!0,rough:.6,emi:"#12051f",ei:1}),e=gt("#120818",{flat:!0}),n=ye("#c070ff",5);i.add(be(.75,1,21,.18),t,{ch:"pulse",pv:[0,1.15,0]});for(let s=0;s<12;s++){let r=s/12*Di,a=Math.sin(s*1.7)*.4;i.add(Ee(.1,.55,5),e,{ch:"pulse",pv:[0,1.15,0],at:[Math.cos(r)*.72,a,Math.sin(r)*.72],rot:[Math.sin(r)*1.2,0,-Math.cos(r)*1.2]})}i.add(Zt(.1,8,6),n,{ch:"pulse",pv:[0,1.15,0],at:[-.25,.15,.66],scl:[.7,1.4,.5]}),i.add(Zt(.1,8,6),n,{ch:"pulse",pv:[0,1.15,0],at:[.25,.15,.66],scl:[.7,1.4,.5]}),i.add(se(.5,.12,.1),ye("#ff4060",2),{ch:"jaw",pv:[0,.95,.6]});for(let s=0;s<4;s++){let r=-.6+s*.4+(s>1?Math.PI-.6:0);i.add(fe(.13,.03,1.1),t,{ch:"tent",k:s,pv:[Math.cos(r)*.6,.9,Math.sin(r)*.3+.1],rot:[.6,0,(s<2?-1:1)*.7]})}return{parts:i.build(),h:2.3}};var md=new Map;function _d(i){let t=md.get(i);return t||(t=Sn[i](),md.set(i,t)),t}function yd(){let i=new jt,t=new jt;i.add(t);let e=gt("#2c1650",{rough:.8,double:!0}),n=gt("#3e1f6e",{rough:.7,double:!0}),s=gt("#d8b25a",{metal:.9,rough:.3,emi:"#4a3010",ei:.4}),r=gt("#2a1a14"),a=new pt(jr([[0,1.5],[.2,1.48],[.28,1.38],[.3,1.1],[.36,.7],[.46,.3],[.56,.02]],20,.08,1),e);t.add(a);let o=new pt(new Be(.535,.03,5,24),s);o.rotation.x=Math.PI/2,o.position.y=.08,t.add(o);let l=new pt(new Be(.31,.035,5,20),s);l.rotation.x=Math.PI/2,l.position.y=.98,t.add(l);let h=new pt(new yn(.06),ye("#c78bff",5));h.position.set(0,.98,.33),t.add(h);let u=new pt(se(.16,.9,.02),n);u.position.set(0,.5,.42),u.rotation.x=-.2,t.add(u);let f=new pt(se(.2,.9,.012),s);f.position.set(0,.5,.415),f.rotation.x=-.2,f.scale.x=1.15,t.add(f);for(let Y of[-1,1]){let W=new pt(new Un(.16,10,6,0,Di,0,Math.PI/2),n);W.position.set(Y*.26,1.36,0),W.scale.set(1,.6,1),t.add(W);let $=new pt(new Be(.15,.018,4,12),s);$.position.set(Y*.26,1.36,0),$.rotation.x=Math.PI/2,t.add($)}let p=new jt;p.position.set(0,1.4,-.18),t.add(p);let d=new En(.75,1.35,4,6);d.translate(0,-.67,0);let m=new pt(d,gt("#1c0d33",{rough:.9,double:!0}));p.add(m);let x=new jt;x.position.set(0,1.55,0),t.add(x);let c=new pt(Zt(.25,14,10),n);c.scale.set(1,1.15,1.1),x.add(c);let g=new pt(Ee(.14,.3,10),n);g.position.set(0,.2,-.16),g.rotation.x=-.9,x.add(g);let _=new pt(new Be(.17,.02,4,16),s);_.position.set(0,-.02,.18),_.scale.y=1.3,x.add(_);let M=new pt(Zt(.17,10,8),r);M.position.set(0,-.03,.12),M.scale.z=.7,x.add(M);let v=new pt(Zt(.16,10,8),gt("#04020a"));v.position.set(0,.04,.14),v.scale.set(1,.6,.7),x.add(v);let R=ye("#c9a8ff",7),w=[];for(let Y of[-1,1]){let W=new pt(Zt(.025,6,5),R);W.position.set(Y*.06,-.02,.27),x.add(W),w.push(W)}let y=new jt;y.position.set(-.3,1.32,0),t.add(y);let S=new jt;S.position.set(.3,1.32,0),t.add(S);for(let Y of[y,S]){let W=new pt(fe(.09,.13,.55,8),n);Y.add(W);let $=new pt(new Be(.12,.02,4,12),s);$.position.y=-.53,$.rotation.x=Math.PI/2,Y.add($);let X=new pt(Zt(.06,6,5),r);X.position.y=-.6,Y.add(X)}let D=new pt(Zt(.08,10,8),ye("#c070ff",6));D.position.set(0,-.72,.06),y.add(D);let L=new jt;L.position.set(0,-.6,.05),S.add(L);let U=new pt(Me(.028,.034,2,6),gt("#2a1a10",{rough:.8}));U.position.y=.25,L.add(U);let z=new pt(new Be(.045,.012,4,10),s);z.rotation.x=Math.PI/2,z.position.y=.9,L.add(z);let G=new jt;G.position.y=1.3,L.add(G);for(let Y=0;Y<4;Y++){let W=new pt(fe(.02,.008,.32,4),s);W.rotation.set(Math.PI,Y*Math.PI/2,0),W.rotation.z=Math.PI+.35,W.rotation.y=Y*Math.PI/2,W.position.set(0,-.05,0),G.add(W)}let N=new pt(new yn(.11,0),ye("#b46cff",5));N.scale.y=1.7,N.position.y=.22,G.add(N),i.traverse(Y=>{Y.isMesh&&(Y.castShadow=!0,Y.receiveShadow=!1)}),m.castShadow=!0;let q={walk:0};return{root:i,crystal:N,orb:D,update(Y,W,$){let X=W.moving?1:0;q.walk+=$*(W.moving?9:0);let j=Math.sin(q.walk);t.position.y=Math.abs(j)*.06*X+Math.sin(Y*2)*.015,t.rotation.x=.12*X,t.rotation.z=j*.04*X,a.rotation.y=Math.sin(Y*1.5)*.05,a.scale.set(1+j*.03*X,1,1-j*.03*X),p.rotation.x=.25+.5*X+Math.sin(Y*4)*.08,m.geometry.attributes.position.needsUpdate=!1;let it=W.castT>0?Math.min(1,W.castT/.15):0;y.rotation.x=-j*.4*X-.3-it*.9,y.rotation.z=-.15-it*.3,S.rotation.x=j*.4*X-.35-it*.6,S.rotation.z=.12,x.rotation.y=Math.sin(Y*.7)*.15,G.rotation.y=Y*1.5;let vt=W.heart>=100;N.scale.setScalar(vt?1+Math.sin(Y*10)*.15:1),N.scale.y*=1.7,N.material.emissiveIntensity=vt?9:4+it*3,D.scale.setScalar(1+Math.sin(Y*6)*.15+it*.8)}}}function ul(i){i.traverse(t=>{t.isMesh&&(t.castShadow=!0)})}function Xx(){let i=new jt,t=new jt;i.add(t);let e=gt("#6a6488",{metal:.4,rough:.45,flat:!0}),n=gt("#2c2638",{metal:.3,rough:.55,flat:!0}),s=gt("#6a4aa0",{metal:.9,rough:.3,emi:"#3a1a70",ei:.8}),r=ye("#c78bff",8);t.scale.setScalar(2.4);let o=[];for(let S of[-1,1]){let D=new jt;D.position.set(S*.17,.82,0),t.add(D),o.push(D),D.add(new pt(fe(.13,.11,.8,7),e));let L=new pt(Zt(.09,6,5),n);L.position.set(0,-.4,.08),D.add(L)}let l=new jt;l.position.y=.85,t.add(l),l.add(Vc(new pt(Me(.38,.28,.7,8),e),0,.38,0));let h=new pt(se(.05,.4,.02),r);h.position.set(0,.42,.33),l.add(h);let u=new pt(se(.3,.04,.02),r);u.position.set(0,.5,.33),l.add(u);for(let S of[-1,1]){let D=new pt(Zt(.22,8,6),e);D.position.set(S*.43,.68,0),D.scale.set(1,.65,1),l.add(D);for(let L=0;L<3;L++){let U=new pt(Ee(.05,.3,5),n);U.position.set(S*(.43+L*.05),.82,-.08+L*.08),U.rotation.z=-S*(.5+L*.2),l.add(U)}}let f=new jt;f.position.set(0,.7,-.25),l.add(f);let p=new En(.95,1.55,6,8);p.translate(0,-.77,0);let d=p.attributes.position;for(let S=0;S<d.count;S++)d.getY(S)<-1.5&&d.setY(S,-1.55+Math.abs(Math.sin(d.getX(S)*20))*.2);let m=new pt(p,gt("#3a1830",{rough:.95,double:!0}));f.add(m);let x=new jt;x.position.set(0,.85,.02),l.add(x),x.add(Vc(new pt(Me(.19,.21,.36,8),n),0,.15,0));for(let S of[-1,1]){let D=new pt(Ee(.06,.45,6),e);D.position.set(S*.18,.42,-.02),D.rotation.z=-S*.5,x.add(D)}let c=new pt(se(.26,.04,.03),r);c.position.set(0,.17,.2),x.add(c);let g=new jt;g.position.set(-.45,.6,0),l.add(g),g.add(new pt(fe(.1,.09,.65,7),e));let _=new jt;_.position.set(.45,.6,0),l.add(_),_.add(new pt(fe(.1,.09,.65,7),e));let M=new jt;M.position.set(0,-.62,.05),_.add(M);let v=new pt(se(.1,1.6,.03),gt("#3a2a5a",{metal:.9,rough:.2,emi:"#8a4cff",ei:2.2}));v.position.y=.95,M.add(v);let R=new pt(se(.02,1.55,.04),ye("#e0b8ff",6));R.position.set(.05,.95,0),M.add(R);let w=new pt(se(.42,.06,.08),s);w.position.y=.12,M.add(w);let y=new pt(Me(.03,.03,.3,5),n);return M.add(y),ul(i),{root:i,h:5.2,swordTip:R,update(S,D,L,U){let z=D.ai.mode,G=U.ph,N=z==="walk"?1:0;if(o[0].rotation.x=Math.sin(G)*.5*N,o[1].rotation.x=-Math.sin(G)*.5*N,t.position.y=Math.abs(Math.sin(G))*.08*N,f.rotation.x=.2+(z==="charge"?.9:.2*N)+Math.sin(S*3)*.08,z==="windup")_.rotation.x=-2.6,_.rotation.z=.3,l.rotation.x=-.15,M.rotation.x=0;else if(z==="charge")_.rotation.x=-1.4,_.rotation.z=0,l.rotation.x=.35,M.rotation.x=.2;else{let q=U.atk;_.rotation.x=-.5-Math.sin(G)*.2*N-q*2.2,_.rotation.z=.15-q*.6,l.rotation.x=.05+q*.2,l.rotation.y=-q*.5,M.rotation.x=.7}g.rotation.x=Math.sin(G)*.4*N-.2,c.material.emissiveIntensity=6+Math.sin(S*6)*2}}}function qx(){let i=new jt,t=new jt;i.add(t);let e=gt("#2f3b42",{flat:!0,rough:.9}),n=gt("#141a1e",{flat:!0}),s=gt("#8a7a5a",{rough:.6});t.scale.setScalar(2);let a=new pt(be(.75,1,41,.15),e);a.position.set(0,1.2,-.1),a.scale.set(1.1,.9,1.35),t.add(a);for(let x=0;x<16;x++){let c=x/16*Math.PI-Math.PI/2,g=-.7+x%8*.2,_=new pt(Ee(.07,.5+x%3*.15,5),n);_.position.set(Math.sin(c)*.6,1.6+Math.cos(c)*.3,g),_.rotation.set(-.5,0,-Math.sin(c)*.8),t.add(_)}let o=[];for(let[x,c]of[[-.55,.45],[.55,.45],[-.55,-.6],[.55,-.6]]){let g=new jt;g.position.set(x,.95,c),t.add(g),o.push(g),g.add(new pt(fe(.22,.15,.95,7),e));for(let _=-1;_<=1;_++){let M=new pt(Ee(.04,.18,4),s);M.position.set(_*.07,-.95,.15),M.rotation.x=Math.PI/2,g.add(M)}}let l=new jt;l.position.set(0,1.35,.95),t.add(l);let h=new pt(be(.45,1,7,.12),e);h.scale.set(1.1,.8,1.1),h.position.set(0,.12,.1),l.add(h);for(let x of[-1,1]){let c=new pt(new Be(.35,.06,6,12,Math.PI*.9),s);c.position.set(x*.3,.45,-.05),c.rotation.set(0,x*.4+Math.PI/2,Math.PI*.55*x),l.add(c)}let u=ye("#ff3a3a",8);for(let x of[-1,1]){let c=new pt(Zt(.06,6,5),u);c.position.set(x*.22,.25,.48),l.add(c)}let f=new pt(Zt(.18,10,8),ye("#b46cff",6));f.position.set(0,-.05,.4),l.add(f);let p=gt("#e8e2c8");for(let x=0;x<7;x++){let c=new pt(Ee(.035,.16,4),p);c.position.set(-.27+x*.09,0,.5),c.rotation.x=Math.PI,l.add(c)}let d=new jt;d.position.set(0,-.08,.05),l.add(d);let m=new pt(se(.65,.12,.6),e);m.position.set(0,-.06,.25),d.add(m);for(let x=0;x<7;x++){let c=new pt(Ee(.03,.14,4),p);c.position.set(-.27+x*.09,.05,.5),d.add(c)}return ul(i),{root:i,h:4.6,maw:f,update(x,c,g,_){let M=_.ph;o[0].rotation.x=Math.sin(M)*.4,o[3].rotation.x=Math.sin(M)*.4,o[1].rotation.x=-Math.sin(M)*.4,o[2].rotation.x=-Math.sin(M)*.4,t.position.y=Math.abs(Math.sin(M))*.06,a.scale.y=.9+Math.sin(x*2)*.03,d.rotation.x=.15+(Math.sin(x*3)*.5+.5)*.2+_.atk*.7,l.rotation.x=-_.atk*.3,f.material.emissiveIntensity=5+_.atk*8+Math.sin(x*5)*1.5}}}function Yx(){let i=new jt,t=new jt;i.add(t);let e=gt("#241a34",{rough:.85,double:!0}),n=gt("#e4dcc6",{rough:.6}),s=gt("#c8a24a",{metal:.9,rough:.35,emi:"#3a2008",ei:.3}),r=ye("#c070ff",3);t.scale.setScalar(2.5);let o=new pt(jr([[0,1.55],[.3,1.5],[.42,1.3],[.45,.9],[.62,.4],[.82,0]],22,.28,2),e);t.add(o);let l=new pt(Me(.08,.2,1.2,8),gt("#b46cff",{emi:"#b46cff",ei:1.6,opacity:.5}));l.position.set(0,.7,.36),l.rotation.x=-.25,t.add(l);let h=new jt;h.position.set(0,1.15,.28),t.add(h);for(let g=0;g<4;g++){let _=new pt(new Be(.16-g*.01,.02,4,12,Math.PI),n);_.position.y=g*.09,_.rotation.set(0,0,Math.PI),h.add(_)}let u=new pt(new Be(.34,.06,6,18),s);u.rotation.x=Math.PI/2,u.position.y=1.5,t.add(u);for(let g=0;g<8;g++){let _=new pt(Ee(.04,.35,4),e),M=Math.PI+g/7*Math.PI;_.position.set(Math.cos(M)*.38,1.6,Math.sin(M)*.25-.05),_.rotation.z=-Math.cos(M)*.6,t.add(_)}let f=new jt;f.position.set(0,1.78,.05),t.add(f),f.add(new pt(Zt(.22,12,10),n));let p=new pt(se(.2,.08,.14),n);p.position.set(0,-.17,.06),f.add(p);for(let g of[-1,1]){let _=new pt(Zt(.06,6,5),gt("#05030a"));_.position.set(g*.08,.02,.17),f.add(_);let M=new pt(Zt(.03,6,5),ye("#d68bff",9));M.position.set(g*.08,.02,.2),f.add(M);let v=new pt(new Be(.28,.035,6,12,Math.PI*.8),gt("#1a1420",{rough:.5}));v.position.set(g*.18,.2,-.05),v.rotation.set(0,Math.PI/2,g>0?.3:Math.PI-.3),f.add(v)}let d=new jt;d.position.y=.18,f.add(d),d.add(new pt(Me(.2,.2,.08,14,!0),s));for(let g=0;g<7;g++){let _=g/7*Di,M=new pt(Ee(.035,.16,4),s);M.position.set(Math.cos(_)*.2,.11,Math.sin(_)*.2),d.add(M)}let m=[];for(let g of[-1,1]){let _=new jt;_.position.set(g*.42,1.42,0),t.add(_),m.push(_),_.add(new pt(fe(.13,.17,.6,8),e));let M=new pt(Zt(.06,6,5),n);M.position.y=-.65,_.add(M)}let x=new jt;x.position.set(0,-.65,.05),m[0].add(x),x.add(Vc(new pt(Me(.03,.03,2.2,6),s),0,.3,0));let c=new pt(Zt(.13,12,10),ye("#7fd6ff",3));return c.position.y=1.5,x.add(c),ul(i),{root:i,h:5.6,orb:c,update(g,_,M,v){t.position.y=.3+Math.sin(g*1.6)*.12,o.rotation.y=Math.sin(g*.8)*.1,o.scale.x=o.scale.z=1+Math.sin(g*2.2)*.03;let R=v.atk;m[1].rotation.x=-.3-R*2.2+Math.sin(g*1.3)*.1,m[1].rotation.z=.2+R*.4,m[0].rotation.x=-.4-R*.6,f.rotation.y=Math.sin(g*.9)*.2,c.material.emissiveIntensity=2.5+R*5,l.material.opacity=.35+Math.sin(g*4)*.15}}}function Zx(){let i=new jt,t=new jt;i.add(t);let e=gt("#1e1030",{rough:.8,double:!0}),n=gt("#2a1040",{emi:"#8a4cff",ei:1.5,double:!0});t.scale.setScalar(2.6);let r=new pt(jr([[0,1.85],[.24,1.8],[.34,1.55],[.38,1.1],[.5,.55],[.7,0]],22,.35,5),e);t.add(r);let a=new pt(Ee(.32,.8,14,1,!0),e);a.position.set(0,2.1,-.02),t.add(a);let o=new pt(Zt(.2,10,8),gt("#000000"));o.position.set(0,1.9,.1),t.add(o);for(let m of[-1,1]){let x=new pt(Zt(.035,6,5),ye("#ffffff",5));x.position.set(m*.08,1.92,.27),x.scale.set(1.6,.7,1),t.add(x)}let l=new pt(Zt(.2,16,12),ye("#7fc0ff",2));l.position.set(0,1.35,.32),t.add(l);let h=new pt(new Be(.3,.02,6,24),ye("#5a8cff",2.5));h.position.copy(l.position),t.add(h);let u=new jt;t.add(u);for(let m=0;m<6;m++){let x=new pt(Me(.012,.004,.9,3),ye("#6aa0ff",2.5)),c=m/6*Di;x.position.set(Math.cos(c)*.25,1+Math.sin(c)*.3,.33),x.rotation.z=c,u.add(x)}let f=[];for(let m of[-1,1]){let x=new jt;x.position.set(m*.25,1.6,-.2),t.add(x),f.push(x);let c=pd(1.9,1.3,m>0?1:2);m<0&&c.scale(-1,1,1),x.add(new pt(c,e));let g=new pt(pd(1.95,1.35,m>0?1:2),n);m<0&&g.geometry.scale(-1,1,1),g.scale.set(1,1,1),g.position.z=-.01,g.material=gt("#2a1040",{emi:"#6a2cff",ei:1.2,double:!0,opacity:.5}),x.add(g)}let p=new jt;p.position.set(0,2.3,-.3),t.add(p);for(let m=0;m<10;m++){let x=new pt(new yn(.08),ye("#d68bff",2.2)),c=m/10*Di;x.position.set(Math.cos(c)*.55,Math.sin(c)*.55,0),x.scale.y=2,x.rotation.z=c,p.add(x)}let d=[];for(let m of[-1,1]){let x=new jt;x.position.set(m*.36,1.55,0),t.add(x),d.push(x),x.add(new pt(fe(.1,.15,.7,8),e));for(let c=-1;c<=1;c++){let g=new pt(Ee(.02,.22,4),gt("#1a0a28"));g.position.set(c*.04,-.8,.02),g.rotation.x=Math.PI,x.add(g)}}return ul(i),{root:i,h:6.5,core:l,update(m,x,c,g){t.position.y=.4+Math.sin(m*1.4)*.15;let _=Math.sin(m*(x.ai.mode==="charge"?12:3.2));f[0].rotation.y=.35+_*.45,f[1].rotation.y=-.35-_*.45,f[0].rotation.z=_*.1,f[1].rotation.z=-_*.1,p.rotation.z=m*.8,h.rotation.set(m*1.3,m*.9,0);let M=Math.max(g.atk,x.ai.mode==="windup"?1:0);d[0].rotation.set(-.4-M*1.5,0,-.3-M*.5),d[1].rotation.set(-.4-M*1.5,0,.3+M*.5),l.material.emissiveIntensity=1.8+Math.sin(m*6)*.6+M*2.5,r.rotation.y=Math.sin(m)*.1}}}function vd(i){switch(i){case"fallen_knight":return Xx();case"devourer":return qx();case"soulless_king":return Yx();default:return Zx()}}var zs={shard:()=>{let i=new yn(.16,0);return i.scale(.5,.5,2.4),i},crescent:()=>Vx(.42,.1,.05),gem:()=>new yn(.13,0)};var Ni=Math.PI*2,Xc=16,dl=12,ta=3;function Le(i){let t=new Map;for(let[e,n,s=0,r=0,a=0,o=0,l=0,h=0,u=1,f=1,p=1]of i){let d=e.clone();d.applyMatrix4(new pe().compose(new H(s,r,a),new Ye().setFromEuler(new sn(o,l,h)),new H(u,f,p)));for(let x of Object.keys(d.attributes))x!=="position"&&x!=="normal"&&d.deleteAttribute(x);let m=d.index?d.toNonIndexed():d;t.has(n)||t.set(n,[]),t.get(n).push(m)}return[...t].map(([e,n])=>({mat:e,geo:hl(n)}))}function Jx(i){let t=[];if(i==="ruins"){let e=gt("#5d5864",{flat:!0,rough:.95}),n=gt("#47434d",{flat:!0,rough:.95}),s=gt("#26232b",{metal:.7,rough:.5}),r=gt("#ff5a1a",{emi:"#ff4a10",ei:3}),a=[];a.push([se(1.2,.35,1.2),n,0,.17,0]),a.push([Me(.42,.46,.25,14),e,0,.45,0]),a.push([Me(.36,.4,2.4,14),e,0,1.75,0]),a.push([be(.42,0,3,.35),e,.05,2.95,0,0,0,0,1,.6,1]),t.push({parts:Le(a),density:.55,scale:[.7,1.25],clear:6}),t.push({parts:Le([[Me(.38,.38,3.2,14),e,0,.38,0,0,0,Math.PI/2],[be(.4,0,5),n,1.9,.3,.3],[be(.3,0,8),e,-1.9,.25,-.2]]),density:.25,scale:[.8,1.1],clear:6}),t.push({parts:Le([[be(.5,0,11),e,0,.25,0],[be(.32,0,12),n,.6,.15,.3],[be(.25,0,13),e,-.4,.12,.5],[be(.2,0,14),n,.2,.1,-.6]]),density:1.4,scale:[.6,1.4]});let o=[[se(3.2,1.4,.7),n,0,.7,0]];for(let u=0;u<5;u++)o.push([be(.38,0,20+u),e,-1.3+u*.65,1.45+u%2*.25,0]);t.push({parts:Le(o),density:.3,scale:[.8,1.2],clear:7});let l=[[Wc([[0,.9],[.45,1],[.55,1.2],[.5,1.25],[.38,1.05],[0,1]],12),s]];for(let u=0;u<3;u++){let f=u/3*Ni;l.push([fe(.04,.03,1,5),s,Math.cos(f)*.32,1,Math.sin(f)*.32,Math.sin(f)*.3,0,-Math.cos(f)*.3])}l.push([be(.32,0,2),r,0,1.12,0,0,0,0,1,.4,1]),t.push({parts:Le(l),density:.18,scale:[1,1],clear:5,emit:[{kind:"flame",y:1.3,size:1.2,color:"#ff8a3c"}]});let h=[];for(let u=0;u<6;u++)h.push([Me(.035,.035,1.8,5),s,-1.5+u*.6,.9,0]),h.push([Ee(.06,.18,4),s,-1.5+u*.6,1.88,0]);h.push([se(3.3,.06,.06),s,0,1.55,0]),h.push([se(3.3,.06,.06),s,0,.35,0]),h.push([se(.2,2.1,.2),n,-1.75,1.05,0]),h.push([se(.2,2.1,.2),n,1.75,1.05,0]),t.push({parts:Le(h),density:.2,scale:[1,1],clear:7})}else if(i==="forest"){let e=gt("#2e2219",{flat:!0,rough:1}),n=gt("#1f4a44",{flat:!0,rough:.9}),s=gt("#2c5f50",{flat:!0,rough:.9}),r=gt("#3a6a48",{flat:!0}),a=gt("#6a7478",{flat:!0,rough:.9}),o=gt("#7fe8ff",{emi:"#3ad0ff",ei:1.3}),l=gt("#cfd8d0"),h=[[Me(.22,.42,3.4,8),e,0,1.7,0]];for(let p=0;p<4;p++){let d=p/4*Ni+.4;h.push([fe(.16,.05,1,5),e,Math.cos(d)*.3,.45,Math.sin(d)*.3,Math.sin(d)*1.1,0,-Math.cos(d)*1.1])}h.push([be(1,1,3,.25),n,0,3.8,0,0,0,0,1,.75,1]),h.push([be(.7,1,4,.25),s,.7,3.3,.4]),h.push([be(.6,1,5,.25),n,-.6,3.4,-.4]),t.push({parts:Le(h),density:.5,scale:[.8,1.3],clear:8}),t.push({parts:Le([[be(.6,1,7,.2),a,0,.3,0,0,0,0,1.3,.7,1],[be(.45,0,8),r,.1,.62,0,0,0,0,1.2,.35,1]]),density:.9,scale:[.6,1.6]});let u=[];for(let p=0;p<4;p++){let d=p%2*.35-.17,m=Math.floor(p/2)*.3-.15,x=.25+p*.08;u.push([Me(.04,.05,x,6),l,d,x/2,m]),u.push([new Un(.16-p*.015,10,6,0,Ni,0,Math.PI/2),o,d,x,m])}t.push({parts:Le(u),density:.6,scale:[.8,1.4],emit:[{kind:"glow",y:.4,size:1.3,color:"#3ad0ff"}]});let f=[];for(let p=0;p<7;p++){let d=p/7*Ni;f.push([Ee(.12,.9,4),s,Math.cos(d)*.25,.3,Math.sin(d)*.25,Math.sin(d)*1,0,-Math.cos(d)*1,1,1,.3])}t.push({parts:Le(f),density:1.6,scale:[.6,1.3]}),t.push({parts:Le([[Me(.45,.55,.6,9),e,0,.3,0],[Me(.42,.42,.02,9),gt("#8a6a48"),0,.61,0]]),density:.2,scale:[.8,1.2]})}else if(i==="crypt"){let e=gt("#4a5060",{flat:!0,rough:.95}),n=gt("#353a46",{flat:!0,rough:.95}),s=gt("#1e2026",{metal:.7,rough:.5}),r=gt("#cfc6ae"),a=gt("#e8dcc0",{rough:.6}),o=[[se(.8,1,.18),e,0,.5,0],[Me(.4,.4,.18,12),e,0,1,0,Math.PI/2],[se(1,.15,.4),n,0,.07,0]];t.push({parts:Le(o),density:1.2,scale:[.8,1.2],tilt:.15,clear:4}),t.push({parts:Le([[se(1.1,.7,2.3),n,0,.35,0],[se(1.2,.15,2.4),e,0,.77,0],[se(.5,.1,1.2),e,0,.88,.2]]),density:.3,scale:[.9,1.1],clear:6}),t.push({parts:Le([[se(.9,.3,.9),n,0,.15,0],[se(.6,3.6,.6),e,0,1.9,0],[se(.95,.3,.95),n,0,3.75,0]]),density:.35,scale:[.8,1.1],clear:7});let l=[];[[0,0,.5],[.18,.1,.35],[-.15,.12,.28],[.05,-.18,.22]].forEach(([f,p,d])=>l.push([Me(.05,.06,d,6),a,f,d/2,p])),t.push({parts:Le(l),density:.5,scale:[1,1],emit:[{kind:"flame",y:.6,size:.55,color:"#ffb060"}]});let h=[[Zt(.14,8,6),r,0,.12,0]];for(let f=0;f<5;f++)h.push([Me(.03,.03,.5,4),r,Math.cos(f)*.25,.05,Math.sin(f*2)*.25,Math.PI/2,f,0]);t.push({parts:Le(h),density:1,scale:[.8,1.3]});let u=[];for(let f=0;f<6;f++)u.push([Me(.035,.035,1.8,5),s,-1.5+f*.6,.9,0]),u.push([Ee(.06,.18,4),s,-1.5+f*.6,1.88,0]);u.push([se(3.3,.06,.06),s,0,1.55,0]),u.push([se(3.3,.06,.06),s,0,.35,0]),t.push({parts:Le(u),density:.3,scale:[1,1],clear:7})}else{let e=gt("#1e1428",{flat:!0,rough:.8}),n=gt("#2b1d38",{flat:!0,rough:.8}),s=gt("#b46cff",{emi:"#9a4cff",ei:1.4,rough:.2}),r=gt("#c78bff",{emi:"#c78bff",ei:4}),a=[];for(let o=0;o<6;o++){let l=o/6*Ni,h=.8+o%3*.5,u=new yn(.2,0);a.push([u,s,Math.cos(l)*.25,h*.5,Math.sin(l)*.25,Math.sin(l)*.4,0,-Math.cos(l)*.4,1,h*2.2,1])}a.push([be(.45,0,4),e,0,.1,0,0,0,0,1.2,.4,1.2]),t.push({parts:Le(a),density:.7,scale:[.6,1.5],emit:[{kind:"glow",y:.9,size:1.8,color:"#a050ff"}]}),t.push({parts:Le([[Ee(.7,3.5,6),e,0,1.75,0],[Ee(.4,2.2,5),n,.6,1.1,.3,0,0,-.2]]),density:.45,scale:[.6,1.3],clear:6}),t.push({parts:Le([[se(.8,4.2,.8),n,0,2.1,0],[se(.1,3.2,.82),r,0,2.2,0],[se(.82,.1,.82),r,0,3.6,0],[Ee(.57,.8,4),e,0,4.6,0,0,Math.PI/4]]),density:.15,scale:[.9,1.1],clear:8,emit:[{kind:"glow",y:2.5,size:4,color:"#c78bff"}]}),t.push({parts:Le([[be(.55,0,9,.3),e,0,0,0],[be(.3,0,10,.3),n,.7,.4,.2]]),density:.6,scale:[.5,1.3],float:!0}),t.push({parts:Le([[be(.5,0,15),e,0,.2,0],[be(.3,0,16),n,.5,.12,.3]]),density:1,scale:[.6,1.4]})}return t}var $x={ruins:{sky:"#7d7aa0",gnd:"#1a1520",hemi:.75,dir:"#b8c4ff",dirI:1.7,fog:"#0c0a12",near:30,far:72,bump:.9,motes:{color:"#ffb070",cell:"DOT",rise:.6,size:.12}},forest:{sky:"#8ad0c8",gnd:"#10201e",hemi:1,dir:"#d8f0ff",dirI:1.9,fog:"#0b1a1a",near:32,far:76,bump:.6,motes:{color:"#b0ffe0",cell:"GLOW",rise:.15,size:.25}},crypt:{sky:"#7080b0",gnd:"#141824",hemi:.85,dir:"#a8bce8",dirI:1.6,fog:"#06080d",near:26,far:64,bump:1,motes:{color:"#9ab8ff",cell:"DOT",rise:-.1,size:.1}},abyss:{sky:"#9a6ac0",gnd:"#120818",hemi:.65,dir:"#d0a8ff",dirI:1.2,fog:"#10061a",near:28,far:70,bump:.8,motes:{color:"#d68bff",cell:"GLOW",rise:.4,size:.22}}};function Md(i,t){let e=$x[t],n=new jt;i.add(n),i.background=new Yt(e.fog),i.fog=new nr(e.fog,e.near,e.far);let s=ud(t),r=180,a=r/Xc;for(let S of[s.map,s.bump,s.emissive])S&&S.repeat.set(a,a);let o=new Wi({map:s.map,bumpMap:s.bump,bumpScale:e.bump*3,roughness:.92,metalness:0,emissive:s.emissive?new Yt("#ffffff"):new Yt(0),emissiveMap:s.emissive,emissiveIntensity:t==="abyss"?.55:.6}),l=new pt(new En(r,r),o);l.rotation.x=-Math.PI/2,l.receiveShadow=!0,n.add(l);let h=new Ar(e.sky,e.gnd,e.hemi);n.add(h);let u=new Rs(e.dir,e.dirI);u.castShadow=!0,u.shadow.mapSize.set(2048,2048);let f=u.shadow.camera;f.left=-30,f.right=30,f.top=30,f.bottom=-30,f.near=1,f.far=90,u.shadow.bias=-8e-4,u.shadow.normalBias=.03,n.add(u),n.add(u.target);let p=new Rs(e.sky,1.4);n.add(p),n.add(p.target);let d=Jx(t).map(S=>{let D=Math.ceil((2*ta+1)**2*(S.density+1)*1.6),L=S.parts.map(({geo:U,mat:z})=>{let G=new Si(U,z,D);return G.castShadow=!0,G.receiveShadow=!0,G.count=0,G.frustumCulled=!1,n.add(G),G});return{...S,meshes:L,cap:D}}),m=[],x=[],c=1e9,g=1e9,_=new pe,M=new Ye,v=new sn,R=new H,w=new H;function y(S,D){m.length=0,x.length=0;for(let L of d)L.n=0;for(let L=S-ta;L<=S+ta;L++)for(let U=D-ta;U<=D+ta;U++){let z=ci(L*73856093^U*19349663^t.length*83492791);d.forEach((G,N)=>{let q=Math.floor(G.density+z());for(;q-- >0&&!(G.n>=G.cap);){let Y=(L+z())*dl,W=(U+z())*dl;if(G.clear&&Y*Y+W*W<G.clear*G.clear){z();continue}let $=G.scale[0]+z()*(G.scale[1]-G.scale[0]),X=z()*Ni,j=(G.tilt||0)*(z()-.5)*2,it=G.float?1.2+z()*2.2:0;v.set(j,X,j*.5),M.setFromEuler(v),R.set(Y,it,W),w.set($,$,$),_.compose(R,M,w);for(let vt of G.meshes)vt.setMatrixAt(G.n,_);if(G.float&&x.push({t:G,idx:G.n,x:Y,y:it,z:W,q:M.clone(),s:$,ph:z()*Ni}),G.emit)for(let vt of G.emit)m.push({x:Y,y:it+vt.y*$,z:W,kind:vt.kind,size:vt.size*$,color:vt.color,ph:z()*Ni});G.n++}})}for(let L of d)for(let U of L.meshes)U.count=L.n,U.instanceMatrix.needsUpdate=!0}return{group:n,mood:e,emitters:m,sun:u,update(S,D,L){l.position.set(S,0,D);for(let G of[s.map,s.bump,s.emissive])G&&G.offset.set(S/Xc,-D/Xc);u.position.set(S+14,34,D+10),u.target.position.set(S,0,D),p.position.set(S-8,10,D-22),p.target.position.set(S,1,D);let U=Math.floor(S/dl),z=Math.floor(D/dl);if((U!==c||z!==g)&&(c=U,g=z,y(U,z)),x.length){let G=new Set;for(let N of x){R.set(N.x,N.y+Math.sin(L*.8+N.ph)*.35,N.z),w.set(N.s,N.s,N.s),_.compose(R,N.q,w);for(let q of N.t.meshes)q.setMatrixAt(N.idx,_);G.add(N.t)}for(let N of G)for(let q of N.meshes)q.instanceMatrix.needsUpdate=!0}},setShadows(S){for(let D of d)for(let L of D.meshes)L.castShadow=S},dispose(){i.remove(n),l.geometry.dispose(),o.dispose();for(let S of[s.map,s.bump,s.emissive])S&&S.dispose();for(let S of d)for(let D of S.meshes)D.dispose()}}}var Dt=1/20,Xe=Math.PI*2,re=(i,t)=>i+Math.random()*(t-i),qc=new H(0,18.5,11.5),Sd=420,fl=class{constructor(t){this.canvas=t;let e=this.gl=new tl({canvas:t,antialias:!1,powerPreference:"high-performance",stencil:!1});e.toneMapping=Ji,e.toneMappingExposure=1,e.shadowMap.enabled=!0,e.shadowMap.type=qi,this.scene=new ir,this.camera=new nn(40,1,.5,200),this.composer=new rl(e),this.composer.addPass(new al(this.scene,this.camera)),this.bloom=new Os(new ft(512,512),.62,.42,.88),this.composer.addPass(this.bloom),this.composer.addPass(new ol),this.touch="ontouchstart"in window&&Math.min(screen.width,screen.height)<900,this.quality=2,this.fpsAcc=0,this.fpsN=0,this.fpsT=0;let n=hd();this.add=new ji(14e3,n,{additive:!0,renderOrder:20}),this.norm=new ji(3e3,n,{additive:!1,renderOrder:15}),this.gAdd=new ji(2500,n,{additive:!0,ground:!0,renderOrder:5}),this.gNorm=new ji(1500,n,{additive:!1,ground:!0,renderOrder:4});for(let r of[this.add,this.norm,this.gAdd,this.gNorm])this.scene.add(r.mesh);this.playerLight=new As("#b88cff",30,16,2),this.scene.add(this.playerLight),this.lights=[];for(let r=0;r<6;r++){let a=new As("#ffffff",0,14,2);this.scene.add(a),this.lights.push(a)}this.lightCand=[],this.hero=yd(),this.scene.add(this.hero.root),this.heroYaw=0;let s=(r,a,o)=>{let l=new Si(r,a,o);return l.count=0,l.frustumCulled=!1,this.scene.add(l),l};this.shardIM=s(zs.shard(),gt("#bff8ff",{emi:"#5ae0ff",ei:3,rough:.1}),500),this.bladeIM=s(zs.crescent(),gt("#ff2040",{emi:"#ff1030",ei:3,rough:.3,metal:.4}),24),this.gemIM=[s(zs.gem(),gt("#7ab8ff",{emi:"#3a8aff",ei:3,rough:.2}),600),s(zs.gem(),gt("#7dffb8",{emi:"#30ff90",ei:3,rough:.2}),300),s(zs.gem(),gt("#ff9bff",{emi:"#ff50ff",ei:3.5,rough:.2}),200)],this.pickMeshes=new Map,this.holeMeshes=new Map,this.enemyTypes=new Map,this.fxp=[],this.motes=[],this.world=null,this.worldKind=null,this.boss=null,this.bossObj=null,this.bossDie=0,this.camPos=new H,this.camTarget=new H,this.time=0,this.m4=new pe,this.m4b=new pe,this.q=new Ye,this.e=new sn,this.v=new H,this.s=new H,this.col=new Yt,this.st={ph:0,t:0,atk:0,seed:0,mv:1},this.footprint={W:1280,H:760},this.applyQuality(),this.resize()}reset(){this.fxp.length=0,this.bossObj&&this.scene.remove(this.bossObj.root),this.bossObj=null,this.boss=null;for(let t of this.pickMeshes.values())this.scene.remove(t);for(let t of this.holeMeshes.values())this.scene.remove(t);this.pickMeshes.clear(),this.holeMeshes.clear()}applyQuality(){let t=this.quality,e=window.devicePixelRatio||1;this.gl.setPixelRatio(t===2?Math.min(e,1.5):t===1?Math.min(e,1):.75),this.gl.shadowMap.enabled=t>0,this.enemyShadows=t===2&&!this.touch;for(let n of this.enemyTypes.values())for(let s of n.meshes)s.im.castShadow=this.enemyShadows;this.world&&this.world.setShadows(t>0),this.world&&this.world.sun.shadow.mapSize.set(t===2?2048:1024,t===2?2048:1024),this.resize()}resize(){let t=window.innerWidth,e=window.innerHeight;this.W=t,this.H=e,this.gl.setSize(t,e,!1),this.canvas.style.width=t+"px",this.canvas.style.height=e+"px",this.composer.setPixelRatio(this.gl.getPixelRatio()),this.composer.setSize(t,e),this.bloom.resolution.set(t/2,e/2),this.camera.aspect=t/e;let n=Math.max(1,1.1/(t/e));this.camK=Math.min(1.42,n),this.camera.updateProjectionMatrix()}setWorld(t){this.worldKind!==t&&(this.world&&this.world.dispose(),this.world=Md(this.scene,t),this.worldKind=t,this.world.setShadows(this.quality>0),this.motes.length=0)}computeFootprint(t,e){let n=new Lr,s=[];for(let[o,l]of[[-1,-1],[1,-1],[-1,1],[1,1]]){n.setFromCamera(new ft(o,l),this.camera);let h=n.ray.direction,u=n.ray.origin,f=h.y<-.001?-u.y/h.y:80;s.push([u.x+h.x*f,u.z+h.z*f])}let r=0,a=0;for(let[o,l]of s)r=Math.max(r,Math.abs(o-t)),a=Math.max(a,Math.abs(l-e));return this.footprint.W=Math.min(r*2,110)/Dt,this.footprint.H=Math.min(a*2,90)/Dt,this.footprint}project(t,e,n,s){return this.v.set(t,e,n).project(this.camera),s.x=(this.v.x*.5+.5)*this.W,s.y=(-this.v.y*.5+.5)*this.H,s.vis=this.v.z<1,s}light(t,e,n,s,r){this.lightCand.push({x:t,y:e,z:n,color:s,intensity:r})}emit(t,e,n,s,r,a,o,l,h,u=_t.GLOW,f={}){this.fxp.length>2500||this.fxp.push({x:t,y:e,z:n,vx:s,vy:r,vz:a,life:o,max:o,size:l,c:Rn(h),cell:u,grav:f.grav||0,add:f.add!==!1,grow:f.grow||0,rot:f.rot??Math.random()*Xe,spin:f.spin||0,a:f.a??1})}burst(t,e,n,s,r,a=4,o=.25,l=.6){for(let h=0;h<r;h++){let u=Math.random()*Xe,f=Math.random()*.8+.2,p=a*Math.random();this.emit(t,e,n,Math.cos(u)*p,f*a*.8,Math.sin(u)*p,l*re(.5,1),o*re(.6,1.3),s,_t.DOT,{grav:9})}}enemyType(t){let e=this.enemyTypes.get(t);if(e)return e;let n=_d(t),s=n.parts.map(r=>{let a=new Si(r.geo,r.mat,Sd);return a.count=0,a.frustumCulled=!1,a.castShadow=this.enemyShadows,a.receiveShadow=!1,a.setColorAt(0,new Yt(1,1,1)),this.scene.add(a),{im:a,p:r}});return e={model:n,meshes:s,n:0},this.enemyTypes.set(t,e),e}drawEnemy(t,e,n){let s=this.enemyType(t.type);if(s.n>=Sd)return;let r=s.n++,a=t.x*Dt,o=t.y*Dt;t._lx===void 0&&(t._lx=t.x,t._ly=t.y,t._ph=Math.random()*Xe,t._yaw=0);let l=Math.hypot(t.x-t._lx,t.y-t._ly);t._lx=t.x,t._ly=t.y,!n&&!(t.frozen>0)&&(t._ph+=l*.16);let h=this.run.p.x,u=this.run.p.y,p=Math.atan2(h-t.x,u-t.y)-t._yaw;for(;p>Math.PI;)p-=Xe;for(;p<-Math.PI;)p+=Xe;t._yaw+=p*Math.min(1,e*8),t.atk=Math.max(0,(t.atk||0)-e);let d=this.st;d.ph=t._ph,d.t=this.time,d.seed=t.seed||0,d.atk=t.atk>0?Math.sin(t.atk/.35*Math.PI):0,d.mv=t.frozen>0?0:Math.min(1,l*2+.2),t.frozen>0?d.t=t._ft||(t._ft=this.time):t._ft=0;let m=t.elite?1.6:1,x=s.model.float?.25+Math.sin(this.time*2+(t.seed||0))*.12:0,c=0;if(n){let R=n.t/.45;m*=1-R*.7,x-=R*.6,c=R*1.2}this.e.set(c,t._yaw,0),this.q.setFromEuler(this.e),this.v.set(a,x,o),this.s.set(m,m,m);let g=this.m4.compose(this.v,this.q,this.s),_=this.col;n?_.setRGB(.35,.12,.45):t.flash>0?_.setRGB(7,7,7):t.frozen>0?_.setRGB(.7,1.4,2):t.burnT>0?_.setRGB(1.7,.8+Math.sin(this.time*20)*.15,.45):t.elite?_.setRGB(1.35,1.1,.7):t.slowT>0?_.setRGB(.85,1.1,1.4):_.setRGB(1,1,1);for(let{im:R,p:w}of s.meshes){let y=xd(w.ch,w.k,d);this.e.set(y.rx,y.ry,y.rz),this.q.setFromEuler(this.e),this.v.set(w.pv[0],w.pv[1]+y.dy,w.pv[2]),this.s.set(y.s,y.s,y.s),this.m4b.compose(this.v,this.q,this.s).premultiply(g),R.setMatrixAt(r,this.m4b),R.setColorAt(r,_)}let M=(t.r||12)*Dt;if(this.enemyShadows||this.gNorm.add(a,.02,o,M*2.6,M*2.6,1,1,1,.75,0,_t.SHADOW),n)return;let v=s.model.h*m;t.elite&&(this.gAdd.add(a,.04,o,M*3.2,M*3.2,1.6,1.15,.4,.8,this.time*1.5,_t.RUNE),this.add.add(a,v*.5,o,v*1.4,v*1.4,1,.75,.25,.25,0,_t.GLOW)),t.burnT>0&&Math.random()<.5&&this.emit(a+re(-M,M)*.6,v*re(.3,.9),o+re(-M,M)*.6,0,1.6,0,.45,M*1.2,"#ff7a2a",_t.FLAME,{grow:-.5}),t.frozen>0&&this.add.add(a,v*.5,o,v*1.1,v*1.1,.4,.9,1.3,.35,0,_t.STAR),t.atk>0&&t.ranged&&this.add.add(a,v*.75,o+.3,1.2,1.2,...Rn(t.ranged.color),1.2*(t.atk/.35),0,_t.GLOW)}updateBoss(t,e){let n=t.boss;if(n&&this.boss!==n&&(this.bossObj&&this.scene.remove(this.bossObj.root),this.boss=n,this.bossObj=vd(n.bossId),this.scene.add(this.bossObj.root),this.bossDie=0,n._ph=0,n._lx=n.x,n._ly=n.y,n._yaw=0,this.burst(n.x*Dt,1,n.y*Dt,"#b46cff",60,8,.4,1)),!this.bossObj)return;let s=this.bossObj,r=this.boss;if(!n){this.bossDie+=e;let x=this.bossDie/2.2;s.root.scale.setScalar(Math.max(.01,1-x)),s.root.position.y=-x*2,s.root.rotation.z=Math.sin(this.time*30)*.05*(1-x),Math.random()<.8&&this.emit(r.x*Dt+re(-2,2),re(.5,4),r.y*Dt+re(-2,2),0,3,0,1,re(.6,1.4),"#d8b0ff",_t.STAR,{spin:3}),this.light(r.x*Dt,3,r.y*Dt,"#d0a0ff",120*(1-x)),x>=1&&(this.scene.remove(s.root),this.bossObj=null,this.boss=null);return}let a=n.x*Dt,o=n.y*Dt,l=Math.hypot(n.x-n._lx,n.y-n._ly);n._lx=n.x,n._ly=n.y,n._ph+=Math.min(l,30)*.06;let u=(n.ai.mode==="windup"||n.ai.mode==="charge"?Math.atan2(Math.cos(n.ai.dir),Math.sin(n.ai.dir)):Math.atan2(t.p.x-n.x,t.p.y-n.y))-n._yaw;for(;u>Math.PI;)u-=Xe;for(;u<-Math.PI;)u+=Xe;n._yaw+=u*Math.min(1,e*5),n.atk=Math.max(0,(n.atk||0)-e);let f=this.st;f.ph=n._ph,f.t=this.time,f.atk=n.atk>0?Math.sin(n.atk/.4*Math.PI):0,s.root.position.set(a,0,o),s.root.rotation.y=n._yaw;let p=n.flash>0?1.04:1;s.root.scale.setScalar(n.frozen>0?1:p),s.update(this.time,n,e,f);let d=n.r*Dt;this.gAdd.add(a,.05,o,d*4,d*4,.7,.2,1,.4,-this.time*.5,_t.SIGIL),this.gNorm.add(a,.03,o,d*3.5,d*3.5,1,1,1,.9,0,_t.SHADOW),n.flash>0&&this.add.add(a,s.h*.5,o,s.h*1.4,s.h*1.4,1.5,1.2,1.8,.35,0,_t.GLOW);let m={fallen_knight:"#a070ff",devourer:"#b46cff",soulless_king:"#9ad0ff",abyss_lord:"#7fc0ff"}[n.bossId];if(this.light(a,1,o+3.2,m,22+f.atk*40),n.ai.mode==="windup"){let x=n.ai.dir,c=380*Dt;this.gAdd.add(a+Math.cos(x)*c/2,.06,o+Math.sin(x)*c/2,c,d*1.6,2.2,.2,.25,.75,x,_t.STREAK),this.light(a,1,o,"#ff3040",80)}if(n.ai.mode==="charge"&&Math.random()<.9&&this.emit(a+re(-d,d),re(.2,2),o+re(-d,d),0,.5,0,.6,1.2,"#4a2060",_t.SMOKE,{add:!1,grow:1.5,a:.6}),n.bossId==="devourer"||n.bossId==="abyss_lord"&&n.ai.phase>=2){let x=(n.bossId==="devourer"?560:520)*Dt;this.gAdd.add(a,.05,o,x*2,x*2,.35,.15,.55,.35,this.time*.3,_t.RING);for(let c=0;c<2;c++){let g=Math.random()*Xe,_=x*re(.6,1);this.emit(a+Math.cos(g)*_,re(.2,1.5),o+Math.sin(g)*_,-Math.cos(g)*_*.9,0,-Math.sin(g)*_*.9,1,.25,"#c890ff",_t.DOT)}}}render(t,e,n){this.time+=e,this.run=t;let s=this.time;for(let l of[this.add,this.norm,this.gAdd,this.gNorm])l.begin();this.lightCand.length=0;for(let l of this.enemyTypes.values())l.n=0;let r=0,a=0;t?(this.setWorld(t.ch.decor),r=t.p.x*Dt,a=t.p.y*Dt):this.setWorld(n||"ruins"),this.world.update(r,a,s);let o=this.camK||1;if(t){this.camTarget.set(r,.8,a);let l=(t.shake||0)*.025,h=this.zoom||1;this.camera.position.set(r+qc.x*o*h+re(-l,l),qc.y*o*h+re(-l,l),a+qc.z*o*h),this.camera.lookAt(this.camTarget)}else{let l=s*.08;this.camera.position.set(Math.sin(l)*9,5.5,Math.cos(l)*9),this.camera.lookAt(0,1.6,0)}this.camera.updateMatrixWorld(),this.drawHero(t,e),t?this.drawRun(t,e):this.drawMenu(e),this.drawEmitters(r,a),this.drawMotes(r,a,e),this.drawFx(e);for(let l of this.enemyTypes.values())for(let{im:h}of l.meshes)h.count=l.n,l.n&&(h.instanceMatrix.needsUpdate=!0,h.instanceColor.needsUpdate=!0);for(let l of[this.add,this.norm,this.gAdd,this.gNorm])l.end();this.assignLights(r,a),this.composer.render(e),this.adapt(e,!!t)}adapt(t,e){if(e&&(this.fpsT+=t,this.fpsN++,this.fpsT>=3)){let n=this.fpsN/this.fpsT;this.fpsT=0,this.fpsN=0,n<40&&this.quality>0&&(this.quality--,this.applyQuality())}}assignLights(t,e){let n=this.lightCand;for(let s of n){let r=(s.x-t)**2+(s.z-e)**2;s.score=s.intensity/(1+r*.01)}n.sort((s,r)=>r.score-s.score);for(let s=0;s<this.lights.length;s++){let r=this.lights[s],a=n[s];a?(r.position.set(a.x,a.y,a.z),r.color.set(a.color),r.intensity=a.intensity):r.intensity=0}}drawHero(t,e){let n=this.hero,s=t?t.p:{moving:!1,castT:0,heart:0,x:0,y:0},r=s.x*Dt,a=s.y*Dt;n.root.position.set(r,0,a);let o=this.heroYaw;t&&s.moving?o=Math.atan2(Math.cos(s.moveA),Math.sin(s.moveA)):t&&s.castT>0&&s.castA!==void 0?o=Math.atan2(Math.cos(s.castA),Math.sin(s.castA)):t||(o=0);let l=o-this.heroYaw;for(;l>Math.PI;)l-=Xe;for(;l<-Math.PI;)l+=Xe;this.heroYaw+=l*Math.min(1,e*12),n.root.rotation.y=this.heroYaw,n.update(this.time,s,e),n.root.visible=!(t&&s.invuln>0&&s.invuln<5&&Math.floor(this.time*20)%2);let h=Save.data.corruption/100,u=h>.5?"#c060ff":h>.2?"#9a80ff":"#80a8ff";this.playerLight.position.set(r,3.2,a+1.2),this.playerLight.color.set(u),this.playerLight.intensity=16+(s.castT||0)*50;let f=Rn(u),p=Math.min(1,(s.castT||0)/.2);this.gAdd.add(r,.03,a,2.6,2.6,f[0]*1.4,f[1]*1.4,f[2]*1.4,.18+p*.55,this.time*.7,_t.RUNE),s.heart>=100&&this.gAdd.add(r,.04,a,3.6,3.6,1.6,.6,2.2,.45+Math.sin(this.time*6)*.2,-this.time,_t.SIGIL);let d=new H;n.crystal.getWorldPosition(d),this.add.add(d.x,d.y,d.z,.7+p*.5,.7+p*.5,1,.45,1.5,.45,0,_t.GLOW),s.heart>=100&&this.add.add(d.x,d.y,d.z,1.2,1.2,1.2,.5,1.6,.45,this.time,_t.STAR);let m=new H;n.orb.getWorldPosition(m),this.add.add(m.x,m.y,m.z,.45+p*.6,.45+p*.6,1,.45,1.6,.5,0,_t.GLOW),t&&Math.random()<.3&&this.emit(m.x,m.y,m.z,re(-.3,.3),.8,re(-.3,.3),.6,.12,"#d0a0ff",_t.DOT)}drawMenu(){this.light(0,1.2,1.5,"#9a60ff",40);for(let t=0;t<2;t++){let e=Math.random()*Xe,n=re(1,2.6);this.emit(Math.cos(e)*n,.1,Math.sin(e)*n,0,re(.5,1.5),0,1.6,re(.08,.18),"#c890ff",_t.DOT)}this.gAdd.add(0,.03,0,6,6,1,.45,1.6,.6,this.time*.25,_t.SIGIL),this.gAdd.add(0,.04,0,3.4,3.4,1.2,.6,1.8,.5,-this.time*.4,_t.RUNE)}drawEmitters(t,e){for(let n of this.world.emitters){if((n.x-t)**2+(n.z-e)**2>1600)continue;let s=Rn(n.color),r=.8+Math.sin(this.time*9+n.ph)*.12+Math.sin(this.time*23+n.ph)*.08;n.kind==="flame"?(this.add.add(n.x,n.y+n.size*.25,n.z,n.size*.7*r,n.size*1.1*r,s[0]*1.6,s[1]*1.2,s[2]*.8,.8,Math.sin(this.time*3+n.ph)*.1,_t.FLAME),this.add.add(n.x,n.y,n.z,n.size*2.2,n.size*2.2,s[0],s[1]*.7,s[2]*.5,.18,0,_t.GLOW),Math.random()<.08&&this.emit(n.x,n.y+.4,n.z,re(-.2,.2),1.5,re(-.2,.2),1.2,.08,"#ffb060",_t.DOT),this.light(n.x,n.y+.8,n.z,n.color,7*r*n.size)):(this.add.add(n.x,n.y,n.z,n.size*.55*r,n.size*.55*r,s[0],s[1],s[2],.3,0,_t.GLOW),this.light(n.x,n.y+.6,n.z,n.color,3*n.size))}}drawMotes(t,e,n){let s=this.world.mood.motes;for(;this.motes.length<70;)this.motes.push({x:t+re(-22,22),y:re(.2,5),z:e+re(-16,16),ph:Math.random()*Xe,sp:re(.5,1.2)});let r=Rn(s.color),a=_t[s.cell];for(let o of this.motes){o.y+=s.rise*o.sp*n,o.x+=Math.sin(this.time*.5+o.ph)*.3*n,o.y>6&&(o.y=.2),o.y<.1&&(o.y=5),o.x<t-24&&(o.x+=48),o.x>t+24&&(o.x-=48),o.z<e-18&&(o.z+=36),o.z>e+18&&(o.z-=36);let l=.4+Math.sin(this.time*2+o.ph)*.3;this.add.add(o.x,o.y,o.z,s.size,s.size,r[0],r[1],r[2],l,0,a)}}drawFx(t){let e=this.fxp,n=0;for(let s=0;s<e.length;s++){let r=e[s];if(r.life-=t,r.life<=0)continue;r.vy-=r.grav*t,r.x+=r.vx*t,r.y+=r.vy*t,r.z+=r.vz*t,r.y<.05&&r.grav&&(r.y=.05,r.vy*=-.3,r.vx*=.6,r.vz*=.6),r.vx*=.97,r.vz*=.97,r.size=Math.max(.01,r.size+r.grow*t),r.rot+=r.spin*t;let a=r.life/r.max;(r.add?this.add:this.norm).add(r.x,r.y,r.z,r.size,r.size,r.c[0]*1.3,r.c[1]*1.3,r.c[2]*1.3,r.a*Math.min(1,a*2),r.rot,r.cell),e[n++]=r}e.length=n}drawRun(t,e){let n=this.time,s=this.add,r=this.gAdd;this.computeFootprint(t.p.x*Dt,t.p.y*Dt);for(let o of t.enemies)!o.dead&&!o.boss&&this.drawEnemy(o,e,null);t.dying=t.dying.filter(o=>{if(o.e.boss)return!1;if(o.t===0){let l=o.e.x*Dt,h=o.e.y*Dt,u=o.e.color;this.burst(l,.8,h,u,o.e.elite?24:7,4,.22,.6),this.emit(l,.6,h,0,.6,0,.7,o.e.elite?3:1.4,"#20102a",_t.SMOKE,{add:!1,grow:1.2,a:.55}),this.emit(l,1,h,0,2.2,0,.8,.9,"#c8a0ff",_t.GLOW,{grow:-.6}),this.gAdd.add(l,.05,h,1.5,1.5,1,.5,1.4,.4,0,_t.SHOCK)}return o.t+=e,o.t>=.45?!1:(this.drawEnemy(o.e,e,o),!0)}),this.updateBoss(t,e);let a=[0,0,0];for(let o of t.gems){let l=o.val>=10?2:o.val>=3?1:0,h=this.gemIM[l],u=a[l]++;if(u>=h.instanceMatrix.count)continue;let f=[1,1.3,1.8][l];this.e.set(0,n*2.5+o.x,0),this.q.setFromEuler(this.e),this.v.set(o.x*Dt,.35+Math.sin(n*3+o.x)*.08,o.y*Dt),this.s.set(f,f*1.4,f),h.setMatrixAt(u,this.m4.compose(this.v,this.q,this.s));let p=[[.4,.7,1.6],[.4,1.6,.9],[1.6,.6,1.6]][l];s.add(o.x*Dt,.35,o.y*Dt,.7*f,.7*f,p[0],p[1],p[2],.35,0,_t.GLOW)}this.gemIM.forEach((o,l)=>{o.count=a[l],o.instanceMatrix.needsUpdate=!0}),this.drawPickups(t),this.drawSpells(t,e),this.drawEnemyShots(t);for(let o of t.parts){o._h===void 0&&(o._h=re(.3,1.4),o._vy=re(.5,3)),o._h+=o._vy*e,o._vy-=6*e,o._h<.05&&(o._h=.05,o._vy=0);let l=o.life/o.max,h=Rn(o.color);s.add(o.x*Dt,o._h,o.y*Dt,o.size*Dt*3.2,o.size*Dt*3.2,h[0]*1.5,h[1]*1.5,h[2]*1.5,l,0,_t.DOT)}for(let o of t.hazards){if(o.done)continue;let l=o.t/o.delay,h=o.r*Dt*2;r.add(o.x*Dt,.06,o.y*Dt,h,h,2,.4,2.4,.5+l*.5,n*2,_t.RUNE),r.add(o.x*Dt,.07,o.y*Dt,h*l,h*l,1.6,.3,2,.5,0,_t.GLOW)}}drawPickups(t){let e=this.time,n=new Set;for(let s of t.pickups){n.add(s);let r=this.pickMeshes.get(s);if(!r){if(s.kind==="fragment")r=new pt(new yn(.35),gt("#ffe08a",{emi:"#ffb030",ei:3,rough:.2,metal:.6}));else if(s.kind==="heal"){r=new jt,r.add(new pt(new Un(.28,12,10),gt("#ff3050",{emi:"#ff1030",ei:1.5,rough:.15})));let u=new pt(new ii(.08,.1,.25,8),gt("#d8c8b0"));u.position.y=.3,r.add(u)}else r=new pt(new Be(.3,.08,8,16,Math.PI*1.3),gt("#9ad0ff",{emi:"#4a90ff",ei:2.5,metal:.8}));this.scene.add(r),this.pickMeshes.set(s,r)}let a=s.x*Dt,o=s.y*Dt,l=.7+Math.sin(e*3+s.t)*.15;r.position.set(a,l,o),r.rotation.y=e*2;let h=s.kind==="fragment"?[2,1.5,.5]:s.kind==="heal"?[2,.4,.6]:[.6,1.2,2];this.add.add(a,l,o,1.6,1.6,...h,.5,0,_t.GLOW),this.gAdd.add(a,.05,o,1.8,1.8,...h,.6,e,_t.RUNE),s.kind==="fragment"&&(this.add.add(a,3,o,.6,6,2,1.6,.6,.35,0,_t.STREAK,0,1,0),this.light(a,1.5,o,"#ffc060",30))}for(let[s,r]of this.pickMeshes)n.has(s)||(this.scene.remove(r),this.pickMeshes.delete(s))}drawSpells(t,e){let n=this.time,s=this.add,r=this.gAdd,a=this.norm,o=t.p,l=0;for(let d of t.shots){let m=d.x*Dt,x=d.y*Dt,c=Rn(d.color);d._tr||(d._tr=[]),d._tr.push(m,x),d._tr.length>16&&d._tr.splice(0,2);let g=d.vx*Dt,_=d.vy*Dt,M=.9;if(d.kind==="shard")l<500&&(this.e.set(0,Math.atan2(g,_),0),this.q.setFromEuler(this.e),this.v.set(m,M,x),this.s.set(d.r/5,d.r/5,d.r/5),this.shardIM.setMatrixAt(l++,this.m4.compose(this.v,this.q,this.s))),s.add(m,M,x,1.6,.35,c[0]*1.5,c[1]*1.5,c[2]*1.5,.7,0,_t.STREAK,g,0,_),Math.random()<.15&&this.emit(m,M,x,0,-.5,0,.5,.15,"#dffcff",_t.STAR,{spin:4});else if(d.kind==="orb"){let v=d.r*Dt*3;s.add(m,M,x,v*2.2,v*2.2,c[0]*1.6,c[1]*1.2,c[2]*1.8,.9,0,_t.GLOW),a.add(m,M,x,v*.7,v*.7,.02,0,.05,.95,0,_t.DOT);for(let R=0;R<3;R++){let w=n*6+R*Xe/3;s.add(m+Math.cos(w)*v*.6,M+Math.sin(w*.7)*.2,x+Math.sin(w)*v*.6,.25,.25,1.6,.8,2.2,1,0,_t.DOT)}Math.random()<.5&&this.emit(m,M,x,re(-.5,.5),re(-.2,.5),re(-.5,.5),.6,.5,"#7a30d0",_t.SMOKE,{grow:.8,a:.6}),this.light(m,M,x,"#a060ff",20)}else{let v=d.star?.9:.75;s.add(m,M,x,v*1.5,v*1.5,c[0]*1.2,c[1]*1.2,c[2]*1.4,.6,0,_t.GLOW),s.add(m,M,x,v*.8,v*.8,1.6,1.6,1.8,.9,n*8,_t.STAR),s.add(m-g*.03,M,x-_*.03,1.8,.4,c[0]*1.6,c[1]*1.6,c[2]*2,.8,0,_t.STREAK,g,0,_);let R=d._tr;for(let w=0;w<R.length-2;w+=2){let y=w/R.length;s.add(R[w],M,R[w+1],.35*y+.08,.35*y+.08,c[0],c[1],c[2],y*.7,0,_t.DOT)}d.star&&this.light(m,M,x,d.color,6)}}this.shardIM.count=l,this.shardIM.instanceMatrix.needsUpdate=!0;let h=t.weapons.find(d=>d.id==="blood"),u=0;if(h&&h.blades){let d=(h.evo?1.5:1)*o.areaMul;for(let m of h.blades){let x=m.x*Dt,c=m.y*Dt;this.e.set(-Math.PI/2,0,n*14),this.q.setFromEuler(this.e),this.v.set(x,.9,c),this.s.set(d,d,d),this.bladeIM.setMatrixAt(u++,this.m4.compose(this.v,this.q,this.s)),s.add(x,.9,c,1.6*d,1.6*d,1.8,.15,.3,.55,0,_t.GLOW);let g=Math.hypot(m.x-o.x,m.y-o.y)*Dt;for(let _=1;_<=10;_++){let M=m.a-_*.05;s.add(o.x*Dt+Math.cos(M)*g,.9,o.y*Dt+Math.sin(M)*g,(.55-_*.03)*d,(.55-_*.03)*d,1.8,.12,.3,.55-_*.05,0,_t.GLOW)}this.light(x,1,c,"#ff2040",6)}}this.bladeIM.count=u,this.bladeIM.instanceMatrix.needsUpdate=!0;let f=t.weapons.find(d=>d.id==="fire");if(f&&f.evo){let d=95*Dt*o.areaMul;r.add(o.x*Dt,.05,o.y*Dt,d*2.2,d*2.2,1.8,.6,.15,.45+Math.sin(n*8)*.08,n,_t.SIGIL);for(let m=0;m<2;m++){let x=Math.random()*Xe,c=d*re(.4,1);this.emit(o.x*Dt+Math.cos(x)*c,.2,o.y*Dt+Math.sin(x)*c,0,2,0,.5,.7,"#ff7a20",_t.FLAME,{grow:-.8})}this.light(o.x*Dt,1,o.y*Dt,"#ff7020",30)}for(let d of t.rings){let m=1-d.r/d.max,x=d.r*Dt,c=d.x*Dt,g=d.y*Dt,_=Rn(d.color);r.add(c,.07,g,x*2.15,x*2.15,_[0]*2,_[1]*2,_[2]*2,m,0,_t.SHOCK),d.r<d.max*.3&&r.add(c,.06,g,d.max*Dt*1.2,d.max*Dt*1.2,_[0]*1.5,_[1]*1.5,_[2]*1.5,(1-d.r/(d.max*.3))*.8,n,_t.SIGIL);let M=Math.min(90,Math.max(16,x*6|0));for(let v=0;v<M;v++){let R=(v+v*7919%13/13)/M*Xe,w=x*(.92+v*31%7/50),y=c+Math.cos(R)*w,S=g+Math.sin(R)*w,D=.75+Math.sin(n*20+v*1.7)*.25;d.el==="fire"?(s.add(y,.35+D*.25,S,.55*D+.2,.95*D+.3,2,.75,.25,m*.85,Math.sin(v)*.3,_t.FLAME),v%3===0&&Math.random()<.3&&this.emit(y,.4,S,Math.cos(R)*.8,1.5,Math.sin(R)*.8,.5,.1,"#ffb050",_t.DOT)):s.add(y,.5,S,.6,.6,_[0]*2,_[1]*2,_[2]*2,m*.8,R,_t.STAR)}this.light(c,1,g,d.color,70*m)}for(let d of t.lines){let m=Math.min(1,d.life*8),x=Rn(d.color),c,g,_,M=d.x2*Dt,v=.8,R=d.y2*Dt;d.wide?(c=M+re(-1,1),g=16,_=R):(c=d.x1*Dt,g=1.1,_=d.y1*Dt);let w=d.wide?9:6,y=c,S=g,D=_;for(let L=1;L<=w;L++){let U=L/w,z=L===w?0:d.wide?.6:.45,G=c+(M-c)*U+re(-z,z),N=g+(v-g)*U+re(-z,z)*.5,q=_+(R-_)*U+re(-z,z),Y=G-y,W=N-S,$=q-D,X=Math.hypot(Y,W,$),j=(G+y)/2,it=(N+S)/2,vt=(q+D)/2;s.add(j,it,vt,X*1.25,d.wide?.9:.55,x[0]*1.6,x[1]*1.6,x[2]*2.2,m,0,_t.STREAK,Y,W,$),s.add(j,it,vt,X*1.1,d.wide?.25:.14,3,3,3,m,0,_t.STREAK,Y,W,$),y=G,S=N,D=q}s.add(M,v,R,1.6,1.6,x[0]*2,x[1]*2,x[2]*2,m,Math.random()*Xe,_t.STAR),d.wide&&r.add(M,.06,R,3,3,2,2,1.2,m,Math.random()*Xe,_t.CRACK),d._f||(d._f=1,this.burst(M,.8,R,"#fff6a0",4,5,.12,.35)),this.light(M,1.5,R,"#fff2a0",50*m)}for(let d of t.blasts){let m=d.life/d.max,x=d.r*Dt,c=d.x*Dt,g=d.y*Dt,_=Rn(d.color);if(!d._f){d._f=1,this.burst(c,.6,g,d.color,14,x*3,.25,.7);for(let M=0;M<5;M++)this.emit(c+re(-x,x)*.4,.5,g+re(-x,x)*.4,re(-1,1),.8,re(-1,1),.9,x*.8,"#1a0c24",_t.SMOKE,{add:!1,grow:x*.8,a:.5})}s.add(c,.8,g,x*2.4*(1.3-m*.3),x*2.4*(1.3-m*.3),_[0]*1.8,_[1]*1.8,_[2]*1.8,m*.9,0,_t.GLOW),r.add(c,.07,g,x*2.6*(1.2-m*.5),x*2.6*(1.2-m*.5),_[0]*2,_[1]*2,_[2]*2,m,0,_t.SHOCK),this.light(c,1.2,g,d.color,90*m)}let p=new Set;for(let d of t.holes){p.add(d);let m=this.holeMeshes.get(d);m||(m=new pt(new Un(1,20,14),new vi({color:"#000000"})),this.scene.add(m),this.holeMeshes.set(d,m));let x=d.x*Dt,c=d.y*Dt,g=Math.min(1,d.t*3),_=d.r*Dt;m.position.set(x,1,c),m.scale.setScalar(.9*g+Math.sin(n*10)*.05),r.add(x,.06,c,_*2,_*2,1.2,.4,2.2,.7*g,-n*3,_t.SIGIL),s.add(x,1,c,3.6*g,3.6*g,1.4,.5,2.4,.9,n*4,_t.SHOCK),s.add(x,1,c,4.8*g,1.2*g,1.6,.7,2.6,.7,n*2,_t.STREAK,1,0,0);for(let M=0;M<2;M++){let v=Math.random()*Xe,R=_;this.emit(x+Math.cos(v)*R,re(.3,1.8),c+Math.sin(v)*R,-Math.cos(v)*R*1.6,0,-Math.sin(v)*R*1.6,.6,.18,"#d0a0ff",_t.DOT)}this.light(x,1.5,c,"#8040ff",60)}for(let[d,m]of this.holeMeshes)p.has(d)||(this.scene.remove(m),this.holeMeshes.delete(d))}drawEnemyShots(t){let e=this.add,n=this.norm;for(let s of t.eShots){let r=s.x*Dt,a=s.y*Dt,o=Rn(s.color),l=s.r*Dt;e.add(r,.9,a,l*5,l*5,o[0]*1.6,o[1]*1.6,o[2]*1.6,.9,0,_t.GLOW),e.add(r-s.vx*Dt*.04,.9,a-s.vy*Dt*.04,l*6,l*2.2,o[0],o[1],o[2],.6,0,_t.STREAK,s.vx,0,s.vy),n.add(r,.9,a,l*1.6,l*1.6,.05,0,.04,.9,0,_t.DOT)}}};var Bn=Math.PI*2,Ui=1/20,ea=(i,t,e)=>i<t?t:i>e?e:i,pn='Georgia, "Times New Roman", serif',pl=class{constructor(t,e){this.c=t,this.g=t.getContext("2d"),this.R=e,this.pt={x:0,y:0,vis:!0},this.portrait=null,this.resize(),window.addEventListener("resize",()=>this.resize())}resize(){this.dpr=Math.min(window.devicePixelRatio||1,2),this.W=window.innerWidth,this.H=window.innerHeight,this.c.width=this.W*this.dpr,this.c.height=this.H*this.dpr,this.c.style.width=this.W+"px",this.c.style.height=this.H+"px",this.small=Math.min(this.W,this.H)<520}frame(t,e,n,s,r="#b8954a"){let a=this.g;a.fillStyle="rgba(8,5,14,0.82)",a.fillRect(t,e,n,s);let o=a.createLinearGradient(t,e,t,e+s);o.addColorStop(0,"#f0d890"),o.addColorStop(.5,r),o.addColorStop(1,"#5a4320"),a.strokeStyle=o,a.lineWidth=2,a.strokeRect(t+1,e+1,n-2,s-2),a.strokeStyle="rgba(0,0,0,0.8)",a.lineWidth=1,a.strokeRect(t+3.5,e+3.5,n-7,s-7),a.fillStyle=o;for(let[l,h]of[[t,e],[t+n,e],[t,e+s],[t+n,e+s]])a.beginPath(),a.moveTo(l,h-4),a.lineTo(l+4,h),a.lineTo(l,h+4),a.lineTo(l-4,h),a.fill()}bar(t,e,n,s,r,a,o,l){let h=this.g;this.frame(t-3,e-3,n+6,s+6),h.fillStyle="#0a0610",h.fillRect(t,e,n,s);let u=n*ea(r,0,1),f=h.createLinearGradient(0,e,0,e+s);f.addColorStop(0,a),f.addColorStop(1,o),h.fillStyle=f,h.fillRect(t,e,u,s),h.fillStyle="rgba(255,255,255,0.18)",h.fillRect(t,e,u,s*.35),u>4&&(h.fillStyle="rgba(255,255,255,0.7)",h.fillRect(t+u-2,e,2,s)),l&&(h.font=`bold ${Math.max(10,s-3)}px ${pn}`,h.textAlign="center",h.textBaseline="middle",h.lineWidth=3,h.strokeStyle="#000",h.strokeText(l,t+n/2,e+s/2+1),h.fillStyle="#fff",h.fillText(l,t+n/2,e+s/2+1))}drawPortrait(t,e,n,s){let r=this.g,a=Save.data.corruption/100;r.save();let o=r.createRadialGradient(t,e-n*.2,2,t,e,n);o.addColorStop(0,a>.5?"#5a2080":"#3a2a70"),o.addColorStop(1,"#0a0614"),r.fillStyle=o,r.beginPath(),r.arc(t,e,n,0,Bn),r.fill(),r.beginPath(),r.arc(t,e,n-2,0,Bn),r.clip(),r.fillStyle="#2c1650",r.beginPath(),r.moveTo(t-n*.9,e+n),r.quadraticCurveTo(t-n*.7,e+n*.1,t-n*.45,e-n*.05),r.quadraticCurveTo(t-n*.5,e-n*.75,t,e-n*.82),r.quadraticCurveTo(t+n*.5,e-n*.75,t+n*.45,e-n*.05),r.quadraticCurveTo(t+n*.7,e+n*.1,t+n*.9,e+n),r.fill(),r.strokeStyle="#d8b25a",r.lineWidth=2,r.stroke(),r.fillStyle="#05020a",r.beginPath(),r.ellipse(t,e-n*.18,n*.28,n*.34,0,0,Bn),r.fill();let l=a>.5?"#ff8bff":"#c9a8ff";r.shadowColor=l,r.shadowBlur=10,r.fillStyle=l,r.beginPath(),r.ellipse(t-n*.11,e-n*.2,n*.06,n*.035,0,0,Bn),r.ellipse(t+n*.11,e-n*.2,n*.06,n*.035,0,0,Bn),r.fill(),r.restore();let h=r.createLinearGradient(t,e-n,t,e+n);h.addColorStop(0,"#f6e0a0"),h.addColorStop(.5,"#b8954a"),h.addColorStop(1,"#5a4320"),r.strokeStyle=h,r.lineWidth=4,r.beginPath(),r.arc(t,e,n,0,Bn),r.stroke();let u=s.p.heart/100,f=u>=1;r.strokeStyle="#1a0a28",r.lineWidth=5,r.beginPath(),r.arc(t,e,n+6,0,Bn),r.stroke(),r.strokeStyle=f?Math.floor(this.R.time*6)%2?"#ff9bff":"#c070ff":"#8a3cd0",r.shadowColor="#b46cff",r.shadowBlur=f?16:6,r.beginPath(),r.arc(t,e,n+6,-Math.PI/2,-Math.PI/2+Bn*u),r.stroke(),r.shadowBlur=0;let p=t+n*.72,d=e+n*.72;r.fillStyle="#120a1e",r.beginPath();for(let m=0;m<6;m++){let x=m*Bn/6+Math.PI/6;r.lineTo(p+Math.cos(x)*15,d+Math.sin(x)*15)}r.closePath(),r.fill(),r.strokeStyle=h,r.lineWidth=2,r.stroke(),r.font=`bold 14px ${pn}`,r.textAlign="center",r.textBaseline="middle",r.fillStyle="#ffe9b0",r.fillText(s.p.lvl,p,d+1)}slot(t,e,n,s,r,a,o){let l=this.g;this.frame(t,e,n,n,o?"#ffd86b":"#8a7040"),l.drawImage(Icons.canvas(s,64),t+4,e+4,n-8,n-8),r&&(l.font=`bold 11px ${pn}`,l.textAlign="right",l.textBaseline="alphabetic",l.lineWidth=3,l.strokeStyle="#000",l.strokeText(r,t+n-4,e+n-4),l.fillStyle=o?"#ffd86b":"#fff",l.fillText(r,t+n-4,e+n-4))}draw(t,e){let n=this.g,s=this.W,r=this.H,a=this.R.time;if(n.setTransform(this.dpr,0,0,this.dpr,0,0),n.clearRect(0,0,s,r),!t)return;let o=t.p,l=this.R,h=this.pt;n.textAlign="center",n.textBaseline="middle";for(let $ of t.texts){if(l.project($.x*Ui,1.8+(.8-$.life)*1.2,$.y*Ui,h),!h.vis)continue;let X=.8-$.life,j=X<.1?1+(.1-X)*5:1,it=$.size>=16,vt=($.size+(it?6:3))*j;n.globalAlpha=Math.min(1,$.life*2.5),n.font=`bold ${vt|0}px ${pn}`,n.lineWidth=4,n.strokeStyle="rgba(0,0,0,0.9)",n.strokeText($.txt,h.x,h.y);let Bt=$.color;Bt==="#ffffff"&&it&&(Bt="#ffe08a"),n.fillStyle=Bt,n.fillText($.txt,h.x,h.y)}n.globalAlpha=1;for(let $ of t.enemies){if(!$.elite||$.dead||(l.project($.x*Ui,3.6,$.y*Ui,h),!h.vis))continue;let X=64;n.fillStyle="rgba(0,0,0,0.75)",n.fillRect(h.x-X/2-1,h.y-1,X+2,7),n.fillStyle="#ffd86b",n.fillRect(h.x-X/2,h.y,X*ea($.hp/$.maxHp,0,1),5),n.font=`italic 11px ${pn}`,n.fillStyle="#ffe9b0",n.textAlign="center",n.fillText("\u041D\u043E\u0441\u0438\u0442\u0435\u043B\u044C \u043F\u0430\u043C\u044F\u0442\u0438",h.x,h.y-9)}if(l.project(o.x*Ui,2.55,o.y*Ui,h),n.fillStyle="rgba(0,0,0,0.7)",n.fillRect(h.x-23,h.y-1,46,6),n.fillStyle=o.hp/o.maxHp<.3?"#ff3b5c":"#e8445a",n.fillRect(h.x-22,h.y,44*ea(o.hp/o.maxHp,0,1),4),o.hp/o.maxHp<.3){let $=.25+Math.sin(a*6)*.1,X=n.createRadialGradient(s/2,r/2,Math.min(s,r)*.35,s/2,r/2,Math.max(s,r)*.7);X.addColorStop(0,"rgba(120,0,20,0)"),X.addColorStop(1,`rgba(140,0,20,${$})`),n.fillStyle=X,n.fillRect(0,0,s,r)}let u=this.small,f=u?30:42,p=18+f,d=r-22-f;this.drawPortrait(p,d,f,t);let m=p+f+18,x=Math.min(u?150:260,s-m-20);this.bar(m,d-(u?18:24),x,u?13:17,o.hp/o.maxHp,"#ff5a6a","#8a1024",Math.ceil(o.hp)+" / "+Math.round(o.maxHp)),this.bar(m,d+(u?3:5),x*.85,u?7:9,o.heart/100,"#d080ff","#5a1a9a"),n.font=`italic ${u?10:12}px ${pn}`,n.textAlign="left",n.textBaseline="alphabetic";let c=o.heart>=100;n.fillStyle=c?"#ffd6ff":"#a890c8",n.fillText(c?u?"\u0421\u0435\u0440\u0434\u0446\u0435 \u0433\u043E\u0442\u043E\u0432\u043E \u2014 \u2726":"\u0421\u0435\u0440\u0434\u0446\u0435 \u042D\u0444\u0438\u0440\u0430 \u0433\u043E\u0442\u043E\u0432\u043E \u2014 \u041F\u0420\u041E\u0411\u0415\u041B":"\u0421\u0435\u0440\u0434\u0446\u0435 \u042D\u0444\u0438\u0440\u0430",m,d+(u?24:30)),this.frame(0,0,s,10);let g=n.createLinearGradient(0,0,s,0);g.addColorStop(0,"#3a6aff"),g.addColorStop(1,"#9ad0ff"),n.fillStyle=g,n.fillRect(4,3,(s-8)*ea(o.xp/o.xpNext,0,1),4);let _=u?34:46,M=6,v=DATA.rules.weaponSlots,R=v*(_+M)-M,w=u?12:(s-R)/2,y=u?r-2*f-44-_:r-_-14;for(let $=0;$<v;$++){let X=t.weapons[$];X?this.slot(w,y,_,(X.evo?"evo_":"")+X.id,X.evo?"\u2605":String(X.lvl),DATA.weapons[X.id].color,X.evo):this.frame(w,y,_,_,"#4a3a20"),w+=_+M}let S=u?24:30,D=Object.keys(t.passives),L=u?12:(s-R)/2,U=y-S-8;for(let $ of D)this.slot(L,U,S,$,String(t.passives[$]),"#d8c8ff",!1),L+=S+4;if(t.spec&&!u){let $=DATA.specs[t.spec];n.font=`bold ${u?11:13}px ${pn}`,n.textAlign="left",n.fillStyle=$.color,n.shadowColor=$.color,n.shadowBlur=8,n.fillText($.name,L+6,U+S*.7),n.shadowBlur=0}let z=u?120:150,G=s-z-12,N=18;this.frame(G,N,z,u?58:66);let q=Math.floor(t.time),Y=String(Math.floor(q/60)).padStart(2,"0"),W=String(q%60).padStart(2,"0");if(n.font=`bold ${u?22:26}px ${pn}`,n.textAlign="center",n.fillStyle="#fff3d0",n.textBaseline="alphabetic",n.fillText(Y+":"+W,G+z/2,N+(u?26:30)),n.font=`${u?10:12}px ${pn}`,n.fillStyle="#e0d0ff",n.textAlign="left",n.fillText("\u0423\u0431\u0438\u0442\u043E "+t.kills,G+10,N+(u?46:54)),n.fillStyle="#c890ff",n.textAlign="right",n.fillText("\u041F\u043E\u0440\u0447\u0430 "+Math.round(Save.data.corruption)+"%",G+z-10,N+(u?46:54)),t.bossSpawned||(n.font=`italic ${u?10:12}px ${pn}`,n.textAlign="center",n.fillStyle="#a898c0",n.fillText("\u0421\u0442\u0440\u0430\u0436 \u0447\u0435\u0440\u0435\u0437 "+Math.ceil(DATA.rules.bossTime-t.time)+" \u0441",G+z/2,N+(u?74:84))),t.boss){let $=t.boss,X=DATA.bosses[$.bossId],j=Math.min(600,s-(u?40:360)),it=(s-j)/2,vt=u?96:40;if(n.font=`bold ${u?15:20}px ${pn}`,n.textAlign="center",n.textBaseline="alphabetic",n.shadowColor="#ff2a4a",n.shadowBlur=12,n.fillStyle="#ffe0e0",n.fillText(X.name,s/2,vt-6),n.shadowBlur=0,this.bar(it,vt,j,u?10:14,$.hp/$.maxHp,"#ff3a5a","#600818"),n.font=`italic ${u?10:12}px ${pn}`,n.fillStyle="#c8a8b8",n.fillText(X.title,s/2,vt+(u?26:32)),l.project($.x*Ui,1,$.y*Ui,h),h.x<0||h.x>s||h.y<0||h.y>r){let Bt=Math.atan2(h.y-r/2,h.x-s/2),nt=Math.min(s,r)/2-50;n.save(),n.translate(s/2+Math.cos(Bt)*nt,r/2+Math.sin(Bt)*nt),n.rotate(Bt),n.fillStyle="#ff4a5a",n.shadowColor="#ff0030",n.shadowBlur=12,n.beginPath(),n.moveTo(18,0),n.lineTo(-10,-12),n.lineTo(-4,0),n.lineTo(-10,12),n.fill(),n.restore()}}if(t.banner){let $=t.banner,X=ea(Math.min(1,$.t,($.max-$.t)*3),0,1);n.globalAlpha=X;let j=r*.27,it=n.createLinearGradient(s/2-260,0,s/2+260,0);it.addColorStop(0,"rgba(216,178,90,0)"),it.addColorStop(.5,"rgba(216,178,90,0.9)"),it.addColorStop(1,"rgba(216,178,90,0)"),n.fillStyle=it,n.fillRect(s/2-260,j+16,520,1.5),n.fillRect(s/2-260,j-44,520,1.5),n.textAlign="center",n.textBaseline="alphabetic",n.font=`bold ${u?26:38}px ${pn}`,n.shadowColor="#9b5cff",n.shadowBlur=20,n.fillStyle="#f4e8ff",n.fillText($.title,s/2,j),n.shadowBlur=0,n.font=`italic ${u?13:17}px ${pn}`,n.fillStyle="#d8c8f0",n.fillText($.sub,s/2,j+40),n.globalAlpha=1}e&&e.active&&(n.globalAlpha=.35,n.strokeStyle="#d8b25a",n.lineWidth=2,n.beginPath(),n.arc(e.ox,e.oy,50,0,Bn),n.stroke(),n.fillStyle="#b46cff",n.beginPath(),n.arc(e.ox+e.dx*50,e.oy+e.dy*50,20,0,Bn),n.fill(),n.globalAlpha=1)}};Save.data||Save.load();var Td=document.getElementById("game"),Je=rh(Td),Cn=null,Ed=null;try{Cn=new fl(Td),Ed=new pl(document.getElementById("hud"),Cn),window.addEventListener("resize",()=>Cn.resize())}catch(i){console.error(i);let t=document.createElement("div");t.className="webgl-error",t.textContent="\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C WebGL. \u041E\u0431\u043D\u043E\u0432\u0438 \u0431\u0440\u0430\u0443\u0437\u0435\u0440 \u0438\u043B\u0438 \u0432\u043A\u043B\u044E\u0447\u0438 \u0430\u043F\u043F\u0430\u0440\u0430\u0442\u043D\u043E\u0435 \u0443\u0441\u043A\u043E\u0440\u0435\u043D\u0438\u0435.",document.body.appendChild(t)}var wd="ruins",bd=0;function Ad(i){let t=Math.min(.05,(i-bd)/1e3||0);bd=i;let e=Je.run,n=e&&!e.paused;n&&(Je.setView(Cn.footprint.W,Cn.footprint.H),Je.update(t)),Cn&&(Cn.render(Je.run,e?n?t:0:t,wd),Ed.draw(Je.run,Je.joy)),requestAnimationFrame(Ad)}requestAnimationFrame(Ad);window.Game={start(i){Cn&&Cn.reset(),Je.start(i)},quit(){Je.quit(),Cn&&Cn.reset()},useHeart:()=>Je.useHeart(),applyChoice:i=>Je.applyChoice(i),reroll:()=>Je.reroll(),get rerolls(){return Je.rerolls},setPaused:i=>Je.setPaused(i),get running(){return Je.running},get run(){return Je.run},setMenuScene(i){wd=i},setView:(i,t)=>Je.setView(i,t),get renderer(){return Cn},debug:Je.debug};})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
