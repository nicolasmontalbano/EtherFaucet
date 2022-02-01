const Migrations = artifacts.require("Faucet");

module.exports = function (deployer){
    deployer.deploy(Migrations);
}