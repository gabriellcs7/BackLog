(() => {
    'use strict';
    const account=window.BacklogAccount;
    const check=result=>{if(result.error)throw new Error(result.error.message||'Could not connect. Please try again.');return result.data;};
    async function client(required=false){await account.ready;if(!account.client)throw new Error('Community reviews are not connected yet.');if(required&&!account.user)throw new Error('Sign in to join the conversation.');return account.client;}
    window.BacklogCommunity=Object.freeze({
        async feed(gameId,offset=0){return check(await(await client()).rpc('review_feed',{game_key:gameId,page_offset:offset}))||[];},
        async like(reviewId,liked){return Number(check(await(await client(true)).rpc('set_review_like',{review_key:reviewId,liked})));},
        async comments(reviewId,offset=0){return check(await(await client()).from('review_comments').select('id,user_id,text,created_at,profiles(id,display_name)').eq('review_id',reviewId).order('created_at').order('id').range(offset,offset+19))||[];},
        async comment(reviewId,text){text=text.trim();if(!text||text.length>1000)throw new Error('Write a comment of 1–1,000 characters.');const api=await client(true);return check(await api.from('review_comments').insert({review_id:reviewId,user_id:account.user.id,text}).select('id,user_id,text,created_at,profiles(id,display_name)').single());},
        async removeComment(id){const api=await client(true);check(await api.from('review_comments').delete().eq('id',id).eq('user_id',account.user.id));}
    });
})();
