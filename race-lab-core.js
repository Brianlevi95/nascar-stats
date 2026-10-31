export const finite=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
export const mean=values=>{const n=values.filter(x=>finite(x)!==null);return n.length?n.reduce((a,b)=>a+b,0)/n.length:null;};
export function selectRows(rows,filters={}){
 return rows.filter(r=>(!filters.season||String(r.season)===String(filters.season))&&(!filters.track||r.track===filters.track));
}
export function racesFor(rows){
 const map=new Map();
 for(const r of rows)if(!map.has(r.race_key))map.set(r.race_key,{race_key:r.race_key,race_name:r.race_name,race_date:r.race_date,track:r.track,season:r.season});
 return [...map.values()].sort((a,b)=>b.race_date.localeCompare(a.race_date)||(b.race_key.localeCompare(a.race_key)));
}
export function raceField(rows,key){
 return rows.filter(r=>r.race_key===key).sort((a,b)=>a.finish-b.finish);
}
export function raceMetrics(row){
 return {
  startGain:finite(row.start)!==null&&finite(row.finish)!==null?row.start-row.finish:null,
  finishVsRunning:finite(row.avg_running_pos)!==null&&finite(row.finish)!==null?row.avg_running_pos-row.finish:null
 };
}
export function driverAggregates(rows,minStarts=1){
 const map=new Map();
 for(const r of rows){const key=r.driver_key;if(!map.has(key))map.set(key,[]);map.get(key).push(r);}
 const results=[];
 for(const group of map.values()){
  if(group.length<minStarts)continue;
  const first=group[0],gains=group.map(r=>raceMetrics(r));
  results.push({
   key:first.driver_key,driver:first.driver,starts:group.length,
   wins:group.filter(r=>r.finish===1).length,
   top10:group.filter(r=>finite(r.finish)!==null&&r.finish<=10).length,
   avgFinish:mean(group.map(r=>r.finish)),
   avgStart:mean(group.map(r=>r.start)),
   avgRunning:mean(group.map(r=>r.avg_running_pos)),
   rating:mean(group.map(r=>r.result_driver_rating)),
   positions:mean(gains.map(r=>r.startGain)),
   closing:mean(gains.map(r=>r.finishVsRunning)),
   lapsLed:group.reduce((s,r)=>s+(finite(r.laps_led)??0),0)
  });
 }
 return results;
}
export function rankedDrivers(rows,minStarts=1,metric='rating'){
 const descending=new Set(['rating','positions','closing','wins','top10','lapsLed']);
 const ranked=driverAggregates(rows,minStarts);
 const high=descending.has(metric);
 return ranked.sort((a,b)=>{
  const av=finite(a[metric]),bv=finite(b[metric]);
  if(av===null)return bv===null?a.driver.localeCompare(b.driver):1;
  if(bv===null)return -1;
  return (high?bv-av:av-bv)||a.driver.localeCompare(b.driver);
 });
}
export function driverTimeline(rows,driverKey,limit=20){
 const history=rows.filter(r=>r.driver_key===driverKey).sort((a,b)=>a.race_date.localeCompare(b.race_date)||a.race_key.localeCompare(b.race_key));
 const all=history.map((r,i)=>{
  const gain=raceMetrics(r);
  return {...r,startGain:gain.startGain,finishVsRunning:gain.finishVsRunning,
   rollingFinish:mean(history.slice(Math.max(0,i-4),i+1).map(x=>x.finish)),
   rollingRating:mean(history.slice(Math.max(0,i-4),i+1).map(x=>x.result_driver_rating)),
   rollingRunning:mean(history.slice(Math.max(0,i-4),i+1).map(x=>x.avg_running_pos)),
   rollingGain:mean(history.slice(Math.max(0,i-4),i+1).map(x=>raceMetrics(x).startGain))
  };
 });
 return all.slice(-limit);
}
