import {createJimp} from "@jimp/core";
import png from "@jimp/js-png";
import * as resize from "@jimp/plugin-resize";

const JIMP = createJimp({
    plugins: [resize.methods],
    formats: [png],
});

export async function resizeImage(filePath) {
    let image = await JIMP.read(filePath);

    // 尝试缩放过大的图片
    if (image.width > 128 || image.height > 128) {
        let width = 128;
        let height = 128;
        // 还要考虑到不是 1:1 的情况
        let ratio = image.width / image.height;
        if (ratio > 1) {
            height = 128 / ratio;
        } else if (ratio < 1) {
            width = 128 * ratio;
        }
        image.resize({w: width, h: height});
    }

    // 所有的图片都读写一遍，剔除冗余数据
    await image.write(filePath);
}

export async function alphaImage(filePath, allUVs) {
    let image = await JIMP.read(filePath);
    let width = image.width;
    let height = image.height;

    for (let value of allUVs) {
        await image.scan(value[0] * width, value[1] * height, value[2] * width, value[3] * height,
            (x, y, idx) => {
                // 获取当前像素的 Alpha 通道值
                // 范围 0（透明）-255（不透明）
                let alpha = image.bitmap.data[idx + 3];
                // 我们将其透明度改为 0.2*255=51
                if (51 < alpha) {
                    image.bitmap.data[idx + 3] = 51;
                    // image.bitmap.data[idx] = 255;
                    // image.bitmap.data[idx + 1] = 0;
                    // image.bitmap.data[idx + 2] = 0;
                }
            });
    }

    await image.write(filePath);
}