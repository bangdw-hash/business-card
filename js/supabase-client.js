// Supabase 클라이언트 초기화
// CDN: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let supabase = null;

function initSupabase() {
  if (CONFIG.supabase.url === 'YOUR_SUPABASE_URL') {
    console.warn('[Supabase] CONFIG.supabase.url 를 실제 값으로 설정하세요. (js/config.js)');
    return null;
  }
  try {
    supabase = window.supabase.createClient(
      CONFIG.supabase.url,
      CONFIG.supabase.anonKey
    );
    window._supabase = supabase;
    return supabase;
  } catch (e) {
    console.error('[Supabase] 초기화 실패:', e);
    return null;
  }
}

// DOM 로드 후 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
});
