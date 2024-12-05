import { NextResponse } from 'next/server';
import * as algosdk from 'algosdk';
import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from 'dotenv';

// .env.local 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// 고정된 계정 주소 설정
const FIXED_ACCOUNT_ADDRESS = '5D5KQVYQFCWOIMOMNLRTSGNUTC4JMAP4TZAKV5WGNWX2BEQ3NWNVIIJ7C4';

// .env 파일에서 니모닉 구문 로드
async function loadPassphraseFromEnv() {
  console.log('니모닉 구문 로드 시도...');
  try {
    const passphrase = process.env.ALGORAND_PASSPHRASE;
    
    if (!passphrase) {
      throw new Error('환경 변수에 ALGORAND_PASSPHRASE가 설정되어 있지 않습니다.');
    }
    
    // 로드된 니모닉으로 생성되는 주소가 고정 주소와 일치하는지 확인
    const account = algosdk.mnemonicToSecretKey(passphrase);
    if (account.addr !== FIXED_ACCOUNT_ADDRESS) {
      throw new Error('환경 변수의 니모닉이 설정된 주소와 일치하지 않습니다.');
    }
    
    console.log('기존 니모닉 구문 로드됨');
    return passphrase;
  } catch (error) {
    console.error('니모닉 구문 로드 중 오류:', error);
    throw error;
  }
}

// 메타데이터 해시 생성 함수
function createMetadataHash(metadata: string): Uint8Array {
  const hash = createHash('sha512-256');
  hash.update('arc0003/amj');
  hash.update(metadata);
  return new Uint8Array(hash.digest());
}
export async function POST(request: Request) {
    try {
      console.log('NFT 민팅 시작...');
      const { metadata } = await request.json();
  
      // 1. Algorand 테스트넷 연결
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);
      console.log('Algorand 테스트넷 연결됨');
  
      // 2. 계정 가져오기
      const passphrase = await loadPassphraseFromEnv();
      console.log('사용할 니모닉 구문:', passphrase);
      const account = algosdk.mnemonicToSecretKey(passphrase);
      console.log('계정 주소:', account.addr);
  
      // 3. 메타데이터 해시 생성
      const metadataStr = JSON.stringify(metadata);
      const metadataHash = createMetadataHash(metadataStr);
  
      // 1. 주소 문자열 생성
      const addressStr = account.addr;
      console.log('Encoded address:', addressStr);

      // 2. 트랜잭션 파라미터 가져오기
      const params = await algodClient.getTransactionParams().do();
      console.log('Transaction params from algod:', params);
      
      // 3. 트랜잭션 생성
      const assetURL = metadata.image.startsWith('ipfs://') ? metadata.image : `ipfs://${metadata.image}`;
      const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: addressStr,
        total: 1,
        decimals: 0,
        defaultFrozen: false,
        manager: addressStr,
        reserve: addressStr,
        freeze: addressStr,
        clawback: addressStr,
        unitName: metadata.unitName || 'NFT',
        assetName: metadata.name || 'NFT Asset',
        assetURL: assetURL,
        assetMetadataHash: metadataHash,
        note: new Uint8Array(Buffer.from(metadataStr)),
        suggestedParams: {
          ...params,
          fee: 1000,
          firstRound: params.firstRound,
          lastRound: params.lastRound,
        },
      });

      console.log('Transaction created successfully');
      
      // 4. 트랜잭션 서명
      const signedTxn = txn.signTxn(account.sk);
      console.log('Transaction signed');
  
      // 5. 트랜잭션 전송
      let txId;
      try {
        const sendTxnResponse = await algodClient.sendRawTransaction(signedTxn).do();
        txId = sendTxnResponse.txId;
        console.log('트랜잭션 전송됨, ID:', txId);
      } catch (error) {
        console.error('트랜잭션 전송 중 오류:', error);
        throw new Error('트랜잭션 전송 실패');
      }

      // 6. 트랜잭션 확인 대기
      try {
        const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 10);
        const assetId = confirmedTxn['asset-index'];
        console.log('NFT 생성 완료, Asset ID:', assetId);

        return NextResponse.json({ 
          success: true, 
          assetId: Number(assetId),
          accountAddress: account.addr 
        });
      } catch (error) {
        console.error('트랜잭션 확인 중 오류:', error);
        throw new Error('트랜잭션 확인 실패');
      }
  
    } catch (error: any) {
      console.error('Minting error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'NFT 민팅 중 오류가 발생했습니다.' 
      }, { 
        status: 500 
      });
    }
  }