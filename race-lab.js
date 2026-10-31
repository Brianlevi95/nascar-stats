import {loadSeries,seriesNames} from './series-data.js?v=20261028';
import {esc} from './family-utils.js?v=20261006ct';
import {finite,mean,selectRows,racesFor,raceField,raceMetrics,rankedDrivers,driverTimeline} from './race-lab-core.js?v=20261031a';

const names={finish:'Finishing position',avg_running_pos:'Average running position',result_driver_rating:'Driver rating',startGain:'Positions gained vs start'};
const trail={finish:'rollingFinish',avg_running_pos:'rollingRunning',result_driver_rating:'rollingRating',startGain:'rollingGain'};
const num=(x,d=1)=>finite(x)===null?'—':Number(x).toFixed(d);
const select=(items,value)=>items.map(([key,label])=>'<option value="'+esc(key)+'"'+(String(key)===String(value)?' selected':'')+'>'+esc(label)+'</option>').join('');
const prettyDate=date=>{const [y,m,d]=date.split('-').map(Number);return new Date(Date.UTC(y,m-1,d,12)).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});};
const table=(headers,rows)=>'<div class="lab-table"><table><thead><tr>'+headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(cols=>'<tr>'+cols.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
const kpi=(label,value,detail='')=>'<div class="lab-kpi"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><span>'+esc(detail)+'</span></div>';
const empty=message=>'<p class="lab-placeholder">'+esc(message)+'</p>';
const sorted=(array,key,ascending=true)=>[...array].filter(r=>finite(r[key])!==null).sort((a,b)=>ascending?a[key]-b[key]:b[key]-a[key]);

function scatter(field){
 const valid=field.filter(r=>finite(r.avg_running_pos)!==null&&finite(r.finish)!==null);
 if(valid.length<2)return empty('Average running position is not available for this race.');
 const max=Math.max(...valid.flatMap(r=>[r.finish,r.avg_running_pos]),5);
 const w=800,h=400,left=56,right=18,top=26,bottom=53;
 const x=v=>left+(v/max)*(w-left-right),y=v=>top+(v/max)*(h-top-bottom);
 let svg='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Scatter plot comparing average running position on the horizontal axis against finishing position on the vertical axis. Lower is better on both axes.">';
 for(let tick=0;tick<=4;tick++){const value=max*tick/4,px=x(value),py=y(value);svg+='<line x1="'+px+'" y1="'+top+'" x2="'+px+'" y2="'+(h-bottom)+'"/><line x1="'+left+'" y1="'+py+'" x2="'+(w-right)+'" y2="'+py+'"/><text text-anchor="middle" x="'+px+'" y="'+(h-29)+'">'+num(value,0)+'</text><text text-anchor="end" x="'+(left-10)+'" y="'+(py+4)+'">'+num(value,0)+'</text>';}
 svg+='<line class="lab-diagonal" x1="'+left+'" y1="'+top+'" x2="'+(w-right)+'" y2="'+(h-bottom)+'"/><text text-anchor="middle" x="'+(w/2)+'" y="'+(h-6)+'">Average running position (lower = better)</text><text x="4" y="13">Finish</text>';
 for(const r of valid){const title=esc(r.driver+' · avg running '+num(r.avg_running_pos)+' · finish '+r.finish);svg+='<circle cx="'+x(r.avg_running_pos).toFixed(1)+'" cy="'+y(r.finish).toFixed(1)+'" r="6"><title>'+title+'</title></circle>';}
 return '<div class="lab-chart">'+svg+'</svg><p class="lab-chart-note">Each dot is a driver. The dashed diagonal shows where a driver finished at the same position as their race-average running position. This is <strong>not</strong> a lap-time chart.</p></div>';
}
function trendChart(timeline,metric){
 const key=metric,rollingKey=trail[metric],data=timeline.filter(r=>finite(r[key])!==null);
 if(data.length<2)return empty('At least two races with this statistic are required for a trend chart.');
 const values=data.flatMap(r=>[r[key],r[rollingKey]]).filter(x=>finite(x)!==null);
 let min=Math.min(...values),max=Math.max(...values);if(min===max){min-=1;max+=1;}
 const pad=(max-min)*.12;min-=pad;max+=pad;
 const w=820,h=345,left=55,right=20,top=22,bottom=52;
 const x=i=>left+(i/(data.length-1))*(w-left-right),y=v=>top+(max-v)/(max-min)*(h-top-bottom);
 let svg='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(names[metric])+' for the last '+data.length+' races with a five-race rolling average">';
 for(let i=0;i<=4;i++){const v=min+(max-min)*i/4,py=y(v);svg+='<line x1="'+left+'" y1="'+py+'" x2="'+(w-right)+'" y2="'+py+'"/><text x="'+(left-9)+'" y="'+(py+4)+'" text-anchor="end">'+num(v,1)+'</text>';}
 const points=data.map((r,i)=>x(i)+','+y(r[key]).toFixed(1)).join(' ');
 const roll=data.filter(r=>finite(r[rollingKey])!==null).map(r=>x(data.indexOf(r))+','+y(r[rollingKey]).toFixed(1)).join(' ');
 svg+='<polyline points="'+points+'"/><polyline class="lab-rolling" points="'+roll+'"/>';
 for(let i=0;i<data.length;i++){const r=data[i],tooltip=esc(r.race_date+' '+r.track+' · '+names[metric]+': '+num(r[key]));svg+='<circle cx="'+x(i).toFixed(1)+'" cy="'+y(r[key]).toFixed(1)+'" r="4"><title>'+tooltip+'</title></circle>';if(i%Math.max(1,Math.ceil(data.length/6))===0||i===data.length-1)svg+='<text text-anchor="middle" x="'+x(i).toFixed(1)+'" y="'+(h-22)+'">'+esc(r.race_date.slice(5))+'</text>';}
 return '<div class="lab-chart">'+svg+'</svg><p class="lab-chart-note">Green: each race · Brown: trailing average of up to five races, calculated using only that race and earlier races. '+(metric==='finish'||metric==='avg_running_pos'?'Lower is better.':metric==='startGain'?'Positive values mean finishing ahead of the starting position.':'Higher is better.')+'</p></div>';
}
function racePanel(rows,chosen){
 const field=raceField(rows,chosen);
 if(!field.length)return empty('Choose a race to view its results.');
 const race=field[0],winner=field.find(r=>r.finish===1);
 const rated=sorted(field,'result_driver_rating',false)[0],bestRunning=sorted(field,'avg_running_pos')[0];
 const gain=field.map(r=>({...r,...raceMetrics(r)})),bestMover=sorted(gain,'startGain',false)[0];
 const header='<h3>'+esc(race.race_name)+'</h3><p>'+esc(prettyDate(race.race_date))+' · '+esc(race.track)+' · '+field.length+' starters</p>';
 const kpis='<div class="lab-grid">'+
 kpi('Winner',winner?.driver||'—','Official finishing order')+
 kpi('Highest driver rating',rated?.driver||'—',rated?'Rating '+num(rated.result_driver_rating):'No rating')+
 kpi('Best average running position',bestRunning?.driver||'—',bestRunning?'Avg position '+num(bestRunning.avg_running_pos):'No data')+
 kpi('Most positions gained',bestMover?.driver||'—',bestMover?'Start to finish: '+(bestMover.startGain>0?'+':'')+num(bestMover.startGain,0):'No data')+
 kpi('Laps led leader',sorted(field,'laps_led',false)[0]?.driver||'—',num(sorted(field,'laps_led',false)[0]?.laps_led,0)+' laps')+
 kpi('Finish vs running position', 'See scatter plot','Distinguishes strong finish from race-long position')+'</div>';
 const tableRows=gain.map(r=>[r.finish,r.driver,r.start,num(r.startGain,0),num(r.avg_running_pos),num(r.result_driver_rating),num(r.laps_led,0),num(r.finishVsRunning)]);
 return header+kpis+scatter(field)+'<h3>Race performance table</h3><p>Position change = start − finish. Finish vs average = average running position − finish; positive means a better finish than the car’s race-average position. These are not pit-road gains or green-flag passing statistics.</p>'+
 table(['Finish','Driver','Start','Position change','Avg running pos.','Driver rating','Laps led','Finish vs avg.'],tableRows);
}
function trendPanel(rows,driver,metric){
 const drivers=[...new Map(rows.map(r=>[r.driver_key,r.driver])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
 if(!drivers.length)return empty('No drivers match the season and track filters.');
 const chosen=drivers.find(([id])=>id===driver)?.[0]||drivers[0][0];
 const timeline=driverTimeline(rows,chosen,20);
 const display=drivers.find(x=>x[0]===chosen)[1];
 const controls='<div class="lab-toolbar"><label>Driver<select id="lab-driver">'+select(drivers,chosen)+'</select></label><label>Trend metric<select id="lab-metric">'+select(Object.entries(names),metric)+'</select></label></div>';
 const entries=timeline.map(r=>[prettyDate(r.race_date),r.track,r.finish,r.start,num(r.startGain,0),num(r.avg_running_pos),num(r.result_driver_rating),num(r.rollingFinish)]);
 return controls+'<h3>'+esc(display)+' · last '+timeline.length+' races</h3><p>Performance over time for the selected season and track. Dates run oldest to newest.</p>'+trendChart(timeline,metric)+table(['Date','Track','Finish','Start','Gain','Avg running','Rating','5-race avg finish'],entries);
}
function moversPanel(rows,min,rank){
 const count=Number(min),board=rankedDrivers(rows,count,rank);
 const sorts=[['rating','Average driver rating'],['avgRunning','Average running position'],['avgFinish','Average finish'],['positions','Average positions gained'],['closing','Average finish vs running position'],['lapsLed','Total laps led'],['top10','Top 10 finishes']];
 const controls='<div class="lab-toolbar"><label>Rank by<select id="lab-rank">'+select(sorts,rank)+'</select></label><label>Minimum starts<select id="lab-min">'+select([[1,'1 start'],[3,'3 starts'],[5,'5 starts'],[10,'10 starts']],count)+'</select></label></div>';
 if(!board.length)return controls+empty('No drivers meet the minimum starts requirement. Try fewer starts or a broader filter.');
 const rowsOut=board.map((r,i)=>[i+1,r.driver,r.starts,r.wins,r.top10,num(r.avgFinish),num(r.avgRunning),num(r.rating),num(r.positions),num(r.closing),num(r.lapsLed,0)]);
 return controls+'<h3>Who has performed best?</h3><p>Sortable driver averages using the selected races. Position change means start to finish, not on-track passes. Finish vs running position uses the entire race average, not pit-stop data.</p>'+table(['Rank','Driver','Starts','Wins','Top 10','Avg finish','Avg running','Avg rating','Avg gain','Finish vs avg.','Laps led'],rowsOut);
}
export function mountRaceLab(isCurrent){
 const el=document.getElementById('results');
 let series='CUP',season='',track='',view='race',race='',driver='',metric='finish',min=5,rank='rating',data=null,version=0;
 function paint(){
  if(!isCurrent())return;
  if(!data){el.innerHTML='<p role="status">Loading Race Lab statistics…</p>';return;}
  const years=[...new Set(data.rows.map(r=>r.season))].sort((a,b)=>b-a);
  const filtered=selectRows(data.rows,{season,track}),races=racesFor(filtered);
  if(!races.some(r=>r.race_key===race))race=races[0]?.race_key||'';
  const tracks=[...new Set(selectRows(data.rows,{season}).map(r=>r.track))].sort((a,b)=>a.localeCompare(b));
  if(track&&!tracks.includes(track)){track='';return paint();}
  const optionsYear=[['','All years'],...years.map(y=>[y,String(y)])];
  const html='<div class="lab"><div class="lab-head"><div><p class="eyebrow">NASCAR / ADVANCED ANALYSIS</p><h2>Race Lab</h2><p>Visualize race performance and driver form, beyond the finishing order.</p></div><div class="lab-meta">'+esc(seriesNames[series])+'<br>'+esc(data.raceCount)+' races · Updated through '+esc(data.latestRaceDate)+'</div></div>'+
   '<div class="lab-filters"><label>Series<select id="lab-series">'+select([['CUP','Cup Series'],['XFINITY','O’Reilly / Xfinity'],['TRUCK','Craftsman Trucks']],series)+'</select></label><label>Season<select id="lab-season">'+select(optionsYear,season)+'</select></label><label>Track<select id="lab-track">'+select([['','All tracks'],...tracks.map(t=>[t,t])],track)+'</select></label></div>'+
   '<div class="lab-views" aria-label="Race Lab views">'+[['race','Race Snapshot'],['trends','Driver Trends'],['movers','Performance Rankings']].map(([k,v])=>'<button type="button" data-lab-view="'+k+'" aria-pressed="'+(view===k)+'">'+v+'</button>').join('')+'</div>'+
   '<section class="lab-panel">'+(view==='race'?'<div class="lab-toolbar"><label>Completed race<select id="lab-race">'+select(races.map(r=>[r.race_key,prettyDate(r.race_date)+' · '+r.track+' · '+r.race_name]),race)+'</select></label></div>'+racePanel(filtered,race):view==='trends'?trendPanel(filtered,driver,metric):moversPanel(filtered,min,rank))+'</section>'+
   '<p class="lab-source"><strong>What this data is:</strong> Starting/finishing positions, laps led, full-race average running position and driver rating from the published Stats Manager export. It is not lap-by-lap telemetry or pit stop timing. Those require a separate verified race-level import. <a href="https://feed.nascar.com/swagger/ui/index" target="_blank" rel="noopener noreferrer">NASCAR timing-feed documentation ↗</a></p></div>';
  el.innerHTML=html;
  document.getElementById('lab-series').onchange=e=>{series=e.target.value;season='';track='';race='';driver='';load();};
  document.getElementById('lab-season').onchange=e=>{season=e.target.value;track='';race='';driver='';paint();};
  document.getElementById('lab-track').onchange=e=>{track=e.target.value;race='';driver='';paint();};
  document.querySelectorAll('[data-lab-view]').forEach(b=>b.onclick=()=>{view=b.dataset.labView;paint();});
  const raceEl=document.getElementById('lab-race');if(raceEl)raceEl.onchange=e=>{race=e.target.value;paint();};
  const driverEl=document.getElementById('lab-driver');if(driverEl){if(!driver)driver=driverEl.value;driverEl.onchange=e=>{driver=e.target.value;paint();};}
  const metricEl=document.getElementById('lab-metric');if(metricEl)metricEl.onchange=e=>{metric=e.target.value;paint();};
  const minEl=document.getElementById('lab-min');if(minEl)minEl.onchange=e=>{min=Number(e.target.value);paint();};
  const rankEl=document.getElementById('lab-rank');if(rankEl)rankEl.onchange=e=>{rank=e.target.value;paint();};
 }
 async function load(){
  const ticket=++version;data=null;paint();
  try{const loaded=await loadSeries(series);if(!isCurrent()||ticket!==version)return;data=loaded;season=String(Math.max(...new Set(data.rows.map(r=>r.season))));paint();}
  catch(e){if(isCurrent()&&ticket===version){el.innerHTML='<p class="empty">Race Lab data could not load. Try returning to this tab or refresh the page.</p>';console.error(e);}}
 }
 load();
}
