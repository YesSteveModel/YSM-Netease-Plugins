import PACKAGE from "../package.json";

import {javaToNeteaseTransformAction} from "./netease/java_to_netease_transform.js";

BBPlugin.register(PACKAGE.name, {
    title: PACKAGE.title,
    author: PACKAGE.author,
    description: PACKAGE.description,
    about: PACKAGE.about,
    icon: "card_membership",
    variant: "desktop",
    version: PACKAGE.version,
    min_version: PACKAGE.min_blockbench_version,
    tags: ["Netease Minecraft", "Yes Steve Model", "Mod"],
    await_loading: true,
    onload() {
        Language.addTranslations("en", {
            "menu.ysm_netease_utils": "YSM中国版"
        });
        new BarMenu("ysm_netease_utils", [
            "ysm_netease_utils.java_to_netease_transform"
        ]);
        MenuBar.update();
    },
    onunload() {
        javaToNeteaseTransformAction.delete();
    },
    oninstall() {
    },
    onuninstall() {
    },
});