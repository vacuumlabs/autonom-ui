import fs from "fs";

const DEPLOYMENT_FILE_PATH = "/Users/goktug/Desktop/deneme/autonom/contracts/deployments/local/l2.json";
const OUTPUT_FILE = "./src/utils/autonom/output/l2.js";

// helper function to safely extract nested values
function getSafeValue(obj, keys, defaultValue = "MISSING_ADDRESS") {
    return keys.reduce((acc, key) => (acc && acc[key] ? acc[key] : defaultValue), obj);
}

try {
    if (!fs.existsSync(DEPLOYMENT_FILE_PATH)) {
        throw new Error(`Deployment file not found at ${DEPLOYMENT_FILE_PATH}`);
    }

    const rawData = fs.readFileSync(DEPLOYMENT_FILE_PATH, "utf8");
    let data;
    try {
        data = JSON.parse(rawData);
    } catch (jsonError) {
        throw new Error("Invalid JSON format in deployment file.");
    }

    if (!data.arbitrum || !data.arbitrum.dexes || !data.arbitrum.dexes.cap) {
        throw new Error("Missing expected structure in deployment JSON.");
    }

    const contracts = {
        dexes: {
            cap: {
                router: getSafeValue(data, ["arbitrum", "dexes", "cap", "router"]),
                token: {
                    usdc: getSafeValue(data, ["arbitrum", "dexes", "cap", "token", "usdc"]),
                    cap: getSafeValue(data, ["arbitrum", "dexes", "cap", "token", "cap"])
                }
            }
        }
    };

    // check for missing addresses and log warnings
    Object.entries(contracts.dexes.cap).forEach(([key, value]) => {
        if (typeof value === "object") {
            Object.entries(value).forEach(([subKey, subValue]) => {
                if (subValue === "MISSING_ADDRESS") {
                    console.warn(`${key}.${subKey} address is missing!`);
                }
            });
        } else if (value === "MISSING_ADDRESS") {
            console.warn(`${key} address is missing!`);
        }
    });

    fs.writeFileSync(
        OUTPUT_FILE,
        `export const CONTRACT_ADDRESSES = ${JSON.stringify(contracts, null, 2)};`
    );

    console.log(`Contracts file successfully generated at ${OUTPUT_FILE}`);
} catch (error) {
    console.error(error.message);
    console.error("FE cannot run without valid contract addresses. Please fix the deployment JSON.");
    process.exit(1);
}
