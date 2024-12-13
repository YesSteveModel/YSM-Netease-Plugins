import javaToNeteaseTransformVue from "./java_to_netease_transform.vue";

export var javaToNeteaseTransformAction = new Action("ysm_netease_utils.java_to_netease_transform", {
    name: "转换模型到中国版", icon: "fa-file-alt", click: function () {
        let javaToNeteaseTransformDialog = new Dialog({
            title: "转换模型到中国版",
            singleButton: true,
            component: {
                data() {
                    return {
                        javaToNeteaseTransformDialog: javaToNeteaseTransformDialog
                    };
                },
                components: {javaToNeteaseTransformVue: javaToNeteaseTransformVue},
                template: "<javaToNeteaseTransformVue :javaToNeteaseTransformDialog='javaToNeteaseTransformDialog'/>"
            }
        });
        javaToNeteaseTransformDialog.show();
    }
});