// ==========================================
// Unity Packages Doc Nav Extractor
// content-unity-packages.js
// ==========================================

/**
 * サイドバーコンテナを取得する
 * #toc 内の最初の ul.nav を返す
 * @returns {Element|null}
 */
function getSidenav() {
  const toc = document.querySelector('#toc');
  if (!toc) return null;
  return toc.querySelector(':scope > ul.nav');
}

/**
 * サイドバーの全展開ボタンをクリックして全階層を開く
 * Bootstrap collapse パターン: li に "in" クラスがない = 折りたたみ状態
 * @returns {Promise<number>} 展開したボタン数
 */
async function expandAllMenuItems() {
  const sidenav = getSidenav();
  if (!sidenav) throw new Error('ナビゲーションメニューが見つかりません');

  let totalClicked = 0;
  const MAX_PASSES = 10;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const collapsed = Array.from(sidenav.querySelectorAll('li > span.expand-stub'))
      .filter(span => !span.parentElement.classList.contains('in'));
    if (collapsed.length === 0) break;
    collapsed.forEach(span => span.click());
    totalClicked += collapsed.length;
    await new Promise(r => setTimeout(r, 200));
  }
  return totalClicked;
}

/**
 * 現在のページURLからベースURLを構築する
 * パッケージ名＋バージョンを含む可変パスに対応
 * 例: https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit@3.1/manual/index.html
 *   → https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit@3.1/manual/
 */
function getBaseUrl() {
  return location.href.replace(/[^/]+$/, '');
}

/**
 * ul.nav 要素内の li を再帰的に走査してツリーを構築する
 * title 属性を優先して取得（<wbr> タグによるテキスト汚染を防ぐ）
 * @param {Element} ul
 * @param {string} baseUrl
 * @returns {Array<{text: string, url: string|null, children: Array}>}
 */
function walkItems(ul, baseUrl) {
  return Array.from(ul.querySelectorAll(':scope > li'))
    .map(li => {
      const a = li.querySelector(':scope > a');
      if (!a) return null;
      const href = a.getAttribute('href');
      const url = href ? (href.startsWith('http') ? href : baseUrl + href) : null;
      const text = a.getAttribute('title') || a.textContent.trim();
      const childUl = li.querySelector(':scope > ul.nav');
      const children = childUl ? walkItems(childUl, baseUrl) : [];
      return { text, url, children };
    })
    .filter(Boolean);
}

/**
 * サイドバーからナビゲーションツリーを収集する
 */
function collectNavTree() {
  const sidenav = getSidenav();
  if (!sidenav) return [];
  const baseUrl = getBaseUrl();
  return walkItems(sidenav, baseUrl);
}

/**
 * ツリーのノード数を再帰的にカウントする
 */
function countNodes(tree) {
  return tree.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
}

// Chrome Extension のメッセージハンドラ
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'expandAndCollect') {
    (async () => {
      try {
        const clickCount = await expandAllMenuItems();
        const tree = collectNavTree();
        sendResponse({ success: true, clickCount, tree, totalCount: countNodes(tree) });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
});
