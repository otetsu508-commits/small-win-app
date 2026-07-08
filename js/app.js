// LocalStorage版 小さな勝利アプリ

class SmallWinApp {
    constructor() {
        this.storageKey = 'smallWinApp_data';
        this.premiumKey = 'smallWinApp_premium';
        this.password = 'smallwin2026'; // 有料版パスワード
        this.isPremium = this.checkPremium();
        this.currentFilter = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadWins();
        this.updateUI();
        this.render();
        this.updateStats();
    }

    checkPremium() {
        return localStorage.getItem(this.premiumKey) === 'true';
    }

    activatePremium() {
        localStorage.setItem(this.premiumKey, 'true');
        this.isPremium = true;
        this.updateUI();
    }

    updateUI() {
        if (this.isPremium) {
            document.getElementById('planLabel').textContent = '有料版';
            document.getElementById('upgradeBtn').style.display = 'none';
            document.getElementById('categorySection').style.display = 'block';
            document.getElementById('memoSection').style.display = 'block';
            document.getElementById('categoryFilter').style.display = 'flex';
            document.getElementById('extendedStats').style.display = 'block';
        } else {
            document.getElementById('planLabel').textContent = '無料版';
            document.getElementById('upgradeBtn').style.display = 'block';
            document.getElementById('categorySection').style.display = 'none';
            document.getElementById('memoSection').style.display = 'none';
            document.getElementById('categoryFilter').style.display = 'none';
            document.getElementById('extendedStats').style.display = 'none';
        }
    }

    bindEvents() {
        // フォーム送信
        if (document.getElementById('winForm')) {
            document.getElementById('winForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.addWin();
            });

            document.getElementById('winInput').addEventListener('input', (e) => {
                document.getElementById('charCount').textContent = e.target.value.length;
            });
        }

        // アップグレードボタン
        if (document.getElementById('upgradeBtn')) {
            document.getElementById('upgradeBtn').addEventListener('click', () => {
                document.getElementById('passwordModal').style.display = 'flex';
            });
        }

        // パスワードモーダルを閉じる
        if (document.getElementById('passwordModalClose')) {
            document.getElementById('passwordModalClose').addEventListener('click', () => {
                document.getElementById('passwordModal').style.display = 'none';
            });
        }

        // パスワード送信
        if (document.getElementById('passwordSubmit')) {
            document.getElementById('passwordSubmit').addEventListener('click', () => {
                this.verifyPassword();
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

    verifyPassword() {
        const input = document.getElementById('passwordInput');
        const errorEl = document.getElementById('passwordError');

        if (input.value === this.password) {
            this.activatePremium();
            document.getElementById('passwordModal').style.display = 'none';
            input.value = '';
            errorEl.textContent = '';
            alert('有料版に切り替わりました！すべての機能が解放されました。');
        } else {
            errorEl.textContent = 'パスワードが正しくありません';
        }
    }

    getData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    addWin() {
        const input = document.getElementById('winInput');
        const categoryInput = document.getElementById('categorySelect');
        const memoInput = document.getElementById('memoInput');
        const content = input.value.trim();

        if (!content) return;

        const wins = this.getData();
        const newWin = {
            id: Date.now(),
            content: content,
            category: this.isPremium ? categoryInput.value : '',
            memo: this.isPremium ? memoInput.value : '',
            createdAt: new Date().toISOString()
        };

        wins.unshift(newWin);
        this.saveData(wins);

        input.value = '';
        if (categoryInput) categoryInput.value = '';
        if (memoInput) memoInput.value = '';
        document.getElementById('charCount').textContent = '0';

        this.loadWins();
        this.render();
        this.updateStats();
    }

    deleteWin(id) {
        let wins = this.getData();
        wins = wins.filter(win => win.id !== id);
        this.saveData(wins);

        this.loadWins();
        this.render();
        this.updateStats();
    }

    loadWins() {
        this.wins = this.getData();
    }

    render() {
        const listEl = document.getElementById('winList');
        if (!listEl) return;

        let displayWins = this.wins;

        // 無料版は7日分のみ表示
        if (!this.isPremium) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            displayWins = displayWins.filter(win => new Date(win.createdAt) >= sevenDaysAgo);
        }

        // カテゴリフィルター
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
                ${win.memo ? `<div class="win-memo">${this.escapeHtml(win.memo)}</div>` : ''}
                <div class="win-date">${this.formatDate(win.createdAt)}</div>
            </div>
        `).join('');
    }

    updateStats() {
        if (!this.wins) return;

        // 無料版は7日分のみ
        let statsWins = this.wins;
        if (!this.isPremium) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            statsWins = statsWins.filter(win => new Date(win.createdAt) >= sevenDaysAgo);
        }

        document.getElementById('totalCount').textContent = statsWins.length;
        document.getElementById('streakCount').textContent = this.calculateStreak(statsWins);

        // 有料版統計
        if (this.isPremium) {
            const now = new Date();
            const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            const lastWeekStart = new Date(thisWeekStart);
            lastWeekStart.setDate(lastWeekStart.getDate() - 7);
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            const thisWeekWins = this.wins.filter(win => new Date(win.createdAt) >= thisWeekStart);
            const lastWeekWins = this.wins.filter(win => {
                const d = new Date(win.createdAt);
                return d >= lastWeekStart && d < thisWeekStart;
            });
            const thisMonthWins = this.wins.filter(win => new Date(win.createdAt) >= thisMonthStart);
            const lastMonthWins = this.wins.filter(win => {
                const d = new Date(win.createdAt);
                return d >= lastMonthStart && d <= lastMonthEnd;
            });

            document.getElementById('weeklyCount').textContent = thisWeekWins.length;
            document.getElementById('lastWeekCount').textContent = lastWeekWins.length;
            document.getElementById('monthlyCount').textContent = thisMonthWins.length;
            document.getElementById('lastMonthCount').textContent = lastMonthWins.length;

            // カテゴリ別統計
            const categories = { work: 0, health: 0, learning: 0, hobby: 0 };
            this.wins.forEach(win => {
                if (win.category && categories[win.category] !== undefined) {
                    categories[win.category]++;
                }
            });
            document.getElementById('catWork').textContent = categories.work;
            document.getElementById('catHealth').textContent = categories.health;
            document.getElementById('catLearning').textContent = categories.learning;
            document.getElementById('catHobby').textContent = categories.hobby;
        }
    }

    calculateStreak(wins) {
        if (!wins || wins.length === 0) return 0;

        const dates = wins.map(win => {
            const date = new Date(win.createdAt);
            return date.toISOString().split('T')[0];
        });

        const uniqueDates = [...new Set(dates)].sort().reverse();

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
            return 0;
        }

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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    submitFeedback() {
        const successEl = document.getElementById('feedbackSuccess');
        document.getElementById('feedbackForm').reset();
        successEl.textContent = '送信しました！ご意見ありがとうございます。';
        setTimeout(() => {
            successEl.textContent = '';
        }, 3000);
    }
}

const app = new SmallWinApp();
