import {esc,json} from './family-utils.js';

// ESPN's public site endpoints are unofficial. Keep parsing isolated so this
// small family dashboard can be adjusted if the response format changes.
const SITE='https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
const STANDINGS='https://site.api.espn.com/apis/v2/sports/football/nfl/standings';
const DIVISIONS=[
  ['AFC East',['BUF','MIA','NE','NYJ']],['AFC North',['BAL','CIN','CLE','PIT']],
  ['AFC South',['HOU','IND','JAX','TEN']],['AFC West',['DEN','KC','LAC','LV']],
  ['NFC East',['DAL','NYG','PHI','WAS']],['NFC North',['CHI','DET','GB','MIN']],
  ['NFC South',['ATL','CAR','NO','TB']],['NFC West',['ARI','LAR','SF','SEA']]
];
const ALIAS={JAC:'JAX',WSH:'WAS',WFT:'WAS',LA:'LAR',ARZ:'ARI',LVR:'LV',KCC:'KC',GNB:'GB',SFO:'SF',NOS:'NO',TBB:'TB'};
const TEAM_DIVISION=new Map(DIVISIONS.flatMap(([division,teams])=>teams.map(abbr=>[abbr,division])));
const canonical=abbr=>ALIAS[String(abbr??'').toUpperCase()]||String(abbr??'').toUpperCase();
const statNumber=(stats,name,fallback=0)=>{
  const s=(stats||[]).find(s=>s.name===name);
  const v=Number(s?.value??s?.displayValue);
  return Number.isFinite(v)?v:fallback;
};
export function flattenStandings(payload){
  const entries=new Map();
  function walk(node){
    for(const entry of node?.standings?.entries||[]){
      const team=entry.team||{},abbr=canonical(team.abbreviation);
      if(abbr&&TEAM_DIVISION.has(abbr))entries.set(abbr,entry);
    }
    for(const child of node?.children||[])walk(child);
  }
  walk(payload);
  return [...entries].map(([abbr,entry])=>{
    const stats=entry.stats||[];
    const w=statNumber(stats,'wins'),l=statNumber(stats,'losses'),t=statNumber(stats,'ties');
    return {abbr,division:TEAM_DIVISION.get(abbr),
      name:entry.team?.displayName||entry.team?.name||abbr,
      wins:w,losses:l,ties:t,
      pct:statNumber(stats,'winPercent',(w+t/2)/(w+l+t||1))};
  });
}
export function parseScoreboard(payload){
  return (payload?.events||[]).flatMap(event=>{
    const match=event.competitions?.[0];
    const away=match?.competitors?.find(t=>t.homeAway==='away');
    const home=match?.competitors?.find(t=>t.homeAway==='home');
    const date=event.date||match?.date;
    if(!away||!home||!date||!Number.isFinite(Date.parse(date)))return [];
    const status=event.status?.type||match.status?.type||{};
    const state=status.state||'pre';
    return [{id:event.id||date,date,
      away:away.team?.displayName||away.team?.shortDisplayName||away.team?.abbreviation||'Away',
      home:home.team?.displayName||home.team?.shortDisplayName||home.team?.abbreviation||'Home',
      awayScore:away.score,homeScore:home.score,
      state,detail:status.shortDetail||status.detail||'',
      completed:Boolean(status.completed)||state==='post'}];
  }).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
}
export function moveWeek(week,stage,direction){
  const next=week+direction;
  if(stage===2&&next===19)return {week:1,stage:3};
  if(stage===3&&next===0)return {week:18,stage:2};
  if(next<1||next>(stage===3?4:18))return null;
  return {week:next,stage};
}
const central=(date,options)=>new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',...options}).format(new Date(date));
export const centralDate=date=>central(date,{weekday:'long',month:'long',day:'numeric'});
export const centralKickoff=date=>central(date,{hour:'numeric',minute:'2-digit',timeZoneName:'short'});
const pct=n=>Number.isFinite(n)?n.toFixed(3).replace(/^0/,''):'—';
function standingsHTML(teams){
  if(!teams?.length)return '<p class="empty">NFL standings are temporarily unavailable. <a href="https://www.espn.com/nfl/standings" target="_blank" rel="noopener noreferrer">See standings on ESPN ↗</a></p>';
  return ['AFC','NFC'].map(conference=>{
    const divisions=DIVISIONS.filter(d=>d[0].startsWith(conference));
    return '<section class="nfl-conference"><h3>'+conference+'</h3><div class="nfl-division-grid">'+divisions.map(([name,abbrs])=>{
      const group=teams.filter(t=>abbrs.includes(t.abbr)).sort((a,b)=>b.pct-a.pct||b.wins-a.wins||a.losses-b.losses||a.name.localeCompare(b.name));
      return '<article class="nfl-division"><h4>'+esc(name)+'</h4><div class="nfl-table-wrap"><table><thead><tr><th scope="col">Team</th><th scope="col" title="Wins">W</th><th scope="col" title="Losses">L</th><th scope="col" title="Ties">T</th><th scope="col" title="Win percentage">PCT</th></tr></thead><tbody>'+
        (group.length?group.map(t=>'<tr><td>'+esc(t.name)+'</td><td>'+t.wins+'</td><td>'+t.losses+'</td><td>'+t.ties+'</td><td>'+esc(pct(t.pct))+'</td></tr>').join(''):'<tr><td colspan="5">No records yet</td></tr>')+
        '</tbody></table></div></article>';
    }).join('')+'</div></section>';
  }).join('');
}
function scheduleHTML(games){
  if(!games?.length)return '<p class="empty">This week’s schedule is unavailable. <a href="https://www.espn.com/nfl/schedule" target="_blank" rel="noopener noreferrer">See the NFL schedule on ESPN ↗</a></p>';
  const days=new Map();
  for(const game of games){
    const date=centralDate(game.date);
    if(!days.has(date))days.set(date,[]);
    days.get(date).push(game);
  }
  return [...days].map(([day,events])=>'<section class="nfl-day"><h4>'+esc(day)+'</h4><div class="nfl-games">'+events.map(g=>{
    const scheduled=g.state==='pre';
    const live=g.state==='in';
    const label=scheduled?'Upcoming':live?(g.detail||'Live'):(g.completed?'Final':g.detail||'Status unavailable');
    const score=(value)=>scheduled?'':('<strong class="nfl-score">'+esc(value??'—')+'</strong>');
    return '<article class="nfl-game"><div class="nfl-game-meta"><span>'+esc(centralKickoff(g.date))+'</span><span class="'+(live?'nfl-live':'')+'">'+esc(label)+'</span></div>'+
      '<div class="nfl-game-team"><span>'+esc(g.away)+'</span>'+score(g.awayScore)+'</div>'+
      '<div class="nfl-game-team"><span>'+esc(g.home)+'</span>'+score(g.homeScore)+'</div>'+
      '<div class="nfl-home-note">Away ↑ &nbsp; Home ↓</div></article>';
  }).join('')+'</div></section>').join('');
}
export function mountFootball(isCurrent){
  const el=document.getElementById('results');
  let season=new Date().getFullYear(),stage=2,week=1,teams=null,games=null,serial=0;
  let standingsLoading=true,scheduleLoading=true,standingsError=false,scheduleError=false;
  function paint(){
    if(!isCurrent())return;
    const stageName=stage===3?'Playoffs':'Regular season';
    el.innerHTML='<section class="nfl-page"><div class="nfl-title"><div><p class="eyebrow">FOOTBALL / NFL</p><h2>NFL at a glance</h2><p>Just the games and the standings. All kickoff times shown in Central Time.</p></div><button class="quiet" id="nfl-refresh" type="button">Refresh ↻</button></div>'+
      '<section class="nfl-section" aria-labelledby="nfl-schedule-heading"><div class="nfl-section-heading"><div><h3 id="nfl-schedule-heading">Schedule & scores</h3><p>'+esc(String(season))+' · '+esc(stageName)+' · Week '+week+'</p></div><div class="nfl-week-nav"><button id="nfl-prev" type="button" class="quiet" '+(!moveWeek(week,stage,-1)?'disabled':'')+' aria-label="Previous week">← Previous</button><button id="nfl-next" type="button" class="quiet" '+(!moveWeek(week,stage,1)?'disabled':'')+' aria-label="Next week">Next →</button></div></div>'+
      (scheduleLoading?'<p class="nfl-loading" role="status">Loading the weekly schedule…</p>':scheduleError?scheduleHTML(null):scheduleHTML(games))+'</section>'+
      '<section class="nfl-section" aria-labelledby="nfl-standings-heading"><div class="nfl-section-heading"><div><h3 id="nfl-standings-heading">Division standings</h3><p>Wins, losses, ties, and winning percentage. Sorted by win percentage; official tiebreakers may differ.</p></div></div>'+
      (standingsLoading?'<p class="nfl-loading" role="status">Loading team records…</p>':standingsError?standingsHTML(null):standingsHTML(teams))+'</section>'+
      '<p class="nfl-source">NFL information supplied by <a href="https://www.espn.com/nfl/" target="_blank" rel="noopener noreferrer">ESPN</a> through an unofficial, publicly available data feed. It refreshes when you open this tab, select another week or tap Refresh. Availability depends on ESPN. Independent fan site, not affiliated with the NFL or ESPN.</p></section>';
    document.getElementById('nfl-prev').onclick=()=>changeWeek(-1);
    document.getElementById('nfl-next').onclick=()=>changeWeek(1);
    document.getElementById('nfl-refresh').onclick=loadCurrent;
  }
  async function changeWeek(direction){
    const next=moveWeek(week,stage,direction);
    if(!next)return;
    ({week,stage}=next);
    const ticket=++serial;
    games=null;scheduleLoading=true;scheduleError=false;paint();
    try{
      const payload=await json(SITE+'?season='+season+'&seasontype='+stage+'&week='+week);
      if(!isCurrent()||ticket!==serial)return;
      games=parseScoreboard(payload);
      scheduleError=games.length===0;
    }catch{
      if(!isCurrent()||ticket!==serial)return;
      scheduleError=true;
    }
    scheduleLoading=false;paint();
  }
  async function loadCurrent(){
    const ticket=++serial;
    standingsLoading=true;scheduleLoading=true;standingsError=false;scheduleError=false;
    teams=null;games=null;paint();
    const [a,b]=await Promise.allSettled([json(SITE),json(STANDINGS+'?seasontype=2')]);
    if(!isCurrent()||ticket!==serial)return;
    if(b.status==='fulfilled'){
      teams=flattenStandings(b.value);
      standingsError=teams.length===0;
    }else standingsError=true;
    standingsLoading=false;
    if(a.status==='fulfilled'){
      const source=a.value;
      season=Number(source.season?.year)||season;
      const currentType=Number(source.season?.type)||2;
      stage=currentType===3?3:2;
      week=Math.max(1,Math.min(stage===3?4:18,Number(source.week?.number)||1));
      games=parseScoreboard(source);
      if(currentType===1||!games.length){
        // During preseason/offseason, offer the first regular-season week.
        stage=2;week=1;
        try{
          const future=await json(SITE+'?season='+season+'&seasontype=2&week=1');
          if(!isCurrent()||ticket!==serial)return;
          games=parseScoreboard(future);
        }catch{games=[];}
      }
      scheduleError=games.length===0;
    }else scheduleError=true;
    if(!isCurrent()||ticket!==serial)return;
    scheduleLoading=false;paint();
  }
  loadCurrent();
}
