import { enemy_data, initData } from "./data.js";
import { castRays, drawRetroVictory, drawScene } from "./graphics.js";
import { handleInput } from "./input.js";
import { ctx, WIDTH, HEIGHT, map, TILE, player, FOV } from "./data.js";


function loop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    handleInput();
    drawScene();

    if(enemy_data.every(enemy => enemy.alive === false)){
        drawRetroVictory();
        return;
    }

    requestAnimationFrame(loop);
}
initData();
loop();
