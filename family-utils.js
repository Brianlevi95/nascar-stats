export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const safeLink=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
export async function json(url){const r=await fetch(url,{cache:'no-cache',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Data unavailable');return r.json();}
export const table=(head,rows)=>`<div class="table-wrap"><table><thead><tr>${head.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
// NASCAR source times remain Eastern in the data; render them in US Central.
export function centralTime(text){return String(text??'').replace(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*(?:ET|EST|EDT)\b/gi,(_,h,m,ap)=>{let hour=Number(h)%12+(ap.toUpperCase()==='PM'?12:0);hour=(hour+23)%24;return `${hour%12||12}:${m??'00'} ${hour>=12?'PM':'AM'} CT`;});}
export function centralStamp(value){if(!value)return '';if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value;const date=new Date(value);return Number.isNaN(date.getTime())?value:date.toLocaleString('en-US',{timeZone:'America/Chicago',timeZoneName:'short'});}
