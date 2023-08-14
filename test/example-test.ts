import {Contract, getRandomNonce, Signer, toNano, WalletTypes, zeroAddress} from "locklift";
import {Account} from "everscale-standalone-client";
import {expect} from "chai";
import {GasValuesAbi} from "../build/factorySource";
import { calcValue } from "../scripts/utils";

let signer: Signer;
let owner:Account;
let gasValues: Contract<GasValuesAbi>;

const fooCode = locklift.factory.getContractArtifacts("Foo");

describe("Test example", async function (){
    before(async() => {
        signer = (await locklift.keystore.getSigner("0"))!;

        const {account} = await locklift.factory.accounts.addNewAccount({
            type: WalletTypes.EverWallet,
            value: toNano(5),
            publicKey: signer.publicKey,
        });

        owner = account;

        const {contract: gasValue,} = await locklift.factory.deployContract({
            contract: "GasValues",
            publicKey: signer.publicKey,
            initParams: {
                _nonce: getRandomNonce()
            },
            constructorParams: {
                owner_: owner.address
            },
            value: toNano(2)
        });

        gasValues = gasValue

    });

    it("Deploy Bar contract and check Foo contract", async function(){
        const {contract: barContract,} = await locklift.factory.deployContract({
            contract: "Bar",
            publicKey: signer.publicKey,
            initParams: {
                _nonce: locklift.utils.getRandomNonce(),
            },
            constructorParams: {
                _owner: owner.address,
                _fooContractCode: fooCode.code,
            },
            value: toNano(2),
        });

        expect(await locklift.provider.getBalance(barContract.address).then(balance => Number(balance))).to.be.above(0, 'Balance should be > 0');
        expect((await barContract.methods.getDetails({answerId: 0}).call()).value0.owner.toString()).to.be.equal(owner.address.toString(), 'Wrong owner address Bar contract');
        expect((await barContract.methods.getDetails({answerId: 0}).call()).value0.fooContract.toString()).to.be.equal(zeroAddress.toString(), 'Wrong address foo contract, should be 0');

        const gasDeployFoo = await gasValues.methods
            .getDeployFooValue({})
            .call({})
            .then(r => r.value0);

        await barContract.methods.deployFooContract().send({amount: calcValue(gasDeployFoo), from: owner.address});
        const fooContract = await locklift.factory.getDeployedContract("Foo", ((await barContract.methods.getDetails({answerId: 0}).call()).value0.fooContract));
        expect(fooContract.address.toString()).not.be.equal(zeroAddress.toString(), 'Wrong address foo contract, not should be 0')

        expect((await fooContract.methods.getActive({answerId: 0}).call()).value0.valueOf()).to.be.equal(false, 'Active shuold be false');

        const gasSetActive = await gasValues.methods
            .getSetActiveFooValue({})
            .call({})
            .then(r => r.value0);

        await barContract.methods.setActiveFoo({_active: true}).send({
            amount: calcValue(gasSetActive), from: owner.address
        });

        expect((await fooContract.methods.getActive({answerId: 0}).call()).value0).to.be.equal(true,'Active shuold be true');
    });
});