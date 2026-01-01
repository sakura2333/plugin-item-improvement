#!/usr/bin/env node
// 只发布 Beta    node publish.js --beta
// 只发布正式版    node publish.js --release
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
    return execSync(cmd, { stdio: "inherit" });
}

function readPackageJson() {
    return JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
}

function writePackageJson(pkg) {
    fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2), "utf8");
}

// ----------------- 检查 Git 工作区 -----------------
function checkClean() {
    const status = execSync("git status --porcelain").toString().trim();
    if (status) {
        console.error("❌ Git 工作区不干净，请提交或 stash 后再发布！");
        process.exit(1);
    }
}

// ----------------- 获取主分支名 -----------------
function getMainBranch() {
    try {
        const branch = execSync("git symbolic-ref refs/remotes/origin/HEAD")
            .toString()
            .trim()
            .split("/")
            .pop();
        return branch;
    } catch {
        // fallback
        return "main";
    }
}

// ----------------- 正式版发布 -----------------
function publishRelease(mainBranch) {
    console.log("\n=== 发布正式版 ===");
    run(`git checkout ${mainBranch}`);
    run("git pull");
    run("npm version patch"); // 或 minor/major

    if (MODE === "A") {
        const pkg = readPackageJson();
        pkg.name = "poi-plugin-item-improvement2";
        writePackageJson(pkg);
    }

    run("npm publish");
}

// ----------------- Beta 版发布 -----------------
function publishBeta(mainBranch) {
    console.log("\n=== 发布 Beta 版 ===");
    run(`git checkout ${mainBranch}`);
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
function main() {
    checkClean();

    const args = process.argv.slice(2);
    const isBetaOnly = args.includes("--beta");
    const isReleaseOnly = args.includes("--release");

    const mainBranch = getMainBranch();
    console.log(`✅ 检测到主分支: ${mainBranch}`);

    if (!isBetaOnly && !isReleaseOnly) {
        publishRelease(mainBranch);
        publishBeta(mainBranch);
    } else if (isBetaOnly) {
        publishBeta(mainBranch);
    } else if (isReleaseOnly) {
        publishRelease(mainBranch);
    }

    console.log("\n🎉 发布完成！");
}

main();
