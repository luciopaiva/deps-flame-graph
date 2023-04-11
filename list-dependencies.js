
const fs = require('fs');
const path = require('path');

const sizesByDir = new Map();
const dependencyByName = new Map();

function calculateSize(dir) {
    if (sizesByDir.has(dir)) {
        return sizesByDir.get(dir);
    }
    const size = calculateSizeIter(dir);
    sizesByDir.set(dir, size);
    return size;
}

function calculateSizeIter(dir) {
    const stat = fs.statSync(dir);
    if (stat.isFile()) {
        return stat.size;
    } else if (stat.isDirectory()) {
        const subSizes = fs.readdirSync(dir)
            .map(file => calculateSizeIter(path.join(dir, file)));
        return subSizes.reduce((sum, size) => sum + size, 0);
    } else {
        return 0;
    }
}

function processDependency(nodeModulesDir, depName) {
    if (dependencyByName.has(depName)) {
        return dependencyByName.get(depName);
    }
    const dependency = processDependencyIter(nodeModulesDir, depName);
    dependencyByName.set(depName, dependency);
    return dependency;
}

function processDependencyIter(nodeModulesDir, depName) {
    const subDirPath = path.join(nodeModulesDir, depName);
    let size = calculateSize(subDirPath);
    let dependencies = [];

    const packageJsonPath = path.join(nodeModulesDir, depName, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.dependencies) {
            dependencies = Object.keys(packageJson.dependencies).map(dep => {
                return processDependency(nodeModulesDir, dep);
            });
        }
    }

    size += dependencies.reduce((prev, cur) => {
        const depName = cur.name;
        const subDirPath = path.join(nodeModulesDir, depName);
        return prev + calculateSize(subDirPath);
    }, 0);

    return {
        name: depName,
        value: size,
        children: dependencies,
    };
}

function listDependencies(dir) {
    const nodeModulesDir = path.join(dir, 'node_modules');
    if (!fs.existsSync(nodeModulesDir)) {
        return {};
    }

    let dependencies = [];

    const packageJsonFileName = path.join(dir, "package.json");
    if (fs.existsSync(packageJsonFileName)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonFileName, 'utf8'));
        if (packageJson.dependencies) {
            dependencies = Object.keys(packageJson.dependencies).map(dep => processDependency(nodeModulesDir, dep));
        }
    }

    return {
        name: "root",
        value: 0,
        children: dependencies,
    };
}

const folder = process.argv[2];

const deps = listDependencies(folder);

fs.writeFileSync("output.json", JSON.stringify(deps));
