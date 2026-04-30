window.DKYLogin = (function() {

  const SUPABASE_URL = window.DKY_CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.DKY_CONFIG.SUPABASE_ANON_KEY;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function render() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <h2>Iniciar Sesión</h2>
          <form id="login-form">
            <input type="email" id="email" placeholder="Email" required />
            <input type="password" id="password" placeholder="Contraseña" required />
            <button type="submit" class="btn-primary">Entrar</button>
            <div id="error-msg" class="error-msg"></div>
          </form>
        </div>
      </div>
    `;

    document.getElementById("login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        document.getElementById("error-msg").textContent = error.message;
      } else {
        window.history.pushState(null, "", "/admin");
        window.DKYRouter.navigate();
      }
    });
    return () => {};
  }
  return { render };
})();