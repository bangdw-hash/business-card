// =====================================================
// Supabase Client Initialization
// js/supabase-client.js
// =====================================================

(function () {
  'use strict';

  // Check if CONFIG is available
  if (typeof CONFIG === 'undefined') {
    console.error('[Supabase] CONFIG is not defined. Make sure config.js is loaded before supabase-client.js');
    return;
  }

  // Check for placeholder values
  const isPlaceholderUrl = !CONFIG.supabase.url ||
    CONFIG.supabase.url === 'https://YOUR_PROJECT_ID.supabase.co' ||
    CONFIG.supabase.url.includes('YOUR_PROJECT_ID');

  const isPlaceholderKey = !CONFIG.supabase.anonKey ||
    CONFIG.supabase.anonKey === 'YOUR_SUPABASE_ANON_KEY';

  if (isPlaceholderUrl || isPlaceholderKey) {
    console.warn(
      '[Supabase] CONFIG을 설정하세요!\n' +
      'js/config.js 파일에서 supabase.url 과 supabase.anonKey 를 실제 값으로 교체해주세요.\n' +
      'Supabase 대시보드: https://app.supabase.com'
    );
    // Create a mock client that shows helpful errors
    window.supabase = createMockClient();
    return;
  }

  // Check if Supabase SDK is loaded
  if (typeof supabaseJs === 'undefined' && typeof window.supabase !== 'object') {
    // Try the global from CDN
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
      initClient(window.supabase.createClient);
    } else {
      console.error('[Supabase] Supabase JS SDK가 로드되지 않았습니다. CDN 링크를 확인해주세요.');
      window.supabase = createMockClient();
    }
    return;
  }

  function initClient(createClientFn) {
    try {
      window.supabase = createClientFn(
        CONFIG.supabase.url,
        CONFIG.supabase.anonKey,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          },
          global: {
            headers: {
              'X-App-Name': 'asea-business-card',
            },
          },
        }
      );
      console.log('[Supabase] 클라이언트 초기화 완료');
    } catch (error) {
      console.error('[Supabase] 초기화 오류:', error);
      window.supabase = createMockClient();
    }
  }

  // Wait for the CDN script to load, then initialize
  function waitForSupabase(retries) {
    retries = retries || 0;
    if (retries > 20) {
      console.error('[Supabase] SDK 로드 타임아웃. CDN 연결을 확인해주세요.');
      window.supabase = createMockClient();
      return;
    }

    // Supabase CDN v2 exposes `supabase` on window or as module
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      // SDK loaded but not yet initialized as client — initialize
      var createClientFn = window.supabase.createClient;
      initClient(createClientFn);
    } else if (typeof createClient === 'function') {
      initClient(createClient);
    } else {
      setTimeout(function () {
        waitForSupabase(retries + 1);
      }, 150);
    }
  }

  // The CDN script sets window.supabase = { createClient, ... }
  // We need to check if it's the SDK namespace or already our client
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    var createClientFn = window.supabase.createClient;
    initClient(createClientFn);
  } else if (typeof createClient === 'function') {
    initClient(createClient);
  } else {
    waitForSupabase(0);
  }

  // --------------------------------------------------
  // Mock client for development/misconfiguration
  // --------------------------------------------------
  function createMockClient() {
    function mockError(method) {
      return function () {
        console.warn('[Supabase Mock] ' + method + '() called — CONFIG.supabase를 올바르게 설정해주세요.');
        return Promise.resolve({ data: null, error: { message: 'Supabase가 설정되지 않았습니다. CONFIG.supabase를 설정해주세요.' } });
      };
    }

    var chain = {
      select: function () { return chain; },
      insert: mockError('insert'),
      update: mockError('update'),
      delete: mockError('delete'),
      eq: function () { return chain; },
      neq: function () { return chain; },
      in: function () { return chain; },
      gte: function () { return chain; },
      lte: function () { return chain; },
      order: function () { return chain; },
      limit: function () { return chain; },
      single: function () { return Promise.resolve({ data: null, error: { message: 'Supabase가 설정되지 않았습니다.' } }); },
      then: function (resolve) { return resolve({ data: [], error: null }); },
    };

    return {
      from: function (table) {
        console.warn('[Supabase Mock] from("' + table + '") called');
        return chain;
      },
      auth: {
        signInWithPassword: mockError('auth.signInWithPassword'),
        signOut: mockError('auth.signOut'),
        getSession: function () { return Promise.resolve({ data: { session: null }, error: null }); },
        onAuthStateChange: function (cb) { return { data: { subscription: { unsubscribe: function () {} } } }; },
      },
      channel: function () {
        return {
          on: function () { return this; },
          subscribe: function () {},
        };
      },
      removeChannel: function () {},
    };
  }
})();
