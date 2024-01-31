const { ethers } = require("hardhat");
const { getInitializeData } = require("../test/common");
import VaultABI from "../artifacts/contracts/RangeProtocolVault.sol/RangeProtocolVault.json";
import MulticallABI from "../artifacts/contracts/MulticallSwapAdd.sol/MulticallSwapAdd.json";
import { IERC20 } from "../typechain";
import { BigNumber, errors } from "ethers";
import { network } from "hardhat";
import Web3 from "web3"
import { Network } from "@ethersproject/networks";


async function main() {

    const WETH_ABI = [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [], "name": "DOMAIN_SEPARATOR", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "bridgeBurn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "bridgeMint", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" }], "name": "decreaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "deposit", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "depositTo", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" }], "name": "increaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "_name", "type": "string" }, { "internalType": "string", "name": "_symbol", "type": "string" }, { "internalType": "uint8", "name": "_decimals", "type": "uint8" }, { "internalType": "address", "name": "_l2Gateway", "type": "address" }, { "internalType": "address", "name": "_l1Address", "type": "address" }], "name": "initialize", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "l1Address", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "l2Gateway", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "nonces", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "permit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_value", "type": "uint256" }, { "internalType": "bytes", "name": "_data", "type": "bytes" }], "name": "transferAndCall", "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "withdrawTo", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "stateMutability": "payable", "type": "receive" }]
    const [signer] = await ethers.getSigners()
    console.log(signer.address)
    const PANCAKE_V3_FACTORY = "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865";
    const WETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
    const ARB = "0x912CE59144191C1204E64559FE8253a0e49E6548"
    const VAULT = "0xB65Dc1b52827c1C1d743E3ddd62fF4B7998Eb3AA"
    const POOL = "0x0d7c4b40018969f81750d0a164c3839a77353EFB"
    const managerAddress = "0x551938d6F6c5448Ddb084bd614cf9b9DEBd50eCA"; // To be updated.
    const NATIVE_URL = "https://newapi.native.org/v1/firm-quote"
    console.log(ethers.provider)

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


    const token0 = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
    const token1 = "0x912CE59144191C1204E64559FE8253a0e49E6548";
    const fee = 500; // To be updated.
    const name = "Test Token"; // To be updated.
    const symbol = "TT"; // To be updated.



    // await signer2.sendTransaction({
    // 	to: managerAddress,
    // 	value: (await ethers.provider.getBalance(signer.address))
    // 		.sub(ethers.utils.parseEther("1"))
    // })
    const RANGE_FACTORY = '0x9A49eCA159055c3D316AF0E6ebe9EAcE881EACFE'
    const RANGE_VAULT = '0x537c386B65f236601f18A3070B49E066D18E6a87'

    //prepare quote params 
    //lets do ETH -> USDC.e 
    const params = {
        "chain": "arbitrum",
        "token_in": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        "token_out": "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
        "amount": 0.00042,
        "slippage": 20,
        "from_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "excluded_sources": "openOcean",
        "expiry_time": 120

    }

    const response = await fetch("https://newapi.native.org/v1/firm-quote?chain=arbitrum&token_in=0x82aF49447D8a07e3bd95BD0d56f35241523fBab1&token_out=0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8&amount=0.00042&from_address=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266&slippage=20",
        { headers: { 'apiKey': 'd708276b8d2d5633bda3d6ad30836b056c94fe70' } })
        .then(response => response.json())

    await console.log(response)
    const Multicall = await ethers.getContractFactory("MulticallSwapAdd")
    const multicall = await Multicall.connect(signer).deploy(WETH)
    console.log(signer.address)
    console.log(multicall.address)
    // const multicallCtx = new ethers.Contract(await multicall.address, MulticallABI.abi, signer)
    // console.log(multicallCtx)


    //do encoding of data here
    // address target,
    // address token0,
    // address token1,
    // address vault,
    // bool zeroForOne,
    // uint256 amount,
    // bytes memory swapData
    // const coder = ethers.utils.defaultAbiCoder
    // // const coder = AbiCoder.defaultAbiCoder

    // // address target;
    // // address token0;
    // // address token1;
    // // address vault;
    // // bool zeroForOne;
    // // uint256 amount;
    // // string mintSignature;
    // // bytes callData;
    // const encodedData = coder.encode(["(address,address,address,address,bool,uint256,string,bytes)"],
    //     [[
    //     response['txRequest']['target'],
    //     WETH, 
    //     ARB, 
    //     VAULT,
    //     true,
    //     ethers.utils.parseEther("0.00042"),
    //     "mint(uint256)",
    //     response['calldata']]])

    // const swap = await multicallCtx.swapAddBase(encodedData, { value: ethers.utils.parseEther("0.00042") })
    // console.log(swap)
}



// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

//anvil --fork-url https://bsc.publicnode.com