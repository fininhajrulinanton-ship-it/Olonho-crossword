(() => {
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=canvas.width,H=canvas.height,T=40,COLS=24,ROWS=15;
const $=id=>document.getElementById(id);
const keys={}, inv={wood:0,stone:0,twig:0,grass:0,berry:2,meat:0};
const labels={wood:['🪵','Дерево'],stone:['🪨','Камень'],twig:['🌿','Ветка'],grass:['🍃','Трава'],berry:['🫐','Ягоды'],meat:['🍖','Мясо']};
let world=[],player,objects=[],enemies=[],fires=[],traps=[],running=false,day=1,minute=7*60,kills=0,selected='berry',last=0,toastTimer=0,gameTime=0;
const rand=(a,b)=>Math.random()*(b-a)+a, choice=a=>a[Math.floor(Math.random()*a.length)], clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function say(t){$('log').textContent=t;$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),1900)}
function reset(){
  Object.keys(inv).forEach(k=>inv[k]=0);

inv.berry = 3;
inv.wood = 3;
inv.stone = 2;
  player={x:W/2,y:H/2,r:11,hp:100,hunger:100,sanity:100,warmth:100,speed:155,axe:false};
  objects=[];enemies=[];fires=[];traps=[];kills=0;day=1;minute=7*60;gameTime=0;
  world=Array.from({length:ROWS},()=>Array.from({length:COLS},()=>Math.random()<.13?'water':'grass'));
  for(let i=0;i<65;i++){let x=rand(30,W-30),y=rand(30,H-30);if(Math.hypot(x-player.x,y-player.y)>65)objects.push({x,y,type:choice(['tree','tree','rock','bush','twig','grass']),r:choice([12,14,16]),alive:true})}
  running=true;$('start-screen').classList.add('hidden');$('game-over').classList.add('hidden');say('Собирай ресурсы. До ночи нужно подготовить костёр.');
  updateUI();last=performance.now();requestAnimationFrame(loop);
}
function nearObj(){let best=null,d=48;for(const o of objects){if(!o.alive)continue;let n=Math.hypot(o.x-player.x,o.y-player.y);if(n<d){d=n;best=o}}return best}
function interact(){let o=nearObj();if(!o){say('Рядом нет ресурсов. Подойди ближе.');return}
  if(o.type==='tree'){if(!player.axe){say('Нужен топор. Создай его в меню.');return}inv.wood+=2;inv.twig+=1;say('Ты срубил дерево: +2 дерева, +1 ветка.')}
  if(o.type==='rock'){inv.stone+=2;say('Ты подобрал камни: +2 камня.')}
  if(o.type==='bush'){inv.berry+=2;say('Ты собрал ягоды: +2 ягоды.')}
  if(o.type==='twig'){inv.twig+=2;say('Собраны ветки: +2.')}
  if(o.type==='grass'){inv.grass+=2;say('Собрана трава: +2.')}
  o.alive=false;updateUI();
}
function eat(){if(inv[selected]<=0){say('Этого предмета нет в инвентаре.');return}
  if(selected==='berry'){inv.berry--;player.hunger=clamp(player.hunger+17,0,100);player.hp=clamp(player.hp+2,0,100);say('Ты съел ягоды.');}
  else if(selected==='meat'){inv.meat--;player.hunger=clamp(player.hunger+38,0,100);player.hp=clamp(player.hp+8,0,100);say('Ты съел мясо.');}
  else {say('Это нельзя съесть.');return}updateUI();
}
function craft(kind){
 if(kind==='fire'){if(inv.wood<5||inv.stone<3){say('Не хватает ресурсов для костра.');return}inv.wood-=5;inv.stone-=3;fires.push({x:player.x,y:player.y,life:110});say('Костёр готов! Держись рядом ночью.')}
 if(kind==='axe'){if(inv.wood<3||inv.stone<2){say('Не хватает ресурсов для топора.');return}inv.wood-=3;inv.stone-=2;player.axe=true;say('Создан топор. Теперь можно рубить деревья.')}
 if(kind==='trap'){if(inv.twig<4||inv.grass<2){say('Нужно 4 ветки и 2 травы.');return}inv.twig-=4;inv.grass-=2;traps.push({x:player.x+25,y:player.y+15});say('Ловушка установлена. Она поймает ночное существо.')}
 updateUI();
}
function updateUI(){
 const vals={health:player.hp,hunger:player.hunger,sanity:player.sanity,warmth:player.warmth};
 for(let k in vals){$(k+'-text').textContent=Math.ceil(vals[k]);$(k+'-bar').style.width=vals[k]+'%'}
 $('time-text').textContent=`День ${day} · ${minute<6*60?'Ночь':minute<11*60?'Утро':minute<18*60?'День':'Вечер'}`;
 $('weather-text').textContent=minute>=19*60||minute<6*60?'Холодная ночь':'Прохладно';$('kills-text').textContent=kills;
 $('inventory').innerHTML=Object.keys(inv).map((k,i)=>`<div class="slot ${selected===k?'selected':''}"><strong>${labels[k][0]} ${inv[k]}</strong>${i<3?i+1+' · ':''}${labels[k][1]}</div>`).join('');
}
function spawnEnemy(){let side=Math.floor(rand(0,4)),x=side===0?5:side===1?W-5:rand(5,W-5),y=side===2?5:side===3?H-5:rand(5,H-5);enemies.push({x,y,hp:35,r:12,speed:rand(35,48),attack:0})}
function update(dt){
 let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0),len=Math.hypot(dx,dy)||1;
 player.x=clamp(player.x+dx/len*player.speed*dt,12,W-12);player.y=clamp(player.y+dy/len*player.speed*dt,12,H-12);
 gameTime+=dt;minute+=dt*2.0;if(minute>=24*60){minute-=24*60;day++;say('Наступил новый день. Держись.')}
 let night=minute>=19*60||minute<6*60;
 player.hunger=clamp(player.hunger-dt*.42,0,100);
 if(player.hunger<=0)player.hp-=dt*2.2;
 let nearFire=fires.some(f=>Math.hypot(f.x-player.x,f.y-player.y)<105&&f.life>0);
 player.warmth=clamp(player.warmth+(nearFire?dt*14:night?-dt*3:dt*2),0,100);
 player.sanity=clamp(player.sanity+(nearFire?dt*.8:night?-dt*1.3:dt*.1),0,100);
 if(player.warmth<=0)player.hp-=dt*1.4;if(player.sanity<18)player.hp-=dt*.5;
 fires.forEach(f=>f.life-=dt);
 if(night&&enemies.length<Math.min(5,day+1)&&Math.random()<dt*.08)spawnEnemy();
 enemies.forEach(e=>{let a=Math.atan2(player.y-e.y,player.x-e.x);e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt;e.attack-=dt;
  if(Math.hypot(e.x-player.x,e.y-player.y)<24&&e.attack<=0){player.hp-=9;player.sanity-=3;e.attack=1.1;say('Ночное существо атаковало тебя!')}
  traps.forEach(t=>{if(Math.hypot(e.x-t.x,e.y-t.y)<18&&e.hp>0){e.hp=0;inv.meat++;say('Ловушка поймала существо: +1 мясо.')}})
 });
 enemies=enemies.filter(e=>e.hp>0&&e.x>-30&&e.x<W+30&&e.y>-30&&e.y<H+30);
 if(player.hp<=0){player.hp=0;running=false;$('death-reason').textContent=player.hunger<=0?'Ты умер от голода.':'Ты не смог пережить опасности дикой природы.';$('game-over').classList.remove('hidden')}
 if(Math.floor(gameTime)%2===0){} updateUI();
}
function draw(){
 ctx.clearRect(0,0,W,H);
 for(let y=0;y<H;y+=T)for(let x=0;x<W;x+=T){let n=(Math.floor(x/T)*7+Math.floor(y/T)*13)%5;ctx.fillStyle=['#526d43','#4e6940','#587448','#4b653e','#536d45'][n];ctx.fillRect(x,y,T,T);ctx.fillStyle='#ffffff08';ctx.fillRect(x+3,y+3,2,2)}
 // decorative ground details
 for(let i=0;i<40;i++){let x=(i*137)%W,y=(i*83)%H;ctx.fillStyle='#d7d09a33';ctx.fillRect(x,y,2,2)}
 objects.forEach(o=>{if(!o.alive)return;ctx.save();ctx.translate(o.x,o.y);
  if(o.type==='tree'){ctx.fillStyle='#392d20';ctx.fillRect(-4,0,8,18);ctx.fillStyle='#25472e';ctx.beginPath();ctx.arc(0,-5,17,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3e6940';ctx.beginPath();ctx.arc(-6,-10,9,0,Math.PI*2);ctx.fill()}
  if(o.type==='rock'){ctx.fillStyle='#858b7a';ctx.beginPath();ctx.moveTo(-13,7);ctx.lineTo(-9,-8);ctx.lineTo(4,-13);ctx.lineTo(14,-3);ctx.lineTo(10,9);ctx.closePath();ctx.fill();ctx.fillStyle='#b0b5a0';ctx.fillRect(-5,-7,5,2)}
  if(o.type==='bush'){ctx.fillStyle='#315b36';ctx.beginPath();ctx.arc(0,0,13,0,7);ctx.fill();ctx.fillStyle='#b04f59';for(let j=0;j<4;j++){ctx.beginPath();ctx.arc((j%2)*10-5,Math.floor(j/2)*8-4,3,0,7);ctx.fill()}}
  if(o.type==='twig'){ctx.strokeStyle='#a78b5d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-8,5);ctx.lineTo(8,-5);ctx.stroke()}
  if(o.type==='grass'){ctx.strokeStyle='#b6bd74';ctx.lineWidth=2;for(let j=-5;j<=5;j+=5){ctx.beginPath();ctx.moveTo(j,7);ctx.lineTo(j-3,-5);ctx.stroke()}}
  ctx.restore();
 });
 fires.forEach(f=>{if(f.life<=0)return;ctx.fillStyle='#f6a344';ctx.beginPath();ctx.arc(f.x,f.y,9,0,7);ctx.fill();ctx.fillStyle='#ffe58b';ctx.beginPath();ctx.arc(f.x,f.y-3,5,0,7);ctx.fill();ctx.fillStyle='#211c16';ctx.fillRect(f.x-11,f.y+7,22,4)});
 traps.forEach(t=>{ctx.strokeStyle='#c9b27b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.x,t.y,10,0,7);ctx.stroke()});
 enemies.forEach(e=>{ctx.fillStyle='#1a1b24';ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,7);ctx.fill();ctx.fillStyle='#df5d55';ctx.fillRect(e.x-6,e.y-3,4,3);ctx.fillRect(e.x+3,e.y-3,4,3)});
 // player
 ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(player.x,player.y+10,9,4,0,0,7);ctx.fill();ctx.fillStyle='#d9b68a';ctx.beginPath();ctx.arc(player.x,player.y,9,0,7);ctx.fill();ctx.fillStyle='#394b55';ctx.fillRect(player.x-8,player.y+5,16,12);ctx.fillStyle='#d8c18a';ctx.fillRect(player.x-5,player.y-3,10,3);
 // interaction marker
 let o=nearObj();if(o){ctx.strokeStyle='#f3d27d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(o.x,o.y,22,0,7);ctx.stroke();ctx.fillStyle='#fff2c2';ctx.font='12px Arial';ctx.fillText('E',o.x-4,o.y-27)}
 // night overlay
 let night=minute>=19*60||minute<6*60;if(night){ctx.fillStyle='rgba(9,13,28,.66)';ctx.fillRect(0,0,W,H);fires.forEach(f=>{if(f.life<=0)return;let g=ctx.createRadialGradient(f.x,f.y,12,f.x,f.y,145);g.addColorStop(0,'rgba(255,180,70,.42)');g.addColorStop(1,'rgba(255,180,70,0)');ctx.fillStyle=g;ctx.fillRect(f.x-150,f.y-150,300,300)});let g=ctx.createRadialGradient(player.x,player.y,10,player.x,player.y,95);g.addColorStop(0,'rgba(255,220,160,.10)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(player.x-100,player.y-100,200,200)}
}
function loop(t){if(!running)return;let dt=Math.min((t-last)/1000,.04);last=t;update(dt);draw();if(running)requestAnimationFrame(loop)}
$('start-btn').onclick=reset;$('restart-btn').onclick=reset;
$('craft-fire').onclick=()=>craft('fire');$('craft-axe').onclick=()=>craft('axe');$('craft-trap').onclick=()=>craft('trap');
window.addEventListener('keydown',e=>{let k=e.key.toLowerCase();keys[k]=true;if(k==='e'&&running)interact();if(k===' '&&running)eat();if(k==='1')selected='berry';if(k==='2')selected='meat';if(k==='3')selected='wood';if(k==='c'&&running)craft('fire');updateUI()});
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
canvas.addEventListener('click',()=>{if(running)interact()});
player={x:W/2,y:H/2,hp:100,hunger:100,sanity:100,warmth:100};updateUI();draw();
})();
