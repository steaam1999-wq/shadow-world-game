(()=>{var De=Math.PI*2,ch={W:1280,H:760},Ce=(s,t)=>{window.Sound&&window.Sound.play(s,t)};function hh(s){let t=1280,e=760,n=(x,P)=>x+Math.random()*(P-x),i=(x,P,N)=>x<P?P:x>N?N:x,r=(x,P,N,D)=>{let V=x-N,ut=P-D;return V*V+ut*ut},a=x=>x[Math.random()*x.length|0],o={},l={active:!1,id:null,ox:0,oy:0,dx:0,dy:0};window.addEventListener("keydown",x=>{o[x.code]=!0,c&&((x.code==="Space"||x.code==="KeyE")&&(O(),x.preventDefault()),(x.code==="Escape"||x.code==="KeyP")&&UI.togglePause&&UI.togglePause())}),window.addEventListener("keyup",x=>{o[x.code]=!1}),window.addEventListener("blur",()=>{for(let x in o)o[x]=!1;c&&!c.paused&&!c.over&&UI.togglePause(!0)}),s.addEventListener("touchstart",x=>{for(let P of x.changedTouches)l.active||(l.active=!0,l.id=P.identifier,l.ox=P.clientX,l.oy=P.clientY,l.dx=l.dy=0);x.preventDefault()},{passive:!1}),s.addEventListener("touchmove",x=>{for(let P of x.changedTouches)if(P.identifier===l.id){let N=P.clientX-l.ox,D=P.clientY-l.oy,V=Math.hypot(N,D),ut=50;V>ut&&(l.ox+=N-N/V*ut,l.oy+=D-D/V*ut,N=N/V*ut,D=D/V*ut),l.dx=N/ut,l.dy=D/ut}x.preventDefault()},{passive:!1});let h=x=>{for(let P of x.changedTouches)P.identifier===l.id&&(l.active=!1,l.dx=l.dy=0)};s.addEventListener("touchend",h),s.addEventListener("touchcancel",h);let u=72,f=new Map,p=[];function d(x,P){return(x+32768)*65536+(P+32768)}function m(){f.clear();for(let x of c.enemies){if(x.dead)continue;let P=d(Math.floor(x.x/u),Math.floor(x.y/u)),N=f.get(P);N||(N=[],f.set(P,N)),N.push(x)}}function _(x,P,N,D=p){D.length=0;let V=Math.floor((x-N-30)/u),ut=Math.floor((x+N+30)/u),at=Math.floor((P-N-30)/u),T=Math.floor((P+N+30)/u);for(let b=V;b<=ut;b++)for(let v=at;v<=T;v++){let L=f.get(d(b,v));if(L)for(let Z of L){if(Z.dead)continue;let J=N+Z.r;r(x,P,Z.x,Z.y)<=J*J&&D.push(Z)}}return D}let c=null;function g(){let x=P=>Save.meta(P);return{x:0,y:0,r:13,face:1,walk:0,baseHp:100+x("vitality")*10,hp:0,maxHp:0,lvl:1,xp:0,xpNext:y(1),invuln:0,heart:0,regenAcc:0,dmgMul:1,cdMul:1,areaMul:1,amount:0,speed:150,magnet:70,regen:0,rerolls:x("insight")}}function y(x){return Math.floor(3+x*2.2+x*x*.16)}function w(x){let P=DATA.chapters[x];c={ch:P,chId:x,time:0,kills:0,paused:!1,over:!1,p:g(),weapons:[],passives:{},spec:null,enemies:[],shots:[],eShots:[],gems:[],pickups:[],rings:[],lines:[],blasts:[],parts:[],texts:[],hazards:[],holes:[],dying:[],props:[],propBreaks:[],rifts:[],evDone:0,propT:0,buffT:0,spawnAcc:0,boss:null,bossSpawned:!1,victoryT:-1,elitesDone:0,tidesDone:0,fragmentsFound:[],shake:0,flash:0,flashColor:"#b46cff",heartUses:0,bladeAngle:0,auraTick:0,banner:null,levelQueue:0},M("bolt"),C(),c.p.hp=c.p.maxHp,S(P.roman+". "+P.name,"\u0412\u044B\u0436\u0438\u0432\u0438 \u0434\u043E \u043F\u0440\u0438\u0445\u043E\u0434\u0430 \u0441\u0442\u0440\u0430\u0436\u0430")}function S(x,P,N=3){c.banner={title:x,sub:P,t:N,max:N}}function C(){let x=c.p,P=c.passives,N=D=>P[D]||0;x.maxHp=x.baseHp+N("heart")*20,x.regen=N("heart")*.4,x.dmgMul=(1+N("tome")*.1)*(1+Save.meta("power")*.06),x.cdMul=Math.pow(.93,N("crystal")),x.areaMul=1+N("rune")*.1,x.amount=(N("eye")>=2?1:0)+(N("eye")>=4?1:0),x.speed=150*(1+N("boots")*.08)*(1+Save.meta("haste")*.05),x.magnet=90*(1+N("magnet")*.3)*(1+Save.meta("reach")*.15),c.spec==="storm"&&(x.speed*=1.15,x.cdMul*=.9),x.hp=Math.min(x.hp,x.maxHp)}function R(x){return c.weapons.find(P=>P.id===x)}function M(x){let P=R(x);if(P){P.lvl=Math.min(5,P.lvl+1);return}c.weapons.push({id:x,lvl:1,evo:!1,cd:.3,cd2:0,angle:0})}function E(x=3){let P=[],N=c.spec?DATA.specs[c.spec].weapon:null;for(let T of c.weapons){let b=DATA.weapons[T.id];T.lvl>=5&&!T.evo&&c.passives[b.evo.needs]&&P.push({type:"evo",id:T.id,w:100,icon:b.icon,color:"#ffd86b",title:"\u2727 "+b.evo.name,desc:"\u042D\u0412\u041E\u041B\u042E\u0426\u0418\u042F: "+b.evo.desc,tag:"\u042D\u0432\u043E\u043B\u044E\u0446\u0438\u044F"})}let D=DATA.rules.weaponSlots-c.weapons.length;for(let T in DATA.weapons){let b=DATA.weapons[T],v=R(T);if(v&&v.lvl>=5||!v&&c.weapons.length>=DATA.rules.weaponSlots)continue;let L=v?v.lvl+1:1,Z=DATA.passives[b.evo.needs],J=!!c.passives[b.evo.needs];P.push({type:"weapon",id:T,w:(T===N?3:1)*(v?1.6+(D<=1?.6:0):1),icon:b.icon,color:b.color,title:b.name,desc:v?b.lvlDesc[v.lvl]:b.desc,tag:v?"\u0423\u0440. "+L:"\u041D\u043E\u0432\u043E\u0435 \u0437\u0430\u043A\u043B\u0438\u043D\u0430\u043D\u0438\u0435",lvl:v?v.lvl:0,next:L,max:5,hint:"\u042D\u0432\u043E\u043B\u044E\u0446\u0438\u044F \u2192 "+b.evo.name+": 5 \u0443\u0440. + "+Z.name+(J?" \u2713":""),ready:L>=5&&J})}for(let T in DATA.passives){let b=DATA.passives[T],v=c.passives[T]||0;if(v>=5||!v&&Object.keys(c.passives).length>=DATA.rules.passiveSlots)continue;let L=Object.keys(DATA.weapons).find(J=>DATA.weapons[J].evo.needs===T&&R(J)),Z=Object.keys(DATA.weapons).find(J=>DATA.weapons[J].evo.needs===T);P.push({type:"passive",id:T,w:L?v?1.2:2.2:1,icon:b.icon,color:"#d8c8ff",title:b.name,desc:b.desc,tag:v?"\u0423\u0440. "+(v+1):"\u0410\u0440\u0442\u0435\u0444\u0430\u043A\u0442",lvl:v,next:v+1,max:5,hint:Z?"\u041A\u043B\u044E\u0447 \u044D\u0432\u043E\u043B\u044E\u0446\u0438\u0438: "+DATA.weapons[Z].name+(L?" (\u0437\u0430\u043A\u043B\u0438\u043D\u0430\u043D\u0438\u0435 \u0443\u0436\u0435 \u0435\u0441\u0442\u044C)":""):"\u041E\u0431\u0449\u0435\u0435 \u0443\u0441\u0438\u043B\u0435\u043D\u0438\u0435",ready:!!L&&!v&&R(L).lvl>=5})}let V=[],ut=P.filter(T=>T.type==="evo");ut.length&&V.push(ut[0]);let at=P.filter(T=>T.type!=="evo");for(;V.length<x&&at.length;){let T=at.reduce((L,Z)=>L+Z.w,0),b=Math.random()*T,v=0;for(;v<at.length&&(b-=at[v].w,!(b<=0));v++);v=Math.min(v,at.length-1),V.push(at[v]),at.splice(v,1)}if(V.length>=x&&!V.some(T=>T.type==="weapon"&&T.lvl>0)){let T=at.filter(b=>b.type==="weapon"&&b.lvl>0);T.length&&(V[V.length-1]=a(T))}return V.length||V.push({type:"heal",id:"heal",icon:"\u271A",color:"#7dffa8",title:"\u042D\u0444\u0438\u0440\u043D\u044B\u0439 \u044D\u043B\u0438\u043A\u0441\u0438\u0440",desc:"\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C 40% \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u044F \u0438 +10 \u042D\u0444\u0438\u0440\u0430.",tag:"\u0414\u0430\u0440"}),V}function U(){return Object.keys(DATA.specs).map(x=>{let P=DATA.specs[x];return{type:"spec",id:x,icon:P.icon,color:P.color,title:P.name,desc:P.desc,tag:"\u041C\u0430\u0433\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0448\u043A\u043E\u043B\u0430"}})}function I(x){let P=c.p;if(x.type==="weapon")M(x.id);else if(x.type==="passive")c.passives[x.id]=(c.passives[x.id]||0)+1,x.id==="heart"&&(P.hp+=20),x.id==="eye"&&Save.addCorruption(1);else if(x.type==="evo"){let N=R(x.id);N.evo=!0,S("\u042D\u0432\u043E\u043B\u044E\u0446\u0438\u044F!",DATA.weapons[x.id].evo.name,2.5),c.flash=.6,c.flashColor="#ffd86b"}else if(x.type==="spec"){c.spec=x.id;let N=DATA.specs[x.id];R(N.weapon)?M(N.weapon):c.weapons.length>=DATA.rules.weaponSlots?c.weapons[c.weapons.length-1]={id:N.weapon,lvl:1,evo:!1,cd:.3,cd2:0,angle:0}:M(N.weapon),x.id==="void"&&Save.addCorruption(8),S(N.name,"\u0422\u0432\u043E\u044F \u043C\u0430\u0433\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0448\u043A\u043E\u043B\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u0430",2.5),c.flash=.6,c.flashColor=N.color}else x.type==="heal"&&(P.hp=Math.min(P.maxHp,P.hp+P.maxHp*.4),c.bonusEther=(c.bonusEther||0)+10);C()}function O(){if(!c||c.paused||c.over)return;let x=c.p;if(x.heart<100)return;x.heart=0,c.heartUses++,Ce("heart"),Save.addCorruption(2);let P=Math.max(t,e)*.75,N=_(x.x,x.y,P,[]);for(let D of N)if(q(D,(D.boss?220:160)*x.dmgMul*(c.spec==="void"?1.4:1),"void",!0),!D.boss){let V=Math.atan2(D.y-x.y,D.x-x.x);D.kx=Math.cos(V)*400,D.ky=Math.sin(V)*400}c.eShots.length=0,x.invuln=Math.max(x.invuln,1.5),c.flash=.8,c.flashColor="#b46cff",c.shake=14,c.rings.push({x:x.x,y:x.y,r:10,max:P,speed:1600,dmg:0,hit:null,color:"#c78bff",visual:!0,width:18}),B(x.x,x.y-40,"\u0421\u0415\u0420\u0414\u0426\u0415 \u042D\u0424\u0418\u0420\u0410","#e0b8ff",22),UI.onHeartUsed&&UI.onHeartUsed()}function B(x,P,N,D,V=14){c.texts.length>70||c.texts.push({x,y:P,txt:N,color:D,size:V,life:.8})}function H(x,P,N,D,V=120,ut=.5,at=3){c.parts.length>700&&(D=Math.min(D,2));for(let T=0;T<D;T++){let b=Math.random()*De,v=Math.random()*V;c.parts.push({x,y:P,vx:Math.cos(b)*v,vy:Math.sin(b)*v,life:ut*n(.5,1),max:ut,color:N,size:at*n(.6,1.2)})}}let F={bolt:"arcane",lightning:"storm",fire:"fire",frost:"frost",blood:"blood",void:"void"};function q(x,P,N,D){if(x.dead)return;let V=c.spec;V&&V===N&&(P*=V==="void"?1.4:1.5),V==="fire"&&N!=="burn"&&(x.burnT=2.5,x.burnDps=Math.max(x.burnDps||0,P*.25)),V==="frost"&&(x.slowT=Math.max(x.slowT||0,1),x.slow=Math.max(x.slow||0,.3));let ut=!1;N!=="burn"&&Math.random()<.06&&(P*=2,ut=!0),c.buffT>0&&(P*=1.5),x.hp-=P,x.flash=.08,N!=="burn"&&Ce("hit"),c.dealt=(c.dealt||0)+P,ut&&!D?B(x.x+n(-6,6),x.y-x.r-6,Math.round(P)+"!","#ffd04a",18):!D&&(P>=8||Math.random()<.3)&&B(x.x+n(-6,6),x.y-x.r-4,Math.round(P),N==="burn"?"#ffa860":"#ffffff",P>60?16:12),x.hp<=0&&Y(x)}function Y(x){x.dead=!0,Ce("death"),c.dying.length<120&&c.dying.push({e:x,t:0}),c.kills++;let P=c.p;if(H(x.x,x.y,x.color,x.boss?80:x.elite?30:7,x.boss?320:140,.6,x.boss?5:3),c.spec==="blood"&&(P.hp=Math.min(P.maxHp,P.hp+1)),x.bladeKill){let N=R("blood");N&&(P.hp=Math.min(P.maxHp,P.hp+(N.evo?1.2:.4)))}if(x.boss){$(x);return}X(x.x,x.y,x.xp),x.champion&&Math.random()<.5&&c.pickups.push({x:x.x,y:x.y,kind:"heal",t:0}),x.elite?(c.pickups.push({x:x.x,y:x.y,kind:"fragment",t:0}),c.pickups.push({x:x.x+20,y:x.y,kind:"heal",t:0}),c.shake=Math.max(c.shake,6)):Math.random()<.004&&c.pickups.push({x:x.x,y:x.y,kind:Math.random()<.5?"magnet":"heal",t:0})}function X(x,P,N){if(c.gems.length>450){let D=c.gems[Math.random()*c.gems.length|0];D.val+=N;return}c.gems.push({x:x+n(-4,4),y:P+n(-4,4),val:N,mag:!1})}function $(x){c.boss=null,c.victoryT=3,c.shake=20,c.flash=1,c.flashColor="#ffffff";for(let P of c.gems)P.mag=!0;c.pickups.push({x:x.x,y:x.y,kind:"fragment",t:0});for(let P of c.enemies)P.dead||(P.dead=!0,H(P.x,P.y,P.color,4));c.eShots.length=0,c.hazards.length=0,S("\u0421\u0442\u0440\u0430\u0436 \u043F\u043E\u0432\u0435\u0440\u0436\u0435\u043D",DATA.bosses[x.bossId].name,3)}function W(x=60){let P=Math.random()*De,N=Math.hypot(t,e)/2+x;return[c.p.x+Math.cos(P)*N,c.p.y+Math.sin(P)*N]}function j(x,P,N,D=!1){let V=DATA.enemies[x],ut=c.time,at=c.ch.hpMul*(1+ut/140)*(1+c.chId*.12*ut/240)*(D?14:1),T={type:x,x:P,y:N,r:V.r*(D?1.6:1),hp:V.hp*at,maxHp:V.hp*at,speed:V.speed*(D?.85:1)*n(.9,1.1),dmg:V.dmg*(1+c.chId*.12)*(1+ut/400)*(D?1.5:1),color:V.color,shape:V.shape,xp:V.xp*(D?25:1),ranged:V.ranged||null,shootCd:V.ranged?n(1,V.ranged.cd):0,elite:D,seed:Math.random()*10,slowT:0,slow:0,burnT:0,burnDps:0,frozen:0,flash:0,kx:0,ky:0,hits:{},bh:V.behavior||null,bcd:n(.5,2.5),st:null,stT:0};return c.enemies.push(T),T}function nt(x){let P=c.time;if(c.victoryT>=0)return;let N=(.9+P*.032)*(1+c.chId*.1);c.boss&&(N*=.35),c.spawnAcc+=N*x;let D=c.ch.enemies,V=[6,P>35?3:0,P>95?1.6:0],ut=V[0]+V[1]+V[2],at=0;for(let L of c.enemies)L.ranged&&!L.dead&&at++;for(;c.spawnAcc>=1;){if(c.spawnAcc--,c.enemies.length>=DATA.rules.maxEnemies){c.spawnAcc=0;break}let L=Math.random()*ut,Z=0;for(;L>V[Z];)L-=V[Z],Z++;let J=D[Math.min(Z,2)];DATA.enemies[J].ranged&&at>22&&(J=D[0]),c.chId===3&&Math.random()<.15&&(J=a(["ghost","wolf","skeleton","deadmage"]));let[ct,mt]=W();j(J,ct,mt)}let T=DATA.rules.eliteTimes;if(c.elitesDone<T.length&&P>=T[c.elitesDone]){c.elitesDone++;let[L,Z]=W(20);j(D[Math.min(c.elitesDone-1,2)],L,Z,!0),S("\u041D\u043E\u0441\u0438\u0442\u0435\u043B\u044C \u043F\u0430\u043C\u044F\u0442\u0438","\u0423\u0431\u0435\u0439 \u044D\u043B\u0438\u0442\u043D\u043E\u0433\u043E \u0432\u0440\u0430\u0433\u0430, \u0447\u0442\u043E\u0431\u044B \u0443\u0437\u043D\u0430\u0442\u044C \u043F\u0440\u0430\u0432\u0434\u0443",2.2)}let b=DATA.rules.tideTimes;if(c.tidesDone<b.length&&P>=b[c.tidesDone]){c.tidesDone++;let L=34+c.chId*6,Z=Math.max(t,e)*.55;for(let J=0;J<L;J++){let ct=J/L*De;j(D[0],c.p.x+Math.cos(ct)*Z,c.p.y+Math.sin(ct)*Z)}S("\u041F\u0440\u0438\u043B\u0438\u0432 \u0411\u0435\u0437\u0434\u043D\u044B","\u041E\u043D\u0438 \u043E\u043A\u0440\u0443\u0436\u0430\u044E\u0442 \u0442\u0435\u0431\u044F",2)}let v=DATA.rules.events;c.evDone<v.length&&P>=v[c.evDone].t&&(c.boss||vt(v[c.evDone].kind),c.evDone++);for(let L of c.rifts)for(L.t+=x,L.acc+=x;L.acc>=.42&&L.t<L.life;)L.acc-=.42,c.enemies.length<DATA.rules.maxEnemies+40&&j(D[Math.random()<.7?0:1],L.x+n(-30,30),L.y+n(-30,30));c.rifts=c.rifts.filter(L=>L.t<L.life+1),!c.bossSpawned&&P>=DATA.rules.bossTime&&(c.bossSpawned=!0,Nt())}function vt(x){Ce("event");let P=c.ch.enemies,N=c.p;if(x==="rush"){let D=Math.random()*De,V=Math.hypot(t,e)/2+40,ut=16+c.chId*4;for(let at=0;at<ut;at++){let T=D+n(-.35,.35),b=V+n(0,160),v=j(P[0],N.x+Math.cos(T)*b,N.y+Math.sin(T)*b);v.rush=!0}c.eventDir=D,c.eventDirT=3,S("\u041D\u0430\u0442\u0438\u0441\u043A","\u041E\u0440\u0434\u0430 \u0438\u0434\u0451\u0442 \u0441 \u043E\u0434\u043D\u043E\u0439 \u0441\u0442\u043E\u0440\u043E\u043D\u044B",2)}else if(x==="ambush"){let D=P.find(ut=>DATA.enemies[ut].ranged)||"deadmage",V=6+c.chId;for(let ut=0;ut<V;ut++){let at=ut/V*De+n(-.2,.2);j(D,N.x+Math.cos(at)*330,N.y+Math.sin(at)*330)}S("\u0417\u0430\u0441\u0430\u0434\u0430","\u0421\u0442\u0440\u0435\u043B\u043A\u0438 \u043E\u043A\u0440\u0443\u0436\u0438\u043B\u0438 \u0442\u0435\u0431\u044F",2)}else if(x==="rift"){let D=Math.random()*De;c.rifts.push({x:N.x+Math.cos(D)*280,y:N.y+Math.sin(D)*280,t:0,life:10,acc:0}),S("\u0420\u0430\u0437\u043B\u043E\u043C \u0411\u0435\u0437\u0434\u043D\u044B","\u0418\u0437 \u0442\u0440\u0435\u0449\u0438\u043D\u044B \u043B\u0435\u0437\u0443\u0442 \u0442\u0432\u0430\u0440\u0438 \u2014 \u043D\u0435 \u0441\u0442\u043E\u0439 \u0440\u044F\u0434\u043E\u043C",2)}else if(x==="pack"){let D=Math.random()*De,V=3+(c.chId>1?1:0);for(let ut=0;ut<V;ut++){let at=D+(ut-V/2)*.3,T=Math.hypot(t,e)/2+30,b=j(P[2],N.x+Math.cos(at)*T,N.y+Math.sin(at)*T);b.hp*=3.5,b.maxHp*=3.5,b.r*=1.25,b.xp*=5,b.champion=!0}S("\u0421\u0442\u0430\u044F \u0447\u0435\u043C\u043F\u0438\u043E\u043D\u043E\u0432","\u0421\u0438\u043B\u044C\u043D\u044B\u0435 \u0442\u0432\u0430\u0440\u0438 \u2014 \u0441 \u043D\u0438\u0445 \u043F\u0430\u0434\u0430\u0435\u0442 \u0431\u043E\u043B\u044C\u0448\u0435 \u044D\u0444\u0438\u0440\u0430",2)}}function zt(x){let P=c.p;if(c.propT-=x,c.propT<=0){c.propT=6,c.props=c.props.filter(D=>r(D.x,D.y,P.x,P.y)<1700*1700);let N=0;for(let D of c.props)r(D.x,D.y,P.x,P.y)<900*900&&N++;if(N<4){let D=Math.random()*De,V=n(320,720);c.props.push({x:P.x+Math.cos(D)*V,y:P.y+Math.sin(D)*V,seed:Math.random()*10})}}for(let N of c.props)!N.dead&&r(N.x,N.y,P.x,P.y)<(P.r+18)**2&&Rt(N);c.props=c.props.filter(N=>!N.dead);for(let N of c.propBreaks)N.t+=x;c.propBreaks=c.propBreaks.filter(N=>N.t<1.2)}function st(x,P,N){for(let D of c.props)!D.dead&&r(D.x,D.y,x,P)<(N+16)**2&&Rt(D)}function Rt(x){if(x.dead)return;x.dead=!0,Ce("crack"),c.propBreaks.push({x:x.x,y:x.y,t:0,seed:x.seed}),H(x.x,x.y,"#c8b088",12,160,.6,3);let P=Math.random();if(P<.55){let N=3+(Math.random()*3|0);for(let D=0;D<N;D++)X(x.x+n(-18,18),x.y+n(-18,18),1+(Math.random()*2|0))}else P<.75?c.pickups.push({x:x.x,y:x.y,kind:"heal",t:0}):P<.85?c.pickups.push({x:x.x,y:x.y,kind:"magnet",t:0}):P<.95?c.pickups.push({x:x.x,y:x.y,kind:"power",t:0}):(c.bonusEther=(c.bonusEther||0)+15,B(x.x,x.y-20,"+15 \u042D\u0444\u0438\u0440\u0430","#c9a8ff",15))}function Nt(){let x=c.ch.boss,P=DATA.bosses[x],[N,D]=W(-80),V={type:x,bossId:x,boss:!0,x:N,y:D,r:P.r,hp:P.hp,maxHp:P.hp,speed:P.speed,dmg:P.dmg,color:P.color,shape:P.shape,xp:0,slowT:0,slow:0,burnT:0,burnDps:0,frozen:0,flash:0,kx:0,ky:0,hits:{},seed:0,ai:{t:0,a:0,b:0,c:0,d:0,mode:"walk",mt:0,spin:0,vx:0,vy:0,tx:0,ty:0}};c.enemies.push(V),c.boss=V,c.shake=10,Ce("roar"),UI.onBoss&&UI.onBoss(P)}function kt(x,P,N,D,V,ut,at=6){c.boss&&x===c.boss.x&&P===c.boss.y&&(c.boss.atk=.4),Ce("eshot"),c.eShots.push({x,y:P,vx:Math.cos(N)*D,vy:Math.sin(N)*D,dmg:V,color:ut,r:at,life:6})}function wt(x,P,N,D,V,ut){for(let at=0;at<P;at++)kt(x.x,x.y,D+at/P*De,N,x.dmg*.6,V,ut)}function Ut(x,P,N,D,V,ut){Ce("warn"),c.hazards.push({x,y:P,r:N,t:0,delay:D,dmg:V,color:ut,done:!1})}function we(x,P){let N=c.p,D=x.ai;D.t+=P,D.a-=P,D.b-=P,D.c-=P,D.d-=P;let V=Math.atan2(N.y-x.y,N.x-x.x),ut=x.hp/x.maxHp,at=ut<.5,T=!0,b=x.speed;if(at&&!D.p2&&x.bossId!=="abyss_lord"){D.p2=!0;let v={fallen_knight:["\u041A\u043B\u044F\u0442\u0432\u0430 \u043D\u0430\u0440\u0443\u0448\u0435\u043D\u0430","\u041A\u0430\u0434\u043C\u043E\u043D \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u0434\u0435\u0440\u0436\u0438\u0442 \u0441\u0442\u0440\u043E\u0439"],devourer:["\u0413\u043E\u043B\u043E\u0434 \u0431\u0435\u0437 \u0434\u043D\u0430","\u041A\u043E\u0440\u043D\u0438 \u043B\u0435\u0441\u0430 \u0442\u044F\u043D\u0443\u0442\u0441\u044F \u043A \u0442\u0435\u0431\u0435"],soulless_king:["\u041A\u043E\u0440\u043E\u043D\u0430 \u0432 \u043E\u0433\u043D\u0435","\u041A\u043E\u0440\u043E\u043B\u044C \u043F\u0440\u0438\u0437\u044B\u0432\u0430\u0435\u0442 \u0434\u043E\u0436\u0434\u044C \u043F\u0440\u043E\u043A\u043B\u044F\u0442\u0438\u0439"]}[x.bossId];S(v[0],v[1],2.2),Ce("phase"),c.shake=16,wt(x,24,190,0,"#ff8a7a",8),x.speed*=1.15}switch(D.mode==="windup"?(T=!1,D.mt-=P,D.mt<=0&&(D.mode="charge",D.mt=.65,D.vx=Math.cos(D.dir)*560,D.vy=Math.sin(D.dir)*560)):D.mode==="charge"&&(T=!1,D.mt-=P,x.x+=D.vx*P,x.y+=D.vy*P,Math.random()<.6&&H(x.x,x.y,"#ff5a5a",1,40,.4),D.p2&&x.bossId==="fallen_knight"&&(D.trail=(D.trail||0)-P,D.trail<=0&&(D.trail=.07,Ut(x.x,x.y,42,.55,x.dmg*.7,"#ff5030"))),D.mt<=0&&(D.mode="walk",(x.bossId==="fallen_knight"||x.bossId==="abyss_lord")&&wt(x,at?14:10,170,D.t,"#ff7a7a",7))),x.bossId){case"fallen_knight":{if(D.mode==="walk"&&D.a<=0&&(D.a=at?3:4.2,D.mode="windup",D.mt=.75,D.dir=V),D.b<=0&&D.mode==="walk"){D.b=at?2.4:3.4;let v=at?9:7;for(let L=0;L<v;L++)kt(x.x,x.y,V+(L-(v-1)/2)*.16,230,x.dmg*.6,"#ffd0d0",7)}break}case"devourer":{if(b*=.9,Math.sqrt(r(x.x,x.y,N.x,N.y))<560){let L=(at?95:75)*P;N.x-=Math.cos(V)*L,N.y-=Math.sin(V)*L}if(D.a<=0){D.a=2.6;for(let L=-2;L<=2;L++)kt(x.x,x.y,V+L*.22,190,x.dmg*.55,"#a6ff5a",9)}if(D.b<=0){D.b=8;for(let L=0;L<6;L++){let Z=L/6*De;j("wolf",x.x+Math.cos(Z)*80,x.y+Math.sin(Z)*80)}}if(at&&D.c<=0&&(D.c=3.5,wt(x,22,150,D.t,"#7dff7a",8)),D.p2&&D.d<=0){D.d=3.2,Ut(N.x,N.y,70,1,x.dmg,"#7dff5a");for(let L=0;L<6;L++){let Z=L/6*De+D.t;Ut(N.x+Math.cos(Z)*125,N.y+Math.sin(Z)*125,55,1.15,x.dmg*.8,"#7dff5a")}}break}case"soulless_king":{if(D.a<=0&&(D.a=at?2.5:3.5,wt(x,18,160,D.t*.7,"#ffe27a",7)),D.b<=0){D.b=7,H(x.x,x.y,"#ffe27a",30,200);let v=Math.random()*De;x.x=N.x+Math.cos(v)*260,x.y=N.y+Math.sin(v)*260,H(x.x,x.y,"#ffe27a",30,200),D.a=Math.min(D.a,.6)}if(D.c<=0){D.c=9;for(let v=0;v<4;v++){let L=v/4*De+.7;j("deadmage",x.x+Math.cos(L)*90,x.y+Math.sin(L)*90)}}D.p2&&(D.rain=(D.rain||0)-P,D.rain<=0&&(D.rain=2.6,Ut(N.x,N.y,75,1,x.dmg,"#ffd060"),Ut(N.x+n(-140,140),N.y+n(-140,140),75,1.15,x.dmg,"#ffd060"),Ut(N.x+n(-140,140),N.y+n(-140,140),75,1.3,x.dmg,"#ffd060"))),at&&(D.spin+=P,D.d<=0&&(D.d=.16,kt(x.x,x.y,D.spin*2.2,180,x.dmg*.5,"#fff0a0",6),kt(x.x,x.y,D.spin*2.2+Math.PI,180,x.dmg*.5,"#fff0a0",6)));break}case"abyss_lord":{let v=ut>.66?1:ut>.33?2:3;if(v!==D.phase&&(D.phase=v,v>1&&(Ce("phase"),S("\u0424\u0430\u0437\u0430 "+v,v===2?"\u0411\u0435\u0437\u0434\u043D\u0430 \u043F\u0440\u043E\u0431\u0443\u0436\u0434\u0430\u0435\u0442\u0441\u044F":"\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0432\u0437\u0434\u043E\u0445 \u0412\u043B\u0430\u0434\u044B\u043A\u0438",2),c.shake=15,wt(x,30,200,0,"#e08bff",8))),D.spin+=P,D.d<=0){D.d=v===3?.09:.14;let L=v===1?2:3;for(let Z=0;Z<L;Z++)kt(x.x,x.y,D.spin*1.7+Z*De/L,170,x.dmg*.45,"#d68bff",6)}if(D.mode==="walk"&&D.a<=0&&(D.a=v===3?3.5:5.5,D.mode="windup",D.mt=.7,D.dir=V),v>=2){if(D.b<=0){D.b=6;for(let Z=0;Z<5;Z++){let[J,ct]=[x.x+n(-120,120),x.y+n(-120,120)];j("spawn",J,ct)}}if(Math.sqrt(r(x.x,x.y,N.x,N.y))<520){let Z=40*P;N.x-=Math.cos(V)*Z,N.y-=Math.sin(V)*Z}}v===3&&D.c<=0&&(D.c=2.2,Ut(N.x,N.y,85,1,x.dmg*1.1,"#b46cff"),Ut(N.x+n(-160,160),N.y+n(-160,160),85,1.2,x.dmg*1.1,"#b46cff"));break}}T&&D.mode==="walk"&&Math.sqrt(r(x.x,x.y,N.x,N.y))>x.r+N.r&&(x.x+=Math.cos(V)*b*P,x.y+=Math.sin(V)*b*P),D.mode==="walk"&&(x.face=Math.cos(V)>=0?1:-1)}function Vt(x,P,N=700,D){let V=null,ut=N*N;for(let at of c.enemies){if(at.dead||D&&D.has(at))continue;let T=r(x,P,at.x,at.y);T<ut&&(ut=T,V=at)}return V}function ee(){let x=c.p,P=[];for(let N of c.enemies)!N.dead&&Math.abs(N.x-x.x)<t/2&&Math.abs(N.y-x.y)<e/2&&P.push(N);return P.length?a(P):null}function ne(x){Ce(x.kind==="shard"?"shard":x.kind==="orb"?"orb":"bolt"),c.p.castT=.3,c.p.castA=Math.atan2(x.vy,x.vx),c.shots.push(Object.assign({pierce:1,life:2,r:6,hit:new Set,homing:0,kind:"bolt",slow:0},x))}function lt(x,P,N,D){Ce("zap"),c.p.castT=.3,c.p.castA=Math.atan2(x.y-c.p.y,x.x-c.p.x);let V=x,ut=c.p.x,at=c.p.y-10,T=new Set;for(let b=0;b<=N&&V;b++){T.add(V),c.lines.push({x1:ut,y1:at,x2:V.x,y2:V.y,life:.18,color:"#fff27a"}),H(V.x,V.y,"#fff7b0",3,90,.3,2),ut=V.x,at=V.y;let v=Vt(V.x,V.y,D,T);q(V,P,"storm"),V=v}}function Mt(x){let P=c.p;for(let N of c.weapons){N.cd-=x;let D=N.lvl,V=P.amount,ut=P.dmgMul,at=P.cdMul,T=P.areaMul;switch(N.id){case"bolt":{if(N.cd>0)break;if(N.evo){N.cd=.55*at;let b=5+V;for(let v=0;v<b;v++){let L=Math.random()*De;ne({x:P.x,y:P.y,vx:Math.cos(L)*380,vy:Math.sin(L)*380,dmg:34*ut,pierce:3,homing:6,color:"#cfe8ff",r:7*T,el:"arcane",life:2.2,star:!0})}}else{let b=Vt(P.x,P.y,650);if(!b){N.cd=.1;break}N.cd=(.8-(D>=3?.12:0))*at;let v=1+(D>=2?1:0)+(D>=4?1:0)+V,L=Math.atan2(b.y-P.y,b.x-P.x);for(let Z=0;Z<v;Z++){let J=L+(Z-(v-1)/2)*.12;ne({x:P.x,y:P.y,vx:Math.cos(J)*460,vy:Math.sin(J)*460,dmg:(14+(D>=3?6:0)+(D>=5?8:0))*ut,pierce:1+(D>=4?1:0)+(D>=5?1:0),color:"#9ad0ff",r:6*T,el:"arcane",life:1.6})}}break}case"lightning":{if(N.cd>0)break;if(N.evo){N.cd=.55*at;for(let b=0;b<3+V;b++){let v=ee();if(!v)break;Ce("zap"),c.lines.push({x1:v.x+n(-40,40),y1:v.y-500,x2:v.x,y2:v.y,life:.2,color:"#fffbd0",wide:!0});for(let L of _(v.x,v.y,60*T,[]))q(L,40*ut,"storm");c.blasts.push({x:v.x,y:v.y,r:60*T,life:.2,max:.2,color:"#fff27a"}),lt(v,26*ut,4,150)}}else{let b=Vt(P.x,P.y,500);if(!b){N.cd=.1;break}N.cd=(1.7-(D>=3?.3:0)-(D>=5?.3:0))*at;let v=2+(D>=2?1:0)+(D>=4?1:0)+(D>=5?2:0)+V;lt(b,(16+(D>=2?6:0)+(D>=4?8:0))*ut,v,150*T)}break}case"fire":{if(N.evo&&(c.auraTick-=x,c.auraTick<=0)){c.auraTick=.25;for(let v of _(P.x,P.y,95*T,[]))q(v,7*ut,"fire",!0),v.burnT=2,v.burnDps=Math.max(v.burnDps,12*ut)}if(N.cd>0)break;let b=(N.evo?260:110+(D>=2?25:0)+(D>=4?30:0))*T;N.cd=(N.evo?1.6:3-(D>=3?.5:0)-(D>=5?.5:0))*at,Ce("nova"),c.rings.push({x:P.x,y:P.y,r:8,max:b,speed:b*2.6,dmg:(N.evo?45:18+(D>=2?6:0)+(D>=4?8:0)+(D>=5?8:0))*ut,hit:new Set,color:"#ff8a3c",el:"fire",burn:(N.evo?18:4+D*2)*ut,width:10});break}case"frost":{if(N.evo&&(N.cd2-=x,N.cd2<=0)){N.cd2=4.5*at;let L=420*T;for(let Z of _(P.x,P.y,L,[]))Z.frozen=Z.boss?.6:2.2,q(Z,40*ut,"frost");c.rings.push({x:P.x,y:P.y,r:10,max:L,speed:1400,dmg:0,hit:null,color:"#bff8ff",visual:!0,width:14}),c.flash=.25,c.flashColor="#bff8ff",Ce("freeze")}if(N.cd>0)break;N.cd=(N.evo?.9:1.4-(D>=4?.3:0))*at;let b=(N.evo?16:3+(D>=2?1:0)+(D>=3?1:0)+(D>=4?1:0)+(D>=5?2:0))+V,v=Math.random()*De;for(let L=0;L<b;L++){let Z=v+L/b*De;ne({x:P.x,y:P.y,vx:Math.cos(Z)*340,vy:Math.sin(Z)*340,dmg:(N.evo?26:9+(D>=2?4:0)+(D>=5?6:0))*ut,pierce:(D>=3?2:1)+(N.evo?2:0),color:"#9ff4ff",r:5*T,el:"frost",slow:.45,life:1.1,kind:"shard"})}break}case"blood":{let b=(N.evo?6:2+(D>=3?1:0)+(D>=5?1:0))+V,v=(N.evo?115:72+(D>=4?18:0))*T,L=(N.evo?32:10+(D>=2?5:0)+(D>=4?6:0)+(D>=5?6:0))*ut;N.angle+=x*(N.evo?3.6:3),N.blades=[];for(let Z=0;Z<b;Z++){let J=N.angle+Z/b*De,ct=P.x+Math.cos(J)*v,mt=P.y+Math.sin(J)*v;N.blades.push({x:ct,y:mt,a:J});for(let et of _(ct,mt,(N.evo?18:12)*T)){let rt=et.hits.blood||-9;c.time-rt<.35||(et.hits.blood=c.time,et.bladeKill=!0,q(et,L,"blood"),Ce("blade"),et.dead||(et.bladeKill=!1),N.evo&&(P.hp=Math.min(P.maxHp,P.hp+L*.01)),H(et.x,et.y,"#ff3b5c",2,80,.3))}}break}case"void":{if(N.cd>0)break;if(N.evo){N.cd=4*at;let b=ee()||Vt(P.x,P.y,800),v=b?b.x:P.x+n(-200,200),L=b?b.y:P.y+n(-200,200);c.holes.push({x:v,y:L,t:0,life:3,r:210*T,dmg:22*ut,tick:0,final:140*ut});for(let Z=1;Z<=V;Z++)c.holes.push({x:v+n(-250,250),y:L+n(-250,250),t:0,life:3,r:170*T,dmg:18*ut,tick:0,final:110*ut})}else{N.cd=(2.6-(D>=5?.6:0))*at;let b=1+(D>=3?1:0)+(D>=5?1:0)+V;for(let v=0;v<b;v++){let L=ee()||Vt(P.x,P.y,700),Z=L?Math.atan2(L.y-P.y,L.x-P.x)+n(-.2,.2):Math.random()*De;ne({x:P.x,y:P.y,vx:Math.cos(Z)*170,vy:Math.sin(Z)*170,dmg:(34+(D>=2?12:0)+(D>=4?16:0))*ut,pierce:1,color:"#b46cff",r:10*T,el:"void",life:1.5,kind:"orb",blast:(75+(D>=2?15:0)+(D>=4?20:0))*T})}}break}}}}function _t(x,P,N,D,V,ut){Ce("boom"),st(x,P,N);for(let at of _(x,P,N,[]))q(at,D,V);c.blasts.push({x,y:P,r:N,life:.3,max:.3,color:ut}),H(x,P,ut,14,N*2,.45,3),c.shake=Math.max(c.shake,3)}function Dt(x){let P=c.p;P.invuln>0||c.victoryT>=0||(P.hp-=x,P.invuln=.5,Ce("hurt"),c.shake=Math.max(c.shake,7),c.flash=Math.max(c.flash,.25),c.flashColor="#ff2040",B(P.x,P.y-26,"-"+Math.round(x),"#ff6a7a",15),P.hp<=0&&(P.hp=0,le(!1)))}function Et(x){let P=c.p;c.time+=x;let N=0,D=0;(o.KeyW||o.ArrowUp)&&(D-=1),(o.KeyS||o.ArrowDown)&&(D+=1),(o.KeyA||o.ArrowLeft)&&(N-=1),(o.KeyD||o.ArrowRight)&&(N+=1),l.active&&(N+=l.dx,D+=l.dy);let V=Math.hypot(N,D);if(V>0){let T=Math.min(1,V)/V;P.x+=N*T*P.speed*x,P.y+=D*T*P.speed*x,Math.abs(N)>.1&&(P.face=N>0?1:-1),P.moveA=Math.atan2(D,N),P.walk+=x*10,P.moving=!0}else P.moving=!1;P.invuln-=x,P.castT=Math.max(0,(P.castT||0)-x),P.regen>0&&(P.hp=Math.min(P.maxHp,P.hp+P.regen*x)),m(),nt(x),zt(x),c.buffT>0&&(c.buffT-=x),c.eventDirT>0&&(c.eventDirT-=x),Mt(x);let ut=[];for(let T of c.enemies){if(T.dead||(T.flash-=x,T.burnT>0&&(T.burnT-=x,T.burnAcc=(T.burnAcc||0)+x,T.burnAcc>=.5&&(T.burnAcc=0,q(T,T.burnDps*.5,"burn"),T.dead))))continue;if(T.frozen>0)T.frozen-=x;else if(T.boss)we(T,x);else{let v=T.speed*(T.rush?1.45:1);T.slowT>0&&(T.slowT-=x,v*=1-T.slow);let L=P.x-T.x,Z=P.y-T.y,J=Math.hypot(L,Z)||1;T.face=L>=0?1:-1,T.bcd>0&&(T.bcd-=x);let ct=!0;if(T.st==="wind"){if(ct=!1,T.stT-=x,T.stT<=0)if(T.bh==="lunge"){T.st="dash",T.stT=.3;let et=Math.max(320,T.speed*3.8);T.dvx=Math.cos(T.ta)*et,T.dvy=Math.sin(T.ta)*et}else if(T.bh==="bomb"){T.st=null,Y(T);continue}else T.st=null,T.atk=.35,c.shake=Math.max(c.shake,3)}else T.st==="dash"?(ct=!1,T.stT-=x,T.x+=T.dvx*x,T.y+=T.dvy*x,T.stT<=0&&(T.st=null)):T.bh&&T.bcd<=0&&(T.bh==="lunge"&&J<200&&J>45?(T.st="wind",T.stT=.42,T.ta=Math.atan2(Z,L),T.bcd=n(2.6,4.2),ct=!1):T.bh==="slam"&&J<T.r+85?(T.st="wind",T.stT=.8,T.bcd=n(3.5,5),Ut(T.x,T.y,55+T.r*1.6,.8,T.dmg*1.3,"#ff6a3a"),ct=!1):T.bh==="bomb"&&J<85&&(T.st="wind",T.stT=.65,T.bcd=99,Ut(T.x,T.y,82,.65,T.dmg*1.6,"#d060ff"),ct=!1));let mt=1;if(T.ranged&&J<T.ranged.range*.65&&(mt=-.4),ct&&(T.x+=L/J*v*x*mt,T.y+=Z/J*v*x*mt),T.ranged&&ct&&(T.shootCd-=x,T.shootCd<=0&&J<T.ranged.range&&(T.shootCd=T.ranged.cd*n(.8,1.2),T.atk=.35,kt(T.x,T.y,Math.atan2(Z,L),T.ranged.speed,T.ranged.dmg*(1+c.chId*.12),T.ranged.color,5))),J>1400&&!T.elite){let[et,rt]=W();T.x=et,T.y=rt}}if((T.kx||T.ky)&&(T.x+=T.kx*x,T.y+=T.ky*x,T.kx*=.88,T.ky*=.88,Math.abs(T.kx)+Math.abs(T.ky)<5&&(T.kx=T.ky=0)),!T.boss){_(T.x,T.y,T.r,ut);let v=0;for(let L of ut){if(L===T||v>5)continue;let Z=T.x-L.x,J=T.y-L.y,ct=Math.hypot(Z,J)||.01,mt=T.r+L.r;if(ct<mt){let et=(mt-ct)*.35;T.x+=Z/ct*et,T.y+=J/ct*et,v++}}}let b=T.r+P.r-3;r(T.x,T.y,P.x,P.y)<b*b&&Dt(T.dmg)}for(let T of c.shots){if(T.life-=x,T.homing){let b=Vt(T.x,T.y,300,T.hit);if(b){let v=Math.atan2(b.y-T.y,b.x-T.x),L=Math.hypot(T.vx,T.vy),Z=Math.atan2(T.vy,T.vx),J=v-Z;for(;J>Math.PI;)J-=De;for(;J<-Math.PI;)J+=De;let ct=Z+i(J,-T.homing*x,T.homing*x);T.vx=Math.cos(ct)*L,T.vy=Math.sin(ct)*L}}T.x+=T.vx*x,T.y+=T.vy*x;for(let b of c.props)!b.dead&&r(b.x,b.y,T.x,T.y)<484&&Rt(b);if(T.kind==="orb"&&T.life<=0){_t(T.x,T.y,T.blast,T.dmg,"void","#b46cff");continue}for(let b of _(T.x,T.y,T.r))if(!T.hit.has(b)){if(T.hit.add(b),T.kind==="orb"){_t(T.x,T.y,T.blast,T.dmg,"void","#b46cff"),T.life=-1;break}if(q(b,T.dmg,T.el),T.slow&&!b.dead&&(b.slowT=1.6,b.slow=Math.max(b.slow,T.slow)),!b.boss&&!b.dead){let v=Math.hypot(T.vx,T.vy)||1;b.kx+=T.vx/v*60,b.ky+=T.vy/v*60}if(H(T.x,T.y,T.color,2,60,.25,2),--T.pierce<=0){T.life=-1;break}}}c.shots=c.shots.filter(T=>T.life>0);for(let T of c.rings)if(T.r+=T.speed*x,!T.visual){for(let b of _(T.x,T.y,T.r,[]))if(!T.hit.has(b)){if(r(T.x,T.y,b.x,b.y)<(T.r-40)*(T.r-40)){T.hit.add(b);continue}T.hit.add(b),q(b,T.dmg,T.el),b.dead||(b.burnT=3,b.burnDps=Math.max(b.burnDps,T.burn))}}c.rings=c.rings.filter(T=>T.r<T.max);for(let T of c.holes){T.t+=x,T.tick-=x;for(let b of _(T.x,T.y,T.r,[])){if(b.boss)continue;let v=Math.atan2(T.y-b.y,T.x-b.x);b.x+=Math.cos(v)*160*x,b.y+=Math.sin(v)*160*x}if(T.tick<=0){T.tick=.3;for(let b of _(T.x,T.y,T.r*.45,[]))q(b,T.dmg,"void",!0)}if(Math.random()<.5){let b=Math.random()*De;c.parts.push({x:T.x+Math.cos(b)*T.r,y:T.y+Math.sin(b)*T.r,vx:-Math.cos(b)*T.r*1.5,vy:-Math.sin(b)*T.r*1.5,life:.6,max:.6,color:"#c78bff",size:2.5})}T.t>=T.life&&_t(T.x,T.y,T.r*.7,T.final,"void","#d0a0ff")}c.holes=c.holes.filter(T=>T.t<T.life);for(let T of c.eShots){T.life-=x,T.x+=T.vx*x,T.y+=T.vy*x;let b=T.r+P.r-2;r(T.x,T.y,P.x,P.y)<b*b&&(Dt(T.dmg),T.life=0)}c.eShots=c.eShots.filter(T=>T.life>0);for(let T of c.hazards)T.t+=x,!T.done&&T.t>=T.delay&&(T.done=!0,c.blasts.push({x:T.x,y:T.y,r:T.r,life:.35,max:.35,color:T.color}),r(T.x,T.y,P.x,P.y)<(T.r+P.r)*(T.r+P.r)&&Dt(T.dmg));c.hazards=c.hazards.filter(T=>T.t<T.delay+.1);let at=P.magnet*P.magnet;for(let T of c.gems){let b=r(T.x,T.y,P.x,P.y);if(!T.mag&&b<at&&(T.mag=!0),T.mag){let v=Math.sqrt(b)||1,L=420+(c.victoryT>=0?400:0);T.x+=(P.x-T.x)/v*L*x,T.y+=(P.y-T.y)/v*L*x,v<P.r+8&&(T.dead=!0,Qt(T.val))}}c.gems=c.gems.filter(T=>!T.dead);for(let T of c.pickups){T.t+=x;let b=r(T.x,T.y,P.x,P.y);if(b<(P.magnet*.8)**2||c.victoryT>=0){let v=Math.sqrt(b)||1;T.x+=(P.x-T.x)/v*300*x,T.y+=(P.y-T.y)/v*300*x}b<(P.r+14)**2&&(T.dead=!0,oe(T))}c.pickups=c.pickups.filter(T=>!T.dead),c.enemies=c.enemies.filter(T=>!T.dead);for(let T of c.lines)T.life-=x;c.lines=c.lines.filter(T=>T.life>0);for(let T of c.blasts)T.life-=x;c.blasts=c.blasts.filter(T=>T.life>0);for(let T of c.parts)T.life-=x,T.x+=T.vx*x,T.y+=T.vy*x,T.vx*=.92,T.vy*=.92;c.parts=c.parts.filter(T=>T.life>0);for(let T of c.texts)T.life-=x,T.y-=32*x;c.texts=c.texts.filter(T=>T.life>0),c.shake=Math.max(0,c.shake-x*30),c.flash=Math.max(0,c.flash-x*1.5),c.banner&&(c.banner.t-=x,c.banner.t<=0&&(c.banner=null)),c.victoryT>=0&&(c.victoryT-=x,c.victoryT<0&&!c.over&&le(!0)),c.levelQueue>0&&!c.over&&(c.levelQueue--,Ht())}function Qt(x){let P=c.p;for(P.xp+=x,Ce("gem"),c.xpTotal=(c.xpTotal||0)+x,P.heart=Math.min(100,P.heart+x*.55*(c.spec==="void"?2:1));P.xp>=P.xpNext;)P.xp-=P.xpNext,P.lvl++,P.xpNext=y(P.lvl),P.lvl>=DATA.rules.specLevel&&!c.spec&&(c.specPending=!0),c.levelQueue++}function Ht(){Ce("level"),c.paused=!0;let x=c.p;H(x.x,x.y,"#9ad0ff",24,200,.6),c.specPending&&!c.spec?(c.specPending=!1,UI.onLevelUp(U(),!0)):UI.onLevelUp(E(3),!1)}function oe(x){let P=c.p;if(x.kind==="heal"&&Ce("heal"),x.kind==="fragment"&&Ce("chime"),x.kind==="power"&&Ce("power"),x.kind==="heal"){let N=Math.round(P.maxHp*.3);P.hp=Math.min(P.maxHp,P.hp+N),B(P.x,P.y-30,"+"+N,"#7dffa8",16)}else if(x.kind==="power")c.buffT=10,B(P.x,P.y-30,"\u0421\u0438\u043B\u0430 \u042D\u0444\u0438\u0440\u0430! +50% \u0443\u0440\u043E\u043D\u0430","#ffb0ff",16),c.flash=.4,c.flashColor="#d080ff";else if(x.kind==="magnet"){for(let N of c.gems)N.mag=!0;B(P.x,P.y-30,"\u041F\u0440\u0438\u0442\u044F\u0436\u0435\u043D\u0438\u0435!","#9ad0ff",16)}else if(x.kind==="fragment"){let N=Save.unlockNextFragment(c.chId);N?(c.fragmentsFound.push(N),UI.onFragment&&UI.onFragment(N)):(c.bonusEther=(c.bonusEther||0)+25,B(P.x,P.y-30,"+25 \u042D\u0444\u0438\u0440\u0430","#c9a8ff",16))}}function le(x){if(c.over)return;c.over=!0,c.paused=!0,Ce(x?"victory":"defeat");let P=Save.data,N=Math.floor(c.kills/8)+Math.floor(c.time/6)+(x?80+c.chId*40:0)+(c.bonusEther||0);P.ether+=N,P.runs++,P.kills+=c.kills,x||P.deaths++,P.bestTime[c.chId]=Math.max(P.bestTime[c.chId]||0,Math.floor(c.time)),x&&(P.cleared[c.chId]=!0,P.unlockedChapter=Math.max(P.unlockedChapter,Math.min(3,c.chId+1)));let D=null;c.fragmentsFound.length||(D=Save.unlockNextFragment(c.chId)),Save.write();let V={victory:x,ch:c.chId,time:c.time,kills:c.kills,level:c.p.lvl,ether:N,fragments:c.fragmentsFound.slice(),vision:D,spec:c.spec,heartUses:c.heartUses};setTimeout(()=>UI.onRunEnd(V),x?200:900)}function ge(){c=null;for(let x in o)o[x]=!1}return{start:w,quit:ge,useHeart:O,applyChoice:I,update:Et,setView(x,P){t=x,e=P,ch.W=x,ch.H=P},reroll(){return!c||c.p.rerolls<=0?null:(c.p.rerolls--,E(3))},get rerolls(){return c?c.p.rerolls:0},setPaused(x){c&&!c.over&&(c.paused=x)},get running(){return!!c&&!c.over},get run(){return c},getWeapon:x=>c&&R(x),joy:l,debug:{skipTo(x){c&&(c.time=x)},god(){c&&(c.p.invuln=1e9)},xp(x){c&&Qt(x)},step(x,P){for(let N=0;N<x&&c&&!c.paused;N++){if(P){let D=c.p,V=0,ut=0;for(let b of c.enemies){let v=D.x-b.x,L=D.y-b.y,Z=v*v+L*L;Z<48400&&(V+=v/Z*900*(b.boss?4:1),ut+=L/Z*900*(b.boss?4:1))}for(let b of c.eShots){let v=D.x-b.x,L=D.y-b.y,Z=v*v+L*L;Z<14400&&(V+=v/Z*1500,ut+=L/Z*1500)}let at=null,T=1e12;for(let b of c.gems){let v=r(b.x,b.y,D.x,D.y);v<T&&(T=v,at=b)}if(at){let b=Math.sqrt(T)||1;V+=(at.x-D.x)/b*4,ut+=(at.y-D.y)/b*4}D.heart>=100&&(c.boss||D.hp<D.maxHp*.4)&&O(),o.KeyD=V>.3,o.KeyA=V<-.3,o.KeyS=ut>.3,o.KeyW=ut<-.3}Et(1/60)}for(let N in o)o[N]=!1}}}}var Wh=0,sc=1,Xh=2;var Ji=1,qh=2,Ns=3,qn=0,fn=1,In=2,ai=0,Li=1,Ki=2,rc=3,ac=4,Yh=5;var Qi=100,Zh=101,$h=102,Jh=103,Kh=104,Qh=200,jh=201,tu=202,eu=203,oc=204,lc=205,nu=206,iu=207,su=208,ru=209,au=210,ou=211,lu=212,cu=213,hu=214,La=0,Da=1,Na=2,ys=3,Ua=4,Fa=5,Oa=6,Ba=7,cc=0,uu=1,du=2,Yn=0,Fr=1,Or=2,Br=3,ji=4,zr=5,kr=6,Hr=7;var hc=300,ts=301,Us=302,fo=303,po=304,vs=1e3,Gn=1001,za=1002,Ye=1003,fu=1004;var Gr=1005;var un=1006,mo=1007;var oi=1008;var xn=1009,uc=1010,dc=1011,Fs=1012,go=1013,zn=1014,Ln=1015,Ke=1016,xo=1017,_o=1018,es=1020,fc=35902,pc=35899,mc=1021,gc=1022,kn=1023,ii=1026,li=1027,yo=1028,vo=1029,Di=1030,Mo=1031;var So=1033,Vr=33776,Wr=33777,Xr=33778,qr=33779,bo=35840,To=35841,wo=35842,Eo=35843,Ao=36196,Ro=37492,Co=37496,Po=37488,Io=37489,Yr=37490,Lo=37491,Do=37808,No=37809,Uo=37810,Fo=37811,Oo=37812,Bo=37813,zo=37814,ko=37815,Ho=37816,Go=37817,Vo=37818,Wo=37819,Xo=37820,qo=37821,Yo=36492,Zo=36494,$o=36495,Jo=36283,Ko=36284,Zr=36285,Qo=36286;var nr=2300,ka=2301,Pa=2302,Xl=2303,ql=2400,Yl=2401,Zl=2402;var pu=3200;var jo=0,mu=1,ci="",nn="srgb",ir="srgb-linear",sr="linear",_e="srgb";var Ia=7680;var gu=519,xu=512,_u=513,yu=514,xc=515,vu=516,Mu=517,_c=518,yc=519,Su=35044,vc=35048;var Mc="300 es",Rn=2e3,Ms=2001;function zd(s){for(let t=s.length-1;t>=0;--t)if(s[t]>=65535)return!0;return!1}function kd(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}function rr(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function bu(){let s=rr("canvas");return s.style.display="block",s}var uh={},Ss=null;function Sc(...s){let t="THREE."+s.shift();Ss?Ss("log",t,...s):console.log(t,...s)}function Tu(s){let t=s[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=s[1];e&&e.isStackTrace?s[0]+=" "+e.getLocation():s[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return s}function $t(...s){s=Tu(s);let t="THREE."+s.shift();if(Ss)Ss("warn",t,...s);else{let e=s[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...s)}}function Jt(...s){s=Tu(s);let t="THREE."+s.shift();if(Ss)Ss("error",t,...s);else{let e=s[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...s)}}function js(...s){let t=s.join(" ");t in uh||(uh[t]=!0,$t(...s))}function wu(s,t,e){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(t,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}var Eu={[La]:La,[Na]:Oa,[Ua]:Ua,[ys]:Fa,[Da]:Da,[Oa]:Na,[Ba]:Ba,[Fa]:ys},Wn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let i=n[t];if(i!==void 0){let r=i.indexOf(e);r!==-1&&i.splice(r,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let i=n.slice(0);for(let r=0,a=i.length;r<a;r++)i[r].call(this,t);t.target=null}}},tn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var vl=Math.PI/180,Ha=180/Math.PI;function Os(){let s=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(tn[s&255]+tn[s>>8&255]+tn[s>>16&255]+tn[s>>24&255]+"-"+tn[t&255]+tn[t>>8&255]+"-"+tn[t>>16&15|64]+tn[t>>24&255]+"-"+tn[e&63|128]+tn[e>>8&255]+"-"+tn[e>>16&255]+tn[e>>24&255]+tn[n&255]+tn[n>>8&255]+tn[n>>16&255]+tn[n>>24&255]).toLowerCase()}function ue(s,t,e){return Math.max(t,Math.min(e,s))}function Hd(s,t){return(s%t+t)%t}function Ml(s,t,e){return(1-e)*s+e*t}function Au(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function bc(s){switch(s.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function Gd(s,t){if(t.constructor===Float32Array)return s;let e=bc(t);if(e===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(s/e,-1)}function Vd(s,t){if(t.constructor===Float32Array)return s;let e=bc(t);if(e===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(s*e)}var Cc=class Cc{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=ue(this.x,t.x,e.x),this.y=ue(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=ue(this.x,t,e),this.y=ue(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ue(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(ue(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),i=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*i+t.x,this.y=r*i+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Cc.prototype.isVector2=!0;var ft=Cc,Je=class{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,r,a,o){let l=n[i+0],h=n[i+1],u=n[i+2],f=n[i+3],p=r[a+0],d=r[a+1],m=r[a+2],_=r[a+3];if(f!==_||l!==p||h!==d||u!==m){let c=l*p+h*d+u*m+f*_;c<0&&(p=-p,d=-d,m=-m,_=-_,c=-c);let g=1-o;if(c<.9995){let y=Math.acos(c),w=Math.sin(y);g=Math.sin(g*y)/w,o=Math.sin(o*y)/w,l=l*g+p*o,h=h*g+d*o,u=u*g+m*o,f=f*g+_*o}else{l=l*g+p*o,h=h*g+d*o,u=u*g+m*o,f=f*g+_*o;let y=1/Math.sqrt(l*l+h*h+u*u+f*f);l*=y,h*=y,u*=y,f*=y}}t[e]=l,t[e+1]=h,t[e+2]=u,t[e+3]=f}static multiplyQuaternionsFlat(t,e,n,i,r,a){let o=n[i],l=n[i+1],h=n[i+2],u=n[i+3],f=r[a],p=r[a+1],d=r[a+2],m=r[a+3];return t[e]=o*m+u*f+l*d-h*p,t[e+1]=l*m+u*p+h*f-o*d,t[e+2]=h*m+u*d+o*p-l*f,t[e+3]=u*m-o*f-l*p-h*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,i=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,h=o(n/2),u=o(i/2),f=o(r/2),p=l(n/2),d=l(i/2),m=l(r/2);switch(a){case"XYZ":this._x=p*u*f+h*d*m,this._y=h*d*f-p*u*m,this._z=h*u*m+p*d*f,this._w=h*u*f-p*d*m;break;case"YXZ":this._x=p*u*f+h*d*m,this._y=h*d*f-p*u*m,this._z=h*u*m-p*d*f,this._w=h*u*f+p*d*m;break;case"ZXY":this._x=p*u*f-h*d*m,this._y=h*d*f+p*u*m,this._z=h*u*m+p*d*f,this._w=h*u*f-p*d*m;break;case"ZYX":this._x=p*u*f-h*d*m,this._y=h*d*f+p*u*m,this._z=h*u*m-p*d*f,this._w=h*u*f+p*d*m;break;case"YZX":this._x=p*u*f+h*d*m,this._y=h*d*f+p*u*m,this._z=h*u*m-p*d*f,this._w=h*u*f-p*d*m;break;case"XZY":this._x=p*u*f-h*d*m,this._y=h*d*f-p*u*m,this._z=h*u*m+p*d*f,this._w=h*u*f+p*d*m;break;default:$t("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],i=e[4],r=e[8],a=e[1],o=e[5],l=e[9],h=e[2],u=e[6],f=e[10],p=n+o+f;if(p>0){let d=.5/Math.sqrt(p+1);this._w=.25/d,this._x=(u-l)*d,this._y=(r-h)*d,this._z=(a-i)*d}else if(n>o&&n>f){let d=2*Math.sqrt(1+n-o-f);this._w=(u-l)/d,this._x=.25*d,this._y=(i+a)/d,this._z=(r+h)/d}else if(o>f){let d=2*Math.sqrt(1+o-n-f);this._w=(r-h)/d,this._x=(i+a)/d,this._y=.25*d,this._z=(l+u)/d}else{let d=2*Math.sqrt(1+f-n-o);this._w=(a-i)/d,this._x=(r+h)/d,this._y=(l+u)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ue(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,i=t._y,r=t._z,a=t._w,o=e._x,l=e._y,h=e._z,u=e._w;return this._x=n*u+a*o+i*h-r*l,this._y=i*u+a*l+r*o-n*h,this._z=r*u+a*h+n*l-i*o,this._w=a*u-n*o-i*l-r*h,this._onChangeCallback(),this}slerp(t,e){let n=t._x,i=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,i=-i,r=-r,a=-a,o=-o);let l=1-e;if(o<.9995){let h=Math.acos(o),u=Math.sin(h);l=Math.sin(l*h)/u,e=Math.sin(e*h)/u,this._x=this._x*l+n*e,this._y=this._y*l+i*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+i*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},Pc=class Pc{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(dh.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(dh.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,i=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*i,this.y=r[1]*e+r[4]*n+r[7]*i,this.z=r[2]*e+r[5]*n+r[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,i=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*i+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*i+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*i+r[14])*a,this}applyQuaternion(t){let e=this.x,n=this.y,i=this.z,r=t.x,a=t.y,o=t.z,l=t.w,h=2*(a*i-o*n),u=2*(o*e-r*i),f=2*(r*n-a*e);return this.x=e+l*h+a*f-o*u,this.y=n+l*u+o*h-r*f,this.z=i+l*f+r*u-a*h,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,i=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*i,this.y=r[1]*e+r[5]*n+r[9]*i,this.z=r[2]*e+r[6]*n+r[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=ue(this.x,t.x,e.x),this.y=ue(this.y,t.y,e.y),this.z=ue(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=ue(this.x,t,e),this.y=ue(this.y,t,e),this.z=ue(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ue(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,i=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=i*l-r*o,this.y=r*a-n*l,this.z=n*o-i*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Sl.copy(this).projectOnVector(t),this.sub(Sl)}reflect(t){return this.sub(Sl.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(ue(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Pc.prototype.isVector3=!0;var k=Pc,Sl=new k,dh=new Je,Ic=class Ic{constructor(t,e,n,i,r,a,o,l,h){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,r,a,o,l,h)}set(t,e,n,i,r,a,o,l,h){let u=this.elements;return u[0]=t,u[1]=i,u[2]=o,u[3]=e,u[4]=r,u[5]=l,u[6]=n,u[7]=a,u[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,i=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],h=n[1],u=n[4],f=n[7],p=n[2],d=n[5],m=n[8],_=i[0],c=i[3],g=i[6],y=i[1],w=i[4],S=i[7],C=i[2],R=i[5],M=i[8];return r[0]=a*_+o*y+l*C,r[3]=a*c+o*w+l*R,r[6]=a*g+o*S+l*M,r[1]=h*_+u*y+f*C,r[4]=h*c+u*w+f*R,r[7]=h*g+u*S+f*M,r[2]=p*_+d*y+m*C,r[5]=p*c+d*w+m*R,r[8]=p*g+d*S+m*M,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],l=t[6],h=t[7],u=t[8];return e*a*u-e*o*h-n*r*u+n*o*l+i*r*h-i*a*l}invert(){let t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],l=t[6],h=t[7],u=t[8],f=u*a-o*h,p=o*l-u*r,d=h*r-a*l,m=e*f+n*p+i*d;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/m;return t[0]=f*_,t[1]=(i*h-u*n)*_,t[2]=(o*n-i*a)*_,t[3]=p*_,t[4]=(u*e-i*l)*_,t[5]=(i*r-o*e)*_,t[6]=d*_,t[7]=(n*l-h*e)*_,t[8]=(a*e-n*r)*_,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,r,a,o){let l=Math.cos(r),h=Math.sin(r);return this.set(n*l,n*h,-n*(l*a+h*o)+a+t,-i*h,i*l,-i*(-h*a+l*o)+o+e,0,0,1),this}scale(t,e){return js("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(bl.makeScale(t,e)),this}rotate(t){return js("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(bl.makeRotation(-t)),this}translate(t,e){return js("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(bl.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};Ic.prototype.isMatrix3=!0;var jt=Ic,bl=new jt,fh=new jt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ph=new jt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Wd(){let s={enabled:!0,workingColorSpace:ir,spaces:{},convert:function(i,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===_e&&(i.r=ni(i.r),i.g=ni(i.g),i.b=ni(i.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(i.applyMatrix3(this.spaces[r].toXYZ),i.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===_e&&(i.r=_s(i.r),i.g=_s(i.g),i.b=_s(i.b))),i},workingToColorSpace:function(i,r){return this.convert(i,this.workingColorSpace,r)},colorSpaceToWorking:function(i,r){return this.convert(i,r,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===ci?sr:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,r=this.workingColorSpace){return i.fromArray(this.spaces[r].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,r,a){return i.copy(this.spaces[a].fromXYZ).multiply(this.spaces[r].toXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return s.define({[ir]:{primaries:t,whitePoint:n,transfer:sr,toXYZ:fh,fromXYZ:ph,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:nn},outputColorSpaceConfig:{drawingBufferColorSpace:nn}},[nn]:{primaries:t,whitePoint:n,transfer:_e,toXYZ:fh,fromXYZ:ph,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:nn}}}),s}var he=Wd();function ni(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function _s(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}var ss,Ga=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{ss===void 0&&(ss=rr("canvas")),ss.width=t.width,ss.height=t.height;let i=ss.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),n=ss}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=rr("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let i=n.getImageData(0,0,t.width,t.height),r=i.data;for(let a=0;a<r.length;a++)r[a]=ni(r[a]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(ni(e[n]/255)*255):e[n]=ni(e[n]);return{data:e,width:t.width,height:t.height}}else return $t("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Xd=0,bs=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Xd++}),this.uuid=Os(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width||0,e.height||0,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?r.push(Tl(i[a].image)):r.push(Tl(i[a]))}else r=Tl(i);n.url=r}return e||(t.images[this.uuid]=n),n}};function Tl(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?Ga.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:($t("Texture: Unable to serialize Texture."),{})}var qd=0,wl=new k,dn=class s extends Wn{constructor(t=s.DEFAULT_IMAGE,e=s.DEFAULT_MAPPING,n=Gn,i=Gn,r=un,a=oi,o=kn,l=xn,h=s.DEFAULT_ANISOTROPY,u=ci){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:qd++}),this.uuid=Os(),this.name="",this.source=new bs(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=a,this.anisotropy=h,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ft(0,0),this.repeat=new ft(1,1),this.center=new ft(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new jt,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(wl).x}get height(){return this.source.getSize(wl).y}get depth(){return this.source.getSize(wl).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.mipmapsAutoUpdate=t.mipmapsAutoUpdate,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isPMREMTexture=t.isPMREMTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){$t(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let i=this[e];if(i===void 0){$t(`Texture.setValues(): property '${e}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==hc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case vs:t.x=t.x-Math.floor(t.x);break;case Gn:t.x=t.x<0?0:1;break;case za:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case vs:t.y=t.y-Math.floor(t.y);break;case Gn:t.y=t.y<0?0:1;break;case za:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};dn.DEFAULT_IMAGE=null;dn.DEFAULT_MAPPING=hc;dn.DEFAULT_ANISOTROPY=1;var Lc=class Lc{constructor(t=0,e=0,n=0,i=1){this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,i=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*i+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*i+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*i+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*i+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,r,l=t.elements,h=l[0],u=l[4],f=l[8],p=l[1],d=l[5],m=l[9],_=l[2],c=l[6],g=l[10];if(Math.abs(u-p)<.01&&Math.abs(f-_)<.01&&Math.abs(m-c)<.01){if(Math.abs(u+p)<.1&&Math.abs(f+_)<.1&&Math.abs(m+c)<.1&&Math.abs(h+d+g-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let w=(h+1)/2,S=(d+1)/2,C=(g+1)/2,R=(u+p)/4,M=(f+_)/4,E=(m+c)/4;return w>S&&w>C?w<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(w),i=R/n,r=M/n):S>C?S<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(S),n=R/i,r=E/i):C<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(C),n=M/r,i=E/r),this.set(n,i,r,e),this}let y=Math.sqrt((c-m)*(c-m)+(f-_)*(f-_)+(p-u)*(p-u));return Math.abs(y)<.001&&(y=1),this.x=(c-m)/y,this.y=(f-_)/y,this.z=(p-u)/y,this.w=Math.acos((h+d+g-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=ue(this.x,t.x,e.x),this.y=ue(this.y,t.y,e.y),this.z=ue(this.z,t.z,e.z),this.w=ue(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=ue(this.x,t,e),this.y=ue(this.y,t,e),this.z=ue(this.z,t,e),this.w=ue(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ue(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Lc.prototype.isVector4=!0;var Pe=Lc,Va=class extends Wn{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:un,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new Pe(0,0,t,e),this.scissorTest=!1,this.viewport=new Pe(0,0,t,e),this.textures=[];let i=n.count;for(let r=0;r<i;r++)this.textures[r]=new dn({width:t,height:e,depth:n.depth}),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){let e={minFilter:un,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.mipmapsAutoUpdate!==void 0&&(e.mipmapsAutoUpdate=t.mipmapsAutoUpdate),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=t,this.textures[i].image.height=e,this.textures[i].image.depth=n,this.textures[i].isData3DTexture!==!0&&(this.textures[i].isArrayTexture=this.textures[i].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let i=Object.assign({},t.textures[e].image);this.textures[e].source=new bs(i)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;else this.depthTexture=null;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},He=class extends Va{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},ar=class extends dn{constructor(t=null,e=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=Ye,this.minFilter=Ye,this.wrapR=Gn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var Wa=class extends dn{constructor(t=null,e=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=Ye,this.minFilter=Ye,this.wrapR=Gn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}};var uo=class uo{constructor(t,e,n,i,r,a,o,l,h,u,f,p,d,m,_,c){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,r,a,o,l,h,u,f,p,d,m,_,c)}set(t,e,n,i,r,a,o,l,h,u,f,p,d,m,_,c){let g=this.elements;return g[0]=t,g[4]=e,g[8]=n,g[12]=i,g[1]=r,g[5]=a,g[9]=o,g[13]=l,g[2]=h,g[6]=u,g[10]=f,g[14]=p,g[3]=d,g[7]=m,g[11]=_,g[15]=c,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new uo().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,i=1/rs.setFromMatrixColumn(t,0).length(),r=1/rs.setFromMatrixColumn(t,1).length(),a=1/rs.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,i=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(i),h=Math.sin(i),u=Math.cos(r),f=Math.sin(r);if(t.order==="XYZ"){let p=a*u,d=a*f,m=o*u,_=o*f;e[0]=l*u,e[4]=-l*f,e[8]=h,e[1]=d+m*h,e[5]=p-_*h,e[9]=-o*l,e[2]=_-p*h,e[6]=m+d*h,e[10]=a*l}else if(t.order==="YXZ"){let p=l*u,d=l*f,m=h*u,_=h*f;e[0]=p+_*o,e[4]=m*o-d,e[8]=a*h,e[1]=a*f,e[5]=a*u,e[9]=-o,e[2]=d*o-m,e[6]=_+p*o,e[10]=a*l}else if(t.order==="ZXY"){let p=l*u,d=l*f,m=h*u,_=h*f;e[0]=p-_*o,e[4]=-a*f,e[8]=m+d*o,e[1]=d+m*o,e[5]=a*u,e[9]=_-p*o,e[2]=-a*h,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){let p=a*u,d=a*f,m=o*u,_=o*f;e[0]=l*u,e[4]=m*h-d,e[8]=p*h+_,e[1]=l*f,e[5]=_*h+p,e[9]=d*h-m,e[2]=-h,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){let p=a*l,d=a*h,m=o*l,_=o*h;e[0]=l*u,e[4]=_-p*f,e[8]=m*f+d,e[1]=f,e[5]=a*u,e[9]=-o*u,e[2]=-h*u,e[6]=d*f+m,e[10]=p-_*f}else if(t.order==="XZY"){let p=a*l,d=a*h,m=o*l,_=o*h;e[0]=l*u,e[4]=-f,e[8]=h*u,e[1]=p*f+_,e[5]=a*u,e[9]=d*f-m,e[2]=m*f-d,e[6]=o*u,e[10]=_*f+p}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Yd,t,Zd)}lookAt(t,e,n){let i=this.elements;return vn.subVectors(t,e),vn.lengthSq()===0&&(vn.z=1),vn.normalize(),mi.crossVectors(n,vn),mi.lengthSq()===0&&(Math.abs(n.z)===1?vn.x+=1e-4:vn.z+=1e-4,vn.normalize(),mi.crossVectors(n,vn)),mi.normalize(),oa.crossVectors(vn,mi),i[0]=mi.x,i[4]=oa.x,i[8]=vn.x,i[1]=mi.y,i[5]=oa.y,i[9]=vn.y,i[2]=mi.z,i[6]=oa.z,i[10]=vn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,i=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],h=n[12],u=n[1],f=n[5],p=n[9],d=n[13],m=n[2],_=n[6],c=n[10],g=n[14],y=n[3],w=n[7],S=n[11],C=n[15],R=i[0],M=i[4],E=i[8],U=i[12],I=i[1],O=i[5],B=i[9],H=i[13],F=i[2],q=i[6],Y=i[10],X=i[14],$=i[3],W=i[7],j=i[11],nt=i[15];return r[0]=a*R+o*I+l*F+h*$,r[4]=a*M+o*O+l*q+h*W,r[8]=a*E+o*B+l*Y+h*j,r[12]=a*U+o*H+l*X+h*nt,r[1]=u*R+f*I+p*F+d*$,r[5]=u*M+f*O+p*q+d*W,r[9]=u*E+f*B+p*Y+d*j,r[13]=u*U+f*H+p*X+d*nt,r[2]=m*R+_*I+c*F+g*$,r[6]=m*M+_*O+c*q+g*W,r[10]=m*E+_*B+c*Y+g*j,r[14]=m*U+_*H+c*X+g*nt,r[3]=y*R+w*I+S*F+C*$,r[7]=y*M+w*O+S*q+C*W,r[11]=y*E+w*B+S*Y+C*j,r[15]=y*U+w*H+S*X+C*nt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],i=t[8],r=t[12],a=t[1],o=t[5],l=t[9],h=t[13],u=t[2],f=t[6],p=t[10],d=t[14],m=t[3],_=t[7],c=t[11],g=t[15],y=l*d-h*p,w=o*d-h*f,S=o*p-l*f,C=a*d-h*u,R=a*p-l*u,M=a*f-o*u;return e*(_*y-c*w+g*S)-n*(m*y-c*C+g*R)+i*(m*w-_*C+g*M)-r*(m*S-_*R+c*M)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],i=t[8],r=t[1],a=t[5],o=t[9],l=t[2],h=t[6],u=t[10];return e*(a*u-o*h)-n*(r*u-o*l)+i*(r*h-a*l)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],l=t[6],h=t[7],u=t[8],f=t[9],p=t[10],d=t[11],m=t[12],_=t[13],c=t[14],g=t[15],y=e*o-n*a,w=e*l-i*a,S=e*h-r*a,C=n*l-i*o,R=n*h-r*o,M=i*h-r*l,E=u*_-f*m,U=u*c-p*m,I=u*g-d*m,O=f*c-p*_,B=f*g-d*_,H=p*g-d*c,F=y*H-w*B+S*O+C*I-R*U+M*E;if(F===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let q=1/F;return t[0]=(o*H-l*B+h*O)*q,t[1]=(i*B-n*H-r*O)*q,t[2]=(_*M-c*R+g*C)*q,t[3]=(p*R-f*M-d*C)*q,t[4]=(l*I-a*H-h*U)*q,t[5]=(e*H-i*I+r*U)*q,t[6]=(c*S-m*M-g*w)*q,t[7]=(u*M-p*S+d*w)*q,t[8]=(a*B-o*I+h*E)*q,t[9]=(n*I-e*B-r*E)*q,t[10]=(m*R-_*S+g*y)*q,t[11]=(f*S-u*R-d*y)*q,t[12]=(o*U-a*O-l*E)*q,t[13]=(e*O-n*U+i*E)*q,t[14]=(_*w-m*C-c*y)*q,t[15]=(u*C-f*w+p*y)*q,this}scale(t){let e=this.elements,n=t.x,i=t.y,r=t.z;return e[0]*=n,e[4]*=i,e[8]*=r,e[1]*=n,e[5]*=i,e[9]*=r,e[2]*=n,e[6]*=i,e[10]*=r,e[3]*=n,e[7]*=i,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),i=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,h=r*a,u=r*o;return this.set(h*a+n,h*o-i*l,h*l+i*o,0,h*o+i*l,u*o+n,u*l-i*a,0,h*l-i*o,u*l+i*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,r,a){return this.set(1,n,r,0,t,1,a,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){let i=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,h=r+r,u=a+a,f=o+o,p=r*h,d=r*u,m=r*f,_=a*u,c=a*f,g=o*f,y=l*h,w=l*u,S=l*f,C=n.x,R=n.y,M=n.z;return i[0]=(1-(_+g))*C,i[1]=(d+S)*C,i[2]=(m-w)*C,i[3]=0,i[4]=(d-S)*R,i[5]=(1-(p+g))*R,i[6]=(c+y)*R,i[7]=0,i[8]=(m+w)*M,i[9]=(c-y)*M,i[10]=(1-(p+_))*M,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){let i=this.elements;t.x=i[12],t.y=i[13],t.z=i[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),e.identity(),this;let a=rs.set(i[0],i[1],i[2]).length(),o=rs.set(i[4],i[5],i[6]).length(),l=rs.set(i[8],i[9],i[10]).length();r<0&&(a=-a),Un.copy(this);let h=1/a,u=1/o,f=1/l;return Un.elements[0]*=h,Un.elements[1]*=h,Un.elements[2]*=h,Un.elements[4]*=u,Un.elements[5]*=u,Un.elements[6]*=u,Un.elements[8]*=f,Un.elements[9]*=f,Un.elements[10]*=f,e.setFromRotationMatrix(Un),n.x=a,n.y=o,n.z=l,this}makePerspective(t,e,n,i,r,a,o=Rn,l=!1){let h=this.elements,u=2*r/(e-t),f=2*r/(n-i),p=(e+t)/(e-t),d=(n+i)/(n-i),m,_;if(l)m=r/(a-r),_=a*r/(a-r);else if(o===Rn)m=-(a+r)/(a-r),_=-2*a*r/(a-r);else if(o===Ms)m=-a/(a-r),_=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return h[0]=u,h[4]=0,h[8]=p,h[12]=0,h[1]=0,h[5]=f,h[9]=d,h[13]=0,h[2]=0,h[6]=0,h[10]=m,h[14]=_,h[3]=0,h[7]=0,h[11]=-1,h[15]=0,this}makeOrthographic(t,e,n,i,r,a,o=Rn,l=!1){let h=this.elements,u=2/(e-t),f=2/(n-i),p=-(e+t)/(e-t),d=-(n+i)/(n-i),m,_;if(l)m=1/(a-r),_=a/(a-r);else if(o===Rn)m=-2/(a-r),_=-(a+r)/(a-r);else if(o===Ms)m=-1/(a-r),_=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return h[0]=u,h[4]=0,h[8]=0,h[12]=p,h[1]=0,h[5]=f,h[9]=0,h[13]=d,h[2]=0,h[6]=0,h[10]=m,h[14]=_,h[3]=0,h[7]=0,h[11]=0,h[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};uo.prototype.isMatrix4=!0;var fe=uo,rs=new k,Un=new fe,Yd=new k(0,0,0),Zd=new k(1,1,1),mi=new k,oa=new k,vn=new k,mh=new fe,gh=new Je,rn=class s{constructor(t=0,e=0,n=0,i=s.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let i=t.elements,r=i[0],a=i[4],o=i[8],l=i[1],h=i[5],u=i[9],f=i[2],p=i[6],d=i[10];switch(e){case"XYZ":this._y=Math.asin(ue(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,d),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(p,h),this._z=0);break;case"YXZ":this._x=Math.asin(-ue(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,h)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(ue(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-f,d),this._z=Math.atan2(-a,h)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-ue(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(p,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,h));break;case"YZX":this._z=Math.asin(ue(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,h),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-ue(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(p,h),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-u,d),this._y=0);break;default:$t("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return mh.makeRotationFromQuaternion(t),this.setFromRotationMatrix(mh,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return gh.setFromEuler(this),this.setFromQuaternion(gh,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};rn.DEFAULT_ORDER="XYZ";var Ts=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},$d=0,xh=new k,as=new Je,Kn=new fe,la=new k,qs=new k,Jd=new k,Kd=new Je,_h=new k(1,0,0),yh=new k(0,1,0),vh=new k(0,0,1),Mh={type:"added"},Qd={type:"removed"},os={type:"childadded",child:null},El={type:"childremoved",child:null},an=class s extends Wn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:$d++}),this.uuid=Os(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=s.DEFAULT_UP.clone();let t=new k,e=new rn,n=new Je,i=new k(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new fe},normalMatrix:{value:new jt}}),this.matrix=new fe,this.matrixWorld=new fe,this.matrixAutoUpdate=s.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=s.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ts,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return as.setFromAxisAngle(t,e),this.quaternion.multiply(as),this}rotateOnWorldAxis(t,e){return as.setFromAxisAngle(t,e),this.quaternion.premultiply(as),this}rotateX(t){return this.rotateOnAxis(_h,t)}rotateY(t){return this.rotateOnAxis(yh,t)}rotateZ(t){return this.rotateOnAxis(vh,t)}translateOnAxis(t,e){return xh.copy(t).applyQuaternion(this.quaternion),this.position.add(xh.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(_h,t)}translateY(t){return this.translateOnAxis(yh,t)}translateZ(t){return this.translateOnAxis(vh,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Kn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?la.copy(t):la.set(t,e,n);let i=this.parent;this.updateWorldMatrix(!0,!1),qs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Kn.lookAt(qs,la,this.up):Kn.lookAt(la,qs,this.up),this.quaternion.setFromRotationMatrix(Kn),i&&(Kn.extractRotation(i.matrixWorld),as.setFromRotationMatrix(Kn),this.quaternion.premultiply(as.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Jt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Mh),os.child=t,this.dispatchEvent(os),os.child=null):Jt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Qd),El.child=t,this.dispatchEvent(El),El.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Kn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Kn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Kn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Mh),os.child=t,this.dispatchEvent(os),os.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){let a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(qs,t,Jd),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(qs,Kd,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(t){t(this);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,i=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*i,r[13]+=n-r[1]*e-r[5]*n-r[9]*i,r[14]+=i-r[2]*e-r[6]*n-r[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,i.name=this.name,i.castShadow=this.castShadow,i.receiveShadow=this.receiveShadow,i.visible=this.visible,i.frustumCulled=this.frustumCulled,i.renderOrder=this.renderOrder,i.static=this.static,i.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null&&(i.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(i.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(o=>({...o})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(t),i.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let h=0,u=l.length;h<u;h++){let f=l[h];r(t.shapes,f)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,h=this.material.length;l<h;l++)o.push(r(t.materials,this.material[l]));i.material=o}else i.material=r(t.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];i.animations.push(r(t.animations,l))}}if(e){let o=a(t.geometries),l=a(t.materials),h=a(t.textures),u=a(t.images),f=a(t.shapes),p=a(t.skeletons),d=a(t.animations),m=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),h.length>0&&(n.textures=h),u.length>0&&(n.images=u),f.length>0&&(n.shapes=f),p.length>0&&(n.skeletons=p),d.length>0&&(n.animations=d),m.length>0&&(n.nodes=m)}return n.object=i,n;function a(o){let l=[];for(let h in o){let u=o[h];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let i=t.children[n];this.add(i.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};an.DEFAULT_UP=new k(0,1,0);an.DEFAULT_MATRIX_AUTO_UPDATE=!0;an.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Kt=class extends an{constructor(){super(),this.isGroup=!0,this.type="Group"}},jd={type:"move"},ws=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Kt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Kt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new k,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new k),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Kt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new k,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new k,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let i=null,r=null,a=null,o=this._targetRay,l=this._grip,h=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(h&&t.hand){a=!0;for(let _ of t.hand.values()){let c=e.getJointPose(_,n),g=this._getHandJoint(h,_);c!==null&&(g.matrix.fromArray(c.transform.matrix),g.matrix.decompose(g.position,g.quaternion,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=c.radius),g.visible=c!==null}let u=h.joints["index-finger-tip"],f=h.joints["thumb-tip"],p=u.position.distanceTo(f.position),d=.02,m=.005;h.inputState.pinching&&p>d+m?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!h.inputState.pinching&&p<=d-m&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.quaternion,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(i=e.getPose(t.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(jd)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=r!==null),h!==null&&(h.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new Kt;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},Ru={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},gi={h:0,s:0,l:0},ca={h:0,s:0,l:0};function Al(s,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?s+(t-s)*6*e:e<1/2?t:e<2/3?s+(t-s)*6*(2/3-e):s}var Xt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=nn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,he.colorSpaceToWorking(this,e),this}setRGB(t,e,n,i=he.workingColorSpace){return this.r=t,this.g=e,this.b=n,he.colorSpaceToWorking(this,i),this}setHSL(t,e,n,i=he.workingColorSpace){if(t=Hd(t,1),e=ue(e,0,1),n=ue(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=Al(a,r,t+1/3),this.g=Al(a,r,t),this.b=Al(a,r,t-1/3)}return he.colorSpaceToWorking(this,i),this}setStyle(t,e=nn){function n(r){r!==void 0&&parseFloat(r)<1&&$t("Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseFloat(r[1]))/100,Math.min(100,parseFloat(r[2]))/100,Math.min(100,parseFloat(r[3]))/100,e);break;case"hsl":case"hsla":if(r=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:$t("Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=i[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);$t("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=nn){let n=Ru[t.toLowerCase()];return n!==void 0?this.setHex(n,e):$t("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=ni(t.r),this.g=ni(t.g),this.b=ni(t.b),this}copyLinearToSRGB(t){return this.r=_s(t.r),this.g=_s(t.g),this.b=_s(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=nn){return he.workingToColorSpace(en.copy(this),t),Math.round(ue(en.r*255,0,255))*65536+Math.round(ue(en.g*255,0,255))*256+Math.round(ue(en.b*255,0,255))}getHexString(t=nn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=he.workingColorSpace){he.workingToColorSpace(en.copy(this),e);let n=en.r,i=en.g,r=en.b,a=Math.max(n,i,r),o=Math.min(n,i,r),l,h,u=(o+a)/2;if(o===a)l=0,h=0;else{let f=a-o;switch(h=u<=.5?f/(a+o):f/(2-a-o),a){case n:l=(i-r)/f+(i<r?6:0);break;case i:l=(r-n)/f+2;break;case r:l=(n-i)/f+4;break}l/=6}return t.h=l,t.s=h,t.l=u,t}getRGB(t,e=he.workingColorSpace){return he.workingToColorSpace(en.copy(this),e),t.r=en.r,t.g=en.g,t.b=en.b,t}getStyle(t=nn){he.workingToColorSpace(en.copy(this),t);let e=en.r,n=en.g,i=en.b;return t!==nn?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(gi),this.setHSL(gi.h+t,gi.s+e,gi.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(gi),t.getHSL(ca);let n=Ml(gi.h,ca.h,e),i=Ml(gi.s,ca.s,e),r=Ml(gi.l,ca.l,e);return this.setHSL(n,i,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,i=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*i,this.g=r[1]*e+r[4]*n+r[7]*i,this.b=r[2]*e+r[5]*n+r[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},en=new Xt;Xt.NAMES=Ru;var or=class s{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new Xt(t),this.near=e,this.far=n}clone(){return new s(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},lr=class extends an{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new rn,this.environmentIntensity=1,this.environmentRotation=new rn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),this.background=t.background!==null?t.background.clone():null,this.environment=t.environment!==null?t.environment.clone():null,this.fog=t.fog!==null?t.fog.clone():null,this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),this.overrideMaterial=t.overrideMaterial!==null?t.overrideMaterial.clone():null,this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}},Fn=new k,Qn=new k,Rl=new k,jn=new k,ls=new k,cs=new k,Sh=new k,Cl=new k,Pl=new k,Il=new k,Ll=new Pe,Dl=new Pe,Nl=new Pe,vi=class s{constructor(t=new k,e=new k,n=new k){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),Fn.subVectors(t,e),i.cross(Fn);let r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(t,e,n,i,r){Fn.subVectors(i,e),Qn.subVectors(n,e),Rl.subVectors(t,e);let a=Fn.dot(Fn),o=Fn.dot(Qn),l=Fn.dot(Rl),h=Qn.dot(Qn),u=Qn.dot(Rl),f=a*h-o*o;if(f===0)return r.set(0,0,0),null;let p=1/f,d=(h*l-o*u)*p,m=(a*u-o*l)*p;return r.set(1-d-m,m,d)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,jn)===null?!1:jn.x>=0&&jn.y>=0&&jn.x+jn.y<=1}static getInterpolation(t,e,n,i,r,a,o,l){return this.getBarycoord(t,e,n,i,jn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,jn.x),l.addScaledVector(a,jn.y),l.addScaledVector(o,jn.z),l)}static getInterpolatedAttribute(t,e,n,i,r,a){return Ll.setScalar(0),Dl.setScalar(0),Nl.setScalar(0),Ll.fromBufferAttribute(t,e),Dl.fromBufferAttribute(t,n),Nl.fromBufferAttribute(t,i),a.setScalar(0),a.addScaledVector(Ll,r.x),a.addScaledVector(Dl,r.y),a.addScaledVector(Nl,r.z),a}static isFrontFacing(t,e,n,i){return Fn.subVectors(n,e),Qn.subVectors(t,e),Fn.cross(Qn).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Fn.subVectors(this.c,this.b),Qn.subVectors(this.a,this.b),Fn.cross(Qn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return s.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return s.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,r){return s.getInterpolation(t,this.a,this.b,this.c,e,n,i,r)}containsPoint(t){return s.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return s.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,i=this.b,r=this.c,a,o;ls.subVectors(i,n),cs.subVectors(r,n),Cl.subVectors(t,n);let l=ls.dot(Cl),h=cs.dot(Cl);if(l<=0&&h<=0)return e.copy(n);Pl.subVectors(t,i);let u=ls.dot(Pl),f=cs.dot(Pl);if(u>=0&&f<=u)return e.copy(i);let p=l*f-u*h;if(p<=0&&l>=0&&u<=0&&l-u>0)return a=l/(l-u),e.copy(n).addScaledVector(ls,a);Il.subVectors(t,r);let d=ls.dot(Il),m=cs.dot(Il);if(m>=0&&d<=m)return e.copy(r);let _=d*h-l*m;if(_<=0&&h>=0&&m<=0)return o=h/(h-m),e.copy(n).addScaledVector(cs,o);let c=u*m-d*f;if(c<=0&&f-u>=0&&d-m>=0)return Sh.subVectors(r,i),o=(f-u)/(f-u+(d-m)),e.copy(i).addScaledVector(Sh,o);let g=1/(c+_+p);return a=_*g,o=p*g,e.copy(n).addScaledVector(ls,a).addScaledVector(cs,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Xn=class{constructor(t=new k(1/0,1/0,1/0),e=new k(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(On.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(On.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=On.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0&&t.isBatchedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,On):On.fromBufferAttribute(r,a),On.applyMatrix4(t.matrixWorld),this.expandByPoint(On);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ha.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ha.copy(n.boundingBox)),ha.applyMatrix4(t.matrixWorld),this.union(ha)}let i=t.children;for(let r=0,a=i.length;r<a;r++)this.expandByObject(i[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,On),On.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Ys),ua.subVectors(this.max,Ys),hs.subVectors(t.a,Ys),us.subVectors(t.b,Ys),ds.subVectors(t.c,Ys),xi.subVectors(us,hs),_i.subVectors(ds,us),Hi.subVectors(hs,ds);let e=[0,-xi.z,xi.y,0,-_i.z,_i.y,0,-Hi.z,Hi.y,xi.z,0,-xi.x,_i.z,0,-_i.x,Hi.z,0,-Hi.x,-xi.y,xi.x,0,-_i.y,_i.x,0,-Hi.y,Hi.x,0];return!Ul(e,hs,us,ds,ua)||(e=[1,0,0,0,1,0,0,0,1],!Ul(e,hs,us,ds,ua))?!1:(da.crossVectors(xi,_i),e=[da.x,da.y,da.z],Ul(e,hs,us,ds,ua))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,On).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(On).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(ti[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),ti[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),ti[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),ti[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),ti[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),ti[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),ti[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),ti[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(ti),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},ti=[new k,new k,new k,new k,new k,new k,new k,new k],On=new k,ha=new Xn,hs=new k,us=new k,ds=new k,xi=new k,_i=new k,Hi=new k,Ys=new k,ua=new k,da=new k,Gi=new k;function Ul(s,t,e,n,i){for(let r=0,a=s.length-3;r<=a;r+=3){Gi.fromArray(s,r);let o=i.x*Math.abs(Gi.x)+i.y*Math.abs(Gi.y)+i.z*Math.abs(Gi.z),l=t.dot(Gi),h=e.dot(Gi),u=n.dot(Gi);if(Math.max(-Math.max(l,h,u),Math.min(l,h,u))>o)return!1}return!0}var Be=new k,fa=new ft,tf=0,Sn=class extends Wn{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:tf++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Su,this.updateRanges=[],this.gpuType=Ln,this.version=0,this._normalizationScale=t!==void 0?bc(t):void 0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this._normalizationScale=t._normalizationScale,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)fa.fromBufferAttribute(this,e),fa.applyMatrix3(t),this.setXY(e,fa.x,fa.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Be.fromBufferAttribute(this,e),Be.applyMatrix3(t),this.setXYZ(e,Be.x,Be.y,Be.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Be.fromBufferAttribute(this,e),Be.applyMatrix4(t),this.setXYZ(e,Be.x,Be.y,Be.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Be.fromBufferAttribute(this,e),Be.applyNormalMatrix(t),this.setXYZ(e,Be.x,Be.y,Be.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Be.fromBufferAttribute(this,e),Be.transformDirection(t),this.setXYZ(e,Be.x,Be.y,Be.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=this._denormalize(n)),n}setComponent(t,e,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=this._denormalize(e)),e}setX(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=this._denormalize(e)),e}setY(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=this._denormalize(e)),e}setZ(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=this._denormalize(e)),e}setW(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n),i=this._normalize(i)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,r){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n),i=this._normalize(i),r=this._normalize(r)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(t){let e=this._normalizationScale;return e!==void 0?Math.max(t/e,-1):Gd(t,this.array)}_normalize(t){let e=this._normalizationScale;return e!==void 0?Math.round(t*e):Vd(t,this.array)}};var cr=class extends Sn{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var hr=class extends Sn{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var ce=class extends Sn{constructor(t,e,n){super(new Float32Array(t),e,n)}},ef=new Xn,Zs=new k,Fl=new k,Mi=class{constructor(t=new k,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):ef.setFromPoints(t).getCenter(n);let i=0;for(let r=0,a=t.length;r<a;r++)i=Math.max(i,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Zs.subVectors(t,this.center);let e=Zs.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(Zs,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Fl.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Zs.copy(t.center).add(Fl)),this.expandByPoint(Zs.copy(t.center).sub(Fl))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},nf=0,An=new fe,Ol=new an,fs=new k,Mn=new Xn,$s=new Xn,qe=new k,Fe=class s extends Wn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:nf++}),this.uuid=Os(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(zd(t)?hr:cr)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new jt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return An.makeRotationFromQuaternion(t),this.applyMatrix4(An),this}rotateX(t){return An.makeRotationX(t),this.applyMatrix4(An),this}rotateY(t){return An.makeRotationY(t),this.applyMatrix4(An),this}rotateZ(t){return An.makeRotationZ(t),this.applyMatrix4(An),this}translate(t,e,n){return An.makeTranslation(t,e,n),this.applyMatrix4(An),this}scale(t,e,n){return An.makeScale(t,e,n),this.applyMatrix4(An),this}lookAt(t){return Ol.lookAt(t),Ol.updateMatrix(),this.applyMatrix4(Ol.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(fs).negate(),this.translate(fs.x,fs.y,fs.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let i=0,r=t.length;i<r;i++){let a=t[i];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new ce(n,3))}else{let n=Math.min(t.length,e.count);for(let i=0;i<n;i++){let r=t[i];e.setXYZ(i,r.x,r.y,r.z||0)}t.length>e.count&&$t("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Xn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Jt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new k(-1/0,-1/0,-1/0),new k(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){let r=e[n];Mn.setFromBufferAttribute(r),this.morphTargetsRelative?(qe.addVectors(this.boundingBox.min,Mn.min),this.boundingBox.expandByPoint(qe),qe.addVectors(this.boundingBox.max,Mn.max),this.boundingBox.expandByPoint(qe)):(this.boundingBox.expandByPoint(Mn.min),this.boundingBox.expandByPoint(Mn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Jt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Mi);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Jt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new k,1/0);return}if(t){let n=this.boundingSphere.center;if(Mn.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];$s.setFromBufferAttribute(o),this.morphTargetsRelative?(qe.addVectors(Mn.min,$s.min),Mn.expandByPoint(qe),qe.addVectors(Mn.max,$s.max),Mn.expandByPoint(qe)):(Mn.expandByPoint($s.min),Mn.expandByPoint($s.max))}Mn.getCenter(n);let i=0;for(let r=0,a=t.count;r<a;r++)qe.fromBufferAttribute(t,r),i=Math.max(i,n.distanceToSquared(qe));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],l=this.morphTargetsRelative;for(let h=0,u=o.count;h<u;h++)qe.fromBufferAttribute(o,h),l&&(fs.fromBufferAttribute(t,h),qe.add(fs)),i=Math.max(i,n.distanceToSquared(qe))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&Jt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Jt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,i=e.normal,r=e.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new Sn(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[],h=new Uint8Array(n.count);for(let U=0;U<n.count;U++)o[U]=new k,l[U]=new k;let u=new k,f=new k,p=new k,d=new ft,m=new ft,_=new ft,c=new k,g=new k;function y(U,I,O){h[U]=h[I]=h[O]=1,u.fromBufferAttribute(n,U),f.fromBufferAttribute(n,I),p.fromBufferAttribute(n,O),d.fromBufferAttribute(r,U),m.fromBufferAttribute(r,I),_.fromBufferAttribute(r,O),f.sub(u),p.sub(u),m.sub(d),_.sub(d);let B=1/(m.x*_.y-_.x*m.y);isFinite(B)&&(c.copy(f).multiplyScalar(_.y).addScaledVector(p,-m.y).multiplyScalar(B),g.copy(p).multiplyScalar(m.x).addScaledVector(f,-_.x).multiplyScalar(B),o[U].add(c),o[I].add(c),o[O].add(c),l[U].add(g),l[I].add(g),l[O].add(g))}let w=this.groups;w.length===0&&(w=[{start:0,count:t.count}]);for(let U=0,I=w.length;U<I;++U){let O=w[U],B=O.start,H=O.count;for(let F=B,q=B+H;F<q;F+=3)y(t.getX(F+0),t.getX(F+1),t.getX(F+2))}let S=new k,C=new k,R=new k,M=new k;function E(U){R.fromBufferAttribute(i,U),M.copy(R);let I=o[U];S.copy(I),S.sub(R.multiplyScalar(R.dot(I))).normalize(),C.crossVectors(M,I);let B=C.dot(l[U])<0?-1:1;a.setXYZW(U,S.x,S.y,S.z,B)}for(let U=0,I=n.count;U<I;++U)h[U]&&E(U);this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new Sn(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let p=0,d=n.count;p<d;p++)n.setXYZ(p,0,0,0);let i=new k,r=new k,a=new k,o=new k,l=new k,h=new k,u=new k,f=new k;if(t)for(let p=0,d=t.count;p<d;p+=3){let m=t.getX(p+0),_=t.getX(p+1),c=t.getX(p+2);i.fromBufferAttribute(e,m),r.fromBufferAttribute(e,_),a.fromBufferAttribute(e,c),u.subVectors(a,r),f.subVectors(i,r),u.cross(f),o.fromBufferAttribute(n,m),l.fromBufferAttribute(n,_),h.fromBufferAttribute(n,c),o.add(u),l.add(u),h.add(u),n.setXYZ(m,o.x,o.y,o.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(c,h.x,h.y,h.z)}else for(let p=0,d=e.count;p<d;p+=3)i.fromBufferAttribute(e,p+0),r.fromBufferAttribute(e,p+1),a.fromBufferAttribute(e,p+2),u.subVectors(a,r),f.subVectors(i,r),u.cross(f),n.setXYZ(p+0,u.x,u.y,u.z),n.setXYZ(p+1,u.x,u.y,u.z),n.setXYZ(p+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)qe.fromBufferAttribute(t,e),qe.normalize(),t.setXYZ(e,qe.x,qe.y,qe.z)}toNonIndexed(){function t(o,l){let h=o.array,u=o.itemSize,f=o.normalized,p=new h.constructor(l.length*u),d=0,m=0;for(let _=0,c=l.length;_<c;_++){o.isInterleavedBufferAttribute?d=l[_]*o.data.stride+o.offset:d=l[_]*u;for(let g=0;g<u;g++)p[m++]=h[d++]}return new Sn(p,u,f)}if(this.index===null)return $t("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new s,n=this.index.array,i=this.attributes;for(let o in i){let l=i[o],h=t(l,n);e.setAttribute(o,h)}let r=this.morphAttributes;for(let o in r){let l=[],h=r[o];for(let u=0,f=h.length;u<f;u++){let p=h[u],d=t(p,n);l.push(d)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let h=a[o];e.addGroup(h.start,h.count,h.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let h in l)l[h]!==void 0&&(t[h]=l[h]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let h=n[l];t.data.attributes[l]=h.toJSON(t.data)}let i={},r=!1;for(let l in this.morphAttributes){let h=this.morphAttributes[l],u=[];for(let f=0,p=h.length;f<p;f++){let d=h[f];u.push(d.toJSON(t.data))}u.length>0&&(i[l]=u,r=!0)}r&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let i=t.attributes;for(let h in i){let u=i[h];this.setAttribute(h,u.clone(e))}let r=t.morphAttributes;for(let h in r){let u=[],f=r[h];for(let p=0,d=f.length;p<d;p++)u.push(f[p].clone(e));this.morphAttributes[h]=u}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let h=0,u=a.length;h<u;h++){let f=a[h];this.addGroup(f.start,f.count,f.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Bl=new k,sf=new k,rf=new jt,Bn=class{constructor(t=new k(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let i=Bl.subVectors(n,e).cross(sf.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let i=t.delta(Bl),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let a=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(i,a)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||rf.getNormalMatrix(t),i=this.coplanarPoint(Bl).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},af=0,Si=class extends Wn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:af++}),this.uuid=Os(),this.name="",this.type="Material",this.blending=Li,this.side=qn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=oc,this.blendDst=lc,this.blendEquation=Qi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Xt(0,0,0),this.blendAlpha=0,this.depthFunc=ys,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=gu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ia,this.stencilZFail=Ia,this.stencilZPass=Ia,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){$t(`Material: parameter '${e}' has value of undefined.`);continue}let i=this[e];if(i===void 0){$t(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector2&&n&&n.isVector2||i&&i.isEuler&&n&&n.isEuler||i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(t).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(e){let r=i(t.textures),a=i(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Xt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.diffuseRoughness!==void 0&&(this.diffuseRoughness=t.diffuseRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessMinimum),t.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=t.iridescenceThicknessMaximum),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=t.iridescenceThicknessRange[1]),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new Bn().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new ft().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ft().fromArray(t.clearcoatNormalScale)),t.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=e[t.diffuseRoughnessMap]||null),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let i=e.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var ei=new k,zl=new k,pa=new k,ma=new k,ur=class{constructor(t=new k,e=new k(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,ei)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=ei.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(ei.copy(this.origin).addScaledVector(this.direction,e),ei.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){zl.copy(t).add(e).multiplyScalar(.5),pa.copy(e).sub(t).normalize(),ma.copy(this.origin).sub(zl);let r=t.distanceTo(e)*.5,a=-this.direction.dot(pa),o=ma.dot(this.direction),l=-ma.dot(pa),h=ma.lengthSq(),u=Math.abs(1-a*a),f,p,d,m;if(u>0)if(f=a*l-o,p=a*o-l,m=r*u,f>=0)if(p>=-m)if(p<=m){let _=1/u;f*=_,p*=_,d=f*(f+a*p+2*o)+p*(a*f+p+2*l)+h}else p=r,f=Math.max(0,-(a*p+o)),d=-f*f+p*(p+2*l)+h;else p=-r,f=Math.max(0,-(a*p+o)),d=-f*f+p*(p+2*l)+h;else p<=-m?(f=Math.max(0,-(-a*r+o)),p=f>0?-r:Math.min(Math.max(-r,-l),r),d=-f*f+p*(p+2*l)+h):p<=m?(f=0,p=Math.min(Math.max(-r,-l),r),d=p*(p+2*l)+h):(f=Math.max(0,-(a*r+o)),p=f>0?r:Math.min(Math.max(-r,-l),r),d=-f*f+p*(p+2*l)+h);else p=a>0?-r:r,f=Math.max(0,-(a*p+o)),d=-f*f+p*(p+2*l)+h;return n&&n.copy(this.origin).addScaledVector(this.direction,f),i&&i.copy(zl).addScaledVector(pa,p),d}intersectSphere(t,e){if(t.radius<0)return null;ei.subVectors(t.center,this.origin);let n=ei.dot(this.direction),i=ei.dot(ei)-n*n,r=t.radius*t.radius;if(i>r)return null;let a=Math.sqrt(r-i),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,r,a,o,l,h=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,p=this.origin;return h>=0?(n=(t.min.x-p.x)*h,i=(t.max.x-p.x)*h):(n=(t.max.x-p.x)*h,i=(t.min.x-p.x)*h),u>=0?(r=(t.min.y-p.y)*u,a=(t.max.y-p.y)*u):(r=(t.max.y-p.y)*u,a=(t.min.y-p.y)*u),n>a||r>i||((r>n||isNaN(n))&&(n=r),(a<i||isNaN(i))&&(i=a),f>=0?(o=(t.min.z-p.z)*f,l=(t.max.z-p.z)*f):(o=(t.max.z-p.z)*f,l=(t.min.z-p.z)*f),n>l||o>i)||((o>n||n!==n)&&(n=o),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,ei)!==null}intersectTriangle(t,e,n,i,r){let a=this.origin,o=this.direction,l=o.x,h=o.y,u=o.z,f=t.x-a.x,p=t.y-a.y,d=t.z-a.z,m=e.x-a.x,_=e.y-a.y,c=e.z-a.z,g=n.x-a.x,y=n.y-a.y,w=n.z-a.z,S=Math.abs(l),C=Math.abs(h),R=Math.abs(u),M,E,U,I,O,B,H,F,q,Y,X,$;if(S>=C&&S>=R?(U=l,B=f,q=m,$=g,l>=0?(M=h,E=u,I=p,O=d,H=_,F=c,Y=y,X=w):(M=u,E=h,I=d,O=p,H=c,F=_,Y=w,X=y)):C>=R?(U=h,B=p,q=_,$=y,h>=0?(M=u,E=l,I=d,O=f,H=c,F=m,Y=w,X=g):(M=l,E=u,I=f,O=d,H=m,F=c,Y=g,X=w)):(U=u,B=d,q=c,$=w,u>=0?(M=l,E=h,I=f,O=p,H=m,F=_,Y=g,X=y):(M=h,E=l,I=p,O=f,H=_,F=m,Y=y,X=g)),U===0)return null;let W=M/U,j=E/U,nt=1/U,vt=I-W*B,zt=O-j*B,st=H-W*q,Rt=F-j*q,Nt=Y-W*$,kt=X-j*$,wt=Nt*Rt-kt*st,Ut=vt*kt-zt*Nt,we=st*zt-Rt*vt;if(i){if(wt<0||Ut<0||we<0)return null}else if((wt<0||Ut<0||we<0)&&(wt>0||Ut>0||we>0))return null;let Vt=wt+Ut+we;if(Vt===0)return null;let ee=nt*(wt*B+Ut*q+we*$);return(Vt>0?ee<0:ee>0)?null:this.at(ee/Vt,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},bi=class extends Si{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Xt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new rn,this.combine=cc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},bh=new fe,Vi=new ur,ga=new Mi,Th=new k,xa=new k,_a=new k,ya=new k,kl=new k,va=new k,wh=new k,Ma=new k,ht=class extends an{constructor(t=new Fe,e=new bi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(i,t);let o=this.morphTargetInfluences;if(r&&o){va.set(0,0,0);for(let l=0,h=r.length;l<h;l++){let u=o[l],f=r[l];u!==0&&(kl.fromBufferAttribute(f,t),a?va.addScaledVector(kl,u):va.addScaledVector(kl.sub(e),u))}e.add(va)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ga.copy(n.boundingSphere),ga.applyMatrix4(r),Vi.copy(t.ray).recast(t.near),!(ga.containsPoint(Vi.origin)===!1&&(Vi.intersectSphere(ga,Th)===null||Vi.origin.distanceToSquared(Th)>(t.far-t.near)**2))&&(bh.copy(r).invert(),Vi.copy(t.ray).applyMatrix4(bh),!(n.boundingBox!==null&&Vi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Vi)))}_computeIntersections(t,e,n){let i,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,h=r.attributes.uv,u=r.attributes.uv1,f=r.attributes.normal,p=r.groups,d=r.drawRange;if(o!==null)if(Array.isArray(a))for(let m=0,_=p.length;m<_;m++){let c=p[m],g=a[c.materialIndex],y=Math.max(c.start,d.start),w=Math.min(o.count,Math.min(c.start+c.count,d.start+d.count));for(let S=y,C=w;S<C;S+=3){let R=o.getX(S),M=o.getX(S+1),E=o.getX(S+2);i=Sa(this,g,t,n,h,u,f,R,M,E),i&&(i.faceIndex=Math.floor(S/3),i.face.materialIndex=c.materialIndex,e.push(i))}}else{let m=Math.max(0,d.start),_=Math.min(o.count,d.start+d.count);for(let c=m,g=_;c<g;c+=3){let y=o.getX(c),w=o.getX(c+1),S=o.getX(c+2);i=Sa(this,a,t,n,h,u,f,y,w,S),i&&(i.faceIndex=Math.floor(c/3),e.push(i))}}else if(l!==void 0)if(Array.isArray(a))for(let m=0,_=p.length;m<_;m++){let c=p[m],g=a[c.materialIndex],y=Math.max(c.start,d.start),w=Math.min(l.count,Math.min(c.start+c.count,d.start+d.count));for(let S=y,C=w;S<C;S+=3){let R=S,M=S+1,E=S+2;i=Sa(this,g,t,n,h,u,f,R,M,E),i&&(i.faceIndex=Math.floor(S/3),i.face.materialIndex=c.materialIndex,e.push(i))}}else{let m=Math.max(0,d.start),_=Math.min(l.count,d.start+d.count);for(let c=m,g=_;c<g;c+=3){let y=c,w=c+1,S=c+2;i=Sa(this,a,t,n,h,u,f,y,w,S),i&&(i.faceIndex=Math.floor(c/3),e.push(i))}}}};function of(s,t,e,n,i,r,a,o){let l;if(t.side===fn?l=n.intersectTriangle(a,r,i,!0,o):l=n.intersectTriangle(i,r,a,t.side===qn,o),l===null)return null;Ma.copy(o),Ma.applyMatrix4(s.matrixWorld);let h=e.ray.origin.distanceTo(Ma);return h<e.near||h>e.far?null:{distance:h,point:Ma.clone(),object:s}}function Sa(s,t,e,n,i,r,a,o,l,h){s.getVertexPosition(o,xa),s.getVertexPosition(l,_a),s.getVertexPosition(h,ya);let u=of(s,t,e,n,xa,_a,ya,wh);if(u){let f=new k;vi.getBarycoord(wh,xa,_a,ya,f),i&&(u.uv=vi.getInterpolatedAttribute(i,o,l,h,f,new ft)),r&&(u.uv1=vi.getInterpolatedAttribute(r,o,l,h,f,new ft)),a&&(u.normal=vi.getInterpolatedAttribute(a,o,l,h,f,new k),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));let p={a:o,b:l,c:h,normal:new k,materialIndex:0};vi.getNormal(xa,_a,ya,p.normal),u.face=p,u.barycoord=f}return u}var dr=class extends dn{constructor(t=null,e=1,n=1,i,r,a,o,l,h=Ye,u=Ye,f,p){super(null,a,o,l,h,u,i,r,f,p),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Ti=class extends Sn{constructor(t,e,n,i=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},ps=new fe,Eh=new fe,ba=[],Ah=new Xn,lf=new fe,Js=new ht,Ks=new Mi,wi=class extends ht{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Ti(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,lf)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Xn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,ps),Ah.copy(t.boundingBox).applyMatrix4(ps),this.boundingBox.union(Ah)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Mi),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,ps),Ks.copy(t.boundingSphere).applyMatrix4(ps),this.boundingSphere.union(Ks)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),this.morphTexture=t.morphTexture!==null?t.morphTexture.clone():null,this.instanceColor=t.instanceColor!==null?t.instanceColor.clone():null,this.count=t.count,this.boundingBox=t.boundingBox!==null?t.boundingBox.clone():null,this.boundingSphere=t.boundingSphere!==null?t.boundingSphere.clone():null,this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let n=e.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=i[a+o]}raycast(t,e){let n=this.matrixWorld,i=this.count;if(Js.geometry=this.geometry,Js.material=this.material,Js.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ks.copy(this.boundingSphere),Ks.applyMatrix4(n),t.ray.intersectsSphere(Ks)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,ps),Eh.multiplyMatrices(n,ps),Js.matrixWorld=Eh,Js.raycast(t,ba);for(let a=0,o=ba.length;a<o;a++){let l=ba[a];l.instanceId=r,l.object=this,e.push(l)}ba.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new Ti(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){let n=e.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new dr(new Float32Array(i*this.count),i,this.count,yo,Ln));let r=this.morphTexture.source.data.data,a=0;for(let h=0;h<n.length;h++)a+=n[h];let o=this.geometry.morphTargetsRelative?1:1-a,l=i*t;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Wi=new Mi,cf=new ft(.5,.5),Ta=new k,Ei=class{constructor(t=new Bn,e=new Bn,n=new Bn,i=new Bn,r=new Bn,a=new Bn){this.planes=[t,e,n,i,r,a]}set(t,e,n,i,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Rn,n=!1){let i=this.planes,r=t.elements,a=r[0],o=r[1],l=r[2],h=r[3],u=r[4],f=r[5],p=r[6],d=r[7],m=r[8],_=r[9],c=r[10],g=r[11],y=r[12],w=r[13],S=r[14],C=r[15];if(i[0].setComponents(h-a,d-u,g-m,C-y).normalize(),i[1].setComponents(h+a,d+u,g+m,C+y).normalize(),i[2].setComponents(h+o,d+f,g+_,C+w).normalize(),i[3].setComponents(h-o,d-f,g-_,C-w).normalize(),n)i[4].setComponents(l,p,c,S).normalize(),i[5].setComponents(h-l,d-p,g-c,C-S).normalize();else if(i[4].setComponents(h-l,d-p,g-c,C-S).normalize(),e===Rn)i[5].setComponents(h+l,d+p,g+c,C+S).normalize();else if(e===Ms)i[5].setComponents(l,p,c,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Wi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Wi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Wi)}intersectsSprite(t){Wi.center.set(0,0,0);let e=cf.distanceTo(t.center);return Wi.radius=.7071067811865476+e,Wi.applyMatrix4(t.matrixWorld),this.intersectsSphere(Wi)}intersectsSphere(t){let e=this.planes,n=t.center,i=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let i=e[n];if(Ta.x=i.normal.x>0?t.max.x:t.min.x,Ta.y=i.normal.y>0?t.max.y:t.min.y,Ta.z=i.normal.z>0?t.max.z:t.min.z,i.distanceToPoint(Ta)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Rh=new fe,Xa=class s{constructor(){this.coordinateSystem=Rn,this._frustums=[],this._count=0}setFromArrayCamera(t){let e=t.cameras,n=this._frustums;for(let i=0;i<e.length;i++){let r=e[i];Rh.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[i]===void 0&&(n[i]=new Ei),n[i].setFromProjectionMatrix(Rh,r.coordinateSystem,r.reversedDepth)}return this._count=e.length,this}getFrustum(t){return this._frustums[t]}intersectsObject(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsObject(t))return!0;return!1}intersectsSprite(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsSprite(t))return!0;return!1}intersectsSphere(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsSphere(t))return!0;return!1}intersectsBox(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsBox(t))return!0;return!1}containsPoint(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].containsPoint(t))return!0;return!1}copy(t){this.coordinateSystem=t.coordinateSystem;let e=this._frustums,n=t._frustums;for(let i=0;i<t._count;i++)e[i]===void 0&&(e[i]=new Ei),e[i].copy(n[i]);return this._count=t._count,this}clone(){return new s().copy(this)}};var fr=class extends dn{constructor(t=[],e=ts,n,i,r,a,o,l,h,u){super(t,e,n,i,r,a,o,l,h,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},Es=class extends dn{constructor(t,e,n,i,r,a,o,l,h){super(t,e,n,i,r,a,o,l,h),this.isCanvasTexture=!0,this.needsUpdate=!0}};var si=class extends dn{constructor(t,e,n=zn,i,r,a,o=Ye,l=Ye,h,u=ii,f=1){if(u!==ii&&u!==li)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let p={width:t,height:e,depth:f};super(p,i,r,a,o,l,u,n,h),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new bs(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}},pr=class extends si{constructor(t,e=zn,n=ts,i,r,a=Ye,o=Ye,l,h=ii){let u={width:t,height:t,depth:1},f=[u,u,u,u,u,u];super(t,t,e,n,i,r,a,o,l,h),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},mr=class extends dn{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},Ai=class s extends Fe{constructor(t=1,e=1,n=1,i=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:r,depthSegments:a};let o=this;i=Math.floor(i),r=Math.floor(r),a=Math.floor(a);let l=[],h=[],u=[],f=[],p=0,d=0;m("z","y","x",-1,-1,n,e,t,a,r,0),m("z","y","x",1,-1,n,e,-t,a,r,1),m("x","z","y",1,1,t,n,e,i,a,2),m("x","z","y",1,-1,t,n,-e,i,a,3),m("x","y","z",1,-1,t,e,n,i,r,4),m("x","y","z",-1,-1,t,e,-n,i,r,5),this.setIndex(l),this.setAttribute("position",new ce(h,3)),this.setAttribute("normal",new ce(u,3)),this.setAttribute("uv",new ce(f,2));function m(_,c,g,y,w,S,C,R,M,E,U){let I=S/M,O=C/E,B=S/2,H=C/2,F=R/2,q=M+1,Y=E+1,X=0,$=0,W=new k;for(let j=0;j<Y;j++){let nt=j*O-H;for(let vt=0;vt<q;vt++){let zt=vt*I-B;W[_]=zt*y,W[c]=nt*w,W[g]=F,h.push(W.x,W.y,W.z),W[_]=0,W[c]=0,W[g]=R>0?1:-1,u.push(W.x,W.y,W.z),f.push(vt/M),f.push(1-j/E),X+=1}}for(let j=0;j<E;j++)for(let nt=0;nt<M;nt++){let vt=p+nt+q*j,zt=p+nt+q*(j+1),st=p+(nt+1)+q*(j+1),Rt=p+(nt+1)+q*j;l.push(vt,zt,Rt),l.push(zt,st,Rt),$+=6}o.addGroup(d,$,U),d+=$,p+=X}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},gr=class s extends Fe{constructor(t=1,e=1,n=4,i=8,r=1){super(),this.type="CapsuleGeometry",this.parameters={radius:t,height:e,capSegments:n,radialSegments:i,heightSegments:r},e=Math.max(0,e),n=Math.max(1,Math.floor(n)),i=Math.max(3,Math.floor(i)),r=Math.max(1,Math.floor(r));let a=[],o=[],l=[],h=[],u=e/2,f=Math.PI/2*t,p=e,d=2*f+p,m=n*2+r,_=i+1,c=new k,g=new k;for(let y=0;y<=m;y++){let w=0,S=0,C=0,R=0;if(y<=n){let U=y/n,I=U*Math.PI/2;S=-u-t*Math.cos(I),C=t*Math.sin(I),R=-t*Math.cos(I),w=U*f}else if(y<=n+r){let U=(y-n)/r;S=-u+U*e,C=t,R=0,w=f+U*p}else{let U=(y-n-r)/n,I=U*Math.PI/2;S=u+t*Math.sin(I),C=t*Math.cos(I),R=t*Math.sin(I),w=f+p+U*f}let M=Math.max(0,Math.min(1,w/d)),E=0;y===0?E=.5/i:y===m&&(E=-.5/i);for(let U=0;U<=i;U++){let I=U/i,O=I*Math.PI*2,B=Math.sin(O),H=Math.cos(O);g.x=-C*H,g.y=S,g.z=C*B,o.push(g.x,g.y,g.z),c.set(-C*H,R,C*B),c.normalize(),l.push(c.x,c.y,c.z),h.push(I+E,M)}if(y>0){let U=(y-1)*_;for(let I=0;I<i;I++){let O=U+I,B=U+I+1,H=y*_+I,F=y*_+I+1;a.push(O,B,H),a.push(B,F,H)}}}this.setIndex(a),this.setAttribute("position",new ce(o,3)),this.setAttribute("normal",new ce(l,3)),this.setAttribute("uv",new ce(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.radius,t.height,t.capSegments,t.radialSegments,t.heightSegments)}};var ri=class s extends Fe{constructor(t=1,e=1,n=1,i=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let h=this;i=Math.floor(i),r=Math.floor(r);let u=[],f=[],p=[],d=[],m=0,_=[],c=n/2,g=0;y(),a===!1&&(t>0&&w(!0),e>0&&w(!1)),this.setIndex(u),this.setAttribute("position",new ce(f,3)),this.setAttribute("normal",new ce(p,3)),this.setAttribute("uv",new ce(d,2));function y(){let S=new k,C=new k,R=0,M=(e-t)/n;for(let E=0;E<=r;E++){let U=[],I=E/r,O=I*(e-t)+t;for(let B=0;B<=i;B++){let H=B/i,F=H*l+o,q=Math.sin(F),Y=Math.cos(F);C.x=O*q,C.y=-I*n+c,C.z=O*Y,f.push(C.x,C.y,C.z),S.set(q,M,Y).normalize(),p.push(S.x,S.y,S.z),d.push(H,1-I),U.push(m++)}_.push(U)}for(let E=0;E<i;E++)for(let U=0;U<r;U++){let I=_[U][E],O=_[U+1][E],B=_[U+1][E+1],H=_[U][E+1];(t>0||U!==0)&&(u.push(I,O,H),R+=3),(e>0||U!==r-1)&&(u.push(O,B,H),R+=3)}h.addGroup(g,R,0),g+=R}function w(S){let C=m,R=new ft,M=new k,E=0,U=S===!0?t:e,I=S===!0?1:-1;for(let B=1;B<=i;B++)f.push(0,c*I,0),p.push(0,I,0),d.push(.5,.5),m++;let O=m;for(let B=0;B<=i;B++){let F=B/i*l+o,q=Math.cos(F),Y=Math.sin(F);M.x=U*Y,M.y=c*I,M.z=U*q,f.push(M.x,M.y,M.z),p.push(0,I,0),R.x=q*.5+.5,R.y=Y*.5*I+.5,d.push(R.x,R.y),m++}for(let B=0;B<i;B++){let H=C+B,F=O+B;S===!0?u.push(F,F+1,H):u.push(F+1,F,H),E+=3}h.addGroup(g,E,S===!0?1:2),g+=E}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Xi=class s extends ri{constructor(t=1,e=1,n=32,i=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,n,i,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:i,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new s(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},xr=class s extends Fe{constructor(t=[],e=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:i};let r=[],a=[];o(i),h(n),u(),this.setAttribute("position",new ce(r,3)),this.setAttribute("normal",new ce(r.slice(),3)),this.setAttribute("uv",new ce(a,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function o(y){let w=new k,S=new k,C=new k;for(let R=0;R<e.length;R+=3)d(e[R+0],w),d(e[R+1],S),d(e[R+2],C),l(w,S,C,y)}function l(y,w,S,C){let R=C+1,M=[];for(let E=0;E<=R;E++){M[E]=[];let U=y.clone().lerp(S,E/R),I=w.clone().lerp(S,E/R),O=R-E;for(let B=0;B<=O;B++)B===0&&E===R?M[E][B]=U:M[E][B]=U.clone().lerp(I,B/O)}for(let E=0;E<R;E++)for(let U=0;U<2*(R-E)-1;U++){let I=Math.floor(U/2);U%2===0?(p(M[E][I+1]),p(M[E+1][I]),p(M[E][I])):(p(M[E][I+1]),p(M[E+1][I+1]),p(M[E+1][I]))}}function h(y){let w=new k;for(let S=0;S<r.length;S+=3)w.x=r[S+0],w.y=r[S+1],w.z=r[S+2],w.normalize().multiplyScalar(y),r[S+0]=w.x,r[S+1]=w.y,r[S+2]=w.z}function u(){let y=new k;for(let w=0;w<r.length;w+=3){y.x=r[w+0],y.y=r[w+1],y.z=r[w+2];let S=c(y)/2/Math.PI+.5,C=g(y)/Math.PI+.5;a.push(S,1-C)}m(),f()}function f(){for(let y=0;y<a.length;y+=6){let w=a[y+0],S=a[y+2],C=a[y+4],R=Math.max(w,S,C),M=Math.min(w,S,C);R>.9&&M<.1&&(w<.2&&(a[y+0]+=1),S<.2&&(a[y+2]+=1),C<.2&&(a[y+4]+=1))}}function p(y){r.push(y.x,y.y,y.z)}function d(y,w){let S=y*3;w.x=t[S+0],w.y=t[S+1],w.z=t[S+2]}function m(){let y=new k,w=new k,S=new k,C=new k,R=new ft,M=new ft,E=new ft;for(let U=0,I=0;U<r.length;U+=9,I+=6){y.set(r[U+0],r[U+1],r[U+2]),w.set(r[U+3],r[U+4],r[U+5]),S.set(r[U+6],r[U+7],r[U+8]),R.set(a[I+0],a[I+1]),M.set(a[I+2],a[I+3]),E.set(a[I+4],a[I+5]),C.copy(y).add(w).add(S).divideScalar(3);let O=c(C);_(R,I+0,y,O),_(M,I+2,w,O),_(E,I+4,S,O)}}function _(y,w,S,C){C<0&&y.x===1&&(a[w]=y.x-1),S.x===0&&S.z===0&&(a[w]=C/2/Math.PI+.5)}function c(y){return Math.atan2(y.z,-y.x)}function g(y){return Math.atan2(-y.y,Math.sqrt(y.x*y.x+y.z*y.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.vertices,t.indices,t.radius,t.detail)}};var bn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){$t("Curve: .getPoint() not implemented.")}getPointAt(t,e){let n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let e=[],n,i=this.getPoint(0),r=0;e.push(0);for(let a=1;a<=t;a++)n=this.getPoint(a/t),r+=n.distanceTo(i),e.push(r),i=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e=null){let n=this.getLengths(),i=0,r=n.length,a;e?a=e:a=t*n[r-1];let o=0,l=r-1,h;for(;o<=l;)if(i=Math.floor(o+(l-o)/2),h=n[i]-a,h<0)o=i+1;else if(h>0)l=i-1;else{l=i;break}if(i=l,n[i]===a)return i/(r-1);let u=n[i],p=n[i+1]-u,d=(a-u)/p;return(i+d)/(r-1)}getTangent(t,e){let i=t-1e-4,r=t+1e-4;i<0&&(i=0),r>1&&(r=1);let a=this.getPoint(i),o=this.getPoint(r),l=e||(a.isVector2?new ft:new k);return l.copy(o).sub(a).normalize(),l}getTangentAt(t,e){let n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e=!1){let n=new k,i=[],r=[],a=[],o=new k,l=new fe;for(let d=0;d<=t;d++){let m=d/t;i[d]=this.getTangentAt(m,new k)}r[0]=new k,a[0]=new k;let h=Number.MAX_VALUE,u=Math.abs(i[0].x),f=Math.abs(i[0].y),p=Math.abs(i[0].z);u<=h&&(h=u,n.set(1,0,0)),f<=h&&(h=f,n.set(0,1,0)),p<=h&&n.set(0,0,1),o.crossVectors(i[0],n).normalize(),r[0].crossVectors(i[0],o),a[0].crossVectors(i[0],r[0]);for(let d=1;d<=t;d++){if(r[d]=r[d-1].clone(),a[d]=a[d-1].clone(),o.crossVectors(i[d-1],i[d]),o.length()>Number.EPSILON){o.normalize();let m=Math.acos(ue(i[d-1].dot(i[d]),-1,1));r[d].applyMatrix4(l.makeRotationAxis(o,m))}a[d].crossVectors(i[d],r[d])}if(e===!0){let d=Math.acos(ue(r[0].dot(r[t]),-1,1));d/=t,i[0].dot(o.crossVectors(r[0],r[t]))>0&&(d=-d);for(let m=1;m<=t;m++)r[m].applyMatrix4(l.makeRotationAxis(i[m],d*m)),a[m].crossVectors(i[m],r[m])}return{tangents:i,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this.cacheArcLengths=null,this}toJSON(){let t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this.cacheArcLengths=null,this}},As=class extends bn{constructor(t=0,e=0,n=1,i=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=i,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(t,e=new ft){let n=e,i=Math.PI*2,r=this.aEndAngle-this.aStartAngle,a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=i;for(;r>i;)r-=i;r<Number.EPSILON&&(a?r=0:r=i),this.aClockwise===!0&&!a&&(r===i?r=-i:r=r-i);let o=this.aStartAngle+t*r,l=this.aX+this.xRadius*Math.cos(o),h=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let u=Math.cos(this.aRotation),f=Math.sin(this.aRotation),p=l-this.aX,d=h-this.aY;l=p*u-d*f+this.aX,h=p*f+d*u+this.aY}return n.set(l,h)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){let t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}},qa=class extends As{constructor(t,e,n,i,r,a){super(t,e,n,n,i,r,a),this.isArcCurve=!0,this.type="ArcCurve"}};function Tc(){let s=0,t=0,e=0,n=0;function i(r,a,o,l){s=r,t=o,e=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,h){i(a,o,h*(o-r),h*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,h,u,f){let p=(a-r)/h-(o-r)/(h+u)+(o-a)/u,d=(o-a)/u-(l-a)/(u+f)+(l-o)/f;p*=u,d*=u,i(a,o,p,d)},calc:function(r){let a=r*r,o=a*r;return s+t*r+e*a+n*o}}}var Ch=new k,Ph=new k,Hl=new Tc,Gl=new Tc,Vl=new Tc,Ya=class extends bn{constructor(t=[],e=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=i}getPoint(t,e=new k){let n=e,i=this.points,r=i.length,a=(r-(this.closed?0:1))*t,o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let h,u;this.closed||o>0?h=i[(o-1)%r]:(Ph.subVectors(i[0],i[1]).add(i[0]),h=Ph);let f=i[o%r],p=i[(o+1)%r];if(this.closed||o+2<r?u=i[(o+2)%r]:(Ch.subVectors(i[r-1],i[r-2]).add(i[r-1]),u=Ch),this.curveType==="centripetal"||this.curveType==="chordal"){let d=this.curveType==="chordal"?.5:.25,m=Math.pow(h.distanceToSquared(f),d),_=Math.pow(f.distanceToSquared(p),d),c=Math.pow(p.distanceToSquared(u),d);_<1e-4&&(_=1),m<1e-4&&(m=_),c<1e-4&&(c=_),Hl.initNonuniformCatmullRom(h.x,f.x,p.x,u.x,m,_,c),Gl.initNonuniformCatmullRom(h.y,f.y,p.y,u.y,m,_,c),Vl.initNonuniformCatmullRom(h.z,f.z,p.z,u.z,m,_,c)}else this.curveType==="catmullrom"&&(Hl.initCatmullRom(h.x,f.x,p.x,u.x,this.tension),Gl.initCatmullRom(h.y,f.y,p.y,u.y,this.tension),Vl.initCatmullRom(h.z,f.z,p.z,u.z,this.tension));return n.set(Hl.calc(l),Gl.calc(l),Vl.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let i=t.points[e];this.points.push(i.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let i=this.points[e];t.points.push(i.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let i=t.points[e];this.points.push(new k().fromArray(i))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}};function Ih(s,t,e,n,i){let r=(n-t)*.5,a=(i-e)*.5,o=s*s,l=s*o;return(2*e-2*n+r+a)*l+(-3*e+3*n-2*r-a)*o+r*s+e}function hf(s,t){let e=1-s;return e*e*t}function uf(s,t){return 2*(1-s)*s*t}function df(s,t){return s*s*t}function tr(s,t,e,n){return hf(s,t)+uf(s,e)+df(s,n)}function ff(s,t){let e=1-s;return e*e*e*t}function pf(s,t){let e=1-s;return 3*e*e*s*t}function mf(s,t){return 3*(1-s)*s*s*t}function gf(s,t){return s*s*s*t}function er(s,t,e,n,i){return ff(s,t)+pf(s,e)+mf(s,n)+gf(s,i)}var _r=class extends bn{constructor(t=new ft,e=new ft,n=new ft,i=new ft){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new ft){let n=e,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(er(t,i.x,r.x,a.x,o.x),er(t,i.y,r.y,a.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},Za=class extends bn{constructor(t=new k,e=new k,n=new k,i=new k){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new k){let n=e,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(er(t,i.x,r.x,a.x,o.x),er(t,i.y,r.y,a.y,o.y),er(t,i.z,r.z,a.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},yr=class extends bn{constructor(t=new ft,e=new ft){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new ft){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new ft){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},$a=class extends bn{constructor(t=new k,e=new k){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new k){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new k){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},vr=class extends bn{constructor(t=new ft,e=new ft,n=new ft){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new ft){let n=e,i=this.v0,r=this.v1,a=this.v2;return n.set(tr(t,i.x,r.x,a.x),tr(t,i.y,r.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Ja=class extends bn{constructor(t=new k,e=new k,n=new k){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new k){let n=e,i=this.v0,r=this.v1,a=this.v2;return n.set(tr(t,i.x,r.x,a.x),tr(t,i.y,r.y,a.y),tr(t,i.z,r.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Mr=class extends bn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new ft){let n=e,i=this.points,r=(i.length-1)*t,a=Math.floor(r),o=r-a,l=i[a===0?a:a-1],h=i[a],u=i[a>i.length-2?i.length-1:a+1],f=i[a>i.length-3?i.length-1:a+2];return n.set(Ih(o,l.x,h.x,u.x,f.x),Ih(o,l.y,h.y,u.y,f.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let i=t.points[e];this.points.push(i.clone())}return this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let i=this.points[e];t.points.push(i.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let i=t.points[e];this.points.push(new ft().fromArray(i))}return this}},$l=Object.freeze({__proto__:null,ArcCurve:qa,CatmullRomCurve3:Ya,CubicBezierCurve:_r,CubicBezierCurve3:Za,EllipseCurve:As,LineCurve:yr,LineCurve3:$a,QuadraticBezierCurve:vr,QuadraticBezierCurve3:Ja,SplineCurve:Mr}),Ka=class extends bn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1,this.cacheLengths=null}add(t){this.curves.push(t)}closePath(){let t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){let n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new $l[n](e,t))}return this}getPoint(t,e){let n=t*this.getLength(),i=this.getCurveLengths(),r=0;for(;r<i.length;){if(i[r]>=n){let a=i[r]-n,o=this.curves[r],l=o.getLength(),h=l===0?0:1-a/l;return o.getPointAt(h,e)}r++}return null}getLength(){let t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let t=[],e=0;for(let n=0,i=this.curves.length;n<i;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){let e=[],n;for(let i=0,r=this.curves;i<r.length;i++){let a=r[i],o=a.isEllipseCurve?t*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?t*a.points.length:t,l=a.getPoints(o);for(let h=0;h<l.length;h++){let u=l[h];n&&n.equals(u)||(e.push(u),n=u)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){let i=t.curves[e];this.curves.push(i.clone())}return this.autoClose=t.autoClose,this.cacheLengths=null,this}toJSON(){let t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){let i=this.curves[e];t.curves.push(i.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){let i=t.curves[e];this.curves.push(new $l[i.type]().fromJSON(i))}return this.cacheLengths=null,this}},Sr=class extends Ka{constructor(t){super(),this.type="Path",this.currentPoint=new ft,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){let n=new yr(this.currentPoint.clone(),new ft(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,i){let r=new vr(this.currentPoint.clone(),new ft(t,e),new ft(n,i));return this.curves.push(r),this.currentPoint.set(n,i),this}bezierCurveTo(t,e,n,i,r,a){let o=new _r(this.currentPoint.clone(),new ft(t,e),new ft(n,i),new ft(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(t){let e=[this.currentPoint.clone()].concat(t),n=new Mr(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,i,r,a){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+o,e+l,n,i,r,a),this}absarc(t,e,n,i,r,a){return this.absellipse(t,e,n,n,i,r,a),this}ellipse(t,e,n,i,r,a,o,l){let h=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(t+h,e+u,n,i,r,a,o,l),this}absellipse(t,e,n,i,r,a,o,l){let h=new As(t,e,n,i,r,a,o,l);if(this.curves.length>0){let f=h.getPoint(0);f.equals(this.currentPoint)||this.lineTo(f.x,f.y)}this.curves.push(h);let u=h.getPoint(1);return this.currentPoint.copy(u),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){let t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}},Ri=class extends Sr{constructor(t){super(t),this.uuid=Os(),this.type="Shape",this.holes=[]}getPointsHoles(t){let e=[];for(let n=0,i=this.holes.length;n<i;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){let i=t.holes[e];this.holes.push(i.clone())}return this}toJSON(){let t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){let i=this.holes[e];t.holes.push(i.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){let i=t.holes[e];this.holes.push(new Sr().fromJSON(i))}return this}};function xf(s,t,e=2){let n=t&&t.length,i=n?t[0]*e:s.length,r=Cu(s,0,i,e,!0),a=[];if(!r||r.next===r.prev)return a;let o,l,h;if(n&&(r=Sf(s,t,r,e)),s.length>80*e){o=s[0],l=s[1];let u=o,f=l;for(let p=e;p<i;p+=e){let d=s[p],m=s[p+1];d<o&&(o=d),m<l&&(l=m),d>u&&(u=d),m>f&&(f=m)}h=Math.max(u-o,f-l),h=h!==0?32767/h:0}return br(r,a,e,o,l,h,0),a}function Cu(s,t,e,n,i){let r;if(i===Df(s,t,e,n)>0)for(let a=t;a<e;a+=n)r=Lh(a/n|0,s[a],s[a+1],r);else for(let a=e-n;a>=t;a-=n)r=Lh(a/n|0,s[a],s[a+1],r);return r&&Rs(r,r.next)&&(wr(r),r=r.next),r}function qi(s,t){if(!s)return s;t||(t=s);let e=s,n;do if(n=!1,!e.steiner&&(Rs(e,e.next)||Le(e.prev,e,e.next)===0)){if(wr(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function br(s,t,e,n,i,r,a){if(!s)return;!a&&r&&Af(s,n,i,r);let o=s;for(;s.prev!==s.next;){let l=s.prev,h=s.next;if(r?yf(s,n,i,r):_f(s)){t.push(l.i,s.i,h.i),wr(s),s=h.next,o=h.next;continue}if(s=h,s===o){a?a===1?(s=vf(qi(s),t),br(s,t,e,n,i,r,2)):a===2&&Mf(s,t,e,n,i,r):br(qi(s),t,e,n,i,r,1);break}}}function _f(s){let t=s.prev,e=s,n=s.next;if(Le(t,e,n)>=0)return!1;let i=t.x,r=e.x,a=n.x,o=t.y,l=e.y,h=n.y,u=Math.min(i,r,a),f=Math.min(o,l,h),p=Math.max(i,r,a),d=Math.max(o,l,h),m=n.next;for(;m!==t;){if(m.x>=u&&m.x<=p&&m.y>=f&&m.y<=d&&Qs(i,o,r,l,a,h,m.x,m.y)&&Le(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function yf(s,t,e,n){let i=s.prev,r=s,a=s.next;if(Le(i,r,a)>=0)return!1;let o=i.x,l=r.x,h=a.x,u=i.y,f=r.y,p=a.y,d=Math.min(o,l,h),m=Math.min(u,f,p),_=Math.max(o,l,h),c=Math.max(u,f,p),g=Jl(d,m,t,e,n),y=Jl(_,c,t,e,n),w=s.prevZ,S=s.nextZ;for(;w&&w.z>=g&&S&&S.z<=y;){if(w.x>=d&&w.x<=_&&w.y>=m&&w.y<=c&&w!==i&&w!==a&&Qs(o,u,l,f,h,p,w.x,w.y)&&Le(w.prev,w,w.next)>=0||(w=w.prevZ,S.x>=d&&S.x<=_&&S.y>=m&&S.y<=c&&S!==i&&S!==a&&Qs(o,u,l,f,h,p,S.x,S.y)&&Le(S.prev,S,S.next)>=0))return!1;S=S.nextZ}for(;w&&w.z>=g;){if(w.x>=d&&w.x<=_&&w.y>=m&&w.y<=c&&w!==i&&w!==a&&Qs(o,u,l,f,h,p,w.x,w.y)&&Le(w.prev,w,w.next)>=0)return!1;w=w.prevZ}for(;S&&S.z<=y;){if(S.x>=d&&S.x<=_&&S.y>=m&&S.y<=c&&S!==i&&S!==a&&Qs(o,u,l,f,h,p,S.x,S.y)&&Le(S.prev,S,S.next)>=0)return!1;S=S.nextZ}return!0}function vf(s,t){let e=s;do{let n=e.prev,i=e.next.next;!Rs(n,i)&&Iu(n,e,e.next,i)&&Tr(n,i)&&Tr(i,n)&&(t.push(n.i,e.i,i.i),wr(e),wr(e.next),e=s=i),e=e.next}while(e!==s);return qi(e)}function Mf(s,t,e,n,i,r){let a=s;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Pf(a,o)){let l=Lu(a,o);a=qi(a,a.next),l=qi(l,l.next),br(a,t,e,n,i,r,0),br(l,t,e,n,i,r,0);return}o=o.next}a=a.next}while(a!==s)}function Sf(s,t,e,n){let i=[];for(let r=0,a=t.length;r<a;r++){let o=t[r]*n,l=r<a-1?t[r+1]*n:s.length,h=Cu(s,o,l,n,!1);h===h.next&&(h.steiner=!0),i.push(Cf(h))}i.sort(bf);for(let r=0;r<i.length;r++)e=Tf(i[r],e);return e}function bf(s,t){let e=s.x-t.x;if(e===0&&(e=s.y-t.y,e===0)){let n=(s.next.y-s.y)/(s.next.x-s.x),i=(t.next.y-t.y)/(t.next.x-t.x);e=n-i}return e}function Tf(s,t){let e=wf(s,t);if(!e)return t;let n=Lu(e,s);return qi(n,n.next),qi(e,e.next)}function wf(s,t){let e=t,n=s.x,i=s.y,r=-1/0,a;if(Rs(s,e))return e;do{if(Rs(s,e.next))return e.next;if(i<=e.y&&i>=e.next.y&&e.next.y!==e.y){let f=e.x+(i-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(f<=n&&f>r&&(r=f,a=e.x<e.next.x?e:e.next,f===n))return a}e=e.next}while(e!==t);if(!a)return null;let o=a,l=a.x,h=a.y,u=1/0;e=a;do{if(n>=e.x&&e.x>=l&&n!==e.x&&Pu(i<h?n:r,i,l,h,i<h?r:n,i,e.x,e.y)){let f=Math.abs(i-e.y)/(n-e.x);Tr(e,s)&&(f<u||f===u&&(e.x>a.x||e.x===a.x&&Ef(a,e)))&&(a=e,u=f)}e=e.next}while(e!==o);return a}function Ef(s,t){return Le(s.prev,s,t.prev)<0&&Le(t.next,s,s.next)<0}function Af(s,t,e,n){let i=s;do i.z===0&&(i.z=Jl(i.x,i.y,t,e,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==s);i.prevZ.nextZ=null,i.prevZ=null,Rf(i)}function Rf(s){let t,e=1;do{let n=s,i;s=null;let r=null;for(t=0;n;){t++;let a=n,o=0;for(let h=0;h<e&&(o++,a=a.nextZ,!!a);h++);let l=e;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||n.z<=a.z)?(i=n,n=n.nextZ,o--):(i=a,a=a.nextZ,l--),r?r.nextZ=i:s=i,i.prevZ=r,r=i;n=a}r.nextZ=null,e*=2}while(t>1);return s}function Jl(s,t,e,n,i){return s=(s-e)*i|0,t=(t-n)*i|0,s=(s|s<<8)&16711935,s=(s|s<<4)&252645135,s=(s|s<<2)&858993459,s=(s|s<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,s|t<<1}function Cf(s){let t=s,e=s;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==s);return e}function Pu(s,t,e,n,i,r,a,o){return(i-a)*(t-o)>=(s-a)*(r-o)&&(s-a)*(n-o)>=(e-a)*(t-o)&&(e-a)*(r-o)>=(i-a)*(n-o)}function Qs(s,t,e,n,i,r,a,o){return!(s===a&&t===o)&&Pu(s,t,e,n,i,r,a,o)}function Pf(s,t){return s.next.i!==t.i&&s.prev.i!==t.i&&!If(s,t)&&(Tr(s,t)&&Tr(t,s)&&Lf(s,t)&&(Le(s.prev,s,t.prev)||Le(s,t.prev,t))||Rs(s,t)&&Le(s.prev,s,s.next)>0&&Le(t.prev,t,t.next)>0)}function Le(s,t,e){return(t.y-s.y)*(e.x-t.x)-(t.x-s.x)*(e.y-t.y)}function Rs(s,t){return s.x===t.x&&s.y===t.y}function Iu(s,t,e,n){let i=Ea(Le(s,t,e)),r=Ea(Le(s,t,n)),a=Ea(Le(e,n,s)),o=Ea(Le(e,n,t));return!!(i!==r&&a!==o||i===0&&wa(s,e,t)||r===0&&wa(s,n,t)||a===0&&wa(e,s,n)||o===0&&wa(e,t,n))}function wa(s,t,e){return t.x<=Math.max(s.x,e.x)&&t.x>=Math.min(s.x,e.x)&&t.y<=Math.max(s.y,e.y)&&t.y>=Math.min(s.y,e.y)}function Ea(s){return s>0?1:s<0?-1:0}function If(s,t){let e=s;do{if(e.i!==s.i&&e.next.i!==s.i&&e.i!==t.i&&e.next.i!==t.i&&Iu(e,e.next,s,t))return!0;e=e.next}while(e!==s);return!1}function Tr(s,t){return Le(s.prev,s,s.next)<0?Le(s,t,s.next)>=0&&Le(s,s.prev,t)>=0:Le(s,t,s.prev)<0||Le(s,s.next,t)<0}function Lf(s,t){let e=s,n=!1,i=(s.x+t.x)/2,r=(s.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&i<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==s);return n}function Lu(s,t){let e=Kl(s.i,s.x,s.y),n=Kl(t.i,t.x,t.y),i=s.next,r=t.prev;return s.next=t,t.prev=s,e.next=i,i.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function Lh(s,t,e,n){let i=Kl(s,t,e);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function wr(s){s.next.prev=s.prev,s.prev.next=s.next,s.prevZ&&(s.prevZ.nextZ=s.nextZ),s.nextZ&&(s.nextZ.prevZ=s.prevZ)}function Kl(s,t,e){return{i:s,x:t,y:e,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Df(s,t,e,n){let i=0;for(let r=t,a=e-n;r<e;r+=n)i+=(s[a]-s[r])*(s[r+1]+s[a+1]),a=r;return i}var Ql=class{static triangulate(t,e,n=2){return xf(t,e,n)}},Vn=class s{static area(t){let e=t.length,n=0;for(let i=e-1,r=0;r<e;i=r++)n+=t[i].x*t[r].y-t[r].x*t[i].y;return n*.5}static isClockWise(t){return s.area(t)<0}static triangulateShape(t,e){let n=[],i=[],r=[];Dh(t),Nh(n,t);let a=t.length;e.forEach(Dh);for(let l=0;l<e.length;l++)i.push(a),a+=e[l].length,Nh(n,e[l]);let o=Ql.triangulate(n,i);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}};function Dh(s){let t=s.length;t>2&&s[t-1].equals(s[0])&&s.pop()}function Nh(s,t){for(let e=0;e<t.length;e++)s.push(t[e].x),s.push(t[e].y)}var Er=class s extends Fe{constructor(t=new Ri([new ft(.5,.5),new ft(-.5,.5),new ft(-.5,-.5),new ft(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];let n=this,i=[],r=[];for(let o=0,l=t.length;o<l;o++){let h=t[o];a(h)}this.setAttribute("position",new ce(i,3)),this.setAttribute("uv",new ce(r,2)),this.computeVertexNormals();function a(o){let l=[],h=e.curveSegments!==void 0?e.curveSegments:12,u=e.steps!==void 0?e.steps:1,f=e.depth!==void 0?e.depth:1,p=e.bevelEnabled!==void 0?e.bevelEnabled:!0,d=e.bevelThickness!==void 0?e.bevelThickness:.2,m=e.bevelSize!==void 0?e.bevelSize:d-.1,_=e.bevelOffset!==void 0?e.bevelOffset:0,c=e.bevelSegments!==void 0?e.bevelSegments:3,g=e.extrudePath,y=e.UVGenerator!==void 0?e.UVGenerator:Nf,w,S=!1,C,R,M,E;if(g){w=g.getSpacedPoints(u),S=!0,p=!1;let lt=g.isCatmullRomCurve3?g.closed:!1;C=g.computeFrenetFrames(u,lt),R=new k,M=new k,E=new k}p||(c=0,d=0,m=0,_=0);let U=o.extractPoints(h),I=U.shape,O=U.holes;if(!Vn.isClockWise(I)){I=I.reverse();for(let lt=0,Mt=O.length;lt<Mt;lt++){let _t=O[lt];Vn.isClockWise(_t)&&(O[lt]=_t.reverse())}}function H(lt){let _t=10000000000000001e-36,Dt=lt[0];for(let Et=1;Et<=lt.length;Et++){let Qt=Et%lt.length,Ht=lt[Qt],oe=Ht.x-Dt.x,le=Ht.y-Dt.y,ge=oe*oe+le*le,x=Math.max(Math.abs(Ht.x),Math.abs(Ht.y),Math.abs(Dt.x),Math.abs(Dt.y)),P=_t*x*x;if(ge<=P){lt.splice(Qt,1),Et--;continue}Dt=Ht}}H(I),O.forEach(H);let F=O.length,q=I;for(let lt=0;lt<F;lt++){let Mt=O[lt];I=I.concat(Mt)}function Y(lt,Mt,_t){return Mt||Jt("ExtrudeGeometry: vec does not exist"),lt.clone().addScaledVector(Mt,_t)}let X=I.length;function $(lt,Mt,_t){let Dt,Et,Qt,Ht=lt.x-Mt.x,oe=lt.y-Mt.y,le=_t.x-lt.x,ge=_t.y-lt.y,x=Ht*Ht+oe*oe,P=Ht*ge-oe*le;if(Math.abs(P)>Number.EPSILON){let N=Math.sqrt(x),D=Math.sqrt(le*le+ge*ge),V=Mt.x-oe/N,ut=Mt.y+Ht/N,at=_t.x-ge/D,T=_t.y+le/D,b=((at-V)*ge-(T-ut)*le)/(Ht*ge-oe*le);Dt=V+Ht*b-lt.x,Et=ut+oe*b-lt.y;let v=Dt*Dt+Et*Et;if(v<=2)return new ft(Dt,Et);Qt=Math.sqrt(v/2)}else{let N=!1;Ht>Number.EPSILON?le>Number.EPSILON&&(N=!0):Ht<-Number.EPSILON?le<-Number.EPSILON&&(N=!0):Math.sign(oe)===Math.sign(ge)&&(N=!0),N?(Dt=-oe,Et=Ht,Qt=Math.sqrt(x)):(Dt=Ht,Et=oe,Qt=Math.sqrt(x/2))}return new ft(Dt/Qt,Et/Qt)}let W=[];for(let lt=0,Mt=q.length,_t=Mt-1,Dt=lt+1;lt<Mt;lt++,_t++,Dt++)_t===Mt&&(_t=0),Dt===Mt&&(Dt=0),W[lt]=$(q[lt],q[_t],q[Dt]);let j=[],nt,vt=W.concat();for(let lt=0,Mt=F;lt<Mt;lt++){let _t=O[lt];nt=[];for(let Dt=0,Et=_t.length,Qt=Et-1,Ht=Dt+1;Dt<Et;Dt++,Qt++,Ht++)Qt===Et&&(Qt=0),Ht===Et&&(Ht=0),nt[Dt]=$(_t[Dt],_t[Qt],_t[Ht]);j.push(nt),vt=vt.concat(nt)}let zt;if(c===0)zt=Vn.triangulateShape(q,O);else{let lt=[],Mt=[];for(let _t=0;_t<c;_t++){let Dt=_t/c,Et=d*Math.cos(Dt*Math.PI/2),Qt=m*Math.sin(Dt*Math.PI/2)+_;for(let Ht=0,oe=q.length;Ht<oe;Ht++){let le=Y(q[Ht],W[Ht],Qt);Ut(le.x,le.y,-Et),Dt===0&&lt.push(le)}for(let Ht=0,oe=F;Ht<oe;Ht++){let le=O[Ht];nt=j[Ht];let ge=[];for(let x=0,P=le.length;x<P;x++){let N=Y(le[x],nt[x],Qt);Ut(N.x,N.y,-Et),Dt===0&&ge.push(N)}Dt===0&&Mt.push(ge)}}zt=Vn.triangulateShape(lt,Mt)}let st=zt.length,Rt=m+_;for(let lt=0;lt<X;lt++){let Mt=p?Y(I[lt],vt[lt],Rt):I[lt];S?(M.copy(C.normals[0]).multiplyScalar(Mt.x),R.copy(C.binormals[0]).multiplyScalar(Mt.y),E.copy(w[0]).add(M).add(R),Ut(E.x,E.y,E.z)):Ut(Mt.x,Mt.y,0)}for(let lt=1;lt<=u;lt++)for(let Mt=0;Mt<X;Mt++){let _t=p?Y(I[Mt],vt[Mt],Rt):I[Mt];S?(M.copy(C.normals[lt]).multiplyScalar(_t.x),R.copy(C.binormals[lt]).multiplyScalar(_t.y),E.copy(w[lt]).add(M).add(R),Ut(E.x,E.y,E.z)):Ut(_t.x,_t.y,f/u*lt)}for(let lt=c-1;lt>=0;lt--){let Mt=lt/c,_t=d*Math.cos(Mt*Math.PI/2),Dt=m*Math.sin(Mt*Math.PI/2)+_;for(let Et=0,Qt=q.length;Et<Qt;Et++){let Ht=Y(q[Et],W[Et],Dt);Ut(Ht.x,Ht.y,f+_t)}for(let Et=0,Qt=O.length;Et<Qt;Et++){let Ht=O[Et];nt=j[Et];for(let oe=0,le=Ht.length;oe<le;oe++){let ge=Y(Ht[oe],nt[oe],Dt);S?Ut(ge.x,ge.y+w[u-1].y,w[u-1].x+_t):Ut(ge.x,ge.y,f+_t)}}}Nt(),kt();function Nt(){let lt=i.length/3;if(p){let Mt=0,_t=X*Mt;for(let Dt=0;Dt<st;Dt++){let Et=zt[Dt];we(Et[2]+_t,Et[1]+_t,Et[0]+_t)}Mt=u+c*2,_t=X*Mt;for(let Dt=0;Dt<st;Dt++){let Et=zt[Dt];we(Et[0]+_t,Et[1]+_t,Et[2]+_t)}}else{for(let Mt=0;Mt<st;Mt++){let _t=zt[Mt];we(_t[2],_t[1],_t[0])}for(let Mt=0;Mt<st;Mt++){let _t=zt[Mt];we(_t[0]+X*u,_t[1]+X*u,_t[2]+X*u)}}n.addGroup(lt,i.length/3-lt,0)}function kt(){let lt=i.length/3,Mt=0;wt(q,Mt),Mt+=q.length;for(let _t=0,Dt=O.length;_t<Dt;_t++){let Et=O[_t];wt(Et,Mt),Mt+=Et.length}n.addGroup(lt,i.length/3-lt,1)}function wt(lt,Mt){let _t=lt.length;for(;--_t>=0;){let Dt=_t,Et=_t-1;Et<0&&(Et=lt.length-1);for(let Qt=0,Ht=u+c*2;Qt<Ht;Qt++){let oe=X*Qt,le=X*(Qt+1),ge=Mt+Dt+oe,x=Mt+Et+oe,P=Mt+Et+le,N=Mt+Dt+le;Vt(ge,x,P,N)}}}function Ut(lt,Mt,_t){l.push(lt),l.push(Mt),l.push(_t)}function we(lt,Mt,_t){ee(lt),ee(Mt),ee(_t);let Dt=i.length/3,Et=y.generateTopUV(n,i,Dt-3,Dt-2,Dt-1);ne(Et[0]),ne(Et[1]),ne(Et[2])}function Vt(lt,Mt,_t,Dt){ee(lt),ee(Mt),ee(Dt),ee(Mt),ee(_t),ee(Dt);let Et=i.length/3,Qt=y.generateSideWallUV(n,i,Et-6,Et-3,Et-2,Et-1);ne(Qt[0]),ne(Qt[1]),ne(Qt[3]),ne(Qt[1]),ne(Qt[2]),ne(Qt[3])}function ee(lt){i.push(l[lt*3+0]),i.push(l[lt*3+1]),i.push(l[lt*3+2])}function ne(lt){r.push(lt.x),r.push(lt.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return Uf(e,n,t)}static fromJSON(t,e){let n=[];for(let r=0,a=t.shapes.length;r<a;r++){let o=e[t.shapes[r]];n.push(o)}let i=t.options.extrudePath;return i!==void 0&&(t.options.extrudePath=new $l[i.type]().fromJSON(i)),new s(n,t.options)}},Nf={generateTopUV:function(s,t,e,n,i){let r=t[e*3],a=t[e*3+1],o=t[n*3],l=t[n*3+1],h=t[i*3],u=t[i*3+1];return[new ft(r,a),new ft(o,l),new ft(h,u)]},generateSideWallUV:function(s,t,e,n,i,r){let a=t[e*3],o=t[e*3+1],l=t[e*3+2],h=t[n*3],u=t[n*3+1],f=t[n*3+2],p=t[i*3],d=t[i*3+1],m=t[i*3+2],_=t[r*3],c=t[r*3+1],g=t[r*3+2];return Math.abs(o-u)<Math.abs(a-h)?[new ft(a,1-l),new ft(h,1-f),new ft(p,1-m),new ft(_,1-g)]:[new ft(o,1-l),new ft(u,1-f),new ft(d,1-m),new ft(c,1-g)]}};function Uf(s,t,e){if(e.shapes=[],Array.isArray(s))for(let n=0,i=s.length;n<i;n++){let r=s[n];e.shapes.push(r.uuid)}else e.shapes.push(s.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}var Ar=class s extends xr{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,i=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new s(t.radius,t.detail)}},Yi=class s extends Fe{constructor(t=[new ft(0,-.5),new ft(.5,0),new ft(0,.5)],e=12,n=0,i=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:i},e=Math.floor(e),i=ue(i,0,Math.PI*2);let r=[],a=[],o=[],l=[],h=[],u=1/e,f=new k,p=new ft,d=new k,m=new k,_=new k,c=0,g=0;for(let y=0;y<=t.length-1;y++)switch(y){case 0:c=t[y+1].x-t[y].x,g=t[y+1].y-t[y].y,d.x=g*1,d.y=-c,d.z=g*0,_.copy(d),d.normalize(),l.push(d.x,d.y,d.z);break;case t.length-1:_.normalize(),l.push(_.x,_.y,_.z);break;default:c=t[y+1].x-t[y].x,g=t[y+1].y-t[y].y,d.x=g*1,d.y=-c,d.z=g*0,m.copy(d),d.x+=_.x,d.y+=_.y,d.z+=_.z,d.normalize(),l.push(d.x,d.y,d.z),_.copy(m)}for(let y=0;y<=e;y++){let w=n+y*u*i,S=Math.sin(w),C=Math.cos(w);for(let R=0;R<=t.length-1;R++){f.x=t[R].x*S,f.y=t[R].y,f.z=t[R].x*C,a.push(f.x,f.y,f.z),p.x=y/e,p.y=R/(t.length-1),o.push(p.x,p.y);let M=l[3*R+0]*S,E=l[3*R+1],U=l[3*R+0]*C;h.push(M,E,U)}}for(let y=0;y<e;y++)for(let w=0;w<t.length-1;w++){let S=w+y*t.length,C=S,R=S+t.length,M=S+t.length+1,E=S+1;r.push(C,R,E),r.push(M,E,R)}this.setIndex(r),this.setAttribute("position",new ce(a,3)),this.setAttribute("uv",new ce(o,2)),this.setAttribute("normal",new ce(h,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.points,t.segments,t.phiStart,t.phiLength)}},gn=class s extends xr{constructor(t=1,e=0){let n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],i=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,i,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new s(t.radius,t.detail)}},Cn=class s extends Fe{constructor(t=1,e=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:i};let r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(i),h=o+1,u=l+1,f=t/o,p=e/l,d=[],m=[],_=[],c=[];for(let g=0;g<u;g++){let y=g*p-a;for(let w=0;w<h;w++){let S=w*f-r;m.push(S,-y,0),_.push(0,0,1),c.push(w/o),c.push(1-g/l)}}for(let g=0;g<l;g++)for(let y=0;y<o;y++){let w=y+h*g,S=y+h*(g+1),C=y+1+h*(g+1),R=y+1+h*g;d.push(w,S,R),d.push(S,C,R)}this.setIndex(d),this.setAttribute("position",new ce(m,3)),this.setAttribute("normal",new ce(_,3)),this.setAttribute("uv",new ce(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.width,t.height,t.widthSegments,t.heightSegments)}};var Rr=class s extends Fe{constructor(t=new Ri([new ft(0,.5),new ft(-.5,-.5),new ft(.5,-.5)]),e=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:e};let n=[],i=[],r=[],a=[],o=0,l=0;if(Array.isArray(t)===!1)h(t);else for(let u=0;u<t.length;u++)h(t[u]),this.addGroup(o,l,u),o+=l,l=0;this.setIndex(n),this.setAttribute("position",new ce(i,3)),this.setAttribute("normal",new ce(r,3)),this.setAttribute("uv",new ce(a,2));function h(u){let f=i.length/3,p=u.extractPoints(e),d=p.shape,m=p.holes;Vn.isClockWise(d)===!1&&(d=d.reverse());for(let c=0,g=m.length;c<g;c++){let y=m[c];Vn.isClockWise(y)===!0&&(m[c]=y.reverse())}let _=Vn.triangulateShape(d,m);for(let c=0,g=m.length;c<g;c++){let y=m[c];d=d.concat(y)}for(let c=0,g=d.length;c<g;c++){let y=d[c];i.push(y.x,y.y,0),r.push(0,0,1),a.push(y.x,y.y)}for(let c=0,g=_.length;c<g;c++){let y=_[c],w=y[0]+f,S=y[1]+f,C=y[2]+f;n.push(w,S,C),l+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON(),e=this.parameters.shapes;return Ff(e,t)}static fromJSON(t,e){let n=[];for(let i=0,r=t.shapes.length;i<r;i++){let a=e[t.shapes[i]];n.push(a)}return new s(n,t.curveSegments)}};function Ff(s,t){if(t.shapes=[],Array.isArray(s))for(let e=0,n=s.length;e<n;e++){let i=s[e];t.shapes.push(i.uuid)}else t.shapes.push(s.uuid);return t}var Pn=class s extends Fe{constructor(t=1,e=32,n=16,i=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:i,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),h=0,u=[],f=new k,p=new k,d=[],m=[],_=[],c=[];for(let g=0;g<=n;g++){let y=[],w=g/n,S=a+w*o,C=t*Math.cos(S),R=Math.sqrt(t*t-C*C),M=0;g===0&&a===0?M=.5/e:g===n&&l===Math.PI&&(M=-.5/e);for(let E=0;E<=e;E++){let U=E/e,I=i+U*r;f.x=-R*Math.cos(I),f.y=C,f.z=R*Math.sin(I),m.push(f.x,f.y,f.z),p.copy(f).normalize(),_.push(p.x,p.y,p.z),c.push(U+M,1-w),y.push(h++)}u.push(y)}for(let g=0;g<n;g++)for(let y=0;y<e;y++){let w=u[g][y+1],S=u[g][y],C=u[g+1][y],R=u[g+1][y+1];(g!==0||a>0)&&d.push(w,S,R),(g!==n-1||l<Math.PI)&&d.push(S,C,R)}this.setIndex(d),this.setAttribute("position",new ce(m,3)),this.setAttribute("normal",new ce(_,3)),this.setAttribute("uv",new ce(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var ze=class s extends Fe{constructor(t=1,e=.4,n=12,i=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:i,arc:r,thetaStart:a,thetaLength:o},n=Math.floor(n),i=Math.floor(i);let l=[],h=[],u=[],f=[],p=new k,d=new k,m=new k;for(let _=0;_<=n;_++){let c=a+_/n*o;for(let g=0;g<=i;g++){let y=g/i*r;d.x=(t+e*Math.cos(c))*Math.cos(y),d.y=(t+e*Math.cos(c))*Math.sin(y),d.z=e*Math.sin(c),h.push(d.x,d.y,d.z),p.x=t*Math.cos(y),p.y=t*Math.sin(y),m.subVectors(d,p).normalize(),u.push(m.x,m.y,m.z),f.push(g/i),f.push(_/n)}}for(let _=1;_<=n;_++)for(let c=1;c<=i;c++){let g=(i+1)*_+c-1,y=(i+1)*(_-1)+c-1,w=(i+1)*(_-1)+c,S=(i+1)*_+c;l.push(g,y,S),l.push(y,w,S)}this.setIndex(l),this.setAttribute("position",new ce(h,3)),this.setAttribute("normal",new ce(u,3)),this.setAttribute("uv",new ce(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}};function ns(s){let t={};for(let e in s){t[e]={};for(let n in s[e]){let i=s[e][n];if(Uh(i))i.isRenderTargetTexture?($t("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone();else if(Array.isArray(i))if(Uh(i[0])){let r=[];for(let a=0,o=i.length;a<o;a++)r[a]=i[a].clone();t[e][n]=r}else t[e][n]=i.slice();else t[e][n]=i}}return t}function on(s){let t={};for(let e=0;e<s.length;e++){let n=ns(s[e]);for(let i in n)t[i]=n[i]}return t}function Uh(s){return s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)}function Of(s){let t=[];for(let e=0;e<s.length;e++)t.push(s[e].clone());return t}function wc(s){let t=s.getRenderTarget();return t===null?s.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:he.workingColorSpace}var hi={clone:ns,merge:on},Bf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,zf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,ke=class extends Si{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Bf,this.fragmentShader=zf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ns(t.uniforms),this.uniformsGroups=Of(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let i in this.uniforms){let a=this.uniforms[i].value;a&&a.isTexture?e.uniforms[i]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[i]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[i]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[i]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[i]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[i]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[i]={type:"m4",value:a.toArray()}:e.uniforms[i]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(let n in t.uniforms){let i=t.uniforms[n];switch(this.uniforms[n]={},i.type){case"t":this.uniforms[n].value=e[i.value]||null;break;case"c":this.uniforms[n].value=new Xt().setHex(i.value);break;case"v2":this.uniforms[n].value=new ft().fromArray(i.value);break;case"v3":this.uniforms[n].value=new k().fromArray(i.value);break;case"v4":this.uniforms[n].value=new Pe().fromArray(i.value);break;case"m3":this.uniforms[n].value=new jt().fromArray(i.value);break;case"m4":this.uniforms[n].value=new fe().fromArray(i.value);break;default:this.uniforms[n].value=i.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},Cs=class extends ke{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},Zi=class extends Si{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Xt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Xt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=jo,this.normalScale=new ft(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new rn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}};var Qa=class extends Si{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=pu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},ja=class extends Si{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function ms(s,t){return!s||s.constructor===t?s:typeof t.BYTES_PER_ELEMENT=="number"?new t(s):Array.prototype.slice.call(s)}function Aa(s){return s!==void 0&&s.inTangents!==void 0&&s.outTangents!==void 0}var Ci=class{constructor(t,e,n,i){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,i=e[n],r=e[n-1];n:{t:{let a;e:{i:if(!(t<i)){for(let o=n+2;;){if(i===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=i,i=e[++n],t<i)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=r,r=e[--n-1],t>=r)break t}a=n,n=0;break e}break n}for(;n<a;){let o=n+a>>>1;t<e[o]?a=o:n=o+1}if(i=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,t,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=t*i;for(let a=0;a!==i;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},to=class extends Ci{constructor(t,e,n,i){super(t,e,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:ql,endingEnd:ql}}intervalChanged_(t,e,n){let i=this.parameterPositions,r=t-2,a=t+1,o=i[r],l=i[a];if(o===void 0)switch(this.getSettings_().endingStart){case Yl:r=t,o=2*e-n;break;case Zl:r=i.length-2,o=e+i[r]-i[r+1];break;default:r=t,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Yl:a=t,l=2*n-e;break;case Zl:a=1,l=n+i[1]-i[0];break;default:a=t-1,l=e}let h=(n-e)*.5,u=this.valueSize;this._weightPrev=h/(e-o),this._weightNext=h/(l-n),this._offsetPrev=r*u,this._offsetNext=a*u}interpolate_(t,e,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,h=l-o,u=this._offsetPrev,f=this._offsetNext,p=this._weightPrev,d=this._weightNext,m=(n-e)/(i-e),_=m*m,c=_*m,g=-p*c+2*p*_-p*m,y=(1+p)*c+(-1.5-2*p)*_+(-.5+p)*m+1,w=(-1-d)*c+(1.5+d)*_+.5*m,S=d*c-d*_;for(let C=0;C!==o;++C)r[C]=g*a[u+C]+y*a[h+C]+w*a[l+C]+S*a[f+C];return r}},eo=class extends Ci{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,h=l-o,u=(n-e)/(i-e),f=1-u;for(let p=0;p!==o;++p)r[p]=a[h+p]*f+a[l+p]*u;return r}},no=class extends Ci{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t){return this.copySampleValue_(t-1)}},io=class extends Ci{interpolate_(t,e,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,h=l-o,u=this.inTangents,f=this.outTangents;if(!u||!f){let m=(n-e)/(i-e),_=1-m;for(let c=0;c!==o;++c)r[c]=a[h+c]*_+a[l+c]*m;return r}let p=o*2,d=t-1;for(let m=0;m!==o;++m){let _=a[h+m],c=a[l+m],g=d*p+m*2,y=f[g],w=f[g+1],S=t*p+m*2,C=u[S],R=u[S+1],M=Hf(n,e,y,C,i);r[m]=Du(M,_,w,R,c)}return r}};function Du(s,t,e,n,i){let r=1-s;return r*r*r*t+3*r*r*s*e+3*r*s*s*n+s*s*s*i}function kf(s,t,e,n,i){let r=1-s;return 3*r*r*(e-t)+6*r*s*(n-e)+3*s*s*(i-n)}function Hf(s,t,e,n,i){let r=(s-t)/(i-t);for(let a=0;a<8;a++){let o=Du(r,t,e,n,i)-s;if(Math.abs(o)<1e-10)break;let l=kf(r,t,e,n,i);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}var Tn=class{constructor(t,e,n,i){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=ms(e,this.TimeBufferType),this.values=ms(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:ms(t.times,Array),values:ms(t.values,Array)};let i=t.getInterpolation();i!==t.DefaultInterpolation&&(n.interpolation=i),Aa(t.settings)&&(n.settings={inTangents:ms(t.settings.inTangents,Array),outTangents:ms(t.settings.outTangents,Array)})}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new no(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new eo(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new to(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new io(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case nr:e=this.InterpolantFactoryMethodDiscrete;break;case ka:e=this.InterpolantFactoryMethodLinear;break;case Pa:e=this.InterpolantFactoryMethodSmooth;break;case Xl:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return $t("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return nr;case this.InterpolantFactoryMethodLinear:return ka;case this.InterpolantFactoryMethodSmooth:return Pa;case this.InterpolantFactoryMethodBezier:return Xl}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]+=t;Aa(this.settings)&&(Fh(this.settings.inTangents,t),Fh(this.settings.outTangents,t))}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]*=t;Aa(this.settings)&&(Oh(this.settings.inTangents,t),Oh(this.settings.outTangents,t))}return this}trim(t,e){let n=this.times,i=n.length,r=0,a=i-1;for(;r!==i&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==i){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Jt("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,i=this.values,r=n.length;r===0&&(Jt("KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){Jt("KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(a!==null&&a>l){Jt("KeyframeTrack: Out of order keys.",this,o,l,a),t=!1;break}a=l}if(i!==void 0&&kd(i))for(let o=0,l=i.length;o!==l;++o){let h=i[o];if(isNaN(h)){Jt("KeyframeTrack: Value is not a valid number.",this,o,h),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===Pa,r=t.length-1,a=1;for(let o=1;o<r;++o){let l=!1,h=t[o],u=t[o+1];if(h!==u&&(o!==1||h!==t[0]))if(i)l=!0;else{let f=o*n,p=f-n,d=f+n;for(let m=0;m!==n;++m){let _=e[f+m];if(_!==e[p+m]||_!==e[d+m]){l=!0;break}}}if(l){if(o!==a){t[a]=t[o];let f=o*n,p=a*n;for(let d=0;d!==n;++d)e[p+d]=e[f+d]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,l=a*n,h=0;h!==n;++h)e[l+h]=e[o+h];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,i=new n(this.name,t,e);return i.createInterpolant=this.createInterpolant,Aa(this.settings)&&(i.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),i}};function Fh(s,t){for(let e=0,n=s.length;e!==n;e+=2)s[e]+=t}function Oh(s,t){for(let e=0,n=s.length;e!==n;e+=2)s[e]*=t}Tn.prototype.ValueTypeName="";Tn.prototype.TimeBufferType=Float32Array;Tn.prototype.ValueBufferType=Float32Array;Tn.prototype.DefaultInterpolation=ka;var Pi=class extends Tn{constructor(t,e,n){super(t,e,n)}};Pi.prototype.ValueTypeName="bool";Pi.prototype.ValueBufferType=Array;Pi.prototype.DefaultInterpolation=nr;Pi.prototype.InterpolantFactoryMethodLinear=void 0;Pi.prototype.InterpolantFactoryMethodSmooth=void 0;var so=class extends Tn{constructor(t,e,n,i){super(t,e,n,i)}};so.prototype.ValueTypeName="color";var ro=class extends Tn{constructor(t,e,n,i){super(t,e,n,i)}};ro.prototype.ValueTypeName="number";var ao=class extends Ci{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-e)/(i-e),h=t*o;for(let u=h+o;h!==u;h+=4)Je.slerpFlat(r,0,a,h-o,a,h,l);return r}},Cr=class extends Tn{constructor(t,e,n,i){super(t,e,n,i)}InterpolantFactoryMethodLinear(t){return new ao(this.times,this.values,this.getValueSize(),t)}};Cr.prototype.ValueTypeName="quaternion";Cr.prototype.InterpolantFactoryMethodSmooth=void 0;var Ii=class extends Tn{constructor(t,e,n){super(t,e,n)}};Ii.prototype.ValueTypeName="string";Ii.prototype.ValueBufferType=Array;Ii.prototype.DefaultInterpolation=nr;Ii.prototype.InterpolantFactoryMethodLinear=void 0;Ii.prototype.InterpolantFactoryMethodSmooth=void 0;var oo=class extends Tn{constructor(t,e,n,i){super(t,e,n,i)}};oo.prototype.ValueTypeName="vector";var lo=class{constructor(t,e,n){let i=this,r=!1,a=0,o=0,l,h=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(u){o++,r===!1&&i.onStart!==void 0&&i.onStart(u,a,o),r=!0},this.itemEnd=function(u){a++,i.onProgress!==void 0&&i.onProgress(u,a,o),a===o&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(u){i.onError!==void 0&&i.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,f){return h.push(u,f),this},this.removeHandler=function(u){let f=h.indexOf(u);return f!==-1&&h.splice(f,2),this},this.getHandler=function(u){for(let f=0,p=h.length;f<p;f+=2){let d=h[f],m=h[f+1];if(d.global&&(d.lastIndex=0),d.test(u))return m}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Nu=new lo,co=class{constructor(t){this.manager=t!==void 0?t:Nu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(i,r){n.load(t,i,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}setPriority(t){return this.priority=t,this}setCache(t){return this.cache=t,this}abort(){return this}};co.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ps=class extends an{static registerNode(t){this.prototype._lightNode=t}constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Xt(t),this.intensity=e}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}},Pr=class extends Ps{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(an.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Xt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){let e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}},Wl=new fe,Bh=new k,zh=new k,Ir=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ft(512,512),this.mapType=xn,this.map=null,this.mapPass=null,this.matrix=new fe,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ei,this._frameExtents=new ft(1,1),this._viewportCount=1,this._viewports=[new Pe(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera;Bh.setFromMatrixPosition(t.matrixWorld),e.position.copy(Bh),zh.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(zh),e.updateMatrixWorld(),this._updateMatrix(e,this.matrix,this._frustum)}_updateMatrix(t,e,n,i){Wl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),n.setFromProjectionMatrix(Wl,t.coordinateSystem,t.reversedDepth);let r=this._frameExtents,a=i?i.z/r.x:1,o=i?i.w/r.y:1,l=i?i.x/r.x:0,h=i?i.y/r.y:0;t.coordinateSystem===Ms||t.reversedDepth?e.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+h,0,0,1,0,0,0,0,1):e.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+h,0,0,.5,.5,0,0,0,1),e.multiply(Wl)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.mapType=t.mapType,this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.mapType=this.mapType,t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}},Ra=new k,Ca=new Je,Hn=new k,Lr=class extends an{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new fe,this.projectionMatrix=new fe,this.projectionMatrixInverse=new fe,this.coordinateSystem=Rn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Ra,Ca,Hn),Hn.x===1&&Hn.y===1&&Hn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ra,Ca,Hn.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(Ra,Ca,Hn),Hn.x===1&&Hn.y===1&&Hn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ra,Ca,Hn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},yi=new k,kh=new ft,Hh=new ft,sn=class extends Lr{constructor(t=50,e=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Ha*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(vl*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Ha*2*Math.atan(Math.tan(vl*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){yi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(yi.x,yi.y).multiplyScalar(-t/yi.z),yi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(yi.x,yi.y).multiplyScalar(-t/yi.z)}getViewSize(t,e){return this.getViewBounds(t,kh,Hh),e.subVectors(Hh,kh)}setViewOffset(t,e,n,i,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(vl*.5*this.fov)/this.zoom,n=2*e,i=this.aspect*n,r=-.5*i,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,h=a.fullHeight;r+=a.offsetX*i/l,e-=a.offsetY*n/h,i*=a.width/l,n*=a.height/h}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}};var jl=class extends Ir{constructor(){super(new sn(90,1,.5,500)),this.isPointLightShadow=!0}},Is=class extends Ps{constructor(t,e,n=0,i=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new jl}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.distance=this.distance,e.object.decay=this.decay,e.object.shadow=this.shadow.toJSON(),e}},$i=class extends Lr{constructor(t=-1,e=1,n=1,i=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=i,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,i,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,r=n-t,a=n+t,o=i+e,l=i-e;if(this.view!==null&&this.view.enabled){let h=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=h*this.view.offsetX,a=r+h*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},tc=class extends Ir{constructor(){super(new $i(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Ls=class extends Ps{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(an.DEFAULT_UP),this.updateMatrix(),this.target=new an,this.shadow=new tc}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}};var Dr=class extends Fe{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(t){return super.copy(t),this.instanceCount=t.instanceCount,this}toJSON(){let t=super.toJSON();return t.instanceCount=this.instanceCount,t.isInstancedBufferGeometry=!0,t}};var gs=-90,xs=1,Ds=class extends an{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new sn(gs,xs,t,e);i.layers=this.layers,this.add(i);let r=new sn(gs,xs,t,e);r.layers=this.layers,this.add(r);let a=new sn(gs,xs,t,e);a.layers=this.layers,this.add(a);let o=new sn(gs,xs,t,e);o.layers=this.layers,this.add(o);let l=new sn(gs,xs,t,e);l.layers=this.layers,this.add(l);let h=new sn(gs,xs,t,e);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,i,r,a,o,l]=e;for(let h of e)this.remove(h);if(t===Rn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Ms)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let h of e)this.add(h),h.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,h,u]=this.children,f=t.getRenderTarget(),p=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;let _=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let c=!1;t.isWebGLRenderer===!0?c=t.state.buffers.depth.getReversed():c=t.reversedDepthBuffer,t.setRenderTarget(n,0,i),c&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,i),c&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,i),c&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,i),c&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(n,4,i),c&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),n.texture.mipmapsAutoUpdate=_,t.setRenderTarget(n,5,i),c&&t.autoClear===!1&&t.clearDepth(),t.render(e,u),t.setRenderTarget(f,p,d),t.xr.enabled=m,n.texture.needsPMREMUpdate=!0}},ho=class extends sn{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t,this.perCameraFrustumCulled=!1}},Nr=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(t){this._document=t,t.hidden!==void 0&&(this._pageVisibilityHandler=Gf.bind(this),t.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(t){return this._timescale=t,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(t){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(t!==void 0?t:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function Gf(){this._document.hidden===!1&&this.reset()}var Ec="\\[\\]\\.:\\/",Vf=new RegExp("["+Ec+"]","g"),Ac="[^"+Ec+"]",Wf="[^"+Ec.replace("\\.","")+"]",Xf=/((?:WC+[\/:])*)/.source.replace("WC",Ac),qf=/(WCOD+)?/.source.replace("WCOD",Wf),Yf=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Ac),Zf=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Ac),$f=new RegExp("^"+Xf+qf+Yf+Zf+"$"),Jf=["material","materials","bones","map"],ec=class{constructor(t,e,n){let i=n||Re.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,i)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},Re=class s{constructor(t,e,n){this.path=e,this.parsedPath=n||s.parseTrackName(e),this.node=s.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new s.Composite(t,e,n):new s(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Vf,"")}static parseTrackName(t){let e=$f.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let r=n.nodeName.substring(i+1);Jf.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let l=n(o.children);if(l)return l}return null},i=n(t.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)t[e++]=n[i]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,i=e.propertyName,r=e.propertyIndex;if(t||(t=s.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){$t("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let h=e.objectIndex;switch(n){case"materials":if(!t.material){Jt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Jt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Jt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let u=0;u<t.length;u++)if(t[u].name===h){h=u;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Jt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Jt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Jt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(h!==void 0){if(t[h]===void 0){Jt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[h]}}let a=t[i];if(a===void 0){let h=e.nodeName;Jt("PropertyBinding: Trying to update property for track: "+h+"."+i+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!t.geometry){Jt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Jt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Re.Composite=ec;Re.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Re.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Re.prototype.GetterByBindingType=[Re.prototype._getValue_direct,Re.prototype._getValue_array,Re.prototype._getValue_arrayElement,Re.prototype._getValue_toArray];Re.prototype.SetterByBindingTypeAndVersioning=[[Re.prototype._setValue_direct,Re.prototype._setValue_direct_setNeedsUpdate,Re.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Re.prototype._setValue_array,Re.prototype._setValue_array_setNeedsUpdate,Re.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Re.prototype._setValue_arrayElement,Re.prototype._setValue_arrayElement_setNeedsUpdate,Re.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Re.prototype._setValue_fromArray,Re.prototype._setValue_fromArray_setNeedsUpdate,Re.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var a_=new Float32Array(1);var Gh=new fe,Ur=class{constructor(t,e,n=0,i=1/0){this.ray=new ur(t,e),this.near=n,this.far=i,this.camera=null,this.layers=new Ts,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,e.projectionMatrix.elements[14]).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):Jt("Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return Gh.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Gh),this}intersectObject(t,e=!0,n=[]){return nc(t,this,n,e),n.sort(Vh),n}intersectObjects(t,e=!0,n=[]){for(let i=0,r=t.length;i<r;i++)nc(t[i],this,n,e);return n.sort(Vh),n}};function Vh(s,t){return s.distance-t.distance}function nc(s,t,e,n){let i=!0;if(s.layers.test(t.layers)&&s.raycast(t,e)===!1&&(i=!1),i===!0&&n===!0){let r=s.children;for(let a=0,o=r.length;a<o;a++)nc(r[a],t,e,!0)}}var Dc=class Dc{constructor(t,e,n,i){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,i)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,i){let r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=i,this}};Dc.prototype.isMatrix2=!0;var ic=Dc;function Rc(s,t,e,n){let i=Kf(n);switch(e){case mc:return s*t;case yo:return s*t/i.components*i.byteLength;case vo:return s*t/i.components*i.byteLength;case Di:return s*t*2/i.components*i.byteLength;case Mo:return s*t*2/i.components*i.byteLength;case gc:return s*t*3/i.components*i.byteLength;case kn:return s*t*4/i.components*i.byteLength;case So:return s*t*4/i.components*i.byteLength;case Vr:case Wr:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case Xr:case qr:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case To:case Eo:return Math.max(s,16)*Math.max(t,8)/4;case bo:case wo:return Math.max(s,8)*Math.max(t,8)/2;case Ao:case Ro:case Po:case Io:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case Co:case Yr:case Lo:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case Do:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case No:return Math.floor((s+4)/5)*Math.floor((t+3)/4)*16;case Uo:return Math.floor((s+4)/5)*Math.floor((t+4)/5)*16;case Fo:return Math.floor((s+5)/6)*Math.floor((t+4)/5)*16;case Oo:return Math.floor((s+5)/6)*Math.floor((t+5)/6)*16;case Bo:return Math.floor((s+7)/8)*Math.floor((t+4)/5)*16;case zo:return Math.floor((s+7)/8)*Math.floor((t+5)/6)*16;case ko:return Math.floor((s+7)/8)*Math.floor((t+7)/8)*16;case Ho:return Math.floor((s+9)/10)*Math.floor((t+4)/5)*16;case Go:return Math.floor((s+9)/10)*Math.floor((t+5)/6)*16;case Vo:return Math.floor((s+9)/10)*Math.floor((t+7)/8)*16;case Wo:return Math.floor((s+9)/10)*Math.floor((t+9)/10)*16;case Xo:return Math.floor((s+11)/12)*Math.floor((t+9)/10)*16;case qo:return Math.floor((s+11)/12)*Math.floor((t+11)/12)*16;case Yo:case Zo:case $o:return Math.ceil(s/4)*Math.ceil(t/4)*16;case Jo:case Ko:return Math.ceil(s/4)*Math.ceil(t/4)*8;case Zr:case Qo:return Math.ceil(s/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Kf(s){switch(s){case xn:case uc:return{byteLength:1,components:1};case Fs:case dc:case Ke:return{byteLength:2,components:1};case xo:case _o:return{byteLength:2,components:4};case zn:case go:case Ln:return{byteLength:4,components:1};case fc:case pc:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${s}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"187"}}));typeof window<"u"&&(window.__THREE__?$t("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="187");function nd(){let s=null,t=!1,e=null,n=null;function i(r,a){n=s.requestAnimationFrame(i),e(r,a)}return{start:function(){t!==!0&&e!==null&&s!==null&&(n=s.requestAnimationFrame(i),t=!0)},stop:function(){s!==null&&s.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){s=r}}}function rp(s){let t=new WeakMap;function e(o,l){let h=o.array,u=o.usage,f=h.byteLength,p=s.createBuffer();s.bindBuffer(l,p),s.bufferData(l,h,u),o.onUploadCallback();let d;if(h instanceof Float32Array)d=s.FLOAT;else if(typeof Float16Array<"u"&&h instanceof Float16Array)d=s.HALF_FLOAT;else if(h instanceof Uint16Array)o.isFloat16BufferAttribute?d=s.HALF_FLOAT:d=s.UNSIGNED_SHORT;else if(h instanceof Int16Array)d=s.SHORT;else if(h instanceof Uint32Array)d=s.UNSIGNED_INT;else if(h instanceof Int32Array)d=s.INT;else if(h instanceof Int8Array)d=s.BYTE;else if(h instanceof Uint8Array)d=s.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)d=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:p,type:d,bytesPerElement:h.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,l,h){let u=l.array,f=l.updateRanges;if(s.bindBuffer(h,o),f.length===0)s.bufferSubData(h,0,u);else{f.sort((d,m)=>d.start-m.start);let p=0;for(let d=1;d<f.length;d++){let m=f[p],_=f[d];_.start<=m.start+m.count+1?m.count=Math.max(m.count,_.start+_.count-m.start):(++p,f[p]=_)}f.length=p+1;for(let d=0,m=f.length;d<m;d++){let _=f[d];s.bufferSubData(h,_.start*u.BYTES_PER_ELEMENT,u,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(s.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let u=t.get(o);(!u||u.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let h=t.get(o);if(h===void 0)t.set(o,e(o,l));else if(h.version<o.version){if(h.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(h.buffer,o,l),h.version=o.version}}return{get:i,remove:r,update:a}}var ap=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,op=`#ifdef USE_ALPHAHASH
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
#endif`,lp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,cp=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,hp=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,up=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,dp=`#ifdef USE_AOMAP
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
#endif`,fp=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,pp=`#ifdef USE_BATCHING
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
#endif`,mp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,gp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,xp=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,_p=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,yp=`#ifdef USE_IRIDESCENCE
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
#endif`,vp=`#ifdef USE_BUMPMAP
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
#endif`,Mp=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Sp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,bp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Tp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,wp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Ep=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Ap=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Rp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Cp=`#define PI 3.141592653589793
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
} // validated`,Pp=`vec3 transformedNormal = objectNormal;
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
#endif`,Ip=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Lp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Dp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Np=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Up="gl_FragColor = linearToOutputTexel( gl_FragColor );",Fp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Op=`#ifdef USE_ENVMAP
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
#endif`,Bp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,zp=`#ifdef USE_ENVMAP
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
#endif`,kp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Hp=`#ifdef USE_ENVMAP
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
#endif`,Gp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Vp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Wp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Xp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,qp=`#ifdef USE_GRADIENTMAP
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
}`,Yp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Zp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,$p=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Jp=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,Kp=`#ifdef USE_ENVMAP
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
#endif`,Qp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,jp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,t0=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,e0=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,n0=`PhysicalMaterial material;
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
#endif`,i0=`uniform sampler2D dfgLUT;
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
}`,s0=`
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
#endif`,r0=`#if defined( RE_IndirectDiffuse )
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
#endif`,a0=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,o0=`#if NUM_LIGHT_PROBE_GRIDS > 0
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
#endif`,l0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,c0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,h0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,u0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,d0=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,f0=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,p0=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,m0=`#if defined( USE_POINTS_UV )
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
#endif`,g0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,x0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,_0=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,y0=`#if defined( USE_MORPHCOLORS )
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
#endif`,v0=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,M0=`#ifdef USE_MORPHTARGETS
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
#endif`,S0=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,b0=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,T0=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,w0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,E0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,A0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,R0=`#ifdef USE_NORMALMAP
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
#endif`,C0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,P0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,I0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,L0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,D0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,N0=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,U0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,F0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,O0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,B0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,z0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,k0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,H0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,G0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,V0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,W0=`float getShadowMask() {
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
}`,X0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,q0=`#ifdef USE_SKINNING
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
#endif`,Y0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Z0=`#ifdef USE_SKINNING
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
#endif`,$0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,J0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,K0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Q0=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,j0=`#ifdef USE_TRANSMISSION
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
#endif`,tm=`#ifdef USE_TRANSMISSION
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
#endif`,em=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,nm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,im=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,sm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,rm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,am=`uniform sampler2D t2D;
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
}`,om=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,lm=`uniform float backgroundBlurriness;
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
}`,cm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,hm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,um=`#include <common>
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
}`,dm=`#if DEPTH_PACKING == 3200
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
}`,fm=`#define DISTANCE
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
}`,pm=`#define DISTANCE
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
}`,mm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,gm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,xm=`uniform float scale;
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
}`,_m=`uniform vec3 diffuse;
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
}`,ym=`#include <common>
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
}`,vm=`uniform vec3 diffuse;
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
}`,Mm=`#define LAMBERT
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
}`,Sm=`#define LAMBERT
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
}`,bm=`#define MATCAP
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
}`,Tm=`#define MATCAP
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
}`,wm=`#define NORMAL
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
}`,Em=`#define NORMAL
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
}`,Am=`#define PHONG
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
}`,Rm=`#define PHONG
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
}`,Cm=`#define STANDARD
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
}`,Pm=`#define STANDARD
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
}`,Im=`#define TOON
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
}`,Lm=`#define TOON
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
}`,Dm=`uniform float size;
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
}`,Nm=`uniform vec3 diffuse;
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
}`,Um=`#include <common>
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
}`,Fm=`uniform vec3 color;
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
}`,Om=`uniform float rotation;
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
}`,Bm=`uniform vec3 diffuse;
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
}`,ae={alphahash_fragment:ap,alphahash_pars_fragment:op,alphamap_fragment:lp,alphamap_pars_fragment:cp,alphatest_fragment:hp,alphatest_pars_fragment:up,aomap_fragment:dp,aomap_pars_fragment:fp,batching_pars_vertex:pp,batching_vertex:mp,begin_vertex:gp,beginnormal_vertex:xp,bsdfs:_p,iridescence_fragment:yp,bumpmap_pars_fragment:vp,clipping_planes_fragment:Mp,clipping_planes_pars_fragment:Sp,clipping_planes_pars_vertex:bp,clipping_planes_vertex:Tp,color_fragment:wp,color_pars_fragment:Ep,color_pars_vertex:Ap,color_vertex:Rp,common:Cp,defaultnormal_vertex:Pp,displacementmap_pars_vertex:Ip,displacementmap_vertex:Lp,emissivemap_fragment:Dp,emissivemap_pars_fragment:Np,colorspace_fragment:Up,colorspace_pars_fragment:Fp,envmap_fragment:Op,envmap_common_pars_fragment:Bp,envmap_pars_fragment:zp,envmap_pars_vertex:kp,envmap_physical_pars_fragment:Kp,envmap_vertex:Hp,fog_vertex:Gp,fog_pars_vertex:Vp,fog_fragment:Wp,fog_pars_fragment:Xp,gradientmap_pars_fragment:qp,lightmap_pars_fragment:Yp,lights_lambert_fragment:Zp,lights_lambert_pars_fragment:$p,lights_pars_begin:Jp,lights_toon_fragment:Qp,lights_toon_pars_fragment:jp,lights_phong_fragment:t0,lights_phong_pars_fragment:e0,lights_physical_fragment:n0,lights_physical_pars_fragment:i0,lights_fragment_begin:s0,lights_fragment_maps:r0,lights_fragment_end:a0,lightprobes_pars_fragment:o0,logdepthbuf_fragment:l0,logdepthbuf_pars_fragment:c0,logdepthbuf_pars_vertex:h0,logdepthbuf_vertex:u0,map_fragment:d0,map_pars_fragment:f0,map_particle_fragment:p0,map_particle_pars_fragment:m0,metalnessmap_fragment:g0,metalnessmap_pars_fragment:x0,morphinstance_vertex:_0,morphcolor_vertex:y0,morphnormal_vertex:v0,morphtarget_pars_vertex:M0,morphtarget_vertex:S0,normal_fragment_begin:b0,normal_fragment_maps:T0,normal_pars_fragment:w0,normal_pars_vertex:E0,normal_vertex:A0,normalmap_pars_fragment:R0,clearcoat_normal_fragment_begin:C0,clearcoat_normal_fragment_maps:P0,clearcoat_pars_fragment:I0,iridescence_pars_fragment:L0,opaque_fragment:D0,packing:N0,premultiplied_alpha_fragment:U0,project_vertex:F0,dithering_fragment:O0,dithering_pars_fragment:B0,roughnessmap_fragment:z0,roughnessmap_pars_fragment:k0,shadowmap_pars_fragment:H0,shadowmap_pars_vertex:G0,shadowmap_vertex:V0,shadowmask_pars_fragment:W0,skinbase_vertex:X0,skinning_pars_vertex:q0,skinning_vertex:Y0,skinnormal_vertex:Z0,specularmap_fragment:$0,specularmap_pars_fragment:J0,tonemapping_fragment:K0,tonemapping_pars_fragment:Q0,transmission_fragment:j0,transmission_pars_fragment:tm,uv_pars_fragment:em,uv_pars_vertex:nm,uv_vertex:im,worldpos_vertex:sm,background_vert:rm,background_frag:am,backgroundCube_vert:om,backgroundCube_frag:lm,cube_vert:cm,cube_frag:hm,depth_vert:um,depth_frag:dm,distance_vert:fm,distance_frag:pm,equirect_vert:mm,equirect_frag:gm,linedashed_vert:xm,linedashed_frag:_m,meshbasic_vert:ym,meshbasic_frag:vm,meshlambert_vert:Mm,meshlambert_frag:Sm,meshmatcap_vert:bm,meshmatcap_frag:Tm,meshnormal_vert:wm,meshnormal_frag:Em,meshphong_vert:Am,meshphong_frag:Rm,meshphysical_vert:Cm,meshphysical_frag:Pm,meshtoon_vert:Im,meshtoon_frag:Lm,points_vert:Dm,points_frag:Nm,shadow_vert:Um,shadow_frag:Fm,sprite_vert:Om,sprite_frag:Bm},It={common:{diffuse:{value:new Xt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new jt}},envmap:{envMap:{value:null},envMapRotation:{value:new jt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new jt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new jt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new jt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new jt},normalScale:{value:new ft(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new jt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new jt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new jt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new jt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Xt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new Xt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0},uvTransform:{value:new jt}},sprite:{diffuse:{value:new Xt(16777215)},opacity:{value:1},center:{value:new ft(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}}},$n={basic:{uniforms:on([It.common,It.specularmap,It.envmap,It.aomap,It.lightmap,It.fog]),vertexShader:ae.meshbasic_vert,fragmentShader:ae.meshbasic_frag},lambert:{uniforms:on([It.common,It.specularmap,It.envmap,It.aomap,It.lightmap,It.emissivemap,It.bumpmap,It.normalmap,It.displacementmap,It.fog,It.lights,{emissive:{value:new Xt(0)},envMapIntensity:{value:1}}]),vertexShader:ae.meshlambert_vert,fragmentShader:ae.meshlambert_frag},phong:{uniforms:on([It.common,It.specularmap,It.envmap,It.aomap,It.lightmap,It.emissivemap,It.bumpmap,It.normalmap,It.displacementmap,It.fog,It.lights,{emissive:{value:new Xt(0)},specular:{value:new Xt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ae.meshphong_vert,fragmentShader:ae.meshphong_frag},standard:{uniforms:on([It.common,It.envmap,It.aomap,It.lightmap,It.emissivemap,It.bumpmap,It.normalmap,It.displacementmap,It.roughnessmap,It.metalnessmap,It.fog,It.lights,{emissive:{value:new Xt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ae.meshphysical_vert,fragmentShader:ae.meshphysical_frag},toon:{uniforms:on([It.common,It.aomap,It.lightmap,It.emissivemap,It.bumpmap,It.normalmap,It.displacementmap,It.gradientmap,It.fog,It.lights,{emissive:{value:new Xt(0)}}]),vertexShader:ae.meshtoon_vert,fragmentShader:ae.meshtoon_frag},matcap:{uniforms:on([It.common,It.bumpmap,It.normalmap,It.displacementmap,It.fog,{matcap:{value:null}}]),vertexShader:ae.meshmatcap_vert,fragmentShader:ae.meshmatcap_frag},points:{uniforms:on([It.points,It.fog]),vertexShader:ae.points_vert,fragmentShader:ae.points_frag},dashed:{uniforms:on([It.common,It.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ae.linedashed_vert,fragmentShader:ae.linedashed_frag},depth:{uniforms:on([It.common,It.displacementmap]),vertexShader:ae.depth_vert,fragmentShader:ae.depth_frag},normal:{uniforms:on([It.common,It.bumpmap,It.normalmap,It.displacementmap,{opacity:{value:1}}]),vertexShader:ae.meshnormal_vert,fragmentShader:ae.meshnormal_frag},sprite:{uniforms:on([It.sprite,It.fog]),vertexShader:ae.sprite_vert,fragmentShader:ae.sprite_frag},background:{uniforms:{uvTransform:{value:new jt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ae.background_vert,fragmentShader:ae.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new jt}},vertexShader:ae.backgroundCube_vert,fragmentShader:ae.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ae.cube_vert,fragmentShader:ae.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ae.equirect_vert,fragmentShader:ae.equirect_frag},distance:{uniforms:on([It.common,It.displacementmap,{referencePosition:{value:new k},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ae.distance_vert,fragmentShader:ae.distance_frag},shadow:{uniforms:on([It.lights,It.fog,{color:{value:new Xt(0)},opacity:{value:1}}]),vertexShader:ae.shadow_vert,fragmentShader:ae.shadow_frag}};$n.physical={uniforms:on([$n.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new jt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new jt},clearcoatNormalScale:{value:new ft(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new jt},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new jt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new jt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new jt},sheen:{value:0},sheenColor:{value:new Xt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new jt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new jt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new jt},transmissionSamplerSize:{value:new ft},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new jt},attenuationDistance:{value:0},attenuationColor:{value:new Xt(0)},specularColor:{value:new Xt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new jt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new jt},anisotropyVector:{value:new ft},anisotropyMap:{value:null},anisotropyMapTransform:{value:new jt}}]),vertexShader:ae.meshphysical_vert,fragmentShader:ae.meshphysical_frag};var tl={r:0,b:0,g:0},zm=new fe,id=new jt;id.set(-1,0,0,0,1,0,0,0,1);function km(s,t,e,n,i,r){let a=new Xt(0),o=i===!0?0:1,l,h,u=null,f=0,p=null;function d(y){let w=y.isScene===!0?y.background:null;if(w&&w.isTexture){let S=y.backgroundBlurriness>0;w=t.get(w,S)}return w}function m(y){let w=!1,S=d(y);S===null?c(a,o):S&&S.isColor&&(c(S,1),w=!0);let C=s.xr.getEnvironmentBlendMode();C==="additive"?e.buffers.color.setClear(0,0,0,1,r):C==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(s.autoClear||w)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function _(y,w){let S=d(w);S&&S.isCubeTexture?(h===void 0&&(h=new ht(new Ai(1,1,1),new ke({name:"BackgroundCubeMaterial",uniforms:ns($n.backgroundCube.uniforms),vertexShader:$n.backgroundCube.vertexShader,fragmentShader:$n.backgroundCube.fragmentShader,side:fn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(C,R,M){this.matrixWorld.copyPosition(M.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(h)),h.material.uniforms.envMap.value=S,h.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(zm.makeRotationFromEuler(w.backgroundRotation)).transpose(),S.isRenderTargetTexture===!1&&h.material.uniforms.backgroundRotation.value.premultiply(id),h.material.toneMapped=he.getTransfer(S.colorSpace)!==_e,(u!==S||f!==S.version||p!==s.toneMapping)&&(h.material.needsUpdate=!0,u=S,f=S.version,p=s.toneMapping),h.layers.enableAll(),y.unshift(h,h.geometry,h.material,0,0,null)):S&&S.isTexture&&(l===void 0&&(l=new ht(new Cn(2,2),new ke({name:"BackgroundMaterial",uniforms:ns($n.background.uniforms),vertexShader:$n.background.vertexShader,fragmentShader:$n.background.fragmentShader,side:qn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=S,l.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,l.material.toneMapped=he.getTransfer(S.colorSpace)!==_e,S.matrixAutoUpdate===!0&&S.updateMatrix(),l.material.uniforms.uvTransform.value.copy(S.matrix),(u!==S||f!==S.version||p!==s.toneMapping)&&(l.material.needsUpdate=!0,u=S,f=S.version,p=s.toneMapping),l.layers.enableAll(),y.unshift(l,l.geometry,l.material,0,0,null))}function c(y,w){y.getRGB(tl,wc(s)),e.buffers.color.setClear(tl.r,tl.g,tl.b,w,r)}function g(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(y,w=1){a.set(y),o=w,c(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(y){o=y,c(a,o)},render:m,addToRenderList:_,dispose:g}}function Hm(s,t){let e=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=p(null),r=i,a=!1;function o(O,B,H,F,q){let Y=!1,X=f(O,F,H,B);r!==X&&(r=X,h(r.object)),Y=d(O,F,H,q),Y&&m(O,F,H,q),q!==null&&t.update(q,s.ELEMENT_ARRAY_BUFFER),(Y||a)&&(a=!1,S(O,B,H,F),q!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,t.get(q).buffer))}function l(){return s.createVertexArray()}function h(O){return s.bindVertexArray(O)}function u(O){return s.deleteVertexArray(O)}function f(O,B,H,F){let q=F.wireframe===!0,Y=n[B.id];Y===void 0&&(Y={},n[B.id]=Y);let X=O.isInstancedMesh===!0?O.id:0,$=Y[X];$===void 0&&($={},Y[X]=$);let W=$[H.id];W===void 0&&(W={},$[H.id]=W);let j=W[q];return j===void 0&&(j=p(l()),W[q]=j),j}function p(O){let B=[],H=[],F=[];for(let q=0;q<e;q++)B[q]=0,H[q]=0,F[q]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:B,enabledAttributes:H,attributeDivisors:F,object:O,attributes:{},index:null}}function d(O,B,H,F){let q=r.attributes,Y=B.attributes,X=0,$=H.getAttributes();for(let W in $)if($[W].location>=0){let nt=q[W],vt=Y[W];if(vt===void 0&&(W==="instanceMatrix"&&O.instanceMatrix&&(vt=O.instanceMatrix),W==="instanceColor"&&O.instanceColor&&(vt=O.instanceColor)),nt===void 0||nt.attribute!==vt||vt&&nt.data!==vt.data)return!0;X++}return r.attributesNum!==X||r.index!==F}function m(O,B,H,F){let q={},Y=B.attributes,X=0,$=H.getAttributes();for(let W in $)if($[W].location>=0){let nt=Y[W];nt===void 0&&(W==="instanceMatrix"&&O.instanceMatrix&&(nt=O.instanceMatrix),W==="instanceColor"&&O.instanceColor&&(nt=O.instanceColor));let vt={};vt.attribute=nt,nt&&nt.data&&(vt.data=nt.data),q[W]=vt,X++}r.attributes=q,r.attributesNum=X,r.index=F}function _(){let O=r.newAttributes;for(let B=0,H=O.length;B<H;B++)O[B]=0}function c(O){g(O,0)}function g(O,B){let H=r.newAttributes,F=r.enabledAttributes,q=r.attributeDivisors;H[O]=1,F[O]===0&&(s.enableVertexAttribArray(O),F[O]=1),q[O]!==B&&(s.vertexAttribDivisor(O,B),q[O]=B)}function y(){let O=r.newAttributes,B=r.enabledAttributes;for(let H=0,F=B.length;H<F;H++)B[H]!==O[H]&&(s.disableVertexAttribArray(H),B[H]=0)}function w(O,B,H,F,q,Y,X){X===!0?s.vertexAttribIPointer(O,B,H,q,Y):s.vertexAttribPointer(O,B,H,F,q,Y)}function S(O,B,H,F){_();let q=F.attributes,Y=H.getAttributes(),X=B.defaultAttributeValues;for(let $ in Y){let W=Y[$];if(W.location>=0){let j=q[$];if(j===void 0&&($==="instanceMatrix"&&O.instanceMatrix&&(j=O.instanceMatrix),$==="instanceColor"&&O.instanceColor&&(j=O.instanceColor)),j!==void 0){let nt=j.normalized,vt=j.itemSize,zt=t.get(j);if(zt===void 0)continue;let st=zt.buffer,Rt=zt.type,Nt=zt.bytesPerElement,kt=Rt===s.INT||Rt===s.UNSIGNED_INT||j.gpuType===go;if(j.isInterleavedBufferAttribute){let wt=j.data,Ut=wt.isInterleavedBuffer===!0?wt.stride:wt.itemSize,we=j.offset;if(wt.isInstancedInterleavedBuffer||wt.isInstancedBufferAttribute){for(let Vt=0;Vt<W.locationSize;Vt++)g(W.location+Vt,wt.meshPerAttribute);O.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=wt.meshPerAttribute*wt.count)}else for(let Vt=0;Vt<W.locationSize;Vt++)c(W.location+Vt);s.bindBuffer(s.ARRAY_BUFFER,st);for(let Vt=0;Vt<W.locationSize;Vt++)w(W.location+Vt,vt/W.locationSize,Rt,nt,Ut*Nt,(we+vt/W.locationSize*Vt)*Nt,kt)}else{if(j.isInstancedBufferAttribute){for(let wt=0;wt<W.locationSize;wt++)g(W.location+wt,j.meshPerAttribute);O.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let wt=0;wt<W.locationSize;wt++)c(W.location+wt);s.bindBuffer(s.ARRAY_BUFFER,st);for(let wt=0;wt<W.locationSize;wt++)w(W.location+wt,vt/W.locationSize,Rt,nt,vt*Nt,vt/W.locationSize*wt*Nt,kt)}}else if(X!==void 0){let nt=X[$];if(nt!==void 0)switch(nt.length){case 2:s.vertexAttrib2fv(W.location,nt);break;case 3:s.vertexAttrib3fv(W.location,nt);break;case 4:s.vertexAttrib4fv(W.location,nt);break;default:s.vertexAttrib1fv(W.location,nt)}}}}y()}function C(){U();for(let O in n){let B=n[O];for(let H in B){let F=B[H];for(let q in F){let Y=F[q];for(let X in Y)u(Y[X].object),delete Y[X];delete F[q]}}delete n[O]}}function R(O){if(n[O.id]===void 0)return;let B=n[O.id];for(let H in B){let F=B[H];for(let q in F){let Y=F[q];for(let X in Y)u(Y[X].object),delete Y[X];delete F[q]}}delete n[O.id]}function M(O){for(let B in n){let H=n[B];for(let F in H){let q=H[F];if(q[O.id]===void 0)continue;let Y=q[O.id];for(let X in Y)u(Y[X].object),delete Y[X];delete q[O.id]}}}function E(O){for(let B in n){let H=n[B],F=O.isInstancedMesh===!0?O.id:0,q=H[F];if(q!==void 0){for(let Y in q){let X=q[Y];for(let $ in X)u(X[$].object),delete X[$];delete q[Y]}delete H[F],Object.keys(H).length===0&&delete n[B]}}}function U(){I(),a=!0,r!==i&&(r=i,h(r.object))}function I(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:o,reset:U,resetDefaultState:I,dispose:C,releaseStatesOfGeometry:R,releaseStatesOfObject:E,releaseStatesOfProgram:M,initAttributes:_,enableAttribute:c,disableUnusedAttributes:y}}function Gm(s,t,e){let n;function i(l){n=l}function r(l,h){s.drawArrays(n,l,h),e.update(h,n,1)}function a(l,h,u){u!==0&&(s.drawArraysInstanced(n,l,h,u),e.update(h,n,u))}function o(l,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,h,0,u);let p=0;for(let d=0;d<u;d++)p+=h[d];e.update(p,n,1)}this.setMode=i,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function Vm(s,t,e,n){let i;function r(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){let M=t.get("EXT_texture_filter_anisotropic");i=s.getParameter(M.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(M){return!(M!==kn&&n.convert(M)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(M){let E=M===Ke&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(M!==xn&&M!==Ln&&!E&&n.convert(M)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE))}function l(M){if(M==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";M="mediump"}return M==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=e.precision!==void 0?e.precision:"highp",u=l(h);u!==h&&($t("WebGLRenderer:",h,"not supported, using",u,"instead."),h=u);let f=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),p=e.logarithmicDepthBuffer===!0&&f===!1;e.reversedDepthBuffer===!0&&f===!1&&$t("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),e.logarithmicDepthBuffer===!0&&f===!0&&$t("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");let d=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),m=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=s.getParameter(s.MAX_TEXTURE_SIZE),c=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),g=s.getParameter(s.MAX_VERTEX_ATTRIBS),y=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),w=s.getParameter(s.MAX_VARYING_VECTORS),S=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),C=s.getParameter(s.MAX_SAMPLES),R=s.getParameter(s.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:h,logarithmicDepthBuffer:p,reversedDepthBuffer:f,maxTextures:d,maxVertexTextures:m,maxTextureSize:_,maxCubemapSize:c,maxAttributes:g,maxVertexUniforms:y,maxVaryings:w,maxFragmentUniforms:S,maxSamples:C,samples:R}}function Wm(s){let t=this,e=null,n=0,i=!1,r=!1,a=new Bn,o=new jt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,p){let d=f.length!==0||p||n!==0||i;return i=p,n=f.length,d},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,p){e=u(f,p,0)},this.setState=function(f,p,d){let m=f.clippingPlanes,_=f.clipIntersection,c=f.clipShadows,g=s.get(f);if(!i||m===null||m.length===0||r&&!c)r?u(null):h();else{let y=r?0:n,w=y*4,S=g.clippingState||null;l.value=S,S=u(m,p,w,d);for(let C=0;C!==w;++C)S[C]=e[C];g.clippingState=S,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=y}};function h(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(f,p,d,m){let _=f!==null?f.length:0,c=null;if(_!==0){if(c=l.value,m!==!0||c===null){let g=d+_*4,y=p.matrixWorldInverse;o.getNormalMatrix(y),(c===null||c.length<g)&&(c=new Float32Array(g));for(let w=0,S=d;w!==_;++w,S+=4)a.copy(f[w]).applyMatrix4(y,o),a.normal.toArray(c,S),c[S+3]=a.constant}l.value=c,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,c}}var Kr=class extends He{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},i=[n,n,n,n,n,n];this.texture=new fr(i),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},i=new Ai(5,5,5),r=new ke({name:"CubemapFromEquirect",uniforms:ns(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:fn,blending:ai});r.uniforms.tEquirect.value=e;let a=new ht(i,r),o=e.minFilter;return e.minFilter===oi&&(e.minFilter=un),new Ds(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,i=!0){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,i);t.setRenderTarget(r)}},Uu=256,Xm=3,qm=20,sd=256,rd=16,Ym=3,Zm=new k,$m=new Xt,nl=class s{constructor(t){this._renderer=t,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new Ds(1,10,null),this._boxMesh=new ht(new Ai(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(t,e=0,n=.1,i=100,r={}){let{size:a=256,position:o=Zm}=r,l=this._renderer;this._setSize(a);let h=this._allocateTarget(),u=this._getSourceTarget(!0);e>0&&(u.texture.mipmapsAutoUpdate=!1);let f=l.autoClear,p=l.autoClearColor,d=l.autoClearDepth,m=l.autoClearStencil,_=t.background;l.autoClear=!0,l.autoClearColor=!0,l.autoClearDepth=!0,l.autoClearStencil=!0,_===null&&(t.background=l.getClearColor($m));let c=new Ds(n,i,u);return c.position.copy(o),c.update(l,t),l.autoClear=f,l.autoClearColor=p,l.autoClearDepth=d,l.autoClearStencil=m,t.background=_,e>0&&(u.texture.mipmapsAutoUpdate=!0,this._blur(h,e)),this._applyPMREM(h),h}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Bu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ou(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(t,e){return e>0?1-Math.sqrt(1-t/e):0}_setSize(t){this._cubeSize=Math.max(Uu,Au(t))}_fromTexture(t,e){t.mapping===ts||t.mapping===Us?this._setSize(t.image.length===0?Uu:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4);let n=e||this._allocateTarget();return this._textureToCubemap(t),this._applyPMREM(n),n}_allocateTarget(){let t=this._cubeSize,e=Fu(t,!1,!1),n=Math.log2(t)-Xm;for(let i=0;i<=n;i++)e.texture.mipmaps.push({width:t>>i,height:t>>i});return e.texture.name="PMREM",e.texture.isPMREMTexture=!0,e}_getSourceTarget(t=!1){let e=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==e||t&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Fu(e,!0,t)),this._sourceTarget}_compileMaterial(t){this._boxMesh.material=t,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(t,e,n){let i=this._boxMesh,r=this._cubeCamera;i.material=n,r.renderTarget=t,r.activeMipmapLevel=e;let a=t.width>>e;t.viewport.set(0,0,a,a),r.update(this._renderer,i),t.viewport.set(0,0,t.width,t.height)}_textureToCubemap(t){let e;t.mapping===ts||t.mapping===Us?(this._cubemapMaterial===null&&(this._cubemapMaterial=Bu()),e=this._cubemapMaterial,e.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=Ou()),e=this._equirectMaterial),e.uniforms.envMap.value=t,this._renderCube(this._getSourceTarget(),0,e)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=Jm(),this._integrationMaterial=Km());let e=this._cubeSize,n=t.texture.mipmaps.length-1,i=this._ggxMaterial.uniforms;i.envMap.value=this._sourceTarget.texture;let r=this._integrationMaterial.uniforms;r.envMap.value=this._sourceTarget.texture,r.sourceLod.value=Math.log2(e/rd);for(let a=0;a<=n;a++){let o=s.lodToRoughness(a,n);if(a>n-Ym)r.roughness.value=o,this._renderCube(t,a,this._integrationMaterial);else{let l=o>0?Math.log2(e)+.5*Math.log2(6/(sd*Math.pow(o,4)))+.5:0;i.roughness.value=o,i.lodBias.value=l,this._renderCube(t,a,this._ggxMaterial)}}}_blur(t,e){this._blurMaterial===null&&(this._blurMaterial=Qm());let n=this._blurMaterial,i=n.uniforms,r=this._sourceTarget;i.sigma.value=Math.min(e,Math.PI)/Math.SQRT2,i.envMap.value=r.texture,this._renderCube(t,0,n),i.envMap.value=t.texture,this._renderCube(r,0,n)}};function Fu(s,t,e){return new Kr(s,{minFilter:oi,generateMipmaps:t,type:Ke,colorSpace:ir,depthBuffer:e})}function Qr(s,t,e){return new ke({name:s,uniforms:t,vertexShader:ae.cube_vert,fragmentShader:e,side:fn,blending:ai,depthTest:!1,depthWrite:!1})}function Jm(){return Qr("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${sd}u

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
	`)}function Km(){return Qr("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:rd}},`

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
	`)}function Qm(){return Qr("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${qm}
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
	`)}function Ou(){return Qr("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

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
	`)}function Bu(){return Qr("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function jm(s){let t=new WeakMap,e=new WeakMap,n=null;function i(p,d=!1){return p==null?null:d?a(p):r(p)}function r(p){if(p&&p.isTexture){let d=p.mapping;if(d===fo||d===po)if(t.has(p)){let m=t.get(p).texture;return o(m,p.mapping)}else{let m=p.image;if(m&&m.height>0){let _=new Kr(m.height);return _.fromEquirectangularTexture(s,p),t.set(p,_),p.addEventListener("dispose",h),o(_.texture,p.mapping)}else return null}}return p}function a(p){if(p&&p.isTexture&&p.isPMREMTexture!==!0){let d=p.mapping,m=d===fo||d===po,_=d===ts||d===Us;if(m||_){let c=e.get(p),g=c!==void 0?c.texture.pmremVersion:0;if(p.isRenderTargetTexture&&p.pmremVersion!==g)return n===null&&(n=new nl(s)),c=m?n.fromEquirectangular(p,c):n.fromCubemap(p,c),c.texture.pmremVersion=p.pmremVersion,e.set(p,c),c.texture;if(c!==void 0)return c.texture;{let y=p.image;return m&&y&&y.height>0||_&&y&&l(y)?(n===null&&(n=new nl(s)),c=m?n.fromEquirectangular(p):n.fromCubemap(p),c.texture.pmremVersion=p.pmremVersion,e.set(p,c),p.addEventListener("dispose",u),c.texture):null}}}return p}function o(p,d){return d===fo?p.mapping=ts:d===po&&(p.mapping=Us),p}function l(p){let d=0,m=6;for(let _=0;_<m;_++)p[_]!==void 0&&d++;return d===m}function h(p){let d=p.target;d.removeEventListener("dispose",h);let m=t.get(d);m!==void 0&&(t.delete(d),m.dispose())}function u(p){let d=p.target;d.removeEventListener("dispose",u);let m=e.get(d);m!==void 0&&(e.delete(d),m.dispose())}function f(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:i,dispose:f}}function tg(s){let t={};function e(n){if(t[n]!==void 0)return t[n];let i=s.getExtension(n);return t[n]=i,i}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let i=e(n);return i===null&&js("WebGLRenderer: "+n+" extension not supported."),i}}}function eg(s,t,e,n){let i={},r=new WeakMap,a=new FinalizationRegistry(m=>delete i[m]);function o(m){l(m.target)}function l(m){m.index!==null&&t.remove(m.index);for(let c in m.attributes)t.remove(m.attributes[c]);m.removeEventListener("dispose",o),delete i[m.id],a.unregister(m);let _=r.get(m);_&&(t.remove(_),r.delete(m)),n.releaseStatesOfGeometry(m),m.isInstancedBufferGeometry===!0&&delete m._maxInstanceCount,e.memory.geometries--}function h(m,_){return i[_.id]!==void 0||(_.addEventListener("dispose",o),i[_.id]=new WeakRef(_),a.register(_,_.id,_),e.memory.geometries++),_}function u(m){let _=m.attributes;for(let c in _)t.update(_[c],s.ARRAY_BUFFER)}function f(m){let _=m.index,c=m.attributes.position,g=0;if(c===void 0)return;let y=_!==null?_.array.length:c.array.length/3-1,w=c.count>=65535?hr:cr,S=new w(Math.ceil(y/3)*6,1),C=S.array;if(_!==null){let M=_.array;g=_.version;for(let E=0,U=0;E<y;E+=3){let I=M[E+0],O=M[E+1],B=M[E+2];C[U++]=I,C[U++]=O,C[U++]=O,C[U++]=B,C[U++]=B,C[U++]=I}}else{g=c.version;for(let M=0,E=0;M<y;M+=3){let U=M+0,I=M+1,O=M+2;C[E++]=U,C[E++]=I,C[E++]=I,C[E++]=O,C[E++]=O,C[E++]=U}}S.version=g;let R=r.get(m);R&&t.remove(R),r.set(m,S)}function p(m){let _=r.get(m);if(_){let c=m.index;c!==null&&_.version<c.version&&f(m)}else f(m);return r.get(m)}function d(){for(let m in i){let _=i[m].deref();_!==void 0&&l(_)}}return{get:h,update:u,getWireframeAttribute:p,dispose:d}}function ng(s,t,e){let n;function i(f){n=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function l(f,p){s.drawElements(n,p,r,f*a),e.update(p,n,1)}function h(f,p,d){d!==0&&(s.drawElementsInstanced(n,p,r,f*a,d),e.update(p,n,d))}function u(f,p,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,p,0,r,f,0,d);let _=0;for(let c=0;c<d;c++)_+=p[c];e.update(_,n,1)}this.setMode=i,this.setIndex=o,this.render=l,this.renderInstances=h,this.renderMultiDraw=u}function ig(s){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case s.TRIANGLES:e.triangles+=o*(r/3);break;case s.LINES:e.lines+=o*(r/2);break;case s.LINE_STRIP:e.lines+=o*(r-1);break;case s.LINE_LOOP:e.lines+=o*r;break;case s.POINTS:e.points+=o*r;break;default:Jt("WebGLInfo: Unknown draw mode:",a);break}}function i(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:i,update:n}}function sg(s,t,e){let n=new WeakMap,i=new Pe;function r(a,o,l){let h=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=u!==void 0?u.length:0,p=n.get(o);if(p===void 0||p.count!==f){let U=function(){M.dispose(),n.delete(o),o.removeEventListener("dispose",U)};p!==void 0&&p.texture.dispose();let d=o.morphAttributes.position!==void 0,m=o.morphAttributes.normal!==void 0,_=o.morphAttributes.color!==void 0,c=o.morphAttributes.position||[],g=o.morphAttributes.normal||[],y=o.morphAttributes.color||[],w=0;d===!0&&(w=1),m===!0&&(w=2),_===!0&&(w=3);let S=o.attributes.position.count*w,C=1;S>t.maxTextureSize&&(C=Math.ceil(S/t.maxTextureSize),S=t.maxTextureSize);let R=new Float32Array(S*C*4*f),M=new ar(R,S,C,f);M.type=Ln,M.needsUpdate=!0;let E=w*4;for(let I=0;I<f;I++){let O=c[I],B=g[I],H=y[I],F=S*C*4*I;for(let q=0;q<O.count;q++){let Y=q*E;d===!0&&(i.fromBufferAttribute(O,q),R[F+Y+0]=i.x,R[F+Y+1]=i.y,R[F+Y+2]=i.z,R[F+Y+3]=0),m===!0&&(i.fromBufferAttribute(B,q),R[F+Y+4]=i.x,R[F+Y+5]=i.y,R[F+Y+6]=i.z,R[F+Y+7]=0),_===!0&&(i.fromBufferAttribute(H,q),R[F+Y+8]=i.x,R[F+Y+9]=i.y,R[F+Y+10]=i.z,R[F+Y+11]=H.itemSize===4?i.w:1)}}p={count:f,texture:M,size:new ft(S,C)},n.set(o,p),o.addEventListener("dispose",U)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(s,"morphTexture",a.morphTexture,e);else{let d=0;for(let _=0;_<h.length;_++)d+=h[_];let m=o.morphTargetsRelative?1:1-d;l.getUniforms().setValue(s,"morphTargetBaseInfluence",m),l.getUniforms().setValue(s,"morphTargetInfluences",h)}l.getUniforms().setValue(s,"morphTargetsTexture",p.texture,e),l.getUniforms().setValue(s,"morphTargetsTextureSize",p.size)}return{update:r}}function rg(s,t,e,n,i){let r=new WeakMap;function a(h){let u=i.render.frame,f=h.geometry,p=t.get(h,f);if(r.get(p)!==u&&(t.update(p),r.set(p,u)),h.isInstancedMesh&&(h.hasEventListener("dispose",l)===!1&&h.addEventListener("dispose",l),r.get(h)!==u&&(e.update(h.instanceMatrix,s.ARRAY_BUFFER),h.instanceColor!==null&&e.update(h.instanceColor,s.ARRAY_BUFFER),r.set(h,u))),h.isSkinnedMesh){let d=h.skeleton;r.get(d)!==u&&(d.update(),r.set(d,u))}return p}function o(){r=new WeakMap}function l(h){let u=h.target;u.removeEventListener("dispose",l),n.releaseStatesOfObject(u),e.remove(u.instanceMatrix),u.instanceColor!==null&&e.remove(u.instanceColor)}return{update:a,dispose:o}}var ag={[Fr]:"LINEAR_TONE_MAPPING",[Or]:"REINHARD_TONE_MAPPING",[Br]:"CINEON_TONE_MAPPING",[ji]:"ACES_FILMIC_TONE_MAPPING",[kr]:"AGX_TONE_MAPPING",[Hr]:"NEUTRAL_TONE_MAPPING",[zr]:"CUSTOM_TONE_MAPPING"};function og(s,t,e,n,i,r){let a=new He(t,e,{type:s,depthBuffer:i,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,h=null,u=new Fe;u.setAttribute("position",new ce([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute("uv",new ce([0,2,0,0,2,0],2));let f=new Cs({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),p=new ht(u,f),d=new $i(-1,1,1,-1,0,1),m=null,_=null,c=!1,g,y=null,w=[],S=!1;this.setSize=function(C,R){a.setSize(C,R),o!==null&&o.setSize(C,R),l!==null&&l.setSize(C,R);for(let M=0;M<w.length;M++){let E=w[M];E.setSize&&E.setSize(C,R)}},this.setEffects=function(C){w=C,S=w.length>0&&w[0].isRenderPass===!0;let R=a.width,M=a.height;w.length>0&&o===null&&(o=new He(R,M,{type:Ke,depthBuffer:!1,stencilBuffer:!1}),l=new He(R,M,{type:Ke,depthBuffer:!1,stencilBuffer:!1}));let E=i===!0&&w.some(U=>U.needsDepthTexture===!0);E!==(a.depthTexture!==null)&&(E===!0&&h===null&&(h=new si(R,M),r===!0&&(h.format=li,h.type=es)),a.dispose(),a.depthTexture=E?h:null,a.resolveDepthBuffer=E,a.storeMultisampledDepthBuffer=E);for(let U=0;U<w.length;U++){let I=w[U];I.setSize&&I.setSize(R,M),E&&I.needsDepthTexture===!0&&I.setDepthTexture&&I.setDepthTexture(h)}},this.begin=function(C,R){if(c||C.toneMapping===Yn&&w.length===0)return!1;if(y=R,R!==null){let M=R.width,E=R.height;(a.width!==M||a.height!==E)&&this.setSize(M,E)}return S===!1&&C.setRenderTarget(a),g=C.toneMapping,C.toneMapping=Yn,!0},this.hasRenderPass=function(){return S},this.end=function(C,R){C.toneMapping=g,c=!0;let M=a,E=o;for(let U=0;U<w.length;U++){let I=w[U];I.enabled!==!1&&(I.render(C,E,M,R),I.needsSwap!==!1&&(M=E,E=E===o?l:o))}if(m!==C.outputColorSpace||_!==C.toneMapping){m=C.outputColorSpace,_=C.toneMapping,f.defines={},he.getTransfer(m)===_e&&(f.defines.SRGB_TRANSFER="");let U=ag[_];U&&(f.defines[U]=""),f.needsUpdate=!0}f.uniforms.tDiffuse.value=M.texture,C.setRenderTarget(y),C.render(p,d),y=null,c=!1},this.isCompositing=function(){return c},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),u.dispose(),f.dispose()}}var ad=new dn,od=new si(1,1),ld=new pr(1),cd=new ar,hd=new Wa,ud=new fr,zu=[],ku=[],Hu=new Float32Array(16),Gu=new Float32Array(9),Vu=new Float32Array(4);function zs(s,t,e){let n=s[0];if(n<=0||n>0)return s;let i=t*e,r=zu[i];if(r===void 0&&(r=new Float32Array(i),zu[i]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,s[a].toArray(r,o)}return r}function Ge(s,t){if(s.length!==t.length)return!1;for(let e=0,n=s.length;e<n;e++)if(s[e]!==t[e])return!1;return!0}function Ve(s,t){for(let e=0,n=t.length;e<n;e++)s[e]=t[e]}function sl(s,t){let e=ku[t];e===void 0&&(e=new Int32Array(t),ku[t]=e);for(let n=0;n!==t;++n)e[n]=s.allocateTextureUnit();return e}function lg(s,t){let e=this.cache;e[0]!==t&&(s.uniform1f(this.addr,t),e[0]=t)}function cg(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ge(e,t))return;s.uniform2fv(this.addr,t),Ve(e,t)}}function hg(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(s.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ge(e,t))return;s.uniform3fv(this.addr,t),Ve(e,t)}}function ug(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ge(e,t))return;s.uniform4fv(this.addr,t),Ve(e,t)}}function dg(s,t){let e=this.cache,n=t.elements;if(n===void 0){if(Ge(e,t))return;s.uniformMatrix2fv(this.addr,!1,t),Ve(e,t)}else{if(Ge(e,n))return;Vu.set(n),s.uniformMatrix2fv(this.addr,!1,Vu),Ve(e,n)}}function fg(s,t){let e=this.cache,n=t.elements;if(n===void 0){if(Ge(e,t))return;s.uniformMatrix3fv(this.addr,!1,t),Ve(e,t)}else{if(Ge(e,n))return;Gu.set(n),s.uniformMatrix3fv(this.addr,!1,Gu),Ve(e,n)}}function pg(s,t){let e=this.cache,n=t.elements;if(n===void 0){if(Ge(e,t))return;s.uniformMatrix4fv(this.addr,!1,t),Ve(e,t)}else{if(Ge(e,n))return;Hu.set(n),s.uniformMatrix4fv(this.addr,!1,Hu),Ve(e,n)}}function mg(s,t){let e=this.cache;e[0]!==t&&(s.uniform1i(this.addr,t),e[0]=t)}function gg(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ge(e,t))return;s.uniform2iv(this.addr,t),Ve(e,t)}}function xg(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ge(e,t))return;s.uniform3iv(this.addr,t),Ve(e,t)}}function _g(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ge(e,t))return;s.uniform4iv(this.addr,t),Ve(e,t)}}function yg(s,t){let e=this.cache;e[0]!==t&&(s.uniform1ui(this.addr,t),e[0]=t)}function vg(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ge(e,t))return;s.uniform2uiv(this.addr,t),Ve(e,t)}}function Mg(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ge(e,t))return;s.uniform3uiv(this.addr,t),Ve(e,t)}}function Sg(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ge(e,t))return;s.uniform4uiv(this.addr,t),Ve(e,t)}}function rl(s){return s.version===0&&(s.compareFunction=yc,s.needsUpdate=!0),s}function bg(s,t,e){let n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?r=rl(od):r=ad,e.setTexture2D(t||r,i)}function Tg(s,t,e){let n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTexture3D(t||hd,i)}function wg(s,t,e){let n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_CUBE_SHADOW?r=rl(ld):r=ud,e.setTextureCube(t||r,i)}function Eg(s,t,e){let n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTexture2DArray(t||cd,i)}function Ag(s){switch(s){case 5126:return lg;case 35664:return cg;case 35665:return hg;case 35666:return ug;case 35674:return dg;case 35675:return fg;case 35676:return pg;case 5124:case 35670:return mg;case 35667:case 35671:return gg;case 35668:case 35672:return xg;case 35669:case 35673:return _g;case 5125:return yg;case 36294:return vg;case 36295:return Mg;case 36296:return Sg;case 35678:case 36198:case 36298:case 36306:case 35682:return bg;case 35679:case 36299:case 36307:return Tg;case 35680:case 36300:case 36308:case 36293:return wg;case 36289:case 36303:case 36311:case 36292:return Eg}}function Rg(s,t){s.uniform1fv(this.addr,t)}function Cg(s,t){let e=zs(t,this.size,2);s.uniform2fv(this.addr,e)}function Pg(s,t){let e=zs(t,this.size,3);s.uniform3fv(this.addr,e)}function Ig(s,t){let e=zs(t,this.size,4);s.uniform4fv(this.addr,e)}function Lg(s,t){let e=zs(t,this.size,4);s.uniformMatrix2fv(this.addr,!1,e)}function Dg(s,t){let e=zs(t,this.size,9);s.uniformMatrix3fv(this.addr,!1,e)}function Ng(s,t){let e=zs(t,this.size,16);s.uniformMatrix4fv(this.addr,!1,e)}function Ug(s,t){s.uniform1iv(this.addr,t)}function Fg(s,t){s.uniform2iv(this.addr,t)}function Og(s,t){s.uniform3iv(this.addr,t)}function Bg(s,t){s.uniform4iv(this.addr,t)}function zg(s,t){s.uniform1uiv(this.addr,t)}function kg(s,t){s.uniform2uiv(this.addr,t)}function Hg(s,t){s.uniform3uiv(this.addr,t)}function Gg(s,t){s.uniform4uiv(this.addr,t)}function Vg(s,t,e){let n=this.cache,i=t.length,r=sl(e,i);Ge(n,r)||(s.uniform1iv(this.addr,r),Ve(n,r));let a;this.type===s.SAMPLER_2D_SHADOW?a=rl(od):a=ad;for(let o=0;o!==i;++o)e.setTexture2D(t[o]||a,r[o])}function Wg(s,t,e){let n=this.cache,i=t.length,r=sl(e,i);Ge(n,r)||(s.uniform1iv(this.addr,r),Ve(n,r));for(let a=0;a!==i;++a)e.setTexture3D(t[a]||hd,r[a])}function Xg(s,t,e){let n=this.cache,i=t.length,r=sl(e,i);Ge(n,r)||(s.uniform1iv(this.addr,r),Ve(n,r));let a;this.type===s.SAMPLER_CUBE_SHADOW?a=rl(ld):a=ud;for(let o=0;o!==i;++o)e.setTextureCube(t[o]||a,r[o])}function qg(s,t,e){let n=this.cache,i=t.length,r=sl(e,i);Ge(n,r)||(s.uniform1iv(this.addr,r),Ve(n,r));for(let a=0;a!==i;++a)e.setTexture2DArray(t[a]||cd,r[a])}function Yg(s){switch(s){case 5126:return Rg;case 35664:return Cg;case 35665:return Pg;case 35666:return Ig;case 35674:return Lg;case 35675:return Dg;case 35676:return Ng;case 5124:case 35670:return Ug;case 35667:case 35671:return Fg;case 35668:case 35672:return Og;case 35669:case 35673:return Bg;case 5125:return zg;case 36294:return kg;case 36295:return Hg;case 36296:return Gg;case 35678:case 36198:case 36298:case 36306:case 35682:return Vg;case 35679:case 36299:case 36307:return Wg;case 35680:case 36300:case 36308:case 36293:return Xg;case 36289:case 36303:case 36311:case 36292:return qg}}var Fc=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Ag(e.type)}},Oc=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Yg(e.type)}},Bc=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let i=this.seq;for(let r=0,a=i.length;r!==a;++r){let o=i[r];o.setValue(t,e[o.id],n)}}},Nc=/(\w+)(\])?(\[|\.)?/g;function Wu(s,t){s.seq.push(t),s.map[t.id]=t}function Zg(s,t,e){let n=s.name,i=n.length;for(Nc.lastIndex=0;;){let r=Nc.exec(n),a=Nc.lastIndex,o=r[1],l=r[2]==="]",h=r[3];if(l&&(o=o|0),h===void 0||h==="["&&a+2===i){Wu(e,h===void 0?new Fc(o,s,t):new Oc(o,s,t));break}else{let f=e.map[o];f===void 0&&(f=new Bc(o),Wu(e,f)),e=f}}}var Bs=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=t.getActiveUniform(e,a),l=t.getUniformLocation(e,o.name);Zg(o,l,this)}let i=[],r=[];for(let a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?i.push(a):r.push(a);i.length>0&&(this.seq=i.concat(r))}setValue(t,e,n,i){let r=this.map[e];r!==void 0&&r.setValue(t,n,i)}setOptional(t,e,n){let i=e[n];i!==void 0&&this.setValue(t,n,i)}static upload(t,e,n,i){for(let r=0,a=e.length;r!==a;++r){let o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,i)}}static seqWithValue(t,e){let n=[];for(let i=0,r=t.length;i!==r;++i){let a=t[i];a.id in e&&n.push(a)}return n}};function Xu(s,t,e){let n=s.createShader(t);return s.shaderSource(n,e),s.compileShader(n),n}var $g=37297,Jg=0;function Kg(s,t){let e=s.split(`
`),n=[],i=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=i;a<r;a++){let o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}var qu=new jt;function Qg(s){he._getMatrix(qu,he.workingColorSpace,s);let t=`mat3( ${qu.elements.map(e=>e.toFixed(4))} )`;switch(he.getTransfer(s)){case sr:return[t,"LinearTransferOETF"];case _e:return[t,"sRGBTransferOETF"];default:return $t("WebGLProgram: Unsupported color space: ",s),[t,"LinearTransferOETF"]}}function Yu(s,t,e){let n=s.getShaderParameter(t,s.COMPILE_STATUS),r=(s.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+Kg(s.getShaderSource(t),o)}else return r}function jg(s,t){let e=Qg(t);return[`vec4 ${s}( vec4 value ) {`,`	return ${e[1]}( vec4( ${e[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}var tx={[Fr]:"Linear",[Or]:"Reinhard",[Br]:"Cineon",[ji]:"ACESFilmic",[kr]:"AgX",[Hr]:"Neutral",[zr]:"Custom"};function ex(s,t){let e=tx[t];return e===void 0?($t("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+s+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+s+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var el=new k;function nx(){he.getLuminanceCoefficients(el);let s=el.x.toFixed(4),t=el.y.toFixed(4),e=el.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function ix(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Jr).join(`
`)}function sx(s){let t=[];for(let e in s){let n=s[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function rx(s,t){let e={},n=s.getProgramParameter(t,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){let r=s.getActiveAttrib(t,i),a=r.name,o=1;r.type===s.FLOAT_MAT2&&(o=2),r.type===s.FLOAT_MAT3&&(o=3),r.type===s.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:s.getAttribLocation(t,a),locationSize:o}}return e}function Jr(s){return s!==""}function Zu(s,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return s.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function $u(s,t){return s.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var ax=/^[ \t]*#include +<([\w\d./]+)>/gm;function zc(s){return s.replace(ax,ox)}function ox(s,t){let e=ae[t];if(e===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">");return zc(e)}var lx=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ju(s){return s.replace(lx,cx)}function cx(s,t,e,n){let i="";for(let r=parseInt(t);r<parseInt(e);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function Ku(s){let t=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?t+=`
#define HIGH_PRECISION`:s.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}var hx={[Ji]:"SHADOWMAP_TYPE_PCF",[Ns]:"SHADOWMAP_TYPE_VSM"};function ux(s){return hx[s.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var dx={[Us]:"ENVMAP_MODE_REFRACTION"};function fx(s){return s.envMap===!1?"ENVMAP_MODE_REFLECTION":dx[s.envMapMode]||"ENVMAP_MODE_REFLECTION"}var px={[cc]:"ENVMAP_BLENDING_MULTIPLY",[uu]:"ENVMAP_BLENDING_MIX",[du]:"ENVMAP_BLENDING_ADD"};function mx(s){return s.envMap===!1?"ENVMAP_BLENDING_NONE":px[s.combine]||"ENVMAP_BLENDING_NONE"}function gx(s,t,e,n){let i=s.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,l=ux(e),h=e.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",u=fx(e),f=mx(e),p=ix(e),d=sx(r),m=i.createProgram(),_,c,g=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(_=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d].filter(Jr).join(`
`),_.length>0&&(_+=`
`),c=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d].filter(Jr).join(`
`),c.length>0&&(c+=`
`)):(_=[Ku(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+e.diffuseRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Jr).join(`
`),c=[Ku(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",e.envMap?"#define "+f:"",e.envMapPMREM?"#define ENVMAP_MAX_LOD "+e.envMapMaxLod+".0":"",e.envMapPMREM?"#define ENVMAP_SIZE "+e.envMapSize+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",e.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Yn?"#define TONE_MAPPING":"",e.toneMapping!==Yn?ae.tonemapping_pars_fragment:"",e.toneMapping!==Yn?ex("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",ae.colorspace_pars_fragment,jg("linearToOutputTexel",e.outputColorSpace),nx(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Jr).join(`
`)),a=zc(a),a=Zu(a,e),a=$u(a,e),o=zc(o),o=Zu(o,e),o=$u(o,e),a=Ju(a),o=Ju(o),e.isRawShaderMaterial!==!0&&(g=`#version 300 es
`,_=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+_,c=["#define varying in",e.glslVersion===Mc?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Mc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+c);let y=g+_+a,w=g+c+o,S=Xu(i,i.VERTEX_SHADER,y),C=Xu(i,i.FRAGMENT_SHADER,w);i.attachShader(m,S),i.attachShader(m,C),e.index0AttributeName!==void 0?i.bindAttribLocation(m,0,e.index0AttributeName):e.hasPositionAttribute===!0&&i.bindAttribLocation(m,0,"position"),i.linkProgram(m);function R(I){if(s.debug.checkShaderErrors){let O=i.getProgramInfoLog(m)||"",B=i.getShaderInfoLog(S)||"",H=i.getShaderInfoLog(C)||"",F=O.trim(),q=B.trim(),Y=H.trim(),X=!0,$=!0;if(i.getProgramParameter(m,i.LINK_STATUS)===!1)if(X=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,m,S,C);else{let W=Yu(i,S,"vertex"),j=Yu(i,C,"fragment");Jt("WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(m,i.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+F+`
`+W+`
`+j)}else F!==""?$t("WebGLProgram: Program Info Log:",F):(q===""||Y==="")&&($=!1);$&&(I.diagnostics={runnable:X,programLog:F,vertexShader:{log:q,prefix:_},fragmentShader:{log:Y,prefix:c}})}i.deleteShader(S),i.deleteShader(C),M=new Bs(i,m),E=rx(i,m)}let M;this.getUniforms=function(){return M===void 0&&R(this),M};let E;this.getAttributes=function(){return E===void 0&&R(this),E};let U=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return U===!1&&(U=i.getProgramParameter(m,$g)),U},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Jg++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=S,this.fragmentShader=C,this}var xx=0,kc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){let i=this._getShaderCacheForMaterial(t);return i.has(e)===!1&&(i.add(e),e.usedTimes++),i.has(n)===!1&&(i.add(n),n.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new Hc(t),e.set(t,n)),n}},Hc=class{constructor(t){this.id=xx++,this.code=t,this.usedTimes=0}};function _x(s){return s===Di||s===Yr||s===Zr}function yx(s,t,e,n,i,r){let a=new Ts,o=new kc,l=new Set,h=[],u=new Map,f=n.logarithmicDepthBuffer,p={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function d(M){return l.add(M),M===0?"uv":`uv${M}`}function m(M,E,U,I,O,B){let H=I.fog,F=O.geometry,q=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?I.environment:null,Y=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap,X=t.get(M.envMap||q,Y),$=p[M.type],W=n.precision;M.precision!==null&&(W=n.getMaxPrecision(M.precision),W!==M.precision&&$t("WebGLProgram.getParameters:",M.precision,"not supported, using",W,"instead."));let j=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,nt=j!==void 0?j.length:0,vt=0;F.morphAttributes.position!==void 0&&(vt=1),F.morphAttributes.normal!==void 0&&(vt=2),F.morphAttributes.color!==void 0&&(vt=3);let zt,st,Rt,Nt;if($){let Pt=$n[$];zt=Pt.vertexShader,st=Pt.fragmentShader}else{zt=M.vertexShader,st=M.fragmentShader;let Pt=o.getVertexShaderStage(M),Se=o.getFragmentShaderStage(M);o.update(M,Pt,Se),Rt=Pt.id,Nt=Se.id}let kt=s.getRenderTarget(),wt=s.state.buffers.depth.getReversed(),Ut=O.isInstancedMesh===!0,we=O.isBatchedMesh===!0,Vt=!!M.map,ee=!!M.matcap,ne=!!X,lt=ne&&X.isPMREMTexture===!0,Mt=!!M.aoMap,_t=!!M.lightMap,Dt=!!M.bumpMap&&M.wireframe===!1,Et=!!M.normalMap,Qt=!!M.displacementMap,Ht=!!M.emissiveMap,oe=!!M.metalnessMap,le=!!M.roughnessMap,ge=M.anisotropy>0,x=M.clearcoat>0,P=M.diffuseRoughness>0,N=M.dispersion>0,D=M.retroreflectivity>0,V=M.iridescence>0,ut=M.sheen>0,at=M.transmission>0,T=ge&&!!M.anisotropyMap,b=x&&!!M.clearcoatMap,v=x&&!!M.clearcoatNormalMap,L=x&&!!M.clearcoatRoughnessMap,Z=P&&!!M.diffuseRoughnessMap,J=V&&!!M.iridescenceMap,ct=V&&!!M.iridescenceThicknessMap,mt=ut&&!!M.sheenColorMap,et=ut&&!!M.sheenRoughnessMap,rt=!!M.specularMap,bt=!!M.specularColorMap,z=!!M.specularIntensityMap,ot=at&&!!M.transmissionMap,it=at&&!!M.thicknessMap,Tt=!!M.gradientMap,yt=!!M.alphaMap,St=M.alphaTest>0,Wt=!!M.alphaHash,re=!!M.extensions,gt=Yn;M.toneMapped&&(kt===null||kt.isXRRenderTarget===!0)&&(gt=s.toneMapping);let Yt=lt?X.isCompressedCubeTexture?X.image[0].mipmaps:X.mipmaps:null,se={shaderID:$,shaderType:M.type,shaderName:M.name,vertexShader:zt,fragmentShader:st,defines:M.defines,customVertexShaderID:Rt,customFragmentShaderID:Nt,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:W,batching:we,batchingColor:we&&O._colorsTexture!==null,instancing:Ut,instancingColor:Ut&&O.instanceColor!==null,instancingMorph:Ut&&O.morphTexture!==null,outputColorSpace:kt===null?s.outputColorSpace:kt.isXRRenderTarget===!0?kt.texture.colorSpace:he.workingColorSpace,alphaToCoverage:!!M.alphaToCoverage,map:Vt,matcap:ee,envMap:ne,envMapMode:ne&&X.mapping,envMapPMREM:lt,envMapMaxLod:lt?Yt.length-1:null,envMapSize:lt?Yt[0].width:null,aoMap:Mt,lightMap:_t,bumpMap:Dt,normalMap:Et,displacementMap:Qt,emissiveMap:Ht,normalMapObjectSpace:Et&&M.normalMapType===mu,normalMapTangentSpace:Et&&M.normalMapType===jo,packedNormalMap:Et&&M.normalMapType===jo&&_x(M.normalMap.format),metalnessMap:oe,roughnessMap:le,anisotropy:ge,anisotropyMap:T,clearcoat:x,clearcoatMap:b,clearcoatNormalMap:v,clearcoatRoughnessMap:L,diffuseRoughness:P,diffuseRoughnessMap:Z,dispersion:N,retroreflection:D,iridescence:V,iridescenceMap:J,iridescenceThicknessMap:ct,sheen:ut,sheenColorMap:mt,sheenRoughnessMap:et,specularMap:rt,specularColorMap:bt,specularIntensityMap:z,transmission:at,transmissionMap:ot,thicknessMap:it,gradientMap:Tt,opaque:M.transparent===!1&&M.blending===Li&&M.alphaToCoverage===!1,alphaMap:yt,alphaTest:St,alphaHash:Wt,combine:M.combine,mapUv:Vt&&d(M.map.channel),aoMapUv:Mt&&d(M.aoMap.channel),lightMapUv:_t&&d(M.lightMap.channel),bumpMapUv:Dt&&d(M.bumpMap.channel),normalMapUv:Et&&d(M.normalMap.channel),displacementMapUv:Qt&&d(M.displacementMap.channel),emissiveMapUv:Ht&&d(M.emissiveMap.channel),metalnessMapUv:oe&&d(M.metalnessMap.channel),roughnessMapUv:le&&d(M.roughnessMap.channel),anisotropyMapUv:T&&d(M.anisotropyMap.channel),clearcoatMapUv:b&&d(M.clearcoatMap.channel),clearcoatNormalMapUv:v&&d(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:L&&d(M.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:Z&&d(M.diffuseRoughnessMap.channel),iridescenceMapUv:J&&d(M.iridescenceMap.channel),iridescenceThicknessMapUv:ct&&d(M.iridescenceThicknessMap.channel),sheenColorMapUv:mt&&d(M.sheenColorMap.channel),sheenRoughnessMapUv:et&&d(M.sheenRoughnessMap.channel),specularMapUv:rt&&d(M.specularMap.channel),specularColorMapUv:bt&&d(M.specularColorMap.channel),specularIntensityMapUv:z&&d(M.specularIntensityMap.channel),transmissionMapUv:ot&&d(M.transmissionMap.channel),thicknessMapUv:it&&d(M.thicknessMap.channel),alphaMapUv:yt&&d(M.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(Et||ge),vertexNormals:!!F.attributes.normal,vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!F.attributes.uv&&(Vt||yt),fog:!!H,useFog:M.fog===!0,fogExp2:!!H&&H.isFogExp2,flatShading:M.wireframe===!1&&(M.flatShading===!0||F.attributes.normal===void 0&&Et===!1&&(M.isMeshLambertMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isMeshPhysicalMaterial)),sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:wt,skinning:O.isSkinnedMesh===!0,hasPositionAttribute:F.attributes.position!==void 0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:nt,morphTextureStride:vt,numSunLights:E.sun.length,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numSunLightShadows:E.sunShadowMap.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numLightProbeGrids:B.filter(Pt=>Pt.texture!==null).length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:M.dithering,shadowMapEnabled:s.shadowMap.enabled&&U.length>0,shadowMapType:s.shadowMap.type,toneMapping:gt,decodeVideoTexture:Vt&&M.map.isVideoTexture===!0&&he.getTransfer(M.map.colorSpace)===_e,decodeVideoTextureEmissive:Ht&&M.emissiveMap.isVideoTexture===!0&&he.getTransfer(M.emissiveMap.colorSpace)===_e,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===In,flipSided:M.side===fn,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:re&&M.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(re&&M.extensions.multiDraw===!0||we)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return se.vertexUv1s=l.has(1),se.vertexUv2s=l.has(2),se.vertexUv3s=l.has(3),l.clear(),se}function _(M){let E=[];if(M.shaderID?E.push(M.shaderID):(E.push(M.customVertexShaderID),E.push(M.customFragmentShaderID)),M.defines!==void 0)for(let U in M.defines)E.push(U),E.push(M.defines[U]);return M.isRawShaderMaterial===!1&&(c(E,M),g(E,M),E.push(s.outputColorSpace)),E.push(M.customProgramCacheKey),E.join()}function c(M,E){M.push(E.precision),M.push(E.outputColorSpace),M.push(E.envMapMode),M.push(E.envMapPMREM),M.push(E.envMapMaxLod),M.push(E.envMapSize),M.push(E.mapUv),M.push(E.alphaMapUv),M.push(E.lightMapUv),M.push(E.aoMapUv),M.push(E.bumpMapUv),M.push(E.normalMapUv),M.push(E.displacementMapUv),M.push(E.emissiveMapUv),M.push(E.metalnessMapUv),M.push(E.roughnessMapUv),M.push(E.anisotropyMapUv),M.push(E.clearcoatMapUv),M.push(E.clearcoatNormalMapUv),M.push(E.clearcoatRoughnessMapUv),M.push(E.diffuseRoughnessMapUv),M.push(E.iridescenceMapUv),M.push(E.iridescenceThicknessMapUv),M.push(E.sheenColorMapUv),M.push(E.sheenRoughnessMapUv),M.push(E.specularMapUv),M.push(E.specularColorMapUv),M.push(E.specularIntensityMapUv),M.push(E.transmissionMapUv),M.push(E.thicknessMapUv),M.push(E.combine),M.push(E.fogExp2),M.push(E.sizeAttenuation),M.push(E.morphTargetsCount),M.push(E.numSunLights),M.push(E.numDirLights),M.push(E.numPointLights),M.push(E.numSpotLights),M.push(E.numSpotLightMaps),M.push(E.numHemiLights),M.push(E.numRectAreaLights),M.push(E.numSunLightShadows),M.push(E.numDirLightShadows),M.push(E.numPointLightShadows),M.push(E.numSpotLightShadows),M.push(E.numSpotLightShadowsWithMaps),M.push(E.numLightProbes),M.push(E.numLightProbeGrids),M.push(E.shadowMapType),M.push(E.toneMapping),M.push(E.numClippingPlanes),M.push(E.numClipIntersection),M.push(E.depthPacking)}function g(M,E){a.disableAll(),E.instancing&&a.enable(0),E.instancingColor&&a.enable(1),E.instancingMorph&&a.enable(2),E.matcap&&a.enable(3),E.envMap&&a.enable(4),E.normalMapObjectSpace&&a.enable(5),E.normalMapTangentSpace&&a.enable(6),E.clearcoat&&a.enable(7),E.iridescence&&a.enable(8),E.alphaTest&&a.enable(9),E.vertexColors&&a.enable(10),E.vertexAlphas&&a.enable(11),E.vertexUv1s&&a.enable(12),E.vertexUv2s&&a.enable(13),E.vertexUv3s&&a.enable(14),E.vertexTangents&&a.enable(15),E.anisotropy&&a.enable(16),E.alphaHash&&a.enable(17),E.batching&&a.enable(18),E.dispersion&&a.enable(19),E.retroreflection&&a.enable(24),E.diffuseRoughness&&a.enable(25),E.batchingColor&&a.enable(20),E.gradientMap&&a.enable(21),E.packedNormalMap&&a.enable(22),E.vertexNormals&&a.enable(23),M.push(a.mask),a.disableAll(),E.fog&&a.enable(0),E.useFog&&a.enable(1),E.flatShading&&a.enable(2),E.logarithmicDepthBuffer&&a.enable(3),E.reversedDepthBuffer&&a.enable(4),E.skinning&&a.enable(5),E.morphTargets&&a.enable(6),E.morphNormals&&a.enable(7),E.morphColors&&a.enable(8),E.premultipliedAlpha&&a.enable(9),E.shadowMapEnabled&&a.enable(10),E.doubleSided&&a.enable(11),E.flipSided&&a.enable(12),E.useDepthPacking&&a.enable(13),E.dithering&&a.enable(14),E.transmission&&a.enable(15),E.sheen&&a.enable(16),E.opaque&&a.enable(17),E.pointsUvs&&a.enable(18),E.decodeVideoTexture&&a.enable(19),E.decodeVideoTextureEmissive&&a.enable(20),E.alphaToCoverage&&a.enable(21),E.numLightProbeGrids>0&&a.enable(22),E.hasPositionAttribute&&a.enable(23),M.push(a.mask)}function y(M){let E=p[M.type],U;if(E){let I=$n[E];U=hi.clone(I.uniforms)}else U=M.uniforms;return U}function w(M,E){let U=u.get(E);return U!==void 0?++U.usedTimes:(U=new gx(s,E,M,i),h.push(U),u.set(E,U)),U}function S(M){if(--M.usedTimes===0){let E=h.indexOf(M);h[E]=h[h.length-1],h.pop(),u.delete(M.cacheKey),M.destroy()}}function C(M){o.remove(M)}function R(){o.dispose()}return{getParameters:m,getProgramCacheKey:_,getUniforms:y,acquireProgram:w,releaseProgram:S,releaseShaderCache:C,programs:h,dispose:R}}function vx(){let s=new WeakMap;function t(a){return s.has(a)}function e(a){let o=s.get(a);return o===void 0&&(o={},s.set(a,o)),o}function n(a){s.delete(a)}function i(a,o,l){s.get(a)[o]=l}function r(){s=new WeakMap}return{has:t,get:e,remove:n,update:i,dispose:r}}function Mx(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.material.id!==t.material.id?s.material.id-t.material.id:s.materialVariant!==t.materialVariant?s.materialVariant-t.materialVariant:s.z!==t.z?s.z-t.z:s.id-t.id}function Qu(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.z!==t.z?t.z-s.z:s.id-t.id}function ju(){let s=[],t=0,e=[],n=[],i=[];function r(){t=0,e.length=0,n.length=0,i.length=0}function a(p){let d=0;return p.isInstancedMesh&&(d+=2),p.isSkinnedMesh&&(d+=1),d}function o(p,d,m,_,c,g){let y=s[t];return y===void 0?(y={id:p.id,object:p,geometry:d,material:m,materialVariant:a(p),groupOrder:_,renderOrder:p.renderOrder,z:c,group:g},s[t]=y):(y.id=p.id,y.object=p,y.geometry=d,y.material=m,y.materialVariant=a(p),y.groupOrder=_,y.renderOrder=p.renderOrder,y.z=c,y.group=g),t++,y}function l(p,d,m,_,c,g,y){y.reversedDepth===!0&&(c=-c);let w=o(p,d,m,_,c,g);m.transmission>0?n.push(w):m.transparent===!0?i.push(w):e.push(w)}function h(p,d,m,_,c,g){let y=o(p,d,m,_,c,g);m.transmission>0?n.unshift(y):m.transparent===!0?i.unshift(y):e.unshift(y)}function u(p,d){e.length>1&&e.sort(p||Mx),n.length>1&&n.sort(d||Qu),i.length>1&&i.sort(d||Qu)}function f(){for(let p=t,d=s.length;p<d;p++){let m=s[p];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:e,transmissive:n,transparent:i,init:r,push:l,unshift:h,finish:f,sort:u}}function Sx(){let s=new WeakMap;function t(n,i){let r=s.get(n),a;return r===void 0?(a=new ju,s.set(n,[a])):i>=r.length?(a=new ju,r.push(a)):a=r[i],a}function e(){s=new WeakMap}return{get:t,dispose:e}}function bx(){let s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new k,color:new Xt};break;case"SpotLight":e={position:new k,direction:new k,color:new Xt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new k,color:new Xt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new k,skyColor:new Xt,groundColor:new Xt};break;case"RectAreaLight":e={color:new Xt,position:new k,halfWidth:new k,halfHeight:new k};break}return s[t.id]=e,e}}}function Tx(){let s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[t.id]=e,e}}}var wx=0;function Ex(s,t){return(t.castShadow?2:0)-(s.castShadow?2:0)+(t.map?1:0)-(s.map?1:0)}function Ax(s){let t=new bx,e=Tx(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)n.probe.push(new k);let i=new k,r=new fe,a=new fe;function o(h){let u=0,f=0,p=0;for(let B=0;B<9;B++)n.probe[B].set(0,0,0);let d=0,m=0,_=0,c=0,g=0,y=0,w=0,S=0,C=0,R=0,M=0,E=0,U=0,I=0;h.sort(Ex);for(let B=0,H=h.length;B<H;B++){let F=h[B],q=F.color,Y=F.intensity,X=F.distance,$=null;if(F.shadow&&F.shadow.map&&(F.shadow.map.texture.format===Di?$=F.shadow.map.texture:$=F.shadow.map.depthTexture||F.shadow.map.texture),F.isAmbientLight)u+=q.r*Y,f+=q.g*Y,p+=q.b*Y;else if(F.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(F.sh.coefficients[W],Y);I++}else if(F.isSunLight){let W=t.get(F);if(W.color.copy(F.color).multiplyScalar(F.intensity),F.castShadow){let j=F.shadow,nt=e.get(F);nt.shadowIntensity=j.intensity,nt.shadowBias=j.bias,nt.shadowNormalBias=j.normalBias,nt.shadowRadius=j.radius,nt.shadowMapSize.copy(j.mapSize).multiply(j.getFrameExtents()),n.sunShadow[m]=nt,n.sunShadowMap[m]=$;let vt=j.getViewportCount();for(let zt=0;zt<vt;zt++)n.sunShadowMatrix[_+zt]=j.getMatrix(zt),n.sunShadowCascade[_+zt]=j._cascadeData[zt];_+=vt,m++}n.sun[d]=W,d++}else if(F.isDirectionalLight){let W=t.get(F);if(W.color.copy(F.color).multiplyScalar(F.intensity),F.castShadow){let j=F.shadow,nt=e.get(F);nt.shadowIntensity=j.intensity,nt.shadowBias=j.bias,nt.shadowNormalBias=j.normalBias,nt.shadowRadius=j.radius,nt.shadowMapSize=j.mapSize,n.directionalShadow[c]=nt,n.directionalShadowMap[c]=$,n.directionalShadowMatrix[c]=F.shadow.matrix,C++}n.directional[c]=W,c++}else if(F.isSpotLight){let W=t.get(F);W.position.setFromMatrixPosition(F.matrixWorld),W.color.copy(q).multiplyScalar(Y),W.distance=X,W.coneCos=Math.cos(F.angle),W.penumbraCos=Math.cos(F.angle*(1-F.penumbra)),W.decay=F.decay,n.spot[y]=W;let j=F.shadow;if(F.map&&(n.spotLightMap[E]=F.map,E++,j.updateMatrices(F),F.castShadow&&U++),n.spotLightMatrix[y]=j.matrix,F.castShadow){let nt=e.get(F);nt.shadowIntensity=j.intensity,nt.shadowBias=j.bias,nt.shadowNormalBias=j.normalBias,nt.shadowRadius=j.radius,nt.shadowMapSize=j.mapSize,n.spotShadow[y]=nt,n.spotShadowMap[y]=$,M++}y++}else if(F.isRectAreaLight){let W=t.get(F);W.color.copy(q).multiplyScalar(Y),W.halfWidth.set(F.width*.5,0,0),W.halfHeight.set(0,F.height*.5,0),n.rectArea[w]=W,w++}else if(F.isPointLight){let W=t.get(F);if(W.color.copy(F.color).multiplyScalar(F.intensity),W.distance=F.distance,W.decay=F.decay,F.castShadow){let j=F.shadow,nt=e.get(F);nt.shadowIntensity=j.intensity,nt.shadowBias=j.bias,nt.shadowNormalBias=j.normalBias,nt.shadowRadius=j.radius,nt.shadowMapSize=j.mapSize,nt.shadowCameraNear=j.camera.near,nt.shadowCameraFar=j.camera.far,n.pointShadow[g]=nt,n.pointShadowMap[g]=$,n.pointShadowMatrix[g]=F.shadow.matrix,R++}n.point[g]=W,g++}else if(F.isHemisphereLight){let W=t.get(F);W.skyColor.copy(F.color).multiplyScalar(Y),W.groundColor.copy(F.groundColor).multiplyScalar(Y),n.hemi[S]=W,S++}}w>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=It.LTC_FLOAT_1,n.rectAreaLTC2=It.LTC_FLOAT_2):(n.rectAreaLTC1=It.LTC_HALF_1,n.rectAreaLTC2=It.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=f,n.ambient[2]=p;let O=n.hash;(O.sunLength!==d||O.directionalLength!==c||O.pointLength!==g||O.spotLength!==y||O.rectAreaLength!==w||O.hemiLength!==S||O.numSunShadows!==m||O.numDirectionalShadows!==C||O.numPointShadows!==R||O.numSpotShadows!==M||O.numSpotMaps!==E||O.numLightProbes!==I)&&(n.sun.length=d,n.directional.length=c,n.spot.length=y,n.rectArea.length=w,n.point.length=g,n.hemi.length=S,n.sunShadow.length=m,n.sunShadowMap.length=m,n.sunShadowMatrix.length=_,n.sunShadowCascade.length=_,n.directionalShadow.length=C,n.directionalShadowMap.length=C,n.directionalShadowMatrix.length=C,n.pointShadow.length=R,n.pointShadowMap.length=R,n.pointShadowMatrix.length=R,n.spotShadow.length=M,n.spotShadowMap.length=M,n.spotLightMatrix.length=M+E-U,n.spotLightMap.length=E,n.numSpotLightShadowsWithMaps=U,n.numLightProbes=I,O.sunLength=d,O.directionalLength=c,O.pointLength=g,O.spotLength=y,O.rectAreaLength=w,O.hemiLength=S,O.numSunShadows=m,O.numDirectionalShadows=C,O.numPointShadows=R,O.numSpotShadows=M,O.numSpotMaps=E,O.numLightProbes=I,n.version=wx++)}function l(h,u){let f=0,p=0,d=0,m=0,_=0,c=0,g=u.matrixWorldInverse;for(let y=0,w=h.length;y<w;y++){let S=h[y];if(S.isSunLight){let C=n.sun[f];C.direction.setFromMatrixPosition(S.matrixWorld),C.direction.transformDirection(g),f++}else if(S.isDirectionalLight){let C=n.directional[p];C.direction.setFromMatrixPosition(S.matrixWorld),i.setFromMatrixPosition(S.target.matrixWorld),C.direction.sub(i),C.direction.transformDirection(g),p++}else if(S.isSpotLight){let C=n.spot[m];C.position.setFromMatrixPosition(S.matrixWorld),C.position.applyMatrix4(g),C.direction.setFromMatrixPosition(S.matrixWorld),i.setFromMatrixPosition(S.target.matrixWorld),C.direction.sub(i),C.direction.transformDirection(g),m++}else if(S.isRectAreaLight){let C=n.rectArea[_];C.position.setFromMatrixPosition(S.matrixWorld),C.position.applyMatrix4(g),a.identity(),r.copy(S.matrixWorld),r.premultiply(g),a.extractRotation(r),C.halfWidth.set(S.width*.5,0,0),C.halfHeight.set(0,S.height*.5,0),C.halfWidth.applyMatrix4(a),C.halfHeight.applyMatrix4(a),_++}else if(S.isPointLight){let C=n.point[d];C.position.setFromMatrixPosition(S.matrixWorld),C.position.applyMatrix4(g),d++}else if(S.isHemisphereLight){let C=n.hemi[c];C.direction.setFromMatrixPosition(S.matrixWorld),C.direction.transformDirection(g),c++}}}return{setup:o,setupView:l,state:n}}function td(s){let t=new Ax(s),e=[],n=[],i=[];function r(f){u.camera=f,e.length=0,n.length=0,i.length=0}function a(f){f.isLightProbeGrid?i.push(f):e.push(f)}function o(f){n.push(f)}function l(){t.setup(e),i.sort((f,p)=>f.priority-p.priority||f.id-p.id)}function h(f){t.setupView(e,f)}let u={lightsArray:e,shadowsArray:n,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:u,setupLights:l,setupLightsView:h,pushLight:a,pushShadow:o}}function Rx(s){let t=new WeakMap;function e(i,r=0){let a=t.get(i),o;return a===void 0?(o=new td(s),t.set(i,[o])):r>=a.length?(o=new td(s),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}var Cx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Px=`uniform sampler2D shadow_pass;
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
}`,Ix=[new k(1,0,0),new k(-1,0,0),new k(0,1,0),new k(0,-1,0),new k(0,0,1),new k(0,0,-1)],Lx=[new k(0,-1,0),new k(0,-1,0),new k(0,0,1),new k(0,0,-1),new k(0,-1,0),new k(0,-1,0)],ed=new fe,$r=new k,Uc=new k;function Dx(s,t,e){let n=new Ei,i=new ft,r=new ft,a=new Pe,o=new Qa,l=new ja,h={},u=e.maxTextureSize,f={[qn]:fn,[fn]:qn,[In]:In},p=new ke({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ft},radius:{value:4}},vertexShader:Cx,fragmentShader:Px}),d=p.clone();d.defines.HORIZONTAL_PASS=1;let m=new Fe;m.setAttribute("position",new Sn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new ht(m,p),c=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ji;let g=this.type;this.render=function(R,M,E){if(c.enabled===!1||c.autoUpdate===!1&&c.needsUpdate===!1||R.length===0)return;this.type===qh&&($t("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Ji);let U=s.getRenderTarget(),I=s.getActiveCubeFace(),O=s.getActiveMipmapLevel(),B=s.state;B.setBlending(ai),B.buffers.depth.getReversed()===!0?B.buffers.color.setClear(0,0,0,0):B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);let H=g!==this.type;H&&M.traverse(function(F){F.material&&(Array.isArray(F.material)?F.material.forEach(q=>q.needsUpdate=!0):F.material.needsUpdate=!0)});for(let F=0,q=R.length;F<q;F++){let Y=R[F],X=Y.shadow;if(X===void 0){$t("WebGLShadowMap:",Y,"has no shadow.");continue}if(X.autoUpdate===!1&&X.needsUpdate===!1)continue;i.copy(X.mapSize);let $=X.getFrameExtents();i.multiply($),r.copy(X.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(r.x=Math.floor(u/$.x),i.x=r.x*$.x,X.mapSize.x=r.x),i.y>u&&(r.y=Math.floor(u/$.y),i.y=r.y*$.y,X.mapSize.y=r.y));let W=s.state.buffers.depth.getReversed();if(X.camera._reversedDepth=W,X.map===null||H===!0){if(X.map!==null&&(X.map.depthTexture!==null&&(X.map.depthTexture.dispose(),X.map.depthTexture=null),X.map.dispose()),this.type===Ns){if(Y.isPointLight){$t("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}X.map=new He(i.x,i.y,{format:Di,type:Ke,minFilter:un,magFilter:un,generateMipmaps:!1}),X.map.texture.name=Y.name+".shadowMap",X.map.depthTexture=new si(i.x,i.y,Ln),X.map.depthTexture.name=Y.name+".shadowMapDepth",X.map.depthTexture.format=ii,X.map.depthTexture.compareFunction=null,X.map.depthTexture.minFilter=Ye,X.map.depthTexture.magFilter=Ye}else Y.isPointLight?(X.map=new Kr(i.x),X.map.depthTexture=new pr(i.x,zn)):(X.map=new He(i.x,i.y),X.map.depthTexture=new si(i.x,i.y,zn)),X.map.depthTexture.name=Y.name+".shadowMap",X.map.depthTexture.format=ii,this.type===Ji?(X.map.depthTexture.compareFunction=W?_c:xc,X.map.depthTexture.minFilter=un,X.map.depthTexture.magFilter=un):(X.map.depthTexture.compareFunction=null,X.map.depthTexture.minFilter=Ye,X.map.depthTexture.magFilter=Ye);X.camera.updateProjectionMatrix()}X.map.isWebGLCubeRenderTarget!==!0&&(X.map.width!==i.x||X.map.height!==i.y)&&X.map.setSize(i.x,i.y);let j=X.map.isWebGLCubeRenderTarget?6:X.getViewportCount();Y.isPointLight!==!0&&X.updateMatrices(Y,E);let nt=(X.camera.layers.mask&4294967294)!==0?X.camera.layers:E.layers;for(let vt=0;vt<j;vt++){let zt=X.getCamera(vt);if(Y.isPointLight){let st=X.camera,Rt=X.matrix,Nt=Y.distance||st.far;Nt!==st.far&&(st.far=Nt,st.updateProjectionMatrix()),$r.setFromMatrixPosition(Y.matrixWorld),st.position.copy($r),Uc.copy(st.position),Uc.add(Ix[vt]),st.up.copy(Lx[vt]),st.lookAt(Uc),st.updateMatrixWorld(),Rt.makeTranslation(-$r.x,-$r.y,-$r.z),ed.multiplyMatrices(st.projectionMatrix,st.matrixWorldInverse),X._frustum.setFromProjectionMatrix(ed,st.coordinateSystem,st.reversedDepth)}if(X.map.isWebGLCubeRenderTarget)s.setRenderTarget(X.map,vt),s.clear();else{vt===0&&(s.setRenderTarget(X.map),s.clear());let st=X.getViewport(vt);a.set(r.x*st.x,r.y*st.y,r.x*st.z,r.y*st.w),B.viewport(a)}n=X.getFrustum(vt),S(M,E,zt,Y,nt,this.type)}X.isPointLightShadow!==!0&&this.type===Ns&&y(X,E),X.needsUpdate=!1}g=this.type,c.needsUpdate=!1,s.setRenderTarget(U,I,O)};function y(R,M){let E=t.update(_);p.defines.VSM_SAMPLES!==R.blurSamples&&(p.defines.VSM_SAMPLES=R.blurSamples,d.defines.VSM_SAMPLES=R.blurSamples,p.needsUpdate=!0,d.needsUpdate=!0),R.mapPass===null?R.mapPass=new He(i.x,i.y,{format:Di,type:Ke}):(R.mapPass.width!==R.map.width||R.mapPass.height!==R.map.height)&&R.mapPass.setSize(R.map.width,R.map.height),p.uniforms.shadow_pass.value=R.map.depthTexture,p.uniforms.resolution.value.set(R.map.width,R.map.height),p.uniforms.radius.value=R.radius,s.setRenderTarget(R.mapPass),s.clear(),s.renderBufferDirect(M,null,E,p,_,null),d.uniforms.shadow_pass.value=R.mapPass.texture,d.uniforms.resolution.value.set(R.map.width,R.map.height),d.uniforms.radius.value=R.radius,s.setRenderTarget(R.map),s.clear(),s.renderBufferDirect(M,null,E,d,_,null)}function w(R,M,E,U){let I=null,O=E.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(O!==void 0)I=O;else if(I=E.isPointLight===!0?l:o,s.localClippingEnabled&&M.clipShadows===!0&&Array.isArray(M.clippingPlanes)&&M.clippingPlanes.length!==0||M.displacementMap&&M.displacementScale!==0||M.alphaMap&&M.alphaTest>0||M.map&&M.alphaTest>0||M.alphaToCoverage===!0){let B=I.uuid,H=M.uuid,F=h[B];F===void 0&&(F={},h[B]=F);let q=F[H];q===void 0&&(q=I.clone(),F[H]=q,M.addEventListener("dispose",C)),I=q}if(I.visible=M.visible,I.wireframe=M.wireframe,U===Ns?I.side=M.shadowSide!==null?M.shadowSide:M.side:I.side=M.shadowSide!==null?M.shadowSide:f[M.side],I.alphaMap=M.alphaMap,I.alphaTest=M.alphaToCoverage===!0?.5:M.alphaTest,I.map=M.map,I.clipShadows=M.clipShadows,I.clippingPlanes=M.clippingPlanes,I.clipIntersection=M.clipIntersection,I.displacementMap=M.displacementMap,I.displacementScale=M.displacementScale,I.displacementBias=M.displacementBias,I.wireframeLinewidth=M.wireframeLinewidth,I.linewidth=M.linewidth,E.isPointLight===!0&&I.isMeshDistanceMaterial===!0){let B=s.properties.get(I);B.light=E}return I}function S(R,M,E,U,I,O){if(R.visible===!1)return;if(R.layers.test(I)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&O===Ns)&&(!R.frustumCulled||R.intersectsFrustum(n))){R.modelViewMatrix.multiplyMatrices(E.matrixWorldInverse,R.matrixWorld);let F=t.update(R),q=R.material;if(Array.isArray(q)){let Y=F.groups;for(let X=0,$=Y.length;X<$;X++){let W=Y[X],j=q[W.materialIndex];if(j&&j.visible){let nt=w(R,j,U,O);R.onBeforeShadow(s,R,M,E,F,nt,W),s.renderBufferDirect(E,null,F,nt,R,W),R.onAfterShadow(s,R,M,E,F,nt,W)}}}else if(q.visible){let Y=w(R,q,U,O);R.onBeforeShadow(s,R,M,E,F,Y,null),s.renderBufferDirect(E,null,F,Y,R,null),R.onAfterShadow(s,R,M,E,F,Y,null)}}let H=R.children;for(let F=0,q=H.length;F<q;F++)S(H[F],M,E,U,I,O)}function C(R){R.target.removeEventListener("dispose",C);for(let E in h){let U=h[E],I=R.target.uuid;I in U&&(U[I].dispose(),delete U[I])}}}function Nx(s,t){function e(){let z=!1,ot=new Pe,it=null,Tt=new Pe(0,0,0,0);return{setMask:function(yt){it!==yt&&!z&&(s.colorMask(yt,yt,yt,yt),it=yt)},setLocked:function(yt){z=yt},setClear:function(yt,St,Wt,re,gt){gt===!0&&(yt*=re,St*=re,Wt*=re),ot.set(yt,St,Wt,re),Tt.equals(ot)===!1&&(s.clearColor(yt,St,Wt,re),Tt.copy(ot))},reset:function(){z=!1,it=null,Tt.set(-1,0,0,0)}}}function n(){let z=!1,ot=!1,it=null,Tt=null,yt=null;return{setReversed:function(St){if(ot!==St){let Wt=t.get("EXT_clip_control");St?Wt.clipControlEXT(Wt.LOWER_LEFT_EXT,Wt.ZERO_TO_ONE_EXT):Wt.clipControlEXT(Wt.LOWER_LEFT_EXT,Wt.NEGATIVE_ONE_TO_ONE_EXT),ot=St;let re=yt;yt=null,this.setClear(re)}},getReversed:function(){return ot},setTest:function(St){St?wt(s.DEPTH_TEST):Ut(s.DEPTH_TEST)},setMask:function(St){it!==St&&!z&&(s.depthMask(St),it=St)},setFunc:function(St){if(ot&&(St=Eu[St]),Tt!==St){switch(St){case La:s.depthFunc(s.NEVER);break;case Da:s.depthFunc(s.ALWAYS);break;case Na:s.depthFunc(s.LESS);break;case ys:s.depthFunc(s.LEQUAL);break;case Ua:s.depthFunc(s.EQUAL);break;case Fa:s.depthFunc(s.GEQUAL);break;case Oa:s.depthFunc(s.GREATER);break;case Ba:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}Tt=St}},setLocked:function(St){z=St},setClear:function(St){yt!==St&&(yt=St,ot&&(St=1-St),s.clearDepth(St))},reset:function(){z=!1,it=null,Tt=null,yt=null,ot=!1}}}function i(){let z=!1,ot=null,it=null,Tt=null,yt=null,St=null,Wt=null,re=null,gt=null;return{setTest:function(Yt){z||(Yt?wt(s.STENCIL_TEST):Ut(s.STENCIL_TEST))},setMask:function(Yt){ot!==Yt&&!z&&(s.stencilMask(Yt),ot=Yt)},setFunc:function(Yt,se,Pt){(it!==Yt||Tt!==se||yt!==Pt)&&(s.stencilFunc(Yt,se,Pt),it=Yt,Tt=se,yt=Pt)},setOp:function(Yt,se,Pt){(St!==Yt||Wt!==se||re!==Pt)&&(s.stencilOp(Yt,se,Pt),St=Yt,Wt=se,re=Pt)},setLocked:function(Yt){z=Yt},setClear:function(Yt){gt!==Yt&&(s.clearStencil(Yt),gt=Yt)},reset:function(){z=!1,ot=null,it=null,Tt=null,yt=null,St=null,Wt=null,re=null,gt=null}}}let r=new e,a=new n,o=new i,l={},h=new WeakMap,u={},f={},p={},d=new WeakMap,m=[],_=null,c=!1,g=null,y=null,w=null,S=null,C=null,R=null,M=null,E=new Xt(0,0,0),U=0,I=!1,O=null,B=null,H=null,F=null,q=null,Y=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS),X=!1,$=0,W=s.getParameter(s.VERSION);W.indexOf("WebGL")!==-1?($=parseFloat(/^WebGL (\d)/.exec(W)[1]),X=$>=1):W.indexOf("OpenGL ES")!==-1&&($=parseFloat(/^OpenGL ES (\d)/.exec(W)[1]),X=$>=2);let j=null,nt={},vt=s.getParameter(s.SCISSOR_BOX),zt=s.getParameter(s.VIEWPORT),st=new Pe().fromArray(vt),Rt=new Pe().fromArray(zt);function Nt(z,ot,it,Tt){let yt=new Uint8Array(4),St=s.createTexture();s.bindTexture(z,St),s.texParameteri(z,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(z,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let Wt=0;Wt<it;Wt++)z===s.TEXTURE_3D||z===s.TEXTURE_2D_ARRAY?s.texImage3D(ot,0,s.RGBA,1,1,Tt,0,s.RGBA,s.UNSIGNED_BYTE,yt):s.texImage2D(ot+Wt,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,yt);return St}let kt={};kt[s.TEXTURE_2D]=Nt(s.TEXTURE_2D,s.TEXTURE_2D,1),kt[s.TEXTURE_CUBE_MAP]=Nt(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),kt[s.TEXTURE_2D_ARRAY]=Nt(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),kt[s.TEXTURE_3D]=Nt(s.TEXTURE_3D,s.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),wt(s.DEPTH_TEST),a.setFunc(ys),Dt(!1),Et(sc),wt(s.CULL_FACE),Mt(ai);function wt(z){u[z]!==!0&&(s.enable(z),u[z]=!0)}function Ut(z){u[z]!==!1&&(s.disable(z),u[z]=!1)}function we(z,ot){return p[z]!==ot?(s.bindFramebuffer(z,ot),p[z]=ot,z===s.DRAW_FRAMEBUFFER&&(p[s.FRAMEBUFFER]=ot),z===s.FRAMEBUFFER&&(p[s.DRAW_FRAMEBUFFER]=ot),!0):!1}function Vt(z,ot){let it=m,Tt=!1;if(z){it=d.get(ot),it===void 0&&(it=[],d.set(ot,it));let yt=z.textures;if(it.length!==yt.length||it[0]!==s.COLOR_ATTACHMENT0){for(let St=0,Wt=yt.length;St<Wt;St++)it[St]=s.COLOR_ATTACHMENT0+St;it.length=yt.length,Tt=!0}}else it[0]!==s.BACK&&(it[0]=s.BACK,Tt=!0);Tt&&s.drawBuffers(it)}function ee(z){return _!==z?(s.useProgram(z),_=z,!0):!1}let ne={[Qi]:s.FUNC_ADD,[Zh]:s.FUNC_SUBTRACT,[$h]:s.FUNC_REVERSE_SUBTRACT};ne[Jh]=s.MIN,ne[Kh]=s.MAX;let lt={[Qh]:s.ZERO,[jh]:s.ONE,[tu]:s.SRC_COLOR,[oc]:s.SRC_ALPHA,[au]:s.SRC_ALPHA_SATURATE,[su]:s.DST_COLOR,[nu]:s.DST_ALPHA,[eu]:s.ONE_MINUS_SRC_COLOR,[lc]:s.ONE_MINUS_SRC_ALPHA,[ru]:s.ONE_MINUS_DST_COLOR,[iu]:s.ONE_MINUS_DST_ALPHA,[ou]:s.CONSTANT_COLOR,[lu]:s.ONE_MINUS_CONSTANT_COLOR,[cu]:s.CONSTANT_ALPHA,[hu]:s.ONE_MINUS_CONSTANT_ALPHA};function Mt(z,ot,it,Tt,yt,St,Wt,re,gt,Yt){if(z===ai){c===!0&&(Ut(s.BLEND),c=!1);return}if(c===!1&&(wt(s.BLEND),c=!0),z!==Yh){if(z!==g||Yt!==I){if((y!==Qi||C!==Qi)&&(s.blendEquation(s.FUNC_ADD),y=Qi,C=Qi),Yt)switch(z){case Li:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Ki:s.blendFunc(s.ONE,s.ONE);break;case rc:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case ac:s.blendFuncSeparate(s.DST_COLOR,s.ONE_MINUS_SRC_ALPHA,s.ZERO,s.ONE);break;default:Jt("WebGLState: Invalid blending: ",z);break}else switch(z){case Li:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Ki:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE,s.ONE,s.ONE);break;case rc:Jt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case ac:Jt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Jt("WebGLState: Invalid blending: ",z);break}w=null,S=null,R=null,M=null,E.set(0,0,0),U=0,g=z,I=Yt}return}yt=yt||ot,St=St||it,Wt=Wt||Tt,(ot!==y||yt!==C)&&(s.blendEquationSeparate(ne[ot],ne[yt]),y=ot,C=yt),(it!==w||Tt!==S||St!==R||Wt!==M)&&(s.blendFuncSeparate(lt[it],lt[Tt],lt[St],lt[Wt]),w=it,S=Tt,R=St,M=Wt),(re.equals(E)===!1||gt!==U)&&(s.blendColor(re.r,re.g,re.b,gt),E.copy(re),U=gt),g=z,I=!1}function _t(z,ot){z.side===In?Ut(s.CULL_FACE):wt(s.CULL_FACE);let it=z.side===fn;ot&&(it=!it),Dt(it),z.blending===Li&&z.transparent===!1?Mt(ai):Mt(z.blending,z.blendEquation,z.blendSrc,z.blendDst,z.blendEquationAlpha,z.blendSrcAlpha,z.blendDstAlpha,z.blendColor,z.blendAlpha,z.premultipliedAlpha),a.setFunc(z.depthFunc),a.setTest(z.depthTest),a.setMask(z.depthWrite),r.setMask(z.colorWrite);let Tt=z.stencilWrite;o.setTest(Tt),Tt&&(o.setMask(z.stencilWriteMask),o.setFunc(z.stencilFunc,z.stencilRef,z.stencilFuncMask),o.setOp(z.stencilFail,z.stencilZFail,z.stencilZPass)),Ht(z.polygonOffset,z.polygonOffsetFactor,z.polygonOffsetUnits),z.alphaToCoverage===!0?wt(s.SAMPLE_ALPHA_TO_COVERAGE):Ut(s.SAMPLE_ALPHA_TO_COVERAGE)}function Dt(z){O!==z&&(z?s.frontFace(s.CW):s.frontFace(s.CCW),O=z)}function Et(z){z!==Wh?(wt(s.CULL_FACE),z!==B&&(z===sc?s.cullFace(s.BACK):z===Xh?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):Ut(s.CULL_FACE),B=z}function Qt(z){z!==H&&(X&&s.lineWidth(z),H=z)}function Ht(z,ot,it){z?(wt(s.POLYGON_OFFSET_FILL),(F!==ot||q!==it)&&(F=ot,q=it,a.getReversed()&&(ot=-ot,it=-it),s.polygonOffset(ot,it))):Ut(s.POLYGON_OFFSET_FILL)}function oe(z){z?wt(s.SCISSOR_TEST):Ut(s.SCISSOR_TEST)}function le(z){z===void 0&&(z=s.TEXTURE0+Y-1),j!==z&&(s.activeTexture(z),j=z)}function ge(z,ot,it){it===void 0&&(j===null?it=s.TEXTURE0+Y-1:it=j);let Tt=nt[it];Tt===void 0&&(Tt={type:void 0,texture:void 0},nt[it]=Tt),(Tt.type!==z||Tt.texture!==ot)&&(j!==it&&(s.activeTexture(it),j=it),s.bindTexture(z,ot||kt[z]),Tt.type=z,Tt.texture=ot)}function x(){let z=nt[j];z!==void 0&&z.type!==void 0&&(s.bindTexture(z.type,null),z.type=void 0,z.texture=void 0)}function P(){try{s.compressedTexImage2D(...arguments)}catch(z){Jt("WebGLState:",z)}}function N(){try{s.compressedTexImage3D(...arguments)}catch(z){Jt("WebGLState:",z)}}function D(){try{s.texSubImage2D(...arguments)}catch(z){Jt("WebGLState:",z)}}function V(){try{s.texSubImage3D(...arguments)}catch(z){Jt("WebGLState:",z)}}function ut(){try{s.compressedTexSubImage2D(...arguments)}catch(z){Jt("WebGLState:",z)}}function at(){try{s.compressedTexSubImage3D(...arguments)}catch(z){Jt("WebGLState:",z)}}function T(){try{s.texStorage2D(...arguments)}catch(z){Jt("WebGLState:",z)}}function b(){try{s.texStorage3D(...arguments)}catch(z){Jt("WebGLState:",z)}}function v(){try{s.texImage2D(...arguments)}catch(z){Jt("WebGLState:",z)}}function L(){try{s.texImage3D(...arguments)}catch(z){Jt("WebGLState:",z)}}function Z(z){return f[z]!==void 0?f[z]:s.getParameter(z)}function J(z,ot){f[z]!==ot&&(s.pixelStorei(z,ot),f[z]=ot)}function ct(z){st.equals(z)===!1&&(s.scissor(z.x,z.y,z.z,z.w),st.copy(z))}function mt(z){Rt.equals(z)===!1&&(s.viewport(z.x,z.y,z.z,z.w),Rt.copy(z))}function et(z,ot){let it=h.get(ot);it===void 0&&(it=new WeakMap,h.set(ot,it));let Tt=it.get(z);Tt===void 0&&(Tt=s.getUniformBlockIndex(ot,z.name),s.uniformBlockBinding(ot,Tt,Tt),it.set(z,Tt))}function rt(z,ot,it){let yt=h.get(ot).get(z);l[yt]!==it&&(s.bindBufferBase(s.UNIFORM_BUFFER,yt,it),l[yt]=it)}function bt(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),a.setReversed(!1),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),s.pixelStorei(s.PACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,!1),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,s.BROWSER_DEFAULT_WEBGL),s.pixelStorei(s.PACK_ROW_LENGTH,0),s.pixelStorei(s.PACK_SKIP_PIXELS,0),s.pixelStorei(s.PACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_ROW_LENGTH,0),s.pixelStorei(s.UNPACK_IMAGE_HEIGHT,0),s.pixelStorei(s.UNPACK_SKIP_PIXELS,0),s.pixelStorei(s.UNPACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_SKIP_IMAGES,0),u={},f={},j=null,nt={},p={},l={},d=new WeakMap,m=[],_=null,c=!1,g=null,y=null,w=null,S=null,C=null,R=null,M=null,E=new Xt(0,0,0),U=0,I=!1,O=null,B=null,H=null,F=null,q=null,st.set(0,0,s.canvas.width,s.canvas.height),Rt.set(0,0,s.canvas.width,s.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:wt,disable:Ut,bindFramebuffer:we,drawBuffers:Vt,useProgram:ee,setBlending:Mt,setMaterial:_t,setFlipSided:Dt,setCullFace:Et,setLineWidth:Qt,setPolygonOffset:Ht,setScissorTest:oe,activeTexture:le,bindTexture:ge,unbindTexture:x,compressedTexImage2D:P,compressedTexImage3D:N,texImage2D:v,texImage3D:L,pixelStorei:J,getParameter:Z,updateUBOMapping:et,uniformBlockBinding:rt,texStorage2D:T,texStorage3D:b,texSubImage2D:D,texSubImage3D:V,compressedTexSubImage2D:ut,compressedTexSubImage3D:at,scissor:ct,viewport:mt,reset:bt}}function Ux(s,t,e,n,i,r,a){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new ft,u=new WeakMap,f=new Set,p,d=new WeakMap,m=new Set,_=new FinalizationRegistry(b=>m.delete(b)),c=!1;try{c=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(b,v){return c?new OffscreenCanvas(b,v):rr("canvas")}function y(b,v,L){let Z=1,J=T(b);if((J.width>L||J.height>L)&&(Z=L/Math.max(J.width,J.height)),Z<1)if(typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&b instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&b instanceof ImageBitmap||typeof VideoFrame<"u"&&b instanceof VideoFrame){let ct=Math.floor(Z*J.width),mt=Math.floor(Z*J.height);p===void 0&&(p=g(ct,mt));let et=v?g(ct,mt):p;return et.width=ct,et.height=mt,et.getContext("2d").drawImage(b,0,0,ct,mt),$t("WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+ct+"x"+mt+")."),et}else return"data"in b&&$t("WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),b;return b}function w(b){return b.generateMipmaps}function S(b){s.generateMipmap(b)}function C(b){return b.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:b.isWebGL3DRenderTarget?s.TEXTURE_3D:b.isWebGLArrayRenderTarget||b.isCompressedArrayTexture?s.TEXTURE_2D_ARRAY:s.TEXTURE_2D}function R(b,v,L,Z,J,ct=!1){if(b!==null){if(s[b]!==void 0)return s[b];$t("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+b+"'")}let mt;Z&&(mt=t.get("EXT_texture_norm16"),mt||$t("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let et=v;if(v===s.RED&&(L===s.FLOAT&&(et=s.R32F),L===s.HALF_FLOAT&&(et=s.R16F),L===s.UNSIGNED_BYTE&&(et=s.R8),L===s.UNSIGNED_SHORT&&mt&&(et=mt.R16_EXT),L===s.SHORT&&mt&&(et=mt.R16_SNORM_EXT)),v===s.RED_INTEGER&&(L===s.UNSIGNED_BYTE&&(et=s.R8UI),L===s.UNSIGNED_SHORT&&(et=s.R16UI),L===s.UNSIGNED_INT&&(et=s.R32UI),L===s.BYTE&&(et=s.R8I),L===s.SHORT&&(et=s.R16I),L===s.INT&&(et=s.R32I)),v===s.RG&&(L===s.FLOAT&&(et=s.RG32F),L===s.HALF_FLOAT&&(et=s.RG16F),L===s.UNSIGNED_BYTE&&(et=s.RG8),L===s.UNSIGNED_SHORT&&mt&&(et=mt.RG16_EXT),L===s.SHORT&&mt&&(et=mt.RG16_SNORM_EXT)),v===s.RG_INTEGER&&(L===s.UNSIGNED_BYTE&&(et=s.RG8UI),L===s.UNSIGNED_SHORT&&(et=s.RG16UI),L===s.UNSIGNED_INT&&(et=s.RG32UI),L===s.BYTE&&(et=s.RG8I),L===s.SHORT&&(et=s.RG16I),L===s.INT&&(et=s.RG32I)),v===s.RGB_INTEGER&&(L===s.UNSIGNED_BYTE&&(et=s.RGB8UI),L===s.UNSIGNED_SHORT&&(et=s.RGB16UI),L===s.UNSIGNED_INT&&(et=s.RGB32UI),L===s.BYTE&&(et=s.RGB8I),L===s.SHORT&&(et=s.RGB16I),L===s.INT&&(et=s.RGB32I)),v===s.RGBA_INTEGER&&(L===s.UNSIGNED_BYTE&&(et=s.RGBA8UI),L===s.UNSIGNED_SHORT&&(et=s.RGBA16UI),L===s.UNSIGNED_INT&&(et=s.RGBA32UI),L===s.BYTE&&(et=s.RGBA8I),L===s.SHORT&&(et=s.RGBA16I),L===s.INT&&(et=s.RGBA32I)),v===s.RGB&&(L===s.UNSIGNED_SHORT&&mt&&(et=mt.RGB16_EXT),L===s.SHORT&&mt&&(et=mt.RGB16_SNORM_EXT),L===s.UNSIGNED_INT_5_9_9_9_REV&&(et=s.RGB9_E5),L===s.UNSIGNED_INT_10F_11F_11F_REV&&(et=s.R11F_G11F_B10F)),v===s.RGBA){let rt=ct?sr:he.getTransfer(J);L===s.FLOAT&&(et=s.RGBA32F),L===s.HALF_FLOAT&&(et=s.RGBA16F),L===s.UNSIGNED_BYTE&&(et=rt===_e?s.SRGB8_ALPHA8:s.RGBA8),L===s.UNSIGNED_SHORT&&mt&&(et=mt.RGBA16_EXT),L===s.SHORT&&mt&&(et=mt.RGBA16_SNORM_EXT),L===s.UNSIGNED_SHORT_4_4_4_4&&(et=s.RGBA4),L===s.UNSIGNED_SHORT_5_5_5_1&&(et=s.RGB5_A1)}return(et===s.R16F||et===s.R32F||et===s.RG16F||et===s.RG32F||et===s.RGBA16F||et===s.RGBA32F)&&t.get("EXT_color_buffer_float"),et}function M(b,v){let L;return b?v===null||v===zn||v===es?L=s.DEPTH24_STENCIL8:v===Ln?L=s.DEPTH32F_STENCIL8:v===Fs&&(L=s.DEPTH24_STENCIL8,$t("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===zn||v===es?L=s.DEPTH_COMPONENT24:v===Ln?L=s.DEPTH_COMPONENT32F:v===Fs&&(L=s.DEPTH_COMPONENT16),L}function E(b,v){return w(b)===!0||b.isFramebufferTexture&&b.minFilter!==Ye&&b.minFilter!==un?Math.log2(Math.max(v.width,v.height))+1:b.mipmaps.length>0?b.mipmaps.length:b.isCompressedTexture&&Array.isArray(b.image)?v.mipmaps.length:1}function U(b){let v=new WeakRef(b);n.get(b).__ref=v,m.add(v),_.register(b,v,v)}function I(b){let v=n.get(b).__ref;v!==void 0&&(m.delete(v),_.unregister(v))}function O(b){H(b.target)}function B(b){F(b.target)}function H(b){b.removeEventListener("dispose",O),I(b),Y(b),b.isVideoTexture&&u.delete(b),b.isHTMLTexture&&f.delete(b)}function F(b){b.removeEventListener("dispose",B),I(b),$(b)}function q(){for(let b of m){let v=b.deref();v!==void 0&&(v.isRenderTarget===!0?F(v):H(v))}m.clear(),f.clear()}function Y(b){let v=n.get(b);if(v.__webglInit===void 0)return;let L=b.source,Z=d.get(L);if(Z){let J=Z[v.__cacheKey];J.usedTimes--,J.usedTimes===0&&X(b),Object.keys(Z).length===0&&d.delete(L)}n.remove(b)}function X(b){let v=n.get(b);s.deleteTexture(v.__webglTexture);let L=b.source,Z=d.get(L);delete Z[v.__cacheKey],a.memory.textures--}function $(b){let v=n.get(b);v.__depthDisposeCallback&&v.__depthDisposeCallback();let L=b.depthTexture;if(L&&L.renderTarget===b&&H(L),b.isWebGLCubeRenderTarget)for(let J=0;J<6;J++){if(Array.isArray(v.__webglFramebuffer[J]))for(let ct=0;ct<v.__webglFramebuffer[J].length;ct++)s.deleteFramebuffer(v.__webglFramebuffer[J][ct]);else s.deleteFramebuffer(v.__webglFramebuffer[J]);v.__webglDepthbuffer&&s.deleteRenderbuffer(v.__webglDepthbuffer[J])}else{if(Array.isArray(v.__webglFramebuffer))for(let J=0;J<v.__webglFramebuffer.length;J++)s.deleteFramebuffer(v.__webglFramebuffer[J]);else s.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&s.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&s.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let J=0;J<v.__webglColorRenderbuffer.length;J++)v.__webglColorRenderbuffer[J]&&s.deleteRenderbuffer(v.__webglColorRenderbuffer[J]);v.__webglDepthRenderbuffer&&s.deleteRenderbuffer(v.__webglDepthRenderbuffer)}let Z=b.textures;for(let J=0,ct=Z.length;J<ct;J++){let mt=n.get(Z[J]);mt.__webglTexture&&(s.deleteTexture(mt.__webglTexture),a.memory.textures--),n.remove(Z[J])}n.remove(b)}let W=0;function j(){W=0}function nt(){return W}function vt(b){W=b}function zt(){let b=W;return b>=i.maxTextures&&$t("WebGLTextures: Trying to use "+(b+1)+" texture units while this GPU supports only "+i.maxTextures),W+=1,b}function st(b){let v=[];return v.push(b.wrapS),v.push(b.wrapT),v.push(b.wrapR||0),v.push(b.magFilter),v.push(b.minFilter),v.push(b.anisotropy),v.push(b.internalFormat),v.push(b.format),v.push(b.type),v.push(b.generateMipmaps),v.push(b.mipmapsAutoUpdate),v.push(b.premultiplyAlpha),v.push(b.flipY),v.push(b.unpackAlignment),v.push(b.colorSpace),v.join()}function Rt(b,v){let L=n.get(b);if(b.isVideoTexture&&ut(b),b.isRenderTargetTexture===!1&&b.isExternalTexture!==!0&&b.version>0&&L.__version!==b.version){let Z=b.image;if(Z===null)$t("WebGLRenderer: Texture marked for update but no image data found.");else if(Z.complete===!1)$t("WebGLRenderer: Texture marked for update but image is incomplete");else{_t(L,b,v);return}}else b.isExternalTexture&&(L.__webglTexture=b.sourceTexture?b.sourceTexture:null);e.bindTexture(s.TEXTURE_2D,L.__webglTexture,s.TEXTURE0+v)}function Nt(b,v){let L=n.get(b);if(b.isRenderTargetTexture===!1&&b.version>0&&L.__version!==b.version){_t(L,b,v);return}else b.isExternalTexture&&(L.__webglTexture=b.sourceTexture?b.sourceTexture:null);e.bindTexture(s.TEXTURE_2D_ARRAY,L.__webglTexture,s.TEXTURE0+v)}function kt(b,v){let L=n.get(b);if(b.isRenderTargetTexture===!1&&b.version>0&&L.__version!==b.version){_t(L,b,v);return}e.bindTexture(s.TEXTURE_3D,L.__webglTexture,s.TEXTURE0+v)}function wt(b,v){let L=n.get(b);if(b.version>0&&L.__version!==b.version){Dt(L,b,v);return}e.bindTexture(s.TEXTURE_CUBE_MAP,L.__webglTexture,s.TEXTURE0+v)}let Ut={[vs]:s.REPEAT,[Gn]:s.CLAMP_TO_EDGE,[za]:s.MIRRORED_REPEAT},we={[Ye]:s.NEAREST,[fu]:s.NEAREST_MIPMAP_NEAREST,[Gr]:s.NEAREST_MIPMAP_LINEAR,[un]:s.LINEAR,[mo]:s.LINEAR_MIPMAP_NEAREST,[oi]:s.LINEAR_MIPMAP_LINEAR},Vt={[xu]:s.NEVER,[yc]:s.ALWAYS,[_u]:s.LESS,[xc]:s.LEQUAL,[yu]:s.EQUAL,[_c]:s.GEQUAL,[vu]:s.GREATER,[Mu]:s.NOTEQUAL};function ee(b,v){if(v.type===Ln&&t.has("OES_texture_float_linear")===!1&&(v.magFilter===un||v.magFilter===mo||v.magFilter===Gr||v.magFilter===oi||v.minFilter===un||v.minFilter===mo||v.minFilter===Gr||v.minFilter===oi)&&$t("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(b,s.TEXTURE_WRAP_S,Ut[v.wrapS]),s.texParameteri(b,s.TEXTURE_WRAP_T,Ut[v.wrapT]),(b===s.TEXTURE_3D||b===s.TEXTURE_2D_ARRAY)&&s.texParameteri(b,s.TEXTURE_WRAP_R,Ut[v.wrapR]),s.texParameteri(b,s.TEXTURE_MAG_FILTER,we[v.magFilter]),s.texParameteri(b,s.TEXTURE_MIN_FILTER,we[v.minFilter]),v.compareFunction&&(s.texParameteri(b,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(b,s.TEXTURE_COMPARE_FUNC,Vt[v.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===Ye||v.minFilter!==Gr&&v.minFilter!==oi||v.type===Ln&&t.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||n.get(v).__currentAnisotropy){let L=t.get("EXT_texture_filter_anisotropic");s.texParameterf(b,L.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,i.getMaxAnisotropy())),n.get(v).__currentAnisotropy=v.anisotropy}}}function ne(b,v){let L=!1;b.__webglInit===void 0&&(b.__webglInit=!0,v.addEventListener("dispose",O),U(v));let Z=v.source,J=d.get(Z);J===void 0&&(J={},d.set(Z,J));let ct=st(v);if(ct!==b.__cacheKey){J[ct]===void 0&&(J[ct]={texture:s.createTexture(),usedTimes:0},a.memory.textures++,L=!0),J[ct].usedTimes++;let mt=J[b.__cacheKey];mt!==void 0&&(J[b.__cacheKey].usedTimes--,mt.usedTimes===0&&X(v)),b.__cacheKey=ct,b.__webglTexture=J[ct].texture}return L}function lt(b,v,L){return Math.floor(Math.floor(b/L)/v)}function Mt(b,v,L,Z){let ct=b.updateRanges;if(ct.length===0)e.texSubImage2D(s.TEXTURE_2D,0,0,0,v.width,v.height,L,Z,v.data);else{ct.sort((z,ot)=>z.start-ot.start);let mt=0;for(let z=1;z<ct.length;z++){let ot=ct[mt],it=ct[z],Tt=ot.start+ot.count,yt=lt(it.start,v.width,4),St=lt(ot.start,v.width,4);it.start<=Tt+1&&yt===St&&lt(it.start+it.count-1,v.width,4)===yt?ot.count=Math.max(ot.count,it.start+it.count-ot.start):(++mt,ct[mt]=it)}ct.length=mt+1;let et=e.getParameter(s.UNPACK_ROW_LENGTH),rt=e.getParameter(s.UNPACK_SKIP_PIXELS),bt=e.getParameter(s.UNPACK_SKIP_ROWS);e.pixelStorei(s.UNPACK_ROW_LENGTH,v.width);for(let z=0,ot=ct.length;z<ot;z++){let it=ct[z],Tt=Math.floor(it.start/4),yt=Math.ceil(it.count/4),St=Tt%v.width,Wt=Math.floor(Tt/v.width),re=yt,gt=1;e.pixelStorei(s.UNPACK_SKIP_PIXELS,St),e.pixelStorei(s.UNPACK_SKIP_ROWS,Wt),e.texSubImage2D(s.TEXTURE_2D,0,St,Wt,re,gt,L,Z,v.data)}b.clearUpdateRanges(),e.pixelStorei(s.UNPACK_ROW_LENGTH,et),e.pixelStorei(s.UNPACK_SKIP_PIXELS,rt),e.pixelStorei(s.UNPACK_SKIP_ROWS,bt)}}function _t(b,v,L){let Z=s.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(Z=s.TEXTURE_2D_ARRAY),v.isData3DTexture&&(Z=s.TEXTURE_3D);let J=ne(b,v),ct=v.source;e.bindTexture(Z,b.__webglTexture,s.TEXTURE0+L);let mt=n.get(ct);if(ct.version!==mt.__version||J===!0){if(e.activeTexture(s.TEXTURE0+L),(typeof ImageBitmap<"u"&&v.image instanceof ImageBitmap)===!1){let gt=he.getPrimaries(he.workingColorSpace),Yt=v.colorSpace===ci?null:he.getPrimaries(v.colorSpace),se=v.colorSpace===ci||gt===Yt?s.NONE:s.BROWSER_DEFAULT_WEBGL;e.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,v.flipY),e.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),e.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,se)}e.pixelStorei(s.UNPACK_ALIGNMENT,v.unpackAlignment);let rt=y(v.image,!1,i.maxTextureSize);rt=at(v,rt);let bt=r.convert(v.format,v.colorSpace),z=r.convert(v.type),ot=R(v.internalFormat,bt,z,v.normalized,v.colorSpace,v.isVideoTexture);ee(Z,v);let it,Tt=v.mipmaps,yt=v.isVideoTexture!==!0,St=mt.__version===void 0||J===!0,Wt=ct.dataReady,re=E(v,rt);if(v.isDepthTexture)ot=M(v.format===li,v.type),St&&(yt?e.texStorage2D(s.TEXTURE_2D,1,ot,rt.width,rt.height):e.texImage2D(s.TEXTURE_2D,0,ot,rt.width,rt.height,0,bt,z,null));else if(v.isDataTexture)if(Tt.length>0){yt&&St&&e.texStorage2D(s.TEXTURE_2D,re,ot,Tt[0].width,Tt[0].height);for(let gt=0,Yt=Tt.length;gt<Yt;gt++)it=Tt[gt],yt?Wt&&e.texSubImage2D(s.TEXTURE_2D,gt,0,0,it.width,it.height,bt,z,it.data):e.texImage2D(s.TEXTURE_2D,gt,ot,it.width,it.height,0,bt,z,it.data);v.generateMipmaps=!1}else yt?(St&&e.texStorage2D(s.TEXTURE_2D,re,ot,rt.width,rt.height),Wt&&Mt(v,rt,bt,z)):e.texImage2D(s.TEXTURE_2D,0,ot,rt.width,rt.height,0,bt,z,rt.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){yt&&St&&e.texStorage3D(s.TEXTURE_2D_ARRAY,re,ot,Tt[0].width,Tt[0].height,rt.depth);for(let gt=0,Yt=Tt.length;gt<Yt;gt++)if(it=Tt[gt],v.format!==kn)if(bt!==null)if(yt){if(Wt)if(v.layerUpdates.size>0){let se=Rc(it.width,it.height,v.format,v.type);for(let Pt of v.layerUpdates){let Se=it.data.subarray(Pt*se/it.data.BYTES_PER_ELEMENT,(Pt+1)*se/it.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,gt,0,0,Pt,it.width,it.height,1,bt,Se)}}else e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,gt,0,0,0,it.width,it.height,rt.depth,bt,it.data)}else e.compressedTexImage3D(s.TEXTURE_2D_ARRAY,gt,ot,it.width,it.height,rt.depth,0,it.data,0,0);else $t("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else yt?Wt&&e.texSubImage3D(s.TEXTURE_2D_ARRAY,gt,0,0,0,it.width,it.height,rt.depth,bt,z,it.data):e.texImage3D(s.TEXTURE_2D_ARRAY,gt,ot,it.width,it.height,rt.depth,0,bt,z,it.data);v.layerUpdates.size>0&&v.clearLayerUpdates()}else{yt&&St&&e.texStorage2D(s.TEXTURE_2D,re,ot,Tt[0].width,Tt[0].height);for(let gt=0,Yt=Tt.length;gt<Yt;gt++)it=Tt[gt],v.format!==kn?bt!==null?yt?Wt&&e.compressedTexSubImage2D(s.TEXTURE_2D,gt,0,0,it.width,it.height,bt,it.data):e.compressedTexImage2D(s.TEXTURE_2D,gt,ot,it.width,it.height,0,it.data):$t("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):yt?Wt&&e.texSubImage2D(s.TEXTURE_2D,gt,0,0,it.width,it.height,bt,z,it.data):e.texImage2D(s.TEXTURE_2D,gt,ot,it.width,it.height,0,bt,z,it.data)}else if(v.isDataArrayTexture)if(yt){if(St&&e.texStorage3D(s.TEXTURE_2D_ARRAY,re,ot,rt.width,rt.height,rt.depth),Wt)if(v.layerUpdates.size>0){let gt=Rc(rt.width,rt.height,v.format,v.type);for(let Yt of v.layerUpdates){let se=rt.data.subarray(Yt*gt/rt.data.BYTES_PER_ELEMENT,(Yt+1)*gt/rt.data.BYTES_PER_ELEMENT);e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,Yt,rt.width,rt.height,1,bt,z,se)}v.clearLayerUpdates()}else e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,rt.width,rt.height,rt.depth,bt,z,rt.data)}else e.texImage3D(s.TEXTURE_2D_ARRAY,0,ot,rt.width,rt.height,rt.depth,0,bt,z,rt.data);else if(v.isData3DTexture)yt?(St&&e.texStorage3D(s.TEXTURE_3D,re,ot,rt.width,rt.height,rt.depth),Wt&&e.texSubImage3D(s.TEXTURE_3D,0,0,0,0,rt.width,rt.height,rt.depth,bt,z,rt.data)):e.texImage3D(s.TEXTURE_3D,0,ot,rt.width,rt.height,rt.depth,0,bt,z,rt.data);else if(v.isFramebufferTexture){if(St)if(yt)e.texStorage2D(s.TEXTURE_2D,re,ot,rt.width,rt.height);else{let gt=rt.width,Yt=rt.height;for(let se=0;se<re;se++)e.texImage2D(s.TEXTURE_2D,se,ot,gt,Yt,0,bt,z,null),gt>>=1,Yt>>=1}}else if(v.isHTMLTexture){if("texElementImage2D"in s){let gt=s.canvas;if(gt.hasAttribute("layoutsubtree")||gt.setAttribute("layoutsubtree","true"),rt.parentNode!==gt){gt.appendChild(rt),f.add(v),gt.onpaint=Yt=>{let se=Yt.changedElements;for(let Pt of f)se.includes(Pt.image)&&(Pt.needsUpdate=!0)},gt.requestPaint();return}if(s.texElementImage2D.length===3)s.texElementImage2D(s.TEXTURE_2D,s.RGBA8,rt);else{let se=s.RGBA,Pt=s.RGBA,Se=s.UNSIGNED_BYTE;s.texElementImage2D(s.TEXTURE_2D,0,se,Pt,Se,rt)}s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,s.LINEAR),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE)}}else if(Tt.length>0){if(yt&&St){let gt=T(Tt[0]);e.texStorage2D(s.TEXTURE_2D,re,ot,gt.width,gt.height)}for(let gt=0,Yt=Tt.length;gt<Yt;gt++)it=Tt[gt],yt?Wt&&e.texSubImage2D(s.TEXTURE_2D,gt,0,0,bt,z,it):e.texImage2D(s.TEXTURE_2D,gt,ot,bt,z,it);v.generateMipmaps=!1}else if(yt){if(St){let gt=T(rt);e.texStorage2D(s.TEXTURE_2D,re,ot,gt.width,gt.height)}Wt&&e.texSubImage2D(s.TEXTURE_2D,0,0,0,bt,z,rt)}else e.texImage2D(s.TEXTURE_2D,0,ot,bt,z,rt);w(v)&&v.mipmapsAutoUpdate===!0&&S(Z),mt.__version=ct.version,v.onUpdate&&v.onUpdate(v)}b.__version=v.version}function Dt(b,v,L){if(v.image.length!==6)return;let Z=ne(b,v),J=v.source;e.bindTexture(s.TEXTURE_CUBE_MAP,b.__webglTexture,s.TEXTURE0+L);let ct=n.get(J);if(J.version!==ct.__version||Z===!0){e.activeTexture(s.TEXTURE0+L);let mt=he.getPrimaries(he.workingColorSpace),et=v.colorSpace===ci?null:he.getPrimaries(v.colorSpace),rt=v.colorSpace===ci||mt===et?s.NONE:s.BROWSER_DEFAULT_WEBGL;e.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,v.flipY),e.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),e.pixelStorei(s.UNPACK_ALIGNMENT,v.unpackAlignment),e.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,rt);let bt=v.isCompressedTexture||v.image[0].isCompressedTexture,z=v.image[0]&&v.image[0].isDataTexture,ot=[];for(let Pt=0;Pt<6;Pt++)!bt&&!z?ot[Pt]=y(v.image[Pt],!0,i.maxCubemapSize):ot[Pt]=z?v.image[Pt].image:v.image[Pt],ot[Pt]=at(v,ot[Pt]);let it=ot[0],Tt=r.convert(v.format,v.colorSpace),yt=r.convert(v.type),St=R(v.internalFormat,Tt,yt,v.normalized,v.colorSpace),Wt=v.isVideoTexture!==!0,re=ct.__version===void 0||Z===!0,gt=J.dataReady,Yt=E(v,it);ee(s.TEXTURE_CUBE_MAP,v);let se;if(v.isDepthTexture){if(St=M(v.format===li,v.type),re)if(Wt)e.texStorage2D(s.TEXTURE_CUBE_MAP,1,St,it.width,it.height);else for(let Pt=0;Pt<6;Pt++)e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,0,St,it.width,it.height,0,Tt,yt,null)}else if(bt){Wt&&re&&e.texStorage2D(s.TEXTURE_CUBE_MAP,Yt,St,it.width,it.height);for(let Pt=0;Pt<6;Pt++){se=ot[Pt].mipmaps;for(let Se=0;Se<se.length;Se++){let We=se[Se];v.format!==kn?Tt!==null?Wt?gt&&e.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,Se,0,0,We.width,We.height,Tt,We.data):e.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,Se,St,We.width,We.height,0,We.data):$t("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Wt?gt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,Se,0,0,We.width,We.height,Tt,yt,We.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,Se,St,We.width,We.height,0,Tt,yt,We.data)}}}else{if(se=v.mipmaps,Wt&&re){se.length>0&&Yt++;let Pt=T(ot[0]);e.texStorage2D(s.TEXTURE_CUBE_MAP,Yt,St,Pt.width,Pt.height)}for(let Pt=0;Pt<6;Pt++)if(z){Wt?gt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,0,0,0,ot[Pt].width,ot[Pt].height,Tt,yt,ot[Pt].data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,0,St,ot[Pt].width,ot[Pt].height,0,Tt,yt,ot[Pt].data);for(let Se=0;Se<se.length;Se++){let fi=se[Se].image[Pt].image;Wt?gt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,Se+1,0,0,fi.width,fi.height,Tt,yt,fi.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,Se+1,St,fi.width,fi.height,0,Tt,yt,fi.data)}}else{Wt?gt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,0,0,0,Tt,yt,ot[Pt]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,0,St,Tt,yt,ot[Pt]);for(let Se=0;Se<se.length;Se++){let We=se[Se];Wt?gt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,Se+1,0,0,Tt,yt,We.image[Pt]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,Se+1,St,Tt,yt,We.image[Pt])}}}w(v)&&v.mipmapsAutoUpdate===!0&&S(s.TEXTURE_CUBE_MAP),ct.__version=J.version,v.onUpdate&&v.onUpdate(v)}b.__version=v.version}function Et(b,v,L,Z,J,ct){let mt=r.convert(L.format,L.colorSpace),et=r.convert(L.type),rt=R(L.internalFormat,mt,et,L.normalized,L.colorSpace),bt=n.get(v),z=n.get(L);if(z.__renderTarget=v,!bt.__hasExternalTextures){let ot=Math.max(1,v.width>>ct),it=Math.max(1,v.height>>ct);J===s.TEXTURE_3D||J===s.TEXTURE_2D_ARRAY?e.texImage3D(J,ct,rt,ot,it,v.depth,0,mt,et,null):e.texImage2D(J,ct,rt,ot,it,0,mt,et,null)}e.bindFramebuffer(s.FRAMEBUFFER,b),V(v)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,Z,J,z.__webglTexture,0,D(v)):(J===s.TEXTURE_2D||J>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,Z,J,z.__webglTexture,ct),e.bindFramebuffer(s.FRAMEBUFFER,null)}function Qt(b,v,L){if(s.bindRenderbuffer(s.RENDERBUFFER,b),v.depthBuffer){let Z=v.depthTexture,J=Z&&Z.isDepthTexture?Z.type:null,ct=M(v.stencilBuffer,J),mt=v.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;V(v)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,D(v),ct,v.width,v.height):L?s.renderbufferStorageMultisample(s.RENDERBUFFER,D(v),ct,v.width,v.height):s.renderbufferStorage(s.RENDERBUFFER,ct,v.width,v.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,mt,s.RENDERBUFFER,b)}else{let Z=v.textures;for(let J=0;J<Z.length;J++){let ct=Z[J],mt=r.convert(ct.format,ct.colorSpace),et=r.convert(ct.type),rt=R(ct.internalFormat,mt,et,ct.normalized,ct.colorSpace);V(v)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,D(v),rt,v.width,v.height):L?s.renderbufferStorageMultisample(s.RENDERBUFFER,D(v),rt,v.width,v.height):s.renderbufferStorage(s.RENDERBUFFER,rt,v.width,v.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function Ht(b,v,L){let Z=v.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(s.FRAMEBUFFER,b),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let J=n.get(v.depthTexture);J.__renderTarget=v;let ct=Z?v.depthTexture.image[0]:v.depthTexture.image;(!J.__webglTexture||ct.width!==v.width||ct.height!==v.height)&&(ct.width=v.width,ct.height=v.height,v.depthTexture.needsUpdate=!0),Z?wt(v.depthTexture,0):Rt(v.depthTexture,0);let mt=J.__webglTexture,et=D(v),rt=Z?s.TEXTURE_CUBE_MAP_POSITIVE_X+L:s.TEXTURE_2D,bt=v.depthTexture.format===li?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;if(v.depthTexture.format===ii)V(v)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,bt,rt,mt,0,et):s.framebufferTexture2D(s.FRAMEBUFFER,bt,rt,mt,0);else if(v.depthTexture.format===li)V(v)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,bt,rt,mt,0,et):s.framebufferTexture2D(s.FRAMEBUFFER,bt,rt,mt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function oe(b){let v=n.get(b),L=b.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==b.depthTexture){let Z=b.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),Z){let J=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,Z.removeEventListener("dispose",J)};Z.addEventListener("dispose",J),v.__depthDisposeCallback=J}v.__boundDepthTexture=Z}if(b.depthTexture&&!v.__autoAllocateDepthBuffer)if(L)for(let Z=0;Z<6;Z++)Ht(v.__webglFramebuffer[Z],b,Z);else b.texture.mipmaps.length>0?Ht(v.__webglFramebuffer[0],b,0):Ht(v.__webglFramebuffer,b,0);else if(L){v.__webglDepthbuffer=[];for(let Z=0;Z<6;Z++)if(e.bindFramebuffer(s.FRAMEBUFFER,v.__webglFramebuffer[Z]),v.__webglDepthbuffer[Z]===void 0)v.__webglDepthbuffer[Z]=s.createRenderbuffer(),Qt(v.__webglDepthbuffer[Z],b,!1);else{let J=b.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,ct=v.__webglDepthbuffer[Z];s.bindRenderbuffer(s.RENDERBUFFER,ct),s.framebufferRenderbuffer(s.FRAMEBUFFER,J,s.RENDERBUFFER,ct)}}else if(b.texture.mipmaps.length>0?e.bindFramebuffer(s.FRAMEBUFFER,v.__webglFramebuffer[0]):e.bindFramebuffer(s.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=s.createRenderbuffer(),Qt(v.__webglDepthbuffer,b,!1);else{let J=b.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,ct=v.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,ct),s.framebufferRenderbuffer(s.FRAMEBUFFER,J,s.RENDERBUFFER,ct)}e.bindFramebuffer(s.FRAMEBUFFER,null)}function le(b,v,L){let Z=n.get(b);v!==void 0&&Et(Z.__webglFramebuffer,b,b.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),L!==void 0&&oe(b)}function ge(b){let v=b.texture,L=n.get(b),Z=n.get(v);b.addEventListener("dispose",B),U(b);let J=b.textures,ct=b.isWebGLCubeRenderTarget===!0,mt=J.length>1;if(mt||(Z.__webglTexture===void 0&&(Z.__webglTexture=s.createTexture()),Z.__version=v.version,a.memory.textures++),ct){L.__webglFramebuffer=[];for(let et=0;et<6;et++)if(v.mipmaps.length>0){L.__webglFramebuffer[et]=[];for(let rt=0;rt<v.mipmaps.length;rt++)L.__webglFramebuffer[et][rt]=s.createFramebuffer()}else L.__webglFramebuffer[et]=s.createFramebuffer()}else{if(v.mipmaps.length>0){L.__webglFramebuffer=[];for(let et=0;et<v.mipmaps.length;et++)L.__webglFramebuffer[et]=s.createFramebuffer()}else L.__webglFramebuffer=s.createFramebuffer();if(mt)for(let et=0,rt=J.length;et<rt;et++){let bt=n.get(J[et]);bt.__webglTexture===void 0&&(bt.__webglTexture=s.createTexture(),a.memory.textures++)}if(b.samples>0&&V(b)===!1){L.__webglMultisampledFramebuffer=s.createFramebuffer(),L.__webglColorRenderbuffer=[],e.bindFramebuffer(s.FRAMEBUFFER,L.__webglMultisampledFramebuffer);for(let et=0;et<J.length;et++){let rt=J[et];L.__webglColorRenderbuffer[et]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,L.__webglColorRenderbuffer[et]);let bt=r.convert(rt.format,rt.colorSpace),z=r.convert(rt.type),ot=R(rt.internalFormat,bt,z,rt.normalized,rt.colorSpace,b.isXRRenderTarget===!0),it=D(b);s.renderbufferStorageMultisample(s.RENDERBUFFER,it,ot,b.width,b.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+et,s.RENDERBUFFER,L.__webglColorRenderbuffer[et])}s.bindRenderbuffer(s.RENDERBUFFER,null),b.depthBuffer&&(L.__webglDepthRenderbuffer=s.createRenderbuffer(),Qt(L.__webglDepthRenderbuffer,b,!0)),e.bindFramebuffer(s.FRAMEBUFFER,null)}}if(ct){e.bindTexture(s.TEXTURE_CUBE_MAP,Z.__webglTexture),ee(s.TEXTURE_CUBE_MAP,v);for(let et=0;et<6;et++)if(v.mipmaps.length>0)for(let rt=0;rt<v.mipmaps.length;rt++)Et(L.__webglFramebuffer[et][rt],b,v,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+et,rt);else Et(L.__webglFramebuffer[et],b,v,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+et,0);w(v)?S(s.TEXTURE_CUBE_MAP):v.mipmaps.length>0&&s.texParameteri(s.TEXTURE_CUBE_MAP,s.TEXTURE_MAX_LEVEL,v.mipmaps.length-1),e.unbindTexture()}else if(mt){for(let et=0,rt=J.length;et<rt;et++){let bt=J[et],z=n.get(bt),ot=s.TEXTURE_2D;(b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(ot=b.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),e.bindTexture(ot,z.__webglTexture),ee(ot,bt),Et(L.__webglFramebuffer,b,bt,s.COLOR_ATTACHMENT0+et,ot,0),w(bt)&&S(ot)}e.unbindTexture()}else{let et=s.TEXTURE_2D;if((b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(et=b.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),e.bindTexture(et,Z.__webglTexture),ee(et,v),v.mipmaps.length>0)for(let rt=0;rt<v.mipmaps.length;rt++)Et(L.__webglFramebuffer[rt],b,v,s.COLOR_ATTACHMENT0,et,rt);else Et(L.__webglFramebuffer,b,v,s.COLOR_ATTACHMENT0,et,0);w(v)?S(et):v.mipmaps.length>0&&s.texParameteri(et,s.TEXTURE_MAX_LEVEL,v.mipmaps.length-1),e.unbindTexture()}b.depthBuffer&&oe(b)}function x(b){let v=b.textures;for(let L=0,Z=v.length;L<Z;L++){let J=v[L];if(w(J)&&J.mipmapsAutoUpdate===!0){let ct=C(b),mt=n.get(J).__webglTexture;e.bindTexture(ct,mt),S(ct),e.unbindTexture()}}}let P=[];function N(b){if(b.samples>0){if(V(b)===!1){let v=b.textures,L=b.width,Z=b.height,J=s.COLOR_BUFFER_BIT,ct=b.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,mt=n.get(b),et=v.length>1;if(et)for(let bt=0;bt<v.length;bt++)e.bindFramebuffer(s.FRAMEBUFFER,mt.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+bt,s.RENDERBUFFER,null),e.bindFramebuffer(s.FRAMEBUFFER,mt.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+bt,s.TEXTURE_2D,null,0);e.bindFramebuffer(s.READ_FRAMEBUFFER,mt.__webglMultisampledFramebuffer),b.texture.mipmaps.length>0?e.bindFramebuffer(s.DRAW_FRAMEBUFFER,mt.__webglFramebuffer[0]):e.bindFramebuffer(s.DRAW_FRAMEBUFFER,mt.__webglFramebuffer);for(let bt=0;bt<v.length;bt++){if(b.resolveDepthBuffer&&(b.depthBuffer&&(J|=s.DEPTH_BUFFER_BIT),b.stencilBuffer&&b.resolveStencilBuffer&&(J|=s.STENCIL_BUFFER_BIT)),et){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,mt.__webglColorRenderbuffer[bt]);let z=n.get(v[bt]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,z,0)}s.blitFramebuffer(0,0,L,Z,0,0,L,Z,J,s.NEAREST),l===!0&&(P.length=0,P.push(s.COLOR_ATTACHMENT0+bt),b.depthBuffer&&b.storeMultisampledDepthBuffer===!1&&P.push(ct),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,P))}if(e.bindFramebuffer(s.READ_FRAMEBUFFER,null),e.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),et)for(let bt=0;bt<v.length;bt++){e.bindFramebuffer(s.FRAMEBUFFER,mt.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+bt,s.RENDERBUFFER,mt.__webglColorRenderbuffer[bt]);let z=n.get(v[bt]).__webglTexture;e.bindFramebuffer(s.FRAMEBUFFER,mt.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+bt,s.TEXTURE_2D,z,0)}e.bindFramebuffer(s.DRAW_FRAMEBUFFER,mt.__webglMultisampledFramebuffer)}else if(b.depthBuffer&&b.storeMultisampledDepthBuffer===!1&&l){let v=b.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[v])}}}function D(b){return Math.min(i.maxSamples,b.samples)}function V(b){let v=n.get(b);return b.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function ut(b){let v=a.render.frame;u.get(b)!==v&&(u.set(b,v),b.update())}function at(b,v){let L=b.colorSpace,Z=b.format,J=b.type;return b.isCompressedTexture===!0||b.isVideoTexture===!0||L!==ir&&L!==ci&&(he.getTransfer(L)===_e?(Z!==kn||J!==xn)&&$t("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Jt("WebGLTextures: Unsupported texture color space:",L)),v}function T(b){return typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement?(h.width=b.naturalWidth||b.width,h.height=b.naturalHeight||b.height):typeof VideoFrame<"u"&&b instanceof VideoFrame?(h.width=b.displayWidth,h.height=b.displayHeight):(h.width=b.width,h.height=b.height),h}this.allocateTextureUnit=zt,this.resetTextureUnits=j,this.getTextureUnits=nt,this.setTextureUnits=vt,this.setTexture2D=Rt,this.setTexture2DArray=Nt,this.setTexture3D=kt,this.setTextureCube=wt,this.rebindTextures=le,this.setupRenderTarget=ge,this.updateRenderTargetMipmap=x,this.updateMultisampleRenderTarget=N,this.setupDepthRenderbuffer=oe,this.setupFrameBufferTexture=Et,this.useMultisampledRTT=V,this.dispose=q}function Fx(s,t){function e(n,i=ci){let r,a=he.getTransfer(i);if(n===xn)return s.UNSIGNED_BYTE;if(n===xo)return s.UNSIGNED_SHORT_4_4_4_4;if(n===_o)return s.UNSIGNED_SHORT_5_5_5_1;if(n===fc)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===pc)return s.UNSIGNED_INT_10F_11F_11F_REV;if(n===uc)return s.BYTE;if(n===dc)return s.SHORT;if(n===Fs)return s.UNSIGNED_SHORT;if(n===go)return s.INT;if(n===zn)return s.UNSIGNED_INT;if(n===Ln)return s.FLOAT;if(n===Ke)return s.HALF_FLOAT;if(n===mc)return s.ALPHA;if(n===gc)return s.RGB;if(n===kn)return s.RGBA;if(n===ii)return s.DEPTH_COMPONENT;if(n===li)return s.DEPTH_STENCIL;if(n===yo)return s.RED;if(n===vo)return s.RED_INTEGER;if(n===Di)return s.RG;if(n===Mo)return s.RG_INTEGER;if(n===So)return s.RGBA_INTEGER;if(n===Vr||n===Wr||n===Xr||n===qr)if(a===_e)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Vr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Wr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Xr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===qr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Vr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Wr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Xr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===qr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===bo||n===To||n===wo||n===Eo)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===bo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===To)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===wo)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Eo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ao||n===Ro||n===Co||n===Po||n===Io||n===Yr||n===Lo)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Ao||n===Ro)return a===_e?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Co)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Po)return r.COMPRESSED_R11_EAC;if(n===Io)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Yr)return r.COMPRESSED_RG11_EAC;if(n===Lo)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Do||n===No||n===Uo||n===Fo||n===Oo||n===Bo||n===zo||n===ko||n===Ho||n===Go||n===Vo||n===Wo||n===Xo||n===qo)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Do)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===No)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Uo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Fo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Oo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Bo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===zo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ko)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ho)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Go)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Vo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Wo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Xo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===qo)return a===_e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Yo||n===Zo||n===$o)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===Yo)return a===_e?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Zo)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===$o)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Jo||n===Ko||n===Zr||n===Qo)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===Jo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Ko)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Zr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Qo)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===es?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:e}}var Ox=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Bx=`
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

}`,Gc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let n=new mr(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new ke({vertexShader:Ox,fragmentShader:Bx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new ht(new Cn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Vc=class extends Wn{constructor(t,e){super();let n=this,i=null,r=1,a=null,o="local-floor",l=1,h=null,u=null,f=null,p=null,d=null,m=null,_=typeof XRWebGLBinding<"u",c=new Gc,g={},y=e.getContextAttributes(),w=null,S=null,C=[],R=[],M=new ft,E=null,U=null,I=new sn;I.viewport=new Pe;let O=new sn;O.viewport=new Pe;let B=[I,O],H=new ho,F=null,q=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(st){let Rt=C[st];return Rt===void 0&&(Rt=new ws,C[st]=Rt),Rt.getTargetRaySpace()},this.getControllerGrip=function(st){let Rt=C[st];return Rt===void 0&&(Rt=new ws,C[st]=Rt),Rt.getGripSpace()},this.getHand=function(st){let Rt=C[st];return Rt===void 0&&(Rt=new ws,C[st]=Rt),Rt.getHandSpace()};function Y(st){let Rt=R.indexOf(st.inputSource);if(Rt===-1)return;let Nt=C[Rt];Nt!==void 0&&(Nt.update(st.inputSource,st.frame,h||a),Nt.dispatchEvent({type:st.type,data:st.inputSource}))}function X(){i.removeEventListener("select",Y),i.removeEventListener("selectstart",Y),i.removeEventListener("selectend",Y),i.removeEventListener("squeeze",Y),i.removeEventListener("squeezestart",Y),i.removeEventListener("squeezeend",Y),i.removeEventListener("end",X),i.removeEventListener("inputsourceschange",$);for(let st=0;st<C.length;st++){let Rt=R[st];Rt!==null&&(R[st]=null,C[st].disconnect(Rt))}F=null,q=null,c.reset();for(let st in g)delete g[st];if(t.setRenderTarget(w),d=null,p=null,f=null,i=null,S=null,zt.stop(),n.isPresenting=!1,t.setPixelRatio(E),t.setSize(M.width,M.height,!1),U!==null){let st=U.camera;st.fov=U.fov,st.zoom=U.zoom,st.updateProjectionMatrix(),U=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(st){r=st,n.isPresenting===!0&&$t("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(st){o=st,n.isPresenting===!0&&$t("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||a},this.setReferenceSpace=function(st){h=st},this.getBaseLayer=function(){return p!==null?p:d},this.getBinding=function(){return f===null&&_&&(f=new XRWebGLBinding(i,e)),f},this.getFrame=function(){return m},this.getSession=function(){return i},this.setSession=async function(st){if(i=st,i!==null){if(w=t.getRenderTarget(),i.addEventListener("select",Y),i.addEventListener("selectstart",Y),i.addEventListener("selectend",Y),i.addEventListener("squeeze",Y),i.addEventListener("squeezestart",Y),i.addEventListener("squeezeend",Y),i.addEventListener("end",X),i.addEventListener("inputsourceschange",$),y.xrCompatible!==!0&&await e.makeXRCompatible(),E=t.getPixelRatio(),t.getSize(M),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let Nt=null,kt=null,wt=null;y.depth&&(wt=y.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,Nt=y.stencil?li:ii,kt=y.stencil?es:zn);let Ut={colorFormat:e.RGBA8,depthFormat:wt,scaleFactor:r};f=this.getBinding(),p=f.createProjectionLayer(Ut),i.updateRenderState({layers:[p]}),t.setPixelRatio(1),t.setSize(p.textureWidth,p.textureHeight,!1),S=new He(p.textureWidth,p.textureHeight,{format:kn,type:xn,depthTexture:new si(p.textureWidth,p.textureHeight,kt,void 0,void 0,void 0,void 0,void 0,void 0,Nt),stencilBuffer:y.stencil,colorSpace:t.outputColorSpace,samples:y.antialias?4:0,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}else{let Nt={antialias:y.antialias,alpha:!0,depth:y.depth,stencil:y.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(i,e,Nt),i.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),S=new He(d.framebufferWidth,d.framebufferHeight,{format:kn,type:xn,colorSpace:t.outputColorSpace,stencilBuffer:y.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(l),h=null,a=await i.requestReferenceSpace(o),zt.setContext(i),zt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return c.getDepthTexture()};function $(st){for(let Rt=0;Rt<st.removed.length;Rt++){let Nt=st.removed[Rt],kt=R.indexOf(Nt);kt>=0&&(R[kt]=null,C[kt].disconnect(Nt))}for(let Rt=0;Rt<st.added.length;Rt++){let Nt=st.added[Rt],kt=R.indexOf(Nt);if(kt===-1){for(let Ut=0;Ut<C.length;Ut++)if(Ut>=R.length){R.push(Nt),kt=Ut;break}else if(R[Ut]===null){R[Ut]=Nt,kt=Ut;break}if(kt===-1)break}let wt=C[kt];wt&&wt.connect(Nt)}}function W(st,Rt){Rt===null?st.matrixWorld.copy(st.matrix):st.matrixWorld.multiplyMatrices(Rt.matrixWorld,st.matrix),st.matrixWorldInverse.copy(st.matrixWorld).invert()}this.updateCamera=function(st){if(i===null)return;let Rt=st.near,Nt=st.far;c.texture!==null&&(c.depthNear>0&&(Rt=c.depthNear),c.depthFar>0&&(Nt=c.depthFar)),H.near=O.near=I.near=Rt,H.far=O.far=I.far=Nt,(F!==H.near||q!==H.far)&&(i.updateRenderState({depthNear:H.near,depthFar:H.far}),F=H.near,q=H.far),H.layers.mask=st.layers.mask|6,I.layers.mask=H.layers.mask&-5,O.layers.mask=H.layers.mask&-3;let kt=st.parent,wt=H.cameras;W(H,kt);for(let Ut=0;Ut<wt.length;Ut++)W(wt[Ut],kt);H.projectionMatrix.copy(I.projectionMatrix),H.projectionMatrixInverse.copy(I.projectionMatrixInverse),U===null&&st.isPerspectiveCamera&&(U={camera:st,fov:st.fov,zoom:st.zoom}),j(st,H,kt)};function j(st,Rt,Nt){Nt===null?st.matrix.copy(Rt.matrixWorld):(st.matrix.copy(Nt.matrixWorld),st.matrix.invert(),st.matrix.multiply(Rt.matrixWorld)),st.matrix.decompose(st.position,st.quaternion,st.scale),st.updateMatrixWorld(!0),st.projectionMatrix.copy(Rt.projectionMatrix),st.projectionMatrixInverse.copy(Rt.projectionMatrixInverse),st.isPerspectiveCamera&&(st.fov=Ha*2*Math.atan(1/st.projectionMatrix.elements[5]),st.zoom=1)}this.getCamera=function(){return H},this.getFoveation=function(){if(!(p===null&&d===null))return l},this.setFoveation=function(st){l=st,p!==null&&(p.fixedFoveation=st),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=st)},this.hasDepthSensing=function(){return c.texture!==null},this.getDepthSensingMesh=function(){return c.getMesh(H)},this.getCameraTexture=function(st){return g[st]};let nt=null;function vt(st,Rt){if(u=Rt.getViewerPose(h||a),m=Rt,u!==null){let Nt=u.views;d!==null&&(t.setRenderTargetFramebuffer(S,d.framebuffer),t.setRenderTarget(S));let kt=!1;Nt.length!==H.cameras.length&&(H.cameras.length=0,kt=!0);for(let Vt=0;Vt<Nt.length;Vt++){let ee=Nt[Vt],ne=null;if(d!==null)ne=d.getViewport(ee);else{let Mt=f.getViewSubImage(p,ee);ne=Mt.viewport,Vt===0&&(t.setRenderTargetTextures(S,Mt.colorTexture,Mt.depthStencilTexture),t.setRenderTarget(S))}let lt=B[Vt];lt===void 0&&(lt=new sn,lt.layers.enable(Vt),lt.viewport=new Pe,B[Vt]=lt),lt.matrix.fromArray(ee.transform.matrix),lt.matrix.decompose(lt.position,lt.quaternion,lt.scale),lt.projectionMatrix.fromArray(ee.projectionMatrix),lt.projectionMatrixInverse.copy(lt.projectionMatrix).invert(),lt.viewport.set(ne.x,ne.y,ne.width,ne.height),Vt===0&&(H.matrix.copy(lt.matrix),H.matrix.decompose(H.position,H.quaternion,H.scale)),kt===!0&&H.cameras.push(lt)}let wt=i.enabledFeatures;if(wt&&wt.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&_){f=n.getBinding();let Vt=f.getDepthInformation(Nt[0]);Vt&&Vt.isValid&&Vt.texture&&c.init(Vt,i.renderState)}if(wt&&wt.includes("camera-access")&&_){t.state.unbindTexture(),f=n.getBinding();for(let Vt=0;Vt<Nt.length;Vt++){let ee=Nt[Vt].camera;if(ee){let ne=g[ee];ne||(ne=new mr,g[ee]=ne);let lt=f.getCameraImage(ee);ne.sourceTexture=lt}}}}for(let Nt=0;Nt<C.length;Nt++){let kt=R[Nt],wt=C[Nt];kt!==null&&wt!==void 0&&wt.update(kt,Rt,h||a)}nt&&nt(st,Rt),Rt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Rt}),m=null}let zt=new nd;zt.setAnimationLoop(vt),this.setAnimationLoop=function(st){nt=st},this.dispose=function(){}}},zx=new fe,dd=new jt;dd.set(-1,0,0,0,1,0,0,0,1);function kx(s,t){function e(c,g){c.matrixAutoUpdate===!0&&c.updateMatrix(),g.value.copy(c.matrix)}function n(c,g){g.color.getRGB(c.fogColor.value,wc(s)),g.isFog?(c.fogNear.value=g.near,c.fogFar.value=g.far):g.isFogExp2&&(c.fogDensity.value=g.density)}function i(c,g,y,w,S){g.isNodeMaterial?g.uniformsNeedUpdate=!1:g.isMeshBasicMaterial?r(c,g):g.isMeshLambertMaterial?(r(c,g),g.envMap&&(c.envMapIntensity.value=g.envMapIntensity)):g.isMeshToonMaterial?(r(c,g),f(c,g)):g.isMeshPhongMaterial?(r(c,g),u(c,g),g.envMap&&(c.envMapIntensity.value=g.envMapIntensity)):g.isMeshStandardMaterial?(r(c,g),p(c,g),g.isMeshPhysicalMaterial&&d(c,g,S)):g.isMeshMatcapMaterial?(r(c,g),m(c,g)):g.isMeshDepthMaterial?r(c,g):g.isMeshDistanceMaterial?(r(c,g),_(c,g)):g.isMeshNormalMaterial?r(c,g):g.isLineBasicMaterial?(a(c,g),g.isLineDashedMaterial&&o(c,g)):g.isPointsMaterial?l(c,g,y,w):g.isSpriteMaterial?h(c,g):g.isShadowMaterial?(c.color.value.copy(g.color),c.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function r(c,g){c.opacity.value=g.opacity,g.color&&c.diffuse.value.copy(g.color),g.emissive&&c.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(c.map.value=g.map,e(g.map,c.mapTransform)),g.alphaMap&&(c.alphaMap.value=g.alphaMap,e(g.alphaMap,c.alphaMapTransform)),g.bumpMap&&(c.bumpMap.value=g.bumpMap,e(g.bumpMap,c.bumpMapTransform),c.bumpScale.value=g.bumpScale,g.side===fn&&(c.bumpScale.value*=-1)),g.normalMap&&(c.normalMap.value=g.normalMap,e(g.normalMap,c.normalMapTransform),c.normalScale.value.copy(g.normalScale),g.side===fn&&c.normalScale.value.negate()),g.displacementMap&&(c.displacementMap.value=g.displacementMap,e(g.displacementMap,c.displacementMapTransform),c.displacementScale.value=g.displacementScale,c.displacementBias.value=g.displacementBias),g.emissiveMap&&(c.emissiveMap.value=g.emissiveMap,e(g.emissiveMap,c.emissiveMapTransform)),g.specularMap&&(c.specularMap.value=g.specularMap,e(g.specularMap,c.specularMapTransform)),g.alphaTest>0&&(c.alphaTest.value=g.alphaTest);let y=t.get(g),w=y.envMap,S=y.envMapRotation;w&&(c.envMap.value=w,c.envMapRotation.value.setFromMatrix4(zx.makeRotationFromEuler(S)).transpose(),w.isCubeTexture&&w.isRenderTargetTexture===!1&&c.envMapRotation.value.premultiply(dd),c.reflectivity.value=g.reflectivity,c.ior.value=g.ior,c.refractionRatio.value=g.refractionRatio),g.lightMap&&(c.lightMap.value=g.lightMap,c.lightMapIntensity.value=g.lightMapIntensity,e(g.lightMap,c.lightMapTransform)),g.aoMap&&(c.aoMap.value=g.aoMap,c.aoMapIntensity.value=g.aoMapIntensity,e(g.aoMap,c.aoMapTransform))}function a(c,g){c.diffuse.value.copy(g.color),c.opacity.value=g.opacity,g.map&&(c.map.value=g.map,e(g.map,c.mapTransform))}function o(c,g){c.dashSize.value=g.dashSize,c.totalSize.value=g.dashSize+g.gapSize,c.scale.value=g.scale}function l(c,g,y,w){c.diffuse.value.copy(g.color),c.opacity.value=g.opacity,c.size.value=g.size*y,c.scale.value=w*.5,g.map&&(c.map.value=g.map,e(g.map,c.uvTransform)),g.alphaMap&&(c.alphaMap.value=g.alphaMap,e(g.alphaMap,c.alphaMapTransform)),g.alphaTest>0&&(c.alphaTest.value=g.alphaTest)}function h(c,g){c.diffuse.value.copy(g.color),c.opacity.value=g.opacity,c.rotation.value=g.rotation,g.map&&(c.map.value=g.map,e(g.map,c.mapTransform)),g.alphaMap&&(c.alphaMap.value=g.alphaMap,e(g.alphaMap,c.alphaMapTransform)),g.alphaTest>0&&(c.alphaTest.value=g.alphaTest)}function u(c,g){c.specular.value.copy(g.specular),c.shininess.value=Math.max(g.shininess,1e-4)}function f(c,g){g.gradientMap&&(c.gradientMap.value=g.gradientMap)}function p(c,g){c.metalness.value=g.metalness,g.metalnessMap&&(c.metalnessMap.value=g.metalnessMap,e(g.metalnessMap,c.metalnessMapTransform)),c.roughness.value=g.roughness,g.roughnessMap&&(c.roughnessMap.value=g.roughnessMap,e(g.roughnessMap,c.roughnessMapTransform)),g.envMap&&(c.envMapIntensity.value=g.envMapIntensity)}function d(c,g,y){c.ior.value=g.ior,g.diffuseRoughness>0&&(c.diffuseRoughness.value=g.diffuseRoughness,g.diffuseRoughnessMap&&(c.diffuseRoughnessMap.value=g.diffuseRoughnessMap,e(g.diffuseRoughnessMap,c.diffuseRoughnessMapTransform))),g.sheen>0&&(c.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),c.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(c.sheenColorMap.value=g.sheenColorMap,e(g.sheenColorMap,c.sheenColorMapTransform)),g.sheenRoughnessMap&&(c.sheenRoughnessMap.value=g.sheenRoughnessMap,e(g.sheenRoughnessMap,c.sheenRoughnessMapTransform))),g.clearcoat>0&&(c.clearcoat.value=g.clearcoat,c.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(c.clearcoatMap.value=g.clearcoatMap,e(g.clearcoatMap,c.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(c.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,e(g.clearcoatRoughnessMap,c.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(c.clearcoatNormalMap.value=g.clearcoatNormalMap,e(g.clearcoatNormalMap,c.clearcoatNormalMapTransform),c.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===fn&&c.clearcoatNormalScale.value.negate())),g.dispersion>0&&(c.dispersion.value=g.dispersion),g.retroreflectivity>0&&(c.retroreflectivity.value=g.retroreflectivity),g.iridescence>0&&(c.iridescence.value=g.iridescence,c.iridescenceIOR.value=g.iridescenceIOR,c.iridescenceThicknessMinimum.value=g.iridescenceThicknessMinimum,c.iridescenceThicknessMaximum.value=g.iridescenceThicknessMaximum,g.iridescenceMap&&(c.iridescenceMap.value=g.iridescenceMap,e(g.iridescenceMap,c.iridescenceMapTransform)),g.iridescenceThicknessMap&&(c.iridescenceThicknessMap.value=g.iridescenceThicknessMap,e(g.iridescenceThicknessMap,c.iridescenceThicknessMapTransform))),g.transmission>0&&(c.transmission.value=g.transmission,c.transmissionSamplerMap.value=y.texture,c.transmissionSamplerSize.value.set(y.width,y.height),g.transmissionMap&&(c.transmissionMap.value=g.transmissionMap,e(g.transmissionMap,c.transmissionMapTransform)),c.thickness.value=g.thickness,g.thicknessMap&&(c.thicknessMap.value=g.thicknessMap,e(g.thicknessMap,c.thicknessMapTransform)),c.attenuationDistance.value=g.attenuationDistance,c.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(c.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(c.anisotropyMap.value=g.anisotropyMap,e(g.anisotropyMap,c.anisotropyMapTransform))),c.specularIntensity.value=g.specularIntensity,c.specularColor.value.copy(g.specularColor),g.specularColorMap&&(c.specularColorMap.value=g.specularColorMap,e(g.specularColorMap,c.specularColorMapTransform)),g.specularIntensityMap&&(c.specularIntensityMap.value=g.specularIntensityMap,e(g.specularIntensityMap,c.specularIntensityMapTransform))}function m(c,g){g.matcap&&(c.matcap.value=g.matcap)}function _(c,g){let y=t.get(g).light;c.referencePosition.value.setFromMatrixPosition(y.matrixWorld),c.nearDistance.value=y.shadow.camera.near,c.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function Hx(s,t,e,n){let i={},r={};function a(y,w){let S=w.program;n.uniformBlockBinding(y,S,i[y.id])}function o(y,w){let S=i[y.id];S===void 0&&(m(y),S=l(y),i[y.id]=S,y.addEventListener("dispose",c));let C=w.program;n.updateUBOMapping(y,C);let R=t.render.frame;r[y.id]!==R&&(h(y),r[y.id]=R)}function l(y){let w=s.createBuffer(),S=y.__size,C=y.usage;return s.bindBuffer(s.UNIFORM_BUFFER,w),s.bufferData(s.UNIFORM_BUFFER,S,C),s.bindBuffer(s.UNIFORM_BUFFER,null),w}function h(y){let w=i[y.id],S=y.uniforms,C=y.__cache;s.bindBuffer(s.UNIFORM_BUFFER,w);for(let R=0,M=S.length;R<M;R++){let E=S[R];if(Array.isArray(E))for(let U=0,I=E.length;U<I;U++)u(E[U],R,U,C);else u(E,R,0,C)}s.bindBuffer(s.UNIFORM_BUFFER,null)}function u(y,w,S,C){if(p(y,w,S,C)===!0){let R=y.__offset,M=y.value;if(Array.isArray(M)){let E=0;for(let U=0;U<M.length;U++){let I=M[U],O=_(I,!0);f(I,y.__data,E),E+=O.storage/Float32Array.BYTES_PER_ELEMENT}}else f(M,y.__data,0);s.bufferSubData(s.UNIFORM_BUFFER,R,y.__data)}}function f(y,w,S){typeof y=="number"||typeof y=="boolean"?w[S]=y:y.isMatrix3?(w[S]=y.elements[0],w[S+1]=y.elements[1],w[S+2]=y.elements[2],w[S+3]=0,w[S+4]=y.elements[3],w[S+5]=y.elements[4],w[S+6]=y.elements[5],w[S+7]=0,w[S+8]=y.elements[6],w[S+9]=y.elements[7],w[S+10]=y.elements[8],w[S+11]=0):ArrayBuffer.isView(y)?w.set(y.subarray(0,w.length-S),S):y.toArray(w,S)}function p(y,w,S,C){let R=y.value,M=w+"_"+S;if(Array.isArray(R)){C[M]===void 0&&(C[M]=[]);let E=C[M],U=!1;for(let I=0;I<R.length;I++)d(R[I],E,I)===!0&&(U=!0);return U}return d(R,C,M)}function d(y,w,S){if(w[S]===void 0)return typeof y=="number"||typeof y=="boolean"?w[S]=y:ArrayBuffer.isView(y)?w[S]=y.slice():w[S]=y.clone(),!0;{let C=w[S];if(typeof y=="number"||typeof y=="boolean"){if(C!==y)return w[S]=y,!0}else{if(ArrayBuffer.isView(y))return!0;if(C.equals(y)===!1)return C.copy(y),!0}}return!1}function m(y){let w=y.uniforms,S=0,C=16;for(let M=0,E=w.length;M<E;M++){let U=Array.isArray(w[M])?w[M]:[w[M]];for(let I=0,O=U.length;I<O;I++){let B=U[I],H=Array.isArray(B.value)?B.value:[B.value],F=Array.isArray(w[M])||Array.isArray(B.value),q=S;for(let X=0,$=H.length;X<$;X++){let W=H[X],j=_(W,F),nt=S%C,vt=nt%j.boundary,zt=nt+vt;S+=vt,zt!==0&&C-zt<j.storage&&(S+=C-zt),X===0&&(q=S),S+=j.storage}let Y=B.type==="int"?Int32Array:B.type==="uint"?Uint32Array:Float32Array;B.__data=new Y((S-q)/Float32Array.BYTES_PER_ELEMENT),B.__offset=q}}let R=S%C;return R>0&&(S+=C-R),y.__size=S,y.__cache={},this}function _(y,w){let S={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(S.boundary=4,S.storage=4):y.isVector2?(S.boundary=8,S.storage=8):y.isVector3||y.isColor?(S.boundary=16,S.storage=12):y.isVector4?(S.boundary=16,S.storage=16):y.isMatrix3?(S.boundary=16,S.storage=48):y.isMatrix4?(S.boundary=16,S.storage=64):y.isTexture?$t("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(y)?(S.boundary=16,S.storage=y.byteLength):$t("WebGLRenderer: Unsupported uniform value type.",y),w===!0&&(S.boundary=16,S.storage=Math.ceil(S.storage/16)*16),S}function c(y){let w=y.target;w.removeEventListener("dispose",c),s.deleteBuffer(i[w.id]),delete i[w.id],delete r[w.id]}function g(){for(let y in i)s.deleteBuffer(i[y]);i={},r={}}return{bind:a,update:o,dispose:g}}var Gx=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Zn=null;function Vx(){return Zn===null&&(Zn=new dr(Gx,16,16,Di,Ke),Zn.name="DFG_LUT",Zn.minFilter=un,Zn.magFilter=un,Zn.wrapS=Gn,Zn.wrapT=Gn,Zn.generateMipmaps=!1,Zn.needsUpdate=!0),Zn}var il=class{constructor(t={}){let{canvas:e=bu(),context:n=null,depth:i=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:h=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:p=!1,outputBufferType:d=xn}=t;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=a;let _=d,c=new Set([So,Mo,vo]),g=new Set([xn,zn,Fs,es,xo,_o]),y=new Uint32Array(4),w=new Int32Array(4),S={textures:[],min:[],max:[],resolution:[]},C=null,R=null,M=[],E=[],U=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Yn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let I=this,O=!1,B=null,H=null,F=null,q=null;this._outputColorSpace=nn;let Y=0,X=0,$=null,W=-1,j=null,nt=new Pe,vt=new Pe,zt=null,st=new Xt(0),Rt=0,Nt=e.width,kt=e.height,wt=1,Ut=null,we=null,Vt=new Pe(0,0,Nt,kt),ee=new Pe(0,0,Nt,kt),ne=!1,lt=new Ei,Mt=new Xa,_t=!1,Dt=!1,Et=new fe,Qt=new k,Ht=new Pe,oe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},le=!1;function ge(){return $===null?wt:1}let x=n;function P(A,G){return e.getContext(A,G)}let N,D,V,ut,at,T,b,v,L,Z,J,ct,mt,et,rt,bt,z,ot,it,Tt,yt,St,Wt;try{let A={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:h,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${"187"}`),e.addEventListener("webglcontextlost",Yt,!1),e.addEventListener("webglcontextrestored",se,!1),e.addEventListener("webglcontextcreationerror",Pt,!1),x===null){let G="webgl2";if(x=P(G,A),x===null)throw P(G)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}re()}catch(A){throw e.removeEventListener("webglcontextlost",Yt,!1),e.removeEventListener("webglcontextrestored",se,!1),e.removeEventListener("webglcontextcreationerror",Pt,!1),Jt("WebGLRenderer: "+A.message),A}function re(){N=new tg(x),N.init(),yt=new Fx(x,N),D=new Vm(x,N,t,yt),V=new Nx(x,N),D.reversedDepthBuffer&&p&&V.buffers.depth.setReversed(!0),H=x.createFramebuffer(),F=x.createFramebuffer(),q=x.createFramebuffer(),ut=new ig(x),at=new vx,T=new Ux(x,N,V,at,D,yt,ut),b=new jm(I),v=new rp(x),St=new Hm(x,v),L=new eg(x,v,ut,St),Z=new rg(x,L,v,St,ut),ot=new sg(x,D,T),rt=new Wm(at),J=new yx(I,b,N,D,St,rt),ct=new kx(I,at),mt=new Sx,et=new Rx(N),z=new km(I,b,V,Z,m,l),bt=new Dx(I,Z,D),Wt=new Hx(x,ut,D,V),it=new Gm(x,N,ut),Tt=new ng(x,N,ut),ut.programs=J.programs,I.capabilities=D,I.extensions=N,I.properties=at,I.renderLists=mt,I.shadowMap=bt,I.state=V,I.info=ut}_!==xn&&(U=new og(_,e.width,e.height,o,i,r));let gt=new Vc(I,x);this.xr=gt,this.getContext=function(){return x},this.getContextAttributes=function(){return x.getContextAttributes()},this.forceContextLoss=function(){let A=N.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){let A=N.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return wt},this.setPixelRatio=function(A){A!==void 0&&(wt=A,this.setSize(Nt,kt,!1))},this.getSize=function(A){return A.set(Nt,kt)},this.setSize=function(A,G,tt=!0){if(gt.isPresenting){$t("WebGLRenderer: Can't change size while VR device is presenting.");return}Nt=A,kt=G,e.width=Math.floor(A*wt),e.height=Math.floor(G*wt),tt===!0&&(e.style.width=A+"px",e.style.height=G+"px"),U!==null&&U.setSize(e.width,e.height),this.setViewport(0,0,A,G)},this.getDrawingBufferSize=function(A){return A.set(Nt*wt,kt*wt).floor()},this.setDrawingBufferSize=function(A,G,tt){Nt=A,kt=G,wt=tt,e.width=Math.floor(A*tt),e.height=Math.floor(G*tt),this.setViewport(0,0,A,G)},this.setEffects=function(A){if(_===xn){Jt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(A){for(let G=0;G<A.length;G++)if(A[G].isOutputPass===!0){$t("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}U.setEffects(A||[])},this.getCurrentViewport=function(A){return A.copy(nt)},this.getViewport=function(A){return A.copy(Vt)},this.setViewport=function(A,G,tt,K){A.isVector4?Vt.set(A.x,A.y,A.z,A.w):Vt.set(A,G,tt,K),V.viewport(nt.copy(Vt).multiplyScalar(ge()).round())},this.getScissor=function(A){return A.copy(ee)},this.setScissor=function(A,G,tt,K){A.isVector4?ee.set(A.x,A.y,A.z,A.w):ee.set(A,G,tt,K),V.scissor(vt.copy(ee).multiplyScalar(ge()).round())},this.getScissorTest=function(){return ne},this.setScissorTest=function(A){V.setScissorTest(ne=A)},this.setOpaqueSort=function(A){Ut=A},this.setTransparentSort=function(A){we=A},this.getClearColor=function(A){return A.copy(z.getClearColor())},this.setClearColor=function(){z.setClearColor(...arguments)},this.getClearAlpha=function(){return z.getClearAlpha()},this.setClearAlpha=function(){z.setClearAlpha(...arguments)},this.clear=function(A=!0,G=!0,tt=!0){let K=0;if(A){let Q=!1;if($!==null){let Ct=$.texture.format;Q=c.has(Ct)}if(Q){let Ct=$.texture.type,Ft=g.has(Ct),At=z.getClearColor(),Lt=z.getClearAlpha(),Gt=At.r,te=At.g,pe=At.b;Ft?(y[0]=Gt,y[1]=te,y[2]=pe,y[3]=Lt,x.clearBufferuiv(x.COLOR,0,y)):(w[0]=Gt,w[1]=te,w[2]=pe,w[3]=Lt,x.clearBufferiv(x.COLOR,0,w))}else K|=x.COLOR_BUFFER_BIT}G&&(K|=x.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),tt&&(K|=x.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),K!==0&&x.clear(K)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(A){A.setRenderer(this),B=A},this.dispose=function(){e.removeEventListener("webglcontextlost",Yt,!1),e.removeEventListener("webglcontextrestored",se,!1),e.removeEventListener("webglcontextcreationerror",Pt,!1),z.dispose(),mt.dispose(),et.dispose(),T.dispose(),at.dispose(),b.dispose(),Z.dispose(),L.dispose(),St.dispose(),Wt.dispose(),J.dispose(),gt.dispose(),gt.removeEventListener("sessionstart",jc),gt.removeEventListener("sessionend",th),Bi.stop()};function Yt(A){A.preventDefault(),Sc("WebGLRenderer: Context Lost."),O=!0}function se(){Sc("WebGLRenderer: Context Restored."),O=!1;let A=ut.autoReset,G=bt.enabled,tt=bt.autoUpdate,K=bt.needsUpdate,Q=bt.type;re(),ut.autoReset=A,bt.enabled=G,bt.autoUpdate=tt,bt.needsUpdate=K,bt.type=Q}function Pt(A){Jt("WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function Se(A){let G=A.target;G.removeEventListener("dispose",Se),We(G)}function We(A){fi(A),at.remove(A)}function fi(A){let G=at.get(A).programs;G!==void 0&&(G.forEach(function(tt){J.releaseProgram(tt)}),A.isShaderMaterial&&J.releaseShaderCache(A))}this.renderBufferDirect=function(A,G,tt,K,Q,Ct){G===null&&(G=oe);let Ft=Q.isMesh&&Q.matrixWorld.determinantAffine()<0,At=Fd(A,G,tt,K,Q);V.setMaterial(K,Ft);let Lt=tt.index,Gt=1;if(K.wireframe===!0){if(Lt=L.getWireframeAttribute(tt),Lt===void 0)return;Gt=2}let te=tt.drawRange,pe=tt.attributes.position,Ot=te.start*Gt,me=(te.start+te.count)*Gt;Ct!==null&&(Ot=Math.max(Ot,Ct.start*Gt),me=Math.min(me,(Ct.start+Ct.count)*Gt)),Lt!==null?(Ot=Math.max(Ot,0),me=Math.min(me,Lt.count)):pe!=null&&(Ot=Math.max(Ot,0),me=Math.min(me,pe.count));let Oe=me-Ot;if(Oe<0||Oe===1/0)return;St.setup(Q,K,At,tt,Lt);let Ae,Ee=it;if(Lt!==null&&(Ae=v.get(Lt),Ee=Tt,Ee.setIndex(Ae)),Q.isMesh)K.wireframe===!0?(V.setLineWidth(K.wireframeLinewidth*ge()),Ee.setMode(x.LINES)):Ee.setMode(x.TRIANGLES);else if(Q.isLine){let Qe=K.linewidth;Qe===void 0&&(Qe=1),V.setLineWidth(Qe*ge()),Q.isLineSegments?Ee.setMode(x.LINES):Q.isLineLoop?Ee.setMode(x.LINE_LOOP):Ee.setMode(x.LINE_STRIP)}else Q.isPoints?Ee.setMode(x.POINTS):Q.isSprite&&Ee.setMode(x.TRIANGLES);if(Q.isBatchedMesh)if(N.get("WEBGL_multi_draw"))Ee.renderMultiDraw(Q._multiDrawStarts,Q._multiDrawCounts,Q._multiDrawCount);else{let Qe=Q._multiDrawStarts,Bt=Q._multiDrawCounts,hn=Q._multiDrawCount,ve=Lt?v.get(Lt).bytesPerElement:1,zi=at.get(K).currentProgram.getUniforms();for(let je=0;je<hn;je++)zi.setValue(x,"_gl_DrawID",je),Ee.render(Qe[je]/ve,Bt[je])}else if(Q.isInstancedMesh)Ee.renderInstances(Ot,Oe,Q.count);else if(tt.isInstancedBufferGeometry){let Qe=tt._maxInstanceCount!==void 0?tt._maxInstanceCount:1/0,Bt=Math.min(tt.instanceCount,Qe);Ee.renderInstances(Ot,Oe,Bt)}else Ee.render(Ot,Oe)};function Qc(A,G,tt,K){B!==null&&A.isNodeMaterial&&B.setObject(K,A),_t===!0&&rt.setState(A,tt,!1),A.transparent===!0&&A.side===In&&A.forceSinglePass===!1?(A.side=fn,A.needsUpdate=!0,Xs(A,G,K),A.side=qn,A.needsUpdate=!0,Xs(A,G,K),A.side=In):Xs(A,G,K)}this.compile=function(A,G,tt=null){tt===null&&(tt=A),B!==null&&B.renderStart(A,G,tt),R=et.get(tt),R.init(G),E.push(R),tt.traverseVisible(function(Q){Q.isLight&&Q.layers.test(G.layers)&&(R.pushLight(Q),Q.castShadow&&R.pushShadow(Q))}),A!==tt&&A.traverseVisible(function(Q){Q.isLight&&Q.layers.test(G.layers)&&(R.pushLight(Q),Q.castShadow&&R.pushShadow(Q))}),R.setupLights(),B!==null&&B.updateLights(R.state.lightsArray),Dt=this.localClippingEnabled,_t=rt.init(this.clippingPlanes,Dt),_t===!0&&rt.setGlobalState(this.clippingPlanes,G),B!==null&&bt.render(R.state.shadowsArray,tt,G);let K=new Set;return A.traverse(function(Q){if(!(Q.isMesh||Q.isPoints||Q.isLine||Q.isSprite))return;let Ct=Q.material;if(Ct)if(Array.isArray(Ct))for(let Ft=0;Ft<Ct.length;Ft++){let At=Ct[Ft];Qc(At,tt,G,Q),K.add(At)}else Qc(Ct,tt,G,Q),K.add(Ct)}),R=E.pop(),B!==null&&B.renderEnd(),K},this.compileAsync=function(A,G,tt=null){let K=this.compile(A,G,tt);return new Promise(Q=>{function Ct(){if(K.forEach(function(Ft){let Lt=at.get(Ft).currentProgram;(Lt===void 0||Lt.isReady())&&K.delete(Ft)}),K.size===0){Q(A);return}setTimeout(Ct,10)}N.get("KHR_parallel_shader_compile")!==null?Ct():setTimeout(Ct,10)})};let _l=null;function Nd(A){_l&&_l(A)}function jc(){Bi.stop()}function th(){Bi.start()}let Bi=new nd;Bi.setAnimationLoop(Nd),typeof self<"u"&&Bi.setContext(self),this.setAnimationLoop=function(A){_l=A,gt.setAnimationLoop(A),A===null?Bi.stop():Bi.start()},gt.addEventListener("sessionstart",jc),gt.addEventListener("sessionend",th),this.render=function(A,G){if(G!==void 0&&G.isCamera!==!0){Jt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(O===!0)return;B!==null&&B.renderStart(A,G);let tt=gt.enabled===!0&&gt.isPresenting===!0,K=U!==null&&($===null||tt)&&U.begin(I,$);if(A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),gt.enabled===!0&&gt.isPresenting===!0&&(U===null||U.isCompositing()===!1)&&(gt.cameraAutoUpdate===!0&&gt.updateCamera(G),G=gt.getCamera()),A.isScene===!0&&A.onBeforeRender(I,A,G,$),R=et.get(A,E.length),R.init(G),R.state.textureUnits=T.getTextureUnits(),E.push(R),Et.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),G.isArrayCamera?Mt.setFromArrayCamera(G):lt.setFromProjectionMatrix(Et,Rn,G.reversedDepth),Dt=this.localClippingEnabled,_t=rt.init(this.clippingPlanes,Dt),C=mt.get(A,M.length),C.init(),M.push(C),this.info.render.frame++,gt.enabled===!0&&gt.isPresenting===!0){let Ft=I.xr.getDepthSensingMesh();Ft!==null&&yl(Ft,G,-1/0,I.sortObjects)}yl(A,G,0,I.sortObjects),C.finish(),B!==null&&B.updateLights(R.state.lightsArray),I.sortObjects===!0&&C.sort(Ut,we),le=gt.enabled===!1||gt.isPresenting===!1||gt.hasDepthSensing()===!1,le&&z.addToRenderList(C,A),this.info.autoReset===!0&&this.info.reset(),_t===!0&&rt.beginShadows();let Q=R.state.shadowsArray;if(bt.render(Q,A,G),_t===!0&&rt.endShadows(),(K&&U.hasRenderPass())===!1){let Ft=C.opaque,At=C.transmissive;if(R.setupLights(),G.isArrayCamera){let Lt=G.cameras;if(At.length>0)for(let Gt=0,te=Lt.length;Gt<te;Gt++){let pe=Lt[Gt];nh(Ft,At,A,pe)}le&&z.render(A);for(let Gt=0,te=Lt.length;Gt<te;Gt++){let pe=Lt[Gt];eh(C,A,pe,pe.viewport)}}else At.length>0&&nh(Ft,At,A,G),le&&z.render(A),eh(C,A,G)}$!==null&&X===0&&(T.updateMultisampleRenderTarget($),T.updateRenderTargetMipmap($)),K&&U.end(I),A.isScene===!0&&A.onAfterRender(I,A,G),St.resetDefaultState(),W=-1,j=null,E.pop(),E.length>0?(R=E[E.length-1],T.setTextureUnits(R.state.textureUnits),_t===!0&&rt.setGlobalState(I.clippingPlanes,R.state.camera)):R=null,M.pop(),M.length>0?C=M[M.length-1]:C=null,B!==null&&B.renderEnd()};function yl(A,G,tt,K){if(A.visible===!1)return;if(A.layers.test(G.layers)){if(A.isGroup)tt=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(G);else if(A.isLight)R.pushLight(A),A.castShadow&&R.pushShadow(A);else if(A.isSprite){let Ft=G.isArrayCamera?Mt:lt;if(!A.frustumCulled||A.intersectsFrustum(Ft)){K&&Ht.setFromMatrixPosition(A.matrixWorld).applyMatrix4(Et);let At=Z.update(A),Lt=A.material;Lt.visible&&C.push(A,At,Lt,tt,Ht.z,null,G)}}else if(A.isMesh||A.isLine||A.isPoints){let Ft=G.isArrayCamera?Mt:lt;if(!A.frustumCulled||A.intersectsFrustum(Ft)){let At=Z.update(A),Lt=A.material;if(K&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),Ht.copy(A.boundingSphere.center)):(At.boundingSphere===null&&At.computeBoundingSphere(),Ht.copy(At.boundingSphere.center)),Ht.applyMatrix4(A.matrixWorld).applyMatrix4(Et)),Array.isArray(Lt)){let Gt=At.groups;for(let te=0,pe=Gt.length;te<pe;te++){let Ot=Gt[te],me=Lt[Ot.materialIndex];me&&me.visible&&C.push(A,At,me,tt,Ht.z,Ot,G)}}else Lt.visible&&C.push(A,At,Lt,tt,Ht.z,null,G)}}}let Ct=A.children;for(let Ft=0,At=Ct.length;Ft<At;Ft++)yl(Ct[Ft],G,tt,K)}function eh(A,G,tt,K){let{opaque:Q,transmissive:Ct,transparent:Ft}=A;R.setupLightsView(tt),_t===!0&&rt.setGlobalState(I.clippingPlanes,tt),K&&V.viewport(nt.copy(K)),Q.length>0&&ra(Q,G,tt),Ct.length>0&&ra(Ct,G,tt),Ft.length>0&&ra(Ft,G,tt),V.buffers.depth.setTest(!0),V.buffers.depth.setMask(!0),V.buffers.color.setMask(!0),V.setPolygonOffset(!1)}function nh(A,G,tt,K){if((tt.isScene===!0?tt.overrideMaterial:null)!==null)return;if(R.state.transmissionRenderTarget[K.id]===void 0){let Ot=N.has("EXT_color_buffer_half_float")||N.has("EXT_color_buffer_float");R.state.transmissionRenderTarget[K.id]=new He(1,1,{generateMipmaps:!0,type:Ot?Ke:xn,minFilter:oi,samples:Math.max(4,D.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:he.workingColorSpace})}let Ct=R.state.transmissionRenderTarget[K.id],Ft=K.viewport||nt;Ct.setSize(Ft.z*I.transmissionResolutionScale,Ft.w*I.transmissionResolutionScale);let At=I.getRenderTarget(),Lt=I.getActiveCubeFace(),Gt=I.getActiveMipmapLevel();I.setRenderTarget(Ct),I.getClearColor(st),Rt=I.getClearAlpha(),Rt<1&&I.setClearColor(16777215,.5),I.clear(),le&&z.render(tt);let te=I.toneMapping;I.toneMapping=Yn;let pe=K.viewport;if(K.viewport!==void 0&&(K.viewport=void 0),R.setupLightsView(K),_t===!0&&rt.setGlobalState(I.clippingPlanes,K),ra(A,tt,K),T.updateMultisampleRenderTarget(Ct),T.updateRenderTargetMipmap(Ct),N.has("WEBGL_multisampled_render_to_texture")===!1){let Ot=!1;for(let me=0,Oe=G.length;me<Oe;me++){let Ae=G[me],{object:Ee,geometry:Qe,material:Bt,group:hn}=Ae;if(Bt.side===In&&Ee.layers.test(K.layers)){let ve=Bt.side;Bt.side=fn,Bt.needsUpdate=!0,ih(Ee,tt,K,Qe,Bt,hn),Bt.side=ve,Bt.needsUpdate=!0,Ot=!0}}Ot===!0&&(T.updateMultisampleRenderTarget(Ct),T.updateRenderTargetMipmap(Ct))}I.setRenderTarget(At,Lt,Gt),I.setClearColor(st,Rt),pe!==void 0&&(K.viewport=pe),I.toneMapping=te}function ra(A,G,tt){let K=G.isScene===!0?G.overrideMaterial:null;for(let Q=0,Ct=A.length;Q<Ct;Q++){let Ft=A[Q],{object:At,geometry:Lt,group:Gt}=Ft,te=Ft.material;te.allowOverride===!0&&K!==null&&(te=K),At.layers.test(tt.layers)&&ih(At,G,tt,Lt,te,Gt)}}function ih(A,G,tt,K,Q,Ct){B!==null&&Q.isNodeMaterial&&B.setObject(A,Q),A.onBeforeRender(I,G,tt,K,Q,Ct),A.modelViewMatrix.multiplyMatrices(tt.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),Q.onBeforeRender(I,G,tt,K,A,Ct),Q.transparent===!0&&Q.side===In&&Q.forceSinglePass===!1?(Q.side=fn,Q.needsUpdate=!0,I.renderBufferDirect(tt,G,K,Q,A,Ct),Q.side=qn,Q.needsUpdate=!0,I.renderBufferDirect(tt,G,K,Q,A,Ct),Q.side=In):I.renderBufferDirect(tt,G,K,Q,A,Ct),A.onAfterRender(I,G,tt,K,Q,Ct)}function sh(A){let G=0;for(let tt of A)tt.texture!==null&&G++;return G}function Xs(A,G,tt){G.isScene!==!0&&(G=oe);let K=at.get(A),Q=R.state.lights,Ct=R.state.shadowsArray,Ft=Q.state.version,At=J.getParameters(A,Q.state,Ct,G,tt,R.state.lightProbeGridArray),Lt=J.getProgramCacheKey(At),Gt=K.programs;K.environment=A.isMeshStandardMaterial||A.isMeshLambertMaterial||A.isMeshPhongMaterial?G.environment:null,K.fog=G.fog;let te=A.isMeshStandardMaterial||A.isMeshLambertMaterial&&!A.envMap||A.isMeshPhongMaterial&&!A.envMap;K.envMap=b.get(A.envMap||K.environment,te),K.envMapRotation=K.environment!==null&&A.envMap===null?G.environmentRotation:A.envMapRotation,Gt===void 0&&(A.addEventListener("dispose",Se),Gt=new Map,K.programs=Gt,K.programVariants=new Map);let pe=Gt.get(Lt);if(pe!==void 0){if(K.currentProgram===pe&&K.lightsStateVersion===Ft)return ah(A,At),pe}else At.uniforms=J.getUniforms(A),B!==null&&A.isNodeMaterial&&B.build(A,tt,At),A.onBeforeCompile(At,I),pe=J.acquireProgram(At,Lt),Gt.set(Lt,pe),K.uniforms=At.uniforms;let Ot=K.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(Ot.clippingPlanes=rt.uniform),ah(A,At),K.needsLights=Bd(A),K.lightsStateVersion=Ft,K.needsLights&&(Ot.ambientLightColor.value=Q.state.ambient,Ot.lightProbe.value=Q.state.probe,Ot.sunLights.value=Q.state.sun,Ot.sunLightShadows.value=Q.state.sunShadow,Ot.directionalLights.value=Q.state.directional,Ot.directionalLightShadows.value=Q.state.directionalShadow,Ot.spotLights.value=Q.state.spot,Ot.spotLightShadows.value=Q.state.spotShadow,Ot.rectAreaLights.value=Q.state.rectArea,Ot.ltc_1.value=Q.state.rectAreaLTC1,Ot.ltc_2.value=Q.state.rectAreaLTC2,Ot.pointLights.value=Q.state.point,Ot.pointLightShadows.value=Q.state.pointShadow,Ot.hemisphereLights.value=Q.state.hemi,Ot.sunShadowMatrix.value=Q.state.sunShadowMatrix,Ot.sunShadowCascade.value=Q.state.sunShadowCascade,Ot.directionalShadowMatrix.value=Q.state.directionalShadowMatrix,Ot.spotLightMatrix.value=Q.state.spotLightMatrix,Ot.spotLightMap.value=Q.state.spotLightMap,Ot.pointShadowMatrix.value=Q.state.pointShadowMatrix),K.numLightProbeGrids=sh(R.state.lightProbeGridArray),K.currentProgram=pe,K.uniformsList=null,pe}function Ud(A,G,tt,K,Q){let Ct=at.get(A),Ft=Ct.currentProgram.id+","+K+","+Q,At=Ct.programVariants.get(Ft);return At===void 0?(At=Xs(A,G,tt),Ct.programVariants.set(Ft,At)):(Ct.currentProgram=At,Ct.uniformsList=null,Ct.outputColorSpace=K,Ct.toneMapping=Q),At}function rh(A){if(A.uniformsList===null){let G=A.currentProgram.getUniforms();A.uniformsList=Bs.seqWithValue(G.seq,A.uniforms)}return A.uniformsList}function ah(A,G){let tt=at.get(A);tt.outputColorSpace=G.outputColorSpace,tt.batching=G.batching,tt.batchingColor=G.batchingColor,tt.instancing=G.instancing,tt.instancingColor=G.instancingColor,tt.instancingMorph=G.instancingMorph,tt.skinning=G.skinning,tt.morphTargets=G.morphTargets,tt.morphNormals=G.morphNormals,tt.morphColors=G.morphColors,tt.morphTargetsCount=G.morphTargetsCount,tt.numClippingPlanes=G.numClippingPlanes,tt.numIntersection=G.numClipIntersection,tt.vertexAlphas=G.vertexAlphas,tt.vertexTangents=G.vertexTangents,tt.toneMapping=G.toneMapping}function Fd(A,G,tt,K,Q){G.isScene!==!0&&(G=oe),T.resetTextureUnits();let Ct=G.fog,Ft=K.isMeshStandardMaterial||K.isMeshLambertMaterial||K.isMeshPhongMaterial?G.environment:null,At=$===null?I.outputColorSpace:$.isXRRenderTarget===!0?$.texture.colorSpace:he.workingColorSpace,Lt=K.isMeshStandardMaterial||K.isMeshLambertMaterial&&!K.envMap||K.isMeshPhongMaterial&&!K.envMap,Gt=b.get(K.envMap||Ft,Lt),te=K.vertexColors===!0&&!!tt.attributes.color&&tt.attributes.color.itemSize===4,pe=!!tt.attributes.tangent&&(!!K.normalMap||K.anisotropy>0),Ot=!!tt.morphAttributes.position,me=!!tt.morphAttributes.normal,Oe=!!tt.morphAttributes.color,Ae=Yn;K.toneMapped&&($===null||$.isXRRenderTarget===!0)&&(Ae=I.toneMapping);let Ee=tt.morphAttributes.position||tt.morphAttributes.normal||tt.morphAttributes.color,Qe=Ee!==void 0?Ee.length:0,Bt=at.get(K),hn=R.state.lights;if(_t===!0&&(Dt===!0||A!==j)){let Ie=A===j&&K.id===W;rt.setState(K,A,Ie)}let ve=!1,zi=!1;K.version===Bt.__version?Bt.needsLights&&Bt.lightsStateVersion!==hn.state.version||Q.isBatchedMesh&&Bt.batching===!1||!Q.isBatchedMesh&&Bt.batching===!0||Q.isBatchedMesh&&Bt.batchingColor===!0&&Q._colorsTexture===null||Q.isBatchedMesh&&Bt.batchingColor===!1&&Q._colorsTexture!==null||Q.isInstancedMesh&&Bt.instancing===!1||!Q.isInstancedMesh&&Bt.instancing===!0||Q.isSkinnedMesh&&Bt.skinning===!1||!Q.isSkinnedMesh&&Bt.skinning===!0||Q.isInstancedMesh&&Bt.instancingColor===!0&&Q.instanceColor===null||Q.isInstancedMesh&&Bt.instancingColor===!1&&Q.instanceColor!==null||Q.isInstancedMesh&&Bt.instancingMorph===!0&&Q.morphTexture===null||Q.isInstancedMesh&&Bt.instancingMorph===!1&&Q.morphTexture!==null||Bt.envMap!==Gt||K.fog===!0&&Bt.fog!==Ct||Bt.numClippingPlanes!==void 0&&(Bt.numClippingPlanes!==rt.numPlanes||Bt.numIntersection!==rt.numIntersection)||Bt.vertexAlphas!==te||Bt.vertexTangents!==pe||Bt.morphTargets!==Ot||Bt.morphNormals!==me||Bt.morphColors!==Oe||Bt.morphTargetsCount!==Qe||Bt.numLightProbeGrids!==sh(R.state.lightProbeGridArray)?ve=!0:(Bt.outputColorSpace!==At||Bt.toneMapping!==Ae)&&(zi=!0):(ve=!0,Bt.__version=K.version);let je=Bt.currentProgram;(ve===!0||zi===!0)&&(je=zi===!0?Ud(K,G,Q,At,Ae):Xs(K,G,Q),B&&K.isNodeMaterial&&B.onUpdateProgram(K,je,Bt));let aa=!1,pi=!1,ki=!1,xe=je.getUniforms(),$e=Bt.uniforms;if(V.useProgram(je.program)&&(aa=!0,pi=!0,ki=!0),K.id!==W&&(W=K.id,pi=!0),aa||j!==A){V.buffers.depth.getReversed()&&A.reversedDepth!==!0&&(A._reversedDepth=!0,A.updateProjectionMatrix()),xe.setValue(x,"projectionMatrix",A.projectionMatrix),xe.setValue(x,"viewMatrix",A.matrixWorldInverse);let Xe=xe.map.cameraPosition;Xe!==void 0&&Xe.setValue(x,Qt.setFromMatrixPosition(A.matrixWorld)),D.logarithmicDepthBuffer&&xe.setValue(x,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(K.isMeshPhongMaterial||K.isMeshToonMaterial||K.isMeshLambertMaterial||K.isMeshBasicMaterial||K.isMeshStandardMaterial||K.isShaderMaterial)&&xe.setValue(x,"isOrthographic",A.isOrthographicCamera===!0),j!==A&&(j=A,pi=!0,ki=!0)}if(Bt.needsLights&&(hn.state.sunShadowMap.length>0&&xe.setValue(x,"sunShadowMap",hn.state.sunShadowMap,T),hn.state.directionalShadowMap.length>0&&xe.setValue(x,"directionalShadowMap",hn.state.directionalShadowMap,T),hn.state.spotShadowMap.length>0&&xe.setValue(x,"spotShadowMap",hn.state.spotShadowMap,T),hn.state.pointShadowMap.length>0&&xe.setValue(x,"pointShadowMap",hn.state.pointShadowMap,T)),Q.isSkinnedMesh){xe.setOptional(x,Q,"bindMatrix"),xe.setOptional(x,Q,"bindMatrixInverse");let Ie=Q.skeleton;Ie&&(Ie.boneTexture===null&&Ie.computeBoneTexture(),xe.setValue(x,"boneTexture",Ie.boneTexture,T))}Q.isBatchedMesh&&(xe.setOptional(x,Q,"batchingTexture"),xe.setValue(x,"batchingTexture",Q._matricesTexture,T),xe.setOptional(x,Q,"batchingIdTexture"),xe.setValue(x,"batchingIdTexture",Q._indirectTexture,T),xe.setOptional(x,Q,"batchingColorTexture"),Q._colorsTexture!==null&&xe.setValue(x,"batchingColorTexture",Q._colorsTexture,T));let Nn=tt.morphAttributes;if((Nn.position!==void 0||Nn.normal!==void 0||Nn.color!==void 0)&&ot.update(Q,tt,je),(pi||Bt.receiveShadow!==Q.receiveShadow)&&(Bt.receiveShadow=Q.receiveShadow,xe.setValue(x,"receiveShadow",Q.receiveShadow)),(K.isMeshStandardMaterial||K.isMeshLambertMaterial||K.isMeshPhongMaterial)&&K.envMap===null&&G.environment!==null&&($e.envMapIntensity.value=G.environmentIntensity),$e.dfgLUT!==void 0&&($e.dfgLUT.value=Vx()),pi){if(xe.setValue(x,"toneMappingExposure",I.toneMappingExposure),Bt.needsLights&&Od($e,ki),Ct&&K.fog===!0&&ct.refreshFogUniforms($e,Ct),ct.refreshMaterialUniforms($e,K,wt,kt,R.state.transmissionRenderTarget[A.id]),Bt.needsLights&&Bt.numLightProbeGrids>0){let Ie=S,Xe=0;for(let Jn of R.state.lightProbeGridArray)Jn.texture!==null&&(Ie.textures[Xe]=Jn.texture,Ie.min[Xe]=Jn.boundingBox.min,Ie.max[Xe]=Jn.boundingBox.max,Ie.resolution[Xe]=Jn.resolution,Xe++);for(let Jn in Ie)Ie[Jn].length=Xe;$e.probesSH.value=Ie.textures,$e.probesMin.value=Ie.min,$e.probesMax.value=Ie.max,$e.probesResolution.value=Ie.resolution}Bs.upload(x,rh(Bt),$e,T)}if(K.isShaderMaterial&&K.uniformsNeedUpdate===!0&&(Bs.upload(x,rh(Bt),$e,T),K.uniformsNeedUpdate=!1),K.isSpriteMaterial&&xe.setValue(x,"center",Q.center),xe.setValue(x,"modelViewMatrix",Q.modelViewMatrix),xe.setValue(x,"normalMatrix",Q.normalMatrix),xe.setValue(x,"modelMatrix",Q.matrixWorld),K.uniformsGroups!==void 0){let Ie=K.uniformsGroups;for(let Xe=0,Jn=Ie.length;Xe<Jn;Xe++){let lh=Ie[Xe];Wt.update(lh,je),Wt.bind(lh,je)}}return je}function Od(A,G){A.ambientLightColor.needsUpdate=G,A.lightProbe.needsUpdate=G,A.sunLights.needsUpdate=G,A.sunLightShadows.needsUpdate=G,A.directionalLights.needsUpdate=G,A.directionalLightShadows.needsUpdate=G,A.pointLights.needsUpdate=G,A.pointLightShadows.needsUpdate=G,A.spotLights.needsUpdate=G,A.spotLightShadows.needsUpdate=G,A.rectAreaLights.needsUpdate=G,A.hemisphereLights.needsUpdate=G}function Bd(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return Y},this.getActiveMipmapLevel=function(){return X},this.getRenderTarget=function(){return $},this.setRenderTargetTextures=function(A,G,tt){let K=at.get(A);K.__autoAllocateDepthBuffer=A.resolveDepthBuffer===!1,K.__autoAllocateDepthBuffer===!1&&(K.__useRenderToTexture=!1),at.get(A.texture).__webglTexture=G,at.get(A.depthTexture).__webglTexture=K.__autoAllocateDepthBuffer?void 0:tt,K.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(A,G){let tt=at.get(A);tt.__webglFramebuffer=G,tt.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(A,G=0,tt=0){$=A,Y=G,X=tt;let K=null,Q=!1,Ct=!1;if(A){let At=at.get(A);if(At.__useDefaultFramebuffer!==void 0){V.bindFramebuffer(x.FRAMEBUFFER,At.__webglFramebuffer),nt.copy(A.viewport),vt.copy(A.scissor),zt=A.scissorTest,V.viewport(nt),V.scissor(vt),V.setScissorTest(zt),W=-1;return}else if(At.__webglFramebuffer===void 0)T.setupRenderTarget(A);else if(At.__hasExternalTextures)T.rebindTextures(A,at.get(A.texture).__webglTexture,at.get(A.depthTexture).__webglTexture);else if(A.depthBuffer){let te=A.depthTexture;if(At.__boundDepthTexture!==te){if(te!==null&&at.has(te)&&(A.width!==te.image.width||A.height!==te.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");T.setupDepthRenderbuffer(A)}}let Lt=A.texture;(Lt.isData3DTexture||Lt.isDataArrayTexture||Lt.isCompressedArrayTexture)&&(Ct=!0);let Gt=at.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray(Gt[G])?K=Gt[G][tt]:K=Gt[G],Q=!0):A.samples>0&&T.useMultisampledRTT(A)===!1?K=at.get(A).__webglMultisampledFramebuffer:Array.isArray(Gt)?K=Gt[tt]:K=Gt,nt.copy(A.viewport),vt.copy(A.scissor),zt=A.scissorTest}else nt.copy(Vt).multiplyScalar(wt).floor(),vt.copy(ee).multiplyScalar(wt).floor(),zt=ne;if(tt!==0&&(K=H),V.bindFramebuffer(x.FRAMEBUFFER,K)&&V.drawBuffers(A,K),V.viewport(nt),V.scissor(vt),V.setScissorTest(zt),Q){let At=at.get(A.texture);x.framebufferTexture2D(x.FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_CUBE_MAP_POSITIVE_X+G,At.__webglTexture,tt)}else if(Ct){let At=G;for(let Lt=0;Lt<A.textures.length;Lt++){let Gt=at.get(A.textures[Lt]);x.framebufferTextureLayer(x.FRAMEBUFFER,x.COLOR_ATTACHMENT0+Lt,Gt.__webglTexture,tt,At)}}else if(A!==null&&tt!==0){let At=at.get(A.texture);x.framebufferTexture2D(x.FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_2D,At.__webglTexture,tt)}W=-1};function oh(A){let G=at.get(A);return(G.__readFormat!==A.format||G.__readType!==A.type)&&(G.__readFormat=A.format,G.__readType=A.type,G.__formatReadable=D.textureFormatReadable(A.format),G.__typeReadable=D.textureTypeReadable(A.type)),G}this.readRenderTargetPixels=function(A,G,tt,K,Q,Ct,Ft,At=0){if(!(A&&A.isWebGLRenderTarget)){Jt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Lt=at.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&Ft!==void 0&&(Lt=Lt[Ft],Array.isArray(Lt)&&(Lt=Lt[0])),Lt){V.bindFramebuffer(x.FRAMEBUFFER,Lt);try{let Gt=A.textures[At],te=Gt.format,pe=Gt.type;A.textures.length>1&&x.readBuffer(x.COLOR_ATTACHMENT0+At);let Ot=oh(Gt);if(Ot.__formatReadable===!1){Jt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ot.__typeReadable===!1){Jt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}G>=0&&G<=A.width-K&&tt>=0&&tt<=A.height-Q&&x.readPixels(G,tt,K,Q,yt.convert(te),yt.convert(pe),Ct)}finally{let Gt=$!==null?at.get($).__webglFramebuffer:null;V.bindFramebuffer(x.FRAMEBUFFER,Gt)}}},this.readRenderTargetPixelsAsync=async function(A,G,tt,K,Q,Ct,Ft,At=0){if(!(A&&A.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Lt=at.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&Ft!==void 0&&(Lt=Lt[Ft],Array.isArray(Lt)&&(Lt=Lt[0])),Lt)if(G>=0&&G<=A.width-K&&tt>=0&&tt<=A.height-Q){V.bindFramebuffer(x.FRAMEBUFFER,Lt);let Gt=A.textures[At],te=Gt.format,pe=Gt.type;A.textures.length>1&&x.readBuffer(x.COLOR_ATTACHMENT0+At);let Ot=oh(Gt);if(Ot.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ot.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let me=x.createBuffer();x.bindBuffer(x.PIXEL_PACK_BUFFER,me),x.bufferData(x.PIXEL_PACK_BUFFER,Ct.byteLength,x.STREAM_READ),x.readPixels(G,tt,K,Q,yt.convert(te),yt.convert(pe),0),x.bindBuffer(x.PIXEL_PACK_BUFFER,null);let Oe=$!==null?at.get($).__webglFramebuffer:null;V.bindFramebuffer(x.FRAMEBUFFER,Oe);let Ae=x.fenceSync(x.SYNC_GPU_COMMANDS_COMPLETE,0);return x.flush(),await wu(x,Ae,4),x.bindBuffer(x.PIXEL_PACK_BUFFER,me),x.getBufferSubData(x.PIXEL_PACK_BUFFER,0,Ct),x.bindBuffer(x.PIXEL_PACK_BUFFER,null),x.deleteBuffer(me),x.deleteSync(Ae),Ct}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(A,G=null,tt=0){let K=Math.pow(2,-tt),Q=Math.floor(A.image.width*K),Ct=Math.floor(A.image.height*K),Ft=G!==null?G.x:0,At=G!==null?G.y:0;T.setTexture2D(A,0),x.copyTexSubImage2D(x.TEXTURE_2D,tt,0,0,Ft,At,Q,Ct),V.unbindTexture()},this.copyTextureToTexture=function(A,G,tt=null,K=null,Q=0,Ct=0){let Ft,At,Lt,Gt,te,pe,Ot,me,Oe,Ae=A.isCompressedTexture?A.mipmaps[Ct]:A.image;if(tt!==null)Ft=tt.max.x-tt.min.x,At=tt.max.y-tt.min.y,Lt=tt.isBox3?tt.max.z-tt.min.z:1,Gt=tt.min.x,te=tt.min.y,pe=tt.isBox3?tt.min.z:0;else{let xe=Math.pow(2,-Q);Ft=Math.floor(Ae.width*xe),At=Math.floor(Ae.height*xe),A.isDataArrayTexture?Lt=Ae.depth:A.isData3DTexture?Lt=Math.floor(Ae.depth*xe):Lt=1,Gt=0,te=0,pe=0}K!==null?(Ot=K.x,me=K.y,Oe=K.z):(Ot=0,me=0,Oe=0);let Ee=yt.convert(G.format),Qe=yt.convert(G.type),Bt;G.isData3DTexture?(T.setTexture3D(G,0),Bt=x.TEXTURE_3D):G.isDataArrayTexture||G.isCompressedArrayTexture?(T.setTexture2DArray(G,0),Bt=x.TEXTURE_2D_ARRAY):(T.setTexture2D(G,0),Bt=x.TEXTURE_2D),V.activeTexture(x.TEXTURE0),V.pixelStorei(x.UNPACK_FLIP_Y_WEBGL,G.flipY),V.pixelStorei(x.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),V.pixelStorei(x.UNPACK_ALIGNMENT,G.unpackAlignment);let hn=V.getParameter(x.UNPACK_ROW_LENGTH),ve=V.getParameter(x.UNPACK_IMAGE_HEIGHT),zi=V.getParameter(x.UNPACK_SKIP_PIXELS),je=V.getParameter(x.UNPACK_SKIP_ROWS),aa=V.getParameter(x.UNPACK_SKIP_IMAGES);V.pixelStorei(x.UNPACK_ROW_LENGTH,Ae.width),V.pixelStorei(x.UNPACK_IMAGE_HEIGHT,Ae.height),V.pixelStorei(x.UNPACK_SKIP_PIXELS,Gt),V.pixelStorei(x.UNPACK_SKIP_ROWS,te),V.pixelStorei(x.UNPACK_SKIP_IMAGES,pe);let pi=A.isDataArrayTexture||A.isData3DTexture,ki=G.isDataArrayTexture||G.isData3DTexture;if(A.isDepthTexture){let xe=at.get(A),$e=at.get(G),Nn=at.get(xe.__renderTarget),Ie=at.get($e.__renderTarget);V.bindFramebuffer(x.READ_FRAMEBUFFER,Nn.__webglFramebuffer),V.bindFramebuffer(x.DRAW_FRAMEBUFFER,Ie.__webglFramebuffer);for(let Xe=0;Xe<Lt;Xe++)pi&&(x.framebufferTextureLayer(x.READ_FRAMEBUFFER,x.COLOR_ATTACHMENT0,at.get(A).__webglTexture,Q,pe+Xe),x.framebufferTextureLayer(x.DRAW_FRAMEBUFFER,x.COLOR_ATTACHMENT0,at.get(G).__webglTexture,Ct,Oe+Xe)),x.blitFramebuffer(Gt,te,Gt+Ft,te+At,Ot,me,Ot+Ft,me+At,x.DEPTH_BUFFER_BIT,x.NEAREST);V.bindFramebuffer(x.READ_FRAMEBUFFER,null),V.bindFramebuffer(x.DRAW_FRAMEBUFFER,null)}else if(Q!==0||A.isRenderTargetTexture||at.has(A)){let xe=at.get(A),$e=at.get(G);V.bindFramebuffer(x.READ_FRAMEBUFFER,F),V.bindFramebuffer(x.DRAW_FRAMEBUFFER,q);for(let Nn=0;Nn<Lt;Nn++)pi?x.framebufferTextureLayer(x.READ_FRAMEBUFFER,x.COLOR_ATTACHMENT0,xe.__webglTexture,Q,pe+Nn):x.framebufferTexture2D(x.READ_FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_2D,xe.__webglTexture,Q),ki?x.framebufferTextureLayer(x.DRAW_FRAMEBUFFER,x.COLOR_ATTACHMENT0,$e.__webglTexture,Ct,Oe+Nn):x.framebufferTexture2D(x.DRAW_FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_2D,$e.__webglTexture,Ct),Q!==0?x.blitFramebuffer(Gt,te,Gt+Ft,te+At,Ot,me,Ot+Ft,me+At,x.COLOR_BUFFER_BIT,x.NEAREST):ki?x.copyTexSubImage3D(Bt,Ct,Ot,me,Oe+Nn,Gt,te,Ft,At):x.copyTexSubImage2D(Bt,Ct,Ot,me,Gt,te,Ft,At);V.bindFramebuffer(x.READ_FRAMEBUFFER,null),V.bindFramebuffer(x.DRAW_FRAMEBUFFER,null)}else ki?A.isDataTexture||A.isData3DTexture?x.texSubImage3D(Bt,Ct,Ot,me,Oe,Ft,At,Lt,Ee,Qe,Ae.data):G.isCompressedArrayTexture?x.compressedTexSubImage3D(Bt,Ct,Ot,me,Oe,Ft,At,Lt,Ee,Ae.data):x.texSubImage3D(Bt,Ct,Ot,me,Oe,Ft,At,Lt,Ee,Qe,Ae):A.isDataTexture?x.texSubImage2D(x.TEXTURE_2D,Ct,Ot,me,Ft,At,Ee,Qe,Ae.data):A.isCompressedTexture?x.compressedTexSubImage2D(x.TEXTURE_2D,Ct,Ot,me,Ae.width,Ae.height,Ee,Ae.data):x.texSubImage2D(x.TEXTURE_2D,Ct,Ot,me,Ft,At,Ee,Qe,Ae);V.pixelStorei(x.UNPACK_ROW_LENGTH,hn),V.pixelStorei(x.UNPACK_IMAGE_HEIGHT,ve),V.pixelStorei(x.UNPACK_SKIP_PIXELS,zi),V.pixelStorei(x.UNPACK_SKIP_ROWS,je),V.pixelStorei(x.UNPACK_SKIP_IMAGES,aa),Ct===0&&G.generateMipmaps===!0&&G.mipmapsAutoUpdate===!0&&x.generateMipmap(Bt),V.unbindTexture()},this.initRenderTarget=function(A){at.get(A).__webglFramebuffer===void 0&&T.setupRenderTarget(A)},this.initTexture=function(A){A.isCubeTexture?T.setTextureCube(A,0):A.isData3DTexture?T.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?T.setTexture2DArray(A,0):T.setTexture2D(A,0),V.unbindTexture()},this.resetState=function(){Y=0,X=0,$=null,V.reset(),St.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Rn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=he._getDrawingBufferColorSpace(t),e.unpackColorSpace=he._getUnpackColorSpace()}};var ks={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`};var wn=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},Wx=new $i(-1,1,1,-1,0,1),Wc=class extends Fe{constructor(){super(),this.setAttribute("position",new ce([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new ce([0,2,0,0,2,0],2))}},Xx=new Wc,Ni=class{constructor(t){this._mesh=new ht(Xx,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,Wx)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}};var al=class extends wn{constructor(t,e="tDiffuse"){super(),this.textureID=e,this.uniforms=null,this.material=null,t instanceof ke?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=hi.clone(t.uniforms),this.material=new ke({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this._fsQuad=new Ni(this.material)}render(t,e,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this._fsQuad.render(t))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var ta=class extends wn{constructor(t,e){super(),this.scene=t,this.camera=e,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,e,n){let i=t.getContext(),r=t.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(i.REPLACE,i.REPLACE,i.REPLACE),r.buffers.stencil.setFunc(i.ALWAYS,a,4294967295),r.buffers.stencil.setClear(o),r.buffers.stencil.setLocked(!0),t.setRenderTarget(n),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(e),this.clear&&t.clear(),t.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(i.EQUAL,1,4294967295),r.buffers.stencil.setOp(i.KEEP,i.KEEP,i.KEEP),r.buffers.stencil.setLocked(!0)}},ol=class extends wn{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}};var ll=class{constructor(t,e){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),e===void 0){let n=t.getSize(new ft);this._width=n.width,this._height=n.height,e=new He(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Ke}),e.texture.name="EffectComposer.rt1"}else this._width=e.width,this._height=e.height;this.renderTarget1=e,this.renderTarget2=e.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new al(ks),this.copyPass.material.blending=ai,this.timer=new Nr}swapBuffers(){let t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,e){this.passes.splice(e,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){let e=this.passes.indexOf(t);e!==-1&&this.passes.splice(e,1)}isLastEnabledPass(t){for(let e=t+1;e<this.passes.length;e++)if(this.passes[e].enabled)return!1;return!0}render(t){this.timer.update(),t===void 0&&(t=this.timer.getDelta());let e=this.renderer.getRenderTarget(),n=!1;for(let i=0,r=this.passes.length;i<r;i++){let a=this.passes[i];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(i),a.render(this.renderer,this.writeBuffer,this.readBuffer,t,n),a.needsSwap){if(n){let o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}ta!==void 0&&(a instanceof ta?n=!0:a instanceof ol&&(n=!1))}}this.renderer.setRenderTarget(e)}reset(t){if(t===void 0){let e=this.renderer.getSize(new ft);this._pixelRatio=this.renderer.getPixelRatio(),this._width=e.width,this._height=e.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,e){this._width=t,this._height=e;let n=this._width*this._pixelRatio,i=this._height*this._pixelRatio;this.renderTarget1.setSize(n,i),this.renderTarget2.setSize(n,i);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,i)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var cl=class extends wn{constructor(t,e,n=null,i=null,r=null){super(),this.scene=t,this.camera=e,this.overrideMaterial=n,this.clearColor=i,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new Xt}render(t,e,n){let i=t.autoClear;t.autoClear=!1;let r,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor,t.getClearAlpha())),this.clearAlpha!==null&&(r=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),t.autoClear=i}};var fd={name:"LuminosityHighPassShader",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new Xt(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`};var Hs=class s extends wn{constructor(t,e=1,n,i){super(),this.strength=e,this.radius=n,this.threshold=i,this.resolution=t!==void 0?new ft(t.x,t.y):new ft(256,256),this.clearColor=new Xt(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new He(r,a,{type:Ke,depthBuffer:!1}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let u=0;u<this.nMips;u++){let f=new He(r,a,{type:Ke,depthBuffer:!1});f.texture.name="UnrealBloomPass.h"+u,f.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(f);let p=new He(r,a,{type:Ke,depthBuffer:!1});p.texture.name="UnrealBloomPass.v"+u,p.texture.generateMipmaps=!1,this.renderTargetsVertical.push(p),r=Math.round(r/2),a=Math.round(a/2)}let o=fd;this.highPassUniforms=hi.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=i,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new ke({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];let l=[6,10,14,18,22];r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let u=0;u<this.nMips;u++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[u])),this.separableBlurMaterials[u].uniforms.invSize.value=new ft(1/r,1/a),r=Math.round(r/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=e,this.compositeMaterial.uniforms.bloomRadius.value=.1;let h=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=h,this.bloomTintColors=[new k(1,1,1),new k(1,1,1),new k(1,1,1),new k(1,1,1),new k(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=hi.clone(ks.uniforms),this.blendMaterial=new ke({uniforms:this.copyUniforms,vertexShader:ks.vertexShader,fragmentShader:ks.fragmentShader,premultipliedAlpha:!0,blending:Ki,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new Xt,this._oldClearAlpha=1,this._basic=new bi,this._fsQuad=new Ni(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(t,e){let n=Math.round(t/2),i=Math.round(e/2);this.renderTargetBright.setSize(n,i);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(n,i),this.renderTargetsVertical[r].setSize(n,i),this.separableBlurMaterials[r].uniforms.invSize.value=new ft(1/n,1/i),n=Math.round(n/2),i=Math.round(i/2)}render(t,e,n,i,r){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let a=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),r&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=n.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this._fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=s.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[l]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=s.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[l]),t.clear(),this._fsQuad.render(t),o=this.renderTargetsVertical[l];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(n),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=a}_getSeparableBlurMaterial(t){let e=[],n=t/3;for(let a=0;a<t;a++)e.push(.39894*Math.exp(-.5*a*a/(n*n))/n);let i=[],r=[];for(let a=1;a<t;a+=2){let o=e[a],l=a+1<t?e[a+1]:0,h=o+l;i.push((a*o+(a+1)*l)/h),r.push(h)}return new ke({defines:{KERNEL_PAIRS:i.length},uniforms:{colorTexture:{value:null},invSize:{value:new ft(.5,.5)},direction:{value:new ft(.5,.5)},centerWeight:{value:e[0]},gaussianOffsets:{value:i},gaussianWeights:{value:r}},vertexShader:`

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

				}`})}_getCompositeMaterial(t){return new ke({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

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

				}`})}};Hs.BlurDirectionX=new ft(1,0);Hs.BlurDirectionY=new ft(0,1);var ea={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		}`};var hl=class extends wn{constructor(){super(),this.isOutputPass=!0,this.uniforms=hi.clone(ea.uniforms),this.material=new Cs({name:ea.name,uniforms:this.uniforms,vertexShader:ea.vertexShader,fragmentShader:ea.fragmentShader}),this._fsQuad=new Ni(this.material),this._outputColorSpace=null,this._toneMapping=null}render(t,e,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,(this._outputColorSpace!==t.outputColorSpace||this._toneMapping!==t.toneMapping)&&(this._outputColorSpace=t.outputColorSpace,this._toneMapping=t.toneMapping,this.material.defines={},he.getTransfer(this._outputColorSpace)===_e&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===Fr?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===Or?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===Br?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===ji?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===kr?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===Hr?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===zr&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this._fsQuad.render(t))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var qx=`
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
`,Yx=`
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
`,Zx=`
  uniform sampler2D map;
  varying vec2 vUv;
  varying vec4 vColor;
  void main() {
    vec4 t = texture2D(map, vUv);
    vec4 col = vec4(vColor.rgb * t.rgb, vColor.a * t.a);
    if (col.a < 0.003) discard;
    gl_FragColor = col;
  }
`,is=class{constructor(t,e,{additive:n=!0,ground:i=!1,depthTest:r=!0,renderOrder:a=10}={}){this.max=t,this.n=0;let o=new Dr,l=new Cn(1,1);o.index=l.index,o.setAttribute("position",l.attributes.position),this.pos=new Float32Array(t*3),this.col=new Float32Array(t*4),this.par=new Float32Array(t*4),this.dir=new Float32Array(t*3);let h=(f,p)=>{let d=new Ti(f,p);return d.setUsage(vc),d};this.aPos=h(this.pos,3),this.aCol=h(this.col,4),this.aPar=h(this.par,4),this.aDir=h(this.dir,3),o.setAttribute("aPos",this.aPos),o.setAttribute("aColor",this.aCol),o.setAttribute("aParams",this.aPar),i||o.setAttribute("aDir",this.aDir),o.instanceCount=0,this.geo=o;let u=new ke({uniforms:{map:{value:e}},vertexShader:i?Yx:qx,fragmentShader:Zx,transparent:!0,depthWrite:!1,depthTest:r,blending:n?Ki:Li});this.mesh=new ht(o,u),this.mesh.frustumCulled=!1,this.mesh.renderOrder=a}begin(){this.n=0}add(t,e,n,i,r,a,o,l,h,u,f,p=0,d=0,m=0){if(this.n>=this.max)return;let _=this.n++,c=_*3,g=_*4;this.pos[c]=t,this.pos[c+1]=e,this.pos[c+2]=n,this.col[g]=a,this.col[g+1]=o,this.col[g+2]=l,this.col[g+3]=h,this.par[g]=i,this.par[g+1]=r,this.par[g+2]=u,this.par[g+3]=f,this.dir[c]=p,this.dir[c+1]=d,this.dir[c+2]=m}end(){this.geo.instanceCount=this.n;let t=this.n;for(let[e,n]of[[this.aPos,3],[this.aCol,4],[this.aPar,4],[this.aDir,3]])e.clearUpdateRanges(),e.addUpdateRange(0,t*n),e.needsUpdate=!0}},pd=new Map;function _n(s){let t=pd.get(s);if(!t){let e=new Xt(s);t=[e.r,e.g,e.b],pd.set(s,t)}return t}var ln=Math.PI*2;function dl(s,t=s){let e=document.createElement("canvas");return e.width=s,e.height=t,e}function ui(s){let t=s>>>0||1;return()=>(t^=t<<13,t^=t>>>17,t^=t<<5,(t>>>0)%1e5/1e5)}var dt={GLOW:0,STAR:1,STREAK:2,RING:3,SMOKE:4,FLAME:5,RUNE:6,SHADOW:7,DOT:8,SHOCK:9,CRESCENT:10,SIGIL:11,SHARD:12,BOLT:13,PETAL:14,CRACK:15};function md(){let t=dl(512),e=t.getContext("2d"),n=(o,l)=>{e.save(),e.translate(o%4*128+128/2,Math.floor(o/4)*128+128/2),l(),e.restore()},i=(o,l)=>{let h=e.createRadialGradient(0,0,0,0,0,o);return l.forEach(([u,f])=>h.addColorStop(u,f)),h};n(dt.GLOW,()=>{e.fillStyle=i(62,[[0,"rgba(255,255,255,1)"],[.18,"rgba(255,255,255,0.75)"],[.45,"rgba(255,255,255,0.22)"],[1,"rgba(255,255,255,0)"]]),e.fillRect(-64,-64,128,128)}),n(dt.STAR,()=>{e.fillStyle=i(30,[[0,"#fff"],[.4,"rgba(255,255,255,0.5)"],[1,"rgba(255,255,255,0)"]]),e.fillRect(-64,-64,128,128),e.fillStyle="#fff";for(let o=0;o<2;o++){e.save(),e.rotate(o*Math.PI/4);let l=o?34:60,h=o?4:7;e.beginPath(),e.moveTo(0,-l),e.quadraticCurveTo(h*.3,-h*.3,l,0),e.quadraticCurveTo(h*.3,h*.3,0,l),e.quadraticCurveTo(-h*.3,h*.3,-l,0),e.quadraticCurveTo(-h*.3,-h*.3,0,-l),e.fill(),e.restore()}}),n(dt.STREAK,()=>{let o=e.createLinearGradient(-64,0,64,0);o.addColorStop(0,"rgba(255,255,255,0)"),o.addColorStop(.75,"rgba(255,255,255,0.7)"),o.addColorStop(.92,"#fff"),o.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=o,e.beginPath(),e.ellipse(0,0,63,14,0,0,ln),e.fill(),e.fillStyle="rgba(255,255,255,0.9)",e.beginPath(),e.ellipse(20,0,40,4,0,0,ln),e.fill()}),n(dt.RING,()=>{e.strokeStyle="#fff",e.lineWidth=5,e.shadowColor="#fff",e.shadowBlur=10,e.beginPath(),e.arc(0,0,56,0,ln),e.stroke()}),n(dt.SMOKE,()=>{let o=ui(77);for(let l=0;l<26;l++){let h=o()*ln,u=o()*26,f=14+o()*24;e.fillStyle=i(f,[[0,"rgba(255,255,255,0.22)"],[1,"rgba(255,255,255,0)"]]),e.save(),e.translate(Math.cos(h)*u,Math.sin(h)*u),e.fillRect(-f,-f,f*2,f*2),e.restore()}}),n(dt.FLAME,()=>{let o=e.createRadialGradient(0,18,2,0,6,54);o.addColorStop(0,"rgba(255,255,255,1)"),o.addColorStop(.3,"rgba(255,255,255,0.8)"),o.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=o,e.beginPath(),e.moveTo(0,-60),e.bezierCurveTo(26,-20,40,20,0,52),e.bezierCurveTo(-40,20,-26,-20,0,-60),e.fill()});let r=(o,l)=>{let h=ui(o);e.strokeStyle="#fff",e.fillStyle="#fff",e.shadowColor="#fff",e.shadowBlur=4,e.lineWidth=3,e.beginPath(),e.arc(0,0,60,0,ln),e.stroke(),e.lineWidth=1.5,e.beginPath(),e.arc(0,0,50,0,ln),e.stroke(),e.font="bold 11px serif",e.textAlign="center",e.textBaseline="middle";let u="\u16A0\u16A2\u16A6\u16A8\u16B1\u16B2\u16B7\u16B9\u16BA\u16BE\u16C1\u16C3\u16C7\u16C8\u16C9\u16CA\u16CF\u16D2\u16D6\u16D7\u16DA\u16DC\u16DE\u16DF";for(let f=0;f<20;f++){let p=f/20*ln;e.save(),e.rotate(p+Math.PI/2),e.translate(0,-55),e.rotate(0),e.fillText(u[h()*u.length|0],0,0),e.restore()}e.lineWidth=2;for(let f=0;f<l;f++){let p=3+f*2,d=40-f*6;e.beginPath();for(let m=0;m<=p;m++){let _=m*ln/p*(f%2?2:1)-Math.PI/2,c=Math.cos(_)*d,g=Math.sin(_)*d;m?e.lineTo(c,g):e.moveTo(c,g)}e.stroke()}e.beginPath(),e.arc(0,0,14,0,ln),e.stroke()};n(dt.RUNE,()=>r(11,2)),n(dt.SIGIL,()=>r(29,3)),n(dt.SHADOW,()=>{e.fillStyle=i(60,[[0,"rgba(0,0,0,0.85)"],[.55,"rgba(0,0,0,0.5)"],[1,"rgba(0,0,0,0)"]]),e.fillRect(-64,-64,128,128)}),n(dt.DOT,()=>{e.fillStyle=i(20,[[0,"#fff"],[.6,"rgba(255,255,255,0.9)"],[1,"rgba(255,255,255,0)"]]),e.fillRect(-24,-24,48,48)}),n(dt.SHOCK,()=>{let o=e.createRadialGradient(0,0,30,0,0,62);o.addColorStop(0,"rgba(255,255,255,0)"),o.addColorStop(.7,"rgba(255,255,255,0.35)"),o.addColorStop(.9,"rgba(255,255,255,1)"),o.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=o,e.fillRect(-64,-64,128,128)}),n(dt.CRESCENT,()=>{e.fillStyle="#fff",e.shadowColor="#fff",e.shadowBlur=8,e.beginPath(),e.arc(0,0,54,-2.4,.9),e.arc(16,-10,44,.9,-2.4,!0),e.fill()}),n(dt.SHARD,()=>{let o=e.createLinearGradient(-60,0,60,0);o.addColorStop(0,"rgba(255,255,255,0.1)"),o.addColorStop(1,"#fff"),e.fillStyle=o,e.beginPath(),e.moveTo(60,0),e.lineTo(-10,12),e.lineTo(-58,0),e.lineTo(-10,-12),e.closePath(),e.fill()}),n(dt.BOLT,()=>{e.strokeStyle="#fff",e.lineWidth=6,e.shadowColor="#fff",e.shadowBlur=12,e.lineCap="round";let o=ui(5);e.beginPath(),e.moveTo(-62,0);for(let l=-50;l<=62;l+=12)e.lineTo(l,(o()-.5)*30);e.stroke()}),n(dt.PETAL,()=>{e.fillStyle=i(30,[[0,"#fff"],[1,"rgba(255,255,255,0)"]]),e.beginPath(),e.ellipse(0,0,40,16,.5,0,ln),e.fill()}),n(dt.CRACK,()=>{e.strokeStyle="#fff",e.lineCap="round";let o=ui(9);for(let l=0;l<7;l++){let h=l/7*ln+o()*.5,u=0,f=0;e.lineWidth=4,e.beginPath(),e.moveTo(0,0);for(let p=0;p<5;p++)h+=(o()-.5)*.8,u+=Math.cos(h)*12,f+=Math.sin(h)*12,e.lineTo(u,f),e.lineWidth=4-p*.6;e.stroke()}});let a=new Es(t);return a.colorSpace=nn,a.generateMipmaps=!0,a}function Ui(s,t,e,n,i,r){for(let a of[-t,0,t])for(let o of[-t,0,t])e+a<-i||e+a>t+i||n+o<-i||n+o>t+i||(s.save(),s.translate(e+a,n+o),r(),s.restore())}function Xc(s,t,e,n,i,r,a,o){s.fillStyle=n,s.fillRect(0,0,t,t);for(let l=0;l<i;l++){let h=e()*t,u=e()*t,f=a+e()*(o-a),p=e()<.5;Ui(s,t,h,u,f,()=>{let d=s.createRadialGradient(0,0,0,0,0,f);d.addColorStop(0,p?`rgba(255,255,255,${r})`:`rgba(0,0,0,${r*1.3})`),d.addColorStop(1,"rgba(0,0,0,0)"),s.fillStyle=d,s.fillRect(-f,-f,f*2,f*2)})}}function Gs(s,t,e,n){s.beginPath();let i=7;for(let r=0;r<i;r++){let a=r/i*ln,o=e/2*(.85+t()*.15),l=n/2*(.85+t()*.15),h=Math.cos(a)*o,u=Math.sin(a)*l;r?s.lineTo(h,u):s.moveTo(h,u)}s.closePath()}function ul(s,t,e,n,i,r){s.strokeStyle=i,s.lineCap="round";for(let a=0;a<n;a++){let o=e()*t,l=e()*t,h=e()*ln,u=[[o,l]];for(let f=0;f<8;f++)h+=(e()-.5)*1.2,o+=Math.cos(h)*(8+e()*14),l+=Math.sin(h)*(8+e()*14),u.push([o,l]);for(let f of[-t,0,t])for(let p of[-t,0,t])s.lineWidth=r,s.beginPath(),u.forEach(([d,m],_)=>_?s.lineTo(d+f,m+p):s.moveTo(d+f,m+p)),s.stroke()}}function gd(s){let e=dl(1024),n=e.getContext("2d"),i=dl(1024),r=i.getContext("2d"),a=dl(512),o=a.getContext("2d");o.fillStyle="#000",o.fillRect(0,0,512,512);let l=ui(s.length*977+13),h=!1;if(s==="ruins"||s==="crypt"){let f=s==="crypt";Xc(n,1024,l,f?"#16181f":"#1c1a1d",200,.06,20,80),r.fillStyle="#000",r.fillRect(0,0,1024,1024);let p=f?8:6,d=1024/p;for(let m=0;m<p;m++){let _=m%2*d*.5;for(let c=0;c<p;c++){let g=c*d+_+d/2,y=m*d+d/2,w=d*(f?.94:.9),S=d*(f?.94:.88),C=f?30+l()*18:40+l()*26,R=f?[C*.85,C*.9,C*1.1]:[C*1.05,C,C*.92];Ui(n,1024,g,y,d,()=>{f?(n.beginPath(),n.rect(-w/2,-S/2,w,S)):Gs(n,l,w,S);let M=n.createLinearGradient(-w/2,-S/2,w/2,S/2);M.addColorStop(0,`rgb(${R.map(E=>E*1.15|0)})`),M.addColorStop(1,`rgb(${R.map(E=>E*.8|0)})`),n.fillStyle=M,n.fill(),n.strokeStyle="rgba(0,0,0,0.55)",n.lineWidth=3,n.stroke()}),Ui(r,1024,g,y,d,()=>{f?(r.beginPath(),r.rect(-w/2,-S/2,w,S)):Gs(r,l,w,S),r.fillStyle=`rgb(${150+l()*60|0},150,150)`,r.fill()})}}r.filter="blur(3px)",r.drawImage(i,0,0),r.filter="none";for(let m=0;m<40;m++){let _=l()*1024,c=l()*1024,g=10+l()*40,y=l();Ui(n,1024,_,c,g,()=>{let w=n.createRadialGradient(0,0,0,0,0,g),S=y<.45?f?"40,60,70":"50,70,40":y<.75?"0,0,0":"90,10,14";w.addColorStop(0,`rgba(${S},${y<.75?.35:.5})`),w.addColorStop(1,`rgba(${S},0)`),n.fillStyle=w,n.fillRect(-g,-g,g*2,g*2)})}if(ul(n,1024,l,30,"rgba(0,0,0,0.6)",2),ul(r,1024,l,30,"rgba(0,0,0,0.9)",3),f){n.strokeStyle="rgba(200,190,170,0.35)",n.lineWidth=4,n.lineCap="round";for(let m=0;m<30;m++){let _=l()*1024,c=l()*1024,g=l()*ln,y=10+l()*16;n.beginPath(),n.moveTo(_,c),n.lineTo(_+Math.cos(g)*y,c+Math.sin(g)*y),n.stroke()}}}else if(s==="forest"){Xc(n,1024,l,"#1d3a36",500,.07,10,70),r.fillStyle="#808080",r.fillRect(0,0,1024,1024);for(let f=0;f<9e3;f++){let p=l()*1024,d=l()*1024,m=4+l()*9,_=-Math.PI/2+(l()-.5)*.9,c=l();n.strokeStyle=c<.5?`rgba(70,${120+l()*50|0},${110+l()*30|0},0.6)`:`rgba(20,${50+l()*30|0},48,0.6)`,n.lineWidth=1.4,n.beginPath(),n.moveTo(p,d),n.lineTo(p+Math.cos(_)*m,d+Math.sin(_)*m),n.stroke()}for(let f=0;f<26;f++){let p=l()*1024,d=l()*1024,m=20+l()*50,_=m*(.6+l()*.3),c=90+l()*50|0;Ui(n,1024,p,d,m,()=>{Gs(n,l,m,_),n.fillStyle=`rgb(${c-10},${c},${c+5})`,n.fill(),n.strokeStyle="rgba(0,0,0,0.5)",n.lineWidth=2,n.stroke()}),Ui(r,1024,p,d,m,()=>{Gs(r,l,m,_),r.fillStyle="#e0e0e0",r.fill()})}h=!0;for(let f=0;f<60;f++){let p=l()*512,d=l()*512;o.fillStyle=`rgba(${150+l()*80|0},${200+l()*55|0},255,0.9)`,o.beginPath(),o.arc(p,d,1+l()*1.5,0,ln),o.fill(),n.fillStyle="rgba(220,240,255,0.8)",n.beginPath(),n.arc(p*2,d*2,2.5,0,ln),n.fill()}}else{Xc(n,1024,l,"#140c1c",400,.08,20,90),r.fillStyle="#808080",r.fillRect(0,0,1024,1024);for(let d=0;d<40;d++){let m=l()*1024,_=l()*1024,c=40+l()*120,g=c*(.5+l()*.4),y=26+l()*20|0;Ui(n,1024,m,_,c,()=>{Gs(n,l,c,g),n.fillStyle=`rgb(${y+8},${y},${y+16})`,n.fill(),n.strokeStyle="rgba(0,0,0,0.6)",n.lineWidth=3,n.stroke()}),Ui(r,1024,m,_,c,()=>{Gs(r,l,c,g),r.fillStyle="#d0d0d0",r.fill()})}h=!0;let f=ui(31);ul(n,1024,f,10,"rgba(150,70,220,0.7)",2);let p=ui(31);o.save(),o.scale(.5,.5),ul(o,1024,p,10,"rgba(170,90,240,0.8)",3),o.restore(),o.filter="blur(2px)",o.drawImage(a,0,0),o.filter="none"}let u=(f,p)=>{let d=new Es(f);return d.wrapS=d.wrapT=vs,d.anisotropy=4,p&&(d.colorSpace=nn),d};return{map:u(e,!0),bump:u(i,!1),emissive:h?u(a,!0):null}}function fl(s,t=!1){let e=s[0].index!==null,n=new Set(Object.keys(s[0].attributes)),i=new Set(Object.keys(s[0].morphAttributes)),r={},a={},o=s[0].morphTargetsRelative,l=new Fe;l.morphTargetsRelative=o;let h=0;for(let u=0;u<s.length;++u){let f=s[u],p=0,d=0;if(e!==(f.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let m in f.attributes){if(!n.has(m))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+m+'" attribute exists among all geometries, or in none of them.'),null;r[m]===void 0&&(r[m]=[]),r[m].push(f.attributes[m]),p++}if(p!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(o!==f.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let m in f.morphAttributes){if(!i.has(m))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;if(f.morphAttributes[m].length!==s[0].morphAttributes[m].length)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have the same number of morph targets for the "'+m+'" morph attribute.'),null;a[m]===void 0&&(a[m]=[]),a[m].push(f.morphAttributes[m]),d++}if(d!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of morph attributes."),null;if(t){let m;if(e)m=f.index.count;else if(f.attributes.position!==void 0)m=f.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;l.addGroup(h,m,u),h+=m}}if(e){let u=0,f=[];for(let p=0;p<s.length;++p){let d=s[p].index;for(let m=0;m<d.count;++m)f.push(d.getX(m)+u);u+=s[p].attributes.position.count}l.setIndex(f)}for(let u in r){let f=xd(r[u]);if(!f)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;l.setAttribute(u,f)}for(let u in a){let f=a[u][0].length;if(f!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[u]=[];for(let p=0;p<f;++p){let d=[];for(let _=0;_<a[u].length;++_)d.push(a[u][_][p]);let m=xd(d);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;l.morphAttributes[u].push(m)}}}return l}function xd(s){let t,e,n,i=-1,r=0;for(let h=0;h<s.length;++h){let u=s[h];if(t===void 0&&(t=u.array.constructor),t!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=u.itemSize),e!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=u.normalized),n!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=u.gpuType),i!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=u.count*e}let a=new t(r),o=new Sn(a,e,n),l=0;for(let h=0;h<s.length;++h){let u=s[h];if(u.isInterleavedBufferAttribute){let f=l/e;for(let p=0,d=u.count;p<d;p++)for(let m=0;m<e;m++){let _=u.getComponent(p,m);o.setComponent(p+f,m,_)}}else a.set(u.array,l);l+=u.count*e}return i!==void 0&&(o.gpuType=i),o}var Fi=Math.PI*2,_d=new Map;function pt(s,t={}){let e=s+JSON.stringify(t),n=_d.get(e);return n||(n=new Zi({color:s,roughness:t.rough??.75,metalness:Math.min(t.metal??.05,.4),emissive:t.emi?new Xt(t.emi):new Xt(0),emissiveIntensity:t.ei??1,flatShading:!!t.flat,transparent:!!t.opacity,opacity:t.opacity??1,side:t.double?In:qn,depthWrite:!t.opacity}),n.userData.key=e,_d.set(e,n),n)}var ye=(s,t=4)=>pt(s,{emi:s,ei:t,rough:.4}),qc=(s,t,e,n)=>(s.position.set(t,e,n),s);function de(s,t,e,n=7){let i=new ri(s,t,e,n,2);return i.translate(0,-e/2,0),i}var qt=(s,t=12,e=9)=>new Pn(s,t,e),ie=(s,t,e)=>new Ai(s,t,e),Te=(s,t,e=8)=>new Xi(s,t,e),Me=(s,t,e,n=10)=>new ri(s,t,e,n),Md=(s,t,e=10)=>new gr(s,t,4,e);function Yc(s,t=16){return new Yi(s.map(([e,n])=>new ft(e,n)),t)}function be(s,t=0,e=1,n=.25){let i=new Ar(s,t),r=i.attributes.position,a=e,o=()=>(a=a*16807%2147483647,a/2147483647),l=new Map;for(let h=0;h<r.count;h++){let u=r.getX(h).toFixed(3)+r.getY(h).toFixed(3)+r.getZ(h).toFixed(3),f=l.get(u);f===void 0&&(f=1+(o()-.5)*n*2,l.set(u,f)),r.setXYZ(h,r.getX(h)*f,r.getY(h)*f,r.getZ(h)*f)}return i.computeVertexNormals(),i}function na(s,t=18,e=.12,n=3){let i=Yc(s,t),r=i.attributes.position,a=Math.min(...s.map(o=>o[1]));for(let o=0;o<r.count;o++)if(Math.abs(r.getY(o)-a)<1e-4){let l=Math.atan2(r.getZ(o),r.getX(o));r.setY(o,a+(Math.sin(l*7+n)*.5+.5)*e)}return i.computeVertexNormals(),i}function $x(s,t,e){let n=new Ri;n.absarc(0,0,s,-2.2,.9,!1),n.absarc(s*.3,-s*.18,s*.82,.9,-2.2,!0);let i=new Er(n,{depth:e,bevelEnabled:!0,bevelThickness:e*.4,bevelSize:t*.2,bevelSegments:1,curveSegments:14});return i.translate(0,0,-e/2),i}function yd(s,t,e=1){let n=new Ri;n.moveTo(0,0),n.quadraticCurveTo(s*.4,t*.9,s,t*.55);let i=4;for(let a=0;a<i;a++){let o=s*(1-a/i),l=s*(1-(a+1)/i);n.quadraticCurveTo((o+l)/2,-t*(.05+.08*((a+e)%2)),l,a===i-1?0:t*(.15+.1*a)*.6)}return new Rr(n,12)}var yn=class{constructor(){this.groups=new Map}add(t,e,{ch:n="body",k:i=0,pv:r=[0,0,0],at:a=[0,0,0],rot:o=[0,0,0],scl:l=[1,1,1]}={}){let h=t.clone(),u=new fe().compose(new k(...a),new Je().setFromEuler(new rn(...o)),new k(...l));h.applyMatrix4(u);for(let m of Object.keys(h.attributes))["position","normal"].includes(m)||h.deleteAttribute(m);let f=h.index?h.toNonIndexed():h,p=n+"|"+i+"|"+r.join(",")+"|"+e.userData.key,d=this.groups.get(p);return d||(d={ch:n,k:i,pv:r,mat:e,geos:[]},this.groups.set(p,d)),d.geos.push(f),this}build(){let t=[];for(let e of this.groups.values()){let n=fl(e.geos,!1);n.computeBoundingSphere(),t.push({ch:e.ch,k:e.k,pv:e.pv,mat:e.mat,geo:n})}return t}},Jx={rx:0,ry:0,rz:0,dy:0,s:1};function Sd(s,t,e){let n=Jx;n.rx=n.ry=n.rz=n.dy=0,n.s=1;let i=Math.sin(e.ph),r=e.mv;switch(s){case"body":n.dy=Math.abs(i)*.05*r,n.rz=Math.sin(e.ph)*.04*r,n.rx=e.atk*.25;break;case"sway":n.rz=Math.sin(e.t*2+e.seed)*.08,n.rx=.12*r+e.atk*.3;break;case"head":n.ry=Math.sin(e.t*1.3+e.seed)*.25,n.rx=-e.atk*.3;break;case"legL":n.rx=i*.65*r;break;case"legR":n.rx=-i*.65*r;break;case"armL":n.rx=-i*.5*r;break;case"armR":n.rx=i*.5*r-e.atk*2;break;case"reachL":n.rx=-1+Math.sin(e.t*3+e.seed)*.15;break;case"reachR":n.rx=-1+Math.sin(e.t*3+e.seed+1)*.15-e.atk;break;case"fl":n.rx=(t?i:-i)*.7*r;break;case"bl":n.rx=(t?-i:i)*.7*r;break;case"tail":n.ry=Math.sin(e.ph*.5+e.t*2)*.5;break;case"cape":n.rx=.15+.25*r+Math.sin(e.t*3+e.seed)*.06;break;case"tent":n.rx=Math.sin(e.t*3+t*1.3+e.seed)*.4,n.rz=Math.cos(e.t*2.6+t*2.1)*.3;break;case"spin":n.ry=e.t*2.5+t;break;case"pulse":n.s=1+Math.sin(e.t*5+e.seed)*.07+e.atk*.15;break;case"jaw":n.rx=.1+(Math.sin(e.t*4)*.5+.5)*.15+e.atk*.9;break;case"wingL":n.rz=Math.sin(e.t*7+e.seed)*.5;break;case"wingR":n.rz=-Math.sin(e.t*7+e.seed)*.5;break}return n}var En={};En.ghost=()=>{let s=new yn,t=pt("#a8b6ff",{emi:"#2a3890",ei:.55,opacity:.7,double:!0,rough:.3});s.add(na([[0,1.5],[.24,1.46],[.38,1.3],[.42,1],[.46,.7],[.55,.38],[.62,.15]],16,.18),t,{ch:"sway"}),s.add(qt(.2),pt("#05060c"),{ch:"sway",at:[0,1.22,.2],scl:[1,1.1,.8]});let e=ye("#9fe8ff",2.6);return s.add(qt(.05,6,5),e,{ch:"sway",at:[-.08,1.24,.36]}).add(qt(.05,6,5),e,{ch:"sway",at:[.08,1.24,.36]}),s.add(de(.1,.02,.6),t,{ch:"reachL",pv:[-.36,1.08,.05]}),s.add(de(.1,.02,.6),t,{ch:"reachR",pv:[.36,1.08,.05]}),{parts:s.build(),float:!0,h:1.6}};En.ghoul=()=>{let s=new yn,t=pt("#76805e",{flat:!0,rough:.9}),e=pt("#2c2f22",{flat:!0});s.add(Md(.3,.32),t,{ch:"body",at:[0,.78,0],rot:[.55,0,0]});for(let i=0;i<3;i++)s.add(qt(.07,6,5),e,{ch:"body",at:[0,.98-i*.14,-.2-i*.03]});s.add(qt(.2,10,8),t,{ch:"head",pv:[0,1,.22],at:[0,.04,.08],scl:[1,.85,1.25]}),s.add(ie(.22,.05,.12),e,{ch:"head",pv:[0,1,.22],at:[0,-.06,.25]});let n=ye("#ff3020",2.6);s.add(qt(.045,6,5),n,{ch:"head",pv:[0,1,.22],at:[-.08,.08,.3]}).add(qt(.045,6,5),n,{ch:"head",pv:[0,1,.22],at:[.08,.08,.3]});for(let[i,r]of[["armL",-.32],["armR",.32]]){s.add(de(.08,.055,.72),t,{ch:i,pv:[r,.98,.12]});for(let a=-1;a<=1;a++)s.add(Te(.025,.14,4),e,{ch:i,pv:[r,.98,.12],at:[a*.04,-.78,.03],rot:[Math.PI,0,0]})}return s.add(de(.1,.07,.56),t,{ch:"legL",pv:[-.15,.56,0]}),s.add(de(.1,.07,.56),t,{ch:"legR",pv:[.15,.56,0]}),{parts:s.build(),h:1.35}};En.cknight=()=>{let s=new yn,t=pt("#6a6a7c",{metal:.4,rough:.45,flat:!0}),e=pt("#2e2c38",{metal:.3,rough:.5}),n=pt("#3a1322",{rough:.9}),i=ye("#ff2a2a",2.6);return s.add(de(.12,.1,.78),t,{ch:"legL",pv:[-.16,.8,0]}),s.add(de(.12,.1,.78),t,{ch:"legR",pv:[.16,.8,0]}),s.add(Me(.34,.26,.68,8),t,{ch:"body",at:[0,1.15,0]}),s.add(ie(.42,.7,.05),n,{ch:"body",at:[0,.82,.25]}),s.add(qt(.18,8,6),t,{ch:"body",at:[-.38,1.44,0],scl:[1,.7,1]}).add(qt(.18,8,6),t,{ch:"body",at:[.38,1.44,0],scl:[1,.7,1]}),s.add(Me(.17,.19,.32,8),e,{ch:"head",pv:[0,1.5,0],at:[0,.18,0]}),s.add(Te(.06,.25,6),t,{ch:"head",pv:[0,1.5,0],at:[0,.46,0]}),s.add(ie(.24,.035,.03),i,{ch:"head",pv:[0,1.5,0],at:[0,.2,.18]}),s.add(ie(.75,1.1,.03),n,{ch:"cape",pv:[0,1.48,-.2],at:[0,-.55,0]}),s.add(de(.08,.07,.6),t,{ch:"armL",pv:[-.4,1.38,0]}),s.add(Me(.3,.3,.06,10),e,{ch:"armL",pv:[-.4,1.38,0],at:[-.06,-.5,.18],rot:[Math.PI/2,0,0]}),s.add(Me(.16,.16,.08,6),t,{ch:"armL",pv:[-.4,1.38,0],at:[-.06,-.5,.22],rot:[Math.PI/2,0,0]}),s.add(de(.08,.07,.6),t,{ch:"armR",pv:[.4,1.38,0]}),s.add(ie(.07,1,.025),pt("#9a98b0",{metal:.9,rough:.25,emi:"#3a2a60",ei:.6}),{ch:"armR",pv:[.4,1.38,0],at:[0,-.55,.55],rot:[Math.PI/2,0,0]}),s.add(ie(.26,.05,.06),e,{ch:"armR",pv:[.4,1.38,0],at:[0,-.6,.06]}),{parts:s.build(),h:2}};En.wolf=()=>{let s=new yn,t=pt("#4a3a30",{flat:!0,rough:.95}),e=pt("#211812",{flat:!0}),n=pt("#7a3cc0",{emi:"#6a2cd0",ei:1.6,flat:!0});s.add(Md(.25,.7),t,{ch:"body",at:[0,.62,0],rot:[Math.PI/2,0,0]});for(let a=0;a<5;a++)s.add(Te(.06,.28-a*.03,5),n,{ch:"body",at:[0,.88,.3-a*.16],rot:[-.4,0,0]});let i={ch:"head",pv:[0,.75,.48]};s.add(qt(.21,9,7),t,{...i,at:[0,.03,.08],scl:[.9,.85,1.1]}),s.add(Te(.12,.32,6),t,{...i,at:[0,-.04,.34],rot:[Math.PI/2,0,0]}),s.add(Te(.06,.18,4),t,{...i,at:[-.11,.24,.02],rot:[-.2,0,-.3]}).add(Te(.06,.18,4),t,{...i,at:[.11,.24,.02],rot:[-.2,0,.3]});let r=ye("#ffd23a",2.6);s.add(qt(.035,6,5),r,{...i,at:[-.09,.07,.24]}).add(qt(.035,6,5),r,{...i,at:[.09,.07,.24]}),s.add(Te(.015,.08,3),pt("#e8e0c8"),{...i,at:[.05,-.12,.38],rot:[Math.PI,0,0]}).add(Te(.015,.08,3),pt("#e8e0c8"),{...i,at:[-.05,-.12,.38],rot:[Math.PI,0,0]});for(let[a,o]of[["fl",.36],["bl",-.36]])for(let l of[0,1])s.add(de(.075,.05,.55),t,{ch:a,k:l,pv:[l?.15:-.15,.56,o]}),s.add(qt(.055,5,4),e,{ch:a,k:l,pv:[l?.15:-.15,.56,o],at:[0,-.55,.03]});return s.add(de(.07,.025,.55),t,{ch:"tail",pv:[0,.72,-.48],rot:[-2.2,0,0]}),{parts:s.build(),h:1.1}};En.wisp=()=>{let s=new yn;s.add(qt(.17),ye("#9dffc8",2.6),{ch:"pulse",pv:[0,1.1,0]}),s.add(qt(.32,14,10),pt("#5affb0",{emi:"#2aff90",ei:1.2,opacity:.3,rough:.2}),{ch:"pulse",pv:[0,1.1,0]});for(let t=0;t<3;t++){let e=t/3*Fi;s.add(qt(.06,6,5),ye("#c8ffe0",2.6),{ch:"spin",k:0,pv:[0,1.1,0],at:[Math.cos(e)*.48,Math.sin(t)*.1,Math.sin(e)*.48]})}for(let t=0;t<3;t++)s.add(Te(.08,.5,5),pt("#5affb0",{emi:"#2aff90",ei:1.5,opacity:.4}),{ch:"tent",k:t,pv:[(t-1)*.1,.9,0],at:[0,-.25,0],rot:[Math.PI,0,0]});return{parts:s.build(),float:!0,h:1.5}};En.treant=()=>{let s=new yn,t=pt("#3d2a1c",{flat:!0,rough:1}),e=pt("#25503a",{flat:!0,rough:.9}),n=pt("#2f6a40",{flat:!0,emi:"#103a20",ei:.4});s.add(Me(.28,.42,1.35,8),t,{ch:"body",at:[0,.95,0]}),s.add(ie(.2,.06,.05),pt("#0a0604"),{ch:"body",at:[0,1.05,.33]});let i=ye("#d8ff5a",2.6);s.add(qt(.05,6,5),i,{ch:"body",at:[-.11,1.28,.3]}).add(qt(.05,6,5),i,{ch:"body",at:[.11,1.28,.3]}),s.add(de(.16,.1,.62),t,{ch:"legL",pv:[-.2,.55,0]}),s.add(de(.16,.1,.62),t,{ch:"legR",pv:[.2,.55,0]});for(let[a,o]of[["armL",-1],["armR",1]])s.add(de(.11,.05,.95),t,{ch:a,pv:[o*.3,1.45,0],rot:[0,0,o*.9]}),s.add(de(.05,.02,.4),t,{ch:a,pv:[o*.3,1.45,0],at:[o*.5,-.4,0],rot:[.3,0,o*1.8]}),s.add(be(.18,0,7),e,{ch:a,pv:[o*.3,1.45,0],at:[o*.75,-.55,0]});let r={ch:"head",pv:[0,1.62,0]};return s.add(be(.5,1,3),e,{...r,at:[0,.25,0]}),s.add(be(.36,0,5),n,{...r,at:[-.34,.08,.1]}).add(be(.36,0,9),e,{...r,at:[.34,.12,-.05]}),{parts:s.build(),h:2.4}};En.skeleton=()=>{let s=new yn,t=pt("#d6ceb6",{rough:.7}),e=pt("#6b5a48",{metal:.6,rough:.6});s.add(ie(.26,.1,.12),t,{ch:"body",at:[0,.86,0]}),s.add(Me(.035,.035,.55,5),t,{ch:"body",at:[0,1.12,-.04]});for(let r=0;r<4;r++)s.add(new ze(.17-r*.015,.022,5,12,Math.PI*1.4),t,{ch:"body",at:[0,1.05+r*.1,-.02],rot:[Math.PI/2,0,Math.PI*.8]});let n={ch:"head",pv:[0,1.42,0]};s.add(qt(.16,10,8),t,{...n,at:[0,.14,0],scl:[.95,1,1.05]}),s.add(ie(.16,.06,.12),t,{...n,at:[0,0,.06]}),s.add(qt(.05,6,5),pt("#05060a"),{...n,at:[-.06,.15,.13]}).add(qt(.05,6,5),pt("#05060a"),{...n,at:[.06,.15,.13]});let i=ye("#4aa8ff",2.6);return s.add(qt(.025,5,4),i,{...n,at:[-.06,.15,.16]}).add(qt(.025,5,4),i,{...n,at:[.06,.15,.16]}),s.add(de(.04,.03,.82),t,{ch:"legL",pv:[-.1,.86,0]}),s.add(de(.04,.03,.82),t,{ch:"legR",pv:[.1,.86,0]}),s.add(de(.035,.03,.62),t,{ch:"armL",pv:[-.22,1.38,0]}),s.add(de(.035,.03,.62),t,{ch:"armR",pv:[.22,1.38,0]}),s.add(ie(.05,.75,.02),e,{ch:"armR",pv:[.22,1.38,0],at:[0,-.62,.38],rot:[Math.PI/2,0,0]}),{parts:s.build(),h:1.8}};En.deadmage=()=>{let s=new yn,t=pt("#1d2442",{rough:.9,double:!0}),e=pt("#5a7ab8",{metal:.6,rough:.4});s.add(na([[0,1.45],[.22,1.42],[.3,1.3],[.36,.9],[.46,.4],[.54,.05]],14,.12),t,{ch:"sway"}),s.add(new ze(.33,.025,4,16),e,{ch:"sway",at:[0,.95,0],rot:[Math.PI/2,0,0]}),s.add(qt(.24,10,8),t,{ch:"sway",at:[0,1.58,-.02],scl:[1,1.1,1.05]}),s.add(qt(.17,8,6),pt("#020308"),{ch:"sway",at:[0,1.55,.1]});let n=ye("#7fc8ff",2.6);return s.add(qt(.03,5,4),n,{ch:"sway",at:[-.06,1.57,.24]}).add(qt(.03,5,4),n,{ch:"sway",at:[.06,1.57,.24]}),s.add(de(.1,.07,.5),t,{ch:"armL",pv:[-.28,1.35,0]}),s.add(de(.1,.07,.5),t,{ch:"armR",pv:[.28,1.35,0]}),s.add(Me(.025,.025,1.7,5),pt("#3a2a1e"),{ch:"armR",pv:[.28,1.35,0],at:[.02,-.45,.12]}),s.add(qt(.09,8,6),ye("#7fbfff",2.6),{ch:"armR",pv:[.28,1.35,0],at:[.02,.42,.12]}),{parts:s.build(),h:1.9}};En.golem=()=>{let s=new yn,t=pt("#bdb39a",{flat:!0,rough:.85}),e=pt("#3a342a",{flat:!0});s.add(be(.62,0,11,.2),t,{ch:"body",at:[0,1.45,0],scl:[1.2,1,.9]});for(let i=0;i<4;i++)s.add(Me(.05,.05,.9,5),t,{ch:"body",at:[-.3+i*.2,1.2,.45],rot:[.2,0,Math.PI/2+.3]});s.add(qt(.15,10,8),ye("#5ab0ff",2.6),{ch:"body",at:[0,1.45,.55]}),s.add(qt(.2,8,6),t,{ch:"head",pv:[0,2,.15],at:[0,.1,.05]});let n=ye("#5ab0ff",2.6);s.add(qt(.04,5,4),n,{ch:"head",pv:[0,2,.15],at:[-.07,.12,.22]}).add(qt(.04,5,4),n,{ch:"head",pv:[0,2,.15],at:[.07,.12,.22]});for(let[i,r]of[["armL",-1],["armR",1]])s.add(de(.2,.15,.9),t,{ch:i,pv:[r*.75,1.8,0]}),s.add(be(.26,0,13+r),e,{ch:i,pv:[r*.75,1.8,0],at:[0,-1,.05]});return s.add(de(.22,.18,.85),t,{ch:"legL",pv:[-.32,.88,0]}),s.add(de(.22,.18,.85),t,{ch:"legR",pv:[.32,.88,0]}),{parts:s.build(),h:2.5}};En.spawn=()=>{let s=new yn,t=pt("#4a1d7a",{emi:"#2a0a50",ei:.8,rough:.5});s.add(qt(.42,14,10),t,{ch:"pulse",pv:[0,.5,0],scl:[1,.85,1]});let e=ye("#ffb0ff",2.6);[[-.15,.12,.33,.07],[.15,.1,.33,.06],[0,-.05,.38,.08],[.25,-.08,.28,.05]].forEach(([n,i,r,a])=>s.add(qt(a,6,5),e,{ch:"pulse",pv:[0,.5,0],at:[n,i,r]}));for(let n=0;n<6;n++){let i=n/6*Fi;s.add(de(.08,.02,.65),t,{ch:"tent",k:n,pv:[Math.sin(i)*.32,.35,Math.cos(i)*.32],rot:[Math.cos(i)*1.1,0,-Math.sin(i)*1.1]})}return{parts:s.build(),h:1}};En.voideye=()=>{let s=new yn,t={ch:"pulse",pv:[0,1.25,0]};s.add(qt(.46,16,12),pt("#efe0ec",{rough:.25}),t),s.add(Me(.26,.26,.02,20),ye("#ff4fd2",3),{...t,at:[0,0,.45],rot:[Math.PI/2,0,0]}),s.add(ie(.06,.32,.02),pt("#0b0010"),{...t,at:[0,0,.465]});for(let e=0;e<6;e++)s.add(Me(.008,.008,.4,3),pt("#c02050",{emi:"#600010",ei:1}),{...t,at:[Math.cos(e)*.3,Math.sin(e*2)*.3,.3],rot:[e,e*2,0]});for(let e=0;e<5;e++){let n=e/5*Fi;s.add(de(.07,.015,.8),pt("#5a1a7a",{emi:"#2a0040",ei:.6}),{ch:"tent",k:e,pv:[Math.cos(n)*.22,.9,Math.sin(n)*.22]})}return{parts:s.build(),float:!0,h:1.8}};En.horror=()=>{let s=new yn,t=pt("#24113a",{flat:!0,rough:.6,emi:"#12051f",ei:1}),e=pt("#120818",{flat:!0}),n=ye("#c070ff",2.6);s.add(be(.75,1,21,.18),t,{ch:"pulse",pv:[0,1.15,0]});for(let i=0;i<12;i++){let r=i/12*Fi,a=Math.sin(i*1.7)*.4;s.add(Te(.1,.55,5),e,{ch:"pulse",pv:[0,1.15,0],at:[Math.cos(r)*.72,a,Math.sin(r)*.72],rot:[Math.sin(r)*1.2,0,-Math.cos(r)*1.2]})}s.add(qt(.1,8,6),n,{ch:"pulse",pv:[0,1.15,0],at:[-.25,.15,.66],scl:[.7,1.4,.5]}),s.add(qt(.1,8,6),n,{ch:"pulse",pv:[0,1.15,0],at:[.25,.15,.66],scl:[.7,1.4,.5]}),s.add(ie(.5,.12,.1),ye("#ff4060",2),{ch:"jaw",pv:[0,.95,.6]});for(let i=0;i<4;i++){let r=-.6+i*.4+(i>1?Math.PI-.6:0);s.add(de(.13,.03,1.1),t,{ch:"tent",k:i,pv:[Math.cos(r)*.6,.9,Math.sin(r)*.3+.1],rot:[.6,0,(i<2?-1:1)*.7]})}return{parts:s.build(),h:2.3}};var vd=new Map;function bd(s){let t=vd.get(s);return t||(t=En[s](),vd.set(s,t)),t}function Td(){let s=new Kt,t=new Kt;s.add(t);let e=pt("#2c1650",{rough:.8,double:!0}),n=pt("#3e1f6e",{rough:.7,double:!0}),i=pt("#d8b25a",{metal:.9,rough:.3,emi:"#4a3010",ei:.4}),r=pt("#2a1a14"),a=new ht(na([[0,1.5],[.2,1.48],[.28,1.38],[.3,1.1],[.36,.7],[.46,.3],[.56,.02]],20,.08,1),e);t.add(a);let o=new ht(new ze(.535,.03,5,24),i);o.rotation.x=Math.PI/2,o.position.y=.08,t.add(o);let l=new ht(new ze(.31,.035,5,20),i);l.rotation.x=Math.PI/2,l.position.y=.98,t.add(l);let h=new ht(new gn(.06),ye("#c78bff",5));h.position.set(0,.98,.33),t.add(h);let u=new ht(ie(.16,.9,.02),n);u.position.set(0,.5,.42),u.rotation.x=-.2,t.add(u);let f=new ht(ie(.2,.9,.012),i);f.position.set(0,.5,.415),f.rotation.x=-.2,f.scale.x=1.15,t.add(f);for(let Y of[-1,1]){let X=new ht(new Pn(.16,10,6,0,Fi,0,Math.PI/2),n);X.position.set(Y*.26,1.36,0),X.scale.set(1,.6,1),t.add(X);let $=new ht(new ze(.15,.018,4,12),i);$.position.set(Y*.26,1.36,0),$.rotation.x=Math.PI/2,t.add($)}let p=new Kt;p.position.set(0,1.4,-.18),t.add(p);let d=new Cn(.75,1.35,4,6);d.translate(0,-.67,0);let m=new ht(d,pt("#1c0d33",{rough:.9,double:!0}));p.add(m);let _=new Kt;_.position.set(0,1.55,0),t.add(_);let c=new ht(qt(.25,14,10),n);c.scale.set(1,1.15,1.1),_.add(c);let g=new ht(Te(.14,.3,10),n);g.position.set(0,.2,-.16),g.rotation.x=-.9,_.add(g);let y=new ht(new ze(.17,.02,4,16),i);y.position.set(0,-.02,.18),y.scale.y=1.3,_.add(y);let w=new ht(qt(.17,10,8),r);w.position.set(0,-.03,.12),w.scale.z=.7,_.add(w);let S=new ht(qt(.16,10,8),pt("#04020a"));S.position.set(0,.04,.14),S.scale.set(1,.6,.7),_.add(S);let C=ye("#c9a8ff",7),R=[];for(let Y of[-1,1]){let X=new ht(qt(.025,6,5),C);X.position.set(Y*.06,-.02,.27),_.add(X),R.push(X)}let M=new Kt;M.position.set(-.3,1.32,0),t.add(M);let E=new Kt;E.position.set(.3,1.32,0),t.add(E);for(let Y of[M,E]){let X=new ht(de(.09,.13,.55,8),n);Y.add(X);let $=new ht(new ze(.12,.02,4,12),i);$.position.y=-.53,$.rotation.x=Math.PI/2,Y.add($);let W=new ht(qt(.06,6,5),r);W.position.y=-.6,Y.add(W)}let U=new ht(qt(.08,10,8),ye("#c070ff",6));U.position.set(0,-.72,.06),M.add(U);let I=new Kt;I.position.set(0,-.6,.05),E.add(I);let O=new ht(Me(.028,.034,2,6),pt("#2a1a10",{rough:.8}));O.position.y=.25,I.add(O);let B=new ht(new ze(.045,.012,4,10),i);B.rotation.x=Math.PI/2,B.position.y=.9,I.add(B);let H=new Kt;H.position.y=1.3,I.add(H);for(let Y=0;Y<4;Y++){let X=new ht(de(.02,.008,.32,4),i);X.rotation.set(Math.PI,Y*Math.PI/2,0),X.rotation.z=Math.PI+.35,X.rotation.y=Y*Math.PI/2,X.position.set(0,-.05,0),H.add(X)}let F=new ht(new gn(.11,0),ye("#b46cff",5));F.scale.y=1.7,F.position.y=.22,H.add(F),s.traverse(Y=>{Y.isMesh&&(Y.castShadow=!0,Y.receiveShadow=!1)}),m.castShadow=!0;let q={walk:0};return{root:s,crystal:F,orb:U,update(Y,X,$){let W=X.moving?1:0;q.walk+=$*(X.moving?9:0);let j=Math.sin(q.walk);t.position.y=Math.abs(j)*.06*W+Math.sin(Y*2)*.015,t.rotation.x=.12*W,t.rotation.z=j*.04*W,a.rotation.y=Math.sin(Y*1.5)*.05,a.scale.set(1+j*.03*W,1,1-j*.03*W),p.rotation.x=.25+.5*W+Math.sin(Y*4)*.08,m.geometry.attributes.position.needsUpdate=!1;let nt=X.castT>0?Math.min(1,X.castT/.15):0;M.rotation.x=-j*.4*W-.3-nt*.9,M.rotation.z=-.15-nt*.3,E.rotation.x=j*.4*W-.35-nt*.6,E.rotation.z=.12,_.rotation.y=Math.sin(Y*.7)*.15,H.rotation.y=Y*1.5;let vt=X.heart>=100;F.scale.setScalar(vt?1+Math.sin(Y*10)*.15:1),F.scale.y*=1.7,F.material.emissiveIntensity=vt?9:4+nt*3,U.scale.setScalar(1+Math.sin(Y*6)*.15+nt*.8)}}}function pl(s){s.traverse(t=>{t.isMesh&&(t.castShadow=!0)})}function Kx(){let s=new Kt,t=new Kt;s.add(t);let e=pt("#6a6488",{metal:.4,rough:.45,flat:!0}),n=pt("#2c2638",{metal:.3,rough:.55,flat:!0}),i=pt("#6a4aa0",{metal:.9,rough:.3,emi:"#3a1a70",ei:.8}),r=ye("#c78bff",8);t.scale.setScalar(2.4);let o=[];for(let E of[-1,1]){let U=new Kt;U.position.set(E*.17,.82,0),t.add(U),o.push(U),U.add(new ht(de(.13,.11,.8,7),e));let I=new ht(qt(.09,6,5),n);I.position.set(0,-.4,.08),U.add(I)}let l=new Kt;l.position.y=.85,t.add(l),l.add(qc(new ht(Me(.38,.28,.7,8),e),0,.38,0));let h=new ht(ie(.05,.4,.02),r);h.position.set(0,.42,.33),l.add(h);let u=new ht(ie(.3,.04,.02),r);u.position.set(0,.5,.33),l.add(u);for(let E of[-1,1]){let U=new ht(qt(.22,8,6),e);U.position.set(E*.43,.68,0),U.scale.set(1,.65,1),l.add(U);for(let I=0;I<3;I++){let O=new ht(Te(.05,.3,5),n);O.position.set(E*(.43+I*.05),.82,-.08+I*.08),O.rotation.z=-E*(.5+I*.2),l.add(O)}}let f=new Kt;f.position.set(0,.7,-.25),l.add(f);let p=new Cn(.95,1.55,6,8);p.translate(0,-.77,0);let d=p.attributes.position;for(let E=0;E<d.count;E++)d.getY(E)<-1.5&&d.setY(E,-1.55+Math.abs(Math.sin(d.getX(E)*20))*.2);let m=new ht(p,pt("#3a1830",{rough:.95,double:!0}));f.add(m);let _=new Kt;_.position.set(0,.85,.02),l.add(_),_.add(qc(new ht(Me(.19,.21,.36,8),n),0,.15,0));for(let E of[-1,1]){let U=new ht(Te(.06,.45,6),e);U.position.set(E*.18,.42,-.02),U.rotation.z=-E*.5,_.add(U)}let c=new ht(ie(.26,.04,.03),r);c.position.set(0,.17,.2),_.add(c);let g=new Kt;g.position.set(-.45,.6,0),l.add(g),g.add(new ht(de(.1,.09,.65,7),e));let y=new Kt;y.position.set(.45,.6,0),l.add(y),y.add(new ht(de(.1,.09,.65,7),e));let w=new Kt;w.position.set(0,-.62,.05),y.add(w);let S=new ht(ie(.1,1.6,.03),pt("#3a2a5a",{metal:.9,rough:.2,emi:"#8a4cff",ei:2.2}));S.position.y=.95,w.add(S);let C=new ht(ie(.02,1.55,.04),ye("#e0b8ff",6));C.position.set(.05,.95,0),w.add(C);let R=new ht(ie(.42,.06,.08),i);R.position.y=.12,w.add(R);let M=new ht(Me(.03,.03,.3,5),n);return w.add(M),pl(s),{root:s,h:5.2,swordTip:C,update(E,U,I,O){let B=U.ai.mode,H=O.ph,F=B==="walk"?1:0;if(o[0].rotation.x=Math.sin(H)*.5*F,o[1].rotation.x=-Math.sin(H)*.5*F,t.position.y=Math.abs(Math.sin(H))*.08*F,f.rotation.x=.2+(B==="charge"?.9:.2*F)+Math.sin(E*3)*.08,B==="windup")y.rotation.x=-2.6,y.rotation.z=.3,l.rotation.x=-.15,w.rotation.x=0;else if(B==="charge")y.rotation.x=-1.4,y.rotation.z=0,l.rotation.x=.35,w.rotation.x=.2;else{let q=O.atk;y.rotation.x=-.5-Math.sin(H)*.2*F-q*2.2,y.rotation.z=.15-q*.6,l.rotation.x=.05+q*.2,l.rotation.y=-q*.5,w.rotation.x=.7}g.rotation.x=Math.sin(H)*.4*F-.2,c.material.emissiveIntensity=6+Math.sin(E*6)*2}}}function Qx(){let s=new Kt,t=new Kt;s.add(t);let e=pt("#2f3b42",{flat:!0,rough:.9}),n=pt("#141a1e",{flat:!0}),i=pt("#8a7a5a",{rough:.6});t.scale.setScalar(2);let a=new ht(be(.75,1,41,.15),e);a.position.set(0,1.2,-.1),a.scale.set(1.1,.9,1.35),t.add(a);for(let _=0;_<16;_++){let c=_/16*Math.PI-Math.PI/2,g=-.7+_%8*.2,y=new ht(Te(.07,.5+_%3*.15,5),n);y.position.set(Math.sin(c)*.6,1.6+Math.cos(c)*.3,g),y.rotation.set(-.5,0,-Math.sin(c)*.8),t.add(y)}let o=[];for(let[_,c]of[[-.55,.45],[.55,.45],[-.55,-.6],[.55,-.6]]){let g=new Kt;g.position.set(_,.95,c),t.add(g),o.push(g),g.add(new ht(de(.22,.15,.95,7),e));for(let y=-1;y<=1;y++){let w=new ht(Te(.04,.18,4),i);w.position.set(y*.07,-.95,.15),w.rotation.x=Math.PI/2,g.add(w)}}let l=new Kt;l.position.set(0,1.35,.95),t.add(l);let h=new ht(be(.45,1,7,.12),e);h.scale.set(1.1,.8,1.1),h.position.set(0,.12,.1),l.add(h);for(let _ of[-1,1]){let c=new ht(new ze(.35,.06,6,12,Math.PI*.9),i);c.position.set(_*.3,.45,-.05),c.rotation.set(0,_*.4+Math.PI/2,Math.PI*.55*_),l.add(c)}let u=ye("#ff3a3a",8);for(let _ of[-1,1]){let c=new ht(qt(.06,6,5),u);c.position.set(_*.22,.25,.48),l.add(c)}let f=new ht(qt(.18,10,8),ye("#b46cff",6));f.position.set(0,-.05,.4),l.add(f);let p=pt("#e8e2c8");for(let _=0;_<7;_++){let c=new ht(Te(.035,.16,4),p);c.position.set(-.27+_*.09,0,.5),c.rotation.x=Math.PI,l.add(c)}let d=new Kt;d.position.set(0,-.08,.05),l.add(d);let m=new ht(ie(.65,.12,.6),e);m.position.set(0,-.06,.25),d.add(m);for(let _=0;_<7;_++){let c=new ht(Te(.03,.14,4),p);c.position.set(-.27+_*.09,.05,.5),d.add(c)}return pl(s),{root:s,h:4.6,maw:f,update(_,c,g,y){let w=y.ph;o[0].rotation.x=Math.sin(w)*.4,o[3].rotation.x=Math.sin(w)*.4,o[1].rotation.x=-Math.sin(w)*.4,o[2].rotation.x=-Math.sin(w)*.4,t.position.y=Math.abs(Math.sin(w))*.06,a.scale.y=.9+Math.sin(_*2)*.03,d.rotation.x=.15+(Math.sin(_*3)*.5+.5)*.2+y.atk*.7,l.rotation.x=-y.atk*.3,f.material.emissiveIntensity=5+y.atk*8+Math.sin(_*5)*1.5}}}function jx(){let s=new Kt,t=new Kt;s.add(t);let e=pt("#241a34",{rough:.85,double:!0}),n=pt("#e4dcc6",{rough:.6}),i=pt("#c8a24a",{metal:.9,rough:.35,emi:"#3a2008",ei:.3}),r=ye("#c070ff",3);t.scale.setScalar(2.5);let o=new ht(na([[0,1.55],[.3,1.5],[.42,1.3],[.45,.9],[.62,.4],[.82,0]],22,.28,2),e);t.add(o);let l=new ht(Me(.08,.2,1.2,8),pt("#b46cff",{emi:"#b46cff",ei:1.6,opacity:.5}));l.position.set(0,.7,.36),l.rotation.x=-.25,t.add(l);let h=new Kt;h.position.set(0,1.15,.28),t.add(h);for(let g=0;g<4;g++){let y=new ht(new ze(.16-g*.01,.02,4,12,Math.PI),n);y.position.y=g*.09,y.rotation.set(0,0,Math.PI),h.add(y)}let u=new ht(new ze(.34,.06,6,18),i);u.rotation.x=Math.PI/2,u.position.y=1.5,t.add(u);for(let g=0;g<8;g++){let y=new ht(Te(.04,.35,4),e),w=Math.PI+g/7*Math.PI;y.position.set(Math.cos(w)*.38,1.6,Math.sin(w)*.25-.05),y.rotation.z=-Math.cos(w)*.6,t.add(y)}let f=new Kt;f.position.set(0,1.78,.05),t.add(f),f.add(new ht(qt(.22,12,10),n));let p=new ht(ie(.2,.08,.14),n);p.position.set(0,-.17,.06),f.add(p);for(let g of[-1,1]){let y=new ht(qt(.06,6,5),pt("#05030a"));y.position.set(g*.08,.02,.17),f.add(y);let w=new ht(qt(.03,6,5),ye("#d68bff",9));w.position.set(g*.08,.02,.2),f.add(w);let S=new ht(new ze(.28,.035,6,12,Math.PI*.8),pt("#1a1420",{rough:.5}));S.position.set(g*.18,.2,-.05),S.rotation.set(0,Math.PI/2,g>0?.3:Math.PI-.3),f.add(S)}let d=new Kt;d.position.y=.18,f.add(d),d.add(new ht(Me(.2,.2,.08,14,!0),i));for(let g=0;g<7;g++){let y=g/7*Fi,w=new ht(Te(.035,.16,4),i);w.position.set(Math.cos(y)*.2,.11,Math.sin(y)*.2),d.add(w)}let m=[];for(let g of[-1,1]){let y=new Kt;y.position.set(g*.42,1.42,0),t.add(y),m.push(y),y.add(new ht(de(.13,.17,.6,8),e));let w=new ht(qt(.06,6,5),n);w.position.y=-.65,y.add(w)}let _=new Kt;_.position.set(0,-.65,.05),m[0].add(_),_.add(qc(new ht(Me(.03,.03,2.2,6),i),0,.3,0));let c=new ht(qt(.13,12,10),ye("#7fd6ff",3));return c.position.y=1.5,_.add(c),pl(s),{root:s,h:5.6,orb:c,update(g,y,w,S){t.position.y=.3+Math.sin(g*1.6)*.12,o.rotation.y=Math.sin(g*.8)*.1,o.scale.x=o.scale.z=1+Math.sin(g*2.2)*.03;let C=S.atk;m[1].rotation.x=-.3-C*2.2+Math.sin(g*1.3)*.1,m[1].rotation.z=.2+C*.4,m[0].rotation.x=-.4-C*.6,f.rotation.y=Math.sin(g*.9)*.2,c.material.emissiveIntensity=2.5+C*5,l.material.opacity=.35+Math.sin(g*4)*.15}}}function t_(){let s=new Kt,t=new Kt;s.add(t);let e=pt("#1e1030",{rough:.8,double:!0}),n=pt("#2a1040",{emi:"#8a4cff",ei:1.5,double:!0});t.scale.setScalar(2.6);let r=new ht(na([[0,1.85],[.24,1.8],[.34,1.55],[.38,1.1],[.5,.55],[.7,0]],22,.35,5),e);t.add(r);let a=new ht(Te(.32,.8,14,1,!0),e);a.position.set(0,2.1,-.02),t.add(a);let o=new ht(qt(.2,10,8),pt("#000000"));o.position.set(0,1.9,.1),t.add(o);for(let m of[-1,1]){let _=new ht(qt(.035,6,5),ye("#ffffff",5));_.position.set(m*.08,1.92,.27),_.scale.set(1.6,.7,1),t.add(_)}let l=new ht(qt(.2,16,12),ye("#7fc0ff",2));l.position.set(0,1.35,.32),t.add(l);let h=new ht(new ze(.3,.02,6,24),ye("#5a8cff",2.5));h.position.copy(l.position),t.add(h);let u=new Kt;t.add(u);for(let m=0;m<6;m++){let _=new ht(Me(.012,.004,.9,3),ye("#6aa0ff",2.5)),c=m/6*Fi;_.position.set(Math.cos(c)*.25,1+Math.sin(c)*.3,.33),_.rotation.z=c,u.add(_)}let f=[];for(let m of[-1,1]){let _=new Kt;_.position.set(m*.25,1.6,-.2),t.add(_),f.push(_);let c=yd(1.9,1.3,m>0?1:2);m<0&&c.scale(-1,1,1),_.add(new ht(c,e));let g=new ht(yd(1.95,1.35,m>0?1:2),n);m<0&&g.geometry.scale(-1,1,1),g.scale.set(1,1,1),g.position.z=-.01,g.material=pt("#2a1040",{emi:"#6a2cff",ei:1.2,double:!0,opacity:.5}),_.add(g)}let p=new Kt;p.position.set(0,2.3,-.3),t.add(p);for(let m=0;m<10;m++){let _=new ht(new gn(.08),ye("#d68bff",2.2)),c=m/10*Fi;_.position.set(Math.cos(c)*.55,Math.sin(c)*.55,0),_.scale.y=2,_.rotation.z=c,p.add(_)}let d=[];for(let m of[-1,1]){let _=new Kt;_.position.set(m*.36,1.55,0),t.add(_),d.push(_),_.add(new ht(de(.1,.15,.7,8),e));for(let c=-1;c<=1;c++){let g=new ht(Te(.02,.22,4),pt("#1a0a28"));g.position.set(c*.04,-.8,.02),g.rotation.x=Math.PI,_.add(g)}}return pl(s),{root:s,h:6.5,core:l,update(m,_,c,g){t.position.y=.4+Math.sin(m*1.4)*.15;let y=Math.sin(m*(_.ai.mode==="charge"?12:3.2));f[0].rotation.y=.35+y*.45,f[1].rotation.y=-.35-y*.45,f[0].rotation.z=y*.1,f[1].rotation.z=-y*.1,p.rotation.z=m*.8,h.rotation.set(m*1.3,m*.9,0);let w=Math.max(g.atk,_.ai.mode==="windup"?1:0);d[0].rotation.set(-.4-w*1.5,0,-.3-w*.5),d[1].rotation.set(-.4-w*1.5,0,.3+w*.5),l.material.emissiveIntensity=1.8+Math.sin(m*6)*.6+w*2.5,r.rotation.y=Math.sin(m)*.1}}}function wd(s){switch(s){case"fallen_knight":return Kx();case"devourer":return Qx();case"soulless_king":return jx();default:return t_()}}var Vs={shard:()=>{let s=new gn(.16,0);return s.scale(.5,.5,2.4),s},crescent:()=>$x(.42,.1,.05),gem:()=>new gn(.13,0)};var di=Math.PI*2,Zc=16,Ws=12,ia=3;function Ne(s){let t=new Map;for(let[e,n,i=0,r=0,a=0,o=0,l=0,h=0,u=1,f=1,p=1]of s){let d=e.clone();d.applyMatrix4(new fe().compose(new k(i,r,a),new Je().setFromEuler(new rn(o,l,h)),new k(u,f,p)));for(let _ of Object.keys(d.attributes))_!=="position"&&_!=="normal"&&d.deleteAttribute(_);let m=d.index?d.toNonIndexed():d;t.has(n)||t.set(n,[]),t.get(n).push(m)}return[...t].map(([e,n])=>({mat:e,geo:fl(n)}))}function e_(s){let t=[];if(s==="ruins"){let e=pt("#5d5864",{flat:!0,rough:.95}),n=pt("#47434d",{flat:!0,rough:.95}),i=pt("#26232b",{metal:.7,rough:.5}),r=pt("#ff5a1a",{emi:"#ff4a10",ei:3}),a=[];a.push([ie(1.2,.35,1.2),n,0,.17,0]),a.push([Me(.42,.46,.25,14),e,0,.45,0]),a.push([Me(.36,.4,2.4,14),e,0,1.75,0]),a.push([be(.42,0,3,.35),e,.05,2.95,0,0,0,0,1,.6,1]),t.push({parts:Ne(a),density:.55,scale:[.7,1.25],clear:6}),t.push({parts:Ne([[Me(.38,.38,3.2,14),e,0,.38,0,0,0,Math.PI/2],[be(.4,0,5),n,1.9,.3,.3],[be(.3,0,8),e,-1.9,.25,-.2]]),density:.25,scale:[.8,1.1],clear:6}),t.push({parts:Ne([[be(.5,0,11),e,0,.25,0],[be(.32,0,12),n,.6,.15,.3],[be(.25,0,13),e,-.4,.12,.5],[be(.2,0,14),n,.2,.1,-.6]]),density:1.4,scale:[.6,1.4]});let o=[[ie(3.2,1.4,.7),n,0,.7,0]];for(let u=0;u<5;u++)o.push([be(.38,0,20+u),e,-1.3+u*.65,1.45+u%2*.25,0]);t.push({parts:Ne(o),density:.3,scale:[.8,1.2],clear:7});let l=[[Yc([[0,.9],[.45,1],[.55,1.2],[.5,1.25],[.38,1.05],[0,1]],12),i]];for(let u=0;u<3;u++){let f=u/3*di;l.push([de(.04,.03,1,5),i,Math.cos(f)*.32,1,Math.sin(f)*.32,Math.sin(f)*.3,0,-Math.cos(f)*.3])}l.push([be(.32,0,2),r,0,1.12,0,0,0,0,1,.4,1]),t.push({parts:Ne(l),density:.18,scale:[1,1],clear:5,emit:[{kind:"flame",y:1.3,size:1.2,color:"#ff8a3c"}]});let h=[];for(let u=0;u<6;u++)h.push([Me(.035,.035,1.8,5),i,-1.5+u*.6,.9,0]),h.push([Te(.06,.18,4),i,-1.5+u*.6,1.88,0]);h.push([ie(3.3,.06,.06),i,0,1.55,0]),h.push([ie(3.3,.06,.06),i,0,.35,0]),h.push([ie(.2,2.1,.2),n,-1.75,1.05,0]),h.push([ie(.2,2.1,.2),n,1.75,1.05,0]),t.push({parts:Ne(h),density:.2,scale:[1,1],clear:7})}else if(s==="forest"){let e=pt("#2e2219",{flat:!0,rough:1}),n=pt("#1f4a44",{flat:!0,rough:.9}),i=pt("#2c5f50",{flat:!0,rough:.9}),r=pt("#3a6a48",{flat:!0}),a=pt("#6a7478",{flat:!0,rough:.9}),o=pt("#7fe8ff",{emi:"#3ad0ff",ei:1.3}),l=pt("#cfd8d0"),h=[[Me(.22,.42,3.4,8),e,0,1.7,0]];for(let p=0;p<4;p++){let d=p/4*di+.4;h.push([de(.16,.05,1,5),e,Math.cos(d)*.3,.45,Math.sin(d)*.3,Math.sin(d)*1.1,0,-Math.cos(d)*1.1])}h.push([be(1,1,3,.25),n,0,3.8,0,0,0,0,1,.75,1]),h.push([be(.7,1,4,.25),i,.7,3.3,.4]),h.push([be(.6,1,5,.25),n,-.6,3.4,-.4]),t.push({parts:Ne(h),density:.5,scale:[.8,1.3],clear:8}),t.push({parts:Ne([[be(.6,1,7,.2),a,0,.3,0,0,0,0,1.3,.7,1],[be(.45,0,8),r,.1,.62,0,0,0,0,1.2,.35,1]]),density:.9,scale:[.6,1.6]});let u=[];for(let p=0;p<4;p++){let d=p%2*.35-.17,m=Math.floor(p/2)*.3-.15,_=.25+p*.08;u.push([Me(.04,.05,_,6),l,d,_/2,m]),u.push([new Pn(.16-p*.015,10,6,0,di,0,Math.PI/2),o,d,_,m])}t.push({parts:Ne(u),density:.6,scale:[.8,1.4],emit:[{kind:"glow",y:.4,size:1.3,color:"#3ad0ff"}]});let f=[];for(let p=0;p<7;p++){let d=p/7*di;f.push([Te(.12,.9,4),i,Math.cos(d)*.25,.3,Math.sin(d)*.25,Math.sin(d)*1,0,-Math.cos(d)*1,1,1,.3])}t.push({parts:Ne(f),density:1.6,scale:[.6,1.3]}),t.push({parts:Ne([[Me(.45,.55,.6,9),e,0,.3,0],[Me(.42,.42,.02,9),pt("#8a6a48"),0,.61,0]]),density:.2,scale:[.8,1.2]})}else if(s==="crypt"){let e=pt("#4a5060",{flat:!0,rough:.95}),n=pt("#353a46",{flat:!0,rough:.95}),i=pt("#1e2026",{metal:.7,rough:.5}),r=pt("#cfc6ae"),a=pt("#e8dcc0",{rough:.6}),o=[[ie(.8,1,.18),e,0,.5,0],[Me(.4,.4,.18,12),e,0,1,0,Math.PI/2],[ie(1,.15,.4),n,0,.07,0]];t.push({parts:Ne(o),density:1.2,scale:[.8,1.2],tilt:.15,clear:4}),t.push({parts:Ne([[ie(1.1,.7,2.3),n,0,.35,0],[ie(1.2,.15,2.4),e,0,.77,0],[ie(.5,.1,1.2),e,0,.88,.2]]),density:.3,scale:[.9,1.1],clear:6}),t.push({parts:Ne([[ie(.9,.3,.9),n,0,.15,0],[ie(.6,3.6,.6),e,0,1.9,0],[ie(.95,.3,.95),n,0,3.75,0]]),density:.35,scale:[.8,1.1],clear:7});let l=[];[[0,0,.5],[.18,.1,.35],[-.15,.12,.28],[.05,-.18,.22]].forEach(([f,p,d])=>l.push([Me(.05,.06,d,6),a,f,d/2,p])),t.push({parts:Ne(l),density:.5,scale:[1,1],emit:[{kind:"flame",y:.6,size:.55,color:"#ffb060"}]});let h=[[qt(.14,8,6),r,0,.12,0]];for(let f=0;f<5;f++)h.push([Me(.03,.03,.5,4),r,Math.cos(f)*.25,.05,Math.sin(f*2)*.25,Math.PI/2,f,0]);t.push({parts:Ne(h),density:1,scale:[.8,1.3]});let u=[];for(let f=0;f<6;f++)u.push([Me(.035,.035,1.8,5),i,-1.5+f*.6,.9,0]),u.push([Te(.06,.18,4),i,-1.5+f*.6,1.88,0]);u.push([ie(3.3,.06,.06),i,0,1.55,0]),u.push([ie(3.3,.06,.06),i,0,.35,0]),t.push({parts:Ne(u),density:.3,scale:[1,1],clear:7})}else{let e=pt("#1e1428",{flat:!0,rough:.8}),n=pt("#2b1d38",{flat:!0,rough:.8}),i=pt("#b46cff",{emi:"#9a4cff",ei:1.4,rough:.2}),r=pt("#c78bff",{emi:"#c78bff",ei:4}),a=[];for(let o=0;o<6;o++){let l=o/6*di,h=.8+o%3*.5,u=new gn(.2,0);a.push([u,i,Math.cos(l)*.25,h*.5,Math.sin(l)*.25,Math.sin(l)*.4,0,-Math.cos(l)*.4,1,h*2.2,1])}a.push([be(.45,0,4),e,0,.1,0,0,0,0,1.2,.4,1.2]),t.push({parts:Ne(a),density:.7,scale:[.6,1.5],emit:[{kind:"glow",y:.9,size:1.8,color:"#a050ff"}]}),t.push({parts:Ne([[Te(.7,3.5,6),e,0,1.75,0],[Te(.4,2.2,5),n,.6,1.1,.3,0,0,-.2]]),density:.45,scale:[.6,1.3],clear:6}),t.push({parts:Ne([[ie(.8,4.2,.8),n,0,2.1,0],[ie(.1,3.2,.82),r,0,2.2,0],[ie(.82,.1,.82),r,0,3.6,0],[Te(.57,.8,4),e,0,4.6,0,0,Math.PI/4]]),density:.15,scale:[.9,1.1],clear:8,emit:[{kind:"glow",y:2.5,size:4,color:"#c78bff"}]}),t.push({parts:Ne([[be(.55,0,9,.3),e,0,0,0],[be(.3,0,10,.3),n,.7,.4,.2]]),density:.6,scale:[.5,1.3],float:!0}),t.push({parts:Ne([[be(.5,0,15),e,0,.2,0],[be(.3,0,16),n,.5,.12,.3]]),density:1,scale:[.6,1.4]})}return t}var n_={ruins:{fogTint:"#6a6080",sky:"#7d7aa0",gnd:"#1a1520",hemi:.75,dir:"#b8c4ff",dirI:1.7,fog:"#0c0a12",near:30,far:72,bump:.9,motes:{color:"#ffb070",cell:"DOT",rise:.6,size:.12}},forest:{fogTint:"#5aa090",sky:"#8ad0c8",gnd:"#10201e",hemi:1,dir:"#d8f0ff",dirI:1.9,fog:"#0b1a1a",near:32,far:76,bump:.6,motes:{color:"#b0ffe0",cell:"GLOW",rise:.15,size:.25}},crypt:{fogTint:"#5a6a90",sky:"#7080b0",gnd:"#141824",hemi:.85,dir:"#a8bce8",dirI:1.6,fog:"#06080d",near:26,far:64,bump:1,motes:{color:"#9ab8ff",cell:"DOT",rise:-.1,size:.1}},abyss:{fogTint:"#8050b0",sky:"#9a6ac0",gnd:"#120818",hemi:.65,dir:"#d0a8ff",dirI:1.2,fog:"#10061a",near:28,far:70,bump:.8,motes:{color:"#d68bff",cell:"GLOW",rise:.4,size:.22}}};function Ed(s,t){let e=n_[t],n=new Kt;s.add(n),s.background=new Xt(e.fog),s.fog=new or(e.fog,e.near,e.far);let i=gd(t),r=180,a=r/Zc;for(let E of[i.map,i.bump,i.emissive])E&&E.repeat.set(a,a);let o=new Zi({map:i.map,bumpMap:i.bump,bumpScale:e.bump*3,roughness:.92,metalness:0,emissive:i.emissive?new Xt("#ffffff"):new Xt(0),emissiveMap:i.emissive,emissiveIntensity:t==="abyss"?.55:.6}),l=new ht(new Cn(r,r),o);l.rotation.x=-Math.PI/2,l.receiveShadow=!0,n.add(l);let h=new Pr(e.sky,e.gnd,e.hemi);n.add(h);let u=new Ls(e.dir,e.dirI);u.castShadow=!0,u.shadow.mapSize.set(2048,2048);let f=u.shadow.camera;f.left=-30,f.right=30,f.top=30,f.bottom=-30,f.near=1,f.far=90,u.shadow.bias=-8e-4,u.shadow.normalBias=.03,n.add(u),n.add(u.target);let p=new Ls(e.sky,1.4);n.add(p),n.add(p.target);let d=e_(t).map(E=>{let U=Math.ceil((2*ia+1)**2*(E.density+1)*1.6),I=E.parts.map(({geo:O,mat:B})=>{let H=new wi(O,B,U);return H.castShadow=!0,H.receiveShadow=!0,H.count=0,H.frustumCulled=!1,n.add(H),H});return{...E,meshes:I,cap:U}}),m=[],_=[],c=1e9,g=1e9,y=new fe,w=new Je,S=new rn,C=new k,R=new k;function M(E,U){m.length=0,_.length=0;for(let I of d)I.n=0;for(let I=E-ia;I<=E+ia;I++)for(let O=U-ia;O<=U+ia;O++){let B=ui(I*73856093^O*19349663^t.length*83492791);if(B()<.45&&(I||O)){let H={ruins:"#b48cff",forest:"#60ffd0",crypt:"#7fb0ff",abyss:"#d070ff"}[t];m.push({x:(I+B())*Ws,y:0,z:(O+B())*Ws,kind:"rune",size:3+B()*3,color:H,ph:B()*di})}d.forEach((H,F)=>{let q=Math.floor(H.density+B());for(;q-- >0&&!(H.n>=H.cap);){let Y=(I+B())*Ws,X=(O+B())*Ws;if(H.clear&&Y*Y+X*X<H.clear*H.clear){B();continue}let $=H.scale[0]+B()*(H.scale[1]-H.scale[0]),W=B()*di,j=(H.tilt||0)*(B()-.5)*2,nt=H.float?1.2+B()*2.2:0;S.set(j,W,j*.5),w.setFromEuler(S),C.set(Y,nt,X),R.set($,$,$),y.compose(C,w,R);for(let vt of H.meshes)vt.setMatrixAt(H.n,y);if(H.float&&_.push({t:H,idx:H.n,x:Y,y:nt,z:X,q:w.clone(),s:$,ph:B()*di}),H.emit)for(let vt of H.emit)m.push({x:Y,y:nt+vt.y*$,z:X,kind:vt.kind,size:vt.size*$,color:vt.color,ph:B()*di});H.n++}})}for(let I of d)for(let O of I.meshes)O.count=I.n,O.instanceMatrix.needsUpdate=!0}return{group:n,mood:e,emitters:m,sun:u,update(E,U,I){l.position.set(E,0,U);for(let H of[i.map,i.bump,i.emissive])H&&H.offset.set(E/Zc,-U/Zc);u.position.set(E+14,34,U+10),u.target.position.set(E,0,U),p.position.set(E-8,10,U-22),p.target.position.set(E,1,U);let O=Math.floor(E/Ws),B=Math.floor(U/Ws);if((O!==c||B!==g)&&(c=O,g=B,M(O,B)),_.length){let H=new Set;for(let F of _){C.set(F.x,F.y+Math.sin(I*.8+F.ph)*.35,F.z),R.set(F.s,F.s,F.s),y.compose(C,F.q,R);for(let q of F.t.meshes)q.setMatrixAt(F.idx,y);H.add(F.t)}for(let F of H)for(let q of F.meshes)q.instanceMatrix.needsUpdate=!0}},setShadows(E){for(let U of d)for(let I of U.meshes)I.castShadow=E},dispose(){s.remove(n),l.geometry.dispose(),o.dispose();for(let E of[i.map,i.bump,i.emissive])E&&E.dispose();for(let E of d)for(let U of E.meshes)U.dispose()}}}var xt=1/20,Ue=Math.PI*2,Zt=(s,t)=>s+Math.random()*(t-s),$c=new k(0,18.5,11.5),Ad=420,ml=class{constructor(t){this.canvas=t;let e=this.gl=new il({canvas:t,antialias:!1,powerPreference:"high-performance",stencil:!1});e.toneMapping=ji,e.toneMappingExposure=1,e.shadowMap.enabled=!0,e.shadowMap.type=Ji,this.scene=new lr,this.camera=new sn(40,1,.5,200),this.composer=new ll(e),this.composer.addPass(new cl(this.scene,this.camera)),this.bloom=new Hs(new ft(512,512),.5,.38,.9),this.composer.addPass(this.bloom),this.composer.addPass(new hl),this.touch="ontouchstart"in window&&Math.min(screen.width,screen.height)<900,this.quality=2,this.fpsAcc=0,this.fpsN=0,this.fpsT=0;let n=md();this.add=new is(14e3,n,{additive:!0,renderOrder:20}),this.norm=new is(3e3,n,{additive:!1,renderOrder:15}),this.gAdd=new is(2500,n,{additive:!0,ground:!0,renderOrder:5}),this.gNorm=new is(1500,n,{additive:!1,ground:!0,renderOrder:4});for(let r of[this.add,this.norm,this.gAdd,this.gNorm])this.scene.add(r.mesh);this.playerLight=new Is("#b88cff",30,16,2),this.scene.add(this.playerLight),this.lights=[];for(let r=0;r<6;r++){let a=new Is("#ffffff",0,14,2);this.scene.add(a),this.lights.push(a)}this.lightCand=[],this.hero=Td(),this.scene.add(this.hero.root),this.heroYaw=0;let i=(r,a,o)=>{let l=new wi(r,a,o);return l.count=0,l.frustumCulled=!1,this.scene.add(l),l};this.shardIM=i(Vs.shard(),pt("#bff8ff",{emi:"#5ae0ff",ei:3,rough:.1}),500),this.bladeIM=i(Vs.crescent(),pt("#ff2040",{emi:"#ff1030",ei:3,rough:.3,metal:.4}),24),this.gemIM=[i(Vs.gem(),pt("#7ab8ff",{emi:"#3a8aff",ei:3,rough:.2}),600),i(Vs.gem(),pt("#7dffb8",{emi:"#30ff90",ei:3,rough:.2}),300),i(Vs.gem(),pt("#ff9bff",{emi:"#ff50ff",ei:3.5,rough:.2}),200)],this.pickMeshes=new Map,this.holeMeshes=new Map,this.enemyTypes=new Map,this.fxp=[],this.motes=[],this.world=null,this.worldKind=null,this.boss=null,this.bossObj=null,this.bossDie=0,this.camPos=new k,this.camTarget=new k,this.time=0,this.m4=new fe,this.m4b=new fe,this.q=new Je,this.e=new rn,this.v=new k,this.s=new k,this.col=new Xt,this.st={ph:0,t:0,atk:0,seed:0,mv:1},this.footprint={W:1280,H:760},this.applyQuality(),this.resize()}reset(){this.fxp.length=0,this.bossObj&&this.scene.remove(this.bossObj.root),this.bossObj=null,this.boss=null;for(let t of this.pickMeshes.values())this.scene.remove(t);for(let t of this.holeMeshes.values())this.scene.remove(t);if(this.pickMeshes.clear(),this.holeMeshes.clear(),this.propMeshes){for(let t of this.propMeshes.values())this.scene.remove(t);this.propMeshes.clear()}this.fog=[]}applyQuality(){let t=this.quality,e=window.devicePixelRatio||1;this.gl.setPixelRatio(t===2?Math.min(e,1.5):t===1?Math.min(e,1):.75),this.gl.shadowMap.enabled=t>0,this.enemyShadows=t===2&&!this.touch;for(let n of this.enemyTypes.values())for(let i of n.meshes)i.im.castShadow=this.enemyShadows;this.world&&this.world.setShadows(t>0),this.world&&this.world.sun.shadow.mapSize.set(t===2?2048:1024,t===2?2048:1024),this.resize()}resize(){let t=window.innerWidth,e=window.innerHeight;this.W=t,this.H=e,this.gl.setSize(t,e,!1),this.canvas.style.width=t+"px",this.canvas.style.height=e+"px",this.composer.setPixelRatio(this.gl.getPixelRatio()),this.composer.setSize(t,e),this.bloom.resolution.set(t/2,e/2),this.camera.aspect=t/e;let n=Math.max(1,1.1/(t/e));this.camK=Math.min(1.42,n),this.camera.updateProjectionMatrix()}setWorld(t){this.worldKind!==t&&(this.world&&this.world.dispose(),this.world=Ed(this.scene,t),this.worldKind=t,this.world.setShadows(this.quality>0),this.motes.length=0)}computeFootprint(t,e){let n=new Ur,i=[];for(let[o,l]of[[-1,-1],[1,-1],[-1,1],[1,1]]){n.setFromCamera(new ft(o,l),this.camera);let h=n.ray.direction,u=n.ray.origin,f=h.y<-.001?-u.y/h.y:80;i.push([u.x+h.x*f,u.z+h.z*f])}let r=0,a=0;for(let[o,l]of i)r=Math.max(r,Math.abs(o-t)),a=Math.max(a,Math.abs(l-e));return this.footprint.W=Math.min(r*2,110)/xt,this.footprint.H=Math.min(a*2,90)/xt,this.footprint}project(t,e,n,i){return this.v.set(t,e,n).project(this.camera),i.x=(this.v.x*.5+.5)*this.W,i.y=(-this.v.y*.5+.5)*this.H,i.vis=this.v.z<1,i}light(t,e,n,i,r){this.lightCand.push({x:t,y:e,z:n,color:i,intensity:r})}emit(t,e,n,i,r,a,o,l,h,u=dt.GLOW,f={}){this.fxp.length>2500||this.fxp.push({x:t,y:e,z:n,vx:i,vy:r,vz:a,life:o,max:o,size:l,c:_n(h),cell:u,grav:f.grav||0,add:f.add!==!1,grow:f.grow||0,rot:f.rot??Math.random()*Ue,spin:f.spin||0,a:f.a??1})}burst(t,e,n,i,r,a=4,o=.25,l=.6){for(let h=0;h<r;h++){let u=Math.random()*Ue,f=Math.random()*.8+.2,p=a*Math.random();this.emit(t,e,n,Math.cos(u)*p,f*a*.8,Math.sin(u)*p,l*Zt(.5,1),o*Zt(.6,1.3),i,dt.DOT,{grav:9})}}enemyType(t){let e=this.enemyTypes.get(t);if(e)return e;let n=bd(t),i=n.parts.map(r=>{let a=new wi(r.geo,r.mat,Ad);return a.count=0,a.frustumCulled=!1,a.castShadow=this.enemyShadows,a.receiveShadow=!1,a.setColorAt(0,new Xt(1,1,1)),this.scene.add(a),{im:a,p:r}});return e={model:n,meshes:i,n:0},this.enemyTypes.set(t,e),e}drawEnemy(t,e,n){let i=this.enemyType(t.type);if(i.n>=Ad)return;let r=i.n++,a=t.x*xt,o=t.y*xt;t._lx===void 0&&(t._lx=t.x,t._ly=t.y,t._ph=Math.random()*Ue,t._yaw=0);let l=Math.hypot(t.x-t._lx,t.y-t._ly);t._lx=t.x,t._ly=t.y,!n&&!(t.frozen>0)&&(t._ph+=l*.16);let h=this.run.p.x,u=this.run.p.y,p=Math.atan2(h-t.x,u-t.y)-t._yaw;for(;p>Math.PI;)p-=Ue;for(;p<-Math.PI;)p+=Ue;t._yaw+=p*Math.min(1,e*8),t.atk=Math.max(0,(t.atk||0)-e);let d=this.st;d.ph=t._ph,d.t=this.time,d.seed=t.seed||0,d.atk=t.atk>0?Math.sin(t.atk/.35*Math.PI):0,d.mv=t.frozen>0?0:Math.min(1,l*2+.2),t.frozen>0?d.t=t._ft||(t._ft=this.time):t._ft=0;let m=t.elite?1.6:t.champion?1.3:1;t.st==="wind"&&t.bh==="bomb"&&(m*=1+(.65-t.stT)*.7+Math.sin(this.time*40)*.05);let _=i.model.float?.25+Math.sin(this.time*2+(t.seed||0))*.12:0,c=0;if(n){let C=n.t/.45;m*=1-C*.7,_-=C*.6,c=C*1.2}this.e.set(c,t._yaw,0),this.q.setFromEuler(this.e),this.v.set(a,_,o),this.s.set(m,m,m);let g=this.m4.compose(this.v,this.q,this.s),y=this.col;if(n)y.setRGB(.35,.12,.45);else if(t.flash>0)y.setRGB(7,7,7);else if(t.frozen>0)y.setRGB(.7,1.4,2);else if(t.burnT>0)y.setRGB(1.7,.8+Math.sin(this.time*20)*.15,.45);else if(t.st==="wind"&&t.bh==="bomb"){let C=Math.sin(this.time*30)>0?3:1.2;y.setRGB(C,C*.6,C*1.2)}else t.st==="wind"?y.setRGB(1.8,.9,.8):t.elite?y.setRGB(1.35,1.1,.7):t.champion?y.setRGB(1.5,.95,.55):t.slowT>0?y.setRGB(.85,1.1,1.4):y.setRGB(1,1,1);for(let{im:C,p:R}of i.meshes){let M=Sd(R.ch,R.k,d);this.e.set(M.rx,M.ry,M.rz),this.q.setFromEuler(this.e),this.v.set(R.pv[0],R.pv[1]+M.dy,R.pv[2]),this.s.set(M.s,M.s,M.s),this.m4b.compose(this.v,this.q,this.s).premultiply(g),C.setMatrixAt(r,this.m4b),C.setColorAt(r,y)}let w=(t.r||12)*xt;if(this.enemyShadows||this.gNorm.add(a,.02,o,w*2.6,w*2.6,1,1,1,.75,0,dt.SHADOW),n)return;let S=i.model.h*m;if(t.elite&&(this.gAdd.add(a,.04,o,w*3.2,w*3.2,1.6,1.15,.4,.8,this.time*1.5,dt.RUNE),this.add.add(a,S*.5,o,S*1.4,S*1.4,1,.75,.25,.25,0,dt.GLOW)),t.burnT>0&&Math.random()<.5&&this.emit(a+Zt(-w,w)*.6,S*Zt(.3,.9),o+Zt(-w,w)*.6,0,1.6,0,.45,w*1.2,"#ff7a2a",dt.FLAME,{grow:-.5}),t.frozen>0&&this.add.add(a,S*.5,o,S*1.1,S*1.1,.4,.9,1.3,.35,0,dt.STAR),t.champion&&this.gAdd.add(a,.04,o,w*3,w*3,1.6,.7,.2,.55,-this.time,dt.RING),t.st==="wind"&&t.bh==="lunge"){let C=200*xt,R=t.ta;this.gAdd.add(a+Math.cos(R)*C/2,.06,o+Math.sin(R)*C/2,C,w*1.8,2,.25,.2,.7,R,dt.STREAK)}t.st==="dash"&&Math.random()<.6&&this.emit(a,.3,o,Zt(-.5,.5),.4,Zt(-.5,.5),.5,.6,"#2a2030",dt.SMOKE,{add:!1,grow:1.2,a:.4}),t.atk>0&&t.ranged&&this.add.add(a,S*.75,o+.3,1.2,1.2,..._n(t.ranged.color),1.2*(t.atk/.35),0,dt.GLOW)}updateBoss(t,e){let n=t.boss;if(n&&this.boss!==n&&(this.bossObj&&this.scene.remove(this.bossObj.root),this.boss=n,this.bossObj=wd(n.bossId),this.scene.add(this.bossObj.root),this.bossDie=0,n._ph=0,n._lx=n.x,n._ly=n.y,n._yaw=0,this.burst(n.x*xt,1,n.y*xt,"#b46cff",60,8,.4,1)),!this.bossObj)return;let i=this.bossObj,r=this.boss;if(!n){this.bossDie+=e;let _=this.bossDie/2.2;i.root.scale.setScalar(Math.max(.01,1-_)),i.root.position.y=-_*2,i.root.rotation.z=Math.sin(this.time*30)*.05*(1-_),Math.random()<.8&&this.emit(r.x*xt+Zt(-2,2),Zt(.5,4),r.y*xt+Zt(-2,2),0,3,0,1,Zt(.6,1.4),"#d8b0ff",dt.STAR,{spin:3}),this.light(r.x*xt,3,r.y*xt,"#d0a0ff",120*(1-_)),_>=1&&(this.scene.remove(i.root),this.bossObj=null,this.boss=null);return}let a=n.x*xt,o=n.y*xt,l=Math.hypot(n.x-n._lx,n.y-n._ly);n._lx=n.x,n._ly=n.y,n._ph+=Math.min(l,30)*.06;let u=(n.ai.mode==="windup"||n.ai.mode==="charge"?Math.atan2(Math.cos(n.ai.dir),Math.sin(n.ai.dir)):Math.atan2(t.p.x-n.x,t.p.y-n.y))-n._yaw;for(;u>Math.PI;)u-=Ue;for(;u<-Math.PI;)u+=Ue;n._yaw+=u*Math.min(1,e*5),n.atk=Math.max(0,(n.atk||0)-e);let f=this.st;f.ph=n._ph,f.t=this.time,f.atk=n.atk>0?Math.sin(n.atk/.4*Math.PI):0,i.root.position.set(a,0,o),i.root.rotation.y=n._yaw;let p=n.flash>0?1.04:1;i.root.scale.setScalar(n.frozen>0?1:p),i.update(this.time,n,e,f);let d=n.r*xt;this.gAdd.add(a,.05,o,d*4,d*4,.7,.2,1,.4,-this.time*.5,dt.SIGIL),this.gNorm.add(a,.03,o,d*3.5,d*3.5,1,1,1,.9,0,dt.SHADOW),n.flash>0&&this.add.add(a,i.h*.5,o,i.h*1.4,i.h*1.4,1.5,1.2,1.8,.35,0,dt.GLOW);let m={fallen_knight:"#a070ff",devourer:"#b46cff",soulless_king:"#9ad0ff",abyss_lord:"#7fc0ff"}[n.bossId];if(this.light(a,1,o+3.2,m,22+f.atk*40),n.ai.mode==="windup"){let _=n.ai.dir,c=380*xt;this.gAdd.add(a+Math.cos(_)*c/2,.06,o+Math.sin(_)*c/2,c,d*1.6,2.2,.2,.25,.75,_,dt.STREAK),this.light(a,1,o,"#ff3040",80)}if(n.ai.mode==="charge"&&Math.random()<.9&&this.emit(a+Zt(-d,d),Zt(.2,2),o+Zt(-d,d),0,.5,0,.6,1.2,"#4a2060",dt.SMOKE,{add:!1,grow:1.5,a:.6}),n.bossId==="devourer"||n.bossId==="abyss_lord"&&n.ai.phase>=2){let _=(n.bossId==="devourer"?560:520)*xt;this.gAdd.add(a,.05,o,_*2,_*2,.35,.15,.55,.35,this.time*.3,dt.RING);for(let c=0;c<2;c++){let g=Math.random()*Ue,y=_*Zt(.6,1);this.emit(a+Math.cos(g)*y,Zt(.2,1.5),o+Math.sin(g)*y,-Math.cos(g)*y*.9,0,-Math.sin(g)*y*.9,1,.25,"#c890ff",dt.DOT)}}}render(t,e,n){this.time+=e,this.run=t;let i=this.time;for(let l of[this.add,this.norm,this.gAdd,this.gNorm])l.begin();this.lightCand.length=0;for(let l of this.enemyTypes.values())l.n=0;let r=0,a=0;t?(this.setWorld(t.ch.decor),r=t.p.x*xt,a=t.p.y*xt):this.setWorld(n||"ruins"),this.world.update(r,a,i);let o=this.camK||1;if(t){this.camTarget.set(r,.8,a);let l=(t.shake||0)*.025,h=this.zoom||1;this.camera.position.set(r+$c.x*o*h+Zt(-l,l),$c.y*o*h+Zt(-l,l),a+$c.z*o*h),this.camera.lookAt(this.camTarget)}else{let l=i*.08;this.camera.position.set(Math.sin(l)*9,5.5,Math.cos(l)*9),this.camera.lookAt(0,1.6,0)}this.camera.updateMatrixWorld(),this.drawHero(t,e),t?this.drawRun(t,e):this.drawMenu(e),this.drawEmitters(r,a),this.drawMotes(r,a,e),this.drawFx(e);for(let l of this.enemyTypes.values())for(let{im:h}of l.meshes)h.count=l.n,l.n&&(h.instanceMatrix.needsUpdate=!0,h.instanceColor.needsUpdate=!0);for(let l of[this.add,this.norm,this.gAdd,this.gNorm])l.end();this.assignLights(r,a),this.composer.render(e),this.adapt(e,!!t)}adapt(t,e){if(e&&(this.fpsT+=t,this.fpsN++,this.fpsT>=3)){let n=this.fpsN/this.fpsT;this.fpsT=0,this.fpsN=0,n<40&&this.quality>0&&(this.quality--,this.applyQuality())}}assignLights(t,e){let n=this.lightCand;for(let i of n){let r=(i.x-t)**2+(i.z-e)**2;i.score=i.intensity/(1+r*.01)}n.sort((i,r)=>r.score-i.score);for(let i=0;i<this.lights.length;i++){let r=this.lights[i],a=n[i];a?(r.position.set(a.x,a.y,a.z),r.color.set(a.color),r.intensity=a.intensity):r.intensity=0}}drawHero(t,e){let n=this.hero,i=t?t.p:{moving:!1,castT:0,heart:0,x:0,y:0},r=i.x*xt,a=i.y*xt;n.root.position.set(r,0,a);let o=this.heroYaw;t&&i.moving?o=Math.atan2(Math.cos(i.moveA),Math.sin(i.moveA)):t&&i.castT>0&&i.castA!==void 0?o=Math.atan2(Math.cos(i.castA),Math.sin(i.castA)):t||(o=0);let l=o-this.heroYaw;for(;l>Math.PI;)l-=Ue;for(;l<-Math.PI;)l+=Ue;this.heroYaw+=l*Math.min(1,e*12),n.root.rotation.y=this.heroYaw,n.update(this.time,i,e),n.root.visible=!(t&&i.invuln>0&&i.invuln<5&&Math.floor(this.time*20)%2);let h=Save.data.corruption/100,u=h>.5?"#c060ff":h>.2?"#9a80ff":"#80a8ff";this.playerLight.position.set(r,3.2,a+1.2),this.playerLight.color.set(u),this.playerLight.intensity=16+(i.castT||0)*50,t&&(this.gAdd.add(r,.035,a,1.7,1.7,1.6,1.25,.55,.55,0,dt.RING),t.buffT>0&&(this.gAdd.add(r,.04,a,3,3,2,.5,2,.6,this.time*2,dt.SIGIL),this.add.add(r,1.2,a,3,3,1.2,.4,1.4,.25,0,dt.GLOW)));let f=_n(u),p=Math.min(1,(i.castT||0)/.2);this.gAdd.add(r,.03,a,2.6,2.6,f[0]*1.4,f[1]*1.4,f[2]*1.4,.18+p*.55,this.time*.7,dt.RUNE),i.heart>=100&&this.gAdd.add(r,.04,a,3.6,3.6,1.6,.6,2.2,.45+Math.sin(this.time*6)*.2,-this.time,dt.SIGIL);let d=new k;n.crystal.getWorldPosition(d),this.add.add(d.x,d.y,d.z,.7+p*.5,.7+p*.5,1,.45,1.5,.45,0,dt.GLOW),i.heart>=100&&this.add.add(d.x,d.y,d.z,1.2,1.2,1.2,.5,1.6,.45,this.time,dt.STAR);let m=new k;n.orb.getWorldPosition(m),this.add.add(m.x,m.y,m.z,.45+p*.6,.45+p*.6,1,.45,1.6,.5,0,dt.GLOW),t&&Math.random()<.3&&this.emit(m.x,m.y,m.z,Zt(-.3,.3),.8,Zt(-.3,.3),.6,.12,"#d0a0ff",dt.DOT)}drawMenu(){this.light(0,1.2,1.5,"#9a60ff",40);for(let t=0;t<2;t++){let e=Math.random()*Ue,n=Zt(1,2.6);this.emit(Math.cos(e)*n,.1,Math.sin(e)*n,0,Zt(.5,1.5),0,1.6,Zt(.08,.18),"#c890ff",dt.DOT)}this.gAdd.add(0,.03,0,6,6,1,.45,1.6,.6,this.time*.25,dt.SIGIL),this.gAdd.add(0,.04,0,3.4,3.4,1.2,.6,1.8,.5,-this.time*.4,dt.RUNE)}drawEmitters(t,e){for(let n of this.world.emitters){if((n.x-t)**2+(n.z-e)**2>1600)continue;let i=_n(n.color),r=.8+Math.sin(this.time*9+n.ph)*.12+Math.sin(this.time*23+n.ph)*.08;if(n.kind==="rune"){let a=.35+Math.sin(this.time*1.5+n.ph)*.25;this.gAdd.add(n.x,.03,n.z,n.size,n.size,i[0]*1.5,i[1]*1.5,i[2]*1.5,a,n.ph+this.time*.1,dt.RUNE);continue}n.kind==="flame"?(this.add.add(n.x,n.y+n.size*.25,n.z,n.size*.7*r,n.size*1.1*r,i[0]*1.6,i[1]*1.2,i[2]*.8,.8,Math.sin(this.time*3+n.ph)*.1,dt.FLAME),this.add.add(n.x,n.y,n.z,n.size*2.2,n.size*2.2,i[0],i[1]*.7,i[2]*.5,.18,0,dt.GLOW),Math.random()<.08&&this.emit(n.x,n.y+.4,n.z,Zt(-.2,.2),1.5,Zt(-.2,.2),1.2,.08,"#ffb060",dt.DOT),this.light(n.x,n.y+.8,n.z,n.color,7*r*n.size)):(this.add.add(n.x,n.y,n.z,n.size*.55*r,n.size*.55*r,i[0],i[1],i[2],.3,0,dt.GLOW),this.light(n.x,n.y+.6,n.z,n.color,3*n.size))}}drawMotes(t,e,n){let i=this.world.mood.motes;for(;this.motes.length<70;)this.motes.push({x:t+Zt(-22,22),y:Zt(.2,5),z:e+Zt(-16,16),ph:Math.random()*Ue,sp:Zt(.5,1.2)});let r=_n(i.color),a=dt[i.cell];for(let o of this.motes){o.y+=i.rise*o.sp*n,o.x+=Math.sin(this.time*.5+o.ph)*.3*n,o.y>6&&(o.y=.2),o.y<.1&&(o.y=5),o.x<t-24&&(o.x+=48),o.x>t+24&&(o.x-=48),o.z<e-18&&(o.z+=36),o.z>e+18&&(o.z-=36);let l=.4+Math.sin(this.time*2+o.ph)*.3;this.add.add(o.x,o.y,o.z,i.size,i.size,r[0],r[1],r[2],l,0,a)}}drawFx(t){let e=this.fxp,n=0;for(let i=0;i<e.length;i++){let r=e[i];if(r.life-=t,r.life<=0)continue;r.vy-=r.grav*t,r.x+=r.vx*t,r.y+=r.vy*t,r.z+=r.vz*t,r.y<.05&&r.grav&&(r.y=.05,r.vy*=-.3,r.vx*=.6,r.vz*=.6),r.vx*=.97,r.vz*=.97,r.size=Math.max(.01,r.size+r.grow*t),r.rot+=r.spin*t;let a=r.life/r.max;(r.add?this.add:this.norm).add(r.x,r.y,r.z,r.size,r.size,r.c[0]*1.3,r.c[1]*1.3,r.c[2]*1.3,r.a*Math.min(1,a*2),r.rot,r.cell),e[n++]=r}e.length=n}drawRun(t,e){let n=this.time,i=this.add,r=this.gAdd;this.computeFootprint(t.p.x*xt,t.p.y*xt);for(let o of t.enemies)!o.dead&&!o.boss&&this.drawEnemy(o,e,null);t.dying=t.dying.filter(o=>{if(o.e.boss)return!1;if(o.t===0){let l=o.e.x*xt,h=o.e.y*xt,u=o.e.color;this.burst(l,.8,h,u,o.e.elite?24:7,4,.22,.6),this.emit(l,.6,h,0,.6,0,.7,o.e.elite?3:1.4,"#20102a",dt.SMOKE,{add:!1,grow:1.2,a:.55}),this.emit(l,1,h,0,2.2,0,.8,.9,"#c8a0ff",dt.GLOW,{grow:-.6}),this.gAdd.add(l,.05,h,1.5,1.5,1,.5,1.4,.4,0,dt.SHOCK)}return o.t+=e,o.t>=.45?!1:(this.drawEnemy(o.e,e,o),!0)}),this.updateBoss(t,e);let a=[0,0,0];for(let o of t.gems){let l=o.val>=10?2:o.val>=3?1:0,h=this.gemIM[l],u=a[l]++;if(u>=h.instanceMatrix.count)continue;let f=[1,1.3,1.8][l];this.e.set(0,n*2.5+o.x,0),this.q.setFromEuler(this.e),this.v.set(o.x*xt,.35+Math.sin(n*3+o.x)*.08,o.y*xt),this.s.set(f,f*1.4,f),h.setMatrixAt(u,this.m4.compose(this.v,this.q,this.s));let p=[[.4,.7,1.6],[.4,1.6,.9],[1.6,.6,1.6]][l];i.add(o.x*xt,.35,o.y*xt,.7*f,.7*f,p[0],p[1],p[2],.35,0,dt.GLOW)}this.gemIM.forEach((o,l)=>{o.count=a[l],o.instanceMatrix.needsUpdate=!0}),this.drawPickups(t),this.drawProps(t,e),this.drawRifts(t,e),this.drawFog(t,e),this.drawSpells(t,e),this.drawEnemyShots(t);for(let o of t.parts){o._h===void 0&&(o._h=Zt(.3,1.4),o._vy=Zt(.5,3)),o._h+=o._vy*e,o._vy-=6*e,o._h<.05&&(o._h=.05,o._vy=0);let l=o.life/o.max,h=_n(o.color);i.add(o.x*xt,o._h,o.y*xt,o.size*xt*3.2,o.size*xt*3.2,h[0]*1.5,h[1]*1.5,h[2]*1.5,l,0,dt.DOT)}for(let o of t.hazards){if(o.done)continue;let l=o.t/o.delay,h=o.r*xt*2,u=_n(o.color);r.add(o.x*xt,.06,o.y*xt,h,h,u[0]*2,u[1]*2,u[2]*2,.45+l*.5,n*2,dt.RUNE),r.add(o.x*xt,.07,o.y*xt,h*l,h*l,u[0]*1.6,u[1]*1.6,u[2]*1.6,.45,0,dt.GLOW),r.add(o.x*xt,.065,o.y*xt,h*1.02,h*1.02,u[0]*2,u[1]*2,u[2]*2,.6,0,dt.RING)}}drawPickups(t){let e=this.time,n=new Set;for(let i of t.pickups){n.add(i);let r=this.pickMeshes.get(i);if(!r){if(i.kind==="fragment")r=new ht(new gn(.35),pt("#ffe08a",{emi:"#ffb030",ei:3,rough:.2,metal:.6}));else if(i.kind==="heal"){r=new Kt,r.add(new ht(new Pn(.28,12,10),pt("#ff3050",{emi:"#ff1030",ei:1.5,rough:.15})));let u=new ht(new ri(.08,.1,.25,8),pt("#d8c8b0"));u.position.y=.3,r.add(u)}else r=new ht(new ze(.3,.08,8,16,Math.PI*1.3),pt("#9ad0ff",{emi:"#4a90ff",ei:2.5,metal:.8}));this.scene.add(r),this.pickMeshes.set(i,r)}let a=i.x*xt,o=i.y*xt,l=.7+Math.sin(e*3+i.t)*.15;r.position.set(a,l,o),r.rotation.y=e*2;let h=i.kind==="fragment"?[2,1.5,.5]:i.kind==="heal"?[2,.4,.6]:[.6,1.2,2];this.add.add(a,l,o,1.6,1.6,...h,.5,0,dt.GLOW),this.gAdd.add(a,.05,o,1.8,1.8,...h,.6,e,dt.RUNE),i.kind==="fragment"&&(this.add.add(a,3,o,.6,6,2,1.6,.6,.35,0,dt.STREAK,0,1,0),this.light(a,1.5,o,"#ffc060",30))}for(let[i,r]of this.pickMeshes)n.has(i)||(this.scene.remove(r),this.pickMeshes.delete(i))}drawSpells(t,e){let n=this.time,i=this.add,r=this.gAdd,a=this.norm,o=t.p,l=0;for(let d of t.shots){let m=d.x*xt,_=d.y*xt,c=_n(d.color);d._tr||(d._tr=[]),d._tr.push(m,_),d._tr.length>16&&d._tr.splice(0,2);let g=d.vx*xt,y=d.vy*xt,w=.9;if(d.kind==="shard")l<500&&(this.e.set(0,Math.atan2(g,y),0),this.q.setFromEuler(this.e),this.v.set(m,w,_),this.s.set(d.r/5,d.r/5,d.r/5),this.shardIM.setMatrixAt(l++,this.m4.compose(this.v,this.q,this.s))),i.add(m,w,_,1.6,.35,c[0]*1.5,c[1]*1.5,c[2]*1.5,.7,0,dt.STREAK,g,0,y),Math.random()<.15&&this.emit(m,w,_,0,-.5,0,.5,.15,"#dffcff",dt.STAR,{spin:4});else if(d.kind==="orb"){let S=d.r*xt*3;i.add(m,w,_,S*2.2,S*2.2,c[0]*1.6,c[1]*1.2,c[2]*1.8,.9,0,dt.GLOW),a.add(m,w,_,S*.7,S*.7,.02,0,.05,.95,0,dt.DOT);for(let C=0;C<3;C++){let R=n*6+C*Ue/3;i.add(m+Math.cos(R)*S*.6,w+Math.sin(R*.7)*.2,_+Math.sin(R)*S*.6,.25,.25,1.6,.8,2.2,1,0,dt.DOT)}Math.random()<.5&&this.emit(m,w,_,Zt(-.5,.5),Zt(-.2,.5),Zt(-.5,.5),.6,.5,"#7a30d0",dt.SMOKE,{grow:.8,a:.6}),this.light(m,w,_,"#a060ff",20)}else{let S=d.star?.9:.75;i.add(m,w,_,S*1.3,S*1.3,c[0]*1.1,c[1]*1.1,c[2]*1.3,.5,0,dt.GLOW),i.add(m,w,_,S*.8,S*.8,1.6,1.6,1.8,.9,n*8,dt.STAR),i.add(m-g*.03,w,_-y*.03,1.8,.4,c[0]*1.6,c[1]*1.6,c[2]*2,.8,0,dt.STREAK,g,0,y);let C=d._tr;for(let R=0;R<C.length-2;R+=2){let M=R/C.length;i.add(C[R],w,C[R+1],.35*M+.08,.35*M+.08,c[0],c[1],c[2],M*.7,0,dt.DOT)}d.star&&this.light(m,w,_,d.color,6)}}this.shardIM.count=l,this.shardIM.instanceMatrix.needsUpdate=!0;let h=t.weapons.find(d=>d.id==="blood"),u=0;if(h&&h.blades){let d=(h.evo?1.5:1)*o.areaMul;for(let m of h.blades){let _=m.x*xt,c=m.y*xt;this.e.set(-Math.PI/2,0,n*14),this.q.setFromEuler(this.e),this.v.set(_,.9,c),this.s.set(d,d,d),this.bladeIM.setMatrixAt(u++,this.m4.compose(this.v,this.q,this.s)),i.add(_,.9,c,1.6*d,1.6*d,1.8,.15,.3,.55,0,dt.GLOW);let g=Math.hypot(m.x-o.x,m.y-o.y)*xt;for(let y=1;y<=10;y++){let w=m.a-y*.05;i.add(o.x*xt+Math.cos(w)*g,.9,o.y*xt+Math.sin(w)*g,(.55-y*.03)*d,(.55-y*.03)*d,1.8,.12,.3,.55-y*.05,0,dt.GLOW)}this.light(_,1,c,"#ff2040",6)}}this.bladeIM.count=u,this.bladeIM.instanceMatrix.needsUpdate=!0;let f=t.weapons.find(d=>d.id==="fire");if(f&&f.evo){let d=95*xt*o.areaMul;r.add(o.x*xt,.05,o.y*xt,d*2.2,d*2.2,1.8,.6,.15,.45+Math.sin(n*8)*.08,n,dt.SIGIL);for(let m=0;m<2;m++){let _=Math.random()*Ue,c=d*Zt(.4,1);this.emit(o.x*xt+Math.cos(_)*c,.2,o.y*xt+Math.sin(_)*c,0,2,0,.5,.7,"#ff7a20",dt.FLAME,{grow:-.8})}this.light(o.x*xt,1,o.y*xt,"#ff7020",30)}for(let d of t.rings){let m=1-d.r/d.max,_=d.r*xt,c=d.x*xt,g=d.y*xt,y=_n(d.color);r.add(c,.07,g,_*2.15,_*2.15,y[0]*2,y[1]*2,y[2]*2,m,0,dt.SHOCK),d.r<d.max*.3&&r.add(c,.06,g,d.max*xt*1.2,d.max*xt*1.2,y[0]*1.5,y[1]*1.5,y[2]*1.5,(1-d.r/(d.max*.3))*.8,n,dt.SIGIL);let w=Math.min(90,Math.max(16,_*6|0));for(let S=0;S<w;S++){let C=(S+S*7919%13/13)/w*Ue,R=_*(.92+S*31%7/50),M=c+Math.cos(C)*R,E=g+Math.sin(C)*R,U=.75+Math.sin(n*20+S*1.7)*.25;d.el==="fire"?(i.add(M,.35+U*.25,E,.55*U+.2,.95*U+.3,2,.75,.25,m*.85,Math.sin(S)*.3,dt.FLAME),S%3===0&&Math.random()<.3&&this.emit(M,.4,E,Math.cos(C)*.8,1.5,Math.sin(C)*.8,.5,.1,"#ffb050",dt.DOT)):i.add(M,.5,E,.6,.6,y[0]*2,y[1]*2,y[2]*2,m*.8,C,dt.STAR)}this.light(c,1,g,d.color,70*m)}for(let d of t.lines){let m=Math.min(1,d.life*8),_=_n(d.color),c,g,y,w=d.x2*xt,S=.8,C=d.y2*xt;d.wide?(c=w+Zt(-1,1),g=16,y=C):(c=d.x1*xt,g=1.1,y=d.y1*xt);let R=d.wide?9:6,M=c,E=g,U=y;for(let I=1;I<=R;I++){let O=I/R,B=I===R?0:d.wide?.6:.45,H=c+(w-c)*O+Zt(-B,B),F=g+(S-g)*O+Zt(-B,B)*.5,q=y+(C-y)*O+Zt(-B,B),Y=H-M,X=F-E,$=q-U,W=Math.hypot(Y,X,$),j=(H+M)/2,nt=(F+E)/2,vt=(q+U)/2;i.add(j,nt,vt,W*1.25,d.wide?.9:.55,_[0]*1.6,_[1]*1.6,_[2]*2.2,m,0,dt.STREAK,Y,X,$),i.add(j,nt,vt,W*1.1,d.wide?.25:.14,3,3,3,m,0,dt.STREAK,Y,X,$),M=H,E=F,U=q}i.add(w,S,C,1.6,1.6,_[0]*2,_[1]*2,_[2]*2,m,Math.random()*Ue,dt.STAR),d.wide&&r.add(w,.06,C,3,3,2,2,1.2,m,Math.random()*Ue,dt.CRACK),d._f||(d._f=1,this.burst(w,.8,C,"#fff6a0",4,5,.12,.35)),this.light(w,1.5,C,"#fff2a0",50*m)}for(let d of t.blasts){let m=d.life/d.max,_=d.r*xt,c=d.x*xt,g=d.y*xt,y=_n(d.color);if(!d._f){d._f=1,this.burst(c,.6,g,d.color,14,_*3,.25,.7);for(let w=0;w<5;w++)this.emit(c+Zt(-_,_)*.4,.5,g+Zt(-_,_)*.4,Zt(-1,1),.8,Zt(-1,1),.9,_*.8,"#1a0c24",dt.SMOKE,{add:!1,grow:_*.8,a:.5})}i.add(c,.8,g,_*2.4*(1.3-m*.3),_*2.4*(1.3-m*.3),y[0]*1.8,y[1]*1.8,y[2]*1.8,m*.9,0,dt.GLOW),r.add(c,.07,g,_*2.6*(1.2-m*.5),_*2.6*(1.2-m*.5),y[0]*2,y[1]*2,y[2]*2,m,0,dt.SHOCK),this.light(c,1.2,g,d.color,90*m)}let p=new Set;for(let d of t.holes){p.add(d);let m=this.holeMeshes.get(d);m||(m=new ht(new Pn(1,20,14),new bi({color:"#000000"})),this.scene.add(m),this.holeMeshes.set(d,m));let _=d.x*xt,c=d.y*xt,g=Math.min(1,d.t*3),y=d.r*xt;m.position.set(_,1,c),m.scale.setScalar(.9*g+Math.sin(n*10)*.05),r.add(_,.06,c,y*2,y*2,1.2,.4,2.2,.7*g,-n*3,dt.SIGIL),i.add(_,1,c,3.6*g,3.6*g,1.4,.5,2.4,.9,n*4,dt.SHOCK),i.add(_,1,c,4.8*g,1.2*g,1.6,.7,2.6,.7,n*2,dt.STREAK,1,0,0);for(let w=0;w<2;w++){let S=Math.random()*Ue,C=y;this.emit(_+Math.cos(S)*C,Zt(.3,1.8),c+Math.sin(S)*C,-Math.cos(S)*C*1.6,0,-Math.sin(S)*C*1.6,.6,.18,"#d0a0ff",dt.DOT)}this.light(_,1.5,c,"#8040ff",60)}for(let[d,m]of this.holeMeshes)p.has(d)||(this.scene.remove(m),this.holeMeshes.delete(d))}drawProps(t,e){let n=t.ch.decor,i=new Set;this.propMeshes||(this.propMeshes=new Map);for(let r of t.props){i.add(r);let a=this.propMeshes.get(r);a||(a=this.makeProp(n),this.scene.add(a),this.propMeshes.set(r,a)),a.position.set(r.x*xt,0,r.y*xt),a.rotation.y=r.seed,(n==="abyss"||n==="forest")&&this.add.add(r.x*xt,.8,r.y*xt,1.6,1.6,...n==="abyss"?[.9,.4,1.5]:[.4,1.3,1],.25,0,dt.GLOW)}for(let[r,a]of this.propMeshes)i.has(r)||(this.scene.remove(a),this.propMeshes.delete(r));for(let r of t.propBreaks){if(r._f)continue;r._f=1;let a=r.x*xt,o=r.y*xt,l=n==="abyss"?"#c080ff":n==="forest"?"#80ffd0":"#c8a878";for(let h=0;h<14;h++){let u=Math.random()*Ue,f=Zt(2,5);this.emit(a,.6,o,Math.cos(u)*f,Zt(2,5),Math.sin(u)*f,.9,Zt(.12,.25),l,dt.SHARD,{grav:12,spin:8,add:n!=="ruins"&&n!=="crypt"})}this.emit(a,.5,o,0,.5,0,.8,1.6,"#3a3040",dt.SMOKE,{add:!1,grow:1.5,a:.5}),this.emit(a,.8,o,0,0,0,.35,2.4,"#ffe0a0",dt.GLOW)}}makeProp(t){let e=new Kt;if(t==="ruins"||t==="crypt"){let n=pt(t==="crypt"?"#5a6070":"#8a5a3a",{rough:.8}),i=pt("#c8a24a",{metal:.6,rough:.4}),r=[[0,0],[.22,.02],[.32,.25],[.3,.55],[.16,.72],[.18,.82],[0,.82]].map(([l,h])=>new ft(l,h)),a=new ht(new Yi(r,14),n);a.castShadow=!0,e.add(a);let o=new ht(new ze(.31,.025,4,16),i);o.rotation.x=Math.PI/2,o.position.y=.4,e.add(o)}else if(t==="forest"){let n=new ht(new Pn(.32,12,10),pt("#2a6a58",{emi:"#30ffb0",ei:.5,rough:.5}));n.scale.set(1,1.3,1),n.position.y=.42,n.castShadow=!0,e.add(n);for(let i=0;i<4;i++){let r=new ht(new Xi(.1,.5,4),pt("#1f4a44",{flat:!0})),a=i/4*Ue;r.position.set(Math.cos(a)*.25,.2,Math.sin(a)*.25),r.rotation.set(Math.sin(a)*.8,0,-Math.cos(a)*.8),e.add(r)}}else{let n=pt("#b46cff",{emi:"#9a4cff",ei:1.4,rough:.2});for(let i=0;i<3;i++){let r=new ht(new gn(.2),n);r.scale.set(1,2.4-i*.5,1),r.position.set((i-1)*.18,.45-i*.08,i%2*.12),r.rotation.z=(i-1)*.3,r.castShadow=!0,e.add(r)}}return e}drawRifts(t){for(let e of t.rifts){let n=e.x*xt,i=e.y*xt,r=Math.min(1,e.t*2)*Math.min(1,Math.max(0,e.life+1-e.t));if(this.gAdd.add(n,.05,i,5*r,5*r,1.4,.4,2.2,.8,-this.time*2,dt.SIGIL),this.gAdd.add(n,.06,i,3*r,3*r,1.6,.5,2.4,.9,this.time*3,dt.SHOCK),this.gNorm.add(n,.07,i,2.2*r,2.2*r,1,1,1,.95,0,dt.SHADOW),this.add.add(n,3,i,1.2*r,7*r,1.2,.5,2.2,.45,0,dt.STREAK,0,1,0),Math.random()<.7){let a=Math.random()*Ue;this.emit(n+Math.cos(a)*2.4,.2,i+Math.sin(a)*2.4,-Math.cos(a)*3,Zt(.5,2),-Math.sin(a)*3,.8,.2,"#d090ff",dt.DOT)}this.light(n,1.5,i,"#9050ff",50*r)}}drawFog(t,e){this.fog||(this.fog=[]);let n=t.p.x*xt,i=t.p.y*xt;for(;this.fog.length<22;)this.fog.push({x:n+Zt(-24,24),z:i+Zt(-18,18),s:Zt(5,9),ph:Math.random()*Ue,v:Zt(.2,.5)});let r=_n(this.world.mood.fogTint||"#8a90b0");for(let a of this.fog){a.x+=a.v*e,a.x>n+26&&(a.x-=52),a.x<n-26&&(a.x+=52),a.z>i+20&&(a.z-=40),a.z<i-20&&(a.z+=40);let o=.05+Math.sin(this.time*.4+a.ph)*.02;this.gAdd.add(a.x,.25,a.z,a.s*1.6,a.s,r[0],r[1],r[2],o,a.ph,dt.SMOKE)}}drawEnemyShots(t){let e=this.add,n=this.norm;for(let i of t.eShots){let r=i.x*xt,a=i.y*xt,o=_n(i.color),l=i.r*xt;e.add(r,.9,a,l*4.2,l*4.2,o[0]*1.5,o[1]*1.5,o[2]*1.5,.8,0,dt.GLOW),e.add(r-i.vx*xt*.04,.9,a-i.vy*xt*.04,l*6,l*2.2,o[0],o[1],o[2],.6,0,dt.STREAK,i.vx,0,i.vy),n.add(r,.9,a,l*1.6,l*1.6,.05,0,.04,.9,0,dt.DOT)}}};var cn=Math.PI*2,Oi=1/20,sa=(s,t,e)=>s<t?t:s>e?e:s,pn='Georgia, "Times New Roman", serif',gl=class{constructor(t,e){this.c=t,this.g=t.getContext("2d"),this.R=e,this.pt={x:0,y:0,vis:!0},this.portrait=null,this.resize(),window.addEventListener("resize",()=>this.resize())}resize(){this.dpr=Math.min(window.devicePixelRatio||1,2),this.W=window.innerWidth,this.H=window.innerHeight,this.c.width=this.W*this.dpr,this.c.height=this.H*this.dpr,this.c.style.width=this.W+"px",this.c.style.height=this.H+"px",this.small=Math.min(this.W,this.H)<520}frame(t,e,n,i,r="#b8954a"){let a=this.g;a.fillStyle="rgba(8,5,14,0.82)",a.fillRect(t,e,n,i);let o=a.createLinearGradient(t,e,t,e+i);o.addColorStop(0,"#f0d890"),o.addColorStop(.5,r),o.addColorStop(1,"#5a4320"),a.strokeStyle=o,a.lineWidth=2,a.strokeRect(t+1,e+1,n-2,i-2),a.strokeStyle="rgba(0,0,0,0.8)",a.lineWidth=1,a.strokeRect(t+3.5,e+3.5,n-7,i-7),a.fillStyle=o;for(let[l,h]of[[t,e],[t+n,e],[t,e+i],[t+n,e+i]])a.beginPath(),a.moveTo(l,h-4),a.lineTo(l+4,h),a.lineTo(l,h+4),a.lineTo(l-4,h),a.fill()}bar(t,e,n,i,r,a,o,l){let h=this.g;this.frame(t-3,e-3,n+6,i+6),h.fillStyle="#0a0610",h.fillRect(t,e,n,i);let u=n*sa(r,0,1),f=h.createLinearGradient(0,e,0,e+i);f.addColorStop(0,a),f.addColorStop(1,o),h.fillStyle=f,h.fillRect(t,e,u,i),h.fillStyle="rgba(255,255,255,0.18)",h.fillRect(t,e,u,i*.35),u>4&&(h.fillStyle="rgba(255,255,255,0.7)",h.fillRect(t+u-2,e,2,i)),l&&(h.font=`bold ${Math.max(10,i-3)}px ${pn}`,h.textAlign="center",h.textBaseline="middle",h.lineWidth=3,h.strokeStyle="#000",h.strokeText(l,t+n/2,e+i/2+1),h.fillStyle="#fff",h.fillText(l,t+n/2,e+i/2+1))}drawPortrait(t,e,n,i){let r=this.g,a=Save.data.corruption/100;r.save();let o=r.createRadialGradient(t,e-n*.2,2,t,e,n);o.addColorStop(0,a>.5?"#5a2080":"#3a2a70"),o.addColorStop(1,"#0a0614"),r.fillStyle=o,r.beginPath(),r.arc(t,e,n,0,cn),r.fill(),r.beginPath(),r.arc(t,e,n-2,0,cn),r.clip(),r.fillStyle="#2c1650",r.beginPath(),r.moveTo(t-n*.9,e+n),r.quadraticCurveTo(t-n*.7,e+n*.1,t-n*.45,e-n*.05),r.quadraticCurveTo(t-n*.5,e-n*.75,t,e-n*.82),r.quadraticCurveTo(t+n*.5,e-n*.75,t+n*.45,e-n*.05),r.quadraticCurveTo(t+n*.7,e+n*.1,t+n*.9,e+n),r.fill(),r.strokeStyle="#d8b25a",r.lineWidth=2,r.stroke(),r.fillStyle="#05020a",r.beginPath(),r.ellipse(t,e-n*.18,n*.28,n*.34,0,0,cn),r.fill();let l=a>.5?"#ff8bff":"#c9a8ff";r.shadowColor=l,r.shadowBlur=10,r.fillStyle=l,r.beginPath(),r.ellipse(t-n*.11,e-n*.2,n*.06,n*.035,0,0,cn),r.ellipse(t+n*.11,e-n*.2,n*.06,n*.035,0,0,cn),r.fill(),r.restore();let h=r.createLinearGradient(t,e-n,t,e+n);h.addColorStop(0,"#f6e0a0"),h.addColorStop(.5,"#b8954a"),h.addColorStop(1,"#5a4320"),r.strokeStyle=h,r.lineWidth=4,r.beginPath(),r.arc(t,e,n,0,cn),r.stroke();let u=i.p.heart/100,f=u>=1;r.strokeStyle="#1a0a28",r.lineWidth=5,r.beginPath(),r.arc(t,e,n+6,0,cn),r.stroke(),r.strokeStyle=f?Math.floor(this.R.time*6)%2?"#ff9bff":"#c070ff":"#8a3cd0",r.shadowColor="#b46cff",r.shadowBlur=f?16:6,r.beginPath(),r.arc(t,e,n+6,-Math.PI/2,-Math.PI/2+cn*u),r.stroke(),r.shadowBlur=0;let p=t+n*.72,d=e+n*.72;r.fillStyle="#120a1e",r.beginPath();for(let m=0;m<6;m++){let _=m*cn/6+Math.PI/6;r.lineTo(p+Math.cos(_)*15,d+Math.sin(_)*15)}r.closePath(),r.fill(),r.strokeStyle=h,r.lineWidth=2,r.stroke(),r.font=`bold 14px ${pn}`,r.textAlign="center",r.textBaseline="middle",r.fillStyle="#ffe9b0",r.fillText(i.p.lvl,p,d+1)}slot(t,e,n,i,r,a,o){let l=this.g;this.frame(t,e,n,n,o?"#ffd86b":"#8a7040"),l.drawImage(Icons.canvas(i,64),t+4,e+4,n-8,n-8),r&&(l.font=`bold 11px ${pn}`,l.textAlign="right",l.textBaseline="alphabetic",l.lineWidth=3,l.strokeStyle="#000",l.strokeText(r,t+n-4,e+n-4),l.fillStyle=o?"#ffd86b":"#fff",l.fillText(r,t+n-4,e+n-4))}minimap(t,e,n,i){let r=this.g,a=i/2-4,o=e+i/2,l=n+a+4,h=a/900,u=t.p;r.save(),r.fillStyle="rgba(8,5,14,0.78)",r.beginPath(),r.arc(o,l,a,0,cn),r.fill(),r.beginPath(),r.arc(o,l,a,0,cn),r.clip(),r.strokeStyle="rgba(180,140,255,0.12)",r.lineWidth=1,r.beginPath(),r.arc(o,l,a*.5,0,cn),r.stroke();let f=(d,m,_,c)=>{let g=(d-u.x)*h,y=(m-u.y)*h;g*g+y*y>a*a||(r.fillStyle=_,r.fillRect(o+g-c/2,l+y-c/2,c,c))};for(let d of t.props)f(d.x,d.y,"#c8a878",3);for(let d of t.enemies)!d.dead&&!d.boss&&f(d.x,d.y,d.elite?"#ffd86b":d.champion?"#ff9a40":"#d04050",d.elite||d.champion?5:2);for(let d of t.pickups)f(d.x,d.y,d.kind==="fragment"?"#ffe08a":d.kind==="heal"?"#ff6a8a":"#9ad0ff",4);for(let d of t.rifts)f(d.x,d.y,"#c070ff",7);if(r.restore(),t.boss){let d=t.boss,m=d.x-u.x,_=d.y-u.y,c=Math.hypot(m,_),g=Math.min(1,(a-5)/(c*h||1));r.fillStyle="#ff3050",r.beginPath(),r.arc(o+m*h*g,l+_*h*g,5,0,cn),r.fill()}r.fillStyle="#e0c8ff",r.beginPath(),r.moveTo(o,l-5),r.lineTo(o+4,l+4),r.lineTo(o-4,l+4),r.fill();let p=r.createLinearGradient(o,l-a,o,l+a);p.addColorStop(0,"#f0d890"),p.addColorStop(1,"#5a4320"),r.strokeStyle=p,r.lineWidth=2.5,r.beginPath(),r.arc(o,l,a,0,cn),r.stroke()}draw(t,e){let n=this.g,i=this.W,r=this.H,a=this.R.time;if(n.setTransform(this.dpr,0,0,this.dpr,0,0),n.clearRect(0,0,i,r),!t)return;let o=t.p,l=this.R,h=this.pt;n.textAlign="center",n.textBaseline="middle";for(let $ of t.texts){if(l.project($.x*Oi,1.8+(.8-$.life)*1.2,$.y*Oi,h),!h.vis)continue;let W=.8-$.life,j=W<.1?1+(.1-W)*5:1,nt=$.size>=16,vt=($.size+(nt?6:3))*j;n.globalAlpha=Math.min(1,$.life*2.5),n.font=`bold ${vt|0}px ${pn}`,n.lineWidth=4,n.strokeStyle="rgba(0,0,0,0.9)",n.strokeText($.txt,h.x,h.y);let zt=$.color;zt==="#ffffff"&&nt&&(zt="#ffe08a"),n.fillStyle=zt,n.fillText($.txt,h.x,h.y)}n.globalAlpha=1;for(let $ of t.enemies){if(!$.elite||$.dead||(l.project($.x*Oi,3.6,$.y*Oi,h),!h.vis))continue;let W=64;n.fillStyle="rgba(0,0,0,0.75)",n.fillRect(h.x-W/2-1,h.y-1,W+2,7),n.fillStyle="#ffd86b",n.fillRect(h.x-W/2,h.y,W*sa($.hp/$.maxHp,0,1),5),n.font=`italic 11px ${pn}`,n.fillStyle="#ffe9b0",n.textAlign="center",n.fillText("\u041D\u043E\u0441\u0438\u0442\u0435\u043B\u044C \u043F\u0430\u043C\u044F\u0442\u0438",h.x,h.y-9)}if(l.project(o.x*Oi,2.55,o.y*Oi,h),n.fillStyle="rgba(0,0,0,0.7)",n.fillRect(h.x-23,h.y-1,46,6),n.fillStyle=o.hp/o.maxHp<.3?"#ff3b5c":"#e8445a",n.fillRect(h.x-22,h.y,44*sa(o.hp/o.maxHp,0,1),4),o.hp/o.maxHp<.3){let $=.25+Math.sin(a*6)*.1,W=n.createRadialGradient(i/2,r/2,Math.min(i,r)*.35,i/2,r/2,Math.max(i,r)*.7);W.addColorStop(0,"rgba(120,0,20,0)"),W.addColorStop(1,`rgba(140,0,20,${$})`),n.fillStyle=W,n.fillRect(0,0,i,r)}let u=this.small,f=u?30:42,p=18+f,d=r-22-f;this.drawPortrait(p,d,f,t);let m=p+f+18,_=Math.min(u?150:260,i-m-20);this.bar(m,d-(u?18:24),_,u?13:17,o.hp/o.maxHp,"#ff5a6a","#8a1024",Math.ceil(o.hp)+" / "+Math.round(o.maxHp)),this.bar(m,d+(u?3:5),_*.85,u?7:9,o.heart/100,"#d080ff","#5a1a9a"),n.font=`italic ${u?10:12}px ${pn}`,n.textAlign="left",n.textBaseline="alphabetic";let c=o.heart>=100;n.fillStyle=c?"#ffd6ff":"#a890c8",n.fillText(c?u?"\u0421\u0435\u0440\u0434\u0446\u0435 \u0433\u043E\u0442\u043E\u0432\u043E \u2014 \u2726":"\u0421\u0435\u0440\u0434\u0446\u0435 \u042D\u0444\u0438\u0440\u0430 \u0433\u043E\u0442\u043E\u0432\u043E \u2014 \u041F\u0420\u041E\u0411\u0415\u041B":"\u0421\u0435\u0440\u0434\u0446\u0435 \u042D\u0444\u0438\u0440\u0430",m,d+(u?24:30)),this.frame(0,0,i,10);let g=n.createLinearGradient(0,0,i,0);g.addColorStop(0,"#3a6aff"),g.addColorStop(1,"#9ad0ff"),n.fillStyle=g,n.fillRect(4,3,(i-8)*sa(o.xp/o.xpNext,0,1),4);let y=u?34:46,w=6,S=DATA.rules.weaponSlots,C=S*(y+w)-w,R=u?12:(i-C)/2,M=u?r-2*f-44-y:r-y-14;for(let $=0;$<S;$++){let W=t.weapons[$];W?this.slot(R,M,y,(W.evo?"evo_":"")+W.id,W.evo?"\u2605":String(W.lvl),DATA.weapons[W.id].color,W.evo):this.frame(R,M,y,y,"#4a3a20"),R+=y+w}let E=u?24:30,U=Object.keys(t.passives),I=u?12:(i-C)/2,O=M-E-8;for(let $ of U)this.slot(I,O,E,$,String(t.passives[$]),"#d8c8ff",!1),I+=E+4;if(t.spec&&!u){let $=DATA.specs[t.spec];n.font=`bold ${u?11:13}px ${pn}`,n.textAlign="left",n.fillStyle=$.color,n.shadowColor=$.color,n.shadowBlur=8,n.fillText($.name,I+6,O+E*.7),n.shadowBlur=0}let B=u?120:150,H=i-B-12,F=18;this.frame(H,F,B,u?58:66);let q=Math.floor(t.time),Y=String(Math.floor(q/60)).padStart(2,"0"),X=String(q%60).padStart(2,"0");if(n.font=`bold ${u?22:26}px ${pn}`,n.textAlign="center",n.fillStyle="#fff3d0",n.textBaseline="alphabetic",n.fillText(Y+":"+X,H+B/2,F+(u?26:30)),n.font=`${u?10:12}px ${pn}`,n.fillStyle="#e0d0ff",n.textAlign="left",n.fillText("\u0423\u0431\u0438\u0442\u043E "+t.kills,H+10,F+(u?46:54)),n.fillStyle="#c890ff",n.textAlign="right",n.fillText("\u041F\u043E\u0440\u0447\u0430 "+Math.round(Save.data.corruption)+"%",H+B-10,F+(u?46:54)),t.bossSpawned||(n.font=`italic ${u?10:12}px ${pn}`,n.textAlign="center",n.fillStyle="#a898c0",n.fillText("\u0421\u0442\u0440\u0430\u0436 \u0447\u0435\u0440\u0435\u0437 "+Math.ceil(DATA.rules.bossTime-t.time)+" \u0441",H+B/2,F+(u?74:84))),u?this.minimap(t,i-12-92,t.boss?136:F+84,92):this.minimap(t,H,F+96,B),t.eventDirT>0){let $=t.eventDir,W=Math.min(i,r)/2-60,j=Math.min(1,t.eventDirT);n.save(),n.globalAlpha=j*(.6+Math.sin(a*10)*.4),n.translate(i/2+Math.cos($)*W,r/2+Math.sin($)*W*.8),n.rotate($),n.fillStyle="#ff9a40",n.shadowColor="#ff6000",n.shadowBlur=14;for(let nt=0;nt<3;nt++)n.beginPath(),n.moveTo(-6-nt*12,-12),n.lineTo(4-nt*12,0),n.lineTo(-6-nt*12,12),n.lineTo(-2-nt*12,0),n.fill();n.restore()}if(t.buffT>0&&(n.font=`bold ${u?12:14}px ${pn}`,n.textAlign="center",n.fillStyle="#ffb0ff",n.shadowColor="#d060ff",n.shadowBlur=10,n.fillText("\u0421\u0438\u043B\u0430 \u042D\u0444\u0438\u0440\u0430: +50% \u0443\u0440\u043E\u043D\u0430 \xB7 "+Math.ceil(t.buffT)+" \u0441",i/2,u?150:120),n.shadowBlur=0),t.boss){let $=t.boss,W=DATA.bosses[$.bossId],j=Math.min(600,i-(u?40:360)),nt=(i-j)/2,vt=u?96:40;if(n.font=`bold ${u?15:20}px ${pn}`,n.textAlign="center",n.textBaseline="alphabetic",n.shadowColor="#ff2a4a",n.shadowBlur=12,n.fillStyle="#ffe0e0",n.fillText(W.name,i/2,vt-6),n.shadowBlur=0,this.bar(nt,vt,j,u?10:14,$.hp/$.maxHp,"#ff3a5a","#600818"),n.font=`italic ${u?10:12}px ${pn}`,n.fillStyle="#c8a8b8",n.fillText(W.title,i/2,vt+(u?26:32)),l.project($.x*Oi,1,$.y*Oi,h),h.x<0||h.x>i||h.y<0||h.y>r){let zt=Math.atan2(h.y-r/2,h.x-i/2),st=Math.min(i,r)/2-50;n.save(),n.translate(i/2+Math.cos(zt)*st,r/2+Math.sin(zt)*st),n.rotate(zt),n.fillStyle="#ff4a5a",n.shadowColor="#ff0030",n.shadowBlur=12,n.beginPath(),n.moveTo(18,0),n.lineTo(-10,-12),n.lineTo(-4,0),n.lineTo(-10,12),n.fill(),n.restore()}}if(t.banner){let $=t.banner,W=sa(Math.min(1,$.t,($.max-$.t)*3),0,1);n.globalAlpha=W;let j=r*.27,nt=n.createLinearGradient(i/2-260,0,i/2+260,0);nt.addColorStop(0,"rgba(216,178,90,0)"),nt.addColorStop(.5,"rgba(216,178,90,0.9)"),nt.addColorStop(1,"rgba(216,178,90,0)"),n.fillStyle=nt,n.fillRect(i/2-260,j+16,520,1.5),n.fillRect(i/2-260,j-44,520,1.5),n.textAlign="center",n.textBaseline="alphabetic",n.font=`bold ${u?26:38}px ${pn}`,n.shadowColor="#9b5cff",n.shadowBlur=20,n.fillStyle="#f4e8ff",n.fillText($.title,i/2,j),n.shadowBlur=0,n.font=`italic ${u?13:17}px ${pn}`,n.fillStyle="#d8c8f0",n.fillText($.sub,i/2,j+40),n.globalAlpha=1}e&&e.active&&(n.globalAlpha=.35,n.strokeStyle="#d8b25a",n.lineWidth=2,n.beginPath(),n.arc(e.ox,e.oy,50,0,cn),n.stroke(),n.fillStyle="#b46cff",n.beginPath(),n.arc(e.ox+e.dx*50,e.oy+e.dy*50,20,0,cn),n.fill(),n.globalAlpha=1)}};var i_={minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],phrygian:[0,1,3,5,7,8,10]},Rd={menu:{root:45,scale:"minor",bpm:58,bright:.6},ruins:{root:50,scale:"minor",bpm:84,bright:.8},forest:{root:52,scale:"dorian",bpm:80,bright:1},crypt:{root:49,scale:"minor",bpm:76,bright:.6},abyss:{root:47,scale:"phrygian",bpm:88,bright:.7}},Jc=[0,5,3,4],mn=s=>440*Math.pow(2,(s-69)/12),s_={bolt:.07,shard:.12,orb:.15,zap:.08,nova:.2,freeze:.5,blade:.09,boom:.06,hit:.035,death:.04,gem:.03,level:.4,hurt:.25,heart:.5,roar:1,phase:1,warn:.25,crack:.08,chime:.3,heal:.3,power:.3,ui:.05,event:.8,victory:2,defeat:2,eshot:.09},Kc=class{constructor(){this.ctx=null,this.last={},this.mood="menu",this.intensity=0,this.boss=!1,this.paused=!1,this.step=0,this.chordIdx=0,this.melodyPos=3,this.gemCombo=0,this.gemT=0;let t=Save.data&&Save.data.audio||{};this.musicOn=t.music!==!1,this.sfxOn=t.sfx!==!1}unlock(){if(!this.ctx){let t=window.AudioContext||window.webkitAudioContext;if(!t)return;try{this.ctx=new t({latencyHint:"interactive"})}catch{return}this.build()}this.ctx.state==="suspended"&&this.ctx.resume()}build(){let t=this.ctx,e=Save.data&&Save.data.audio||{};this.musicOn=e.music!==!1,this.sfxOn=e.sfx!==!1,this.master=t.createGain(),this.master.gain.value=.9;let n=t.createDynamicsCompressor();n.threshold.value=-16,n.knee.value=12,n.ratio.value=5,n.attack.value=.004,n.release.value=.2,this.master.connect(n),n.connect(t.destination),this.music=t.createGain(),this.music.gain.value=this.musicOn?.55:0,this.music.connect(this.master),this.sfx=t.createGain(),this.sfx.gain.value=this.sfxOn?.8:0,this.sfx.connect(this.master),this.verb=t.createConvolver();let i=t.sampleRate*3.2,r=t.createBuffer(2,i,t.sampleRate);for(let h=0;h<2;h++){let u=r.getChannelData(h);for(let f=0;f<i;f++)u[f]=(Math.random()*2-1)*Math.pow(1-f/i,2.6)}this.verb.buffer=r,this.verbOut=t.createGain(),this.verbOut.gain.value=.55,this.verb.connect(this.verbOut),this.verbOut.connect(this.master),this.noise=t.createBuffer(1,t.sampleRate,t.sampleRate);let a=this.noise.getChannelData(0);for(let h=0;h<a.length;h++)a[h]=Math.random()*2-1;this.padBus=t.createGain(),this.padBus.gain.value=.9,this.padBus.connect(this.music),this.padBus.connect(this.verb),this.drumBus=t.createGain(),this.drumBus.gain.value=0,this.drumBus.connect(this.music),this.bellBus=t.createGain(),this.bellBus.gain.value=.5,this.bellBus.connect(this.music),this.bellBus.connect(this.verb),this.padFilter=t.createBiquadFilter(),this.padFilter.type="lowpass",this.padFilter.frequency.value=700,this.padFilter.Q.value=2,this.padFilter.connect(this.padBus);let o=t.createOscillator(),l=t.createGain();o.frequency.value=.06,l.gain.value=350,o.connect(l),l.connect(this.padFilter.frequency),o.start(),this.padVoices=[],this.droneOsc=null,this.nextTime=t.currentTime+.1,this.setChord(0,!0),setInterval(()=>this.schedule(),30),document.addEventListener("visibilitychange",()=>{this.ctx&&(document.hidden?this.ctx.suspend():this.ctx.resume())})}saveSettings(){Save.data.audio={music:this.musicOn,sfx:this.sfxOn},Save.write()}setMusic(t){this.musicOn=t,this.music&&this.music.gain.setTargetAtTime(t?.55:0,this.ctx.currentTime,.2),this.saveSettings()}setSfx(t){this.sfxOn=t,this.sfx&&this.sfx.gain.setTargetAtTime(t?.8:0,this.ctx.currentTime,.05),this.saveSettings()}scaleNote(t,e=0){let n=Rd[this.mood],i=i_[n.scale],r=(t%7+7)%7,a=Math.floor(t/7);return n.root+i[r]+12*(a+e)}setChord(t,e){let n=this.ctx,i=n.currentTime,r=Jc[t%Jc.length],a=[this.scaleNote(r,-1),this.scaleNote(r+4,-1),this.scaleNote(r+2,0),this.scaleNote(r+7,-1)];for(let o of this.padVoices)o.g.gain.setTargetAtTime(0,i,1.2),o.o.stop(i+6);this.padVoices=[],a.forEach((o,l)=>{for(let h of[-7,7]){let u=n.createOscillator(),f=n.createGain();u.type=l===3?"triangle":"sawtooth",u.frequency.value=mn(o),u.detune.value=h,f.gain.value=0,f.gain.setTargetAtTime(l===3?.05:.028,i,e?.5:1.6),u.connect(f),f.connect(this.padFilter),u.start(i),this.padVoices.push({o:u,g:f})}}),this.droneOsc&&(this.droneG.gain.setTargetAtTime(0,i,1),this.droneOsc.stop(i+5)),this.droneOsc=n.createOscillator(),this.droneG=n.createGain(),this.droneOsc.type="sine",this.droneOsc.frequency.value=mn(this.scaleNote(r,-2)),this.droneG.gain.value=0,this.droneG.gain.setTargetAtTime(.12,i,1.5),this.droneOsc.connect(this.droneG),this.droneG.connect(this.music),this.droneOsc.start(i)}schedule(){if(!this.ctx||this.ctx.state!=="running")return;let t=this.ctx,e=Rd[this.mood],i=60/(e.bpm*(this.boss?1.22:1)*(this.mood==="menu",1))/4,r=this.paused||this.mood==="menu"?0:Math.min(1,.25+this.intensity*.75+(this.boss?.4:0));for(this.drumBus.gain.setTargetAtTime(r*.9,t.currentTime,.8),this.music.gain.setTargetAtTime(this.musicOn?this.paused?.25:.55:0,t.currentTime,.3);this.nextTime<t.currentTime+.15;){let a=this.nextTime,o=this.step%16,l=Math.floor(this.step/16);o===0&&l%4===0&&this.step>0&&(this.chordIdx++,this.setChord(this.chordIdx));let h=this.mood==="menu"?.18:.3+this.intensity*.2;if(o%2===0&&Math.random()<h){this.melodyPos+=[-2,-1,-1,0,1,1,2][Math.random()*7|0],this.melodyPos=Math.max(0,Math.min(9,this.melodyPos));let u=Jc[this.chordIdx%4]+this.melodyPos;this.bell(a,mn(this.scaleNote(u,1)),.05*e.bright)}if(this.mood!=="menu"){let u=this.boss;(o===0||o===8||u&&(o===6||o===14))&&this.kick(a),(o===4||o===12)&&this.tom(a,o===12?82:98),u&&o%4===2&&this.tom(a,130,.5),o%2===1&&this.intensity>.35&&this.hat(a,o%4===3?.05:.025)}this.nextTime+=i,this.step++}}bell(t,e,n){let i=this.ctx;for(let[r,a,o]of[[1,1,2.2],[2.01,.35,1.2],[3.98,.12,.6]]){let l=i.createOscillator(),h=i.createGain();l.type=r===1?"triangle":"sine",l.frequency.value=e*r,h.gain.setValueAtTime(0,t),h.gain.linearRampToValueAtTime(n*a,t+.01),h.gain.exponentialRampToValueAtTime(1e-4,t+o),l.connect(h),h.connect(this.bellBus),l.start(t),l.stop(t+o+.05)}}kick(t){let e=this.ctx,n=e.createOscillator(),i=e.createGain();n.frequency.setValueAtTime(110,t),n.frequency.exponentialRampToValueAtTime(38,t+.3),i.gain.setValueAtTime(.5,t),i.gain.exponentialRampToValueAtTime(.001,t+.45),n.connect(i),i.connect(this.drumBus),n.start(t),n.stop(t+.5)}tom(t,e,n=.32){let i=this.ctx,r=i.createOscillator(),a=i.createGain();r.frequency.setValueAtTime(e,t),r.frequency.exponentialRampToValueAtTime(e*.6,t+.35),a.gain.setValueAtTime(n,t),a.gain.exponentialRampToValueAtTime(.001,t+.5),r.connect(a),a.connect(this.drumBus),a.connect(this.verb),r.start(t),r.stop(t+.55)}hat(t,e){let n=this.ctx,i=n.createBufferSource(),r=n.createBiquadFilter(),a=n.createGain();i.buffer=this.noise,r.type="highpass",r.frequency.value=7e3,a.gain.setValueAtTime(e,t),a.gain.exponentialRampToValueAtTime(.001,t+.06),i.connect(r),r.connect(a),a.connect(this.drumBus),i.start(t,Math.random()*.5,.08)}update(t,e){if(!this.ctx)return;let n=t?t.ch.decor:"menu";if(n!==this.mood&&(this.mood=n,this.melodyPos=3,this.setChord(this.chordIdx)),this.paused=!!(t&&t.paused),this.boss=!!(t&&t.boss),t){let i=Math.min(1,t.enemies.length/220);this.intensity+=(i-this.intensity)*.02}else this.intensity*=.98;this.gemT>0?this.gemT-=1/60:this.gemCombo=0}ok(t){if(!this.ctx||!this.sfxOn||this.ctx.state!=="running")return!1;let e=this.ctx.currentTime,n=s_[t]||.05;return this.last[t]&&e-this.last[t]<n?!1:(this.last[t]=e,!0)}env(t,e,n,i,r){t.gain.setValueAtTime(1e-4,e),t.gain.linearRampToValueAtTime(i,e+n),t.gain.exponentialRampToValueAtTime(1e-4,e+n+r)}tone(t,e,n,i,r,{a=.005,verb:o=0,filter:l=0,at:h=0,detune:u=0}={}){let f=this.ctx,p=f.currentTime+h,d=f.createOscillator(),m=f.createGain();d.type=t,d.frequency.setValueAtTime(e,p),n!==e&&d.frequency.exponentialRampToValueAtTime(Math.max(20,n),p+i),d.detune.value=u,this.env(m,p,a,r,i);let _=d;if(l){let c=f.createBiquadFilter();c.type="lowpass",c.frequency.value=l,d.connect(c),_=c}if(_.connect(m),m.connect(this.sfx),o){let c=f.createGain();c.gain.value=o,m.connect(c),c.connect(this.verb)}d.start(p),d.stop(p+a+i+.05)}burst(t,e,{type:n="bandpass",f0:i=1e3,f1:r=1e3,q:a=1,a:o=.005,verb:l=0,at:h=0}={}){let u=this.ctx,f=u.currentTime+h,p=u.createBufferSource(),d=u.createBiquadFilter(),m=u.createGain();if(p.buffer=this.noise,d.type=n,d.Q.value=a,d.frequency.setValueAtTime(i,f),r!==i&&d.frequency.exponentialRampToValueAtTime(r,f+t),this.env(m,f,o,e,t),p.connect(d),d.connect(m),m.connect(this.sfx),l){let _=this.ctx.createGain();_.gain.value=l,m.connect(_),_.connect(this.verb)}p.start(f,Math.random()*.4,o+t+.05)}play(t,e=0){if(!this.ok(t))return;let n=(i,r)=>i+Math.random()*(r-i);switch(t){case"bolt":this.tone("triangle",n(900,1100),420,.12,.06,{verb:.3}),this.tone("sine",1800,900,.08,.025);break;case"shard":for(let i=0;i<3;i++)this.tone("sine",n(2200,3400),n(1800,2600),.18,.025,{at:i*.025,verb:.5});break;case"orb":this.tone("sine",180,90,.4,.09,{a:.03,verb:.4}),this.burst(.35,.04,{type:"lowpass",f0:400,f1:1200,a:.05});break;case"zap":this.burst(.12,.14,{type:"bandpass",f0:3200,f1:1400,q:2}),this.tone("sawtooth",n(200,260),80,.12,.05,{filter:2400}),this.burst(.25,.05,{type:"highpass",f0:4e3,f1:6e3,at:.03,verb:.4});break;case"nova":this.burst(.6,.16,{type:"lowpass",f0:300,f1:2200,a:.04,verb:.4}),this.tone("sine",90,50,.5,.12);break;case"freeze":this.burst(.8,.1,{type:"highpass",f0:2500,f1:7e3,a:.02,verb:.6});for(let i=0;i<6;i++)this.tone("sine",n(2500,4200),n(2e3,3e3),.4,.03,{at:i*.04,verb:.6});break;case"blade":this.burst(.09,.07,{type:"bandpass",f0:2600,f1:900,q:3});break;case"boom":this.tone("sine",140,38,.55,.22),this.burst(.5,.14,{type:"lowpass",f0:1800,f1:200,verb:.35});break;case"hit":this.burst(.05,.05,{type:"bandpass",f0:n(500,900),q:1.5});break;case"death":this.tone("triangle",n(260,340),70,.16,.05),this.burst(.12,.04,{type:"lowpass",f0:1200,f1:300});break;case"gem":{this.gemCombo=Math.min(14,this.gemCombo+1),this.gemT=.6;let i=[0,2,4,5,7,9,11,12,14,16,17,19,21,23,24][this.gemCombo];this.tone("sine",mn(84+i),mn(84+i),.09,.035,{verb:.25});break}case"level":[0,3,7,12,15].forEach((i,r)=>this.tone("triangle",mn(64+i),mn(64+i),.9,.07,{at:r*.07,verb:.7})),this.burst(1,.04,{type:"highpass",f0:5e3,f1:9e3,a:.2,verb:.6});break;case"hurt":this.tone("sawtooth",160,60,.25,.12,{filter:900}),this.burst(.15,.1,{type:"lowpass",f0:900,f1:200});break;case"heart":this.tone("sine",70,30,1.4,.35),this.burst(1.4,.25,{type:"lowpass",f0:200,f1:4e3,a:.08,verb:.8}),[0,7,12,15,19].forEach((i,r)=>this.tone("sawtooth",mn(45+i),mn(45+i),1.8,.035,{at:.05+r*.02,verb:.9,filter:1600}));break;case"roar":for(let i of[-14,0,9])this.tone("sawtooth",70,42,1.8,.12,{a:.25,filter:500,detune:i*10,verb:.6});this.burst(1.8,.12,{type:"lowpass",f0:500,f1:150,a:.3,verb:.6});break;case"phase":this.tone("sine",98,96,3,.25,{verb:1}),this.tone("sine",196.5,195,2.5,.1,{verb:1}),this.tone("sine",294,290,2,.06,{verb:1}),this.burst(.4,.1,{type:"lowpass",f0:800,f1:200});break;case"warn":this.tone("square",440,660,.18,.025,{filter:1500});break;case"crack":this.burst(.18,.12,{type:"bandpass",f0:1800,f1:600,q:.8}),this.tone("triangle",300,120,.12,.05);for(let i=0;i<3;i++)this.burst(.05,.05,{type:"highpass",f0:3e3,at:.04+i*.03});break;case"chime":[0,4,7,11,14].forEach((i,r)=>this.tone("sine",mn(76+i),mn(76+i),1.6,.05,{at:r*.09,verb:.9}));break;case"heal":this.tone("sine",520,780,.35,.06,{verb:.5}),this.tone("sine",780,1040,.35,.04,{at:.08,verb:.5});break;case"power":this.tone("sawtooth",220,880,.6,.06,{filter:2e3,verb:.6}),this.burst(.6,.06,{type:"bandpass",f0:600,f1:4e3,verb:.5});break;case"ui":this.tone("sine",1200,900,.05,.03);break;case"event":this.tone("sawtooth",110,110,1.2,.08,{a:.2,filter:700,verb:.8}),this.tone("sawtooth",165,165,1,.05,{a:.25,filter:700,verb:.8});break;case"eshot":this.tone("sine",n(500,700),250,.12,.025);break;case"victory":[0,4,7,12,16,19,24].forEach((i,r)=>this.tone("triangle",mn(57+i),mn(57+i),2.4,.07,{at:r*.12,verb:.9}));break;case"defeat":[12,8,5,0].forEach((i,r)=>this.tone("sawtooth",mn(45+i),mn(45+i),1.6,.05,{at:r*.35,filter:900,verb:.9}));break}}},xl=new Kc;Save.data||Save.load();var Pd=document.getElementById("game"),Ze=hh(Pd),Dn=null,Id=null;try{Dn=new ml(Pd),Id=new gl(document.getElementById("hud"),Dn),window.addEventListener("resize",()=>Dn.resize())}catch(s){console.error(s);let t=document.createElement("div");t.className="webgl-error",t.textContent="\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C WebGL. \u041E\u0431\u043D\u043E\u0432\u0438 \u0431\u0440\u0430\u0443\u0437\u0435\u0440 \u0438\u043B\u0438 \u0432\u043A\u043B\u044E\u0447\u0438 \u0430\u043F\u043F\u0430\u0440\u0430\u0442\u043D\u043E\u0435 \u0443\u0441\u043A\u043E\u0440\u0435\u043D\u0438\u0435.",document.body.appendChild(t)}var Ld="ruins";window.Sound=xl;for(let s of["pointerdown","touchend","keydown","click"])window.addEventListener(s,()=>xl.unlock(),{passive:!0});var Cd=0;function Dd(s){let t=Math.min(.05,(s-Cd)/1e3||0);Cd=s;let e=Ze.run,n=e&&!e.paused;n&&(Ze.setView(Dn.footprint.W,Dn.footprint.H),Ze.update(t)),Dn&&(Dn.render(Ze.run,e?n?t:0:t,Ld),Id.draw(Ze.run,Ze.joy),xl.update(Ze.run)),requestAnimationFrame(Dd)}requestAnimationFrame(Dd);window.Game={start(s){Dn&&Dn.reset(),Ze.start(s)},quit(){Ze.quit(),Dn&&Dn.reset()},useHeart:()=>Ze.useHeart(),applyChoice:s=>Ze.applyChoice(s),reroll:()=>Ze.reroll(),get rerolls(){return Ze.rerolls},setPaused:s=>Ze.setPaused(s),get running(){return Ze.running},get run(){return Ze.run},setMenuScene(s){Ld=s},setView:(s,t)=>Ze.setView(s,t),get renderer(){return Dn},debug:Ze.debug};})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
