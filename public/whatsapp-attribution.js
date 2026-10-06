/* Clínica São Paulo — WhatsApp attribution bridge
 * Captures Google Ads/UTM attribution, creates a non-PII lead reference,
 * records the click at the Cloudflare Worker, and carries the reference
 * into the user's WhatsApp prefilled message.
 */
(function(){
  'use strict';
  var KEY='csp_whatsapp_attribution_v1';
  function params(){
    var p=new URLSearchParams(location.search), keys=['gclid','gbraid','wbraid','utm_source','utm_medium','utm_campaign','utm_term','utm_content'];
    var o={landing_page:location.pathname,landing_url:location.href,referrer:document.referrer||''};
    var ga=(document.cookie.match(/(?:^|; )_ga=([^;]+)/)||[])[1];
    if(ga){var parts=decodeURIComponent(ga).split('.'); if(parts.length>=4)o.ga_client_id=parts.slice(-2).join('.');}
    keys.forEach(function(k){var v=p.get(k);if(v)o[k]=v});
    return o;
  }
  function id(){
    var a=new Uint8Array(5); crypto.getRandomValues(a);
    return 'CSP-'+Array.from(a).map(function(x){return x.toString(16).padStart(2,'0')}).join('').toUpperCase();
  }
  function get(){
    try { return JSON.parse(localStorage.getItem(KEY)||'null'); } catch(e){ return null; }
  }
  function save(v){ try{localStorage.setItem(KEY,JSON.stringify(v));sessionStorage.setItem(KEY,JSON.stringify(v));}catch(e){} }
  function track(link){
    if(link.dataset.cspTracked==='1') return;
    link.dataset.cspTracked='1';
    link.addEventListener('click',function(){
      var old=get(), lead=(old&&old.lead_id)||id(), a=Object.assign({},old||{},params(),{lead_id:lead,clicked_at:new Date().toISOString(),page_title:document.title});
      save(a);
      var u;
      try { u=new URL(link.href,location.href); } catch(e) { return; }
      var text=u.searchParams.get('text')||'Olá! Quero agendar uma avaliação.';
      if(text.indexOf(lead)===-1) text += ' [Ref: '+lead+']';
      u.searchParams.set('text',text);
      var payload=JSON.stringify({type:'click',lead_id:lead,attribution:a});
      try{
        if(navigator.sendBeacon){navigator.sendBeacon('/api/lead-click',new Blob([payload],{type:'application/json'}));}
        else{fetch('/api/lead-click',{method:'POST',headers:{'content-type':'application/json'},body:payload,keepalive:true}).catch(function(){});}
      }catch(e){}
      if(window.zaraz&&typeof window.zaraz.track==='function'){
        window.zaraz.track('clique_whatsapp',Object.assign({event_label:document.title,lead_id:lead},a));
      }
      link.href=u.toString();
    },{passive:true});
  }
  document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('.whatsapp-track').forEach(track);});
})();
