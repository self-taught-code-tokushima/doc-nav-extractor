// MS Minecraft Bedrock Edition (Microsoft Learn) Doc Nav Extractor
// content-ms-minecraft-be.js

function getSidenav() {
  return document.querySelector('#affixed-left-container > ul');
}

async function waitForSidenav(timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const nav = getSidenav();
    if (nav) return nav;
    await new Promise(r => setTimeout(r, 200));
  }
  return null;
}

async function expandAllMenuItems() {
  const sidenav = await waitForSidenav();
  if (!sidenav) throw new Error('ナビゲーションメニューが見つかりません');

  let totalClicked = 0;
  const MAX_PASSES = 10;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const collapsed = Array.from(
      sidenav.querySelectorAll('li[aria-expanded="false"] > span[data-bi-name="tree-expander"]')
    );
    if (collapsed.length === 0) break;
    collapsed.forEach(el => el.click());
    totalClicked += collapsed.length;
    // 非同期コンテンツのロードを待つ
    await new Promise(r => setTimeout(r, 500));
  }
  return totalClicked;
}

function walkItems(container) {
  return Array.from(container.querySelectorAll(':scope > li'))
    .map(li => {
      if (li.getAttribute('role') === 'none') {
        const a = li.querySelector('a');
        if (!a) return null;
        const href = a.getAttribute('href');
        const url = href ? (href.startsWith('http') ? href : 'https://learn.microsoft.com' + href) : null;
        return { text: a.textContent.trim(), url, children: [] };
      }
      const span = li.querySelector(':scope > span.tree-expander');
      if (!span) return null;
      const childUl = li.querySelector(':scope > ul');
      const children = childUl ? walkItems(childUl) : [];
      return { text: span.textContent.trim(), url: null, children };
    })
    .filter(Boolean);
}

function getBaseUrl() {
  return 'https://learn.microsoft.com';
}

function collectNavTree() {
  const sidenav = getSidenav();
  if (!sidenav) return [];
  return walkItems(sidenav);
}

function countNodes(tree) {
  return tree.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
}

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
