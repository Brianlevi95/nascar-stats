export const seriesNames={CUP:'Cup Series',XFINITY:'O’Reilly / Xfinity Series',TRUCK:'Craftsman Truck Series'};
const cache=new Map();
export async function loadSeries(code){
 if(!seriesNames[code])throw Error('Unknown series');
 if(!cache.has(code))cache.set(code,(async()=>{
  const manifestResponse=await fetch('./data/series-index.json',{cache:'no-cache'});if(!manifestResponse.ok)throw Error('Series index unavailable');const manifest=await manifestResponse.json();const paths=manifest[code];if(!Array.isArray(paths)||!paths.length)throw Error('No series files');
  const parts=await Promise.all(paths.map(async p=>{const r=await fetch(p,{cache:'no-cache'});if(!r.ok)throw Error('Series data unavailable');return r.json();}));
  const rows=parts.flatMap(p=>p.rows);
  if(parts.some(p=>p.schemaVersion!==1)||!rows.length||rows.some(r=>r.series_code!==code))throw Error('Invalid series dataset');
  const seen=new Set();for(const r of rows){const id=r.race_key+'|'+r.driver_key;if(seen.has(id))throw Error('Duplicate entry');seen.add(id);}
  return {schemaVersion:1,rows,raceCount:new Set(rows.map(r=>r.race_key)).size,latestRaceDate:rows.map(r=>r.race_date).sort().at(-1)};
 })().catch(e=>{cache.delete(code);throw e;}));
 return cache.get(code);
}