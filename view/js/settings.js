/* Central de preferências locais e atalhos para os recursos existentes. */
(() => {
    'use strict';
    const preferences=window.BacklogPreferences,account=window.BacklogAccount,ui=window.BacklogUI,motion=window.BacklogMotion;
    const $=selector=>document.querySelector(selector),t=text=>window.BacklogI18n?.t(text)||text;
    function status(saved=true,message='Changes saved.'){
        const node=$('#settings-save-state');node.classList.toggle('is-temporary',!saved);node.querySelector('span').textContent=t(saved?message:'Storage is unavailable. These settings apply to this page only.');
        if(saved&&!motion.matches)node.animate([{opacity:.4,transform:'translateY(3px)'},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'});
    }
    function render(){const value=preferences.get();for(const button of document.querySelectorAll('[data-language]'))button.setAttribute('aria-pressed',String(button.dataset.language===value.language));for(const button of document.querySelectorAll('[data-preference]'))button.setAttribute('aria-checked',String(value[button.dataset.preference]));$('#presentation-motion').value=motion.mode;$('#settings-privacy .settings-section-heading p').textContent=t(value.publicLists?'Public by default':'Private by default');}
    document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>status(preferences.set('language',button.dataset.language))));
    document.querySelectorAll('[data-preference]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.preference;status(preferences.set(key,!preferences.get()[key]));}));
    $('#presentation-motion').addEventListener('change',event=>status(motion.setMode(event.target.value)));
    $('#settings-reset').addEventListener('click',()=>{const saved=preferences.reset(),movement=motion.setMode('auto');render();status(saved&&movement,'Default settings restored.');});
    function renderAccount(){
        const profile=account.getState().profile,signedIn=Boolean(account.user);
        $('#settings-avatar').replaceChildren(ui.avatar(profile));$('#settings-player').textContent=profile.display_name||t('Device profile');$('#settings-email').textContent=account.user?.email||'';
        $('#settings-account-status').textContent=t(signedIn?'Connected account':'Device profile');$('#settings-account-description').textContent=t(signedIn?'Connected to your BackLog account.':'Your profile is stored on this device. Sign in to sync it with your account.');
        $('#settings-signin').hidden=signedIn;$('#settings-signout').hidden=!signedIn;$('#settings-signout').disabled=account.loading;$('#settings-export').disabled=account.loading;
        if(account.error)$('#settings-account-feedback').textContent=account.error;
    }
    $('#settings-signout').addEventListener('click',async()=>{const button=$('#settings-signout'),feedback=$('#settings-account-feedback');button.disabled=true;feedback.textContent='';try{await account.signOut();renderAccount();}catch(error){feedback.textContent=error.message||'Could not sign out. Try again.';}finally{button.disabled=account.loading;}});
    const pick=(value,keys)=>Object.fromEntries(keys.filter(key=>value[key]!==undefined).map(key=>[key,value[key]]));
    $('#settings-export').addEventListener('click',async()=>{
        const button=$('#settings-export'),feedback=$('#settings-export-feedback');button.disabled=true;feedback.textContent=t('Preparing your backup…');
        try{
            await account.ready;const owner=account.user?.id||'local';await window.Backlog.statusReady;
            if(owner!==(account.user?.id||'local'))throw Error('Your account changed. Please try again.');
            if(account.user&&window.Backlog.syncError)throw Error('Your game statuses could not be synchronized. Please try again.');
            const state=account.getState(),diary=await window.BacklogDiary.entries();if(owner!==(account.user?.id||'local'))throw Error('Your account changed. Please try again.');
            const profile=pick(state.profile,['id','display_name','bio','location','website','gaming_platform','banner_game_id','avatar_path','avatar_local']);
            const lists=state.lists.map(list=>pick(list,['id','name','description','is_public','is_ranked','gameIds']));
            const games=window.BacklogGames.map(game=>({id:game.id,status:window.Backlog.getStatus(game.id)?.id||null,review:window.BacklogReviews.get(game.id)})).filter(game=>game.status||game.review);
            const backup={format:'backlog-personal-backup',version:1,exportedAt:new Date().toISOString(),source:owner==='local'?'device':'account',profile,favorites:state.favorites,lists,games,diary,preferences:preferences.get(),animationMode:motion.mode};
            const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='BackLog-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);feedback.textContent=t('Backup downloaded.');
        }catch(error){feedback.textContent=t(error.message||'Could not export your data. Please try again.');}finally{button.disabled=account.loading;}
    });
    const links=[...document.querySelectorAll('.settings-sidebar nav>a')];let frame=0;
    function selected(id){for(const link of links){const active=link.hash==='#'+id;link.classList.toggle('selected',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}}
    function scroll(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;let current=links[0].hash.slice(1);for(const link of links)if($(link.hash).getBoundingClientRect().top<=190)current=link.hash.slice(1);selected(current);});}
    links.forEach(link=>link.addEventListener('click',event=>{event.preventDefault();selected(link.hash.slice(1));history.replaceState(null,'',link.hash);$(link.hash).scrollIntoView({behavior:motion.matches?'auto':'smooth',block:'start'});}));
    window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll);window.addEventListener('backlog-preferences-change',()=>{render();});window.addEventListener('backlog-language-change',renderAccount);window.addEventListener('backlog-account-change',renderAccount);motion.addEventListener('change',render);
    account.ready.then(renderAccount);renderAccount();render();scroll();
})();
