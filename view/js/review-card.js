/* Shared public review, likes and discussion. */
(() => {
    'use strict';
    const account=window.BacklogAccount,api=window.BacklogCommunity,ui=window.BacklogUI,{element:el,action}=ui;
    const makeButton=(label,handler,className='social-button')=>{const b=el('button',className,label);b.type='button';b.addEventListener('click',handler);return b;};
    function reviewCard(review,expanded=false){
        const article=el('article','community-review');article.id='review-'+review.id;
        const header=el('div','community-review-header'),identity=el('div','community-player');
        const avatar=ui.avatar({id:review.user_id,display_name:review.display_name,avatar_path:review.avatar_path});
        const name=ui.profileLink({id:review.user_id,display_name:review.display_name});identity.append(avatar,name);header.append(identity,el('span','social-small',ui.date(review.updated_at)));
        const score=el('p','social-rating',review.rating===null?'Written review':review.rating+' / 5 ★');
        const text=el('p','community-review-text');
        if(expanded)text.textContent=review.text;
        else{
            const link=el('a','review-text-link',review.text||'Read review');
            link.href=ui.reviewHref('id',review.id);
            text.append(link);
        }
        const actions=el('div','social-actions'),message=el('p','social-feedback');message.setAttribute('role','status');
        const likes=makeButton('',()=>action(likes,message,async()=>{const next=!review.liked;review.like_count=await api.like(review.id,next);review.liked=next;renderLikes();}),'social-button review-like');
        function renderLikes(){likes.textContent=(review.liked?'♥ Liked':'♡ Like')+' · '+review.like_count;likes.setAttribute('aria-pressed',String(review.liked));likes.disabled=!account.user||review.user_id===account.user.id;likes.title=!account.user?'Sign in to like a review':review.user_id===account.user.id?'This is your review':review.liked?'Remove your like':'Like this review';}
        renderLikes();
        const comments=el('div','review-discussion');comments.hidden=true;comments.id='comments-'+review.id;
        const toggle=makeButton('Comments · '+review.comment_count,async()=>{comments.hidden=!comments.hidden;toggle.setAttribute('aria-expanded',String(!comments.hidden));if(!comments.hidden&&!loaded)await loadComments();});toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',comments.id);
        actions.append(likes,toggle);article.append(header,score,text,actions,message,comments);
        let loaded=false,commentOffset=0;
        const seenComments=new Set(),pagedComments=new Set();
        const commentList=el('div','comment-list'),commentFeedback=el('p','social-feedback');commentFeedback.setAttribute('role','status');
        const loadMore=makeButton('Load more comments',()=>loadComments());loadMore.hidden=true;
        comments.append(commentList,loadMore,commentFeedback);
        const updateCount=()=>{toggle.textContent='Comments · '+review.comment_count;};
        function commentRow(comment){const row=el('article','review-comment');const top=el('div','comment-heading');top.append(ui.avatar(comment.profiles||{id:comment.user_id,display_name:'Player'},'community-avatar comment-avatar'),ui.profileLink(comment.profiles||{id:comment.user_id,display_name:'Player'}),el('span','social-small',ui.date(comment.created_at)));row.append(top,el('p','comment-text',comment.text));
            if(account.user?.id===comment.user_id){const remove=makeButton('Delete',()=>action(remove,commentFeedback,async()=>{await api.removeComment(comment.id);row.remove();if(pagedComments.delete(comment.id))commentOffset=Math.max(0,commentOffset-1);seenComments.delete(comment.id);review.comment_count=Math.max(0,review.comment_count-1);updateCount();commentFeedback.textContent='Comment deleted.';}),'social-button social-button-quiet social-danger');remove.setAttribute('aria-label','Delete your comment');row.append(remove);}return row;}
        async function loadComments(){loadMore.disabled=true;commentFeedback.textContent='';try{const items=await api.comments(review.id,commentOffset);if(!loaded)commentList.replaceChildren();loaded=true;commentOffset+=items.length;for(const item of items){pagedComments.add(item.id);if(!seenComments.has(item.id)){seenComments.add(item.id);commentList.append(commentRow(item));}}if(!commentList.children.length)commentList.append(el('p','social-small comment-empty','No comments yet. Start the conversation.'));loadMore.hidden=items.length<20;}catch(error){commentFeedback.textContent=error.message;}finally{loadMore.disabled=false;}}
        if(account.user){const form=el('form','comment-form'),label=el('label','','Your comment'),input=el('textarea');input.rows=3;input.maxLength=1000;input.required=true;input.placeholder='Add to the conversation…';input.id='comment-input-'+review.id;label.htmlFor=input.id;label.append(input);const controls=el('div','comment-form-footer'),count=el('span','social-small','0 / 1,000'),submit=el('button','social-button social-button-primary','Post comment');submit.type='submit';input.addEventListener('input',()=>{count.textContent=input.value.length.toLocaleString('en')+' / 1,000';});controls.append(count,submit);form.append(label,controls);form.addEventListener('submit',event=>{event.preventDefault();action(submit,commentFeedback,async()=>{const comment=await api.comment(review.id,input.value);commentList.querySelector('.comment-empty')?.remove();seenComments.add(comment.id);commentList.append(commentRow(comment));input.value='';count.textContent='0 / 1,000';review.comment_count++;updateCount();commentFeedback.textContent='Comment posted.';input.focus();});});comments.append(form);}
        else{const login=el('a','social-button social-button-quiet','Sign in to comment ↗');login.href='profile.html#account';comments.append(login);}
        if(expanded){
            comments.hidden=false;
            toggle.setAttribute('aria-expanded','true');
            loadComments();
        }else{
            const read=el('a','social-button social-button-quiet','Read review ↗');
            read.href=ui.reviewHref('id',review.id);
            actions.append(read);
        }
        return article;
    }
    window.BacklogReviewCard=reviewCard;
})();
