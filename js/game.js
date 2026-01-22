/**
 * 贪吃蛇大作战 - 游戏核心逻辑
 */

class SnakeGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 游戏配置
        this.gridSize = 20;          // 每个格子的像素大小
        this.cols = this.canvas.width / this.gridSize;
        this.rows = this.canvas.height / this.gridSize;

        // 游戏状态
        this.snake = [];             // 蛇身坐标数组
        this.food = null;            // 食物坐标
        this.direction = 'right';    // 当前方向
        this.nextDirection = 'right';// 下一帧方向
        this.score = 0;              // 当前分数
        this.isRunning = false;      // 游戏是否运行中
        this.isPaused = false;       // 游戏是否暂停
        this.gameLoop = null;        // 游戏循环定时器
        this.speed = 150;            // 游戏速度（毫秒）
        this.startTime = null;       // 游戏开始时间

        // 颜色配置
        this.colors = {
            background: '#0f172a',
            snakeHead: '#22d3ee',      // 青色
            snakeBody: '#06b6d4',
            snakeTail: '#0891b2',
            food: '#d946ef',           // 紫红色
            foodGlow: 'rgba(217, 70, 239, 0.5)',
            grid: 'rgba(255, 255, 255, 0.03)'
        };

        // 资源定义
        this.assets = {
            snakeHead: null,
            apple: null
        };

        // 定义 SVG 素材
        this.svgData = {
            // 卡通蛇头 SVG
            snakeHead: `
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" fill="#22d3ee" />
                    <!-- 眼睛 -->
                    <circle cx="35" cy="40" r="10" fill="white" />
                    <circle cx="65" cy="40" r="10" fill="white" />
                    <circle cx="35" cy="40" r="5" fill="black" />
                    <circle cx="65" cy="40" r="5" fill="black" />
                    <!-- 腮红 -->
                    <circle cx="25" cy="60" r="5" fill="rgba(255,100,100,0.5)" />
                    <circle cx="75" cy="60" r="5" fill="rgba(255,100,100,0.5)" />
                    <!-- 舌头 -->
                    <path d="M45 75 Q50 90 55 75" fill="none" stroke="#ef4444" stroke-width="4" stroke-linecap="round" />
                </svg>
            `,
            // 苹果食物 SVG
            apple: `
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <!-- 苹果主体 -->
                    <path d="M50 85 C30 85 15 70 15 45 C15 25 35 15 50 25 C65 15 85 25 85 45 C85 70 70 85 50 85" fill="#ef4444" />
                    <!-- 叶子 -->
                    <path d="M50 25 C50 10 65 5 70 15 C65 20 55 25 50 25" fill="#22c55e" />
                    <!-- 高光 -->
                    <circle cx="35" cy="35" r="8" fill="rgba(255,255,255,0.3)" />
                </svg>
            `
        };

        // 预加载资源
        this.loadAssets();

        // 回调函数
        this.onScoreChange = null;
        this.onGameOver = null;

        // 绑定键盘事件
        this.bindKeyEvents();
    }

    /**
     * 预加载 SVG 资源
     */
    loadAssets() {
        const loadSvgAsImage = (svgString) => {
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.src = url;
            return img;
        };

        this.assets.snakeHead = loadSvgAsImage(this.svgData.snakeHead);
        this.assets.apple = loadSvgAsImage(this.svgData.apple);
    }

    /**
     * 初始化游戏
     */
    init() {
        // 初始化蛇（从中间开始，长度为3）
        const startX = Math.floor(this.cols / 2);
        const startY = Math.floor(this.rows / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;

        // 生成食物
        this.spawnFood();

        // 绘制初始状态
        this.draw();

        // 触发分数更新
        if (this.onScoreChange) {
            this.onScoreChange(this.score);
        }
    }

    /**
     * 开始游戏
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now();

        this.gameLoop = setInterval(() => {
            this.update();
        }, this.speed);
    }

    /**
     * 暂停/继续游戏
     */
    togglePause() {
        if (!this.isRunning) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            clearInterval(this.gameLoop);
            this.drawPauseScreen();
        } else {
            this.gameLoop = setInterval(() => {
                this.update();
            }, this.speed);
        }
    }

    /**
     * 停止游戏
     */
    stop() {
        this.isRunning = false;
        clearInterval(this.gameLoop);
    }

    /**
     * 游戏更新（每帧）
     */
    update() {
        if (this.isPaused) return;

        // 更新方向
        this.direction = this.nextDirection;

        // 计算新的蛇头位置
        const head = { ...this.snake[0] };

        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // 碰撞检测 - 墙壁
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            this.gameOver();
            return;
        }

        // 碰撞检测 - 自身
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver();
                return;
            }
        }

        // 移动蛇
        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.spawnFood();

            // 触发分数更新
            if (this.onScoreChange) {
                this.onScoreChange(this.score);
            }

            // 每50分加速一点
            if (this.score % 50 === 0 && this.speed > 50) {
                this.speed -= 10;
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => {
                    this.update();
                }, this.speed);
            }
        } else {
            // 没吃到食物，移除尾巴
            this.snake.pop();
        }

        // 绘制
        this.draw();
    }

    /**
     * 生成食物
     */
    spawnFood() {
        let newFood;
        let isOnSnake;

        do {
            isOnSnake = false;
            newFood = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };

            // 检查是否在蛇身上
            for (const segment of this.snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    isOnSnake = true;
                    break;
                }
            }
        } while (isOnSnake);

        this.food = newFood;
    }

    /**
     * 绘制游戏画面
     */
    draw() {
        const ctx = this.ctx;

        // 清空画布
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格（可选）
        this.drawGrid();

        // 绘制食物（带发光效果）
        this.drawFood();

        // 绘制蛇
        this.drawSnake();
    }

    /**
     * 绘制网格
     */
    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;

        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    }

    /**
     * 绘制食物
     */
    drawFood() {
        const ctx = this.ctx;
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        const size = this.gridSize;

        // 发光效果
        ctx.shadowColor = this.colors.food;
        ctx.shadowBlur = 15;

        // 绘制苹果 SVG
        if (this.assets.apple) {
            ctx.drawImage(this.assets.apple, x, y, size, size);
        } else {
            // 降级方案：圆形
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2);
            ctx.fillStyle = this.colors.food;
            ctx.fill();
        }

        // 重置阴影
        ctx.shadowBlur = 0;
    }

    /**
     * 绘制蛇（带透明度渐变效果）
     */
    drawSnake() {
        const ctx = this.ctx;

        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            const size = this.gridSize - 2;
            const offset = 1;

            if (index === 0) {
                // 绘制蛇头 SVG
                this.drawSnakeHead(x, y);
            } else {
                // 计算透明度：越往后越透明（最低0.3）
                const alphaRatio = index / this.snake.length;
                const alpha = 1 - (alphaRatio * 0.7);

                ctx.shadowBlur = 0;
                // 身体渐变
                const colorRatio = index / this.snake.length;
                ctx.fillStyle = this.lerpColorWithAlpha(
                    this.colors.snakeHead,
                    this.colors.snakeTail,
                    colorRatio,
                    alpha
                );

                // 绘制圆角矩形身体
                this.roundRect(ctx, x + offset, y + offset, size, size, 4);
                ctx.fill();
            }
        });

        // 重置渲染上下文状态
        ctx.shadowBlur = 0;
    }

    /**
     * 绘制旋转的蛇头
     */
    drawSnakeHead(x, y) {
        const ctx = this.ctx;
        const centerX = x + this.gridSize / 2;
        const centerY = y + this.gridSize / 2;
        const size = this.gridSize;

        ctx.save();
        ctx.translate(centerX, centerY);

        // 根据方向旋转（SVG 默认为向右）
        let angle = 0;
        switch (this.direction) {
            case 'up': angle = -Math.PI / 2; break;
            case 'down': angle = Math.PI / 2; break;
            case 'left': angle = Math.PI; break;
            case 'right': angle = 0; break;
        }
        ctx.rotate(angle);

        // 蛇头阴影
        ctx.shadowColor = this.colors.snakeHead;
        ctx.shadowBlur = 10;

        if (this.assets.snakeHead) {
            ctx.drawImage(this.assets.snakeHead, -size / 2, -size / 2, size, size);
        } else {
            // 降级方案
            ctx.fillStyle = this.colors.snakeHead;
            this.roundRect(ctx, -size / 2 + 1, -size / 2 + 1, size - 2, size - 2, 4);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * 绘制圆角矩形
     */
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    /**
     * 颜色插值
     */
    lerpColor(color1, color2, ratio) {
        const hex = (c) => parseInt(c, 16);
        const r1 = hex(color1.slice(1, 3));
        const g1 = hex(color1.slice(3, 5));
        const b1 = hex(color1.slice(5, 7));
        const r2 = hex(color2.slice(1, 3));
        const g2 = hex(color2.slice(3, 5));
        const b2 = hex(color2.slice(5, 7));

        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);

        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * 颜色插值（带透明度）
     */
    lerpColorWithAlpha(color1, color2, ratio, alpha) {
        const hex = (c) => parseInt(c, 16);
        const r1 = hex(color1.slice(1, 3));
        const g1 = hex(color1.slice(3, 5));
        const b1 = hex(color1.slice(5, 7));
        const r2 = hex(color2.slice(1, 3));
        const g2 = hex(color2.slice(3, 5));
        const b2 = hex(color2.slice(5, 7));

        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);

        return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
    }

    /**
     * 绘制暂停画面
     */
    drawPauseScreen() {
        const ctx = this.ctx;

        // 半透明遮罩
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 暂停文字
        ctx.fillStyle = '#22d3ee';
        ctx.font = 'bold 36px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('暂停中', this.canvas.width / 2, this.canvas.height / 2);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px Outfit';
        ctx.fillText('按空格键继续', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    /**
     * 游戏结束
     */
    gameOver() {
        this.stop();

        // 计算游戏时长
        const duration = Math.floor((Date.now() - this.startTime) / 1000);

        // 保存游戏记录
        const username = Auth.getCurrentUsername();
        if (username) {
            Storage.addGameRecord({
                username: username,
                score: this.score,
                playedAt: new Date().toISOString(),
                duration: duration
            });
        }

        // 播放颤抖动画
        this.playShakeAnimation(() => {
            // 颤抖结束后触发游戏结束回调
            if (this.onGameOver) {
                this.onGameOver(this.score, duration);
            }
        });
    }

    /**
     * 播放画布颤抖动画
     */
    playShakeAnimation(callback) {
        const wrapper = this.canvas.parentElement;
        if (!wrapper) {
            callback && callback();
            return;
        }

        // 添加颤抖类
        wrapper.classList.add('shake');

        // 颤抖期间闪烁红色边框
        const originalBg = wrapper.style.background;
        wrapper.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';

        // 动画结束后移除效果
        setTimeout(() => {
            wrapper.classList.remove('shake');
            wrapper.style.background = originalBg;
            callback && callback();
        }, 500);
    }

    /**
     * 绑定键盘事件
     */
    bindKeyEvents() {
        document.addEventListener('keydown', (e) => {
            // 方向键控制
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.direction !== 'down') {
                        this.nextDirection = 'up';
                    }
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.direction !== 'up') {
                        this.nextDirection = 'down';
                    }
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.direction !== 'right') {
                        this.nextDirection = 'left';
                    }
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.direction !== 'left') {
                        this.nextDirection = 'right';
                    }
                    e.preventDefault();
                    break;
                case ' ':
                    // 空格键暂停/继续
                    if (this.isRunning) {
                        this.togglePause();
                    }
                    e.preventDefault();
                    break;
            }
        });
    }
}
