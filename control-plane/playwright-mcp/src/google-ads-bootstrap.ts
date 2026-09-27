import { DurableObject } from "cloudflare:workers";

type AdsEnv = {
  GOOGLE_ADS_REFRESH_TOKEN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_ADS_CUSTOMER_ID?: string;
  GOOGLE_ADS_LOGIN_CUSTOMER_ID?: string;
  GOOGLE_OAUTH_STORE: DurableObjectNamespace;
};

const API = "https://googleads.googleapis.com/v25";
const DEFAULT_CUSTOMER = "4603647788";
const CAMPAIGN_NAME = "SEARCH | PARNAMIRIM | ALTA INTENÇÃO";
const FINAL_URL = "https://www.clinicasaopauloparnamirim.com.br/";

async function accessToken(env: AdsEnv) {
  let refresh = env.GOOGLE_ADS_REFRESH_TOKEN || "";
  if (!refresh) {
    const store = env.GOOGLE_OAUTH_STORE.get(env.GOOGLE_OAUTH_STORE.idFromName("google"));
    const r = await store.fetch("https://store.internal/ads-refresh-token");
    if (r.ok) refresh = await r.text();
  }
  if (!refresh || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) throw new Error("Google Ads OAuth is not configured.");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method:"POST", headers:{"content-type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,refresh_token:refresh,grant_type:"refresh_token"})
  });
  if (!r.ok) throw new Error("Google OAuth token refresh failed: " + r.status);
  const data = await r.json() as {access_token?:string};
  if (!data.access_token) throw new Error("Google did not return an access token.");
  return data.access_token;
}

async function ads(env: AdsEnv, path: string, body: unknown) {
  const customer = (env.GOOGLE_ADS_CUSTOMER_ID || DEFAULT_CUSTOMER).replace(/-/g,"");
  const token = await accessToken(env);
  const headers:Record<string,string> = {authorization:`Bearer ${token}`,"content-type":"application/json"};
  if (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) headers["login-customer-id"] = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g,"");
  const r = await fetch(`${API}/customers/${customer}/${path}`,{method:"POST",headers,body:JSON.stringify(body)});
  const raw = await r.text();
  let data:any; try { data = raw ? JSON.parse(raw) : null; } catch { data = {raw}; }
  if (!r.ok) throw new Error(`Google Ads API ${r.status}: ${JSON.stringify(data).slice(0,4000)}`);
  return data;
}

const groups:Record<string,{keywords:Array<[string,string]>;h1:string[];h2:string[]}> = {
"Clínica":{keywords:[
["clínica odontológica parnamirim","PHRASE"],["clínica odontológica parnamirim","EXACT"],["dentista parnamirim","PHRASE"],["dentista parnamirim","EXACT"],["dentista em parnamirim","PHRASE"],["dentista em parnamirim","EXACT"],["clínica odontológica em parnamirim","PHRASE"],["clínica odontológica em parnamirim","EXACT"]],
h1:["Clínica Odonto Parnamirim","Dentista em Parnamirim","Agende Sua Avaliação","Clínica São Paulo Parnamirim","Cuidamos do Seu Sorriso","Avaliação Individual","Atendimento em Parnamirim","Fale Conosco no WhatsApp","Agende Pelo WhatsApp","Seu Sorriso Merece Cuidado","Clínica no Centro","Dentista Perto de Você"],
h2:["Dentista em Parnamirim","Clínica Odonto Parnamirim","Agende Sua Avaliação","Clínica São Paulo Parnamirim","Atendimento em Parnamirim","Avaliação Individual","Cuide do Seu Sorriso","Fale no WhatsApp","Agende Pelo WhatsApp","Clínica no Centro","Atendimento Odontológico","Seu Sorriso Merece Cuidado"]},
"Hiperlocal":{keywords:[
["dentista nova parnamirim","PHRASE"],["dentista nova parnamirim","EXACT"],["dentista centro parnamirim","PHRASE"],["dentista centro parnamirim","EXACT"],["dentista perto de mim parnamirim","PHRASE"]],
h1:["Dentista em Parnamirim","Dentista em Nova Parnamirim","Clínica no Centro","Agende Sua Avaliação","Clínica São Paulo Parnamirim","Dentista Perto de Você","Atendimento em Parnamirim","Avaliação Individual","Agende Pelo WhatsApp","Fale Conosco no WhatsApp","Cuidamos do Seu Sorriso","Seu Sorriso Merece Cuidado"],
h2:["Nova Parnamirim Tem Dentista","Clínica no Centro","Dentista Perto de Você","Agende Sua Avaliação","Clínica São Paulo Parnamirim","Atendimento em Parnamirim","Avaliação Individual","Fale no WhatsApp","Agende Pelo WhatsApp","Cuide do Seu Sorriso","Atendimento Odontológico","Dentista em Parnamirim"]},
"Ortodontia":{keywords:[
["aparelho ortodôntico parnamirim","PHRASE"],["aparelho ortodôntico parnamirim","EXACT"],["ortodontista parnamirim","PHRASE"],["ortodontista parnamirim","EXACT"],["clínica que coloca aparelho nos dentes","PHRASE"],["clínica para colocar aparelho nos dentes","PHRASE"],["dentista que mexe com aparelho","PHRASE"]],
h1:["Aparelho Ortodôntico","Ortodontia em Parnamirim","Dentista em Parnamirim","Agende Sua Avaliação","Clínica São Paulo Parnamirim","Avaliação para Aparelho","Cuidamos do Seu Sorriso","Atendimento em Parnamirim","Fale Conosco no WhatsApp","Agende Pelo WhatsApp","Seu Sorriso Merece Cuidado","Clínica Odonto Parnamirim"],
h2:["Aparelho Ortodôntico em Parnamirim","Ortodontia em Parnamirim","Avaliação para Aparelho","Dentista em Parnamirim","Clínica São Paulo Parnamirim","Agende Sua Avaliação","Atendimento em Parnamirim","Fale no WhatsApp","Agende Pelo WhatsApp","Cuide do Seu Sorriso","Avaliação Individual","Clínica Odonto"]},
"Serviços":{keywords:[
["clareamento dental parnamirim","PHRASE"],["clareamento dental parnamirim","EXACT"],["faceta de resina parnamirim","PHRASE"],["faceta de resina parnamirim","EXACT"],["restauração estética parnamirim","PHRASE"],["limpeza dental parnamirim","PHRASE"]],
h1:["Clareamento Dental Parnamirim","Facetas de Resina","Restauração Estética","Limpeza Dental Parnamirim","Dentista em Parnamirim","Clínica São Paulo Parnamirim","Agende Sua Avaliação","Cuidamos do Seu Sorriso","Atendimento em Parnamirim","Avaliação Individual","Fale Conosco no WhatsApp","Agende Pelo WhatsApp"],
h2:["Clareamento Dental em Parnamirim","Facetas de Resina em Parnamirim","Restauração Estética","Limpeza Dental em Parnamirim","Dentista em Parnamirim","Clínica São Paulo Parnamirim","Agende Sua Avaliação","Atendimento em Parnamirim","Fale no WhatsApp","Agende Pelo WhatsApp","Cuide do Seu Sorriso","Avaliação Individual"]}
};

const descriptions=[
"Cuide do seu sorriso com atendimento odontológico em Parnamirim. Agende sua avaliação.",
"Ortodontia, estética e cuidados odontológicos. Fale conosco pelo WhatsApp e agende.",
"Está procurando dentista em Parnamirim? Conheça a Clínica São Paulo e agende sua avaliação.",
"Atendimento presencial em Parnamirim para cuidar do seu sorriso com atenção individual."
];
const negatives=["curso","cursos","faculdade","faculdades","emprego","vaga","vagas","salário","gratuito","grátis","sus","caseiro","como fazer","aparelho usado","material odontológico","instrumental","plano odontológico","uniodonto","amil dental","bradesco dental"];

function adOp(adGroup:string,headlines:string[],offset:number){
  return {create:{adGroup,status:"PAUSED",ad:{finalUrls:[FINAL_URL],responsiveSearchAd:{
    headlines:headlines.slice(0,15).map(text=>({text})),
    descriptions:descriptions.slice(offset,offset+2).map(text=>({text})),
    path1:"dentista",path2:"parnamirim"
  }}}};
}

export async function googleAdsBootstrapCampaign(env:AdsEnv){
  const customer=(env.GOOGLE_ADS_CUSTOMER_ID||DEFAULT_CUSTOMER).replace(/-/g,"");
  const existing=await ads(env,"googleAds:search",{query:`SELECT campaign.resource_name, campaign.name, campaign.status, campaign.id FROM campaign WHERE campaign.name = '${CAMPAIGN_NAME}' AND campaign.status != 'REMOVED' LIMIT 1`});
  if ((existing?.results??[]).length) return {ok:true,already_exists:true,campaign:existing.results[0]};

  const geo=await ads(env,"googleAds:search",{query:"SELECT geo_target_constant.resource_name, geo_target_constant.name, geo_target_constant.canonical_name FROM geo_target_constant WHERE geo_target_constant.name = 'Parnamirim' AND geo_target_constant.country_code = 'BR' AND geo_target_constant.status = 'ENABLED' LIMIT 20"});
  const rows=geo?.results??[];
  const chosen=rows.find((r:any)=>String(r.geoTargetConstant?.canonicalName||r.geo_target_constant?.canonical_name||"").toLowerCase().includes("rio grande do norte"))||rows[0];
  const geoResource=chosen?.geoTargetConstant?.resourceName||chosen?.geo_target_constant?.resource_name;
  if(!geoResource) throw new Error("Google Ads did not return an active Parnamirim/RN geo target.");

  const budget=`customers/${customer}/campaignBudgets/-1001`, campaign=`customers/${customer}/campaigns/-1002`;
  const ags:Record<string,string>={"Clínica":`customers/${customer}/adGroups/-2001`,"Hiperlocal":`customers/${customer}/adGroups/-2002`,"Ortodontia":`customers/${customer}/adGroups/-2003`,"Serviços":`customers/${customer}/adGroups/-2004`};
  const ops:any[]=[
    {campaignBudgetOperation:{create:{resourceName:budget,name:`${CAMPAIGN_NAME} | R$12`,amountMicros:"12000000",explicitlyShared:false}}},
    {campaignOperation:{create:{resourceName:campaign,name:CAMPAIGN_NAME,status:"PAUSED",advertisingChannelType:"SEARCH",campaignBudget:budget,manualCpc:{enhancedCpcEnabled:false},networkSettings:{targetGoogleSearch:true,targetSearchNetwork:false,targetContentNetwork:false,targetPartnerSearchNetwork:false},geoTargetTypeSetting:{positiveGeoTargetType:"PRESENCE",negativeGeoTargetType:"PRESENCE"},containsEuPoliticalAdvertising:"DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING"}}},
    {campaignCriterionOperation:{create:{campaign,location:{geoTargetConstant:geoResource}}}}
  ];
  for(const text of negatives) ops.push({campaignCriterionOperation:{create:{campaign,negative:true,keyword:{text,matchType:"PHRASE"}}}});
  for(const [name,cfg] of Object.entries(groups)){
    const ag=ags[name];
    ops.push({adGroupOperation:{create:{resourceName:ag,campaign,name,status:"ENABLED",type:"SEARCH_STANDARD",cpcBidMicros:"2100000"}}});
    for(const [text,matchType] of cfg.keywords) ops.push({adGroupCriterionOperation:{create:{adGroup:ag,status:"ENABLED",keyword:{text,matchType}}}});
    ops.push({adGroupAdOperation:adOp(ag,cfg.h1,0)});
    ops.push({adGroupAdOperation:adOp(ag,cfg.h2,2)});
  }
  if(ops.length>100) throw new Error("Bootstrap generated more than 100 operations.");
  const result=await ads(env,"googleAds:mutate",{operations:ops,partialFailure:false,validateOnly:false});
  return {ok:true,already_exists:false,campaign_name:CAMPAIGN_NAME,campaign_status:"PAUSED",budget_brl_per_day:12,geo_target:geoResource,operation_count:ops.length,result};
}
