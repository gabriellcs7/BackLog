/* Seletores compartilhados: o campo nativo continua responsável pelo formulário. */
(() => {
    'use strict';
    if (!HTMLElement.prototype.showPopover) return;
    const controls = new Set();
    let active = null, serial = 0, scheduled = false;
    function syncAll() { controls.forEach(control => control.sync()); }
    function scheduleSync() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => { scheduled = false; syncAll(); });
    }
    function enhance(select) {
        if (select.multiple || select.size > 1 || select.dataset.enhancedSelect || select.hasAttribute('data-native-select')) return;
        select.dataset.enhancedSelect = 'true';
        const wrapper = document.createElement('span'); wrapper.className = 'site-select';
        const trigger = document.createElement('button'); trigger.type = 'button'; trigger.className = 'site-select-trigger';
        const value = document.createElement('span'); value.className = 'site-select-value';
        const icon = document.createElement('span'); icon.className = 'site-select-chevron'; icon.setAttribute('aria-hidden','true');
        trigger.append(value, icon);
        const panel = document.createElement('div'); panel.className = 'site-select-menu'; panel.id = 'site-select-menu-' + (++serial);
        panel.setAttribute('popover','auto'); panel.setAttribute('role','listbox');
        trigger.setAttribute('role','combobox'); trigger.setAttribute('aria-haspopup','listbox'); trigger.setAttribute('aria-expanded','false'); trigger.setAttribute('aria-controls',panel.id);
        const labels = [...select.labels || []].map(label => { const copy = label.cloneNode(true); copy.querySelectorAll('select,input,button').forEach(node=>node.remove()); return copy.textContent.trim(); }).filter(Boolean);
        const names = {'genre-filter':'Genre','status-filter':'Collection status','sort-games':'Sort games','diary-type':'Diary entries','list-genre':'Genre','profile-banner-game':'Profile banner'};
        const name = select.getAttribute('aria-label') || labels.join(' ') || names[select.id] || 'Choose an option';
        trigger.setAttribute('aria-label',name); panel.setAttribute('aria-label',name);
        if (select.getAttribute('aria-describedby')) trigger.setAttribute('aria-describedby',select.getAttribute('aria-describedby'));
        select.before(wrapper); wrapper.append(select,trigger,panel);
        select.classList.add('site-select-native'); select.tabIndex = -1; select.setAttribute('aria-hidden','true');
        let current = -1, search = '', lastTyped = 0;
        const options = () => [...select.options];
        const enabled = index => { const option=select.options[index]; return option && !option.disabled && !option.hidden && !option.parentElement.disabled; };
        function sync() {
            const text=select.selectedOptions[0]?.textContent.trim() || 'Select…';
            if(value.textContent!==text)value.textContent=text;
            trigger.disabled = select.matches(':disabled');
            trigger.setAttribute('aria-required',String(select.required));
            wrapper.hidden = select.hidden;
        }
        function highlight(index) {
            if (!enabled(index)) return;
            current = index;
            panel.querySelectorAll('[role="option"]').forEach(node => node.classList.toggle('is-active',Number(node.dataset.index)===index));
            const option = panel.querySelector('[data-index="'+index+'"]');
            if(option) {
                trigger.setAttribute('aria-activedescendant',option.id);
                const bottom=option.offsetTop+option.offsetHeight;
                if(option.offsetTop<panel.scrollTop)panel.scrollTop=option.offsetTop;
                else if(bottom>panel.scrollTop+panel.clientHeight)panel.scrollTop=bottom-panel.clientHeight;
            }
        }
        function position() {
            const box = trigger.getBoundingClientRect(), padding = 12;
            const width = Math.min(Math.max(box.width,190),innerWidth-padding*2);
            panel.style.width = width+'px';
            const below=innerHeight-box.bottom-padding, above=box.top-padding;
            const flip=below<180 && above>below;
            panel.style.maxHeight = Math.max(90,Math.min(320,flip?above-7:below-7))+'px';
            panel.style.left = Math.max(padding,Math.min(box.left,innerWidth-width-padding))+'px';
            panel.style.top = (flip?Math.max(padding,box.top-panel.offsetHeight-7):box.bottom+7)+'px';
        }
        function close(focus=false) {
            if (panel.matches(':popover-open')) panel.hidePopover();
            trigger.setAttribute('aria-expanded','false'); trigger.removeAttribute('aria-activedescendant');
            if(active===control) active=null;
            if(focus) trigger.focus({preventScroll:true});
        }
        function open() {
            if(trigger.disabled) return;
            active?.close(); sync(); panel.replaceChildren();
            options().forEach((option,index)=>{
                if(option.hidden) return;
                const row=document.createElement('div'); row.className='site-select-option'; row.id=panel.id+'-option-'+index; row.dataset.index=index; row.setAttribute('role','option'); row.setAttribute('aria-selected',String(index===select.selectedIndex)); row.setAttribute('aria-disabled',String(!enabled(index)));
                const text=document.createElement('span'); text.textContent=option.textContent.trim(); row.append(text);
                if(index===select.selectedIndex){const check=document.createElement('span');check.className='site-select-check';check.textContent='✓';check.setAttribute('aria-hidden','true');row.append(check);}
                panel.append(row);
            });
            active=control; panel.showPopover(); position(); trigger.setAttribute('aria-expanded','true');
            highlight(enabled(select.selectedIndex)?select.selectedIndex:options().findIndex((_,index)=>enabled(index)));
        }
        function choose(index) {
            if(!enabled(index))return;
            const changed=select.selectedIndex!==index;select.selectedIndex=index;sync();close(true);
            if(changed){select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));}
        }
        function step(delta) {
            const list=options().map((_,index)=>index).filter(enabled);if(!list.length)return;
            const index=list.indexOf(current);highlight(list[Math.min(list.length-1,Math.max(0,index+delta))]);
        }
        trigger.addEventListener('click',()=>panel.matches(':popover-open')?close():open());
        trigger.addEventListener('keydown',event=>{
            const isOpen=panel.matches(':popover-open');
            if(event.key==='Escape'&&isOpen){event.preventDefault();event.stopPropagation();close(true);return;}
            if(event.key==='Tab'){close();return;}
            if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
                event.preventDefault();if(!isOpen)open();
                if(event.key==='Home')highlight(options().findIndex((_,index)=>enabled(index)));
                else if(event.key==='End')highlight(options().map((_,index)=>index).filter(enabled).at(-1));
                else if(isOpen)step(event.key==='ArrowDown'?1:-1);
            }else if(event.key==='Enter'||event.key===' '){event.preventDefault();if(isOpen)choose(current);else open();}
            else if(event.key.length===1&&!event.ctrlKey&&!event.altKey&&!event.metaKey){
                event.preventDefault();if(!isOpen)open();const now=Date.now();search=now-lastTyped>700?event.key:search+event.key;lastTyped=now;
                const index=options().findIndex((option,index)=>enabled(index)&&option.textContent.trim().toLocaleLowerCase().startsWith(search.toLocaleLowerCase()));if(index>=0)highlight(index);
            }
        });
        panel.addEventListener('pointerdown',event=>event.preventDefault());
        panel.addEventListener('click',event=>{const row=event.target.closest('[role="option"]');if(row)choose(Number(row.dataset.index));});
        panel.addEventListener('toggle',event=>{if(event.newState==='closed')close();});
        select.addEventListener('change',sync); select.addEventListener('focus',()=>trigger.focus());
        select.addEventListener('invalid',event=>{event.preventDefault();trigger.setAttribute('aria-invalid','true');trigger.focus();});
        const control={panel,sync,close,position};controls.add(control);sync();
    }
    function scan(root=document){if(root instanceof HTMLSelectElement)enhance(root);root.querySelectorAll?.('select').forEach(enhance);}
    scan();
    new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof Element)scan(node);scheduleSync();}).observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',scheduleSync); document.addEventListener('reset',scheduleSync); document.addEventListener('toggle',scheduleSync,true);
    document.addEventListener('focusin',event=>{if(active&&!active.panel.parentElement.contains(event.target))active.close();});
    window.addEventListener('resize',()=>active?.close());
    window.addEventListener('scroll',event=>{if(active&&!active.panel.contains(event.target))active.position();},true);
    window.addEventListener('pageshow',syncAll);
})();
