# -*- coding: utf-8 -*-
from QuModLibs.Client import *
from modConfig import *

compFactory = clientApi.GetEngineCompFactory()
levelId = clientApi.GetLevelId()
subsidiaryInterface = None
initializeInterface = None
timer = None
tipsCount = 5

def MainTip():
    global tipsCount, subsidiaryInterface, initializeInterface
    if not subsidiaryInterface:
        # ===== 尝试重新获取主包接口 =====
        subsidiaryInterface = compFactory.CreateModAttr("ysm").GetAttr("ysmConfigInterface")
        initializeInterface = compFactory.CreateModAttr("ysm").GetAttr("ysmInitializeInterface")
        # =============================
        compFactory.CreateTextNotifyClient(levelId).SetLeftCornerNotify("§7=====[ §bYSM §e提示 §7]=====\n§r检测到您§4未安装§aYSM主包!\n§b[YSM]是，史蒂夫模型(Yes Steve Model)\n§r请前往§e资源中心§r下载并安装!\n否则附属包将§e无法正常运行!\n§7如果是误报请忽略,剩余提醒次数: §r{}\n\n§r正在尝试重新获取主包...\n\n§7-----Yes Steve Model".format(tipsCount))
        tipsCount -= 1
        if tipsCount <= 0:
            compFactory.CreateGame(levelId).CancelTimer(timer)
            compFactory.CreateTextNotifyClient(levelId).SetLeftCornerNotify("§b获取YSM主包 §c失败!")
    else:
        compFactory.CreateTextNotifyClient(levelId).SetLeftCornerNotify("§b获取YSM主包 §a成功!")
        compFactory.CreateGame(levelId).CancelTimer(timer)

@Listen("LoadClientAddonScriptsAfter")
def OnLoadScriptsAfter(args):
    # ========== 获取接口并添加模型数据 ==========
    global subsidiaryInterface, initializeInterface, timer
    subsidiaryInterface = compFactory.CreateModAttr("ysm").GetAttr("ysmConfigInterface")
    if not subsidiaryInterface:
        timer = compFactory.CreateGame(levelId).AddRepeatedTimer(10.0, MainTip)
        return
    modelList = subsidiaryInterface(configList)
    print("=== 附属包添加以下成功模型 ===\n{}".format(str(modelList)))
    # ========== 获取接口并添加初始化变量 ==========
    initializeInterface = compFactory.CreateModAttr("ysm").GetAttr("ysmInitializeInterface")
    if not initializeInterface:
        return
    try:
        initializeInterface(initialize)
    except NameError:
        print("=== 未定义 initialize ===")
