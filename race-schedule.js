import {esc,json,today,safeLink} from './family-utils.js?v=20261006ct';
const names={cup:'Cup Series',oreilly:'O’Reilly Auto Parts Series',trucks:'Craftsman Truck Series'};
const ctDate=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const ctTime=d=>new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(d);
const link=(url,label)=>safeLink(url)?`<a href="${esc(safeLink(url))}" target="_blank" rel="noopener">${esc(label)}</a>`:'';
export async function mountSchedule(isCurrent){
 const [schedule,details]=await Promise.all([json('./data/calendar-races.json'),json('./data/race-details.json')]);if(!isCurrent())return;
 const root=document.getElementById('results');
 root.innerHTML=`<h2>Race schedules · ${esc(schedule.season)}</h2><p>All start times are Central (CST/CDT). Scheduled starts may change.</p><div class="weather-form"><label>Series<select id="schedule-series"><option value="all">All three series</option>${Object.entries(names).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label><label>Show<select id="schedule-range"><option value="upcoming">Upcoming races</option><option value="all">Full season</option></select></label></div><p>Stage lengths show laps in each stage, followed by the laps where stages end. Tire sets distinguish fresh race sets, qualifying carryover, and the full weekend allotment. Fuel windows are estimates of green-flag laps on a full tank, when sourced; cautions, fuel saving, setup, and overtime change them.</p><div id="schedule-table"></div><p>${link(schedule.sourceUrl,'Official NASCAR season schedule')} · Schedule checked ${esc(schedule.checkedAt)} · Race details checked ${esc(details.checkedAt)}</p>`;
 const render=()=>{
  const series=root.querySelector('#schedule-series').value,range=root.querySelector('#schedule-range').value;
  const rows=schedule.races.filter(r=>(series==='all'||r.series===series)&&(range==='all'||ctDate(new Date(r.startAt))>=today()));
  root.querySelector('#schedule-table').innerHTML=`<div class="table-wrap"><table><thead><tr>${['Date','Series / Track','Start (Central) / TV','Stage lengths (laps)','Tire sets','Fuel run (laps)','Sources'].map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>{
   const d=details.races[r.id]??{},ends=d.stageEnds,stages=ends?.map((n,i)=>n-(ends[i-1]??0));
   const tires=d.tires?`${d.tires.raceNew} new + ${d.tires.qualifyingCarryover} qualifying carryover for race; ${d.tires.weekendTotal} weekend total (${d.tires.practice} practice)`: 'Not verified';
   const fuel=d.fuelRun?`${d.fuelRun.minLaps}–${d.fuelRun.maxLaps} estimated green-flag laps`:'Not verified';
   return `<tr><td>${esc(ctDate(new Date(r.startAt)))}</td><td><strong>${esc(names[r.series])}</strong><br>${esc(r.track)}</td><td>${esc(ctTime(new Date(r.startAt)))}<br>${esc(r.tv)}</td><td>${stages?`${stages.join(' / ')}<br><small>End laps: ${ends.join(' / ')}${d.stageStatus==='tentative'?' · Tentative':''}</small>`:'Not verified'}</td><td>${esc(tires)}</td><td>${esc(fuel)}</td><td>${[link(d.stageSource,'Stages'),link(d.tireSource,'Tires'),link(d.fuelRun?.sourceUrl,'Fuel estimate')].filter(Boolean).join('<br>')||'—'}</td></tr>`;
  }).join('')}</tbody></table></div>${rows.length?'':'<p>No races listed for this selection.</p>'}`;
 };
 root.querySelector('#schedule-series').onchange=render;root.querySelector('#schedule-range').onchange=render;render();
}

