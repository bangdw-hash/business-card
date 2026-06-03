// Supabase 클라이언트 초기화
// CDN: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// 초기화 후 window.supabase 와 window._supabase 모두 클라이언트 인스턴스가 됩니다.

function initSupabase() {
  if (CONFIG.supabase.url === 'YOUR_SUPABASE_URL') {
    console.warn('[Supabase] js/config.js 의 supabase.url 을 실제 값으로 교체하세요.');
    return null;
  }
  try {
    const lib    = window.supabase;                                       // CDN 라이브러리
    const client = lib.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    // CDN 라이브러리 참조를 클라이언트로 교체 — window.supabase.from() 패턴 지원
    window.supabase  = client;
    window._supabase = client;
    return client;
  } catch (e) {
    console.error('[Supabase] 초기화 실패:', e);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
});
