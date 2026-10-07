(function restoreSession(){
  try{
    let saved = sessionStorage.getItem('microerp_session');
    let token = sessionStorage.getItem('microerp_session_token');
    if (!saved) {
      saved = localStorage.getItem('microerp_session');
      token = localStorage.getItem('microerp_session_token');
    }
    if(saved) {
      state.user = JSON.parse(saved);
      if(state.user){
        normalizeUserSections(state.user);
      }
    }
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
