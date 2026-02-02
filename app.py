from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

# クリック数データを保存するファイル
CLICK_DATA_FILE = './Sampling_website_Flask_javascript_other/click_data.json'

def load_click_data():
    """クリック数データを読み込む"""
    if os.path.exists(CLICK_DATA_FILE):
        try:
            with open(CLICK_DATA_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    # デフォルトデータ
    return {
        'cooccurrence': 0,
        'mt': 0,
        'sankey': 0,
        'fourth': 0,
        'experimental_design':0
    }

def save_click_data(data):
    """クリック数データを保存する"""
    try:
        with open(CLICK_DATA_FILE, 'w') as f:
            json.dump(data, f)
        return True
    except:
        return False

@app.route('/')
def index():
    """メインページを表示"""
    click_data = load_click_data()
    total_clicks = sum(click_data.values())
    return render_template('index.html',
                           click_data=click_data,
                           total_clicks=total_clicks)

@app.route('/api/click', methods=['POST'])
def record_click():
    """クリック数を記録するAPI"""
    try:
        data = request.get_json()
        tool_name = data.get('tool_name')

        if tool_name not in ['cooccurrence', 'mt', 'sankey', 'fourth','experimental_design']:
            return jsonify({'error': 'Invalid tool name'}), 400

        # クリック数データを読み込み、更新
        click_data = load_click_data()
        click_data[tool_name] += 1

        # データを保存
        if save_click_data(click_data):
            total_clicks = sum(click_data.values())
            return jsonify({
                'success': True,
                'click_count': click_data[tool_name],
                'total_clicks': total_clicks
            })
        else:
            return jsonify({'error': 'Failed to save data'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats')
def get_stats():
    """現在の統計を取得するAPI"""
    click_data = load_click_data()
    total_clicks = sum(click_data.values())
    return jsonify({
        'click_data': click_data,
        'total_clicks': total_clicks
    })

@app.route('/api/reset', methods=['POST'])
def reset_stats():
    """統計をリセットするAPI"""
    try:
        default_data = {
            'cooccurrence': 0,
            'mt': 0,
            'sankey': 0,
            'fourth': 0
        }

        if save_click_data(default_data):
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

    print("🚀 可視化ツール管理サイトを起動中...")
    print("📱 ブラウザで http://0.0.0.0/:8088 にアクセスしてください")
    print("⏹️ 停止するには Ctrl+C を押してください")

    app.run(debug=False, host='0.0.0.0', port=8088)