// =====================================================
// Korean Title Translation
// js/translate.js
// =====================================================

'use strict';

/**
 * Translate a Korean position/title to English suggestions.
 * First checks POSITION_DICT, then optionally calls Claude API via Edge Function.
 * @param {string} positionKr
 * @returns {Promise<string[]>} Array of English suggestions
 */
async function translatePosition(positionKr) {
  if (!positionKr || positionKr.trim() === '') return [];

  const trimmed = positionKr.trim();

  // 1. Exact match in dictionary
  if (CONFIG.POSITION_DICT[trimmed]) {
    return CONFIG.POSITION_DICT[trimmed];
  }

  // 2. Partial match (contains the key)
  const partialMatches = [];
  for (const [kr, enArr] of Object.entries(CONFIG.POSITION_DICT)) {
    if (trimmed.includes(kr) || kr.includes(trimmed)) {
      enArr.forEach(function(en) {
        if (!partialMatches.includes(en)) partialMatches.push(en);
      });
    }
  }

  if (partialMatches.length > 0) {
    return partialMatches.slice(0, 5);
  }

  // 3. Try Claude API via Edge Function if configured
  if (CONFIG.claude.enabled && CONFIG.claude.edgeFunctionUrl &&
      !CONFIG.claude.edgeFunctionUrl.includes('YOUR_PROJECT_ID')) {
    try {
      const resp = await fetch(CONFIG.claude.edgeFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionKr: trimmed }),
      });
      if (resp.ok) {
        const result = await resp.json();
        if (result.suggestions && Array.isArray(result.suggestions)) {
          return result.suggestions.slice(0, 5);
        }
      }
    } catch (e) {
      console.warn('[Translate] Edge Function 호출 오류:', e);
    }
  }

  // 4. Fallback: return a generic suggestion based on common patterns
  return generateFallbackSuggestions(trimmed);
}

/**
 * Generate fallback English title suggestions for unknown Korean titles.
 * @param {string} positionKr
 * @returns {string[]}
 */
function generateFallbackSuggestions(positionKr) {
  const suggestions = [];

  // Common suffix mappings
  const suffixMap = {
    '장': ['Director', 'Head', 'Chief'],
    '실장': ['Section Manager', 'Division Head'],
    '팀장': ['Team Leader', 'Team Manager'],
    '과장': ['Manager', 'Section Chief'],
    '대리': ['Assistant Manager'],
    '주임': ['Senior Staff', 'Lead Staff'],
    '사원': ['Staff', 'Associate'],
    '원': ['Officer', 'Staff'],
    '교수': ['Professor'],
    '강사': ['Instructor', 'Lecturer'],
    '연구원': ['Researcher', 'Research Fellow'],
  };

  for (const [suffix, titles] of Object.entries(suffixMap)) {
    if (positionKr.endsWith(suffix)) {
      titles.forEach(function(t) {
        if (!suggestions.includes(t)) suggestions.push(t);
      });
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('Manager', 'Officer', 'Staff', 'Associate', 'Director');
  }

  return suggestions.slice(0, 5);
}

/**
 * Show translation suggestion chips below a target input.
 * @param {string[]} suggestions
 * @param {string} targetInputId
 */
function showTranslationSuggestions(suggestions, targetInputId) {
  const targetInput = document.getElementById(targetInputId);
  if (!targetInput) return;

  // Remove existing suggestions container
  const existingContainer = document.getElementById('suggestions-' + targetInputId);
  if (existingContainer) existingContainer.remove();

  if (!suggestions || suggestions.length === 0) return;

  const container = document.createElement('div');
  container.id = 'suggestions-' + targetInputId;
  container.className = 'translation-suggestions';

  const label = document.createElement('span');
  label.style.cssText = 'font-size:11px;color:#6b7280;align-self:center;margin-right:4px;';
  label.textContent = '제안:';
  container.appendChild(label);

  suggestions.forEach(function(suggestion) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'suggestion-chip';
    chip.textContent = suggestion;
    chip.addEventListener('click', function() {
      targetInput.value = suggestion;
      // Trigger input event for live preview
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));
      // Highlight selected chip
      container.querySelectorAll('.suggestion-chip').forEach(function(c) {
        c.style.background = '';
        c.style.color = '';
      });
      chip.style.background = 'var(--primary)';
      chip.style.color = '#fff';
    });
    container.appendChild(chip);
  });

  // Insert after target input
  targetInput.parentNode.insertBefore(container, targetInput.nextSibling);

  // Auto-remove after 30 seconds
  setTimeout(function() {
    if (container.parentNode) container.remove();
  }, 30000);
}

/**
 * Clear suggestions for a given input
 * @param {string} targetInputId
 */
function clearTranslationSuggestions(targetInputId) {
  const container = document.getElementById('suggestions-' + targetInputId);
  if (container) container.remove();
}
