#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ----------------- 配置 -----------------
const PACKAGE_JSON = path.resolve(__dirname, "package.json");

// 方式选择：A = 不同包名，B = 同包名 + tag
const MODE = "B"; // "A" 或 "B"

// ----------------- 工具函数 -----------------
function run(cmd) {
    console.log(`\n> ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
}

function readPackageJson() {
    return JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
}

function writePackageJson(pkg) {
    fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2), "utf8");
}

// ----------------- 正式版发布 -----------------
function publishRelease() {
    console.log("\n=== 发布正式版 ===");
    run("git checkout main");
    run("git pull");
    run("npm version patch"); // 或 minor / major
    if (MODE === "A") {
        const pkg = readPackageJson();
        pkg.name = "poi-plugin-item-improvement2";
        writePackageJson(pkg);
    }
    run("npm publish");
}

// ----------------- Beta 版发布 -----------------
function publishBeta() {
    console.log("\n=== 发布 Beta 版 ===");
    run("git checkout main");
    run("git pull");
    run("npm version prerelease --preid=beta");

    if (MODE === "A") {
        const pkg = readPackageJson();
        pkg.name = "poi-plugin-item-improvement2-beta";
        writePackageJson(pkg);
    }

    if (MODE === "B") {
        run("npm publish --tag beta");
    } else {
        run("npm publish");
    }
}

// ----------------- 执行流程 -----------------
publishRelease();
publishBeta();

console.log("\n🎉 发布完成！");
