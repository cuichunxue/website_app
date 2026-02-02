// 初期化
function init() {
    updateTime();
    setInterval(updateTime, 1000);
    setupKeyboardShortcuts();
    setupCardClick();
}

// 時刻更新
function updateTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent =
        now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

// APIを使ってクリック数を記録
async function recordClick(toolName) {
    try {
        const response = await fetch('/api/click', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tool_name: toolName
            })
        });

        if (response.ok) {
            const data = await response.json();

            // クリック数表示を更新
            const countElement = document.getElementById(toolName + '-count');
            if (countElement) {
                countElement.textContent = data.click_count;
                // 更新時のアニメーション効果
                countElement.style.color = '#e53e3e';
                countElement.style.fontWeight = 'bold';
                setTimeout(() => {
                    countElement.style.color = '#2d3748';
                    countElement.style.fontWeight = '700';
                }, 500);
            }

            // 総クリック数を更新
            document.getElementById('totalClicks').textContent = data.total_clicks;

            return true;
        } else {
            console.error('Failed to record click:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('Error recording click:', error);
        return false;
    }
}

// ツールを開く
async function openTool(toolName, url, event) {
    // ボタンのフィードバック効果
    if (event && event.target) {
        const button = event.target;
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    // クリック数を記録
    const success = await recordClick(toolName);

    if (success) {
        // 成功メッセージを表示
        showSuccessMessage(`${getToolDisplayName(toolName)}を開きました`);
        // 指定URLに遷移
        window.open(url, '_blank');
    } else {
        // クリック数の記録に失敗した場合の処理
        showSuccessMessage(`クリック数の記録に失敗しました`);
    }
}

// ツール名の表示名を取得
function getToolDisplayName(toolName) {
    const names = {
        'cooccurrence': '共起ネットワーク分析',
        'mt': 'MT法品質分析',
        'sankey': 'Sankeyダイアグラム',
        'fourth': 'テキストマイニング',
        'experimental_design': '実験計画法' // 追加
    };
    return names[toolName] || toolName;
}

// 成功メッセージを表示
function showSuccessMessage(message) {
    // 既存のメッセージがあれば削除
    const existing = document.querySelector('.success-message');
    if (existing) {
        existing.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    // アニメーション
    setTimeout(() => {
        messageDiv.classList.add('show');
    }, 100);

    // 3秒後に削除
    setTimeout(() => {
        messageDiv.classList.remove('show');
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 3000);
}

// キーボードショートカット設定
async function setupKeyboardShortcuts() {
    document.addEventListener('keydown', async function(event) {
        // 入力フィールドでのキーボードショートカットを無効化
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        let toolName = '';
        let url = '';

        switch (event.key.toLowerCase()) {
            case '1':
                event.preventDefault();
                toolName = 'cooccurrence';
                url = 'http://0.0.0.0:8520/'; // 正しいURLに修正
                break;
            case '2':
                event.preventDefault();
                toolName = 'mt';
                url = 'http://0.0.0.0:5004/'; // 正しいURLに修正
                break;
            case '3':
                event.preventDefault();
                toolName = 'sankey';
                url = 'http://0.0.0.0:5006/'; // 正しいURLに修正
                break;
            case '4':
                event.preventDefault();
                toolName = 'fourth';
                url = 'http://0.0.0.0:8502/'; // 正しいURLに修正
                break;
            case '5': // 新しいショートカットを追加
                event.preventDefault();
                toolName = 'experimental_design';
                url = 'http://0.0.0.0:8505/'; // 実験計画法のURL
                break;
            case 'r':
                event.preventDefault();
                resetStats();
                return;
        }

        if (toolName && url) {
            // クリック数を記録
            const success = await recordClick(toolName);

            if (success) {
                showSuccessMessage(`キーボードショートカット: ${getToolDisplayName(toolName)}を開きました`);
            }

            // 指定URLに遷移
            window.open(url, '_blank');
        }
    });
}

// カードクリックでもツールを開く
function setupCardClick() {
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', function(event) {
            // ボタンがクリックされた場合は重複実行を防ぐ
            if (event.target.classList.contains('tool-button')) {
                return;
            }

            const button = card.querySelector('.tool-button');
            if (button) {
                button.click();
            }
        });
    });
}

// 統計をリセット
async function resetStats() {
    if (!confirm('クリック統計をリセットしますか？')) {
        return;
    }

    try {
        const response = await fetch('/api/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            // すべてのカウンターを0にリセット
            document.getElementById('cooccurrence-count').textContent = '0';
            document.getElementById('mt-count').textContent = '0';
            document.getElementById('sankey-count').textContent = '0';
            document.getElementById('fourth-count').textContent = '0';
            document.getElementById('experimental-design-count').textContent = '0'; // 追加
            document.getElementById('totalClicks').textContent = '0';

            showSuccessMessage('統計をリセットしました');
        } else {
            console.error('Failed to reset stats:', await response.text());
            alert('統計のリセットに失敗しました');
        }
    } catch (error) {
        console.error('Error resetting stats:', error);
        alert('統計のリセットに失敗しました');
    }
}

// 定期的に統計を更新（他のユーザーの操作を反映）
async function refreshStats() {
    try {
        const response = await fetch('/api/stats');
        if (response.ok) {
            const data = await response.json();

            // UI更新
            document.getElementById('cooccurrence-count').textContent = data.click_data.cooccurrence;
            document.getElementById('mt-count').textContent = data.click_data.mt;
            document.getElementById('sankey-count').textContent = data.click_data.sankey;
            document.getElementById('fourth-count').textContent = data.click_data.fourth;
            document.getElementById('experimental-design-count').textContent = data.click_data.experimental_design; // 追加
            document.getElementById('totalClicks').textContent = data.total_clicks;
        }
    } catch (error) {
        console.error('Error refreshing stats:', error);
    }
}

// 初期化実行
document.addEventListener('DOMContentLoaded', function() {
    init();

    // 30秒ごとに統計を更新
    setInterval(refreshStats, 30000);
});

// ページ読み込み完了後の処理
window.addEventListener('load', function() {
    console.log('🚀 可視化ツール管理サイトが読み込まれました');
    console.log('⌨️ キーボードショートカット: 1-5キー、Rキー（リセット）');
});