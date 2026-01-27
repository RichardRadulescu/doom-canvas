import { player, TILE, map, weapon, WIDTH, zBuffer, enemy_data } from "./data.js";

const keys = {};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// 1. Helper to check collision with a small buffer
function isColliding(x, y) {
    // The player is not a single point, give them a small radius (e.g., 20% of tile)
    const offset = TILE * 0.2; 
    
    // Check all four corners of the player's "box"
    // This prevents clipping through corners
    const corners = [
        {x: x - offset, y: y - offset},
        {x: x + offset, y: y - offset},
        {x: x - offset, y: y + offset},
        {x: x + offset, y: y + offset}
    ];

    return corners.some(corner => {
        const mapX = Math.floor(corner.x / TILE);
        const mapY = Math.floor(corner.y / TILE);
        // Check bounds and wall existence
        return map[mapY] && map[mapY][mapX] === 1;
    });
}

export function handleInput() {
    // Rotation logic remains the same...
    if (keys["ArrowLeft"])  player.angle -= 0.05;
    if (keys["ArrowRight"]) player.angle += 0.05;
    if (player.angle < 0) player.angle += Math.PI * 2;
    if (player.angle > Math.PI * 2) player.angle -= Math.PI * 2;

    const cos = Math.cos(player.angle);
    const sin = Math.sin(player.angle);
    
    let moveX = 0;
    let moveY = 0;

    // Calculate intended movement vector
    if (keys["w"]) { moveX += cos; moveY += sin; }
    if (keys["s"]) { moveX -= cos; moveY -= sin; }
    if (keys["a"]) { moveX += sin; moveY -= cos; } // Strafe
    if (keys["d"]) { moveX -= sin; moveY += cos; } // Strafe

    // Normalize speed (prevents super-speed on diagonals)
    // and apply player speed
    if (moveX !== 0 || moveY !== 0) {
        moveX *= player.speed;
        moveY *= player.speed;
    }

    // 2. Apply movement with independent axis checks (Wall Sliding)
    
    // Try moving X
    if (!isColliding(player.x + moveX, player.y)) {
        player.x += moveX;
    }
    
    // Try moving Y
    if (!isColliding(player.x, player.y + moveY)) {
        player.y += moveY;
    }
}

export function handleShoot() {
    if (weapon.isFiring) return; // Prevent spamming every frame

    weapon.isFiring = true;
    weapon.timer = 0;

    // 1. Get the wall distance at the center of the screen
    const centerX = Math.floor(WIDTH / 2);
    const wallDist = zBuffer[centerX];

    // 2. Check each enemy
    enemy_data.forEach(enemy => {
        if (!enemy.alive) return;

        // Calculate angle to enemy
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        let angleToEnemy = Math.atan2(dy, dx) - player.angle;
        
        while (angleToEnemy < -Math.PI) angleToEnemy += 2 * Math.PI;
        while (angleToEnemy > Math.PI) angleToEnemy -= 2 * Math.PI;

        // 3. HIT DETECTION
        // Check if enemy is within a small angular threshold (the 'hitbox')
        // 0.1 radians is roughly the width of a standard crosshair
        const threshold = 0.15; 
        
        if (Math.abs(angleToEnemy) < threshold) {
            // Convert enemy distance to Tiles to match zBuffer
            const distToEnemy = Math.sqrt(dx*dx + dy*dy) / 64; // assuming TILE=64

            // Only hit if the enemy isn't behind a wall
            if (distToEnemy < wallDist) {
                enemy.alive = false;
            }
        }
    });
}

// Add the listener
document.addEventListener("keydown", (e) => {
    if (e.code === "Space") handleShoot();
});