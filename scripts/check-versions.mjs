import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readPackageVersion() {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  return String(pkg.version);
}

function readTauriVersion() {
  const conf = JSON.parse(readFileSync(join(root, "src-tauri/tauri.conf.json"), "utf8"));
  return String(conf.version);
}

function readCargoVersion() {
  const cargo = readFileSync(join(root, "src-tauri/Cargo.toml"), "utf8");
  const match = cargo.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) {
    throw new Error("Could not read version from src-tauri/Cargo.toml");
  }
  return match[1];
}

const packageVersion = readPackageVersion();
const tauriVersion = readTauriVersion();
const cargoVersion = readCargoVersion();

if (packageVersion !== tauriVersion || packageVersion !== cargoVersion) {
  console.error("Version mismatch:");
  console.error(`  package.json          ${packageVersion}`);
  console.error(`  src-tauri/tauri.conf.json ${tauriVersion}`);
  console.error(`  src-tauri/Cargo.toml  ${cargoVersion}`);
  process.exit(1);
}

console.log(`Versions match: ${packageVersion}`);
