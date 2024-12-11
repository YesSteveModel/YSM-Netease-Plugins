const fs = require("fs");

fs.readFile("ysm-netease-utils.js", "utf-8", (error, data) => {
    let out = data.replaceAll("__vue_component__", "__vue_component_ysm_netease__")
        .replaceAll("__vue_script__", "__vue_script_ysm_netease__")
        .replaceAll("__vue_render__", "__vue_render_ysm_netease__");
    fs.writeFile("ysm-netease-utils.js", out, (error) => {
    });
});