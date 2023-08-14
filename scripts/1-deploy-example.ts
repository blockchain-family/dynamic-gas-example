import {WalletTypes, toNano} from "locklift";

const isValidEverAddress = (address: any) =>
    /^(?:-1|0):[0-9a-fA-F]{64}$/.test(address);

async function main() {

    const signer = (await locklift.keystore.getSigner("0"))!;
    const { account } = await locklift.factory.accounts.addNewAccount({
        type: WalletTypes.EverWallet,
        value: toNano(5),
        publicKey: signer.publicKey,
    });

    console.log(`Account owner: ${account.address}`);
    const fooCode = await locklift.factory.getContractArtifacts("Foo");
    const {contract: exampleBar,} = await locklift.factory.deployContract({
        contract: "Bar",
        publicKey: signer.publicKey,
        initParams: {
            _nonce: locklift.utils.getRandomNonce(),
        },
        constructorParams: {
            _owner: account.address,
            _fooContractCode: fooCode.code,
        },
        value: toNano(5),
    });

    console.log(`Bar contract: ${exampleBar.address}`);

}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });