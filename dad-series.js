import {loadSeries,seriesNames} from './series-data.js?v=20261028';
import {dadHTML,loadLineup} from './dad.js?v=20261028series';
import {esc,json,today,centralTime} from './family-utils.js?v=20261006ct';
const choices={};let selected='CUP';
export async function mountDad(isCurrent){
 const controls=document.getElementById('controls'),root=document.getElementById('results');
 controls.innerHTML='<label>Series<select id="dad-series">'+Object.entries(seriesNames).map(([c,n])=>'<option value="'+c+'">'+n+'</option>').join('')+'</select></label><label>Drivers to follow<select id="dad-drivers" multiple size="5"></select><small>Choose one or more drivers (Ctrl/Command-click for multiple).</small></label>';
 const selector=document.getElementById('dad-series'),drivers=document.getElementById('dad-drivers');selector.value=selected;let ticket=0;
 async function render(){
  const mine=++ticket,code=selector.value;selected=code;root.innerHTML='<p role="status">Loading race briefing…</p>';
  try{const [stats,config,cup,all]=await Promise.all([loadSeries(code),json('./data/family.json'),json('./data/schedule.json'),json('./data/calendar-races.json')]);if(!isCurrent()||mine!==ticket)return;
   const map={CUP:'cup',XFINITY:'oreilly',TRUCK:'trucks'};
   const schedule=code==='CUP'?cup:{season:all.season,races:all.races.filter(r=>r.series===map[code]).map(r=>({date:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(r.startAt)),track:r.track,time:new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(r.startAt)),tv:r.tv})).sort((a,b)=>a.date.localeCompare(b.date))};
   const race=schedule.races.find(r=>r.date>=today());const names=[...new Set(stats.rows.map(r=>r.driver))].sort();
   if(!choices[code]){const counts=new Map();for(const r of stats.rows.filter(r=>r.season===schedule.season))counts.set(r.driver,(counts.get(r.driver)||0)+(r.finish===1?100:1));choices[code]=code==='CUP'?config.dad.favoriteDrivers:[...counts].sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);}
   drivers.innerHTML=names.map(n=>'<option value="'+esc(n)+'"'+(choices[code].includes(n)?' selected':'')+'>'+esc(n)+'</option>').join('');
   config.dad={...config.dad,favoriteDrivers:choices[code]};
   const brief=race?'<article class="family-panel"><p class="eyebrow">NEXT '+esc(seriesNames[code].toUpperCase())+' RACE</p><h3>'+esc(race.track)+'</h3><p>'+esc(race.date)+' · '+esc(code==='CUP'?centralTime(race.time):race.time)+' · '+esc(race.tv)+'</p></article>':'<p>No upcoming race listed.</p>';
   root.innerHTML=dadHTML(config,stats,schedule,race,brief);const current=()=>isCurrent()&&mine===ticket;
   document.getElementById('refresh-qualifying').onclick=()=>loadLineup(race,current,code);loadLineup(race,current,code);
  }catch{if(isCurrent()&&mine===ticket)root.innerHTML='<p class="empty">This series briefing could not load. Try choosing it again.</p>';}
 }
 selector.onchange=render;drivers.onchange=()=>{choices[selector.value]=[...drivers.selectedOptions].map(o=>o.value);render();};await render();
}