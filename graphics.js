import { FOV, HEIGHT, player, WIDTH, TILE, map, ctx, wallTexture, enemy_data, zBuffer, weapon } from "./data.js";



export function drawScene() {
    // 1. Draw Floor and Ceiling (Gradient method - Fast)
    // Ceiling
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, WIDTH, HEIGHT / 2);

    // Floor - Gradient gives depth without heavy math
    const gradient = ctx.createLinearGradient(0, HEIGHT / 2, 0, HEIGHT); 
    gradient.addColorStop(0, "#111"); // Horizon (dark)
    gradient.addColorStop(1, "#554433"); // Feet (lighter/brown)
    ctx.fillStyle = gradient;
    ctx.fillRect(0, HEIGHT / 2, WIDTH, HEIGHT / 2);

    // 2. Cast Rays
    castRays();
    drawSprites();
    drawUI();
}

export function drawUI() {
    if (!weapon.sheet.complete) return;

    // 1. Calculate the width of a single frame
    const frameWidth = weapon.sheet.width / weapon.totalFrames;
    const frameHeight = weapon.sheet.height;

    // 2. Determine which frame to show (Source X)
    // If firing, move the "window" to the second frame
    const sourceX = weapon.isFiring ? frameWidth : 0;

    // 3. Set visual scale
    const scale = 2.5;
    const displayWidth = frameWidth * scale;
    const displayHeight = frameHeight * scale;

    let kick = 0;
    if (weapon.isFiring) {
        // Moves the gun up by 20px and then back down as the timer progresses
        kick = (6 - weapon.timer) * 3;
    }

    const dy = HEIGHT - displayHeight + kick;

    ctx.drawImage(
        weapon.sheet,
        sourceX, 0, frameWidth, frameHeight,
        (WIDTH / 2) - (displayWidth / 2) + 200, dy, displayWidth, displayHeight
    );

    // Animation timer logic
    if (weapon.isFiring) {
        weapon.timer++;
        if (weapon.timer > 6) {
            weapon.isFiring = false;
            weapon.timer = 0;
        }
    }

    
}

export function drawSprites() {
    enemy_data.forEach(sprite => {
        if (!sprite.alive) return;

        // 1. Calculate relative position
        const dx = sprite.x - player.x;
        const dy = sprite.y - player.y;

        // 2. Calculate distance in TILE units
        const distPixels = Math.sqrt(dx * dx + dy * dy);
        const distTiles = distPixels / TILE; // <--- CRITICAL SYNC

        // 3. Calculate angle
        let spriteAngle = Math.atan2(dy, dx) - player.angle;
        while (spriteAngle < -Math.PI) spriteAngle += 2 * Math.PI;
        while (spriteAngle > Math.PI) spriteAngle -= 2 * Math.PI;

        // 4. Perpendicular distance (to match wall correctedDist)
        const screenDist = distTiles * Math.cos(spriteAngle);

        if (screenDist > 0.1) {
            const projPlaneDist = (WIDTH / 2) / Math.tan(FOV / 2);
            const spriteSize = projPlaneDist / screenDist; // Matches wallHeight formula

            const screenX = (spriteAngle / FOV + 0.5) * WIDTH - spriteSize / 2;
            const screenY = (HEIGHT / 2) - (spriteSize / 2);

            for (let column = 0; column < spriteSize; column++) {
                const drawX = Math.floor(screenX + column);
                if (drawX >= 0 && drawX < WIDTH && screenDist < zBuffer[drawX]) {
                    if (sprite.texture.complete) {
                        const texX = Math.floor((column / spriteSize) * sprite.texture.width);
                        ctx.drawImage(
                            sprite.texture,
                            Math.max(0, Math.min(texX, sprite.texture.width - 1)), 0, 1, sprite.texture.height,
                            drawX, screenY, 1, spriteSize
                        );
                    }
                }
            }
        }
    });
}
export function castRays() {
    const numRays = WIDTH;
    const rayStep = WIDTH / numRays;
    const angleStep = FOV / numRays;
    const projPlaneDist = (WIDTH / 2) / Math.tan(FOV / 2);

    for (let i = 0; i < numRays; i++) {
        const rayAngle = player.angle - FOV / 2 + i * angleStep;

        // We need to modify castSingleRay to return MORE data 
        // (the ray object itself, not just distance)
        // See the modification below
        const ray = castSingleRay(rayAngle);

        const correctedDist = ray.dist * Math.cos(rayAngle - player.angle);
        const wallHeight = (projPlaneDist / correctedDist);

        zBuffer[i] = correctedDist;
        // --- TEXTURE CALCULATION ---

        // 1. Calculate where exactly the wall was hit (Normalized 0.0 to 1.0)
        let wallHitX;

        if (ray.side === 0) {
            // Hit a Vertical wall (Left/Right side of a tile)
            // We want the Y-coordinate within that tile
            wallHitX = (player.y / TILE) + ray.dist * Math.sin(rayAngle);
        } else {
            // Hit a Horizontal wall (Top/Bottom side of a tile)
            // We want the X-coordinate within that tile
            wallHitX = (player.x / TILE) + ray.dist * Math.cos(rayAngle);
        }

        // 2. Get ONLY the decimal part (e.g., 3.45 becomes 0.45)
        wallHitX -= Math.floor(wallHitX);

        // 3. Map that 0.0-1.0 to your texture width (512)
        let texX = Math.floor(wallHitX * wallTexture.width);

        // 4. FIX: Flip the texture on certain sides to prevent "mirroring" 
        // This stops the texture from reversing when you look at the opposite side of a wall
        if ((ray.side === 0 && Math.cos(rayAngle) > 0) || (ray.side === 1 && Math.sin(rayAngle) < 0)) {
            texX = wallTexture.width - texX - 1;
        }

        // 5. Safety Guard
        texX = Math.max(0, Math.min(texX, wallTexture.width - 1));

        // 3. Draw the slice of the texture
        if (wallTexture.complete) {
            ctx.drawImage(
                wallTexture,            // Source Image
                texX, 0,                // Source X, Y
                1, wallTexture.height,  // Source Width, Height (1px slice)
                i * rayStep,            // Dest X
                (HEIGHT / 2) - (wallHeight / 2), // Dest Y
                rayStep,                // Dest Width
                wallHeight              // Dest Height
            );

            // Optional: Shadow mask for North/South walls to show corners
            if (ray.side === 1) {
                ctx.fillStyle = "rgba(0,0,0,0.3)";
                ctx.fillRect(i * rayStep, (HEIGHT / 2) - (wallHeight / 2), rayStep, wallHeight);
            }
        } else {
            // Fallback if texture fails
            ctx.fillStyle = ray.side === 1 ? "#888" : "#AAA";
            ctx.fillRect(i * rayStep, HEIGHT / 2 - wallHeight / 2, rayStep, wallHeight);
        }
    }
}
export function castSingleRay(angle) {
    const sin = Math.sin(angle) || 0.000001;
    const cos = Math.cos(angle) || 0.000001;

    let mapX = Math.floor(player.x / TILE);
    let mapY = Math.floor(player.y / TILE);

    const deltaDistX = Math.abs(1 / cos);
    const deltaDistY = Math.abs(1 / sin);

    let stepX, sideDistX;
    let stepY, sideDistY;

    if (cos < 0) {
        stepX = -1;
        sideDistX = (player.x / TILE - mapX) * deltaDistX;
    } else {
        stepX = 1;
        sideDistX = (mapX + 1 - player.x / TILE) * deltaDistX;
    }

    if (sin < 0) {
        stepY = -1;
        sideDistY = (player.y / TILE - mapY) * deltaDistY;
    } else {
        stepY = 1;
        sideDistY = (mapY + 1 - player.y / TILE) * deltaDistY;
    }

    let hit = false;
    let side = 0;

    while (!hit) {
        if (sideDistX < sideDistY) {
            sideDistX += deltaDistX;
            mapX += stepX;
            side = 0;
        } else {
            sideDistY += deltaDistY;
            mapY += stepY;
            side = 1;
        }

        if (map[mapY] && map[mapY][mapX] === 1) {
            hit = true;
        }
    }

    return {
        dist: (side === 0 ? sideDistX - deltaDistX : sideDistY - deltaDistY),
        side: side // 0 for vertical wall, 1 for horizontal
    };
}


export function drawRetroVictory() {
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;

    // 1. Create a pulsing scale effect using a Sine wave
    const scale = 1 + Math.sin(Date.now() / 200) * 0.05;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);

    // 2. Draw the Drop Shadow
    ctx.font = "bold 80px 'Courier New', monospace"; // Monospace feels more retro
    ctx.textAlign = "center";
    ctx.fillStyle = "#550000"; // Dark red shadow
    ctx.fillText("YOU WIN", 5, 5);

    // 3. Draw the Main Text
    ctx.fillStyle = "#FF0000"; // Bright red
    ctx.strokeStyle = "white"; // White outline
    ctx.lineWidth = 3;
    ctx.fillText("YOU WIN", 0, 0);
    ctx.strokeText("YOU WIN", 0, 0);

    ctx.restore();
}