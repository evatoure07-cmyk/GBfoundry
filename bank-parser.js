'use strict';
const money=(raw)=>{const normalized=String(raw).replace(/[\s\u00a0\u202f]/g,'').replace(/,/g,'.');if(!/^\d+(?:\.\d{1,2})?$/.test(normalized))return null;const [whole,frac='']=normalized.split('.');return BigInt(whole)*100n+BigInt((frac+'00').slice(0,2))};
function parseBankMessage(text){
 const source=String(text||'');
 const direction=/SORTIE\s+D['’]ARGENT/i.test(source)?'out':/ENTR[ÉE]E\s+D['’]ARGENT/i.test(source)?'in':null;
 if(!direction)return null;
 const grab=(pattern)=>source.match(pattern)?.[1]?.trim();
 const account=grab(/Compte\s*ID\s*:\s*([\w-]+)/i);
 const amount=money(grab(/Montant\s*:\s*([\d\s\u00a0\u202f.,]+)\s*\$/i));
 const before=money(grab(/Solde\s*avant\s*:\s*([\d\s\u00a0\u202f.,]+)\s*\$/i));
 const after=money(grab(/Solde\s*apr[èe]s\s*:\s*([\d\s\u00a0\u202f.,]+)\s*\$/i));
 const reason=grab(/Raison\s*:\s*([^\r\n]+)/i)||'';
 if(!account||amount===null||before===null||after===null||amount<=0n)return null;
 if((direction==='in'?after-before:before-after)!==amount)return null;
 const max=BigInt(Number.MAX_SAFE_INTEGER);if([amount,before,after].some(x=>x>max))return null;
 return {account_id:account,direction,amount_cents:Number(amount),balance_before_cents:Number(before),balance_after_cents:Number(after),reason};
}
module.exports={parseBankMessage};
