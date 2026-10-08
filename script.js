const cats=[{k:"Necesidades",p:45,c:"--n"},{k:"Ahorro",p:25,c:"--a"},{k:"Crecimiento",p:15,c:"--c"},{k:"Libre",p:15,c:"--l"}];
const $=id=>document.getElementById(id);
const num=s=>parseFloat(String(s).replace(/\./g,"").replace(",","."))||0;
const fmt=n=>"$ "+Math.round(n).toLocaleString("es-CO");
const col=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
$("cfg").innerHTML=cats.map((c,i)=>`<div><label for="p${i}">${c.k} %</label><input id="p${i}" inputmode="decimal" value="${c.p}"></div>`).join("");
let resumen="";
function calc(){
  const monto=num($("monto").value);
  const extra=Math.min(num($("horas").value)*num($("vh").value),monto);
  const base=monto-extra;
  const pcts=cats.map((c,i)=>num($("p"+i).value));
  const suma=pcts.reduce((a,b)=>a+b,0);
  const vals=pcts.map(p=>base*p/100); vals[1]+=extra;
  const tot=vals.reduce((a,b)=>a+b,0);
  let acc=0,stops=[];
  vals.forEach((v,i)=>{const s=tot?acc/tot*100:0;acc+=v;const e=tot?acc/tot*100:0;stops.push(`${col(cats[i].c)} ${s}% ${e}%`)});
  $("ring").style.background=tot?`conic-gradient(${stops.join(",")})`:col("--line");
  $("total").textContent=fmt(tot);
  $("cards").innerHTML=cats.map((c,i)=>`<div class="box"><div class="t"><i style="background:var(${c.c})"></i>${c.k}</div><b>${fmt(vals[i])}</b>${i===1&&extra>0?`<small>incluye ${fmt(extra)} de horas extra</small>`:""}<div class="bar"><span><i style="width:${tot?vals[i]/tot*100:0}%;background:var(${c.c})"></i></span><small style="color:var(${c.c})">${pcts[i]}%</small></div></div>`).join("");
  const ok=Math.abs(suma-100)<0.001, e=$("estado");
  e.className="state"+(ok?"":" bad");
  e.textContent=ok?"Tus porcentajes suman 100%.":`Tus porcentajes suman ${suma}%. Ajústalos para llegar a 100%.`;
  resumen=`Ingreso: ${fmt(monto)}\n`+cats.map((c,i)=>`${c.k}: ${fmt(vals[i])}`).join("\n");
}
document.querySelectorAll("input").forEach(i=>i.addEventListener("input",calc));
$("copiar").onclick=async()=>{const b=$("copiar");try{await navigator.clipboard.writeText(resumen);b.textContent="Resumen copiado"}catch(e){b.textContent="No se pudo copiar"}setTimeout(()=>b.textContent="Copiar resumen",1800)};
calc();
