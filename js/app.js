// アプリの状態管理
class SmallWinApp {
    constructor() {
        this.currentUser = null;
        this.currentFilter = '';
        this.init();
    }

    // 初期化
    async init() {
        // セッションチェック
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            this.checkAuth();
            this.bindAppEvents();
            await this.loadWins();
            this.render();
        } else {
            this.checkAuth();
            this.bindAuthEvents();
        }

        // 認証状態変化のリスナー
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                this.currentUser = session.user;
                this.checkAuth();
                this.bindAppEvents();
                this.loadWins().then(() => {
                    this.render();
                });
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.checkAuth();
            }
        });
    }

    // 認証状態チェック
    checkAuth() {
        const authScreen = document.getElementById('authScreen');
        const appScreen = document.getElementById('appScreen');

        if (this.currentUser) {
            authScreen.style.display = 'none';
            appScreen.style.display = 'block';
            const userName = this.currentUser.user_metadata?.name || this.currentUser.email?.split('@')[0] || 'ユーザー';
            document.getElementById('userName').textContent = userName;
        } else {
            authScreen.style.display = 'flex';
            appScreen.style.display = 'none';
        }
    }

    // 認証イベントの绑定
    bindAuthEvents() {
        // タブ切り替え
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');

                const tabName = e.target.dataset.tab;
                document.getElementById('loginForm').style.display = tabName === 'login' ? 'block' : 'none';
                document.getElementById('registerForm').style.display = tabName === 'register' ? 'block' : 'none';
            });
        });

        // ログイン
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.login();
        });

        // 登録
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.register();
        });
    }

    // ログイン
    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('loginError');

        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            errorEl.textContent = '';
        } catch (error) {
            errorEl.textContent = 'メールアドレスまたはパスワードが正しくありません';
        }
    }

    // 登録
    async register() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const errorEl = document.getElementById('registerError');

        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: name
                    }
                }
            });

            if (error) throw error;

            errorEl.textContent = '';
        } catch (error) {
            if (error.message?.includes('already registered')) {
                errorEl.textContent = 'このメールアドレスは既に登録されています';
            } else {
                errorEl.textContent = '登録に失敗しました：' + error.message;
            }
        }
    }

    // ログアウト
    async logout() {
        await window.supabaseClient.auth.signOut();
        this.currentUser = null;
    }

    // UI更新
    updateUI() {
        // 今は無料版固定
        document.getElementById('planLabel').textContent = '無料版';
        document.getElementById('upgradeBtn').style.display = 'block';
        document.getElementById('categorySection').style.display = 'none';
        document.getElementById('memoSection').style.display = 'none';
        document.getElementById('categoryFilter').style.display = 'none';
        document.getElementById('extendedStats').style.display = 'none';
    }

    // アプリイベントの绑定
    bindAppEvents() {
        // フォーム送信
        if (document.getElementById('winForm')) {
            document.getElementById('winForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.addWin();
            });

            // 文字数カウント
            document.getElementById('winInput').addEventListener('input', (e) => {
                document.getElementById('charCount').textContent = e.target.value.length;
            });
        }

        // ログアウト
        if (document.getElementById('logoutBtn')) {
            document.getElementById('logoutBtn').addEventListener('click', async () => {
                await this.logout();
            });
        }

        // アップグレードボタン（デモ）
        if (document.getElementById('upgradeBtn')) {
            document.getElementById('upgradeBtn').addEventListener('click', () => {
                alert('有料版は近日公開予定です。今しばらくお待ちください。');
            });
        }

        // カテゴリフィルター
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.category;
                this.render();
            });
        });

        // フィードバックフォーム
        if (document.getElementById('feedbackForm')) {
            document.getElementById('feedbackForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitFeedback();
            });
        }
    }

    // 小さな勝利を追加
    async addWin() {
        const input = document.getElementById('winInput');
        const content = input.value.trim();

        if (!content) return;

        const win = {
            user_id: this.currentUser.id,
            content: content,
            created_at: new Date().toISOString()
        };

        try {
            const { data, error } = await window.supabaseClient
                .from('wins')
                .insert([win])
                .select();

            if (error) throw error;

            // フォームをリセット
            input.value = '';
            document.getElementById('charCount').textContent = '0';

            // 再読み込み
            await this.loadWins();
            this.render();
            this.updateStats();
        } catch (error) {
            alert('記録の保存に失敗しました');
        }
    }

    // 小さな勝利を削除
    async deleteWin(id) {
        try {
            const { error } = await window.supabaseClient
                .from('wins')
                .delete()
                .eq('id', id)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            await this.loadWins();
            this.render();
            this.updateStats();
        } catch (error) {
            alert('削除に失敗しました');
        }
    }

    // 記録を読み込み
    async loadWins() {
        try {
            const { data, error } = await window.supabaseClient
                .from('wins')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.wins = data || [];
        } catch (error) {
            console.error('データ読み込みエラー:', error);
            this.wins = [];
        }
    }

    // 一覧を描画
    render() {
        const listEl = document.getElementById('winList');
        if (!listEl) return;

        let displayWins = this.wins;

        // 無料版は7日分のみ表示
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        displayWins = displayWins.filter(win => new Date(win.created_at) >= sevenDaysAgo);

        // カテゴリフィルター（まだ実装してないのでスキップ）
        if (this.currentFilter) {
            displayWins = displayWins.filter(win => win.category === this.currentFilter);
        }

        if (displayWins.length === 0) {
            listEl.innerHTML = '<p class="empty-message">まだ記録がありません。今日の小さな勝利から始めましょう！</p>';
            return;
        }

        listEl.innerHTML = displayWins.map(win => `
            <div class="win-item">
                <button class="win-delete" onclick="app.deleteWin(${win.id})">&times;</button>
                <div class="win-content">${this.escapeHtml(win.content)}</div>
                <div class="win-date">${this.formatDate(win.created_at)}</div>
            </div>
        `).join('');
    }

    // 統計を更新
    updateStats() {
        if (!this.wins) return;

        // 無料版は7日分のみ
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const userWins = this.wins.filter(win => new Date(win.created_at) >= sevenDaysAgo);

        document.getElementById('totalCount').textContent = userWins.length;
        document.getElementById('streakCount').textContent = this.calculateStreak(userWins);
    }

    // 連続記録日数を計算
    calculateStreak(userWins) {
        if (!userWins || userWins.length === 0) return 0;

        // 日付ごとにグループ化
        const dates = userWins.map(win => {
            const date = new Date(win.created_at);
            return date.toISOString().split('T')[0];
        });

        // 重複を排除してソート
        const uniqueDates = [...new Set(dates)].sort().reverse();

        // 今日の日付
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // 最新の記録が昨日以前の場合は0
        if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
            return 0;
        }

        // 連続日数を計算
        let streak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
            const current = new Date(uniqueDates[i]);
            const next = new Date(uniqueDates[i + 1]);
            const diffDays = (current - next) / 86400000;

            if (diffDays === 1) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    // 日付フォーマット
    formatDate(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / 86400000);

        if (diffDays === 0) {
            return '今日';
        } else if (diffDays === 1) {
            return '昨日';
        } else {
            return `${date.getMonth() + 1}月${date.getDate()}日`;
        }
    }

    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // フィードバック送信（デモ）
    submitFeedback() {
        const successEl = document.getElementById('feedbackSuccess');

        // フォームをリセット
        document.getElementById('feedbackForm').reset();

        // 成功メッセージ
        successEl.textContent = '送信しました！ご意見ありがとうございます。';
        setTimeout(() => {
            successEl.textContent = '';
        }, 3000);
    }
}

// アプリを起動
const app = new SmallWinApp();
