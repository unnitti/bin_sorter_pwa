const statusEl = document.querySelector('#status');
const countEl = document.querySelector('#count');
const resultList = document.querySelector('#resultList');
const emptyState = document.querySelector('#emptyState');
const importButton = document.querySelector('#importClipboard');
const copyAllButton = document.querySelector('#copyAll');
const sortToggleButton = document.querySelector('#sortToggle');
const stateIcon = document.querySelector('#stateIcon');

// 앞 두 자리 숫자는 무시하고, 영문 2자리 + 숫자 7자리만 사용합니다.
const CODE_RE = /^\d{2}([a-z]{2})(\d{7})$/i;

let sortedItems = [];
let sortDescending = false;

function setStatus(message, busy = false) {
  statusEl.textContent = message;
  stateIcon.classList.toggle('busy', busy);
  stateIcon.textContent = busy ? '…' : '✓';
}

function cleanClipboard(text) {
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

  valid.sort(compareItems);
  return { valid, invalidCount };
}

function compareItems(a, b) {
  const letterOrder = a.letters.localeCompare(b.letters, 'en', { sensitivity: 'base' });
  return letterOrder || a.number - b.number;
}

function formatCode(item) {
  const first = String(Number(item.digits.slice(0, 2)));
  const second = item.digits.slice(2, 4);
  const third = item.digits.slice(4, 7);
  return `${item.letters}${first}-${second}-${third}`;
}

function updateSortButton() {
  sortToggleButton.textContent = sortDescending ? '오름차순' : '내림차순';
  sortToggleButton.setAttribute('aria-label', `${sortDescending ? '오름차순' : '내림차순'}으로 정렬`);
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus(successMessage);
    return true;
  } catch {
    setStatus('클립보드에 복사하지 못했습니다.');
    return false;
  }
}

function showResults(items, invalidCount = 0) {
  resultList.replaceChildren();
  sortedItems = items;

  if (!items.length) {
    emptyState.hidden = false;
    countEl.textContent = '0개';
    copyAllButton.disabled = true;
    sortToggleButton.disabled = true;
    return;
  }

  emptyState.hidden = true;
  copyAllButton.disabled = false;
  sortToggleButton.disabled = false;

  for (const item of items) {
    const value = formatCode(item);
    const li = document.createElement('li');
    li.textContent = value;
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', `${value} 복사`);
    li.addEventListener('click', () => copyText(value, `${value}가 클립보드에 복사되었습니다.`));
    li.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        copyText(value, `${value}가 클립보드에 복사되었습니다.`);
      }
    });
    resultList.appendChild(li);
  }

  countEl.textContent = `${items.length}개 · ${sortDescending ? '내림차순' : '오름차순'}`;

  if (invalidCount) {
    setStatus(`${items.length}개를 정렬했습니다. ${invalidCount}개는 제외되었습니다.`);
  } else {
    setStatus(`${items.length}개를 정렬했습니다. 필요한 줄을 누르거나 전체 복사를 이용하세요.`);
  }
}

function applySort() {
  sortedItems = [...sortedItems].sort(compareItems);
  if (sortDescending) sortedItems.reverse();
  showResults(sortedItems);
}

async function processClipboard() {
  setStatus('클립보드에서 가져오는 중…', true);

  try {
    const text = await navigator.clipboard.readText();
    const { valid, invalidCount } = parseAndSort(text);
    if (sortDescending) valid.reverse();
    showResults(valid, invalidCount);

    if (!valid.length) {
      setStatus('정렬할 수 있는 지번이 없습니다.');
    }
  } catch {
    showResults([]);
    setStatus('아래 클립보드 가져오기 버튼을 눌러주세요.');
  }
}

sortToggleButton.addEventListener('click', () => {
  sortDescending = !sortDescending;
  updateSortButton();
  if (sortedItems.length) applySort();
});

copyAllButton.addEventListener('click', () => {
  const output = sortedItems.map(formatCode).join('\n');
  copyText(output, `${sortedItems.length}개가 클립보드에 복사되었습니다.`);
});

importButton.addEventListener('click', processClipboard);

updateSortButton();
showResults([]);
setStatus('클립보드의 지번을 가져오려면 아래 버튼을 눌러주세요.');
