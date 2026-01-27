function isWall(x, y) {
    const mapX = Math.floor(x / TILE);
    const mapY = Math.floor(y / TILE);
    return map[mapY][mapX] === 1;
}
