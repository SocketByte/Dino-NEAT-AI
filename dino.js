const WIDTH = 1100;
const HEIGHT = 950;
const PLAY_AREA_Y = 700;
const DRAGON_X = 300;
const OBSTACLE_X = 1300;
const ANIMATION_RATE = 20;
// configurable
let POPULATION = 500;
let OBSTACLE_RATE_BASE = 80;
let OBSTACLE_RATE_GAIN = 0.1;
let OBSTACLE_SPEED_BASE = 8;
let OBSTACLE_SPEED_GAIN = 0.02;
let CROSSOVER_METHOD = crossover.RANDOM;
let BIRD_CHANCE = 0.2;
let SMALL_CACTUS_CHANCE = 0.6;
let BIG_CACTUS_CHANCE = 0.9;
let GROUP_CACTUS_CHANCE = 1.0;

let entities = [];
let obstacles = [];
let obstacle_timer = 0;
let obstacle_rate = OBSTACLE_RATE_BASE;
let obstacle_speed = OBSTACLE_SPEED_BASE;
let obstacle_offset = 0;
let neat;
let show_best = false;
let show_close = false;

// IMAGES
let dinoRun1;
let dinoRun2;
let dinoJump;
let dinoDead;
let dinoDuck1;
let dinoDuck2;
let cactusSmall;
let cactusBig;
let cactusGroup;
let bird1;
let bird2;
let cloud;

class Obstacle {
    constructor() {
        this.x = OBSTACLE_X;
        this.y = PLAY_AREA_Y;
        this.close = false;

        this.animationChangeTimer = 0;
        this.animationIndex = true;
        this.bird = false;
        this.bigCactus = false;
        this.smallCactus = false;
        this.groupCactus = false;
        let chance = random(0, 1);
        if (chance < BIRD_CHANCE) {
            this.y -= 72;
            this.w = 45;
            this.h = 45;
            this.bird = true;
        }
        else if (chance < SMALL_CACTUS_CHANCE) {
            this.w = 35;
            this.h = 70;
            this.smallCactus = true;
        }
        else if (chance < BIG_CACTUS_CHANCE) {
            this.w = 45;
            this.h = 100;
            this.bigCactus = true;
        }
        else if (chance < GROUP_CACTUS_CHANCE) {
            this.w = 70;
            this.h = 60;
            this.groupCactus = true;
        }
    }

    isColliding(dragon) {
        let dX = dragon.x;
        let dY = dragon.y;
        let dW = dragon.w/2;
        let dH = dragon.h/2;

        return dX + dW >= this.x
            && dX - dW <= this.x + this.w
            && dY + dH >= this.y - this.h
            && dY - dH <= this.y;
    }

    show() {
        if (this.animationChangeTimer > ANIMATION_RATE) {
            this.animationChangeTimer = 0;
            this.animationIndex = !this.animationIndex;
        }

        if (this.close && show_close)
            tint(255, 0, 0);

        if (this.bird) {
            if (this.animationIndex)
                image(bird1, this.x, this.y, this.w, -this.h);
            else image(bird2, this.x, this.y, this.w, -this.h);
        }
        else if (this.smallCactus)
            image(cactusSmall, this.x, this.y, this.w, -this.h);
        else if (this.bigCactus)
            image(cactusBig, this.x, this.y, this.w, -this.h);
        else if (this.groupCactus)
            image(cactusGroup, this.x, this.y, this.w, -this.h);
    }

    update() {
        this.animationChangeTimer++;
        this.x -= obstacle_speed;
    }
}

const JUMP_ACC_SHORT = -12;
const JUMP_ACC_LONG = -14;
const GRAVITY = -1;
const BASE_WIDTH = 60;
const BASE_HEIGHT = 60;
const CROUCH_WIDTH = 70;
const CROUCH_HEIGHT = 40;
class Dragon {
    constructor() {
        this.w = BASE_WIDTH;
        this.h = BASE_HEIGHT;
        this.x = DRAGON_X;
        this.y = PLAY_AREA_Y;
        this.dead = false;
        this.acc = 0;
        this.jumping = false;
        this.crouching = false;
        this.timeAlive = 0;

        this.animationChangeTimer = 0;
        this.animationIndex = true;
    }

    draw(best) {
        if (this.dead)
            return;
        if (this.animationChangeTimer > ANIMATION_RATE) {
            this.animationChangeTimer = 0;
            this.animationIndex = !this.animationIndex;
        }

        if (best)
            tint(0, 225, 0);

        if (this.jumping)
            image(dinoJump, this.x, this.y, this.w, this.h);
        else if (this.animationIndex) {
            if (this.crouching)
                image(dinoDuck1, this.x, this.y, this.w, this.h);
            else image(dinoRun1, this.x, this.y, this.w, this.h);
        } else {
            if (this.crouching)
                image(dinoDuck2, this.x, this.y, this.w, this.h);
            else image(dinoRun2, this.x, this.y, this.w, this.h);
        }
    }

    update(output) {
        if (this.dead)
            return;
        this.animationChangeTimer++;
        this.timeAlive++;

        this.y += this.acc;
        this.acc -= GRAVITY;

        if (this.y >= PLAY_AREA_Y - (this.h)) {
            this.jumping = false;
            this.y = PLAY_AREA_Y - (this.h);
        }

        if (this.jumping)
            return;
        if (output === 0) {
            this.acc = JUMP_ACC_SHORT;
            this.jumping = true;
            this.crouching = false;
        } else if (output === 1) {
            this.acc = JUMP_ACC_LONG;
            this.jumping = true;
            this.crouching = false;
        } else this.crouching = output === 2;

        if (this.crouching) {
            this.w = CROUCH_WIDTH;
            this.h = CROUCH_HEIGHT;
        }
        else {
            this.w = BASE_WIDTH;
            this.h = BASE_HEIGHT;
        }
    }

    die() {
        this.dead = true;
    }
}

let pebble_timer = 0;
let pebble_rate = 8;
let pebbles = [];
class Pebble {
    constructor() {
        this.x = OBSTACLE_X + random(-10, 50);
        this.y = PLAY_AREA_Y + random(0, 20);
        this.w = random(3, 7);
    }

    show() {
        fill(0);
        rect(this.x, this.y, this.w, 1);
    }

    update() {
        this.x -= obstacle_speed;
    }
}

let cloud_timer = 250;
let cloud_rate = 300;
let cloud_offset = 0;
let clouds = [];
class Cloud {
    constructor() {
        this.x = OBSTACLE_X + random(-10, 50);
        this.y = PLAY_AREA_Y - random(100, 250);
    }

    show() {
        image(cloud, this.x, this.y, 70, 20);
    }

    update() {
        this.x -= 2;
    }
}

function loadParameters() {
    let elements = document.getElementsByTagName("input");
    for (let element of elements) {
        if (getCookie(element.id)) {
            console.log("GET COOKIE")
            element.value = getCookie(element.id);
        } else {
            console.log("SET COOKIE")
            setCookie(element.id, element.value);
            element.value = getCookie(element.id);
        }
    }
    if (!getCookie("crossover_method")) {
        let cm = document.getElementById("crossover_method");
        setCookie("crossover_method", cm.options[cm.selectedIndex].value)
    }
    let cm = document.getElementById("crossover_method");
    if (getCookie("crossover_method") === "RANDOM")
        cm.selectedIndex = 0;
    else cm.selectedIndex = 1;

    POPULATION = Number(getCookie("population"));
    OBSTACLE_RATE_BASE = Number(getCookie("obstacle_rate"));
    OBSTACLE_RATE_GAIN = Number(getCookie("obstacle_rate_gain"));
    OBSTACLE_SPEED_BASE = Number(getCookie("obstacle_speed"));
    OBSTACLE_SPEED_GAIN = Number(getCookie("obstacle_speed_gain"));
    CROSSOVER_METHOD = getCookie("crossover_method") === "RANDOM" ? crossover.RANDOM : crossover.SLICE;
    BIRD_CHANCE = Number(getCookie("bird_chance"));
    SMALL_CACTUS_CHANCE = Number(getCookie("small_cactus_chance"));
    BIG_CACTUS_CHANCE = Number(getCookie("big_cactus_chance"));
    GROUP_CACTUS_CHANCE = Number(getCookie("group_cactus_chance"));
}

function changeParameters() {
    let elements = document.getElementsByTagName("input");
    for (let element of elements) {
        let value = element.value;

        setCookie(element.id, value);
    }
    let cm = document.getElementById("crossover_method");
    setCookie("crossover_method", cm.options[cm.selectedIndex].value)
}

function keyTyped() {
    if (key === 's') {
        show_best = !show_best;
    }
    if (key === 'c') {
        show_close = !show_close;
    }
}

function setup() {
    loadParameters();

    createCanvas(WIDTH, HEIGHT);
    for (let i = 0; i < POPULATION; i++) {
        entities[i] = new Dragon();
    }
    obstacles.push(new Obstacle());
    neat = new NEAT( {
        model: [
            {nodeCount: 4, type: "input"},
            {nodeCount: 4, type: "output", activationfunc: activation.RELU}
        ],
        mutationRate: 0.05,
        crossoverMethod: crossover.RANDOM,
        mutationMethod: mutate.RANDOM,
        populationSize: POPULATION
    });

    dinoRun1 = loadImage('assets/dinoRun1.png');
    dinoRun2 = loadImage('assets/dinoRun2.png');
    dinoDead = loadImage('assets/dinoDead.png');
    dinoDuck1 = loadImage('assets/dinoDuck1.png');
    dinoDuck2 = loadImage('assets/dinoDuck2.png');
    dinoJump = loadImage('assets/dinoJump.png');
    cactusBig = loadImage('assets/cactusBig.png');
    cactusSmall = loadImage('assets/cactusSmall.png');
    cactusGroup = loadImage('assets/cactusGroup.png');
    bird1 = loadImage('assets/bird1.png');
    bird2 = loadImage('assets/bird2.png');
    cloud = loadImage('assets/cloud.png');
    randomAlive = getRandomAliveCreature();

}
let randomAlive;
function draw() {
    clear();
    stroke(0);
    strokeWeight(10);
    fill(255);
    rect(0, 0, WIDTH, HEIGHT);
    strokeWeight(1);
    line(0, PLAY_AREA_Y - 12, WIDTH, PLAY_AREA_Y - 12);
    noStroke();

    // PEBBLES
    pebble_timer++;
    if (pebble_timer > pebble_rate) {
        pebble_timer = 0;
        pebbles.push(new Pebble());
    }

    let pR = -1;
    for (let i = 0; i < pebbles.length; i++) {
        pebbles[i].show();
        pebbles[i].update();
        if (pebbles[i].x < -50)
            pR = i;
    }
    if (pR !== -1)
        pebbles.splice(pR, 1);

    // CLOUDS
    cloud_timer++;
    if (cloud_timer > cloud_rate + cloud_offset) {
        cloud_timer = 0;
        clouds.push(new Cloud());
        cloud_offset = random(-100, 100);
    }

    let cR = -1;
    for (let i = 0; i < clouds.length; i++) {
        clouds[i].show();
        clouds[i].update();
        if (clouds[i].x < -50)
            cR = i;
    }
    if (cR !== -1)
        clouds.splice(cR, 1);

    // OTHER
    let alive = getAlive();
    let decisions = neat.getDecisions();
    let closest = getClosestObstacle();
    if (closest !== null)
        closest.close = true;

    textSize(25);
    fill(0);
    text('Generation: ' + (neat.generation + 1), 10, 30);
    text('Alive: ' + alive + " / " + POPULATION, 10, 60);
    if (show_best) {
        fill(0, 225, 0);
        text('[Spectator Mode]', 10, 90);
        fill(160);
        textSize(18);
        text('Current dino statistics', 10, 130);
        textSize(15);
        if (closest !== null) {
            text('Input [0] (Is bird?):     ' + (closest.bird ? "Yes" : "No"), 10, 150);
            text('Input [1] (X coord):    ' + (Math.round(closest.x)), 10, 170);
            text('Input [2] (Y coord):    ' + (closest.y), 10, 190);
            text('Input [3] (Height):      ' + (closest.h), 10, 210);
        }
        else {
            fill(255, 0, 0);
            text('*No obstacle in sight*', 10, 150);
        }
        fill(160);
        if (entities[randomAlive] !== undefined) {
            text('Fitness score: ' + (entities[randomAlive].timeAlive), 10, 240);
        }
        text('Decision: ' + (decisionToName(decisions[randomAlive])), 10, 260);
    }

    // OBSTACLES
    obstacle_timer++;
    if (obstacle_timer > obstacle_rate + obstacle_offset) {
        obstacles.push(new Obstacle());
        if (obstacle_rate > 50)
            obstacle_rate -= OBSTACLE_RATE_GAIN;
        if (obstacle_speed < 16)
            obstacle_speed += OBSTACLE_SPEED_GAIN;
        obstacle_timer = 0;
        obstacle_offset = random(-30, 30);
    }

    let r = -1;
    for (let i = 0; i < obstacles.length; i++) {
        let obstacle = obstacles[i];
        obstacle.show();
        obstacle.update();
        obstacle.close = false;

        noTint();

        if (obstacle.x < -50) {
            r = i;
        }
    }
    if (r !== -1)
        obstacles.splice(r, 1);

    // ENTITES
    neat.feedForward();
    for (let i = 0; i < POPULATION; i++) {
        let entity = entities[i];
        if (show_best && i === randomAlive) {
            entity.draw(neat.bestCreature() === i);
        } else if (!show_best)
            entity.draw(neat.bestCreature() === i);

        noTint();
        entity.update(decisions[i]);
        for (let i = 0; i < obstacles.length; i++) {
            if (obstacles[i].isColliding(entity)) {
                neat.setFitness(entity.timeAlive, i);
                entity.die();

                randomAlive = getRandomAliveCreature();
            }
        }

        if (closest === null)
            neat.setInputs([0, 0, 0], i);
        else neat.setInputs([closest.bird ? 1000 : -1000, closest.x, closest.y, closest.h], i);

       // console.log(closest.bird ? 1 : 0, closest.x, closest.y, closest.h);
    }

    if (alive !== 0)
        return;

    obstacles = [];
    createNewPopulation();
    randomAlive = getRandomAliveCreature();
    obstacle_rate = OBSTACLE_RATE_BASE;
    obstacle_speed = OBSTACLE_SPEED_BASE;

    neat.doGeneration();
}

function getRandomAliveCreature() {
    for (let i = 0; i < POPULATION; i++) {
        let entity = entities[i];
        if (!entity.dead)
            return i;
    }
    return -1;
}

function getAlive() {
    let alive = POPULATION;
    for (let i = 0; i < POPULATION; i++) {
        let entity = entities[i];
        if (entity.dead)
            alive--;
    }
    return alive;
}

function getClosestObstacle() {
    let min = Number.MAX_SAFE_INTEGER;
    let minObst = null;
    for (let i = 0; i < obstacles.length; i++) {
        let obstacle = obstacles[i];
        let dist = obstacle.x - DRAGON_X;
        if (dist < min && dist > 0) {
            min = dist;
            minObst = obstacle;
        }
    }
    return minObst;
}

function createNewPopulation() {
    for (let i = 0; i < POPULATION; i++) {
        entities[i].dead = false;
        entities[i].timeAlive = 0;
    }
}

function decisionToName(decision) {
    switch (decision) {
        case 0:
            return "Short jumping [0]";
        case 1:
            return "Long jumping [1]";
        case 2:
            return "Crouching [2]";
        case 3:
            return "Running [3]";
    }
}