function vector_3_add(v1, v2) {
    return new THREE.Vector3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
}

function set_events() {
    if (is_set_events) return;
    is_set_events = true;
    document.addEventListener("keydown", _keydown);
    document.addEventListener("keyup", _keyup);
    window.addEventListener("resize", resize);
}

function resize() {
    WALLW = document.body.offsetWidth;
    WALLH = document.body.offsetHeight;
    aspect = WALLW / WALLH;
    // console.log("WALLH: " + WALLH);
    renderer.setSize(WALLW, WALLH, true);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
}

function init_show(show) {
    if (show) {
        document.querySelector("#init").classList.add("active");
    } else {
        document.querySelector("#init").classList.remove("active");
    }
}

function start() {
    playername = document.querySelector("#player_name").value;
    if (playername == "")
        playername = "Player";
    init_show(false);
    game_init();
}

function load_hs()
{
    highscore_player = localStorage.getItem("highscore_player");
    highscore = localStorage.getItem("highscore");
    if (highscore == null || highscore == undefined) {
        highscore_player = "";
        highscore = 0;
        document.querySelector("#header_highscore").innerText = 0;
    } else{
        highscore = parseInt(highscore);
        document.querySelector("#header_highscore").innerText = highscore;
    }
    document.querySelector("#init_highscore").innerText = highscore;
}

function main() {
    load_hs();
    document.querySelector("#start").addEventListener("click", start);
    document.querySelector("#result_close").addEventListener("click", result_close);
}

document.addEventListener("DOMContentLoaded", main);