/* Diário: edição do registro atual e leitura de entradas anteriores. */
(() => {
    'use strict';
    const games=window.BacklogGames;
    const known=id=>games.some(game=>game.id===id);
    const key=id=>'backlog:review:'+id;
    const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
    function dateFromTimestamp(value){const d=new Date(value);if(!Number.isFinite(d.getTime()))return today();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
    function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'1900-01-01'||value>today())return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}
    const validRating=value=>value===null||(Number.isFinite(value)&&value>=0&&value<=5&&Number.isInteger(value*2));
    function raw(id){if(!known(id))return null;try{const value=JSON.parse(localStorage.getItem(key(id)));if(!value||!validRating(value.rating)||typeof value.text!=='string'||value.text.length>3000||(value.rating===null&&!value.text.trim())||!Number.isFinite(Date.parse(value.updatedAt)))return null;return value;}catch{return null;}}
    function history(id,value){if(!value)return[];if(Array.isArray(value.entries))return value.entries.filter(entry=>entry&&typeof entry.id==='string'&&entry.gameId===id&&validRating(entry.rating)&&typeof entry.text==='string'&&entry.text.length<=3000&&validDate(entry.reviewedOn)&&Number.isFinite(Date.parse(entry.createdAt)));
        return[{id:'legacy:'+id,gameId:id,rating:value.rating,text:value.text,reviewedOn:validDate(value.reviewedOn)?value.reviewedOn:dateFromTimestamp(value.updatedAt),createdAt:value.updatedAt}];}
    function notify(id){window.dispatchEvent(new CustomEvent('backlog-diary-change',{detail:{id}}));}
    function getDeviceReview(id){const value=raw(id);return value?{rating:value.rating,text:value.text,updatedAt:value.updatedAt,reviewedOn:validDate(value.reviewedOn)?value.reviewedOn:dateFromTimestamp(value.updatedAt)}:null;}
    function currentId(id,review){
        return review?.currentEntryId===undefined?'legacy:'+id:review.currentEntryId;
    }
    function saveDevice(id,rating,text,date){
        if(!known(id)||!validDate(date)||!validRating(rating))throw new Error('Invalid diary entry.');
        const previous=raw(id),entries=history(id,previous);
        const current=entries.find(entry=>entry.id===currentId(id,previous));
        const now=new Date().toISOString();
        const entry={id:current?.id||crypto.randomUUID(),gameId:id,rating,text,reviewedOn:date,createdAt:current?.createdAt||now};
        const value={rating,text,updatedAt:now,reviewedOn:date,currentEntryId:entry.id,
            entries:[...entries.filter(item=>item.id!==entry.id),entry]};
        localStorage.setItem(key(id),JSON.stringify(value));
        notify(id);
        return {rating,text,updatedAt:now,reviewedOn:date};
    }
    function localEntries(){return games.flatMap(game=>history(game.id,raw(game.id)));}
    async function entries(){const account=window.BacklogAccount;await account?.ready;return account?.user?account.getDiaryEntries():localEntries();}
    async function currentEntries(){
        const account=window.BacklogAccount;
        const all=await entries();
        if(account?.user){
            const ids=new Set(account.getState().reviews.map(review=>review.diary_entry_id).filter(Boolean));
            return all.filter(entry=>ids.has(entry.id));
        }
        return all.filter(entry=>entry.id===currentId(entry.gameId,raw(entry.gameId)));
    }
    async function changeDate(entryId,date){if(!validDate(date))throw new Error('Choose today or an earlier date.');const account=window.BacklogAccount;if(account?.user){await account.changeDiaryDate(entryId,date);notify(null);return;}
        const entry=localEntries().find(item=>item.id===entryId);if(!entry)throw new Error('Diary entry not found.');const value=raw(entry.gameId);value.entries=history(entry.gameId,value).map(item=>item.id===entryId?{...item,reviewedOn:date}:item);if(value.currentEntryId===entryId||(value.currentEntryId===undefined&&entryId==='legacy:'+entry.gameId))value.reviewedOn=date;localStorage.setItem(key(entry.gameId),JSON.stringify(value));notify(entry.gameId);}
    async function removeEntry(entryId){const account=window.BacklogAccount;if(account?.user){await account.deleteDiaryEntry(entryId);notify(null);return;}
        const entry=localEntries().find(item=>item.id===entryId);if(!entry)throw new Error('Diary entry not found.');const value=raw(entry.gameId);value.entries=history(entry.gameId,value).filter(item=>item.id!==entryId);if(value.currentEntryId===entryId||value.currentEntryId===undefined)value.currentEntryId=null;localStorage.setItem(key(entry.gameId),JSON.stringify(value));notify(entry.gameId);}
    window.BacklogDiary=Object.freeze({today,dateFromTimestamp,validDate,getDeviceReview,saveDevice,entries,currentEntries,changeDate,removeEntry});
})();
