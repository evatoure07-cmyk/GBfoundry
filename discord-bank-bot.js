'use strict';
/* Discord banking feed -> private Supabase ledger. Run only on a trusted server. */
const {Client,GatewayIntentBits,Events}=require('discord.js');
const {parseBankMessage}=require('./bank-parser');
const required=['DISCORD_BOT_TOKEN','DISCORD_BANK_CHANNEL_ID','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'];
const missing=required.filter(k=>!process.env[k]);
if(missing.length){console.error('Missing environment variables: '+missing.join(', '));process.exit(1)}
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent]});
client.once(Events.ClientReady,()=>console.log('GB Foundry bank listener ready'));
client.on(Events.MessageCreate,async message=>{
 if(message.channelId!==process.env.DISCORD_BANK_CHANNEL_ID)return;
 if(process.env.DISCORD_BANK_AUTHOR_ID&&message.author.id!==process.env.DISCORD_BANK_AUTHOR_ID)return;
 const entry=parseBankMessage([message.content,...message.embeds.map(e=>[e.title,e.description,...(e.fields||[]).map(f=>f.value)].filter(Boolean).join('\n'))].join('\n'));
 if(!entry)return;
 const row={...entry,discord_message_id:message.id,occurred_at:message.createdAt.toISOString(),source:'discord',classification_status:'pending'};
 try{
  const response=await fetch(process.env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/account_transactions?on_conflict=discord_message_id',{
   method:'POST',headers:{'apikey':process.env.SUPABASE_SERVICE_ROLE_KEY,'Authorization':'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json','Prefer':'resolution=ignore-duplicates'},body:JSON.stringify(row)
  });
  if(!response.ok)throw new Error('Supabase '+response.status+': '+(await response.text()).slice(0,300));
  console.log('Bank event accepted:',message.id);
 }catch(err){console.error('Bank import failed:',message.id,err.message)}
});
client.login(process.env.DISCORD_BOT_TOKEN);
