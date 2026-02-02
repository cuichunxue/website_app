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

// ツールを開く
async function openTool(toolId, url) {
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
        window.open(url, '_blank');

    } catch (error) {
        console.error('Error opening tool:', error);
        // エラーでもツールは開く
        window.open(url, '_blank');
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
