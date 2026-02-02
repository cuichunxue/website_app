/**
 * 統計ナビゲーター - 管理画面 JavaScript
 */

let toolsData = [];
let editingToolId = null;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadTools();
});

// イベントリスナーの設定
function setupEventListeners() {
    // アイコン入力時のプレビュー更新
    const iconInput = document.getElementById('toolIcon');
    if (iconInput) {
        iconInput.addEventListener('input', updateIconPreview);
    }

    // カラー入力時のテキスト更新
    const colorInput = document.getElementById('toolColor');
    if (colorInput) {
        colorInput.addEventListener('input', function() {
            document.getElementById('toolColorText').value = this.value;
        });
    }

    // アクティブ状態のラベル更新
    const activeInput = document.getElementById('toolActive');
    if (activeInput) {
        activeInput.addEventListener('change', function() {
            document.getElementById('activeLabel').textContent =
                this.checked ? '有効' : '無効';
        });
    }

    // モーダル外クリックで閉じる
    const modalOverlay = document.getElementById('toolModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// 通知を表示
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = 'notification ' + type;

    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ツール一覧を読み込む
async function loadTools() {
    try {
        const response = await fetch('/api/tools');
        if (response.ok) {
            const data = await response.json();
            toolsData = data.tools;
            renderToolsTable();
        }
    } catch (error) {
        console.error('Error loading tools:', error);
        showNotification('ツールの読み込みに失敗しました', 'error');
    }
}

// ツールテーブルを更新
function renderToolsTable() {
    const tbody = document.getElementById('toolsTableBody');
    if (!tbody) return;

    // 順序でソート
    toolsData.sort((a, b) => (a.order || 999) - (b.order || 999));

    tbody.innerHTML = toolsData.map(tool => `
        <tr data-tool-id="${tool.id}">
            <td class="order-cell">
                <span class="order-badge">${tool.order || '-'}</span>
            </td>
            <td><code>${tool.id}</code></td>
            <td>
                <div class="tool-name-cell">
                    <span class="color-indicator" style="background-color: ${tool.color || '#6B7280'}"></span>
                    ${escapeHtml(tool.name)}
                </div>
            </td>
            <td><a href="${escapeHtml(tool.url)}" target="_blank" class="url-link">${escapeHtml(tool.url)}</a></td>
            <td><i class="fas fa-${escapeHtml(tool.icon || 'cube')}"></i> ${escapeHtml(tool.icon || 'cube')}</td>
            <td>
                ${tool.active !== false
                    ? '<span class="status-badge status-active">有効</span>'
                    : '<span class="status-badge status-inactive">無効</span>'
                }
            </td>
            <td class="click-count">${tool.clicks || 0}</td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-edit" onclick="showEditModal('${tool.id}')" title="編集">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-delete" onclick="deleteTool('${tool.id}')" title="削除">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// HTMLエスケープ
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ツール一覧を更新
function refreshToolList() {
    loadTools();
    showNotification('ツール一覧を更新しました', 'success');
}

// 新規追加モーダルを表示
function showAddModal() {
    editingToolId = null;
    document.getElementById('modalTitle').innerHTML =
        '<i class="fas fa-plus"></i> 新規ツール追加';

    // フォームをリセット
    document.getElementById('toolForm').reset();
    document.getElementById('editToolId').value = '';
    document.getElementById('toolId').disabled = false;
    document.getElementById('toolColor').value = '#6B7280';
    document.getElementById('toolColorText').value = '#6B7280';
    document.getElementById('toolActive').checked = true;
    document.getElementById('activeLabel').textContent = '有効';
    document.getElementById('toolOrder').value = toolsData.length + 1;
    updateIconPreview();

    // モーダルを表示
    document.getElementById('toolModal').classList.add('show');
}

// 編集モーダルを表示
function showEditModal(toolId) {
    const tool = toolsData.find(t => t.id === toolId);
    if (!tool) {
        showNotification('ツールが見つかりません', 'error');
        return;
    }

    editingToolId = toolId;
    document.getElementById('modalTitle').innerHTML =
        '<i class="fas fa-edit"></i> ツール編集';

    // フォームに値を設定
    document.getElementById('editToolId').value = toolId;
    document.getElementById('toolId').value = toolId;
    document.getElementById('toolId').disabled = true;
    document.getElementById('toolName').value = tool.name || '';
    document.getElementById('toolUrl').value = tool.url || '';
    document.getElementById('toolDescription').value = tool.description || '';
    document.getElementById('toolIcon').value = tool.icon || 'cube';
    document.getElementById('toolColor').value = tool.color || '#6B7280';
    document.getElementById('toolColorText').value = tool.color || '#6B7280';
    document.getElementById('toolOrder').value = tool.order || 1;
    document.getElementById('toolActive').checked = tool.active !== false;
    document.getElementById('activeLabel').textContent =
        tool.active !== false ? '有効' : '無効';
    updateIconPreview();

    // モーダルを表示
    document.getElementById('toolModal').classList.add('show');
}

// モーダルを閉じる
function closeModal() {
    document.getElementById('toolModal').classList.remove('show');
    editingToolId = null;
}

// アイコンプレビューを更新
function updateIconPreview() {
    const iconInput = document.getElementById('toolIcon');
    const preview = document.getElementById('iconPreview');
    if (iconInput && preview) {
        preview.className = 'fas fa-' + (iconInput.value || 'cube') + ' icon-preview';
    }
}

// アイコンを選択
function selectIcon(iconName) {
    const iconInput = document.getElementById('toolIcon');
    if (iconInput) {
        iconInput.value = iconName;
        updateIconPreview();
    }
}

// ツールを保存
async function saveTool() {
    const form = document.getElementById('toolForm');
    const formData = {
        name: document.getElementById('toolName').value.trim(),
        url: document.getElementById('toolUrl').value.trim(),
        description: document.getElementById('toolDescription').value.trim(),
        icon: document.getElementById('toolIcon').value.trim() || 'cube',
        color: document.getElementById('toolColor').value,
        order: parseInt(document.getElementById('toolOrder').value) || 1,
        active: document.getElementById('toolActive').checked
    };

    // バリデーション
    if (!formData.name) {
        showNotification('ツール名を入力してください', 'error');
        return;
    }
    if (!formData.url) {
        showNotification('URLを入力してください', 'error');
        return;
    }

    try {
        let response;

        if (editingToolId) {
            // 更新
            response = await fetch(`/api/tools/${editingToolId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
        } else {
            // 新規作成
            const toolId = document.getElementById('toolId').value.trim();
            if (toolId) {
                formData.id = toolId;
            }

            response = await fetch('/api/tools', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
        }

        const data = await response.json();

        if (response.ok) {
            showNotification(
                editingToolId ? 'ツールを更新しました' : 'ツールを追加しました',
                'success'
            );
            closeModal();
            loadTools();
        } else {
            showNotification(data.error || '保存に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error saving tool:', error);
        showNotification('保存中にエラーが発生しました', 'error');
    }
}

// ツールを削除
async function deleteTool(toolId) {
    const tool = toolsData.find(t => t.id === toolId);
    if (!tool) return;

    if (!confirm(`「${tool.name}」を削除しますか？\nこの操作は取り消せません。`)) {
        return;
    }

    try {
        const response = await fetch(`/api/tools/${toolId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('ツールを削除しました', 'success');
            loadTools();
        } else {
            const data = await response.json();
            showNotification(data.error || '削除に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error deleting tool:', error);
        showNotification('削除中にエラーが発生しました', 'error');
    }
}

// 全統計をリセット
async function resetAllStats() {
    if (!confirm('全てのクリック統計をリセットしますか？\nこの操作は取り消せません。')) {
        return;
    }

    try {
        const response = await fetch('/api/reset', {
            method: 'POST'
        });

        if (response.ok) {
            showNotification('統計をリセットしました', 'success');
            loadTools();
        } else {
            showNotification('リセットに失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error resetting stats:', error);
        showNotification('リセット中にエラーが発生しました', 'error');
    }
}
