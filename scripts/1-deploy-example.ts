import {WalletTypes} from "locklift";
import prompts from 'prompts';

const isValidEverAddress = (address: any) =>
    /^(?:-1|0):[0-9a-fA-F]{64}$/.test(address);

async function main() {
    // const response = await prompts([
    //     {
    //         type: 'text',
    //         name: 'owner',
    //         message: 'Bar owner',
    //         validate: (value: any) =>
    //             isValidEverAddress(value) || value === ''
    //                 ? true
    //                 : 'Invalid Everscale address',
    //     },
    // ]);

    const signer = (await locklift.keystore.getSigner("0"))!;
    const { account } = await locklift.factory.accounts.addNewAccount({
        type: WalletTypes.EverWallet,
        value: locklift.utils.toNano(5),
        publicKey: signer.publicKey,
    });

    console.log(`Account owner: ${account.address}`);
    // const ownerBar = response.owner || account;
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
        value: locklift.utils.toNano(5),
    });

    console.log(`Bar contract: ${exampleBar.address}`);

}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });