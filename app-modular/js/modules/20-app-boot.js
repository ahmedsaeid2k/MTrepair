(function restoreSession(){
  try{
    const saved = sessionStorage.getItem('microerp_session') || localStorage.getItem('microerp_session');
    if(saved) {
      state.user = JSON.parse(saved);
      if(state.user){
        normalizeUserSections(state.user);
      }
    }
    const token = sessionStorage.getItem('microerp_session_token') || localStorage.getItem('microerp_session_token');
    if(token) {
      state.sessionToken = token;
    }
  }catch(e){}
})();



init();
