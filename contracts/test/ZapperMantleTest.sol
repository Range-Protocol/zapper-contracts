//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {RangeProtocolVault} from "../RangeProtocolVault.sol";
import {WMANTLE} from "../base/WMANTLE.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeCastUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IRangeProtocolVault} from "../interfaces/IRangeProtocolVault.sol";
import {IRangeProtocolVaultIzumi} from "../interfaces/IRangeProtocolVaultIzumi.sol";
import {IZapper} from "../interfaces/IZapper.sol";
import "hardhat/console.sol";

contract ZapperMantleTest is IZapper{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    //diff EVM chain diff wrapped token address.
    WMANTLE wrapped;
    RangeProtocolVault vaultCtx;

    constructor(address payable wrappedTokenAddress) public {
        wrapped = WMANTLE(wrappedTokenAddress);
    }

    //events
    event SwapAdded();
    event SwapRemoved();
    event SwapAddedBase();
    event SwapRemovedBase();

    //allow base token swap add.

    struct ZapInData {
        address target;
        address token0;
        address token1;
        address vault;
        bool zeroForOne;
        uint256 amount;
        string signature;
        bytes callData;
    }

    struct ZapOutData{
        address target;
        address token0;
        address token1;
        address vault;
        bool zeroForOne;
        uint256 amount;
        string signature;
        bytes4 selector; 
        bytes callData;
    }
    struct ExactInputParams {
        bytes orders;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        WidgetFee widgetFee;
        bytes widgetFeeSignature;
        bytes[] fallbackSwapDataArray;
    }

    struct WidgetFee {
        address signer;
        address feeRecipient;
        uint256 feeRate;
    }

    //Swap and add using base network currency.
    function zapInBase(bytes calldata data) external payable override {
        //1. Decoding bytes to required data
        //target: native target contract
        //token0: token0 that we are using for swap
        //token1: token1 that we are using for swap.
        //vault: which vault are we interacting with
        //zeroForOne: direction of swap
        //amount: amount used in swap
        //signature: to handle different signatures in different implementations. 
        //callData: generated from Native

        ZapInData memory zapData = abi.decode(data, (ZapInData));

        //2. Wrap ETH to WETH
        //deposit using multicall ctx
        wrapped.deposit{value: msg.value}();
        //3. swap on Native.
        // if swap 0->1, approve 0 to Native.
        console.log(zapData.token0);
        console.log(zapData.token1);

        console.log(IERC20Upgradeable(zapData.token0).balanceOf(address(this)));
        if (zapData.zeroForOne) {
            // console.log(swapData.zeroForOne);
            IERC20Upgradeable(zapData.token0).approve(zapData.target, zapData.amount);
        } else {
            IERC20Upgradeable(zapData.token1).approve(zapData.target, zapData.amount);
        }

        uint256 balance0Before = IERC20Upgradeable(zapData.token0).balanceOf(address(this));
        uint256 balance1Before = IERC20Upgradeable(zapData.token1).balanceOf(address(this));
        // Address.functionCall(target,swapData);
        console.log(balance0Before);
        console.log(balance1Before);
        // (bool successSwap, bytes memory swapReturn) = (swapData.target).call(swapData.callData);
        Address.functionCall(zapData.target, zapData.callData);
        console.log("swap ok");
        uint256 balance0After = IERC20Upgradeable(zapData.token0).balanceOf(address(this));
        uint256 balance1After = IERC20Upgradeable(zapData.token1).balanceOf(address(this));
        console.log(balance0After);
        console.log(balance1After);
        // uint256 balance0After = IERC20Upgradeable(token0).balanceOf(address(this));;;
        // uint256 balance1After = IERC20Upgradeable(token1).balanceOf(address(this));
        uint256 swapped0;
        uint256 swapped1;
        if (zapData.zeroForOne) {
            swapped0 = balance0Before - balance0After;
            swapped1 = balance1After - balance1Before;
        } else {
            swapped0 = balance0After - balance0Before;
            swapped1 = balance1Before - balance1After;
        }

        console.log(swapped0);
        console.log(swapped1);

        //4. approve vault for mint
        //amount 0 for mint : the eth we had initially - the amount that we used for swapped + residual amounts not utilised in swap
        //amount 1 for mint: swapped amount for 1.
        uint256 amount0;
        uint256 amount1;
        uint256 mintAmount;

        if (zapData.zeroForOne) {
            console.log(msg.value);
            console.log(zapData.amount);
            console.log(swapped0);
            console.log(zapData.amount - swapped0);
            (amount0, amount1, mintAmount) = IRangeProtocolVault(zapData.vault).getMintAmounts(
                msg.value - swapped0,
                swapped1
            );
        } else {
            console.log(msg.value);
            console.log(zapData.amount);
            console.log(swapped1);
            console.log(zapData.amount - swapped1);

            (amount0, amount1, mintAmount) = IRangeProtocolVault(zapData.vault).getMintAmounts(
                swapped0,
                msg.value  - swapped1
            );
        }
        console.log(amount0);
        console.log(amount1);

        IERC20Upgradeable(zapData.token0).approve(address(zapData.vault), amount0);
        IERC20Upgradeable(zapData.token1).approve(address(zapData.vault), amount1);
        //5. mint position
        bytes memory mintData;
        if (
            keccak256(abi.encodePacked(zapData.signature)) ==
            keccak256(abi.encodePacked("mint(uint256)"))
        ) {
            mintData = abi.encodeWithSignature("mint(uint256)", mintAmount);
        } else {
            mintData = abi.encodeWithSignature(
                "mint(uint256,uint256[2])",
                mintAmount,
                [amount0, amount1]
            );
        }

        //5 call mint on Vault
        Address.functionCall(address(zapData.vault), mintData);

        //6. Transfer unused WETH
        //so there should be some amounts that are not transferred as well.
        //essentially whats need to be transferred back should be
        //initial WETH - minted WETH unless
        IERC20Upgradeable(zapData.token0).transfer(msg.sender, address(this).balance);
        IERC20Upgradeable(zapData.token1).transfer(msg.sender, address(this).balance);

        //7. Transfer LP token back to user if not reverted.
        IERC20Upgradeable(zapData.vault).transfer(msg.sender, mintAmount);
    }


    //Swap and add using base network currency.
    function zapInBaseIzumi(bytes calldata data) external payable override {
        //1. Decoding bytes to required data
        //target: native target contract
        //token0: token0 that we are using for swap
        //token1: token1 that we are using for swap.
        //vault: which vault are we interacting with
        //zeroForOne: direction of swap
        //amount: amount used in swap
        //swapData: generated from Native

        ZapInData memory zapData = abi.decode(data, (ZapInData));

        //2. Wrap ETH to WETH
        // console.log(msg.value);
        // console.log(swapData.callData);
        //deposit using multicall ctx
        wrapped.deposit{value: msg.value}();
        // console.log(swapData.target);
        //3. swap on Native.
        // if swap 0->1, approve 0 to Native.
        console.log(zapData.token0);
        console.log(zapData.token1);

        console.log(IERC20Upgradeable(zapData.token0).balanceOf(address(this)));
        if (zapData.zeroForOne) {
            // console.log(swapData.zeroForOne);
            IERC20Upgradeable(zapData.token0).approve(zapData.target, zapData.amount);
        } else {
            IERC20Upgradeable(zapData.token1).approve(zapData.target, zapData.amount);
        }
        uint256 balance0Before = IERC20Upgradeable(zapData.token0).balanceOf(address(this));
        uint256 balance1Before = IERC20Upgradeable(zapData.token1).balanceOf(address(this));
        console.log(balance0Before);
        console.log(balance1Before);
        Address.functionCall(zapData.target, zapData.callData);
        console.log("swap ok");
        uint256 balance0After = IERC20Upgradeable(zapData.token0).balanceOf(address(this));
        uint256 balance1After = IERC20Upgradeable(zapData.token1).balanceOf(address(this));
        console.log(balance0After);
        console.log(balance1After);
        uint256 swapped0;
        uint256 swapped1;
        if (zapData.zeroForOne) {
            swapped0 = balance0Before - balance0After;
            swapped1 = balance1After - balance1Before;
        } else {
            swapped0 = balance0After - balance0Before;
            swapped1 = balance1Before - balance1After;
        }

        console.log(swapped0);
        console.log(swapped1);

        //4. approve vault for mint
        //amount 0 for mint : the eth we had initially - the amount that we used for swapped + residual amounts not utilised in swap
        //amount 1 for mint: swapped amount for 1.
        uint256 amount0;
        uint256 amount1;
        uint256 mintAmount;

        if (zapData.zeroForOne) {
            console.log(msg.value);
            console.log(zapData.amount);
            console.log(swapped0);
            console.log(zapData.amount - swapped0);
            (amount0, amount1, mintAmount) = IRangeProtocolVaultIzumi(zapData.vault).getMintAmounts(
                uint128(msg.value - swapped0),
                uint128(swapped1)
            );
        } else {
            console.log(msg.value);
            console.log(zapData.amount);
            console.log(swapped1);
            console.log(zapData.amount - swapped1);

            (amount0, amount1, mintAmount) = IRangeProtocolVaultIzumi(zapData.vault).getMintAmounts(
                uint128(swapped0),
                uint128(msg.value - swapped1)
            );
        }
        console.log(amount0);
        console.log(amount1);

        IERC20Upgradeable(zapData.token0).approve(address(zapData.vault), amount0);
        IERC20Upgradeable(zapData.token1).approve(address(zapData.vault), amount1);
        //5. mint position
        bytes memory mintData;
        if (
            keccak256(abi.encodePacked(zapData.signature)) ==
            keccak256(abi.encodePacked("mint(uint256)"))
        ) {
            mintData = abi.encodeWithSignature("mint(uint256)", mintAmount);
        } else {
            mintData = abi.encodeWithSignature(
                "mint(uint256,uint256[2])",
                mintAmount,
                [amount0, amount1]
            );
        }

        //5a. call mint on Vault
        Address.functionCall(address(zapData.vault), mintData);
        //6. Transfer unused WETH
        //so there should be some amounts that are not transferred as well.
        //essentially whats need to be transferred back should be
        //initial WETH - minted WETH unless
        IERC20Upgradeable(zapData.token0).transfer(msg.sender, address(this).balance);
        IERC20Upgradeable(zapData.token1).transfer(msg.sender, address(this).balance);

        //7. Transfer LP token back to user if not reverted.
        IERC20Upgradeable(zapData.vault).transfer(msg.sender, mintAmount);
    }


    function zapIn(bytes calldata data, uint256 initialAmount) external override {
        ZapInData memory zapData = abi.decode(data, (ZapInData));

        //1. Transfer from initial asset
        console.log(zapData.token0);
        console.log(zapData.token1);
        if (zapData.zeroForOne) {
            // console.log(swapData.zeroForOne);
            IERC20Upgradeable(zapData.token0).transferFrom(
                msg.sender,
                address(this),
                initialAmount
            );
            IERC20Upgradeable(zapData.token0).approve(zapData.target, zapData.amount);
        } else {
            IERC20Upgradeable(zapData.token1).transferFrom(
                msg.sender,
                address(this),
                initialAmount
            );
            IERC20Upgradeable(zapData.token1).approve(zapData.target, zapData.amount);
        }
        uint256 balance0Before = IERC20Upgradeable(zapData.token0).balanceOf(address(this));
        uint256 balance1Before = IERC20Upgradeable(zapData.token1).balanceOf(address(this));
        Address.functionCall(zapData.target, zapData.callData);
        console.log("swap ok");
        uint256 balance0After = IERC20Upgradeable(zapData.token0).balanceOf(address(this));
        uint256 balance1After = IERC20Upgradeable(zapData.token1).balanceOf(address(this));
        uint256 swapped0;
        uint256 swapped1;
        if (zapData.zeroForOne) {
            swapped0 = balance0Before - balance0After;
            swapped1 = balance1After - balance1Before;
        } else {
            swapped0 = balance0After - balance0Before;
            swapped1 = balance1Before - balance1After;
        }
        //4. approve vault for mint
        //amount 0 for mint : the eth we had initially - the amount that we used for swapped + residual amounts not utilised in swap
        //amount 1 for mint: swapped amount for 1.
        uint256 amount0;
        uint256 amount1;
        uint256 mintAmount;
        if (zapData.zeroForOne) {
            (amount0, amount1, mintAmount) = IRangeProtocolVault(zapData.vault).getMintAmounts(
                balance0Before  - swapped0,
                swapped1
            );
        } else {
            (amount0, amount1, mintAmount) = IRangeProtocolVault(zapData.vault).getMintAmounts(
                swapped0,
                balance1Before  - swapped1
            );
        }

        IERC20Upgradeable(zapData.token0).approve(address(zapData.vault), amount0);
        IERC20Upgradeable(zapData.token1).approve(address(zapData.vault), amount1);
        //5. mint position
        bytes memory mintData;
        if (
            keccak256(abi.encodePacked(zapData.signature)) ==
            keccak256(abi.encodePacked("mint(uint256)"))
        ) {
            mintData = abi.encodeWithSignature("mint(uint256)", mintAmount);
        } else {
            mintData = abi.encodeWithSignature(
                "mint(uint256,uint256[2])",
                mintAmount,
                [amount0, amount1]
            );
        }
        //5a. call mint on Vault
        Address.functionCall(address(zapData.vault), mintData);

        //6. Transfer unused WETH
        //so there should be some amounts that are not transferred as well.
        //essentially whats need to be transferred back should be
        //initial WETH - minted WETH unless
        IERC20Upgradeable(zapData.token0).transfer(
            msg.sender,
            IERC20Upgradeable(zapData.token0).balanceOf(address(this))
        );
        IERC20Upgradeable(zapData.token1).transfer(
            msg.sender,
            IERC20Upgradeable(zapData.token1).balanceOf(address(this))
        );

        //7. Transfer LP token to user if not reverted.
        IERC20Upgradeable(zapData.vault).transfer(msg.sender, mintAmount);
    }

    //can be any non base token.

    function zapInIzumi(bytes calldata data, uint256 initialAmount) external override {
        ZapInData memory zapData = abi.decode(data, (ZapInData));

        //1. Transfer from initial asset
        console.log(zapData.token0);
        console.log(zapData.token1);
        console.log(IERC20Upgradeable(zapData.token0).allowance(msg.sender, address(this)));
        console.log(initialAmount);
        if (zapData.zeroForOne) {
            // console.log(swapData.zeroForOne);
            console.log("a");
            IERC20Upgradeable(zapData.token0).transferFrom(
                msg.sender,
                address(this),
                initialAmount
            );
            IERC20Upgradeable(zapData.token0).approve(zapData.target, zapData.amount);
        } else {
            console.log("b");
            IERC20Upgradeable(zapData.token1).transferFrom(
                msg.sender,
                address(this),
                initialAmount
            );
            IERC20Upgradeable(zapData.token1).approve(zapData.target, zapData.amount);
        }
        // {
        // console.log(swapData.target);
        uint256 balance0Before = IERC20Upgradeable(zapData.token0).balanceOf(address(this));
        uint256 balance1Before = IERC20Upgradeable(zapData.token1).balanceOf(address(this));
        // console.log(balance0Before);
        // console.log(balance1Before);
        Address.functionCall(zapData.target, zapData.callData);
        console.log("swap ok");
        uint256 balance0After = IERC20Upgradeable(zapData.token0).balanceOf(address(this));
        uint256 balance1After = IERC20Upgradeable(zapData.token1).balanceOf(address(this));
        // uint256 balance0After = IERC20Upgradeable(token0).balanceOf(address(this));;;
        // uint256 balance1After = IERC20Upgradeable(token1).balanceOf(address(this));
        uint256 swapped0;
        uint256 swapped1;
        if (zapData.zeroForOne) {
            swapped0 = balance0Before - balance0After;
            swapped1 = balance1After - balance1Before;
        } else {
            swapped0 = balance0After - balance0Before;
            swapped1 = balance1Before - balance1After;
        }
        // console.log(swapped0);
        // console.log(swapped1);
        //4. approve vault for mint
        //amount 0 for mint : the eth we had initially - the amount that we used for swapped + residual amounts not utilised in swap
        //amount 1 for mint: swapped amount for 1.
        uint256 amount0;
        uint256 amount1;
        uint256 mintAmount;
        if (zapData.zeroForOne) {
            (amount0, amount1, mintAmount) = IRangeProtocolVaultIzumi(zapData.vault).getMintAmounts(
                uint128(balance0Before - swapped0),
                uint128(swapped1)
            );
        } else {
            (amount0, amount1, mintAmount) = IRangeProtocolVaultIzumi(zapData.vault).getMintAmounts(
                uint128(swapped0),
                uint128(balance1Before  - swapped1)
            );
        }

        IERC20Upgradeable(zapData.token0).approve(address(zapData.vault), amount0);
        IERC20Upgradeable(zapData.token1).approve(address(zapData.vault), amount1);
        //5. mint position
        bytes memory mintData;
        if (
            keccak256(abi.encodePacked(zapData.signature)) ==
            keccak256(abi.encodePacked("mint(uint256)"))
        ) {
            mintData = abi.encodeWithSignature("mint(uint256)", mintAmount);
        } else {
            mintData = abi.encodeWithSignature(
                "mint(uint256,uint256[2])",
                mintAmount,
                [amount0, amount1]
            );
        }
        //5a. call mint on Vault
        Address.functionCall(address(zapData.vault), mintData);

        //6. Transfer unused WETH
        //so there should be some amounts that are not transferred as well.
        //essentially whats need to be transferred back should be
        //initial WETH - minted WETH unless
        IERC20Upgradeable(zapData.token0).transfer(
            msg.sender,
            IERC20Upgradeable(zapData.token0).balanceOf(address(this))
        );
        IERC20Upgradeable(zapData.token1).transfer(
            msg.sender,
            IERC20Upgradeable(zapData.token1).balanceOf(address(this))
        );

        //7. Transfer LP token to user if not reverted.
        IERC20Upgradeable(zapData.vault).transfer(msg.sender, mintAmount);
    }

    function zapOutBase(bytes memory data) external override{
        ZapOutData memory zapData = abi.decode(data, (ZapOutData));

        //1. transfer LP token back to multicall contract, requires approval of LP token prior
        IERC20Upgradeable(zapData.vault).transferFrom(msg.sender, address(this), zapData.amount);
        (uint256 burn0, uint256 burn1) = IRangeProtocolVault(zapData.vault)
            .getUnderlyingBalancesByShare(zapData.amount);
        //2. burn
        bytes memory burnData;
        if (
            keccak256(abi.encodePacked(zapData.signature)) ==
            keccak256(abi.encodePacked("burn(uint256)"))
        ) {
            burnData = abi.encodeWithSignature("burn(uint256)", zapData.amount);
        } else {
            burnData = abi.encodeWithSignature(
                "burn(uint256,uint256[2])",
                zapData.amount,
                [(burn0 * 9990)/10000, (burn1 * 9990)/10000]
            );
        }
        Address.functionCall(address(zapData.vault), burnData);
        console.log("burn ok");
        console.log(IERC20Upgradeable(zapData.token0).balanceOf(address(this)));
        console.log(IERC20Upgradeable(zapData.token1).balanceOf(address(this)));
        //3. approve native router
        //Convert base token back to non base token.
        //amount here is LP token.
        ExactInputParams memory nativeData = abi.decode(zapData.callData, (ExactInputParams));
        console.log(nativeData.amountIn);
        console.log((burn0*9990)/10000);
        if (zapData.zeroForOne) {
            ExactInputParams memory updatedStruct = ExactInputParams(
                nativeData.orders,
                nativeData.recipient,
                uint256((burn0*9990)/10000), 
                nativeData.amountOutMinimum, 
                nativeData.widgetFee, 
                nativeData.widgetFeeSignature, 
                nativeData.fallbackSwapDataArray
            );
            //bytes memory newData = abi.encode(updatedStruct);
            //encode into selector
            bytes memory newDataFinal;
            if(zapData.selector == 0xc7cd9748){
                newDataFinal = abi.encodeWithSignature("exactInputSingle((bytes,address,uint256,uint256,(address,address,uint256),bytes,bytes[]))",updatedStruct);
            }    
            else{ 
                bytes memory newDataFinal = abi.encodeWithSignature("exactInput((bytes,address,uint256,uint256,(address,address,uint256),bytes,bytes[]))",updatedStruct);
            }
            console.logBytes(newDataFinal); 
            // bytes memory newDataFinal = abi.encodeWithSignature(
            //     "exactInputSingle",
            //     updated
            // );
            IERC20Upgradeable(zapData.token0).approve(zapData.target, type(uint256).max);
            //4. swap to WMNT
            Address.functionCall(zapData.target, newDataFinal);
            wrapped.withdraw(IERC20Upgradeable(zapData.token1).balanceOf(address(this)));
            // transfer to user MNT
            (msg.sender).call{value: address(this).balance}("");
            //transfer possible residual amounts of other token back to user
            IERC20Upgradeable(zapData.token0).approve(zapData.target, 0);

            IERC20Upgradeable(zapData.token0).transfer(
                msg.sender,
                IERC20Upgradeable(zapData.token1).balanceOf(address(this))
            );
        } else {
            ExactInputParams memory updatedStruct = ExactInputParams(
                nativeData.orders,
                nativeData.recipient,
                uint256((burn0*9990)/10000), 
                nativeData.amountOutMinimum, 
                nativeData.widgetFee, 
                nativeData.widgetFeeSignature, 
                nativeData.fallbackSwapDataArray
            );
            //encode into selector
            bytes memory newDataFinal;
            if(zapData.selector == 0xc7cd9748){
                newDataFinal = abi.encodeWithSignature("exactInputSingle((bytes,address,uint256,uint256,(address,address,uint256),bytes,bytes[]))",updatedStruct);
            }    
            else{ 
                newDataFinal = abi.encodeWithSignature("exactInput((bytes,address,uint256,uint256,(address,address,uint256),bytes,bytes[]))",updatedStruct);
            }
            console.logBytes(newDataFinal); 
            IERC20Upgradeable(zapData.token1).approve(zapData.target, type(uint256).max);
            Address.functionCall(zapData.target, newDataFinal);
            console.log("swap ok");
            console.log(IERC20Upgradeable(zapData.token0).balanceOf(address(this)));
            console.log(IERC20Upgradeable(zapData.token1).balanceOf(address(this)));
            wrapped.withdraw(IERC20Upgradeable(zapData.token0).balanceOf(address(this)));
            //transfer to user MNT
            (msg.sender).call{value: address(this).balance}("");
            //transfer possible residual amounts of other token back to user
            IERC20Upgradeable(zapData.token1).approve(zapData.target, 0);

            IERC20Upgradeable(zapData.token1).transfer(
                msg.sender,
                IERC20Upgradeable(zapData.token1).balanceOf(address(this))
            );
        }
    }

    function zapOut(bytes memory data) external override{
        ZapOutData memory zapData = abi.decode(data, (ZapOutData));

        //1. transfer LP token back to multicall contract, requires approval of LP token prior
        IERC20Upgradeable(zapData.vault).transferFrom(msg.sender, address(this), zapData.amount);

        (uint256 burn0, uint256 burn1) = IRangeProtocolVault(zapData.vault)
            .getUnderlyingBalancesByShare(zapData.amount);
        //2. burn
        bytes memory burnData;
        if (
            keccak256(abi.encodePacked(zapData.signature)) ==
            keccak256(abi.encodePacked("burn(uint256)"))
        ) {
            burnData = abi.encodeWithSignature("burn(uint256)", zapData.amount);
        } else {
            burnData = abi.encodeWithSignature(
                "burn(uint256,uint256[2])",
                zapData.amount,
                [(burn0 * 9990)/10000, (burn1 * 9990)/10000]
            );
        }
        Address.functionCall(address(zapData.vault), burnData);

        //3. approve native router
        //now is native token back to non native token.
        //so in calldata should state accordingly.
        //amount here is LP token.

        ExactInputParams memory nativeData = abi.decode(zapData.callData, (ExactInputParams));
        if (zapData.zeroForOne) {
             //encode into struct
            ExactInputParams memory updatedStruct = ExactInputParams(
                nativeData.orders,
                nativeData.recipient,
                uint256((burn0*9990)/10000), 
                nativeData.amountOutMinimum, 
                nativeData.widgetFee, 
                nativeData.widgetFeeSignature, 
                nativeData.fallbackSwapDataArray
            );
            bytes memory newDataFinal;
            if(zapData.selector == 0xc7cd9748){
                newDataFinal = abi.encodeWithSignature("exactInputSingle((bytes,address,uint256,uint256,(address,address,uint256),bytes,bytes[]))",updatedStruct);
            }    
            else{ 
                bytes memory newDataFinal = abi.encodeWithSignature("exactInput((bytes,address,uint256,uint256,(address,address,uint256),bytes,bytes[]))",updatedStruct);
            }
            console.logBytes(newDataFinal); 
            IERC20Upgradeable(zapData.token0).approve(zapData.target, type(uint256).max);
            //4. swap to WMNT
            Address.functionCall(zapData.target, newDataFinal);
            wrapped.withdraw(IERC20Upgradeable(zapData.token1).balanceOf(address(this)));
            // transfer to user MNT
            (msg.sender).call{value: address(this).balance}("");
            //transfer possible residual amounts of other token back to user
            IERC20Upgradeable(zapData.token0).approve(zapData.target, 0);

        } else {

            //encode into struct
            ExactInputParams memory updatedStruct = ExactInputParams(
                nativeData.orders,
                nativeData.recipient,
                uint256((burn0*9990)/10000), 
                nativeData.amountOutMinimum, 
                nativeData.widgetFee, 
                nativeData.widgetFeeSignature, 
                nativeData.fallbackSwapDataArray
            );
            bytes memory newDataFinal;
            if(zapData.selector == 0xc7cd9748){
                newDataFinal = abi.encodeWithSignature("exactInputSingle((bytes,address,uint256,uint256,(address,address,uint256),bytes,bytes[]))",updatedStruct);
                console.logBytes(newDataFinal); 
            }    
            else{ 
                newDataFinal = abi.encodeWithSignature("exactInput((bytes,address,uint256,uint256,(address,address,uint256),bytes,bytes[]))",updatedStruct);
                console.logBytes(newDataFinal); 
            }
            IERC20Upgradeable(zapData.token1).approve(zapData.target, type(uint256).max);
            Address.functionCall(zapData.target, newDataFinal);
            console.log("swap ok");
            console.log(IERC20Upgradeable(zapData.token0).balanceOf(address(this)));
            console.log(IERC20Upgradeable(zapData.token1).balanceOf(address(this)));
            wrapped.withdraw(IERC20Upgradeable(zapData.token0).balanceOf(address(this)));
            //transfer to user MNT
            (msg.sender).call{value: address(this).balance}("");
            //transfer possible residual amounts of other token back to user
            IERC20Upgradeable(zapData.token1).approve(zapData.target, 0);
        }
        //4. send both token back to user
        IERC20Upgradeable(zapData.token0).transfer(
            msg.sender,
            IERC20Upgradeable(zapData.token0).balanceOf(address(this))
        );
        IERC20Upgradeable(zapData.token1).transfer(
            msg.sender,
            IERC20Upgradeable(zapData.token1).balanceOf(address(this))
        );
    }

    receive() external payable{
    }

}
