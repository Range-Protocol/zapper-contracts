const { ethers } = require("hardhat");
import VaultABI from "../../artifacts/contracts/RangeProtocolVault.sol/RangeProtocolVault.json";
import ZapperMantleABI from "../../artifacts/contracts/ZapperMantle.sol/ZapperMantle.json";
import IERC20UpgradeableABI from "../../artifacts/@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol/IERC20Upgradeable.json";
import { IERC20 } from "../typechain";
import { BigNumber, errors } from "ethers";
import { network } from "hardhat";
import Web3 from "web3"
import { Network } from "@ethersproject/networks";


async function main() {

    const [signer] = await ethers.getSigners()
    console.log(signer.address)
    const WMNT = "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8"
    const USDT = "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE"
    const WETH = "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111"
    //WMNT-WETH
    const VAULT = "0xC7C0338811A8C0aFb725cfd9c8C0C187B6A535E3"
    //weth-wsteth 
    const VAULT_2 = "0x7548a71f63a2402413E9647798084E8802C288c2"

    const POOL = "0x0d7c4b40018969f81750d0a164c3839a77353EFB"
    const managerAddress = "0x551938d6F6c5448Ddb084bd614cf9b9DEBd50eCA"; // To be updated.
    console.log(ethers.provider)
    const zapperAddress= '0x3723E5f7e574315DD75ef758C20203769444919f'

    const response = await fetch(`https://newapi.native.org/v1/firm-quote?chain=mantle&token_in=${WMNT}&token_out=${WETH}&amount=0.00042&from_address=${zapperAddress}&slippage=20&excluded_sources=openOcean`,
        { headers: { 'apiKey': 'd708276b8d2d5633bda3d6ad30836b056c94fe70' } })
        .then(response => response.json())
    console.log(response)
    const zapperCtx = new ethers.Contract(zapperAddress, ZapperMantleABI.abi, signer)
    // console.log(multicallCtx)
    const vaultCtx = new ethers.Contract(VAULT, VaultABI.abi, signer)
    const coder = ethers.utils.defaultAbiCoder
    // do encoding of data here
    // address target,
    // address token0,
    // address token1,
    // address vault,
    // bool zeroForOne,
    // uint256 amount,
    // bytes memory swapData

    // //since token0 is wstETH and token1 is now WETH
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
    const token0Ctx = new ethers.Contract(WMNT, IERC20UpgradeableABI.abi, signer)
    const token1Ctx = new ethers.Contract(WETH, IERC20UpgradeableABI.abi, signer)

    const mintApprove = await token0Ctx.approve(zapperAddress, ethers.utils.parseEther("3.32"))
    const approvedAmountMint = await token0Ctx.allowance(signer.address, zapperCtx.address)
    console.log(BigNumber.from(approvedAmountMint))
    const swap = await zapperCtx.zapInIzumi(encodedData, ethers.utils.parseEther("3.32"),{gasLimit: 5000000 })
    console.log(swap)
    
    const lpAmount = await vaultCtx.balanceOf(signer.address)
    const formattedLpAmount = await ethers.utils.formatEther(lpAmount)
    console.log(BigNumber.from(lpAmount))
    const amounts = await vaultCtx.getUnderlyingBalancesByShare(lpAmount)
    const parseAmount = ethers.utils.formatEther(amounts[1].mul(BigNumber.from(9999)).div(BigNumber.from(10000)))
    console.log(parseAmount)
    console.log(BigNumber.from(amounts[1]))
    console.log(amounts)

    //amount should be amounts in token we want to swap. 
    const amount2 = ethers.utils.parseEther("1")
    const swapRemoveUrl = `https://newapi.native.org/v1/firm-quote?chain=mantle&token_in=${WETH}&token_out=${WMNT}&amount=${parseAmount}&from_address=${zapperAddress}&slippage=20&excluded_sources=openOcean`
    
    const approve = await vaultCtx.approve(zapperCtx.address, lpAmount)
    const approvedAmount = await vaultCtx.allowance(signer.address, zapperCtx.address)

    const response2 = await fetch(swapRemoveUrl,
        { headers: { 'apiKey': 'd708276b8d2d5633bda3d6ad30836b056c94fe70' } })
        .then(response2 => response2.json())
        console.log(response2)
    const data = response2['txRequest']['calldata']
    const functionSelector = data.slice(0,10)
    const functionCalldata = '0x' + data.slice(10)
    console.log('Sliced Hex String:', data.slice(0,10));
    console.log('Sliced Hex String:', data.slice(10));
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

            console.log(encodedData2);
    const swap2 = await zapperCtx.zapOut(encodedData2, {gasLimit: 5000000})

    // do encoding of data here
    // address target,
    // address token0,
    // address token1,
    // address vault,
    // bool zeroForOne,
    // uint256 amount,
    // bytes memory swapData

    //IN ARB SWAP OUT WETH

    // const response = await fetch(`https://newapi.native.org/v1/firm-quote?chain=arbitrum&token_in=${ARB}&token_out=${WETH}&amount=0.2&from_address=${multicallAddress}&slippage=20&excluded_sources=openOcean`,
    //     { headers: { 'apiKey': 'd708276b8d2d5633bda3d6ad30836b056c94fe70' } })
    //     .then(response => response.json())
    // console.log(response)

    // // //since token0 is wstETH and token1 is now WETH
    // const encodedData = coder.encode(["(address,address,address,address,bool,uint256,string,bytes)"],
    //     [[
    //         response['txRequest']['target'],
    //         WETH,
    //         ARB,
    //         VAULT,
    //         false,
    //         ethers.utils.parseEther("0.2"),
    //         "mint(uint256)",
    //         response['txRequest']['calldata']]])
    // const token0Ctx = new ethers.Contract(WETH, IERC20UpgradeableABI.abi, signer)
    // const token1Ctx = new ethers.Contract(ARB, IERC20UpgradeableABI.abi, signer)

    // const mintApprove = await token1Ctx.approve(multicallAddress, ethers.utils.parseEther("0.4"))
    // const swap = await multicallCtx.swapAdd(encodedData, ethers.utils.parseEther("0.4"),{gasLimit: 5000000 })
    // console.log(swap)
    
    // const lpAmount = await vaultCtx.balanceOf(signer.address)
    // const formattedLpAmount = await ethers.utils.formatEther(lpAmount)
    // console.log(BigNumber.from(lpAmount))
    // const amounts = await vaultCtx.getUnderlyingBalancesByShare(lpAmount)
    // const parseAmount = ethers.utils.formatEther(amounts[0].mul(BigNumber.from(9999)).div(BigNumber.from(10000)))
    // console.log(parseAmount)
    // console.log(BigNumber.from(amounts[0]))
    // console.log(amounts)

    // //amount should be amounts in token we want to swap. 
    // const amount2 = ethers.utils.parseEther("1")
    // const swapRemoveUrl = `https://newapi.native.org/v1/firm-quote?chain=arbitrum&token_in=${WETH}&token_out=${ARB}&amount=${parseAmount}&from_address=${multicallAddress}&slippage=20&excluded_sources=openOcean`
    
    // const response2 = await fetch(swapRemoveUrl,
    // { headers: { 'apiKey': 'd708276b8d2d5633bda3d6ad30836b056c94fe70' } })
    // .then(response2 => response2.json())
    // console.log(response2)


    // const encodedData2 = coder.encode(["(address,address,address,address,bool,uint256,string,bytes)"],
    //     [[
    //         response2['txRequest']['target'],
    //         WETH,
    //         ARB,
    //         VAULT,
    //         true,
    //         ethers.utils.parseEther(formattedLpAmount),
    //         "burn(uint256)",
    //         response2['txRequest']['calldata']]])
    
    // const approve = await vaultCtx.approve(multicallCtx.address, lpAmount)
    // const approvedAmount = await vaultCtx.allowance(signer.address, multicallCtx.address)
    // console.log(approvedAmount)
    // const swap2 = await multicallCtx.swapRemove(encodedData2, {gasLimit: 5000000})
}



// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

//anvil --fork-url https://bsc.publicnode.com