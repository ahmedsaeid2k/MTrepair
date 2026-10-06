(function restoreSession(){
  try{
    localStorage.removeItem('microerp_session');
    localStorage.removeItem('microerp_session_token');
    const saved = sessionStorage.getItem('microerp_session');
    if(saved) {
      state.user = JSON.parse(saved);
      if(state.user){
        normalizeUserSections(state.user);
      }
    }
    const token = sessionStorage.getItem('microerp_session_token');
    if(token) {
      state.sessionToken = token;
    }
  }catch(e){}
})();



init();

// U13: Check and display boot banner if an unfinished intake draft exists in localStorage
(function checkBootDraft(){
  try {
    if(typeof checkAndShowDraftBootBanner === 'function'){
      setTimeout(checkAndShowDraftBootBanner, 300);
    }
  } catch(e){
    console.warn('[boot] checkBootDraft error:', e);
  }
})();
