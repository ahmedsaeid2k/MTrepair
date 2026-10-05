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
