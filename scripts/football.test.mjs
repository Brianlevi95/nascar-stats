import test from 'node:test';
import assert from 'node:assert/strict';
import {flattenStandings,parseScoreboard,moveWeek,centralDate,centralKickoff} from '../football.js';

test('NFL standings are collected from nested conference and division responses without duplicates',()=>{
  const entry={team:{abbreviation:'WSH',displayName:'Washington Commanders'},stats:[{name:'wins',value:4},{name:'losses',value:2},{name:'ties',value:0},{name:'winPercent',value:2/3}]};
  const payload={children:[{standings:{entries:[entry]},children:[{standings:{entries:[entry]}}]}]};
  const result=flattenStandings(payload);
  assert.equal(result.length,1);
  assert.equal(result[0].division,'NFC East');
  assert.equal(result[0].wins,4);
});
test('Schedule detects final scores and sorts by kickoff',()=>{
  const game=(id,date)=>({id,date,status:{type:{state:'post',completed:true}},competitions:[{competitors:[{homeAway:'home',team:{displayName:'Chiefs'},score:'21'},{homeAway:'away',team:{displayName:'Bills'},score:'24'}]}]});
  const games=parseScoreboard({events:[game('late','2026-10-12T23:00:00Z'),game('early','2026-10-11T18:00:00Z')]});
  assert.equal(games[0].id,'early');
  assert.equal(games[1].awayScore,'24');
  assert.equal(games[1].completed,true);
});
test('Moves between last regular week and first playoff week',()=>{
  assert.deepEqual(moveWeek(18,2,1),{week:1,stage:3});
  assert.deepEqual(moveWeek(1,3,-1),{week:18,stage:2});
  assert.equal(moveWeek(1,2,-1),null);
});
test('NFL schedules render in Central Time, including daylight saving',()=>{
  assert.match(centralKickoff('2026-10-12T00:15:00Z'),/7:15 PM CDT/);
  assert.equal(centralDate('2026-10-12T00:15:00Z'),'Sunday, October 11');
});
