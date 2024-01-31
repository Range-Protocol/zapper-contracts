//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";

interface IZapper {
   
    function zapInBase(bytes calldata data) external payable;
    
    function zapInBaseIzumi(bytes calldata data) external payable;
 
    function zapIn(bytes calldata data, uint256 initialAmount) external;

    function zapInIzumi(bytes calldata data, uint256 initialAmount) external;

    function zapOutBase(bytes memory data) external;

    function zapOut(bytes memory data) external;
}
