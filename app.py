from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
import json
import os
from datetime import datetime
import uuid
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)  # セッション用の秘密鍵

# データファイルパス
DATA_DIR = './data'
TOOLS_FILE = os.path.join(DATA_DIR, 'tools.json')
CLICK_DATA_FILE = os.path.join(DATA_DIR, 'click_data.json')
CONFIG_FILE = os.path.join(DATA_DIR, 'config.json')

# データディレクトリを作成
os.makedirs(DATA_DIR, exist_ok=True)

# =====================
# 設定管理
# =====================
def load_config():
    """設定を読み込む"""
    default_config = {
        'admin_password': 'admin123',  # デフォルトパスワード
        'session_timeout': 3600  # 1時間
    }
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                # デフォルト値をマージ
                for key, value in default_config.items():
                    if key not in config:
                        config[key] = value
                return config
        except:
            pass
    # デフォルト設定を保存
    save_config(default_config)
    return default_config

def save_config(config):
    """設定を保存"""
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        return True
    except:
        return False

# =====================
# 認証デコレータ
# =====================
def login_required(f):
    """管理画面へのアクセスを制限するデコレータ"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_default_tools():
    """デフォルトのツールデータ"""
    return [
        {
            "id": "cooccurrence",
            "name": "DataView",
            "description": "テーブルから簡単に視覚的にデータの傾向やトレンドのつかみに活用できます。複雑なデータセットを直感的に理解できるグラフやチャートに変換します。",
            "url": "http://0.0.0.0:8520/",
            "icon": "chart-bar",
            "color": "#3B82F6",
            "active": True,
            "order": 1
        },
        {
            "id": "mt",
            "name": "MT法",
            "description": "マハラノビス・タグチ法を用いた品質工学分析。多変量データの異常検知や品質予測、プロセス最適化に活用できます。",
            "url": "http://0.0.0.0:5004/",
            "icon": "calculator",
            "color": "#10B981",
            "active": True,
            "order": 2
        },
        {
            "id": "sankey",
            "name": "Sankeyダイアグラム",
            "description": "フローやプロセスの流れを視覚的に表現。エネルギー流れ、資金の流れ、プロセス分析などに適用できます。",
            "url": "http://0.0.0.0:5006/",
            "icon": "share-alt",
            "color": "#8B5CF6",
            "active": True,
            "order": 3
        },
        {
            "id": "fourth",
            "name": "共起ネットワーク分析",
            "description": "テキストデータから単語間の共起関係を抽出し、ネットワーク図として可視化します。言語パターンの発見や概念間の関係性分析に最適です。",
            "url": "http://0.0.0.0:8502/",
            "icon": "project-diagram",
            "color": "#F59E0B",
            "active": True,
            "order": 4
        },
        {
            "id": "experimental_design",
            "name": "実験計画法",
            "description": "効率的な実験設計と分析。因子の主効果、交互作用を解析し、最適な条件を見つけ出します。",
            "url": "http://0.0.0.0:8505/",
            "icon": "flask",
            "color": "#EF4444",
            "active": True,
            "order": 5
        }
    ]

def load_tools():
    """ツールデータを読み込む"""
    if os.path.exists(TOOLS_FILE):
        try:
            with open(TOOLS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    # デフォルトのツールデータを保存して返す
    tools = get_default_tools()
    save_tools(tools)
    return tools

def save_tools(tools):
    """ツールデータを保存"""
    try:
        with open(TOOLS_FILE, 'w', encoding='utf-8') as f:
            json.dump(tools, f, ensure_ascii=False, indent=2)
        return True
    except:
        return False

def load_click_data():
    """クリック数データを読み込む"""
    if os.path.exists(CLICK_DATA_FILE):
        try:
            with open(CLICK_DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {}

def save_click_data(data):
    """クリック数データを保存する"""
    try:
        with open(CLICK_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except:
        return False

# =====================
# メインページ
# =====================
@app.route('/')
def index():
    """メインページを表示"""
    tools = load_tools()
    click_data = load_click_data()

    # アクティブなツールのみフィルタリング
    active_tools = [t for t in tools if t.get('active', True)]
    active_tools.sort(key=lambda x: x.get('order', 999))

    total_clicks = sum(click_data.values())

    return render_template('index.html',
                           tools=active_tools,
                           click_data=click_data,
                           total_clicks=total_clicks)

# =====================
# 認証関連
# =====================
@app.route('/login', methods=['GET', 'POST'])
def login():
    """ログインページ"""
    if request.method == 'POST':
        password = request.form.get('password', '')
        config = load_config()

        if password == config['admin_password']:
            session['admin_logged_in'] = True
            return redirect(url_for('admin'))
        else:
            return render_template('login.html', error='パスワードが正しくありません')

    return render_template('login.html')

@app.route('/logout')
def logout():
    """ログアウト"""
    session.pop('admin_logged_in', None)
    return redirect(url_for('index'))

# =====================
# 管理画面
# =====================
@app.route('/admin')
@login_required
def admin():
    """管理画面を表示"""
    tools = load_tools()
    click_data = load_click_data()
    return render_template('admin.html', tools=tools, click_data=click_data)

@app.route('/admin/settings', methods=['POST'])
@login_required
def update_settings():
    """設定を更新"""
    try:
        data = request.get_json()
        config = load_config()

        if 'new_password' in data and data['new_password']:
            config['admin_password'] = data['new_password']

        if save_config(config):
            return jsonify({'success': True})
        else:
            return jsonify({'error': '設定の保存に失敗しました'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =====================
# ツール管理 API
# =====================
@app.route('/api/tools', methods=['GET'])
def get_tools():
    """全ツールを取得"""
    tools = load_tools()
    click_data = load_click_data()

    # クリック数をツールデータに追加
    for tool in tools:
        tool['clicks'] = click_data.get(tool['id'], 0)

    return jsonify({'success': True, 'tools': tools})

@app.route('/api/tools', methods=['POST'])
def create_tool():
    """新しいツールを登録"""
    try:
        data = request.get_json()

        # 必須フィールドのチェック
        required_fields = ['name', 'url']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field}は必須です'}), 400

        tools = load_tools()

        # IDを生成（指定がなければ自動生成）
        tool_id = data.get('id') or str(uuid.uuid4())[:8]

        # IDの重複チェック
        if any(t['id'] == tool_id for t in tools):
            return jsonify({'error': 'このIDは既に使用されています'}), 400

        # 新しいツールを作成
        new_tool = {
            'id': tool_id,
            'name': data['name'],
            'description': data.get('description', ''),
            'url': data['url'],
            'icon': data.get('icon', 'cube'),
            'color': data.get('color', '#6B7280'),
            'active': data.get('active', True),
            'order': data.get('order', len(tools) + 1),
            'created_at': datetime.now().isoformat()
        }

        tools.append(new_tool)

        if save_tools(tools):
            return jsonify({'success': True, 'tool': new_tool})
        else:
            return jsonify({'error': 'データの保存に失敗しました'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tools/<tool_id>', methods=['PUT'])
def update_tool(tool_id):
    """ツールを更新"""
    try:
        data = request.get_json()
        tools = load_tools()

        # ツールを検索
        tool_index = next((i for i, t in enumerate(tools) if t['id'] == tool_id), None)

        if tool_index is None:
            return jsonify({'error': 'ツールが見つかりません'}), 404

        # 更新可能なフィールド
        updatable_fields = ['name', 'description', 'url', 'icon', 'color', 'active', 'order']

        for field in updatable_fields:
            if field in data:
                tools[tool_index][field] = data[field]

        tools[tool_index]['updated_at'] = datetime.now().isoformat()

        if save_tools(tools):
            return jsonify({'success': True, 'tool': tools[tool_index]})
        else:
            return jsonify({'error': 'データの保存に失敗しました'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tools/<tool_id>', methods=['DELETE'])
def delete_tool(tool_id):
    """ツールを削除"""
    try:
        tools = load_tools()

        # ツールを検索
        tool_index = next((i for i, t in enumerate(tools) if t['id'] == tool_id), None)

        if tool_index is None:
            return jsonify({'error': 'ツールが見つかりません'}), 404

        deleted_tool = tools.pop(tool_index)

        # クリックデータも削除
        click_data = load_click_data()
        if tool_id in click_data:
            del click_data[tool_id]
            save_click_data(click_data)

        if save_tools(tools):
            return jsonify({'success': True, 'deleted': deleted_tool})
        else:
            return jsonify({'error': 'データの保存に失敗しました'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tools/reorder', methods=['POST'])
def reorder_tools():
    """ツールの順序を変更"""
    try:
        data = request.get_json()
        order_list = data.get('order', [])

        tools = load_tools()

        for i, tool_id in enumerate(order_list):
            tool_index = next((j for j, t in enumerate(tools) if t['id'] == tool_id), None)
            if tool_index is not None:
                tools[tool_index]['order'] = i + 1

        if save_tools(tools):
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'データの保存に失敗しました'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =====================
# クリック統計 API
# =====================
@app.route('/api/click', methods=['POST'])
def record_click():
    """クリック数を記録するAPI"""
    try:
        data = request.get_json()
        tool_id = data.get('tool_name') or data.get('tool_id')

        if not tool_id:
            return jsonify({'error': 'tool_id is required'}), 400

        # ツールの存在確認
        tools = load_tools()
        if not any(t['id'] == tool_id for t in tools):
            return jsonify({'error': 'Invalid tool id'}), 400

        # クリック数データを読み込み、更新
        click_data = load_click_data()
        click_data[tool_id] = click_data.get(tool_id, 0) + 1

        # データを保存
        if save_click_data(click_data):
            total_clicks = sum(click_data.values())
            return jsonify({
                'success': True,
                'click_count': click_data[tool_id],
                'total_clicks': total_clicks
            })
        else:
            return jsonify({'error': 'Failed to save data'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats')
def get_stats():
    """現在の統計を取得するAPI"""
    tools = load_tools()
    click_data = load_click_data()
    total_clicks = sum(click_data.values())
    active_count = sum(1 for t in tools if t.get('active', True))

    return jsonify({
        'click_data': click_data,
        'total_clicks': total_clicks,
        'active_tools': active_count,
        'total_tools': len(tools)
    })

@app.route('/api/reset', methods=['POST'])
def reset_stats():
    """統計をリセットするAPI"""
    try:
        if save_click_data({}):
            return jsonify({'success': True, 'message': 'Stats reset successfully'})
        else:
            return jsonify({'error': 'Failed to reset stats'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # 必要なディレクトリを作成
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)

    print("=" * 50)
    print("  統計ナビゲーター - ツール管理システム")
    print("=" * 50)
    print(f"  メインページ: http://0.0.0.0:8088")
    print(f"  管理画面:     http://0.0.0.0:8088/admin")
    print("=" * 50)
    print("  停止するには Ctrl+C を押してください")
    print("=" * 50)

    app.run(debug=False, host='0.0.0.0', port=8088)
