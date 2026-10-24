(function(){
  "use strict";
  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(Number.isFinite(value)?value:0);
  const percent = (value) => new Intl.NumberFormat("fr-FR",{maximumFractionDigits:1,minimumFractionDigits:1}).format(Number.isFinite(value)?value:0)+" %";
  const number = (id) => { const value=Number.parseFloat(String($(id).value||"0").replace(",",".")); return Number.isFinite(value)&&value>=0?value:0; };
  function calculate(){
    const price=number("price");
    const direct=["tiles","adhesive","grout","consumables","travel","otherCosts"].reduce((sum,id)=>sum+number(id),0);
    const rate=Math.min(100,number("socialRate"))/100;
    const monthlyFixed=number("monthlyFixed"), billableDays=number("billableDays"), jobDays=number("jobDays"), targetDaily=number("targetDaily");
    const fixed=billableDays>0?monthlyFixed/billableDays*jobDays:0;
    const social=price*rate, gross=price-direct, result=price-direct-social-fixed;
    const daily=jobDays>0?result/jobDays:null;
    const targetPrice=(1-rate)>0?(direct+fixed+targetDaily*jobDays)/(1-rate):null;
    const netRate=price>0?result/price*100:0;
    $("directTotal").textContent=money(direct); $("netResult").textContent=money(result);
    $("dailyResult").textContent=daily===null?"Renseigne la durée du chantier":money(daily)+" par jour";
    $("outPrice").textContent=money(price); $("outDirect").textContent="−"+money(direct); $("outSocial").textContent="−"+money(social); $("outFixed").textContent="−"+money(fixed);
    $("grossMargin").textContent=money(gross); $("netRate").textContent=percent(netRate);
    const status=$("goalStatus");
    if(jobDays<=0||billableDays<=0){status.textContent="Vérifie les durées renseignées";status.dataset.state="invalid";}
    else if(daily>=targetDaily){status.textContent="Objectif atteint";status.dataset.state="met";}
    else{status.textContent="Objectif non atteint";status.dataset.state="below";}
    if(targetPrice===null||!Number.isFinite(targetPrice)){
      $("targetPrice").textContent="Impossible à calculer"; $("targetDailyOutput").textContent="Le taux de cotisations doit être inférieur à 100 %."; $("targetDifference").textContent="";
    }else{
      $("targetPrice").textContent=money(targetPrice);
      $("targetDailyOutput").textContent="Pour viser "+money(targetDaily)+" par jour sur "+new Intl.NumberFormat("fr-FR",{maximumFractionDigits:1}).format(jobDays)+" jour(s).";
      const gap=targetPrice-price;
      $("targetDifference").textContent=gap>0?"Augmentation nécessaire : "+money(gap):"Le devis dépasse le prix cible de "+money(Math.abs(gap))+".";
    }
    return {price,direct,rate,social,fixed,gross,result,daily,targetDaily,targetPrice,netRate,jobDays,billableDays};
  }
  function summary(){
    const r=calculate();
    return ["LL CARRELAGE CONCEPTION — RENTABILITÉ ESTIMÉE","Prix facturé : "+money(r.price),"Coûts directs : "+money(r.direct),"Marge brute après coûts directs : "+money(r.gross),"Cotisations estimées ("+percent(r.rate*100)+") : "+money(r.social),"Frais fixes imputés : "+money(r.fixed),"Résultat avant impôt : "+money(r.result),"Résultat par jour : "+(r.daily===null?"non calculé":money(r.daily)),"Objectif : "+money(r.targetDaily)+" par jour","Prix cible estimé : "+(r.targetPrice===null?"non calculable":money(r.targetPrice)),"Taux restant sur le prix : "+percent(r.netRate),"Note : estimation indicative avant impôt sur le revenu."].join("\n");
  }
  async function copySummary(){
    const text=summary();
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText) await navigator.clipboard.writeText(text);
      else{const area=document.createElement("textarea");area.value=text;area.setAttribute("readonly","");area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();const copied=document.execCommand("copy");area.remove();if(!copied)throw new Error("copy failed");}
      $("copyStatus").textContent="Résumé de rentabilité copié.";
    }catch(error){$("copyStatus").textContent="Copie impossible sur ce navigateur.";}
  }
  $("profitForm").addEventListener("input",calculate);
  $("profitForm").addEventListener("change",calculate);
  $("profitForm").addEventListener("reset",()=>window.setTimeout(()=>{$("copyStatus").textContent="";calculate();},0));
  $("copyButton").addEventListener("click",copySummary);
  calculate();
})();
