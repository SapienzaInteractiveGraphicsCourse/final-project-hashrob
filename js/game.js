
function game_init() {
    ingame = true;
    document.querySelector("#header_player_name").innerText = playername;
    document.querySelector("#header_highscore").innerText = highscore;
    game_init_canvas();
}

function game_init_canvas() {
    if (inited) {
        game_stage_reset();
        return;
    }
    inited = true;
    WALLH = document.body.offsetHeight;
    WALLW = document.body.offsetWidth;
    set_events();
    var holder = document.body.querySelector("#canvash");
    //scene, camera and rendere
    scene_main = new THREE.Scene();
    scene_main.background = new THREE.Color(0xcccccc);
    aspect = WALLW / WALLH;
    var fov = 70;
    // console.log("fov: " + fov);
    camera = new THREE.PerspectiveCamera(fov, aspect, 1, 10000);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(WALLW, WALLH, false);
    holder.appendChild(renderer.domElement);

    wall = document.querySelector('canvas');
    var loader = new THREE.GLTFLoader();
    loader.load('assets/objects/scene.gltf', function (gltf) {
        game_scene_init(gltf);
        game_stage_reset();
    }, function (xhr) {
        console.log('object ' + (xhr.loaded / xhr.total * 100) + '% loaded');
    }, function (error) {
        console.error(error);
    });
}

function game_stage_finish() {
    if (paused) return;
    console.log("game_stage_finish");
    paused = true;
    setTimeout(function(){
        stage++;
        document.querySelector("#header_stage").innerText = stage;
        game_stage_reset();
    }, 500);
    setTimeout(function () {
        paused = false;
    }, 1000);
}

function game_stage_reset() {
    car.position.set(car_position_init.x, car_position_init.y, car_position_init.z);
    camera.position.set(camera_position_init.x, camera_position_init.y, camera_position_init.z);
    speed = 0;
    tires_rotate(0);
    car.rotation.set(0, 0, 0);
    is_accelerating = false;
    is_braking = false;
    keeping_left = false;
    keeping_right = false;
    camera_position();
    game_create_obstacles();
    game_start();
}

function game_start() {
    game_animate();
    iv_score = setInterval(game_calc_score, 500);
    iv_collision = setInterval(game_check_colision, 5);
    iv_move = setInterval(game_handle_move, 10);
}

function game_finish() {
    ingame = false;
    clearInterval(iv_score);
    clearInterval(iv_collision);
    clearInterval(iv_move);
    if(score > highscore){
        highscore = score;
        highscore_player = playername;
        localStorage.setItem("highscore", score);
        localStorage.setItem("highscore_player", playername);
    }
    game_result(true);
    score = 0;
}

function result_close() {
    document.querySelector("#result").classList.remove("active");
    init_show(true);
}

function game_result(show) {
    if (!show) {
        result_close();
        return;
    }
    document.querySelector("#result").classList.add("active");
    document.querySelector("#result_playername").innerText = playername;
    document.querySelector("#result_score").innerText = score;
    document.querySelector("#result_highscore").innerText = highscore_player + ": " + highscore;
    document.querySelector("#init_highscore").innerText = highscore;
    
}

function game_animate() {
    if (!ingame) return;
    if (paused){
        setTimeout(game_animate, 100);
        return;
    }
    camera.lookAt(vector_3_add(new THREE.Vector3(car.position.x, 0, 0), camera_to_car_diff));
    game_render();
    TWEEN.update();
    // 
    requestAnimationFrame(game_animate);
}

function game_render() {
    renderer.render(scene_main, camera);
}

function game_calc_score() {
    if(!ingame) return;
    if(speed < speed_min_score) {
        return;
    }
    score += Math.ceil(speed * 10);
    document.querySelector("#header_score").innerText = score;
}

function game_create_obstacles() {
    var obstacle_1 = scene.getObjectByName("obstacle_1");
    var obstacle_2 = scene.getObjectByName("obstacle_2");
    var obstacle_3 = scene.getObjectByName("obstacle_3");
    
    obstacle_1.visible = obstacle_2.visible = obstacle_3.visible= false;
    let n = stage * 3;
    let pos = {
        x: obstacle_min.x,
        z: obstacle_min.z
    };
    let obstacle_new;
    let distance_z = distance.z;
    for (let i = 0; i < obstacles.length; i++) {
        try{
            obstacles[i].material.dispose();
            obstacles[i].geometry.dispose();
        } catch (ex) { }
        scene.remove(obstacles[i].parent);
    }
    obstacles = [];
    for (let i = 0; i < n; i++) {
        let rnd = (Math.random() * 70) + (stage);
        if (rnd < 40) {
            obstacle_new = obstacle_1.clone(true);
            distance_z = 7;
        } else if (rnd < 60) {
            obstacle_new = obstacle_2.clone(true);
            distance_z = 5;
        } else {
            obstacle_new = obstacle_3.clone(true);
            distance_z = 3;
        }
        let x_to_add = (Math.random() * (distance.x / n));
        if (x_to_add < 5)
            x_to_add += 5;
        pos = {
            x: pos.x - x_to_add,
            z: obstacle_min.z + (Math.random() * distance_z)
        };
        obstacle_new.name = "_obstacle_" + (i + 1);
        obstacle_new.children[0].name = "__obstacle__" + (i + 1);
        obstacle_new.visible = true;
        obstacle_new.position.set(pos.x, 0, pos.z);
        scene.add(obstacle_new);
        obstacles.push(obstacle_new.children[0]);
    }
}

function game_check_colision() {
    if (!ingame)
        return;
    if (paused)
        return;
    const originPoint = car_obj.geometry.getAttribute('position');
    const localVertex = new THREE.Vector3();
    const globalVertex = new THREE.Vector3();
    for (let vertexIndex = 0; vertexIndex < originPoint.count; vertexIndex++) {
        localVertex.fromBufferAttribute(originPoint, vertexIndex);
        globalVertex.copy(localVertex).applyMatrix4(car_obj.matrixWorld);
    }
    const directionVector = globalVertex.sub(car.position);
    var ray = new THREE.Raycaster(car.position, directionVector.normalize());
    var collisions = ray.intersectObjects(obstacles);
    if (collisions.length > 0) {
        for (let i = 0; i < collisions.length; i++) {
            if (collisions[i].distance < 1) {
                game_finish();
                return;
            }
        }
    }
}

function game_scene_init(gltf) {
    scene_main.add(gltf.scene);
    scene = scene_main.children[0];
    car = scene.getObjectByName("car");
    car_obj = car.getObjectByName("Group_274");
    tire_right_1 = car.getObjectByName("tire_right_1");
    tire_right_2 = car.getObjectByName("tire_right_2");
    tire_right_3 = car.getObjectByName("tire_right_3");
    tire_left_1 = car.getObjectByName("tire_left_1");
    tire_left_2 = car.getObjectByName("tire_left_2");
    tire_left_3 = car.getObjectByName("tire_left_3");
    ground = scene.getObjectByName("ground");
    const texture = new THREE.TextureLoader().load("assets/images/asphalt.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 4);
    ground.material.map = texture;
    lights();
}

function lights() {
    light_1 = scene.getObjectByName("light_1");
    light_2 = scene.getObjectByName("light_2");
    light_1.target = car;
    light_2.target = car;
    light_spot_right = scene.getObjectByName("light_spot_right");
    light_spot_left = scene.getObjectByName("light_spot_left");
    light_right_target = scene.getObjectByName("light_right_target");
    light_left_target = scene.getObjectByName("light_left_target");    
    light_spot_right.target = light_right_target;
    light_spot_left.target = light_left_target;
}

function _keydown(e) {
    if (!ingame)
        return;
    if (paused)
        return;
    if (e.key == "ArrowUp") {
        is_accelerating = true;
    }
    if (e.key == "ArrowDown") {
        is_braking = true;
    }
    if (e.key == "ArrowLeft") {
        keeping_left = true;
    }
    if (e.key == "ArrowRight") {
        keeping_right = true;
    }
}

function _keyup(e) {
    if (!ingame)
        return;
    if (paused)
        return;
    if (e.key == "ArrowUp") {
        is_accelerating = false;
    }
    if (e.key == "ArrowDown") {
        is_braking = false;
    }
    if (e.key == "ArrowLeft") {
        wheel_end();
        keeping_left = false;
    }
    if (e.key == "ArrowRight") {
        wheel_end();
        keeping_right = false;
    }
    if (e.key == "1") {
        camera_position(1);
    }
    if (e.key == "2") {
        camera_position(2);
    }
    if (e.key == "3") {
        camera_position(3);
    }
    if (e.key == "esc") {
        game_finish();
    }
    if (e.key == "w") {
        lights_change("white")
    }
    if (e.key == "b") {
        lights_change("blue")
    }
    if (e.key == "y") {
        lights_change("yellow")
    }
}

function game_handle_move()
{
    // camera.lookAt(vector_3_add(new THREE.Vector3(car.position.x, 0, 0), camera_to_car_diff));
    if (speed > 0) {
        move();
    }
    if (is_accelerating) {
        accelerate();
    } else if (is_braking) {
        brake();
    } else {
        idle();
    }
    if (keeping_right) {
        wheel_right();
    } else if (keeping_left) {
        wheel_left();
    }
}

function move() {
    if (car.position.x <= end.x) {
        game_stage_finish();
        return;
    }
    tween = TweenLite.to(camera.position, 0.05, {
        x: parseFloat(camera.position.x - speed).toFixed(3),
        ease: Elastic.easeInOut
    });
    //
    tween = TweenLite.to(car.position, 0.05, {
        x: parseFloat(car.position.x - speed).toFixed(3),
        ease: Elastic.easeInOut
    });
}

function accelerate() {
    if (speed < speed_max)
        speed = parseFloat(speed + a);
}

function brake() {
    if (speed > speed_min)
        speed = parseFloat(speed - (a * 2));
}

function idle() {
    if (speed > speed_min)
        speed = parseFloat(speed - a / 2);
}

function wheel_left() {
    if (car.position.z >= 3) {
        wheel_end();
        return;
    }
    if (speed <= 0)
        return;
    tires_rotate(1);
    tween = TweenLite.to(car.position, 0.2, {
        delay: 0.15,
        z: parseFloat(car.position.z + speed_wheel),
    });
    //
    tween = TweenLite.to(car.rotation, 1, {
        y: 0.2,
    });
}

function wheel_end() {
    tween = TweenLite.to(car.rotation, 1, {
        delay: 0.4,
        y: 0,
    });
    tires_rotate(0);
}

function wheel_right() {
    if (car.position.z <= -3) {
        wheel_end();
        return;
    }
    if (speed <= 0)
        return;
    
    tires_rotate(-1);
    tween = TweenLite.to(car.position, 0.3, {
        delay: 0.15,
        z: car.position.z - speed_wheel,
    });
    // 
    tween = TweenLite.to(car.rotation, 0.3, {
        y: -0.2,
    });
}

function tires_rotate(dir) {
    tween = TweenLite.to(tire_right_1.rotation, 0.2, {
        y: 0.25 * dir,
    });
    tween = TweenLite.to(tire_right_2.rotation, 0.2, {
        y: 0.25 * dir,
    });
    tween = TweenLite.to(tire_right_3.rotation, 0.2, {
        y: 0.25 * dir,
    });
    //
    tween = TweenLite.to(tire_left_1.rotation, 0.2, {
        y: 0.25 * dir,
    });
    tween = TweenLite.to(tire_left_2.rotation, 0.2, {
        y: 0.25 * dir,
    });
    tween = TweenLite.to(tire_left_3.rotation, 0.2, {
        y: 0.25 * dir,
    });
}

function camera_position(location = 0) {
    if (location == 0) {
        camera.position.x = camera_position_init.x;
        camera.position.y = camera_position_init.y;
        location = 1;
    }
    let z = 0;
    if (car)
        z = car.position.z;
    if (location == 1) {
        tween = TweenLite.to(camera.position, 1.5, {
            z: z,
            ease: Elastic.ease
        });
    } else if (location == 2) {
        tween = TweenLite.to(camera.position, 1.5, {
            z: z + 2,
            ease: Elastic.ease
        });
    } else if (location == 3) {
        tween = TweenLite.to(camera.position, 1.5, {
            z: z - 2,
            ease: Elastic.ease,
        });
    }
}

function lights_change(choice) {
    switch (choice) {
        case "blue":
            lights_blue();
            break;
        case "white":
            lights_white();
            break;
        case "yellow":
            lights_yellow();
            break;
    }
}

function lights_blue() {
    light_1.color = new THREE.Color(0, 0.06, 0.55);
    light_2.color = new THREE.Color(0, 0.06, 0.55);
}

function lights_white() {
    light_1.color = new THREE.Color(0xffffff);
    light_2.color = new THREE.Color(0xffffff);
}

function lights_yellow() {
    light_1.color = new THREE.Color(0.46, 0.46, 0);
    light_2.color = new THREE.Color(0.46, 0.46, 0);
}