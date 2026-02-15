/**
 * 統計ナビゲーター - メインページ JavaScript
 */

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    init();
});

function init() {
    updateTime();
    setInterval(updateTime, 1000);

    // 30秒ごとに統計を更新
    setInterval(refreshStats, 30000);

    // 検索機能の初期化
    initSearch();
}

// =============================================
// 検索機能
// =============================================
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');

    if (!searchInput) return;

    // 入力イベント
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        filterTools(query);

        // クリアボタンの表示/非表示
        if (searchClear) {
            searchClear.style.display = query ? 'flex' : 'none';
        }
    });

    // クリアボタン
    if (searchClear) {
        searchClear.addEventListener('click', function() {
            searchInput.value = '';
            filterTools('');
            this.style.display = 'none';
            searchInput.focus();
        });
    }

    // ESCキーでクリア
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            filterTools('');
            if (searchClear) searchClear.style.display = 'none';
        }
    });
}

function filterTools(query) {
    const toolCards = document.querySelectorAll('.tool-card');
    const resultCount = document.getElementById('searchResultCount');
    const toolsGrid = document.getElementById('toolsGrid');

    // 既存の「検索結果なし」メッセージを削除
    const existingNoResults = toolsGrid.querySelector('.no-results');
    if (existingNoResults) {
        existingNoResults.remove();
    }

    if (!query) {
        // 検索クエリが空の場合、全て表示
        toolCards.forEach(card => {
            card.style.display = '';
        });
        if (resultCount) {
            resultCount.textContent = '';
        }
        return;
    }

    const lowerQuery = query.toLowerCase();
    let visibleCount = 0;

    toolCards.forEach(card => {
        const name = (card.dataset.toolName || '').toLowerCase();
        const description = (card.dataset.toolDescription || '').toLowerCase();

        if (name.includes(lowerQuery) || description.includes(lowerQuery)) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // 結果カウントを表示
    if (resultCount) {
        resultCount.innerHTML = `<strong>${visibleCount}</strong> 件のツールが見つかりました`;
    }

    // 結果がない場合のメッセージ
    if (visibleCount === 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        noResultsDiv.innerHTML = `
            <i class="fas fa-search"></i>
            <p>「${escapeHtml(query)}」に一致するツールが見つかりませんでした</p>
        `;
        toolsGrid.appendChild(noResultsDiv);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 時刻更新
function updateTime() {
    const now = new Date();
    const element = document.getElementById('currentTime');
    if (element) {
        element.textContent = now.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// 通知を表示
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = 'notification ' + type;

    // 表示
    setTimeout(() => notification.classList.add('show'), 10);

    // 3秒後に非表示
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// URLを解決（相対パス → /local/ に変換）
function resolveToolUrl(url) {
    // 外部URL（http:// または https://）はそのまま
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // 既に /local/ で始まる場合はそのまま
    if (url.startsWith('/local/')) {
        return url;
    }
    // それ以外は相対パスとして /local/ を付与
    return '/local/' + url;
}

// ツールを開く
async function openTool(toolId, url) {
    // URLを解決
    const resolvedUrl = resolveToolUrl(url);

    try {
        // クリック数を記録
        const response = await fetch('/api/click', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tool_name: toolId })
        });

        if (response.ok) {
            const data = await response.json();

            // クリック数表示を更新
            const countElement = document.getElementById(toolId + '-count');
            if (countElement) {
                countElement.textContent = data.click_count;
            }

            // 総クリック数を更新
            const totalElement = document.getElementById('totalClicks');
            if (totalElement) {
                totalElement.textContent = data.total_clicks;
            }

            showNotification('ツールを開きます', 'success');
        }

        // ツールを新しいタブで開く
        window.open(resolvedUrl, '_blank');

    } catch (error) {
        console.error('Error opening tool:', error);
        // エラーでもツールは開く
        window.open(resolvedUrl, '_blank');
    }
}

// 統計を更新
async function refreshStats() {
    try {
        const response = await fetch('/api/stats');
        if (response.ok) {
            const data = await response.json();

            // 総クリック数を更新
            const totalElement = document.getElementById('totalClicks');
            if (totalElement) {
                totalElement.textContent = data.total_clicks;
            }

            // ツール数を更新
            const toolsElement = document.getElementById('activeTools');
            if (toolsElement) {
                toolsElement.textContent = data.active_tools;
            }

            // 各ツールのクリック数を更新
            for (const [toolId, count] of Object.entries(data.click_data)) {
                const countElement = document.getElementById(toolId + '-count');
                if (countElement) {
                    countElement.textContent = count;
                }
            }
        }
    } catch (error) {
        console.error('Error refreshing stats:', error);
    }
}
