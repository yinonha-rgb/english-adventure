(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EAUIControls=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function createManager({document,history,confirmClose}={}){
    const stack=[],focus=new Map();let handlingPop=false;
    const modalOf=value=>typeof value==='string'?document.querySelector(value):value?.closest?.('.modal')||value;
    function enhance(modal){
      if(!modal||modal.dataset.closeEnhanced)return modal;
      modal.dataset.closeEnhanced='true';
      const head=modal.querySelector('.panelhead')||modal.querySelector('.panel');
      if(head&&!modal.querySelector('[data-close]')){
        const button=document.createElement('button');button.type='button';button.className='close';button.dataset.close='';button.textContent='×';button.setAttribute('aria-label','סגירת החלון');head.append(button);
      }
      modal.querySelectorAll('[data-close],.close').forEach(button=>button.setAttribute('aria-label','סגירת החלון'));
      modal.addEventListener('click',event=>{if(event.target===modal&&modal.dataset.dismissSafe==='true')requestClose(modal,'outside')});
      return modal;
    }
    function open(value,{unsaved=false,dismissSafe=false}={}){
      const modal=enhance(modalOf(value));if(!modal||modal.classList.contains('open'))return false;
      const current=stack.at(-1);if(current){current.classList.remove('open');current.dataset.suspended='true'}
      focus.set(modal,document.activeElement);modal.dataset.unsaved=unsaved?'true':'false';modal.dataset.dismissSafe=dismissSafe?'true':'false';
      modal.classList.add('open');stack.push(modal);document.body.style.overflow='hidden';
      if(history&&!handlingPop)history.pushState({eaModal:modal.id||true},'');
      setTimeout(()=>modal.querySelector('[data-close],button,input,select,textarea')?.focus(),0);return true;
    }
    async function requestClose(value,reason='button'){
      const modal=modalOf(value)||stack.at(-1);if(!modal||!modal.classList.contains('open'))return false;
      if(modal.dataset.unsaved==='true'&&confirmClose&&!(await confirmClose(modal,reason)))return false;
      modal.classList.remove('open');modal.dataset.unsaved='false';const index=stack.lastIndexOf(modal);if(index>=0)stack.splice(index,1);
      const previous=stack.at(-1);if(previous?.dataset.suspended==='true'){delete previous.dataset.suspended;previous.classList.add('open')}
      else document.body.style.overflow='';
      focus.get(modal)?.focus?.();focus.delete(modal);document.dispatchEvent(new CustomEvent('ea-modal-closed',{detail:{id:modal.id,reason}}));return true;
    }
    function markUnsaved(value,unsaved=true){const modal=modalOf(value);if(modal)modal.dataset.unsaved=unsaved?'true':'false'}
    function install(){
      document.querySelectorAll('.modal').forEach(enhance);
      document.addEventListener('click',event=>{const close=event.target.closest?.('[data-close],.close');if(close)requestClose(close,'button')});
      document.addEventListener('keydown',event=>{const modal=stack.at(-1)||document.querySelector('.modal.open');if(event.key==='Escape'&&modal){event.preventDefault();requestClose(modal,'escape')}});
      globalThis.addEventListener?.('popstate',()=>{const modal=stack.at(-1)||document.querySelector('.modal.open');if(!modal)return;handlingPop=true;Promise.resolve(requestClose(modal,'back')).finally(()=>handlingPop=false)});
      new MutationObserver(records=>records.flatMap(record=>[...record.addedNodes]).forEach(node=>{if(node.nodeType!==1)return;if(node.matches?.('.modal'))enhance(node);node.querySelectorAll?.('.modal').forEach(enhance)})).observe(document.body,{childList:true,subtree:true});
    }
    return{open,requestClose,markUnsaved,enhance,install,stack:()=>[...stack]};
  }
  return{createManager};
});
