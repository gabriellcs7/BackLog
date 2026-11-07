/* Contas, perfil e listas. Sem configuração, mantém um perfil somente neste dispositivo. */
(() => {
    'use strict';
    const base = new URL('.', document.currentScript.src);
    const config = window.BacklogConfig || {};
    const configured = Boolean(config.supabaseUrl && config.supabasePublishableKey);
    const games = window.BacklogGames;
    const known = id => games.some(game => game.id === id);
    const localKey = 'backlog:player:local';
    let client = null, user = null, issue = '', generation = 0;
    const empty = () => ({ profile: { id: 'local', display_name: 'Your profile', bio: '' }, favorites: [], lists: [], reviews: [] });
    let state = empty();
    function localState() {
        try {
            const value = JSON.parse(localStorage.getItem(localKey));
            if (!value || !value.profile || !Array.isArray(value.favorites) || !Array.isArray(value.lists)) return empty();
            return { profile: { id: 'local', display_name: String(value.profile.display_name || 'Your profile').slice(0,40), bio: String(value.profile.bio || '').slice(0,280) }, favorites: [...new Set(value.favorites.filter(known))].slice(0,4), lists: value.lists.filter(list => typeof list.id === 'string' && typeof list.name === 'string' && Array.isArray(list.gameIds)).map(list => ({ ...list, name: list.name.slice(0,80), description: String(list.description || '').slice(0,500), gameIds: [...new Set(list.gameIds.filter(known))], is_public: false })), reviews: [] };
        } catch { return empty(); }
    }
    const copy = value => JSON.parse(JSON.stringify(value));
    function changed() { window.dispatchEvent(new Event('backlog-account-change')); }
    function persist(next) { localStorage.setItem(localKey, JSON.stringify(next)); state = next; changed(); }
    function requireUser() { if (!client || !user) throw new Error('Sign in to use this feature.'); return user.id; }
    function checked(result) { if (result.error) throw new Error(result.error.message || 'Could not connect. Please try again.'); return result.data; }
    async function loadPlayer(id, own) {
        const [profile, favorites, lists] = await Promise.all([
            client.from('profiles').select('id,display_name,bio,created_at').eq('id',id).maybeSingle(),
            client.from('favorites').select('game_id,position').eq('user_id',id).order('position'),
            (own ? client.from('game_lists').select('*,list_games(game_id,position)').eq('user_id',id) : client.from('game_lists').select('*,list_games(game_id,position)').eq('user_id',id).eq('is_public',true)).order('updated_at',{ascending:false})
        ]);
        return { profile: checked(profile), favorites: (checked(favorites) || []).map(item=>item.game_id).filter(known), lists: (checked(lists) || []).map(list=>({ ...list, gameIds: list.list_games.sort((a,b)=>a.position-b.position).map(item=>item.game_id).filter(known) })), reviews: [] };
    }
    async function synchronize(session) {
        const ticket = ++generation;
        user = session?.user || null;
        issue = '';
        if (!user) { state = localState(); changed(); return; }
        state = { ...empty(), profile: { id: user.id, display_name: 'Player', bio: '' } };
        changed();
        try {
            const owner = user.id;
            const [player, reviews] = await Promise.all([loadPlayer(owner,true), client.from('reviews').select('id,game_id,rating,text,updated_at').eq('user_id',owner)]);
            if (ticket !== generation) return;
            if (!player.profile) throw new Error('Your profile could not be loaded. Please try again.');
            player.reviews = checked(reviews) || [];
            state = player;
        } catch (error) { if (ticket === generation) issue = error.message; }
        if (ticket === generation) changed();
    }
    function validateIds(ids, maximum) { if (!Array.isArray(ids) || ids.length > maximum || ids.some(id=>!known(id)) || new Set(ids).size !== ids.length) throw new Error('Choose different games from the catalog.'); }
    const ready = (async () => {
        state = localState();
        if (!configured) return;
        try {
            if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?\/?$/i.test(config.supabaseUrl)) throw new Error('Online configuration is invalid.');
            await new Promise((resolve,reject)=>{ const script=document.createElement('script'); script.src=new URL('vendor/supabase.js',base).href; script.onload=resolve; script.onerror=()=>reject(new Error('Could not load online accounts.')); document.head.append(script); });
            client = window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey);
            client.auth.onAuthStateChange((_event,session)=>{ setTimeout(()=>synchronize(session).catch(error=>{issue=error.message;changed();}),0); });
            const { data, error } = await client.auth.getSession();
            if (error) throw error;
            await synchronize(data.session);
        } catch (error) { issue = error.message; changed(); }
    })();
    async function saveProfile(name,bio) {
        name=name.trim();bio=bio.trim();
        if (name.length<2||name.length>40||bio.length>280) throw new Error('Use 2–40 characters for your name and up to 280 for your bio.');
        if (user) { checked(await client.from('profiles').update({display_name:name,bio}).eq('id',requireUser())); state.profile={...state.profile,display_name:name,bio};changed(); }
        else persist({...state,profile:{...state.profile,display_name:name,bio}});
    }
    async function saveFavorites(ids) {
        validateIds(ids,4);
        if (user) { checked(await client.rpc('set_favorites',{game_ids:ids}));state.favorites=[...ids];changed(); }
        else persist({...state,favorites:[...ids]});
    }
    async function saveList(list) {
        const name=list.name.trim(),description=list.description.trim();
        validateIds(list.gameIds,100);
        if(!name||name.length>80||description.length>500)throw new Error('Add a list name (up to 80 characters) and a description of up to 500 characters.');
        if(list.id&&!state.lists.some(item=>item.id===list.id))throw new Error('List not found.');
        if(user){ const id=checked(await client.rpc('save_game_list',{list_id:list.id||null,list_name:name,list_description:description,public_list:Boolean(list.is_public),game_ids:list.gameIds}));await synchronize({user});return id; }
        const id=list.id||crypto.randomUUID(),now=new Date().toISOString();
        const saved={id,name,description,is_public:false,gameIds:[...list.gameIds],created_at:state.lists.find(item=>item.id===id)?.created_at||now,updated_at:now};
        persist({...state,lists:[saved,...state.lists.filter(item=>item.id!==id)]});return id;
    }
    async function deleteList(id) {
        if(!state.lists.some(list=>list.id===id))throw new Error('List not found.');
        if(user){checked(await client.from('game_lists').delete().eq('id',id).eq('user_id',requireUser()));state.lists=state.lists.filter(list=>list.id!==id);changed();}
        else persist({...state,lists:state.lists.filter(list=>list.id!==id)});
    }
    async function signIn(email,password){await ready;if(!client)throw new Error('Online accounts are not connected yet.');const data=checked(await client.auth.signInWithPassword({email,password}));await synchronize(data.session);if(issue)throw new Error(issue);}
    async function signUp(email,password,name){await ready;if(!client)throw new Error('Online accounts are not connected yet.');name=name.trim();if(name.length<2||name.length>40)throw new Error('Use 2–40 characters for your name.');const data=checked(await client.auth.signUp({email,password,options:{data:{display_name:name}}}));if(data.session)await synchronize(data.session);return Boolean(data.session);}
    async function signOut(){if(client)checked(await client.auth.signOut());await synchronize(null);}
    async function ownReview(gameId,rating,text) {
        const owner=requireUser();
        const existing=state.reviews.find(review=>review.game_id===gameId);
        const fields={rating,text,updated_at:new Date().toISOString()};
        const result=existing ? await client.from('reviews').update(fields).eq('id',existing.id).eq('user_id',owner).select('id,game_id,rating,text,updated_at').single() : await client.from('reviews').insert({...fields,user_id:owner,game_id:gameId}).select('id,game_id,rating,text,updated_at').single();
        const review=checked(result);state.reviews=[...state.reviews.filter(item=>item.game_id!==gameId),review];window.dispatchEvent(new CustomEvent('backlog-review-change',{detail:{id:gameId}}));return{rating:review.rating,text:review.text,updatedAt:review.updated_at};
    }
    async function removeReview(gameId){const owner=requireUser();checked(await client.from('reviews').delete().eq('user_id',owner).eq('game_id',gameId));state.reviews=state.reviews.filter(item=>item.game_id!==gameId);window.dispatchEvent(new CustomEvent('backlog-review-change',{detail:{id:gameId}}));}
    async function importDevice(){requireUser();const local=localState();await saveProfile(local.profile.display_name,local.profile.bio);await saveFavorites(local.favorites);for(const list of local.lists)await saveList({...list,id:null,is_public:false});}
    window.BacklogAccount=Object.freeze({
        ready,configured,get user(){return user?{id:user.id,email:user.email}:null;},get error(){return issue;},get client(){return client;},getState:()=>copy(state),
        saveProfile,saveFavorites,saveList,deleteList,signIn,signUp,signOut,importDevice,saveReview:ownReview,removeReview,
        getReview(gameId){const review=state.reviews.find(item=>item.game_id===gameId);return review?{rating:review.rating,text:review.text,updatedAt:review.updated_at}:null;},
        async getProfile(id){await ready;if(!client)throw new Error('Online profiles are not connected yet.');if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error('Profile not found.');return loadPlayer(id,id===user?.id);}
    });
    window.addEventListener('storage',event=>{if(!user&&(event.key===localKey||event.key===null)){state=localState();changed();}});
})();
