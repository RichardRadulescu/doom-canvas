import { ctx, WIDTH, HEIGHT, player } from "./data.js";

// Mock data (move this to player object later)
let health = 100;
let ammo = 30;

export function drawUI() {
    // 1. Setup Font
    ctx.font = "20px 'Courier New'";
    ctx.textBaseline = "top";
    
    // 2. Draw Health Bar
    const barWidth = 200;
    const barHeight = 20;
    const padding = 20;
    
    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(padding, HEIGHT - padding - barHeight - 30, barWidth + 10, barHeight + 40);

    // Health Text
    ctx.fillStyle = "white";
    ctx.fillText(`HEALTH: ${health}%`, padding + 5, HEIGHT - padding - barHeight - 25);

    // Red Bar
    ctx.fillStyle = "red";
    ctx.fillRect(padding + 5, HEIGHT - padding - barHeight, barWidth * (health/100), barHeight);
    
    // 3. Draw Ammo (Right side)
    const ammoText = `AMMO: ${ammo}`;
    const textWidth = ctx.measureText(ammoText).width;
    
    ctx.fillStyle = "white";
    ctx.fillText(ammoText, WIDTH - textWidth - padding, HEIGHT - padding - 30);
    
    // 4. Crosshair (Center of screen)
    ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(WIDTH/2 - 10, HEIGHT/2);
    ctx.lineTo(WIDTH/2 + 10, HEIGHT/2);
    ctx.moveTo(WIDTH/2, HEIGHT/2 - 10);
    ctx.lineTo(WIDTH/2, HEIGHT/2 + 10);
    ctx.stroke();
}