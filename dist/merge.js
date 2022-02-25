"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeBuilder = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/*class ContentInfo {
  paths: string[];
  contentList: string[];
  postProcess: Function[];
  key: string;
  constructor(_key = "") {
    this.key = _key;
  }
  async readContent(){
    const promiseList = this.paths.map(item => {
      return new Promise((resolve, reject) => {
        fs.readFile(item, "utf8", (data) =>{
          this.
        })
      })
    })
    this.contentList = await Promise.all(promiseList)
  }
  addPath(_path:string, _postProcess: () => {}){
    this.paths.push(_path)
    this.postProcess.push(_postProcess)
  }
  get outputString(){
    return this.contentList.reduce((prev, current) =>
      prev.concat(current)
    )
  }
}*/
const engine_match_key = "<!--ENGINE-->";
const bundle_match_key = "<!--BUNDLE-->";
const entrypoint_match_key = "<!--ENTRYPOINT-->";
const resmap_match_key = "<!--RESMAP-->";
const hook_match_key = "<!--DOWNLOAD_HOOK-->";
const system_js_match_key = "<!--SYSTEM_JS-->";
const polyfill_match_key = "<!--POLYFILLS-->";
const import_map_match_key = "<!--IMPORT_MAP-->";
const dapi_match_key = "<!--DAPI_HEAD-->";
const dapi_body_match_key = "<!--DAPI_BODY-->";
const fileByteList = [".png", ".bin", ".mp3"];
const excludeList = ["/index.js"];
const base64PreList = new Map([
    [".png", "data:image/png;base64,"],
    [".bin", "data:application/octet-stream;base64,"],
    [".mp3", "data:audio/mpeg;base64,"],
    [".ttf", ""],
]);
class MergeBuilder {
    constructor(_rootRest) {
        this.rootDest = _rootRest;
        this.application_js_path = path.join(this.rootDest, "application.js");
        this.index_js_path = path.join(this.rootDest, "index.js");
        this.wrapper_path = path.join(__dirname, "../static/wrapper.js");
        this.html_path = path.join(__dirname, "../static/index.html");
        this.output_path = path.join(this.rootDest, "merge.html");
        this.cc_index_js_path = path.join(this.rootDest, "assets/main/index.js");
        this.engine_path = path.join(this.rootDest, "cocos-js/cc.js");
        this.bundle_path = path.join(this.rootDest, "src/chunks/bundle.js");
        this.hook_path = path.join(__dirname, "../static/download-hook.js");
        this.style_path = path.join(this.rootDest, "style.css");
        this.res_path = path.join(this.rootDest, "assets/main/");
        this.system_js_path = path.join(this.rootDest, "src/system.bundle.js");
        this.polyfill_path = path.join(this.rootDest, "src/polyfills.bundle.js");
        this.dapi_path = path.join(this.rootDest, "playable/dapi.js");
        this.dapi_body_path = path.join(this.rootDest, "playable/dapi-body.js");
        this.setting_path = path.join(this.rootDest, "src/settings.json");
    }
    readFile(filePath) {
        console.log(filePath);
        if (!filePath)
            return "";
        const extName = path.extname(filePath);
        let ret;
        if (base64PreList.has(extName)) {
            const buffer = fs.readFileSync(filePath);
            const base64 = Buffer.from(buffer).toString("base64");
            const preName = base64PreList.get(extName);
            ret = preName + base64;
        }
        else if (extName === "") {
            ret = "";
        }
        else {
            ret = fs.readFileSync(filePath, "utf8");
        }
        return ret;
    }
    getResMap(jsonMap, _path) {
        const fileList = fs.readdirSync(_path, { withFileTypes: true });
        for (const file of fileList) {
            const absPath = path.resolve(_path, file.name);
            if (file.isDirectory()) {
                this.getResMap(jsonMap, absPath);
            }
            else {
                const relativePath = absPath.replace(this.res_path, "/");
                jsonMap.set(relativePath, this.readFile(absPath));
            }
        }
    }
    getResMapScript() {
        let jsonObj = new Map();
        this.getResMap(jsonObj, this.res_path);
        const object = Object.fromEntries(jsonObj);
        console.log(object);
        const resStr = "<script>\nwindow.resMap = " + JSON.stringify(object) + "</script>\n";
        return resStr;
    }
    simpleReplace(targetStr, findStr, replaceStr) {
        const group = targetStr.split(findStr, 2);
        return group[0] + replaceStr + group[1];
    }
    merge(adNetwork) {
        let html_str = this.readFile(this.html_path);
        const style_str = "<style>\n" + this.readFile(this.style_path) + "</style>\n";
        html_str = html_str.replace("<!--STYLE-->", style_str);
        // system_js
        const system_js_str = "<script>\n" + this.readFile(this.system_js_path) + "</script>\n";
        fs.writeFileSync(path.join(this.rootDest, "middle.js"), system_js_str);
        fs.writeFileSync(path.join(this.rootDest, "middle1.txt"), html_str);
        html_str = this.simpleReplace(html_str, system_js_match_key, system_js_str);
        fs.writeFileSync(path.join(this.rootDest, "middle2.txt"), html_str);
        // polyfill_js
        const polyfill_str = "<script>\n" + this.readFile(this.polyfill_path) + "</script>\n";
        html_str = html_str.replace(polyfill_match_key, polyfill_str);
        html_str = html_str.replace(import_map_match_key, '<script type="systemjs-importmap">{"imports": {"cc": "./cocos-js/cc.js"}}</script>');
        let wrapper_str = this.readFile(this.wrapper_path);
        // entrypoint
        let application_str = "function loadApplication(){\n" +
            this.readFile(this.application_js_path) +
            "}\n";
        application_str = application_str.replace("cc = engine;", "cc = engine;\nhook(cc);\n");
        application_str = application_str.replace("requestSettings();", "resolve();");
        const index_str = "function loadIndex(){\n" + this.readFile(this.index_js_path) + "}\n";
        const entrypoint_str = "<script>\n" + application_str + index_str + wrapper_str + "</script>\n";
        html_str = html_str.replace(entrypoint_match_key, entrypoint_str);
        if (adNetwork === "ironsource") {
            // dapi
            const dapi_str = "<script>\n" + this.readFile(this.dapi_path) + "</script>\n";
            const dapi_body_str = "<script>\n" + this.readFile(this.dapi_body_path) + "</script>\n";
            html_str = html_str.replace(dapi_match_key, dapi_str);
            html_str = html_str.replace(dapi_body_match_key, dapi_body_str);
        }
        //engine
        const engine_str = "<script>\nfunction loadCC(){\n" +
            this.readFile(this.engine_path) +
            "}\n</script>\n";
        html_str = this.simpleReplace(html_str, engine_match_key, engine_str);
        //bundle
        const bundle_str = "<script>\nfunction loadBundle(){\n" +
            this.readFile(this.bundle_path) +
            "}\n</script>\n";
        html_str = this.simpleReplace(html_str, bundle_match_key, bundle_str);
        // hook
        let hook_str = "<script>\n" + this.readFile(this.hook_path) + "</script>\n";
        if (adNetwork !== "google") {
            //skip loading mp3
            hook_str = hook_str.replace("oldHook(url, options, onComplete)", "onComplete()");
        }
        html_str = html_str.replace(hook_match_key, hook_str);
        // resmap
        const resStr = this.getResMapScript();
        const cc_index_str = "<script>\nfunction loadCCIndex(){\n" +
            this.readFile(this.cc_index_js_path) +
            "}\n</script>\n";
        const setting_str = "<script>window._CCSettings = " +
            this.readFile(this.setting_path) +
            "</script>\n";
        html_str = html_str.replace(resmap_match_key, resStr + "\n" + cc_index_str + setting_str);
        fs.writeFileSync(this.output_path, html_str);
    }
}
exports.MergeBuilder = MergeBuilder;
