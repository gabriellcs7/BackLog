/* Contas, perfil e listas. Sem configuração, mantém um perfil somente neste dispositivo. */
(() => {
    'use strict';
    const base = new URL('.', document.currentScript.src);
    const config = window.BacklogConfig || {};
    const configured = Boolean(config.supabaseUrl && config.supabasePublishableKey);
    const games = window.BacklogGames;
    const known = id => games.some(game => game.id === id);
    const platforms = new Set(['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile', 'Steam Deck', 'Other']);
    const localKey = 'backlog:player:local';
    let client = null, user = null, issue = '', generation = 0, loading = false;
    const empty = () => ({ profile: { id: 'local', display_name: 'Your profile', bio: '' }, favorites: [], lists: [], reviews: [] });
    let state = empty();
    function localState() {
        try {
            const value = JSON.parse(localStorage.getItem(localKey));
            if (!value || !value.profile || !Array.isArray(value.favorites) || !Array.isArray(value.lists)) return empty();
            return { profile: { id: 'local', display_name: String(value.profile.display_name || 'Your profile').slice(0,40), bio: String(value.profile.bio || '').slice(0,280), location: String(value.profile.location || '').slice(0,80), website: String(value.profile.website || '').slice(0,300), featured_list_id: typeof value.profile.featured_list_id==='string'?value.profile.featured_list_id:null, banner_game_id: known(value.profile.banner_game_id) ? value.profile.banner_game_id : null, gaming_platform: platforms.has(value.profile.gaming_platform) ? value.profile.gaming_platform : null, avatar_local: /^data:image\/webp;base64,/.test(value.profile.avatar_local||'') && value.profile.avatar_local.length<700000 ? value.profile.avatar_local : null }, favorites: [...new Set(value.favorites.filter(known))].slice(0,4), lists: value.lists.filter(list => typeof list.id === 'string' && typeof list.name === 'string' && Array.isArray(list.gameIds)).map(list => ({ ...list, name: list.name.slice(0,80), description: String(list.description || '').slice(0,500), tags: cleanListTags(list.tags), gameIds: [...new Set(list.gameIds.filter(known))], is_public: false, is_ranked: list.is_ranked===true })), reviews: [] };
        } catch { return empty(); }
    }
    const copy = value => JSON.parse(JSON.stringify(value));
    function changed() { window.dispatchEvent(new Event('backlog-account-change')); }
    function persist(next) { localStorage.setItem(localKey, JSON.stringify(next)); state = next; changed(); }
    function cleanListTags(value){const seen=new Set();return (Array.isArray(value)?value:[]).filter(s=>typeof s==='string').map(s=>s.trim()).filter(s=>s&&s.length<=24&&!/[\n\r\t]/.test(s)&&!seen.has(s.toLowerCase())&&seen.add(s.toLowerCase())).slice(0,8);}
    function requireUser() { if (!client || !user) throw new Error('Sign in to use this feature.'); return user.id; }
    function checked(result) { if (result.error) throw new Error(result.error.message || 'Could not connect. Please try again.'); return result.data; }
    async function loadPlayer(id, own) {
        const [profile, favorites, lists] = await Promise.all([
            client.from('profiles').select('*').eq('id',id).maybeSingle(),
            client.from('favorites').select('game_id,position').eq('user_id',id).order('position'),
            (own ? client.from('game_lists').select('*,list_games(game_id,position)').eq('user_id',id) : client.from('game_lists').select('*,list_games(game_id,position)').eq('user_id',id).eq('is_public',true)).order('updated_at',{ascending:false})
        ]);
        return { profile: checked(profile), favorites: (checked(favorites) || []).map(item=>item.game_id).filter(known), lists: (checked(lists) || []).map(list=>({ ...list, tags:cleanListTags(list.tags), gameIds: list.list_games.sort((a,b)=>a.position-b.position).map(item=>item.game_id).filter(known) })), reviews: [] };
    }
    async function synchronize(session) {
        const ticket = ++generation;
        const previousOwner = user?.id;
        user = session?.user || null;
        issue = '';
        if (!user) { loading = false; state = localState(); changed(); return; }
        loading = true;
        if (previousOwner !== user.id) state = { ...empty(), profile: { id: user.id, display_name: 'Player', bio: '' } };
        changed();
        try {
            const owner = user.id;
            const [player, reviews] = await Promise.all([loadPlayer(owner,true), client.from('reviews').select('*').eq('user_id',owner)]);
            if (ticket !== generation) return;
            if (!player.profile) throw new Error('Your profile could not be loaded. Please try again.');
            player.reviews = checked(reviews) || [];
            state = player;
        } catch (error) { if (ticket === generation) issue = error.message; }
        if (ticket === generation) { loading = false; changed(); }
    }
    function validateIds(ids, maximum) { if (!Array.isArray(ids) || ids.length > maximum || ids.some(id=>!known(id)) || new Set(ids).size !== ids.length) throw new Error('Choose different games from the catalog.'); }
    const ready = (async () => {
        state = localState();
        if (!configured) return;
        try {
            if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?\/?$/i.test(config.supabaseUrl)) throw new Error('Online configuration is invalid.');
            await new Promise((resolve,reject)=>{ const script=document.createElement('script'); script.src=new URL('vendor/supabase.js',base).href; script.onload=resolve; script.onerror=()=>reject(new Error('Could not load online accounts.')); document.head.append(script); });
            client = window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey);
            client.auth.onAuthStateChange((event,session)=>{ setTimeout(()=>{
                if(session?.user?.id===user?.id&&(loading||(!issue&&event!=='USER_UPDATED')))return;
                synchronize(session).catch(error=>{issue=error.message;loading=false;changed();});
            },0); });
            const { data, error } = await client.auth.getSession();
            if (error) throw error;
            await synchronize(data.session);
        } catch (error) { issue = error.message; changed(); }
    })();
    async function saveProfile(name,bio,photo=undefined,details=undefined) {
        name=name.trim();bio=bio.trim();
        if (name.length<2||name.length>40||bio.length>280) throw new Error('Use 2 to 40 characters for your name and up to 280 for your bio.');
        const patch={display_name:name,bio};
        if (details) {
            const platform=details.platform||null;
            if(platform!==null&&!platforms.has(platform))throw new Error('Choose a gaming platform.');
            if(platform!==(state.profile.gaming_platform||null))patch.gaming_platform=platform;
            const location=details.location.trim();
            const website=details.website.trim();
            if(location.length>80)throw new Error('Use up to 80 characters for your location.');
            if(website){
                let url;
                try{url=new URL(website);}catch{}
                if(!url||!['http:','https:'].includes(url.protocol)||url.username||url.password||/\s/.test(website)||website.length>300){
                    throw new Error('Enter one valid link beginning with https:// or http://.');
                }
            }
            if(location!==(state.profile.location||''))patch.location=location;
            if(website!==(state.profile.website||''))patch.website=website;
        }
        if (user && photo!==undefined) {
            const owner=requireUser();
            if(photo===null) patch.avatar_path=null;
            else {
                if(!(photo instanceof Blob)||photo.type!=='image/webp'||photo.size>524288)throw new Error('Choose a valid profile photo.');
                const path=owner+'/'+crypto.randomUUID()+'.webp';
                checked(await client.storage.from('avatars').upload(path,photo,{contentType:'image/webp',cacheControl:'31536000',upsert:false}));
                if(user?.id!==owner)throw new Error('Your account changed. Please reload.');
                patch.avatar_path=path;
            }
        }
        if (user) { const owner=requireUser(),oldPath=state.profile.avatar_path; const result=await client.from('profiles').update(patch).eq('id',owner);
            if(result.error){if(patch.avatar_path)await client.storage.from('avatars').remove([patch.avatar_path]);checked(result);}
            if(photo!==undefined&&oldPath&&oldPath!==patch.avatar_path)await client.storage.from('avatars').remove([oldPath]); if(user?.id!==owner)throw new Error('Your account changed. Please reload.'); state.profile={...state.profile,...patch};changed(); }
        else {
            if(photo!==undefined){
                if(photo===null)patch.avatar_local=null;
                else {if(!(photo instanceof Blob)||photo.type!=='image/webp'||photo.size>524288)throw new Error('Choose a valid profile photo.');patch.avatar_local=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not save this photo.'));reader.readAsDataURL(photo);});}
            }
            persist({...state,profile:{...state.profile,...patch}});
        }
    }
    async function saveProfileBanner(gameId) {
        if (gameId !== null && !known(gameId)) throw new Error('Choose a game from the catalog.');
        const patch = { banner_game_id: gameId };
        if (!user) {
            persist({ ...state, profile: { ...state.profile, ...patch } });
            return;
        }
        const owner = requireUser();
        checked(await client.from('profiles').update(patch).eq('id', owner));
        if (user?.id !== owner) throw new Error('Your account changed. Please reload.');
        state.profile = { ...state.profile, ...patch };
        changed();
    }
    async function saveFavorites(ids) {
        validateIds(ids,4);
        if (user) { const owner=requireUser();checked(await client.rpc('set_favorites',{game_ids:ids}));if(user?.id!==owner)throw new Error('Your account changed. Please reload.');state.favorites=[...ids];changed(); }
        else persist({...state,favorites:[...ids]});
    }
    async function saveList(list) {
        const name=list.name.trim(),description=list.description.trim(),rawTags=list.tags||[],tags=cleanListTags(rawTags);
        if(!Array.isArray(rawTags)||rawTags.length!==tags.length)throw new Error('Use up to 8 different tags of 1 to 24 characters.');
        validateIds(list.gameIds,100);
        if(!name||name.length>80||description.length>500)throw new Error('Add a list name (up to 80 characters) and a description of up to 500 characters.');
        if(list.id&&!state.lists.some(item=>item.id===list.id))throw new Error('List not found.');
        if(user){ const owner=requireUser();
            const args={list_id:list.id||null,list_name:name,list_description:description,public_list:Boolean(list.is_public),game_ids:list.gameIds};
            let result=await client.rpc('save_game_list_v3',{...args,ranked_list:list.is_ranked===true,list_tags:tags});
            if(result.error?.code==='PGRST202'){
                if(tags.length||(state.lists.find(item=>item.id===list.id)?.tags||[]).length)throw new Error('List tags need the latest list update. Your selections have not been lost.');
                result=await client.rpc('save_game_list_v2',{...args,ranked_list:list.is_ranked===true});
            }
            if(result.error?.code==='PGRST202'){
                if(list.is_ranked===true)throw new Error('Ranked lists need the latest list update. Your selections have not been lost.');
                result=await client.rpc('save_game_list',args);
            }
            const id=checked(result);if(user?.id!==owner)throw new Error('Your account changed. Please reload.');await synchronize({user});return id; }
        const id=list.id||crypto.randomUUID(),now=new Date().toISOString();
        const saved={id,name,description,tags,is_public:false,is_ranked:list.is_ranked===true,gameIds:[...list.gameIds],created_at:state.lists.find(item=>item.id===id)?.created_at||now,updated_at:now};
        persist({...state,lists:[saved,...state.lists.filter(item=>item.id!==id)]});return id;
    }
    async function saveFeaturedList(id) {
        await ready;
        if(loading)throw new Error('Please wait for your profile to load.');
        if(id!==null&&!state.lists.some(list=>list.id===id))throw new Error('List not found.');
        if(user){const owner=requireUser();const result=await client.rpc('set_featured_game_list',{list_key:id});
            if(result.error?.code==='PGRST202')throw new Error('Featured lists need the latest community update.');
            checked(result);if(user?.id!==owner)throw new Error('Your account changed. Please reload.');
            state={...state,profile:{...state.profile,featured_list_id:id}};changed();
        }else persist({...state,profile:{...state.profile,featured_list_id:id}});
    }
    async function deleteList(id) {
        if(!state.lists.some(list=>list.id===id))throw new Error('List not found.');
        if(user){const owner=requireUser();checked(await client.from('game_lists').delete().eq('id',id).eq('user_id',owner));if(user?.id!==owner)throw new Error('Your account changed. Please reload.');state.lists=state.lists.filter(list=>list.id!==id);if(state.profile.featured_list_id===id)state.profile.featured_list_id=null;changed();}
        else persist({...state,profile:{...state.profile,featured_list_id:state.profile.featured_list_id===id?null:state.profile.featured_list_id},lists:state.lists.filter(list=>list.id!==id)});
    }
    async function submitFeedback(category,message){
        await ready;const owner=requireUser();message=String(message||'').trim();
        if(!['issue','image','suggestion','other'].includes(category)||message.length<10||message.length>500)throw new Error('Use 10 to 500 characters for your feedback.');
        const result=await client.rpc('submit_site_feedback',{feedback_category:category,feedback_message:message});
        if(result.error?.code==='PGRST202')throw new Error('Feedback needs the latest community update. Your message is still here.');
        const id=checked(result);if(user?.id!==owner)throw new Error('Your account changed. Please reload.');return id;
    }
    async function signIn(email,password){await ready;if(!client)throw new Error('Online accounts are not connected yet.');const data=checked(await client.auth.signInWithPassword({email,password}));await synchronize(data.session);if(issue)throw new Error(issue);}
    async function signUp(email,password,name){await ready;if(!client)throw new Error('Online accounts are not connected yet.');name=name.trim();if(name.length<2||name.length>40)throw new Error('Use 2 to 40 characters for your name.');const data=checked(await client.auth.signUp({email,password,options:{data:{display_name:name},emailRedirectTo:/^https?:$/.test(location.protocol)?new URL('../view/profile.html',base).href:undefined}}));if(data.session)await synchronize(data.session);return Boolean(data.session);}
    async function signOut(){if(client)checked(await client.auth.signOut());await synchronize(null);}
    async function ownReview(gameId,rating,text,date) {
        const owner=requireUser();
        const result=await client.rpc('save_review_log',{game_key:gameId,review_rating:rating,review_text:text,log_date:date}).single();
        const review=checked(result);
        if(user?.id!==owner)throw new Error('Your account changed. Please reload.');
        state.reviews=[...state.reviews.filter(item=>item.game_id!==gameId),review];
        window.dispatchEvent(new Event('backlog-diary-change'));
        return{rating:review.rating===null?null:Number(review.rating),text:review.text,updatedAt:review.updated_at,reviewedOn:review.reviewed_on};
    }
    async function getDiaryEntries(){
        const owner=requireUser(),entries=[];
        for(let offset=0;;offset+=500){
            const batch=checked(await client.from('diary_entries').select('id,game_id,review_id,rating,text,reviewed_on,created_at').eq('user_id',owner).order('reviewed_on',{ascending:false}).order('created_at',{ascending:false}).order('id').range(offset,offset+499))||[];
            if(user?.id!==owner)throw new Error('Your account changed. Please reload.');
            entries.push(...batch);
            if(batch.length<500)break;
        }
        return entries.map(entry=>({id:entry.id,gameId:entry.game_id,rating:entry.rating===null?null:Number(entry.rating),text:entry.text,reviewedOn:entry.reviewed_on,createdAt:entry.created_at}));
    }
    async function changeDiaryDate(id,date){
        const owner=requireUser();
        checked(await client.rpc('set_diary_date',{entry_key:id,new_date:date}));
        const reviews=checked(await client.from('reviews').select('*').eq('user_id',owner))||[];
        if(user?.id!==owner)throw new Error('Your account changed. Please reload.');
        state.reviews=reviews;
    }
    async function deleteDiaryEntry(id){
        const owner=requireUser();
        checked(await client.from('diary_entries').delete().eq('id',id).eq('user_id',owner));
        if(user?.id!==owner)throw new Error('Your account changed. Please reload.');
        state.reviews=state.reviews.map(review=>review.diary_entry_id===id?{...review,diary_entry_id:null}:review);
    }
    async function removeReview(gameId){const owner=requireUser();checked(await client.from('reviews').delete().eq('user_id',owner).eq('game_id',gameId));if(user?.id!==owner)throw new Error('Your account changed. Please reload.');state.reviews=state.reviews.filter(item=>item.game_id!==gameId);window.dispatchEvent(new CustomEvent('backlog-review-change',{detail:{id:gameId}}));}
    async function importDevice(){requireUser();const local=localState();await saveProfile(local.profile.display_name,local.profile.bio);await saveFavorites(local.favorites);for(const list of local.lists){if(!state.lists.some(existing=>existing.name===list.name&&existing.description===list.description&&Boolean(existing.is_ranked)===Boolean(list.is_ranked)&&JSON.stringify(existing.gameIds)===JSON.stringify(list.gameIds)))await saveList({...list,id:null,is_public:false});}}
    window.BacklogAccount=Object.freeze({
        ready,configured,get loading(){return loading;},get user(){return user?{id:user.id,email:user.email}:null;},get error(){return issue;},get client(){return client;},getState:()=>copy(state),
        saveProfile,saveProfileBanner,saveFavorites,saveList,saveFeaturedList,deleteList,submitFeedback,signIn,signUp,signOut,importDevice,saveReview:ownReview,removeReview,getDiaryEntries,changeDiaryDate,deleteDiaryEntry,
        getReview(gameId){const review=state.reviews.find(item=>item.game_id===gameId);return review?{rating:review.rating===null?null:Number(review.rating),text:review.text,updatedAt:review.updated_at,reviewedOn:review.reviewed_on||window.BacklogDiary?.dateFromTimestamp(review.updated_at)}:null;},
        async getProfile(id){await ready;if(!client)throw new Error('Online profiles are not connected yet.');if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error('Profile not found.');return loadPlayer(id,id===user?.id);}
    });
    window.addEventListener('storage',event=>{if(!user&&(event.key===localKey||event.key===null)){state=localState();changed();}});
})();
