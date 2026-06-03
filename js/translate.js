// 직급 번역 — POSITION_DICT 우선, 없으면 Claude API 호출

async function translatePosition(positionKr) {
  const trimmed = positionKr.trim();
  if (POSITION_DICT[trimmed]) {
    return POSITION_DICT[trimmed];
  }
  // 부분 매칭 시도
  for (const [key, vals] of Object.entries(POSITION_DICT)) {
    if (trimmed.includes(key) || key.includes(trimmed)) {
      return vals;
    }
  }
  // Claude API 호출 (프록시 필요 — Supabase Edge Function 미설정 시 폴백)
  if (CONFIG.claude.apiKey === 'YOUR_CLAUDE_API_KEY') {
    return ['Manager', 'Staff', 'Officer'];
  }
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.claude.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CONFIG.claude.model,
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Korean job title "${trimmed}" — give 4 common English equivalents used in Korean companies. Reply ONLY a JSON array of strings, no explanation.`,
        }],
      }),
    });
    const data = await resp.json();
    const text = data.content?.[0]?.text || '[]';
    return JSON.parse(text);
  } catch (e) {
    console.error('[translate] Claude API 오류:', e);
    return ['Manager', 'Staff', 'Officer'];
  }
}

function showTranslationSuggestions(suggestions, targetInputId) {
  const input = document.getElementById(targetInputId);
  if (!input) return;
  const existing = document.getElementById('translation-suggestions');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'translation-suggestions';
  wrapper.className = 'translation-suggestions';

  suggestions.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'suggestion-btn';
    btn.textContent = s;
    btn.onclick = () => {
      input.value = s;
      input.dispatchEvent(new Event('input'));
      wrapper.remove();
    };
    wrapper.appendChild(btn);
  });

  input.parentNode.insertBefore(wrapper, input.nextSibling);
}
