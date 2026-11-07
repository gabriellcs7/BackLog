/* Avaliações pessoais e diário, com notas de zero a cinco em meias estrelas. */
(() => {
    'use strict';
    const limit=3000,diary=window.BacklogDiary;
    const validGame=id=>window.BacklogGames.some(game=>game.id===id);
    const validRating=rating=>rating===null||(Number.isFinite(rating)&&Number.isInteger(rating*2)&&rating>=0&&rating<=5);
    function getDevice(id){return diary.getDeviceReview(id);}
    function get(id){return window.BacklogAccount?.user?window.BacklogAccount.getReview(id):getDevice(id);}
    function completedSave(id,value){
        let statusWarning=false;
        try{if(window.Backlog&&!window.Backlog.getStatus(id))window.Backlog.setStatus(id,'played');}catch{statusWarning=true;}
        window.dispatchEvent(new CustomEvent('backlog-review-change',{detail:{id}}));
        return {...value,statusWarning};
    }
    function save(id,rating,text,date=diary.today()){
        if(!validGame(id)||!validRating(rating)||typeof text!=='string'||text.length>limit)throw new Error('Invalid review.');
        if(!diary.validDate(date))throw new Error('Choose today or an earlier date.');
        const cleaned=text.trim();if(rating===null&&!cleaned)throw new Error('Choose a rating or write a review.');
        if(window.BacklogAccount?.user)return window.BacklogAccount.saveReview(id,rating,cleaned,date).then(value=>completedSave(id,value));
        return completedSave(id,diary.saveDevice(id,rating,cleaned,date));
    }
    function remove(id){if(!validGame(id))throw new Error('Invalid game.');if(window.BacklogAccount?.user)return window.BacklogAccount.removeReview(id);localStorage.removeItem('backlog:review:'+id);window.dispatchEvent(new CustomEvent('backlog-review-change',{detail:{id}}));window.dispatchEvent(new Event('backlog-diary-change'));}
    window.BacklogReviews=Object.freeze({get,getDevice,save,remove,limit});
})();
