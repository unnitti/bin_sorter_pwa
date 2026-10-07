const statusEl = document.querySelector('#status');
const countEl = document.querySelector('#count');
const resultList = document.querySelector('#resultList');
const emptyState = document.querySelector('#emptyState');
const retryButton = document.querySelector('#retry');
const stateIcon = document.querySelector('#stateIcon');

// 앞 두 자리 숫자 + 영문 2자리 + 숫자 7자리
const CODE_RE = /^\d{2}([a-z]{2})(\d{7})$/i;

function setStatus(message, busy = false) {
  statusEl.textContent = message;
  stateIcon.classList.toggle('busy', busy);
  stateIcon.textContent = busy ? '…' : '✓';
}

function cleanClipboard(text) {
  // 공백/탭/줄바꿈 등은 모두 항목 구분자로 보고 제거합니다.
  return text.split(/\s+/).map(value => value.trim()).filter(Boolean);
}

function parseAndSort(text) {
  const values = cleanClipboard(text);
  const valid = [];
  let invalidCount = 0;

  for (const value of values) {
    const match = value.match(CODE_RE);
    if (!match) {
      invalidCount++;
      continue;
    }

    const letters = match[1].toUpperCase();
    const digits = match[2];
    valid.push({ letters, number: Number(digits), digits });
  }

  valid.sort((a, b) => {
    const letterOrder = a.letters.localeCompare(b.letters, 'en', { sensitivity: 'base' });
    return letterOrder || a.number - b.number;
  });

  return { valid, invalidCount };
}

function formatCode(item) {
  const first = String(Number(item.digits.slice(0, 2)));
  const second = item.digits.slice(2, 4);
  const third = item.digits.slice(4, 7);
  return `${item.letters}${first}-${second}-${third}`;
}

function showResults(items) {
  resultList.replaceChildren();

  if (!items.length) {
    emptyState.hidden = false;
    countEl.textContent = '0개';
    return '';
  }

  emptyState.hidden = true;
  const output = [];

  for (const item of items) {
    const value = formatCode(item);
    output.push(value);
    const li = document.createElement('li');
    li.textContent = value;
    resultList.appendChild(li);
  }

  countEl.textContent = `${items.length}개`;
  return output.join('\n');
}

async function processClipboard() {
  setStatus('클립보드에서 가져오는 중…', true);

  try {
    const text = await navigator.clipboard.readText();
    const { valid, invalidCount } = parseAndSort(text);
    const output = showResults(valid);

    if (!valid.length) {
      setStatus('정렬할 수 있는 코드가 없습니다.');
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      const suffix = invalidCount ? ` · ${invalidCount}개 제외` : '';
      setStatus(`${valid.length}개가 정렬되어 클립보드에 복사되었습니다${suffix}.`);
    } catch {
      setStatus(`${valid.length}개를 정렬했습니다. 클립보드 복사는 허용되지 않았습니다.`);
    }
  } catch {
    showResults([]);
    setStatus('클립보드 접근이 필요합니다. 아래 버튼을 눌러 다시 시도해 주세요.');
  }
}

retryButton.addEventListener('click', processClipboard);

// 앱 실행 시 바로 처리합니다.
processClipboard();
