(function(root){
  'use strict';

  const LEVELS={
    easy:{label:'קל',english:'Easy'},
    medium:{label:'בינוני',english:'Medium'},
    hard:{label:'מתקדם',english:'Advanced'}
  };

  const WORDS={
    dog:{ipa:'/dɒɡ/',hebrew:'דוֹג',tip:'צליל קצר וברור: דּוֹג'},
    cat:{ipa:'/kæt/',hebrew:'קֶאט',tip:'פותחים מעט את הפה לצליל a'},
    bird:{ipa:'/bɜːrd/',hebrew:'בֶּרְד',tip:'מאריכים בעדינות את הצליל באמצע'},
    red:{ipa:'/red/',hebrew:'רֶד',tip:'מסיימים בצליל d ברור'},
    blue:{ipa:'/bluː/',hebrew:'בְּלוּ',tip:'מאריכים מעט את הצליל oo'},
    green:{ipa:'/ɡriːn/',hebrew:'גְרִין',tip:'מאריכים מעט את הצליל ee'},
    apple:{ipa:'/ˈæp.əl/',hebrew:'אַ־פְּל',tip:'שתי הברות: ap, ple'},
    banana:{ipa:'/bəˈnɑː.nə/',hebrew:'בַּ־נָא־נָה',tip:'שלוש הברות; מדגישים את האמצע'},
    hello:{ipa:'/həˈloʊ/',hebrew:'הֶ־לוֹ',tip:'שתי הברות; מדגישים את השנייה'},
    goodbye:{ipa:'/ˌɡʊdˈbaɪ/',hebrew:'גוּד־בַּאי',tip:'אומרים good ואז bye'}
  };

  const normalizeWord=value=>String(value||'').trim().toLowerCase().replace(/[^a-z'-]/g,'');
  function describeWord(value){
    const word=normalizeWord(value);
    return{word,ipa:WORDS[word]?.ipa||'',hebrew:WORDS[word]?.hebrew||'',tip:WORDS[word]?.tip||'הקשיבו למורה ואמרו את המילה לאט.'};
  }
  function normalizeDifficulty(value){return Object.hasOwn(LEVELS,value)?value:'easy'}
  function difficultyForChild(child={},saved){
    if(Object.hasOwn(LEVELS,saved))return saved;
    const level=Number(child.level)||1;
    const mistakes=Number(child.progress?.unresolvedMistakes)||0,retries=Number(child.progress?.averageRetries)||0,completed=Number(child.progress?.completedMissions)||0;
    if(mistakes>=5||retries>=2.2)return'easy';
    if(level>=6&&completed>=8&&mistakes<=2&&retries<1.4)return'hard';
    return level>=3||completed>=4?'medium':'easy';
  }
  function ensureStyles(document){
    if(!document||document.querySelector('#eaClassroomToolsStyles'))return;
    const style=document.createElement('style');
    style.id='eaClassroomToolsStyles';
    style.textContent=`.classroom-difficulty{display:flex;align-items:center;gap:5px;white-space:nowrap}.classroom-difficulty label{font-size:.72rem;font-weight:850;color:#4c4563}.classroom-difficulty select{min-height:34px;border:1px solid #d9d2ef;border-radius:10px;background:#fff;padding:4px 8px;font:inherit;font-weight:800;color:#352b60}.interactive-live-transcript{position:absolute;inset:auto 50% 8px auto;transform:translateX(50%);z-index:8;max-width:min(72%,580px);padding:7px 14px;border-radius:999px;background:#17203bd9;color:#fff;font-weight:800;text-align:center;box-shadow:0 7px 22px #17203b35}.interactive-live-transcript[hidden]{display:none}.interactive-live-transcript[data-final=true]{background:#176b52}.interactive-word.classroom-word{appearance:none;font:inherit;cursor:pointer;transition:transform .18s,box-shadow .18s}.interactive-word.classroom-word:hover,.interactive-word.classroom-word:focus-visible{transform:translateY(-2px);box-shadow:0 5px 13px #30247724;outline:3px solid #8a7cf044}.phonetic-inspector{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:18px;background:#15203c9c}.phonetic-card{position:relative;width:min(390px,100%);display:grid;gap:12px;text-align:center;background:#fff;border-radius:26px;padding:26px;box-shadow:0 24px 70px #10172f66}.phonetic-card .close{position:absolute;inset:10px auto auto 10px}.phonetic-word{font-size:clamp(2.4rem,10vw,4.5rem);color:#4d3cb7}.phonetic-ipa{font:700 1.35rem system-ui;color:#544d65}.phonetic-hebrew{font-size:1.25rem;font-weight:850}.phonetic-tip{margin:0;color:#625c70}.phonetic-listen{justify-self:center}@media(max-width:700px){.classroom-difficulty label{display:none}.classroom-difficulty select{width:72px;padding-inline:4px;font-size:.72rem}.interactive-live-transcript{bottom:5px;max-width:88%;font-size:.82rem}.phonetic-card{padding:22px 16px}.interactive-word.classroom-word{padding:4px 7px}}`;
    style.textContent+=`.interactive-top{grid-template-columns:auto minmax(90px,auto) minmax(100px,1fr) auto auto auto auto auto}@media(max-width:700px){.interactive-top{grid-template-columns:minmax(54px,auto) minmax(36px,1fr) auto auto auto auto}.interactive-teacher-mini,.interactive-progress{display:none}}`;
    document.head.append(style);
  }
  function updateTranscript(scope,text,{final=false}={}){
    const box=scope?.querySelector?.('#interactiveLiveTranscript');
    if(!box)return;
    const value=String(text||'').trim();
    box.hidden=!value;
    box.textContent=value?(value==='מקשיבה…'?value:`שמעתי: ${value}`):'';
    box.dataset.final=String(Boolean(final));
  }
  function clearTranscript(scope){updateTranscript(scope,'')}
  function openPhonetic(document,value,onSpeak){
    if(!document)return null;
    document.querySelector('.phonetic-inspector')?.remove();
    ensureStyles(document);
    const info=describeWord(value),overlay=document.createElement('div');
    overlay.className='phonetic-inspector';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label',`עזרה בהגיית ${info.word}`);
    const card=document.createElement('section');card.className='phonetic-card';
    const close=document.createElement('button');close.className='close';close.type='button';close.setAttribute('aria-label','סגירת החלון');close.textContent='×';
    const word=document.createElement('strong');word.className='phonetic-word';word.lang='en';word.dir='ltr';word.textContent=info.word;
    const ipa=document.createElement('span');ipa.className='phonetic-ipa';ipa.dir='ltr';ipa.textContent=info.ipa;
    const hebrew=document.createElement('span');hebrew.className='phonetic-hebrew';hebrew.textContent=info.hebrew;
    const tip=document.createElement('p');tip.className='phonetic-tip';tip.textContent=info.tip;
    const listen=document.createElement('button');listen.className='btn phonetic-listen';listen.type='button';listen.textContent='🔊 השמעת המילה';
    const dismiss=()=>{document.removeEventListener('keydown',onKey);overlay.remove()};
    const onKey=event=>{if(event.key==='Escape')dismiss()};
    close.onclick=dismiss;overlay.onclick=event=>{if(event.target===overlay)dismiss()};listen.onclick=()=>onSpeak?.(info.word);
    card.append(close,word,ipa,hebrew,tip,listen);overlay.append(card);document.body.append(overlay);document.addEventListener('keydown',onKey);close.focus();
    return overlay;
  }
  function renderVocabulary(document,strip,words,active,onSpeak){
    if(!strip)return;
    ensureStyles(document);strip.replaceChildren();
    for(const value of words||[]){
      const word=String(value),card=document.createElement('button');
      card.type='button';card.className='interactive-word classroom-word';card.textContent=word;card.lang='en';card.dir='ltr';
      card.setAttribute('aria-label',`עזרה בהגיית ${word}`);
      if(String(active||'').toLowerCase().includes(word.toLowerCase()))card.classList.add('active');
      card.onclick=()=>openPhonetic(document,word,onSpeak);strip.append(card);
    }
  }
  function mountDifficulty(document,host,value,onChange){
    if(!host)return null;ensureStyles(document);
    const wrap=document.createElement('div');wrap.className='classroom-difficulty';
    const label=document.createElement('label');label.textContent='רמה';label.htmlFor='interactiveDifficulty';
    const select=document.createElement('select');select.id='interactiveDifficulty';select.setAttribute('aria-label','בחירת רמת קושי בשיעור');
    Object.entries(LEVELS).forEach(([key,item])=>{const option=document.createElement('option');option.value=key;option.textContent=item.label;select.append(option)});
    select.value=normalizeDifficulty(value);select.onchange=()=>onChange?.(normalizeDifficulty(select.value));wrap.append(label,select);host.append(wrap);return select;
  }

  const api={LEVELS,describeWord,normalizeDifficulty,difficultyForChild,ensureStyles,updateTranscript,clearTranscript,openPhonetic,renderVocabulary,mountDifficulty};
  root.EAClassroomTools=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
