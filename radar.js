import {esc,json,centralStamp} from './family-utils.js?v=20261006ct';
let cleanup=()=>{},library;
export function cancelRadar(){cleanup();cleanup=()=>{};}
function leaflet(){
 if(window.L)return Promise.resolve(window.L);
 if(library)return library;
 library=new Promise((resolve,reject)=>{
  const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.append(css);
  const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload=()=>resolve(window.L);script.onerror=()=>{library=null;script.remove();reject(new Error('Map library unavailable'));};document.head.append(script);
 });return library;
}
export async function mountRadar(place,isCurrent){
 cancelRadar();const root=document.getElementById('weather-radar');if(!root)return;
 root.innerHTML=`<h3>Weather radar — ${esc(place.name)}</h3><p>Recent precipitation radar. Pan or zoom the map, then press Play to follow the last two hours. All frame times are Central (CST/CDT).</p><div id="radar-map" style="height:440px;max-height:65vh;border-radius:12px;isolation:isolate" aria-label="Precipitation radar map"></div><div class="weather-form" style="margin-top:12px"><button id="radar-play" disabled type="button">Play</button><label style="flex:1;min-width:160px">Radar frame<input id="radar-frame" type="range" min="0" max="0" value="0" disabled style="width:100%"></label><button id="radar-refresh" type="button">Refresh radar</button></div><p id="radar-time" aria-live="polite">Loading radar…</p><p>Light rain: blue/green · heavier rain: yellow/red · snow: pink/purple. Radar shows precipitation, not wind velocity. Frame times describe the composite image; individual radar scans may be older. Blank areas may have no precipitation or no coverage.</p><p>Weather data by <a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a> · <a href="https://radar.weather.gov/" target="_blank" rel="noopener">Open National Weather Service radar</a></p>`;
 let alive=true,map,layer,animation,refreshTimer,frames=[],host,index=0,busy=false;
 const play=root.querySelector('#radar-play'),slider=root.querySelector('#radar-frame'),stamp=root.querySelector('#radar-time'),refresh=root.querySelector('#radar-refresh');
 const stop=()=>{clearInterval(animation);animation=null;play.textContent='Play';};
 cleanup=()=>{alive=false;stop();clearInterval(refreshTimer);map?.remove();};
 const current=()=>alive&&isCurrent()&&root.isConnected;
 const show=i=>{if(!current()||!frames.length)return;index=i;slider.value=String(i);if(layer)map.removeLayer(layer);layer=window.L.tileLayer(host+frames[i].path+'/256/{z}/{x}/{y}/2/1_1.png',{opacity:.75,maxNativeZoom:7,maxZoom:12,attribution:'<a href="https://www.rainviewer.com/">RainViewer</a>'}).addTo(map);stamp.textContent='Radar frame: '+centralStamp(new Date(frames[i].time*1000).toISOString())+(i===frames.length-1?' · Latest available':'');slider.setAttribute('aria-valuetext',stamp.textContent);};
 async function update(){
  if(busy||!current())return;busy=true;refresh.disabled=true;stop();
  try{const data=await json('https://api.rainviewer.com/public/weather-maps.json');if(!current())return;
   const next=(data.radar?.past??[]).filter(f=>Number.isFinite(f.time)&&/^\/v2\/radar\//.test(f.path)).sort((a,b)=>a.time-b.time);
   if(!next.length||!/^https:\/\//.test(data.host))throw new Error('No radar frames');
   frames=next;host=data.host;slider.max=String(frames.length-1);slider.disabled=false;play.disabled=frames.length<2;show(frames.length-1);
  }catch{if(current())stamp.textContent=frames.length?'Radar refresh unavailable; showing previously loaded frames.':'Radar unavailable. Please try Refresh radar or open the National Weather Service radar below.';}
  finally{busy=false;if(current())refresh.disabled=false;}
 }
 try{const L=await leaflet();if(!current())return;map=L.map(root.querySelector('#radar-map'),{scrollWheelZoom:false}).setView([Number(place.latitude),Number(place.longitude)],7);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:12,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
  L.circleMarker([place.latitude,place.longitude],{radius:5,color:'#111',fillColor:'#fff',fillOpacity:1}).addTo(map).bindTooltip(esc(place.name));
  slider.oninput=()=>{stop();show(Number(slider.value));};
  play.onclick=()=>{if(animation){stop();return;}play.textContent='Pause';animation=setInterval(()=>show((index+1)%frames.length),700);};
  refresh.onclick=update;await update();if(current())refreshTimer=setInterval(update,300000);
 }catch{if(current())stamp.textContent='Radar map unavailable. Open the National Weather Service radar below.';}
}
