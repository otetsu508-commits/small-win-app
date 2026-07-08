// LocalStorage版 小さな勝利アプリ

class SmallWinApp {
    constructor() {
        this.storageKey = 'smallWinApp_data';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadWins();
        this.render();
        this.updateStats();
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

        // アップグレードボタン（デモ）
        if (document.getElementById('upgradeBtn')) {
            document.getElementById('upgradeBtn').addEventListener('click', () => {
                alert('有料版は近日公開予定です。今しばらくお待ちください。');
            });
        }

        // フィードバックフォーム
        if (document.getElementById('feedbackForm')) {
            document.getElementById('feedbackForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitFeedback();
            });
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
        const content = input.value.trim();

        if (!content) return;

        const wins = this.getData();
        const newWin = {
            id: Date.now(),
            content: content,
            createdAt: new Date().toISOString()
        };

        wins.unshift(newWin);
        this.saveData(wins);

        input.value = '';
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

        if (this.wins.length === 0) {
            listEl.innerHTML = '<p class="empty-message">まだ記録がありません。今日の小さな勝利から始めましょう！</p>';
            return;
        }

        listEl.innerHTML = this.wins.map(win => `
            <div class="win-item">
                <button class="win-delete" onclick="app.deleteWin(${win.id})">&times;</button>
                <div class="win-content">${this.escapeHtml(win.content)}</div>
                <div class="win-date">${this.formatDate(win.createdAt)}</div>
            </div>
        `).join('');
    }

    updateStats() {
        if (!this.wins) return;

        document.getElementById('totalCount').textContent = this.wins.length;
        document.getElementById('streakCount').textContent = this.calculateStreak(this.wins);
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
