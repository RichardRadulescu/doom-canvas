let ctx, WIDTH, HEIGHT, map, TILE, player, FOV, wallTexture, enemyTexture, enemy_data;

export function initData() {
    const canvas = document.getElementById("Doom");

    ctx = canvas.getContext("2d");
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

    map = [
        [1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,1],
        [1,0,1,0,1,0,0,1],
        [1,0,1,0,1,0,0,1],
        [1,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1],
    ];

    TILE = 64;

    player = {
        x: TILE * 1.5, 
        y: TILE * 1.5,
        angle: 0,
        speed: 2.5
    };

    FOV = Math.PI / 3;

    wallTexture = new Image();
    wallTexture.src = "./textures/wall.png"; 
    enemyTexture = new Image();
    enemyTexture.src = "./textures/enemy.png";
    enemy_data = [
    { x: TILE * 3.5, y: TILE * 1.5, texture: enemyTexture, alive: true, dist: 0 },
    
    { x: TILE * 6.5, y: TILE * 1.5, texture: enemyTexture, alive: true, dist: 0 },
    
    { x: TILE * 1.5, y: TILE * 4.5, texture: enemyTexture, alive: true, dist: 0 },
    
    { x: TILE * 6.5, y: TILE * 4.5, texture: enemyTexture, alive: true, dist: 0 }
];

    weapon.sheet.src = "./textures/gun_spritesheet.png";
}


// data.js
export let weapon = {
    sheet: new Image(),
    isFiring: false,
    timer: 0,
    totalFrames: 2, // e.g., 0 = Idle, 1 = Muzzle Flash
};

export const zBuffer = new Array(WIDTH).fill(0);
export { ctx, WIDTH, HEIGHT, map, TILE, player, FOV, wallTexture, enemy_data};