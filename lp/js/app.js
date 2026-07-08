// ローディングとアニメーション
document.addEventListener('DOMContentLoaded', function() {
    const loading = document.getElementById('loading');
    const titleLines = document.querySelectorAll('.title-line');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroCta = document.querySelector('.hero .cta-button');
    const pencilPath = document.querySelector('.pencil-path');

    // ローディング完了後に非表示
    setTimeout(function() {
        loading.classList.add('loaded');
    }, 2000);

    // タイトルアニメーション開始（ローディング完了後）
    setTimeout(function() {
        titleLines.forEach(function(line) {
            line.classList.add('pencil-animate');
        });
        if (pencilPath) {
            pencilPath.classList.add('animate');
        }
        heroSubtitle.classList.add('fade-in');
        heroCta.classList.add('fade-in');
    }, 2200);

    // スクロールアニメーション
    const scrollElements = document.querySelectorAll('.scroll-animate');

    function checkScroll() {
        const triggerBottom = window.innerHeight * 0.85;

        scrollElements.forEach(function(element) {
            const elementTop = element.getBoundingClientRect().top;

            if (elementTop < triggerBottom) {
                element.classList.add('animate-in');
            }
        });
    }

    // 初期チェック
    setTimeout(checkScroll, 2500);

    // スクロール時にチェック
    window.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '#start') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = 64;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});
