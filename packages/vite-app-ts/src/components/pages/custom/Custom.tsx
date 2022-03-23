/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { formatEther, parseEther } from '@ethersproject/units';
import { Button, Divider, Form, Input, Checkbox, Upload, message, Table, List, Card, Tag, Space } from 'antd';
import { AddressInput } from 'eth-components/ant';

import { Address, Balance } from 'eth-components/ant';
import { InboxOutlined } from '@ant-design/icons';
import { transactor } from 'eth-components/functions';
import { EthComponentsSettingsContext } from 'eth-components/models';
import { useContractReader, useEventListener, useGasPrice } from 'eth-hooks';
import { useEthersContext } from 'eth-hooks/context';
import { BigNumber, ethers } from 'ethers';
import React, { useState, useEffect, FC, useContext, ReactNode } from 'react';
import { useAppContracts } from '~~/config/contractContext';
import { create, urlSource } from 'ipfs-http-client'
import axios from 'axios'

// @ts-ignore
import { API_URL } from '~~/models/constants/constants';

console.log("api_url", API_URL)


import pinataSDK from '@pinata/sdk'
import { Token } from 'graphql';

const pinata = pinataSDK('715f1502776807f8f393', '179490478f6a28c034f93c502e1a146b23807bef1d11e1f08206619cc85f38e1');

// TODO: import items from new contract?
// import { SetPurposeEvent } from '~~/generated/contract-types/YourContract';

export interface IExampleUIProps {
    mainnetProvider: StaticJsonRpcProvider | undefined;
    yourCurrentBalance: BigNumber | undefined;
    price: number;
}

// TODO: add this to .env + constants file
const rareBackendBaseURL = 'http://localhost:3003/api';
// const rareBackendBaseURL = 'back.rare.store/api';

const server = axios.create({
    // baseURL: 'http://localhost:3000/api',
    baseURL: rareBackendBaseURL,
})


// ipfs
const ipfs = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
});


const getFromIPFS = async (cid: string) => {
    const decoder = new TextDecoder();
    let content = '';
    for await (const chunk of ipfs.cat(cid)) {
        content += decoder.decode(chunk);
    }
    return content;
};



export const Custom: FC<IExampleUIProps> = (props) => {
    const [newPurpose, setNewPurpose] = useState('loading...');
    const ethersContext = useEthersContext();

    const yourContract = useAppContracts('YourContract', ethersContext.chainId);
    // const [purpose] = useContractReader(yourContract, yourContract?.purpose, [], yourContract?.filters.SetPurpose());

    // const [setPurposeEvents] = useEventListener<SetPurposeEvent>(yourContract, yourContract?.filters.SetPurpose(), 1);

    const signer = ethersContext.signer;
    const address = ethersContext.account ?? '';

    const ethComponentsSettings = useContext(EthComponentsSettingsContext);
    const [gasPrice] = useGasPrice(ethersContext.chainId, 'fast');
    const tx = transactor(ethComponentsSettings, ethersContext?.signer, gasPrice);

    const { mainnetProvider, yourCurrentBalance, price } = props;

    const [fileUrl, updateFileUrl] = useState(``)
    const [contentPath, setContentPath] = useState(``)

    const [yourCollectibles, setYourCollectibles] = useState<any>([]);

    const [tokenBalance, setTokenBalance] = useState<any>(0)

    const [transferToAddresses, setTransferToAddresses] = useState<{ [key: string]: string }>({});

    const { Dragger } = Upload;
    const { Column, ColumnGroup } = Table;

    // Uploading file component 
    const [uploading, setUploading] = useState<boolean>(false);
    const [file, setFile] = useState<any>();
    const [csvArray, setCsvArray] = useState<any>([])


    useEffect(() => {
        // token balance updated
        const updateTokenBalance = async () => {
            const tokenBalanceHex = await yourContract?.balanceOf(address)
            const tokenBalance = tokenBalanceHex?.toNumber()
            console.log("token balance updated: ", tokenBalance)
            setTokenBalance(tokenBalance)
        }

        updateTokenBalance()

    }, [yourContract?.balanceOf(address)])

    // new

    useEffect(() => {
        console.log(tokenBalance)
        const updateYourCollectibles = async () => {
            const collectibleUpdate: any[] = [];

            if (!tokenBalance) {
                setYourCollectibles(collectibleUpdate)
                return;
            }
            //   const yourBalance = tokenBalance[0]?.toNumber() ?? 0;
            const yourBalance = tokenBalance
            for (let tokenIndex = 0; tokenIndex < yourBalance; tokenIndex++) {
                try {
                    console.log('Getting token index', tokenIndex);
                    //   const tokenId = await YourCollectibleRead.tokenOfOwnerByIndex(ethersContext.account ?? '', tokenIndex);
                    const tokenId = await yourContract?.tokenOfOwnerByIndex(address ?? '', tokenIndex) || -1

                    console.log('tokenId', tokenId);
                    // const tokenURI = await YourCollectibleRead.tokenURI(tokenId);

                    const tokenURI = await yourContract?.tokenURI(tokenId)

                    console.log(" ")
                    console.log(" ")
                    console.log(" ")
                    console.log("tokenURi", tokenURI)
                    console.log(" ")
                    console.log(" ")
                    console.log(" ")

                    // const ipfsHash = tokenURI?.replace('https://gateway.pinata.cloud/ipfs/', '') || ""

                    // const content = await getFromIPFS(ipfsHash);

                    // console.log("content: ", content)

                    try {
                        // const ipfsObject = JSON.parse(content);
                        //console.log('ipfsObject', ipfsObject);
                        // todo only push if there's content

                        collectibleUpdate.push({ id: tokenId, uri: tokenURI, owner: address });
                    } catch (e) {
                        console.log(e);
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            setYourCollectibles(collectibleUpdate);
        };
        updateYourCollectibles();
    }, [address, tokenBalance]);

    // end new
    const uploadProps = {
        name: 'file',
        // action: '',
        headers: {
            authorization: 'authorization-text',
        },
        async onChange(info: { file: { status: string; name: any; }; fileList: any; }) {
            console.log("on change called for file upload", info)
            let fileList = info.fileList
            let fileObj = fileList[0]
            let realFile = fileObj.originFileObj

            const added = await ipfs.add(realFile)

            console.log("added:", added)
            console.log("aded path: ", added.path)

            // const aJsonString = {
            //     "name": "No time to explain!",
            //     "description": "I said there was no time to explain, and I stand by that.",
            //     // "image": `ipfs://${added.path}`
            //     "image": `ipfs://what`
            // }

            // const cid = await ipfs.add(
            //     { path: 'metadata.json', content: aJsonString.toString() },
            //     { wrapWithDirectory: true }
            // )

            // console.log("cid of meta data", cid)

            // return

            if (added.path) {
                message.success(`${info.file.name} file uploaded successfully`);
                // const url = `https://ipfs.infura.io/ipfs/${added.path}`
                const url = `https://gateway.pinata.cloud/ipfs/${added.path}`
                updateFileUrl(url)
                setContentPath(added.path)
            } else {
                message.error(`${info.file.name} file upload failed.`);
            }

        },
    };

    // const dummyRequest = (file: any, onSuccess: any) => {
    const dummyRequest = ({ file, onSuccess }: any) => {
        console.log("dummyreq")
        setTimeout(() => {
            onSuccess("ok")
        }, 0)
    }

    const beforeUpload = (file: any, fileList: any) => {
        // Access file content here and do something with it
        // console.log(file)

        // Prevent upload
        return false
    }

    // form functions
    const onFinish = async (values: any) => {
        // get type
        console.log('onfinish', values);

        // get user wallet addy
        const email = values.user.email
        values.user.address = address
        console.log("type of values:", typeof values)
        // make a call to the rare backend

        // anyone can actually post to users and do what they want
        const response = await server.post('/users', { email: email })
        console.log("response: ", response)

        if (response.statusText === 'Created') {
            // loginUser()
        }
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
        console.log("type of errinfo:", typeof errorInfo)
    };

    const validateMessages: object = {
        required: '${label} is required!',
        types: {
            email: '${label} is not a valid email!',
            number: '${label} is not a valid number!',
        },
        number: {
            range: '${label} must be between ${min} and ${max}',
        },
    };

    const layout = {
        labelCol: {
            span: 8,
        },
        wrapperCol: {
            span: 16,
        },
    };


    const updateLog = (update: any) => {
        console.log(' 🍾 Transaction ' + update.hash + ' finished!');
        console.log(
            ' ⛽️ ' +
            update.gasUsed +
            '/' +
            (update.gasLimit || update.gas) +
            ' @ ' +
            parseFloat(update.gasPrice) / 1000000000 +
            ' gwei'
        );
    }


    // NFT contract functions
    const mintNFT = async (uri: any) => {
        console.log("mint nft called")
        const result = tx?.(yourContract?.safeMint(address, uri), (update: any) => {
            console.log('📡 Transaction Update:', update);
            if (update && (update.status === 'confirmed' || update.status === 1)) {
                updateLog(update)
            }
        });
        console.log('awaiting metamask/web3 confirm result...', result);
        console.log(await result);

        return
    }

    const transferToAddress = async (id: number) => {
        console.log("transfer to address called")

        const result = tx?.(yourContract?.transferFrom(address, transferToAddresses[id], id), (update: any) => {
            console.log('📡 Transaction Update:', update);
            if (update && (update.status === 'confirmed' || update.status === 1)) {
                updateLog(update)
            }
        })
        console.log('awaiting metamask/web3 confirm result...', result);
        console.log(await result);
    }


    // nft contract functions from new scaffold eth items

    const onRemoveFile = (file: any) => {
        setFile(null);
        setCsvArray([]);
    }

    const processCSV = (str: string, delim = ',') => {
        let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l
        for (l of str) {
            if ('"' === l) {
                if (s && l === p) row[i] += l
                s = !s
            } else if (',' === l && s) l = row[++i] = ''
            else if ('\n' === l && s) {
                if ('\r' === p) row[i] = row[i].slice(0, -1)
                row = ret[++r] = [l = '']; i = 0
            } else row[i] += l
            p = l
        }

        return ret
    }

    const onBeforeUpload = (file: any) => {
        console.log(file);
        setFile(file);
        const reader = new FileReader();
        reader.onload = function (e) {
            console.log(e)
            if (!e.target!.result) return;
            const text = e.target!.result;
            let data_arr = text.toString().replace(/\r\n/g, '\n').split('\n')
            const image_url_prefix = 'https://rare-collectibles.nyc3.digitaloceanspaces.com';
            console.log(text);
            let row_arr_counter = 0
            let result_arr = [] as any;
            for (let data_row of data_arr) {
                row_arr_counter++;
                if (row_arr_counter > 2) {
                    let row_split = processCSV(data_row.toString());
                    let row = {} as any;
                    row.key = row_arr_counter - 2;
                    row.nft_obj_name = row_split[0][0]
                    row.nft_obj_desc = row_split[0][1]
                    row.nft_obj_image_name = row_split[0][2]
                    row.nft_obj_start_time_at = row_split[0][3]
                    row.nft_obj_end_time_at = row_split[0][4]
                    row.user_obj_email = row_split[0][5]
                    row.user_obj_username = row_split[0][6]
                    row.user_obj_full_name = row_split[0][7]
                    row.user_obj_image_name = row_split[0][8]
                    row.user_obj_eth_address = row_split[0][9]
                    row.collection_obj_name = row_split[0][10]
                    row.collection_obj_desc = row_split[0][11]
                    row.collection_obj_image_name = row_split[0][12]
                    row.collectible_obj_name = row_split[0][13]
                    row.collectible_obj_desc = row_split[0][14]
                    row.collectible_obj_image_name = row_split[0][15]
                    row.collectible_obj_eth_contract_address = row_split[0][16]
                    row.collectible_obj_min_price_in_eth = row_split[0][17]
                    row.collectible_obj_min_price_in_wei = ethers.utils.parseUnits(
                        // convert ether value to wei, and save as string representation
                        row_split[0][17], "ether"
                    ).toString()
                    row.collectible_type_obj_name = row_split[0][18]
                    row.collectible_type_obj_desc = row_split[0][19]
                    row.collectible_obj_artist_percentage = row_split[0][20]
                    row.the_image_url = image_url_prefix + '/collectibles_images/' + row.collectible_obj_image_name
                    row.isMinted = false
                    row.isMinting = false
                    result_arr.push(row);
                }
            }
            setCsvArray(result_arr);
        }
        reader.readAsText(file);
    }

    const updateToDB = async (nftInfo: any, txhash: string) => {
        try {

            console.log(" ")
            console.log(" ")
            console.log(" ")
            console.log("token balance", tokenBalance)
            console.log(" ")
            console.log(" ")
            console.log(" ")
            // let currentBal = tokenBalance ? tokenBalance[0].toNumber() : 0;
            let currentBal = tokenBalance

            const tokenId = await yourContract?.tokenOfOwnerByIndex(ethersContext.account ?? '', currentBal - 1);

            // testing

            // TODO: add this to the backend
            const logToDb = await axios.post(`${rareBackendBaseURL}/mint_nft`, {
                nft: nftInfo,
                transactionHash: txhash,
                tokenId: tokenId?.toNumber()
            })

            return logToDb;
        }
        catch (error: any) {
            console.error("UPLOAD TO DB: ", error.message)
            return false
        }
    }

    const resetMintItem = async (nftMeta: any) => {
        const updateArr = [...csvArray];
        let index = updateArr.findIndex(obj => nftMeta === obj);
        updateArr[index].isMinted = false
        setCsvArray(updateArr);
    }


    const mintItem = async (nftMeta: any) => {
        // find index in csv array
        const updateArr = [...csvArray];
        let index = updateArr.findIndex(obj => nftMeta === obj);
        if (!tx || !ethersContext.account) return;
        let itemMeta = {
            description: nftMeta.collectible_obj_desc,
            external_url: nftMeta.the_image_url,
            image: nftMeta.the_image_url,
            name: nftMeta.collectible_obj_name,
        }
        const pinataOption = {
            pinataMetadata: {
                name: nftMeta.collectible_obj_name,
            }
        }
        // upload to ipfs
        //const uploaded = await ipfs.add(JSON.stringify(itemMeta));
        const uploaded = await pinata.pinJSONToIPFS(itemMeta, pinataOption)
        console.log(uploaded);
        const path = `https://gateway.pinata.cloud/ipfs/${uploaded.IpfsHash}`
        await tx(yourContract?.safeMint(ethersContext.account, path), async (update) => {
            console.log('📡 Transaction Update:', update);
            if (update && (update.status === 'confirmed' || update.status === 1)) {
                console.log(' 🍾 Transaction ' + update.hash + ' finished!');
                console.log(
                    ' ⛽️ ' +
                    update.gasUsed +
                    '/' +
                    (update.gasLimit || update.gas) +
                    ' @ ' +
                    parseFloat(update.gasPrice) / 1000000000 +
                    ' gwei'
                );
                const transactionHash = update.hash
                console.log('after: ' + tokenBalance)
                let res = await updateToDB(nftMeta, transactionHash)
                if (res) {
                    updateArr[index].isMinted = true
                    setCsvArray(updateArr);
                }
            }
        });

    };

    // rare backend functions

    const importerScript = async () => {
        let token = "token"
        console.log("importer script")

        // this is insecure we should have a separate front end for this
        const response = await server.get('/scripts/importer', {
            headers: {
                'Authorization': `1234`
            }
        })
        console.log("response: ", response)
    }

    const mintingScript = async () => {
        console.log("minting script")

        // testing scripts endpoint
        let token = "1234"

        const response = await server.get('/scripts/minter', {
            headers: {
                'Authorization': `1234`
            }
        })
        console.log("response: ", response)
    }

    const transactionScript = async () => {
        console.log("transaction Script")

        const response = await server.get('/scripts/tx', {
            headers: {
                'Authorization': `1234`
            }
        })
        console.log("response: ", response)
    }

    return (
        <div>
            {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
            {/* <div style={{ border: '1px solid #cccccc', padding: 16, width: 400, margin: 'auto', marginTop: 64 }}> */}
            <div style={{ border: '1px solid #cccccc', padding: 16, width: 600, margin: 'auto', marginTop: 64 }}>
                <h2>Custom tab</h2>
                <Divider />
                <h3>Create an account</h3>

                {/* Your Address:
                <Address address={address} ensProvider={mainnetProvider} fontSize={16} /> */}

                {/* maybe this is when the approvals would happen etc */}
                <Form
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    validateMessages={validateMessages}
                >

                    <Form.Item
                        name={['user', 'email']}
                        label="Email"
                        rules={[
                            {
                                type: 'email',
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="Address Confirmation"
                        valuePropName="checked"
                        rules={[
                            {
                                required: true,

                            }
                        ]}
                    >
                        <Checkbox>Confirm that you are signing up with address: {address}</Checkbox>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Submit
                        </Button>
                    </Form.Item>

                </Form>


                <Divider />
                {/* <h4>purpose: {purpose}</h4> */}
                <h3>Ipfs Image Upload</h3>

                <Upload {...uploadProps} beforeUpload={beforeUpload} customRequest={(info) => {
                    // console.log("dummyreq", info)
                    let file = info.file
                    let onSuccess = info.onSuccess

                    const requestObj = { file, onSuccess }
                    dummyRequest(requestObj)
                }}>
                    <Button>Click to Upload</Button>
                </Upload>


                {fileUrl && (
                    <>
                        <div>
                            FileUrl :{" "}
                        </div>

                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                            {fileUrl}
                        </a>

                        <h3>Mint this NFT</h3>

                        <Button onClick={() => {
                            // mintNFT(contentPath)
                            // TODO: update this so that we store the content id and not the gateway url
                            mintNFT(fileUrl)
                        }}>Mint Nft</Button>
                    </>
                )}

                <Divider />

                <h2>Your Colletibles</h2>
                <h3>Your token balance: {tokenBalance}</h3>
                {/* <div style={{ width: 640, margin: 'auto', marginTop: 32, paddingBottom: 32 }}> */}
                <div style={{ width: '100%', margin: 'auto', marginTop: 32, paddingBottom: 32 }}>
                    <List
                        bordered
                        dataSource={yourCollectibles}
                        renderItem={(item: any) => {
                            const id = item.id.toNumber();
                            return (
                                <List.Item key={id + '_' + item.uri + '_' + item.owner}>
                                    <Card
                                        title={
                                            <div>
                                                {/* <span style={{ fontSize: 16, marginRight: 8 }}>#{id}</span> {item.name} */}
                                                <span style={{ fontSize: 16, marginRight: 8 }}>#{id}</span> item name
                                            </div>
                                        }>
                                        <div>
                                            {/* <img src={item.image} style={{ maxWidth: 150 }} /> */}
                                            <img src={item.uri} style={{ maxWidth: 150 }} />
                                        </div>
                                        {/* <div style={{ maxWidth: 150 }}>{item.description}</div> */}
                                    </Card>

                                    <div>
                                        owner:{' '}
                                        <Address
                                            address={item.owner}
                                            ensProvider={mainnetProvider}
                                            // blockExplorer={blockExplorer}
                                            fontSize={16}
                                        />
                                        <AddressInput
                                            ensProvider={mainnetProvider}
                                            placeholder="transfer to address"
                                            address={transferToAddresses[id]}
                                            onChange={(newValue) => {
                                                setTransferToAddresses({ ...transferToAddresses, ...{ [id]: newValue } });
                                            }}
                                        />
                                        <Button
                                            onClick={() => {
                                                if (!ethersContext.account || !tx) return;
                                                transferToAddress(id)
                                                // tx(yourContract.transferFrom(ethersContext.account, transferToAddresses[id], id));
                                            }}>
                                            Transfer
                                        </Button>
                                    </div>
                                </List.Item>
                            );
                        }}
                    />
                </div>

                <Divider />

                <h3>Upload csv</h3>
                <Dragger
                    name='file'
                    onRemove={file => onRemoveFile(file)}
                    beforeUpload={file => onBeforeUpload(file)}
                    accept={'.csv'}
                    customRequest={dummyRequest}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint">
                        Support for a single upload.
                    </p>
                </Dragger>
                <Divider />


                <Table dataSource={csvArray} bordered size="small" scroll={{ x: 1300 }}>
                    <ColumnGroup title="NFT DROP">
                        <Column title="Name" dataIndex="nft_obj_name" key="key" />
                        <Column title="Description" dataIndex="nft_obj_desc" key="key" ellipsis={true} />
                        <Column title="Image File Name" dataIndex="nft_obj_image_name" key="key" />
                        <Column title="Start Time" dataIndex="nft_obj_start_time_at" key="key" />
                        <Column title="End Time" dataIndex="nft_obj_end_time_at" key="key" />
                    </ColumnGroup>
                    <ColumnGroup title="ARTIST">
                        <Column title="Email" dataIndex="user_obj_email" key="key" />
                        <Column title="Username" dataIndex="user_obj_username" key="key" />
                        <Column title="Full Name" dataIndex="user_obj_full_name" key="key" />
                        <Column title="Image Filename" dataIndex="user_obj_image_name" key="key" />
                        <Column title="ETH address" dataIndex="user_obj_eth_address" key="key" ellipsis={true} />
                    </ColumnGroup>
                    <ColumnGroup title="COLLECTION">
                        <Column title="Name" dataIndex="collection_obj_name" key="key" />
                        <Column title="Description" dataIndex="collection_obj_desc" key="key" ellipsis={true} />
                        <Column title="Image Filename" dataIndex="collection_obj_image_name" key="key" />
                    </ColumnGroup>
                    <ColumnGroup title="COLLECTIBLES">
                        <Column title="Name" dataIndex="collectible_obj_name" key="key" />
                        <Column title="Description" dataIndex="collectible_obj_desc" key="key" ellipsis={true} />
                        <Column title="Image Filename" dataIndex="collectible_obj_image_name" key="key" />
                        <Column title="ETH contract address" dataIndex="collectible_obj_eth_contract_address" key="key" ellipsis={true} />
                        <Column title="Minimum Price in ETH" dataIndex="collectible_obj_min_price_in_eth" key="key" />
                        <Column title="Collectible Type name" dataIndex="collectible_type_obj_name" key="key" />
                        <Column title="Collectible Type description" dataIndex="collectible_type_obj_desc" key="key" />
                        <Column title="Artist Percentage" dataIndex="collectible_obj_artist_percentage" key="key" />
                    </ColumnGroup>
                    <Column
                        title="Action"
                        key="key"
                        render={(text, record: any) => (
                            record.isMinted ?
                                <Space size="middle" onClick={() => resetMintItem(record)}>
                                    <a style={{ color: 'green' }}>Minted</a>
                                </Space>
                                : <Space size="middle" onClick={() => mintItem(record)}>
                                    <a>Mint</a>
                                </Space>
                        )}
                    />
                </Table>

                <Divider />

                <h3>Call importer script</h3>
                <Button onClick={() => {
                    importerScript()
                }}>Go!</Button>
                <Divider />

                <h3>Call Minting script</h3>
                <Button onClick={() => {
                    mintingScript()
                }}>Go!</Button>

                <Divider />
                <h3>Call transaction script</h3>
                <Button onClick={() => {
                    transactionScript()
                }}>Go!</Button>




                {/* use formatEther to display a BigNumber: */}
                <h2>Your Balance: {yourCurrentBalance ? formatEther(yourCurrentBalance) : '...'}</h2>
                <div>OR</div>
                <Balance address={address} price={price} />
                <Divider />
                {/* use formatEther to display a BigNumber: */}
                Your Contract Address:
                <Address address={yourContract?.address} ensProvider={mainnetProvider} fontSize={16} />
                <Divider />


            </div>

            {/*
        📑 Maybe display a list of events?
          (uncomment the event and emit line in YourContract.sol! )
      */}
            <div style={{ width: 600, margin: 'auto', marginTop: 32, paddingBottom: 32 }}>
                <h2>Events:</h2>
                {/* <List
                    bordered
                    dataSource={setPurposeEvents}
                    renderItem={(item: SetPurposeEvent): ReactNode => {
                        return (
                            <List.Item key={item.blockNumber + '_' + item.address}>
                                <Address address={item.address} ensProvider={mainnetProvider} fontSize={16} /> {' - '}
                                {item.args.purpose}
                            </List.Item>
                        );
                    }}
                /> */}
            </div>
        </div>
    );
};