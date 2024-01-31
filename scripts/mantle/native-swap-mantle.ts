const { ethers } = require("hardhat");
import VaultABI from "../../artifacts/contracts/RangeProtocolVault.sol/RangeProtocolVault.json";
import ZapperMantleABI from "../../artifacts/contracts/ZapperMantle.sol/ZapperMantle.json"
import { IERC20 } from "../typechain";
import { BigNumber, errors } from "ethers";
import { network } from "hardhat";
import Web3 from "web3"
import { Network } from "@ethersproject/networks";

const fs = require('fs');
async function main() {

    const WETH_ABI = [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [], "name": "DOMAIN_SEPARATOR", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "bridgeBurn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "bridgeMint", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" }], "name": "decreaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "deposit", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "depositTo", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" }], "name": "increaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "_name", "type": "string" }, { "internalType": "string", "name": "_symbol", "type": "string" }, { "internalType": "uint8", "name": "_decimals", "type": "uint8" }, { "internalType": "address", "name": "_l2Gateway", "type": "address" }, { "internalType": "address", "name": "_l1Address", "type": "address" }], "name": "initialize", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "l1Address", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "l2Gateway", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "nonces", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "permit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_value", "type": "uint256" }, { "internalType": "bytes", "name": "_data", "type": "bytes" }], "name": "transferAndCall", "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "withdrawTo", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "stateMutability": "payable", "type": "receive" }]
    const [signer] = await ethers.getSigners()
    console.log(signer.address)
    const PANCAKE_V3_FACTORY = "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865";

    const WMNT = "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8"
    const USDT = "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE"
    const WETH = "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111"
    //WMNT-WETH
    const VAULT = "0xC7C0338811A8C0aFb725cfd9c8C0C187B6A535E3"
    const POOL = "0x0d7c4b40018969f81750d0a164c3839a77353EFB"
    const managerAddress = "0x551938d6F6c5448Ddb084bd614cf9b9DEBd50eCA"; // To be updated.
    const NATIVE_URL = "https://newapi.native.org/v1/firm-quote"

    // const fork: Network = {
    //     name: 'hardhat',
    //     chainId: 1337,
    //     _defaultProvider: (providers) => new providers.JsonRpcProvider('http://127.0.0.1:8545/')
    // }

    // // import those networks where ever you want to use it with getDefaultProvider
    // let provider = ethers.getDefaultProvider(fork);
    // console.log(network.provider.);
    // await network.provider.sendAsync({
    // 	jsonrpc: "2.0",
    // 	id: 1,
    // 	method: "anvil_setBalance",
    // 	params: [
    // 		"0xe79c2d0c6213142049349605E5ba532d15B143cA",
    // 		"0x100000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    // 	]
    // }, (err, data) => {
    // 	console.log(err, data)
    // });
    // await ethers.provider.send("anvil_setBalance", [
    // 	"0xe79c2d0c6213142049349605E5ba532d15B143cA",
    // 	"0x100000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    //   ]);

    // await signer2.sendTransaction({
    // 	to: managerAddress,
    // 	value: (await ethers.provider.getBalance(signer.address))
    // 		.sub(ethers.utils.parseEther("1"))
    // })

    //prepare quote params 
    //lets do ETH -> USDC.e 
    const params = {
        "chain": "arbitrum",
        "token_in": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        "token_out": "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
        "amount": 1.66,
        "slippage": 20,
        "from_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "excluded_sources": "openOcean",
        "expiry_time": 120

    }

    //const multicallAddress= '0x15D34A093A49510CA0a2C591c8D7d62CeCa123c1'
    const zapperAddress = '0xDC0197D97cc0cf717cD1c288ed0D6672D74a7b0e'

    const response = await fetch(`https://newapi.native.org/v1/firm-quote?chain=mantle&token_in=${WMNT}&token_out=${WETH}&amount=1.66&from_address=${zapperAddress}&slippage=20&excluded_sources=openOcean`,
        { headers: { 'apiKey': 'd708276b8d2d5633bda3d6ad30836b056c94fe70' } })
        .then(response => response.json())

    await console.log(response)
    const zapperCtx = new ethers.Contract(zapperAddress, ZapperMantleABI.abi, signer)
    // console.log(multicallCtx)    
    const vaultCtx = new ethers.Contract(VAULT, VaultABI.abi, signer)
    const coder = ethers.utils.defaultAbiCoder

    //since token0 is wstETH and token1 is now WETH
    const encodedData = coder.encode(["(address,address,address,address,bool,uint256,string,bytes)"],
        [[
            response['txRequest']['target'],
            WMNT,
            WETH,
            VAULT,
            true,
            ethers.utils.parseEther("1.66"),
            "mint(uint256,uint256[2])",
            response['txRequest']['calldata']]])
    console.log(encodedData)
    // const swap = await zapperCtx.zapInBaseIzumi(encodedData, { value: ethers.utils.parseEther("3.32"), gasLimit: 5000000 })

    const lpAmount = await vaultCtx.balanceOf(signer.address)
    const formattedLpAmount = await (ethers.utils.formatEther(lpAmount))
    console.log(BigNumber.from(lpAmount))
    const amounts = await vaultCtx.getUnderlyingBalancesByShare(lpAmount)
    const parseAmount = ethers.utils.formatEther(amounts[1])
    console.log(parseAmount)
    console.log(BigNumber.from(amounts[1]))
    console.log(amounts)

    // //amount should be amounts in token we want to swap. 
    const swapRemoveUrl = `https://newapi.native.org/v1/firm-quote?chain=mantle&token_in=${WETH}&token_out=${WMNT}&amount=${parseAmount*0.9995}&from_address=${zapperAddress}&slippage=20&excluded_sources=openOcean`

    //// const approve = await vaultCtx.approve(zapperCtx.address, lpAmount)
    //// const approvedAmount = await vaultCtx.allowance(signer.address, zapperCtx.address)

    const response2 = await fetch(swapRemoveUrl,
        { headers: { 'apiKey': 'd708276b8d2d5633bda3d6ad30836b056c94fe70' } })
        .then(response2 => response2.json())
        console.log(response2)
    const data = response2['txRequest']['calldata']
    const functionSelector = data.slice(0,10)
    const functionCalldata = '0x' + data.slice(10)
    console.log('Sliced Hex String:', data.slice(0,10));
    console.log('Sliced Hex String:', '0x' + data.slice(10));
    console.log(ethers.utils.arrayify(functionCalldata))
    const jsonArray = Array.from(ethers.utils.arrayify(functionCalldata));

    // Write the array to a JSON file
    fs.writeFileSync('output.json', JSON.stringify(jsonArray, null, 2));

    // Extract the first 10 bits
    // Extract the first 10 bits


    const encodedData2 = coder.encode(["(address,address,address,address,bool,uint256,string,bytes4,bytes)"],
        [[
            response2['txRequest']['target'],
            WMNT,
            WETH,
            VAULT,
            false,
            ethers.utils.parseEther(formattedLpAmount),
            "burn(uint256,uint256[2])",
            functionSelector,
            functionCalldata
            ]])
            console.log("data")
            console.log(encodedData2);
    //,{gasLimit: 5000000}
    //const swap2 = await zapperCtx.zapOutBase(encodedData2)
}



// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

//anvil --fork-url https://bsc.publicnode.com