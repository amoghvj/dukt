// Script to test DuktProvider transaction interception
// Run with: npx hardhat run scripts/test-transactions.js
// No contracts needed - just ETH transfers!

async function main() {
    console.log("Starting Dukt Provider Test...\n");

    // Get signers (accounts funded by Hardhat)
    const [deployer, recipient, third] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Recipient:", recipient.address);

    // Test 1: Simple ETH transfer
    console.log("\n--- Test 1: ETH Transfer ---");
    const tx1 = await deployer.sendTransaction({
        to: recipient.address,
        value: hre.ethers.parseEther("1.0"),
    });
    await tx1.wait();
    console.log("Sent 1 ETH, tx hash:", tx1.hash);

    // Test 2: Another ETH transfer
    console.log("\n--- Test 2: Another ETH Transfer ---");
    const tx2 = await deployer.sendTransaction({
        to: third.address,
        value: hre.ethers.parseEther("0.5"),
    });
    await tx2.wait();
    console.log("Sent 0.5 ETH, tx hash:", tx2.hash);

    // Test 3: Transfer back
    console.log("\n--- Test 3: Transfer Back ---");
    const tx3 = await recipient.sendTransaction({
        to: deployer.address,
        value: hre.ethers.parseEther("0.25"),
    });
    await tx3.wait();
    console.log("Sent 0.25 ETH back, tx hash:", tx3.hash);

    console.log("\nAll tests completed! Look for 'Dukt intercepted' messages above.");
}

main().catch(console.error);
