(function restoreSession(){
  try{
    let saved = sessionStorage.getItem('microerp_session') || localStorage.getItem('microerp_session');
    const sTok = sessionStorage.getItem('microerp_session_token');
    const lTok = localStorage.getItem('microerp_session_token');
    let token = '';
    if (sTok && !String(sTok).startsWith('offline_token_')) token = sTok;
    else if (lTok && !String(lTok).startsWith('offline_token_')) token = lTok;
    else token = sTok || lTok || '';

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
