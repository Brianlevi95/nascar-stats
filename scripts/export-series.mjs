import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {convert} from './export-data.mjs';
if(!process.argv[2])throw Error('Usage: node scripts/export-series.mjs PATH_TO_v_analysis.csv');
const output=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../data');
const source=convert(fs.readFileSync(process.argv[2],'utf8'));
const manifest={};
for(const code of ['CUP','XFINITY','TRUCK']){
 const series=source.rows.filter(r=>r.series_code===code&&r.season>=2022);
 if(!series.length)throw Error('Missing series '+code);
 for(const [key,field] of Map.groupBy(series,r=>r.race_key)){if(new Set(field.map(r=>r.finish)).size!==field.length||Math.max(...field.map(r=>r.finish))!==field.length)throw Error('Incomplete race '+key);}
 manifest[code]=[];
 for(const year of code==='CUP'?[null]:[...new Set(series.map(r=>r.season))].sort()){
  const rows=year===null?series:series.filter(r=>r.season===year);
  const data={schemaVersion:1,source:source.source,exportedAt:source.exportedAt,raceCount:new Set(rows.map(r=>r.race_key)).size,latestRaceDate:rows.map(r=>r.race_date).sort().at(-1),rows};
  const name=code==='CUP'?'stats.json':code.toLowerCase()+'-'+year+'.json';
  fs.writeFileSync(path.join(output,name+'.tmp'),JSON.stringify(data));
  manifest[code].push('./data/'+name);
 }
}
// All series must validate before replacing any published dataset.
for(const files of Object.values(manifest))for(const file of files){const name=path.basename(file);fs.renameSync(path.join(output,name+'.tmp'),path.join(output,name));}
fs.writeFileSync(path.join(output,'series-index.json'),JSON.stringify(manifest,null,2));
console.log('Validated and exported all three series since 2022. Review the diff before publishing.');