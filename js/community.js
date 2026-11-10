(() => {
    'use strict';
    const account=window.BacklogAccount;
    const check=result=>{if(result.error)throw new Error(result.error.message||'Could not connect. Please try again.');return result.data;};
    async function client(required=false){await account.ready;if(!account.client)throw new Error('Community reviews are not connected yet.');if(required&&!account.user)throw new Error('Sign in to join the conversation.');return account.client;}
    window.BacklogCommunity=Object.freeze({
        async feed(gameId,offset=0){const api=await client();let result=await api.rpc('review_feed_v2',{game_key:gameId,page_offset:offset});if(result.error?.code==='PGRST202')result=await api.rpc('review_feed',{game_key:gameId,page_offset:offset});return check(result)||[];},
        async searchPlayers(query,offset=0){return check(await(await client()).rpc('search_players',{search_term:query,page_offset:offset}))||[];},
        async home(kind,offset=0){return check(await(await client(kind==='following')).rpc('home_review_feed',{feed_kind:kind,page_offset:offset}))||[];},
        async review(id){return (check(await(await client()).rpc('get_review_card',{review_key:id}))||[])[0];},
        async social(id){return (check(await(await client()).rpc('profile_social',{profile_key:id}))||[])[0];},
        async follow(id,value){check(await(await client(true)).rpc('set_profile_follow',{profile_key:id,should_follow:value}));},
        async connections(id,kind,offset=0){return check(await(await client()).rpc('profile_connections',{profile_key:id,connection_kind:kind,page_offset:offset}))||[];},
        async like(reviewId,liked){return Number(check(await(await client(true)).rpc('set_review_like',{review_key:reviewId,liked})));},
        async comments(reviewId,offset=0){return check(await(await client()).from('review_comments').select('id,user_id,text,created_at,profiles(id,display_name,avatar_path)').eq('review_id',reviewId).order('created_at').order('id').range(offset,offset+19))||[];},
        async comment(reviewId,text){text=text.trim();if(!text||text.length>1000)throw new Error('Write a comment of 1–1,000 characters.');const api=await client(true);return check(await api.from('review_comments').insert({review_id:reviewId,user_id:account.user.id,text}).select('id,user_id,text,created_at,profiles(id,display_name,avatar_path)').single());},
        async removeComment(id){const api=await client(true);check(await api.from('review_comments').delete().eq('id',id).eq('user_id',account.user.id));}
    });
})();
