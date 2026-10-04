(function restoreSession(){
  try{
    const saved = sessionStorage.getItem('mterp_session') || localStorage.getItem('mterp_session');
    if(saved) {
      state.user = JSON.parse(saved);
      if(state.user){
        normalizeUserSections(state.user);
      }
    }
    const token = sessionStorage.getItem('mterp_session_token') || localStorage.getItem('mterp_session_token');
    if(token) {
      state.sessionToken = token;
    }
  }catch(e){}
})();



init();
